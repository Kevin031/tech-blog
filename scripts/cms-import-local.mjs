import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cmsRoot = path.resolve(root, '../peanut-cms')
const stageRoot = path.join(root, '.cms-import')
const reportRoot = path.join(root, 'reports')
const databasePath = path.resolve(process.env.CMS_LOCAL_DB ?? path.join(cmsRoot, 'apps/api/data/peanut-cms.sqlite'))
const publicRoot = path.resolve(process.env.CMS_BLOG_PUBLIC_DIR ?? path.join(cmsRoot, 'apps/blog/public'))
const apply = process.argv.includes('--apply')
const unknown = process.argv.slice(2).filter((argument) => argument !== '--apply')
if (unknown.length) throw new Error(`不支持的参数：${unknown.join(' ')}`)

function articleId(sourcePath) {
  return `tech-blog-${createHash('sha256').update(sourcePath).digest('hex').slice(0, 24)}`
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function run(name, env = process.env) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', `${name}.mjs`)], {
    cwd: root,
    env,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.error || result.status !== 0) {
    process.stderr.write(result.stderr || String(result.error || `${name} 执行失败`))
    process.exit(result.status || 1)
  }
}

function tagNames(sourcePath) {
  const section = sourcePath.split('/')[1]
  return section === 'about' || section === 'posts' ? ['随笔'] : ['前端']
}

const preflight = JSON.parse(readFileSync(path.join(reportRoot, 'cms-import-preflight.json'), 'utf8'))
const assets = JSON.parse(readFileSync(path.join(stageRoot, 'assets.json'), 'utf8')).assets
const assetUrls = {}
for (const asset of assets) {
  const buffer = readFileSync(path.join(root, asset.path))
  if (sha256(buffer) !== asset.sha256) throw new Error(`图片已变化，请重新运行 pnpm cms:migrate：${asset.path}`)
  assetUrls[asset.sha256] = `/tech-blog-assets/${asset.sha256}${path.extname(asset.path).toLowerCase()}`
}
const articleUrls = Object.fromEntries(preflight.articles.map((article) => [
  article.path, `/articles/${articleId(article.path)}`,
]))
mkdirSync(stageRoot, { recursive: true })
const localAssetMap = path.join(stageRoot, 'local-asset-urls.json')
const localArticleMap = path.join(stageRoot, 'local-article-urls.json')
writeFileSync(localAssetMap, `${JSON.stringify(assetUrls, null, 2)}\n`)
writeFileSync(localArticleMap, `${JSON.stringify(articleUrls, null, 2)}\n`)

run('cms-prepare', {
  ...process.env,
  CMS_ASSET_URLS_FILE: localAssetMap,
  CMS_ARTICLE_URLS_FILE: localArticleMap,
  CMS_ALLOW_LOCAL_URLS: '1',
})
const prepared = JSON.parse(readFileSync(path.join(reportRoot, 'cms-import-prepared.json'), 'utf8'))
const drafts = JSON.parse(readFileSync(path.join(stageRoot, 'drafts.json'), 'utf8')).drafts
if (prepared.summary.readyForDraft !== preflight.articles.length || drafts.length !== preflight.articles.length) {
  throw new Error(`本地草稿仍有未处理文章：${prepared.summary.manualWork} 篇`)
}
copyFileSync(path.join(stageRoot, 'drafts.json'), path.join(stageRoot, 'local-drafts.json'))
copyFileSync(path.join(reportRoot, 'cms-import-prepared.json'), path.join(reportRoot, 'cms-local-prepared.json'))
copyFileSync(path.join(reportRoot, 'cms-import-prepared.md'), path.join(reportRoot, 'cms-local-prepared.md'))
run('cms-prepare')

if (!existsSync(databasePath)) throw new Error(`本地 CMS 数据库不存在：${databasePath}`)
const database = new DatabaseSync(databasePath, { readOnly: !apply })
database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;')
const existingTags = database.prepare('SELECT id, name FROM tags').all()
const tagIds = Object.fromEntries(existingTags.map((tag) => [tag.name, tag.id]))
for (const name of ['前端', '随笔']) {
  if (!tagIds[name]) throw new Error(`本地 CMS 缺少已有分类标签：${name}`)
}
const testTagId = tagIds['测试数据']
const existingTitle = database.prepare('SELECT id, status FROM articles WHERE title = ?')
for (const draft of drafts) {
  const conflict = existingTitle.get(draft.input.title)
  if (conflict && conflict.id !== articleId(draft.sourcePath)) {
    throw new Error(`本地 CMS 已有同名文章，请先核对：${draft.input.title}`)
  }
}

if (!apply) {
  const result = {
    mode: 'preview',
    databasePath,
    articles: drafts.length,
    assets: assets.length,
    tags: ['前端', '随笔'],
    testDataTagApplied: false,
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  database.close()
  process.exit(0)
}

const backupRoot = path.join(stageRoot, 'backups')
mkdirSync(backupRoot, { recursive: true })
const backupPath = path.join(backupRoot, `peanut-cms-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`)
database.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)

const assetTargetRoot = path.join(publicRoot, 'tech-blog-assets')
mkdirSync(assetTargetRoot, { recursive: true })
for (const asset of assets) {
  const target = path.join(publicRoot, assetUrls[asset.sha256].slice(1))
  if (existsSync(target)) {
    if (sha256(readFileSync(target)) !== asset.sha256) throw new Error(`CMS 静态图片与源文件不一致：${target}`)
  } else {
    copyFileSync(path.join(root, asset.path), target)
  }
}

database.exec('BEGIN IMMEDIATE')
const counts = { created: 0, updated: 0, skipped: 0 }
try {
  database.exec(`CREATE TABLE IF NOT EXISTS article_import_sources (
    source_path TEXT PRIMARY KEY,
    article_id TEXT NOT NULL UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
    payload_hash TEXT NOT NULL
  ) STRICT`)
  const selectImport = database.prepare('SELECT article_id, payload_hash FROM article_import_sources WHERE source_path = ?')
  const selectArticle = database.prepare('SELECT * FROM articles WHERE id = ?')
  const selectArticleTags = database.prepare('SELECT tag_id FROM article_tags WHERE article_id = ? ORDER BY position')
  const insertArticle = database.prepare(`INSERT INTO articles (
    id,title,summary,content,cover_image,status,has_draft,created_at,updated_at,published_at,
    published_title,published_summary,published_content,published_cover_image
  ) VALUES (?,?,?,?,?,'draft',1,?,?,NULL,NULL,NULL,NULL,NULL)`)
  const updateArticle = database.prepare(`UPDATE articles SET
    title=?,summary=?,content=?,cover_image=?,updated_at=? WHERE id=?`)
  const deleteTags = database.prepare('DELETE FROM article_tags WHERE article_id = ?')
  const insertTag = database.prepare('INSERT INTO article_tags (article_id,tag_id,position) VALUES (?,?,?)')
  const upsertImport = database.prepare(`INSERT INTO article_import_sources (source_path,article_id,payload_hash)
    VALUES (?,?,?) ON CONFLICT(source_path) DO UPDATE SET payload_hash=excluded.payload_hash`)

  for (const draft of drafts) {
    const id = articleId(draft.sourcePath)
    const tags = tagNames(draft.sourcePath).map((name) => tagIds[name])
    if (testTagId && tags.includes(testTagId)) throw new Error('导入标签包含测试数据')
    const input = { ...draft.input, tagIds: tags }
    const payloadHash = sha256(JSON.stringify(input))
    const imported = selectImport.get(draft.sourcePath)
    const article = selectArticle.get(id)
    if (imported && imported.article_id !== id) throw new Error(`导入映射冲突：${draft.sourcePath}`)
    if (article && !imported) throw new Error(`目标文章 ID 已被占用：${draft.sourcePath}`)
    if (article && article.status !== 'draft') throw new Error(`拒绝覆盖已发布文章：${draft.sourcePath}`)
    if (imported && !article) throw new Error(`已导入文章不存在：${draft.sourcePath}`)
    if (imported && imported.payload_hash === payloadHash) {
      counts.skipped += 1
      continue
    }
    if (article) {
      const current = {
        title: article.title,
        summary: article.summary,
        content: article.content,
        coverImage: article.cover_image,
        tagIds: selectArticleTags.all(id).map((row) => row.tag_id),
      }
      if (sha256(JSON.stringify(current)) !== imported.payload_hash) {
        throw new Error(`CMS 草稿在上次导入后发生变化：${draft.sourcePath}`)
      }
    }
    const now = new Date().toISOString()
    if (article) {
      updateArticle.run(input.title, input.summary, input.content, input.coverImage, now, id)
      deleteTags.run(id)
      counts.updated += 1
    } else {
      insertArticle.run(id, input.title, input.summary, input.content, input.coverImage, now, now)
      counts.created += 1
    }
    tags.forEach((tagId, position) => insertTag.run(id, tagId, position))
    upsertImport.run(draft.sourcePath, id, payloadHash)
  }
  database.exec('COMMIT')
} catch (error) {
  database.exec('ROLLBACK')
  database.close()
  throw error
}

const countImported = database.prepare('SELECT COUNT(*) AS count FROM article_import_sources').get().count
const countTestTagged = testTagId
  ? database.prepare(`SELECT COUNT(*) AS count FROM article_import_sources i
      JOIN article_tags at ON at.article_id = i.article_id WHERE at.tag_id = ?`).get(testTagId).count
  : 0
if (countTestTagged !== 0) throw new Error('核验失败：导入文章带有测试数据标签')
database.close()
const result = { mode: 'apply', ...counts, totalImported: countImported, assets: assets.length, backupPath }
writeFileSync(path.join(stageRoot, 'local-import-result.json'), `${JSON.stringify(result, null, 2)}\n`)
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

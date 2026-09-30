import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stageRoot = path.join(root, '.cms-import')
const stateFile = path.join(stageRoot, 'import-state.json')
const packageFile = path.join(stageRoot, 'drafts.json')
const apply = process.argv.includes('--apply')
const limitIndex = process.argv.indexOf('--limit')
const limit = limitIndex < 0 ? Infinity : Number(process.argv[limitIndex + 1])
if (!Number.isInteger(limit) && limit !== Infinity || limit < 1) throw new Error('--limit 必须是正整数')

const drafts = JSON.parse(readFileSync(packageFile, 'utf8')).drafts
const versionOf = (draft) => draft.preparedHash ?? draft.sourceHash
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { schemaVersion: 1, articles: {} }
if (state.schemaVersion !== 1) throw new Error('不支持的导入状态版本')
const selected = drafts.slice(0, limit)
const summary = {
  selected: selected.length,
  alreadyImported: selected.filter((draft) => state.articles[draft.sourcePath]?.preparedHash === versionOf(draft)).length,
  pending: selected.filter((draft) => state.articles[draft.sourcePath]?.preparedHash !== versionOf(draft)).length,
}

if (!apply) {
  process.stdout.write(`${JSON.stringify({ mode: 'preview', ...summary }, null, 2)}\n`)
  process.exit(0)
}

const sessionCookie = process.env.CMS_SESSION_COOKIE
if (!sessionCookie || /[\r\n;]/.test(sessionCookie)) {
  throw new Error('执行写入需要 CMS_SESSION_COOKIE，值为 peanut_cms_session 的 Cookie 内容')
}
const apiBase = (process.env.CMS_API_BASE ?? 'http://localhost:3001/api').replace(/\/$/, '')
const cookie = `peanut_cms_session=${sessionCookie}`

async function request(route, options = {}) {
  const response = await fetch(`${apiBase}${route}`, {
    ...options,
    headers: { Cookie: cookie, ...options.headers },
  })
  if (!response.ok) throw new Error(`CMS ${options.method ?? 'GET'} ${route} 返回 ${response.status}`)
  return response.json()
}

function saveState() {
  mkdirSync(stageRoot, { recursive: true })
  const temporary = `${stateFile}.tmp`
  writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, stateFile)
}

const { csrfToken } = await request('/auth/me')
if (!csrfToken) throw new Error('CMS 登录会话缺少 CSRF Token')
const existing = await request('/articles')
if (!Array.isArray(existing)) throw new Error('CMS 文章列表格式无效')
const byId = new Map(existing.map((article) => [article.id, article]))
const byTitle = new Map()
for (const article of existing) {
  const sameTitle = byTitle.get(article.title) ?? []
  sameTitle.push(article)
  byTitle.set(article.title, sameTitle)
}

function payloadHash(article) {
  const payload = {
    title: article.title,
    summary: article.summary ?? '',
    content: article.content,
    coverImage: article.coverImage ?? null,
    tagIds: article.tagIds ?? [],
  }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

const counts = { created: 0, updated: 0, adopted: 0, skipped: 0 }
for (const draft of selected) {
  const previous = state.articles[draft.sourcePath]
  if (previous?.preparedHash === versionOf(draft)) {
    counts.skipped += 1
    continue
  }

  let article = previous ? byId.get(previous.id) : null
  if (previous && !article) throw new Error(`已记录的 CMS 文章不存在：${draft.sourcePath}`)
  if (!article) {
    const candidates = byTitle.get(draft.input.title) ?? []
    if (candidates.length > 1 || candidates.some((candidate) => payloadHash(candidate) !== payloadHash(draft.input))) {
      throw new Error(`CMS 已有同名但内容不同的文章，请人工核对：${draft.sourcePath}`)
    }
    if (candidates.length === 1) {
      article = candidates[0]
      counts.adopted += 1
    }
  }

  if (article) {
    if (article.status !== 'draft') throw new Error(`拒绝覆盖已发布文章：${draft.sourcePath}`)
    if (previous && (!previous.payloadHash || payloadHash(article) !== previous.payloadHash)) {
      throw new Error(`CMS 草稿在上次导入后发生变化，请人工核对：${draft.sourcePath}`)
    }
    if (article.content !== draft.input.content || article.title !== draft.input.title ||
        article.summary !== draft.input.summary) {
      article = await request(`/articles/${encodeURIComponent(article.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(draft.input),
      })
      counts.updated += 1
    }
  } else {
    article = await request('/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(draft.input),
    })
    counts.created += 1
  }
  byId.set(article.id, article)
  byTitle.set(article.title, [article])
  state.articles[draft.sourcePath] = {
    id: article.id,
    sourceHash: draft.sourceHash,
    preparedHash: versionOf(draft),
    payloadHash: payloadHash(article),
  }
  saveState()
}

process.stdout.write(`${JSON.stringify({ mode: 'apply', ...summary, ...counts }, null, 2)}\n`)

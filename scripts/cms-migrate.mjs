import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const apply = process.argv.includes('--apply')
const unknown = process.argv.slice(2).filter((argument) => argument !== '--apply')
if (unknown.length) throw new Error(`不支持的参数：${unknown.join(' ')}`)

function run(name, args = []) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', `${name}.mjs`), ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.error || result.status !== 0) {
    process.stderr.write(result.stderr || String(result.error || `${name} 执行失败`))
    process.exit(result.status || 1)
  }
  return result.stdout.trim()
}

function preparedSummary() {
  return JSON.parse(readFileSync(path.join(root, 'reports', 'cms-import-prepared.json'), 'utf8')).summary
}

run('cms-preflight')
run('cms-prepare')

if (!apply) {
  run('cms-preview')
  const images = JSON.parse(run('cms-upload-assets'))
  const articles = JSON.parse(run('cms-import'))
  const prepared = preparedSummary()
  process.stdout.write(`本地生成完成：${prepared.total} 篇选中，${prepared.readyForDraft} 篇草稿可导入，${prepared.manualWork} 篇待处理；图片待上传 ${images.pending} 张，草稿待导入 ${articles.pending} 篇。\n`)
  process.stdout.write(`预览：${path.join(root, '.cms-import', 'previews', 'index.html')}\n`)
  process.stdout.write('未上传图片、未写入 CMS、未发布文章。\n')
  process.exit(0)
}

const sessionCookie = process.env.CMS_SESSION_COOKIE
if (!sessionCookie || /[\r\n;]/.test(sessionCookie)) {
  throw new Error('写入前需要 CMS_SESSION_COOKIE；不需要把 Cookie 发送到对话中')
}
const apiBase = (process.env.CMS_API_BASE ?? 'http://localhost:3001/api').replace(/\/$/, '')
const auth = await fetch(`${apiBase}/auth/me`, {
  headers: { Cookie: `peanut_cms_session=${sessionCookie}` },
})
if (!auth.ok) throw new Error(`CMS 登录会话无效：HTTP ${auth.status}`)

const images = JSON.parse(run('cms-upload-assets', ['--apply']))
const imports = []
let previousReady = -1
for (let pass = 0; pass < 4; pass += 1) {
  run('cms-prepare')
  const ready = preparedSummary().readyForDraft
  if (ready === previousReady) break
  imports.push(JSON.parse(run('cms-import', ['--apply'])))
  previousReady = ready
}
run('cms-prepare')
run('cms-preview')
const prepared = preparedSummary()
const created = imports.reduce((sum, result) => sum + result.created, 0)
const updated = imports.reduce((sum, result) => sum + result.updated, 0)
process.stdout.write(`草稿迁移完成：上传图片 ${images.uploaded} 张；新建草稿 ${created} 篇，更新草稿 ${updated} 篇；${prepared.manualWork} 篇仍待处理。\n`)
process.stdout.write(`预览：${path.join(root, '.cms-import', 'previews', 'index.html')}\n`)
process.stdout.write('未发布文章。\n')

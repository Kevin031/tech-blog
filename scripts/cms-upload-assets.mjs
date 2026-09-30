import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stageRoot = path.join(root, '.cms-import')
const stateFile = path.join(stageRoot, 'upload-state.json')
const urlFile = path.join(stageRoot, 'asset-urls.json')
const assets = JSON.parse(readFileSync(path.join(stageRoot, 'assets.json'), 'utf8')).assets
const state = existsSync(stateFile)
  ? JSON.parse(readFileSync(stateFile, 'utf8'))
  : { schemaVersion: 1, uploaded: {}, inFlight: null }
const urls = existsSync(urlFile) ? JSON.parse(readFileSync(urlFile, 'utf8')) : {}
if (state.schemaVersion !== 1) throw new Error('不支持的图片上传状态版本')

const apply = process.argv.includes('--apply')
const limitIndex = process.argv.indexOf('--limit')
const limit = limitIndex < 0 ? Infinity : Number(process.argv[limitIndex + 1])
if ((!Number.isInteger(limit) && limit !== Infinity) || limit < 1) throw new Error('--limit 必须是正整数')
const selected = assets.slice(0, limit)

function saveJson(filename, data) {
  mkdirSync(stageRoot, { recursive: true })
  const temporary = `${filename}.tmp`
  writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 })
  renameSync(temporary, filename)
}

function imageMime(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg'
  if (['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return 'image/gif'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  throw new Error('图片格式不受 CMS 支持')
}

for (const asset of selected) {
  const absolute = path.resolve(root, asset.path)
  const relative = path.relative(root, absolute)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`图片路径超出项目目录：${asset.path}`)
  }
  const buffer = readFileSync(absolute)
  if (createHash('sha256').update(buffer).digest('hex') !== asset.sha256) {
    throw new Error(`图片已变化，请重新运行 pnpm cms:prepare：${asset.path}`)
  }
  imageMime(buffer)
}

if (state.inFlight && urls[state.inFlight]) {
  state.inFlight = null
  if (apply) saveJson(stateFile, state)
}
if (state.inFlight) throw new Error(`上次上传结果待核对：${state.inFlight}。请在 CMS 媒体库核对后填写 asset-urls.json`)

const summary = {
  selected: selected.length,
  mapped: selected.filter((asset) => Boolean(urls[asset.sha256] || state.uploaded[asset.sha256])).length,
  pending: selected.filter((asset) => !urls[asset.sha256] && !state.uploaded[asset.sha256]).length,
}
if (!apply) {
  process.stdout.write(`${JSON.stringify({ mode: 'preview', ...summary }, null, 2)}\n`)
  process.exit(0)
}

const sessionCookie = process.env.CMS_SESSION_COOKIE
if (!sessionCookie || /[\r\n;]/.test(sessionCookie)) {
  throw new Error('执行上传需要 CMS_SESSION_COOKIE，值为 peanut_cms_session 的 Cookie 内容')
}
const apiBase = (process.env.CMS_API_BASE ?? 'http://localhost:3001/api').replace(/\/$/, '')
const cookie = `peanut_cms_session=${sessionCookie}`
const auth = await fetch(`${apiBase}/auth/me`, { headers: { Cookie: cookie } })
if (!auth.ok) throw new Error(`CMS 登录会话无效：${auth.status}`)
const { csrfToken } = await auth.json()
if (!csrfToken) throw new Error('CMS 登录会话缺少 CSRF Token')

const counts = { uploaded: 0, skipped: 0 }
for (const asset of selected) {
  if (urls[asset.sha256] || state.uploaded[asset.sha256]) {
    if (!urls[asset.sha256] && state.uploaded[asset.sha256]) {
      urls[asset.sha256] = state.uploaded[asset.sha256].url
      saveJson(urlFile, urls)
    }
    counts.skipped += 1
    continue
  }

  const buffer = readFileSync(path.join(root, asset.path))
  const body = new FormData()
  body.append('category', 'article')
  body.append('file', new Blob([buffer], { type: imageMime(buffer) }), path.basename(asset.path))
  state.inFlight = asset.sha256
  saveJson(stateFile, state)
  const response = await fetch(`${apiBase}/media`, {
    method: 'POST',
    headers: { Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body,
  })
  if (!response.ok) throw new Error(`CMS 上传图片失败：${asset.path}，HTTP ${response.status}`)
  const uploaded = await response.json()
  if (typeof uploaded.id !== 'string' || typeof uploaded.url !== 'string' || !uploaded.url.startsWith('https://')) {
    throw new Error(`CMS 图片响应无效：${asset.path}`)
  }
  state.uploaded[asset.sha256] = { id: uploaded.id, url: uploaded.url, sourcePath: asset.path }
  state.inFlight = null
  saveJson(stateFile, state)
  urls[asset.sha256] = uploaded.url
  saveJson(urlFile, urls)
  counts.uploaded += 1
}

process.stdout.write(`${JSON.stringify({ mode: 'apply', ...summary, ...counts }, null, 2)}\n`)

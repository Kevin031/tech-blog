import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./cms-import.mjs', import.meta.url))

function run(root, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', 'cms-import.mjs'), ...args], {
      cwd: root,
      env: { ...process.env, ...env },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (data) => { stdout += data })
    child.stderr.on('data', (data) => { stderr += data })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

test('草稿导入默认预览，执行时记录映射并避免重复创建和覆盖已发布文章', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'cms-import-'))
  const articles = []
  const requests = []
  const server = createServer(async (request, response) => {
    requests.push(`${request.method} ${request.url}`)
    if (request.headers.cookie !== 'peanut_cms_session=session') {
      response.writeHead(401).end()
      return
    }
    if (request.method !== 'GET' && request.headers['x-csrf-token'] !== 'csrf') {
      response.writeHead(403).end()
      return
    }
    let result
    if (request.url === '/api/auth/me') result = { csrfToken: 'csrf' }
    else if (request.url === '/api/articles' && request.method === 'GET') result = articles
    else if (request.url === '/api/articles' && request.method === 'POST') {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      result = { id: 'article-1', status: 'draft', ...JSON.parse(Buffer.concat(chunks).toString()) }
      articles.push(result)
    } else if (request.url === '/api/articles/article-1' && request.method === 'PUT') {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      result = { ...articles[0], ...JSON.parse(Buffer.concat(chunks).toString()) }
      articles[0] = result
    } else {
      response.writeHead(404).end()
      return
    }
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(result))
  })
  try {
    mkdirSync(path.join(root, 'scripts'))
    mkdirSync(path.join(root, '.cms-import'))
    copyFileSync(script, path.join(root, 'scripts', 'cms-import.mjs'))
    const packageFile = path.join(root, '.cms-import', 'drafts.json')
    const draft = {
      sourcePath: 'docs/posts/a.md', sourceHash: 'source-hash', preparedHash: 'draft-hash-1',
      input: { title: '文章', summary: '摘要', content: '正文', coverImage: null, tagIds: [] },
    }
    writeFileSync(packageFile, JSON.stringify({ schemaVersion: 1, drafts: [draft] }))
    const preview = await run(root, [])
    assert.equal(preview.code, 0)
    assert.equal(JSON.parse(preview.stdout).pending, 1)
    assert.equal(requests.length, 0)

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const env = {
      CMS_API_BASE: `http://127.0.0.1:${server.address().port}/api`,
      CMS_SESSION_COOKIE: 'session',
    }
    const first = await run(root, ['--apply'], env)
    assert.equal(first.code, 0, first.stderr)
    assert.equal(JSON.parse(first.stdout).created, 1)
    assert.equal(JSON.parse(readFileSync(path.join(root, '.cms-import', 'import-state.json'))).articles[draft.sourcePath].id, 'article-1')
    const second = await run(root, ['--apply'], env)
    assert.equal(second.code, 0, second.stderr)
    assert.equal(JSON.parse(second.stdout).skipped, 1)
    assert.equal(requests.filter((item) => item === 'POST /api/articles').length, 1)

    draft.preparedHash = 'draft-hash-2'
    draft.input.content = '新正文'
    writeFileSync(packageFile, JSON.stringify({ schemaVersion: 1, drafts: [draft] }))
    const updated = await run(root, ['--apply'], env)
    assert.equal(updated.code, 0, updated.stderr)
    assert.equal(JSON.parse(updated.stdout).updated, 1)

    articles[0].summary = '管理端修改的摘要'
    draft.preparedHash = 'draft-hash-3'
    draft.input.content = '再次修改的正文'
    writeFileSync(packageFile, JSON.stringify({ schemaVersion: 1, drafts: [draft] }))
    const edited = await run(root, ['--apply'], env)
    assert.notEqual(edited.code, 0)
    assert.match(edited.stderr, /CMS 草稿在上次导入后发生变化/)
    assert.equal(requests.filter((item) => item.startsWith('PUT ')).length, 1)

    articles[0].status = 'published'
    const published = await run(root, ['--apply'], env)
    assert.notEqual(published.code, 0)
    assert.match(published.stderr, /拒绝覆盖已发布文章/)
    assert.equal(requests.filter((item) => item.startsWith('PUT ')).length, 1)
  } finally {
    server.close()
    rmSync(root, { recursive: true, force: true })
  }
})

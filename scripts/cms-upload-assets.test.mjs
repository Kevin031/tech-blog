import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./cms-upload-assets.mjs', import.meta.url))

function run(root, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', 'cms-upload-assets.mjs'), ...args], {
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

test('图片上传默认预览，执行后按哈希记录 URL 并避免重复上传', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'cms-assets-'))
  const requests = []
  const server = createServer(async (request, response) => {
    requests.push(`${request.method} ${request.url}`)
    if (request.headers.cookie !== 'peanut_cms_session=session') {
      response.writeHead(401).end()
      return
    }
    if (request.method === 'GET' && request.url === '/api/auth/me') {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ csrfToken: 'csrf' }))
      return
    }
    if (request.method === 'POST' && request.url === '/api/media') {
      assert.equal(request.headers['x-csrf-token'], 'csrf')
      assert.match(request.headers['content-type'], /^multipart\/form-data;/)
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      assert.match(Buffer.concat(chunks).toString('latin1'), /name="category"/)
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ id: 'media-1', url: 'https://example.com/media-1.png' }))
      return
    }
    response.writeHead(404).end()
  })
  try {
    mkdirSync(path.join(root, 'scripts'))
    mkdirSync(path.join(root, '.cms-import'))
    mkdirSync(path.join(root, 'docs', 'posts'), { recursive: true })
    copyFileSync(script, path.join(root, 'scripts', 'cms-upload-assets.mjs'))
    const image = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('test')])
    const sha256 = createHash('sha256').update(image).digest('hex')
    writeFileSync(path.join(root, 'docs', 'posts', 'image.png'), image)
    writeFileSync(path.join(root, '.cms-import', 'assets.json'), JSON.stringify({
      schemaVersion: 1,
      assets: [{ path: 'docs/posts/image.png', sha256, bytes: image.length, references: [] }],
    }))
    const preview = await run(root, [])
    assert.equal(preview.code, 0, preview.stderr)
    assert.equal(JSON.parse(preview.stdout).pending, 1)
    assert.equal(requests.length, 0)

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const env = {
      CMS_API_BASE: `http://127.0.0.1:${server.address().port}/api`,
      CMS_SESSION_COOKIE: 'session',
    }
    const first = await run(root, ['--apply'], env)
    assert.equal(first.code, 0, first.stderr)
    assert.equal(JSON.parse(first.stdout).uploaded, 1)
    assert.equal(JSON.parse(readFileSync(path.join(root, '.cms-import', 'asset-urls.json')))[sha256], 'https://example.com/media-1.png')
    const second = await run(root, ['--apply'], env)
    assert.equal(second.code, 0, second.stderr)
    assert.equal(JSON.parse(second.stdout).skipped, 1)
    assert.equal(requests.filter((item) => item === 'POST /api/media').length, 1)

    writeFileSync(path.join(root, 'docs', 'posts', 'image.png'), 'changed')
    const stale = await run(root, [])
    assert.notEqual(stale.code, 0)
    assert.match(stale.stderr, /图片已变化/)
  } finally {
    server.close()
    rmSync(root, { recursive: true, force: true })
  }
})

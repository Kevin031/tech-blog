import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./cms-migrate.mjs', import.meta.url))

function run(root, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, 'scripts', 'cms-migrate.mjs'), ...args], {
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

test('一条命令默认只生成；显式执行时先上传，再多轮导入新放行的草稿', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'cms-migrate-'))
  const server = createServer((request, response) => {
    if (request.url !== '/api/auth/me' || request.headers.cookie !== 'peanut_cms_session=session') {
      response.writeHead(401).end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end('{"csrfToken":"csrf"}')
  })
  try {
    mkdirSync(path.join(root, 'scripts'))
    mkdirSync(path.join(root, 'reports'))
    copyFileSync(script, path.join(root, 'scripts', 'cms-migrate.mjs'))
    for (const name of ['cms-preflight', 'cms-prepare', 'cms-preview', 'cms-upload-assets', 'cms-import']) {
      const body = `
        import fs from 'node:fs';
        import path from 'node:path';
        import { fileURLToPath } from 'node:url';
        const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
        fs.appendFileSync(path.join(root, 'calls.txt'), '${name}' + (process.argv.includes('--apply') ? ':apply' : '') + '\\n');
        if ('${name}' === 'cms-prepare') {
          const countFile = path.join(root, 'count.txt');
          const count = (fs.existsSync(countFile) ? Number(fs.readFileSync(countFile, 'utf8')) : 0) + 1;
          fs.writeFileSync(countFile, String(count));
          fs.writeFileSync(path.join(root, 'reports', 'cms-import-prepared.json'), JSON.stringify({summary:{total:105,readyForDraft:count === 1 ? 96 : count === 2 ? 104 : 105,manualWork:0}}));
        }
        if ('${name}' === 'cms-upload-assets') process.stdout.write(JSON.stringify({pending:16,uploaded:16}));
        if ('${name}' === 'cms-import') process.stdout.write(JSON.stringify({pending:96,created:1,updated:0}));
      `
      writeFileSync(path.join(root, 'scripts', `${name}.mjs`), body)
    }

    const preview = await run(root, [])
    assert.equal(preview.code, 0, preview.stderr)
    assert.match(preview.stdout, /未上传图片、未写入 CMS/)
    assert.deepEqual(readFileSync(path.join(root, 'calls.txt'), 'utf8').trim().split('\n'), [
      'cms-preflight', 'cms-prepare', 'cms-preview', 'cms-upload-assets', 'cms-import',
    ])

    writeFileSync(path.join(root, 'calls.txt'), '')
    writeFileSync(path.join(root, 'count.txt'), '0')
    const missingSession = await run(root, ['--apply'], { CMS_SESSION_COOKIE: '' })
    assert.notEqual(missingSession.code, 0)
    assert.match(missingSession.stderr, /CMS_SESSION_COOKIE/)
    assert.doesNotMatch(readFileSync(path.join(root, 'calls.txt'), 'utf8'), /:apply/)

    writeFileSync(path.join(root, 'calls.txt'), '')
    writeFileSync(path.join(root, 'count.txt'), '0')
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const applied = await run(root, ['--apply'], {
      CMS_API_BASE: `http://127.0.0.1:${server.address().port}/api`,
      CMS_SESSION_COOKIE: 'session',
    })
    assert.equal(applied.code, 0, applied.stderr)
    assert.match(applied.stdout, /新建草稿 2 篇/)
    const calls = readFileSync(path.join(root, 'calls.txt'), 'utf8').trim().split('\n')
    assert.equal(calls.filter((call) => call === 'cms-upload-assets:apply').length, 1)
    assert.equal(calls.filter((call) => call === 'cms-import:apply').length, 2)
    assert(calls.indexOf('cms-upload-assets:apply') < calls.indexOf('cms-import:apply'))
  } finally {
    server.close()
    rmSync(root, { recursive: true, force: true })
  }
})

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./cms-preflight.mjs', import.meta.url))
const marker = '---\ntags:\n  - cms-import-ready\n---\n\n'

test('仅扫描标记文章，跳过代码块，并区分转换与资源缺失', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'cms-preflight-'))
  try {
    mkdirSync(path.join(root, 'scripts'))
    mkdirSync(path.join(root, 'docs', 'posts'), { recursive: true })
    copyFileSync(script, path.join(root, 'scripts', 'cms-preflight.mjs'))
    writeFileSync(
      path.join(root, 'docs', 'posts', 'ready.md'),
      `${marker}# 可用文章\n\n这是一段可提取为摘要的普通正文，并且完全没有需要额外转换的迁移格式问题。\n\n\`\`\`js\n<<< ./missing.js\n<script>\n\`\`\`\n`,
    )
    writeFileSync(
      path.join(root, 'docs', 'posts', 'blocked.md'),
      `${marker}# 资源缺失\n\n<<< ./missing.js\n\n![图片](./missing.png)\n`,
    )
    writeFileSync(path.join(root, 'docs', 'posts', 'index.md'), '# 导航页\n')

    execFileSync(process.execPath, [path.join(root, 'scripts', 'cms-preflight.mjs')], { cwd: root })
    const report = JSON.parse(readFileSync(path.join(root, 'reports', 'cms-import-preflight.json'), 'utf8'))
    assert.equal(report.summary.scanned, 3)
    assert.equal(report.summary.selected, 2)
    assert.deepEqual(report.summary.status, { ready: 1, needs_conversion: 0, blocked: 1 })
    assert.deepEqual(report.articles.find((article) => article.path.endsWith('/ready.md')).issues, [])
    const blocked = report.articles.find((article) => article.path.endsWith('/blocked.md'))
    assert.deepEqual(blocked.issues.map((issue) => issue.code), [
      'vitepress_include',
      'missing_include',
      'local_image',
      'missing_local_asset',
      'missing_summary_candidate',
    ])
    assert.deepEqual(blocked.issues.map((issue) => issue.line), [8, 8, 10, 10, 5])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

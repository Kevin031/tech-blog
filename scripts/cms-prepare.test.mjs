import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const scripts = ['cms-preflight.mjs', 'cms-prepare.mjs'].map((name) =>
  fileURLToPath(new URL(`./${name}`, import.meta.url)),
)
const marker = '---\ntags:\n  - cms-import-ready\n---\n\n'

test('生成可导入草稿，保留人工处理文章并拒绝过期预检', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'cms-prepare-'))
  const run = (name) => execFileSync(process.execPath, [path.join(root, 'scripts', name)], { cwd: root })
  try {
    mkdirSync(path.join(root, 'scripts'))
    mkdirSync(path.join(root, 'docs', 'posts'), { recursive: true })
    scripts.forEach((script) => copyFileSync(script, path.join(root, 'scripts', path.basename(script))))
    writeFileSync(path.join(root, 'scripts', 'cms-summary-overrides.json'), '{}')
    writeFileSync(path.join(root, 'docs', 'posts', 'sample.js'), 'const answer = 42\n')
    writeFileSync(path.join(root, 'docs', 'posts', 'image.png'), 'image fixture')
    writeFileSync(
      path.join(root, 'docs', 'posts', 'ready.md'),
      `${marker}# 自动转换\n\n这段正文足够长，可以作为文章摘要候选，并用于检验草稿数据的生成结果。\n\n::: tip 小提示\n查看代码示例。\n:::\n\n<<< ./sample.js\n`,
    )
    writeFileSync(
      path.join(root, 'docs', 'posts', 'manual.md'),
      `${marker}# 人工处理\n\n这段正文足够长，可以作为人工处理文章的摘要候选，测试它不会进入草稿数据。\n\n![示例](./image.png)\n\n[参考文章](./ready.md)\n`,
    )
    writeFileSync(
      path.join(root, 'docs', 'posts', 'demo.md'),
      `${marker}# 页面演示\n\n这段正文足够长，可以作为演示文章的摘要候选，检验脚本和 HTML 能否保留为代码。\n\n<script setup>\nconst example = 1\n</script>\n\n<Demo />\n\n<div class="example">内容</div>\n`,
    )

    run('cms-preflight.mjs')
    run('cms-prepare.mjs')
    const drafts = JSON.parse(readFileSync(path.join(root, '.cms-import', 'drafts.json'), 'utf8')).drafts
    const report = JSON.parse(readFileSync(path.join(root, 'reports', 'cms-import-prepared.json'), 'utf8'))
    const assets = JSON.parse(readFileSync(path.join(root, '.cms-import', 'assets.json'), 'utf8')).assets
    assert.deepEqual(report.summary, {
      total: 3,
      readyForDraft: 2,
      manualWork: 1,
      blocked: 0,
      expandedIncludes: 1,
      convertedContainers: 2,
      convertedHtmlDemos: 3,
      localAssets: 1,
      localImageReferences: 1,
      mappedLocalImages: 0,
      mappedArticleLinks: 0,
      curatedSummaries: 0,
    })
    assert.equal(drafts.length, 2)
    const ready = drafts.find((draft) => draft.sourcePath === 'docs/posts/ready.md')
    assert.match(ready.input.content, /^> \*\*小提示\*\*/m)
    assert.match(ready.input.content, /```js\nconst answer = 42\n```/)
    assert.doesNotMatch(ready.input.content, /<<<|:::/)
    const demo = drafts.find((draft) => draft.sourcePath === 'docs/posts/demo.md')
    assert.match(demo.input.content, /```vue\n<script setup>/)
    assert.match(demo.input.content, /```html\n<div class="example">内容<\/div>/)
    assert.match(demo.input.content, /原页面此处为交互演示/)
    assert.equal(report.articles.find((article) => article.title === '人工处理').status, 'manual_work')
    assert.deepEqual(assets[0].references, [{ sourcePath: 'docs/posts/manual.md', target: './image.png' }])

    writeFileSync(path.join(root, 'docs', 'posts', 'sample.js'), 'const answer = 43\n')
    run('cms-prepare.mjs')
    const refreshed = JSON.parse(readFileSync(path.join(root, '.cms-import', 'drafts.json'), 'utf8')).drafts
      .find((draft) => draft.sourcePath === 'docs/posts/ready.md')
    assert.equal(refreshed.sourceHash, ready.sourceHash)
    assert.notEqual(refreshed.preparedHash, ready.preparedHash)
    assert.match(refreshed.input.content, /const answer = 43/)

    writeFileSync(
      path.join(root, '.cms-import', 'asset-urls.json'),
      JSON.stringify({ [assets[0].sha256]: 'https://example.com/image.png' }),
    )
    run('cms-prepare.mjs')
    const imagesOnly = JSON.parse(readFileSync(path.join(root, '.cms-import', 'drafts.json'), 'utf8')).drafts
    assert.equal(imagesOnly.length, 2)
    writeFileSync(path.join(root, '.cms-import', 'import-state.json'), JSON.stringify({
      schemaVersion: 1,
      articles: { 'docs/posts/ready.md': { id: 'ready-id', sourceHash: 'old' } },
    }))
    run('cms-prepare.mjs')
    const mapped = JSON.parse(readFileSync(path.join(root, '.cms-import', 'drafts.json'), 'utf8')).drafts
    assert.equal(mapped.length, 3)
    assert.match(mapped.find((draft) => draft.sourcePath === 'docs/posts/manual.md').input.content, /https:\/\/example.com\/image.png/)
    assert.match(mapped.find((draft) => draft.sourcePath === 'docs/posts/manual.md').input.content, /\/articles\/ready-id/)

    writeFileSync(path.join(root, 'docs', 'posts', 'ready.md'), `${marker}# 已修改\n`)
    const stale = spawnSync(process.execPath, [path.join(root, 'scripts', 'cms-prepare.mjs')], {
      cwd: root,
      encoding: 'utf8',
    })
    assert.notEqual(stale.status, 0)
    assert.match(stale.stderr, /预检报告已过期/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from '../../peanut-cms/apps/blog/node_modules/markdown-it/dist/markdown-it.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const previewRoot = path.join(root, '.cms-import', 'previews')
const drafts = JSON.parse(readFileSync(path.join(root, '.cms-import', 'drafts.json'), 'utf8')).drafts
const prepared = JSON.parse(readFileSync(path.join(root, 'reports', 'cms-import-prepared.json'), 'utf8'))
const reportByPath = new Map(prepared.articles.map((article) => [article.sourcePath, article]))
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true })

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

const style = `
  body { margin: 0; color: #243047; background: #f7f8fb; font: 16px/1.75 system-ui, sans-serif; }
  main { max-width: 860px; margin: 0 auto; padding: 32px 24px 80px; }
  article { background: white; padding: 36px 48px; border-radius: 12px; }
  h1, h2, h3 { line-height: 1.35; }
  a { color: #2457a7; } img { max-width: 100%; height: auto; }
  pre { overflow: auto; padding: 18px; background: #f1f3f7; border-radius: 8px; }
  code { overflow-wrap: anywhere; } blockquote { margin-left: 0; padding-left: 16px; border-left: 3px solid #9bb3d9; }
  .meta, .review { color: #59677d; font-size: 14px; }
  .review { background: #fff7e5; border: 1px solid #ead6a1; padding: 12px 16px; margin: 22px 0; }
  .list { background: white; padding: 24px 36px; border-radius: 12px; }
  .list li { margin-bottom: 8px; }
  @media (max-width: 700px) { main { padding: 18px 12px; } article { padding: 24px 18px; } }
`

function page(title, body) {
  return `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${style}</style></head><body><main>${body}</main></body></html>\n`
}

mkdirSync(previewRoot, { recursive: true })
const entries = []
for (const [index, draft] of drafts.entries()) {
  const filename = `${String(index + 1).padStart(3, '0')}.html`
  const report = reportByPath.get(draft.sourcePath)
  const review = report?.review ?? []
  const sourceHref = `../../${draft.sourcePath.split('/').map(encodeURIComponent).join('/')}`
  const body = [
    '<p><a href="index.html">返回草稿目录</a></p>',
    `<article><header><h1>${escapeHtml(draft.input.title)}</h1>`,
    `<p>${escapeHtml(draft.input.summary || '暂无摘要')}</p>`,
    `<p class="meta">源文件：<a href="${sourceHref}">${escapeHtml(draft.sourcePath)}</a></p></header>`,
    review.length ? `<div class="review">复核提示：${review.map(escapeHtml).join('；')}</div>` : '',
    markdown.render(draft.input.content),
    '</article>',
  ].join('\n')
  writeFileSync(path.join(previewRoot, filename), page(draft.input.title, body))
  entries.push(`<li><a href="${filename}">${escapeHtml(draft.input.title)}</a><br><span class="meta">${escapeHtml(draft.sourcePath)}${review.length ? ` · ${review.map(escapeHtml).join('；')}` : ''}</span></li>`)
}

writeFileSync(path.join(previewRoot, 'index.html'), page('CMS 草稿预览', [
  '<h1>CMS 草稿预览</h1>',
  `<p>共 ${drafts.length} 篇。此预览使用 CMS 博客当前的 Markdown 渲染配置；页面样式仅用于本地阅读。</p>`,
  `<ol class="list">${entries.join('\n')}</ol>`,
].join('\n')))
process.stdout.write(`已生成 ${drafts.length} 篇预览：${path.join(previewRoot, 'index.html')}\n`)

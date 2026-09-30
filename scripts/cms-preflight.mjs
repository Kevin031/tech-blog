import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.join(root, 'docs')
const reportRoot = path.join(root, 'reports')
const marker = 'cms-import-ready'

const issueMeta = {
  missing_local_asset: { level: 'blocked', label: '本地图片不存在' },
  missing_include: { level: 'blocked', label: '引用的代码文件不存在' },
  local_image: { level: 'convert', label: '本地图片需要上传并改写链接' },
  vitepress_include: { level: 'convert', label: 'VitePress 代码引用需要展开' },
  vitepress_container: { level: 'convert', label: 'VitePress 容器需要转换' },
  raw_html: { level: 'convert', label: '原始 HTML 或 Vue 组件需要转换' },
  local_article_link: { level: 'convert', label: '站内文章链接需要映射' },
  mermaid: { level: 'convert', label: 'Mermaid 图需要渲染或替换' },
  missing_h1: { level: 'review', label: '缺少一级标题，暂用文件名' },
  missing_summary_candidate: { level: 'review', label: '未提取到摘要候选文本' },
  remote_image: { level: 'review', label: '远程图片需要确认可长期访问' },
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .flatMap((entry) => {
      const target = path.join(directory, entry.name)
      return entry.isDirectory()
        ? walk(target)
        : entry.isFile() && target.endsWith('.md')
          ? [target]
          : []
    })
}

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return { frontmatter: '', body: source, offset: 0 }
  return {
    frontmatter: match[1],
    body: source.slice(match[0].length),
    offset: match[0].split('\n').length - 1,
  }
}

function hasMarker(frontmatter) {
  const lines = frontmatter.split(/\r?\n/)
  let inTags = false
  for (const line of lines) {
    if (/^tags:\s*$/.test(line)) {
      inTags = true
      continue
    }
    if (inTags && /^\S/.test(line)) inTags = false
    if (inTags && /^\s+-\s+['"]?cms-import-ready['"]?\s*$/.test(line)) return true
    if (/^tags:\s*\[[^\]]*cms-import-ready[^\]]*\]\s*$/.test(line)) return true
  }
  return false
}

function isRemote(target) {
  return /^(?:https?:)?\/\//i.test(target)
}

function extractTarget(raw) {
  const value = raw.trim()
  if (value.startsWith('<')) return value.match(/^<([^>]+)>/)?.[1] ?? value
  return value.match(/^\S+/)?.[0] ?? value
}

function resolveLocal(articlePath, target) {
  const clean = target.split(/[?#]/, 1)[0]
  let decoded
  try {
    decoded = decodeURIComponent(clean)
  } catch {
    decoded = clean
  }
  return decoded.startsWith('/')
    ? path.resolve(docsRoot, 'public', `.${decoded}`)
    : path.resolve(path.dirname(articlePath), decoded)
}

function outsideDocs(target) {
  const relative = path.relative(docsRoot, target)
  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
}

function scanArticle(articlePath, source) {
  const { body, offset } = splitFrontmatter(source)
  const lines = body.split(/\r?\n/)
  const issues = []
  const titleCandidates = []
  const summaryCandidates = []
  let fence = null

  function add(code, line, detail = '') {
    issues.push({ code, level: issueMeta[code].level, line: line + offset, detail })
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      const delimiter = fenceMatch[1]
      if (!fence) {
        fence = delimiter
        if (/^mermaid(?:\s|$)/i.test(fenceMatch[2].trim())) add('mermaid', lineNumber)
      } else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) {
        fence = null
      }
      return
    }
    if (fence || /^ {4}|^\t/.test(line)) return

    const visible = line.replace(/`[^`]*`/g, '')
    const h1 = visible.match(/^#\s+(.+)$/)
    if (h1) titleCandidates.push(h1[1].trim())

    if (/^\s*<<<\s+/.test(visible)) {
      const include = visible.match(/^\s*<<<\s+([^\s{]+)/)?.[1]
      add('vitepress_include', lineNumber, include ?? '')
      if (include && !existsSync(resolveLocal(articlePath, include))) {
        add('missing_include', lineNumber, include)
      }
    }
    if (/^\s*:::(?!\s*$)/.test(visible) || /^\s*:::/.test(visible)) {
      add('vitepress_container', lineNumber, visible.trim().slice(0, 80))
    }
    if (/^\s*<\/?[A-Za-z][\w:-]*(?:\s|>|\/)/.test(visible)) {
      add('raw_html', lineNumber, visible.trim().slice(0, 80))
    }

    for (const image of visible.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = extractTarget(image[1])
      if (isRemote(target)) {
        add('remote_image', lineNumber, target)
      } else if (!/^(?:data:|#)/i.test(target)) {
        add('local_image', lineNumber, target)
        const localPath = resolveLocal(articlePath, target)
        if (outsideDocs(localPath) || !existsSync(localPath) || !statSync(localPath).isFile()) {
          add('missing_local_asset', lineNumber, target)
        }
      }
    }

    for (const link of visible.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = extractTarget(link[1])
      if (/^(?:https?:|mailto:|tel:|#)/i.test(target)) continue
      if (target.startsWith('/') || /\.md(?:[?#]|$)/i.test(target)) {
        add('local_article_link', lineNumber, target)
      }
    }

    const paragraph = visible.trim()
    if (
      paragraph.length >= 25 &&
      !/^(?:#|>|-|\*|\d+\.|\|)/.test(paragraph) &&
      !/^(?:import|export|const|let|function|return|\/\/|@)/.test(paragraph) &&
      !paragraph.startsWith('<') &&
      !paragraph.startsWith('![') &&
      !paragraph.startsWith(':::')
    ) {
      summaryCandidates.push(paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'))
    }
  })

  if (titleCandidates.length === 0) add('missing_h1', 1)
  if (summaryCandidates.length === 0) add('missing_summary_candidate', 1)
  const blockers = issues.filter((issue) => issue.level === 'blocked').length
  const conversions = issues.filter((issue) => issue.level === 'convert').length
  const filenameTitle = path.basename(articlePath, '.md') === 'index'
    ? path.basename(path.dirname(articlePath))
    : path.basename(articlePath, '.md')
  const useFilenameTitle = /^\d+\s/.test(filenameTitle) || titleCandidates.length === 0
  return {
    path: path.relative(root, articlePath).split(path.sep).join('/'),
    sourceHash: createHash('sha256').update(body).digest('hex'),
    title: useFilenameTitle ? filenameTitle : titleCandidates[0],
    titleSource: useFilenameTitle ? 'filename' : 'h1',
    suggestedSummary: summaryCandidates[0]?.slice(0, 160) ?? '',
    status: blockers ? 'blocked' : conversions ? 'needs_conversion' : 'ready',
    issues,
  }
}

function countBy(items, key) {
  return Object.fromEntries(
    [...new Set(items.map(key))].sort().map((value) => [value, items.filter((item) => key(item) === value).length]),
  )
}

function renderMarkdown(report) {
  const rows = report.articles.map((article) => {
    const counts = countBy(article.issues, (issue) => issue.code)
    const labels = Object.entries(counts)
      .map(([code, count]) => `${issueMeta[code].label} ${count}`)
      .join('；')
    const href = article.path.split('/').map(encodeURIComponent).join('/')
    return `| [${article.path}](../${href}) | ${article.status} | ${labels || '无'} |`
  })
  return [
    '# CMS 文章迁移预检',
    '',
    `源标签：\`${marker}\`；扫描 ${report.summary.scanned} 篇，选中 ${report.summary.selected} 篇。`,
    '',
    `状态：可直接处理 ${report.summary.status.ready} 篇，需转换 ${report.summary.status.needs_conversion} 篇，资源阻断 ${report.summary.status.blocked} 篇。`,
    '',
    '此报告只检查迁移格式和资源，不代表文章内容已经过事实核查。`ready` 表示未发现脚本已知的不兼容语法；上线前仍需预览。',
    '',
    '## 后续处理顺序',
    '',
    '1. 展开 `<<<` 代码引用，并将 VitePress 容器转换为普通 Markdown；含 Vue 组件和原始 HTML 的交互内容需要逐篇决定替代呈现方式。',
    '2. 上传本地图片并改写链接；逐批核对远程图片，避免线上文章依赖失效的外部地址。',
    '3. 核对文件名回退得到的标题与摘要候选文本，再以草稿导入 CMS 并逐篇预览。发布应在预览之后单独执行。',
    '',
    '## 问题汇总',
    '',
    ...Object.entries(report.summary.issues).map(
      ([code, count]) => `- ${issueMeta[code].label}：影响 ${report.summary.affectedArticles[code]} 篇，共 ${count} 处`,
    ),
    '',
    '远程图片来源：',
    '',
    ...Object.entries(report.summary.remoteImageHosts).map(([host, count]) => `- ${host}：${count} 张`),
    '',
    '## 逐篇结果',
    '',
    '| 源文件 | 状态 | 待处理项 |',
    '| --- | --- | --- |',
    ...rows,
    '',
    '逐项行号与资源地址见 [JSON 报告](./cms-import-preflight.json)。',
    '',
  ].join('\n')
}

const allFiles = walk(docsRoot)
const selectedFiles = allFiles.filter((file) => hasMarker(splitFrontmatter(readFileSync(file, 'utf8')).frontmatter))
const articles = selectedFiles.map((file) => scanArticle(file, readFileSync(file, 'utf8')))
const issues = articles.flatMap((article) => article.issues)
const affectedArticles = Object.fromEntries(
  Object.keys(issueMeta)
    .filter((code) => issues.some((issue) => issue.code === code))
    .map((code) => [code, articles.filter((article) => article.issues.some((issue) => issue.code === code)).length]),
)
const remoteImageHosts = countBy(
  issues.filter((issue) => issue.code === 'remote_image'),
  (issue) => new URL(issue.detail, 'https://placeholder.invalid').hostname,
)
const report = {
  schemaVersion: 1,
  marker,
  summary: {
    scanned: allFiles.length,
    selected: articles.length,
    status: {
      ready: articles.filter((article) => article.status === 'ready').length,
      needs_conversion: articles.filter((article) => article.status === 'needs_conversion').length,
      blocked: articles.filter((article) => article.status === 'blocked').length,
    },
    issues: countBy(issues, (issue) => issue.code),
    affectedArticles,
    remoteImageHosts,
  },
  articles,
}

mkdirSync(reportRoot, { recursive: true })
writeFileSync(path.join(reportRoot, 'cms-import-preflight.json'), `${JSON.stringify(report, null, 2)}\n`)
writeFileSync(path.join(reportRoot, 'cms-import-preflight.md'), renderMarkdown(report))
process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`)

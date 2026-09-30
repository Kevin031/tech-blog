import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.join(root, 'docs')
const reportRoot = path.join(root, 'reports')
const stageRoot = path.join(root, '.cms-import')
const preflight = JSON.parse(readFileSync(path.join(reportRoot, 'cms-import-preflight.json'), 'utf8'))
const summaryOverrides = JSON.parse(readFileSync(path.join(root, 'scripts', 'cms-summary-overrides.json'), 'utf8'))
const automaticCodes = new Set(['vitepress_include', 'vitepress_container'])
const assetUrlFile = process.env.CMS_ASSET_URLS_FILE ?? path.join(stageRoot, 'asset-urls.json')
const assetUrls = existsSync(assetUrlFile) ? JSON.parse(readFileSync(assetUrlFile, 'utf8')) : {}
const articleUrlFile = process.env.CMS_ARTICLE_URLS_FILE ?? path.join(stageRoot, 'article-urls.json')
const articleUrls = existsSync(articleUrlFile) ? JSON.parse(readFileSync(articleUrlFile, 'utf8')) : {}
const allowLocalUrls = process.env.CMS_ALLOW_LOCAL_URLS === '1'
const importStateFile = path.join(stageRoot, 'import-state.json')
const importState = existsSync(importStateFile)
  ? JSON.parse(readFileSync(importStateFile, 'utf8'))
  : { articles: {} }

function publicAssetUrl(sha256) {
  const url = assetUrls[sha256]
  if (url === undefined) return null
  if (typeof url !== 'string' || !(/^https:\/\/[^\s]+$/i.test(url) ||
      (allowLocalUrls && /^\/(?!\/)[^\s]+$/.test(url)))) {
    throw new Error(`图片 URL 映射无效：${sha256}`)
  }
  return url
}

function publicArticleUrl(sourcePath) {
  const url = articleUrls[sourcePath]
  if (url !== undefined && (typeof url !== 'string' || !(/^https:\/\/[^\s]+$/i.test(url) ||
      (allowLocalUrls && /^\/(?!\/)[^\s]+$/.test(url))))) {
    throw new Error(`文章 URL 映射无效：${sourcePath}`)
  }
  if (url) return url
  const id = importState.articles?.[sourcePath]?.id
  return typeof id === 'string' && id ? `/articles/${encodeURIComponent(id)}` : null
}

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)
  return match ? source.slice(match[0].length) : source
}

function insideDocs(target) {
  const relative = path.relative(docsRoot, target)
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
}

function resolveLocalImage(articlePath, reference) {
  const clean = reference.split(/[?#]/, 1)[0]
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

function codeFence(source) {
  const longest = Math.max(0, ...[...source.matchAll(/`+/g)].map((match) => match[0].length))
  return '`'.repeat(Math.max(3, longest + 1))
}

function codeLanguage(filename) {
  const extension = path.extname(filename).slice(1).toLowerCase()
  return { js: 'js', jsx: 'jsx', ts: 'ts', tsx: 'tsx', vue: 'vue', json: 'json', css: 'css' }[extension] ?? 'text'
}

function convertHtmlDemos(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const output = []
  let fence = null
  let converted = 0
  let interactionReplaced = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      const delimiter = fenceMatch[1]
      if (!fence) fence = delimiter
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null
      output.push(line)
      continue
    }
    if (fence) {
      output.push(line)
      continue
    }

    if (/^<!--/.test(trimmed)) {
      while (!lines[index].includes('-->') && index < lines.length - 1) index += 1
      converted += 1
      continue
    }

    const block = trimmed.match(/^<(script|style)\b([^>]*)>/i)
    if (block) {
      const section = [line]
      while (!lines[index].includes(`</${block[1]}>`) && index < lines.length - 1) {
        section.push(lines[++index])
      }
      const sample = section.join('\n')
      const inner = section.slice(1, -1).map((part) => part.trim()).filter(Boolean)
      if (block[1] === 'script' && inner.length > 0 && inner.every((part) => /^import\s/.test(part))) {
        converted += 1
        continue
      }
      const delimiter = codeFence(sample)
      output.push(`**原页面${block[1] === 'style' ? '样式' : '脚本'}示例：**`, '', `${delimiter}vue`, sample, delimiter, '')
      converted += 1
      continue
    }

    if (/^<[A-Z][\w]*\s*\/>$/.test(trimmed)) {
      output.push('原页面此处为交互演示，相关源码见下方。', '')
      interactionReplaced = true
      converted += 1
      continue
    }

    if (/^<(?:div|canvas)\b/i.test(trimmed)) {
      const section = [line]
      let depth = [...line.matchAll(/<div\b/gi)].length - [...line.matchAll(/<\/div>/gi)].length
      while (depth > 0 && index < lines.length - 1) {
        const next = lines[++index]
        section.push(next)
        depth += [...next.matchAll(/<div\b/gi)].length - [...next.matchAll(/<\/div>/gi)].length
      }
      const sample = section.join('\n')
      const delimiter = codeFence(sample)
      output.push('**原页面结构示例：**', '', `${delimiter}html`, sample, delimiter, '')
      converted += 1
      continue
    }

    output.push(line)
  }

  return { body: output.join('\n'), converted, interactionReplaced }
}

function hasRawHtmlOutsideFences(body) {
  let fence = null
  for (const line of body.split('\n')) {
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
    if (match) {
      const delimiter = match[1]
      if (!fence) fence = delimiter
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) fence = null
      continue
    }
    if (!fence && /^\s*<(?:\/?[A-Za-z][\w:-]*\b|!--)/.test(line)) return true
  }
  return false
}

function convertBody(articlePath, body, title, titleSource) {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const output = []
  const counts = { includes: 0, containers: 0, codeGroupLabels: 0, htmlDemos: 0 }
  const errors = []
  const warnings = []
  const containers = []
  let fence = null
  let titleRemoved = false

  for (const line of lines) {
    const trimmed = line.trim()
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      const delimiter = fenceMatch[1]
      if (!fence) {
        fence = delimiter
        if (containers.at(-1) === 'code-group') {
          const label = fenceMatch[2].match(/^\s*[^\s]*\s+\[([^\]]+)\]/)?.[1]
          if (label) {
            output.push(`**${label}**`, '')
            counts.codeGroupLabels += 1
          }
        }
      } else if (delimiter[0] === fence[0] && delimiter.length >= fence.length) {
        fence = null
      }
      output.push(line)
      continue
    }
    if (fence) {
      output.push(line)
      continue
    }

    if (!titleRemoved && titleSource === 'h1' && /^#\s+/.test(trimmed) && trimmed.slice(2).trim() === title) {
      titleRemoved = true
      continue
    }

    const include = line.match(/^\s{0,3}<<<\s+([^\s{]+)/)
    if (include) {
      const reference = include[1].split(/[#{]/, 1)[0]
      const includePath = path.resolve(path.dirname(articlePath), reference)
      if (!insideDocs(includePath) || !existsSync(includePath)) {
        errors.push(`引用文件不存在或超出 docs：${include[1]}`)
        output.push(line)
        continue
      }
      const source = readFileSync(includePath, 'utf8').replace(/\r\n/g, '\n').replace(/\n+$/, '')
      const delimiter = codeFence(source)
      output.push(`**源代码：\`${path.basename(includePath)}\`**`, '', `${delimiter}${codeLanguage(includePath)}`, source, delimiter)
      counts.includes += 1
      continue
    }

    const container = line.match(/^\s{0,3}:::\s*(.*)$/)
    if (container) {
      const content = container[1].trim()
      if (!content && containers.length) {
        containers.pop()
      } else {
        const kind = content.split(/\s+/, 1)[0] || 'plain'
        const label = content.slice(kind === 'plain' ? 0 : kind.length).trim()
        containers.push(kind)
        const captions = { warning: '警告', danger: '注意', info: '说明', tip: '提示', details: '详情' }
        if (captions[kind]) output.push(`> **${label || captions[kind]}**`, '')
      }
      counts.containers += 1
      continue
    }

    output.push(line)
  }

  if (containers.length) errors.push(`未闭合的 VitePress 容器：${containers.join('、')}`)
  if (fence) warnings.push('原文的 Markdown 代码块边界需预览确认')
  return { content: output.join('\n').trim(), counts, errors, warnings }
}

function renderMarkdown(result) {
  const rows = result.articles.map((article) => {
    const href = article.sourcePath.split('/').map(encodeURIComponent).join('/')
    return `| [${article.sourcePath}](../${href}) | ${article.status} | ${article.converted.includes} / ${article.converted.containers} | ${article.pending.join('；') || '无'} |`
  })
  return [
    '# CMS 草稿准备结果',
    '',
    `预检文章 ${result.summary.total} 篇；已准备草稿 ${result.summary.readyForDraft} 篇，待人工处理 ${result.summary.manualWork} 篇，阻断 ${result.summary.blocked} 篇；人工补充摘要 ${result.summary.curatedSummaries} 篇。`,
    '',
    '草稿数据包位于 `.cms-import/drafts.json`，仅包含可自动处理的文章，不会写入 CMS。每条记录保留源路径和正文哈希；导入器应据此记录映射，重复运行时更新原草稿而不是新建副本。',
    '',
    `本地图片共 ${result.summary.localImageReferences} 处，涉及 ${result.summary.localAssets} 个文件；已映射 ${result.summary.mappedLocalImages} 处。站内文章链接已映射 ${result.summary.mappedArticleLinks} 处。上传清单位于 \`.cms-import/assets.json\`。`,
    '',
    '自动转换会展开 `<<<` 代码引用、转换 VitePress 容器，并把原始 HTML 与 Vue 页面演示转换成静态源码示例。交互演示转换后的呈现须预览确认；本地图片和站内链接仍需处理。远程图片维持原地址，发布前须核对。',
    '',
    '| 源文件 | 状态 | 展开引用 / 转换容器 | 待处理项 |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}

const articles = []
const drafts = []
const assetMap = new Map()
for (const article of preflight.articles) {
  const articlePath = path.join(root, article.path)
  const body = splitFrontmatter(readFileSync(articlePath, 'utf8'))
  const sourceHash = createHash('sha256').update(body).digest('hex')
  if (sourceHash !== article.sourceHash) {
    throw new Error(`预检报告已过期，请先运行 pnpm cms:preflight：${article.path}`)
  }
  const imageIssues = article.issues.filter((issue) => issue.code === 'local_image')
  const mappedImages = []
  for (const issue of imageIssues) {
    const imagePath = resolveLocalImage(articlePath, issue.detail)
    if (!insideDocs(imagePath) || !existsSync(imagePath) || !statSync(imagePath).isFile()) continue
    const relativePath = path.relative(root, imagePath).split(path.sep).join('/')
    if (!assetMap.has(relativePath)) {
      const file = readFileSync(imagePath)
      assetMap.set(relativePath, {
        path: relativePath,
        sha256: createHash('sha256').update(file).digest('hex'),
        bytes: file.length,
        references: [],
      })
    }
    assetMap.get(relativePath).references.push({ sourcePath: article.path, target: issue.detail })
    const url = publicAssetUrl(assetMap.get(relativePath).sha256)
    if (url) mappedImages.push({ target: issue.detail, url })
  }
  const linkIssues = article.issues.filter((issue) => issue.code === 'local_article_link')
  const mappedLinks = linkIssues.flatMap((issue) => {
    const destination = issue.detail.split(/[?#]/, 1)[0]
    const targetPath = destination.startsWith('/')
      ? path.resolve(docsRoot, `.${destination}`)
      : path.resolve(path.dirname(articlePath), destination)
    if (!insideDocs(targetPath)) return []
    const sourcePath = path.relative(root, targetPath).split(path.sep).join('/')
    const url = publicArticleUrl(sourcePath)
    return url ? [{ target: issue.detail, url }] : []
  })
  const html = article.issues.some((issue) => issue.code === 'raw_html')
    ? convertHtmlDemos(body)
    : { body, converted: 0, interactionReplaced: false }
  const converted = convertBody(articlePath, html.body, article.title, article.titleSource)
  converted.counts.htmlDemos = html.converted
  converted.counts.mappedImages = mappedImages.length
  converted.counts.mappedLinks = mappedLinks.length
  for (const image of mappedImages) {
    converted.content = converted.content.replaceAll(`](${image.target})`, `](${image.url})`)
  }
  for (const link of mappedLinks) {
    converted.content = converted.content.replaceAll(`](${link.target})`, `](${link.url})`)
  }
  if (html.interactionReplaced) converted.warnings.push('交互演示已替换为源码说明，需预览确认')
  if (mappedLinks.some((link) => link.url.startsWith('/'))) {
    converted.warnings.push('站内链接已指向 CMS 文章 ID，目标发布后需确认可访问')
  }
  const rawHtmlRemaining = hasRawHtmlOutsideFences(converted.content)
  const pendingCodes = [
    ...new Set(article.issues.filter((issue) => issue.level === 'blocked' ||
      (issue.level === 'convert' && !automaticCodes.has(issue.code) &&
        !(issue.code === 'raw_html' && html.converted > 0 && !rawHtmlRemaining) &&
        !(issue.code === 'local_image' && mappedImages.length === imageIssues.length) &&
        !(issue.code === 'local_article_link' && mappedLinks.length === linkIssues.length))).map((issue) => issue.code)),
  ]
  const pending = [...pendingCodes, ...converted.errors]
  const status = article.status === 'blocked' || converted.errors.length
    ? 'blocked'
    : pendingCodes.length
      ? 'manual_work'
      : 'ready_for_draft'
  const item = {
    sourcePath: article.path,
    sourceHash,
    title: article.title,
    status,
    converted: converted.counts,
    pending,
    review: [
      ...new Set(article.issues.filter((issue) => issue.level === 'review' &&
        !(issue.code === 'missing_summary_candidate' && summaryOverrides[article.path])).map((issue) => issue.code)),
      ...converted.warnings,
    ],
  }
  articles.push(item)
  if (status === 'ready_for_draft') {
    const input = {
      title: article.title,
      summary: (summaryOverrides[article.path] || article.suggestedSummary).replace(/[*_`]/g, ''),
      content: converted.content,
      coverImage: null,
      tagIds: [],
    }
    drafts.push({
      sourcePath: article.path,
      sourceHash,
      preparedHash: createHash('sha256').update(JSON.stringify(input)).digest('hex'),
      input,
    })
  }
}

const assets = [...assetMap.values()].sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'))

const result = {
  schemaVersion: 1,
  summary: {
    total: articles.length,
    readyForDraft: drafts.length,
    manualWork: articles.filter((article) => article.status === 'manual_work').length,
    blocked: articles.filter((article) => article.status === 'blocked').length,
    expandedIncludes: articles.reduce((sum, article) => sum + article.converted.includes, 0),
    convertedContainers: articles.reduce((sum, article) => sum + article.converted.containers, 0),
    convertedHtmlDemos: articles.reduce((sum, article) => sum + article.converted.htmlDemos, 0),
    localAssets: assets.length,
    localImageReferences: assets.reduce((sum, asset) => sum + asset.references.length, 0),
    mappedLocalImages: articles.reduce((sum, article) => sum + article.converted.mappedImages, 0),
    mappedArticleLinks: articles.reduce((sum, article) => sum + article.converted.mappedLinks, 0),
    curatedSummaries: articles.filter((article) => Boolean(summaryOverrides[article.sourcePath])).length,
  },
  articles,
}

mkdirSync(stageRoot, { recursive: true })
writeFileSync(path.join(stageRoot, 'drafts.json'), `${JSON.stringify({ schemaVersion: 1, drafts }, null, 2)}\n`)
writeFileSync(path.join(stageRoot, 'assets.json'), `${JSON.stringify({ schemaVersion: 1, assets }, null, 2)}\n`)
writeFileSync(path.join(reportRoot, 'cms-import-prepared.json'), `${JSON.stringify(result, null, 2)}\n`)
writeFileSync(path.join(reportRoot, 'cms-import-prepared.md'), renderMarkdown(result))
process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`)

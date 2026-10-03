// Convert a Lexical editor state (the Payload rich text of a news post) to safe HTML.
// All text is escaped. Only safe URLs (http, https, mailto, relative) reach an attribute.

type LexNode = {
  type?: string
  text?: string
  format?: number | string
  indent?: number
  tag?: string
  listType?: string
  start?: number
  checked?: boolean
  headerState?: number
  colSpan?: number
  rowSpan?: number
  url?: string
  value?: unknown
  relationTo?: string
  fields?: Record<string, any>
  children?: LexNode[]
}

export type HtmlContext = {
  lang: string
  /** Turn a media URL from the CMS into a URL that a browser can load. */
  mediaUrl: (url: string) => string
}

type MediaLike = { url?: string; alt?: string; width?: number; height?: number }
export type GalleryImage = { image?: unknown; caption?: string | null }

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Return the URL when it is safe (http, https, mailto or relative). Return null otherwise. */
export function safeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  // eslint-disable-next-line no-control-regex
  const url = raw.replace(/[\u0000- \u007f-\u009f]/g, '')
  if (!url) return null
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url)
  if (scheme) return /^(https?|mailto)$/i.test(scheme[1]) ? url : null
  // A protocol-relative URL (//host) is not a relative path. A backslash can act as a slash in a browser.
  if (url.startsWith('//') || url.includes('\\')) return null
  return url
}

const isMedia = (m: unknown): m is MediaLike => !!m && typeof m === 'object' && typeof (m as MediaLike).url === 'string'

const dim = (n: unknown) => (typeof n === 'number' && n > 0 && Number.isFinite(n) ? Math.round(n) : null)

const ALIGN = new Set(['left', 'center', 'right', 'justify'])

/** Alignment and indent of a block as an inline style. */
function blockStyle(n: LexNode): string {
  const parts: string[] = []
  if (typeof n.format === 'string' && ALIGN.has(n.format)) parts.push(`text-align:${n.format}`)
  if (typeof n.indent === 'number' && n.indent > 0) parts.push(`margin-left:${Math.min(n.indent, 8) * 2}rem`)
  return parts.length ? ` style="${parts.join(';')}"` : ''
}

function linkHref(n: LexNode, ctx: HtmlContext): string | null {
  const f = n.fields ?? {}
  if (f.linkType === 'internal') {
    const doc = f.doc as { relationTo?: string; value?: { slug?: string } } | undefined
    const slug = doc?.value && typeof doc.value === 'object' ? doc.value.slug : undefined
    if (!slug || !/^[\w-]+$/.test(slug)) return null
    if (doc?.relationTo === 'news') return `/${ctx.lang}/novosti/${slug}`
    return slug === 'home' ? `/${ctx.lang}` : `/${ctx.lang}/${slug}`
  }
  return safeUrl(f.url ?? n.url)
}

function inline(n: LexNode, ctx: HtmlContext): string {
  switch (n.type) {
    case 'linebreak':
      return '<br>'
    case 'tab':
      return '&emsp;'
    case 'link':
    case 'autolink': {
      const inner = (n.children ?? []).map((c) => inline(c, ctx)).join('')
      const href = linkHref(n, ctx)
      if (!href) return inner
      const blank = n.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${esc(href)}"${blank}>${inner}</a>`
    }
  }
  if (n.children) return n.children.map((c) => inline(c, ctx)).join('')
  let t = esc(n.text ?? '')
  const f = typeof n.format === 'number' ? n.format : 0
  if (f & 16) t = `<code>${t}</code>`
  if (f & 32) t = `<sub>${t}</sub>`
  if (f & 64) t = `<sup>${t}</sup>`
  if (f & 4) t = `<s>${t}</s>`
  if (f & 8) t = `<u>${t}</u>`
  if (f & 2) t = `<em>${t}</em>`
  if (f & 1) t = `<strong>${t}</strong>`
  return t
}

const inlineAll = (n: LexNode, ctx: HtmlContext) => (n.children ?? []).map((c) => inline(c, ctx)).join('')

function imageTag(m: MediaLike, alt: string, ctx: HtmlContext): string {
  const w = dim(m.width)
  const h = dim(m.height)
  const size = w && h ? ` width="${w}" height="${h}"` : ''
  const src = safeUrl(ctx.mediaUrl(m.url ?? '')) ?? ''
  return `<img src="${esc(src)}" alt="${esc(alt)}"${size} loading="lazy" decoding="async" data-lb>`
}

function figure(m: MediaLike, alt: string, caption: string, ctx: HtmlContext, cls = 'media'): string {
  const cap = caption ? `<figcaption>${esc(caption)}</figcaption>` : ''
  return `<figure class="${cls}">${imageTag(m, alt, ctx)}${cap}</figure>`
}

const LAYOUTS = new Set(['grid', 'masonry', 'carousel'])

/** A gallery of figures. The body block and the post gallery both use this function. */
export function galleryHtml(
  images: GalleryImage[] | null | undefined,
  ctx: HtmlContext,
  opts: { title?: string | null; layout?: string | null } = {},
): string {
  const figures = (images ?? [])
    .filter((i) => isMedia(i.image))
    .map((i) => figure(i.image as MediaLike, (i.image as MediaLike).alt ?? '', i.caption ?? '', ctx, 'gallery-item'))
  if (!figures.length) return ''
  const layout = LAYOUTS.has(opts.layout ?? '') ? opts.layout : 'grid'
  const title = opts.title ? `<h3 class="gallery-title">${esc(opts.title)}</h3>` : ''
  return `<section class="gallery gallery-${layout}">${title}<div class="gallery-items">${figures.join('')}</div></section>`
}

function listItem(li: LexNode, ctx: HtmlContext, check: boolean): string {
  const kids = li.children ?? []
  const nested = kids.some((k) => k.type === 'list')
  const body = kids.map((k) => (k.type === 'list' ? block(k, ctx) : inline(k, ctx))).join('')
  const attrs = check && !nested ? ` data-checked="${li.checked ? 'true' : 'false'}"` : ''
  return `<li${attrs}>${body}</li>`
}

function table(n: LexNode, ctx: HtmlContext): string {
  const rows = (n.children ?? []).map((row) => {
    const cells = (row.children ?? []).map((cell) => {
      const header = typeof cell.headerState === 'number' && cell.headerState > 0
      const tag = header ? 'th' : 'td'
      const scope = header ? (cell.headerState === 2 ? ' scope="row"' : ' scope="col"') : ''
      const span =
        (dim(cell.colSpan) && cell.colSpan! > 1 ? ` colspan="${dim(cell.colSpan)}"` : '') +
        (dim(cell.rowSpan) && cell.rowSpan! > 1 ? ` rowspan="${dim(cell.rowSpan)}"` : '')
      // A cell holds paragraphs. Join the inline content so a cell has no extra margins.
      const inner = (cell.children ?? [])
        .map((c) => (c.type === 'paragraph' ? inlineAll(c, ctx) : block(c, ctx)))
        .join('<br>')
      return `<${tag}${scope}${span}>${inner}</${tag}>`
    })
    return `<tr>${cells.join('')}</tr>`
  })
  return `<div class="table-wrap"><table><tbody>${rows.join('')}</tbody></table></div>`
}

function codeBlock(f: Record<string, any>): string {
  const lang = typeof f.language === 'string' && /^[\w+#-]{1,20}$/.test(f.language) ? f.language : ''
  const cls = lang ? ` class="language-${esc(lang)}"` : ''
  const label = lang ? ` data-language="${esc(lang)}"` : ''
  return `<pre${label}><code${cls}>${esc(String(f.code ?? ''))}</code></pre>`
}

function block(n: LexNode, ctx: HtmlContext): string {
  switch (n.type) {
    case 'heading': {
      const tag = /^h[1-4]$/.test(n.tag ?? '') ? n.tag : 'h4'
      return `<${tag}${blockStyle(n)}>${inlineAll(n, ctx)}</${tag}>`
    }
    case 'quote':
      return `<blockquote${blockStyle(n)}>${inlineAll(n, ctx)}</blockquote>`
    case 'list': {
      const check = n.listType === 'check'
      const tag = n.listType === 'number' ? 'ol' : 'ul'
      const start = tag === 'ol' && dim(n.start) && n.start !== 1 ? ` start="${dim(n.start)}"` : ''
      const cls = check ? ' class="checklist"' : ''
      return `<${tag}${cls}${start}>${(n.children ?? []).map((li) => listItem(li, ctx, check)).join('')}</${tag}>`
    }
    case 'horizontalrule':
      return '<hr>'
    case 'table':
      return table(n, ctx)
    case 'upload': {
      const m = n.value
      if (n.relationTo !== 'media' || !isMedia(m)) return ''
      const f = n.fields ?? {}
      return figure(m, String(f.alt || m.alt || ''), String(f.caption ?? ''), ctx)
    }
    case 'block': {
      const f = n.fields ?? {}
      if (f.blockType === 'gallery') return galleryHtml(f.images, ctx, { title: f.title, layout: f.layout })
      if (f.blockType === 'Code') return codeBlock(f)
      return ''
    }
    case 'paragraph': {
      const inner = inlineAll(n, ctx)
      return inner ? `<p${blockStyle(n)}>${inner}</p>` : ''
    }
    default:
      return n.children ? `<p${blockStyle(n)}>${inlineAll(n, ctx)}</p>` : ''
  }
}

/** Convert a Lexical editor state to HTML. */
export function lexicalToHtml(body: unknown, ctx: HtmlContext): string {
  const root = (body as { root?: LexNode } | null)?.root
  return (root?.children ?? []).map((n) => block(n, ctx)).join('')
}

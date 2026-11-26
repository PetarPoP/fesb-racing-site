import { LANGS, type Lang } from '~/content'

// Head tags of the pages: title, description, canonical and language alternates, Open Graph, Twitter and
// JSON-LD. Each page route calls pageHead() with its own data. The layout (/$lang) sets the defaults and the
// JSON-LD of the organisation, which every page carries.

/** The public address of the site, without a trailing slash. Set SITE_URL at build time for a custom domain. */
export const SITE_URL: string = (typeof __SITE_URL__ === 'string' ? __SITE_URL__ : 'https://fesb-racing-site.pop-sites.workers.dev').replace(/\/$/, '')

export const SITE_NAME = 'FESB Racing'
/** The default share image (1200 × 630). */
export const OG_IMAGE = '/og.jpg'

const OG_LOCALE: Record<Lang, string> = { hr: 'hr_HR', en: 'en_US' }

export const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`)

/** The URL of a path in each language. `rest` is the path after the language, for example "/shop" or "". */
export const langUrl = (lang: Lang, rest: string) => `${SITE_URL}/${lang}${rest}`

/** Shorten a text for a meta description: whole words, at most about 160 characters. */
export function clip(text: string | undefined | null, max = 160) {
  const t = String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[,.;:—-]+$/, '')}…`
}

type JsonLd = Record<string, unknown>
type Meta = { title?: string; name?: string; property?: string; content?: string; 'script:ld+json'?: JsonLd }
type HeadLink = { rel: string; href: string; hrefLang?: string }

export type PageSeo = {
  lang: Lang
  /** The path after the language, for example "/shop/majica-crna", or "" for the home page. */
  rest: string
  title: string
  description?: string
  image?: string | null
  /** Open Graph type: website, article or product. */
  type?: 'website' | 'article' | 'product'
  /** A page that search engines should not index (cart, not found). */
  noindex?: boolean
  /** Extra JSON-LD objects of the page. */
  jsonLd?: JsonLd[]
  /** The pages above this one, for the breadcrumb, without the home page. */
  crumbs?: { name: string; rest: string }[]
  /** Only for the language alternates: a page that exists in one language only. */
  langs?: readonly Lang[]
  published?: string
}

/** The head of one page. Use it in the head() of a page route. */
export function pageHead(p: PageSeo): { meta: Meta[]; links: HeadLink[] } {
  const url = langUrl(p.lang, p.rest)
  const title = p.title.includes(SITE_NAME) ? p.title : `${p.title} — ${SITE_NAME}`
  const description = clip(p.description)
  const image = abs(p.image || OG_IMAGE)
  const langs = p.langs ?? LANGS
  const meta: Meta[] = [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),
    { name: 'robots', content: p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large' },
    { property: 'og:type', content: p.type ?? 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: title },
    ...(description ? [{ property: 'og:description', content: description }] : []),
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:locale', content: OG_LOCALE[p.lang] },
    ...langs.filter((l) => l !== p.lang).map((l) => ({ property: 'og:locale:alternate', content: OG_LOCALE[l] })),
    ...(p.published ? [{ property: 'article:published_time', content: p.published }] : []),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    ...(description ? [{ name: 'twitter:description', content: description }] : []),
    { name: 'twitter:image', content: image },
  ]
  if (p.crumbs) meta.push({ 'script:ld+json': breadcrumb(p.lang, [...p.crumbs, { name: p.title, rest: p.rest }]) })
  for (const j of p.jsonLd ?? []) meta.push({ 'script:ld+json': j })
  const links: HeadLink[] = p.noindex
    ? []
    : [
        { rel: 'canonical', href: url },
        ...langs.map((l) => ({ rel: 'alternate', hrefLang: l, href: langUrl(l, p.rest) })),
        { rel: 'alternate', hrefLang: 'x-default', href: langUrl(langs.includes('hr') ? 'hr' : langs[0], p.rest) },
      ]
  return { meta, links }
}

// ---------- JSON-LD ----------

const ORG_ID = `${SITE_URL}/#organization`

/** The club. Every page carries it, the other objects point to it by @id. */
export function organizationLd(o: { lang: Lang; description: string; email?: string; address?: string; sameAs?: string[] }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': ['SportsTeam', 'Organization'],
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: 'FESB Racing Team',
    url: `${SITE_URL}/${o.lang}`,
    logo: abs('/favicon.svg'),
    image: abs(OG_IMAGE),
    description: o.description,
    sport: 'Motorsport',
    foundingDate: '2010',
    ...(o.email ? { email: o.email } : {}),
    address: { '@type': 'PostalAddress', streetAddress: o.address || 'Ruđera Boškovića 32', postalCode: '21000', addressLocality: 'Split', addressCountry: 'HR' },
    parentOrganization: {
      '@type': 'CollegeOrUniversity',
      name: 'Fakultet elektrotehnike, strojarstva i brodogradnje (FESB), Sveučilište u Splitu',
      url: 'https://www.fesb.unist.hr',
    },
    ...(o.sameAs?.length ? { sameAs: o.sameAs } : {}),
  }
}

export function websiteLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: LANGS.map((l) => (l === 'hr' ? 'hr-HR' : 'en')),
    publisher: { '@id': ORG_ID },
  }
}

export function breadcrumb(lang: Lang, items: { name: string; rest: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: SITE_NAME, rest: '' }, ...items].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: langUrl(lang, it.rest),
    })),
  }
}

export function articleLd(a: { lang: Lang; rest: string; title: string; description?: string; image?: string | null; date?: string; kind: 'news' | 'blog' }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': a.kind === 'news' ? 'NewsArticle' : 'BlogPosting',
    headline: a.title.slice(0, 110),
    ...(a.description ? { description: clip(a.description, 300) } : {}),
    image: [abs(a.image || OG_IMAGE)],
    ...(a.date ? { datePublished: a.date, dateModified: a.date } : {}),
    inLanguage: a.lang,
    mainEntityOfPage: langUrl(a.lang, a.rest),
    author: { '@id': ORG_ID, '@type': 'Organization', name: SITE_NAME },
    publisher: { '@id': ORG_ID, '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: abs('/favicon.svg') } },
  }
}

export function productLd(p: { lang: Lang; rest: string; name: string; description?: string; images: string[]; price: number; inStock: boolean; category?: string; sku: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    ...(p.description ? { description: clip(p.description, 500) } : {}),
    image: p.images.length ? p.images.map(abs) : [abs(OG_IMAGE)],
    ...(p.category ? { category: p.category } : {}),
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: langUrl(p.lang, p.rest),
      priceCurrency: 'EUR',
      price: p.price.toFixed(2),
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORG_ID, '@type': 'Organization', name: SITE_NAME },
    },
  }
}

export function vehicleLd(v: { lang: Lang; rest: string; name: string; kind: 'car' | 'bike'; description?: string; image?: string | null; year?: string; specs: [string, string][] }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': v.kind === 'bike' ? 'Motorcycle' : 'Car',
    name: v.name,
    url: langUrl(v.lang, v.rest),
    ...(v.description ? { description: clip(v.description, 500) } : {}),
    ...(v.image ? { image: abs(v.image) } : {}),
    ...(v.year ? { productionDate: v.year } : {}),
    manufacturer: { '@id': ORG_ID, '@type': 'Organization', name: SITE_NAME },
    ...(v.specs.length ? { additionalProperty: v.specs.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) } : {}),
  }
}

export function itemListLd(lang: Lang, items: { name: string; rest: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: langUrl(lang, it.rest) })),
  }
}

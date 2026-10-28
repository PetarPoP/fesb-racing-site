// Loader layer for the FESB Racing CMS (Payload, folder cms/).
// Each function returns CMS data, or null when the CMS is down, slow or empty.
// The caller then uses the static data, or shows an empty state. The site never fails because of the CMS.
import { createCmsClient, type Locale, type Media, type NewsPost, type Partner as CmsPartner } from '../../cms/client/cms-client'
import type { Content, Lang } from '~/content'
import type { Partner } from '~/lib/partners'
import type { News, PostKind } from '~/lib/format'
export type { PostKind }
import { galleryHtml, lexicalToHtml, type HtmlContext } from './lexical'
import { VEHICLES, vehicleView, type Img, type VehicleView } from '~/lib/projects'

/** The CMS Worker sometimes needs 2–4 s on a cold start. 2 s was too short: pages were built without news and logos. */
const TIMEOUT_MS = 5000
const TTL_MS = 60_000
/** A failed call is cached for a short time, so a CMS that is down does not add the timeout to each request. */
const FAIL_TTL_MS = 10_000

const baseUrl = () => (process.env.CMS_URL || 'http://localhost:3100').replace(/\/$/, '')
/** The base URL that a browser uses for media files. It can differ from CMS_URL (for example a service binding). */
const publicUrl = () => (process.env.CMS_PUBLIC_URL || baseUrl()).replace(/\/$/, '')

/**
 * Fetch with a time limit that covers the body too. The body is read here, so a timeout or a cut connection
 * rejects this promise (the cache then uses null). An abort while the caller was still reading a gzip body
 * crashed the Worker request, and the prerender wrote an empty page.
 */
const timedFetch: typeof fetch = async (input, init) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal })
    const body = await res.arrayBuffer()
    const headers = new Headers(res.headers)
    headers.delete('content-encoding')
    headers.delete('content-length')
    return new Response(body, { status: res.status, statusText: res.statusText, headers })
  } finally {
    clearTimeout(timer)
  }
}
const client = () => createCmsClient({ baseUrl: baseUrl(), fetcher: timedFetch })

const cache = new Map<string, { at: number; ttl: number; value: Promise<unknown> }>()

/** Run a CMS call with the cache. Return null on an error or an empty result. */
function cached<T>(key: string, run: () => Promise<T | null | undefined>): Promise<T | null> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < hit.ttl) return hit.value as Promise<T | null>
  const entry = { at: Date.now(), ttl: TTL_MS, value: Promise.resolve(null as unknown) }
  entry.value = run()
    .then((v) => v ?? null)
    .catch(() => {
      entry.ttl = FAIL_TTL_MS
      return null
    })
  cache.set(key, entry)
  return entry.value as Promise<T | null>
}

const nonEmpty = <T>(a: T[] | undefined | null) => (a && a.length > 0 ? a : null)

/** Read a collection that the client has no method for. */
async function listDocs<T>(collection: string, locale: Locale, extra: Record<string, string> = {}) {
  const url = new URL(`${baseUrl()}/api/${collection}`)
  const params = { locale, depth: '1', limit: '100', ...extra }
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await timedFetch(url.toString())
  if (!res.ok) throw new Error(`CMS ${res.status} for ${url.pathname}`)
  return nonEmpty(((await res.json()) as { docs: T[] }).docs)
}

/** Read a global that the client has no type for. */
async function getGlobalDoc<T>(slug: string, locale: Locale) {
  const url = new URL(`${baseUrl()}/api/globals/${slug}`)
  url.searchParams.set('locale', locale)
  url.searchParams.set('depth', '1')
  const res = await timedFetch(url.toString())
  if (!res.ok) throw new Error(`CMS ${res.status} for ${url.pathname}`)
  return (await res.json()) as T
}

const mediaUrl = (m: unknown) => {
  const url = m && typeof m === 'object' ? (m as Media).url : undefined
  return url ? (/^https?:/.test(url) ? url : publicUrl() + url) : null
}

// ---------- partners ----------

const TIER = { university: 1, main: 2, partner: 3, supporter: 4 } as const

export function getCmsPartners(lang: Lang): Promise<Partner[] | null> {
  return cached(`partners:${lang}`, async () => {
    const docs = nonEmpty((await client().getPartners({ locale: lang })).docs.filter((p) => p.active !== false))
    if (!docs) return null
    return docs.map((p: CmsPartner, i): Partner => ({
      name: p.name,
      key: `cms${p.id}`,
      domain: p.url ?? '',
      ratio: p.logoRatio || 3,
      tier: TIER[p.tier] ?? 4,
      logoUrl: mediaUrl(p.logo) ?? undefined,
    }))
  })
}

// ---------- news ----------

const htmlContext = (lang: Lang): HtmlContext => ({
  lang,
  mediaUrl: (url) => (/^https?:/.test(url) ? url : publicUrl() + url),
})

/** The label of the post gallery. */
const GALLERY_TITLE: Record<Lang, string> = { hr: 'Galerija', en: 'Gallery' }

/** Map a CMS post to the news shape of the site. The locale value fills both language columns. */
function toNews(p: NewsPost, lang: Lang): News {
  const date = (p.publishedAt ?? '').slice(0, 10) || '1970-01-01'
  const title = p.title
  const tag = p.tags?.[0] ?? ''
  const excerpt = p.excerpt ?? ''
  const ctx = htmlContext(lang)
  const body = lexicalToHtml(p.body, ctx)
  const gallery = galleryHtml(p.gallery, ctx, { title: GALLERY_TITLE[lang] })
  return {
    id: p.id,
    slug: p.slug,
    date,
    imageUrl: mediaUrl(p.cover),
    titleHr: title,
    titleEn: title,
    tagHr: tag,
    tagEn: tag,
    excerptHr: excerpt,
    excerptEn: excerpt,
    bodyHr: body,
    bodyEn: body,
    galleryHr: gallery,
    galleryEn: gallery,
  }
}

/**
 * Two kinds of posts. "news" are the short club news at the top of the home page (CMS collection "announcements").
 * "blog" are the longer stories at the bottom (CMS collection "news", which held all posts before the split).
 */
const POST_COLLECTION: Record<PostKind, string> = { news: 'announcements', blog: 'news' }

export function getCmsPosts(kind: PostKind, lang: Lang): Promise<News[] | null> {
  return cached(`${kind}:${lang}`, async () => {
    const docs = await listDocs<NewsPost>(POST_COLLECTION[kind], lang, { sort: '-publishedAt', limit: '200' })
    const live = nonEmpty(docs?.filter((p) => p._status !== 'draft'))
    return live ? live.map((p) => toNews(p, lang)) : null
  })
}

export function getCmsPostBySlug(kind: PostKind, slug: string, lang: Lang): Promise<News | null> {
  return cached(`${kind}:${lang}:${slug}`, async () => {
    const docs = await listDocs<NewsPost>(POST_COLLECTION[kind], lang, { limit: '1', 'where[slug][equals]': slug })
    const p = docs?.[0]
    return p && p._status !== 'draft' ? toNews(p, lang) : null
  })
}

// ---------- vehicles ----------

/** The two vehicle documents of the old schema ("fs", "ms") described the programs, not vehicles. They are skipped. */
const LEGACY_VEHICLES = new Set(['fs', 'ms'])

const mediaImg = (m: unknown): Img | null => {
  const url = mediaUrl(m)
  if (!url) return null
  const md = m as Media
  return { src: url, sm: url, w: md.width || 1600, h: md.height || 1000 }
}

const lines = (t: unknown) =>
  String(t ?? '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)

/**
 * All vehicles in one language. A CMS list replaces the static list, so a vehicle added in the admin shows on the site.
 * A CMS vehicle without photos, data or text keeps those of the static vehicle with the same slug.
 */
export async function getCmsVehicles(lang: Lang): Promise<VehicleView[]> {
  const docs = await cached(`vehicles:${lang}`, () => listDocs<Doc>('vehicles', lang, { sort: 'order', depth: '1' }))
  const fallback = VEHICLES.map((v) => vehicleView(v, lang))
  const list = docs?.filter((d) => d.slug && !LEGACY_VEHICLES.has(d.slug) && d.active !== false)
  if (!list?.length) return fallback
  return list.map((d): VehicleView => {
    const base = fallback.find((v) => v.id === d.slug)
    const images = [mediaImg(d.cover), ...((d.gallery as { image?: unknown }[] | undefined) ?? []).map((g) => mediaImg(g.image))].filter(
      (x): x is Img => Boolean(x),
    )
    const specs = ((d.specs as { key?: string; value?: string }[] | undefined) ?? [])
      .filter((x) => x.key && x.value)
      .map((x) => [x.key!, x.value!] as [string, string])
    const sections = ((d.sections as { title?: string; text?: string }[] | undefined) ?? [])
      .filter((x) => x.title && x.text)
      .map((x) => ({ t: x.title!, d: x.text! }))
    const awards = lines(d.results)
    return {
      id: d.slug,
      project: d.kind === 'bike' ? 'motostudent' : 'formula-student',
      name: d.name || base?.name || d.slug,
      year: d.season || (d.year ? String(d.year) : base?.year ?? ''),
      images: images.length ? images : (base?.images ?? []),
      specs: specs.length ? specs : (base?.specs ?? []),
      awards: awards.length ? awards : (base?.awards ?? []),
      sections: sections.length ? sections : (base?.sections ?? []),
      comp: base?.comp ?? null,
      description: d.description || undefined,
    }
  })
}

// ---------- page content ----------

/** Texts of the "homepage" global: the field names are the Content keys. */
const HOME_TEXTS = [
  'heroA', 'heroB', 'heroSub', 'heroCta2', 'newsTitle', 'teamsTitle', 'teamsCardsText', 'carTitle', 'carIntro',
  'vehTitle', 'compTitle', 'sponTitle', 'sponText', 'sponCta', 'blogTitle', 'contactTitle',
] as const satisfies readonly (keyof Content)[]

type Doc = Record<string, any>

/**
 * Merge the CMS data into the static content of one language.
 * A field that the CMS does not return keeps the static value.
 * Team order, team codes and the CAD part mapping always come from the static data.
 */
export async function getCmsContent(lang: Lang, base: Content): Promise<Content> {
  const c = client()
  const [stats, ticker, footer, join, settings, teams, comps, home, projects] = await Promise.all([
    cached(`g:stats:${lang}`, () => c.getGlobal('stats', { locale: lang })),
    cached(`g:ticker:${lang}`, () => c.getGlobal('ticker', { locale: lang })),
    cached(`g:footer:${lang}`, () => c.getGlobal('footer', { locale: lang })),
    cached(`g:joinCta:${lang}`, () => c.getGlobal('joinCta', { locale: lang })),
    cached(`g:siteSettings:${lang}`, () => c.getGlobal('siteSettings', { locale: lang })),
    cached(`teams:${lang}`, () => listDocs<Doc>('teams', lang, { sort: 'order' })),
    cached(`competitions:${lang}`, () => listDocs<Doc>('competitions', lang, { sort: 'order' })),
    cached(`g:homepage:${lang}`, () => getGlobalDoc<Doc>('homepage', lang)),
    cached(`projects:${lang}`, () => listDocs<Doc>('projects', lang)),
  ])

  const out: Content = { ...base }

  const st = nonEmpty(stats?.items)
  if (st) out.stats = st.map((s) => ({ v: s.value, l: s.label }))

  const tk = nonEmpty(ticker?.items)
  if (tk) out.ticker = tk.map((t) => t.text)

  if (footer) {
    if (footer.copyright) out.foot = footer.copyright
    const leaders = nonEmpty((footer as { contacts?: Doc[] }).contacts)
    if (leaders)
      out.leaders = leaders.map((p) => ({
        role: p.role ?? '',
        name: p.name ?? '',
        email: p.email || undefined,
        phone: p.phone || undefined,
        photo: mediaUrl(p.photo) ?? undefined,
      }))
    if (footer.followHeading) out.footFollow = footer.followHeading
  }

  if (home) {
    for (const k of HOME_TEXTS) if (typeof home[k] === 'string' && home[k].trim()) out[k] = home[k]
    const parts = nonEmpty(home.carParts as { part?: string; name?: string }[] | undefined)
    if (parts) out.carParts = Object.fromEntries(parts.filter((p) => p.part && p.name).map((p) => [p.part!, p.name!]))
  }

  if (projects)
    out.projects = projects.map((d) => ({
      id: d.key,
      name: d.name || undefined,
      intro: d.intro ? String(d.intro).split(/\n\s*\n/).map((x: string) => x.trim()).filter(Boolean) : undefined,
      logo: { dark: mediaUrl(d.logoDark) ?? undefined, light: mediaUrl(d.logoLight) ?? undefined },
    }))

  if (join) {
    if (join.title) out.joinTitle = join.title
    if (join.text) out.joinText = join.text
    if (join.companyTitle) out.companyTitle = join.companyTitle
    if (join.companyText) out.companyText = join.companyText
    if (join.buttonLabel) out.cta = join.buttonLabel
  }

  if (settings) {
    if (settings.contact?.email) out.mail = settings.contact.email
    if (settings.contact?.address) out.addr = settings.contact.address
    const soc = nonEmpty(settings.social)
    if (soc) out.socials = Object.fromEntries(soc.map((s) => [s.platform, s.url]))
    const shop = (settings as { shop?: { enabled?: boolean; storeDomain?: string; storefrontToken?: string } }).shop
    if (shop?.storeDomain && shop.storefrontToken)
      out.shop = { enabled: Boolean(shop.enabled), domain: shop.storeDomain, token: shop.storefrontToken }
  }

  // The CMS team list (in its order) replaces the static one once it holds the current team codes.
  // Before the six-team migration the CMS still has the old codes, and the static teams stay.
  if (teams && teams.some((d) => base.teams.some((t) => t.code === d.code))) {
    out.teams = teams.map((d) => {
      const t = base.teams.find((x) => x.code === d.code)
      const tags = nonEmpty((d.tags as { tag: string }[] | undefined)?.map((x) => x.tag))
      const lead = (d.lead ?? {}) as { name?: string; email?: string; phone?: string; photo?: unknown }
      return {
        code: d.code,
        name: d.name || t?.name || d.code,
        d: d.description || t?.d || '',
        about: d.about || t?.about || d.description || '',
        tags: tags ?? t?.tags ?? [],
        icon: mediaUrl(d.icon) ?? t?.icon ?? '/img/timovi/kon.png',
        lead: {
          name: lead.name || t?.lead.name || '',
          email: lead.email || t?.lead.email,
          phone: lead.phone || t?.lead.phone,
          photo: mediaUrl(lead.photo) ?? t?.lead.photo,
        },
      }
    })
  }

  // The CMS list replaces the static list, so a competition added in the admin shows on the site.
  // A competition without map values keeps the map of the static entry with the same name, or else is left out.
  if (comps) {
    const list = comps
      .filter((d) => d.active !== false)
      .map((d): Content['comps'][number] | null => {
        const k = base.comps.find((x) => x.name === d.name)
        const m = d.map ?? {}
        const hasMap = [m.lat, m.lng, m.spanLat, m.spanLng].every((n) => typeof n === 'number')
        if (!hasMap && !k) return null
        return {
          cc: d.country || k?.cc || '',
          name: d.name,
          place: d.place || k?.place || '',
          sub: d.circuit || k?.sub || '',
          venue: d.venue || k?.venue || '',
          type: d.type === 'FS' || d.type === 'MS' ? d.type : (k?.type ?? 'FS'),
          c: hasMap ? [m.lat, m.lng] : k!.c,
          z: hasMap ? [m.spanLat, m.spanLng] : k!.z,
          url: d.link || k?.url,
        }
      })
      .filter((x): x is Content['comps'][number] => x !== null)
    if (list.length) out.comps = list
  }

  return out
}

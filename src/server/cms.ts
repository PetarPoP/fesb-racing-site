// Loader layer for the FESB Racing CMS (Payload, folder cms/).
// Each function returns CMS data, or null when the CMS is down, slow or empty.
// The caller then uses the static data, or shows an empty state. The site never fails because of the CMS.
import { createCmsClient, type Locale, type Media, type NewsPost, type Partner as CmsPartner } from '../../cms/client/cms-client'
import type { Content, Lang } from '~/content'
import type { Partner } from '~/lib/partners'
import type { News } from '~/lib/format'
import { galleryHtml, lexicalToHtml, type HtmlContext } from './lexical'

/** The CMS Worker sometimes needs 2–4 s on a cold start. 2 s was too short: pages were built without news and logos. */
const TIMEOUT_MS = 5000
const TTL_MS = 60_000
/** A failed call is cached for a short time, so a CMS that is down does not add the timeout to each request. */
const FAIL_TTL_MS = 10_000

const baseUrl = () => (process.env.CMS_URL || 'http://localhost:3100').replace(/\/$/, '')
/** The base URL that a browser uses for media files. It can differ from CMS_URL (for example a service binding). */
const publicUrl = () => (process.env.CMS_PUBLIC_URL || baseUrl()).replace(/\/$/, '')

const timedFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
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

export function getCmsNews(lang: Lang): Promise<News[] | null> {
  return cached(`news:${lang}`, async () => {
    const docs = nonEmpty((await client().getNews({ locale: lang, limit: 100 })).docs.filter((p) => p._status !== 'draft'))
    return docs ? docs.map((p) => toNews(p, lang)) : null
  })
}

export function getCmsNewsBySlug(slug: string, lang: Lang): Promise<News | null> {
  return cached(`news:${lang}:${slug}`, async () => {
    const p = await client().getNewsBySlug(slug, { locale: lang })
    return p && p._status !== 'draft' ? toNews(p, lang) : null
  })
}

// ---------- page content ----------

type Doc = Record<string, any>

/**
 * Merge the CMS data into the static content of one language.
 * A field that the CMS does not return keeps the static value.
 * Team order, team codes and the CAD part mapping always come from the static data.
 */
export async function getCmsContent(lang: Lang, base: Content): Promise<Content> {
  const c = client()
  const [stats, ticker, footer, join, settings, teams, vehicles, comps] = await Promise.all([
    cached(`g:stats:${lang}`, () => c.getGlobal('stats', { locale: lang })),
    cached(`g:ticker:${lang}`, () => c.getGlobal('ticker', { locale: lang })),
    cached(`g:footer:${lang}`, () => c.getGlobal('footer', { locale: lang })),
    cached(`g:joinCta:${lang}`, () => c.getGlobal('joinCta', { locale: lang })),
    cached(`g:siteSettings:${lang}`, () => c.getGlobal('siteSettings', { locale: lang })),
    cached(`teams:${lang}`, () => listDocs<Doc>('teams', lang, { sort: 'order' })),
    cached(`vehicles:${lang}`, () => listDocs<Doc>('vehicles', lang)),
    cached(`competitions:${lang}`, () => listDocs<Doc>('competitions', lang, { sort: 'order' })),
  ])

  const out: Content = { ...base }

  const st = nonEmpty(stats?.items)
  if (st) out.stats = st.map((s) => ({ v: s.value, l: s.label }))

  const tk = nonEmpty(ticker?.items)
  if (tk) out.ticker = tk.map((t) => t.text)

  if (footer) {
    if (footer.copyright) out.foot = footer.copyright
    if (footer.teamHeading) out.footTeam = footer.teamHeading
    if (footer.programHeading) out.footProgram = footer.programHeading
    if (footer.followHeading) out.footFollow = footer.followHeading
  }

  if (join) {
    if (join.title) out.joinTitle = join.title
    if (join.text) out.joinText = join.text
    if (join.buttonLabel) out.cta = join.buttonLabel
  }

  if (settings) {
    if (settings.contact?.email) out.mail = settings.contact.email
    if (settings.contact?.address) out.addr = settings.contact.address
    const soc = nonEmpty(settings.social)
    if (soc) out.socials = Object.fromEntries(soc.map((s) => [s.platform, s.url]))
  }

  if (teams) {
    out.teams = base.teams.map((t) => {
      const d = teams.find((x) => x.code === t.code)
      if (!d) return t
      const tags = nonEmpty((d.tags as { tag: string }[] | undefined)?.map((x) => x.tag))
      return { ...t, name: d.name || t.name, d: d.description || t.d, tags: tags ?? t.tags }
    })
  }

  if (vehicles) {
    out.vehicles = base.vehicles.map((v) => {
      const d = vehicles.find((x) => x.slug === v.id)
      if (!d) return v
      const cover = mediaUrl(d.cover)
      return { ...v, name: d.name || v.name, d: d.description || v.d, ...(cover ? { src: cover } : {}) }
    })
  }

  if (comps) {
    out.comps = base.comps.map((k) => {
      const d = comps.find((x) => x.name === k.name)
      if (!d) return k
      const m = d.map ?? {}
      const hasMap = [m.lat, m.lng, m.spanLat, m.spanLng].every((n) => typeof n === 'number')
      return {
        ...k,
        place: d.place || k.place,
        sub: d.circuit || k.sub,
        venue: d.venue || k.venue,
        type: d.type === 'FS' || d.type === 'MS' ? d.type : k.type,
        ...(hasMap ? { c: [m.lat, m.lng] as [number, number], z: [m.spanLat, m.spanLng] as [number, number] } : {}),
      }
    })
  }

  return out
}

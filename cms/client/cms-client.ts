/**
 * Small typed client for the FESB Racing CMS (Payload REST API).
 * It uses only fetch, so it runs in a Worker, in Node and in the browser.
 * It does not import Payload. The types below match src/payload-types.ts.
 */

export type Locale = 'hr' | 'en'

export type Media = { id: number; url: string; alt?: string; width?: number; height?: number; filename?: string }

export type Partner = {
  id: number
  name: string
  logo: number | Media
  url?: string | null
  tier: 'university' | 'main' | 'partner' | 'supporter'
  order?: number | null
  logoRatio?: number | null
  plainLogo?: boolean | null
  active?: boolean | null
}

export type NewsPost = {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  body?: unknown
  gallery?: { id?: string | null; image?: number | Media | null; caption?: string | null }[] | null
  cover?: number | Media | null
  publishedAt?: string | null
  tags?: string[] | null
  meta?: { title?: string | null; description?: string | null; image?: number | Media | null }
  _status?: 'draft' | 'published'
}

export type Stats = { items?: { value: string; label: string }[] }
export type Ticker = { items?: { text: string }[] }
export type Footer = {
  copyright?: string
  teamHeading?: string
  programHeading?: string
  followHeading?: string
  links?: { label: string; url: string }[]
}
export type JoinCta = { title: string; text?: string; buttonLabel?: string }
export type SiteSettings = {
  name: string
  contact?: { email?: string; phone?: string; address?: string }
  social?: { platform: string; url: string }[]
}
export type GlobalMap = { stats: Stats; ticker: Ticker; footer: Footer; joinCta: JoinCta; siteSettings: SiteSettings }

export type Paged<T> = { docs: T[]; totalDocs: number; limit: number; page: number; totalPages: number }

export type RequestOptions = {
  locale?: Locale
  /** Return the latest draft. It needs a token (see "token" in the client options). */
  draft?: boolean
  /** Depth of relationship population. The default is 1. */
  depth?: number
}

export type ClientOptions = {
  /** Base URL of the CMS, for example https://cms.example.com. Ignored when "fetcher" is a service binding. */
  baseUrl: string
  /** Use a service binding in a Worker: pass env.CMS.fetch.bind(env.CMS). */
  fetcher?: typeof fetch
  /** User API key or JWT. Needed only for drafts. Format: "users API-Key <key>" or "JWT <token>". */
  token?: string
}

export function createCmsClient({ baseUrl, fetcher = fetch, token }: ClientOptions) {
  const base = baseUrl.replace(/\/$/, '')

  async function get<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}) {
    const url = new URL(`${base}/api${path}`)
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v))
    const res = await fetcher(url.toString(), { headers: token ? { Authorization: token } : undefined })
    if (!res.ok) throw new Error(`CMS ${res.status} for ${url.pathname}`)
    return (await res.json()) as T
  }

  const common = (o: RequestOptions) => ({ locale: o.locale ?? 'hr', draft: o.draft, depth: o.depth ?? 1 })

  return {
    /** Active partners, sorted by order. */
    getPartners: (o: RequestOptions & { tier?: Partner['tier'] } = {}) =>
      get<Paged<Partner>>('/partners', {
        ...common(o),
        limit: 200,
        sort: 'order',
        ...(o.tier ? { 'where[tier][equals]': o.tier } : {}),
      }),

    /** Published news, newest first. */
    getNews: (o: RequestOptions & { limit?: number; page?: number } = {}) =>
      get<Paged<NewsPost>>('/news', { ...common(o), limit: o.limit ?? 20, page: o.page, sort: '-publishedAt' }),

    /** One post by slug, or null. */
    async getNewsBySlug(slug: string, o: RequestOptions = {}) {
      const res = await get<Paged<NewsPost>>('/news', { ...common(o), limit: 1, 'where[slug][equals]': slug })
      return res.docs[0] ?? null
    },

    /** One global: stats, ticker, footer, joinCta or siteSettings. */
    getGlobal: <K extends keyof GlobalMap>(slug: K, o: RequestOptions = {}) =>
      get<GlobalMap[K]>(`/globals/${slug}`, common(o)),
  }
}

export type CmsClient = ReturnType<typeof createCmsClient>

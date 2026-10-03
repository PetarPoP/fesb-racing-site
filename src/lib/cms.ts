import { createServerFn } from '@tanstack/react-start'
import { content, isLang, type Lang } from '~/content'
import { PARTNERS } from '~/lib/partners'
import { getCmsContent, getCmsNews, getCmsNewsBySlug, getCmsPartners } from '~/server/cms'

// The CMS (cms/) is the only source of news. A CMS that is down or empty gives an empty list.
// The static data in src/content.ts and src/lib/partners.ts is the fallback for the other sections.

const slugInput = (slug: unknown) => String(slug ?? '').slice(0, 100)
const langInput = (lang: unknown): Lang => (isLang(lang) ? lang : 'hr')
const newsInput = (d: unknown) => {
  const o = (d ?? {}) as { slug?: unknown; lang?: unknown }
  return { slug: slugInput(o.slug), lang: langInput(o.lang) }
}

async function newsCards(lang: Lang, limit?: number) {
  const cms = (await getCmsNews(lang)) ?? []
  // A card does not need the body. Leave it out of the page data.
  const cards = cms.map(({ bodyHr, bodyEn, galleryHr, galleryEn, ...card }) => card)
  return limit ? cards.slice(0, limit) : cards
}

/** Page content of one language: static text with the CMS values on top. */
export const getSiteContent = createServerFn({ method: 'GET' })
  .validator(langInput)
  .handler(({ data }) => getCmsContent(data, content[data]))

export const getHome = createServerFn({ method: 'GET' })
  .validator(langInput)
  .handler(async ({ data: lang }) => {
    const [news, partners, c] = await Promise.all([
      newsCards(lang, 4),
      getCmsPartners(lang),
      getCmsContent(lang, content[lang]),
    ])
    return { news, partners: partners ?? PARTNERS, c }
  })

export const getNewsList = createServerFn({ method: 'GET' })
  .validator(langInput)
  .handler(({ data }) => newsCards(data))

export const getNews = createServerFn({ method: 'GET' })
  .validator(newsInput)
  .handler(({ data }) => getCmsNewsBySlug(data.slug, data.lang))

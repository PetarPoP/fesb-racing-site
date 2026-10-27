import { createServerFn } from '@tanstack/react-start'
import { content, isLang, type Lang } from '~/content'
import { PARTNERS } from '~/lib/partners'
import { getCmsContent, getCmsPartners, getCmsPostBySlug, getCmsPosts, type PostKind } from '~/server/cms'

// The CMS (cms/) is the only source of news and blog posts. A CMS that is down or empty gives an empty list.
// The static data in src/content.ts and src/lib/partners.ts is the fallback for the other sections.

const slugInput = (slug: unknown) => String(slug ?? '').slice(0, 100)
const langInput = (lang: unknown): Lang => (isLang(lang) ? lang : 'hr')
const kindInput = (k: unknown): PostKind => (k === 'blog' ? 'blog' : 'news')
const listInput = (d: unknown) => {
  const o = (d ?? {}) as { kind?: unknown; lang?: unknown }
  return { kind: kindInput(o.kind), lang: langInput(o.lang) }
}
const postInput = (d: unknown) => {
  const o = (d ?? {}) as { kind?: unknown; slug?: unknown; lang?: unknown }
  return { kind: kindInput(o.kind), slug: slugInput(o.slug), lang: langInput(o.lang) }
}

async function postCards(kind: PostKind, lang: Lang, limit?: number) {
  const cms = (await getCmsPosts(kind, lang)) ?? []
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
    const [news, blog, partners, c] = await Promise.all([
      postCards('news', lang, 3),
      postCards('blog', lang, 4),
      getCmsPartners(lang),
      getCmsContent(lang, content[lang]),
    ])
    return { news, blog, partners: partners ?? PARTNERS, c }
  })

export const getPostList = createServerFn({ method: 'GET' })
  .validator(listInput)
  .handler(({ data }) => postCards(data.kind, data.lang))

export const getPost = createServerFn({ method: 'GET' })
  .validator(postInput)
  .handler(({ data }) => getCmsPostBySlug(data.kind, data.slug, data.lang))

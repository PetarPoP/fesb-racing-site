import { createFileRoute, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NewsArticle, NotFound } from '~/components/Cms'
import { getNews } from '~/lib/cms'
import { pick } from '~/lib/format'

export const Route = createFileRoute('/$lang/novosti/$slug')({
  loader: async ({ params }) => {
    const n = await getNews({ data: { slug: params.slug, lang: params.lang } })
    if (!n) throw notFound()
    return n
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const lang = params.lang as Lang
    const title = pick(loaderData, 'title', lang)
    const desc = pick(loaderData, 'excerpt', lang)
    return {
      meta: [
        { title: `${title} — FESB Racing` },
        { name: 'description', content: desc },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        ...(loaderData.imageUrl ? [{ property: 'og:image', content: loaderData.imageUrl }] : []),
      ],
    }
  },
  component: NewsPage,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function NewsPage() {
  const lang = Route.useParams().lang as Lang
  return <NewsArticle n={Route.useLoaderData()} lang={lang} c={content[lang]} />
}

import { createFileRoute, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NewsArticle, NotFound } from '~/components/Cms'
import { getPost } from '~/lib/cms'
import { pick } from '~/lib/format'

export const Route = createFileRoute('/$lang/blog/$slug')({
  loader: async ({ params }) => {
    const n = await getPost({ data: { kind: 'blog', slug: params.slug, lang: params.lang } })
    if (n) return n
    throw notFound()
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
  component: PostPage,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function PostPage() {
  const lang = Route.useParams().lang as Lang
  return <NewsArticle kind="blog" n={Route.useLoaderData()} lang={lang} c={content[lang]} />
}

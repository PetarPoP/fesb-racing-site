import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NewsArticle, NotFound } from '~/components/Cms'
import { getPost } from '~/lib/cms'
import { pick } from '~/lib/format'
import { articleLd, pageHead } from '~/lib/seo'

// The CMS texts of the page come with the layout (/$lang).
const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/blog/$slug')({
  loader: async ({ params }) => {
    const n = await getPost({ data: { kind: 'blog', slug: params.slug, lang: params.lang } })
    if (n) return n
    throw notFound()
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const lang = params.lang as Lang
    const c = content[lang] ?? content.hr
    const title = pick(loaderData, 'title', lang)
    const desc = pick(loaderData, 'excerpt', lang)
    const rest = `/blog/${loaderData.slug}`
    return pageHead({
      lang,
      rest,
      title,
      description: desc,
      image: loaderData.imageUrl,
      type: 'article',
      published: loaderData.date,
      crumbs: [{ name: c.blogLabel, rest: '/blog' }],
      jsonLd: [articleLd({ lang, rest, title, description: desc, image: loaderData.imageUrl, date: loaderData.date, kind: 'blog' })],
    })
  },
  component: PostPage,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function PostPage() {
  const lang = Route.useParams().lang as Lang
  return <NewsArticle kind="blog" n={Route.useLoaderData()} lang={lang} c={layout.useLoaderData()} />
}

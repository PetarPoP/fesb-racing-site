import { createFileRoute, getRouteApi, notFound, redirect } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NewsArticle, NotFound } from '~/components/Cms'
import { getPost } from '~/lib/cms'
import { pick } from '~/lib/format'
import { articleLd, pageHead } from '~/lib/seo'

// The CMS texts of the page come with the layout (/$lang).
const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/novosti/$slug')({
  loader: async ({ params }) => {
    const n = await getPost({ data: { kind: 'news', slug: params.slug, lang: params.lang } })
    if (n) return n
    // Before the split all posts were under /novosti. An old link to a blog post goes to its new address.
    const old = await getPost({ data: { kind: 'blog', slug: params.slug, lang: params.lang } })
    if (old) throw redirect({ to: '/$lang/blog/$slug', params: { lang: params.lang, slug: params.slug }, statusCode: 301 })
    throw notFound()
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const lang = params.lang as Lang
    const c = content[lang] ?? content.hr
    const title = pick(loaderData, 'title', lang)
    const desc = pick(loaderData, 'excerpt', lang)
    const rest = `/novosti/${loaderData.slug}`
    return pageHead({
      lang,
      rest,
      title,
      description: desc,
      image: loaderData.imageUrl,
      type: 'article',
      published: loaderData.date,
      crumbs: [{ name: c.newsLabel, rest: '/novosti' }],
      jsonLd: [articleLd({ lang, rest, title, description: desc, image: loaderData.imageUrl, date: loaderData.date, kind: 'news' })],
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
  return <NewsArticle kind="news" n={Route.useLoaderData()} lang={lang} c={layout.useLoaderData()} />
}

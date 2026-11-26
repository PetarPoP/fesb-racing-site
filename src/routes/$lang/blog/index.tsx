import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { itemListLd, pageHead } from '~/lib/seo'
import { pick } from '~/lib/format'
import { PostList } from '~/components/Cms'
import { getPostList } from '~/lib/cms'

// The CMS texts of the page come with the layout (/$lang).
const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/blog/')({
  loader: ({ params }) => getPostList({ data: { kind: 'blog', lang: params.lang } }),
  head: ({ params, loaderData }) => {
    const lang = params.lang as Lang
    const c = content[lang] ?? content.hr
    const posts = loaderData ?? []
    return pageHead({
      lang,
      rest: '/blog',
      title: c.seo.blog,
      description: c.blogMeta,
      crumbs: [],
      jsonLd: posts.length ? [itemListLd(lang, posts.map((n) => ({ name: pick(n, 'title', lang), rest: `/blog/${n.slug}` })))] : [],
    })
  },
  component: ListPage,
})

function ListPage() {
  const lang = Route.useParams().lang as Lang
  return <PostList kind="blog" posts={Route.useLoaderData()} lang={lang} c={layout.useLoaderData()} />
}

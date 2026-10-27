import { createFileRoute } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { PostList } from '~/components/Cms'
import { getPostList } from '~/lib/cms'

export const Route = createFileRoute('/$lang/blog/')({
  loader: ({ params }) => getPostList({ data: { kind: 'blog', lang: params.lang } }),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.blogLabel} — FESB Racing` }] }
  },
  component: ListPage,
})

function ListPage() {
  const lang = Route.useParams().lang as Lang
  return <PostList kind="blog" posts={Route.useLoaderData()} lang={lang} c={content[lang]} />
}

import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { PostList } from '~/components/Cms'
import { getPostList } from '~/lib/cms'

// The CMS texts of the page come with the layout (/$lang).
const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/novosti/')({
  loader: ({ params }) => getPostList({ data: { kind: 'news', lang: params.lang } }),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.newsLabel} — FESB Racing` }] }
  },
  component: ListPage,
})

function ListPage() {
  const lang = Route.useParams().lang as Lang
  return <PostList kind="news" posts={Route.useLoaderData()} lang={lang} c={layout.useLoaderData()} />
}

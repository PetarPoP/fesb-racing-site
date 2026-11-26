import { createFileRoute } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { pageHead, websiteLd } from '~/lib/seo'
import { Home } from '~/components/Site'
import { getHome } from '~/lib/cms'

export const Route = createFileRoute('/$lang/')({
  loader: ({ params }) => getHome({ data: params.lang }),
  staleTime: 30_000,
  head: ({ params, loaderData }) => {
    const lang = params.lang as Lang
    const c = loaderData?.c ?? content[lang] ?? content.hr
    return pageHead({ lang, rest: '', title: c.metaTitle, description: c.metaDesc, jsonLd: [websiteLd()] })
  },
  component: HomePage,
})

function HomePage() {
  const lang = Route.useParams().lang as Lang
  const { news, blog, partners, c, vehicles } = Route.useLoaderData()
  return <Home lang={lang} c={c} news={news} blog={blog} partners={partners} vehicles={vehicles} />
}

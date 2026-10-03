import { createFileRoute } from '@tanstack/react-router'
import type { Lang } from '~/content'
import { Home } from '~/components/Site'
import { getHome } from '~/lib/cms'

export const Route = createFileRoute('/$lang/')({
  loader: ({ params }) => getHome({ data: params.lang }),
  staleTime: 30_000,
  head: () => ({
    links: [
      { rel: 'alternate', hrefLang: 'hr', href: '/hr' },
      { rel: 'alternate', hrefLang: 'en', href: '/en' },
    ],
  }),
  component: HomePage,
})

function HomePage() {
  const lang = Route.useParams().lang as Lang
  const { news, partners, c } = Route.useLoaderData()
  return <Home lang={lang} c={c} news={news} partners={partners} />
}

import { createFileRoute, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound, SponsorArticle } from '~/components/Cms'
import { getSponsor } from '~/lib/cms'
import { pick } from '~/lib/format'

export const Route = createFileRoute('/$lang/sponzori/$slug')({
  loader: async ({ params }) => {
    const s = await getSponsor({ data: params.slug })
    if (!s) throw notFound()
    return s
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const desc = pick(loaderData, 'summary', params.lang as Lang)
    return {
      meta: [
        { title: `${loaderData.name} — FESB Racing` },
        { name: 'description', content: desc },
        { property: 'og:title', content: loaderData.name },
        { property: 'og:description', content: desc },
      ],
    }
  },
  component: SponsorPage,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function SponsorPage() {
  const lang = Route.useParams().lang as Lang
  return <SponsorArticle s={Route.useLoaderData()} lang={lang} c={content[lang]} />
}

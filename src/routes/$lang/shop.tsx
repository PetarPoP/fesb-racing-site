import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { ShopPage } from '~/components/Shop'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop')({
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.shopTitle} — FESB Racing` }, { name: 'description', content: c.shopText }] }
  },
  component: Page,
})

function Page() {
  const lang = Route.useParams().lang as Lang
  // The layout loader holds the CMS content, with the shop settings.
  return <ShopPage c={layout.useLoaderData()} lang={lang} />
}

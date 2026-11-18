import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { ShopPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop/')({
  loader: ({ params }) => getShop({ data: params.lang }),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.shopTitle} — FESB Racing` }, { name: 'description', content: c.shopText }] }
  },
  component: Page,
})

function Page() {
  const lang = Route.useParams().lang as Lang
  return <ShopPage shop={Route.useLoaderData()} c={layout.useLoaderData()} lang={lang} />
}

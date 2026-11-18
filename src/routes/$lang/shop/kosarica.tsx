import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { CartPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop/kosarica')({
  loader: ({ params }) => getShop({ data: params.lang }),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.shopCart} — FESB Racing Shop` }, { name: 'robots', content: 'noindex' }] }
  },
  component: Page,
})

function Page() {
  const lang = Route.useParams().lang as Lang
  return <CartPage shop={Route.useLoaderData()} c={layout.useLoaderData()} lang={lang} />
}

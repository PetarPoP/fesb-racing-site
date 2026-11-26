import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { CartPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'
import { pageHead } from '~/lib/seo'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop/kosarica')({
  loader: ({ params }) => getShop({ data: params.lang }),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return pageHead({ lang: params.lang as Lang, rest: '/shop/kosarica', title: c.shopCart, noindex: true })
  },
  component: Page,
})

function Page() {
  const lang = Route.useParams().lang as Lang
  return <CartPage shop={Route.useLoaderData()} c={layout.useLoaderData()} lang={lang} />
}

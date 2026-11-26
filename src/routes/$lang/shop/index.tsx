import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { ShopPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'
import { pageHead } from '~/lib/seo'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop/')({
  loader: ({ params }) => getShop({ data: params.lang }),
  head: ({ params, loaderData }) => {
    const lang = params.lang as Lang
    const c = content[lang] ?? content.hr
    return pageHead({
      lang,
      rest: '/shop',
      title: c.seo.shop,
      description: c.shopText,
      image: loaderData?.products[0]?.images[0]?.src,
      // The shop is internal: behind a password and out of the search engines.
      noindex: true,
    })
  },
  component: Page,
})

function Page() {
  const lang = Route.useParams().lang as Lang
  return <ShopPage shop={Route.useLoaderData()} c={layout.useLoaderData()} lang={lang} />
}

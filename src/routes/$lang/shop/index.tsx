import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { ShopPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'
import { itemListLd, pageHead } from '~/lib/seo'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop/')({
  loader: ({ params }) => getShop({ data: params.lang }),
  head: ({ params, loaderData }) => {
    const lang = params.lang as Lang
    const c = content[lang] ?? content.hr
    const open = Boolean(loaderData?.settings.enabled && loaderData.products.length)
    return pageHead({
      lang,
      rest: '/shop',
      title: c.seo.shop,
      description: c.shopText,
      image: loaderData?.products[0]?.images[0]?.src,
      // A shop that is switched off shows only "coming soon".
      noindex: !open,
      crumbs: [],
      jsonLd: open ? [itemListLd(lang, loaderData!.products.map((p) => ({ name: p.name, rest: `/shop/${p.slug}` })))] : [],
    })
  },
  component: Page,
})

function Page() {
  const lang = Route.useParams().lang as Lang
  return <ShopPage shop={Route.useLoaderData()} c={layout.useLoaderData()} lang={lang} />
}

import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { ProductPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'
import { CATEGORY_LABEL } from '~/lib/shop'
import { pageHead, productLd } from '~/lib/seo'

const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/shop/$slug')({
  loader: async ({ params }) => {
    const shop = await getShop({ data: params.lang })
    if (!shop.products.some((p) => p.slug === params.slug)) throw notFound()
    return shop
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.products.find((x) => x.slug === params.slug)
    if (!p) return {}
    const lang = params.lang as Lang
    const c = content[lang] ?? content.hr
    const rest = `/shop/${p.slug}`
    const category = CATEGORY_LABEL[lang][p.category]
    const description = p.description || `${p.name} — ${category ?? c.shopTitle}. ${c.shopText}`
    return pageHead({
      lang,
      rest,
      title: p.name,
      description,
      image: p.images[0]?.src,
      type: 'product',
      noindex: !loaderData!.settings.enabled,
      crumbs: [{ name: c.shopTitle, rest: '/shop' }],
      jsonLd: [productLd({ lang, rest, name: p.name, description, images: p.images.map((i) => i.src), price: p.price, inStock: p.stock > 0, category, sku: `FR-${p.id}` })],
    })
  },
  component: Page,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function Page() {
  const { lang, slug } = Route.useParams()
  return <ProductPage shop={Route.useLoaderData()} slug={slug} c={layout.useLoaderData()} lang={lang as Lang} />
}

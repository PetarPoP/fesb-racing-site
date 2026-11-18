import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { ProductPage } from '~/components/Shop'
import { getShop } from '~/lib/shopFns'

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
    return {
      meta: [
        { title: `${p.name} — FESB Racing Shop` },
        ...(p.description ? [{ name: 'description', content: p.description }] : []),
        ...(p.images[0] ? [{ property: 'og:image', content: p.images[0].src }] : []),
      ],
    }
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

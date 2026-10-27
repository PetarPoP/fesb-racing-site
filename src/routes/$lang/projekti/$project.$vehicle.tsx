import { createFileRoute, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { VehiclePage } from '~/components/Projects'
import { getVehicle } from '~/lib/cms'
import { isProjectId } from '~/lib/projects'

export const Route = createFileRoute('/$lang/projekti/$project/$vehicle')({
  loader: async ({ params }) => {
    if (!isProjectId(params.project)) throw notFound()
    const r = await getVehicle({ data: { project: params.project, vehicle: params.vehicle, lang: params.lang } })
    if (!r) throw notFound()
    return r
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {}
    const { v } = loaderData
    const desc = v.specs.map(([k, val]) => `${k}: ${val}`).join(' · ')
    return {
      meta: [
        { title: `${v.name}${v.year ? ` ${v.year}` : ''} — FESB Racing` },
        ...(desc ? [{ name: 'description', content: desc }] : []),
        ...(v.images[0] ? [{ property: 'og:image', content: v.images[0].src }] : []),
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
  const lang = Route.useParams().lang as Lang
  const { v, others } = Route.useLoaderData()
  return <VehiclePage v={v} others={others} lang={lang} c={content[lang]} />
}

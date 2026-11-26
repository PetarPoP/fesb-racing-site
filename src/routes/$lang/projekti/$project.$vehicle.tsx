import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { VehiclePage } from '~/components/Projects'
import { getVehicle } from '~/lib/cms'
import { PROJECTS, isProjectId } from '~/lib/projects'
import { pageHead, vehicleLd } from '~/lib/seo'

// The CMS texts of the page come with the layout (/$lang).
const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/projekti/$project/$vehicle')({
  loader: async ({ params }) => {
    if (!isProjectId(params.project)) throw notFound()
    const r = await getVehicle({ data: { project: params.project, vehicle: params.vehicle, lang: params.lang } })
    if (!r) throw notFound()
    return r
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {}
    const { v } = loaderData
    const lang = (params.lang === 'en' ? 'en' : 'hr') as Lang
    const project = PROJECTS.find((x) => x.id === v.project)
    const specs = v.specs.map(([k, val]) => `${k}: ${val}`).join(' · ')
    const description = v.description || v.sections[0]?.d || specs
    const rest = `/projekti/${v.project}/${v.id}`
    const title = `${v.name}${v.year ? ` ${v.year}` : ''}`
    return pageHead({
      lang,
      rest,
      title,
      description,
      image: v.images[0]?.src,
      crumbs: project ? [{ name: project.name, rest: `/projekti/${project.id}` }] : [],
      jsonLd: [vehicleLd({ lang, rest, name: title, kind: v.project === 'motostudent' ? 'bike' : 'car', description, image: v.images[0]?.src, year: v.year, specs: v.specs })],
    })
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
  return <VehiclePage v={v} others={others} lang={lang} c={layout.useLoaderData()} />
}

import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { ProjectPage } from '~/components/Projects'
import { getProjectVehicles } from '~/lib/cms'
import { PROJECTS, isProjectId } from '~/lib/projects'
import { itemListLd, pageHead } from '~/lib/seo'

// The CMS texts of the page come with the layout (/$lang).
const layout = getRouteApi('/$lang')

export const Route = createFileRoute('/$lang/projekti/$project/')({
  loader: ({ params }) => {
    if (!isProjectId(params.project)) throw notFound()
    return getProjectVehicles({ data: { project: params.project, lang: params.lang } })
  },
  head: ({ params, loaderData }) => {
    const p = PROJECTS.find((x) => x.id === params.project)
    const lang = (params.lang === 'en' ? 'en' : 'hr') as Lang
    if (!p) return {}
    const rest = `/projekti/${p.id}`
    const vehicles = loaderData ?? []
    return pageHead({
      lang,
      rest,
      title: p.name,
      description: p.intro[lang][0],
      image: vehicles[0]?.images[0]?.src,
      crumbs: [],
      jsonLd: vehicles.length ? [itemListLd(lang, vehicles.map((v) => ({ name: v.name, rest: `${rest}/${v.id}` })))] : [],
    })
  },
  component: Page,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function Page() {
  const { lang, project } = Route.useParams() as { lang: Lang; project: 'formula-student' | 'motostudent' }
  return <ProjectPage project={project} vehicles={Route.useLoaderData()} lang={lang} c={layout.useLoaderData()} />
}

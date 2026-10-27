import { createFileRoute, notFound } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { ProjectPage } from '~/components/Projects'
import { getProjectVehicles } from '~/lib/cms'
import { PROJECTS, isProjectId } from '~/lib/projects'

export const Route = createFileRoute('/$lang/projekti/$project/')({
  loader: ({ params }) => {
    if (!isProjectId(params.project)) throw notFound()
    return getProjectVehicles({ data: { project: params.project, lang: params.lang } })
  },
  head: ({ params }) => {
    const p = PROJECTS.find((x) => x.id === params.project)
    const lang = (params.lang === 'en' ? 'en' : 'hr') as Lang
    return p ? { meta: [{ title: `${p.name} — FESB Racing` }, { name: 'description', content: p.intro[lang][0] }] } : {}
  },
  component: Page,
  notFoundComponent: () => {
    const lang = Route.useParams().lang as Lang
    return <NotFound lang={lang} c={content[lang]} />
  },
})

function Page() {
  const { lang, project } = Route.useParams() as { lang: Lang; project: 'formula-student' | 'motostudent' }
  return <ProjectPage project={project} vehicles={Route.useLoaderData()} lang={lang} c={content[lang]} />
}

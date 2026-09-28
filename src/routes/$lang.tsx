import { Outlet, createFileRoute, redirect, useMatch } from '@tanstack/react-router'
import { content, isLang, type Lang } from '~/content'
import { NotFound } from '~/components/Cms'
import { Shell } from '~/components/Site'

export const Route = createFileRoute('/$lang')({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw redirect({ to: '/$lang', params: { lang: 'hr' } })
  },
  head: ({ params }) => {
    const c = content[isLang(params.lang) ? params.lang : 'hr']
    return {
      meta: [
        { title: c.metaTitle },
        { name: 'description', content: c.metaDesc },
        { property: 'og:title', content: c.metaTitle },
        { property: 'og:description', content: c.metaDesc },
      ],
    }
  },
  component: LangLayout,
  notFoundComponent: LangNotFound,
})

function LangLayout() {
  const lang = Route.useParams().lang as Lang
  const onHome = Boolean(useMatch({ from: '/$lang/', shouldThrow: false }))
  return (
    <Shell lang={lang} onHome={onHome}>
      <Outlet />
    </Shell>
  )
}

function LangNotFound() {
  const lang = Route.useParams().lang as Lang
  return <NotFound lang={lang} c={content[lang]} />
}

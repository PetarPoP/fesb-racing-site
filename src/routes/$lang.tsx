import { createFileRoute, redirect } from '@tanstack/react-router'
import { content, isLang, type Lang } from '~/content'
import { Site } from '~/components/Site'

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
      links: [
        { rel: 'alternate', hrefLang: 'hr', href: '/hr' },
        { rel: 'alternate', hrefLang: 'en', href: '/en' },
      ],
    }
  },
  component: LangPage,
})

function LangPage() {
  const { lang } = Route.useParams()
  return <Site lang={lang as Lang} />
}

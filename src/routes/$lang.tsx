import { Outlet, createFileRoute, redirect, useMatch } from '@tanstack/react-router'
import { content, isLang, type Lang } from '~/content'
import { organizationLd } from '~/lib/seo'
import { NotFound } from '~/components/Cms'
import { getSiteContent } from '~/lib/cms'
import { Shell } from '~/components/Site'

export const Route = createFileRoute('/$lang')({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw redirect({ to: '/$lang', params: { lang: 'hr' } })
  },
  // Defaults of every page, the search engine verification codes from the CMS and the JSON-LD of the club.
  // Each page route sets its own title, description, canonical address and share image (src/lib/seo.ts).
  head: ({ params, loaderData }) => {
    const lang = isLang(params.lang) ? params.lang : 'hr'
    const c = loaderData ?? content[lang]
    return {
      meta: [
        { title: c.metaTitle },
        { name: 'description', content: c.metaDesc },
        ...(c.verify?.google ? [{ name: 'google-site-verification', content: c.verify.google }] : []),
        ...(c.verify?.bing ? [{ name: 'msvalidate.01', content: c.verify.bing }] : []),
        { 'script:ld+json': organizationLd({ lang, description: c.metaDesc, email: c.mail, address: c.addr, sameAs: Object.values(c.socials ?? {}) }) },
      ],
    }
  },
  loader: ({ params }) => getSiteContent({ data: params.lang }),
  staleTime: 30_000,
  component: LangLayout,
  notFoundComponent: LangNotFound,
})

function LangLayout() {
  const lang = Route.useParams().lang as Lang
  const onHome = Boolean(useMatch({ from: '/$lang/', shouldThrow: false }))
  return (
    <Shell lang={lang} c={Route.useLoaderData()} onHome={onHome}>
      <Outlet />
    </Shell>
  )
}

function LangNotFound() {
  const lang = Route.useParams().lang as Lang
  return <NotFound lang={lang} c={content[lang]} />
}

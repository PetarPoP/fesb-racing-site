import { createFileRoute } from '@tanstack/react-router'
import { content, type Lang } from '~/content'
import { EmptyNews, NewsRow } from '~/components/Sections'
import { tw } from '~/components/ui'
import { getNewsList } from '~/lib/cms'

export const Route = createFileRoute('/$lang/novosti/')({
  loader: ({ params }) => getNewsList({ data: params.lang }),
  head: ({ params }) => {
    const c = content[params.lang as Lang] ?? content.hr
    return { meta: [{ title: `${c.newsLabel} — FESB Racing` }] }
  },
  component: NewsListPage,
})

function NewsListPage() {
  const lang = Route.useParams().lang as Lang
  const c = content[lang]
  const news = Route.useLoaderData()
  return (
    <main className="wrap flex flex-col gap-8 pt-[clamp(104px,12vw,148px)] pb-10 md:pb-16">
      <h1 className={tw.h2}>{c.newsTitle}</h1>
      {news.length === 0 ? (
        <EmptyNews c={c} />
      ) : (
        <div className="border-t border-fg/[.14]">
          {news.map((n) => (
            <NewsRow key={n.id} n={n} lang={lang} c={c} />
          ))}
        </div>
      )}
    </main>
  )
}

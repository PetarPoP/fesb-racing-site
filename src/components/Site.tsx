import type { MouseEvent, ReactNode } from 'react'
import { content, type Lang } from '~/content'
import type { NewsCard, SponsorCard } from '~/lib/format'
import { Header } from './Header'
import { Hero } from './Hero'
import { Join } from './Join'
import { Competitions, Footer, News, Sponsors, Stats, Story, Ticker, Vehicles } from './Sections'
import { Teams } from './CarExplode'

// Klik na sidro samo skrola; hash se briše iz URL-a da „Natrag“ ni osvježavanje ne vraćaju na tu sekciju.
// Podijeljeni link s #sekcijom i dalje otvara tu sekciju jer ga preglednik obradi pri učitavanju.
function onAnchorClick(e: MouseEvent<HTMLElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
  const target = a && document.getElementById(decodeURIComponent(a.hash.slice(1)))
  if (!target) return
  e.preventDefault()
  target.scrollIntoView()
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
}

export function Shell({ lang, onHome, children }: { lang: Lang; onHome: boolean; children: ReactNode }) {
  const c = content[lang]
  return (
    <div className="contents" onClick={onAnchorClick}>
      <Header lang={lang} c={c} onHome={onHome} />
      {children}
      <Footer c={c} />
    </div>
  )
}

export function Home({ lang, news, sponsors }: { lang: Lang; news: NewsCard[]; sponsors: SponsorCard[] }) {
  const c = content[lang]
  return (
    <main id="top" className="overflow-x-clip">
      <Hero c={c} />
      <Ticker c={c} />
      <Stats c={c} />
      <Story c={c} />
      <Teams c={c} lang={lang} />
      <Vehicles c={c} />
      <Competitions c={c} />
      <Sponsors c={c} lang={lang} sponsors={sponsors} />
      <News c={c} lang={lang} news={news} />
      <Join c={c} lang={lang} />
    </main>
  )
}

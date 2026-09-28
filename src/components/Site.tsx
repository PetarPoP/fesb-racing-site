import type { MouseEvent } from 'react'
import { content, type Lang } from '~/content'
import { Header } from './Header'
import { Hero } from './Hero'
import { Join } from './Join'
import { Competitions, Footer, News, Sponsors, Stats, Story, Teams, Ticker, Vehicles } from './Sections'

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

export function Site({ lang }: { lang: Lang }) {
  const c = content[lang]
  return (
    <div className="contents" onClick={onAnchorClick}>
      <Header lang={lang} c={c} />
      <main id="top" className="overflow-x-clip">
        <Hero c={c} />
        <Ticker c={c} />
        <Stats c={c} />
        <Story c={c} />
        <Teams c={c} />
        <Vehicles c={c} />
        <Competitions c={c} />
        <Sponsors c={c} />
        <News c={c} />
        <Join c={c} lang={lang} />
      </main>
      <Footer c={c} />
    </div>
  )
}

import type { MouseEvent } from 'react'
import { content, type Lang } from '~/content'
import { Header } from './Header'
import { Hero } from './Hero'
import { Join } from './Join'
import { Competitions, Footer, News, Sponsors, Stats, Story, Teams, Ticker, Vehicles } from './Sections'

// Sidra unutar stranice skrolaju bez novog unosa u povijest, pa „Natrag“ ne prolazi kroz sekcije.
function onAnchorClick(e: MouseEvent<HTMLElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
  const target = a && document.getElementById(decodeURIComponent(a.hash.slice(1)))
  if (!target) return
  e.preventDefault()
  target.scrollIntoView()
  history.replaceState(history.state, '', a.hash)
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

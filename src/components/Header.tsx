import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { SECTION_IDS, type Content, type Lang } from '~/content'
import { cx } from './ui'

// Na početnoj običan #sidro (skrola bez unosa u povijest), na podstranicama povratak na početnu na tu sekciju.
export function SectionLink({ id, lang, onHome, ...rest }: { id: string; lang: Lang; onHome: boolean } & ComponentProps<'a'>) {
  if (onHome) return <a href={`#${id}`} {...rest} />
  return <Link to="/$lang" params={{ lang }} hash={id} {...rest} />
}

// Sekcija čiji je vrh prešao 35 % visine prozora; #pridruzi-se nije u navigaciji pa tamo ništa nije istaknuto.
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const ids = [...SECTION_IDS, 'pridruzi-se']
    let raf = 0
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.35
      let cur: string | null = null
      let best = -Infinity
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top
        if (top !== undefined && top <= line && top > best) {
          best = top
          cur = id
        }
      }
      const root = document.documentElement
      if (root.scrollTop > 0 && window.innerHeight + root.scrollTop >= root.scrollHeight - 2) cur = 'kontakt'
      setActive(cur)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return active
}

export function Header({ lang, c, onHome }: { lang: Lang; c: Content; onHome: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection()
  const other: Lang = lang === 'hr' ? 'en' : 'hr'

  const pillRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)

  // Close the menu on Escape, or on a pointer press outside the pill and the menu.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (pillRef.current?.contains(t) || navRef.current?.contains(t)) return
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  // The mobile links use "press", which sets its own transition, so they skip transition-colors.
  const linkClass = (id: string, fade = true) =>
    cx(fade && 'transition-colors', 'hover:text-acc', active === id ? 'text-acc' : 'text-fg')

  return (
    <header className="pointer-events-none fixed inset-x-0 top-[clamp(12px,2vw,20px)] z-50 flex flex-col items-center px-4">
      <div ref={pillRef} className="glass-nav pointer-events-auto flex max-w-full items-center gap-[clamp(14px,2vw,26px)] rounded-full py-1.5 pr-1.5 pl-5 text-sm whitespace-nowrap">
        <SectionLink id="top" lang={lang} onHome={onHome} className="press font-black [font-stretch:125%] tracking-[-.01em] text-fg hover:text-fg">
          FESB<span className="text-acc">/</span>R
        </SectionLink>

        <nav className="hidden items-center gap-[clamp(14px,2vw,26px)] min-[1000px]:flex" aria-label={c.menu}>
          {c.nav.map((label, i) => (
            <SectionLink
              key={SECTION_IDS[i]}
              id={SECTION_IDS[i]!}
              lang={lang}
              onHome={onHome}
              aria-current={active === SECTION_IDS[i] ? 'location' : undefined}
              className={linkClass(SECTION_IDS[i]!)}
            >
              {label}
            </SectionLink>
          ))}
        </nav>

        {/* Wide: segmented HR/EN */}
        <div className="hidden items-center rounded-full border border-line p-0.5 text-[13px] font-semibold min-[1000px]:flex" role="group" aria-label={c.langSwitch}>
          {(['hr', 'en'] as const).map((l) => (
            <Link
              key={l}
              to="."
              params={(p) => ({ ...p, lang: l })}
              resetScroll={false}
              viewTransition
              hrefLang={l}
              aria-current={l === lang ? 'true' : undefined}
              className={cx('press relative rounded-full px-2.5 py-1.5', l === lang ? 'text-[#141112]' : 'text-fg hover:text-acc')}
            >
              {l === lang && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-fg [view-transition-name:lang-pill]" />}
              <span className={cx('relative', l === 'hr' ? '[view-transition-name:lang-hr]' : '[view-transition-name:lang-en]')}>
                {l.toUpperCase()}
              </span>
            </Link>
          ))}
        </div>

        {/* Narrow: one button shows the other language */}
        <Link
          to="."
          params={(p) => ({ ...p, lang: other })}
          resetScroll={false}
          viewTransition
          hrefLang={other}
          className="press grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-[13px] font-semibold text-fg hover:text-acc min-[1000px]:hidden"
          aria-label={c.langSwitch}
        >
          {other.toUpperCase()}
        </Link>

        <SectionLink
          id="pridruzi-se"
          lang={lang}
          onHome={onHome}
          data-dh="wipe"
          data-dh-c="#e2475b"
          className="press rounded-full bg-fg px-4 py-2.5 font-semibold text-[#141112] hover:text-[#141112]"
        >
          {c.cta}
        </SectionLink>

        <button
          type="button"
          className="press -ml-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-fg hover:text-acc min-[1000px]:hidden"
          aria-label={c.menu}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="flex w-4 flex-col gap-[4px]" aria-hidden="true">
            <span className={cx('h-px bg-current transition-transform duration-300 ease-out', menuOpen && 'translate-y-[5px] rotate-45')} />
            <span className={cx('h-px bg-current transition-opacity duration-300 ease-out', menuOpen && 'opacity-0')} />
            <span className={cx('h-px bg-current transition-transform', menuOpen && '-translate-y-[5px] -rotate-45')} />
          </span>
        </button>
      </div>

      <nav
        ref={navRef}
        id="mobile-nav"
        hidden={!menuOpen}
        aria-label={c.menu}
        className="glass-nav animate-pop-in origin-top pointer-events-auto mt-2 w-full max-w-[420px] rounded-3xl p-2 min-[1000px]:hidden"
      >
        <div className="flex flex-col text-base">
          {c.nav.map((label, i) => (
            <SectionLink
              key={SECTION_IDS[i]}
              id={SECTION_IDS[i]!}
              lang={lang}
              onHome={onHome}
              onClick={() => setMenuOpen(false)}
              aria-current={active === SECTION_IDS[i] ? 'location' : undefined}
              className={cx('press flex min-h-11 items-center rounded-2xl px-4 font-semibold hover:bg-fg/10', linkClass(SECTION_IDS[i]!, false))}
            >
              {label}
            </SectionLink>
          ))}
        </div>
      </nav>
    </header>
  )
}

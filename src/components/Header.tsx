import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { SECTION_IDS, type Content, type Lang } from '~/content'
import { toggleTheme } from '~/lib/theme'
import { cx, tw } from './ui'

const iconBtn = 'grid size-11 shrink-0 cursor-pointer place-items-center border border-line text-fg transition-colors hover:text-acc'

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

export function Header({ lang, c }: { lang: Lang; c: Content }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useActiveSection()
  const other: Lang = lang === 'hr' ? 'en' : 'hr'

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg transition-colors duration-300 [view-transition-name:site-header]">
      <div className="wrap flex h-[60px] items-center gap-1.5 font-mono text-xs md:h-16 md:gap-6">
        <a href="#top" className="font-display text-[21px] font-extrabold tracking-[.02em] text-fg md:text-2xl">
          FESB<span className="text-acc">/</span>RACING
        </a>

        <div className="hidden items-center gap-1.5 text-mute md:flex">
          <span className="size-[7px] animate-blink rounded-full bg-acc motion-reduce:animate-none" aria-hidden="true" />
          SPLIT · HR
        </div>

        <div className="flex-1 nav:hidden" />

        <nav className="hidden gap-5 tracking-[.06em] uppercase nav:ml-auto nav:flex" aria-label={c.menu}>
          {c.nav.map((label, i) => (
            <a
              key={SECTION_IDS[i]}
              href={`#${SECTION_IDS[i]}`}
              aria-current={active === SECTION_IDS[i] ? 'location' : undefined}
              className={cx(
                'relative transition-colors hover:text-acc',
                'after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:origin-left after:bg-acc after:transition-transform after:duration-300',
                active === SECTION_IDS[i] ? 'text-acc after:scale-x-100' : 'text-fg after:scale-x-0',
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop: segmentirani HR/EN */}
        <div className="hidden border border-line md:flex" role="group" aria-label={c.langSwitch}>
          {(['hr', 'en'] as const).map((l) => (
            <Link
              key={l}
              to="/$lang"
              params={{ lang: l }}
              resetScroll={false}
              viewTransition
              hrefLang={l}
              aria-current={l === lang ? 'true' : undefined}
              className={cx('relative px-[9px] py-[7px]', l === lang ? 'text-bg' : 'text-fg hover:text-acc')}
            >
              {l === lang && <span aria-hidden="true" className="absolute inset-0 bg-fg [view-transition-name:lang-pill]" />}
              <span className={cx('relative', l === 'hr' ? '[view-transition-name:lang-hr]' : '[view-transition-name:lang-en]')}>
                {l.toUpperCase()}
              </span>
            </Link>
          ))}
        </div>

        {/* Mobilno: gumb prikazuje drugi jezik */}
        <Link
          to="/$lang"
          params={{ lang: other }}
          resetScroll={false}
          viewTransition
          hrefLang={other}
          className={cx(iconBtn, 'md:hidden')}
          aria-label={c.langSwitch}
        >
          {other.toUpperCase()}
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={c.themeToggle}
          className={cx(iconBtn, 'gap-2 md:flex md:size-auto md:px-2.5 md:py-1.5')}
        >
          <span
            className="size-3.5 rounded-full border-[1.5px] border-current bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)] md:size-3"
            aria-hidden="true"
          />
          <span className="hidden md:inline">
            <span className="light:hidden">{c.themeLight}</span>
            <span className="dark:hidden">{c.themeDark}</span>
          </span>
        </button>

        <a href="#pridruzi-se" className={cx(tw.btnRed, 'hidden px-4 py-2.5 tracking-[.06em] uppercase md:inline-block')}>
          {c.cta}
        </a>

        <button
          type="button"
          className={cx(iconBtn, 'nav:hidden')}
          aria-label={c.menu}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="flex w-4 flex-col gap-[4px]" aria-hidden="true">
            <span className={cx('h-px bg-current transition-transform', menuOpen && 'translate-y-[5px] rotate-45')} />
            <span className={cx('h-px bg-current transition-opacity', menuOpen && 'opacity-0')} />
            <span className={cx('h-px bg-current transition-transform', menuOpen && '-translate-y-[5px] -rotate-45')} />
          </span>
        </button>
      </div>

      <nav id="mobile-nav" hidden={!menuOpen} aria-label={c.menu} className="border-t border-line bg-bg nav:hidden">
        <div className="wrap flex flex-col pt-1 pb-4 font-mono text-[13px] tracking-[.06em] uppercase">
          {c.nav.map((label, i) => (
            <a
              key={SECTION_IDS[i]}
              href={`#${SECTION_IDS[i]}`}
              onClick={() => setMenuOpen(false)}
              aria-current={active === SECTION_IDS[i] ? 'location' : undefined}
              className={cx(
                'flex min-h-11 items-center gap-4 border-b border-dashed border-line hover:text-acc',
                active === SECTION_IDS[i] ? 'text-acc' : 'text-fg',
              )}
            >
              <span className="text-acc">{String(i + 1).padStart(2, '0')}</span>
              {label}
            </a>
          ))}
          <a
            href="#pridruzi-se"
            onClick={() => setMenuOpen(false)}
            className={cx(tw.btnRed, 'mt-4 flex items-center justify-center gap-2 p-4')}
          >
            {c.cta}
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </nav>
    </header>
  )
}

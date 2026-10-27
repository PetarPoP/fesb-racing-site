import { useEffect } from 'react'

/**
 * Scroll reveal: headings and marked blocks fade up when they come on screen.
 * Only elements still below the screen get the hidden state (data-rv), so nothing that is already
 * visible flickers, and without JavaScript everything simply shows. The CSS is in styles.css.
 * data-reveal="stagger" on a grid reveals its children one after another.
 */
const SELECTOR = 'main :is(h1, h2):not(#top *), [data-reveal]'

export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          ;(e.target as HTMLElement).dataset.shown = ''
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    const scan = () => {
      raf = 0
      const fold = window.innerHeight
      for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) {
        if (el.dataset.rv !== undefined || el.closest('[data-rv]')) continue
        if (el.getBoundingClientRect().top < fold) {
          el.dataset.rv = 'seen' // on screen already: leave it as it is
          continue
        }
        el.dataset.rv = el.dataset.reveal === 'stagger' ? 'stagger' : ''
        if (el.dataset.rv === 'stagger') [...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty('--ri', String(i)))
        io.observe(el)
      }
    }
    let raf = requestAnimationFrame(scan)
    // New content (another page, the news from the CMS, the shop products) is scanned as it arrives.
    const mo = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(scan)
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      io.disconnect()
    }
  }, [])
}

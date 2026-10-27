// Light and dark theme. The choice from the header switch is saved in localStorage.
// Without a saved choice the page follows the system setting, and keeps following it when it changes.

export type Theme = 'light' | 'dark'
export const THEME_KEY = 'theme'
/** Browser bar colour of each theme (the --bg token). */
export const THEME_COLOR: Record<Theme, string> = { dark: '#0b0a0b', light: '#f5f0ed' }

/**
 * Inline script for <head>. It runs before the first paint, so the page never shows the wrong theme.
 * It is a string because it must run before React and the bundle load.
 */
export const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_KEY}')}catch(e){}var m=window.matchMedia('(prefers-color-scheme: light)');function a(){var t=s==='light'||s==='dark'?s:m.matches?'light':'dark';document.documentElement.dataset.theme=t}a();m.addEventListener&&m.addEventListener('change',function(){try{s=localStorage.getItem('${THEME_KEY}')}catch(e){}a();window.dispatchEvent(new Event('themechange'))})})()`

export const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch {
    // Private mode: the choice lasts until the page is closed.
  }
  window.dispatchEvent(new Event('themechange'))
}

/**
 * Switch the theme and save the choice. Listeners of the "themechange" event repaint (the dither canvases).
 * With an origin (the switch button) the new theme grows as a circle from it (View Transitions).
 * A browser without View Transitions fades the colours instead.
 */
export function setTheme(t: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const vt = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition
  if (reduced) return applyTheme(t)
  if (!vt) {
    root.classList.add('theme-fade')
    applyTheme(t)
    window.setTimeout(() => root.classList.remove('theme-fade'), 450)
    return
  }
  const x = origin?.x ?? window.innerWidth - 40
  const y = origin?.y ?? 40
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-r', `${r}px`)
  root.dataset.vt = 'theme'
  const done = vt.call(document, () => applyTheme(t))
  done.finished.finally(() => delete root.dataset.vt)
}

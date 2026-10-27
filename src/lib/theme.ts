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

/** Switch the theme and save the choice. Listeners of the "themechange" event repaint (the dither canvases). */
export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch {
    // Private mode: the choice lasts until the page is closed.
  }
  window.dispatchEvent(new Event('themechange'))
}

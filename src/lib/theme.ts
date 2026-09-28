export type Theme = 'dark' | 'light'
export const THEME_KEY = 'fesb-theme'

/**
 * Izvršava se u <head> prije prvog iscrtavanja: čita spremljenu temu,
 * inače `prefers-color-scheme`, inače tamnu. Sprječava bljesak krive teme.
 */
export const themeInitScript = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}if(t!=='dark'&&t!=='light'){t=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.dataset.theme=t;d.style.colorScheme=t})();`

export function toggleTheme() {
  const d = document.documentElement
  const next: Theme = d.dataset.theme === 'light' ? 'dark' : 'light'
  d.dataset.theme = next
  d.style.colorScheme = next
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    /* privatni način — tema vrijedi samo za ovu posjetu */
  }
}

/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRoute, useParams } from '@tanstack/react-router'
import { isLang } from '~/content'
import { THEME_COLOR, THEME_SCRIPT } from '~/lib/theme'
import css from '~/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: THEME_COLOR.dark, media: '(prefers-color-scheme: dark)' },
      { name: 'theme-color', content: THEME_COLOR.light, media: '(prefers-color-scheme: light)' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'stylesheet', href: css },
    ],
  }),
  shellComponent: RootShell,
  component: Outlet,
})

function RootShell({ children }: { children: ReactNode }) {
  const params = useParams({ strict: false }) as { lang?: string }
  const lang = isLang(params.lang) ? params.lang : 'hr'
  return (
    // The head script sets data-theme before React hydrates, so the attribute differs from the server HTML on purpose.
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

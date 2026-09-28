/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, ScriptOnce, createRootRoute, useParams } from '@tanstack/react-router'
import { isLang } from '~/content'
import { themeInitScript } from '~/lib/theme'
import css from '~/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#7F1627' },
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
    <html lang={lang} data-theme="dark" suppressHydrationWarning>
      <head>
        <ScriptOnce>{themeInitScript}</ScriptOnce>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

import { createFileRoute, redirect } from '@tanstack/react-router'

// Korijen vodi na hrvatsku verziju.
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/$lang', params: { lang: 'hr' } })
  },
})

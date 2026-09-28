import { createServerFn } from '@tanstack/react-start'
import { findNews, findSponsor, listNewsCards, listSponsorCards } from '~/server/queries'

const slugInput = (slug: unknown) => String(slug ?? '').slice(0, 100)

export const getHome = createServerFn({ method: 'GET' }).handler(async () => {
  const [news, sponsors] = await Promise.all([listNewsCards(4), listSponsorCards()])
  return { news, sponsors }
})

export const getNewsList = createServerFn({ method: 'GET' }).handler(() => listNewsCards())

export const getNews = createServerFn({ method: 'GET' })
  .validator(slugInput)
  .handler(({ data }) => findNews(data))

export const getSponsor = createServerFn({ method: 'GET' })
  .validator(slugInput)
  .handler(({ data }) => findSponsor(data))

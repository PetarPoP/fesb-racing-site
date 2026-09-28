import { createServerFn } from '@tanstack/react-start'
import {
  parseNews,
  parseSponsor,
  removeNews,
  removeSponsor,
  translateBoth,
  translatePayload,
  upsertNews,
  upsertSponsor,
} from '~/server/admin-ops'
import { checkPassword, endSession, isAdmin, requireAdmin, startSession } from '~/server/auth'
import { listAllForAdmin } from '~/server/queries'
import { storeImage } from '~/server/storage'
import { canTranslate } from '~/server/translate'

export type { NewsInput, SaveResult, SponsorInput } from '~/server/admin-ops'

export const adminStatus = createServerFn({ method: 'GET' }).handler(() => ({
  authed: isAdmin(),
  canTranslate: canTranslate(),
  db: process.env.DATABASE_URL ? ('neon' as const) : ('local' as const),
  storage: process.env.BLOB_READ_WRITE_TOKEN ? ('blob' as const) : ('local' as const),
}))

export const login = createServerFn({ method: 'POST' })
  .validator((pw: unknown) => String(pw ?? '').slice(0, 200))
  .handler(({ data }) => {
    if (!checkPassword(data)) return { ok: false as const }
    startSession()
    return { ok: true as const }
  })

export const logout = createServerFn({ method: 'POST' }).handler(() => {
  endSession()
})

export const adminData = createServerFn({ method: 'GET' }).handler(() => {
  requireAdmin()
  return listAllForAdmin()
})

export const translateFields = createServerFn({ method: 'POST' })
  .validator(translatePayload)
  .handler(({ data }) => {
    requireAdmin()
    return translateBoth(data)
  })

export const uploadImage = createServerFn({ method: 'POST' })
  .validator((fd: unknown) => {
    if (!(fd instanceof FormData)) throw new Error('Očekivan je FormData.')
    const file = fd.get('file')
    if (!(file instanceof File)) throw new Error('Nije poslana datoteka.')
    return file
  })
  .handler(async ({ data }) => {
    requireAdmin()
    return { url: await storeImage(data) }
  })

export const saveNews = createServerFn({ method: 'POST' })
  .validator(parseNews)
  .handler(({ data }) => {
    requireAdmin()
    return upsertNews(data)
  })

export const deleteNews = createServerFn({ method: 'POST' })
  .validator((id: unknown) => Number(id))
  .handler(({ data }) => {
    requireAdmin()
    return removeNews(data)
  })

export const saveSponsor = createServerFn({ method: 'POST' })
  .validator(parseSponsor)
  .handler(({ data }) => {
    requireAdmin()
    return upsertSponsor(data)
  })

export const deleteSponsor = createServerFn({ method: 'POST' })
  .validator((id: unknown) => Number(id))
  .handler(({ data }) => {
    requireAdmin()
    return removeSponsor(data)
  })

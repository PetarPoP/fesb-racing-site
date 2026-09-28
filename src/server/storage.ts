import { randomUUID } from 'node:crypto'

// SVG je izostavljen: lokalno se poslužuje s iste domene i mogao bi nositi skriptu.
const TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}
const MAX_BYTES = 5 * 1024 * 1024

/** Vercel Blob ako postoji BLOB_READ_WRITE_TOKEN, inače public/uploads (samo za lokalni razvoj). */
export async function storeImage(file: File): Promise<string> {
  const ext = TYPES[file.type]
  if (!ext) throw new Error('Dopuštene su PNG, JPG, WEBP, GIF i AVIF slike.')
  if (file.size > MAX_BYTES) throw new Error('Slika je veća od 5 MB.')
  const name = `${randomUUID()}.${ext}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(`uploads/${name}`, file, { access: 'public', contentType: file.type })
    return blob.url
  }

  const { mkdir, writeFile } = await import('node:fs/promises')
  await mkdir('public/uploads', { recursive: true })
  await writeFile(`public/uploads/${name}`, Buffer.from(await file.arrayBuffer()))
  return `/uploads/${name}`
}

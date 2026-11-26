import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'

// The first shop products: the six products of the earlier merch shop (fesb-racing-merch.vercel.app),
// 10 pieces per size, and the pickup and payment text of the shop settings. The shop stays switched off
// until it is switched on in "Kontakt, mreže i shop → Shop".
// The photos are downloaded from the old shop. A photo that cannot be downloaded is left out, and can be
// added in the admin.

const BLOB = 'https://ddixo8rc7e0c9fad.public.blob.vercel-storage.com/proizvodi/'
const SIZES = ['S', 'M', 'L', 'XL']

const PRODUCTS = [
  { slug: 'radna-jakna', hr: 'FESB Racing radna jakna', en: 'FESB Racing work jacket', category: 'jakne', price: 25, images: ['3c92846a-7118-4359-abce-ae74448bfef8', '264fad87-19a5-46a0-a7c8-51d6de1b6b64'] },
  { slug: 'hoodie-crna', hr: 'FESB Racing hoodie crna', en: 'FESB Racing hoodie, black', category: 'hoodie', price: 20, images: ['e9ba5b73-c98e-4322-84e8-63f8ab21691c'] },
  { slug: 'hoodie-bijela', hr: 'FESB Racing hoodie bijela', en: 'FESB Racing hoodie, white', category: 'hoodie', price: 20, images: ['4518b5f1-4849-4941-be96-ec76cb72bb06'] },
  { slug: 'majica-bijela', hr: 'FESB Racing kratka majica bijela', en: 'FESB Racing T-shirt, white', category: 'majice', price: 10, images: ['a9bb9567-19ee-4f47-8a9a-06b67388ece3'] },
  { slug: 'majica-crna', hr: 'FESB Racing kratka majica crna', en: 'FESB Racing T-shirt, black', category: 'majice', price: 10, images: ['77fedd96-abc4-46d7-ab0f-a5d86676dc07'] },
  { slug: 'sponzorska-majica', hr: 'FESB Racing sponzorska majica', en: 'FESB Racing sponsor T-shirt', category: 'majice', price: 15, images: ['e0027768-6f74-4908-a5f4-b4cfd66465f5', '4672c9af-c956-4600-8fb7-211fdd816e42'] },
] as const

const PICKUP = {
  hr: 'Narudžbu preuzimaš osobno u radionici FESB Racinga na FESB-u (Ruđera Boškovića 32, Split) i plaćaš gotovinom pri preuzimanju. Javit ćemo ti se e-mailom kad narudžba bude spremna.',
  en: 'You pick up your order in person at the FESB Racing workshop at FESB (Ruđera Boškovića 32, Split) and pay in cash on pickup. We will email you when your order is ready.',
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const [order, p] of PRODUCTS.entries()) {
    const found = await payload.find({ collection: 'products', where: { slug: { equals: p.slug } }, limit: 1, req })
    if (found.docs[0]) continue
    const images: number[] = []
    for (const [i, id] of p.images.entries()) {
      try {
        const res = await fetch(`${BLOB}${id}.jpg`, { signal: AbortSignal.timeout(15_000) })
        if (!res.ok) throw new Error(String(res.status))
        const data = Buffer.from(await res.arrayBuffer())
        const media = await payload.create({
          collection: 'media',
          data: { alt: p.hr },
          file: { data, mimetype: 'image/jpeg', name: `shop-${p.slug}-${i + 1}.jpg`, size: data.length },
          locale: 'hr',
          req,
        })
        images.push(media.id)
      } catch (error) {
        payload.logger.warn(`Shop photo ${id} of ${p.slug} not downloaded: ${String(error)}`)
      }
    }
    const doc = await payload.create({
      collection: 'products',
      locale: 'hr',
      data: {
        name: p.hr,
        slug: p.slug,
        category: p.category,
        price: p.price,
        images,
        sizes: SIZES.map((size) => ({ size, stock: 10 })),
        active: true,
        order,
      },
      req,
    })
    await payload.update({ collection: 'products', id: doc.id, locale: 'en', data: { name: p.en }, req })
  }

  for (const locale of ['hr', 'en'] as const) {
    // Without the fallback, so the English text is not read as the Croatian one.
    const settings = await payload.findGlobal({ slug: 'siteSettings', locale, fallbackLocale: false, req })
    if (!settings.shop?.pickup) await payload.updateGlobal({ slug: 'siteSettings', locale, data: { shop: { ...settings.shop, pickup: PICKUP[locale] } }, req })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'products', where: { slug: { in: PRODUCTS.map((p) => p.slug) } }, req })
}

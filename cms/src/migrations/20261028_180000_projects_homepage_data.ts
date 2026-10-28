import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'
import data from '../seed-data/site-v3.json' with { type: 'json' }

// Data for the new admin sections (October 2026): the two projects, the home page texts, the names of the
// 3D car assemblies and the sponsor texts of the join form. All of it is the text the site had built in,
// so the site looks the same and every text can now be edited in the admin.

type Locale = 'hr' | 'en'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const p of data.projects) {
    const found = await payload.find({ collection: 'projects', where: { key: { equals: p.key } }, limit: 1, req })
    const doc =
      found.docs[0] ??
      (await payload.create({
        collection: 'projects',
        data: { key: p.key as 'formula-student' | 'motostudent', name: p.name, intro: p.hr },
        locale: 'hr',
        req,
      }))
    await payload.update({ collection: 'projects', id: doc.id, data: { intro: p.en }, locale: 'en', req })
  }

  for (const locale of ['hr', 'en'] as Locale[]) {
    const prev = await payload.findGlobal({ slug: 'homepage', locale, req })
    // Keep the row ids of the assembly list, so the English update writes into the same rows.
    const carParts = data.carParts.map((x, i) => ({ id: prev.carParts?.[i]?.id ?? undefined, part: x.part as never, name: x[locale] }))
    await payload.updateGlobal({ slug: 'homepage', data: { ...data.homepage[locale], carParts }, locale, req })
    // The join form needs its title. A database without one (a fresh one) keeps the built-in texts.
    const join = await payload.findGlobal({ slug: 'joinCta', locale, req })
    if (join.title) await payload.updateGlobal({ slug: 'joinCta', data: data.join[locale], locale, req })
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'projects', where: { key: { in: data.projects.map((p) => p.key) } }, req })
}

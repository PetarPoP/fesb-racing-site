import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-d1-sqlite'
import data from '../seed-data/site-v2.json' with { type: 'json' }

// Data for the new site structure (October 2026):
// - the five old teams (MEH, E&S, AER, KAR, M&B) become the six teams of the old site (PWT, ELE, DAE, DIN, KON, B&M),
// - one vehicle document per car and bike, in place of the two program documents "fs" and "ms",
// - CEO and CTO placeholders in the footer,
// - the website link of the competitions that have one.
// Photos stay empty: the site then uses its built-in photos and icons of the same slug or code.

const OLD_TEAMS = ['MEH', 'E&S', 'AER', 'KAR', 'M&B']
const OLD_VEHICLES = ['fs', 'ms']

/** Keep the row ids of an array, so the English update writes into the same rows. */
const sameRows = <T extends object>(rows: { id?: string | null }[] | null | undefined, values: T[]) =>
  (rows ?? []).map((row, i) => ({ id: row.id, ...values[i] }))

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Teams.
  await payload.delete({
    collection: 'teams',
    where: { code: { in: OLD_TEAMS } },
    req,
  })
  for (const [order, t] of data.teams.entries()) {
    const found = await payload.find({
      collection: 'teams',
      where: { code: { equals: t.code } },
      limit: 1,
      req,
    })
    const hr = {
      name: t.hr.name,
      code: t.code,
      program: 'both' as const,
      description: t.hr.description,
      about: t.hr.about,
      lead: {
        name: t.lead.name,
        email: t.lead.email || undefined,
        phone: t.lead.phone,
      },
      tags: t.hr.tags.map((tag) => ({ tag })),
      order,
    }
    const doc = found.docs[0]
      ? await payload.update({
          collection: 'teams',
          id: found.docs[0].id,
          data: hr,
          locale: 'hr',
          req,
        })
      : await payload.create({
          collection: 'teams',
          data: hr,
          locale: 'hr',
          req,
        })
    await payload.update({
      collection: 'teams',
      id: doc.id,
      locale: 'en',
      data: {
        name: t.en.name,
        description: t.en.description,
        about: t.en.about,
        tags: sameRows(
          doc.tags,
          t.en.tags.map((tag) => ({ tag })),
        ),
      },
      req,
    })
  }

  // Vehicles.
  await payload.delete({
    collection: 'vehicles',
    where: { slug: { in: OLD_VEHICLES } },
    req,
  })
  for (const v of data.vehicles) {
    const found = await payload.find({
      collection: 'vehicles',
      where: { slug: { equals: v.slug } },
      limit: 1,
      req,
    })
    if (found.docs[0]) continue
    const doc = await payload.create({
      collection: 'vehicles',
      locale: 'hr',
      data: {
        name: v.hr.name,
        slug: v.slug,
        kind: v.kind as 'car' | 'bike',
        season: v.season,
        order: v.order,
        specs: v.hr.specs.map(([key, value]) => ({ key, value })),
        results: v.hr.results.join('\n'),
        sections: v.hr.sections.map((s) => ({ title: s.t, text: s.d })),
      },
      req,
    })
    await payload.update({
      collection: 'vehicles',
      id: doc.id,
      locale: 'en',
      data: {
        name: v.en.name,
        specs: sameRows(
          doc.specs,
          v.en.specs.map(([key, value]) => ({ key, value })),
        ),
        results: v.en.results.join('\n'),
        sections: sameRows(
          doc.sections,
          v.en.sections.map((s) => ({ title: s.t, text: s.d })),
        ),
      },
      req,
    })
  }

  // CEO and CTO in the footer, when the footer has no contacts yet.
  const footer = await payload.findGlobal({
    slug: 'footer',
    locale: 'hr',
    req,
  })
  if (!footer.contacts?.length) {
    const hr = await payload.updateGlobal({
      slug: 'footer',
      locale: 'hr',
      data: {
        contacts: data.leaders.map((p) => ({
          role: p.hr.role,
          name: p.name,
          email: p.email,
          phone: p.phone,
        })),
      },
      req,
    })
    await payload.updateGlobal({
      slug: 'footer',
      locale: 'en',
      data: {
        contacts: sameRows(
          hr.contacts,
          data.leaders.map((p) => ({ role: p.en.role, name: p.name })),
        ),
      },
      req,
    })
  }

  // Website links of the competitions.
  const links = data.competitionLinks as Record<string, string>
  const comps = await payload.find({
    collection: 'competitions',
    limit: 100,
    req,
  })
  for (const c of comps.docs) {
    if (!c.link && links[c.name])
      await payload.update({
        collection: 'competitions',
        id: c.id,
        data: { link: links[c.name] },
        req,
      })
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // The old teams and program documents are not restored. The new documents can be deleted in the admin.
}

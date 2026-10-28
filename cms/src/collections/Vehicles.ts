import type { CollectionConfig } from 'payload'
import { sharedRacingFields } from '../fields'
import { anyone, writeAccess } from '../access'
import { slugify } from '../lib/slug'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: { singular: 'Vozilo', plural: 'Vozila (bolidi i motori)' },
  admin: {
    group: 'Projekti i vozila',
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'season', 'order', 'updatedAt'],
    description:
      'Jedan zapis po bolidu ili motociklu. Svako vozilo ima svoju stranicu, a stranica projekta (Formula Student ili MotoStudent) ih nabraja po redoslijedu. Prazne fotografije, podaci ili tekstovi koriste ugrađene s iste adrese.',
  },
  defaultSort: 'order',
  access: { read: anyone, ...writeAccess },
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', localized: true, required: true },
    {
      name: 'kind',
      label: 'Projekt',
      type: 'select',
      required: true,
      options: [
        { label: 'Bolid (Formula Student)', value: 'car' },
        { label: 'Motocikl (MotoStudent)', value: 'bike' },
      ],
    },
    { name: 'season', label: 'Sezona', type: 'text', admin: { description: 'Prikazuje se uz naziv, na primjer 2022/2023.' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Tekst',
          fields: [
            { name: 'description', label: 'Uvod', type: 'textarea', localized: true, admin: { description: 'Neobavezni uvodni tekst stranice vozila.' } },
            {
              name: 'sections',
              label: 'Sustavi',
              type: 'array',
              labels: { singular: 'Sustav', plural: 'Sustavi' },
              admin: { description: 'Tekst po sustavu (pogon, ovjes, šasija ...).' },
              fields: [
                { name: 'title', label: 'Naslov', type: 'text', localized: true, required: true },
                { name: 'text', label: 'Tekst', type: 'textarea', localized: true, required: true },
              ],
            },
          ],
        },
        {
          label: 'Fotografije',
          fields: [
            { name: 'cover', label: 'Glavna fotografija', type: 'upload', relationTo: 'media', admin: { description: 'Prikazuje se na kartici vozila i na vrhu njegove stranice.' } },
            ...sharedRacingFields.filter((f) => 'name' in f && f.name === 'gallery'),
          ],
        },
        {
          label: 'Podaci i rezultati',
          fields: sharedRacingFields.filter((f) => 'name' in f && (f.name === 'specs' || f.name === 'results' || f.name === 'year')),
        },
      ],
    },
    {
      name: 'slug',
      label: 'Adresa (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Dio web adrese stranice vozila. Ako ostane prazno, napravi se iz naziva.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => slugify(typeof value === 'string' && value ? value : String(data?.name ?? '')),
        ],
      },
    },
    { name: 'order', label: 'Redoslijed', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Manji broj se prikazuje prije.' } },
    ...sharedRacingFields.filter((f) => 'name' in f && f.name === 'link').map((f) => ({ ...f, admin: { hidden: true } }) as typeof f),
  ],
}

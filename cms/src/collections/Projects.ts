import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'

/** The two projects (Formula Student and MotoStudent): their card on the home page and their own page. */
export const Projects: CollectionConfig = {
  slug: 'projects',
  labels: { singular: 'Projekt', plural: 'Projekti' },
  admin: {
    group: 'Projekti i vozila',
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'updatedAt'],
    description:
      'Formula Student i MotoStudent: kartica na početnoj stranici i stranica projekta. Vozila svakog projekta su u „Vozila (bolidi i motori)“. Prazna polja koriste ugrađeni tekst i slike.',
  },
  access: { read: anyone, ...writeAccess, create: () => false, delete: () => false },
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', required: true },
    {
      name: 'intro',
      label: 'Opis',
      type: 'textarea',
      localized: true,
      admin: {
        rows: 12,
        description: 'Odlomke odvojite praznim retkom. Prvi odlomak se prikazuje na kartici na početnoj stranici, svi na stranici projekta.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'logoDark', label: 'Logotip za tamnu temu', type: 'upload', relationTo: 'media', admin: { width: '50%', description: 'Svijetli logotip.' } },
        { name: 'logoLight', label: 'Logotip za svijetlu temu', type: 'upload', relationTo: 'media', admin: { width: '50%', description: 'Tamni logotip.' } },
      ],
    },
    {
      name: 'key',
      label: 'Projekt',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'Formula Student', value: 'formula-student' },
        { label: 'MotoStudent', value: 'motostudent' },
      ],
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}

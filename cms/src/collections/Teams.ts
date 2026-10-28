import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'

export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: { singular: 'Podtim', plural: 'Podtimovi' },
  admin: {
    group: 'Timovi',
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'order'],
    description:
      'Šest podtimova kluba. Na početnoj stranici svaki ima karticu (ikona i naziv); klik na karticu otvara opis, područja rada i voditelja. Kratki opis se prikazuje u 3D prikazu bolida.',
  },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', localized: true, required: true },
    {
      name: 'description',
      label: 'Kratki opis (3D prikaz bolida)',
      type: 'textarea',
      localized: true,
      admin: { description: 'Jedna rečenica. Prikazuje se na kartici tima dok skrolate kroz 3D prikaz bolida.' },
    },
    {
      name: 'about',
      label: 'Opis tima',
      type: 'textarea',
      localized: true,
      admin: { description: 'Cijeli tekst o timu. Prikazuje se u prozoru koji se otvori klikom na karticu tima.' },
    },
    {
      name: 'tags',
      label: 'Područja rada',
      labels: { singular: 'Područje', plural: 'Područja' },
      type: 'array',
      fields: [{ name: 'tag', label: 'Područje', type: 'text', localized: true, required: true }],
    },
    {
      name: 'lead',
      type: 'group',
      label: 'Voditelj tima',
      fields: [
        { name: 'name', label: 'Ime i prezime', type: 'text' },
        { name: 'photo', label: 'Fotografija', type: 'upload', relationTo: 'media' },
        { name: 'email', label: 'E-mail', type: 'email' },
        { name: 'phone', label: 'Telefon', type: 'text' },
      ],
    },
    {
      name: 'icon',
      label: 'Ikona',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Neobavezno. Crni crtež na prozirnoj pozadini (PNG ili SVG). Prazno: ugrađena ikona.' },
    },
    {
      name: 'code',
      label: 'Oznaka',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'PWT, ELE, DAE, DIN, KON ili B&M. Ne mijenjati: po njoj 3D bolid zna koji su dijelovi tima i koja je boja tima.',
      },
    },
    {
      name: 'order',
      label: 'Redoslijed',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Manji broj se prikazuje prije.' },
    },
    {
      // The site does not use it any more. It stays (hidden) so the database keeps its column.
      name: 'program',
      type: 'select',
      defaultValue: 'both',
      admin: { hidden: true },
      options: [
        { label: 'Formula Student', value: 'formula-student' },
        { label: 'MotoStudent', value: 'motostudent' },
        { label: 'Both programs', value: 'both' },
      ],
    },
  ],
}

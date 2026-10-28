import type { CollectionConfig } from 'payload'
import { activeOrUser, writeAccess } from '../access'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Partner', plural: 'Partneri i sponzori' },
  admin: {
    group: 'Partneri',
    description: 'Logotipi u sekciji „Partneri“. Partner koji nije aktivan se ne prikazuje.',
    useAsTitle: 'name',
    defaultColumns: ['name', 'tier', 'order', 'active', 'url'],
  },
  access: { read: activeOrUser, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', required: true },
    { name: 'logo', label: 'Logotip', type: 'upload', relationTo: 'media', required: true },
    { name: 'url', label: 'Web stranica', type: 'text', admin: { description: 'Domena, na primjer firma.hr. Prazno ako partner nema stranicu.' } },
    {
      name: 'tier',
      label: 'Razina',
      type: 'select',
      required: true,
      defaultValue: 'supporter',
      index: true,
      options: [
        { label: 'Sveučilište', value: 'university' },
        { label: 'Glavni partner', value: 'main' },
        { label: 'Partner', value: 'partner' },
        { label: 'Podržava nas', value: 'supporter' },
      ],
    },
    { name: 'order', label: 'Redoslijed', type: 'number', defaultValue: 0, index: true, admin: { description: 'Manji broj se prikazuje prije.' } },
    {
      name: 'logoRatio',
      label: 'Omjer logotipa',
      type: 'number',
      admin: { description: 'Širina logotipa podijeljena s visinom. Stranica po njemu određuje veličinu logotipa.' },
    },
    { name: 'plainLogo', label: 'Logotip u originalnim bojama', type: 'checkbox', defaultValue: false, admin: { description: 'Bez bijelog filtera.' } },
    { name: 'active', label: 'Aktivan', type: 'checkbox', defaultValue: true, index: true },
  ],
}

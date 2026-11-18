import type { CollectionConfig } from 'payload'
import { activeOrUser, writeAccess } from '../access'
import { slugify } from '../lib/slug'

/** Product categories. The site shows them as filters, in this order. */
export const PRODUCT_CATEGORIES = [
  { label: 'Majice', value: 'majice' },
  { label: 'Hoodiji', value: 'hoodie' },
  { label: 'Jakne', value: 'jakne' },
  { label: 'Kape', value: 'kape' },
  { label: 'Ostalo', value: 'ostalo' },
]

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Proizvod', plural: 'Proizvodi' },
  admin: {
    group: 'Shop',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'active', 'order'],
    description: 'Ponuda shopa na stranici. Proizvod koji nije aktivan se ne prikazuje. Zaliha se smanjuje sa svakom narudžbom.',
  },
  defaultSort: 'order',
  access: { read: activeOrUser, ...writeAccess },
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', localized: true, required: true },
    {
      type: 'row',
      fields: [
        { name: 'category', label: 'Kategorija', type: 'select', required: true, defaultValue: 'majice', options: PRODUCT_CATEGORIES, admin: { width: '50%' } },
        { name: 'price', label: 'Cijena (€)', type: 'number', required: true, min: 0, admin: { width: '50%', step: 0.5 } },
      ],
    },
    { name: 'description', label: 'Opis', type: 'textarea', localized: true },
    {
      name: 'images',
      label: 'Fotografije',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Prva fotografija je glavna i prikazuje se na kartici proizvoda.' },
    },
    {
      name: 'sizes',
      label: 'Veličine i zaliha',
      type: 'array',
      labels: { singular: 'Veličina', plural: 'Veličine' },
      admin: { description: 'Jedan redak po veličini, s brojem komada na zalihi. Proizvod bez veličina (na primjer šalica) ostavlja popis prazan i koristi polje „Zaliha“ ispod.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'size', label: 'Veličina', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'stock', label: 'Na zalihi (kom)', type: 'number', required: true, min: 0, defaultValue: 0, admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'stock',
      label: 'Zaliha (kom)',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: { description: 'Samo za proizvod bez veličina.', condition: (data) => !data?.sizes?.length },
    },
    { name: 'active', label: 'Prikaži u shopu', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'slug',
      label: 'Adresa (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Dio web adrese stranice proizvoda. Ako ostane prazno, napravi se iz naziva.' },
      hooks: {
        beforeValidate: [({ value, data }) => slugify(typeof value === 'string' && value ? value : String(data?.name ?? ''))],
      },
    },
    { name: 'order', label: 'Redoslijed', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Manji broj se prikazuje prije.' } },
  ],
}

import type { Field } from 'payload'

/** Fields that vehicles and competitions share. */
export const sharedRacingFields: Field[] = [
  { name: 'year', type: 'number' },
  {
    name: 'specs',
    type: 'array',
    labels: { singular: 'Spec', plural: 'Specs' },
    fields: [
      { name: 'key', type: 'text', localized: true, required: true },
      { name: 'value', type: 'text', localized: true, required: true },
    ],
  },
  {
    name: 'gallery',
    type: 'array',
    fields: [
      { name: 'image', type: 'upload', relationTo: 'media', required: true },
      { name: 'caption', type: 'text', localized: true },
    ],
  },
  { name: 'results', type: 'textarea', localized: true },
  { name: 'link', type: 'text' },
]

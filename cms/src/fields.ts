import type { Field } from 'payload'

/** Fields that vehicles and competitions share. */
export const sharedRacingFields: Field[] = [
  { name: 'year', label: 'Godina', type: 'number' },
  {
    name: 'specs',
    label: 'Tehnički podaci',
    type: 'array',
    labels: { singular: 'Podatak', plural: 'Podaci' },
    admin: { description: 'Na primjer: Snaga motora · 68 kW (91 KS).' },
    fields: [
      { name: 'key', label: 'Naziv', type: 'text', localized: true, required: true },
      { name: 'value', label: 'Vrijednost', type: 'text', localized: true, required: true },
    ],
  },
  {
    name: 'gallery',
    label: 'Galerija',
    type: 'array',
    labels: { singular: 'Fotografija', plural: 'Fotografije' },
    fields: [
      { name: 'image', label: 'Slika', type: 'upload', relationTo: 'media', required: true },
      { name: 'caption', label: 'Opis', type: 'text', localized: true },
    ],
  },
  { name: 'results', label: 'Rezultati i nagrade', type: 'textarea', localized: true, admin: { description: 'Jedan rezultat ili nagrada po retku.' } },
  { name: 'link', label: 'Web stranica', type: 'text', admin: { description: 'Na primjer https://www.motostudent.com' } },
]

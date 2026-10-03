import type { CollectionConfig } from 'payload'
import { sharedRacingFields } from '../fields'
import { anyone, writeAccess } from '../access'
import { slugify } from '../lib/slug'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: { singular: 'Vehicle', plural: 'Vehicles (cars and bikes)' },
  admin: { group: 'Racing', useAsTitle: 'name', defaultColumns: ['name', 'kind', 'year', 'updatedAt'] },
  access: { read: anyone, ...writeAccess },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => slugify(typeof value === 'string' && value ? value : String(data?.name ?? '')),
        ],
      },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Car (Formula Student)', value: 'car' },
        { label: 'Bike (MotoStudent)', value: 'bike' },
      ],
    },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    ...sharedRacingFields,
  ],
}

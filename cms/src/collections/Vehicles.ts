import type { CollectionConfig } from 'payload'
import { sharedRacingFields } from '../fields'
import { anyone, writeAccess } from '../access'
import { slugify } from '../lib/slug'

export const Vehicles: CollectionConfig = {
  slug: 'vehicles',
  labels: { singular: 'Vehicle', plural: 'Vehicles (cars and bikes)' },
  admin: {
    group: 'Racing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'season', 'order', 'updatedAt'],
    description: 'One document per car or bike. The project pages list them by order. Empty photos, data or texts use the built-in ones of the same slug.',
  },
  defaultSort: 'order',
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
    { name: 'season', type: 'text', admin: { description: 'Shown next to the name, for example 2022/2023.' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'A lower number shows first.' } },
    { name: 'description', type: 'textarea', localized: true, admin: { description: 'Optional intro text of the vehicle page.' } },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      admin: { description: 'Text per system (powertrain, suspension, chassis ...).' },
      fields: [
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'text', type: 'textarea', localized: true, required: true },
      ],
    },
    ...sharedRacingFields,
  ],
}

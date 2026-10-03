import type { CollectionConfig } from 'payload'
import { sharedRacingFields } from '../fields'
import { anyone, writeAccess } from '../access'

export const Competitions: CollectionConfig = {
  slug: 'competitions',
  admin: { group: 'Racing', useAsTitle: 'name', defaultColumns: ['name', 'type', 'country', 'year', 'order'] },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'country', type: 'text', admin: { description: 'Two-letter country code, for example IT.' } },
    { name: 'place', type: 'text', localized: true },
    { name: 'type', type: 'select', options: [{ label: 'Formula Student', value: 'FS' }, { label: 'MotoStudent', value: 'MS' }] },
    { name: 'circuit', type: 'text', admin: { description: 'Circuit and town.' } },
    { name: 'venue', type: 'text', localized: true, admin: { description: 'Venue line in the map bar.' } },
    {
      name: 'map',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'spanLat', type: 'number', admin: { description: 'Half size of the map view in degrees.' } },
        { name: 'spanLng', type: 'number' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0 },
    ...sharedRacingFields,
  ],
}

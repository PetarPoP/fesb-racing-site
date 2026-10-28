import type { CollectionConfig } from 'payload'
import { sharedRacingFields } from '../fields'
import { anyone, writeAccess } from '../access'

export const Competitions: CollectionConfig = {
  slug: 'competitions',
  labels: { singular: 'Natjecanje', plural: 'Natjecanja' },
  admin: {
    group: 'Natjecanja',
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'country', 'order'],
    description: 'Natjecanja u sekciji „Natjecanja“ na početnoj stranici, s kartom staze.',
  },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: 'Naziv', type: 'text', required: true },
    { name: 'type', label: 'Projekt', type: 'select', options: [{ label: 'Formula Student', value: 'FS' }, { label: 'MotoStudent', value: 'MS' }] },
    { name: 'country', label: 'Država', type: 'text', admin: { description: 'Dvoslovna oznaka države, na primjer IT.' } },
    { name: 'place', label: 'Mjesto', type: 'text', localized: true },
    { name: 'circuit', label: 'Staza', type: 'text', admin: { description: 'Staza i grad.' } },
    { name: 'venue', label: 'Redak ispod karte', type: 'text', localized: true, admin: { description: 'Na primjer: MotorLand Aragón · 5,35 km' } },
    {
      name: 'mapPicker',
      type: 'ui',
      admin: { components: { Field: '/components/MapPicker' } },
    },
    {
      name: 'map',
      label: 'Karta',
      type: 'group',
      admin: { description: 'Karta iznad postavlja ove vrijednosti: središte i polovica veličine prikaza, u stupnjevima.' },
      fields: [
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
        { name: 'spanLat', type: 'number' },
        { name: 'spanLng', type: 'number' },
      ],
    },
    { name: 'order', label: 'Redoslijed', type: 'number', defaultValue: 0, admin: { position: 'sidebar', description: 'Manji broj se prikazuje prije.' } },
    // Only the website link shows on the site. The other shared fields stay (hidden) for their database columns.
    ...sharedRacingFields.map((f) => ('name' in f && f.name === 'link' ? f : ({ ...f, admin: { ...f.admin, hidden: true } } as typeof f))),
  ],
}

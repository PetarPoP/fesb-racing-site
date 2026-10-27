import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'

export const Teams: CollectionConfig = {
  slug: 'teams',
  admin: { group: 'Organisation', useAsTitle: 'name', defaultColumns: ['code', 'name', 'program', 'order'] },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Short code: PWT, ELE, DAE, DIN, KON or B&M. The 3D car uses it to find the parts of the team.' },
    },
    {
      name: 'program',
      type: 'select',
      defaultValue: 'both',
      options: [
        { label: 'Formula Student', value: 'formula-student' },
        { label: 'MotoStudent', value: 'motostudent' },
        { label: 'Both programs', value: 'both' },
      ],
    },
    { name: 'description', type: 'textarea', localized: true, admin: { description: 'One sentence. The 3D view of the car shows it.' } },
    { name: 'about', type: 'textarea', localized: true, admin: { description: 'Full text of the team card.' } },
    { name: 'icon', type: 'upload', relationTo: 'media', admin: { description: 'Optional. A black drawing on a transparent background (PNG or SVG). Empty: the built-in icon.' } },
    {
      name: 'lead',
      type: 'group',
      label: 'Team lead',
      fields: [
        { name: 'name', type: 'text' },
        { name: 'photo', type: 'upload', relationTo: 'media' },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
    },
    { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text', localized: true, required: true }] },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'

export const Teams: CollectionConfig = {
  slug: 'teams',
  admin: { group: 'Organisation', useAsTitle: 'name', defaultColumns: ['code', 'name', 'program', 'order'] },
  access: { read: anyone, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    { name: 'code', type: 'text', required: true, unique: true, admin: { description: 'Short code, for example MEH.' } },
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
    { name: 'description', type: 'textarea', localized: true },
    { name: 'tags', type: 'array', fields: [{ name: 'tag', type: 'text', localized: true, required: true }] },
    { name: 'order', type: 'number', defaultValue: 0 },
  ],
}

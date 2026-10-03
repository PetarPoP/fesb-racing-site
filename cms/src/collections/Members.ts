import type { CollectionConfig } from 'payload'
import { activeOrUser, writeAccess } from '../access'

export const Members: CollectionConfig = {
  slug: 'members',
  admin: { group: 'Organisation', useAsTitle: 'name', defaultColumns: ['name', 'team', 'role', 'year', 'order', 'active'] },
  access: { read: activeOrUser, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', localized: true },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'team', type: 'relationship', relationTo: 'teams', index: true },
    {
      name: 'program',
      type: 'select',
      options: [
        { label: 'Formula Student', value: 'formula-student' },
        { label: 'MotoStudent', value: 'motostudent' },
        { label: 'Both programs', value: 'both' },
      ],
    },
    { name: 'division', type: 'text', admin: { description: 'Optional sub-group inside the team.' } },
    { name: 'year', type: 'number', admin: { description: 'Year the member joined.' } },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
  ],
}

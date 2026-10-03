import type { CollectionConfig } from 'payload'
import { activeOrUser, writeAccess } from '../access'

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    group: 'Organisation',
    useAsTitle: 'name',
    defaultColumns: ['name', 'tier', 'order', 'active', 'url'],
  },
  access: { read: activeOrUser, ...writeAccess },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media', required: true },
    { name: 'url', type: 'text', admin: { description: 'Domain with an optional path. Empty if the partner has no site.' } },
    {
      name: 'tier',
      type: 'select',
      required: true,
      defaultValue: 'supporter',
      index: true,
      options: [
        { label: 'University', value: 'university' },
        { label: 'Main partner', value: 'main' },
        { label: 'Partner', value: 'partner' },
        { label: 'Supporter', value: 'supporter' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, index: true, admin: { description: 'A lower number shows first.' } },
    {
      name: 'logoRatio',
      type: 'number',
      admin: { description: 'Logo width divided by height. The site uses it to size the logo.' },
    },
    { name: 'plainLogo', type: 'checkbox', defaultValue: false, admin: { description: 'The logo keeps its own colours (no white filter).' } },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
  ],
}

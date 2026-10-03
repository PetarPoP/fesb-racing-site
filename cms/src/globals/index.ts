import type { GlobalConfig } from 'payload'
import { anyone, isLoggedIn } from '../access'

const access = { read: anyone, update: isLoggedIn }

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site settings',
  admin: { group: 'Site' },
  access,
  fields: [
    { name: 'name', type: 'text', required: true, defaultValue: 'FESB Racing' },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'address', type: 'text', localized: true },
      ],
    },
    {
      name: 'social',
      type: 'array',
      labels: { singular: 'Social link', plural: 'Social links' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: ['instagram', 'facebook', 'linkedin', 'youtube', 'tiktok', 'x'],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}

export const Stats: GlobalConfig = {
  slug: 'stats',
  admin: { group: 'Site' },
  access,
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'value', type: 'text', required: true },
        { name: 'label', type: 'text', localized: true, required: true },
      ],
    },
  ],
}

export const Ticker: GlobalConfig = {
  slug: 'ticker',
  admin: { group: 'Site' },
  access,
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [{ name: 'text', type: 'text', localized: true, required: true }],
    },
  ],
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: { group: 'Site' },
  access,
  fields: [
    { name: 'copyright', type: 'text', localized: true },
    { name: 'teamHeading', type: 'text', localized: true },
    { name: 'programHeading', type: 'text', localized: true },
    { name: 'followHeading', type: 'text', localized: true },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}

export const JoinCta: GlobalConfig = {
  slug: 'joinCta',
  label: 'Join call to action',
  admin: { group: 'Site' },
  access,
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'text', type: 'textarea', localized: true },
    { name: 'buttonLabel', type: 'text', localized: true },
  ],
}

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
    {
      name: 'shop',
      type: 'group',
      admin: { description: 'Shopify store of the shop page (/shop). The Shop link shows in the menu when "enabled" is on.' },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false },
        { name: 'storeDomain', type: 'text', admin: { description: 'For example fesb-racing.myshopify.com' } },
        {
          name: 'storefrontToken',
          type: 'text',
          admin: { description: 'Storefront API access token (public, Shopify admin → Apps → Headless or a custom app). Not the Admin API token.' },
        },
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
    // The footer has no link columns any more. The two fields stay hidden, so the database keeps its columns.
    { name: 'teamHeading', type: 'text', localized: true, admin: { hidden: true } },
    { name: 'programHeading', type: 'text', localized: true, admin: { hidden: true } },
    { name: 'followHeading', type: 'text', localized: true },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'contacts',
      type: 'array',
      labels: { singular: 'Contact', plural: 'Contacts' },
      admin: { description: 'Club contacts in the footer, for example CEO and CTO.' },
      fields: [
        { name: 'role', type: 'text', localized: true, required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'photo', type: 'upload', relationTo: 'media' },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
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

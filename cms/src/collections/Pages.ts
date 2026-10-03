import type { Block, CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { publishedOrUser, writeAccess } from '../access'
import { slugFromTitle } from '../lib/slug'

const Hero: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Hero blocks' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'subheading', type: 'textarea', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'ctaLabel', type: 'text', localized: true },
    { name: 'ctaUrl', type: 'text' },
  ],
}

const Text: Block = {
  slug: 'text',
  labels: { singular: 'Text', plural: 'Text blocks' },
  fields: [{ name: 'content', type: 'richText', localized: true, editor: lexicalEditor() }],
}

const Gallery: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Gallery blocks' },
  fields: [
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true },
      ],
    },
  ],
}

const Cta: Block = {
  slug: 'cta',
  labels: { singular: 'Call to action', plural: 'Call to action blocks' },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'text', type: 'textarea', localized: true },
    { name: 'buttonLabel', type: 'text', localized: true },
    { name: 'buttonUrl', type: 'text' },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${locale?.code ?? 'hr'}/${data?.slug === 'home' ? '' : (data?.slug ?? '')}`,
    },
  },
  access: { read: publishedOrUser, ...writeAccess },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    { name: 'layout', type: 'blocks', blocks: [Hero, Text, Gallery, Cta] },
  ],
}

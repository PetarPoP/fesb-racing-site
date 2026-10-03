import type { Block, CollectionConfig } from 'payload'
import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
  CodeBlock,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  StrikethroughFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { publishedOrUser, writeAccess } from '../access'
import { slugFromTitle } from '../lib/slug'

/** A gallery block for the news body. The site renders it as a figure grid, masonry or carousel. */
const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'NewsGalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      required: true,
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Masonry', value: 'masonry' },
        { label: 'Carousel', value: 'carousel' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}

/**
 * The full Lexical feature set of Payload 3.90.2.
 * The Markdown shortcuts (# , **, -, >, ```) are active for every feature that has a transformer.
 */
const newsEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    LinkFeature({ enabledCollections: ['pages', 'news'] }),
    UnorderedListFeature(),
    OrderedListFeature(),
    ChecklistFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    AlignFeature(),
    IndentFeature(),
    EXPERIMENTAL_TableFeature(),
    UploadFeature({
      enabledCollections: ['media'],
      collections: {
        media: {
          fields: [
            { name: 'alt', type: 'text', admin: { description: 'Optional. It replaces the alt text of the media file.' } },
            { name: 'caption', type: 'text', admin: { description: 'Optional. It shows under the image.' } },
          ],
        },
      },
    }),
    BlocksFeature({ blocks: [CodeBlock(), GalleryBlock] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News post', plural: 'News' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${locale?.code ?? 'hr'}/novosti/${data?.slug ?? ''}`,
    },
  },
  access: { read: publishedOrUser, ...writeAccess },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Used in the URL. It is made from the title when empty.' },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    { name: 'publishedAt', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    { name: 'tags', type: 'text', hasMany: true, localized: true, admin: { position: 'sidebar' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'cover', type: 'upload', relationTo: 'media' },
            { name: 'excerpt', type: 'textarea', localized: true },
            { name: 'body', type: 'richText', localized: true, editor: newsEditor },
          ],
        },
        {
          label: 'Gallery',
          description: 'Optional photos. The site shows them below the text of the post.',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              labels: { singular: 'Photo', plural: 'Photos' },
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text', localized: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

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
export const newsEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    LinkFeature({ enabledCollections: ['pages', 'news', 'announcements'] }),
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

/**
 * Blog posts: the longer stories at the bottom of the home page and on /blog.
 * The slug stays "news" because the posts were in this collection before the split. The short news are "announcements".
 */
export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Blog članak', plural: 'Blog (za sponzore)' },
  admin: {
    group: 'Novosti i blog',
    useAsTitle: 'title',
    description: 'Duži članci iz radionice, pisani za partnere i sponzore. Najnoviji se prikazuju na dnu početne stranice, a svi na stranici /blog.',
    defaultColumns: ['title', 'publishedAt', '_status', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${locale?.code ?? 'hr'}/blog/${data?.slug ?? ''}`,
    },
  },
  access: { read: publishedOrUser, ...writeAccess },
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 25 },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Naslov', type: 'text', localized: true, required: true },
    {
      name: 'slug',
      label: 'Adresa (slug)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Dio web adrese. Ako ostane prazno, napravi se iz naslova.' },
      hooks: { beforeValidate: [slugFromTitle] },
    },
    { name: 'publishedAt', label: 'Datum objave', type: 'date', admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    { name: 'tags', label: 'Oznake', type: 'text', hasMany: true, localized: true, admin: { position: 'sidebar' } },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Sadržaj',
          fields: [
            { name: 'cover', label: 'Naslovna slika', type: 'upload', relationTo: 'media' },
            { name: 'excerpt', label: 'Sažetak', type: 'textarea', localized: true, admin: { description: 'Dvije do tri rečenice za karticu članka.' } },
            { name: 'body', label: 'Tekst', type: 'richText', localized: true, editor: newsEditor },
          ],
        },
        {
          label: 'Galerija',
          description: 'Neobavezne fotografije. Prikazuju se ispod teksta članka.',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              label: 'Fotografije',
              labels: { singular: 'Fotografija', plural: 'Fotografije' },
              fields: [
                { name: 'image', label: 'Slika', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', label: 'Opis', type: 'text', localized: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

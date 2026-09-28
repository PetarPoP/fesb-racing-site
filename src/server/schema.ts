import { date, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const news = pgTable('news', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  date: date('date').notNull(),
  imageUrl: text('image_url'),
  titleHr: text('title_hr').notNull(),
  titleEn: text('title_en').notNull().default(''),
  tagHr: text('tag_hr').notNull().default(''),
  tagEn: text('tag_en').notNull().default(''),
  excerptHr: text('excerpt_hr').notNull().default(''),
  excerptEn: text('excerpt_en').notNull().default(''),
  bodyHr: text('body_hr').notNull().default(''),
  bodyEn: text('body_en').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const sponsors = pgTable('sponsors', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  website: text('website').notNull().default(''),
  logoUrl: text('logo_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  summaryHr: text('summary_hr').notNull().default(''),
  summaryEn: text('summary_en').notNull().default(''),
  bodyHr: text('body_hr').notNull().default(''),
  bodyEn: text('body_en').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type News = typeof news.$inferSelect
export type Sponsor = typeof sponsors.$inferSelect

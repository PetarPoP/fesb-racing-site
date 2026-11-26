import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`seo_google_verification\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`seo_bing_verification\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`seo_google_verification\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`seo_bing_verification\`;`)
}

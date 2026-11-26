import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` ADD \`stock_taken\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_password\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_track_stock\` integer DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders\` DROP COLUMN \`stock_taken\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_password\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_track_stock\`;`)
}

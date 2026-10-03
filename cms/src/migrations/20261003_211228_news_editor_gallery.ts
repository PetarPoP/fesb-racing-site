import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`news_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`news_gallery_order_idx\` ON \`news_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`news_gallery_parent_id_idx\` ON \`news_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`news_gallery_image_idx\` ON \`news_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`news_gallery_locales\` (
  	\`caption\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`news_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`news_gallery_locales_locale_parent_id_unique\` ON \`news_gallery_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_news_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_news_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_news_v_version_gallery_order_idx\` ON \`_news_v_version_gallery\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_news_v_version_gallery_parent_id_idx\` ON \`_news_v_version_gallery\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_news_v_version_gallery_image_idx\` ON \`_news_v_version_gallery\` (\`image_id\`);`)
  await db.run(sql`CREATE TABLE \`_news_v_version_gallery_locales\` (
  	\`caption\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_news_v_version_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_news_v_version_gallery_locales_locale_parent_id_unique\` ON \`_news_v_version_gallery_locales\` (\`_locale\`,\`_parent_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`news_gallery\`;`)
  await db.run(sql`DROP TABLE \`news_gallery_locales\`;`)
  await db.run(sql`DROP TABLE \`_news_v_version_gallery\`;`)
  await db.run(sql`DROP TABLE \`_news_v_version_gallery_locales\`;`)
}

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`announcements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`published_at\` text,
  	\`cover_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`announcements_slug_idx\` ON \`announcements\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`announcements_cover_idx\` ON \`announcements\` (\`cover_id\`);`)
  await db.run(sql`CREATE INDEX \`announcements_updated_at_idx\` ON \`announcements\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`announcements_created_at_idx\` ON \`announcements\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`announcements__status_idx\` ON \`announcements\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`announcements_locales\` (
  	\`title\` text,
  	\`excerpt\` text,
  	\`body\` text,
  	\`meta_title\` text,
  	\`meta_description\` text,
  	\`meta_image_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`announcements\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`announcements_meta_meta_image_idx\` ON \`announcements_locales\` (\`meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`announcements_locales_locale_parent_id_unique\` ON \`announcements_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`announcements_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	\`locale\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`announcements\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`announcements_texts_order_parent\` ON \`announcements_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`announcements_texts_locale_parent\` ON \`announcements_texts\` (\`locale\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_announcements_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_published_at\` text,
  	\`version_cover_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`announcements\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_announcements_v_parent_idx\` ON \`_announcements_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_version_version_slug_idx\` ON \`_announcements_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_version_version_cover_idx\` ON \`_announcements_v\` (\`version_cover_id\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_version_version_updated_at_idx\` ON \`_announcements_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_version_version_created_at_idx\` ON \`_announcements_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_version_version__status_idx\` ON \`_announcements_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_created_at_idx\` ON \`_announcements_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_updated_at_idx\` ON \`_announcements_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_snapshot_idx\` ON \`_announcements_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_published_locale_idx\` ON \`_announcements_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_latest_idx\` ON \`_announcements_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_autosave_idx\` ON \`_announcements_v\` (\`autosave\`);`)
  await db.run(sql`CREATE TABLE \`_announcements_v_locales\` (
  	\`version_title\` text,
  	\`version_excerpt\` text,
  	\`version_body\` text,
  	\`version_meta_title\` text,
  	\`version_meta_description\` text,
  	\`version_meta_image_id\` integer,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`version_meta_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_announcements_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_announcements_v_version_meta_version_meta_image_idx\` ON \`_announcements_v_locales\` (\`version_meta_image_id\`,\`_locale\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`_announcements_v_locales_locale_parent_id_unique\` ON \`_announcements_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_announcements_v_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	\`locale\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_announcements_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_announcements_v_texts_order_parent\` ON \`_announcements_v_texts\` (\`order\`,\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_announcements_v_texts_locale_parent\` ON \`_announcements_v_texts\` (\`locale\`,\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`vehicles_sections\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`vehicles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`vehicles_sections_order_idx\` ON \`vehicles_sections\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`vehicles_sections_parent_id_idx\` ON \`vehicles_sections\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`vehicles_sections_locales\` (
  	\`title\` text NOT NULL,
  	\`text\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`vehicles_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`vehicles_sections_locales_locale_parent_id_unique\` ON \`vehicles_sections_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_contacts\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`photo_id\` integer,
  	\`email\` text,
  	\`phone\` text,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`footer_contacts_order_idx\` ON \`footer_contacts\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`footer_contacts_parent_id_idx\` ON \`footer_contacts\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`footer_contacts_photo_idx\` ON \`footer_contacts\` (\`photo_id\`);`)
  await db.run(sql`CREATE TABLE \`footer_contacts_locales\` (
  	\`role\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`footer_contacts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`footer_contacts_locales_locale_parent_id_unique\` ON \`footer_contacts_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`icon_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`lead_name\` text;`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`lead_photo_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`lead_email\` text;`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`lead_phone\` text;`)
  await db.run(sql`CREATE INDEX \`teams_icon_idx\` ON \`teams\` (\`icon_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_lead_lead_photo_idx\` ON \`teams\` (\`lead_photo_id\`);`)
  await db.run(sql`ALTER TABLE \`teams_locales\` ADD \`about\` text;`)
  await db.run(sql`ALTER TABLE \`vehicles\` ADD \`season\` text;`)
  await db.run(sql`ALTER TABLE \`vehicles\` ADD \`order\` numeric DEFAULT 0;`)
  await db.run(sql`ALTER TABLE \`redirects_rels\` ADD \`announcements_id\` integer REFERENCES announcements(id);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_announcements_id_idx\` ON \`redirects_rels\` (\`announcements_id\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`announcements_id\` integer REFERENCES announcements(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_announcements_id_idx\` ON \`payload_locked_documents_rels\` (\`announcements_id\`);`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_enabled\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_store_domain\` text;`)
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_storefront_token\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`announcements\`;`)
  await db.run(sql`DROP TABLE \`announcements_locales\`;`)
  await db.run(sql`DROP TABLE \`announcements_texts\`;`)
  await db.run(sql`DROP TABLE \`_announcements_v\`;`)
  await db.run(sql`DROP TABLE \`_announcements_v_locales\`;`)
  await db.run(sql`DROP TABLE \`_announcements_v_texts\`;`)
  await db.run(sql`DROP TABLE \`vehicles_sections\`;`)
  await db.run(sql`DROP TABLE \`vehicles_sections_locales\`;`)
  await db.run(sql`DROP TABLE \`footer_contacts\`;`)
  await db.run(sql`DROP TABLE \`footer_contacts_locales\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_teams\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text NOT NULL,
  	\`program\` text DEFAULT 'both',
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`INSERT INTO \`__new_teams\`("id", "code", "program", "order", "updated_at", "created_at") SELECT "id", "code", "program", "order", "updated_at", "created_at" FROM \`teams\`;`)
  await db.run(sql`DROP TABLE \`teams\`;`)
  await db.run(sql`ALTER TABLE \`__new_teams\` RENAME TO \`teams\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`teams_code_idx\` ON \`teams\` (\`code\`);`)
  await db.run(sql`CREATE INDEX \`teams_updated_at_idx\` ON \`teams\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`teams_created_at_idx\` ON \`teams\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`__new_redirects_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`news_id\` integer,
  	\`pages_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`news_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_redirects_rels\`("id", "order", "parent_id", "path", "news_id", "pages_id") SELECT "id", "order", "parent_id", "path", "news_id", "pages_id" FROM \`redirects_rels\`;`)
  await db.run(sql`DROP TABLE \`redirects_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_redirects_rels\` RENAME TO \`redirects_rels\`;`)
  await db.run(sql`CREATE INDEX \`redirects_rels_order_idx\` ON \`redirects_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_parent_idx\` ON \`redirects_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_path_idx\` ON \`redirects_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_news_id_idx\` ON \`redirects_rels\` (\`news_id\`);`)
  await db.run(sql`CREATE INDEX \`redirects_rels_pages_id_idx\` ON \`redirects_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`news_id\` integer,
  	\`pages_id\` integer,
  	\`partners_id\` integer,
  	\`teams_id\` integer,
  	\`members_id\` integer,
  	\`vehicles_id\` integer,
  	\`competitions_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`redirects_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`news_id\`) REFERENCES \`news\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`partners_id\`) REFERENCES \`partners\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`members_id\`) REFERENCES \`members\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`vehicles_id\`) REFERENCES \`vehicles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`competitions_id\`) REFERENCES \`competitions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`redirects_id\`) REFERENCES \`redirects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "news_id", "pages_id", "partners_id", "teams_id", "members_id", "vehicles_id", "competitions_id", "forms_id", "form_submissions_id", "redirects_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "news_id", "pages_id", "partners_id", "teams_id", "members_id", "vehicles_id", "competitions_id", "forms_id", "form_submissions_id", "redirects_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_news_id_idx\` ON \`payload_locked_documents_rels\` (\`news_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_partners_id_idx\` ON \`payload_locked_documents_rels\` (\`partners_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_members_id_idx\` ON \`payload_locked_documents_rels\` (\`members_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_vehicles_id_idx\` ON \`payload_locked_documents_rels\` (\`vehicles_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_competitions_id_idx\` ON \`payload_locked_documents_rels\` (\`competitions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_redirects_id_idx\` ON \`payload_locked_documents_rels\` (\`redirects_id\`);`)
  await db.run(sql`ALTER TABLE \`teams_locales\` DROP COLUMN \`about\`;`)
  await db.run(sql`ALTER TABLE \`vehicles\` DROP COLUMN \`season\`;`)
  await db.run(sql`ALTER TABLE \`vehicles\` DROP COLUMN \`order\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_enabled\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_store_domain\`;`)
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_storefront_token\`;`)
}

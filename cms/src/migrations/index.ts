import * as migration_20261003_200235_initial from './20261003_200235_initial';
import * as migration_20261003_211228_news_editor_gallery from './20261003_211228_news_editor_gallery';
import * as migration_20261027_204751_six_teams_news_shop from './20261027_204751_six_teams_news_shop';
import * as migration_20261028_174608_projects_homepage_admin from './20261028_174608_projects_homepage_admin';
import * as migration_20261028_174650_shop from './20261028_174650_shop';
import * as migration_20261028_174700_six_teams_data from './20261028_174700_six_teams_data';
import * as migration_20261028_180000_projects_homepage_data from './20261028_180000_projects_homepage_data';
import * as migration_20261118_090000_shop_products from './20261118_090000_shop_products';

export const migrations = [
  {
    up: migration_20261003_200235_initial.up,
    down: migration_20261003_200235_initial.down,
    name: '20261003_200235_initial',
  },
  {
    up: migration_20261003_211228_news_editor_gallery.up,
    down: migration_20261003_211228_news_editor_gallery.down,
    name: '20261003_211228_news_editor_gallery',
  },
  {
    up: migration_20261027_204751_six_teams_news_shop.up,
    down: migration_20261027_204751_six_teams_news_shop.down,
    name: '20261027_204751_six_teams_news_shop',
  },
  {
    up: migration_20261028_174608_projects_homepage_admin.up,
    down: migration_20261028_174608_projects_homepage_admin.down,
    name: '20261028_174608_projects_homepage_admin',
  },
  // Schema migrations go before 20261028_174700: the data migrations below write through Payload with the
  // current config, so every table of the config must exist when they run. "payload migrate" runs the files
  // in name order and skips the ones the database already has, so a new schema migration takes a name
  // just before 20261028_174700 (production ran the data migrations already and runs only the new one).
  {
    up: migration_20261028_174650_shop.up,
    down: migration_20261028_174650_shop.down,
    name: '20261028_174650_shop',
  },
  {
    up: migration_20261028_174700_six_teams_data.up,
    down: migration_20261028_174700_six_teams_data.down,
    name: '20261028_174700_six_teams_data',
  },
  {
    up: migration_20261028_180000_projects_homepage_data.up,
    down: migration_20261028_180000_projects_homepage_data.down,
    name: '20261028_180000_projects_homepage_data',
  },
  {
    up: migration_20261118_090000_shop_products.up,
    down: migration_20261118_090000_shop_products.down,
    name: '20261118_090000_shop_products',
  },
];

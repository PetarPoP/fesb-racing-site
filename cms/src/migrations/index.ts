import * as migration_20261003_200235_initial from './20261003_200235_initial';
import * as migration_20261003_211228_news_editor_gallery from './20261003_211228_news_editor_gallery';
import * as migration_20261027_204751_six_teams_news_shop from './20261027_204751_six_teams_news_shop';
import * as migration_20261027_210000_six_teams_data from './20261027_210000_six_teams_data';

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
    up: migration_20261027_210000_six_teams_data.up,
    down: migration_20261027_210000_six_teams_data.down,
    name: '20261027_210000_six_teams_data',
  },
];

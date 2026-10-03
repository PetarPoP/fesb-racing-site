import * as migration_20261003_200235_initial from './20261003_200235_initial';
import * as migration_20261003_211228_news_editor_gallery from './20261003_211228_news_editor_gallery';

export const migrations = [
  {
    up: migration_20261003_200235_initial.up,
    down: migration_20261003_200235_initial.down,
    name: '20261003_200235_initial',
  },
  {
    up: migration_20261003_211228_news_editor_gallery.up,
    down: migration_20261003_211228_news_editor_gallery.down,
    name: '20261003_211228_news_editor_gallery'
  },
];

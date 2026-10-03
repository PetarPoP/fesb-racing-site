import type { CollectionConfig } from 'payload'
import { anyone, writeAccess } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Library',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'updatedAt'],
  },
  access: { read: anyone, ...writeAccess },
  fields: [{ name: 'alt', type: 'text', localized: true, required: true }],
  upload: {
    // Crop and focal point need sharp. Workers do not support sharp.
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/*'],
    // Payload makes these sizes only when sharp is available (local Node runtime).
    // On Workers the original file is the only file. Use width/height in the frontend.
    imageSizes: [
      { name: 'thumbnail', width: 320, height: 240, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined },
    ],
    adminThumbnail: 'thumbnail',
  },
}

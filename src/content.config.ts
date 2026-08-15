import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';

import { contentCollectionSchema } from './schema/document';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: contentCollectionSchema,
  }),
};

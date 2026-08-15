import { describe, expect, it } from 'vitest';

import { normalizeDocumentFrontmatter } from '../src/lib/normalize-document';
import { documentSourceSchema } from '../src/schema/document';

describe('normalizeDocumentFrontmatter', () => {
  it('maps hsblabs.sidebar to Starlight sidebar frontmatter', () => {
    const document = documentSourceSchema.parse({
      schema_version: '2026-08-15',
      type: 'Guide',
      title: 'Getting Started',
      hsblabs: {
        sidebar: {
          order: 10,
          label: 'Start here',
          hidden: false,
        },
      },
    });

    expect(normalizeDocumentFrontmatter(document)).toMatchObject({
      hsblabs: {
        sidebar: {
          order: 10,
          label: 'Start here',
          hidden: false,
        },
      },
      sidebar: {
        order: 10,
        label: 'Start here',
        hidden: false,
      },
    });
  });
});

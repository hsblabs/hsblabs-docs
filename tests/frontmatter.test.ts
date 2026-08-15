import { parseFrontmatter } from '@astrojs/internal-helpers/frontmatter';
import { describe, expect, it } from 'vitest';

import { stringifyMarkdownFrontmatter } from '../scripts/lib/frontmatter';
import { documentSourceSchema } from '../src/schema/document';

describe('stringifyMarkdownFrontmatter', () => {
  it('preserves schema versions as strings for Astro', () => {
    const markdown = stringifyMarkdownFrontmatter(
      {
        schema_version: '2026-08-15',
        type: 'Guide',
        title: 'Getting Started',
      },
      'Body',
    );

    expect(() =>
      documentSourceSchema.parse(parseFrontmatter(markdown).frontmatter),
    ).not.toThrow();
  });
});

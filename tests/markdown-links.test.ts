import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  findLocalAssetReferences,
  rewriteMarkdownLinks,
} from '../scripts/lib/markdown-links';

describe('rewriteMarkdownLinks', () => {
  it('rewrites OKF bundle-relative Markdown links to the project route', () => {
    expect(
      rewriteMarkdownLinks('See [API](/reference/api.md).', 'scrape-kdl'),
    ).toBe('See [API](/hsblabs/oss/scrape-kdl/reference/api/).');
  });

  it('rewrites relative Markdown links without coupling them to the domain', () => {
    expect(
      rewriteMarkdownLinks(
        'See [API](../reference/api.md?mode=full#client).',
        'scrape-kdl',
      ),
    ).toBe('See [API](../reference/api/?mode=full#client).');
  });

  it('rewrites bundle-relative assets to the project asset namespace', () => {
    expect(
      rewriteMarkdownLinks(
        '![Architecture](/assets/architecture.svg?v=1)',
        'scrape-kdl',
      ),
    ).toBe(
      '![Architecture](/hsblabs/oss/scrape-kdl/assets/architecture.svg?v=1)',
    );
  });
});

describe('findLocalAssetReferences', () => {
  const docsRoot = resolve('/repo/docs/www');
  const sourceFile = resolve(docsRoot, 'guides/start.md');

  it('accepts local assets that resolve under docs/www/assets', () => {
    const [reference] = findLocalAssetReferences(
      '![Diagram](../assets/diagram.svg?v=1)',
      sourceFile,
      docsRoot,
    );

    expect(reference).toMatchObject({
      target: '../assets/diagram.svg?v=1',
      resolvedPath: resolve(docsRoot, 'assets/diagram.svg'),
      isWithinAssetsDirectory: true,
    });
  });

  it('rejects local files outside docs/www/assets', () => {
    const [reference] = findLocalAssetReferences(
      '[Download](../private.json)',
      sourceFile,
      docsRoot,
    );

    expect(reference?.isWithinAssetsDirectory).toBe(false);
  });
});

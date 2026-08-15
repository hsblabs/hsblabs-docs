import { execFile } from 'node:child_process';
import { cp, readFile, rename, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import { pathExists } from '../scripts/lib/fs';

const execFileAsync = promisify(execFile);

describe('source locale directories', () => {
  it('maps docs/www/ja to the site locale route', async () => {
    const projectSlug = 'universal-speedtest-cli';
    const syncedRepositoryRoot = `.context/repos/${projectSlug}`;
    const backupRepositoryRoot = `.context/locale-routing-repository-${process.pid}`;
    const generatedContentRoot = `src/content/docs/${projectSlug}`;
    const generatedLocalizedContentRoot = `src/content/docs/ja/${projectSlug}`;
    const generatedAssetsRoot = `public/${projectSlug}`;
    const outputRoot = '.context/locale-routing-dist';
    const hadSyncedRepository = await pathExists(syncedRepositoryRoot);

    try {
      if (hadSyncedRepository) {
        await rm(backupRepositoryRoot, { recursive: true, force: true });
        await rename(syncedRepositoryRoot, backupRepositoryRoot);
      }
      await rm(syncedRepositoryRoot, { recursive: true, force: true });
      await cp(`fixtures/${projectSlug}`, syncedRepositoryRoot, {
        recursive: true,
      });
      await execFileAsync('bun', ['run', 'content:prepare']);

      await execFileAsync('bun', [
        'x',
        'astro',
        'build',
        '--outDir',
        outputRoot,
      ]);

      const englishPage = `${outputRoot}/${projectSlug}/guide/index.html`;
      const localizedPage = `${outputRoot}/ja/${projectSlug}/guide/index.html`;
      const localizedFallbackPage = `${outputRoot}/ja/${projectSlug}/fallback/index.html`;
      const nestedProjectPage = `${outputRoot}/${projectSlug}/ja/guide/index.html`;

      expect(await pathExists(englishPage)).toBe(true);
      expect(await pathExists(localizedPage)).toBe(true);
      expect(await pathExists(localizedFallbackPage)).toBe(true);
      expect(await pathExists(nestedProjectPage)).toBe(false);
      expect(await readFile(englishPage, 'utf8')).toContain('English guide');
      expect(await readFile(localizedPage, 'utf8')).toContain(
        'Japanese source guide',
      );
      expect(await readFile(localizedFallbackPage, 'utf8')).toContain(
        'English fallback reference',
      );
    } finally {
      await rm(syncedRepositoryRoot, { recursive: true, force: true });
      await rm(generatedContentRoot, { recursive: true, force: true });
      await rm(generatedLocalizedContentRoot, { recursive: true, force: true });
      await rm(generatedAssetsRoot, { recursive: true, force: true });
      await rm(outputRoot, { recursive: true, force: true });
      if (hadSyncedRepository) {
        await rename(backupRepositoryRoot, syncedRepositoryRoot);
      }
    }
  });
});

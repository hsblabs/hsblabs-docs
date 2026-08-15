import { relative, resolve, sep } from 'node:path';
import { rm } from 'node:fs/promises';

import { normalizeDocumentFrontmatter } from '../src/lib/normalize-document';
import { loadEnabledProjects } from '../src/lib/projects';
import {
  documentSourceSchema,
  validateDocumentSemantics,
} from '../src/schema/document';
import {
  copyFileEnsuringParent,
  pathExists,
  readText,
  walkFiles,
  writeText,
} from './lib/fs';
import {
  parseMarkdownFrontmatter,
  stringifyMarkdownFrontmatter,
} from './lib/frontmatter';
import {
  findLocalAssetReferences,
  rewriteMarkdownLinks,
} from './lib/markdown-links';

const repositoriesRoot = resolve(process.cwd(), '.context/repos');
const contentRoot = resolve(process.cwd(), 'src/content/docs');
const publicRoot = resolve(process.cwd(), 'public');

for (const project of loadEnabledProjects()) {
  const docsRoot = resolve(repositoriesRoot, project.slug, 'docs/www');
  const outputContentRoot = resolve(contentRoot, project.slug);
  const outputAssetsRoot = resolve(publicRoot, project.slug, 'assets');

  if (!(await pathExists(docsRoot))) {
    throw new Error(
      `Missing synchronized docs for ${project.repository}. Run bun run sync first.`,
    );
  }

  await rm(outputContentRoot, { recursive: true, force: true });
  await rm(outputAssetsRoot, { recursive: true, force: true });

  const files = await walkFiles(docsRoot);

  for (const sourceFile of files) {
    const relativePath = relative(docsRoot, sourceFile);
    const normalizedRelativePath = relativePath.split(sep).join('/');

    if (normalizedRelativePath.startsWith('assets/')) {
      const assetRelativePath = normalizedRelativePath.slice('assets/'.length);
      await copyFileEnsuringParent(
        sourceFile,
        resolve(outputAssetsRoot, assetRelativePath),
      );
      continue;
    }

    if (!normalizedRelativePath.endsWith('.md')) {
      throw new Error(
        `${project.repository}:${normalizedRelativePath}: non-Markdown files are only allowed under docs/www/assets`,
      );
    }

    const source = await readText(sourceFile);
    const parsed = parseMarkdownFrontmatter(source);
    const parsedDocument = documentSourceSchema.safeParse(parsed.data);

    if (!parsedDocument.success) {
      throw new Error(
        [
          `${project.repository}:${normalizedRelativePath}: invalid frontmatter`,
          ...parsedDocument.error.issues.map(
            (issue) =>
              `- ${issue.path.join('.') || '<root>'}: ${issue.message}`,
          ),
        ].join('\n'),
      );
    }

    const semanticIssues = validateDocumentSemantics(parsedDocument.data);
    if (semanticIssues.length > 0) {
      throw new Error(
        [
          `${project.repository}:${normalizedRelativePath}: invalid document semantics`,
          ...semanticIssues.map((issue) => `- ${issue}`),
        ].join('\n'),
      );
    }

    const assetReferences = findLocalAssetReferences(
      parsed.body,
      sourceFile,
      docsRoot,
    );

    const assetViolations = assetReferences.filter(
      (reference) => !reference.isWithinAssetsDirectory,
    );
    if (assetViolations.length > 0) {
      throw new Error(
        [
          `${project.repository}:${normalizedRelativePath}: invalid local asset references`,
          ...assetViolations.map(
            ({ target }) =>
              `- ${target}: local non-Markdown files must resolve under docs/www/assets`,
          ),
        ].join('\n'),
      );
    }

    const missingAssets: string[] = [];
    for (const reference of assetReferences) {
      if (!(await pathExists(reference.resolvedPath))) {
        missingAssets.push(reference.target);
      }
    }
    if (missingAssets.length > 0) {
      throw new Error(
        [
          `${project.repository}:${normalizedRelativePath}: missing local assets`,
          ...missingAssets.map((target) => `- ${target}`),
        ].join('\n'),
      );
    }

    const normalizedSource = stringifyMarkdownFrontmatter(
      normalizeDocumentFrontmatter(parsedDocument.data),
      parsed.body,
    );
    const rewritten = rewriteMarkdownLinks(normalizedSource, project.slug);
    await writeText(
      resolve(outputContentRoot, normalizedRelativePath),
      rewritten,
    );
  }
}

import { dirname, extname, resolve, sep } from 'node:path';

import { DOCS_BASE_PATH } from '../../src/config/site';

const markdownLinkPattern =
  /(?<prefix>!?\[[^\]]*\]\()(?<target>[^)\s]+)(?<suffix>(?:\s+["'][^"']*["'])?\))/g;

const externalSchemePattern = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function splitTarget(
  target: string,
): readonly [path: string, query: string, fragment: string] {
  const match = /^(?<path>[^?#]*)(?<query>\?[^#]*)?(?<fragment>#.*)?$/.exec(
    target,
  );
  if (!match?.groups) {
    return [target, '', ''];
  }

  return [
    match.groups.path ?? '',
    match.groups.query ?? '',
    match.groups.fragment ?? '',
  ];
}

function normalizeBundleMarkdownPath(path: string): string {
  const withoutLeadingSlash = path.replace(/^\/+/, '');
  if (withoutLeadingSlash === 'index.md') {
    return '';
  }
  if (withoutLeadingSlash.endsWith('/index.md')) {
    return withoutLeadingSlash.slice(0, -'index.md'.length);
  }
  if (withoutLeadingSlash.endsWith('.md')) {
    return `${withoutLeadingSlash.slice(0, -3)}/`;
  }
  return withoutLeadingSlash;
}

function normalizeRelativeMarkdownPath(path: string): string {
  if (path === 'index.md' || path === './index.md') {
    return './';
  }
  if (path.endsWith('/index.md')) {
    return path.slice(0, -'index.md'.length);
  }
  if (path.endsWith('.md')) {
    return `${path.slice(0, -3)}/`;
  }
  return path;
}

export function rewriteMarkdownLinks(
  markdown: string,
  projectSlug: string,
): string {
  return markdown.replace(
    markdownLinkPattern,
    (
      full,
      _prefix,
      _target,
      _suffix,
      _offset,
      _input,
      groups: { prefix: string; target: string; suffix: string },
    ) => {
      const { prefix, target, suffix } = groups;
      const [path, query, fragment] = splitTarget(target);
      const targetSuffix = `${query}${fragment}`;

      if (
        path === '' ||
        externalSchemePattern.test(path) ||
        path.startsWith('//')
      ) {
        return full;
      }

      if (path.startsWith('/') && path.endsWith('.md')) {
        const route = normalizeBundleMarkdownPath(path);
        return `${prefix}${DOCS_BASE_PATH}/${projectSlug}/${route}${targetSuffix}${suffix}`;
      }

      if (path.startsWith('/assets/')) {
        return `${prefix}${DOCS_BASE_PATH}/${projectSlug}${path}${targetSuffix}${suffix}`;
      }

      if (path.endsWith('.md')) {
        return `${prefix}${normalizeRelativeMarkdownPath(path)}${targetSuffix}${suffix}`;
      }

      return full;
    },
  );
}

export type LocalAssetReference = Readonly<{
  target: string;
  resolvedPath: string;
  isWithinAssetsDirectory: boolean;
}>;

export function findLocalAssetReferences(
  markdown: string,
  sourceFile: string,
  docsRoot: string,
): readonly LocalAssetReference[] {
  const references: LocalAssetReference[] = [];
  const assetsRoot = resolve(docsRoot, 'assets');

  for (const match of markdown.matchAll(markdownLinkPattern)) {
    const target = match.groups?.target;
    if (!target) continue;

    const [path] = splitTarget(target);
    if (
      path === '' ||
      externalSchemePattern.test(path) ||
      path.startsWith('//') ||
      path.endsWith('.md') ||
      path.endsWith('/')
    ) {
      continue;
    }

    const extension = extname(path);
    if (extension === '') {
      continue;
    }

    const resolvedPath = path.startsWith('/')
      ? resolve(docsRoot, `.${path}`)
      : resolve(dirname(sourceFile), path);

    const allowedPrefix = `${assetsRoot}${sep}`;
    references.push({
      target,
      resolvedPath,
      isWithinAssetsDirectory:
        resolvedPath === assetsRoot || resolvedPath.startsWith(allowedPrefix),
    });
  }

  return references;
}

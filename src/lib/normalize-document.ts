import type { DocumentSource } from '../schema/document';

/**
 * Converts repository-facing hsblabs profile fields to Starlight fields while
 * keeping the original profile metadata available in the content collection.
 */
export function normalizeDocumentFrontmatter(
  document: DocumentSource,
): Readonly<Record<string, unknown>> {
  if (document.hsblabs?.sidebar === undefined) {
    return { ...document };
  }

  return {
    ...document,
    sidebar: document.hsblabs.sidebar,
  };
}

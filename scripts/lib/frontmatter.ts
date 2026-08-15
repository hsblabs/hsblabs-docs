import { YAML } from 'bun';

export type ParsedMarkdown = Readonly<{
  data: unknown;
  body: string;
}>;

export function parseMarkdownFrontmatter(source: string): ParsedMarkdown {
  const normalized = source.replace(/^\uFEFF/, '');

  if (!normalized.startsWith('---\n')) {
    throw new Error('Markdown must start with YAML frontmatter');
  }

  const closing = normalized.indexOf('\n---\n', 4);
  if (closing === -1) {
    throw new Error('Markdown frontmatter is not closed with ---');
  }

  const rawFrontmatter = normalized.slice(4, closing);
  const body = normalized.slice(closing + 5);

  return {
    data: YAML.parse(rawFrontmatter) as unknown,
    body,
  };
}

export function stringifyMarkdownFrontmatter(
  data: Readonly<Record<string, unknown>>,
  body: string,
): string {
  return `---\n${YAML.stringify(data).trimEnd()}\n---\n${body}`;
}

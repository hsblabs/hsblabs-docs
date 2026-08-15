import { DOCUMENT_SCHEMA_ENDPOINT } from '../config/endpoints';

const schemaStartMarker = '<!-- document-schema:start -->';
const schemaEndMarker = '<!-- document-schema:end -->';

export function createAuthoringSkill(
  documentSchema: Record<string, unknown>,
): string {
  const schemaJson = JSON.stringify(documentSchema);

  return `---
name: hsblabs-oss-docs-authoring
description: Author public hsblabs OSS documentation under docs/www using the versioned OKF-derived hsblabs document profile.
---

# hsblabs OSS documentation authoring

Use this skill when creating or updating documentation that will be published by \`hsblabs-docs\`.

## Repository contract

- Put public Markdown documents under \`docs/www/**/*.md\`.
- Put public local assets only under \`docs/www/assets/**\`.
- Do not use symlinks inside \`docs/www\`.
- Treat the Markdown file path as the route. Do not add a separate hsblabs slug field.
- Use bundle-relative Markdown links for other documents and assets where practical.
- Every published Markdown document, including \`index.md\`, must satisfy the embedded JSON Schema below.

## Required frontmatter

At minimum, author documents with the current schema version, an OKF-style type, and a Starlight title:

\`\`\`yaml
---
schema_version: "2026-08-15"
okf_version: "0.2"
type: Guide
title: Getting Started
---
\`\`\`

Use \`hsblabs.sidebar\` for repository-owned presentation metadata rather than writing Starlight's \`sidebar\` field directly.

## Assets

A local non-Markdown reference is valid only when its resolved file is inside \`docs/www/assets/**\`. For example, from \`docs/www/guides/start.md\`:

\`\`\`markdown
![Architecture](../assets/architecture.svg)
\`\`\`

Do not reference repository-private files outside the public documentation bundle.

## Validation

From the \`hsblabs-docs\` repository, run:

\`\`\`bash
bun run check
bun run build
\`\`\`

The authoritative schema endpoint is \`${DOCUMENT_SCHEMA_ENDPOINT}\`.

## Embedded document schema

The following JSON Schema is generated from the same Zod Content Collection schema used by the site. Do not manually edit this embedded copy; regenerate the extras instead.

${schemaStartMarker}
\`\`\`json
${schemaJson}
\`\`\`
${schemaEndMarker}
`;
}

export function extractEmbeddedDocumentSchema(
  skill: string,
): Record<string, unknown> {
  const start = skill.indexOf(schemaStartMarker);
  const end = skill.indexOf(schemaEndMarker);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error('Embedded document schema markers are missing from SKILL');
  }

  const section = skill.slice(start + schemaStartMarker.length, end).trim();
  const match = /^```json\n([\s\S]+)\n```$/.exec(section);
  if (!match?.[1]) {
    throw new Error('Embedded document schema code block is invalid');
  }

  return JSON.parse(match[1]) as Record<string, unknown>;
}

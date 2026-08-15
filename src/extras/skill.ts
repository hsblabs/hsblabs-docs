import {
  DOCUMENT_SCHEMA_ENDPOINT,
  VALIDATION_SCRIPT_ENDPOINT,
} from '../config/endpoints';

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

Use this skill when creating or updating public hsblabs OSS documentation.

## Authoring location

- Work in the current repository: it is the OSS repository being documented.
- Create and edit source documents under \`docs/www/**\` in the current repository.
- Keep authoring work in this repository; do not move it to a separate documentation repository.

## Project layout and language

- Treat \`docs/www\` as the complete source root for this repository. Do not add \`docs/www/<repository-name>/\` or \`docs/www/<project-slug>/\`; topic directories such as \`docs/www/guides/\` are allowed.
- The published site adds the project's namespace. \`docs/www/index.md\` is the project home.
- Link to source documents with relative file paths such as \`./output.md\`. Do not use deployment-specific site-root links or add a site prefix such as \`/hsblabs/oss/<project>\`.
- English is the default language and keeps the unprefixed site routes.
- Japanese uses the \`/ja/\` locale path; untranslated pages fall back to English.
- Do not create translations or locale directories such as \`docs/www/ja/\` unless explicitly requested; translated-source ingestion is not part of the current repository contract.

## Page structure for SEO and AIO

- Give each page one primary search or answer intent. Make the frontmatter \`title\` and \`description\` unique, specific, and useful as a search-result and AI-answer summary.
- Use \`docs/www/index.md\` as the project overview. Its opening paragraph should directly state what the project is, what it does, and who it is for before linking to guides or reference pages.
- Start every other page with a concise direct answer or summary, then organize prerequisites, steps, examples, expected results, limitations, and related links under descriptive headings.
- Let frontmatter \`title\` provide the page's only H1. Use a logical H2/H3 hierarchy, short self-contained sections, lists, tables, and code blocks so people and answer engines can extract facts without reconstructing context.
- Cite changing or evidence-based claims with the available \`resource\`, \`sources\`, \`verified\`, and \`stale_after\` fields when applicable. Do not keyword-stuff, duplicate pages, or add hidden SEO text.

## Adding languages later

- Keep the \`root\` locale as English and preserve its existing unprefixed URLs. Japanese is the \`ja\` locale at \`/ja/\`.
- Treat adding a locale as a publishing-protocol change, not an OSS source-repository change. Define a stable locale key, language tag, label, URL prefix, translations, and fallback behavior in the publishing configuration. Do not create \`docs/www/<locale>/\` in source repositories; locale routing is a website concern until translated-source ingestion is explicitly added.
- Keep source-document links relative and language-neutral. Locale navigation is owned by the published site; do not hard-code a special case for Japanese or another language in every document.
- Do not change the English URL contract as part of adding a language unless an explicit migration is approved.

## Repository contract

- Put public Markdown documents under \`docs/www/**/*.md\`.
- Put public local assets only under \`docs/www/assets/**\`.
- Do not use symlinks inside \`docs/www\`.
- Treat the Markdown file path as the route. Do not add a separate hsblabs slug field.
- Use bundle-relative Markdown links for other documents and assets where practical.
- Every published Markdown document, including \`index.md\`, must satisfy the embedded JSON Schema below.

## Required frontmatter

The schema requires \`schema_version\`, \`type\`, and \`title\`. Include \`okf_version: "0.2"\` for the current OKF-derived profile:

\`\`\`yaml
---
schema_version: "2026-08-15"
okf_version: "0.2"
type: Guide
title: Getting Started
---
\`\`\`

Use \`hsblabs.sidebar\` for repository-owned presentation metadata. Do not add presentation fields outside the documented protocol.

## Assets

A local non-Markdown reference is valid only when its resolved file is inside \`docs/www/assets/**\`. For example, from \`docs/www/guides/start.md\`:

\`\`\`markdown
![Architecture](../assets/architecture.svg)
\`\`\`

Do not reference repository-private files outside the public documentation bundle.

## Validation

Validate this repository. Download and run the published validator:

\`\`\`bash
mkdir -p .context
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \\
  "https://hsb.horse${VALIDATION_SCRIPT_ENDPOINT}?ts=$(date +%s)-$$" \\
  --output .context/validate-docs.sh
bash .context/validate-docs.sh docs/www
\`\`\`

The script fetches the published schema with a cache-busting timestamp and checks frontmatter, document semantics, symlinks, asset boundaries, and missing local assets. It requires \`bash\`, \`curl\`, and \`uv\`; no separate repository is needed.

The authoritative schema endpoint is \`${DOCUMENT_SCHEMA_ENDPOINT}\`.

## Embedded document schema

The following JSON Schema is the current hsblabs document protocol. Do not manually edit this embedded copy; use the published validator and schema endpoint for the latest contract.

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

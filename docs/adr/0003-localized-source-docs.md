---
date: 2026-08-15
status: accepted
---

# Ingest localized source documents

## Context

OSS repositories need to own translated documentation alongside their English
documents. Starlight determines a page locale from the first path segment in
the content collection, so copying `docs/www/ja/**` to
`src/content/docs/{project}/ja/**` creates a normal project subpath instead of
a Japanese page.

## Decision

Use the configured site locales as the source-document locale contract. English
documents remain at `docs/www/**`; a configured translation such as
`docs/www/ja/guide.md` is ingested as
`src/content/docs/ja/{project}/guide.md` and published at
`/hsblabs/oss/ja/{project}/guide/`.

The English document remains the fallback when a translation is missing. Local
assets remain shared under `docs/www/assets/**`.

## Consequences

Adding a locale requires updating the centralized locale configuration before
repositories add its source directory. Existing English routes are unchanged,
and translated pages participate in Starlight's locale navigation and fallback
behavior.

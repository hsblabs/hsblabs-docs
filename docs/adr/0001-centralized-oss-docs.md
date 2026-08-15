---
date: 2026-08-15
status: accepted
---

# Centralize hsblabs OSS documentation rendering

## Context

Each hsblabs OSS repository should own its public documentation content without
also owning a documentation-site implementation. Public documentation is stored
under `docs/www/**/*.md`; local public assets are restricted to
`docs/www/assets/**`.

The source format is based on Open Knowledge Format (OKF) v0.2 and extended for
Starlight authoring. The profile intentionally requires `schema_version`,
`type`, and `title`. This is an OKF-derived profile rather than strict OKF
conformance because Starlight requires frontmatter on route pages such as
`index.md`, while OKF reserves `index.md` for a more constrained index format.

## Decision

Use one `hsblabs-docs` repository with Astro, Starlight, and Cloudflare Workers
Static Assets.

Enabled repositories are shallow-cloned with partial clone and sparse checkout
restricted to `docs/www`. The ingestion step validates the source frontmatter,
rejects public files outside `docs/www/assets`, rewrites Markdown document links,
and copies project content into Starlight's `docs` collection.

The document schema version starts at `2026-08-15`. The actual Starlight content
collection Zod schema is converted with `z.toJSONSchema()` and published at:

`/hsblabs/oss/extras/document-schema.json`

Project switching is implemented as a local Starlight `SiteTitle` override to
avoid coupling navigation to a third-party plugin. Repository-owned sidebar
metadata uses `hsblabs.sidebar` and is normalized to Starlight `sidebar`
frontmatter during ingestion.

`starlight-llms-txt` generates the global LLM entrypoint and per-project
documentation sets.

## Consequences

A repository becomes publishable only after it contains a valid `docs/www`
bundle and is enabled in `projects/projects.json`.

Site implementation, Cloudflare configuration, schema publication, navigation,
and LLM-oriented outputs remain centralized.

Schema changes require a new `YYYY-MM-DD` schema version and an explicit update
to supported versions.

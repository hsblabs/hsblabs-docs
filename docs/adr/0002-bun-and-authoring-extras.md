---
date: 2026-08-15
status: accepted
---

# Use Bun and publish authoring extras

## Context

`hsblabs-docs` needs one package-manager/runtime convention and stable public
artifacts that both humans and agents can use to author repository-owned
`docs/www` documents.

The initial schema endpoint lived below `pages/schema`, which mixed site pages
with machine-oriented metadata. An extensionless `SKILL` document also needs an
explicit Markdown response content type when served as a static asset.

## Decision

Use Bun as the repository package manager and script runner, pinned through
`packageManager` in `package.json`.

Move the generated JSON Schema endpoint to:

`/hsblabs/oss/extras/document-schema.json`

Add an authoring skill document at:

`/hsblabs/oss/extras/SKILL`

Both artifacts are generated together. `SKILL` embeds the complete generated
`document-schema.json` in a fenced `json` code block, so there is no separate
hand-maintained schema representation.

Generate `dist/_headers` after the Astro build so Cloudflare Workers Static
Assets serves the extensionless `SKILL` file with:

`Content-Type: text/markdown; charset=utf-8`

## Consequences

Schema and skill publication remain deterministic outputs of the same Zod
Content Collection schema.

Build verification must fail if the separately published JSON Schema and the
schema embedded in `SKILL` differ, or if the Cloudflare header rule is missing.

A `bun.lock` should be committed after dependency resolution can be performed
in an environment with registry access; CI can then use `bun ci`.

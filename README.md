# hsblabs-docs

Centralized documentation site for OSS projects published by `hsblabs`.

- Astro + Starlight
- Cloudflare Workers Static Assets
- Bun package manager and script runner for repository tooling
- repository-owned source documents under `docs/www/**/*.md`
- public local assets restricted to `docs/www/assets/**`
- OKF v0.2-derived frontmatter profile
- versioned Zod Content Collection schema
- JSON Schema generated with `z.toJSONSchema()`
- generated authoring `SKILL` containing the same JSON Schema
- `llms.txt` generated with `starlight-llms-txt`
- project switcher implemented as a Starlight component override
- shallow partial clones + sparse checkout of `docs/www`

## URL layout

The site is built below:

```text
https://hsb.horse/hsblabs/oss/
https://hsb.horse/hsblabs/oss/{project}/
https://hsb.horse/hsblabs/oss/{project}/guides/...
```

Machine-readable extras are served at:

```text
https://hsb.horse/hsblabs/oss/extras/document-schema.json
https://hsb.horse/hsblabs/oss/extras/SKILL
```

`/hsblabs/oss/extras/SKILL` is served as `text/markdown; charset=utf-8` using
Cloudflare Workers Static Assets `_headers` rules generated at build time.

## Repository contract

A published project owns only its documentation source:

```text
some-project/
└── docs/
    └── www/
        ├── index.md
        ├── getting-started.md
        ├── guides/
        │   └── advanced.md
        └── assets/
            └── architecture.svg
```

Files below `docs/www` must follow these rules:

- public pages are Markdown files (`**/*.md`)
- public non-Markdown files must be below `docs/www/assets/**`
- symlinks are rejected
- local non-Markdown references from Markdown must resolve below
  `docs/www/assets/**`
- the document path determines the route; there is no hsblabs-specific slug
  field
- links ending in `.md` are normalized to Starlight routes during ingestion

For example:

```text
docs/www/index.md
→ /hsblabs/oss/scrape-kdl/

docs/www/getting-started.md
→ /hsblabs/oss/scrape-kdl/getting-started/

docs/www/reference/api.md
→ /hsblabs/oss/scrape-kdl/reference/api/
```

## Document schema

The initial hsblabs document schema version is:

```yaml
schema_version: '2026-08-15'
```

A minimal document is:

```markdown
---
schema_version: '2026-08-15'
okf_version: '0.2'
type: Guide
title: Getting Started
description: Install and start using the project.
tags: [guide]
hsblabs:
  sidebar:
    order: 10
    label: Getting Started
---

# Install

...
```

The profile is based on OKF v0.2. It supports OKF provenance, trust, lifecycle,
and attested-computation fields such as `sources`, `generated`, `verified`,
`status`, `stale_after`, `runtime`, `parameters`, `executor`, and `attester`.

`type` remains an open string as in OKF. Unknown producer-defined frontmatter is
also accepted.

Repository-owned docs should prefer the `hsblabs` namespace for presentation
metadata instead of coupling directly to Starlight. The ingestion layer maps:

```yaml
hsblabs:
  sidebar:
    order: 10
    label: Getting Started
    hidden: false
```

to Starlight's generated `sidebar` frontmatter. Defining both
`hsblabs.sidebar` and a direct `sidebar` field is rejected as ambiguous.

### Intentional OKF profile difference

This project is OKF-derived rather than strictly OKF-conformant.

OKF reserves `index.md` and normally prohibits general concept frontmatter on
index files. Starlight requires a `title` for each page. `hsblabs-docs`
therefore treats `docs/www/index.md` as a normal versioned Starlight document
and requires `schema_version`, `type`, and `title` there as well.

## JSON Schema and SKILL generation

The actual Starlight Content Collection schema is defined in
`src/schema/document.ts`:

```ts
export const contentCollectionSchema = docsSchema({
  extend: hsblabsDocumentExtensionSchema,
});
```

`src/schema/json-schema.ts` converts that same schema using:

```ts
z.toJSONSchema(contentCollectionSchema, {
  target: 'draft-2020-12',
  io: 'input',
  unrepresentable: 'any',
});
```

`scripts/generate-extras.ts` writes:

```text
public/extras/document-schema.json
public/extras/SKILL
```

Because Astro builds into `dist/hsblabs/oss`, Cloudflare serves them as:

```text
/hsblabs/oss/extras/document-schema.json
/hsblabs/oss/extras/SKILL
```

The `SKILL` document is generated from the same in-memory JSON Schema and embeds
that complete schema in a `json` fenced code block. `scripts/verify-build.ts`
parses the embedded block and verifies that it exactly matches the separately
published `document-schema.json`.

`unrepresentable: "any"` is used for Starlight-owned schema parts that have no
lossless JSON Schema representation. The hsblabs/OKF fields themselves use
JSON-Schema-representable Zod primitives.

## Add a project

First add `docs/www` to the OSS repository.

Then add or enable its central registry entry in
`projects/projects.json`:

```json
{
  "slug": "scrape-kdl",
  "repository": "hsblabs/scrape-kdl",
  "ref": "main",
  "enabled": true
}
```

`slug` is the site route prefix. Repository references are deliberately
restricted to the `hsblabs` organization.

## Synchronization

`bun run sync` uses:

```bash
git clone \
  --depth=1 \
  --filter=blob:none \
  --sparse \
  --single-branch \
  --branch main \
  https://github.com/hsblabs/scrape-kdl.git \
  .context/repos/scrape-kdl

git -C .context/repos/scrape-kdl sparse-checkout set docs/www
```

Only `docs/www` is materialized in the working tree. The partial clone also
avoids downloading unrelated blobs unless Git needs them.

## Build pipeline

```text
projects/projects.json
        │
        ▼
shallow partial clone + sparse checkout
        │
        ▼
docs/www validation
  ├─ document schema
  ├─ semantic OKF checks
  ├─ asset boundary checks
  └─ symlink rejection
        │
        ▼
src/content/docs/{project}
public/{project}/assets
        │
        ├──────────────► public/extras/document-schema.json
        │                 z.toJSONSchema()
        └──────────────► public/extras/SKILL
                          embeds the same JSON Schema
        │
        ▼
Astro + Starlight
        │
        ├─ project switcher
        └─ starlight-llms-txt
        ▼
dist/hsblabs/oss/**
        │
        ├─ extras/document-schema.json
        ├─ extras/SKILL
        └─ llms.txt
        │
        ▼
dist/_headers
        │
        └─ force extras/SKILL to text/markdown
        │
        ▼
Cloudflare Workers Static Assets
```

## Package manager

The repository uses Bun and pins the package-manager version in `package.json`:

```json
{
  "packageManager": "bun@1.3.14"
}
```

Once a dependency install can be performed, commit the generated text lockfile
`bun.lock`. CI can then switch from `bun install` to `bun ci` for frozen,
reproducible installs.

## Commands

Install dependencies:

```bash
bun install
```

Generate the public extras:

```bash
bun run extras:generate
```

`schema:generate` remains as an alias for compatibility with the initial
repository workflow:

```bash
bun run schema:generate
```

Run unit tests:

```bash
bun run test
```

Synchronize enabled repositories and run the development server:

```bash
bun run dev
```

Build and verify the static output:

```bash
bun run build
```

Deploy after configuring Cloudflare credentials:

```bash
bun run deploy
```

## Cloudflare layout

Astro plus the build finalization step produce:

```text
dist/
├── _headers
└── hsblabs/
    └── oss/
        ├── index.html
        ├── _astro/
        ├── llms.txt
        ├── extras/
        │   ├── document-schema.json
        │   └── SKILL
        └── {project}/
```

`wrangler.jsonc` points Workers Static Assets at `./dist/`, not the nested
Astro output directory. This is deliberate: Workers path-based asset routing
expects the asset tree to mirror `/hsblabs/oss/*`. The root `dist/_headers`
file is generated after Astro so Cloudflare can apply a custom MIME type to the
extensionless `SKILL` asset.

## LLM output

`starlight-llms-txt` generates the site-level LLM entrypoint. Every enabled
project is also registered as a custom documentation set using its route prefix,
for example:

```text
scrape-kdl/**
http-command/**
```

## CI/CD

`.github/workflows/deploy.yml` runs on:

- pushes to `main`
- an hourly schedule at minute 17
- manual dispatch

The workflow uses `oven-sh/setup-bun@v2` with Bun 1.3.14, then runs `bun
install`, tests, build verification, and `bunx wrangler deploy`.

The workflow expects:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

as GitHub Actions secrets.

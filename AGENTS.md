# Repository guidelines

## Purpose

This repository builds the centralized public documentation site for hsblabs
OSS projects. Each source repository owns its documents under
`docs/www/**/*.md`; this repository validates, normalizes, and renders them.

## Sources of truth

- `projects/projects.json` defines publishable repositories.
- `src/schema/document.ts` defines the versioned document profile and the
  Starlight Content Collection schema.
- `src/schema/json-schema.ts` owns JSON Schema generation.
- `src/extras/skill.ts` owns the generated authoring `SKILL` document.
- `docs/adr/` records architectural decisions.

## Generated files

Do not hand-edit:

- `src/content/docs/{project}/`
- `public/{project}/assets/`
- `public/extras/`
- `dist/`

Regenerate project content and public extras with:

```bash
bun run prepare:all
```

Repository-owned public assets must remain below `docs/www/assets/**` in each
source repository.

## Schema changes

`schema_version` uses `YYYY-MM-DD`. Contract-significant changes must add a new
supported version in `src/schema/document.ts` and update the documentation,
tests, and relevant ADRs.

The public JSON Schema and the schema embedded in `extras/SKILL` must both be
generated from `contentCollectionSchema`. Do not maintain a separate schema
copy.

## Development

Use Bun as the package manager and script runner.

```bash
bun run check
bun run build
```

The build must pass `scripts/verify-build.ts` and produce the documented files
below `dist/hsblabs/oss/` plus `dist/_headers`.

Keep changes scoped to this repository. Do not deploy or modify source OSS
repositories as part of a documentation-site change.

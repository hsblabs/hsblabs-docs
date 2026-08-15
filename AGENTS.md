# Repository instructions

## Source of truth

- `projects/projects.json` defines publishable OSS repositories.
- `src/schema/document.ts` defines the versioned hsblabs document profile and
  the Starlight Content Collection schema.
- `src/schema/json-schema.ts` owns JSON Schema generation and the public schema
  endpoint.
- `src/extras/skill.ts` owns the generated authoring `SKILL` document.
- `docs/adr/` records architectural decisions.
- Repository-owned public documentation lives in each source repository under
  `docs/www/**/*.md`; public local assets live only under `docs/www/assets/**`.

## Generated files

Do not hand-edit generated project content below `src/content/docs/{project}/`,
project assets below `public/{project}/assets/`,
`public/extras/document-schema.json`, or `public/extras/SKILL`.

Regenerate them with:

```bash
bun run prepare:all
```

`dist/_headers` is also generated during `bun run build` and is required to
serve `/hsblabs/oss/extras/SKILL` as `text/markdown; charset=utf-8`.

## Schema changes

`schema_version` uses `YYYY-MM-DD`. A breaking or contract-significant profile
change must add a new supported version in `src/schema/document.ts`, update the
public documentation, tests, and relevant ADRs, and keep older versions only
when compatibility is intentionally supported.

Repository-owned presentation metadata should prefer the `hsblabs` namespace.
The ingestion layer owns translation into Starlight-specific frontmatter.

The JSON Schema endpoint and the schema embedded in `extras/SKILL` must always
be generated from the same `contentCollectionSchema`. Never maintain a second
hand-authored schema copy.

## Tooling and validation

Use Bun as the package manager and script runner. Do not introduce another
package manager.

```bash
bun run test
bun run build
bun run self-check
```

A successful process exit alone is insufficient: `bun run build` must leave
`llms.txt`, `extras/document-schema.json`, and `extras/SKILL` under
`dist/hsblabs/oss/`, plus `dist/_headers`, as verified by
`scripts/verify-build.ts`.

## External changes

Local implementation and validation are allowed. Do not push, create PRs,
deploy, or mutate source OSS repositories unless explicitly requested.

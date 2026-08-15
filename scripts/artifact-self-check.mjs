import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const required = [
  'AGENTS.md',
  'package.json',
  'astro.config.ts',
  'wrangler.jsonc',
  'src/content.config.ts',
  'src/config/site.ts',
  'src/config/endpoints.ts',
  'src/schema/document.ts',
  'src/schema/json-schema.ts',
  'src/extras/skill.ts',
  'scripts/sync-projects.ts',
  'scripts/prepare-content.ts',
  'scripts/generate-extras.ts',
  'scripts/finalize-cloudflare-assets.ts',
  'README.md',
];

for (const rel of required) {
  const s = await stat(resolve(root, rel));
  if (!s.isFile()) throw new Error(`${rel} is missing`);
}

const packageJson = JSON.parse(
  await readFile(resolve(root, 'package.json'), 'utf8'),
);
if (packageJson.packageManager !== 'bun@1.3.14') {
  throw new Error('packageManager must be bun@1.3.14');
}
if (JSON.stringify(packageJson.scripts).includes('npm ')) {
  throw new Error('npm commands remain in package scripts');
}

const schemaSource = await readFile(
  resolve(root, 'src/schema/document.ts'),
  'utf8',
);
if (!schemaSource.includes("DOCUMENT_SCHEMA_VERSION = '2026-08-15'")) {
  throw new Error('schema version is missing');
}

const endpointsSource = await readFile(
  resolve(root, 'src/config/endpoints.ts'),
  'utf8',
);
if (!endpointsSource.includes('/hsblabs/oss/extras/document-schema.json')) {
  throw new Error('document schema endpoint is incorrect');
}
if (!endpointsSource.includes('/hsblabs/oss/extras/SKILL')) {
  throw new Error('SKILL endpoint is incorrect');
}

const jsonSchemaSource = await readFile(
  resolve(root, 'src/schema/json-schema.ts'),
  'utf8',
);
if (
  !jsonSchemaSource.includes('z.toJSONSchema(') ||
  !jsonSchemaSource.includes('contentCollectionSchema(')
) {
  throw new Error('z.toJSONSchema generation is missing');
}

const skillSource = await readFile(
  resolve(root, 'src/extras/skill.ts'),
  'utf8',
);
if (!skillSource.includes('```json')) {
  throw new Error('SKILL does not contain a JSON code block template');
}

const syncScript = await readFile(
  resolve(root, 'scripts/sync-projects.ts'),
  'utf8',
);
if (
  !syncScript.includes("'--depth=1'") ||
  !syncScript.includes("'--filter=blob:none'") ||
  !syncScript.includes("'--sparse'")
) {
  throw new Error('shallow partial clone + sparse checkout flags are missing');
}

const finalizeScript = await readFile(
  resolve(root, 'scripts/finalize-cloudflare-assets.ts'),
  'utf8',
);
if (!finalizeScript.includes('Content-Type: text/markdown; charset=utf-8')) {
  throw new Error('SKILL text/markdown header generation is missing');
}

const wrangler = await readFile(resolve(root, 'wrangler.jsonc'), 'utf8');
if (!wrangler.includes('"route": "hsb.horse/hsblabs/oss/*"')) {
  throw new Error('Cloudflare route is incorrect');
}

console.log('artifact self-check passed');

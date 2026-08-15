import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { extractEmbeddedDocumentSchema } from '../src/extras/skill';
import { DOCUMENT_SCHEMA_VERSION } from '../src/schema/document';

const root = process.cwd();
const buildRoot = resolve(root, 'dist/hsblabs/oss');

const requiredFiles = [
  'index.html',
  'llms.txt',
  'extras/document-schema.json',
  'extras/SKILL',
] as const;

for (const file of requiredFiles) {
  const path = resolve(buildRoot, file);
  const fileStat = await stat(path);
  if (!fileStat.isFile()) {
    throw new Error(`Expected build artifact is not a file: ${path}`);
  }
}

const schemaPath = resolve(buildRoot, 'extras/document-schema.json');
const schema = JSON.parse(await readFile(schemaPath, 'utf8')) as Record<
  string,
  unknown
>;

if (schema['x-hsblabs-schema-version'] !== DOCUMENT_SCHEMA_VERSION) {
  throw new Error(
    `Unexpected document schema version: ${String(
      schema['x-hsblabs-schema-version'],
    )}`,
  );
}

const skillPath = resolve(buildRoot, 'extras/SKILL');
const skill = await readFile(skillPath, 'utf8');
const embeddedSchema = extractEmbeddedDocumentSchema(skill);

if (JSON.stringify(embeddedSchema) !== JSON.stringify(schema)) {
  throw new Error('extras/SKILL does not embed the published document schema');
}

const headersPath = resolve(root, 'dist/_headers');
const headersStat = await stat(headersPath);
if (!headersStat.isFile()) {
  throw new Error(
    `Expected Cloudflare headers file is missing: ${headersPath}`,
  );
}

const headers = await readFile(headersPath, 'utf8');
if (
  !headers.includes('/hsblabs/oss/extras/SKILL') ||
  !headers.includes('Content-Type: text/markdown; charset=utf-8')
) {
  throw new Error(
    'Cloudflare headers do not force text/markdown for extras/SKILL',
  );
}

console.log('verified build output');

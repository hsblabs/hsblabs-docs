import { resolve } from 'node:path';

import { createAuthoringSkill } from '../src/extras/skill';
import {
  createDocumentJsonSchema,
  stringifyDocumentJsonSchema,
} from '../src/schema/json-schema';
import { readText, writeText } from './lib/fs';

const publicExtrasRoot = resolve(process.cwd(), 'public/extras');
const schemaPath = resolve(publicExtrasRoot, 'document-schema.json');
const skillPath = resolve(publicExtrasRoot, 'SKILL');
const validationScriptSourcePath = resolve(
  process.cwd(),
  'src/extras/validate-docs.sh',
);
const validationScriptPath = resolve(publicExtrasRoot, 'validate-docs.sh');

const schema = createDocumentJsonSchema();
const validationScript = await readText(validationScriptSourcePath);

await writeText(schemaPath, stringifyDocumentJsonSchema(schema));
await writeText(skillPath, createAuthoringSkill(schema));
await writeText(validationScriptPath, validationScript);

console.log(`generated ${schemaPath}`);
console.log(`generated ${skillPath}`);
console.log(`generated ${validationScriptPath}`);

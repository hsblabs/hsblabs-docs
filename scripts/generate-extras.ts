import { resolve } from 'node:path';

import { createAuthoringSkill } from '../src/extras/skill';
import {
  createDocumentJsonSchema,
  stringifyDocumentJsonSchema,
} from '../src/schema/json-schema';
import { writeText } from './lib/fs';

const publicExtrasRoot = resolve(process.cwd(), 'public/extras');
const schemaPath = resolve(publicExtrasRoot, 'document-schema.json');
const skillPath = resolve(publicExtrasRoot, 'SKILL');

const schema = createDocumentJsonSchema();

await writeText(schemaPath, stringifyDocumentJsonSchema(schema));
await writeText(skillPath, createAuthoringSkill(schema));

console.log(`generated ${schemaPath}`);
console.log(`generated ${skillPath}`);

import { resolve } from 'node:path';

import { AUTHORING_SKILL_ENDPOINT } from '../src/config/endpoints';
import { writeText } from './lib/fs';

const headersPath = resolve(process.cwd(), 'dist/_headers');
const headers = `${AUTHORING_SKILL_ENDPOINT}\n  Content-Type: text/markdown; charset=utf-8\n`;

await writeText(headersPath, headers);
console.log(`generated ${headersPath}`);

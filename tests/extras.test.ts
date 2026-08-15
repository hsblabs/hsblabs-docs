import { describe, expect, it } from 'vitest';

import {
  createAuthoringSkill,
  extractEmbeddedDocumentSchema,
} from '../src/extras/skill';
import { DOCUMENT_SCHEMA_ENDPOINT } from '../src/config/endpoints';
import { createDocumentJsonSchema } from '../src/schema/json-schema';

describe('generated extras', () => {
  it('publishes the JSON Schema from the extras namespace', () => {
    const schema = createDocumentJsonSchema();

    expect(schema.$id).toBe(`https://hsb.horse${DOCUMENT_SCHEMA_ENDPOINT}`);
    expect(schema['x-hsblabs-schema-version']).toBe('2026-08-15');
  });

  it('converts the document schema into a JSON Schema object', () => {
    const schema = createDocumentJsonSchema();

    expect(schema).toMatchObject({ type: 'object' });
    expect(schema).toHaveProperty('properties.title');
  });

  it('embeds the exact generated document schema in SKILL', () => {
    const schema = createDocumentJsonSchema();
    const skill = createAuthoringSkill(schema);

    expect(extractEmbeddedDocumentSchema(skill)).toEqual(schema);
  });

  it('keeps authoring and validation in the source repository', () => {
    const skill = createAuthoringSkill(createDocumentJsonSchema());

    expect(skill).toContain('Work in the current repository');
    expect(skill).toContain('docs/www');
    expect(skill).toContain('docs/www/<repository-name>/');
    expect(skill).toContain('./output.md');
    expect(skill).toContain('English is the default language');
    expect(skill).toContain('/ja/');
    expect(skill).toContain('docs/www/ja/');
    expect(skill).toContain('one primary search or answer intent');
    expect(skill).toContain("frontmatter `title` provide the page's only H1");
    expect(skill).toContain(
      'Treat adding a locale as a publishing-protocol change',
    );
    expect(skill).toContain('publishing configuration');
    expect(skill).toContain(
      'Put translations under the matching configured locale directory',
    );
    expect(skill).not.toContain(
      'translated-source ingestion is not part of the current repository contract',
    );
    expect(skill).toContain('extras/validate-docs.sh');
    expect(skill).toContain('/hsblabs/oss/extras/validate-docs.sh');
    expect(skill).not.toContain('validate-docs.py');
    expect(skill).not.toContain('hsblabs-docs');
    expect(skill).not.toContain('Starlight');
    expect(skill).not.toContain('Zod');
    expect(skill).not.toContain('Content Collection');
    expect(skill).not.toContain('built-in language switcher');
  });
});

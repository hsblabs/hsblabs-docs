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

  it('converts the Starlight schema factory into a JSON Schema object', () => {
    const schema = createDocumentJsonSchema();

    expect(schema).toMatchObject({ type: 'object' });
    expect(schema).toHaveProperty('properties.title');
  });

  it('embeds the exact generated document schema in SKILL', () => {
    const schema = createDocumentJsonSchema();
    const skill = createAuthoringSkill(schema);

    expect(extractEmbeddedDocumentSchema(skill)).toEqual(schema);
  });
});

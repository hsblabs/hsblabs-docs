import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_SCHEMA_VERSION,
  documentSourceSchema,
  validateDocumentSemantics,
} from '../src/schema/document';

describe('document source schema', () => {
  it('accepts the initial hsblabs schema version', () => {
    const parsed = documentSourceSchema.parse({
      schema_version: DOCUMENT_SCHEMA_VERSION,
      type: 'Guide',
      title: 'Getting Started',
    });

    expect(parsed.schema_version).toBe('2026-08-15');
  });

  it('rejects unsupported schema versions', () => {
    expect(() =>
      documentSourceSchema.parse({
        schema_version: '2026-08-14',
        type: 'Guide',
        title: 'Getting Started',
      }),
    ).toThrow();
  });

  it('rejects conflicting direct Starlight and hsblabs sidebar metadata', () => {
    const parsed = documentSourceSchema.parse({
      schema_version: DOCUMENT_SCHEMA_VERSION,
      type: 'Guide',
      title: 'Example',
      sidebar: { order: 1 },
      hsblabs: { sidebar: { order: 2 } },
    });

    expect(validateDocumentSemantics(parsed)).toContain(
      'do not define both "hsblabs.sidebar" and Starlight "sidebar"; prefer "hsblabs.sidebar" in repository-owned docs',
    );
  });

  it('requires runtime for Attested Computation documents', () => {
    const parsed = documentSourceSchema.parse({
      schema_version: DOCUMENT_SCHEMA_VERSION,
      type: 'Attested Computation',
      title: 'Example',
    });

    expect(validateDocumentSemantics(parsed)).toContain(
      'type "Attested Computation" requires the "runtime" field',
    );
  });
});

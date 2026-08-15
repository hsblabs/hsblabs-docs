import { z } from 'zod';

import { DOCUMENT_SCHEMA_ENDPOINT } from '../config/endpoints';
import { contentCollectionSchema, DOCUMENT_SCHEMA_VERSION } from './document';

export function createDocumentJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(
    contentCollectionSchema({
      // Astro's generator uses string input, while its public type describes the
      // transformed image metadata.
      image: () =>
        z.string() as unknown as ReturnType<
          Parameters<typeof contentCollectionSchema>[0]['image']
        >,
    }),
    {
      target: 'draft-2020-12',
      io: 'input',
      unrepresentable: 'any',
    },
  );

  return {
    ...generated,
    $id: `https://hsb.horse${DOCUMENT_SCHEMA_ENDPOINT}`,
    title: 'hsblabs OSS document frontmatter',
    description: 'The OKF-derived hsblabs OSS document frontmatter profile.',
    'x-hsblabs-schema-version': DOCUMENT_SCHEMA_VERSION,
    'x-okf-version': '0.2',
  };
}

export function stringifyDocumentJsonSchema(
  schema: Record<string, unknown> = createDocumentJsonSchema(),
): string {
  return `${JSON.stringify(schema, null, 2)}\n`;
}

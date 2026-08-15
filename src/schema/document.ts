import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'zod';

export const DOCUMENT_SCHEMA_VERSION = '2026-08-15' as const;
export const SUPPORTED_DOCUMENT_SCHEMA_VERSIONS = [
  DOCUMENT_SCHEMA_VERSION,
] as const;

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const actorSchema = z.string().min(1);

const verificationEventSchema = z.object({
  by: actorSchema,
  at: z.string().regex(isoDateTimePattern, 'expected an ISO 8601 datetime'),
});

const usageWindowSchema = z.object({
  from: z.string().regex(isoDatePattern, 'expected YYYY-MM-DD'),
  to: z.string().regex(isoDatePattern, 'expected YYYY-MM-DD'),
});

const sourceSchema = z.looseObject({
  id: z.string().min(1).optional(),
  resource: z.string().min(1),
  title: z.string().min(1).optional(),
  author: actorSchema.optional(),
  usage_count: z.number().int().nonnegative().optional(),
  last_modified: z
    .string()
    .regex(isoDatePattern, 'expected YYYY-MM-DD')
    .optional(),
  usage_window: usageWindowSchema.optional(),
});

const parameterSchema = z.looseObject({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
});

const executorSchema = z.looseObject({
  resource: z.string().min(1),
  receipt: z.array(z.string().min(1)).min(1),
});

const attesterSchema = z.looseObject({
  resource: z.string().min(1),
});

const hsblabsSidebarSchema = z.object({
  label: z.string().min(1).optional(),
  order: z.number().optional(),
  hidden: z.boolean().optional(),
});

const hsblabsMetadataSchema = z.looseObject({
  sidebar: hsblabsSidebarSchema.optional(),
});

/**
 * OKF v0.2-derived hsblabs profile fields shared by source validation and the
 * actual Starlight Content Collection schema.
 */
const hsblabsDocumentFields = {
  schema_version: z.enum(SUPPORTED_DOCUMENT_SCHEMA_VERSIONS),
  okf_version: z.literal('0.2').optional(),
  type: z.string().trim().min(1),
  resource: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  sources: z.array(sourceSchema).optional(),
  usage_window: usageWindowSchema.optional(),
  generated: z
    .object({
      by: actorSchema,
      at: z.string().regex(isoDateTimePattern, 'expected an ISO 8601 datetime'),
    })
    .optional(),
  verified: z
    .union([verificationEventSchema, z.array(verificationEventSchema).min(1)])
    .optional(),
  status: z.enum(['draft', 'stable', 'deprecated']).optional(),
  stale_after: z
    .string()
    .regex(isoDatePattern, 'expected YYYY-MM-DD')
    .optional(),
  runtime: z.string().min(1).optional(),
  parameters: z.array(parameterSchema).optional(),
  computation: z.string().min(1).optional(),
  executor: executorSchema.optional(),
  attester: attesterSchema.optional(),
  hsblabs: hsblabsMetadataSchema.optional(),
} satisfies z.ZodRawShape;

export const hsblabsDocumentExtensionSchema = z.looseObject(
  hsblabsDocumentFields,
);

/**
 * The actual Starlight Content Collection schema.
 *
 * Starlight owns its standard frontmatter fields (`title`, `description`,
 * `sidebar`, etc.). hsblabs adds the OKF-derived authoring contract above.
 */
export const contentCollectionSchema = docsSchema({
  extend: hsblabsDocumentExtensionSchema,
});

/**
 * Source validation used by the ingestion script before Astro runs.
 * Unknown fields are intentionally accepted because OKF permits
 * producer-defined extensions. `title` is required by the hsblabs profile to
 * satisfy Starlight's page contract.
 */
export const documentSourceSchema = z.looseObject({
  ...hsblabsDocumentFields,
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
});

export type DocumentSource = z.infer<typeof documentSourceSchema>;

export function validateDocumentSemantics(
  document: DocumentSource,
): readonly string[] {
  const issues: string[] = [];

  if (document.type === 'Attested Computation' && !document.runtime) {
    issues.push('type "Attested Computation" requires the "runtime" field');
  }

  if (
    document.sources?.some((source) => source.usage_count !== undefined) &&
    document.usage_window === undefined &&
    !document.sources.every(
      (source) =>
        source.usage_count === undefined || source.usage_window !== undefined,
    )
  ) {
    issues.push(
      'sources with usage_count require either top-level usage_window or a per-source usage_window',
    );
  }

  if (
    document.hsblabs?.sidebar !== undefined &&
    document.sidebar !== undefined
  ) {
    issues.push(
      'do not define both "hsblabs.sidebar" and "sidebar"; prefer "hsblabs.sidebar" in repository-owned docs',
    );
  }

  return issues;
}

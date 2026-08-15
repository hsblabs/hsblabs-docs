import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { z } from 'zod';

const projectSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  repository: z
    .string()
    .regex(
      /^hsblabs\/[A-Za-z0-9._-]+$/,
      'repository must belong to the hsblabs organization',
    ),
  ref: z.string().min(1).default('main'),
  enabled: z.boolean().default(true),
  label: z.string().min(1).optional(),
});

const projectsFileSchema = z
  .object({
    projects: z.array(projectSchema),
  })
  .superRefine(({ projects }, context) => {
    const seenSlugs = new Set<string>();
    const seenRepositories = new Set<string>();

    for (const [index, project] of projects.entries()) {
      if (project.slug === 'pages') {
        context.addIssue({
          code: 'custom',
          path: ['projects', index, 'slug'],
          message: 'slug "pages" is reserved for site-level endpoints',
        });
      }

      if (seenSlugs.has(project.slug)) {
        context.addIssue({
          code: 'custom',
          path: ['projects', index, 'slug'],
          message: `duplicate project slug: ${project.slug}`,
        });
      }
      seenSlugs.add(project.slug);

      if (seenRepositories.has(project.repository)) {
        context.addIssue({
          code: 'custom',
          path: ['projects', index, 'repository'],
          message: `duplicate project repository: ${project.repository}`,
        });
      }
      seenRepositories.add(project.repository);
    }
  });

export type Project = Readonly<z.infer<typeof projectSchema>>;

export function loadProjects(): readonly Project[] {
  const path = resolve(process.cwd(), 'projects/projects.json');
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  return projectsFileSchema.parse(parsed).projects;
}

export function loadEnabledProjects(): readonly Project[] {
  return loadProjects().filter((project) => project.enabled);
}

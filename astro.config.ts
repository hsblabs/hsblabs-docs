import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLlmsTxt from 'starlight-llms-txt';

import { DOCS_BASE_PATH } from './src/config/site';
import { loadEnabledProjects } from './src/lib/projects';

const projects = loadEnabledProjects();

export default defineConfig({
  site: 'https://hsb.horse',
  base: DOCS_BASE_PATH,
  outDir: './dist/hsblabs/oss',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'hsblabs OSS',
      description:
        'Documentation for open-source projects published by hsblabs.',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        ja: {
          label: '日本語',
          lang: 'ja',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/hsblabs',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Sidebar: './src/components/ProjectSidebar.astro',
        SiteTitle: './src/components/SiteTitle.astro',
      },
      sidebar: projects.map((project) => ({
        label: project.label ?? project.slug,
        items: [
          {
            autogenerate: {
              directory: project.slug,
              collapsed: false,
            },
          },
        ],
      })),
      plugins: [
        starlightLlmsTxt({
          projectName: 'hsblabs OSS',
          description:
            'Documentation for open-source projects published by hsblabs.',
          customSets: projects.map((project) => ({
            label: project.label ?? project.slug,
            description: `Documentation for ${project.repository}.`,
            paths: [`${project.slug}/**`],
          })),
          promote: [
            'index*',
            ...projects.map((project) => `${project.slug}/index*`),
          ],
        }),
      ],
    }),
  ],
});

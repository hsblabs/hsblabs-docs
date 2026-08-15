import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightLlmsTxt from 'starlight-llms-txt';

import { DOCS_BASE_PATH } from './src/config/site';
import { DEFAULT_SITE_LOCALE, SITE_LOCALES } from './src/config/locales';
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
      favicon: '/favicon.png',
      description:
        'Documentation for open-source projects published by hsblabs.',
      head: [
        {
          tag: 'script',
          attrs: {
            async: true,
            src: 'https://www.googletagmanager.com/gtag/js?id=G-WZ3RT34EZZ',
          },
        },
        {
          tag: 'script',
          content: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WZ3RT34EZZ');
          `,
        },
      ],
      defaultLocale: DEFAULT_SITE_LOCALE,
      locales: SITE_LOCALES,
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/hsblabs',
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
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

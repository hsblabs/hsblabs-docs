export const SITE_LOCALES = {
  root: {
    label: 'English',
    lang: 'en',
  },
  ja: {
    label: '日本語',
    lang: 'ja',
  },
} as const;

export const DEFAULT_SITE_LOCALE = 'root';
export const SOURCE_LOCALES = Object.keys(SITE_LOCALES).filter(
  (locale) => locale !== DEFAULT_SITE_LOCALE,
);

export function splitSourceLocalePath(relativePath: string): {
  locale?: string;
  path: string;
} {
  const [candidate, ...rest] = relativePath.split('/');

  if (candidate && SOURCE_LOCALES.includes(candidate)) {
    return { locale: candidate, path: rest.join('/') };
  }

  return { path: relativePath };
}

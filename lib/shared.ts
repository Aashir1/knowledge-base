import { createGetUrl } from 'fumadocs-core/source';

export const appName = 'Notes';
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const docsRoute = '/';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'Aashir1',
  repo: 'knowledge-base',
  branch: 'main',
};

const getContentUrl = createGetUrl(docsContentRoute);

export function getPageMarkdownUrl(page: { slugs: string[]; locale?: string }) {
  const segments = [...page.slugs, 'content.md'];

  return { segments, url: getContentUrl(segments, page.locale) };
}

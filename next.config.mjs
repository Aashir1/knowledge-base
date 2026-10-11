import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// GitHub Pages serves the site from https://aashir1.github.io/knowledge-base/
const basePath = '/knowledge-base';
const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const config = {
  // Static export is only needed for the GitHub Pages build; `next dev` runs as a normal server
  // so the redirect below works.
  output: isDev ? undefined : 'export',
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

// In `next dev`, send http://localhost:3000/ to the base path instead of a 404.
if (isDev) {
  config.redirects = async () => [
    { source: '/', destination: `${basePath}/`, basePath: false, permanent: false },
  ];
}

export default withMDX(config);

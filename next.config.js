const isProd = process.env.NODE_ENV === 'production';
const repoName = 'WTStats';

const createMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true, // ✅ Ensures static pages end with /index.html

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',

  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : '',
  },

  images: {
    unoptimized: true, // ✅ Required for static image loading
  },

  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  transpilePackages: ['next-mdx-remote'],
};

module.exports = createMDX(nextConfig);

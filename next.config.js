// next.config.js
const isProd = process.env.NODE_ENV === 'production';
const repoName = 'WTStats'; // Or whatever your repo is named

// Import @next/mdx
const createMDX = require('@next/mdx')({ // Renamed variable for clarity
  extension: /\.mdx?$/, // Process .md and .mdx files
  options: {
    remarkPlugins: [], // Add any remark plugins here, e.g., require('remark-gfm') for tables
    rehypePlugins: [], // Add any rehype plugins here
    // If you use an MDXProvider, you might need: providerImportSource: "@mdx-js/react",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the 'export' output mode for static hosting
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Tell Next.js that all page links (e.g., /about) should be prefixed with the repo name in production
  basePath: isProd ? `/${repoName}` : '',

  // Tell Next.js that all assets (JS, CSS, images) should be prefixed with the repo name in production
  assetPrefix: isProd ? `/${repoName}/` : '',

  // Make the base path available to client-side code (our fetcher)
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : '',
  },

  // Disable Next.js image optimization, which isn't compatible with static export if `output: 'export'`
  // and you are not using a custom loader.
  images: {
    unoptimized: true,
  },

  // *** ADD THIS LINE ***
  // Tell Next.js to recognize .mdx and .md files as pages/components
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  transpilePackages: ['next-mdx-remote'],
};

// *** WRAP YOUR CONFIG WITH THE MDX HOF ***
module.exports = createMDX(nextConfig); // Use the createMDX Higher Order Function
// next.config.js

const isProd = process.env.NODE_ENV === 'production';

// *** THIS IS THE MOST IMPORTANT LINE. IT MUST MATCH YOUR REPO NAME EXACTLY. ***
const repoName = 'WTStats'; // Or whatever your repo is named

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

  // Disable Next.js image optimization, which isn't compatible with static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;

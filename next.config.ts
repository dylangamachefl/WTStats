
import type {NextConfig} from 'next';

const isProd = process.env.NODE_ENV === 'production';
const repoName = 'WTStats';
const basePath = `/${repoName}`; // Hardcoded

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  basePath: basePath,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'g.espncdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.supergraphictees.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.customon.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'decollins1969.files.wordpress.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // some image URLs are http
        hostname: 'heavyeditorial.files.wordpress.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // some image URLs are http
        hostname: 'thejasminebrand.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http', // some image URLs are http
        hostname: 'www.scarecrowboat.com',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true, // Required for next export with next/image
  },
  assetPrefix: `${basePath}/`, 
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath, // Expose it to client-side// Note the trailing slash for assetPrefix
  }
};

export default nextConfig;
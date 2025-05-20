
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@playwright/test'],
  },
};

module.exports = nextConfig;
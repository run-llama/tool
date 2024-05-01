import { webpackPlugin } from '@llamaindex/tool/plugin'

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.plugins.push(webpackPlugin())
    return config
  }
};

export default nextConfig;

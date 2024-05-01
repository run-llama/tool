import { createWebpackPlugin } from 'unplugin'
import { unpluginFactory } from './plugin'
import type { NextConfig } from 'next'

const webpackPlugin = createWebpackPlugin(unpluginFactory)

export function withNext (config: NextConfig) {
  return {
    ...config,
    webpack: (config: any) => {
      config.plugins.push(webpackPlugin())
      return config
    }
  }
}
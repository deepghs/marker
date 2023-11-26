import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { createHtmlPlugin } from 'vite-plugin-html'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";

const getViteEnv = (mode: string, target: string) => {
  return loadEnv(mode, process.cwd())[target]
}

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    plugins: [
      vue(),
      vueJsx(),
      // wasm(),
      // topLevelAwait(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            logo: getViteEnv(mode, "VITE_APP_LOGO"),
            title: getViteEnv(mode, 'VITE_APP_TITLE')
          }
        }
      }),
      nodePolyfills()
    ],
    base:'./',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      minify: false,
    }
  })
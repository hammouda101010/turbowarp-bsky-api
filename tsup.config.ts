import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'blueskyapi', // Replace it with your extension name
  entry: ['src/index.ts', 'src/index.js'],
  target: ['esnext'],
  format: ['iife'],
  outDir: 'dist',
  banner: {
    // Replace it with your extension's metadata
    js: `// Name: TurboButterFly
// ID: HamBskyAPI
// Description: Interact with the BlueSky API! Unofficial.
// By: Hammouda101010 <https://github.com/hammouda101010>
// Original: BlueSky <https://bsky.app>
// License: MIT
`
  },
  platform: 'browser',
  clean: true
})

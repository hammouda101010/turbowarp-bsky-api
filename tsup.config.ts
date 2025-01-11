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
// By: Hammouda101010 <https://scratch.mit.edu/users/hammouda101010/>
// Original: BlueSky <https://bsky.app>
// License: MPL-2.0
`
  },
  platform: 'browser',
  clean: true
})

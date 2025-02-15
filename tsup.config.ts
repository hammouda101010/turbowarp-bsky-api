import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'twblueskyapi',
  entry: ['src/index.ts', 'src/index.js'],
  target: ['esnext'],
  format: ['iife'],
  outDir: 'dist/extension',
  banner: {
    js: `// Name: TurboButterfly
// ID: HamBskyAPI
// Description: Interact with the BlueSky API! Unofficial.
// By: Hammouda101010 <https://scratch.mit.edu/users/hammouda101010/>
// Original: BlueSky <https://bsky.social/>
// License: MIT AND MPL-2.0
`
  },
  platform: 'browser',
  clean: true
})

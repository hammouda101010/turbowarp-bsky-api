# 🦋🟦🌐 TurboButterfly: BlueSky API for Turbowarp 🌐🟦🦋
![Banner](https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/turbobutterfly-banner.png)

This is the unofficial extension for the BlueSky API!

### Things It Can Do:
- Implements the Bluesky API into your Turbowarp projects:
  - Create new posts and replies
  - Insert embeds into your posts
  - View feeds, feed generators and user posts
  - Get post threads and accounts information
  - Like, follow, and repost stuff you like
  - Edit your profile
  - Block and mute annoying users
  - Search posts and profiles
  - ...and more!
### Things It Can't Do:
- Steal Your Credit Card Information 
## Release Plan:
~~v1.0 pre-alpha: first version~~

~~v1.0 alpha: Created testing bot and more API interactions. major bug fixes. do not use.~~

**v1.0 beta: current. unstable and unfinished. major improvements.**

_v1.0-release-candidate: Extension complete. Meets standards of full release with minimal issues. During this release period, preparations for full release include gallery thumbnail, sample project, documentation, etc._

## Active Development
### v1.0-beta:
- Complete the rest of the API (thread gates, user lists, moderation, languages, etc.)
- **Bug-fixes** (if there are any bugs)
- **More error-handling** (or maybe not)
- video embeds
- ~~(if required) future rewrite in favor of Bluesky's OAuth login method~~



## Getting Started

1. Download the Javascript File [Here](https://github.com/hammouda101010/turbowarp-bsky-api/blob/main/dist/extension/index.global.js)
2. Import it to (whatever) Turbowarp-based Scratch mod (Turbowarp, Unsandboxed, Penguinmod, etc.)
   ![Example](https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/import-extension-example.png)

3. Read the documentation to get started
## 💻🔨🦋🦋 Development 🦋🦋🔨💻

Clone and install this repo on your machine to get started.

```bash
git clone git@github.com:hammouda101010/turbowarp-bsky-api.git
cd turbowarp-bsky-api
npm install
```

### 📝🔍🦋 Checking

Check for typing: `npm run lint:type`

Check for format: `npm run lint:format` (Fix: `npm run format`)

Check for eslint: `npm run lint` (Fix: `npm run fix`)

### 📦🔨🦋 Building

Build: `npm run build`

Build for Turbowarp (format to match its prettier): `npm run build:turbowarp`

Development server: `npm run start` (Extension: <http://localhost:8000/extension/index.global.js>)

## 📑🦋💙🦋🦋 Credits/Aknowlegments 🦋🦋💙🦋📑

Thanks for this scaffolding: [FurryR/scratch-ext](https://github.com/FurryR/scratch-ext/tree/main) \
Original API: [BlueSky TypeScript API](https://github.com/bluesky-social/atproto/tree/main/packages/api) \
Extension Images are From [SVG Repo](https://www.svgrepo.com/)
Special Thanks to: @yuri-kiss

### Notes
---
<div align="center">
<i>
This Repository is licensed under the MIT license 👍📑

Copied Some Text [Here](https://github.com/cloudlink-omega/extension)
</i>
</div>

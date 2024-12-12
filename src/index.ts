import { AtpAgent } from '@atproto/api';
(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error('Sandboxed mode is not supported')
  }
  // Your extension's code
  const agent = new AtpAgent({
    service: 'https://bsky.social'
  })

  const Login = async (handle:string, password:string) => {
    await agent.login({
      identifier: handle,
      password: password
    })
  }
  
  class HamBskyAPI implements Scratch.Extension {
    runtime: VM.Runtime
    constructor(runtime: VM.Runtime) {
      
      this.runtime = runtime
    }
    getInfo() {
      return {
        id: 'HamBskyAPI',
        name: "Bluesky API",
        color1: '#0c8cfc',
        color2: '#0484fc',
        blocks: [
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'login',
            text: 'login to bluesky API with handle: [HANDLE] and password: [PASSWORD]',
            arguments:{
              HANDLE:{
                type: Scratch.ArgumentType.STRING,
                defaultValue: '@example.bsky.social'
              },
              PASSWORD:{
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'example'
              }
            }
          }
        ]
      }
    }
    login(args): void{
      Login(args.HANDLE, args.PASSWORD)
    }
  }
  // The following snippet ensures compatibility with Turbowarp / Gandi IDE. If you want to write Turbowarp-only or Gandi-IDE code, please remove corresponding code
  if (Scratch.vm?.runtime) {
    // For Turbowarp
    Scratch.extensions.register(new HamBskyAPI(Scratch.runtime))
  } else {
    // For Gandi
    window.tempExt = {
      Extension: HamBskyAPI,
      info: {
        extensionId: 'HamBskyAPI',
        name: 'HamBskyAPI.name',
        description: 'HamBskyAPI.description',
        featured: true,
        disabled: false,
        collaboratorList: [
          {
            collaborator: 'Hammouda101010',
            collaboratorURL: 'https://github.com/Hammouda101010'
          }
        ]
      },
      l10n: {
        en: {
          'newExtension.name': "BlueSky API",
          'newExtension.description': 'Interact with the BlueSky API!'
        }
      }
    }
  }
})(Scratch)

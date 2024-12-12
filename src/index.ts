// Required Modules
import { AtpAgent } from '@atproto/api';

(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error('Sandboxed mode is not supported')
  }
  // The extension's code

  // Icons
  const bskyIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjU2OCIKICAgaGVpZ2h0PSI1MDEiCiAgIHZpZXdCb3g9IjAgMCA1NjggNTAxIgogICBmaWxsPSJub25lIgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcxIgogICBzb2RpcG9kaTpkb2NuYW1lPSJibHVlc2t5X21lZGlhX2tpdF9sb2dvLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4zLjIgKDA5MWUyMGUsIDIwMjMtMTEtMjUsIGN1c3RvbSkiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnMKICAgICBpZD0iZGVmczEiIC8+CiAgPHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlkPSJuYW1lZHZpZXcxIgogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzAwMDAwMCIKICAgICBib3JkZXJvcGFjaXR5PSIwLjI1IgogICAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iMCIKICAgICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgICAgaW5rc2NhcGU6em9vbT0iMS42MjI3NTQ1IgogICAgIGlua3NjYXBlOmN4PSIyODMuNzc2NzUiCiAgICAgaW5rc2NhcGU6Y3k9IjI1MC41IgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDA5IgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJzdmcxIiAvPgogIDxwYXRoCiAgICAgZD0iTTEyMy4xMjEgMzMuNjYzN0MxODguMjQxIDgyLjU1MjYgMjU4LjI4MSAxODEuNjgxIDI4NCAyMzQuODczQzMwOS43MTkgMTgxLjY4MSAzNzkuNzU5IDgyLjU1MjYgNDQ0Ljg3OSAzMy42NjM3QzQ5MS44NjYgLTEuNjExODMgNTY4IC0yOC45MDY0IDU2OCA1Ny45NDY0QzU2OCA3NS4yOTE2IDU1OC4wNTUgMjAzLjY1OSA1NTIuMjIyIDIyNC41MDFDNTMxLjk0NyAyOTYuOTU0IDQ1OC4wNjcgMzE1LjQzNCAzOTIuMzQ3IDMwNC4yNDlDNTA3LjIyMiAzMjMuOCA1MzYuNDQ0IDM4OC41NiA0NzMuMzMzIDQ1My4zMkMzNTMuNDczIDU3Ni4zMTIgMzAxLjA2MSA0MjIuNDYxIDI4Ny42MzEgMzgzLjAzOUMyODUuMTY5IDM3NS44MTIgMjg0LjAxNyAzNzIuNDMxIDI4NCAzNzUuMzA2QzI4My45ODMgMzcyLjQzMSAyODIuODMxIDM3NS44MTIgMjgwLjM2OSAzODMuMDM5QzI2Ni45MzkgNDIyLjQ2MSAyMTQuNTI3IDU3Ni4zMTIgOTQuNjY2NyA0NTMuMzJDMzEuNTU1NiAzODguNTYgNjAuNzc3OCAzMjMuOCAxNzUuNjUzIDMwNC4yNDlDMTA5LjkzMyAzMTUuNDM0IDM2LjA1MzUgMjk2Ljk1NCAxNS43Nzc4IDIyNC41MDFDOS45NDUyNSAyMDMuNjU5IDAgNzUuMjkxNiAwIDU3Ljk0NjRDMCAtMjguOTA2NCA3Ni4xMzQ1IC0xLjYxMTgzIDEyMy4xMjEgMzMuNjYzN1oiCiAgICAgZmlsbD0iYmxhY2siCiAgICAgaWQ9InBhdGgxIgogICAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+Cjwvc3ZnPgo='
  const speechBubbleIcon = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+Cgo8c3ZnCiAgIGZpbGw9IiMwMDAwMDAiCiAgIGhlaWdodD0iODAwcHgiCiAgIHdpZHRoPSI4MDBweCIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iQ2FwYV8xIgogICB2aWV3Qm94PSIwIDAgMzcxLjExNyAzNzEuMTE3IgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICBzb2RpcG9kaTpkb2NuYW1lPSJibGFjay1zcGVlY2gtYnViYmxlLXN2Z3JlcG8tY29tLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4zLjIgKDA5MWUyMGUsIDIwMjMtMTEtMjUsIGN1c3RvbSkiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnMKICAgaWQ9ImRlZnMxIiAvPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgaWQ9Im5hbWVkdmlldzEiCiAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgYm9yZGVyY29sb3I9IiMwMDAwMDAiCiAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgIGlua3NjYXBlOnpvb209IjEuMDE2MjUiCiAgIGlua3NjYXBlOmN4PSI0MDAiCiAgIGlua3NjYXBlOmN5PSI0MDAiCiAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOSIKICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkNhcGFfMSIgLz4KPHBhdGgKICAgZD0iTTMxNi4zMyw2NC41NTZjLTM0Ljk4Mi0yNy42MDctODEuNDI0LTQyLjgxMS0xMzAuNzcyLTQyLjgxMWMtNDkuMzQ4LDAtOTUuNzksMTUuMjA0LTEzMC43NzEsNDIuODExICBDMTkuNDU3LDkyLjQzOCwwLDEyOS42MTUsMCwxNjkuMjM4YzAsMjMuODM1LDcuMzA4LDQ3LjUwOCwyMS4xMzMsNjguNDZjMTIuNzU5LDE5LjMzNSwzMS4wNywzNi40Miw1My4wODgsNDkuNTY0ICBjLTEuMDE2LDcuMTE2LTYuNDg3LDI3Ljk0MS0zNS44ODgsNTIuNzU5Yy0xLjUxMywxLjI3OC0yLjEzLDMuMzI4LTEuNTcyLDUuMjI5YzAuNTU4LDEuOSwyLjE4NSwzLjI5Miw0LjE0OCwzLjU1ICBjMC4xNzgsMC4wMjMsNC40NTQsMC41NzIsMTIuMDUyLDAuNTcyYzIxLjY2NSwwLDY1LjkzOS00LjMwMiwxMjAuMDYzLTMyLjk3M2M0LjE3NywwLjIyMSw4LjM4NywwLjMzMywxMi41MzQsMC4zMzMgIGM0OS4zNDgsMCw5NS43ODktMTUuMjA0LDEzMC43NzItNDIuODExYzM1LjMzLTI3Ljg4Miw1NC43ODctNjUuMDU5LDU0Ljc4Ny0xMDQuNjgzQzM3MS4xMTcsMTI5LjYxNSwzNTEuNjYsOTIuNDM4LDMxNi4zMyw2NC41NTZ6IgogICBpZD0icGF0aDEiCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+Cjwvc3ZnPgo='

  // Objects
  const agent = new AtpAgent({
    service: 'https://bsky.social'
  })

  // Utility Functions
  const Login = async (handle:string, password:string) => {
    await agent.login({ // Logs in the user with some credentrials
      identifier: handle,
      password: password
    })
  }
  const Post = async (post: string, useCurrentDate:boolean = true, date:string ="16-12-2024") => {
    await agent.post({
      text: post,
      createdAt: useCurrentDate ? new Date().toISOString() : new Date(date).toISOString()
    })
  }
  
  class HamBskyAPI implements Scratch.Extension {
    runtime: VM.Runtime
    useCurrentDate: boolean;
    constructor(runtime: VM.Runtime) {
      
      this.runtime = runtime
      this.useCurrentDate = true
    }
    getInfo() {
      return {
        id: 'HamBskyAPI',
        name: "Bluesky API",
        color1: '#0c8cfc',
        color2: '#0484fc',
        menuIconURI: bskyIcon,
        blockIconURI: bskyIcon,
        blocks: [
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyLogin',
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
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyPost',
            text: 'post [POST_ICON][POST] to bluesky',
            arguments:{
              POST_ICON:{
                type: Scratch.ArgumentType.IMAGE,
                dataURI: speechBubbleIcon
              },
              POST:{
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello!'
              }
            }
          }
        ]
      }
    }
    bskyLogin(args): void{
      Login(args.HANDLE, args.PASSWORD)
    }
    bskyPost(args): void{
      Post(args.POST, this.useCurrentDate)
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

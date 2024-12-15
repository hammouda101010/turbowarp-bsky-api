// Required Modules
import { AtpAgent } from "@atproto/api"
import { RichText } from "@atproto/api"

;(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error("Sandboxed mode is not supported")
  }
  // The extension"s code

  // Icons
  const bskyIcon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjY0IgogICBoZWlnaHQ9IjY0IgogICB2aWV3Qm94PSIwIDAgNjQgNjQiCiAgIGZpbGw9Im5vbmUiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzEiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImJsdWVza3lfbWVkaWFfa2l0X2xvZ28uc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjMuMiAoMDkxZTIwZSwgMjAyMy0xMS0yNSwgY3VzdG9tKSIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzMSIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9Im5hbWVkdmlldzEiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjMDAwMDAwIgogICAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAuMCIKICAgICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICAgIGlua3NjYXBlOmRlc2tjb2xvcj0iI2QxZDFkMSIKICAgICBpbmtzY2FwZTp6b29tPSIxLjYyMjc1NDUiCiAgICAgaW5rc2NhcGU6Y3g9IjI4My43NzY3NSIKICAgICBpbmtzY2FwZTpjeT0iMjAxLjgxNzM0IgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDA5IgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJzdmcxIiAvPgogIDxwYXRoCiAgICAgZD0iTSAxMy44NzI3ODksNC4zMDc5MzE3IEMgMjEuMjEwMjU0LDEwLjU2NDI0MyAyOS4xMDIwODUsMjMuMjQ5NyAzMiwzMC4wNTY2OCAzNC44OTc5MTUsMjMuMjQ5NyA0Mi43ODk3NDYsMTAuNTY0MjQzIDUwLjEyNzIxMiw0LjMwNzkzMTcgNTUuNDIxNTIxLC0wLjIwNjI3Njc5IDY0LC0zLjY5OTE2MiA2NCw3LjQxNTM4OCA2NCw5LjYzNTA1MjggNjIuODc5NDM3LDI2LjA2MjIyNSA2Mi4yMjIxOTgsMjguNzI5Mzc1IDU5LjkzNzY5LDM4LjAwMTE4MyA1MS42MTMxODQsNDAuMzY2MDY4IDQ0LjIwODExMywzOC45MzQ3MjQgNTcuMTUxNzc1LDQxLjQzNjY2NSA2MC40NDQzOTQsNDkuNzI0MDAxIDUzLjMzMzI5Niw1OC4wMTEzMzUgMzkuODI3OTQ0LDczLjc1MDYxNyAzMy45MjIzNjcsNTQuMDYyMzEgMzIuNDA5MTI3LDQ5LjAxNzQ3OCAzMi4xMzE3MTgsNDguMDkyNjM4IDMyLjAwMTkxNiw0Ny42NTk5NzIgMzIsNDguMDI3ODg2IDMxLjk5ODEsNDcuNjU5OTcyIDMxLjg2ODI4Miw0OC4wOTI2MzYgMzEuNTkwODczLDQ5LjAxNzQ3OCAzMC4wNzc2MzQsNTQuMDYyMzEgMjQuMTcyMDU2LDczLjc1MDYxNyAxMC42NjY2NzEsNTguMDExMzM1IDMuNTU1NTYwNiw0OS43MjQwMDEgNi44NDgyMDI5LDQxLjQzNjY2NSAxOS43OTE4ODcsMzguOTM0NzI0IDEyLjM4NjgxNyw0MC4zNjYwNjggNC4wNjIzNjYzLDM4LjAwMTE4MyAxLjc3Nzc4MDMsMjguNzI5Mzc1IDEuMTIwNTkxNiwyNi4wNjIyMjUgMCw5LjYzNTA1MjggMCw3LjQxNTM4OCAwLC0zLjY5OTE2MiA4LjU3ODUzNTMsLTAuMjA2Mjc2NzkgMTMuODcyNzg5LDQuMzA3OTMxNyBaIgogICAgIGZpbGw9ImJsYWNrIgogICAgIGlkPSJwYXRoMSIKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjEyMDA4IiAvPgo8L3N2Zz4K"
  const speechBubbleIcon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+Cgo8c3ZnCiAgIGZpbGw9IiMwMDAwMDAiCiAgIGhlaWdodD0iODAwcHgiCiAgIHdpZHRoPSI4MDBweCIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iQ2FwYV8xIgogICB2aWV3Qm94PSIwIDAgMzcxLjExNyAzNzEuMTE3IgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICBzb2RpcG9kaTpkb2NuYW1lPSJibGFjay1zcGVlY2gtYnViYmxlLXN2Z3JlcG8tY29tLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4zLjIgKDA5MWUyMGUsIDIwMjMtMTEtMjUsIGN1c3RvbSkiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnMKICAgaWQ9ImRlZnMxIiAvPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgaWQ9Im5hbWVkdmlldzEiCiAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgYm9yZGVyY29sb3I9IiMwMDAwMDAiCiAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgIGlua3NjYXBlOnpvb209IjEuMDE2MjUiCiAgIGlua3NjYXBlOmN4PSI0MDAiCiAgIGlua3NjYXBlOmN5PSI0MDAiCiAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOSIKICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkNhcGFfMSIgLz4KPHBhdGgKICAgZD0iTTMxNi4zMyw2NC41NTZjLTM0Ljk4Mi0yNy42MDctODEuNDI0LTQyLjgxMS0xMzAuNzcyLTQyLjgxMWMtNDkuMzQ4LDAtOTUuNzksMTUuMjA0LTEzMC43NzEsNDIuODExICBDMTkuNDU3LDkyLjQzOCwwLDEyOS42MTUsMCwxNjkuMjM4YzAsMjMuODM1LDcuMzA4LDQ3LjUwOCwyMS4xMzMsNjguNDZjMTIuNzU5LDE5LjMzNSwzMS4wNywzNi40Miw1My4wODgsNDkuNTY0ICBjLTEuMDE2LDcuMTE2LTYuNDg3LDI3Ljk0MS0zNS44ODgsNTIuNzU5Yy0xLjUxMywxLjI3OC0yLjEzLDMuMzI4LTEuNTcyLDUuMjI5YzAuNTU4LDEuOSwyLjE4NSwzLjI5Miw0LjE0OCwzLjU1ICBjMC4xNzgsMC4wMjMsNC40NTQsMC41NzIsMTIuMDUyLDAuNTcyYzIxLjY2NSwwLDY1LjkzOS00LjMwMiwxMjAuMDYzLTMyLjk3M2M0LjE3NywwLjIyMSw4LjM4NywwLjMzMywxMi41MzQsMC4zMzMgIGM0OS4zNDgsMCw5NS43ODktMTUuMjA0LDEzMC43NzItNDIuODExYzM1LjMzLTI3Ljg4Miw1NC43ODctNjUuMDU5LDU0Ljc4Ny0xMDQuNjgzQzM3MS4xMTcsMTI5LjYxNSwzNTEuNjYsOTIuNDM4LDMxNi4zMyw2NC41NTZ6IgogICBpZD0icGF0aDEiCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+Cjwvc3ZnPgo="

  // Objects
  const agent = new AtpAgent({
    service: "https://bsky.social"
  })

  // Utility Functions
  async function Login(handle: string, password: string) {
    await agent.login({
      // Logs the user in with their BlueSky account credentrials
      identifier: handle,
      password: password
    })
    console.log(
      `Logged in as ${JSON.stringify({ identifier: handle, password: password })}`
    )
  } // This will also create a session

  // Posting, Repling
  async function Post(
    post: string,
    useCurrentDate: boolean = true,
    date: string = "16-12-2024"
  ) {
    try {
      const response = await agent.post({
        text: post, // The Text
        createdAt: useCurrentDate
          ? new Date().toISOString() // If the user is using the current date, then this will use the current date.
          : new Date(date).toISOString() // Otherwise, use the date the user assigned to it.
      })
      console.log(`Posted:${response}`)// Logs the post info
      if (this.richText) {
        console.log(
          `Markdown Version of This Reply: ${ConvertRichTextToMarkdown(new RichText({ text: post }))}` // Logs the Markdown version of the post's text if rich text is enabled.
        )
      }
    } catch (error) {
      console.error(`Error Posting Post: ${error}`)
    }
  }
  async function Reply(
    post: string,
    useCurrentDate: boolean = true,
    date: string = "16-12-2024",
    threadRootPostArg,
    postReplyingToArg
  ) {
    try {
      const threadRootPost = threadRootPostArg
      const postReplyingTo = postReplyingToArg
      const response = await agent.post({
        text: post, // The text (again)
        reply: {
          root: { // the reply thread data
            uri: threadRootPost.uri,
            cid: threadRootPost.cid
          },
          parent: { // the parent post data
            uri: postReplyingTo.uri,
            cid: postReplyingTo.cid
          }
        },
        createdAt: useCurrentDate
          ? new Date().toISOString()
          : new Date(date).toISOString()
      })
      console.log(`Posted Reply: ${response}`)
      if (this.richText) {
        console.log(
          `Markdown Version of This Reply: ${ConvertRichTextToMarkdown(new RichText({ text: post }))}`
        )
      }
    } catch (error) {
      console.error(`Error Posting Reply: ${error}`)
    }
  }

  function ConvertRichTextToMarkdown(rt: RichText) { // Converts rich text to Markdown
    let markdown = ""
    for (const segment of rt.segments()) {
      if (segment.isLink()) {
        markdown += `[${segment.text}](${segment.link?.uri})`
      } else if (segment.isMention()) {
        markdown += `[${segment.text}](https://my-bsky-app.com/user/${segment.mention?.did})`
      } else {
        markdown += segment.text
      }
    }
    return markdown
  }

  class HamBskyAPI implements Scratch.Extension {
    runtime: VM.Runtime
    useCurrentDate: boolean
    date: string
    richText: boolean
    constructor(runtime: VM.Runtime) {
      this.runtime = runtime
      this.useCurrentDate = true
      this.date = new Date().toISOString()
      this.richText = true
    }
    
    getInfo() {
      return {
        id: "HamBskyAPI",
        name: "Bluesky API",
        color1: "#0484fc",
        color2: "#0970D1",
        menuIconURI: bskyIcon,
        blockIconURI: bskyIcon,
        blocks: [
          {
            blockType: Scratch.BlockType.BUTTON,
            opcode: "bskyDisclaimer",
            text: "Disclaimer (Please Read)"
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyLogin",
            text: "login to bluesky API with handle: [HANDLE] and password: [PASSWORD]",
            arguments: {
              HANDLE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "@example.bsky.social"
              },
              PASSWORD: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "example"
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyPost",
            text: "post [POST_ICON][POST] to bluesky with embed: [EMBED]",
            arguments: {
              POST_ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: speechBubbleIcon
              },
              POST: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "hello!"
              },
              EMBED: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "(optional) use \"upload embed\" reporter!"
              },
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyReply",
            text: "reply [POST_ICON][REPLY] to post with info:[INFO]",
            arguments: {
              POST_ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: speechBubbleIcon
              },
              REPLY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "hello!"
              },
              INFO: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "use block below"
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyReplyReporter",
            text: "parent post uri: [POST_URI] and cid: [POST_CID] with reply uri: [URI] and reply cid: [CID]",
            arguments: {
              POST_URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g"
              },
              POST_CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g"
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g"
              },
              CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "bafyreig2fjxi3rptqdgylg7e5hmjl6mcke7rn2b6cugzlqq3i4zu6rq52q"
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyOptions",
            text: "set [POST_OPTION] to [ONOFF]",
            arguments: {
              POST_OPTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyPOST_OPTIONS"
              },
              ONOFF: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyONOFF"
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Fetching"
          },
          
        ],
        menus: {
          bskyPOST_OPTIONS: {
            acceptReporters: true,
            items: [
              { text: "rich text", value: "richText" },
              { text: "use current date", value: "useCurrentDate" },
            ]
          },
          bskyONOFF: {
            acceptReporters: false,
            items: [
              { text: "on", value: "true" },
              { text: "off", value: "false" }
            ]
          }
        }
      }
    }
    
    bskyDisclaimer(){
      alert(`DISCLAIMER: When using the \"Login\" block, NEVER use your REAL password. Use an app password instead.`)
    }

    bskyLogin(args): void {
      Login(args.HANDLE, args.PASSWORD)
    }
    async bskyPost(args): Promise<void> {
      if (!this.richText) {
        const rt = new RichText({ text: args.POST })

        await rt.detectFacets(agent)

        if (rt.facets && rt.facets.length > 0) {
          throw new Error("Error: You Can't Use Rich Text If It's Disabled.")
        }
        Post(args.POST, this.useCurrentDate, this.date)
      } else {
        Post(args.POST, this.useCurrentDate, this.date)
      }
    }
    async bskyReply(args): Promise<void> {
      const replyData = JSON.parse(args.INFO)
      if (!this.richText) {
        const rt = new RichText({ text: args.REPLY })

        await rt.detectFacets(agent)

        if (rt.facets && rt.facets.length > 0) {
          throw new Error("Error: You Can't Use Rich Text If It's Disabled.")
        }
        Reply(
          args.REPLY,
          this.useCurrentDate,
          this.date,
          replyData.threadRootPost,
          replyData.postReplyingto
        )
      } else {
        Reply(
          args.REPLY,
          this.useCurrentDate,
          this.date,
          replyData.threadRootPost,
          replyData.postReplyingto
        )
      }
    }
    bskyReplyReporter(args): string { // Use this reporter for the other block above.
      return JSON.stringify({
        threadRootPost: {
          uri: args.POST_URI,
          cid: args.POST_CID
        },
        postReplyingto: {
          uri: args.POST_URI,
          cid: args.POST_CID
        }
      })
    }
    bskyPostOptions(args){
      try{
      switch (args.POST_OPTION){
        case "richText":
          this.richText = Scratch.Cast.toBoolean(args.ONOFF)
          break 
        default:
          throw new Error("Error: This option doesn't exist. at all")
      }
    }catch(error){
      console.log(error)
    }
  }
  }
  // The following snippet ensures compatibility with Turbowarp / Gandi IDE.
  if (Scratch.vm?.runtime) {
    // For Turbowarp
    
    Scratch.extensions.register(new HamBskyAPI(Scratch.runtime))
  } else {
    // For Gandi
    window.tempExt = {
      
      Extension: HamBskyAPI,
      info: {
        extensionId: "HamBskyAPI",
        name: "HamBskyAPI.name",
        description: "HamBskyAPI.description",
        featured: true,
        disabled: false,
        collaboratorList: [
          {
            collaborator: "Hammouda101010",
            collaboratorURL: "https://github.com/Hammouda101010"
          }
        ]
      },
      l10n: {
        en: {
          "newExtension.name": "BlueSky API",
          "newExtension.description": "Interact with the BlueSky API!"
        }
      }
    }
  }
})(Scratch)

/*
          {
            blockType: Scratch.BlockType.BUTTON,
            opcode: "bskyDisclaimer",
            text: "Disclaimer (Please Read)"
          },
*/
/*bskyDisclaimer(){
      alert("DISCLAIMER: When using the \"Login\" block, NEVER use your REAL password. Use an app password instead.")
    }*/
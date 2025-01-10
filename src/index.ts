// Required Modules
import { AtpAgent } from '@atproto/api'
import { RichText } from '@atproto/api'
import { AtUri } from '@atproto/api'
import { PostView } from '@atproto/api/dist/client/types/app/bsky/feed/defs'

;(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error('Sandboxed mode is not supported')
  }
  // The extension"s code

  // Scratch's Stuff
  const vm = Scratch.vm
  const runtime = vm.runtime
  const Cast = Scratch.Cast

  // Patch
  
  //@ts-expect-error
  const ogConverter = runtime._convertBlockForScratchBlocks.bind(runtime)
  //@ts-expect-error
  runtime._convertBlockForScratchBlocks = function (blockInfo, categoryInfo) {
    const res = ogConverter(blockInfo, categoryInfo)
    if (blockInfo.outputShape) res.json.outputShape = blockInfo.outputShape
    return res
  }

  // Events
  const BskyLoginEvent = new CustomEvent('bskyLogin')
  const BskyLogoutEvent = new CustomEvent('bskyLogout')

  // Regexes
  const atUriPattern = /^at:\/\/(did:plc:[a-z0-9]+)\/?(.+)?$/
  const atProfileUriPattern = /^at:\/\/(did:plc:[a-z0-9]+)\/?$/
  const atPostUriPattern =
    /^at:\/\/(did:plc:[a-z0-9]+)\/app\.bsky\.feed\.post\/([a-z0-9]+)$/

  // Icons
  const bskyIcon =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjY0IgogICBoZWlnaHQ9IjY0IgogICB2aWV3Qm94PSIwIDAgNjQgNjQiCiAgIGZpbGw9Im5vbmUiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzEiCiAgIHNvZGlwb2RpOmRvY25hbWU9ImJsdWVza3lfbWVkaWFfa2l0X2xvZ28uc3ZnIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIxLjMuMiAoMDkxZTIwZSwgMjAyMy0xMS0yNSwgY3VzdG9tKSIKICAgeG1sbnM6aW5rc2NhcGU9Imh0dHA6Ly93d3cuaW5rc2NhcGUub3JnL25hbWVzcGFjZXMvaW5rc2NhcGUiCiAgIHhtbG5zOnNvZGlwb2RpPSJodHRwOi8vc29kaXBvZGkuc291cmNlZm9yZ2UubmV0L0RURC9zb2RpcG9kaS0wLmR0ZCIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzdmc9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzMSIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9Im5hbWVkdmlldzEiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjMDAwMDAwIgogICAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAuMCIKICAgICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICAgIGlua3NjYXBlOmRlc2tjb2xvcj0iI2QxZDFkMSIKICAgICBpbmtzY2FwZTp6b29tPSIxLjYyMjc1NDUiCiAgICAgaW5rc2NhcGU6Y3g9IjI4My43NzY3NSIKICAgICBpbmtzY2FwZTpjeT0iMjAxLjgxNzM0IgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSIxMDA5IgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJzdmcxIiAvPgogIDxwYXRoCiAgICAgZD0iTSAxMy44NzI3ODksNC4zMDc5MzE3IEMgMjEuMjEwMjU0LDEwLjU2NDI0MyAyOS4xMDIwODUsMjMuMjQ5NyAzMiwzMC4wNTY2OCAzNC44OTc5MTUsMjMuMjQ5NyA0Mi43ODk3NDYsMTAuNTY0MjQzIDUwLjEyNzIxMiw0LjMwNzkzMTcgNTUuNDIxNTIxLC0wLjIwNjI3Njc5IDY0LC0zLjY5OTE2MiA2NCw3LjQxNTM4OCA2NCw5LjYzNTA1MjggNjIuODc5NDM3LDI2LjA2MjIyNSA2Mi4yMjIxOTgsMjguNzI5Mzc1IDU5LjkzNzY5LDM4LjAwMTE4MyA1MS42MTMxODQsNDAuMzY2MDY4IDQ0LjIwODExMywzOC45MzQ3MjQgNTcuMTUxNzc1LDQxLjQzNjY2NSA2MC40NDQzOTQsNDkuNzI0MDAxIDUzLjMzMzI5Niw1OC4wMTEzMzUgMzkuODI3OTQ0LDczLjc1MDYxNyAzMy45MjIzNjcsNTQuMDYyMzEgMzIuNDA5MTI3LDQ5LjAxNzQ3OCAzMi4xMzE3MTgsNDguMDkyNjM4IDMyLjAwMTkxNiw0Ny42NTk5NzIgMzIsNDguMDI3ODg2IDMxLjk5ODEsNDcuNjU5OTcyIDMxLjg2ODI4Miw0OC4wOTI2MzYgMzEuNTkwODczLDQ5LjAxNzQ3OCAzMC4wNzc2MzQsNTQuMDYyMzEgMjQuMTcyMDU2LDczLjc1MDYxNyAxMC42NjY2NzEsNTguMDExMzM1IDMuNTU1NTYwNiw0OS43MjQwMDEgNi44NDgyMDI5LDQxLjQzNjY2NSAxOS43OTE4ODcsMzguOTM0NzI0IDEyLjM4NjgxNyw0MC4zNjYwNjggNC4wNjIzNjYzLDM4LjAwMTE4MyAxLjc3Nzc4MDMsMjguNzI5Mzc1IDEuMTIwNTkxNiwyNi4wNjIyMjUgMCw5LjYzNTA1MjggMCw3LjQxNTM4OCAwLC0zLjY5OTE2MiA4LjU3ODUzNTMsLTAuMjA2Mjc2NzkgMTMuODcyNzg5LDQuMzA3OTMxNyBaIgogICAgIGZpbGw9ImJsYWNrIgogICAgIGlkPSJwYXRoMSIKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjEyMDA4IiAvPgo8L3N2Zz4K'
  const speechBubbleIcon =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+Cgo8c3ZnCiAgIGZpbGw9IiMwMDAwMDAiCiAgIGhlaWdodD0iODAwcHgiCiAgIHdpZHRoPSI4MDBweCIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iQ2FwYV8xIgogICB2aWV3Qm94PSIwIDAgMzcxLjExNyAzNzEuMTE3IgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICBzb2RpcG9kaTpkb2NuYW1lPSJibGFjay1zcGVlY2gtYnViYmxlLXN2Z3JlcG8tY29tLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4zLjIgKDA5MWUyMGUsIDIwMjMtMTEtMjUsIGN1c3RvbSkiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnMKICAgaWQ9ImRlZnMxIiAvPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgaWQ9Im5hbWVkdmlldzEiCiAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgYm9yZGVyY29sb3I9IiMwMDAwMDAiCiAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgIGlua3NjYXBlOnpvb209IjEuMDE2MjUiCiAgIGlua3NjYXBlOmN4PSI0MDAiCiAgIGlua3NjYXBlOmN5PSI0MDAiCiAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOSIKICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkNhcGFfMSIgLz4KPHBhdGgKICAgZD0iTTMxNi4zMyw2NC41NTZjLTM0Ljk4Mi0yNy42MDctODEuNDI0LTQyLjgxMS0xMzAuNzcyLTQyLjgxMWMtNDkuMzQ4LDAtOTUuNzksMTUuMjA0LTEzMC43NzEsNDIuODExICBDMTkuNDU3LDkyLjQzOCwwLDEyOS42MTUsMCwxNjkuMjM4YzAsMjMuODM1LDcuMzA4LDQ3LjUwOCwyMS4xMzMsNjguNDZjMTIuNzU5LDE5LjMzNSwzMS4wNywzNi40Miw1My4wODgsNDkuNTY0ICBjLTEuMDE2LDcuMTE2LTYuNDg3LDI3Ljk0MS0zNS44ODgsNTIuNzU5Yy0xLjUxMywxLjI3OC0yLjEzLDMuMzI4LTEuNTcyLDUuMjI5YzAuNTU4LDEuOSwyLjE4NSwzLjI5Miw0LjE0OCwzLjU1ICBjMC4xNzgsMC4wMjMsNC40NTQsMC41NzIsMTIuMDUyLDAuNTcyYzIxLjY2NSwwLDY1LjkzOS00LjMwMiwxMjAuMDYzLTMyLjk3M2M0LjE3NywwLjIyMSw4LjM4NywwLjMzMywxMi41MzQsMC4zMzMgIGM0OS4zNDgsMCw5NS43ODktMTUuMjA0LDEzMC43NzItNDIuODExYzM1LjMzLTI3Ljg4Miw1NC43ODctNjUuMDU5LDU0Ljc4Ny0xMDQuNjgzQzM3MS4xMTcsMTI5LjYxNSwzNTEuNjYsOTIuNDM4LDMxNi4zMyw2NC41NTZ6IgogICBpZD0icGF0aDEiCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+Cjwvc3ZnPgo='
  const TwoSpeechBubbleIcon =
    'https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/two-speech-bubbles.svg'
  const ImageIcon =
    'https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/photo-image.svg'
  const HeartPlusIcon =
    'https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/heartplus.svg'
  const HeartBrokenIcon =
    'https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/heartbroken.svg'
  // const arrowURI =
  // "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNS44OTMiIGhlaWdodD0iMTUuODkzIiB2aWV3Qm94PSIwIDAgMTUuODkzIDE1Ljg5MyI+PHBhdGggZD0iTTkuMDIxIDEyLjI5NHYtMi4xMDdsLTYuODM5LS45MDVDMS4zOTggOS4xODQuODQ2IDguNDg2Ljk2MiA3LjcyN2MuMDktLjYxMi42MDMtMS4wOSAxLjIyLTEuMTY0bDYuODM5LS45MDVWMy42YzAtLjU4Ni43MzItLjg2OSAxLjE1Ni0uNDY0bDQuNTc2IDQuMzQ1YS42NDMuNjQzIDAgMCAxIDAgLjkxOGwtNC41NzYgNC4zNmMtLjQyNC40MDQtMS4xNTYuMTEtMS4xNTYtLjQ2NSIgZmlsbD0ibm9uZSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEuNzUiLz48cGF0aCBkPSJNOS4wMjEgMTIuMjk0di0yLjEwN2wtNi44MzktLjkwNUMxLjM5OCA5LjE4NC44NDYgOC40ODYuOTYyIDcuNzI3Yy4wOS0uNjEyLjYwMy0xLjA5IDEuMjItMS4xNjRsNi44MzktLjkwNVYzLjZjMC0uNTg2LjczMi0uODY5IDEuMTU2LS40NjRsNC41NzYgNC4zNDVhLjY0My42NDMgMCAwIDEgMCAuOTE4bC00LjU3NiA0LjM2Yy0uNDI0LjQwNC0xLjE1Ni4xMS0xLjE1Ni0uNDY1IiBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNMCAxNS44OTJWMGgxNS44OTJ2MTUuODkyeiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";

  // Objects
  const agent = new AtpAgent({
    service: 'https://bsky.social'
  })
  type SearchResult = 'no search result yet' | 'found nothing' | object

  // Special Functions
  /** Converts an image/video URL into a readable DataURI
   * @param {string} URL - The URL of the image/video
   */
  async function URLAsDataURI(URL: string) {
    const response = await Scratch.fetch(URL)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /** Converts a DataURI into an Unit8Array
   * @param {any} dataURI - The DataURI of the image/video
   */
  async function convertDataURIToUint8Array(dataURI: string) {
    let URI = dataURI
    if (dataURI.startsWith('http') || dataURI.startsWith('https')) {
      URI = Cast.toString(await URLAsDataURI(dataURI))
    }
    const byteString = atob(URI.split(',')[1])
    const arrayBuffer = new ArrayBuffer(byteString.length)
    const uint8Array = new Uint8Array(arrayBuffer)
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i)
    }
    return uint8Array
  }

  /**
   * Gets The File Size of An Image, to Respect the Upload Limit in BlueSky.
   */
  async function getFileSize(url: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    if (blob.size > 1000000) {
      throw new Error('Error: File size is too big. It must be less than 1MB.')
    }
    console.log(`File size: ${blob.size} bytes`)
  }

  const atUriConversions = {
    postLinkToAtUri: async (postUrl: string) => {
      const url = new URL(postUrl)
      const pathSegments = url.pathname.split('/')
      // Validate URL structure
      if (
        pathSegments.length < 5 ||
        pathSegments[1] !== 'profile' ||
        pathSegments[3] !== 'post'
      ) {
        throw new Error('Invalid Bluesky post URL format.')
      }

      // Extract handle and post ID
      const handle = pathSegments[2]
      const postId = pathSegments[4]

      // Initialize the Bluesky agent

      // Resolve the handle to get the DID
      const handleResolution = await agent.resolveHandle({ handle: handle })
      const did = handleResolution.data.did

      // Construct the AT URI
      const atUri = `at://${did}/app.bsky.feed.post/${postId}`
      return atUri
    },
    handleToAtUri: async (handleUrl: string) => {
      let handle: string = Cast.toString(handleUrl)
      if (!handle.startsWith('@')) {
        if (handle.startsWith("http")){
          const url = new URL(handleUrl)
          const pathSegments = url.pathname.split('/')
          handle = pathSegments[2] 
        }
      } else {
        handle = handle.slice(1)
      }

      // Resolve the handle to get the DID
      const { data } = await agent.resolveHandle({ handle: handle })
      const did = data.did

      // Construct the AT URI
      return `at://${did}/`
    },
    isValidAtUri: (atUri: string) => {
      return Cast.toBoolean(atUriPattern.test(atUri))
    },
    atUritoPostLink: async (postAtUri: string) => {
      const match = postAtUri.match(atPostUriPattern)

      const did = match[1] // Extract the DID
      const postId = match[2]

      const { data } = await agent.resolveHandle({ handle: did })

      const handle = data.handle

      return `https://bsky.app/profile/${handle}/post/${postId}`
    },
    atUritoProfileLink: async (postAtUri: string) => {
      const match = postAtUri.match(atProfileUriPattern)

      const did = match[1] // Extract the DID

      const { data } = await agent.resolveHandle({ handle: did })

      const handle = data.handle

      return `https://bsky.app/profile/${handle}/`
    },
    ExtractDID: (atUri: string) => {
      const match = atUri.match(/(?!at:\/\/)(did:[^\/]+)/); 
      if (!match){
        throw new Error("Error: Invalid at:// URI.")
      }
      return match ? match[0] : null
    }
  }



  // Utility Functions

  /**
   * Logs the user in the API with their BlueSky account credentrials
   */
  async function Login(handle: string, password: string) {
    const response = await agent.login({
      identifier: handle,
      password: password
    })

    console.info(`Logged In as: ${handle}`)
    console.info(response)

    document.dispatchEvent(BskyLoginEvent)
  } // This will also create a session

  /**
   * Logs the user out from the API when their done with it.
   */
  async function Logout() {
    await agent.logout()

    console.info(`Logged Out from API.`)

    document.dispatchEvent(BskyLogoutEvent)
  }

  // Posting, Repling

  /** For posting on BlueSky */
  async function Post(
    post: string,
    useCurrentDate: boolean = true,
    date: string = '16-12-2024',
    embed = {}
  ) {
    try {
      let responseObj

      if (Object.keys(embed).length > 0) {
        responseObj = {
          text: post, // The Text
          embed: embed, // The Image Embed
          createdAt: useCurrentDate
            ? new Date().toISOString() // If the user is using the current date, then this will use the current date.
            : new Date(date).toISOString() // Otherwise, use the date the user assigned to it.
        }
      } else {
        responseObj = {
          text: post, // The Text
          createdAt: useCurrentDate
            ? new Date().toISOString() // If the user is using the current date, then this will use the current date.
            : new Date(date).toISOString() // Otherwise, use the date the user assigned to it.
        }
      }

      const response = await agent.post(responseObj)

      console.info(`Posted:${JSON.stringify(response)}`) // Logs the post info
      if (this.richText) {
        console.info(
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
    date: string = '16-12-2024',
    threadRootPostArg,
    postReplyingToArg,
    embed: object = {}
  ) {
    try {
      const threadRootPost = threadRootPostArg
      const postReplyingTo = postReplyingToArg
      let responseObj

      if (Object.keys(embed).length > 0) {
        responseObj = {
          text: post, // The Text
          embed: embed,
          reply: {
            root: {
              // the reply thread data
              uri: threadRootPost.uri,
              cid: threadRootPost.cid
            },
            parent: {
              // the parent post data
              uri: postReplyingTo.uri,
              cid: postReplyingTo.cid
            }
          }, // The Image Embed
          createdAt: useCurrentDate
            ? new Date().toISOString() // If the user is using the current date, then this will use the current date.
            : new Date(date).toISOString() // Otherwise, use the date the user assigned to it.
        }
      } else {
        responseObj = {
          text: post, // The text (again)
          reply: {
            root: {
              // the reply thread data
              uri: threadRootPost.uri,
              cid: threadRootPost.cid
            },
            parent: {
              // the parent post data
              uri: postReplyingTo.uri,
              cid: postReplyingTo.cid
            }
          },
          createdAt: useCurrentDate
            ? new Date().toISOString()
            : new Date(date).toISOString()
        }
      }

      const response = await agent.post(responseObj)
      console.info(`Posted Reply: ${JSON.stringify(response)}`)
      if (this.richText) {
        console.info(
          `Markdown Version of This Reply: ${ConvertRichTextToMarkdown(new RichText({ text: post }))}`
        )
      }
    } catch (error) {
      console.error(`Error Posting Reply: ${error}`)
    }
  }

  /**
   * Uploads an image or video blob to the BlueSky servers using UploadBlob
   *
   */
  async function Upload(datauri: string, encoding: string = 'image/png') {
    getFileSize(datauri) // Check the File Size of the Image

    const Unit8Array = await convertDataURIToUint8Array(datauri) // Get The Data of The URI

    const blob = await agent.uploadBlob(Unit8Array, {
      encoding: encoding
    })
    console.info(`Uploaded Blob: ${JSON.stringify(blob)}`)
    return blob
  }

  /** Search Posts on BlueSky Using a Search Term */
  async function SearchPosts(searchTerm: string) {
    const response = await agent.app.bsky.feed.searchPosts({ q: searchTerm })
    return response
  }

  /**Blocks an User on BlueSky using it's DID */
  async function BlockUser(
    blockingUserDid: string,
    useCurrentDate: boolean,
    date: string
  ) {
    const data = await agent.app.bsky.graph.block.create(
      { repo: agent.session.did },
      {
        subject: blockingUserDid,
        createdAt: useCurrentDate
          ? new Date().toISOString()
          : new Date(date).toISOString()
      }
    )

    console.info(`Blocked User With at:// URI: ${data.uri}`)
    console.info(data)
    return data
  }

  /**Blocks an User on BlueSky using it's DID */
  async function UnblockUser(blockedUserAtUri: string) {
    const { rkey } = new AtUri(blockedUserAtUri)

    await agent.app.bsky.graph.block.delete({
      repo: agent.session.did,
      rkey
    })
    console.info(`Unblocked User With at:// URI: ${blockedUserAtUri}`)
  }

  /**
   * Convetrs BlueSky's rich text to Markdown
   *
   */
  function ConvertRichTextToMarkdown(rt: RichText) {
    // Converts rich text to Markdown
    let markdown = ''
    for (const segment of rt.segments()) {
      if (segment.isLink()) {
        markdown += `[${segment.text}](${segment.link?.uri})`
      } else if (segment.isMention()) {
        markdown += `[${segment.text}](https://bsky.app/profile/${segment.mention?.did})`
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
    cursor: string
    limit: number
    sepCursorLimit: boolean

    sessionDID: string | null
    searchResult: SearchResult
    lastBlockedUserURI: string | null

    showExtras: boolean

    constructor(runtime: VM.Runtime) {
      this.runtime = runtime

      this.useCurrentDate = true
      this.date = new Date().toISOString()
      this.richText = true
      this.cursor = null
      this.limit = null
      this.sepCursorLimit = true

      this.searchResult = 'no search result yet'
      this.sessionDID = null
      this.lastBlockedUserURI = null

      this.showExtras = false
    }
    //@ts-ignore
    getInfo() {
      return {
        id: 'HamBskyAPI',
        name: 'Bluesky API',
        color1: '#0484fc',
        color2: '#0970D1',
        menuIconURI: bskyIcon,
        blockIconURI: bskyIcon,
        docsURI: 'https://docs.bsky.app/', // I Don't Want to Make a Long Documentation about The Extension, So Have The Official BlueSky Docs for Now.
        blocks: [
          {
            blockType: Scratch.BlockType.BUTTON,
            func: 'bskyDisclaimer',
            text: 'Disclaimer (Please Read)'
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyLogin',
            text: 'login to bluesky API with handle: [HANDLE] and password: [PASSWORD]',
            arguments: {
              HANDLE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '@example.bsky.social'
              },
              PASSWORD: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'example'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyLogout',
            text: 'logout from bluesky API'
          },
          '---',
          {
            blockType: Scratch.BlockType.BOOLEAN,
            opcode: 'bskyLoggedIn',
            text: 'logged in to bluesky api?'
          },
          '---',
          {
            blockType: Scratch.BlockType.EVENT,
            opcode: 'bskyWhenLoggedIn',
            text: 'when logged in to bluesky',
            isEdgeActivated: false,
            shouldRestartExistingThreads: true
          },
          {
            blockType: Scratch.BlockType.EVENT,
            opcode: 'bskyWhenLoggedOut',
            text: 'when logged out from bluesky',
            isEdgeActivated: false,
            shouldRestartExistingThreads: true
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Creating Posts'
          },

          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyPost',
            text: 'post [POST_ICON][POST] to bluesky with embed: [EMBED]',
            arguments: {
              POST_ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: speechBubbleIcon
              },
              POST: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello!'
              },
              EMBED: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyReply',
            text: 'reply [POST_ICON][REPLY] to post with info:[INFO] embed: [EMBED]',
            arguments: {
              POST_ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: speechBubbleIcon
              },
              REPLY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'hello!'
              },
              INFO: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'use block below'
              },
              EMBED: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyReplyReporter',
            text: 'parent post uri: [POST_URI] and cid: [POST_CID] with reply uri: [URI] and reply cid: [CID]',
            arguments: {
              POST_URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g'
              },
              POST_CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g'
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g'
              },
              CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'bafyreig2fjxi3rptqdgylg7e5hmjl6mcke7rn2b6cugzlqq3i4zu6rq52q'
              }
            }
          },
          '---',
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyRepost',
            text: 'repost post with uri [URI] and cid [CID]',
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g'
              },
              CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'bafyreig2fjxi3rptqdgylg7e5hmjl6mcke7rn2b6cugzlqq3i4zu6rq52q'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyUnRepost',
            text: 'remove post repost with uri [URI]',
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g'
              }
            }
          },
          '---',
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskySetCurrentDate',
            text: 'set date to [DATE]',
            hideFromPalette: this.useCurrentDate,
            arguments: {
              DATE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: new Date().toISOString()
              }
            }
          },
          '---',
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyUploadBlob',
            text: 'upload image/video blob [DATAURI] with content-type [ENCODING]',
            blockIconURI: ImageIcon,
            outputShape: 3,
            arguments: {
              DATAURI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABrElEQVRIS+2VvUoDQRSGv+VQKQmKQj'
              },
              ENCODING: {
                type: Scratch.ArgumentType.STRING,
                menu: 'bskyENCODING'
              }
            }
          },

          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyImgEmbed',
            text: 'new  image embed with images [IMAGES]',
            blockIconURI: ImageIcon,
            arguments: {
              IMAGES: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  '["array", "use image embed reporter and/or an JSON extension"]'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyImgEmbedReporter',
            text: 'image embed with image [IMAGE] alt text [TEXT] width [WIDTH] and height [HEIGHT]',
            blockIconURI: ImageIcon,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'use upload blob reporter'
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'this is the description of an embed'
              },
              WIDTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1000
              },
              HEIGHT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 500
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyWebCardEmbed',
            text: 'new  website card embed with image [IMAGE] title [TITLE] description [DESCRIPTION] and link [LINK]',
            blockIconURI: ImageIcon,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'image blob'
              },
              TITLE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'title'
              },
              DESCRIPTION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'this is the description of an embed'
              },
              LINK: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://example.com'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyQuotePost',
            text: 'new quote post embed with uri [URI] and cid [CID] record',
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g'
              },
              CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'bafyreig2fjxi3rptqdgylg7e5hmjl6mcke7rn2b6cugzlqq3i4zu6rq52q'
              }
            }
          },
          '---',
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Viewing Feeds'
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetTimeline',
            text: 'get my timeline [IMAGE] with cursor [CURSOR] and limit [LIMIT]',
            hideFromPalette: this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetTimelineSep',
            text: 'get my timeline [IMAGE]',
            outputShape: 3,
            hideFromPalette: !this.sepCursorLimit,
            disableMonitor: true,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetFeed',
            text: 'get feed [IMAGE] at [URI] with cursor [CURSOR] and limit [LIMIT]',
            hideFromPalette: this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetFeedSep',
            text: 'get feed [IMAGE] at [URI]',
            hideFromPalette: !this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetFeedGenerator',
            text: 'get feed generator [IMAGE] at [URI]',
            outputShape: 3,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetAuthorFeedSep',
            text: "get the author [URI]'s feed with filter [FILTER]",
            hideFromPalette: !this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'did:plc:z72i7hdynmk6r22z27h6tvur'
              },
              FILTER: {
                type: Scratch.ArgumentType.STRING,
                menu: 'bskyAUTHOR_FEED_FILTERS'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetAuthorFeed',
            text: "get the author [URI]'s feed with filter [FILTER] cursor [CURSOR] and limit [LIMIT]",
            hideFromPalette: this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'did:plc:z72i7hdynmk6r22z27h6tvur'
              },
              FILTER: {
                type: Scratch.ArgumentType.STRING,
                menu: 'bskyAUTHOR_FEED_FILTERS'
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 50
              }
            }
          },
          '---',
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskySetCursor',
            text: 'set feed cursor to [CURSOR]',
            hideFromPalette: !this.sepCursorLimit,
            arguments: {
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskySetLimit',
            text: 'set feed searching limit to [LIMIT]',
            hideFromPalette: !this.sepCursorLimit,
            arguments: {
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 50
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyResetCursorLimit',
            text: 'reset cursor and limit',
            hideFromPalette: !this.sepCursorLimit
          },
          '---',
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetPostThread',
            text: 'get post thread at [URI] with depth [DEPTH] and parent height [HEIGHT]',
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              },
              DEPTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 6
              },
              HEIGHT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 80
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyGetPost',
            text: 'get post at [URI]',
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Liking and Following'
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyLike',
            text: '[ICON] like post at [URI] and cid [CID]',
            arguments: {
              ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: HeartPlusIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              },
              CID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'bafyreig2fjxi3rptqdgylg7e5hmjl6mcke7rn2b6cugzlqq3i4zu6rq52q'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyUnLike',
            text: '[ICON] remove like from post at [URI]',
            arguments: {
              ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: HeartBrokenIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyFollow',
            text: 'follow user with DID/handle: [DID]',
            arguments: {
              DID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyUnFollow',
            text: 'unfollow user with follow at:// uri record: [URI]',
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Viewing Profiles'
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyViewProfile',
            text: 'get profile at [URI]',
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://...'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyViewProfiles',
            text: 'get profiles at [URIS]',
            outputShape: 3,
            arguments: {
              URIS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "['did:plc:...', '...']"
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Editing Your Profile'
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyEditProfile',
            text: 'edit profile with new display name [DISPLAY_NAME] description [DESCRIPTION] and (optional) new [PROFILE_IMAGE_TYPE] image [IMAGE]',
            arguments: {
              DISPLAY_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'new display name'
              },
              DESCRIPTION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my description'
              },
              PROFILE_IMAGE_TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'bskyPROFILE_IMAGE_TYPE'
              },
              IMAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'use upload blob reporter'
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Blocking and Muting'
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyBlockUser',
            text: 'block user with DID [DID]',
            arguments: {
              DID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'ihateu.bsky.social'
              }
            }
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyLastBlockedUser',
            text: 'last blocked user DID',
            outputShape: 3
          },
          "---",
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyUnblockUser',
            text: 'unblock user with block at:// uri record [URI]',
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: 'Extras'
          },

          {
            blockType: Scratch.BlockType.BUTTON,
            func: 'bskyShowExtras',
            text: 'Show Extras',
            hideFromPalette: this.showExtras
          },
          {
            blockType: Scratch.BlockType.BUTTON,
            func: 'bskyHideExtras',
            text: 'Hide Extras',
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskySearchPosts',
            text: 'search posts/profiles with search term [TERM]',
            hideFromPalette: !this.showExtras,
            arguments: {
              TERM: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'i love pizza'
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskySearchResult',
            text: 'search result',
            hideFromPalette: !this.showExtras,
            disableMonitor: false
          },
          '---',
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyProfileLinkToAtUri',
            text: 'convert profile link/handle [URL] to at:// uri',
            outputShape: 3,
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'https://bsky.app/profile/example.bsky.social/'
              }
            },
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyPostLinkToAtUri',
            text: 'convert post link [URL] to at:// uri',
            outputShape: 3,
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'https://bsky.app/profile/example.bsky.social/post/3lez77bnyhs2w'
              }
            },
            hideFromPalette: !this.showExtras
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyAtUriToPostLink',
            text: 'convert at:// uri [URL] to post link',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  'at://did:plc:6loexbxe5rv4knai6j57obtn/app.bsky.feed.post/3lez77bnyhs2w',

              }
            },
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyAtUriToProfileLink',
            text: 'convert at:// uri [URL] to profile link',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://did:plc:6loexbxe5rv4knai6j57obtn',

              }
            },
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: 'bskyExtractDID',
            text: 'extract DID from at:// uri [URL]',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://did:plc:6loexbxe5rv4knai6j57obtn',

              }
            },
            hideFromPalette: !this.showExtras
          },
          "---",
          {
            blockType: Scratch.BlockType.BOOLEAN,
            opcode: 'bskyIsAtUri',
            text: 'is [URL] a valid at:// uri? ',
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'at://did:plc:6loexbxe5rv4knai6j57obtn',
              }
            },
            hideFromPalette: !this.showExtras
          },

          '---',
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: 'bskyOptions',
            text: 'set [OPTION] to [ONOFF]',
            hideFromPalette: !this.showExtras,
            arguments: {
              OPTION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'bskyOPTIONS'
              },
              ONOFF: {
                type: Scratch.ArgumentType.STRING,
                menu: 'bskyONOFF'
              }
            }
          }
        ],
        menus: {
          bskyOPTIONS: {
            acceptReporters: true,
            items: [
              { text: 'rich text', value: 'richText' },
              { text: 'use current date', value: 'useCurrentDate' },
              {
                text: 'cursor and limit as seperate blocks',
                value: 'sepCursorLimit'
              }
            ]
          },
          bskyONOFF: {
            acceptReporters: false,
            items: [
              { text: 'on', value: 'true' },
              { text: 'off', value: 'false' }
            ]
          },

          bskyENCODING: {
            acceptReporters: true,
            items: [
              { text: 'png', value: 'image/png' },
              { text: 'jpg', value: 'image/jpeg' },
              { text: 'gif', value: 'image/gif' },
              { text: 'webp', value: 'image/webp' },
              { text: 'svg', value: 'image/svg+xml' },
              { text: 'tiff', value: 'image/tiff' },
              { text: 'bmp', value: 'image/bmp' }
            ]
          },
          bskyAUTHOR_FEED_FILTERS: {
            acceptReporters: true,
            items: [
              { text: 'posts and replies', value: 'posts_with_replies' },
              { text: 'posts only', value: 'posts_no_replies' },
              { text: 'posts with media', value: 'posts_with_media' },
              {
                text: 'posts and author threads',
                value: 'posts_and_author_threads'
              }
            ]
          },
          bskyPROFILE_IMAGE_TYPE: {
            acceptReporters: true,
            items: ['avatar', 'banner']
          }
        }
      }
    }

    /* ---- BUTTONS----*/
    bskyDisclaimer() {
      alert(
        `DISCLAIMER:
          When using the "Login" block, NEVER use your REAL password. Always use an app password instead.

          Rules to Follow:
          1. Follow BlueSky's Terms of Service: https://bsky.social/about/support/tos
          2. Avoid Copyright Infringements: https://bsky.social/about/support/copyright
          3. Respect Community Guidelines: https://bsky.social/about/support/community-guidelines
          4. Do Not Use This Extension for Malicious Purposes, such as Spam Bots, Scams, or Hacking other Accounts.
          
          Note: This Extension Doesn't Work on Turbowarp Desktop and Electron Projects.`
      )
    }
    bskyShowExtras() {
      this.showExtras = !this.showExtras
      vm.extensionManager.refreshBlocks()
    }
    bskyHideExtras() {
      this.showExtras = !this.showExtras
      vm.extensionManager.refreshBlocks()
    }
    /* ---- BUTTONS----*/

    async bskyLogin(args): Promise<void> {
      await Login(args.HANDLE, args.PASSWORD)

      this.sessionDID = agent.session.did
    }
    async bskyLogout(): Promise<void> {
      await Logout()

      this.sessionDID = null
    }
    bskyLoggedIn() {
      return this.sessionDID !== null
    }
    async bskyPost(args): Promise<void> {
      if (!this.richText) {
        const rt = new RichText({ text: args.POST })

        await rt.detectFacets(agent)

        if (rt.facets && rt.facets.length > 0) {
          throw new Error("Error: You Can't Use Rich Text If It's Disabled.")
        }
        if (args.EMBED) {
          const embed = JSON.parse(args.EMBED)
          await Post(args.POST, this.useCurrentDate, this.date, embed)
        } else {
          await Post(args.POST, this.useCurrentDate, this.date)
        }
      } else {
        if (args.EMBED) {
          const embed = JSON.parse(args.EMBED)
          await Post(args.POST, this.useCurrentDate, this.date, embed)
        } else {
          await Post(args.POST, this.useCurrentDate, this.date)
        }
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
        if (args.EMBED) {
          const embed = JSON.parse(args.EMBED)
          await Reply(
            args.REPLY,
            this.useCurrentDate,
            this.date,
            replyData.threadRootPost,
            replyData.postReplyingto,
            embed
          )
        } else {
          await Reply(
            args.REPLY,
            this.useCurrentDate,
            this.date,
            replyData.threadRootPost,
            replyData.postReplyingto
          )
        }
      } else {
        if (args.EMBED) {
          const embed = JSON.parse(args.EMBED)
          await Reply(
            args.REPLY,
            this.useCurrentDate,
            this.date,
            replyData.threadRootPost,
            replyData.postReplyingto,
            embed
          )
        } else {
          await Reply(
            args.REPLY,
            this.useCurrentDate,
            this.date,
            replyData.threadRootPost,
            replyData.postReplyingto
          )
        }
      }
    }
    bskySetCurrentDate(args) {
      this.date = args.DATE
    }
    async bskyUploadBlob(args) {
      try {
        const blob = await Upload(args.DATAURI, args.ENCODING)
        console.log(blob)

        return JSON.stringify(blob)
      } catch (error) {
        throw new Error(`Error Uploading Blob: ${error}`)
      }
    }
    bskyWebCardEmbed(args) {
      const { data } = JSON.parse(args.IMAGE)
      return JSON.stringify({
        $type: 'app.bsky.embed.external',
        external: {
          uri: args.LINK,
          title: args.TITLE,
          description: args.DESCRIPTION,
          thumb: data.blob
        }
      })
    }
    bskyImgEmbed(args) {
      return JSON.stringify({
        $type: 'app.bsky.embed.images',
        images: Array.isArray(args.IMAGES)
          ? JSON.parse(args.IMAGES)
          : [JSON.parse(args.IMAGES)]
      })
    }

    bskyImgEmbedReporter(args) {
      // Use this reporter for the embed block above.
      const { data } = JSON.parse(args.IMAGE)
      return JSON.stringify({
        alt: args.TEXT, // the alt text
        image: data.blob,
        aspectRatio: {
          // a hint to clients
          width: args.WIDTH,
          height: args.HEIGHT
        }
      })
    }
    bskyQuotePost(args) {
      return JSON.stringify({
        $type: 'app.bsky.embed.record',
        record: {
          uri: args.URI,
          cid: args.CID
        }
      })
    }
    bskyReplyReporter(args): string {
      // Use this reporter for the reply block.
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

    // Viewing Feeds
    async bskyGetTimeline(args) {
      const { data } = await agent.getTimeline({
        cursor: args.CURSOR,
        limit: args.LIMIT
      })

      return JSON.stringify(data)
    }
    async bskyGetTimelineSep() {
      const { data } = await agent.getTimeline({
        cursor: this.cursor ?? '',
        limit: this.limit ?? 50
      })

      return JSON.stringify(data)
    }

    // Getting a Feed
    async bskyGetFeed(args) {
      const { data } = await agent.app.bsky.feed.getFeed({
        feed: args.URI,
        cursor: args.CURSOR,
        limit: args.LIMIT
      })

      return JSON.stringify(data)
    }
    async bskyGetFeedSep(args) {
      const { data } = await agent.app.bsky.feed.getFeed({
        feed: args.URI,
        cursor: this.cursor ?? '',
        limit: this.limit ?? 50
      })

      return JSON.stringify(data)
    }

    // Getting a Feed Generator
    async bskyGetFeedGenerator(args) {
      const { data } = await agent.app.bsky.feed.getFeedGenerator({
        feed: args.URI
      })

      return JSON.stringify(data)
    }

    // Getting an User's Posts
    async bskyGetAuthorFeed(args) {
      const { data } = await agent.getAuthorFeed({
        actor: args.URI,
        filter: args.FILTER,
        cursor: args.CURSOR,
        limit: args.LIMIT ?? 50
      })

      return JSON.stringify(data)
    }
    async bskyGetAuthorFeedSep(args) {
      const { data } = await agent.getAuthorFeed({
        actor: args.URI,
        filter: args.FILTER,
        cursor: this.cursor ?? '',
        limit: this.limit ?? 50
      })

      return JSON.stringify(data)
    }
    bskySetCursor(args) {
      this.cursor = args.CURSOR
    }
    bskySetLimit(args) {
      this.limit = args.LIMIT
    }

    bskyResetCursorLimit() {
      this.cursor = null
      this.limit = null
    }

    async bskyGetPostThread(args) {
      const res = await agent.getPostThread({
        uri: args.URI,
        depth: args.DEPTH,
        parentHeight: args.HEIGHT
      })

      const { thread } = res.data

      return JSON.stringify(thread)
    }
    async bskyGetPost(args) {
      const res = await agent.getPostThread({
        uri: args.URI,
        depth: args.DEPTH,
        parentHeight: 1
      })
      const { thread } = res.data

      return JSON.stringify(thread)
    }

    async bskyLike(args) {
      const res = await agent.like(args.URI, args.CID)

      console.info(`Liked Post: ${JSON.stringify(res)}`)
    }
    async bskyRepost(args) {
      const uri = await agent.repost(args.URI, args.CID)

      console.info(`Reposted Post: ${JSON.stringify(uri)}`)
    }
    async bskyFollow(args) {
      const { uri } = await agent.follow(args.DID)

      console.info(`Followed User: ${JSON.stringify(uri)}`)
    }

    async bskyUnLike(args) {
      const res = await agent.deleteLike(args.URI)

      console.info(`UnLiked Post: ${JSON.stringify(res)}`)
    }

    async bskyUnRepost(args) {
      const uri = await agent.deleteRepost(args.URI)

      console.info(`Unreposted Post: ${JSON.stringify(uri)}`)
    }

    async bskyUnFollow(args) {
      const response = await agent.follow(args.DID)

      console.info(`Unfollowed User: ${JSON.stringify(response)}`)
    }

    async bskyViewProfile(args) {
      const { data } = await agent.getProfile({ actor: args.URI })

      return JSON.stringify(data)
    }
    async bskyViewProfiles(args) {
      const { data } = await agent.getProfiles({ actors: JSON.parse(args.URI) })

      return JSON.stringify(data)
    }

    async bskyBlockUser(args) {
      const { uri } = await BlockUser(args.DID, this.useCurrentDate, this.date)
      this.lastBlockedUserURI = Cast.toString(uri)
    }
    bskyLastBlockedUser(){
      return this.lastBlockedUserURI ?? "no data found"
    }
    async bskyUnblockUser(args) {
      await UnblockUser(args.URI)
    }

    async bskySearchPosts(args) {
      const response = await SearchPosts(args.TERM)
      const posts: PostView[] = response.data.posts
      this.searchResult =
        posts.length === 0
          ? { posts: response.data.posts, headers: response.headers }
          : 'found nothing'
    }
    bskySearchResult() {
      return (typeof this.searchResult === 'object' && !Array.isArray(this.searchResult)) ? JSON.stringify(this.searchResult) :this.searchResult
    }

    async bskyPostLinkToAtUri(args): Promise<string> {
      return await atUriConversions.postLinkToAtUri(args.URL)
    }
    async bskyProfileLinkToAtUri(args): Promise<string> {
      return await atUriConversions.handleToAtUri(args.URL)
    }
    async bskyAtUriToPostLink(args): Promise<string> {
      return await atUriConversions.atUritoPostLink(args.URL)
    }
    async bskyAtUriToProfileLink(args): Promise<string> {
      return await atUriConversions.atUritoProfileLink(args.URL)
    }
    bskyIsAtUri(args): boolean {
      return Cast.toBoolean(atUriConversions.isValidAtUri(args.URL))
    }
    bskyExtractDID(args): string{
      return Cast.toString(atUriConversions.ExtractDID(args.URL))
    }

    bskyOptions(args) {
      switch (args.OPTION) {
        case 'richText':
          this.richText = Cast.toBoolean(args.ONOFF)
          break
        case 'useCurrentDate':
          this.useCurrentDate = Cast.toBoolean(args.ONOFF)
          vm.extensionManager.refreshBlocks()
          break
        case 'sepCursorLimit':
          this.sepCursorLimit = Cast.toBoolean(args.ONOFF)
          vm.extensionManager.refreshBlocks()
          break
        default:
          throw new Error("Error: This option doesn't exist. at all")
      }
    }
  }
  document.addEventListener('bskyLogin', () => {
    runtime.startHats('HamBskyAPI_bskyWhenLoggedIn')
  })
  document.addEventListener('bskyLogout', () => {
    runtime.startHats('HamBskyAPI_bskyWhenLoggedOut')
  })

  // The following snippet ensures compatibility with Turbowarp / Gandi IDE.
  if (vm?.runtime) {
    // For Turbowarp

    //@ts-ignore
    Scratch.extensions.register(new HamBskyAPI(Scratch.runtime))
  } else {
    // For Gandi
    window.tempExt = {
      //@ts-ignore
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
          'newExtension.name': 'BlueSky API',
          'newExtension.description': 'Interact with the BlueSky API!'
        },
        fr: {
          'newExtension.name': 'API BlueSky',
          'newExtension.description': "Interagis avec L'API BlueSky!"
        }
      }
    }
  }
})(Scratch)

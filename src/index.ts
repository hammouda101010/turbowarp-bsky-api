// Required Modules
import { AtpAgent } from "@atproto/api"
import { RichText } from "@atproto/api"
import { AtUri } from "@atproto/api"
;(function (Scratch) {
  if (Scratch.extensions.unsandboxed === false) {
    throw new Error("TurboButterfly Extension Must Be Run Unsandboxed.")
  }
  // The extension"s code

  // Scratch's Stuff
  const vm = Scratch.vm
  const runtime = vm.runtime
  const Cast = Scratch.Cast

  // Patch

  //@ts-expect-error included in runtime
  const ogConverter = runtime._convertBlockForScratchBlocks.bind(runtime)
  //@ts-expect-error included in runtime
  runtime._convertBlockForScratchBlocks = function (blockInfo, categoryInfo) {
    const res = ogConverter(blockInfo, categoryInfo)
    if (blockInfo.outputShape) res.json.outputShape = blockInfo.outputShape
    return res
  }

  // Events
  const BskyLoginEvent = new CustomEvent("bskyLogin")
  const BskyLogoutEvent = new CustomEvent("bskyLogout")

  // Regexes
  const atUriPattern = /^at:\/\/(did:plc:[a-z0-9]+)\/?(.+)?$/
  const atPostUriPattern =
    /^at:\/\/(did:plc:[a-z0-9]+)\/app\.bsky\.feed\.post\/([a-z0-9]+)$/

  // Icons
  const bskyIcon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjEyOCIKICAgaGVpZ2h0PSIxMjgiCiAgIHZpZXdCb3g9IjAgMCAxMjggMTI4IgogICBmaWxsPSJub25lIgogICB2ZXJzaW9uPSIxLjEiCiAgIGlkPSJzdmcxIgogICBzb2RpcG9kaTpkb2NuYW1lPSJ0dXJib2J1dHRlcmZseS1pY29uLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4zLjIgKDA5MWUyMGUsIDIwMjMtMTEtMjUsIGN1c3RvbSkiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnMKICAgICBpZD0iZGVmczEiIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlkPSJuYW1lZHZpZXcxIgogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgICBib3JkZXJjb2xvcj0iIzAwMDAwMCIKICAgICBib3JkZXJvcGFjaXR5PSIwLjI1IgogICAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwLjAiCiAgICAgaW5rc2NhcGU6cGFnZWNoZWNrZXJib2FyZD0iMCIKICAgICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgICAgaW5rc2NhcGU6em9vbT0iMi4yOTQ5MjE0IgogICAgIGlua3NjYXBlOmN4PSIxMDAuNDM5MTciCiAgICAgaW5rc2NhcGU6Y3k9IjkyLjE2MDAxOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii04IgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ic3ZnMSIgLz48cGF0aAogICAgIGQ9Ik0gMjkuMTI2OTk3LDIxLjMyMjY2IEMgNDMuMzgwMjIyLDMyLjAyMzI4IDU4LjcxMDMyNCw1My43MjAxNDEgNjQuMzM5NjA2LDY1LjM2MjYxMiA2OS45Njg4ODQsNTMuNzIwMTQxIDg1LjI5ODk4NiwzMi4wMjMyOCA5OS41NTIyMTEsMjEuMzIyNjYgMTA5LjgzNjU1LDEzLjYwMTY4MyAxMjYuNTAwNDgsNy42Mjc1NDU1IDEyNi41MDA0OCwyNi42Mzc1NjggYyAwLDMuNzk2NDU1IC0yLjE3NjcyLDMxLjg5MzAzOSAtMy40NTM0MiwzNi40NTQ4NjEgLTQuNDM3NzMsMTUuODU4MjQ5IC0yMC42MDgzMSwxOS45MDMwODEgLTM0Ljk5Mjg2MSwxNy40NTQ5NDkgMjUuMTQzNDIxLDQuMjc5MjQ5IDMxLjUzOTQyMSwxOC40NTM2ODMgMTcuNzI1OTExLDMyLjYyODEwMiAtMjYuMjM0NTEsMjYuOTIwMDUgLTM3LjcwNjI1NCwtNi43NTQzIC00MC42NDU3NjcsLTE1LjM4MjgzNCAtMC41Mzg4NzEsLTEuNTgxODE5IC0wLjc5MTAxOCwtMi4zMjE4NDEgLTAuNzk0NzM3LC0xLjY5MjU3MSAtMC4wMDM3LC0wLjYyOTI3IC0wLjI1NTg2OSwwLjExMDc1MiAtMC43OTQ3NDMsMS42OTI1NzEgQyA2MC42MDUzNTMsMTA2LjQyMTE4IDQ5LjEzMzYwNiwxNDAuMDk1NTMgMjIuODk5MDI1LDExMy4xNzU0OCA5LjA4NTQ5ODksOTkuMDAxMDYxIDE1LjQ4MTU0Niw4NC44MjY2MjcgNDAuNjI1MDEsODAuNTQ3Mzc4IDI2LjI0MDQ1NSw4Mi45OTU1MSAxMC4wNjk5ODIsNzguOTUwNjc4IDUuNjMyMTExMiw2My4wOTI0MjkgNC4zNTU1MDI5LDU4LjUzMDYwNyAyLjE3ODcyMzQsMzAuNDM0MDIzIDIuMTc4NzIzNCwyNi42Mzc1NjggYyAwLC0xOS4wMTAwMjI1IDE2LjY2NDA0MDYsLTEzLjAzNTg4NSAyNi45NDgyNzM2LC01LjMxNDkwOCB6IgogICAgIGZpbGw9IiMwMDAwMDAiCiAgICAgaWQ9InBhdGgxIgogICAgIHN0eWxlPSJmaWxsOiNmZGZkZmQ7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOjAuMjE4ODc1IiAvPjxnCiAgICAgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIgogICAgIGlkPSJnMiIKICAgICB0cmFuc2Zvcm09Im1hdHJpeCgxLjAyODg0NjUsMCwwLDEuMDI4ODQ2NSwtMTgyLjI5MDQ1LC0xMTQuMjgxODEpIj48cGF0aAogICAgICAgZD0ibSAyNzQuOTksMTU4Ljg4MSBjIC0wLjA0LDAuMTcgLTAuMDcsMC4zNCAtMC4xMiwwLjUxIC0wLjE1LDAuNjMgLTAuNDYsMi4xMiAtMC43Nyw1LjAzIDAsMC4wNSAwLDAuMDkgLTAuMDEsMC4xMiAxLjcxLDYuODggLTEuMTcsMTEuMDcgLTMuMDgsMTIuOTggLTAuMTIsMC4xMyAtMC4yNSwwLjI1IC0wLjM5LDAuMzcgLTEuODcsMS43IC01LjE0LDMuNzMgLTEwLjAyLDMuNzMgLTIuNDMsMCAtNC43LC0wLjU0IC02LjY4LC0xLjUzIDAuMDUsMi43MyAwLjA4LDYuNDkgMC4wOCwxMS43MSAxLjgsMC42MyAzLjQ1LDEuNjUgNC44NSwyLjk5IDIuNzgsMi42NyA0LjMsNi4yNCA0LjMsMTAuMDUgMCw1LjY2IC0zLjI2LDEwLjU4IC04LjUxLDEyLjgzIC0wLjEzLDAuMDYgLTAuMjcsMC4xMiAtMC40LDAuMTcgLTEuNzYsMC42NyAtMy43NCwxIC02LjA2LDEgLTAuODQsMCAtMS43NCwtMC4wNCAtMi43MiwtMC4xMyAtMC42LC0wLjAzIC0xLjQ4LC0wLjAyIC0yLjUyLDAuMDEgLTEuODksMC4yMSAtNC41NSwwLjQyIC04LjExLDAuNjIgLTAuMDcsMCAtMC4xNCwwLjAxIC0wLjIyLDAuMDEgLTAuNDcsMC4wMiAtMC45MiwwLjAzIC0xLjM2LDAuMDMgLTYuMzcsMCAtMTEuMDIsLTIuMDIgLTEzLjgzLC01Ljk5IC0wLjA2LC0wLjA4IC0wLjExLC0wLjE2IC0wLjE2LC0wLjI0IC0yLjg2LC00LjI3IC0yLjk0LC05LjY3IC0wLjIyLC0xNC4wOCAwLjAyLC0wLjA1IDAuMDUsLTAuMDkgMC4wOCwtMC4xNCAxLjczLC0yLjcyIDQuMjYsLTQuNjYgNy41NCwtNS44IDAuMDQsLTEuOTMgMC4wMywtNC4zNSAtMC4wMywtNy4yMiAtMS42MywwLjY4IC0zLjUxLDEuMDggLTUuNjIsMS4wOCAtNS41NywwIC0xMC4xNywtMy4zMSAtMTEuNzcsLTguMzQgLTAuMzMsLTEuMDIgLTAuNjQsLTIuNTEgLTEuMzYsLTUuODcgLTAuMDMsLTAuMTIgLTAuMDUsLTAuMjQgLTAuMDcsLTAuMzYgbCAtMS40OCwtOC4yNyBjIC0wLjA1LC0wLjE4IC0wLjEyLC0wLjM5IC0wLjIsLTAuNjMgLTAuNzcsLTIuMTkgLTEuMTMsLTQuMDUgLTEuMTMsLTUuODUgMCwtMi4yMyAwLjY1LC01LjYgMy43MywtOC45NiAxLjU1LC0xLjcgNC4zNywtMy45IDguOTEsLTQuNjEgMC41NiwtMC4wOSAxLjEzLC0wLjE0IDEuNywtMC4xNCBoIDExLjA2IGMgMC4yNSwwIDAuNSwwLjAxIDAuNzUsMC4wMyA0LjIyLDAuMTUgOCwwLjE0IDExLjI0LC0wLjAxIDQuNTMsLTAuMiA5LjA1LC0wLjU5IDEzLjQ4LC0xLjE2IDAuNSwtMC4xNiAxLjA0LC0wLjMyIDEuNjIsLTAuNDYgMC41NSwtMC4xNCAxLjExLC0wLjIzIDEuNjcsLTAuMjkgNC4yNiwtMC4zOSA4LjIzLDAuODQgMTEuMzIsMy40OCAzLjgzLDMuMjkgNS41Miw4LjI3IDQuNTEsMTMuMzMgeiIKICAgICAgIGZpbGw9IiMxMTg1ZmUiCiAgICAgICBzdHJva2U9Im5vbmUiCiAgICAgICBzdHJva2Utd2lkdGg9IjEiCiAgICAgICBpZD0icGF0aDEtOSIKICAgICAgIHN0eWxlPSJmaWxsOiMxMTg1ZmU7ZmlsbC1vcGFjaXR5OjEiIC8+PHBhdGgKICAgICAgIGQ9Im0gMjY0LjIwMiwxNTYuNzI1IGMgLTAuNDEsMS42NDMgLTAuNzYyLDMuODcgLTEuMDU1LDYuNjg1IC0wLjExOSwxLjQwOCAtMC4wNjEsMi41NTEgMC4xNzYsMy40MzEgMC40MDgsMS40NjcgMC4zODEsMi40MzUgLTAuMDg4LDIuOTAzIC0wLjY0NiwwLjU4NiAtMS41MjUsMC44NzkgLTIuNjM5LDAuODc5IC0xLjI5MSwwIC0yLjE0MywtMC4zODMgLTIuNTUxLC0xLjE1MSAtMC4wNjEsLTIuMzYyIC0wLjAzMSwtNC41NzggMC4wODgsLTYuNjQ2IDAuMTE1LC0yLjU0IDAuMTc2LC0zLjg2OSAwLjE3NiwtMy45ODcgLTAuMDYxLDAgLTAuMTQ4LC0wLjA1OSAtMC4yNjQsLTAuMTc4IC01LjQ1NSwwLjIzNyAtMTAuNTg2LDAuNTg5IC0xNS4zOTQsMS4wNTkgLTAuMTE4LDAuNTg5IC0wLjExOCwxLjUyOCAwLDIuODIgMC4yMzMsMS44MjIgMC4zNTIsMi44OCAwLjM1MiwzLjE3MiAtMC4yMzQsMS44MjIgLTAuMzUyLDQuNTI0IC0wLjM1Miw4LjEwOSAwLjIzMywxLjUyOCAwLjM1Miw4LjA4IDAuMzUyLDE5LjY1NSB2IDYuNDM1IGMgMCwwLjk5OSAwLjE0NSwxLjcwNCAwLjQzNiwyLjExNSBoIDUuNDAxIGMgMC45ODcsLTAuMTE3IDEuNzg1LDAuMTE4IDIuMzk2LDAuNzA0IDAuNjA5LDAuNTg3IDAuOTE0LDEuMjkgMC45MTQsMi4xMSAwLDEuMjg5IC0wLjYxNSwyLjE5OSAtMS44NDcsMi43MjggLTAuNzYzLDAuMjkyIC0yLjExMSwwLjM1MiAtNC4wNDYsMC4xNzYgLTAuOTM4LC0wLjA2IC0yLjMxNywtMC4wNiAtNC4xMzUsMCAtMS42NDIsMC4yMDQgLTQuMjgsMC40MDkgLTcuOTE2LDAuNjE1IC0zLjE2NywwLjExNyAtNS4xMDIsLTAuMzIzIC01LjgwNiwtMS4zMTkgLTAuNDcsLTAuNzAzIC0wLjQ3LC0xLjQzNyAwLC0yLjE5OSAwLjgyLC0xLjI4OSAyLjk2MSwtMS45MzUgNi40MjIsLTEuOTM1IDEuMjMxLDAgMS45OTIsLTAuMTAyIDIuMjg2LC0wLjMwNyAwLjI5MywtMC4yMDUgMC40NCwtMC42MDEgMC40NCwtMS4xODcgMCwtMC41MjYgMCwtMS4wMjMgMCwtMS40OTIgMCwtMC44NzcgMCwtMi4xNjUgMCwtMy44NjIgMC4xNzYsLTIuOTgzIDAuMTc2LC03LjQzMiAwLC0xMy4zNDMgLTAuMjM1LC04LjQ4NSAtMC4xMTgsLTE1Ljk0NSAwLjM1MiwtMjIuMzgzIC0wLjA1OSwtMC4wNTggLTAuMTQ3LC0wLjE0NiAtMC4yNjYsLTAuMjY0IC0yLjEyMywwLjExOCAtNS41NDMsMC4wNTkgLTEwLjI2LC0wLjE3NyAtMC41MzEsMCAtMi4zMzEsMC4xMTkgLTUuMzk2LDAuMzUzIDAuNzYyLDUuMzM3IDEuMjMxLDkuMzU0IDEuNDA3LDEyLjA1MSAwLDAuMzUyIC0wLjA1OSwxLjE0NCAtMC4xNzYsMi4zNzUgLTAuMDU5LDAuODc5IC0wLjc5MiwxLjMxOSAtMi4xOTksMS4zMTkgLTAuNzYzLDAgLTEuMjAyLC0wLjI2MiAtMS4zMTksLTAuNzg1IC0wLjA1OSwtMC4xMTUgLTAuNDExLC0xLjY4NyAtMS4wNTYsLTQuNzExIC0wLjM1MiwtMS45NzcgLTAuODUxLC00Ljc2OSAtMS40OTUsLTguMzc1IDAsLTAuMjMgLTAuMjA2LC0wLjk1NyAtMC42MTUsLTIuMTggLTAuMzUsLTAuOTg5IC0wLjUyNSwtMS43NDUgLTAuNTI1LC0yLjI2OCAwLC0wLjQwNiAwLjI3NywtMC45MTcgMC44MzYsLTEuNTI2IDAuNTU3LC0wLjYxIDEuMzkzLC0xLjAwNCAyLjUwNywtMS4xNzkgMC4xNzYsMCAwLjQ1MywwIDAuODM2LDAgMC4zOCwwIDAuNjg4LDAgMC45MjMsMCA2Ljk3OSwwIDEwLjAyOCwwIDkuMTQ4LDAgNC43NSwwLjE3NyA4Ljk3MiwwLjE3NyAxMi42NjYsMCA1LjI3NywtMC4yMzMgMTAuNDk1LC0wLjcwMyAxNS42NTcsLTEuNDA3IDAuMzUyLC0wLjE3NiAwLjg3OSwtMC4zNTIgMS41ODIsLTAuNTI3IDEuMjkxLC0wLjExNyAyLjM0NiwwLjE3NiAzLjE2OCwwLjg4IDAuODIsMC43MDIgMS4xMTMsMS42NDEgMC44NzksMi44MTQgeiIKICAgICAgIGZpbGw9IiNmZmZmZmYiCiAgICAgICBzdHJva2U9IiNmZmZmZmYiCiAgICAgICBzdHJva2Utd2lkdGg9IjMiCiAgICAgICBpZD0icGF0aDIiIC8+PC9nPjwvc3ZnPgo="
  const bskyMenuIcon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgd2lkdGg9IjY0IgogICBoZWlnaHQ9IjY0IgogICB2aWV3Qm94PSIwIDAgNjQgNjQiCiAgIGZpbGw9Im5vbmUiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzEiCiAgIHNvZGlwb2RpOmRvY25hbWU9InR1cmJvYnV0dGVyZmx5LW1lbnUtaWNvbi5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMy4yICgwOTFlMjBlLCAyMDIzLTExLTI1LCBjdXN0b20pIgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzCiAgICAgaWQ9ImRlZnMxIiAvPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgICBpZD0ibmFtZWR2aWV3MSIKICAgICBwYWdlY29sb3I9IiNmZmZmZmYiCiAgICAgYm9yZGVyY29sb3I9IiMwMDAwMDAiCiAgICAgYm9yZGVyb3BhY2l0eT0iMC4yNSIKICAgICBpbmtzY2FwZTpzaG93cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICAgIGlua3NjYXBlOnBhZ2VjaGVja2VyYm9hcmQ9IjAiCiAgICAgaW5rc2NhcGU6ZGVza2NvbG9yPSIjZDFkMWQxIgogICAgIGlua3NjYXBlOnpvb209IjQuNTg5ODQyOCIKICAgICBpbmtzY2FwZTpjeD0iNjQuMzgxMjkiCiAgICAgaW5rc2NhcGU6Y3k9IjM3LjM2NTExNCIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE5MjAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LXk9Ii04IgogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ic3ZnMSIgLz48Y2lyY2xlCiAgICAgc3R5bGU9ImZpbGw6IzBlOThmZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzAxNjlkODtzdHJva2Utd2lkdGg6MS45NzQ3MztzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW9wYWNpdHk6MTtwYWludC1vcmRlcjpmaWxsIG1hcmtlcnMgc3Ryb2tlO2ZpbGwtb3BhY2l0eToxIgogICAgIGlkPSJwYXRoMyIKICAgICBjeD0iMzEuOTMxNjg4IgogICAgIGN5PSIzMS45MzE2ODgiCiAgICAgcj0iMzAuOTQ0MzIzIiAvPjxwYXRoCiAgICAgZD0ibSAxNy40MTU0NjEsMTQuNjc1Mjk0IGMgNS42MDUxMTUsNC4yMDgwNDQgMTEuNjMzNzEzLDEyLjc0MDM4NCAxMy44NDc0MzksMTcuMzE4ODEyIDIuMjEzNzI3LC00LjU3ODQyOCA4LjI0MjMyNCwtMTMuMTEwNzY4IDEzLjg0NzQ0LC0xNy4zMTg4MTIgNC4wNDQzMzgsLTMuMDM2MjkxIDEwLjU5NzQ2OSwtNS4zODU2MzI1IDEwLjU5NzQ2OSwyLjA5MDEwMyAwLDEuNDkyOTYzIC0wLjg1NjAwMiwxMi41NDIwMSAtMS4zNTgwNywxNC4zMzU5NTUgLTEuNzQ1MTQyLDYuMjM2Mjk0IC04LjEwNDI2Nyw3LjgyNjkzNSAtMTMuNzYxMDI0LDYuODY0MTk3IDkuODg3NzEsMS42ODI4MjcgMTIuNDAyOTU1LDcuMjU2OTU0IDYuOTcwNzYyLDEyLjgzMTA4IEMgMzcuMjQyNjk1LDYxLjM4Mjk5NSAzMi43MzE0LDQ4LjE0MDQ4MyAzMS41NzU0MjksNDQuNzQ3Mjk0IDMxLjM2MzUxNyw0NC4xMjUyNDEgMzEuMjY0MzYzLDQzLjgzNDIyNSAzMS4yNjI5LDQ0LjA4MTY4NiBjIC0wLjAwMTMsLTAuMjQ3NDYxIC0wLjEwMDYyMiwwLjA0MzU0IC0wLjMxMjUzNSwwLjY2NTYwOCAtMS4xNTU5NywzLjM5MzE4OSAtNS42NjcyNTksMTYuNjM1NzAxIC0xNS45ODQwNjgsNi4wNDkzMzUgQyA5LjUzNDA5NDgsNDUuMjIyNTAzIDEyLjA0OTM1NiwzOS42NDgzNzYgMjEuOTM3MDc5LDM3Ljk2NTU0OSAxNi4yODAzMjIsMzguOTI4Mjg3IDkuOTIxMjQ1NiwzNy4zMzc2NDYgOC4xNzYwNDMxLDMxLjEwMTM1MiA3LjY3NDAxMzMsMjkuMzA3NDA3IDYuODE3OTkwMSwxOC4yNTgzNiA2LjgxNzk5MDEsMTYuNzY1Mzk3IGMgMCwtNy40NzU3MzU1IDYuNTUzMTcxOSwtNS4xMjYzOTQgMTAuNTk3NDcwOSwtMi4wOTAxMDMgeiIKICAgICBmaWxsPSIjMDAwMDAwIgogICAgIGlkPSJwYXRoMSIKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDowLjA4NjA3MzMiIC8+PGcKICAgICBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiCiAgICAgaWQ9ImcyIgogICAgIHRyYW5zZm9ybT0ibWF0cml4KDAuNDA0NTk2MjIsMCwwLDAuNDA0NTk2MjIsLTY1LjcyNDkyNiwtMzguNjUxNDcyKSI+PHBhdGgKICAgICAgIGQ9Im0gMjc0Ljk5LDE1OC44ODEgYyAtMC4wNCwwLjE3IC0wLjA3LDAuMzQgLTAuMTIsMC41MSAtMC4xNSwwLjYzIC0wLjQ2LDIuMTIgLTAuNzcsNS4wMyAwLDAuMDUgMCwwLjA5IC0wLjAxLDAuMTIgMS43MSw2Ljg4IC0xLjE3LDExLjA3IC0zLjA4LDEyLjk4IC0wLjEyLDAuMTMgLTAuMjUsMC4yNSAtMC4zOSwwLjM3IC0xLjg3LDEuNyAtNS4xNCwzLjczIC0xMC4wMiwzLjczIC0yLjQzLDAgLTQuNywtMC41NCAtNi42OCwtMS41MyAwLjA1LDIuNzMgMC4wOCw2LjQ5IDAuMDgsMTEuNzEgMS44LDAuNjMgMy40NSwxLjY1IDQuODUsMi45OSAyLjc4LDIuNjcgNC4zLDYuMjQgNC4zLDEwLjA1IDAsNS42NiAtMy4yNiwxMC41OCAtOC41MSwxMi44MyAtMC4xMywwLjA2IC0wLjI3LDAuMTIgLTAuNCwwLjE3IC0xLjc2LDAuNjcgLTMuNzQsMSAtNi4wNiwxIC0wLjg0LDAgLTEuNzQsLTAuMDQgLTIuNzIsLTAuMTMgLTAuNiwtMC4wMyAtMS40OCwtMC4wMiAtMi41MiwwLjAxIC0xLjg5LDAuMjEgLTQuNTUsMC40MiAtOC4xMSwwLjYyIC0wLjA3LDAgLTAuMTQsMC4wMSAtMC4yMiwwLjAxIC0wLjQ3LDAuMDIgLTAuOTIsMC4wMyAtMS4zNiwwLjAzIC02LjM3LDAgLTExLjAyLC0yLjAyIC0xMy44MywtNS45OSAtMC4wNiwtMC4wOCAtMC4xMSwtMC4xNiAtMC4xNiwtMC4yNCAtMi44NiwtNC4yNyAtMi45NCwtOS42NyAtMC4yMiwtMTQuMDggMC4wMiwtMC4wNSAwLjA1LC0wLjA5IDAuMDgsLTAuMTQgMS43MywtMi43MiA0LjI2LC00LjY2IDcuNTQsLTUuOCAwLjA0LC0xLjkzIDAuMDMsLTQuMzUgLTAuMDMsLTcuMjIgLTEuNjMsMC42OCAtMy41MSwxLjA4IC01LjYyLDEuMDggLTUuNTcsMCAtMTAuMTcsLTMuMzEgLTExLjc3LC04LjM0IC0wLjMzLC0xLjAyIC0wLjY0LC0yLjUxIC0xLjM2LC01Ljg3IC0wLjAzLC0wLjEyIC0wLjA1LC0wLjI0IC0wLjA3LC0wLjM2IGwgLTEuNDgsLTguMjcgYyAtMC4wNSwtMC4xOCAtMC4xMiwtMC4zOSAtMC4yLC0wLjYzIC0wLjc3LC0yLjE5IC0xLjEzLC00LjA1IC0xLjEzLC01Ljg1IDAsLTIuMjMgMC42NSwtNS42IDMuNzMsLTguOTYgMS41NSwtMS43IDQuMzcsLTMuOSA4LjkxLC00LjYxIDAuNTYsLTAuMDkgMS4xMywtMC4xNCAxLjcsLTAuMTQgaCAxMS4wNiBjIDAuMjUsMCAwLjUsMC4wMSAwLjc1LDAuMDMgNC4yMiwwLjE1IDgsMC4xNCAxMS4yNCwtMC4wMSA0LjUzLC0wLjIgOS4wNSwtMC41OSAxMy40OCwtMS4xNiAwLjUsLTAuMTYgMS4wNCwtMC4zMiAxLjYyLC0wLjQ2IDAuNTUsLTAuMTQgMS4xMSwtMC4yMyAxLjY3LC0wLjI5IDQuMjYsLTAuMzkgOC4yMywwLjg0IDExLjMyLDMuNDggMy44MywzLjI5IDUuNTIsOC4yNyA0LjUxLDEzLjMzIHoiCiAgICAgICBmaWxsPSIjMTE4NWZlIgogICAgICAgc3Ryb2tlPSJub25lIgogICAgICAgc3Ryb2tlLXdpZHRoPSIxIgogICAgICAgaWQ9InBhdGgxLTkiCiAgICAgICBzdHlsZT0iZmlsbDojMTE4NWZlO2ZpbGwtb3BhY2l0eToxIiAvPjxwYXRoCiAgICAgICBkPSJtIDI2NC4yMDIsMTU2LjcyNSBjIC0wLjQxLDEuNjQzIC0wLjc2MiwzLjg3IC0xLjA1NSw2LjY4NSAtMC4xMTksMS40MDggLTAuMDYxLDIuNTUxIDAuMTc2LDMuNDMxIDAuNDA4LDEuNDY3IDAuMzgxLDIuNDM1IC0wLjA4OCwyLjkwMyAtMC42NDYsMC41ODYgLTEuNTI1LDAuODc5IC0yLjYzOSwwLjg3OSAtMS4yOTEsMCAtMi4xNDMsLTAuMzgzIC0yLjU1MSwtMS4xNTEgLTAuMDYxLC0yLjM2MiAtMC4wMzEsLTQuNTc4IDAuMDg4LC02LjY0NiAwLjExNSwtMi41NCAwLjE3NiwtMy44NjkgMC4xNzYsLTMuOTg3IC0wLjA2MSwwIC0wLjE0OCwtMC4wNTkgLTAuMjY0LC0wLjE3OCAtNS40NTUsMC4yMzcgLTEwLjU4NiwwLjU4OSAtMTUuMzk0LDEuMDU5IC0wLjExOCwwLjU4OSAtMC4xMTgsMS41MjggMCwyLjgyIDAuMjMzLDEuODIyIDAuMzUyLDIuODggMC4zNTIsMy4xNzIgLTAuMjM0LDEuODIyIC0wLjM1Miw0LjUyNCAtMC4zNTIsOC4xMDkgMC4yMzMsMS41MjggMC4zNTIsOC4wOCAwLjM1MiwxOS42NTUgdiA2LjQzNSBjIDAsMC45OTkgMC4xNDUsMS43MDQgMC40MzYsMi4xMTUgaCA1LjQwMSBjIDAuOTg3LC0wLjExNyAxLjc4NSwwLjExOCAyLjM5NiwwLjcwNCAwLjYwOSwwLjU4NyAwLjkxNCwxLjI5IDAuOTE0LDIuMTEgMCwxLjI4OSAtMC42MTUsMi4xOTkgLTEuODQ3LDIuNzI4IC0wLjc2MywwLjI5MiAtMi4xMTEsMC4zNTIgLTQuMDQ2LDAuMTc2IC0wLjkzOCwtMC4wNiAtMi4zMTcsLTAuMDYgLTQuMTM1LDAgLTEuNjQyLDAuMjA0IC00LjI4LDAuNDA5IC03LjkxNiwwLjYxNSAtMy4xNjcsMC4xMTcgLTUuMTAyLC0wLjMyMyAtNS44MDYsLTEuMzE5IC0wLjQ3LC0wLjcwMyAtMC40NywtMS40MzcgMCwtMi4xOTkgMC44MiwtMS4yODkgMi45NjEsLTEuOTM1IDYuNDIyLC0xLjkzNSAxLjIzMSwwIDEuOTkyLC0wLjEwMiAyLjI4NiwtMC4zMDcgMC4yOTMsLTAuMjA1IDAuNDQsLTAuNjAxIDAuNDQsLTEuMTg3IDAsLTAuNTI2IDAsLTEuMDIzIDAsLTEuNDkyIDAsLTAuODc3IDAsLTIuMTY1IDAsLTMuODYyIDAuMTc2LC0yLjk4MyAwLjE3NiwtNy40MzIgMCwtMTMuMzQzIC0wLjIzNSwtOC40ODUgLTAuMTE4LC0xNS45NDUgMC4zNTIsLTIyLjM4MyAtMC4wNTksLTAuMDU4IC0wLjE0NywtMC4xNDYgLTAuMjY2LC0wLjI2NCAtMi4xMjMsMC4xMTggLTUuNTQzLDAuMDU5IC0xMC4yNiwtMC4xNzcgLTAuNTMxLDAgLTIuMzMxLDAuMTE5IC01LjM5NiwwLjM1MyAwLjc2Miw1LjMzNyAxLjIzMSw5LjM1NCAxLjQwNywxMi4wNTEgMCwwLjM1MiAtMC4wNTksMS4xNDQgLTAuMTc2LDIuMzc1IC0wLjA1OSwwLjg3OSAtMC43OTIsMS4zMTkgLTIuMTk5LDEuMzE5IC0wLjc2MywwIC0xLjIwMiwtMC4yNjIgLTEuMzE5LC0wLjc4NSAtMC4wNTksLTAuMTE1IC0wLjQxMSwtMS42ODcgLTEuMDU2LC00LjcxMSAtMC4zNTIsLTEuOTc3IC0wLjg1MSwtNC43NjkgLTEuNDk1LC04LjM3NSAwLC0wLjIzIC0wLjIwNiwtMC45NTcgLTAuNjE1LC0yLjE4IC0wLjM1LC0wLjk4OSAtMC41MjUsLTEuNzQ1IC0wLjUyNSwtMi4yNjggMCwtMC40MDYgMC4yNzcsLTAuOTE3IDAuODM2LC0xLjUyNiAwLjU1NywtMC42MSAxLjM5MywtMS4wMDQgMi41MDcsLTEuMTc5IDAuMTc2LDAgMC40NTMsMCAwLjgzNiwwIDAuMzgsMCAwLjY4OCwwIDAuOTIzLDAgNi45NzksMCAxMC4wMjgsMCA5LjE0OCwwIDQuNzUsMC4xNzcgOC45NzIsMC4xNzcgMTIuNjY2LDAgNS4yNzcsLTAuMjMzIDEwLjQ5NSwtMC43MDMgMTUuNjU3LC0xLjQwNyAwLjM1MiwtMC4xNzYgMC44NzksLTAuMzUyIDEuNTgyLC0wLjUyNyAxLjI5MSwtMC4xMTcgMi4zNDYsMC4xNzYgMy4xNjgsMC44OCAwLjgyLDAuNzAyIDEuMTEzLDEuNjQxIDAuODc5LDIuODE0IHoiCiAgICAgICBmaWxsPSIjZmZmZmZmIgogICAgICAgc3Ryb2tlPSIjZmZmZmZmIgogICAgICAgc3Ryb2tlLXdpZHRoPSIzIgogICAgICAgaWQ9InBhdGgyIiAvPjwvZz48L3N2Zz4K"
  const speechBubbleIcon =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gVXBsb2FkZWQgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIEdlbmVyYXRvcjogU1ZHIFJlcG8gTWl4ZXIgVG9vbHMgLS0+Cgo8c3ZnCiAgIGZpbGw9IiMwMDAwMDAiCiAgIGhlaWdodD0iODAwcHgiCiAgIHdpZHRoPSI4MDBweCIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iQ2FwYV8xIgogICB2aWV3Qm94PSIwIDAgMzcxLjExNyAzNzEuMTE3IgogICB4bWw6c3BhY2U9InByZXNlcnZlIgogICBzb2RpcG9kaTpkb2NuYW1lPSJibGFjay1zcGVlY2gtYnViYmxlLXN2Z3JlcG8tY29tLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS4zLjIgKDA5MWUyMGUsIDIwMjMtMTEtMjUsIGN1c3RvbSkiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnMKICAgaWQ9ImRlZnMxIiAvPjxzb2RpcG9kaTpuYW1lZHZpZXcKICAgaWQ9Im5hbWVkdmlldzEiCiAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiIKICAgYm9yZGVyY29sb3I9IiMwMDAwMDAiCiAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgIGlua3NjYXBlOnNob3dwYWdlc2hhZG93PSIyIgogICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICBpbmtzY2FwZTpkZXNrY29sb3I9IiNkMWQxZDEiCiAgIGlua3NjYXBlOnpvb209IjEuMDE2MjUiCiAgIGlua3NjYXBlOmN4PSI0MDAiCiAgIGlua3NjYXBlOmN5PSI0MDAiCiAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTkyMCIKICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTAwOSIKICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiCiAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkNhcGFfMSIgLz4KPHBhdGgKICAgZD0iTTMxNi4zMyw2NC41NTZjLTM0Ljk4Mi0yNy42MDctODEuNDI0LTQyLjgxMS0xMzAuNzcyLTQyLjgxMWMtNDkuMzQ4LDAtOTUuNzksMTUuMjA0LTEzMC43NzEsNDIuODExICBDMTkuNDU3LDkyLjQzOCwwLDEyOS42MTUsMCwxNjkuMjM4YzAsMjMuODM1LDcuMzA4LDQ3LjUwOCwyMS4xMzMsNjguNDZjMTIuNzU5LDE5LjMzNSwzMS4wNywzNi40Miw1My4wODgsNDkuNTY0ICBjLTEuMDE2LDcuMTE2LTYuNDg3LDI3Ljk0MS0zNS44ODgsNTIuNzU5Yy0xLjUxMywxLjI3OC0yLjEzLDMuMzI4LTEuNTcyLDUuMjI5YzAuNTU4LDEuOSwyLjE4NSwzLjI5Miw0LjE0OCwzLjU1ICBjMC4xNzgsMC4wMjMsNC40NTQsMC41NzIsMTIuMDUyLDAuNTcyYzIxLjY2NSwwLDY1LjkzOS00LjMwMiwxMjAuMDYzLTMyLjk3M2M0LjE3NywwLjIyMSw4LjM4NywwLjMzMywxMi41MzQsMC4zMzMgIGM0OS4zNDgsMCw5NS43ODktMTUuMjA0LDEzMC43NzItNDIuODExYzM1LjMzLTI3Ljg4Miw1NC43ODctNjUuMDU5LDU0Ljc4Ny0xMDQuNjgzQzM3MS4xMTcsMTI5LjYxNSwzNTEuNjYsOTIuNDM4LDMxNi4zMyw2NC41NTZ6IgogICBpZD0icGF0aDEiCiAgIHN0eWxlPSJmaWxsOiNmZmZmZmY7ZmlsbC1vcGFjaXR5OjEiIC8+Cjwvc3ZnPgo="
  const TwoSpeechBubbleIcon =
    "https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/two-speech-bubbles.svg"
  const ImageIcon =
    "https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/photo-image.svg"
  const HeartPlusIcon =
    "https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/heartplus.svg"
  const HeartBrokenIcon =
    "https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/heartbroken.svg"
  const SearchingLensIcon =
    "https://raw.githubusercontent.com/hammouda101010/turbowarp-bsky-api/refs/heads/main/static/images/search-lens.svg"
  // const arrowURI =
  // "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNS44OTMiIGhlaWdodD0iMTUuODkzIiB2aWV3Qm94PSIwIDAgMTUuODkzIDE1Ljg5MyI+PHBhdGggZD0iTTkuMDIxIDEyLjI5NHYtMi4xMDdsLTYuODM5LS45MDVDMS4zOTggOS4xODQuODQ2IDguNDg2Ljk2MiA3LjcyN2MuMDktLjYxMi42MDMtMS4wOSAxLjIyLTEuMTY0bDYuODM5LS45MDVWMy42YzAtLjU4Ni43MzItLjg2OSAxLjE1Ni0uNDY0bDQuNTc2IDQuMzQ1YS42NDMuNjQzIDAgMCAxIDAgLjkxOGwtNC41NzYgNC4zNmMtLjQyNC40MDQtMS4xNTYuMTEtMS4xNTYtLjQ2NSIgZmlsbD0ibm9uZSIgc3Ryb2tlLW9wYWNpdHk9Ii4xNSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEuNzUiLz48cGF0aCBkPSJNOS4wMjEgMTIuMjk0di0yLjEwN2wtNi44MzktLjkwNUMxLjM5OCA5LjE4NC44NDYgOC40ODYuOTYyIDcuNzI3Yy4wOS0uNjEyLjYwMy0xLjA5IDEuMjItMS4xNjRsNi44MzktLjkwNVYzLjZjMC0uNTg2LjczMi0uODY5IDEuMTU2LS40NjRsNC41NzYgNC4zNDVhLjY0My42NDMgMCAwIDEgMCAuOTE4bC00LjU3NiA0LjM2Yy0uNDI0LjQwNC0xLjE1Ni4xMS0xLjE1Ni0uNDY1IiBmaWxsPSIjZmZmIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBkPSJNMCAxNS44OTJWMGgxNS44OTJ2MTUuODkyeiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";

  // Objects
  const agent = new AtpAgent({
    service: "https://bsky.social"
  })
  interface SearchResultData {
    posts: object[]
    actors: object[]
    cursor: any
    headers: object
  }

  type SearchResult =
    | "no search result yet"
    | "found nothing"
    | SearchResultData

  type ImageType = "avatar" | "banner" | "feed_thumbnail" | "feed_fullsize"

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
    if (dataURI.startsWith("http") || dataURI.startsWith("https")) {
      URI = Cast.toString(await URLAsDataURI(dataURI))
    }
    const byteString = atob(URI.split(",")[1])
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
    if (blob.size > 100000000) {
      throw new Error("Error: File size is too big. It must be less than 1MB.")
    }
    console.log(`File size: ${blob.size} bytes`)
  }

  const atUriConversions = {
    /** Converts a readable post url to an at:// uri. */
    postLinkToAtUri: async (postUrl: string) => {
      const url = new URL(postUrl)
      const pathSegments = url.pathname.split("/")
      // Validate URL structure
      if (
        pathSegments.length < 5 ||
        pathSegments[1] !== "profile" ||
        pathSegments[3] !== "post"
      ) {
        throw new Error("Invalid Bluesky post URL format.")
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
    /** Converts a readable handle/profile url to an at:// uri. */
    handleToAtUri: async (handleUrl: string) => {
      let handle: string = Cast.toString(handleUrl)
      if (!handle.startsWith("@")) {
        if (handle.startsWith("http")) {
          const url = new URL(handleUrl)
          const pathSegments = url.pathname.split("/")
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
    /** Converts an at:// uri to a readable post url. */
    atUritoPostLink: async (postAtUri: string) => {
      const match = postAtUri.match(atPostUriPattern)

      const uri = atUriConversions.isValidAtUri(postAtUri) ? match[1] : null
      const postId = match[2]

      const { data } = await agent.getProfile({ actor: uri })

      const handle = data.handle

      // Construct the Link
      return `https://bsky.app/profile/${handle}/post/${postId}`
    },
    /** Converts an at:// uri to a readable profile url. */
    atUritoProfileLink: async (profileAtUri: string) => {
      const did = atUriConversions.isValidAtUri(profileAtUri)
        ? atUriConversions.ExtractDID(profileAtUri)
        : null

      // Get the actor's data
      const { data } = await agent.getProfile({ actor: did })

      const handle = data.handle

      // Construct the Link
      return `https://bsky.app/profile/${handle}/`
    },
    /** Extracts the DID of an at:// uri. */
    ExtractDID: (atUri: string) => {
      const match = atUri.match(/(?!at:\/\/)(did:[^/]+)/)
      if (!match) {
        throw new Error("Error: Invalid at:// URI.")
      }
      return match ? match[0] : null
    },
    BlobReftoLink: async (did: string, imgType: ImageType, blob: any) => {
      const { data } = blob

      let mimeType: string = data.blob.mimeType

      mimeType.replace(/.+\//, "")

      return `https://cdn.bsky.app/img/${imgType}/plain/${did}/${data.blob.ref.$link}@${mimeType}`
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
    date: string = "16-12-2024",
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
    date: string = "16-12-2024",
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
  async function Upload(datauri: string, encoding: string = "image/png") {
    getFileSize(datauri) // Check the File Size of the Image

    const Unit8Array = await convertDataURIToUint8Array(datauri) // Get The Data of The URI

    const blob = await agent.uploadBlob(Unit8Array, {
      encoding: encoding
    })
    console.info(`Uploaded Blob: ${JSON.stringify(blob)}`)
    return blob
  }

  /** Search Posts on BlueSky Using a Search Term */

  const BskySearchFuncs = {
    SearchPosts: async (searchTerm: string, cursor: string, limit: number) => {
      const response = await agent.app.bsky.feed.searchPosts({
        q: searchTerm,
        cursor: cursor,
        limit: limit
      })
      return response
    },
    SearchActors: async (searchTerm: string, cursor: string, limit: number) => {
      const response = agent.app.bsky.actor.searchActors({
        q: searchTerm,
        cursor: cursor,
        limit: limit
      })
      return response
    },
    Search: async (searchTerm: string, cursor: string, limit: number) => {
      const posts = await BskySearchFuncs.SearchPosts(searchTerm, cursor, limit)
      const actors = await BskySearchFuncs.SearchActors(
        searchTerm,
        cursor,
        limit
      )

      const result: SearchResultData = {
        posts: posts.data.posts,
        actors: actors.data.actors,
        cursor: posts.data.cursor ?? actors.data.cursor,
        headers: posts.headers ?? actors.headers
      }

      return result
    }
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

  /**Unblocks an User on BlueSky using a block record DID */
  async function UnblockUser(blockedUserAtUri: string) {
    const { rkey } = new AtUri(blockedUserAtUri)

    await agent.app.bsky.graph.block.delete({
      repo: agent.session.did,
      rkey
    })
    console.info(`Unblocked User With at:// URI: ${blockedUserAtUri}`)
  }

  async function EditProfile(
    displayName: string,
    description: string,
    userImageType: string = "avatar",
    blob: any = {}
  ) {
    await agent.upsertProfile(existingProfile => {
      const existing = existingProfile ?? {}

      existing.displayName = displayName
      existing.description = description

      const { data } = blob

      if (Object.keys(blob).length !== 0) {
        existing[userImageType] = data.blob
      }
      console.log(existing)

      return existing
    })
  }

  /**
   * Convetrs BlueSky's rich text to Markdown
   *
   */
  function ConvertRichTextToMarkdown(rt: RichText) {
    // Converts rich text to Markdown
    let markdown = ""
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

      this.searchResult = "no search result yet"
      this.sessionDID = null
      this.lastBlockedUserURI = null

      this.showExtras = false
    }
    //@ts-ignore
    getInfo() {
      return {
        id: "HamBskyAPI",
        name: "TurboButterfly",
        color1: "#0484fc",
        color2: "#0970D1",
        menuIconURI: bskyMenuIcon,
        blockIconURI: bskyIcon,
        docsURI: "https://docs.bsky.app/", // I Don't Want to Make a Long Documentation about The Extension, So Have The Official BlueSky Docs for Now.
        blocks: [
          {
            blockType: Scratch.BlockType.BUTTON,
            func: "bskyDisclaimer",
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
            opcode: "bskyLogout",
            text: "logout from bluesky API"
          },
          "---",
          {
            blockType: Scratch.BlockType.BOOLEAN,
            opcode: "bskyLoggedIn",
            text: "logged in to bluesky api?"
          },
          "---",
          {
            blockType: Scratch.BlockType.EVENT,
            opcode: "bskyWhenLoggedIn",
            text: "when logged in to bluesky",
            isEdgeActivated: false,
            shouldRestartExistingThreads: true
          },
          {
            blockType: Scratch.BlockType.EVENT,
            opcode: "bskyWhenLoggedOut",
            text: "when logged out from bluesky",
            isEdgeActivated: false,
            shouldRestartExistingThreads: true
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Creating Posts"
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
                defaultValue: ""
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyReply",
            text: "reply [POST_ICON][REPLY] to post with info:[INFO] embed: [EMBED]",
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
              },
              EMBED: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
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
          "---",
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyRepost",
            text: "repost post with uri [URI] and cid [CID]",
            arguments: {
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
            opcode: "bskyUnRepost",
            text: "remove post repost with uri [URI]",
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "at://did:plc:u5cwb2mwiv2bfq53cjufe6yn/app.bsky.feed.post/3k43tv4rft22g"
              }
            }
          },
          "---",
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskySetCurrentDate",
            text: "set date to [DATE]",
            hideFromPalette: this.useCurrentDate,
            arguments: {
              DATE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: new Date().toISOString()
              }
            }
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyUploadBlob",
            text: "upload image/video blob [DATAURI] with content-type [ENCODING]",
            blockIconURI: ImageIcon,
            outputShape: 3,
            arguments: {
              DATAURI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABrElEQVRIS+2VvUoDQRSGv+VQKQmKQj"
              },
              ENCODING: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyENCODING"
              }
            }
          },

          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyImgEmbed",
            text: "new  image embed with images [IMAGES]",
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
            opcode: "bskyImgEmbedReporter",
            text: "image embed with image [IMAGE] alt text [TEXT] width [WIDTH] and height [HEIGHT]",
            blockIconURI: ImageIcon,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "use upload blob reporter"
              },
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "this is the description of an embed"
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
            opcode: "bskyWebCardEmbed",
            text: "new  website card embed with image [IMAGE] title [TITLE] description [DESCRIPTION] and link [LINK]",
            blockIconURI: ImageIcon,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "image blob"
              },
              TITLE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "title"
              },
              DESCRIPTION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "this is the description of an embed"
              },
              LINK: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://example.com"
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyQuotePost",
            text: "new quote post embed with uri [URI] and cid [CID] record",
            arguments: {
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
          "---",
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Viewing Feeds"
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetTimeline",
            text: "get my timeline [IMAGE] with cursor [CURSOR] and limit [LIMIT]",
            hideFromPalette: this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetTimelineSep",
            text: "get my timeline [IMAGE]",
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
            opcode: "bskyGetFeed",
            text: "get feed [IMAGE] at [URI] with cursor [CURSOR] and limit [LIMIT]",
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
                  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot"
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 30
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetFeedSep",
            text: "get feed [IMAGE] at [URI]",
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
                  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot"
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetFeedGenerator",
            text: "get feed generator [IMAGE] at [URI]",
            outputShape: 3,
            arguments: {
              IMAGE: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: TwoSpeechBubbleIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot"
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetAuthorFeedSep",
            text: "get the author [URI]'s feed with filter [FILTER]",
            hideFromPalette: !this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "did:plc:z72i7hdynmk6r22z27h6tvur"
              },
              FILTER: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyAUTHOR_FEED_FILTERS"
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetAuthorFeed",
            text: "get the author [URI]'s feed with filter [FILTER] cursor [CURSOR] and limit [LIMIT]",
            hideFromPalette: this.sepCursorLimit,
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "did:plc:z72i7hdynmk6r22z27h6tvur"
              },
              FILTER: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyAUTHOR_FEED_FILTERS"
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 50
              }
            }
          },
          "---",
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskySetCursor",
            text: "set feed cursor to [CURSOR]",
            hideFromPalette: !this.sepCursorLimit,
            arguments: {
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskySetLimit",
            text: "set feed searching limit to [LIMIT]",
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
            opcode: "bskyResetCursorLimit",
            text: "reset cursor and limit",
            hideFromPalette: !this.sepCursorLimit
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyGetPostThread",
            text: "get post thread at [URI] with depth [DEPTH] and parent height [HEIGHT]",
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
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
            opcode: "bskyGetPost",
            text: "get post at [URI]",
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Liking and Following"
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyLike",
            text: "[ICON] like post at [URI] and cid [CID]",
            arguments: {
              ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: HeartPlusIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
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
            opcode: "bskyUnLike",
            text: "[ICON] remove like from post at [URI]",
            arguments: {
              ICON: {
                type: Scratch.ArgumentType.IMAGE,
                dataURI: HeartBrokenIcon
              },
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyFollow",
            text: "follow user with DID/handle: [DID]",
            arguments: {
              DID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyUnFollow",
            text: "unfollow user with follow at:// uri record: [URI]",
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Viewing Profiles"
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyViewProfile",
            text: "get profile at [URI]",
            outputShape: 3,
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://..."
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyViewProfiles",
            text: "get profiles at [URIS]",
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
            text: "Editing Your Profile"
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyEditProfile",
            text: "edit profile with new display name [DISPLAY_NAME] description [DESCRIPTION] and (optional) new [PROFILE_IMAGE_TYPE] image [IMAGE]",
            arguments: {
              DISPLAY_NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "new display name"
              },
              DESCRIPTION: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my description"
              },
              PROFILE_IMAGE_TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyPROFILE_IMAGE_TYPE"
              },
              IMAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "use upload blob reporter"
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Blocking and Muting"
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyBlockUser",
            text: "block user with DID [DID]",
            arguments: {
              DID: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "ihateu.bsky.social"
              }
            }
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyLastBlockedUser",
            text: "last blocked user DID",
            outputShape: 3
          },
          "---",
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyUnblockUser",
            text: "unblock user with block at:// uri record [URI]",
            arguments: {
              URI: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              }
            }
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Searching Posts and Profiles"
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskySearch",
            text: "search posts/profiles with search term [TERM] cursor [CURSOR] and limit [LIMIT]",
            hideFromPalette: this.sepCursorLimit,
            blockIconURI: SearchingLensIcon,
            arguments: {
              TERM: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "i love pizza"
              },
              CURSOR: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              },
              LIMIT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 69
              }
            }
          },
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskySearchSep",
            text: "search posts/profiles with search term [TERM]",
            hideFromPalette: !this.sepCursorLimit,
            blockIconURI: SearchingLensIcon,
            arguments: {
              TERM: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "i love pizza"
              }
            }
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskySearchResult",
            text: "search result",
            disableMonitor: false
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "Extras"
          },

          {
            blockType: Scratch.BlockType.BUTTON,
            func: "bskyShowExtras",
            text: "Show Extras",
            hideFromPalette: this.showExtras
          },
          {
            blockType: Scratch.BlockType.BUTTON,
            func: "bskyHideExtras",
            text: "Hide Extras",
            hideFromPalette: !this.showExtras
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyProfileLinkToAtUri",
            text: "convert profile link/handle [URL] to at:// uri",
            outputShape: 3,
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://bsky.app/profile/example.bsky.social/"
              }
            },
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyPostLinkToAtUri",
            text: "convert post link [URL] to at:// uri",
            outputShape: 3,
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "https://bsky.app/profile/example.bsky.social/post/3lez77bnyhs2w"
              }
            },
            hideFromPalette: !this.showExtras
          },
          "---",
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyAtUriToPostLink",
            text: "convert at:// uri [URL] to post link",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue:
                  "at://did:plc:6loexbxe5rv4knai6j57obtn/app.bsky.feed.post/3lez77bnyhs2w"
              }
            },
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyAtUriToProfileLink",
            text: "convert at:// uri [URL] to profile link",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://did:plc:6loexbxe5rv4knai6j57obtn"
              }
            },
            hideFromPalette: !this.showExtras
          },
          {
            blockType: Scratch.BlockType.REPORTER,
            opcode: "bskyExtractDID",
            text: "extract DID from at:// uri [URL]",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://did:plc:6loexbxe5rv4knai6j57obtn"
              }
            },
            hideFromPalette: !this.showExtras
          },
          "---",
          {
            blockType: Scratch.BlockType.BOOLEAN,
            opcode: "bskyIsAtUri",
            text: "is [URL] a valid at:// uri? ",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "at://did:plc:6loexbxe5rv4knai6j57obtn"
              }
            },
            hideFromPalette: !this.showExtras
          },

          "---",
          {
            blockType: Scratch.BlockType.COMMAND,
            opcode: "bskyOptions",
            text: "set [OPTION] to [ONOFF]",
            hideFromPalette: !this.showExtras,
            arguments: {
              OPTION: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyOPTIONS"
              },
              ONOFF: {
                type: Scratch.ArgumentType.STRING,
                menu: "bskyONOFF"
              }
            }
          }
        ],
        menus: {
          bskyOPTIONS: {
            acceptReporters: true,
            items: [
              { text: "rich text", value: "richText" },
              { text: "use current date", value: "useCurrentDate" },
              {
                text: "cursor and limit as seperate blocks",
                value: "sepCursorLimit"
              }
            ]
          },
          bskyONOFF: {
            acceptReporters: false,
            items: [
              { text: "on", value: "true" },
              { text: "off", value: "false" }
            ]
          },

          bskyENCODING: {
            acceptReporters: true,
            items: [
              { text: "png", value: "image/png" },
              { text: "jpg", value: "image/jpeg" },
              { text: "gif", value: "image/gif" },
              { text: "webp", value: "image/webp" },
              { text: "svg", value: "image/svg+xml" },
              { text: "tiff", value: "image/tiff" },
              { text: "bmp", value: "image/bmp" }
            ]
          },
          bskyAUTHOR_FEED_FILTERS: {
            acceptReporters: true,
            items: [
              { text: "posts and replies", value: "posts_with_replies" },
              { text: "posts only", value: "posts_no_replies" },
              { text: "posts with media", value: "posts_with_media" },
              {
                text: "posts and author threads",
                value: "posts_and_author_threads"
              }
            ]
          },
          bskyPROFILE_IMAGE_TYPE: {
            acceptReporters: true,
            items: ["avatar", "banner"]
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
        $type: "app.bsky.embed.external",
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
        $type: "app.bsky.embed.images",
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
        $type: "app.bsky.embed.record",
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
        cursor: this.cursor ?? "",
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
        cursor: this.cursor ?? "",
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
        cursor: this.cursor ?? "",
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

    async bskyEditProfile(args) {
      await EditProfile(
        args.DISPLAY_NAME,
        args.DESCRIPTION,
        args.PROFILE_IMAGE_TYPE,
        args.IMAGE
      )
    }

    async bskyBlockUser(args) {
      const { uri } = await BlockUser(args.DID, this.useCurrentDate, this.date)
      this.lastBlockedUserURI = Cast.toString(uri)
    }
    bskyLastBlockedUser() {
      return this.lastBlockedUserURI ?? "no data found"
    }
    async bskyUnblockUser(args) {
      await UnblockUser(args.URI)
    }

    async bskySearch(args) {
      const response = await BskySearchFuncs.Search(
        args.TERM,
        args.CURSOR,
        args.LIMIT
      )
      const posts = response.posts
      const actors = response.actors

      this.searchResult =
        posts.length !== 0 && actors.length !== 0 ? response : "found nothing"
    }

    async bskySearchSep(args) {
      const response = await BskySearchFuncs.Search(
        args.TERM,
        this.cursor ?? "",
        this.limit ?? 5
      )
      const posts = response.posts
      const actors = response.actors

      this.searchResult =
        posts.length !== 0 && actors.length !== 0 ? response : "found nothing"
    }

    bskySearchResult() {
      return typeof this.searchResult === "object" && this.searchResult !== null
        ? JSON.stringify(this.searchResult)
        : this.searchResult
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
    bskyExtractDID(args): string {
      return Cast.toString(atUriConversions.ExtractDID(args.URL))
    }

    bskyOptions(args) {
      switch (args.OPTION) {
        case "richText":
          this.richText = Cast.toBoolean(args.ONOFF)
          break
        case "useCurrentDate":
          this.useCurrentDate = Cast.toBoolean(args.ONOFF)
          vm.extensionManager.refreshBlocks()
          break
        case "sepCursorLimit":
          this.sepCursorLimit = Cast.toBoolean(args.ONOFF)
          vm.extensionManager.refreshBlocks()
          break
        default:
          throw new Error("Error: This option doesn't exist. at all")
      }
    }
  }
  document.addEventListener("bskyLogin", () => {
    runtime.startHats("HamBskyAPI_bskyWhenLoggedIn")
  })
  document.addEventListener("bskyLogout", () => {
    runtime.startHats("HamBskyAPI_bskyWhenLoggedOut")
  })

  // @ts-ignore
  Scratch.extensions.register(new HamBskyAPI(Scratch.runtime))
})(Scratch)

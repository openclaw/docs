---
read_when:
    - 你需要 Codex harness 的執行階段支援契約
    - 你正在偵錯原生 Codex 工具、掛鉤、Compaction 或意見回饋上傳
    - 你正在變更 PI 與 Codex harness 回合中的 Plugin 行為
summary: Codex 執行框架的執行階段邊界、鉤子、工具、權限與診斷
title: Codex 控制框架執行環境
x-i18n:
    generated_at: "2026-05-11T20:32:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

This page documents the runtime contract for Codex harness turns. For setup and
routing, start with [Codex harness](/zh-TW/plugins/codex-harness). For config fields,
see [Codex harness reference](/zh-TW/plugins/codex-harness-reference).

## Overview

Codex mode is not PI with a different model call underneath. Codex owns more of
the native model loop, and OpenClaw adapts its plugin, tool, session, and
diagnostic surfaces around that boundary.

OpenClaw still owns channel routing, session files, visible message delivery,
OpenClaw dynamic tools, approvals, media delivery, and a transcript mirror.
Codex owns the canonical native thread, native model loop, native tool
continuation, and native compaction.

## Thread bindings and model changes

When an OpenClaw session is attached to an existing Codex thread, the next turn
sends the currently selected OpenAI model, approval policy, sandbox, and service
tier to app-server again. Switching from `openai/gpt-5.5` to
`openai/gpt-5.2` keeps the thread binding but asks Codex to continue with the
newly selected model.

## Visible replies and heartbeats

When a source chat turn runs through the Codex harness, visible replies default
to the OpenClaw `message` tool if the deployment has not explicitly configured
`messages.visibleReplies`. The agent can still finish its Codex turn privately;
it only posts to the channel when it calls `message(action="send")`. Set
`messages.visibleReplies: "automatic"` to keep direct-chat final replies on the
legacy automatic delivery path.

Codex heartbeat turns also get `heartbeat_respond` in the searchable OpenClaw
tool catalog by default, so the agent can record whether the wake should stay
quiet or notify without encoding that control flow in final text.

Heartbeat-specific initiative guidance is sent as a Codex collaboration-mode
developer instruction on the heartbeat turn itself. Ordinary chat turns restore
Codex Default mode instead of carrying heartbeat philosophy in their normal
runtime prompt.

## Hook boundaries

The Codex harness has three hook layers:

| Layer                                 | Owner                    | Purpose                                                             |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw plugin hooks                 | OpenClaw                 | Product/plugin compatibility across PI and Codex harnesses.         |
| Codex app-server extension middleware | OpenClaw bundled plugins | Per-turn adapter behavior around OpenClaw dynamic tools.            |
| Codex native hooks                    | Codex                    | Low-level Codex lifecycle and native tool policy from Codex config. |

OpenClaw does not use project or global Codex `hooks.json` files to route
OpenClaw plugin behavior. For the supported native tool and permission bridge,
OpenClaw injects per-thread Codex config for `PreToolUse`, `PostToolUse`,
`PermissionRequest`, and `Stop`.

When Codex app-server approvals are enabled, meaning `approvalPolicy` is not
`"never"`, the default injected native hook config omits `PermissionRequest` so
Codex's app-server reviewer and OpenClaw's approval bridge handle real
escalations after review. Operators can explicitly add `permission_request` to
`nativeHookRelay.events` when they need the compatibility relay.

Other Codex hooks such as `SessionStart` and `UserPromptSubmit` remain
Codex-level controls. They are not exposed as OpenClaw plugin hooks in the v1
contract.

For OpenClaw dynamic tools, OpenClaw executes the tool after Codex asks for the
call, so OpenClaw fires the plugin and middleware behavior it owns in the
harness adapter. For Codex-native tools, Codex owns the canonical tool record.
OpenClaw can mirror selected events, but it cannot rewrite the native Codex
thread unless Codex exposes that operation through app-server or native hook
callbacks.

Codex app-server item notifications also provide async `after_tool_call`
observations for native tool completions that are not already covered by the
native `PostToolUse` relay. These observations are for telemetry and plugin
compatibility only; they cannot block, delay, or mutate the native tool call.

Compaction and LLM lifecycle projections come from Codex app-server
notifications and OpenClaw adapter state, not native Codex hook commands.
OpenClaw's `before_compaction`, `after_compaction`, `llm_input`, and
`llm_output` events are adapter-level observations, not byte-for-byte captures
of Codex's internal request or compaction payloads.

Codex native `hook/started` and `hook/completed` app-server notifications are
projected as `codex_app_server.hook` agent events for trajectory and debugging.
They do not invoke OpenClaw plugin hooks.

## V1 support contract

Supported in Codex runtime v1:

| Surface                                       | Support                                                                          | Why                                                                                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI model loop through Codex               | Supported                                                                        | Codex app-server owns the OpenAI turn, native thread resume, and native tool continuation.                                                                                                                 |
| OpenClaw channel routing and delivery         | Supported                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage, and other channels stay outside the model runtime.                                                                                                           |
| OpenClaw dynamic tools                        | Supported                                                                        | Codex asks OpenClaw to execute these tools, so OpenClaw stays in the execution path.                                                                                                                       |
| Prompt and context plugins                    | Supported                                                                        | OpenClaw builds prompt overlays and projects context into the Codex turn before starting or resuming the thread.                                                                                           |
| Context engine lifecycle                      | Supported                                                                        | Assemble, ingest, after-turn maintenance, and context-engine compaction coordination run for Codex turns.                                                                                                  |
| Dynamic tool hooks                            | Supported                                                                        | `before_tool_call`, `after_tool_call`, and tool-result middleware run around OpenClaw-owned dynamic tools.                                                                                                 |
| Lifecycle hooks                               | Supported as adapter observations                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, and `after_compaction` fire with honest Codex-mode payloads.                                                                                  |
| Final-answer revision gate                    | Supported through native hook relay                                              | Codex `Stop` is relayed to `before_agent_finalize`; `revise` asks Codex for one more model pass before finalization.                                                                                       |
| Native shell, patch, and MCP block or observe | Supported through native hook relay                                              | Codex `PreToolUse` and `PostToolUse` are relayed for committed native tool surfaces, including MCP payloads on Codex app-server `0.125.0` or newer. Blocking is supported; argument rewriting is not.      |
| Native permission policy                      | Supported through Codex app-server approvals and compatibility native hook relay | Codex app-server approval requests route through OpenClaw after Codex review. The `PermissionRequest` native hook relay is opt-in for native approval modes because Codex emits it before guardian review. |
| App-server trajectory capture                 | Supported                                                                        | OpenClaw records the request it sent to app-server and the app-server notifications it receives.                                                                                                           |

Not supported in Codex runtime v1:

| Surface                                             | V1 boundary                                                                                                                                     | Future path                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Native tool argument mutation                       | Codex native pre-tool hooks can block, but OpenClaw does not rewrite Codex-native tool arguments.                                               | Requires Codex hook/schema support for replacement tool input.                            |
| Editable Codex-native transcript history            | Codex owns canonical native thread history. OpenClaw owns a mirror and can project future context, but should not mutate unsupported internals. | Add explicit Codex app-server APIs if native thread surgery is needed.                    |
| `tool_result_persist` for Codex-native tool records | That hook transforms OpenClaw-owned transcript writes, not Codex-native tool records.                                                           | Could mirror transformed records, but canonical rewrite needs Codex support.              |
| Rich native compaction metadata                     | OpenClaw observes compaction start and completion, but does not receive a stable kept/dropped list, token delta, or summary payload.            | Needs richer Codex compaction events.                                                     |
| Compaction intervention                             | Current OpenClaw compaction hooks are notification-level in Codex mode.                                                                         | Add Codex pre/post compaction hooks if plugins need to veto or rewrite native compaction. |
| Byte-for-byte model API request capture             | OpenClaw can capture app-server requests and notifications, but Codex core builds the final OpenAI API request internally.                      | Needs a Codex model-request tracing event or debug API.                                   |

## Native permissions and MCP elicitations

For `PermissionRequest`, OpenClaw only returns explicit allow or deny decisions
when policy decides. A no-decision result is not an allow. Codex treats it as no
hook decision and falls through to its own guardian or user approval path.

Codex app-server 核准模式預設會省略這個原生 hook。此行為適用於 `permission_request` 明確包含在 `nativeHookRelay.events` 中，或相容性 runtime 安裝它時。

當操作者為 Codex 原生權限要求選擇 `allow-always` 時，OpenClaw 會在有界的工作階段視窗內記住該精確的 provider/session/tool input/cwd 指紋。記住的決策刻意僅限完全相符：變更的命令、引數、工具 payload 或 cwd 都會產生新的核准。

當 Codex 將 `_meta.codex_approval_kind` 標記為 `"mcp_tool_call"` 時，Codex MCP 工具核准徵詢會透過 OpenClaw 的 Plugin 核准流程路由。Codex `request_user_input` 提示會送回原始聊天，下一則排隊的後續訊息會回應該原生伺服器要求，而不是被導向為額外脈絡。其他 MCP 徵詢要求會以關閉方式失敗。

## 佇列導向

作用中執行的佇列導向會對應到 Codex app-server `turn/steer`。使用預設的 `messages.queue.mode: "steer"` 時，OpenClaw 會在設定的靜默視窗內批次收集排隊的聊天訊息，並依抵達順序將它們作為一個 `turn/steer` 要求送出。舊版 `queue` 模式會送出個別的 `turn/steer` 要求。

Codex review 和手動 Compaction 回合可能會拒絕同一回合導向。在這種情況下，當所選模式允許 fallback 時，OpenClaw 會使用後續佇列。請參閱[導向佇列](/zh-TW/concepts/queue-steering)。

## Codex 意見回饋上傳

當使用原生 Codex harness 的工作階段核准 `/diagnostics [note]` 時，OpenClaw 也會針對相關 Codex thread 呼叫 Codex app-server `feedback/upload`。此上傳會要求 app-server 在可用時包含每個列出 thread 以及衍生 Codex subthread 的記錄。

上傳會透過 Codex 的一般意見回饋路徑傳送到 OpenAI 伺服器。如果該 app-server 停用 Codex 意見回饋，此命令會回傳 app-server 錯誤。完成的診斷回覆會列出已傳送 thread 的 channel、OpenClaw 工作階段 ID、Codex thread ID，以及本機 `codex resume <thread-id>` 命令。

如果你拒絕或忽略核准，OpenClaw 不會印出那些 Codex ID，也不會傳送 Codex 意見回饋。此上傳不會取代本機 Gateway 診斷匯出。關於核准、隱私、本機 bundle 和群組聊天行為，請參閱[診斷匯出](/zh-TW/gateway/diagnostics)。

只有在你明確想要針對目前附加的 thread 上傳 Codex 意見回饋，而不需要完整 Gateway 診斷 bundle 時，才使用 `/codex diagnostics [note]`。

## Compaction 與逐字稿鏡像

當所選模型使用 Codex harness 時，原生 thread Compaction 會委派給 Codex app-server。OpenClaw 會保留逐字稿鏡像，用於 channel 歷史、搜尋、`/new`、`/reset`，以及未來切換模型或 harness。

當 app-server 發出使用者提示、最終 assistant 文字，以及輕量 Codex reasoning 或 plan 記錄時，鏡像會包含這些內容。目前，OpenClaw 只記錄原生 Compaction 開始與完成訊號。它尚未公開可供人閱讀的 Compaction 摘要，或可稽核的 Codex 在 Compaction 後保留哪些項目的清單。

由於 Codex 擁有 canonical 原生 thread，`tool_result_persist` 目前不會重寫 Codex 原生工具結果記錄。它只會在 OpenClaw 正在寫入 OpenClaw 擁有的工作階段逐字稿工具結果時套用。

## 媒體與傳遞

OpenClaw 會繼續擁有媒體傳遞和媒體 provider 選擇。圖片、影片、音樂、PDF、TTS 和媒體理解會使用相符的 provider/model 設定，例如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文字、圖片、影片、音樂、TTS、核准和 messaging-tool 輸出會繼續透過一般 OpenClaw 傳遞路徑。媒體產生不需要 PI。當 Codex 發出帶有 `savedPath` 的原生圖片產生項目時，即使該 Codex 回合沒有 assistant 文字，OpenClaw 也會透過一般回覆媒體路徑轉送該精確檔案。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 參考](/zh-TW/plugins/codex-harness-reference)
- [原生 Codex plugins](/zh-TW/plugins/codex-native-plugins)
- [Plugin hooks](/zh-TW/plugins/hooks)
- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [診斷匯出](/zh-TW/gateway/diagnostics)
- [軌跡匯出](/zh-TW/tools/trajectory)

---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 您會看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 您正在將 Plugin 更新為現代 Plugin 架構
    - 你維護一個外部 OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容性層遷移至現代 Plugin SDK
title: Plugin SDK 遷移
x-i18n:
    generated_at: "2026-05-06T02:54:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1c7521e14a7fb640a0c970cf19fa151e954af0ef14cb8bd8a71d194e5a003ef
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已從廣泛的向後相容層，移轉到採用聚焦且文件化匯入的現代 Plugin
架構。如果你的 Plugin 是在新架構之前建置的，本指南可協助你遷移。

## 正在變更的內容

舊 Plugin 系統提供兩個開放範圍很大的介面，讓 Plugin 能從單一入口點匯入
任何所需內容：

- **`openclaw/plugin-sdk/compat`** — 單一匯入，會重新匯出數十個
  輔助工具。它是為了在新的 Plugin 架構建置期間，讓較舊的 hook 型 Plugin
  持續運作而引入的。
- **`openclaw/plugin-sdk/infra-runtime`** — 廣泛的 runtime 輔助工具 barrel，
  混合了系統事件、Heartbeat 狀態、投遞佇列、fetch/proxy 輔助工具、
  檔案輔助工具、核准類型，以及不相關的工具。
- **`openclaw/plugin-sdk/config-runtime`** — 廣泛的設定相容性 barrel，
  在遷移期間仍保留已棄用的直接載入/寫入輔助工具。
- **`openclaw/extension-api`** — 一個橋接層，讓 Plugin 可直接存取
  host 端輔助工具，例如嵌入式 agent runner。
- **`api.registerEmbeddedExtensionFactory(...)`** — 已移除、僅限 Pi 的 bundled
  extension hook，可觀察嵌入式 runner 事件，例如 `tool_result`。

這些廣泛的匯入介面現在已**棄用**。它們在 runtime 仍可運作，
但新的 Plugin 不得使用它們，既有 Plugin 也應在下一個 major release
移除它們之前完成遷移。僅限 Pi 的嵌入式 extension factory 註冊 API
已移除；請改用 tool-result middleware。

OpenClaw 不會在引入替代方案的同一項變更中，移除或重新解讀已文件化的
Plugin 行為。破壞性 contract 變更必須先經過相容性 adapter、診斷、
文件，以及棄用期間。這適用於 SDK 匯入、manifest 欄位、setup API、
hook，以及 runtime 註冊行為。

<Warning>
  向後相容層將在未來的 major release 中移除。
  仍從這些介面匯入的 Plugin，屆時將會中斷。
  僅限 Pi 的嵌入式 extension factory 註冊已不再載入。
</Warning>

## 為何進行此變更

舊方法造成了問題：

- **啟動緩慢** — 匯入一個輔助工具會載入數十個不相關的模組
- **循環依賴** — 廣泛的重新匯出讓建立匯入循環變得很容易
- **API 介面不清楚** — 無法分辨哪些匯出是穩定的、哪些是內部用的

現代 Plugin SDK 修正了這點：每個匯入路徑（`openclaw/plugin-sdk/\<subpath\>`）
都是小型、自成一體的模組，具備明確用途與文件化 contract。

bundled channel 的舊版 provider 便利 seam 也已移除。
channel 品牌化輔助 seam 是私有 mono-repo 捷徑，而不是穩定的
Plugin contract。請改用範圍狹窄的通用 SDK subpath。在 bundled
Plugin workspace 內，將 provider 擁有的輔助工具保留在該 Plugin 自己的
`api.ts` 或 `runtime-api.ts` 中。

目前的 bundled provider 範例：

- Anthropic 將 Claude 專用的 stream 輔助工具保留在自己的 `api.ts` /
  `contract-api.ts` seam 中
- OpenAI 將 provider builder、預設模型輔助工具，以及 realtime provider
  builder 保留在自己的 `api.ts` 中
- OpenRouter 將 provider builder 以及 onboarding/config 輔助工具保留在自己的
  `api.ts` 中

## Talk 與即時語音遷移計畫

realtime voice、telephony、meeting，以及 browser Talk 程式碼，正在從
surface-local turn bookkeeping 移轉到由
`openclaw/plugin-sdk/realtime-voice` 匯出的共用 Talk session controller。
新的 controller 擁有共用 Talk 事件 envelope、active turn 狀態、capture
狀態、output-audio 狀態、近期事件歷史，以及 stale-turn 拒絕。Provider
Plugin 應繼續擁有 vendor 專用的 realtime session；surface Plugin
應繼續擁有 capture、playback、telephony，以及 meeting 的特殊處理。

這項 Talk 遷移刻意採用乾淨的破壞式變更：

1. 將共用 controller/runtime primitive 保留在
   `plugin-sdk/realtime-voice`。
2. 將 bundled surface 移到共用 controller：browser relay、
   managed-room handoff、voice-call realtime、voice-call streaming STT、Google
   Meet realtime，以及 native push-to-talk。
3. 以最終的 `talk.session.*` 和
   `talk.client.*` API 取代舊的 Talk RPC family。
4. 在 Gateway
   `hello-ok.features.events` 中宣告一個即時 Talk 事件 channel：`talk.event`。
5. 刪除舊的 realtime HTTP endpoint，以及任何 request-time instruction
   override 路徑。

新程式碼不應直接呼叫 `createTalkEventSequencer(...)`，除非它正在實作
低階 adapter 或測試 fixture。請優先使用共用 controller，讓 turn-scoped
事件無法在沒有 turn id 的情況下送出、stale `turnEnd` /
`turnCancel` 呼叫無法清除較新的 active turn，並讓 output-audio lifecycle
事件在 telephony、meeting、browser relay、managed-room handoff，以及原生
Talk client 之間保持一致。

目標 public API 形狀如下：

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

browser 擁有的 WebRTC/provider-websocket session 使用 `talk.client.create`，
因為 browser 擁有 provider negotiation 與 media transport，而 Gateway
擁有 credentials、instructions，以及 tool policy。`talk.session.*` 是
Gateway 管理的共用 surface，適用於 gateway-relay realtime、gateway-relay
transcription，以及 managed-room 原生 STT/TTS session。

將 realtime selector 放在 `talk.provider` /
`talk.providers` 旁的舊版 config，應使用 `openclaw doctor --fix` 修復；runtime Talk
不會將 speech/TTS provider config 重新解讀為 realtime provider config。

支援的 `talk.session.create` 組合刻意維持很小：

| Mode            | Transport       | Brain           | 擁有者             | 備註                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 透過 Gateway 橋接的全雙工 provider audio；tool call 會透過 agent-consult tool 路由。                              |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 僅 streaming STT；呼叫端傳送輸入 audio 並接收 transcript 事件。                                                   |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | push-to-talk 與 walkie-talkie 風格 room，其中 client 擁有 capture/playback，Gateway 擁有 turn 狀態。              |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | 僅限 admin 的 room 模式，供受信任的 first-party surface 直接執行 Gateway tool action。                            |

已移除的方法對照：

| 舊                               | 新                                                       |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 或 `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

統一的 control 詞彙也刻意維持狹窄：

| Method                          | 適用於                                                  | Contract                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 將 base64 PCM audio chunk 附加到同一個 Gateway connection 擁有的 provider session。           |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 開始 managed-room user turn。                                                                 |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在 stale-turn 驗證後結束 active turn。                                                        |
| `talk.session.cancelTurn`       | 所有 Gateway-owned session                              | 取消某個 turn 的 active capture/provider/agent/TTS 工作。                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止 assistant audio output，不一定結束 user turn。                                           |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成 relay 送出的 provider tool call。                                                        |
| `talk.session.close`            | 所有 unified session                                    | 停止 relay session 或撤銷 managed-room 狀態，然後忘記 unified session id。                    |

不要在 core 中引入 provider 或 platform special case 來完成這件事。
Core 擁有 Talk session 語意。Provider Plugin 擁有 vendor session setup。
Voice-call 和 Google Meet 擁有 telephony/meeting adapter。Browser 與原生
app 擁有 device capture/playback UX。

## 相容性政策

對於外部 Plugin，相容性工作遵循以下順序：

1. 新增新的 contract
2. 透過相容性 adapter 保留舊行為的連接
3. 發出診斷或警告，指出舊路徑與替代方案
4. 在測試中涵蓋兩條路徑
5. 文件化棄用與遷移路徑
6. 只在已公告的遷移期間結束後移除，通常是在 major release 中

  維護者可以使用
  `pnpm plugins:boundary-report` 稽核目前的遷移佇列。若需要精簡計數，請使用 `pnpm plugins:boundary-report:summary`；若只查看單一 Plugin 或相容性擁有者，請使用 `--owner <id>`；當 CI gate 應該因到期的相容性記錄、跨擁有者的保留 SDK 匯入，或未使用的保留 SDK 子路徑而失敗時，請使用 `pnpm plugins:boundary-report:ci`。此報告會依移除日期分組已棄用的相容性記錄、計算本機程式碼/文件參照、顯示跨擁有者的保留 SDK 匯入，並摘要私有記憶體主機 SDK 橋接，讓相容性清理保持明確，而不是仰賴臨時搜尋。保留的 SDK 子路徑必須追蹤擁有者使用情況；未使用的保留 helper 匯出應該從公開 SDK 移除。

  如果 manifest 欄位仍被接受，Plugin 作者可以繼續使用，直到文件和診斷另有說明。新程式碼應優先使用已記錄的替代方案，但現有 Plugins 不應在一般 minor 版本發布期間中斷。

  ## 如何遷移

  <Steps>
  <Step title="遷移 runtime config 載入/寫入 helpers">
    Bundled Plugins 應停止直接呼叫
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用已經傳入作用中呼叫路徑的 config。需要目前 process snapshot 的長生命週期 handlers 可以使用 `api.runtime.config.current()`。長生命週期 agent tools 應在 `execute` 內使用 tool context 的 `ctx.getRuntimeConfig()`，讓 config 寫入前建立的 tool 仍能看到重新整理後的 runtime config。

    Config 寫入必須透過 transactional helpers，並選擇 after-write policy：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當 caller 知道變更需要乾淨的 gateway restart 時，請使用 `afterWrite: { mode: "restart", reason: "..." }`；只有在 caller 擁有後續處理，且刻意想抑制 reload planner 時，才使用 `afterWrite: { mode: "none", reason: "..." }`。Mutation 結果包含型別化的 `followUp` 摘要，供測試與記錄使用；gateway 仍負責套用或排程 restart。`loadConfig` 和 `writeConfigFile` 在遷移期間仍作為外部 Plugins 的已棄用相容性 helpers，並會使用 `runtime-config-load-write` 相容性代碼警告一次。Bundled Plugins 與 repo runtime 程式碼受到 `pnpm check:deprecated-internal-config-api` 和 `pnpm check:no-runtime-action-load-config` 的 scanner guardrails 保護：新的 production Plugin 使用會直接失敗，直接 config 寫入會失敗，gateway server methods 必須使用 request runtime snapshot，runtime channel send/action/client helpers 必須從其邊界接收 config，而長生命週期 runtime modules 允許的 ambient `loadConfig()` 呼叫數量為零。

    新 Plugin 程式碼也應避免匯入寬泛的
    `openclaw/plugin-sdk/config-runtime` 相容性 barrel。請使用符合工作的窄範圍 SDK 子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | Config types，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | 已載入 config 斷言與 plugin-entry config 查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前 runtime snapshot 讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config 寫入 | `openclaw/plugin-sdk/config-mutation` |
    | Session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugins 及其測試都受到 scanner 保護，避免使用寬泛 barrel，讓匯入與 mock 保持在所需行為的本機範圍內。寬泛 barrel 仍為外部相容性存在，但新程式碼不應依賴它。

  </Step>

  <Step title="將 Pi tool-result extensions 遷移到 middleware">
    Bundled Plugins 必須將 Pi-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers 替換為 runtime-neutral middleware。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時更新 Plugin manifest：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 Plugins 無法註冊 tool-result middleware，因為它可以在 model 看到高信任度 tool output 前重寫該輸出。

  </Step>

  <Step title="將 approval-native handlers 遷移到 capability facts">
    具備 approval 能力的 channel Plugins 現在透過
    `approvalCapability.nativeRuntime` 加上 shared runtime-context registry 暴露 native approval behavior。

    主要變更：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`
    - 將 approval-specific auth/delivery 從 legacy `plugin.auth` /
      `plugin.approvals` wiring 移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已從 public channel-plugin contract 移除；將 delivery/native/render fields 移到 `approvalCapability`
    - `plugin.auth` 僅保留給 channel login/logout flows；core 不再讀取那裡的 approval auth hooks
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊 channel-owned runtime objects，例如 clients、tokens 或 Bolt apps
    - 不要從 native approval handlers 傳送 plugin-owned reroute notices；core 現在會根據實際 delivery results 擁有 routed-elsewhere notices
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供真正的 `createPluginRuntime().channel` surface。Partial stubs 會被拒絕。

    請參閱 `/plugins/sdk-channel-plugins` 了解目前的 approval capability 版面。

  </Step>

  <Step title="稽核 Windows wrapper fallback behavior">
    如果你的 Plugin 使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` wrappers 現在會 fail closed，除非你明確傳入
    `allowShellFallback: true`。

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    如果你的 caller 並非刻意依賴 shell fallback，請不要設定
    `allowShellFallback`，並改為處理擲出的 error。

  </Step>

  <Step title="尋找已棄用的 imports">
    在你的 Plugin 中搜尋來自任一已棄用 surface 的 imports：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替換為聚焦的 imports">
    舊 surface 的每個 export 都對應到特定的現代 import path：

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    對於 host-side helpers，請使用注入的 Plugin runtime，而不是直接匯入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    相同模式適用於其他 legacy bridge helpers：

    | 舊 import | 現代等價項 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替換寬泛的 infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` 仍為外部相容性存在，但新程式碼應匯入實際需要的聚焦 helper surface：

    | 需求 | 匯入 |
    | --- | --- |
    | System event queue helpers | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat event and visibility helpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pending delivery queue drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel activity telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Safe local-file/media path helpers | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy and guarded fetch helpers | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF dispatcher policy types | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Approval request/resolution types | `openclaw/plugin-sdk/approval-runtime` |
    | Approval reply payload and command helpers | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Error formatting helpers | `openclaw/plugin-sdk/error-runtime` |
    | Transport readiness waits | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Secure token helpers | `openclaw/plugin-sdk/secure-random-runtime` |
    | Bounded async task concurrency | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numeric coercion | `openclaw/plugin-sdk/number-runtime` |
    | Process-local async lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | File locks | `openclaw/plugin-sdk/file-lock` |

    Bundled Plugins 受到 scanner 保護，避免使用 `infra-runtime`，因此 repo 程式碼無法退回到寬泛 barrel。

  </Step>

  <Step title="遷移 channel route helpers">
    新的 channel route 程式碼應使用 `openclaw/plugin-sdk/channel-route`。
    較舊的 route-key 與 comparable-target 名稱在遷移期間仍作為相容性 aliases 保留，但新 Plugins 應使用直接描述行為的 route 名稱：

    | 舊 helper | 現代 helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助程式會在原生核准、回覆抑制、入站去重、
    Cron 遞送和工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。
    如果你的 Plugin 擁有自訂目標文法，請使用 `resolveChannelRouteTargetWithParser(...)`
    將該剖析器調整為相同的路由目標契約。

  </Step>

  <Step title="建置與測試">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 匯入路徑參考

  <Accordion title="常用匯入路徑表">
  | 匯入路徑 | 用途 | 主要匯出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準 Plugin 進入點輔助程式 | `definePluginEntry` |
  | `plugin-sdk/core` | 舊版通用重新匯出，用於頻道進入點定義/建構器 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定結構描述匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一提供者進入點輔助程式 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的頻道進入點定義與建構器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助程式 | 允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定期間執行階段輔助程式 | 匯入安全的設定修補配接器、查詢註記輔助程式、`promptResolvedAllowFrom`, `splitSetupEntries`, 委派設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 設定配接器輔助程式 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 設定工具輔助程式 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳戶輔助程式 | 帳戶清單/設定/動作閘門輔助程式 |
  | `plugin-sdk/account-id` | 帳戶 ID 輔助程式 | `DEFAULT_ACCOUNT_ID`, 帳戶 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳戶查詢輔助程式 | 帳戶查詢 + 預設備援輔助程式 |
  | `plugin-sdk/account-helpers` | 精簡帳戶輔助程式 | 帳戶清單/帳戶動作輔助程式 |
  | `plugin-sdk/channel-setup` | 設定精靈配接器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配對基本元件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前置詞、輸入中狀態與來源投遞接線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定配接器工廠與 DM 存取輔助程式 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定結構描述建構器 | 共用頻道設定結構描述基本元件，以及僅限通用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 綑綁設定結構描述 | 僅限 OpenClaw 維護的綑綁 Plugin；新 Plugin 必須定義 Plugin 本機結構描述 |
  | `plugin-sdk/channel-config-schema-legacy` | 已棄用的綑綁設定結構描述 | 僅限相容性別名；維護中的綑綁 Plugin 請使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令設定輔助程式 | 命令名稱正規化、描述修剪、重複/衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組/DM 政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 帳戶狀態與草稿串流生命週期輔助程式 | `createAccountStatusSink`, 草稿預覽完成輔助程式 |
  | `plugin-sdk/inbound-envelope` | 傳入信封輔助程式 | 共用路由 + 信封建構器輔助程式 |
  | `plugin-sdk/inbound-reply-dispatch` | 傳入回覆輔助程式 | 共用記錄並分派輔助程式 |
  | `plugin-sdk/messaging-targets` | 訊息目標剖析 | 目標剖析/比對輔助程式 |
  | `plugin-sdk/outbound-media` | 傳出媒體輔助程式 | 共用傳出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 傳出傳送相依性輔助程式 | 輕量 `resolveOutboundSendDep` 查詢，不匯入完整傳出執行階段 |
  | `plugin-sdk/outbound-runtime` | 傳出執行階段輔助程式 | 傳出投遞、身分/傳送委派、工作階段、格式化與承載規劃輔助程式 |
  | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結輔助程式 | 執行緒繫結生命週期與配接器輔助程式 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體承載輔助程式 | 適用於舊版欄位版面的代理程式媒體承載建構器 |
  | `plugin-sdk/channel-runtime` | 已棄用的相容性 shim | 僅限舊版頻道執行階段公用程式 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久性 Plugin 儲存空間 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣泛的執行階段輔助程式 | 執行階段/記錄/備份/Plugin 安裝輔助程式 |
  | `plugin-sdk/runtime-env` | 精簡執行階段環境輔助程式 | 記錄器/執行階段環境、逾時、重試與退避輔助程式 |
  | `plugin-sdk/plugin-runtime` | 共用 Plugin 執行階段輔助程式 | Plugin 命令/掛鉤/http/互動式輔助程式 |
  | `plugin-sdk/hook-runtime` | 掛鉤管線輔助程式 | 共用 Webhook/內部掛鉤管線輔助程式 |
  | `plugin-sdk/lazy-runtime` | 延遲執行階段輔助程式 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助程式 | 共用 exec 輔助程式 |
  | `plugin-sdk/cli-runtime` | CLI 執行階段輔助程式 | 命令格式化、等待、版本輔助程式 |
  | `plugin-sdk/gateway-runtime` | Gateway 輔助程式 | Gateway 用戶端、事件迴圈就緒啟動輔助程式，以及頻道狀態修補輔助程式 |
  | `plugin-sdk/config-runtime` | 已棄用的設定相容性 shim | 偏好使用 `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令輔助程式 | 綑綁 Telegram 合約介面無法使用時，提供備援穩定的 Telegram 命令驗證輔助程式 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助程式 | Exec/Plugin 核准承載、核准能力/設定檔輔助程式、原生核准路由/執行階段輔助程式，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准驗證輔助程式 | 核准者解析、同一聊天動作驗證 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助程式 | 原生 exec 核准設定檔/篩選器輔助程式 |
  | `plugin-sdk/approval-delivery-runtime` | 核准投遞輔助程式 | 原生核准能力/投遞配接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准 Gateway 輔助程式 | 共用核准 Gateway 解析輔助程式 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准配接器輔助程式 | 適用於熱門頻道進入點的輕量原生核准配接器載入輔助程式 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理器輔助程式 | 更廣泛的核准處理器執行階段輔助程式；當較精簡的配接器/Gateway 介面足夠時，偏好使用它們 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助程式 | 原生核准目標/帳戶繫結輔助程式 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助程式 | Exec/Plugin 核准回覆承載輔助程式 |
  | `plugin-sdk/channel-runtime-context` | 頻道執行階段內容輔助程式 | 通用頻道執行階段內容註冊/取得/監看輔助程式 |
  | `plugin-sdk/security-runtime` | 安全輔助程式 | 共用信任、DM 閘控、根目錄範圍限定的檔案/路徑輔助程式、外部內容與秘密收集輔助程式 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助程式 | 主機允許清單與私人網路政策輔助程式 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助程式 | 固定的分派器、受保護的 fetch、SSRF 政策輔助程式 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助程式 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 輔助程式 | Heartbeat 事件與可見性輔助程式 |
  | `plugin-sdk/delivery-queue-runtime` | 投遞佇列輔助程式 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 頻道活動輔助程式 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 重複資料刪除輔助程式 | 記憶體內重複資料刪除快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助程式 | 安全的本機檔案/媒體路徑輔助程式 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助程式 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助程式 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘控輔助程式 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤格式化輔助程式 | `formatUncaughtError`, `isApprovalNotFoundError`, 錯誤圖輔助程式 |
  | `plugin-sdk/fetch-runtime` | 包裝的 fetch/代理輔助程式 | `resolveFetch`, 代理輔助程式、EnvHttpProxyAgent 選項輔助程式 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助程式 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助程式 | `RetryConfig`, `retryAsync`, 政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允許清單輸入對應 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令閘控與命令介面輔助程式 | `resolveControlCommandGate`, 傳送者授權輔助程式、命令登錄輔助程式，包括動態引數選單格式化 |
  | `plugin-sdk/command-status` | 命令狀態/說明轉譯器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 秘密輸入剖析 | 秘密輸入輔助程式 |
  | `plugin-sdk/webhook-ingress` | Webhook 請求輔助程式 | Webhook 目標公用程式 |
  | `plugin-sdk/webhook-request-guards` | Webhook 主體防護輔助程式 | 請求主體讀取/限制輔助程式 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 傳入分派、Heartbeat、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 精簡回覆分派輔助程式 | 完成、提供者分派與對話標籤輔助程式 |
  | `plugin-sdk/reply-history` | 回覆歷史輔助程式 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助程式 | 文字/markdown 分塊輔助程式 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助程式 | 儲存路徑 + 更新時間輔助程式 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助程式 | 狀態與 OAuth 目錄輔助程式 |
  | `plugin-sdk/routing` | 路由/工作階段金鑰輔助程式 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 工作階段金鑰正規化輔助程式 |
  | `plugin-sdk/status-helpers` | 頻道狀態輔助程式 | 頻道/帳戶狀態摘要建構器、執行階段狀態預設值、問題中繼資料輔助程式 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助程式 | 共用目標解析器輔助程式 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助程式 | slug/字串正規化輔助程式 |
  | `plugin-sdk/request-url` | 請求 URL 輔助程式 | 從類請求輸入擷取字串 URL |
  | `plugin-sdk/run-command` | 定時命令輔助程式 | 具正規化 stdout/stderr 的定時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具/CLI 參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具負載擷取 | 從工具結果物件擷取正規化負載 |
  | `plugin-sdk/tool-send` | 工具傳送擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆類型 | 回覆負載類型 |
  | `plugin-sdk/provider-setup` | 精選本機/自行託管提供者設定輔助工具 | 自行託管提供者探索/設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 專注的 OpenAI 相容自行託管提供者設定輔助工具 | 相同的自行託管提供者探索/設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供者執行階段驗證輔助工具 | 執行階段 API-key 解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供者 API-key 設定輔助工具 | API-key 到職/profile 寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 提供者驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-auth-login` | 提供者互動式登入輔助工具 | 共用互動式登入輔助工具 |
  | `plugin-sdk/provider-selection-runtime` | 提供者選取輔助工具 | 已設定或自動提供者選取，以及原始提供者設定合併 |
  | `plugin-sdk/provider-env-vars` | 提供者 env-var 輔助工具 | 提供者驗證 env-var 查詢輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用提供者模型/重播輔助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播原則建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用提供者目錄輔助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供者到職修補 | 到職設定輔助工具 |
  | `plugin-sdk/provider-http` | 提供者 HTTP 輔助工具 | 通用提供者 HTTP/端點能力輔助工具，包含音訊轉錄 multipart 表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供者 web-fetch 輔助工具 | Web-fetch 提供者註冊/快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供者網頁搜尋設定輔助工具 | 適用於不需要 Plugin 啟用接線之提供者的窄幅網頁搜尋設定/認證輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供者網頁搜尋合約輔助工具 | 窄幅網頁搜尋設定/認證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍的認證設定器/取得器 |
  | `plugin-sdk/provider-web-search` | 提供者網頁搜尋輔助工具 | 網頁搜尋提供者註冊/快取/執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 提供者工具/schema 相容性輔助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供者用量輔助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供者用量輔助工具 |
  | `plugin-sdk/provider-stream` | 提供者串流包裝器輔助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器類型，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供者傳輸輔助工具 | 原生提供者傳輸輔助工具，例如受保護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取/轉換/儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體負載建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 影像/影片/音樂生成的共用容錯移轉輔助工具、候選項選取，以及缺少模型訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解提供者類型，加上提供者面向的影像/音訊輔助工具匯出 |
  | `plugin-sdk/text-runtime` | 共用文字輔助工具 | 助理可見文字剝除、Markdown 算繪/分塊/表格輔助工具、遮蔽輔助工具、指令標籤輔助工具、安全文字工具，以及相關文字/記錄輔助工具 |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 對外文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音提供者類型，加上提供者面向的指令、登錄、驗證輔助工具，以及 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音提供者類型、登錄、指令、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 提供者類型、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 提供者類型、登錄/解析輔助工具、橋接工作階段輔助工具、共用代理程式回話佇列、逐字稿/事件健康狀態、回音抑制，以及快速脈絡諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 影像生成輔助工具 | 影像生成提供者類型，加上影像資產/data URL 輔助工具，以及 OpenAI 相容影像提供者建構器 |
  | `plugin-sdk/image-generation-core` | 共用影像生成核心 | 影像生成類型、容錯移轉、驗證，以及登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成提供者/請求/結果類型 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成類型、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成提供者/請求/結果類型 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成類型、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆負載正規化/縮減 |
  | `plugin-sdk/channel-config-primitives` | 頻道設定基元 | 窄幅頻道設定 schema 基元 |
  | `plugin-sdk/channel-config-writes` | 頻道設定寫入輔助工具 | 頻道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用頻道前置 | 共用頻道 Plugin 前置匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共用頻道狀態快照/摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯/讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm` | 直接 DM 輔助工具 | 共用直接 DM 驗證/防護輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充功能輔助工具 | 被動頻道/狀態與環境代理輔助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目標輔助工具 | Webhook 目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | Webhook 路徑輔助工具 | Webhook 路徑正規化輔助工具 |
  | `plugin-sdk/web-media` | 共用網頁媒體輔助工具 | 遠端/本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | Zod 重新匯出 | 為 Plugin SDK 使用者重新匯出的 `zod` |
  | `plugin-sdk/memory-core` | 內建 memory-core 輔助工具 | 記憶管理器/設定/檔案/CLI 輔助工具表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶引擎執行階段 facade | 記憶索引/搜尋執行階段 facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎 | 記憶主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入引擎 | 記憶嵌入合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具；具體遠端提供者位於其所屬 Plugin |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎 | 記憶主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎 | 記憶主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 | 記憶主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 | 記憶主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶主機祕密輔助工具 | 記憶主機祕密輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 記憶主機事件日誌輔助工具 | 記憶主機事件日誌輔助工具 |
  | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 | 記憶主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機 CLI 執行階段 | 記憶主機 CLI 執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段 | 記憶主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 | 記憶主機檔案/執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段別名 | 記憶主機核心執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-events` | 記憶主機事件日誌別名 | 記憶主機事件日誌輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-files` | 記憶主機檔案/執行階段別名 | 記憶主機檔案/執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-markdown` | 受管理 Markdown 輔助工具 | 適用於記憶相鄰 Plugin 的共用受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | Active Memory 搜尋 facade | 延遲載入的 active-memory 搜尋管理器執行階段 facade |
  | `plugin-sdk/memory-host-status` | 記憶主機狀態別名 | 記憶主機狀態輔助工具的供應商中立別名 |
  | `plugin-sdk/testing` | 測試工具 | 舊版廣泛相容性 barrel；偏好使用聚焦的測試子路徑，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`，以及 `plugin-sdk/test-fixtures` |
</Accordion>

這張表刻意只列出常見遷移子集，而不是完整的 SDK
介面範圍。200 多個入口點的完整清單位於
`scripts/lib/plugin-sdk-entrypoints.json`。

保留的內建 Plugin 輔助銜接點已從公開 SDK
匯出映射中退休，但明確記錄的相容性門面例外，例如為已發布的
`@openclaw/discord@2026.3.13` 套件保留的已棄用
`plugin-sdk/discord` 相容層。擁有者專屬輔助函式位於擁有該行為的
Plugin 套件內；共享的主機行為應透過通用 SDK
契約移動，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用符合工作的最精確 import。如果找不到匯出項目，請查看
`src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用契約擁有它。

## 目前有效的棄用項目

適用於 Plugin SDK、供應商契約、執行階段介面和資訊清單的較精確棄用項目。每一項目前仍可運作，但會在未來的重大版本中移除。每個項目下方的條目會將舊 API 對應到其標準替代項。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 → command-status">
    **舊 (`openclaw/plugin-sdk/command-auth`)**：`buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**：相同簽章、相同
    匯出，只是從更精確的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性存根。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及閘控輔助函式 → resolveInboundMentionDecision">
    **舊**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，會回傳單一
    決策物件，而不是拆成兩次呼叫。

    下游通道 Plugin（Slack、Discord、Matrix、MS Teams）已經切換完成。

  </Accordion>

  <Accordion title="通道執行階段相容層與通道 actions 輔助函式">
    `openclaw/plugin-sdk/channel-runtime` 是供較舊通道 Plugin 使用的相容性相容層。
    新程式碼不要匯入它；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 註冊執行階段物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助函式
    會與原始 `"actions"` 通道匯出一起棄用。請改為透過語意化的
    `presentation` 介面公開能力，通道 Plugin
    宣告它們會呈現什麼（卡片、按鈕、選單），而不是它們接受哪些原始
    action 名稱。

  </Accordion>

  <Accordion title="網頁搜尋供應商 tool() 輔助函式 → Plugin 上的 createTool()">
    **舊**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` factory。

    **新**：直接在供應商 Plugin 上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助函式來註冊工具包裝器。

  </Accordion>

  <Accordion title="純文字通道封套 → BodyForAgent">
    **舊**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用來從傳入通道訊息建立扁平的純文字提示封套。

    **新**：`BodyForAgent` 加上結構化的使用者情境區塊。通道
    Plugin 會將路由中繼資料（thread、topic、reply-to、reactions）作為
    型別化欄位附加，而不是串接到提示字串中。
    `formatAgentEnvelope(...)` 輔助函式仍支援合成的面向助理封套，
    但傳入純文字封套正在淘汰中。

    受影響區域：`inbound_claim`、`message_received`，以及任何對
    `channelEnvelope` 文字進行後處理的自訂通道 Plugin。

  </Accordion>

  <Accordion title="供應商探索型別 → 供應商目錄型別">
    四個探索型別別名現在是目錄時代型別的薄包裝：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另外還有舊版 `ProviderCapabilities` 靜態集合，供應商 Plugin
    應使用明確的供應商掛鉤，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是靜態物件。

  </Accordion>

  <Accordion title="思考政策掛鉤 → resolveThinkingProfile">
    **舊**（`ProviderThinkingPolicy` 上的三個獨立掛鉤）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：單一 `resolveThinkingProfile(ctx)`，會回傳
    `ProviderThinkingProfile`，其中包含標準 `id`、選用 `label`，以及
    已排序的層級清單。OpenClaw 會依設定檔排名自動降級過時的已儲存值。

    請實作一個掛鉤，而不是三個。舊版掛鉤在棄用期間仍會運作，
    但不會與設定檔結果組合。

  </Accordion>

  <Accordion title="外部 OAuth 供應商後備 → contracts.externalAuthProviders">
    **舊**：實作 `resolveExternalOAuthProfiles(...)`，但未在
    Plugin 資訊清單中宣告供應商。

    **新**：在 Plugin 資訊清單中宣告 `contracts.externalAuthProviders`
    **並且**實作 `resolveExternalAuthProfiles(...)`。舊的「auth
    後備」路徑會在執行階段發出警告，之後將被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="供應商環境變數查詢 → setup.providers[].envVars">
    **舊**資訊清單欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：將相同的環境變數查詢鏡像到資訊清單上的
    `setup.providers[].envVars`。這會將設定/狀態環境中繼資料整合到同一個位置，
    並避免只是為了回答環境變數查詢就啟動 Plugin 執行階段。

    `providerAuthEnvVars` 會透過相容性轉接器持續支援，直到棄用期間結束。

  </Accordion>

  <Accordion title="記憶 Plugin 註冊 → registerMemoryCapability">
    **舊**：三個獨立呼叫：
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新**：記憶狀態 API 上的一個呼叫：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同 slot，單一註冊呼叫。附加式記憶輔助函式
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影響。

  </Accordion>

  <Accordion title="子代理工作階段訊息型別已重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。簽章相同；舊方法會呼叫到新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **舊**：`runtime.tasks.flow`（單數）會回傳即時任務流程存取器。

    **新**：`runtime.tasks.managedFlows` 會保留受管理的 TaskFlow 變更
    執行階段，供從流程建立、更新、取消或執行子任務的 Plugin 使用。
    當 Plugin 只需要基於 DTO 的讀取時，請使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式擴充工廠 → 代理工具結果中介層">
    已在上方「如何遷移 → 將 Pi 工具結果擴充遷移至中介層」中說明。
    此處為完整性而列出：已移除的 Pi 專用
    `api.registerEmbeddedExtensionFactory(...)` 路徑，會由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中明確列出執行階段清單。
  </Accordion>

  <Accordion title="OpenClawSchemaType 別名 → OpenClawConfig">
    從 `openclaw/plugin-sdk` 重新匯出的 `OpenClawSchemaType` 現在是
    `OpenClawConfig` 的單行別名。請優先使用標準名稱。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Extension 層級的棄用項目（位於 `extensions/` 下的內建通道/供應商
Plugin 內）會在各自的 `api.ts` 和 `runtime-api.ts`
彙整匯出檔中追蹤。它們不會影響第三方 Plugin 契約，因此不列在這裡。
如果你直接使用內建 Plugin 的本機彙整匯出檔，升級前請先閱讀該彙整匯出檔中的棄用註解。
</Note>

## 移除時程

| 時間                   | 會發生什麼                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**               | 已棄用的介面會發出執行階段警告                               |
| **下一個重大版本**     | 已棄用的介面將被移除；仍使用它們的 Plugin 將會失敗 |

所有核心 Plugin 都已完成遷移。外部 Plugin 應在下一個重大版本前遷移。

## 暫時抑制警告

遷移期間可設定這些環境變數：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時的逃生口，而不是永久解法。

## 相關內容

- [開始使用](/zh-TW/plugins/building-plugins)：建立你的第一個 Plugin
- [SDK 概覽](/zh-TW/plugins/sdk-overview)：完整子路徑 import 參考
- [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins)：建置通道 Plugin
- [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins)：建置供應商 Plugin
- [Plugin 內部架構](/zh-TW/plugins/architecture)：架構深入解析
- [Plugin 資訊清單](/zh-TW/plugins/manifest)：資訊清單結構描述參考

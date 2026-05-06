---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你曾在 OpenClaw 2026.4.25 之前使用 api.registerEmbeddedExtensionFactory
    - 你正在將 Plugin 更新至現代 Plugin 架構
    - 你維護一個外部 OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代化 Plugin SDK
title: Plugin SDK 遷移
x-i18n:
    generated_at: "2026-05-06T09:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已從廣泛的向後相容層，移轉到具備聚焦且有文件記載之匯入項目的現代 Plugin
架構。如果你的 Plugin 是在新架構之前建置的，本指南可協助你遷移。

## 有哪些變更

舊的 Plugin 系統提供了兩個開放範圍很大的介面，讓 Plugin 能從單一入口點匯入
任何需要的內容：

- **`openclaw/plugin-sdk/compat`** - 單一匯入項目，重新匯出數十個
  輔助工具。它的引入是為了在新的 Plugin 架構建置期間，讓較舊的 hook-based Plugin
  能繼續運作。
- **`openclaw/plugin-sdk/infra-runtime`** - 廣泛的執行階段輔助 barrel，混合了
  系統事件、Heartbeat 狀態、傳遞佇列、fetch/proxy 輔助工具、
  檔案輔助工具、核准類型，以及不相關的公用工具。
- **`openclaw/plugin-sdk/config-runtime`** - 廣泛的設定相容性 barrel，
  在遷移期間仍保留已棄用的直接載入/寫入輔助工具。
- **`openclaw/extension-api`** - 一個橋接層，讓 Plugin 能直接存取
  主機端輔助工具，例如內嵌的代理執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除的 Pi-only bundled
  extension hook，可觀察內嵌執行器事件，例如
  `tool_result`。

這些廣泛的匯入介面現在已**棄用**。它們在執行階段仍可運作，
但新的 Plugin 不得使用它們，既有 Plugin 也應在下一個主要版本移除它們之前
完成遷移。Pi-only embedded extension factory 註冊 API 已移除；請改用 tool-result
middleware。

OpenClaw 不會在導入替代方案的同一項變更中，移除或重新解讀已記載於文件的 Plugin 行為。
破壞性合約變更必須先經過相容性配接器、診斷、文件，以及棄用期間。
這適用於 SDK 匯入、manifest 欄位、設定 API、hook，以及執行階段
註冊行為。

<Warning>
  向後相容層將在未來的主要版本中移除。
  仍從這些介面匯入的 Plugin 屆時將會中斷。
  Pi-only embedded extension factory 註冊已經不再載入。
</Warning>

## 為什麼要做這項變更

舊方法造成了問題：

- **啟動緩慢** - 匯入一個輔助工具會載入數十個不相關的模組
- **循環依賴** - 廣泛的重新匯出很容易建立匯入循環
- **API 介面不清楚** - 無法判斷哪些匯出是穩定的，哪些屬於內部使用

現代 Plugin SDK 解決了這個問題：每個匯入路徑（`openclaw/plugin-sdk/\<subpath\>`）
都是小型、自包含的模組，具備明確用途與文件化合約。

Bundled channels 的舊版 provider 便利 seam 也已移除。
Channel-branded 輔助 seam 是私有 mono-repo 捷徑，而不是穩定的
Plugin 合約。請改用範圍狹窄的通用 SDK 子路徑。在 bundled
Plugin 工作區內，將 provider-owned 輔助工具保留在該 Plugin 自己的 `api.ts` 或
`runtime-api.ts` 中。

目前的 bundled provider 範例：

- Anthropic 將 Claude-specific 串流輔助工具保留在自己的 `api.ts` /
  `contract-api.ts` seam 中
- OpenAI 將 provider 建構器、預設模型輔助工具，以及 realtime provider
  建構器保留在自己的 `api.ts` 中
- OpenRouter 將 provider 建構器與 onboarding/config 輔助工具保留在自己的
  `api.ts` 中

## Talk 和即時語音遷移計畫

即時語音、電話、會議，以及瀏覽器 Talk 程式碼正在從
各介面本地的 turn bookkeeping，移轉到由
`openclaw/plugin-sdk/realtime-voice` 匯出的共享 Talk 工作階段控制器。新的控制器負責共同的 Talk
事件信封、active turn 狀態、擷取狀態、輸出音訊狀態、近期
事件歷史，以及 stale-turn 拒絕。Provider Plugin 應繼續負責
vendor-specific 即時工作階段；介面 Plugin 應繼續負責擷取、
播放、電話與會議的特殊處理。

此 Talk 遷移刻意採取乾淨破壞式變更：

1. 將共享控制器/執行階段基本元件保留在
   `plugin-sdk/realtime-voice`。
2. 將 bundled surfaces 移到共享控制器上：browser relay、
   managed-room handoff、voice-call realtime、voice-call streaming STT、Google
   Meet realtime，以及 native push-to-talk。
3. 以最終的 `talk.session.*` 和
   `talk.client.*` API 取代舊的 Talk RPC 系列。
4. 在 Gateway
   `hello-ok.features.events` 中公告一個即時 Talk 事件通道：`talk.event`。
5. 刪除舊的即時 HTTP endpoint，以及任何 request-time instruction
   override 路徑。

新程式碼不應直接呼叫 `createTalkEventSequencer(...)`，除非它是在
實作低階 adapter 或測試 fixture。請優先使用共享控制器，
如此一來，turn-scoped 事件就無法在沒有 turn id 的情況下發出、過期的 `turnEnd` /
`turnCancel` 呼叫無法清除較新的 active turn，且 output-audio lifecycle
事件在電話、會議、browser relay、managed-room
handoff，以及 native Talk client 之間都能保持一致。

目標公開 API 形狀如下：

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

Browser-owned WebRTC/provider-websocket 工作階段使用 `talk.client.create`，
因為瀏覽器負責 provider negotiation 和媒體傳輸，而
Gateway 負責憑證、指令與工具政策。`talk.session.*` 是
Gateway-managed 的共用介面，適用於 gateway-relay realtime、gateway-relay
transcription，以及 managed-room native STT/TTS 工作階段。

將即時選擇器放在 `talk.provider` /
`talk.providers` 旁邊的舊版設定，應使用 `openclaw doctor --fix` 修復；執行階段 Talk
不會將 speech/TTS provider config 重新解讀為 realtime provider config。

支援的 `talk.session.create` 組合刻意維持很小：

| 模式            | 傳輸       | Brain           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 全雙工 provider 音訊透過 Gateway 橋接；工具呼叫會透過 agent-consult 工具路由。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 僅串流 STT；呼叫端傳送輸入音訊並接收轉錄事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-talk 和 walkie-talkie 風格的 room，其中 client 負責擷取/播放，Gateway 負責 turn 狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | 僅限管理員的 room 模式，供受信任的第一方介面直接執行 Gateway 工具動作。                  |

已移除的方法對照表：

| 舊                              | 新                                                      |
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

統一的控制詞彙也刻意維持狹窄：

| 方法                          | 適用於                                              | 合約                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 將 base64 PCM 音訊片段附加到同一 Gateway 連線所擁有的 provider 工作階段。 |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 啟動 managed-room 使用者 turn。                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在 stale-turn 驗證後結束 active turn。                                              |
| `talk.session.cancelTurn`       | 所有 Gateway-owned 工作階段                              | 取消某個 turn 的 active capture/provider/agent/TTS 工作。                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，不一定要結束使用者 turn。                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成 relay 發出的 provider 工具呼叫。                                           |
| `talk.session.close`            | 所有統一工作階段                                    | 停止 relay 工作階段或撤銷 managed-room 狀態，然後忘記統一工作階段 id。         |

不要在 core 中引入 provider 或 platform 特例來讓這項工作運作。
Core 負責 Talk 工作階段語意。Provider Plugin 負責 vendor 工作階段設定。
Voice-call 和 Google Meet 負責電話/會議 adapter。瀏覽器與 native
app 負責裝置擷取/播放 UX。

## 相容性政策

對於外部 Plugin，相容性工作遵循以下順序：

1. 新增新合約
2. 透過相容性配接器保留舊行為的接線
3. 發出診斷或警告，指出舊路徑與替代項目
4. 在測試中涵蓋兩條路徑
5. 記錄棄用與遷移路徑
6. 僅在公告的遷移期間結束後移除，通常是在主要版本中

  維護者可以使用
  `pnpm plugins:boundary-report` 稽核目前的遷移佇列。使用 `pnpm plugins:boundary-report:summary` 取得
  精簡計數，使用 `--owner <id>` 查看單一 Plugin 或相容性擁有者，並在 CI gate 應因到期的
  相容性記錄、跨擁有者的保留 SDK 匯入，或未使用的保留 SDK
  子路徑而失敗時使用 `pnpm plugins:boundary-report:ci`。報告會依移除日期分組已棄用的
  相容性記錄、計算本機程式碼/文件參照、浮現跨擁有者的保留 SDK 匯入，並摘要私有
  memory-host SDK 橋接，讓相容性清理保持明確，而不是依賴臨時搜尋。保留的 SDK 子路徑必須有追蹤的擁有者使用情況；
  未使用的保留 helper 匯出應從公開 SDK 中移除。

  如果 manifest 欄位仍被接受，Plugin 作者可以繼續使用，直到
  文件與診斷另有說明。新程式碼應優先使用已文件化的
  替代方案，但現有 Plugin 不應在一般 minor
  版本期間中斷。

  ## 如何遷移

  <Steps>
  <Step title="遷移執行階段 config 載入/寫入 helper">
    Bundled plugins 應停止直接呼叫
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用
    已傳入目前作用中呼叫路徑的 config。需要目前程序快照的長期存在 handler
    可以使用 `api.runtime.config.current()`。長期存在的 agent tools 應在
    `execute` 內使用 tool context 的 `ctx.getRuntimeConfig()`，讓 tool 即使是在 config 寫入前建立，
    仍能看到重新整理後的執行階段 config。

    Config 寫入必須透過交易式 helper，並選擇
    寫入後原則：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當呼叫端知道變更需要乾淨地重新啟動 gateway 時，使用 `afterWrite: { mode: "restart", reason: "..." }`；
    只有在呼叫端擁有後續處理，並刻意想抑制 reload planner 時，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    Mutation 結果會包含 typed `followUp` 摘要，供測試與記錄使用；
    gateway 仍負責套用或排程重新啟動。
    `loadConfig` 和 `writeConfigFile` 在遷移期間仍作為外部 Plugin 的已棄用相容性
    helper 保留，並以
    `runtime-config-load-write` 相容性代碼警告一次。Bundled plugins 與 repo
    執行階段程式碼受到
    `pnpm check:deprecated-internal-config-api` 和
    `pnpm check:no-runtime-action-load-config` 的 scanner guardrails 保護：新的 production Plugin 使用會直接失敗，
    直接 config 寫入會失敗，gateway server 方法必須使用
    request runtime snapshot，runtime channel send/action/client helpers
    必須從其邊界接收 config，而長期存在的 runtime modules 允許的 ambient `loadConfig()` 呼叫數量為零。

    新 Plugin 程式碼也應避免匯入寬泛的
    `openclaw/plugin-sdk/config-runtime` 相容性 barrel。請使用符合工作的窄版
    SDK 子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | Config types such as `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | 已載入的 config assertions 與 plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前執行階段 snapshot reads | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config 寫入 | `openclaw/plugin-sdk/config-mutation` |
    | Session store helpers | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled plugins 及其測試都受到 scanner guard 防止使用寬泛
    barrel，因此匯入與 mocks 會維持在其所需行為的本機範圍內。寬泛
    barrel 仍為外部相容性存在，但新程式碼不應
    依賴它。

  </Step>

  <Step title="將 Pi tool-result extensions 遷移到 middleware">
    Bundled plugins 必須將 Pi-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers 替換為
    runtime-neutral middleware。

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

    外部 Plugin 無法註冊 tool-result middleware，因為它可以在 model 看到前
    改寫高信任度 tool 輸出。

  </Step>

  <Step title="將 approval-native handlers 遷移到 capability facts">
    支援 approval 的 channel plugins 現在透過
    `approvalCapability.nativeRuntime` 加上共享 runtime-context registry 暴露原生 approval 行為。

    主要變更：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`
    - 將 approval-specific auth/delivery 從舊版 `plugin.auth` /
      `plugin.approvals` wiring 移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已從公開 channel-plugin
      contract 移除；將 delivery/native/render 欄位移到 `approvalCapability`
    - `plugin.auth` 僅保留給 channel login/logout 流程；core 不再讀取其中的 approval auth
      hooks
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊 channel-owned runtime objects，例如 clients、tokens 或 Bolt
      apps
    - 不要從原生 approval handlers 傳送 plugin-owned reroute notices；
      core 現在會根據實際 delivery 結果擁有 routed-elsewhere notices
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供真正的
      `createPluginRuntime().channel` surface。Partial stubs 會被拒絕。

    請參閱 `/plugins/sdk-channel-plugins` 了解目前的 approval capability
    版面配置。

  </Step>

  <Step title="稽核 Windows wrapper fallback 行為">
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

    如果你的呼叫端並非刻意依賴 shell fallback，請不要設定
    `allowShellFallback`，並改為處理擲出的錯誤。

  </Step>

  <Step title="尋找已棄用的匯入">
    搜尋你的 Plugin 中來自任一已棄用 surface 的匯入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替換為聚焦的匯入">
    舊 surface 的每個匯出都對應到特定的現代匯入路徑：

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

    同樣模式也適用於其他 legacy bridge helpers：

    | 舊匯入 | 現代等效項 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替換寬泛的 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍為外部
    相容性存在，但新程式碼應匯入實際需要的聚焦 helper surface：

    | 需求 | 匯入 |
    | --- | --- |
    | System event queue helpers | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat event and visibility helpers | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Pending delivery queue drain | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel activity telemetry | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory dedupe caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的 local-file/media path helpers | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與 guarded fetch helpers | `openclaw/plugin-sdk/fetch-runtime` |
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

    Bundled plugins 受到 scanner guard 防止使用 `infra-runtime`，因此 repo code
    無法退回寬泛 barrel。

  </Step>

  <Step title="遷移 channel route helpers">
    新的 channel route code 應使用 `openclaw/plugin-sdk/channel-route`。
    較舊的 route-key 與 comparable-target 名稱會在遷移期間保留為相容性
    aliases，但新的 Plugin 應使用直接描述行為的 route
    名稱：

    | 舊 helper | 現代 helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助函式會在原生核准、回覆抑制、傳入去重、
    Cron 傳遞和工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。
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

  <Accordion title="Common import path table">
  | 匯入路徑 | 用途 | 主要匯出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準 Plugin 進入點輔助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 舊版總括式重新匯出，用於通道進入點定義/建構器 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定結構描述匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一提供者進入點輔助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的通道進入點定義與建構器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助工具 | 允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定期間執行階段輔助工具 | 可安全匯入的設定修補配接器、查詢備註輔助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委派設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 設定配接器輔助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 設定工具輔助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳戶輔助工具 | 帳戶清單/設定/動作閘門輔助工具 |
  | `plugin-sdk/account-id` | 帳戶 ID 輔助工具 | `DEFAULT_ACCOUNT_ID`、帳戶 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳戶查詢輔助工具 | 帳戶查詢 + 預設後援輔助工具 |
  | `plugin-sdk/account-helpers` | 狹義帳戶輔助工具 | 帳戶清單/帳戶動作輔助工具 |
  | `plugin-sdk/channel-setup` | 設定精靈配接器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配對原語 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入中狀態與來源遞送接線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定配接器工廠與 DM 存取輔助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定結構描述建構器 | 僅限共用通道設定結構描述原語與通用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定結構描述 | 僅限 OpenClaw 維護的內建 Plugin；新 Plugin 必須定義 Plugin 本機結構描述 |
  | `plugin-sdk/channel-config-schema-legacy` | 已棄用的內建設定結構描述 | 僅限相容性別名；對維護中的內建 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令設定輔助工具 | 命令名稱正規化、描述修剪、重複/衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組/DM 政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 帳戶狀態與草稿串流生命週期輔助工具 | `createAccountStatusSink`、草稿預覽定稿輔助工具 |
  | `plugin-sdk/inbound-envelope` | 傳入信封輔助工具 | 共用路由 + 信封建構器輔助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 傳入回覆輔助工具 | 共用記錄與分派輔助工具 |
  | `plugin-sdk/messaging-targets` | 訊息目標剖析 | 目標剖析/比對輔助工具 |
  | `plugin-sdk/outbound-media` | 傳出媒體輔助工具 | 共用傳出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 傳出傳送相依性輔助工具 | 不匯入完整傳出執行階段的輕量 `resolveOutboundSendDep` 查詢 |
  | `plugin-sdk/outbound-runtime` | 傳出執行階段輔助工具 | 傳出遞送、身分/傳送委派、工作階段、格式化與酬載規劃輔助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結輔助工具 | 執行緒繫結生命週期與配接器輔助工具 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體酬載輔助工具 | 用於舊版欄位配置的代理媒體酬載建構器 |
  | `plugin-sdk/channel-runtime` | 已棄用的相容性填隙層 | 僅限舊版通道執行階段工具 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久化 Plugin 儲存空間 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣義執行階段輔助工具 | 執行階段/記錄/備份/Plugin 安裝輔助工具 |
  | `plugin-sdk/runtime-env` | 狹義執行階段環境輔助工具 | 記錄器/執行階段環境、逾時、重試與退避輔助工具 |
  | `plugin-sdk/plugin-runtime` | 共用 Plugin 執行階段輔助工具 | Plugin 命令/Hook/http/互動式輔助工具 |
  | `plugin-sdk/hook-runtime` | Hook 管線輔助工具 | 共用 Webhook/內部 Hook 管線輔助工具 |
  | `plugin-sdk/lazy-runtime` | 延遲執行階段輔助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助工具 | 共用 exec 輔助工具 |
  | `plugin-sdk/cli-runtime` | CLI 執行階段輔助工具 | 命令格式化、等待、版本輔助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 輔助工具 | Gateway 用戶端、事件迴圈就緒啟動輔助工具，以及通道狀態修補輔助工具 |
  | `plugin-sdk/config-runtime` | 已棄用的設定相容性填隙層 | 偏好使用 `config-types`、`plugin-config-runtime`、`runtime-config-snapshot` 與 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令輔助工具 | 當內建 Telegram 合約介面無法使用時，提供後援穩定的 Telegram 命令驗證輔助工具 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助工具 | Exec/Plugin 核准酬載、核准能力/設定檔輔助工具、原生核准路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准驗證輔助工具 | 核准者解析、同一聊天動作驗證 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助工具 | 原生 exec 核准設定檔/篩選器輔助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 核准遞送輔助工具 | 原生核准能力/遞送配接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准 Gateway 輔助工具 | 共用核准 Gateway 解析輔助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准配接器輔助工具 | 用於熱通道進入點的輕量原生核准配接器載入輔助工具 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理器輔助工具 | 更廣義的核准處理器執行階段輔助工具；當較狹義的配接器/Gateway 介面已足夠時，偏好使用它們 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助工具 | 原生核准目標/帳戶繫結輔助工具 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助工具 | Exec/Plugin 核准回覆酬載輔助工具 |
  | `plugin-sdk/channel-runtime-context` | 通道執行階段內容輔助工具 | 通用通道執行階段內容註冊/取得/監看輔助工具 |
  | `plugin-sdk/security-runtime` | 安全性輔助工具 | 共用信任、DM 閘控、根目錄有界檔案/路徑輔助工具、外部內容與秘密收集輔助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助工具 | 主機允許清單與私有網路政策輔助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助工具 | 釘選分派器、受保護的 fetch、SSRF 政策輔助工具 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 輔助工具 | Heartbeat 事件與可見性輔助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 遞送佇列輔助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 通道活動輔助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重輔助工具 | 記憶體內去重快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助工具 | 安全的本機檔案/媒體路徑輔助工具 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘控輔助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤格式化輔助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、錯誤圖形輔助工具 |
  | `plugin-sdk/fetch-runtime` | 包裝後的 fetch/代理輔助工具 | `resolveFetch`、代理輔助工具、EnvHttpProxyAgent 選項輔助工具 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助工具 | `RetryConfig`, `retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允許清單輸入對應 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令閘控與命令介面輔助工具 | `resolveControlCommandGate`、傳送者授權輔助工具、命令登錄輔助工具，包含動態引數選單格式化 |
  | `plugin-sdk/command-status` | 命令狀態/說明呈現器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 秘密輸入剖析 | 秘密輸入輔助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 請求輔助工具 | Webhook 目標工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 主體防護輔助工具 | 請求主體讀取/限制輔助工具 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 傳入分派、Heartbeat、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 狹義回覆分派輔助工具 | 定稿、提供者分派與對話標籤輔助工具 |
  | `plugin-sdk/reply-history` | 回覆歷程輔助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助工具 | 文字/markdown 分塊輔助工具 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存區輔助工具 | 儲存路徑 + updated-at 輔助工具 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助工具 | 狀態與 OAuth 目錄輔助工具 |
  | `plugin-sdk/routing` | 路由/工作階段鍵輔助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、工作階段鍵正規化輔助工具 |
  | `plugin-sdk/status-helpers` | 通道狀態輔助工具 | 通道/帳戶狀態摘要建構器、執行階段狀態預設值、問題中繼資料輔助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助工具 | 共用目標解析器輔助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助工具 | Slug/字串正規化輔助工具 |
  | `plugin-sdk/request-url` | 請求 URL 輔助工具 | 從類請求輸入擷取字串 URL |
  | `plugin-sdk/run-command` | 定時命令輔助工具 | 具正規化 stdout/stderr 的定時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常見工具/CLI 參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具承載資料擷取 | 從工具結果物件擷取標準化承載資料 |
  | `plugin-sdk/tool-send` | 工具傳送擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用的暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆類型 | 回覆承載資料類型 |
  | `plugin-sdk/provider-setup` | 精選本機／自託管提供者設定輔助工具 | 自託管提供者探索／設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 相容自託管提供者設定輔助工具 | 相同的自託管提供者探索／設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供者執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供者 API 金鑰設定輔助工具 | API 金鑰導入／寫入設定檔輔助工具 |
  | `plugin-sdk/provider-auth-result` | 提供者驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-auth-login` | 提供者互動式登入輔助工具 | 共用互動式登入輔助工具 |
  | `plugin-sdk/provider-selection-runtime` | 提供者選取輔助工具 | 已設定或自動提供者選取，以及原始提供者設定合併 |
  | `plugin-sdk/provider-env-vars` | 提供者環境變數輔助工具 | 提供者驗證環境變數查詢輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用提供者模型／重播輔助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、提供者端點輔助工具，以及模型 ID 標準化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用提供者目錄輔助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供者導入補丁 | 導入設定輔助工具 |
  | `plugin-sdk/provider-http` | 提供者 HTTP 輔助工具 | 通用提供者 HTTP／端點能力輔助工具，包括音訊轉錄 multipart 表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供者網頁擷取輔助工具 | 網頁擷取提供者註冊／快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供者網頁搜尋設定輔助工具 | 適用於不需要 Plugin 啟用接線的提供者的精簡網頁搜尋設定／憑證輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供者網頁搜尋合約輔助工具 | 精簡網頁搜尋設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定範圍的憑證設定器／取得器 |
  | `plugin-sdk/provider-web-search` | 提供者網頁搜尋輔助工具 | 網頁搜尋提供者註冊／快取／執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 提供者工具／結構描述相容性輔助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini 結構描述清理與診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供者用量輔助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供者用量輔助工具 |
  | `plugin-sdk/provider-stream` | 提供者串流包裝器輔助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器類型，以及共用的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供者傳輸輔助工具 | 原生提供者傳輸輔助工具，例如受防護的擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取／轉換／儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體承載資料建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 用於圖片／影片／音樂生成的共用容錯移轉輔助工具、候選選取，以及缺少模型訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解提供者類型，加上面向提供者的圖片／音訊輔助匯出 |
  | `plugin-sdk/text-runtime` | 共用文字輔助工具 | 助理可見文字剝除、Markdown 算繪／分塊／表格輔助工具、遮蔽輔助工具、指令標籤輔助工具、安全文字工具，以及相關文字／記錄輔助工具 |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 對外文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音提供者類型，加上面向提供者的指令、登錄、驗證輔助工具，以及 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音提供者類型、登錄、指令、標準化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 提供者類型、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 提供者類型、登錄／解析輔助工具、橋接工作階段輔助工具、共用代理回話佇列、逐字稿／事件健康狀態、回音抑制，以及快速內容脈絡諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 圖片生成輔助工具 | 圖片生成提供者類型，加上圖片資產／資料 URL 輔助工具與 OpenAI 相容圖片提供者建構器 |
  | `plugin-sdk/image-generation-core` | 共用圖片生成核心 | 圖片生成類型、容錯移轉、驗證，以及登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成提供者／請求／結果類型 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成類型、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成提供者／請求／結果類型 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成類型、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆承載資料標準化／縮減 |
  | `plugin-sdk/channel-config-primitives` | 通道設定基本元件 | 精簡通道設定結構描述基本元件 |
  | `plugin-sdk/channel-config-writes` | 通道設定寫入輔助工具 | 通道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用通道前置匯出 | 共用通道 Plugin 前置匯出 |
  | `plugin-sdk/channel-status` | 通道狀態輔助工具 | 共用通道狀態快照／摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯／讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm` | 直接私訊輔助工具 | 共用直接私訊驗證／防護輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充功能輔助工具 | 被動通道／狀態與環境代理輔助基本元件 |
  | `plugin-sdk/webhook-targets` | Webhook 目標輔助工具 | Webhook 目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | Webhook 路徑輔助工具 | Webhook 路徑標準化輔助工具 |
  | `plugin-sdk/web-media` | 共用網頁媒體輔助工具 | 遠端／本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | Zod 重新匯出 | 為 Plugin SDK 使用者重新匯出的 `zod` |
  | `plugin-sdk/memory-core` | 內建 memory-core 輔助工具 | 記憶體管理器／設定／檔案／CLI 輔助介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶體引擎執行階段門面 | 記憶體索引／搜尋執行階段門面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎 | 記憶體主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入引擎 | 記憶體嵌入合約、登錄存取、本機提供者，以及通用批次／遠端輔助工具；具體遠端提供者位於其所屬 Plugin 中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎 | 記憶體主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎 | 記憶體主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶體主機多模態輔助工具 | 記憶體主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶體主機查詢輔助工具 | 記憶體主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶體主機秘密輔助工具 | 記憶體主機秘密輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 記憶體主機事件日誌輔助工具 | 記憶體主機事件日誌輔助工具 |
  | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助工具 | 記憶體主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機 CLI 執行階段 | 記憶體主機 CLI 執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段 | 記憶體主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案／執行階段輔助工具 | 記憶體主機檔案／執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段別名 | 記憶體主機核心執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌別名 | 記憶體主機事件日誌輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-files` | 記憶體主機檔案／執行階段別名 | 記憶體主機檔案／執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-markdown` | 受管理 Markdown 輔助工具 | 供記憶體相鄰 Plugin 使用的共用受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | 主動記憶體搜尋門面 | 延遲載入的主動記憶體搜尋管理器執行階段門面 |
  | `plugin-sdk/memory-host-status` | 記憶體主機狀態別名 | 記憶體主機狀態輔助工具的供應商中立別名 |
  | `plugin-sdk/testing` | 測試工具 | 舊版廣泛相容性 barrel；偏好聚焦的測試子路徑，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env`，以及 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出常見的遷移子集，而不是完整的 SDK
介面。200 多個進入點的完整清單位於
`scripts/lib/plugin-sdk-entrypoints.json`。

保留的內建 Plugin 輔助 seam 已從公開 SDK
匯出對照表中淘汰，只有明確記錄的相容性 facade 例外，例如為已發布的
`@openclaw/discord@2026.3.13` 套件保留的已棄用
`plugin-sdk/discord` shim。擁有者專屬的輔助工具位於所屬的
Plugin 套件內；共用的主機行為應透過通用 SDK
合約移動，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用符合工作需求的最窄匯入。如果找不到匯出，
請檢查 `src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用合約
擁有它。

## 進行中的棄用

這些較窄範圍的棄用項目套用於整個 Plugin SDK、提供者合約、
執行階段介面和 manifest。每一項目前仍可運作，但會在未來的主要版本中移除。
每個項目下方的條目會將舊 API 對應到其標準替代項目。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 → command-status">
    **舊版 (`openclaw/plugin-sdk/command-auth`)**：`buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新版 (`openclaw/plugin-sdk/command-status`)**：相同簽章、相同
    匯出，只是從更窄的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性 stub。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及 gating 輔助工具 → resolveInboundMentionDecision">
    **舊版**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`，會回傳單一
    決策物件，而不是兩個拆分呼叫。

    下游頻道 Plugin（Slack、Discord、Matrix、MS Teams）都已經切換。

  </Accordion>

  <Accordion title="頻道執行階段 shim 和頻道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是給舊版
    頻道 Plugin 使用的相容性 shim。不要在新程式碼中匯入它；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 來註冊執行階段
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助工具
    會連同原始的「actions」頻道匯出一起棄用。請改為透過語意化
    `presentation` 介面公開能力；頻道 Plugin
    宣告它們會呈現什麼（卡片、按鈕、選單），而不是它們接受哪些原始
    動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋提供者 tool() 輔助工具 → Plugin 上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` factory。

    **新版**：直接在提供者 Plugin 上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助工具來註冊工具 wrapper。

  </Accordion>

  <Accordion title="純文字頻道 envelope → BodyForAgent">
    **舊版**：使用 `formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`）從傳入頻道訊息建立扁平的純文字提示
    envelope。

    **新版**：`BodyForAgent` 加上結構化的使用者情境區塊。頻道
    Plugin 會將路由中繼資料（thread、topic、reply-to、reactions）附加為
    型別化欄位，而不是將它們串接成提示字串。
    `formatAgentEnvelope(...)` 輔助工具仍支援合成的
    面向助理 envelope，但傳入純文字 envelope 正在淘汰中。

    受影響區域：`inbound_claim`、`message_received`，以及任何後處理
    `channelEnvelope` 文字的自訂頻道 Plugin。

  </Accordion>

  <Accordion title="提供者探索型別 → 提供者 catalog 型別">
    四個探索型別別名現在都是 catalog 時代型別的薄 wrapper：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另外還有舊版的 `ProviderCapabilities` 靜態集合；提供者 Plugin
    應使用明確的提供者 hook，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是靜態物件。

  </Accordion>

  <Accordion title="Thinking 政策 hook → resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上的三個獨立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，會回傳
    `ProviderThinkingProfile`，其中包含標準 `id`、選用的 `label`，以及
    已排序的等級清單。OpenClaw 會依 profile 排名自動降級過期的已儲存值。

    實作一個 hook 即可，不需要三個。舊版 hook 在棄用期間會持續運作，
    但不會與 profile 結果組合。

  </Accordion>

  <Accordion title="外部 OAuth 提供者 fallback → contracts.externalAuthProviders">
    **舊版**：實作 `resolveExternalOAuthProfiles(...)`，但未在
    Plugin manifest 中宣告提供者。

    **新版**：在 Plugin manifest 中宣告 `contracts.externalAuthProviders`
    **並且**實作 `resolveExternalAuthProfiles(...)`。舊版的「auth
    fallback」路徑會在執行階段發出警告，之後將被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供者環境變數查詢 → setup.providers[].envVars">
    **舊版** manifest 欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：將相同的環境變數查詢映射到 manifest 上的
    `setup.providers[].envVars`。這會將 setup/status 環境中繼資料集中到同一處，
    並避免只是為了回答環境變數查詢就啟動 Plugin 執行階段。

    `providerAuthEnvVars` 會透過相容性 adapter 持續支援，
    直到棄用期間結束。

  </Accordion>

  <Accordion title="Memory Plugin 註冊 → registerMemoryCapability">
    **舊版**：三個獨立呼叫：
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`。

    **新版**：在 memory-state API 上的一次呼叫：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同 slot，單一註冊呼叫。附加型 memory 輔助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影響。

  </Accordion>

  <Accordion title="Subagent session messages 型別已重新命名">
    兩個仍從 `src/plugins/runtime/types.ts` 匯出的舊版型別別名：

    | 舊版                          | 新版                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。相同簽章；舊方法會轉呼叫到新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）回傳即時 task-flow 存取器。

    **新版**：`runtime.tasks.managedFlows` 保留受控的 TaskFlow 變更
    執行階段，供會從 flow 建立、更新、取消或執行子任務的 Plugin 使用。
    當 Plugin 只需要基於 DTO 的讀取時，請使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="內嵌 extension factory → agent tool-result middleware">
    已在上方「如何遷移 → 將 Pi tool-result extension 遷移至
    middleware」中說明。為求完整也列於此處：已移除的 Pi 專用
    `api.registerEmbeddedExtensionFactory(...)` 路徑，會由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中提供明確的執行階段
    清單。
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
extension 層級的棄用項目（位於 `extensions/` 下的內建頻道／提供者 Plugin
內）會在各自的 `api.ts` 和 `runtime-api.ts` barrel 中追蹤。
它們不影響第三方 Plugin 合約，因此未列在此處。如果你直接使用內建
Plugin 的本機 barrel，升級前請閱讀該 barrel 中的棄用註解。
</Note>

## 移除時程

| 時間                   | 會發生什麼                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**               | 已棄用的介面會發出執行階段警告                               |
| **下一個主要版本**     | 已棄用的介面將被移除；仍使用它們的 Plugin 將會失敗 |

所有核心 Plugin 都已經完成遷移。外部 Plugin 應在下一個主要版本前遷移。

## 暫時抑制警告

在進行遷移時設定這些環境變數：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時的逃生出口，不是永久解決方案。

## 相關

- [開始使用](/zh-TW/plugins/building-plugins) - 建立你的第一個 Plugin
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins) - 建構頻道 Plugin
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) - 建構提供者 Plugin
- [Plugin 內部架構](/zh-TW/plugins/architecture) - 架構深入解析
- [Plugin Manifest](/zh-TW/plugins/manifest) - manifest schema 參考

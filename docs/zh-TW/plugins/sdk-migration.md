---
read_when:
    - 您看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 您正在將 Plugin 更新至現代 Plugin 架構
    - 您維護外部 OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代 Plugin SDK
title: Plugin SDK 遷移
x-i18n:
    generated_at: "2026-05-10T19:45:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已從廣泛的向後相容層，轉向採用聚焦且有文件記載匯入的現代 Plugin
架構。如果你的 Plugin 是在新架構之前建立，本指南可協助你遷移。

## 正在變更的內容

舊 Plugin 系統提供兩個完全開放的介面，讓 Plugin 可從單一進入點匯入
任何所需項目：

- **`openclaw/plugin-sdk/compat`** - 單一匯入，會重新匯出數十個
  輔助項目。它的引入是為了在新的 Plugin 架構建置期間，讓較舊的 hook 型 Plugin 繼續運作。
- **`openclaw/plugin-sdk/infra-runtime`** - 廣泛的執行階段輔助 barrel，混合了系統事件、Heartbeat 狀態、傳遞佇列、fetch/proxy 輔助項目、
  檔案輔助項目、核准類型，以及無關的工具程式。
- **`openclaw/plugin-sdk/config-runtime`** - 廣泛的設定相容性 barrel，
  在遷移期間仍保留已棄用的直接載入/寫入輔助項目。
- **`openclaw/extension-api`** - 一個橋接層，讓 Plugin 能直接存取
  主機端輔助項目，例如嵌入式代理執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除的 Pi 專用隨附
  extension hook，可觀察嵌入式執行器事件，例如
  `tool_result`。

這些廣泛匯入介面現在已**棄用**。它們在執行階段仍可運作，
但新 Plugin 不得使用它們，現有 Plugin 也應在下一個主要版本移除它們之前完成遷移。Pi 專用的嵌入式 extension factory
註冊 API 已移除；請改用工具結果 middleware。

OpenClaw 不會在引入替代方案的同一項變更中，移除或重新解釋已記載的 Plugin 行為。破壞性合約變更必須先經過相容性 adapter、診斷、文件與棄用期間。
這適用於 SDK 匯入、manifest 欄位、設定 API、hook，以及執行階段
註冊行為。

<Warning>
  向後相容層將在未來的主要版本中移除。
  仍從這些介面匯入的 Plugin 會在該情況發生時中斷。
  Pi 專用的嵌入式 extension factory 註冊已不再載入。
</Warning>

## 為什麼變更

舊方法造成了一些問題：

- **啟動緩慢** - 匯入一個輔助項目會載入數十個無關模組
- **循環相依** - 廣泛的重新匯出讓建立匯入循環變得容易
- **API 介面不明確** - 無法判斷哪些匯出是穩定的，哪些是內部使用

現代 Plugin SDK 修正了這點：每個匯入路徑（`openclaw/plugin-sdk/\<subpath\>`）
都是小型、自包含的模組，具備明確用途與已記載的合約。

隨附通道的舊式提供者便利 seam 也已移除。
通道品牌化的輔助 seam 是私有 mono-repo 捷徑，不是穩定的
Plugin 合約。請改用狹窄的通用 SDK 子路徑。在隨附的
Plugin 工作區內，將提供者擁有的輔助項目保留在該 Plugin 自己的 `api.ts` 或
`runtime-api.ts` 中。

目前的隨附提供者範例：

- Anthropic 將 Claude 專屬的串流輔助項目保留在自己的 `api.ts` /
  `contract-api.ts` seam 中
- OpenAI 將提供者 builder、預設模型輔助項目，以及即時提供者
  builder 保留在自己的 `api.ts` 中
- OpenRouter 將提供者 builder 與 onboarding/設定輔助項目保留在自己的
  `api.ts` 中

## Talk 與即時語音遷移計畫

即時語音、電話、會議與瀏覽器 Talk 程式碼，正從
介面本地的回合簿記，移至由
`openclaw/plugin-sdk/realtime-voice` 匯出的共用 Talk session controller。新的 controller 擁有通用 Talk
事件 envelope、作用中回合狀態、擷取狀態、輸出音訊狀態、近期
事件歷史，以及過期回合拒絕。提供者 Plugin 應繼續擁有
廠商專屬的即時 session；介面 Plugin 應繼續擁有擷取、
播放、電話與會議的特殊處理。

此 Talk 遷移刻意採用乾淨破壞式做法：

1. 將共用 controller/執行階段 primitive 保留在
   `plugin-sdk/realtime-voice`。
2. 將隨附介面移至共用 controller：瀏覽器 relay、
   managed-room handoff、voice-call 即時、voice-call 串流 STT、Google
   Meet 即時，以及原生 push-to-talk。
3. 以最終的 `talk.session.*` 和
   `talk.client.*` API 取代舊的 Talk RPC 家族。
4. 在 Gateway
   `hello-ok.features.events` 中宣告單一即時 Talk 事件通道：`talk.event`。
5. 刪除舊的即時 HTTP endpoint，以及任何請求時指令
   覆寫路徑。

除非是在實作低階 adapter 或測試 fixture，否則新程式碼不應直接呼叫 `createTalkEventSequencer(...)`。
請優先使用共用 controller，讓回合範圍事件無法在沒有回合 id 的情況下發出，過期的 `turnEnd` /
`turnCancel` 呼叫無法清除較新的作用中回合，並讓輸出音訊生命週期
事件在電話、會議、瀏覽器 relay、managed-room
handoff，以及原生 Talk 用戶端之間保持一致。

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
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
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

瀏覽器擁有的 WebRTC/provider-websocket session 使用 `talk.client.create`，
因為瀏覽器擁有提供者 negotiation 與媒體傳輸，而
Gateway 擁有憑證、指令與工具政策。`talk.session.*` 是
gateway-relay 即時、gateway-relay
轉錄，以及 managed-room 原生 STT/TTS session 的通用 Gateway 管理介面。

將即時選擇器放在 `talk.provider` /
`talk.providers` 旁邊的舊式設定，應使用 `openclaw doctor --fix` 修復；執行階段 Talk
不會將語音/TTS 提供者設定重新解釋為即時提供者設定。

支援的 `talk.session.create` 組合刻意保持精簡：

| 模式            | 傳輸       | Brain           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 全雙工提供者音訊透過 Gateway 橋接；工具呼叫會透過 agent-consult 工具路由。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 僅串流 STT；呼叫端傳送輸入音訊並接收 transcript 事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/用戶端 room | Push-to-talk 與 walkie-talkie 風格 room，其中用戶端擁有擷取/播放，而 Gateway 擁有回合狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/用戶端 room | 僅限管理員的 room 模式，供受信任的第一方介面直接執行 Gateway 工具動作。                  |

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

統一控制詞彙也刻意保持狹窄：

| 方法                          | 適用於                                              | 合約                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 將 base64 PCM 音訊 chunk 附加到同一 Gateway 連線擁有的提供者 session。                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 啟動 managed-room 使用者回合。                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在過期回合驗證後結束作用中回合。                                                                                                                                         |
| `talk.session.cancelTurn`       | 所有 Gateway 擁有的 session                              | 取消某個回合的作用中擷取/提供者/代理/TTS 工作。                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，不一定會結束使用者回合。                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成 relay 發出的提供者工具呼叫；傳入 `options.willContinue` 以產生暫時輸出，或傳入 `options.suppressResponse` 以在不產生另一個助理回應的情況下滿足該呼叫。 |
| `talk.session.close`            | 所有統一 session                                    | 停止 relay session 或撤銷 managed-room 狀態，然後忘記統一 session id。                                                                                                    |

  不要在核心中引入提供者或平台特殊案例來讓這項功能運作。
  核心負責 Talk 會話語意。提供者 Plugin 負責供應商會話設定。
  語音通話和 Google Meet 負責電話語音／會議配接器。瀏覽器和原生
  應用程式負責裝置擷取／播放使用者體驗。

  ## 相容性政策

  對於外部 Plugin，相容性工作依照以下順序進行：

  1. 加入新合約
  2. 透過相容性配接器保留舊行為的連接
  3. 發出診斷或警告，指出舊路徑和替代項目
  4. 在測試中涵蓋兩條路徑
  5. 記錄棄用和遷移路徑
  6. 只在已公告的遷移窗口期之後移除，通常是在主要版本中

  維護者可以使用
  `pnpm plugins:boundary-report` 稽核目前的遷移佇列。使用 `pnpm plugins:boundary-report:summary` 取得
  精簡計數，使用 `--owner <id>` 檢視單一 Plugin 或相容性擁有者，並在
  CI 閘道應於到期相容性記錄、跨擁有者保留 SDK 匯入，或未使用的保留 SDK
  子路徑上失敗時，使用 `pnpm plugins:boundary-report:ci`。此報告會依移除日期分組已棄用的
  相容性記錄、計算本機程式碼／文件參照、
  顯示跨擁有者保留 SDK 匯入，並彙總私有
  記憶體主機 SDK 橋接，讓相容性清理保持明確，而不是
  仰賴臨時搜尋。保留 SDK 子路徑必須有追蹤的擁有者使用狀況；
  未使用的保留輔助程式匯出應從公開 SDK 移除。

  如果某個清單欄位仍被接受，Plugin 作者可以繼續使用，直到
  文件和診斷另有說明。新程式碼應偏好已記錄的
  替代項目，但既有 Plugin 不應在一般次要
  版本期間中斷。

  ## 如何遷移

  <Steps>
  <Step title="遷移執行階段設定載入／寫入輔助程式">
    內建 Plugin 應停止直接呼叫
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。偏好使用已經
    傳入作用中呼叫路徑的設定。需要目前處理程序快照的長生命週期處理常式
    可以使用 `api.runtime.config.current()`。長生命週期
    代理工具應在 `execute` 內使用工具情境的 `ctx.getRuntimeConfig()`，
    讓在設定寫入前建立的工具仍能看到重新整理後的
    執行階段設定。

    設定寫入必須透過交易式輔助程式，並選擇
    寫入後政策：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當呼叫端知道變更需要乾淨地重新啟動 Gateway 時，使用
    `afterWrite: { mode: "restart", reason: "..." }`；只有在呼叫端擁有
    後續處理，且刻意想抑制重新載入規劃器時，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    變更結果包含型別化的 `followUp` 摘要，可供測試和記錄使用；
    Gateway 仍負責套用或排程重新啟動。
    `loadConfig` 和 `writeConfigFile` 在遷移窗口期內仍作為外部 Plugin 的已棄用相容性
    輔助程式，並會以
    `runtime-config-load-write` 相容性代碼警告一次。內建 Plugin 和儲存庫
    執行階段程式碼受到
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 中的掃描器護欄保護：新的生產 Plugin 使用
    會直接失敗、直接設定寫入會失敗、Gateway 伺服器方法必須使用
    請求執行階段快照、執行階段通道傳送／動作／用戶端輔助程式
    必須從其邊界接收設定，而長生命週期執行階段模組
    允許的環境 `loadConfig()` 呼叫數為零。

    新 Plugin 程式碼也應避免匯入廣泛的
    `openclaw/plugin-sdk/config-runtime` 相容性桶。請使用符合工作需求的窄版
    SDK 子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | 設定型別，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | 已載入設定斷言和 Plugin 進入點設定查詢 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前執行階段快照讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | 會話儲存輔助程式 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策執行階段輔助程式 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 秘密輸入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型／會話覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    內建 Plugin 及其測試受到掃描器保護，避免使用廣泛
    桶，因此匯入和模擬會保持在所需行為的本機範圍內。廣泛
    桶仍為外部相容性存在，但新程式碼不應
    依賴它。

  </Step>

  <Step title="將 Pi 工具結果擴充遷移到中介軟體">
    內建 Plugin 必須以
    執行階段中立的中介軟體取代僅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 工具結果處理常式。

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同時更新 Plugin 清單：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 Plugin 不能註冊工具結果中介軟體，因為它可以
    在模型看到高信任工具輸出前重寫該輸出。

  </Step>

  <Step title="將核准原生處理常式遷移到能力事實">
    具備核准能力的通道 Plugin 現在透過
    `approvalCapability.nativeRuntime` 加上共享執行階段情境登錄檔公開原生核准行為。

    主要變更：

    - 將 `approvalCapability.handler.loadRuntime(...)` 取代為
      `approvalCapability.nativeRuntime`
    - 將核准專用驗證／交付從舊版 `plugin.auth` /
      `plugin.approvals` 連接移至 `approvalCapability`
    - `ChannelPlugin.approvals` 已從公開通道 Plugin
      合約移除；請將交付／原生／算繪欄位移至 `approvalCapability`
    - `plugin.auth` 僅保留給通道登入／登出流程；核心不再讀取
      其中的核准驗證鉤子
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊通道擁有的執行階段物件，
      例如用戶端、權杖或 Bolt
      應用程式
    - 不要從原生核准處理常式傳送 Plugin 擁有的重新路由通知；
      核心現在根據實際交付結果負責路由至其他位置的通知
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供
      真正的 `createPluginRuntime().channel` 表面。部分存根會被拒絕。

    請參閱 `/plugins/sdk-channel-plugins` 了解目前的核准能力
    配置。

  </Step>

  <Step title="稽核 Windows 包裝器後援行為">
    如果你的 Plugin 使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` 包裝器現在會封閉失敗，除非你明確傳入
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

    如果你的呼叫端並非刻意依賴 Shell 後援，請不要設定
    `allowShellFallback`，而是處理拋出的錯誤。

  </Step>

  <Step title="尋找已棄用的匯入">
    在你的 Plugin 中搜尋來自任一已棄用表面的匯入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替換為聚焦匯入">
    舊表面的每個匯出都對應至特定的現代匯入路徑：

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

    對於主機端輔助程式，請使用注入的 Plugin 執行階段，而不是
    直接匯入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    相同模式也適用於其他舊版橋接輔助程式：

    | 舊匯入 | 現代對應項 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 會話儲存輔助程式 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替換廣泛 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍為外部
    相容性存在，但新程式碼應匯入它實際需要的聚焦輔助程式表面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助程式 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 喚醒、事件和可見性輔助程式 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 擱置交付佇列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 通道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本機檔案／媒體路徑輔助程式 | `openclaw/plugin-sdk/file-access-runtime` |
    | 可感知分派器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 和受防護的 fetch 輔助程式 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器政策型別 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准請求／解析型別 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆酬載和命令輔助程式 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助程式 | `openclaw/plugin-sdk/error-runtime` |
    | 傳輸就緒等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助程式 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步工作並行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 數值強制轉換 | `openclaw/plugin-sdk/number-runtime` |
    | 處理程序本機非同步鎖 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖 | `openclaw/plugin-sdk/file-lock` |

    內建 Plugin 受到掃描器保護，避免使用 `infra-runtime`，因此儲存庫程式碼
    不能退回到廣泛桶。

  </Step>

  <Step title="遷移通道路由輔助程式">
    新的通道路由程式碼應使用 `openclaw/plugin-sdk/channel-route`。
    較舊的路由鍵和可比較目標名稱在遷移窗口期內仍作為相容性
    別名保留，但新 Plugin 應使用直接描述行為的路由
    名稱：

    | 舊版輔助函式 | 現代輔助函式 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助函式會在原生核准、回覆抑制、入站去重、
    Cron 傳遞和工作階段路由中，一致地正規化 `{ channel, to, accountId, threadId }`。
    如果你的 Plugin 擁有自訂目標文法，請使用 `resolveChannelRouteTargetWithParser(...)`
    將該解析器調整為相同的路由目標合約。

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
  | `plugin-sdk/plugin-entry` | 標準 Plugin 進入點輔助函式 | `definePluginEntry` |
  | `plugin-sdk/core` | 舊版通道進入點定義/建構器的總括重新匯出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定架構匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一提供者進入點輔助函式 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的通道進入點定義與建構器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助函式 | 允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定期間的執行階段輔助函式 | 可安全匯入的設定修補轉接器、查閱備註輔助函式、`promptResolvedAllowFrom`、`splitSetupEntries`、委派式設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已棄用的設定轉接器別名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 設定工具輔助函式 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳號輔助函式 | 帳號清單/設定/動作閘門輔助函式 |
  | `plugin-sdk/account-id` | account-id 輔助函式 | `DEFAULT_ACCOUNT_ID`、account-id 正規化 |
  | `plugin-sdk/account-resolution` | 帳號查閱輔助函式 | 帳號查閱 + 預設後援輔助函式 |
  | `plugin-sdk/account-helpers` | 範圍較窄的帳號輔助函式 | 帳號清單/帳號動作輔助函式 |
  | `plugin-sdk/channel-setup` | 設定精靈轉接器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配對原語 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入中狀態與來源交付接線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定轉接器工廠與 DM 存取輔助函式 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定架構建構器 | 僅限共用通道設定架構原語與泛型建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定架構 | 僅限 OpenClaw 維護的內建 plugins；新的 plugins 必須定義 Plugin 本機架構 |
  | `plugin-sdk/channel-config-schema-legacy` | 已棄用的內建設定架構 | 僅作為相容性別名；對維護中的內建 plugins 使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令設定輔助函式 | 命令名稱正規化、描述修剪、重複/衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組/DM 政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 帳號狀態與草稿串流生命週期輔助函式 | `createAccountStatusSink`、草稿預覽最終化輔助函式 |
  | `plugin-sdk/inbound-envelope` | 入站信封輔助函式 | 共用路由 + 信封建構器輔助函式 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回覆輔助函式 | 共用記錄並分派輔助函式 |
  | `plugin-sdk/messaging-targets` | 訊息目標剖析 | 目標剖析/比對輔助函式 |
  | `plugin-sdk/outbound-media` | 出站媒體輔助函式 | 共用出站媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 出站傳送相依性輔助函式 | 不匯入完整出站執行階段的輕量 `resolveOutboundSendDep` 查閱 |
  | `plugin-sdk/outbound-runtime` | 出站執行階段輔助函式 | 出站交付、身分/傳送委派、工作階段、格式化與酬載規劃輔助函式 |
  | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結輔助函式 | 執行緒繫結生命週期與轉接器輔助函式 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體酬載輔助函式 | 舊版欄位版面配置的代理媒體酬載建構器 |
  | `plugin-sdk/channel-runtime` | 已棄用的相容性墊片 | 僅限舊版通道執行階段公用程式 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久化 Plugin 儲存空間 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣泛執行階段輔助函式 | 執行階段/記錄/備份/Plugin 安裝輔助函式 |
  | `plugin-sdk/runtime-env` | 範圍較窄的執行階段環境輔助函式 | 記錄器/執行階段環境、逾時、重試與退避輔助函式 |
  | `plugin-sdk/plugin-runtime` | 共用 Plugin 執行階段輔助函式 | Plugin 命令/hooks/http/互動式輔助函式 |
  | `plugin-sdk/hook-runtime` | Hook 管線輔助函式 | 共用 Webhook/內部 hook 管線輔助函式 |
  | `plugin-sdk/lazy-runtime` | 延遲執行階段輔助函式 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助函式 | 共用 exec 輔助函式 |
  | `plugin-sdk/cli-runtime` | CLI 執行階段輔助函式 | 命令格式化、等待、版本輔助函式 |
  | `plugin-sdk/gateway-runtime` | Gateway 輔助函式 | Gateway 用戶端、事件迴圈就緒啟動輔助函式，以及通道狀態修補輔助函式 |
  | `plugin-sdk/config-runtime` | 已棄用的設定相容性墊片 | 偏好使用 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` 與 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令輔助函式 | 內建 Telegram 合約介面無法使用時，後援穩定的 Telegram 命令驗證輔助函式 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助函式 | Exec/Plugin 核准酬載、核准能力/設定檔輔助函式、原生核准路由/執行階段輔助函式，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准驗證輔助函式 | 核准者解析、同聊天室動作驗證 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助函式 | 原生 exec 核准設定檔/篩選器輔助函式 |
  | `plugin-sdk/approval-delivery-runtime` | 核准交付輔助函式 | 原生核准能力/交付轉接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准 Gateway 輔助函式 | 共用核准 Gateway 解析輔助函式 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准轉接器輔助函式 | 用於熱門通道進入點的輕量原生核准轉接器載入輔助函式 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理器輔助函式 | 較廣泛的核准處理器執行階段輔助函式；足夠時偏好較窄的轉接器/Gateway 接縫 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助函式 | 原生核准目標/帳號繫結輔助函式 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助函式 | Exec/Plugin 核准回覆酬載輔助函式 |
  | `plugin-sdk/channel-runtime-context` | 通道執行階段內容輔助函式 | 泛型通道執行階段內容註冊/取得/監看輔助函式 |
  | `plugin-sdk/security-runtime` | 安全性輔助函式 | 共用信任、DM 閘控、根目錄有界檔案/路徑輔助函式、外部內容與密鑰收集輔助函式 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助函式 | 主機允許清單與私有網路政策輔助函式 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助函式 | 固定的分派器、受保護的 fetch、SSRF 政策輔助函式 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助函式 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 輔助函式 | Heartbeat 喚醒、事件與可見性輔助函式 |
  | `plugin-sdk/delivery-queue-runtime` | 交付佇列輔助函式 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 通道活動輔助函式 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重輔助函式 | 記憶體內去重快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助函式 | 安全本機檔案/媒體路徑輔助函式 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助函式 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助函式 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘控輔助函式 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤格式化輔助函式 | `formatUncaughtError`, `isApprovalNotFoundError`、錯誤圖形輔助函式 |
  | `plugin-sdk/fetch-runtime` | 包裝 fetch/代理輔助函式 | `resolveFetch`、代理輔助函式、EnvHttpProxyAgent 選項輔助函式 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助函式 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助函式 | `RetryConfig`, `retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允許清單輸入對應 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令閘控與命令介面輔助函式 | `resolveControlCommandGate`、傳送者授權輔助函式、命令登錄輔助函式，包含動態引數選單格式化 |
  | `plugin-sdk/command-status` | 命令狀態/說明呈現器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密鑰輸入剖析 | 密鑰輸入輔助函式 |
  | `plugin-sdk/webhook-ingress` | Webhook 請求輔助函式 | Webhook 目標公用程式 |
  | `plugin-sdk/webhook-request-guards` | Webhook 主體保護輔助函式 | 請求主體讀取/限制輔助函式 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 入站分派、Heartbeat、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 範圍較窄的回覆分派輔助函式 | 最終化、提供者分派與對話標籤輔助函式 |
  | `plugin-sdk/reply-history` | 回覆歷史記錄輔助函式 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助函式 | 文字/markdown 分塊輔助函式 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存區輔助函式 | 儲存區路徑 + updated-at 輔助函式 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助函式 | 狀態與 OAuth 目錄輔助函式 |
  | `plugin-sdk/routing` | 路由/工作階段鍵輔助函式 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、工作階段鍵正規化輔助函式 |
  | `plugin-sdk/status-helpers` | 通道狀態輔助函式 | 通道/帳號狀態摘要建構器、執行階段狀態預設值、議題中繼資料輔助函式 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助函式 | 共用目標解析器輔助函式 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助函式 | slug/字串正規化輔助函式 |
  | `plugin-sdk/request-url` | 請求 URL 輔助函式 | 從類似請求的輸入中擷取字串 URL |
  | `plugin-sdk/run-command` | 計時命令輔助函式 | 具備正規化 stdout/stderr 的計時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具/CLI 參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具承載資料擷取 | 從工具結果物件擷取正規化承載資料 |
  | `plugin-sdk/tool-send` | 工具傳送擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆型別 | 回覆承載資料型別 |
  | `plugin-sdk/provider-setup` | 精選本機/自架提供者設定輔助工具 | 自架提供者探索/設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自架提供者的設定輔助工具 | 相同的自架提供者探索/設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供者執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供者 API 金鑰設定輔助工具 | API 金鑰初始設定/設定檔寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 提供者驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-selection-runtime` | 提供者選取輔助工具 | 已設定或自動提供者選取，以及原始提供者設定合併 |
  | `plugin-sdk/provider-env-vars` | 提供者環境變數輔助工具 | 提供者驗證環境變數查詢輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用提供者模型/重播輔助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共用重播政策建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用提供者目錄輔助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供者初始設定修補 | 初始設定設定輔助工具 |
  | `plugin-sdk/provider-http` | 提供者 HTTP 輔助工具 | 通用提供者 HTTP/端點能力輔助工具，包括音訊轉錄 multipart 表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供者 Web 擷取輔助工具 | Web 擷取提供者註冊/快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供者 Web 搜尋設定輔助工具 | 供不需要 Plugin 啟用接線的提供者使用的窄範圍 Web 搜尋設定/憑證輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供者 Web 搜尋合約輔助工具 | 窄範圍 Web 搜尋設定/憑證合約輔助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及具範圍的憑證設定器/取得器 |
  | `plugin-sdk/provider-web-search` | 提供者 Web 搜尋輔助工具 | Web 搜尋提供者註冊/快取/執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 提供者工具/結構描述相容性輔助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`，以及 Gemini 結構描述清理與診斷 |
  | `plugin-sdk/provider-usage` | 提供者使用量輔助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`，以及其他提供者使用量輔助工具 |
  | `plugin-sdk/provider-stream` | 提供者串流包裝器輔助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供者傳輸輔助工具 | 原生提供者傳輸輔助工具，例如受防護的擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取/轉換/儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體承載資料建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 圖像/影片/音樂生成的共用容錯移轉輔助工具、候選項選取，以及缺少模型訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解提供者型別，以及面向提供者的圖像/音訊輔助匯出 |
  | `plugin-sdk/text-runtime` | 已棄用的寬範圍文字相容性匯出 | 使用 `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`，以及 `logging-core` |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 對外文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音提供者型別，以及面向提供者的指令、登錄、驗證輔助工具與 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音提供者型別、登錄、指令、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 提供者型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 提供者型別、登錄/解析輔助工具、橋接工作階段輔助工具、共用代理程式回話佇列、文字稿/事件健康狀態、回音抑制，以及快速情境諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 圖像生成輔助工具 | 圖像生成提供者型別，以及圖像資產/資料 URL 輔助工具與 OpenAI 相容圖像提供者建構器 |
  | `plugin-sdk/image-generation-core` | 共用圖像生成核心 | 圖像生成型別、容錯移轉、驗證，以及登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成提供者/請求/結果型別 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成型別、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成提供者/請求/結果型別 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成型別、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆承載資料正規化/縮減 |
  | `plugin-sdk/channel-config-primitives` | 頻道設定基元 | 窄範圍頻道設定結構描述基元 |
  | `plugin-sdk/channel-config-writes` | 頻道設定寫入輔助工具 | 頻道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用頻道前置匯出 | 共用頻道 Plugin 前置匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共用頻道狀態快照/摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯/讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm` | 直接 DM 輔助工具 | 共用直接 DM 驗證/防護輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充功能輔助工具 | 被動頻道/狀態與環境代理輔助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目標輔助工具 | Webhook 目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | 已棄用的 Webhook 路徑別名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共用 Web 媒體輔助工具 | 遠端/本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | 已棄用的 Zod 相容性重新匯出 | 直接從 `zod` 匯入 `zod` |
  | `plugin-sdk/memory-core` | 捆綁的 memory-core 輔助工具 | 記憶體管理器/設定/檔案/CLI 輔助介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶體引擎執行階段 Facade | 記憶體索引/搜尋執行階段 Facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎 | 記憶體主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入引擎 | 記憶體嵌入合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具；具體遠端提供者位於其所屬 Plugin 中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎 | 記憶體主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎 | 記憶體主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶體主機多模態輔助工具 | 記憶體主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶體主機查詢輔助工具 | 記憶體主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶體主機密鑰輔助工具 | 記憶體主機密鑰輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 已棄用的記憶體事件別名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助工具 | 記憶體主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機 CLI 執行階段 | 記憶體主機 CLI 執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段 | 記憶體主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案/執行階段輔助工具 | 記憶體主機檔案/執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段別名 | 供應商中立的記憶體主機核心執行階段輔助工具別名 |
  | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌別名 | 供應商中立的記憶體主機事件日誌輔助工具別名 |
  | `plugin-sdk/memory-host-files` | 已棄用的記憶體檔案/執行階段別名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 受管理 Markdown 輔助工具 | 供記憶體相鄰 Plugin 使用的共用受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | Active Memory 搜尋 Facade | 延遲載入的 Active Memory 搜尋管理器執行階段 Facade |
  | `plugin-sdk/memory-host-status` | 已棄用的記憶體主機狀態別名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 測試工具 | 儲存庫本機已棄用的相容性 barrel；請使用聚焦的儲存庫本機測試子路徑，例如 `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`，以及 `plugin-sdk/test-fixtures` |
</Accordion>

這張表刻意只列出常見遷移子集，而不是完整的 SDK
介面範圍。編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會從
公開子集產生。

保留給內建 Plugin 的輔助接縫已從公開 SDK
匯出對應表中移除，除了明確文件化的相容性外觀，例如保留給已發布
`@openclaw/discord@2026.3.13` 套件的已棄用
`plugin-sdk/discord` shim。擁有者專屬的輔助工具位於所屬的 Plugin
套件內；共用的主機行為應透過通用 SDK
合約移動，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用符合工作需求的最窄匯入。如果找不到匯出，
請檢查 `src/plugin-sdk/` 的原始碼，或詢問維護者應該由哪個通用合約
擁有它。

## 作用中的棄用項目

適用於整個 Plugin SDK、供應商合約、
執行階段介面範圍和 manifest 的較窄棄用項目。每一項目前仍可運作，
但會在未來的主要版本中移除。每個項目下方的條目會將舊 API 對應到
其標準替代項目。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 → command-status">
    **舊版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：相同簽章、相同
    匯出，只是從更窄的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性 stub。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及閘控輔助工具 → resolveInboundMentionDecision">
    **舊版**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })` - 會傳回
    單一決策物件，而不是兩個分開的呼叫。

    下游頻道 Plugin（Slack、Discord、Matrix、MS Teams）都已經
    切換完成。

  </Accordion>

  <Accordion title="頻道執行階段 shim 和頻道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是給較舊頻道 Plugin 使用的相容性
    shim。新程式碼不要匯入它；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 來註冊執行階段
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助工具會和
    原始「actions」頻道匯出一併棄用。請改為透過語意化的 `presentation`
    介面範圍公開能力，也就是頻道 Plugin 宣告它們會呈現什麼
    （卡片、按鈕、選取器），而不是它們接受哪些原始動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋供應商 tool() 輔助工具 → Plugin 上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工廠。

    **新版**：直接在供應商 Plugin 上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助工具來註冊工具包裝器。

  </Accordion>

  <Accordion title="純文字頻道信封 → BodyForAgent">
    **舊版**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用來從傳入頻道訊息建構扁平的純文字 prompt
    信封。

    **新版**：`BodyForAgent` 加上結構化使用者情境區塊。頻道
    Plugin 會將路由中繼資料（對話串、主題、回覆對象、回應）附加為
    型別化欄位，而不是把它們串接到 prompt 字串中。
    `formatAgentEnvelope(...)` 輔助工具仍支援合成的
    面向助理信封，但傳入純文字信封正逐步淘汰。

    受影響區域：`inbound_claim`、`message_received`，以及任何後處理
    `channelEnvelope` 文字的自訂頻道 Plugin。

  </Accordion>

  <Accordion title="供應商探索型別 → 供應商目錄型別">
    四個探索型別別名現在只是目錄時代型別的薄包裝：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    另有舊版 `ProviderCapabilities` 靜態集合，供應商 Plugin
    應使用明確的供應商 hook，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是靜態物件。

  </Accordion>

  <Accordion title="思考政策 hook → resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上的三個獨立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，會傳回
    `ProviderThinkingProfile`，內含標準 `id`、選用 `label` 和
    排序等級清單。OpenClaw 會依 profile 排名自動降級過時的已儲存值。

    實作一個 hook，而不是三個。舊版 hook 會在棄用窗口期間繼續運作，
    但不會與 profile 結果組合。

  </Accordion>

  <Accordion title="外部 OAuth 供應商備援 → contracts.externalAuthProviders">
    **舊版**：實作 `resolveExternalOAuthProfiles(...)`，但未在 Plugin manifest 中
    宣告供應商。

    **新版**：在 Plugin manifest 中宣告 `contracts.externalAuthProviders`
    **並且**實作 `resolveExternalAuthProfiles(...)`。舊的「auth
    fallback」路徑會在執行階段發出警告，並將被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="供應商環境變數查找 → setup.providers[].envVars">
    **舊版** manifest 欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：將相同的環境變數查找鏡像到 manifest 上的
    `setup.providers[].envVars`。這會把設定/狀態環境中繼資料整合到同一處，
    並避免只是為了回答環境變數查找就啟動 Plugin 執行階段。

    `providerAuthEnvVars` 會透過相容性轉接器維持支援，直到棄用窗口
    關閉為止。

  </Accordion>

  <Accordion title="記憶 Plugin 註冊 → registerMemoryCapability">
    **舊版**：三個獨立呼叫：
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新版**：在記憶狀態 API 上的一個呼叫：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同 slot，單一註冊呼叫。加法式記憶輔助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影響。

  </Accordion>

  <Accordion title="子代理工作階段訊息型別已重新命名">
    兩個仍從 `src/plugins/runtime/types.ts` 匯出的舊版型別別名：

    | 舊版                          | 新版                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。相同簽章；舊方法會呼叫到新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）會傳回即時 task-flow 存取器。

    **新版**：`runtime.tasks.managedFlows` 會為從流程建立、更新、取消或執行子工作
    的 Plugin 保留受管理的 TaskFlow 變更執行階段。當 Plugin 只需要基於 DTO
    的讀取時，請使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="內嵌擴充工廠 → 代理工具結果 middleware">
    上方「如何遷移 → 將 Pi 工具結果擴充遷移到
    middleware」已有說明。為求完整，也列在此處：已移除的 Pi 專用
    `api.registerEmbeddedExtensionFactory(...)` 路徑，會由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中提供明確的執行階段
    清單。
  </Accordion>

  <Accordion title="OpenClawSchemaType 別名 → OpenClawConfig">
    從 `openclaw/plugin-sdk` 重新匯出的 `OpenClawSchemaType` 現在是
    `OpenClawConfig` 的一行別名。請偏好使用標準名稱。

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
擴充層級的棄用項目（位於 `extensions/` 底下的內建頻道/供應商 Plugin 內）
會在各自的 `api.ts` 和 `runtime-api.ts`
barrel 中追蹤。它們不影響第三方 Plugin 合約，因此未列於此處。
如果你直接使用內建 Plugin 的本機 barrel，升級前請先閱讀該 barrel 中的
棄用註解。
</Note>

## 移除時程

| 時間                   | 會發生什麼                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**               | 已棄用的介面範圍會發出執行階段警告                               |
| **下一個主要版本** | 已棄用的介面範圍將被移除；仍使用它們的 Plugin 會失敗 |

所有核心 Plugin 都已完成遷移。外部 Plugin 應在下一個主要版本前完成
遷移。

## 暫時抑制警告

在進行遷移時設定這些環境變數：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時的逃生口，不是永久解法。

## 相關

- [開始使用](/zh-TW/plugins/building-plugins) - 建置你的第一個 Plugin
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [頻道 Plugin](/zh-TW/plugins/sdk-channel-plugins) - 建置頻道 Plugin
- [供應商 Plugin](/zh-TW/plugins/sdk-provider-plugins) - 建置供應商 Plugin
- [Plugin 內部機制](/zh-TW/plugins/architecture) - 架構深入解析
- [Plugin Manifest](/zh-TW/plugins/manifest) - manifest schema 參考

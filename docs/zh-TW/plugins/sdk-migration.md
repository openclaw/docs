---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在將外掛更新至現代外掛架構
    - 你維護一個外部 OpenClaw 外掛
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代外掛 SDK
title: 外掛 SDK 遷移
x-i18n:
    generated_at: "2026-06-27T19:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已從寬泛的向後相容層，轉向採用聚焦且有文件記載匯入項目的現代外掛
架構。如果你的外掛是在新架構之前建立的，本指南可協助你遷移。

## 有哪些變更

舊外掛系統提供兩個完全開放的介面，讓外掛可從單一進入點匯入
所需的一切：

- **`openclaw/plugin-sdk/compat`** - 單一匯入項目，重新匯出了數十個
  輔助工具。它的引入是為了在新外掛架構建置期間，讓較舊的 hook 型外掛仍可運作。
- **`openclaw/plugin-sdk/infra-runtime`** - 寬泛的執行階段輔助工具 barrel，混合了
  系統事件、心跳偵測狀態、傳遞佇列、fetch/proxy 輔助工具、
  檔案輔助工具、核准型別，以及無關的工具。
- **`openclaw/plugin-sdk/config-runtime`** - 寬泛的設定相容性 barrel，
  在遷移期間仍保留已棄用的直接載入/寫入輔助工具。
- **`openclaw/extension-api`** - 一個橋接，讓外掛可直接存取
  主機端輔助工具，例如嵌入式代理執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除、僅限嵌入式執行器的 bundled
  擴充 hook，可觀察嵌入式執行器事件，例如
  `tool_result`。

寬泛的匯入介面現在已**棄用**。它們在執行階段仍可運作，
但新外掛不得使用它們，而現有外掛應在下一個主要版本移除它們之前完成遷移。
僅限嵌入式執行器的擴充 factory 註冊 API 已移除；請改用工具結果 middleware。

OpenClaw 不會在引入替代方案的同一次變更中，移除或重新解釋已記載於文件的外掛行為。
破壞性合約變更必須先經過
相容性 adapter、診斷、文件，以及棄用期。
這適用於 SDK 匯入、manifest 欄位、設定 API、hook，以及執行階段
註冊行為。

<Warning>
  向後相容層將在未來的主要版本中移除。
  屆時仍從這些介面匯入的外掛將會故障。
  舊版嵌入式擴充 factory 註冊已不再載入。
</Warning>

## 為何變更

舊做法造成了問題：

- **啟動緩慢** - 匯入一個輔助工具會載入數十個無關模組
- **循環依賴** - 寬泛的重新匯出讓建立匯入循環變得容易
- **API 介面不清楚** - 無法分辨哪些匯出是穩定的、哪些是內部用

現代外掛 SDK 修正了這點：每個匯入路徑（`openclaw/plugin-sdk/\<subpath\>`）
都是小型、自含的模組，具有明確用途和有文件記載的合約。

bundled channel 的舊版 provider 便利接縫也已移除。
channel 品牌化輔助接縫是私人 monorepo 捷徑，不是穩定的
外掛合約。請改用狹窄的通用 SDK 子路徑。在 bundled
外掛工作區內，請將 provider 擁有的輔助工具保留在該外掛自己的 `api.ts` 或
`runtime-api.ts` 中。

目前 bundled provider 範例：

- Anthropic 將 Claude 專屬串流輔助工具保留在自己的 `api.ts` /
  `contract-api.ts` 接縫中
- OpenAI 將 provider builder、預設模型輔助工具，以及 realtime provider
  builder 保留在自己的 `api.ts` 中
- OpenRouter 將 provider builder 與 onboarding/config 輔助工具保留在自己的
  `api.ts` 中

## Talk 與即時語音遷移計畫

即時語音、電話、會議與瀏覽器 Talk 程式碼，正在從
介面本地的回合簿記移至由
`openclaw/plugin-sdk/realtime-voice` 匯出的共用 Talk 工作階段控制器。新的控制器負責共用 Talk
事件 envelope、作用中回合狀態、擷取狀態、輸出音訊狀態、近期
事件歷史，以及過期回合拒絕。Provider 外掛應繼續負責
供應商專屬即時工作階段；介面外掛應繼續負責擷取、
播放、電話與會議差異。

這項 Talk 遷移刻意採用破壞式清理：

1. 將共用控制器/執行階段 primitives 保留在
   `plugin-sdk/realtime-voice`。
2. 將 bundled 介面移至共用控制器：瀏覽器 relay、
   managed-room handoff、voice-call 即時、voice-call 串流 STT、Google
   Meet 即時，以及原生按鍵通話。
3. 以最終的 `talk.session.*` 和
   `talk.client.*` API 取代舊 Talk RPC family。
4. 在 Gateway
   `hello-ok.features.events` 中宣告一個即時 Talk 事件通道：`talk.event`。
5. 刪除舊即時 HTTP endpoint，以及任何 request-time 指令
   override 路徑。

新程式碼不應直接呼叫 `createTalkEventSequencer(...)`，除非它是在
實作低階 adapter 或測試 fixture。請優先使用共用控制器，
如此一來，回合範圍事件就無法在沒有回合 ID 的情況下發出，過期的 `turnEnd` /
`turnCancel` 呼叫無法清除較新的作用中回合，而輸出音訊生命週期
事件也能在電話、會議、瀏覽器 relay、managed-room
handoff，以及原生 Talk client 之間保持一致。

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

瀏覽器擁有的 WebRTC/provider-websocket 工作階段使用 `talk.client.create`，
因為瀏覽器負責 provider 協商與媒體傳輸，而
Gateway 負責認證資訊、指令與工具政策。`talk.session.*` 是
Gateway 管理的共用介面，用於 gateway-relay 即時、gateway-relay
轉錄，以及 managed-room 原生 STT/TTS 工作階段。

將即時 selector 放在 `talk.provider` /
`talk.providers` 旁邊的舊版設定，應使用 `openclaw doctor --fix` 修復；執行階段 Talk
不會將 speech/TTS provider 設定重新解釋為即時 provider 設定。

支援的 `talk.session.create` 組合刻意維持少量：

| 模式            | 傳輸       | Brain           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 透過 Gateway 橋接的全雙工 provider 音訊；工具呼叫會透過 agent-consult 工具路由。      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 僅串流 STT；呼叫端傳送輸入音訊並接收轉錄事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/client room | 按鍵通話和對講機風格房間，其中 client 負責擷取/播放，而 Gateway 負責回合狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/client room | 僅限管理員的房間模式，適用於可信任的第一方介面，直接執行 Gateway 工具動作。                  |

已移除方法對照表：

| 舊                              | 新                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
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

  | 方法                          | 適用於                                              | 合約                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 將 base64 PCM 音訊區塊附加到由同一個閘道連線擁有的提供者工作階段。                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 啟動受管理房間的使用者回合。                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在過時回合驗證後結束作用中的回合。                                                                                                                                         |
  | `talk.session.cancelTurn`       | 所有閘道擁有的工作階段                              | 取消某個回合的作用中擷取、提供者、代理、TTS 工作。                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，而不一定結束使用者回合。                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成由轉送器發出的提供者工具呼叫；傳入 `options.willContinue` 以表示暫時輸出，或傳入 `options.suppressResponse` 以在不產生另一個助理回應的情況下滿足該呼叫。 |
  | `talk.session.steer`            | 代理支援的 Talk 工作階段                              | 將語音 `status`、`steer`、`cancel` 或 `followup` 控制傳送到從 Talk 工作階段解析出的作用中嵌入式執行。                                                                |
  | `talk.session.close`            | 所有統一工作階段                                    | 停止轉送工作階段或撤銷受管理房間狀態，然後忘記統一工作階段 ID。                                                                                                    |

  不要在核心中引入提供者或平台特殊情況來讓這項功能運作。
  核心擁有 Talk 工作階段語意。提供者外掛擁有供應商工作階段設定。
  語音通話和 Google Meet 擁有電話語音／會議配接器。瀏覽器和原生
  應用程式擁有裝置擷取／播放使用者體驗。

  ## 相容性政策

  對於外部外掛，相容性工作遵循以下順序：

  1. 新增新合約
  2. 保留透過相容性配接器連接的舊行為
  3. 發出診斷或警告，命名舊路徑和替代項目
  4. 在測試中涵蓋兩條路徑
  5. 記錄棄用與遷移路徑
  6. 只在公告的遷移期限後移除，通常是在主要版本中

  維護者可以使用
  `pnpm plugins:boundary-report` 稽核目前的遷移佇列。使用 `pnpm plugins:boundary-report:summary` 取得
  精簡計數，使用 `--owner <id>` 查看單一外掛或相容性擁有者，並在 CI gate 應因到期的
  相容性記錄、跨擁有者保留 SDK 匯入，或未使用的保留 SDK
  子路徑而失敗時使用 `pnpm plugins:boundary-report:ci`。報告會依移除日期分組已棄用的
  相容性記錄、計算本機程式碼／文件參照、顯示跨擁有者保留 SDK 匯入，並摘要私有
  記憶體主機 SDK 橋接，讓相容性清理保持明確，而不是依賴臨時搜尋。保留 SDK 子路徑必須有追蹤的擁有者使用情況；
  未使用的保留輔助匯出應從公開 SDK 移除。

  如果 manifest 欄位仍被接受，外掛作者可以繼續使用，直到
  文件和診斷另有說明。新程式碼應偏好已記錄的
  替代項目，但現有外掛不應在一般次要版本
  發布期間中斷。

  ## 如何遷移

  <Steps>
  <Step title="遷移執行階段設定載入／寫入輔助程式">
    內建外掛應停止直接呼叫
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用
    已經傳入作用中呼叫路徑的設定。需要目前程序快照的長生命週期處理常式可以使用 `api.runtime.config.current()`。長生命週期
    代理工具應在 `execute` 內使用工具情境的 `ctx.getRuntimeConfig()`，如此在設定寫入前建立的工具仍會看到重新整理後的
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

    當呼叫者知道變更需要乾淨的閘道重新啟動時，使用 `afterWrite: { mode: "restart", reason: "..." }`；只有在呼叫者擁有
    後續動作且刻意想要抑制重新載入規劃器時，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    變更結果包含一個型別化的 `followUp` 摘要供測試與記錄使用；
    閘道仍負責套用或排程重新啟動。
    `loadConfig` 和 `writeConfigFile` 在遷移期間仍作為外部外掛的已棄用相容性
    輔助程式保留，並以
    `runtime-config-load-write` 相容性代碼警告一次。內建外掛和儲存庫
    執行階段程式碼受到
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 的掃描器防護：
    新的正式環境外掛使用會直接失敗、直接設定寫入會失敗、閘道伺服器方法必須使用
    請求執行階段快照、執行階段通道傳送／動作／用戶端輔助程式
    必須從其邊界接收設定，而長生命週期執行階段模組
    允許的環境 `loadConfig()` 呼叫數量為零。

    新外掛程式碼也應避免匯入寬泛的
    `openclaw/plugin-sdk/config-runtime` 相容性 barrel。使用符合工作的窄範圍
    SDK 子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | 設定型別，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | 已載入設定的斷言與外掛入口設定查詢 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前執行階段快照讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | 工作階段儲存輔助程式 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策執行階段輔助程式 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 秘密輸入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型／工作階段覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    內建外掛及其測試受到掃描器防護，避免使用寬泛的
    barrel，因此匯入和 mock 會保持在其所需行為的本機範圍。寬泛的
    barrel 仍為外部相容性存在，但新程式碼不應
    依賴它。

  </Step>

  <Step title="將嵌入式工具結果擴充遷移到中介軟體">
    內建外掛必須將僅限嵌入式執行器的
    `api.registerEmbeddedExtensionFactory(...)` 工具結果處理常式替換為
    執行階段中立的中介軟體。

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同時更新外掛 manifest：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    已安裝的外掛在明確啟用且於
    `contracts.agentToolResultMiddleware` 宣告每個目標執行階段時，也可以註冊工具結果中介軟體。未宣告的已安裝中介軟體
    註冊會被拒絕。

  </Step>

  <Step title="將原生核准處理常式遷移到能力事實">
    具備核准能力的通道外掛現在透過
    `approvalCapability.nativeRuntime` 加上共用的執行階段情境註冊表公開原生核准行為。

    主要變更：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`
    - 將核准特定的 auth／傳遞從舊版 `plugin.auth` /
      `plugin.approvals` 接線移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已從公開通道外掛
      合約中移除；將傳遞／原生／轉譯欄位移到 `approvalCapability`
    - `plugin.auth` 僅保留給通道登入／登出流程；核心不再讀取
      其中的核准 auth hook
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊通道擁有的執行階段物件，例如用戶端、權杖或 Bolt
      app
    - 不要從原生核准處理常式傳送外掛擁有的重新路由通知；
      核心現在從實際傳遞結果擁有路由到他處的通知
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，提供
      真正的 `createPluginRuntime().channel` 表面。不接受部分 stub。

    請參閱 `/plugins/sdk-channel-plugins` 以了解目前的核准能力
    版面配置。

  </Step>

  <Step title="稽核 Windows 包裝器備援行為">
    如果你的外掛使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` 包裝器現在會 fail closed，除非你明確傳入
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

    如果你的呼叫者不是刻意依賴 shell 備援，請不要設定
    `allowShellFallback`，而是處理拋出的錯誤。

  </Step>

  <Step title="尋找已棄用匯入">
    搜尋你的外掛是否有來自任一已棄用表面的匯入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替換為聚焦匯入">
    舊表面的每個匯出都對應到特定的現代匯入路徑：

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

    對於主機端輔助程式，請使用注入的外掛執行階段，而不是直接匯入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    相同模式也適用於其他舊版橋接輔助工具：

    | 舊匯入 | 現代等效項 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 工作階段儲存輔助工具 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="取代寬泛的 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍因外部相容性而存在，但新程式碼應匯入其實際需要的專注輔助工具介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助工具 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳偵測喚醒、事件與可見性輔助工具 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待處理傳遞佇列清空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 通道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本機檔案/媒體路徑輔助工具 | `openclaw/plugin-sdk/file-access-runtime` |
    | 感知分派器的擷取 | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與受防護的擷取輔助工具 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器策略型別 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准請求/解析型別 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆酬載與命令輔助工具 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助工具 | `openclaw/plugin-sdk/error-runtime` |
    | 傳輸就緒等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助工具 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步任務並行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 數值強制轉換 | `openclaw/plugin-sdk/number-runtime` |
    | 程序本機非同步鎖 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖 | `openclaw/plugin-sdk/file-lock` |

    內建外掛受到掃描器防護，不可使用 `infra-runtime`，因此儲存庫程式碼無法退回寬泛的彙整出口。

  </Step>

  <Step title="遷移通道路由輔助工具">
    新的通道路由程式碼應使用 `openclaw/plugin-sdk/channel-route`。較舊的路由鍵與可比較目標名稱在遷移期間仍作為相容別名保留，但新外掛應使用直接描述行為的路由名稱：

    | 舊輔助工具 | 現代輔助工具 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助工具會在原生核准、回覆抑制、傳入去重、排程傳遞與工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。

    不要新增 `ChannelMessagingAdapter.parseExplicitTarget`、以剖析器為基礎的已載入路由輔助工具（`parseExplicitTargetForLoadedChannel` 或 `resolveRouteTargetForLoadedChannel`），或來自 `plugin-sdk/channel-route` 的 `resolveChannelRouteTargetWithParser(...)` 用法。這些掛鉤已被棄用，並且只在遷移期間為較舊的外掛保留。新的通道外掛應使用 `messaging.targetResolver.resolveTarget(...)` 進行目標 ID 正規化與目錄未命中後援；當核心需要早期對等端種類時使用 `messaging.inferTargetChatType(...)`；並使用 `messaging.resolveOutboundSessionRoute(...)` 處理供應商原生工作階段與執行緒身分。

  </Step>

  <Step title="建置與測試">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 匯入路徑參考

  <Accordion title="常見匯入路徑表">
  | 匯入路徑 | 用途 | 主要匯出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準外掛進入點輔助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 舊版通用重新匯出，用於頻道進入點定義/建構器 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定結構描述匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一提供者進入點輔助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的頻道進入點定義與建構器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助工具 | 設定翻譯器、允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定時期執行階段輔助工具 | `createSetupTranslator`、匯入安全的設定修補配接器、查詢註記輔助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委派式設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已淘汰的設定配接器別名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 設定工具輔助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳號輔助工具 | 帳號清單/設定/動作閘門輔助工具 |
  | `plugin-sdk/account-id` | 帳號 ID 輔助工具 | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳號查詢輔助工具 | 帳號查詢 + 預設後援輔助工具 |
  | `plugin-sdk/account-helpers` | 窄範圍帳號輔助工具 | 帳號清單/帳號動作輔助工具 |
  | `plugin-sdk/channel-setup` | 設定精靈配接器 | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配對基礎元件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入中狀態與來源傳遞接線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定配接器工廠與 DM 存取輔助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定結構描述建構器 | 僅限共用頻道設定結構描述基礎元件與通用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定結構描述 | 僅限 OpenClaw 維護的內建外掛；新外掛必須定義外掛本機結構描述 |
  | `plugin-sdk/channel-config-schema-legacy` | 已淘汰的內建設定結構描述 | 僅為相容性別名；維護中的內建外掛請使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 指令設定輔助工具 | 指令名稱正規化、描述修剪、重複/衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組/DM 政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已淘汰的相容性 Facade | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 傳入信封輔助工具 | 共用路由 + 信封建構器輔助工具 |
  | `plugin-sdk/channel-inbound` | 傳入接收輔助工具 | 內容脈絡建構、格式化、根目錄、執行器、已準備回覆派送，以及派送述詞 |
  | `plugin-sdk/messaging-targets` | 已淘汰的目標解析匯入路徑 | 通用目標解析輔助工具請使用 `plugin-sdk/channel-targets`，路由比較請使用 `plugin-sdk/channel-route`，提供者特定目標解析請使用外掛擁有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 傳出媒體輔助工具 | 共用傳出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 已淘汰的相容性 Facade | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 傳出訊息生命週期輔助工具 | 訊息配接器、收據、持久傳送輔助工具、即時預覽/串流輔助工具、回覆選項、生命週期輔助工具、傳出身分，以及承載規劃 |
  | `plugin-sdk/channel-streaming` | 已淘汰的相容性 Facade | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已淘汰的相容性 Facade | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結輔助工具 | 執行緒繫結生命週期與配接器輔助工具 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體承載輔助工具 | 舊版欄位配置的代理媒體承載建構器 |
  | `plugin-sdk/channel-runtime` | 已淘汰的相容性 Shim | 僅限舊版頻道執行階段工具 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久化外掛儲存 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣泛的執行階段輔助工具 | 執行階段/記錄/備份/外掛安裝輔助工具 |
  | `plugin-sdk/runtime-env` | 窄範圍執行階段環境輔助工具 | 記錄器/執行階段環境、逾時、重試與退避輔助工具 |
  | `plugin-sdk/plugin-runtime` | 共用外掛執行階段輔助工具 | 外掛指令/掛鉤/http/互動式輔助工具 |
  | `plugin-sdk/hook-runtime` | 掛鉤管線輔助工具 | 共用網路鉤子/內部掛鉤管線輔助工具 |
  | `plugin-sdk/lazy-runtime` | 延遲執行階段輔助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助工具 | 共用 exec 輔助工具 |
  | `plugin-sdk/cli-runtime` | 命令列介面執行階段輔助工具 | 指令格式化、等待、版本輔助工具 |
  | `plugin-sdk/gateway-runtime` | 閘道輔助工具 | 閘道用戶端、事件迴圈就緒啟動輔助工具，以及頻道狀態修補輔助工具 |
  | `plugin-sdk/config-runtime` | 已淘汰的設定相容性 Shim | 優先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 與 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 指令輔助工具 | 內建 Telegram 合約介面不可用時的後援穩定 Telegram 指令驗證輔助工具 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助工具 | Exec/外掛核准承載、核准功能/設定檔輔助工具、原生核准路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准驗證輔助工具 | 核准者解析、同聊天動作驗證 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助工具 | 原生 exec 核准設定檔/篩選器輔助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 核准傳遞輔助工具 | 原生核准功能/傳遞配接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准閘道輔助工具 | 共用核准閘道解析輔助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准配接器輔助工具 | 熱頻道進入點的輕量原生核准配接器載入輔助工具 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理器輔助工具 | 較廣泛的核准處理器執行階段輔助工具；足夠時優先使用較窄的配接器/閘道接縫 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助工具 | 原生核准目標/帳號繫結輔助工具 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助工具 | Exec/外掛核准回覆承載輔助工具 |
  | `plugin-sdk/channel-runtime-context` | 頻道執行階段內容脈絡輔助工具 | 通用頻道執行階段內容脈絡註冊/取得/監看輔助工具 |
  | `plugin-sdk/security-runtime` | 安全性輔助工具 | 共用信任、DM 閘控、根目錄限定檔案/路徑輔助工具、外部內容，以及密鑰收集輔助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助工具 | 主機允許清單與私有網路政策輔助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助工具 | 釘選派送器、受保護的 fetch、SSRF 政策輔助工具 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳偵測輔助工具 | 心跳偵測喚醒、事件與可見性輔助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 傳遞佇列輔助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 頻道活動輔助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重輔助工具 | 記憶體內去重快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助工具 | 安全的本機檔案/媒體路徑輔助工具 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 核准政策輔助工具 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘控輔助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤格式化輔助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、錯誤圖輔助工具 |
  | `plugin-sdk/fetch-runtime` | 包裝的 fetch/Proxy 輔助工具 | `resolveFetch`、Proxy 輔助工具、EnvHttpProxyAgent 選項輔助工具 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助工具 | `RetryConfig`, `retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化與輸入對應 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 指令閘控與指令介面輔助工具 | `resolveControlCommandGate`、傳送者授權輔助工具、指令登錄輔助工具，包括動態引數選單格式化 |
  | `plugin-sdk/command-status` | 指令狀態/說明呈現器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密鑰輸入解析 | 密鑰輸入輔助工具 |
  | `plugin-sdk/webhook-ingress` | 網路鉤子請求輔助工具 | 網路鉤子目標工具 |
  | `plugin-sdk/webhook-request-guards` | 網路鉤子本文防護輔助工具 | 請求本文讀取/限制輔助工具 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 傳入派送、心跳偵測、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄範圍回覆派送輔助工具 | 完成、提供者派送與對話標籤輔助工具 |
  | `plugin-sdk/reply-history` | 回覆歷史輔助工具 | `createChannelHistoryWindow`；已淘汰的 Map 輔助工具相容性匯出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 與 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助工具 | 文字/Markdown 分塊輔助工具 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具 | 儲存路徑 + 更新時間輔助工具 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助工具 | 狀態與 OAuth 目錄輔助工具 |
  | `plugin-sdk/routing` | 路由/工作階段金鑰輔助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 工作階段金鑰正規化輔助工具 |
  | `plugin-sdk/status-helpers` | 頻道狀態輔助工具 | 頻道/帳號狀態摘要建構器、執行階段狀態預設值、問題中繼資料輔助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助工具 | 共享目標解析器輔助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助工具 | Slug/字串正規化輔助工具 |
  | `plugin-sdk/request-url` | 請求 URL 輔助工具 | 從類請求輸入擷取字串 URL |
  | `plugin-sdk/run-command` | 定時命令輔助工具 | 具有正規化 stdout/stderr 的定時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具/命令列介面參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具酬載擷取 | 從工具結果物件擷取正規化酬載 |
  | `plugin-sdk/tool-send` | 工具傳送擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共享暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆類型 | 回覆酬載類型 |
  | `plugin-sdk/provider-setup` | 精選本機/自行託管供應商設定輔助工具 | 自行託管供應商探索/設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自行託管供應商設定輔助工具 | 相同的自行託管供應商探索/設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 供應商執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 供應商 API 金鑰設定輔助工具 | API 金鑰導入/設定檔寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 供應商驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-selection-runtime` | 供應商選擇輔助工具 | 已設定或自動供應商選擇，以及原始供應商設定合併 |
  | `plugin-sdk/provider-env-vars` | 供應商環境變數輔助工具 | 供應商驗證環境變數查詢輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共享供應商模型/重播輔助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共享重播政策建構器、供應商端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享供應商目錄輔助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 供應商導入修補 | 導入設定輔助工具 |
  | `plugin-sdk/provider-http` | 供應商 HTTP 輔助工具 | 通用供應商 HTTP/端點能力輔助工具，包含音訊轉錄 multipart 表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 供應商 web-fetch 輔助工具 | Web-fetch 供應商註冊/快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 供應商網頁搜尋設定輔助工具 | 適用於不需要外掛啟用串接之供應商的窄範圍網頁搜尋設定/憑證輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 供應商網頁搜尋合約輔助工具 | 窄範圍網頁搜尋設定/憑證合約輔助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及限定範圍的憑證 setter/getter |
  | `plugin-sdk/provider-web-search` | 供應商網頁搜尋輔助工具 | 網頁搜尋供應商註冊/快取/執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 供應商工具/結構描述相容性輔助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 結構描述清理 + 診斷 |
  | `plugin-sdk/provider-usage` | 供應商用量輔助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`，以及其他供應商用量輔助工具 |
  | `plugin-sdk/provider-stream` | 供應商串流包裝器輔助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、串流包裝器類型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 供應商傳輸輔助工具 | 原生供應商傳輸輔助工具，例如受保護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒體輔助工具 | 媒體擷取/轉換/儲存輔助工具、以 ffprobe 為基礎的影片尺寸探測，以及媒體酬載建構器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒體生成輔助工具 | 圖片/影片/音樂生成的共享容錯移轉輔助工具、候選選擇，以及缺少模型訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解供應商類型，以及面向供應商的圖片/音訊輔助匯出 |
  | `plugin-sdk/text-runtime` | 已淘汰的廣泛文字相容性匯出 | 使用 `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`，以及 `logging-core` |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 輸出文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音供應商類型，以及面向供應商的指令、登錄、驗證輔助工具，還有 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共享語音核心 | 語音供應商類型、登錄、指令、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 供應商類型、登錄輔助工具，以及共享 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 供應商類型、登錄/解析輔助工具、橋接工作階段輔助工具、共享代理人回話佇列、作用中執行語音控制、逐字稿/事件健康狀態、回音抑制、諮詢問題比對、強制諮詢協調、回合脈絡追蹤、輸出活動追蹤，以及快速脈絡諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 圖片生成輔助工具 | 圖片生成供應商類型，以及圖片資產/資料 URL 輔助工具和 OpenAI 相容圖片供應商建構器 |
  | `plugin-sdk/image-generation-core` | 共享圖片生成核心 | 圖片生成類型、容錯移轉、驗證，以及登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成供應商/請求/結果類型 |
  | `plugin-sdk/music-generation-core` | 共享音樂生成核心 | 音樂生成類型、容錯移轉輔助工具、供應商查詢，以及模型參照解析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成供應商/請求/結果類型 |
  | `plugin-sdk/video-generation-core` | 共享影片生成核心 | 影片生成類型、容錯移轉輔助工具、供應商查詢，以及模型參照解析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆酬載正規化/縮減 |
  | `plugin-sdk/channel-config-primitives` | 頻道設定基元 | 窄範圍頻道設定結構描述基元 |
  | `plugin-sdk/channel-config-writes` | 頻道設定寫入輔助工具 | 頻道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享頻道前置匯出 | 共享頻道外掛前置匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共享頻道狀態快照/摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯/讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共享群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已淘汰的相容性外觀 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM 防護輔助工具 | 窄範圍預加密防護政策輔助工具 |
  | `plugin-sdk/extension-shared` | 共享擴充輔助工具 | 被動頻道/狀態與環境代理輔助基元 |
  | `plugin-sdk/webhook-targets` | 網路鉤子目標輔助工具 | 網路鉤子目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | 已淘汰的網路鉤子路徑別名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享網頁媒體輔助工具 | 遠端/本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | 已淘汰的 Zod 相容性重新匯出 | 直接從 `zod` 匯入 `zod` |
  | `plugin-sdk/memory-core` | 隨附的 memory-core 輔助工具 | 記憶管理器/設定/檔案/命令列介面輔助工具介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶引擎執行階段外觀 | 記憶索引/搜尋執行階段外觀 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 記憶嵌入登錄 | 輕量記憶嵌入供應商登錄輔助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎 | 記憶主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入引擎 | 記憶嵌入合約、登錄存取、本機供應商，以及通用批次/遠端輔助工具；具體遠端供應商位於其所屬外掛中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎 | 記憶主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎 | 記憶主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 | 記憶主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 | 記憶主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶主機祕密輔助工具 | 記憶主機祕密輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 已淘汰的記憶事件別名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 | 記憶主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機命令列介面執行階段 | 記憶主機命令列介面執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段 | 記憶主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 | 記憶主機檔案/執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段別名 | 記憶主機核心執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-events` | 記憶主機事件日誌別名 | 記憶主機事件日誌輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-files` | 已淘汰的記憶檔案/執行階段別名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 受管理 Markdown 輔助工具 | 適用於記憶相鄰外掛的共享受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | 主動記憶搜尋外觀 | 延遲載入的主動記憶搜尋管理器執行階段外觀 |
  | `plugin-sdk/memory-host-status` | 已淘汰的記憶主機狀態別名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 測試工具 | 儲存庫本機已淘汰的相容性彙整匯出；使用聚焦的儲存庫本機測試子路徑，例如 `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`，以及 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出常見遷移子集，而不是完整 SDK
介面。編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會從
公開子集產生。

保留的 bundled-plugin 輔助 seam 已從公開 SDK
匯出對照表中退役，但明確記載的相容性 facade 除外，例如為已發布
`@openclaw/discord@2026.3.13` 套件保留、已棄用的
`plugin-sdk/discord` shim。特定擁有者的輔助工具位於
擁有該功能的外掛套件內；共用的主機行為應透過通用 SDK
合約移動，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用符合工作的最窄匯入。如果找不到匯出，
請查看 `src/plugin-sdk/` 的原始碼，或詢問維護者該由哪個通用合約
擁有它。

## 作用中的棄用項目

適用於整個外掛 SDK、提供者合約、
執行階段介面和 manifest 的較窄棄用項目。每一項目前仍可運作，
但會在未來的 major 版本中移除。每個項目下方的條目會將舊 API
對應到其標準替代項。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 → command-status">
    **舊版 (`openclaw/plugin-sdk/command-auth`)**：`buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新版 (`openclaw/plugin-sdk/command-status`)**：相同簽章、相同
    匯出 - 只是改從較窄的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性 stub。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及門控輔助工具 → resolveInboundMentionDecision">
    **舊版**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })` - 回傳單一
    決策物件，而不是兩個拆開的呼叫。

    下游通道外掛（Slack、Discord、Matrix、MS Teams）已經
    切換。

  </Accordion>

  <Accordion title="通道執行階段 shim 和通道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是給較舊
    通道外掛使用的相容性 shim。新程式碼不要匯入它；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 來註冊執行階段
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助工具
    會與原始 `"actions"` 通道匯出一併棄用。改透過語意化的
    `presentation` 介面公開能力 - 通道外掛
    宣告它們會轉譯什麼（卡片、按鈕、選取器），而不是接受哪些原始
    動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋提供者 tool() 輔助工具 → 外掛上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    factory。

    **新版**：直接在提供者外掛上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助工具來註冊工具 wrapper。

  </Accordion>

  <Accordion title="純文字通道信封 → BodyForAgent">
    **舊版**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`）用來從傳入通道訊息建立扁平的純文字提示
    信封。

    **新版**：`BodyForAgent` 加上結構化的使用者情境區塊。通道
    外掛會將路由中繼資料（thread、topic、reply-to、reactions）附加為
    型別化欄位，而不是串接進提示字串。
    `formatAgentEnvelope(...)` 輔助工具仍支援合成的
    面向 assistant 的信封，但傳入純文字信封正在
    逐步淘汰。

    受影響區域：`inbound_claim`、`message_received`，以及任何後處理
    `channelEnvelope` 文字的自訂
    通道外掛。

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **舊版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。事件與情境是相同的
    關機清理合約；只有 hook 名稱改變。

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 仍會作為已棄用的相容性別名接線，直到
    2026-08-16 之後。

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **舊版**：`api.on("subagent_spawning", handler)` 回傳
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：讓 core 透過通道 session-binding adapter 準備
    `thread: true` 子代理繫結。僅將 `api.on("subagent_spawned", handler)`
    用於啟動後觀察。

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 僅會在
    外部外掛遷移期間保留為已棄用的相容性介面。

  </Accordion>

  <Accordion title="提供者探索型別 → 提供者目錄型別">
    四個探索型別別名現在是 catalog-era 型別的薄 wrapper：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    以及舊版 `ProviderCapabilities` 靜態 bag - 提供者外掛
    應使用明確的提供者 hook，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是靜態物件。

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上的三個獨立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，會回傳
    `ProviderThinkingProfile`，其中含有標準 `id`、可選的 `label`，
    以及排序後的層級清單。OpenClaw 會依 profile
    rank 自動降級過時的已儲存值。

    情境包含 `provider`、`modelId`、可選的合併 `reasoning`，
    以及可選的合併模型 `compat` 事實。提供者外掛可以使用這些
    目錄事實，只在設定的
    request contract 支援時公開特定模型的 profile。

    請實作一個 hook，而不是三個。舊版 hook 在
    棄用期間仍可運作，但不會與 profile 結果組合。

  </Accordion>

  <Accordion title="外部驗證提供者 → contracts.externalAuthProviders">
    **舊版**：實作外部驗證 hook，但未在外掛 manifest 中宣告
    提供者。

    **新版**：在外掛 manifest 中宣告 `contracts.externalAuthProviders`
    **並且**實作 `resolveExternalAuthProfiles(...)`。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供者環境變數查找 → setup.providers[].envVars">
    **舊版** manifest 欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：將相同的環境變數查找鏡像到 manifest 上的
    `setup.providers[].envVars`。這會把設定/狀態環境中繼資料集中在同一個
    位置，並避免只是為了回答環境變數
    查找就啟動外掛執行階段。

    `providerAuthEnvVars` 會透過相容性 adapter 繼續支援，
    直到棄用期間結束。

  </Accordion>

  <Accordion title="記憶外掛註冊 → registerMemoryCapability">
    **舊版**：三個獨立呼叫 -
    `api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、
    `api.registerMemoryRuntime(...)`。

    **新版**：memory-state API 上的一個呼叫 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同 slots，單一註冊呼叫。加成的提示與 corpus 輔助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）
    不受影響。

  </Accordion>

  <Accordion title="記憶嵌入提供者 API">
    **舊版**：`api.registerMemoryEmbeddingProvider(...)` 加上
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加上
    `contracts.embeddingProviders`。

    通用嵌入提供者合約可在記憶之外重複使用，
    並且是新提供者的支援路徑。記憶專用註冊 API
    在既有提供者遷移期間仍會作為已棄用的相容性接線。
    外掛檢查會將非 bundled 使用回報為相容性債務。

  </Accordion>

  <Accordion title="子代理 session 訊息型別重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊版                          | 新版                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。相同簽章；舊方法會呼叫
    新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）回傳即時 task-flow accessor。

    **新版**：`runtime.tasks.managedFlows` 保留受管理的 TaskFlow 變更
    執行階段，供會從 flow 建立、更新、取消或執行子任務的
    外掛使用。當外掛只需要以 DTO 為基礎的讀取時，請使用
    `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式 extension factories → agent tool-result middleware">
    已在上方「如何遷移 → 將嵌入式 tool-result extensions 遷移至
    middleware」中涵蓋。此處為完整性而列出：已移除、僅限 embedded-runner 的
    `api.registerEmbeddedExtensionFactory(...)` 路徑，會由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中使用明確的執行階段
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
Extension 層級棄用項目（位於
`extensions/` 下 bundled 通道/提供者外掛內）會在各自的 `api.ts` 和 `runtime-api.ts`
barrel 中追蹤。它們不影響第三方外掛合約，因此未列於
此處。如果你直接使用 bundled 外掛的本機 barrel，升級前請閱讀該
barrel 中的棄用註解。
</Note>

## 移除時程

| 時間                   | 會發生什麼                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**                | 已棄用介面會發出執行階段警告                               |
| **下一個主要版本** | 已棄用介面將被移除；仍在使用它們的外掛將會失敗 |

所有核心外掛都已經完成遷移。外部外掛應在下一個主要版本之前完成遷移。

## 暫時抑制警告

在進行遷移時設定這些環境變數：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是臨時的權宜機制，不是永久解決方案。

## 相關

- [入門](/zh-TW/plugins/building-plugins) - 建置你的第一個外掛
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [通道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建置通道外掛
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) - 建置提供者外掛
- [外掛內部](/zh-TW/plugins/architecture) - 架構深入探討
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單結構描述參考

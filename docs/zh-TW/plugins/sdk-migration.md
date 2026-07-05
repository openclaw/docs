---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到了 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你曾在 OpenClaw 2026.4.25 之前使用 api.registerEmbeddedExtensionFactory
    - 你正在將外掛更新為現代外掛架構
    - 你維護外部 OpenClaw 外掛
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代外掛 SDK
title: 外掛 SDK 遷移
x-i18n:
    generated_at: "2026-07-05T11:32:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed78d88fde5449c4e8f979839a729e05348a4307a85ef9839be9d98a29b93178
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已將廣泛的向後兼容層，替換為由小型、聚焦匯入所建構的現代外掛架構。如果你的外掛早於該變更，本指南會協助它遷移到目前的合約。

## 變更內容

過去有兩個開放範圍很廣的匯入介面，讓外掛能從單一進入點存取幾乎所有內容：

- **`openclaw/plugin-sdk/compat`** - 重新匯出數十個輔助工具，以便在新架構建置期間維持較舊的 hook 型外掛可運作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一個廣泛的 barrel，混合了系統事件、心跳偵測狀態、傳遞佇列、fetch/proxy 輔助工具、檔案輔助工具、核准類型，以及不相關的工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一個廣泛的設定 barrel，在遷移期間仍攜帶已棄用的直接載入/寫入輔助工具。
- **`openclaw/extension-api`** - 一個橋接層，讓外掛可直接存取主機端輔助工具，例如內嵌代理執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除、僅供內嵌執行器使用的 hook，過去會觀察內嵌執行器事件，例如 `tool_result`。請改用代理工具結果 middleware（請參閱[將內嵌工具結果擴充功能遷移至 middleware](#how-to-migrate)）。

這些介面已**棄用**：它們仍可運作，但新外掛不得使用，既有外掛也應在下一個主要版本移除它們之前完成遷移。`registerEmbeddedExtensionFactory` 已經移除；舊式註冊不再載入。

<Warning>
  向後兼容層將在未來的主要版本中移除。仍從這些介面匯入的外掛屆時會中斷。
</Warning>

OpenClaw 不會在引入替代方案的同一個變更中，移除或重新詮釋已文件化的外掛行為。破壞性合約變更會先經過兼容性轉接器、診斷、文件，以及棄用期間。這適用於 SDK 匯入、manifest 欄位、設定 API、hook，以及 runtime 註冊行為。

### 原因

- **啟動緩慢** - 匯入一個輔助工具會載入數十個不相關的模組。
- **循環依賴** - 廣泛的重新匯出讓匯入循環很容易產生。
- **API 介面不清楚** - 無法分辨穩定匯出與內部匯出。

每個 `openclaw/plugin-sdk/<subpath>` 現在都是小型、自包含，且具備文件化合約的模組。

舊式的 bundled channels provider 便利介面也已移除 - channel 品牌化的輔助捷徑是私有 mono-repo 便利功能，不是穩定的外掛合約。請改用狹窄的通用 SDK 子路徑。在 bundled plugin workspace 內，將 provider 擁有的輔助工具保留在該外掛自己的 `api.ts` 或 `runtime-api.ts`：

- Anthropic 將 Claude 專用的串流輔助工具保留在自己的 `api.ts` / `contract-api.ts` 介面中。
- OpenAI 將 provider builder、預設模型輔助工具，以及 realtime provider builder 保留在自己的 `api.ts` 中。
- OpenRouter 將 provider builder 與 onboarding/config 輔助工具保留在自己的 `api.ts` 中。

## 兼容性政策

外部外掛兼容性工作依此順序進行：

1. 新增新合約。
2. 透過兼容性轉接器保留舊行為的接線。
3. 發出診斷或警告，命名舊路徑與替代方案。
4. 在測試中涵蓋兩條路徑。
5. 文件化棄用與遷移路徑。
6. 僅在已公告的遷移期間結束後移除，通常是在主要版本中。

如果 manifest 欄位仍被接受，請繼續使用，直到文件與診斷另有說明。新程式碼應優先使用已文件化的替代方案；既有外掛不應在一般次要版本中中斷。

使用 `pnpm plugins:boundary-report` 稽核目前的遷移佇列：

| 旗標                                                    | 效果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 使用精簡計數，而不是完整詳細資訊。                                         |
| `--json`                                                | 機器可讀報告。                                                       |
| `--owner <id>`                                          | 篩選到單一外掛或兼容性擁有者。                                   |
| `--fail-on-cross-owner`                                 | 在跨擁有者保留 SDK 匯入時以非零狀態結束。                             |
| `--fail-on-eligible-compat`                             | 當已棄用 compat 記錄的 `removeAfter` 日期已過時，以非零狀態結束。 |
| `--fail-on-unclassified-unused-reserved`                | 在未使用且未分類的保留 SDK shim 上以非零狀態結束。                                    |

`pnpm plugins:boundary-report:ci` 會啟用全部三個失敗旗標。每筆兼容性記錄都有明確的 `removeAfter` 日期（不是含糊的「下一個主要版本」）- 報告會依該日期分組已棄用記錄、計算本機程式碼/文件參照、揭露跨擁有者的保留 SDK 匯入，並摘要私有記憶體主機 SDK 橋接。保留 SDK 子路徑必須有追蹤的擁有者使用情形；未使用的保留匯出應從公開 SDK 移除。

## 如何遷移

<Steps>
  <Step title="遷移 runtime 設定載入/寫入輔助工具">
    Bundled 外掛應停止直接呼叫 `api.runtime.config.loadConfig()` 與
    `api.runtime.config.writeConfigFile(...)`。優先使用已傳入作用中呼叫路徑的設定。需要目前程序快照的長生命週期 handler 可以使用 `api.runtime.config.current()`。長生命週期的代理工具應在 `execute` 內讀取 `ctx.getRuntimeConfig()`，讓設定寫入前建立的工具仍能看到重新整理後的設定。

    設定寫入會透過具有明確寫入後政策的交易式輔助工具執行：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當變更需要乾淨的閘道重新啟動時，使用 `afterWrite: { mode: "restart", reason: "..." }`；只有當呼叫端擁有後續動作並刻意抑制重新載入規劃器時，才使用 `afterWrite: { mode: "none", reason: "..." }`。Mutation 結果包含型別化的 `followUp` 摘要，可供測試與記錄使用；閘道仍負責套用或排程重新啟動。

    `loadConfig` 與 `writeConfigFile` 仍作為外部外掛的已棄用兼容性輔助工具保留，並以 `runtime-config-load-write` 兼容性代碼發出一次警告。Bundled 外掛與 repo runtime 程式碼由 `pnpm check:deprecated-api-usage` 與 `pnpm check:no-runtime-action-load-config` 防護：新的 production 外掛使用會直接失敗，直接設定寫入會失敗，閘道 server 方法必須使用請求 runtime 快照，runtime channel send/action/client 輔助工具必須從其邊界接收設定，且長生命週期 runtime 模組允許零個環境式 `loadConfig()` 呼叫。

    新的外掛程式碼應避免廣泛的 `openclaw/plugin-sdk/config-runtime` barrel。請針對工作使用狹窄的子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | 設定類型，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | 已載入設定斷言與外掛進入點設定查詢 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前 runtime 快照讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | Session store 輔助工具 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策 runtime 輔助工具 | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input 解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session 覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled 外掛與其測試受到掃描器防護，避免使用廣泛 barrel，讓匯入與 mock 都維持在所需行為的本機範圍內。該 barrel 仍為外部兼容性存在，但新程式碼不應依賴它。

  </Step>

  <Step title="將內嵌工具結果擴充功能遷移至 middleware">
    Bundled 外掛必須以 runtime 中立的 middleware，取代僅供內嵌執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 工具結果 handler：

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

    已安裝的外掛也可以在明確啟用，且每個目標 runtime 都已在 `contracts.agentToolResultMiddleware` 宣告時，註冊工具結果 middleware。未宣告的已安裝 middleware 註冊會被拒絕。

  </Step>

  <Step title="將 approval-native handler 遷移到 capability facts">
    具備核准能力的 channel 外掛會透過 `approvalCapability.nativeRuntime` 加上共享 runtime-context registry，公開原生核准行為：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`。
    - 將核准專用 auth/delivery 從舊式 `plugin.auth` /
      `plugin.approvals` 接線移到 `approvalCapability`。
    - `ChannelPlugin.approvals` 已從公開的 channel-plugin 合約中移除；請將 delivery/native/render 欄位移到
      `approvalCapability`。
    - `plugin.auth` 僅保留給 channel login/logout 流程；core 不再從那裡讀取核准 auth hook。
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊 channel 擁有的 runtime 物件（clients、tokens、Bolt apps）。
    - 不要從原生核准 handler 傳送外掛擁有的 reroute 通知；core 擁有來自實際傳遞結果的 routed-elsewhere 通知。
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供真正的 `createPluginRuntime().channel` 介面 - partial stub 會被拒絕。

    請參閱 [Channel 外掛](/zh-TW/plugins/sdk-channel-plugins) 以取得目前的核准能力版面配置。

  </Step>

  <Step title="稽核 Windows wrapper fallback 行為">
    如果你的外掛使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` wrapper 現在會封閉失敗，除非你明確傳入
    `allowShellFallback: true`：

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

    如果你的呼叫端不是刻意依賴 shell fallback，請不要設定
    `allowShellFallback`，並改為處理拋出的錯誤。

  </Step>

  <Step title="尋找已棄用的匯入">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="替換為聚焦匯入">
    舊介面的每個匯出都會對應到特定的現代匯入路徑：

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

    對於主機端輔助工具，請使用注入的外掛執行階段，而不是直接匯入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    其他舊版橋接輔助工具也使用相同模式：

    | 舊匯入 | 現代等效項目 |
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
    `openclaw/plugin-sdk/infra-runtime` 仍會為外部相容性保留，但新程式碼應匯入它實際需要的聚焦介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助工具 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳偵測喚醒、事件與可見性輔助工具 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待處理傳遞佇列清空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 頻道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內與持久化後端的去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本機檔案/媒體路徑輔助工具 | `openclaw/plugin-sdk/file-access-runtime` |
    | 可感知分派器的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與受保護的 fetch 輔助工具 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器原則型別 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准請求/解析型別 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆酬載與命令輔助工具 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助工具 | `openclaw/plugin-sdk/error-runtime` |
    | 傳輸就緒等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助工具 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步任務並行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 數值強制轉換 | `openclaw/plugin-sdk/number-runtime` |
    | 程序本機非同步鎖 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖 | `openclaw/plugin-sdk/file-lock` |

    內建外掛已受掃描器保護，禁止使用 `infra-runtime`，因此儲存庫程式碼無法退回寬泛 barrel。

  </Step>

  <Step title="遷移頻道路由輔助工具">
    新的頻道路由程式碼使用 `openclaw/plugin-sdk/channel-route`。較舊的 route-key 與 comparable-target 名稱會保留作為相容性別名：

    | 舊輔助工具 | 現代輔助工具 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助工具會在原生核准、回覆抑制、入站去重、排程傳遞與工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。

    不要新增對 `ChannelMessagingAdapter.parseExplicitTarget`、parser-backed loaded-route 輔助工具（`parseExplicitTargetForLoadedChannel`、`resolveRouteTargetForLoadedChannel`），或來自 `plugin-sdk/channel-route` 的 `resolveChannelRouteTargetWithParser(...)` 的使用 - 這些已棄用，僅為較舊的外掛保留。新的頻道外掛應使用 `messaging.targetResolver.resolveTarget(...)` 進行 target-id 正規化與目錄未命中後援，當核心需要早期對等端種類時使用 `messaging.inferTargetChatType(...)`，並使用 `messaging.resolveOutboundSessionRoute(...)` 處理提供者原生工作階段與對話串身分。

  </Step>

  <Step title="建置與測試">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## 匯入路徑參考

  <Accordion title="Common import path table">
  | 匯入路徑 | 用途 | 主要匯出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準外掛進入點輔助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 通道進入點定義/建構器的舊版總括重新匯出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定架構匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一提供者進入點輔助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的通道進入點定義與建構器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助工具 | 設定翻譯器、允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定期間執行階段輔助工具 | `createSetupTranslator`、匯入安全的設定修補配接器、查找備註輔助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委派設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已淘汰的設定配接器別名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 設定工具輔助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳號輔助工具 | 帳號清單/設定/動作閘門輔助工具 |
  | `plugin-sdk/account-id` | 帳號 ID 輔助工具 | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳號查找輔助工具 | 帳號查找 + 預設備援輔助工具 |
  | `plugin-sdk/account-helpers` | 窄範圍帳號輔助工具 | 帳號清單/帳號動作輔助工具 |
  | `plugin-sdk/channel-setup` | 設定精靈配接器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配對原語 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入中狀態與來源傳遞接線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定配接器工廠與 DM 存取輔助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定架構建構器 | 僅限共用通道設定架構原語與通用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定架構 | 僅限 OpenClaw 維護的內建外掛；新外掛必須定義外掛本機架構 |
  | `plugin-sdk/channel-config-schema-legacy` | 已淘汰的內建設定架構 | 僅限相容性別名；對維護中的內建外掛使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令設定輔助工具 | 命令名稱正規化、描述修剪、重複/衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組/DM 政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 輸入信封輔助工具 | 共用路由 + 信封建構器輔助工具 |
  | `plugin-sdk/channel-inbound` | 輸入接收輔助工具 | 內容建構、格式化、根、執行器、已準備回覆分派，以及分派述詞 |
  | `plugin-sdk/messaging-targets` | 已淘汰的目標剖析匯入路徑 | 對通用目標剖析輔助工具使用 `plugin-sdk/channel-targets`，對路由比較使用 `plugin-sdk/channel-route`，對提供者專屬目標解析使用外掛擁有的 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 輸出媒體輔助工具 | 共用輸出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 輸出訊息生命週期輔助工具 | 訊息配接器、回執、耐久發送輔助工具、即時預覽/串流輔助工具、回覆選項、生命週期輔助工具、輸出身分與酬載規劃 |
  | `plugin-sdk/channel-streaming` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結輔助工具 | 執行緒繫結生命週期與配接器輔助工具 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體酬載輔助工具 | 舊版欄位版面配置的代理媒體酬載建構器 |
  | `plugin-sdk/channel-runtime` | 已淘汰的相容性 shim | 僅限舊版通道執行階段公用工具 |
  | `plugin-sdk/channel-send-result` | 發送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久化外掛儲存 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣範圍執行階段輔助工具 | 執行階段/記錄/備份/外掛安裝輔助工具 |
  | `plugin-sdk/runtime-env` | 窄範圍執行階段環境輔助工具 | 記錄器/執行階段環境、逾時、重試與退避輔助工具 |
  | `plugin-sdk/plugin-runtime` | 共用外掛執行階段輔助工具 | 外掛命令/鉤子/HTTP/互動式輔助工具 |
  | `plugin-sdk/hook-runtime` | 鉤子管線輔助工具 | 共用網路鉤子/內部鉤子管線輔助工具 |
  | `plugin-sdk/lazy-runtime` | 延遲載入執行階段輔助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助工具 | 共用執行輔助工具 |
  | `plugin-sdk/cli-runtime` | 命令列介面執行階段輔助工具 | 命令格式化、等待、版本輔助工具 |
  | `plugin-sdk/gateway-runtime` | 閘道輔助工具 | 閘道用戶端、事件迴圈就緒啟動輔助工具、公告的 LAN 主機解析，以及通道狀態修補輔助工具 |
  | `plugin-sdk/config-runtime` | 已淘汰的設定相容性 shim | 優先使用 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令輔助工具 | 內建 Telegram 合約介面無法使用時，備援穩定的 Telegram 命令驗證輔助工具 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助工具 | 執行/外掛核准酬載、核准能力/設定檔輔助工具、原生核准路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准授權輔助工具 | 核准者解析、同一聊天動作授權 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助工具 | 原生執行核准設定檔/篩選器輔助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 核准傳遞輔助工具 | 原生核准能力/傳遞配接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准閘道輔助工具 | 共用核准閘道解析輔助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准配接器輔助工具 | 熱通道進入點的輕量原生核准配接器載入輔助工具 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理常式輔助工具 | 較廣範圍的核准處理常式執行階段輔助工具；足夠時優先使用較窄的配接器/閘道接縫 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助工具 | 原生核准目標/帳號繫結輔助工具 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助工具 | 執行/外掛核准回覆酬載輔助工具 |
  | `plugin-sdk/channel-runtime-context` | 通道執行階段內容輔助工具 | 通用通道執行階段內容註冊/取得/監看輔助工具 |
  | `plugin-sdk/security-runtime` | 安全性輔助工具 | 共用信任、DM 閘控、根目錄範圍限制的檔案/路徑輔助工具、外部內容與密鑰收集輔助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助工具 | 主機允許清單與私有網路政策輔助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助工具 | 固定調度器、受防護的擷取、SSRF 政策輔助工具 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳偵測輔助工具 | 心跳偵測喚醒、事件與可見性輔助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 傳遞佇列輔助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 通道活動輔助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重輔助工具 | 記憶體內與持久化後端的去重快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助工具 | 安全本機檔案/媒體路徑輔助工具 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 執行核准政策輔助工具 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘控輔助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤格式化輔助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、錯誤圖輔助工具 |
  | `plugin-sdk/fetch-runtime` | 包裝式擷取/代理輔助工具 | `resolveFetch`、代理輔助工具、EnvHttpProxyAgent 選項輔助工具 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助工具 | `RetryConfig`, `retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化與輸入對應 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令閘控與命令介面輔助工具 | `resolveControlCommandGate`、發送者授權輔助工具、命令登錄輔助工具，包含動態引數選單格式化 |
  | `plugin-sdk/command-status` | 命令狀態/說明轉譯器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密鑰輸入剖析 | 密鑰輸入輔助工具 |
  | `plugin-sdk/webhook-ingress` | 網路鉤子請求輔助工具 | 網路鉤子目標公用工具 |
  | `plugin-sdk/webhook-request-guards` | 網路鉤子主體防護輔助工具 | 請求主體讀取/限制輔助工具 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 輸入分派、心跳偵測、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄範圍回覆分派輔助工具 | 完成、提供者分派與對話標籤輔助工具 |
  | `plugin-sdk/reply-history` | 回覆歷史輔助工具 | `createChannelHistoryWindow`；已淘汰的對應表輔助工具相容性匯出，例如 `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助工具 | 文字/Markdown 分塊輔助工具 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具 | 儲存路徑 + updated-at 輔助工具 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助工具 | 狀態與 OAuth 目錄輔助工具 |
  | `plugin-sdk/routing` | 路由／工作階段金鑰輔助工具 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、工作階段金鑰正規化輔助工具 |
  | `plugin-sdk/status-helpers` | 頻道狀態輔助工具 | 頻道／帳號狀態摘要建構器、執行階段狀態預設值、議題中繼資料輔助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助工具 | 共用目標解析器輔助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助工具 | slug／字串正規化輔助工具 |
  | `plugin-sdk/request-url` | 請求 URL 輔助工具 | 從類請求輸入擷取字串 URL |
  | `plugin-sdk/run-command` | 計時命令輔助工具 | 具備正規化 stdout/stderr 的計時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具／命令列介面參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具承載資料擷取 | 從工具結果物件擷取正規化承載資料 |
  | `plugin-sdk/tool-send` | 工具傳送擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆型別 | 回覆承載資料型別 |
  | `plugin-sdk/provider-setup` | 精選本機／自託管供應商設定輔助工具 | 自託管供應商探索／設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦 OpenAI 相容自託管供應商設定輔助工具 | 相同的自託管供應商探索／設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 供應商執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 供應商 API 金鑰設定輔助工具 | API 金鑰導入／設定檔寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 供應商驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-selection-runtime` | 供應商選取輔助工具 | 已設定或自動供應商選取，以及原始供應商設定合併 |
  | `plugin-sdk/provider-env-vars` | 供應商環境變數輔助工具 | 供應商驗證環境變數查找輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用供應商模型／重播輔助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、供應商端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用供應商目錄輔助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 供應商導入修補 | 導入設定輔助工具 |
  | `plugin-sdk/provider-http` | 供應商 HTTP 輔助工具 | 通用供應商 HTTP／端點能力輔助工具，包含音訊轉錄 multipart 表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 供應商網頁擷取輔助工具 | 網頁擷取供應商註冊／快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 供應商網頁搜尋設定輔助工具 | 適用於不需要外掛啟用接線之供應商的精簡網頁搜尋設定／憑證輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 供應商網頁搜尋合約輔助工具 | 精簡網頁搜尋設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍的憑證設定器／取得器 |
  | `plugin-sdk/provider-web-search` | 供應商網頁搜尋輔助工具 | 網頁搜尋供應商註冊／快取／執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 供應商工具／結構描述相容輔助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 結構描述清理與診斷 |
  | `plugin-sdk/provider-usage` | 供應商用量輔助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他供應商用量輔助工具 |
  | `plugin-sdk/provider-stream` | 供應商串流包裝器輔助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 供應商傳輸輔助工具 | 原生供應商傳輸輔助工具，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取／轉換／儲存輔助工具、以 ffprobe 支援的影片尺寸探測，以及媒體承載資料建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 圖片／影片／音樂生成的共用容錯移轉輔助工具、候選項選取，以及缺少模型訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解供應商型別，以及面向供應商的圖片／音訊輔助工具匯出 |
  | `plugin-sdk/text-runtime` | 已棄用的寬泛文字相容性匯出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 對外文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音供應商型別，以及面向供應商的指令、登錄、驗證輔助工具與 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音供應商型別、登錄、指令、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 供應商型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 供應商型別、登錄／解析輔助工具、橋接工作階段輔助工具、共用代理回話佇列、作用中執行語音控制、逐字稿／事件健康狀態、回音抑制、諮詢問題比對、強制諮詢協調、回合情境追蹤、輸出活動追蹤，以及快速情境諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 圖片生成輔助工具 | 圖片生成供應商型別，以及圖片資產／資料 URL 輔助工具與 OpenAI 相容圖片供應商建構器 |
  | `plugin-sdk/image-generation-core` | 共用圖片生成核心 | 圖片生成型別、容錯移轉、驗證與登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成供應商／請求／結果型別 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成型別、容錯移轉輔助工具、供應商查找，以及模型參照剖析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成供應商／請求／結果型別 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成型別、容錯移轉輔助工具、供應商查找，以及模型參照剖析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆承載資料正規化／縮減 |
  | `plugin-sdk/channel-config-primitives` | 頻道設定基礎元件 | 精簡頻道設定結構描述基礎元件 |
  | `plugin-sdk/channel-config-writes` | 頻道設定寫入輔助工具 | 頻道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用頻道前置匯出 | 共用頻道外掛前置匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共用頻道狀態快照／摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯／讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已棄用的相容性門面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | 直接私訊防護輔助工具 | 精簡加密前防護政策輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充輔助工具 | 被動頻道／狀態與環境代理輔助基礎元件 |
  | `plugin-sdk/webhook-targets` | 網路鉤子目標輔助工具 | 網路鉤子目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | 已棄用的網路鉤子路徑別名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共用網頁媒體輔助工具 | 遠端／本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | 已棄用的 Zod 相容性重新匯出 | 直接從 `zod` 匯入 `zod` |
  | `plugin-sdk/memory-core` | 內建記憶體核心輔助工具 | 記憶體管理器／設定／檔案／命令列介面輔助工具介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶體引擎執行階段門面 | 記憶體索引／搜尋執行階段門面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 記憶體嵌入登錄 | 輕量記憶體嵌入供應商登錄輔助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎 | 記憶體主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入引擎 | 記憶體嵌入合約、登錄存取、本機供應商，以及通用批次／遠端輔助工具；具體遠端供應商位於其所屬外掛中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎 | 記憶體主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎 | 記憶體主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶體主機多模態輔助工具 | 記憶體主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶體主機查詢輔助工具 | 記憶體主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶體主機祕密輔助工具 | 記憶體主機祕密輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 已棄用的記憶體事件別名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助工具 | 記憶體主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機命令列介面執行階段 | 記憶體主機命令列介面執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段 | 記憶體主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案／執行階段輔助工具 | 記憶體主機檔案／執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段別名 | 記憶體主機核心執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌別名 | 記憶體主機事件日誌輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-files` | 已棄用的記憶體檔案／執行階段別名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 受管理 Markdown 輔助工具 | 供記憶體相鄰外掛使用的共用受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | 主動記憶搜尋門面 | 延遲載入的主動記憶搜尋管理器執行階段門面 |
  | `plugin-sdk/memory-host-status` | 已棄用的記憶體主機狀態別名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 測試公用工具 | 儲存庫本機已棄用的相容性彙整匯出；使用聚焦的儲存庫本機測試子路徑，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表格是常見遷移子集，不是完整的 SDK 介面。編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出會從公開子集產生。

保留的內建外掛輔助接縫已從公開 SDK 匯出映射中退役，但明確記錄的相容性 facade 除外，例如保留給仍直接匯入已發布 `@openclaw/discord` 套件之外部外掛的已棄用 `plugin-sdk/discord` shim。擁有者專屬輔助工具位於所屬外掛套件內；共用主機行為會透過泛用 SDK 合約移動，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

使用符合工作的最窄匯入。如果找不到匯出，請檢查 `src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個泛用合約擁有它。

## 作用中的棄用項目

外掛 SDK、供應者合約、執行階段介面和 manifest 中更窄範圍的棄用項目。每個項目目前仍可運作，但會在未來的主要版本中移除。每個項目都會將舊 API 對應到其標準替代項。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 -> command-status">
    **舊 (`openclaw/plugin-sdk/command-auth`)**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新 (`openclaw/plugin-sdk/command-status`)**：相同簽章、相同匯出，只是從更窄的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性 stub。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及閘控輔助工具 -> resolveInboundMentionDecision">
    **舊**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveMentionGating(params)` 和
    `resolveMentionGatingWithBypass(params)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，使用一個決策物件，而不是兩種拆分的呼叫形狀。

    已在 Discord、iMessage、Matrix、MS Teams、QQ Bot、Signal、
    Telegram、WhatsApp 和 Zalo 中採用。Slack 自身的 `app_mention` 事件模型不使用此輔助工具。

  </Accordion>

  <Accordion title="頻道執行階段 shim 和頻道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是舊版頻道外掛的相容性 shim。新程式碼不要匯入它；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 註冊執行階段物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助工具，會與原始「actions」頻道匯出一起棄用。請改為透過語意化的 `presentation` 介面公開能力：頻道外掛宣告它們要呈現的內容（卡片、按鈕、選取器），而不是它們接受哪些原始動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋供應者 tool() 輔助工具 -> 外掛上的 createTool()">
    **舊**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工廠。

    **新**：直接在供應者外掛上實作 `createTool(...)`。OpenClaw 不再需要 SDK 輔助工具來註冊工具包裝器。

  </Accordion>

  <Accordion title="純文字頻道封套 -> BodyForAgent">
    **舊**：`api.runtime.channel.reply.formatInboundEnvelope(...)`（以及傳入訊息物件上的
    `channelEnvelope` 欄位），用來從傳入頻道訊息建立扁平的純文字提示封套。

    **新**：`BodyForAgent` 加上結構化使用者情境區塊。頻道外掛會將路由中繼資料（討論串、主題、回覆對象、回應）附加為具型別欄位，而不是將它們串接進提示字串。`formatAgentEnvelope(...)` 輔助工具仍支援合成的面向助理封套，但傳入純文字封套正在淘汰中。

    受影響區域：`inbound_claim`、`message_received`，以及任何曾對舊封套文字進行後處理的自訂頻道外掛。

  </Accordion>

  <Accordion title="deactivate hook -> gateway_stop">
    **舊**：`api.on("deactivate", handler)`。

    **新**：`api.on("gateway_stop", handler)`。相同的關閉清理合約；只有 hook 名稱變更。

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

    `deactivate` 仍會作為已棄用的相容性別名接線，直到 2026-08-16 後移除。

  </Accordion>

  <Accordion title="subagent_spawning hook -> 核心討論串繫結">
    **舊**：`api.on("subagent_spawning", handler)`，回傳
    `threadBindingReady` 或 `deliveryOrigin`。

    **新**：讓核心透過頻道工作階段繫結轉接器準備 `thread: true` 子代理繫結。僅使用 `api.on("subagent_spawned", handler)`
    進行啟動後觀察。

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 只會在外部外掛遷移期間保留為已棄用的相容性介面，並於 2026-08-30 後移除。

  </Accordion>

  <Accordion title="供應者探索型別 -> 供應者型錄型別">
    四個探索型別別名現在是型錄時代型別的薄包裝：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    以及舊版的 `ProviderCapabilities` 靜態集合：供應者外掛應使用明確的供應者 hook，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是靜態物件。

  </Accordion>

  <Accordion title="思考策略 hook -> resolveThinkingProfile">
    **舊**（`ProviderThinkingPolicy` 上的三個獨立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：單一 `resolveThinkingProfile(ctx)`，回傳包含標準 `id`、選用 `label`，以及已排序層級清單的
    `ProviderThinkingProfile`。OpenClaw 會自動依 profile 排名降級過期的已儲存值。

    情境包含 `provider`、`modelId`、選用的合併 `reasoning`，以及選用的合併模型 `compat` 事實。供應者外掛可以使用這些型錄事實，只有在已設定的請求合約支援時，才公開模型專屬 profile。

    請實作一個 hook，而不是三個。舊版 hook 在棄用期間會繼續運作，但不會與 profile 結果組合。

  </Accordion>

  <Accordion title="外部驗證供應者 -> contracts.externalAuthProviders">
    **舊**：實作外部驗證 hook，但未在外掛 manifest 中宣告供應者。

    **新**：在外掛 manifest 中宣告 `contracts.externalAuthProviders`，**並且**實作 `resolveExternalAuthProfiles(...)`。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="供應者環境變數查找 -> setup.providers[].envVars">
    **舊** manifest 欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：將相同的環境變數查找鏡像到 manifest 上的 `setup.providers[].envVars`。這會將設定/狀態環境中繼資料集中到一個位置，並避免只為了回答環境變數查找而啟動外掛執行階段。

    `providerAuthEnvVars` 會透過相容性轉接器繼續支援，直到棄用期間結束。

  </Accordion>

  <Accordion title="記憶外掛註冊 -> registerMemoryCapability">
    **舊**：三個獨立呼叫：`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**：在記憶狀態 API 上的一個呼叫：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同插槽，單一註冊呼叫。附加式提示和語料庫輔助工具（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）不受影響。

  </Accordion>

  <Accordion title="記憶嵌入供應者 API">
    **舊**：`api.registerMemoryEmbeddingProvider(...)` 加上
    `contracts.memoryEmbeddingProviders`。

    **新**：`api.registerEmbeddingProvider(...)` 加上
    `contracts.embeddingProviders`。

    泛用嵌入供應者合約可在記憶之外重複使用，也是新供應者支援的路徑。記憶專屬註冊 API 會在現有供應者遷移期間，繼續作為已棄用相容性接線。外掛檢查會將非內建使用回報為相容性債務。

  </Accordion>

  <Accordion title="子代理工作階段訊息型別重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。相同簽章；舊方法會轉呼叫新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **舊**：`runtime.tasks.flow`（單數）會回傳即時任務流程存取器。

    **新**：`runtime.tasks.managedFlows` 會保留受管理的 TaskFlow 變更執行階段，供從流程建立、更新、取消或執行子任務的外掛使用。當外掛只需要基於 DTO 的讀取時，請使用 `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    於 2026-07-26 後移除。

  </Accordion>

  <Accordion title="嵌入式擴充工廠 -> 代理工具結果中介軟體">
    已在上方的[如何遷移](#how-to-migrate)中涵蓋。為完整性列於此處：已移除的僅限嵌入式執行器
    `api.registerEmbeddedExtensionFactory(...)` 路徑，會由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在 `contracts.agentToolResultMiddleware` 中明確列出執行階段清單。
  </Accordion>

  <Accordion title="OpenClawSchemaType 別名 -> OpenClawConfig">
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
外掛層級的淘汰項目（位於 `extensions/` 下捆綁的頻道/提供者外掛內）會在各自的 `api.ts` 和 `runtime-api.ts` barrel 中追蹤。它們不影響第三方外掛合約，也不會列在此處。如果你直接使用捆綁外掛的本機 barrel，升級前請先閱讀該 barrel 中的淘汰註解。
</Note>

## Talk 與即時語音遷移

即時語音、電話、會議和瀏覽器 Talk 程式碼共用一個由 `openclaw/plugin-sdk/realtime-voice` 匯出的 Talk 工作階段控制器。該控制器負責共通的 Talk 事件封套、作用中的回合狀態、擷取狀態、輸出音訊狀態、近期事件歷史，以及過期回合拒絕。提供者外掛負責廠商特定的即時工作階段；介面外掛負責擷取、播放、電話和會議的特殊情境。

所有捆綁介面都在共用控制器上執行：瀏覽器轉送、受管理聊天室交接、語音通話即時、語音通話串流 STT、Google Meet 即時，以及原生按住說話。閘道會在 `hello-ok.features.events` 中公告一個即時 Talk 事件頻道：`talk.event`。

新程式碼不應直接呼叫 `createTalkEventSequencer(...)`，除非是在實作低階配接器或測試 fixture。請使用共用控制器，讓回合範圍事件無法在沒有回合 ID 的情況下送出，過期的 `turnEnd` / `turnCancel` 呼叫無法清除較新的作用中回合，且輸出音訊生命週期事件能在電話、會議、瀏覽器轉送、受管理聊天室交接，以及原生 Talk 用戶端之間保持一致。

公開 API 形狀：

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

瀏覽器擁有的 WebRTC/提供者 WebSocket 工作階段使用 `talk.client.create`，因為瀏覽器擁有提供者協商與媒體傳輸，而閘道擁有憑證、指示和工具政策。`talk.session.*` 是閘道管理的共通介面，適用於 gateway-relay 即時、gateway-relay 轉錄，以及 managed-room 原生 STT/TTS 工作階段。

將即時選擇器放在 `talk.provider` / `talk.providers` 旁的舊版設定，應透過 `openclaw doctor --fix` 修復；執行階段 Talk 不會把語音/TTS 提供者設定重新解讀為即時提供者設定。

支援的 `talk.session.create` 組合刻意保持精簡：

| 模式            | 傳輸       | Brain           | 擁有者              | 註記                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | 閘道            | 透過閘道橋接全雙工提供者音訊；工具呼叫會經由 agent-consult 工具路由。           |
| `transcription` | `gateway-relay` | `none`          | 閘道            | 僅串流 STT；呼叫端傳送輸入音訊並接收逐字稿事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/用戶端聊天室 | 按住說話與對講機風格聊天室，其中用戶端擁有擷取/播放，而閘道擁有回合狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/用戶端聊天室 | 僅供管理員使用的聊天室模式，適用於受信任的第一方介面，可直接執行閘道工具動作。                  |

供從較舊的 `talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*` 家族（皆已移除）遷移的讀者使用的方法對照：

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

統一的控制詞彙也刻意保持狹窄：

| 方法                          | 適用於                                              | 合約                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 將 base64 PCM 音訊區塊附加到同一個閘道連線擁有的提供者工作階段。                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 開始受管理聊天室使用者回合。                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在過期回合驗證後結束作用中回合。                                                                                                                                         |
| `talk.session.cancelTurn`       | 所有閘道擁有的工作階段                              | 取消某個回合的作用中擷取/提供者/代理/TTS 工作。                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，但不一定結束使用者回合。                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成由轉送發出的提供者工具呼叫；傳遞 `options.willContinue` 以產生暫時輸出，或傳遞 `options.suppressResponse` 以在不產生另一個助理回應的情況下滿足該呼叫。 |
| `talk.session.steer`            | 代理支援的 Talk 工作階段                              | 將語音 `status`、`steer`、`cancel` 或 `followup` 控制傳送到從 Talk 工作階段解析出的作用中嵌入式執行。                                                                |
| `talk.session.close`            | 所有統一工作階段                                    | 停止轉送工作階段或撤銷受管理聊天室狀態，然後忘記統一工作階段 ID。                                                                                                    |

請勿為了讓這項功能運作而在核心中引入提供者或平台特殊案例。核心負責 Talk 工作階段語義。提供者外掛負責廠商工作階段設定。語音通話與 Google Meet 負責電話/會議配接器。瀏覽器與原生應用程式負責裝置擷取/播放使用者體驗。

## 移除時程

| 時間                                        | 會發生什麼                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                     | 已淘汰的介面會發出執行階段警告。                                                                                             |
| **每筆相容記錄的 `removeAfter` 日期** | 該特定介面符合移除資格；日期過後，`pnpm plugins:boundary-report --fail-on-eligible-compat` 會讓 CI 失敗。 |
| **下一個主要版本**                      | 任何仍未遷移的介面都會被移除；仍使用它們的外掛將會失敗。                                                       |

所有核心外掛都已完成遷移。外部外掛應在下一個主要版本前遷移。執行 `pnpm plugins:boundary-report`，查看你的外掛使用的介面中哪些相容記錄最早到期。

## 暫時抑制警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時的逃生口，不是永久解法。

## 相關

- [入門](/zh-TW/plugins/building-plugins) - 建置你的第一個外掛
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整子路徑匯入參考
- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建置頻道外掛
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) - 建置提供者外掛
- [外掛內部架構](/zh-TW/plugins/architecture) - 架構深入解析
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單結構描述參考

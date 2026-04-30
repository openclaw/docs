---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用過 api.registerEmbeddedExtensionFactory
    - 您正在將 Plugin 更新至現代 Plugin 架構
    - 您維護一個外部 OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代 Plugin SDK
title: Plugin SDK 遷移
x-i18n:
    generated_at: "2026-04-30T03:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已從廣泛的向後相容層，移轉到具備聚焦且有文件記載之匯入的現代 Plugin
架構。如果你的 Plugin 是在新架構之前建置的，本指南可協助你遷移。

## 正在變更的內容

舊的 Plugin 系統提供兩個完全開放的介面，讓 Plugin 能從單一進入點匯入
所需的一切：

- **`openclaw/plugin-sdk/compat`** — 單一匯入，會重新匯出數十個
  輔助工具。它是在新的 Plugin 架構建置期間，為了讓較舊的 hook 型 Plugin 維持運作而引入。
- **`openclaw/plugin-sdk/infra-runtime`** — 廣泛的 runtime 輔助工具 barrel，
  混合了系統事件、heartbeat 狀態、傳遞佇列、fetch/proxy 輔助工具、
  檔案輔助工具、核准型別，以及不相關的工具。
- **`openclaw/plugin-sdk/config-runtime`** — 廣泛的 config 相容性 barrel，
  在遷移期間仍保留已棄用的直接載入/寫入輔助工具。
- **`openclaw/extension-api`** — 一個 bridge，讓 Plugin 可直接存取
  host 端輔助工具，例如嵌入式 agent runner。
- **`api.registerEmbeddedExtensionFactory(...)`** — 已移除的 Pi 專用 bundled
  extension hook，可觀察嵌入式 runner 事件，例如
  `tool_result`。

這些廣泛匯入介面現在已**棄用**。它們在 runtime 仍可運作，
但新的 Plugin 不得使用它們，現有 Plugin 也應在下一個 major release 移除它們之前
完成遷移。Pi 專用的嵌入式 extension factory 註冊 API 已移除；請改用 tool-result middleware。

OpenClaw 不會在引入替代方案的同一次變更中，移除或重新詮釋已有文件記載的 Plugin 行為。
破壞性 contract 變更必須先經過相容性 adapter、診斷、文件，以及棄用期。
這適用於 SDK 匯入、manifest 欄位、setup API、hook，以及 runtime
註冊行為。

<Warning>
  向後相容層將在未來的 major release 中移除。
  屆時仍從這些介面匯入的 Plugin 將會中斷。
  Pi 專用的嵌入式 extension factory 註冊已經不再載入。
</Warning>

## 變更原因

舊做法造成了一些問題：

- **啟動緩慢** — 匯入一個輔助工具會載入數十個不相關的模組
- **循環相依** — 廣泛的重新匯出讓 import cycle 更容易出現
- **API 介面不清楚** — 無法判斷哪些匯出是穩定的、哪些是內部使用

現代 Plugin SDK 修正了這點：每個匯入路徑（`openclaw/plugin-sdk/\<subpath\>`）
都是小型、獨立的模組，具備明確用途與已有文件記載的 contract。

bundled channel 的舊版 provider 便利 seam 也已移除。
channel branded 的輔助 seam 是私有 mono-repo 捷徑，不是穩定的
Plugin contract。請改用窄範圍的通用 SDK subpath。在 bundled
Plugin workspace 內，將 provider 擁有的輔助工具保留在該 Plugin 自己的 `api.ts` 或
`runtime-api.ts` 中。

目前 bundled provider 範例：

- Anthropic 將 Claude 專用的 stream 輔助工具保留在自己的 `api.ts` /
  `contract-api.ts` seam 中
- OpenAI 將 provider builder、default-model 輔助工具，以及 realtime provider
  builder 保留在自己的 `api.ts` 中
- OpenRouter 將 provider builder 與 onboarding/config 輔助工具保留在自己的
  `api.ts` 中

## 相容性政策

對於外部 Plugin，相容性工作會依照以下順序進行：

1. 新增新的 contract
2. 透過相容性 adapter 保留舊行為的接線
3. 發出診斷或警告，指出舊路徑與替代路徑
4. 以測試涵蓋兩條路徑
5. 記錄棄用與遷移路徑
6. 只在已宣布的遷移期後移除，通常是在 major release 中

維護者可以使用
`pnpm plugins:boundary-report` 稽核目前的遷移佇列。使用 `pnpm plugins:boundary-report:summary` 取得
精簡計數，使用 `--owner <id>` 查看單一 Plugin 或相容性 owner，並在 CI gate 應因到期的
相容性記錄、cross-owner reserved SDK 匯入，或未使用的 reserved SDK
subpath 而失敗時，使用
`pnpm plugins:boundary-report:ci`。該報告會依移除日期將已棄用的
相容性記錄分組、計算本機 code/docs 參照、
顯示 cross-owner reserved SDK 匯入，並摘要私有
memory-host SDK bridge，讓相容性清理保持明確，而不是仰賴 ad hoc 搜尋。
Reserved SDK subpath 必須有追蹤到的 owner 使用情況；
未使用的 reserved 輔助匯出應從 public SDK 中移除。

如果 manifest 欄位仍被接受，Plugin 作者可以繼續使用，直到
文件與診斷另有說明。新程式碼應優先使用已有文件記載的
替代方案，但現有 Plugin 不應在一般 minor
release 中中斷。

## 如何遷移

<Steps>
  <Step title="遷移 runtime config 載入/寫入輔助工具">
    Bundled Plugin 應停止直接呼叫
    `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用已傳入
    目前作用中呼叫路徑的 config。需要目前 process snapshot 的長期存在 handler
    可以使用 `api.runtime.config.current()`。長期存在的
    agent tool 應在 `execute` 內使用 tool context 的 `ctx.getRuntimeConfig()`，
    這樣在 config 寫入前建立的 tool 仍能看到重新整理後的
    runtime config。

    Config 寫入必須經由 transaction 輔助工具，並選擇
    after-write policy：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當呼叫者知道變更需要乾淨的 gateway restart 時，使用
    `afterWrite: { mode: "restart", reason: "..." }`；只有在呼叫者擁有後續處理
    且刻意要抑制 reload planner 時，才使用
    `afterWrite: { mode: "none", reason: "..." }`。
    Mutation 結果包含 typed `followUp` 摘要，供測試與 logging 使用；
    gateway 仍負責套用或排程 restart。
    `loadConfig` 與 `writeConfigFile` 在遷移期間仍作為外部 Plugin 的已棄用相容性
    輔助工具保留，並會以
    `runtime-config-load-write` 相容性代碼警告一次。Bundled Plugin 與 repo
    runtime code 受到 scanner guardrail 保護，位於
    `pnpm check:deprecated-internal-config-api` 和
    `pnpm check:no-runtime-action-load-config`：新的 production Plugin 使用
    會直接失敗，直接 config 寫入會失敗，gateway server method 必須使用
    request runtime snapshot，runtime channel send/action/client 輔助工具
    必須從其邊界接收 config，而長期存在的 runtime module
    允許的 ambient `loadConfig()` 呼叫數為零。

    新的 Plugin 程式碼也應避免匯入廣泛的
    `openclaw/plugin-sdk/config-runtime` 相容性 barrel。請使用符合工作的窄範圍
    SDK subpath：

    | 需求 | 匯入 |
    | --- | --- |
    | Config 型別，例如 `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | 已載入的 config assertion 與 plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前 runtime snapshot 讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config 寫入 | `openclaw/plugin-sdk/config-mutation` |
    | Session store 輔助工具 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime 輔助工具 | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session override | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugin 及其測試都受到 scanner 防護，避免使用廣泛
    barrel，讓匯入與 mock 保持侷限於所需行為。廣泛
    barrel 仍為外部相容性存在，但新程式碼不應
    依賴它。

  </Step>

  <Step title="將 Pi tool-result extension 遷移到 middleware">
    Bundled Plugin 必須將 Pi 專用的
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler 替換為
    runtime 中立的 middleware。

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

    外部 Plugin 不能註冊 tool-result middleware，因為它可以在 model 看到之前
    重寫高信任度的 tool output。

  </Step>

  <Step title="將 approval-native handler 遷移到 capability fact">
    支援 approval 的 channel Plugin 現在透過
    `approvalCapability.nativeRuntime` 加上共用的 runtime-context registry
    暴露原生 approval 行為。

    主要變更：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`
    - 將 approval 專用的 auth/delivery 從舊版 `plugin.auth` /
      `plugin.approvals` 接線移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已從 public channel-plugin
      contract 中移除；請將 delivery/native/render 欄位移到 `approvalCapability`
    - `plugin.auth` 僅保留給 channel login/logout flow；core
      不再讀取其中的 approval auth hook
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊 channel 擁有的 runtime object，
      例如 client、token 或 Bolt app
    - 不要從 native approval handler 傳送 Plugin 擁有的 reroute notice；
      core 現在會根據實際 delivery result 擁有 routed-elsewhere notice
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供
      真正的 `createPluginRuntime().channel` 介面。Partial stub 會被拒絕。

    請參閱 `/plugins/sdk-channel-plugins` 了解目前的 approval capability
    配置。

  </Step>

  <Step title="稽核 Windows wrapper fallback 行為">
    如果你的 Plugin 使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows
    `.cmd`/`.bat` wrapper 現在會 fail closed，除非你明確傳入
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

    如果你的呼叫者並未刻意依賴 shell fallback，請不要設定
    `allowShellFallback`，並改為處理拋出的錯誤。

  </Step>

  <Step title="尋找已棄用的匯入">
    搜尋你的 Plugin 是否有來自任一已棄用介面的匯入：

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

    對於 host 端輔助工具，請使用 injected Plugin runtime，而不是直接匯入：

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
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

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` 仍為了外部相容性而存在，但新程式碼應匯入它實際需要的聚焦輔助工具介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助工具 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 事件與可見性輔助工具 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待處理傳遞佇列排空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 頻道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本機檔案/媒體路徑輔助工具 | `openclaw/plugin-sdk/file-access-runtime` |
    | 可感知分派器的擷取 | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與受防護的擷取輔助工具 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器政策型別 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准請求/解析型別 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆承載與命令輔助工具 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助工具 | `openclaw/plugin-sdk/error-runtime` |
    | 傳輸就緒等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助工具 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步工作並行 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 數值強制轉換 | `openclaw/plugin-sdk/number-runtime` |
    | 程序本機非同步鎖定 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖定 | `openclaw/plugin-sdk/file-lock` |

    綁定的 plugins 會由掃描器防護以避免使用 `infra-runtime`，因此儲存庫程式碼無法退回到寬泛的 barrel。

  </Step>

  <Step title="Migrate channel route helpers">
    新的頻道路由程式碼應使用 `openclaw/plugin-sdk/channel-route`。較舊的 route-key 與 comparable-target 名稱在遷移期間仍保留為相容性別名，但新的 plugins 應使用能直接描述行為的路由名稱：

    | 舊輔助工具 | 現代輔助工具 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助工具會在原生核准、回覆抑制、傳入去重、Cron 傳遞與工作階段路由之間一致地正規化 `{ channel, to, accountId, threadId }`。如果你的 plugin 擁有自訂目標語法，請使用 `resolveChannelRouteTargetWithParser(...)` 將該解析器調整為相同的路由目標合約。

  </Step>

  <Step title="Build and test">
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
  | `plugin-sdk/plugin-entry` | 標準 Plugin 入口輔助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用於通道入口定義/建構器的舊版總括重新匯出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定結構描述匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一提供者入口輔助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的通道入口定義與建構器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助工具 | 允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定期間執行階段輔助工具 | 匯入安全的設定修補轉接器、查詢註記輔助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委派設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 設定轉接器輔助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 設定工具輔助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳號輔助工具 | 帳號清單/設定/動作門控輔助工具 |
  | `plugin-sdk/account-id` | 帳號 ID 輔助工具 | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳號查詢輔助工具 | 帳號查詢 + 預設後援輔助工具 |
  | `plugin-sdk/account-helpers` | 精簡帳號輔助工具 | 帳號清單/帳號動作輔助工具 |
  | `plugin-sdk/channel-setup` | 設定精靈轉接器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私訊配對基本元件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入狀態與來源傳遞接線 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定轉接器工廠與私訊存取輔助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定結構描述建構器 | 僅限共用通道設定結構描述基本元件與通用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定結構描述 | 僅限 OpenClaw 維護的內建 Plugin；新的 Plugin 必須定義 Plugin 本機結構描述 |
  | `plugin-sdk/channel-config-schema-legacy` | 已棄用的內建設定結構描述 | 僅相容性別名；針對維護中的內建 Plugin，請使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令設定輔助工具 | 命令名稱正規化、描述修剪、重複/衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組/私訊政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 帳號狀態與草稿串流生命週期輔助工具 | `createAccountStatusSink`、草稿預覽完成輔助工具 |
  | `plugin-sdk/inbound-envelope` | 傳入信封輔助工具 | 共用路由 + 信封建構器輔助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 傳入回覆輔助工具 | 共用記錄並分派輔助工具 |
  | `plugin-sdk/messaging-targets` | 訊息目標剖析 | 目標剖析/比對輔助工具 |
  | `plugin-sdk/outbound-media` | 傳出媒體輔助工具 | 共用傳出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 傳送相依性輔助工具 | 無需匯入完整傳出執行階段的輕量 `resolveOutboundSendDep` 查詢 |
  | `plugin-sdk/outbound-runtime` | 傳出執行階段輔助工具 | 傳出傳遞、身分/傳送委派、工作階段、格式化與承載規劃輔助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結輔助工具 | 執行緒繫結生命週期與轉接器輔助工具 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體承載輔助工具 | 用於舊版欄位配置的代理媒體承載建構器 |
  | `plugin-sdk/channel-runtime` | 已棄用的相容性墊片 | 僅舊版通道執行階段公用程式 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久化 Plugin 儲存空間 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣泛執行階段輔助工具 | 執行階段/記錄/備份/Plugin 安裝輔助工具 |
  | `plugin-sdk/runtime-env` | 精簡執行階段環境輔助工具 | 記錄器/執行階段環境、逾時、重試與退避輔助工具 |
  | `plugin-sdk/plugin-runtime` | 共用 Plugin 執行階段輔助工具 | Plugin 命令/鉤子/http/互動式輔助工具 |
  | `plugin-sdk/hook-runtime` | 鉤子管線輔助工具 | 共用 Webhook/內部鉤子管線輔助工具 |
  | `plugin-sdk/lazy-runtime` | 延遲執行階段輔助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助工具 | 共用執行輔助工具 |
  | `plugin-sdk/cli-runtime` | CLI 執行階段輔助工具 | 命令格式化、等待、版本輔助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 輔助工具 | Gateway 用戶端、事件迴圈就緒啟動輔助工具，以及通道狀態修補輔助工具 |
  | `plugin-sdk/config-runtime` | 已棄用的設定相容性墊片 | 建議使用 `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令輔助工具 | 內建 Telegram 合約介面不可用時，具後援穩定性的 Telegram 命令驗證輔助工具 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助工具 | Exec/Plugin 核准承載、核准能力/設定檔輔助工具、原生核准路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准身分驗證輔助工具 | 核准者解析、同聊天動作身分驗證 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助工具 | 原生執行核准設定檔/篩選器輔助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 核准傳遞輔助工具 | 原生核准能力/傳遞轉接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准 Gateway 輔助工具 | 共用核准 Gateway 解析輔助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准轉接器輔助工具 | 用於熱門通道入口點的輕量原生核准轉接器載入輔助工具 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理常式輔助工具 | 較廣泛的核准處理常式執行階段輔助工具；當較精簡的轉接器/Gateway 介面足夠時，請優先使用 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助工具 | 原生核准目標/帳號繫結輔助工具 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助工具 | Exec/Plugin 核准回覆承載輔助工具 |
  | `plugin-sdk/channel-runtime-context` | 通道執行階段內容輔助工具 | 通用通道執行階段內容註冊/取得/監看輔助工具 |
  | `plugin-sdk/security-runtime` | 安全性輔助工具 | 共用信任、私訊門控、外部內容與祕密收集輔助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助工具 | 主機允許清單與私有網路政策輔助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助工具 | 釘選分派器、受防護的 fetch、SSRF 政策輔助工具 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 輔助工具 | Heartbeat 事件與可見性輔助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 傳遞佇列輔助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 通道活動輔助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重輔助工具 | 記憶體內去重快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助工具 | 安全本機檔案/媒體路徑輔助工具 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷門控輔助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤格式化輔助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、錯誤圖輔助工具 |
  | `plugin-sdk/fetch-runtime` | 包裝 fetch/代理輔助工具 | `resolveFetch`、代理輔助工具、EnvHttpProxyAgent 選項輔助工具 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助工具 | `RetryConfig`, `retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允許清單輸入對應 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令門控與命令介面輔助工具 | `resolveControlCommandGate`、傳送者授權輔助工具、命令登錄輔助工具，包含動態引數選單格式化 |
  | `plugin-sdk/command-status` | 命令狀態/說明轉譯器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 祕密輸入剖析 | 祕密輸入輔助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 請求輔助工具 | Webhook 目標公用程式 |
  | `plugin-sdk/webhook-request-guards` | Webhook 主體防護輔助工具 | 請求主體讀取/限制輔助工具 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 傳入分派、Heartbeat、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 精簡回覆分派輔助工具 | 完成、提供者分派與對話標籤輔助工具 |
  | `plugin-sdk/reply-history` | 回覆歷程輔助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助工具 | 文字/markdown 分塊輔助工具 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具 | 儲存路徑 + 更新時間輔助工具 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助工具 | 狀態與 OAuth 目錄輔助工具 |
  | `plugin-sdk/routing` | 路由/工作階段鍵輔助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、工作階段鍵正規化輔助工具 |
  | `plugin-sdk/status-helpers` | 通道狀態輔助工具 | 通道/帳號狀態摘要建構器、執行階段狀態預設值、問題中繼資料輔助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助工具 | 共用目標解析器輔助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助工具 | Slug/字串正規化輔助工具 |
  | `plugin-sdk/request-url` | 請求 URL 輔助工具 | 從類請求輸入擷取字串 URL |
  | `plugin-sdk/run-command` | 定時命令輔助工具 | 具正規化 stdout/stderr 的定時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具/CLI 參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具 payload 擷取 | 從工具結果物件擷取正規化 payload |
  | `plugin-sdk/tool-send` | 工具傳送擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆類型 | 回覆 payload 類型 |
  | `plugin-sdk/provider-setup` | 精選本機/自架提供者設定輔助工具 | 自架提供者探索/設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 聚焦的 OpenAI 相容自架提供者設定輔助工具 | 相同的自架提供者探索/設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供者執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供者 API 金鑰設定輔助工具 | API 金鑰入門/設定檔寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 提供者驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-auth-login` | 提供者互動式登入輔助工具 | 共用互動式登入輔助工具 |
  | `plugin-sdk/provider-selection-runtime` | 提供者選擇輔助工具 | 已設定或自動提供者選擇與原始提供者設定合併 |
  | `plugin-sdk/provider-env-vars` | 提供者環境變數輔助工具 | 提供者驗證環境變數查找輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用提供者模型/重播輔助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共用重播政策建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用提供者目錄輔助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供者入門修補 | 入門設定輔助工具 |
  | `plugin-sdk/provider-http` | 提供者 HTTP 輔助工具 | 通用提供者 HTTP/端點能力輔助工具，包括音訊轉錄 multipart 表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供者網頁擷取輔助工具 | 網頁擷取提供者註冊/快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供者網頁搜尋設定輔助工具 | 適用於不需要 Plugin 啟用接線的提供者的窄範圍網頁搜尋設定/憑證輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供者網頁搜尋合約輔助工具 | 窄範圍網頁搜尋設定/憑證合約輔助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及具範圍的憑證 setter/getter |
  | `plugin-sdk/provider-web-search` | 提供者網頁搜尋輔助工具 | 網頁搜尋提供者註冊/快取/執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 提供者工具/schema 相容性輔助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 清理與診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | 提供者用量輔助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`，以及其他提供者用量輔助工具 |
  | `plugin-sdk/provider-stream` | 提供者串流包裝器輔助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、串流包裝器類型，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供者傳輸輔助工具 | 原生提供者傳輸輔助工具，例如受保護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取/轉換/儲存輔助工具、以 ffprobe 支援的影片尺寸探測，以及媒體 payload 建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 影像/影片/音樂生成的共用容錯移轉輔助工具、候選選擇，以及缺少模型訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解提供者類型，以及面向提供者的影像/音訊輔助匯出 |
  | `plugin-sdk/text-runtime` | 共用文字輔助工具 | 助理可見文字剝除、Markdown 算繪/分塊/表格輔助工具、遮蔽輔助工具、指令標籤輔助工具、安全文字工具，以及相關文字/記錄輔助工具 |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 輸出文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音提供者類型，以及面向提供者的指令、登錄、驗證輔助工具與 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音提供者類型、登錄、指令、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 提供者類型、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 提供者類型、登錄/解析輔助工具，以及橋接工作階段輔助工具 |
  | `plugin-sdk/image-generation` | 影像生成輔助工具 | 影像生成提供者類型，以及影像資產/data URL 輔助工具與 OpenAI 相容影像提供者建構器 |
  | `plugin-sdk/image-generation-core` | 共用影像生成核心 | 影像生成類型、容錯移轉、驗證，以及登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成提供者/請求/結果類型 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成類型、容錯移轉輔助工具、提供者查找，以及模型參照剖析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成提供者/請求/結果類型 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成類型、容錯移轉輔助工具、提供者查找，以及模型參照剖析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆 payload 正規化/縮減 |
  | `plugin-sdk/channel-config-primitives` | 頻道設定基元 | 窄範圍頻道設定 schema 基元 |
  | `plugin-sdk/channel-config-writes` | 頻道設定寫入輔助工具 | 頻道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用頻道前置內容 | 共用頻道 Plugin 前置匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共用頻道狀態快照/摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯/讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm` | 直接 DM 輔助工具 | 共用直接 DM 驗證/防護輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充輔助工具 | 被動頻道/狀態與環境代理輔助基元 |
  | `plugin-sdk/webhook-targets` | Webhook 目標輔助工具 | Webhook 目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | Webhook 路徑輔助工具 | Webhook 路徑正規化輔助工具 |
  | `plugin-sdk/web-media` | 共用網頁媒體輔助工具 | 遠端/本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | Zod 重新匯出 | 為 plugin SDK 使用者重新匯出的 `zod` |
  | `plugin-sdk/memory-core` | 內建記憶核心輔助工具 | 記憶管理器/設定/檔案/CLI 輔助介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶引擎執行階段 facade | 記憶索引/搜尋執行階段 facade |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎 | 記憶主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入引擎 | 記憶嵌入合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具；具體遠端提供者位於其所屬的 plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎 | 記憶主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎 | 記憶主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 | 記憶主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 | 記憶主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶主機秘密輔助工具 | 記憶主機秘密輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 記憶主機事件日誌輔助工具 | 記憶主機事件日誌輔助工具 |
  | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 | 記憶主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機 CLI 執行階段 | 記憶主機 CLI 執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段 | 記憶主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 | 記憶主機檔案/執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段別名 | 記憶主機核心執行階段輔助工具的廠商中立別名 |
  | `plugin-sdk/memory-host-events` | 記憶主機事件日誌別名 | 記憶主機事件日誌輔助工具的廠商中立別名 |
  | `plugin-sdk/memory-host-files` | 記憶主機檔案/執行階段別名 | 記憶主機檔案/執行階段輔助工具的廠商中立別名 |
  | `plugin-sdk/memory-host-markdown` | 受管理 Markdown 輔助工具 | 供記憶相鄰 plugins 使用的共用受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | Active Memory 搜尋 facade | 延遲載入的 Active Memory 搜尋管理器執行階段 facade |
  | `plugin-sdk/memory-host-status` | 記憶主機狀態別名 | 記憶主機狀態輔助工具的廠商中立別名 |
  | `plugin-sdk/testing` | 測試工具 | 舊版廣泛相容性 barrel；建議使用聚焦的測試子路徑，例如 `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`，以及 `plugin-sdk/test-fixtures` |
</Accordion>

此表刻意只列出常見遷移子集，而不是完整的 SDK
介面。200 多個進入點的完整清單位於
`scripts/lib/plugin-sdk-entrypoints.json`。

保留的隨附 Plugin 輔助接縫已從公開 SDK
匯出對照表中退役，但明確記載的相容性 facade 除外，例如為已發布的
`@openclaw/discord@2026.3.13` 套件保留、已棄用的
`plugin-sdk/discord` shim。擁有者特定的輔助工具位於擁有該行為的
Plugin 套件內；共用的主機行為應透過通用 SDK
合約移動，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime`
和 `plugin-sdk/plugin-config-runtime`。

使用符合工作的最窄匯入。如果找不到匯出，請檢查
`src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用合約擁有它。

## 目前棄用項目

適用於 Plugin SDK、提供者合約、執行階段介面和 manifest
的較窄棄用項目。每一項目前仍可運作，但會在未來的主要版本中移除。每個項目下方的條目會將舊 API 對應到其標準替代項。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 → command-status">
    **舊 (`openclaw/plugin-sdk/command-auth`)**：`buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **新 (`openclaw/plugin-sdk/command-status`)**：相同簽名、相同
    匯出，只是從更窄的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性 stub。

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及門控輔助工具 → resolveInboundMentionDecision">
    **舊**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveInboundMentionRequirement({ facts, policy })` 和
    `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })`，回傳單一
    決策物件，而不是兩個拆分呼叫。

    下游通道 Plugin（Slack、Discord、Matrix、MS Teams）已經切換。

  </Accordion>

  <Accordion title="通道執行階段 shim 和通道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是較舊通道 Plugin 的相容性
    shim。不要在新程式碼中匯入它；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 來註冊執行階段
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*`
    輔助工具會與原始的「actions」通道匯出一起棄用。請改為透過語意化的
    `presentation` 介面公開能力：通道 Plugin
    宣告它們會呈現什麼（卡片、按鈕、選單），而不是它們接受哪些原始動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋提供者 tool() 輔助工具 → Plugin 上的 createTool()">
    **舊**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工廠。

    **新**：直接在提供者 Plugin 上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助工具來註冊工具包裝器。

  </Accordion>

  <Accordion title="純文字通道信封 → BodyForAgent">
    **舊**：`formatInboundEnvelope(...)`（以及
    `ChannelMessageForAgent.channelEnvelope`），用來從傳入通道訊息建構扁平的純文字提示信封。

    **新**：`BodyForAgent` 加上結構化使用者情境區塊。通道
    Plugin 會將路由中繼資料（執行緒、主題、回覆目標、反應）附加為型別化欄位，而不是將它們串接到提示字串中。
    `formatAgentEnvelope(...)` 輔助工具仍支援合成的面向助理信封，但傳入的純文字信封正在逐步淘汰。

    受影響區域：`inbound_claim`、`message_received`，以及任何後處理
    `channelEnvelope` 文字的自訂通道 Plugin。

  </Accordion>

  <Accordion title="提供者探索型別 → 提供者目錄型別">
    四個探索型別別名現在是目錄時代型別的薄包裝：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    以及舊版 `ProviderCapabilities` 靜態包：提供者 Plugin
    應使用明確的提供者 hook，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而不是靜態物件。

  </Accordion>

  <Accordion title="思考政策 hook → resolveThinkingProfile">
    **舊**（`ProviderThinkingPolicy` 上的三個獨立 hook）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新**：單一 `resolveThinkingProfile(ctx)`，回傳包含標準 `id`、
    選用 `label` 和已排序層級清單的
    `ProviderThinkingProfile`。OpenClaw 會依 profile
    排名自動降級過期的已儲存值。

    實作一個 hook，而不是三個。舊版 hook 在棄用期間仍可運作，但不會與 profile 結果組合。

  </Accordion>

  <Accordion title="外部 OAuth 提供者後援 → contracts.externalAuthProviders">
    **舊**：實作 `resolveExternalOAuthProfiles(...)`，但未在 Plugin
    manifest 中宣告提供者。

    **新**：在 Plugin manifest 中宣告 `contracts.externalAuthProviders`
    **並且**實作 `resolveExternalAuthProfiles(...)`。舊的「auth
    fallback」路徑會在執行階段發出警告，且將被移除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供者環境變數查找 → setup.providers[].envVars">
    **舊** manifest 欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **新**：將相同的環境變數查找鏡射到 manifest 上的
    `setup.providers[].envVars`。這會將設定/狀態環境中繼資料整合到同一處，並避免只是為了回答環境變數查找而啟動 Plugin 執行階段。

    `providerAuthEnvVars` 在棄用期間結束前，仍會透過相容性配接器受到支援。

  </Accordion>

  <Accordion title="記憶體 Plugin 註冊 → registerMemoryCapability">
    **舊**：三個獨立呼叫：
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **新**：記憶體狀態 API 上的一個呼叫：
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    相同插槽，單一註冊呼叫。加法式記憶體輔助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、
    `registerMemoryEmbeddingProvider`）不受影響。

  </Accordion>

  <Accordion title="子代理工作階段訊息型別重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊                            | 新                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。相同簽名；舊方法會轉呼叫新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **舊**：`runtime.tasks.flow`（單數）回傳即時 TaskFlow 存取器。

    **新**：`runtime.tasks.managedFlows` 保留受管理的 TaskFlow
    變更執行階段，供從流程建立、更新、取消或執行子任務的
    Plugin 使用。當 Plugin 只需要基於 DTO 的讀取時，請使用
    `runtime.tasks.flows`。

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式擴充工廠 → 代理工具結果中介軟體">
    已在上方「如何遷移 → 將 Pi 工具結果擴充遷移到中介軟體」中涵蓋。這裡為完整性再次列出：已移除、僅限 Pi 的
    `api.registerEmbeddedExtensionFactory(...)` 路徑，已由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中搭配明確的執行階段清單。
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
擴充層級的棄用項目（位於 `extensions/` 下方的隨附通道/提供者
Plugin 內）會在其各自的 `api.ts` 和 `runtime-api.ts`
barrel 中追蹤。它們不影響第三方 Plugin 合約，也不會列在這裡。如果你直接使用隨附 Plugin 的本機 barrel，升級前請先閱讀該 barrel 中的棄用註解。
</Note>

## 移除時程

| 時間                   | 會發生什麼                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **現在**               | 已棄用介面會發出執行階段警告                               |
| **下一個主要版本**     | 已棄用介面將被移除；仍使用它們的 Plugin 將會失敗 |

所有核心 Plugin 都已完成遷移。外部 Plugin 應在下一個主要版本前遷移。

## 暫時抑制警告

在進行遷移時設定這些環境變數：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時的逃生口，不是永久解決方案。

## 相關

- [快速開始](/zh-TW/plugins/building-plugins) — 建置你的第一個 Plugin
- [SDK 概觀](/zh-TW/plugins/sdk-overview) — 完整子路徑匯入參考
- [通道 Plugin](/zh-TW/plugins/sdk-channel-plugins) — 建置通道 Plugin
- [提供者 Plugin](/zh-TW/plugins/sdk-provider-plugins) — 建置提供者 Plugin
- [Plugin 內部架構](/zh-TW/plugins/architecture) — 架構深入探討
- [Plugin Manifest](/zh-TW/plugins/manifest) — manifest schema 參考

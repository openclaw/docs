---
read_when:
    - 選擇用於 Plugin 匯入的正確 plugin-sdk 子路徑
    - 稽核 bundled-plugin 子路徑與輔助介面
summary: Plugin SDK 子路徑目錄：各匯入項目的所在位置，依領域分組
title: Plugin SDK 子路徑
x-i18n:
    generated_at: "2026-05-03T21:42:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK 以 `openclaw/plugin-sdk/` 底下的一組精簡子路徑公開。
  本頁按用途分組列出常用子路徑。產生的 200+ 子路徑完整清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留的隨附 Plugin 輔助子路徑會出現在該處，但除非文件頁面明確推廣，否則屬於實作細節。維護者可以使用 `pnpm plugins:boundary-report:summary` 稽核使用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是作為休眠的相容性債務留在公開 SDK 中。

  Plugin 撰寫指南請參閱 [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)。

  ## Plugin 進入點

  | 子路徑                                    | 主要匯出                                                                                                                                                                     |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 舊版 Plugin 測試的廣泛相容性 barrel；新的 extension 測試請優先使用聚焦的測試子路徑                                                                                          |
  | `plugin-sdk/plugin-test-api`              | 用於直接 Plugin 註冊單元測試的最小 `OpenClawPluginApi` mock 建構器                                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | 原生 agent-runtime adapter 合約 fixture，涵蓋 auth profiles、delivery suppression、fallback classification、tool hooks、prompt overlays、schemas，以及 transcript repair |
  | `plugin-sdk/channel-test-helpers`         | 通道帳號生命週期、目錄、send-config、runtime mock、hook、隨附通道進入點、envelope timestamp、pairing reply，以及通用通道合約測試輔助工具   |
  | `plugin-sdk/channel-target-testing`       | 共用的通道 target-resolution 錯誤情境測試套件                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 註冊、package manifest、公開 artifact、runtime API、import side-effect，以及直接 import 合約輔助工具                                                  |
  | `plugin-sdk/plugin-test-runtime`          | 測試用 Plugin runtime、registry、provider-registration、setup-wizard，以及 runtime task-flow fixture                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Provider runtime、auth、discovery、onboard、catalog、media capability、replay policy、realtime STT live-audio、web-search/fetch，以及 wizard 合約輔助工具                 |
  | `plugin-sdk/provider-http-test-mocks`     | 選用的 Vitest HTTP/auth mock，供執行 `plugin-sdk/provider-http` 的 provider 測試使用                                                                                    |
  | `plugin-sdk/test-env`                     | 測試環境、fetch/network、可拋棄 HTTP server、incoming request、live-test、暫存檔案系統，以及 time-control fixture                                        |
  | `plugin-sdk/test-fixtures`                | 通用 CLI、sandbox、skill、agent-message、system-event、module reload、隨附 Plugin path、terminal、chunking、auth-token，以及 typed-case 測試 fixture                   |
  | `plugin-sdk/test-node-mocks`              | 聚焦的 Node builtin mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內                                                                                        |
  | `plugin-sdk/migration`                    | Migration provider item 輔助工具，例如 `createMigrationItem`、reason constants、item status markers、redaction helpers，以及 `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime migration 輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="通道子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 匯出 (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用 setup wizard 輔助工具、allowlist prompt、setup status 建構器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號 config/action-gate 輔助工具、default-account fallback 輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號 lookup + default-fallback 輔助工具 |
    | `plugin-sdk/account-helpers` | 精簡 account-list/account-action 輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用通道 config schema primitives，以及 Zod 和直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的隨附 Plugin 使用的隨附 OpenClaw 通道 config schema |
    | `plugin-sdk/channel-config-schema-legacy` | 隨附通道 config schema 的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram custom-command 正規化/驗證輔助工具，含 bundled-contract fallback |
    | `plugin-sdk/command-gating` | 精簡 command authorization gate 輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、draft stream 生命週期/最終化輔助工具 |
    | `plugin-sdk/inbound-envelope` | 共用 inbound route + envelope 建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共用 inbound record-and-dispatch 輔助工具 |
    | `plugin-sdk/messaging-targets` | Target 解析/比對輔助工具 |
    | `plugin-sdk/outbound-media` | 共用 outbound media 載入輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 給通道 adapter 使用的輕量 outbound send dependency lookup |
    | `plugin-sdk/outbound-runtime` | Outbound delivery、identity、send delegate、session、formatting，以及 payload planning 輔助工具 |
    | `plugin-sdk/poll-runtime` | 精簡 poll 正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding 生命週期與 adapter 輔助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版 agent media payload 建構器 |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding、pairing，以及 configured-binding 輔助工具 |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot 輔助工具 |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy 解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用通道 status snapshot/summary 輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 精簡通道 config-schema primitive |
    | `plugin-sdk/channel-config-writes` | 通道 config-write authorization 輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用通道 Plugin prelude 匯出 |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read 輔助工具 |
    | `plugin-sdk/group-access` | 共用 group-access decision 輔助工具 |
    | `plugin-sdk/direct-dm` | 共用 direct-DM auth/guard 輔助工具 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性 facade，供已發布的 `@openclaw/discord@2026.3.13` 和追蹤中的 owner 相容性使用；新 Plugin 應使用通用通道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram account-resolution 相容性 facade，供追蹤中的 owner 相容性使用；新 Plugin 應使用注入的 runtime 輔助工具或通用通道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已棄用的 Zalo Personal 相容性 facade，供仍匯入 sender command authorization 的已發布 Lark/Zalo package 使用；新 Plugin 應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、delivery，以及舊版 interactive reply 輔助工具。請參閱 [訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Inbound debounce、mention matching、mention-policy 輔助工具，以及 envelope 輔助工具的相容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 精簡 inbound debounce 輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 精簡 mention-policy、mention marker，以及 mention text 輔助工具，不包含更廣泛的 inbound runtime surface |
    | `plugin-sdk/channel-envelope` | 精簡 inbound envelope formatting 輔助工具 |
    | `plugin-sdk/channel-location` | 通道 location context 與 formatting 輔助工具 |
    | `plugin-sdk/channel-logging` | 用於 inbound drops 和 typing/ack failures 的通道 logging 輔助工具 |
    | `plugin-sdk/channel-send-result` | Reply result types |
    | `plugin-sdk/channel-actions` | 通道 message-action 輔助工具，以及為 Plugin 相容性保留的已棄用 native schema 輔助工具 |
    | `plugin-sdk/channel-route` | 共用 route 正規化、parser-driven target resolution、thread-id stringification、dedupe/compact route keys、parsed-target types，以及 route/target comparison 輔助工具 |
    | `plugin-sdk/channel-targets` | Target 解析輔助工具；route comparison 呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 通道 contract types |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | 精簡 secret-contract 輔助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`，以及 secret target types |
  </Accordion>

  <Accordion title="Provider subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 受支援的 LM Studio 提供者 facade，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 受支援的 LM Studio 執行階段 facade，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自架提供者設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 專注於 OpenAI 相容自架提供者的設定輔助工具 |
    | `plugin-sdk/cli-backend` | CLI 後端預設值 + watchdog 常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者 Plugin 的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰 onboarding／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-auth-login` | 提供者 Plugin 的共用互動式登入輔助工具 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查找輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共用 replay-policy 建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄擴充執行階段 hook，以及用於合約測試的 Plugin 提供者登錄 seam |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP／端點能力輔助工具、提供者 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 狹窄的 web-fetch 設定／選擇合約輔助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch 提供者註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要 Plugin 啟用接線的提供者之狹窄 web-search 設定／憑證輔助工具 |
    | `plugin-sdk/provider-web-search-contract` | 狹窄的 web-search 設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及範圍限定的憑證 setter／getter |
    | `plugin-sdk/provider-web-search` | Web-search 提供者註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 結構描述清理 + 診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 與類似項目 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 串流包裝器型別，以及共用的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者傳輸輔助工具，例如受保護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | Onboarding 設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 行程本機 singleton／map／cache 輔助工具 |
    | `plugin-sdk/group-activation` | 狹窄的群組啟用模式與命令剖析輔助工具 |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助工具，包括動態引數選單格式化、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／遞送配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准 Gateway 解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 適用於熱門頻道進入點的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助工具；足夠時優先使用較狹窄的配接器／Gateway seam |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標 + 帳號綁定輔助工具 |
    | `plugin-sdk/approval-reply-runtime` | Exec／Plugin 核准回覆 payload 輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准 payload 輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 狹窄的傳入回覆去重重設輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含寬泛測試 barrel 的狹窄頻道合約測試輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 適用於熱門頻道路徑的輕量命令文字 predicate |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令表面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 頻道／Plugin secret 表面的狹窄 secret-contract 收集輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於 secret-contract／設定剖析的狹窄 `coerceSecretRef` 與 SecretRef 型別輔助工具 |
    | `plugin-sdk/security-runtime` | 共用信任、DM gate、外部內容、敏感文字遮罩、常數時間 secret 比較，以及 secret 收集輔助工具 |
    | `plugin-sdk/ssrf-policy` | 主機 allowlist 與私有網路 SSRF 政策輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含寬泛基礎設施執行階段表面的狹窄 pinned-dispatcher 輔助工具 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF 保護的 fetch、SSRF 錯誤與 SSRF 政策輔助工具 |
    | `plugin-sdk/secret-input` | Secret 輸入剖析輔助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 請求／目標輔助工具，以及原始 websocket／body 強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="Runtime 與儲存子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的 Runtime、記錄、備份與 Plugin 安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的 Runtime 環境、記錄器、逾時、重試與退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定 facade，用於標準化設定檔/預設值、CDP URL 剖析與瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道 Runtime context 註冊與查找輔助工具 |
    | `plugin-sdk/matrix` | 已棄用的 Matrix 相容性 facade，供較舊的第三方頻道套件使用；新的 plugins 應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已棄用的 Mattermost 相容性 facade，供較舊的第三方頻道套件使用；新的 plugins 應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用的 Plugin 命令/hook/http/互動式輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用的 Webhook/內部 hook pipeline 輔助工具 |
    | `plugin-sdk/lazy-runtime` | 延遲 Runtime 匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、引數呼叫與延遲命令群組輔助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 用戶端、事件迴圈就緒用戶端啟動輔助工具、gateway CLI RPC、gateway 協定錯誤與頻道狀態修補輔助工具 |
    | `plugin-sdk/config-types` | 僅型別的 Plugin 設定介面，用於 `OpenClawConfig` 以及頻道/提供者設定型別等 Plugin 設定形狀 |
    | `plugin-sdk/plugin-config-runtime` | Runtime Plugin 設定查找輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 與測試快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述標準化與重複/衝突檢查，即使 bundled Telegram 合約介面無法使用也適用 |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛的 text-runtime barrel 進行檔案參照 autolink 偵測 |
    | `plugin-sdk/approval-runtime` | Exec/Plugin 核准輔助工具、核准能力建構器、驗證/設定檔輔助工具、原生路由/Runtime 輔助工具，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用的傳入/回覆 Runtime 輔助工具、分塊、分派、Heartbeat、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派/完成與對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間視窗回覆歷史輔助工具與標記，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡文字/Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存路徑、工作階段鍵、更新時間與儲存變更輔助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 儲存路徑/載入/儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態/OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/routing` | 路由/工作階段鍵/帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道/帳號狀態摘要輔助工具、Runtime 狀態預設值與問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串標準化輔助工具 |
    | `plugin-sdk/request-url` | 從 fetch/request 類輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具逾時的命令執行器，提供標準化 stdout/stderr 結果 |
    | `plugin-sdk/param-readers` | 常見工具/CLI 參數讀取器 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取標準化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準 send 目標欄位 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀寫輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP Runtime/工作階段與回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 輕量 ACP 後端註冊與回覆分派輔助工具，供啟動時載入的 plugins 使用 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不需生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡代理 Runtime 設定 schema primitive |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置 bootstrap 與配對 token 輔助工具 |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態與環境代理輔助 primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列出輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令註冊表/建構/序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 實驗性受信任 Plugin 介面，用於低階代理 harness：harness 型別、active-run steer/abort 輔助工具、OpenClaw 工具橋接輔助工具、Runtime plan 工具政策輔助工具、終端結果分類、工具進度格式化/詳細資訊輔助工具，以及嘗試結果工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 偵測輔助工具 |
    | `plugin-sdk/async-lock-runtime` | 小型 Runtime 狀態檔案的程序本機 async lock 輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動 telemetry 輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界 async 任務並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 對外 pending-delivery drain 輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 事件與可見性輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全 token/UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上方聚焦的 Runtime 子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與 trace-context 輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、代理、EnvHttpProxyAgent 選項與固定查找輔助工具 |
    | `plugin-sdk/runtime-fetch` | 感知 dispatcher 的 Runtime fetch，不需代理/guarded-fetch 匯入 |
    | `plugin-sdk/response-limit-runtime` | 有界 response-body 讀取器，不含廣泛的 media Runtime 介面 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具，不含廣泛設定寫入/維護匯入 |
    | `plugin-sdk/context-visibility-runtime` | Context 可見性解析與補充 context 篩選，不含廣泛設定/安全性匯入 |
    | `plugin-sdk/string-coerce-runtime` | 精簡 primitive 記錄/字串強制轉換與標準化輔助工具，不含 markdown/記錄匯入 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機標準化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 代理目錄/身分/workspace 輔助工具 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體酬載建構器 |
    | `plugin-sdk/media-store` | 精簡媒體儲存輔助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選選取，以及缺少模型訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，以及面向提供者的影像/音訊輔助匯出 |
    | `plugin-sdk/text-runtime` | 共用文字/Markdown/記錄輔助工具，例如剝除助理可見文字、Markdown 轉譯/分塊/表格輔助工具、遮蔽輔助工具、指令標籤輔助工具，以及安全文字公用工具 |
    | `plugin-sdk/text-chunking` | 對外文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音提供者型別，以及面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器和語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者型別、登錄、指令、正規化，以及語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別和登錄輔助工具 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，以及影像資產/資料 URL 輔助工具和 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證，以及登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助工具、提供者查找，以及模型參照剖析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助工具、提供者查找，以及模型參照剖析 |
    | `plugin-sdk/webhook-targets` | Webhook 目標登錄和路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路徑正規化輔助工具 |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 為 plugin SDK 使用者重新匯出的 `zod` |
    | `plugin-sdk/testing` | 適用於舊版 Plugin 測試的廣泛相容性 barrel。新的擴充功能測試應改為匯入聚焦的 SDK 子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小化的 `createTestPluginApi` 輔助工具，用於直接 Plugin 註冊單元測試，無需匯入 repo 測試輔助橋接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 原生 agent-runtime 轉接器契約 fixture，用於驗證、遞送、備援、工具掛鉤、提示覆疊、結構描述和逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 面向通道的測試輔助工具，用於通用動作/設定/狀態契約、目錄斷言、帳號啟動生命週期、send-config 執行緒處理、執行階段 mock、狀態問題、對外遞送，以及掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 通道測試的共用目標解析錯誤案例套件 |
    | `plugin-sdk/plugin-test-contracts` | Plugin 套件、註冊、公用成品、直接匯入、執行階段 API，以及匯入副作用契約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 提供者執行階段、驗證、探索、onboard、型錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網頁搜尋/擷取，以及串流契約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 選擇啟用的 Vitest HTTP/驗證 mock，供測試 `plugin-sdk/provider-http` 的提供者測試使用 |
    | `plugin-sdk/test-fixtures` | 通用 CLI 執行階段擷取、沙盒內容、skill 寫入器、agent-message、system-event、模組重新載入、Bundled Plugin 路徑、terminal-text、chunking、auth-token，以及 typed-case fixture |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 內建 mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 用於管理器/設定/檔案/CLI 輔助工具的 Bundled memory-core 輔助介面 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶體索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入契約、登錄存取、本機提供者，以及通用批次/遠端輔助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶體主機多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶體主機查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶體主機祕密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 記憶體主機事件日誌輔助工具 |
    | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機 CLI 執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | 記憶體主機檔案/執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 適用於記憶體相鄰 Plugin 的共用受管 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於 search-manager 存取的 Active Memory 執行階段 facade |
    | `plugin-sdk/memory-host-status` | 記憶體主機狀態輔助工具的供應商中立別名 |
  </Accordion>

  <Accordion title="保留的 Bundled 輔助工具子路徑">
    目前沒有保留的 Bundled 輔助工具 SDK 子路徑。擁有者專屬
    輔助工具位於所屬 Plugin 套件內，而可重用的主機契約
    使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相關

- [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)

---
read_when:
    - 為 Plugin 匯入選擇正確的 plugin-sdk 子路徑
    - 稽核隨附 Plugin 子路徑與輔助介面
summary: Plugin SDK 子路徑目錄：哪些匯入項目位於何處，依領域分組
title: Plugin SDK 子路徑
x-i18n:
    generated_at: "2026-04-30T03:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60fe10982b9aa01af76bfbd72475168c8138f68dd410b4488b6b6c4c00097e53
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK 會以 `openclaw/plugin-sdk/` 下的一組窄範圍子路徑公開。
  本頁依用途分組列出常用子路徑。產生的
  200+ 個子路徑完整清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留給 bundled-plugin 輔助工具的子路徑會出現在該處，但除非文件頁面明確提升其地位，否則它們屬於實作
  細節。維護者可以使用 `pnpm plugins:boundary-report:summary` 稽核使用中的
  保留輔助工具子路徑；未使用的保留輔助工具匯出會讓 CI 報告失敗，而不是以休眠的相容性負債形式留在公開 SDK
  中。

  如需 Plugin 編寫指南，請參閱 [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)。

  ## Plugin 入口

  | 子路徑                                   | 主要匯出                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 舊版 Plugin 測試的廣泛相容性 barrel；新的 extension 測試應優先使用聚焦的測試子路徑                                                                     |
  | `plugin-sdk/plugin-test-api`              | 用於直接 Plugin 註冊單元測試的最小 `OpenClawPluginApi` 模擬建構器                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | 原生 agent-runtime adapter contract fixtures，適用於 auth profiles、delivery suppression、fallback classification、tool hooks、prompt overlays、schemas，以及 transcript repair |
  | `plugin-sdk/channel-test-helpers`         | 頻道帳號生命週期、目錄、send-config、runtime mock、hook、bundled channel entry、envelope timestamp、pairing reply，以及通用頻道 contract 測試輔助工具   |
  | `plugin-sdk/channel-target-testing`       | 共用頻道 target-resolution 錯誤案例測試套件                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 註冊、套件 manifest、公開 artifact、runtime API、import side-effect，以及直接 import contract 輔助工具                                                  |
  | `plugin-sdk/plugin-test-runtime`          | 測試用的 Plugin runtime、registry、provider-registration、setup-wizard，以及 runtime task-flow fixtures                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Provider runtime、auth、discovery、onboard、catalog、media capability、replay policy、realtime STT live-audio、web-search/fetch，以及 wizard contract 輔助工具                 |
  | `plugin-sdk/provider-http-test-mocks`     | 選用的 Vitest HTTP/auth mocks，供會運用 `plugin-sdk/provider-http` 的 provider 測試使用                                                                                    |
  | `plugin-sdk/test-env`                     | 測試環境、fetch/network、可拋棄 HTTP 伺服器、incoming request、live-test、暫存檔案系統，以及 time-control fixtures                                        |
  | `plugin-sdk/test-fixtures`                | 通用 CLI、sandbox、skill、agent-message、system-event、module reload、bundled Plugin path、terminal、chunking、auth-token，以及 typed-case 測試 fixtures                   |
  | `plugin-sdk/test-node-mocks`              | 聚焦的 Node builtin mock 輔助工具，用於 Vitest `vi.mock("node:*")` factories 內                                                                                        |
  | `plugin-sdk/migration`                    | Migration provider item 輔助工具，例如 `createMigrationItem`、reason constants、item status markers、redaction helpers，以及 `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime migration 輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="頻道子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 匯出 (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用 setup wizard 輔助工具、allowlist prompts、setup status builders |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號 config/action-gate 輔助工具、default-account fallback 輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查找 + default-fallback 輔助工具 |
    | `plugin-sdk/account-helpers` | 窄範圍 account-list/account-action 輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道 config schema primitives 與通用 builder |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的 bundled plugins 使用的 bundled OpenClaw 頻道 config schemas |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel config schemas 的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram custom-command 正規化/驗證輔助工具，含 bundled-contract fallback |
    | `plugin-sdk/command-gating` | 窄範圍命令授權 gate 輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、draft stream lifecycle/finalization 輔助工具 |
    | `plugin-sdk/inbound-envelope` | 共用 inbound route + envelope builder 輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共用 inbound record-and-dispatch 輔助工具 |
    | `plugin-sdk/messaging-targets` | Target parsing/matching 輔助工具 |
    | `plugin-sdk/outbound-media` | 共用 outbound media loading 輔助工具 |
    | `plugin-sdk/outbound-send-deps` | Channel adapters 的輕量 outbound send dependency lookup |
    | `plugin-sdk/outbound-runtime` | Outbound delivery、identity、send delegate、session、formatting，以及 payload planning 輔助工具 |
    | `plugin-sdk/poll-runtime` | 窄範圍 poll normalization 輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycle 與 adapter 輔助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版 agent media payload builder |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding、pairing，以及 configured-binding 輔助工具 |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot 輔助工具 |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy resolution 輔助工具 |
    | `plugin-sdk/channel-status` | 共用頻道 status snapshot/summary 輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 窄範圍頻道 config-schema primitives |
    | `plugin-sdk/channel-config-writes` | 頻道 config-write authorization 輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道 Plugin prelude 匯出 |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read 輔助工具 |
    | `plugin-sdk/group-access` | 共用 group-access decision 輔助工具 |
    | `plugin-sdk/direct-dm` | 共用 direct-DM auth/guard 輔助工具 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性 facade，用於已發布的 `@openclaw/discord@2026.3.13` 與已追蹤的 owner 相容性；新的 plugins 應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram account-resolution 相容性 facade，用於已追蹤的 owner 相容性；新的 plugins 應使用注入的 runtime 輔助工具或通用頻道 SDK 子路徑 |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、delivery，以及舊版 interactive reply 輔助工具。請參閱 [訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Inbound debounce、mention matching、mention-policy 輔助工具，以及 envelope 輔助工具的相容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 窄範圍 inbound debounce 輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 窄範圍 mention-policy、mention marker，以及 mention text 輔助工具，不含較廣的 inbound runtime surface |
    | `plugin-sdk/channel-envelope` | 窄範圍 inbound envelope formatting 輔助工具 |
    | `plugin-sdk/channel-location` | 頻道 location context 與 formatting 輔助工具 |
    | `plugin-sdk/channel-logging` | Inbound drops 與 typing/ack failures 的頻道 logging 輔助工具 |
    | `plugin-sdk/channel-send-result` | Reply result types |
    | `plugin-sdk/channel-actions` | 頻道 message-action 輔助工具，以及為 Plugin 相容性保留的已棄用 native schema 輔助工具 |
    | `plugin-sdk/channel-route` | 共用 route normalization、parser-driven target resolution、thread-id stringification、dedupe/compact route keys、parsed-target types，以及 route/target comparison 輔助工具 |
    | `plugin-sdk/channel-targets` | Target parsing 輔助工具；route comparison callers 應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道 contract types |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | 窄範圍 secret-contract 輔助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`，以及 secret target types |
  </Accordion>

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 提供者外觀介面，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段外觀介面，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自架提供者設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 專注於 OpenAI 相容自架提供者的設定輔助工具 |
    | `plugin-sdk/cli-backend` | CLI 後端預設值 + 看門狗常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者 Plugin 的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰入門／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-auth-login` | 提供者 Plugin 共用的互動式登入輔助工具 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查詢輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共用重播原則建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄增補執行階段鉤子，以及用於合約測試的 Plugin 提供者登錄接縫 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP／端點能力輔助工具、提供者 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡的網頁擷取設定／選擇合約輔助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取提供者註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 精簡的網頁搜尋設定／憑證輔助工具，適用於不需要 Plugin 啟用接線的提供者 |
    | `plugin-sdk/provider-web-search-contract` | 精簡的網頁搜尋設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及具作用域的憑證設定器／取得器 |
    | `plugin-sdk/provider-web-search` | 網頁搜尋提供者註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 結構描述清理 + 診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及類似項目 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者傳輸輔助工具，例如受保護的擷取、傳輸訊息轉換，以及可寫入傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 入門設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 行程本機單例／對映／快取輔助工具 |
    | `plugin-sdk/group-activation` | 精簡的群組啟用模式與命令剖析輔助工具 |
  </Accordion>

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助工具（包含動態引數選單格式化）、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准 Gateway 解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 熱通道進入點的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助工具；當較精簡的配接器／Gateway 接縫足夠時，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標 + 帳戶繫結輔助工具 |
    | `plugin-sdk/approval-reply-runtime` | Exec／Plugin 核准回覆承載輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准承載輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精簡的傳入回覆去重重設輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛測試 barrel 的精簡通道合約測試輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 熱通道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 通道／Plugin 秘密介面的精簡秘密合約收集輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於秘密合約／設定剖析的精簡 `coerceSecretRef` 與 SecretRef 型別輔助工具 |
    | `plugin-sdk/security-runtime` | 共用信任、DM 閘控、外部內容、敏感文字遮蔽、常數時間秘密比較，以及秘密收集輔助工具 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單與私人網路 SSRF 原則輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎架構執行階段介面的精簡釘選派送器輔助工具 |
    | `plugin-sdk/ssrf-runtime` | 釘選派送器、SSRF 保護擷取、SSRF 錯誤，以及 SSRF 原則輔助工具 |
    | `plugin-sdk/secret-input` | 秘密輸入剖析輔助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 請求／目標輔助工具，以及原始 websocket／本文強制轉型 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段/記錄/備份/Plugin 安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段 env、logger、timeout、retry 與 backoff 輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定 facade，用於正規化設定檔/預設值、CDP URL 剖析，以及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用通道執行階段 context 註冊與查找輔助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用的 Plugin command/hook/http/interactive 輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用的 Webhook/內部 hook pipeline 輔助工具 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 與 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序 exec 輔助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、引數叫用，以及延遲 command group 輔助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 用戶端、事件迴圈就緒用戶端啟動輔助工具、Gateway CLI RPC、Gateway protocol 錯誤，以及通道狀態 patch 輔助工具 |
    | `plugin-sdk/config-types` | 僅型別設定介面，用於 Plugin 設定形狀，例如 `OpenClawConfig` 和通道/提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段 Plugin 設定查找輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 與 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 與 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 與測試快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram command 名稱/描述正規化與重複/衝突檢查，即使 bundled Telegram contract 介面不可用也適用 |
    | `plugin-sdk/text-autolink-runtime` | 不需廣泛 text-runtime barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/approval-runtime` | Exec/Plugin 核准輔助工具、核准能力 builder、驗證/設定檔輔助工具、原生路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用的 inbound/reply 執行階段輔助工具、分塊、分派、Heartbeat、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派/完成與 conversation label 輔助工具 |
    | `plugin-sdk/reply-history` | 共用的短時間窗回覆歷史輔助工具與標記，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 與 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字/Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存路徑、工作階段 key、更新時間，以及儲存變更輔助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 儲存路徑/載入/儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態/OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/routing` | 路由/工作階段 key/帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 與 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用的通道/帳號狀態摘要輔助工具、執行階段狀態預設值，以及問題 metadata 輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從 fetch/request 類輸入中擷取字串 URL |
    | `plugin-sdk/run-command` | 具備正規化 stdout/stderr 結果的限時 command runner |
    | `plugin-sdk/param-readers` | 常用工具/CLI 參數 reader |
    | `plugin-sdk/tool-payload` | 從工具結果物件中擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具 args 中擷取 canonical send target 欄位 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具 |
    | `plugin-sdk/logging-core` | 子系統 logger 與遮罩輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 與 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取/寫入輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖定輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 輕量 ACP 後端註冊與回覆分派輔助工具，供啟動時載入的 plugins 使用 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 無生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡的 agent 執行階段設定 schema primitives |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數 reader |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置 bootstrap 與配對 token 輔助工具 |
    | `plugin-sdk/extension-shared` | 共用被動通道、狀態與 ambient proxy 輔助 primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` command/提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill command 清單輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令 registry/build/serialize 輔助工具 |
    | `plugin-sdk/agent-harness` | 低階 agent harness 的實驗性受信任 Plugin 介面：harness 型別、active-run steer/abort 輔助工具、OpenClaw 工具橋接輔助工具、runtime-plan 工具政策輔助工具、terminal outcome 分類、工具進度格式化/詳細資料輔助工具，以及 attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI endpoint 偵測輔助工具 |
    | `plugin-sdk/async-lock-runtime` | 小型執行階段狀態檔案的程序本機 async lock 輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 通道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界 async task concurrency 輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 對外 pending-delivery drain 輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 事件與可見性輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全 token/UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上方聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與 trace-context 輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、proxy、EnvHttpProxyAgent 選項，以及 pinned lookup 輔助工具 |
    | `plugin-sdk/runtime-fetch` | 具 dispatcher 感知能力的執行階段 fetch，不匯入 proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | 有界 response-body reader，不含廣泛 media runtime 介面 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具，不含廣泛設定寫入/維護匯入 |
    | `plugin-sdk/context-visibility-runtime` | Context 可見性解析與補充 context 篩選，不含廣泛設定/安全性匯入 |
    | `plugin-sdk/string-coerce-runtime` | 精簡的 primitive record/字串強制轉換與正規化輔助工具，不含 markdown/logging 匯入 |
    | `plugin-sdk/host-runtime` | Hostname 與 SCP host 正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | Retry 設定與 retry runner 輔助工具 |
    | `plugin-sdk/agent-runtime` | Agent 目錄/身分/工作區輔助工具 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助程式、以 ffprobe 支援的影片尺寸探測，以及媒體承載資料建構器 |
    | `plugin-sdk/media-store` | 精簡媒體儲存輔助程式，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助程式、候選項選取，以及缺少模型的訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，以及面向提供者的影像/音訊輔助匯出 |
    | `plugin-sdk/text-runtime` | 共用文字/markdown/記錄輔助程式，例如移除助理可見文字、markdown 轉譯/分塊/表格輔助程式、遮蔽輔助程式、指令標籤輔助程式，以及安全文字工具 |
    | `plugin-sdk/text-chunking` | 輸出文字分塊輔助程式 |
    | `plugin-sdk/speech` | 語音提供者型別，以及面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器與語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者型別、登錄、指令、正規化與語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄輔助程式，以及共用 WebSocket 工作階段輔助程式 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別與登錄輔助程式 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，以及影像資產/資料 URL 輔助程式與 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證與登錄輔助程式 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助程式、提供者查詢，以及模型參照剖析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助程式、提供者查詢，以及模型參照剖析 |
    | `plugin-sdk/webhook-targets` | Webhook 目標登錄與路由安裝輔助程式 |
    | `plugin-sdk/webhook-path` | Webhook 路徑正規化輔助程式 |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助程式 |
    | `plugin-sdk/zod` | 為 plugin SDK 使用者重新匯出的 `zod` |
    | `plugin-sdk/testing` | 舊版 plugin 測試的廣泛相容性匯出桶。新的 extension 測試應改為匯入聚焦的 SDK 子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小化的 `createTestPluginApi` 輔助程式，用於直接 plugin 註冊單元測試，而不匯入 repo 測試輔助橋接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 原生代理執行階段配接器合約 fixtures，用於驗證、遞送、後援、工具鉤子、提示詞覆蓋、schema 與轉錄投影測試 |
    | `plugin-sdk/channel-test-helpers` | 面向通道的測試輔助程式，用於通用動作/設定/狀態合約、目錄斷言、帳戶啟動生命週期、send-config threading、執行階段 mock、狀態問題、輸出遞送與鉤子註冊 |
    | `plugin-sdk/channel-target-testing` | 通道測試的共用目標解析錯誤案例套件 |
    | `plugin-sdk/plugin-test-contracts` | Plugin 套件、註冊、公開成品、直接匯入、執行階段 API 與匯入副作用合約輔助程式 |
    | `plugin-sdk/provider-test-contracts` | 提供者執行階段、驗證、探索、onboard、目錄、精靈、媒體功能、重播原則、即時 STT 現場音訊、網頁搜尋/擷取與串流合約輔助程式 |
    | `plugin-sdk/provider-http-test-mocks` | 可選用的 Vitest HTTP/驗證 mock，用於測試會運用 `plugin-sdk/provider-http` 的提供者 |
    | `plugin-sdk/test-fixtures` | 通用 CLI 執行階段擷取、沙盒情境、skill writer、agent-message、system-event、模組重新載入、內建 plugin 路徑、terminal-text、分塊、auth-token 與 typed-case fixtures |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 內建 mock 輔助程式，用於 Vitest `vi.mock("node:*")` factory 內 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 針對 manager/config/file/CLI 輔助程式的內建 memory-core 輔助表面 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶體索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入合約、登錄存取、本機提供者，以及通用批次/遠端輔助程式 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶體主機多模態輔助程式 |
    | `plugin-sdk/memory-core-host-query` | 記憶體主機查詢輔助程式 |
    | `plugin-sdk/memory-core-host-secret` | 記憶體主機秘密輔助程式 |
    | `plugin-sdk/memory-core-host-events` | 記憶體主機事件日誌輔助程式 |
    | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助程式 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機 CLI 執行階段輔助程式 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段輔助程式 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案/執行階段輔助程式 |
    | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段輔助程式的廠商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌輔助程式的廠商中立別名 |
    | `plugin-sdk/memory-host-files` | 記憶體主機檔案/執行階段輔助程式的廠商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 供記憶體相鄰 plugins 使用的共用受管理 markdown 輔助程式 |
    | `plugin-sdk/memory-host-search` | 用於 search-manager 存取的 Active Memory 執行階段 facade |
    | `plugin-sdk/memory-host-status` | 記憶體主機狀態輔助程式的廠商中立別名 |
  </Accordion>

  <Accordion title="保留的內建輔助子路徑">
    目前沒有保留的內建輔助 SDK 子路徑。擁有者特定的
    輔助程式位於所屬的 plugin 套件內，而可重用的主機合約
    使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 與 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相關

- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)

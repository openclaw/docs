---
read_when:
    - 為 Plugin 匯入選擇正確的 plugin-sdk 子路徑
    - 稽核隨附 Plugin 子路徑與輔助介面
summary: Plugin SDK 子路徑目錄：依區域分組列出各匯入位於何處
title: Plugin SDK 子路徑
x-i18n:
    generated_at: "2026-05-02T21:01:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK 會以 `openclaw/plugin-sdk/` 下的一組狹窄子路徑公開。
  本頁按用途分組列出常用子路徑。自動產生的 200+ 子路徑完整清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留的 bundled Plugin 輔助子路徑也會出現在其中，但除非某個文件頁面明確將其提升為公開介面，否則它們屬於實作細節。維護者可以使用 `pnpm plugins:boundary-report:summary` 稽核作用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是作為閒置相容性債留在公開 SDK 中。

  如需 Plugin 撰寫指南，請參閱 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview)。

  ## Plugin 進入點

  | 子路徑                                   | 主要匯出                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 舊版 Plugin 測試的廣泛相容性彙整匯出；新的擴充測試請優先使用聚焦的測試子路徑                                                                     |
  | `plugin-sdk/plugin-test-api`              | 用於直接 Plugin 註冊單元測試的最小 `OpenClawPluginApi` mock 建構器                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | 原生 agent-runtime adapter contract fixture，涵蓋 auth profiles、delivery suppression、fallback classification、tool hooks、prompt overlays、schemas，以及 transcript repair |
  | `plugin-sdk/channel-test-helpers`         | Channel account lifecycle、directory、send-config、runtime mock、hook、bundled channel entry、envelope timestamp、pairing reply，以及通用 channel contract 測試輔助   |
  | `plugin-sdk/channel-target-testing`       | 共用的 channel target-resolution 錯誤案例測試套件                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 註冊、package manifest、public artifact、runtime API、import side-effect，以及 direct import contract 輔助                                                  |
  | `plugin-sdk/plugin-test-runtime`          | 測試用的 Plugin runtime、registry、provider-registration、setup-wizard，以及 runtime task-flow fixture                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Provider runtime、auth、discovery、onboard、catalog、media capability、replay policy、realtime STT live-audio、web-search/fetch，以及 wizard contract 輔助                 |
  | `plugin-sdk/provider-http-test-mocks`     | 供會執行 `plugin-sdk/provider-http` 的 provider 測試選擇性使用的 Vitest HTTP/auth mock                                                                                    |
  | `plugin-sdk/test-env`                     | Test environment、fetch/network、disposable HTTP server、incoming request、live-test、temporary filesystem，以及 time-control fixture                                        |
  | `plugin-sdk/test-fixtures`                | 通用 CLI、sandbox、skill、agent-message、system-event、module reload、bundled Plugin path、terminal、chunking、auth-token，以及 typed-case 測試 fixture                   |
  | `plugin-sdk/test-node-mocks`              | 用於 Vitest `vi.mock("node:*")` factory 內的聚焦 Node 內建 mock 輔助                                                                                        |
  | `plugin-sdk/migration`                    | Migration provider item 輔助，例如 `createMigrationItem`、reason constants、item status markers、redaction helpers，以及 `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime migration 輔助，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel 子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根層 `openclaw.json` Zod schema 匯出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用 setup wizard 輔助、allowlist prompts、setup status builders |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號 config/action-gate 輔助、預設帳號 fallback 輔助 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、account-id 正規化輔助 |
    | `plugin-sdk/account-resolution` | 帳號查找 + 預設 fallback 輔助 |
    | `plugin-sdk/account-helpers` | 狹窄的 account-list/account-action 輔助 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用 channel config schema primitive，以及 Zod 和直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的 bundled Plugin 使用的 bundled OpenClaw channel config schema |
    | `plugin-sdk/channel-config-schema-legacy` | bundled-channel config schema 的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂 command 正規化/驗證輔助，含 bundled-contract fallback |
    | `plugin-sdk/command-gating` | 狹窄的 command authorization gate 輔助 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`、draft stream lifecycle/finalization 輔助 |
    | `plugin-sdk/inbound-envelope` | 共用 inbound route + envelope builder 輔助 |
    | `plugin-sdk/inbound-reply-dispatch` | 共用 inbound record-and-dispatch 輔助 |
    | `plugin-sdk/messaging-targets` | Target parsing/matching 輔助 |
    | `plugin-sdk/outbound-media` | 共用 outbound media loading 輔助 |
    | `plugin-sdk/outbound-send-deps` | 給 channel adapter 的輕量 outbound send dependency 查找 |
    | `plugin-sdk/outbound-runtime` | Outbound delivery、identity、send delegate、session、formatting，以及 payload planning 輔助 |
    | `plugin-sdk/poll-runtime` | 狹窄的 poll 正規化輔助 |
    | `plugin-sdk/thread-bindings-runtime` | Thread-binding lifecycle 與 adapter 輔助 |
    | `plugin-sdk/agent-media-payload` | 舊版 agent media payload 建構器 |
    | `plugin-sdk/conversation-runtime` | Conversation/thread binding、pairing，以及 configured-binding 輔助 |
    | `plugin-sdk/runtime-config-snapshot` | Runtime config snapshot 輔助 |
    | `plugin-sdk/runtime-group-policy` | Runtime group-policy resolution 輔助 |
    | `plugin-sdk/channel-status` | 共用 channel status snapshot/summary 輔助 |
    | `plugin-sdk/channel-config-primitives` | 狹窄的 channel config-schema primitive |
    | `plugin-sdk/channel-config-writes` | Channel config-write authorization 輔助 |
    | `plugin-sdk/channel-plugin-common` | 共用 channel Plugin prelude 匯出 |
    | `plugin-sdk/allowlist-config-edit` | Allowlist config edit/read 輔助 |
    | `plugin-sdk/group-access` | 共用 group-access decision 輔助 |
    | `plugin-sdk/direct-dm` | 共用 direct-DM auth/guard 輔助 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性 facade，用於已發布的 `@openclaw/discord@2026.3.13` 和追蹤中的 owner 相容性；新的 Plugin 應使用通用 channel SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram account-resolution 相容性 facade，用於追蹤中的 owner 相容性；新的 Plugin 應使用注入的 runtime 輔助或通用 channel SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已棄用的 Zalo Personal 相容性 facade，用於仍匯入 sender command authorization 的已發布 Lark/Zalo packages；新的 Plugin 應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語義 message presentation、delivery，以及舊版 interactive reply 輔助。請參閱 [Message Presentation](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | inbound debounce、mention matching、mention-policy 輔助，以及 envelope 輔助的相容性彙整匯出 |
    | `plugin-sdk/channel-inbound-debounce` | 狹窄的 inbound debounce 輔助 |
    | `plugin-sdk/channel-mention-gating` | 狹窄的 mention-policy、mention marker，以及 mention text 輔助，不包含較廣泛的 inbound runtime surface |
    | `plugin-sdk/channel-envelope` | 狹窄的 inbound envelope formatting 輔助 |
    | `plugin-sdk/channel-location` | Channel location context 與 formatting 輔助 |
    | `plugin-sdk/channel-logging` | 用於 inbound drops 和 typing/ack failures 的 channel logging 輔助 |
    | `plugin-sdk/channel-send-result` | Reply result types |
    | `plugin-sdk/channel-actions` | Channel message-action 輔助，以及為 Plugin 相容性保留的已棄用 native schema 輔助 |
    | `plugin-sdk/channel-route` | 共用 route normalization、parser-driven target resolution、thread-id stringification、dedupe/compact route keys、parsed-target types，以及 route/target comparison 輔助 |
    | `plugin-sdk/channel-targets` | Target parsing 輔助；route comparison 呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Channel contract types |
    | `plugin-sdk/channel-feedback` | Feedback/reaction wiring |
    | `plugin-sdk/channel-secret-runtime` | 狹窄的 secret-contract 輔助，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`，以及 secret target types |
  </Accordion>

  <Accordion title="供應商子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 供應商 Facade，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段 Facade，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自託管供應商設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自託管供應商設定的輔助工具 |
    | `plugin-sdk/cli-backend` | CLI 後端預設值 + watchdog 常數 |
    | `plugin-sdk/provider-auth-runtime` | 供應商 Plugin 的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰新手上路／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-auth-login` | 供應商 Plugin 的共用互動式登入輔助工具 |
    | `plugin-sdk/provider-env-vars` | 供應商驗證環境變數查找輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共用重播政策建構器、供應商端點輔助工具，以及模型 ID 正規化輔助工具，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | 供應商目錄增補執行階段 Hook，以及用於合約測試的 Plugin 供應商登錄接縫 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用供應商 HTTP／端點能力輔助工具、供應商 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡的網頁擷取設定／選擇合約輔助工具，例如 `enablePluginInConfig` 與 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取供應商註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要 Plugin 啟用接線的供應商之精簡網頁搜尋設定／憑證輔助工具 |
    | `plugin-sdk/provider-web-search-contract` | 精簡的網頁搜尋設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及具作用域的憑證設定器／取得器 |
    | `plugin-sdk/provider-web-search` | 網頁搜尋供應商註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 結構描述清理 + 診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及類似項目 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生供應商傳輸輔助工具，例如受保護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 新手上路設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 程序本機 singleton／map／cache 輔助工具 |
    | `plugin-sdk/group-activation` | 精簡群組啟用模式與命令剖析輔助工具 |
  </Accordion>

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助工具（包含動態引數選單格式化）、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 與 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准 Gateway 解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 適用於熱門頻道進入點的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助工具；當較精簡的配接器／Gateway 接縫已足夠時，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標 + 帳號繫結輔助工具 |
    | `plugin-sdk/approval-reply-runtime` | Exec／Plugin 核准回覆酬載輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准酬載輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精簡傳入回覆去重重設輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛測試 barrel 的精簡頻道合約測試輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 適用於熱門頻道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 頻道／Plugin secret 介面的精簡 secret 合約收集輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於 secret 合約／設定剖析的精簡 `coerceSecretRef` 與 SecretRef 型別輔助工具 |
    | `plugin-sdk/security-runtime` | 共用信任、DM gate、外部內容、敏感文字遮蔽、常數時間 secret 比較，以及 secret 收集輔助工具 |
    | `plugin-sdk/ssrf-policy` | 主機 allowlist 與私有網路 SSRF 政策輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎架構執行階段介面的精簡固定 dispatcher 輔助工具 |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、SSRF 防護 fetch、SSRF 錯誤，以及 SSRF 政策輔助工具 |
    | `plugin-sdk/secret-input` | Secret 輸入剖析輔助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 請求／目標輔助工具，以及原始 websocket／本文強制轉型 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段、記錄、備份、Plugin 安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試與退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定 facade，用於正規化設定檔/預設值、CDP URL 解析與瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段內容註冊與查找輔助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用 Plugin 命令、hook、http、互動式輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用 Webhook/內部 hook 管線輔助工具 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、引數叫用與延遲命令群組輔助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 用戶端、事件迴圈就緒用戶端啟動輔助工具、Gateway CLI RPC、Gateway 通訊協定錯誤與頻道狀態修補輔助工具 |
    | `plugin-sdk/config-types` | Plugin 設定形狀的純型別設定介面，例如 `OpenClawConfig` 與頻道/供應商設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段 Plugin 設定查找輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和測試快照設定器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述正規化與重複/衝突檢查，即使綁定的 Telegram 合約介面不可用也能使用 |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛 text-runtime barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/approval-runtime` | 執行/Plugin 核准輔助工具、核准能力建構器、驗證/設定檔輔助工具、原生路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用傳入/回覆執行階段輔助工具、分塊、分派、Heartbeat、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派/完成與對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間窗回覆歷史輔助工具與標記，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字/Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存路徑、工作階段鍵、更新時間與儲存變更輔助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 儲存路徑/載入/儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態/OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/routing` | 路由/工作階段鍵/帳戶繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道/帳戶狀態摘要輔助工具、執行階段狀態預設值與問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從 fetch/類 request 輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具正規化 stdout/stderr 結果的限時命令執行器 |
    | `plugin-sdk/param-readers` | 常用工具/CLI 參數讀取器 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | 對話供應商設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀寫輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 針對啟動時載入 Plugin 的輕量 ACP 後端註冊與回覆分派輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡代理程式執行階段設定結構描述基元 |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動與配對權杖輔助工具 |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態與環境代理輔助基元 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/供應商回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列舉輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄/建構/序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 適用於低階代理程式 harness 的實驗性受信任 Plugin 介面：harness 型別、作用中執行導引/中止輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端機結果分類、工具進度格式化/詳細資料輔助工具，以及嘗試結果工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端點偵測輔助工具 |
    | `plugin-sdk/async-lock-runtime` | 適用於小型執行階段狀態檔案的程序本機非同步鎖輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界非同步工作並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 傳出待處理傳遞排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 事件與可見性輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖/UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上方聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與追蹤內容輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝 fetch、代理、EnvHttpProxyAgent 選項與固定 lookup 輔助工具 |
    | `plugin-sdk/runtime-fetch` | 不匯入代理/受防護 fetch 的 dispatcher 感知執行階段 fetch |
    | `plugin-sdk/response-limit-runtime` | 不透過廣泛媒體執行階段介面的有界回應本文讀取器 |
    | `plugin-sdk/session-binding-runtime` | 不含已設定繫結路由或配對儲存的目前對話繫結狀態 |
    | `plugin-sdk/session-store-runtime` | 不含廣泛設定寫入/維護匯入的工作階段儲存輔助工具 |
    | `plugin-sdk/context-visibility-runtime` | 不含廣泛設定/安全性匯入的內容可見性解析與補充內容篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不含 Markdown/記錄匯入的精簡基元記錄/字串強制轉換與正規化輔助工具 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 代理程式目錄/身分/workspace 輔助工具 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具、以 ffprobe 支援的影片尺寸偵測，以及媒體承載資料建構器 |
    | `plugin-sdk/media-store` | 精簡媒體儲存輔助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選項選擇，以及缺少模型的訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，以及面向提供者的影像/音訊輔助工具匯出 |
    | `plugin-sdk/text-runtime` | 共用文字/markdown/記錄輔助工具，例如移除助理可見文字、markdown 算繪/分塊/表格輔助工具、遮蔽輔助工具、指令標籤輔助工具，以及安全文字工具 |
    | `plugin-sdk/text-chunking` | 外送文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音提供者型別，以及面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器與語音輔助工具匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者型別、登錄、指令、正規化與語音輔助工具匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄輔助工具與共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別與登錄輔助工具 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，以及影像資產/資料 URL 輔助工具與 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證與登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助工具、提供者查找與模型參照剖析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助工具、提供者查找與模型參照剖析 |
    | `plugin-sdk/webhook-targets` | Webhook 目標登錄與路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路徑正規化輔助工具 |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 為 plugin SDK 消費者重新匯出的 `zod` |
    | `plugin-sdk/testing` | 舊版 plugin 測試的廣泛相容性總匯。新的 extension 測試應改為匯入聚焦的 SDK 子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小化的 `createTestPluginApi` 輔助工具，用於直接 plugin 註冊單元測試，不需匯入 repo 測試輔助橋接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 原生 agent-runtime 轉接器合約 fixture，適用於驗證、遞送、後援、工具掛鉤、提示覆蓋、結構描述與逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 面向通道的測試輔助工具，涵蓋通用動作/設定/狀態合約、目錄斷言、帳號啟動生命週期、send-config 執行緒、執行階段 mock、狀態問題、外送遞送與掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 通道測試的共用目標解析錯誤案例套件 |
    | `plugin-sdk/plugin-test-contracts` | Plugin 套件、註冊、公用成品、直接匯入、執行階段 API 與匯入副作用合約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 提供者執行階段、驗證、探索、onboard、目錄、精靈、媒體能力、重播政策、即時 STT 即時音訊、網頁搜尋/擷取與串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 選用的 Vitest HTTP/驗證 mock，適用於會執行 `plugin-sdk/provider-http` 的提供者測試 |
    | `plugin-sdk/test-fixtures` | 通用 CLI 執行階段擷取、沙箱內容、skill 寫入器、agent-message、system-event、模組重新載入、bundled plugin 路徑、terminal-text、分塊、auth-token 與型別化案例 fixture |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 內建 mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內部 |
  </Accordion>

  <Accordion title="Memory 子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 管理器/config/檔案/CLI 輔助工具的 bundled memory-core 輔助工具介面 |
    | `plugin-sdk/memory-core-engine-runtime` | Memory 索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | Memory host foundation engine 匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Memory host embedding 合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | Memory host QMD engine 匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | Memory host storage engine 匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | Memory host 多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | Memory host 查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | Memory host secret 輔助工具 |
    | `plugin-sdk/memory-core-host-events` | Memory host 事件日誌輔助工具 |
    | `plugin-sdk/memory-core-host-status` | Memory host 狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | Memory host CLI 執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | Memory host 核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | Memory host 檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | memory host 核心執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | memory host 事件日誌輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | memory host 檔案/執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 供 memory-adjacent plugins 使用的共用受管理 markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於 search-manager 存取的 Active Memory 執行階段 facade |
    | `plugin-sdk/memory-host-status` | memory host 狀態輔助工具的供應商中立別名 |
  </Accordion>

  <Accordion title="保留的 bundled-helper 子路徑">
    目前沒有保留的 bundled-helper SDK 子路徑。擁有者專屬輔助工具位於擁有該功能的 plugin 套件內，而可重複使用的 host 合約則使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相關

- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)

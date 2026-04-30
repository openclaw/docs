---
read_when:
    - 為 Plugin 匯入選擇正確的 plugin-sdk 子路徑
    - 稽核隨附 Plugin 子路徑與輔助介面
summary: Plugin SDK 子路徑目錄：依領域分組說明各匯入項目所在位置
title: Plugin SDK 子路徑
x-i18n:
    generated_at: "2026-04-30T09:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Plugin SDK 以 `openclaw/plugin-sdk/` 下的一組精簡子路徑公開。
  本頁依用途分組列出常用子路徑。產生的 200 多個子路徑完整清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；
  保留的內建 Plugin 輔助子路徑會出現在該處，但除非文件頁面明確提升它們的地位，否則都屬於實作細節。維護者可以使用 `pnpm plugins:boundary-report:summary` 稽核作用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是以休眠相容性債務的形式留在公開 SDK 中。

  如需 Plugin 撰寫指南，請參閱 [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)。

  ## Plugin 進入點

  | 子路徑                                    | 主要匯出項                                                                                                                                                                   |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | 供舊版 Plugin 測試使用的廣泛相容性 barrel；新的擴充測試請優先使用聚焦的測試子路徑                                                   |
  | `plugin-sdk/plugin-test-api`              | 用於直接 Plugin 註冊單元測試的最小 `OpenClawPluginApi` 模擬建構器                                               |
  | `plugin-sdk/agent-runtime-test-contracts` | 原生 agent-runtime 轉接器合約 fixture，涵蓋驗證設定檔、遞送抑制、備援分類、工具 hook、提示詞覆寫、結構描述與逐字稿修復 |
  | `plugin-sdk/channel-test-helpers`         | 通道帳號生命週期、目錄、傳送設定、runtime 模擬、hook、內建通道進入點、信封時間戳記、配對回覆，以及通用通道合約測試輔助工具 |
  | `plugin-sdk/channel-target-testing`       | 共用通道目標解析錯誤案例測試套件                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Plugin 註冊、套件 manifest、公開成品、runtime API、匯入副作用，以及直接匯入合約輔助工具                                                  |
  | `plugin-sdk/plugin-test-runtime`          | 測試用的 Plugin runtime、登錄檔、提供者註冊、設定精靈，以及 runtime TaskFlow fixture                                                                      |
  | `plugin-sdk/provider-test-contracts`      | 提供者 runtime、驗證、探索、onboard、目錄、媒體能力、重播政策、即時 STT 即時音訊、網頁搜尋/擷取，以及精靈合約輔助工具                 |
  | `plugin-sdk/provider-http-test-mocks`     | 選用的 Vitest HTTP/驗證模擬，供演練 `plugin-sdk/provider-http` 的提供者測試使用                                                                                    |
  | `plugin-sdk/test-env`                     | 測試環境、fetch/網路、一次性 HTTP 伺服器、傳入請求、即時測試、暫存檔案系統，以及時間控制 fixture                                        |
  | `plugin-sdk/test-fixtures`                | 通用 CLI、沙箱、skill、agent-message、system-event、模組重新載入、內建 Plugin 路徑、終端機、分塊、驗證權杖，以及型別化案例測試 fixture                   |
  | `plugin-sdk/test-node-mocks`              | 聚焦的 Node 內建模擬輔助工具，用於 Vitest `vi.mock("node:*")` factory 內部                                                                                        |
  | `plugin-sdk/migration`                    | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具，以及 `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Runtime 遷移輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="通道子路徑">
    | 子路徑 | 主要匯出項 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根層級 `openclaw.json` Zod 結構描述匯出 (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、allowlist 提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定/動作閘道輔助工具、預設帳號備援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查詢與預設備援輔助工具 |
    | `plugin-sdk/account-helpers` | 精簡帳號清單/帳號動作輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用通道設定結構描述基元與通用建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供受維護內建 Plugin 使用的內建 OpenClaw 通道設定結構描述 |
    | `plugin-sdk/channel-config-schema-legacy` | 內建通道設定結構描述的已淘汰相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂命令正規化/驗證輔助工具，含內建合約備援 |
    | `plugin-sdk/command-gating` | 精簡命令授權閘道輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`，草稿串流生命週期/最終化輔助工具 |
    | `plugin-sdk/inbound-envelope` | 共用傳入路由與信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共用傳入記錄與分派輔助工具 |
    | `plugin-sdk/messaging-targets` | 目標剖析/比對輔助工具 |
    | `plugin-sdk/outbound-media` | 共用傳出媒體載入輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 供通道轉接器使用的輕量傳出傳送相依項查詢 |
    | `plugin-sdk/outbound-runtime` | 傳出遞送、身分、傳送委派、工作階段、格式化，以及 payload 規劃輔助工具 |
    | `plugin-sdk/poll-runtime` | 精簡 poll 正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 執行緒綁定生命週期與轉接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版代理媒體 payload 建構器 |
    | `plugin-sdk/conversation-runtime` | 對話/執行緒綁定、配對，以及已設定綁定輔助工具 |
    | `plugin-sdk/runtime-config-snapshot` | Runtime 設定快照輔助工具 |
    | `plugin-sdk/runtime-group-policy` | Runtime 群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用通道狀態快照/摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 精簡通道設定結構描述基元 |
    | `plugin-sdk/channel-config-writes` | 通道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用通道 Plugin 前置匯出 |
    | `plugin-sdk/allowlist-config-edit` | Allowlist 設定編輯/讀取輔助工具 |
    | `plugin-sdk/group-access` | 共用群組存取決策輔助工具 |
    | `plugin-sdk/direct-dm` | 共用直接 DM 驗證/防護輔助工具 |
    | `plugin-sdk/discord` | 已淘汰的 Discord 相容性 facade，供已發布的 `@openclaw/discord@2026.3.13` 與已追蹤的擁有者相容性使用；新的 Plugin 應使用通用通道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已淘汰的 Telegram 帳號解析相容性 facade，供已追蹤的擁有者相容性使用；新的 Plugin 應使用注入的 runtime 輔助工具或通用通道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已淘汰的 Zalo Personal 相容性 facade，供仍匯入傳送者命令授權的已發布 Lark/Zalo 套件使用；新的 Plugin 應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送，以及舊版互動式回覆輔助工具。請參閱 [訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 傳入 debounce、提及比對、提及政策輔助工具與信封輔助工具的相容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 精簡傳入 debounce 輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 精簡提及政策、提及標記與提及文字輔助工具，不含較廣泛的傳入 runtime 介面 |
    | `plugin-sdk/channel-envelope` | 精簡傳入信封格式化輔助工具 |
    | `plugin-sdk/channel-location` | 通道位置情境與格式化輔助工具 |
    | `plugin-sdk/channel-logging` | 供傳入丟棄與 typing/ack 失敗使用的通道記錄輔助工具 |
    | `plugin-sdk/channel-send-result` | 回覆結果型別 |
    | `plugin-sdk/channel-actions` | 通道訊息動作輔助工具，以及為 Plugin 相容性保留的已淘汰原生結構描述輔助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、剖析器驅動的目標解析、thread-id 字串化、去重/壓縮路由鍵、已剖析目標型別，以及路由/目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 目標剖析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 通道合約型別 |
    | `plugin-sdk/channel-feedback` | Feedback/reaction 接線 |
    | `plugin-sdk/channel-secret-runtime` | 精簡密鑰合約輔助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 與密鑰目標型別 |
  </Accordion>

  <Accordion title="Provider 子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio Provider 外觀介面，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段外觀介面，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助函式 |
    | `plugin-sdk/provider-setup` | 精選的本機／自託管 Provider 設定輔助函式 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自託管 Provider 的設定輔助函式 |
    | `plugin-sdk/cli-backend` | CLI 後端預設值 + watchdog 常數 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 的執行階段 API 金鑰解析輔助函式 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰入門／設定檔寫入輔助函式，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-auth-login` | Provider Plugin 的共用互動式登入輔助函式 |
    | `plugin-sdk/provider-env-vars` | Provider 驗證環境變數查詢輔助函式 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共用重播政策建構器、Provider 端點輔助函式，以及模型 ID 正規化輔助函式，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Provider 目錄擴充執行階段 hook，以及用於合約測試的 Plugin Provider 登錄 seam |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用 Provider HTTP／端點能力輔助函式、Provider HTTP 錯誤，以及音訊轉錄 multipart 表單輔助函式 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡的網頁擷取設定／選取合約輔助函式，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取 Provider 註冊／快取輔助函式 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要 Plugin 啟用接線的 Provider 的精簡網頁搜尋設定／憑證輔助函式 |
    | `plugin-sdk/provider-web-search-contract` | 精簡的網頁搜尋設定／憑證合約輔助函式，例如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`，以及限定範圍的憑證 setter／getter |
    | `plugin-sdk/provider-web-search` | 網頁搜尋 Provider 註冊／快取／執行階段輔助函式 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 結構描述清理 + 診斷，以及 xAI 相容性輔助函式，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及類似項目 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助函式 |
    | `plugin-sdk/provider-transport-runtime` | 原生 Provider 傳輸輔助函式，例如受防護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 入門設定修補輔助函式 |
    | `plugin-sdk/global-singleton` | 程序本機 singleton／map／cache 輔助函式 |
    | `plugin-sdk/group-activation` | 精簡的群組啟用模式與命令剖析輔助函式 |
  </Accordion>

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助函式，包括動態引數選單格式化、寄件者授權輔助函式 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同聊天室動作驗證輔助函式 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助函式 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准 Gateway 解析輔助函式 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 熱門通道進入點的輕量原生核准配接器載入輔助函式 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助函式；當較精簡的配接器／Gateway seam 足夠時，優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標 + 帳戶繫結輔助函式 |
    | `plugin-sdk/approval-reply-runtime` | Exec／Plugin 核准回覆 payload 輔助函式 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准 payload 輔助函式、原生核准路由／執行階段輔助函式，以及結構化核准顯示輔助函式，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精簡的入站回覆去重重設輔助函式 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛測試 barrel 的精簡通道合約測試輔助函式 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助函式 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助函式 |
    | `plugin-sdk/command-primitives-runtime` | 熱門通道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助函式 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 通道／Plugin 機密介面的精簡機密合約收集輔助函式 |
    | `plugin-sdk/secret-ref-runtime` | 用於機密合約／設定剖析的精簡 `coerceSecretRef` 與 SecretRef 型別輔助函式 |
    | `plugin-sdk/security-runtime` | 共用信任、DM gating、外部內容、敏感文字遮蔽、常數時間機密比較，以及機密收集輔助函式 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單與私人網路 SSRF 政策輔助函式 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎設施執行階段介面的精簡 pinned-dispatcher 輔助函式 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF 防護 fetch、SSRF 錯誤，以及 SSRF 政策輔助函式 |
    | `plugin-sdk/secret-input` | 機密輸入剖析輔助函式 |
    | `plugin-sdk/webhook-ingress` | Webhook 請求／目標輔助函式，以及原始 websocket／body 強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助函式 |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段／記錄／備份／Plugin 安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試和退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定 facade，用於正規化設定檔／預設值、CDP URL 解析和瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段內容註冊與查詢輔助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用 Plugin 命令／hook／HTTP／互動式輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用 Webhook／內部 hook 管線輔助工具 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入／繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、引數叫用和延遲命令群組輔助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 用戶端、事件迴圈就緒用戶端啟動輔助工具、Gateway CLI RPC、Gateway 通訊協定錯誤和頻道狀態修補輔助工具 |
    | `plugin-sdk/config-types` | 僅型別的 Plugin 設定介面，用於 `OpenClawConfig` 等 Plugin 設定形狀和頻道／提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段 Plugin 設定查詢輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和測試快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱／描述正規化和重複／衝突檢查，即使 bundled Telegram 合約介面無法使用也可運作 |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛 text-runtime barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准輔助工具、核准能力建構器、驗證／設定檔輔助工具、原生路由／執行階段輔助工具，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用傳入／回覆執行階段輔助工具、分塊、分派、Heartbeat、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派／完成和對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間窗回覆歷史輔助工具和標記，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字／Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存路徑、工作階段鍵、更新時間和儲存變更輔助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 儲存路徑／載入／儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態／OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/routing` | 路由／工作階段鍵／帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道／帳號狀態摘要輔助工具、執行階段狀態預設值和問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug／字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從 fetch／request 類輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具逾時功能的命令執行器，提供正規化 stdout／stderr 結果 |
    | `plugin-sdk/param-readers` | 常用工具／CLI 參數讀取器 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準 send 目標欄位 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具 |
    | `plugin-sdk/logging-core` | 子系統記錄器和遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型／工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀寫輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段／工作階段和回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 輕量 ACP 後端註冊和回覆分派輔助工具，用於啟動時載入的 plugins |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡的代理執行階段設定結構描述基本元件 |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置 bootstrap 和配對權杖輔助工具 |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態和 ambient proxy 輔助基本元件 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令／提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列出輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄／建構／序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 實驗性受信任 Plugin 介面，用於低階代理 harness：harness 型別、作用中執行 steer／abort 輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端機結果分類、工具進度格式化／詳細資料輔助工具，以及嘗試結果工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端點偵測輔助工具 |
    | `plugin-sdk/async-lock-runtime` | 用於小型執行階段狀態檔案的程序本機非同步鎖輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界非同步工作並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 傳出待處理遞送排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案和媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 事件和可見性輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖／UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/infra-runtime` | 已淘汰的相容性 shim；請使用上方聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件和追蹤內容輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、proxy、EnvHttpProxyAgent 選項和 pinned lookup 輔助工具 |
    | `plugin-sdk/runtime-fetch` | 可感知 Dispatcher 的執行階段 fetch，不匯入 proxy／guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | 有界回應本文讀取器，不含廣泛 media 執行階段介面 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具，不含廣泛設定寫入／維護匯入 |
    | `plugin-sdk/context-visibility-runtime` | 內容可見性解析和補充內容篩選，不含廣泛設定／安全性匯入 |
    | `plugin-sdk/string-coerce-runtime` | 精簡的基本型別 record／字串強制轉換和正規化輔助工具，不含 Markdown／記錄匯入 |
    | `plugin-sdk/host-runtime` | 主機名稱和 SCP 主機正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定和重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 代理目錄／身分／工作區輔助工具 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢／去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具、以 ffprobe 支援的影片尺寸探測，以及媒體酬載建構器 |
    | `plugin-sdk/media-store` | 窄範圍媒體儲存輔助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選項選取，以及缺少模型訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者類型，以及面向提供者的影像/音訊輔助工具匯出 |
    | `plugin-sdk/text-runtime` | 共用文字/Markdown/記錄輔助工具，例如助理可見文字剝除、Markdown 算繪/分塊/表格輔助工具、遮罩輔助工具、指令標籤輔助工具，以及安全文字公用工具 |
    | `plugin-sdk/text-chunking` | 對外文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音提供者類型，以及面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器和語音輔助工具匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者類型、登錄、指令、正規化，以及語音輔助工具匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者類型、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者類型和登錄輔助工具 |
    | `plugin-sdk/image-generation` | 影像生成提供者類型，以及影像資產/資料 URL 輔助工具和 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成類型、容錯移轉、驗證和登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/要求/結果類型 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成類型、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/要求/結果類型 |
    | `plugin-sdk/video-generation-core` | 共用影片生成類型、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目標登錄和路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路徑正規化輔助工具 |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 為 Plugin SDK 使用者重新匯出的 `zod` |
    | `plugin-sdk/testing` | 用於舊版 Plugin 測試的廣泛相容性 barrel。新的擴充功能測試應改為匯入聚焦的 SDK 子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小化的 `createTestPluginApi` 輔助工具，用於直接 Plugin 註冊單元測試，不需匯入儲存庫測試輔助橋接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 用於驗證、傳遞、後援、工具掛鉤、提示覆疊、結構描述和逐字稿投影測試的原生代理執行階段配接器合約 fixture |
    | `plugin-sdk/channel-test-helpers` | 面向頻道的測試輔助工具，用於通用動作/設定/狀態合約、目錄斷言、帳戶啟動生命週期、傳送設定串接、執行階段 mock、狀態問題、對外傳遞和掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 用於頻道測試的共用目標解析錯誤案例套件 |
    | `plugin-sdk/plugin-test-contracts` | Plugin 套件、註冊、公開成品、直接匯入、執行階段 API，以及匯入副作用合約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 提供者執行階段、驗證、探索、上線、目錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網頁搜尋/擷取，以及串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 選用的 Vitest HTTP/驗證 mock，用於測試 `plugin-sdk/provider-http` 的提供者測試 |
    | `plugin-sdk/test-fixtures` | 通用 CLI 執行階段擷取、沙箱內容、skill 撰寫器、代理訊息、系統事件、模組重新載入、隨附 Plugin 路徑、終端文字、分塊、驗證權杖，以及具型別案例 fixture |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 內建 mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內 |
  </Accordion>

  <Accordion title="記憶子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 用於管理器/設定/檔案/CLI 輔助工具的隨附 memory-core 輔助介面 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶主機祕密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 記憶主機事件日誌輔助工具 |
    | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機 CLI 執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段輔助工具的廠商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶主機事件日誌輔助工具的廠商中立別名 |
    | `plugin-sdk/memory-host-files` | 記憶主機檔案/執行階段輔助工具的廠商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 用於記憶相鄰 Plugin 的共用受管理 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於搜尋管理器存取的主動記憶執行階段 facade |
    | `plugin-sdk/memory-host-status` | 記憶主機狀態輔助工具的廠商中立別名 |
  </Accordion>

  <Accordion title="保留的隨附輔助工具子路徑">
    目前沒有保留的隨附輔助工具 SDK 子路徑。擁有者特定的
    輔助工具位於擁有該工具的 Plugin 套件內，而可重用的主機合約
    則使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相關內容

- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)

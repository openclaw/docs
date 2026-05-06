---
read_when:
    - 為 Plugin 匯入選擇正確的 plugin-sdk 子路徑
    - 稽核內建 Plugin 子路徑與輔助介面
summary: Plugin SDK 子路徑目錄：哪些匯入位於何處，依領域分組
title: Plugin SDK 子路徑
x-i18n:
    generated_at: "2026-05-06T02:54:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK 會以 `openclaw/plugin-sdk/` 下的一組窄範圍子路徑公開。
本頁按用途分組列出常用子路徑。產生的 200 多個子路徑完整清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；
保留的內建 Plugin 輔助子路徑也會出現在其中，但除非某個文件頁面明確提升它們，否則都屬於實作細節。維護者可以使用 `pnpm plugins:boundary-report:summary` 稽核作用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是作為休眠的相容性負債留在公開 SDK 中。

如需 Plugin 編寫指南，請參閱 [Plugin SDK 概覽](/zh-TW/plugins/sdk-overview)。

## Plugin 入口

| 子路徑                                    | 主要匯出                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | 舊版 Plugin 測試的廣泛相容性彙整匯出；新的擴充測試請優先使用聚焦的測試子路徑                                                                     |
| `plugin-sdk/plugin-test-api`              | 用於直接 Plugin 註冊單元測試的最小 `OpenClawPluginApi` mock 建構器                                                                                           |
| `plugin-sdk/agent-runtime-test-contracts` | 原生代理執行階段配接器合約 fixtures，涵蓋驗證設定檔、遞送抑制、備援分類、工具鉤子、提示覆寫、schema 與對話紀錄修復 |
| `plugin-sdk/channel-test-helpers`         | 頻道帳號生命週期、目錄、傳送設定、執行階段 mock、鉤子、內建頻道入口、信封時間戳記、配對回覆與通用頻道合約測試輔助工具   |
| `plugin-sdk/channel-target-testing`       | 共用頻道目標解析錯誤案例測試套件                                                                                                                       |
| `plugin-sdk/plugin-test-contracts`        | Plugin 註冊、套件 manifest、公用成品、執行階段 API、匯入副作用與直接匯入合約輔助工具                                                  |
| `plugin-sdk/plugin-test-runtime`          | 用於測試的 Plugin 執行階段、登錄檔、提供者註冊、設定精靈與執行階段 TaskFlow fixtures                                                                      |
| `plugin-sdk/provider-test-contracts`      | 提供者執行階段、驗證、探索、上線、目錄、媒體能力、重播策略、即時 STT 即時音訊、網頁搜尋/擷取與精靈合約輔助工具                 |
| `plugin-sdk/provider-http-test-mocks`     | 針對會運用 `plugin-sdk/provider-http` 的提供者測試，可選用的 Vitest HTTP/驗證 mocks                                                                                    |
| `plugin-sdk/test-env`                     | 測試環境、擷取/網路、可拋棄 HTTP 伺服器、傳入請求、即時測試、暫存檔案系統與時間控制 fixtures                                        |
| `plugin-sdk/test-fixtures`                | 通用 CLI、沙箱、skill、代理訊息、系統事件、模組重新載入、內建 Plugin 路徑、終端機、分塊、驗證權杖與型別化案例測試 fixtures                   |
| `plugin-sdk/test-node-mocks`              | 聚焦的 Node 內建 mock 輔助工具，可在 Vitest `vi.mock("node:*")` factory 內使用                                                                                        |
| `plugin-sdk/migration`                    | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具與 `summarizeMigrationItems`                       |
| `plugin-sdk/migration-runtime`            | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 與 `writeMigrationReport`                                                    |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路徑 | 主要匯出項 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述匯出項 (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助函式、允許清單提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳戶設定/動作閘門輔助函式、預設帳戶後援輔助函式 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳戶 ID 正規化輔助函式 |
    | `plugin-sdk/account-resolution` | 帳戶查找 + 預設後援輔助函式 |
    | `plugin-sdk/account-helpers` | 精簡帳戶清單/帳戶動作輔助函式 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 舊版回覆管線輔助函式。新的頻道回覆管線程式碼應使用 `plugin-sdk/channel-message` 中的 `createChannelMessageReplyPipeline` 和 `resolveChannelMessageSourceReplyDeliveryMode`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定結構描述基本元素，以及 Zod 和直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的內建 Plugin 使用的 OpenClaw 內建頻道設定結構描述 |
    | `plugin-sdk/channel-config-schema-legacy` | 內建頻道設定結構描述的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂命令正規化/驗證輔助函式，含內建合約後援 |
    | `plugin-sdk/command-gating` | 精簡命令授權閘門輔助函式 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`，以及舊版草稿串流生命週期輔助函式。新的預覽最終化程式碼應使用 `plugin-sdk/channel-message`。 |
    | `plugin-sdk/channel-message` | 低成本訊息生命週期合約輔助函式，例如 `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`、相容性 facade、持久最終能力推導、傳送/收據/副作用能力的能力證明輔助函式、`MessageReceiveContext`、接收確認原則證明、`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`、即時預覽與即時最終化器能力證明、持久復原狀態、`RenderedMessageBatch`、訊息收據類型，以及收據 ID 輔助函式。請參閱[頻道訊息 API](/zh-TW/plugins/sdk-channel-message)。舊版 `createChannelTurnReplyPipeline` 僅保留供相容性分派器使用。 |
    | `plugin-sdk/channel-message-runtime` | 可載入外送遞送的執行階段遞送輔助函式，包括 `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` 和 `recordChannelMessageReplyDispatch`。請從監控/傳送執行階段模組使用，而不是熱路徑 Plugin 啟動載入檔案。 |
    | `plugin-sdk/inbound-envelope` | 共用傳入路由 + 信封建構器輔助函式 |
    | `plugin-sdk/inbound-reply-dispatch` | 舊版共用傳入記錄與分派輔助函式、可見/最終分派判斷式，以及供已準備的頻道分派器相容使用的已棄用 `deliverDurableInboundReplyPayload`。新的頻道接收/分派程式碼應從 `plugin-sdk/channel-message-runtime` 匯入執行階段生命週期輔助函式。 |
    | `plugin-sdk/messaging-targets` | 目標剖析/比對輔助函式 |
    | `plugin-sdk/outbound-media` | 共用外送媒體載入輔助函式 |
    | `plugin-sdk/outbound-send-deps` | 供頻道配接器使用的輕量外送傳送相依性查找 |
    | `plugin-sdk/outbound-runtime` | 外送遞送、身分、傳送委派、工作階段、格式化與酬載規劃輔助函式 |
    | `plugin-sdk/poll-runtime` | 精簡投票正規化輔助函式 |
    | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結生命週期與配接器輔助函式 |
    | `plugin-sdk/agent-media-payload` | 舊版代理媒體酬載建構器 |
    | `plugin-sdk/conversation-runtime` | 對話/執行緒繫結、配對與已設定繫結輔助函式 |
    | `plugin-sdk/runtime-config-snapshot` | 執行階段設定快照輔助函式 |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組原則解析輔助函式 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照/摘要輔助函式 |
    | `plugin-sdk/channel-config-primitives` | 精簡頻道設定結構描述基本元素 |
    | `plugin-sdk/channel-config-writes` | 頻道設定寫入授權輔助函式 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道 Plugin 前置匯出項 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯/讀取輔助函式 |
    | `plugin-sdk/group-access` | 共用群組存取決策輔助函式 |
    | `plugin-sdk/direct-dm` | 共用直接 DM 驗證/防護輔助函式 |
    | `plugin-sdk/discord` | 供已發布 `@openclaw/discord@2026.3.13` 和已追蹤擁有者相容性使用的已棄用 Discord 相容性 facade；新的 Plugin 應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 供已追蹤擁有者相容性使用的已棄用 Telegram 帳戶解析相容性 facade；新的 Plugin 應使用注入的執行階段輔助函式或通用頻道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 供仍匯入傳送者命令授權的已發布 Lark/Zalo 套件使用的已棄用 Zalo Personal 相容性 facade；新的 Plugin 應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送，以及舊版互動式回覆輔助函式。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 傳入防抖、提及比對、提及原則輔助函式與信封輔助函式的相容性 barrel |
    | `plugin-sdk/channel-inbound-debounce` | 精簡傳入防抖輔助函式 |
    | `plugin-sdk/channel-mention-gating` | 不含較廣泛傳入執行階段介面的精簡提及原則、提及標記與提及文字輔助函式 |
    | `plugin-sdk/channel-envelope` | 精簡傳入信封格式化輔助函式 |
    | `plugin-sdk/channel-location` | 頻道位置情境與格式化輔助函式 |
    | `plugin-sdk/channel-logging` | 傳入丟棄與輸入/確認失敗的頻道記錄輔助函式 |
    | `plugin-sdk/channel-send-result` | 回覆結果類型 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助函式，以及為 Plugin 相容性保留的已棄用原生結構描述輔助函式 |
    | `plugin-sdk/channel-route` | 共用路由正規化、由剖析器驅動的目標解析、執行緒 ID 字串化、去重/壓縮路由鍵、已剖析目標類型，以及路由/目標比較輔助函式 |
    | `plugin-sdk/channel-targets` | 目標剖析輔助函式；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道合約類型 |
    | `plugin-sdk/channel-feedback` | 意見回饋/反應接線 |
    | `plugin-sdk/channel-secret-runtime` | 精簡祕密合約輔助函式，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及祕密目標類型 |
  </Accordion>

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 提供者 facade，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段 facade，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自行託管提供者設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自行託管提供者的設定輔助工具 |
    | `plugin-sdk/cli-backend` | CLI 後端預設值 + watchdog 常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者 Plugin 的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰導覽／寫入設定檔輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-auth-login` | 提供者 Plugin 的共用互動式登入輔助工具 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查找輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、已淘汰的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具，例如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄擴充執行階段 hook，以及用於合約測試的 Plugin 提供者登錄接縫 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP／端點能力輔助工具、提供者 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 狹窄的網頁抓取設定／選擇合約輔助工具，例如 `enablePluginInConfig` 與 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁抓取提供者註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 狹窄的網頁搜尋設定／認證輔助工具，適用於不需要 Plugin 啟用接線的提供者 |
    | `plugin-sdk/provider-web-search-contract` | 狹窄的網頁搜尋設定／認證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍的認證 setter／getter |
    | `plugin-sdk/provider-web-search` | 網頁搜尋提供者註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini schema 清理 + 診斷，以及 xAI 相容性輔助工具，例如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 與類似項目 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者傳輸輔助工具，例如受保護的 fetch、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 導覽設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 程序本機 singleton／map／cache 輔助工具 |
    | `plugin-sdk/group-activation` | 狹窄的群組啟用模式與命令剖析輔助工具 |
  </Accordion>

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助工具，包括動態引數選單格式化、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 與 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准 Gateway 解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用於熱門通道進入點的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助工具；當較狹窄的配接器／Gateway 接縫足夠時，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標 + 帳戶綁定輔助工具 |
    | `plugin-sdk/approval-reply-runtime` | Exec／Plugin 核准回覆 payload 輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准 payload 輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 狹窄的傳入回覆去重重設輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛測試 barrel 的狹窄通道合約測試輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 用於熱門通道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用於通道／Plugin secret 介面的狹窄 secret 合約收集輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於 secret 合約／設定剖析的狹窄 `coerceSecretRef` 與 SecretRef 型別輔助工具 |
    | `plugin-sdk/security-runtime` | 共用信任、DM 閘控、根目錄邊界檔案／路徑輔助工具，包括僅建立寫入、同步／非同步原子檔案替換、同層臨時寫入、跨裝置移動 fallback、私有檔案儲存輔助工具、符號連結父層防護、外部內容、敏感文字遮罩、常數時間 secret 比對，以及 secret 收集輔助工具 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單與私有網路 SSRF 政策輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎設施執行階段介面的狹窄 pinned-dispatcher 輔助工具 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF 保護的 fetch、SSRF 錯誤，以及 SSRF 政策輔助工具 |
    | `plugin-sdk/secret-input` | Secret 輸入剖析輔助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 請求／目標輔助工具，以及原始 websocket／body 強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求 body 大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段、記錄、備份、Plugin 安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試與退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定 facade，用於標準化的設定檔/預設值、CDP URL 解析，以及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段內容註冊與查找輔助工具 |
    | `plugin-sdk/matrix` | 已棄用的 Matrix 相容性 facade，供較舊的第三方頻道套件使用；新的 plugins 應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已棄用的 Mattermost 相容性 facade，供較舊的第三方頻道套件使用；新的 plugins 應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用的 Plugin 命令、hook、HTTP、互動式輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用的 Webhook/內部 hook 管線輔助工具 |
    | `plugin-sdk/lazy-runtime` | 惰性執行階段匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、引數叫用，以及惰性命令群組輔助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 用戶端、事件迴圈就緒的用戶端啟動輔助工具、gateway CLI RPC、gateway 通訊協定錯誤，以及頻道狀態修補輔助工具 |
    | `plugin-sdk/config-types` | 僅型別設定介面，用於 Plugin 設定形狀，例如 `OpenClawConfig` 和頻道/提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段 Plugin 設定查找輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和測試快照設定器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述標準化與重複/衝突檢查，即使 bundled Telegram 合約介面無法使用也適用 |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛的 text-runtime barrel 進行檔案參照自動連結偵測 |
    | `plugin-sdk/approval-runtime` | 執行/Plugin 核准輔助工具、核准能力建構器、驗證/設定檔輔助工具、原生路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用的傳入/回覆執行階段輔助工具、分塊、分派、Heartbeat、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派/完成與對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用的短時間範圍回覆歷史輔助工具與標記，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字/Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存路徑、工作階段金鑰、更新時間，以及儲存變更輔助工具 |
    | `plugin-sdk/cron-store-runtime` | Cron 儲存路徑/載入/儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態/OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/routing` | 路由/工作階段金鑰/帳戶繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用的頻道/帳戶狀態摘要輔助工具、執行階段狀態預設值，以及問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | slug/字串標準化輔助工具 |
    | `plugin-sdk/request-url` | 從類 fetch/request 輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具逾時的命令執行器，提供標準化 stdout/stderr 結果 |
    | `plugin-sdk/param-readers` | 常用工具/CLI 參數讀取器 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取標準化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具與私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀寫輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 輕量 ACP 後端註冊與回覆分派輔助工具，供啟動時載入的 plugins 使用 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不匯入生命週期啟動項目的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡 agent 執行階段設定 schema 原語 |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動與配對權杖輔助工具 |
    | `plugin-sdk/extension-shared` | 共用的被動頻道、狀態與 ambient proxy 輔助原語 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列出輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令 registry/建置/序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 實驗性的受信任 Plugin 介面，供低階 agent harness 使用：harness 型別、active-run steer/abort 輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端結果分類、工具進度格式化/詳細資料輔助工具，以及嘗試結果公用程式 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端點偵測輔助工具 |
    | `plugin-sdk/async-lock-runtime` | 小型執行階段狀態檔案的程序本機非同步鎖輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界非同步工作並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 對外待處理傳遞清空輔助工具 |
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
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、proxy、EnvHttpProxyAgent 選項，以及固定 lookup 輔助工具 |
    | `plugin-sdk/runtime-fetch` | 感知 dispatcher 的執行階段 fetch，不匯入 proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | 有界 response-body 讀取器，不使用廣泛的媒體執行階段介面 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存輔助工具，不含廣泛的設定寫入/維護匯入 |
    | `plugin-sdk/context-visibility-runtime` | 內容可見性解析與補充內容篩選，不匯入廣泛的設定/安全性 |
    | `plugin-sdk/string-coerce-runtime` | 精簡的原始記錄/字串強制轉換與標準化輔助工具，不匯入 Markdown/記錄 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機標準化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | Agent 目錄/身分/工作區輔助工具，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 和已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具、以 ffprobe 支援的影片尺寸探測，以及媒體酬載建構器 |
    | `plugin-sdk/media-store` | 精簡媒體儲存輔助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選項目選擇，以及缺少模型的訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，加上面向提供者的影像/音訊輔助匯出 |
    | `plugin-sdk/text-runtime` | 共用文字/Markdown/記錄輔助工具，例如移除助理可見文字、Markdown 轉譯/分塊/表格輔助工具、遮蔽輔助工具、指令標籤輔助工具，以及安全文字工具 |
    | `plugin-sdk/text-chunking` | 外送文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音提供者型別，加上面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器，以及語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者型別、登錄、指令、正規化，以及語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別與登錄輔助工具 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，加上影像資產/資料 URL 輔助工具，以及 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證，以及登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助工具、提供者查詢，以及模型參照剖析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助工具、提供者查詢，以及模型參照剖析 |
    | `plugin-sdk/webhook-targets` | Webhook 目標登錄與路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路徑正規化輔助工具 |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 為 plugin SDK 使用者重新匯出的 `zod` |
    | `plugin-sdk/testing` | 供舊版 plugin 測試使用的廣泛相容性 barrel。新的 extension 測試應改為匯入聚焦的 SDK 子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 最小 `createTestPluginApi` 輔助工具，用於直接 plugin 註冊單元測試，無需匯入 repo 測試輔助 bridge |
    | `plugin-sdk/agent-runtime-test-contracts` | 原生代理 runtime 介面卡合約 fixture，用於驗證、傳遞、fallback、工具 hook、提示覆蓋、schema，以及 transcript 投影測試 |
    | `plugin-sdk/channel-test-helpers` | 面向 channel 的測試輔助工具，用於通用動作/設定/狀態合約、目錄斷言、帳號啟動生命週期、send-config threading、runtime mock、狀態問題、外送傳遞，以及 hook 註冊 |
    | `plugin-sdk/channel-target-testing` | channel 測試的共用目標解析錯誤案例套件 |
    | `plugin-sdk/plugin-test-contracts` | Plugin 套件、註冊、公用 artifact、直接匯入、runtime API，以及匯入副作用合約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 提供者 runtime、驗證、探索、onboard、catalog、wizard、媒體功能、重播政策、即時 STT live-audio、web-search/fetch，以及串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 選用的 Vitest HTTP/驗證 mock，供測試 `plugin-sdk/provider-http` 的提供者測試使用 |
    | `plugin-sdk/test-fixtures` | 通用 CLI runtime 擷取、sandbox context、skill writer、agent-message、system-event、module reload、bundled plugin path、terminal-text、chunking、auth-token，以及 typed-case fixture |
    | `plugin-sdk/test-node-mocks` | 聚焦的 Node 內建 mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內部 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 為 manager/config/file/CLI 輔助工具提供的 bundled memory-core 輔助表面 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶體索引/搜尋 runtime facade |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體 host foundation engine 匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體 host embedding 合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體 host QMD engine 匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶體 host storage engine 匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶體 host multimodal 輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶體 host query 輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶體 host secret 輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 記憶體 host event journal 輔助工具 |
    | `plugin-sdk/memory-core-host-status` | 記憶體 host status 輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體 host CLI runtime 輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶體 host core runtime 輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶體 host file/runtime 輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶體 host core runtime 輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶體 host event journal 輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | 記憶體 host file/runtime 輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 供記憶體相鄰 plugin 使用的共用受管理 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於 search-manager 存取的 Active Memory runtime facade |
    | `plugin-sdk/memory-host-status` | 記憶體 host status 輔助工具的供應商中立別名 |
  </Accordion>

  <Accordion title="保留的 bundled-helper 子路徑">
    目前沒有保留的 bundled-helper SDK 子路徑。擁有者專用的
    輔助工具位於所屬的 plugin 套件內，而可重複使用的 host 合約
    會使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相關

- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 plugins](/zh-TW/plugins/building-plugins)

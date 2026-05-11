---
read_when:
    - 為 Plugin 匯入選擇正確的 plugin-sdk 子路徑
    - 稽核 bundled-plugin 子路徑與輔助介面
summary: Plugin SDK 子路徑目錄：哪些匯入項目位於何處，依區域分組
title: Plugin SDK 子路徑
x-i18n:
    generated_at: "2026-05-11T20:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin 軟體開發套件以 `openclaw/plugin-sdk/` 底下的一組精簡公開子路徑形式公開。本頁依用途分組列出常用子路徑。產生的編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出是在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的 repo 本機測試/內部子路徑後的公開子集。維護者可以使用 `pnpm plugin-sdk:surface` 稽核公開匯出數量，並使用 `pnpm plugins:boundary-report:summary` 稽核有效的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是作為休眠的相容性債務留在公開軟體開發套件中。

若要查看 Plugin 編寫指南，請參閱 [Plugin 軟體開發套件概覽](/zh-TW/plugins/sdk-overview)。

## Plugin 進入點

| 子路徑                        | 主要匯出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具，以及 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                                              |

### 已棄用的相容性和測試輔助工具

這些子路徑仍然是較舊 Plugin 和 OpenClaw 測試套件的套件匯出，但新程式碼不應再從它們新增匯入：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`、`channel-runtime`、`compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod`。在新的 Plugin 程式碼中，請直接從 `zod` 匯入 `zod`。`plugin-test-runtime` 仍然是有效且聚焦的測試輔助子路徑。

### 已棄用的未使用公開子路徑

這些公開子路徑已存在至少一個月，且目前沒有任何內建 Plugin 的正式環境匯入。它們仍可為相容性而匯入，但新的 Plugin 程式碼應改用聚焦且正在使用的軟體開發套件子路徑：`agent-config-primitives`、`channel-config-schema-legacy`、`channel-reply-pipeline`、`channel-runtime`、`channel-secret-runtime`、`command-auth`、`compat`、`config-runtime`、`config-schema`、`discord`、`group-access`、`infra-runtime`、`matrix`、`mattermost`、`media-generation-runtime-shared`、`memory-core-engine-runtime`、`memory-core-host-multimodal`、`memory-core-host-query`、`music-generation-core`、`self-hosted-provider-setup`、`telegram-account`、`telegram-command-config` 和 `zalouser`。

### 已棄用的少用公開子路徑

目前只由一或兩個內建 Plugin 擁有者使用的公開子路徑，也已對新的 Plugin 程式碼棄用。它們仍作為相容性的套件匯出保留，但新程式碼應優先使用主動共享的軟體開發套件介面或 Plugin 擁有的套件 API。維護者會在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中追蹤確切集合，並以 `pnpm plugin-sdk:surface` 追蹤目前預算。

### 已棄用的寬泛 barrel

這些寬泛的重新匯出 barrel 仍可供 OpenClaw 原始碼和相容性檢查建置，但新程式碼應優先使用聚焦的軟體開發套件子路徑：`agent-runtime`、`channel-lifecycle`、`channel-runtime`、`cli-runtime`、`compat`、`config-types`、`conversation-runtime`、`hook-runtime`、`infra-runtime`、`media-runtime`、`plugin-runtime`、`security-runtime` 和 `text-runtime`。`channel-runtime`、`compat`、`config-types`、`infra-runtime` 和 `text-runtime` 僅為向後相容而保留為套件匯出；請改用聚焦的 channel/runtime 子路徑、`config-contracts`、`string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core`。

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod 結構描述匯出 (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Plugin 擁有的結構描述所用的快取 JSON Schema 驗證協助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，加上 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈協助工具、允許清單提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定/動作閘門協助工具、預設帳號後援協助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化協助工具 |
    | `plugin-sdk/account-resolution` | 帳號查詢 + 預設後援協助工具 |
    | `plugin-sdk/account-helpers` | 精簡帳號清單/帳號動作協助工具 |
    | `plugin-sdk/access-groups` | 存取群組允許清單剖析與已遮蔽群組診斷協助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 舊版回覆管線協助工具。新的通道回覆管線程式碼應使用 `plugin-sdk/channel-message` 中的 `createChannelMessageReplyPipeline` 和 `resolveChannelMessageSourceReplyDeliveryMode`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用通道設定結構描述基礎項，加上 Zod 與直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供受維護的內建 Plugin 使用的內建 OpenClaw 通道設定結構描述 |
    | `plugin-sdk/channel-config-schema-legacy` | 內建通道設定結構描述的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂命令正規化/驗證協助工具，含內建合約後援 |
    | `plugin-sdk/command-gating` | 精簡命令授權閘門協助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已棄用的低階通道入口相容性門面。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性高階通道入口執行階段解析器與路由事實建構器，供已遷移的通道接收路徑使用。優先使用此項，而非在每個 Plugin 中組裝有效允許清單、命令允許清單與舊版投影。請參閱[通道入口 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`，以及舊版草稿串流生命週期協助工具。新的預覽定稿程式碼應使用 `plugin-sdk/channel-message`。 |
    | `plugin-sdk/channel-message` | 輕量訊息生命週期合約協助工具，例如 `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`、耐久最終能力衍生、傳送/收件/副作用能力的能力證明協助工具、`MessageReceiveContext`、接收確認政策證明、`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`、即時預覽與即時定稿器能力證明、耐久復原狀態、`RenderedMessageBatch`、訊息收件類型，以及收件 ID 協助工具。請參閱[通道訊息 API](/zh-TW/plugins/sdk-channel-message)。舊版回覆分派門面僅作為已棄用相容性使用。 |
    | `plugin-sdk/channel-message-runtime` | 可能載入對外遞送的執行階段遞送協助工具，包括 `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` 和 `withDurableMessageSendContext`。已棄用的回覆分派橋接仍可匯入，但僅供相容性分派器使用。請從監控/傳送執行階段模組使用，不要從熱路徑 Plugin 啟動檔案使用。 |
    | `plugin-sdk/inbound-envelope` | 共用入站路由 + 信封建構器協助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 舊版共用入站記錄與分派協助工具、可見/最終分派述詞，以及為已準備通道分派器提供相容性的已棄用 `deliverDurableInboundReplyPayload`。新的通道接收/分派程式碼應從 `plugin-sdk/channel-message-runtime` 匯入執行階段生命週期協助工具。 |
    | `plugin-sdk/messaging-targets` | 目標剖析/比對協助工具 |
    | `plugin-sdk/outbound-media` | 共用對外媒體載入協助工具 |
    | `plugin-sdk/outbound-send-deps` | 通道配接器的輕量對外傳送相依項查詢 |
    | `plugin-sdk/outbound-runtime` | 對外身分、傳送委派、工作階段、格式化與酬載規劃協助工具。直接遞送協助工具（例如 `deliverOutboundPayloads`）是已棄用的相容性基底；新的傳送路徑請使用 `plugin-sdk/channel-message-runtime`。 |
    | `plugin-sdk/poll-runtime` | 精簡輪詢正規化協助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結生命週期與配接器協助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版代理媒體酬載建構器 |
    | `plugin-sdk/conversation-runtime` | 對話/執行緒繫結、配對與已設定繫結協助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 執行階段設定快照協助工具 |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析協助工具 |
    | `plugin-sdk/channel-status` | 共用通道狀態快照/摘要協助工具 |
    | `plugin-sdk/channel-config-primitives` | 精簡通道設定結構描述基礎項 |
    | `plugin-sdk/channel-config-writes` | 通道設定寫入授權協助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用通道 Plugin 前置匯出 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯/讀取協助工具 |
    | `plugin-sdk/group-access` | 共用群組存取決策協助工具 |
    | `plugin-sdk/direct-dm` | 共用直接私訊驗證/防護協助工具 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性門面，用於已發布的 `@openclaw/discord@2026.3.13` 與受追蹤擁有者相容性；新的 Plugin 應使用通用通道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram 帳號解析相容性門面，用於受追蹤擁有者相容性；新的 Plugin 應使用注入的執行階段協助工具或通用通道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已棄用的 Zalo Personal 相容性門面，用於仍匯入傳送者命令授權的已發布 Lark/Zalo 套件；新的 Plugin 應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送與舊版互動式回覆協助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站防抖、提及比對、提及政策協助工具與信封協助工具的相容性彙整匯出 |
    | `plugin-sdk/channel-inbound-debounce` | 精簡入站防抖協助工具 |
    | `plugin-sdk/channel-mention-gating` | 不含較廣泛入站執行階段介面的精簡提及政策、提及標記與提及文字協助工具 |
    | `plugin-sdk/channel-envelope` | 精簡入站信封格式化協助工具 |
    | `plugin-sdk/channel-location` | 通道位置脈絡與格式化協助工具 |
    | `plugin-sdk/channel-logging` | 入站丟棄與輸入/確認失敗的通道記錄協助工具 |
    | `plugin-sdk/channel-send-result` | 回覆結果類型 |
    | `plugin-sdk/channel-actions` | 通道訊息動作協助工具，加上為 Plugin 相容性保留的已棄用原生結構描述協助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、剖析器驅動的目標解析、執行緒 ID 字串化、路由鍵去重/壓縮、已剖析目標類型，以及路由/目標比較協助工具 |
    | `plugin-sdk/channel-targets` | 目標剖析協助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 通道合約類型 |
    | `plugin-sdk/channel-feedback` | 意見回饋/反應接線 |
    | `plugin-sdk/channel-secret-runtime` | 精簡秘密合約協助工具，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及秘密目標類型 |
  </Accordion>

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 提供者門面，用於設定、目錄探索和執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段門面，用於本機伺服器預設值、模型探索、請求標頭和已載入模型輔助程式 |
    | `plugin-sdk/provider-setup` | 精選的本機／自託管提供者設定輔助程式 |
    | `plugin-sdk/self-hosted-provider-setup` | 專注於 OpenAI 相容自託管提供者的設定輔助程式 |
    | `plugin-sdk/cli-backend` | CLI 後端預設值 + watchdog 常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者 Plugin 的執行階段 API 金鑰解析輔助程式 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰導引／設定檔寫入輔助程式，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查找輔助程式 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、提供者端點輔助程式，以及共用模型 ID 正規化輔助程式 |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄擴充執行階段鉤子，以及用於合約測試的 Plugin 提供者登錄接縫 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP／端點能力輔助程式、提供者 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助程式 |
    | `plugin-sdk/provider-web-fetch-contract` | 狹窄的網頁擷取設定／選取合約輔助程式，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取提供者註冊／快取輔助程式 |
    | `plugin-sdk/provider-web-search-config-contract` | 狹窄的網頁搜尋設定／憑證輔助程式，適用於不需要 Plugin 啟用接線的提供者 |
    | `plugin-sdk/provider-web-search-contract` | 狹窄的網頁搜尋設定／憑證合約輔助程式，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定範圍的憑證 setter／getter |
    | `plugin-sdk/provider-web-search` | 網頁搜尋提供者註冊／快取／執行階段輔助程式 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 Gemini 結構描述清理 + 診斷 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及類似項目 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助程式 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者傳輸輔助程式，例如受保護的擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 導引設定修補輔助程式 |
    | `plugin-sdk/global-singleton` | 程序本機 singleton／map／cache 輔助程式 |
    | `plugin-sdk/group-activation` | 狹窄的群組啟用模式與命令解析輔助程式 |
  </Accordion>

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助程式，包含動態引數選單格式化、傳送者授權輔助程式 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同一聊天的動作驗證輔助程式 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助程式 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准 Gateway 解析輔助程式 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用於熱門通道進入點的輕量原生核准配接器載入輔助程式 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助程式；當較狹窄的配接器／Gateway 接縫足夠時，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標 + 帳戶繫結輔助程式 |
    | `plugin-sdk/approval-reply-runtime` | Exec／Plugin 核准回覆酬載輔助程式 |
    | `plugin-sdk/approval-runtime` | Exec／Plugin 核准酬載輔助程式、原生核准路由／執行階段輔助程式，以及結構化核准顯示輔助程式，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 狹窄的傳入回覆去重設重設輔助程式 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛測試 barrel 的狹窄通道合約測試輔助程式 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助程式 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助程式 |
    | `plugin-sdk/command-primitives-runtime` | 用於熱門通道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助程式 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用於通道／Plugin 祕密介面的狹窄祕密合約收集輔助程式 |
    | `plugin-sdk/secret-ref-runtime` | 用於祕密合約／設定解析的狹窄 `coerceSecretRef` 和 SecretRef 型別輔助程式 |
    | `plugin-sdk/security-runtime` | 共用信任、DM 閘控、根目錄限定的檔案／路徑輔助程式，包含僅建立寫入、同步／非同步原子檔案取代、同層暫存寫入、跨裝置移動後援、私有檔案儲存輔助程式、符號連結父層防護、外部內容、敏感文字遮蔽、常數時間祕密比較，以及祕密收集輔助程式 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單與私有網路 SSRF 政策輔助程式 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎架構執行階段介面的狹窄固定 dispatcher 輔助程式 |
    | `plugin-sdk/ssrf-runtime` | 固定 dispatcher、受 SSRF 保護的擷取、SSRF 錯誤，以及 SSRF 政策輔助程式 |
    | `plugin-sdk/secret-input` | 祕密輸入解析輔助程式 |
    | `plugin-sdk/webhook-ingress` | Webhook 請求／目標輔助程式，以及原始 websocket／body 強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助程式 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段/記錄/備份/Plugin 安裝輔助程式 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試與退避輔助程式 |
    | `plugin-sdk/browser-config` | 受支援的瀏覽器設定外觀介面，用於正規化設定檔/預設值、CDP URL 剖析，以及瀏覽器控制驗證輔助程式 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段情境註冊與查找輔助程式 |
    | `plugin-sdk/matrix` | 已棄用的 Matrix 相容性外觀介面，供較舊的第三方頻道套件使用；新 plugins 應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已棄用的 Mattermost 相容性外觀介面，供較舊的第三方頻道套件使用；新 plugins 應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用的 Plugin 命令/hook/http/互動式輔助程式 |
    | `plugin-sdk/hook-runtime` | 共用的 Webhook/內部 hook 管線輔助程式 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入/繫結輔助程式，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 與 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助程式 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、引數叫用，以及延遲命令群組輔助程式 |
    | `plugin-sdk/gateway-runtime` | Gateway 用戶端、事件迴圈就緒的用戶端啟動輔助程式、Gateway CLI RPC、Gateway 協定錯誤，以及頻道狀態修補輔助程式 |
    | `plugin-sdk/config-contracts` | 聚焦於型別的設定介面，用於 Plugin 設定形狀，例如 `OpenClawConfig` 與頻道/供應商設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段 Plugin 設定查找輔助程式，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 與 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助程式，例如 `mutateConfigFile`、`replaceConfigFile` 與 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助程式，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 與測試快照設定器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述正規化與重複/衝突檢查，即使隨附的 Telegram contract 介面無法使用亦可 |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛文字 barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/approval-runtime` | Exec/Plugin 核准輔助程式、核准能力建構器、驗證/設定檔輔助程式、原生路由/執行階段輔助程式，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用的入站/回覆執行階段輔助程式、分塊、分派、Heartbeat、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派/完成與對話標籤輔助程式 |
    | `plugin-sdk/reply-history` | 共用的短視窗回覆歷史輔助程式與標記，例如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 與 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字/Markdown 分塊輔助程式 |
    | `plugin-sdk/session-store-runtime` | 工作階段儲存路徑、工作階段鍵、更新時間與儲存變更輔助程式 |
    | `plugin-sdk/cron-store-runtime` | Cron 儲存路徑/載入/儲存輔助程式 |
    | `plugin-sdk/state-paths` | State/OAuth 目錄路徑輔助程式 |
    | `plugin-sdk/routing` | 路由/工作階段鍵/帳號繫結輔助程式，例如 `resolveAgentRoute`、`buildAgentSessionKey` 與 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用的頻道/帳號狀態摘要輔助程式、執行階段狀態預設值與 issue 中繼資料輔助程式 |
    | `plugin-sdk/target-resolver-runtime` | 共用的目標解析器輔助程式 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串正規化輔助程式 |
    | `plugin-sdk/request-url` | 從 fetch/request 類輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具備正規化 stdout/stderr 結果的計時命令執行器 |
    | `plugin-sdk/param-readers` | 通用工具/CLI 參數讀取器 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/temp-path` | 共用的暫存下載路徑輔助程式與私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助程式 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助程式 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助程式，例如 `applyModelOverrideToSessionEntry` 與 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 供應商設定解析輔助程式 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取/寫入輔助程式 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助程式 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助程式 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆分派輔助程式 |
    | `plugin-sdk/acp-runtime-backend` | 供啟動時載入的 plugins 使用的輕量 ACP 後端註冊與回覆分派輔助程式 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡的 Agent 執行階段設定結構描述基元 |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助程式 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動與配對權杖輔助程式 |
    | `plugin-sdk/extension-shared` | 共用的被動頻道、狀態與環境代理輔助基元 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/供應商回覆輔助程式 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令清單輔助程式 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄/建構/序列化輔助程式 |
    | `plugin-sdk/agent-harness` | 實驗性的受信任 Plugin 介面，用於低階 Agent harness：harness 型別、作用中執行 steer/abort 輔助程式、OpenClaw 工具橋接輔助程式、執行階段計畫工具政策輔助程式、終端結果分類、工具進度格式化/詳細資料輔助程式，以及嘗試結果工具程式 |
    | `plugin-sdk/provider-zai-endpoint` | 已棄用的 Z.AI 供應商擁有端點偵測外觀介面；請使用 Z.AI Plugin 公用 API |
    | `plugin-sdk/async-lock-runtime` | 小型執行階段狀態檔案的程序本機非同步鎖輔助程式 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助程式 |
    | `plugin-sdk/concurrency-runtime` | 有界非同步任務並行輔助程式 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助程式 |
    | `plugin-sdk/delivery-queue-runtime` | 輸出待處理遞送排空輔助程式 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助程式 |
    | `plugin-sdk/heartbeat-runtime` | Heartbeat 喚醒、事件與可見性輔助程式 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助程式 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖/UUID 輔助程式 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助程式 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助程式 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上方聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助程式 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與追蹤情境輔助程式 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助程式、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、proxy、EnvHttpProxyAgent 選項與固定 lookup 輔助程式 |
    | `plugin-sdk/runtime-fetch` | 不含 proxy/guarded-fetch 匯入、具備 dispatcher 感知能力的執行階段 fetch |
    | `plugin-sdk/response-limit-runtime` | 不透過廣泛媒體執行階段介面的有界回應本文讀取器 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/session-store-runtime` | 不含廣泛設定寫入/維護匯入的工作階段儲存輔助程式 |
    | `plugin-sdk/context-visibility-runtime` | 不含廣泛設定/安全性匯入的情境可見性解析與補充情境篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不含 markdown/記錄匯入的精簡基元記錄/字串強制轉換與正規化輔助程式 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機正規化輔助程式 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助程式 |
    | `plugin-sdk/agent-runtime` | Agent 目錄/身分/工作區輔助程式，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 與已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/directory-runtime` | 以設定為基礎的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體 payload 建構器 |
    | `plugin-sdk/media-mime` | 精準 MIME 正規化、檔案副檔名對應、MIME 偵測，以及媒體類型輔助工具 |
    | `plugin-sdk/media-store` | 精準媒體儲存輔助工具，例如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選項選取，以及缺少模型訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解供應器型別，以及面向供應器的影像/音訊/結構化擷取輔助匯出 |
    | `plugin-sdk/text-chunking` | 文字與 markdown 分塊/轉譯輔助工具、markdown 表格轉換、directive-tag 移除，以及安全文字工具 |
    | `plugin-sdk/text-chunking` | 外送文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音供應器型別，以及面向供應器的指令、登錄表、驗證、OpenAI 相容 TTS 建構器與語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用語音供應器型別、登錄表、指令、正規化，以及語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄供應器型別、登錄表輔助工具，以及共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音供應器型別與登錄表輔助工具 |
    | `plugin-sdk/image-generation` | 影像生成供應器型別，以及影像資產/data URL 輔助工具與 OpenAI 相容影像供應器建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證與登錄表輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成供應器/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助工具、供應器查找，以及 model-ref 解析 |
    | `plugin-sdk/video-generation` | 影片生成供應器/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助工具、供應器查找，以及 model-ref 解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目標登錄表與路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | 已棄用的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 供舊版 OpenClaw 測試使用的儲存庫本地已棄用相容性彙整匯出。新的儲存庫測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 儲存庫本地的最小 `createTestPluginApi` 輔助工具，供不匯入儲存庫測試輔助橋接的直接 Plugin 註冊單元測試使用 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫本地原生代理執行階段 adapter 契約測試夾具，用於驗證、遞送、fallback、tool-hook、prompt-overlay、schema 與 transcript 投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫本地面向頻道的測試輔助工具，用於通用動作/設定/狀態契約、目錄斷言、帳號啟動生命週期、send-config 執行緒處理、執行階段 mock、狀態問題、外送遞送，以及 hook 註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫本地共用目標解析錯誤案例套件，供頻道測試使用 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫本地 Plugin 套件、註冊、公開成品、直接匯入、執行階段 API 與匯入副作用契約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫本地供應器執行階段、驗證、探索、onboard、目錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網頁搜尋/擷取，以及串流契約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 儲存庫本地選用 Vitest HTTP/驗證 mock，供測試 `plugin-sdk/provider-http` 的供應器測試使用 |
    | `plugin-sdk/test-fixtures` | 儲存庫本地通用 CLI 執行階段擷取、沙箱情境、skill 寫入器、代理訊息、系統事件、模組重新載入、隨附 Plugin 路徑、終端文字、分塊、驗證 token，以及具型別案例測試夾具 |
    | `plugin-sdk/test-node-mocks` | 儲存庫本地聚焦的 Node 內建 mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內部 |
  </Accordion>

  <Accordion title="記憶子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 隨附的 memory-core 輔助介面，供管理器/設定/檔案/CLI 輔助工具使用 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶索引/搜尋執行階段外觀介面 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機 foundation 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機 embedding 契約、登錄表存取、本機供應器，以及通用批次/遠端輔助工具 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶主機秘密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機 CLI 執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶主機事件日誌輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 供記憶相鄰 Plugin 使用的共用受管理 markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於 search-manager 存取的 Active Memory 執行階段外觀介面 |
    | `plugin-sdk/memory-host-status` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的隨附輔助工具子路徑">
    目前沒有保留的隨附輔助工具 SDK 子路徑。擁有者專屬
    輔助工具位於其擁有的 Plugin 套件內，而可重用的主機契約
    使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、
    `plugin-sdk/security-runtime` 與 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相關內容

- [Plugin SDK 概觀](/zh-TW/plugins/sdk-overview)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)

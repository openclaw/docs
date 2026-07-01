---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核內建外掛子路徑與輔助介面
summary: 外掛 SDK 子路徑目錄：依領域分組，說明哪些匯入位於何處
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-01T07:51:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 以一組位於 `openclaw/plugin-sdk/` 底下的窄範圍公開子路徑公開。本頁依用途分組列出常用子路徑。產生的編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出是在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的儲存庫本機測試／內部子路徑後的公開子集。維護者可以使用 `pnpm plugin-sdk:surface` 稽核公開匯出數量，並使用 `pnpm plugins:boundary-report:summary` 稽核作用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是以休眠相容性負債的形式留在公開 SDK 中。

外掛撰寫指南請參閱[外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                        | 主要匯出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮罩輔助工具，以及 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                                              |
| `plugin-sdk/health`            | 供內建健康狀態消費者使用的 Doctor 健康檢查註冊、偵測、修復、選取、嚴重性和發現項目型別                                               |

### 已棄用的相容性與測試輔助工具

已棄用的子路徑會繼續匯出給較舊的外掛使用，但新程式碼應使用下方聚焦的 SDK 子路徑。維護中的清單是 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕內建生產環境程式碼從其中匯入。像 `compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod` 這類廣泛 barrel 僅供相容性使用。請直接從 `zod` 匯入 `zod`。

OpenClaw 以 Vitest 為基礎的測試輔助子路徑僅供儲存庫本機使用，且不再是套件匯出：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks` 和 `testing`。

### 保留的內建外掛輔助子路徑

這些子路徑是外掛擁有的相容性表面，供其所屬的內建外掛使用，而不是一般 SDK API：`plugin-sdk/codex-mcp-projection` 和 `plugin-sdk/codex-native-task-runtime`。跨擁有者的擴充匯入會受到套件契約防護機制封鎖。

<AccordionGroup>
  <Accordion title="頻道子路徑">
    | 子路徑 | 主要匯出項 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根層 `openclaw.json` Zod 架構匯出項（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | 用於外掛擁有之架構的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定轉譯器、允許清單提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定/動作閘門輔助工具、預設帳號後援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查詢 + 預設後援輔助工具 |
    | `plugin-sdk/account-helpers` | 精簡的帳號清單/帳號動作輔助工具 |
    | `plugin-sdk/access-groups` | 存取群組允許清單解析與已遮蔽群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定架構原始項，加上 Zod 與直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供受維護之內建外掛使用的內建 OpenClaw 頻道設定架構 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準內建/官方聊天頻道 ID，加上格式化器標籤/別名，供需要辨識帶有信封前綴文字、但不想硬編碼自身表格的外掛使用。 |
    | `plugin-sdk/channel-config-schema-legacy` | 已棄用的內建頻道設定架構相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂命令正規化/驗證輔助工具，具備內建合約後援 |
    | `plugin-sdk/command-gating` | 精簡的命令授權閘門輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已棄用的低階頻道入站相容性門面。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性的高階頻道入站執行階段解析器，以及供已遷移頻道接收路徑使用的路由事實建構器。請優先使用此項，而不是在每個外掛中組裝有效允許清單、命令允許清單與舊版投影。請參閱[頻道入站 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期合約，以及回覆管線選項、收據、即時預覽/串流、生命週期輔助工具、出站身分、承載規劃、耐久傳送與訊息傳送情境輔助工具。請參閱[頻道出站 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，加上舊版回覆分派門面。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，加上舊版回覆分派門面。 |
    | `plugin-sdk/inbound-envelope` | 共用入站路由 + 信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性門面。入站執行器與分派述詞請使用 `plugin-sdk/channel-inbound`，訊息遞送輔助工具請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標解析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共用出站媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 精簡的投票正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 對話串綁定生命週期與轉接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版代理程式媒體承載建構器 |
    | `plugin-sdk/conversation-runtime` | 對話/對話串綁定、配對與已設定綁定輔助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 執行階段設定快照輔助工具 |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照/摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 精簡的頻道設定架構原始項 |
    | `plugin-sdk/channel-config-writes` | 頻道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道外掛前置匯出項 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯/讀取輔助工具 |
    | `plugin-sdk/group-access` | 共用群組存取決策輔助工具 |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 精簡的直接私訊加密前防護政策輔助工具 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性門面，供已發布的 `@openclaw/discord@2026.3.13` 與受追蹤的擁有者相容性使用；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram 帳號解析相容性門面，供受追蹤的擁有者相容性使用；新外掛應使用注入的執行階段輔助工具或通用頻道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已棄用的 Zalo Personal 相容性門面，供仍匯入傳送者命令授權的已發布 Lark/Zalo 套件使用；新外掛應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送與舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 共用入站輔助工具，用於事件分類、情境建構、格式化、根目錄、去抖、提及比對、提及政策與入站記錄 |
    | `plugin-sdk/channel-inbound-debounce` | 精簡的入站去抖輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 精簡的提及政策、提及標記與提及文字輔助工具，不包含較廣泛的入站執行階段介面 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果類型 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助工具，加上為外掛相容性保留的已棄用原生架構輔助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、由解析器驅動的目標解析、對話串 ID 字串化、去重/壓縮路由鍵、已解析目標類型，以及路由/目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 目標解析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道合約類型 |
    | `plugin-sdk/channel-feedback` | 回饋/反應接線 |
    | `plugin-sdk/channel-secret-runtime` | 精簡的秘密合約輔助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 與秘密目標類型 |
  </Accordion>

已棄用的頻道輔助工具家族僅為已發布外掛
相容性而保留可用。移除計畫是：在外部外掛
遷移窗口期間保留它們，讓 repo/內建外掛維持使用 `channel-inbound` 和
`channel-outbound`，然後在下一次主要
SDK 清理中移除相容性子路徑。這適用於舊版頻道 message/runtime、頻道
streaming、direct-DM access、inbound helper splinter、reply-options
以及 pairing-path 家族。

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 提供者 facade，用於設定、型錄探索和執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段 facade，用於本機伺服器預設值、模型探索、請求標頭和已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自行託管提供者設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自行託管提供者的設定輔助工具 |
    | `plugin-sdk/cli-backend` | 命令列介面後端預設值 + 看門狗常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者外掛的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-oauth-runtime` | 通用提供者 OAuth 回呼型別、回呼頁面轉譯、PKCE／狀態輔助工具、授權輸入解析、權杖到期輔助工具和中止輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰導入／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查詢輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助工具、已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重播政策建構器、提供者端點輔助工具和共享模型 ID 正規化輔助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用於受保護 `/models` 風格探索的即時提供者模型型錄輔助工具：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取和靜態後援 |
    | `plugin-sdk/provider-catalog-runtime` | 提供者型錄擴充執行階段掛鉤，以及用於合約測試的外掛提供者登錄銜接點 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP／端點能力輔助工具、提供者 HTTP 錯誤和音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 狹義的網頁擷取設定／選擇合約輔助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取提供者註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要外掛啟用接線的提供者的狹義網頁搜尋設定／憑證輔助工具 |
    | `plugin-sdk/provider-web-search-contract` | 狹義的網頁搜尋設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定範圍的憑證 setter／getter |
    | `plugin-sdk/provider-web-search` | 網頁搜尋提供者註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/embedding-providers` | 一般嵌入提供者型別和讀取輔助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊提供者，因此會強制執行 manifest 所有權 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 綱要清理 + 診斷 |
    | `plugin-sdk/provider-usage` | 提供者用量快照型別、共享用量擷取輔助工具，以及提供者擷取器，例如 `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別、純文字工具呼叫相容性，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
    | `plugin-sdk/provider-stream-shared` | 公開共享提供者串流包裝器輔助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic/DeepSeek/OpenAI 相容串流工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者傳輸輔助工具，例如受保護的 fetch、工具結果文字擷取、傳輸訊息轉換和可寫入傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 導入設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 程序本機 singleton／map／cache 輔助工具 |
    | `plugin-sdk/group-activation` | 狹義的群組啟用模式和命令解析輔助工具 |
  </Accordion>

提供者用量快照通常會回報一個或多個配額 `windows`，每個都有
標籤、已使用百分比，以及選用的重設時間。若提供者公開的是餘額或
帳戶狀態文字，而不是可重設的配額窗口，則應回傳
`summary` 搭配空的 `windows` 陣列，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；只有在
用量端點失敗或沒有回傳可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令登錄輔助工具，包括動態引數選單格式化、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析和同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享核准閘道解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用於熱通道進入點的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 更廣泛的核准處理器執行階段輔助工具；當較狹義的配接器／閘道銜接點已足夠時，優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶綁定、路由閘門、轉送後援，以及本機原生 exec 提示抑制輔助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼核准反應繫結、反應提示酬載、反應目標儲存區，以及本機原生 exec 提示抑制的相容性匯出 |
    | `plugin-sdk/approval-reply-runtime` | Exec／外掛核准回覆酬載輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／外掛核准酬載輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 狹義的入站回覆去重重設輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛測試 barrel 的狹義通道合約測試輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共享命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 用於熱通道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化和命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用於通道／外掛 secret 介面的狹義 secret 合約收集輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於 secret 合約／設定解析的狹義 `coerceSecretRef` 和 SecretRef 型別輔助工具 |
    | `plugin-sdk/secret-provider-integration` | 僅型別的 SecretRef 提供者整合 manifest，以及供發布外部 secret 提供者預設集的外掛使用的預設合約 |
    | `plugin-sdk/security-runtime` | 共享信任、DM 閘門、根目錄界定的檔案／路徑輔助工具，包括僅建立寫入、同步／非同步原子檔案取代、同層暫存寫入、跨裝置移動後援、私有檔案儲存輔助工具、符號連結父層防護、外部內容、敏感文字遮蔽、常數時間 secret 比較，以及 secret 收集輔助工具 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單和私有網路 SSRF 政策輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎架構執行階段介面的狹義 pinned-dispatcher 輔助工具 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF 保護的 fetch、SSRF 錯誤和 SSRF 政策輔助工具 |
    | `plugin-sdk/secret-input` | Secret 輸入解析輔助工具 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子請求／目標輔助工具，以及原始 websocket／body 強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段、記錄、備份、外掛安裝輔助函式 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段 env、logger、逾時、重試與退避輔助函式 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定門面，用於正規化設定檔/預設值、CDP URL 解析，以及瀏覽器控制驗證輔助函式 |
    | `plugin-sdk/agent-harness-task-runtime` | 通用工作生命週期與完成交付輔助函式，供使用主機核發工作範圍的 harness-backed 代理使用 |
    | `plugin-sdk/codex-mcp-projection` | 保留的內建 Codex 輔助函式，用於將使用者 MCP 伺服器設定投影到 Codex thread config；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 私有內建 Codex 輔助函式，用於原生工作鏡像/執行階段接線；不供第三方外掛使用 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段內容註冊與查找輔助函式 |
    | `plugin-sdk/matrix` | 已淘汰的 Matrix 相容性門面，供較舊的第三方頻道套件使用；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已淘汰的 Mattermost 相容性門面，供較舊的第三方頻道套件使用；新外掛應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用外掛命令/hook/http/互動式輔助函式 |
    | `plugin-sdk/hook-runtime` | 共用網路鉤子/內部 hook 管線輔助函式 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入/繫結輔助函式，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助函式 |
    | `plugin-sdk/cli-runtime` | 命令列介面格式化、等待、版本、引數叫用，以及延遲命令群組輔助函式 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共用即時傳輸 QA 情境 ID、基準覆蓋輔助函式，以及情境選擇輔助函式 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法分派輔助函式，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由使用 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、event-loop-ready 用戶端啟動輔助函式、閘道命令列介面 RPC、閘道協定錯誤，以及頻道狀態修補輔助函式 |
    | `plugin-sdk/config-contracts` | 聚焦的 type-only 設定表面，用於外掛設定形狀，例如 `OpenClawConfig` 和頻道/供應器設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段外掛設定查找輔助函式，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助函式，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共用訊息工具交付中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助函式，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和測試快照 setter |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述正規化，以及重複/衝突檢查，即使內建 Telegram contract surface 無法使用也適用 |
    | `plugin-sdk/text-autolink-runtime` | 不經由廣泛文字 barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼核准反應繫結、反應提示 payload、反應目標儲存，以及用於本機原生 exec 提示抑制的相容性匯出 |
    | `plugin-sdk/approval-runtime` | Exec/外掛核准輔助函式、核准能力 builder、驗證/設定檔輔助函式、原生路由/執行階段輔助函式，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用傳入/回覆執行階段輔助函式、分塊、分派、心跳偵測、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡回覆分派/完成與對話標籤輔助函式 |
    | `plugin-sdk/reply-history` | 共用短窗口回覆歷史輔助函式。新的訊息回合程式碼應使用 `createChannelHistoryWindow`；較低階的 map 輔助函式僅保留為已淘汰的相容性匯出 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡文字/Markdown 分塊輔助函式 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助函式（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、依工作階段身分界定的近期使用者/助理 transcript 文字讀取、舊版工作階段儲存路徑/工作階段鍵輔助函式、updated-at 讀取，以及僅供轉換期間使用的 whole-store/file-path 相容性輔助函式 |
    | `plugin-sdk/session-transcript-runtime` | Transcript 身分、範圍化目標/讀取/寫入輔助函式、更新發布、寫入鎖，以及 transcript 記憶命中鍵 |
    | `plugin-sdk/sqlite-runtime` | 聚焦的 SQLite 代理 schema、路徑與交易輔助函式，供第一方執行階段使用 |
    | `plugin-sdk/cron-store-runtime` | 排程儲存路徑/載入/儲存輔助函式 |
    | `plugin-sdk/state-paths` | State/OAuth 目錄路徑輔助函式 |
    | `plugin-sdk/plugin-state-runtime` | 外掛 sidecar SQLite keyed-state 型別，加上外掛擁有資料庫的集中式連線 pragma 與 WAL 維護設定 |
    | `plugin-sdk/routing` | 路由/工作階段鍵/帳號繫結輔助函式，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道/帳號狀態摘要輔助函式、執行階段狀態預設值，以及 issue 中繼資料輔助函式 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助函式 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串正規化輔助函式 |
    | `plugin-sdk/request-url` | 從 fetch/request-like 輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具有正規化 stdout/stderr 結果的定時命令執行器 |
    | `plugin-sdk/param-readers` | 通用工具/命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡單的 typed agent-tool 外掛，並公開靜態中繼資料供 manifest 產生 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具 args 擷取標準傳送目標欄位 |
    | `plugin-sdk/sandbox` | Sandbox 後端型別與 SSH/OpenShell 命令輔助函式，包括 fail-fast exec 命令預檢 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助函式與私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統 logger 與遮蔽輔助函式 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助函式 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助函式，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 供應器設定解析輔助函式 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取/寫入輔助函式 |
    | `plugin-sdk/json-unsafe-integers` | 將不安全整數常值保留為字串的 JSON 解析輔助函式 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助函式 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助函式 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆分派輔助函式 |
    | `plugin-sdk/acp-runtime-backend` | 輕量 ACP 後端註冊與回覆分派輔助函式，供啟動時載入的外掛使用 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡代理執行階段設定 schema primitives |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助函式 |
    | `plugin-sdk/device-bootstrap` | 裝置 bootstrap 與配對 token 輔助函式 |
    | `plugin-sdk/extension-shared` | 共用 passive-channel、狀態與 ambient proxy 輔助 primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/供應器回覆輔助函式 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令清單輔助函式 |
    | `plugin-sdk/native-command-registry` | 原生命令 registry/build/serialize 輔助函式 |
    | `plugin-sdk/agent-harness` | 實驗性受信任外掛表面，供低階代理 harness 使用：harness 型別、active-run steer/abort 輔助函式、OpenClaw 工具 bridge 輔助函式、runtime-plan 工具政策輔助函式、終端結果分類、工具進度格式化/詳情輔助函式，以及 attempt result 公用工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已淘汰的 Z.AI 供應器擁有 endpoint 偵測門面；請使用 Z.AI 外掛 public API |
    | `plugin-sdk/async-lock-runtime` | 小型執行階段狀態檔案的 process-local async lock 輔助函式 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助函式 |
    | `plugin-sdk/concurrency-runtime` | 有界 async task concurrency 輔助函式 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內去重快取輔助函式 |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain 輔助函式 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助函式 |
    | `plugin-sdk/heartbeat-runtime` | 心跳偵測喚醒、事件與可見性輔助函式 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助函式 |
    | `plugin-sdk/secure-random-runtime` | 安全 token/UUID 輔助函式 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助函式 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助函式 |
    | `plugin-sdk/exec-approvals-runtime` | 不經由廣泛 infra-runtime barrel 的 Exec 核准政策檔案輔助函式 |
    | `plugin-sdk/infra-runtime` | 已淘汰的相容性 shim；請使用上方聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助函式 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與 trace-context 輔助函式 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助函式、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、proxy、EnvHttpProxyAgent 選項，以及 pinned lookup 輔助函式 |
    | `plugin-sdk/runtime-fetch` | 不含 proxy/guarded-fetch 匯入且 dispatcher-aware 的執行階段 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 不經由廣泛媒體執行階段表面的 inline image data URL sanitizer 與 signature sniffing 輔助函式 |
    | `plugin-sdk/response-limit-runtime` | 不經由廣泛媒體執行階段表面的有界 response-body reader |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/session-store-runtime` | 不含廣泛設定寫入/維護匯入的 session-store 輔助函式 |
    | `plugin-sdk/sqlite-runtime` | 不含資料庫生命週期控制的聚焦 SQLite 代理 schema、路徑與交易輔助函式 |
    | `plugin-sdk/context-visibility-runtime` | 不含廣泛設定/安全匯入的內容可見性解析與補充內容篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不含 markdown/logging 匯入的精簡 primitive record/string 強制轉換與正規化輔助函式 |
    | `plugin-sdk/host-runtime` | Hostname 與 SCP host 正規化輔助函式 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助函式 |
    | `plugin-sdk/agent-runtime` | 代理目錄/身分/工作區輔助函式，包括 `resolveAgentDir`、`resolveDefaultAgentDir`，以及已淘汰的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/directory-runtime` | 由設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒體擷取/轉換/儲存輔助工具，包括 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 和已棄用的 `fetchRemoteMedia`；當 URL 應成為 OpenClaw 媒體時，請優先使用儲存輔助工具，再讀取緩衝區 |
    | `plugin-sdk/media-mime` | 精準的 MIME 正規化、檔案副檔名對應、MIME 偵測，以及媒體類型輔助工具 |
    | `plugin-sdk/media-store` | 精準的媒體儲存輔助工具，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共享媒體生成容錯移轉輔助工具、候選項選擇，以及缺少模型的訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解供應商型別，以及面向供應商的影像/音訊/結構化擷取輔助工具匯出 |
    | `plugin-sdk/text-chunking` | 文字和 Markdown 分塊/算繪輔助工具、Markdown 表格轉換、指令標籤剝除，以及安全文字工具 |
    | `plugin-sdk/text-chunking` | 外送文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音供應商型別，以及面向供應商的指令、登錄、驗證、OpenAI 相容 TTS 建構器和語音輔助工具匯出 |
    | `plugin-sdk/speech-core` | 共享語音供應商型別、登錄、指令、正規化和語音輔助工具匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄供應商型別、登錄輔助工具，以及共享 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-bootstrap-context` | 即時設定檔啟動輔助工具，用於有界限的 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 脈絡注入 |
    | `plugin-sdk/realtime-voice` | 即時語音供應商型別、登錄輔助工具，以及共享即時語音行為輔助工具，包括輸出活動追蹤 |
    | `plugin-sdk/image-generation` | 影像生成供應商型別，以及影像資產/資料 URL 輔助工具和 OpenAI 相容影像供應商建構器 |
    | `plugin-sdk/image-generation-core` | 共享影像生成型別、容錯移轉、驗證和登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成供應商/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共享音樂生成型別、容錯移轉輔助工具、供應商查找，以及模型參照解析 |
    | `plugin-sdk/video-generation` | 影片生成供應商/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共享影片生成型別、容錯移轉輔助工具、供應商查找，以及模型參照解析 |
    | `plugin-sdk/transcripts` | 共享逐字稿來源供應商型別、登錄輔助工具、工作階段描述子，以及話語中繼資料 |
    | `plugin-sdk/webhook-targets` | 網路鉤子目標登錄與路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | 已棄用的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 用於舊版 OpenClaw 測試的 repo 本機已棄用相容性桶狀匯出。新的 repo 測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | repo 本機最小 `createTestPluginApi` 輔助工具，用於直接外掛註冊單元測試，不需匯入 repo 測試輔助橋接 |
    | `plugin-sdk/agent-runtime-test-contracts` | repo 本機原生代理執行階段配接器合約 fixture，用於驗證、傳遞、容錯、工具鉤子、提示覆疊、結構描述和逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | repo 本機面向通道的測試輔助工具，用於通用動作/設定/狀態合約、目錄斷言、帳戶啟動生命週期、傳送設定執行緒、執行階段 mock、狀態問題、外送傳遞，以及鉤子註冊 |
    | `plugin-sdk/channel-target-testing` | repo 本機共享目標解析錯誤案例套件，用於通道測試 |
    | `plugin-sdk/plugin-test-contracts` | repo 本機外掛套件、註冊、公開成品、直接匯入、執行階段 API 和匯入副作用合約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | repo 本機供應商執行階段、驗證、探索、上線、目錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網頁搜尋/擷取和串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | repo 本機選擇性啟用的 Vitest HTTP/驗證 mock，用於測試會執行 `plugin-sdk/provider-http` 的供應商測試 |
    | `plugin-sdk/test-fixtures` | repo 本機通用命令列介面執行階段擷取、沙盒脈絡、skill 寫入器、代理訊息、系統事件、模組重新載入、內建外掛路徑、終端文字、分塊、驗證權杖，以及型別化案例 fixture |
    | `plugin-sdk/test-node-mocks` | repo 本機聚焦的 Node 內建 mock 輔助工具，用於 Vitest `vi.mock("node:*")` factory 內部 |
  </Accordion>

  <Accordion title="記憶子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 內建 memory-core 輔助工具介面，用於管理器/設定/檔案/命令列介面輔助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | 輕量記憶嵌入供應商登錄輔助工具 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入合約、登錄存取、本機供應商，以及通用批次/遠端輔助工具。此介面上的 `registerMemoryEmbeddingProvider` 已棄用；新供應商請使用通用嵌入供應商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶主機秘密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機命令列介面執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶主機事件日誌輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 用於記憶相鄰外掛的共享受管理 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 主動記憶執行階段 facade，用於搜尋管理器存取 |
    | `plugin-sdk/memory-host-status` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的內建輔助工具子路徑">
    保留的內建輔助工具 SDK 子路徑，是針對內建外掛程式碼的精準擁有者專屬介面。它們會在 SDK 清單中追蹤，讓套件建置與別名保持確定性，但它們不是一般外掛作者 API。新的可重用主機合約應使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 內建 Codex 外掛輔助工具，用於將使用者 MCP 伺服器設定投影至 Codex app-server 執行緒設定 |
    | `plugin-sdk/codex-native-task-runtime` | 內建 Codex 外掛輔助工具，用於將 Codex app-server 原生子代理鏡像至 OpenClaw 任務狀態 |

  </Accordion>
</AccordionGroup>

## 相關

- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

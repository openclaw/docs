---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核隨附外掛子路徑與輔助工具介面
summary: 外掛 SDK 子路徑目錄：哪些匯入位於何處，依領域分組
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-04T10:27:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 以 `openclaw/plugin-sdk/` 底下的一組狹窄公開子路徑公開。本頁依用途分組，列出常用子路徑。產生的編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出是在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的儲存庫本機測試／內部子路徑後的公開子集。維護者可以使用 `pnpm plugin-sdk:surface` 稽核公開匯出數量，並使用 `pnpm plugins:boundary-report:summary` 稽核作用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是作為休眠的相容性債留在公開 SDK 中。

若要查看外掛作者指南，請參閱 [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                        | 主要匯出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具，以及 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`            |
| `plugin-sdk/health`            | 供隨附健康狀態消費者使用的 Doctor 健康檢查註冊、偵測、修復、選取、嚴重性，以及發現項目型別                                               |

### 已棄用的相容性與測試輔助工具

已棄用的子路徑仍會為較舊的外掛保留匯出，但新程式碼應使用下方聚焦的 SDK 子路徑。維護中的清單是 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕隨附生產程式碼從其中匯入。像 `compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod` 這類寬泛的彙總匯出僅供相容性使用。請直接從 `zod` 匯入 `zod`。

OpenClaw 以 Vitest 支援的測試輔助子路徑僅供儲存庫本機使用，且不再是套件匯出：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks` 和 `testing`。

### 保留的隨附外掛輔助子路徑

這些子路徑是由其所屬隨附外掛擁有的相容性表面，而不是一般 SDK API：`plugin-sdk/codex-mcp-projection` 和 `plugin-sdk/codex-native-task-runtime`。跨擁有者的擴充匯入會受到套件合約防護機制阻擋。

<AccordionGroup>
  <Accordion title="通道子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根層 `openclaw.json` Zod schema 匯出 (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | 外掛自有 schema 的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定翻譯器、允許清單提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳戶設定/動作閘門輔助工具、預設帳戶後援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳戶 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳戶查詢 + 預設後援輔助工具 |
    | `plugin-sdk/account-helpers` | 窄範圍帳戶清單/帳戶動作輔助工具 |
    | `plugin-sdk/access-groups` | 存取群組允許清單剖析與已遮蔽群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用通道設定 schema 基礎元件，以及 Zod 和直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供受維護隨附外掛使用的隨附 OpenClaw 通道設定 schema |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`。標準隨附/官方聊天通道 ID，以及供需要辨識帶有信封前綴文字且不硬編碼自有表格之外掛使用的格式化標籤/別名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 隨附通道設定 schema 的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂命令正規化/驗證輔助工具，並含隨附合約後援 |
    | `plugin-sdk/command-gating` | 窄範圍命令授權閘門輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已棄用的低階通道輸入相容性 facade。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性的高階通道輸入執行階段解析器，以及供已遷移通道接收路徑使用的路由事實建構器。優先使用這個，而不是在每個外掛中組裝有效允許清單、命令允許清單和舊版投影。請參閱[通道輸入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期合約，以及回覆管線選項、收據、即時預覽/串流、生命週期輔助工具、輸出身分、承載規劃、耐久傳送和訊息傳送情境輔助工具。請參閱[通道輸出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，以及舊版回覆分派 facade。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，以及舊版回覆分派 facade。 |
    | `plugin-sdk/inbound-envelope` | 共用輸入路由 + 信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性 facade。輸入執行器和分派述詞請使用 `plugin-sdk/channel-inbound`，訊息遞送輔助工具請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標剖析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共用輸出媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 窄範圍投票正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結生命週期與配接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版代理程式媒體承載建構器 |
    | `plugin-sdk/conversation-runtime` | 對話/執行緒繫結、配對和已設定繫結輔助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 執行階段設定快照輔助工具 |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用通道狀態快照/摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 窄範圍通道設定 schema 基礎元件 |
    | `plugin-sdk/channel-config-writes` | 通道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用通道外掛前置匯出 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯/讀取輔助工具 |
    | `plugin-sdk/group-access` | 共用群組存取決策輔助工具 |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 窄範圍直接 DM 加密前防護政策輔助工具 |
    | `plugin-sdk/discord` | 供已發布的 `@openclaw/discord@2026.3.13` 和受追蹤擁有者相容性使用的已棄用 Discord 相容性 facade；新外掛應使用通用通道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 供受追蹤擁有者相容性使用的已棄用 Telegram 帳戶解析相容性 facade；新外掛應使用注入的執行階段輔助工具或通用通道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 供仍匯入傳送者命令授權的已發布 Lark/Zalo 套件使用的已棄用 Zalo Personal 相容性 facade；新外掛應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送和舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用於事件分類、情境建構、格式化、根目錄、去抖動、提及比對、提及政策和輸入記錄的共用輸入輔助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 窄範圍輸入去抖動輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 窄範圍提及政策、提及標記和提及文字輔助工具，不含更廣泛的輸入執行階段介面 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果型別 |
    | `plugin-sdk/channel-actions` | 通道訊息動作輔助工具，以及為外掛相容性保留的已棄用原生 schema 輔助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、剖析器驅動的目標解析、執行緒 ID 字串化、去重/壓縮路由鍵、已剖析目標型別，以及路由/目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 目標剖析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 通道合約型別 |
    | `plugin-sdk/channel-feedback` | 回饋/反應接線 |
    | `plugin-sdk/channel-secret-runtime` | 窄範圍密鑰合約輔助工具，例如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`，以及密鑰目標型別 |
  </Accordion>

已棄用的通道輔助工具系列僅為已發布外掛相容性而保留可用。
移除計畫是：在外部外掛遷移窗口期間保留它們，讓 repo/隨附外掛維持使用 `channel-inbound` 和
`channel-outbound`，然後在下一次主要
SDK 清理中移除這些相容性子路徑。這適用於舊的通道訊息/執行階段、通道
串流、直接 DM 存取、輸入輔助工具分支、回覆選項，
以及配對路徑系列。

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 提供者外觀介面，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段外觀介面，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自架提供者設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自架提供者的設定輔助工具 |
    | `plugin-sdk/cli-backend` | 命令列介面後端預設值 + 監看程式常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者外掛的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-oauth-runtime` | 通用提供者 OAuth 回呼類型、回呼頁面算繪、PKCE／狀態輔助工具、授權輸入解析、權杖到期輔助工具與中止輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰 onboarding／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查詢輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助工具、已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用 replay-policy 建構器、提供者端點輔助工具，以及共用模型 ID 正規化輔助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 受保護的 `/models` 風格探索所用的即時提供者模型目錄輔助工具：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取與靜態 fallback |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄擴充執行階段 hook，以及用於合約測試的外掛提供者 registry seam |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP／端點能力輔助工具、提供者 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡的 web-fetch 設定／選擇合約輔助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch 提供者註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 精簡的 web-search 設定／憑證輔助工具，適用於不需要外掛啟用 wiring 的提供者 |
    | `plugin-sdk/provider-web-search-contract` | 精簡的 web-search 設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具作用域的憑證 setter／getter |
    | `plugin-sdk/provider-web-search` | Web-search 提供者註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/embedding-providers` | 一般嵌入提供者類型與讀取輔助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊提供者，以強制執行 manifest 所有權 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI schema 清理 + 診斷 |
    | `plugin-sdk/provider-usage` | 提供者用量快照類型、共用用量擷取輔助工具，以及 `fetchClaudeUsage` 等提供者擷取器 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流 wrapper 類型、純文字工具呼叫相容性，以及共用 Anthropic／Bedrock／DeepSeek V4／Google／Kilocode／Moonshot／OpenAI／OpenRouter／Z.A.I／MiniMax／Copilot wrapper 輔助工具 |
    | `plugin-sdk/provider-stream-shared` | 公開共用提供者串流 wrapper 輔助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic／DeepSeek／OpenAI 相容串流工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者傳輸輔助工具，例如受保護的 fetch、工具結果文字擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | Onboarding 設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 行程本機 singleton／map／cache 輔助工具 |
    | `plugin-sdk/group-activation` | 精簡的群組啟用模式與命令解析輔助工具 |
  </Accordion>

提供者用量快照通常會回報一個或多個配額 `windows`，每個都包含
標籤、已使用百分比，以及選用的重設時間。若提供者公開的是餘額或
帳戶狀態文字，而不是可重設的配額視窗，應回傳
含有空 `windows` 陣列的 `summary`，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；只有在
用量端點失敗或未回傳可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令 registry 輔助工具，包括動態引數選單格式化、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同聊天室動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞 adapter |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准閘道解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 適用於熱通道進入點的輕量原生核准 adapter 載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助工具；當較精簡的 adapter／閘道 seam 已足夠時，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶繫結、路由閘門、轉送 fallback，以及本機原生 exec 提示抑制輔助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼核准 reaction 綁定、reaction 提示 payload、reaction 目標儲存、reaction 提示文字輔助工具，以及本機原生 exec 提示抑制的相容性匯出 |
    | `plugin-sdk/approval-reply-runtime` | Exec／外掛核准回覆 payload 輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／外掛核准 payload 輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精簡的傳入回覆去重重設輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛 testing barrel 的精簡通道合約測試輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 適用於熱通道路徑的輕量命令文字 predicate |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 私密通道與 Web UI 裝置碼配對所用的 lazy 提供者驗證登入流程輔助工具 |
    | `plugin-sdk/channel-secret-runtime` | 適用於通道／外掛密鑰介面的精簡密鑰合約收集輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於密鑰合約／設定解析的精簡 `coerceSecretRef` 與 SecretRef 型別輔助工具 |
    | `plugin-sdk/secret-provider-integration` | 純型別 SecretRef 提供者整合 manifest，以及外掛發布外部密鑰提供者 preset 時使用的 preset 合約 |
    | `plugin-sdk/security-runtime` | 共用信任、DM 閘門、受根目錄限制的檔案／路徑輔助工具，包括只建立寫入、同步／非同步原子檔案替換、同層暫存寫入、跨裝置移動 fallback、私密檔案儲存輔助工具、symlink 父層防護、外部內容、敏感文字遮蔽、常數時間密鑰比較，以及密鑰收集輔助工具 |
    | `plugin-sdk/ssrf-policy` | 主機 allowlist 與私有網路 SSRF policy 輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛 infra 執行階段介面的精簡 pinned-dispatcher 輔助工具 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF 防護 fetch、SSRF 錯誤，以及 SSRF policy 輔助工具 |
    | `plugin-sdk/secret-input` | 密鑰輸入解析輔助工具 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子請求／目標輔助工具，以及原始 websocket／本文強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段、記錄、備份、外掛安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試與退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定門面，用於正規化的設定檔/預設值、CDP URL 解析，以及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 使用主機發出的任務範圍、由 harness 支援的代理程式所用的通用任務生命週期與完成交付輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 保留的內建 Codex 輔助工具，用於將使用者 MCP 伺服器設定投射到 Codex 執行緒設定；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 私有內建 Codex 輔助工具，用於原生任務鏡像/執行階段接線；不供第三方外掛使用 |
    | `plugin-sdk/channel-runtime-context` | 通用通道執行階段內容註冊與查詢輔助工具 |
    | `plugin-sdk/matrix` | 已棄用的 Matrix 相容性門面，供較舊的第三方通道套件使用；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已棄用的 Mattermost 相容性門面，供較舊的第三方通道套件使用；新外掛應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用外掛命令/hook/http/互動式輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用網路鉤子/內部 hook 管線輔助工具 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | 命令列介面格式化、等待、版本、引數叫用，以及延遲命令群組輔助工具 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共用即時傳輸 QA 情境 ID、基準覆蓋率輔助工具，以及情境選擇輔助工具 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法派發輔助工具，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由使用 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、事件迴圈就緒的用戶端啟動輔助工具、閘道命令列介面 RPC、閘道協定錯誤、公告的 LAN 主機解析，以及通道狀態修補輔助工具 |
    | `plugin-sdk/config-contracts` | 精簡的僅型別設定介面，用於外掛設定形狀，例如 `OpenClawConfig` 以及通道/提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段外掛設定查詢輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共用訊息工具交付中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot`，以及測試快照設定器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述正規化與重複/衝突檢查，即使內建 Telegram 合約介面不可用也適用 |
    | `plugin-sdk/text-autolink-runtime` | 不依賴廣泛文字 barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼的核准反應繫結、反應提示 payload、反應目標儲存、反應提示文字輔助工具，以及本機原生執行提示抑制的相容性匯出 |
    | `plugin-sdk/approval-runtime` | 執行/外掛核准輔助工具、核准能力建構器、驗證/設定檔輔助工具、原生路由/執行階段輔助工具，以及結構化核准顯示路徑格式化 |
    | `plugin-sdk/reply-runtime` | 共用傳入/回覆執行階段輔助工具、分塊、派發、心跳偵測、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆派發/完成與對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短視窗回覆歷史輔助工具。新的訊息回合程式碼應使用 `createChannelHistoryWindow`；較低階的 map 輔助工具僅保留為已棄用的相容性匯出 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡文字/Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、依工作階段身分限制的近期使用者/助理逐字稿文字讀取、舊版工作階段儲存路徑/工作階段金鑰輔助工具、updated-at 讀取，以及僅供轉換使用的整體儲存/檔案路徑相容性輔助工具 |
    | `plugin-sdk/session-transcript-runtime` | 逐字稿身分、限定範圍目標/讀取/寫入輔助工具、更新發布、寫入鎖，以及逐字稿記憶命中鍵 |
    | `plugin-sdk/sqlite-runtime` | 第一方執行階段使用的聚焦 SQLite 代理程式 schema、路徑與交易輔助工具 |
    | `plugin-sdk/cron-store-runtime` | 排程儲存路徑/載入/儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態/OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 外掛 sidecar SQLite 鍵控狀態型別，加上外掛擁有資料庫的集中式連線 pragma 與 WAL 維護設定 |
    | `plugin-sdk/routing` | 路由/工作階段金鑰/帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用通道/帳號狀態摘要輔助工具、執行階段狀態預設值，以及議題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從 fetch/request 類輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具有正規化 stdout/stderr 結果的限時命令執行器 |
    | `plugin-sdk/param-readers` | 通用工具/命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡單的具型別代理程式工具外掛，並公開靜態中繼資料以供 manifest 產生 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/sandbox` | 沙箱後端型別與 SSH/OpenShell 命令輔助工具，包括快速失敗的執行命令預檢 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具與私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取/寫入輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 將不安全整數常值保留為字串的 JSON 解析輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆派發輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 啟動載入外掛使用的輕量 ACP 後端註冊與回覆派發輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 無生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 精簡代理程式執行階段設定 schema 基本元件 |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動與配對權杖輔助工具 |
    | `plugin-sdk/extension-shared` | 共用被動通道、狀態與環境代理輔助基本元件 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列出輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄/建置/序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 低階代理程式 harness 的實驗性受信任外掛介面：harness 型別、主動執行導引/中止輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端結果分類、工具進度格式化/詳細資訊輔助工具，以及嘗試結果公用工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已棄用的 Z.AI 提供者擁有端點偵測門面；請使用 Z.AI 外掛公用 API |
    | `plugin-sdk/async-lock-runtime` | 小型執行階段狀態檔案的程序本機非同步鎖輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 通道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界非同步任務並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內與持久化後端的去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 傳出待交付排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 心跳偵測喚醒、事件與可見性輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖/UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | 不依賴廣泛基礎架構執行階段 barrel 的執行核准政策檔案輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上述聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與追蹤內容輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、proxy、EnvHttpProxyAgent 選項，以及固定查詢輔助工具 |
    | `plugin-sdk/runtime-fetch` | 不含 proxy/guarded-fetch 匯入、感知 dispatcher 的執行階段 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 不依賴廣泛媒體執行階段介面的行內圖片資料 URL 清理器與簽章嗅探輔助工具 |
    | `plugin-sdk/response-limit-runtime` | 不依賴廣泛媒體執行階段介面的有界回應本文讀取器 |
    | `plugin-sdk/session-binding-runtime` | 不含已設定繫結路由或配對儲存的目前對話繫結狀態 |
    | `plugin-sdk/session-store-runtime` | 不含廣泛設定寫入/維護匯入的工作階段儲存輔助工具 |
    | `plugin-sdk/sqlite-runtime` | 不含資料庫生命週期控制的聚焦 SQLite 代理程式 schema、路徑與交易輔助工具 |
    | `plugin-sdk/context-visibility-runtime` | 不含廣泛設定/安全性匯入的內容可見性解析與補充內容篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不含 Markdown/記錄匯入的精簡基本記錄/字串強制轉換與正規化輔助工具 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 代理程式目錄/身分/工作區輔助工具，包括 `resolveAgentDir`、`resolveDefaultAgentDir`，以及已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具，包括 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`，以及已棄用的 `fetchRemoteMedia`；當 URL 應成為 OpenClaw 媒體時，請優先使用儲存輔助工具，再考慮讀取緩衝區 |
    | `plugin-sdk/media-mime` | 精簡 MIME 正規化、副檔名對應、MIME 偵測與媒體種類輔助工具 |
    | `plugin-sdk/media-store` | 精簡媒體儲存輔助工具，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選項選擇與缺少模型訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，以及面向提供者的影像/音訊/結構化擷取輔助匯出 |
    | `plugin-sdk/text-chunking` | 文字與 Markdown 分塊/轉譯輔助工具、Markdown 表格轉換、指令標籤移除與安全文字工具 |
    | `plugin-sdk/text-chunking` | 對外文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音提供者型別，以及面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器與語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者型別、登錄、指令、正規化與語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄輔助工具與共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-bootstrap-context` | 用於有限度注入 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 脈絡的即時設定檔啟動輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別、登錄輔助工具與共用即時語音行為輔助工具，包括輸出活動追蹤 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，以及影像資產/資料 URL 輔助工具和 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證與登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助工具、提供者查找與模型參照解析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助工具、提供者查找與模型參照解析 |
    | `plugin-sdk/transcripts` | 共用逐字稿來源提供者型別、登錄輔助工具、工作階段描述子與語句中繼資料 |
    | `plugin-sdk/webhook-targets` | 網路鉤子目標登錄與路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | 已棄用的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 用於舊版 OpenClaw 測試的儲存庫本機已棄用相容性彙整匯出。新的儲存庫測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 儲存庫本機最小化 `createTestPluginApi` 輔助工具，用於不匯入儲存庫測試輔助橋接的直接外掛註冊單元測試 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫本機原生代理執行階段介面卡合約夾具，用於驗證、傳遞、備援、工具掛鉤、提示覆蓋、結構描述與逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫本機以通道為導向的測試輔助工具，用於通用動作/設定/狀態合約、目錄斷言、帳號啟動生命週期、傳送設定執行緒、執行階段模擬、狀態問題、對外傳遞與掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫本機通道測試共用目標解析錯誤案例套件 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫本機外掛套件、註冊、公開成品、直接匯入、執行階段 API 與匯入副作用合約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫本機提供者執行階段、驗證、探索、上線、目錄、精靈、媒體功能、重播原則、即時 STT 現場音訊、網頁搜尋/擷取與串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 儲存庫本機選用的 Vitest HTTP/驗證模擬，用於測試會執行 `plugin-sdk/provider-http` 的提供者 |
    | `plugin-sdk/test-fixtures` | 儲存庫本機通用命令列介面執行階段擷取、沙盒脈絡、skill 寫入器、代理訊息、系統事件、模組重新載入、 bundled 外掛路徑、終端文字、分塊、驗證權杖與型別化案例夾具 |
    | `plugin-sdk/test-node-mocks` | 儲存庫本機聚焦的 Node 內建模擬輔助工具，用於 Vitest `vi.mock("node:*")` factory 內 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 用於管理器/設定/檔案/命令列介面輔助工具的 bundled memory-core 輔助介面 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶體索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | 輕量記憶體嵌入提供者登錄輔助工具 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入合約、登錄存取、本機提供者與通用批次/遠端輔助工具。此介面上的 `registerMemoryEmbeddingProvider` 已棄用；新提供者請使用通用嵌入提供者 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶體主機多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶體主機查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶體主機祕密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機命令列介面執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 用於記憶體相鄰外掛的共用受管理 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於搜尋管理器存取的主動記憶執行階段 facade |
    | `plugin-sdk/memory-host-status` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的 bundled-helper 子路徑">
    保留的 bundled-helper SDK 子路徑是針對 bundled 外掛程式碼的精簡擁有者專屬介面。
    它們會在 SDK 清查中追蹤，讓套件建置與別名保持決定性，
    但它們不是通用的外掛撰寫 API。新的可重用主機合約應使用通用 SDK 子路徑，
    例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和
    `plugin-sdk/plugin-config-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | bundled Codex 外掛輔助工具，用於將使用者 MCP 伺服器設定投影到 Codex app-server 執行緒設定 |
    | `plugin-sdk/codex-native-task-runtime` | bundled Codex 外掛輔助工具，用於將 Codex app-server 原生子代理鏡像到 OpenClaw 任務狀態 |

  </Accordion>
</AccordionGroup>

## 相關

- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核 bundled-plugin 子路徑與輔助工具介面
summary: 外掛 SDK 子路徑目錄：依領域分組的匯入位置
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-05T11:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: feb618466479488b576a6942ad4a21061a20e57870a2151b1cdcb868db9b80bb
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 以 `openclaw/plugin-sdk/` 下的一組窄版公開子路徑公開。本頁依用途分組列出常用子路徑。三個檔案定義此介面：

- `scripts/lib/plugin-sdk-entrypoints.json`：建置會編譯的維護中進入點清單。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：僅限 repo 本機的測試/內部子路徑。套件匯出是清單扣除此列表。
- `src/plugin-sdk/entrypoints.ts`：已棄用子路徑、保留的內建輔助工具、支援的內建 facade，以及外掛擁有的公開介面的分類中繼資料。

維護者使用 `pnpm plugin-sdk:surface` 稽核公開匯出數量，並使用 `pnpm plugins:boundary-report:summary` 稽核啟用中的保留輔助工具子路徑；未使用的保留輔助工具匯出會讓 CI 報告失敗，而不是以休眠相容性債務的形式留在公開 SDK 中。

如需外掛作者指南，請參閱[外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                        | 主要匯出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具，以及 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`            |
| `plugin-sdk/health`            | 供內建健康狀態消費者使用的 Doctor 健康檢查註冊、偵測、修復、選取、嚴重性與發現項目類型                                               |
| `plugin-sdk/config-schema`     | 已棄用。根 `openclaw.json` Zod schema（`OpenClawSchema`）；請改為定義外掛本機 schema，並使用 `plugin-sdk/json-schema-runtime` 驗證                 |

### 已棄用的相容性與測試輔助工具

已棄用的子路徑仍會匯出給較舊的外掛使用，但新程式碼應使用下方聚焦的 SDK 子路徑。維護中的列表是 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕內建正式環境程式碼從中匯入。像 `plugin-sdk/compat`、`plugin-sdk/config-types`、`plugin-sdk/infra-runtime` 和 `plugin-sdk/text-runtime` 這類寬版 barrel 僅供相容性使用，而 `plugin-sdk/zod` 是相容性重新匯出：請直接從 `zod` 匯入 `zod`。寬版領域 barrel `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime` 和 `plugin-sdk/security-runtime` 也同樣已棄用，請改用聚焦的子路徑。

OpenClaw 的 Vitest 支援測試輔助工具子路徑僅限 repo 本機使用，且不再是套件匯出：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、`test-node-mocks` 和 `testing`。私有內建輔助工具介面 `ssrf-runtime-internal` 和 `codex-native-task-runtime` 也僅限 repo 本機使用。

### 保留的內建外掛輔助工具子路徑

`plugin-sdk/codex-mcp-projection` 是唯一的保留子路徑：它是內建 Codex 外掛擁有的相容性介面，不是通用 SDK API。跨擁有者外掛匯入會受到套件合約防護機制阻擋，且當保留子路徑停止被匯入時，CI 會失敗。`plugin-sdk/codex-native-task-runtime` 僅限 repo 本機使用，並非套件匯出。

`src/plugin-sdk/entrypoints.ts` 也會追蹤支援的內建 facade，也就是由其內建外掛支援的 SDK 進入點，直到通用合約取代它們為止：`plugin-sdk/discord`、`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、`plugin-sdk/matrix`、`plugin-sdk/mattermost`、`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、`plugin-sdk/tts-runtime` 和 `plugin-sdk/zalouser`。其中幾個也已不建議新程式碼使用；請參閱下方各列備註。

  <AccordionGroup>
  <Accordion title="頻道子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | 用於外掛自有結構描述的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定翻譯器、允許清單提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定／動作閘門輔助工具、預設帳號後援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查找與預設後援輔助工具 |
    | `plugin-sdk/account-helpers` | 精簡帳號清單／帳號動作輔助工具 |
    | `plugin-sdk/access-groups` | 存取群組允許清單解析與已遮蔽群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定結構描述原語，加上 Zod 與直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供受維護的內建外掛使用的內建 OpenClaw 頻道設定結構描述 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準內建／官方聊天頻道 ID，加上格式化標籤／別名，供需要辨識信封前綴文字且不想硬編碼自身表格的外掛使用。 |
    | `plugin-sdk/channel-config-schema-legacy` | 內建頻道設定結構描述的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | 已棄用的 Telegram 命令名稱／描述正規化與重複／衝突檢查；新外掛程式碼請使用外掛本機命令設定處理 |
    | `plugin-sdk/command-gating` | 精簡命令授權閘門輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 低階頻道輸入相容性介面。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性高階頻道輸入執行階段解析器與路由事實建構器，供已遷移的頻道接收路徑使用。優先使用此項，而不是在每個外掛中組裝有效允許清單、命令允許清單與舊版投影。請參閱[頻道輸入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期合約，加上回覆管線選項、回條、即時預覽／串流、生命週期輔助工具、輸出身分、酬載規劃、持久傳送，以及訊息傳送情境輔助工具。請參閱[頻道輸出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，加上舊版回覆派送 facade。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，加上舊版回覆派送 facade。 |
    | `plugin-sdk/inbound-envelope` | 共用輸入路由與信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性 facade。輸入執行器與派送述詞請使用 `plugin-sdk/channel-inbound`，訊息遞送輔助工具請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標解析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共用輸出媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 精簡輪詢正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 對話串繫結生命週期與配接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | Agent 媒體酬載根目錄與載入器 |
    | `plugin-sdk/conversation-runtime` | 已棄用的寬泛 conversation/thread 繫結、配對與已設定繫結輔助工具桶；請優先使用聚焦的繫結子路徑，例如 `plugin-sdk/thread-bindings-runtime` 與 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照／摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 精簡頻道設定結構描述原語 |
    | `plugin-sdk/channel-config-writes` | 頻道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道外掛前置匯出 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯／讀取輔助工具 |
    | `plugin-sdk/group-access` | 已棄用的群組存取決策輔助工具；請使用 `plugin-sdk/channel-ingress-runtime` 的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 精簡直接 DM 加密前防護政策輔助工具 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性 facade，用於已發布的 `@openclaw/discord@2026.3.13` 與受追蹤的擁有者相容性；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram 帳號解析相容性 facade，用於受追蹤的擁有者相容性；新外掛應使用注入的執行階段輔助工具或通用頻道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已棄用的 Zalo Personal 相容性 facade，用於仍匯入寄件者命令授權的已發布 Lark/Zalo 套件；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送與舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 事件分類、情境建構、格式化、根目錄、防抖、提及比對、提及政策與輸入記錄的共用輸入輔助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 精簡輸入防抖輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 精簡提及政策、提及標記與提及文字輔助工具，不含較寬泛的輸入執行階段介面 |
    | `plugin-sdk/channel-envelope`、`plugin-sdk/channel-inbound-roots`、`plugin-sdk/channel-location`、`plugin-sdk/channel-logging` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性 facade。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果型別 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助工具，加上為外掛相容性保留的已棄用原生結構描述輔助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、剖析器驅動的目標解析、對話串 ID 字串化、去重／壓縮路由鍵、已解析目標型別，以及路由／目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 目標解析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道合約型別 |
    | `plugin-sdk/channel-feedback` | 回饋／反應接線 |
  </Accordion>

已棄用的頻道輔助工具系列僅為已發布外掛的相容性而保留。移除計畫是：在外部外掛遷移期間保留它們，讓 repo/ bundled 外掛維持使用 `channel-inbound` 和
`channel-outbound`，然後在下一次主要
SDK 清理中移除相容性子路徑。這適用於舊的頻道訊息/執行階段、頻道串流、直接 DM 存取、輸入輔助工具分支、回覆選項，以及配對路徑系列。

  <Accordion title="供應商子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 供應商 facade，用於設定、目錄探索與執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段 facade，用於本機伺服器預設值、模型探索、請求標頭與已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自行託管供應商設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 已棄用的 OpenAI 相容自行託管設定輔助工具；請使用 `plugin-sdk/provider-setup` 或外掛自有的設定輔助工具 |
    | `plugin-sdk/cli-backend` | 命令列介面後端預設值 + 看門狗常數 |
    | `plugin-sdk/provider-auth-runtime` | 供應商驗證執行階段輔助工具：OAuth loopback 流程、權杖交換、驗證持久化與 API 金鑰解析 |
    | `plugin-sdk/provider-oauth-runtime` | 通用供應商 OAuth 回呼型別、回呼頁面呈現、PKCE／狀態輔助工具、授權輸入解析、權杖到期輔助工具與中止輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰 onboarding／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 供應商驗證環境變數查找輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助工具、已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、供應商端點輔助工具與共用模型 ID 正規化輔助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 即時供應商模型目錄輔助工具，用於受保護的 `/models` 風格探索：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取與靜態備援 |
    | `plugin-sdk/provider-catalog-runtime` | 供應商目錄增強執行階段 hook 與外掛供應商登錄接縫，用於合約測試 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用供應商 HTTP／端點能力輔助工具、供應商 HTTP 錯誤與音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡的網頁擷取設定／選擇合約輔助工具，例如 `enablePluginInConfig` 與 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取供應商註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 精簡的網頁搜尋設定／憑證輔助工具，適用於不需要外掛啟用接線的供應商 |
    | `plugin-sdk/provider-web-search-contract` | 精簡的網頁搜尋設定／憑證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具作用域的憑證 setter／getter |
    | `plugin-sdk/provider-web-search` | 網頁搜尋供應商註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/embedding-providers` | 一般嵌入供應商型別與讀取輔助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 與 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊供應商，因此會強制執行 manifest 擁有權 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI 結構描述清理 + 診斷 |
    | `plugin-sdk/provider-usage` | 供應商用量快照型別、共用用量擷取輔助工具，以及 `fetchClaudeUsage` 等供應商擷取器 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別、純文字工具呼叫相容性，以及共用 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI 包裝器輔助工具 |
    | `plugin-sdk/provider-stream-shared` | 公開共用供應商串流包裝器輔助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic／DeepSeek／OpenAI 相容串流工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生供應商傳輸輔助工具，例如受保護的 fetch、工具結果文字擷取、傳輸訊息轉換與可寫入傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | Onboarding 設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 行程本機 singleton／map／cache 輔助工具 |
    | `plugin-sdk/group-activation` | 精簡群組啟用模式與命令解析輔助工具 |
  </Accordion>

供應商用量快照通常會報告一個或多個配額 `windows`，每個都包含
標籤、已使用百分比，以及選用的重設時間。若供應商公開的是餘額或
帳戶狀態文字，而不是可重設的配額視窗，應回傳
`summary` 並搭配空的 `windows` 陣列，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；只有在
用量端點失敗或未回傳可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已棄用的廣泛命令授權介面（`resolveControlCommandGate`、命令登錄輔助工具，包括動態引數選單格式化、傳送者授權輔助工具）；請使用通道入口／執行階段授權或命令狀態輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 與 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec 核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准閘道解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 輕量原生核准配接器載入輔助工具，用於熱通道進入點 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理器執行階段輔助工具；當較精簡的配接器／閘道接縫已足夠時，優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶繫結、路由閘門、轉送備援，以及本機原生 exec 提示抑制輔助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼核准 reaction 綁定、reaction 提示 payload、reaction 目標儲存、reaction 提示文字輔助工具，以及本機原生 exec 提示抑制的相容性匯出 |
    | `plugin-sdk/approval-reply-runtime` | Exec／外掛核准回覆 payload 輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec／外掛核准 payload 輔助工具、核准能力建構器、核准驗證／設定檔輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 已棄用的精簡入站回覆去重重設輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化與原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 輕量命令文字 predicate，用於熱通道路徑 |
    | `plugin-sdk/command-surface` | 命令本文正規化與命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 延遲供應商驗證登入流程輔助工具，用於私人通道與網頁 UI 裝置碼配對 |
    | `plugin-sdk/channel-secret-runtime` | 已棄用的廣泛秘密合約介面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、秘密目標型別）；請優先使用下方聚焦的子路徑 |
    | `plugin-sdk/channel-secret-basic-runtime` | 精簡秘密合約匯出，用於非 TTS 通道／外掛秘密介面 |
    | `plugin-sdk/channel-secret-tts-runtime` | 精簡巢狀通道 TTS 秘密指派輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 精簡的 `coerceSecretRef` 與 SecretRef 型別輔助工具，用於秘密合約／設定解析 |
    | `plugin-sdk/secret-provider-integration` | 僅型別 SecretRef 供應商整合 manifest 與預設集合約，用於發布外部秘密供應商預設集的外掛 |
    | `plugin-sdk/security-runtime` | 已棄用的廣泛 barrel，涵蓋信任、DM 閘門、根目錄界定的檔案／路徑輔助工具（包括僅建立寫入）、同步／非同步原子檔案替換、同層暫存寫入、跨裝置移動備援、私有檔案儲存輔助工具、符號連結父層防護、外部內容、敏感文字遮蔽、常數時間秘密比較與秘密收集輔助工具；請優先使用聚焦的安全性／SSRF／秘密子路徑 |
    | `plugin-sdk/ssrf-policy` | 主機 allowlist 與私人網路 SSRF 政策輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 精簡 pinned dispatcher 輔助工具，不含廣泛基礎設施執行階段介面 |
    | `plugin-sdk/ssrf-runtime` | Pinned dispatcher、SSRF 防護 fetch、SSRF 錯誤與 SSRF 政策輔助工具 |
    | `plugin-sdk/secret-input` | 秘密輸入解析輔助工具 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子請求／目標輔助工具與原始 websocket／body 強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 執行階段、記錄、備份輔助工具、外掛安裝路徑警告，以及程序輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試，以及退避輔助工具 |
    | `plugin-sdk/browser-config` | 受支援的瀏覽器設定 facade，用於正規化設定檔/預設值、CDP URL 解析，以及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 適用於使用主機核發工作範圍的 harness-backed agent 的通用工作生命週期與完成交付輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 保留的內建 Codex 輔助工具，用於將使用者 MCP 伺服器設定投影到 Codex thread 設定；不適用於第三方外掛 |
    | `plugin-sdk/codex-native-task-runtime` | 儲存庫本機的內建 Codex 輔助工具，用於原生工作鏡像/執行階段接線；不是套件匯出 |
    | `plugin-sdk/channel-runtime-context` | 通用通道執行階段內容註冊與查找輔助工具 |
    | `plugin-sdk/matrix` | 已棄用的 Matrix 相容性 facade，供較舊的第三方通道套件使用；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已棄用的 Mattermost 相容性 facade，供較舊的第三方通道套件使用；新外掛應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 已棄用的外掛命令、hook、HTTP、互動式輔助工具廣泛 barrel；建議改用聚焦的外掛執行階段子路徑 |
    | `plugin-sdk/hook-runtime` | 已棄用的網路鉤子/內部 hook 管線輔助工具廣泛 barrel；建議改用聚焦的 hook/外掛執行階段子路徑 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序 exec 輔助工具 |
    | `plugin-sdk/cli-runtime` | 已棄用的命令列介面格式化、等待、版本、引數叫用，以及延遲命令群組輔助工具廣泛 barrel；建議改用聚焦的命令列介面/執行階段子路徑 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共用即時傳輸 QA 情境 ID、基準覆蓋率輔助工具，以及情境選擇輔助工具 |
    | `plugin-sdk/qa-runner-runtime` | 受支援的 facade，透過命令列介面命令介面公開外掛 QA 情境 |
    | `plugin-sdk/tts-runtime` | 受支援的文字轉語音設定結構描述與執行階段輔助工具 facade |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法分派輔助工具，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由使用 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、事件迴圈就緒用戶端啟動輔助工具、閘道命令列介面 RPC、閘道協定錯誤、公告的 LAN 主機解析，以及通道狀態修補輔助工具 |
    | `plugin-sdk/config-contracts` | 聚焦的僅型別設定介面，用於外掛設定形狀，例如 `OpenClawConfig` 與通道/供應商設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段外掛設定查找輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共用訊息工具交付中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和測試快照 setter |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛 text barrel 的檔案參照自動連結偵測 |
    | `plugin-sdk/reply-runtime` | 共用傳入/回覆執行階段輔助工具、分塊、分派、心跳偵測、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派/完成與對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間窗回覆歷史輔助工具。新的訊息回合程式碼應使用 `createChannelHistoryWindow`；較低階的 map 輔助工具仍僅作為已棄用的相容性匯出 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡文字/Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、依工作階段身分界定的近期使用者/助理逐字稿文字讀取、有界讀取、舊版工作階段儲存路徑/工作階段鍵輔助工具、updated-at 讀取，以及僅供轉換使用的整體儲存/檔案路徑相容性輔助工具，不包含廣泛設定寫入/維護匯入 |
    | `plugin-sdk/session-transcript-runtime` | 逐字稿身分、限定範圍的目標/讀取/寫入輔助工具、更新發布、寫入鎖，以及逐字稿記憶命中鍵 |
    | `plugin-sdk/sqlite-runtime` | 聚焦的 SQLite agent 結構描述、路徑與交易輔助工具，供第一方執行階段使用，不包含資料庫生命週期控制 |
    | `plugin-sdk/cron-store-runtime` | 排程儲存路徑/載入/儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態/OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 外掛 sidecar SQLite 鍵控狀態型別，加上外掛自有資料庫的集中式連線 pragma 與 WAL 維護設定 |
    | `plugin-sdk/routing` | 路由/工作階段鍵/帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用通道/帳號狀態摘要輔助工具、執行階段狀態預設值，以及議題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從類 fetch/request 輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具逾時功能的命令執行器，提供正規化的 stdout/stderr 結果 |
    | `plugin-sdk/param-readers` | 常用工具/命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡單的具型別 agent 工具外掛，並公開靜態中繼資料供 manifest 產生使用 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化 payload |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準 send 目標欄位 |
    | `plugin-sdk/sandbox` | 沙盒後端型別與 SSH/OpenShell 命令輔助工具，包含快速失敗的 exec 命令預檢 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具與私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型/工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 供應商設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取/寫入輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 將不安全整數常值保留為字串的 JSON 解析輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/工作階段與回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 輕量 ACP 後端註冊與回覆分派輔助工具，供啟動時載入的外掛使用 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含生命週期啟動匯入的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 已棄用的 agent 執行階段設定結構描述 primitive；請從維護中的外掛自有介面匯入結構描述 primitive |
    | `plugin-sdk/boolean-param` | 寬鬆布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置 bootstrap 與配對權杖輔助工具 |
    | `plugin-sdk/extension-shared` | 共用被動通道、狀態與 ambient 代理輔助 primitive |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/供應商回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令清單輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄/建置/序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 實驗性的受信任外掛介面，用於低階 agent harness：harness 型別、active-run steering/abort 輔助工具、OpenClaw 工具橋接輔助工具、runtime-plan 工具政策輔助工具、終端結果分類、工具進度格式化/詳細資料輔助工具，以及 attempt 結果工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已棄用的 Z.AI 供應商自有端點偵測 facade；請使用 Z.AI 外掛公開 API |
    | `plugin-sdk/async-lock-runtime` | 程序本機 async lock 輔助工具，適用於小型執行階段狀態檔案 |
    | `plugin-sdk/channel-activity-runtime` | 通道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界 async 工作並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內與 persistent-backed 去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 外送待處理交付 drain 輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 心跳偵測喚醒、事件與可見性輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖/UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | Exec 核准政策檔案輔助工具，不含廣泛 infra-runtime barrel |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上述聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與 trace-context 輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝過的 fetch、代理、EnvHttpProxyAgent 選項，以及固定 lookup 輔助工具 |
    | `plugin-sdk/runtime-fetch` | 感知 dispatcher 的執行階段 fetch，不含代理/guarded-fetch 匯入 |
    | `plugin-sdk/inline-image-data-url-runtime` | 行內圖片 data URL 清理器與簽章 sniffing 輔助工具，不含廣泛 media runtime 介面 |
    | `plugin-sdk/response-limit-runtime` | 有界 response-body 讀取器，不含廣泛 media runtime 介面 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/context-visibility-runtime` | 內容可見性解析與補充內容篩選，不含廣泛設定/安全性匯入 |
    | `plugin-sdk/string-coerce-runtime` | 精簡 primitive record/字串強制轉換與正規化輔助工具，不含 Markdown/記錄匯入 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 已棄用的 agent 目錄/身分/工作區輔助工具廣泛 barrel，包含 `resolveAgentDir`、`resolveDefaultAgentDir`，以及已棄用的 `resolveOpenClawAgentDir` 相容性匯出；建議改用聚焦的 agent/執行階段子路徑 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已棄用的廣泛媒體統整匯出，包含 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 與已棄用的 `fetchRemoteMedia`；建議使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 與能力執行階段子路徑，且當 URL 應成為 OpenClaw 媒體時，建議先使用儲存區輔助工具，再讀取緩衝區 |
    | `plugin-sdk/media-mime` | 精簡的 MIME 正規化、副檔名對應、MIME 偵測與媒體類型輔助工具 |
    | `plugin-sdk/media-store` | 精簡的媒體儲存區輔助工具，例如 `saveMediaBuffer` 與 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共用的媒體生成容錯移轉輔助工具、候選選擇與缺少模型訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，以及面向提供者的影像、音訊、結構化擷取輔助匯出 |
    | `plugin-sdk/text-chunking` | 傳出文字與 Markdown 分塊/算繪輔助工具、Markdown 表格轉換、指令標籤移除與安全文字工具 |
    | `plugin-sdk/speech` | 語音提供者型別，以及面向提供者的指令、登錄表、驗證、OpenAI 相容 TTS 建構器與語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用的語音提供者型別、登錄表、指令、正規化與語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄表輔助工具與共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-bootstrap-context` | 用於有界 `IDENTITY.md`、`USER.md` 與 `SOUL.md` 情境注入的即時設定檔啟動輔助工具 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別、登錄表輔助工具與共用即時語音行為輔助工具，包含輸出活動追蹤 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，以及影像資產/資料 URL 輔助工具與 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用的影像生成型別、容錯移轉、驗證與登錄表輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 已棄用的共用音樂生成型別、容錯移轉輔助工具、提供者查找與模型參照剖析；建議使用外掛擁有的音樂提供者介面 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用的影片生成型別、容錯移轉輔助工具、提供者查找與模型參照剖析 |
    | `plugin-sdk/transcripts` | 共用的逐字稿來源提供者型別、登錄表輔助工具、工作階段描述元與語句中繼資料 |
    | `plugin-sdk/webhook-targets` | 網路鉤子目標登錄表與路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | 已棄用的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共用的遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 用於舊版 OpenClaw 測試的儲存庫內部已棄用相容性統整匯出。新的儲存庫測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 儲存庫內部的最小 `createTestPluginApi` 輔助工具，用於不匯入儲存庫測試輔助橋接的直接外掛註冊單元測試 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫內部的原生代理執行階段配接器合約夾具，用於驗證、傳遞、備援、工具鉤子、提示覆疊、結構描述與逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫內部面向通道的測試輔助工具，用於通用動作/設定/狀態合約、目錄斷言、帳戶啟動生命週期、傳送設定串接、執行階段模擬、狀態問題、傳出傳遞與鉤子註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫內部共用的目標解析錯誤案例套件，用於通道測試 |
    | `plugin-sdk/channel-contract-testing` | 儲存庫內部的精簡通道合約測試輔助工具，不使用廣泛測試統整匯出 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫內部的外掛套件、註冊、公開成品、直接匯入、執行階段 API 與匯入副作用合約輔助工具 |
    | `plugin-sdk/plugin-state-test-runtime` | 儲存庫內部的外掛狀態儲存區、入口佇列與狀態 DB 測試輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫內部的提供者執行階段、驗證、探索、上線、目錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網頁搜尋/擷取與串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 儲存庫內部可選用的 Vitest HTTP/驗證模擬，用於測試會操作 `plugin-sdk/provider-http` 的提供者 |
    | `plugin-sdk/reply-payload-testing` | 用於將中繼資料附加到回覆酬載夾具的儲存庫內部輔助工具 |
    | `plugin-sdk/sqlite-runtime-testing` | 第一方測試用的儲存庫內部 SQLite 生命週期輔助工具 |
    | `plugin-sdk/test-fixtures` | 儲存庫內部的通用命令列介面執行階段擷取、沙箱情境、技能寫入器、代理訊息、系統事件、模組重新載入、隨附外掛路徑、終端文字、分塊、驗證權杖與型別化案例夾具 |
    | `plugin-sdk/test-node-mocks` | 儲存庫內部聚焦的 Node 內建模擬輔助工具，用於 Vitest `vi.mock("node:*")` 工廠內 |
  </Accordion>

  <Accordion title="記憶子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | 已棄用的記憶索引/搜尋執行階段外觀；建議使用供應商中立的 memory-host 子路徑 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 輕量記憶嵌入提供者登錄表輔助工具 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入合約、登錄表存取、本機提供者與通用批次/遠端輔助工具。此介面上的 `registerMemoryEmbeddingProvider` 已棄用；新提供者請使用通用嵌入提供者 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 已棄用的記憶主機多模態輔助工具；建議使用供應商中立的 memory-host 子路徑 |
    | `plugin-sdk/memory-core-host-query` | 已棄用的記憶主機查詢輔助工具；建議使用供應商中立的 memory-host 子路徑 |
    | `plugin-sdk/memory-core-host-secret` | 記憶主機祕密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機命令列介面執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶主機事件日誌輔助工具的供應商中立別名 |
    | `plugin-sdk/memory-host-files` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 供記憶相鄰外掛使用的共用受管理 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於存取搜尋管理器的主動記憶執行階段外觀 |
    | `plugin-sdk/memory-host-status` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的隨附輔助工具子路徑">
    保留的隨附輔助工具 SDK 子路徑，是面向隨附外掛程式碼的精簡擁有者特定介面。它們會在 SDK 清單中追蹤，讓套件建置與別名保持確定性，但它們不是一般外掛作者 API。新的可重用主機合約應使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime` 與 `plugin-sdk/plugin-config-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 隨附 Codex 外掛輔助工具，用於將使用者 MCP 伺服器設定投影到 Codex app-server 執行緒設定中（保留的套件匯出） |
    | `plugin-sdk/codex-native-task-runtime` | 隨附 Codex 外掛輔助工具，用於將 Codex app-server 原生子代理鏡像到 OpenClaw 工作狀態中（僅限儲存庫內部，不是套件匯出） |

  </Accordion>
</AccordionGroup>

## 相關

- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

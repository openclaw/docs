---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核內建外掛的子路徑與輔助介面
summary: 外掛 SDK 子路徑目錄：依領域分組說明各匯入項目的所在位置
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-14T13:53:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c457526891ba2adcce0d11f86e3efe4ab39c36c4bb3c0d4f08decc6e021d821d
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 以一組精簡的公開子路徑形式，公開於
`openclaw/plugin-sdk/` 之下。本頁依用途分組，列出常用的子路徑。
此介面由三個檔案定義：

- `scripts/lib/plugin-sdk-entrypoints.json`：建置時會編譯的維護中進入點清單。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：僅供儲存庫本機使用的
  測試／內部子路徑。套件匯出項目為清單扣除此列表。
- `src/plugin-sdk/entrypoints.ts`：已棄用子路徑、保留的隨附輔助工具、
  支援的隨附外觀介面，以及外掛自有公開介面的分類中繼資料。

維護者使用 `pnpm plugin-sdk:surface` 稽核公開匯出項目的數量，並使用
`pnpm plugins:boundary-report:summary` 稽核使用中的保留輔助工具子路徑；
未使用的保留輔助工具匯出項目會使 CI 報告失敗，而不會作為閒置的相容性負債留在
公開 SDK 中。

如需外掛編寫指南，請參閱[外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                         | 主要匯出項目                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具，以及 `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`                                             |
| `plugin-sdk/health`            | 供隨附健康狀態取用端使用的 Doctor 健康檢查註冊、偵測、修復、選擇、嚴重性與發現項目型別                                                                                |
| `plugin-sdk/config-schema`     | 已棄用。根層級 `openclaw.json` Zod 結構描述（`OpenClawSchema`）；請改為定義外掛本機結構描述，並使用 `plugin-sdk/json-schema-runtime` 驗證                                                  |

### 已棄用的相容性與測試輔助工具

為支援較舊的外掛，已棄用的子路徑仍會匯出，但新程式碼應使用下方專用的
SDK 子路徑。維護中的列表為
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕隨附的
正式環境程式碼從中匯入。`plugin-sdk/compat`、
`plugin-sdk/config-types`、`plugin-sdk/infra-runtime` 和
`plugin-sdk/text-runtime` 等廣泛彙整入口僅供相容性使用，而 `plugin-sdk/zod` 是
相容性重新匯出：請直接從 `zod` 匯入 `zod`。廣泛的領域
彙整入口 `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、
`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、
`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、
`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime` 和
`plugin-sdk/security-runtime` 同樣已棄用，請改用專用子路徑。

OpenClaw 以 Vitest 為基礎的測試輔助工具子路徑僅供儲存庫本機使用，不再是
套件匯出項目：`agent-runtime-test-contracts`、
`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、
`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、
`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、
`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、
`test-node-mocks` 和 `testing`。私有的隨附輔助工具介面
`ssrf-runtime-internal` 和 `codex-native-task-runtime` 也僅供儲存庫本機
使用。

### 保留的隨附外掛輔助工具子路徑

`plugin-sdk/codex-mcp-projection` 是唯一的保留子路徑：這是隨附 Codex 外掛自有的
相容性介面，而非通用 SDK API。
套件契約防護機制會封鎖跨擁有者的外掛匯入，而當保留子路徑不再被匯入時，
CI 就會失敗。
`plugin-sdk/codex-native-task-runtime` 僅供儲存庫本機使用，並非套件
匯出項目。

`src/plugin-sdk/entrypoints.ts` 也會追蹤支援的隨附外觀介面，即在通用契約取代它們之前，
由相應隨附外掛支援的 SDK 進入點：`plugin-sdk/discord`、`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、
`plugin-sdk/matrix`、`plugin-sdk/mattermost`、
`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、
`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、
`plugin-sdk/tts-runtime` 和 `plugin-sdk/zalouser`。其中數個也已不建議用於
新程式碼；請參閱下方各列的附註。

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | 用於外掛自有結構描述的快取 JSON Schema 驗證輔助函式 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助函式、設定翻譯器、允許清單提示，以及設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定／動作閘門輔助函式、預設帳號後援輔助函式 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助函式 |
    | `plugin-sdk/account-resolution` | 帳號查詢與預設後援輔助函式 |
    | `plugin-sdk/account-helpers` | 範圍精簡的帳號清單／帳號動作輔助函式 |
    | `plugin-sdk/access-groups` | 存取群組允許清單剖析與群組診斷資訊遮蔽輔助函式 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定結構描述基本元件，以及 Zod 與直接 JSON／TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的隨附外掛使用的 OpenClaw 隨附頻道設定結構描述 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準的隨附／官方聊天頻道 ID，以及供需要辨識帶信封前綴文字、又不想硬式編碼自有對照表的外掛使用的格式化工具標籤／別名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 隨附頻道設定結構描述的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | 已棄用的 Telegram 命令名稱／描述正規化及重複／衝突檢查；新的外掛程式碼請使用外掛本機的命令設定處理方式 |
    | `plugin-sdk/command-gating` | 範圍精簡的命令授權閘門輔助函式 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 低階頻道輸入相容性介面。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性的高階頻道輸入執行階段解析器，以及供已遷移頻道接收路徑使用的路由事實建構器。請優先使用此介面，而非在各外掛中組裝有效允許清單、命令允許清單和舊版投影。請參閱[頻道輸入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期合約，以及回覆管線選項、回條、即時預覽／串流、生命週期輔助函式、輸出身分、承載資料規劃、持久傳送和訊息傳送情境輔助函式。請參閱[頻道輸出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，以及舊版回覆分派門面。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，以及舊版回覆分派門面。 |
    | `plugin-sdk/inbound-envelope` | 共用輸入路由與信封建構器輔助函式 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性門面。輸入執行器與分派述詞請使用 `plugin-sdk/channel-inbound`，訊息傳遞輔助函式請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標剖析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共用輸出媒體載入與代管媒體狀態輔助函式 |
    | `plugin-sdk/outbound-send-deps` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 範圍精簡的投票正規化輔助函式 |
    | `plugin-sdk/thread-bindings-runtime` | 討論串繫結生命週期與轉接器輔助函式 |
    | `plugin-sdk/agent-media-payload` | 代理程式媒體承載資料根目錄與載入器 |
    | `plugin-sdk/conversation-runtime` | 已棄用的廣泛匯出入口，用於對話／討論串繫結、配對和已設定繫結輔助函式；請優先使用範圍明確的繫結子路徑，例如 `plugin-sdk/thread-bindings-runtime` 和 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組原則解析輔助函式 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照／摘要輔助函式 |
    | `plugin-sdk/channel-config-primitives` | 範圍精簡的頻道設定結構描述基本元件 |
    | `plugin-sdk/channel-config-writes` | 頻道設定寫入授權輔助函式 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道外掛前置匯出項目 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯／讀取輔助函式 |
    | `plugin-sdk/group-access` | 已棄用的群組存取決策輔助函式；請使用 `plugin-sdk/channel-ingress-runtime` 中的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 範圍精簡的直接私訊加密前防護原則輔助函式 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性門面，用於已發布的 `@openclaw/discord@2026.3.13` 和受追蹤的擁有者相容性；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram 帳號解析相容性門面，用於受追蹤的擁有者相容性；新外掛應使用注入的執行階段輔助函式或通用頻道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 已棄用的 Zalo Personal 相容性門面，供仍匯入傳送者命令授權的已發布 Lark／Zalo 套件使用；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/interactive-runtime` | 語意式訊息呈現、傳遞及舊版互動式回覆輔助函式。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用於事件分類、情境建構、格式化、根目錄、防彈跳、提及比對、提及原則及輸入記錄的共用輸入輔助函式 |
    | `plugin-sdk/channel-inbound-debounce` | 範圍精簡的輸入防彈跳輔助函式 |
    | `plugin-sdk/channel-mention-gating` | 不含較廣泛輸入執行階段介面的範圍精簡提及原則、提及標記及提及文字輔助函式 |
    | `plugin-sdk/channel-envelope`、`plugin-sdk/channel-inbound-roots`、`plugin-sdk/channel-location`、`plugin-sdk/channel-logging` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性門面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果型別 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助函式，以及為外掛相容性保留的已棄用原生結構描述輔助函式 |
    | `plugin-sdk/channel-route` | 共用路由正規化、由剖析器驅動的目標解析、討論串 ID 字串化、去重／精簡路由鍵、已剖析目標型別，以及路由／目標比較輔助函式 |
    | `plugin-sdk/channel-targets` | 目標剖析輔助函式；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道合約型別 |
    | `plugin-sdk/channel-feedback` | 意見回饋／反應接線 |
  </Accordion>

已棄用的頻道輔助工具系列僅為了與已發布的外掛相容而保留。移除計畫如下：在外部外掛遷移期間持續保留，儲存庫／內建外掛則持續使用 `channel-inbound` 和 `channel-outbound`，接著在下一次 SDK 重大清理中移除相容性子路徑。這適用於舊版頻道訊息／執行階段、頻道串流、直接私訊存取、分拆的入站輔助工具、回覆選項及配對路徑系列。

  <Accordion title="供應商子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 供應商門面，用於設定、目錄探索及執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段門面，用於本機伺服器預設值、模型探索、請求標頭及已載入模型的輔助函式 |
    | `plugin-sdk/provider-setup` | 精選的本機／自行託管供應商設定輔助函式 |
    | `plugin-sdk/self-hosted-provider-setup` | 已淘汰的 OpenAI 相容自行託管設定輔助函式；請使用 `plugin-sdk/provider-setup` 或外掛擁有的設定輔助函式 |
    | `plugin-sdk/cli-backend` | 命令列介面後端預設值與監看程式常數 |
    | `plugin-sdk/provider-auth-runtime` | 供應商驗證執行階段輔助函式：OAuth 回送流程、權杖交換、驗證持久化及 API 金鑰解析 |
    | `plugin-sdk/provider-oauth-runtime` | 通用供應商 OAuth 回呼型別、回呼頁面轉譯、PKCE／狀態輔助函式、授權輸入剖析、權杖到期輔助函式及中止輔助函式 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰上線導引／設定檔寫入輔助函式，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 供應商驗證環境變數查詢輔助函式 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助函式、已淘汰的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、供應商端點輔助函式及共用模型 ID 正規化輔助函式 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用於受防護的 `/models` 樣式探索之即時供應商模型目錄輔助函式：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取及靜態備援 |
    | `plugin-sdk/provider-catalog-runtime` | 供應商目錄擴充執行階段掛鉤，以及用於契約測試的外掛供應商登錄介面 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用供應商 HTTP／端點能力輔助函式、供應商 HTTP 錯誤及音訊轉錄多部分表單輔助函式 |
    | `plugin-sdk/provider-web-fetch-contract` | 範圍精簡的網頁擷取設定／選擇契約輔助函式，例如 `enablePluginInConfig` 與 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取供應商註冊／快取輔助函式 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要外掛啟用接線之供應商的範圍精簡網頁搜尋設定／認證資訊輔助函式 |
    | `plugin-sdk/provider-web-search-contract` | 範圍精簡的網頁搜尋設定／認證資訊契約輔助函式，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定範圍的認證資訊設定器／取得器 |
    | `plugin-sdk/provider-web-search` | 網頁搜尋供應商註冊／快取／執行階段輔助函式 |
    | `plugin-sdk/embedding-providers` | 通用嵌入供應商型別及讀取輔助函式，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 與 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊供應商，以強制執行資訊清單擁有權 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI 結構描述清理與診斷 |
    | `plugin-sdk/provider-usage` | 供應商用量快照型別、共用用量擷取輔助函式及供應商擷取器，例如 `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別、純文字工具呼叫相容性，以及共用 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI 包裝器輔助函式 |
    | `plugin-sdk/provider-stream-shared` | 公開的共用供應商串流包裝器輔助函式，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic／DeepSeek／OpenAI 相容串流公用程式 |
    | `plugin-sdk/provider-transport-runtime` | 原生供應商傳輸輔助函式，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 上線導引設定修補輔助函式 |
    | `plugin-sdk/global-singleton` | 程序本機單例／映射／快取輔助函式 |
    | `plugin-sdk/group-activation` | 範圍精簡的群組啟用模式及命令剖析輔助函式 |
  </Accordion>

供應商用量快照通常會回報一或多個配額 `windows`，每個項目都包含
標籤、已使用百分比及選用的重設時間。對於公開餘額或
帳戶狀態文字，而非可重設配額期間的供應商，應回傳
`summary` 並使用空的 `windows` 陣列，而非虛構百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；僅在
用量端點失敗或未回傳可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已淘汰的廣泛命令授權介面（`resolveControlCommandGate`、命令登錄輔助函式，包括動態引數選單格式化、傳送者授權輔助函式）；請使用頻道輸入／執行階段授權或命令狀態輔助函式 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 與 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析及相同聊天動作驗證輔助函式 |
    | `plugin-sdk/approval-client-runtime` | 原生執行核准設定檔／篩選輔助函式 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准閘道解析器 |
    | `plugin-sdk/approval-reference-runtime` | 用於傳輸受限核准回呼的確定性持久定位器輔助函式 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用於高頻頻道進入點的輕量原生核准配接器載入輔助函式 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理常式執行階段輔助函式；當較精簡的配接器／閘道介面已足夠時，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶繫結、路由閘門、轉送備援及本機原生執行提示抑制輔助函式 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼的核准反應繫結、反應提示承載資料、反應目標儲存區、反應提示文字輔助函式，以及本機原生執行提示抑制的相容性匯出 |
    | `plugin-sdk/approval-reply-runtime` | 執行／外掛核准回覆承載資料輔助函式 |
    | `plugin-sdk/approval-runtime` | 執行／外掛核准承載資料輔助函式、核准能力建構器、核准驗證／設定檔輔助函式、原生核准路由／執行階段輔助函式，以及結構化核准顯示輔助函式，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 已淘汰的範圍精簡傳入回覆重複資料刪除重設輔助函式 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化及原生工作階段目標輔助函式 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助函式 |
    | `plugin-sdk/command-primitives-runtime` | 用於高頻頻道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化及命令介面輔助函式 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 用於私人頻道及 Web UI 裝置代碼配對的延遲供應商驗證登入流程輔助函式 |
    | `plugin-sdk/channel-secret-runtime` | 已淘汰的廣泛機密契約介面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、機密目標型別）；請優先使用下方的專用子路徑 |
    | `plugin-sdk/channel-secret-basic-runtime` | 用於非 TTS 頻道／外掛機密介面的範圍精簡機密契約匯出及目標登錄建構器 |
    | `plugin-sdk/channel-secret-tts-runtime` | 範圍精簡的巢狀頻道 TTS 機密指派輔助函式 |
    | `plugin-sdk/secret-ref-runtime` | 用於機密契約／設定剖析的範圍精簡 SecretRef 型別、解析及計畫目標路徑查詢 |
    | `plugin-sdk/secret-provider-integration` | 僅含型別的 SecretRef 供應商整合資訊清單及預設契約，供發布外部機密供應商預設的外掛使用 |
    | `plugin-sdk/security-runtime` | 已淘汰的廣泛匯出桶，涵蓋信任、私訊閘門、根目錄範圍限定的檔案／路徑輔助函式，包括僅建立寫入、同步／非同步不可分割檔案取代、同層暫存寫入、跨裝置移動備援、私有檔案儲存區輔助函式、符號連結父目錄防護、外部內容、敏感文字遮蔽、固定時間機密比較及機密收集輔助函式；請優先使用專用的安全性／SSRF／機密子路徑 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單及私人網路 SSRF 政策輔助函式 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎架構執行階段介面的範圍精簡固定分派器輔助函式 |
    | `plugin-sdk/ssrf-runtime` | 固定分派器、受 SSRF 防護的擷取、SSRF 錯誤及 SSRF 政策輔助函式 |
    | `plugin-sdk/secret-input` | 機密輸入剖析輔助函式 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子請求／目標輔助函式，以及原始 WebSocket／本文強制轉型 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助函式 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/runtime` | 執行階段／記錄／備份輔助工具、外掛安裝路徑警告及處理程序輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試及退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定門面，用於正規化的設定檔／預設值、CDP URL 剖析及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 適用於使用主機核發工作範圍之工具框架支援代理程式的通用工作生命週期與完成傳遞輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 保留的內建 Codex 輔助工具，用於將使用者 MCP 伺服器設定投影至 Codex 執行緒設定；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 儲存庫本機的內建 Codex 輔助工具，用於原生工作鏡像／執行階段接線；不是套件匯出項目 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段內容註冊與查詢輔助工具 |
    | `plugin-sdk/matrix` | 適用於較舊第三方頻道套件的已棄用 Matrix 相容性門面；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 適用於較舊第三方頻道套件的已棄用 Mattermost 相容性門面；新外掛應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 適用於外掛命令／掛鉤／HTTP／互動式輔助工具的已棄用廣泛匯出入口；建議使用聚焦的外掛執行階段子路徑 |
    | `plugin-sdk/hook-runtime` | 適用於網路鉤子／內部掛鉤管線輔助工具的已棄用廣泛匯出入口；建議使用聚焦的掛鉤／外掛執行階段子路徑 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入／繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 及 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 處理程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | 適用於命令列介面格式化、等待、版本、引數叫用及延遲命令群組輔助工具的已棄用廣泛匯出入口；建議使用聚焦的命令列介面／執行階段子路徑 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共用即時傳輸 QA 情境 ID、基準涵蓋範圍輔助工具及情境選取輔助工具 |
    | `plugin-sdk/qa-runner-runtime` | 透過命令列介面命令介面公開外掛 QA 情境的支援門面 |
    | `plugin-sdk/tts-runtime` | 文字轉語音設定結構描述與執行階段輔助工具的支援門面 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法分派輔助工具，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由使用 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、事件迴圈就緒的用戶端啟動輔助工具、閘道命令列介面 RPC、閘道通訊協定錯誤、公告的 LAN 主機解析及頻道狀態修補輔助工具 |
    | `plugin-sdk/config-contracts` | 聚焦的純型別設定介面，用於 `OpenClawConfig` 等外掛設定形狀及頻道／提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段外掛設定輔助工具，例如 `mergeDeep`、`requireRuntimeConfig`、`resolvePluginConfigObject` 及 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 及 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共用訊息工具傳遞中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前處理程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 及測試快照設定器 |
    | `plugin-sdk/text-autolink-runtime` | 不透過廣泛文字匯出入口的檔案參照自動連結偵測 |
    | `plugin-sdk/reply-runtime` | 共用傳入／回覆執行階段輔助工具、分塊、分派、心跳偵測、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派／完成及對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間窗回覆歷程輔助工具。新的訊息回合程式碼應使用 `createChannelHistoryWindow`；較低階的映射輔助工具僅保留為已棄用的相容性匯出項目 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字／Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修復／生命週期輔助工具（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、過渡期 `sessionFile` 值的標記輔助工具、依工作階段身分進行有界限的近期使用者／助理逐字稿文字讀取、工作階段儲存區路徑／工作階段索引鍵輔助工具及更新時間讀取，不包含廣泛的設定寫入／維護匯入 |
    | `plugin-sdk/session-transcript-runtime` | 逐字稿身分、具範圍的目標／讀取／寫入輔助工具、可見訊息項目投影、更新發布、寫入鎖及逐字稿記憶體命中索引鍵 |
    | `plugin-sdk/sqlite-runtime` | 適用於第一方執行階段的聚焦 SQLite 代理程式結構描述、路徑及交易輔助工具，不含資料庫生命週期控制 |
    | `plugin-sdk/cron-store-runtime` | 排程儲存區路徑／載入／儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態／OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 外掛側車 SQLite 鍵控狀態型別，以及供外掛擁有之資料庫使用的集中式連線 pragma 與 WAL 維護設定 |
    | `plugin-sdk/routing` | 路由／工作階段索引鍵／帳戶繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 及 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道／帳戶狀態摘要輔助工具、執行階段狀態預設值及問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug／字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從類似 fetch／request 的輸入中擷取字串 URL |
    | `plugin-sdk/run-command` | 具計時功能的命令執行器，提供正規化的 stdout／stderr 結果 |
    | `plugin-sdk/param-readers` | 通用工具／命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡單的具型別代理程式工具外掛，並公開靜態中繼資料以產生資訊清單 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化承載資料 |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/sandbox` | 沙箱後端型別及 SSH／OpenShell 命令輔助工具，包括快速失敗的執行命令預檢 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具及私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器及遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式及轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型／工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 及 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取／寫入輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 將不安全整數常值保留為字串的 JSON 剖析輔助工具 |
    | `plugin-sdk/file-lock` | 可重新進入的檔案鎖定輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段／工作階段及回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 適用於啟動時載入之外掛的輕量 ACP 後端註冊及回覆分派輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不匯入生命週期啟動模組的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 已棄用的代理程式執行階段設定結構描述基本元件；請從維護中的外掛自有介面匯入結構描述基本元件 |
    | `plugin-sdk/boolean-param` | 寬鬆的布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動與配對權杖輔助工具，包括 `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態及環境代理輔助基本元件 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令／提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令清單輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄／建置／序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 適用於低階代理程式工具框架的實驗性受信任外掛介面：工具框架型別、作用中執行導引／中止輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具原則輔助工具、終端結果分類、工具進度格式化／詳細資料輔助工具及嘗試結果公用工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已棄用的 Z.AI 提供者自有端點偵測門面；請使用 Z.AI 外掛公開 API |
    | `plugin-sdk/async-lock-runtime` | 適用於小型執行階段狀態檔案的處理程序本機非同步鎖定輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界限的非同步工作並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內及持久性後端支援的去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 傳出待傳遞項目排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全的本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 心跳偵測喚醒、事件及可見性輔助工具 |
    | `plugin-sdk/expect-runtime` | 用於可證明執行階段不變條件的必要值斷言輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉型輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖／UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | 不透過廣泛基礎架構執行階段匯出入口的執行核准原則檔案輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性墊片；請使用上述聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界限快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件及追蹤內容輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包裝的 fetch、代理、EnvHttpProxyAgent 選項及固定查詢輔助工具 |
    | `plugin-sdk/runtime-fetch` | 可感知分派器的執行階段 fetch，不匯入代理／受保護 fetch 模組 |
    | `plugin-sdk/inline-image-data-url-runtime` | 內嵌圖片資料 URL 清理器及簽章嗅探輔助工具，不透過廣泛媒體執行階段介面 |
    | `plugin-sdk/response-limit-runtime` | 有界限的回應本文讀取器，不透過廣泛媒體執行階段介面 |
    | `plugin-sdk/session-binding-runtime` | 目前的對話繫結狀態，不含已設定的繫結路由或配對儲存區 |
    | `plugin-sdk/context-visibility-runtime` | 內容可見性解析及補充內容篩選，不匯入廣泛設定／安全性模組 |
    | `plugin-sdk/string-coerce-runtime` | 精簡的基本記錄／字串強制轉型及正規化輔助工具，不匯入 Markdown／記錄模組 |
    | `plugin-sdk/html-entity-runtime` | 單次處理、以分號結尾的 HTML5 實體解碼，不透過廣泛文字公用工具 |
    | `plugin-sdk/text-utility-runtime` | 低階文字及路徑輔助工具，包括五種實體的 HTML 跳脫 |
    | `plugin-sdk/host-runtime` | 主機名稱及 SCP 主機正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定及重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 適用於代理程式目錄／身分／工作區輔助工具的已棄用廣泛匯出入口，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 及已棄用的 `resolveOpenClawAgentDir` 相容性匯出項目；建議使用聚焦的代理程式／執行階段子路徑 |
    | `plugin-sdk/directory-runtime` | 設定支援的目錄查詢／去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力與測試子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已淘汰的廣泛媒體匯出入口，包含 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`，以及已淘汰的 `fetchRemoteMedia`；請優先使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 和能力執行階段子路徑；若 URL 應轉換為 OpenClaw 媒體，請先使用儲存區輔助函式，再讀取緩衝區 |
    | `plugin-sdk/media-mime` | 範圍明確的 MIME 正規化、副檔名對應、MIME 偵測和媒體類型輔助函式 |
    | `plugin-sdk/media-store` | 範圍明確的媒體儲存區輔助函式，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共用的媒體生成容錯移轉輔助函式、候選項目選取，以及模型缺失訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解供應商型別，以及面向供應商的圖片、音訊和結構化擷取輔助函式匯出項目 |
    | `plugin-sdk/text-chunking` | 傳出文字與保留位移的範圍分塊、Markdown 分塊／轉譯輔助函式、可辨識引號的 HTML 標籤詞元化、Markdown 表格轉換、指令標籤移除，以及安全文字公用工具 |
    | `plugin-sdk/speech` | 語音供應商型別，以及面向供應商的指令、登錄檔、驗證、OpenAI 相容 TTS 建構器和語音輔助函式匯出項目 |
    | `plugin-sdk/speech-core` | 共用的語音供應商型別、登錄檔、指令、正規化和語音輔助函式匯出項目 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄供應商型別、登錄檔輔助函式和共用 WebSocket 工作階段輔助函式 |
    | `plugin-sdk/realtime-bootstrap-context` | 即時設定檔啟動輔助函式，用於有界的 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 上下文注入 |
    | `plugin-sdk/realtime-voice` | 即時語音供應商型別、登錄檔輔助函式，以及共用的即時語音行為輔助函式，包括輸出活動追蹤 |
    | `plugin-sdk/image-generation` | 圖片生成供應商型別，以及圖片資產／資料 URL 輔助函式和 OpenAI 相容圖片供應商建構器 |
    | `plugin-sdk/image-generation-core` | 共用的圖片生成型別、容錯移轉、驗證和登錄檔輔助函式 |
    | `plugin-sdk/music-generation` | 音樂生成供應商／要求／結果型別 |
    | `plugin-sdk/music-generation-core` | 已淘汰的共用音樂生成型別、容錯移轉輔助函式、供應商查詢和模型參照解析；請優先使用外掛擁有的音樂供應商介面 |
    | `plugin-sdk/video-generation` | 影片生成供應商／要求／結果型別 |
    | `plugin-sdk/video-generation-core` | 共用的影片生成型別、容錯移轉輔助函式、供應商查詢和模型參照解析 |
    | `plugin-sdk/transcripts` | 共用的逐字稿來源供應商型別、登錄檔輔助函式、工作階段描述元和語句中繼資料 |
    | `plugin-sdk/webhook-targets` | 網路鉤子目標登錄檔和路由安裝輔助函式 |
    | `plugin-sdk/webhook-path` | 已淘汰的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共用的遠端／本機媒體載入輔助函式 |
    | `plugin-sdk/zod` | 已淘汰的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 僅供儲存庫內舊版 OpenClaw 測試使用的已淘汰相容性匯出入口。新的儲存庫測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 僅供儲存庫內使用的最小 `createTestPluginApi` 輔助函式，適用於不匯入儲存庫測試輔助橋接層的直接外掛註冊單元測試 |
    | `plugin-sdk/agent-runtime-test-contracts` | 僅供儲存庫內使用的原生代理程式執行階段轉接器合約測試資料，用於驗證、傳遞、備援、工具掛鉤、提示詞覆疊、結構描述和逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 僅供儲存庫內使用的頻道導向測試輔助函式，涵蓋通用動作／設定／狀態合約、目錄判斷提示、帳號啟動生命週期、傳送設定串接、執行階段模擬、狀態問題、傳出傳遞和掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 僅供儲存庫內頻道測試使用的共用目標解析錯誤案例套件 |
    | `plugin-sdk/channel-contract-testing` | 僅供儲存庫內使用的範圍明確頻道合約測試輔助函式，不使用廣泛的測試匯出入口 |
    | `plugin-sdk/plugin-test-contracts` | 僅供儲存庫內使用的外掛套件、註冊、公開成品、直接匯入、執行階段 API 和匯入副作用合約輔助函式 |
    | `plugin-sdk/plugin-state-test-runtime` | 僅供儲存庫內使用的外掛狀態儲存區、傳入佇列和狀態資料庫測試輔助函式 |
    | `plugin-sdk/provider-test-contracts` | 僅供儲存庫內使用的供應商執行階段、驗證、探索、導入、目錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網路搜尋／擷取和串流合約輔助函式 |
    | `plugin-sdk/provider-http-test-mocks` | 僅供儲存庫內使用的選用 Vitest HTTP／驗證模擬，適用於會執行 `plugin-sdk/provider-http` 的供應商測試 |
    | `plugin-sdk/reply-payload-testing` | 僅供儲存庫內使用的輔助函式，用於將中繼資料附加至回覆承載內容測試資料 |
    | `plugin-sdk/sqlite-runtime-testing` | 僅供儲存庫內第一方測試使用的 SQLite 生命週期輔助函式 |
    | `plugin-sdk/test-fixtures` | 僅供儲存庫內使用的通用命令列介面執行階段擷取、沙箱上下文、Skill 寫入器、代理程式訊息、系統事件、模組重新載入、內建外掛路徑、終端文字、分塊、驗證權杖和具型別案例測試資料 |
    | `plugin-sdk/test-node-mocks` | 僅供儲存庫內使用的聚焦 Node 內建模組模擬輔助函式，用於 Vitest `vi.mock("node:*")` 工廠函式內 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 已淘汰的相容性別名；請使用 `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | 已淘汰的記憶體索引／搜尋執行階段介面；請優先使用不限定供應商的記憶體主機子路徑 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 輕量的記憶體嵌入供應商登錄檔輔助函式 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶體主機嵌入合約、登錄檔存取、本機供應商和通用批次／遠端輔助函式。此介面上的 `registerMemoryEmbeddingProvider` 已淘汰；新供應商請使用通用嵌入供應商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶體主機 QMD 引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶體主機儲存引擎匯出項目 |
    | `plugin-sdk/memory-core-host-multimodal` | 已淘汰的記憶體主機多模態輔助函式；請優先使用不限定供應商的記憶體主機子路徑 |
    | `plugin-sdk/memory-core-host-query` | 已淘汰的記憶體主機查詢輔助函式；請優先使用不限定供應商的記憶體主機子路徑 |
    | `plugin-sdk/memory-core-host-secret` | 記憶體主機祕密輔助函式 |
    | `plugin-sdk/memory-core-host-events` | 已淘汰的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶體主機狀態輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶體主機命令列介面執行階段輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶體主機核心執行階段輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶體主機檔案／執行階段輔助函式 |
    | `plugin-sdk/memory-host-core` | 記憶體主機核心執行階段輔助函式的不限定供應商別名 |
    | `plugin-sdk/memory-host-events` | 記憶體主機事件日誌輔助函式的不限定供應商別名 |
    | `plugin-sdk/memory-host-files` | 已淘汰的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 供記憶體相關外掛使用的共用受管理 Markdown 輔助函式 |
    | `plugin-sdk/memory-host-search` | 供存取搜尋管理器使用的主動記憶執行階段介面 |
    | `plugin-sdk/memory-host-status` | 已淘汰的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的內建輔助函式子路徑">
    保留的內建輔助函式 SDK 子路徑，是供內建外掛程式碼使用且範圍明確的擁有者專屬介面。SDK 詳細目錄會追蹤這些子路徑，讓套件建置與別名處理維持確定性，但它們並非一般的外掛開發 API。新的可重複使用主機合約應採用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime` 和
    `plugin-sdk/plugin-config-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 內建 Codex 外掛輔助函式，用於將使用者的 MCP 伺服器設定投影至 Codex 應用程式伺服器執行緒設定（保留的套件匯出項目） |
    | `plugin-sdk/codex-native-task-runtime` | 內建 Codex 外掛輔助函式，用於將 Codex 應用程式伺服器的原生子代理程式鏡像至 OpenClaw 任務狀態（僅限儲存庫內使用，不是套件匯出項目） |

  </Accordion>
</AccordionGroup>

## 相關內容

- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

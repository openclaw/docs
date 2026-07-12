---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核內建外掛子路徑與輔助介面
summary: 外掛 SDK 子路徑目錄：依領域分組說明各項匯入所在位置
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-12T14:47:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4ad11615c889a6a692c243f321612050388a647975b2075376e7c787df933ff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 以一組精簡的公開子路徑形式，公開於
`openclaw/plugin-sdk/` 下。本頁依用途分組，列出常用的子路徑。以下三個檔案定義此介面：

- `scripts/lib/plugin-sdk-entrypoints.json`：由維護者管理、供建置編譯的進入點清單。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：僅供儲存庫本機
  測試／內部使用的子路徑。套件匯出項目為清單扣除此列表。
- `src/plugin-sdk/entrypoints.ts`：已棄用子路徑、保留的隨附輔助工具、支援的隨附門面，以及
  外掛擁有之公開介面的分類中繼資料。

維護者使用 `pnpm plugin-sdk:surface` 稽核公開匯出項目數量，並使用
`pnpm plugins:boundary-report:summary` 稽核使用中的保留輔助工具子路徑；
未使用的保留輔助工具匯出項目會導致 CI 報告失敗，而不會繼續留在
公開 SDK 中成為閒置的相容性技術債。

如需外掛撰寫指南，請參閱[外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                         | 主要匯出項目                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具及 `summarizeMigrationItems`                                                                                      |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime` 及 `writeMigrationReport`                                                       |
| `plugin-sdk/health`            | 供隨附健康狀態使用端使用的 Doctor 健康檢查註冊、偵測、修復、選取、嚴重性及發現項目型別                                                                                                                  |
| `plugin-sdk/config-schema`     | 已棄用。根層級 `openclaw.json` Zod 綱要（`OpenClawSchema`）；請改為定義外掛本機綱要，並使用 `plugin-sdk/json-schema-runtime` 驗證                                                                        |

### 已棄用的相容性與測試輔助工具

已棄用的子路徑仍會匯出以供舊版外掛使用，但新程式碼應使用下方聚焦特定用途的
SDK 子路徑。維護的清單位於
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕隨附的
正式環境程式碼從中匯入。`plugin-sdk/compat`、
`plugin-sdk/config-types`、`plugin-sdk/infra-runtime` 及
`plugin-sdk/text-runtime` 等廣泛彙整匯出僅供相容性用途，而 `plugin-sdk/zod` 是
相容性重新匯出：請直接從 `zod` 匯入 `zod`。廣泛的領域
彙整匯出 `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、
`plugin-sdk/channel-runtime`、`plugin-sdk/cli-runtime`、
`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、
`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime` 及
`plugin-sdk/security-runtime` 同樣已棄用，請改用聚焦特定用途的
子路徑。

OpenClaw 以 Vitest 為基礎的測試輔助工具子路徑僅供儲存庫本機使用，且已不再是
套件匯出項目：`agent-runtime-test-contracts`、
`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、
`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、
`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、
`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、
`test-node-mocks` 及 `testing`。私有的隨附輔助工具介面
`ssrf-runtime-internal` 與 `codex-native-task-runtime` 也僅供儲存庫本機
使用。

### 保留的隨附外掛輔助工具子路徑

`plugin-sdk/codex-mcp-projection` 是唯一保留的子路徑：這是由外掛擁有、
供隨附 Codex 外掛使用的相容性介面，而非通用的 SDK API。
套件契約防護機制會封鎖跨擁有者的外掛匯入，而當保留的子路徑不再被匯入時，
CI 便會失敗。
`plugin-sdk/codex-native-task-runtime` 僅供儲存庫本機使用，並非套件
匯出項目。

`src/plugin-sdk/entrypoints.ts` 也會追蹤支援的隨附門面，也就是在通用契約取代
它們之前，由對應隨附外掛提供實作的 SDK 進入點：`plugin-sdk/discord`、
`plugin-sdk/lmstudio`、`plugin-sdk/lmstudio-runtime`、
`plugin-sdk/matrix`、`plugin-sdk/mattermost`、
`plugin-sdk/memory-core-engine-runtime`、`plugin-sdk/provider-zai-endpoint`、
`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`、
`plugin-sdk/tts-runtime` 及 `plugin-sdk/zalouser`。其中數個也已不建議用於
新程式碼；請參閱下方各列的註記。

<AccordionGroup>
  <Accordion title="頻道子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | 用於外掛所擁有結構描述的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定翻譯器、允許清單提示及設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定／動作閘門輔助工具、預設帳號後援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查詢與預設後援輔助工具 |
    | `plugin-sdk/account-helpers` | 範圍精簡的帳號清單／帳號動作輔助工具 |
    | `plugin-sdk/access-groups` | 存取群組允許清單剖析與遮蔽群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定結構描述基礎元件，以及 Zod 和直接 JSON／TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的隨附外掛使用的隨附 OpenClaw 頻道設定結構描述 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準隨附／官方聊天頻道 ID，以及供需要辨識帶信封前綴文字、但不必硬編碼自有對照表的外掛使用的格式化工具標籤／別名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 隨附頻道設定結構描述的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | 已棄用的 Telegram 命令名稱／說明正規化與重複／衝突檢查；新的外掛程式碼請改用外掛本機的命令設定處理 |
    | `plugin-sdk/command-gating` | 範圍精簡的命令授權閘門輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 低階頻道輸入相容性介面。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性的高階頻道輸入執行階段解析器，以及供已遷移頻道接收路徑使用的路由事實建構器。請優先使用此介面，不要在每個外掛中分別組裝有效允許清單、命令允許清單及舊版投影。請參閱[頻道輸入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期合約，以及回覆管線選項、回條、即時預覽／串流、生命週期輔助工具、輸出身分、承載資料規劃、持久傳送與訊息傳送內容輔助工具。請參閱[頻道輸出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，另含舊版回覆分派介面。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，另含舊版回覆分派介面。 |
    | `plugin-sdk/inbound-envelope` | 共用輸入路由與信封建構輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性介面。輸入執行器與分派述詞請使用 `plugin-sdk/channel-inbound`，訊息傳遞輔助工具則請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標剖析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共用輸出媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 範圍精簡的投票正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 討論串繫結生命週期與轉接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 代理程式媒體承載資料根目錄與載入器 |
    | `plugin-sdk/conversation-runtime` | 已棄用的廣泛匯出入口，涵蓋對話／討論串繫結、配對及已設定繫結輔助工具；請優先使用聚焦的繫結子路徑，例如 `plugin-sdk/thread-bindings-runtime` 和 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組原則解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照／摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 範圍精簡的頻道設定結構描述基礎元件 |
    | `plugin-sdk/channel-config-writes` | 頻道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道外掛前置匯出項目 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯／讀取輔助工具 |
    | `plugin-sdk/group-access` | 已棄用的群組存取決策輔助工具；請使用 `plugin-sdk/channel-ingress-runtime` 的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 範圍精簡的直接私訊加密前防護原則輔助工具 |
    | `plugin-sdk/discord` | 為已發布的 `@openclaw/discord@2026.3.13` 與受追蹤擁有者相容性保留的已棄用 Discord 相容性介面；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 為受追蹤擁有者相容性保留的已棄用 Telegram 帳號解析相容性介面；新外掛應使用注入的執行階段輔助工具或通用頻道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 為仍匯入傳送者命令授權的已發布 Lark／Zalo 套件保留的已棄用 Zalo Personal 相容性介面；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、傳遞及舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用於事件分類、內容建構、格式化、根目錄、防彈跳、提及比對、提及原則及輸入記錄的共用輸入輔助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 範圍精簡的輸入防彈跳輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 不含較廣泛輸入執行階段介面的範圍精簡提及原則、提及標記及提及文字輔助工具 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果類型 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助工具，以及為外掛相容性保留的已棄用原生結構描述輔助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、剖析器驅動的目標解析、討論串 ID 字串化、去重／精簡路由鍵、已剖析目標類型，以及路由／目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 目標剖析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道合約類型 |
    | `plugin-sdk/channel-feedback` | 意見回饋／反應連接 |
  </Accordion>

已棄用的頻道輔助工具系列僅為已發布外掛的相容性而保留。移除計畫如下：在外部外掛遷移期間持續保留，讓儲存庫內／隨附外掛維持使用 `channel-inbound` 和 `channel-outbound`，然後在下一次 SDK 主要清理中移除這些相容性子路徑。這適用於舊版頻道訊息／執行階段、頻道串流、直接私訊存取、分拆的輸入輔助工具、回覆選項及配對路徑系列。

  <Accordion title="供應商子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 供應商外觀介面，用於設定、目錄探索及執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段外觀介面，用於本機伺服器預設值、模型探索、請求標頭及已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機／自行託管供應商設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 已棄用的 OpenAI 相容自行託管設定輔助工具；請使用 `plugin-sdk/provider-setup` 或由外掛擁有的設定輔助工具 |
    | `plugin-sdk/cli-backend` | 命令列介面後端預設值 + 看門狗常數 |
    | `plugin-sdk/provider-auth-runtime` | 供應商驗證執行階段輔助工具：OAuth 回送流程、權杖交換、驗證持久化及 API 金鑰解析 |
    | `plugin-sdk/provider-oauth-runtime` | 通用供應商 OAuth 回呼型別、回呼頁面呈現、PKCE／狀態輔助工具、授權輸入剖析、權杖到期輔助工具及中止輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰上線／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 供應商驗證環境變數查詢輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助工具、已棄用的 `resolveOpenClawAgentDir` 相容性匯出項目 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播原則建構器、供應商端點輔助工具及共用模型 ID 正規化輔助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用於受防護的 `/models` 類型探索之即時供應商模型目錄輔助工具：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取及靜態備援 |
    | `plugin-sdk/provider-catalog-runtime` | 供應商目錄增補執行階段掛鉤，以及供契約測試使用的外掛供應商登錄介面 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用供應商 HTTP／端點能力輔助工具、供應商 HTTP 錯誤及音訊轉錄多部分表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡的網頁擷取設定／選擇契約輔助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 網頁擷取供應商註冊／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要外掛啟用接線之供應商的精簡網頁搜尋設定／認證資訊輔助工具 |
    | `plugin-sdk/provider-web-search-contract` | 精簡的網頁搜尋設定／認證資訊契約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍限制的認證資訊設定器／取得器 |
    | `plugin-sdk/provider-web-search` | 網頁搜尋供應商註冊／快取／執行階段輔助工具 |
    | `plugin-sdk/embedding-providers` | 一般嵌入供應商型別及讀取輔助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊供應商，以強制執行資訊清單擁有權 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI 結構描述清理 + 診斷 |
    | `plugin-sdk/provider-usage` | 供應商用量快照型別、共用用量擷取輔助工具，以及 `fetchClaudeUsage` 等供應商擷取器 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝函式型別、純文字工具呼叫相容性，以及共用 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI 包裝輔助工具 |
    | `plugin-sdk/provider-stream-shared` | 公開的共用供應商串流包裝輔助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic／DeepSeek／OpenAI 相容串流公用工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生供應商傳輸輔助工具，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 上線設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 程序本機單例／映射／快取輔助工具 |
    | `plugin-sdk/group-activation` | 精簡的群組啟用模式及命令剖析輔助工具 |
  </Accordion>

供應商用量快照通常會回報一或多個配額 `windows`，每個項目都包含
標籤、已使用百分比，以及選用的重設時間。若供應商公開的是餘額或
帳戶狀態文字，而非可重設的配額時段，則應傳回
`summary` 及空白的 `windows` 陣列，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；只有在
用量端點失敗或未傳回可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已棄用的廣泛命令授權介面（`resolveControlCommandGate`、命令登錄輔助工具，包括動態引數選單格式化、傳送者授權輔助工具）；請使用頻道入口／執行階段授權或命令狀態輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析及同一聊天中的動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生執行核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准閘道解析器 |
    | `plugin-sdk/approval-reference-runtime` | 用於傳輸受限核准回呼的確定性持久定位器輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 適用於高頻頻道進入點的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理常式執行階段輔助工具；當較精簡的配接器／閘道介面已足夠時，應優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶繫結、路由閘門、轉送備援及本機原生執行提示抑制輔助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼的核准表情符號回應繫結、表情符號回應提示承載資料、表情符號回應目標儲存區、表情符號回應提示文字輔助工具，以及本機原生執行提示抑制的相容性匯出項目 |
    | `plugin-sdk/approval-reply-runtime` | 執行／外掛核准回覆承載資料輔助工具 |
    | `plugin-sdk/approval-runtime` | 執行／外掛核准承載資料輔助工具、核准能力建構器、核准驗證／設定檔輔助工具、原生核准路由／執行階段輔助工具，以及 `formatApprovalDisplayPath` 等結構化核准顯示輔助工具 |
    | `plugin-sdk/reply-dedupe` | 已棄用的精簡傳入回覆去重重設輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 適用於高頻頻道路徑的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 命令本文正規化及命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 適用於私人頻道及網頁介面裝置代碼配對的延遲載入供應商驗證登入流程輔助工具 |
    | `plugin-sdk/channel-secret-runtime` | 已棄用的廣泛機密契約介面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、機密目標型別）；請優先使用下方聚焦的子路徑 |
    | `plugin-sdk/channel-secret-basic-runtime` | 適用於非 TTS 頻道／外掛機密介面的精簡機密契約匯出項目 |
    | `plugin-sdk/channel-secret-tts-runtime` | 精簡的巢狀頻道 TTS 機密指派輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於機密契約／設定剖析的精簡 SecretRef 型別、解析及計畫目標路徑查詢 |
    | `plugin-sdk/secret-provider-integration` | 僅型別的 SecretRef 供應商整合資訊清單及預設契約，供發布外部機密供應商預設的外掛使用 |
    | `plugin-sdk/security-runtime` | 已棄用的廣泛匯出介面，涵蓋信任、私訊閘門、限制於根目錄內的檔案／路徑輔助工具（包括僅建立寫入）、同步／非同步原子檔案取代、同層暫存檔寫入、跨裝置移動備援、私有檔案儲存區輔助工具、符號連結父層防護、外部內容、敏感文字遮蔽、固定時間機密比較及機密收集輔助工具；請優先使用聚焦的安全性／SSRF／機密子路徑 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單及私人網路 SSRF 原則輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛基礎架構執行階段介面的精簡固定分派器輔助工具 |
    | `plugin-sdk/ssrf-runtime` | 固定分派器、受 SSRF 防護的擷取、SSRF 錯誤及 SSRF 原則輔助工具 |
    | `plugin-sdk/secret-input` | 機密輸入剖析輔助工具 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子請求／目標輔助工具，以及原始 WebSocket／本文強制轉型 |
    | `plugin-sdk/webhook-request-guards` | 請求本文大小／逾時輔助工具 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/runtime` | 執行階段／記錄／備份輔助工具、外掛安裝路徑警告與程序輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試與退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定門面，用於正規化的設定檔／預設值、CDP URL 剖析與瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 適用於使用主機核發之任務範圍、由測試框架支援的代理程式之通用任務生命週期與完成遞送輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 保留給內建 Codex 的輔助工具，用於將使用者 MCP 伺服器設定投影至 Codex 執行緒設定；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 儲存庫本機的內建 Codex 輔助工具，用於原生任務鏡像／執行階段接線；不是套件匯出項目 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段內容註冊與查詢輔助工具 |
    | `plugin-sdk/matrix` | 適用於較舊第三方頻道套件的已棄用 Matrix 相容性門面；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 適用於較舊第三方頻道套件的已棄用 Mattermost 相容性門面；新外掛應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 適用於外掛命令／鉤子／HTTP／互動式輔助工具的已棄用廣泛彙總匯出；建議使用聚焦的外掛執行階段子路徑 |
    | `plugin-sdk/hook-runtime` | 適用於網路鉤子／內部鉤子管線輔助工具的已棄用廣泛彙總匯出；建議使用聚焦的鉤子／外掛執行階段子路徑 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入／繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 與 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序執行輔助工具 |
    | `plugin-sdk/cli-runtime` | 適用於命令列介面格式化、等待、版本、引數叫用與延遲命令群組輔助工具的已棄用廣泛彙總匯出；建議使用聚焦的命令列介面／執行階段子路徑 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共用即時傳輸 QA 情境 ID、基準涵蓋範圍輔助工具與情境選擇輔助工具 |
    | `plugin-sdk/qa-runner-runtime` | 支援的門面，透過命令列介面命令介面公開外掛 QA 情境 |
    | `plugin-sdk/tts-runtime` | 支援的門面，用於文字轉語音設定結構描述與執行階段輔助工具 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法分派輔助工具，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由使用 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、事件迴圈就緒的用戶端啟動輔助工具、閘道命令列介面 RPC、閘道通訊協定錯誤、公告的 LAN 主機解析與頻道狀態修補輔助工具 |
    | `plugin-sdk/config-contracts` | 聚焦的僅型別設定介面，用於 `OpenClawConfig` 等外掛設定形狀與頻道／供應商設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 執行階段外掛設定查詢輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 與 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 與 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共用訊息工具遞送中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 與測試快照設定器 |
    | `plugin-sdk/text-autolink-runtime` | 無需廣泛文字彙總匯出的檔案參照自動連結偵測 |
    | `plugin-sdk/reply-runtime` | 共用傳入／回覆執行階段輔助工具、分塊、分派、心跳偵測與回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派／完成與對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間窗回覆歷程輔助工具。新的訊息輪次程式碼應使用 `createChannelHistoryWindow`；較低階的對應表輔助工具僅保留為已棄用的相容性匯出項目 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字／Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修復／生命週期輔助工具（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、過渡性 `sessionFile` 值的標記輔助工具、依工作階段身分進行有界限的近期使用者／助理逐字稿文字讀取、工作階段儲存路徑／工作階段鍵輔助工具，以及更新時間讀取，不包含廣泛的設定寫入／維護匯入 |
    | `plugin-sdk/session-transcript-runtime` | 逐字稿身分、具範圍的目標／讀取／寫入輔助工具、可見訊息項目投影、更新發布、寫入鎖與逐字稿記憶命中鍵 |
    | `plugin-sdk/sqlite-runtime` | 適用於第一方執行階段的聚焦 SQLite 代理程式結構描述、路徑與交易輔助工具，不包含資料庫生命週期控制 |
    | `plugin-sdk/cron-store-runtime` | 排程儲存路徑／載入／儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態／OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 外掛附屬 SQLite 鍵控狀態型別，以及外掛自有資料庫的集中式連線 pragma 與 WAL 維護設定 |
    | `plugin-sdk/routing` | 路由／工作階段鍵／帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 與 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道／帳號狀態摘要輔助工具、執行階段狀態預設值與問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug／字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 從類 fetch／request 輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具計時功能的命令執行器，提供正規化的 stdout／stderr 結果 |
    | `plugin-sdk/param-readers` | 通用工具／命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡易的具型別代理程式工具外掛，並公開靜態中繼資料以產生資訊清單 |
    | `plugin-sdk/tool-payload` | 從工具結果物件擷取正規化承載資料 |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/sandbox` | 沙箱後端型別與 SSH／OpenShell 命令輔助工具，包括快速失敗的 exec 命令預檢 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具與私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器與遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型／工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 與 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk 供應商設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取／寫入輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 將不安全整數常值保留為字串的 JSON 剖析輔助工具 |
    | `plugin-sdk/file-lock` | 可重入檔案鎖定輔助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的重複資料刪除快取輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段／工作階段與回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 適用於啟動時載入之外掛的輕量 ACP 後端註冊與回覆分派輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不匯入生命週期啟動模組的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 已棄用的代理程式執行階段設定結構描述基本元素；請從受維護的外掛自有介面匯入結構描述基本元素 |
    | `plugin-sdk/boolean-param` | 寬鬆的布林參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動安裝與配對權杖輔助工具，包括 `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態與環境代理輔助工具基本元素 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令／供應商回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列出輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄／建置／序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 適用於低階代理程式測試框架的實驗性受信任外掛介面：測試框架型別、作用中執行的引導／中止輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端結果分類、工具進度格式化／詳細資訊輔助工具與嘗試結果公用程式 |
    | `plugin-sdk/provider-zai-endpoint` | 已棄用的 Z.AI 供應商自有端點偵測門面；請使用 Z.AI 外掛公開 API |
    | `plugin-sdk/async-lock-runtime` | 適用於小型執行階段狀態檔案的程序本機非同步鎖定輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 有界限的非同步任務並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內與持久化後端的重複資料刪除快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 傳出待處理遞送排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全的本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 心跳偵測喚醒、事件與可見性輔助工具 |
    | `plugin-sdk/expect-runtime` | 適用於可證明執行階段不變條件的必要值斷言輔助工具 |
    | `plugin-sdk/number-runtime` | 數值強制轉型輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 安全權杖／UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 傳輸就緒等待輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | 不含廣泛 infra-runtime 彙總匯出的執行核准政策檔案輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性墊片；請使用上述聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界限快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件與追蹤內容輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 封裝的 fetch、代理、EnvHttpProxyAgent 選項與固定查詢輔助工具 |
    | `plugin-sdk/runtime-fetch` | 可感知分派器的執行階段 fetch，不匯入代理／受防護 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 不含廣泛媒體執行階段介面的內嵌影像資料 URL 清理與簽章探查輔助工具 |
    | `plugin-sdk/response-limit-runtime` | 不含廣泛媒體執行階段介面的有界限回應本文讀取器 |
    | `plugin-sdk/session-binding-runtime` | 目前對話繫結狀態，不包含已設定的繫結路由或配對儲存 |
    | `plugin-sdk/context-visibility-runtime` | 不匯入廣泛設定／安全性模組的內容可見性解析與補充內容篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不匯入 Markdown／記錄模組的精簡基本型別記錄／字串強制轉型與正規化輔助工具 |
    | `plugin-sdk/host-runtime` | 主機名稱與 SCP 主機正規化輔助工具 |
    | `plugin-sdk/retry-runtime` | 重試設定與重試執行器輔助工具 |
    | `plugin-sdk/agent-runtime` | 適用於代理程式目錄／身分／工作區輔助工具的已棄用廣泛彙總匯出，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 與已棄用的 `resolveOpenClawAgentDir` 相容性匯出；建議使用聚焦的代理程式／執行階段子路徑 |
    | `plugin-sdk/directory-runtime` | 由設定支援的目錄查詢／去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已棄用的廣泛媒體匯出集合，包含 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 與已棄用的 `fetchRemoteMedia`；請優先使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 及功能執行階段子路徑；當 URL 應轉為 OpenClaw 媒體時，請先使用儲存區輔助函式，再讀取緩衝區 |
    | `plugin-sdk/media-mime` | 精簡的 MIME 正規化、副檔名對應、MIME 偵測及媒體種類輔助函式 |
    | `plugin-sdk/media-store` | 精簡的媒體儲存區輔助函式，例如 `saveMediaBuffer` 與 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助函式、候選項目選擇及模型缺失訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解供應商類型，以及面向供應商的影像、音訊與結構化擷取輔助函式匯出項目 |
    | `plugin-sdk/text-chunking` | 傳出文字與 Markdown 分塊／算繪輔助函式、Markdown 表格轉換、指示標籤移除及安全文字公用工具 |
    | `plugin-sdk/speech` | 語音供應商類型，以及面向供應商的指示、登錄、驗證、OpenAI 相容 TTS 建構器與語音輔助函式匯出項目 |
    | `plugin-sdk/speech-core` | 共用語音供應商類型、登錄、指示、正規化及語音輔助函式匯出項目 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄供應商類型、登錄輔助函式及共用 WebSocket 工作階段輔助函式 |
    | `plugin-sdk/realtime-bootstrap-context` | 用於注入有界 `IDENTITY.md`、`USER.md` 與 `SOUL.md` 上下文的即時設定檔啟動輔助函式 |
    | `plugin-sdk/realtime-voice` | 即時語音供應商類型、登錄輔助函式及共用即時語音行為輔助函式，包括輸出活動追蹤 |
    | `plugin-sdk/image-generation` | 影像生成供應商類型、影像資產／資料 URL 輔助函式及 OpenAI 相容影像供應商建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成類型、容錯移轉、驗證及登錄輔助函式 |
    | `plugin-sdk/music-generation` | 音樂生成供應商／請求／結果類型 |
    | `plugin-sdk/music-generation-core` | 已棄用的共用音樂生成類型、容錯移轉輔助函式、供應商查詢及模型參照解析；請優先使用外掛自有的音樂供應商介面 |
    | `plugin-sdk/video-generation` | 影片生成供應商／請求／結果類型 |
    | `plugin-sdk/video-generation-core` | 共用影片生成類型、容錯移轉輔助函式、供應商查詢及模型參照解析 |
    | `plugin-sdk/transcripts` | 共用逐字稿來源供應商類型、登錄輔助函式、工作階段描述元及語句中繼資料 |
    | `plugin-sdk/webhook-targets` | 網路鉤子目標登錄與路由安裝輔助函式 |
    | `plugin-sdk/webhook-path` | 已棄用的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共用遠端／本機媒體載入輔助函式 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 儲存庫本機的已棄用相容性匯出集合，供舊版 OpenClaw 測試使用。新的儲存庫測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 儲存庫本機的最小化 `createTestPluginApi` 輔助函式，用於直接測試外掛註冊的單元測試，無須匯入儲存庫測試輔助橋接層 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫本機的原生代理程式執行階段配接器合約固定資料，用於驗證、傳遞、備援、工具掛鉤、提示覆疊、結構描述及逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫本機、以頻道為導向的測試輔助函式，用於通用動作／設定／狀態合約、目錄斷言、帳號啟動生命週期、傳送設定串接、執行階段模擬、狀態問題、傳出傳遞及掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫本機的共用目標解析錯誤案例測試套件，供頻道測試使用 |
    | `plugin-sdk/channel-contract-testing` | 儲存庫本機的精簡頻道合約測試輔助函式，不含廣泛的測試匯出集合 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫本機的外掛套件、註冊、公開成品、直接匯入、執行階段 API 及匯入副作用合約輔助函式 |
    | `plugin-sdk/plugin-state-test-runtime` | 儲存庫本機的外掛狀態儲存區、輸入佇列及狀態資料庫測試輔助函式 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫本機的供應商執行階段、驗證、探索、引導、目錄、精靈、媒體功能、重播政策、即時 STT 現場音訊、網頁搜尋／擷取及串流合約輔助函式 |
    | `plugin-sdk/provider-http-test-mocks` | 儲存庫本機的選擇性 Vitest HTTP／驗證模擬，供使用 `plugin-sdk/provider-http` 的供應商測試使用 |
    | `plugin-sdk/reply-payload-testing` | 儲存庫本機用於將中繼資料附加至回覆承載固定資料的輔助函式 |
    | `plugin-sdk/sqlite-runtime-testing` | 儲存庫本機供第一方測試使用的 SQLite 生命週期輔助函式 |
    | `plugin-sdk/test-fixtures` | 儲存庫本機的通用命令列介面執行階段擷取、沙箱上下文、技能寫入器、代理程式訊息、系統事件、模組重新載入、隨附外掛路徑、終端文字、分塊、驗證權杖及具型別案例固定資料 |
    | `plugin-sdk/test-node-mocks` | 儲存庫本機、聚焦於 Node 內建模組的模擬輔助函式，供 Vitest `vi.mock("node:*")` 工廠內使用 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | 已棄用的記憶索引／搜尋執行階段介面；請優先使用與廠商無關的記憶主機子路徑 |
    | `plugin-sdk/memory-core-host-embedding-registry` | 輕量記憶嵌入供應商登錄輔助函式 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入合約、登錄存取、本機供應商及通用批次／遠端輔助函式。此介面上的 `registerMemoryEmbeddingProvider` 已棄用；新供應商請使用通用嵌入供應商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎匯出項目 |
    | `plugin-sdk/memory-core-host-multimodal` | 已棄用的記憶主機多模態輔助函式；請優先使用與廠商無關的記憶主機子路徑 |
    | `plugin-sdk/memory-core-host-query` | 已棄用的記憶主機查詢輔助函式；請優先使用與廠商無關的記憶主機子路徑 |
    | `plugin-sdk/memory-core-host-secret` | 記憶主機密鑰輔助函式 |
    | `plugin-sdk/memory-core-host-events` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機命令列介面執行階段輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案／執行階段輔助函式 |
    | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段輔助函式的廠商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶主機事件日誌輔助函式的廠商中立別名 |
    | `plugin-sdk/memory-host-files` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 供記憶相關外掛使用的共用受管理 Markdown 輔助函式 |
    | `plugin-sdk/memory-host-search` | 用於存取搜尋管理器的主動記憶執行階段介面 |
    | `plugin-sdk/memory-host-status` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的隨附輔助子路徑">
    保留的隨附輔助 SDK 子路徑，是提供給隨附外掛程式碼使用的精簡、擁有者專屬介面。SDK 清單會追蹤這些子路徑，以確保套件建置與別名處理維持決定性，但它們不是一般的外掛開發 API。新的可重用主機合約應使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/ssrf-runtime` 與 `plugin-sdk/plugin-config-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 隨附 Codex 外掛輔助函式，用於將使用者的 MCP 伺服器設定投影至 Codex 應用程式伺服器執行緒設定（保留的套件匯出項目） |
    | `plugin-sdk/codex-native-task-runtime` | 隨附 Codex 外掛輔助函式，用於將 Codex 應用程式伺服器原生子代理程式鏡像至 OpenClaw 任務狀態（僅限儲存庫本機，不是套件匯出項目） |

  </Accordion>
</AccordionGroup>

## 相關內容

- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

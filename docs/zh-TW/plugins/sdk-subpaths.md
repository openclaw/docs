---
read_when:
    - 為外掛匯入選擇正確的 `plugin-sdk` 子路徑
    - 稽核內建外掛的子路徑與輔助介面
summary: 外掛 SDK 子路徑目錄：依領域分組說明各匯入項目的所在位置
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-21T09:01:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b39919e7e12be394ed8f384dcd99bec5ce801e32d9de2ed1e9add7c2d644932
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 包含範圍明確的公開子路徑，以及位於 `openclaw/plugin-sdk/` 下僅供儲存庫使用的內建
輔助工具。本頁列出這兩者，並明確標示
私有本機項目。以下三個檔案定義其邊界：

- `scripts/lib/plugin-sdk-entrypoints.json`：由建置程序編譯的受維護進入點清單。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：從具型別且有文件記載的 SDK 中排除的內部子路徑。
  正式環境項目仍可作為僅含 JavaScript 的主機執行階段匯出項目，
  供另行發布的官方外掛使用；僅供測試的項目則不會匯出。
- `src/plugin-sdk/entrypoints.ts`：已棄用子路徑、保留的內建輔助工具、
  支援的內建外觀介面，以及外掛所擁有公開介面的分類中繼資料。

維護者使用 `pnpm plugin-sdk:surface` 稽核公開匯出項目數量，並使用
`pnpm plugins:boundary-report:summary` 稽核仍在使用的保留輔助工具子路徑；
未使用的保留輔助工具匯出項目會導致 CI 報告失敗，而不會以閒置相容性負債的形式
留在公開 SDK 中。

如需外掛編寫指南，請參閱[外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                         | 主要匯出項目                                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | 2026 年 7 月後為私有本機項目；`defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | 2026 年 7 月後為私有本機項目；遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具及 `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | 2026 年 7 月後為私有本機項目；執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime` 及 `writeMigrationReport`              |
| `plugin-sdk/health`            | 供內建健康狀態取用端使用的 Doctor 健康檢查註冊、偵測、修復、選擇、嚴重性及發現項目型別                                                                                |

### 相容性與私有本機輔助工具

只有棄用期限較晚的子路徑仍會匯出。2026 年 7 月的別名與
未使用子路徑均已刪除，而僅供內建使用的輔助工具已從
公開套件中移除，並於下方標示為私有本機項目。受維護的清單為
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕內建
`plugin-sdk/text-runtime` 僅供相容性使用，而 `plugin-sdk/zod` 是
相容性重新匯出項目：請直接從 `zod` 匯入 `zod`。廣泛的領域
彙整模組 `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、
`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、
`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime` 及
`plugin-sdk/security-runtime` 同樣已棄用，請改用範圍明確的
子路徑。

OpenClaw 以 Vitest 為基礎的測試輔助工具子路徑僅供儲存庫本機使用，且已不再是
套件匯出項目：`agent-runtime-test-contracts`、
`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、
`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、
`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、
`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、
`test-live`、`test-live-auth`、`test-media-generation`、
`test-media-understanding`、`test-node-mocks` 及 `testing`。私有內建輔助工具介面
`ssrf-runtime-internal` 與 `codex-native-task-runtime` 也僅供儲存庫本機
使用。

### 內建外掛輔助工具子路徑

在 2026 年 7 月清理後，僅供內建使用的輔助工具模組均為私有本機項目。套件契約防護措施會阻擋跨擁有者匯入。`src/plugin-sdk/entrypoints.ts` 會另行追蹤仍保持公開且受支援的內建外觀介面，也就是由其內建外掛支援的 SDK
進入點，直到通用契約取代
`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account`；
不建議在新程式碼中使用；請參閱下方各列備註。

<AccordionGroup>
  <Accordion title="頻道子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | 2026 年 7 月後為私有本機項目；供外掛所擁有結構描述使用的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定翻譯器、允許清單提示及設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定／動作閘門輔助工具、預設帳號後備輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查詢與預設後備輔助工具 |
    | `plugin-sdk/account-helpers` | 範圍明確的帳號清單／帳號動作輔助工具 |
    | `plugin-sdk/access-groups` | 2026 年 7 月後為私有本機項目；存取群組允許清單剖析與遮蔽後群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性外觀介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定結構描述基元，以及 Zod 與直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 2026 年 7 月後為私有本機項目；僅供受維護內建外掛使用的內建 OpenClaw 頻道設定結構描述 |
    | `plugin-sdk/chat-channel-ids` | 2026 年 7 月後為私有本機項目；`BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準內建／官方聊天頻道 ID，以及供需要辨識帶有信封前置字串文字、但不想硬編碼自有表格的外掛使用之格式器標籤／別名。 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性的高階頻道輸入執行階段解析器、隱含提及政策解析器，以及供已遷移頻道接收路徑使用的路由事實建構器。請優先使用此介面，而非在每個外掛中組合有效允許清單、命令允許清單及舊版投影。請參閱[頻道輸入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性外觀介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期契約，以及回覆流水線選項、回條、即時預覽／串流、生命週期輔助工具、輸出身分、承載資料規劃、持久傳送與訊息傳送內容輔助工具。請參閱[頻道輸出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名。 |
    | `plugin-sdk/inbound-envelope` | 共用輸入路由與信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性外觀介面。輸入執行器與分派述詞請使用 `plugin-sdk/channel-inbound`，訊息遞送輔助工具請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標剖析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 2026 年 7 月後為私有本機項目；共用輸出媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/poll-runtime` | 2026 年 7 月後為私有本機項目；範圍明確的投票正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 2026 年 7 月後為私有本機項目；討論串繫結生命週期與轉接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 用於代理程式媒體承載資料根目錄與載入器的已棄用相容性外觀介面。新的頻道外掛使用 `plugin-sdk/channel-outbound` 提供的具型別輸出承載資料規劃；由操作員提供的本機媒體載入，在有範圍明確的公開本機根目錄介面之前，仍使用保留的外觀介面。 |
    | `plugin-sdk/conversation-runtime` | 已棄用的廣泛彙整模組，用於對話／討論串繫結、配對及已設定繫結輔助工具；請優先使用範圍明確的繫結子路徑，例如 `plugin-sdk/thread-bindings-runtime` 與 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照／摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 範圍明確的頻道設定結構描述基元 |
    | `plugin-sdk/channel-config-writes` | 2026 年 7 月後為私有本機項目；頻道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道外掛前置匯出項目 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯／讀取輔助工具 |
    | `plugin-sdk/group-access` | 已棄用的群組存取決策輔助工具；請使用 `plugin-sdk/channel-ingress-runtime` 中的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm-guard-policy` | 2026 年 7 月後為私有本機項目；範圍明確的直接 DM 加密前防護政策輔助工具 |
    | `plugin-sdk/discord` | 供已發布 `@openclaw/discord@2026.3.13` 及受追蹤擁有者相容性使用的已棄用 Discord 相容性外觀介面；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 供受追蹤擁有者相容性使用的已棄用 Telegram 帳號解析相容性外觀介面；新外掛應使用注入的執行階段輔助工具或通用頻道 SDK 子路徑 |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送及舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | 從頻道互動處理常式，透過閘道解析由執行階段編寫的 `ask_user` 選項 |
    | `plugin-sdk/channel-inbound` | 用於事件分類、內容建構、格式化、根目錄、防彈跳、提及比對、提及政策及輸入記錄的共用輸入輔助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 範圍明確的輸入防彈跳輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 2026 年 7 月後為私有本機項目；不含較廣泛輸入執行階段介面的範圍明確提及政策、提及標記及提及文字輔助工具 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性外觀介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果型別 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助工具，以及為外掛相容性保留的已棄用原生結構描述輔助工具 |
    | `plugin-sdk/channel-route` | 2026 年 7 月後為私有本機項目；共用路由正規化、由剖析器驅動的目標解析、討論串 ID 字串化、去重／精簡路由鍵、已剖析目標型別，以及路由／目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 2026 年 7 月後為私有本機項目；目標剖析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道契約型別 |
    | `plugin-sdk/channel-feedback` | 意見回饋／反應連接 |
  </Accordion>

棄用期限較晚的頻道相容性子路徑，僅會在各自的
登錄日期前保持公開。7 月的別名（例如直接 DM 存取、回覆選項、配對
路徑及頻道執行階段分支）均已移除；僅供內建使用的輔助工具
為私有本機項目。

  <Accordion title="供應商子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | 2026 年 7 月之後僅供私有本機使用；`defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 2026 年 7 月之後僅供私有本機使用；精選的本機／自行託管供應商設定輔助工具 |
    | `plugin-sdk/cli-backend` | 2026 年 7 月之後僅供私有本機使用；命令列介面後端預設值與監控程式常數 |
    | `plugin-sdk/provider-auth-runtime` | 2026 年 7 月之後僅供私有本機使用；供應商驗證執行階段輔助工具：OAuth 迴送流程、權杖交換、驗證持久化及 API 金鑰解析 |
    | `plugin-sdk/provider-oauth-runtime` | 2026 年 7 月之後僅供私有本機使用；通用供應商 OAuth 回呼類型、回呼頁面呈現、PKCE／狀態輔助工具、授權輸入剖析、權杖到期輔助工具及中止輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | 2026 年 7 月之後僅供私有本機使用；API 金鑰導入／設定檔寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 2026 年 7 月之後僅供私有本機使用；標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 2026 年 7 月之後僅供私有本機使用；供應商驗證環境變數查詢輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助工具、已淘汰的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | 2026 年 7 月之後僅供私有本機使用；`ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`selectPreferredLocalModelId`、`normalizeModelCompat`、共用重播政策建構器、供應商端點輔助工具及共用模型 ID 正規化輔助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 2026 年 7 月之後僅供私有本機使用；用於受防護的 `/models` 類型探索之即時供應商模型目錄輔助工具：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取及靜態備援 |
    | `plugin-sdk/provider-catalog-runtime` | 供應商目錄擴充執行階段掛鉤，以及用於契約測試的外掛供應商登錄介面 |
    | `plugin-sdk/provider-catalog-shared` | 2026 年 7 月之後僅供私有本機使用；`findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 2026 年 7 月之後僅供私有本機使用；通用供應商 HTTP／端點功能輔助工具、供應商 HTTP 錯誤及音訊轉錄多部分表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 2026 年 7 月之後僅供私有本機使用；精簡的網頁擷取設定／選擇契約輔助工具，例如 `enablePluginInConfig` 與 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 2026 年 7 月之後僅供私有本機使用；網頁擷取供應商登錄／快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 2026 年 7 月之後僅供私有本機使用；供不需要外掛啟用接線之供應商使用的精簡網頁搜尋設定／認證資訊輔助工具 |
    | `plugin-sdk/provider-web-search-contract` | 2026 年 7 月之後僅供私有本機使用；精簡的網頁搜尋設定／認證資訊契約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具作用域的認證資訊設定器／取得器 |
    | `plugin-sdk/provider-web-search` | 2026 年 7 月之後僅供私有本機使用；網頁搜尋供應商登錄／快取／執行階段輔助工具 |
    | `plugin-sdk/embedding-providers` | 2026 年 7 月之後僅供私有本機使用；一般嵌入供應商類型與讀取輔助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 與 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 登錄供應商，以強制執行資訊清單擁有權 |
    | `plugin-sdk/provider-tools` | 2026 年 7 月之後僅供私有本機使用；`ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI 結構描述清理與診斷 |
    | `plugin-sdk/provider-usage` | 2026 年 7 月之後僅供私有本機使用；供應商用量快照類型、共用用量擷取輔助工具，以及 `fetchClaudeUsage` 等供應商擷取器 |
    | `plugin-sdk/provider-stream` | 2026 年 7 月之後僅供私有本機使用；`ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器類型、純文字工具呼叫相容性，以及共用的 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI 包裝器輔助工具 |
    | `plugin-sdk/provider-stream-shared` | 2026 年 7 月之後僅供私有本機使用；公開的共用供應商串流包裝器輔助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic／DeepSeek／OpenAI 相容串流公用工具 |
    | `plugin-sdk/provider-transport-runtime` | 2026 年 7 月之後僅供私有本機使用；原生供應商傳輸輔助工具，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 2026 年 7 月之後僅供私有本機使用；導入設定修補輔助工具 |
    | `plugin-sdk/global-singleton` | 2026 年 7 月之後僅供私有本機使用；行程本機單例／對應表／快取輔助工具 |
    | `plugin-sdk/group-activation` | 2026 年 7 月之後僅供私有本機使用；精簡的群組啟用模式與命令剖析輔助工具 |
  </Accordion>

供應商用量快照通常會回報一或多個配額 `windows`，每個項目都包含
標籤、已使用百分比，以及選用的重設時間。若供應商公開的是餘額或
帳戶狀態文字，而非可重設的配額期間，應傳回
`summary` 並使用空的 `windows` 陣列，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；僅當
用量端點失敗或未傳回可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已淘汰的廣泛命令授權介面（`resolveControlCommandGate`、命令登錄輔助工具，包括動態引數選單格式化、傳送者授權輔助工具）；請改用頻道輸入／執行階段授權或命令狀態輔助工具 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 與 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析及同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生執行核准設定檔／篩選器輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准功能／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准閘道解析器 |
    | `plugin-sdk/approval-reference-runtime` | 2026 年 7 月之後僅供私有本機使用；供傳輸受限核准回呼使用的確定性持久定位器輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 供高頻頻道進入點使用的輕量原生核准配接器載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理常式執行階段輔助工具；當較精簡的配接器／閘道介面已足夠時，應優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶繫結、路由閘門、轉送備援，以及本機原生執行提示抑制輔助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 2026 年 7 月之後僅供私有本機使用；硬編碼的核准反應繫結、反應提示承載資料、反應目標儲存區、反應提示文字輔助工具，以及本機原生執行提示抑制的相容性匯出 |
    | `plugin-sdk/approval-reply-runtime` | 執行／外掛核准回覆承載資料輔助工具 |
    | `plugin-sdk/approval-runtime` | 執行／外掛核准承載資料輔助工具、核准功能建構器、核准驗證／設定檔輔助工具、原生核准路由／執行階段輔助工具，以及 `formatApprovalDisplayPath` 等結構化核准顯示輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化及原生工作階段目標輔助工具 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 供高頻頻道路徑使用的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 2026 年 7 月之後僅供私有本機使用；命令主體正規化與命令介面輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 2026 年 7 月之後僅供私有本機使用；用於私人頻道與 Web UI 裝置代碼配對的延遲供應商驗證登入流程輔助工具 |
    | `plugin-sdk/channel-secret-runtime` | 已淘汰的廣泛祕密契約介面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、祕密目標類型）；請優先使用下方的聚焦子路徑 |
    | `plugin-sdk/channel-secret-basic-runtime` | 用於非 TTS 頻道／外掛祕密介面的精簡祕密契約匯出，以及目標登錄建構器 |
    | `plugin-sdk/channel-secret-tts-runtime` | 2026 年 7 月之後僅供私有本機使用；精簡的巢狀頻道 TTS 祕密指派輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於祕密契約／設定剖析的精簡 SecretRef 型別、解析及計畫目標路徑查詢 |
    | `plugin-sdk/security-runtime` | 已淘汰的廣泛匯出桶，涵蓋信任、DM 閘控、根目錄範圍限定的檔案／路徑輔助工具（包括僅建立寫入）、同步／非同步不可分割檔案取代、同層暫存寫入、跨裝置移動備援、私有檔案儲存區輔助工具、符號連結父層防護、外部內容、敏感文字遮蔽、恆定時間祕密比較，以及祕密收集輔助工具；請優先使用聚焦的安全性／SSRF／祕密子路徑 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單及私人網路 SSRF 政策輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 2026 年 7 月之後僅供私有本機使用；不包含廣泛基礎設施執行階段介面的精簡固定分派器輔助工具 |
    | `plugin-sdk/ssrf-runtime` | 固定分派器、受 SSRF 防護的擷取、SSRF 錯誤及 SSRF 政策輔助工具 |
    | `plugin-sdk/secret-input` | 祕密輸入剖析輔助工具 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子要求／目標輔助工具，以及原始 WebSocket／主體強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 要求主體大小／逾時輔助工具，以及用於追蹤確認後處理的 `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/runtime` | 執行階段／記錄／備份輔助工具、外掛安裝路徑警告及程序輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試及退避輔助工具 |
    | `plugin-sdk/browser-config` | 2026 年 7 月後僅限內部使用；支援的瀏覽器設定門面，適用於正規化的設定檔／預設值、CDP URL 剖析及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 2026 年 7 月後僅限內部使用；供使用主機核發之任務範圍的工具框架支援代理程式使用之通用任務生命週期與完成項目遞送輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 2026 年 7 月後僅限內部使用；保留的內建 Codex 輔助工具，用於將使用者的 MCP 伺服器設定投影至 Codex 對話串設定；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 儲存庫本機的內建 Codex 輔助工具，用於原生任務鏡像／執行階段接線；不是套件匯出項目 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段情境註冊與查詢輔助工具 |
    | `plugin-sdk/matrix` | 適用於舊版第三方頻道套件的已棄用 Matrix 相容性門面；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 適用於外掛命令／鉤子／HTTP／互動式輔助工具的已棄用廣泛彙總匯出；應優先使用聚焦的外掛執行階段子路徑 |
    | `plugin-sdk/hook-runtime` | 適用於網路鉤子／內部鉤子流水線輔助工具的已棄用廣泛彙總匯出；應優先使用聚焦的鉤子／外掛執行階段子路徑 |
    | `plugin-sdk/lazy-runtime` | 延遲載入執行階段匯入／繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 及 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 2026 年 7 月後僅限內部使用；程序執行輔助工具 |
    | `plugin-sdk/node-host` | 2026 年 7 月後僅限內部使用；節點主機可執行檔解析與 PTY 繼續執行輔助工具 |
    | `plugin-sdk/cli-runtime` | 2026 年 7 月後僅限內部使用；適用於命令列介面格式化、等待、版本、引數叫用及延遲載入命令群組輔助工具的已棄用廣泛彙總匯出；應優先使用聚焦的命令列介面／執行階段子路徑 |
    | `plugin-sdk/qa-runner-runtime` | 2026 年 7 月後僅限內部使用；透過命令列介面命令介面公開外掛 QA 情境的支援門面 |
    | `plugin-sdk/tts-runtime` | 2026 年 7 月後僅限內部使用；適用於文字轉語音設定結構描述與執行階段輔助工具的支援門面 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法分派輔助工具，適用於宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、事件迴圈就緒的用戶端啟動輔助工具、閘道命令列介面 RPC、閘道協定錯誤、公告的 LAN 主機解析及頻道狀態修補輔助工具 |
    | `plugin-sdk/config-contracts` | 聚焦的純型別設定介面，適用於 `OpenClawConfig` 等外掛設定形狀及頻道／提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 適用於執行階段外掛設定輔助工具的已棄用相容性門面；新外掛使用 `api.pluginConfig`，並搭配聚焦的設定合約、快照及異動輔助工具 |
    | `plugin-sdk/config-mutation` | 交易式設定異動輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 及 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 2026 年 7 月後僅限內部使用；共用訊息工具遞送中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 及測試快照設定器 |
    | `plugin-sdk/text-autolink-runtime` | 2026 年 7 月後僅限內部使用；不透過廣泛文字彙總匯出的檔案參照自動連結偵測 |
    | `plugin-sdk/reply-runtime` | 共用輸入／回覆執行階段輔助工具、分塊、分派、心跳偵測、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派／完成及對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時間窗回覆歷程輔助工具。新的訊息輪次程式碼應使用 `createChannelHistoryWindow`；較低階的對應表輔助工具僅保留為已棄用的相容性匯出項目 |
    | `plugin-sdk/reply-reference` | 2026 年 7 月後僅限內部使用；`createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字／Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修復／生命週期輔助工具（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、過渡期 `sessionFile` 值的標記輔助工具、依工作階段身分界定範圍的近期使用者／助理逐字稿文字讀取、工作階段儲存區路徑／工作階段金鑰輔助工具及更新時間讀取，且不匯入廣泛的設定寫入／維護功能 |
    | `plugin-sdk/session-transcript-runtime` | 2026 年 7 月後僅限內部使用；逐字稿身分、受限的原始與可見游標、範圍限定的目標／讀取／寫入輔助工具、可見訊息項目投影、更新發布、寫入鎖及逐字稿記憶體命中金鑰 |
    | `plugin-sdk/sqlite-runtime` | 2026 年 7 月後僅限內部使用；供第一方執行階段使用的聚焦 SQLite 代理程式結構描述、路徑及交易輔助工具，不含資料庫生命週期控制 |
    | `plugin-sdk/cron-store-runtime` | 2026 年 7 月後僅限內部使用；排程儲存區路徑／載入／儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態／OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 2026 年 7 月後僅限內部使用；外掛範圍的鍵控狀態、BLOB 與協作式 SQLite 租約合約，以及連線 pragma、經驗證的 WAL 維護及不可部分完成的 STRICT 結構描述遷移輔助工具。租約回呼會接收中止訊號，而具型別錯誤會區分逾時、取消、失去擁有權、無效輸入及儲存失敗 |
    | `plugin-sdk/routing` | 路由／工作階段金鑰／帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 及 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道／帳號狀態摘要輔助工具、執行階段狀態預設值及問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 2026 年 7 月後僅限內部使用；共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | 2026 年 7 月後僅限內部使用；Slug／字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 2026 年 7 月後僅限內部使用；從類似 fetch／request 的輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具正規化 stdout／stderr 結果的限時命令執行器 |
    | `plugin-sdk/param-readers` | 通用工具／命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡易具型別的代理程式工具外掛，並公開靜態中繼資料以產生資訊清單 |
    | `plugin-sdk/tool-payload` | 2026 年 7 月後僅限內部使用；從工具結果物件擷取正規化承載資料 |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/sandbox` | 2026 年 7 月後僅限內部使用；沙箱後端型別及 SSH／OpenShell 命令輔助工具，包括快速失敗的執行命令預檢 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具及私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器及遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | 2026 年 7 月後僅限內部使用；Markdown 表格模式與轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型／工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 及 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | 2026 年 7 月後僅限內部使用；Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取／寫入輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 2026 年 7 月後僅限內部使用；將不安全整數常值保留為字串的 JSON 剖析輔助工具 |
    | `plugin-sdk/file-lock` | 2026 年 7 月後僅限內部使用；可重新進入的檔案鎖定輔助工具，以及可安全供 Doctor 使用的回收功能，用於確定已過期、未變更且已淘汰的鎖定附屬檔案 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的去重快取輔助工具 |
    | `plugin-sdk/ingress-effect-once` | 適用於非冪等輸入副作用的耐久宣告／提交防護 |
    | `plugin-sdk/acp-runtime` | 2026 年 7 月後僅限內部使用；ACP 執行階段／工作階段及回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 2026 年 7 月後僅限內部使用；供啟動時載入之外掛使用的輕量 ACP 後端註冊及回覆分派輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 2026 年 7 月後僅限內部使用；不匯入生命週期啟動功能的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 已棄用的代理程式執行階段設定結構描述基本元件；請從維護中的外掛自有介面匯入結構描述基本元件 |
    | `plugin-sdk/boolean-param` | 寬鬆布林值參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 2026 年 7 月後僅限內部使用；危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動載入與配對權杖輔助工具，包括 `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態及環境代理輔助工具基本元件 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令／提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列舉輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄／建置／序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 適用於低階代理程式工具框架的實驗性受信任外掛介面：工具框架型別、作用中執行導向／中止輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端結果分類、工具進度格式化／詳細資料輔助工具及嘗試結果公用程式 |
    | `plugin-sdk/async-lock-runtime` | 2026 年 7 月後僅限內部使用；適用於小型執行階段狀態檔案的程序本機非同步鎖定輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 2026 年 7 月後僅限內部使用；頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 2026 年 7 月後僅限內部使用；受限的非同步任務並行處理輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內與持久性後端支援的去重快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 2026 年 7 月後僅限內部使用；輸出待處理遞送排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 2026 年 7 月後僅限內部使用；安全的本機檔案與媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 2026 年 7 月後僅限內部使用；心跳偵測喚醒、事件及可見性輔助工具 |
    | `plugin-sdk/expect-runtime` | 2026 年 7 月後僅限內部使用；適用於可證明執行階段不變條件的必要值斷言輔助工具 |
    | `plugin-sdk/number-runtime` | 2026 年 7 月後僅限內部使用；數值強制轉型輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 2026 年 7 月後僅限內部使用；安全權杖／UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 2026 年 7 月後僅限內部使用；系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 2026 年 7 月後僅限內部使用；傳輸就緒等待輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | 2026 年 7 月後僅限內部使用；不透過廣泛基礎架構執行階段彙總匯出的執行核准政策檔案輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性墊片；請使用上述聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型受限快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件及追蹤情境輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 2026 年 7 月後僅限內部使用；包裝的 fetch、代理、EnvHttpProxyAgent 選項及固定查詢輔助工具 |
    | `plugin-sdk/runtime-fetch` | 2026 年 7 月後僅限內部使用；不匯入代理／受防護 fetch 功能且可感知分派器的執行階段 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 2026 年 7 月後僅限內部使用；不透過廣泛媒體執行階段介面的行內圖片資料 URL 清理器與簽章探測輔助工具 |
    | `plugin-sdk/response-limit-runtime` | 2026 年 7 月後僅限內部使用；不透過廣泛媒體執行階段介面的位元組、閒置時間及期限受限回應本文讀取器 |
    | `plugin-sdk/session-binding-runtime` | 2026 年 7 月後僅限內部使用；不含已設定繫結路由或配對儲存區的目前對話繫結狀態 |
    | `plugin-sdk/context-visibility-runtime` | 2026 年 7 月後僅限內部使用；不匯入廣泛設定／安全性功能的情境可見性解析與補充情境篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不匯入 Markdown／記錄功能的精簡基本記錄／字串強制轉型及正規化輔助工具 |
    | `plugin-sdk/html-entity-runtime` | 2026 年 7 月後僅限內部使用；不透過廣泛文字公用程式的單次掃描、分號終止 HTML5 實體解碼 |
    | `plugin-sdk/text-utility-runtime` | 2026 年 7 月後為私有本機項目；低階文字與路徑輔助函式，包括五種實體的 HTML 跳脫 |
    | `plugin-sdk/widget-html` | 自包含 HTML 小工具的完整文件偵測、大小驗證與工具輸入錯誤 |
    | `plugin-sdk/host-runtime` | 2026 年 7 月後為私有本機項目；主機名稱與 SCP 主機正規化輔助函式 |
    | `plugin-sdk/retry-runtime` | 2026 年 7 月後為私有本機項目；重試設定與重試執行器輔助函式 |
    | `plugin-sdk/agent-runtime` | 已淘汰的代理程式目錄／身分／工作區輔助函式廣泛匯出入口，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 與已淘汰的 `resolveOpenClawAgentDir` 相容性匯出；建議優先使用聚焦的代理程式／執行階段子路徑 |
    | `plugin-sdk/directory-runtime` | 由設定支援的目錄查詢／去重 |
    | `plugin-sdk/keyed-async-queue` | 2026 年 7 月後為私有本機項目；`KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已淘汰的廣泛媒體匯出入口，包含 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer`，以及已淘汰的 `fetchRemoteMedia`；請優先使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 與功能執行階段子路徑；當 URL 應轉換為 OpenClaw 媒體時，請先使用儲存區輔助工具，再讀取緩衝區 |
    | `plugin-sdk/media-mime` | 精簡的 MIME 正規化、副檔名對應、MIME 偵測與媒體種類輔助工具 |
    | `plugin-sdk/media-store` | 精簡的媒體儲存區輔助工具，例如 `saveMediaBuffer` 與 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 2026 年 7 月後僅供內部本機使用；共用媒體生成容錯移轉輔助工具、候選項目選擇與缺少模型時的訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別與輔助工具的已淘汰相容性外觀介面；新的提供者透過注入的外掛 API 註冊，並由外掛自行擁有請求輔助工具 |
    | `plugin-sdk/text-chunking` | 傳出文字與保留位移的範圍分塊、Markdown 分塊／轉譯輔助工具、可辨識引文的 HTML 標籤詞元化、Markdown 表格轉換、指示詞標籤移除，以及安全文字公用工具 |
    | `plugin-sdk/speech` | 2026 年 7 月後僅供內部本機使用；語音提供者型別，以及面向提供者的指示詞、登錄檔、驗證、OpenAI 相容 TTS 建構器與語音輔助工具匯出項目 |
    | `plugin-sdk/speech-core` | 2026 年 7 月後僅供內部本機使用；共用語音提供者型別、登錄檔、指示詞、正規化與語音輔助工具匯出項目 |
    | `plugin-sdk/speech-settings` | 不含提供者登錄檔或合成執行階段的輕量 TTS 設定解析與正規化基礎元件 |
    | `plugin-sdk/realtime-transcription` | 2026 年 7 月後僅供內部本機使用；即時轉錄提供者型別、登錄檔輔助工具與共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-bootstrap-context` | 2026 年 7 月後僅供內部本機使用；用於受限 `IDENTITY.md`、`USER.md` 與 `SOUL.md` 情境注入的即時設定檔啟動輔助工具 |
    | `plugin-sdk/realtime-voice` | 2026 年 7 月後僅供內部本機使用；即時語音提供者型別、登錄檔輔助工具、共用音訊能量／語音起始閘門，以及即時語音行為輔助工具，包括與傳輸無關的工作階段測試框架及輸出活動追蹤 |
    | `plugin-sdk/meeting-runtime` | 瀏覽器會議工作階段執行階段、即時音訊引擎／傳輸、`MeetingPlatformAdapter`、瀏覽器／節點控制、代理程式諮詢、語音通話委派、設定檢查與 SoX 命令輔助工具 |
    | `plugin-sdk/image-generation` | 2026 年 7 月後僅供內部本機使用；圖片生成提供者型別、圖片資產／資料 URL 輔助工具，以及 OpenAI 相容圖片提供者建構器 |
    | `plugin-sdk/image-generation-core` | 2026 年 7 月後僅供內部本機使用；共用圖片生成型別、容錯移轉、驗證與登錄檔輔助工具 |
    | `plugin-sdk/music-generation` | 2026 年 7 月後僅供內部本機使用；音樂生成提供者／請求／結果型別 |
    | `plugin-sdk/video-generation` | 2026 年 7 月後僅供內部本機使用；影片生成提供者／請求／結果型別 |
    | `plugin-sdk/video-generation-core` | 2026 年 7 月後僅供內部本機使用；共用影片生成型別、容錯移轉輔助工具、提供者查詢與模型參照剖析 |
    | `plugin-sdk/transcripts` | 2026 年 7 月後僅供內部本機使用；共用逐字稿來源提供者型別、登錄檔輔助工具、工作階段描述項目與語句中繼資料 |
    | `plugin-sdk/webhook-targets` | 2026 年 7 月後僅供內部本機使用；網路鉤子目標登錄檔與路由安裝輔助工具 |
    | `plugin-sdk/web-media` | 共用遠端／本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 已淘汰的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/plugin-test-api` | 儲存庫本機的精簡 `createTestPluginApi` 輔助工具，用於不匯入儲存庫測試輔助橋接工具的直接外掛註冊單元測試 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫本機的原生代理程式執行階段配接器合約測試資料，用於驗證、傳遞、備援、工具掛鉤、提示詞覆疊、結構描述與逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫本機、以頻道為導向的測試輔助工具，用於通用動作／設定／狀態合約、目錄斷言、帳號啟動生命週期、傳送設定串接、執行階段模擬、狀態問題、傳出傳遞與掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫本機的共用目標解析錯誤案例套件，用於頻道測試 |
    | `plugin-sdk/channel-contract-testing` | 儲存庫本機的精簡頻道合約測試輔助工具，不含廣泛測試匯出入口 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫本機的外掛套件、註冊、公開成品、直接匯入、執行階段 API 與匯入副作用合約輔助工具 |
    | `plugin-sdk/plugin-state-test-runtime` | 儲存庫本機的外掛狀態儲存區、輸入佇列與狀態資料庫測試輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫本機的提供者執行階段、驗證、探索、初始設定、目錄、精靈、媒體功能、重播原則、即時 STT 現場音訊、網路搜尋／擷取與串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 2026 年 7 月後僅供內部本機使用；儲存庫本機的選用式 Vitest HTTP／驗證模擬，用於運用 `plugin-sdk/provider-http` 的提供者測試 |
    | `plugin-sdk/reply-payload-testing` | 儲存庫本機的輔助工具，用於將中繼資料附加至回覆承載資料測試資料 |
    | `plugin-sdk/sqlite-runtime-testing` | 儲存庫本機的 SQLite 生命週期輔助工具，用於第一方測試 |
    | `plugin-sdk/test-fixtures` | 儲存庫本機的通用命令列介面執行階段擷取、沙箱情境、Skill 寫入器、代理程式訊息、系統事件、模組重新載入、隨附外掛路徑、終端文字、分塊、驗證權杖與具型別案例測試資料 |
    | `plugin-sdk/test-node-mocks` | 儲存庫本機的專用 Node 內建模組模擬輔助工具，用於 Vitest `vi.mock("node:*")` 工廠函式內 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | 2026 年 7 月後僅供內部本機使用；輕量記憶體嵌入提供者登錄檔輔助工具 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 2026 年 7 月後僅供內部本機使用；記憶體主機嵌入合約、登錄檔存取、本機提供者與通用批次／遠端輔助工具。此介面上的 `registerMemoryEmbeddingProvider` 已淘汰；新提供者請使用通用嵌入提供者 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 2026 年 7 月後僅供內部本機使用；記憶體主機 QMD 引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-storage` | 2026 年 7 月後僅供內部本機使用；記憶體主機儲存引擎匯出項目 |
    | `plugin-sdk/memory-core-host-secret` | 2026 年 7 月後僅供內部本機使用；記憶體主機密鑰輔助工具 |
    | `plugin-sdk/memory-core-host-status` | 2026 年 7 月後僅供內部本機使用；記憶體主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 2026 年 7 月後僅供內部本機使用；記憶體主機命令列介面執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 2026 年 7 月後僅供內部本機使用；記憶體主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 2026 年 7 月後僅供內部本機使用；記憶體主機檔案／執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 廠商中立記憶體主機輔助工具的已淘汰相容性外觀介面。新的記憶體外掛使用注入的記憶體功能與主機準備的提示詞；在提供專用讀取介面之前，配套外掛仍會使用保留的外觀介面探索公開成品。 |
    | `plugin-sdk/memory-host-events` | 2026 年 7 月後僅供內部本機使用；記憶體主機事件日誌輔助工具的廠商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 2026 年 7 月後僅供內部本機使用；供記憶體相關外掛使用的共用受管理 Markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 2026 年 7 月後僅供內部本機使用；用於存取搜尋管理員的主動記憶執行階段外觀介面 |
  </Accordion>

  <Accordion title="保留的隨附輔助工具子路徑">
    保留的隨附輔助工具 SDK 子路徑，是供隨附外掛程式碼使用、由特定擁有者管理的精簡介面。這些子路徑會記錄在 SDK 清單中，使套件建置與別名處理保持確定性，但並非一般外掛編寫 API。新的可重複使用主機合約應採用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime` 與 `plugin-sdk/ssrf-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 2026 年 7 月後僅供內部本機使用；隨附 Codex 外掛輔助工具，用於將使用者 MCP 伺服器設定投影至 Codex app-server 執行緒設定（保留的套件匯出項目） |
    | `plugin-sdk/codex-native-task-runtime` | 隨附 Codex 外掛輔助工具，用於將 Codex app-server 原生子代理程式鏡像至 OpenClaw 任務狀態（僅供儲存庫本機使用，不是套件匯出項目） |

  </Accordion>
</AccordionGroup>

## 相關內容

- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

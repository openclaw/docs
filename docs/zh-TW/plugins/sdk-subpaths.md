---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核內建外掛子路徑與輔助介面
summary: 外掛 SDK 子路徑目錄：各匯入項目所在位置（依領域分組）
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-07-20T00:56:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 17f09b2095cbef8f330dbb500c11bd86ff79cb2d93b1f1d2feadb2b3e44127c2
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

OpenClaw SDK 包含範圍明確的公開子路徑，以及位於 `openclaw/plugin-sdk/` 下僅供儲存庫使用的內建
輔助工具。本頁列出兩者，並明確標示
私有本機項目。邊界由三個檔案定義：

- `scripts/lib/plugin-sdk-entrypoints.json`：建置作業會編譯的維護中進入點清單。
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`：儲存庫本機的
  測試／內部子路徑。套件匯出項目為清單扣除此列表。
- `src/plugin-sdk/entrypoints.ts`：已棄用
  子路徑、保留的內建輔助工具、支援的內建外觀介面，以及
  外掛自有公開介面的分類中繼資料。

維護者使用 `pnpm plugin-sdk:surface` 稽核公開匯出項目數量，並使用
`pnpm plugins:boundary-report:summary` 稽核使用中的保留輔助工具子路徑；
未使用的保留輔助工具匯出項目會導致 CI 報告失敗，而不會以閒置的相容性債務形式留在
公開 SDK 中。

如需外掛編寫指南，請參閱[外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                        | 主要匯出項目                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | 2026 年 7 月後改為私有本機；`defineSingleProviderPluginEntry`                                                                                                                                        |
| `plugin-sdk/migration`         | 2026 年 7 月後改為私有本機；移轉提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、遮蔽輔助工具，以及 `summarizeMigrationItems`                   |
| `plugin-sdk/migration-runtime` | 2026 年 7 月後改為私有本機；執行階段移轉輔助工具，例如 `copyMigrationFileItem`、`resolvePlannedMigrationTargets`、`withCachedMigrationConfigRuntime`，以及 `writeMigrationReport`              |
| `plugin-sdk/health`            | 供內建健康狀態取用端使用的 Doctor 健康檢查註冊、偵測、修復、選擇、嚴重性與發現項目類型                                                                                |

### 相容性與私有本機輔助工具

僅保留較晚時段棄用的子路徑匯出。2026 年 7 月的別名與
未使用的子路徑已刪除，而僅供內建使用的輔助工具已從
公開套件移除，並在下方標示為私有本機。維護中的列表為
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕內建
`plugin-sdk/text-runtime` 僅供相容性使用，而 `plugin-sdk/zod` 是
相容性重新匯出：請直接從 `zod` 匯入 `zod`。廣泛的領域
彙總介面 `plugin-sdk/agent-runtime`、`plugin-sdk/channel-lifecycle`、
`plugin-sdk/conversation-runtime`、`plugin-sdk/hook-runtime`、
`plugin-sdk/media-runtime`、`plugin-sdk/plugin-runtime`，以及
`plugin-sdk/security-runtime` 同樣已棄用，請改用範圍明確的
子路徑。

OpenClaw 以 Vitest 為基礎的測試輔助工具子路徑僅供儲存庫本機使用，且已不再是
套件匯出項目：`agent-runtime-test-contracts`、
`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、
`plugin-state-test-runtime`、`plugin-test-api`、`plugin-test-contracts`、
`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、
`reply-payload-testing`、`sqlite-runtime-testing`、`test-env`、`test-fixtures`、
`test-live`、`test-live-auth`、`test-media-generation`、
`test-media-understanding`、`test-node-mocks`，以及 `testing`。私有內建輔助工具介面
`ssrf-runtime-internal` 與 `codex-native-task-runtime` 也僅供儲存庫本機
使用。

### 內建外掛輔助工具子路徑

2026 年 7 月清理後，僅供內建使用的輔助工具模組改為私有本機。套件契約防護機制會阻擋跨擁有者匯入。`src/plugin-sdk/entrypoints.ts` 會另外追蹤仍維持公開且受支援的內建外觀介面，也就是在通用契約取代
`plugin-sdk/qa-runner-runtime`、`plugin-sdk/telegram-account` 前，由其內建外掛支援的 SDK
進入點；
新程式碼不應使用這些已棄用項目；請參閱下方各列附註。

<AccordionGroup>
  <Accordion title="頻道子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | 2026 年 7 月後改為私有本機；用於外掛自有結構描述的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定翻譯器、允許清單提示，以及設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳號設定／動作閘門輔助工具、預設帳號後援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳號查詢與預設後援輔助工具 |
    | `plugin-sdk/account-helpers` | 範圍明確的帳號列表／帳號動作輔助工具 |
    | `plugin-sdk/access-groups` | 2026 年 7 月後改為私有本機；存取群組允許清單剖析與已遮蔽的群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性外觀介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用頻道設定結構描述基本元件，以及 Zod 與直接 JSON／TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 2026 年 7 月後改為私有本機；僅供維護中的內建外掛使用的內建 OpenClaw 頻道設定結構描述 |
    | `plugin-sdk/chat-channel-ids` | 2026 年 7 月後改為私有本機；`BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準內建／官方聊天頻道 ID，以及供需要辨識帶信封前綴文字的外掛使用的格式化工具標籤／別名，無須硬式編碼自己的對照表。 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性高階頻道傳入執行階段解析器、隱含提及政策解析器，以及供已移轉頻道接收路徑使用的路由事實建構器。請優先使用此項目，不要在每個外掛中自行組合有效允許清單、命令允許清單與舊版投影。請參閱[頻道傳入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性外觀介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期契約，以及回覆流水線選項、回條、即時預覽／串流、生命週期輔助工具、傳出身分、承載資料規劃、持久傳送與訊息傳送情境輔助工具。請參閱[頻道傳出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名。 |
    | `plugin-sdk/inbound-envelope` | 共用傳入路由與信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性外觀介面。傳入執行器與分派述詞請使用 `plugin-sdk/channel-inbound`，訊息傳遞輔助工具請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標剖析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 2026 年 7 月後改為私有本機；共用傳出媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/poll-runtime` | 2026 年 7 月後改為私有本機；範圍明確的投票正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 2026 年 7 月後改為私有本機；討論串繫結生命週期與轉接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 已棄用的代理程式媒體承載資料根目錄與載入器相容性外觀介面。新頻道外掛應使用 `plugin-sdk/channel-outbound` 的型別化傳出承載資料規劃；在有範圍明確的公開本機根目錄介面之前，載入操作員提供的本機媒體仍使用保留的外觀介面。 |
    | `plugin-sdk/conversation-runtime` | 已棄用的廣泛彙總介面，用於對話／討論串繫結、配對與已設定繫結輔助工具；請優先使用範圍明確的繫結子路徑，例如 `plugin-sdk/thread-bindings-runtime` 與 `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用頻道狀態快照／摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 範圍明確的頻道設定結構描述基本元件 |
    | `plugin-sdk/channel-config-writes` | 2026 年 7 月後改為私有本機；頻道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用頻道外掛前置匯出項目 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯／讀取輔助工具 |
    | `plugin-sdk/group-access` | 已棄用的群組存取決策輔助工具；請使用 `plugin-sdk/channel-ingress-runtime` 中的 `resolveChannelMessageIngress` |
    | `plugin-sdk/direct-dm-guard-policy` | 2026 年 7 月後改為私有本機；範圍明確的直接私訊加密前防護政策輔助工具 |
    | `plugin-sdk/discord` | 已棄用的 Discord 相容性外觀介面，用於已發布的 `@openclaw/discord@2026.3.13` 與受追蹤的擁有者相容性；新外掛應使用通用頻道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 已棄用的 Telegram 帳號解析相容性外觀介面，用於受追蹤的擁有者相容性；新外掛應使用注入的執行階段輔助工具或通用頻道 SDK 子路徑 |
    | `plugin-sdk/interactive-runtime` | 語意式訊息呈現、傳遞與舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/question-gateway-runtime` | 從頻道互動處理常式透過閘道解析執行階段編寫的 `ask_user` 選項 |
    | `plugin-sdk/channel-inbound` | 用於事件分類、情境建構、格式化、根目錄、防彈跳、提及比對、提及政策與傳入記錄的共用傳入輔助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 範圍明確的傳入防彈跳輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 2026 年 7 月後改為私有本機；不含較廣泛傳入執行階段介面的範圍明確提及政策、提及標記與提及文字輔助工具 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性外觀介面。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果類型 |
    | `plugin-sdk/channel-actions` | 頻道訊息動作輔助工具，以及為外掛相容性保留的已棄用原生結構描述輔助工具 |
    | `plugin-sdk/channel-route` | 2026 年 7 月後改為私有本機；共用路由正規化、剖析器驅動的目標解析、討論串 ID 字串化、去重／精簡路由鍵、已剖析目標類型，以及路由／目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 2026 年 7 月後改為私有本機；目標剖析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 頻道契約類型 |
    | `plugin-sdk/channel-feedback` | 意見回饋／反應接線 |
  </Accordion>

較晚時段的頻道相容性子路徑僅在其
登錄日期內維持公開。直接私訊存取、回覆選項、配對
路徑及頻道執行階段分支等 7 月別名已移除；僅供內建使用的輔助工具
則為私有本機。

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | 2026 年 7 月後為私有本機項目；`defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 2026 年 7 月後為私有本機項目；精選的本機／自行託管提供者設定輔助函式 |
    | `plugin-sdk/cli-backend` | 2026 年 7 月後為私有本機項目；命令列介面後端預設值與看門狗常數 |
    | `plugin-sdk/provider-auth-runtime` | 2026 年 7 月後為私有本機項目；提供者驗證執行階段輔助函式：OAuth 回送流程、權杖交換、驗證資訊持久化與 API 金鑰解析 |
    | `plugin-sdk/provider-oauth-runtime` | 2026 年 7 月後為私有本機項目；通用提供者 OAuth 回呼型別、回呼頁面呈現、PKCE／狀態輔助函式、授權輸入剖析、權杖到期輔助函式與中止輔助函式 |
    | `plugin-sdk/provider-auth-api-key` | 2026 年 7 月後為私有本機項目；API 金鑰初始設定／設定檔寫入輔助函式，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 2026 年 7 月後為私有本機項目；標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 2026 年 7 月後為私有本機項目；提供者驗證環境變數查找輔助函式 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助函式、已棄用的 `resolveOpenClawAgentDir` 相容性匯出項目 |
    | `plugin-sdk/provider-model-shared` | 2026 年 7 月後為私有本機項目；`ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`selectPreferredLocalModelId`、`normalizeModelCompat`、共用重播政策建構器、提供者端點輔助函式與共用模型 ID 正規化輔助函式 |
    | `plugin-sdk/provider-catalog-live-runtime` | 2026 年 7 月後為私有本機項目；用於受防護的 `/models` 式探索之即時提供者模型目錄輔助函式：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取與靜態後援 |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄擴充執行階段掛鉤，以及供契約測試使用的外掛提供者登錄介面 |
    | `plugin-sdk/provider-catalog-shared` | 2026 年 7 月後為私有本機項目；`findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 2026 年 7 月後為私有本機項目；通用提供者 HTTP／端點能力輔助函式、提供者 HTTP 錯誤與音訊轉錄多部分表單輔助函式 |
    | `plugin-sdk/provider-web-fetch-contract` | 2026 年 7 月後為私有本機項目；範圍有限的網頁擷取設定／選擇契約輔助函式，例如 `enablePluginInConfig` 與 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 2026 年 7 月後為私有本機項目；網頁擷取提供者註冊／快取輔助函式 |
    | `plugin-sdk/provider-web-search-config-contract` | 2026 年 7 月後為私有本機項目；供不需要外掛啟用接線之提供者使用的範圍有限網頁搜尋設定／認證資訊輔助函式 |
    | `plugin-sdk/provider-web-search-contract` | 2026 年 7 月後為私有本機項目；範圍有限的網頁搜尋設定／認證資訊契約輔助函式，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及限定範圍的認證資訊設定器／取得器 |
    | `plugin-sdk/provider-web-search` | 2026 年 7 月後為私有本機項目；網頁搜尋提供者註冊／快取／執行階段輔助函式 |
    | `plugin-sdk/embedding-providers` | 2026 年 7 月後為私有本機項目；一般嵌入提供者型別與讀取輔助函式，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 與 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊提供者，以強制執行資訊清單擁有權 |
    | `plugin-sdk/provider-tools` | 2026 年 7 月後為私有本機項目；`ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI 結構描述清理與診斷 |
    | `plugin-sdk/provider-usage` | 2026 年 7 月後為私有本機項目；提供者用量快照型別、共用用量擷取輔助函式，以及 `fetchClaudeUsage` 等提供者擷取器 |
    | `plugin-sdk/provider-stream` | 2026 年 7 月後為私有本機項目；`ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別、純文字工具呼叫相容性，以及共用的 Anthropic／Google／Kilocode／MiniMax／Moonshot／OpenAI／OpenRouter／Z.AI 包裝器輔助函式 |
    | `plugin-sdk/provider-stream-shared` | 2026 年 7 月後為私有本機項目；公開的共用提供者串流包裝器輔助函式，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic／DeepSeek／OpenAI 相容的串流公用程式 |
    | `plugin-sdk/provider-transport-runtime` | 2026 年 7 月後為私有本機項目；原生提供者傳輸輔助函式，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
    | `plugin-sdk/provider-onboard` | 2026 年 7 月後為私有本機項目；初始設定的設定修補輔助函式 |
    | `plugin-sdk/global-singleton` | 2026 年 7 月後為私有本機項目；處理程序本機單例／對映／快取輔助函式 |
    | `plugin-sdk/group-activation` | 2026 年 7 月後為私有本機項目；範圍有限的群組啟用模式與命令剖析輔助函式 |
  </Accordion>

提供者用量快照通常會回報一或多個配額 `windows`，每個項目都包含
標籤、已使用百分比，以及選用的重設時間。若提供者公開的是餘額或
帳戶狀態文字，而非可重設的配額時段，應回傳
`summary` 並使用空的 `windows` 陣列，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；只有當
用量端點失敗或未回傳可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/command-auth` | 已棄用的廣泛命令授權介面（`resolveControlCommandGate`、命令登錄輔助函式，包括動態引數選單格式化、傳送者授權輔助函式）；請改用頻道輸入／執行階段授權或命令狀態輔助函式 |
    | `plugin-sdk/command-status` | 命令／說明訊息建構器，例如 `buildCommandsMessagePaginated` 與 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 核准者解析與同一聊天動作驗證輔助函式 |
    | `plugin-sdk/approval-client-runtime` | 原生執行核准設定檔／篩選器輔助函式 |
    | `plugin-sdk/approval-delivery-runtime` | 原生核准能力／傳遞配接器 |
    | `plugin-sdk/approval-gateway-runtime` | 共用核准閘道解析器 |
    | `plugin-sdk/approval-reference-runtime` | 2026 年 7 月後為私有本機項目；供傳輸受限核准回呼使用的確定性持久定位器輔助函式 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 供高頻頻道進入點使用的輕量原生核准配接器載入輔助函式 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的核准處理常式執行階段輔助函式；當範圍較窄的配接器／閘道介面足夠時，應優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生核准目標、帳戶繫結、路由閘門、轉送後援與本機原生執行提示抑制輔助函式 |
    | `plugin-sdk/approval-reaction-runtime` | 2026 年 7 月後為私有本機項目；硬式編碼的核准反應繫結、反應提示承載資料、反應目標儲存區、反應提示文字輔助函式，以及本機原生執行提示抑制的相容性匯出項目 |
    | `plugin-sdk/approval-reply-runtime` | 執行／外掛核准回覆承載資料輔助函式 |
    | `plugin-sdk/approval-runtime` | 執行／外掛核准承載資料輔助函式、核准能力建構器、核准驗證／設定檔輔助函式、原生核准路由／執行階段輔助函式，以及 `formatApprovalDisplayPath` 等結構化核准顯示輔助函式 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化與原生工作階段目標輔助函式 |
    | `plugin-sdk/command-detection` | 共用命令偵測輔助函式 |
    | `plugin-sdk/command-primitives-runtime` | 供高頻頻道路徑使用的輕量命令文字述詞 |
    | `plugin-sdk/command-surface` | 2026 年 7 月後為私有本機項目；命令本文正規化與命令介面輔助函式 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | 2026 年 7 月後為私有本機項目；供私人頻道與 Web UI 裝置代碼配對使用的延遲載入提供者驗證登入流程輔助函式 |
    | `plugin-sdk/channel-secret-runtime` | 已棄用的廣泛機密契約介面（`collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment`、機密目標型別）；請優先使用下方的專用子路徑 |
    | `plugin-sdk/channel-secret-basic-runtime` | 供非 TTS 頻道／外掛機密介面使用的範圍有限機密契約匯出項目與目標登錄建構器 |
    | `plugin-sdk/channel-secret-tts-runtime` | 2026 年 7 月後為私有本機項目；範圍有限的巢狀頻道 TTS 機密指派輔助函式 |
    | `plugin-sdk/secret-ref-runtime` | 供機密契約／設定剖析使用的範圍有限 SecretRef 型別定義、解析與計畫目標路徑查找 |
    | `plugin-sdk/security-runtime` | 已棄用的廣泛彙整介面，涵蓋信任、私訊閘控、受根目錄限制的檔案／路徑輔助函式，包括僅建立寫入、同步／非同步不可部分完成的檔案取代、同層暫存寫入、跨裝置移動後援、私有檔案儲存區輔助函式、符號連結父路徑防護、外部內容、敏感文字遮蔽、固定時間機密比較與機密集合輔助函式；請優先使用專用的安全性／SSRF／機密子路徑 |
    | `plugin-sdk/ssrf-policy` | 主機允許清單與私人網路 SSRF 政策輔助函式 |
    | `plugin-sdk/ssrf-dispatcher` | 2026 年 7 月後為私有本機項目；不含廣泛基礎架構執行階段介面的範圍有限固定分派器輔助函式 |
    | `plugin-sdk/ssrf-runtime` | 固定分派器、受 SSRF 防護的擷取、SSRF 錯誤與 SSRF 政策輔助函式 |
    | `plugin-sdk/secret-input` | 機密輸入剖析輔助函式 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子要求／目標輔助函式，以及原始 websocket／本文強制轉換 |
    | `plugin-sdk/webhook-request-guards` | 要求本文大小／逾時輔助函式，以及用於追蹤確認後處理的 `runDetachedWebhookWork` |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/runtime` | 執行階段／記錄／備份輔助工具、外掛安裝路徑警告，以及程序輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段環境、記錄器、逾時、重試及退避輔助工具 |
    | `plugin-sdk/browser-config` | 2026 年 7 月後僅限私有本機使用；支援的瀏覽器設定門面，用於正規化設定檔／預設值、CDP URL 剖析，以及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 2026 年 7 月後僅限私有本機使用；供使用主機核發之工作範圍的底層框架型代理程式使用的通用工作生命週期與完成遞送輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 2026 年 7 月後僅限私有本機使用；保留給內建 Codex 的輔助工具，用於將使用者 MCP 伺服器設定投射至 Codex 執行緒設定；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 儲存庫本機的內建 Codex 輔助工具，用於原生工作鏡像／執行階段接線；不是套件匯出項目 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道執行階段情境註冊與查詢輔助工具 |
    | `plugin-sdk/matrix` | 供較舊第三方頻道套件使用的已棄用 Matrix 相容性門面；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 已棄用的廣泛彙總匯出，提供外掛命令／掛鉤／HTTP／互動式輔助工具；請優先使用聚焦的外掛執行階段子路徑 |
    | `plugin-sdk/hook-runtime` | 已棄用的廣泛彙總匯出，提供網路鉤子／內部掛鉤流水線輔助工具；請優先使用聚焦的掛鉤／外掛執行階段子路徑 |
    | `plugin-sdk/lazy-runtime` | 延遲執行階段匯入／繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 及 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 2026 年 7 月後僅限私有本機使用；程序執行輔助工具 |
    | `plugin-sdk/node-host` | 2026 年 7 月後僅限私有本機使用；節點主機可執行檔解析與 PTY 恢復輔助工具 |
    | `plugin-sdk/cli-runtime` | 2026 年 7 月後僅限私有本機使用；已棄用的廣泛彙總匯出，提供命令列介面格式化、等待、版本、引數叫用及延遲命令群組輔助工具；請優先使用聚焦的命令列介面／執行階段子路徑 |
    | `plugin-sdk/qa-runner-runtime` | 2026 年 7 月後僅限私有本機使用；透過命令列介面命令介面公開外掛 QA 情境的支援門面 |
    | `plugin-sdk/tts-runtime` | 2026 年 7 月後僅限私有本機使用；文字轉語音設定結構描述與執行階段輔助工具的支援門面 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道方法分派輔助工具，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP 路由使用 |
    | `plugin-sdk/gateway-runtime` | 閘道用戶端、事件迴圈就緒的用戶端啟動輔助工具、閘道命令列介面 RPC、閘道通訊協定錯誤、公告的 LAN 主機解析，以及頻道狀態修補輔助工具 |
    | `plugin-sdk/config-contracts` | 聚焦的僅型別設定介面，用於 `OpenClawConfig` 等外掛設定形狀及頻道／提供者設定型別 |
    | `plugin-sdk/plugin-config-runtime` | 已棄用的執行階段外掛設定輔助工具相容性門面；新外掛應使用 `api.pluginConfig`，以及聚焦的設定契約、快照和異動輔助工具 |
    | `plugin-sdk/config-mutation` | 交易式設定異動輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 及 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 2026 年 7 月後僅限私有本機使用；共用訊息工具遞送中繼資料提示字串 |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 及測試快照設定器 |
    | `plugin-sdk/text-autolink-runtime` | 2026 年 7 月後僅限私有本機使用；不依賴廣泛文字彙總匯出的檔案參照自動連結偵測 |
    | `plugin-sdk/reply-runtime` | 共用傳入／回覆執行階段輔助工具、分塊、分派、心跳偵測、回覆規劃器 |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡的回覆分派／完成及對話標籤輔助工具 |
    | `plugin-sdk/reply-history` | 共用短時窗回覆歷程輔助工具。新的訊息輪次程式碼應使用 `createChannelHistoryWindow`；較低階的對應表輔助工具僅保留為已棄用的相容性匯出項目 |
    | `plugin-sdk/reply-reference` | 2026 年 7 月後僅限私有本機使用；`createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡的文字／Markdown 分塊輔助工具 |
    | `plugin-sdk/session-store-runtime` | 工作階段工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、修復／生命週期輔助工具（`deleteSessionEntry`、`cleanupSessionLifecycleArtifacts`、`resolveSessionStoreBackupPaths`）、供過渡期 `sessionFile` 值使用的標記輔助工具、依工作階段身分進行有界的近期使用者／助理逐字稿文字讀取、工作階段儲存路徑／工作階段金鑰輔助工具，以及更新時間讀取，且不含廣泛設定寫入／維護匯入 |
    | `plugin-sdk/session-transcript-runtime` | 2026 年 7 月後僅限私有本機使用；逐字稿身分、有界的原始與可見游標、具範圍的目標／讀取／寫入輔助工具、可見訊息項目投射、更新發布、寫入鎖定及逐字稿記憶命中金鑰 |
    | `plugin-sdk/sqlite-runtime` | 2026 年 7 月後僅限私有本機使用；供第一方執行階段使用的聚焦 SQLite 代理程式結構描述、路徑及交易輔助工具，不含資料庫生命週期控制 |
    | `plugin-sdk/cron-store-runtime` | 2026 年 7 月後僅限私有本機使用；排程儲存路徑／載入／儲存輔助工具 |
    | `plugin-sdk/state-paths` | 狀態／OAuth 目錄路徑輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 2026 年 7 月後僅限私有本機使用；外掛範圍的鍵控狀態、BLOB 及協作式 SQLite 租約契約，以及連線 pragma、經驗證的 WAL 維護及不可分割的 STRICT 結構描述移轉輔助工具。租約回呼會接收中止訊號，且型別化錯誤會區分逾時、取消、失去擁有權、無效輸入及儲存失敗 |
    | `plugin-sdk/routing` | 路由／工作階段金鑰／帳號繫結輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 及 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用頻道／帳號狀態摘要輔助工具、執行階段狀態預設值及問題中繼資料輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 2026 年 7 月後僅限私有本機使用；共用目標解析器輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | 2026 年 7 月後僅限私有本機使用；Slug／字串正規化輔助工具 |
    | `plugin-sdk/request-url` | 2026 年 7 月後僅限私有本機使用；從類似 fetch／request 的輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具正規化 stdout／stderr 結果的計時命令執行器 |
    | `plugin-sdk/param-readers` | 通用工具／命令列介面參數讀取器 |
    | `plugin-sdk/tool-plugin` | 定義簡易的型別化代理程式工具外掛，並公開靜態中繼資料以產生資訊清單 |
    | `plugin-sdk/tool-payload` | 2026 年 7 月後僅限私有本機使用；從工具結果物件擷取正規化承載資料 |
    | `plugin-sdk/tool-send` | 從工具引數擷取標準傳送目標欄位 |
    | `plugin-sdk/sandbox` | 2026 年 7 月後僅限私有本機使用；沙箱後端型別及 SSH／OpenShell 命令輔助工具，包括快速失敗的執行命令預先檢查 |
    | `plugin-sdk/temp-path` | 共用暫存下載路徑輔助工具及私有安全暫存工作區 |
    | `plugin-sdk/logging-core` | 子系統記錄器及遮蔽輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | 2026 年 7 月後僅限私有本機使用；Markdown 表格模式及轉換輔助工具 |
    | `plugin-sdk/model-session-runtime` | 模型／工作階段覆寫輔助工具，例如 `applyModelOverrideToSessionEntry` 及 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | 2026 年 7 月後僅限私有本機使用；Talk 提供者設定解析輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 狀態讀取／寫入輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 2026 年 7 月後僅限私有本機使用；將不安全的整數常值保留為字串的 JSON 剖析輔助工具 |
    | `plugin-sdk/file-lock` | 2026 年 7 月後僅限私有本機使用；可重入檔案鎖定輔助工具，以及由 Doctor 安全回收確定已過時、未變更且已停用的鎖定附屬檔案 |
    | `plugin-sdk/persistent-dedupe` | 磁碟支援的重複資料刪除快取輔助工具 |
    | `plugin-sdk/ingress-effect-once` | 用於非等冪傳入副作用的持久宣告／提交防護 |
    | `plugin-sdk/acp-runtime` | 2026 年 7 月後僅限私有本機使用；ACP 執行階段／工作階段及回覆分派輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 2026 年 7 月後僅限私有本機使用；供啟動時載入之外掛使用的輕量 ACP 後端註冊及回覆分派輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 2026 年 7 月後僅限私有本機使用；不匯入生命週期啟動功能的唯讀 ACP 繫結解析 |
    | `plugin-sdk/agent-config-primitives` | 已棄用的代理程式執行階段設定結構描述原始元件；請從維護中的外掛自有介面匯入結構描述原始元件 |
    | `plugin-sdk/boolean-param` | 寬鬆的布林值參數讀取器 |
    | `plugin-sdk/dangerous-name-runtime` | 2026 年 7 月後僅限私有本機使用；危險名稱比對解析輔助工具 |
    | `plugin-sdk/device-bootstrap` | 裝置啟動載入及配對權杖輔助工具，包括 `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | 共用被動頻道、狀態及環境代理輔助原始元件 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令／提供者回覆輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列示輔助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令登錄／建置／序列化輔助工具 |
    | `plugin-sdk/agent-harness` | 供低階代理程式底層框架使用的實驗性受信任外掛介面：底層框架型別、作用中執行的導引／中止輔助工具、OpenClaw 工具橋接輔助工具、執行階段計畫工具政策輔助工具、終端結果分類、工具進度格式化／詳細資料輔助工具，以及嘗試結果公用工具 |
    | `plugin-sdk/async-lock-runtime` | 2026 年 7 月後僅限私有本機使用；供小型執行階段狀態檔案使用的程序本機非同步鎖定輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | 2026 年 7 月後僅限私有本機使用；頻道活動遙測輔助工具 |
    | `plugin-sdk/concurrency-runtime` | 2026 年 7 月後僅限私有本機使用；有界的非同步工作並行輔助工具 |
    | `plugin-sdk/dedupe-runtime` | 記憶體內及持久後端支援的重複資料刪除快取輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | 2026 年 7 月後僅限私有本機使用；傳出待處理遞送排空輔助工具 |
    | `plugin-sdk/file-access-runtime` | 2026 年 7 月後僅限私有本機使用；安全的本機檔案及媒體來源路徑輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 2026 年 7 月後僅限私有本機使用；心跳偵測喚醒、事件及可見性輔助工具 |
    | `plugin-sdk/expect-runtime` | 2026 年 7 月後僅限私有本機使用；用於可證明執行階段不變條件的必要值斷言輔助工具 |
    | `plugin-sdk/number-runtime` | 2026 年 7 月後僅限私有本機使用；數值強制轉換輔助工具 |
    | `plugin-sdk/secure-random-runtime` | 2026 年 7 月後僅限私有本機使用；安全權杖／UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | 2026 年 7 月後僅限私有本機使用；系統事件佇列輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | 2026 年 7 月後僅限私有本機使用；傳輸就緒等待輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | 2026 年 7 月後僅限私有本機使用；不依賴廣泛基礎架構執行階段彙總匯出的執行核准政策檔案輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性過渡層；請使用上述聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型有界快取輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | 診斷旗標、事件及追蹤情境輔助工具 |
    | `plugin-sdk/error-runtime` | 錯誤圖、格式化、共用錯誤分類輔助工具、`PlatformMessageNotDispatchedError`、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 2026 年 7 月後僅限私有本機使用；封裝的 fetch、代理、EnvHttpProxyAgent 選項及固定查詢輔助工具 |
    | `plugin-sdk/runtime-fetch` | 2026 年 7 月後僅限私有本機使用；不匯入代理／受防護 fetch 的分派器感知執行階段 fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 2026 年 7 月後僅限私有本機使用；不依賴廣泛媒體執行階段介面的內嵌影像資料 URL 清理器及簽章探測輔助工具 |
    | `plugin-sdk/response-limit-runtime` | 2026 年 7 月後僅限私有本機使用；不依賴廣泛媒體執行階段介面的依位元組、閒置時間及期限設限之回應本文讀取器 |
    | `plugin-sdk/session-binding-runtime` | 2026 年 7 月後僅限私有本機使用；不含已設定繫結路由或配對儲存區的目前對話繫結狀態 |
    | `plugin-sdk/context-visibility-runtime` | 2026 年 7 月後僅限私有本機使用；不匯入廣泛設定／安全性的情境可見性解析及補充情境篩選 |
    | `plugin-sdk/string-coerce-runtime` | 不匯入 Markdown／記錄功能的精簡原始記錄／字串強制轉換及正規化輔助工具 |
    | `plugin-sdk/html-entity-runtime` | 2026 年 7 月後僅限私有本機使用；不依賴廣泛文字公用工具的單次掃描、分號終止 HTML5 實體解碼 |
    | `plugin-sdk/text-utility-runtime` | 2026 年 7 月後為私有本機使用；低階文字與路徑輔助函式，包括五種實體的 HTML 跳脫 |
    | `plugin-sdk/widget-html` | 自包含 HTML 小工具的完整文件偵測、大小驗證與工具輸入錯誤 |
    | `plugin-sdk/host-runtime` | 2026 年 7 月後為私有本機使用；主機名稱與 SCP 主機正規化輔助函式 |
    | `plugin-sdk/retry-runtime` | 2026 年 7 月後為私有本機使用；重試設定與重試執行器輔助函式 |
    | `plugin-sdk/agent-runtime` | 已棄用的代理程式目錄／身分／工作區輔助函式廣泛匯出入口，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 與已棄用的 `resolveOpenClawAgentDir` 相容性匯出；建議使用聚焦的代理程式／執行階段子路徑 |
    | `plugin-sdk/directory-runtime` | 以設定為依據的目錄查詢／去重 |
    | `plugin-sdk/keyed-async-queue` | 2026 年 7 月後為私有本機使用；`KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 已棄用的廣泛媒體匯出介面，包含 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 與已棄用的 `fetchRemoteMedia`；請優先使用 `plugin-sdk/media-store`、`plugin-sdk/media-mime`、`plugin-sdk/outbound-media` 和功能執行階段子路徑；當 URL 應轉換為 OpenClaw 媒體時，請先使用儲存區輔助函式，再讀取緩衝區 |
    | `plugin-sdk/media-mime` | 精簡的 MIME 正規化、副檔名對應、MIME 偵測與媒體種類輔助函式 |
    | `plugin-sdk/media-store` | 精簡的媒體儲存區輔助函式，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 2026 年 7 月後限於私有本機使用；共用的媒體生成容錯移轉輔助函式、候選項目選擇與模型缺失訊息 |
    | `plugin-sdk/media-understanding` | 已棄用的媒體理解供應商型別與輔助函式相容性介面；新的供應商透過注入的外掛 API 註冊，並由外掛自行擁有請求輔助函式 |
    | `plugin-sdk/text-chunking` | 輸出文字與保留位移的範圍分塊、Markdown 分塊／轉譯輔助函式、可辨識引號的 HTML 標籤詞元化、Markdown 表格轉換、指示標籤移除，以及安全文字公用函式 |
    | `plugin-sdk/speech` | 2026 年 7 月後限於私有本機使用；語音供應商型別，以及供應商端指示、登錄檔、驗證、OpenAI 相容 TTS 建構器與語音輔助函式匯出項目 |
    | `plugin-sdk/speech-core` | 2026 年 7 月後限於私有本機使用；共用的語音供應商型別、登錄檔、指示、正規化與語音輔助函式匯出項目 |
    | `plugin-sdk/speech-settings` | 不含供應商登錄檔或合成執行階段的輕量 TTS 設定解析與正規化基礎元件 |
    | `plugin-sdk/realtime-transcription` | 2026 年 7 月後限於私有本機使用；即時轉錄供應商型別、登錄檔輔助函式與共用 WebSocket 工作階段輔助函式 |
    | `plugin-sdk/realtime-bootstrap-context` | 2026 年 7 月後限於私有本機使用；用於有限度注入 `IDENTITY.md`、`USER.md` 與 `SOUL.md` 情境的即時設定檔啟動輔助函式 |
    | `plugin-sdk/realtime-voice` | 2026 年 7 月後限於私有本機使用；即時語音供應商型別、登錄檔輔助函式、共用音訊能量／語音開始閘門，以及即時語音行為輔助函式，包括與傳輸無關的工作階段測試框架和輸出活動追蹤 |
    | `plugin-sdk/meeting-runtime` | 瀏覽器會議工作階段執行階段、即時音訊引擎／傳輸、`MeetingPlatformAdapter`、瀏覽器／節點控制、代理程式諮詢、語音通話委派、設定檢查與 SoX 命令輔助函式 |
    | `plugin-sdk/image-generation` | 2026 年 7 月後限於私有本機使用；圖片生成供應商型別、圖片資產／資料 URL 輔助函式，以及 OpenAI 相容圖片供應商建構器 |
    | `plugin-sdk/image-generation-core` | 2026 年 7 月後限於私有本機使用；共用的圖片生成型別、容錯移轉、驗證與登錄檔輔助函式 |
    | `plugin-sdk/music-generation` | 2026 年 7 月後限於私有本機使用；音樂生成供應商／請求／結果型別 |
    | `plugin-sdk/video-generation` | 2026 年 7 月後限於私有本機使用；影片生成供應商／請求／結果型別 |
    | `plugin-sdk/video-generation-core` | 2026 年 7 月後限於私有本機使用；共用的影片生成型別、容錯移轉輔助函式、供應商查詢與模型參照解析 |
    | `plugin-sdk/transcripts` | 2026 年 7 月後限於私有本機使用；共用的轉錄來源供應商型別、登錄檔輔助函式、工作階段描述元與話語中繼資料 |
    | `plugin-sdk/webhook-targets` | 2026 年 7 月後限於私有本機使用；網路鉤子目標登錄檔與路由安裝輔助函式 |
    | `plugin-sdk/web-media` | 共用的遠端／本機媒體載入輔助函式 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/plugin-test-api` | 儲存庫本機的精簡 `createTestPluginApi` 輔助函式，用於直接外掛註冊單元測試，無須匯入儲存庫測試輔助橋接器 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫本機的原生代理程式執行階段轉接器合約固定資料，用於驗證、傳遞、備援、工具掛鉤、提示詞覆疊、結構描述與轉錄投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫本機的通道導向測試輔助函式，用於一般動作／設定／狀態合約、目錄斷言、帳號啟動生命週期、傳送設定串接、執行階段模擬、狀態問題、輸出傳遞與掛鉤註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫本機的共用目標解析錯誤案例套件，用於通道測試 |
    | `plugin-sdk/channel-contract-testing` | 儲存庫本機的精簡通道合約測試輔助函式，不含廣泛的測試匯出介面 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫本機的外掛套件、註冊、公開成品、直接匯入、執行階段 API 與匯入副作用合約輔助函式 |
    | `plugin-sdk/plugin-state-test-runtime` | 儲存庫本機的外掛狀態儲存區、輸入佇列與狀態資料庫測試輔助函式 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫本機的供應商執行階段、驗證、探索、初始設定、目錄、精靈、媒體功能、重播原則、即時 STT 實況音訊、網頁搜尋／擷取與串流合約輔助函式 |
    | `plugin-sdk/provider-http-test-mocks` | 2026 年 7 月後限於私有本機使用；儲存庫本機可選用的 Vitest HTTP／驗證模擬，用於會執行 `plugin-sdk/provider-http` 的供應商測試 |
    | `plugin-sdk/reply-payload-testing` | 儲存庫本機用於將中繼資料附加至回覆承載資料固定資料的輔助函式 |
    | `plugin-sdk/sqlite-runtime-testing` | 儲存庫本機的 SQLite 生命週期輔助函式，用於第一方測試 |
    | `plugin-sdk/test-fixtures` | 儲存庫本機的一般命令列介面執行階段擷取、沙箱情境、Skill 寫入器、代理程式訊息、系統事件、模組重新載入、內建外掛路徑、終端文字、分塊、驗證權杖與具型別案例固定資料 |
    | `plugin-sdk/test-node-mocks` | 儲存庫本機的專用 Node 內建模組模擬輔助函式，用於 Vitest `vi.mock("node:*")` 工廠內部 |
  </Accordion>

  <Accordion title="記憶體子路徑">
    | 子路徑 | 主要匯出項目 |
    | --- | --- |
    | `plugin-sdk/memory-core-host-embedding-registry` | 2026 年 7 月後限於私有本機使用；輕量的記憶體嵌入供應商登錄檔輔助函式 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶體主機基礎引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 2026 年 7 月後限於私有本機使用；記憶體主機嵌入合約、登錄檔存取、本機供應商，以及通用批次／遠端輔助函式。此介面上的 `registerMemoryEmbeddingProvider` 已棄用；新供應商請使用通用嵌入供應商 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 2026 年 7 月後限於私有本機使用；記憶體主機 QMD 引擎匯出項目 |
    | `plugin-sdk/memory-core-host-engine-storage` | 2026 年 7 月後限於私有本機使用；記憶體主機儲存引擎匯出項目 |
    | `plugin-sdk/memory-core-host-secret` | 2026 年 7 月後限於私有本機使用；記憶體主機密鑰輔助函式 |
    | `plugin-sdk/memory-core-host-status` | 2026 年 7 月後限於私有本機使用；記憶體主機狀態輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 2026 年 7 月後限於私有本機使用；記憶體主機命令列介面執行階段輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-core` | 2026 年 7 月後限於私有本機使用；記憶體主機核心執行階段輔助函式 |
    | `plugin-sdk/memory-core-host-runtime-files` | 2026 年 7 月後限於私有本機使用；記憶體主機檔案／執行階段輔助函式 |
    | `plugin-sdk/memory-host-core` | 已棄用的供應商中立記憶體主機輔助函式相容性介面。新的記憶體外掛使用注入的記憶體功能與主機預先準備的提示詞；在提供專用讀取介面之前，配套外掛仍使用保留的介面來探索公開成品。 |
    | `plugin-sdk/memory-host-events` | 2026 年 7 月後限於私有本機使用；記憶體主機事件日誌輔助函式的供應商中立別名 |
    | `plugin-sdk/memory-host-markdown` | 2026 年 7 月後限於私有本機使用；供記憶體相關外掛使用的共用受管理 Markdown 輔助函式 |
    | `plugin-sdk/memory-host-search` | 2026 年 7 月後限於私有本機使用；用於存取搜尋管理器的主動記憶執行階段介面 |
  </Accordion>

  <Accordion title="保留的內建輔助子路徑">
    保留的內建輔助 SDK 子路徑是供內建外掛程式碼使用、範圍精簡且由特定擁有者管理的介面。SDK 清冊會追蹤這些介面，讓套件建置與別名處理維持確定性，但它們並非通用的外掛開發 API。新的可重用主機合約應使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime` 和 `plugin-sdk/ssrf-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 2026 年 7 月後限於私有本機使用；內建 Codex 外掛輔助函式，用於將使用者的 MCP 伺服器設定投影至 Codex 應用程式伺服器執行緒設定（保留的套件匯出項目） |
    | `plugin-sdk/codex-native-task-runtime` | 內建 Codex 外掛輔助函式，用於將 Codex 應用程式伺服器原生子代理程式鏡射至 OpenClaw 任務狀態（僅限儲存庫本機使用，不是套件匯出項目） |

  </Accordion>
</AccordionGroup>

## 相關內容

- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

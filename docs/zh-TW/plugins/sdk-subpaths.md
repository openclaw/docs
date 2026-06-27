---
read_when:
    - 為外掛匯入選擇正確的 plugin-sdk 子路徑
    - 稽核 bundled-plugin 子路徑與輔助介面
summary: 外掛 SDK 子路徑目錄：哪些匯入項目位於何處，依領域分組
title: 外掛 SDK 子路徑
x-i18n:
    generated_at: "2026-06-27T19:49:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

外掛 SDK 以 `openclaw/plugin-sdk/` 之下的一組狹窄公開子路徑公開。本頁依用途分組，列出常用子路徑。產生的編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出是在扣除 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的 repo 本機測試／內部子路徑後的公開子集。維護者可以使用 `pnpm plugin-sdk:surface` 稽核公開匯出數量，並使用 `pnpm plugins:boundary-report:summary` 稽核作用中的保留輔助子路徑；未使用的保留輔助匯出會讓 CI 報告失敗，而不是作為休眠的相容性債留在公開 SDK 中。

外掛撰寫指南請參閱[外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)。

## 外掛進入點

| 子路徑                        | 主要匯出                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 遷移提供者項目輔助工具，例如 `createMigrationItem`、原因常數、項目狀態標記、修訂輔助工具，以及 `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | 執行階段遷移輔助工具，例如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                              |
| `plugin-sdk/health`            | 供內建健康狀態消費者使用的 Doctor 健康檢查註冊、偵測、修復、選取、嚴重性與發現項目型別                                               |

### 已棄用的相容性與測試輔助工具

已棄用的子路徑仍會為較舊的外掛保留匯出，但新程式碼應使用下方聚焦的 SDK 子路徑。維護中的清單是 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`；CI 會拒絕內建生產程式碼從其中匯入。`compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod` 等廣泛彙整匯出僅供相容性使用。請直接從 `zod` 匯入 `zod`。

OpenClaw 以 Vitest 為基礎的測試輔助子路徑僅供 repo 本機使用，且不再是套件匯出：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`plugin-test-runtime`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks` 和 `testing`。

### 保留的內建外掛輔助子路徑

這些子路徑是由所屬內建外掛擁有的相容性介面，不是通用 SDK API：`plugin-sdk/codex-mcp-projection` 和 `plugin-sdk/codex-native-task-runtime`。跨擁有者的 extension 匯入會被套件契約防護機制阻擋。

<AccordionGroup>
  <Accordion title="通道子路徑">
    | 子路徑 | 關鍵匯出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根層 `openclaw.json` Zod 結構描述匯出（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | 外掛擁有結構描述的快取 JSON Schema 驗證輔助工具 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共用設定精靈輔助工具、設定翻譯器、允許清單提示、設定狀態建構器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`、`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已棄用的相容性別名；請使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多帳戶設定／動作閘門輔助工具、預設帳戶後援輔助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、帳戶 ID 正規化輔助工具 |
    | `plugin-sdk/account-resolution` | 帳戶查找與預設後援輔助工具 |
    | `plugin-sdk/account-helpers` | 精簡帳戶清單／帳戶動作輔助工具 |
    | `plugin-sdk/access-groups` | 存取群組允許清單解析與已遮蔽群組診斷輔助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共用通道設定結構描述基元，以及 Zod 和直接 JSON/TypeBox 建構器 |
    | `plugin-sdk/bundled-channel-config-schema` | 僅供維護中的內建外掛使用的內建 OpenClaw 通道設定結構描述 |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`、`BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`、`ChatChannelId`。標準內建／官方聊天通道 ID，以及供需要辨識信封前綴文字、但不想硬編碼自有表格的外掛使用的格式化標籤／別名。 |
    | `plugin-sdk/channel-config-schema-legacy` | 內建通道設定結構描述的已棄用相容性別名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自訂命令正規化／驗證輔助工具，含內建合約後援 |
    | `plugin-sdk/command-gating` | 精簡命令授權閘門輔助工具 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已棄用的低階通道輸入相容性外觀。新的接收路徑應使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 實驗性高階通道輸入執行階段解析器，以及供已遷移通道接收路徑使用的路由事實建構器。請優先使用此項，而不是在每個外掛中組合有效允許清單、命令允許清單與舊版投影。請參閱[通道輸入 API](/zh-TW/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-outbound` | 訊息生命週期合約，以及回覆管線選項、收據、即時預覽／串流、生命週期輔助工具、輸出身分、承載規劃、持久傳送與訊息傳送情境輔助工具。請參閱[通道輸出 API](/zh-TW/plugins/sdk-channel-outbound)。 |
    | `plugin-sdk/channel-message` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，另含舊版回覆分派外觀。 |
    | `plugin-sdk/channel-message-runtime` | `plugin-sdk/channel-outbound` 的已棄用相容性別名，另含舊版回覆分派外觀。 |
    | `plugin-sdk/inbound-envelope` | 共用輸入路由與信封建構器輔助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 已棄用的相容性外觀。輸入執行器與分派述詞請使用 `plugin-sdk/channel-inbound`，訊息遞送輔助工具請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/messaging-targets` | 已棄用的目標解析別名；請使用 `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | 共用輸出媒體載入與託管媒體狀態輔助工具 |
    | `plugin-sdk/outbound-send-deps` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/outbound-runtime` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/poll-runtime` | 精簡輪詢正規化輔助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 執行緒繫結生命週期與配接器輔助工具 |
    | `plugin-sdk/agent-media-payload` | 舊版代理媒體承載建構器 |
    | `plugin-sdk/conversation-runtime` | 對話／執行緒繫結、配對與已設定繫結輔助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 執行階段設定快照輔助工具 |
    | `plugin-sdk/runtime-group-policy` | 執行階段群組政策解析輔助工具 |
    | `plugin-sdk/channel-status` | 共用通道狀態快照／摘要輔助工具 |
    | `plugin-sdk/channel-config-primitives` | 精簡通道設定結構描述基元 |
    | `plugin-sdk/channel-config-writes` | 通道設定寫入授權輔助工具 |
    | `plugin-sdk/channel-plugin-common` | 共用通道外掛前置匯出 |
    | `plugin-sdk/allowlist-config-edit` | 允許清單設定編輯／讀取輔助工具 |
    | `plugin-sdk/group-access` | 共用群組存取決策輔助工具 |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-inbound`。 |
    | `plugin-sdk/direct-dm-guard-policy` | 精簡直接 DM 加密前防護政策輔助工具 |
    | `plugin-sdk/discord` | 供已發布的 `@openclaw/discord@2026.3.13` 與受追蹤擁有者相容性使用的已棄用 Discord 相容性外觀；新外掛應使用通用通道 SDK 子路徑 |
    | `plugin-sdk/telegram-account` | 供受追蹤擁有者相容性使用的已棄用 Telegram 帳戶解析相容性外觀；新外掛應使用注入的執行階段輔助工具或通用通道 SDK 子路徑 |
    | `plugin-sdk/zalouser` | 供仍匯入傳送者命令授權的已發布 Lark/Zalo 套件使用的已棄用 Zalo Personal 相容性外觀；新外掛應使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 語意訊息呈現、遞送與舊版互動式回覆輔助工具。請參閱[訊息呈現](/zh-TW/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用於事件分類、情境建構、格式化、根目錄、去抖動、提及比對、提及政策與輸入記錄的共用輸入輔助工具 |
    | `plugin-sdk/channel-inbound-debounce` | 精簡輸入去抖動輔助工具 |
    | `plugin-sdk/channel-mention-gating` | 精簡提及政策、提及標記與提及文字輔助工具，不含較廣的輸入執行階段表面 |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-inbound` 或 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-pairing-paths` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-pairing`。 |
    | `plugin-sdk/channel-reply-options-runtime` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-streaming` | 已棄用的相容性外觀。請使用 `plugin-sdk/channel-outbound`。 |
    | `plugin-sdk/channel-send-result` | 回覆結果型別 |
    | `plugin-sdk/channel-actions` | 通道訊息動作輔助工具，以及為外掛相容性保留的已棄用原生結構描述輔助工具 |
    | `plugin-sdk/channel-route` | 共用路由正規化、剖析器驅動的目標解析、執行緒 ID 字串化、去重／壓縮路由鍵、已剖析目標型別，以及路由／目標比較輔助工具 |
    | `plugin-sdk/channel-targets` | 目標解析輔助工具；路由比較呼叫端應使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | 通道合約型別 |
    | `plugin-sdk/channel-feedback` | 回饋／反應接線 |
    | `plugin-sdk/channel-secret-runtime` | 精簡祕密合約輔助工具，例如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 與祕密目標型別 |
  </Accordion>

已棄用的通道輔助工具系列僅為已發布外掛相容性而保留。
移除計畫如下：在外部外掛遷移期間保留它們，讓儲存庫／內建外掛維持使用 `channel-inbound` 和
`channel-outbound`，然後在下一次主要
SDK 清理中移除這些相容性子路徑。這適用於舊的通道訊息／執行階段、通道
串流、直接 DM 存取、輸入輔助工具分支、回覆選項
與配對路徑系列。

  <Accordion title="提供者子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支援的 LM Studio 提供者 facade，用於設定、目錄探索和執行階段模型準備 |
    | `plugin-sdk/lmstudio-runtime` | 支援的 LM Studio 執行階段 facade，用於本機伺服器預設值、模型探索、請求標頭和已載入模型輔助工具 |
    | `plugin-sdk/provider-setup` | 精選的本機/自架提供者設定輔助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 聚焦於 OpenAI 相容自架提供者的設定輔助工具 |
    | `plugin-sdk/cli-backend` | 命令列介面後端預設值 + watchdog 常數 |
    | `plugin-sdk/provider-auth-runtime` | 提供者外掛的執行階段 API 金鑰解析輔助工具 |
    | `plugin-sdk/provider-oauth-runtime` | 通用提供者 OAuth 回呼型別、回呼頁面渲染、PKCE/state 輔助工具、授權輸入解析、權杖到期輔助工具和中止輔助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 金鑰 onboarding/profile 寫入輔助工具，例如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 標準 OAuth 驗證結果建構器 |
    | `plugin-sdk/provider-env-vars` | 提供者驗證環境變數查找輔助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、OpenAI Codex 驗證匯入輔助工具、已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享 replay-policy 建構器、提供者端點輔助工具，以及共享模型 ID 正規化輔助工具 |
    | `plugin-sdk/provider-catalog-live-runtime` | 用於受保護 `/models` 樣式探索的即時提供者模型目錄輔助工具：`buildLiveModelProviderConfig`、`fetchLiveProviderModelRows`、`getCachedLiveProviderModelRows`、`fetchLiveProviderModelIds`、`LiveModelCatalogHttpError`、`clearLiveCatalogCacheForTests`、模型 ID 篩選、TTL 快取和靜態 fallback |
    | `plugin-sdk/provider-catalog-runtime` | 提供者目錄擴充執行階段 hook，以及合約測試用的外掛提供者 registry seam |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用提供者 HTTP/端點能力輔助工具、提供者 HTTP 錯誤，以及音訊轉錄 multipart 表單輔助工具 |
    | `plugin-sdk/provider-web-fetch-contract` | 精簡 web-fetch 設定/選擇合約輔助工具，例如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Web-fetch 提供者註冊/快取輔助工具 |
    | `plugin-sdk/provider-web-search-config-contract` | 適用於不需要外掛啟用接線的提供者之精簡 web-search 設定/憑證輔助工具 |
    | `plugin-sdk/provider-web-search-contract` | 精簡 web-search 設定/憑證合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍的憑證 setter/getter |
    | `plugin-sdk/provider-web-search` | Web-search 提供者註冊/快取/執行階段輔助工具 |
    | `plugin-sdk/embedding-providers` | 一般 embedding 提供者型別和讀取輔助工具，包括 `EmbeddingProviderAdapter`、`getEmbeddingProvider(...)` 和 `listEmbeddingProviders(...)`；外掛透過 `api.registerEmbeddingProvider(...)` 註冊提供者，以強制執行 manifest 擁有權 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI schema cleanup + diagnostics |
    | `plugin-sdk/provider-usage` | 提供者用量 snapshot 型別、共享用量擷取輔助工具，以及提供者擷取器，例如 `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流 wrapper 型別、plain-text tool-call 相容性，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 輔助工具 |
    | `plugin-sdk/provider-stream-shared` | 公開共享的提供者串流 wrapper 輔助工具，包括 `composeProviderStreamWrappers`、`createOpenAICompatibleCompletionsThinkingOffWrapper`、`createPlainTextToolCallCompatWrapper`、`createPayloadPatchStreamWrapper`、`createToolStreamWrapper`、`normalizeOpenAICompatibleReasoningPayload`、`setQwenChatTemplateThinking`，以及 Anthropic/DeepSeek/OpenAI 相容串流工具 |
    | `plugin-sdk/provider-transport-runtime` | 原生提供者 transport 輔助工具，例如受保護的 fetch、transport 訊息轉換，以及可寫入的 transport 事件串流 |
    | `plugin-sdk/provider-onboard` | Onboarding 設定 patch 輔助工具 |
    | `plugin-sdk/global-singleton` | 程序本機 singleton/map/cache 輔助工具 |
    | `plugin-sdk/group-activation` | 精簡 group activation 模式和命令解析輔助工具 |
  </Accordion>

提供者用量 snapshot 通常會回報一或多個配額 `windows`，每個都包含
標籤、已使用百分比，以及選用的重設時間。若提供者公開的是餘額或
帳戶狀態文字，而不是可重設的配額 window，應回傳
`summary` 搭配空的 `windows` 陣列，而不是捏造百分比。
OpenClaw 會在狀態輸出中顯示該摘要文字；只有在
用量端點失敗或未回傳可用的用量資料時，才使用 `error`。

  <Accordion title="驗證與安全性子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令 registry 輔助工具，包括動態引數選單格式化、傳送者授權輔助工具 |
    | `plugin-sdk/command-status` | 命令/說明訊息建構器，例如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Approver 解析和同一聊天動作驗證輔助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生 exec approval profile/filter 輔助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生 approval capability/delivery adapter |
    | `plugin-sdk/approval-gateway-runtime` | 共享 approval 閘道解析輔助工具 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用於熱門 channel 進入點的輕量原生 approval adapter 載入輔助工具 |
    | `plugin-sdk/approval-handler-runtime` | 較廣泛的 approval handler 執行階段輔助工具；若較精簡的 adapter/閘道 seam 已足夠，請優先使用它們 |
    | `plugin-sdk/approval-native-runtime` | 原生 approval target、account-binding、route-gate、forwarding fallback，以及本機原生 exec prompt suppression 輔助工具 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼 approval reaction binding、reaction prompt payload、reaction target store，以及本機原生 exec prompt suppression 的相容性匯出 |
    | `plugin-sdk/approval-reply-runtime` | Exec/外掛 approval reply payload 輔助工具 |
    | `plugin-sdk/approval-runtime` | Exec/外掛 approval payload 輔助工具、原生 approval routing/runtime 輔助工具，以及結構化 approval 顯示輔助工具，例如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 精簡 inbound reply dedupe reset 輔助工具 |
    | `plugin-sdk/channel-contract-testing` | 不含廣泛 testing barrel 的精簡 channel contract test 輔助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令驗證、動態引數選單格式化，以及原生 session-target 輔助工具 |
    | `plugin-sdk/command-detection` | 共享命令偵測輔助工具 |
    | `plugin-sdk/command-primitives-runtime` | 用於熱門 channel 路徑的輕量命令文字 predicate |
    | `plugin-sdk/command-surface` | Command-body 正規化和 command-surface 輔助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | channel/外掛 secret surface 的精簡 secret-contract collection 輔助工具 |
    | `plugin-sdk/secret-ref-runtime` | 用於 secret-contract/config 解析的精簡 `coerceSecretRef` 和 SecretRef typing 輔助工具 |
    | `plugin-sdk/secret-provider-integration` | Type-only SecretRef 提供者整合 manifest，以及供發布外部 secret provider preset 的外掛使用的 preset 合約 |
    | `plugin-sdk/security-runtime` | 共享 trust、DM gating、root-bounded 檔案/路徑輔助工具，包括 create-only 寫入、同步/非同步 atomic file replacement、sibling temp writes、cross-device move fallback、private file-store 輔助工具、symlink-parent guard、external-content、敏感文字遮蔽、constant-time secret comparison，以及 secret-collection 輔助工具 |
    | `plugin-sdk/ssrf-policy` | Host allowlist 和 private-network SSRF policy 輔助工具 |
    | `plugin-sdk/ssrf-dispatcher` | 不含廣泛 infra runtime surface 的精簡 pinned-dispatcher 輔助工具 |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher、SSRF-guarded fetch、SSRF error，以及 SSRF policy 輔助工具 |
    | `plugin-sdk/secret-input` | Secret input 解析輔助工具 |
    | `plugin-sdk/webhook-ingress` | 網路鉤子 request/target 輔助工具和 raw websocket/body coercion |
    | `plugin-sdk/webhook-request-guards` | Request body size/timeout 輔助工具 |
  </Accordion>

  <Accordion title="執行階段與儲存子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 廣泛的執行階段、記錄、備份與外掛安裝輔助工具 |
    | `plugin-sdk/runtime-env` | 精簡的執行階段 env、記錄器、逾時、重試與退避輔助工具 |
    | `plugin-sdk/browser-config` | 支援的瀏覽器設定 facade，用於正規化的 profile/defaults、CDP URL 剖析，以及瀏覽器控制驗證輔助工具 |
    | `plugin-sdk/agent-harness-task-runtime` | 使用主機發出的任務範圍、由 harness 支援的 agent 的通用任務生命週期與完成交付輔助工具 |
    | `plugin-sdk/codex-mcp-projection` | 保留的內建 Codex 輔助工具，用於將使用者 MCP 伺服器設定投影到 Codex thread 設定；不供第三方外掛使用 |
    | `plugin-sdk/codex-native-task-runtime` | 私有的內建 Codex 輔助工具，用於原生任務鏡像/執行階段 wiring；不供第三方外掛使用 |
    | `plugin-sdk/channel-runtime-context` | 通用頻道 runtime-context 註冊與查詢輔助工具 |
    | `plugin-sdk/matrix` | 已棄用的 Matrix 相容性 facade，供較舊的第三方頻道套件使用；新外掛應直接匯入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已棄用的 Mattermost 相容性 facade，供較舊的第三方頻道套件使用；新外掛應直接匯入通用 SDK 子路徑 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共用外掛命令/hook/http/互動式輔助工具 |
    | `plugin-sdk/hook-runtime` | 共用網路鉤子/內部 hook pipeline 輔助工具 |
    | `plugin-sdk/lazy-runtime` | Lazy 執行階段匯入/繫結輔助工具，例如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 與 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 程序 exec 輔助工具 |
    | `plugin-sdk/cli-runtime` | 命令列介面格式化、等待、版本、引數呼叫，以及 lazy 命令群組輔助工具 |
    | `plugin-sdk/qa-live-transport-scenarios` | 共用 live transport QA scenario ids、baseline coverage 輔助工具，以及 scenario-selection 輔助工具 |
    | `plugin-sdk/gateway-method-runtime` | 保留的閘道 method dispatch 輔助工具，供宣告 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的外掛 HTTP routes 使用 |
    | `plugin-sdk/gateway-runtime` | 閘道 client、event-loop-ready client 啟動輔助工具、閘道命令列介面 RPC、閘道 protocol errors，以及 channel-status patch 輔助工具 |
    | `plugin-sdk/config-contracts` | 聚焦的 type-only 設定介面，供外掛設定形狀使用，例如 `OpenClawConfig` 與 channel/provider config types |
    | `plugin-sdk/plugin-config-runtime` | 執行階段外掛設定查詢輔助工具，例如 `requireRuntimeConfig`、`resolvePluginConfigObject` 與 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 交易式設定變更輔助工具，例如 `mutateConfigFile`、`replaceConfigFile` 與 `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | 共用 message-tool delivery metadata hint strings |
    | `plugin-sdk/runtime-config-snapshot` | 目前程序設定快照輔助工具，例如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 與測試快照 setters |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名稱/描述正規化與重複/衝突檢查，即使內建 Telegram contract surface 無法使用也可運作 |
    | `plugin-sdk/text-autolink-runtime` | 不使用廣泛 text barrel 的檔案參照 autolink 偵測 |
    | `plugin-sdk/approval-reaction-runtime` | 硬編碼的 approval reaction bindings、reaction prompt payloads、reaction target stores，以及用於 local native exec prompt suppression 的相容性匯出 |
    | `plugin-sdk/approval-runtime` | Exec/外掛 approval 輔助工具、approval-capability builders、auth/profile 輔助工具、native routing/runtime 輔助工具，以及結構化 approval display path formatting |
    | `plugin-sdk/reply-runtime` | 共用 inbound/reply 執行階段輔助工具、chunking、dispatch、心跳偵測、reply planner |
    | `plugin-sdk/reply-dispatch-runtime` | 精簡 reply dispatch/finalize 與 conversation-label 輔助工具 |
    | `plugin-sdk/reply-history` | 共用短視窗 reply-history 輔助工具。新的 message-turn 程式碼應使用 `createChannelHistoryWindow`；較低階的 map 輔助工具僅保留為已棄用的相容性匯出 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 精簡 text/markdown chunking 輔助工具 |
    | `plugin-sdk/session-store-runtime` | Session 工作流程輔助工具（`getSessionEntry`、`listSessionEntries`、`patchSessionEntry`、`upsertSessionEntry`）、依 session identity 限界讀取近期 user/assistant transcript text、legacy session store path/session-key 輔助工具、updated-at 讀取，以及僅供轉換使用的 whole-store/file-path 相容性輔助工具 |
    | `plugin-sdk/session-transcript-runtime` | Transcript identity、scoped target/read/write 輔助工具、update publishing、write locks，以及 transcript memory hit keys |
    | `plugin-sdk/sqlite-runtime` | 供第一方執行階段使用的聚焦 SQLite agent-schema、path 與 transaction 輔助工具 |
    | `plugin-sdk/cron-store-runtime` | 排程 store path/load/save 輔助工具 |
    | `plugin-sdk/state-paths` | State/OAuth dir path 輔助工具 |
    | `plugin-sdk/plugin-state-runtime` | 外掛 sidecar SQLite keyed-state types，以及外掛擁有資料庫的集中式 connection pragma 與 WAL 維護設定 |
    | `plugin-sdk/routing` | Route/session-key/account binding 輔助工具，例如 `resolveAgentRoute`、`buildAgentSessionKey` 與 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共用 channel/account status summary 輔助工具、runtime-state defaults，以及 issue metadata 輔助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共用 target resolver 輔助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/string 正規化輔助工具 |
    | `plugin-sdk/request-url` | 從 fetch/request-like 輸入擷取字串 URL |
    | `plugin-sdk/run-command` | 具計時功能的命令執行器，提供正規化的 stdout/stderr 結果 |
    | `plugin-sdk/param-readers` | 通用 tool/命令列介面 param readers |
    | `plugin-sdk/tool-plugin` | 定義簡單 typed agent-tool 外掛，並公開用於 manifest 產生的靜態 metadata |
    | `plugin-sdk/tool-payload` | 從 tool result objects 擷取正規化 payloads |
    | `plugin-sdk/tool-send` | 從 tool args 擷取 canonical send target fields |
    | `plugin-sdk/sandbox` | Sandbox backend types 與 SSH/OpenShell 命令輔助工具，包括 fail-fast exec command preflight |
    | `plugin-sdk/temp-path` | 共用 temp-download path 輔助工具與私有安全 temp workspaces |
    | `plugin-sdk/logging-core` | Subsystem logger 與 redaction 輔助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown table mode 與 conversion 輔助工具 |
    | `plugin-sdk/model-session-runtime` | Model/session override 輔助工具，例如 `applyModelOverrideToSessionEntry` 與 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk provider config resolution 輔助工具 |
    | `plugin-sdk/json-store` | 小型 JSON state read/write 輔助工具 |
    | `plugin-sdk/json-unsafe-integers` | 保留不安全整數 literals 為字串的 JSON parsing 輔助工具 |
    | `plugin-sdk/file-lock` | 可重入 file-lock 輔助工具 |
    | `plugin-sdk/persistent-dedupe` | Disk-backed dedupe cache 輔助工具 |
    | `plugin-sdk/acp-runtime` | ACP 執行階段/session 與 reply-dispatch 輔助工具 |
    | `plugin-sdk/acp-runtime-backend` | 啟動時載入外掛的輕量 ACP backend registration 與 reply-dispatch 輔助工具 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不含 lifecycle startup imports 的唯讀 ACP binding resolution |
    | `plugin-sdk/agent-config-primitives` | 精簡 agent runtime config-schema primitives |
    | `plugin-sdk/boolean-param` | 寬鬆 boolean param reader |
    | `plugin-sdk/dangerous-name-runtime` | Dangerous-name matching resolution 輔助工具 |
    | `plugin-sdk/device-bootstrap` | Device bootstrap 與 pairing token 輔助工具 |
    | `plugin-sdk/extension-shared` | 共用 passive-channel、status 與 ambient proxy helper primitives |
    | `plugin-sdk/models-provider-runtime` | `/models` command/provider reply 輔助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill command listing 輔助工具 |
    | `plugin-sdk/native-command-registry` | Native command registry/build/serialize 輔助工具 |
    | `plugin-sdk/agent-harness` | 低階 agent harnesses 的實驗性 trusted-plugin 介面：harness types、active-run steer/abort 輔助工具、OpenClaw tool bridge 輔助工具、runtime-plan tool policy 輔助工具、terminal outcome classification、tool progress formatting/detail 輔助工具，以及 attempt result utilities |
    | `plugin-sdk/provider-zai-endpoint` | 已棄用的 Z.AI provider-owned endpoint detection facade；請使用 Z.AI 外掛 public API |
    | `plugin-sdk/async-lock-runtime` | 小型 runtime state files 的 process-local async lock 輔助工具 |
    | `plugin-sdk/channel-activity-runtime` | Channel activity telemetry 輔助工具 |
    | `plugin-sdk/concurrency-runtime` | Bounded async task concurrency 輔助工具 |
    | `plugin-sdk/dedupe-runtime` | In-memory dedupe cache 輔助工具 |
    | `plugin-sdk/delivery-queue-runtime` | Outbound pending-delivery drain 輔助工具 |
    | `plugin-sdk/file-access-runtime` | 安全 local-file 與 media-source path 輔助工具 |
    | `plugin-sdk/heartbeat-runtime` | 心跳偵測 wake、event 與 visibility 輔助工具 |
    | `plugin-sdk/number-runtime` | Numeric coercion 輔助工具 |
    | `plugin-sdk/secure-random-runtime` | Secure token/UUID 輔助工具 |
    | `plugin-sdk/system-event-runtime` | System event queue 輔助工具 |
    | `plugin-sdk/transport-ready-runtime` | Transport readiness wait 輔助工具 |
    | `plugin-sdk/exec-approvals-runtime` | 不使用廣泛 infra-runtime barrel 的 Exec approval policy file 輔助工具 |
    | `plugin-sdk/infra-runtime` | 已棄用的相容性 shim；請使用上方聚焦的執行階段子路徑 |
    | `plugin-sdk/collection-runtime` | 小型 bounded cache 輔助工具 |
    | `plugin-sdk/diagnostic-runtime` | Diagnostic flag、event 與 trace-context 輔助工具 |
    | `plugin-sdk/error-runtime` | Error graph、formatting、共用 error classification 輔助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Wrapped fetch、proxy、EnvHttpProxyAgent option 與 pinned lookup 輔助工具 |
    | `plugin-sdk/runtime-fetch` | 不含 proxy/guarded-fetch imports 的 dispatcher-aware runtime fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | 不使用廣泛 media runtime surface 的 inline image data URL sanitizer 與 signature sniffing 輔助工具 |
    | `plugin-sdk/response-limit-runtime` | 不使用廣泛 media runtime surface 的 bounded response-body reader |
    | `plugin-sdk/session-binding-runtime` | 不含 configured binding routing 或 pairing stores 的目前 conversation binding state |
    | `plugin-sdk/session-store-runtime` | 不含廣泛 config writes/maintenance imports 的 session-store 輔助工具 |
    | `plugin-sdk/sqlite-runtime` | 不含 database lifecycle controls 的聚焦 SQLite agent-schema、path 與 transaction 輔助工具 |
    | `plugin-sdk/context-visibility-runtime` | 不含廣泛 config/security imports 的 context visibility resolution 與 supplemental context filtering |
    | `plugin-sdk/string-coerce-runtime` | 不含 markdown/logging imports 的精簡 primitive record/string coercion 與 normalization 輔助工具 |
    | `plugin-sdk/host-runtime` | Hostname 與 SCP host normalization 輔助工具 |
    | `plugin-sdk/retry-runtime` | Retry config 與 retry runner 輔助工具 |
    | `plugin-sdk/agent-runtime` | Agent dir/identity/workspace 輔助工具，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 與已棄用的 `resolveOpenClawAgentDir` 相容性匯出 |
    | `plugin-sdk/directory-runtime` | Config-backed directory query/dedup |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="功能與測試子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共用媒體擷取/轉換/儲存輔助工具，包括 `saveRemoteMedia`、`saveResponseMedia`、`readRemoteMediaBuffer` 和已棄用的 `fetchRemoteMedia`；當 URL 應轉成 OpenClaw 媒體時，請優先使用儲存輔助工具，再進行緩衝區讀取 |
    | `plugin-sdk/media-mime` | 精準的 MIME 正規化、副檔名對應、MIME 偵測，以及媒體類型輔助工具 |
    | `plugin-sdk/media-store` | 精準的媒體儲存輔助工具，例如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共用媒體生成容錯移轉輔助工具、候選項選取，以及缺少模型時的訊息 |
    | `plugin-sdk/media-understanding` | 媒體理解提供者型別，以及面向提供者的影像/音訊/結構化擷取輔助匯出 |
    | `plugin-sdk/text-chunking` | 文字與 markdown 分塊/算繪輔助工具、markdown 表格轉換、指令標籤移除，以及安全文字工具 |
    | `plugin-sdk/text-chunking` | 傳出文字分塊輔助工具 |
    | `plugin-sdk/speech` | 語音提供者型別，以及面向提供者的指令、登錄、驗證、OpenAI 相容 TTS 建構器和語音輔助匯出 |
    | `plugin-sdk/speech-core` | 共用語音提供者型別、登錄、指令、正規化，以及語音輔助匯出 |
    | `plugin-sdk/realtime-transcription` | 即時轉錄提供者型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
    | `plugin-sdk/realtime-bootstrap-context` | 即時設定檔啟動輔助工具，用於有界的 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 上下文注入 |
    | `plugin-sdk/realtime-voice` | 即時語音提供者型別、登錄輔助工具，以及共用即時語音行為輔助工具，包括輸出活動追蹤 |
    | `plugin-sdk/image-generation` | 影像生成提供者型別，以及影像資產/data URL 輔助工具和 OpenAI 相容影像提供者建構器 |
    | `plugin-sdk/image-generation-core` | 共用影像生成型別、容錯移轉、驗證和登錄輔助工具 |
    | `plugin-sdk/music-generation` | 音樂生成提供者/請求/結果型別 |
    | `plugin-sdk/music-generation-core` | 共用音樂生成型別、容錯移轉輔助工具、提供者查找，以及 model-ref 剖析 |
    | `plugin-sdk/video-generation` | 影片生成提供者/請求/結果型別 |
    | `plugin-sdk/video-generation-core` | 共用影片生成型別、容錯移轉輔助工具、提供者查找，以及 model-ref 剖析 |
    | `plugin-sdk/transcripts` | 共用逐字稿來源提供者型別、登錄輔助工具、工作階段描述符，以及發話中繼資料 |
    | `plugin-sdk/webhook-targets` | 網路鉤子目標登錄和路由安裝輔助工具 |
    | `plugin-sdk/webhook-path` | 已棄用的相容性別名；請使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共用遠端/本機媒體載入輔助工具 |
    | `plugin-sdk/zod` | 已棄用的相容性重新匯出；請直接從 `zod` 匯入 `zod` |
    | `plugin-sdk/testing` | 用於舊版 OpenClaw 測試的儲存庫本機已棄用相容性彙整匯出。新的儲存庫測試應改為匯入聚焦的本機測試子路徑，例如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 儲存庫本機最小化 `createTestPluginApi` 輔助工具，用於不匯入儲存庫測試輔助橋接器的直接外掛註冊單元測試 |
    | `plugin-sdk/agent-runtime-test-contracts` | 儲存庫本機原生代理執行階段配接器合約固定資料，用於驗證、傳遞、容錯移轉、工具鉤子、提示覆疊、結構描述和逐字稿投影測試 |
    | `plugin-sdk/channel-test-helpers` | 儲存庫本機、以通道為導向的測試輔助工具，用於一般動作/設定/狀態合約、目錄斷言、帳戶啟動生命週期、send-config 執行緒、執行階段模擬、狀態問題、傳出傳遞和鉤子註冊 |
    | `plugin-sdk/channel-target-testing` | 儲存庫本機共用目標解析錯誤案例套件，用於通道測試 |
    | `plugin-sdk/plugin-test-contracts` | 儲存庫本機外掛套件、註冊、公開成品、直接匯入、執行階段 API 和匯入副作用合約輔助工具 |
    | `plugin-sdk/provider-test-contracts` | 儲存庫本機提供者執行階段、驗證、探索、onboard、目錄、精靈、媒體能力、重播政策、即時 STT 現場音訊、網路搜尋/擷取和串流合約輔助工具 |
    | `plugin-sdk/provider-http-test-mocks` | 儲存庫本機選用 Vitest HTTP/驗證模擬，用於測試會執行 `plugin-sdk/provider-http` 的提供者 |
    | `plugin-sdk/test-fixtures` | 儲存庫本機通用命令列介面執行階段擷取、沙箱上下文、技能寫入器、代理訊息、系統事件、模組重新載入、內建外掛路徑、終端文字、分塊、驗證權杖和型別化案例固定資料 |
    | `plugin-sdk/test-node-mocks` | 儲存庫本機聚焦的節點內建模擬輔助工具，用於 Vitest `vi.mock("node:*")` 工廠內部 |
  </Accordion>

  <Accordion title="記憶子路徑">
    | 子路徑 | 主要匯出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 內建 memory-core 輔助工具介面，用於管理器/設定/檔案/命令列介面輔助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | 記憶索引/搜尋執行階段 facade |
    | `plugin-sdk/memory-core-host-embedding-registry` | 輕量記憶嵌入提供者登錄輔助工具 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入合約、登錄存取、本機提供者，以及通用批次/遠端輔助工具。此介面上的 `registerMemoryEmbeddingProvider` 已棄用；新提供者請使用通用嵌入提供者 API。 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎匯出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎匯出 |
    | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 |
    | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 |
    | `plugin-sdk/memory-core-host-secret` | 記憶主機祕密輔助工具 |
    | `plugin-sdk/memory-core-host-events` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機命令列介面執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段輔助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案/執行階段輔助工具 |
    | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段輔助工具的廠商中立別名 |
    | `plugin-sdk/memory-host-events` | 記憶主機事件日誌輔助工具的廠商中立別名 |
    | `plugin-sdk/memory-host-files` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 用於記憶相鄰外掛的共用受管理 markdown 輔助工具 |
    | `plugin-sdk/memory-host-search` | 用於 search-manager 存取的主動記憶執行階段 facade |
    | `plugin-sdk/memory-host-status` | 已棄用的相容性別名；請使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的內建輔助工具子路徑">
    保留的內建輔助工具 SDK 子路徑是針對內建外掛程式碼的精準擁有者特定介面。它們會在 SDK 清單中追蹤，讓套件建置與別名保持決定性，但它們不是通用的外掛撰寫 API。新的可重用主機合約應使用通用 SDK 子路徑，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

    | 子路徑 | 擁有者與用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 內建 Codex 外掛輔助工具，用於將使用者 MCP 伺服器設定投影到 Codex app-server 執行緒設定 |
    | `plugin-sdk/codex-native-task-runtime` | 內建 Codex 外掛輔助工具，用於將 Codex app-server 原生子代理鏡像到 OpenClaw 工作狀態 |

  </Accordion>
</AccordionGroup>

## 相關

- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置外掛](/zh-TW/plugins/building-plugins)

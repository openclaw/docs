---
read_when:
    - 你維護一個 OpenClaw 外掛
    - 你看到外掛相容性警告
    - 你正在規劃外掛 SDK 或資訊清單遷移
summary: 外掛相容性契約、棄用中繼資料與遷移預期
title: 外掛相容性
x-i18n:
    generated_at: "2026-06-27T19:36:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會先透過具名相容性介面卡維持較舊的外掛合約連接，之後才移除它們。這會在 SDK、清單、設定、組態與代理執行階段合約演進期間，保護既有的內建與外部外掛。

## 相容性登錄

外掛相容性合約會在核心登錄中追蹤：
`src/plugins/compat/registry.ts`。

每筆記錄包含：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：SDK、組態、設定、頻道、提供者、外掛執行、代理執行階段，或核心
- 適用時的引入與棄用日期
- 替代方案指引
- 涵蓋舊行為與新行為的文件、診斷與測試

此登錄是維護者規劃與未來外掛檢查器檢查的來源。如果外掛面向的行為有所變更，請在加入介面卡的同一項變更中，新增或更新相容性記錄。

Doctor 修復與遷移相容性會在另一處追蹤：
`src/commands/doctor/shared/deprecation-compat.ts`。這些記錄涵蓋舊組態形狀、安裝帳本版面，以及可能需要在執行階段相容性路徑移除後仍保留可用的修復 shim。

發布掃描應檢查兩個登錄。不要只因為相符的執行階段或組態相容性記錄已過期，就刪除 doctor 遷移；請先確認沒有仍需要該修復的受支援升級路徑。此外，在發布規劃期間也要重新驗證每個替代註記，因為隨著提供者與頻道移出核心，外掛擁有權與組態覆蓋範圍可能會改變。

## 外掛檢查器套件

外掛檢查器應該位於核心 OpenClaw 儲存庫之外，作為由版本化相容性與清單合約支援的獨立套件/儲存庫。

第一天的命令列介面應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應輸出：

- 清單/schema 驗證
- 正在檢查的合約相容性版本
- 安裝/來源中繼資料檢查
- 冷路徑匯入檢查
- 棄用與相容性警告

使用 `--json` 可在 CI 註解中取得穩定的機器可讀輸出。OpenClaw 核心應公開檢查器可取用的合約與 fixture，但不應從主要 `openclaw` 套件發布檢查器二進位檔。

### 維護者接受通道

在針對 OpenClaw 外掛套件驗證外部檢查器時，請使用 Crabbox 支援的 Blacksmith Testbox 作為可安裝套件接受通道。套件建置完成後，從乾淨的 OpenClaw checkout 執行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

請讓此通道維持為維護者選擇性啟用，因為它會安裝外部 npm 套件，且可能檢查在儲存庫外複製的外掛套件。本機儲存庫防護涵蓋 SDK 匯出映射、相容性登錄中繼資料、已棄用 SDK 匯入削減，以及內建擴充匯入邊界；Testbox 檢查器證據則涵蓋外部外掛作者實際取用的套件。

## 棄用政策

OpenClaw 不應在導入替代方案的同一個發布中，移除已記載的外掛合約。

遷移順序為：

1. 新增新合約。
2. 透過具名相容性介面卡維持舊行為連接。
3. 在外掛作者可採取行動時發出診斷或警告。
4. 記載替代方案與時間表。
5. 測試舊路徑與新路徑。
6. 等待已公告的遷移窗口結束。
7. 只有在明確核准破壞性發布時才移除。

已棄用記錄必須包含警告開始日期、替代方案、文件連結，以及不晚於警告開始後三個月的最終移除日期。不要加入移除窗口無期限的已棄用相容性路徑，除非維護者明確決定它是永久相容性，並改為將其標記為 `active`。

## 目前相容性範圍

目前的相容性記錄包括：

- 舊版寬泛 SDK 匯入，例如 `openclaw/plugin-sdk/compat`
- 舊版僅 hook 的外掛形狀與 `before_agent_start`
- 外掛遷移到 `gateway_stop` 期間的舊版 `api.on("deactivate", ...)` 清理 hook 名稱
- 外掛遷移到 `register(api)` 期間的舊版 `activate(api)` 外掛進入點
- 舊版 SDK 別名，例如 `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  狀態建構器、`openclaw/plugin-sdk/test-utils`（由聚焦的
  `openclaw/plugin-sdk/*` 測試子路徑取代），以及 `ClawdbotConfig` /
  `OpenClawSchemaType` 型別別名
- 內建外掛允許清單與啟用行為
- 舊版提供者/頻道環境變數清單中繼資料
- 提供者移至明確的型錄、驗證、思考、重播與傳輸 hook 期間的舊版提供者外掛 hook 與型別別名
- 舊版執行階段別名，例如 `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`，以及已棄用的
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` 扁平回呼欄位，例如 `body`、`chatId`、
  `reply(...)` 與 `mediaPath`，在回呼取用者遷移到巢狀
  `WebInboundCallbackMessage` `event`、`payload`、`quote`、`group` 與
  `platform` 情境期間保留
- WhatsApp `WebInboundMessage` 最上層准入欄位，例如 `from`、
  `conversationId`、`accountId`、`accessControlPassed` 與 `chatType`，在回呼取用者遷移到 `admission` envelope 期間保留
- 記憶體外掛遷移到 `registerMemoryCapability` 期間的舊版記憶體外掛分割註冊
- 嵌入提供者遷移到 `api.registerEmbeddingProvider(...)` 與
  `contracts.embeddingProviders` 期間的舊版記憶體專用嵌入提供者註冊
- 用於原生訊息 schema、提及閘控、傳入 envelope 格式化與核准能力巢狀結構的舊版頻道 SDK helper
- 外掛遷移到 `openclaw/plugin-sdk/channel-route` 期間的舊版頻道路由鍵與可比較目標 helper 別名
- 正由清單 contribution 擁有權取代的啟用提示
- 設定描述元移至冷 `setup.requiresRuntime: false` 中繼資料期間的 `setup-api` 執行階段 fallback
- 提供者型錄 hook 遷移到 `catalog.run(...)` 期間的提供者 `discovery` hook
- 頻道套件遷移到 `openclaw.channel.exposure` 期間的頻道 `showConfigured` / `showInSetup` 中繼資料
- doctor 將操作員遷移到 `agentRuntime` 期間的舊版 runtime-policy 組態鍵
- registry-first `channelConfigs` 中繼資料落地期間的已產生內建頻道組態中繼資料 fallback
- 修復流程將操作員遷移到 `openclaw plugins registry --refresh` 與
  `openclaw doctor --fix` 期間的持久化外掛登錄停用與安裝遷移環境旗標
- doctor 將舊版外掛擁有的網頁搜尋、網頁擷取與 x_search 組態路徑遷移到 `plugins.entries.<plugin>.config` 期間保留的路徑
- 安裝中繼資料移入由狀態管理的外掛帳本期間的舊版 `plugins.installs` 手寫組態與內建外掛載入路徑別名

新的外掛程式碼應優先使用登錄與特定遷移指南中列出的替代方案。既有外掛可以繼續使用相容性路徑，直到文件、診斷與發布資訊公告移除窗口為止。

### WhatsApp 傳入回呼扁平別名

WhatsApp 執行階段回呼會傳遞 `WebInboundMessage`：正規巢狀的 `event`、`payload`、`quote`、`group` 與 `platform` 情境，以及已棄用的已發布回呼欄位扁平別名。新的回呼程式碼應讀取巢狀情境。建構乾淨巢狀回呼訊息的程式碼可以使用 `WebInboundCallbackMessage`；仍注入舊扁平測試或外掛訊息的相容性監聽器應使用 `LegacyFlatWebInboundMessage` 或
`WebInboundMessageInput`。

扁平別名會保留到 **2026-08-30**。該移除窗口只適用於扁平別名存取；巢狀回呼形狀是正規執行階段合約。每個扁平別名上的 TypeScript `@deprecated` 註記都會指明其精確的巢狀替代項目。常見範例：

- `id`、`timestamp` 與 `isBatched` 移到 `event` 之下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location` 與
  `untrustedStructuredContext` 移到 `payload` 之下。
- `to`、`chatId`、sender/self 欄位、`sendComposing`、`reply(...)` 與
  `sendMedia(...)` 移到 `platform` 之下。
- `replyTo*` 欄位移到 `quote` 之下，群組主旨/參與者/提及欄位移到 `group` 之下。

`payload.untrustedStructuredContext` 是從傳入提供者 payload 擷取而來。外掛在將其 `payload` 視為具權威性之前，應先檢查 `label`、`source` 與 `type`。

### WhatsApp 傳入准入欄位

已接受的 WhatsApp 回呼訊息現在會攜帶 `admission`，這是一個可公開安全使用的 envelope，用來表示准許該訊息進入的存取控制決策。新的回呼程式碼應從 `msg.admission` 讀取 admission 事實，而不是較舊的最上層 admission 欄位。

最上層欄位會保留到 **2026-08-30**。TypeScript `@deprecated` 註記會指明每個替代項目：

- `from` 與 `conversationId` 移到 `admission.conversation.id`。
- `accountId` 移到 `admission.accountId`。
- `accessControlPassed` 是 `admission.ingress.decision === "allow"` 的衍生相容性視圖；在已攜帶 `admission` 的訊息上寫入舊版布林值，不會重寫 ingress graph。
- `chatType` 移到 `admission.conversation.kind`。

## 發布資訊

發布資訊應包含即將到來的外掛棄用項目、目標日期，以及遷移文件連結。該警告需要在相容性路徑移至 `removal-pending` 或 `removed` 之前發生。

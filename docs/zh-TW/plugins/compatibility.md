---
read_when:
    - 你維護一個 OpenClaw 外掛
    - 你看到外掛相容性警告
    - 你正在規劃外掛 SDK 或資訊清單遷移
summary: 外掛相容性契約、棄用中繼資料與遷移預期
title: 外掛相容性
x-i18n:
    generated_at: "2026-07-11T21:35:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會透過具名相容性轉接器繼續銜接舊版外掛合約，之後才予以移除。這能在 SDK、資訊清單、設定流程、設定、代理程式執行階段合約持續演進時，保護既有的內建與外部外掛。

## 相容性登錄

外掛相容性合約會在 `src/plugins/compat/registry.ts` 的核心登錄中追蹤。每筆記錄包含：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：`sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、`agent-runtime` 或 `core`
- 適用時的導入與棄用日期
- 替代方案指引
- 涵蓋新舊行為的文件、診斷與測試

此登錄是維護者規劃與未來外掛檢查器檢查的依據。如果面向外掛的行為有所變更，請在新增轉接器的同一變更中新增或更新相容性記錄。

Doctor 修復與遷移相容性會另外在 `src/commands/doctor/shared/deprecation-compat.ts` 中追蹤。這些記錄涵蓋舊版設定結構、安裝台帳配置，以及可能需在執行階段相容性路徑移除後繼續保留的修復相容層。

發行清查應檢查兩個登錄。請勿僅因對應的執行階段或設定相容性記錄已到期，就刪除 Doctor 遷移；應先確認沒有任何仍需此修復的受支援升級路徑。發行規劃期間也應重新驗證每項替代方案註記，因為隨著供應商與頻道移出核心，外掛的所有權與設定涵蓋範圍可能改變。

## 棄用政策

OpenClaw 不應在導入替代方案的同一版本中移除已有文件記載的外掛合約。遷移順序如下：

1. 新增新合約。
2. 透過具名相容性轉接器保留舊有行為的銜接。
3. 在外掛作者可採取行動時發出診斷訊息或警告。
4. 記錄替代方案與時程。
5. 測試新舊兩條路徑。
6. 等待公告的遷移期限結束。
7. 僅在取得破壞性版本的明確核准後才移除。

已棄用的記錄必須包含警告開始日期、替代方案、文件連結，以及不晚於警告開始後三個月的最終移除日期。除非維護者明確決定該路徑為永久相容性並改標記為 `active`，否則請勿新增移除期限未定的已棄用相容性路徑。

## 目前的相容性範圍

登錄目前在下列範圍中追蹤約 70 個相容性代碼。新的外掛程式碼應使用各範圍及特定遷移指南中的替代方案；既有外掛可繼續使用相容性路徑，直到文件、診斷訊息與發行說明公告移除期限為止。

- 舊版廣泛 SDK 匯入，例如 `openclaw/plugin-sdk/compat`
- 舊版僅掛鉤外掛結構與 `before_agent_start`
- 在外掛遷移至 `gateway_stop` 期間，沿用舊版 `api.on("deactivate", ...)` 清理掛鉤名稱
- 在外掛遷移至 `register(api)` 期間，沿用舊版 `activate(api)` 外掛進入點
- 舊版 SDK 別名，例如 `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` 狀態建構器、`openclaw/plugin-sdk/test-utils`（由聚焦用途的 `openclaw/plugin-sdk/*` 測試子路徑取代），以及 `ClawdbotConfig` / `OpenClawSchemaType` 型別別名
- 內建外掛允許清單與啟用行為
- 舊版供應商／頻道環境變數資訊清單中繼資料
- 在供應商遷移至明確的目錄、驗證、思考、重播及傳輸掛鉤期間，沿用舊版供應商外掛掛鉤與型別別名
- 舊版執行階段別名，例如 `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`，以及已棄用的 `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` 扁平回呼欄位（見下文）
- WhatsApp `WebInboundMessage` 頂層准入欄位（見下文）
- 在記憶外掛遷移至 `registerMemoryCapability` 期間，沿用舊版記憶外掛分拆註冊方式
- 在嵌入供應商遷移至 `api.registerEmbeddingProvider(...)` 與 `contracts.embeddingProviders` 期間，沿用舊版記憶專用嵌入供應商註冊方式
- 用於原生訊息結構描述、提及閘控、入站信封格式化與核准能力巢狀結構的舊版頻道 SDK 輔助工具
- 在外掛遷移至 `openclaw/plugin-sdk/channel-route` 期間，沿用舊版頻道路由鍵與可比較目標輔助工具別名
- 由資訊清單貢獻所有權取代的啟用提示
- 在設定描述元遷移至冷路徑 `setup.requiresRuntime: false` 中繼資料期間，沿用 `setup-api` 執行階段備援
- 在供應商目錄掛鉤遷移至 `catalog.run(...)` 期間，沿用供應商 `discovery` 掛鉤
- 在頻道套件遷移至 `openclaw.channel.exposure` 期間，沿用頻道 `showConfigured` / `showInSetup` 中繼資料
- 在 Doctor 將操作人員遷移至 `agentRuntime` 期間，沿用舊版執行階段政策設定鍵
- 在以登錄為優先的 `channelConfigs` 中繼資料導入期間，沿用產生的內建頻道設定中繼資料備援
- 在修復流程將操作人員遷移至 `openclaw plugins registry --refresh` 與 `openclaw doctor --fix` 期間，沿用持久化外掛登錄停用與安裝遷移環境旗標
- 在 Doctor 將舊版外掛所擁有的網頁搜尋、網頁擷取與 x_search 設定路徑遷移至 `plugins.entries.<plugin>.config` 期間，沿用這些舊版路徑
- 在安裝中繼資料移入由狀態管理的外掛台帳期間，沿用舊版 `plugins.installs` 手動編寫設定與內建外掛載入路徑別名

### WhatsApp 入站回呼扁平別名

WhatsApp 執行階段回呼會傳遞 `WebInboundMessage`：標準的巢狀 `event`、`payload`、`quote`、`group` 與 `platform` 情境，以及已發行回呼欄位的已棄用扁平別名。新的回呼程式碼應讀取巢狀情境。建立純巢狀回呼訊息的程式碼可使用 `WebInboundCallbackMessage`；仍會注入舊版扁平測試或外掛訊息的相容性監聽器，應使用 `LegacyFlatWebInboundMessage` 或 `WebInboundMessageInput`。

扁平別名將保留至 **2026-08-30**；此期限僅適用於扁平別名存取，不適用於作為標準執行階段合約的巢狀結構。每個扁平別名的 TypeScript `@deprecated` 註記都會指出其確切的巢狀替代項目。常見範例如下：

- `id`、`timestamp` 與 `isBatched` 移至 `event` 之下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location` 與 `untrustedStructuredContext` 移至 `payload` 之下。
- `to`、`chatId`、傳送者／自身欄位、`sendComposing`、`reply(...)` 與 `sendMedia(...)` 移至 `platform` 之下。
- `replyTo*` 欄位移至 `quote` 之下；群組主旨／參與者／提及欄位移至 `group` 之下。

`payload.untrustedStructuredContext` 會從入站供應商承載資料中擷取。外掛應先檢查 `label`、`source` 與 `type`，再將其 `payload` 視為權威資料。

### WhatsApp 入站准入欄位

已接受的 WhatsApp 回呼訊息會帶有 `admission`，這是對允許訊息通過之存取控制決策的公開安全信封。新的回呼程式碼應從 `msg.admission` 讀取准入資訊，而非較舊的頂層准入欄位。

頂層欄位將保留至 **2026-08-30**。每個欄位的 TypeScript `@deprecated` 註記都會指出其替代項目：

- `from` 與 `conversationId` 移至 `admission.conversation.id`。
- `accountId` 移至 `admission.accountId`。
- `accessControlPassed` 是 `admission.ingress.decision === "allow"` 的衍生相容性檢視；對於已帶有 `admission` 的訊息，寫入舊版布林值不會改寫入站圖。
- `chatType` 移至 `admission.conversation.kind`。

## 外掛檢查器套件

外掛檢查器應位於 OpenClaw 核心儲存庫之外，作為由版本化相容性與資訊清單合約支援的獨立套件／儲存庫。首日的命令列介面應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應輸出資訊清單／結構描述驗證、正在檢查的合約相容性版本、安裝／來源中繼資料檢查、冷路徑匯入檢查，以及棄用／相容性警告。在 CI 註記中，請使用 `--json` 取得穩定且可供機器讀取的輸出。OpenClaw 核心應公開檢查器可使用的合約與固定測試資料，但不應從主要 `openclaw` 套件發布檢查器二進位檔。

### 維護者驗收管線

驗證外部檢查器與 OpenClaw 外掛套件的相容性時，請使用由 Crabbox 支援的 Blacksmith Testbox 執行可安裝套件驗收管線。套件建置完成後，請從乾淨的 OpenClaw 工作目錄執行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

此管線應維持為由維護者選擇性啟用，因為它會安裝外部 npm 套件，且可能檢查從儲存庫外部複製的外掛套件。本機儲存庫防護涵蓋 SDK 匯出對應、相容性登錄中繼資料、已棄用 SDK 匯入的逐步清除，以及內建擴充功能的匯入邊界；Testbox 檢查器證明則涵蓋外部外掛作者實際使用套件的方式。

## 發行說明

在相容性路徑移至 `removal-pending` 或 `removed` 之前，發行說明應包含即將進行的外掛棄用項目、目標日期，以及遷移文件的連結。

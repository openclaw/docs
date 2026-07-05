---
read_when:
    - 你維護 OpenClaw 外掛
    - 你看到外掛相容性警告
    - 你正在規劃外掛 SDK 或資訊清單遷移
summary: 外掛相容性合約、棄用中繼資料與遷移預期
title: 外掛相容性
x-i18n:
    generated_at: "2026-07-05T11:30:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會透過具名相容性轉接器保留較舊的外掛合約接線，之後才移除它們。這能在 SDK、manifest、設定、組態與代理執行階段合約演進時，保護既有的內建與外部外掛。

## 相容性註冊表

外掛相容性合約會在核心註冊表
`src/plugins/compat/registry.ts` 中追蹤。每筆記錄都有：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：`sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、
  `agent-runtime` 或 `core`
- 適用時的引入與棄用日期
- 替代方案指引
- 涵蓋舊行為與新行為的文件、診斷與測試

此註冊表是維護者規劃與未來外掛檢查器檢查的來源。如果面向外掛的行為變更，請在新增轉接器的同一項變更中新增或更新相容性記錄。

Doctor 修復與遷移相容性會在
`src/commands/doctor/shared/deprecation-compat.ts` 另外追蹤。這些記錄涵蓋舊設定形狀、安裝帳本配置，以及在執行階段相容性路徑移除後可能仍需保留的修復 shim。

發行清掃應同時檢查兩個註冊表。不要只因為相符的執行階段或設定相容性記錄過期，就刪除 doctor 遷移；請先確認沒有仍需要該修復的受支援升級路徑。也要在發行規劃期間重新驗證每個替代方案註解，因為外掛所有權與設定足跡會隨著提供者和通道移出核心而改變。

## 棄用政策

OpenClaw 不應在引入替代方案的同一個發行版本中移除已記載的外掛合約。遷移順序：

1. 新增新合約。
2. 透過具名相容性轉接器保留舊行為接線。
3. 在外掛作者可以採取行動時發出診斷或警告。
4. 記載替代方案與時程。
5. 測試舊路徑與新路徑。
6. 等待已公告的遷移窗口期結束。
7. 只有在明確核准破壞性發行時才移除。

已棄用記錄必須包含警告開始日期、替代方案、文件連結，以及不超過警告開始後三個月的最終移除日期。除非維護者明確決定它是永久相容性並改標為 `active`，否則不要新增具有開放式移除窗口的已棄用相容性路徑。

## 目前的相容性區域

此註冊表目前追蹤約 70 個相容性代碼，涵蓋以下區域。新的外掛程式碼應使用每個區域及特定遷移指南中的替代方案；既有外掛可以繼續使用相容性路徑，直到文件、診斷與發行說明公告移除窗口為止。

- 舊版廣泛 SDK 匯入，例如 `openclaw/plugin-sdk/compat`
- 舊版僅 hook 外掛形狀與 `before_agent_start`
- 舊版 `api.on("deactivate", ...)` 清理 hook 名稱，供外掛遷移到
  `gateway_stop`
- 舊版 `activate(api)` 外掛進入點，供外掛遷移到
  `register(api)`
- 舊版 SDK 別名，例如 `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  狀態建構器、`openclaw/plugin-sdk/test-utils`（由聚焦的
  `openclaw/plugin-sdk/*` 測試子路徑取代），以及 `ClawdbotConfig` /
  `OpenClawSchemaType` 型別別名
- 內建外掛允許清單與啟用行為
- 舊版提供者/通道環境變數 manifest 中繼資料
- 舊版提供者外掛 hook 與型別別名，供提供者移至明確的目錄、驗證、思考、重播與傳輸 hook
- 舊版執行階段別名，例如 `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`，以及已棄用的
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` 扁平回呼欄位（見下方）
- WhatsApp `WebInboundMessage` 頂層准入欄位（見下方）
- 舊版記憶體外掛分離註冊，供記憶體外掛移至
  `registerMemoryCapability`
- 舊版記憶體專用 embedding 提供者註冊，供 embedding 提供者移至 `api.registerEmbeddingProvider(...)` 和
  `contracts.embeddingProviders`
- 舊版通道 SDK 輔助工具，用於原生訊息 schema、提及門控、傳入 envelope 格式化，以及核准能力巢狀結構
- 舊版通道路由鍵與可比較目標輔助別名，供外掛移至 `openclaw/plugin-sdk/channel-route`
- 由 manifest 貢獻所有權取代的啟用提示
- `setup-api` 執行階段後援，供設定描述子移至冷路徑
  `setup.requiresRuntime: false` 中繼資料
- 提供者 `discovery` hook，供提供者目錄 hook 移至
  `catalog.run(...)`
- 通道 `showConfigured` / `showInSetup` 中繼資料，供通道套件移至
  `openclaw.channel.exposure`
- 舊版 runtime-policy 設定鍵，doctor 會將操作者遷移到
  `agentRuntime`
- 產生的內建通道設定中繼資料後援，直到 registry-first
  `channelConfigs` 中繼資料落地
- 持久化外掛註冊表停用與安裝遷移環境旗標，修復流程會將操作者遷移到 `openclaw plugins registry --refresh`
  和 `openclaw doctor --fix`
- 舊版外掛所擁有的網頁搜尋、網頁擷取與 x_search 設定路徑，doctor 會將它們遷移到 `plugins.entries.<plugin>.config`
- 舊版 `plugins.installs` 作者設定與內建外掛載入路徑別名，安裝中繼資料會移入狀態管理的外掛帳本

### WhatsApp 傳入回呼扁平別名

WhatsApp 執行階段回呼會傳遞 `WebInboundMessage`：標準的巢狀 `event`、`payload`、`quote`、`group` 和 `platform` 情境，加上已棄用的扁平別名，用於已出貨的回呼欄位。新的回呼程式碼應讀取巢狀情境。建構乾淨巢狀回呼訊息的程式碼可以使用 `WebInboundCallbackMessage`；仍注入舊版扁平測試或外掛訊息的相容性監聽器應使用
`LegacyFlatWebInboundMessage` 或 `WebInboundMessageInput`。

扁平別名會保留到 **2026-08-30**；該窗口只適用於扁平別名存取，不適用於巢狀形狀，後者是標準執行階段合約。每個扁平別名的 TypeScript `@deprecated` 註解都會標明其確切的巢狀替代項。常見範例：

- `id`、`timestamp` 和 `isBatched` 移到 `event` 之下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location`
  和 `untrustedStructuredContext` 移到 `payload` 之下。
- `to`、`chatId`、寄件者/自身欄位、`sendComposing`、`reply(...)` 和
  `sendMedia(...)` 移到 `platform` 之下。
- `replyTo*` 欄位移到 `quote` 之下；群組主旨/參與者/提及欄位移到 `group` 之下。

`payload.untrustedStructuredContext` 是從傳入提供者 payload 擷取而來。外掛在將其 `payload` 視為權威之前，應檢查 `label`、`source` 和 `type`。

### WhatsApp 傳入准入欄位

已接受的 WhatsApp 回呼訊息會攜帶 `admission`，這是公開安全的 envelope，用於說明准入該訊息的存取控制決策。新的回呼程式碼應從 `msg.admission` 讀取准入事實，而不是使用較舊的頂層准入欄位。

頂層欄位會保留到 **2026-08-30**。每個欄位的 TypeScript `@deprecated` 註解都會標明其替代項：

- `from` 和 `conversationId` 移到 `admission.conversation.id`。
- `accountId` 移到 `admission.accountId`。
- `accessControlPassed` 是
  `admission.ingress.decision === "allow"` 的衍生相容性檢視；在已攜帶
  `admission` 的訊息上，寫入舊版布林值不會重寫 ingress graph。
- `chatType` 移到 `admission.conversation.kind`。

## 外掛檢查器套件

外掛檢查器應位於核心 OpenClaw repo 之外，作為由版本化相容性與 manifest 合約支援的獨立套件/repository。第一天的命令列介面應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應發出 manifest/schema 驗證、正在檢查的合約相容性版本、安裝/來源中繼資料檢查、冷路徑匯入檢查，以及棄用/相容性警告。使用 `--json` 以在 CI 註解中取得穩定的機器可讀輸出。OpenClaw 核心應公開檢查器可取用的合約與 fixture，但不應從主要 `openclaw` 套件發布檢查器二進位檔。

### 維護者驗收通道

在針對 OpenClaw 外掛套件驗證外部檢查器時，請使用 Crabbox 支援的 Blacksmith Testbox 作為可安裝套件驗收通道。套件建置完成後，從乾淨的 OpenClaw checkout 執行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

此通道應讓維護者選擇性啟用，因為它會安裝外部 npm 套件，並且可能檢查在 repo 外部 clone 的外掛套件。本機 repo 防護涵蓋 SDK 匯出對應、相容性註冊表中繼資料、已棄用 SDK 匯入消減，以及內建 extension 匯入邊界；Testbox 檢查器證明則涵蓋外部外掛作者取用該套件的方式。

## 發行說明

發行說明應包含即將到來的外掛棄用事項、目標日期，以及遷移文件連結，並且要在相容性路徑移至 `removal-pending` 或 `removed` 之前納入。

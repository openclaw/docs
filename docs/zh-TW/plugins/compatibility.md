---
read_when:
    - 你維護一個 OpenClaw 外掛
    - 你看到外掛相容性警告
    - 你正在規劃外掛 SDK 或資訊清單遷移
summary: 外掛相容性契約、棄用中繼資料與遷移預期事項
title: 外掛相容性
x-i18n:
    generated_at: "2026-07-20T00:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1554105e3499dd608237d638174b167d9a78c227fe05668ce1159d466a1f8c10
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw 會先透過具名相容性配接器維持舊版外掛合約的連接，再移除這些合約。這可在 SDK、資訊清單、設定流程、組態及代理程式執行階段合約演進時，保護現有的內建與外部外掛。

## 相容性登錄檔

外掛相容性合約會在位於
`src/plugins/compat/registry.ts` 的核心登錄檔中追蹤。每筆記錄包含：

- 穩定的相容性代碼
- 狀態：`active`、`deprecated`、`removal-pending` 或 `removed`
- 擁有者：`sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、
  `agent-runtime` 或 `core`
- 適用時的導入與棄用日期
- 替代方案指引
- 涵蓋新舊行為的文件、診斷與測試

此登錄檔是維護者規劃及未來外掛檢查器檢查作業的依據。若面向外掛的行為有所變更，請在新增配接器的同一項變更中，新增或更新相容性記錄。

Doctor 修復與遷移相容性會另行追蹤於
`src/commands/doctor/shared/deprecation-compat.ts`。這些記錄涵蓋舊版組態形狀、安裝帳本配置，以及在執行階段相容性路徑移除後可能仍須保持可用的修復相容層。

發布盤點應同時檢查這兩個登錄檔。不要僅因相符的執行階段或組態相容性記錄已到期，就刪除 Doctor 遷移；請先確認沒有仍需該修復的受支援升級路徑。發布規劃期間也要重新驗證每項替代方案註解，因為隨著提供者與頻道移出核心，外掛擁有權及組態涵蓋範圍可能會改變。

## 棄用政策

OpenClaw 不應在導入替代方案的同一版本中，移除已記載於文件的外掛合約。遷移順序：

1. 新增合約。
2. 透過具名相容性配接器維持舊有行為的連接。
3. 在外掛作者可採取行動時發出診斷或警告。
4. 記載替代方案與時程。
5. 測試新舊路徑。
6. 等待已公告的遷移期限結束。
7. 僅在明確核准破壞性版本後移除。

已棄用的記錄必須包含警告開始日期、替代方案、文件連結，以及不晚於警告開始後三個月的最終移除日期。除非維護者明確決定該路徑屬於永久相容性，並改將其標記為 `active`，否則請勿新增移除期限未定的已棄用相容性路徑。

## 目前的相容性範圍

2026 年 7 月的盤點已移除過期的根 SDK、資訊清單、提供者、執行階段、登錄旗標及外掛自有的 Web 組態別名。Doctor 遷移仍會另外追蹤，讓受支援的升級路徑仍可修復舊版組態。

其餘有期限的相容性範圍包括：

- 遷移指南中列出的 8 月與 9 月 SDK 子路徑期限
- `api.on("deactivate", ...)` 與 `api.on("subagent_spawning", ...)` 鉤子別名
- 記憶體專用的嵌入註冊，以及 beta.5 工作階段儲存區橋接器
- 下方所述的 WhatsApp 傳入回呼別名
- 明確頻道目標剖析與 `openclaw/plugin-sdk/messaging-targets`
- 內嵌 Pi 代理程式別名
- 已發布的代理程式控制框架 SDK 別名，其移除作業正等待新的外部文件化遷移決策

有效且未註明日期的登錄記錄涵蓋受支援的行為，而非待移除項目，包括啟用提示、外掛擷取、內建外掛啟用，以及產生的頻道組態後援機制。

### WhatsApp 傳入回呼的扁平別名

WhatsApp 執行階段回呼會傳遞 `WebInboundMessage`：標準巢狀 `event`、`payload`、`quote`、`group` 與 `platform` 上下文，以及已發布回呼欄位的已棄用扁平別名。新的回呼程式碼應讀取巢狀上下文。建構全新巢狀回呼訊息的程式碼可使用 `WebInboundCallbackMessage`；仍會注入舊版扁平測試或外掛訊息的相容性接聽器，則應使用 `LegacyFlatWebInboundMessage` 或 `WebInboundMessageInput`。

扁平別名會保持可用至 **2026-08-30**；此期限僅適用於扁平別名存取，不適用於巢狀形狀，後者是標準執行階段合約。每個扁平別名的 TypeScript `@deprecated` 註解都會指明其確切的巢狀替代項目。常見範例：

- `id`、`timestamp` 與 `isBatched` 移至 `event` 之下。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location`
  與 `untrustedStructuredContext` 移至 `payload` 之下。
- `to`、`chatId`、傳送者／自身欄位、`sendComposing`、`reply(...)` 與
  `sendMedia(...)` 移至 `platform` 之下。
- `replyTo*` 欄位移至 `quote` 之下；群組主旨／參與者／提及
  欄位移至 `group` 之下。

`payload.untrustedStructuredContext` 是從傳入的提供者承載資料中擷取。外掛應先檢查 `label`、`source` 與 `type`，再將其 `payload` 視為權威資訊。

### WhatsApp 傳入訊息准入欄位

已接受的 WhatsApp 回呼訊息會攜帶 `admission`，這是核准該訊息之存取控制決策的公開安全信封。新的回呼程式碼應從 `msg.admission` 讀取准入事實，而不是使用較舊的頂層准入欄位。

頂層欄位會保持可用至 **2026-08-30**。每個欄位的 TypeScript `@deprecated` 註解都會指明其替代項目：

- `from` 與 `conversationId` 移至 `admission.conversation.id`。
- `accountId` 移至 `admission.accountId`。
- `accessControlPassed` 是
  `admission.ingress.decision === "allow"` 的衍生相容性檢視；對於已攜帶
  `admission` 的訊息，寫入舊版布林值不會重寫輸入
  圖形。
- `chatType` 移至 `admission.conversation.kind`。

## 外掛檢查器套件

外掛檢查器應以獨立套件／儲存庫的形式存在於 OpenClaw 核心儲存庫之外，並以具版本的相容性及資訊清單合約為基礎。首日命令列介面應為：

```sh
openclaw-plugin-inspector ./my-plugin
```

它應輸出資訊清單／結構描述驗證、正在檢查的合約相容性版本、安裝／來源中繼資料檢查、冷路徑匯入檢查，以及棄用／相容性警告。在 CI 註解中，使用 `--json` 產生穩定的機器可讀輸出。OpenClaw 核心應公開檢查器可使用的合約與測試固定資料，但不應從主要 `openclaw` 套件發布檢查器二進位檔。

### 維護者驗收通道

針對外部檢查器與 OpenClaw 外掛套件進行驗證時，請使用由 Crabbox 支援的 Blacksmith Testbox 執行可安裝套件驗收通道。套件建置完成後，請從乾淨的 OpenClaw 簽出執行：

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

此通道應維持由維護者選擇性啟用，因為它會安裝外部 npm 套件，且可能檢查複製到儲存庫外的外掛套件。本機儲存庫防護會涵蓋 SDK 匯出對應、相容性登錄檔中繼資料、已棄用 SDK 匯入的逐步淘汰，以及內建擴充功能的匯入邊界；Testbox 檢查器證明則涵蓋外部外掛作者實際使用套件的方式。

## 發行說明

在相容性路徑移至 `removal-pending` 或 `removed` 之前，發行說明應包含即將棄用的外掛項目、目標日期及遷移文件連結。

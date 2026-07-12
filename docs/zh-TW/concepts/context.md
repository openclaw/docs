---
read_when:
    - 您想了解 OpenClaw 中的「上下文」是什麼意思
    - 你正在偵錯模型為何「知道」某件事（或為何忘記了它）
    - 你想要降低上下文負擔（/context、/status、/compact）
summary: 上下文：模型會看到什麼、如何建構，以及如何檢視
title: 上下文
x-i18n:
    generated_at: "2026-07-11T21:16:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

「上下文」是 **OpenClaw 在一次執行中傳送給模型的所有內容**。它受限於模型的**上下文視窗**（權杖上限）。

初學者心智模型：

- **系統提示**（由 OpenClaw 建立）：規則、工具、Skills 清單、時間／執行階段，以及注入的工作區檔案。
- **對話記錄**：此工作階段中你的訊息 + 助理的訊息。
- **工具呼叫／結果 + 附件**：命令輸出、檔案讀取內容、影像／音訊等。

上下文與「記憶」_並不相同_：記憶可以儲存在磁碟上，之後重新載入；上下文則是模型目前視窗中的內容。

## 快速開始（檢視上下文）

- `/status` → 快速查看「我的視窗用了多少？」以及工作階段設定。
- `/context list` → 查看注入了哪些內容及其概略大小（各檔案 + 總計）。
- `/context detail` → 更深入的細目：各檔案、各工具結構描述、各 Skills 項目的大小、系統提示大小，以及可壓縮的對話記錄訊息數。
- `/context map` → 目前工作階段中已追蹤上下文來源的 WinDirStat 風格矩形樹狀圖。
- `/usage tokens` → 在一般回覆後附加每次回覆的用量頁尾。
- `/compact` → 將較早的記錄摘要成精簡項目，以釋放視窗空間。

另請參閱：[斜線命令](/zh-TW/tools/slash-commands)、[權杖用量與成本](/zh-TW/reference/token-use)、[壓縮](/zh-TW/concepts/compaction)。

## 輸出範例

數值會因模型、供應商、工具政策及工作區內容而異。

### `/context list`

```text
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```text
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

傳送一張根據最新快取的執行報告與工作階段對話記錄所產生的影像。在工作階段中，一般訊息尚未產生執行報告之前，`/context map` 會傳回無法使用的訊息，而不會繪製估算圖。矩形面積與所追蹤的提示字元數成正比：

- 對話記錄（使用者訊息、助理回覆、工具結果、壓縮摘要），以及僅傳遞給模型的每回合執行階段上下文和鉤子提示新增內容
- 注入的工作區檔案
- 基礎系統提示文字
- Skills 提示項目
- 工具 JSON 結構描述

對話群組會隨工作階段進行而增長，因此圖表每回合都會變化；壓縮後，它會折疊成摘要圖塊。

沒有快取執行報告時，`/context list`、`/context detail` 和 `/context json` 仍可檢視隨需計算的估算值。

## 哪些內容會計入上下文視窗

模型接收的所有內容都會計入，包括：

- 系統提示（所有區段）。
- 對話記錄。
- 工具呼叫 + 工具結果。
- 附件／轉錄內容（影像／音訊／檔案）。
- 壓縮摘要與修剪產物。
- 供應商的「包裝內容」或隱藏標頭（不可見，但仍會計入）。

## OpenClaw 如何建立系統提示

系統提示**由 OpenClaw 管理**，並會在每次執行時重新建立。它包括：

- 工具清單 + 簡短說明。
- Skills 清單（僅中繼資料；請見下文）。
- 工作區位置。
- 時間（UTC + 已設定時轉換後的使用者時間）。
- 執行階段中繼資料（主機／作業系統／模型／思考模式）。
- **專案上下文**下所注入的工作區啟動檔案。

完整細目：[系統提示](/zh-TW/concepts/system-prompt)。

## 注入的工作區檔案（專案上下文）

OpenClaw 預設會注入一組固定的工作區檔案（若存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅首次執行）

大型檔案會依各檔案的 `agents.defaults.bootstrapMaxChars`（預設為 `20000` 個字元）截斷。OpenClaw 也會透過 `agents.defaults.bootstrapTotalMaxChars`（預設為 `60000` 個字元）限制跨檔案的啟動內容注入總量。`/context` 會顯示**原始大小與注入大小**，以及是否發生截斷。

發生截斷時，執行階段可在專案上下文中注入提示內警告區塊。使用 `agents.defaults.bootstrapPromptTruncationWarning` 設定此行為（`off`、`once`、`always`；預設為 `always`）。

## Skills：注入與隨需載入

系統提示包含精簡的 **Skills 清單**（名稱 + 說明 + 位置）。這份清單確實會產生額外負擔。

Skills 指示預設_不會_包含在內。模型應僅在**需要時**才 `read` 該 Skills 的 `SKILL.md`。

## 工具：有兩種成本

工具會透過兩種方式影響上下文：

1. 系統提示中的**工具清單文字**（你看到的「工具」）。
2. **工具結構描述**（JSON）。這些內容會傳送給模型，使模型能呼叫工具。即使你看不到其純文字形式，它們仍會計入上下文。

`/context detail` 會列出最大的工具結構描述，讓你看出哪些項目占用最多空間。

## 命令、指令與「行內捷徑」

斜線命令由閘道處理。其行為分為以下幾種：

- **獨立命令**：只包含 `/...` 的訊息會作為命令執行。
- **指令**：`/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue` 會在模型看到訊息之前移除。
  - 僅含指令的訊息會保留工作階段設定。
  - 一般訊息中的行內指令會作為該訊息的提示。
- **行內捷徑**（僅限允許清單中的傳送者）：一般訊息內的特定 `/...` 權杖可以立即執行（例如：「嗨 /status」），並會在模型看到剩餘文字前移除。

詳細資訊：[斜線命令](/zh-TW/tools/slash-commands)。

## 工作階段、壓縮與修剪（哪些內容會保留）

跨訊息保留的內容取決於所使用的機制：

- **一般記錄**會保留在工作階段對話記錄中，直到依政策壓縮或修剪。
- **壓縮**會將摘要保留至對話記錄中，並完整保留最近的訊息。
- **修剪**會從_記憶體中的_提示移除舊工具結果，以釋放上下文視窗空間，但不會重寫工作階段對話記錄——完整記錄仍可在磁碟上檢視。

文件：[工作階段](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)。

OpenClaw 預設使用內建的 `legacy` 上下文引擎進行組裝與壓縮。如果你安裝了提供 `kind: "context-engine"` 的外掛，並透過 `plugins.slots.contextEngine` 選取它，OpenClaw 便會改由該引擎負責上下文組裝、`/compact`，以及相關子代理程式的上下文生命週期鉤子。`ownsCompaction: false` 不會自動退回 `legacy` 引擎；作用中的引擎仍必須正確實作 `compact()`。如需完整的可插拔介面、生命週期鉤子及設定方式，請參閱[上下文引擎](/zh-TW/concepts/context-engine)。

## `/context` 實際報告的內容

若有可用資料，`/context` 會優先採用最新的**執行時建立**系統提示報告：

- `System prompt (run)` = 從上一次內嵌式（可使用工具）執行擷取，並保留在工作階段儲存區中。
- `System prompt (estimate)` = 沒有執行報告時（或透過不會產生該報告的命令列介面後端執行時）即時計算。

無論採用哪種方式，它都會報告大小及主要占用來源；**不會**傾印完整的系統提示或工具結構描述。在詳細模式下，它也會使用與壓縮相同的真實對話訊息判斷條件來比較工作階段對話記錄，讓高提示／快取用量更容易與可壓縮的對話記錄區分。

## 相關內容

<CardGroup cols={2}>
  <Card title="上下文引擎" href="/zh-TW/concepts/context-engine" icon="puzzle-piece">
    透過外掛自訂上下文注入。
  </Card>
  <Card title="壓縮" href="/zh-TW/concepts/compaction" icon="compress">
    摘要長篇對話，使其維持在模型視窗範圍內。
  </Card>
  <Card title="系統提示" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    系統提示如何建立，以及每回合會注入哪些內容。
  </Card>
  <Card title="代理程式迴圈" href="/zh-TW/concepts/agent-loop" icon="arrows-rotate">
    從收到訊息到最終回覆的完整代理程式執行週期。
  </Card>
</CardGroup>

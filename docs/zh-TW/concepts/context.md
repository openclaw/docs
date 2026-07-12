---
read_when:
    - 你想了解 OpenClaw 中的「上下文」是什麼意思
    - 你正在偵錯模型為何「知道」某件事（或為何忘記了它）
    - 你想降低上下文負擔（/context、/status、/compact）
summary: 脈絡：模型會看到什麼、如何建構，以及如何檢查脈絡
title: 情境
x-i18n:
    generated_at: "2026-07-12T14:27:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

“上下文”是 **OpenClaw 在一次執行中傳送給模型的所有內容**。它受模型的**上下文視窗**（權杖限制）約束。

初學者心智模型：

- **系統提示詞**（由 OpenClaw 建構）：規則、工具、Skills 清單、時間／執行環境，以及注入的工作區檔案。
- **對話歷史記錄**：此工作階段中你的訊息 + 助理的訊息。
- **工具呼叫／結果 + 附件**：命令輸出、檔案讀取內容、圖片／音訊等。

上下文與“記憶”_並不相同_：記憶可以儲存在磁碟上並於稍後重新載入；上下文則是模型目前視窗內的內容。

## 快速開始（檢查上下文）

- `/status` → 快速查看“我的視窗用了多少？”以及工作階段設定。
- `/context list` → 查看注入了哪些內容及其概略大小（各檔案 + 總計）。
- `/context detail` → 更深入的明細：各檔案、各工具結構描述、各 Skill 項目的大小、系統提示詞大小，以及可壓縮的對話訊息數量。
- `/context map` → 目前工作階段中已追蹤上下文來源的 WinDirStat 風格樹狀圖圖片。
- `/usage tokens` → 在一般回覆後附加每次回覆的用量頁尾。
- `/compact` → 將較舊的歷史記錄摘要為精簡項目，以釋放視窗空間。

另請參閱：[斜線命令](/zh-TW/tools/slash-commands)、[權杖用量與費用](/zh-TW/reference/token-use)、[壓縮](/zh-TW/concepts/compaction)。

## 輸出範例

數值會因模型、供應商、工具政策及工作區中的內容而異。

### `/context list`

```text
🧠 上下文明細
工作區：<workspaceDir>
啟動載入上限／檔案：12,000 個字元
沙箱：mode=non-main sandboxed=false
系統提示詞（執行）：38,412 個字元（約 9,603 個權杖）（專案上下文 23,901 個字元（約 5,976 個權杖））

注入的工作區檔案：
- AGENTS.md：正常 | 原始 1,742 個字元（約 436 個權杖）| 注入 1,742 個字元（約 436 個權杖）
- SOUL.md：正常 | 原始 912 個字元（約 228 個權杖）| 注入 912 個字元（約 228 個權杖）
- TOOLS.md：已截斷 | 原始 54,210 個字元（約 13,553 個權杖）| 注入 20,962 個字元（約 5,241 個權杖）
- IDENTITY.md：正常 | 原始 211 個字元（約 53 個權杖）| 注入 211 個字元（約 53 個權杖）
- USER.md：正常 | 原始 388 個字元（約 97 個權杖）| 注入 388 個字元（約 97 個權杖）
- HEARTBEAT.md：缺少 | 原始 0 | 注入 0
- BOOTSTRAP.md：正常 | 原始 0 個字元（約 0 個權杖）| 注入 0 個字元（約 0 個權杖）

Skills 清單（系統提示詞文字）：2,184 個字元（約 546 個權杖）（12 個 Skills）
工具：read、edit、write、exec、process、browser、message、sessions_send、…
工具清單（系統提示詞文字）：1,032 個字元（約 258 個權杖）
工具結構描述（JSON）：31,988 個字元（約 7,997 個權杖）（會計入上下文；不會顯示為文字）
工具：（同上）

工作階段權杖（已快取）：共 14,250 / ctx=32,000
```

### `/context detail`

```text
🧠 上下文明細（詳細）
…
主要 Skills（提示詞項目大小）：
- frontend-design：412 個字元（約 103 個權杖）
- oracle：401 個字元（約 101 個權杖）
…（另有 10 個 Skills）

主要工具（結構描述大小）：
- browser：9,812 個字元（約 2,453 個權杖）
- exec：6,240 個字元（約 1,560 個權杖）
…（另有 N 個工具）
```

### `/context map`

傳送使用最新快取執行報告及工作階段對話記錄所產生的圖片。在工作階段中的一般訊息產生執行報告之前，`/context map` 會傳回無法使用的訊息，而不是呈現估算結果。矩形面積與已追蹤的提示詞字元數成正比：

- 對話記錄（使用者訊息、助理回覆、工具結果、壓縮摘要），加上每回合僅傳給模型的執行階段上下文及鉤子提示詞附加內容
- 注入的工作區檔案
- 基礎系統提示詞文字
- Skill 提示詞項目
- 工具 JSON 結構描述

對話群組會隨工作階段進行而增長，因此此圖會逐回合變化；壓縮後，它會收合為摘要圖塊。

沒有快取的執行報告時，`/context list`、`/context detail` 和 `/context json` 仍可檢查隨選估算結果。

## 哪些內容會計入上下文視窗

模型收到的所有內容都會計入，包括：

- 系統提示詞（所有區段）。
- 對話歷史記錄。
- 工具呼叫 + 工具結果。
- 附件／逐字稿（圖片／音訊／檔案）。
- 壓縮摘要及修剪產物。
- 供應商“包裝層”或隱藏標頭（不可見，但仍會計入）。

## OpenClaw 如何建構系統提示詞

系統提示詞由 **OpenClaw 管理**，並在每次執行時重新建構。它包括：

- 工具清單 + 簡短說明。
- Skills 清單（僅中繼資料；見下文）。
- 工作區位置。
- 時間（UTC + 已設定時轉換後的使用者時間）。
- 執行環境中繼資料（主機／作業系統／模型／思考）。
- **專案上下文**下所注入的工作區啟動檔案。

完整明細：[系統提示詞](/zh-TW/concepts/system-prompt)。

## 注入的工作區檔案（專案上下文）

預設情況下，OpenClaw 會注入一組固定的工作區檔案（若存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅限首次執行）

大型檔案會依個別檔案使用 `agents.defaults.bootstrapMaxChars`（預設為 `20000` 個字元）截斷。OpenClaw 也會透過 `agents.defaults.bootstrapTotalMaxChars`（預設為 `60000` 個字元）限制所有檔案的啟動注入總量。`/context` 會顯示**原始與已注入**的大小，以及是否發生截斷。

發生截斷時，執行階段可在「專案內容」下方注入提示詞內警告區塊。請使用 `agents.defaults.bootstrapPromptTruncationWarning`（`off`、`once`、`always`；預設為 `always`）進行設定。

## Skills：注入與隨需載入

系統提示詞包含精簡的 **Skills 清單**（名稱 + 說明 + 位置）。此清單會產生實際的額外負擔。

預設不會包含 Skill 指示。模型應該**僅在需要時**才 `read` 該 Skill 的 `SKILL.md`。

## 工具：有兩種成本

工具會以兩種方式影響內容：

1. 系統提示詞中的**工具清單文字**（也就是你看到的「工具」）。
2. **工具結構描述**（JSON）。這些內容會傳送給模型，使其能呼叫工具。即使你不會看到純文字形式的內容，它們仍會計入內容用量。

`/context detail` 會列出最大的工具結構描述，讓你看出哪些項目占用最多內容。

## 命令、指令與「行內捷徑」

斜線命令由閘道處理。共有幾種不同的行為：

- **獨立命令**：只有 `/...` 的訊息會作為命令執行。
- **指令**：模型看到訊息前，會先移除 `/think`、`/fast`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/exec`、`/model`、`/queue`。
  - 僅包含指令的訊息會保留工作階段設定。
  - 一般訊息中的行內指令會作為該訊息的提示。
- **行內捷徑**（僅限允許清單中的傳送者）：一般訊息中的特定 `/...` 詞元可立即執行（例如："hey /status"），模型看到剩餘文字前會先移除這些詞元。

詳細資訊：[斜線命令](/zh-TW/tools/slash-commands)。

## 工作階段、壓縮與修剪（哪些內容會保留）

訊息之間保留哪些內容取決於所使用的機制：

- **一般歷程記錄**會保留在工作階段逐字記錄中，直到依政策壓縮或修剪。
- **壓縮**會將摘要保留至逐字記錄中，並完整保留近期訊息。
- **修剪**會從_記憶體內_提示中移除舊的工具結果，以釋放上下文視窗空間，但不會改寫工作階段逐字記錄——完整歷程記錄仍可在磁碟上檢視。

文件：[工作階段](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)。

OpenClaw 預設使用內建的 `legacy` 上下文引擎進行組裝與
壓縮。如果你安裝了提供 `kind: "context-engine"` 的外掛，並透過
`plugins.slots.contextEngine` 選取該外掛，OpenClaw 便會將上下文
組裝、`/compact` 及相關子代理程式的上下文生命週期掛鉤委派給該
引擎。`ownsCompaction: false` 不會自動回退至舊版
引擎；作用中的引擎仍必須正確實作 `compact()`。如需完整的
可插拔介面、生命週期掛鉤與設定，請參閱
[上下文引擎](/zh-TW/concepts/context-engine)。

## `/context` 實際回報的內容

若有最新的**執行時建構**系統提示報告，`/context` 會優先使用該報告：

- `System prompt (run)` = 從上一次內嵌式（可使用工具）執行中擷取，並保留在工作階段儲存區中。
- `System prompt (estimate)` = 沒有執行報告時（或透過不會產生該報告的命令列介面後端執行時）即時計算。

無論是哪種方式，它都會回報大小與主要貢獻項目；**不會**傾印完整的系統提示或工具結構描述。在詳細模式中，它也會使用與壓縮相同的真實對話訊息判定條件，比較工作階段逐字記錄，讓你更容易區分高提示／快取用量與可壓縮的對話歷程記錄。

## 相關內容

<CardGroup cols={2}>
  <Card title="上下文引擎" href="/zh-TW/concepts/context-engine" icon="puzzle-piece">
    透過外掛自訂上下文注入。
  </Card>
  <Card title="壓縮" href="/zh-TW/concepts/compaction" icon="compress">
    摘要長篇對話，使其保持在模型視窗範圍內。
  </Card>
  <Card title="系統提示" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    系統提示的建構方式，以及每一輪會注入哪些內容。
  </Card>
  <Card title="代理程式迴圈" href="/zh-TW/concepts/agent-loop" icon="arrows-rotate">
    從接收訊息到最終回覆的完整代理程式執行週期。
  </Card>
</CardGroup>

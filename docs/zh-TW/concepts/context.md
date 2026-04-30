---
read_when:
    - 你想了解 OpenClaw 中「上下文」的含義
    - 你正在偵錯模型為何「知道」某件事（或為何忘了它）
    - 你想減少上下文開銷（/context、/status、/compact）
summary: 上下文：模型看到的內容、其建構方式，以及如何檢視它
title: 上下文
x-i18n:
    generated_at: "2026-04-30T02:59:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 16
---

「上下文」是 **OpenClaw 為一次執行傳送給模型的所有內容**。它受模型的 **上下文視窗**（詞元限制）約束。

初學者心智模型：

- **系統提示詞**（由 OpenClaw 建立）：規則、工具、Skills 清單、時間/執行階段，以及注入的工作區檔案。
- **對話歷史**：你在此工作階段中的訊息 + 助理的訊息。
- **工具呼叫/結果 + 附件**：命令輸出、檔案讀取、圖片/音訊等。

上下文 _不等同於_「記憶」：記憶可以儲存在磁碟上並於稍後重新載入；上下文是模型目前視窗內的內容。

## 快速開始（檢查上下文）

- `/status` → 快速查看「我的視窗有多滿？」+ 工作階段設定。
- `/context list` → 已注入的內容 + 粗略大小（每個檔案 + 總計）。
- `/context detail` → 更深入的細分：每個檔案、每個工具結構描述大小、每個 Skill 項目大小，以及系統提示詞大小。
- `/usage tokens` → 在一般回覆後附加每則回覆的使用量頁尾。
- `/compact` → 將較舊的歷史摘要為精簡項目，以釋放視窗空間。

另請參閱：[斜線命令](/zh-TW/tools/slash-commands)、[詞元使用量與成本](/zh-TW/reference/token-use)、[Compaction](/zh-TW/concepts/compaction)。

## 範例輸出

數值會依模型、供應商、工具政策，以及工作區中的內容而異。

### `/context list`

```
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

```
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

## 哪些內容會計入上下文視窗

模型接收到的所有內容都會計入，包括：

- 系統提示詞（所有區段）。
- 對話歷史。
- 工具呼叫 + 工具結果。
- 附件/逐字稿（圖片/音訊/檔案）。
- Compaction 摘要與修剪成品。
- 供應商「包裝器」或隱藏標頭（不可見，但仍會計入）。

## OpenClaw 如何建立系統提示詞

系統提示詞由 **OpenClaw 擁有**，並在每次執行時重新建立。它包括：

- 工具清單 + 簡短描述。
- Skills 清單（僅中繼資料；見下方）。
- 工作區位置。
- 時間（UTC + 若已設定則包含轉換後的使用者時間）。
- 執行階段中繼資料（主機/作業系統/模型/思考）。
- 在 **專案上下文** 下方注入的工作區啟動檔案。

完整細分：[系統提示詞](/zh-TW/concepts/system-prompt)。

## 注入的工作區檔案（專案上下文）

預設情況下，OpenClaw 會注入一組固定的工作區檔案（若存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅首次執行）

大型檔案會依檔案使用 `agents.defaults.bootstrapMaxChars`（預設 `12000` 字元）截斷。OpenClaw 也會使用 `agents.defaults.bootstrapTotalMaxChars`（預設 `60000` 字元）對跨檔案的啟動注入總量強制設定上限。`/context` 會顯示 **原始與已注入** 大小，以及是否發生截斷。

發生截斷時，執行階段可以在專案上下文下方注入提示詞內警告區塊。使用 `agents.defaults.bootstrapPromptTruncationWarning` 設定此行為（`off`、`once`、`always`；預設 `once`）。

## Skills：已注入與隨需載入

系統提示詞包含精簡的 **Skills 清單**（名稱 + 描述 + 位置）。此清單有實際開銷。

Skill 指示預設 _不會_ 包含在內。模型應該 **只在需要時** `read` 該 Skill 的 `SKILL.md`。

## 工具：有兩種成本

工具會以兩種方式影響上下文：

1. 系統提示詞中的 **工具清單文字**（你看到的「工具」）。
2. **工具結構描述**（JSON）。這些會傳送給模型，讓它可以呼叫工具。即使你不會看到它們作為純文字，它們仍會計入上下文。

`/context detail` 會細分最大的工具結構描述，讓你看到主要占用來源。

## 命令、指令與「內嵌捷徑」

斜線命令由 Gateway 處理。有幾種不同行為：

- **獨立命令**：只有 `/...` 的訊息會作為命令執行。
- **指令**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 會在模型看到訊息之前被移除。
  - 僅含指令的訊息會保存工作階段設定。
  - 一般訊息中的內嵌指令會作為每則訊息的提示。
- **內嵌捷徑**（僅限允許清單中的傳送者）：一般訊息內的某些 `/...` 詞元可以立即執行（範例：「hey /status」），並會在模型看到剩餘文字之前被移除。

詳細資訊：[斜線命令](/zh-TW/tools/slash-commands)。

## 工作階段、Compaction 與修剪（哪些內容會持久保存）

哪些內容會跨訊息持久保存，取決於機制：

- **一般歷史** 會持久保存在工作階段逐字稿中，直到依政策被壓縮/修剪。
- **Compaction** 會將摘要持久保存到逐字稿中，並保留最近的訊息不變。
- **修剪** 會從 _記憶體內_ 提示詞中移除舊工具結果，以釋放上下文視窗空間，但不會重寫工作階段逐字稿 — 完整歷史仍可在磁碟上檢查。

文件：[工作階段](/zh-TW/concepts/session)、[Compaction](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)。

預設情況下，OpenClaw 會使用內建的 `legacy` 上下文引擎進行組裝與
Compaction。如果你安裝提供 `kind: "context-engine"` 的 Plugin，並
使用 `plugins.slots.contextEngine` 選取它，OpenClaw 會改為將上下文
組裝、`/compact`，以及相關子代理上下文生命週期鉤子委派給該
引擎。`ownsCompaction: false` 不會自動退回到 legacy
引擎；作用中的引擎仍必須正確實作 `compact()`。請參閱
[上下文引擎](/zh-TW/concepts/context-engine)，了解完整的
可插拔介面、生命週期鉤子與設定。

## `/context` 實際報告的內容

`/context` 會在可用時優先使用最新的 **執行建立** 系統提示詞報告：

- `System prompt (run)` = 從上一次嵌入式（可使用工具）執行擷取，並持久保存在工作階段儲存區。
- `System prompt (estimate)` = 在沒有執行報告時即時計算（或透過不產生報告的 CLI 後端執行時）。

無論哪種方式，它都會報告大小與主要貢獻來源；它 **不會** 傾印完整系統提示詞或工具結構描述。

## 相關

- [上下文引擎](/zh-TW/concepts/context-engine) — 透過 plugins 自訂上下文注入
- [Compaction](/zh-TW/concepts/compaction) — 摘要長對話
- [系統提示詞](/zh-TW/concepts/system-prompt) — 系統提示詞的建構方式
- [代理迴圈](/zh-TW/concepts/agent-loop) — 完整代理執行週期

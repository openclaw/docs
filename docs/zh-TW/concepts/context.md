---
read_when:
    - 你想了解 OpenClaw 中「上下文」的含義
    - 你正在偵錯模型為什麼「知道」某件事（或為什麼忘記它）
    - 你想降低上下文開銷（/context, /status, /compact）
summary: 上下文：模型會看到什麼、它是如何建構的，以及如何檢查它
title: 上下文
x-i18n:
    generated_at: "2026-05-06T02:45:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

「上下文」是 **OpenClaw 在一次執行中傳送給模型的全部內容**。它受限於模型的 **上下文視窗**（token 限制）。

初學者心智模型：

- **系統提示**（OpenClaw 建立）：規則、工具、Skills 清單、時間/執行環境，以及注入的工作區檔案。
- **對話歷史**：你在此工作階段的訊息 + 助理的訊息。
- **工具呼叫/結果 + 附件**：命令輸出、檔案讀取、圖片/音訊等。

上下文與「記憶」_不是同一件事_：記憶可以儲存在磁碟上並稍後重新載入；上下文則是模型目前視窗內的內容。

## 快速開始（檢查上下文）

- `/status` → 快速查看「我的視窗有多滿？」+ 工作階段設定。
- `/context list` → 已注入的內容 + 粗略大小（每個檔案 + 總計）。
- `/context detail` → 更深入的細項：每個檔案、每個工具 schema 大小、每個 Skill 項目大小，以及系統提示大小。
- `/usage tokens` → 在一般回覆後附加每則回覆的使用量頁尾。
- `/compact` → 將較舊的歷史摘要成一個精簡項目，以釋放視窗空間。

另請參閱：[斜線命令](/zh-TW/tools/slash-commands)、[Token 使用量與成本](/zh-TW/reference/token-use)、[Compaction](/zh-TW/concepts/compaction)。

## 範例輸出

數值會因模型、提供者、工具政策，以及工作區內容而異。

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

## 會計入上下文視窗的內容

模型接收的一切都會計入，包括：

- 系統提示（所有段落）。
- 對話歷史。
- 工具呼叫 + 工具結果。
- 附件/逐字稿（圖片/音訊/檔案）。
- Compaction 摘要和修剪成品。
- 提供者「包裝」或隱藏標頭（不可見，但仍會計入）。

## OpenClaw 如何建立系統提示

系統提示由 **OpenClaw 擁有**，並會在每次執行時重新建立。它包含：

- 工具清單 + 簡短說明。
- Skills 清單（僅中繼資料；見下文）。
- 工作區位置。
- 時間（UTC + 已設定時轉換後的使用者時間）。
- 執行環境中繼資料（主機/作業系統/模型/思考）。
- **專案上下文** 下方注入的工作區啟動檔案。

完整細項：[系統提示](/zh-TW/concepts/system-prompt)。

## 注入的工作區檔案（專案上下文）

依預設，OpenClaw 會注入一組固定的工作區檔案（如果存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅首次執行）

大型檔案會使用 `agents.defaults.bootstrapMaxChars`（預設 `12000` 字元）依檔案截斷。OpenClaw 也會使用 `agents.defaults.bootstrapTotalMaxChars`（預設 `60000` 字元）對跨檔案的啟動注入總量施加上限。`/context` 會顯示 **原始與注入後** 大小，以及是否發生截斷。

發生截斷時，執行環境可以在提示中於「專案上下文」下方注入警告區塊。使用 `agents.defaults.bootstrapPromptTruncationWarning` 設定此行為（`off`、`once`、`always`；預設 `once`）。

## Skills：已注入與按需載入

系統提示包含精簡的 **Skills 清單**（名稱 + 說明 + 位置）。此清單有實際開銷。

Skill 指示預設_不會_包含在內。模型預期只在需要時 `read` 該 Skill 的 `SKILL.md`。

## 工具：有兩種成本

工具會以兩種方式影響上下文：

1. 系統提示中的 **工具清單文字**（你看到的「工具」）。
2. **工具 schema**（JSON）。這些會傳送給模型，讓它可以呼叫工具。即使你不會以純文字看到它們，它們仍會計入上下文。

`/context detail` 會拆解最大的工具 schema，讓你看出哪些部分佔最多。

## 命令、指令與「行內捷徑」

斜線命令由 Gateway 處理。它有幾種不同的行為：

- **獨立命令**：只有 `/...` 的訊息會以命令執行。
- **指令**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 會在模型看到訊息前被移除。
  - 只有指令的訊息會保留工作階段設定。
  - 一般訊息中的行內指令會作為該訊息的提示。
- **行內捷徑**（僅允許清單中的傳送者）：一般訊息內的某些 `/...` token 可以立即執行（範例：「hey /status」），並且會在模型看到剩餘文字前被移除。

詳細資訊：[斜線命令](/zh-TW/tools/slash-commands)。

## 工作階段、Compaction 與修剪（哪些會保留）

跨訊息保留的內容取決於機制：

- **一般歷史** 會保留在工作階段逐字稿中，直到依政策進行壓縮/修剪。
- **Compaction** 會將摘要保留到逐字稿中，並保留近期訊息完整。
- **修剪** 會從_記憶體中_的提示移除舊工具結果，以釋放上下文視窗空間，但不會改寫工作階段逐字稿 - 完整歷史仍可在磁碟上檢查。

文件：[工作階段](/zh-TW/concepts/session)、[Compaction](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)。

依預設，OpenClaw 使用內建的 `legacy` 上下文引擎來組裝和
Compaction。如果你安裝提供 `kind: "context-engine"` 的 Plugin，並使用
`plugins.slots.contextEngine` 選取它，OpenClaw 會改為將上下文
組裝、`/compact`，以及相關子代理上下文生命週期 hook 委派給該
引擎。`ownsCompaction: false` 不會自動回退到 legacy
引擎；啟用中的引擎仍必須正確實作 `compact()`。請參閱
[上下文引擎](/zh-TW/concepts/context-engine)，了解完整的
可插拔介面、生命週期 hook 與設定。

## `/context` 實際回報的內容

`/context` 會優先使用可用的最新 **執行時建立** 系統提示報告：

- `System prompt (run)` = 從最後一次內嵌（可使用工具）的執行擷取，並保存在工作階段儲存區。
- `System prompt (estimate)` = 沒有執行報告時（或透過不產生該報告的 CLI 後端執行時）即時計算。

無論哪種方式，它都會回報大小與主要貢獻者；它**不會**傾印完整系統提示或工具 schema。

## 相關

<CardGroup cols={2}>
  <Card title="上下文引擎" href="/zh-TW/concepts/context-engine" icon="puzzle-piece">
    透過 Plugins 進行自訂上下文注入。
  </Card>
  <Card title="Compaction" href="/zh-TW/concepts/compaction" icon="compress">
    摘要長對話，讓它們維持在模型視窗內。
  </Card>
  <Card title="系統提示" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    系統提示如何建立，以及每一輪會注入什麼。
  </Card>
  <Card title="代理迴圈" href="/zh-TW/concepts/agent-loop" icon="arrows-rotate">
    從傳入訊息到最終回覆的完整代理執行週期。
  </Card>
</CardGroup>

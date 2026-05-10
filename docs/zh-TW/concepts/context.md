---
read_when:
    - 你想了解「上下文」在 OpenClaw 中的意思
    - 你正在偵錯為什麼模型「知道」某件事（或忘記了它）
    - 你想減少上下文開銷 (/context, /status, /compact)
summary: 上下文：模型會看到的內容、其建構方式，以及如何檢查它
title: 上下文
x-i18n:
    generated_at: "2026-05-10T19:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

「上下文」是 **OpenClaw 在一次執行中傳送給模型的所有內容**。它受模型的 **上下文視窗**（token 限制）約束。

初學者心智模型：

- **系統提示**（由 OpenClaw 建構）：規則、工具、Skills 清單、時間/執行階段，以及注入的工作區檔案。
- **對話歷史**：你在此工作階段中的訊息 + 助理的訊息。
- **工具呼叫/結果 + 附件**：命令輸出、檔案讀取、圖片/音訊等。

上下文與「記憶」_不是同一件事_：記憶可以儲存在磁碟上並稍後重新載入；上下文則是目前位於模型視窗內的內容。

## 快速開始（檢查上下文）

- `/status` → 快速查看「我的視窗有多滿？」+ 工作階段設定。
- `/context list` → 已注入的內容 + 粗略大小（每個檔案 + 總計）。
- `/context detail` → 更深入的分解：每個檔案、每個工具結構描述大小、每個 Skill 項目大小，以及系統提示大小。
- `/context map` → 目前工作階段中已追蹤上下文貢獻來源的 WinDirStat 風格樹狀圖圖片。
- `/usage tokens` → 在一般回覆後附加每則回覆的使用量頁尾。
- `/compact` → 將較舊的歷史摘要成精簡項目，以釋放視窗空間。

另請參閱：[斜線命令](/zh-TW/tools/slash-commands)、[Token 使用量與成本](/zh-TW/reference/token-use)、[Compaction](/zh-TW/concepts/compaction)。

## 範例輸出

數值會依模型、提供者、工具政策，以及工作區中的內容而異。

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

### `/context map`

會傳送一張由最新快取執行報告產生的圖片。在工作階段中有一般訊息產生執行報告之前，`/context map` 會回傳不可用訊息，而不是渲染估算結果。矩形面積與已追蹤的提示字元數成比例：

- 注入的工作區檔案
- 基礎系統提示文字
- Skill 提示項目
- 工具 JSON 結構描述

即使沒有快取執行報告，`/context list`、`/context detail` 和 `/context json` 仍可檢查隨選估算。

## 什麼會計入上下文視窗

模型收到的一切都會計入，包括：

- 系統提示（所有區段）。
- 對話歷史。
- 工具呼叫 + 工具結果。
- 附件/轉錄稿（圖片/音訊/檔案）。
- Compaction 摘要與修剪成品。
- 提供者「包裝」或隱藏標頭（不可見，但仍會計入）。

## OpenClaw 如何建構系統提示

系統提示由 **OpenClaw 擁有**，並在每次執行時重新建構。它包含：

- 工具清單 + 簡短說明。
- Skills 清單（僅中繼資料；見下文）。
- 工作區位置。
- 時間（UTC + 已設定時轉換後的使用者時間）。
- 執行階段中繼資料（主機/OS/模型/thinking）。
- 注入在 **Project Context** 下的工作區啟動檔案。

完整分解：[系統提示](/zh-TW/concepts/system-prompt)。

## 注入的工作區檔案（Project Context）

預設情況下，OpenClaw 會注入一組固定的工作區檔案（若存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅首次執行）

大型檔案會使用 `agents.defaults.bootstrapMaxChars`（預設 `12000` 字元）按檔案截斷。OpenClaw 也會透過 `agents.defaults.bootstrapTotalMaxChars`（預設 `60000` 字元）在所有檔案上強制套用啟動注入總上限。`/context` 會顯示**原始 vs 注入後**大小，以及是否發生截斷。

發生截斷時，執行階段可以在 Project Context 下於提示內注入警告區塊。可使用 `agents.defaults.bootstrapPromptTruncationWarning` 設定此行為（`off`、`once`、`always`；預設 `once`）。

## Skills：注入 vs 隨選載入

系統提示包含精簡的 **Skills 清單**（名稱 + 說明 + 位置）。此清單有實際開銷。

Skill 指令預設_不會_包含在內。模型應該**只在需要時** `read` 該 Skill 的 `SKILL.md`。

## 工具：有兩種成本

工具會以兩種方式影響上下文：

1. 系統提示中的**工具清單文字**（你看到的「Tooling」）。
2. **工具結構描述**（JSON）。這些會傳送給模型，使其能呼叫工具。即使你不會以純文字形式看到它們，它們仍會計入上下文。

`/context detail` 會分解最大的工具結構描述，讓你看出主要佔用來源。

## 命令、指令與「行內捷徑」

斜線命令由 Gateway 處理。有幾種不同的行為：

- **獨立命令**：只有 `/...` 的訊息會以命令執行。
- **指令**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 會在模型看到訊息前被移除。
  - 只有指令的訊息會保留工作階段設定。
  - 一般訊息中的行內指令會作為單則訊息提示。
- **行內捷徑**（僅限允許清單中的傳送者）：一般訊息內的特定 `/...` token 可以立即執行（範例：「hey /status」），並會在模型看到剩餘文字前被移除。

詳情：[斜線命令](/zh-TW/tools/slash-commands)。

## 工作階段、Compaction 與修剪（什麼會保留）

跨訊息保留的內容取決於機制：

- **一般歷史**會保留在工作階段轉錄稿中，直到依政策被 compact/prune。
- **Compaction** 會將摘要保留到轉錄稿中，並保持近期訊息完整。
- **修剪**會從_記憶體內_提示中移除舊工具結果，以釋放上下文視窗空間，但不會重寫工作階段轉錄稿 - 完整歷史仍可在磁碟上檢查。

文件：[工作階段](/zh-TW/concepts/session)、[Compaction](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)。

預設情況下，OpenClaw 會使用內建的 `legacy` 上下文引擎進行組裝與
Compaction。如果你安裝提供 `kind: "context-engine"` 的 Plugin，並使用
`plugins.slots.contextEngine` 選取它，OpenClaw 會改為將上下文組裝、
`/compact` 以及相關子代理上下文生命週期鉤子委派給該引擎。
`ownsCompaction: false` 不會自動回退到 legacy 引擎；啟用中的引擎仍必須正確實作
`compact()`。完整的可插拔介面、生命週期鉤子與設定請參閱
[上下文引擎](/zh-TW/concepts/context-engine)。

## `/context` 實際回報什麼

可用時，`/context` 會優先使用最新的**執行時建構**系統提示報告：

- `System prompt (run)` = 從最後一次嵌入式（可用工具）執行擷取，並保留在工作階段儲存中。
- `System prompt (estimate)` = 沒有執行報告時即時計算（或透過不產生該報告的 CLI 後端執行時）。

無論哪種方式，它都會回報大小與主要貢獻來源；它**不會**傾印完整系統提示或工具結構描述。

## 相關

<CardGroup cols={2}>
  <Card title="上下文引擎" href="/zh-TW/concepts/context-engine" icon="puzzle-piece">
    透過 Plugin 自訂上下文注入。
  </Card>
  <Card title="Compaction" href="/zh-TW/concepts/compaction" icon="compress">
    摘要長對話，使其保持在模型視窗內。
  </Card>
  <Card title="系統提示" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    系統提示如何建構，以及每一輪會注入什麼。
  </Card>
  <Card title="代理迴圈" href="/zh-TW/concepts/agent-loop" icon="arrows-rotate">
    從傳入訊息到最終回覆的完整代理執行週期。
  </Card>
</CardGroup>

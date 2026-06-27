---
read_when:
    - 你想了解 OpenClaw 中「context」的意思
    - 你正在偵錯模型為什麼「知道」某件事（或忘記了它）
    - 您想降低上下文負擔（/context、/status、/compact）
summary: 脈絡：模型會看到什麼、如何建構，以及如何檢查
title: 情境
x-i18n:
    generated_at: "2026-06-27T19:10:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

「上下文」是 **OpenClaw 在一次執行中傳送給模型的所有內容**。它受模型的 **上下文視窗**（權杖限制）約束。

初學者心智模型：

- **系統提示**（由 OpenClaw 建立）：規則、工具、Skills 清單、時間/執行環境，以及注入的工作區檔案。
- **對話歷史**：你在此工作階段的訊息 + 助理的訊息。
- **工具呼叫/結果 + 附件**：命令輸出、檔案讀取、圖片/音訊等等。

上下文 _不等同於_「記憶」：記憶可以儲存在磁碟上並於稍後重新載入；上下文是模型目前視窗內的內容。

## 快速開始（檢查上下文）

- `/status` → 快速查看「我的視窗有多滿？」+ 工作階段設定。
- `/context list` → 已注入的內容 + 粗略大小（每個檔案 + 總計）。
- `/context detail` → 更深入的細分：每個檔案、每個工具結構描述大小、每個 Skills 項目大小、系統提示大小，以及可壓縮的逐字稿訊息數。
- `/context map` → 目前工作階段追蹤到的上下文貢獻來源的 WinDirStat 風格矩形樹狀圖影像。
- `/usage tokens` → 在一般回覆後附加每則回覆的使用量頁尾。
- `/compact` → 將較舊的歷史摘要成壓縮項目，以釋放視窗空間。

另請參閱：[斜線命令](/zh-TW/tools/slash-commands)、[權杖使用與成本](/zh-TW/reference/token-use)、[壓縮](/zh-TW/concepts/compaction)。

## 範例輸出

數值會依模型、提供者、工具政策，以及工作區內容而異。

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

會傳送從最新快取執行報告產生的影像。在一般訊息於工作階段中產生執行報告之前，`/context map` 會回傳不可用訊息，而不是渲染估算結果。矩形面積與追蹤到的提示字元數成比例：

- 注入的工作區檔案
- 基礎系統提示文字
- Skills 提示項目
- 工具 JSON 結構描述

當沒有快取執行報告時，`/context list`、`/context detail` 和 `/context json` 仍可檢查隨需估算。

## 哪些內容會計入上下文視窗

模型接收到的所有內容都會計入，包括：

- 系統提示（所有區段）。
- 對話歷史。
- 工具呼叫 + 工具結果。
- 附件/逐字稿（圖片/音訊/檔案）。
- 壓縮摘要與修剪成品。
- 提供者「包裝」或隱藏標頭（不可見，但仍會計入）。

## OpenClaw 如何建立系統提示

系統提示由 **OpenClaw 擁有**，並會在每次執行時重建。它包含：

- 工具清單 + 簡短描述。
- Skills 清單（僅中繼資料；見下文）。
- 工作區位置。
- 時間（UTC + 已設定時轉換後的使用者時間）。
- 執行環境中繼資料（主機/作業系統/模型/思考）。
- 在 **專案上下文** 底下注入的工作區啟動檔案。

完整細分：[系統提示](/zh-TW/concepts/system-prompt)。

## 注入的工作區檔案（專案上下文）

預設情況下，OpenClaw 會注入一組固定的工作區檔案（若存在）：

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`（僅首次執行）

大型檔案會依每個檔案使用 `agents.defaults.bootstrapMaxChars`（預設 `20000` 字元）截斷。OpenClaw 也會使用 `agents.defaults.bootstrapTotalMaxChars`（預設 `60000` 字元）對跨檔案的啟動注入總量施加上限。`/context` 會顯示 **原始與注入後** 的大小，以及是否發生截斷。

發生截斷時，執行環境可以在專案上下文底下注入提示內警告區塊。可使用 `agents.defaults.bootstrapPromptTruncationWarning` 設定此行為（`off`、`once`、`always`；預設 `always`）。

## Skills：注入與隨需載入

系統提示包含精簡的 **Skills 清單**（名稱 + 描述 + 位置）。此清單有實際開銷。

Skills 指示預設 _不會_ 包含在內。模型預期只在 **需要時** `read` 該 Skills 的 `SKILL.md`。

## 工具：有兩種成本

工具會以兩種方式影響上下文：

1. 系統提示中的 **工具清單文字**（你看到的「工具」）。
2. **工具結構描述**（JSON）。這些會傳送給模型，讓它能呼叫工具。即使你不會以純文字看到它們，它們仍會計入上下文。

`/context detail` 會細分最大的工具結構描述，讓你看出主要占用來源。

## 命令、指示詞與「行內捷徑」

斜線命令由閘道處理。它們有幾種不同的行為：

- **獨立命令**：只有 `/...` 的訊息會作為命令執行。
- **指示詞**：`/think`、`/verbose`、`/trace`、`/reasoning`、`/elevated`、`/model`、`/queue` 會在模型看到訊息前被移除。
  - 僅含指示詞的訊息會保留工作階段設定。
  - 一般訊息中的行內指示詞會作為該訊息的提示。
- **行內捷徑**（僅限允許清單中的傳送者）：一般訊息內的特定 `/...` 權杖可以立即執行（範例：「hey /status」），並會在模型看到剩餘文字前被移除。

詳細資訊：[斜線命令](/zh-TW/tools/slash-commands)。

## 工作階段、壓縮與修剪（哪些內容會保留）

跨訊息保留的內容取決於機制：

- **一般歷史** 會保留在工作階段逐字稿中，直到依政策被壓縮/修剪。
- **壓縮** 會將摘要保留到逐字稿中，並保持近期訊息完整。
- **修剪** 會從 _記憶體內_ 提示中移除舊工具結果，以釋放上下文視窗空間，但不會改寫工作階段逐字稿 - 完整歷史仍可在磁碟上檢查。

文件：[工作階段](/zh-TW/concepts/session)、[壓縮](/zh-TW/concepts/compaction)、[工作階段修剪](/zh-TW/concepts/session-pruning)。

預設情況下，OpenClaw 使用內建的 `legacy` 上下文引擎進行組裝與
壓縮。如果你安裝提供 `kind: "context-engine"` 的外掛，並使用
`plugins.slots.contextEngine` 選取它，OpenClaw 會改由該
引擎處理上下文組裝、`/compact`，以及相關子代理上下文生命週期鉤子。
`ownsCompaction: false` 不會自動回退到舊版
引擎；作用中的引擎仍必須正確實作 `compact()`。請參閱
[上下文引擎](/zh-TW/concepts/context-engine)，了解完整的
可插拔介面、生命週期鉤子與設定。

## `/context` 實際回報的內容

可用時，`/context` 會優先使用最新的 **執行時建立** 系統提示報告：

- `System prompt (run)` = 從上一次嵌入式（可使用工具）執行擷取，並保留在工作階段儲存區中。
- `System prompt (estimate)` = 在沒有執行報告時（或透過不產生報告的命令列介面後端執行時）即時計算。

無論哪種方式，它都會回報大小與主要貢獻來源；它 **不會** 傾印完整系統提示或工具結構描述。在詳細模式中，它也會使用與壓縮相同的真實對話訊息判定條件，比較工作階段逐字稿，因此更容易區分高提示/快取用量與可壓縮的對話歷史。

## 相關

<CardGroup cols={2}>
  <Card title="Context engine" href="/zh-TW/concepts/context-engine" icon="puzzle-piece">
    透過外掛自訂上下文注入。
  </Card>
  <Card title="Compaction" href="/zh-TW/concepts/compaction" icon="compress">
    摘要長對話，使其維持在模型視窗內。
  </Card>
  <Card title="System prompt" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    系統提示如何建立，以及每一輪會注入哪些內容。
  </Card>
  <Card title="Agent loop" href="/zh-TW/concepts/agent-loop" icon="arrows-rotate">
    從傳入訊息到最終回覆的完整代理執行週期。
  </Card>
</CardGroup>

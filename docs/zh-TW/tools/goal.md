---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在長時間工作階段中持續顯示同一個目標
    - 你需要暫停、恢復、封鎖、完成或清除工作階段目標
    - 你想了解 get_goal、create_goal 和 update_goal 工具
    - 你想查看目標如何在終端介面中顯示
summary: 工作階段目標：持久的每工作階段目標、/goal 控制、模型目標工具、token 預算，以及終端介面狀態
title: 目標
x-i18n:
    generated_at: "2026-06-27T20:07:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# 目標

**目標**是附加到目前 OpenClaw 工作階段的一個持久目標。
它讓代理程式和操作者在長時間工作中擁有共同目標，
而不會把該目標變成背景任務、提醒、排程工作或
常設指令。

目標是工作階段狀態。它們會隨工作階段金鑰移動、在程序
重新啟動後保留、顯示在 `/goal` 中，可透過目標
工具提供給模型，並在作用中工作階段有目標時出現在終端介面頁尾。

## 快速開始

設定目標：

```text
/goal start get CI green for PR 87469 and push the fix
```

檢查目標：

```text
/goal
```

當工作刻意等待時暫停目標：

```text
/goal pause waiting for CI
```

恢復目標：

```text
/goal resume
```

標記為完成：

```text
/goal complete pushed and verified
```

清除目標：

```text
/goal clear
```

## 目標的用途

當工作階段有一個具體成果，且應在多輪互動中保持可見時，請使用目標：

- PR 收尾：修正、驗證、自動審查、推送，並開啟或更新 PR。
- 偵錯執行：重現錯誤、識別所屬介面、修補，並證明
  修正有效。
- 文件整理：閱讀相關文件、撰寫新頁面、加入交叉連結，並
  驗證文件建置。
- 維護任務：檢查目前狀態、進行有界變更、執行正確
  檢查，並回報變更內容。

目標不是任務佇列。當工作應脫離目前工作階段執行、
按排程重複、展開成受管理的子工作，或作為政策持久存在時，請使用
[任務流程](/zh-TW/automation/taskflow)、
[任務](/zh-TW/automation/tasks)、[排程工作](/zh-TW/automation/cron-jobs)，或
[常設指令](/zh-TW/automation/standing-orders)。

## 命令參考

不帶引數的 `/goal` 會列印目前目標摘要：

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

命令：

- `/goal` 或 `/goal status` 會顯示目前目標。
- `/goal start <objective>` 會為目前工作階段建立新目標。
- `/goal set <objective>` 和 `/goal create <objective>` 是
  `start` 的別名。
- `/goal pause [note]` 會暫停作用中的目標。
- `/goal resume [note]` 會恢復已暫停、受阻、用量受限或
  預算受限的目標。
- `/goal complete [note]` 會將目標標記為已達成。
- `/goal done [note]` 是 `complete` 的別名。
- `/goal block [note]` 會將目標標記為受阻。
- `/goal blocked [note]` 是 `block` 的別名。
- `/goal clear` 會從工作階段移除目標。

一個工作階段一次只能存在一個目標。在目前目標被清除之前，
啟動第二個目標會失敗。

## 狀態

目標使用一組小型狀態：

- `active`：工作階段正在追求該目標。
- `paused`：操作者已暫停目標；`/goal resume` 會讓它再次變為作用中。
- `blocked`：代理程式或操作者回報真實阻礙；當有新資訊或狀態可用時，
  `/goal resume` 會讓它再次變為作用中。
- `budget_limited`：已達設定的權杖預算；`/goal resume`
  會從相同目標重新開始追求。
- `usage_limited`：保留給用量限制停止狀態；允許時，`/goal resume`
  會重新開始追求。
- `complete`：目標已達成。已完成的目標是終端狀態；開始另一個目標前，
  請使用 `/goal clear`。

`/new` 和 `/reset` 會清除目前工作階段目標，因為它們會刻意
開始新的工作階段內容。

## 權杖預算

目標可以有選用的正值權杖預算。預算會與目標一同儲存，
並從建立時工作階段的新鮮權杖計數開始衡量。如果目標啟動時，
目前工作階段只有過期或未知的權杖用量，
OpenClaw 會等待下一個新鮮的工作階段權杖快照，並將其作為
基準，因此目標存在前花費的權杖不會計入該目標。

當權杖用量達到預算時，目標會變為 `budget_limited`。這
不會刪除目標或抹除目標內容。它會告知操作者和
代理程式：在恢復或清除之前，該目標不再被主動追求。

權杖預算是工作階段目標的護欄，不是計費上限。供應商配額、
成本回報和內容視窗行為仍使用一般 OpenClaw
用量和模型控制。

## 模型工具

OpenClaw 向代理程式執行框架公開三個核心目標工具：

- `get_goal`：讀取目前工作階段目標，包括狀態、目標內容、權杖
  用量和權杖預算。
- `create_goal`：只有在使用者、系統或開發者
  指示明確要求時才建立目標。如果工作階段已經有
  目標，則會失敗。
- `update_goal`：將目標標記為 `complete` 或 `blocked`。

模型不能靜默暫停、恢復、清除或取代目標。這些是
透過 `/goal` 和重設命令執行的操作者／工作階段控制。這能避免
代理程式悄悄移動目標，同時保留一條乾淨路徑，讓
代理程式回報達成或真實阻礙。

`update_goal` 工具只有在目標內容確實已達成時，才應將目標標記為
`complete`。只有當相同的阻礙條件重複出現，且代理程式若沒有
新的使用者輸入或外部狀態變更便無法取得有意義進展時，才應將目標標記為
`blocked`。

## 終端介面

終端介面會在頁尾中，將作用中工作階段的目標顯示在
代理程式、工作階段、模型、執行控制項和權杖計數旁邊。

頁尾範例：

- `Pursuing goal (12k/50k)` 表示有權杖預算的作用中目標。
- `Goal paused (/goal resume)` 表示已暫停的目標。
- `Goal blocked (/goal resume)` 表示受阻的目標。
- `Goal hit usage limits (/goal resume)` 表示用量受限的目標。
- `Goal unmet (50k/50k)` 表示預算受限的目標。
- `Goal achieved (42k)` 表示已完成的目標。

頁尾刻意保持精簡。使用 `/goal` 查看完整目標內容、備註、
權杖預算和可用命令。

## 通道行為

`/goal` 命令可在支援命令的 OpenClaw 工作階段中運作，包括
終端介面，以及允許文字命令的聊天介面。目標狀態附加到
工作階段金鑰，而不是傳輸方式。如果兩個介面使用相同工作階段，它們會看到
相同目標。

目標狀態不是傳遞指令。它不會強制透過某個
通道回覆、變更佇列行為、核准工具或排程工作。

## 疑難排解

`Goal error: goal already exists` 表示工作階段已經有目標。使用
`/goal` 檢查它；如果已完成，使用 `/goal complete`；或在
開始不同目標前使用 `/goal clear`。

`Goal error: goal not found` 表示工作階段尚未有目標。使用
`/goal start <objective>` 啟動一個目標。

`Goal error: goal is already complete` 表示目標是終端狀態。請先清除它，
再開始或恢復另一個目標。

如果權杖用量看起來像 `0` 或過期，作用中工作階段可能尚未有新鮮的
權杖快照。當 OpenClaw 記錄工作階段用量和
從對話紀錄推導的總量時，用量會重新整理。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [終端介面](/zh-TW/web/tui)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [壓縮](/zh-TW/concepts/compaction)
- [任務流程](/zh-TW/automation/taskflow)
- [常設指令](/zh-TW/automation/standing-orders)

---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在長時間工作階段中始終顯示同一個目標
    - 你需要暫停、繼續、封鎖、完成或清除工作階段目標
    - 你想瞭解 `get_goal`、`create_goal` 和 `update_goal` 工具
    - 你想查看目標在終端介面中的顯示方式
summary: 工作階段目標：持久的個別工作階段目標、/goal 控制項、模型目標工具、權杖預算，以及終端介面狀態
title: 目標
x-i18n:
    generated_at: "2026-07-11T21:51:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# 目標

**目標**是附加於目前 OpenClaw 工作階段的一項持久目標。
它讓代理程式與操作者在長時間執行的工作中共享同一個目標，
而不會將該目標轉變成背景任務、提醒、排程工作或
常設指令。

目標屬於工作階段狀態：它會隨工作階段金鑰移動、在程序
重新啟動後仍保留，並顯示於 `/goal`、提供給模型的目標工具，以及終端介面
頁尾中。

## 快速開始

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` 是選用的：`/goal get CI green for PR 87469` 也會建立目標，
因為 `/goal` 後方任何不是已知動作關鍵字的文字，都會視為
新的目標。

## 目標的用途

當工作階段有一項應在多輪互動中持續可見的具體成果時，
請使用目標：

- 完成 PR：修正、驗證、自動審查、推送，以及建立或更新 PR。
- 偵錯作業：重現錯誤、識別所屬介面、修補，並
  證明修正有效。
- 文件作業：閱讀相關文件、撰寫新頁面、建立交叉連結，並
  驗證文件建置。
- 維護任務：檢查目前狀態、進行有界限的變更、執行
  適當的檢查，並報告變更內容。

目標不是任務佇列。當工作應以分離方式執行、
依排程重複、展開為受管理的子工作，或作為政策持續存在時，請使用 [Task Flow](/zh-TW/automation/taskflow)、
[任務](/zh-TW/automation/tasks)、[排程工作](/zh-TW/automation/cron-jobs) 或
[常設指令](/zh-TW/automation/standing-orders)。

## 命令參考

不帶引數的 `/goal` 會顯示目前的目標摘要：

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| 命令                                                | 效果                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` 或 `/goal status`                           | 顯示目前的目標。                                                         |
| `/goal start <objective>`                           | 為目前工作階段建立新目標。                                               |
| `/goal set <objective>`、`/goal create <objective>` | `start` 的別名。                                                         |
| `/goal <objective>`                                 | 也會建立新目標（任何不是已辨識動作關鍵字的文字）。                       |
| `/goal edit <objective>`                            | 重新表述目前的目標；狀態與權杖計量維持不變。                             |
| `/goal pause [note]`                                | 暫停進行中的目標。                                                       |
| `/goal resume [note]`                               | 恢復已暫停、受阻、受用量限制或受預算限制的目標。                         |
| `/goal complete [note]`                             | 將目標標記為已達成。                                                     |
| `/goal done [note]`                                 | `complete` 的別名。                                                      |
| `/goal block [note]`                                | 將目標標記為受阻。                                                       |
| `/goal blocked [note]`                              | `block` 的別名。                                                         |
| `/goal clear`                                       | 從工作階段移除目標。                                                     |

一個工作階段一次只能有一個目標。在清除目前目標之前，啟動第二個目標會
失敗並顯示 `Goal error: goal already exists`。

`/goal start` 不接受權杖預算旗標；預算只能透過
提供給模型的 `create_goal` 工具設定。

## 狀態

- `active`：工作階段正在追求該目標。
- `paused`：操作者已暫停目標；`/goal resume` 會讓它再次進入進行中
  狀態。
- `blocked`：代理程式或操作者回報了實際阻礙；當有新的資訊或狀態可用時，
  `/goal resume` 會讓它再次進入進行中狀態。
- `budget_limited`：已達設定的權杖預算；`/goal resume`
  會從相同目標開始新的預算期間並重新追求目標。
- `usage_limited`：保留供未來的用量限制停止狀態使用；`/goal
resume` 會以相同方式重新開始追求目標。
- `complete`：目標已達成。已完成的目標是終止狀態；請先使用 `/goal
clear`，再開始另一個目標。

`/new` 和 `/reset` 會清除目前工作階段的目標，因為它們會刻意
啟動全新的工作階段上下文。

## 權杖預算

目標可以有選用的正整數權杖預算，透過
`create_goal` 工具的 `token_budget` 參數設定。預算是從
建立目標時工作階段最新的權杖計數開始衡量。如果目標開始時工作階段只有
過時或未知的權杖快照，OpenClaw 會等待
下一份最新快照，並以其作為基準，因此目標存在之前所使用的權杖
不會計入其中。

當用量達到預算時，目標會轉為 `budget_limited`。這不會
刪除目標或清除目標內容；它會告知操作者與
代理程式，在恢復或清除目標之前，該目標不再被積極追求。
恢復時會以目前最新的權杖計數開始新的預算期間。

權杖預算是工作階段目標的防護欄，不是計費上限。供應商
配額、成本報告與上下文視窗行為仍使用一般的
OpenClaw 用量與模型控制設定。

## 模型工具

OpenClaw 向代理程式框架公開三個目標工具：

| 工具          | 用途                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | 讀取目前工作階段的目標：狀態、目標內容、權杖用量與權杖預算。                                                           |
| `create_goal` | 僅在使用者或系統指示明確要求時建立目標。如果工作階段已有目標則會失敗。                                                 |
| `update_goal` | 將目標標記為 `complete` 或 `blocked`。                                                                                  |

模型無法在未告知的情況下暫停、恢復、清除或取代目標。這些操作仍是
透過 `/goal` 與重設命令執行的操作者／工作階段控制，因此代理程式
可以回報目標已達成或存在真正阻礙，而不會暗中改變
目標。

`update_goal` 只應在目標實際達成時，才將目標標記為
`complete`。只有在同一阻礙條件於至少連續三輪目標互動中
重複發生後，才應將目標標記為 `blocked`，不能因為
一般困難或尚欠完善而這麼做。

## 每輪互動中的目標上下文

每個帶有進行中目標的使用者／聊天輪次，都會包含這一行使用者角色上下文：

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw 會截斷過長的目標內容，讓此行保持精簡。已暫停、
受阻、受預算限制、受用量限制及已完成的目標不會被注入，
因此操作者的停止指示會持續生效，直到目標被恢復為止。

## 控制介面

網頁控制介面會在聊天輸入框上方，以精簡膠囊標籤顯示目標：
包括狀態圖示、狀態標籤（例如 `Pursuing goal`）、截斷的
目標內容，以及即時經過時間計時器。

膠囊標籤包含行內控制項：

- **鉛筆**會在輸入框預先填入 `/goal edit <objective>`，以便
  重新表述並送出目標內容。
- **暫停／恢復**會根據目前狀態，在 `/goal pause` 與 `/goal resume` 之間
  切換。
- **垃圾桶**會傳送 `/goal clear`。
- **箭頭**會展開膠囊標籤，顯示完整目標內容、最新狀態
  註記、權杖用量與經過時間。

當輸入框無法傳送時（例如
閘道連線中斷），動作按鈕會隱藏；展開箭頭仍可使用。

## 終端介面

終端介面頁尾會在權杖／模式指示器之前，將進行中工作階段的目標顯示於代理程式、
工作階段與模型欄位旁。

頁尾範例：

- `Pursuing goal (12k/50k)`：具有權杖預算的進行中目標。
- `Goal paused (/goal resume)`：已暫停的目標。
- `Goal blocked (/goal resume)`：受阻的目標。
- `Goal hit usage limits (/goal resume)`：受用量限制的目標。
- `Goal unmet (50k/50k)`：受預算限制的目標。
- `Goal achieved (42k)`：已完成的目標。

頁尾刻意保持精簡。使用 `/goal` 查看完整目標內容、
註記、權杖預算與可用命令。

## 頻道行為

`/goal` 可在支援命令的 OpenClaw 工作階段中使用，包括終端介面與
允許文字命令的聊天介面。目標狀態附加於
工作階段金鑰，而非傳輸方式，因此共享同一工作階段金鑰的兩個介面會看到
相同的目標。

目標狀態不是傳送指令：它不會強制透過某個
頻道回覆、變更佇列行為、核准工具或排程工作。

## 疑難排解

| 訊息                                   | 意義                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | 工作階段已有目標。使用 `/goal` 檢查；若已完成，使用 `/goal complete`；或在開始不同目標前使用 `/goal clear`。                                  |
| `Goal error: goal not found`           | 工作階段尚無目標。使用 `/goal start <objective>` 啟動目標。                                                                                  |
| `Goal error: goal is already complete` | 目標已處於終止狀態。開始或恢復另一個目標之前，請先將其清除。                                                                                 |

如果權杖用量顯示 `0` 或看起來過時，進行中的工作階段可能尚未有
最新的權杖快照。當 OpenClaw 記錄工作階段用量
以及從逐字稿推導的總計時，用量便會更新。

## 相關內容

- [斜線命令](/zh-TW/tools/slash-commands)
- [終端介面](/zh-TW/web/tui)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [壓縮](/zh-TW/concepts/compaction)
- [Task Flow](/zh-TW/automation/taskflow)
- [常設指令](/zh-TW/automation/standing-orders)

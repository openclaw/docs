---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在長時間工作階段中持續顯示同一個目標
    - 你需要暫停、繼續、封鎖、完成或清除工作階段目標
    - 你想了解 get_goal、create_goal 和 update_goal 工具
    - 你想查看目標在終端介面中如何顯示
summary: 工作階段目標：持久的每工作階段目標、/goal 控制、模型目標工具、權杖預算，以及終端介面狀態
title: 目標
x-i18n:
    generated_at: "2026-07-05T11:50:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff943a751c75213124c85fefbb3f3bca4469841793873983adbc1cec6fcd629
    source_path: tools/goal.md
    workflow: 16
---

# 目標

**目標** 是附加到目前 OpenClaw 工作階段的一個持久目標。
它讓代理和操作員在長時間工作中有共同的目標，
而不會把該目標變成背景任務、提醒、排程工作或
常設指令。

目標是工作階段狀態：它會隨工作階段金鑰移動、在程序
重新啟動後保留，並出現在 `/goal`、面向模型的目標工具，以及終端介面
頁尾中。

## 快速開始

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` 是選用的：`/goal get CI green for PR 87469` 也會建立目標，
因為 `/goal` 後面任何不是已知動作詞的文字，都會被視為
新的目標。

## 目標用途

當工作階段有應在多輪互動中持續可見的具體成果時，請使用目標：

- PR 收尾：修正、驗證、自動審查、推送，並開啟或更新 PR。
- 除錯流程：重現錯誤、識別負責的表面、修補，並
  證明修正有效。
- 文件整理：閱讀相關文件、撰寫新頁面、建立交叉連結，並
  驗證文件建置。
- 維護任務：檢查目前狀態、進行有界變更、執行
  正確檢查，並回報變更內容。

目標不是任務佇列。當工作應該脫離目前工作階段執行、
依排程重複、分散成受管理的子工作，或作為政策持久存在時，請使用
[任務流程](/zh-TW/automation/taskflow)、[任務](/zh-TW/automation/tasks)、[排程工作](/zh-TW/automation/cron-jobs)，或
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

| 命令                                                | 效果                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `/goal` 或 `/goal status`                           | 顯示目前目標。                                                         |
| `/goal start <objective>`                           | 為目前工作階段建立新目標。                                             |
| `/goal set <objective>`、`/goal create <objective>` | `start` 的別名。                                                       |
| `/goal <objective>`                                 | 也會建立新目標（任何不是已辨識動作詞的文字）。                         |
| `/goal pause [note]`                                | 暫停作用中的目標。                                                     |
| `/goal resume [note]`                               | 恢復已暫停、受阻、用量受限或預算受限的目標。                           |
| `/goal complete [note]`                             | 將目標標記為已達成。                                                   |
| `/goal done [note]`                                 | `complete` 的別名。                                                    |
| `/goal block [note]`                                | 將目標標記為受阻。                                                     |
| `/goal blocked [note]`                              | `block` 的別名。                                                       |
| `/goal clear`                                       | 從工作階段移除目標。                                                   |

一個工作階段一次只能存在一個目標。啟動第二個目標會失敗並顯示
`Goal error: goal already exists`，直到目前目標被清除為止。

`/goal start` 不接受權杖預算旗標；預算只能透過
面向模型的 `create_goal` 工具設定。

## 狀態

- `active`：工作階段正在追求該目標。
- `paused`：操作員已暫停目標；`/goal resume` 會讓它再次作用中。
- `blocked`：代理或操作員回報真實阻礙；當有新的資訊或狀態可用時，
  `/goal resume` 會讓它再次作用中。
- `budget_limited`：已達設定的權杖預算；`/goal resume`
  會以相同目標重新開始追求，並開啟新的預算視窗。
- `usage_limited`：保留給未來用量限制停止狀態；`/goal
resume` 會以相同方式重新開始追求。
- `complete`：目標已達成。完成的目標是終止狀態；在啟動另一個目標前請使用 `/goal
clear`。

`/new` 和 `/reset` 會清除目前工作階段目標，因為它們會刻意
開始全新的工作階段脈絡。

## 權杖預算

目標可以有選用的正數權杖預算，透過
`create_goal` 工具的 `token_budget` 參數設定。預算會從
目標建立時工作階段的新鮮權杖計數開始衡量。如果目標啟動時，
工作階段只有過期或未知的權杖快照，OpenClaw 會等待
下一個新鮮快照，並以其作為基準，因此目標存在前花費的權杖
不會計入其中。

當用量達到預算時，目標會移至 `budget_limited`。這不會
刪除目標或清除目標內容；它會告知操作員和
代理，該目標在恢復或清除前不再被主動追求。
恢復時會以目前的新鮮權杖計數開始新的預算視窗。

權杖預算是工作階段目標的護欄，不是計費上限。提供者
配額、成本回報，以及脈絡視窗行為仍會使用一般的
OpenClaw 用量和模型控制。

## 模型工具

OpenClaw 向代理測試框架公開三個目標工具：

| 工具          | 目的                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | 讀取目前工作階段目標：狀態、目標、權杖用量和權杖預算。                                                                   |
| `create_goal` | 只有在使用者或系統指令明確要求時才建立目標。如果工作階段已有目標，則會失敗。                                             |
| `update_goal` | 將目標標記為 `complete` 或 `blocked`。                                                                                   |

模型不能悄悄暫停、恢復、清除或取代目標。這些仍然是
透過 `/goal` 和重設命令操作的操作員／工作階段控制，因此代理
可以回報達成或真正的阻礙，而不會悄悄移動
目標。

`update_goal` 只有在目標確實達成時，才應將目標標記為
`complete`。只有在相同阻礙條件於至少連續三個目標回合中重複出現後，
才應將目標標記為 `blocked`，而不是因為一般困難或缺少潤飾。

## 終端介面

終端介面頁尾會在權杖／模式指示器前方，將作用中工作階段的目標
顯示在代理、工作階段和模型欄位旁。

頁尾範例：

- 有權杖預算的作用中目標顯示為 `Pursuing goal (12k/50k)`。
- 已暫停目標顯示為 `Goal paused (/goal resume)`。
- 受阻目標顯示為 `Goal blocked (/goal resume)`。
- 用量受限目標顯示為 `Goal hit usage limits (/goal resume)`。
- 預算受限目標顯示為 `Goal unmet (50k/50k)`。
- 已完成目標顯示為 `Goal achieved (42k)`。

頁尾刻意保持精簡。請使用 `/goal` 查看完整目標、
備註、權杖預算和可用命令。

## 通道行為

`/goal` 可在支援命令的 OpenClaw 工作階段中運作，包括終端介面和
允許文字命令的聊天表面。目標狀態會附加到
工作階段金鑰，而不是傳輸層，因此共用同一個工作階段金鑰的兩個表面會看到
相同目標。

目標狀態不是傳遞指令：它不會強制透過某個
通道回覆、變更佇列行為、核准工具或排程工作。

## 疑難排解

| 訊息                                   | 意義                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | 工作階段已有目標。請使用 `/goal` 檢查它；如果已完成，使用 `/goal complete`；或在啟動不同目標前使用 `/goal clear`。                         |
| `Goal error: goal not found`           | 工作階段尚無目標。請使用 `/goal start <objective>` 啟動一個。                                                                               |
| `Goal error: goal is already complete` | 目標已是終止狀態。請先清除它，再啟動或恢復另一個目標。                                                                                       |

如果權杖用量顯示 `0` 或看起來過期，作用中工作階段可能尚未有
新鮮的權杖快照。當 OpenClaw 記錄工作階段用量
和從轉錄推導的總量時，用量會重新整理。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [終端介面](/zh-TW/web/tui)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [壓縮](/zh-TW/concepts/compaction)
- [任務流程](/zh-TW/automation/taskflow)
- [常設指令](/zh-TW/automation/standing-orders)

---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在長時間工作階段中持續顯示同一個目標
    - 你需要暫停、恢復、封鎖、完成或清除工作階段目標
    - 你想要了解 get_goal、create_goal 和 update_goal 工具
    - 您想查看目標在終端介面中的顯示方式
summary: 工作階段目標：持久的每工作階段目標、/goal 控制、模型目標工具、權杖預算，以及終端介面狀態
title: 目標
x-i18n:
    generated_at: "2026-07-06T10:53:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# 目標

**目標** 是附加到目前 OpenClaw 工作階段的一個持久目標。
它讓代理程式和操作者對長時間執行的工作有共同的目標，
而不會把該目標變成背景工作、提醒、排程作業或
常設指令。

目標是工作階段狀態：它會隨工作階段金鑰移動、在程序
重新啟動後保留，並顯示在 `/goal`、面向模型的目標工具，以及終端介面
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

`start` 是選用的：`/goal get CI green for PR 87469` 也會建立一個目標，
因為 `/goal` 後面任何不是已知動作字的文字，都會被視為
新的目標。

## 目標的用途

當一個工作階段有具體結果，且該結果應在多個回合中保持可見時，
請使用目標：

- PR 收尾：修正、驗證、自動審查、推送，並開啟或更新 PR。
- 偵錯執行：重現錯誤、找出擁有該表面的範圍、修補，並
  證明修正。
- 文件整理：閱讀相關文件、撰寫新頁面、交叉連結，並
  驗證文件建置。
- 維護工作：檢查目前狀態、進行有界變更、執行
  正確檢查，並回報變更內容。

目標不是工作佇列。當工作應脫離目前工作階段執行、
依排程重複、展開成受管理的子工作，或作為政策持續存在時，請使用 [TaskFlow](/zh-TW/automation/taskflow)、
[工作](/zh-TW/automation/tasks)、[排程作業](/zh-TW/automation/cron-jobs) 或
[常設指令](/zh-TW/automation/standing-orders)。

## 命令參考

不帶引數的 `/goal` 會列印目前目標摘要：

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
| `/goal` 或 `/goal status`                           | 顯示目前目標。                                                           |
| `/goal start <objective>`                           | 為目前工作階段建立新目標。                                               |
| `/goal set <objective>`, `/goal create <objective>` | `start` 的別名。                                                         |
| `/goal <objective>`                                 | 也會建立新目標（任何未被辨識為動作字的文字）。                           |
| `/goal edit <objective>`                            | 重新措辭目前目標；狀態和 token 計算保持不變。                            |
| `/goal pause [note]`                                | 暫停一個作用中的目標。                                                   |
| `/goal resume [note]`                               | 恢復已暫停、受阻、用量受限或預算受限的目標。                             |
| `/goal complete [note]`                             | 將目標標記為已達成。                                                     |
| `/goal done [note]`                                 | `complete` 的別名。                                                      |
| `/goal block [note]`                                | 將目標標記為受阻。                                                       |
| `/goal blocked [note]`                              | `block` 的別名。                                                         |
| `/goal clear`                                       | 從工作階段移除目標。                                                     |

每個工作階段一次只能存在一個目標。啟動第二個目標會失敗，
並顯示 `Goal error: goal already exists`，直到目前目標被清除為止。

`/goal start` 不接受 token 預算旗標；預算只能透過
面向模型的 `create_goal` 工具設定。

## 狀態

- `active`：工作階段正在追求該目標。
- `paused`：操作者已暫停目標；`/goal resume` 會讓它再次成為作用中。
- `blocked`：代理程式或操作者回報了真正的阻礙；當有新資訊或狀態可用時，
  `/goal resume` 會讓它再次成為作用中。
- `budget_limited`：已達到設定的 token 預算；`/goal resume`
  會從同一個目標以新的預算視窗重新開始追求。
- `usage_limited`：保留給未來的用量限制停止狀態；`/goal
resume` 會以相同方式重新開始追求。
- `complete`：目標已達成。完成的目標是終端狀態；開始另一個目標前，請使用 `/goal
clear`。

`/new` 和 `/reset` 會清除目前工作階段目標，因為它們刻意
以全新的工作階段脈絡開始。

## Token 預算

目標可以有選用的正數 token 預算，透過
`create_goal` 工具的 `token_budget` 參數設定。預算是從
目標建立時工作階段的新鮮 token 計數開始衡量。如果目標開始時，
工作階段只有過期或未知的 token 快照，OpenClaw 會等待
下一個新鮮快照，並以它作為基準，因此目標存在之前花費的 token
不會計入該目標。

當用量達到預算時，目標會移至 `budget_limited`。這不會
刪除目標或清除目標文字；它會告知操作者和
代理程式，該目標在被恢復或清除之前，已不再被主動追求。
恢復會以目前的新鮮 token 計數開始新的預算視窗。

Token 預算是工作階段目標的護欄，不是帳單上限。提供者
配額、成本回報和脈絡視窗行為仍使用一般的
OpenClaw 用量與模型控制。

## 模型工具

OpenClaw 對代理程式框架公開三個目標工具：

| 工具          | 用途                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | 讀取目前工作階段目標：狀態、目標、token 用量和 token 預算。                                                            |
| `create_goal` | 只有在使用者或系統指示明確要求時才建立目標。如果工作階段已經有目標，則會失敗。                                         |
| `update_goal` | 將目標標記為 `complete` 或 `blocked`。                                                                                   |

模型不能悄悄暫停、恢復、清除或取代目標。這些仍然是
透過 `/goal` 和重設命令進行的操作者／工作階段控制，因此代理程式
可以回報達成或真正的阻礙，而不會悄悄移動
目標。

只有在目標確實達成時，`update_goal` 才應將目標標記為
`complete`。只有在相同阻塞條件至少連續三個目標回合重複出現後，
才應將目標標記為 `blocked`，而不是因為一般困難或缺少潤飾。

## 每個回合中的目標脈絡

每個有作用中目標的使用者／聊天回合，都會包含這行使用者角色脈絡：

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw 會截斷過長目標，讓這一行保持精簡。已暫停、
受阻、預算受限、用量受限和完成的目標不會被注入，
因此操作者停止會持續生效，直到目標被恢復。

## 控制 UI

網頁控制 UI 會在聊天撰寫器上方，以精簡膠囊顯示目標：
狀態圖示、狀態標籤（例如 `Pursuing goal`）、截斷後的
目標，以及即時經過時間計時器。

膠囊帶有行內控制項：

- **鉛筆** 會以 `/goal edit <objective>` 預先填入撰寫器，讓
  目標可以重新措辭並送出。
- **暫停／恢復** 會根據目前狀態，在 `/goal pause` 和 `/goal resume` 之間切換。
- **垃圾桶** 會送出 `/goal clear`。
- **V 形箭頭** 會展開膠囊，以顯示完整目標、最新狀態
  備註、token 用量和經過時間。

當撰寫器無法送出時（例如閘道連線中斷），動作按鈕會被隱藏；
展開 V 形箭頭仍可運作。

## 終端介面

終端介面頁尾會在代理程式、工作階段和模型欄位旁邊，
於 token／模式指示器之前，保持作用中工作階段的目標可見。

頁尾範例：

- `Pursuing goal (12k/50k)` 表示有 token 預算的作用中目標。
- `Goal paused (/goal resume)` 表示已暫停的目標。
- `Goal blocked (/goal resume)` 表示受阻的目標。
- `Goal hit usage limits (/goal resume)` 表示用量受限的目標。
- `Goal unmet (50k/50k)` 表示預算受限的目標。
- `Goal achieved (42k)` 表示已完成的目標。

頁尾刻意保持精簡。使用 `/goal` 查看完整目標、
備註、token 預算和可用命令。

## 頻道行為

`/goal` 可在支援命令的 OpenClaw 工作階段中運作，包括終端介面和
允許文字命令的聊天表面。目標狀態附加到
工作階段金鑰，而不是傳輸，因此共用工作階段金鑰的兩個表面會看到
相同目標。

目標狀態不是投遞指令：它不會強制透過某個
頻道回覆、變更佇列行為、核准工具或排程工作。

## 疑難排解

| 訊息                                   | 意義                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | 工作階段已經有目標。使用 `/goal` 檢查它；若已完成，使用 `/goal complete`；或在開始不同目標前使用 `/goal clear`。                            |
| `Goal error: goal not found`           | 工作階段還沒有目標。使用 `/goal start <objective>` 開始一個目標。                                                                           |
| `Goal error: goal is already complete` | 目標是終端狀態。開始或恢復另一個目標前，請先清除它。                                                                                       |

如果 token 用量顯示 `0` 或看起來過期，作用中的工作階段可能尚未有
新鮮的 token 快照。當 OpenClaw 記錄工作階段用量和由轉錄推導的總量時，
用量會重新整理。

## 相關

- [斜線命令](/zh-TW/tools/slash-commands)
- [終端介面](/zh-TW/web/tui)
- [工作階段工具](/zh-TW/concepts/session-tool)
- [壓縮](/zh-TW/concepts/compaction)
- [TaskFlow](/zh-TW/automation/taskflow)
- [常設指令](/zh-TW/automation/standing-orders)

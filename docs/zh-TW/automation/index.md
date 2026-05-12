---
doc-schema-version: 1
read_when:
    - 決定如何使用 OpenClaw 自動化工作
    - 在 Heartbeat、Cron、承諾事項、鉤子和常設指令之間選擇
    - 尋找合適的自動化進入點
summary: 自動化機制概述：任務、Cron、掛鉤、常設指令與任務流程
title: 自動化
x-i18n:
    generated_at: "2026-05-12T00:56:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e7604ca27feddacf48166ca2813ac63336559c115cabe0740fb5d57e93a06
    source_path: automation/index.md
    workflow: 16
---

OpenClaw 透過任務、排程工作、推斷承諾、事件 hooks 與常設指令在背景執行工作。此頁面協助你選擇正確機制，並了解它們如何彼此配合。

## 快速決策指南

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| 使用案例                                | 建議使用               | 原因                                             |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| 每日上午 9 點整傳送每日報告             | 排程任務 (Cron)        | 精準時間、隔離執行                              |
| 20 分鐘後提醒我                         | 排程任務 (Cron)        | 使用精準時間的一次性任務 (`--at`)               |
| 執行每週深度分析                        | 排程任務 (Cron)        | 獨立任務，可使用不同模型                        |
| 每 30 分鐘檢查收件匣                    | Heartbeat              | 與其他檢查批次執行，且具備情境感知              |
| 監控行事曆中的即將到來事件              | Heartbeat              | 非常適合週期性覺察                              |
| 在提到的面試後查看近況                  | 推斷承諾               | 類似記憶的後續追蹤，沒有精確提醒要求            |
| 根據使用者情境進行溫和關懷查看          | 推斷承諾               | 限定於相同 agent 和頻道                         |
| 檢查 subagent 或 ACP 執行的狀態         | 背景任務               | 任務帳本會追蹤所有分離工作                      |
| 稽核執行了什麼以及何時執行              | 背景任務               | `openclaw tasks list` 和 `openclaw tasks audit` |
| 多步驟研究後摘要                        | Task Flow              | 具備修訂追蹤的持久化編排                        |
| 在 session reset 時執行指令碼           | Hooks                  | 事件驅動，於生命週期事件觸發                    |
| 在每次工具呼叫時執行程式碼              | Plugin hooks           | 程序內 hooks 可攔截工具呼叫                     |
| 回覆前一律檢查合規性                    | 常設指令               | 自動注入每個 session                            |

### 排程任務 (Cron) 與 Heartbeat

| 面向            | 排程任務 (Cron)                     | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| 時間            | 精準（cron 表達式、一次性）         | 近似（預設每 30 分鐘）               |
| Session 情境    | 全新（隔離）或共用                  | 完整主 session 情境                   |
| 任務記錄        | 一律建立                            | 從不建立                              |
| 傳遞方式        | 頻道、webhook 或靜默                | 內嵌於主 session                      |
| 最適合          | 報告、提醒、背景工作                | 收件匣檢查、行事曆、通知              |

當你需要精準時間或隔離執行時，請使用排程任務 (Cron)。當工作受益於完整 session 情境，且近似時間即可時，請使用 Heartbeat。

## 核心概念

### 排程任務 (cron)

Cron 是 Gateway 內建的精準時間排程器。它會持久化工作、在正確時間喚醒 agent，並可將輸出傳遞到聊天頻道或 webhook 端點。支援一次性提醒、週期性表達式，以及傳入 webhook 觸發器。

請參閱[排程任務](/zh-TW/automation/cron-jobs)。

### 任務

背景任務帳本會追蹤所有分離工作：ACP 執行、subagent 產生、隔離 cron 執行，以及 CLI 操作。任務是記錄，不是排程器。使用 `openclaw tasks list` 和 `openclaw tasks audit` 檢查它們。

請參閱[背景任務](/zh-TW/automation/tasks)。

### 推斷承諾

承諾是選擇啟用、短期存在的後續追蹤記憶。OpenClaw 會從一般對話推斷承諾，將其限定於相同 agent 與頻道，並透過 Heartbeat 傳遞到期的查看近況。使用者明確要求的精確提醒仍屬於 cron。

請參閱[推斷承諾](/zh-TW/concepts/commitments)。

### Task Flow

Task Flow 是位於背景任務之上的流程編排基底。它會管理持久化多步驟流程，具備受管理與鏡像同步模式、修訂追蹤，以及用於檢查的 `openclaw tasks flow list|show|cancel`。

請參閱 [Task Flow](/zh-TW/automation/taskflow)。

### 常設指令

常設指令會授予 agent 針對已定義程式的永久操作權限。它們位於工作區檔案中（通常是 `AGENTS.md`），並注入每個 session。可與 cron 搭配，用於基於時間的強制執行。

請參閱[常設指令](/zh-TW/automation/standing-orders)。

### Hooks

內部 hooks 是由 agent 生命週期事件 (`/new`、`/reset`、`/stop`)、session Compaction、Gateway 啟動，以及訊息流程觸發的事件驅動指令碼。它們會自動從目錄中探索，並可使用 `openclaw hooks` 管理。若要進行程序內工具呼叫攔截，請使用 [Plugin hooks](/zh-TW/plugins/hooks)。

請參閱 [Hooks](/zh-TW/automation/hooks)。

### Heartbeat

Heartbeat 是週期性的主 session 回合（預設每 30 分鐘）。它會在一個 agent 回合中，利用完整 session 情境批次執行多項檢查（收件匣、行事曆、通知）。Heartbeat 回合不會建立任務記錄，也不會延長每日/閒置 session reset 的新鮮度。若要使用簡短檢查清單，請使用 `HEARTBEAT.md`；若要在 Heartbeat 本身內進行僅限到期的週期性檢查，請使用 `tasks:` 區塊。空的 Heartbeat 檔案會以 `empty-heartbeat-file` 略過；僅限到期的任務模式會以 `no-tasks-due` 略過。當 cron 工作正在作用中或排隊時，Heartbeat 會延後；`heartbeat.skipWhenBusy` 也可在 subagent 或巢狀 lanes 忙碌時延後 Heartbeat。

請參閱 [Heartbeat](/zh-TW/gateway/heartbeat)。

## 它們如何搭配運作

- **Cron** 處理精準排程（每日報告、每週審查）與一次性提醒。所有 cron 執行都會建立任務記錄。
- **Heartbeat** 在每 30 分鐘一次的批次回合中處理例行監控（收件匣、行事曆、通知）。
- **Hooks** 透過自訂指令碼回應特定事件（session resets、Compaction、訊息流程）。Plugin hooks 涵蓋工具呼叫。
- **常設指令** 提供 agent 持久情境與權限邊界。
- **Task Flow** 在個別任務之上協調多步驟流程。
- **任務** 會自動追蹤所有分離工作，讓你可以檢查與稽核。

## 相關

- [排程任務](/zh-TW/automation/cron-jobs) — 精準排程與一次性提醒
- [推斷承諾](/zh-TW/concepts/commitments) — 類似記憶的後續查看近況
- [背景任務](/zh-TW/automation/tasks) — 所有分離工作的任務帳本
- [Task Flow](/zh-TW/automation/taskflow) — 持久化多步驟流程編排
- [Hooks](/zh-TW/automation/hooks) — 事件驅動生命週期指令碼
- [Plugin hooks](/zh-TW/plugins/hooks) — 程序內工具、提示、訊息與生命週期 hooks
- [常設指令](/zh-TW/automation/standing-orders) — 持久性 agent 指令
- [Heartbeat](/zh-TW/gateway/heartbeat) — 週期性主 session 回合
- [設定參考](/zh-TW/gateway/configuration-reference) — 所有設定鍵

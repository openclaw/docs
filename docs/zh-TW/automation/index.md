---
doc-schema-version: 1
read_when:
    - 決定如何使用 OpenClaw 自動化工作
    - 在心跳偵測、排程、承諾、掛鉤與常設指令之間進行選擇
    - 尋找合適的自動化進入點
summary: 自動化機制概覽：任務、排程、鉤子、常駐指令與 TaskFlow
title: 自動化
x-i18n:
    generated_at: "2026-07-11T21:07:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw 透過任務、排程工作、推斷承諾、事件鉤子與常設指令，在背景執行工作。請使用本頁選擇合適的機制。

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

| 使用情境                                | 建議機制            | 原因                                              |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| 每天上午 9 點整傳送報告         | 排程工作（排程） | 精確時間、隔離執行                 |
| 20 分鐘後提醒我                 | 排程工作（排程） | 使用精確時間的一次性工作（`--at`）            |
| 每週執行深度分析                | 排程工作（排程） | 獨立任務，可使用不同模型         |
| 每 30 分鐘檢查收件匣                | 心跳偵測              | 與其他檢查批次執行，並能感知情境         |
| 監控行事曆中的近期活動    | 心跳偵測              | 很適合用於週期性感知               |
| 在提及的面試後追蹤    | 推斷承諾   | 類似記憶的後續追蹤，未明確要求提醒 |
| 根據使用者情境進行溫和的關懷問候 | 推斷承諾   | 範圍限定於相同代理與頻道             |
| 檢查子代理或 ACP 執行的狀態 | 背景任務       | 任務帳本會追蹤所有分離執行的工作            |
| 稽核執行了哪些工作及其時間                 | 背景任務       | `openclaw tasks list` 與 `openclaw tasks audit` |
| 執行多步驟研究後摘要      | 任務流程              | 具備修訂追蹤的持久化協調機制     |
| 在工作階段重設時執行指令碼           | 鉤子                  | 由事件驅動，在生命週期事件發生時觸發          |
| 每次工具呼叫時執行程式碼         | 外掛鉤子           | 程序內鉤子可攔截工具呼叫        |
| 回覆前一律檢查合規性 | 常設指令        | 自動注入每個工作階段        |

### 排程工作（排程）與心跳偵測的比較

| 面向       | 排程工作（排程）              | 心跳偵測                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| 時間安排          | 精確（排程運算式、一次性）  | 約略（預設每 30 分鐘）    |
| 工作階段情境 | 全新（隔離）或共用          | 完整的主要工作階段情境             |
| 任務記錄    | 一律建立                      | 絕不建立                         |
| 傳送方式        | 頻道、網路鉤子或靜默         | 直接顯示於主要工作階段                |
| 最適合        | 報告、提醒、背景工作 | 收件匣檢查、行事曆、通知 |

需要精確時間或隔離執行時，請使用排程工作（排程）。若工作可受益於完整的工作階段情境，且約略時間即可，請使用心跳偵測。

## 核心概念

### 排程工作（排程）

排程是閘道內建的精確計時排程器。它會保存工作、在正確時間喚醒代理，並可將輸出傳送至聊天頻道或網路鉤子端點。支援一次性提醒、週期性運算式及傳入網路鉤子觸發器。

請參閱[排程工作](/zh-TW/automation/cron-jobs)。

### 任務

背景任務帳本會追蹤所有分離執行的工作：ACP 執行、子代理啟動、隔離的排程執行，以及命令列介面操作。任務是記錄，而非排程器。請使用 `openclaw tasks list` 與 `openclaw tasks audit` 檢查任務。

請參閱[背景任務](/zh-TW/automation/tasks)。

### 推斷承諾

承諾是選擇啟用、短期保存的後續追蹤記憶。OpenClaw 會從一般對話中推斷承諾，將其範圍限定於相同代理與頻道，並透過心跳偵測傳送到期的問候。使用者明確要求且時間精確的提醒仍應交由排程處理。

請參閱[推斷承諾](/zh-TW/concepts/commitments)。

### 任務流程

任務流程是建立在背景任務之上的流程協調基礎。它透過受管理與鏡像同步模式、修訂追蹤，以及用於檢查的 `openclaw tasks flow list|show|cancel`，管理持久化的多步驟流程。

請參閱[任務流程](/zh-TW/automation/taskflow)。

### 常設指令

常設指令會授予代理針對指定程序的永久操作權限。這些指令存放於工作區檔案中（通常是 `AGENTS.md`），並會注入每個工作階段。可搭配排程使用，以進行以時間為基礎的強制執行。

請參閱[常設指令](/zh-TW/automation/standing-orders)。

### 鉤子

內部鉤子是由代理生命週期事件（`/new`、`/reset`、`/stop`）、工作階段壓縮、閘道啟動及訊息流程觸發的事件驅動指令碼。系統會從鉤子目錄中探索這些鉤子，並使用 `openclaw hooks` 管理。若要在程序內攔截工具呼叫，請使用[外掛鉤子](/zh-TW/plugins/hooks)。

請參閱[鉤子](/zh-TW/automation/hooks)。

### 心跳偵測

心跳偵測是週期性的主要工作階段回合（預設每 30 分鐘）。它會在一次具備完整工作階段情境的代理回合中，批次執行多項檢查（收件匣、行事曆、通知）。心跳偵測回合不會建立任務記錄，也不會延長每日或閒置工作階段重設的有效期。使用 `HEARTBEAT.md` 可設定簡短的檢查清單；若希望僅在到期時於心跳偵測中執行週期性檢查，則可使用 `tasks:` 區塊。空白的心跳偵測檔案會以 `empty-heartbeat-file` 跳過；僅執行到期任務的模式則會以 `no-tasks-due` 跳過。當排程工作正在執行或排隊時，心跳偵測會延後；當相同代理依工作階段索引鍵識別的子代理或巢狀執行通道忙碌時，`heartbeat.skipWhenBusy` 也可延後該代理。

請參閱[心跳偵測](/zh-TW/gateway/heartbeat)。

## 這些機制如何協同運作

- **排程**處理精確排程（每日報告、每週審查）與一次性提醒。所有排程執行都會建立任務記錄。
- **心跳偵測**每 30 分鐘在一次批次回合中處理例行監控（收件匣、行事曆、通知）。
- **鉤子**透過自訂指令碼回應特定事件（工作階段重設、壓縮、訊息流程）。外掛鉤子則處理工具呼叫。
- **常設指令**為代理提供持續性的情境與權限界線。
- **任務流程**在個別任務之上協調多步驟流程。
- **任務**會自動追蹤所有分離執行的工作，供您檢查與稽核。

## 相關內容

- [排程工作](/zh-TW/automation/cron-jobs) — 精確排程與一次性提醒
- [推斷承諾](/zh-TW/concepts/commitments) — 類似記憶的後續問候
- [背景任務](/zh-TW/automation/tasks) — 所有分離執行工作的任務帳本
- [任務流程](/zh-TW/automation/taskflow) — 持久化的多步驟流程協調
- [鉤子](/zh-TW/automation/hooks) — 事件驅動的生命週期指令碼
- [外掛鉤子](/zh-TW/plugins/hooks) — 程序內的工具、提示詞、訊息與生命週期鉤子
- [常設指令](/zh-TW/automation/standing-orders) — 持續性的代理指令
- [心跳偵測](/zh-TW/gateway/heartbeat) — 週期性的主要工作階段回合
- [設定參考](/zh-TW/gateway/configuration-reference) — 所有設定鍵

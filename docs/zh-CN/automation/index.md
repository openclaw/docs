---
doc-schema-version: 1
read_when:
    - 决定如何使用 OpenClaw 自动化工作
    - 在心跳、定时任务、跟进承诺、Hooks 和长期指令之间进行选择
    - 寻找合适的自动化入口点
summary: 自动化机制概览：任务、cron、Hooks、长期指令和 Task Flow
title: 自动化
x-i18n:
    generated_at: "2026-07-11T20:18:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw 通过任务、定时作业、推断式跟进承诺、事件钩子和常驻指令在后台运行工作。使用本页选择合适的机制。

## 快速决策指南

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

| 使用场景                                | 推荐机制              | 原因                                              |
| --------------------------------------- | --------------------- | ------------------------------------------------- |
| 每天上午 9 点准时发送报告               | 定时任务（Cron）       | 时间精确，隔离执行                                |
| 20 分钟后提醒我                         | 定时任务（Cron）       | 精确定时的一次性任务（`--at`）                    |
| 每周运行深度分析                        | 定时任务（Cron）       | 独立任务，可以使用不同模型                        |
| 每 30 分钟检查收件箱                    | Heartbeat             | 与其他检查批量执行，并能感知上下文                |
| 监控日历中的近期事件                    | Heartbeat             | 非常适合周期性感知                                |
| 在提到的面试结束后跟进                  | 推断式跟进承诺         | 类似记忆的后续跟进，无明确的提醒请求              |
| 根据用户上下文进行温和的关怀回访        | 推断式跟进承诺         | 限定在同一智能体和渠道内                          |
| 检查子智能体或 ACP 运行的状态           | 后台任务              | 任务账本会跟踪所有脱离式工作                      |
| 审计运行过的内容和时间                  | 后台任务              | `openclaw tasks list` 和 `openclaw tasks audit`   |
| 执行多步骤研究后进行总结                | Task Flow             | 具有修订跟踪能力的持久化编排                      |
| 会话重置时运行脚本                      | Hooks                 | 由事件驱动，在生命周期事件发生时触发              |
| 每次调用工具时执行代码                  | 插件钩子              | 进程内钩子可以拦截工具调用                        |
| 回复前始终检查合规性                    | 常驻指令              | 自动注入每个会话                                  |

### 定时任务（Cron）与 Heartbeat 对比

| 维度          | 定时任务（Cron）                    | Heartbeat                            |
| ------------- | ----------------------------------- | ------------------------------------ |
| 时间安排      | 精确（cron 表达式、一次性任务）     | 近似（默认每 30 分钟）               |
| 会话上下文    | 全新（隔离）或共享                  | 完整的主会话上下文                   |
| 任务记录      | 始终创建                            | 从不创建                             |
| 交付方式      | 渠道、webhook 或静默                | 在主会话中内联                       |
| 最适合        | 报告、提醒、后台作业                | 收件箱检查、日历、通知               |

需要精确定时或隔离执行时，请使用定时任务（Cron）。如果工作受益于完整的会话上下文，并且近似定时即可满足需求，请使用 Heartbeat。

## 核心概念

### 定时任务（cron）

Cron 是 Gateway 网关内置的精确定时调度器。它会持久保存作业，在适当的时间唤醒智能体，并可将输出交付到聊天渠道或 webhook 端点。它支持一次性提醒、周期性表达式和入站 webhook 触发器。

参阅[定时任务](/zh-CN/automation/cron-jobs)。

### 任务

后台任务账本跟踪所有脱离式工作：ACP 运行、子智能体创建、隔离的 cron 执行和 CLI 操作。任务是记录，而不是调度器。使用 `openclaw tasks list` 和 `openclaw tasks audit` 检查这些记录。

参阅[后台任务](/zh-CN/automation/tasks)。

### 推断式跟进承诺

跟进承诺是需要选择启用的短期后续记忆。OpenClaw 从正常对话中推断它们，将其范围限定在同一智能体和渠道内，并通过 Heartbeat 交付到期的回访。用户明确请求的精确定时提醒仍应使用 cron。

参阅[推断式跟进承诺](/zh-CN/concepts/commitments)。

### Task Flow

Task Flow 是构建在后台任务之上的流程编排基础设施。它通过托管和镜像同步模式、修订跟踪以及用于检查的 `openclaw tasks flow list|show|cancel`，管理持久化的多步骤流程。

参阅 [Task Flow](/zh-CN/automation/taskflow)。

### 常驻指令

常驻指令授予智能体针对指定程序的永久操作权限。它们位于工作区文件中（通常是 `AGENTS.md`），并会注入每个会话。可将其与 cron 结合使用，以实施基于时间的约束。

参阅[常驻指令](/zh-CN/automation/standing-orders)。

### Hooks

内部钩子是由智能体生命周期事件（`/new`、`/reset`、`/stop`）、会话压缩、Gateway 网关启动和消息流触发的事件驱动脚本。系统会从钩子目录中发现它们，并通过 `openclaw hooks` 进行管理。如需在进程内拦截工具调用，请使用[插件钩子](/zh-CN/plugins/hooks)。

参阅 [Hooks](/zh-CN/automation/hooks)。

### Heartbeat

Heartbeat 是周期性的主会话轮次（默认每 30 分钟一次）。它在具有完整会话上下文的单个智能体轮次中批量执行多项检查（收件箱、日历、通知）。Heartbeat 轮次不会创建任务记录，也不会延长每日或空闲会话重置的新鲜度。可使用 `HEARTBEAT.md` 编写简短检查清单；如果希望仅在任务到期时于 Heartbeat 内执行周期性检查，则可使用 `tasks:` 块。空的 Heartbeat 文件会以 `empty-heartbeat-file` 原因跳过；仅执行到期任务的模式会以 `no-tasks-due` 原因跳过。当 cron 工作处于活动或排队状态时，Heartbeat 会推迟执行；当同一智能体按会话键关联的子智能体或嵌套执行通道繁忙时，`heartbeat.skipWhenBusy` 也可以推迟该智能体的执行。

参阅 [Heartbeat](/zh-CN/gateway/heartbeat)。

## 它们如何协同工作

- **Cron** 处理精确的计划安排（每日报告、每周复盘）和一次性提醒。所有 cron 执行都会创建任务记录。
- **Heartbeat** 每 30 分钟在一个批处理轮次中执行常规监控（收件箱、日历、通知）。
- **Hooks** 使用自定义脚本响应特定事件（会话重置、压缩、消息流）。插件钩子负责工具调用。
- **常驻指令** 为智能体提供持久上下文和权限边界。
- **Task Flow** 在单个任务之上协调多步骤流程。
- **任务** 自动跟踪所有脱离式工作，方便你检查和审计。

## 相关内容

- [定时任务](/zh-CN/automation/cron-jobs) — 精确调度和一次性提醒
- [推断式跟进承诺](/zh-CN/concepts/commitments) — 类似记忆的后续回访
- [后台任务](/zh-CN/automation/tasks) — 跟踪所有脱离式工作的任务账本
- [Task Flow](/zh-CN/automation/taskflow) — 持久化的多步骤流程编排
- [Hooks](/zh-CN/automation/hooks) — 事件驱动的生命周期脚本
- [插件钩子](/zh-CN/plugins/hooks) — 进程内工具、提示词、消息和生命周期钩子
- [常驻指令](/zh-CN/automation/standing-orders) — 持久化的智能体指令
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性的主会话轮次
- [配置参考](/zh-CN/gateway/configuration-reference) — 所有配置键

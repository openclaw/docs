---
read_when:
    - 检查正在进行中或最近已完成的后台工作
    - 调试分离式智能体运行的交付失败问题
    - 了解后台运行与会话、cron 和心跳之间的关系
summary: ACP 运行、子智能体、隔离的 cron 作业和 CLI 操作的后台任务跟踪
title: 后台任务
x-i18n:
    generated_at: "2026-04-26T04:11:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6dab04af135f80a75203123e61a63c366519ed355706f12033e825a87e50f36c
    source_path: automation/tasks.md
    workflow: 15
---

> **在找调度功能？** 请参阅 [Automation & Tasks](/zh-CN/automation)，以选择合适的机制。本页介绍的是如何**跟踪**后台工作，而不是如何调度它。

后台任务用于跟踪**在你的主对话会话之外**运行的工作：
ACP 运行、子智能体生成、隔离的 cron 作业执行，以及由 CLI 发起的操作。

任务**不会**替代会话、cron 作业或心跳 —— 它们是记录分离式工作发生了什么、何时发生以及是否成功的**活动台账**。

<Note>
并非每次智能体运行都会创建任务。心跳轮次和正常的交互式聊天不会创建任务。所有 cron 执行、ACP 生成、子智能体生成以及 CLI 智能体命令都会创建任务。
</Note>

## TL;DR

- 任务是**记录**，不是调度器 —— cron 和心跳决定工作_何时_运行，任务跟踪_发生了什么_。
- ACP、子智能体、所有 cron 作业和 CLI 操作都会创建任务。心跳轮次不会。
- 每个任务都会经历 `queued → running → terminal`（succeeded、failed、timed_out、cancelled 或 lost）。
- 只要 cron 运行时仍拥有该作业，cron 任务就会保持活动状态；而由聊天支持的 CLI 任务只有在其所属运行上下文仍处于活动状态时才会保持活动状态。
- 完成是由推送驱动的：分离式工作完成时可以直接通知，或唤醒请求方会话/心跳，因此状态轮询循环通常不是正确方式。
- 隔离的 cron 运行和子智能体完成会尽最大努力为其子会话清理已跟踪的浏览器标签页/进程，然后再进行最终清理记账。
- 隔离的 cron 交付会在后代子智能体工作仍在排空期间抑制过时的中间父级回复，并且如果后代的最终输出在交付前到达，则优先使用该输出。
- 完成通知会直接发送到某个渠道，或排队等待下一次心跳。
- `openclaw tasks list` 显示所有任务；`openclaw tasks audit` 用于发现问题。
- 终态记录会保留 7 天，然后自动清理。

## 快速开始

```bash
# 列出所有任务（最新的在前）
openclaw tasks list

# 按运行时或状态筛选
openclaw tasks list --runtime acp
openclaw tasks list --status running

# 显示特定任务的详细信息（通过 ID、运行 ID 或会话键）
openclaw tasks show <lookup>

# 取消一个正在运行的任务（会终止子会话）
openclaw tasks cancel <lookup>

# 更改任务的通知策略
openclaw tasks notify <lookup> state_changes

# 运行健康审计
openclaw tasks audit

# 预览或应用维护
openclaw tasks maintenance
openclaw tasks maintenance --apply

# 检查 TaskFlow 状态
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## 什么会创建任务

| 来源 | 运行时类型 | 何时创建任务记录 | 默认通知策略 |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| ACP 后台运行 | `acp` | 生成一个子 ACP 会话时 | `done_only` |
| 子智能体编排 | `subagent` | 通过 `sessions_spawn` 生成子智能体时 | `done_only` |
| cron 作业（所有类型） | `cron` | 每次 cron 执行时（主会话和隔离模式均包括） | `silent` |
| CLI 操作 | `cli` | 通过 Gateway 网关运行的 `openclaw agent` 命令 | `silent` |
| 智能体媒体作业 | `cli` | 由会话支持的 `video_generate` 运行 | `silent` |

主会话 cron 任务默认使用 `silent` 通知策略 —— 它们会创建记录用于跟踪，但不会生成通知。隔离的 cron 任务默认也使用 `silent`，但因为它们在自己的会话中运行，因此更容易被看到。

由会话支持的 `video_generate` 运行同样使用 `silent` 通知策略。它们仍会创建任务记录，但完成结果会作为内部唤醒交还给原始智能体会话，以便智能体自行编写后续消息并附加已完成的视频。如果你选择启用 `tools.media.asyncCompletion.directSend`，异步 `music_generate` 和 `video_generate` 完成会先尝试直接发送到渠道，如果失败，再回退到唤醒请求方会话的路径。

当某个由会话支持的 `video_generate` 任务仍处于活动状态时，该工具还会充当保护机制：同一会话中重复调用 `video_generate` 会返回当前活动任务的状态，而不是启动第二个并发生成。如果你想从智能体侧显式查询进度/状态，请使用 `action: "status"`。

**不会创建任务的情况：**

- 心跳轮次 —— 主会话；参见 [Heartbeat](/zh-CN/gateway/heartbeat)
- 正常的交互式聊天轮次
- 直接的 `/command` 响应

## 任务生命周期

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running : agent starts
    running --> succeeded : completes ok
    running --> failed : error
    running --> timed_out : timeout exceeded
    running --> cancelled : operator cancels
    queued --> lost : session gone > 5 min
    running --> lost : session gone > 5 min
```

| 状态 | 含义 |
| ----------- | -------------------------------------------------------------------------- |
| `queued` | 已创建，等待智能体启动 |
| `running` | 智能体轮次正在执行 |
| `succeeded` | 已成功完成 |
| `failed` | 已带错误完成 |
| `timed_out` | 超过已配置的超时时间 |
| `cancelled` | 由操作员通过 `openclaw tasks cancel` 停止 |
| `lost` | 运行时在 5 分钟宽限期后失去了权威的后备状态 |

状态转换会自动发生 —— 当关联的智能体运行结束时，任务状态会更新为对应结果。

智能体运行完成是活动任务记录的权威依据。成功的分离式运行会终结为 `succeeded`，普通运行错误会终结为 `failed`，而超时或中止结果会终结为 `timed_out`。如果操作员已经取消了该任务，或者运行时已经记录了更强的终态，例如 `failed`、`timed_out` 或 `lost`，那么稍后到来的成功信号不会降低该终态状态。

`lost` 是感知运行时的：

- ACP 任务：后备的 ACP 子会话元数据消失。
- 子智能体任务：后备子会话从目标智能体存储中消失。
- cron 任务：cron 运行时不再将该作业视为活动状态。
- CLI 任务：隔离的子会话任务使用子会话；由聊天支持的 CLI 任务则改为使用活动运行上下文，因此残留的渠道/群组/直接会话行不会让它们保持活动状态。由 Gateway 网关支持的 `openclaw agent` 运行也会根据其运行结果终结，因此已完成的运行不会一直停留在活动状态，直到清扫器将其标记为 `lost`。

## 交付与通知

当任务进入终态时，OpenClaw 会通知你。有两种交付路径：

**直接交付** —— 如果任务有渠道目标（即 `requesterOrigin`），完成消息会直接发送到该渠道（Telegram、Discord、Slack 等）。对于子智能体完成，OpenClaw 还会在可用时保留已绑定的线程/主题路由，并且在放弃直接交付之前，可以从请求方会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的 `to` / account。

**会话排队交付** —— 如果直接交付失败，或未设置来源，则该更新会作为系统事件排入请求方会话，并在下一次心跳时显示出来。

<Tip>
任务完成会立即触发一次心跳唤醒，让你能尽快看到结果 —— 你不必等到下一次计划中的心跳周期。
</Tip>

这意味着常见工作流是基于推送的：只需启动一次分离式工作，然后让运行时在完成时唤醒或通知你。只有在你需要调试、干预或显式审计时，才去轮询任务状态。

### 通知策略

控制你希望收到每个任务多少通知：

| 策略 | 会交付的内容 |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only`（默认） | 仅终态（succeeded、failed 等）—— **这是默认值** |
| `state_changes` | 每次状态转换和进度更新 |
| `silent` | 完全不通知 |

在任务运行期间更改策略：

```bash
openclaw tasks notify <lookup> state_changes
```

## CLI 参考

### `tasks list`

```bash
openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
```

输出列：任务 ID、类型、状态、交付、运行 ID、子会话、摘要。

### `tasks show`

```bash
openclaw tasks show <lookup>
```

查找标记支持任务 ID、运行 ID 或会话键。会显示完整记录，包括时间信息、交付状态、错误和终态摘要。

### `tasks cancel`

```bash
openclaw tasks cancel <lookup>
```

对于 ACP 和子智能体任务，这会终止子会话。对于由 CLI 跟踪的任务，取消操作会记录到任务注册表中（不存在单独的子运行时句柄）。状态会转换为 `cancelled`，并在适用时发送交付通知。

### `tasks notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

### `tasks audit`

```bash
openclaw tasks audit [--json]
```

用于发现运维问题。检测到问题时，发现结果也会显示在 `openclaw status` 中。

| 发现项 | 严重级别 | 触发条件 |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| `stale_queued` | warn | 排队超过 10 分钟 |
| `stale_running` | error | 运行超过 30 分钟 |
| `lost` | warn/error | 由运行时支持的任务归属已消失；保留的 lost 任务会在 `cleanupAfter` 之前显示为警告，之后变为错误 |
| `delivery_failed` | warn | 交付失败且通知策略不是 `silent` |
| `missing_cleanup` | warn | 终态任务没有清理时间戳 |
| `inconsistent_timestamps` | warn | 时间线冲突（例如结束时间早于开始时间） |

### `tasks maintenance`

```bash
openclaw tasks maintenance [--json]
openclaw tasks maintenance --apply [--json]
```

用它来预览或应用任务和 Task Flow 状态的对账、清理时间戳补全以及修剪。

对账是感知运行时的：

- ACP/子智能体任务会检查其后备子会话。
- cron 任务会检查 cron 运行时是否仍拥有该作业。
- 由聊天支持的 CLI 任务会检查所属的活动运行上下文，而不只是聊天会话行。

完成清理也是感知运行时的：

- 子智能体完成时，会尽最大努力关闭该子会话已跟踪的浏览器标签页/进程，然后再继续通知后的清理流程。
- 隔离的 cron 完成时，会尽最大努力关闭该 cron 会话已跟踪的浏览器标签页/进程，然后运行才会完全拆除。
- 隔离的 cron 交付会在需要时等待后代子智能体的后续处理完成，并抑制过时的父级确认文本，而不是将其通知出来。
- 子智能体完成交付会优先使用最新的可见 assistant 文本；如果该文本为空，则回退到经过清理的最新 tool/toolResult 文本，而仅包含超时的工具调用运行可以折叠为简短的部分进度摘要。终态失败的运行会通知失败状态，而不会重放捕获的回复文本。
- 清理失败不会掩盖真实的任务结果。

### `tasks flow list|show|cancel`

```bash
openclaw tasks flow list [--status <status>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

当你关注的是编排中的 Task Flow，而不是单个后台任务记录时，请使用这些命令。

## 聊天任务面板（`/tasks`）

在任意聊天会话中使用 `/tasks` 可以查看与该会话关联的后台任务。面板会显示活动中和最近已完成的任务，包括运行时、状态、时间信息，以及进度或错误详情。

当当前会话没有可见的关联任务时，`/tasks` 会回退为显示智能体本地任务计数，这样你仍然可以获得概览，同时不会泄露其他会话的详情。

如需查看完整的操作员台账，请使用 CLI：`openclaw tasks list`。

## Status 集成（任务压力）

`openclaw status` 包含一个一目了然的任务摘要：

```
Tasks: 3 queued · 2 running · 1 issues
```

该摘要会报告：

- **active** —— `queued` + `running` 的数量
- **failures** —— `failed` + `timed_out` + `lost` 的数量
- **byRuntime** —— 按 `acp`、`subagent`、`cron`、`cli` 分类的明细

`/status` 和 `session_status` 工具都使用感知清理状态的任务快照：优先显示活动任务，隐藏陈旧的已完成记录，且只有在没有活动工作剩余时才显示最近的失败。这样可以让状态卡聚焦于当前真正重要的内容。

## 存储与维护

### 任务存储位置

任务记录会持久化到以下 SQLite 路径：

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

注册表会在 Gateway 网关启动时加载到内存中，并将写入同步到 SQLite，以确保在重启后仍具备持久性。

### 自动维护

清扫器每 **60 秒** 运行一次，并处理三类事项：

1. **对账** —— 检查活动任务是否仍具有权威的运行时后备状态。ACP/子智能体任务使用子会话状态，cron 任务使用活动作业归属，而由聊天支持的 CLI 任务使用所属的运行上下文。如果该后备状态消失超过 5 分钟，任务就会被标记为 `lost`。
2. **清理时间戳补全** —— 为终态任务设置 `cleanupAfter` 时间戳（`endedAt + 7 days`）。在保留期内，lost 任务仍会在审计中显示为警告；在 `cleanupAfter` 到期后，或当清理元数据缺失时，它们会变为错误。
3. **修剪** —— 删除超过其 `cleanupAfter` 日期的记录。

**保留期**：终态任务记录会保留 **7 天**，之后自动清理。无需额外配置。

## 任务与其他系统的关系

### 任务与 Task Flow

[Task Flow](/zh-CN/automation/taskflow) 是位于后台任务之上的流程编排层。单个 flow 在其生命周期内可以通过托管或镜像同步模式协调多个任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排该流程的 flow。

详见 [Task Flow](/zh-CN/automation/taskflow)。

### 任务与 cron

cron 作业的**定义**存储在 `~/.openclaw/cron/jobs.json` 中；运行时执行状态则存储在旁边的 `~/.openclaw/cron/jobs-state.json` 中。**每次** cron 执行都会创建任务记录 —— 无论是主会话还是隔离模式。主会话 cron 任务默认使用 `silent` 通知策略，因此它们会被跟踪，但不会生成通知。

详见 [Cron Jobs](/zh-CN/automation/cron-jobs)。

### 任务与心跳

心跳运行属于主会话轮次 —— 它们不会创建任务记录。任务完成时，可以触发一次心跳唤醒，以便你及时看到结果。

详见 [Heartbeat](/zh-CN/gateway/heartbeat)。

### 任务与会话

一个任务可能会引用 `childSessionKey`（工作运行的位置）和 `requesterSessionKey`（启动它的人）。会话是对话上下文；任务则是在其之上的活动跟踪。

### 任务与智能体运行

任务的 `runId` 会链接到执行该工作的智能体运行。智能体生命周期事件（开始、结束、错误）会自动更新任务状态 —— 你不需要手动管理生命周期。

## 相关内容

- [Automation & Tasks](/zh-CN/automation) —— 所有自动化机制总览
- [Task Flow](/zh-CN/automation/taskflow) —— 位于任务之上的流程编排
- [Scheduled Tasks](/zh-CN/automation/cron-jobs) —— 调度后台工作
- [Heartbeat](/zh-CN/gateway/heartbeat) —— 周期性的主会话轮次
- [CLI: Tasks](/zh-CN/cli/tasks) —— CLI 命令参考

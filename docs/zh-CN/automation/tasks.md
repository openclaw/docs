---
read_when:
    - 查看正在进行或最近完成的后台工作
    - 调试分离式智能体运行的递送失败
    - 了解后台运行与会话、cron 和 Heartbeat 的关系
sidebarTitle: Background tasks
summary: 用于 ACP 运行、子智能体、隔离 cron 作业和 CLI 操作的后台任务跟踪
title: 后台任务
x-i18n:
    generated_at: "2026-05-12T00:56:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31cbf09df48bab0686a1350f91aefffffef899c86704bb97b68320fc47e78021
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
在寻找定时安排？请参阅 [自动化](/zh-CN/automation) 来选择合适机制。本页是后台工作的活动账本，不是调度器。
</Note>

后台任务会跟踪在**你的主对话会话之外**运行的工作：ACP 运行、子智能体生成、隔离的 cron 任务执行，以及 CLI 发起的操作。

任务**不会**替代会话、cron 任务或 Heartbeat - 它们是记录已分离工作发生了什么、何时发生以及是否成功的**活动账本**。

<Note>
并非每次智能体运行都会创建任务。Heartbeat 轮次和普通交互式聊天不会。所有 cron 执行、ACP 生成、子智能体生成和 CLI 智能体命令都会创建任务。
</Note>

## TL;DR

- 任务是**记录**，不是调度器 - cron 和 Heartbeat 决定工作_何时_运行，任务跟踪_发生了什么_。
- ACP、子智能体、所有 cron 任务和 CLI 操作都会创建任务。Heartbeat 轮次不会。
- 每个任务都会经历 `queued → running → terminal`（succeeded、failed、timed_out、cancelled 或 lost）。
- 只要 cron 运行时仍拥有该任务，cron 任务就会保持活动；如果
  内存中的运行时状态已消失，任务维护会先检查持久化的 cron
  运行历史，再将任务标记为 lost。
- 完成由推送驱动：分离的工作可以直接通知，或在完成时唤醒
  请求者会话/Heartbeat，因此状态轮询循环通常不是合适的形式。
- 隔离的 cron 运行和子智能体完成会尽力清理其子会话跟踪的浏览器标签页/进程，然后再进行最终清理记账。
- 当后代子智能体工作仍在收尾时，隔离的 cron 投递会抑制陈旧的临时父级回复，并且如果最终后代输出在投递前到达，它会优先使用该输出。
- 完成通知会直接投递到渠道，或排队等待下一次 Heartbeat。
- `openclaw tasks list` 显示所有任务；`openclaw tasks audit` 暴露问题。
- 终态记录会保留 7 天，然后自动清理。

## 快速开始

<Tabs>
  <Tab title="List and filter">
    ```bash
    # List all tasks (newest first)
    openclaw tasks list

    # Filter by runtime or status
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="Inspect">
    ```bash
    # Show details for a specific task (by ID, run ID, or session key)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="Cancel and notify">
    ```bash
    # Cancel a running task (kills the child session)
    openclaw tasks cancel <lookup>

    # Change notification policy for a task
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="Audit and maintenance">
    ```bash
    # Run a health audit
    openclaw tasks audit

    # Preview or apply maintenance
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="Task flow">
    ```bash
    # Inspect TaskFlow state
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## 什么会创建任务

| 来源                 | 运行时类型 | 创建任务记录的时机                          | 默认通知策略 |
| ---------------------- | ------------ | ------------------------------------------------------ | --------------------- |
| ACP 后台运行    | `acp`        | 生成子 ACP 会话                           | `done_only`           |
| 子智能体编排 | `subagent`   | 通过 `sessions_spawn` 生成子智能体               | `done_only`           |
| cron 任务（所有类型）  | `cron`       | 每次 cron 执行（主会话和隔离）       | `silent`              |
| CLI 操作         | `cli`        | 通过 Gateway 网关运行的 `openclaw agent` 命令 | `silent`              |
| 智能体媒体任务       | `cli`        | 基于会话的 `music_generate`/`video_generate` 运行  | `silent`              |

<AccordionGroup>
  <Accordion title="Notify defaults for cron and media">
    主会话 cron 任务默认使用 `silent` 通知策略 - 它们会创建用于跟踪的记录，但不会生成通知。隔离的 cron 任务也默认使用 `silent`，但由于它们在自己的会话中运行，因此更可见。

    基于会话的 `music_generate` 和 `video_generate` 运行也使用 `silent` 通知策略。它们仍会创建任务记录，但完成会作为内部唤醒交还给原始智能体会话，以便智能体自行写入后续消息并附加完成的媒体。群组/渠道完成遵循正常的可见回复策略，因此当源投递要求时，智能体会使用消息工具。如果完成智能体在仅工具路由中未能生成消息工具投递证据，OpenClaw 会将完成回退直接发送到原始渠道，而不是让媒体保持私有。

  </Accordion>
  <Accordion title="Concurrent video_generate guardrail">
    当基于会话的 `video_generate` 任务仍处于活动状态时，该工具也会充当护栏：同一会话中重复的 `video_generate` 调用会返回活动任务状态，而不是启动第二个并发生成。当你需要从智能体侧显式查询进度/状态时，请使用 `action: "status"`。
  </Accordion>
  <Accordion title="What does not create tasks">
    - Heartbeat 轮次 - 主会话；参见 [Heartbeat](/zh-CN/gateway/heartbeat)
    - 普通交互式聊天轮次
    - 直接 `/command` 响应

  </Accordion>
</AccordionGroup>

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

| 状态      | 含义                                                              |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 已创建，等待智能体启动                                    |
| `running`   | 智能体轮次正在主动执行                                           |
| `succeeded` | 已成功完成                                                     |
| `failed`    | 已完成但出现错误                                                    |
| `timed_out` | 超过配置的超时时间                                            |
| `cancelled` | 操作者通过 `openclaw tasks cancel` 停止                        |
| `lost`      | 运行时在 5 分钟宽限期后失去了权威支撑状态 |

转换会自动发生 - 当关联的智能体运行结束时，任务状态会更新为匹配的状态。

智能体运行完成是活动任务记录的权威依据。成功的分离运行会最终确定为 `succeeded`，普通运行错误会最终确定为 `failed`，超时或中止结果会最终确定为 `timed_out`。如果操作者已经取消任务，或运行时已经记录了更强的终态，例如 `failed`、`timed_out` 或 `lost`，后续的成功信号不会降级该终态。

`lost` 具备运行时感知能力：

- ACP 任务：支撑 ACP 子会话元数据消失。
- 子智能体任务：支撑子会话从目标智能体存储中消失。
- cron 任务：cron 运行时不再将该任务跟踪为活动，并且持久化的
  cron 运行历史没有显示该运行的终态结果。离线 CLI
  审计不会把自己的空进程内 cron 运行时状态视为权威依据。
- CLI 任务：带有运行 ID/来源 ID 的任务使用实时运行上下文，因此
  Gateway 网关拥有的运行消失后，残留的子会话或聊天会话行不会让它们继续保持活动。没有运行身份的旧版 CLI 任务仍会回退到子会话。由 Gateway 网关支撑的 `openclaw agent` 运行也会根据其运行结果最终确定，因此已完成的运行不会一直保持活动，直到清扫器将其标记为 `lost`。

## 投递和通知

当任务达到终态时，OpenClaw 会通知你。有两条投递路径：

**直接投递** - 如果任务有渠道目标（`requesterOrigin`），完成消息会直接发送到该渠道（Telegram、Discord、Slack 等）。群组和渠道任务完成则会通过请求者会话路由，以便父智能体写入可见回复。对于子智能体完成，OpenClaw 还会在可用时保留绑定线程/主题路由，并且可以在放弃直接投递前，从请求者会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补齐缺失的 `to` / 账户。

**会话排队投递** - 如果直接投递失败或未设置来源，该更新会作为系统事件排入请求者会话，并在下一次 Heartbeat 中显示。

<Tip>
任务完成会触发一次立即的 Heartbeat 唤醒，因此你会很快看到结果 - 不必等待下一次计划的 Heartbeat tick。
</Tip>

这意味着常规工作流基于推送：启动一次分离工作，然后让运行时在完成时唤醒或通知你。仅在需要调试、干预或显式审计时轮询任务状态。

### 通知策略

控制每个任务的通知频率：

| 策略                | 投递内容                                                       |
| --------------------- | ----------------------------------------------------------------------- |
| `done_only`（默认） | 仅终态（succeeded、failed 等）- **这是默认值** |
| `state_changes`       | 每次状态转换和进度更新                              |
| `silent`              | 完全不通知                                                          |

在任务运行时更改策略：

```bash
openclaw tasks notify <lookup> state_changes
```

## CLI 参考

<AccordionGroup>
  <Accordion title="tasks list">
    ```bash
    openclaw tasks list [--runtime <acp|subagent|cron|cli>] [--status <status>] [--json]
    ```

    输出列：任务 ID、种类、状态、投递、运行 ID、子会话、摘要。

  </Accordion>
  <Accordion title="tasks show">
    ```bash
    openclaw tasks show <lookup>
    ```

    查询令牌接受任务 ID、运行 ID 或会话键。显示完整记录，包括时间、投递状态、错误和终态摘要。

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    对于 ACP 和子智能体任务，这会终止子会话。对于 CLI 跟踪的任务，取消会记录在任务注册表中（没有单独的子运行时句柄）。状态转换为 `cancelled`，并在适用时发送投递通知。

  </Accordion>
  <Accordion title="tasks notify">
    ```bash
    openclaw tasks notify <lookup> <done_only|state_changes|silent>
    ```
  </Accordion>
  <Accordion title="tasks audit">
    ```bash
    openclaw tasks audit [--json]
    ```

    暴露运维问题。检测到问题时，发现项也会显示在 `openclaw status` 中。

    | 发现项                    | 严重性     | 触发条件                                                                                                      |
    | ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
    | `stale_queued`            | warn       | 排队超过 10 分钟                                                                              |
    | `stale_running`           | error      | 运行超过 30 分钟                                                                             |
    | `lost`                    | warn/error | 运行时支持的任务所有权消失；保留的丢失任务在 `cleanupAfter` 之前发出警告，之后变为错误 |
    | `delivery_failed`         | warn       | 投递失败且通知策略不是 `silent`                                                            |
    | `missing_cleanup`         | warn       | 终止任务没有清理时间戳                                                                      |
    | `inconsistent_timestamps` | warn       | 时间线违规（例如结束早于开始）                                                        |

  </Accordion>
  <Accordion title="任务维护">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    使用它预览或应用任务、Task Flow 状态以及过期 cron 运行会话注册表行的对账、清理标记和修剪。

    对账会感知运行时：

    - ACP/子智能体任务会检查其背后的子会话。
    - 子会话带有重启恢复墓碑的子智能体任务会被标记为丢失，而不是被当作可恢复的后端会话。
    - Cron 任务会检查 cron 运行时是否仍拥有该作业，然后先从持久化的 cron 运行日志/作业状态恢复终止状态，再回退到 `lost`。只有 Gateway 网关进程对内存中的 cron 活动作业集合具有权威性；离线 CLI 审计使用持久历史，但不会仅仅因为该本地 Set 为空就将 cron 任务标记为丢失。
    - 带有运行身份的 CLI 任务会检查所属的实时运行上下文，而不只是子会话或聊天会话行。

    完成清理也会感知运行时：

    - 子智能体完成时会尽力关闭为子会话跟踪的浏览器标签页/进程，然后继续公告清理。
    - 隔离 cron 完成时会尽力关闭为 cron 会话跟踪的浏览器标签页/进程，然后运行才会完全拆除。
    - 隔离 cron 投递会在需要时等待后代子智能体后续操作完成，并抑制过期的父级确认文本，而不是公告它。
    - 子智能体完成投递会优先使用最新可见的助手文本；如果为空，则回退到经过清理的最新工具/toolResult 文本，并且只有超时工具调用的运行可以折叠为简短的部分进度摘要。终止失败的运行会公告失败状态，而不会重放捕获的回复文本。
    - 清理失败不会掩盖真实的任务结果。

    应用维护时，OpenClaw 还会移除超过 7 天的过期 `cron:<jobId>:run:<uuid>` 会话注册表行，同时保留当前正在运行的 cron 作业行，并保持非 cron 会话行不变。

  </Accordion>
  <Accordion title="任务流 list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    当你关心的是编排中的 Task Flow，而不是某一条单独的后台任务记录时，使用这些命令。

  </Accordion>
</AccordionGroup>

## 聊天任务看板（`/tasks`）

在任意聊天会话中使用 `/tasks` 查看链接到该会话的后台任务。看板会显示活动任务和最近完成的任务，包括运行时、状态、计时以及进度或错误详情。

当当前会话没有可见的已链接任务时，`/tasks` 会回退到智能体本地任务计数，因此你仍然可以获得概览，而不会泄露其他会话的详情。

如需完整的操作员账本，请使用 CLI：`openclaw tasks list`。

## Status 集成（任务压力）

`openclaw status` 包含一目了然的任务摘要：

```
Tasks: 3 queued · 2 running · 1 issues
```

摘要会报告：

- **active** - `queued` + `running` 的数量
- **failures** - `failed` + `timed_out` + `lost` 的数量
- **byRuntime** - 按 `acp`、`subagent`、`cron`、`cli` 分解

`/status` 和 `session_status` 工具都使用感知清理的任务快照：优先显示活动任务，隐藏过期的已完成行，并且仅在没有活动工作时显示近期失败。这能让状态卡片聚焦在当前真正重要的内容上。

## 存储和维护

### 任务存放位置

任务记录会持久化在 SQLite 中，位置为：

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

注册表会在 Gateway 网关启动时加载到内存，并将写入同步到 SQLite，以便在重启后保持持久性。
Gateway 网关会通过 SQLite 的默认自动检查点阈值，以及定期和关闭时的 `TRUNCATE` 检查点，限制 SQLite 预写日志大小。

### 自动维护

清扫器每 **60 秒**运行一次，并处理四件事：

<Steps>
  <Step title="对账">
    检查活动任务是否仍有权威的运行时后端。ACP/子智能体任务使用子会话状态，cron 任务使用活动作业所有权，带有运行身份的 CLI 任务使用所属的运行上下文。如果该后端状态消失超过 5 分钟，任务会被标记为 `lost`。
  </Step>
  <Step title="ACP 会话修复">
    关闭终止或孤立的父级拥有一次性 ACP 会话，并且仅在没有活动对话绑定保留时，关闭过期的终止或孤立持久 ACP 会话。
  </Step>
  <Step title="清理标记">
    为终止任务设置 `cleanupAfter` 时间戳（endedAt + 7 天）。在保留期内，丢失任务仍会在审计中显示为警告；当 `cleanupAfter` 过期或清理元数据缺失时，它们会变为错误。
  </Step>
  <Step title="修剪">
    删除超过其 `cleanupAfter` 日期的记录。
  </Step>
</Steps>

<Note>
**保留期：**终止任务记录会保留 **7 天**，然后自动修剪。无需配置。
</Note>

## 任务与其他系统的关系

<AccordionGroup>
  <Accordion title="任务和 Task Flow">
    [Task Flow](/zh-CN/automation/taskflow) 是后台任务之上的流程编排层。单个流程可以在其生命周期内使用托管或镜像同步模式协调多个任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排流程。

    详见 [Task Flow](/zh-CN/automation/taskflow)。

  </Accordion>
  <Accordion title="任务和 cron">
    cron 作业**定义**位于 `~/.openclaw/cron/jobs.json`；运行时执行状态位于旁边的 `~/.openclaw/cron/jobs-state.json`。**每次** cron 执行都会创建一条任务记录，包括主会话和隔离会话。主会话 cron 任务默认使用 `silent` 通知策略，因此它们会被跟踪但不会生成通知。

    见 [Cron 作业](/zh-CN/automation/cron-jobs)。

  </Accordion>
  <Accordion title="任务和 Heartbeat">
    Heartbeat 运行是主会话轮次，不会创建任务记录。当任务完成时，它可以触发一次 Heartbeat 唤醒，以便你及时看到结果。

    见 [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>
  <Accordion title="任务和会话">
    任务可以引用 `childSessionKey`（工作运行的位置）和 `requesterSessionKey`（启动它的人）。会话是对话上下文；任务是在其之上的活动跟踪。
  </Accordion>
  <Accordion title="任务和智能体运行">
    任务的 `runId` 会链接到执行工作的智能体运行。智能体生命周期事件（开始、结束、错误）会自动更新任务状态，你无需手动管理生命周期。
  </Accordion>
</AccordionGroup>

## 相关

- [自动化](/zh-CN/automation) - 所有自动化机制一览
- [CLI：任务](/zh-CN/cli/tasks) - CLI 命令参考
- [Heartbeat](/zh-CN/gateway/heartbeat) - 周期性主会话轮次
- [定时任务](/zh-CN/automation/cron-jobs) - 调度后台工作
- [Task Flow](/zh-CN/automation/taskflow) - 任务之上的流程编排

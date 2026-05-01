---
read_when:
    - 查看正在进行或最近完成的后台工作
    - 调试分离式智能体运行的交付失败
    - 了解后台运行如何与会话、cron 和 Heartbeat 相关
sidebarTitle: Background tasks
summary: 用于 ACP 运行、子智能体、隔离的 cron 任务和 CLI 操作的后台任务跟踪
title: 后台任务
x-i18n:
    generated_at: "2026-05-01T02:52:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8782987a79989264ae3bd1ca4b16755bdfb7e295e4f77933bf3a38c136d837f4
    source_path: automation/tasks.md
    workflow: 16
---

<Note>
正在查找调度？请参阅[自动化和任务](/zh-CN/automation)以选择合适的机制。此页面是后台工作的活动账本，而不是调度器。
</Note>

后台任务用于跟踪在**主对话会话之外**运行的工作：ACP 运行、子智能体生成、隔离的 cron 作业执行，以及由 CLI 发起的操作。

任务**不会**取代会话、cron 作业或 Heartbeat —— 它们是记录发生了哪些分离工作的**活动账本**，包括发生时间以及是否成功。

<Note>
并非每次智能体运行都会创建任务。Heartbeat 回合和普通交互式聊天不会。所有 cron 执行、ACP 生成、子智能体生成以及 CLI 智能体命令都会创建任务。
</Note>

## TL;DR

- 任务是**记录**，不是调度器 —— cron 和 Heartbeat 决定工作_何时_运行，任务跟踪_发生了什么_。
- ACP、子智能体、所有 cron 作业以及 CLI 操作都会创建任务。Heartbeat 回合不会。
- 每个任务都会经历 `queued → running → terminal`（succeeded、failed、timed_out、cancelled 或 lost）。
- 当 cron 运行时仍然拥有该作业时，cron 任务会保持活动状态；如果内存中的运行时状态已消失，任务维护会先检查持久化的 cron 运行历史，然后再将任务标记为 lost。
- 完成是推送驱动的：分离的工作可以直接通知，或在完成时唤醒请求者会话/Heartbeat，因此状态轮询循环通常不是合适的形式。
- 隔离的 cron 运行和子智能体完成会尽力为其子会话清理已跟踪的浏览器标签页/进程，然后再进行最终清理记账。
- 在后代子智能体工作仍在清空时，隔离的 cron 投递会抑制过期的中间父级回复；如果最终后代输出在投递前到达，则优先使用该输出。
- 完成通知会直接投递到某个渠道，或排队等待下一次 Heartbeat。
- `openclaw tasks list` 显示所有任务；`openclaw tasks audit` 会暴露问题。
- 终止记录会保留 7 天，然后自动清理。

## 快速开始

<Tabs>
  <Tab title="列出和筛选">
    ```bash
    # List all tasks (newest first)
    openclaw tasks list

    # Filter by runtime or status
    openclaw tasks list --runtime acp
    openclaw tasks list --status running
    ```

  </Tab>
  <Tab title="检查">
    ```bash
    # Show details for a specific task (by ID, run ID, or session key)
    openclaw tasks show <lookup>
    ```
  </Tab>
  <Tab title="取消和通知">
    ```bash
    # Cancel a running task (kills the child session)
    openclaw tasks cancel <lookup>

    # Change notification policy for a task
    openclaw tasks notify <lookup> state_changes
    ```

  </Tab>
  <Tab title="审计和维护">
    ```bash
    # Run a health audit
    openclaw tasks audit

    # Preview or apply maintenance
    openclaw tasks maintenance
    openclaw tasks maintenance --apply
    ```

  </Tab>
  <Tab title="任务流程">
    ```bash
    # Inspect TaskFlow state
    openclaw tasks flow list
    openclaw tasks flow show <lookup>
    openclaw tasks flow cancel <lookup>
    ```
  </Tab>
</Tabs>

## 什么会创建任务

| 来源                   | 运行时类型 | 创建任务记录的时机                                       | 默认通知策略 |
| ---------------------- | ---------- | -------------------------------------------------------- | ------------ |
| ACP 后台运行           | `acp`      | 生成子 ACP 会话                                          | `done_only`  |
| 子智能体编排           | `subagent` | 通过 `sessions_spawn` 生成子智能体                       | `done_only`  |
| Cron 作业（所有类型）  | `cron`     | 每次 cron 执行（主会话和隔离模式）                       | `silent`     |
| CLI 操作               | `cli`      | 通过 Gateway 网关运行的 `openclaw agent` 命令             | `silent`     |
| 智能体媒体作业         | `cli`      | 基于会话的 `music_generate`/`video_generate` 运行         | `silent`     |

<AccordionGroup>
  <Accordion title="cron 和媒体的通知默认值">
    默认情况下，主会话 cron 任务使用 `silent` 通知策略 —— 它们会创建记录用于跟踪，但不会生成通知。隔离的 cron 任务也默认为 `silent`，但由于它们在自己的会话中运行，因此更显眼。

    基于会话的 `music_generate` 和 `video_generate` 运行也使用 `silent` 通知策略。它们仍然会创建任务记录，但完成结果会作为内部唤醒交回给原始智能体会话，让智能体自行编写后续消息并附加完成的媒体。如果你启用 `tools.media.asyncCompletion.directSend`，异步 `video_generate` 完成可以先尝试直接渠道投递；异步 `music_generate` 完成仍留在请求者会话唤醒路径上。

  </Accordion>
  <Accordion title="并发 video_generate 保护栏">
    当基于会话的 `video_generate` 任务仍处于活动状态时，该工具也会充当保护栏：同一会话中重复的 `video_generate` 调用会返回活动任务状态，而不是启动第二个并发生成。当你希望从智能体侧显式查询进度/状态时，请使用 `action: "status"`。
  </Accordion>
  <Accordion title="什么不会创建任务">
    - Heartbeat 回合 —— 主会话；请参阅 [Heartbeat](/zh-CN/gateway/heartbeat)
    - 普通交互式聊天回合
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

| Status      | 含义                                                                       |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 已创建，正在等待智能体启动                                                 |
| `running`   | 智能体回合正在主动执行                                                     |
| `succeeded` | 已成功完成                                                                 |
| `failed`    | 已完成，但出现错误                                                         |
| `timed_out` | 超过了配置的超时时间                                                       |
| `cancelled` | 操作者通过 `openclaw tasks cancel` 停止                                    |
| `lost`      | 运行时在 5 分钟宽限期后失去了权威后备状态                                  |

转换会自动发生 —— 当关联的智能体运行结束时，任务状态会更新为匹配状态。

对于活动任务记录，智能体运行完成结果具有权威性。成功的分离运行会最终确定为 `succeeded`，普通运行错误会最终确定为 `failed`，超时或中止结果会最终确定为 `timed_out`。如果操作者已经取消该任务，或者运行时已经记录了更强的终止状态，例如 `failed`、`timed_out` 或 `lost`，后续的成功信号不会将该终止状态降级。

`lost` 具有运行时感知能力：

- ACP 任务：后备 ACP 子会话元数据已消失。
- 子智能体任务：后备子会话已从目标智能体存储中消失。
- Cron 任务：cron 运行时不再将该作业跟踪为活动状态，并且持久化 cron 运行历史也未显示该次运行的终止结果。离线 CLI 审计不会将其自身空的进程内 cron 运行时状态视为权威。
- CLI 任务：隔离的子会话任务使用子会话；基于聊天的 CLI 任务改用实时运行上下文，因此残留的渠道/群组/直接会话行不会让它们保持活动状态。由 Gateway 网关支持的 `openclaw agent` 运行也会从其运行结果最终确定，因此已完成的运行不会一直处于活动状态直到清扫器将其标记为 `lost`。

## 投递和通知

当任务达到终止状态时，OpenClaw 会通知你。共有两条投递路径：

**直接投递** —— 如果任务有渠道目标（`requesterOrigin`），完成消息会直接发送到该渠道（Telegram、Discord、Slack 等）。对于子智能体完成，OpenClaw 还会在可用时保留绑定的线程/话题路由，并且可以在放弃直接投递前，从请求者会话存储的路由（`lastChannel` / `lastTo` / `lastAccountId`）中补全缺失的 `to` / 账号。

**会话排队投递** —— 如果直接投递失败或未设置来源，更新会作为系统事件排入请求者的会话，并在下一次 Heartbeat 中显示。

<Tip>
任务完成会触发立即 Heartbeat 唤醒，因此你可以快速看到结果 —— 不必等待下一次计划的 Heartbeat tick。
</Tip>

这意味着常规工作流是基于推送的：启动一次分离工作，然后让运行时在完成时唤醒或通知你。只有在需要调试、干预或显式审计时，才轮询任务状态。

### 通知策略

控制你对每个任务收到的信息量：

| 策略                  | 投递内容                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| `done_only`（默认）   | 仅终止状态（succeeded、failed 等）—— **这是默认值**                     |
| `state_changes`       | 每次状态转换和进度更新                                                   |
| `silent`              | 完全不投递                                                               |

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

    查找令牌接受任务 ID、运行 ID 或会话键。显示完整记录，包括计时、投递状态、错误和终止摘要。

  </Accordion>
  <Accordion title="tasks cancel">
    ```bash
    openclaw tasks cancel <lookup>
    ```

    对于 ACP 和子智能体任务，这会终止子会话。对于由 CLI 跟踪的任务，取消会记录到任务注册表中（没有单独的子运行时句柄）。状态会转换为 `cancelled`，并在适用时发送投递通知。

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

    暴露操作问题。检测到问题时，发现项也会显示在 `openclaw status` 中。

    | 发现项                    | 严重性     | 触发条件                                                                                                              |
    | ------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
    | `stale_queued`            | 警告       | 排队超过 10 分钟                                                                                                      |
    | `stale_running`           | 错误       | 运行超过 30 分钟                                                                                                      |
    | `lost`                    | 警告/错误  | 运行时支持的任务所有权消失；保留的丢失任务在 `cleanupAfter` 之前为警告，之后变为错误                                  |
    | `delivery_failed`         | 警告       | 投递失败且通知策略不是 `silent`                                                                                       |
    | `missing_cleanup`         | 警告       | 终端任务没有清理时间戳                                                                                                |
    | `inconsistent_timestamps` | 警告       | 时间线违规（例如结束早于开始）                                                                                        |

  </Accordion>
  <Accordion title="tasks maintenance">
    ```bash
    openclaw tasks maintenance [--json]
    openclaw tasks maintenance --apply [--json]
    ```

    使用它来预览或应用任务和 Task Flow 状态的协调、清理标记和修剪。

    协调会感知运行时：

    - ACP/subagent 任务会检查其背后的子会话。
    - 如果 subagent 任务的子会话有重启恢复墓碑，则会被标记为丢失，而不是被视为可恢复的背后会话。
    - Cron 任务会检查 cron 运行时是否仍拥有该作业，然后先从持久化的 cron 运行日志/作业状态中恢复终端状态，最后才回退到 `lost`。只有 Gateway 网关进程对内存中的 cron 活动作业集合具有权威性；离线 CLI 审计使用持久历史，但不会仅因为该本地 Set 为空就将 cron 任务标记为丢失。
    - 聊天支持的 CLI 任务会检查所属的实时运行上下文，而不只是聊天会话行。

    完成清理也会感知运行时：

    - subagent 完成时会尽力关闭子会话跟踪的浏览器标签页/进程，然后继续公告清理。
    - 隔离 cron 完成时会尽力关闭 cron 会话跟踪的浏览器标签页/进程，然后运行才会完全拆除。
    - 隔离 cron 投递会在需要时等待后代 subagent 的后续处理，并抑制过期的父确认文本，而不是公告它。
    - subagent 完成投递优先使用最新可见的 assistant 文本；如果为空，则回退到经过清理的最新工具/toolResult 文本，并且仅超时的工具调用运行可以折叠为简短的部分进度摘要。终端失败运行会公告失败状态，而不会重放捕获的回复文本。
    - 清理失败不会掩盖真实的任务结果。

  </Accordion>
  <Accordion title="tasks flow list | show | cancel">
    ```bash
    openclaw tasks flow list [--status <status>] [--json]
    openclaw tasks flow show <lookup> [--json]
    openclaw tasks flow cancel <lookup>
    ```

    当你关注的是编排用 Task Flow，而不是某个单独的后台任务记录时，请使用这些命令。

  </Accordion>
</AccordionGroup>

## 聊天任务板（`/tasks`）

在任何聊天会话中使用 `/tasks`，查看链接到该会话的后台任务。该面板会显示活动任务和最近完成的任务，包括运行时、状态、计时以及进度或错误详情。

当当前会话没有可见的关联任务时，`/tasks` 会回退到智能体本地任务计数，因此你仍能获得概览，而不会泄露其他会话的详情。

如需完整的操作员账本，请使用 CLI：`openclaw tasks list`。

## Status 集成（任务压力）

`openclaw status` 包含一目了然的任务摘要：

```
Tasks: 3 queued · 2 running · 1 issues
```

摘要会报告：

- **活动** — `queued` + `running` 的计数
- **失败** — `failed` + `timed_out` + `lost` 的计数
- **按运行时** — 按 `acp`、`subagent`、`cron`、`cli` 细分

`/status` 和 `session_status` 工具都使用感知清理的任务快照：优先显示活动任务，隐藏过期的已完成行，并且只有在没有剩余活动工作时才显示近期失败。这会让状态卡片聚焦于当前重要的内容。

## 存储和维护

### 任务存放位置

任务记录会持久化到 SQLite：

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

注册表会在 Gateway 网关启动时加载到内存，并将写入同步到 SQLite，以便在重启之间保持持久性。
Gateway 网关使用 SQLite 默认的自动检查点阈值，以及周期性和关机时的 `TRUNCATE` 检查点，来限制 SQLite 预写日志大小。

### 自动维护

清扫器每 **60 秒**运行一次，处理四件事：

<Steps>
  <Step title="协调">
    检查活动任务是否仍然有权威的运行时支持。ACP/subagent 任务使用子会话状态，cron 任务使用活动作业所有权，聊天支持的 CLI 任务使用所属运行上下文。如果该支持状态消失超过 5 分钟，任务会被标记为 `lost`。
  </Step>
  <Step title="ACP 会话修复">
    关闭终端状态或孤立的父级拥有的一次性 ACP 会话；对于过期的终端状态或孤立的持久 ACP 会话，仅在没有剩余活动对话绑定时关闭。
  </Step>
  <Step title="清理标记">
    为终端任务设置 `cleanupAfter` 时间戳（endedAt + 7 天）。在保留期间，丢失任务仍会作为警告显示在审计中；当 `cleanupAfter` 过期或清理元数据缺失时，它们会变为错误。
  </Step>
  <Step title="修剪">
    删除超过其 `cleanupAfter` 日期的记录。
  </Step>
</Steps>

<Note>
**保留期：**终端任务记录会保留 **7 天**，然后自动修剪。不需要配置。
</Note>

## 任务与其他系统的关系

<AccordionGroup>
  <Accordion title="任务和 Task Flow">
    [Task Flow](/zh-CN/automation/taskflow) 是后台任务之上的流编排层。单个流可以在其生命周期内使用托管或镜像同步模式协调多个任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排用流。

    详情请参见 [Task Flow](/zh-CN/automation/taskflow)。

  </Accordion>
  <Accordion title="任务和 cron">
    cron 作业**定义**位于 `~/.openclaw/cron/jobs.json`；运行时执行状态位于旁边的 `~/.openclaw/cron/jobs-state.json`。**每次** cron 执行都会创建一条任务记录，包括主会话和隔离会话。主会话 cron 任务默认使用 `silent` 通知策略，因此会进行跟踪但不会生成通知。

    请参见 [Cron 作业](/zh-CN/automation/cron-jobs)。

  </Accordion>
  <Accordion title="任务和 Heartbeat">
    Heartbeat 运行是主会话轮次，它们不会创建任务记录。当任务完成时，它可以触发 Heartbeat 唤醒，让你及时看到结果。

    请参见 [Heartbeat](/zh-CN/gateway/heartbeat)。

  </Accordion>
  <Accordion title="任务和会话">
    任务可以引用 `childSessionKey`（工作运行的位置）和 `requesterSessionKey`（启动者）。会话是对话上下文；任务是在其之上的活动跟踪。
  </Accordion>
  <Accordion title="任务和智能体运行">
    任务的 `runId` 会链接到执行工作的智能体运行。智能体生命周期事件（开始、结束、错误）会自动更新任务状态，你不需要手动管理生命周期。
  </Accordion>
</AccordionGroup>

## 相关

- [自动化与任务](/zh-CN/automation) — 所有自动化机制一览
- [CLI：任务](/zh-CN/cli/tasks) — CLI 命令参考
- [Heartbeat](/zh-CN/gateway/heartbeat) — 周期性主会话轮次
- [定时任务](/zh-CN/automation/cron-jobs) — 调度后台工作
- [Task Flow](/zh-CN/automation/taskflow) — 任务之上的流编排

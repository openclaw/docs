---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在长会话中始终显示一个目标
    - 你需要暂停、恢复、阻塞、完成或清除会话目标
    - 你想了解 `get_goal`、`create_goal` 和 `update_goal` 工具
    - 你想查看目标在 TUI 中如何显示
summary: 会话目标：持久的每会话目标、/goal 控件、模型目标工具、token 预算和 TUI 状态
title: 目标
x-i18n:
    generated_at: "2026-07-06T10:55:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# 目标

**目标**是附加到当前 OpenClaw 会话的一个持久目标。
它为智能体和操作员提供一个用于长时间工作的共同目标，
但不会把该目标变成后台任务、提醒、cron job 或
常驻指令。

目标是会话状态：它会随会话键移动，在进程
重启后保留，并显示在 `/goal`、面向模型的目标工具以及 TUI
页脚中。

## 快速开始

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` 是可选的：`/goal get CI green for PR 87469` 也会创建一个目标，
因为 `/goal` 后面任何不是已知操作词的文本都会被视为一个
新目标。

## 目标的用途

当一个会话有一个应在多个轮次中保持可见的具体结果时，使用目标：

- PR 收尾：修复、验证、autoreview、推送，并打开或更新 PR。
- 调试运行：复现 bug、识别归属表面、修补，并
  证明修复有效。
- 文档处理：阅读相关文档、编写新页面、添加交叉链接，并
  验证文档构建。
- 维护任务：检查当前状态、做有边界的修改、运行
  正确的检查，并报告变更内容。

目标不是任务队列。当工作应脱离会话运行、
按计划重复、扇出为受管理的子工作，或作为策略持久存在时，
请使用 [Task Flow](/zh-CN/automation/taskflow)、
[tasks](/zh-CN/automation/tasks)、[cron jobs](/zh-CN/automation/cron-jobs) 或
[standing orders](/zh-CN/automation/standing-orders)。

## 命令参考

不带参数的 `/goal` 会打印当前目标摘要：

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
| `/goal` 或 `/goal status`                           | 显示当前目标。                                                           |
| `/goal start <objective>`                           | 为当前会话创建一个新目标。                                               |
| `/goal set <objective>`, `/goal create <objective>` | `start` 的别名。                                                         |
| `/goal <objective>`                                 | 也会创建一个新目标（任何不是已识别操作词的文本）。                       |
| `/goal edit <objective>`                            | 重新表述当前目标；状态和 token 计数保持不变。                            |
| `/goal pause [note]`                                | 暂停一个活跃目标。                                                       |
| `/goal resume [note]`                               | 恢复一个已暂停、已阻塞、受用量限制或受预算限制的目标。                   |
| `/goal complete [note]`                             | 将目标标记为已达成。                                                     |
| `/goal done [note]`                                 | `complete` 的别名。                                                      |
| `/goal block [note]`                                | 将目标标记为已阻塞。                                                     |
| `/goal blocked [note]`                              | `block` 的别名。                                                         |
| `/goal clear`                                       | 从会话中移除目标。                                                       |

一个会话一次只能存在一个目标。在当前目标被清除之前，
启动第二个目标会失败，并显示 `Goal error: goal already exists`。

`/goal start` 不接受 token 预算标志；预算只能通过面向模型的
`create_goal` 工具设置。

## 状态

- `active`：会话正在推进目标。
- `paused`：操作员暂停了目标；`/goal resume` 会使其再次变为活跃。
- `blocked`：智能体或操作员报告了真实阻塞；当有新的信息或状态可用时，
  `/goal resume` 会使其再次变为活跃。
- `budget_limited`：已达到配置的 token 预算；`/goal resume`
  会从同一目标开始，用新的预算窗口重新推进。
- `usage_limited`：为未来的用量限制停止状态预留；`/goal
resume` 会以相同方式重新推进。
- `complete`：目标已达成。已完成的目标是终态；请先使用 `/goal
clear`，再启动另一个目标。

`/new` 和 `/reset` 会清除当前会话目标，因为它们有意
启动全新的会话上下文。

## Token 预算

目标可以有一个可选的正数 token 预算，通过
`create_goal` 工具的 `token_budget` 参数设置。预算从
创建目标时会话的新鲜 token 计数开始衡量。如果目标开始时会话只有
过期或未知的 token 快照，OpenClaw 会等待
下一个新鲜快照，并将其用作基线，因此目标存在之前消耗的 token
不会计入该目标。

当用量达到预算时，目标会转为 `budget_limited`。这不会
删除目标或擦除目标内容；它会告诉操作员和
智能体：在目标被恢复或清除之前，该目标不再被主动推进。
恢复会以当前的新鲜 token 计数开始一个新的预算窗口。

Token 预算是会话目标的护栏，不是计费上限。提供商
配额、成本报告和上下文窗口行为仍使用正常的
OpenClaw 用量和模型控制。

## 模型工具

OpenClaw 向 Agent harness 暴露三个目标工具：

| 工具          | 用途                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | 读取当前会话目标：状态、目标内容、token 用量和 token 预算。                                                             |
| `create_goal` | 仅当用户或系统指令明确要求时创建目标。如果会话已有目标，则失败。                                                       |
| `update_goal` | 将目标标记为 `complete` 或 `blocked`。                                                                                   |

模型不能静默暂停、恢复、清除或替换目标。这些操作仍然是
通过 `/goal` 和重置命令执行的操作员/会话控制，因此智能体
可以报告达成或真正的阻塞，而不会悄悄移动
目标。

`update_goal` 只有在目标实际达成时才应将目标标记为
`complete`。它只有在同一个阻塞条件连续至少三个目标轮次重复出现后，
才应将目标标记为 `blocked`，而不是因为普通困难或缺少打磨。

## 每个轮次的目标上下文

每个带有活跃目标的用户/聊天轮次都会包含这行用户角色上下文：

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw 会通过截断较长目标来保持该行紧凑。已暂停、
已阻塞、受预算限制、受用量限制和已完成的目标不会被注入，
因此操作员停止会一直生效，直到目标被恢复。

## Control UI

Web Control UI 会在聊天输入框上方以紧凑胶囊形式显示目标：
状态图标、状态标签（例如 `Pursuing goal`）、截断后的
目标内容，以及实时经过时间计时器。

胶囊带有内联控件：

- **铅笔**会用 `/goal edit <objective>` 预填输入框，以便
  重新表述目标并提交。
- **暂停 / 恢复**会根据当前状态在 `/goal pause` 和 `/goal resume` 之间切换。
- **垃圾桶**会发送 `/goal clear`。
- **折叠箭头**会展开胶囊，以显示完整目标、最新状态
  备注、token 用量和经过时间。

当输入框无法发送时（例如 Gateway 网关连接断开），操作按钮会隐藏；
展开折叠箭头仍可工作。

## TUI

TUI 页脚会将活跃会话的目标显示在智能体、
会话和模型字段旁边，位于 token/模式指示器之前。

页脚示例：

- `Pursuing goal (12k/50k)` 表示带有 token 预算的活跃目标。
- `Goal paused (/goal resume)` 表示已暂停的目标。
- `Goal blocked (/goal resume)` 表示已阻塞的目标。
- `Goal hit usage limits (/goal resume)` 表示受用量限制的目标。
- `Goal unmet (50k/50k)` 表示受预算限制的目标。
- `Goal achieved (42k)` 表示已完成的目标。

页脚有意保持紧凑。使用 `/goal` 查看完整目标、
备注、token 预算和可用命令。

## 渠道行为

`/goal` 可在支持命令的 OpenClaw 会话中使用，包括 TUI 和
允许文本命令的聊天表面。目标状态附加到
会话键，而不是传输协议，因此共享同一会话键的两个表面会看到
相同目标。

目标状态不是投递指令：它不会强制通过某个
渠道回复、改变队列行为、批准工具或安排工作。

## 故障排查

| 消息                                   | 含义                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | 会话已有目标。使用 `/goal` 检查它；如果已完成，使用 `/goal complete`；或在启动不同目标之前使用 `/goal clear`。                              |
| `Goal error: goal not found`           | 会话还没有目标。使用 `/goal start <objective>` 启动一个。                                                                                   |
| `Goal error: goal is already complete` | 该目标是终态。在启动或恢复另一个目标之前先清除它。                                                                                          |

如果 token 用量显示为 `0` 或看起来过期，活跃会话可能还没有
新鲜的 token 快照。当 OpenClaw 记录会话用量
和从转录推导出的总量时，用量会刷新。

## 相关

- [Slash commands](/zh-CN/tools/slash-commands)
- [TUI](/zh-CN/web/tui)
- [Session tool](/zh-CN/concepts/session-tool)
- [Compaction](/zh-CN/concepts/compaction)
- [Task Flow](/zh-CN/automation/taskflow)
- [Standing orders](/zh-CN/automation/standing-orders)

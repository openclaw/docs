---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在长会话中始终保持一个目标可见
    - 你需要暂停、恢复、阻止、完成或清除会话目标
    - 你想了解 `get_goal`、`create_goal` 和 `update_goal` 工具
    - 你想查看目标在 TUI 中如何显示
summary: 会话目标：持久的每会话目标、/goal 控制、模型目标工具、token 预算和 TUI 状态
title: 目标
x-i18n:
    generated_at: "2026-07-05T11:44:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff943a751c75213124c85fefbb3f3bca4469841793873983adbc1cec6fcd629
    source_path: tools/goal.md
    workflow: 16
---

# 目标

**目标**是附加到当前 OpenClaw 会话的一个持久目标。
它为智能体和操作员提供一个用于长期工作的共享目标，
而不会把该目标变成后台任务、提醒、cron 作业或
常驻指令。

目标是会话状态：它们会随会话键移动，在进程
重启后保留，并显示在 `/goal`、面向模型的目标工具和 TUI
页脚中。

## 快速开始

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` 是可选的：`/goal get CI green for PR 87469` 也会创建一个目标，
因为 `/goal` 后面任何不是已知动作词的文本都会被当作
新的目标。

## 目标的用途

当会话有一个应在多个轮次中保持可见的具体结果时，使用目标：

- PR 收尾：修复、验证、autoreview、推送，并打开或更新 PR。
- 调试运行：复现 bug，识别归属的表面，打补丁，并
  证明修复。
- 文档处理：阅读相关文档，编写新页面，交叉链接，并
  验证文档构建。
- 维护任务：检查当前状态，做有边界的更改，运行
  正确检查，并报告变更内容。

目标不是任务队列。当工作应脱离会话运行、
按计划重复、展开为托管的子工作，或作为策略持久存在时，请使用 [Task Flow](/zh-CN/automation/taskflow)、
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

Commands: /goal pause, /goal complete, /goal clear
```

| 命令                                                | 效果                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` 或 `/goal status`                           | 显示当前目标。                                                           |
| `/goal start <objective>`                           | 为当前会话创建新目标。                                                   |
| `/goal set <objective>`、`/goal create <objective>` | `start` 的别名。                                                         |
| `/goal <objective>`                                 | 也会创建新目标（任何未被识别为动作词的文本）。                           |
| `/goal pause [note]`                                | 暂停活跃目标。                                                           |
| `/goal resume [note]`                               | 恢复已暂停、受阻、受用量限制或受预算限制的目标。                         |
| `/goal complete [note]`                             | 将目标标记为已达成。                                                     |
| `/goal done [note]`                                 | `complete` 的别名。                                                      |
| `/goal block [note]`                                | 将目标标记为受阻。                                                       |
| `/goal blocked [note]`                              | `block` 的别名。                                                         |
| `/goal clear`                                       | 从会话中移除目标。                                                       |

一个会话一次只能存在一个目标。在当前目标被清除之前，启动第二个目标会失败，
并显示 `Goal error: goal already exists`。

`/goal start` 不接受 token 预算标志；预算只能通过
面向模型的 `create_goal` 工具设置。

## 状态

- `active`：会话正在推进目标。
- `paused`：操作员暂停了目标；`/goal resume` 会让它重新变为活跃状态。
- `blocked`：智能体或操作员报告了真实阻塞；当有新信息或新状态可用时，`/goal resume`
  会让它重新变为活跃状态。
- `budget_limited`：已达到配置的 token 预算；`/goal resume`
  会从同一目标重新开始推进，并使用新的预算窗口。
- `usage_limited`：为未来的用量限制停止状态预留；`/goal
resume` 会以相同方式重新开始推进。
- `complete`：目标已达成。已完成的目标是终态；在启动另一个目标之前请使用 `/goal
clear`。

`/new` 和 `/reset` 会清除当前会话目标，因为它们有意
启动全新的会话上下文。

## Token 预算

目标可以有可选的正 token 预算，通过
`create_goal` 工具的 `token_budget` 参数设置。预算从目标创建时
会话的新鲜 token 计数开始衡量。如果目标启动时会话只有
陈旧或未知的 token 快照，OpenClaw 会等待下一个
新鲜快照并将其用作基线，因此目标存在之前消耗的 token
不会计入该目标。

当用量达到预算时，目标会转为 `budget_limited`。这不会
删除目标或抹除目标内容；它会告诉操作员和
智能体，在目标被恢复或清除之前，该目标不再被主动推进。
恢复会从当前新鲜 token 计数开始一个新的预算窗口。

Token 预算是会话目标护栏，不是计费上限。提供商
配额、成本报告和上下文窗口行为仍使用正常的
OpenClaw 用量和模型控制。

## 模型工具

OpenClaw 向智能体 harness 暴露三个目标工具：

| 工具          | 用途                                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | 读取当前会话目标：状态、目标内容、token 用量和 token 预算。                                                             |
| `create_goal` | 仅当用户或系统指令明确请求时创建目标。如果会话已有目标则失败。                                                         |
| `update_goal` | 将目标标记为 `complete` 或 `blocked`。                                                                                   |

模型不能静默暂停、恢复、清除或替换目标。这些仍是
通过 `/goal` 和重置命令进行的操作员/会话控制，因此智能体
可以报告目标达成或真实阻塞，而不会悄悄移动
目标。

`update_goal` 只有在目标实际达成时才应将目标标记为 `complete`。
只有在同一个阻塞条件连续至少三个目标轮次重复出现后，
才应将目标标记为 `blocked`，而不是因为普通困难或缺少润色。

## TUI

TUI 页脚会在 token/模式指示器之前，将活跃会话的目标显示在智能体、
会话和模型字段旁边。

页脚示例：

- `Pursuing goal (12k/50k)` 表示带 token 预算的活跃目标。
- `Goal paused (/goal resume)` 表示已暂停目标。
- `Goal blocked (/goal resume)` 表示受阻目标。
- `Goal hit usage limits (/goal resume)` 表示受用量限制的目标。
- `Goal unmet (50k/50k)` 表示受预算限制的目标。
- `Goal achieved (42k)` 表示已完成目标。

页脚有意保持紧凑。使用 `/goal` 查看完整目标、
备注、token 预算和可用命令。

## 渠道行为

`/goal` 可在支持命令的 OpenClaw 会话中使用，包括 TUI 和
允许文本命令的聊天表面。目标状态附加到
会话键，而不是传输协议，因此共享同一会话键的两个表面会看到
同一个目标。

目标状态不是投递指令：它不会强制通过某个
渠道回复、改变队列行为、批准工具或安排工作。

## 故障排查

| 消息                                   | 含义                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | 会话已有目标。使用 `/goal` 检查它；如果已完成则使用 `/goal complete`；或在启动另一个目标前使用 `/goal clear`。                               |
| `Goal error: goal not found`           | 会话还没有目标。使用 `/goal start <objective>` 启动一个目标。                                                                                |
| `Goal error: goal is already complete` | 目标处于终态。在启动或恢复另一个目标之前先清除它。                                                                                           |

如果 token 用量显示为 `0` 或看起来陈旧，活跃会话可能还没有
新鲜的 token 快照。随着 OpenClaw 记录会话用量
和从转录推导出的总量，用量会刷新。

## 相关内容

- [斜杠命令](/zh-CN/tools/slash-commands)
- [TUI](/zh-CN/web/tui)
- [会话工具](/zh-CN/concepts/session-tool)
- [压缩](/zh-CN/concepts/compaction)
- [Task Flow](/zh-CN/automation/taskflow)
- [常驻指令](/zh-CN/automation/standing-orders)

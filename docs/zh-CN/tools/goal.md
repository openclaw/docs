---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在长时间会话中始终保持一个目标清晰可见
    - 你需要暂停、恢复、阻塞、完成或清除会话目标
    - 你想了解 `get_goal`、`create_goal` 和 `update_goal` 工具
    - 你想查看目标在 TUI 中如何显示
summary: 会话目标：持久化的每会话目标、`/goal` 控件、模型目标工具、令牌预算和 TUI 状态
title: 目标
x-i18n:
    generated_at: "2026-07-11T21:01:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# 目标

**目标**是附加到当前 OpenClaw 会话的一个持久目标。
它为智能体和操作员提供一个长期工作的共同目标，而不会将该目标转变为后台任务、提醒、cron 作业或常设指令。

目标属于会话状态：它们随会话键转移，在进程重启后仍然保留，并显示在 `/goal`、面向模型的目标工具和 TUI 页脚中。

## 快速开始

```text
/goal start 让 PR 87469 的 CI 通过并推送修复
/goal
/goal edit 让 PR 87469 的 CI 通过、推送修复并更新文档
/goal pause 等待 CI
/goal resume
/goal complete 已推送并验证
/goal clear
```

`start` 是可选的：`/goal 让 PR 87469 的 CI 通过` 也会创建目标，因为 `/goal` 后面任何不是已知操作词的文本都会被视为新目标。

## 目标的用途

当会话有一个应在多轮交互中始终可见的具体成果时，可以使用目标：

- PR 收尾：修复、验证、自动审查、推送，以及创建或更新 PR。
- 调试过程：复现错误、确定所属功能面、打补丁并证明修复有效。
- 文档完善：阅读相关文档、编写新页面、添加交叉链接并验证文档构建。
- 维护任务：检查当前状态、进行有边界的更改、运行正确的检查并报告变更内容。

目标不是任务队列。当工作需要脱离会话运行、按计划重复、拆分为受管理的子工作或作为策略持久保留时，请使用 [Task Flow](/zh-CN/automation/taskflow)、[任务](/zh-CN/automation/tasks)、[cron 作业](/zh-CN/automation/cron-jobs)或[常设指令](/zh-CN/automation/standing-orders)。

## 命令参考

不带参数的 `/goal` 会输出当前目标摘要：

```text
目标
状态：进行中
目标内容：让 PR 87469 的 CI 通过并推送修复
已用 Token：12k
Token 预算：12k/50k

命令：/goal edit <目标内容>、/goal pause、/goal complete、/goal clear
```

| 命令                                                | 效果                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `/goal` 或 `/goal status`                           | 显示当前目标。                                                     |
| `/goal start <objective>`                           | 为当前会话创建新目标。                                             |
| `/goal set <objective>`、`/goal create <objective>` | `start` 的别名。                                                   |
| `/goal <objective>`                                 | 也会创建新目标（任何不是已识别操作词的文本）。                     |
| `/goal edit <objective>`                            | 改写当前目标内容；状态和 Token 统计保持不变。                       |
| `/goal pause [note]`                                | 暂停进行中的目标。                                                 |
| `/goal resume [note]`                               | 恢复已暂停、受阻、受用量限制或受预算限制的目标。                   |
| `/goal complete [note]`                             | 将目标标记为已达成。                                               |
| `/goal done [note]`                                 | `complete` 的别名。                                                |
| `/goal block [note]`                                | 将目标标记为受阻。                                                 |
| `/goal blocked [note]`                              | `block` 的别名。                                                   |
| `/goal clear`                                       | 从会话中移除目标。                                                 |

一个会话同时只能存在一个目标。在清除当前目标之前，启动第二个目标会失败并显示 `Goal error: goal already exists`。

`/goal start` 不接受 Token 预算标志；预算只能通过面向模型的 `create_goal` 工具设置。

## 状态

- `active`：会话正在推进目标。
- `paused`：操作员暂停了目标；`/goal resume` 会将其重新设为进行中。
- `blocked`：智能体或操作员报告了实际阻碍；当有新的信息或状态可用时，`/goal resume` 会将其重新设为进行中。
- `budget_limited`：已达到配置的 Token 预算；`/goal resume` 会从同一目标内容开始，并使用新的预算窗口重新推进。
- `usage_limited`：为未来的用量限制停止状态预留；`/goal resume` 会以相同方式重新推进。
- `complete`：目标已达成。已完成的目标是终止状态；开始另一个目标前请使用 `/goal clear`。

`/new` 和 `/reset` 会清除当前会话目标，因为它们有意启动全新的会话上下文。

## Token 预算

目标可以具有可选的正数 Token 预算，通过 `create_goal` 工具的 `token_budget` 参数设置。预算从创建目标时会话的最新 Token 计数开始计算。如果目标启动时会话只有过期或未知的 Token 快照，OpenClaw 会等待下一个最新快照并将其用作基线，因此目标创建之前消耗的 Token 不会计入该目标。

当用量达到预算时，目标会转为 `budget_limited`。这不会删除目标或清除目标内容；它会告知操作员和智能体，在恢复或清除目标之前，系统不再主动推进该目标。恢复目标会以当前最新的 Token 计数开启新的预算窗口。

Token 预算是会话目标的防护栏，而不是计费上限。提供商配额、成本报告和上下文窗口行为仍使用 OpenClaw 的常规用量和模型控制。

## 模型工具

OpenClaw 向 Agent harness 公开三个目标工具：

| 工具          | 用途                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `get_goal`    | 读取当前会话目标：状态、目标内容、Token 用量和 Token 预算。                                          |
| `create_goal` | 仅当用户或系统指令明确要求时创建目标。如果会话已有目标，则会失败。                                   |
| `update_goal` | 将目标标记为 `complete` 或 `blocked`。                                                               |

模型不能静默暂停、恢复、清除或替换目标。这些操作仍由操作员通过 `/goal` 和重置命令进行会话控制，因此智能体可以报告目标达成或真实阻碍，而不会悄悄改变目标。

仅当目标实际达成时，`update_goal` 才应将目标标记为 `complete`。仅当同一阻碍条件在至少连续三个目标轮次中重复出现时，才应将目标标记为 `blocked`，而不应因普通困难或尚未完善而标记。

## 每轮交互中的目标上下文

每次具有进行中目标的用户/聊天轮次都会包含以下用户角色上下文行：

```text
进行中的目标：<目标内容> — 推进该目标或更新其状态（get_goal/update_goal）。
```

OpenClaw 会截断过长的目标内容，以保持该行紧凑。已暂停、受阻、受预算限制、受用量限制和已完成的目标不会被注入，因此操作员的停止操作会一直生效，直到目标恢复。

## Control UI

Web Control UI 会在聊天输入框上方将目标显示为紧凑的胶囊：包括状态图标、状态标签（例如 `正在推进目标`）、截断后的目标内容以及实时经过时间计时器。

胶囊带有行内控件：

- **铅笔**会在输入框中预填 `/goal edit <objective>`，以便改写并提交目标内容。
- **暂停/恢复**会根据当前状态在 `/goal pause` 和 `/goal resume` 之间切换。
- **垃圾桶**会发送 `/goal clear`。
- **V 形箭头**会展开胶囊，以显示完整目标内容、最新状态备注、Token 用量和经过时间。

当输入框无法发送消息时（例如 Gateway 网关连接中断），操作按钮会隐藏；展开用的 V 形箭头仍然可用。

## TUI

TUI 页脚会将当前会话的目标显示在智能体、会话和模型字段旁边，并位于 Token/模式指示器之前。

页脚示例：

- 对于具有 Token 预算的进行中目标，显示 `正在推进目标 (12k/50k)`。
- 对于已暂停目标，显示 `目标已暂停 (/goal resume)`。
- 对于受阻目标，显示 `目标受阻 (/goal resume)`。
- 对于受用量限制目标，显示 `目标已达到用量限制 (/goal resume)`。
- 对于受预算限制目标，显示 `目标未达成 (50k/50k)`。
- 对于已完成目标，显示 `目标已达成 (42k)`。

页脚有意保持紧凑。使用 `/goal` 查看完整目标内容、备注、Token 预算和可用命令。

## 渠道行为

`/goal` 可在支持命令的 OpenClaw 会话中使用，包括 TUI 和允许文本命令的聊天界面。目标状态附加到会话键而不是传输方式，因此共享同一会话键的两个界面会看到相同目标。

目标状态不是传递指令：它不会强制通过某个渠道回复、改变队列行为、批准工具或调度工作。

## 故障排查

| 消息                                   | 含义                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | 会话已有目标。使用 `/goal` 检查目标；如果已完成，使用 `/goal complete`；或者在开始其他目标前使用 `/goal clear`。          |
| `Goal error: goal not found`           | 会话尚无目标。使用 `/goal start <objective>` 启动一个目标。                                                               |
| `Goal error: goal is already complete` | 目标处于终止状态。在启动或恢复其他目标前将其清除。                                                                        |

如果 Token 用量显示 `0` 或看起来已过期，当前会话可能尚无最新 Token 快照。当 OpenClaw 记录会话用量和从对话记录推导的总量时，用量会刷新。

## 相关内容

- [斜杠命令](/zh-CN/tools/slash-commands)
- [TUI](/zh-CN/web/tui)
- [会话工具](/zh-CN/concepts/session-tool)
- [压缩](/zh-CN/concepts/compaction)
- [Task Flow](/zh-CN/automation/taskflow)
- [常设指令](/zh-CN/automation/standing-orders)

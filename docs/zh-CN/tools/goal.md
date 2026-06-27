---
doc-schema-version: 1
read_when:
    - 你希望 OpenClaw 在长会话中始终保持一个目标可见
    - 你需要暂停、恢复、阻塞、完成或清除会话目标
    - 你想了解 `get_goal`、`create_goal` 和 `update_goal` 工具
    - 你想查看目标在 TUI 中如何显示
summary: 会话目标：持久的每会话目标、/goal 控制、模型目标工具、token 预算和 TUI 状态
title: 目标
x-i18n:
    generated_at: "2026-06-27T03:28:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# 目标

**目标**是附加到当前 OpenClaw 会话的一个持久目标。
它为智能体和操作者提供一个用于长时间工作的共同目标，
但不会把该目标变成后台任务、提醒、cron 作业或
长期指令。

目标是会话状态。它们会随会话键移动，在进程重启后保留，
显示在 `/goal` 中，可通过目标工具提供给模型，
并且当活动会话存在目标时显示在 TUI 页脚中。

## 快速开始

设置目标：

```text
/goal start get CI green for PR 87469 and push the fix
```

检查目标：

```text
/goal
```

当工作有意等待时暂停目标：

```text
/goal pause waiting for CI
```

恢复目标：

```text
/goal resume
```

标记为完成：

```text
/goal complete pushed and verified
```

清除目标：

```text
/goal clear
```

## 目标适用场景

当一个会话有需要跨多个轮次保持可见的具体结果时，使用目标：

- PR 收尾：修复、验证、autoreview、推送，并打开或更新 PR。
- 调试运行：复现 bug、识别所属表面、打补丁，并证明修复有效。
- 文档处理：阅读相关文档、编写新页面、添加交叉链接，并验证文档构建。
- 维护任务：检查当前状态、做有边界的变更、运行合适的检查，并报告变更内容。

目标不是任务队列。当工作需要脱离运行、按计划重复、展开为受管理的子工作，
或作为策略持久存在时，请使用[任务流](/zh-CN/automation/taskflow)、
[任务](/zh-CN/automation/tasks)、[cron 作业](/zh-CN/automation/cron-jobs)或
[长期指令](/zh-CN/automation/standing-orders)。

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

命令：

- `/goal` 或 `/goal status` 显示当前目标。
- `/goal start <objective>` 为当前会话创建新目标。
- `/goal set <objective>` 和 `/goal create <objective>` 是 `start` 的别名。
- `/goal pause [note]` 暂停活动目标。
- `/goal resume [note]` 恢复已暂停、已阻塞、受用量限制或受预算限制的目标。
- `/goal complete [note]` 将目标标记为已达成。
- `/goal done [note]` 是 `complete` 的别名。
- `/goal block [note]` 将目标标记为已阻塞。
- `/goal blocked [note]` 是 `block` 的别名。
- `/goal clear` 从会话中移除目标。

一个会话同一时间只能存在一个目标。在清除当前目标之前，启动第二个目标会失败。

## 状态

目标使用一组较小的状态：

- `active`：会话正在追求该目标。
- `paused`：操作者暂停了目标；`/goal resume` 会让它重新变为活动状态。
- `blocked`：智能体或操作者报告了真实阻塞；当有新信息或新状态可用时，`/goal resume` 会让它重新变为活动状态。
- `budget_limited`：已达到配置的 token 预算；`/goal resume` 会从同一目标重新开始追求。
- `usage_limited`：为用量限制停止状态预留；允许时，`/goal resume` 会重新开始追求。
- `complete`：目标已达成。完成的目标是终止状态；在启动另一个目标前使用 `/goal clear`。

`/new` 和 `/reset` 会清除当前会话目标，因为它们会有意启动全新的会话上下文。

## Token 预算

目标可以有一个可选的正数 token 预算。该预算随目标一起存储，并从目标创建时会话的新鲜 token 计数开始计量。如果目标启动时当前会话只有过期或未知的 token 用量，OpenClaw 会等待下一次新鲜的会话 token 快照，并将其用作基线，因此目标存在之前消耗的 token 不会计入该目标。

当 token 用量达到预算时，目标会变为 `budget_limited`。这不会删除目标或抹除目标内容。它会告诉操作者和智能体，在恢复或清除之前，该目标不再被主动追求。

Token 预算是会话目标护栏，不是计费上限。提供商配额、成本报告和上下文窗口行为仍使用正常的 OpenClaw 用量与模型控制。

## 模型工具

OpenClaw 向智能体 harness 暴露三个核心目标工具：

- `get_goal`：读取当前会话目标，包括状态、目标内容、token 用量和 token 预算。
- `create_goal`：仅在用户、系统或开发者指令明确请求时创建目标。如果会话已有目标，它会失败。
- `update_goal`：将目标标记为 `complete` 或 `blocked`。

模型不能静默暂停、恢复、清除或替换目标。这些是通过 `/goal` 和重置命令实现的操作者/会话控制。这样既能防止智能体悄悄移动目标，也保留一条干净路径，让智能体报告目标已达成或存在真正阻塞。

`update_goal` 工具只有在目标实际达成时才应将目标标记为 `complete`。只有当同一阻塞条件已经重复出现，且没有新的用户输入或外部状态变化时智能体无法取得有意义进展，才应将目标标记为 `blocked`。

## TUI

TUI 会在页脚中让活动会话的目标保持可见，位置靠近智能体、会话、模型、运行控制和 token 计数。

页脚示例：

- `Pursuing goal (12k/50k)` 表示带有 token 预算的活动目标。
- `Goal paused (/goal resume)` 表示已暂停的目标。
- `Goal blocked (/goal resume)` 表示已阻塞的目标。
- `Goal hit usage limits (/goal resume)` 表示受用量限制的目标。
- `Goal unmet (50k/50k)` 表示受预算限制的目标。
- `Goal achieved (42k)` 表示已完成的目标。

页脚有意保持紧凑。使用 `/goal` 查看完整目标、备注、token 预算和可用命令。

## 渠道行为

`/goal` 命令可在支持命令的 OpenClaw 会话中使用，包括 TUI 和允许文本命令的聊天表面。目标状态附加到会话键，而不是传输层。如果两个表面使用同一个会话，它们会看到同一个目标。

目标状态不是投递指令。它不会强制通过某个渠道回复、改变队列行为、批准工具或调度工作。

## 故障排除

`Goal error: goal already exists` 表示该会话已经有一个目标。使用 `/goal` 检查它；如果它已完成，使用 `/goal complete`；或者在启动另一个目标前使用 `/goal clear`。

`Goal error: goal not found` 表示该会话还没有目标。使用 `/goal start <objective>` 启动一个目标。

`Goal error: goal is already complete` 表示该目标是终止状态。请先清除它，再启动或恢复另一个目标。

如果 token 用量看起来像 `0` 或已过期，活动会话可能还没有新鲜的 token 快照。随着 OpenClaw 记录会话用量和从转录推导出的总量，用量会刷新。

## 相关

- [斜杠命令](/zh-CN/tools/slash-commands)
- [TUI](/zh-CN/web/tui)
- [会话工具](/zh-CN/concepts/session-tool)
- [压缩](/zh-CN/concepts/compaction)
- [任务流](/zh-CN/automation/taskflow)
- [长期指令](/zh-CN/automation/standing-orders)

---
read_when:
    - 调试智能体为何以某种方式回答、失败或调用工具
    - 导出 OpenClaw 会话的支持包
    - 调查提示词上下文、工具调用、运行时错误或用量元数据
    - 禁用或重新定位轨迹捕获
summary: 导出已脱敏的轨迹包，用于调试 OpenClaw 智能体会话
title: 轨迹包
x-i18n:
    generated_at: "2026-04-28T22:45:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

轨迹捕获是 OpenClaw 的按会话飞行记录器。它会为每次智能体运行记录一条结构化时间线，然后 `/export-trajectory` 会将当前会话打包成经过脱敏的支持包。

当你需要回答这类问题时使用它：

- 发送给模型的提示词、系统提示词和工具是什么？
- 哪些转录消息和工具调用导致了这个回答？
- 这次运行是否超时、中止、压缩，或遇到了提供商错误？
- 哪个模型、插件、Skills 和运行时设置处于启用状态？
- 提供商返回了哪些用量和提示词缓存元数据？

如果你要为实时 Gateway 网关问题提交范围较广的支持报告，请先使用 [`/diagnostics`](/zh-CN/gateway/diagnostics#chat-command)。诊断会收集经过清理的 Gateway 网关包，并且对于 OpenAI Codex harness 会话，还可以在获得批准后将 Codex 反馈发送到 OpenAI 服务器。当你明确需要详细的按会话提示词、工具和转录时间线时，请使用 `/export-trajectory`。

## 快速开始

在活动会话中发送：

```text
/export-trajectory
```

别名：

```text
/trajectory
```

OpenClaw 会将包写入工作区下：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

你可以选择一个相对输出目录名：

```text
/export-trajectory bug-1234
```

自定义路径会在 `.openclaw/trajectory-exports/` 内解析。绝对路径和 `~` 路径会被拒绝。

轨迹包可能包含提示词、模型消息、工具 schema、工具结果、运行时事件和本地路径。因此，聊天斜杠命令每次都会通过 exec 审批。当你确实要创建包时，只批准这一次导出；不要使用 allow-all。在群聊中，OpenClaw 会将审批提示和导出结果私下发送给所有者，而不是把轨迹详情发回共享房间。

对于本地检查或支持工作流，你也可以直接运行已批准的命令路径：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## 访问权限

轨迹导出是所有者命令。发送者必须通过该渠道的常规命令授权检查和所有者检查。

## 会记录什么

对于 OpenClaw 智能体运行，轨迹捕获默认开启。

运行时事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括源模型、下一个模型、失败原因/详情、链位置，以及回退是否推进、成功或耗尽链
- `model.completed`
- `trace.artifacts`
- `session.ended`

转录事件也会从活动会话分支重建：

- 用户消息
- 助手消息
- 工具调用
- 工具结果
- 压缩
- 模型变更
- 标签和自定义会话条目

事件会以 JSON Lines 写入，并带有这个 schema 标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 包文件

导出的包可能包含：

| 文件                  | 内容                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 包 schema、源文件、事件计数和生成的文件列表                             |
| `events.jsonl`        | 有序的运行时和转录时间线                                                        |
| `session-branch.json` | 经过脱敏的活动转录分支和会话头                                           |
| `metadata.json`       | OpenClaw 版本、操作系统/运行时、模型、配置快照、插件、Skills 和提示词元数据     |
| `artifacts.json`      | 最终 Status、错误、用量、提示词缓存、压缩次数、助手文本和工具元数据 |
| `prompts.json`        | 已提交的提示词和所选的提示词构建详情                                         |
| `system-prompt.txt`   | 捕获到的最新已编译系统提示词                                                   |
| `tools.json`          | 捕获到的发送给模型的工具定义                                              |

`manifest.json` 会列出该包中存在的文件。当会话没有捕获对应的运行时数据时，某些文件会被省略。

## 捕获位置

默认情况下，运行时轨迹事件会写在会话文件旁边：

```text
<session>.trajectory.jsonl
```

OpenClaw 还会在会话旁边写入一个尽力而为的指针文件：

```text
<session>.trajectory-path.json
```

设置 `OPENCLAW_TRAJECTORY_DIR`，可将运行时轨迹 sidecar 存储到专用目录中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

设置此变量后，OpenClaw 会在该目录中为每个会话 id 写入一个 JSONL 文件。

当所属的会话条目被修剪、受上限限制或因会话磁盘预算而被逐出时，会话维护会移除轨迹 sidecar。会话目录之外的运行时文件只有在指针目标仍能证明其属于该会话时才会被移除。

## 禁用捕获

在启动 OpenClaw 前设置 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

这会禁用运行时轨迹捕获。`/export-trajectory` 仍然可以导出转录分支，但可能缺少仅运行时文件，例如已编译上下文、提供商产物和提示词元数据。

## 隐私和限制

轨迹包用于支持和调试，不适合公开发布。OpenClaw 会在写入导出文件前脱敏敏感值：

- 凭证和已知类似密钥的载荷字段
- 图像数据
- 本地状态路径
- 工作区路径，替换为 `$WORKSPACE_DIR`
- 检测到的主目录路径

导出器还会限制输入大小：

- 运行时 sidecar 文件：50 MiB
- 会话文件：50 MiB
- 运行时事件：200,000
- 导出的事件总数：250,000
- 单条运行时事件行超过 256 KiB 时会被截断

在团队外共享包之前，请先审查包。脱敏是尽力而为的，无法知道每个应用特定的密钥。

## 故障排除

如果导出没有运行时事件：

- 确认 OpenClaw 启动时没有设置 `OPENCLAW_TRAJECTORY=0`
- 检查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可写目录
- 在会话中再运行一条消息，然后重新导出
- 检查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用像 `bug-1234` 这样的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 将导出保留在 `.openclaw/trajectory-exports/` 内

如果导出因大小错误而失败，说明会话或 sidecar 超出了导出安全限制。请启动新会话，或导出一个更小的复现。

## 相关

- [Diffs](/zh-CN/tools/diffs)
- [会话管理](/zh-CN/concepts/session)
- [Exec 工具](/zh-CN/tools/exec)

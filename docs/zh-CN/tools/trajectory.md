---
read_when:
    - 调试智能体为何以某种方式回答、失败或调用工具
    - 导出 OpenClaw 会话的支持包
    - 调查提示上下文、工具调用、运行时错误或用量元数据
    - 禁用或重新定位轨迹捕获
summary: 导出已脱敏的轨迹包，用于调试 OpenClaw 智能体会话
title: 轨迹包
x-i18n:
    generated_at: "2026-07-05T11:49:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08cd5d28c203d5b50212be917507fe9b5a1f5eefd31d6a84dbdc9dfd8d9ed0e1
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory 捕获是 OpenClaw 的按会话飞行记录器。它会为每次智能体运行记录结构化时间线，然后 `/export-trajectory` 会将当前会话打包成经过脱敏的支持包，覆盖：

- 发送给模型的提示词、系统提示词和工具
- 哪些转录消息和工具调用导向了某个回答
- 运行是否超时、中止、压缩，或遇到提供商错误
- 哪个模型、插件、Skills 和运行时设置处于活动状态
- 提供商返回的用量和提示缓存元数据

如需宽泛的 Gateway 网关支持报告，请改用
[`/diagnostics`](/zh-CN/gateway/diagnostics#chat-command) 开始；它会收集经过清理的 Gateway 网关包，并且对于 OpenAI Codex harness 会话，可在批准后将 Codex 反馈发送给 OpenAI。当你需要详细的按会话提示词、工具和转录时间线时，请使用 `/export-trajectory`。

## 快速开始

在活动会话中发送（别名 `/trajectory`）：

```text
/export-trajectory
```

OpenClaw 会将包写入工作区下：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

传入相对输出目录名可覆盖默认位置：

```text
/export-trajectory bug-1234
```

该名称会在 `.openclaw/trajectory-exports/` 内解析。绝对路径和
`~` 路径会被拒绝。

Trajectory 包可能包含提示词、模型消息、工具 schema、工具结果、运行时事件和本地路径，因此聊天命令始终会经过 Exec 审批。当你确实打算创建该包时，批准一次导出；不要使用全部允许。在群聊中，OpenClaw 会将审批提示和导出结果私下发送给所有者，而不是把 Trajectory 详情发回共享房间。

对于本地检查或支持工作流，请直接运行底层 CLI 命令：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

其他标志：`--output <path>`（`.openclaw/trajectory-exports` 内的目录名）、`--store <path>`（会话存储覆盖）、`--agent <id>`（用于存储解析的智能体 ID）、`--json`（结构化输出）。

## 访问

Trajectory 导出是所有者命令。发送者必须通过常规命令授权检查，以及该渠道的所有者检查。

## 会记录什么

默认情况下，OpenClaw 智能体运行会启用 Trajectory 捕获。

运行时事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括源模型、下一个模型、失败原因/详情、链位置，以及链是否推进、成功或耗尽
- `model.completed`
- `trace.artifacts`
- `session.ended`

转录事件会从活动会话分支重建：用户消息、助手消息、工具调用、工具结果、压缩、模型变更、标签和自定义会话条目。

事件会以 JSON Lines 写入，并带有此 schema 标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 包文件

| 文件                  | 内容                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 包 schema、源文件、事件计数和生成的文件列表                             |
| `events.jsonl`        | 有序的运行时和转录时间线                                                        |
| `session-branch.json` | 脱敏后的活动转录分支和会话头                                           |
| `metadata.json`       | OpenClaw 版本、OS/运行时、模型、配置快照、插件、Skills 和提示词元数据     |
| `artifacts.json`      | 最终状态、错误、用量、提示缓存、压缩计数、助手文本和工具元数据 |
| `prompts.json`        | 已提交的提示词和选定的提示词构建详情                                         |
| `system-prompt.txt`   | 捕获到的最新已编译系统提示词                                                   |
| `tools.json`          | 捕获到的发送给模型的工具定义                                              |

`manifest.json` 会列出给定包中存在的文件；如果会话未捕获对应的运行时数据，某些文件会被省略。

## 捕获位置

默认情况下，运行时 Trajectory 事件会写在会话文件旁边：

```text
<session>.trajectory.jsonl
```

OpenClaw 还会在会话旁边写入一个尽力而为的指针文件：

```text
<session>.trajectory-path.json
```

设置 `OPENCLAW_TRAJECTORY_DIR` 可将运行时 Trajectory sidecar 存储到专用目录中，每个会话 ID 对应一个 JSONL 文件：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

当拥有它们的会话条目被会话磁盘预算修剪、封顶或逐出时，会话维护会移除 Trajectory sidecar。位于会话目录之外的运行时文件只会在指针目标仍能证明它属于该会话时才会被移除。

## 禁用捕获

```bash
export OPENCLAW_TRAJECTORY=0
```

这会在启动 OpenClaw 前禁用运行时 Trajectory 捕获。
`/export-trajectory` 仍然可以导出转录分支，但可能缺少仅运行时文件，例如已编译上下文、提供商工件和提示词元数据。

## 调整刷新超时

OpenClaw 会在智能体清理期间刷新运行时 Trajectory sidecar。默认清理超时为 10,000 ms。在慢速磁盘或大型存储上，请在启动 OpenClaw 前设置
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`：

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

这会控制 OpenClaw 何时记录 `openclaw-trajectory-flush` 超时并继续；它不会更改 Trajectory 大小上限。要调整所有未传入显式超时的智能体清理步骤，请设置
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`。

## 隐私和限制

Trajectory 包用于支持和调试，不适合公开发布。OpenClaw 会在写入导出文件前脱敏敏感值：

- 凭证和已知类似密钥的载荷字段
- 图像数据
- 本地状态路径
- 工作区路径，替换为 `$WORKSPACE_DIR`
- 检测到的主目录路径

导出器还会限制输入大小：

- 运行时 sidecar 文件：实时捕获文件是一个滚动窗口，上限为 10 MiB，会丢弃最旧事件以为新事件腾出空间；导出接受最大 50 MiB 的现有运行时 sidecar 文件
- 会话文件：50 MiB
- 每次导出的运行时事件：200,000
- 导出的事件总数：250,000
- 单条运行时事件行超过 256 KiB 时会被截断

在与你的团队外部共享包之前，请先审查包内容。脱敏是尽力而为的，无法知晓每个应用特定的密钥。

## 故障排查

如果导出中没有运行时事件：

- 确认启动 OpenClaw 时未设置 `OPENCLAW_TRAJECTORY=0`
- 检查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可写目录
- 在会话中再运行一条消息，然后重新导出
- 检查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用类似 `bug-1234` 的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 将导出保留在 `.openclaw/trajectory-exports/` 内

如果导出因大小错误失败，则表示会话或 sidecar 超过了上述导出安全限制。请开始一个新会话，或导出更小的复现。

## 相关

- [Diffs](/zh-CN/tools/diffs)
- [会话管理](/zh-CN/concepts/session)
- [Exec 工具](/zh-CN/tools/exec)

---
read_when:
    - 调试智能体为什么以某种方式回答、失败或调用工具
    - 导出 OpenClaw 会话的支持包
    - 排查提示上下文、工具调用、运行时错误或用量元数据
    - 禁用或迁移轨迹捕获
summary: 导出已脱敏的轨迹包，用于调试 OpenClaw 智能体会话
title: 轨迹包
x-i18n:
    generated_at: "2026-06-27T03:35:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

轨迹捕获是 OpenClaw 的逐会话飞行记录器。它会为每次智能体运行记录
结构化时间线，然后 `/export-trajectory` 将当前会话打包成经过脱敏的支持包。

当你需要回答如下问题时使用它：

- 哪些提示词、系统提示词和工具被发送给了模型？
- 哪些转录消息和工具调用促成了这个回答？
- 这次运行是超时、中止、压缩，还是遇到了提供商错误？
- 哪个模型、插件、技能和运行时设置处于活动状态？
- 提供商返回了哪些用量和提示缓存元数据？

如果你要为实时 Gateway 网关问题提交范围较广的支持报告，请从
[`/diagnostics`](/zh-CN/gateway/diagnostics#chat-command) 开始。诊断会收集经过清理的
Gateway 网关包，并且对于 OpenAI Codex harness 会话，还可以在批准后将
Codex 反馈发送到 OpenAI 服务器。当你明确需要详细的逐会话提示词、工具和转录
时间线时，请使用 `/export-trajectory`。

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

你可以选择一个相对输出目录名称：

```text
/export-trajectory bug-1234
```

自定义路径会在 `.openclaw/trajectory-exports/` 内解析。绝对
路径和 `~` 路径会被拒绝。

轨迹包可能包含提示词、模型消息、工具架构、工具结果、运行时事件和本地路径。因此，聊天斜杠命令每次都会经过 exec 审批。当你打算创建包时，只批准这一次导出；不要使用全部允许。在群聊中，OpenClaw 会将审批提示和导出结果私下发送给所有者，而不是把轨迹详情发回共享房间。

对于本地检查或支持工作流，你也可以直接运行已批准的命令路径：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## 访问

轨迹导出是所有者命令。发送者必须通过该渠道的常规命令授权检查和所有者检查。

## 记录内容

OpenClaw 智能体运行默认启用轨迹捕获。

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

事件会以 JSON Lines 写入，并带有此架构标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 包文件

导出的包可以包含：

| 文件                  | 内容                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 包架构、源文件、事件计数和生成的文件列表                             |
| `events.jsonl`        | 有序的运行时和转录时间线                                                        |
| `session-branch.json` | 经过脱敏的活动转录分支和会话头                                           |
| `metadata.json`       | OpenClaw 版本、OS/运行时、模型、配置快照、插件、技能和提示词元数据     |
| `artifacts.json`      | 最终状态、错误、用量、提示缓存、压缩计数、助手文本和工具元数据 |
| `prompts.json`        | 已提交的提示词和选定的提示词构建详情                                         |
| `system-prompt.txt`   | 捕获到的最新编译系统提示词                                                   |
| `tools.json`          | 捕获到的发送给模型的工具定义                                              |

`manifest.json` 会列出该包中存在的文件。当会话未捕获对应的运行时数据时，某些文件会被省略。

## 捕获位置

默认情况下，运行时轨迹事件会写在会话文件旁边：

```text
<session>.trajectory.jsonl
```

OpenClaw 还会在会话旁边尽力写入一个指针文件：

```text
<session>.trajectory-path.json
```

设置 `OPENCLAW_TRAJECTORY_DIR` 可将运行时轨迹 sidecar 存储在专用目录中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

设置此变量后，OpenClaw 会在该目录中为每个会话 ID 写入一个 JSONL 文件。

当拥有轨迹 sidecar 的会话条目因会话磁盘预算而被修剪、限制或逐出时，会话维护会移除这些 sidecar。只有当指针目标仍能证明运行时文件属于该会话时，才会移除会话目录之外的运行时文件。

## 停用捕获

在启动 OpenClaw 前设置 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

这会停用运行时轨迹捕获。`/export-trajectory` 仍可导出转录分支，但可能缺少仅运行时文件，例如已编译上下文、提供商工件和提示词元数据。

## 调整刷新超时

OpenClaw 会在智能体清理期间刷新运行时轨迹 sidecar。默认清理超时为 10,000 ms。在慢速磁盘或大型存储上，请在启动 OpenClaw 前设置
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`：

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

这会控制 OpenClaw 何时记录 `openclaw-trajectory-flush` 超时并继续。
它不会更改轨迹大小上限。若要调整所有未传入显式超时的智能体清理步骤，请设置 `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`。

## 隐私和限制

轨迹包面向支持和调试设计，不适合公开发布。OpenClaw 会在写入导出文件前脱敏敏感值：

- 凭据和已知类似密钥的载荷字段
- 图片数据
- 本地状态路径
- 工作区路径，替换为 `$WORKSPACE_DIR`
- 检测到的主目录路径

导出器还会限制输入大小：

- 运行时 sidecar 文件：实时捕获会在 10 MiB 处停止，并在仍有空间时记录截断事件；导出接受最大 50 MiB 的现有运行时 sidecar
- 会话文件：50 MiB
- 运行时事件：200,000
- 导出的事件总数：250,000
- 单个运行时事件行超过 256 KiB 时会被截断

在团队外共享包之前，请先审查包内容。脱敏是尽力而为，无法知道每一个应用特定密钥。

## 故障排除

如果导出没有运行时事件：

- 确认 OpenClaw 启动时未设置 `OPENCLAW_TRAJECTORY=0`
- 检查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可写目录
- 在会话中再运行一条消息，然后重新导出
- 检查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用类似 `bug-1234` 的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 将导出保留在 `.openclaw/trajectory-exports/` 内

如果导出因大小错误而失败，说明会话或 sidecar 超出了导出安全限制。请启动新会话，或导出更小的复现。

## 相关

- [Diffs](/zh-CN/tools/diffs)
- [会话管理](/zh-CN/concepts/session)
- [Exec 工具](/zh-CN/tools/exec)

---
read_when:
    - 调试智能体为何以某种方式回答、失败或调用工具
    - 导出 OpenClaw 会话的支持包
    - 调查提示词上下文、工具调用、运行时错误或使用情况元数据
    - 禁用轨迹捕获
summary: 导出经过脱敏处理的轨迹包，以调试 OpenClaw 智能体会话
title: 轨迹包
x-i18n:
    generated_at: "2026-07-12T14:49:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

轨迹捕获是 OpenClaw 的逐会话飞行记录器。它会为每次智能体运行记录结构化时间线，然后 `/export-trajectory` 将当前会话打包为经过脱敏处理的支持包，其中包括：

- 发送给模型的提示词、系统提示词和工具
- 哪些转录消息和工具调用促成了回答
- 运行是否超时、中止、经过压缩或遇到提供商错误
- 哪些模型、插件、Skills 和运行时设置处于启用状态
- 提供商返回的用量和提示词缓存元数据

如需全面的 Gateway 网关支持报告，请先使用 [`/diagnostics`](/zh-CN/gateway/diagnostics#chat-command)；它会收集经过清理的 Gateway 网关支持包，并且对于 OpenAI Codex harness 会话，可在获得批准后向 OpenAI 发送 Codex 反馈。如果需要详细的逐会话提示词、工具和转录时间线，请使用 `/export-trajectory`。

## 快速开始

在活动会话中发送（别名为 `/trajectory`）：

```text
/export-trajectory
```

OpenClaw 会将支持包写入工作区下的以下位置：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

传入相对输出目录名称可覆盖默认名称：

```text
/export-trajectory bug-1234
```

该名称会在 `.openclaw/trajectory-exports/` 内解析。绝对路径和 `~` 路径会被拒绝。

轨迹支持包可能包含提示词、模型消息、工具架构、工具结果、运行时事件和本地路径，因此聊天命令始终需要通过 Exec 审批。当你确实要创建支持包时，请单次批准导出；不要使用全部允许。在群聊中，OpenClaw 会将审批提示和导出结果私下发送给所有者，而不会将轨迹详情发回共享聊天室。

如需进行本地检查或执行支持工作流，请直接运行底层 CLI 命令：

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

其他标志：`--output <path>`（`.openclaw/trajectory-exports` 内的目录名称）、`--store <path>`（覆盖会话存储）、`--agent <id>`（用于解析存储的智能体 ID）、`--json`（结构化输出）。

## 访问权限

轨迹导出是所有者命令。发送者必须通过常规命令授权检查以及该渠道的所有者检查。

## 记录的内容

OpenClaw 智能体运行默认启用轨迹捕获。

运行时事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`，包括源模型、下一个模型、失败原因/详情、链中位置，以及该链是继续推进、成功还是已耗尽
- `model.completed`
- `trace.artifacts`
- `session.ended`

转录事件会从活动会话分支重建：用户消息、助手消息、工具调用、工具结果、压缩、模型变更、标签和自定义会话条目。

事件以 JSON Lines 格式写入，并带有以下架构标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 支持包文件

| 文件                  | 内容                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | 支持包架构、源文件、事件计数和生成的文件列表                             |
| `events.jsonl`        | 按顺序排列的运行时和转录时间线                                                        |
| `session-branch.json` | 经过脱敏处理的活动转录分支和会话标头                                           |
| `metadata.json`       | OpenClaw 版本、操作系统/运行时、模型、配置快照、插件、Skills 和提示词元数据     |
| `artifacts.json`      | 最终状态、错误、用量、提示词缓存、压缩次数、助手文本和工具元数据 |
| `prompts.json`        | 已提交的提示词和选定的提示词构建详情                                         |
| `system-prompt.txt`   | 捕获到的最新已编译系统提示词                                                   |
| `tools.json`          | 捕获到的发送给模型的工具定义                                              |

`manifest.json` 会列出给定支持包中存在的文件；如果会话未捕获对应的运行时数据，则会省略某些文件。

## 捕获存储

运行时轨迹事件与会话一起存储在逐智能体 SQLite 数据库中。导出轨迹时会生成经过脱敏处理的 JSONL 支持包；实时运行时捕获不会写入会话旁边的 JSONL sidecar 文件。

旧版发布中的文件或显式旧版文件导出仍可能生成旧版 `.trajectory.jsonl` 和 `.trajectory-path.json` 文件。会话维护会将这些文件视为清理目标；活动捕获会写入数据库行。

## 禁用捕获

```bash
export OPENCLAW_TRAJECTORY=0
```

这会在启动 OpenClaw 前禁用运行时轨迹捕获。`/export-trajectory` 仍可导出转录分支，但已编译上下文、提供商工件和提示词元数据等仅限运行时的数据可能会缺失。

## 调整刷新超时

OpenClaw 会在智能体清理期间刷新运行时轨迹行。默认清理超时为 10,000 ms。对于速度较慢的磁盘或较大的存储，请在启动 OpenClaw 前设置 `OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS`：

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

这会控制 OpenClaw 何时记录 `openclaw-trajectory-flush` 超时并继续运行；它不会更改轨迹大小上限。若要调整所有未显式传入超时值的智能体清理步骤，请设置 `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`。

## 隐私和限制

轨迹支持包用于支持和调试，不应用于公开发布。OpenClaw 会在写入导出文件前对敏感值进行脱敏处理：

- 凭据和已知的类似密钥的有效载荷字段
- 图像数据
- 本地状态路径
- 工作区路径，替换为 `$WORKSPACE_DIR`
- 检测到的主目录路径

导出器还会限制输入大小：

- 运行时捕获：实时捕获采用滚动窗口，上限为 10 MiB；空间不足时会丢弃最旧的事件，为新事件腾出空间；导出接受最大 50 MiB 的现有旧版运行时 sidecar 文件
- 会话文件：50 MiB
- 每次导出的运行时事件：200,000
- 导出事件总数：250,000
- 单条运行时事件行超过 256 KiB 时会被截断

将支持包分享给团队之外的人员前，请先进行检查。脱敏处理仅为尽力而为，无法识别每个应用特有的密钥。

## 故障排查

如果导出内容中没有运行时事件：

- 确认 OpenClaw 启动时未设置 `OPENCLAW_TRAJECTORY=0`
- 在会话中再发送一条消息，然后重新导出
- 检查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用类似 `bug-1234` 的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 将导出内容保留在 `.openclaw/trajectory-exports/` 内

如果导出因大小错误而失败，则表示会话或 sidecar 文件超出了上述导出安全限制。请启动新会话，或导出规模更小的复现。

## 相关内容

- [Diffs](/zh-CN/tools/diffs)
- [会话管理](/zh-CN/concepts/session)
- [Exec 工具](/zh-CN/tools/exec)

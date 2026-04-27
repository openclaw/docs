---
read_when:
    - 调试智能体为什么会那样回答、失败或以某种方式调用工具
    - 为 OpenClaw 会话导出支持捆绑包
    - 调查提示词上下文、工具调用、运行时错误或用量元数据
    - 禁用或重新定位轨迹捕获
summary: 导出已脱敏的轨迹捆绑包，以便调试 OpenClaw 智能体会话
title: 轨迹捆绑包
x-i18n:
    generated_at: "2026-04-27T20:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bca4fa444ad84b59c7508767ec1b950fdde073c0b83771c9d63e3e71c239840d
    source_path: tools/trajectory.md
    workflow: 15
---

轨迹捕获是 OpenClaw 的每会话飞行记录器。它会为每次智能体运行记录结构化时间线，然后 `/export-trajectory` 会将当前会话打包为一个已脱敏的支持捆绑包。

当你需要回答以下问题时，可以使用它：

- 发送给模型的提示词、系统提示词和工具是什么？
- 哪些转录消息和工具调用导致了这个回答？
- 这次运行是超时、中止、压缩，还是遇到了提供商错误？
- 当时启用了哪些模型、插件、Skills 和运行时设置？
- 提供商返回了哪些用量和提示词缓存元数据？

## 快速开始

在当前活动会话中发送以下内容：

```text
/export-trajectory
```

别名：

```text
/trajectory
```

OpenClaw 会将捆绑包写入工作区下的以下位置：

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

你可以选择一个相对输出目录名称：

```text
/export-trajectory bug-1234
```

自定义路径会在 `.openclaw/trajectory-exports/` 内解析。绝对路径和 `~` 路径会被拒绝。

## 访问权限

轨迹导出是一个 owner 命令。发送者必须通过该渠道的常规命令授权检查和 owner 检查。

## 会记录哪些内容

对于 OpenClaw 智能体运行，轨迹捕获默认启用。

运行时事件包括：

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

转录事件也会从当前活动会话分支中重建：

- 用户消息
- 助手消息
- 工具调用
- 工具结果
- 压缩
- 模型变更
- 标签和自定义会话条目

事件会以 JSON Lines 格式写入，并带有以下模式标记：

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## 捆绑包文件

导出的捆绑包可能包含：

| 文件 | 内容 |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json` | 捆绑包模式、源文件、事件计数和生成的文件列表 |
| `events.jsonl` | 按顺序排列的运行时和转录时间线 |
| `session-branch.json` | 已脱敏的活动转录分支和会话头信息 |
| `metadata.json` | OpenClaw 版本、操作系统/运行时、模型、配置快照、插件、Skills 和提示词元数据 |
| `artifacts.json` | 最终状态、错误、用量、提示词缓存、压缩计数、助手文本和工具元数据 |
| `prompts.json` | 已提交的提示词和选定的提示词构建细节 |
| `system-prompt.txt` | 最新编译的系统提示词（如果已捕获） |
| `tools.json` | 发送给模型的工具定义（如果已捕获） |

`manifest.json` 会列出该捆绑包中存在的文件。如果会话未捕获相应的运行时数据，则某些文件会被省略。

## 捕获位置

默认情况下，运行时轨迹事件会写入会话文件旁边：

```text
<session>.trajectory.jsonl
```

OpenClaw 还会尽力在会话旁边写入一个指针文件：

```text
<session>.trajectory-path.json
```

设置 `OPENCLAW_TRAJECTORY_DIR` 可将运行时轨迹附带文件存储到专用目录中：

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

设置此变量后，OpenClaw 会在该目录中为每个会话 id 写入一个 JSONL 文件。

当所属会话条目因会话维护而被修剪、达到上限或因会话磁盘预算而被驱逐时，轨迹附带文件也会被删除。位于会话目录之外的运行时文件，只有当指针目标仍能证明其属于该会话时，才会被删除。

## 禁用捕获

在启动 OpenClaw 之前设置 `OPENCLAW_TRAJECTORY=0`：

```bash
export OPENCLAW_TRAJECTORY=0
```

这会禁用运行时轨迹捕获。`/export-trajectory` 仍然可以导出转录分支，但仅运行时文件（例如已编译上下文、提供商产物和提示词元数据）可能会缺失。

## 隐私和限制

轨迹捆绑包是为支持和调试而设计的，不适合公开发布。OpenClaw 会在写出导出文件之前对敏感值进行脱敏处理：

- 凭证和已知类似密钥的负载字段
- 图像数据
- 本地状态路径
- 工作区路径，会替换为 `$WORKSPACE_DIR`
- 主目录路径（如可检测）

导出器还会限制输入大小：

- 运行时附带文件：50 MiB
- 会话文件：50 MiB
- 运行时事件：200,000
- 导出的事件总数：250,000
- 单条运行时事件行超过 256 KiB 时会被截断

在与你的团队之外共享捆绑包之前，请先进行检查。脱敏是尽力而为，无法识别所有特定于应用程序的密钥。

## 故障排除

如果导出结果没有运行时事件：

- 确认 OpenClaw 启动时未设置 `OPENCLAW_TRAJECTORY=0`
- 检查 `OPENCLAW_TRAJECTORY_DIR` 是否指向可写目录
- 在该会话中再发送一条消息，然后重新导出
- 检查 `manifest.json` 中的 `runtimeEventCount`

如果命令拒绝输出路径：

- 使用类似 `bug-1234` 的相对名称
- 不要传入 `/tmp/...` 或 `~/...`
- 将导出保留在 `.openclaw/trajectory-exports/` 内

如果导出因大小错误而失败，则说明会话或附带文件超过了导出安全限制。请启动一个新会话，或导出一个更小的复现场景。

## 相关内容

- [Diffs](/zh-CN/tools/diffs)
- [会话管理](/zh-CN/concepts/session)
- [Exec 工具](/zh-CN/tools/exec)

---
read_when:
    - 你会在旧版文档或发布说明中遇到 `openclaw flows`
    - 你需要一份快速的 TaskFlow 检查参考指南
summary: 重定向：流程命令位于 `openclaw tasks flow` 下
title: 流程（重定向）
x-i18n:
    generated_at: "2026-07-11T20:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

不存在顶层 `openclaw flows` 命令。持久化 TaskFlow 的检查功能位于 `openclaw tasks flow` 下。

## 子命令

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 子命令   | 描述                   | 参数 / 选项                                                                          |
| -------- | ---------------------- | ------------------------------------------------------------------------------------ |
| `list`   | 列出已跟踪的 TaskFlow。 | `--json` 输出机器可读格式；`--status <name>` 筛选器（参见下方的状态值）。            |
| `show`   | 显示一个 TaskFlow。     | `<lookup>` 为流程 ID 或所有者键；`--json` 输出机器可读格式。                         |
| `cancel` | 取消正在运行的 TaskFlow。 | `<lookup>` 为流程 ID 或所有者键。                                                    |

`<lookup>` 接受流程 ID（由 `list` / `show` 返回）或流程的所有者键（所属子系统用于跟踪该流程的稳定标识符）。

### 状态筛选值

`list` 的 `--status` 接受以下值之一：`queued`、`running`、`waiting`、`blocked`、`succeeded`、`failed`、`cancelled`、`lost`。

## 示例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

有关 TaskFlow 的概念和编写方法，请参阅 [TaskFlow](/zh-CN/automation/taskflow)。有关上级 `tasks` 命令，请参阅 [tasks CLI 参考](/zh-CN/cli/tasks)。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [自动化](/zh-CN/automation)
- [TaskFlow](/zh-CN/automation/taskflow)

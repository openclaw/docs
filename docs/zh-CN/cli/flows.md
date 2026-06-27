---
read_when:
    - 你在较早的文档或发行说明中遇到 `openclaw flows`
    - 你需要一份快速的 TaskFlow 检查参考
summary: 重定向：flow 命令位于 `openclaw tasks flow` 下
title: 流程（重定向）
x-i18n:
    generated_at: "2026-05-10T19:27:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

没有顶层的 `openclaw flows` 命令。持久化 TaskFlow 检查位于 `openclaw tasks flow` 下。

## 子命令

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 子命令     | 说明                    | 参数 / 选项                                                                           |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 列出已跟踪的 TaskFlow。 | `--json` 机器可读输出；`--status <name>` 过滤器（见下方状态值）。 |
| `show`     | 显示一个 TaskFlow。     | `<lookup>` flow id 或 owner key；`--json` 机器可读输出。                    |
| `cancel`   | 取消正在运行的 TaskFlow。 | `<lookup>` flow id 或 owner key。                                                      |

`<lookup>` 接受 flow id（由 `list` / `show` 返回）或该 flow 的 owner key（所属子系统用来跟踪该 flow 的稳定标识符）。

### 状态过滤器值

`list` 上的 `--status` 接受以下值之一：

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## 示例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

完整的 TaskFlow 概念和编写说明见 [TaskFlow](/zh-CN/automation/taskflow)。父级 `tasks` 命令见 [tasks CLI 参考](/zh-CN/cli/tasks)。

## 相关

- [CLI 参考](/zh-CN/cli)
- [自动化](/zh-CN/automation)
- [TaskFlow](/zh-CN/automation/taskflow)

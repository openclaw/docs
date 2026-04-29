---
read_when:
    - 你想查看推断式跟进承诺
    - 你想要忽略待处理的签到
    - 你正在审计 Heartbeat 可能会传递的内容
summary: '`openclaw commitments` 的 CLI 参考（查看并忽略推断出的跟进事项）'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-29T21:37:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

列出并管理推断式跟进承诺。

跟进承诺是选择启用的短期跟进记忆，由会话上下文创建。请参阅[推断式跟进承诺](/zh-CN/concepts/commitments)了解概念指南。

没有子命令时，`openclaw commitments` 会列出待处理的跟进承诺。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 选项

- `--all`：显示所有状态，而不是只显示待处理的跟进承诺。
- `--agent <id>`：筛选到一个智能体 ID。
- `--status <status>`：按状态筛选。取值：`pending`、`sent`、`dismissed`、`snoozed` 或 `expired`。
- `--json`：输出机器可读的 JSON。

## 示例

列出待处理的跟进承诺：

```bash
openclaw commitments
```

列出所有已存储的跟进承诺：

```bash
openclaw commitments --all
```

筛选到一个智能体：

```bash
openclaw commitments --agent main
```

查找已推迟的跟进承诺：

```bash
openclaw commitments --status snoozed
```

解除一个或多个跟进承诺：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

导出为 JSON：

```bash
openclaw commitments --all --json
```

## 输出

文本输出包括：

- 跟进承诺 ID
- 状态
- 类型
- 最早到期时间
- 作用域
- 建议的跟进消息文本

JSON 输出还包括跟进承诺存储路径和完整的已存储记录。

## 相关内容

- [推断式跟进承诺](/zh-CN/concepts/commitments)
- [记忆概览](/zh-CN/concepts/memory)
- [Heartbeat](/zh-CN/gateway/heartbeat)
- [定时任务](/zh-CN/automation/cron-jobs)

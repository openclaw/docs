---
read_when:
    - 你需要回答谁运行了智能体或工具、它何时运行，以及它如何结束
    - 你需要一个有边界且可安全脱敏的活动导出
summary: 仅元数据智能体运行和工具操作审计记录的 CLI 参考
title: 审计记录
x-i18n:
    generated_at: "2026-07-06T21:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f3163f5fe4d1e15c2364d71927299caad4fd8a2b0101347cecab5d4d97f11c0
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

查询 Gateway 网关的仅元数据审计账本，用于查看智能体运行和工具操作。

记录默认开启；设置 [`audit.enabled: false`](/zh-CN/gateway/configuration-reference#audit)
可停止新写入。现有记录在过期前（30 天）仍可查询。该账本与对话转录分离：它记录身份、
顺序、来源、操作、状态和规范化错误代码，但绝不存储提示词、消息、工具参数、
工具结果、命令输出或原始错误文本。

Gateway 网关通过有界后台写入器将记录写入共享的 OpenClaw 状态数据库。查询绝不会返回超过 30 天的记录，
且账本上限为 100,000 行。过期行会在 Gateway 网关启动、每小时维护以及后续写入期间删除。

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
```

## 筛选条件

- `--agent <id>`：精确智能体 id
- `--session <key>`：精确会话键
- `--run <id>`：精确运行 id
- `--kind <kind>`：`agent_run` 或 `tool_action`
- `--status <status>`：`started`、`succeeded`、`failed`、`cancelled`、
  `timed_out`、`blocked` 或 `unknown`
- `--after <timestamp>` / `--before <timestamp>`：包含边界的 ISO 时间戳或
  Unix 毫秒
- `--limit <count>`：页面大小，范围 1 到 500；默认 `100`
- `--cursor <sequence>`：继续上一次按最新优先排序的查询
- `--json`：以 JSON 打印有界页面

文本输出显示时间、类型、状态、智能体、运行和操作。工具操作还会显示工具名称。
JSON 输出是相同元数据的安全有界导出，并在存在下一页时包含 `nextCursor`。
将该值传给 `--cursor`，即可继续分页，而不会重新排序分页期间到达的记录。

## 记录的事件

Gateway 网关将现有智能体事件流投射为四种操作：

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`

每条记录都有稳定的事件 id、单调递增的账本序列、原始运行事件序列、
运行时提供的生命周期时间戳（否则为观察时间）、智能体/运行来源、参与者，以及
`redaction: "metadata_only"` 标记。终态记录会用封闭状态和错误代码区分成功、
失败、取消、超时和策略阻止。当上游运行时未暴露权威终态结果时，`unknown`
是一个明确的非成功结果。工具调用 id 仅导出为稳定的单向指纹。工具名称必须匹配紧凑的
面向模型名称契约；其他值会变为 `unknown`。会话 id、会话键、运行 id 和保留的工具名称属于操作员元数据；
请将导出内容作为运维记录加以保护。

审计账本不会替代转录、任务历史、cron 运行历史或日志。它提供一个小型跨运行索引，
用于回答操作员问题，而不会把对话内容复制到另一个存储中。

## Gateway RPC

`audit.list` 需要 `operator.read`，并接受相同筛选条件。示例：

```bash
openclaw gateway call audit.list --params '{"agentId":"main","status":"failed","limit":50}'
```

结果为 `{ "events": AuditEvent[], "nextCursor"?: string }`。结果按最新优先排序，
且每个请求最多 500 条记录。

## 相关

- [Gateway protocol](/zh-CN/gateway/protocol#audit-ledger-rpc)
- [会话](/zh-CN/cli/sessions)
- [任务](/zh-CN/cli/tasks)
- [Cron 作业](/zh-CN/automation/cron-jobs)

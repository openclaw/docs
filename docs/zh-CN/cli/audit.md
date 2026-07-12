---
read_when:
    - 你需要回答是谁运行了智能体或工具、运行时间，以及运行结果如何
    - 你需要不含内容的入站或出站消息生命周期元数据
    - 你需要一个范围受限且可安全脱敏的活动导出。
summary: 仅含元数据的运行、工具和消息生命周期审计记录 CLI 参考
title: 审计记录
x-i18n:
    generated_at: "2026-07-12T14:21:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

查询 Gateway 网关中仅含元数据的审计账本，获取智能体运行、工具操作和选择启用的消息生命周期记录。

运行和工具事件的账本默认启用。设置
[`audit.enabled: false`](/zh-CN/gateway/configuration-reference#audit) 并重启
Gateway 网关，即可停止记录所有新事件。消息记录默认单独禁用；将 `audit.messages`
设置为 `direct` 或 `all` 并重启 Gateway 网关，即可记录消息。现有记录在到期前
（30 天）仍可查询。

该账本与对话转录分开：它记录身份、顺序、来源、操作、状态和标准化结果代码，
但绝不存储内容；消息标识符仅以安装实例本地的带密钥伪名形式出现。
[审计历史](/gateway/audit)说明完整的数据模型、隐私语义、存储/保留期限和覆盖范围限制；
本页介绍命令界面。

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## 筛选条件

- `--agent <id>`：精确的智能体 ID
- `--session <key>`：精确的会话键
- `--run <id>`：精确的运行 ID
- `--kind <kind>`：`agent_run`、`tool_action` 或 `message`
- `--status <status>`：`started`、`succeeded`、`failed`、`cancelled`、
  `timed_out`、`blocked` 或 `unknown`
- `--direction <direction>`：消息方向，`inbound` 或 `outbound`
- `--channel <channel>`：精确的消息渠道
- `--after <timestamp>` / `--before <timestamp>`：包含边界的 ISO 时间戳或
  Unix 毫秒时间戳
- `--limit <count>`：页面大小，范围为 1 到 500；默认为 `100`
- `--cursor <sequence>`：继续上一次按最新记录优先的查询
- `--json`：以 JSON 格式输出有界页面

CLI 查询带版本的活动 RPC，因此一条命令即可显示完整的已配置账本。
文本输出显示时间、类型、方向、渠道、状态、智能体、运行和操作。
缺失的消息来源显示为 `-`；OpenClaw 不会虚构智能体或运行 ID。
工具操作还会显示工具名称。存在下一页时，JSON 输出包含 `nextCursor`。
将该值传给 `--cursor`，即可继续查询，同时不重新排序分页期间到达的记录。

即使不包含消息正文和原始消息身份字段，这些导出内容仍属于敏感的运维元数据。
智能体、会话和运行 ID、时间、渠道、结果及稳定的 HMAC 引用可用于关联活动。
请采用与其他操作员记录相同的访问控制和保留做法来保护它们。

## 记录的事件

Gateway 网关将可信的生命周期流投影为六种操作：

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

每条返回的记录都有稳定的事件 ID、单调递增的账本序号、生命周期时间戳、
参与者、操作、状态、`schemaVersion: 1` 标记、源序号和
`redaction: "metadata_only"`。只有当可信来源提供智能体/会话/运行来源信息及
事件特定字段时，这些内容才会出现。消息记录有意省略 `sessionKey` 和
`sessionId`，因此 `--session` 仅筛选运行和工具记录。

终态运行和工具记录通过闭合状态及错误代码区分成功、失败、取消、超时和策略阻止。
当上游运行时未公开权威终态结果时，`unknown` 是明确的非成功结果。
工具调用 ID 仅以稳定指纹形式导出。工具名称必须符合面向模型的紧凑名称约定；
其他值会变为 `unknown`。

消息记录会增加方向、渠道、对话类型、结果，以及可选的投递类型、失败阶段、持续时间、
结果数量、标准化原因代码和带密钥的账号/对话/消息/目标伪名。当前入站边界涵盖
到达核心分派的已接受消息，包括核心重复处理结果和终态处理结果。对于到达共享持久化
投递的每个原始逻辑回复载荷，出站边界会写入一条终态记录；分块和适配器扇出会汇总到
`resultCount` 中。进入队列且可重试或结果不明确的发送，只有在确认、死信或对账使结果
成为终态后才会被记录。绕过这些共享边界的插件本地路径和直接发送路径目前尚未覆盖；
缺少记录并不能证明消息从未存在。

审计账本不会取代转录、任务历史记录、cron 运行历史记录或日志。它提供一个小型的
跨运行索引，用于回答操作员问题，而无需将对话内容复制到另一个存储中。

对于入站记录，`durationMs` 衡量核心分派耗时，`resultCount` 统计已完成的队列工具、
分块和回复载荷。对于出站记录，`durationMs` 包含投递所有权直至终态的时间
（因此也包括队列等待时间），而 `resultCount` 统计已识别的实际平台发送次数。
`deliveryKind` 在存在时描述经过钩子处理和渲染后的有效载荷；被抑制的记录和因崩溃而
结果不明确的记录会省略该字段。

## Gateway RPC

`audit.activity.list` 需要 `operator.read`，并接受相同的筛选条件。它返回具名的 V1
活动事件联合类型，其中包括运行、工具、入站消息和出站消息记录。

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

结果为 `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`。
结果按最新记录优先排序，每个请求最多返回 500 条记录。

已发布的 `audit.list` RPC 对较旧的运行/工具客户端保持不变。当较旧的 Gateway 网关上
不提供 `audit.activity.list` 时，只有当旧方法支持所有请求的筛选条件，CLI 才会重试
`audit.list`。在较旧的 Gateway 网关上，`--kind message`、`--direction` 和 `--channel`
会显示升级提示并失败，而不会被静默丢弃。

## 相关内容

- [审计历史](/gateway/audit)
- [Gateway 网关协议](/zh-CN/gateway/protocol#audit-ledger-rpc)
- [会话](/zh-CN/cli/sessions)
- [任务](/zh-CN/cli/tasks)
- [Cron 作业](/zh-CN/automation/cron-jobs)

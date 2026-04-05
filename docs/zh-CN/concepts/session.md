---
read_when:
    - 你想了解会话路由和隔离
    - 你想为多用户设置配置私信范围
summary: OpenClaw 如何管理对话会话
title: Session Management
x-i18n:
    generated_at: "2026-04-05T08:22:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Session Management

OpenClaw 将对话组织为**会话**。每条消息都会根据其来源被路由到一个
会话——例如私信、群聊、cron jobs 等。

## 消息如何路由

| 来源 | 行为 |
| --------------- | ------------------------- |
| 私信 | 默认共享会话 |
| 群聊 | 按群组隔离 |
| 房间/渠道 | 按房间隔离 |
| Cron jobs | 每次运行使用新会话 |
| Webhooks | 按 hook 隔离 |

## 私信隔离

默认情况下，所有私信共享一个会话，以保持连续性。这对于
单用户设置来说没有问题。

<Warning>
如果有多个人可以向你的智能体发送消息，请启用私信隔离。否则，所有
用户都会共享相同的对话上下文——Alice 的私密消息会对 Bob 可见。
</Warning>

**修复方法：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 按渠道 + 发送者隔离
  },
}
```

其他选项：

- `main`（默认）——所有私信共享一个会话。
- `per-peer`——按发送者隔离（跨渠道）。
- `per-channel-peer`——按渠道 + 发送者隔离（推荐）。
- `per-account-channel-peer`——按账户 + 渠道 + 发送者隔离。

<Tip>
如果同一个人通过多个渠道联系你，请使用
`session.identityLinks` 关联他们的身份，这样他们就会共享一个会话。
</Tip>

使用 `openclaw security audit` 验证你的设置。

## 会话生命周期

会话会持续复用，直到过期：

- **每日重置**（默认）——在 gateway
  主机本地时间每天凌晨 4:00 创建新会话。
- **空闲重置**（可选）——在一段时间无活动后创建新会话。设置
  `session.reset.idleMinutes`。
- **手动重置**——在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还会
  切换模型。

如果同时配置了每日重置和空闲重置，则以先到期者为准。

## 状态存储位置

所有会话状态都由 **gateway** 持有。UI 客户端会向 gateway 查询
会话数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **转录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## 会话维护

OpenClaw 会随着时间自动限制会话存储规模。默认情况下，它以
`warn` 模式运行（报告会清理哪些内容）。将 `session.maintenance.mode`
设置为 `"enforce"` 可启用自动清理：

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

使用 `openclaw sessions cleanup --dry-run` 进行预览。

## 检查会话

- `openclaw status` —— 会话存储路径和最近活动。
- `openclaw sessions --json` —— 所有会话（可用 `--active <minutes>` 过滤）。
- 聊天中的 `/status` —— 上下文使用情况、模型和开关。
- `/context list` —— system prompt 中包含的内容。

## 进一步阅读

- [Session Pruning](/concepts/session-pruning) —— 裁剪工具结果
- [Compaction](/concepts/compaction) —— 总结长对话
- [Session Tools](/concepts/session-tool) —— 用于跨会话工作的智能体工具
- [Session Management Deep Dive](/reference/session-management-compaction) --
  存储 schema、转录、发送策略、来源元数据和高级配置
- [Multi-Agent](/concepts/multi-agent) — 跨智能体的路由与会话隔离
- [Background Tasks](/automation/tasks) — 分离的工作如何创建带有会话引用的任务记录
- [Channel Routing](/channels/channel-routing) — 入站消息如何被路由到会话

---
read_when:
    - 你想了解会话路由和隔离机制
    - 你想为多用户设置配置私信作用域
    - 你正在调试每日或空闲会话重置
summary: OpenClaw 如何管理会话会话
title: 会话管理
x-i18n:
    generated_at: "2026-04-27T21:49:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw 将对话组织为**会话**。每条消息都会根据其来源被路由到某个会话——私信、群聊、cron 作业等。

## 消息如何路由

| 来源 | 行为 |
| --------------- | ------------------------- |
| 私信 | 默认共享会话 |
| 群聊 | 按群组隔离 |
| 房间/渠道 | 按房间隔离 |
| Cron 作业 | 每次运行使用全新会话 |
| Webhook | 按钩子隔离 |

## 私信隔离

默认情况下，所有私信共享一个会话，以保持连续性。这对于单用户设置来说没有问题。

<Warning>
如果有多个人可以给你的智能体发送消息，请启用私信隔离。否则，所有用户都会共享同一个对话上下文——Alice 的私人消息会对 Bob 可见。
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
- `per-account-channel-peer`——按账号 + 渠道 + 发送者隔离。

<Tip>
如果同一个人通过多个渠道联系你，请使用 `session.identityLinks` 关联他们的身份，这样他们就会共享一个会话。
</Tip>

### Dock 链接渠道

Dock 命令允许用户将当前私聊会话的回复路由移动到另一个已链接的渠道，而无需启动新会话。示例、配置和故障排除请参见 [渠道停靠](/zh-CN/concepts/channel-docking)。

使用 `openclaw security audit` 验证你的设置。

## 会话生命周期

会话会被重复使用，直到它们过期：

- **每日重置**（默认）——Gateway 网关主机本地时间每天凌晨 4:00 创建新会话。每日新鲜度基于当前 `sessionId` 的开始时间，而不是之后的元数据写入时间。
- **空闲重置**（可选）——在一段时间无活动后创建新会话。设置 `session.reset.idleMinutes`。空闲新鲜度基于最后一次真实的用户/渠道交互，因此心跳、cron 和 exec 系统事件不会让会话保持活跃。
- **手动重置**——在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还会切换模型。

当同时配置了每日重置和空闲重置时，以先到期者为准。心跳、cron、exec 以及其他系统事件轮次可能会写入会话元数据，但这些写入不会延长每日或空闲重置的新鲜度。当重置使会话轮换时，旧会话中排队的系统事件通知会被丢弃，这样过时的后台更新就不会被附加到新会话中的第一个提示前面。

带有由提供商拥有的活动 CLI 会话的会话，不会被隐式的默认每日重置切断。当这些会话需要按计时器过期时，请使用 `/reset` 或显式配置 `session.reset`。

## 状态存储位置

所有会话状态都由 **Gateway 网关** 持有。UI 客户端会向 Gateway 网关查询会话数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **转录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 会保留独立的生命周期时间戳：

- `sessionStartedAt`：当前 `sessionId` 开始的时间；每日重置使用它。
- `lastInteractionAt`：最后一次会延长空闲生命周期的用户/渠道交互时间。
- `updatedAt`：最后一次存储行变更时间；适合用于列出和清理，但不是每日/空闲重置新鲜度的权威依据。

对于缺少 `sessionStartedAt` 的旧条目，会在可用时从转录 JSONL 会话头中解析。如果旧条目也缺少 `lastInteractionAt`，则空闲新鲜度会回退到该会话开始时间，而不是之后的账务性写入时间。

## 会话维护

OpenClaw 会随着时间自动限制会话存储的大小。默认情况下，它以 `warn` 模式运行（报告将会清理哪些内容）。将 `session.maintenance.mode` 设置为 `"enforce"` 以启用自动清理：

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

对于生产规模的 `maxEntries` 限制，Gateway 网关运行时写入会使用一个较小的高水位缓冲区，并分批清理回配置的上限。这可以避免为每个隔离的 cron 会话都执行一次完整的存储清理。`openclaw sessions cleanup --enforce` 会立即应用该上限。

使用 `openclaw sessions cleanup --dry-run` 进行预览。

## 检查会话

- `openclaw status` —— 会话存储路径和最近活动。
- `openclaw sessions --json` —— 所有会话（可使用 `--active <minutes>` 过滤）。
- 聊天中的 `/status` —— 上下文使用情况、模型和开关。
- `/context list` —— 系统提示中包含的内容。

## 延伸阅读

- [会话清理](/zh-CN/concepts/session-pruning) —— 裁剪工具结果
- [压缩](/zh-CN/concepts/compaction) —— 总结长对话
- [会话工具](/zh-CN/concepts/session-tool) —— 用于跨会话工作的智能体工具
- [会话管理深度解析](/zh-CN/reference/session-management-compaction) —— 存储模式、转录、发送策略、来源元数据和高级配置
- [多智能体](/zh-CN/concepts/multi-agent) —— 智能体之间的路由和会话隔离
- [后台任务](/zh-CN/automation/tasks) —— 分离工作如何创建带有会话引用的任务记录
- [渠道路由](/zh-CN/channels/channel-routing) —— 入站消息如何被路由到会话

## 相关内容

- [会话清理](/zh-CN/concepts/session-pruning)
- [会话工具](/zh-CN/concepts/session-tool)
- [命令队列](/zh-CN/concepts/queue)

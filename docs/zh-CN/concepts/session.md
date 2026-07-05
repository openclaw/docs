---
read_when:
    - 你想了解会话路由和隔离
    - 你想为多用户设置配置私信作用域
    - 你正在调试每日或空闲会话重置
summary: OpenClaw 如何管理对话会话
title: 会话管理
x-i18n:
    generated_at: "2026-07-05T11:16:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ad901508e6c39e34fba7cb944b2d8db72524a0327f2bbc1738b3ed449e34b7d
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 会根据入站消息的来源将每条消息路由到一个**会话**：
私信、群聊、cron 作业等。所有会话状态都由
**Gateway 网关**拥有；UI 客户端会向 Gateway 网关查询会话数据。

## 消息如何路由

| 来源          | 行为                  |
| --------------- | ------------------------- |
| 私信 | 默认共享会话 |
| 群聊     | 按群组隔离        |
| 房间/频道  | 按房间隔离         |
| Cron 作业       | 每次运行使用新会话     |
| Webhooks        | 按 hook 隔离         |

## 私信隔离

默认情况下，所有私信会共享一个会话以保持连续性，这适合
单用户设置。

<Warning>
如果多个人可以向你的智能体发送消息，请启用私信隔离。否则，所有
用户会共享同一个对话上下文，因此 Alice 的私密消息会对
Bob 可见。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

`session.dmScope` 选项：

| 值                      | 行为                                  |
| -------------------------- | ----------------------------------------- |
| `main`（默认）           | 所有私信共享一个会话                 |
| `per-peer`                 | 按发送者隔离，跨渠道        |
| `per-channel-peer`         | 按渠道 + 发送者隔离（推荐） |
| `per-account-channel-peer` | 按账号 + 渠道 + 发送者隔离     |

<Tip>
如果同一个人从多个渠道联系你，请使用
`session.identityLinks` 将他们的身份映射到一个规范 peer id，这样
他们就会共享一个会话。
</Tip>

### Dock 已链接渠道

Dock 命令会把当前直接聊天会话的回复路由移动到另一个
已链接渠道，而不会启动新会话。有关示例、配置和
故障排除，请参阅
[频道停靠](/zh-CN/concepts/channel-docking)。

使用 `openclaw security audit` 验证你的设置。

## 会话生命周期

会话会被复用，直到它们根据 `session.reset` 过期：

- **每日重置**（默认 `mode: "daily"`）- 在 Gateway 网关主机上配置的本地
  小时（`session.reset.atHour`，默认 `4`，0-23）创建新会话。每日
  新鲜度基于当前 `sessionId` 的开始时间，而不是后续的
  元数据写入时间。
- **空闲重置**（`mode: "idle"`）- 在 `session.reset.idleMinutes`
  分钟无活动后创建新会话。空闲新鲜度基于最后一次真实的用户/渠道
  交互，因此 heartbeat、cron 和 exec 系统事件不会让
  会话保持活动。
- **手动重置** - 在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还会
  切换模型。

当同时配置每日重置和空闲重置时，先过期者生效。
Heartbeat、cron、exec 和其他系统事件轮次可能会写入会话元数据，
但这些写入不会延长每日或空闲重置的新鲜度。当重置
滚动会话时，旧会话中排队的系统事件通知会被
丢弃，因此过期的后台更新不会被前置到新会话中的第一个提示词。

具有活跃提供商拥有的 CLI 会话的会话不会被隐式
每日默认值切断。当这些会话应按计时器过期时，请使用 `/reset`
或显式配置 `session.reset`。

按聊天类型或按渠道覆盖默认值：

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` 支持 `direct`（旧版别名 `dm`）、`group` 和 `thread`。
旧版顶层 `session.idleMinutes` 仍可作为兼容性别名使用，用于在未设置
`session.reset`/`resetByType` 块时提供空闲模式默认值。

## 状态存放位置

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **转录记录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 会保留独立的生命周期时间戳：

- `sessionStartedAt`：当前 `sessionId` 开始的时间；每日重置使用它。
- `lastInteractionAt`：最后一次会延长空闲生命周期的用户/渠道交互。
- `updatedAt`：最后一次存储行变更；对列表和剪枝有用，但不是
  每日/空闲重置新鲜度的权威依据。

缺少 `sessionStartedAt` 的较旧行会在可用时从转录 JSONL
会话头解析。如果较旧行也缺少 `lastInteractionAt`，
空闲新鲜度会回退到该会话开始时间，而不是后续的簿记
写入时间。

## 会话维护

OpenClaw 会通过 `session.maintenance` 随时间限制会话存储，默认值
如下：

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applies cleanup; "warn" only reports
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

对于生产规模的 `maxEntries` 限制，Gateway 网关运行时写入会使用一个小的
高水位缓冲，并分批清理回配置的上限。
会话存储读取不会在 Gateway 网关启动期间剪枝或限制条目，因此
启动和隔离的 cron 会话不需要承担完整存储清理成本。
`openclaw sessions cleanup --enforce` 会立即应用上限。

Gateway 网关模型运行探测会话默认是短生命周期的。匹配
`agent:*:explicit:model-run-<uuid>` 的行使用固定的 `24h` 保留期，但清理是
压力门控的：只有当达到会话条目
维护/上限压力时，才会移除过期探测行，并且会在更广泛的过期条目
年龄截止和条目上限之前运行。普通的 direct、group、thread、cron、hook、heartbeat、
ACP 和子智能体会话不会继承这个 24h 保留期。

维护会保留持久的外部对话指针，包括群组
会话和线程范围聊天会话，同时仍允许合成的 cron、
hook、heartbeat、ACP 和子智能体条目老化退出。

如果你之前使用过私信隔离，后来又将 `session.dmScope` 改回
`main`，请使用
`openclaw sessions cleanup --dry-run --fix-dm-scope` 预览过期的 peer-keyed 私信行。应用相同标志
会停用这些旧的直接私信行，并将它们的转录记录保留为已删除
归档。

使用 `openclaw sessions cleanup --dry-run` 预览任何维护运行。

## 检查会话

| 命令                    | 显示                                           |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | 会话存储路径和最近活动          |
| `openclaw sessions --json` | 所有会话（使用 `--active <minutes>` 过滤） |
| 聊天中的 `/status`          | 上下文用量、模型和开关               |
| `/context list`            | 系统提示词中的内容                    |

## 延伸阅读

- [会话剪枝](/zh-CN/concepts/session-pruning) - 修剪工具结果
- [压缩](/zh-CN/concepts/compaction) - 总结长对话
- [会话工具](/zh-CN/concepts/session-tool) - 用于跨会话工作的智能体工具
- [会话管理深度解析](/zh-CN/reference/session-management-compaction) -
  存储 schema、转录记录、发送策略、来源元数据和高级配置
- [多 Agent](/zh-CN/concepts/multi-agent) - 跨智能体的路由和会话隔离
- [后台任务](/zh-CN/automation/tasks) - 分离式工作如何创建带有会话引用的任务记录
- [频道路由](/zh-CN/channels/channel-routing) - 入站消息如何路由到会话

## 相关

- [会话剪枝](/zh-CN/concepts/session-pruning)
- [会话工具](/zh-CN/concepts/session-tool)
- [命令队列](/zh-CN/concepts/queue)

---
read_when:
    - 你想了解会话路由和隔离
    - 你想为多用户设置配置私信范围
    - 你正在调试每日或空闲会话重置
summary: OpenClaw 如何管理对话会话
title: 会话管理
x-i18n:
    generated_at: "2026-06-27T01:54:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 将对话组织为 **会话**。每条消息都会根据其来源（私信、群聊、cron 作业等）路由到某个会话。

## 消息如何路由

| 来源          | 行为                  |
| --------------- | ------------------------- |
| 私信 | 默认共享会话 |
| 群聊     | 按群组隔离        |
| 房间/渠道  | 按房间隔离         |
| Cron 作业       | 每次运行创建新会话     |
| Webhook        | 按 hook 隔离         |

## 私信隔离

默认情况下，所有私信共享一个会话以保持连续性。这适合单用户设置。

<Warning>
如果多个人可以给你的智能体发消息，请启用私信隔离。否则，所有用户都会共享同一个对话上下文 -- Alice 的私密消息会对 Bob 可见。
</Warning>

**修复方式：**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

其他选项：

- `main`（默认）-- 所有私信共享一个会话。
- `per-peer` -- 按发送者隔离（跨渠道）。
- `per-channel-peer` -- 按渠道 + 发送者隔离（推荐）。
- `per-account-channel-peer` -- 按账号 + 渠道 + 发送者隔离。

<Tip>
如果同一个人从多个渠道联系你，请使用 `session.identityLinks` 关联他们的身份，使他们共享一个会话。
</Tip>

### Dock 已关联渠道

Dock 命令允许用户将当前直接聊天会话的回复路由移动到另一个已关联渠道，而无需启动新会话。示例、配置和故障排除请参阅
[渠道 Docking](/zh-CN/concepts/channel-docking)。

使用 `openclaw security audit` 验证你的设置。

## 会话生命周期

会话会被复用，直到过期：

- **每日重置**（默认）-- 在 Gateway 网关主机本地时间凌晨 4:00 创建新会话。每日新鲜度基于当前 `sessionId` 的开始时间，而不是后续元数据写入时间。
- **空闲重置**（可选）-- 一段时间无活动后创建新会话。设置 `session.reset.idleMinutes`。空闲新鲜度基于最后一次真实的用户/渠道交互，因此 heartbeat、cron 和 exec 系统事件不会让会话保持活跃。
- **手动重置** -- 在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还会切换模型。

当同时配置每日重置和空闲重置时，先到期的规则生效。Heartbeat、cron、exec 和其他系统事件轮次可能会写入会话元数据，但这些写入不会延长每日或空闲重置的新鲜度。当重置滚动到新会话时，旧会话中排队的系统事件通知会被丢弃，避免过期的后台更新被附加到新会话的第一条提示前。

具有活跃的提供商自有 CLI 会话的会话不会被隐式每日默认值切断。如果这些会话应按计时器过期，请使用 `/reset` 或显式配置 `session.reset`。

## 状态存储位置

所有会话状态都归 **Gateway 网关** 所有。UI 客户端会向 Gateway 网关查询会话数据。

- **存储：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **转录记录：** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` 会保留独立的生命周期时间戳：

- `sessionStartedAt`：当前 `sessionId` 开始的时间；每日重置使用这个值。
- `lastInteractionAt`：最后一次会延长空闲生命周期的用户/渠道交互。
- `updatedAt`：最后一次存储行变更；用于列表展示和修剪，但不是每日/空闲重置新鲜度的权威来源。

没有 `sessionStartedAt` 的旧行会在可用时从转录记录 JSONL 会话头中解析。如果旧行也缺少 `lastInteractionAt`，空闲新鲜度会回退到该会话开始时间，而不是后续记账写入时间。

## 会话维护

OpenClaw 会自动随时间限制会话存储。默认情况下，它以 `enforce` 模式运行，并在维护期间执行清理。将 `session.maintenance.mode` 设置为 `"warn"`，可以报告将被清理的内容，而不修改存储/文件：

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

对于生产规模的 `maxEntries` 限制，Gateway 网关运行时写入会使用一个小的高水位缓冲区，并分批清理回配置的上限。Gateway 网关启动期间，会话存储读取不会修剪或限制条目数。这避免了每次启动或隔离的 cron 会话都运行完整存储清理。`openclaw sessions cleanup --enforce` 会立即应用上限。

Gateway 网关模型运行探测会话默认是短生命周期的。匹配严格显式键（如 `agent:*:explicit:model-run-<uuid>`）的行使用固定 `24h` 保留期，但清理受压力门控：只有达到会话条目维护/上限压力时，才会移除过期探测行。当模型运行清理执行时，它会先于更广泛的过期条目年龄截止和条目上限执行。普通直接、群组、线程、cron、hook、heartbeat、ACP 和子智能体会话不会继承这个 24h 保留期。

维护会保留持久的外部对话指针，包括群组会话和线程范围的聊天会话，同时仍允许合成的 cron、hook、heartbeat、ACP 和子智能体条目按时间淘汰。

如果你之前使用过私信隔离，之后又将 `session.dmScope` 改回 `main`，请使用 `openclaw sessions cleanup --dry-run --fix-dm-scope` 预览过期的按 peer 键控的私信行。应用同一标志会停用这些旧的直接私信行，并将其转录记录保留为已删除归档。

使用 `openclaw sessions cleanup --dry-run` 预览。

## 检查会话

- `openclaw status` -- 会话存储路径和最近活动。
- `openclaw sessions --json` -- 所有会话（使用 `--active <minutes>` 过滤）。
- 聊天中的 `/status` -- 上下文用量、模型和开关。
- `/context list` -- 系统提示中的内容。

## 延伸阅读

- [会话修剪](/zh-CN/concepts/session-pruning) -- 裁剪工具结果
- [压缩](/zh-CN/concepts/compaction) -- 总结长对话
- [会话工具](/zh-CN/concepts/session-tool) -- 用于跨会话工作的智能体工具
- [会话管理深度解析](/zh-CN/reference/session-management-compaction) --
  存储 schema、转录记录、发送策略、来源元数据和高级配置
- [多 Agent](/zh-CN/concepts/multi-agent) — 跨智能体的路由和会话隔离
- [后台任务](/zh-CN/automation/tasks) — 分离式工作如何创建带会话引用的任务记录
- [频道路由](/zh-CN/channels/channel-routing) — 入站消息如何路由到会话

## 相关内容

- [会话修剪](/zh-CN/concepts/session-pruning)
- [会话工具](/zh-CN/concepts/session-tool)
- [命令队列](/zh-CN/concepts/queue)

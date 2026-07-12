---
read_when:
    - 你想了解会话路由和隔离机制
    - 你想为多用户设置配置私信范围
    - 你正在调试每日或空闲会话重置问题
summary: OpenClaw 如何管理对话会话
title: 会话管理
x-i18n:
    generated_at: "2026-07-12T14:25:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw 会根据每条入站消息的来源（私信、群聊、cron 任务等），将其路由到一个**会话**。所有会话状态均由 **Gateway 网关**拥有；UI 客户端向 Gateway 网关查询会话数据。

## 消息如何路由

| 来源 | 行为 |
| --------------- | ------------------------- |
| 私信 | 默认共享会话 |
| 群聊 | 按群组隔离 |
| 房间/渠道 | 按房间隔离 |
| Cron 任务 | 每次运行使用新会话 |
| Webhooks | 按钩子隔离 |

## 私信隔离

默认情况下，所有私信共享一个会话以保持连续性，这适合单用户设置。

<Warning>
如果多人可以向你的智能体发送消息，请启用私信隔离。否则，所有用户都会共享同一对话上下文，因此 Alice 的私信会对 Bob 可见。
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // 按渠道 + 发送者隔离
  },
}
```

`session.dmScope` 选项：

| 值 | 行为 |
| -------------------------- | ----------------------------------------- |
| `main`（默认） | 所有私信共享一个会话 |
| `per-peer` | 跨渠道按发送者隔离 |
| `per-channel-peer` | 按渠道 + 发送者隔离（推荐） |
| `per-account-channel-peer` | 按账户 + 渠道 + 发送者隔离 |

<Tip>
如果同一个人通过多个渠道联系你，请使用 `session.identityLinks` 将其身份映射到一个规范的对端 ID，以便这些身份共享一个会话。
</Tip>

### 对接已关联的渠道

Dock 命令会将当前私聊会话的回复路由移至另一个已关联渠道，而不会启动新会话。有关示例、配置和故障排除，请参阅[渠道对接](/zh-CN/concepts/channel-docking)。

使用 `openclaw security audit` 验证你的设置。

## 会话生命周期

会话会重复使用，直到根据 `session.reset` 过期：

- **每日重置**（默认 `mode: "daily"`）——在 Gateway 网关主机上配置的本地小时（`session.reset.atHour`，默认 `4`，范围为 0-23）开始新会话。每日新鲜度取决于当前 `sessionId` 的开始时间，而不是之后的元数据写入时间。
- **空闲重置**（`mode: "idle"`）——在持续 `session.reset.idleMinutes` 分钟无活动后开始新会话。空闲新鲜度取决于最近一次真实的用户/渠道交互，因此 heartbeat、cron 和 exec 系统事件不会使会话保持活跃。
- **手动重置**——在聊天中输入 `/new` 或 `/reset`。`/new <model>` 还会切换模型。

同时配置每日重置和空闲重置时，以最先过期的设置为准。Heartbeat、cron、exec 和其他系统事件轮次可能会写入会话元数据，但这些写入不会延长每日或空闲重置的新鲜度。重置切换会话时，旧会话中排队的系统事件通知会被丢弃，以免过时的后台更新被添加到新会话第一个提示词的开头。

具有提供商所拥有的活跃 CLI 会话的会话，不会被隐式的每日默认设置中断。如果这些会话应按定时器过期，请使用 `/reset` 或显式配置 `session.reset`。

按聊天类型或渠道覆盖默认设置：

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

`resetByType` 支持 `direct`（旧版别名 `dm`）、`group` 和 `thread`。当未设置 `session.reset`/`resetByType` 块时，旧版顶层 `session.idleMinutes` 仍可用作空闲模式默认设置的兼容别名。

## 状态存储位置

- **运行时会话行：** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **已归档的记录文件：** `~/.openclaw/agents/<agentId>/sessions/`
- **旧版行迁移源：** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

每个智能体的 SQLite 数据库中的会话行分别保存以下生命周期时间戳：

- `sessionStartedAt`：当前 `sessionId` 的开始时间；每日重置使用此值。
- `lastInteractionAt`：最近一次会延长空闲生存期的用户/渠道交互时间。
- `updatedAt`：存储行最近一次变更的时间；可用于列出和清理，但不是每日/空闲重置新鲜度的权威依据。

从旧版安装迁移时，Gateway 网关启动过程和 `openclaw doctor
--fix` 会自动将旧版 `sessions.json` 行以及活跃记录的 JSONL 历史记录导入 SQLite。缺少 `sessionStartedAt` 的行会尽可能根据旧版记录 JSONL 的会话标头进行解析。如果旧版行还缺少 `lastInteractionAt`，空闲新鲜度将回退到该会话的开始时间，而不是之后的记录维护写入时间。如需明确的检查或验证证据，请使用 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` 和 [Doctor 迁移顺序](/zh-CN/cli/doctor#session-sqlite-migration)。

## 会话维护

OpenClaw 通过 `session.maintenance` 限制会话存储随时间增长，默认值如下：

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" 执行清理；"warn" 仅报告
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

对于生产规模的 `maxEntries` 限制，Gateway 网关运行时写入会使用一个较小的高水位缓冲区，并分批清理至配置的上限。Gateway 网关启动期间，会话存储读取不会清理条目或限制条目数量，因此启动过程和隔离的 cron 会话无需承担完整存储清理的开销。`openclaw sessions cleanup --enforce` 会立即应用该上限。

Gateway 网关模型运行探测会话默认生命周期很短。与 `agent:*:explicit:model-run-<uuid>` 匹配的行使用固定的 `24h` 保留期，但清理受压力条件控制：只有在达到会话条目维护/上限压力时，才会移除过期的探测行；此操作会先于更广泛的过期条目期限和条目上限处理。普通私聊、群组、线程、cron、钩子、heartbeat、ACP 和子智能体会话不会继承此 24h 保留期。

维护操作会保留持久的外部对话指针，包括群组会话和线程范围的聊天会话，同时仍允许合成的 cron、钩子、heartbeat、ACP 和子智能体条目随时间过期。

如果你以前使用私信隔离，之后又将 `session.dmScope` 恢复为 `main`，可使用 `openclaw sessions cleanup --dry-run --fix-dm-scope` 预览过时的按对端键控的私信行。应用同一标志会停用这些旧的直接私信行，并将其记录保留为已删除归档。

使用 `openclaw sessions cleanup --dry-run` 预览任何维护运行。

## 检查会话

| 命令 | 显示内容 |
| -------------------------- | ----------------------------------------------- |
| `openclaw status` | 会话存储路径和近期活动 |
| `openclaw sessions --json` | 所有会话（使用 `--active <minutes>` 筛选） |
| 聊天中的 `/status` | 上下文用量、模型和开关 |
| `/context list` | 系统提示词中包含的内容 |

## 延伸阅读

- [会话搜索](/concepts/session-search)——跨历史记录进行全文检索
- [会话清理](/zh-CN/concepts/session-pruning)——精简工具结果
- [压缩](/zh-CN/concepts/compaction)——总结长对话
- [会话工具](/zh-CN/concepts/session-tool)——用于跨会话工作的智能体工具
- [会话管理深入解析](/zh-CN/reference/session-management-compaction)——
  存储架构、记录、发送策略、来源元数据和高级配置
- [多智能体](/zh-CN/concepts/multi-agent)——跨智能体进行路由和会话隔离
- [后台任务](/zh-CN/automation/tasks)——分离的工作如何创建带有会话引用的任务记录
- [频道路由](/zh-CN/channels/channel-routing)——入站消息如何路由到会话

## 相关内容

- [会话清理](/zh-CN/concepts/session-pruning)
- [会话工具](/zh-CN/concepts/session-tool)
- [命令队列](/zh-CN/concepts/queue)

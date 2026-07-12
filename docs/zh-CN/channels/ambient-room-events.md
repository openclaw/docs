---
read_when:
    - 配置始终在线的群组或频道房间
    - 你希望智能体关注房间内的聊天，但不自动发布最终文本
    - 调试无可见房间消息时的输入状态和令牌用量
sidebarTitle: Ambient room events
summary: 让受支持的群组房间提供静默上下文，除非智能体使用消息工具发送消息
title: 环境房间事件
x-i18n:
    generated_at: "2026-07-11T20:18:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

环境房间事件让 OpenClaw 能够将未提及智能体的群组或渠道聊天作为静默上下文处理。智能体可以更新记忆和会话状态，但除非智能体显式调用 `message` 工具，否则房间会保持静默。

对于始终在线的群聊，请将 `messages.groupChat.unmentionedInbound: "room_event"` 与 `messages.groupChat.visibleReplies: "message_tool"` 结合使用。智能体会监听聊天内容，自行判断何时回复有帮助，并且不再需要使用回答 `NO_REPLY` 的旧提示词模式。

目前支持：Discord 服务器频道、Slack 频道和私有频道、Slack 多人私信，以及 Telegram 群组或超级群组。其他群组渠道会保留现有的群组行为，除非其渠道页面明确说明支持环境房间事件。

## 推荐设置

设置全局群聊行为：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

然后通过为该房间禁用提及门控，使其始终在线。该房间仍必须通过其常规 `groupPolicy`、房间允许列表和发送者允许列表检查。

保存配置后，Gateway 网关会热应用 `messages` 设置。仅当文件监视或配置重载被禁用（`gateway.reload.mode: "off"`）时才需要重启。

## 行为变化

使用 `messages.groupChat.unmentionedInbound: "room_event"` 后：

- 允许接收且未提及智能体的群组或渠道消息会成为静默房间事件
- 提及智能体的消息仍是用户请求
- 文本控制命令和原生命令仍是用户请求
- 中止或停止请求仍是用户请求
- 私信仍是用户请求

房间事件使用严格的可见消息投递方式。智能体最终输出的文本是私密的。智能体必须调用 `message(action=send)` 才能在房间中发帖。

对于房间事件，输入状态和生命周期状态表情回应会保持禁用。唯一明确的接收确认例外是 `messages.ackReactionScope: "all"`，它会发送配置的确认表情回应；当房间必须完全保持静默时，请使用范围更窄的值或 `"off"`。

## Discord 示例

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

如果只有一个频道应采用环境模式，请使用 Discord 的按频道配置。在 `groupPolicy: "allowlist"` 下，列出频道即表示允许该频道（`enabled: false` 会禁用相应条目）：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack 示例

Slack 频道允许列表优先使用 ID。请使用类似 `C12345678` 的频道 ID，而非 `#channel-name`。在 `channels.slack.channels` 下列出频道即表示允许该频道（`enabled: false` 会禁用相应条目）：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram 示例

对于 Telegram 群组，机器人必须能够看到普通群组消息。如果设置了 `requireMention: false`，请禁用 BotFather 隐私模式，或使用其他能够将完整群组流量投递给机器人的 Telegram 设置。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram 群组 ID 通常是类似 `-1001234567890` 的负数。你可以从 `openclaw logs --follow` 中读取 `chat.id`，将群组消息转发给 ID 查询机器人，或检查 Bot API 的 `getUpdates`。

## Agent 专属策略

当多个智能体共享同一房间，但只有一个智能体应将未提及它的聊天视为环境上下文时，请使用智能体覆盖配置：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

智能体专属的 `agents.list[].groupChat.unmentionedInbound` 值会为该智能体覆盖 `messages.groupChat.unmentionedInbound`。

## 可见回复模式

对于普通的群组或渠道用户请求，`messages.groupChat.visibleReplies` 默认为 `"automatic"`。如果希望智能体最终输出的文本无需显式调用消息工具即可公开发帖，请保留此默认值。

对于始终在线的环境房间，仍建议使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是搭配 GPT-5.6 Sol 等最新一代、工具调用可靠的模型。这样，智能体便能通过调用消息工具自行决定何时发言。如果模型未调用工具便返回最终文本，OpenClaw 会将该最终文本保密，并记录已抑制投递的元数据。

即使其他群组请求使用自动回复，房间事件仍采用严格模式。未提及智能体的环境房间事件始终需要调用 `message(action=send)` 才会产生可见输出。

## 历史记录

`messages.groupChat.historyLimit` 设置全局群组历史记录的默认值（未设置时为 50；必须是正整数）。渠道可以使用 `channels.<channel>.historyLimit` 覆盖它，某些渠道还支持按账户设置历史记录限制。将渠道级别的 `historyLimit` 设置为 `0`，可禁用该渠道的群组历史上下文。

支持房间事件的渠道会将最近的环境房间消息保留为上下文。Telegram 会为每个群组维护一个始终启用、受 `historyLimit` 限制的滚动窗口；用户请求轮次会选择机器人最后一次已记录回复之后的条目，而房间事件轮次会接收完整的近期窗口，使模型能够看到自己最近发布的消息。已停用的 Telegram `includeGroupHistoryContext` 模式键会由 `openclaw doctor --fix` 移除。

## 故障排查

如果房间显示正在输入或正在使用令牌，但没有可见消息：

1. 确认渠道允许列表和发送者允许列表均允许该房间。
2. 确认在预期的房间层级设置了 `requireMention: false`。
3. 检查 `messages.groupChat.unmentionedInbound` 或智能体覆盖配置是否为 `"room_event"`。
4. 检查日志中是否存在已抑制最终载荷的元数据或 `didSendViaMessagingTool: false`。
5. 对于普通群组请求，如果希望自动发布最终回复，请保留或恢复 `messages.groupChat.visibleReplies: "automatic"`。对于使用 `message_tool` 的环境房间，请使用能够可靠调用工具的模型或运行时。

如果 Telegram 环境房间完全不触发，请检查 BotFather 隐私模式，并确认 Gateway 网关正在接收普通群组消息。

如果 Slack 环境房间不触发，请确认频道键是 Slack 频道 ID，并且应用拥有对应房间类型的历史记录权限范围：`channels:history`（公开）、`groups:history`（私有）或 `mpim:history`（多人私信）。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [Discord](/zh-CN/channels/discord)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
- [频道配置参考](/zh-CN/gateway/config-channels)

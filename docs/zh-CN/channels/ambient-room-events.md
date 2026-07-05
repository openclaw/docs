---
read_when:
    - 配置常驻群组或渠道房间
    - 你希望智能体监听房间聊天，但不自动发布最终文本
    - 调试没有可见房间消息时的输入和令牌使用情况
sidebarTitle: Ambient room events
summary: 让受支持的群组房间提供安静上下文，除非智能体使用消息工具发送
title: 环境房间事件
x-i18n:
    generated_at: "2026-07-05T11:01:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1ac64dfa6d1af4e30397819ef1b94cd0fb0b838025dbb1129e685782f8679c1
    source_path: channels/ambient-room-events.md
    workflow: 16
---

环境房间事件允许 OpenClaw 将未被提及的群组或渠道闲聊作为安静上下文处理。智能体可以更新记忆和会话状态，但除非智能体显式调用 `message` 工具，否则房间会保持静默。

对于始终开启的群聊，请组合使用 `messages.groupChat.unmentionedInbound: "room_event"` 和 `messages.groupChat.visibleReplies: "message_tool"`。智能体会监听、判断何时回复有用，并且不再需要旧的提示词模式来回答 `NO_REPLY`。

目前支持：Discord 公会渠道、Slack 渠道和私人渠道、Slack 多人私信，以及 Telegram 群组或超级群组。其他群组渠道会保持其现有群组行为，除非对应渠道页面说明其支持环境房间事件。

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

然后通过为该房间禁用提及门控，使房间始终开启。该房间仍必须通过其正常的 `groupPolicy`、房间允许列表和发送者允许列表。

保存配置后，Gateway 网关会热应用 `messages` 设置。只有在文件监听或配置重载被禁用（`gateway.reload.mode: "off"`）时才需要重启。

## 变化内容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 时：

- 未被提及的已允许群组或渠道消息会变成安静的房间事件
- 被提及的消息仍是用户请求
- 文本控制命令和原生命令仍是用户请求
- 中止或停止请求仍是用户请求
- 直接消息仍是用户请求

房间事件使用严格的可见投递。最终助手文本是私密的。智能体必须调用 `message(action=send)` 才会在房间中发布。

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

当只有一个渠道应作为环境房间时，使用按渠道的 Discord 配置。在 `groupPolicy: "allowlist"` 下，列出渠道就是允许它（`enabled: false` 会禁用某个条目）：

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

Slack 渠道允许列表优先使用 ID。使用 `C12345678` 这样的渠道 ID，而不是 `#channel-name`。在 `channels.slack.channels` 下列出渠道就是允许它（`enabled: false` 会禁用某个条目）：

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

对于 Telegram 群组，bot 必须能够看到普通群组消息。如果 `requireMention: false`，请禁用 BotFather 隐私模式，或使用另一种能将完整群组流量投递给 bot 的 Telegram 设置。

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

Telegram 群组 ID 通常是负数，例如 `-1001234567890`。从 `openclaw logs --follow` 读取 `chat.id`，将群组消息转发给 ID 辅助 bot，或检查 Bot API `getUpdates`。

## 智能体特定策略

当多个智能体共享同一个房间，但只有一个智能体应将未被提及的闲聊作为环境上下文处理时，使用智能体覆盖配置：

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

智能体特定的 `agents.list[].groupChat.unmentionedInbound` 值会覆盖该智能体的 `messages.groupChat.unmentionedInbound`。

## 可见回复模式

对于普通群组/渠道用户请求，`messages.groupChat.visibleReplies` 默认是 `"automatic"`。当最终助手文本应在没有显式消息工具调用的情况下可见发布时，请保留该默认值。

对于始终开启的环境房间，仍建议使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是搭配 GPT 5.5 这类最新一代、工具调用可靠的模型。它允许智能体通过调用消息工具来决定何时发言。如果模型返回最终文本但未调用工具，OpenClaw 会将该最终文本保持私密，并记录被抑制投递的元数据。

即使其他群组请求使用自动回复，房间事件仍保持严格模式。未被提及的环境房间事件始终需要 `message(action=send)` 才能产生可见输出。

## 历史记录

`messages.groupChat.historyLimit` 设置全局群组历史记录默认值（未设置时为 50；必须是正整数）。渠道可以使用 `channels.<channel>.historyLimit` 覆盖它，某些渠道还支持按账户的历史记录限制。将渠道级 `historyLimit: 0` 设置为禁用该渠道的群组历史上下文。

受支持的房间事件渠道会保留近期环境房间消息作为上下文。Telegram 会保留一个始终开启、按群组滚动的窗口，其大小受 `historyLimit` 限制；用户请求轮次会选择 bot 上次记录回复之后的条目，而房间事件轮次会接收完整近期窗口，以便模型看到自己近期发布的内容。已退役的 Telegram `includeGroupHistoryContext` 模式键会由 `openclaw doctor --fix` 移除。

## 故障排查

如果房间显示正在输入或产生了 token 用量，但没有可见消息：

1. 确认该房间已被渠道允许列表和发送者允许列表允许。
2. 确认在你预期的房间层级设置了 `requireMention: false`。
3. 检查 `messages.groupChat.unmentionedInbound` 或智能体覆盖配置是否为 `"room_event"`。
4. 检查日志中是否有被抑制的最终载荷元数据或 `didSendViaMessagingTool: false`。
5. 对于普通群组请求，如果你希望最终回复自动发布，请保留或恢复 `messages.groupChat.visibleReplies: "automatic"`。对于使用 `message_tool` 的环境房间，请使用能可靠调用工具的模型/运行时。

如果 Telegram 环境房间完全没有触发，请检查 BotFather 隐私模式，并验证 Gateway 网关正在接收普通群组消息。

如果 Slack 环境房间没有触发，请验证渠道键是 Slack 渠道 ID，并且应用拥有该房间类型的历史记录作用域：`channels:history`（公开）、`groups:history`（私有）或 `mpim:history`（多人私信）。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [Discord](/zh-CN/channels/discord)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
- [频道配置参考](/zh-CN/gateway/config-channels)

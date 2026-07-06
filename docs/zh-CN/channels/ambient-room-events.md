---
read_when:
    - 配置始终在线的群组或频道房间
    - 你希望智能体监听房间聊天，但不要自动发布最终文本
    - 调试没有可见房间消息时的输入状态和 token 用量
sidebarTitle: Ambient room events
summary: 让受支持的群组房间提供安静上下文，除非智能体使用消息工具发送消息
title: 环境房间事件
x-i18n:
    generated_at: "2026-07-06T10:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 66177ae942c20026b5aaf007ebbd115373f15aceff585952471abb7721115469
    source_path: channels/ambient-room-events.md
    workflow: 16
---

环境房间事件让 OpenClaw 能将未提及的群组或渠道闲聊作为安静上下文处理。智能体可以更新记忆和会话状态，但除非智能体显式调用 `message` 工具，否则房间会保持静默。

对于常开群聊，请将 `messages.groupChat.unmentionedInbound: "room_event"` 与 `messages.groupChat.visibleReplies: "message_tool"` 组合使用。智能体会监听并判断何时回复有用，而且不再需要旧的提示词模式来回答 `NO_REPLY`。

目前支持：Discord 公会频道、Slack 频道和私有频道、Slack 多人私信，以及 Telegram 群组或超级群组。其他群组渠道会保持其现有群组行为，除非它们的渠道页面说明支持环境房间事件。

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

然后通过为该房间禁用提及门控，使房间常开。房间仍必须通过其常规 `groupPolicy`、房间允许列表和发送者允许列表。

保存配置后，Gateway 网关会热应用 `messages` 设置。只有在文件监视或配置重载被禁用时（`gateway.reload.mode: "off"`）才需要重启。

## 变更内容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 时：

- 未提及的已允许群组或渠道消息会变成安静的房间事件
- 已提及消息仍是用户请求
- 文本控制命令和原生命令仍是用户请求
- 中止或停止请求仍是用户请求
- 直接消息仍是用户请求

房间事件使用严格的可见投递。最终助手文本是私有的。智能体必须调用 `message(action=send)` 才能在房间中发布。

房间事件会继续抑制正在输入和生命周期状态反应。唯一显式回执例外是 `messages.ackReactionScope: "all"`，它会发送已配置的确认反应；当房间必须完全静默时，请使用任何更窄的范围或 `"off"`。

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

当只有一个频道应作为环境房间时，请使用按渠道的 Discord 配置。在 `groupPolicy: "allowlist"` 下，列出频道就是允许它（`enabled: false` 会禁用某个条目）：

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

Slack 频道允许列表优先使用 ID。请使用 `C12345678` 这样的频道 ID，而不是 `#channel-name`。在 `channels.slack.channels` 下列出频道就是允许它（`enabled: false` 会禁用某个条目）：

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

对于 Telegram 群组，机器人必须能够看到普通群组消息。如果 `requireMention: false`，请禁用 BotFather 隐私模式，或使用另一种能将完整群组流量投递给机器人的 Telegram 设置。

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

Telegram 群组 ID 通常是负数，例如 `-1001234567890`。可以从 `openclaw logs --follow` 读取 `chat.id`，将群组消息转发给 ID 辅助机器人，或检查 Bot API `getUpdates`。

## 智能体专属策略

当多个智能体共享同一个房间，但只有一个应将未提及闲聊视为环境上下文时，请使用智能体覆盖：

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

智能体专属的 `agents.list[].groupChat.unmentionedInbound` 值会覆盖该智能体的 `messages.groupChat.unmentionedInbound`。

## 可见回复模式

对于普通群组/渠道用户请求，`messages.groupChat.visibleReplies` 默认值为 `"automatic"`。当最终助手文本应在没有显式 message-tool 调用的情况下可见发布时，请保留该默认值。

对于环境常开房间，仍建议使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是配合 GPT 5.5 这类最新一代、工具调用可靠的模型。它让智能体通过调用消息工具来决定何时发言。如果模型返回最终文本却没有调用工具，OpenClaw 会将该最终文本保留为私有，并记录被抑制的投递元数据。

即使其他群组请求使用自动回复，房间事件也会保持严格模式。未提及的环境房间事件始终需要 `message(action=send)` 才能产生可见输出。

## 历史记录

`messages.groupChat.historyLimit` 设置全局群组历史记录默认值（未设置时为 50；必须是正整数）。渠道可以用 `channels.<channel>.historyLimit` 覆盖它，某些渠道还支持按账号的历史记录限制。将渠道级别的 `historyLimit: 0` 设为禁用该渠道的群组历史上下文。

支持房间事件的渠道会保留最近的环境房间消息作为上下文。Telegram 会保留一个始终开启的按群组滚动窗口，并受 `historyLimit` 限制；用户请求轮次会选择机器人最后一次已记录回复之后的条目，而房间事件轮次会收到完整的最近窗口，以便模型看到自己最近发布的内容。已废弃的 Telegram `includeGroupHistoryContext` 模式键会由 `openclaw doctor --fix` 移除。

## 故障排查

如果房间显示正在输入或 token 用量，但没有可见消息：

1. 确认房间已被渠道允许列表和发送者允许列表允许。
2. 确认 `requireMention: false` 已设置在你预期的房间级别。
3. 检查 `messages.groupChat.unmentionedInbound` 或智能体覆盖是否为 `"room_event"`。
4. 检查日志中是否有被抑制的最终载荷元数据或 `didSendViaMessagingTool: false`。
5. 对于普通群组请求，如果你希望最终回复自动发布，请保留或恢复 `messages.groupChat.visibleReplies: "automatic"`。对于使用 `message_tool` 的环境房间，请使用能可靠调用工具的模型/运行时。

如果 Telegram 环境房间完全没有触发，请检查 BotFather 隐私模式，并确认 Gateway 网关正在接收普通群组消息。

如果 Slack 环境房间没有触发，请确认频道键是 Slack 频道 ID，并且应用拥有该房间类型的历史记录权限范围：`channels:history`（公开）、`groups:history`（私有）或 `mpim:history`（多人私信）。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [Discord](/zh-CN/channels/discord)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
- [渠道故障排查](/zh-CN/channels/troubleshooting)
- [渠道配置参考](/zh-CN/gateway/config-channels)

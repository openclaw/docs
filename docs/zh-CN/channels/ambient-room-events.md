---
read_when:
    - 配置常驻群组或频道房间
    - 你希望智能体监听房间聊天，但不要自动发布最终文本
    - 调试没有可见房间消息时的输入状态和词元用量
sidebarTitle: Ambient room events
summary: 让受支持的群组聊天室提供静默上下文，除非智能体使用消息工具发送消息
title: 环境房间事件
x-i18n:
    generated_at: "2026-07-02T17:32:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ambient room events 让 OpenClaw 将未提及它的群组或渠道聊天作为安静上下文处理。智能体可以更新记忆和会话状态，但除非智能体显式调用 `message` 工具，否则房间会保持静默。

对于始终在线的群聊，这是推荐模式：将 `messages.groupChat.unmentionedInbound: "room_event"` 与 `messages.groupChat.visibleReplies: "message_tool"` 结合使用。当智能体应该监听、判断何时回复有用，并避免旧的回答 `NO_REPLY` 的提示词模式时，请使用它。

目前支持：Discord guild 渠道、Slack 渠道和私有渠道、Slack 多人私信，以及 Telegram 群组或超级群组。其他群组渠道会保持现有群组行为，除非它们的渠道页面说明支持 Ambient room events。

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

然后通过为该房间禁用提及门控，将房间本身配置为始终在线。该渠道仍必须通过其常规 `groupPolicy`、房间允许列表和发送者允许列表。

保存配置后，Gateway 网关会热重载 `messages` 设置。只有在文件监听或配置重载被禁用时才需要重启。

## 变化内容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 时：

- 未提及它的已允许群组或渠道消息会变成安静的房间事件
- 提及消息仍是用户请求
- 文本命令和原生命令仍是用户请求
- 中止或停止请求仍是用户请求
- 直接消息仍是用户请求

房间事件使用严格的可见投递。最终助手文本是私有的。智能体必须调用 `message(action=send)` 才能在房间中发布。

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

当只有一个渠道应该作为 ambient 时，请使用按渠道的 Discord 配置：

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Slack 渠道允许列表优先使用 ID。请使用 `C12345678` 这样的渠道 ID，而不是 `#channel-name`。

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
          allow: true,
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

Telegram 群组 ID 通常是负数，例如 `-1001234567890`。可以从 `openclaw logs --follow` 读取 `chat.id`，将群组消息转发给 ID 辅助 bot，或检查 Bot API `getUpdates`。

## 智能体特定策略

当多个智能体共享同一个房间，但只有一个智能体应该将未提及它的聊天视为 ambient 上下文时，请使用智能体覆盖：

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

对于普通群组/渠道用户请求，`messages.groupChat.visibleReplies` 默认是 `"automatic"`。当你希望最终助手文本无需显式 message-tool 调用即可可见发布时，请保留该默认值。

对于 ambient 始终在线房间，仍推荐使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是配合 GPT 5.5 等最新一代、工具调用可靠的模型。它让智能体通过调用消息工具来决定何时发言。如果模型在未调用工具的情况下返回最终文本，OpenClaw 会将该最终文本保持为私有，并记录被抑制的投递元数据。

即使其他群组请求使用自动回复，房间事件仍保持严格模式。未提及的 ambient 房间事件仍需要 `message(action=send)` 才能产生可见输出。

## 历史记录

`messages.groupChat.historyLimit` 控制全局群组历史记录默认值。渠道可以用 `channels.<channel>.historyLimit` 覆盖它，某些渠道还支持按账号的历史记录限制。

设置 `historyLimit: 0` 可禁用群组历史上下文。

支持 room-event 的渠道会保留最近的 ambient 房间消息作为上下文。Telegram 会保留一个始终在线、按群组滚动且受 `historyLimit` 限制的窗口；用户请求轮次会选择 bot 最后一次记录回复之后的条目，而 room-event 轮次会接收完整的最近窗口，使模型能看到自己最近发布的内容。已退役的 Telegram `includeGroupHistoryContext` 模式键会由 `openclaw doctor --fix` 移除。

## 故障排除

如果房间显示正在输入或产生 token 用量，但没有可见消息：

1. 确认该房间已被渠道允许列表和发送者允许列表允许。
2. 确认 `requireMention: false` 已设置在你预期的房间层级。
3. 检查 `messages.groupChat.unmentionedInbound` 或智能体覆盖是否为 `"room_event"`。
4. 检查日志中是否有被抑制的最终载荷元数据或 `didSendViaMessagingTool: false`。
5. 对于普通群组请求，如果你希望最终回复自动发布，请保留或恢复 `messages.groupChat.visibleReplies: "automatic"`。对于使用 `message_tool` 的 ambient 房间，请使用能可靠调用工具的模型/运行时。

如果 Telegram ambient 房间完全没有触发，请检查 BotFather 隐私模式，并确认 Gateway 网关正在接收普通群组消息。

如果 Slack ambient 房间没有触发，请确认渠道键是 Slack 渠道 ID，并且应用具备该房间类型所需的 `channels:history` 或 `groups:history` scope。

## 相关

- [群组](/zh-CN/channels/groups)
- [Discord](/zh-CN/channels/discord)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
- [渠道故障排除](/zh-CN/channels/troubleshooting)
- [频道配置参考](/zh-CN/gateway/config-channels)

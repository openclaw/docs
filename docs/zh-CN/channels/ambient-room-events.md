---
read_when:
    - 配置始终在线的群组或频道房间
    - 你希望智能体监听聊天室里的闲聊，但不要自动发布最终文本
    - 在没有可见房间消息时调试正在输入状态和 token 用量
sidebarTitle: Ambient room events
summary: 让受支持的群组房间提供安静上下文，除非智能体使用消息工具发送
title: 环境房间事件
x-i18n:
    generated_at: "2026-06-27T01:19:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

环境房间事件让 OpenClaw 将群组或渠道中未提及智能体的闲聊作为静默上下文处理。智能体可以更新记忆和会话状态，但除非智能体显式调用 `message` 工具，否则房间会保持静默。

对于持续开启的群聊，这是推荐模式：将 `messages.groupChat.unmentionedInbound: "room_event"` 与 `messages.groupChat.visibleReplies: "message_tool"` 结合使用。当智能体应该监听、判断何时回复有用，并避免旧的回答 `NO_REPLY` 提示词模式时使用它。

目前支持：Discord 服务器渠道、Slack 频道和私有频道、Slack 多人私信，以及 Telegram 群组或超级群组。其他群组渠道会保留其现有群组行为，除非其渠道页面说明支持环境房间事件。

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

然后通过禁用该房间的提及门控，将房间本身配置为持续开启。该渠道仍必须被其正常的 `groupPolicy`、房间允许列表和发送者允许列表允许。

保存配置后，Gateway 网关会热重载 `messages` 设置。只有在文件监听或配置重载被禁用时才需要重启。

## 变化内容

使用 `messages.groupChat.unmentionedInbound: "room_event"` 时：

- 允许的未提及群组或渠道消息会变成静默房间事件
- 提及消息仍是用户请求
- 文本命令和原生命令仍是用户请求
- 中止或停止请求仍是用户请求
- 直接消息仍是用户请求

房间事件使用严格的可见投递。最终智能体文本是私有的。智能体必须调用 `message(action=send)` 才会在房间中发布。

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

当只有一个频道应该作为环境房间时，使用按频道的 Discord 配置：

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

Slack 频道允许列表优先使用 ID。使用 `C12345678` 这样的频道 ID，而不是 `#channel-name`。

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

Telegram 群组 ID 通常是负数，例如 `-1001234567890`。从 `openclaw logs --follow` 读取 `chat.id`，将群组消息转发给 ID 辅助机器人，或检查 Bot API `getUpdates`。

## 智能体特定策略

当多个智能体共享同一个房间，但只有一个智能体应将未提及的闲聊作为环境上下文处理时，使用智能体覆盖：

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

对于普通群组/渠道用户请求，`messages.groupChat.visibleReplies` 默认是 `"automatic"`。当你希望最终智能体文本无需显式调用消息工具即可可见发布时，请保留该默认值。

对于环境持续开启房间，仍推荐使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是搭配 GPT 5.5 等最新一代、工具调用可靠的模型。它让智能体通过调用消息工具来决定何时发言。如果模型在未调用工具的情况下返回最终文本，OpenClaw 会将该最终文本保持私有，并记录被抑制的投递元数据。

即使其他群组请求使用自动回复，房间事件仍会保持严格模式。未提及的环境房间事件仍需要 `message(action=send)` 才能产生可见输出。

## 历史记录

`messages.groupChat.historyLimit` 控制全局群组历史默认值。渠道可以用 `channels.<channel>.historyLimit` 覆盖它，部分渠道还支持按账号设置历史限制。

设置 `historyLimit: 0` 可禁用群组历史上下文。

支持房间事件的渠道会将最近的环境房间消息保留为上下文。Discord 会保留房间事件历史，直到一次可见的 Discord 发送成功，因此静默上下文不会在消息工具投递前丢失。

## 故障排除

如果房间显示正在输入或有 token 使用量，但没有可见消息：

1. 确认该房间被渠道允许列表和发送者允许列表允许。
2. 确认 `requireMention: false` 已在你预期的房间层级设置。
3. 检查 `messages.groupChat.unmentionedInbound` 或智能体覆盖是否为 `"room_event"`。
4. 检查日志中是否有被抑制的最终载荷元数据或 `didSendViaMessagingTool: false`。
5. 对于普通群组请求，如果你希望最终回复自动发布，请保留或恢复 `messages.groupChat.visibleReplies: "automatic"`。对于使用 `message_tool` 的环境房间，请使用能可靠调用工具的模型/运行时。

如果 Telegram 环境房间完全未触发，请检查 BotFather 隐私模式，并确认 Gateway 网关正在接收普通群组消息。

如果 Slack 环境房间未触发，请确认频道键是 Slack 频道 ID，并且应用具备该房间类型所需的 `channels:history` 或 `groups:history` scope。

## 相关

- [群组](/zh-CN/channels/groups)
- [Discord](/zh-CN/channels/discord)
- [Slack](/zh-CN/channels/slack)
- [Telegram](/zh-CN/channels/telegram)
- [频道故障排除](/zh-CN/channels/troubleshooting)
- [频道配置参考](/zh-CN/gateway/config-channels)

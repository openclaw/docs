---
read_when:
    - 配置由 Bot 撰写的渠道消息
    - 调整机器人间循环保护机制
sidebarTitle: Bot loop protection
summary: Bot 间循环保护默认设置与渠道覆盖设置
title: 机器人循环保护
x-i18n:
    generated_at: "2026-07-11T20:18:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw 可以接收由其他机器人在支持 `allowBots` 的渠道中发送的消息。启用此路径后，机器人对循环保护可防止两个机器人身份无限地相互回复。

此防护由核心入站回复运行器执行。每个受支持的渠道都会将其入站事件映射为通用事实：账户或作用域、对话 ID、发送方机器人 ID 和接收方机器人 ID。核心会双向跟踪参与者对（A 到 B 与 B 到 A 视为同一对），应用滑动窗口配额，并在超出配额后于冷却期内抑制该机器人对。

## 默认值

只要渠道允许机器人发出的消息进入分发流程，机器人对循环保护就会生效。内置默认值：

| 键                   | 默认值 | 含义                                         |
| -------------------- | ------ | -------------------------------------------- |
| `enabled`            | `true` | 对支持此防护的渠道启用防护。                 |
| `maxEventsPerWindow` | `20`   | 机器人对在窗口内可交换的事件数。             |
| `windowSeconds`      | `60`   | 滑动窗口长度。                               |
| `cooldownSeconds`    | `60`   | 机器人对超出配额后的抑制时长。               |

此防护不影响人类发出的消息、单机器人部署、自身消息过滤，也不影响未超出配额的机器人回复。

## 配置共享默认值

设置一次 `channels.defaults.botLoopProtection`，即可为每个受支持的渠道提供相同的基准配置。你仍可通过渠道、账户和房间级覆盖来调整各个入口。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

仅当你的渠道策略明确允许机器人之间进行对话且不需要自动抑制时，才设置 `enabled: false`。

## 按渠道、账户或房间覆盖

受支持的渠道会逐键将自身配置叠加到共享默认配置之上。优先级如下，范围最窄者优先：

1. 当渠道支持按对话覆盖时，使用 `channels.<channel>.<room-or-space>.botLoopProtection`
2. 当渠道支持账户时，使用 `channels.<channel>.accounts.<account>.botLoopProtection`
3. 当渠道支持顶层默认值时，使用 `channels.<channel>.botLoopProtection`
4. `channels.defaults.botLoopProtection`
5. 内置默认值

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## 渠道支持

- Discord：使用原生 `author.bot` 事实，并按 Discord 账户、频道和机器人对进行区分。
- Google Chat：对已接受的机器人消息使用原生 `sender.type=BOT` 事实，并按账户、空间和机器人对进行区分。
- Matrix：使用已配置的 Matrix 机器人账户，并按 Matrix 账户、房间和已配置的机器人对进行区分。
- Slack：对已接受的机器人消息使用原生 `bot_id` 事实，并按 Slack 账户、频道和机器人对进行区分。

无法公开可靠入站机器人身份的渠道会继续使用其常规的自身消息和访问策略过滤器。在能够识别机器人对中的两个参与者之前，这些渠道不应启用此防护。

有关插件实现详情，请参阅 [SDK 运行时](/zh-CN/plugins/sdk-runtime#reusable-runtime-utilities)。

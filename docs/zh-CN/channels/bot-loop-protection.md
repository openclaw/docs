---
read_when:
    - 配置由机器人撰写的渠道消息
    - 调整机器人到机器人循环保护
sidebarTitle: Bot loop protection
summary: Bot 到 Bot 循环保护默认值和渠道覆盖
title: 机器人循环保护
x-i18n:
    generated_at: "2026-07-05T11:01:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw 可以接收由其他机器人在支持 `allowBots` 的渠道上写入的消息。启用该路径后，配对循环保护会防止两个机器人身份无限期地相互回复。

该保护由核心入站回复运行器执行。每个支持的渠道都会把自己的入站事件映射为通用事实：账号或范围、对话 ID、发送方机器人 ID 和接收方机器人 ID。核心会双向跟踪参与者配对（A 到 B 和 B 到 A 算作同一配对）、应用滑动窗口预算，并在超过预算后于冷却期内抑制该配对。

## 默认值

每当某个渠道允许机器人编写的消息进入分发时，配对循环保护都会生效。内置默认值：

| 键                   | 默认值  | 含义                                                |
| -------------------- | ------- | --------------------------------------------------- |
| `enabled`            | `true`  | 对支持它的渠道启用保护。                            |
| `maxEventsPerWindow` | `20`    | 一个机器人配对在窗口内可以交换的事件数。            |
| `windowSeconds`      | `60`    | 滑动窗口长度。                                      |
| `cooldownSeconds`    | `60`    | 配对超过预算后的抑制时间。                          |

该保护不会影响人类编写的消息、单机器人部署、自消息过滤，或保持在预算以内的机器人回复。

## 配置共享默认值

设置一次 `channels.defaults.botLoopProtection`，即可为每个支持的渠道提供相同基线。渠道、账号和房间级覆盖仍然可以调整单独的表面。

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

仅当你的渠道策略有意允许机器人之间的对话且不进行自动抑制时，才设置 `enabled: false`。

## 按渠道、账号或房间覆盖

支持的渠道会逐键将自己的配置叠加在共享默认值之上。优先级从最窄到最宽：

1. `channels.<channel>.<room-or-space>.botLoopProtection`，当渠道支持按对话覆盖时
2. `channels.<channel>.accounts.<account>.botLoopProtection`，当渠道支持账号时
3. `channels.<channel>.botLoopProtection`，当渠道支持顶层默认值时
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

- Discord：原生 `author.bot` 事实，按 Discord 账号、渠道和机器人配对作为键。
- Google Chat：对已接受的机器人编写消息使用原生 `sender.type=BOT` 事实，按账号、空间和机器人配对作为键。
- Matrix：已配置的 Matrix 机器人账号，按 Matrix 账号、房间和已配置的机器人配对作为键。
- Slack：对已接受的机器人编写消息使用原生 `bot_id` 事实，按 Slack 账号、渠道和机器人配对作为键。

不会公开可靠入站机器人身份的渠道会继续使用其正常的自消息和访问策略过滤器。在它们能够识别机器人配对中的两个参与者之前，不应选择启用此保护。

有关插件实现细节，请参阅 [SDK runtime](/zh-CN/plugins/sdk-runtime#reusable-runtime-utilities)。

---
read_when:
    - 你希望一个活跃会话的回复从 Telegram 转移到 Discord、Slack、Mattermost 或另一个已关联渠道
    - 你正在配置 session.identityLinks，用于跨渠道私信
    - /dock 命令提示发送者未关联，或不存在活动会话
summary: 在已关联的聊天渠道之间移动一个 OpenClaw 会话的回复路由
title: 渠道对接
x-i18n:
    generated_at: "2026-07-05T11:12:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

渠道停靠是一个 OpenClaw 会话的呼叫转发。它会保持同一个
对话上下文，但会改变该会话未来回复的投递位置。停靠只能从直接聊天发起；它不会在群聊中运行。

## 示例

Alice 可以在 Telegram 和 Discord 上给 OpenClaw 发消息：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

如果 Alice 从 Telegram 直接聊天中发送：

```text
/dock_discord
```

OpenClaw 会保留当前会话上下文并更改回复路由：

| 停靠前                       | `/dock_discord` 后          |
| ---------------------------- | --------------------------- |
| 回复发送到 Telegram `123` | 回复发送到 Discord `456` |

会话不会被重新创建。转录历史仍附加在同一个
会话上。

## 使用场景

当任务从一个聊天应用开始，但接下来的回复应送达
其他位置时，使用停靠。

常见流程：

1. 从 Telegram 启动智能体任务。
2. 切换到你正在协调工作的 Discord。
3. 从 Telegram 直接聊天发送 `/dock_discord`。
4. 保持同一个 OpenClaw 会话，但在 Discord 中接收未来回复。

## 必需配置

停靠需要 `session.identityLinks`。来源发送者和目标对等方
必须在同一个身份组中：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

这些值是带渠道前缀的对等方 ID：

| 值             | 含义                         |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram 发送者 ID `123`     |
| `discord:456`  | Discord 直接对等方 ID `456` |
| `slack:U123`   | Slack 用户 ID `U123`         |

规范键名（上面的 `alice`）只是共享身份组名称。停靠
命令使用带渠道前缀的值来证明来源发送者和
目标对等方是同一个人。

## 命令

OpenClaw 会为每个支持原生命令的已加载渠道插件生成一个 `/dock-<channel>` 命令，
因此列表会随着插件添加而增长。当前支持它的内置
插件：

| 目标渠道 | 命令               | 别名               |
| -------------- | ------------------ | ------------------ |
| Discord        | `/dock-discord`    | `/dock_discord`    |
| Mattermost     | `/dock-mattermost` | `/dock_mattermost` |
| Slack          | `/dock-slack`      | `/dock_slack`      |
| Telegram       | `/dock-telegram`   | `/dock_telegram`   |

下划线形式也是 Telegram 这类直接暴露斜杠命令的界面上的
原生命令名称。

## 会改变什么

停靠会更新活动会话的投递字段：

| 会话字段        | `/dock_discord` 后的示例              |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | 目标渠道账号，或 `default` |

这些字段会持久化到会话存储中，并被该会话后续的回复
投递使用。

## 不会改变什么

停靠不会：

- 创建渠道账号
- 连接新的 Discord、Telegram、Slack 或 Mattermost Bot
- 向用户授予访问权限
- 绕过渠道允许列表或私信策略
- 将转录历史移动到另一个会话
- 让无关用户共享一个会话

它只会更改当前会话的投递路由。

## 故障排查

**命令提示发送者未链接。**

将当前发送者和目标对等方都添加到同一个
`session.identityLinks` 组。例如，如果 Telegram 发送者 `123` 应停靠
到 Discord 对等方 `456`，请同时包含 `telegram:123` 和 `discord:456`。

**命令提示停靠只能从直接聊天使用。**

请从与 OpenClaw 的直接聊天发送停靠命令，而不是从群聊发送。

**命令提示不存在活动会话。**

请从现有的直接聊天会话停靠。该命令需要一个活动会话
条目，以便持久化新路由。

**回复仍然发往旧渠道。**

检查命令是否回复了成功消息，并确认目标
对等方 ID 与该渠道使用的 ID 匹配。停靠只会更改活动
会话路由；另一个会话仍可能路由到其他位置。

**我需要切换回来。**

从已链接的发送者发送原始渠道对应的命令，例如 `/dock_telegram` 或
`/dock-telegram`。

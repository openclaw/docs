---
read_when:
    - 你希望将某个活动会话的回复从 Telegram 移动到 Discord、Slack、Mattermost 或其他已关联的渠道。
    - 你正在为跨渠道私信配置 `session.identityLinks`。
    - '`/dock` 命令提示发送者未关联，或不存在活动会话。'
summary: 在已关联的聊天渠道之间移动某个 OpenClaw 会话的回复路由
title: 渠道停靠
x-i18n:
    generated_at: "2026-04-27T21:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 15
---

渠道停靠是对单个 OpenClaw 会话的呼叫转移。

它会保留相同的对话上下文，但会更改该会话未来回复的投递位置。

## 示例

Alice 可以在 Telegram 和 Discord 上向 OpenClaw 发送消息：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

如果 Alice 从 Telegram 发送以下命令：

```text
/dock_discord
```

OpenClaw 会保留当前会话上下文，并更改回复路由：

| 停靠前 | 执行 `/dock_discord` 后 |
| ---------------------------- | --------------------------- |
| 回复发送到 Telegram `123` | 回复发送到 Discord `456` |

会话不会被重新创建。转录历史会继续附加在同一个会话上。

## 为什么要使用它

当任务从一个聊天应用开始，但接下来的回复应该发送到别处时，请使用渠道停靠。

常见流程：

1. 从 Telegram 启动一个智能体任务。
2. 移动到你正在协调工作的 Discord。
3. 在 Telegram 会话中发送 `/dock_discord`。
4. 保持相同的 OpenClaw 会话，但在 Discord 中接收后续回复。

## 必需配置

停靠需要 `session.identityLinks`。源发送者和目标对端必须位于同一个身份组中：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

这些值是带有渠道前缀的对端 id：

| 值 | 含义 |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram 发送者 id `123` |
| `discord:456`  | Discord 私聊对端 id `456` |
| `slack:U123`   | Slack 用户 id `U123` |

规范键名（上例中的 `alice`）只是共享身份组名称。停靠命令使用带渠道前缀的值来证明源发送者和目标对端是同一个人。

## 命令

停靠命令由已加载且支持原生命令的渠道插件生成。当前内置命令：

| 目标渠道 | 命令 | 别名 |
| -------------- | ------------------ | ------------------ |
| Discord        | `/dock-discord`    | `/dock_discord`    |
| Mattermost     | `/dock-mattermost` | `/dock_mattermost` |
| Slack          | `/dock-slack`      | `/dock_slack`      |
| Telegram       | `/dock-telegram`   | `/dock_telegram`   |

下划线别名在 Telegram 等原生命令界面中特别有用。

## 会更改什么

停靠会更新活动会话的投递字段：

| 会话字段 | `/dock_discord` 之后的示例 |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | 目标渠道账户，或 `default` |

这些字段会持久化到会话存储中，并用于该会话后续的回复投递。

## 不会更改什么

停靠不会：

- 创建渠道账户
- 连接新的 Discord、Telegram、Slack 或 Mattermost 机器人
- 向用户授予访问权限
- 绕过渠道 allowlist 或私信策略
- 将转录历史移动到另一个会话
- 让无关用户共享一个会话

它只会更改当前会话的投递路由。

## 故障排除

**命令提示发送者未关联。**

请将当前发送者和目标对端都添加到同一个 `session.identityLinks` 组中。例如，如果 Telegram 发送者 `123` 应停靠到 Discord 对端 `456`，请同时包含 `telegram:123` 和 `discord:456`。

**命令提示不存在活动会话。**

请从现有的私聊会话中执行停靠。该命令需要一个活动会话条目，才能持久化新路由。

**回复仍然发送到旧渠道。**

检查该命令是否返回了成功消息，并确认目标对端 id 与该渠道使用的 id 一致。停靠只会更改活动会话路由；另一个会话仍可能路由到其他位置。

**我需要切换回去。**

从已关联的发送者处发送原始渠道对应的命令，例如 `/dock_telegram` 或 `/dock-telegram`。

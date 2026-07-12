---
read_when:
    - 你希望将一个活跃会话的回复从 Telegram 转移到 Discord、Slack、Mattermost 或其他已关联的渠道
    - 你正在为跨渠道私信配置 `session.identityLinks`
    - /dock 命令提示发送者尚未关联，或不存在活动会话
summary: 在已关联的聊天渠道之间移动某个 OpenClaw 会话的回复路由
title: 渠道对接
x-i18n:
    generated_at: "2026-07-11T20:28:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

频道停靠相当于为一个 OpenClaw 会话设置呼叫转移。它会保留相同的对话上下文，但改变该会话后续回复的投递位置。停靠只能从私信发起；无法从群聊中执行。

## 示例

Alice 可以通过 Telegram 和 Discord 向 OpenClaw 发送消息：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

如果 Alice 从 Telegram 私信发送：

```text
/dock_discord
```

OpenClaw 会保留当前会话上下文并更改回复路由：

| 停靠前                        | 执行 `/dock_discord` 后   |
| ----------------------------- | ------------------------- |
| 回复发送到 Telegram `123`     | 回复发送到 Discord `456`  |

会话不会重新创建。对话记录仍附属于同一个会话。

## 使用场景

当任务从一个聊天应用开始，但接下来的回复需要投递到其他位置时，可以使用停靠功能。

常见流程：

1. 从 Telegram 启动一项智能体任务。
2. 转到正在协调工作的 Discord。
3. 从 Telegram 私信发送 `/dock_discord`。
4. 继续使用同一个 OpenClaw 会话，但在 Discord 中接收后续回复。

## 必需配置

停靠需要配置 `session.identityLinks`。来源发送者和目标对等方必须位于同一个身份组中：

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
| `discord:456`  | Discord 私信对等方 ID `456`  |
| `slack:U123`   | Slack 用户 ID `U123`         |

规范键（上例中的 `alice`）只是共享身份组的名称。停靠命令使用带渠道前缀的值来证明来源发送者与目标对等方是同一个人。

## 命令

OpenClaw 会为每个支持原生命令且已加载的渠道插件生成一个 `/dock-<channel>` 命令，因此命令列表会随着插件的添加而增长。目前支持此功能的内置插件包括：

| 目标渠道   | 命令               | 别名               |
| ---------- | ------------------ | ------------------ |
| Discord    | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack      | `/dock-slack`      | `/dock_slack`      |
| Telegram   | `/dock-telegram`   | `/dock_telegram`   |

在 Telegram 等直接提供斜杠命令的界面上，下划线形式也是原生命令名称。

## 发生的变化

停靠会更新活动会话的投递字段：

| 会话字段        | 执行 `/dock_discord` 后的示例        |
| --------------- | ------------------------------------ |
| `lastChannel`   | `discord`                            |
| `lastTo`        | `456`                                |
| `lastAccountId` | 目标渠道账户，或 `default`           |

这些字段会持久化到会话存储中，并用于该会话后续回复的投递。

## 不会发生的变化

停靠不会：

- 创建渠道账户
- 连接新的 Discord、Telegram、Slack 或 Mattermost Bot
- 向用户授予访问权限
- 绕过渠道允许列表或私信策略
- 将对话记录移至另一个会话
- 让无关用户共享会话

它只会更改当前会话的投递路由。

## 故障排查

**命令提示发送者尚未关联。**

将当前发送者和目标对等方添加到同一个 `session.identityLinks` 组中。例如，如果 Telegram 发送者 `123` 应停靠到 Discord 对等方 `456`，请同时包含 `telegram:123` 和 `discord:456`。

**命令提示停靠功能只能从私信使用。**

请从与 OpenClaw 的私信发送停靠命令，而不是从群聊发送。

**命令提示不存在活动会话。**

请从现有私信会话执行停靠。该命令需要一个活动会话条目，以便持久化新路由。

**回复仍发送到原来的渠道。**

检查命令是否返回了成功消息，并确认目标对等方 ID 与该渠道使用的 ID 一致。停靠只会更改活动会话的路由；其他会话可能仍会路由到其他位置。

**我需要切换回去。**

从已关联的发送者发送原渠道对应的命令，例如 `/dock_telegram` 或 `/dock-telegram`。

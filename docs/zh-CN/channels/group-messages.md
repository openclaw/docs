---
read_when:
    - 更改群组消息规则或提及方式
summary: WhatsApp 群组消息处理的行为与配置（mentionPatterns 在各个界面间共享）
title: 群组消息
x-i18n:
    generated_at: "2026-04-05T08:14:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2543be5bc4c6f188f955df580a6fef585ecbfc1be36ade5d34b1a9157e021bc5
    source_path: channels/group-messages.md
    workflow: 15
---

# 群组消息（WhatsApp web 渠道）

目标：让 Clawd 能待在 WhatsApp 群组中，仅在被提及时唤醒，并将该线程与个人私信会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也用于 Telegram/Discord/Slack/iMessage；本文档重点介绍 WhatsApp 特有的行为。对于多智能体设置，请为每个智能体设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

## 当前实现（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一次提及（真实的 WhatsApp @ 提及，通过 `mentionedJids`、安全的正则模式，或文本中任意位置出现的机器人的 E.164 号码）。`always` 会在每条消息上唤醒智能体，但它应仅在能提供有意义价值时回复；否则返回精确的静默令牌 `NO_REPLY` / `no_reply`。默认值可在配置中通过 `channels.whatsapp.groups` 设置，并可通过 `/activation` 按群组覆盖。当设置了 `channels.whatsapp.groups` 时，它也会充当群组 allowlist（包含 `"*"` 可允许所有群组）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认值为 `allowlist`（在你添加发送者前会被阻止）。
- 按群组划分的会话：会话键类似 `agent:<agentId>:whatsapp:group:<jid>`，因此像 `/verbose on` 或 `/think high` 这样的命令（作为独立消息发送）会限定在该群组内；个人私信状态不会受到影响。Heartbeat 会跳过群组线程。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）中，_未_触发运行的消息会以 `[Chat messages since your last reply - for context]` 为前缀注入，而触发消息会放在 `[Current message - respond to this]` 下。已经在会话中的消息不会再次注入。
- 发送者显示：每个群组批次现在都会以 `[from: Sender Name (+E164)]` 结束，以便 Pi 知道是谁在发言。
- 阅后即焚 / 查看一次：我们会先解包这些消息，再提取文本/提及，因此其中的提及仍可触发。
- 群组系统提示词：在群组会话的第一轮（以及每次 `/activation` 更改模式时），我们会向系统提示词注入一段简短说明，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.`。如果元数据不可用，我们仍会告诉智能体这是一个群聊。

## 配置示例（WhatsApp）

向 `~/.openclaw/openclaw.json` 添加一个 `groupChat` 代码块，这样即使 WhatsApp 从文本正文中去掉了可见的 `@`，显示名提及仍然能生效：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

说明：

- 这些正则表达式不区分大小写，并使用与其他配置正则界面相同的安全正则防护规则；无效模式和不安全的嵌套重复会被忽略。
- 当有人点按联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范提及，因此号码回退很少需要，但作为安全兜底仍然很有用。

### 激活命令（仅限所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，或在未设置时为机器人自己的 E.164 号码）可以更改此设置。在群组中以独立消息发送 `/status` 可查看当前激活模式。

## 使用方法

1. 将你的 WhatsApp 账户（运行 OpenClaw 的那个）添加到群组中。
2. 说 `@openclaw …`（或包含该号码）。除非你将 `groupPolicy` 设为 `"open"`，否则只有在 allowlist 中的发送者才能触发它。
3. 智能体提示词将包含最近的群组上下文以及尾部的 `[from: …]` 标记，以便它能回应正确的人。
4. 会话级指令（`/verbose on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅适用于该群组的会话；请将它们作为独立消息发送，以便正确注册。你的个人私信会话保持独立。

## 测试 / 验证

- 手动冒烟测试：
  - 在群组中发送一个 `@openclaw` 提及，并确认回复中引用了发送者姓名。
  - 发送第二次提及，并验证历史记录代码块已包含，然后会在下一轮被清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行），查看显示 `from: <groupJid>` 和 `[from: …]` 后缀的 `inbound web message` 条目。

## 已知注意事项

- 为避免噪声广播，Heartbeat 会有意跳过群组。
- 回显抑制使用组合后的批次字符串；如果你连续两次发送相同文本且不带提及，只有第一次会收到回复。
- 会话存储条目会在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认位于 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；如果缺少该条目，只表示该群组尚未触发运行。
- 群组中的输入状态指示器遵循 `agents.defaults.typingMode`（默认值：未被提及时为 `message`）。

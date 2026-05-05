---
read_when:
    - 专门配置 WhatsApp 群组
    - 更改 WhatsApp 激活模式（`mention` 与 `always`）
    - 调整 WhatsApp 群组会话键或待处理消息上下文
sidebarTitle: WhatsApp groups
summary: WhatsApp 群组消息处理 — 激活、允许列表、会话和上下文注入
title: WhatsApp 群组消息
x-i18n:
    generated_at: "2026-05-05T16:51:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fa520f0722d804bba253c9ad72d821234d4a27801badb0d7d4c2ca3ea51bec9
    source_path: channels/group-messages.md
    workflow: 16
---

对于跨渠道群组模型（Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo），请参见[群组](/zh-CN/channels/groups)。本页介绍该模型之上的 WhatsApp 特定行为：激活、群组允许列表、按群组划分的会话键，以及待处理消息上下文注入。

目标：让 OpenClaw 驻留在 WhatsApp 群组中，仅在被提及时唤醒，并将该线程与个人私信会话分开。

<Note>
`agents.list[].groupChat.mentionPatterns` 也由 Telegram、Discord、Slack 和 iMessage 使用。对于多智能体设置，请按智能体进行设置，或使用 `messages.groupChat.mentionPatterns` 作为全局回退。
</Note>

## 行为

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一次提示（通过 `mentionedJids` 的真实 WhatsApp @ 提及、安全正则模式，或文本中任意位置的机器人的 E.164 号码）。`always` 会在每条消息上唤醒智能体，但它只有在能提供有意义价值时才应回复；否则返回精确的静默令牌 `NO_REPLY` / `no_reply`。默认值可以在配置中设置（`channels.whatsapp.groups`），并可通过 `/activation` 按群组覆盖。当设置了 `channels.whatsapp.groups` 时，它也会作为群组允许列表（包含 `"*"` 表示允许所有群组）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认值是 `allowlist`（在你添加发送者之前会被阻止）。
- 按群组划分的会话：会话键形如 `agent:<agentId>:whatsapp:group:<jid>`，因此 `/verbose on`、`/trace on` 或 `/think high`（作为独立消息发送）等命令会限定在该群组范围内；个人私信状态不会受影响。群组线程会跳过 Heartbeat。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）中，_未_触发运行的消息会以 `[Chat messages since your last reply - for context]` 为前缀注入，触发行位于 `[Current message - respond to this]` 下方。已经在会话中的消息不会被重新注入。
- 发送者呈现：每个群组批次现在都会以 `[from: Sender Name (+E164)]` 结尾，因此 Pi 知道是谁在发言。
- 临时/阅后即焚：我们会先展开这些消息，再提取文本/提及，因此其中的提示仍会触发。
- 群组系统提示：在群组会话的第一轮（以及每次 `/activation` 更改模式时），我们会向系统提示中注入一段简短说明，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果元数据不可用，我们仍会告诉智能体这是群聊。

## 配置示例（WhatsApp）

向 `~/.openclaw/openclaw.json` 添加一个 `groupChat` 块，这样即使 WhatsApp 从文本正文中去掉可视化的 `@`，显示名称提示也能生效：

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

注意：

- 这些正则表达式不区分大小写，并使用与其他配置正则表面相同的安全正则护栏；无效模式和不安全的嵌套重复会被忽略。
- 当有人点按联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范提及，因此号码回退很少需要，但它是一个有用的安全网。

### 激活命令（仅所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，未设置时则为机器人的自身 E.164 号码）可以更改此设置。在群组中将 `/status` 作为独立消息发送，以查看当前激活模式。

## 使用方法

1. 将你的 WhatsApp 账号（运行 OpenClaw 的那个账号）加入群组。
2. 发送 `@openclaw …`（或包含号码）。除非你设置 `groupPolicy: "open"`，否则只有允许列表中的发送者可以触发它。
3. 智能体提示将包含最近的群组上下文以及尾随的 `[from: …]` 标记，以便它可以称呼正确的人。
4. 会话级指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只适用于该群组的会话；请将它们作为独立消息发送，以便被注册。你的个人私信会话保持独立。

## 测试 / 验证

- 手动冒烟测试：
  - 在群组中发送一次 `@openclaw` 提示，并确认回复引用了发送者姓名。
  - 发送第二次提示，并验证历史块已包含，然后在下一轮被清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行）以查看 `inbound web message` 条目，其中显示 `from: <groupJid>` 和 `[from: …]` 后缀。

## 已知注意事项

- 群组会刻意跳过 Heartbeat，以避免产生嘈杂的广播。
- 回声抑制使用合并后的批次字符串；如果你连续发送两次相同文本且没有提及，只有第一次会收到响应。
- 会话存储条目会在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认位于 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少条目仅表示该群组尚未触发过运行。
- 群组中的输入指示器遵循 `agents.defaults.typingMode`。当可见回复使用默认的仅消息工具模式时，默认会立即开始显示正在输入，因此即使没有发布自动最终回复，群组成员也能看到智能体正在工作。显式的输入模式配置仍然优先生效。

## 相关

- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [广播群组](/zh-CN/channels/broadcast-groups)

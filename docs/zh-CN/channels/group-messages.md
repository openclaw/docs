---
read_when:
    - 更改群组消息规则或提及
summary: WhatsApp 群组消息处理的行为和配置（mentionPatterns 在各个界面中共享）
title: 群组消息
x-i18n:
    generated_at: "2026-04-28T11:44:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

目标：让 Clawd 待在 WhatsApp 群组里，只在被 ping 时唤醒，并让该线程与个人私信会话保持分离。

<Note>
`agents.list[].groupChat.mentionPatterns` 也被 Telegram、Discord、Slack 和 iMessage 使用。本文档重点说明 WhatsApp 特定行为。对于多智能体设置，请为每个智能体设置 `agents.list[].groupChat.mentionPatterns`，或使用 `messages.groupChat.mentionPatterns` 作为全局回退。
</Note>

## 当前实现（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一次 ping（通过 `mentionedJids` 实现的真实 WhatsApp @ 提及、安全的正则模式，或文本中任意位置出现机器人的 E.164 号码）。`always` 会在每条消息上唤醒智能体，但它只应在能提供有意义价值时回复；否则返回精确的静默令牌 `NO_REPLY` / `no_reply`。默认值可在配置（`channels.whatsapp.groups`）中设置，并可通过 `/activation` 按群组覆盖。设置 `channels.whatsapp.groups` 时，它也会作为群组允许列表（包含 `"*"` 以允许全部群组）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认是 `allowlist`（在添加发送者前阻止）。
- 按群组划分的会话：会话键形如 `agent:<agentId>:whatsapp:group:<jid>`，因此 `/verbose on`、`/trace on` 或 `/think high`（作为独立消息发送）等命令会限定到该群组；个人私信状态不会被触碰。群组线程会跳过心跳。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）中，_没有_ 触发运行的消息会以 `[Chat messages since your last reply - for context]` 为前缀注入，触发行位于 `[Current message - respond to this]` 下。已经在会话中的消息不会被重复注入。
- 发送者呈现：每个群组批次现在都会以 `[from: Sender Name (+E164)]` 结尾，这样 Pi 能知道是谁在说话。
- 临时/阅后即焚：我们会先解包这些消息，再提取文本/提及，因此其中的 ping 仍会触发。
- 群组系统提示词：在群组会话的第一轮（以及每次 `/activation` 更改模式时），我们会向系统提示词注入一段简短说明，例如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果元数据不可用，我们仍会告知智能体这是群组聊天。

## 配置示例（WhatsApp）

向 `~/.openclaw/openclaw.json` 添加一个 `groupChat` 块，这样即使 WhatsApp 去掉文本正文中的可见 `@`，显示名称 ping 也能工作：

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

- 这些正则表达式不区分大小写，并使用与其他配置正则表面相同的安全正则防护；无效模式和不安全的嵌套重复会被忽略。
- 当有人点按联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范化提及，因此号码回退很少需要，但它是有用的安全网。

### 激活命令（仅所有者）

使用群组聊天命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，未设置时为机器人自己的 E.164 号码）可以更改此设置。在群组中将 `/status` 作为独立消息发送，即可查看当前激活模式。

## 如何使用

1. 将你的 WhatsApp 账号（运行 OpenClaw 的那个）添加到群组。
2. 说 `@openclaw …`（或包含号码）。除非你设置 `groupPolicy: "open"`，否则只有允许列表中的发送者可以触发它。
3. 智能体提示词会包含最近的群组上下文，以及末尾的 `[from: …]` 标记，以便它能称呼正确的人。
4. 会话级指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只适用于该群组的会话；请将它们作为独立消息发送，以便被注册。你的个人私信会话保持独立。

## 测试 / 验证

- 手动冒烟测试：
  - 在群组中发送一次 `@openclaw` ping，并确认回复引用了发送者名称。
  - 发送第二次 ping，并验证历史块已包含，然后在下一轮被清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行），查看 `inbound web message` 条目，其中显示 `from: <groupJid>` 和 `[from: …]` 后缀。

## 已知注意事项

- 群组会有意跳过心跳，以避免嘈杂的广播。
- 回声抑制使用合并后的批次字符串；如果你连续两次发送相同文本且没有提及，只有第一次会得到响应。
- 会话存储条目会在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认位于 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少条目只表示该群组尚未触发过运行。
- 群组中的输入状态指示器遵循 `agents.defaults.typingMode`。当可见回复使用默认的仅消息工具模式时，默认会立即开始显示输入状态，因此即使没有发布自动最终回复，群组成员也能看到智能体正在工作。显式的输入模式配置仍优先。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [广播群组](/zh-CN/channels/broadcast-groups)

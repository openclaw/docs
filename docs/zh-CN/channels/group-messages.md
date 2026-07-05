---
read_when:
    - 专门配置 WhatsApp 群组
    - 更改 WhatsApp 激活模式（`mention` 与 `always`）
    - 调整 WhatsApp 群组会话键或待处理消息上下文
sidebarTitle: WhatsApp groups
summary: WhatsApp 群组消息处理 — 激活、允许列表、会话和上下文注入
title: WhatsApp 群组消息
x-i18n:
    generated_at: "2026-07-05T11:02:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdc16719e33ed5532e9bc11b195fa1b2d79910ae476d8201adcc9507bbfa1b29
    source_path: channels/group-messages.md
    workflow: 16
---

有关跨渠道群组模型（Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、Zalo），请参阅[群组](/zh-CN/channels/groups)。本页介绍该模型之上的 WhatsApp 特定行为：激活、群组允许列表、按群组划分的会话键，以及待处理消息上下文注入。

目标：让 OpenClaw 驻留在 WhatsApp 群组中，只在被提及时唤醒，并将该线程与个人私信会话分开。

<Note>
`agents.list[].groupChat.mentionPatterns` 与其他渠道的提及门控共享。对于多 Agent 设置，请按 Agent 设置它，或使用 `messages.groupChat.mentionPatterns` 作为全局回退。两者都未设置时，模式会从 Agent 身份名称/emoji 派生。
</Note>

## 行为

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一次提及：真实的 WhatsApp @ 提及（`mentionedJids`）、已配置的正则模式、文本中任意位置出现的 bot 的 E.164 数字，或对 bot 某条消息的引用回复（共享号码自聊设置除外）。`always` 会在每条消息上唤醒 Agent，但注入的群组提示会告知它只在有价值时回复，否则返回精确的静默令牌 `NO_REPLY`（不区分大小写）。默认值来自配置（`channels.whatsapp.groups` `requireMention`），并且可通过 `/activation` 按群组覆盖。
- 群组允许列表：设置 `channels.whatsapp.groups` 时，只接收列出的群组 JID（包含 `"*"` 表示允许全部）；来自未列出群组的消息会被丢弃，并带有日志提示。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认值为 `allowlist`（在你添加发送者前会阻止）。
- 按群组划分的会话：会话键形如 `agent:<agentId>:whatsapp:group:<jid>`（非默认账号会追加 `:thread:whatsapp-account-<accountId>`），因此 `/verbose on`、`/trace on` 或 `/think high`（作为独立消息发送）等指令仅作用于该群组；个人私信状态不会被触及。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）中，_未_触发运行的消息会以前缀 `[Chat messages since your last reply - for context]` 注入，触发行位于 `[Current message - respond to this]` 下。待处理窗口会在运行后清空；已在会话中的消息不会再次注入。
- 发送者归因：每条群组行都会在消息信封中携带发送者标签，例如 `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`，发送者身份以及群组主题/成员会一并放入不受信任的 conversation-metadata 块中。
- 临时/阅后即焚：包装器会先被解包再提取文本/提及，因此其中的提及仍会触发。
- 群组系统提示：群组会话的第一轮（以及 `/activation` 更改模式后的任意轮次）会向系统提示中注入激活指导（`Activation: trigger-only ...` 或 `Activation: always-on ...`，并加上“针对具体发送者回应”）。持久的群聊投递指导（“你在 WhatsApp 群聊中...”）始终会包含。

## 配置示例（WhatsApp）

让显示名称提及在 WhatsApp 从文本正文中去掉可见 `@` 时仍能工作：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // pending group context window (default 50)
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

说明：

- 正则不区分大小写，并使用与其他配置正则表面相同的 safe-regex 防护；无效模式和不安全的嵌套重复会被忽略。
- 当有人点按联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范提及，因此数字回退很少需要，但它是一个有用的安全网。
- 待处理上下文窗口按 `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50 的顺序解析。

### 激活命令（仅所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，未设置时则为机器人自己的 E.164）可以更改此设置；其他任何人发送的 `/activation` 都会被忽略，并仅作为上下文存储。在群组中将 `/status` 作为独立消息发送，可查看当前激活模式。

## 使用方法

1. 将你的 WhatsApp 账号（运行 OpenClaw 的那个账号）添加到群组。
2. 发送 `@openclaw ...`（或包含该号码）。除非你设置了 `groupPolicy: "open"`，否则只有允许列表中的发送者可以触发它。
3. 智能体提示词会包含待处理的群组上下文，以及带发送者标签的行，以便它能回应正确的人。
4. 会话指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）只应用于该群组的会话；请将它们作为独立消息发送，以便系统注册。你的个人私信会话保持独立。

## 测试 / 验证

- 手动冒烟测试：
  - 在群组中发送一条 `@openclaw` ping，并确认回复引用了发送者名称。
  - 再发送第二条 ping，确认包含了历史记录块，然后在下一轮清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行），查看 `inbound web message` 条目，其中显示 `from: <groupJid>` 和带发送者标签的正文。

## 已知注意事项

- 心跳在智能体的主会话中运行；群组会话永远不会获得心跳运行。
- 回声抑制会按会话记住组合后的提示词（历史记录 + 当前消息），这样机器人自己已送达的消息不会再次触发它；完全相同的重复批次可能会被作为回声跳过。
- 会话存储中的条目显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认位于 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少条目只表示该群组尚未触发过运行。
- 输入状态指示遵循 `session.typingMode` / `agents.defaults.typingMode`。当可见回复选择加入仅消息工具模式时，默认会立即开始显示输入状态，因此即使没有发布自动最终回复，群组成员也能看到智能体正在工作。显式的输入模式配置仍然优先。

## 相关

- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [广播群组](/zh-CN/channels/broadcast-groups)

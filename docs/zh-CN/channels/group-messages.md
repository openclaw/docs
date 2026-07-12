---
read_when:
    - 专门配置 WhatsApp 群组
    - 更改 WhatsApp 激活模式（`mention` 与 `always`）
    - 调整 WhatsApp 群组会话键或待处理消息上下文
sidebarTitle: WhatsApp groups
summary: WhatsApp 群组消息处理——激活、允许列表、会话和上下文注入
title: WhatsApp 群组消息
x-i18n:
    generated_at: "2026-07-12T14:18:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

关于跨渠道群组模型（Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、Slack、Telegram、WhatsApp、Zalo），请参阅[群组](/zh-CN/channels/groups)。本页介绍在该模型基础上的 WhatsApp 特有行为：激活、群组允许列表、按群组划分的会话键，以及待处理消息上下文注入。

目标：让 OpenClaw 驻留在 WhatsApp 群组中，仅在被提及时唤醒，并使该会话线程与个人私信会话保持分离。

<Note>
`agents.list[].groupChat.mentionPatterns` 与其他渠道共用提及门控。对于多 Agent 设置，请为每个 Agent 分别设置，或使用 `messages.groupChat.mentionPatterns` 作为全局回退。若两者均未设置，则会根据 Agent 身份的名称/表情符号生成匹配模式。
</Note>

## 行为

- 激活模式：`mention`（默认）或 `always`。`mention` 需要有人提醒：真正的 WhatsApp @ 提及（`mentionedJids`）、已配置的正则表达式模式、文本中任意位置出现机器人的 E.164 数字号码，或引用回复机器人的某条消息（共享号码的自聊设置除外）。`always` 会在每条消息到达时唤醒智能体，但注入的群组提示词会要求它仅在能提供价值时回复，否则返回完全一致的静默令牌 `NO_REPLY`（不区分大小写）。默认值来自配置（`channels.whatsapp.groups` 的 `requireMention`），并可通过 `/activation` 针对每个群组进行覆盖。
- 群组允许列表：设置 `channels.whatsapp.groups` 后，仅允许列出的群组 JID（包含 `"*"` 可允许全部群组）；来自未列出群组的消息会被丢弃，并记录提示日志。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退值：显式配置的 `channels.whatsapp.allowFrom`）。默认值为 `allowlist`（在添加发送者前保持阻止状态）。
- 每群组会话：会话键的格式类似 `agent:<agentId>:whatsapp:group:<jid>`（非默认账号会追加 `:thread:whatsapp-account-<accountId>`），因此 `/verbose on`、`/trace on` 或 `/think high` 等指令（作为独立消息发送）仅作用于该群组；个人私信状态不受影响。
- 上下文注入：**仅待处理的**、_未_触发运行的群组消息（默认 50 条）会添加前缀并置于 `[Chat messages since your last reply - for context]` 下，触发运行的消息行则置于 `[Current message - respond to this]` 下。运行结束后会清空待处理窗口；已存在于会话中的消息不会被再次注入。
- 发送者归属：每条群组消息行都会在消息信封内携带发送者标签，例如 `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`；发送者身份以及群组主题/成员信息也会随不受信任的对话元数据块一并传递。
- 临时消息/仅可查看一次：提取文本和提及之前会解开包装，因此其中的提醒仍能触发运行。
- 群组系统提示词：群组会话的第一个轮次（以及通过 `/activation` 更改模式后的任意轮次）会将激活指导注入系统提示词（`Activation: trigger-only ...` 或 `Activation: always-on ...`，并包含“针对具体发送者作出回应”）。始终会包含持久的群聊消息传递指导（“你正在 WhatsApp 群聊中……”）。

## 配置示例（WhatsApp）

即使 WhatsApp 从文本正文中移除了可见的 `@`，也能让显示名称提及正常生效：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // 待处理的群组上下文窗口（默认值为 50）
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

注意：

- 正则表达式不区分大小写，并采用与其他配置正则表达式界面相同的安全正则表达式防护措施；无效模式和不安全的嵌套重复将被忽略。
- 当有人点击联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范化提及，因此很少需要使用号码作为后备，但它是一个实用的安全保障。
- 待处理上下文窗口按 `channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50 的顺序解析。

### 激活命令（仅限所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`；如未设置，则为 Bot 自身的 E.164 号码）可以更改此设置；其他人发送的 `/activation` 会被忽略，仅作为上下文存储。在群组中将 `/status` 作为独立消息发送，可查看当前的激活模式。

## 使用方法

1. 将你的 WhatsApp 账号（运行 OpenClaw 的账号）添加到群组。
2. 发送 `@openclaw ...`（或包含相应号码）。除非你设置了 `groupPolicy: "open"`，否则只有允许列表中的发送者才能触发它。
3. 智能体提示词包含待处理的群组上下文，以及带发送者标签的各行内容，以便智能体向正确的人回复。
4. 会话指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅应用于该群组的会话；请将它们作为独立消息发送，以便系统识别。你的个人私信会话保持独立。

## 测试/验证

- 手动冒烟测试：
  - 在群组中发送 `@openclaw` 消息，并确认回复中提到了发送者姓名。
  - 再发送一条消息，验证其中包含历史记录块，然后确认该历史记录块在下一轮中已清除。
- 检查 Gateway 网关日志（使用 `--verbose` 运行），查找 `inbound web message` 条目，确认其中显示 `from: <groupJid>` 和带发送者标签的正文。

## 已知注意事项

- Heartbeat 在智能体的主会话中运行；群组会话永远不会运行 Heartbeat。
- 为抑制回显，系统会按会话记住组合后的提示词（历史记录 + 当前消息），因此 Bot 自身已送达的消息不会再次触发它；完全相同的重复批次可能会被视为回显而跳过。
- 在每个智能体的 SQLite 会话存储中，会话存储条目显示为 `agent:<agentId>:whatsapp:group:<jid>`；缺少条目仅表示该群组尚未触发运行。
- 输入状态指示器遵循 `session.typingMode` / `agents.defaults.typingMode`。当可见回复选择仅使用消息工具的模式时，默认会立即显示输入状态，以便群组成员即使在未发布自动最终回复的情况下，也能看到智能体正在工作。显式的输入模式配置仍然优先。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [广播群组](/zh-CN/channels/broadcast-groups)

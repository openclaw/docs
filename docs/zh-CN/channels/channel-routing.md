---
read_when:
    - 更改渠道路由或收件箱行为
summary: 各渠道（WhatsApp、Telegram、Discord、Slack）的路由规则以及共享上下文
title: 渠道路由
x-i18n:
    generated_at: "2026-04-22T23:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3296ab8428cb815d0cc297d0c6e7479c5554ec45e1d90eef89a68833f5979d8d
    source_path: channels/channel-routing.md
    workflow: 15
---

# 渠道与路由

OpenClaw 会将回复**路由回消息来源的那个渠道**。模型不会选择渠道；路由是确定性的，并由主机配置控制。

## 关键术语

- **渠道**：`telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`，以及扩展渠道。`webchat` 是内部 WebChat UI 渠道，不是可配置的出站渠道。
- **AccountId**：每个渠道的账户实例（在支持时）。
- 可选的渠道默认账户：`channels.<channel>.defaultAccount` 用于选择当出站路径未指定 `accountId` 时使用哪个账户。
  - 在多账户配置中，当配置了两个或更多账户时，请设置一个显式默认值（`defaultAccount` 或 `accounts.default`）。否则，回退路由可能会选择第一个被标准化的账户 ID。
- **AgentId**：隔离的工作区 + 会话存储（“大脑”）。
- **SessionKey**：用于存储上下文并控制并发的桶键。

## 会话键形状（示例）

大多数私信会合并到智能体的**主**会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

Telegram 机器人私信会按机器人账户和发送者隔离，即使
`session.dmScope` 是 `main` 也是如此，因此沙箱和工具策略决策可以区分
来自渠道的私信与智能体主会话：

- `agent:<agentId>:telegram:<accountId>:direct:<senderId>`

群组和频道会继续按渠道隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 频道/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord 线程会将 `:thread:<threadId>` 追加到基础键后面。
- Telegram 论坛话题会将 `:topic:<topicId>` 嵌入群组键中。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主私信路由固定

当 `session.dmScope` 为 `main` 时，私信可能共享同一个主会话。
为防止会话的 `lastRoute` 被非所有者私信覆盖，
当以下条件都满足时，OpenClaw 会从 `allowFrom` 推断一个固定所有者：

- `allowFrom` 恰好只有一个非通配符条目。
- 该条目可以被标准化为该渠道的一个具体发送者 ID。
- 入站私信发送者与该固定所有者不匹配。

在这种不匹配情况下，OpenClaw 仍会记录入站会话元数据，但会
跳过更新主会话的 `lastRoute`。

## 路由规则（如何选择智能体）

路由会为每条入站消息选择**一个智能体**：

1. **精确对等方匹配**（带有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父级对等方匹配**（线程继承）。
3. **服务器 + 角色匹配**（Discord），通过 `guildId` + `roles`。
4. **服务器匹配**（Discord），通过 `guildId`。
5. **团队匹配**（Slack），通过 `teamId`。
6. **账户匹配**（渠道上的 `accountId`）。
7. **渠道匹配**（该渠道上的任意账户，`accountId: "*"`）。
8. **默认智能体**（`agents.list[].default`，否则为列表中的第一项，回退到 `main`）。

当一个绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，**所有已提供字段都必须匹配**，该绑定才会生效。

匹配到的智能体决定使用哪个工作区和会话存储。

## 广播组（运行多个智能体）

广播组允许你在**OpenClaw 原本会回复时**为同一个对等方运行**多个智能体**（例如：在 WhatsApp 群组中，通过提及/激活门控后）。

配置：

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

参见：[广播组](/zh-CN/channels/broadcast-groups)。

## 配置概览

- `agents.list`：具名智能体定义（工作区、模型等）。
- `bindings`：将入站渠道/账户/对等方映射到智能体。

示例：

```json5
{
  agents: {
    list: [{ id: "support", name: "支持", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## 会话存储

会话存储位于状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 逐行转录文件与存储文件位于同一目录

你可以通过 `session.store` 和 `{agentId}` 模板覆盖存储路径。

Gateway 网关 和 ACP 会话发现还会扫描默认
`agents/` 根目录下以及模板化 `session.store` 根目录下的基于磁盘的智能体存储。发现到的
存储必须保持在解析后的智能体根目录内，并使用常规的
`sessions.json` 文件。符号链接和根目录外路径会被忽略。

## WebChat 行为

WebChat 会附加到**选中的智能体**，并默认使用该智能体的主
会话。因此，WebChat 让你能够在一个地方查看该智能体的跨渠道上下文。

## 回复上下文

入站回复会包含：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`（如果可用）。
- 引用上下文会作为一个 `[Replying to ...]` 块附加到 `Body`。

这一点在各渠道之间保持一致。

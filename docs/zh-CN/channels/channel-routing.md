---
read_when:
    - 更改渠道路由或收件箱行为
summary: 各个渠道（WhatsApp、Telegram、Discord、Slack）的路由规则和共享上下文
title: 渠道路由
x-i18n:
    generated_at: "2026-04-27T20:15:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 15
---

# 渠道与路由

OpenClaw 会将回复**发回消息来源的那个渠道**。模型不会选择渠道；路由是确定性的，并由宿主配置控制。

## 关键术语

- **渠道**：`telegram`、`whatsapp`、`discord`、`irc`、`googlechat`、`slack`、`signal`、`imessage`、`line`，以及插件渠道。`webchat` 是内部 WebChat UI 渠道，不是可配置的出站渠道。
- **AccountId**：每个渠道的账户实例（在支持时）。
- 可选的渠道默认账户：`channels.<channel>.defaultAccount` 用于选择当出站路径未指定 `accountId` 时使用哪个账户。
  - 在多账户设置中，当配置了两个或更多账户时，请设置显式默认值（`defaultAccount` 或 `accounts.default`）。否则，回退路由可能会选择第一个规范化后的账户 ID。
- **AgentId**：一个隔离的工作区 + 会话存储（“大脑”）。
- **SessionKey**：用于存储上下文并控制并发的桶键。

## 会话键形状（示例）

默认情况下，私信会收敛到智能体的**主**会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

即使私信会话历史默认与主会话共享，对于外部私信，沙箱和工具策略仍会使用派生出的按账户划分的直接聊天运行时键，这样源自渠道的消息就不会被当作本地主会话运行来处理。

群组和频道在每个渠道内仍然彼此隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 渠道/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord 线程会在基础键后追加 `:thread:<threadId>`。
- Telegram 论坛话题会在群组键中嵌入 `:topic:<topicId>`。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主私信路由固定

当 `session.dmScope` 为 `main` 时，私信可能共享同一个主会话。为了防止会话的 `lastRoute` 被非所有者私信覆盖，当以下条件全部满足时，OpenClaw 会根据 `allowFrom` 推断一个固定所有者：

- `allowFrom` 恰好只有一个非通配符条目。
- 该条目可以被规范化为该渠道的具体发送者 ID。
- 入站私信发送者与该固定所有者不匹配。

在这种不匹配情况下，OpenClaw 仍会记录入站会话元数据，但会跳过更新主会话的 `lastRoute`。

## 受保护的入站记录

当某条受保护路径不得创建新的 OpenClaw 会话时，渠道插件可以将入站会话记录标记为 `createIfMissing: false`。在这种模式下，OpenClaw 可以为现有会话更新元数据和 `lastRoute`，但不会仅因为观察到一条消息就创建一个仅用于路由的会话条目。

## 路由规则（如何选择智能体）

路由会为每条入站消息选择**一个智能体**：

1. **精确 peer 匹配**（带有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父级 peer 匹配**（线程继承）。
3. **Guild + 角色匹配**（Discord），通过 `guildId` + `roles`。
4. **Guild 匹配**（Discord），通过 `guildId`。
5. **团队匹配**（Slack），通过 `teamId`。
6. **账户匹配**（渠道上的 `accountId`）。
7. **渠道匹配**（该渠道上的任意账户，`accountId: "*"`）。
8. **默认智能体**（`agents.list[].default`，否则为列表中的第一个条目，回退到 `main`）。

当一个绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，**该绑定中所有已提供的字段都必须匹配**，该绑定才会生效。

匹配到的智能体决定使用哪个工作区和会话存储。

## 广播群组（运行多个智能体）

广播群组让你可以在同一个 peer 上运行**多个智能体**，前提是 **OpenClaw 通常会回复**（例如：在 WhatsApp 群组中，在提及/激活门控之后）。

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

参见：[广播群组](/zh-CN/channels/broadcast-groups)。

## 配置概览

- `agents.list`：具名智能体定义（工作区、模型等）。
- `bindings`：将入站渠道/账户/peer 映射到智能体。

示例：

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
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
- JSONL 记录文件与该存储文件位于同一目录

你可以通过 `session.store` 和 `{agentId}` 模板覆盖存储路径。

Gateway 网关 和 ACP 会话发现还会扫描默认 `agents/` 根目录下，以及模板化 `session.store` 根目录下的基于磁盘的智能体存储。发现到的存储必须保持在解析后的智能体根目录内，并使用常规的 `sessions.json` 文件。符号链接和超出根目录的路径会被忽略。

## WebChat 行为

WebChat 会附加到**所选智能体**，并默认使用该智能体的主会话。因此，WebChat 让你可以在一个地方查看该智能体的跨渠道上下文。

## 回复上下文

入站回复会包含：

- 在可用时包含 `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用的上下文会作为 `[Replying to ...]` 块追加到 `Body` 中。

这一行为在各个渠道之间保持一致。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [广播群组](/zh-CN/channels/broadcast-groups)
- [配对](/zh-CN/channels/pairing)

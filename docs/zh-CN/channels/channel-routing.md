---
read_when:
    - 更改频道路由或收件箱行为
summary: 每个渠道（WhatsApp、Telegram、Discord、Slack）的路由规则和共享上下文
title: 渠道路由
x-i18n:
    generated_at: "2026-07-05T11:01:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ffd204de57a3ff991953a7907d86b1a93f8af14a71ee410e9dcc36336f49d3f
    source_path: channels/channel-routing.md
    workflow: 16
---

# 渠道和路由

OpenClaw 会将回复路由**回消息来源的渠道**。模型不会选择渠道；路由是确定性的，并由主机配置控制。

## 关键术语

- **渠道**：内置渠道插件，例如 `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram` 或 `whatsapp`，以及已安装的插件渠道。`webchat` 是内部 WebChat UI 渠道，不是可配置的出站渠道。
- **AccountId**：每个渠道的账号实例（在支持时）。
- 可选的渠道默认账号：`channels.<channel>.defaultAccount` 选择
  当出站路径未指定 `accountId` 时使用哪个账号。
  - 在多账号设置中，当配置了两个或更多账号时，请设置显式默认值（`defaultAccount` 或名为 `default` 的账号）。如果不设置，回退路由可能会选择第一个规范化后的账号 ID。
- **AgentId**：隔离的工作区 + 会话存储（“大脑”）。
- **SessionKey**：用于存储上下文和控制并发的桶键。

## 出站目标前缀

显式出站目标可以包含提供商前缀，例如 `telegram:123` 或 `tg:123`。仅当所选渠道为 `last` 或仍未解析，并且已加载插件声明支持该前缀时，核心才会将该前缀视为渠道选择提示。如果调用方已经选择了显式渠道，则提供商前缀必须匹配该渠道；跨渠道组合（例如向 `telegram:123` 进行 WhatsApp 投递）会在插件特定的目标规范化之前失败。

目标类型和服务前缀（例如 `channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>`）保留在所选渠道的语法中。它们本身不会选择提供商。

## 会话键形状（示例）

默认情况下，私信会折叠到智能体的 **main** 会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

`session.dmScope` 控制私信折叠：`main`（默认）共享一个主
会话，而 `per-peer`、`per-channel-peer` 和 `per-account-channel-peer`
会将私信保留在单独的会话中。路由绑定可以通过
`bindings[].session.dmScope` 为其匹配的对端覆盖该范围。

即使私信对话历史与 main 共享，沙箱和
工具策略也会为外部私信使用派生的按账号直接聊天运行时键，
这样来自渠道的消息就不会被当成本地 main 会话运行处理。

群组和频道仍按渠道隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 频道/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord 线程会将 `:thread:<threadId>` 追加到基础键。
- Telegram 论坛主题会在群组键中嵌入 `:topic:<topicId>`。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Main 私信路由固定

当 `session.dmScope` 为 `main` 时，私信可能共享一个 main 会话。
为了防止会话的 `lastRoute` 被非所有者私信覆盖，
OpenClaw 会在以下条件全部为真时，从 `allowFrom` 推断固定所有者：

- `allowFrom` 只有一个非通配符条目。
- 该条目可以规范化为该渠道的具体发送者 ID。
- 入站私信发送者与该固定所有者不匹配。

在这种不匹配的情况下，OpenClaw 仍会记录入站会话元数据，但会
跳过更新 main 会话的 `lastRoute`。

## 受保护的入站记录

当受保护路径不得创建新的 OpenClaw 会话时，渠道插件可以将入站会话记录标记为 `createIfMissing: false`。在该模式下，
OpenClaw 可以更新现有会话的元数据和 `lastRoute`，但不会仅仅因为观察到一条消息就创建仅含路由的会话条目。

## 路由规则（如何选择智能体）

路由会为每条入站消息选择**一个智能体**：

1. **精确对端匹配**（带有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父对端匹配**（线程继承）。
3. **对端通配符匹配**（某种对端类型的 `peer.id: "*"`）。
4. **服务器 + 角色匹配**（Discord），通过 `guildId` + `roles`。
5. **服务器匹配**（Discord），通过 `guildId`。
6. **团队匹配**（Slack），通过 `teamId`。
7. **账号匹配**（渠道上的 `accountId`）。
8. **渠道匹配**（该渠道上的任意账号，`accountId: "*"`）。
9. **默认智能体**（`agents.list[].default`，否则为列表中的第一个条目，回退到 `main`）。

当绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，**所有提供的字段都必须匹配**，该绑定才会生效。

匹配到的智能体决定使用哪个工作区和会话存储。

## 广播组（运行多个智能体）

广播组让你可以为同一个对端运行**多个智能体**，前提是 **OpenClaw 通常会回复**（例如：在 WhatsApp 群组中，通过提及/激活门控之后）。

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

- `agents.list`：命名智能体定义（工作区、模型等）。
- `bindings`：将入站渠道/账号/对端映射到智能体。

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
- JSONL 转录记录与该存储位于同一位置

你可以通过 `session.store` 和 `{agentId}` 模板覆盖存储路径。

Gateway 网关和 ACP 会话发现还会扫描默认 `agents/` 根目录下以及模板化 `session.store` 根目录下的磁盘备份智能体存储。发现的
存储必须保留在解析后的智能体根目录内，并使用常规的
`sessions.json` 文件。符号链接和根目录之外的路径会被忽略。

## WebChat 行为

WebChat 会附加到**所选智能体**，并默认使用该智能体的 main
会话。因此，WebChat 让你可以在一个位置查看该智能体的跨渠道上下文。

## 回复上下文

入站回复包含：

- 可用时包含 `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用上下文会作为 `[Replying to ...]` 块追加到 `Body`。

这在各个渠道之间保持一致。

## 相关

- [群组](/zh-CN/channels/groups)
- [广播组](/zh-CN/channels/broadcast-groups)
- [配对](/zh-CN/channels/pairing)

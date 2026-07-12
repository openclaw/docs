---
read_when:
    - 更改渠道路由或收件箱行为
summary: 每个渠道（WhatsApp、Telegram、Discord、Slack）的路由规则和共享上下文
title: 渠道路由
x-i18n:
    generated_at: "2026-07-12T14:17:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# 渠道和路由

OpenClaw 将回复路由**回消息来源的渠道**。模型不会选择渠道；路由是确定性的，并由主机配置控制。

## 关键术语

- **渠道**：内置渠道插件，例如 `discord`、`googlechat`、`imessage`、`irc`、`line`、`signal`、`slack`、`telegram` 或 `whatsapp`，以及已安装的插件渠道。`webchat` 是内部 WebChat UI 渠道，不是可配置的出站渠道。
- **AccountId**：每个渠道的账户实例（如果支持）。
- 可选的渠道默认账户：`channels.<channel>.defaultAccount` 用于选择当出站路径未指定 `accountId` 时使用的账户。
  - 在多账户设置中，配置两个或更多账户时，请设置明确的默认账户（`defaultAccount` 或名为 `default` 的账户）。否则，回退路由可能会选择规范化后的第一个账户 ID。
- **AgentId**：隔离的工作区 + 会话存储（“大脑”）。
- **SessionKey**：用于存储上下文和控制并发的分桶键。

## 出站目标前缀

显式出站目标可以包含提供商前缀，例如 `telegram:123` 或 `tg:123`。仅当所选渠道为 `last` 或尚未解析，并且已加载的插件声明支持该前缀时，核心才会将该前缀视为渠道选择提示。如果调用方已显式选择渠道，则提供商前缀必须与该渠道匹配；例如通过 WhatsApp 向 `telegram:123` 投递这样的跨渠道组合，会在插件特定的目标规范化之前失败。

`channel:<id>`、`user:<id>`、`room:<id>`、`thread:<id>`、`imessage:<handle>` 和 `sms:<number>` 等目标类型和服务前缀仍属于所选渠道的语法。它们本身不会选择提供商。

## 会话键格式（示例）

默认情况下，私信会合并到智能体的 **main** 会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

`session.dmScope` 控制私信合并：`main`（默认）共享一个主会话，而 `per-peer`、`per-channel-peer` 和 `per-account-channel-peer` 会将私信保存在不同会话中。路由绑定可以通过 `bindings[].session.dmScope` 为其匹配的对端覆盖此作用域。

即使私信对话历史与主会话共享，沙箱和工具策略仍会针对外部私信使用派生的每账户直接聊天运行时键，以免将来自渠道的消息视为本地主会话运行。

群组和频道仍按渠道相互隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 频道/房间：`agent:<agentId>:<channel>:channel:<id>`

话题串：

- Slack/Discord 话题串会在基础键后附加 `:thread:<threadId>`。
- Telegram 论坛话题会在群组键中嵌入 `:topic:<topicId>`。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 主私信路由固定

当 `session.dmScope` 为 `main` 时，私信可以共享一个主会话。为防止会话的 `lastRoute` 被非所有者私信覆盖，在满足以下所有条件时，OpenClaw 会根据 `allowFrom` 推断并固定所有者：

- `allowFrom` 恰好有一个非通配符条目。
- 该条目可以规范化为该渠道的具体发送者 ID。
- 入站私信发送者与固定的所有者不匹配。

出现这种不匹配时，OpenClaw 仍会记录入站会话元数据，但会跳过更新主会话的 `lastRoute`。

## 受保护的入站记录

当受保护的路径不得创建新的 OpenClaw 会话时，渠道插件可以将入站会话记录标记为 `createIfMissing: false`。在此模式下，OpenClaw 可以更新现有会话的元数据和 `lastRoute`，但不会仅仅因为观察到一条消息就创建仅含路由信息的会话条目。

## 路由规则（如何选择智能体）

路由会为每条入站消息选择**一个智能体**：

1. **精确对端匹配**（`bindings` 中包含 `peer.kind` + `peer.id`）。
2. **父级对端匹配**（话题串继承）。
3. **对端通配符匹配**（某种对端类型使用 `peer.id: "*"`）。
4. **服务器 + 角色匹配**（Discord），通过 `guildId` + `roles`。
5. **服务器匹配**（Discord），通过 `guildId`。
6. **团队匹配**（Slack），通过 `teamId`。
7. **账户匹配**（渠道上的 `accountId`）。
8. **渠道匹配**（该渠道上的任意账户，`accountId: "*"`）。
9. **默认智能体**（`agents.list[].default`；否则使用列表第一项；再回退到 `main`）。

当绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，**提供的所有字段都必须匹配**，该绑定才会生效。

匹配的智能体决定使用哪个工作区和会话存储。

## 广播群组（运行多个智能体）

广播群组允许针对同一对端运行**多个智能体**，前提是 **OpenClaw 通常会回复**（例如：在 WhatsApp 群组中通过提及/激活门控后）。

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

请参阅：[广播群组](/zh-CN/channels/broadcast-groups)。

## 配置概览

- `agents.list`：命名的智能体定义（工作区、模型等）。
- `bindings`：将入站渠道/账户/对端映射到智能体。

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

运行时会话行位于状态目录（默认 `~/.openclaw`）下每个智能体的 SQLite 数据库中：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

较旧的安装可能在 `~/.openclaw/agents/<agentId>/sessions/` 下包含旧版对话记录 JSONL 文件和 `sessions.json` 行存储。Gateway 网关启动和 `openclaw doctor --fix` 会自动将活跃的旧版行/历史记录导入 SQLite。当你需要明确的迁移证据时，请使用 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` 以及 [Doctor](/zh-CN/cli/doctor#session-sqlite-migration) 验证序列。
对于迁移和离线维护工作流，你仍然可以通过 `session.store` 和 `{agentId}` 模板选择旧版存储路径。

Gateway 网关和 ACP 会话发现还会扫描默认 `agents/` 根目录和模板化 `session.store` 根目录下基于磁盘的智能体存储。发现的存储必须位于解析后的智能体根目录内，并使用常规旧版 `sessions.json` 文件。符号链接和根目录外路径会被忽略。

## WebChat 行为

WebChat 会连接到**所选智能体**，并默认使用该智能体的主会话。因此，你可以通过 WebChat 在一个位置查看该智能体的跨渠道上下文。

## 回复上下文

入站回复包含：

- 可用时包含 `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`。
- 引用的上下文会作为 `[Replying to ...]` 块附加到 `Body`。

此行为在所有渠道中保持一致。

## 相关内容

- [群组](/zh-CN/channels/groups)
- [广播群组](/zh-CN/channels/broadcast-groups)
- [配对](/zh-CN/channels/pairing)

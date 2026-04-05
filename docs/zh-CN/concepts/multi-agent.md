---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 多智能体路由：隔离的智能体、渠道账号与绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-04-05T08:22:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# 多智能体路由

目标：在一个正在运行的 Gateway 网关中，同时支持多个**相互隔离**的智能体（独立的 workspace + `agentDir` + sessions），以及多个渠道账号（例如两个 WhatsApp 账号）。入站消息会通过 bindings 路由到某个智能体。

## 什么是“一个智能体”？

一个**智能体**是一个完整作用域的“大脑”，拥有它自己的：

- **Workspace**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、人格规则）。
- 用于保存认证配置文件、模型注册表和按智能体划分配置的**状态目录**（`agentDir`）。
- 位于 `~/.openclaw/agents/<agentId>/sessions` 下的**会话存储**（聊天历史 + 路由状态）。

认证配置文件是**按智能体隔离**的。每个智能体都从自己的以下路径读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

这里的 `sessions_history` 也是更安全的跨会话回忆路径：它返回的是有界、经净化的视图，而不是原始对话转储。助手回忆会剥离 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML
负载（包括 `<tool_call>...</tool_call>`、
`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、
`<function_calls>...</function_calls>` 以及被截断的工具调用块）、
降级后的工具调用脚手架、泄露的 ASCII/全角模型控制
token，以及格式错误的 MiniMax 工具调用 XML，然后再执行脱敏/截断。

主智能体凭证**不会**自动共享。绝不要在多个智能体之间复用 `agentDir`
（这会导致认证/会话冲突）。如果你想共享凭证，
请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。

Skills 会从每个智能体的 workspace 以及共享根目录（例如
`~/.openclaw/skills`）中加载，然后在配置了有效智能体 Skills 允许列表时按其进行过滤。使用 `agents.defaults.skills` 作为共享基线，并使用
`agents.list[].skills` 进行按智能体替换。请参阅
[Skills：按智能体 vs 共享](/tools/skills#per-agent-vs-shared-skills) 和
[Skills：智能体 Skills 允许列表](/tools/skills#agent-skill-allowlists)。

Gateway 网关可以并排托管**一个智能体**（默认）或**多个智能体**。

**Workspace 说明：**每个智能体的 workspace 是**默认 cwd**，而不是硬性
沙箱。相对路径会在 workspace 内解析，但绝对路径仍可访问主机上的其他位置，除非启用了沙箱隔离。请参阅
[沙箱隔离](/gateway/sandboxing)。

## 路径（速查图）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- Workspace：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- Agent 目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- Sessions：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果你不做任何配置，OpenClaw 会运行一个智能体：

- `agentId` 默认为 **`main`**。
- Sessions 的键为 `agent:main:<mainKey>`。
- Workspace 默认为 `~/.openclaw/workspace`（如果设置了 `OPENCLAW_PROFILE`，则为 `~/.openclaw/workspace-<profile>`）。
- State 默认为 `~/.openclaw/agents/main/agent`。

## 智能体助手

使用智能体向导添加一个新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导代你完成），以路由入站消息。

可通过以下命令验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="为每个智能体创建 workspace">

使用向导，或手动创建 workspace：

```bash
openclaw agents add coding
openclaw agents add social
```

每个智能体都会获得自己的 workspace，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，以及位于 `~/.openclaw/agents/<agentId>` 下的专用 `agentDir` 和会话存储。

  </Step>

  <Step title="创建渠道账号">

在你偏好的渠道上为每个智能体创建一个账号：

- Discord：每个智能体一个 bot，启用 Message Content Intent，复制各自 token。
- Telegram：通过 BotFather 为每个智能体创建一个 bot，复制各自 token。
- WhatsApp：为每个账号关联各自的电话号码。

```bash
openclaw channels login --channel whatsapp --account work
```

请参阅渠道指南：[Discord](/channels/discord)、[Telegram](/channels/telegram)、[WhatsApp](/channels/whatsapp)。

  </Step>

  <Step title="添加智能体、账号和绑定">

将智能体添加到 `agents.list`，将渠道账号添加到 `channels.<channel>.accounts`，然后使用 `bindings` 将它们连接起来（示例见下文）。

  </Step>

  <Step title="重启并验证">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## 多个智能体 = 多个人，多种人格

使用**多个智能体**时，每个 `agentId` 都会成为一个**完全隔离的人格**：

- **不同的电话号码/账号**（按渠道 `accountId` 区分）。
- **不同的人格**（通过按智能体划分的 workspace 文件，如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的认证 + sessions**（除非显式启用，否则不会互相串话）。

这使得**多人**可以共享一台 Gateway 网关服务器，同时保持各自的 AI “大脑”和数据互相隔离。

## 跨智能体 QMD memory 搜索

如果某个智能体需要搜索另一个智能体的 QMD 会话转录内容，请在
`agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。
仅当每个智能体都应继承相同的共享转录集合时，才使用
`agents.defaults.memorySearch.qmd.extraCollections`。

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // 在 workspace 内解析 -> 集合名为 "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

额外集合路径可以在多个智能体之间共享，但当路径位于智能体 workspace
之外时，集合名仍需显式指定。位于 workspace 内部的路径则仍保持按智能体划分，因此每个智能体都保有自己的转录搜索集合。

## 一个 WhatsApp 号码，服务多个人（私信拆分）

你可以在**同一个 WhatsApp 账号**上，将**不同的 WhatsApp 私信**路由给不同的智能体。通过发送者 E.164（如 `+15551234567`）和 `peer.kind: "direct"` 进行匹配。回复仍然来自同一个 WhatsApp 号码（没有按智能体区分的发送者身份）。

重要细节：私聊会折叠到该智能体的**主会话键**，因此真正的隔离要求**每个人一个智能体**。

示例：

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

注意事项：

- 私信访问控制是**按 WhatsApp 账号全局生效**的（配对/允许列表），而不是按智能体区分。
- 对于共享群组，请将该群组绑定给某一个智能体，或使用 [Broadcast groups](/channels/broadcast-groups)。

## 路由规则（消息如何选择智能体）

Bindings 是**确定性的**，并且**最具体者优先**：

1. `peer` 匹配（精确私信/群组/频道 ID）
2. `parentPeer` 匹配（线程继承）
3. `guildId + roles`（Discord 角色路由）
4. `guildId`（Discord）
5. `teamId`（Slack）
6. 某个渠道的 `accountId` 匹配
7. 渠道级匹配（`accountId: "*"`）
8. 回退到默认智能体（`agents.list[].default`，否则为列表中的第一个条目，默认：`main`）

如果同一层级中有多个 bindings 同时匹配，则按配置顺序，最先出现的获胜。
如果某个 binding 设置了多个匹配字段（例如 `peer` + `guildId`），则所有已指定字段都必须满足（`AND` 语义）。

关于账号作用域的重要细节：

- 省略 `accountId` 的 binding 只匹配默认账号。
- 对整个渠道的所有账号设置回退时，请使用 `accountId: "*"`。
- 如果之后你为同一智能体、同一 binding 显式添加了账号 ID，OpenClaw 会将现有的仅渠道 binding 升级为按账号划分，而不是重复创建。

## 多个账号 / 多个电话号码

支持**多个账号**的渠道（例如 WhatsApp）使用 `accountId` 来标识
每次登录。每个 `accountId` 都可以路由到不同的智能体，因此一台服务器可以托管
多个电话号码而不会混淆 sessions。

如果你希望在省略 `accountId` 时为某个渠道设置默认账号，请设置
`channels.<channel>.defaultAccount`（可选）。如果未设置，OpenClaw 会回退到
`default`（如果存在），否则使用第一个已配置的账号 ID（排序后）。

支持这一模式的常见渠道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个“大脑”（workspace、按智能体划分的认证、按智能体划分的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `"personal"` 与 `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)` 并可选结合 guild/team ID，将入站消息路由到某个 `agentId`。
- 私聊会折叠到 `agent:<agentId>:<mainKey>`（按智能体划分的“main”；`session.mainKey`）。

## 平台示例

### 每个智能体一个 Discord bot

每个 Discord bot 账号对应唯一的 `accountId`。将每个账号绑定到一个智能体，并为每个 bot 保持各自的允许列表。

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

注意事项：

- 邀请每个 bot 加入 guild，并启用 Message Content Intent。
- Token 存放在 `channels.discord.accounts.<id>.token` 中（默认账号可使用 `DISCORD_BOT_TOKEN`）。

### 每个智能体一个 Telegram bot

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

注意事项：

- 使用 BotFather 为每个智能体创建一个 bot，并复制各自 token。
- Token 存放在 `channels.telegram.accounts.<id>.botToken` 中（默认账号可使用 `TELEGRAM_BOT_TOKEN`）。

### 每个智能体一个 WhatsApp 号码

在启动 Gateway 网关之前先关联每个账号：

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json`（JSON5）：

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // 确定性路由：第一个匹配者获胜（最具体的放前面）。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 可选的按 peer 覆盖（示例：将某个特定群组发送给 work 智能体）。
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // 默认关闭：智能体之间的消息发送必须显式启用 + 加入允许列表。
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // 可选覆盖。默认：~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // 可选覆盖。默认：~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## 示例：WhatsApp 日常聊天 + Telegram 深度工作

按渠道拆分：将 WhatsApp 路由给快速的日常智能体，将 Telegram 路由给 Opus 智能体。

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

注意事项：

- 如果某个渠道配置了多个账号，请在 binding 中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
- 如果你想将某个单独的私信/群组路由到 Opus，同时让其他消息继续走 chat，请为该 peer 添加一个 `match.peer` binding；peer 匹配始终优先于渠道级规则。

## 示例：同一渠道，将一个 peer 路由到 Opus

让 WhatsApp 默认走快速智能体，但将某个私信路由到 Opus：

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Peer bindings 始终优先，因此请将它们放在渠道级规则之上。

## 绑定到 WhatsApp 群组的家庭智能体

将一个专用家庭智能体绑定到单个 WhatsApp 群组，并启用提及门控
和更严格的工具策略：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

注意事项：

- 工具 allow/deny 列表是**工具**，不是 Skills。如果某个 Skill 需要运行一个
  二进制文件，请确保允许了 `exec`，并且该二进制在沙箱中存在。
- 如需更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并为该渠道保持
  群组允许列表启用。

## 按智能体划分的沙箱和工具配置

每个智能体都可以拥有自己的沙箱和工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // personal 智能体不使用沙箱
        },
        // 无工具限制 —— 所有工具均可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终启用沙箱
          scope: "agent",  // 每个智能体一个容器
          docker: {
            // 容器创建后的一次性可选设置
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 仅允许 read 工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 禁止其他工具
        },
      },
    ],
  },
}
```

注意：`setupCommand` 位于 `sandbox.docker` 下，并会在容器创建时运行一次。
当解析后的作用域为 `"shared"` 时，按智能体划分的 `sandbox.docker.*` 覆盖会被忽略。

**优势：**

- **安全隔离**：限制不受信任智能体可用的工具
- **资源控制**：只为特定智能体启用沙箱，同时让其他智能体继续在宿主机上运行
- **灵活策略**：按智能体设置不同权限

注意：`tools.elevated` 是**全局**且基于发送者的；它不能按智能体配置。
如果你需要按智能体划分边界，请使用 `agents.list[].tools` 来禁止 `exec`。
对于群组定向，请使用 `agents.list[].groupChat.mentionPatterns`，这样 @mentions 才能清晰映射到目标智能体。

有关详细示例，请参阅 [多智能体沙箱与工具](/tools/multi-agent-sandbox-tools)。

## 相关内容

- [渠道路由](/channels/channel-routing) —— 消息如何路由到智能体
- [Sub-Agents](/tools/subagents) —— 生成后台智能体运行
- [ACP Agents](/tools/acp-agents) —— 运行外部编码 harness
- [Presence](/concepts/presence) —— 智能体在线状态与可用性
- [Session](/concepts/session) —— 会话隔离与路由

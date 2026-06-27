---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多 Agent 路由：隔离的智能体、渠道账号和绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-06-27T01:51:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

运行多个_隔离的_智能体，每个智能体都有自己的工作区、状态目录（`agentDir`）和会话历史；同时在一个正在运行的 Gateway 网关中使用多个渠道账号（例如两个 WhatsApp）。入站消息会通过绑定路由到正确的智能体。

这里的**智能体**是完整的按角色划分的作用域：工作区文件、凭证配置、模型注册表和会话存储。`agentDir` 是磁盘上的状态目录，用于在 `~/.openclaw/agents/<agentId>/` 保存这个按智能体划分的配置。**绑定**会把一个渠道账号（例如 Slack 工作区或 WhatsApp 号码）映射到其中一个智能体。

## 什么是“一个智能体”？

**智能体**是一个完全限定作用域的大脑，拥有自己的：

- **工作区**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、角色规则）。
- **状态目录**（`agentDir`），用于凭证配置、模型注册表和按智能体划分的配置。
- **会话存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions` 下。

凭证配置是**按智能体划分的**。每个智能体都会从自己的位置读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 在这里也是更安全的跨会话回忆路径：它返回有界且经过清理的视图，而不是原始转录记录转储。助手回忆会在脱敏/截断前去除思考标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块）、降级的工具调用脚手架、泄露的 ASCII/全角模型控制令牌，以及格式错误的 MiniMax 工具调用 XML。
</Note>

<Warning>
永远不要在多个智能体之间复用 `agentDir`（这会导致凭证/会话冲突）。当智能体没有本地配置时，可以读取默认/主智能体的凭证配置，但 OpenClaw 不会把 OAuth 刷新令牌克隆到次级智能体存储中。如果你想使用独立的 OAuth 账号，请从该智能体登录；如果你手动复制凭证，只复制可移植的静态 `api_key` 或 `token` 配置。
</Warning>

Skills 会从每个智能体工作区以及 `~/.openclaw/skills` 等共享根目录加载，然后在配置了有效智能体技能允许列表时进行过滤。使用 `agents.defaults.skills` 设置共享基线，使用 `agents.list[].skills` 设置按智能体替换。参见 [Skills：按智能体与共享](/zh-CN/tools/skills#per-agent-vs-shared-skills) 和 [Skills：智能体技能允许列表](/zh-CN/tools/skills#agent-allowlists)。

Gateway 网关可以托管**一个智能体**（默认）或**多个智能体**并行运行。

<Note>
**工作区说明：**每个智能体的工作区是**默认 cwd**，不是硬性沙箱。相对路径会在工作区内解析，但除非启用沙箱隔离，否则绝对路径可以访问其他主机位置。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 路径（快速映射）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果你什么都不做，OpenClaw 会运行单个智能体：

- `agentId` 默认是 **`main`**。
- 会话键为 `agent:main:<mainKey>`。
- 工作区默认是 `~/.openclaw/workspace`（设置 `OPENCLAW_PROFILE` 时为 `~/.openclaw/workspace-<profile>`）。
- 状态默认是 `~/.openclaw/agents/main/agent`。

## 智能体助手

使用智能体向导添加新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导完成）以路由入站消息。

使用以下命令验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="创建每个智能体工作区">
    使用向导，或手动创建工作区：

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每个智能体都会获得自己的工作区，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，并在 `~/.openclaw/agents/<agentId>` 下拥有专用的 `agentDir` 和会话存储。

  </Step>
  <Step title="创建渠道账号">
    在你偏好的渠道上为每个智能体创建一个账号：

    - Discord：每个智能体一个 bot，启用 Message Content Intent，复制每个令牌。
    - Telegram：通过 BotFather 为每个智能体创建一个 bot，复制每个令牌。
    - WhatsApp：为每个账号关联对应的电话号码。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    参见渠道指南：[Discord](/zh-CN/channels/discord)、[Telegram](/zh-CN/channels/telegram)、[WhatsApp](/zh-CN/channels/whatsapp)。

  </Step>
  <Step title="添加智能体、账号和绑定">
    在 `agents.list` 下添加智能体，在 `channels.<channel>.accounts` 下添加渠道账号，并用 `bindings` 将它们连接起来（见下方示例）。
  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多个智能体 = 多个人，多种个性

使用**多个智能体**时，每个 `agentId` 都会成为一个**完全隔离的角色**：

- **不同的电话号码/账号**（按渠道 `accountId`）。
- **不同的个性**（按智能体划分的工作区文件，例如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的凭证 + 会话**（除非显式启用，否则不会串话）。

这让**多个人**可以共享一台 Gateway 网关服务器，同时保持各自的 AI“大脑”和数据隔离。

## 跨智能体 QMD 记忆搜索

如果一个智能体应该搜索另一个智能体的 QMD 会话转录记录，请在 `agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。只有当每个智能体都应继承相同的共享转录记录集合时，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

额外集合路径可以在智能体之间共享，但当路径位于智能体工作区之外时，集合名称会保持显式。工作区内的路径仍按智能体限定作用域，因此每个智能体都会保留自己的转录记录搜索集。

## 一个 WhatsApp 号码，多个人（私信拆分）

你可以在保持使用**一个 WhatsApp 账号**的同时，将**不同的 WhatsApp 私信**路由到不同智能体。使用 `peer.kind: "direct"` 按发送者 E.164（如 `+15551234567`）匹配。回复仍来自同一个 WhatsApp 号码（没有按智能体划分的发送者身份）。

<Note>
直接聊天会折叠到智能体的**主会话键**，因此真正隔离需要**每人一个智能体**。
</Note>

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

说明：

- 私信访问控制是**每个 WhatsApp 账号全局**的（配对/允许列表），不是按智能体划分。
- 对于共享群组，请将群组绑定到一个智能体，或使用[广播群组](/zh-CN/channels/broadcast-groups)。

## 路由规则（消息如何选择智能体）

绑定是**确定性的**，并且**最具体的优先**：

<Steps>
  <Step title="peer 匹配">
    精确私信/群组/渠道 ID。
  </Step>
  <Step title="parentPeer 匹配">
    线程继承。
  </Step>
  <Step title="guildId + roles">
    Discord 角色路由。
  </Step>
  <Step title="guildId">
    Discord。
  </Step>
  <Step title="teamId">
    Slack。
  </Step>
  <Step title="某个渠道的 accountId 匹配">
    按账号回退。
  </Step>
  <Step title="渠道级匹配">
    `accountId: "*"`.
  </Step>
  <Step title="默认智能体">
    回退到 `agents.list[].default`，否则使用第一个列表条目，默认：`main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="平局判定和 AND 语义">
    - 如果同一层级中有多个绑定匹配，配置顺序中的第一个获胜。
    - 如果一个绑定设置了多个匹配字段（例如 `peer` + `guildId`），则需要满足所有指定字段（`AND` 语义）。

  </Accordion>
  <Accordion title="账号作用域详情">
    - 省略 `accountId` 的绑定只匹配默认账号。它不会匹配所有账号。
    - 使用 `accountId: "*"` 作为跨所有账号的渠道级回退。
    - 使用 `accountId: "<name>"` 匹配一个账号。
    - 如果你稍后为同一智能体添加相同绑定并指定显式账号 ID，OpenClaw 会将现有的仅渠道绑定升级为账号作用域绑定，而不是复制一份。

  </Accordion>
</AccordionGroup>

## 多个账号/电话号码

支持**多个账号**的渠道（例如 WhatsApp）使用 `accountId` 标识每次登录。每个 `accountId` 都可以路由到不同智能体，因此一台服务器可以托管多个电话号码，而不会混淆会话。

如果你想在省略 `accountId` 时使用渠道级默认账号，请设置 `channels.<channel>.defaultAccount`（可选）。未设置时，如果存在 `default`，OpenClaw 会回退到 `default`，否则回退到第一个已配置的账号 ID（排序后）。

支持这种模式的常见渠道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个“大脑”（工作区、按智能体划分的凭证、按智能体划分的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `"personal"` 与 `"biz"`）。
- `binding`：按 `(channel, accountId, peer)`，以及可选的 guild/team ID，将入站消息路由到 `agentId`。
- 直接聊天会折叠为 `agent:<agentId>:<mainKey>`（按智能体划分的“main”；`session.mainKey`）。

## 平台示例

<AccordionGroup>
  <Accordion title="每个智能体一个 Discord bot">
    每个 Discord bot 账号都会映射到唯一的 `accountId`。将每个账号绑定到一个智能体，并按 bot 保留允许列表。

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

    - 邀请每个 bot 加入服务器并启用 Message Content Intent。
    - 令牌位于 `channels.discord.accounts.<id>.token`（默认账号可以使用 `DISCORD_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个智能体一个 Telegram bot">
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

    - 使用 BotFather 为每个智能体创建一个 bot，并复制每个令牌。
    - 令牌位于 `channels.telegram.accounts.<id>.botToken`（默认账号可以使用 `TELEGRAM_BOT_TOKEN`）。
    - 对于同一 Telegram 群组中的多个 bot，邀请每个 bot，并提及应该回答的 bot。
    - 为每个群组 bot 禁用 BotFather Privacy Mode，然后重新添加该 bot，让 Telegram 应用该设置。
    - 使用 `channels.telegram.groups` 允许群组，或仅在受信任的群组部署中使用 `groupPolicy: "open"`。
    - 将发送者用户 ID 放入 `groupAllowFrom`。群组和超级群组 ID 应放在 `channels.telegram.groups` 中，而不是 `groupAllowFrom`。
    - 按 `accountId` 绑定，让每个 bot 路由到自己的智能体。

  </Accordion>
  <Accordion title="每个智能体一个 WhatsApp 号码">
    启动 Gateway 网关前先链接每个账号：

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 常见模式

<Tabs>
  <Tab title="WhatsApp 日常 + Telegram 深度工作">
    按渠道拆分：将 WhatsApp 路由到快速的日常智能体，将 Telegram 路由到 Opus 智能体。

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    说明：

    - 这些示例使用 `accountId: "*"`，因此如果你以后添加账号，绑定仍会继续工作。
    - 要将单个私信/群组路由到 Opus，同时让其余会话保持在 chat 上，请为该 peer 添加一个 `match.peer` 绑定；peer 匹配始终优先于渠道范围规则。

  </Tab>
  <Tab title="同一渠道，一个 peer 路由到 Opus">
    保持 WhatsApp 使用快速智能体，但将一个私信路由到 Opus：

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Peer 绑定始终优先，因此请将它们放在渠道范围规则之上。

  </Tab>
  <Tab title="绑定到 WhatsApp 群组的家庭智能体">
    将一个专用家庭智能体绑定到单个 WhatsApp 群组，并配置提及门控和更严格的工具策略：

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

    说明：

    - 工具允许/拒绝列表是**工具**，不是 Skills。如果某个 Skills 需要运行二进制文件，请确保允许 `exec`，且该二进制文件存在于沙箱中。
    - 如需更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并让该渠道保持启用群组允许列表。

  </Tab>
</Tabs>

## 按智能体配置沙箱和工具

每个智能体都可以有自己的沙箱和工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` 位于 `sandbox.docker` 下，并在容器创建时运行一次。当解析出的 scope 为 `"shared"` 时，会忽略按智能体配置的 `sandbox.docker.*` 覆盖项。
</Note>

**好处：**

- **安全隔离**：限制不受信任智能体的工具。
- **资源控制**：将特定智能体放入沙箱，同时让其他智能体保留在主机上。
- **灵活策略**：为每个智能体设置不同权限。

<Note>
`tools.elevated` 是**全局**且基于发送者的；它不能按智能体配置。如果你需要按智能体划分边界，请使用 `agents.list[].tools` 拒绝 `exec`。对于群组目标，请使用 `agents.list[].groupChat.mentionPatterns`，让 @提及清晰映射到预期的智能体。
</Note>

参见[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)获取详细示例。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents) — 运行外部编码 harness
- [频道路由](/zh-CN/channels/channel-routing) — 消息如何路由到智能体
- [在线状态](/zh-CN/concepts/presence) — 智能体在线状态和可用性
- [会话](/zh-CN/concepts/session) — 会话隔离和路由
- [子智能体](/zh-CN/tools/subagents) — 生成后台智能体运行

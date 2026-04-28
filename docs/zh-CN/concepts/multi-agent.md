---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多智能体路由：隔离的智能体、渠道账号和绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-04-28T11:49:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75770f058453345ef2de281d5fffb20ccfda5e73815e27b1643909a624007b86
    source_path: concepts/multi-agent.md
    workflow: 16
---

运行多个_隔离_智能体：每个智能体都有自己的工作区、状态目录（`agentDir`）和会话历史；还可以在一个运行中的 Gateway 网关中使用多个渠道账号（例如两个 WhatsApp）。入站消息会通过绑定路由到正确的智能体。

这里的**智能体**是完整的按 persona 划分的范围：工作区文件、认证配置、模型注册表和会话存储。`agentDir` 是磁盘上的状态目录，用来保存这个按智能体划分的配置，位置为 `~/.openclaw/agents/<agentId>/`。**绑定**会把一个渠道账号（例如一个 Slack 工作区或一个 WhatsApp 号码）映射到其中一个智能体。

## “一个智能体”是什么？

**智能体**是一个完全划定范围的“大脑”，拥有自己的：

- **工作区**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、persona 规则）。
- **状态目录**（`agentDir`），用于认证配置、模型注册表和按智能体划分的配置。
- **会话存储**（聊天历史 + 路由状态），位于 `~/.openclaw/agents/<agentId>/sessions` 下。

认证配置是**按智能体划分**的。每个智能体都会从自己的位置读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
这里 `sessions_history` 也是更安全的跨会话回忆路径：它返回的是有边界、已清理的视图，而不是原始转录的直接转储。Assistant 回忆会在脱敏/截断前剥离思考标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、降级后的工具调用脚手架、泄漏的 ASCII/全角模型控制 token，以及格式错误的 MiniMax 工具调用 XML。
</Note>

<Warning>
主智能体凭证**不会**自动共享。不要在多个智能体之间复用 `agentDir`（这会导致认证/会话冲突）。如果你想共享凭证，请把 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。
</Warning>

Skills 会从每个智能体工作区以及 `~/.openclaw/skills` 等共享根目录加载，然后在配置了有效智能体技能允许列表时进行过滤。使用 `agents.defaults.skills` 设置共享基线，使用 `agents.list[].skills` 设置按智能体替换。参见 [Skills：按智能体与共享](/zh-CN/tools/skills#per-agent-vs-shared-skills) 和 [Skills：智能体技能允许列表](/zh-CN/tools/skills#agent-skill-allowlists)。

Gateway 网关可以托管**一个智能体**（默认）或**多个智能体**并排运行。

<Note>
**工作区注意事项：**每个智能体的工作区是**默认 cwd**，不是强沙箱。相对路径会在工作区内解析，但除非启用了沙箱隔离，否则绝对路径可以访问主机上的其他位置。参见[沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 路径（快速图示）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果你什么都不做，OpenClaw 会运行单个智能体：

- `agentId` 默认为 **`main`**。
- 会话以 `agent:main:<mainKey>` 作为键。
- 工作区默认为 `~/.openclaw/workspace`（设置了 `OPENCLAW_PROFILE` 时则为 `~/.openclaw/workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

## 智能体助手

使用智能体向导添加一个新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导完成）来路由入站消息。

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

    每个智能体都会获得自己的工作区，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，并且在 `~/.openclaw/agents/<agentId>` 下拥有专用的 `agentDir` 和会话存储。

  </Step>
  <Step title="创建渠道账号">
    在你偏好的渠道上为每个智能体创建一个账号：

    - Discord：每个智能体一个 bot，启用 Message Content Intent，复制每个 token。
    - Telegram：通过 BotFather 为每个智能体创建一个 bot，复制每个 token。
    - WhatsApp：为每个账号关联对应的电话号码。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    参见渠道指南：[Discord](/zh-CN/channels/discord)、[Telegram](/zh-CN/channels/telegram)、[WhatsApp](/zh-CN/channels/whatsapp)。

  </Step>
  <Step title="添加智能体、账号和绑定">
    在 `agents.list` 下添加智能体，在 `channels.<channel>.accounts` 下添加渠道账号，并用 `bindings` 将它们连接起来（示例如下）。
  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多个智能体 = 多个人、多个个性

使用**多个智能体**时，每个 `agentId` 都会成为一个**完全隔离的 persona**：

- **不同的电话号码/账号**（按渠道 `accountId`）。
- **不同的个性**（按智能体划分的工作区文件，例如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的认证 + 会话**（除非显式启用，否则不会串线）。

这让**多个人**可以共享一个 Gateway 网关服务器，同时让他们的 AI“大脑”和数据保持隔离。

## 跨智能体 QMD 记忆搜索

如果一个智能体应搜索另一个智能体的 QMD 会话转录，请在 `agents.list[].memorySearch.qmd.extraCollections` 下添加额外 collection。只有当每个智能体都应该继承相同的共享转录 collection 时，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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

额外 collection 路径可以在多个智能体之间共享，但当路径位于智能体工作区之外时，collection 名称会保持显式。工作区内的路径仍然按智能体划定范围，因此每个智能体都会保留自己的转录搜索集。

## 一个 WhatsApp 号码，多个人（私信拆分）

你可以在**一个 WhatsApp 账号**上，将**不同 WhatsApp 私信**路由到不同智能体。使用 `peer.kind: "direct"` 按发送方 E.164（例如 `+15551234567`）匹配。回复仍然来自同一个 WhatsApp 号码（没有按智能体划分的发送方身份）。

<Note>
直接聊天会折叠到智能体的**主会话键**，因此真正隔离需要**每个人一个智能体**。
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

注意：

- 私信访问控制是**每个 WhatsApp 账号的全局设置**（配对/允许列表），不是按智能体划分。
- 对于共享群组，请把群组绑定到一个智能体，或使用[广播群组](/zh-CN/channels/broadcast-groups)。

## 路由规则（消息如何选择智能体）

绑定是**确定性的**，并且**最具体者优先**：

<Steps>
  <Step title="peer 匹配">
    精确的私信/群组/渠道 ID。
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
  <Step title="渠道的 accountId 匹配">
    按账号回退。
  </Step>
  <Step title="渠道级匹配">
    `accountId: "*"`。
  </Step>
  <Step title="默认智能体">
    回退到 `agents.list[].default`，否则使用列表中的第一个条目，默认值：`main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="平局处理和 AND 语义">
    - 如果同一层级中有多个绑定匹配，则配置顺序中第一个匹配项获胜。
    - 如果一个绑定设置了多个匹配字段（例如 `peer` + `guildId`），则所有指定字段都必须满足（`AND` 语义）。

  </Accordion>
  <Accordion title="账号范围细节">
    - 省略 `accountId` 的绑定只会匹配默认账号。
    - 使用 `accountId: "*"` 为渠道中的所有账号设置兜底。
    - 如果你之后为同一个智能体添加了同一绑定，但带有显式账号 ID，OpenClaw 会把现有的仅渠道绑定升级为按账号划分的绑定，而不是创建重复项。

  </Accordion>
</AccordionGroup>

## 多账号 / 电话号码

支持**多账号**的渠道（例如 WhatsApp）使用 `accountId` 标识每次登录。每个 `accountId` 都可以路由到不同的智能体，因此一台服务器可以托管多个电话号码而不会混合会话。

如果你想在省略 `accountId` 时使用渠道范围的默认账号，请设置 `channels.<channel>.defaultAccount`（可选）。未设置时，如果存在 `default`，OpenClaw 会回退到它，否则回退到第一个配置的账号 ID（排序后）。

支持此模式的常见渠道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个“大脑”（工作区、按智能体划分的认证、按智能体划分的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `"personal"` 与 `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)` 以及可选的 guild/team ID，将入站消息路由到某个 `agentId`。
- 直接聊天会折叠为 `agent:<agentId>:<mainKey>`（按智能体划分的“main”；`session.mainKey`）。

## 平台示例

<AccordionGroup>
  <Accordion title="每个智能体一个 Discord bot">
    每个 Discord bot 账号都会映射到一个唯一的 `accountId`。将每个账号绑定到一个智能体，并按 bot 保持允许列表。

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

    - 邀请每个 bot 加入 guild 并启用 Message Content Intent。
    - Token 存放在 `channels.discord.accounts.<id>.token` 中（默认账号可以使用 `DISCORD_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个智能体对应的 Telegram 机器人">
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

    - 使用 BotFather 为每个智能体创建一个机器人，并复制每个令牌。
    - 令牌位于 `channels.telegram.accounts.<id>.botToken`（默认账号可以使用 `TELEGRAM_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个智能体对应的 WhatsApp 号码">
    启动 Gateway 网关前，先链接每个账号：

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
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    说明：

    - 如果一个渠道有多个账号，请在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
    - 要将单个私信/群组路由到 Opus，同时让其余消息保留在 chat 上，请为该对端添加 `match.peer` 绑定；对端匹配始终优先于渠道级规则。

  </Tab>
  <Tab title="同一渠道，将一个对端路由到 Opus">
    让 WhatsApp 保持在快速智能体上，但将一个私信路由到 Opus：

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

    对端绑定始终优先，所以请将它们放在渠道级规则上方。

  </Tab>
  <Tab title="绑定到 WhatsApp 群组的家庭智能体">
    将一个专用家庭智能体绑定到单个 WhatsApp 群组，并启用提及门控和更严格的工具策略：

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

    - 工具允许/拒绝列表是**工具**，不是 Skills。如果某个 Skills 需要运行二进制文件，请确保允许 `exec`，并且该二进制文件存在于沙箱中。
    - 如需更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并保持该渠道的群组允许列表处于启用状态。

  </Tab>
</Tabs>

## 每智能体沙箱和工具配置

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
`setupCommand` 位于 `sandbox.docker` 下，并在容器创建时运行一次。当解析后的作用域为 `"shared"` 时，会忽略每智能体的 `sandbox.docker.*` 覆盖项。
</Note>

**优势：**

- **安全隔离**：限制不受信任智能体的工具。
- **资源控制**：对特定智能体使用沙箱，同时让其他智能体保留在主机上。
- **灵活策略**：为每个智能体设置不同权限。

<Note>
`tools.elevated` 是**全局**且基于发送者的；它不能按智能体配置。如果你需要每智能体边界，请使用 `agents.list[].tools` 来拒绝 `exec`。对于群组目标，请使用 `agents.list[].groupChat.mentionPatterns`，让 @提及清晰映射到目标智能体。
</Note>

详细示例见[多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents) — 运行外部编码 harness
- [渠道路由](/zh-CN/channels/channel-routing) — 消息如何路由到智能体
- [在线状态](/zh-CN/concepts/presence) — 智能体在线状态和可用性
- [会话](/zh-CN/concepts/session) — 会话隔离和路由
- [子智能体](/zh-CN/tools/subagents) — 生成后台智能体运行

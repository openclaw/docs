---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多智能体路由：隔离的智能体、渠道账号和绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-04-26T11:00:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

在一个正在运行的 Gateway 网关中运行多个**隔离的**智能体——每个智能体都有自己的工作区、状态目录（`agentDir`）和会话历史——以及多个渠道账号（例如两个 WhatsApp）。入站消息会通过绑定被路由到正确的智能体。

这里的**智能体**指的是完整的单个人设作用域：工作区文件、认证配置文件、模型注册表和会话存储。`agentDir` 是磁盘上的状态目录，用于保存该智能体在 `~/.openclaw/agents/<agentId>/` 下的各项配置。**绑定**则将一个渠道账号（例如某个 Slack 工作区或一个 WhatsApp 号码）映射到其中一个智能体。

## 什么是“一个智能体”？

这里的**智能体**是一个完整隔离的“大脑”，它拥有自己的：

- **工作区**（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、人设规则）。
- 用于保存认证配置文件、模型注册表和每智能体配置的**状态目录**（`agentDir`）。
- 位于 `~/.openclaw/agents/<agentId>/sessions` 下的**会话存储**（聊天历史 + 路由状态）。

认证配置文件是**按智能体隔离**的。每个智能体会从自己的以下路径读取：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
这里的 `sessions_history` 也是更安全的跨会话回忆路径：它返回的是有边界、已清理的视图，而不是原始对话转储。助手回忆会剥离 thinking 标签、`<relevant-memories>` 脚手架、纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）、降级后的工具调用脚手架、泄露的 ASCII / 全角模型控制令牌，以及格式错误的 MiniMax 工具调用 XML，然后再进行脱敏 / 截断。
</Note>

<Warning>
主智能体的凭证**不会**自动共享。绝不要在多个智能体之间复用 `agentDir`（这会导致认证 / 会话冲突）。如果你想共享凭证，请将 `auth-profiles.json` 复制到另一个智能体的 `agentDir` 中。
</Warning>

Skills 会从每个智能体的工作区以及 `~/.openclaw/skills` 之类的共享根目录中加载，然后在配置了有效的智能体 Skills 允许列表时按该列表进行筛选。使用 `agents.defaults.skills` 作为共享基线，使用 `agents.list[].skills` 进行按智能体替换。参见 [Skills：按智能体与共享](/zh-CN/tools/skills#per-agent-vs-shared-skills) 和 [Skills：智能体 Skills 允许列表](/zh-CN/tools/skills#agent-skill-allowlists)。

Gateway 网关可以承载**一个智能体**（默认）或并排承载**多个智能体**。

<Note>
**工作区说明：**每个智能体的工作区是默认的 **cwd**，并不是强制性的硬沙箱。相对路径会在工作区内解析，但绝对路径仍然可以访问主机上的其他位置，除非启用了沙箱隔离。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 路径（快速映射）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.list[].agentDir`）
- 会话：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果你什么都不做，OpenClaw 会运行一个单智能体：

- `agentId` 默认为 **`main`**。
- 会话键格式为 `agent:main:<mainKey>`。
- 工作区默认为 `~/.openclaw/workspace`（设置了 `OPENCLAW_PROFILE` 时，则为 `~/.openclaw/workspace-<profile>`）。
- 状态默认位于 `~/.openclaw/agents/main/agent`。

## 智能体助手

使用智能体向导来添加一个新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导代为完成），以便路由入站消息。

通过以下命令验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="创建每个智能体的工作区">
    使用向导，或手动创建工作区：

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每个智能体都会获得自己的工作区，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，以及位于 `~/.openclaw/agents/<agentId>` 下的专用 `agentDir` 和会话存储。

  </Step>
  <Step title="创建渠道账号">
    在你偏好的渠道上，为每个智能体创建一个账号：

    - Discord：每个智能体一个 bot，启用 Message Content Intent，并复制各自的 token。
    - Telegram：通过 BotFather 为每个智能体创建一个 bot，并复制各自的 token。
    - WhatsApp：为每个账号关联各自的电话号码。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    参见各渠道指南：[Discord](/zh-CN/channels/discord)、[Telegram](/zh-CN/channels/telegram)、[WhatsApp](/zh-CN/channels/whatsapp)。

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

## 多个智能体 = 多个人，多种人格

有了**多个智能体**后，每个 `agentId` 都会成为一个**完全隔离的人设**：

- **不同的电话号码 / 账号**（按渠道 `accountId` 区分）。
- **不同的人设**（通过按智能体划分的工作区文件，例如 `AGENTS.md` 和 `SOUL.md`）。
- **独立的认证 + 会话**（除非显式启用，否则不会串线）。

这使得**多个人**可以共享一台 Gateway 网关服务器，同时保持各自的 AI “大脑” 和数据相互隔离。

## 跨智能体 QMD memory 搜索

如果某个智能体需要搜索另一个智能体的 QMD 会话转录内容，请在 `agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。只有在每个智能体都应继承相同共享转录集合时，才使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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
            extraCollections: [{ path: "notes" }], // 在工作区内解析 -> 集合名为 "notes-main"
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

额外集合路径可以在多个智能体之间共享，但当路径位于智能体工作区之外时，集合名称仍需显式指定。工作区内的路径则继续保持智能体作用域，这样每个智能体都能维护自己的转录搜索集合。

## 一个 WhatsApp 号码，多个人（私信拆分）

你可以在**同一个 WhatsApp 账号**上，将**不同的 WhatsApp 私信**路由给不同的智能体。方法是使用 `peer.kind: "direct"` 按发送者 E.164 号码（如 `+15551234567`）进行匹配。回复仍然会来自同一个 WhatsApp 号码（不会按智能体区分发送者身份）。

<Note>
私聊会折叠到该智能体的**主会话键**，因此真正的隔离需要为**每个人使用一个智能体**。
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

- 私信访问控制是**按 WhatsApp 账号全局**生效的（配对 / 允许列表），而不是按智能体生效。
- 对于共享群组，请将该群组绑定到一个智能体，或使用 [Broadcast groups](/zh-CN/channels/broadcast-groups)。

## 路由规则（消息如何选择智能体）

绑定是**确定性的**，并遵循**最具体优先**原则：

<Steps>
  <Step title="peer 匹配">
    精确匹配私信 / 群组 / 渠道 id。
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
  <Step title="渠道中的 accountId 匹配">
    按账号回退。
  </Step>
  <Step title="渠道级匹配">
    `accountId: "*"`。
  </Step>
  <Step title="默认智能体">
    回退到 `agents.list[].default`，否则使用列表中的第一项，默认是 `main`。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="平局处理和 AND 语义">
    - 如果同一层级中有多个绑定匹配，则按配置顺序取第一个。
    - 如果一个绑定设置了多个匹配字段（例如 `peer` + `guildId`），则所有指定字段都必须匹配（`AND` 语义）。

  </Accordion>
  <Accordion title="账号作用域细节">
    - 省略 `accountId` 的绑定只匹配默认账号。
    - 使用 `accountId: "*"` 可为该渠道下所有账号设置渠道级回退。
    - 如果你之后为同一个智能体、同一绑定添加了显式账号 id，OpenClaw 会将现有的仅渠道绑定升级为账号作用域绑定，而不是创建重复项。

  </Accordion>
</AccordionGroup>

## 多个账号 / 电话号码

支持**多个账号**的渠道（例如 WhatsApp）使用 `accountId` 标识每次登录。每个 `accountId` 都可以路由到不同的智能体，因此一台服务器可以承载多个电话号码而不会混淆会话。

如果你希望在省略 `accountId` 时使用渠道级默认账号，可以设置 `channels.<channel>.defaultAccount`（可选）。如果未设置，OpenClaw 会优先回退到 `default`；如果没有 `default`，则回退到排序后的第一个已配置账号 id。

常见支持这种模式的渠道包括：

- `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`
- `irc`、`line`、`googlechat`、`mattermost`、`matrix`、`nextcloud-talk`
- `bluebubbles`、`zalo`、`zalouser`、`nostr`、`feishu`

## 概念

- `agentId`：一个“大脑”（工作区、按智能体隔离的认证、按智能体隔离的会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `"personal"` 与 `"biz"`）。
- `binding`：按 `(channel, accountId, peer)` 以及可选的 guild / team id，将入站消息路由到某个 `agentId`。
- 私聊会折叠为 `agent:<agentId>:<mainKey>`（按智能体划分的“主会话”；`session.mainKey`）。

## 平台示例

<AccordionGroup>
  <Accordion title="每个智能体一个 Discord bot">
    每个 Discord bot 账号都映射到一个唯一的 `accountId`。将每个账号绑定到一个智能体，并为每个 bot 分别维护允许列表。

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

    - 将每个 bot 邀请到 guild 中，并启用 Message Content Intent。
    - token 存放在 `channels.discord.accounts.<id>.token` 中（默认账号可使用 `DISCORD_BOT_TOKEN`）。

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

    - 通过 BotFather 为每个智能体创建一个 bot，并复制各自的 token。
    - token 存放在 `channels.telegram.accounts.<id>.botToken` 中（默认账号可使用 `TELEGRAM_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个智能体一个 WhatsApp 号码">
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

      // 确定性路由：第一个匹配项获胜（最具体的优先）。
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 可选的按 peer 覆盖（示例：将某个特定群组发送到 work 智能体）。
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // 默认关闭：智能体之间的消息传递必须显式启用 + 加入允许列表。
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
              // 可选覆盖。默认值：~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // 可选覆盖。默认值：~/.openclaw/credentials/whatsapp/biz
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
    按渠道拆分：将 WhatsApp 路由到一个快速的日常智能体，将 Telegram 路由到一个 Opus 智能体。

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

    - 如果某个渠道有多个账号，请在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
    - 如果你想将单个私信 / 群组路由到 Opus，同时其余内容仍保留在 chat 上，请为该 peer 添加一条 `match.peer` 绑定；peer 匹配始终优先于渠道级规则。

  </Tab>
  <Tab title="同一渠道中，单个 peer 路由到 Opus">
    保持 WhatsApp 使用快速智能体，但将某一个私信路由到 Opus：

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

    peer 绑定始终优先，因此请将它们放在渠道级规则之上。

  </Tab>
  <Tab title="绑定到 WhatsApp 群组的家庭智能体">
    将一个专用家庭智能体绑定到单个 WhatsApp 群组，并配合 mention 门控和更严格的工具策略：

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

    - 工具 allow / deny 列表针对的是**工具**，不是 Skills。如果某个 skill 需要运行二进制文件，请确保已允许 `exec`，并且该二进制在沙箱中存在。
    - 若要实现更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并保持该渠道的群组允许列表处于启用状态。

  </Tab>
</Tabs>

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
        // 不限制工具 - 所有工具都可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终使用沙箱隔离
          scope: "agent",  // 每个智能体一个容器
          docker: {
            // 容器创建后可选的一次性设置
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 仅允许 read 工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒绝其他工具
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` 位于 `sandbox.docker` 下，并会在容器创建时运行一次。当解析后的 scope 为 `"shared"` 时，按智能体设置的 `sandbox.docker.*` 覆盖项会被忽略。
</Note>

**优点：**

- **安全隔离**：可为不受信任的智能体限制工具。
- **资源控制**：可只对特定智能体启用沙箱隔离，而让其他智能体继续在主机上运行。
- **灵活策略**：为不同智能体设置不同权限。

<Note>
`tools.elevated` 是**全局**且基于发送者的；它不能按智能体配置。如果你需要按智能体划分边界，请使用 `agents.list[].tools` 拒绝 `exec`。对于群组定向，请使用 `agents.list[].groupChat.mentionPatterns`，这样 @mentions 就能清晰地映射到预期的智能体。
</Note>

详细示例参见 [多智能体沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

## 相关内容

- [ACP 智能体](/zh-CN/tools/acp-agents) —— 运行外部编码 harness
- [渠道路由](/zh-CN/channels/channel-routing) —— 消息如何路由到智能体
- [在线状态](/zh-CN/concepts/presence) —— 智能体的在线状态与可用性
- [会话](/zh-CN/concepts/session) —— 会话隔离与路由
- [子智能体](/zh-CN/tools/subagents) —— 生成后台智能体运行

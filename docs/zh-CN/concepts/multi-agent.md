---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 多 Agent 路由：隔离的智能体、渠道账号和绑定
title: 多智能体路由
x-i18n:
    generated_at: "2026-07-05T11:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48e32d9e8ac2b68fdceb9a84d95bae2a73ab10f9c5fd177b72e8e452954329e9
    source_path: concepts/multi-agent.md
    workflow: 16
---

在一个 Gateway 网关进程中运行多个 _隔离的_ 智能体，每个智能体都有自己的工作区、状态目录（`agentDir`）和会话存储，并支持多个渠道账号（例如两个 WhatsApp 号码）。入站消息通过 **绑定** 路由到正确的智能体。

**智能体** 是完整的按 persona 划分的范围：工作区文件、凭证配置、模型注册表和会话存储。**绑定** 将一个渠道账号（Slack 工作区、WhatsApp 号码等）映射到这些智能体之一。

## 什么是一个智能体

每个智能体都有自己的：

- **工作区**：文件、`AGENTS.md`/`SOUL.md`/`USER.md`、本地笔记、persona 规则。
- **状态目录**（`agentDir`）：凭证配置、模型注册表、按智能体配置。
- **会话存储**：位于 `~/.openclaw/agents/<agentId>/sessions` 下的聊天历史和路由状态。

凭证配置按智能体划分，读取自：

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` 是更安全的跨会话召回路径：它返回有边界且经过脱敏的视图，而不是原始 transcript 转储。它会剥离思考块签名、工具结果载荷细节、`<relevant-memories>` 脚手架、工具调用 XML 标签（`<tool_call>`、`<function_call>` 及其复数/降级形式），以及 MiniMax 工具调用 XML，然后按字节大小截断并限制输出。
</Note>

<Warning>
切勿在多个智能体之间复用 `agentDir`，这会导致凭证/会话状态冲突。当次要智能体的本地 OAuth 凭证过期或刷新失败时，OpenClaw 会透传读取同一配置 ID 对应的默认/主智能体凭证，并采用最新的令牌，而不会把刷新令牌复制到次要智能体的存储中。如果你需要完全独立的 OAuth 账号，请从该智能体登录。如果你手动复制凭证，只复制可移植的静态 `api_key` 或 `token` 配置，OAuth 刷新材料默认不可移植（`copyToAgents` 可以显式选择让某个配置可复制）。
</Warning>

Skills 会从每个智能体工作区以及 `~/.openclaw/skills` 等共享根加载，然后按有效的智能体 Skills 允许列表过滤。使用 `agents.defaults.skills` 设置共享基线，使用 `agents.list[].skills` 设置按智能体替换（显式条目会替换默认值，不会合并）。参见 [Skills：按智能体与共享](/zh-CN/tools/skills#per-agent-vs-shared-skills) 和 [Skills：智能体允许列表](/zh-CN/tools/skills#agent-allowlists)。

<Note>
**工作区说明：**每个智能体的工作区是**默认 cwd**，不是强沙箱。相对路径会在工作区内解析，但除非启用沙箱隔离，否则绝对路径可以访问主机上的其他位置。参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。
</Note>

## 路径

| 内容                      | 默认值                                                                                 | 覆盖                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 配置                      | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| 状态目录                  | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| 默认智能体的工作区        | `~/.openclaw/workspace`（或在设置 `OPENCLAW_PROFILE` 时为 `workspace-<profile>`）      | `agents.list[].workspace`，然后是 `agents.defaults.workspace`，或 `OPENCLAW_WORKSPACE_DIR` |
| 其他智能体的工作区        | `<stateDir>/workspace-<agentId>`（或在设置时为 `<agents.defaults.workspace>/<agentId>`） | `agents.list[].workspace`                                                                |
| 智能体目录                | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| 会话                      | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### 单智能体模式（默认）

如果你什么都不配置，OpenClaw 会运行一个智能体：

- `agentId` 默认为 `main`。
- 会话键为 `agent:main:<mainKey>`（默认 `mainKey` 是 `main`）。
- 工作区默认为 `~/.openclaw/workspace`（或当 `OPENCLAW_PROFILE` 设置为非 `default` 值时为 `workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

## 智能体辅助工具

添加一个新的隔离智能体：

```bash
openclaw agents add work
```

标志：`--workspace <dir>`、`--model <id>`、`--agent-dir <dir>`、`--bind <channel[:accountId]>`（可重复）、`--non-interactive`（需要 `--workspace`）。

添加 `bindings` 以路由入站消息（向导会提供此操作），然后验证：

```bash
openclaw agents list --bindings
```

## 快速开始

<Steps>
  <Step title="创建每个智能体工作区">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    每个智能体都会获得自己的工作区，其中包含 `SOUL.md`、`AGENTS.md` 和可选的 `USER.md`，并在 `~/.openclaw/agents/<agentId>` 下拥有专用 `agentDir` 和会话存储。

  </Step>
  <Step title="创建渠道账号">
    在你偏好的渠道上为每个智能体创建一个账号：

    - Discord：每个智能体一个 Bot，启用 Message Content Intent，复制每个令牌。
    - Telegram：通过 BotFather 为每个智能体创建一个 Bot，复制每个令牌。
    - WhatsApp：为每个账号关联一个电话号码。

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    参见渠道指南：[Discord](/zh-CN/channels/discord)、[Telegram](/zh-CN/channels/telegram)、[WhatsApp](/zh-CN/channels/whatsapp)。

  </Step>
  <Step title="添加智能体、账号和绑定">
    在 `agents.list` 下添加智能体，在 `channels.<channel>.accounts` 下添加渠道账号，并用 `bindings` 将它们连接起来（示例见下文）。
  </Step>
  <Step title="重启并验证">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 多个智能体，多个 persona

每个配置的 `agentId` 都是一个完全隔离的 persona：

- 每个渠道使用不同账号（按 `accountId`）。
- 不同个性（按智能体的 `AGENTS.md`/`SOUL.md`）。
- 分离的凭证和会话，除非显式启用，否则不会串话。

这让多人可以共享一个 Gateway 网关，同时保持各自的智能体状态隔离。

## 跨智能体 QMD 记忆搜索

要让一个智能体搜索另一个智能体的 QMD 会话 transcript，请在 `agents.list[].memorySearch.qmd.extraCollections` 下添加额外集合。当每个智能体都应共享相同集合时，使用 `agents.defaults.memorySearch.qmd.extraCollections`。

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

额外集合路径可以在多个智能体之间共享，但当路径位于智能体工作区之外时，它的 `name` 会保持显式。工作区内的路径保持按智能体限定，因此每个智能体都会保留自己的 transcript 搜索集合。

## 一个 WhatsApp 号码，多个人（私信拆分）

通过用 `peer.kind: "direct"` 匹配发送者 E.164（`+15551234567`），在**一个** WhatsApp 账号上将不同 WhatsApp 私信路由到不同智能体。回复仍来自同一个 WhatsApp 号码，没有按智能体划分的发送者身份。

<Note>
默认情况下，直接聊天会折叠到智能体的主会话键，因此真正的隔离需要为每个人使用一个智能体。
</Note>

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

私信访问控制（配对/允许列表）按 WhatsApp 账号全局生效，而不是按智能体生效。对于共享群组，请将该群组绑定到一个智能体，或使用 [广播群组](/zh-CN/channels/broadcast-groups)。

## 路由规则

绑定是确定性的，并且最具体的匹配胜出。完整的层级顺序（精确 peer、父 peer、peer 通配符、guild+roles、guild、team、account、channel、默认智能体）见 [渠道路由](/zh-CN/channels/channel-routing#routing-rules-how-an-agent-is-chosen)。这里有几条值得指出的规则：

- 如果同一层级内有多个绑定匹配，则配置顺序中的第一个胜出。
- 如果绑定设置了多个匹配字段（例如 `peer` + `guildId`），所有指定字段都必须匹配（`AND` 语义）。
- 省略 `accountId` 的绑定只匹配默认账号，而不是每个账号。使用 `accountId: "*"` 作为渠道范围的回退，或使用 `accountId: "<name>"` 指定某个账号。再次添加同一绑定并带上显式账号 ID，会升级现有的仅渠道绑定，而不是创建重复绑定。

## 多账号 / 电话号码

支持多账号的渠道（例如 WhatsApp）使用 `accountId` 标识每次登录。每个 `accountId` 都会路由到自己的智能体，因此一台服务器可以托管多个电话号码，而不会混用会话。

设置 `channels.<channel>.defaultAccount` 以选择在省略 `accountId` 时使用的账号。未设置时，OpenClaw 会在存在 `default` 时回退到它，否则回退到第一个已配置账号 ID（排序后）。

支持多账号的渠道：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`mattermost`、`matrix`、`nextcloud-talk`、`nostr`、`signal`、`slack`、`telegram`、`whatsapp`、`zalo`、`zalouser`。

## 概念

- `agentId`：一个“脑”（工作区、按智能体凭证、按智能体会话存储）。
- `accountId`：一个渠道账号实例（例如 WhatsApp 账号 `personal` 与 `biz`）。
- `binding`：按 `(channel, accountId, peer)` 将入站消息路由到一个 `agentId`，也可以选择使用 guild/team ID。
- 直接聊天会折叠到 `agent:<agentId>:<mainKey>`（按智能体的“main”；参见 `session.mainKey`）。

## 平台示例

<AccordionGroup>
  <Accordion title="每个智能体一个 Discord Bot">
    每个 Discord Bot 账号映射到唯一的 `accountId`。将每个账号绑定到一个智能体，并按 Bot 维护允许列表。

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

    - 将每个 bot 邀请到 guild，并启用 Message Content Intent。
    - Token 位于 `channels.discord.accounts.<id>.token`（默认 account 可以使用 `DISCORD_BOT_TOKEN`）。

  </Accordion>
  <Accordion title="每个 agent 对应的 Telegram bot">
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

    - 使用 BotFather 为每个 agent 创建一个 bot，并复制各自的 token。
    - Token 位于 `channels.telegram.accounts.<id>.botToken`（默认 account 可以使用 `TELEGRAM_BOT_TOKEN`）。
    - 对于同一个 Telegram 群组中的多个 bot，邀请每个 bot，并提及应该回答的那个 bot。
    - 为每个群组 bot 禁用 BotFather Privacy Mode（`/setprivacy` -> Disable），然后移除并重新添加 bot，让 Telegram 应用该设置。
    - 使用 `channels.telegram.groups` 允许群组，或仅在受信任的群组部署中使用 `groupPolicy: "open"`。
    - 将发送者用户 ID 放入 `groupAllowFrom`。群组和超级群组 ID 属于 `channels.telegram.groups`，不属于 `groupAllowFrom`。
    - 按 `accountId` 绑定，让每个 bot 路由到自己的 agent。

  </Accordion>
  <Accordion title="每个 agent 对应的 WhatsApp 号码">
    在启动 Gateway 网关之前链接每个 account：

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5)：

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

      // 确定性路由：第一个匹配项获胜（最具体的在前）。
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // 可选的按 peer 覆盖（示例：将特定群组发送到 work agent）。
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // 默认关闭：agent 到 agent 的消息传递必须显式启用并加入 allowlist。
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

  </Accordion>
</AccordionGroup>

## 常见模式

<Tabs>
  <Tab title="WhatsApp 日常 + Telegram 深度工作">
    按渠道拆分：将 WhatsApp 路由到快速的日常 agent，将 Telegram 路由到 Opus agent。

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

    这些示例使用 `accountId: "*"`，因此如果你之后添加 account，绑定仍会继续工作。要在其余内容仍保留在 chat 上的同时，将单个私信/群组路由到 Opus，请为该 peer 添加 `match.peer` 绑定——peer 匹配始终优先于整个渠道范围的规则。

  </Tab>
  <Tab title="同一渠道，一个 peer 到 Opus">
    将 WhatsApp 保留在快速 agent 上，但将一个私信路由到 Opus：

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

    Peer 绑定始终优先，因此将它们放在整个渠道范围规则之上。

  </Tab>
  <Tab title="绑定到 WhatsApp 群组的家庭 agent">
    将专用家庭 agent 绑定到单个 WhatsApp 群组，并使用提及门控和更严格的工具策略：

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

    工具 allow/deny 列表是**工具**，不是 skills。如果某个 skill 需要运行二进制文件，请确保允许 `exec`，并且该二进制文件存在于沙箱中。要使用更严格的门控，请设置 `agents.list[].groupChat.mentionPatterns`，并保持该渠道启用群组 allowlist。

  </Tab>
</Tabs>

## 按 agent 配置的沙箱和工具配置

每个 agent 都可以有自己的沙箱和工具限制：

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // personal agent 不使用沙箱
        },
        // 无工具限制 - 所有工具可用
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终处于沙箱隔离中
          scope: "agent",  // 每个 agent 一个容器
          docker: {
            // 容器创建后的可选一次性设置
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 仅 read 工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒绝其他工具
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` 位于 `sandbox.docker` 下，并在容器创建时运行一次。当解析后的 scope 为 `"shared"` 时，按 agent 配置的 `sandbox.docker.*` 覆盖会被忽略。
</Note>

这会带来：

- **安全隔离**：限制不受信任 agent 的工具。
- **资源控制**：将特定 agent 置于沙箱中，同时让其他 agent 保持在宿主机上。
- **灵活策略**：为每个 agent 设置不同权限。

<Note>
`tools.elevated` 同时具有全局门控（`tools.elevated.enabled`/`allowFrom`）和按 agent 门控（`agents.list[].tools.elevated.enabled`/`allowFrom`）。按 agent 门控只能进一步限制全局门控——两者都必须允许某个发送者，提升权限命令才会运行。对于群组目标，请使用 `agents.list[].groupChat.mentionPatterns`，让 @提及能清晰映射到预期 agent。
</Note>

详见[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)中的详细示例。

## 相关

- [ACP 智能体](/zh-CN/tools/acp-agents) — 运行外部代码 harness
- [渠道路由](/zh-CN/channels/channel-routing) — 消息如何路由到 agent
- [Presence](/zh-CN/concepts/presence) — agent presence 和可用性
- [Session](/zh-CN/concepts/session) — 会话隔离和路由
- [子智能体](/zh-CN/tools/subagents) — 生成后台 agent 运行

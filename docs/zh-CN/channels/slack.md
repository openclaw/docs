---
read_when:
    - 设置 Slack 或调试 Slack socket/HTTP 模式
summary: Slack 设置和运行时行为（Socket Mode + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7334027c606ff6465190433d2159c3f9cfbcf1e8a3a1e826682423f71700a064
    source_path: channels/slack.md
    workflow: 16
---

可通过 Slack 应用集成用于生产环境的私信和渠道。默认模式是 Socket Mode；也支持 HTTP Request URL。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择你的工作区 → 粘贴下方任一清单 → **Next** → **Create**。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** 与内置 Slack 插件的完整功能集一致：App Home、斜杠命令、文件、回应、置顶、群组私信，以及 emoji/usergroup 读取。当工作区策略限制作用域时，请选择 **Minimal**：它涵盖私信、渠道/群组历史记录、提及和斜杠命令，但不包含文件、回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。请参阅[清单和作用域检查清单](#manifest-and-scope-checklist)，了解每个作用域的理由以及额外斜杠命令等增量选项。
        </Note>

        Slack 创建应用后：

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**：添加 `connections:write`，保存，然后复制 `xapp-...` 值。
        - **Install App → Install to Workspace**：复制 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐的 SecretRef 设置：

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        环境变量回退（仅默认账户）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="启动 Gateway 网关">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URL">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择你的工作区 → 粘贴下方任一清单 → 将 `https://gateway-host.example.com/slack/events` 替换为你的公开 Gateway 网关 URL → **Next** → **Create**。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** 与内置 Slack 插件的完整功能集一致；对于限制严格的工作区，**Minimal** 不包含文件、回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。请参阅[清单和作用域检查清单](#manifest-and-scope-checklist)，了解每个作用域的理由。
        </Note>

        Slack 创建应用后：

        - **Basic Information → App Credentials**：复制用于请求验证的 **Signing Secret**。
        - **Install App → Install to Workspace**：复制 `xoxb-...` Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐的 SecretRef 设置：

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        为多账户 HTTP 使用唯一的 webhook 路径

        为每个账户提供不同的 `webhookPath`（默认 `/slack/events`），避免注册冲突。
        </Note>

      </Step>

      <Step title="启动 Gateway 网关">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 传输调优

默认情况下，OpenClaw 会将 Slack SDK 客户端的 pong 超时设置为 15 秒，用于 Socket Mode。仅在需要针对工作区或主机进行特定调优时才覆盖传输设置：

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

仅将此设置用于记录 Slack websocket pong/server-ping 超时，或运行在已知存在事件循环饥饿问题的主机上的 Socket Mode 工作区。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍是应用状态，而不是传输活跃性信号。

## 清单和作用域检查清单

基础 Slack 应用清单对 Socket Mode 和 HTTP Request URL 相同。只有 `settings` 块（以及斜杠命令 `url`）不同。

基础清单（Socket Mode 默认）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

对于 **HTTP Request URLs 模式**，将 `settings` 替换为 HTTP 变体，并为每个斜杠命令添加 `url`。需要公开 URL：

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### 其他清单设置

暴露扩展上述默认值的不同功能。

默认清单启用 Slack App Home 的 **Home** 标签页，并订阅 `app_home_opened`。当工作区成员打开 Home 标签页时，OpenClaw 会通过 `views.publish` 发布一个安全的默认 Home 视图；不会包含会话载荷或私有配置。**Messages** 标签页仍为 Slack 私信启用。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)，替代单个已配置命令，但有一些细节：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令已被保留。
    - 一次最多只能提供 25 个斜杠命令。

    将现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用与上方 Socket Mode 相同的 `slash_commands` 列表，并为每个条目添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        在列表中的每个命令上重复该 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    如果你希望传出消息使用活动 agent 身份（自定义用户名和图标），而不是默认 Slack 应用身份，请添加 `chat:write.customize` 机器人作用域。

    如果你使用 emoji 图标，Slack 期望使用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    如果你配置 `channels.slack.userToken`，典型读取作用域包括：

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依赖 Slack 搜索读取）

  </Accordion>
</AccordionGroup>

## 令牌模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文字符串或 SecretRef 对象。
- 配置令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）只能通过配置提供（无环境变量回退），并默认使用只读行为（`userTokenReadOnly: true`）。

Status 快照行为：

- Slack 账户检查会跟踪每个凭证的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- Status 为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账户已通过 SecretRef 或其他非内联密钥来源配置，但当前命令/运行时路径无法解析实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 中，所需组合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍优先使用机器人令牌；只有当 `userTokenReadOnly: false` 且机器人令牌不可用时，才允许用户令牌写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组      | 默认值 |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并为图片返回图片预览，或为其他文件类型返回本地文件元数据。

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` 控制私信访问。`channels.slack.allowFrom` 是规范的私信允许列表。

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认为 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认为 false）
    - `dm.groupChannels`（可选 MPIM 允许列表）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在自己的 `allowFrom` 未设置时继承 `channels.slack.allowFrom`。
    - 命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    为兼容性仍会读取旧版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom`。`openclaw doctor --fix` 在不会更改访问权限的情况下，会将它们迁移到 `dmPolicy` 和 `allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` 控制 channel 处理：

    - `open`
    - `allowlist`
    - `disabled`

    channel 允许列表位于 `channels.slack.channels` 下，并且**必须使用稳定的 Slack channel ID**（例如 `C12345678`）作为配置键。

    运行时注意事项：如果完全缺少 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 渠道允许列表条目和私信允许列表条目会在启动时解析，前提是 token 访问权限允许
    - 未解析的渠道名称条目会按配置保留，但默认会被路由忽略
    - 入站授权和渠道路由默认采用 ID 优先；直接用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    基于名称的键（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不会**匹配。渠道查找默认采用 ID 优先，因此基于名称的键永远无法成功路由，该渠道中的所有消息都会被静默阻止。这不同于 `groupPolicy: "open"`，在后者中路由不需要渠道键，并且基于名称的键看起来可以工作。

    始终使用 Slack 渠道 ID 作为键。查找方法：在 Slack 中右键点击渠道 → **复制链接** — ID（`C...`）会出现在 URL 末尾。

    正确：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    错误（在 `groupPolicy: "allowlist"` 下会被静默阻止）：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    渠道消息默认受提及门控限制。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - Slack 用户组提及（`<!subteam^S...>`），当机器人用户是该用户组成员时生效；需要 `usergroups:read`
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    按渠道控制（`channels.slack.channels.<id>`；名称只能通过启动时解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍然只映射到 `id:`）

    `allowBots` 对渠道和私有渠道采取保守策略：只有当发送机器人的 ID 明确列在该房间的 `users` 允许列表中，或 `channels.slack.allowFrom` 中至少有一个显式 Slack 所有者 ID 当前是房间成员时，才会接受机器人发送的房间消息。通配符和显示名称所有者条目不满足所有者在场要求。所有者在场使用 Slack `conversations.members`；请确保应用拥有对应房间类型的匹配读取 scope（公共渠道为 `channels:read`，私有渠道为 `groups:read`）。如果成员查找失败，OpenClaw 会丢弃机器人发送的房间消息。

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- Slack 路由绑定接受原始 peer ID，以及 Slack 目标形式，例如 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>`。
- 使用默认 `session.dmScope=main` 时，Slack 私信会合并到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 适用时，线程回复可以创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当为 `true` 时，抑制隐式线程提及，因此即使机器人已参与该线程，机器人也只会响应线程内显式的 `@bot` 提及。否则，在机器人已参与的线程中的回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 直接聊天的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 会在 Slack 中禁用**所有**回复线程，包括显式 `[[reply_to_*]]` 标签。这不同于 Telegram，后者在 `"off"` 模式下仍会遵循显式标签。Slack 线程会从渠道中隐藏消息，而 Telegram 回复会以内联方式保持可见。
</Note>

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 "👀"）

注意：

- Slack 需要 shortcodes（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账号或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活动状态时，将工具/进度更新路由到同一条已编辑的预览消息中（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设为 `status` 可在隐藏原始 command/exec 文本的同时保留紧凑的工具进度行（默认：`raw`）。

隐藏原始 command/exec 文本，同时保留紧凑进度行：

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程，原生文本流式传输和 Slack assistant 线程状态才会出现。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用或不存在回复线程时，渠道、群聊和顶层私信根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持在线程外，因此不会显示 Slack 线程样式的原生 stream/status 预览；OpenClaw 会改为在私信中发布并编辑草稿预览。
- 媒体和非文本 payload 会回退到普通投递。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/块最终消息只有在能就地编辑预览时才会 flush。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余 payload 回退到普通投递。

使用草稿预览而不是 Slack 原生文本流式传输：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

旧版键：

- `channels.slack.streamMode`（`replace | status_final | append`）会自动迁移到 `channels.slack.streaming.mode`。
- 布尔值 `channels.slack.streaming` 会自动迁移到 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport`。
- 旧版 `channels.slack.nativeStreaming` 会自动迁移到 `channels.slack.streaming.nativeTransport`。

## 输入中反应回退

`typingReaction` 会在 OpenClaw 处理回复时向入站 Slack 消息添加一个临时反应，并在运行结束时移除。它在线程回复之外最有用；线程回复会使用默认的“正在输入...”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意：

- Slack 需要 shortcodes（例如 `"hourglass_flowing_sand"`）。
- 该反应是尽力而为的，并会在回复或失败路径完成后自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（token 认证请求流程），并在获取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，因此智能体可以使用 `download-file` 获取原始文件。

    下载使用有界空闲超时和总超时。如果 Slack 文件检索停滞或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="Outbound text and files">
    - 文本块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 配置时，出站媒体上限遵循 `channels.slack.mediaMaxMb`；否则渠道发送使用媒体流水线中的 MIME kind 默认值

  </Accordion>

  <Accordion title="Delivery targets">
    首选显式目标：

    - 私信使用 `user:<id>`
    - 渠道使用 `channel:<id>`

    仅文本/块的 Slack 私信可以直接发布到用户 ID；文件上传和线程发送会先通过 Slack conversation API 打开私信，因为这些路径需要具体的 conversation ID。

  </Accordion>
</AccordionGroup>

## 命令和 slash 行为

Slash 命令在 Slack 中显示为单个已配置命令或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack 应用中配置[额外清单设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 启用，或在全局配置中通过 `commands.native: true` 启用。

- Slack 的原生命令自动模式为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在分发选中的选项值之前显示确认 modal：

- 最多 5 个选项：button blocks
- 6-100 个选项：static select menu
- 超过 100 个选项：当 interactivity options handlers 可用时，使用带异步选项过滤的 external select
- 超出 Slack 限制：编码后的选项值回退为按钮

```txt
/think
```

Slash 会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，并且仍使用 `CommandTargetSessionKey` 将命令执行路由到目标 conversation 会话。

## 交互式回复

Slack 可以渲染智能体创作的交互式回复控件，但该功能默认禁用。

全局启用：

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

或仅为一个 Slack 账号启用：

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

启用后，智能体可以发出仅适用于 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有 Slack interaction 事件路径回传点击或选择。

注意：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令转换为自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明令牌，不是智能体编写的原始值。
- 如果生成的交互式块会超出 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的块载荷。

## Slack 中的执行批准

Slack 可以作为带有交互式按钮和交互的原生批准客户端，而不是回退到 Web UI 或终端。

- 执行批准使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已经落在 Slack 中且批准 ID 类型为 `plugin:` 时，插件批准仍可通过同一个 Slack 原生按钮界面解析。
- 批准者授权仍会强制执行：只有被识别为批准者的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享批准按钮界面。当你的 Slack 应用设置中启用 `interactivity` 时，批准提示会直接在对话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要批准 UX；只有在工具结果表明聊天批准不可用或手动批准是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`, `sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个批准者时，Slack 会自动启用原生执行批准。设置 `enabled: false` 可显式禁用 Slack 作为原生批准客户端。
设置 `enabled: true` 可在能解析出批准者时强制启用原生批准。

没有显式 Slack 执行批准配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆盖批准者、添加筛选器，或选择启用源聊天投递时，才需要显式 Slack 原生配置：

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

共享的 `approvals.exec` 转发是单独的。仅当执行批准提示还必须路由到其他聊天或显式带外目标时才使用它。共享的 `approvals.plugin` 转发也是单独的；当这些请求已经落在 Slack 中时，Slack 原生按钮仍可解析插件批准。

同一聊天中的 `/approve` 也适用于已支持命令的 Slack 渠道和私信。完整批准转发模型见[执行批准](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“同时发送到渠道”线程回复）会按普通用户消息处理。
- 添加/移除表情回应事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名，以及置顶添加/移除事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道主题/用途元数据会被视为不受信任的上下文，并可注入到路由上下文中。
- 适用时，线程起始消息和初始线程历史上下文填充会按配置的发送者允许列表过滤。
- 块操作和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的载荷字段：
  - 块操作：选中值、标签、选择器值，以及 `workflow_*` 元数据
  - 模态 `view_submission` 和 `view_closed` 事件，包含路由后的渠道元数据和表单输入

## 配置参考

主要参考：[配置参考 - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高价值 Slack 字段">

- 模式/身份验证：`mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- 私信访问：`dm.enabled`, `dmPolicy`, `allowFrom`（旧版：`dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急开关；除非需要，否则保持关闭）
- 渠道访问：`groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- 线程/历史记录：`replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- 投递：`textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- 运维/功能：`configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## 故障排除

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）— **键必须是渠道 ID**（`C12345678`），不能是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为渠道路由默认优先使用 ID。要查找 ID：在 Slack 中右键点击该渠道 → **复制链接** — URL 末尾的 `C...` 值就是渠道 ID。
    - `requireMention`
    - 每个渠道的 `users` 允许列表

    有用命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="私信消息被忽略">
    检查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或旧版 `channels.slack.dm.policy`）
    - 配对批准/允许列表条目
    - Slack Assistant 私信事件：提到 `drop message_changed` 的详细日志通常表示 Slack 发送了一个已编辑的 Assistant 线程事件，但消息元数据中没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    验证机器人 + 应用令牌，以及 Slack 应用设置中是否已启用 Socket Mode。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则 Slack 账号已配置，但当前运行时无法解析由 SecretRef 支持的值。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    验证：

    - 签名密钥
    - webhook 路径
    - Slack 请求 URL（事件 + 交互性 + 斜杠命令）
    - 每个 HTTP 账号使用唯一的 `webhookPath`

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，则 HTTP 账号已配置，但当前运行时无法解析由 SecretRef 支持的签名密钥。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    确认你的意图是：

    - 原生命令模式（`channels.slack.commands.native: true`），并且在 Slack 中注册了匹配的斜杠命令
    - 或单一斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    同时检查 `commands.useAccessGroups` 以及渠道/用户允许列表。

  </Accordion>
</AccordionGroup>

## 附件视觉参考

当 Slack 文件下载成功且大小限制允许时，Slack 可以将下载的媒体附加到智能体轮次。图像文件可以通过媒体理解路径传递，或直接传给支持视觉的回复模型；其他文件会作为可下载文件上下文保留，而不是被当作图像输入。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 备注                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 图像   | Slack 文件 URL       | 下载并附加到该轮次，以供支持视觉的处理使用                                      | 每文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                    |
| PDF 文件                       | Slack 文件 URL       | 下载并作为文件上下文暴露给 `download-file` 或 `pdf` 等工具                       | Slack 入站流程不会自动将 PDF 转换为图像视觉输入                         |
| 其他文件                       | Slack 文件 URL       | 可行时下载并作为文件上下文暴露                                                   | 二进制文件不会被当作图像输入                                              |
| 线程回复                       | 线程起始消息文件     | 当回复没有直接媒体时，根消息文件可作为上下文补全                                 | 只有文件的起始消息会使用附件占位符                                        |
| 多图像消息                     | 多个 Slack 文件      | 每个文件都会独立评估                                                             | Slack 处理限制为每条消息最多八个文件                                      |

### 入站流水线

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用机器人令牌（`xoxb-...`）从 Slack 的私有 URL 下载文件。
2. 下载成功后，文件会写入媒体存储。
3. 下载的媒体路径和内容类型会添加到入站上下文。
4. 支持图像的模型/工具路径可以使用该上下文中的图像附件。
5. 非图像文件仍可作为文件元数据或媒体引用供可以处理它们的工具使用。

### 线程根附件继承

当消息在线程中到达（具有 `thread_ts` 父项）时：

- 如果回复本身没有直接媒体，而包含的根消息有文件，Slack 可以将根文件补全为线程起始上下文。
- 直接回复附件优先于根消息附件。
- 只有文件且没有文本的根消息会以附件占位符表示，以便回退内容仍可包含其文件。

### 多附件处理

当单条 Slack 消息包含多个文件附件时：

- 每个附件都会通过媒体流水线独立处理。
- 下载的媒体引用会聚合到消息上下文中。
- 处理顺序遵循事件载荷中 Slack 的文件顺序。
- 某个附件下载失败不会阻塞其他附件。

### 大小、下载和模型限制

- **大小上限**：默认每文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **下载失败**：Slack 无法提供的文件、过期 URL、不可访问文件、超大文件，以及 Slack 身份验证/登录 HTML 响应会被跳过，而不会被报告为不受支持的格式。
- **视觉模型**：图像分析会在当前回复模型支持视觉时使用该模型，否则使用在 `agents.defaults.imageModel` 配置的图像模型。

### 已知限制

| 场景                               | 当前行为                                                             | 解决方法                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 已过期的 Slack 文件 URL                 | 文件被跳过；不显示错误                                                 | 在 Slack 中重新上传该文件                                                |
| 未配置视觉模型            | 图片附件会作为媒体引用存储，但不会作为图片分析 | 配置 `agents.defaults.imageModel`，或使用支持视觉的回复模型 |
| 超大图片（默认 > 20 MB） | 按大小上限跳过                                                         | 如果 Slack 允许，增加 `channels.slack.mediaMaxMb`                       |
| 转发/共享的附件           | 文本和 Slack 托管的图片/文件媒体会尽力处理                       | 直接在 OpenClaw 线程中重新共享                                   |
| PDF 附件                        | 作为文件/媒体上下文存储，不会自动路由到图片视觉处理  | 使用 `download-file` 获取文件元数据，或使用 `pdf` 工具进行 PDF 分析   |

### 相关文档

- [媒体理解流水线](/zh-CN/nodes/media-understanding)
- [PDF 工具](/zh-CN/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件视觉启用
- 回归测试: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- 实时验证: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## 相关内容

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    将 Slack 用户与 Gateway 网关配对。
  </Card>
  <Card title="Groups" icon="users" href="/zh-CN/channels/groups">
    渠道和群组私信行为。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="Security" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="Configuration" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

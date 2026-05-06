---
read_when:
    - 设置 Slack 或调试 Slack 套接字/HTTP 模式
summary: Slack 设置和运行时行为（Socket Mode + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-06T12:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

生产就绪，可通过 Slack 应用集成用于私信和渠道。默认模式是 Socket Mode；也支持 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
</CardGroup>

## 选择 Socket Mode 或 HTTP Request URLs

两种传输方式都已生产就绪，并且在消息、斜杠命令、App Home 和交互功能上达到功能一致。请根据部署形态而不是功能来选择。

| 关注点                      | Socket Mode（默认）                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 公共 Gateway 网关 URL           | 不需要                                                                         | 需要（DNS、TLS、反向代理或隧道）                                                                   |
| 出站网络             | 必须能够访问到 `wss-primary.slack.com` 的出站 WSS                            | 无出站 WS；仅入站 HTTPS                                                                             |
| 所需令牌                | Bot token（`xoxb-...`）+ App-Level Token（`xapp-...`），带 `connections:write`       | Bot token（`xoxb-...`）+ Signing Secret                                                                        |
| 开发笔记本 / 防火墙后 | 可直接工作                                                                          | 需要公共隧道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或预发布 Gateway 网关                          |
| 水平扩展           | 每个主机上每个应用一个 Socket Mode 会话；多个 Gateway 网关需要单独的 Slack 应用 | 无状态 POST 处理程序；多个 Gateway 网关副本可在负载均衡器后共享一个应用                     |
| 一个 Gateway 网关上的多账号 | 支持；每个账号打开自己的 WS                                             | 支持；每个账号需要唯一的 `webhookPath`（默认 `/slack/events`），这样注册不会冲突 |
| 斜杠命令传输      | 通过 WS 连接投递；`slash_commands[].url` 会被忽略                  | Slack 向 `slash_commands[].url` 发送 POST；该字段是命令分发所必需的                           |
| 请求签名              | 不使用（身份验证使用 App-Level Token）                                               | Slack 会签名每个请求；OpenClaw 使用 `signingSecret` 验证                                              |
| 连接断开恢复  | Slack SDK 自动重连；适用 Gateway 网关的 pong 超时传输调优       | 没有会断开的持久连接；重试由 Slack 按请求执行                                           |

<Note>
  **选择 Socket Mode**，适用于单 Gateway 网关主机、开发笔记本，以及可以出站访问 `*.slack.com` 但无法接收入站 HTTPS 的本地网络。

**选择 HTTP Request URLs**，适用于在负载均衡器后运行多个 Gateway 网关副本、出站 WSS 被阻止但允许入站 HTTPS，或你已经在反向代理处终止 Slack webhook 的情况。
</Note>

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
          **推荐**匹配内置 Slack 插件的完整功能集：App Home、斜杠命令、文件、表态、置顶、群组私信，以及 emoji/用户组读取。当工作区策略限制 scope 时，请选择**最小**，它覆盖私信、渠道/群组历史、提及和斜杠命令，但不包含文件、表态、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。请参阅[清单和 scope 检查清单](#manifest-and-scope-checklist)，了解每个 scope 的理由以及额外斜杠命令等可增补选项。
        </Note>

        Slack 创建应用后：

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**：添加 `connections:write`，保存，并复制 `xapp-...` 值。
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

        环境变量回退（仅默认账号）：

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

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择你的工作区 → 粘贴下方任一清单 → 将 `https://gateway-host.example.com/slack/events` 替换为你的公共 Gateway 网关 URL → **Next** → **Create**。

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

```json 最小配置
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
          **推荐**匹配内置 Slack 插件的完整功能集；**最小配置**会去掉文件、reaction、pin、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`，适用于限制严格的工作区。请参阅[清单和 scope 检查清单](#manifest-and-scope-checklist)，了解每个 scope 的理由。
        </Note>

        <Info>
          这三个 URL 字段（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）都指向同一个 OpenClaw 端点。Slack 的清单 schema 要求它们分别命名，但 OpenClaw 会按 payload 类型路由，因此单个 `webhookPath`（默认 `/slack/events`）就足够了。在 HTTP 模式下，没有 `slash_commands[].url` 的 slash commands 会静默无操作。
        </Info>

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
        为多账号 HTTP 使用唯一的 webhook 路径

        为每个账号提供不同的 `webhookPath`（默认 `/slack/events`），这样注册就不会冲突。
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

在 Socket Mode 下，OpenClaw 默认将 Slack SDK 客户端 pong 超时设置为 15 秒。只有在需要针对工作区或主机进行特定调优时，才覆盖传输设置：

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

仅在记录 Slack websocket pong/server-ping 超时，或运行在已知存在 event-loop starvation 的主机上的 Socket Mode 工作区使用此设置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍然是应用状态，而不是传输活跃度信号。

## 清单和 scope 检查清单

基础 Slack 应用清单对于 Socket Mode 和 HTTP Request URLs 是相同的。只有 `settings` 块（以及 slash command 的 `url`）不同。

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

对于 **HTTP Request URLs 模式**，将 `settings` 替换为 HTTP 变体，并为每个 slash command 添加 `url`。需要公开 URL：

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

公开扩展上述默认值的不同功能。

默认清单会启用 Slack App Home 的 **Home** 标签页，并订阅 `app_home_opened`。当工作区成员打开 Home 标签页时，OpenClaw 会使用 `views.publish` 发布安全的默认 Home 视图；不会包含 conversation payload 或私有配置。**Messages** 标签页会继续为 Slack 私信启用。

<AccordionGroup>
  <Accordion title="可选原生 slash commands">

    可以使用多个[原生 slash commands](#commands-and-slash-behavior) 来替代单个已配置命令，但需要注意细节：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令是保留的。
    - 一次最多只能提供 25 个 slash commands。

    将现有 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)的子集：

    <Tabs>
      <Tab title="Socket Mode（默认）">

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
        使用与上方 Socket Mode 相同的 `slash_commands` 列表，并向每个条目添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

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

        对列表中的每个命令重复该 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="可选作者身份范围（写入操作）">
    如果你希望传出消息使用活跃智能体身份（自定义用户名和图标），而不是默认 Slack 应用身份，请添加 `chat:write.customize` bot 范围。

    如果你使用表情图标，Slack 需要 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户令牌范围（读取操作）">
    如果你配置了 `channels.slack.userToken`，典型读取范围包括：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
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
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账号。
- `userToken`（`xoxp-...`）仅能在配置中设置（无环境变量回退），并且默认采用只读行为（`userTokenReadOnly: true`）。

Status 快照行为：

- Slack 账号检查会跟踪每个凭据的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- Status 为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账号已通过 SecretRef 或其他非内联密钥来源配置，但当前命令/运行时路径无法解析实际值。
- 在 HTTP 模式下会包含 `signingSecretStatus`；在 Socket Mode 中，必需组合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍优先使用 bot 令牌；只有当 `userTokenReadOnly: false` 且 bot 令牌不可用时，才允许用户令牌写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组      | 默认值 |
| ---------- | ------- |
| messages   | 启用 |
| reactions  | 启用 |
| pins       | 启用 |
| memberInfo | 启用 |
| emojiList  | 启用 |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并为图片返回图片预览，或为其他文件类型返回本地文件元数据。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.slack.dmPolicy` 控制私信访问。`channels.slack.allowFrom` 是规范私信允许列表。

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认为 false）
    - `dm.groupChannels`（可选 MPIM 允许列表）

    多账号优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账号。
    - 命名账号在未设置自己的 `allowFrom` 时，会继承 `channels.slack.allowFrom`。
    - 命名账号不会继承 `channels.slack.accounts.default.allowFrom`。

    旧版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍会被读取以保持兼容。`openclaw doctor --fix` 会在不改变访问权限的情况下，将它们迁移到 `dmPolicy` 和 `allowFrom`。

    私信配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，并且配置键**必须使用稳定的 Slack 渠道 ID**（例如 `C12345678`）。

    运行时注意事项：如果完全缺少 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 当令牌访问允许时，渠道允许列表条目和私信允许列表条目会在启动时解析
    - 未解析的渠道名称条目会按配置保留，但默认在路由时被忽略
    - 入站授权和渠道路由默认优先使用 ID；直接用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    基于名称的键（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不会**匹配。渠道查找默认优先使用 ID，因此基于名称的键永远无法成功路由，该渠道中的所有消息都会被静默阻止。这不同于 `groupPolicy: "open"`，后者不需要渠道键即可路由，基于名称的键看起来也能工作。

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

  <Tab title="提及和渠道用户">
    渠道消息默认由提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 当 bot 用户是该用户组成员时的 Slack 用户组提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复 bot 线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每渠道控制项（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching` 支持）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍仅映射到 `id:`）

    `allowBots` 对渠道和私有渠道采用保守策略：只有当发送 bot 被显式列入该房间的 `users` 允许列表，或 `channels.slack.allowFrom` 中至少有一个显式 Slack 所有者 ID 当前是房间成员时，才接受 bot 编写的房间消息。通配符和显示名称所有者条目不满足所有者在场要求。所有者在场使用 Slack `conversations.members`；请确保应用拥有与房间类型匹配的读取范围（公共渠道为 `channels:read`，私有渠道为 `groups:read`）。如果成员查找失败，OpenClaw 会丢弃 bot 编写的房间消息。

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- Slack 路由绑定接受原始对端 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目标形式。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复在适用时可以创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认值为 `thread`；`thread.inheritParent` 默认值为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当为 `true` 时，会抑制隐式线程提及，因此即使 bot 已参与该线程，bot 也只会响应线程内显式的 `@bot` 提及。没有此设置时，bot 已参与线程中的回复会绕过 `requireMention` 门控。

回复线程控制项：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 直接聊天的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 会禁用 Slack 中的**所有**回复线程，包括显式 `[[reply_to_*]]` 标签。这不同于 Telegram，在 Telegram 中，显式标签在 `"off"` 模式下仍会生效。Slack 线程会将消息从渠道中隐藏，而 Telegram 回复会以内联方式保持可见。
</Note>

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息时发送确认表情。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情回退（`agents.list[].identity.emoji`，否则为 "👀"）

注意事项：

- Slack 需要短代码（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账号或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活跃状态时，将工具/进度更新路由到同一条已编辑预览消息中（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设为 `status` 可在隐藏原始命令/执行文本的同时保留紧凑工具进度行（默认：`raw`）。

隐藏原始命令/执行文本，同时保留紧凑进度行：

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

- 要显示原生文本流式传输和 Slack assistant 线程状态，必须有可用的回复线程。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用或不存在回复线程时，渠道、群组聊天和顶层私信根仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持非线程，因此不会显示 Slack 线程样式的原生流/状态预览；OpenClaw 会改为在私信中发布并编辑草稿预览。
- 媒体和非文本载荷会回退到普通投递。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/块最终消息仅在可以就地编辑预览时刷新。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余载荷回退到普通投递。

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

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的旧版运行时别名。
- 布尔值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的旧版运行时别名。
- 旧版 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.nativeTransport` 的运行时别名。
- 运行 `openclaw doctor --fix`，将持久化的 Slack 流式传输配置重写为规范键名。

## 输入中反应回退

`typingReaction` 会在 OpenClaw 处理回复时，为传入的 Slack 消息添加一个临时反应，并在运行结束后移除它。这在非线程回复场景中最有用；线程回复会使用默认的 “is typing...” 状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事项：

- Slack 期望使用短代码（例如 `"hourglass_flowing_sand"`）。
- 反应是尽力而为的，并且会在回复或失败路径完成后自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="传入附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在获取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，因此智能体可以使用 `download-file` 获取原始文件。

    下载使用有界空闲超时和总超时。如果 Slack 文件检索卡住或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时传入大小上限默认为 `20MB`，除非被 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="传出文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 配置后，传出媒体上限遵循 `channels.slack.mediaMaxMb`；否则，渠道发送会使用媒体管线中的 MIME 类型默认值

  </Accordion>

  <Accordion title="投递目标">
    推荐的显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于渠道

    纯文本/分块的 Slack 私信可以直接发布到用户 ID；文件上传和线程发送会先通过 Slack 会话 API 打开私信，因为这些路径需要具体的会话 ID。

  </Accordion>
</AccordionGroup>

## 命令和斜杠行为

斜杠命令在 Slack 中显示为单个已配置命令或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack 应用中配置[额外清单设置](#additional-manifest-settings)，并改为通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- Slack 的原生命令自动模式为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在派发所选选项值之前显示确认模态框：

- 最多 5 个选项：按钮区块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：当交互选项处理器可用时，使用带异步选项过滤的外部选择
- 超出 Slack 限制：编码后的选项值回退为按钮

```txt
/think
```

斜杠会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，并且仍会使用 `CommandTargetSessionKey` 将命令执行路由到目标会话会话。

## 交互式回复

Slack 可以渲染智能体编写的交互式回复控件，但此功能默认禁用。

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

这些指令会编译为 Slack Block Kit，并通过现有 Slack 交互事件路径路由点击或选择。

注意事项：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令翻译成自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明令牌，而不是智能体编写的原始值。
- 如果生成的交互式区块会超过 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的区块载荷。

## Slack 中的 Exec 审批

Slack 可以作为带交互式按钮和交互的原生审批客户端，而不是回退到 Web UI 或终端。

- Exec 审批使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已进入 Slack 且审批 ID 类型为 `plugin:` 时，插件审批仍可通过相同的 Slack 原生按钮界面解析。
- 审批人授权仍会强制执行：只有被识别为审批人的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享审批按钮界面。当你的 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要审批 UX；只有当工具结果表示聊天审批不可用，或手动审批是唯一路径时，OpenClaw 才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可能时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少解析出一个审批人时，Slack 会自动启用原生 Exec 审批。设置 `enabled: false` 可显式禁用 Slack 作为原生审批客户端。
设置 `enabled: true` 可在审批人解析成功时强制启用原生审批。

没有显式 Slack Exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有当你想覆盖审批人、添加过滤器或选择加入源聊天投递时，才需要显式 Slack 原生配置：

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

共享 `approvals.exec` 转发是独立的。仅当 Exec 审批提示也必须路由到其他聊天或显式带外目标时使用它。共享 `approvals.plugin` 转发也是独立的；当这些请求已进入 Slack 时，Slack 原生按钮仍可解析插件审批。

同一聊天中的 `/approve` 也适用于已支持命令的 Slack 渠道和私信。请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)，了解完整审批转发模型。

## 事件和运维行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“Also send to channel” 线程回复）会作为普通用户消息处理。
- 反应添加/移除事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名，以及固定添加/移除事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道主题/用途元数据会被视为不受信任的上下文，并可注入到路由上下文中。
- 线程发起者和初始线程历史上下文播种会在适用时按已配置的发送者允许列表过滤。
- 区块操作和模态框交互会发出结构化的 `Slack interaction: ...` 系统事件，并包含丰富的载荷字段：
  - 区块操作：选中的值、标签、选择器值和 `workflow_*` 元数据
  - 模态框 `view_submission` 和 `view_closed` 事件，包含已路由的渠道元数据和表单输入

## 配置参考

主要参考：[配置参考 - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（破窗选项；除非需要，否则保持关闭）
- 渠道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排除

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）— **键必须是渠道 ID**（`C12345678`），而不是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为渠道路由默认优先使用 ID。查找 ID：在 Slack 中右键点击渠道 → **Copy link** — URL 末尾的 `C...` 值就是渠道 ID。
    - `requireMention`
    - 每渠道 `users` 允许列表

    有用的命令：

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
    - 配对审批 / 允许列表条目
    - Slack Assistant 私信事件：提到 `drop message_changed` 的详细日志通常表示 Slack 发送了一个已编辑的 Assistant 线程事件，但消息元数据中没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    在 Slack 应用设置中验证机器人 + 应用令牌和 Socket Mode 启用状态。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则表示 Slack 账号已配置，但当前运行时无法解析由 SecretRef 支持的值。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    验证：

    - 签名密钥
    - webhook 路径
    - Slack Request URL（事件 + 交互 + 斜杠命令）
    - 每个 HTTP 账号唯一的 `webhookPath`

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，则表示 HTTP 账号已配置，但当前运行时无法解析由 SecretRef 支持的签名密钥。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    确认你期望的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并且在 Slack 中注册了匹配的斜杠命令
    - 或单斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    另请检查 `commands.useAccessGroups` 和渠道/用户允许列表。

  </Accordion>
</AccordionGroup>

## 附件视觉参考

Slack 可以在 Slack 文件下载成功且大小限制允许时，将下载的媒体附加到智能体轮次中。图像文件可以通过媒体理解路径传递，或直接传递给支持视觉的回复模型；其他文件会作为可下载的文件上下文保留，而不会被视为图像输入。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 备注                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 图像 | Slack 文件 URL       | 下载并附加到轮次中，以便支持视觉的处理                                           | 单文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                    |
| PDF 文件                       | Slack 文件 URL       | 下载并作为文件上下文暴露给 `download-file` 或 `pdf` 等工具                       | Slack 入站不会自动将 PDF 转换为图像视觉输入                              |
| 其他文件                       | Slack 文件 URL       | 在可能时下载并作为文件上下文暴露                                                 | 二进制文件不会被视为图像输入                                             |
| 线程回复                       | 线程起始消息文件     | 当回复没有直接媒体时，可以将根消息文件水合为上下文                               | 仅含文件的起始消息会使用附件占位符                                       |
| 多图像消息                     | 多个 Slack 文件      | 每个文件都会被独立评估                                                           | Slack 处理限制为每条消息最多八个文件                                     |

### 入站流水线

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用机器人令牌（`xoxb-...`）从 Slack 的私有 URL 下载文件。
2. 下载成功后，文件会写入媒体存储。
3. 下载的媒体路径和内容类型会添加到入站上下文。
4. 支持图像的模型/工具路径可以使用该上下文中的图像附件。
5. 非图像文件仍可作为文件元数据或媒体引用提供给能够处理它们的工具。

### 线程根附件继承

当消息到达某个线程中（具有 `thread_ts` 父级）时：

- 如果回复本身没有直接媒体，而包含的根消息有文件，Slack 可以将根文件水合为线程起始上下文。
- 直接回复附件优先于根消息附件。
- 只有文件且没有文本的根消息会用附件占位符表示，以便回退逻辑仍可包含其文件。

### 多附件处理

当单条 Slack 消息包含多个文件附件时：

- 每个附件都会通过媒体流水线独立处理。
- 下载的媒体引用会聚合到消息上下文中。
- 处理顺序遵循事件载荷中的 Slack 文件顺序。
- 某个附件下载失败不会阻止其他附件。

### 大小、下载和模型限制

- **大小上限**：默认每个文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **下载失败**：Slack 无法提供的文件、过期 URL、无法访问的文件、超大文件以及 Slack 认证/登录 HTML 响应都会被跳过，而不是报告为不支持的格式。
- **视觉模型**：图像分析会在当前回复模型支持视觉时使用它，否则使用 `agents.defaults.imageModel` 配置的图像模型。

### 已知限制

| 场景                                   | 当前行为                                                                     | 解决方法                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 过期的 Slack 文件 URL                  | 文件被跳过；不会显示错误                                                     | 在 Slack 中重新上传文件                                                    |
| 未配置视觉模型                         | 图像附件会存储为媒体引用，但不会作为图像进行分析                             | 配置 `agents.defaults.imageModel` 或使用支持视觉的回复模型                 |
| 非常大的图像（默认 > 20 MB）           | 按大小上限跳过                                                               | 如果 Slack 允许，可提高 `channels.slack.mediaMaxMb`                        |
| 转发/共享的附件                        | 文本和 Slack 托管的图像/文件媒体按尽力而为处理                               | 直接在 OpenClaw 线程中重新共享                                             |
| PDF 附件                               | 存储为文件/媒体上下文，不会自动路由到图像视觉路径                            | 使用 `download-file` 获取文件元数据，或使用 `pdf` 工具进行 PDF 分析        |

### 相关文档

- [媒体理解流水线](/zh-CN/nodes/media-understanding)
- [PDF 工具](/zh-CN/tools/pdf)
- 史诗：[#51349](https://github.com/openclaw/openclaw/issues/51349) — Slack 附件视觉启用
- 回归测试：[#51353](https://github.com/openclaw/openclaw/issues/51353)
- 实时验证：[#51354](https://github.com/openclaw/openclaw/issues/51354)

## 相关

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
    威胁模型与加固。
  </Card>
  <Card title="Configuration" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

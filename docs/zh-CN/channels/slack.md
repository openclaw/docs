---
read_when:
    - 设置 Slack，或调试 Slack 套接字、HTTP 或中继模式
summary: Slack 设置和运行时行为（Socket Mode、HTTP 请求 URL 和中继模式）
title: Slack
x-i18n:
    generated_at: "2026-07-06T10:46:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9838508da293847f71895b8f7f59c5f9b1bc5cac65ac5b9a04146934710a3
    source_path: channels/slack.md
    workflow: 16
---

Slack 支持通过 Slack 应用集成覆盖私信和频道。默认传输方式是 Socket Mode；也支持 HTTP Request URLs。Relay 模式用于由受信任路由器负责 Slack 入口的托管部署。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="频道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复手册。
  </Card>
</CardGroup>

## 选择传输方式

Socket Mode 和 HTTP Request URLs 在消息、斜杠命令、App Home 和交互功能上达到功能一致。按部署形态选择，而不是按功能选择。

| 关注点                      | Socket Mode（默认）                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公共 Gateway 网关 URL           | 不需要                                                                                                                                         | 需要（DNS、TLS、反向代理或隧道）                                                                   |
| 出站网络             | 必须能访问到 `wss-primary.slack.com` 的出站 WSS                                                                                            | 无出站 WS；仅入站 HTTPS                                                                             |
| 需要的令牌                | Bot 令牌 + 带 `connections:write` 的 App-Level Token                                                                                                 | Bot 令牌 + Signing Secret                                                                                     |
| 开发笔记本 / 防火墙后方 | 可直接工作                                                                                                                                          | 需要公共隧道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或预发布 Gateway 网关                          |
| 水平扩展           | 每个主机上的每个应用一个 Socket Mode 会话；多个 Gateway 网关需要单独的 Slack 应用                                                                 | 无状态 POST 处理器；多个 Gateway 网关副本可在负载均衡器后共享一个应用                     |
| 单个 Gateway 网关上的多账号 | 支持；每个账号打开自己的 WS                                                                                                             | 支持；每个账号需要唯一的 `webhookPath`（默认 `/slack/events`），避免注册冲突 |
| 斜杠命令传输      | 通过 WS 连接递送；`slash_commands[].url` 会被忽略                                                                                  | Slack POST 到 `slash_commands[].url`；该字段是分发命令所必需的                           |
| 请求签名              | 不使用（认证是 App-Level Token）                                                                                                               | Slack 为每个请求签名；OpenClaw 使用 `signingSecret` 验证                                              |
| 连接断开恢复  | Slack SDK 已启用自动重连；OpenClaw 也会使用有界退避重启失败的 Socket Mode 会话。适用 Pong 超时传输调优。 | 没有会断开的持久连接；重试由 Slack 按请求执行                                           |

<Note>
  **选择 Socket Mode**：适用于单 Gateway 网关主机、开发笔记本，以及可出站访问 `*.slack.com` 但无法接受入站 HTTPS 的本地网络。

**选择 HTTP Request URLs**：适用于在负载均衡器后运行多个 Gateway 网关副本、出站 WSS 被阻止但入站 HTTPS 被允许，或你已经在反向代理处终止 Slack webhook 的情况。
</Note>

<Warning>
  Slack 可以为一个应用维护多个 Socket Mode 连接，并可能将每个载荷递送到任意连接。因此，共享同一个 Slack 应用的独立 OpenClaw Gateway 网关需要等效的路由和授权配置。否则，请为每个 Gateway 网关使用单独的 Slack 应用、单一 relay 入口，或负载均衡器后的 HTTP Request URLs。参见 [Using Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)。
</Warning>

### Relay 模式

Relay 模式将 Slack 入口与 OpenClaw Gateway 网关分离。受信任路由器负责单个 Slack Socket Mode 连接，选择目标 Gateway 网关，并通过经过认证的 websocket 转发类型化事件。Gateway 网关仍使用自己的 bot 令牌进行出站 Slack Web API 调用。

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

relay URL 必须使用 `wss://`，除非目标是 localhost。将 bearer 令牌和路由器路由表视为 Slack 授权边界的一部分：被路由的事件会作为已授权激活进入普通 Slack 消息处理器。websocket `hello` 帧中由路由器提供的 `slack_identity` 可以设置默认出站用户名和图标；调用方显式提供的身份仍然优先。relay 连接使用与 Socket Mode 相同的有界退避时序重新连接，并在断开连接时清除由路由器提供的身份。

## 安装

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 会注册并启用插件。在你配置下面的 Slack 应用和频道设置之前，它不会执行任何操作。通用插件安装规则见 [插件](/zh-CN/tools/plugin)。

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择你的工作区 → 粘贴下方任一 manifest → **Next** → **Create**。

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** 匹配 Slack 插件的完整功能集：App Home、斜杠命令、文件、表情回应、置顶、群组私信，以及 emoji/usergroup 读取。当工作区策略限制权限范围时，选择 **Minimal**。它覆盖私信、频道/群组历史、提及和斜杠命令，但去除了文件、表情回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。参见 [Manifest 和权限范围清单](#manifest-and-scope-checklist)，了解每个权限范围的理由和额外斜杠命令等增量选项。
        </Note>

        Slack 创建应用后：

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**：添加 `connections:write`，保存并复制 App-Level Token。
        - **Install App -> Install to Workspace**：复制 Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

        推荐的 SecretRef 设置：

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **创建新应用** → **从清单创建** → 选择你的工作区 → 粘贴下面的一个清单 → 将 `https://gateway-host.example.com/slack/events` 替换为你的公开 Gateway 网关 URL → **下一步** → **创建**。

        <CodeGroup>

```json 推荐
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

```json 最小
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **推荐**匹配 Slack 插件的完整功能集；**最小**会移除文件、表情回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`，适用于限制较严格的工作区。每个权限范围的理由请参见[清单和权限范围检查清单](#manifest-and-scope-checklist)。
        </Note>

        <Info>
          三个 URL 字段（`slash_commands[].url`、`event_subscriptions.request_url` 和 `interactivity.request_url` / `message_menu_options_url`）都指向同一个 OpenClaw 端点。Slack 的清单 schema 要求它们分别命名，但 OpenClaw 会按 payload 类型路由，因此单个 `webhookPath`（默认 `/slack/events`）就足够了。HTTP 模式下，没有 `slash_commands[].url` 的斜杠命令会静默无操作。
        </Info>

        Slack 创建应用后：

        - **基本信息 → 应用凭据**：复制用于请求验证的 **Signing Secret**。
        - **安装应用 -> 安装到工作区**：复制 Bot User OAuth Token。

      </Step>

      <Step title="Configure OpenClaw">

        推荐的 SecretRef 设置：

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        为每个账户提供不同的 `webhookPath`（默认 `/slack/events`），避免注册互相冲突。
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Socket Mode 传输调优

OpenClaw 默认将 Socket Mode 的 Slack SDK 客户端 pong 超时设置为 15 秒。只有在需要针对工作区或主机进行特定调优时，才覆盖传输设置：

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

仅当 Socket Mode 工作区记录 Slack websocket pong/server-ping 超时，或运行在已知存在事件循环饥饿的主机上时，才使用此设置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍然是应用状态，而不是传输活性信号。

说明：

- `socketMode` 在 HTTP Request URL 模式下会被忽略。
- 基础 `channels.slack.socketMode` 设置适用于所有 Slack 账户，除非被覆盖。按账户覆盖使用 `channels.slack.accounts.<accountId>.socketMode`；由于这是对象覆盖，请包含该账户所需的每个 socket 调优字段。
- 只有 `clientPingTimeout` 有 OpenClaw 默认值（`15000`）。`serverPingTimeout` 和 `pingPongLoggingEnabled` 只有在配置后才会传递给 Slack SDK。
- Socket Mode 重启退避从约 2 秒开始，并在约 30 秒封顶。可恢复的启动、启动等待和断开连接失败会持续重试，直到渠道停止。永久性的账户和凭据错误（例如无效 auth、已撤销 token 或缺少 scopes）会快速失败，而不是永久重试。

## 清单和权限范围检查清单

基础 Slack 应用清单在 Socket Mode 和 HTTP Request URLs 中相同。只有 `settings` 块（以及斜杠命令 `url`）不同。

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

呈现扩展上述默认值的不同功能。

默认清单会启用 Slack App Home 的 **Home** 标签页，并订阅 `app_home_opened`。当工作区成员打开 Home 标签页时，OpenClaw 会通过 `views.publish` 发布一个安全的默认 Home 视图；其中不包含会话负载或私有配置。**Messages** 标签页仍会为 Slack 私信启用。该清单还会通过 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 和 `assistant_thread_context_changed` 启用 Slack assistant 线程；assistant 线程会路由到其自己的 OpenClaw 线程会话，并让 Slack 提供的线程上下文可供智能体使用。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)，以细分方式替代单个已配置命令：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令是保留命令。
    - 一个 Slack 应用一次最多只能注册 25 个斜杠命令（Slack 平台限制）。

    将你现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)的子集：

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
        使用与上方 Socket Mode 相同的 `slash_commands` 列表，并为每一项添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

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

        对列表中的每个命令重复使用该 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    如果你希望出站消息使用活动智能体身份（自定义用户名和图标），而不是默认 Slack 应用身份，请添加 `chat:write.customize` 机器人权限范围。

    如果你使用 emoji 图标，Slack 期望使用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    如果你配置了 `channels.slack.userToken`，典型读取权限范围为：

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
- Relay 模式需要 `botToken` 以及 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用应用令牌或签名密钥。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- 配置令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN` 和 `SLACK_USER_TOKEN` 环境变量回退各自仅适用于默认账号。
- `userToken` 默认采用只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账号检查会跟踪每项凭证的 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账号已通过 SecretRef
  或其他非内联密钥来源配置，但当前命令/运行时路径
  无法解析实际值。
- 在 HTTP 模式中，会包含 `signingSecretStatus`；在 Socket Mode 中，
  必需组合为 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍优先使用机器人令牌；只有当 `userTokenReadOnly: false` 且机器人令牌不可用时，才允许用户令牌写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组         | 默认值 |
| ---------- | ------ |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并为图片返回图片预览，为其他文件类型返回本地文件元数据。

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

    多账号优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账号。
    - 命名账号在自身 `allowFrom` 未设置时继承 `channels.slack.allowFrom`。
    - 命名账号不会继承 `channels.slack.accounts.default.allowFrom`。

    旧版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍会为了兼容而读取。`openclaw doctor --fix` 会在不改变访问权限的情况下，将它们迁移到 `dmPolicy` 和 `allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` 控制频道处理：

    - `open`
    - `allowlist`
    - `disabled`

    频道允许列表位于 `channels.slack.channels` 下，并且**必须使用稳定的 Slack 频道 ID**（例如 `C12345678`）作为配置键。

    运行时说明：如果完全缺少 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 当令牌访问允许时，频道允许列表条目和私信允许列表条目会在启动时解析
    - 未解析的频道名称条目会按配置保留，但默认会被路由忽略
    - 入站授权和渠道路由默认优先使用 ID；直接用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    基于名称的键（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不会**匹配。频道查找默认优先使用 ID，因此基于名称的键永远无法成功路由，该频道中的所有消息都会被静默阻止。这与 `groupPolicy: "open"` 不同，后者不需要频道键即可路由，并且基于名称的键看起来会生效。

    始终使用 Slack 频道 ID 作为键。查找方法：在 Slack 中右键点击频道 → **Copy link** — ID（`C...`）会出现在 URL 末尾。

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
    默认情况下，频道消息会受提及门控限制。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 当机器人用户是该用户组成员时的 Slack 用户组提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    按频道控制项（`channels.slack.channels.<id>`；名称只能通过启动解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`；覆盖此频道的账号/聊天类型回复模式）
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 键格式：`channel:`、`id:`、`e164:`、`username:`、`name:`，或 `"*"` 通配符
      （旧版无前缀键仍仅映射到 `id:`）

    `ignoreOtherMentions`（默认 `false`）会丢弃提及了其他用户或用户组但没有提及此机器人的频道消息。私信和群组私信（MPIM）不受影响。该过滤器需要来自 `auth.test` 的已解析机器人用户 ID；如果该身份不可用（例如仅用户令牌身份），门控会失败开放，消息将原样通过。

    对于频道和私有频道，`allowBots` 采取保守策略：只有当发送机器人被明确列入该房间的 `users` 允许列表，或者 `channels.slack.allowFrom` 中至少一个显式 Slack 所有者 ID 当前是房间成员时，才接受机器人发送的房间消息。通配符和显示名称所有者条目不满足所有者存在条件。所有者存在性使用 Slack `conversations.members`；请确保应用具备对应房间类型的匹配读取权限范围（公共频道为 `channels:read`，私有频道为 `groups:read`）。如果成员查询失败，OpenClaw 会丢弃该机器人发送的房间消息。

    已接受的机器人发送 Slack 消息使用共享的[机器人循环保护](/zh-CN/channels/bot-loop-protection)。使用 `channels.defaults.botLoopProtection` 配置默认预算，然后在工作区或频道需要不同限制时，用 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆盖。

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；频道路由为 `channel`；MPIM 路由为 `group`。
- Slack 路由绑定接受原始对端 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目标形式。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 频道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 普通顶层频道消息会保留在按频道会话上，即使 `replyToMode` 不是 `off`。
- Slack 线程回复使用父 Slack `thread_ts` 作为会话后缀（`:thread:<threadTs>`），即使用 `replyToMode="off"` 禁用了出站回复线程也是如此。
- 当符合条件的顶层频道根消息预计会启动可见 Slack 线程时，OpenClaw 会将其种入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，让根消息和后续线程回复共享同一个 OpenClaw 会话。这适用于 `app_mention` 事件、显式机器人提及或配置的提及模式匹配，以及 `replyToMode` 不是 `off` 的 `requireMention: false` 频道。
- `channels.slack.thread.historyScope` 默认值为 `thread`；`thread.inheritParent` 默认值为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：为 `true` 时，会抑制隐式线程提及，因此机器人只会响应线程内显式的 `@bot` 提及，即使机器人已经参与了该线程。没有此设置时，机器人参与过的线程中的回复会绕过 `requireMention` 门控。

回复线程控制项：

- `channels.slack.channels.<id>.replyToMode`：Slack 频道/私有频道消息的按频道覆盖
- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel`
- 直接聊天的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

对于来自 `message` 工具的显式 Slack 线程回复，请在 `action: "send"` 且带有 `threadId` 或 `replyTo` 时设置 `replyBroadcast: true`，以请求 Slack 同时将线程回复广播到父频道。这会映射到 Slack 的 `chat.postMessage` `reply_broadcast` 标志，并且仅支持文本或 Block Kit 发送，不支持媒体上传。

当 `message` 工具调用在 Slack 线程内运行并以同一频道为目标时，OpenClaw 通常会按照生效的账号、聊天类型或按频道 `replyToMode` 继承当前 Slack 线程。自动回复以及同频道 `send` 或 `upload-file` 调用使用相同的按频道覆盖。在 `action: "send"` 或 `action: "upload-file"` 上设置 `topLevel: true`，可强制发送新的父频道消息。`threadId: null` 也会被接受为相同的顶层退出选项。

<Note>
`replyToMode="off"` 会禁用出站 Slack 回复线程，包括显式 `[[reply_to_*]]` 标签。它不会展平入站 Slack 线程会话：已发布在 Slack 线程内的消息仍会路由到 `:thread:<threadTs>` 会话。这不同于 Telegram，后者在 `"off"` 模式下仍会遵循显式标签。Slack 线程会把消息从频道中隐藏，而 Telegram 回复会以内联方式保持可见。
</Note>

## 确认回应

`ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。`ackReactionScope` 决定该 emoji 实际在何时发送。

默认情况下，当 Slack 原生助手线程状态通过轮换加载消息显示进度时，确认回应会保持静态。设置 `messages.statusReactions.enabled: true` 可改用 queued/thinking/tool/done/error 表情回应生命周期。

### Emoji（`ackReaction`）

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"eyes"` / 👀）

说明：

- Slack 需要短代码（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账号或全局禁用该表情回应。

### 范围（`messages.ackReactionScope`）

Slack provider 从 `messages.ackReactionScope` 读取范围（默认 `"group-mentions"`）。目前没有 Slack 账号级或 Slack 频道级覆盖；该值对 Gateway 网关全局生效。

取值：

- `"all"`：在私信和群组中回应，包括环境房间事件。
- `"direct"`：仅在私信中回应。
- `"group-all"`：对每条群组消息回应，但不包括环境房间事件（不包括私信）。
- `"group-mentions"`（默认）：在群组中回应，但仅当机器人被提及时（或在选择加入的群组可提及对象中）。**不包括私信。**
- `"off"` / `"none"`：永不回应。

<Note>
默认范围（`"group-mentions"`）不会在直接消息或环境房间事件中触发确认回应。若要在入站 Slack 私信和安静房间事件上看到配置的 `ackReaction`（例如 `"eyes"`），请将 `messages.ackReactionScope` 设置为 `"all"`。`messages.ackReactionScope` 在 Slack provider 启动时读取，因此需要重启 Gateway 网关才能使更改生效。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活动状态时，将工具/进度更新路由到同一条已编辑预览消息（默认：`true`）。设置为 `false` 可保留单独的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设置为 `status` 可隐藏原始命令/exec 文本，同时保留紧凑的工具进度行（默认：`raw`）。

隐藏原始命令/exec 文本，同时保留紧凑进度行：

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

Slack 原生进度任务卡片在进度模式下需要显式启用。将 `channels.slack.streaming.progress.nativeTaskCards` 设置为 `true`，并设置 `channels.slack.streaming.mode="progress"`，即可在工作运行时发送 Slack 原生计划/任务卡片，然后在完成时更新同一张任务卡片。没有此标志时，进度模式会保持可移植的草稿预览行为。

- 原生文本流式传输和 Slack 助手线程状态需要可用的回复线程才会显示。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用或不存在回复线程时，频道、群聊和顶层私信根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持非线程化，因此不会显示 Slack 线程样式的原生流/状态预览；OpenClaw 会改为在私信中发布并编辑草稿预览。
- 媒体和非文本载荷会回退到普通投递。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/块最终消息只有在可以就地编辑预览时才会刷新。
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

启用 Slack 原生进度任务卡片：

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

旧版键：

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的旧版运行时别名。
- 布尔值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的旧版运行时别名。
- 顶层 `channels.slack.chunkMode` 和 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.chunkMode` 和 `channels.slack.streaming.nativeTransport` 的旧版运行时别名。
- 运行 `openclaw doctor --fix` 可将持久化的 Slack 流式传输配置重写为规范键。

## 输入中表情回应回退

`typingReaction` 会在 OpenClaw 处理回复时，向入站 Slack 消息添加一个临时表情回应，并在运行结束时移除。它在线程回复之外最有用，因为线程回复会使用默认的“正在输入...”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 需要短代码（例如 `"hourglass_flowing_sand"`）。
- 该表情回应采用尽力而为方式，并会在回复或失败路径完成后自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（令牌认证请求流程），并在抓取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，以便智能体可以使用 `download-file` 获取原始文件。

    下载使用有界的空闲超时和总超时。如果 Slack 文件检索停滞或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时入站大小上限默认是 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本块使用 `channels.slack.textChunkLimit`（默认 `8000`，上限受 Slack 自身消息长度限制约束）
    - `channels.slack.streaming.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 配置后，出站媒体上限遵循 `channels.slack.mediaMaxMb`；否则渠道发送使用媒体流水线中的 MIME 类型默认值

  </Accordion>

  <Accordion title="投递目标">
    首选显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于频道

    仅文本/块的 Slack 私信可以直接发布到用户 ID；文件上传和线程发送会先通过 Slack conversation API 打开私信，因为这些路径需要具体的会话 ID。

  </Accordion>
</AccordionGroup>

## 命令和斜杠行为

斜杠命令在 Slack 中显示为单个配置命令或多个原生命令。配置 `channels.slack.slashCommand` 以更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack 应用中配置[额外的清单设置](#additional-manifest-settings)，并改为通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- Slack 的原生命令自动模式为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单按优先级顺序渲染为以下形式之一：

- 3-5 个足够短的选项：溢出（"..."）菜单
- 超过 100 个选项，且可使用异步选项过滤：外部选择
- 1-2 个选项，或任一编码值过长而无法用于选择控件的选项：按钮块
- 否则（6-100 个选项，或超过 100 个但没有异步过滤）：静态选择菜单，每个菜单按 100 个选项分块

```txt
/think
```

斜杠会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，并且仍使用 `CommandTargetSessionKey` 将命令执行路由到目标会话会话。

## 交互式回复

Slack 可以渲染智能体编写的交互式回复控件，但此功能默认禁用。
对于新的智能体、CLI 和插件输出，优先使用共享的
`presentation` 按钮或选择块。它们使用相同的 Slack 交互
路径，同时也能在其他渠道降级。

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

或仅为一个 Slack 账户启用：

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

启用后，智能体仍可以发出已弃用的仅 Slack 回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有的 Slack 交互事件路径
回传点击或选择。保留它们用于旧提示和 Slack 专用逃生出口；新的
可移植控件应使用共享呈现。

对于新的生产者代码，指令编译器 API 也已弃用：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新的 Slack 渲染控件应使用 `presentation` 载荷和 `buildSlackPresentationBlocks(...)`。

说明：

- 这是 Slack 专用的旧版 UI。其他渠道不会把 Slack Block
  Kit 指令转换为自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明令牌，不是智能体编写的原始值。
- 如果生成的交互式块会超出 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的 blocks 载荷。

### 插件拥有的模态提交

注册交互式处理程序的 Slack 插件也可以在 OpenClaw 将载荷压缩为
智能体可见的系统事件之前，接收模态
`view_submission` 和 `view_closed` 生命周期事件。打开 Slack 模态时使用以下路由
模式之一：

- 将 `callback_id` 设置为 `openclaw:<namespace>:<payload>`。
- 或保留现有的 `callback_id`，并在模态 `private_metadata` 中放入 `pluginInteractiveData:
"<namespace>:<payload>"`。

处理程序会接收 `ctx.interaction.kind`，其值为 `view_submission` 或
`view_closed`；还会接收归一化的 `inputs`，以及来自
Slack 的完整原始 `stateValues` 对象。仅基于 callback ID 的路由足以调用插件处理程序；当该
模态还应产生智能体可见的系统事件时，请包含现有模态 `private_metadata` 的用户/会话路由字段。智能体会接收一个
紧凑、已脱敏的 `Slack interaction: ...` 系统事件。如果处理程序返回
`systemEvent.summary`、`systemEvent.reference` 或 `systemEvent.data`，这些
字段会包含在该紧凑事件中，使智能体可以引用
插件拥有的存储，而无需看到完整表单载荷。

## Slack 中的原生审批

Slack 可以作为原生审批客户端，使用交互式按钮和交互，而不是回退到 Web UI 或终端。

- Exec 和插件审批可以渲染为 Slack 原生 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是原生 Exec 审批客户端启用项以及私信/频道路由配置。
- Exec 审批私信使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 当 Slack 已为发起会话启用为原生审批客户端，或 `approvals.plugin` 路由到发起的 Slack 会话或 Slack 目标时，插件审批会使用 Slack 原生按钮。
- 插件审批私信使用来自 `channels.slack.allowFrom`、命名账户 `allowFrom` 或账户默认路由的 Slack 插件审批人。
- 仍会强制执行审批人授权：仅 Exec 审批人不能批准插件请求，除非他们同时也是插件审批人。

这使用与其他渠道相同的共享审批按钮表面。在你的 Slack 应用设置中启用 `interactivity` 后，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们是主要审批 UX；OpenClaw
只有在工具结果表明聊天审批不可用或手动审批是唯一路径时，
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少解析到一个
Exec 审批人时，Slack 会自动启用原生 Exec 审批。当 Slack 插件审批人解析成功且请求匹配原生客户端过滤器时，Slack 也可以通过此原生客户端
路径处理原生插件审批。设置
`enabled: false` 可显式禁用 Slack 作为原生审批客户端。设置 `enabled: true` 可在审批人解析成功时
强制启用原生审批。禁用 Slack Exec 审批不会禁用
通过 `approvals.plugin` 启用的原生 Slack 插件审批投递；插件审批
投递改用 Slack 插件审批人。

没有显式 Slack Exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

仅当你想覆盖审批人、添加过滤器或
选择加入来源聊天投递时，才需要显式 Slack 原生配置：

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

共享 `approvals.exec` 转发是独立的。仅当 Exec 审批提示还必须
路由到其他聊天或显式带外目标时使用它。共享 `approvals.plugin` 转发也
是独立的；只有当 Slack 能够以原生方式处理插件
审批请求时，Slack 原生投递才会抑制该回退。

同聊天 `/approve` 也适用于已经支持命令的 Slack 频道和私信。完整的审批转发模型见 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 事件和运维行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“同时发送到频道”的线程回复）会按普通用户消息处理。
- 表情回应添加/移除事件会映射为系统事件。
- 成员加入/离开、频道创建/重命名，以及固定添加/移除事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移频道配置键。
- 频道主题/用途元数据会被视为不受信任的上下文，并可注入路由上下文。
- 线程发起者和初始线程历史上下文播种会在适用时按配置的发送者允许列表过滤。
- 块操作、快捷方式和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的载荷字段：
  - 块操作：选中值、标签、选择器值，以及 `workflow_*` 元数据
  - 全局快捷方式：回调和行为者元数据，路由到行为者的直接会话
  - 消息快捷方式：回调、行为者、频道、线程，以及已选消息上下文
  - 模态 `view_submission` 和 `view_closed` 事件，带有路由的频道元数据和表单输入

在你的 Slack 应用配置中定义全局或消息快捷方式，并使用任意非空回调 ID。OpenClaw 会确认匹配的快捷方式载荷，应用与其他 Slack 交互相同的私信/频道发送者策略，并将脱敏后的事件排队到路由的智能体会话。触发器 ID 和响应 URL 会从智能体上下文中脱敏。

## 配置参考

主要参考：[Configuration reference - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急开关；除非需要，否则保持关闭）
- 频道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展开预览：`unfurlLinks`（默认：`false`）、`unfurlMedia`，用于 `chat.postMessage` 链接/媒体预览控制；设置 `unfurlLinks: true` 可重新选择启用链接预览
- 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排查

<AccordionGroup>
  <Accordion title="频道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）— **键必须是渠道 ID**（`C12345678`），而不是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为渠道路由默认优先使用 ID。查找 ID：在 Slack 中右键点击渠道 → **复制链接** — URL 末尾的 `C...` 值就是渠道 ID。
    - `requireMention`
    - 每渠道 `users` 允许列表
    - `messages.groupChat.visibleReplies`：普通群组/渠道请求默认为 `"automatic"`。如果你选择了 `"message_tool"`，且日志显示 assistant 文本但没有 `message(action=send)` 调用，说明模型错过了可见消息工具路径。在此模式下，最终文本保持私密；请检查 gateway 详细日志中的已抑制负载元数据，或者如果你希望每条普通 assistant 最终回复都通过旧路径发布，请将其设置为 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果它是 `"room_event"`，未提及但已允许的渠道闲聊会作为环境上下文，并保持静默，除非智能体调用 `message` 工具。请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    常用命令：

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
    - 配对审批 / 允许列表条目（`dmPolicy: "open"` 仍然要求 `channels.slack.allowFrom: ["*"]`）
    - 群组私信使用 MPIM 处理；启用 `channels.slack.dm.groupEnabled`，并且如果已配置，请在 `channels.slack.dm.groupChannels` 中包含该 MPIM
    - Slack Assistant 私信事件：提到 `drop message_changed` 的详细日志通常意味着 Slack 发送了一个已编辑的 Assistant 线程事件，但消息元数据中没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    在 Slack 应用设置中验证 bot + app token 以及 Socket Mode 启用状态。
    App-Level Token 需要 `connections:write`，并且 Bot User OAuth Token
    bot token 必须与 app token 属于同一个 Slack 应用/工作区。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，说明 Slack 账号已配置，
    但当前运行时无法解析由 SecretRef 支持的值。

    类似 `slack socket mode failed to start; retry ...` 的日志是可恢复的
    启动失败。缺少 scope、token 被撤销以及无效认证会快速失败。
    `slack token mismatch ...` 日志表示 bot token 和 app token
    似乎属于不同的 Slack 应用；请修正 Slack 应用凭证。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账号使用唯一的 `webhookPath`
    - 公网 URL 终止 TLS，并将请求转发到 Gateway 网关路径
    - Slack 应用 `request_url` 路径与 `channels.slack.webhookPath` 完全匹配（默认 `/slack/events`）

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，
    说明 HTTP 账号已配置，但当前运行时无法解析由 SecretRef 支持的 signing secret。

    重复出现的 `slack: webhook path ... already registered` 日志意味着两个 HTTP
    账号正在使用同一个 `webhookPath`；请为每个账号指定不同路径。

  </Accordion>

  <Accordion title="原生命令/斜杠命令未触发">
    确认你的预期是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册了匹配的斜杠命令
    - 或单斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不会自动创建或移除斜杠命令。`commands.native: "auto"` 不会启用 Slack 原生命令；请使用 `true` 并在 Slack 应用中创建匹配命令。在 HTTP 模式下，每个 Slack 斜杠命令都必须包含 Gateway 网关 URL。在 Socket Mode 下，命令负载通过 websocket 到达，Slack 会忽略 `slash_commands[].url`。

    还要检查 `commands.useAccessGroups`、私信授权、渠道允许列表，
    以及每渠道 `users` 允许列表。Slack 会为被阻止的斜杠命令发送者返回临时错误，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件视觉参考

当 Slack 文件下载成功且大小限制允许时，Slack 可以将已下载媒体附加到智能体轮次。图像文件可以通过媒体理解路径传递，或直接传给支持视觉的回复模型；其他文件会作为可下载文件上下文保留，而不是被当作图像输入处理。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 说明                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 图像   | Slack 文件 URL       | 下载并附加到轮次，以便支持视觉的处理                                             | 单文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                    |
| PDF 文件                       | Slack 文件 URL       | 下载并作为文件上下文暴露给 `download-file` 或 `pdf` 等工具                       | Slack 入站不会自动将 PDF 转换为图像视觉输入                              |
| 其他文件                       | Slack 文件 URL       | 在可行时下载并作为文件上下文暴露                                                 | 二进制文件不会被当作图像输入处理                                         |
| 线程回复                       | 线程起始消息文件     | 当回复没有直接媒体时，可以将根消息文件作为上下文补水                             | 仅文件起始消息使用附件占位符                                             |
| 多图像消息                     | 多个 Slack 文件      | 每个文件都会独立评估                                                             | Slack 处理上限为每条消息八个文件                                         |

### 入站管线

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用 bot token 从 Slack 的私有 URL 下载文件。
2. 下载成功后，文件会写入媒体存储。
3. 已下载媒体路径和内容类型会添加到入站上下文。
4. 支持图像的模型/工具路径可以使用该上下文中的图像附件。
5. 非图像文件仍可作为文件元数据或媒体引用供能够处理它们的工具使用。

### 线程根附件继承

当消息在线程中到达（具有 `thread_ts` 父级）时：

- 如果回复本身没有直接媒体，而包含的根消息有文件，Slack 可以将根文件作为线程起始上下文补水。
- 只有在播种新的或重置后的线程会话时，才会为根文件补水。后续纯文本回复会复用现有会话上下文，不会将根文件作为新媒体重新附加。
- 直接回复附件优先于根消息附件。
- 只有文件且没有文本的根消息会以附件占位符表示，因此 fallback 仍能包含其文件。

### 多附件处理

当单条 Slack 消息包含多个文件附件时：

- 每个附件都会通过媒体管线独立处理。
- 已下载媒体引用会聚合到消息上下文中。
- 处理顺序遵循事件负载中的 Slack 文件顺序。
- 某个附件下载失败不会阻塞其他附件。

### 大小、下载和模型限制

- **大小上限**：默认每个文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **下载失败**：Slack 无法提供的文件、过期 URL、不可访问文件、超大文件以及 Slack 认证/登录 HTML 响应会被跳过，而不是报告为不支持的格式。
- **视觉模型**：图像分析会在 active reply model 支持视觉时使用它，或使用在 `agents.defaults.imageModel` 配置的图像模型。

### 已知限制

| 场景                                   | 当前行为                                                                    | 解决方法                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 过期的 Slack 文件 URL                  | 跳过文件；不显示错误                                                         | 在 Slack 中重新上传文件                                                    |
| 未配置视觉模型                         | 图像附件会存储为媒体引用，但不会作为图像分析                                 | 配置 `agents.defaults.imageModel` 或使用支持视觉的回复模型                 |
| 非常大的图像（默认 > 20 MB）           | 根据大小上限跳过                                                             | 如果 Slack 允许，请提高 `channels.slack.mediaMaxMb`                        |
| 转发/共享附件                          | 文本和 Slack 托管的图像/文件媒体按尽力处理                                   | 直接在 OpenClaw 线程中重新共享                                             |
| PDF 附件                               | 存储为文件/媒体上下文，不会自动通过图像视觉路由                              | 使用 `download-file` 获取文件元数据，或使用 `pdf` 工具进行 PDF 分析        |

### 相关文档

- [媒体理解管线](/zh-CN/nodes/media-understanding)
- [PDF 工具](/zh-CN/tools/pdf)

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Slack 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    渠道和群组私信行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

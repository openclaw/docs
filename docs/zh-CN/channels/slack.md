---
read_when:
    - 设置 Slack 或调试 Slack 套接字、HTTP 或中继模式
summary: Slack 设置和运行时行为（Socket Mode、HTTP Request URLs 和中继模式）
title: Slack
x-i18n:
    generated_at: "2026-07-16T11:26:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack 支持通过 Slack 应用集成处理私信和频道。默认传输方式为 Socket Mode；也支持 HTTP Request URLs。Relay 模式适用于由可信路由器负责 Slack 入口的托管部署。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复操作手册。
  </Card>
</CardGroup>

## 选择传输方式

Socket Mode 和 HTTP Request URLs 在消息传递、斜杠命令、App Home 和交互功能方面具有同等能力。应根据部署形态而非功能进行选择。

| 考量项                       | Socket Mode（默认）                                                                                                                                  | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公共 Gateway 网关 URL        | 不需要                                                                                                                                               | 必需（DNS、TLS、反向代理或隧道）                                                                               |
| 出站网络                     | 必须能够通过出站 WSS 访问 `wss-primary.slack.com`                                                                                                         | 无出站 WS；仅使用入站 HTTPS                                                                                    |
| 所需令牌                     | Bot token + 具有 `connections:write` 的 App-Level Token                                                                                               | Bot token + Signing Secret                                                                                     |
| 开发笔记本电脑 / 位于防火墙后 | 可直接使用                                                                                                                                           | 需要公共隧道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或预发布 Gateway 网关                                |
| 水平扩展                     | 每个应用在每台主机上只能有一个 Socket Mode 会话；多个 Gateway 网关需要使用不同的 Slack 应用                                                          | 无状态 POST 处理程序；多个 Gateway 网关副本可以在负载均衡器后共享一个应用                                      |
| 一个 Gateway 网关上的多账户  | 支持；每个账户建立自己的 WS                                                                                                                          | 支持；每个账户需要唯一的 `webhookPath`（默认值为 `/slack/events`），以免注册冲突                       |
| 斜杠命令传输                 | 通过 WS 连接传递；忽略 `slash_commands[].url`                                                                                                            | Slack 向 `slash_commands[].url` 发送 POST；该字段是分派命令所必需的                                               |
| 请求签名                     | 不使用（身份验证使用 App-Level Token）                                                                                                               | Slack 对每个请求签名；OpenClaw 使用 `signingSecret` 进行验证                                               |
| 连接中断后的恢复             | Slack SDK 已启用自动重连；OpenClaw 还会以有界退避方式重启失败的 Socket Mode 会话。适用 Pong 超时传输调优。                                           | 没有可能中断的持久连接；重试由 Slack 针对每个请求执行                                                         |

<Note>
  对于单 Gateway 网关主机、开发笔记本电脑，以及能够出站访问 `*.slack.com` 但无法接受入站 HTTPS 的本地部署网络，**请选择 Socket Mode**。

当在负载均衡器后运行多个 Gateway 网关副本、出站 WSS 被阻止但允许入站 HTTPS，或者已在反向代理处终止 Slack Webhook 时，**请选择 HTTP Request URLs**。
</Note>

<Warning>
  Slack 可以为一个应用维持多个 Socket Mode 连接，并可能将每个载荷传递给任意连接。因此，共享一个 Slack 应用的不同 OpenClaw Gateway 网关需要使用等效的路由和授权配置。否则，请为每个 Gateway 网关使用单独的 Slack 应用、使用单一 Relay 入口，或在负载均衡器后使用 HTTP Request URLs。请参阅[使用 Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)。
</Warning>

### Relay 模式

Relay 模式将 Slack 入口与 OpenClaw Gateway 网关分离。可信路由器负责单一 Slack Socket Mode 连接、选择目标 Gateway 网关，并通过经过身份验证的 websocket 转发类型化事件。Gateway 网关仍使用自己的 Bot token 发起出站 Slack Web API 调用。

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

除非目标是 localhost，否则 Relay URL 必须使用 `wss://`。应将 bearer token 和路由器路由表视为 Slack 授权边界的一部分：路由后的事件会以已授权激活的形式进入常规 Slack 消息处理程序。路由器在 websocket `hello` 帧中提供的 `slack_identity` 可以设置默认出站用户名和图标；调用方明确提供的身份仍然优先。Relay 连接使用与 Socket Mode 相同的有界退避时间重新连接，并在每次断开连接时清除路由器提供的身份。

### Enterprise Grid 组织范围安装

一个 Slack 账户可以接收 Enterprise Grid 组织范围安装所覆盖的每个工作区中的消息。请选择直接 Socket Mode 或 HTTP Request URLs；企业账户不支持 Relay 模式。以下两个最小权限清单仅启用 V1 `message` 和 `app_mention` 事件路径、即时回复，以及由监听器负责的状态表情回应。

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

让 Enterprise Grid Org Admin 或 Org Owner 批准该应用，在组织级别安装它，并选择此安装覆盖的工作区。启动 OpenClaw 前，请确认该应用在每个目标工作区中均可用。为 Socket Mode 生成具有 `connections:write` 的 App-Level Token，然后从组织安装中复制 Bot token。配置使用组织安装 Bot token 的账户：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

当 Gateway 网关具有公共 HTTPS 端点且不建立 Socket Mode 连接时，请使用 HTTP 模式。将示例 URL 替换为 Gateway 网关的公共 `webhookPath` URL（默认值为 `/slack/events`）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

让 Enterprise Grid Org Admin 或 Org Owner 批准该应用，在组织级别安装它，并选择此安装覆盖的工作区。Slack 验证 Request URL 后，复制组织安装的 Bot token 和应用的 **Basic Information -> App Credentials -> Signing Secret**。使用相同的 Request URL 路径配置企业账户：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

启动时，OpenClaw 使用 Slack `auth.test` 验证 `enterpriseOrgInstall`。没有该标志的组织安装令牌，或带有该标志的工作区令牌，都会导致启动失败。哪些工作区已授权此安装以 Slack 为事实来源；随后，OpenClaw 会将配置的频道、用户、私信和提及策略应用于每个已传递事件。无论 `allowBots` 如何设置，Enterprise V1 都会在分派前拒绝所有由 Bot 发出的 `message` 和 `app_mention` 事件，因为组织安装无法提供稳定且由工作区限定的 Bot 身份来防止循环。

企业支持有意限制为直接 Socket Mode 或 HTTP `message` 和 `app_mention` 事件及其即时回复。企业账户无法使用 Relay 模式、斜杠命令、交互、App Home、表情回应事件监听器、置顶、Slack 操作工具、Slack 原生审批、绑定、排队或定时传递以及主动发送。通过由监听器负责的 Slack 客户端支持出站确认、正在输入和状态表情回应，并且需要 `reactions:write`；入站表情回应通知和表情回应操作工具仍不可用。

即时回复会复用标准 Slack 投递行为来处理分块、
媒体、元数据、身份回退、链接展开和回执，但仅限于
经过验证且由监听器拥有的客户端仍处于活跃事件轮次期间。内存中的
发送队列和线程参与记录按该事件所属的工作区分区；
客户端本身绝不会被序列化或持久化。

渠道策略键和 `dm.groupChannels` 条目必须使用原始且稳定的 Slack 渠道 ID 或
`channel:<id>` 形式。OpenClaw 会将任一形式规范化为原始渠道 ID，以便
在运行时进行匹配；`slack:`、`group:` 和 `mpim:` 前缀会导致启动失败。
用户策略条目必须使用稳定的 Slack 用户 ID；姓名、slug、显示名称
和电子邮件地址会导致启动失败。ID 必须使用 Slack 规范的大写
前缀和主体（例如 `C0123456789` 或 `U0123456789`）；小写形式和
相似的短格式会导致启动失败。企业账户无法启用
`dangerouslyAllowNameMatching`。企业账户可以设置全局
`mentionPatterns.mode`，但 `mentionPatterns.allowIn` 和
`mentionPatterns.denyIn` 会导致启动失败，因为单独的 Slack 渠道 ID 未限定
工作区，并且可在不同工作区中重复使用。工作区安装
会保留现有的作用域内提及模式行为。每个被接受的工作区
都会获得独立的路由、会话、转录、去重、历史记录和缓存身份，
即使 Slack ID 重叠也是如此。在 `message` 流中，支持普通用户消息
和用户发起的 `file_share` 事件；其他消息子类型会在
授权或系统事件处理之前被拒绝。

企业私信必须禁用（`dm.enabled=false` 或
`dmPolicy="disabled"`），或者通过 `dmPolicy="open"` 显式开放，并且
有效账户 `allowFrom` 中必须包含字面值 `"*"`。空的
允许列表或不包含 `"*"` 的用户特定 ID 会导致启动失败。配对和
按用户设置的私信允许列表会被拒绝，因为这些授权存储中的 Slack 用户 ID
未限定工作区。渠道和发送者策略
仍然适用于渠道消息。

## 安装

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 会注册并启用该插件。在配置下方的 Slack 应用和渠道设置之前，它不会执行任何操作。有关通用插件安装规则，请参阅[插件](/zh-CN/tools/plugin)。

## 快速设置

本节中的清单会创建工作区范围的安装。对于
Enterprise Grid 组织安装，请改用专用的
[全组织清单和工作流](#enterprise-grid-org-wide-installs)。

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
    "description": "OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 将 Slack 助手线程连接到 OpenClaw 智能体。",
      "suggested_prompts": [
        { "title": "你能做什么？", "message": "你能帮我做什么？" },
        {
          "title": "总结此渠道",
          "message": "总结此渠道中的近期活动。"
        },
        { "title": "起草回复", "message": "帮我起草一条回复。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送消息",
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
    "description": "OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 将 Slack 助手线程连接到 OpenClaw 智能体。",
      "suggested_prompts": [
        { "title": "你能做什么？", "message": "你能帮我做什么？" },
        {
          "title": "总结此渠道",
          "message": "总结此渠道中的近期活动。"
        },
        { "title": "起草回复", "message": "帮我起草一条回复。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送消息",
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
          **Recommended** 与 Slack 插件的完整功能集匹配：App Home、斜杠命令、文件、表情回应、置顶、群组私信以及表情符号/用户组读取。当工作区策略限制权限范围时，请选择 **Minimal**——它涵盖私信、渠道/群组历史记录、提及和斜杠命令，但不包括文件、表情回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。有关各权限范围的理由以及额外斜杠命令等增量选项，请参阅[清单和权限范围核对表](#manifest-and-scope-checklist)。
        </Note>

        Slack 创建应用后：

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**：添加 `connections:write`，保存，然后复制 App-Level Token。
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

        环境变量回退（仅限默认账户）：

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
    "description": "OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 将 Slack 助手线程连接到 OpenClaw 智能体。",
      "suggested_prompts": [
        { "title": "你能做什么？", "message": "你能帮我做什么？" },
        {
          "title": "总结此渠道",
          "message": "总结此渠道中的近期活动。"
        },
        { "title": "起草回复", "message": "帮我起草一条回复。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送消息",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "适用于 OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 将 Slack 助手线程连接到 OpenClaw 智能体。",
      "suggested_prompts": [
        { "title": "你能做什么？", "message": "你能帮我做什么？" },
        {
          "title": "总结此渠道",
          "message": "总结此渠道中的近期活动。"
        },
        { "title": "起草回复", "message": "帮我起草一条回复。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送消息",
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
          **推荐**配置与 Slack 插件的完整功能集一致；**最小化**配置会针对限制严格的工作区移除文件、表情回应、置顶、群组私信 (`mpim:*`)、`emoji:read` 和 `usergroups:read`。有关各权限范围的理由，请参阅[清单和权限范围检查表](#manifest-and-scope-checklist)。
        </Note>

        <Info>
          这三个 URL 字段（`slash_commands[].url`、`event_subscriptions.request_url`，以及 `interactivity.request_url` / `message_menu_options_url`）都指向同一个 OpenClaw 端点。Slack 的清单架构要求分别为它们命名，但 OpenClaw 会按有效载荷类型进行路由，因此只需一个 `webhookPath`（默认值为 `/slack/events`）。在 HTTP 模式下，没有 `slash_commands[].url` 的斜杠命令会静默失效。
        </Info>

        Slack 创建应用后：

        - **Basic Information → App Credentials**：复制 **Signing Secret**，用于请求验证。
        - **Install App -> Install to Workspace**：复制 Bot User OAuth Token。

      </Step>

      <Step title="配置 OpenClaw">

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

        为每个账户指定不同的 `webhookPath`（默认值为 `/slack/events`），以免注册发生冲突。
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

对于 Socket Mode，OpenClaw 默认将 Slack SDK 客户端的 pong 超时设为 15 秒。仅当需要针对工作区或主机进行特定调优时，才覆盖传输设置：

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

仅对记录 Slack WebSocket pong/server-ping 超时，或运行在已知存在事件循环饥饿问题的主机上的 Socket Mode 工作区使用此配置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍属于应用状态，而不是传输存活信号。

注意：

- 在 HTTP Request URL 模式下会忽略 `socketMode`。
- 除非被覆盖，否则基础 `channels.slack.socketMode` 设置适用于所有 Slack 账户。每个账户的覆盖配置使用 `channels.slack.accounts.<accountId>.socketMode`；由于这是对象覆盖，因此需要包含希望应用于该账户的所有 Socket 调优字段。
- 只有 `clientPingTimeout` 具有 OpenClaw 默认值（`15000`）。仅在配置后，`serverPingTimeout` 和 `pingPongLoggingEnabled` 才会传递给 Slack SDK。
- Socket Mode 重启退避从约 2 秒开始，上限约为 30 秒。可恢复的启动、启动等待和断开连接故障会持续重试，直到渠道停止。无效身份验证、令牌被撤销或缺少权限范围等永久性账户和凭据错误会快速失败，而不会无限重试。

## 清单和权限范围检查表

Socket Mode 和 HTTP Request URL 使用相同的基础 Slack 应用清单。只有 `settings` 块（以及斜杠命令的 `url`）不同。

基础清单（默认使用 Socket Mode）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "适用于 OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw 将 Slack 助手线程连接到 OpenClaw 智能体。",
      "suggested_prompts": [
        { "title": "你能做什么？", "message": "你能帮我做什么？" },
        {
          "title": "总结此渠道",
          "message": "总结此渠道中的近期活动。"
        },
        { "title": "起草回复", "message": "帮我起草一条回复。" }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送消息",
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

对于 **HTTP Request URL 模式**，将 `settings` 替换为 HTTP 变体，并为每个斜杠命令添加 `url`。需要公共 URL：

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送消息",
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

启用不同功能以扩展上述默认设置。

默认清单会启用 Slack App Home 的 **Home** 选项卡，并订阅 `app_home_opened`。当工作区成员打开 Home 选项卡时，OpenClaw 会发布一个包含 `views.publish` 的安全默认 Home 视图；其中不包含任何对话有效载荷或私有配置。启用单斜杠命令模式后，命令提示会使用 `channels.slack.slashCommand.name`；使用原生命令或不使用斜杠命令的安装会省略该提示。Slack 私信仍会启用 **Messages** 选项卡。清单还会通过 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 和 `assistant_thread_context_changed` 启用 Slack 助手线程；助手线程会路由到各自的 OpenClaw 线程会话，并让智能体能够使用 Slack 提供的线程上下文。

<AccordionGroup>
  <Accordion title="可选原生斜杠命令">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)代替单个已配置命令，但需注意以下细节：

    - 使用 `/agentstatus`，而不是 `/status`，因为 `/status` 命令已被保留。
    - 一个 Slack 应用最多可同时注册 25 个斜杠命令（Slack 平台限制）。

    将现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)的一个子集：

    <Tabs>
      <Tab title="Socket Mode（默认）">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "开始新会话",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "重置当前会话"
    },
    {
      "command": "/compact",
      "description": "压缩会话上下文",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "停止当前运行"
    },
    {
      "command": "/session",
      "description": "管理线程绑定的过期时间",
      "usage_hint": "空闲 <duration|off> 或最长期限 <duration|off>"
    },
    {
      "command": "/think",
      "description": "设置思考级别",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "切换详细输出",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "显示或设置快速模式",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "切换推理过程的可见性",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "切换提升权限模式",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "显示或设置 Exec 默认值",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "批准或拒绝待处理的审批请求",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "显示或设置模型",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "列出提供商/模型",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "显示简短的帮助摘要"
    },
    {
      "command": "/commands",
      "description": "显示生成的命令目录"
    },
    {
      "command": "/tools",
      "description": "显示当前智能体现在可使用的内容",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "显示运行时状态，包括可用时的提供商用量/配额"
    },
    {
      "command": "/tasks",
      "description": "列出当前会话中处于活动状态或最近的后台任务"
    },
    {
      "command": "/context",
      "description": "说明上下文的组装方式",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "显示你的发送者身份"
    },
    {
      "command": "/skill",
      "description": "按名称运行 Skills",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "提出旁支问题而不更改会话上下文",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "提出旁支问题而不更改会话上下文",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "控制用量页脚或显示费用摘要",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP 请求 URL">
        使用与上方 Socket Mode 相同的 `slash_commands` 列表，并为每个条目添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "开始新会话",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "显示简短的帮助摘要",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        对列表中的每个命令重复使用该 `url` 值。

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="可选的作者身份权限范围（写入操作）">
    如果希望出站消息使用当前智能体身份（自定义用户名和图标），而不是默认的 Slack 应用身份，请添加 `chat:write.customize` Bot 权限范围。

    如果使用表情符号图标，Slack 要求采用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选的用户令牌权限范围（读取操作）">
    如果配置了 `channels.slack.userToken`，典型的读取权限范围包括：

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果依赖 Slack 搜索读取）

  </Accordion>
</AccordionGroup>

## 令牌模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- Relay 模式需要 `botToken`，以及 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用应用令牌或签名密钥。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- 配置中的令牌会覆盖环境变量回退值。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN` 和 `SLACK_USER_TOKEN` 的环境变量回退值都只适用于默认账户。
- `userToken` 默认为只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查会按凭据跟踪 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账户通过 SecretRef
  或其他非内联密钥来源配置，但当前命令/运行时路径
  无法解析实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，
  必需的组合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍优先使用 Bot 令牌；仅当 `userTokenReadOnly: false` 且 Bot 令牌不可用时，才允许使用用户令牌写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组         | 默认值 |
| ---------- | ------- |
| messages   | 已启用 |
| reactions  | 已启用 |
| pins       | 已启用 |
| memberInfo | 已启用 |
| emojiList  | 已启用 |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并为图像返回图像预览，为其他文件类型返回本地文件元数据。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
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
    - `dm.groupChannels`（可选的 MPIM 允许列表）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户自身的 `allowFrom` 未设置时，会继承 `channels.slack.allowFrom`。
    - 命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    为保持兼容性，仍会读取旧版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom`。如果能够在不改变访问权限的情况下完成迁移，`openclaw doctor --fix` 会将它们迁移到 `dmPolicy` 和 `allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，并且配置键**必须使用稳定的 Slack 渠道 ID**（例如 `C12345678`）。

    运行时说明：如果完全缺少 `channels.slack`（仅使用环境变量的设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 如果令牌访问权限允许，渠道允许列表条目和私信允许列表条目会在启动时解析
    - 无法解析的渠道名称条目会按配置保留，但默认会在路由时忽略
    - 入站授权和渠道路由默认优先使用 ID；直接匹配用户名/slug 需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    在 `groupPolicy: "allowlist"` 下，基于名称的键（`#channel-name` 或 `channel-name`）**不会**匹配。渠道查找默认优先使用 ID，因此基于名称的键永远无法成功路由，该渠道中的所有消息都会被静默阻止。这与 `groupPolicy: "open"` 不同；在后者中，路由不要求渠道键，因此基于名称的键看起来可以生效。

    始终使用 Slack 渠道 ID 作为键。查找方法：在 Slack 中右键单击渠道 → **Copy link** — ID（`C...`）位于 URL 末尾。

    正确：

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
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
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="提及和渠道用户">
    渠道消息默认受提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 当 Bot 用户是该用户组的成员时，使用 Slack 用户组提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复 Bot 线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每渠道控制项（`channels.slack.channels.<id>`；名称只能通过启动时解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode`（`off|first|all|batched`；覆盖此渠道的账户/聊天类型回复模式）
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 键格式：`channel:`、`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍仅映射到 `id:`）

    `ignoreOtherMentions`（默认值为 `false`）会丢弃提及其他用户或用户组、但未提及此机器人的渠道消息。私信和群组私信（MPIM）不受影响。该过滤器需要从 `auth.test` 解析出机器人用户 ID；如果该身份不可用（例如只有用户令牌的身份），此门控将以开放方式失败，消息会原样通过。

    `allowBots` 对渠道和私有渠道采取保守策略：仅当发送消息的机器人明确列在该房间的 `users` 允许列表中，或 `channels.slack.allowFrom` 中至少一个明确指定的 Slack 所有者 ID 当前是房间成员时，才接受机器人发送的房间消息。通配符和使用显示名称的所有者条目不满足所有者在场条件。所有者在场检查使用 Slack `conversations.members`；请确保应用具有与房间类型匹配的读取权限范围（公共渠道使用 `channels:read`，私有渠道使用 `groups:read`）。如果成员查询失败，OpenClaw 会丢弃机器人发送的房间消息。

    接受的机器人所发 Slack 消息使用共享的[机器人循环保护](/zh-CN/channels/bot-loop-protection)。通过 `channels.defaults.botLoopProtection` 配置默认预算；当工作区或渠道需要不同限制时，再使用 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆盖。

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- Slack 路由绑定接受原始对端 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目标格式。
- 使用默认的 `session.dmScope=main` 时，Slack 私信会归并到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 普通的顶层渠道消息会保留在各渠道对应的会话中，即使 `replyToMode` 不是 `off`。
- Slack 线程回复使用父级 Slack `thread_ts` 作为会话后缀（`:thread:<threadTs>`），即使通过 `replyToMode="off"` 禁用了出站回复线程化。
- 当符合条件的顶层渠道根消息预计会启动一个可见的 Slack 线程时，OpenClaw 会将该根消息写入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，使根消息和后续线程回复共享同一个 OpenClaw 会话。这适用于 `app_mention` 事件、明确提及机器人或匹配已配置提及模式的情况，以及 `replyToMode` 不是 `off` 的 `requireMention: false` 渠道。
- `channels.slack.thread.historyScope` 的默认值为 `thread`；`thread.inheritParent` 的默认值为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认值为 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认值为 `false`）：当设为 `true` 时，抑制隐式线程提及，使机器人仅响应线程内明确的 `@bot` 提及，即使机器人已经参与该线程。若不启用此设置，机器人已参与线程中的回复会绕过 `requireMention` 门控。

回复线程化控制项：

- `channels.slack.channels.<id>.replyToMode`：针对 Slack 渠道/私有渠道消息的每渠道覆盖设置
- `channels.slack.replyToMode`：`off|first|all|batched`（默认值为 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 直接聊天的旧版回退设置：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

要通过 `message` 工具明确回复 Slack 线程，请设置 `replyBroadcast: true`，并结合 `action: "send"` 和 `threadId` 或 `replyTo`，要求 Slack 同时将线程回复广播到父渠道。这会映射到 Slack 的 `chat.postMessage` `reply_broadcast` 标志，并且仅支持文本或 Block Kit 发送，不支持媒体上传。

当 `message` 工具调用在 Slack 线程内运行且以同一渠道为目标时，OpenClaw 通常会根据有效的账户、聊天类型或每渠道 `replyToMode` 继承当前 Slack 线程。自动回复以及同渠道的 `send` 或 `upload-file` 调用使用相同的每渠道覆盖设置。在 `action: "send"` 或 `action: "upload-file"` 上设置 `topLevel: true`，可强制发送新的父渠道消息。`threadId: null` 也可作为等效的顶层退出选项。

<Note>
`replyToMode="off"` 会禁用 Slack 出站回复线程化，包括明确的 `[[reply_to_*]]` 标签。它不会将入站 Slack 线程会话扁平化：已经发布在 Slack 线程内的消息仍会路由到 `:thread:<threadTs>` 会话。这与 Telegram 不同；在 Telegram 的 `"off"` 模式下，明确标签仍然有效。Slack 线程会在渠道中隐藏消息，而 Telegram 回复仍以内联方式保持可见。
</Note>

## 确认表情回应

OpenClaw 处理入站消息时，`ackReaction` 会发送一个确认表情符号。`ackReactionScope` 决定该表情符号实际发送的_时机_。

默认情况下，确认表情回应保持不变，而 Slack 原生智能体线程状态通过轮换加载消息显示进度。设置 `messages.statusReactions.enabled: true` 可启用排队/思考/工具/完成/错误的表情回应生命周期。

### 表情符号（`ackReaction`）

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情符号回退值（`agents.list[].identity.emoji`，否则为 `"eyes"` / 👀）

注意事项：

- Slack 要求使用短代码（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账户或全局禁用该表情回应。

### 范围（`messages.ackReactionScope`）

Slack provider 从 `messages.ackReactionScope` 读取范围（默认值为 `"group-mentions"`）。目前没有 Slack 账户级或 Slack 渠道级覆盖设置；该值对 Gateway 网关全局生效。

可选值：

- `"all"`：在私信和群组中添加表情回应，包括环境房间事件。
- `"direct"`：仅在私信中添加表情回应。
- `"group-all"`：对除环境房间事件外的每条群组消息添加表情回应（不包括私信）。
- `"group-mentions"`（默认值）：在群组中添加表情回应，但仅限机器人被提及的情况（或选择启用的群组可提及项）。**不包括私信。**
- `"off"` / `"none"`：从不添加表情回应。

<Note>
默认范围（`"group-mentions"`）不会在直接消息或环境房间事件中触发确认表情回应。要在入站 Slack 私信和安静的房间事件中看到配置的 `ackReaction`（例如 `"eyes"`），请将 `messages.ackReactionScope` 设为 `"all"`。`messages.ackReactionScope` 会在 Slack provider 启动时读取，因此需要重启 Gateway 网关才能使更改生效。
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // 在私信和群组中添加表情回应
  },
}
```

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认值）：使用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，随后发送最终文本。
- `streaming.preview.toolProgress`：启用草稿预览时，将工具/进度更新路由到同一条经过编辑的预览消息中（默认值：`true`）。设置 `false` 可保留独立的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设为 `status`，可在隐藏原始命令/执行文本的同时保留精简的工具进度行（默认值：`raw`）。

隐藏原始命令/执行文本，同时保留精简的进度行：

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

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认值：`true`）。

Slack 原生进度任务卡在进度模式下需要选择启用。将 `channels.slack.streaming.progress.nativeTaskCards` 设为 `true` 并结合 `channels.slack.streaming.mode="progress"`，可在工作运行期间发送 Slack 原生计划/任务卡，然后在完成时更新同一张任务卡。如果不设置此标志，进度模式会继续使用可移植的草稿预览行为。

- 必须有可用的回复线程，才能显示原生文本流式传输和 Slack 智能体线程状态。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用或不存在回复线程时，渠道、群聊和顶层私信根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认不在线程中，因此不会显示 Slack 线程样式的原生流式传输/状态预览；OpenClaw 会改为在私信中发布并编辑草稿预览。
- 媒体和非文本负载会回退到普通交付方式。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/区块最终消息仅在可以原地编辑预览时才会刷新。
- 如果流式传输在回复过程中失败，OpenClaw 会对剩余负载回退到普通交付方式。

使用草稿预览而非 Slack 原生文本流式传输：

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

选择启用 Slack 原生进度任务卡：

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

- `channels.slack.streamMode`（`replace | status_final | append`）是 `channels.slack.streaming.mode` 的旧版别名。
- 布尔值 `channels.slack.streaming` 是 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport` 的旧版别名。
- 顶层的 `channels.slack.chunkMode` 和 `channels.slack.nativeStreaming` 是 `channels.slack.streaming.chunkMode` 和 `channels.slack.streaming.nativeTransport` 的旧版别名。
- 运行时不会读取旧版别名；请运行 `openclaw doctor --fix`，将持久化的 Slack 流式传输配置重写为规范键。

## 输入状态表情回应回退

OpenClaw 处理回复时，`typingReaction` 会在入站 Slack 消息上添加临时表情回应，并在运行结束时将其移除。这在非线程回复中最有用；线程回复使用默认的“正在输入……”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事项：

- Slack 要求使用短代码（例如 `"hourglass_flowing_sand"`）。
- 该表情回应采用尽力而为方式，并会在回复或失败路径完成后自动尝试清理。

## 语音输入

目前要在 Slack 中通过语音与 OpenClaw 交互，请向 OpenClaw 应用发送 Slack 音频片段。Slackbot 的听写麦克风是 Slack 自有的独立功能，并非应用 API。

- **[Slackbot 语音听写](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** 位于用户与 Slackbot 的私人对话中。Slack 会将录音转换为 Slackbot 提示，但不会通过 Events API 向第三方 Slack 应用发出音频文件、听写事件、提示或输入来源标记。OpenClaw Slack 插件无法启用或接收此功能。
- **[Slack 音频剪辑](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** 是存储在 Slack 中的文件，可发布到 OpenClaw 私信、频道或话题串中。OpenClaw 使用机器人令牌下载可访问的剪辑，规范化 Slack 的剪辑 MIME 元数据，并通过共享的[音频转录流水线](/zh-CN/nodes/audio)发送。建议的应用清单包含所需的 `files:read` 权限范围。

音频剪辑和 Slackbot 听写具有不同的隐私语义：剪辑遵循 Slack 文件保留策略，且 OpenClaw 会下载它们以进行转录；而 Slack 表示不会存储听写音频。

在启用了 `requireMention: true` 的频道中，无字幕音频剪辑可通过说出已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）来通过门控。OpenClaw 会先授权发送者，再下载或转录剪辑，并且仅在转录文本匹配时才接受该剪辑。失败或不匹配的推测性转录会与下载的剪辑一并丢弃；不会保留在频道历史记录中。无法根据语音推断原生 Slack `@bot` 身份，因此请配置口述名称模式或添加文字提及。如果启用了转录回显，则仅在消息被接受后发送回显。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件通过 Slack 托管的私有 URL 下载（使用令牌身份验证的请求流程）；获取成功且大小限制允许时，会写入媒体存储。文件占位符包含 Slack `fileId`，以便智能体可使用 `download-file` 获取原始文件。

    下载采用有界的空闲超时和总超时。如果 Slack 文件检索停滞或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本块使用 `channels.slack.textChunkLimit`（默认值为 `8000`，上限为 Slack 自身的消息长度限制）
    - `channels.slack.streaming.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可包含话题串回复（`thread_ts`）
    - 较长的文件说明使用第一个符合 Slack 安全要求的文本块作为上传评论，并将其余文本块作为后续消息发送
    - 配置后，出站媒体上限遵循 `channels.slack.mediaMaxMb`；否则，渠道发送使用媒体流水线中按 MIME 类型划分的默认值

  </Accordion>

  <Accordion title="投递目标">
    首选的显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于频道

    仅包含文本或区块的 Slack 私信可直接发布到用户 ID；文件上传和话题串发送则会先通过 Slack 对话 API 打开私信，因为这些路径需要具体的对话 ID。

  </Accordion>
</AccordionGroup>

## 命令和斜杠命令行为

斜杠命令在 Slack 中显示为单个已配置命令或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令要求在 Slack 应用中配置[其他清单设置](#additional-manifest-settings)，并改为通过全局配置中的 `channels.slack.commands.native: true` 或 `commands.native: true` 启用。

- Slack 的原生命令自动模式默认**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单按以下优先顺序之一呈现：

- 3-5 个长度足够短的选项：溢出（“...”）菜单
- 超过 100 个选项，且支持异步选项筛选：外部选择器
- 1-2 个选项，或任一选项的编码值过长而无法用于选择器：按钮区块
- 其他情况（6-100 个选项，或超过 100 个但不支持异步筛选）：静态选择菜单，每个菜单最多分块容纳 100 个选项

```txt
/think
```

斜杠命令会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，并仍使用 `CommandTargetSessionKey` 将命令执行路由到目标对话会话。

## 原生图表

Slack 的公共 [`data_visualization` Block Kit 区块](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
可在消息中呈现折线图、条形图、面积图和饼图。OpenClaw 将可移植的
`presentation` `chart` 区块映射为该原生结构；除正常的
`chat:write` 消息访问权限外，不需要额外的 OAuth 权限范围、
文件上传、图像渲染器或 Slack 配置。

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "季度收入",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "收入", "values": [120, 145] }],
      "xLabel": "季度"
    }
  ]
}
```

原生呈现前会强制执行 Slack 的限制：

- 标题和可选坐标轴标签：50 个字符
- 饼图：1-12 个正值扇区
- 折线图/条形图/面积图：1-12 个名称唯一的系列和 1-20 个共享类别
- 扇区、类别和系列标签：20 个字符
- 每个系列必须为每个类别包含一个有限数值；非饼图值
  可以为负数

每个原生图表还带有顶层文本表示，供屏幕阅读器、通知、会话镜像以及无法呈现该区块的客户端使用。除非其他 OpenClaw 渠道声明支持原生图表，否则发送到这些渠道的标准呈现会以文本形式接收相同的确定性图表数据。如果 Slack 在分阶段推出期间以 `invalid_blocks` 拒绝图表，OpenClaw 会移除被拒绝的原生数据区块，保留所有同级控件，并将完整图表表示作为可见文本发送。

Slack 目前允许每条消息最多包含两个 `data_visualization` 区块。当一个呈现包含两个以上的有效图表时，OpenClaw 会保持其顺序，并在后续消息中继续原生呈现，每条消息最多包含两个图表。

Slack 的[开发者发布公告](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
将该区块说明为面向应用的 Block Kit 功能，且未公布任何付费方案限制。Business+/Enterprise 资格说明适用于 Slackbot 的自动 AI 图表生成，与应用发送已结构化的 Block Kit 图表并非同一功能。图表是仅限消息的区块，不能用于 App Home、模态窗口或 Canvas 内容。

## 原生表格

Slack 当前的 [`data_table` Block Kit 区块](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
可在消息中呈现结构化行和列。OpenClaw 将显式的可移植
`presentation` `table` 区块映射为 `data_table`；不会使用 Slack 的
旧版 [`table` 区块](https://docs.slack.dev/reference/block-kit/blocks/table-block/)。
除正常的 `chat:write` 消息访问权限外，不需要额外的 OAuth 权限范围或 Slack 配置。

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "待处理销售管道",
      "headers": ["账户", "阶段", "ARR"],
      "rows": [
        ["Acme", "已赢单", 125000],
        ["Globex", "审核", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw 将表头和字符串单元格映射为 Slack `raw_text` 单元格。数字单元格映射为 `raw_number`，并保留有限数值，以支持原生排序和筛选。`rowHeaderColumnIndex` 存在时，会将该从零开始计数的列标记为 Slack 行表头。

原生呈现前会强制执行 Slack 公布的 `data_table` 限制：

- 1-20 列
- 1-100 个数据行，外加表头行
- 每行的单元格数量相同
- 一条消息中所有表格单元格的字符总数最多为 10,000

只要消息仍处于字符总数限制内，多个有效表格区块即可原生呈现。无法在原生限制范围内呈现的表格会转换为完整的确定性文本，而不会丢失行或单元格。如果该文本超过一条 Slack 消息的容量，发送和斜杠命令响应会使用有序文本块。表格编辑会返回明确的大小错误，而不会静默截断现有消息中的行。

通过可移植呈现生成的每个原生表格还带有顶层文本表示，供屏幕阅读器、通知、会话镜像以及无法呈现该区块的客户端使用。原始图表和表格值在回退文本中保持字面形式，因此 `<@U123>` 等单元格数据不会变成 Slack 提及。如果 Slack 以 `invalid_blocks` 拒绝原生图表或表格区块，OpenClaw 会在一次有界恢复步骤中移除所有原生数据区块，保留按钮和选择器等有效同级区块，并在禁用 Slack 格式化的情况下发送完整、可见的图表和表格文本。斜杠命令投递会跟踪整个命令的 Slack 五次调用 `response_url` 预算。每批回复前，它会选择一套能在剩余调用次数内完整执行的方案，否则会在发布该批次前失败。

只有显式的 `presentation` 表格区块会提升为原生表格。Markdown 管道表格仍作为编写的文本处理；OpenClaw 不会猜测表格结构或单元格类型。现有受信任的 Slack 原生生成方可继续通过 `channelData.slack.blocks` 传递原始区块；OpenClaw 会从有效的原始 `data_table` 单元格派生回退文本，而格式错误的自定义区块可能会降级为其说明文字或通用 Block Kit 回退内容。可移植的智能体、CLI 和插件输出应使用 `presentation`。

## 交互式回复

Slack 可以呈现由智能体编写的交互式回复控件，但此功能默认禁用。
对于新的智能体、CLI 和插件输出，首选共享的
`presentation` 按钮或选择器区块。它们使用相同的 Slack 交互路径，
同时也能在其他渠道上降级呈现。

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

或者仅为一个 Slack 账户启用：

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

启用后，智能体仍可发出已弃用的 Slack 专用回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有 Slack 交互事件路径将点击或选择操作路由回来。保留它们以兼容旧提示和 Slack 专用的应急路径；新的可移植控件应使用共享呈现。

对于新的生成方代码，指令编译器 API 也已弃用：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

新的 Slack 呈现控件应使用 `presentation` 负载和 `buildSlackPresentationBlocks(...)`。

注意事项：

- 这是 Slack 特有的旧版 UI。其他渠道不会将 Slack Block
  Kit 指令转换为各自的按钮系统。
- 交互式回调值是由 OpenClaw 生成的不透明令牌，并非智能体编写的原始值。
- 如果生成的交互式区块会超出 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的区块载荷。

### 插件自有的模态框提交

注册了交互处理程序的 Slack 插件还可以在 OpenClaw 为智能体可见的系统事件压缩
载荷之前，接收模态框 `view_submission` 和 `view_closed` 生命周期事件。打开 Slack 模态框时，
请使用以下路由模式之一：

- 将 `callback_id` 设置为 `openclaw:<namespace>:<payload>`。
- 或者保留现有的 `callback_id`，并将 `pluginInteractiveData:
"<namespace>:<payload>"` 放入模态框的 `private_metadata` 中。

处理程序接收规范化的 `inputs`、作为 `view_submission` 或
`view_closed` 的 `ctx.interaction.kind`，以及来自
Slack 的完整原始 `stateValues` 对象。仅按回调 ID 路由就足以调用插件处理程序；如果
模态框还应生成智能体可见的系统事件，请包含现有模态框的
`private_metadata` 用户/会话路由字段。智能体会收到经过压缩和脱敏的
`Slack interaction: ...` 系统事件。如果处理程序返回
`systemEvent.summary`、`systemEvent.reference` 或 `systemEvent.data`，这些
字段会包含在该压缩事件中，以便智能体引用
插件自有的存储，而无需看到完整的表单载荷。

## Slack 中的原生审批

Slack 可以通过交互式按钮和交互操作充当原生审批客户端，而不必回退到 Web UI 或终端。

- Exec 和插件审批可以呈现为 Slack 原生的 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是原生 Exec 审批客户端的启用项及私信/渠道路由配置。
- Exec 审批私信使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 当 Slack 已启用为发起会话的原生审批客户端，或 `approvals.plugin` 路由到发起请求的 Slack 会话或 Slack 目标时，插件审批会使用 Slack 原生按钮。
- 插件审批私信使用来自 `channels.slack.allowFrom` 的 Slack 插件审批人、具名账户的 `allowFrom`，或账户默认路由。
- 仍会强制执行审批人授权：仅有 Exec 审批权限的审批人无法批准插件请求，除非他们同时也是插件审批人。

这使用与其他渠道相同的共享审批按钮界面。当 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在对话中呈现为 Block Kit 按钮。
当这些按钮存在时，它们是主要审批体验；仅当工具结果表明聊天
审批不可用或手动审批是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少能解析出一名
Exec 审批人时，Slack 会自动启用原生 Exec 审批。当 Slack 插件审批人能够解析，且请求匹配原生客户端筛选器时，Slack 也可以通过此原生客户端
路径处理原生插件审批。将
`enabled: false` 设置为显式禁用 Slack 作为原生审批客户端。将 `enabled: true` 设置为
在能够解析审批人时强制启用原生审批。禁用 Slack Exec 审批不会禁用
通过 `approvals.plugin` 启用的原生 Slack 插件审批投递；插件审批
投递改用 Slack 插件审批人。

未显式配置 Slack Exec 审批时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在需要覆盖审批人、添加筛选器或选择加入来源聊天投递时，才需要显式配置 Slack 原生功能：

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

共享的 `approvals.exec` 转发是独立的。仅当 Exec 审批提示还必须
路由到其他聊天或显式的带外目标时才使用它。共享的 `approvals.plugin` 转发也是
独立的；仅当 Slack 能够原生处理插件
审批请求时，Slack 原生投递才会抑制该回退。

同一聊天中的 `/approve` 也适用于已支持命令的 Slack 渠道和私信。有关完整的审批转发模型，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“Also send to channel”线程回复）会作为普通用户消息处理。
- 添加/移除表情回应事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名以及添加/移除置顶事件会映射为系统事件。
- 可选的在线状态轮询可以将观察到的人类参与者从 `away` 到 `active` 的转换映射到该参与者最近活跃且符合条件的 Slack 会话。默认关闭。
- 启用 `configWrites` 后，`channel_id_changed` 可以迁移渠道配置键。
- 渠道主题/用途元数据被视为不受信任的上下文，并可注入路由上下文。
- 适用时，线程起始消息和初始线程历史上下文播种会按照已配置的发送者允许列表进行筛选。
- 区块操作、快捷方式和模态框交互会发出结构化的 `Slack interaction: ...` 系统事件，其中包含丰富的载荷字段：
  - 区块操作：选定值、标签、选择器值和 `workflow_*` 元数据
  - 全局快捷方式：回调和操作者元数据，路由到操作者的直接会话
  - 消息快捷方式：回调、操作者、渠道、线程和所选消息上下文
  - 模态框 `view_submission` 和 `view_closed` 事件，包含已路由的渠道元数据和表单输入

在 Slack 应用配置中定义全局或消息快捷方式，并使用任意非空回调 ID。OpenClaw 会确认匹配的快捷方式载荷，应用与其他 Slack 交互相同的私信/渠道发送者策略，并将经过清理的事件排入已路由智能体会话的队列。触发器 ID 和响应 URL 会从智能体上下文中脱敏。

### 在线状态事件

Slack 不会通过 Events API 或 Socket Mode 发送在线状态变更。OpenClaw 可以改为针对消息已通过正常 Slack 访问和路由检查的人类参与者轮询 [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/)。

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off`（默认值）：不启用在线状态计时器，也不调用 Slack API。
- `auto`：监控过去 24 小时内活跃的私信、MPIM 和 Slack 线程，最多观察 8 名人类参与者。不包括顶层渠道会话。
- `on`：监控相同的对话，但不限制参与者数量，并包括顶层渠道会话。使用按渠道覆盖来强制启用或禁用某个渠道。

OpenClaw 每个 Slack 账户每分钟最多轮询 45 个唯一用户，使用首次结果初始化且不会唤醒智能体，并且只会在观察到从 `away` 到 `active` 的转换时唤醒。每个 Slack 账户和用户都有持久的 8 小时冷却期，即使该用户参与多个线程也是如此。事件只会路由到该用户最近活跃且符合条件的对话，并指示智能体在决定是否发送一句简短问候之前，先查阅记忆/wiki 和已知时区上下文。智能体可以保持沉默。

机器人令牌需要 `users:read`，推荐的清单中已包含该项。Enterprise Grid 全组织安装无法使用在线状态事件。

## 配置参考

主要参考：[Configuration reference - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="重要 Slack 字段">

- 模式/身份验证：`mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（应急开关；除非需要，否则保持关闭）
- 渠道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程/历史记录：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 在线状态唤醒：`presenceEvents.mode`、`channels.*.presenceEvents.mode`（`off|auto|on`；默认值 `off`）
- 投递：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展开预览：`unfurlLinks`（默认值：`false`）、用于控制 `chat.postMessage` 链接/媒体预览的 `unfurlMedia`；设置 `unfurlLinks: true` 可重新启用链接预览
- 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排查

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按以下顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）— **键必须是渠道 ID**（`C12345678`），而不是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为渠道路由默认优先使用 ID。要查找 ID：右键单击 Slack 中的渠道 → **Copy link** — URL 末尾的 `C...` 值就是渠道 ID。
    - `requireMention`
    - 按渠道设置的 `users` 允许列表
    - `messages.groupChat.visibleReplies`：普通群组/渠道请求默认为 `"automatic"`。如果你选择启用了 `"message_tool"`，且日志显示智能体文本但没有调用 `message(action=send)`，则模型遗漏了可见消息工具路径。在此模式下，最终文本会保持私密；请检查 Gateway 网关详细日志中的已抑制载荷元数据，或者如果希望每条普通智能体最终回复都通过旧版路径发布，请将其设置为 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果其值为 `"room_event"`，则允许的未提及渠道聊天会作为环境上下文，并保持静默，除非智能体调用 `message` 工具。请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    实用命令：

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
    - 配对审批 / 允许列表条目（`dmPolicy: "open"` 仍需 `channels.slack.allowFrom: ["*"]`）
    - 群组私信使用 MPIM 处理；启用 `channels.slack.dm.groupEnabled`，并且如果已配置，将 MPIM 加入 `channels.slack.dm.groupChannels`
    - Slack Assistant 私信事件：详细日志中提及 `drop message_changed`
      通常表示 Slack 发送了经过编辑的 Assistant 话题串事件，但消息元数据中
      没有可恢复的真人发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式无法连接">
    在 Slack 应用设置中验证机器人令牌、应用令牌以及 Socket Mode 是否已启用。
    App-Level Token 需要 `connections:write`，而 Bot User OAuth Token
    机器人令牌必须与应用令牌属于同一个 Slack 应用/工作区。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则 Slack 账号已配置，
    但当前运行时无法解析由 SecretRef 支持的值。

    `slack socket mode failed to start; retry ...` 之类的日志表示可恢复的
    启动失败。缺少权限范围、令牌被撤销和身份验证无效则会快速失败。
    `slack token mismatch ...` 日志表示机器人令牌和应用令牌
    似乎属于不同的 Slack 应用；请修正 Slack 应用凭据。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - 签名密钥
    - webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账号使用唯一的 `webhookPath`
    - 公共 URL 终止 TLS，并将请求转发到 Gateway 网关路径
    - Slack 应用的 `request_url` 路径与 `channels.slack.webhookPath` 完全匹配（默认值为 `/slack/events`）

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，
    则 HTTP 账号已配置，但当前运行时无法解析
    由 SecretRef 支持的签名密钥。

    重复出现 `slack: webhook path ... already registered` 日志表示两个 HTTP
    账号正在使用同一个 `webhookPath`；请为每个账号指定不同的路径。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    验证你打算使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册了匹配的斜杠命令
    - 或单斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不会自动创建或移除斜杠命令。`commands.native: "auto"` 不会启用 Slack 原生命令；请使用 `true`，并在 Slack 应用中创建匹配的命令。在 HTTP 模式下，每个 Slack 斜杠命令都必须包含 Gateway 网关 URL。在 Socket Mode 下，命令载荷通过 websocket 传入，Slack 会忽略 `slash_commands[].url`。

    还要检查 `commands.useAccessGroups`、私信授权、渠道允许列表
    以及每个渠道的 `users` 允许列表。对于被阻止的斜杠命令发送者，Slack 会返回仅对用户可见的错误，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件媒体参考

当 Slack 文件下载成功且大小限制允许时，Slack 可以将下载的媒体附加到智能体轮次。音频片段可以转录，图像文件可以通过媒体理解路径或直接传给支持视觉的回复模型，其他文件则仍可作为可下载的文件上下文使用。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 说明                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音频片段                 | Slack 文件 URL       | 下载并通过共享音频转录流程处理                                                    | 需要 `files:read` 以及可用的 `tools.media.audio` 模型或 CLI          |
| JPEG / PNG / GIF / WebP 图像   | Slack 文件 URL       | 下载并附加到轮次，以供支持视觉的处理流程使用                                      | 每个文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                            |
| PDF 文件                       | Slack 文件 URL       | 下载并作为文件上下文提供给 `download-file` 或 `pdf` 等工具       | Slack 入站流程不会自动将 PDF 转换为图像视觉输入                           |
| 其他文件                       | Slack 文件 URL       | 在可能的情况下下载并作为文件上下文提供                                            | 二进制文件不会被视为图像输入                                              |
| 话题串回复                     | 话题串起始消息文件   | 当回复没有直接媒体时，可以载入根消息文件作为上下文                                | 仅包含文件的起始消息使用附件占位符                                        |
| 多文件消息                     | 多个 Slack 文件      | 单独评估每个文件                                                                  | Slack 处理上限为每条消息八个文件                                          |

### 入站流程

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用机器人令牌从 Slack 的私有 URL 下载文件。
2. 下载成功后，文件会写入媒体存储。
3. 下载媒体的路径和内容类型会添加到入站上下文。
4. 音频片段会路由到共享转录流程；支持图像的模型/工具路径可以使用同一上下文中的图像附件。
5. 其他文件仍可作为文件元数据或媒体引用，供能够处理它们的工具使用。

### 继承话题串根消息附件

当消息到达话题串中（具有 `thread_ts` 父消息）时：

- 如果回复本身没有直接媒体，而包含的根消息有文件，Slack 可以载入根消息文件作为话题串起始上下文。
- 仅在初始化新的或已重置的话题串会话时载入根消息文件。后续仅包含文本的回复会复用现有会话上下文，不会将根消息文件作为新媒体重新附加。
- 直接附加到回复的附件优先于根消息附件。
- 如果根消息仅包含文件而没有文本，则使用附件占位符表示，以便回退流程仍能包含其文件。

### 多附件处理

当一条 Slack 消息包含多个文件附件时：

- 每个附件都通过媒体流程单独处理。
- 下载的媒体引用会汇总到消息上下文中。
- 处理顺序遵循事件载荷中的 Slack 文件顺序。
- 一个附件下载失败不会阻止其他附件。

### 大小、下载和模型限制

- **大小上限**：默认每个文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **音频转录上限**：将下载的文件发送给转录提供商或 CLI 时，`tools.media.audio.maxBytes` 同样适用。
- **下载失败**：Slack 无法提供的文件、过期 URL、无法访问的文件、超大文件以及 Slack 身份验证/登录 HTML 响应会被跳过，而不会被报告为不支持的格式。
- **视觉模型**：当当前回复模型支持视觉时，图像分析使用该模型；否则使用在 `agents.defaults.imageModel` 中配置的图像模型。

### 已知限制

| 场景                                          | 当前行为                                                                           | 解决方法                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Slack 文件 URL 已过期                         | 跳过文件；不显示错误                                                               | 在 Slack 中重新上传文件                                                       |
| 音频转录不可用                                | 音频片段仍保持附加状态，但不会生成转录文本                                         | 配置 `tools.media.audio` 或安装受支持的本地转录 CLI                           |
| 无说明文字的片段未通过提及门控                | 私下推测性转录后丢弃；转录文本和下载内容均被删除                                   | 配置口述名称提及模式、添加文本形式的机器人提及或使用私信                    |
| 未配置视觉模型                                | 图像附件存储为媒体引用，但不会作为图像进行分析                                     | 配置 `agents.defaults.imageModel` 或使用支持视觉的回复模型                             |
| 非常大的图像（默认 > 20 MB）                  | 根据大小上限跳过                                                                   | 如果 Slack 允许，请提高 `channels.slack.mediaMaxMb`                                   |
| 转发/共享的附件                               | 以尽力而为的方式处理文本以及 Slack 托管的图像/文件媒体                             | 直接在 OpenClaw 话题串中重新共享                                             |
| PDF 附件                                      | 存储为文件/媒体上下文，不会自动通过图像视觉流程处理                                | 使用 `download-file` 获取文件元数据，或使用 `pdf` 工具分析 PDF |

### 相关文档

- [媒体理解流程](/zh-CN/nodes/media-understanding)
- [音频和语音便笺](/zh-CN/nodes/audio)
- [PDF 工具](/zh-CN/tools/pdf)

## 相关内容

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
    威胁模型和安全强化。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

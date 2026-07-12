---
read_when:
    - 设置 Slack 或调试 Slack Socket、HTTP 或中继模式
summary: Slack 设置和运行时行为（Socket Mode、HTTP Request URLs 和中继模式）
title: Slack
x-i18n:
    generated_at: "2026-07-12T14:20:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
    source_path: channels/slack.md
    workflow: 16
---

Slack 支持通过 Slack 应用集成处理私信和频道。默认传输方式为 Socket Mode；也支持 HTTP Request URLs。中继模式适用于由可信路由器负责 Slack 入口的托管式部署。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
</CardGroup>

## 选择传输方式

Socket Mode 和 HTTP Request URLs 在消息传递、斜杠命令、App Home 和交互功能方面已达到功能对等。应根据部署形态而非功能进行选择。

| 考量因素                     | Socket Mode（默认）                                                                                                                                  | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 公共 Gateway 网关 URL        | 不需要                                                                                                                                               | 必需（DNS、TLS、反向代理或隧道）                                                                               |
| 出站网络                     | 必须能够通过出站 WSS 访问 `wss-primary.slack.com`                                                                                                    | 无出站 WS；仅使用入站 HTTPS                                                                                    |
| 所需令牌                     | Bot token + 具有 `connections:write` 的 App-Level Token                                                                                              | Bot token + Signing Secret                                                                                     |
| 开发笔记本电脑/防火墙后方    | 可直接使用                                                                                                                                           | 需要公共隧道（ngrok、Cloudflare Tunnel、Tailscale Funnel）或预发布环境 Gateway 网关                            |
| 水平扩展                     | 每台主机上的每个应用对应一个 Socket Mode 会话；多个 Gateway 网关需要各自独立的 Slack 应用                                                            | 无状态 POST 处理程序；多个 Gateway 网关副本可在负载均衡器后共享一个应用                                        |
| 单个 Gateway 网关上的多账户  | 支持；每个账户打开自己的 WS                                                                                                                          | 支持；每个账户都需要唯一的 `webhookPath`（默认 `/slack/events`），以免注册冲突                                 |
| 斜杠命令传输                 | 通过 WS 连接传递；忽略 `slash_commands[].url`                                                                                                        | Slack 向 `slash_commands[].url` 发送 POST；该字段是分派命令所必需的                                            |
| 请求签名                     | 不使用（通过 App-Level Token 进行身份验证）                                                                                                          | Slack 对每个请求签名；OpenClaw 使用 `signingSecret` 进行验证                                                   |
| 连接断开后的恢复             | Slack SDK 已启用自动重连；OpenClaw 还会以有界退避方式重启失败的 Socket Mode 会话。适用 Pong 超时传输调优。                                            | 没有可能断开的持久连接；由 Slack 针对每个请求进行重试                                                          |

<Note>
  对于单 Gateway 网关主机、开发笔记本电脑，以及可以出站访问 `*.slack.com` 但无法接受入站 HTTPS 的本地网络，**请选择 Socket Mode**。

在负载均衡器后运行多个 Gateway 网关副本、出站 WSS 被阻止但允许入站 HTTPS，或者已经在反向代理处终止 Slack Webhooks 时，**请选择 HTTP Request URLs**。
</Note>

<Warning>
  Slack 可以为一个应用维护多个 Socket Mode 连接，并可能将每个有效负载传递到任意连接。因此，共用一个 Slack 应用的多个独立 OpenClaw Gateway 网关需要使用等效的路由和授权配置。否则，请为每个 Gateway 网关使用单独的 Slack 应用、使用单一中继入口，或在负载均衡器后使用 HTTP Request URLs。请参阅 [使用 Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections)。
</Warning>

### 中继模式

中继模式将 Slack 入口与 OpenClaw Gateway 网关分离。可信路由器负责唯一的 Slack Socket Mode 连接、选择目标 Gateway 网关，并通过经过身份验证的 WebSocket 转发类型化事件。Gateway 网关仍使用自己的 Bot token 调用出站 Slack Web API。

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

除非目标为 localhost，否则中继 URL 必须使用 `wss://`。应将持有者令牌和路由器路由表视为 Slack 授权边界的一部分：路由后的事件会作为已授权激活进入常规 Slack 消息处理程序。路由器在 WebSocket `hello` 帧中提供的 `slack_identity` 可以设置默认出站用户名和图标；调用方明确提供的身份仍具有更高优先级。中继连接使用与 Socket Mode 相同的有界退避时序进行重连，并在每次断开连接时清除路由器提供的身份。

### Enterprise Grid 组织范围安装

一个 Slack 账户可以接收 Enterprise Grid 组织范围安装所覆盖的每个工作区中的消息。请选择直接 Socket Mode 或 HTTP Request URLs；企业账户不支持中继模式。以下两个最小权限清单都仅启用 V1 `message` 和 `app_mention` 事件路径、即时回复以及由监听器负责的状态表情回应。

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "用于 OpenClaw 的 Slack 连接器"
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

请让 Enterprise Grid Org Admin 或 Org Owner 批准该应用，在组织级别安装它，并选择该安装所覆盖的工作区。启动 OpenClaw 前，请确认该应用在每个预期工作区中均可用。为 Socket Mode 生成具有 `connections:write` 的应用级令牌，然后从组织安装中复制 Bot token。配置使用组织安装 Bot token 的账户：

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

当 Gateway 网关具有公共 HTTPS 端点且不建立 Socket Mode 连接时，请使用 HTTP 模式。将示例 URL 替换为 Gateway 网关的公共 `webhookPath` URL（默认 `/slack/events`）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "用于 OpenClaw 的 Slack 连接器"
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

请让 Enterprise Grid Org Admin 或 Org Owner 批准该应用，在组织级别安装它，并选择该安装所覆盖的工作区。Slack 验证 Request URL 后，复制组织安装的 Bot token 以及应用的 **Basic Information -> App Credentials -> Signing Secret**。使用相同的 Request URL 路径配置企业账户：

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

启动时，OpenClaw 使用 Slack `auth.test` 验证 `enterpriseOrgInstall`。未设置该标志的组织安装令牌，或设置了该标志的工作区令牌，都会导致启动失败。哪些工作区已授予安装权限以 Slack 为事实来源；随后，OpenClaw 会将配置的频道、用户、私信和提及策略应用于每个传递的事件。无论 `allowBots` 设置如何，Enterprise V1 都会在分派前拒绝所有由 Bot 编写的 `message` 和 `app_mention` 事件，因为组织安装无法提供用于防止循环的、稳定且限定工作区的 Bot 身份。

企业支持有意限制为直接 Socket Mode 或 HTTP `message` 和 `app_mention` 事件及其即时回复。企业账户无法使用中继模式、斜杠命令、交互、App Home、表情回应事件监听器、置顶、Slack 操作工具、Slack 原生审批、绑定、排队或定时传递以及主动发送。通过监听器负责的 Slack 客户端支持出站确认、输入中和状态表情回应，并且需要 `reactions:write`；入站表情回应通知和表情回应操作工具仍不可用。

即时回复会复用标准 Slack 传递行为来处理分块、媒体、元数据、身份回退、链接展开和回执，但仅限经过验证且由监听器负责的客户端仍处于活动事件轮次期间。内存中的发送队列和线程参与记录按该事件的工作区分区；客户端本身绝不会被序列化或持久化。

频道策略键和 `dm.groupChannels` 条目必须使用原始、稳定的 Slack 频道 ID，或
`channel:<id>` 形式。OpenClaw 会将这两种形式都规范化为原始频道 ID，以便
在运行时进行匹配；使用 `slack:`、`group:` 和 `mpim:` 前缀会导致启动失败。
用户策略条目必须使用稳定的 Slack 用户 ID；使用姓名、slug、显示名称
和电子邮件地址会导致启动失败。ID 必须使用 Slack 规范的大写
前缀和主体（例如 `C0123456789` 或 `U0123456789`）；小写形式和
较短的相似 ID 会导致启动失败。企业账户不能启用
`dangerouslyAllowNameMatching`。企业账户可以设置全局
`mentionPatterns.mode`，但设置 `mentionPatterns.allowIn` 和
`mentionPatterns.denyIn` 会导致启动失败，因为裸 Slack 频道 ID 不包含
工作区限定信息，并且可能在不同工作区之间重复使用。工作区安装
保留现有的限定范围提及模式行为。每个被接受的工作区
都会获得独立的路由、会话、转录记录、去重、历史记录和缓存标识，
即使 Slack ID 存在重叠也是如此。在 `message` 流中，支持普通用户消息
以及用户发起的 `file_share` 事件；其他消息子类型会在
授权或系统事件处理之前被拒绝。

企业私信必须被禁用（`dm.enabled=false` 或
`dmPolicy="disabled"`），或者通过 `dmPolicy="open"` 显式开放，并且
有效账户的 `allowFrom` 中必须包含字面值 `"*"`。空的
允许列表或不含 `"*"` 的用户特定 ID 会导致启动失败。配对和
按用户设置的私信允许列表会被拒绝，因为这些授权存储中的 Slack 用户 ID
不包含工作区限定信息。频道和发送者策略
仍然适用于频道消息。

## 安装

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` 会注册并启用该插件。在你配置下方的 Slack 应用和频道设置之前，它不会执行任何操作。有关插件安装的通用规则，请参阅[插件](/zh-CN/tools/plugin)。

## 快速设置

本节中的清单会创建限定于工作区的安装。对于
Enterprise Grid 组织安装，请改用专用的
[组织范围清单和工作流](#enterprise-grid-org-wide-installs)。

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
    "description": "用于 OpenClaw 的 Slack 连接器"
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
          "title": "总结此频道",
          "message": "总结此频道最近的活动。"
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
    "description": "用于 OpenClaw 的 Slack 连接器"
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
          "title": "总结此频道",
          "message": "总结此频道最近的活动。"
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
          **推荐配置**与 Slack 插件的完整功能集相匹配：App Home、斜杠命令、文件、表情回应、置顶、群组私信，以及表情符号/用户组读取。当工作区策略限制权限范围时，请选择**最小配置**——它涵盖私信、频道/群组历史记录、提及和斜杠命令，但不包含文件、表情回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。有关各权限范围的理由以及额外斜杠命令等增量选项，请参阅[清单和权限范围核对表](#manifest-and-scope-checklist)。
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

  <Tab title="HTTP 请求 URL">
    <Steps>
      <Step title="创建新的 Slack 应用">
        打开 [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → 选择你的工作区 → 粘贴下方任一清单 → 将 `https://gateway-host.example.com/slack/events` 替换为你的公共 Gateway 网关 URL → **Next** → **Create**。

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "用于 OpenClaw 的 Slack 连接器"
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
          "title": "总结此频道",
          "message": "总结此频道最近的活动。"
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
    "description": "用于 OpenClaw 的 Slack 连接器"
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
        { "title": "起草回复", "message": "帮我起草一份回复。" }
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
          **Recommended** 与 Slack 插件的完整功能集一致；**Minimal** 会为受限工作区移除文件、表情回应、置顶、群组私信（`mpim:*`）、`emoji:read` 和 `usergroups:read`。有关各权限范围的理由，请参阅[清单和权限范围检查表](#manifest-and-scope-checklist)。
        </Note>

        <Info>
          这三个 URL 字段（`slash_commands[].url`、`event_subscriptions.request_url` 以及 `interactivity.request_url` / `message_menu_options_url`）都指向同一个 OpenClaw 端点。Slack 的清单架构要求分别命名它们，但 OpenClaw 会按有效载荷类型进行路由，因此只需一个 `webhookPath`（默认为 `/slack/events`）。在 HTTP 模式下，缺少 `slash_commands[].url` 的斜杠命令会无提示地不执行任何操作。
        </Info>

        Slack 创建应用后：

        - **Basic Information → App Credentials**：复制用于请求验证的 **Signing Secret**。
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

        为每个账户指定不同的 `webhookPath`（默认为 `/slack/events`），以免注册发生冲突。
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

默认情况下，OpenClaw 将 Socket Mode 的 Slack SDK 客户端 pong 超时设置为 15 秒。仅在需要针对工作区或主机进行特定调优时才覆盖传输设置：

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

仅对记录 Slack websocket pong/服务器 ping 超时，或运行于存在已知事件循环饥饿问题的主机上的 Socket Mode 工作区使用此设置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍属于应用状态，而不是传输存活信号。

注意：

- 在 HTTP Request URL 模式下会忽略 `socketMode`。
- 除非被覆盖，否则基础 `channels.slack.socketMode` 设置适用于所有 Slack 账户。每账户覆盖使用 `channels.slack.accounts.<accountId>.socketMode`；由于这是对象覆盖，请包含你希望用于该账户的每个 socket 调优字段。
- 只有 `clientPingTimeout` 具有 OpenClaw 默认值（`15000`）。仅在配置后，`serverPingTimeout` 和 `pingPongLoggingEnabled` 才会传递给 Slack SDK。
- Socket Mode 重启退避从大约 2 秒开始，上限约为 30 秒。可恢复的启动、等待启动和断开连接失败会持续重试，直至渠道停止。无效身份验证、令牌被撤销或缺少权限范围等永久性账户和凭据错误会快速失败，而不是无限重试。

## 清单和权限范围检查表

Socket Mode 和 HTTP Request URL 使用相同的基础 Slack 应用清单。只有 `settings` 块（以及斜杠命令的 `url`）不同。

基础清单（默认 Socket Mode）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "用于 OpenClaw 的 Slack 连接器"
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
        { "title": "起草回复", "message": "帮我起草一份回复。" }
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

对于 **HTTP Request URL 模式**，请将 `settings` 替换为 HTTP 变体，并为每个斜杠命令添加 `url`。需要公共 URL：

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

提供扩展上述默认设置的不同功能。

默认清单会启用 Slack App Home 的 **Home** 标签页，并订阅 `app_home_opened`。当工作区成员打开 Home 标签页时，OpenClaw 会通过 `views.publish` 发布安全的默认 Home 视图；其中不包含会话有效载荷或私有配置。启用单斜杠命令模式后，命令提示会使用 `channels.slack.slashCommand.name`；使用原生命令或不使用斜杠命令的安装不会显示该提示。**Messages** 标签页会继续为 Slack 私信启用。清单还会通过 `features.assistant_view`、`assistant:write`、`assistant_thread_started` 和 `assistant_thread_context_changed` 启用 Slack 助手线程；助手线程会路由到各自独立的 OpenClaw 线程会话，并使智能体可以继续使用 Slack 提供的线程上下文。

<AccordionGroup>
  <Accordion title="可选的原生斜杠命令">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)代替单个已配置命令，但需注意：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令已被保留。
    - 一个 Slack 应用一次最多只能注册 25 个斜杠命令（Slack 平台限制）。

    请将现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)的一个子集：

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
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
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
      "description": "显示或设置 exec 默认值",
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
      "description": "显示简短帮助摘要"
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
      "description": "列出当前会话中正在运行/最近运行的后台任务"
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
      "description": "在不更改会话上下文的情况下询问旁支问题",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "在不更改会话上下文的情况下询问旁支问题",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "控制用量页脚或显示成本摘要",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP 请求 URL">
        使用与上方 Socket 模式相同的 `slash_commands` 列表，并为每个条目添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

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
      "description": "显示简短帮助摘要",
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
    如果你希望出站消息使用活跃智能体身份（自定义用户名和图标），而不是默认的 Slack 应用身份，请添加 `chat:write.customize` 机器人权限范围。

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
    - `search:read`（如果你依赖 Slack 搜索读取）

  </Accordion>
</AccordionGroup>

## 令牌模型

- Socket 模式需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- 中继模式需要 `botToken` 以及 `relay.url`、`relay.authToken` 和 `relay.gatewayId`；它不使用应用令牌或签名密钥。
- `botToken`、`appToken`、`signingSecret`、`relay.authToken` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- 配置中的令牌会覆盖环境变量回退值。
- `SLACK_BOT_TOKEN`、`SLACK_APP_TOKEN` 和 `SLACK_USER_TOKEN` 环境变量回退分别仅适用于默认账户。
- `userToken` 默认为只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查会跟踪每种凭据的 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账户已通过 SecretRef
  或其他非内联密钥来源配置，但当前命令/运行时路径
  无法解析实际值。
- 在 HTTP 模式下会包含 `signingSecretStatus`；在 Socket 模式下，
  必需的组合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍优先使用机器人令牌；仅当 `userTokenReadOnly: false` 且机器人令牌不可用时，才允许使用用户令牌写入。
</Tip>

## 操作和控制门

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组         | 默认值 |
| ---------- | ------- |
| messages   | 启用 |
| reactions  | 启用 |
| pins       | 启用 |
| memberInfo | 启用 |
| emojiList  | 启用 |

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
    - `dm.groupChannels`（可选 MPIM 允许列表）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在自身未设置 `allowFrom` 时继承 `channels.slack.allowFrom`。
    - 命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    为保持兼容性，仍会读取旧版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom`。当可以在不更改访问权限的情况下进行迁移时，`openclaw doctor --fix` 会将它们迁移到 `dmPolicy` 和 `allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，并且配置键**必须使用稳定的 Slack 渠道 ID**（例如 `C12345678`）。

    运行时注意事项：如果完全缺少 `channels.slack`（仅使用环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 当令牌访问权限允许时，渠道允许列表条目和私信允许列表条目会在启动时解析
    - 未解析的渠道名称条目会按配置保留，但默认在路由时忽略
    - 入站授权和渠道路由默认优先使用 ID；直接匹配用户名/slug 需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    在 `groupPolicy: "allowlist"` 下，基于名称的键（`#channel-name` 或 `channel-name`）**不会**匹配。渠道查找默认优先使用 ID，因此基于名称的键永远无法成功路由，该渠道中的所有消息都会被静默阻止。这与 `groupPolicy: "open"` 不同；在后者中，路由不需要渠道键，因此基于名称的键看起来似乎有效。

    始终使用 Slack 渠道 ID 作为键。查找方法：在 Slack 中右键单击渠道 → **Copy link** — ID（`C...`）会显示在 URL 末尾。

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
    渠道消息默认受提及控制。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 当机器人用户是相应用户组成员时，使用 Slack 用户组提及（`<!subteam^S...>`）；需要 `usergroups:read`
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式的回复机器人线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每渠道控制项（`channels.slack.channels.<id>`；名称仅可通过启动时解析或 `dangerouslyAllowNameMatching` 使用）：

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

    `ignoreOtherMentions`（默认为 `false`）会丢弃提及其他用户或用户组但未提及此机器人的渠道消息。私信和群组私信（MPIM）不受影响。该过滤器需要从 `auth.test` 获取已解析的机器人用户 ID；如果该身份不可用（例如仅使用用户令牌的身份），控制门会以开放方式失败，消息将不经更改直接通过。

    `allowBots` 对渠道和私有渠道采用保守策略：仅当发送消息的机器人明确列在相应房间的 `users` 允许列表中，或 `channels.slack.allowFrom` 中至少有一个明确的 Slack 所有者 ID 当前是房间成员时，才接受机器人发送的房间消息。通配符和显示名称形式的所有者条目不能满足所有者在场条件。所有者在场检查使用 Slack `conversations.members`；请确保应用拥有与房间类型对应的读取权限范围（公共渠道使用 `channels:read`，私有渠道使用 `groups:read`）。如果成员查询失败，OpenClaw 会丢弃机器人发送的房间消息。

    接受由机器人发送的 Slack 消息时，会使用共享的[机器人循环保护](/zh-CN/channels/bot-loop-protection)。通过 `channels.defaults.botLoopProtection` 配置默认预算；如果某个工作区或渠道需要不同的限制，可使用 `channels.slack.botLoopProtection` 或 `channels.slack.channels.<id>.botLoopProtection` 覆盖。

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- Slack 路由绑定接受原始对等方 ID，以及 `channel:C12345678`、`user:U12345678` 和 `<@U12345678>` 等 Slack 目标格式。
- 使用默认的 `session.dmScope=main` 时，Slack 私信会归并到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 普通的顶层渠道消息会保留在每个渠道各自的会话中，即使 `replyToMode` 不是 `off`。
- Slack 线程回复使用父级 Slack `thread_ts` 作为会话后缀（`:thread:<threadTs>`），即使通过 `replyToMode="off"` 禁用了出站回复线程化。
- 当符合条件的顶层渠道根消息预计会启动一个可见的 Slack 线程时，OpenClaw 会将该根消息植入 `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`，使根消息和之后的线程回复共享同一个 OpenClaw 会话。这适用于 `app_mention` 事件、显式机器人提及或与已配置提及模式匹配的消息，以及 `requireMention: false` 且 `replyToMode` 非 `off` 的渠道。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：设为 `true` 时，会抑制隐式线程提及，因此即使机器人已参与该线程，也只会响应线程内显式的 `@bot` 提及。不设置此项时，机器人已参与的线程中的回复会绕过 `requireMention` 门控。

回复线程化控制项：

- `channels.slack.channels.<id>.replyToMode`：针对 Slack 渠道/私有渠道消息的每渠道覆盖配置
- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 配置
- 直接聊天的旧版回退配置：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

要通过 `message` 工具显式回复 Slack 线程，请将 `replyBroadcast: true` 与 `action: "send"` 以及 `threadId` 或 `replyTo` 一起设置，请求 Slack 同时将该线程回复广播到父渠道。这会映射到 Slack 的 `chat.postMessage` `reply_broadcast` 标志，并且仅支持文本或 Block Kit 发送，不支持媒体上传。

当 `message` 工具调用在 Slack 线程内运行并以同一渠道为目标时，OpenClaw 通常会根据有效的账号、聊天类型或每渠道 `replyToMode` 继承当前 Slack 线程。自动回复以及发往同一渠道的 `send` 或 `upload-file` 调用使用相同的每渠道覆盖配置。在 `action: "send"` 或 `action: "upload-file"` 中设置 `topLevel: true`，可强制改为发送新的父渠道消息。也可使用 `threadId: null` 表示同样的顶层退出选项。

<Note>
`replyToMode="off"` 会禁用 Slack 出站回复线程化，包括显式 `[[reply_to_*]]` 标签。它不会展平入站 Slack 线程会话：已发布在 Slack 线程内的消息仍会路由到 `:thread:<threadTs>` 会话。这与 Telegram 不同；在 Telegram 中，即使处于 `"off"` 模式，显式标签仍会生效。Slack 线程会对渠道隐藏消息，而 Telegram 回复仍以内联方式保持可见。
</Note>

## 确认表情回应

OpenClaw 处理入站消息时，`ackReaction` 会发送一个确认表情符号。`ackReactionScope` 决定该表情符号实际在_何时_发送。

默认情况下，确认表情保持不变，而 Slack 原生助理线程状态会通过轮换的加载消息显示进度。设置 `messages.statusReactions.enabled: true` 可选择启用已排队/思考中/工具/完成/错误的表情回应生命周期。

### 表情符号（`ackReaction`）

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情符号回退值（`agents.list[].identity.emoji`，否则为 `"eyes"` / 👀）

注意：

- Slack 要求使用短代码（例如 `"eyes"`）。
- 使用 `""` 可针对 Slack 账号或全局禁用该表情回应。

### 范围（`messages.ackReactionScope`）

Slack provider 从 `messages.ackReactionScope` 读取范围（默认 `"group-mentions"`）。目前没有 Slack 账号级或 Slack 渠道级覆盖配置；该值对 Gateway 网关全局生效。

可选值：

- `"all"`：在私信和群组中添加表情回应，包括环境房间事件。
- `"direct"`：仅在私信中添加表情回应。
- `"group-all"`：对除环境房间事件之外的每条群组消息添加表情回应（不包括私信）。
- `"group-mentions"`（默认）：在群组中添加表情回应，但仅限机器人被提及的情况（或在已选择启用的群组可提及对象中）。**不包括私信。**
- `"off"` / `"none"`：从不添加表情回应。

<Note>
默认范围（`"group-mentions"`）不会在私信或环境房间事件中触发确认表情回应。要在入站 Slack 私信和安静的房间事件中看到已配置的 `ackReaction`（例如 `"eyes"`），请将 `messages.ackReactionScope` 设为 `"all"`。Slack provider 启动时会读取 `messages.ackReactionScope`，因此需要重启 Gateway 网关才能使更改生效。
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
- `partial`（默认）：使用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：草稿预览处于活动状态时，将工具/进度更新路由到同一条经过编辑的预览消息中（默认：`true`）。设为 `false` 可保留独立的工具/进度消息。
- `streaming.preview.commandText` / `streaming.progress.commandText`：设为 `status` 可保留紧凑的工具进度行，同时隐藏原始命令/Exec 文本（默认：`raw`）。

隐藏原始命令/Exec 文本，同时保留紧凑的进度行：

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

Slack 原生进度任务卡需要在进度模式中选择启用。将 `channels.slack.streaming.progress.nativeTaskCards` 设为 `true`，并设置 `channels.slack.streaming.mode="progress"`，可在工作运行期间发送 Slack 原生计划/任务卡，并在完成时更新同一张任务卡。如果未设置此标志，进度模式会继续使用可移植的草稿预览行为。

- 必须存在可用的回复线程，原生文本流式传输和 Slack 助理线程状态才会显示。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用或不存在回复线程时，渠道、群聊和顶层私信根消息仍可使用普通草稿预览。
- 默认情况下，顶层 Slack 私信不在线程中，因此不会显示 Slack 线程样式的原生流式传输/状态预览；OpenClaw 会改为在私信中发布并编辑草稿预览。
- 媒体和非文本载荷会回退到普通投递。
- 媒体/错误最终结果会取消待处理的预览编辑；符合条件的文本/块最终结果仅在能够原地编辑预览时才会刷新。
- 如果流式传输在回复过程中失败，OpenClaw 会对剩余载荷回退到普通投递。

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
- 运行时不会读取旧版别名；运行 `openclaw doctor --fix`，将持久化的 Slack 流式传输配置重写为规范键。

## 输入状态表情回应回退

OpenClaw 处理回复时，`typingReaction` 会向入站 Slack 消息添加临时表情回应，并在运行结束时将其移除。这在线程回复之外最为有用，因为线程回复默认使用“正在输入……”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意：

- Slack 要求使用短代码（例如 `"hourglass_flowing_sand"`）。
- 该表情回应采用尽力而为的方式，回复或失败路径完成后会自动尝试清理。

## 语音输入

目前要在 Slack 中对 OpenClaw 说话，请向 OpenClaw 应用发送 Slack 音频片段。Slackbot 的听写麦克风是 Slack 自有的独立功能，不是应用 API。

- **[Slackbot 语音听写](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** 位于用户与 Slackbot 的私密对话中。Slack 会将录音转换为 Slackbot 提示词，但不会通过 Events API 向第三方 Slack 应用发出音频文件、听写事件、提示词或输入源标记。OpenClaw Slack 插件无法启用或接收该功能。
- **[Slack 音频片段](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** 是存储为 Slack 文件的内容，可以发布在 OpenClaw 私信、渠道或线程中。OpenClaw 使用机器人令牌下载可访问的片段，规范化 Slack 的片段 MIME 元数据，并将其发送到共享的[音频转写管道](/zh-CN/nodes/audio)。推荐的应用清单包含所需的 `files:read` 权限范围。

音频片段和 Slackbot 听写具有不同的隐私语义：片段遵循 Slack 文件保留策略，并由 OpenClaw 下载进行转写；而 Slack 表示听写音频不会被存储。

在 `requireMention: true` 的渠道中，无说明文字的音频片段可以通过说出已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）来通过门控。OpenClaw 会在下载或转写片段前授权发送者，然后仅在转写文本匹配时准入。失败或不匹配的推测性转写文本会与已下载的片段一起被丢弃，不会保留在渠道历史记录中。无法从语音中推断 Slack 原生 `@bot` 身份，因此请配置一个口述名称模式，或包含键入的提及。如果启用了转写文本回显，则仅在准入后发送回显。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    从 Slack 托管的私有 URL 下载 Slack 文件附件（使用令牌身份验证的请求流程）；当获取成功且符合大小限制时，会将其写入媒体存储。文件占位符包含 Slack `fileId`，以便智能体使用 `download-file` 获取原始文件。

    下载使用有界的空闲超时和总超时。如果 Slack 文件获取停滞或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认值为 `8000`，上限为 Slack 自身的消息长度限制）
    - `channels.slack.streaming.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 对于较长的文件说明文字，使用第一个符合 Slack 安全限制的文本分块作为上传注释，并将剩余分块作为后续消息发送
    - 配置后，出站媒体上限遵循 `channels.slack.mediaMaxMb`；否则，渠道发送使用媒体管道中按 MIME 类型设置的默认值

  </Accordion>

  <Accordion title="投递目标">
    建议使用以下显式目标：

    - 私信使用 `user:<id>`
    - 渠道使用 `channel:<id>`

    仅包含文本或块的 Slack 私信可以直接向用户 ID 发帖；文件上传和线程发送则会先通过 Slack 会话 API 打开私信，因为这些路径需要具体的会话 ID。

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

原生命令需要在你的 Slack 应用中配置[其他清单设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 启用，或者在全局配置中改用 `commands.native: true`。

- Slack 的原生命令自动模式为**关闭**状态，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单按优先级顺序呈现为以下形式之一：

- 3-5 个长度足够短的选项：溢出（“...”）菜单
- 超过 100 个选项，且支持异步选项筛选：外部选择菜单
- 1-2 个选项，或任一选项的编码值过长而无法用于选择菜单：按钮块
- 其他情况（6-100 个选项，或超过 100 个选项但不支持异步筛选）：静态选择菜单，每个菜单按 100 个选项分块

```txt
/think
```

斜杠命令会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，但仍使用 `CommandTargetSessionKey` 将命令执行路由到目标会话。

## 原生图表

Slack 的公开 [`data_visualization` Block Kit 块](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
可在消息中呈现折线图、柱状图、面积图和饼图。OpenClaw 将可移植
`presentation` `chart` 块映射为该原生结构；除常规的
`chat:write` 消息访问权限外，无需额外的 OAuth 权限范围、
文件上传、图像渲染器或 Slack 配置。

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "季度收入",
      "categories": ["第一季度", "第二季度"],
      "series": [{ "name": "收入", "values": [120, 145] }],
      "xLabel": "季度"
    }
  ]
}
```

原生呈现前会强制执行 Slack 的限制：

- 标题和可选坐标轴标签：50 个字符
- 饼图：1-12 个正值扇区
- 折线图/柱状图/面积图：1-12 个名称唯一的系列，以及 1-20 个共享类别
- 扇区、类别和系列标签：20 个字符
- 每个系列必须为每个类别包含一个有限值；非饼图的值
  可以为负数

每个原生图表还会携带顶层文本表示，供屏幕
阅读器、通知、会话镜像以及无法呈现该
块的客户端使用。发送到其他 OpenClaw 渠道的标准呈现内容也会以文本形式接收相同的
确定性图表数据，除非这些渠道声明支持原生图表。如果
Slack 在分阶段推出期间以 `invalid_blocks` 拒绝图表，OpenClaw
会移除被拒绝的原生数据块，保留所有同级控件，并将
完整的图表表示作为可见文本发送。

Slack 当前每条消息最多接受两个 `data_visualization` 块。当
呈现内容包含两个以上的有效图表时，OpenClaw 会保持其顺序，
并在后续消息中继续进行原生呈现，每条消息不超过两个
图表。

Slack 的[开发者发布公告](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
将该块记录为面向应用的 Block Kit 功能，并且未公布任何付费
套餐限制。Business+/Enterprise 资格说明适用于
Slackbot 的自动 AI 图表生成，这与应用发送
已经结构化的 Block Kit 图表是不同的功能。图表是仅限消息使用的块，不适用于 App
Home、模态框或 Canvas 内容。

## 原生表格

Slack 当前的 [`data_table` Block Kit 块](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
可在消息中呈现结构化的行和列。OpenClaw 会将显式的可移植
`presentation` `table` 块映射到 `data_table`；它不会使用 Slack 的
旧版 [`table` 块](https://docs.slack.dev/reference/block-kit/blocks/table-block/)。
除正常的 `chat:write` 消息访问权限外，无需额外的 OAuth 权限范围或 Slack 配置。

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Open pipeline",
      "headers": ["Account", "Stage", "ARR"],
      "rows": [
        ["Acme", "Won", 125000],
        ["Globex", "Review", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw 会将表头和字符串单元格映射到 Slack `raw_text` 单元格。数字单元格
会映射到 `raw_number`，并保留有限数值，以支持原生排序
和筛选。`rowHeaderColumnIndex`（如果存在）会将该从零开始计数的
列标记为 Slack 行表头。

在原生呈现之前，会强制执行 Slack 已发布的 `data_table` 限制：

- 1-20 列
- 1-100 个数据行，外加表头行
- 每一行的单元格数量相同
- 一条消息中所有表格单元格的字符总数最多为 10,000

只要消息仍处于字符总数限制内，多个有效的表格块就可以原生呈现。
无法在原生限制范围内呈现的表格会转换为完整且确定性的文本，而不会丢失行或
单元格。如果该文本超出一条 Slack 消息的容量，发送和斜杠命令响应会使用
按顺序排列的文本分块。表格编辑会返回明确的大小错误，而不会
静默截断现有消息中的行。

从可移植呈现生成的每个原生表格还会携带顶层
文本表示，供屏幕阅读器、通知、会话镜像以及
无法呈现该块的客户端使用。原始图表和表格值在回退文本中保持字面形式，
因此 `<@U123>` 等单元格数据不会变成 Slack 提及。
如果 Slack 以 `invalid_blocks` 拒绝原生图表或表格块，OpenClaw
会在一次有界恢复步骤中移除所有原生数据块，保留
按钮和选择器等有效的同级块，并在禁用 Slack 格式的情况下发送完整可见的图表
和表格文本。斜杠命令投递会在整个命令期间跟踪 Slack 的五次调用
`response_url` 预算。在每批回复之前，它会选择一个
适合剩余调用次数的完整方案，否则会在发布该批次前失败。

只有显式的 `presentation` 表格块会提升为原生表格。
Markdown 管道表格仍保留为创作时的文本；OpenClaw 不会猜测表格
结构或单元格类型。现有受信任的 Slack 原生内容生成器可以继续
通过 `channelData.slack.blocks` 传递原始块；OpenClaw 会从有效的原始
`data_table` 单元格派生回退文本，而格式错误的自定义块可能
降级为其标题或通用 Block Kit 回退内容。可移植的智能体、CLI
和插件输出应使用 `presentation`。

## 交互式回复

Slack 可以呈现由智能体创作的交互式回复控件，但此功能默认禁用。
对于新的智能体、CLI 和插件输出，优先使用共享的
`presentation` 按钮或选择块。它们使用相同的 Slack 交互
路径，同时也能在其他渠道上降级。

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

这些指令会编译为 Slack Block Kit，并通过现有的 Slack 交互事件路径
将点击或选择路由回来。保留它们以兼容旧提示词和 Slack 专用的应急入口；新的
可移植控件应使用共享呈现。

对于新的内容生成器代码，指令编译器 API 也已弃用：

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

对于新的 Slack 呈现控件，请使用 `presentation` 载荷和
`buildSlackPresentationBlocks(...)`。

注意：

- 这是 Slack 专用的旧版 UI。其他渠道不会将 Slack Block
  Kit 指令转换为各自的按钮系统。
- 交互回调值是由 OpenClaw 生成的不透明令牌，而不是智能体创作的原始值。
- 如果生成的交互块会超出 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不会发送无效的块载荷。

### 插件所有的模态框提交

注册了交互处理程序的 Slack 插件还可以在 OpenClaw 为
智能体可见的系统事件压缩载荷之前，接收模态框
`view_submission` 和 `view_closed` 生命周期事件。打开 Slack 模态框时，
请使用以下任一路由模式：

- 将 `callback_id` 设置为 `openclaw:<namespace>:<payload>`。
- 或保留现有的 `callback_id`，并在模态框 `private_metadata` 中放入 `pluginInteractiveData:
"<namespace>:<payload>"`。

处理程序接收的 `ctx.interaction.kind` 为 `view_submission` 或
`view_closed`，同时还会接收规范化的 `inputs` 以及来自
Slack 的完整原始 `stateValues` 对象。仅使用回调 ID 路由就足以调用插件处理程序；如果
模态框还应生成智能体可见的系统事件，请包含现有模态框
`private_metadata` 中的用户/会话路由字段。智能体会收到一条
经过压缩和脱敏的 `Slack interaction: ...` 系统事件。如果处理程序返回
`systemEvent.summary`、`systemEvent.reference` 或 `systemEvent.data`，这些
字段会包含在该压缩事件中，使智能体可以引用
插件所有的存储，而无需看到完整的表单载荷。

## Slack 中的原生审批

Slack 可以通过交互式按钮和交互充当原生审批客户端，而不是回退到 Web UI 或终端。

- Exec 和插件审批可以呈现为 Slack 原生 Block Kit 提示。
- `channels.slack.execApprovals.*` 仍是原生 Exec 审批客户端的启用与私信/渠道路由配置。
- Exec 审批私信使用 `channels.slack.execApprovals.approvers` 或 `commands.ownerAllowFrom`。
- 当 Slack 被启用为发起会话的原生审批客户端，或者 `approvals.plugin` 路由到发起请求的 Slack 会话或某个 Slack 目标时，插件审批会使用 Slack 原生按钮。
- 插件审批私信使用来自 `channels.slack.allowFrom`、命名账户 `allowFrom` 或账户默认路由的 Slack 插件审批者。
- 仍会强制执行审批者授权：仅具备 Exec 审批权限的审批者无法批准插件请求，除非他们同时也是插件审批者。

此功能与其他渠道使用相同的共享审批按钮界面。在 Slack 应用设置中启用 `interactivity` 后，审批提示会直接在对话中呈现为 Block Kit 按钮。
当这些按钮存在时，它们是主要的审批交互方式；仅当工具结果表明聊天审批不可用或手动审批是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
- `agentFilter`、`sessionFilter`

当未设置 `enabled` 或其值为 `"auto"`，且至少能解析出一名
Exec 审批者时，Slack 会自动启用原生 Exec 审批。当能解析出 Slack 插件审批者，且请求与原生客户端过滤器匹配时，Slack 还可以通过此原生客户端
路径处理原生插件审批。设置
`enabled: false` 可明确禁止 Slack 作为原生审批客户端。设置 `enabled: true` 可在能解析出审批者时
强制启用原生审批。禁用 Slack Exec 审批不会禁用
通过 `approvals.plugin` 启用的原生 Slack 插件审批投递；插件审批
投递改用 Slack 插件审批者。

未显式配置 Slack Exec 审批时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

仅当你要覆盖审批者、添加过滤器或
选择启用来源聊天投递时，才需要显式配置 Slack 原生设置：

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

共享 `approvals.exec` 转发是独立机制。仅当 Exec 审批提示还必须
路由到其他聊天或明确的带外目标时才使用它。共享 `approvals.plugin` 转发也是
独立机制；仅当 Slack 能以原生方式处理插件审批请求时，Slack 原生投递才会抑制该回退机制。

同一聊天中的 `/approve` 也适用于已经支持命令的 Slack 频道和私信。有关完整的审批转发模型，请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“Also send to channel”线程回复）会作为普通用户消息处理。
- 添加/移除表情回应事件会映射为系统事件。
- 成员加入/离开、频道创建/重命名以及添加/移除置顶事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移频道配置键。
- 频道主题/用途元数据被视为不可信上下文，并可注入路由上下文。
- 适用时，线程起始消息和初始线程历史上下文的植入会按已配置的发送者允许列表进行过滤。
- 块操作、快捷方式和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，其中包含丰富的载荷字段：
  - 块操作：选定值、标签、选择器值和 `workflow_*` 元数据
  - 全局快捷方式：回调和操作者元数据，路由到操作者的直接会话
  - 消息快捷方式：回调、操作者、频道、线程和所选消息上下文
  - 模态 `view_submission` 和 `view_closed` 事件，包含已路由的频道元数据和表单输入

在 Slack 应用配置中定义全局或消息快捷方式，并使用任意非空回调 ID。OpenClaw 会确认匹配的快捷方式载荷，应用与其他 Slack 交互相同的私信/频道发送者策略，并将净化后的事件排入已路由 Agent 会话的队列。触发器 ID 和响应 URL 会从 Agent 上下文中隐去。

## 配置参考

主要参考：[Configuration reference - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="重要的 Slack 字段">

- 模式/身份验证：`mode`、`enterpriseOrgInstall`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急绕过开关；除非必要，否则保持关闭）
- 频道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程/历史记录：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`streaming.chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 展开预览：`unfurlLinks`（默认值：`false`）、用于控制 `chat.postMessage` 链接/媒体预览的 `unfurlMedia`；设置 `unfurlLinks: true` 可重新启用链接预览
- 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排查

<AccordionGroup>
  <Accordion title="频道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 频道允许列表（`channels.slack.channels`）— **键必须是频道 ID**（`C12345678`），不能是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为频道路由默认优先使用 ID。查找 ID：在 Slack 中右键单击频道 → **Copy link** — URL 末尾的 `C...` 值即为频道 ID。
    - `requireMention`
    - 每频道 `users` 允许列表
    - `messages.groupChat.visibleReplies`：普通群组/频道请求的默认值为 `"automatic"`。如果你选择启用了 `"message_tool"`，且日志显示智能体文本，但没有 `message(action=send)` 调用，则说明模型遗漏了可见消息工具路径。在此模式下，最终文本会保持私密；请检查 Gateway 网关详细日志中的已抑制载荷元数据，或者，如果你希望通过旧版路径发布每条普通智能体最终回复，请将其设置为 `"automatic"`。
    - `messages.groupChat.unmentionedInbound`：如果值为 `"room_event"`，则未提及智能体但已获准的频道闲聊将作为环境上下文，并保持静默，除非智能体调用 `message` 工具。请参阅[环境房间事件](/zh-CN/channels/ambient-room-events)。

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
    - 配对审批/允许列表条目（`dmPolicy: "open"` 仍要求设置 `channels.slack.allowFrom: ["*"]`）
    - 群组私信使用 MPIM 处理；请启用 `channels.slack.dm.groupEnabled`，并在配置了 `channels.slack.dm.groupChannels` 时将该 MPIM 包含在其中
    - Slack Assistant 私信事件：详细日志中出现 `drop message_changed`
      通常表示 Slack 发送了已编辑的 Assistant 线程事件，但消息元数据中
      没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式无法连接">
    验证 Slack 应用设置中的 Bot + App 令牌以及 Socket Mode 是否已启用。
    App-Level Token 需要 `connections:write`，且 Bot User OAuth Token
    的 Bot 令牌必须与 App 令牌属于同一个 Slack 应用/工作区。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则表示 Slack 账户已
    配置，但当前运行时无法解析由 SecretRef 支持的
    值。

    `slack socket mode failed to start; retry ...` 等日志表示可恢复的
    启动失败。缺少权限范围、令牌被撤销和无效身份验证则会快速失败。
    `slack token mismatch ...` 日志表示 Bot 令牌和 App 令牌
    似乎属于不同的 Slack 应用；请修正 Slack 应用凭据。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - 签名密钥
    - Webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户使用唯一的 `webhookPath`
    - 公共 URL 终止 TLS，并将请求转发到 Gateway 网关路径
    - Slack 应用的 `request_url` 路径与 `channels.slack.webhookPath` 完全匹配（默认值为 `/slack/events`）

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    则表示 HTTP 账户已配置，但当前运行时无法
    解析由 SecretRef 支持的签名密钥。

    重复出现 `slack: webhook path ... already registered` 日志表示两个 HTTP
    账户正在使用相同的 `webhookPath`；请为每个账户设置不同的路径。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    确认你预期使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册了匹配的斜杠命令
    - 或单斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    Slack 不会自动创建或删除斜杠命令。`commands.native: "auto"` 不会启用 Slack 原生命令；请使用 `true`，并在 Slack 应用中创建匹配的命令。在 HTTP 模式下，每条 Slack 斜杠命令都必须包含 Gateway 网关 URL。在 Socket Mode 下，命令载荷通过 WebSocket 到达，Slack 会忽略 `slash_commands[].url`。

    还应检查 `commands.useAccessGroups`、私信授权、频道允许列表
    以及每频道 `users` 允许列表。对于被阻止的斜杠命令发送者，Slack 会返回
    仅对其可见的错误，包括：

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## 附件媒体参考

当 Slack 文件下载成功且大小限制允许时，Slack 可以将下载的媒体附加到智能体轮次。音频片段可以转写，图像文件可以通过媒体理解路径处理或直接发送给支持视觉的回复模型，其他文件则仍可作为可下载的文件上下文使用。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 说明                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack 音频片段                 | Slack 文件 URL       | 下载并通过共享音频转写流程路由                                                    | 需要 `files:read` 和可正常工作的 `tools.media.audio` 模型或 CLI           |
| JPEG / PNG / GIF / WebP 图像   | Slack 文件 URL       | 下载并附加到轮次，以便进行支持视觉的处理                                          | 每文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                      |
| PDF 文件                       | Slack 文件 URL       | 下载并公开为文件上下文，供 `download-file` 或 `pdf` 等工具使用                    | Slack 入站流程不会自动将 PDF 转换为图像视觉输入                            |
| 其他文件                       | Slack 文件 URL       | 尽可能下载并公开为文件上下文                                                      | 二进制文件不会被视为图像输入                                              |
| 线程回复                       | 线程起始消息中的文件 | 当回复本身没有直接媒体时，可以将根消息中的文件载入为上下文                        | 仅含文件的起始消息使用附件占位符                                          |
| 多文件消息                     | 多个 Slack 文件      | 独立评估每个文件                                                                  | Slack 处理上限为每条消息八个文件                                          |

### 入站管道

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用 Bot 令牌从 Slack 的私有 URL 下载文件。
2. 下载成功后，文件会写入媒体存储。
3. 下载的媒体路径和内容类型会添加到入站上下文中。
4. 音频片段会路由到共享转写管线；支持图像的模型/工具路径可使用同一上下文中的图像附件。
5. 其他文件仍以文件元数据或媒体引用的形式提供给能够处理它们的工具。

### 线程根消息附件继承

当消息到达某个线程时（具有 `thread_ts` 父消息）：

- 如果回复本身没有直接媒体，而包含的根消息具有文件，Slack 可以补充根消息文件，将其作为线程起始上下文。
- 仅在为新建或重置的线程会话植入上下文时补充根消息文件。之后的纯文本回复会复用现有会话上下文，不会将根消息文件作为新媒体重新附加。
- 直接回复附件优先于根消息附件。
- 如果根消息只有文件而没有文本，则会使用附件占位符表示，以便回退机制仍可包含其文件。

### 多附件处理

当一条 Slack 消息包含多个文件附件时：

- 每个附件都会通过媒体管线独立处理。
- 下载的媒体引用会汇总到消息上下文中。
- 处理顺序遵循事件载荷中的 Slack 文件顺序。
- 一个附件下载失败不会阻塞其他附件。

### 大小、下载和模型限制

- **大小上限**：默认每个文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **音频转写上限**：当下载的文件发送给转写提供商或 CLI 时，`tools.media.audio.maxBytes` 同样适用。
- **下载失败**：Slack 无法提供的文件、URL 已过期的文件、无法访问的文件、超大文件以及 Slack 身份验证/登录 HTML 响应会被跳过，而不会报告为不支持的格式。
- **视觉模型**：当当前回复模型支持视觉时，图像分析会使用该模型；否则使用在 `agents.defaults.imageModel` 中配置的图像模型。

### 已知限制

| 场景                                      | 当前行为                                                                   | 解决方法                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Slack 文件 URL 已过期                        | 跳过文件；不显示错误                                                       | 在 Slack 中重新上传文件                                                   |
| 音频转写不可用               | 片段仍保持附加状态，但不会生成转写文本                                | 配置 `tools.media.audio` 或安装受支持的本地转写 CLI  |
| 无说明文字的片段未通过提及门控 | 在私有推测性转写后丢弃；转写文本和下载内容均被删除 | 配置口述名称提及模式、添加键入的 Bot 提及或使用私信 |
| 未配置视觉模型                   | 图像附件存储为媒体引用，但不会作为图像进行分析       | 配置 `agents.defaults.imageModel` 或使用支持视觉的回复模型    |
| 非常大的图像（默认 > 20 MB）        | 按大小上限跳过                                                               | 如果 Slack 允许，请增大 `channels.slack.mediaMaxMb`                          |
| 转发/共享的附件                  | 尽力处理文本以及 Slack 托管的图像/文件媒体                             | 直接在 OpenClaw 线程中重新共享                                      |
| PDF 附件                               | 存储为文件/媒体上下文，不会自动路由到图像视觉处理        | 使用 `download-file` 获取文件元数据，或使用 `pdf` 工具分析 PDF      |

### 相关文档

- [媒体理解管线](/zh-CN/nodes/media-understanding)
- [音频和语音留言](/zh-CN/nodes/audio)
- [PDF 工具](/zh-CN/tools/pdf)

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Slack 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    频道和群组私信的行为。
  </Card>
  <Card title="频道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和安全加固。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

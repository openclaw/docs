---
read_when:
    - 设置 Slack 或调试 Slack Socket/HTTP 模式
summary: Slack 设置与运行时行为（Socket Mode + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-04-22T17:02:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1609ab5570daac455005cb00cee578c8954e05b25c25bf5759ae032d2a12c2c
    source_path: channels/slack.md
    workflow: 15
---

# Slack

状态：已可用于通过 Slack 应用集成实现私信 + 渠道，达到生产就绪。默认模式为 Socket Mode；也支持 HTTP 请求 URL。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复操作手册。
  </Card>
</CardGroup>

## 快速开始

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack 应用">
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴下方的[示例清单](#manifest-and-scope-checklist)，然后继续创建
        - 生成一个带有 `connections:write` 权限的 **App-Level Token**（`xapp-...`）
        - 安装应用，并复制显示的 **Bot Token**（`xoxb-...`）
      </Step>

      <Step title="配置 OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
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

  <Tab title="HTTP 请求 URL">
    <Steps>
      <Step title="创建新的 Slack 应用">
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴[示例清单](#manifest-and-scope-checklist)，并在创建前更新 URL
        - 保存用于请求校验的 **Signing Secret**
        - 安装应用，并复制显示的 **Bot Token**（`xoxb-...`）

      </Step>

      <Step title="配置 OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        对多账户 HTTP 使用唯一的 webhook 路径

        为每个账户提供不同的 `webhookPath`（默认为 `/slack/events`），以避免注册冲突。
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

## 清单与 scope 检查清单

<Tabs>
  <Tab title="Socket Mode（默认）">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "用于 OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

  </Tab>

  <Tab title="HTTP 请求 URL">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "用于 OpenClaw 的 Slack 连接器"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
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
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
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

  </Tab>
</Tabs>

### 其他清单设置

显示可扩展上述默认值的不同功能。

<AccordionGroup>
  <Accordion title="可选的原生斜杠命令">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)来替代单个已配置命令，但有一些细节需要注意：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令已被保留。
    - 同时可用的斜杠命令不能超过 25 个。

    将你现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)中的一个子集：

    <Tabs>
      <Tab title="Socket Mode（默认）">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "开始一个新会话",
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
        "description": "管理线程绑定过期时间",
        "usage_hint": "idle <duration|off> 或 max-age <duration|off>"
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
        "description": "切换推理可见性",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "切换 elevated 模式",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "显示或设置 exec 默认值",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "显示或设置模型",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "列出提供商/模型或添加模型",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
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
        "description": "显示当前智能体此刻可以使用什么",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "显示运行时状态，包括可用时的提供商使用量/配额"
      },
      {
        "command": "/tasks",
        "description": "列出当前会话的活动/近期后台任务"
      },
      {
        "command": "/context",
        "description": "解释上下文是如何组装的",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "显示你的发送者身份"
      },
      {
        "command": "/skill",
        "description": "按名称运行一个 skill",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "在不更改会话上下文的情况下提出一个旁支问题",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "控制 usage 页脚或显示成本摘要",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP 请求 URL">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "开始一个新会话",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "重置当前会话",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "压缩会话上下文",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "停止当前运行",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "管理线程绑定过期时间",
        "usage_hint": "idle <duration|off> 或 max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "设置思考级别",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "切换详细输出",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "显示或设置快速模式",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "切换推理可见性",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "切换 elevated 模式",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "显示或设置 exec 默认值",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "显示或设置模型",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "列出提供商，或列出某个提供商的模型",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "显示简短帮助摘要",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "显示生成的命令目录",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "显示当前智能体此刻可以使用什么",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "显示运行时状态，包括可用时的提供商使用量/配额",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "列出当前会话的活动/近期后台任务",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "解释上下文是如何组装的",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "显示你的发送者身份",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "按名称运行一个 skill",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "在不更改会话上下文的情况下提出一个旁支问题",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "控制 usage 页脚或显示成本摘要",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="可选作者身份 scope（写入操作）">
    如果你希望发送消息时使用当前智能体身份（自定义用户名和图标），而不是默认的 Slack 应用身份，请添加 `chat:write.customize` bot scope。

    如果你使用 emoji 图标，Slack 要求采用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户令牌 scope（读取操作）">
    如果你配置了 `channels.slack.userToken`，典型的读取 scope 包括：

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
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 支持明文
  字符串或 SecretRef 对象。
- 配置中的令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持配置方式（无环境变量回退），且默认是只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查会跟踪每个凭证对应的 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态可以是 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账户通过 SecretRef
  或其他非内联 secret 来源进行了配置，但当前命令/运行时路径
  无法解析出实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，
  必需的状态对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，如果已配置，可以优先使用用户令牌。对于写入操作，仍然优先使用 bot 令牌；只有当 `userTokenReadOnly: false` 且 bot 令牌不可用时，才允许使用用户令牌写入。
</Tip>

## 操作与门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中的可用操作组：

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。

## 访问控制与路由

<Tabs>
  <Tab title="私信策略">
    `channels.slack.dmPolicy` 控制私信访问（旧版：`channels.slack.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`；旧版：`channels.slack.dm.allowFrom`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认为 true）
    - `channels.slack.allowFrom`（推荐）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认为 false）
    - `dm.groupChannels`（可选 MPIM allowlist）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 已命名账户在自身 `allowFrom` 未设置时，会继承 `channels.slack.allowFrom`。
    - 已命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    在私信中进行配对时，使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道 allowlist 位于 `channels.slack.channels` 下，应使用稳定的渠道 ID。

    运行时说明：如果 `channels.slack` 完全缺失（仅环境变量设置），运行时会回退为 `groupPolicy="allowlist"` 并记录一条警告（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

    名称/ID 解析：

    - 当令牌访问权限允许时，渠道 allowlist 条目和私信 allowlist 条目会在启动时解析
    - 无法解析的渠道名称条目会按配置保留，但默认在路由中被忽略
    - 入站授权和渠道路由默认优先按 ID 处理；如果要直接匹配用户名/slug，需要设置 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及与渠道用户">
    默认情况下，渠道消息受提及门控限制。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复给 bot 的线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每个渠道的控制项（`channels.slack.channels.<id>`；仅能通过启动时解析或 `dangerouslyAllowNameMatching` 使用名称）：

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍然只会映射到 `id:`）

  </Tab>
</Tabs>

## 线程、会话与回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信会合并到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 在线程适用时，线程回复可以创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时要抓取多少条现有线程消息（默认 `20`；设置为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当设为 `true` 时，会抑制隐式线程提及，因此 bot 仅会响应线程内显式的 `@bot` 提及，即使 bot 已经参与该线程也是如此。如果不这样设置，在 bot 已参与的线程中回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 直聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 会禁用 Slack 中**所有**回复线程功能，包括显式的 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中，显式标签在 `"off"` 模式下仍会生效。这种差异反映了平台的线程模型：Slack 线程会将消息隐藏在渠道之外，而 Telegram 回复仍会显示在主聊天流中。

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息期间发送一个确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

说明：

- Slack 要求使用短代码（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账户或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块的预览更新。
- `progress`：在生成期间显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于激活状态时，将工具/进度更新路由到同一条被编辑的预览消息中（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认：`true`）。

- 原生文本流式传输和 Slack assistant 线程状态显示都必须有可用的回复线程。线程选择仍然遵循 `replyToMode`。
- 当原生流式传输不可用时，渠道和群聊根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持在线程外，因此不会显示线程样式预览；如果你希望那里有可见进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本载荷会回退为常规投递。
- 媒体/错误最终消息会取消待处理的预览编辑，而不会刷新临时草稿；符合条件的文本/块最终消息仅会在能够原地编辑预览时刷新。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余载荷回退为常规投递。

使用草稿预览代替 Slack 原生文本流式传输：

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

`typingReaction` 会在 OpenClaw 处理回复期间，给入站 Slack 消息添加一个临时反应，并在运行结束后移除。它在线程回复之外最有用，因为线程回复默认使用 “is typing...” 状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 要求使用短代码（例如 `"hourglass_flowing_sand"`）。
- 该反应采用尽力而为的方式，回复完成或失败路径结束后会自动尝试清理。

## 媒体、分块与投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在获取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本与文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用优先按段落拆分
    - 文件发送使用 Slack 上传 API，并可包含线程回复（`thread_ts`）
    - 如果配置了 `channels.slack.mediaMaxMb`，出站媒体上限将遵循该值；否则渠道发送会使用媒体管道中的 MIME 类型默认值
  </Accordion>

  <Accordion title="投递目标">
    推荐的显式目标：

    - 私信使用 `user:<id>`
    - 渠道使用 `channel:<id>`

    发送到用户目标时，Slack 私信会通过 Slack 会话 API 打开。

  </Accordion>
</AccordionGroup>

## 命令与斜杠行为

Slack 中的斜杠命令可以显示为单个已配置命令，或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要你在 Slack 应用中配置[其他清单设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- 对于 Slack，原生命令自动模式默认是 **off**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在分发所选选项值之前先显示确认模态框：

- 最多 5 个选项：按钮块
- 6 - 100 个选项：静态选择菜单
- 超过 100 个选项：当交互式选项处理器可用时，使用带异步选项过滤的外部选择
- 超出 Slack 限制时：编码后的选项值会回退为按钮

```txt
/think
```

斜杠会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，但仍会通过 `CommandTargetSessionKey` 将命令执行路由到目标会话。

## 交互式回复

Slack 可以渲染由智能体创作的交互式回复控件，但此功能默认禁用。

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

启用后，智能体可以发出仅适用于 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有的 Slack 交互事件路径回传点击或选择。

说明：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令翻译为它们自己的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明令牌，而不是智能体创作的原始值。
- 如果生成的交互块会超出 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 载荷。

## Slack 中的 exec 审批

Slack 可以作为原生审批客户端，使用交互式按钮和交互，而不是回退到 Web UI 或终端。

- Exec 审批使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已经落在 Slack 中且审批 ID 类型为 `plugin:` 时，插件审批也仍可通过同一套 Slack 原生按钮界面处理。
- 审批人授权仍会被强制执行：只有被识别为审批人的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享审批按钮界面。当你在 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要审批 UX；只有当工具结果表明聊天审批不可用或手动审批是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；如可行会回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"` 且至少解析出一名审批人时，Slack 会自动启用原生 exec 审批。设为 `enabled: false` 可显式禁用 Slack 作为原生审批客户端。
设为 `enabled: true` 可在审批人解析成功时强制启用原生审批。

在没有显式 Slack exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有当你想覆盖审批人、添加过滤器，或选择加入原始聊天投递时，才需要显式的 Slack 原生配置：

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

共享的 `approvals.exec` 转发是独立的。只有当 exec 审批提示还必须路由到其他聊天或显式的带外目标时才使用它。共享的 `approvals.plugin` 转发也是独立的；当这些请求已经落在 Slack 中时，Slack 原生按钮仍可处理插件审批。

同一聊天中的 `/approve` 在已经支持命令的 Slack 渠道和私信中也可使用。完整的审批转发模型见[Exec 审批](/zh-CN/tools/exec-approvals)。

## 事件与运行行为

- 消息编辑/删除/线程广播会映射为系统事件。
- 添加/移除反应事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名以及添加/移除 pin 事件会映射为系统事件。
- 当启用 `configWrites` 时，`channel_id_changed` 可迁移渠道配置键。
- 渠道 topic/purpose 元数据被视为不可信上下文，并可注入到路由上下文中。
- 线程发起者和初始线程历史上下文播种在适用时会按已配置的发送者 allowlist 进行过滤。
- 块操作和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并包含丰富的载荷字段：
  - 块操作：所选值、标签、选择器值以及 `workflow_*` 元数据
  - 模态 `view_submission` 和 `view_closed` 事件，包含已路由的渠道元数据和表单输入

## 配置参考指针

主要参考：

- [配置参考 - Slack](/zh-CN/gateway/configuration-reference#slack)

  高信号 Slack 字段：
  - 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
  - 兼容性开关：`dangerouslyAllowNameMatching`（紧急兜底开关；除非必要，否则保持关闭）
  - 渠道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
  - 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
  - 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
  - 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

## 故障排除

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道 allowlist（`channels.slack.channels`）
    - `requireMention`
    - 每个渠道的 `users` allowlist

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
    - 配对审批 / allowlist 条目

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    验证 bot + app 令牌，以及 Slack 应用设置中是否启用了 Socket Mode。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，说明该 Slack 账户
    已配置，但当前运行时无法解析由 SecretRef 支持的
    实际值。

  </Accordion>

  <Accordion title="HTTP 模式未接收到事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack 请求 URL（事件 + 交互 + 斜杠命令）
    - 每个 HTTP 账户使用唯一的 `webhookPath`

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    说明该 HTTP 账户已配置，但当前运行时无法
    解析由 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    验证你原本打算使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册了匹配的斜杠命令
    - 或单一斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    另请检查 `commands.useAccessGroups` 以及渠道/用户 allowlist。

  </Accordion>
</AccordionGroup>

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [故障排除](/zh-CN/channels/troubleshooting)
- [配置](/zh-CN/gateway/configuration)
- [斜杠命令](/zh-CN/tools/slash-commands)

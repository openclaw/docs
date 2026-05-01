---
read_when:
    - 设置 Slack 或调试 Slack 套接字/HTTP 模式
summary: Slack 设置和运行时行为（Socket 模式 + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-05-01T13:24:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2b065eab0e80dc223d33d0e0c8210e1ff05ff24426f7a335885540c9eb42ae9
    source_path: channels/slack.md
    workflow: 16
---

已可通过 Slack 应用集成用于生产环境中的私信和渠道。默认模式是 Socket Mode；也支持 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        在 Slack 应用设置中按下 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest** 并为你的应用选择一个工作区
        - 粘贴下面的[示例清单](#manifest-and-scope-checklist)，然后继续创建
        - 生成一个具有 `connections:write` 权限的 **App-Level Token**（`xapp-...`）
        - 安装应用并复制显示的 **Bot Token**（`xoxb-...`）

      </Step>

      <Step title="Configure OpenClaw">

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
        在 Slack 应用设置中按下 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest** 并为你的应用选择一个工作区
        - 粘贴[示例清单](#manifest-and-scope-checklist)，并在创建前更新 URL
        - 保存用于请求验证的 **Signing Secret**
        - 安装应用并复制显示的 **Bot Token**（`xoxb-...`）

      </Step>

      <Step title="Configure OpenClaw">

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

        为每个账号提供不同的 `webhookPath`（默认 `/slack/events`），这样注册不会冲突。
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

对于 Socket Mode，OpenClaw 默认将 Slack SDK 客户端 pong 超时设置为 15 秒。只有在需要针对工作区或主机进行特定调优时，才覆盖传输设置：

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

仅对记录 Slack websocket pong/server-ping 超时，或运行在已知存在事件循环饥饿问题主机上的 Socket Mode 工作区使用此配置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍然是应用状态，而不是传输活跃性信号。

## 清单和 scope 检查清单

基础 Slack 应用清单对于 Socket Mode 和 HTTP Request URLs 相同。只有 `settings` 块（以及斜杠命令的 `url`）不同。

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
        /* same as Socket Mode */
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

公开不同功能，以扩展上述默认值。

默认清单启用 Slack App Home 的 **Home** 标签页，并订阅 `app_home_opened`。当工作区成员打开 Home 标签页时，OpenClaw 会通过 `views.publish` 发布一个安全的默认 Home 视图；其中不包含对话载荷或私有配置。**Messages** 标签页仍为 Slack 私信启用。

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior)，而不是单个已配置命令，但有一些细节：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令已保留。
    - 一次最多只能提供 25 个斜杠命令。

    将你现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list)的一个子集：

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        使用与上方 Socket Mode 相同的 `slash_commands` 列表，并为每个条目添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

```json
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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    如果你希望出站消息使用当前智能体身份（自定义用户名和图标），而不是默认 Slack 应用身份，请添加 `chat:write.customize` bot scope。

    如果你使用 emoji 图标，Slack 要求使用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
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
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文
  字符串或 SecretRef 对象。
- 配置令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken` (`xoxp-...`) 只能通过配置提供（没有环境变量回退），并默认采用只读行为（`userTokenReadOnly: true`）。

Status 快照行为：

- Slack 账户检查会按凭证跟踪 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- Status 为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账户通过 SecretRef
  或其他非内联密钥来源配置，但当前命令/运行时路径
  无法解析实际值。
- 在 HTTP 模式中，会包含 `signingSecretStatus`；在 Socket Mode 中，
  必需组合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍优先使用机器人令牌；只有当 `userTokenReadOnly: false` 且机器人令牌不可用时，才允许用户令牌写入。
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
  <Tab title="DM policy">
    `channels.slack.dmPolicy` 控制私信访问。`channels.slack.allowFrom` 是规范私信允许列表。

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM 允许列表）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在自己的 `allowFrom` 未设置时继承 `channels.slack.allowFrom`。
    - 命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    旧版 `channels.slack.dm.policy` 和 `channels.slack.dm.allowFrom` 仍会读取以保持兼容。`openclaw doctor --fix` 会在不改变访问权限的情况下，将它们迁移到 `dmPolicy` 和 `allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，并且配置键**必须使用稳定的 Slack 渠道 ID**（例如 `C12345678`）。

    运行时注意事项：如果完全缺少 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 当令牌访问允许时，渠道允许列表条目和私信允许列表条目会在启动时解析
    - 未解析的渠道名称条目会按配置保留，但默认在路由时忽略
    - 入站授权和渠道路由默认优先使用 ID；直接用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    基于名称的键（`#channel-name` 或 `channel-name`）在 `groupPolicy: "allowlist"` 下**不会**匹配。渠道查找默认优先使用 ID，因此基于名称的键永远无法成功路由，该渠道中的所有消息都会被静默阻止。这不同于 `groupPolicy: "open"`，后者不需要渠道键即可路由，基于名称的键看起来会生效。

    始终使用 Slack 渠道 ID 作为键。查找方法：在 Slack 中右键点击渠道 → **Copy link** — ID（`C...`）会出现在 URL 末尾。

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
    渠道消息默认由提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复到 bot 线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    单渠道控制（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:`，或 `"*"` 通配符
      （旧版无前缀键仍只映射到 `id:`）

    `allowBots` 对渠道和私有渠道采取保守策略：只有当发送 bot 被明确列入该房间的 `users` 允许列表，或 `channels.slack.allowFrom` 中至少一个显式 Slack 所有者 ID 当前是房间成员时，才接受 bot 发出的房间消息。通配符和显示名称形式的所有者条目不满足所有者存在条件。所有者存在检查使用 Slack `conversations.members`；请确保应用拥有与房间类型匹配的读取 scope（公开渠道用 `channels:read`，私有渠道用 `groups:read`）。如果成员查询失败，OpenClaw 会丢弃 bot 发出的房间消息。

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信按 `direct` 路由；渠道按 `channel` 路由；MPIM 按 `group` 路由。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 适用时，线程回复可以创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认是 `thread`；`thread.inheritParent` 默认是 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当为 `true` 时，抑制隐式线程提及，因此即使 bot 已参与该线程，bot 也只会响应线程内显式的 `@bot` 提及。否则，bot 已参与线程中的回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 私聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 会禁用 Slack 中的**所有**回复线程，包括显式 `[[reply_to_*]]` 标签。这不同于 Telegram，在 Telegram 中，显式标签在 `"off"` 模式下仍会生效。Slack 线程会把消息隐藏在渠道之外，而 Telegram 回复会保持内联可见。
</Note>

## 确认表情回应

`ackReaction` 会在 OpenClaw 处理入站消息时发送确认表情符号。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

注意：

- Slack 需要短代码（例如 `"eyes"`）。
- 使用 `""` 可针对 Slack 账号或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活动状态时，将工具/进度更新路由到同一条已编辑的预览消息中（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程，才会显示原生文本流式传输和 Slack assistant 线程状态。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用时，渠道和群聊根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认不在线程内，因此不会显示线程样式预览；如果你希望那里显示可见进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本载荷会回退到普通投递。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/分块最终消息仅在可以原地编辑预览时才会 flush。
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

- `channels.slack.streamMode`（`replace | status_final | append`）会自动迁移到 `channels.slack.streaming.mode`。
- 布尔值 `channels.slack.streaming` 会自动迁移到 `channels.slack.streaming.mode` 和 `channels.slack.streaming.nativeTransport`。
- 旧版 `channels.slack.nativeStreaming` 会自动迁移到 `channels.slack.streaming.nativeTransport`。

## 输入状态反应回退

`typingReaction` 会在 OpenClaw 处理回复时，向入站 Slack 消息添加一个临时反应，并在运行结束时将其移除。这在线程回复之外最有用，因为线程回复会使用默认的“正在输入...”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意：

- Slack 需要短代码（例如 `"hourglass_flowing_sand"`）。
- 该反应采用尽力而为方式，回复或失败路径完成后会自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在获取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，因此智能体可以用 `download-file` 获取原始文件。

    下载使用有界的空闲超时和总超时。如果 Slack 文件检索停滞或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 配置后，出站媒体上限遵循 `channels.slack.mediaMaxMb`；否则，渠道发送使用媒体流水线中的 MIME 类型默认值

  </Accordion>

  <Accordion title="投递目标">
    首选的显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于渠道

    发送到用户目标时，会通过 Slack conversation API 打开 Slack 私信。

  </Accordion>
</AccordionGroup>

## 命令和 slash 行为

Slash 命令在 Slack 中显示为单个配置命令或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack 应用中配置[其他清单设置](#additional-manifest-settings)，并改用 `channels.slack.commands.native: true` 启用，或在全局配置中使用 `commands.native: true`。

- Slack 的原生命令自动模式为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在分发所选选项值之前显示确认模态框：

- 最多 5 个选项：按钮区块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：当交互选项处理程序可用时，使用带异步选项过滤的外部选择
- 超出 Slack 限制：编码后的选项值回退为按钮

```txt
/think
```

Slash 会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，并且仍会使用 `CommandTargetSessionKey` 将命令执行路由到目标对话会话。

## 交互式回复

Slack 可以渲染 agent 编写的交互式回复控件，但此功能默认禁用。

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

启用后，agent 可以发出仅限 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有 Slack 交互事件路径回传点击或选择。

注意事项：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令转换为自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明令牌，不是 agent 编写的原始值。
- 如果生成的交互式区块会超过 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 载荷。

## Slack 中的执行批准

Slack 可以作为带有交互式按钮和交互的原生批准客户端，而不是回退到 Web UI 或终端。

- 执行批准使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已经落在 Slack 中，并且批准 ID 类型为 `plugin:` 时，插件批准仍可通过同一 Slack 原生按钮界面完成。
- 仍会强制执行批准者授权：只有被识别为批准者的用户才能通过 Slack 批准或拒绝请求。

这会使用与其他渠道相同的共享批准按钮界面。当你的 Slack 应用设置中启用 `interactivity` 时，批准提示会在对话中直接渲染为 Block Kit 按钮。
当这些按钮存在时，它们是主要批准 UX；OpenClaw
只应在工具结果表明聊天批准不可用或手动批准是唯一路径时
包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少解析出一个批准者时，Slack 会自动启用原生执行批准。设置 `enabled: false` 可显式禁用 Slack 作为原生批准客户端。
设置 `enabled: true` 可在批准者解析成功时强制启用原生批准。

没有显式 Slack 执行批准配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆盖批准者、添加过滤器，或选择加入来源聊天投递时，才需要显式 Slack 原生配置：

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

共享 `approvals.exec` 转发是独立的。仅当执行批准提示还必须路由到其他聊天或显式带外目标时才使用它。共享 `approvals.plugin` 转发也是独立的；当这些请求已经落在 Slack 中时，Slack 原生按钮仍可完成插件批准。

同一聊天中的 `/approve` 也适用于已经支持命令的 Slack 渠道和私信。完整批准转发模型见[执行批准](/zh-CN/tools/exec-approvals)。

## 事件和运维行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“Also send to channel” 线程回复）会作为普通用户消息处理。
- Reaction 添加/移除事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名，以及 pin 添加/移除事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道 topic/purpose 元数据会被视为不受信任的上下文，并可能被注入路由上下文。
- 适用时，线程起始消息和初始线程历史上下文注入会按配置的发送者允许列表过滤。
- 区块操作和模态框交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富载荷字段：
  - 区块操作：所选值、标签、选择器值和 `workflow_*` 元数据
  - 模态框 `view_submission` 和 `view_closed` 事件，包含路由的渠道元数据和表单输入

## 配置参考

主要参考：[配置参考 - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- 模式/凭证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（应急开关；除非需要，否则保持关闭）
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
    - 渠道允许列表（`channels.slack.channels`）— **键必须是渠道 ID**（`C12345678`），而不是名称（`#channel-name`）。在 `groupPolicy: "allowlist"` 下，基于名称的键会静默失败，因为默认情况下渠道路由以 ID 优先。查找 ID 的方法：在 Slack 中右键点击渠道 → **Copy link** — URL 末尾的 `C...` 值就是渠道 ID。
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
    - 配对批准 / 允许列表条目
    - Slack Assistant 私信事件：提到 `drop message_changed` 的详细日志
      通常意味着 Slack 发送了一个已编辑的 Assistant 线程事件，但消息元数据中
      没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    在 Slack 应用设置中验证 bot + app 令牌以及 Socket Mode 是否启用。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，表示 Slack 账号
    已配置，但当前运行时无法解析由 SecretRef 支持的
    值。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - 签名密钥
    - webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账号唯一的 `webhookPath`

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，
    表示 HTTP 账号已配置，但当前运行时无法
    解析由 SecretRef 支持的签名密钥。

  </Accordion>

  <Accordion title="原生/slash 命令未触发">
    确认你的预期是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册匹配的 slash 命令
    - 或单个 slash 命令模式（`channels.slack.slashCommand.enabled: true`）

    同时检查 `commands.useAccessGroups` 以及渠道/用户允许列表。

  </Accordion>
</AccordionGroup>

## 附件视觉参考

当 Slack 文件下载成功且大小限制允许时，Slack 可以将已下载媒体附加到 agent 轮次中。图片文件可以通过媒体理解路径传递，或直接传递给具备视觉能力的回复模型；其他文件会保留为可下载文件上下文，而不是被视为图片输入。

### 支持的媒体类型

| 媒体类型                       | 来源                 | 当前行为                                                                          | 备注                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG / PNG / GIF / WebP 图片   | Slack 文件 URL       | 下载并附加到轮次中，以供具备视觉能力的处理                                      | 单文件上限：`channels.slack.mediaMaxMb`（默认 20 MB）                    |
| PDF 文件                       | Slack 文件 URL       | 下载并公开为文件上下文，供 `download-file` 或 `pdf` 等工具使用                   | Slack 入站不会自动将 PDF 转换为图片视觉输入                              |
| 其他文件                       | Slack 文件 URL       | 尽可能下载并公开为文件上下文                                                     | 二进制文件不会被视为图片输入                                             |
| 线程回复                       | 线程起始文件         | 当回复没有直接媒体时，可以将根消息文件水合为上下文                               | 仅文件起始消息使用附件占位符                                             |
| 多图片消息                     | 多个 Slack 文件      | 每个文件都会独立评估                                                             | Slack 处理每条消息最多限制为八个文件                                     |

### 入站流水线

当带有文件附件的 Slack 消息到达时：

1. OpenClaw 使用 bot 令牌（`xoxb-...`）从 Slack 的私有 URL 下载文件。
2. 成功后，文件会写入媒体存储。
3. 下载的媒体路径和内容类型会添加到入站上下文。
4. 支持图像的模型/工具路径可以使用该上下文中的图像附件。
5. 非图像文件仍会作为文件元数据或媒体引用提供给能处理它们的工具。

### 线程根附件继承

当消息在线程中到达（有一个 `thread_ts` 父级）时：

- 如果回复本身没有直接媒体，而包含的根消息有文件，Slack 可以将根文件注入为线程起始上下文。
- 直接回复附件优先于根消息附件。
- 只有文件而没有文本的根消息会以附件占位符表示，因此回退仍可包含其文件。

### 多附件处理

当单条 Slack 消息包含多个文件附件时：

- 每个附件都会通过媒体管线独立处理。
- 下载的媒体引用会聚合到消息上下文中。
- 处理顺序遵循事件载荷中 Slack 的文件顺序。
- 一个附件下载失败不会阻塞其他附件。

### 大小、下载和模型限制

- **大小上限**：默认每个文件 20 MB。可通过 `channels.slack.mediaMaxMb` 配置。
- **下载失败**：Slack 无法提供的文件、过期 URL、无法访问的文件、超大文件，以及 Slack 认证/登录 HTML 响应会被跳过，而不是报告为不支持的格式。
- **视觉模型**：图像分析会使用支持视觉的当前回复模型，或使用在 `agents.defaults.imageModel` 配置的图像模型。

### 已知限制

| 场景                                   | 当前行为                                                                     | 解决方法                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 过期的 Slack 文件 URL                  | 文件被跳过；不显示错误                                                       | 在 Slack 中重新上传文件                                                    |
| 未配置视觉模型                         | 图像附件会存储为媒体引用，但不会作为图像分析                                 | 配置 `agents.defaults.imageModel`，或使用支持视觉的回复模型                |
| 非常大的图像（默认 > 20 MB）           | 按大小上限跳过                                                               | 如果 Slack 允许，增加 `channels.slack.mediaMaxMb`                          |
| 转发/共享的附件                        | 文本和 Slack 托管的图像/文件媒体会尽力处理                                   | 直接在 OpenClaw 线程中重新分享                                             |
| PDF 附件                               | 存储为文件/媒体上下文，不会自动通过图像视觉路由                              | 对文件元数据使用 `download-file`，或使用 `pdf` 工具进行 PDF 分析           |

### 相关文档

- [媒体理解管线](/zh-CN/nodes/media-understanding)
- [PDF 工具](/zh-CN/tools/pdf)
- 长篇任务：[#51349](https://github.com/openclaw/openclaw/issues/51349) — 启用 Slack 附件视觉
- 回归测试：[#51353](https://github.com/openclaw/openclaw/issues/51353)
- 实时验证：[#51354](https://github.com/openclaw/openclaw/issues/51354)

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

---
read_when:
    - 设置 Slack 或调试 Slack 套接字/HTTP 模式
summary: Slack 设置和运行时行为（Socket 模式 + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-04-28T11:46:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e33ea77f81c7f1f79a26e73fd9341ec2d44f86620e8acf37e41eb70e8b7793
    source_path: channels/slack.md
    workflow: 16
---

可通过 Slack 应用集成，用于生产环境中的私信和渠道。默认模式是 Socket Mode；也支持 HTTP 请求 URL。

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
        在 Slack 应用设置中按下 **[创建新应用](https://api.slack.com/apps/new)** 按钮：

        - 选择 **通过 manifest**，并为你的应用选择一个工作区
        - 粘贴下面的 [示例 manifest](#manifest-and-scope-checklist)，然后继续创建
        - 生成带有 `connections:write` 的 **App-Level Token**（`xapp-...`）
        - 安装应用并复制显示的 **Bot Token**（`xoxb-...`）

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
        在 Slack 应用设置中按下 **[创建新应用](https://api.slack.com/apps/new)** 按钮：

        - 选择 **通过 manifest**，并为你的应用选择一个工作区
        - 粘贴 [示例 manifest](#manifest-and-scope-checklist)，并在创建前更新 URL
        - 保存用于请求验证的 **Signing Secret**
        - 安装应用并复制显示的 **Bot Token**（`xoxb-...`）

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
        为多账户 HTTP 使用唯一的 webhook 路径

        为每个账户提供不同的 `webhookPath`（默认 `/slack/events`），这样注册就不会冲突。
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

默认情况下，OpenClaw 会将 Socket Mode 的 Slack SDK 客户端 pong 超时设置为 15 秒。仅在需要针对工作区或主机进行特定调优时，才覆盖传输设置：

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

仅对记录 Slack websocket pong/server-ping 超时，或运行在已知事件循环饥饿主机上的 Socket Mode 工作区使用此设置。`clientPingTimeout` 是 SDK 发送客户端 ping 后等待 pong 的时间；`serverPingTimeout` 是等待 Slack 服务器 ping 的时间。应用消息和事件仍然是应用状态，而不是传输活跃性信号。

## Manifest 和权限范围检查清单

基础 Slack 应用 manifest 对 Socket Mode 和 HTTP 请求 URL 相同。只有 `settings` 块（以及斜杠命令的 `url`）不同。

基础 manifest（Socket Mode 默认）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
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

对于 **HTTP 请求 URL 模式**，请将 `settings` 替换为 HTTP 变体，并为每个斜杠命令添加 `url`。需要公共 URL：

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

### 其他 manifest 设置

启用扩展上述默认设置的不同功能。

<AccordionGroup>
  <Accordion title="可选的原生斜杠命令">

    可以使用多个 [原生斜杠命令](#commands-and-slash-behavior)，而不是单个配置命令，并保留细粒度行为：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令是保留命令。
    - 一次最多只能提供 25 个斜杠命令。

    将你现有的 `features.slash_commands` 部分替换为 [可用命令](/zh-CN/tools/slash-commands#command-list) 的子集：

    <Tabs>
      <Tab title="Socket Mode（默认）">

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
      <Tab title="HTTP 请求 URL">
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
  <Accordion title="可选署名权限范围（写入操作）">
    如果你想让传出消息使用活跃智能体身份（自定义用户名和图标），而不是默认 Slack 应用身份，请添加 `chat:write.customize` bot 权限范围。

    如果你使用 emoji 图标，Slack 期望使用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户令牌权限范围（读取操作）">
    如果你配置 `channels.slack.userToken`，典型读取权限范围是：

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
- `userToken`（`xoxp-...`）只能通过配置设置（没有环境变量回退），并默认使用只读行为（`userTokenReadOnly: true`）。

Status 快照行为：

- Slack 账户检查会跟踪每个凭据的 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- Status 为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示账户通过 SecretRef
  或其他非内联密钥来源配置，但当前命令/运行时路径
  无法解析实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，
  必需的配对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作/目录读取，配置后可以优先使用用户令牌。对于写入，仍然优先使用机器人令牌；只有当 `userTokenReadOnly: false` 且机器人令牌不可用时，才允许用户令牌写入。
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
    `channels.slack.dmPolicy` 控制私信访问（旧版：`channels.slack.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.slack.allowFrom` 包含 `"*"`；旧版：`channels.slack.dm.allowFrom`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`（首选）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认为 false）
    - `dm.groupChannels`（可选 MPIM 允许列表）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 只应用于 `default` 账户。
    - 命名账户在其自身的 `allowFrom` 未设置时继承 `channels.slack.allowFrom`。
    - 命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，并且应使用稳定的渠道 ID。

    运行时注意事项：如果完全缺失 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 渠道允许列表条目和私信允许列表条目会在启动时解析，前提是令牌访问权限允许
    - 未解析的渠道名称条目会按配置保留，但默认情况下会被路由忽略
    - 入站授权和渠道路由默认优先使用 ID；直接用户名/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及和渠道用户">
    渠道消息默认由提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每个渠道控制项（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍然只映射到 `id:`）

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复在适用时可以创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少条现有线程消息（默认 `20`；设置为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当为 `true` 时，抑制隐式线程提及，使机器人在线程内只响应显式 `@bot` 提及，即使机器人已经参与该线程。否则，机器人已参与线程中的回复会绕过 `requireMention` 门控。

回复线程控制项：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 直接聊天的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 会禁用 Slack 中的**所有**回复线程，包括显式 `[[reply_to_*]]` 标签。这与 Telegram 不同，Telegram 在 `"off"` 模式下仍然会遵循显式标签。Slack 线程会在渠道中隐藏消息，而 Telegram 回复会保持内联可见。
</Note>

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息时发送确认表情符号。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

注意事项：

- Slack 需要短代码（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账户或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活动状态时，将工具/进度更新路由到同一条已编辑的预览消息中（默认：`true`）。设置为 `false` 可保留单独的工具/进度消息。

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程，原生文本流式传输和 Slack 助手线程状态才会显示。线程选择仍然遵循 `replyToMode`。
- 当原生流式传输不可用时，渠道和群聊根消息仍可以使用普通草稿预览。
- 顶层 Slack 私信默认保持在线程外，因此不会显示线程样式预览；如果你希望在那里显示可见进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本负载会回退到普通投递。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/分块最终消息只有在可以就地编辑预览时才会刷新。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余负载回退到普通投递。

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

## 输入反应回退

`typingReaction` 会在 OpenClaw 处理回复时向入站 Slack 消息添加临时反应，并在运行结束时移除它。这在线程回复之外最有用，因为线程回复会使用默认的 “is typing...” 状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意事项：

- Slack 需要短代码（例如 `"hourglass_flowing_sand"`）。
- 该反应是尽力而为的，回复或失败路径完成后会自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（令牌认证请求流），并在抓取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，因此智能体可以用 `download-file` 获取原始文件。

    下载使用有界空闲超时和总超时。如果 Slack 文件检索卡住或失败，OpenClaw 会继续处理消息，并回退到文件占位符。

    运行时入站大小上限默认为 `20MB`，除非由 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 配置后，出站媒体上限遵循 `channels.slack.mediaMaxMb`；否则渠道发送会使用媒体管道中的 MIME 类型默认值

  </Accordion>

  <Accordion title="投递目标">
    首选显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于渠道

    发送到用户目标时，会通过 Slack conversation API 打开 Slack 私信。

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

原生命令需要在你的 Slack 应用中配置[额外 manifest 设置](#additional-manifest-settings)，并改用 `channels.slack.commands.native: true` 启用，或在全局配置中使用 `commands.native: true` 启用。

- Slack 的原生命令自动模式为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在分派所选选项值前显示确认模态框：

- 最多 5 个选项：按钮区块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：当交互选项处理器可用时，使用带异步选项过滤的外部选择
- 超出 Slack 限制：编码后的选项值回退为按钮

```txt
/think
```

斜杠会话使用类似 `agent:<agentId>:slack:slash:<userId>` 的隔离键，并且仍会使用 `CommandTargetSessionKey` 将命令执行路由到目标对话会话。

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

启用后，智能体可以发出仅 Slack 可用的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有 Slack 交互事件路径路由点击或选择。

注意事项：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令转换为自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明令牌，而不是原始由智能体编写的值。
- 如果生成的交互式块会超出 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的 blocks 负载。

## Slack 中的 Exec 批准

Slack 可以作为带有交互式按钮和交互的原生批准客户端，而不是回退到 Web UI 或终端。

- Exec 批准使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已经落到 Slack 中且批准 id 类型为 `plugin:` 时，插件批准仍可通过同一个 Slack 原生按钮界面完成。
- 仍会强制执行批准者授权：只有被识别为批准者的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享批准按钮界面。当你的 Slack 应用设置中启用了 `interactivity` 时，批准提示会直接在对话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要的批准 UX；只有当工具结果表明聊天批准不可用，或手动批准是唯一路径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个批准者时，Slack 会自动启用原生 exec 批准。设置 `enabled: false` 可明确禁用 Slack 作为原生批准客户端。
设置 `enabled: true` 可在能解析出批准者时强制启用原生批准。

没有显式 Slack exec 批准配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有当你想覆盖批准者、添加过滤器，或
选择启用来源聊天投递时，才需要显式 Slack 原生配置：

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

共享 `approvals.exec` 转发是独立的。仅当 exec 批准提示还必须
路由到其他聊天或显式带外目标时才使用它。共享 `approvals.plugin` 转发也是
独立的；当这些请求已经落到 Slack 中时，Slack 原生按钮仍可完成插件批准。

同聊天 `/approve` 也可在已支持命令的 Slack 渠道和私信中使用。完整批准转发模型请参阅 [Exec 批准](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑/删除会映射为系统事件。
- 线程广播（“Also send to channel” 线程回复）会作为普通用户消息处理。
- 表情反应添加/移除事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名，以及置顶添加/移除事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道 topic/purpose 元数据会被视为不可信上下文，并且可注入到路由上下文中。
- 适用时，线程发起消息和初始线程历史上下文种子会按已配置的发送者允许列表过滤。
- Block actions 和 modal 交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的负载字段：
  - block actions：已选择的值、标签、选择器值和 `workflow_*` 元数据
  - modal `view_submission` 和 `view_closed` 事件，包含已路由渠道元数据和表单输入

## 配置参考

主要参考：[配置参考 - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- mode/auth：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急破窗；除非需要，否则保持关闭）
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
    - 渠道允许列表（`channels.slack.channels`）
    - `requireMention`
    - 每渠道 `users` 允许列表

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
      通常表示 Slack 发送了一个已编辑的 Assistant 线程事件，但消息元数据中
      没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    在 Slack 应用设置中验证 bot + app token 以及 Socket Mode 是否已启用。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则 Slack 账号
    已配置，但当前运行时无法解析由 SecretRef 支持的
    值。

  </Accordion>

  <Accordion title="HTTP 模式未收到事件">
    验证：

    - signing secret
    - webhook path
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账号使用唯一的 `webhookPath`

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，
    则 HTTP 账号已配置，但当前运行时无法
    解析由 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生/slash 命令未触发">
    验证你想要的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并已在 Slack 中注册匹配的 slash commands
    - 或单一 slash command 模式（`channels.slack.slashCommand.enabled: true`）

    还要检查 `commands.useAccessGroups` 以及渠道/用户允许列表。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Slack 用户配对到 Gateway 网关。
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
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

---
read_when:
    - 设置 Slack 或调试 Slack socket/HTTP 模式
summary: Slack 设置和运行时行为（Socket Mode + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-04-24T03:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

通过 Slack 应用集成即可为私信和渠道提供生产可用支持。默认模式为 Socket Mode；同时也支持 HTTP 请求 URL。

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

## 快速开始

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack 应用">
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴下方的[示例清单](#manifest-and-scope-checklist)，然后继续创建
        - 生成一个带有 `connections:write` 权限的 **App-Level Token**（`xapp-...`）
        - 安装应用并复制显示出的 **Bot Token**（`xoxb-...`）
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
        - 安装应用并复制显示出的 **Bot Token**（`xoxb-...`）

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

        为每个账户提供不同的 `webhookPath`（默认是 `/slack/events`），这样注册时就不会发生冲突。
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

## 清单和 scope 检查清单

Socket Mode 和 HTTP 请求 URL 使用相同的基础 Slack 应用清单。只有 `settings` 代码块（以及斜杠命令的 `url`）不同。

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

对于**HTTP 请求 URL 模式**，请将 `settings` 替换为 HTTP 变体，并为每个斜杠命令添加 `url`。需要公开 URL：

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

呈现可扩展上述默认值的不同功能。

<AccordionGroup>
  <Accordion title="可选原生斜杠命令">

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
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
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
        使用与上方 Socket Mode 相同的 `slash_commands` 列表，并为每一项添加 `"url": "https://gateway-host.example.com/slack/events"`。示例：

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
  <Accordion title="可选作者身份 scopes（写操作）">
    如果你希望发出的消息使用当前智能体身份（自定义用户名和图标）而不是默认的 Slack 应用身份，请添加 `chat:write.customize` bot scope。

    如果你使用 emoji 图标，Slack 期望采用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户令牌 scopes（读操作）">
    如果你配置了 `channels.slack.userToken`，常见读取 scope 包括：

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
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受纯文本
  字符串或 SecretRef 对象。
- 配置中的令牌会覆盖环境变量回退值。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持通过配置提供（没有环境变量回退），并默认采用只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查会跟踪每个凭证的 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态可以是 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账户通过 SecretRef
  或其他非内联密钥来源进行了配置，但当前命令/运行时路径
  无法解析出实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，
  必需的组合是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于 actions/目录读取，如果已配置 user token，则可以优先使用它。对于写入，仍然优先使用 bot token；只有当 `userTokenReadOnly: false` 且 bot token 不可用时，才允许使用 user-token 写入。
</Tip>

## Actions 和门控

Slack actions 由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的 action 分组：

| 分组      | 默认值 |
| ---------- | ------- |
| messages   | 已启用 |
| reactions  | 已启用 |
| pins       | 已启用 |
| memberInfo | 已启用 |
| emojiList  | 已启用 |

当前 Slack 消息 action 包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。

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
    - `channels.slack.allowFrom`（推荐）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM allowlist）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 当具名账户自己的 `allowFrom` 未设置时，会继承 `channels.slack.allowFrom`。
    - 具名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    在私信中进行配对时，使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道 allowlist 位于 `channels.slack.channels` 下，并应使用稳定的渠道 ID。

    运行时说明：如果完全缺少 `channels.slack`（仅环境变量设置），运行时会回退为 `groupPolicy="allowlist"` 并记录一条警告（即使已设置 `channels.defaults.groupPolicy` 也是如此）。

    名称/ID 解析：

    - 当令牌访问允许时，渠道 allowlist 条目和私信 allowlist 条目会在启动时解析
    - 无法解析的渠道名称条目会按配置保留，但默认不会用于路由
    - 入站授权和渠道路由默认优先使用 ID；只有设置 `channels.slack.dangerouslyAllowNameMatching: true` 时，才会直接进行用户名/slug 匹配

  </Tab>

  <Tab title="提及和渠道用户">
    默认情况下，渠道消息受提及门控控制。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式 bot 线程回复行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每渠道控制（`channels.slack.channels.<id>`；名称仅通过启动时解析或 `dangerouslyAllowNameMatching` 支持）：

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍仅映射为 `id:`）

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 在线程回复适用时，可以创建带线程会话后缀的回复（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认是 `thread`；`thread.inheritParent` 默认是 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时抓取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：设为 `true` 时，会抑制隐式线程提及，因此 bot 即使已经参与线程，也只会响应线程内显式的 `@bot` 提及。如果不这样设置，在 bot 已参与的线程中进行回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 旧版 direct 聊天回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 会禁用 Slack 中**所有**回复线程功能，包括显式 `[[reply_to_*]]` 标签。这一点与 Telegram 不同，在 Telegram 中，即使在 `"off"` 模式下也仍会遵循显式标签 —— Slack 线程会把消息隐藏在线程里，而 Telegram 回复仍以内联形式可见。

## 确认 reaction

`ackReaction` 会在 OpenClaw 处理入站消息期间发送一个确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 “👀”）

说明：

- Slack 期望使用 shortcode（例如 `"eyes"`）。
- 使用 `""` 可为某个 Slack 账户或全局禁用该 reaction。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块流式传输的预览更新。
- `progress`：在生成时显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览启用时，将工具/进度更新路由到同一个被编辑的预览消息中（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。

`channels.slack.streaming.nativeTransport` 控制当 `channels.slack.streaming.mode` 为 `partial` 时的 Slack 原生文本流式传输（默认：`true`）。

- 必须有一个回复线程可用，Slack 原生文本流式传输和 Slack assistant 线程状态才会显示。线程选择仍然遵循 `replyToMode`。
- 当原生流式传输不可用时，渠道和群聊根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持非线程状态，因此不会显示线程样式预览；如果你希望在这些场景中显示可见进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本载荷会回退为普通投递。
- 媒体/错误最终消息会取消待处理的预览编辑；符合条件的文本/块最终消息只有在能够原地编辑预览时才会刷新。
- 如果流式传输在回复过程中失败，OpenClaw 会对剩余载荷回退为普通投递。

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

## 输入中 reaction 回退

`typingReaction` 会在 OpenClaw 处理回复期间，为入站 Slack 消息添加一个临时 reaction，并在运行结束后将其移除。这在非线程回复场景中特别有用，因为线程回复会使用默认的“正在输入...”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 期望使用 shortcode（例如 `"hourglass_flowing_sand"`）。
- 该 reaction 采用尽力而为策略，回复完成或失败路径结束后会自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件通过 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在抓取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认是 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用优先按段落拆分
    - 文件发送使用 Slack 上传 API，并可包含线程回复（`thread_ts`）
    - 配置了 `channels.slack.mediaMaxMb` 时，出站媒体上限遵循该值；否则渠道发送会使用媒体管线中的 MIME 类型默认值
  </Accordion>

  <Accordion title="投递目标">
    推荐使用显式目标：

    - 私信使用 `user:<id>`
    - 渠道使用 `channel:<id>`

    发送到用户目标时，Slack 私信会通过 Slack conversation API 打开。

  </Accordion>
</AccordionGroup>

## 命令和斜杠行为

斜杠命令在 Slack 中可以显示为单个已配置命令，或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要在你的 Slack 应用中进行[额外清单设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 来启用。

- 对于 Slack，原生命令自动模式默认**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用一种自适应渲染策略，会在分发所选选项值前先显示确认模态框：

- 最多 5 个选项：按钮块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：当交互选项处理器可用时，使用带异步选项过滤的外部选择
- 超出 Slack 限制：经过编码的选项值会回退为按钮

```txt
/think
```

斜杠会话使用像 `agent:<agentId>:slack:slash:<userId>` 这样的隔离键，但仍会通过 `CommandTargetSessionKey` 将命令执行路由到目标对话会话。

## 交互式回复

Slack 可以渲染由智能体编写的交互式回复控件，但该功能默认禁用。

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

启用后，智能体可以输出仅适用于 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并将点击或选择通过现有的 Slack 交互事件路径路由回来。

说明：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令翻译为各自的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明令牌，不是智能体原始编写的值。
- 如果生成的交互块会超出 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 载荷。

## Slack 中的 Exec 审批

Slack 可以充当原生审批客户端，使用交互式按钮和交互，而不是回退到 Web UI 或终端。

- Exec 审批使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已落在 Slack 中且审批 id 类型为 `plugin:` 时，插件审批仍可通过相同的 Slack 原生按钮界面进行处理。
- 审批人授权仍会强制执行：只有被识别为审批人的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享审批按钮界面。当你在 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要的审批 UX；只有在工具结果表明聊天审批不可用或手动审批是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；在可能的情况下回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，并且至少解析出一个
审批人时，Slack 会自动启用原生 exec 审批。设置 `enabled: false` 可显式禁用 Slack 作为原生审批客户端。
设置 `enabled: true` 可在审批人可解析时强制启用原生审批。

没有显式 Slack exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有在你想覆盖审批人、添加过滤器，或
选择启用源聊天投递时，才需要显式 Slack 原生配置：

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

共享 `approvals.exec` 转发是独立的。只有当 exec 审批提示还必须
路由到其他聊天或显式带外目标时才使用它。共享 `approvals.plugin` 转发也
是独立的；当这些请求已经落在 Slack 中时，Slack 原生按钮仍可解析插件审批。

同一聊天中的 `/approve` 也适用于已经支持命令的 Slack 渠道和私信。完整的审批转发模型请参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑/删除/线程广播会映射为系统事件。
- reaction 添加/移除事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名以及 pin 添加/移除事件会映射为系统事件。
- 当启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道 topic/purpose 元数据会被视为不可信上下文，并可注入到路由上下文中。
- 线程发起者和初始线程历史上下文播种会在适用时根据已配置的发送者 allowlist 进行过滤。
- Block action 和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的载荷字段：
  - block action：所选值、标签、选择器值以及 `workflow_*` 元数据
  - 模态 `view_submission` 和 `view_closed` 事件，包含路由后的渠道元数据和表单输入

## 配置参考

主要参考： [配置参考 - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- mode/auth：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急开关；除非必要请保持关闭）
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
    - 渠道 allowlist（`channels.slack.channels`）
    - `requireMention`
    - 每渠道 `users` allowlist

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

  <Accordion title="Socket mode 未连接">
    验证 bot 和 app token，以及 Slack 应用设置中的 Socket Mode 是否已启用。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，说明 Slack 账户
    已配置，但当前运行时无法解析由 SecretRef 支持的
    值。

  </Accordion>

  <Accordion title="HTTP 模式未接收到事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack 请求 URL（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户使用唯一的 `webhookPath`

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    说明该 HTTP 账户已配置，但当前运行时无法
    解析由 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生命令/斜杠命令未触发">
    验证你本来打算使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并且在 Slack 中注册了匹配的斜杠命令
    - 或单一斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    还要检查 `commands.useAccessGroups` 以及渠道/用户 allowlist。

  </Accordion>
</AccordionGroup>

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
    威胁模型和加固。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

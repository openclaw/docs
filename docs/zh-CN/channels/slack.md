---
read_when:
    - 设置 Slack 或调试 Slack socket / HTTP 模式
summary: Slack 设置和运行时行为（Socket Mode + HTTP Request URLs）
title: Slack
x-i18n:
    generated_at: "2026-04-27T06:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: adbc6d872104440f4e9fbb03066fd6b21001c2732cde1f0580a0e8a9e5709591
    source_path: channels/slack.md
    workflow: 15
---

通过 Slack 应用集成即可用于私信和渠道，适合生产环境。默认模式是 Socket Mode，也支持 HTTP Request URLs。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复手册。
  </Card>
</CardGroup>

## 快速开始

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建一个新的 Slack 应用">
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴下面的[示例清单](#manifest-and-scope-checklist)，然后继续创建
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
      <Step title="创建一个新的 Slack 应用">
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴[示例清单](#manifest-and-scope-checklist)，并在创建前更新其中的 URL
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
        对多账号 HTTP 使用唯一的 webhook 路径

        为每个账号设置不同的 `webhookPath`（默认是 `/slack/events`），以避免注册发生冲突。
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

## 清单和权限范围检查清单

Slack 应用的基础清单在 Socket Mode 和 HTTP Request URLs 两种模式下是相同的。只有 `settings` 块（以及斜杠命令的 `url`）不同。

基础清单（Socket Mode 默认）：

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 的 Slack 连接器"
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
        "description": "向 OpenClaw 发送一条消息",
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

对于 **HTTP Request URLs 模式**，请将 `settings` 替换为 HTTP 版本，并为每个斜杠命令添加 `url`。需要公开 URL：

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "向 OpenClaw 发送一条消息",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* 与 Socket Mode 相同 */
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

展示可扩展上述默认值的不同功能。

<AccordionGroup>
  <Accordion title="可选原生斜杠命令">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior) 来替代单一已配置命令，并支持更细致的行为：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令是保留的。
    - 同时可用的斜杠命令不能超过 25 个。

    用[可用命令](/zh-CN/tools/slash-commands#command-list)中的一个子集替换你现有的 `features.slash_commands` 部分：

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
        "description": "切换推理可见性",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "切换提升模式",
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
        "description": "列出提供商 / 模型",
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
        "description": "显示当前智能体现在可以使用什么",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "显示运行时状态，包括提供商使用情况 / 配额（若可用）"
      },
      {
        "command": "/tasks",
        "description": "列出当前会话的活动 / 最近后台任务"
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
        "description": "按名称运行一个 Skills",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "提出一个侧边问题而不改变会话上下文",
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
      <Tab title="HTTP Request URLs">
        使用与上面 Socket Mode 相同的 `slash_commands` 列表，并为每一项添加 `"url": "https://gateway-host.example.com/slack/events"`。例如：

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "开始一个新会话",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "显示简短帮助摘要",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...为每个命令重复添加相同的 `url` 值
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="可选作者身份权限范围（写操作）">
    如果你希望发出的消息使用当前智能体身份（自定义用户名和图标）而不是默认的 Slack 应用身份，请添加 `chat:write.customize` bot 权限范围。

    如果你使用表情符号图标，Slack 需要 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户令牌权限范围（读操作）">
    如果你配置了 `channels.slack.userToken`，常见的读取权限范围有：

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
- 配置中的令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账号。
- `userToken`（`xoxp-...`）仅支持通过配置设置（没有环境变量回退），且默认是只读行为（`userTokenReadOnly: true`）。

Status 快照行为：

- Slack 账号检查会跟踪每个凭证对应的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- Status 的值为 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账号通过 SecretRef 或其他非内联密钥来源完成配置，但当前命令 / 运行时路径无法解析实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，所需的配对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于操作 / 目录读取，如果已配置，可以优先使用用户令牌。对于写操作，仍优先使用 bot 令牌；只有在 `userTokenReadOnly: false` 且 bot 令牌不可用时，才允许使用用户令牌执行写入。
</Tip>

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中的可用操作组：

| Group      | 默认 |
| ---------- | ---- |
| messages   | 启用 |
| reactions  | 启用 |
| pins       | 启用 |
| memberInfo | 启用 |
| emojiList  | 启用 |

当前 Slack 消息操作包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。`download-file` 接受入站文件占位符中显示的 Slack 文件 ID，并对图片返回预览，对其他文件类型返回本地文件元数据。

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
    - `dm.groupChannels`（可选的 MPIM 允许列表）

    多账号优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账号。
    - 当具名账号自身未设置 `allowFrom` 时，会继承 `channels.slack.allowFrom`。
    - 具名账号不会继承 `channels.slack.accounts.default.allowFrom`。

    私信中的配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道允许列表位于 `channels.slack.channels` 下，并且应使用稳定的渠道 ID。

    运行时说明：如果 `channels.slack` 完全缺失（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录一条警告（即使已设置 `channels.defaults.groupPolicy` 也是如此）。

    名称 / ID 解析：

    - 当令牌访问允许时，渠道允许列表条目和私信允许列表条目会在启动时解析
    - 无法解析的渠道名称条目会按配置保留，但默认不会用于路由
    - 入站授权和渠道路由默认优先使用 ID；直接用户名 / slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及和渠道用户">
    默认情况下，渠道消息受提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每渠道控制（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching` 支持）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍仅映射到 `id:`）

  </Tab>
</Tabs>

## 线程、会话和回复标签

- 私信路由为 `direct`；渠道路由为 `channel`；MPIM 路由为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 在线程适用时，线程回复可以创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话启动时获取多少现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：当设为 `true` 时，会禁用隐式线程提及，这样机器人即使已经参与该线程，也只会响应线程内显式的 `@bot` 提及。否则，在机器人已参与的线程中的回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 旧版私信回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` 会禁用 Slack 中**所有**回复线程功能，包括显式的 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中显式标签在 `"off"` 模式下仍然有效。Slack 线程会将消息隐藏在渠道之外，而 Telegram 回复仍以内联方式可见。
</Note>

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

说明：

- Slack 需要 shortcode（例如 `"eyes"`）。
- 使用 `""` 可为某个 Slack 账号或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览启用时，将工具 / 进度更新路由到同一条被编辑的预览消息中（默认：`true`）。设为 `false` 可保留独立的工具 / 进度消息。

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程，原生文本流式传输和 Slack assistant 线程状态才会显示。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用时，渠道和群聊根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持非线程模式，因此不会显示线程样式的预览；如果你希望在那里看到可见进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本负载会回退到普通发送方式。
- 媒体 / 错误最终消息会取消待处理的预览编辑；符合条件的文本 / block 最终消息仅在能够原地编辑预览时才会刷新。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余负载回退到普通发送方式。

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

`typingReaction` 会在 OpenClaw 处理回复时向入站 Slack 消息添加一个临时反应，并在运行结束时将其移除。这在线程回复之外特别有用，因为线程回复默认使用 “is typing...” 状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 需要 shortcode（例如 `"hourglass_flowing_sand"`）。
- 该反应为尽力而为，回复完成或失败路径结束后会自动尝试清理。

## 媒体、分块和发送

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在获取成功且大小限制允许时写入媒体存储。文件占位符包含 Slack `fileId`，因此智能体可以使用 `download-file` 获取原始文件。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用优先按段落拆分
    - 文件发送使用 Slack 上传 API，并可包含线程回复（`thread_ts`）
    - 出站媒体上限在配置了 `channels.slack.mediaMaxMb` 时遵循该值；否则渠道发送使用媒体管道中的 MIME 类型默认值

  </Accordion>

  <Accordion title="发送目标">
    推荐的显式目标：

    - 私信用 `user:<id>`
    - 渠道用 `channel:<id>`

    发送到用户目标时，Slack 私信会通过 Slack 会话 API 打开。

  </Accordion>
</AccordionGroup>

## 命令和斜杠行为

斜杠命令在 Slack 中可以显示为单个已配置命令或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要你在 Slack 应用中进行[额外清单设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- Slack 的原生命令自动模式默认为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用一种自适应渲染策略，在分发所选选项值之前会先显示确认模态框：

- 最多 5 个选项：按钮块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：当可用交互选项处理器时，使用支持异步选项过滤的外部选择
- 超出 Slack 限制：编码后的选项值会回退为按钮

```txt
/think
```

斜杠会话使用隔离键，例如 `agent:<agentId>:slack:slash:<userId>`，但仍会使用 `CommandTargetSessionKey` 将命令执行路由到目标会话。

## 交互式回复

Slack 可以渲染由智能体编写的交互式回复控件，但此功能默认禁用。

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

启用后，智能体可以输出仅限 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并通过现有的 Slack 交互事件路径回传点击或选择。

说明：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令转换成它们自己的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明令牌，而不是智能体原始编写的值。
- 如果生成的交互 block 会超过 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 负载。

## Slack 中的 Exec 批准

Slack 可以充当原生批准客户端，使用交互式按钮和交互，而不是回退到 Web UI 或终端。

- Exec 批准使用 `channels.slack.execApprovals.*` 进行原生私信 / 渠道路由。
- 当请求已落在 Slack 中且批准 ID 类型为 `plugin:` 时，插件批准仍可通过同一个 Slack 原生按钮界面完成。
- 批准者授权仍然会被强制执行：只有被识别为批准者的用户才能通过 Slack 批准或拒绝请求。

这里使用与其他渠道相同的共享批准按钮界面。当你在 Slack 应用设置中启用 `interactivity` 后，批准提示会直接在会话中以 Block Kit 按钮形式渲染。
当这些按钮存在时，它们就是主要的批准 UX；只有当工具结果表明聊天内批准不可用，或者手动批准是唯一途径时，OpenClaw
才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；在可能的情况下回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少解析出一个
批准者时，Slack 会自动启用原生 exec 批准。设置 `enabled: false` 可显式禁用 Slack 作为原生批准客户端。
设置 `enabled: true` 可在批准者解析成功时强制启用原生批准。

在没有显式 Slack exec 批准配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有当你想覆盖批准者、添加过滤器，或
选择加入源聊天发送时，才需要显式 Slack 原生配置：

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

共享的 `approvals.exec` 转发是独立的。仅当 exec 批准提示还必须
路由到其他聊天或显式带外目标时才使用它。共享的 `approvals.plugin` 转发也同样
是独立的；当这些请求已经到达 Slack 时，Slack 原生按钮仍然可以处理插件批准。

同一聊天中的 `/approve` 也适用于已经支持命令的 Slack 渠道和私信。完整的批准转发模型请参见[Exec approvals](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑 / 删除会映射为系统事件。
- 线程广播（“Also send to channel” 线程回复）会作为普通用户消息处理。
- 表情反应添加 / 移除事件会映射为系统事件。
- 成员加入 / 离开、渠道创建 / 重命名，以及置顶添加 / 移除事件会映射为系统事件。
- 当启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道 topic / purpose 元数据会被视为不受信任的上下文，并可注入到路由上下文中。
- 在线程适用时，线程起始消息和初始线程历史上下文注入会按配置的发送者允许列表进行过滤。
- Block 操作和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的负载字段：
  - block 操作：选中的值、标签、选择器值，以及 `workflow_*` 元数据
  - 模态 `view_submission` 和 `view_closed` 事件，带有已路由的渠道元数据和表单输入

## 配置参考

主要参考：[配置参考 - Slack](/zh-CN/gateway/config-channels#slack)。

<Accordion title="高信号 Slack 字段">

- mode / auth：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
- 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
- 兼容性开关：`dangerouslyAllowNameMatching`（紧急开关；除非必要否则保持关闭）
- 渠道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
- 线程 / 历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 发送：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`streaming.nativeTransport`、`streaming.preview.toolProgress`
- 运维 / 功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

</Accordion>

## 故障排除

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）
    - `requireMention`
    - 每渠道 `users` 允许列表

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
    - 配对批准 / 允许列表条目
    - Slack Assistant 私信事件：详细日志中提到 `drop message_changed`
      通常意味着 Slack 发送了一条已编辑的 Assistant 线程事件，而在消息元数据中
      没有可恢复的人类发送者

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode 未连接">
    验证 bot 和 app 令牌，以及 Slack 应用设置中的 Socket Mode 是否已启用。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，说明 Slack 账号
    已完成配置，但当前运行时无法解析由 SecretRef 支持的
    实际值。

  </Accordion>

  <Accordion title="HTTP 模式未接收到事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账号使用唯一的 `webhookPath`

    如果账号快照中出现 `signingSecretStatus: "configured_unavailable"`，
    说明 HTTP 账号已完成配置，但当前运行时无法
    解析由 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生命令 / 斜杠命令未触发">
    确认你的目标是：

    - 原生命令模式（`channels.slack.commands.native: true`），并且已在 Slack 中注册匹配的斜杠命令
    - 或单一斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    还要检查 `commands.useAccessGroups` 以及渠道 / 用户允许列表。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Slack 用户与 Gateway 网关配对。
  </Card>
  <Card title="Groups" icon="users" href="/zh-CN/channels/groups">
    渠道和群组私信行为。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型与加固。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    配置布局和优先级。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    命令目录和行为。
  </Card>
</CardGroup>

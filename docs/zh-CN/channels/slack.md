---
read_when:
    - 设置 Slack 或调试 Slack socket/HTTP 模式
summary: Slack 设置和运行时行为（Socket Mode + HTTP 请求 URL）
title: Slack
x-i18n:
    generated_at: "2026-04-21T16:52:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30b372a3ae10b7b649532181306e42792aca76b41422516e9633eb79f73f009
    source_path: channels/slack.md
    workflow: 15
---

# Slack

状态：通过 Slack 应用集成支持用于私信和渠道的生产就绪。默认模式为 Socket Mode；也支持 HTTP 请求 URL。

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
        - 粘贴下面的[示例清单](#manifest-and-scope-checklist)，然后继续创建
        - 生成一个带有 `connections:write` 的 **App-Level Token**（`xapp-...`）
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
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴[示例清单](#manifest-and-scope-checklist)，并在创建前更新 URL
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
        对多账户 HTTP 使用唯一的 webhook 路径

        为每个账户设置不同的 `webhookPath`（默认是 `/slack/events`），以避免注册冲突。
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

<Tabs>
  <Tab title="Socket Mode（默认）">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "OpenClaw 的 Slack 连接器"
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
    "description": "OpenClaw 的 Slack 连接器"
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

展示可扩展上述默认配置的不同功能。

<AccordionGroup>
  <Accordion title="可选的原生斜杠命令">

    可以使用多个[原生斜杠命令](#commands-and-slash-behavior) 来替代单个已配置命令，但有一些细节需要注意：

    - 使用 `/agentstatus` 而不是 `/status`，因为 `/status` 命令是保留的。
    - 同时可用的斜杠命令不能超过 25 个。

    将你现有的 `features.slash_commands` 部分替换为[可用命令](/zh-CN/tools/slash-commands#command-list) 的一个子集：

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
        "description": "列出提供商，或列出某个提供商的模型",
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
        "description": "显示当前智能体此刻可以使用的内容",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "显示运行时状态，包括可用时的提供商使用情况/配额"
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
        "description": "在不更改会话上下文的情况下提出一个附带问题",
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
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
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
        "description": "切换提升模式",
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
        "description": "显示当前智能体此刻可以使用的内容",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "显示运行时状态，包括可用时的提供商使用情况/配额",
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
        "description": "在不更改会话上下文的情况下提出一个附带问题",
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
  <Accordion title="可选的作者身份 scope（写入操作）">
    如果你希望出站消息使用当前智能体身份（自定义用户名和图标），而不是默认的 Slack 应用身份，请添加 `chat:write.customize` bot scope。

    如果你使用表情符号图标，Slack 需要 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选的用户令牌 scope（读取操作）">
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
- 配置中的令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持通过配置设置（没有环境变量回退），且默认采用只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查会跟踪每个凭证的 `*Source` 和 `*Status`
  字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态可以是 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账户通过 SecretRef
  或其他非内联密钥来源完成了配置，但当前命令/运行时路径
  无法解析实际值。
- 在 HTTP 模式下，会包含 `signingSecretStatus`；在 Socket Mode 下，
  所需的配对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于 actions/目录读取，如果已配置，可以优先使用用户令牌。对于写入，仍然优先使用 bot 令牌；只有在 `userTokenReadOnly: false` 且 bot 令牌不可用时，才允许使用用户令牌写入。
</Tip>

## Actions 和 gates

Slack actions 由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的 action 分组：

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

当前 Slack 消息 actions 包括 `send`、`upload-file`、`download-file`、`read`、`edit`、`delete`、`pin`、`unpin`、`list-pins`、`member-info` 和 `emoji-list`。

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
    - 已命名账户在自身 `allowFrom` 未设置时，会继承 `channels.slack.allowFrom`。
    - 已命名账户不会继承 `channels.slack.accounts.default.allowFrom`。

    在私信中配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="渠道策略">
    `channels.slack.groupPolicy` 控制渠道处理：

    - `open`
    - `allowlist`
    - `disabled`

    渠道 allowlist 位于 `channels.slack.channels` 下，并且应使用稳定的渠道 ID。

    运行时说明：如果 `channels.slack` 完全缺失（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

    名称/ID 解析：

    - 渠道 allowlist 条目和私信 allowlist 条目会在启动时解析，前提是令牌访问允许
    - 无法解析的渠道名称条目会按配置保留，但默认会在路由中被忽略
    - 入站授权和渠道路由默认以 ID 优先；直接用户名/slug 匹配需要设置 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及和渠道用户">
    默认情况下，渠道消息受提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每个渠道的控制项（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching` 支持）：

    - `requireMention`
    - `users`（allowlist）
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
- 在线程回复适用时，可创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认是 `thread`；`thread.inheritParent` 默认是 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话开始时获取多少条现有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：设为 `true` 时，会抑制隐式线程提及，因此机器人即使已参与线程，也只会响应线程内显式的 `@bot` 提及。若不启用此项，则在机器人已参与的线程中的回复会绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 分别设置
- 私聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 会禁用 Slack 中**所有**回复线程功能，包括显式的 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中，显式标签在 `"off"` 模式下仍会生效。这个差异反映了平台线程模型的不同：Slack 线程会将消息隐藏在渠道之外，而 Telegram 回复仍会显示在主聊天流中。

## Ack reactions

`ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

说明：

- Slack 需要使用短代码（例如 `"eyes"`）。
- 使用 `""` 可为 Slack 账户或全局禁用该 reaction。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，然后发送最终文本。
- `streaming.preview.toolProgress`：当草稿预览处于活动状态时，将工具/进度更新路由到同一个被编辑的预览消息中（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。

当 `channels.slack.streaming.mode` 为 `partial` 时，`channels.slack.streaming.nativeTransport` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须有可用的回复线程，Slack 原生文本流式传输和 Slack assistant 线程状态才会显示。线程选择仍遵循 `replyToMode`。
- 当原生流式传输不可用时，渠道和群聊根消息仍可使用普通草稿预览。
- 顶层 Slack 私信默认保持非线程形式，因此不会显示线程式预览；如果你希望在那里看到可见进度，请使用线程回复或 `typingReaction`。
- 媒体和非文本负载会回退到普通投递方式。
- 如果流式传输在回复中途失败，OpenClaw 会对剩余负载回退到普通投递方式。

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

## Typing reaction 回退

`typingReaction` 会在 OpenClaw 处理回复期间，向入站 Slack 消息添加一个临时 reaction，并在运行结束时移除它。这在非线程回复场景中特别有用，因为线程回复会使用默认的“is typing...”状态指示器。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 需要使用短代码（例如 `"hourglass_flowing_sand"`）。
- 该 reaction 属于尽力而为行为，在回复完成或失败路径结束后会自动尝试清理。

## 媒体、分块和投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在抓取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认是 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用按段落优先拆分
    - 文件发送使用 Slack 上传 API，并且可以包含线程回复（`thread_ts`）
    - 配置了 `channels.slack.mediaMaxMb` 时，出站媒体上限遵循该值；否则渠道发送使用媒体管道中的 MIME 类型默认值
  </Accordion>

  <Accordion title="投递目标">
    推荐的显式目标：

    - 私信使用 `user:<id>`
    - 渠道使用 `channel:<id>`

    发送到用户目标时，Slack 私信会通过 Slack 会话 API 打开。

  </Accordion>
</AccordionGroup>

## 命令和斜杠行为

斜杠命令在 Slack 中可以表现为单个已配置命令，或多个原生命令。配置 `channels.slack.slashCommand` 可更改命令默认值：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

原生命令需要你在 Slack 应用中添加[其他清单设置](#additional-manifest-settings)，并通过 `channels.slack.commands.native: true` 或全局配置中的 `commands.native: true` 启用。

- Slack 的原生命令自动模式默认为**关闭**，因此 `commands.native: "auto"` 不会启用 Slack 原生命令。

```txt
/help
```

原生参数菜单使用自适应渲染策略，在分发所选选项值之前会先显示确认模态框：

- 最多 5 个选项：按钮区块
- 6-100 个选项：静态选择菜单
- 超过 100 个选项：如果提供 interactivity 选项处理器，则使用带异步选项过滤的外部选择
- 超出 Slack 限制：编码后的选项值会回退为按钮

```txt
/think
```

斜杠会话使用独立键，例如 `agent:<agentId>:slack:slash:<userId>`，同时仍会通过 `CommandTargetSessionKey` 将命令执行路由到目标会话会话。

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

启用后，智能体可以发出仅适用于 Slack 的回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令会编译为 Slack Block Kit，并将点击或选择通过现有的 Slack 交互事件路径路由回来。

说明：

- 这是 Slack 专属 UI。其他渠道不会将 Slack Block Kit 指令转换为它们自己的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明令牌，不是智能体原始编写的值。
- 如果生成的交互式区块会超出 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 负载。

## Slack 中的 Exec 审批

Slack 可以充当原生审批客户端，使用交互式按钮和交互，而不是回退到 Web UI 或终端。

- Exec 审批使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 如果请求已落在 Slack 中，且审批 id 类型为 `plugin:`，插件审批仍可通过同一个 Slack 原生按钮界面完成。
- 审批人授权仍然会被强制执行：只有被识别为审批人的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享审批按钮界面。当你在 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要审批 UX；OpenClaw
仅应在工具结果表明聊天审批不可用，或手动审批是唯一途径时，才包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；在可能时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少解析出一位
审批人时，Slack 会自动启用原生 exec 审批。设为 `enabled: false` 可显式禁用 Slack 作为原生审批客户端。
设为 `enabled: true` 可在审批人可解析时强制启用原生审批。

在没有显式 Slack exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有当你想覆盖审批人、添加过滤器，或
选择加入源聊天投递时，才需要显式的 Slack 原生配置：

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

共享 `approvals.exec` 转发是独立的。仅当 exec 审批提示还必须
路由到其他聊天或显式带外目标时才使用它。共享 `approvals.plugin` 转发同样
是独立的；当这些请求已经到达 Slack 时，Slack 原生按钮仍然可以处理插件审批。

同一聊天中的 `/approve` 在已支持命令的 Slack 渠道和私信中也可使用。完整审批转发模型请参见[Exec 审批](/zh-CN/tools/exec-approvals)。

## 事件和运行行为

- 消息编辑/删除/线程广播会映射为系统事件。
- reaction 添加/移除事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名，以及 pin 添加/移除事件会映射为系统事件。
- 启用 `configWrites` 时，`channel_id_changed` 可以迁移渠道配置键。
- 渠道 topic/purpose 元数据被视为不受信任的上下文，并且可以注入到路由上下文中。
- 在线程起始消息和初始线程历史上下文播种中，会在适用时按配置的发送者 allowlist 进行过滤。
- 区块操作和模态交互会发出结构化的 `Slack interaction: ...` 系统事件，并带有丰富的负载字段：
  - 区块操作：选中值、标签、选择器值，以及 `workflow_*` 元数据
  - 模态 `view_submission` 和 `view_closed` 事件，包含路由后的渠道元数据和表单输入

## 配置参考指针

主要参考：

- [配置参考 - Slack](/zh-CN/gateway/configuration-reference#slack)

  高信号 Slack 字段：
  - 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
  - 兼容性开关：`dangerouslyAllowNameMatching`（紧急兜底开关；除非确有需要，否则保持关闭）
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

  <Accordion title="Socket mode 未连接">
    验证 bot + app 令牌，以及 Slack 应用设置中的 Socket Mode 是否已启用。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，则说明 Slack 账户
    已完成配置，但当前运行时无法解析由 SecretRef 支持的
    实际值。

  </Accordion>

  <Accordion title="HTTP 模式未接收到事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack 请求 URL（事件 + 交互 + 斜杠命令）
    - 每个 HTTP 账户使用唯一的 `webhookPath`

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    则说明 HTTP 账户已完成配置，但当前运行时无法
    解析由 SecretRef 支持的 signing secret 实际值。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    确认你打算使用的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并且在 Slack 中注册了匹配的斜杠命令
    - 或单个斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    同时检查 `commands.useAccessGroups` 以及渠道/用户 allowlist。

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

---
read_when:
    - 设置 Slack 或调试 Slack socket/HTTP 模式时
summary: Slack 设置与运行时行为（Socket Mode + HTTP Request URLs）
title: Slack
x-i18n:
    generated_at: "2026-04-07T00:07:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b8fd2cc6c638ee82069f0af2c2b6f6f49c87da709b941433a0343724a9907ea
    source_path: channels/slack.md
    workflow: 15
---

# Slack

状态：已可用于通过 Slack 应用集成实现私信和渠道。默认模式为 Socket Mode；也支持 HTTP Request URLs。

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

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建新的 Slack 应用">
        在 Slack 应用设置中，点击 **[Create New App](https://api.slack.com/apps/new)** 按钮：

        - 选择 **from a manifest**，并为你的应用选择一个工作区
        - 粘贴下方的[示例清单](#manifest-and-scope-checklist)，然后继续创建
        - 生成带有 `connections:write` 权限的 **App-Level Token**（`xapp-...`）
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

  <Tab title="HTTP Request URLs">
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
        为多账户 HTTP 使用唯一的 webhook 路径

        为每个账户分配不同的 `webhookPath`（默认是 `/slack/events`），以避免注册冲突。
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

## 清单与作用域检查清单

<Tabs>
  <Tab title="Socket Mode（默认）">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

<AccordionGroup>
  <Accordion title="可选作者身份作用域（写入操作）">
    如果你希望发出的消息使用当前智能体身份（自定义用户名和图标），而不是默认的 Slack 应用身份，请添加 `chat:write.customize` bot scope。

    如果你使用 emoji 图标，Slack 要求采用 `:emoji_name:` 语法。

  </Accordion>
  <Accordion title="可选用户令牌作用域（读取操作）">
    如果你配置了 `channels.slack.userToken`，典型的读取作用域包括：

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
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 支持明文字符串或 SecretRef 对象。
- 配置中的令牌会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持通过配置提供（无环境变量回退），并默认采用只读行为（`userTokenReadOnly: true`）。

状态快照行为：

- Slack 账户检查会跟踪每个凭证的 `*Source` 和 `*Status` 字段（`botToken`、`appToken`、`signingSecret`、`userToken`）。
- 状态值可以是 `available`、`configured_unavailable` 或 `missing`。
- `configured_unavailable` 表示该账户通过 SecretRef 或其他非内联密钥源完成了配置，但当前命令或运行时路径无法解析实际值。
- 在 HTTP 模式下会包含 `signingSecretStatus`；在 Socket Mode 下，必需的令牌对是 `botTokenStatus` + `appTokenStatus`。

<Tip>
对于 actions/目录读取，如果配置了用户令牌，则可以优先使用用户令牌。对于写入操作，仍优先使用 bot 令牌；只有在 `userTokenReadOnly: false` 且 bot 令牌不可用时，才允许使用用户令牌写入。
</Tip>

## 操作与门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作分组：

| 分组      | 默认值 |
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

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`（推荐）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM 允许列表）

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

    渠道允许列表位于 `channels.slack.channels` 下，应使用稳定的渠道 ID。

    运行时说明：如果 `channels.slack` 完全缺失（仅使用环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy` 也是如此）。

    名称/ID 解析：

    - 在令牌访问允许的情况下，渠道允许列表条目和私信允许列表条目会在启动时解析
    - 无法解析的渠道名条目会按配置保留，但默认在路由时被忽略
    - 入站授权和渠道路由默认优先使用 ID；直接的用户名/slug 匹配要求设置 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及与渠道用户">
    渠道消息默认受提及门控控制。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复 bot 线程行为（当 `thread.requireExplicitMention` 为 `true` 时禁用）

    每个渠道的控制项（`channels.slack.channels.<id>`；名称仅可通过启动解析或 `dangerouslyAllowNameMatching` 使用）：

    - `requireMention`
    - `users`（允许列表）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版未加前缀的键仍仅映射到 `id:`）

  </Tab>
</Tabs>

## 线程、会话与回复标签

- 私信路由为 `direct`；渠道为 `channel`；MPIM 为 `group`。
- 在默认 `session.dmScope=main` 下，Slack 私信会折叠到智能体主会话。
- 渠道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复在适用时可创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认是 `thread`；`thread.inheritParent` 默认是 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话开始时获取多少已有线程消息（默认 `20`；设为 `0` 可禁用）。
- `channels.slack.thread.requireExplicitMention`（默认 `false`）：设为 `true` 时，会抑制隐式线程提及，因此 bot 只会响应线程中的显式 `@bot` 提及，即使 bot 已经参与了该线程。若不启用此项，在 bot 已参与的线程中回复将绕过 `requireMention` 门控。

回复线程控制：

- `channels.slack.replyToMode`: `off|first|all|batched`（默认 `off`）
- `channels.slack.replyToModeByChatType`: 按 `direct|group|channel` 分别设置
- 私聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 会禁用 Slack 中**所有**回复线程能力，包括显式的 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中，显式标签在 `"off"` 模式下仍会生效。这种差异反映了平台的线程模型：Slack 线程会把消息隐藏在渠道之外，而 Telegram 回复仍会显示在主聊天流中。

## 确认反应

`ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

说明：

- Slack 需要使用 shortcode（例如 `"eyes"`）。
- 使用 `""` 可为该 Slack 账户或全局禁用该反应。

## 文本流式传输

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：追加分块预览更新。
- `progress`：生成期间显示进度状态文本，然后发送最终文本。

当 `streaming` 为 `partial` 时，`channels.slack.nativeStreaming` 控制 Slack 原生文本流式传输（默认：`true`）。

- 必须存在回复线程，原生文本流式传输才会显示。线程选择仍遵循 `replyToMode`。如果没有线程，则会使用普通草稿预览。
- 媒体和非文本负载会回退到普通投递方式。
- 如果流式传输在回复中途失败，OpenClaw 会将剩余负载回退为普通投递。

使用草稿预览而不是 Slack 原生文本流式传输：

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

旧版键：

- `channels.slack.streamMode`（`replace | status_final | append`）会自动迁移到 `channels.slack.streaming`。
- 布尔值 `channels.slack.streaming` 会自动迁移到 `channels.slack.nativeStreaming`。

## 输入中反应回退

`typingReaction` 会在 OpenClaw 处理回复期间，为入站 Slack 消息添加一个临时反应，并在本次运行结束时移除。它在线程回复之外最有用，因为线程回复默认使用 “is typing...” 状态指示。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

说明：

- Slack 需要使用 shortcode（例如 `"hourglass_flowing_sand"`）。
- 该反应采用尽力而为方式，且在回复或失败路径完成后会自动尝试清理。

## 媒体、分块与投递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件会从 Slack 托管的私有 URL 下载（基于令牌认证的请求流程），并在抓取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本与文件">
    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用按段落优先拆分
    - 文件发送使用 Slack 上传 API，并可包含线程回复（`thread_ts`）
    - 如果配置了 `channels.slack.mediaMaxMb`，出站媒体上限遵循该值；否则渠道发送使用媒体流水线中的 MIME 类型默认值
  </Accordion>

  <Accordion title="投递目标">
    推荐使用显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于渠道

    发送到用户目标时，Slack 私信会通过 Slack 会话 API 打开。

  </Accordion>
</AccordionGroup>

## 命令与斜杠行为

- Slack 的原生命令自动模式默认**关闭**（`commands.native: "auto"` 不会启用 Slack 原生命令）。
- 使用 `channels.slack.commands.native: true`（或全局 `commands.native: true`）启用 Slack 原生命令处理器。
- 启用原生命令后，在 Slack 中注册匹配的斜杠命令（`/<command>` 名称），但有一个例外：
  - 为状态命令注册 `/agentstatus`（Slack 保留 `/status`）
- 如果未启用原生命令，你可以通过 `channels.slack.slashCommand` 运行一个已配置的单一斜杠命令。
- 原生参数菜单现在会自适应其渲染策略：
  - 最多 5 个选项：按钮块
  - 6-100 个选项：静态选择菜单
  - 超过 100 个选项：当可用 interactivity 选项处理器时，使用带异步选项过滤的外部选择
  - 如果编码后的选项值超出 Slack 限制，该流程会回退为按钮
- 对于较长的选项负载，斜杠命令参数菜单会在分发所选值之前显示确认对话框。

默认斜杠命令设置：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

斜杠会话使用隔离键：

- `agent:<agentId>:slack:slash:<userId>`

并且仍会根据目标会话键（`CommandTargetSessionKey`）对目标会话执行命令路由。

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

或者仅为某个 Slack 账户启用：

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

这些指令会编译为 Slack Block Kit，并将点击或选择通过现有 Slack 交互事件路径路由回来。

说明：

- 这是 Slack 专用 UI。其他渠道不会将 Slack Block Kit 指令翻译为它们自己的按钮系统。
- 交互回调值是 OpenClaw 生成的不透明令牌，不是智能体编写的原始值。
- 如果生成的交互块会超出 Slack Block Kit 限制，OpenClaw 会回退为原始文本回复，而不是发送无效的 blocks 负载。

## Slack 中的 Exec 审批

Slack 可以作为原生审批客户端，使用交互式按钮和交互，而不是回退到 Web UI 或终端。

- Exec 审批使用 `channels.slack.execApprovals.*` 进行原生私信/渠道路由。
- 当请求已落在 Slack 中且审批 ID 类型为 `plugin:` 时，插件审批仍可通过同样的 Slack 原生按钮界面完成。
- 审批人授权仍会被强制执行：只有被识别为审批人的用户才能通过 Slack 批准或拒绝请求。

这使用与其他渠道相同的共享审批按钮界面。当你在 Slack 应用设置中启用 `interactivity` 时，审批提示会直接在会话中渲染为 Block Kit 按钮。
当这些按钮存在时，它们就是主要的审批 UX；只有当工具结果表明聊天审批不可用或手动审批是唯一途径时，OpenClaw 才应包含手动 `/approve` 命令。

配置路径：

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers`（可选；在可能时回退到 `commands.ownerAllowFrom`）
- `channels.slack.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`

当 `enabled` 未设置或为 `"auto"`，且至少解析出一位审批人时，Slack 会自动启用原生 exec 审批。设置 `enabled: false` 可显式禁用 Slack 作为原生审批客户端。
设置 `enabled: true` 可在审批人成功解析时强制启用原生审批。

没有显式 Slack exec 审批配置时的默认行为：

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

只有当你想覆盖审批人、添加筛选器或启用源聊天投递时，才需要显式的 Slack 原生配置：

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

共享的 `approvals.exec` 转发是独立的。只有当 exec 审批提示还必须路由到其他聊天或显式的带外目标时，才使用它。共享的 `approvals.plugin` 转发同样独立；当这些请求已经落在 Slack 中时，Slack 原生按钮仍可完成插件审批。

同一聊天中的 `/approve` 也可在已支持命令的 Slack 渠道和私信中使用。完整审批转发模型请参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

## 事件与运行行为

- 消息编辑/删除/线程广播会映射为系统事件。
- 反应添加/移除事件会映射为系统事件。
- 成员加入/离开、渠道创建/重命名以及置顶添加/移除事件会映射为系统事件。
- 当启用 `configWrites` 时，`channel_id_changed` 可迁移渠道配置键。
- 渠道 topic/purpose 元数据被视为不可信上下文，并可注入路由上下文。
- 在线程发起者和初始线程历史上下文填充时，会在适用情况下按已配置的发送者允许列表进行过滤。
- Block actions 和 modal 交互会发出结构化的 `Slack interaction: ...` 系统事件，并包含丰富的负载字段：
  - block actions：所选值、标签、选择器值以及 `workflow_*` 元数据
  - modal `view_submission` 和 `view_closed` 事件，带有已路由的渠道元数据和表单输入

## 配置参考指针

主要参考：

- [配置参考 - Slack](/zh-CN/gateway/configuration-reference#slack)

  高信号的 Slack 字段：
  - 模式/凭证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
  - 兼容性开关：`dangerouslyAllowNameMatching`（破玻璃开关；除非确有需要，否则保持关闭）
  - 渠道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
  - 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
  - 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`streaming`、`nativeStreaming`
  - 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

## 故障排除

<AccordionGroup>
  <Accordion title="渠道中没有回复">
    按顺序检查：

    - `groupPolicy`
    - 渠道允许列表（`channels.slack.channels`）
    - `requireMention`
    - 每个渠道的 `users` 允许列表

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

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode 未连接">
    验证 bot 与 app 令牌，以及 Slack 应用设置中的 Socket Mode 是否已启用。

    如果 `openclaw channels status --probe --json` 显示 `botTokenStatus` 或
    `appTokenStatus: "configured_unavailable"`，说明 Slack 账户已配置，
    但当前运行时无法解析由 SecretRef 支持的实际值。

  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - signing secret
    - webhook 路径
    - Slack Request URLs（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户使用唯一的 `webhookPath`

    如果账户快照中出现 `signingSecretStatus: "configured_unavailable"`，
    说明该 HTTP 账户已配置，但当前运行时无法解析由 SecretRef 支持的 signing secret。

  </Accordion>

  <Accordion title="原生/斜杠命令未触发">
    请确认你想要的是：

    - 原生命令模式（`channels.slack.commands.native: true`），并在 Slack 中注册匹配的斜杠命令
    - 或单一斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    还要检查 `commands.useAccessGroups` 以及渠道/用户允许列表。

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

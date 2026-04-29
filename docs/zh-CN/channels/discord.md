---
read_when:
    - 正在开发 Discord 渠道功能
summary: Discord 机器人支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-04-29T05:38:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f25e1e1ed36d9f6f943cdf155d8cab08f031fcaab67477acf04ea7f18f694ec7
    source_path: channels/discord.md
    workflow: 16
---

已准备好通过官方 Discord Gateway 网关用于私信和公会频道。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认使用配对模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

你需要创建一个带有机器人的新应用，将机器人添加到你的服务器，并将它与 OpenClaw 配对。我们建议把机器人添加到你自己的私人服务器。如果你还没有服务器，[先创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="Create a Discord application and bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然后点击 **New Application**。将其命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设为你给 OpenClaw 智能体起的任意名称。

  </Step>

  <Step title="Enable privileged intents">
    仍在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色 allowlist 和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅在需要在线状态更新时需要）

  </Step>

  <Step title="Copy your bot token">
    回到 **Bot** 页面顶部并点击 **Reset Token**。

    <Note>
    尽管名称如此，这会生成你的第一个 token，并没有真正“重置”任何内容。
    </Note>

    复制该 token 并保存到某处。这是你的 **Bot Token**，稍后会用到。

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用来把机器人添加到你的服务器。

    向下滚动到 **OAuth2 URL Generator** 并启用：

    - `bot`
    - `applications.commands`

    下方会出现 **Bot Permissions** 部分。至少启用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基线权限集。如果你计划在 Discord 线程中发帖，包括会创建或继续线程的论坛或媒体频道工作流，也请启用 **Send Messages in Threads**。
    复制底部生成的 URL，将其粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    回到 Discord 应用，你需要启用开发者模式，这样才能复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 在侧边栏中右键点击你的 **server icon** → **Copy Server ID**
    3. 右键点击你自己的 **own avatar** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存，下一步你会把这三项都发送给 OpenClaw。

  </Step>

  <Step title="Allow DMs from server members">
    为了让配对正常工作，Discord 需要允许你的机器人给你发送私信。右键点击你的 **server icon** → **Privacy Settings** → 打开 **Direct Messages**。

    这会允许服务器成员（包括机器人）向你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持此项启用。如果你只计划使用公会频道，可以在配对后禁用私信。

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    你的 Discord 机器人 token 是机密信息（类似密码）。在给智能体发消息之前，先在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请从存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将该变量存储在 `~/.openclaw/.env` 中，这样服务在重启后就能解析 env SecretRef。

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        在任何现有渠道（例如 Telegram）与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / config 标签页。

        > “我已经在配置中设置了 Discord 机器人 token。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
      </Tab>
      <Tab title="CLI / config">
        如果你更喜欢基于文件的配置，请设置：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        默认账户的 env 回退：

```bash
DISCORD_BOT_TOKEN=...
```

        支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。参见 [Secrets Management](/zh-CN/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approve first DM pairing">
    等到 Gateway 网关运行后，在 Discord 中私信你的机器人。它会返回一个配对码。

    <Tabs>
      <Tab title="Ask your agent">
        在现有渠道上把配对码发送给你的智能体：

        > “批准这个 Discord 配对码：`<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配对码将在 1 小时后过期。

    现在你应该可以通过 Discord 私信与你的智能体聊天。

  </Step>
</Steps>

<Note>
Token 解析是账户感知的。配置 token 值优先于 env 回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
如果两个已启用的 Discord 账户解析到同一个机器人 token，OpenClaw 只会为该 token 启动一个 Gateway 网关监视器。来自配置的 token 优先于默认 env 回退；否则第一个启用的账户胜出，重复账户会被报告为已禁用。
对于高级出站调用（message 工具/渠道操作），显式的逐调用 `token` 会用于该调用。这适用于发送和读取/探测风格的操作（例如 read/search/fetch/thread/pins/permissions）。账户策略/重试设置仍来自活动运行时快照中的所选账户。
</Note>

## 推荐：设置公会工作区

私信可用后，你可以将 Discord 服务器设置为完整工作区，其中每个频道都有自己的智能体会话和上下文。对于只有你和机器人的私人服务器，推荐这样做。

<Steps>
  <Step title="Add your server to the guild allowlist">
    这会让你的智能体可以在服务器上的任意频道中响应，而不只是私信。

    <Tabs>
      <Tab title="Ask your agent">
        > “将我的 Discord Server ID `<server_id>` 添加到公会 allowlist”
      </Tab>
      <Tab title="Config">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Allow responses without @mention">
    默认情况下，你的智能体只有在公会频道中被 @提及时才会响应。对于私人服务器，你可能希望它响应每条消息。

    在公会频道中，普通 assistant 最终回复默认保持私有。可见的 Discord 输出必须通过 `message` 工具显式发送，因此智能体可以默认旁观，只在认为频道回复有用时发帖。

    <Tabs>
      <Tab title="Ask your agent">
        > “允许我的智能体在此服务器上无需 @提及也能响应”
      </Tab>
      <Tab title="Config">
        在你的公会配置中设置 `requireMention: false`：

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        要为群组/频道房间恢复旧版自动最终回复，请设置 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。公会频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="Ask your agent">
        > “当我在 Discord 频道中提问时，如果你需要 MEMORY.md 中的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="Manual">
        如果你需要在每个频道中共享上下文，请将稳定指令放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话）。将长期笔记保存在 `MEMORY.md` 中，并按需使用 memory 工具访问它们。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些频道并开始聊天。你的智能体可以看到频道名称，并且每个频道都有自己的隔离会话，所以你可以设置 `#coding`、`#home`、`#research`，或任何适合你工作流的频道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站会回复到 Discord。
- Discord 公会/频道元数据会作为不受信任的上下文添加到模型提示中，而不是作为用户可见的回复前缀。如果模型把该包络复制回来，OpenClaw 会从出站回复和未来的重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 公会频道是隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组私信默认会被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 到被路由的对话会话。
- 仅文本的 cron/heartbeat 到 Discord 的公告投递会使用一次最终的 assistant 可见答案。媒体和结构化组件载荷在智能体发出多个可投递载荷时仍保持多消息。

## 论坛频道

Discord 论坛和媒体频道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父频道（`channel:<forumId>`）发送消息以自动创建线程。线程标题使用你消息中的第一个非空行。
- 使用 `openclaw message thread create` 直接创建线程。不要为论坛频道传递 `--message-id`。

示例：发送到论坛父频道以创建线程

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建论坛线程

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

论坛父频道不接受 Discord 组件。如果你需要组件，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持用于智能体消息的 Discord components v2 容器。请使用带有 `components` 负载的消息工具。交互结果会作为普通入站消息路由回智能体，并遵循现有 Discord `replyToMode` 设置。

支持的区块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择菜单和表单被多次使用，直到它们过期。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到一条临时拒绝消息。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，其中包含提供商、模型和兼容运行时下拉菜单，以及一个提交步骤。`/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。选择器回复是临时的，且只有调用用户可以使用它。

文件附件：

- `file` 区块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件请使用 `media-gallery`
- 当上传名称应与附件引用匹配时，使用 `filename` 覆盖上传名称

模态表单：

- 添加包含最多 5 个字段的 `components.modal`
- 字段类型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 会自动添加触发按钮

示例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` 控制私信访问（旧版：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果私信策略不是开放的，未知用户会被阻止（或在 `pairing` 模式下被提示配对）。

    多账号优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账号。
    - 命名账号在自身未设置 `allowFrom` 时继承 `channels.discord.allowFrom`。
    - 命名账号不会继承 `channels.discord.accounts.default.allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    纯数字 ID 存在歧义，会被拒绝，除非提供了明确的用户/渠道目标类型。

  </Tab>

  <Tab title="Guild policy">
    Guild 处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当 `channels.discord` 存在时，安全基线为 `allowlist`。

    `allowlist` 行为：

    - guild 必须匹配 `channels.discord.guilds`（首选 `id`，也接受 slug）
    - 可选发送者允许列表：`users`（推荐使用稳定 ID）和 `roles`（仅角色 ID）；如果任一项已配置，发送者匹配 `users` 或 `roles` 时会被允许
    - 默认禁用直接名称/标签匹配；仅在破除限制的兼容模式下启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果 guild 配置了 `channels`，未列出的渠道会被拒绝
    - 如果 guild 没有 `channels` 区块，则该允许列表 guild 中的所有渠道都被允许

    示例：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    如果你只设置了 `DISCORD_BOT_TOKEN`，并且没有创建 `channels.discord` 区块，运行时回退会是 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild 消息默认受提及门控。

    提及检测包括：

    - 显式机器人提及
    - 已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 受支持情况下的隐式回复机器人行为

    `requireMention` 按 guild/渠道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃提及其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可通过 `dm.groupChannels` 设置可选允许列表（渠道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord guild 成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并在对等或父对等绑定之后、仅 guild 绑定之前求值。如果某个绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），所有已配置字段都必须匹配。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## 原生命令和命令身份验证

- `commands.native` 默认为 `"auto"`，并为 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会显式清除之前注册的 Discord 原生命令。
- 原生命令身份验证使用与普通消息处理相同的 Discord 允许列表/策略。
- 对未授权用户，命令仍可能在 Discord UI 中可见；执行时仍会强制执行 OpenClaw 身份验证，并返回“未授权”。

请参阅[斜杠命令](/zh-CN/tools/slash-commands)了解命令目录和行为。

默认斜杠命令设置：

- `ephemeral: true`

## 功能详情

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord 在智能体输出中支持回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`
    - `batched`

    注意：`off` 会禁用隐式回复线程化。显式 `[[reply_to_*]]` 标签仍会被遵循。
    `first` 始终将隐式原生回复引用附加到本轮的第一条出站 Discord 消息。
    `batched` 仅当入站轮次是多条消息的防抖批次时，才附加 Discord 的隐式原生回复引用。这在你主要希望为含糊的突发聊天提供原生回复，而不是为每个单消息轮次都提供原生回复时很有用。

    消息 ID 会暴露在上下文/历史记录中，因此智能体可以定位特定消息。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑该消息来流式传输草稿回复。`channels.discord.streaming` 接受 `off`（默认）| `partial` | `block` | `progress`。`progress` 在 Discord 上映射到 `partial`；`streamMode` 是旧版别名，会自动迁移。

    默认保持 `off`，因为当多个机器人或 Gateway 网关共享一个账号时，Discord 预览编辑会很快触发速率限制。

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` 会在令牌到达时编辑一条预览消息。
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并被限制到 `textChunkLimit`）。
    - 媒体、错误和显式回复的最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。

    预览流式传输仅支持文本；媒体回复会回退到普通投递。当显式启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Guild 历史上下文：

    - `channels.discord.historyLimit` 默认值 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话会将父渠道的会话级 `/model` 选择作为仅模型回退继承；线程本地 `/model` 选择仍优先，并且不会复制父会话记录历史，除非已启用会话记录继承。
    - `channels.discord.thread.inheritParent`（默认 `false`）会让新的自动线程选择从父会话记录播种。按账号覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 消息工具反应可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    渠道主题会作为**不受信任**的上下文注入。允许列表会限制谁可以触发智能体，但不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以将线程绑定到会话目标，因此该线程中的后续消息会继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 查看/更新聚焦绑定的不活动自动取消聚焦时间
    - `/session max-age <duration|off>` 查看/更新聚焦绑定的硬性最大时长

    配置：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    备注：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSubagentSessions` 必须为 true，才能为 `sessions_spawn({ thread: true })` 自动创建/绑定话题。
    - `spawnAcpSessions` 必须为 true，才能为 ACP（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）自动创建/绑定话题。
    - 如果某个账号禁用了话题绑定，`/focus` 和相关的话题绑定操作将不可用。

    参见[子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents)和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 渠道绑定">
    对于稳定的“始终在线”ACP 工作区，请配置顶层类型化 ACP 绑定，并将其指向 Discord 对话。

    配置路径：

    - `bindings[]`，其中包含 `type: "acp"` 和 `match.channel: "discord"`

    示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注意：

    - `/acp spawn codex --bind here` 会就地绑定当前频道或话题，并让未来消息保持在同一个 ACP 会话中。话题消息会继承父频道绑定。
    - 在已绑定的频道或话题中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话。临时话题绑定在激活期间可以覆盖目标解析。
    - 仅当 OpenClaw 需要通过 `--thread auto|here` 创建/绑定子话题时，才需要 `spawnAcpSessions`。

    有关绑定行为详情，请参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

  </Accordion>

  <Accordion title="反应通知">
    按服务器设置反应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反应事件会被转换为系统事件，并附加到已路由的 Discord 会话。

  </Accordion>

  <Accordion title="确认反应">
    `ackReaction` 会在 OpenClaw 处理传入消息时发送一个确认表情符号。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退值（`agents.list[].identity.emoji`，否则为 "👀"）

    注意：

    - Discord 接受 Unicode 表情符号或自定义表情名称。
    - 使用 `""` 可禁用某个渠道或账号的反应。

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。

    这会影响 `/config set|unset` 流程（当命令功能已启用时）。

    禁用：

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway 网关代理">
    使用 `channels.discord.proxy` 通过 HTTP(S) 代理路由 Discord Gateway 网关 WebSocket 流量和启动时的 REST 查询（应用 ID + allowlist 解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    按账号覆盖：

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit 支持">
    启用 PluralKit 解析，将代理消息映射到系统成员身份：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    注意：

    - allowlist 可以使用 `pk:<memberId>`
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名称
    - 查询使用原始消息 ID，并受时间窗口限制
    - 如果查询失败，代理消息会被视为 bot 消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="在线状态配置">
    当你设置 Status 或活动字段，或启用自动在线状态时，会应用在线状态更新。

    仅 Status 示例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活动示例（自定义 Status 是默认活动类型）：

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    流式传输示例：

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活动类型映射：

    - 0：正在玩
    - 1：正在流式传输（需要 `activityUrl`）
    - 2：正在听
    - 3：正在观看
    - 4：自定义（使用活动文本作为 Status 状态；表情符号可选）
    - 5：正在竞赛

    自动在线状态示例（运行时健康信号）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    自动在线状态会将运行时可用性映射到 Discord Status：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中基于按钮处理审批，并且可以选择在发起渠道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少能从 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出一个审批人时，Discord 会自动启用原生 exec 审批。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断 exec 审批人。设置 `enabled: false` 可明确禁用 Discord 作为原生审批客户端。

    对于 `/diagnostics` 和 `/export-trajectory` 等敏感的仅 owner 群组命令，OpenClaw 会私下发送审批提示和最终结果。当调用的 owner 有 Discord owner 路由时，它会先尝试 Discord 私信；如果不可用，则回退到 `commands.ownerAllowFrom` 中第一个可用的 owner 路由，例如 Telegram。

    当 `target` 为 `channel` 或 `both` 时，审批提示会在频道中可见。只有已解析的审批人可以使用按钮；其他用户会收到临时拒绝。审批提示包含命令文本，因此只应在受信任的频道中启用频道投递。如果无法从会话键派生频道 ID，OpenClaw 会回退到私信投递。

    Discord 还会渲染其他聊天渠道使用的共享审批按钮。原生 Discord 适配器主要添加审批人私信路由和频道扇出。
    当这些按钮存在时，它们是主要审批 UX；只有当工具结果表明聊天审批不可用，或手动审批是唯一路径时，OpenClaw
    才应包含手动 `/approve` 命令。
    如果 Discord 原生审批运行时未激活，OpenClaw 会保持本地确定性的 `/approve <id> <decision>` 提示可见。如果
    运行时已激活，但原生卡片无法投递到任何目标，OpenClaw 会发送同一聊天回退通知，其中包含待处理审批中的确切 `/approve`
    命令。

    Gateway 网关身份验证和审批解析遵循共享 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。审批默认在 30 分钟后过期。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门禁

Discord 消息操作包括消息传递、频道管理、审核、在线状态和元数据操作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径），用于设置预定事件封面图。

操作门禁位于 `channels.discord.actions.*` 下。

默认门禁行为：

| 操作组                                                                                                                                                                   | 默认值 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已启用 |
| roles                                                                                                                                                                    | 已禁用 |
| moderation                                                                                                                                                               | 已禁用 |
| presence                                                                                                                                                                 | 已禁用 |

## 组件 v2 UI

OpenClaw 使用 Discord 组件 v2 处理 exec 审批和跨上下文标记。Discord 消息操作也可以接受 `components` 来实现自定义 UI（高级；需要通过 discord 工具构造组件载荷），而旧版 `embeds` 仍然可用，但不推荐使用。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账号设置。
- 当存在组件 v2 时，会忽略 `embeds`。

示例：

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 语音

Discord 有两个不同的语音表面：实时**语音频道**（连续对话）和**语音消息附件**（波形预览格式）。Gateway 网关同时支持两者。

### 语音频道

设置清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户 allowlist 时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 作用域邀请 bot。
4. 在目标语音频道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账号默认智能体，并遵循与其他 Discord 命令相同的 allowlist 和群组策略规则。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

自动加入示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

说明：

- `voice.tts` 仅覆盖语音播放的 `messages.tts`。
- `voice.model` 仅覆盖用于 Discord 语音渠道响应的 LLM。保持未设置即可继承路由后的智能体模型。
- STT 使用 `tools.media.audio`；`voice.model` 不影响转录。
- 语音转录轮次从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态；非所有者发言者不能访问仅限所有者的工具（例如 `gateway` 和 `cron`）。
- 语音默认启用；设置 `channels.discord.voice.enabled=false` 可禁用语音运行时和 `GuildVoiceStates` Gateway 网关意图。
- `channels.discord.intents.voiceStates` 可以显式覆盖语音状态意图订阅。保持未设置可让该意图跟随 `voice.enabled`。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 的默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还会监视接收解密失败，并在短时间窗口内重复失败后通过离开并重新加入语音渠道来自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 版本线包含来自 discord.js PR #11449 的上游填充修复，该修复关闭了 discord.js issue #11419。

语音渠道流水线：

- Discord PCM 捕获会转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录文本会通过常规 Discord 入口和路由发送。
- 设置 `voice.model` 后，它仅覆盖此语音渠道轮次的响应 LLM。
- `voice.tts` 会合并到 `messages.tts` 之上；生成的音频会在已加入的渠道中播放。

凭证按组件解析：`voice.model` 的 LLM 路由认证、`tools.media.audio` 的 STT 认证，以及 `messages.tts`/`voice.tts` 的 TTS 认证。

### 语音消息

Discord 语音消息会显示波形预览，并要求使用 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上有 `ffmpeg` 和 `ffprobe` 来检查和转换。

- 提供**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 会拒绝在同一 payload 中同时包含文本和语音消息）。
- 接受任何音频格式；OpenClaw 会按需转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的意图，或机器人看不到服务器消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 更改意图后重启 Gateway 网关

  </Accordion>

  <Accordion title="服务器消息意外被阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的服务器允许列表
    - 如果存在服务器 `channels` 映射，则只允许列出的渠道
    - 验证 `requireMention` 行为和提及模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 为 false 但仍被阻止">
    常见原因：

    - `groupPolicy="allowlist"` 但没有匹配的服务器/渠道允许列表
    - `requireMention` 配置在了错误位置（必须位于 `channels.discord.guilds` 或渠道条目下）
    - 发送者被服务器/渠道 `users` 允许列表阻止

  </Accordion>

  <Accordion title="长时间运行的 Discord 轮次或重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Carbon Gateway 网关队列旋钮：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这只控制 Carbon Gateway 网关监听器工作，而不是智能体轮次生命周期

    Discord 不会对排队的智能体轮次应用渠道拥有的超时。消息监听器会立即移交，排队的 Discord 运行会保持每个会话的顺序，直到会话/工具/运行时生命周期完成或中止工作。

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway 网关元数据查找超时警告">
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。临时失败会回退到 Discord 的默认 Gateway 网关 URL，并在日志中进行速率限制。

    元数据超时旋钮：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字渠道 ID。

    如果你使用 slug 键，运行时匹配仍可工作，但 probe 无法完全验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人循环">
    默认情况下，会忽略机器人编写的消息。

    如果你设置了 `channels.discord.allowBots=true`，请使用严格的提及和允许列表规则来避免循环行为。
    优先使用 `channels.discord.allowBots="mentions"`，仅接受提及该机器人的机器人消息。

  </Accordion>

  <Accordion title="Voice STT 因 DecryptionFailed(...) 丢弃">

    - 保持 OpenClaw 为当前版本（`openclaw update`），以便具备 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调整
    - 查看日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后失败仍持续，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行对比

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[配置参考 - Discord](/zh-CN/gateway/config-channels#discord)。

<Accordion title="高信号 Discord 字段">

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- Gateway 网关元数据：`gatewayInfoTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`（限制出站 Discord 上传，默认 `100MB`）、`retry`
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全与运维

- 将机器人令牌视为机密（在受监管环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态已过期，请重启 Gateway 网关并使用 `openclaw channels status --probe` 重新检查。

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Discord 用户配对到 Gateway 网关。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群聊和允许列表行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将服务器和渠道映射到智能体。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>

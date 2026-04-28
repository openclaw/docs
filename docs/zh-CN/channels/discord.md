---
read_when:
    - 开发 Discord 渠道功能
summary: Discord 机器人支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-04-28T18:43:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: af9ce1f825f47c5945aaaa1a7ae72e13679d298384bc34d3c7a63003b0206a3e
    source_path: channels/discord.md
    workflow: 16
---

可通过官方 Discord Gateway 网关使用私信和服务器渠道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

你需要创建一个带机器人的新应用，将机器人添加到你的服务器，并将它与 OpenClaw 配对。我们建议将机器人添加到你自己的私有服务器。如果你还没有服务器，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，点击 **New Application**。将它命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你给 OpenClaw 智能体起的名称。

  </Step>

  <Step title="启用特权意图">
    仍在 **Bot** 页面上，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色允许列表和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅在需要在线状态更新时需要）

  </Step>

  <Step title="复制你的机器人令牌">
    在 **Bot** 页面向上滚动回来，点击 **Reset Token**。

    <Note>
    尽管名称如此，这会生成你的第一个令牌，没有任何内容会被“重置”。
    </Note>

    复制该令牌并保存在某处。这是你的 **Bot Token**，稍后会用到它。

  </Step>

  <Step title="生成邀请 URL 并将机器人添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用于将机器人添加到你的服务器。

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

    这是普通文本渠道的基线权限集。如果你计划在 Discord 线程中发帖，包括创建或继续线程的论坛或媒体渠道工作流，也请启用 **Send Messages in Threads**。
    复制底部生成的 URL，将其粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="启用开发者模式并收集你的 ID">
    回到 Discord 应用，你需要启用开发者模式，以便复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 右键点击侧边栏中的**服务器图标** → **Copy Server ID**
    3. 右键点击你**自己的头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 保存在一起，下一步会将这三者都发送给 OpenClaw。

  </Step>

  <Step title="允许来自服务器成员的私信">
    要让配对工作，Discord 需要允许你的机器人给你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 打开 **Direct Messages**。

    这会允许服务器成员（包括机器人）给你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持此项启用。如果你只计划使用服务器渠道，可以在配对后禁用私信。

  </Step>

  <Step title="安全设置你的机器人令牌（不要在聊天中发送）">
    你的 Discord 机器人令牌是机密（类似密码）。在给智能体发消息之前，请在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请在存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将变量存储在 `~/.openclaw/.env` 中，以便服务在重启后解析 env SecretRef。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何现有渠道（例如 Telegram）与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / 配置标签页。

        > “我已经在配置中设置了 Discord 机器人令牌。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
      </Tab>
      <Tab title="CLI / 配置">
        如果你偏好基于文件的配置，请设置：

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

        默认账号的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```

        支持明文 `token` 值。对于 `channels.discord.token`，也支持跨 env/file/exec 提供商的 SecretRef 值。参见[密钥管理](/zh-CN/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准第一次私信配对">
    等到 Gateway 网关运行后，在 Discord 中给你的机器人发送私信。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        在你的现有渠道中将配对码发送给智能体：

        > “批准这个 Discord 配对码：`<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配对码会在 1 小时后过期。

    现在你应该可以通过私信在 Discord 中与你的智能体聊天。

  </Step>
</Steps>

<Note>
令牌解析会感知账号。配置中的令牌值优先于环境变量回退。`DISCORD_BOT_TOKEN` 只用于默认账号。
对于高级出站调用（消息工具/渠道操作），显式的逐调用 `token` 会用于该调用。这适用于发送和读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账号策略/重试设置仍来自活动运行时快照中选定的账号。
</Note>

## 推荐：设置服务器工作区

私信可用后，你可以将 Discord 服务器设置为完整工作区，其中每个渠道都有自己的智能体会话和上下文。对于只有你和机器人的私有服务器，建议这样做。

<Steps>
  <Step title="将你的服务器添加到服务器允许列表">
    这会允许你的智能体在服务器上的任何渠道中响应，而不只是私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “将我的 Discord Server ID `<server_id>` 添加到服务器允许列表”
      </Tab>
      <Tab title="配置">

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

  <Step title="允许无需 @提及即可响应">
    默认情况下，只有在服务器渠道中被 @提及时，你的智能体才会响应。对于私有服务器，你可能希望它响应每条消息。

    在服务器渠道中，普通助手最终回复默认保持私密。可见的 Discord 输出必须通过 `message` 工具显式发送，因此智能体可以默认旁观，只在判断渠道回复有用时才发帖。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在此服务器上响应，而不必被 @提及”
      </Tab>
      <Tab title="配置">
        在你的服务器配置中设置 `requireMention: false`：

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

        要为群组/渠道房间恢复旧版自动最终回复，请设置 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划服务器渠道中的记忆">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。服务器渠道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 渠道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个渠道中共享上下文，请将稳定指令放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话）。将长期笔记保存在 `MEMORY.md` 中，并按需通过记忆工具访问它们。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在，在你的 Discord 服务器上创建一些渠道并开始聊天。你的智能体可以看到渠道名称，并且每个渠道都有自己的隔离会话，所以你可以设置 `#coding`、`#home`、`#research`，或任何适合你工作流的渠道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站会回复到 Discord。
- Discord 服务器/渠道元数据会作为不受信任的上下文添加到模型提示中，而不是作为用户可见的回复前缀。如果模型复制了该封套，OpenClaw 会从出站回复和未来重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 服务器渠道是隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组私信默认会被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 到路由后的对话会话。
- 纯文本 cron/心跳公告投递到 Discord 时，会使用一次最终的助手可见答案。媒体和结构化组件载荷在智能体发出多个可投递载荷时仍保持多消息形式。

## 论坛渠道

Discord 论坛和媒体渠道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父级（`channel:<forumId>`）发送消息以自动创建线程。线程标题使用你消息中的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建线程。对于论坛渠道，不要传入 `--message-id`。

示例：发送到论坛父级以创建线程

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建论坛线程

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

论坛父级不接受 Discord 组件。如果你需要组件，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持用于智能体消息的 Discord components v2 容器。使用带 `components` 载荷的消息工具。交互结果会作为普通入站消息路由回智能体，并遵循现有的 Discord `replyToMode` 设置。

支持的区块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或单个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择器和表单在过期前多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到一条仅本人可见的拒绝消息。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，其中包含提供商、模型和兼容运行时下拉菜单，以及一个提交步骤。`/models add` 已弃用，现在会返回弃用提示，而不是从聊天中注册模型。选择器回复仅本人可见，且只有调用用户可以使用。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件请使用 `media-gallery`
- 当上传名称需要匹配附件引用时，使用 `filename` 覆盖上传名称

模态表单：

- 添加 `components.modal`，最多包含 5 个字段
- 字段类型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 会自动添加一个触发按钮

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

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在自身未设置 `allowFrom` 时继承 `channels.discord.allowFrom`。
    - 命名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    裸数字 ID 存在歧义，除非提供了明确的用户/渠道目标类型，否则会被拒绝。

  </Tab>

  <Tab title="Guild policy">
    Guild 处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    存在 `channels.discord` 时，安全基线为 `allowlist`。

    `allowlist` 行为：

    - guild 必须匹配 `channels.discord.guilds`（首选 `id`，也接受 slug）
    - 可选发送者允许列表：`users`（建议使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，发送者匹配 `users` 或 `roles` 时即被允许
    - 默认禁用直接名称/标签匹配；仅在破窗兼容模式下启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果 guild 配置了 `channels`，未列出的渠道会被拒绝
    - 如果 guild 没有 `channels` 块，则该允许列表 guild 中的所有渠道都被允许

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

    如果你只设置 `DISCORD_BOT_TOKEN`，但没有创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    Guild 消息默认需要提及才会触发。

    提及检测包括：

    - 显式提及机器人
    - 已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 在支持的情况下隐式回复机器人行为

    `requireMention` 按 guild/渠道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃提及其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可通过 `dm.groupChannels` 使用可选允许列表（渠道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord guild 成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并且在 peer 或 parent-peer 绑定之后、仅 guild 绑定之前求值。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有已配置字段都必须匹配。

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

## 原生命令和命令认证

- `commands.native` 默认为 `"auto"`，并为 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会显式清除以前注册的 Discord 原生命令。
- 原生命令认证使用与普通消息处理相同的 Discord 允许列表/策略。
- 对于未授权用户，命令可能仍会在 Discord UI 中可见；执行时仍会强制执行 OpenClaw 认证并返回 “not authorized”。

请参阅[斜杠命令](/zh-CN/tools/slash-commands)了解命令目录和行为。

默认斜杠命令设置：

- `ephemeral: true`

## 功能详情

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord 支持在智能体输出中使用回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`
    - `batched`

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。
    `first` 始终将隐式原生回复引用附加到该轮的第一条出站 Discord 消息。
    `batched` 仅在入站轮次是多条消息的防抖批次时，才会附加 Discord 的隐式原生回复引用。这在你希望主要针对含糊的突发聊天使用原生回复，而不是每个单消息轮次都使用时很有用。

    消息 ID 会显示在上下文/历史中，以便智能体可以定位特定消息。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑它来流式传输草稿回复。`channels.discord.streaming` 接受 `off`（默认）| `partial` | `block` | `progress`。在 Discord 上，`progress` 映射到 `partial`；`streamMode` 是旧版别名，会自动迁移。

    默认保持为 `off`，因为当多个机器人或 Gateway 网关共享同一账户时，Discord 预览编辑很快会触发速率限制。

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

    - `partial` 会在 token 到达时编辑单条预览消息。
    - `block` 会发送草稿大小的分块（使用 `draftChunk` 调整大小和断点，并限制在 `textChunkLimit` 内）。
    - 媒体、错误和显式回复最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。

    预览流式传输仅支持文本；媒体回复会回退到普通投递。当显式启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Guild 历史上下文：

    - `channels.discord.historyLimit` 默认 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话继承父渠道的会话级 `/model` 选择，作为仅模型回退；线程本地 `/model` 选择仍优先，并且除非启用转录继承，否则不会复制父转录历史。
    - `channels.discord.thread.inheritParent`（默认 `false`）会让新的自动线程从父转录中播种。按账户覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 消息工具反应可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    渠道主题会作为**不受信任**的上下文注入。允许列表限制谁可以触发智能体，而不是完整的补充上下文删减边界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以将线程绑定到会话目标，以便该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 查看/更新聚焦绑定的非活动自动取消聚焦
    - `/session max-age <duration|off>` 查看/更新聚焦绑定的硬性最长有效期

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

    说明：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSubagentSessions` 必须为 true，才能为 `sessions_spawn({ thread: true })` 自动创建/绑定线程。
    - `spawnAcpSessions` 必须为 true，才能为 ACP（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）自动创建/绑定线程。
    - 如果账户禁用了线程绑定，则 `/focus` 和相关线程绑定操作不可用。

    请参阅[子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents)和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    对于稳定的 “always-on” ACP 工作区，请配置顶级类型化 ACP 绑定，以指向 Discord 对话。

    配置路径：

    - `bindings[]`，其中 `type: "acp"` 且 `match.channel: "discord"`

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

    说明：

    - `/acp spawn codex --bind here` 会在原位绑定当前渠道或线程，并让后续消息继续使用同一个 ACP 会话。线程消息会继承父渠道绑定。
    - 在已绑定的渠道或线程中，`/new` 和 `/reset` 会在原位重置同一个 ACP 会话。临时线程绑定在激活期间可以覆盖目标解析。
    - 只有当 OpenClaw 需要通过 `--thread auto|here` 创建/绑定子线程时，才需要 `spawnAcpSessions`。

    有关绑定行为详情，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

  </Accordion>

  <Accordion title="回应通知">
    每个服务器的回应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    回应事件会转换为系统事件，并附加到路由到的 Discord 会话。

  </Accordion>

  <Accordion title="确认回应">
    当 OpenClaw 正在处理入站消息时，`ackReaction` 会发送一个确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退值（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Discord 接受 Unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账号禁用该回应。

  </Accordion>

  <Accordion title="配置写入">
    渠道发起的配置写入默认启用。

    这会影响 `/config set|unset` 流程（当命令功能启用时）。

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
    通过 `channels.discord.proxy` 使用 HTTP(S) 代理路由 Discord Gateway 网关 WebSocket 流量和启动时的 REST 查询（应用 ID + allowlist 解析）。

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

    说明：

    - allowlist 可以使用 `pk:<memberId>`
    - 只有当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名称
    - 查询使用原始消息 ID，并受时间窗口约束
    - 如果查询失败，代理消息会被视为机器人消息并被丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="在线状态配置">
    当你设置状态或活动字段，或启用自动在线状态时，会应用在线状态更新。

    仅状态示例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活动示例（自定义状态是默认活动类型）：

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
    - 1：正在直播（需要 `activityUrl`）
    - 2：正在听
    - 3：正在观看
    - 4：自定义（使用活动文本作为状态内容；emoji 可选）
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

    自动在线状态会将运行时可用性映射到 Discord 状态：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的批准">
    Discord 支持在私信中基于按钮处理批准，也可以选择在发起渠道中发布批准提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以从 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出一个批准者时，Discord 会自动启用原生 exec 批准。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或直接消息 `defaultTo` 推断 exec 批准者。设置 `enabled: false` 可显式禁用 Discord 作为原生批准客户端。

    当 `target` 为 `channel` 或 `both` 时，批准提示会在渠道中可见。只有已解析的批准者可以使用按钮；其他用户会收到一条临时拒绝消息。批准提示包含命令文本，因此只应在受信任渠道中启用渠道投递。如果无法从会话键派生渠道 ID，OpenClaw 会回退到私信投递。

    Discord 还会渲染其他聊天渠道使用的共享批准按钮。原生 Discord 适配器主要增加批准者私信路由和渠道扇出。
    当这些按钮存在时，它们是主要批准 UX；OpenClaw
    只有在工具结果表示聊天批准不可用或手动批准是唯一路径时，
    才应包含手动 `/approve` 命令。

    Gateway 网关认证和批准解析遵循共享 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。批准默认在 30 分钟后过期。

    请参阅 [Exec 批准](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息发送、渠道管理、审核、在线状态和元数据操作。

核心示例：

- 消息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径），用于设置计划事件封面图片。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                                   | 默认     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 回应、消息、线程、置顶、投票、搜索、成员信息、角色信息、渠道信息、渠道、语音状态、事件、贴纸、emoji 上传、贴纸上传、权限                                             | 已启用   |
| 角色                                                                                                                                                                     | 已禁用   |
| 审核                                                                                                                                                                     | 已禁用   |
| 在线状态                                                                                                                                                                 | 已禁用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 处理 exec 批准和跨上下文标记。Discord 消息操作也可以接受用于自定义 UI 的 `components`（高级；需要通过 discord 工具构造组件载荷），而旧版 `embeds` 仍可用，但不推荐。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账号设置。
- 当存在 components v2 时，`embeds` 会被忽略。

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

Discord 有两个不同的语音表面：实时 **语音渠道**（连续对话）和 **语音消息附件**（波形预览格式）。Gateway 网关同时支持两者。

### 语音渠道

设置清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户 allowlist 时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀请机器人。
4. 在目标语音渠道中授予 Connect、Speak、Send Messages 和 Read Message History 权限。
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
- `voice.model` 仅覆盖用于 Discord 语音渠道响应的 LLM。保持未设置即可继承已路由的智能体模型。
- STT 使用 `tools.media.audio`；`voice.model` 不影响转录。
- 语音转录轮次会根据 Discord `allowFrom`（或 `dm.allowFrom`）推导所有者状态；非所有者说话者无法访问仅所有者可用的工具（例如 `gateway` 和 `cron`）。
- 语音默认启用；设置 `channels.discord.voice.enabled=false` 可禁用语音运行时和 `GuildVoiceStates` Gateway 网关 intent。
- `channels.discord.intents.voiceStates` 可以显式覆盖语音状态 intent 订阅。保持未设置时，该 intent 会跟随 `voice.enabled`。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` join options。
- 如果未设置，`@discordjs/voice` 默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还会监视接收解密失败，并在短时间窗口内重复失败后通过离开并重新加入语音渠道来自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 版本线包含来自 discord.js PR #11449 的上游 padding 修复，该修复关闭了 discord.js issue #11419。

语音渠道流水线：

- Discord PCM 捕获会转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录文本会通过正常的 Discord 入站和路由发送。
- 设置 `voice.model` 时，它仅覆盖此语音渠道轮次的响应 LLM。
- `voice.tts` 会合并覆盖 `messages.tts`；生成的音频会在已加入的渠道中播放。

凭证按组件解析：`voice.model` 使用 LLM 路由凭证，`tools.media.audio` 使用 STT 凭证，`messages.tts`/`voice.tts` 使用 TTS 凭证。

### 语音消息

Discord 语音消息会显示波形预览，并要求使用 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上有 `ffmpeg` 和 `ffprobe` 来检查和转换。

- 提供一个**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 会拒绝同一 payload 中同时包含文本和语音消息）。
- 接受任意音频格式；OpenClaw 会按需转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intent，或机器人看不到 guild 消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 更改 intent 后重启 Gateway 网关

  </Accordion>

  <Accordion title="Guild 消息意外被阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的 guild allowlist
    - 如果存在 guild `channels` map，则只允许列出的渠道
    - 验证 `requireMention` 行为和 mention 模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 为 false 但仍被阻止">
    常见原因：

    - `groupPolicy="allowlist"` 但没有匹配的 guild/channel allowlist
    - `requireMention` 配置在错误位置（必须位于 `channels.discord.guilds` 或渠道条目下）
    - 发送者被 guild/channel `users` allowlist 阻止

  </Accordion>

  <Accordion title="长时间运行的处理器超时或重复回复">

    典型日志：

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Listener 预算旋钮：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker 运行超时旋钮：

    - 单账号：`channels.discord.inboundWorker.runTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 默认值：`1800000`（30 分钟）；设置为 `0` 可禁用

    推荐基线：

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    对慢 listener 设置使用 `eventQueue.listenerTimeout`，只有当你想为排队的智能体轮次单独设置安全阀时
    才使用 `inboundWorker.runTimeoutMs`。

  </Accordion>

  <Accordion title="Gateway 网关元数据查找超时警告">
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。瞬时失败会回退到 Discord 的默认 Gateway 网关 URL，并在日志中限速记录。

    元数据超时旋钮：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字渠道 ID。

    如果你使用 slug 键，运行时匹配仍可工作，但 probe 无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人循环">
    默认情况下，机器人作者的消息会被忽略。

    如果你设置 `channels.discord.allowBots=true`，请使用严格的 mention 和 allowlist 规则以避免循环行为。
    优先使用 `channels.discord.allowBots="mentions"`，仅接受 mention 该机器人的机器人消息。

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 掉线">

    - 保持 OpenClaw 为当前版本（`openclaw update`），确保 Discord 语音接收恢复逻辑存在
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调整
    - 查看日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后仍持续失败，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行比较

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[配置参考 - Discord](/zh-CN/gateway/config-channels#discord)。

<Accordion title="高信号 Discord 字段">

- 启动/鉴权：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（listener 预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 入站 worker：`inboundWorker.runTimeoutMs`
- Gateway 网关元数据：`gatewayInfoTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`（限制出站 Discord 上传，默认 `100MB`）、`retry`
- 操作：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全和运维

- 将机器人 token 视为密钥（在受监督环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态已过期，请重启 Gateway 网关，并使用 `openclaw channels status --probe` 重新检查。

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Discord 用户配对到 Gateway 网关。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群聊和 allowlist 行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将 guild 和渠道映射到智能体。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>

---
read_when:
    - 开发 Discord 渠道功能
summary: Discord 机器人支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-04-28T19:12:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b552ae25d1f1edac7499af1ebb0a04b213f546b95aa93cd2bb4e292ce793bc40
    source_path: channels/discord.md
    workflow: 16
---

已支持通过官方 Discord Gateway 网关使用私信和 guild 渠道。

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

你需要创建一个带机器人的新应用，将机器人添加到你的服务器，并将其配对到 OpenClaw。我们建议将你的机器人添加到你自己的私有服务器。如果你还没有服务器，请[先创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，点击 **New Application**。将它命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你给 OpenClaw 智能体起的名称。

  </Step>

  <Step title="启用特权 intents">
    仍在 **Bot** 页面上，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色允许列表和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅在需要在线状态更新时需要）

  </Step>

  <Step title="复制你的机器人 token">
    回到 **Bot** 页面上方，点击 **Reset Token**。

    <Note>
    尽管名称如此，这会生成你的第一个 token，而不是真的在“重置”任何内容。
    </Note>

    复制 token 并保存到某处。这是你的 **Bot Token**，稍后会用到。

  </Step>

  <Step title="生成邀请 URL 并将机器人添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用来将机器人添加到你的服务器。

    向下滚动到 **OAuth2 URL Generator** 并启用：

    - `bot`
    - `applications.commands`

    下方会出现 **Bot Permissions** 区域。至少启用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基线权限集合。如果你计划在 Discord threads 中发帖，包括创建或继续 thread 的论坛或媒体频道工作流，也请启用 **Send Messages in Threads**。
    复制底部生成的 URL，粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用中，你需要启用 Developer Mode，才能复制内部 ID。

    1. 点击 **User Settings**（头像旁的齿轮图标）→ **Advanced** → 开启 **Developer Mode**
    2. 右键点击侧边栏中的**服务器图标** → **Copy Server ID**
    3. 右键点击你**自己的头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存，下一步你会把这三项都发送给 OpenClaw。

  </Step>

  <Step title="允许来自服务器成员的私信">
    要让配对工作，Discord 需要允许你的机器人给你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 开启 **Direct Messages**。

    这允许服务器成员（包括机器人）给你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持此项启用。如果你只计划使用 guild 渠道，可以在配对后禁用私信。

  </Step>

  <Step title="安全设置你的机器人 token（不要在聊天中发送）">
    你的 Discord 机器人 token 是机密信息（类似密码）。在给你的智能体发消息之前，先在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请在存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将该变量存储在 `~/.openclaw/.env` 中，以便服务在重启后解析 env SecretRef。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任意现有渠道（例如 Telegram）与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / 配置选项卡。

        > “我已经在配置中设置了我的 Discord 机器人 token。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
      </Tab>
      <Tab title="CLI / 配置">
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

        默认账户的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```

        支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。参见[密钥管理](/zh-CN/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准首次私信配对">
    等待 Gateway 网关运行后，在 Discord 中给你的机器人发送私信。它会返回一个配对代码。

    <Tabs>
      <Tab title="询问你的智能体">
        在你的现有渠道上将配对代码发送给你的智能体：

        > “批准这个 Discord 配对代码：`<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配对代码将在 1 小时后过期。

    现在你应该可以通过 Discord 私信与你的智能体聊天。

  </Step>
</Steps>

<Note>
Token 解析是账户感知的。配置 token 值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
如果两个已启用的 Discord 账户解析到同一个机器人 token，OpenClaw 只会为该 token 启动一个 Gateway 网关监视器。配置来源的 token 优先于默认环境变量回退；否则第一个已启用账户胜出，重复账户会报告为已禁用。
对于高级出站调用（message 工具/渠道操作），显式的逐调用 `token` 将用于该调用。这适用于发送和读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账户策略/重试设置仍来自活动运行时快照中选定的账户。
</Note>

## 推荐：设置 guild 工作区

私信可用后，你可以将 Discord 服务器设置为完整工作区，让每个频道都有自己的智能体会话和上下文。对于只有你和你的机器人的私有服务器，推荐这样做。

<Steps>
  <Step title="将你的服务器添加到 guild 允许列表">
    这会让你的智能体可以在服务器上的任何频道中响应，而不只是私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “将我的 Discord Server ID `<server_id>` 添加到 guild 允许列表”
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

  <Step title="允许无需 @mention 即可响应">
    默认情况下，你的智能体只会在 guild 渠道中被 @提及时响应。对于私有服务器，你可能希望它响应每条消息。

    在 guild 渠道中，普通助手最终回复默认保持私密。可见的 Discord 输出必须通过 `message` 工具显式发送，因此智能体默认可以潜伏，只在判断渠道回复有用时才发帖。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在这个服务器上无需被 @提及也能响应”
      </Tab>
      <Tab title="配置">
        在你的 guild 配置中设置 `requireMention: false`：

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

        若要恢复群组/渠道房间的旧版自动最终回复，请设置 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划 guild 渠道中的记忆">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。Guild 渠道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 渠道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，请将稳定说明放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话中）。将长期笔记保存在 `MEMORY.md` 中，并按需通过 memory 工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些频道并开始聊天。你的智能体可以看到频道名称，并且每个频道都有自己隔离的会话，因此你可以设置 `#coding`、`#home`、`#research` 或任何适合你工作流的频道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站会回复到 Discord。
- Discord guild/渠道元数据会作为不受信任的上下文添加到模型提示中，而不是作为用户可见的回复前缀。如果模型复制了该包裹内容，OpenClaw 会从出站回复和未来重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- Guild 渠道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组私信默认被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 到路由后的对话会话。
- 纯文本 cron/heartbeat 到 Discord 的公告投递会使用一次最终助手可见答案。媒体和结构化组件 payload 在智能体发出多个可投递 payload 时仍保持多消息形式。

## 论坛频道

Discord 论坛和媒体频道只接受 thread 帖文。OpenClaw 支持两种创建方式：

- 向论坛父频道（`channel:<forumId>`）发送消息以自动创建 thread。Thread 标题使用你消息的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建 thread。对于论坛频道，不要传递 `--message-id`。

示例：发送到论坛父频道以创建 thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建论坛 thread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

论坛父频道不接受 Discord 组件。如果你需要组件，请发送到 thread 本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持用于智能体消息的 Discord components v2 容器。使用带有 `components` 负载的消息工具。交互结果会作为普通入站消息路由回智能体，并遵循现有的 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择器和表单在过期前被多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到一条临时拒绝消息。

`/model` 和 `/models` 斜杠命令会打开交互式模型选择器，包含提供商、模型和兼容运行时下拉菜单，以及提交步骤。`/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。选择器回复是临时的，且只有调用用户可以使用。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件使用 `media-gallery`
- 当上传名称需要匹配附件引用时，使用 `filename` 覆盖上传名称

模态表单：

- 添加最多包含 5 个字段的 `components.modal`
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
  <Tab title="私信策略">
    `channels.discord.dmPolicy` 控制私信访问（旧版：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果私信策略不是开放的，未知用户会被阻止（或在 `pairing` 模式下被提示配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在自身 `allowFrom` 未设置时继承 `channels.discord.allowFrom`。
    - 命名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    裸数字 ID 存在歧义，会被拒绝，除非提供了明确的用户/渠道目标类型。

  </Tab>

  <Tab title="服务器策略">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（首选 `id`，也接受 slug）
    - 可选发送者允许列表：`users`（建议使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，当发送者匹配 `users` 或 `roles` 时允许
    - 默认禁用直接名称/标签匹配；仅在应急兼容模式下启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果服务器配置了 `channels`，未列出的渠道会被拒绝
    - 如果服务器没有 `channels` 块，则该允许列表服务器中的所有渠道都被允许

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

    如果你只设置了 `DISCORD_BOT_TOKEN`，且没有创建 `channels.discord` 块，运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="提及和群组私信">
    服务器消息默认由提及门控。

    提及检测包括：

    - 显式机器人提及
    - 已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 支持场景中的隐式回复机器人行为

    `requireMention` 按服务器/渠道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃提及其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选允许列表通过 `dm.groupChannels` 设置（渠道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 服务器成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并在对等或父对等绑定之后、仅服务器绑定之前求值。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有已配置字段都必须匹配。

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
- `commands.native=false` 会显式清除先前注册的 Discord 原生命令。
- 原生命令认证使用与普通消息处理相同的 Discord 允许列表/策略。
- 对于未授权的用户，命令仍可能在 Discord UI 中可见；执行时仍会强制执行 OpenClaw 认证，并返回 “not authorized”。

请参阅[斜杠命令](/zh-CN/tools/slash-commands)，了解命令目录和行为。

默认斜杠命令设置：

- `ephemeral: true`

## 功能详情

<AccordionGroup>
  <Accordion title="回复标签和原生回复">
    Discord 支持智能体输出中的回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`
    - `batched`

    注意：`off` 会禁用隐式回复线程化。显式 `[[reply_to_*]]` 标签仍会生效。
    `first` 始终把隐式原生回复引用附加到该轮的第一条出站 Discord 消息。
    `batched` 仅在入站轮次是由多条消息组成的防抖批次时，才附加 Discord 的隐式原生回复引用。这在你希望原生回复主要用于有歧义的突发聊天，而不是每个单消息轮次时很有用。

    消息 ID 会在上下文/历史中呈现，以便智能体可以定位特定消息。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑它来流式传输草稿回复。`channels.discord.streaming` 接受 `off`（默认）| `partial` | `block` | `progress`。`progress` 在 Discord 上映射为 `partial`；`streamMode` 是旧版别名，会自动迁移。

    默认保持为 `off`，因为当多个机器人或 Gateway 网关共享一个账户时，Discord 预览编辑会很快触发速率限制。

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

    - `partial` 会在令牌到达时编辑单条预览消息。
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并受限于 `textChunkLimit`）。
    - 媒体、错误和显式回复最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。

    预览流式传输仅支持文本；媒体回复会回退到普通投递。当显式启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

  </Accordion>

  <Accordion title="历史、上下文和线程行为">
    服务器历史上下文：

    - `channels.discord.historyLimit` 默认 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话继承父渠道的会话级 `/model` 选择，作为仅模型回退；线程本地 `/model` 选择仍然优先，且除非启用转录继承，否则不会复制父转录历史。
    - `channels.discord.thread.inheritParent`（默认 `false`）让新的自动线程选择从父转录中播种。按账户覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 消息工具反应可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    渠道主题会作为**不受信任**的上下文注入。允许列表门控谁可以触发智能体，而不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="面向子智能体的线程绑定会话">
    Discord 可以将线程绑定到会话目标，使该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 检查/更新聚焦绑定的不活跃自动取消聚焦
    - `/session max-age <duration|off>` 检查/更新聚焦绑定的硬性最大期限

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
    - `spawnSubagentSessions` 必须为 true，才能为 `sessions_spawn({ thread: true })` 自动创建/绑定线程。
    - `spawnAcpSessions` 必须为 true，才能为 ACP（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）自动创建/绑定线程。
    - 如果某个账号禁用了线程绑定，`/focus` 和相关线程绑定操作将不可用。

    请参阅 [子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents) 和 [配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 渠道绑定">
    对于稳定的“始终在线”ACP 工作区，请配置指向 Discord 对话的顶层带类型 ACP 绑定。

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

    - `/acp spawn codex --bind here` 会就地绑定当前渠道或线程，并让后续消息保持在同一个 ACP 会话上。线程消息会继承父渠道绑定。
    - 在已绑定的渠道或线程中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话。临时线程绑定在生效期间可以覆盖目标解析。
    - 只有当 OpenClaw 需要通过 `--thread auto|here` 创建/绑定子线程时，才需要 `spawnAcpSessions`。

    请参阅 [ACP 智能体](/zh-CN/tools/acp-agents) 了解绑定行为详情。

  </Accordion>

  <Accordion title="回应通知">
    每个服务器的回应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    回应事件会转换为系统事件，并附加到已路由的 Discord 会话。

  </Accordion>

  <Accordion title="确认回应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送确认表情符号。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    注意：

    - Discord 接受 Unicode 表情符号或自定义表情符号名称。
    - 使用 `""` 可为某个渠道或账号禁用该回应。

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
    通过带有 `channels.discord.proxy` 的 HTTP(S) 代理路由 Discord gateway WebSocket 流量和启动时的 REST 查询（应用 ID + allowlist 解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    每账号覆盖：

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
    - 只有当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名称
    - 查询使用原始消息 ID，并受时间窗口限制
    - 如果查询失败，代理消息会被视为 bot 消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="在线状态配置">
    当你设置 Status 或活动字段，或者启用自动在线状态时，会应用在线状态更新。

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
    - 1：正在流式传输（需要 `activityUrl`）
    - 2：正在听
    - 3：正在观看
    - 4：自定义（使用活动文本作为状态状态；表情符号可选）
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

  <Accordion title="Discord 中的批准">
    Discord 支持在私信中基于按钮处理批准，也可以选择在来源渠道中发布批准提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以从 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出一个批准人时，Discord 会自动启用原生 exec 批准。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断 exec 批准人。设置 `enabled: false` 可显式禁用 Discord 作为原生批准客户端。

    当 `target` 为 `channel` 或 `both` 时，批准提示会在渠道中可见。只有解析出的批准人可以使用按钮；其他用户会收到临时拒绝提示。批准提示包含命令文本，因此只应在受信任渠道中启用渠道投递。如果无法从会话键派生渠道 ID，OpenClaw 会回退到私信投递。

    Discord 还会渲染其他聊天渠道使用的共享批准按钮。原生 Discord 适配器主要添加批准人私信路由和渠道扇出。
    当这些按钮存在时，它们就是主要的批准 UX；OpenClaw
    只有在工具结果表明聊天批准不可用或手动批准是唯一路径时，
    才应包含手动 `/approve` 命令。

    Gateway 网关身份验证和批准解析遵循共享 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。批准默认在 30 分钟后过期。

    请参阅 [Exec 批准](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息、渠道管理、审核、在线状态和元数据操作。

核心示例：

- 消息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径）来设置预定事件封面图。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                                  | 默认值   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已启用   |
| roles                                                                                                                                                                    | 已禁用   |
| moderation                                                                                                                                                               | 已禁用   |
| presence                                                                                                                                                                 | 已禁用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 处理 exec 批准和跨上下文标记。Discord 消息操作也可以接受 `components` 作为自定义 UI（高级用法；需要通过 discord 工具构造组件载荷），而旧版 `embeds` 仍可用，但不推荐使用。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账号设置。
- 当存在 components v2 时，会忽略 `embeds`。

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
3. 使用 `bot` 和 `applications.commands` scopes 邀请 bot。
4. 在目标语音渠道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账号默认智能体，并遵循与其他 Discord 命令相同的 allowlist 和组策略规则。

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

注意：

- `voice.tts` 仅为语音播放覆盖 `messages.tts`。
- `voice.model` 仅为 Discord 语音渠道响应覆盖所用的 LLM。留空则继承路由后的智能体模型。
- STT 使用 `tools.media.audio`；`voice.model` 不影响转录。
- 语音转录轮次从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态；非所有者说话者无法访问仅限所有者的工具（例如 `gateway` 和 `cron`）。
- 语音默认启用；设置 `channels.discord.voice.enabled=false` 可禁用语音运行时和 `GuildVoiceStates` Gateway 网关 intent。
- `channels.discord.intents.voiceStates` 可以显式覆盖语音状态 intent 订阅。留空则让 intent 跟随 `voice.enabled`。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还会监控接收解密失败，并在短时间窗口内重复失败后，通过离开并重新加入语音渠道自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 版本线包含来自 discord.js PR #11449 的上游填充修复，该修复关闭了 discord.js issue #11419。

语音渠道流水线：

- Discord PCM 捕获会转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录会通过常规 Discord 入口和路由发送。
- 设置 `voice.model` 时，它仅覆盖此语音渠道轮次的响应 LLM。
- `voice.tts` 会合并覆盖 `messages.tts`；生成的音频会在已加入的渠道中播放。

凭证按组件解析：`voice.model` 使用 LLM 路由认证，`tools.media.audio` 使用 STT 认证，`messages.tts`/`voice.tts` 使用 TTS 认证。

### 语音消息

Discord 语音消息会显示波形预览，并要求 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上的 `ffmpeg` 和 `ffprobe` 来检查和转换。

- 提供一个**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 拒绝在同一 payload 中同时发送文本和语音消息）。
- 接受任意音频格式；OpenClaw 会按需转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intent，或 bot 看不到服务器消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 更改 intent 后重启 Gateway 网关

  </Accordion>

  <Accordion title="服务器消息被意外阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的服务器允许列表
    - 如果存在服务器 `channels` 映射，则仅允许列出的渠道
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

  <Accordion title="长时间运行的处理程序超时或重复回复">

    典型日志：

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    监听器预算旋钮：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker 运行超时旋钮：

    - 单账号：`channels.discord.inboundWorker.runTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 默认：`1800000`（30 分钟）；设置为 `0` 可禁用

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

    对慢监听器设置使用 `eventQueue.listenerTimeout`，仅当你想为排队的智能体轮次设置单独的安全阀时，
    才使用 `inboundWorker.runTimeoutMs`。

  </Accordion>

  <Accordion title="Gateway 网关元数据查找超时警告">
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。瞬时失败会回退到 Discord 默认 Gateway 网关 URL，并在日志中进行限速记录。

    元数据超时旋钮：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认：`30000`（30 秒），最大：`120000`

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字渠道 ID。

    如果你使用 slug 键，运行时匹配仍可工作，但 probe 无法完全验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="Bot 到 bot 循环">
    默认情况下，bot 作者消息会被忽略。

    如果你设置 `channels.discord.allowBots=true`，请使用严格的提及和允许列表规则以避免循环行为。
    推荐使用 `channels.discord.allowBots="mentions"`，这样仅接受提及该 bot 的 bot 消息。

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 丢弃">

    - 保持 OpenClaw 为当前版本（`openclaw update`），确保 Discord 语音接收恢复逻辑存在
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调优
    - 观察日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后仍持续失败，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行比较

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[配置参考 - Discord](/zh-CN/gateway/config-channels#discord)。

<Accordion title="高信号 Discord 字段">

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 入站 Worker：`inboundWorker.runTimeoutMs`
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

- 将 bot token 视为密钥（在受监督环境中推荐使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态过期，请重启 Gateway 网关并使用 `openclaw channels status --probe` 重新检查。

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Discord 用户配对到 Gateway 网关。
  </Card>
  <Card title="组" icon="users" href="/zh-CN/channels/groups">
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

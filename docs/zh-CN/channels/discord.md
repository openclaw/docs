---
read_when:
    - 处理 Discord 渠道功能时
summary: Discord 机器人支持状态、功能与配置
title: Discord
x-i18n:
    generated_at: "2026-04-05T20:19:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fc471394b4fd2384779487f7ea5249897e826d2964094c0780613f3aea13946
    source_path: channels/discord.md
    workflow: 15
---

# Discord（Bot API）

状态：已就绪，可通过官方 Discord gateway 支持私信和服务器频道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复流程。
  </Card>
</CardGroup>

## 快速设置

你需要创建一个带机器人的新应用，将机器人添加到你的服务器，并将其与 OpenClaw 配对。我们建议把你的机器人添加到你自己的私人服务器。如果你还没有服务器，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，点击 **New Application**。给它起一个类似 “OpenClaw” 的名字。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你给 OpenClaw 智能体起的名称。

  </Step>

  <Step title="启用特权 intents">
    仍然在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色 allowlist 和名称到 ID 匹配所必需）
    - **Presence Intent**（可选；仅在需要状态更新时使用）

  </Step>

  <Step title="复制你的 Bot Token">
    向上滚动回 **Bot** 页面并点击 **Reset Token**。

    <Note>
    尽管名称如此，这一步会生成你的第一个令牌——并不会“重置”任何内容。
    </Note>

    复制该令牌并将其保存到某个地方。这就是你的 **Bot Token**，你很快就会用到它。

  </Step>

  <Step title="生成邀请 URL 并将机器人添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用于将机器人添加到你的服务器。

    向下滚动到 **OAuth2 URL Generator** 并启用：

    - `bot`
    - `applications.commands`

    下方会出现一个 **Bot Permissions** 部分。启用：

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（可选）

    复制底部生成的 URL，将其粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用中，你需要启用 Developer Mode，这样才能复制内部 ID。

    1. 点击 **User Settings**（头像旁的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 在侧边栏中右键点击你的**服务器图标** → **Copy Server ID**
    3. 右键点击你自己的**头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存——下一步你需要把这三项都发送给 OpenClaw。

  </Step>

  <Step title="允许服务器成员发起私信">
    为了让配对正常工作，Discord 需要允许你的机器人向你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 打开 **Direct Messages**。

    这会允许服务器成员（包括机器人）向你发送私信。如果你想在 OpenClaw 中使用 Discord 私信，请保持此选项开启。如果你只打算使用服务器频道，则可以在完成配对后关闭私信。

  </Step>

  <Step title="安全地设置你的 Bot Token（不要在聊天中发送它）">
    你的 Discord bot token 是一个密钥（类似密码）。在给你的智能体发送消息之前，请先在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或者停止并重新启动 `openclaw gateway run` 进程。

  </Step>

  <Step title="配置 OpenClaw 并完成配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何现有渠道（例如 Telegram）中与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / config 标签页。

        > “我已经在配置中设置好了 Discord bot token。请用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
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

        默认账户的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```

        支持明文 `token` 值。`channels.discord.token` 也支持 env/file/exec 提供商的 SecretRef 值。参见 [Secrets Management](/zh-CN/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准首次私信配对">
    等待 Gateway 网关启动运行，然后在 Discord 中向你的机器人发送私信。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        将配对码发送给你现有渠道中的智能体：

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

    现在你应该可以通过私信在 Discord 中与你的智能体聊天了。

  </Step>
</Steps>

<Note>
令牌解析具有账户感知能力。配置中的令牌值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
对于高级出站调用（message 工具 / channel 操作），显式的单次调用 `token` 会用于该次调用。这适用于发送和读取 / 探测类操作（例如 read/search/fetch/thread/pins/permissions）。账户策略 / 重试设置仍然来自活动运行时快照中所选的账户。
</Note>

## 推荐：设置服务器工作区

在私信正常工作后，你可以将 Discord 服务器设置为一个完整工作区，其中每个频道都有自己的智能体会话和上下文。这非常适合只有你和机器人参与的私人服务器。

<Steps>
  <Step title="将你的服务器加入 guild allowlist">
    这样你的智能体就可以在服务器上的任意频道中响应，而不仅仅是私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “把我的 Discord Server ID `<server_id>` 添加到 guild allowlist”
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

  <Step title="允许无需 @mention 的响应">
    默认情况下，你的智能体只会在被 @ 提及时才在服务器频道中响应。对于私人服务器，你大概率会希望它响应每一条消息。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在这个服务器中无需被 @ 提及也能响应”
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

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划 guild 频道中的记忆使用">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。Guild 频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 频道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，请把稳定的说明写入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话中）。将长期笔记保存在 `MEMORY.md` 中，并在需要时通过 memory 工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在，在你的 Discord 服务器中创建一些频道并开始聊天吧。你的智能体可以看到频道名称，而且每个频道都会拥有自己隔离的会话——因此你可以设置 `#coding`、`#home`、`#research`，或任何适合你工作流的频道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：来自 Discord 的入站回复会回到 Discord。
- 默认情况下（`session.dmScope=main`），私聊共享智能体主会话（`agent:main:main`）。
- Guild 频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍会将 `CommandTargetSessionKey` 携带到被路由的对话会话中。

## Forum 频道

Discord forum 和 media 频道只接受主题帖。OpenClaw 支持两种创建方式：

- 向 forum 父级频道（`channel:<forumId>`）发送消息以自动创建线程。线程标题将使用消息中的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建线程。对于 forum 频道，不要传递 `--message-id`。

示例：发送到 forum 父级频道以创建线程

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建 forum 线程

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

Forum 父级频道不接受 Discord components。如果你需要 components，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 为智能体消息支持 Discord components v2 容器。使用带有 `components` 负载的 message 工具。交互结果会像普通入站消息一样路由回智能体，并遵循现有的 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或单个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件为单次使用。设置 `components.reusable=true` 可允许按钮、选择器和表单在过期前被多次使用。

如需限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签，或 `*`）。配置后，不匹配的用户会收到临时的拒绝提示。

`/model` 和 `/models` 斜杠命令会打开交互式模型选择器，包含 provider 和 model 下拉菜单以及一个提交步骤。选择器回复是临时的，且只有调用用户可以使用。

文件附件：

- `file` 块必须指向一个附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单文件）；多个文件请使用 `media-gallery`
- 当上传名称需要与附件引用一致时，使用 `filename` 覆盖上传名称

模态表单：

- 添加 `components.modal`，最多可包含 5 个字段
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

## 访问控制与路由

<Tabs>
  <Tab title="私信策略">
    `channels.discord.dmPolicy` 控制私信访问（旧版：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果私信策略不是 open，未知用户会被阻止（或在 `pairing` 模式下提示进行配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 如果命名账户自身未设置 `allowFrom`，则会继承 `channels.discord.allowFrom`。
    - 命名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    纯数字 ID 存在歧义，除非显式提供 user/channel 目标类型，否则会被拒绝。

  </Tab>

  <Tab title="Guild 策略">
    Guild 处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全基线为 `allowlist`。

    `allowlist` 行为：

    - guild 必须匹配 `channels.discord.guilds`（优先使用 `id`，也接受 slug）
    - 可选的发送者 allowlist：`users`（推荐使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了其中任意一个，则发送者在匹配 `users` 或 `roles` 时被允许
    - 直接名称 / 标签匹配默认禁用；仅在紧急兼容模式下启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称 / 标签，但 ID 更安全；当使用名称 / 标签条目时，`openclaw security audit` 会发出警告
    - 如果某个 guild 配置了 `channels`，则未列出的频道会被拒绝
    - 如果某个 guild 没有 `channels` 块，则该 allowlist guild 中的所有频道都被允许

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

    如果你只设置了 `DISCORD_BOT_TOKEN` 而没有创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 为 `open` 也是如此。

  </Tab>

  <Tab title="提及与群组私信">
    Guild 消息默认受提及门控。

    提及检测包括：

    - 显式提及机器人
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 在受支持情况下的隐式回复机器人行为

    `requireMention` 按 guild / channel 配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择性丢弃提及了其他用户 / 角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选 allowlist：通过 `dm.groupChannels`（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord guild 成员路由到不同智能体。基于角色的绑定仅接受角色 ID，评估顺序位于 peer 或 parent-peer 绑定之后、guild-only 绑定之前。如果某个绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有已配置字段都必须匹配。

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

## Developer Portal 设置

<AccordionGroup>
  <Accordion title="创建应用和机器人">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. 复制 bot token

  </Accordion>

  <Accordion title="特权 intents">
    在 **Bot -> Privileged Gateway Intents** 中，启用：

    - Message Content Intent
    - Server Members Intent（推荐）

    Presence intent 是可选的，只有在你希望接收状态更新时才需要。如果只是设置机器人状态（`setPresence`），则不需要为成员启用状态更新。

  </Accordion>

  <Accordion title="OAuth scopes 和基线权限">
    OAuth URL 生成器：

    - scopes：`bot`、`applications.commands`

    典型的基线权限：

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（可选）

    除非明确需要，否则避免使用 `Administrator`。

  </Accordion>

  <Accordion title="复制 ID">
    启用 Discord Developer Mode，然后复制：

    - server ID
    - channel ID
    - user ID

    在 OpenClaw 配置中优先使用数字 ID，以便进行可靠的审计和探测。

  </Accordion>
</AccordionGroup>

## 原生命令与命令认证

- `commands.native` 默认为 `"auto"`，并为 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会显式清除先前已注册的 Discord 原生命令。
- 原生命令认证使用与普通消息处理相同的 Discord allowlist / 策略。
- 即使用户未被授权，命令仍可能出现在 Discord UI 中；执行时仍会强制执行 OpenClaw 认证，并返回“未授权”。

命令目录和行为请参见[斜杠命令](/zh-CN/tools/slash-commands)。

默认斜杠命令设置：

- `ephemeral: true`

## 功能细节

<AccordionGroup>
  <Accordion title="回复标签与原生回复">
    Discord 支持在智能体输出中使用回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`
    - `batched`

    注意：`off` 会禁用隐式回复线程。显式的 `[[reply_to_*]]` 标签仍会生效。
    `first` 会始终将隐式原生回复引用附加到该轮中的第一条 Discord 出站消息。
    `batched` 仅在入站轮次是多个消息去抖后组成的批次时，才会附加 Discord 的隐式原生回复引用。这适合你主要希望在存在歧义的突发聊天中使用原生回复，而不是每个单消息轮次都使用。

    消息 ID 会在上下文 / 历史中呈现，因此智能体可以定位特定消息。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送临时消息并在文本到达时持续编辑它来流式显示回复草稿。

    - `channels.discord.streaming` 控制预览流式传输（`off` | `partial` | `block` | `progress`，默认：`off`）。
    - 默认保持为 `off`，因为 Discord 预览编辑很容易触发速率限制，尤其是多个机器人或 Gateway 网关共享同一账户或 guild 流量时。
    - 为了跨渠道一致性，接受 `progress`，并在 Discord 上映射为 `partial`。
    - `channels.discord.streamMode` 是旧别名，会自动迁移。
    - `partial` 会在 token 到达时编辑单条预览消息。
    - `block` 会输出草稿大小的分块（使用 `draftChunk` 调整大小和断点）。

    示例：

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block` 模式的分块默认值（会限制在 `channels.discord.textChunkLimit` 以内）：

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

    预览流式传输仅支持文本；媒体回复会回退为普通投递。

    注意：预览流式传输与分块流式传输是分开的。当为 Discord 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。

  </Accordion>

  <Accordion title="历史、上下文与线程行为">
    Guild 历史上下文：

    - `channels.discord.historyLimit` 默认值为 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为频道会话进行路由
    - 父线程元数据可用于父会话链接
    - 线程配置会继承父频道配置，除非存在线程专用条目

    频道主题会作为**不受信任**的上下文注入（而不是 system prompt）。
    回复和引用消息上下文当前会按接收到的内容保持原样。
    Discord allowlist 主要用于控制谁可以触发智能体，并不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="子智能体的线程绑定会话">
    Discord 可以将一个线程绑定到某个会话目标，使该线程中的后续消息持续路由到同一个会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前 / 新线程绑定到某个子智能体 / 会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 检查 / 更新聚焦绑定在无活动时的自动取消聚焦
    - `/session max-age <duration|off>` 检查 / 更新聚焦绑定的硬性最大时长

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
        spawnSubagentSessions: false, // 选择启用
      },
    },
  },
}
```

    说明：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSubagentSessions` 必须为 true，才能为 `sessions_spawn({ thread: true })` 自动创建 / 绑定线程。
    - `spawnAcpSessions` 必须为 true，才能为 ACP（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）自动创建 / 绑定线程。
    - 如果某个账户禁用了线程绑定，则 `/focus` 以及相关线程绑定操作不可用。

    参见[子智能体](/zh-CN/tools/subagents)、[ACP Agents](/zh-CN/tools/acp-agents) 和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久化 ACP 渠道绑定">
    对于稳定的“始终在线” ACP 工作区，可配置顶层的类型化 ACP 绑定，以目标为 Discord 对话。

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

    - `/acp spawn codex --bind here` 会将当前 Discord 频道或线程就地绑定，并使未来消息持续路由到同一个 ACP 会话。
    - 这仍然可能意味着“启动一个新的 Codex ACP 会话”，但它本身不会创建新的 Discord 线程。现有频道会继续作为聊天界面。
    - Codex 仍可能在其自己的 `cwd` 或磁盘上的 backend 工作区中运行。该工作区属于运行时状态，不是 Discord 线程。
    - 线程消息可以继承父频道 ACP 绑定。
    - 在已绑定的频道或线程中，`/new` 和 `/reset` 会原地重置同一个 ACP 会话。
    - 临时线程绑定仍然可用，并且在激活时可以覆盖目标解析。
    - 只有当 OpenClaw 需要通过 `--thread auto|here` 创建 / 绑定子线程时，才需要 `spawnAcpSessions`。对于当前频道中的 `/acp spawn ... --bind here` 则不需要。

    有关绑定行为的详细信息，请参见 [ACP Agents](/zh-CN/tools/acp-agents)。

  </Accordion>

  <Accordion title="表情反应通知">
    每个 guild 的表情反应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    表情反应事件会转换为系统事件，并附加到路由后的 Discord 会话中。

  </Accordion>

  <Accordion title="确认表情反应">
    `ackReaction` 会在 OpenClaw 处理入站消息期间发送一个确认表情。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 “👀”）

    说明：

    - Discord 接受 unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账户禁用该表情反应。

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。

    这会影响 `/config set|unset` 流程（在启用命令功能时）。

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
    使用 `channels.discord.proxy` 通过 HTTP(S) 代理路由 Discord gateway WebSocket 流量和启动 REST 查询（应用 ID + allowlist 解析）。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    按账户覆盖：

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
    启用 PluralKit 解析，以将代理消息映射到系统成员身份：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 可选；私有系统需要
      },
    },
  },
}
```

    说明：

    - allowlist 可以使用 `pk:<memberId>`
    - 只有在 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称 / slug 匹配成员显示名
    - 查询使用原始消息 ID，且受时间窗口限制
    - 如果查询失败，代理消息会被视为机器人消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="状态配置">
    当你设置状态或活动字段，或启用自动状态时，将应用状态更新。

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

    直播示例：

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

    - 0：Playing
    - 1：Streaming（需要 `activityUrl`）
    - 2：Listening
    - 3：Watching
    - 4：Custom（使用活动文本作为状态内容；emoji 可选）
    - 5：Competing

    自动状态示例（运行时健康信号）：

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

    自动状态将运行时可用性映射为 Discord 状态：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中使用基于按钮的审批处理，并可选择在源频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；尽可能回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个 approver（来自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`）时，Discord 会自动启用原生 exec approvals。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断 exec approver。将 `enabled: false` 设置为显式禁用 Discord 作为原生审批客户端。

    当 `target` 为 `channel` 或 `both` 时，审批提示会显示在频道中。只有已解析的 approver 能使用这些按钮；其他用户会收到临时拒绝提示。审批提示中包含命令文本，因此仅应在受信任频道中启用频道投递。如果无法从会话键派生频道 ID，OpenClaw 会回退为私信投递。

    Discord 也会渲染其他聊天渠道共用的审批按钮。原生 Discord 适配器主要增加了 approver 私信路由和频道扇出。
    当这些按钮存在时，它们就是主要的审批 UX；只有当工具结果表明聊天审批不可用，或手动审批是唯一途径时，OpenClaw 才应包含手动 `/approve` 命令。

    该处理器的 Gateway 网关认证使用与其他 Gateway 客户端相同的共享凭证解析契约：

    - env 优先的本地认证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`，然后是 `gateway.auth.*`）
    - 在本地模式下，仅当 `gateway.auth.*` 未设置时，`gateway.remote.*` 才可用作回退；已配置但无法解析的本地 SecretRef 会以关闭失败的方式处理
    - 在适用时通过 `gateway.remote.*` 支持远程模式
    - URL 覆盖是覆盖安全的：CLI 覆盖不会复用隐式凭证，而环境变量覆盖只使用环境变量凭证

    审批解析行为：

    - 以 `plugin:` 为前缀的 ID 通过 `plugin.approval.resolve` 解析。
    - 其他 ID 通过 `exec.approval.resolve` 解析。
    - Discord 不会在这里额外进行从 exec 到 plugin 的回退跳转；ID 前缀决定它调用哪个 gateway 方法。

    Exec approvals 默认在 30 分钟后过期。如果审批因未知审批 ID 失败，请检查 approver 解析、功能启用状态，以及已投递的审批 ID 类型是否与待处理请求匹配。

    相关文档：[Exec approvals](/zh-CN/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## 工具与操作门控

Discord 消息操作包括消息处理、频道管理、审核、状态和元数据操作。

核心示例：

- 消息处理：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 表情反应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 状态：`setPresence`

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                             | 默认值 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已启用 |
| roles                                                                                                                                                              | 已禁用 |
| moderation                                                                                                                                                         | 已禁用 |
| presence                                                                                                                                                           | 已禁用 |

## Components v2 UI

OpenClaw 为 exec approvals 和跨上下文标记使用 Discord components v2。Discord 消息操作也可以接受 `components` 以构建自定义 UI（高级用法；需要通过 discord 工具构造组件负载），而旧版 `embeds` 仍可用，但不推荐使用。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（hex）。
- 可按账户通过 `channels.discord.accounts.<id>.ui.components.accentColor` 设置。
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

## 语音频道

OpenClaw 可以加入 Discord 语音频道，以进行实时、连续的对话。这与语音消息附件不同。

要求：

- 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
- 配置 `channels.discord.voice`。
- 机器人需要在目标语音频道中拥有 Connect 和 Speak 权限。

使用仅限 Discord 的原生命令 `/vc join|leave|status` 来控制会话。该命令使用账户默认智能体，并遵循与其他 Discord 命令相同的 allowlist 和 group policy 规则。

自动加入示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
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
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

说明：

- `voice.tts` 仅对语音播放覆盖 `messages.tts`。
- 语音转录轮次会根据 Discord `allowFrom`（或 `dm.allowFrom`）推导所有者状态；非所有者说话者无法访问仅所有者可用的工具（例如 `gateway` 和 `cron`）。
- 默认启用语音；设置 `channels.discord.voice.enabled=false` 可禁用。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会直接传递给 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还会监控接收解密失败，并在短时间内多次失败后通过离开 / 重新加入语音频道来自动恢复。
- 如果接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，这可能是上游 `@discordjs/voice` 接收问题，参见 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)。

## 语音消息

Discord 语音消息会显示波形预览，并要求使用 OGG/Opus 音频及元数据。OpenClaw 会自动生成波形，但它需要在 Gateway 网关主机上提供 `ffmpeg` 和 `ffprobe`，以便检查并转换音频文件。

要求与限制：

- 提供**本地文件路径**（URL 会被拒绝）。
- 不要包含文本内容（Discord 不允许在同一负载中同时发送文本和语音消息）。
- 接受任意音频格式；OpenClaw 会在需要时将其转换为 OGG/Opus。

示例：

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不被允许的 intents，或机器人看不到 guild 消息">

    - 启用 Message Content Intent
    - 当你依赖用户 / 成员解析时，启用 Server Members Intent
    - 更改 intents 后重启 gateway

  </Accordion>

  <Accordion title="Guild 消息被意外阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的 guild allowlist
    - 如果存在 guild `channels` 映射，则仅允许列出的频道
    - 验证 `requireMention` 行为和提及模式

    实用检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 为 false，但仍然被阻止">
    常见原因：

    - `groupPolicy="allowlist"`，但没有匹配的 guild / channel allowlist
    - `requireMention` 配置在错误位置（必须位于 `channels.discord.guilds` 或频道条目下）
    - 发送者被 guild / channel `users` allowlist 阻止

  </Accordion>

  <Accordion title="长时间运行的处理器超时或出现重复回复">

    典型日志：

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    监听器预算调节项：

    - 单账户：`channels.discord.eventQueue.listenerTimeout`
    - 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Worker 运行超时调节项：

    - 单账户：`channels.discord.inboundWorker.runTimeoutMs`
    - 多账户：`channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    对于缓慢的监听器设置，请使用 `eventQueue.listenerTimeout`；仅当你希望为排队的智能体轮次设置单独的安全阀时，才使用 `inboundWorker.runTimeoutMs`。

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 的权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可能正常工作，但探测无法完整验证权限。

  </Accordion>

  <Accordion title="私信与配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="机器人对机器人循环">
    默认情况下，会忽略由机器人发送的消息。

    如果你设置了 `channels.discord.allowBots=true`，请使用严格的提及和 allowlist 规则来避免循环行为。
    更推荐使用 `channels.discord.allowBots="mentions"`，仅接受那些提及机器人的机器人消息。

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 而中断">

    - 保持 OpenClaw 为最新版本（`openclaw update`），以确保包含 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认）开始，仅在需要时调整
    - 观察日志中的以下内容：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后仍持续失败，请收集日志并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 进行对比

  </Accordion>
</AccordionGroup>

## 配置参考指引

主要参考：

- [配置参考 - Discord](/zh-CN/gateway/configuration-reference#discord)

高价值 Discord 字段：

- 启动 / 认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 入站 worker：`inboundWorker.runTimeoutMs`
- 回复 / 历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧别名：`streamMode`）、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体 / 重试：`mediaMaxMb`、`retry`
  - `mediaMaxMb` 限制 Discord 出站上传大小（默认：`8MB`）
- 操作：`actions.*`
- 状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全与运维

- 将 bot token 视为密钥（在受监管环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小必要的 Discord 权限。
- 如果命令部署 / 状态陈旧，请重启 gateway，并使用 `openclaw channels status --probe` 重新检查。

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [渠道路由](/zh-CN/channels/channel-routing)
- [安全](/zh-CN/gateway/security)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)
- [斜杠命令](/zh-CN/tools/slash-commands)

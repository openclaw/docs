---
read_when:
    - 开发 Discord 渠道功能
summary: Discord 机器人支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-05-02T09:29:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

已可通过官方 Discord gateway 处理私信和服务器渠道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认进入配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

你需要创建一个带 bot 的新应用，将 bot 添加到你的服务器，并将其与 OpenClaw 配对。我们建议将你的 bot 添加到自己的私有服务器。如果你还没有服务器，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然后点击 **New Application**。将其命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你的 OpenClaw 智能体名称。

  </Step>

  <Step title="启用特权 intents">
    仍在 **Bot** 页面上，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色允许列表和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅在需要在线状态更新时使用）

  </Step>

  <Step title="复制你的 bot token">
    回到 **Bot** 页面上方并点击 **Reset Token**。

    <Note>
    尽管名称如此，这会生成你的第一个 token，而不是在“重置”任何内容。
    </Note>

    复制该 token 并保存到某处。这是你的 **Bot Token**，你很快会用到它。

  </Step>

  <Step title="生成邀请 URL 并将 bot 添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用于将 bot 添加到你的服务器。

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

    这是普通文本渠道的基线权限集。如果你计划在 Discord thread 中发帖，包括会创建或继续 thread 的论坛或媒体渠道工作流，也要启用 **Send Messages in Threads**。
    复制底部生成的 URL，将其粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的 bot。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用中，你需要启用 Developer Mode，以便复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 右键点击侧边栏中的**服务器图标** → **Copy Server ID**
    3. 右键点击你**自己的头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存，下一步你会将这三项都发送给 OpenClaw。

  </Step>

  <Step title="允许来自服务器成员的私信">
    为了让配对正常工作，Discord 需要允许你的 bot 给你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 打开 **Direct Messages**。

    这会允许服务器成员（包括 bot）向你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持开启。如果你只计划使用服务器渠道，可以在配对后禁用私信。

  </Step>

  <Step title="安全设置你的 bot token（不要在聊天中发送）">
    你的 Discord bot token 是密钥（类似密码）。在给你的智能体发消息之前，在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    如果 OpenClaw 已作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请在存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将变量存储在 `~/.openclaw/.env` 中，这样服务重启后就能解析 env SecretRef。
    如果你的主机被 Discord 启动时的应用查询阻塞或限速，请从 Developer Portal 设置 Discord application/client ID，以便启动时跳过该 REST 调用。默认账户使用 `channels.discord.applicationId`；运行多个 Discord bot 时，使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何现有渠道（例如 Telegram）中与你的 OpenClaw 智能体聊天并告知它。如果 Discord 是你的第一个渠道，请改用 CLI / 配置标签页。

        > “我已经在配置中设置了 Discord bot token。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
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

        默认账户的 env 后备：

```bash
DISCORD_BOT_TOKEN=...
```

        对于脚本化或远程设置，使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 写入同一个 JSON5 块，然后在不带 `--dry-run` 的情况下重新运行。支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。参见[密钥管理](/zh-CN/gateway/secrets)。

        对于多个 Discord bot，将每个 bot token 和 application ID 保存在对应账户下。顶层 `channels.discord.applicationId` 会由账户继承，因此只有在每个账户都应使用相同 application ID 时，才在此处设置。

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准第一次私信配对">
    等到 Gateway 网关运行后，在 Discord 中私信你的 bot。它会回复一个配对码。

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

    你现在应该能够通过 Discord 私信与你的智能体聊天。

  </Step>
</Steps>

<Note>
Token 解析会识别账户。配置中的 token 值优先于 env 后备。`DISCORD_BOT_TOKEN` 只用于默认账户。
如果两个已启用的 Discord 账户解析到同一个 bot token，OpenClaw 只会为该 token 启动一个 Gateway 网关监视器。来自配置的 token 优先于默认 env 后备；否则第一个已启用账户获胜，重复账户会被报告为已禁用。
对于高级出站调用（message 工具/渠道操作），显式的每次调用 `token` 会用于该调用。这适用于发送和读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账户策略/重试设置仍来自活动运行时快照中选定的账户。
</Note>

## 推荐：设置服务器工作区

私信正常工作后，你可以将 Discord 服务器设置为完整工作区，其中每个渠道都有自己的智能体会话和上下文。建议在只有你和你的 bot 的私有服务器中使用这种方式。

<Steps>
  <Step title="将你的服务器添加到服务器允许列表">
    这会让你的智能体能够在服务器上的任何渠道中响应，而不仅限于私信。

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

  <Step title="允许无需 @mention 的响应">
    默认情况下，你的智能体只有在服务器渠道中被 @mentioned 时才会响应。对于私有服务器，你可能希望它响应每条消息。

    在服务器渠道中，普通助手最终回复默认保持私密。可见的 Discord 输出必须通过 `message` 工具显式发送，因此智能体默认可以旁观，并且只在判断渠道回复有用时才发帖。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在此服务器上无需被 @mentioned 即可响应”
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

        要恢复群组/渠道房间的旧版自动最终回复，请设置 `messages.groupChat.visibleReplies: "automatic"`。

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
        如果你需要在每个渠道中共享上下文，请将稳定说明放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话中）。将长期笔记保存在 `MEMORY.md` 中，并按需通过记忆工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些渠道并开始聊天。你的智能体可以看到渠道名称，并且每个渠道都有自己的隔离会话，因此你可以设置 `#coding`、`#home`、`#research` 或任何适合你工作流的渠道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站回复会回到 Discord。
- Discord 服务器/渠道元数据会作为不可信上下文添加到模型提示中，而不是作为用户可见的回复前缀。如果模型把该信封复制回来，OpenClaw 会从出站回复和未来的重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 服务器渠道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组私信默认会被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍会携带 `CommandTargetSessionKey` 到被路由的对话会话。
- 仅文本的 cron/heartbeat 公告投递到 Discord 时，会使用最终对助手可见的答案一次。媒体和结构化组件载荷在智能体发出多个可投递载荷时仍保持多消息形式。

## 论坛渠道

Discord 论坛和媒体渠道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父级（`channel:<forumId>`）发送消息以自动创建线程。线程标题使用你的消息中第一行非空内容。
- 使用 `openclaw message thread create` 直接创建线程。不要为论坛渠道传递 `--message-id`。

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

OpenClaw 支持用于智能体消息的 Discord 组件 v2 容器。使用带有 `components` 载荷的消息工具。交互结果会作为普通入站消息路由回智能体，并遵循现有 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择器和表单在过期前被多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到一条临时拒绝消息。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，其中包含提供商、模型和兼容运行时下拉菜单，以及提交步骤。`/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。选择器回复是临时的，并且只有调用它的用户可以使用。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
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
    `channels.discord.dmPolicy` 控制私信访问。`channels.discord.allowFrom` 是规范的私信允许列表。

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私信策略不是开放的，未知用户会被阻止（或在 `pairing` 模式中被提示配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 对于单个账户，`allowFrom` 优先于旧版 `dm.allowFrom`。
    - 命名账户在自身的 `allowFrom` 和旧版 `dm.allowFrom` 未设置时，会继承 `channels.discord.allowFrom`。
    - 命名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    为兼容性，仍会读取旧版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom`。`openclaw doctor --fix` 会在不改变访问权限的情况下，将它们迁移到 `dmPolicy` 和 `allowFrom`。

    投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    当渠道默认值处于活动状态时，裸数字 ID 通常会解析为渠道 ID，但为兼容性，账户有效私信 `allowFrom` 中列出的 ID 会被视为用户私信目标。

  </Tab>

  <Tab title="DM access groups">
    Discord 私信可以在 `channels.discord.allowFrom` 中使用动态 `accessGroup:<name>` 条目。

    访问组名称在消息渠道之间共享。对于成员以各渠道普通 `allowFrom` 语法表达的静态组，请使用 `type: "message.senders"`；当 Discord 渠道当前的 `ViewChannel` 受众应动态定义成员资格时，请使用 `type: "discord.channelAudience"`。共享访问组行为见此处文档：[访问组](/zh-CN/channels/access-groups)。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord 文本渠道没有单独的成员列表。`type: "discord.channelAudience"` 将成员资格建模为：私信发送者是已配置服务器的成员，并且在应用角色和渠道覆盖后，当前对已配置渠道拥有有效的 `ViewChannel` 权限。

    示例：允许任何能看到 `#maintainers` 的人给机器人发私信，同时对其他所有人保持私信关闭。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    你可以混合动态和静态条目：

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    查找失败时默认关闭。如果 Discord 返回 `Missing Access`，成员查找失败，或渠道属于不同服务器，私信发送者会被视为未授权。

    使用渠道受众访问组时，请在 Discord Developer Portal 中为机器人启用 **Server Members Intent**。私信不包含服务器成员状态，因此 OpenClaw 会在授权时通过 Discord REST 解析成员。

  </Tab>

  <Tab title="Guild policy">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（首选 `id`，也接受 slug）
    - 可选发送者允许列表：`users`（建议使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，发送者匹配 `users` 或 `roles` 时即被允许
    - 默认禁用直接名称/标签匹配；仅在应急兼容模式下启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果服务器配置了 `channels`，未列出的渠道会被拒绝
    - 如果服务器没有 `channels` 块，该允许列表服务器中的所有渠道都会被允许

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

    如果你只设置了 `DISCORD_BOT_TOKEN`，且未创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    服务器消息默认受提及门控。

    提及检测包括：

    - 显式机器人提及
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 受支持情况下的隐式回复机器人行为

    编写出站 Discord 消息时，请使用规范提及语法：用户使用 `<@USER_ID>`，渠道使用 `<#CHANNEL_ID>`，角色使用 `<@&ROLE_ID>`。不要使用旧版 `<@!USER_ID>` 昵称提及形式。

    `requireMention` 按服务器/渠道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选地丢弃提及其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选通过 `dm.groupChannels` 设置允许列表（渠道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 服务器成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并在 peer 或 parent-peer 绑定之后、仅服务器绑定之前评估。如果某个绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），所有已配置字段都必须匹配。

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
- `commands.native=false` 会显式清除之前注册的 Discord 原生命令。
- 原生命令认证使用与普通消息处理相同的 Discord allowlists/策略。
- 对未获授权的用户，命令可能仍会显示在 Discord UI 中；执行时仍会强制执行 OpenClaw 认证并返回“未获授权”。

请参阅 [斜杠命令](/zh-CN/tools/slash-commands)，了解命令目录和行为。

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

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。
    `first` 始终会将隐式原生回复引用附加到该轮次的第一条出站 Discord 消息。
    `batched` 仅当入站轮次是多条消息组成的防抖批次时，
    才会附加 Discord 的隐式原生回复引用。这个选项适合
    你希望主要在模糊的突发聊天中使用原生回复，
    而不是每个单消息轮次都使用时。

    消息 ID 会显示在上下文/历史中，因此智能体可以定位特定消息。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑它来流式传输草稿回复。`channels.discord.streaming` 接受 `off`（默认）| `partial` | `block` | `progress`。在 Discord 上，`progress` 映射到 `partial`；`streamMode` 是旧版别名，会自动迁移。

    默认保持为 `off`，因为当多个 Bot 或 Gateway 网关共享同一账号时，Discord 预览编辑会很快触发速率限制。

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
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并受 `textChunkLimit` 限制）。
    - 媒体、错误和显式回复最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。

    预览流式传输仅支持文本；媒体回复会回退到普通投递。当显式启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

  </Accordion>

  <Accordion title="历史、上下文和线程行为">
    Guild 历史上下文：

    - `channels.discord.historyLimit` 默认值 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话会继承父渠道的会话级 `/model` 选择，作为仅模型回退；线程本地 `/model` 选择仍优先，并且除非启用 transcript 继承，否则不会复制父 transcript 历史。
    - `channels.discord.thread.inheritParent`（默认 `false`）会让新的自动线程选择从父 transcript 播种。按账号覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 消息工具 reactions 可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    渠道主题会作为**不可信**上下文注入。Allowlists 控制谁可以触发智能体，而不是完整的补充上下文遮蔽边界。

  </Accordion>

  <Accordion title="子智能体的线程绑定会话">
    Discord 可以将线程绑定到会话目标，让该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活跃运行和绑定状态
    - `/session idle <duration|off>` 查看/更新已聚焦绑定的非活跃自动取消聚焦时间
    - `/session max-age <duration|off>` 查看/更新已聚焦绑定的硬性最大存活时间

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    说明：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSessions` 控制为 `sessions_spawn({ thread: true })` 和 ACP 线程生成自动创建/绑定线程。默认值：`true`。
    - `defaultSpawnContext` 控制线程绑定生成的原生子智能体上下文。默认值：`"fork"`。
    - 已弃用的 `spawnSubagentSessions`/`spawnAcpSessions` 键会由 `openclaw doctor --fix` 迁移。
    - 如果某个账号禁用了线程绑定，`/focus` 和相关线程绑定操作将不可用。

    请参阅 [子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents) 和 [配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 渠道绑定">
    对于稳定的“始终在线”ACP 工作区，请配置顶层类型化 ACP 绑定，目标指向 Discord 对话。

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

    - `/acp spawn codex --bind here` 会就地绑定当前渠道或线程，并让未来消息保留在同一 ACP 会话上。线程消息会继承父渠道绑定。
    - 在已绑定的渠道或线程中，`/new` 和 `/reset` 会就地重置同一 ACP 会话。临时线程绑定在活跃时可以覆盖目标解析。
    - `spawnSessions` 通过 `--thread auto|here` 门控子线程创建/绑定。

    请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)，了解绑定行为详情。

  </Accordion>

  <Accordion title="Reaction 通知">
    按 Guild 设置的 reaction 通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    Reaction 事件会转换为系统事件并附加到已路由的 Discord 会话。

  </Accordion>

  <Accordion title="确认 reaction">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Discord 接受 unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账号禁用该 reaction。

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。

    这会影响 `/config set|unset` 流程（启用命令功能时）。

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
    通过 `channels.discord.proxy` 将 Discord Gateway 网关 WebSocket 流量和启动 REST 查询（应用 ID + allowlist 解析）路由到 HTTP(S) 代理。

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

    - allowlists 可以使用 `pk:<memberId>`
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，成员显示名称才会按 name/slug 匹配
    - 查询使用原始消息 ID，并受时间窗口限制
    - 如果查询失败，代理消息会被视为 Bot 消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="出站提及别名">
    当智能体需要对已知 Discord 用户进行确定性的出站提及时，请使用 `mentionAliases`。键是不带前导 `@` 的 handle；值是 Discord 用户 ID。未知 handle、`@everyone`、`@here` 以及 Markdown 代码 span 内的提及会保持不变。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Presence 配置">
    当你设置 status 或 activity 字段，或者启用自动 presence 时，会应用 presence 更新。

    仅 status 示例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Activity 示例（自定义 status 是默认 activity 类型）：

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

    Streaming 示例：

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

    Activity 类型映射：

    - 0：正在玩
    - 1：Streaming（需要 `activityUrl`）
    - 2：正在听
    - 3：正在观看
    - 4：自定义（使用 activity 文本作为 status 状态；emoji 可选）
    - 5：正在竞赛

    自动 presence 示例（运行时健康信号）：

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

    自动 presence 会将运行时可用性映射到 Discord status：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的批准">
    Discord 支持在私信中基于按钮处理批准，也可以选择在来源渠道中发布批准提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可能时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，且至少能解析出一个审批者时，Discord 会自动启用原生执行审批；审批者可以来自 `execApprovals.approvers`，也可以来自 `commands.ownerAllowFrom`。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断执行审批者。设置 `enabled: false` 可明确禁用 Discord 作为原生审批客户端。

    对于敏感的仅限所有者群组命令，例如 `/diagnostics` 和 `/export-trajectory`，OpenClaw 会私下发送审批提示和最终结果。当发起命令的所有者有 Discord 所有者路由时，它会先尝试 Discord 私信；如果不可用，则回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，例如 Telegram。

    当 `target` 为 `channel` 或 `both` 时，审批提示会在渠道中可见。只有已解析的审批者可以使用按钮；其他用户会收到一条临时拒绝消息。审批提示会包含命令文本，因此只应在可信渠道中启用渠道投递。如果无法从会话键派生渠道 ID，OpenClaw 会回退到私信投递。

    Discord 还会渲染其他聊天渠道使用的共享审批按钮。原生 Discord 适配器主要增加审批者私信路由和渠道扇出。
    当这些按钮存在时，它们就是主要审批体验；OpenClaw
    只应在工具结果表明聊天审批不可用，或手动审批是唯一路径时包含手动 `/approve` 命令。
    如果 Discord 原生审批运行时未激活，OpenClaw 会保持
    本地确定性的 `/approve <id> <decision>` 提示可见。如果
    运行时已激活但无法向任何目标投递原生卡片，
    OpenClaw 会在同一聊天中发送回退通知，其中包含待处理审批中的确切 `/approve`
    命令。

    Gateway 网关身份验证和审批解析遵循共享 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。审批默认 30 分钟后过期。

    参见[执行审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息、渠道管理、审核、在线状态和元数据操作。

核心示例：

- 消息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 表态：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径），用于设置预定事件封面图。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                             | 默认值  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已启用  |
| roles                                                                                                                                                                    | 已禁用 |
| moderation                                                                                                                                                               | 已禁用 |
| presence                                                                                                                                                                 | 已禁用 |

## Components v2 UI

OpenClaw 使用 Discord components v2 处理执行审批和跨上下文标记。Discord 消息操作也可以接受用于自定义 UI 的 `components`（高级；需要通过 discord 工具构造组件负载），旧版 `embeds` 仍可用，但不推荐。

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

Discord 有两个不同的语音表面：实时**语音频道**（连续对话）和**语音消息附件**（波形预览格式）。Gateway 网关同时支持两者。

### 语音频道

设置检查清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户允许列表时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 作用域邀请机器人。
4. 在目标语音频道中授予 Connect、Speak、Send Messages 和 Read Message History。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账号默认智能体，并遵循与其他 Discord 命令相同的允许列表和群组策略规则。

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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

注意事项：

- `voice.tts` 仅针对语音播放覆盖 `messages.tts`。
- `voice.model` 仅覆盖用于 Discord 语音频道响应的 LLM。保持未设置则继承已路由的智能体模型。
- STT 使用 `tools.media.audio`；`voice.model` 不影响转录。
- 按渠道设置的 Discord `systemPrompt` 覆盖会应用到该语音频道的语音转录轮次。
- 语音转录轮次会从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态；非所有者说话者无法访问仅限所有者的工具（例如 `gateway` 和 `cron`）。
- 对于仅文本配置，Discord 语音是可选启用的；设置 `channels.discord.voice.enabled=true`（或保留现有 `channels.discord.voice` 块）以启用 `/vc` 命令、语音运行时和 `GuildVoiceStates` Gateway 网关意图。
- `channels.discord.intents.voiceStates` 可以明确覆盖语音状态意图订阅。保持未设置时，该意图会跟随有效的语音启用状态。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传到 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间。默认值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在销毁已断开语音会话前，等待其开始重新连接的时长。默认值：`15000`。
- OpenClaw 还会监视接收解密失败，并在短时间窗口内重复失败后，通过离开/重新加入语音频道自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 系列包含来自 discord.js PR #11449 的上游填充修复，该修复关闭了 discord.js issue #11419。

语音频道流水线：

- Discord PCM 捕获会转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录文本会通过 Discord 入口和路由发送，同时响应 LLM 会以语音输出策略运行，该策略隐藏智能体 `tts` 工具并要求返回文本，因为 Discord 语音负责最终 TTS 播放。
- 设置 `voice.model` 时，它只会覆盖此语音频道轮次的响应 LLM。
- `voice.tts` 会合并到 `messages.tts` 之上；生成的音频会在已加入的频道中播放。

凭据按组件解析：`voice.model` 的 LLM 路由身份验证、`tools.media.audio` 的 STT 身份验证，以及 `messages.tts`/`voice.tts` 的 TTS 身份验证。

### 语音消息

Discord 语音消息显示波形预览，并要求使用 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上安装 `ffmpeg` 和 `ffprobe` 以检查和转换。

- 提供**本地文件路径**（拒绝 URL）。
- 省略文本内容（Discord 会拒绝同一负载中的文本 + 语音消息）。
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

  <Accordion title="服务器消息被意外阻止">

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

    - `groupPolicy="allowlist"` 且没有匹配的服务器/渠道允许列表
    - `requireMention` 配置在错误位置（必须位于 `channels.discord.guilds` 或渠道条目下）
    - 发送者被服务器/渠道 `users` 允许列表阻止

  </Accordion>

  <Accordion title="长时间运行的 Discord 轮次或重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 网关队列旋钮：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这只控制 Discord Gateway 网关监听器工作，不控制智能体轮次生命周期

    Discord 不会对排队的智能体轮次应用渠道自有超时。消息监听器会立即移交，排队的 Discord 运行会保留按会话排序，直到会话/工具/运行时生命周期完成或中止工作。

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
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。瞬时失败会回退到 Discord 的默认 Gateway 网关 URL，并在日志中做速率限制。

    元数据超时旋钮：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway 网关 READY 超时重启">
    OpenClaw 在启动期间以及运行时重新连接后会等待 Discord 的 Gateway 网关 `READY` 事件。带启动错峰的多账户设置可能需要比默认值更长的启动 READY 窗口。

    READY 超时调节项：

    - 启动单账户：`channels.discord.gatewayReadyTimeoutMs`
    - 启动多账户：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 配置未设置时的启动环境变量回退：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 启动默认值：`15000`（15 秒），最大值：`120000`
    - 运行时单账户：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 运行时多账户：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 配置未设置时的运行时环境变量回退：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 运行时默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字渠道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完全验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人的循环">
    默认情况下会忽略机器人发送的消息。

    如果你设置 `channels.discord.allowBots=true`，请使用严格的提及和允许列表规则来避免循环行为。
    建议使用 `channels.discord.allowBots="mentions"`，仅接受提及该机器人的机器人消息。

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 掉线">

    - 保持 OpenClaw 为最新版本（`openclaw update`），以确保包含 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认值）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调整
    - 查看日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后故障仍持续，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行比较

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[配置参考 - Discord](/zh-CN/gateway/config-channels#discord)。

<Accordion title="高信号 Discord 字段">

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- Gateway 网关：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`（限制发往 Discord 的上传，默认 `100MB`）、`retry`
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全与运维

- 将机器人令牌视为机密（在受监督环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态已过期，请重启 Gateway 网关，并使用 `openclaw channels status --probe` 重新检查。

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Discord 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群聊和允许列表行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将传入消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型与加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将服务器和渠道映射到智能体。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>

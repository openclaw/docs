---
read_when:
    - 开发 Discord 渠道功能
summary: Discord 机器人支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

可通过官方 Discord gateway 用于私信和服务器频道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

你需要创建一个带有机器人的新应用，将机器人添加到你的服务器，并将它与 OpenClaw 配对。我们建议将你的机器人添加到你自己的私有服务器。如果你还没有服务器，请[先创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，点击 **New Application**。将它命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你对 OpenClaw 智能体的称呼。

  </Step>

  <Step title="启用特权 intent">
    仍在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色允许列表和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅在需要在线状态更新时需要）

  </Step>

  <Step title="复制你的机器人 token">
    回到 **Bot** 页面顶部，点击 **Reset Token**。

    <Note>
    虽然名称如此，但这会生成你的第一个 token，并不会“重置”任何内容。
    </Note>

    复制 token 并保存到某处。这是你的 **Bot Token**，稍后会用到。

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

    这是普通文本频道的基线权限集。如果你计划在 Discord 线程中发帖，包括创建或继续线程的论坛或媒体频道工作流，还要启用 **Send Messages in Threads**。
    复制底部生成的 URL，粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的机器人。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用，你需要启用 Developer Mode，才能复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 右键点击侧边栏中的**服务器图标** → **Copy Server ID**
    3. 右键点击你**自己的头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存，下一步你会把这三项发送给 OpenClaw。

  </Step>

  <Step title="允许服务器成员发送私信">
    为了让配对正常工作，Discord 需要允许你的机器人向你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 打开 **Direct Messages**。

    这会让服务器成员（包括机器人）向你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持启用。如果你只计划使用服务器频道，可以在配对后禁用私信。

  </Step>

  <Step title="安全设置你的机器人 token（不要在聊天中发送）">
    你的 Discord 机器人 token 是秘密信息（类似密码）。在向智能体发送消息前，先在运行 OpenClaw 的机器上设置它。

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

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请在存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将该变量存储在 `~/.openclaw/.env` 中，这样服务在重启后就能解析 env SecretRef。
    如果你的主机被 Discord 的启动应用查询阻止或限速，请从 Developer Portal 设置 Discord application/client ID，这样启动时可以跳过该 REST 调用。默认账户使用 `channels.discord.applicationId`，运行多个 Discord 机器人时使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何现有频道（例如 Telegram）与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个频道，请改用 CLI / 配置标签页。

        > “我已经在配置中设置了 Discord 机器人 token。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
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

        对于脚本化或远程设置，用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 写入同一个 JSON5 块，然后去掉 `--dry-run` 重新运行。支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。参见 [Secrets Management](/zh-CN/gateway/secrets)。

        对于多个 Discord 机器人，请将每个机器人 token 和应用 ID 放在其账户下。顶层 `channels.discord.applicationId` 会被账户继承，因此只有在每个账户都应使用同一个应用 ID 时，才在那里设置它。

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

  <Step title="批准首次私信配对">
    等到 gateway 运行后，在 Discord 中向你的机器人发送私信。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        在你的现有频道中将配对码发送给智能体：

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
Token 解析是账户感知的。配置中的 token 值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
如果两个已启用的 Discord 账户解析到同一个机器人 token，OpenClaw 只会为该 token 启动一个 gateway 监视器。配置来源的 token 优先于默认环境变量回退；否则第一个启用的账户胜出，重复账户会被报告为已禁用。
对于高级出站调用（消息工具/频道操作），显式的每次调用 `token` 会用于该调用。这适用于发送和读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账户策略/重试设置仍来自活动运行时快照中选定的账户。
</Note>

## 推荐：设置服务器工作区

私信可用后，你可以将 Discord 服务器设置为完整工作区，让每个频道都有自己的智能体会话和独立上下文。对于只有你和你的机器人的私有服务器，推荐这样做。

<Steps>
  <Step title="将你的服务器添加到服务器允许列表">
    这会允许你的智能体在服务器上的任何频道中回复，而不仅限于私信。

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

  <Step title="允许无需 @mention 的回复">
    默认情况下，你的智能体只会在服务器频道中被 @mentioned 时回复。对于私有服务器，你可能希望它回复每条消息。

    在服务器频道中，普通助手的最终回复默认保持私密。可见的 Discord 输出必须使用 `message` 工具显式发送，这样智能体默认可以旁观，只在判断频道回复有用时才发帖。

    这意味着所选模型必须可靠地调用工具。如果 Discord 显示正在输入，日志显示有 token 使用量但没有发布消息，请检查会话日志中是否有带 `didSendViaMessagingTool: false` 的助手文本。这表示模型生成了私密最终答案，而不是调用 `message(action=send)`。切换到更强的工具调用模型，或使用下面的配置恢复旧版自动最终回复。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在这个服务器上回复，而不需要被 @mentioned”
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

        要为群组/频道房间恢复旧版自动最终回复，请设置 `messages.groupChat.visibleReplies: "automatic"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划服务器频道中的记忆">
    默认情况下，长期记忆（MEMORY.md）只会在私信会话中加载。服务器频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 频道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，请将稳定指令放在 `AGENTS.md` 或 `USER.md` 中（它们会被注入到每个会话）。将长期笔记保存在 `MEMORY.md` 中，并按需用记忆工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些频道并开始聊天。你的智能体可以看到频道名称，并且每个频道都有自己的隔离会话，因此你可以设置 `#coding`、`#home`、`#research`，或任何适合你工作流的频道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站回复会回到 Discord。
- Discord guild/频道元数据会作为不可信上下文加入到模型提示中，
  而不是作为用户可见的回复前缀。如果模型把该封套复制回来，
  OpenClaw 会从出站回复和未来的重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- Guild 频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- Group DM 默认会被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 指向已路由的对话会话。
- 面向 Discord 的纯文本 cron/heartbeat 公告投递只使用一次最终的
  assistant 可见答案。媒体和结构化组件载荷在智能体发出多个可投递载荷时，
  仍保持多消息形式。

## 论坛频道

Discord 论坛和媒体频道只接受 thread 帖子。OpenClaw 支持两种创建方式：

- 向论坛父级（`channel:<forumId>`）发送消息以自动创建 thread。thread 标题使用你的消息中第一行非空内容。
- 使用 `openclaw message thread create` 直接创建 thread。不要为论坛频道传递 `--message-id`。

示例：发送到论坛父级以创建 thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建论坛 thread

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

论坛父级不接受 Discord 组件。如果你需要组件，请发送到 thread 本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持用于智能体消息的 Discord components v2 containers。使用带有 `components` 载荷的 message 工具。交互结果会作为普通入站消息路由回智能体，并遵循现有 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- Action rows 最多允许 5 个按钮或一个 select 菜单
- Select 类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件为一次性使用。设置 `components.reusable=true` 以允许按钮、select 和表单在过期前多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到临时拒绝提示。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，其中包含提供商、模型和兼容运行时下拉菜单，以及提交步骤。`/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。选择器回复是临时的，并且只有发起用户可以使用。Discord select 菜单限制为 25 个选项，因此当你希望选择器只为选定提供商（例如 `openai-codex` 或 `vllm`）显示动态发现的模型时，请向 `agents.defaults.models` 添加 `provider/*` 条目。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件使用 `media-gallery`
- 当上传名称应匹配附件引用时，使用 `filename` 覆盖上传名称

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
  <Tab title="DM 策略">
    `channels.discord.dmPolicy` 控制 DM 访问。`channels.discord.allowFrom` 是规范的 DM allowlist。

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 策略不是开放的，未知用户会被阻止（或在 `pairing` 模式下被提示配对）。

    多账号优先级：

    - `channels.discord.accounts.default.allowFrom` 只适用于 `default` 账号。
    - 对于一个账号，`allowFrom` 优先于旧版 `dm.allowFrom`。
    - 命名账号在自身的 `allowFrom` 和旧版 `dm.allowFrom` 未设置时，会继承 `channels.discord.allowFrom`。
    - 命名账号不会继承 `channels.discord.accounts.default.allowFrom`。

    旧版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍会读取以保持兼容性。`openclaw doctor --fix` 会在不改变访问权限的情况下，把它们迁移到 `dmPolicy` 和 `allowFrom`。

    用于投递的 DM 目标格式：

    - `user:<id>`
    - `<@id>` mention

    当频道默认值处于活动状态时，裸数字 ID 通常解析为频道 ID，但为兼容性起见，列在账号有效 DM `allowFrom` 中的 ID 会被视为用户 DM 目标。

  </Tab>

  <Tab title="访问组">
    Discord DM 和文本命令授权可以在 `channels.discord.allowFrom` 中使用动态 `accessGroup:<name>` 条目。

    访问组名称在消息渠道之间共享。对于成员使用各渠道普通 `allowFrom` 语法表示的静态组，使用 `type: "message.senders"`；当 Discord 频道当前的 `ViewChannel` 受众应动态定义成员资格时，使用 `type: "discord.channelAudience"`。共享访问组行为记录在这里：[访问组](/zh-CN/channels/access-groups)。

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

    Discord 文本频道没有单独的成员列表。`type: "discord.channelAudience"` 将成员资格建模为：DM 发送者是已配置 guild 的成员，并且在应用角色和频道覆写后，当前对已配置频道拥有有效的 `ViewChannel` 权限。

    示例：允许任何能看到 `#maintainers` 的人向 bot 发送 DM，同时对其他所有人保持 DM 关闭。

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

    查找失败时默认关闭。如果 Discord 返回 `Missing Access`、成员查找失败，或频道属于不同 guild，则 DM 发送者会被视为未授权。

    使用频道受众访问组时，请在 Discord Developer Portal 中为 bot 启用 **Server Members Intent**。DM 不包含 guild 成员状态，因此 OpenClaw 会在授权时通过 Discord REST 解析成员。

  </Tab>

  <Tab title="Guild 策略">
    Guild 处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当 `channels.discord` 存在时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - guild 必须匹配 `channels.discord.guilds`（推荐 `id`，也接受 slug）
    - 可选的发送者 allowlist：`users`（推荐稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，发送者匹配 `users` 或 `roles` 时即被允许
    - 默认禁用直接名称/标签匹配；仅作为 break-glass 兼容模式启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果 guild 配置了 `channels`，未列出的频道会被拒绝
    - 如果 guild 没有 `channels` 块，则该 allowlist guild 中的所有频道都会被允许

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

    如果你只设置 `DISCORD_BOT_TOKEN` 而未创建 `channels.discord` 块，运行时回退值会是 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mention 和 Group DM">
    Guild 消息默认受 mention 门控。

    Mention 检测包括：

    - 显式 bot mention
    - 已配置的 mention patterns（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 支持情况下的隐式 reply-to-bot 行为

    编写出站 Discord 消息时，请使用规范 mention 语法：用户使用 `<@USER_ID>`，频道使用 `<#CHANNEL_ID>`，角色使用 `<@&ROLE_ID>`。不要使用旧版 `<@!USER_ID>` 昵称 mention 形式。

    `requireMention` 按 guild/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃提到其他用户/角色但未提到 bot 的消息（不包括 @everyone/@here）。

    Group DM：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选 allowlist 通过 `dm.groupChannels` 配置（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord guild 成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并在 peer 或 parent-peer 绑定之后、guild-only 绑定之前评估。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），所有已配置字段都必须匹配。

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

- `commands.native` 默认为 `"auto"`，并对 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会在启动期间跳过 Discord 斜杠命令注册和清理。先前注册的命令可能仍会在 Discord 中可见，直到你从 Discord 应用中移除它们。
- 原生命令认证使用与普通消息处理相同的 Discord 允许列表/策略。
- 对未获授权的用户，命令可能仍会在 Discord UI 中可见；执行时仍会强制执行 OpenClaw 认证，并返回 “not authorized”。

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

    注意：`off` 会禁用隐式回复串联。显式 `[[reply_to_*]]` 标签仍会生效。
    `first` 始终会把隐式原生回复引用附加到该轮次的第一条出站 Discord 消息。
    `batched` 仅在入站轮次是由多条消息防抖合并而成的批次时，
    才会附加 Discord 的隐式原生回复引用。当你主要希望在有歧义的突发聊天中使用原生回复，
    而不是每个单消息轮次都使用时，这很有用。

    消息 ID 会在上下文/历史中暴露，以便智能体可以定位特定消息。

  </Accordion>

  <Accordion title="实时流预览">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑它来流式传输回复草稿。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（默认）。`progress` 会保留一个可编辑的状态草稿，并用工具进度更新它直到最终送达；共享的起始标签是一条滚动行，因此当出现足够多工作内容后，它会像其余内容一样滚动离开。`streamMode` 是旧版运行时别名。运行 `openclaw doctor --fix` 可将持久化配置重写为规范键名。

    将 `channels.discord.streaming.mode` 设置为 `off` 可禁用 Discord 预览编辑。如果显式启用了 Discord 分块流式传输，OpenClaw 会跳过预览流，以避免重复流式传输。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` 会在令牌到达时编辑单条预览消息。
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并限制在 `textChunkLimit` 内）。
    - 媒体、错误和显式回复最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。
    - 工具/进度行会在可用时渲染为紧凑的 emoji + 标题 + 详情，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制紧凑进度行中的命令/执行详情：`raw`（默认）或 `status`（仅工具标签）。

    在保留紧凑进度行的同时隐藏原始命令/执行文本：

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    预览流式传输仅支持文本；媒体回复会回退到普通送达。当显式启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。

  </Accordion>

  <Accordion title="历史、上下文和线程行为">
    服务器历史上下文：

    - `channels.discord.historyLimit` 默认值为 `20`
    - 回退项：`messages.groupChat.historyLimit`
    - `0` 会禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话会继承父渠道的会话级 `/model` 选择，作为仅模型的回退；线程本地 `/model` 选择仍优先，且不会复制父转录历史，除非启用了转录继承。
    - `channels.discord.thread.inheritParent`（默认 `false`）会让新的自动线程选择从父转录播种。按账号覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - 消息工具反应可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    渠道主题会作为**不可信**上下文注入。允许列表限制谁可以触发智能体，而不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="子智能体的线程绑定会话">
    Discord 可以将线程绑定到会话目标，以便该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 查看/更新聚焦绑定的不活动自动取消聚焦
    - `/session max-age <duration|off>` 查看/更新聚焦绑定的硬性最长时限

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
    - `spawnSessions` 控制为 `sessions_spawn({ thread: true })` 和 ACP 线程派生自动创建/绑定线程。默认值：`true`。
    - `defaultSpawnContext` 控制线程绑定派生的原生子智能体上下文。默认值：`"fork"`。
    - 已弃用的 `spawnSubagentSessions`/`spawnAcpSessions` 键会由 `openclaw doctor --fix` 迁移。
    - 如果某个账号禁用了线程绑定，`/focus` 和相关线程绑定操作将不可用。

    请参阅[子智能体](/zh-CN/tools/subagents)、[ACP Agents](/zh-CN/tools/acp-agents) 和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 渠道绑定">
    对于稳定的“始终在线”ACP 工作区，请配置顶层类型化 ACP 绑定，目标指向 Discord 对话。

    配置路径：

    - `bindings[]`，包含 `type: "acp"` 和 `match.channel: "discord"`

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
    - 在绑定的渠道或线程中，`/new` 和 `/reset` 会就地重置同一 ACP 会话。临时线程绑定在活动时可以覆盖目标解析。
    - `spawnSessions` 通过 `--thread auto|here` 限制子线程创建/绑定。

    请参阅 [ACP Agents](/zh-CN/tools/acp-agents)，了解绑定行为详情。

  </Accordion>

  <Accordion title="反应通知">
    按服务器设置的反应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反应事件会被转换为系统事件，并附加到路由后的 Discord 会话。

  </Accordion>

  <Accordion title="确认反应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Discord 接受 Unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账号禁用反应。

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。

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
    通过 HTTP(S) 代理使用 `channels.discord.proxy` 路由 Discord 网关 WebSocket 流量和启动 REST 查询（应用 ID + 允许列表解析）。

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

    - 允许列表可以使用 `pk:<memberId>`
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，成员显示名称才会按名称/slug 匹配
    - 查询使用原始消息 ID，并受时间窗口限制
    - 如果查询失败，代理消息会被视为机器人消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="出站提及别名">
    当智能体需要对已知 Discord 用户进行确定性的出站提及时，请使用 `mentionAliases`。键是不带前导 `@` 的用户名；值是 Discord 用户 ID。未知用户名、`@everyone`、`@here` 以及 Markdown 代码 span 中的提及会保持不变。

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

    - 0: 正在玩
    - 1: 正在直播（需要 `activityUrl`）
    - 2: 正在听
    - 3: 正在观看
    - 4: 自定义（使用活动文本作为 Status 状态；表情符号可选）
    - 5: 正在比赛

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

    自动在线状态会将运行时可用性映射到 Discord 状态：健康 => 在线，降级或未知 => 空闲，耗尽或不可用 => 请勿打扰。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中使用按钮处理审批，也可以选择在发起频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可能时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以解析出一个审批者时，Discord 会自动启用原生 exec 审批；审批者可以来自 `execApprovals.approvers`，也可以来自 `commands.ownerAllowFrom`。Discord 不会从频道 `allowFrom`、旧版 `dm.allowFrom` 或直接消息 `defaultTo` 推断 exec 审批者。设置 `enabled: false` 可显式禁用 Discord 作为原生审批客户端。

    对于 `/diagnostics` 和 `/export-trajectory` 等敏感的仅限所有者群组命令，OpenClaw 会私下发送审批提示和最终结果。当调用命令的所有者有 Discord 所有者路由时，它会先尝试 Discord 私信；如果不可用，则回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，例如 Telegram。

    当 `target` 为 `channel` 或 `both` 时，审批提示会在频道中可见。只有已解析的审批者可以使用按钮；其他用户会收到临时拒绝。审批提示包含命令文本，因此只应在可信频道中启用频道投递。如果无法从会话键推导出频道 ID，OpenClaw 会回退到私信投递。

    Discord 还会渲染其他聊天渠道使用的共享审批按钮。原生 Discord 适配器主要增加审批者私信路由和频道扇出。
    当这些按钮存在时，它们是主要审批 UX；只有当工具结果表明
    聊天审批不可用，或手动审批是唯一路径时，OpenClaw
    才应包含手动 `/approve` 命令。
    如果 Discord 原生审批运行时未激活，OpenClaw 会保留
    本地确定性的 `/approve <id> <decision>` 提示可见。如果
    运行时已激活，但原生卡片无法投递到任何目标，
    OpenClaw 会在同一聊天中发送回退通知，其中包含待审批项中的精确 `/approve`
    命令。

    Gateway 网关认证和审批解析遵循共享的 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。审批默认在 30 分钟后过期。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和动作门控

Discord 消息动作包括消息、频道管理、审核、在线状态和元数据动作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 表情回应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 动作接受可选的 `image` 参数（URL 或本地文件路径），用于设置计划事件封面图片。

动作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 动作组                                                                                                                                                                   | 默认值   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已启用   |
| roles                                                                                                                                                                    | 已禁用   |
| moderation                                                                                                                                                               | 已禁用   |
| presence                                                                                                                                                                 | 已禁用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 处理 exec 审批和跨上下文标记。Discord 消息动作也可以接受 `components` 作为自定义 UI（高级用法；需要通过 discord 工具构造组件载荷），而旧版 `embeds` 仍可用，但不推荐使用。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账户设置。
- 当 components v2 存在时，`embeds` 会被忽略。

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

Discord 有两个不同的语音界面：实时 **语音频道**（连续对话）和 **语音消息附件**（波形预览格式）。Gateway 网关同时支持两者。

### 语音频道

设置检查清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户允许列表时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 作用域邀请 bot。
4. 在目标语音频道中授予 Connect、Speak、Send Messages 和 Read Message History 权限。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账户默认智能体，并遵循与其他 Discord 命令相同的允许列表和群组策略规则。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

要在加入前检查 bot 的有效权限，请运行：

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

自动加入示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
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
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

注意事项：

- `voice.tts` 仅覆盖用于 `stt-tts` 语音播放的 `messages.tts`。实时模式使用 `voice.realtime.voice`。
- `voice.mode` 控制对话路径。默认值是 `agent-proxy`：实时语音前端处理轮次时序、打断和播放，通过 `openclaw_agent_consult` 将实质性工作委托给路由后的 OpenClaw 智能体，并把结果当作来自该说话者的已输入 Discord 提示词。`stt-tts` 保留较旧的批量 STT 加 TTS 流程。`bidi` 允许实时模型直接对话，同时暴露 `openclaw_agent_consult` 作为 OpenClaw 大脑。
- `voice.agentSession` 控制哪个 OpenClaw 对话接收语音轮次。保持未设置时使用语音渠道自己的会话，或设置 `{ mode: "target", target: "channel:<text-channel-id>" }`，让语音渠道作为现有 Discord 文本渠道会话（例如 `#maintainers`）的麦克风/扬声器扩展。
- `voice.model` 覆盖用于 Discord 语音响应和实时咨询的 OpenClaw 智能体大脑。保持未设置时继承路由后的智能体模型。它与 `voice.realtime.model` 分开。
- `agent-proxy` 通过 `discord-voice` 路由语音，这会保留说话者和目标会话的正常所有者/工具授权，但隐藏智能体 `tts` 工具，因为 Discord 语音负责播放。默认情况下，`agent-proxy` 会为所有者说话者赋予咨询完整的等同所有者工具访问权限（`voice.realtime.toolPolicy: "owner"`），并强烈倾向在给出实质性回答前先咨询 OpenClaw 智能体（`voice.realtime.consultPolicy: "always"`）。在这个默认的 `always` 模式下，实时层不会在咨询答案之前自动说填充内容；它会捕获并转写语音，然后说出路由后的 OpenClaw 答案。如果 Discord 仍在播放第一个答案时多个强制咨询答案完成，后续逐字语音答案会排队，直到播放空闲，而不是在句子中途替换语音。
- 在 `stt-tts` 模式下，STT 使用 `tools.media.audio`；`voice.model` 不影响转写。
- 在实时模式下，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.voice` 配置实时音频会话。对于 OpenAI Realtime 2 加 Codex 大脑，使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai-codex/gpt-5.5"`。
- OpenAI 实时提供商接受当前 Realtime 2 事件名称以及用于输出音频和转写事件的旧版 Codex 兼容别名，因此兼容的提供商快照可以漂移，而不会丢失助手音频。
- `voice.realtime.bargeIn` 控制 Discord 说话者开始事件是否打断正在进行的实时播放。如果未设置，它会遵循实时提供商的输入音频打断设置。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 实时插话截断音频前的最短助手播放时长。默认值：`250`。在低回声房间中设为 `0` 可立即打断，或在回声较重的扬声器设置中调高它。
- 对于在 Discord 播放的 OpenAI 语音，设置 `voice.tts.provider: "openai"`，并在 `voice.tts.openai.voice` 或 `voice.tts.providers.openai.voice` 下选择一个文本转语音声音。在当前 OpenAI TTS 模型上，`cedar` 是一个听起来偏男性的不错选择。
- 每个频道的 Discord `systemPrompt` 覆盖会应用于该语音频道的语音转写轮次。
- 语音转写轮次从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态；非所有者说话者无法访问仅限所有者的工具（例如 `gateway` 和 `cron`）。
- Discord 语音对于仅文本配置是选择加入的；设置 `channels.discord.voice.enabled=true`（或保留现有 `channels.discord.voice` 块）以启用 `/vc` 命令、语音运行时和 `GuildVoiceStates` Gateway 网关 intent。
- `channels.discord.intents.voiceStates` 可以显式覆盖语音状态 intent 订阅。保持未设置时，intent 会跟随有效的语音启用状态。
- 如果 `voice.autoJoin` 对同一个 guild 有多个条目，OpenClaw 会加入该 guild 最后配置的频道。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 的默认值是 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 默认使用纯 JS `opusscript` 解码器接收 Discord 语音。可选的原生 `@discordjs/opus` 包会被仓库 pnpm 安装策略忽略，因此正常安装、Docker 通道和无关测试不会编译原生插件。专用语音性能主机可以在安装原生插件后通过 `OPENCLAW_DISCORD_OPUS_DECODER=native` 选择加入。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试初始等待 `@discordjs/voice` Ready 的时间。默认值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在销毁已断开的语音会话前，等待其开始重新连接的时长。默认值：`15000`。
- 在 `stt-tts` 模式下，不会仅因为另一位用户开始说话就停止语音播放。为避免反馈回路，OpenClaw 会在 TTS 播放期间忽略新的语音捕获；请在播放结束后再说下一轮。实时模式会将说话者开始事件作为插话信号转发给实时提供商。
- 在实时模式下，扬声器声音进入开放麦克风可能看起来像插话并打断播放。对于回声较重的 Discord 房间，设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，以阻止 OpenAI 因输入音频而自动打断。若仍希望 Discord 说话者开始事件打断正在进行的播放，请添加 `voice.realtime.bargeIn: true`。OpenAI 实时桥接会把短于 `voice.realtime.minBargeInAudioEndMs` 的播放截断视为可能的回声/噪声并忽略，将其记录为已跳过，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 OpenClaw 在 Discord 报告说话者停止后等待多久，才最终确定该音频片段用于 STT。默认值：`2500`；如果 Discord 将正常停顿拆成断续的部分转写，请调高此值。
- 当 ElevenLabs 是选定的 TTS 提供商时，Discord 语音播放使用流式 TTS，并从提供商响应流开始。不支持流式传输的提供商会回退到合成的临时文件路径。
- OpenClaw 还会监视接收解密失败，并在短时间窗口内重复失败后，通过离开/重新加入语音频道自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 版本线包含来自 discord.js PR #11449 的上游 padding 修复，该修复关闭了 discord.js issue #11419。
- 当 OpenClaw 最终确定捕获到的说话者片段时，`The operation was aborted` 接收事件是预期行为；它们是详细诊断，不是警告。
- 详细 Discord 语音日志会为每个已接受的说话者片段包含一行有界的 STT 转写预览，因此调试时能同时看到用户侧和智能体回复侧，而不会输出无界的转写文本。
- 在 `agent-proxy` 模式下，强制咨询回退会跳过可能不完整的转写片段，例如以 `...` 结尾的文本或像 `and` 这样的尾随连接词，以及明显不可操作的结束语（例如 “马上回来” 或 “再见”）。当这阻止陈旧的排队答案时，日志会显示 `forced agent consult skipped reason=...`。

源码检出的原生 opus 设置：

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

当你需要上游 macOS arm64 预构建原生插件时，请为 Gateway 网关使用 Node 22。如果使用其他 Node 运行时，选择加入的安装器可能需要本地 `node-gyp` 源码构建工具链。

安装原生插件后，使用以下命令启动 Gateway 网关：

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

详细语音日志应显示 `discord voice: opus decoder: @discordjs/opus`。如果没有环境变量选择加入，或者原生插件缺失或无法在主机上加载，OpenClaw 会记录 `discord voice: opus decoder: opusscript`，并通过纯 JS 回退继续接收语音。

STT 加 TTS 管道：

- Discord PCM 捕获会转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转写会通过 Discord 入口和路由发送，同时响应 LLM 以语音输出策略运行，该策略会隐藏智能体 `tts` 工具并要求返回文本，因为 Discord 语音负责最终 TTS 播放。
- 设置后，`voice.model` 仅覆盖该语音频道轮次的响应 LLM。
- `voice.tts` 会合并覆盖 `messages.tts`；支持流式传输的提供商会直接馈送播放器，否则会播放生成的音频文件到已加入的频道。

默认 agent-proxy 语音频道会话示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

没有 `voice.agentSession` 块时，每个语音频道都会获得自己的路由后 OpenClaw 会话。例如，`/vc join channel:234567890123456789` 会与该 Discord 语音频道的会话对话。实时模型只是语音前端；实质性请求会交给已配置的 OpenClaw 智能体。如果实时模型在没有调用咨询工具的情况下生成最终转写，OpenClaw 会强制进行咨询作为回退，因此默认行为仍然像是在与智能体对话。

旧版 STT 加 TTS 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

实时 bidi 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

将语音作为现有 Discord 频道会话的扩展：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式下，机器人会加入已配置的语音频道，但 OpenClaw 智能体轮次使用目标频道的正常路由会话和智能体。实时语音会话会将返回结果说回语音频道。监督智能体仍可根据其工具策略使用正常消息工具，包括在这是正确操作时发送单独的 Discord 消息。

有用的目标形式：

- `target: "channel:123456789012345678"` 通过 Discord 文本频道会话路由。
- `target: "123456789012345678"` 会被视为频道目标。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 通过该私信会话路由。

回声较重的 OpenAI Realtime 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

当模型通过打开的麦克风听到自己的 Discord 播放声音，但你仍希望通过说话来打断它时，请使用此配置。OpenClaw 会阻止 OpenAI 基于原始输入音频自动打断，而 `bargeIn: true` 会让 Discord 的说话者开始事件和已处于活跃状态的说话者音频，在下一个捕获轮次到达 OpenAI 之前取消活跃的实时响应。`audioEndMs` 低于 `minBargeInAudioEndMs` 的过早插话信号会被视为可能的回声/噪声并被忽略，这样模型就不会在第一个播放帧处被截断。

预期语音日志：

- 加入时：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 实时启动时：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 说话者音频时：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 跳过过期语音时：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 实时响应完成时：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重置时：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 实时 consult 时：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent 回答时：`discord voice: agent turn answer ...`
- 精确语音入队时：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，随后是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 检测到插话时：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，随后是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 实时中断时：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，随后是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回声/噪声时：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 禁用插话时：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 空闲播放时：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

要调试音频被截断的问题，请把实时语音日志当作时间线来阅读：

1. `realtime audio playback started` 表示 Discord 已开始播放助手音频。从这一点开始，桥接器会统计助手输出块、Discord PCM 字节、提供商实时字节，以及合成音频时长。
2. `realtime speaker turn opened` 标记某个 Discord 说话者变为活跃。如果播放已经处于活跃状态并且启用了 `bargeIn`，后面可能会出现 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 标记该说话者轮次收到的第一个实际音频帧。这里的 `outputActive=true` 或非零 `outputAudioMs` 表示麦克风正在发送输入，同时助手播放仍处于活跃状态。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助手播放处于活跃状态时看到了实时说话者音频。这有助于区分真正的打断，以及没有有用音频的 Discord 说话者开始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求实时提供商取消或截断活跃响应。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，这样你可以看到在中断之前实际播放了多少助手音频。
6. `realtime audio playback stopped reason=...` 是本地 Discord 播放重置点。原因会说明是谁停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 汇总捕获到的输入轮次。`chunks=0` 或 `hasAudio=false` 表示说话者轮次已打开，但没有可用音频到达实时桥接器。`interruptedPlayback=true` 表示该输入轮次与助手输出重叠，并触发了插话逻辑。

有用字段：

- `outputAudioMs`：实时提供商在该日志行之前生成的助手音频时长。
- `audioMs`：OpenClaw 在播放停止之前统计的助手音频时长。
- `elapsedMs`：打开和关闭播放流或说话者轮次之间的墙钟时间。
- `discordBytes`：发送到 Discord 语音或从 Discord 语音接收的 48 kHz 立体声 PCM 字节。
- `realtimeBytes`：发送到实时提供商或从实时提供商接收的提供商格式 PCM 字节。
- `playbackChunks`：为活跃响应转发到 Discord 的助手音频块。
- `sinceLastAudioMs`：最后一个捕获的说话者音频帧与说话者轮次关闭之间的间隔。

常见模式：

- 如果立即截断，并且出现 `source=active-speaker-audio`、较小的 `outputAudioMs`，且同一用户在附近，通常表示扬声器回声进入了麦克风。提高 `voice.realtime.minBargeInAudioEndMs`、降低扬声器音量、使用耳机，或设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 后面跟着 `speaker turn closed ... hasAudio=false` 表示 Discord 报告了说话者开始，但没有音频到达 OpenClaw。这可能是临时的 Discord 语音事件、噪声门行为，或客户端短暂按下麦克风。
- 如果 `audio playback stopped reason=stream-close` 附近没有插话或 `provider-clear-audio`，表示本地 Discord 播放流意外结束。检查前面的提供商和 Discord 播放器日志。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助手音频处于活跃状态时有意丢弃输入。如果你希望语音打断播放，请启用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供商 VAD 报告了语音，但 OpenClaw 没有可中断的活跃播放。这不应截断音频。

凭证按组件解析：`voice.model` 使用 LLM 路由凭证，`tools.media.audio` 使用 STT 凭证，`messages.tts`/`voice.tts` 使用 TTS 凭证，`voice.realtime.providers` 或提供商的常规身份验证配置使用实时提供商凭证。

### 语音消息

Discord 语音消息会显示波形预览，并且需要 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上安装 `ffmpeg` 和 `ffprobe` 来检查并转换。

- 提供一个**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 会拒绝在同一个载荷中同时包含文本和语音消息）。
- 接受任何音频格式；OpenClaw 会按需转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intents，或机器人看不到服务器消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 更改 intents 后重启 Gateway 网关

  </Accordion>

  <Accordion title="服务器消息被意外阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的服务器允许列表
    - 如果存在服务器 `channels` 映射，则只允许列出的频道
    - 验证 `requireMention` 行为和提及模式

    有用检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 为 false 但仍被阻止">
    常见原因：

    - `groupPolicy="allowlist"`，但没有匹配的服务器/频道允许列表
    - `requireMention` 配置在了错误位置（必须位于 `channels.discord.guilds` 或频道条目下）
    - 发送者被服务器/频道 `users` 允许列表阻止

  </Accordion>

  <Accordion title="长时间运行的 Discord 轮次或重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 网关队列旋钮：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这只控制 Discord Gateway 网关监听器工作，不控制 agent 轮次生命周期

    Discord 不会对已排队的 agent 轮次应用频道自有超时。消息监听器会立即交接，已排队的 Discord 运行会保持每个会话的顺序，直到会话/工具/运行时生命周期完成或中止该工作。

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
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。瞬时失败会回退到 Discord 的默认 Gateway 网关 URL，并在日志中受到速率限制。

    元数据超时旋钮：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway 网关 READY 超时重启">
    OpenClaw 会在启动期间以及运行时重连后等待 Discord 的 Gateway 网关 `READY` 事件。带启动错峰的多账号设置可能需要比默认值更长的启动 READY 窗口。

    READY 超时旋钮：

    - 启动单账号：`channels.discord.gatewayReadyTimeoutMs`
    - 启动多账号：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 配置未设置时的启动环境变量回退：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 启动默认值：`15000`（15 秒），最大值：`120000`
    - 运行时单账号：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 运行时多账号：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 配置未设置时的运行时环境变量回退：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 运行时默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查只适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人的循环">
    默认情况下，机器人作者发送的消息会被忽略。

    如果你设置了 `channels.discord.allowBots=true`，请使用严格的提及和允许名单规则来避免循环行为。
    建议使用 `channels.discord.allowBots="mentions"`，只接受提及机器人的机器人消息。

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 中断">

    - 保持 OpenClaw 为最新版本（`openclaw update`），以便具备 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认值）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调整
    - 查看日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后故障仍然持续，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行对比

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
- 媒体/重试：`mediaMaxMb`（限制出站 Discord 上传，默认 `100MB`）、`retry`
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全和运维

- 将机器人令牌视为机密（在受监管环境中建议使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态已过期，请重启 Gateway 网关，并使用 `openclaw channels status --probe` 重新检查。

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Discord 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群聊和允许名单行为。
  </Card>
  <Card title="频道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="多 Agent 路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将服务器和频道映射到智能体。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>

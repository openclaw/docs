---
read_when:
    - 开发 Discord 渠道功能
summary: Discord 机器人支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-06-27T01:20:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

已可通过官方 Discord gateway 用于私信和服务器频道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认进入配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

你需要创建一个带有 bot 的新应用，将 bot 添加到你的服务器，并将它配对到 OpenClaw。我们建议将你的 bot 添加到你自己的私有服务器。如果你还没有服务器，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，点击 **New Application**。将其命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你给 OpenClaw 智能体起的任意名称。

  </Step>

  <Step title="启用特权 intents">
    仍在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色 allowlist 和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅在需要在线状态更新时启用）

  </Step>

  <Step title="复制你的 bot token">
    在 **Bot** 页面向上滚动，点击 **Reset Token**。

    <Note>
    尽管名称如此，这会生成你的第一个 token——并没有任何内容被“重置”。
    </Note>

    复制该 token 并保存到某处。这是你的 **Bot Token**，稍后会用到。

  </Step>

  <Step title="生成邀请 URL 并将 bot 添加到你的服务器">
    点击侧边栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL，用于将 bot 添加到你的服务器。

    向下滚动到 **OAuth2 URL Generator** 并启用：

    - `bot`
    - `applications.commands`

    下方会出现 **Bot Permissions** 区段。至少启用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基线权限集。如果你计划在 Discord threads 中发帖，包括创建或继续 thread 的论坛或媒体频道工作流，也请启用 **Send Messages in Threads**。
    复制底部生成的 URL，粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。现在你应该能在 Discord 服务器中看到你的 bot。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用，你需要启用 Developer Mode，才能复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 打开 **Developer Mode**
    2. 在侧边栏中右键点击你的 **server icon** → **Copy Server ID**
    3. 右键点击你 **own avatar** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存——下一步你会把这三项都发送给 OpenClaw。

  </Step>

  <Step title="允许来自服务器成员的私信">
    为了让配对正常工作，Discord 需要允许你的 bot 给你发送私信。右键点击你的 **server icon** → **Privacy Settings** → 打开 **Direct Messages**。

    这允许服务器成员（包括 bot）向你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持此项启用。如果你只计划使用服务器频道，可以在配对后禁用私信。

  </Step>

  <Step title="安全设置你的 bot token（不要在聊天中发送）">
    你的 Discord bot token 是密钥（类似密码）。在给智能体发消息之前，将其设置到运行 OpenClaw 的机器上。

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

    如果 OpenClaw 已作为后台服务运行，请通过 OpenClaw Mac app 重启，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请在存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将变量存储在 `~/.openclaw/.env` 中，以便服务在重启后解析 env SecretRef。
    如果你的主机被 Discord 的启动应用查询阻止或限速，请从 Developer Portal 设置 Discord application/client ID，这样启动时可以跳过该 REST 调用。默认账户使用 `channels.discord.applicationId`，运行多个 Discord bot 时使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任何已有频道（例如 Telegram）与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个频道，请改用 CLI / 配置标签页。

        > “我已经在配置中设置了 Discord bot token。请使用 User ID `<user_id>` 和 Server ID `<server_id>` 完成 Discord 设置。”
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

        默认账户的 env fallback：

```bash
DISCORD_BOT_TOKEN=...
```

        对于脚本化或远程设置，使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 写入同一个 JSON5 块，然后去掉 `--dry-run` 重新运行。支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。参见 [Secrets Management](/zh-CN/gateway/secrets)。

        对于多个 Discord bot，请将每个 bot token 和 application ID 放在对应账户下。顶层 `channels.discord.applicationId` 会由账户继承，所以只有当每个账户都应使用同一个 application ID 时才在那里设置。

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
    等待 gateway 运行后，在 Discord 中私信你的 bot。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        将配对码发送给你已有频道中的智能体：

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

    现在你应该可以通过 Discord 私信与你的智能体聊天。

  </Step>
</Steps>

<Note>
Token 解析会感知账户。配置 token 值优先于 env fallback。`DISCORD_BOT_TOKEN` 仅用于默认账户。
如果两个已启用的 Discord 账户解析到同一个 bot token，OpenClaw 只会为该 token 启动一个 gateway monitor。来自配置的 token 优先于默认 env fallback；否则第一个已启用账户获胜，重复账户会被报告为已禁用。
对于高级出站调用（消息工具/频道操作），显式的按调用 `token` 会用于该调用。这适用于发送和读取/probe 样式操作（例如 read/search/fetch/thread/pins/permissions）。账户策略/重试设置仍来自活动运行时快照中选定的账户。
</Note>

## 推荐：设置服务器工作区

私信正常工作后，你可以将 Discord 服务器设置为完整工作区，其中每个频道都有自己的智能体会话和上下文。对于只有你和 bot 的私有服务器，推荐这样做。

<Steps>
  <Step title="将你的服务器添加到服务器 allowlist">
    这会让你的智能体能够在服务器上的任何频道中响应，而不仅是私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “将我的 Discord Server ID `<server_id>` 添加到 guild allowlist”
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
    默认情况下，智能体仅在服务器频道中被 @提及时响应。对于私有服务器，你可能希望它响应每条消息。

    在服务器频道中，普通回复默认会自动发布。对于共享的常驻房间，请选择启用 `messages.groupChat.visibleReplies: "message_tool"`，这样智能体可以旁观，并且只在判断频道回复有用时才发布。它最适合与 GPT 5.5 等最新一代、工具可靠的模型配合使用。环境房间事件会保持安静，除非工具发送。完整的旁观模式配置见 [环境房间事件](/zh-CN/channels/ambient-room-events)。

    如果 Discord 显示正在输入，日志也显示 token 使用量，但没有发布消息，请检查该轮次是否被配置为环境房间事件，或是否启用了 message-tool 可见回复。

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

        若要要求通过 message-tool 发送可见的群组/频道回复，请设置 `messages.groupChat.visibleReplies: "message_tool"`。

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
        如果每个频道都需要共享上下文，请将稳定指令放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话）。将长期笔记保存在 `MEMORY.md` 中，并按需通过记忆工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些频道并开始聊天。你的智能体可以看到频道名称，并且每个频道都会获得自己的隔离会话——因此你可以设置 `#coding`、`#home`、`#research`，或任何适合你工作流的频道。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站回复会回到 Discord。
- Discord 服务器/频道元数据会作为不受信任的上下文添加到模型提示中，
  而不是作为用户可见的回复前缀。如果模型将该封套复制回来，
  OpenClaw 会从出站回复和未来的重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 服务器频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 到路由后的对话会话。
- 发送到 Discord 的纯文本 cron/heartbeat 公告只使用最终的
  assistant 可见答案一次。当智能体发出多个可投递载荷时，媒体和结构化组件载荷仍会保持
  多消息形式。

## 论坛频道

Discord 论坛和媒体频道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父级（`channel:<forumId>`）发送消息以自动创建线程。线程标题使用消息中的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建线程。不要为论坛频道传递 `--message-id`。

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

OpenClaw 支持用于智能体消息的 Discord components v2 容器。请使用带有 `components` 载荷的消息工具。交互结果会作为普通入站消息路由回智能体，并遵循现有 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择框和表单在过期前被多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到一条临时拒绝消息。

组件回调默认在 30 分钟后过期。设置 `channels.discord.agentComponents.ttlMs` 可更改默认 Discord 账号的回调注册表生命周期，或设置 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 以在多账号设置中覆盖某个账号。该值以毫秒为单位，必须是正整数，并且上限为 `86400000`（24 小时）。更长的 TTL 适合需要按钮保持可用的审查或审批工作流，但也会延长旧 Discord 消息仍可触发操作的窗口。优先使用适合工作流的最短 TTL，并在过期回调会令人意外时保留默认值。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，包含提供商、模型和兼容运行时下拉菜单以及提交步骤。`/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。选择器回复是临时的，且只有调用用户可以使用。Discord 选择菜单限制为 25 个选项，因此当你希望选择器只为选定提供商（例如 `openai` 或 `vllm`）显示动态发现的模型时，请将 `provider/*` 条目添加到 `agents.defaults.models`。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件请使用 `media-gallery`
- 当上传名称应与附件引用匹配时，使用 `filename` 覆盖上传名称

模态表单：

- 添加 `components.modal`，最多包含 5 个字段
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

    如果私信策略不是开放的，未知用户会被阻止（或在 `pairing` 模式下被提示配对）。

    多账号优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账号。
    - 对于单个账号，`allowFrom` 优先于旧版 `dm.allowFrom`。
    - 具名账号在自己的 `allowFrom` 和旧版 `dm.allowFrom` 未设置时，继承 `channels.discord.allowFrom`。
    - 具名账号不继承 `channels.discord.accounts.default.allowFrom`。

    旧版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍会读取以保持兼容。`openclaw doctor --fix` 会在不更改访问权限的情况下将它们迁移到 `dmPolicy` 和 `allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    当频道默认值处于活动状态时，裸数字 ID 通常解析为频道 ID，但列在账号有效私信 `allowFrom` 中的 ID 会出于兼容性被视为用户私信目标。

  </Tab>

  <Tab title="Access groups">
    Discord 私信和文本命令授权可以使用 `channels.discord.allowFrom` 中的动态 `accessGroup:<name>` 条目。

    访问组名称在消息渠道之间共享。对于成员以每个渠道正常 `allowFrom` 语法表示的静态组，请使用 `type: "message.senders"`；当 Discord 频道当前的 `ViewChannel` 受众应动态定义成员资格时，请使用 `type: "discord.channelAudience"`。共享访问组行为记录在此处：[访问组](/zh-CN/channels/access-groups)。

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

    Discord 文本频道没有单独的成员列表。`type: "discord.channelAudience"` 将成员资格建模为：私信发送者是所配置服务器的成员，并且在应用角色和频道覆盖后，当前对所配置频道拥有有效的 `ViewChannel` 权限。

    示例：允许任何可以查看 `#maintainers` 的人向机器人发送私信，同时对其他所有人关闭私信。

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

    查找会失败即关闭。如果 Discord 返回 `Missing Access`、成员查找失败，或频道属于不同服务器，则私信发送者会被视为未授权。

    使用频道受众访问组时，请在 Discord Developer Portal 为机器人启用 **Server Members Intent**。私信不包含服务器成员状态，因此 OpenClaw 会在授权时通过 Discord REST 解析成员。

  </Tab>

  <Tab title="Guild policy">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（首选 `id`，也接受 slug）
    - 可选发送者允许列表：`users`（推荐使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，发送者匹配 `users` 或 `roles` 时会被允许
    - 默认禁用直接名称/标签匹配；仅作为破除阻塞的兼容模式启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果服务器配置了 `channels`，未列出的频道会被拒绝
    - 如果服务器没有 `channels` 块，则该允许列表服务器中的所有频道都会被允许

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

    如果你只设置 `DISCORD_BOT_TOKEN` 而不创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会有警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    服务器消息默认需要提及触发。

    提及检测包括：

    - 显式机器人提及
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 支持场景中的隐式回复机器人行为

    编写出站 Discord 消息时，请使用规范提及语法：用户使用 `<@USER_ID>`，频道使用 `<#CHANNEL_ID>`，角色使用 `<@&ROLE_ID>`。不要使用旧版 `<@!USER_ID>` 昵称提及形式。

    `requireMention` 按服务器/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选地丢弃提及其他用户/角色但未提及机器人的消息（排除 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选允许列表通过 `dm.groupChannels`（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 公会成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并且会在 peer 或 parent-peer 绑定之后、guild-only 绑定之前求值。如果某个绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），所有已配置字段都必须匹配。

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

## 原生命令和命令授权

- `commands.native` 默认为 `"auto"`，并为 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会在启动期间跳过 Discord 斜杠命令注册和清理。此前注册的命令可能仍会在 Discord 中可见，直到你从 Discord 应用中移除它们。
- 原生命令授权使用与普通消息处理相同的 Discord allowlist/策略。
- 对未授权用户，命令可能仍会在 Discord UI 中可见；执行时仍会强制执行 OpenClaw 授权，并返回“未授权”。

请参阅 [斜杠命令](/zh-CN/tools/slash-commands) 了解命令目录和行为。

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
    `first` 始终会把隐式原生回复引用附加到该轮次的第一条出站 Discord 消息。
    `batched` 仅在入站事件是多条消息的防抖批次时，才会附加 Discord 的隐式原生回复引用。当你希望原生回复主要用于含糊的突发聊天，而不是每个单消息轮次时，这很有用。

    消息 ID 会暴露在上下文/历史中，因此智能体可以定位特定消息。

  </Accordion>

  <Accordion title="Link previews">
    Discord 默认会为 URL 生成富链接嵌入。OpenClaw 默认会抑制出站 Discord 消息上的这些生成嵌入，因此智能体发送的 URL 会保持为普通链接，除非你选择启用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    设置 `channels.discord.accounts.<id>.suppressEmbeds` 可覆盖单个账号。智能体 message-tool 发送也可以为单条消息传入 `suppressEmbeds: false`。显式 Discord `embeds` 载荷不会被默认链接预览设置抑制。

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw 可以通过发送临时消息，并在文本到达时编辑它来流式传输回复草稿。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（默认）。`progress` 会保留一个可编辑状态草稿，并用工具进度更新它直到最终投递；共享的起始标签是一行滚动文本，因此一旦出现足够多的工作内容，它会像其余内容一样滚动离开。`streamMode` 是旧版运行时别名。运行 `openclaw doctor --fix` 可将持久化配置重写为规范键。

    将 `channels.discord.streaming.mode` 设置为 `off` 可禁用 Discord 预览编辑。如果明确启用了 Discord 分块流式传输，OpenClaw 会跳过预览流，以避免双重流式传输。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` 会在 token 到达时编辑单条预览消息。
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并限制在 `textChunkLimit` 内）。
    - 媒体、错误和显式回复最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。
    - 工具/进度行会在可用时渲染为紧凑的 emoji + 标题 + 详情，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（默认 `false`）选择在临时进度草稿中包含助手评论/前言文本。评论会在显示前清理，保持临时状态，并且不会改变最终答案投递。
    - `streaming.progress.maxLineChars` 控制每行进度预览预算。散文会按词边界缩短；命令和路径详情会保留有用的后缀。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制紧凑进度行中的 command/exec 详情：`raw`（默认）或 `status`（仅工具标签）。

    隐藏原始 command/exec 文本，同时保留紧凑进度行：

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

    预览流式传输仅支持文本；媒体回复会回退到普通投递。当明确启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    公会历史上下文：

    - `channels.discord.historyLimit` 默认 `20`
    - fallback：`messages.groupChat.historyLimit`
    - `0` 禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话会继承父渠道的会话级 `/model` 选择，作为仅模型 fallback；线程本地 `/model` 选择仍优先，并且不会复制父 transcript 历史，除非启用了 transcript 继承。
    - `channels.discord.thread.inheritParent`（默认 `false`）让新的自动线程选择从父 transcript 播种。按账号覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent` 下。
    - Message-tool 反应可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活 fallback 期间保留。

    渠道主题会作为**不受信任**的上下文注入。Allowlists 控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord 可以将线程绑定到会话目标，因此该线程中的后续消息会继续路由到同一个会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活跃运行和绑定状态
    - `/session idle <duration|off>` 检查/更新聚焦绑定的不活跃自动取消聚焦
    - `/session max-age <duration|off>` 检查/更新聚焦绑定的硬性最长年龄

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

    注意：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSessions` 控制为 `sessions_spawn({ thread: true })` 和 ACP 线程 spawn 自动创建/绑定线程。默认：`true`。
    - `defaultSpawnContext` 控制线程绑定 spawn 的原生子智能体上下文。默认：`"fork"`。
    - 已弃用的 `spawnSubagentSessions`/`spawnAcpSessions` 键会由 `openclaw doctor --fix` 迁移。
    - 如果某个账号禁用了线程绑定，`/focus` 和相关线程绑定操作将不可用。

    请参阅 [子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents) 和 [配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    对于稳定的“始终在线” ACP 工作区，请配置面向 Discord 对话的顶层类型化 ACP 绑定。

    配置路径：

    - `bindings[]`，带有 `type: "acp"` 和 `match.channel: "discord"`

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

    - `/acp spawn codex --bind here` 会就地绑定当前渠道或线程，并让未来消息保持在同一个 ACP 会话上。线程消息会继承父渠道绑定。
    - 在绑定的渠道或线程中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话。临时线程绑定在活跃时可以覆盖目标解析。
    - `spawnSessions` 通过 `--thread auto|here` 控制子线程创建/绑定。

    请参阅 [ACP 智能体](/zh-CN/tools/acp-agents) 了解绑定行为详情。

  </Accordion>

  <Accordion title="Reaction notifications">
    按公会配置反应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反应事件会转换为系统事件，并附加到已路由的 Discord 会话。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji fallback（`agents.list[].identity.emoji`，否则为 "👀"）

    注意：

    - Discord 接受 unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 可为某个渠道或账号禁用反应。

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
    通过带有 `channels.discord.proxy` 的 HTTP(S) 代理路由 Discord gateway WebSocket 流量和启动 REST 查询（应用 ID + allowlist 解析）。

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

  <Accordion title="PluralKit support">
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
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名
    - 查找使用原始消息 ID，并受时间窗口约束
    - 如果查找失败，代理消息会被视为机器人消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="出站提及别名">
    当智能体需要对已知 Discord 用户进行确定性的出站提及时，使用 `mentionAliases`。键是不带前导 `@` 的 handle；值是 Discord 用户 ID。未知 handle、`@everyone`、`@here` 以及 Markdown 代码 span 内的提及会保持不变。

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

    - 0：正在玩
    - 1：直播（需要 `activityUrl`）
    - 2：正在听
    - 3：正在看
    - 4：自定义（使用活动文本作为状态状态；emoji 可选）
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

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中处理基于按钮的审批，并且可以选择在发起频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可能时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以从 `execApprovals.approvers` 或 `commands.ownerAllowFrom` 解析出一个审批人时，Discord 会自动启用原生 exec 审批。Discord 不会从频道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断 exec 审批人。设置 `enabled: false` 可明确禁用 Discord 作为原生审批客户端。

    对于 `/diagnostics` 和 `/export-trajectory` 等敏感的仅所有者群组命令，OpenClaw 会私下发送审批提示和最终结果。当调用的所有者有 Discord 所有者路由时，它会先尝试 Discord 私信；如果不可用，则回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，例如 Telegram。

    当 `target` 为 `channel` 或 `both` 时，审批提示会在频道中可见。只有已解析的审批人可以使用按钮；其他用户会收到一条临时拒绝消息。审批提示包含命令文本，因此仅应在受信任频道中启用频道投递。如果无法从会话键推导出频道 ID，OpenClaw 会回退到私信投递。

    Discord 也会渲染其他聊天频道使用的共享审批按钮。原生 Discord 适配器主要增加审批人私信路由和频道扇出。
    当这些按钮存在时，它们是主要审批 UX；OpenClaw
    只有在工具结果表示聊天审批不可用，或手动审批是唯一路径时，
    才应包含手动 `/approve` 命令。
    如果 Discord 原生审批运行时未激活，OpenClaw 会保持
    本地确定性的 `/approve <id> <decision>` 提示可见。如果
    运行时已激活但无法将原生卡片投递到任何目标，
    OpenClaw 会在同一聊天中发送回退通知，其中包含待处理审批中的确切 `/approve`
    命令。

    Gateway 网关认证和审批解析遵循共享 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。审批默认在 30 分钟后过期。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息发送、频道管理、审核、在线状态和元数据操作。

核心示例：

- 消息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径），用于设置计划事件封面图片。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                                     | 默认     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 已启用   |
| roles                                                                                                                                                                      | 已禁用   |
| moderation                                                                                                                                                                 | 已禁用   |
| presence                                                                                                                                                                   | 已禁用   |

## 组件 v2 UI

OpenClaw 使用 Discord components v2 处理 exec 审批和跨上下文标记。Discord 消息操作也可以接受 `components` 以实现自定义 UI（高级用法；需要通过 discord 工具构造组件载荷），而旧版 `embeds` 仍然可用，但不推荐使用。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账号设置。
- `channels.discord.agentComponents.ttlMs` 控制已发送的 Discord 组件回调保持注册的时长（默认 `1800000`，最大 `86400000`）。使用 `channels.discord.accounts.<id>.agentComponents.ttlMs` 按账号设置。
- 当 components v2 存在时，会忽略 `embeds`。
- 默认抑制纯 URL 预览。当单个出站链接应展开时，在消息操作上设置 `suppressEmbeds: false`。

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
2. 使用角色/用户允许列表时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀请机器人。
4. 在目标语音频道中授予 Connect、Speak、Send Messages 和 Read Message History 权限。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账号默认智能体，并遵循与其他 Discord 命令相同的允许列表和群组策略规则。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

要在加入前检查机器人的有效权限，运行：

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
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

说明：

- `voice.tts` 仅覆盖 `stt-tts` 语音播放的 `messages.tts`。实时模式使用 `voice.realtime.speakerVoice`。
- `voice.mode` 控制对话路径。默认值是 `agent-proxy`：实时语音前端处理轮次时机、中断和播放，通过 `openclaw_agent_consult` 将实质性工作委派给路由后的 OpenClaw 智能体，并把结果当作该说话者输入的 Discord 提示词来处理。`stt-tts` 保留较旧的批量 STT 加 TTS 流程。`bidi` 允许实时模型直接对话，同时为 OpenClaw 大脑暴露 `openclaw_agent_consult`。
- `voice.agentSession` 控制哪个 OpenClaw 对话接收语音轮次。留空则使用语音频道自己的会话，或设置为 `{ mode: "target", target: "channel:<text-channel-id>" }`，让语音频道作为现有 Discord 文本频道会话（例如 `#maintainers`）的麦克风/扬声器扩展。
- `voice.model` 会覆盖 Discord 语音回复和实时咨询使用的 OpenClaw 智能体大脑。留空则继承路由后的智能体模型。它与 `voice.realtime.model` 分开。
- `voice.followUsers` 允许机器人随选定用户加入、移动和离开 Discord 语音。行为规则和示例见[在语音中跟随用户](#follow-users-in-voice)。
- `agent-proxy` 通过 `discord-voice` 路由语音，这会为说话者和目标会话保留正常的所有者/工具授权，但会隐藏智能体 `tts` 工具，因为 Discord 语音负责播放。默认情况下，`agent-proxy` 会为所有者说话者提供与所有者等效的完整工具访问权限（`voice.realtime.toolPolicy: "owner"`），并强烈倾向于在给出实质性回答前咨询 OpenClaw 智能体（`voice.realtime.consultPolicy: "always"`）。在默认的 `always` 模式下，实时层不会在咨询答案之前自动朗读填充内容；它会捕获并转写语音，然后朗读路由后的 OpenClaw 答案。如果多个强制咨询答案在 Discord 仍在播放第一个答案时完成，后续逐字语音答案会排队，直到播放空闲，而不是在句子中途替换语音。
- 在 `stt-tts` 模式下，STT 使用 `tools.media.audio`；`voice.model` 不影响转写。
- 在实时模式下，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 配置实时音频会话。要将 OpenAI Realtime 2 与 Codex 大脑一起使用，请使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai/gpt-5.5"`。
- 实时语音模式默认会在实时提供商指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 配置文件，以便快速直接轮次保持与路由后的 OpenClaw 智能体相同的身份、用户语境和人格。将 `voice.realtime.bootstrapContextFiles` 设置为子集可自定义此行为，或设置为 `[]` 可禁用它。支持的实时引导文件仅限这些配置文件；`AGENTS.md` 仍保留在正常智能体上下文中。注入的配置文件上下文不会取代 `openclaw_agent_consult` 来处理工作区工作、当前事实、记忆查找或工具支持的操作。
- 在 OpenAI `agent-proxy` 实时模式下，设置 `voice.realtime.requireWakeName: true` 可让 Discord 实时语音保持静默，直到转写以唤醒名称开头或结尾。配置的唤醒名称必须是一到两个词。如果未设置 `voice.realtime.wakeNames`，OpenClaw 会使用路由后的智能体 `name` 加 `OpenClaw`，并回退到智能体 id 加 `OpenClaw`。唤醒名称门控会禁用实时提供商自动响应，将已接受的轮次路由到 OpenClaw 智能体咨询路径，并在最终转写到达前从部分转写中识别出前置唤醒名称时，给出简短的语音确认。
- OpenAI 实时提供商接受当前 Realtime 2 事件名称和旧版 Codex 兼容的输出音频与转写事件别名，因此兼容的提供商快照即使发生漂移，也不会丢失助手音频。
- `voice.realtime.bargeIn` 控制 Discord 说话者开始事件是否中断正在播放的实时音频。如果未设置，它会遵循实时提供商的输入音频中断设置。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 实时插话截断音频前的最短助手播放时长。默认值：`250`。在低回声房间中设置为 `0` 可立即中断，或在回声较重的扬声器设置中调高。
- 对于 Discord 播放上的 OpenAI 语音，请设置 `voice.tts.provider: "openai"`，并在 `voice.tts.providers.openai.speakerVoice` 下选择 Text-to-speech 语音。`cedar` 是当前 OpenAI TTS 模型上一个不错的男性化声音选择。
- 每频道 Discord `systemPrompt` 覆盖会应用于该语音频道的语音转写轮次。
- 语音转写轮次会根据 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态，用于所有者门控命令和频道操作。智能体工具可见性遵循路由会话配置的工具策略。
- 对于仅文本配置，Discord 语音需要显式启用；设置 `channels.discord.voice.enabled=true`（或保留现有 `channels.discord.voice` 块）以启用 `/vc` 命令、语音运行时和 `GuildVoiceStates` Gateway 网关意图。
- `channels.discord.intents.voiceStates` 可以显式覆盖语音状态意图订阅。留空则让意图跟随有效的语音启用状态。
- 如果 `voice.autoJoin` 对同一个服务器有多个条目，OpenClaw 会加入该服务器最后配置的频道。
- `voice.allowedChannels` 是可选的驻留允许列表。留空则允许 `/vc join` 加入任何已授权的 Discord 语音频道。设置后，`/vc join`、启动时自动加入和机器人语音状态移动都会限制为列出的 `{ guildId, channelId }` 条目。将其设置为空数组会拒绝所有 Discord 语音加入。如果 Discord 将机器人移到允许列表之外，OpenClaw 会离开该频道，并在有可用配置时重新加入配置的自动加入目标。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传到 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 的默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用内置的 `libopus-wasm` 编解码器进行 Discord 语音接收和实时原始 PCM 播放。它随附固定版本的 libopus WebAssembly 构建，不需要原生 opus 插件。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试时初始等待 `@discordjs/voice` Ready 的时间。默认值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在销毁断开的语音会话前，等待它开始重新连接的时长。默认值：`15000`。
- 在 `stt-tts` 模式下，语音播放不会仅因为另一个用户开始说话而停止。为避免反馈循环，OpenClaw 会在 TTS 播放期间忽略新的语音捕获；请在播放完成后再说出下一轮。实时模式会将说话者开始事件作为插话信号转发给实时提供商。
- 在实时模式下，扬声器回声进入开放麦克风可能看起来像插话并中断播放。对于回声较重的 Discord 房间，设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，防止 OpenAI 在输入音频上自动中断。如果你仍希望 Discord 说话者开始事件中断正在播放的音频，请添加 `voice.realtime.bargeIn: true`。OpenAI 实时桥接会将短于 `voice.realtime.minBargeInAudioEndMs` 的播放截断视为可能的回声/噪声并忽略，同时记录为已跳过，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 OpenClaw 在 Discord 报告某个说话者停止后，等待多久才将该音频片段最终确定为 STT。默认值：`2000`；如果 Discord 将正常停顿拆成断续的部分转写，请调高此值。
- 当 ElevenLabs 是所选 TTS 提供商时，Discord 语音播放会使用流式 TTS，并从提供商响应流开始。不支持流式传输的提供商会回退到合成临时文件路径。
- OpenClaw 还会监控接收解密失败，并在短时间窗口内反复失败后，通过离开并重新加入语音频道来自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 系列包含来自 discord.js PR #11449 的上游填充修复，该修复关闭了 discord.js issue #11419。
- OpenClaw 最终确定捕获的说话者片段时，预期会出现 `The operation was aborted` 接收事件；它们是详细诊断信息，不是警告。
- 详细 Discord 语音日志会为每个已接受的说话者片段包含一行有界的 STT 转写预览，因此调试时无需转储无界转写文本，也能看到用户侧和智能体回复侧。
- 在 `agent-proxy` 模式下，强制咨询回退会跳过可能不完整的转写片段，例如以 `...` 结尾的文本，或像 `and` 这样的尾随连接词，以及明显不可操作的结束语，例如 “马上回来” 或 “再见”。当这防止过时的排队答案时，日志会显示 `forced agent consult skipped reason=...`。

### 在语音中跟随用户

当你希望 Discord 语音机器人跟随一个或多个已知 Discord 用户，而不是在启动时加入固定频道或等待 `/vc join` 时，请使用 `voice.followUsers`。

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

行为：

- `followUsers` 接受原始 Discord 用户 ID 和 `discord:<id>` 值。OpenClaw 会在匹配语音状态事件前规范化这两种形式。
- 配置 `followUsers` 时，`followUsersEnabled` 默认值为 `true`。将其设置为 `false` 可保留已保存列表，但停止自动语音跟随。
- 当被跟随用户加入允许的语音频道时，OpenClaw 会加入该频道。当该用户移动时，OpenClaw 会随之移动。当当前被跟随用户断开连接时，OpenClaw 会离开。
- 如果多个被跟随用户在同一个服务器中，且当前被跟随用户离开，OpenClaw 会在离开服务器前移动到另一个已跟踪被跟随用户的频道。如果多个被跟随用户同时移动，则以最新观察到的语音状态事件为准。
- `allowedChannels` 仍然适用。位于不允许频道中的被跟随用户会被忽略，跟随拥有的会话会移动到另一个被跟随用户或离开。
- OpenClaw 会在启动时和有界间隔内调和错过的语音状态事件。调和会采样已配置的服务器，并限制每次运行的 REST 查找次数，因此非常大的 `followUsers` 列表可能需要超过一个间隔才能收敛。
- 如果 Discord 或管理员在机器人跟随用户时移动机器人，OpenClaw 会重建语音会话，并在目标位置被允许时保留跟随所有权。如果机器人被移到 `allowedChannels` 之外，OpenClaw 会离开，并在存在配置目标时重新加入。
- DAVE 接收恢复可能会在反复解密失败后离开并重新加入同一个频道。跟随拥有的会话会在该恢复路径中保留其跟随所有权，因此后续被跟随用户断开连接时仍会离开频道。

在加入模式之间选择：

- 对于个人或操作员设置，如果机器人应在你进入语音时自动出现在语音中，请使用 `followUsers`。
- 对于即使没有被跟踪用户在语音中也应存在的固定房间机器人，请使用 `autoJoin`。
- 对于一次性加入或自动语音存在可能令人意外的房间，请使用 `/vc join`。

Discord 语音编解码器：

- 语音接收日志显示 `discord voice: opus decoder: libopus-wasm`。
- 实时播放会先使用同一个内置 `libopus-wasm` 包，将原始 48 kHz 立体声 PCM 编码为 Opus，然后再把数据包交给 `@discordjs/voice`。
- 文件和提供商流式播放会用 ffmpeg 转码为原始 48 kHz 立体声 PCM，然后使用 `libopus-wasm` 生成发送到 Discord 的 Opus 数据包流。

STT 加 TTS 流水线：

- Discord PCM 捕获会转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录文本会通过 Discord 入口和路由发送，同时响应 LLM 会以语音输出策略运行：隐藏智能体 `tts` 工具并要求返回文本，因为 Discord 语音负责最终的 TTS 播放。
- 设置 `voice.model` 时，它只会覆盖这个语音频道轮次的响应 LLM。
- `voice.tts` 会覆盖合并到 `messages.tts`；支持流式传输的提供商会直接向播放器供给音频，否则会在已加入的频道中播放生成的音频文件。

默认 agent-proxy 语音频道会话示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

没有 `voice.agentSession` 块时，每个语音频道都会获得自己的已路由 OpenClaw 会话。例如，`/vc join channel:234567890123456789` 会与该 Discord 语音频道的会话对话。实时模型只是语音前端；实质请求会交给已配置的 OpenClaw 智能体。如果实时模型在没有调用 consult 工具的情况下生成最终转录文本，OpenClaw 会强制执行 consult 作为兜底，因此默认行为仍然像是在与智能体对话。

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

实时双向示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

将语音作为现有 Discord 频道会话的扩展示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式下，机器人会加入已配置的语音频道，但 OpenClaw 智能体轮次使用目标频道的常规路由会话和智能体。实时语音会话会把返回结果说回语音频道。监督智能体仍然可以根据其工具策略使用常规消息工具，包括在合适时发送一条单独的 Discord 消息。

委托的 OpenClaw 运行处于活动状态时，新的 Discord 语音转录会在开始另一个智能体轮次之前被视为实时运行控制。诸如 “status”、 “cancel that”、 “use the smaller fix” 或 “when you're done also check tests” 这样的短语会被归类为活动会话的状态、取消、Steer 或跟进输入。状态、取消、已接受的 Steer 和跟进结果都会被说回语音频道，让调用者知道 OpenClaw 是否处理了请求。

可用的目标形式：

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
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

当模型会通过打开的麦克风听到自己的 Discord 播放，但你仍希望通过说话打断它时，使用此配置。OpenClaw 会阻止 OpenAI 因原始输入音频而自动中断，同时 `bargeIn: true` 允许 Discord 说话者开始事件和已活跃的说话者音频，在下一个捕获轮次到达 OpenAI 之前取消活动中的实时响应。`audioEndMs` 低于 `minBargeInAudioEndMs` 的过早插话信号会被视为可能的回声/噪声并被忽略，这样模型不会在第一个播放帧就被截断。

预期语音日志：

- 加入时：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 实时启动时：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 说话者音频时：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` 和 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 跳过过期语音时：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 实时响应完成时：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重置时：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 实时 consult 时：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 智能体回答时：`discord voice: agent turn answer ...`
- 精确语音入队时：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，随后是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 检测到插话时：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，随后是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 实时中断时：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，随后是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回声/噪声时：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 禁用插话时：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 播放空闲时：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

要调试音频被截断，请按时间线阅读实时语音日志：

1. `realtime audio playback started` 表示 Discord 已开始播放助手音频。从这一点开始，桥接会统计助手输出分块、Discord PCM 字节、提供商实时字节和合成音频时长。
2. `realtime speaker turn opened` 标记 Discord 说话者变为活跃。如果播放已经处于活动状态且启用了 `bargeIn`，之后可能会出现 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 标记该说话者轮次收到第一个实际音频帧。这里的 `outputActive=true` 或非零 `outputAudioMs` 表示麦克风在助手播放仍处于活动状态时正在发送输入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助手播放处于活动状态时检测到实时说话者音频。这有助于区分真正的打断和没有可用音频的 Discord 说话者开始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求实时提供商取消或截断活动响应。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，因此你可以看到中断之前实际播放了多少助手音频。
6. `realtime audio playback stopped reason=...` 是本地 Discord 播放重置点。原因说明是谁停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 汇总捕获的输入轮次。`chunks=0` 或 `hasAudio=false` 表示说话者轮次已开启，但没有可用音频到达实时桥接。`interruptedPlayback=true` 表示该输入轮次与助手输出重叠，并触发了插话逻辑。

可用字段：

- `outputAudioMs`：日志行之前由实时提供商生成的助手音频时长。
- `audioMs`：OpenClaw 在播放停止之前统计到的助手音频时长。
- `elapsedMs`：播放流或说话者轮次打开与关闭之间的挂钟时间。
- `discordBytes`：发送到 Discord 语音或从 Discord 语音接收的 48 kHz 立体声 PCM 字节。
- `realtimeBytes`：发送到实时提供商或从实时提供商接收的提供商格式 PCM 字节。
- `playbackChunks`：转发到 Discord 的活动响应助手音频分块。
- `sinceLastAudioMs`：最后捕获的说话者音频帧与说话者轮次关闭之间的间隔。

常见模式：

- 使用 `source=active-speaker-audio`、较小的 `outputAudioMs`，且同一用户就在附近时立即截断，通常说明扬声器回声进入了麦克风。提高 `voice.realtime.minBargeInAudioEndMs`，降低扬声器音量，使用耳机，或设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 后跟 `speaker turn closed ... hasAudio=false` 表示 Discord 报告了说话者开始，但没有音频到达 OpenClaw。这可能是短暂的 Discord 语音事件、噪声门行为，或客户端短暂按下麦克风。
- 附近没有插话或 `provider-clear-audio` 的 `audio playback stopped reason=stream-close` 表示本地 Discord 播放流意外结束。检查之前的提供商和 Discord 播放器日志。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助手音频处于活动状态时有意丢弃了输入。如果你希望语音打断播放，请启用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供商 VAD 报告了语音，但 OpenClaw 没有可中断的活动播放。这不应截断音频。

凭证按组件解析：`voice.model` 使用 LLM 路由凭证，`tools.media.audio` 使用 STT 凭证，`messages.tts`/`voice.tts` 使用 TTS 凭证，`voice.realtime.providers` 或提供商的常规凭证配置使用实时提供商凭证。

### 语音消息

Discord 语音消息会显示波形预览，并要求使用 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上有 `ffmpeg` 和 `ffprobe` 才能检查和转换。

- 提供一个**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 会拒绝在同一个载荷中同时包含文本和语音消息）。
- 接受任何音频格式；OpenClaw 会按需转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intents，或 bot 看不到 guild 消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 更改 intents 后重启 Gateway 网关

  </Accordion>

  <Accordion title="Guild 消息被意外阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的 guild allowlist
    - 如果 guild `channels` 映射存在，则只允许列出的渠道
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

    - `groupPolicy="allowlist"` 但没有匹配的 guild/channel allowlist
    - `requireMention` 配置在了错误位置（必须位于 `channels.discord.guilds` 或渠道条目下）
    - 发送者被 guild/channel `users` allowlist 阻止

  </Accordion>

  <Accordion title="长时间运行的 Discord 轮次或重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 网关队列开关：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这只控制 Discord Gateway 网关监听器工作，而不是智能体轮次生命周期

    Discord 不会对排队的智能体轮次应用渠道自有的超时。消息监听器会立即交接，排队的 Discord 运行会保持每个会话的顺序，直到会话/工具/运行时生命周期完成或中止工作。

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
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。临时故障会回退到 Discord 的默认 Gateway 网关 URL，并在日志中进行速率限制。

    元数据超时开关：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway 网关 READY 超时重启">
    OpenClaw 会在启动期间和运行时重连后等待 Discord 的 Gateway 网关 `READY` 事件。带有启动错峰的多账号设置可能需要比默认值更长的启动 READY 窗口。

    READY 超时开关：

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
    `channels status --probe` 权限检查只适用于数字渠道 ID。

    如果你使用 slug 键，运行时匹配仍可工作，但 probe 无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配对批准

  </Accordion>

  <Accordion title="Bot 到 bot 循环">
    默认会忽略 bot 编写的消息。

    如果你设置 `channels.discord.allowBots=true`，请使用严格的提及和 allowlist 规则来避免循环行为。
    优先使用 `channels.discord.allowBots="mentions"`，只接受提及该 bot 的 bot 消息。

    OpenClaw 还附带共享的 [bot 循环保护](/zh-CN/channels/bot-loop-protection)。每当 `allowBots` 允许 bot 编写的消息到达分发阶段时，Discord 会将入站事件映射到 `(account, channel, bot pair)` 事实，通用 pair 防护会在该 pair 超过配置的事件预算后将其抑制。该防护可防止过去只能通过 Discord 速率限制停止的失控双 bot 循环；它不会影响单 bot 部署，也不会影响保持在预算内的一次性 bot 回复。

    默认设置（设置 `allowBots` 时生效）：

    - `maxEventsPerWindow: 20` -- bot pair 可以在滑动窗口内交换 20 条消息
    - `windowSeconds: 60` -- 滑动窗口长度
    - `cooldownSeconds: 60` -- 预算触发后，任一方向的每条额外 bot 到 bot 消息都会被丢弃一分钟

    在 `channels.defaults.botLoopProtection` 下配置一次共享默认值，然后在合法工作流需要更多余量时覆盖 Discord。优先级为：

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 内置默认值

    Discord 使用通用的 `maxEventsPerWindow`、`windowSeconds` 和 `cooldownSeconds` 键。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="语音 STT 因 DecryptionFailed(...) 被丢弃">

    - 保持 OpenClaw 为当前版本（`openclaw update`），确保 Discord 语音接收恢复逻辑存在
    - 确认 `channels.discord.voice.daveEncryption=true`（默认值）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调优
    - 观察日志：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后故障仍继续，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行比较

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
- 传递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`（限制出站 Discord 上传，默认值 `100MB`）、`retry`
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全与运维

- 将 bot token 视为密钥（在受监管环境中优先使用 `DISCORD_BOT_TOKEN`）。
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
  <Card title="频道路由" icon="route" href="/zh-CN/channels/channel-routing">
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

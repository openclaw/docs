---
read_when:
    - 处理 Discord 渠道功能
summary: Discord bot 支持状态、能力和配置
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

可通过官方 Discord Gateway 网关用于私信和公会频道。

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

你需要创建一个带 bot 的新应用，将 bot 添加到你的服务器，并将其配对到 OpenClaw。我们建议将你的 bot 添加到你自己的私有服务器。如果你还没有服务器，请[先创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications)，然后点击 **New Application**。将其命名为类似 “OpenClaw” 的名称。

    点击侧边栏中的 **Bot**。将 **Username** 设置为你给 OpenClaw 智能体起的任何名称。

  </Step>

  <Step title="启用特权 intents">
    仍在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色 allowlist 和名称到 ID 匹配需要）
    - **Presence Intent**（可选；仅 presence 更新需要）

  </Step>

  <Step title="复制你的 bot token">
    在 **Bot** 页面向上滚动回去，然后点击 **Reset Token**。

    <Note>
    尽管名称如此，这会生成你的第一个 token，而不是真的在“重置”任何内容。
    </Note>

    复制 token 并将其保存到某处。这是你的 **Bot Token**，稍后会用到。

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

    这是普通文本频道的基线权限集。如果你计划在 Discord 线程中发帖，包括创建或继续线程的论坛或媒体频道工作流，也要启用 **Send Messages in Threads**。
    复制底部生成的 URL，粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 进行连接。你现在应该能在 Discord 服务器中看到你的 bot。

  </Step>

  <Step title="启用 Developer Mode 并收集你的 ID">
    回到 Discord 应用，你需要启用 Developer Mode，以便复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ 滚动到侧边栏中的 **Developer** → 开启 **Developer Mode**

        *（注意：在 Discord 移动应用中，Developer Mode 位于 **App Settings** → **Advanced** 下）*

    2. 右键点击侧边栏中的你的 **server icon** → **Copy Server ID**
    3. 右键点击你的 **own avatar** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存；下一步你会把这三项都发送给 OpenClaw。

  </Step>

  <Step title="允许服务器成员发送私信">
    为了让配对生效，Discord 需要允许你的 bot 给你发送私信。右键点击你的 **server icon** → **Privacy Settings** → 开启 **Direct Messages**。

    这会允许服务器成员（包括 bot）向你发送私信。如果你想通过 Discord 私信使用 OpenClaw，请保持启用。如果你只计划使用公会频道，可以在配对后禁用私信。

  </Step>

  <Step title="安全设置你的 bot token（不要在聊天中发送它）">
    你的 Discord bot token 是密钥（类似密码）。在给智能体发消息之前，请在运行 OpenClaw 的机器上设置它。

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

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启它，或停止并重启 `openclaw gateway run` 进程。
    对于托管服务安装，请在存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将该变量存储在 `~/.openclaw/.env` 中，这样服务在重启后就能解析 env SecretRef。
    如果你的主机被 Discord 的启动应用查询阻止或限流，请从 Developer Portal 设置 Discord application/client ID，这样启动时可以跳过该 REST 调用。默认账号使用 `channels.discord.applicationId`；运行多个 Discord bot 时使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在任意现有渠道（例如 Telegram）与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / 配置标签页。

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

        默认账号的环境变量 fallback：

```bash
DISCORD_BOT_TOKEN=...
```

        对于脚本化或远程设置，请使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 写入相同的 JSON5 块，然后去掉 `--dry-run` 重新运行。支持明文 `token` 值。`channels.discord.token` 也支持跨 env/file/exec 提供商的 SecretRef 值。请参阅 [Secrets Management](/zh-CN/gateway/secrets)。

        对于多个 Discord bot，请将每个 bot token 和应用 ID 保存在其账号下。顶层 `channels.discord.applicationId` 会被账号继承，因此只有当每个账号都应使用相同应用 ID 时才在那里设置。

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
    等到 Gateway 网关运行后，在 Discord 中给你的 bot 发送私信。它会回复一个配对码。

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

    现在你应该能够通过私信在 Discord 中与你的智能体聊天。

  </Step>
</Steps>

<Note>
Token 解析是账号感知的。配置 token 值优先于 env fallback。`DISCORD_BOT_TOKEN` 仅用于默认账号。
如果两个已启用的 Discord 账号解析为同一个 bot token，OpenClaw 只会为该 token 启动一个 Gateway 网关监视器。配置来源的 token 优先于默认 env fallback；否则第一个启用的账号获胜，重复账号会被报告为已禁用。
对于高级出站调用（消息工具/渠道操作），显式的逐调用 `token` 会用于该调用。这适用于发送和读取/探测类操作（例如 read/search/fetch/thread/pins/permissions）。账号策略/重试设置仍来自活跃运行时快照中的所选账号。
</Note>

## 推荐：设置公会工作区

私信可用后，你可以将 Discord 服务器设置为完整工作区，其中每个频道都有自己的智能体会话和上下文。对于只有你和你的 bot 的私有服务器，推荐这样做。

<Steps>
  <Step title="将你的服务器添加到公会 allowlist">
    这会让你的智能体能够在服务器上的任何频道中响应，而不只是私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “将我的 Discord Server ID `<server_id>` 添加到公会 allowlist”
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

  <Step title="允许无需 @mention 即响应">
    默认情况下，你的智能体只有在公会频道中被 @mentioned 时才会响应。对于私有服务器，你可能希望它响应每条消息。

    在公会频道中，普通回复默认会自动发布。对于共享的常开房间，请选择启用 `messages.groupChat.visibleReplies: "message_tool"`，这样智能体可以旁听，并且仅在它判断频道回复有用时才发布。这最适合 GPT 5.5 等最新一代、工具可靠的模型。除非工具发送，否则环境房间事件会保持安静。完整旁听模式配置请参阅 [环境房间事件](/zh-CN/channels/ambient-room-events)。

    如果 Discord 显示正在输入且日志显示 token 使用量，但没有发布消息，请检查该轮次是否被配置为环境房间事件，或是否选择了消息工具可见回复。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在此服务器上响应，而不必被 @mentioned”
      </Tab>
      <Tab title="配置">
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

        若要要求可见群组/频道回复通过消息工具发送，请设置 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划公会频道中的记忆">
    默认情况下，长期记忆（MEMORY.md）只在私信会话中加载。公会频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 频道中提问时，如果你需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，请将稳定指令放入 `AGENTS.md` 或 `USER.md`（它们会注入到每个会话）。将长期笔记保存在 `MEMORY.md` 中，并按需通过记忆工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些频道并开始聊天。你的智能体可以看到频道名称，并且每个频道都会获得自己的隔离会话，因此你可以设置 `#coding`、`#home`、`#research`，或任何适合你工作流的内容。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站回复会回复到 Discord。
- Discord 服务器/频道元数据会作为不受信任的上下文添加到模型提示中，
  而不是作为用户可见的回复前缀。如果模型把该信封复制回来，
  OpenClaw 会从出站回复和后续重放上下文中剥离复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 服务器频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 指向路由后的对话会话。
- 仅文本的 cron/Heartbeat 公告投递到 Discord 时，只使用最终的
  助手可见答案一次。媒体和结构化组件载荷在智能体发出多个可投递载荷时仍保持
  多消息形式。

## 论坛频道

Discord 论坛和媒体频道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父频道（`channel:<forumId>`）发送消息以自动创建线程。线程标题使用你消息中的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建线程。不要为论坛频道传入 `--message-id`。

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

论坛父频道不接受 Discord 组件。如果需要组件，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持用于智能体消息的 Discord components v2 容器。使用带有 `components` 载荷的消息工具。交互结果会作为普通入站消息路由回智能体，并遵循现有 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择器和表单在过期前多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到临时拒绝消息。

组件回调默认在 30 分钟后过期。设置 `channels.discord.agentComponents.ttlMs` 可更改默认 Discord 账号的回调注册表生命周期，或设置 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 在多账号设置中覆盖某个账号。该值以毫秒为单位，必须是正整数，并且上限为 `86400000`（24 小时）。更长的 TTL 适用于需要按钮保持可用的评审或审批工作流，但也会延长旧 Discord 消息仍可触发操作的窗口。优先选择适合工作流的最短 TTL；如果陈旧回调会令人意外，请保持默认值。

`/model` 和 `/models` 斜杠命令会打开一个交互式模型选择器，包含提供商、模型和兼容运行时下拉菜单，以及一个提交步骤。`/models add` 已弃用，现在会返回弃用消息，而不是从聊天中注册模型。选择器回复是临时的，只有调用用户可以使用它。Discord 选择菜单限制为 25 个选项，因此当你希望选择器只为选定提供商（如 `openai` 或 `vllm`）显示动态发现的模型时，请将 `provider/*` 条目添加到 `agents.defaults.models`。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件请使用 `media-gallery`
- 当上传名称应匹配附件引用时，使用 `filename` 覆盖上传名称

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
    `channels.discord.dmPolicy` 控制私信访问。`channels.discord.allowFrom` 是规范私信允许列表。

    - `pairing`（默认）
    - `allowlist`
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私信策略不是开放的，未知用户会被阻止（或在 `pairing` 模式下被提示配对）。

    多账号优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账号。
    - 对于单个账号，`allowFrom` 优先于旧版 `dm.allowFrom`。
    - 命名账号在自身 `allowFrom` 和旧版 `dm.allowFrom` 未设置时，继承 `channels.discord.allowFrom`。
    - 命名账号不会继承 `channels.discord.accounts.default.allowFrom`。

    旧版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍会为兼容性而读取。`openclaw doctor --fix` 会在不改变访问权限的情况下，将它们迁移到 `dmPolicy` 和 `allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    当频道默认值处于活动状态时，裸数字 ID 通常会解析为频道 ID，但账号有效私信 `allowFrom` 中列出的 ID 会为了兼容性被视为用户私信目标。

  </Tab>

  <Tab title="Access groups">
    Discord 私信和文本命令授权可以在 `channels.discord.allowFrom` 中使用动态 `accessGroup:<name>` 条目。

    访问组名称在消息渠道之间共享。对成员用各渠道常规 `allowFrom` 语法表示的静态组，使用 `type: "message.senders"`；当 Discord 频道当前的 `ViewChannel` 受众应动态定义成员资格时，使用 `type: "discord.channelAudience"`。共享访问组行为记录在这里：[访问组](/zh-CN/channels/access-groups)。

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

    Discord 文本频道没有单独的成员列表。`type: "discord.channelAudience"` 将成员资格建模为：私信发送者是已配置服务器的成员，并且在应用角色和频道覆盖后，当前对已配置频道拥有有效的 `ViewChannel` 权限。

    示例：允许任何能看到 `#maintainers` 的人向机器人发送私信，同时对其他所有人关闭私信。

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

    查询会失败关闭。如果 Discord 返回 `Missing Access`、成员查询失败，或频道属于不同服务器，则私信发送者会被视为未授权。

    使用频道受众访问组时，请在 Discord Developer Portal 中为机器人启用 **Server Members Intent**。私信不包含服务器成员状态，因此 OpenClaw 会在授权时通过 Discord REST 解析成员。

  </Tab>

  <Tab title="Guild policy">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当 `channels.discord` 存在时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（首选 `id`，也接受 slug）
    - 可选发送者允许列表：`users`（建议使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了任一项，发送者匹配 `users` 或 `roles` 时即被允许
    - 默认禁用直接名称/标签匹配；仅作为应急兼容模式启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果服务器配置了 `channels`，未列出的频道会被拒绝
    - 如果服务器没有 `channels` 块，则该允许列表服务器中的所有频道都被允许

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

    如果你只设置 `DISCORD_BOT_TOKEN`，而没有创建 `channels.discord` 块，则运行时回退为 `groupPolicy="allowlist"`（日志中会出现警告），即使 `channels.defaults.groupPolicy` 是 `open`。

  </Tab>

  <Tab title="Mentions and group DMs">
    服务器消息默认受提及门控。

    提及检测包括：

    - 显式提及机器人
    - 已配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退为 `messages.groupChat.mentionPatterns`）
    - 支持场景中的隐式回复机器人行为

    编写出站 Discord 消息时，请使用规范提及语法：用户使用 `<@USER_ID>`，频道使用 `<#CHANNEL_ID>`，角色使用 `<@&ROLE_ID>`。不要使用旧版 `<@!USER_ID>` 昵称提及形式。

    `requireMention` 按服务器/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃提及其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选允许列表通过 `dm.groupChannels` 配置（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 公会成员路由到不同智能体。基于角色的绑定仅接受角色 ID，并且会在对等或父对等绑定之后、公会专用绑定之前求值。如果某个绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有已配置字段都必须匹配。

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

- `commands.native` 默认为 `"auto"`，并且对 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会在启动期间跳过 Discord 斜杠命令注册和清理。之前注册的命令可能仍会在 Discord 中可见，直到你从 Discord 应用中移除它们。
- 原生命令认证使用与普通消息处理相同的 Discord 允许列表/策略。
- 对未授权用户，命令可能仍会在 Discord UI 中可见；执行时仍会强制执行 OpenClaw 认证，并返回“未授权”。

请参阅[斜杠命令](/zh-CN/tools/slash-commands)了解命令目录和行为。

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
    `first` 始终会将隐式原生回复引用附加到该轮次的第一条出站 Discord 消息。
    `batched` 仅在入站事件是多条消息经防抖合并后的批次时，才附加 Discord 的隐式原生回复引用。当你主要希望对含义不明的突发聊天使用原生回复，而不是对每个单消息轮次都使用时，这很有用。

    消息 ID 会显示在上下文/历史中，因此智能体可以定位特定消息。

  </Accordion>

  <Accordion title="链接预览">
    默认情况下，Discord 会为 URL 生成富链接嵌入。OpenClaw 默认会抑制出站 Discord 消息中的这些生成嵌入，因此智能体发送的 URL 会保持为普通链接，除非你选择启用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    设置 `channels.discord.accounts.<id>.suppressEmbeds` 可覆盖某个账户。智能体消息工具发送也可以为单条消息传入 `suppressEmbeds: false`。显式 Discord `embeds` 载荷不会被默认链接预览设置抑制。

  </Accordion>

  <Accordion title="实时流预览">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑它来流式传输草稿回复。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（默认）。`progress` 会保留一条可编辑的状态草稿，并用工具进度更新它，直到最终送达；共享起始标签是一条滚动行，因此在出现足够多工作内容后，它会像其他内容一样滚走。`streamMode` 是旧版运行时别名。运行 `openclaw doctor --fix` 可将持久化配置重写为规范键。

    将 `channels.discord.streaming.mode` 设为 `off` 可禁用 Discord 预览编辑。如果显式启用了 Discord 分块流式传输，OpenClaw 会跳过预览流，以避免双重流式传输。

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

    - `partial` 会在令牌到达时编辑单条预览消息。
    - `block` 会发出草稿大小的分块（使用 `draftChunk` 调整大小和断点，并限制在 `textChunkLimit` 内）。
    - 媒体、错误和显式回复的最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否复用预览消息。
    - 工具/进度行会在可用时渲染为紧凑的表情符号 + 标题 + 详情，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（默认 `false`）选择在临时进度草稿中包含助手评论/前言文本。评论会在显示前清理，保持临时状态，并且不会改变最终答案送达。
    - `streaming.progress.maxLineChars` 控制每行进度预览预算。正文会按词边界缩短；命令和路径详情会保留有用的后缀。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制紧凑进度行中的命令/exec 详情：`raw`（默认）或 `status`（仅工具标签）。

    隐藏原始命令/exec 文本，同时保留紧凑进度行：

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

    预览流式传输仅支持文本；媒体回复会回退到普通送达。当显式启用 `block` 流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

  </Accordion>

  <Accordion title="历史、上下文和线程行为">
    公会历史上下文：

    - `channels.discord.historyLimit` 默认 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    私信历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程会作为渠道会话路由，并继承父渠道配置，除非被覆盖。
    - 线程会话会继承父渠道的会话级 `/model` 选择，作为仅模型回退；线程本地 `/model` 选择仍优先，并且不会复制父记录历史，除非启用了记录继承。
    - `channels.discord.thread.inheritParent`（默认 `false`）会让新的自动线程选择从父记录中播种。按账户覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 消息工具反应可以解析 `user:<id>` 私信目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 会在回复阶段激活回退期间保留。

    渠道主题会作为**不受信任**的上下文注入。允许列表限制谁可以触发智能体，但不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="用于子智能体的线程绑定会话">
    Discord 可以将线程绑定到会话目标，使该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活跃运行和绑定状态
    - `/session idle <duration|off>` 查看/更新聚焦绑定的不活跃自动取消聚焦
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
    - `spawnSessions` 控制通过 `sessions_spawn({ thread: true })` 和 ACP 线程生成来自动创建/绑定线程。默认：`true`。
    - `defaultSpawnContext` 控制线程绑定生成的原生子智能体上下文。默认：`"fork"`。
    - 已弃用的 `spawnSubagentSessions`/`spawnAcpSessions` 键会由 `openclaw doctor --fix` 迁移。
    - 如果某个账户禁用了线程绑定，则 `/focus` 和相关线程绑定操作不可用。

    请参阅[子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents)和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 渠道绑定">
    对于稳定的“始终在线”ACP 工作区，请配置面向 Discord 对话的顶层类型化 ACP 绑定。

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

    注意：

    - `/acp spawn codex --bind here` 会就地绑定当前渠道或线程，并让未来消息保持在同一个 ACP 会话上。线程消息会继承父渠道绑定。
    - 在已绑定的渠道或线程中，`/new` 和 `/reset` 会就地重置同一个 ACP 会话。临时线程绑定在活跃期间可以覆盖目标解析。
    - `spawnSessions` 通过 `--thread auto|here` 控制子线程创建/绑定。

    请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)了解绑定行为详情。

  </Accordion>

  <Accordion title="反应通知">
    按公会配置反应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    反应事件会转换为系统事件，并附加到路由后的 Discord 会话。

  </Accordion>

  <Accordion title="确认反应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送确认表情符号。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    注意：

    - Discord 接受 unicode 表情符号或自定义表情符号名称。
    - 使用 `""` 可禁用某个渠道或账户的反应。

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
    使用 `channels.discord.proxy` 通过 HTTP(S) 代理路由 Discord gateway WebSocket 流量和启动 REST 查询（应用程序 ID + 允许列表解析）。

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
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    注意：

    - allowlists 可以使用 `pk:<memberId>`
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，成员显示名称才会按名称/slug 匹配
    - 查询使用原始消息 ID，并受时间窗口约束
    - 如果查询失败，代理消息会被视为 bot 消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
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

  <Accordion title="Presence configuration">
    当你设置状态或活动字段，或启用自动 presence 时，会应用 presence 更新。

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
    - 2：正在收听
    - 3：正在观看
    - 4：自定义（使用活动文本作为状态 state；emoji 可选）
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

    自动 presence 会将运行时可用性映射到 Discord 状态：健康 => online，降级或未知 => idle，耗尽或不可用 => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord 支持在私信中进行基于按钮的审批处理，也可以选择在来源渠道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；可行时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，且至少可以解析一个审批人时，Discord 会自动启用原生 exec 审批；审批人可以来自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不会从渠道 `allowFrom`、旧版 `dm.allowFrom` 或直接消息 `defaultTo` 推断 exec 审批人。设置 `enabled: false` 可明确禁用 Discord 作为原生审批客户端。

    对于 `/diagnostics` 和 `/export-trajectory` 等敏感的仅 owner 群组命令，OpenClaw 会私下发送审批提示和最终结果。当调用的 owner 有 Discord owner 路由时，它会先尝试 Discord 私信；如果不可用，则回退到 `commands.ownerAllowFrom` 中第一个可用的 owner 路由，例如 Telegram。

    当 `target` 为 `channel` 或 `both` 时，审批提示会在渠道中可见。只有已解析的审批人可以使用按钮；其他用户会收到一条临时拒绝消息。审批提示包含命令文本，因此仅应在受信任渠道中启用渠道投递。如果无法从会话键派生渠道 ID，OpenClaw 会回退到私信投递。

    Discord 也会渲染其他聊天渠道使用的共享审批按钮。原生 Discord 适配器主要增加审批人私信路由和渠道扇出。
    当这些按钮存在时，它们是主要审批 UX；OpenClaw
    仅应在工具结果表明聊天审批不可用，或手动审批是唯一路径时，才包含手动 `/approve` 命令。
    如果 Discord 原生审批运行时未激活，OpenClaw 会保持本地确定性的 `/approve <id> <decision>` 提示可见。如果运行时已激活，但原生卡片无法投递到任何目标，
    OpenClaw 会发送同一聊天回退通知，其中包含待处理审批里的确切 `/approve`
    命令。

    Gateway 网关 auth 和审批解析遵循共享 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。审批默认在 30 分钟后过期。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息发送、渠道管理、内容审核、presence 和元数据操作。

核心示例：

- 消息发送：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 反应：`react`、`reactions`、`emojiList`
- 内容审核：`timeout`、`kick`、`ban`
- presence：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径），用于设置定时事件封面图。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                                  | 默认值 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 启用   |
| roles                                                                                                                                                                    | 禁用   |
| moderation                                                                                                                                                               | 禁用   |
| presence                                                                                                                                                                 | 禁用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 处理 exec 审批和跨上下文标记。Discord 消息操作也可以接受 `components` 来实现自定义 UI（高级用法；需要通过 discord 工具构造 component payload），旧版 `embeds` 仍然可用，但不推荐。

- `channels.discord.ui.components.accentColor` 设置 Discord component 容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账户设置。
- `channels.discord.agentComponents.ttlMs` 控制已发送 Discord component 回调保持注册的时长（默认 `1800000`，最大 `86400000`）。使用 `channels.discord.accounts.<id>.agentComponents.ttlMs` 按账户设置。
- 当存在 components v2 时，会忽略 `embeds`。
- 默认会抑制普通 URL 预览。当单个出站链接应展开时，在消息操作上设置 `suppressEmbeds: false`。

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

Discord 有两个不同的语音表面：实时 **语音频道**（连续对话）和 **语音消息附件**（波形预览格式）。Gateway 网关同时支持两者。

### 语音频道

设置检查清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户 allowlists 时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` scope 邀请 bot。
4. 在目标语音频道授予 Connect、Speak、Send Messages 和 Read Message History 权限。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账户默认智能体，并遵循与其他 Discord 命令相同的 allowlist 和群组策略规则。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

若要在加入前检查 bot 的有效权限，请运行：

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

注意：

- `voice.tts` 仅针对 `stt-tts` 语音播放覆盖 `messages.tts`。实时模式使用 `voice.realtime.speakerVoice`。
- `voice.mode` 控制对话路径。默认值为 `agent-proxy`：实时语音前端处理轮次时序、打断和播放，通过 `openclaw_agent_consult` 将实质性工作委派给路由到的 OpenClaw 智能体，并像处理该说话者输入的 Discord 文本提示一样处理结果。`stt-tts` 保留较旧的批量 STT 加 TTS 流程。`bidi` 允许实时模型直接对话，同时为 OpenClaw 大脑暴露 `openclaw_agent_consult`。
- `voice.agentSession` 控制哪个 OpenClaw 对话接收语音轮次。保持未设置时使用语音频道自己的会话，或设置 `{ mode: "target", target: "channel:<text-channel-id>" }`，让语音频道充当现有 Discord 文本频道会话（例如 `#maintainers`）的麦克风/扬声器扩展。
- `voice.model` 会覆盖用于 Discord 语音响应和实时咨询的 OpenClaw 智能体大脑。保持未设置时继承路由到的智能体模型。它与 `voice.realtime.model` 分开。
- `voice.followUsers` 允许 bot 跟随选定用户加入、移动和离开 Discord 语音。行为规则和示例见[在语音中跟随用户](#follow-users-in-voice)。
- `agent-proxy` 通过 `discord-voice` 路由语音，它会保留说话者和目标会话的常规所有者/工具授权，但隐藏智能体 `tts` 工具，因为 Discord 语音负责播放。默认情况下，`agent-proxy` 会为所有者说话者授予咨询完整的所有者等效工具访问权限（`voice.realtime.toolPolicy: "owner"`），并强烈倾向于在给出实质性回答前咨询 OpenClaw 智能体（`voice.realtime.consultPolicy: "always"`）。在默认的 `always` 模式下，实时层不会在咨询答案前自动说出填充内容；它会捕获并转写语音，然后说出路由到的 OpenClaw 答案。如果多个强制咨询答案在 Discord 仍在播放第一个答案时完成，后续精确语音答案会排队等待播放空闲，而不是在句子中途替换语音。
- 在 `stt-tts` 模式下，STT 使用 `tools.media.audio`；`voice.model` 不影响转写。
- 在实时模式下，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 配置实时音频会话。对于 OpenAI Realtime 2 加 Codex 大脑，使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai/gpt-5.5"`。
- 实时语音模式默认会在实时提供商指令中包含小型 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 配置文件，这样快速直接轮次会保持与路由到的 OpenClaw 智能体相同的身份、用户背景和人格。将 `voice.realtime.bootstrapContextFiles` 设置为子集可自定义此行为，或设置为 `[]` 可禁用它。支持的实时引导文件仅限这些配置文件；`AGENTS.md` 保持在常规智能体上下文中。注入的配置文件上下文不会取代用于工作区工作、当前事实、记忆查询或工具支持操作的 `openclaw_agent_consult`。
- 在 OpenAI `agent-proxy` 实时模式下，设置 `voice.realtime.requireWakeName: true`，可让 Discord 实时语音在转写以唤醒名称开始或结束前保持静默。配置的唤醒名称必须为一个或两个词。如果未设置 `voice.realtime.wakeNames`，OpenClaw 会使用路由到的智能体 `name` 加 `OpenClaw`，并在缺失时回退到智能体 ID 加 `OpenClaw`。唤醒名称门控会禁用实时提供商自动响应，将接受的轮次通过 OpenClaw 智能体咨询路径路由，并在最终转写到达前从部分转写中识别到前置唤醒名称时给出简短的语音确认。
- OpenAI 实时提供商接受当前 Realtime 2 事件名称和旧版 Codex 兼容的输出音频与转写事件别名，因此兼容的提供商快照即使发生漂移，也不会丢失助手音频。
- `voice.realtime.bargeIn` 控制 Discord 说话者开始事件是否打断正在进行的实时播放。如果未设置，它会跟随实时提供商的输入音频打断设置。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 实时插话截断音频前的最小助手播放时长。默认值：`250`。在低回声房间中设置为 `0` 可立即打断，或在回声较重的扬声器设置中提高该值。
- 如需在 Discord 播放中使用 OpenAI 语音，请设置 `voice.tts.provider: "openai"`，并在 `voice.tts.providers.openai.speakerVoice` 下选择 Text-to-speech 语音。`cedar` 是当前 OpenAI TTS 模型上一个不错的偏男性声音选择。
- 按频道配置的 Discord `systemPrompt` 覆盖会应用于该语音频道的语音转写轮次。
- 对于所有者门控命令和频道操作，语音转写轮次会从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态。智能体工具可见性会遵循路由会话配置的工具策略。
- 对于纯文本配置，Discord 语音是选择启用的；设置 `channels.discord.voice.enabled=true`（或保留现有 `channels.discord.voice` 块）可启用 `/vc` 命令、语音运行时和 `GuildVoiceStates` Gateway 网关 intent。
- `channels.discord.intents.voiceStates` 可显式覆盖语音状态 intent 订阅。保持未设置时，该 intent 会跟随有效的语音启用状态。
- 如果 `voice.autoJoin` 对同一 guild 有多个条目，OpenClaw 会加入该 guild 最后配置的频道。
- `voice.allowedChannels` 是可选的驻留允许列表。保持未设置时允许 `/vc join` 加入任何已授权的 Discord 语音频道。设置后，`/vc join`、启动自动加入和 bot 语音状态移动都会限制在列出的 `{ guildId, channelId }` 条目内。将其设置为空数组可拒绝所有 Discord 语音加入。如果 Discord 将 bot 移出允许列表，OpenClaw 会离开该频道，并在有可用目标时重新加入配置的自动加入目标。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 加入选项。
- 如果未设置，`@discordjs/voice` 默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用内置的 `libopus-wasm` 编解码器接收 Discord 语音并播放实时原始 PCM。它随附固定版本的 libopus WebAssembly 构建，不需要原生 opus 插件。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间。默认值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 在断开的语音会话开始重新连接前等待多久，超过后将其销毁。默认值：`15000`。
- 在 `stt-tts` 模式下，语音播放不会仅因另一个用户开始说话而停止。为避免反馈循环，OpenClaw 会在 TTS 播放期间忽略新的语音捕获；请在播放完成后再说下一轮。实时模式会将说话者开始事件作为插话信号转发给实时提供商。
- 在实时模式下，扬声器回声进入开启的麦克风时可能看起来像插话并打断播放。对于回声较重的 Discord 房间，设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`，可避免 OpenAI 在输入音频上自动打断。如果仍希望 Discord 说话者开始事件打断正在进行的播放，请添加 `voice.realtime.bargeIn: true`。OpenAI 实时桥接会将短于 `voice.realtime.minBargeInAudioEndMs` 的播放截断视为可能的回声/噪声并忽略，记录为已跳过，而不是清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 报告说话者已停止后，OpenClaw 等待多久才将该音频片段最终确定用于 STT。默认值：`2000`；如果 Discord 将正常停顿拆成断断续续的部分转写，请提高此值。
- 当 ElevenLabs 是选定的 TTS 提供商时，Discord 语音播放会使用流式 TTS，并从提供商响应流开始。不支持流式传输的提供商会回退到合成临时文件路径。
- OpenClaw 还会监控接收解密失败，并在短时间窗口内重复失败后通过离开/重新加入语音频道自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖报告和日志。内置的 `@discordjs/voice` 版本线包含来自 discord.js PR #11449 的上游填充修复，该修复关闭了 discord.js issue #11419。
- 当 OpenClaw 最终确定捕获的说话者片段时，预计会出现 `The operation was aborted` 接收事件；它们是详细诊断，不是警告。
- 详细的 Discord 语音日志会为每个已接受的说话者片段包含有界的单行 STT 转写预览，因此调试时可看到用户侧和智能体回复侧，而不会转储无界转写文本。
- 在 `agent-proxy` 模式下，强制咨询回退会跳过可能不完整的转写片段，例如以 `...` 结尾的文本，或像 `and` 这样的尾随连接词，以及明显不可操作的结束语，如“马上回来”或“再见”。当这会阻止陈旧的排队答案时，日志会显示 `forced agent consult skipped reason=...`。

### 在语音中跟随用户

当你希望 Discord 语音 bot 跟随一个或多个已知 Discord 用户，而不是在启动时加入固定频道或等待 `/vc join` 时，请使用 `voice.followUsers`。

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
- 当配置了 `followUsers` 时，`followUsersEnabled` 默认值为 `true`。将其设置为 `false` 可保留已保存列表，但停止自动语音跟随。
- 当被跟随用户加入允许的语音频道时，OpenClaw 会加入该频道。用户移动时，OpenClaw 会随其移动。活跃的被跟随用户断开连接时，OpenClaw 会离开。
- 如果同一 guild 中有多个被跟随用户，且活跃的被跟随用户离开，OpenClaw 会在离开该 guild 前移动到另一个被跟随用户的频道。如果多个被跟随用户同时移动，最后观察到的语音状态事件生效。
- `allowedChannels` 仍然适用。处于不允许频道中的被跟随用户会被忽略，跟随拥有的会话会移动到另一个被跟随用户或离开。
- OpenClaw 会在启动时和按有界间隔协调错过的语音状态事件。协调会采样已配置的 guild，并限制每次运行的 REST 查询次数，因此很大的 `followUsers` 列表可能需要多个间隔才能收敛。
- 如果 Discord 或管理员在 bot 正在跟随用户时移动 bot，OpenClaw 会重建语音会话，并在目标位置被允许时保留跟随所有权。如果 bot 被移到 `allowedChannels` 外，OpenClaw 会离开，并在存在配置目标时重新加入。
- DAVE 接收恢复可能会在重复解密失败后离开并重新加入同一频道。跟随拥有的会话会在该恢复路径中保留其跟随所有权，因此后续被跟随用户断开连接时仍会离开频道。

在加入模式之间选择：

- 对于个人或操作员设置，如果 bot 应在你进入语音时自动出现在语音中，请使用 `followUsers`。
- 对于即使没有被跟踪用户在语音中也应保持在线的固定房间 bot，请使用 `autoJoin`。
- 对于一次性加入或自动语音在线会令人意外的房间，请使用 `/vc join`。

Discord 语音编解码器：

- 语音接收日志显示 `discord voice: opus decoder: libopus-wasm`。
- 实时播放会使用同一个内置 `libopus-wasm` 包，把原始 48 kHz 立体声 PCM 编码为 Opus，然后再把数据包交给 `@discordjs/voice`。
- 文件和提供商流式播放会用 ffmpeg 转码为原始 48 kHz 立体声 PCM，然后使用 `libopus-wasm` 生成发送到 Discord 的 Opus 数据包流。

STT 加 TTS 管线：

- Discord PCM 捕获会转换为一个临时 WAV 文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录文本会通过 Discord 入口和路由发送，同时响应 LLM 会使用语音输出策略运行：该策略隐藏智能体 `tts` 工具并要求返回文本，因为 Discord 语音负责最终 TTS 播放。
- 设置 `voice.model` 时，它只会覆盖此语音渠道轮次的响应 LLM。
- `voice.tts` 会覆盖合并到 `messages.tts`；支持流式传输的提供商会直接馈送播放器，否则会在已加入的频道中播放生成的音频文件。

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

没有 `voice.agentSession` 块时，每个语音频道都会获得自己的已路由 OpenClaw 会话。例如，`/vc join channel:234567890123456789` 会与该 Discord 语音频道对应的会话对话。实时模型只是语音前端；实质性请求会交给已配置的 OpenClaw 智能体。如果实时模型在未调用 consult 工具的情况下生成最终转录文本，OpenClaw 会强制 consult 作为回退，因此默认行为仍然像是在与智能体对话。

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

在 `agent-proxy` 模式下，机器人会加入已配置的语音频道，但 OpenClaw 智能体轮次会使用目标频道的常规已路由会话和智能体。实时语音会话会把返回的结果说回语音频道。监督智能体仍可按其工具策略使用常规消息工具，包括在适合时发送一条单独的 Discord 消息。

委派的 OpenClaw 运行处于活动状态时，新的 Discord 语音转录文本会在启动另一个智能体轮次之前被视为实时运行控制。“状态”、“取消那个”、“使用更小的修复”，或“完成后也检查测试”等短语会被归类为活动会话的状态、取消、Steering 或后续输入。状态、取消、已接受的 Steering 和后续结果都会说回语音频道，让调用者知道 OpenClaw 是否处理了请求。

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

当模型会通过开启的麦克风听到自己的 Discord 播放，但你仍希望通过说话打断它时，请使用此配置。OpenClaw 会阻止 OpenAI 在原始输入音频上自动中断，同时 `bargeIn: true` 允许 Discord 说话者开始事件和已处于活动状态的说话者音频，在下一段捕获的轮次到达 OpenAI 之前取消活动的实时响应。`audioEndMs` 低于 `minBargeInAudioEndMs` 的非常早期插话信号会被视为可能的回声/噪声并被忽略，因此模型不会在第一个播放帧时就被截断。

预期语音日志：

- 加入时：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 实时启动时：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 说话者音频上：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`，以及 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 跳过陈旧语音时：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 实时响应完成时：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重置时：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 实时 consult 时：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 智能体回答时：`discord voice: agent turn answer ...`
- 精确语音入队时：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，随后是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 检测到插话时：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，随后是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 实时中断时：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，随后是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回声/噪声时：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 禁用插话时：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 空闲播放时：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

要调试音频被截断的问题，请把实时语音日志当作时间线来阅读：

1. `realtime audio playback started` 表示 Discord 已开始播放助手音频。从这一点开始，桥接器会统计助手输出块、Discord PCM 字节、提供商实时字节，以及合成音频时长。
2. `realtime speaker turn opened` 标记 Discord 说话者变为活动状态。如果播放已经处于活动状态且启用了 `bargeIn`，之后可能会出现 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 标记该说话者轮次收到的第一帧实际音频。这里的 `outputActive=true` 或非零 `outputAudioMs` 表示麦克风正在发送输入，而助手播放仍处于活动状态。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助手播放处于活动状态时看到了实时说话者音频。这有助于区分真实打断和没有有用音频的 Discord 说话者开始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 请求实时提供商取消或截断活动响应。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，因此你可以看到中断前实际播放了多少助手音频。
6. `realtime audio playback stopped reason=...` 是本地 Discord 播放重置点。原因会说明是谁停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 汇总捕获到的输入轮次。`chunks=0` 或 `hasAudio=false` 表示说话者轮次已打开，但没有可用音频到达实时桥接器。`interruptedPlayback=true` 表示该输入轮次与助手输出重叠，并触发了插话逻辑。

可用字段：

- `outputAudioMs`：实时提供商在该日志行之前生成的助手音频时长。
- `audioMs`：OpenClaw 在播放停止前统计到的助手音频时长。
- `elapsedMs`：打开和关闭播放流或说话者轮次之间的挂钟时间。
- `discordBytes`：发送到 Discord 语音或从 Discord 语音接收的 48 kHz 立体声 PCM 字节。
- `realtimeBytes`：发送到实时提供商或从实时提供商接收的提供商格式 PCM 字节。
- `playbackChunks`：为活动响应转发到 Discord 的助手音频块。
- `sinceLastAudioMs`：最后一个捕获到的说话者音频帧与说话者轮次关闭之间的间隔。

常见模式：

- 立即截断并伴随 `source=active-speaker-audio`、较小的 `outputAudioMs`，且附近是同一个用户，通常表明扬声器回声进入了麦克风。提高 `voice.realtime.minBargeInAudioEndMs`，降低扬声器音量，使用耳机，或设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 后跟 `speaker turn closed ... hasAudio=false` 表示 Discord 报告了说话者开始，但没有音频到达 OpenClaw。这可能是瞬时 Discord 语音事件、噪声门行为，或客户端短暂按下麦克风。
- `audio playback stopped reason=stream-close` 且附近没有插话或 `provider-clear-audio`，表示本地 Discord 播放流意外结束。检查前面的提供商和 Discord 播放器日志。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助手音频处于活动状态时有意丢弃了输入。如果你希望语音中断播放，请启用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供商 VAD 报告了语音，但 OpenClaw 没有可中断的活动播放。这不应截断音频。

凭证按组件解析：`voice.model` 使用 LLM 路由凭证，`tools.media.audio` 使用 STT 凭证，`messages.tts`/`voice.tts` 使用 TTS 凭证，`voice.realtime.providers` 或提供商的常规凭证配置使用实时提供商凭证。

### 语音消息

Discord 语音消息会显示波形预览，并且需要 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上的 `ffmpeg` 和 `ffprobe` 来检查和转换。

- 提供一个**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 会拒绝同一载荷中的文本 + 语音消息）。
- 接受任意音频格式；OpenClaw 会按需转换为 OGG/Opus。

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

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 为 false 但仍被阻止">
    常见原因：

    - `groupPolicy="allowlist"`，但没有匹配的服务器/频道允许列表
    - `requireMention` 配置在错误位置（必须位于 `channels.discord.guilds` 或频道条目下）
    - 发送者被服务器/频道 `users` 允许列表阻止

  </Accordion>

  <Accordion title="长时间运行的 Discord 轮次或重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 网关队列调节项：

    - 单账号：`channels.discord.eventQueue.listenerTimeout`
    - 多账号：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这只控制 Discord Gateway 网关监听器工作，不控制智能体轮次生命周期

    Discord 不会对排队的智能体轮次应用频道自有的超时。消息监听器会立即交接，并且排队的 Discord 运行会保持每个会话的顺序，直到会话/工具/运行时生命周期完成或中止该工作。

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
    OpenClaw 会在连接前获取 Discord `/gateway/bot` 元数据。瞬时故障会回退到 Discord 的默认 Gateway 网关 URL，并在日志中做速率限制。

    元数据超时调节项：

    - 单账号：`channels.discord.gatewayInfoTimeoutMs`
    - 多账号：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 配置未设置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway 网关 READY 超时重启">
    OpenClaw 会在启动期间以及运行时重连后等待 Discord 的 Gateway 网关 `READY` 事件。带启动错峰的多账号设置可能需要比默认值更长的启动 READY 窗口。

    READY 超时调节项：

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
    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式中等待配对批准

  </Accordion>

  <Accordion title="机器人到机器人循环">
    默认情况下，机器人作者的消息会被忽略。

    如果你设置 `channels.discord.allowBots=true`，请使用严格的提及和允许列表规则来避免循环行为。
    优先使用 `channels.discord.allowBots="mentions"`，只接受提及该机器人的机器人消息。

    OpenClaw 还提供共享的[机器人循环保护](/zh-CN/channels/bot-loop-protection)。每当 `allowBots` 允许机器人作者的消息进入分发时，Discord 会将入站事件映射到 `(account, channel, bot pair)` 事实，并且通用配对防护会在该配对超过配置的事件预算后抑制它。该防护会阻止失控的双机器人循环，这些循环以前只能靠 Discord 速率限制停止；它不会影响单机器人部署，也不会影响保持在预算内的一次性机器人回复。

    默认设置（设置 `allowBots` 时生效）：

    - `maxEventsPerWindow: 20` -- 机器人配对可在滑动窗口内交换 20 条消息
    - `windowSeconds: 60` -- 滑动窗口长度
    - `cooldownSeconds: 60` -- 一旦预算触发，任一方向上的每条额外机器人到机器人消息都会被丢弃一分钟

    在 `channels.defaults.botLoopProtection` 下配置一次共享默认值，然后在合法工作流需要更大余量时覆盖 Discord。优先级为：

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

  <Accordion title="语音 STT 因 DecryptionFailed(...) 丢弃">

    - 保持 OpenClaw 为当前版本（`openclaw update`），以便具备 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，并且仅在需要时调优
    - 观察日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后故障仍然持续，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史进行对比

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[Configuration reference - Discord](/zh-CN/gateway/config-channels#discord)。

<Accordion title="高信号 Discord 字段">

- 启动/凭证：`enabled`、`token`、`accounts.*`、`allowBots`
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
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全和运维

- 将机器人令牌视为机密（在受监督环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态过期，请重启 Gateway 网关，并使用 `openclaw channels status --probe` 重新检查。

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Discord 用户配对到 Gateway 网关。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群聊和允许列表行为。
  </Card>
  <Card title="频道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将服务器和频道映射到智能体。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>

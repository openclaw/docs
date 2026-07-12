---
read_when:
    - 开发 Discord 渠道功能
summary: Discord Bot 设置、配置键、组件、语音和故障排查
title: Discord
x-i18n:
    generated_at: "2026-07-12T21:22:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6cb693cd1c772570cd09ca3ac3ad6278ac93e9641b25ed06e1496f98b75e8b1b
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw 通过官方 Discord Gateway 网关以机器人的身份连接到 Discord。支持私信和服务器频道。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Discord 私信默认使用配对模式。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="频道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

创建一个带机器人的 Discord 应用，将机器人添加到你的服务器，并将其与 OpenClaw 配对。如果可以，请使用私人服务器；如有需要，请先[创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（**Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用和机器人">
    在 [Discord Developer Portal](https://discord.com/developers/applications) 中，点击 **New Application** 并为其命名（例如“OpenClaw”）。

    打开侧边栏中的 **Bot**，并将 **Username** 设置为你的智能体名称。

  </Step>

  <Step title="启用特权意图">
    仍在 **Bot** 页面中，在 **Privileged Gateway Intents** 下启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色允许列表、名称到 ID 的匹配以及频道受众访问组需要此项）
    - **Presence Intent**（可选；仅用于在线状态更新）

  </Step>

  <Step title="复制你的机器人令牌">
    在 **Bot** 页面中，点击 **Reset Token** 并复制令牌。

    <Note>
    尽管名称如此，这会生成你的第一个令牌，并没有“重置”任何内容。
    </Note>

  </Step>

  <Step title="生成邀请 URL 并将机器人添加到你的服务器">
    打开侧边栏中的 **OAuth2**。在 **OAuth2 URL Generator** 中，启用以下作用域：

    - `bot`
    - `applications.commands`

    在出现的 **Bot Permissions** 部分中，至少启用：

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基准权限。如果机器人将在帖子串中发帖——包括会创建或继续帖子串的论坛或媒体频道工作流——还要启用 **Send Messages in Threads**。

    复制生成的 URL，在浏览器中打开它，选择你的服务器，然后点击 **Continue**。此时机器人应出现在你的服务器中。

  </Step>

  <Step title="启用开发者模式并收集你的 ID">
    在 Discord 应用中启用开发者模式，以便复制 ID：

    1. **User Settings**（齿轮图标）→ **Developer** → 开启 **Developer Mode**
       *（在移动端：**App Settings** → **Advanced**）*
    2. 右键点击你的**服务器图标** → **Copy Server ID**
    3. 右键点击你自己的**头像** → **Copy User ID**

    将服务器 ID 和用户 ID 与机器人令牌一同保存；下一步需要这三项。

  </Step>

  <Step title="允许接收服务器成员的私信">
    要使配对正常工作，Discord 必须允许机器人向你发送私信。右键点击你的**服务器图标** → **Privacy Settings** → 开启 **Direct Messages**。

    如果你通过 Discord 私信使用 OpenClaw，请保持此项开启。如果你只使用服务器频道，可以在配对后将其关闭。

  </Step>

  <Step title="安全地设置机器人令牌（不要在聊天中发送）">
    机器人令牌是机密信息。在向智能体发送消息前，请在运行 OpenClaw 的计算机上设置它：

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
    对于托管服务安装，请在已设置 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将该变量存储在 `~/.openclaw/.env` 中，以便服务在重启后解析环境变量 SecretRef。
    如果你的主机受到 Discord 启动时应用查询的阻止或速率限制，请从开发者门户设置应用/客户端 ID，使启动过程可以跳过该 REST 调用：默认账户使用 `channels.discord.applicationId`，每个机器人则使用 `channels.discord.accounts.<accountId>.applicationId`。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的智能体">
        在现有渠道（例如 Telegram）上与你的 OpenClaw 智能体聊天并告诉它。如果 Discord 是你的第一个渠道，请改用 CLI / 配置选项卡。

        > “我已经在配置中设置了 Discord 机器人令牌。请使用用户 ID `<user_id>` 和服务器 ID `<server_id>` 完成 Discord 设置。”
      </Tab>
      <Tab title="CLI / 配置">
        基于文件的配置：

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

        对于脚本化或远程设置，请使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 写入相同的 JSON5 块，然后移除 `--dry-run` 并重新运行。也可以使用纯文本 `token` 字符串，并且 `channels.discord.token` 支持 env/file/exec 提供商的 SecretRef 值。请参阅[机密信息管理](/zh-CN/gateway/secrets)。

        对于多个 Discord 机器人，请将每个机器人的令牌和应用 ID 保存在其账户下。顶层 `channels.discord.applicationId` 会由账户继承，因此仅当所有账户都使用相同的应用 ID 时才在此处设置。

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
    Gateway 网关运行后，在 Discord 中向你的机器人发送私信。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的智能体">
        在现有渠道上将配对码发送给你的智能体：

        > “批准此 Discord 配对码：`<CODE>`”
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配对码将在 1 小时后过期。批准后，通过 Discord 私信与你的智能体聊天。

  </Step>
</Steps>

<Note>
令牌解析会区分账户。配置中的令牌值优先于环境变量回退，并且 `DISCORD_BOT_TOKEN` 仅用于默认账户。
如果两个已启用的 Discord 账户解析到同一个机器人令牌，OpenClaw 只会为该令牌启动一个 Gateway 网关监视器：来自配置的令牌优先于环境变量回退；否则，第一个启用的账户优先，重复账户会被报告为已禁用，原因是 `duplicate bot token`。
对于高级出站调用（消息工具/渠道操作），每次调用显式指定的 `token` 会用于该次调用。这适用于发送操作以及读取/探测类操作（读取/搜索/获取/帖子串/置顶消息/权限）。账户策略/重试设置仍来自活动运行时快照中选定的账户。
</Note>

## 推荐：设置服务器工作区

私信可以正常工作后，你可以将服务器变成完整的工作区，其中每个频道都拥有自己的智能体会话和上下文。建议用于只有你和机器人的私人服务器。

<Steps>
  <Step title="将你的服务器添加到服务器允许列表">
    这使你的智能体可以在服务器的任何频道中响应，而不仅限于私信。

    <Tabs>
      <Tab title="询问你的智能体">
        > “将我的 Discord 服务器 ID `<server_id>` 添加到服务器允许列表”
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
    默认情况下，只有在服务器频道中被 @提及时，智能体才会响应。在私人服务器中，你可能希望它响应每条消息。

    在服务器频道中，普通回复默认会自动发布。对于共享的常驻聊天室，可以选择启用 `messages.groupChat.visibleReplies: "message_tool"`，让智能体可以潜伏，并仅在其判断频道回复有用时才发帖。此功能最适合 GPT-5.6 Sol 等最新一代、工具可靠的模型。除非工具发送消息，否则环境聊天室事件会保持静默。有关完整的潜伏模式配置，请参阅[环境聊天室事件](/zh-CN/channels/ambient-room-events)。

    如果 Discord 显示正在输入，且日志显示有令牌用量，但没有发布消息，请检查该轮次是否配置为环境聊天室事件，或是否已选择使用消息工具发布可见回复。

    <Tabs>
      <Tab title="询问你的智能体">
        > “允许我的智能体在此服务器上响应，无需被 @提及”
      </Tab>
      <Tab title="配置">
        在服务器配置中设置 `requireMention: false`：

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

        要求可见的群组/频道回复通过消息工具发送，请设置 `messages.groupChat.visibleReplies: "message_tool"`。

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划服务器频道中的记忆使用方式">
    长期记忆（MEMORY.md）仅在私信会话中自动加载；服务器频道不会加载它。

    <Tabs>
      <Tab title="询问你的智能体">
        > “当我在 Discord 频道中提问时，如果需要 MEMORY.md 中的长期上下文，请使用 memory_search 或 memory_get。”
      </Tab>
      <Tab title="手动">
        对于每个频道都需要的共享上下文，请将稳定的指令放在 `AGENTS.md` 或 `USER.md` 中（每个会话都会注入）。将长期笔记保存在 `MEMORY.md` 中，并按需使用记忆工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在创建频道并开始聊天。智能体可以看到频道名称，每个频道都是一个隔离的会话——设置 `#coding`、`#home`、`#research`，或任何适合你工作流的频道。

## 运行时模型

- Gateway 网关负责 Discord 连接。
- 回复路由是确定性的：来自 Discord 的入站消息会回复到 Discord。
- Discord 服务器/频道元数据会作为不受信任的上下文添加到模型提示词中，而不是作为用户可见的回复前缀。如果模型将该信封复制回回复中，OpenClaw 会从出站回复和未来的重放上下文中移除复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 服务器频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话（`agent:<agentId>:discord:slash:<userId>`）中运行，同时仍会携带指向路由后对话会话的 `CommandTargetSessionKey`。
- 纯文本 cron/Heartbeat 通知发送到 Discord 时，会合并为最终对智能体可见的答案，并只发送一次。当智能体生成多个可交付载荷时，媒体和结构化组件载荷仍会作为多条消息发送。

## 论坛频道

Discord 论坛和媒体频道只接受帖子串中的帖子。OpenClaw 支持通过两种方式创建它们：

- 向论坛父频道（`channel:<forumId>`）发送消息可自动创建帖子。帖子标题取消息中第一个非空行（截断至 Discord 的 100 字符帖子名称限制）。
- 使用 `openclaw message thread create` 可直接创建帖子。对于论坛频道，不要传递 `--message-id`。

向论坛父频道发送消息以创建帖子：

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "主题标题\n帖子正文"
```

显式创建论坛帖子：

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "主题标题" --message "帖子正文"
```

论坛父频道不接受 Discord 组件。如果需要组件，请发送到帖子本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持在智能体消息中使用 Discord components v2 容器。请通过消息工具传入 `components` 载荷。交互结果会作为普通入站消息路由回智能体，并遵循现有的 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件只能使用一次。设置 `components.reusable=true` 可允许按钮、选择菜单和表单在过期前多次使用。

要限制谁可以点击按钮，请在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。不匹配的用户会收到一条仅自己可见的拒绝消息。

默认情况下，组件回调在 30 分钟后过期。设置 `channels.discord.agentComponents.ttlMs` 可更改默认账户的回调注册表生存期，也可以通过 `channels.discord.accounts.<accountId>.agentComponents.ttlMs` 为每个账户分别设置。该值以毫秒为单位，必须是正整数，上限为 `86400000`（24 小时）。较长的 TTL 适合需要按钮长时间保持可用的审核/审批工作流，但也会延长旧 Discord 消息仍可触发操作的时间窗口。应优先使用满足需求的最短 TTL；如果陈旧回调会造成意外，请保留默认值。

`/model` 和 `/models` 斜杠命令会打开交互式模型选择器，其中包含提供商、模型和兼容运行时下拉菜单，以及一个 Submit 步骤。`/models add` 已弃用，它会返回弃用消息，而不是通过聊天注册模型。选择器回复仅调用者可见，也只能由调用者使用。Discord 选择菜单最多支持 25 个选项，因此，如果希望选择器仅针对 `openai` 或 `vllm` 等选定提供商显示动态发现的模型，请将 `provider/*` 条目添加到 `agents.defaults.models`。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；多个文件请使用 `media-gallery`
- 如果上传名称应与附件引用一致，请使用 `filename` 覆盖上传名称

模态表单：

- 添加 `components.modal`，最多可包含 5 个字段
- 字段类型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 会自动添加触发按钮

示例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "可选的后备文本",
  components: {
    reusable: true,
    text: "选择路径",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "批准",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "拒绝", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "选择一个选项",
          options: [
            { label: "选项 A", value: "a" },
            { label: "选项 B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "详细信息",
      triggerLabel: "打开表单",
      fields: [
        { type: "text", label: "请求者" },
        {
          type: "select",
          label: "优先级",
          options: [
            { label: "低", value: "low" },
            { label: "高", value: "high" },
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
    `channels.discord.dmPolicy` 控制私信访问。`channels.discord.allowFrom` 是规范的私信允许列表。

    - `pairing`（默认）
    - `allowlist`（至少需要一个 `allowFrom` 发送者）
    - `open`（要求 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果私信策略不是开放模式，未知用户会被阻止（或在 `pairing` 模式下收到配对提示）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 对于单个账户，`allowFrom` 的优先级高于旧版 `dm.allowFrom`。
    - 如果命名账户自身未设置 `allowFrom` 和旧版 `dm.allowFrom`，则会继承 `channels.discord.allowFrom`。
    - 命名账户不会继承 `channels.discord.accounts.default.allowFrom`。

    为保持兼容性，系统仍会读取旧版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom`。如果能够在不改变访问权限的情况下完成迁移，`openclaw doctor --fix` 会将它们迁移到 `dmPolicy` 和 `allowFrom`。

    用于投递的私信目标格式：

    - `user:<id>`
    - `<@id>` 提及

    当渠道默认值处于启用状态时，纯数字 ID 通常会解析为渠道 ID，但为保持兼容性，账户有效私信 `allowFrom` 中列出的 ID 会被视为用户私信目标。

  </Tab>

  <Tab title="访问组">
    Discord 私信和文本命令授权可以使用 `channels.discord.allowFrom` 中的动态 `accessGroup:<name>` 条目。

    访问组名称在各消息渠道间共享。对于成员以各渠道常规 `allowFrom` 语法表示的静态组，请使用 `type: "message.senders"`；如果应由 Discord 频道当前具有 `ViewChannel` 权限的受众动态定义成员资格，请使用 `type: "discord.channelAudience"`。共享访问组行为：[访问组](/zh-CN/channels/access-groups)。

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

    Discord 文本频道没有单独的成员列表。`type: "discord.channelAudience"` 对成员资格的建模方式为：私信发送者是所配置服务器的成员，并且在应用角色和频道权限覆盖后，当前对所配置频道具有有效的 `ViewChannel` 权限。

    示例：允许任何可以看到 `#maintainers` 的人向机器人发送私信，同时拒绝其他所有人的私信。

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

    你可以混用动态和静态条目：

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

    查找采用失败即拒绝策略。如果 Discord 返回 `Missing Access`、成员查找失败，或频道属于其他服务器，则该私信发送者会被视为未授权。

    使用频道受众访问组时，请在 Discord Developer Portal 中启用 **Server Members Intent**。私信不包含服务器成员状态，因此 OpenClaw 会在授权时通过 Discord REST 解析成员。

  </Tab>

  <Tab title="服务器策略">
    服务器处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当存在 `channels.discord` 时，安全基线是 `allowlist`。

    `allowlist` 行为：

    - 服务器必须匹配 `channels.discord.guilds`（优先使用 `id`，也接受 slug）
    - 可选的发送者允许列表：`users`（建议使用稳定 ID）和 `roles`（仅角色 ID）；如果配置了其中任意一项，当发送者匹配 `users` 或 `roles` 时即允许访问
    - 默认禁用直接名称/标签匹配；仅应将 `channels.discord.dangerouslyAllowNameMatching: true` 作为紧急兼容模式启用
    - `users` 支持名称/标签，但 ID 更安全；使用名称/标签条目时，`openclaw security audit` 会发出警告
    - 如果服务器配置了 `channels`，未列出的频道将被拒绝
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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    `openclaw doctor --fix` 会将旧版的每频道 `allow` 键迁移到 `enabled`。

    如果你只设置 `DISCORD_BOT_TOKEN` 而未创建 `channels.discord` 块，运行时后备值为 `groupPolicy="allowlist"`（日志中会显示警告），即使 `channels.defaults.groupPolicy` 为 `open` 也是如此。

  </Tab>

  <Tab title="提及和群组私信">
    默认情况下，服务器消息需要提及机器人。

    提及检测包括：

    - 显式提及机器人
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，后备为 `messages.groupChat.mentionPatterns`）
    - 在受支持情况下隐式回复机器人的行为

    编写出站 Discord 消息时，请使用规范的提及语法：用户使用 `<@USER_ID>`，频道使用 `<#CHANNEL_ID>`，角色使用 `<@&ROLE_ID>`。不要使用旧版的 `<@!USER_ID>` 昵称提及格式。

    `requireMention` 按服务器/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选择丢弃提及其他用户/角色但未提及机器人的消息（不包括 @everyone/@here）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可通过 `dm.groupChannels` 使用可选允许列表（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的智能体路由

使用 `bindings[].match.roles` 可按角色 ID 将 Discord 服务器成员路由到不同的智能体。基于角色的绑定仅接受角色 ID，并在对等方或父级对等方绑定之后、仅服务器绑定之前进行求值。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有已配置字段都必须匹配。

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

- `commands.native` 默认为 `"auto"`，且对 Discord 启用。
- 按渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会在启动期间跳过 Discord 斜杠命令的注册和清理。此前注册的命令可能仍会显示在 Discord 中，直到你从 Discord 应用中将其移除。
- 原生命令身份验证使用与普通消息处理相同的 Discord 允许列表/策略。
- 未授权用户可能仍会在 Discord UI 中看到命令；执行时会实施 OpenClaw 身份验证，并回复“未获授权”。
- 默认斜杠命令设置：`ephemeral: true`（`channels.discord.slashCommand.ephemeral`）。

有关命令目录和行为，请参阅[斜杠命令](/zh-CN/tools/slash-commands)。

## 功能详情

<AccordionGroup>
  <Accordion title="回复标签和原生回复">
    Discord 支持在智能体输出中使用回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）：不使用隐式回复线程；仍会遵循显式 `[[reply_to_*]]` 标签
    - `first`：将隐式原生回复引用附加到本轮第一条出站 Discord 消息
    - `all`：将其附加到每条出站消息
    - `batched`：仅当入站事件是由多条消息经过防抖后形成的批次时才附加——适用于你希望主要在含义不明确的突发聊天中使用原生回复，而不是在每个单消息轮次中都使用的情况

    消息 ID 会显示在上下文/历史记录中，以便智能体指定特定消息。

  </Accordion>

  <Accordion title="链接预览">
    默认情况下，Discord 会为 URL 生成丰富链接嵌入。默认情况下，OpenClaw 会抑制出站 Discord 消息中生成的这些嵌入，因此智能体发送的 URL 会保持为普通链接，除非你选择启用：

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    设置 `channels.discord.accounts.<id>.suppressEmbeds` 可覆盖单个账户的配置。智能体通过消息工具发送消息时，也可以为单条消息传入 `suppressEmbeds: false`。显式 Discord `embeds` 载荷不会受到默认链接预览设置的抑制。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送临时消息，并随着文本到达持续编辑该消息来流式传输回复草稿。`channels.discord.streaming.mode` 可取 `off` | `partial` | `block` | `progress`（未设置 `streaming`/旧版 `streamMode` 键时默认为此项）。`streamMode` 是旧版别名；运行 `openclaw doctor --fix` 可将持久化配置重写为规范的嵌套 `streaming` 结构。

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

    - `off` 禁用 Discord 预览编辑。
    - `partial` 随着 token 到达编辑一条预览消息。
    - `block` 发出草稿大小的分块；通过 `streaming.preview.chunk`（`minChars`、`maxChars`、`breakPreference`）调整大小和断点，并将其限制在 `textChunkLimit` 范围内。显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。
    - `progress` 保留一条可编辑的状态草稿，并用工具进度对其进行更新，直至最终交付。原始工具进度使用共享的初始标签作为滚动行；叙述式状态仅显示叙述内容，除非显式配置了标签。
    - 媒体、错误和显式回复的最终消息会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认为 `true`）控制工具/进度更新是否复用预览消息。
    - 如果信息可用，工具/进度行会以紧凑的表情符号 + 标题 + 详情格式呈现，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.progress.commentary`（默认为 `false`）选择在临时进度草稿中包含助手的评论/前导文本。评论在显示前会经过清理，保持临时状态，并且不会改变最终答案的交付。
    - `streaming.progress.maxLineChars` 控制每行进度预览的字符预算。普通文本会在词语边界处缩短；命令和路径详情会保留有用的后缀。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制紧凑进度行中的命令/执行详情：`raw`（默认）或 `status`（仅显示工具标签）。

    隐藏原始命令/执行文本，同时保留紧凑进度行：

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

    预览流式传输仅支持文本；媒体回复会回退到正常交付。

  </Accordion>

  <Accordion title="历史记录、上下文和线程行为">
    服务器历史记录上下文：

    - `channels.discord.historyLimit` 默认为 `20`
    - 回退项：`messages.groupChat.historyLimit`
    - `0` 表示禁用

    私信历史记录控制项：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程按渠道会话进行路由，并继承父渠道配置，除非被覆盖。
    - 线程会话继承父渠道会话级别的 `/model` 选择，仅作为模型回退项；线程本地的 `/model` 选择优先，并且除非启用对话记录继承，否则不会复制父级对话记录历史。
    - `channels.discord.thread.inheritParent`（默认为 `false`）允许新的自动线程使用父级对话记录进行初始化。按账户覆盖：`channels.discord.accounts.<id>.thread.inheritParent`。
    - 消息工具表情回应可以解析 `user:<id>` 私信目标。
    - 在回复阶段激活回退期间，会保留 `guilds.<guild>.channels.<channel>.requireMention: false`。

    渠道主题会作为**不受信任的**上下文注入。允许列表用于限制谁能触发智能体，而不是完整的补充上下文脱敏边界。

  </Accordion>

  <Accordion title="子智能体的线程绑定会话">
    Discord 可以将线程绑定到会话目标，使该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子智能体/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 查看/更新聚焦绑定因不活动而自动取消聚焦的设置
    - `/session max-age <duration|off>` 查看/更新聚焦绑定的硬性最大时限

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

    - `session.threadBindings.*` 设置全局默认值；`channels.discord.threadBindings.*` 会覆盖 Discord 行为。
    - `spawnSessions` 控制是否为 `sessions_spawn({ thread: true })` 和 ACP 线程生成自动创建/绑定线程。默认值：`true`。
    - `defaultSpawnContext` 控制线程绑定生成的原生子智能体上下文。默认值：`"fork"`。
    - 已弃用的 `spawnSubagentSessions`/`spawnAcpSessions` 键由 `openclaw doctor --fix` 迁移。
    - 如果某个账户禁用了线程绑定，则 `/focus` 及相关线程绑定操作不可用。

    请参阅[子智能体](/zh-CN/tools/subagents)、[ACP 智能体](/zh-CN/tools/acp-agents)和[配置参考](/zh-CN/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久 ACP 渠道绑定">
    对于稳定的“始终在线”ACP 工作区，请配置顶层类型化 ACP 绑定，将其指向 Discord 对话。

    配置路径：`bindings[]`，其中 `type: "acp"` 且 `match.channel: "discord"`。

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

    - `/acp spawn codex --bind here` 会原地绑定当前渠道或线程，并使后续消息继续使用同一 ACP 会话。线程消息会继承父渠道绑定。
    - 在已绑定的渠道或线程中，`/new` 和 `/reset` 会原地重置同一 ACP 会话。临时线程绑定在生效期间可以覆盖目标解析。
    - `spawnSessions` 通过 `--thread auto|here` 控制子线程的创建/绑定。

    有关绑定行为的详细信息，请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

  </Accordion>

  <Accordion title="表情回应通知">
    每个服务器的表情回应通知模式（`guilds.<id>.reactionNotifications`）：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    表情回应事件会转换为系统事件，并附加到路由后的 Discord 会话。

  </Accordion>

  <Accordion title="确认表情回应">
    OpenClaw 处理入站消息时，`ackReaction` 会发送确认表情符号。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - 回退到智能体身份表情符号（`agents.list[].identity.emoji`，否则为 "👀"）

    注意：

    - Discord 接受 Unicode 表情符号或自定义表情符号名称。
    - 使用 `""` 可为某个渠道或账户禁用此表情回应。

    **作用域（`messages.ackReactionScope`）：**

    值：`"all"`（私信 + 群组，包括环境房间事件）、`"direct"`（仅私信）、`"group-all"`（除环境房间事件外的所有群组消息，不包括私信）、`"group-mentions"`（群组中提及机器人时；**不包括私信**，默认值）、`"off"` / `"none"`（禁用）。

    <Note>
    默认作用域（`"group-mentions"`）不会在私信或环境房间事件中触发确认表情回应。要对入站 Discord 私信和静默房间事件发送确认表情回应，请将 `messages.ackReactionScope` 设置为 `"all"`。
    </Note>

  </Accordion>

  <Accordion title="配置写入">
    默认启用由渠道发起的配置写入。这会影响 `/config set|unset` 流程（启用命令功能时）。

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
    使用 `channels.discord.proxy` 通过 HTTP(S) 代理路由 Discord Gateway 网关 WebSocket 流量和启动时的 REST 查询（应用程序 ID + 允许列表解析）。
    Discord Gateway 网关 WebSocket 代理必须显式配置；WebSocket 连接不会继承 Gateway 网关进程的环境代理环境变量。配置 `channels.discord.proxy` 后，启动时的 REST 查询会使用此代理。

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
    启用 PluralKit 解析，将代理消息映射到系统成员身份：

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

    注意事项：

    - 允许列表可以使用 `pk:<memberId>`
    - 仅当 `channels.discord.dangerouslyAllowNameMatching: true` 时，才会按名称/slug 匹配成员显示名称
    - 查询使用原始消息 ID 调用 PluralKit API
    - 如果查询失败，代理消息将被视为机器人消息并丢弃，除非 `allowBots` 允许其通过

  </Accordion>

  <Accordion title="出站提及别名">
    当智能体需要确定性地在出站消息中提及已知 Discord 用户时，请使用 `mentionAliases`。键是不带前导 `@` 的句柄；值是 Discord 用户 ID。未知句柄、`@everyone`、`@here` 以及 Markdown 代码跨度内的提及会保持不变。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    设置状态或活动字段，或者启用自动在线状态时，将应用在线状态更新。

    仅设置状态：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活动（设置 `activity` 时，自定义状态是默认活动类型）：

```json5
{
  channels: {
    discord: {
      activity: "专注时间",
      activityType: 4,
    },
  },
}
```

    直播：

```json5
{
  channels: {
    discord: {
      activity: "实时编程",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活动类型映射：

    - 0：正在玩
    - 1：直播（需要 `activityUrl`；而 `activityUrl` 又要求 `activityType: 1`）
    - 2：正在听
    - 3：正在观看
    - 4：自定义（将活动文本用作状态内容；表情符号可选）
    - 5：正在竞赛

    自动在线状态（运行时健康信号）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "令牌已耗尽",
      },
    },
  },
}
```

    自动在线状态将运行时可用性映射到 Discord 状态：健康 => 在线，降级或未知 => 空闲，已耗尽或不可用 => 请勿打扰。默认值：`intervalMs` 为 30000，`minUpdateIntervalMs` 为 15000（必须小于或等于 `intervalMs`）。可选文本覆盖项：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的审批">
    Discord 支持在私信中通过按钮处理审批，也可以选择在发起请求的渠道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`（可选；在可能的情况下回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认值：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"`，并且至少可以解析出一位审批者时，Discord 会自动启用原生 Exec 审批；审批者可以来自 `execApprovals.approvers`，也可以来自 `commands.ownerAllowFrom`。Discord 不会根据渠道 `allowFrom`、旧版 `dm.allowFrom` 或私信 `defaultTo` 推断 Exec 审批者。设置 `enabled: false` 可明确禁止 Discord 充当原生审批客户端。

    对于 `/diagnostics` 和 `/export-trajectory` 等敏感的仅所有者可用群组命令，OpenClaw 会私下发送审批提示和最终结果。当发起调用的所有者存在 Discord 所有者路由时，它会先尝试发送 Discord 私信；否则会回退到 `commands.ownerAllowFrom` 中第一个可用的所有者路由，例如 Telegram。

    当 `target` 为 `channel` 或 `both` 时，审批提示在渠道中可见。只有已解析的审批者可以使用按钮；其他用户会收到仅自己可见的拒绝消息。审批提示包含命令文本，因此仅应在可信渠道中启用渠道投递。如果无法从会话键推导出渠道 ID，OpenClaw 会回退到私信投递。

    Discord 会呈现其他聊天渠道共用的审批按钮；原生 Discord 适配器主要增加了审批者私信路由和渠道扇出功能。当这些按钮存在时，它们是主要的审批交互方式；仅当工具结果表明聊天审批不可用或手动审批是唯一途径时，OpenClaw 才应包含手动 `/approve` 命令。如果 Discord 原生审批运行时未激活，OpenClaw 会保持显示本地确定性的 `/approve <id> <decision>` 提示。如果运行时已激活，但无法将原生卡片投递到任何目标，OpenClaw 会在同一聊天中发送回退通知，其中包含待处理审批提供的确切 `/approve` 命令。

    Gateway 网关身份验证和审批解析遵循共享的 Gateway 网关客户端契约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve` 解析）。默认情况下，审批会在 30 分钟后过期。

    请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作涵盖消息传递、渠道管理、审核、在线状态和元数据。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 表情回应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径），用于设置定时事件的封面图片。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                                   | 默认状态 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 已启用   |
| roles                                                                                                                                                                    | 已禁用   |
| moderation                                                                                                                                                               | 已禁用   |
| presence                                                                                                                                                                 | 已禁用   |

## Components v2 UI

OpenClaw 使用 Discord components v2 实现 Exec 审批和跨上下文标记。Discord 消息操作也可以接受 `components` 来实现自定义 UI（高级用法；需要通过 Discord 工具构建组件载荷）；旧版 `embeds` 仍然可用，但不推荐使用。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。按账户设置：`channels.discord.accounts.<id>.ui.components.accentColor`。
- `channels.discord.agentComponents.ttlMs` 控制已发送的 Discord 组件回调保持注册的时长（默认值 `1800000`，最大值 `86400000`）。按账户设置：`channels.discord.accounts.<id>.agentComponents.ttlMs`。
- 存在 components v2 时，`embeds` 会被忽略。
- 默认禁止纯 URL 预览。当单个出站链接需要展开时，请在消息操作上设置 `suppressEmbeds: false`。

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

Discord 有两种不同的语音界面：实时**语音频道**（连续对话）和**语音消息附件**（波形预览格式）。Gateway 网关同时支持这两者。

### 语音频道

设置检查清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户允许列表时，启用 Server Members Intent。
3. 使用 `bot` 和 `applications.commands` 权限范围邀请机器人。
4. 在目标语音频道中授予 Connect、Speak、Send Messages 和 Read Message History 权限。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账户的默认智能体，并遵循与其他 Discord 命令相同的允许列表和群组策略规则。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

要在加入前检查机器人的有效权限：

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

注意事项：

- 对于仅文本配置，Discord 语音是可选启用的；设置 `channels.discord.voice.enabled=true`（或保留现有的 `channels.discord.voice` 块）即可启用 `/vc` 命令、语音运行时以及 `GuildVoiceStates` Gateway 网关 intent。`channels.discord.intents.voiceStates` 可显式覆盖 intent 订阅；若不设置，则遵循实际生效的语音启用状态。
- `voice.mode` 控制对话路径。默认值为 `agent-proxy`：实时语音前端负责轮次时序、中断和播放，通过 `openclaw_agent_consult` 将实质性工作委派给路由到的 OpenClaw 智能体，并将结果视为该说话者在 Discord 中键入的提示。`stt-tts` 保留较早的批处理 STT 加 TTS 流程。`bidi` 允许实时模型直接对话，同时公开 `openclaw_agent_consult` 以调用 OpenClaw 大脑。
- `voice.agentSession` 控制哪个 OpenClaw 对话接收语音轮次。若不设置，则使用语音频道自身的会话；也可以设置 `{ mode: "target", target: "channel:<text-channel-id>" }`，让语音频道充当现有 Discord 文本频道会话（例如 `#maintainers`）的麦克风/扬声器扩展。
- `voice.model` 会覆盖用于 Discord 语音回复和实时咨询的 OpenClaw 智能体大脑。若不设置，则继承路由到的智能体模型。它与 `voice.realtime.model` 相互独立。
- `voice.followUsers` 允许机器人跟随选定用户加入、切换和离开 Discord 语音。请参阅[在语音中跟随用户](#follow-users-in-voice)。
- `agent-proxy` 通过 `discord-voice` 路由语音，这会为说话者和目标会话保留正常的所有者/工具授权，但会隐藏智能体的 `tts` 工具，因为播放由 Discord 语音负责。默认情况下，`agent-proxy` 会为所有者说话者的咨询授予与所有者等效的完整工具访问权限（`voice.realtime.toolPolicy: "owner"`），并强烈倾向于在给出实质性回答前咨询 OpenClaw 智能体（`voice.realtime.consultPolicy: "always"`）。在默认的 `always` 模式下，实时层不会在咨询答案之前自动朗读填充内容；它会捕获并转录语音，然后朗读路由到的 OpenClaw 答案。如果 Discord 仍在播放第一个答案时有多个强制咨询答案完成，则后续要求原样朗读的答案会排队等待播放空闲，而不会在句子中途替换语音。
- 在 `stt-tts` 模式下，STT 使用 `tools.media.audio`；`voice.model` 不影响转录。
- 在实时模式下，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.speakerVoice` 用于配置实时音频会话。若要使用 OpenAI Realtime 2.1 加 Codex 大脑，请设置 `voice.realtime.model: "gpt-realtime-2.1"` 和 `voice.model: "openai/gpt-5.6-sol"`。
- 默认情况下，实时语音模式会在实时提供商指令中包含较小的 `IDENTITY.md`、`USER.md` 和 `SOUL.md` 配置文件，使快速直接轮次与路由到的 OpenClaw 智能体保持相同的身份、用户背景和角色设定。将 `voice.realtime.bootstrapContextFiles` 设置为其中一部分可进行自定义，或设置为 `[]` 以禁用。仅支持这些配置文件；`AGENTS.md` 仍保留在正常的智能体上下文中。注入的配置文件上下文不能替代 `openclaw_agent_consult` 来处理工作区工作、当前事实、记忆查找或由工具支持的操作。
- 在 OpenAI `agent-proxy` 实时模式下，设置 `voice.realtime.requireWakeName: true` 可让 Discord 实时语音保持静默，直到转录文本以唤醒名称开头或结尾。配置的唤醒名称必须由一个或两个单词组成。如果未设置 `voice.realtime.wakeNames`，OpenClaw 会使用路由到的智能体 `name` 加 `OpenClaw`，若不可用则回退到智能体 ID 加 `OpenClaw`。唤醒名称门控会禁用实时提供商的自动回复，将接受的轮次通过 OpenClaw 智能体咨询路径路由，并且当最终转录到达前从部分转录中识别出开头的唤醒名称时，给出简短的语音确认。
- OpenAI 实时提供商接受当前 Realtime 2 事件名称以及用于输出音频和转录事件的旧版 Codex 兼容别名，因此兼容的提供商快照即使发生变化，也不会丢失助手音频。
- `voice.realtime.bargeIn` 控制 Discord 说话者开始事件是否会中断正在进行的实时播放。若未设置，则遵循实时提供商的输入音频中断设置。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 实时插话截断音频前所需的最短助手播放时长。默认值：`250`。在低回声房间中可设置为 `0` 以立即中断，也可以在回声严重的扬声器环境中调高此值。
- `voice.tts` 仅覆盖 `stt-tts` 语音播放所使用的 `messages.tts`；实时模式改用 `voice.realtime.speakerVoice`。若要在 Discord 播放中使用 OpenAI 语音，请设置 `voice.tts.provider: "openai"`，并在 `voice.tts.providers.openai.speakerVoice` 下选择一种文本转语音音色。在当前 OpenAI TTS 模型中，`cedar` 是一个听感较为男性化的不错选择。
- 每频道的 Discord `systemPrompt` 覆盖会应用于该语音频道的语音转录轮次。
- 对于受所有者限制的命令和频道操作，语音转录轮次根据 Discord `allowFrom`（或 `dm.allowFrom`）推导所有者状态。智能体工具的可见性遵循路由会话所配置的工具策略。
- 如果 `voice.autoJoin` 对同一服务器包含多个条目，OpenClaw 会加入为该服务器最后配置的频道。
- `voice.allowedChannels` 是可选的驻留允许列表。若不设置，则允许 `/vc join` 加入任何已获授权的 Discord 语音频道。设置后，`/vc join`、启动时自动加入以及机器人语音状态移动都会被限制在列出的 `{ guildId, channelId }` 条目内。将其设置为空数组会拒绝加入所有 Discord 语音频道。如果 Discord 将机器人移到允许列表之外，OpenClaw 会离开该频道，并在存在已配置的自动加入目标时重新加入该目标。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 会透传给 `@discordjs/voice` 加入选项；上游默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 使用内置的 `libopus-wasm` 编解码器接收 Discord 语音并实时播放原始 PCM。它附带固定版本的 libopus WebAssembly 构建，不需要原生 opus 插件。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试最初等待 `@discordjs/voice` Ready 的时长。默认值：`30000`。
- `voice.reconnectGraceMs` 控制 OpenClaw 等待已断开的语音会话开始重新连接的时长，超过此时间后会销毁该会话。默认值：`15000`。
- 在 `stt-tts` 模式下，语音播放不会仅因为另一位用户开始说话而停止。为避免反馈循环，OpenClaw 会在 TTS 播放期间忽略新的语音捕获；请在播放完成后说出下一轮内容。实时模式会将说话者开始事件作为插话信号转发给实时提供商。
- 在实时模式下，扬声器通过开启的麦克风产生的回声可能会被视为插话并中断播放。对于回声严重的 Discord 房间，设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` 可防止 OpenAI 因输入音频而自动中断。如果仍希望 Discord 说话者开始事件中断正在进行的播放，请添加 `voice.realtime.bargeIn: true`。OpenAI 实时桥接会将短于 `voice.realtime.minBargeInAudioEndMs` 的播放截断视为可能的回声/噪声并忽略，将其记录为已跳过，而不会清除 Discord 播放。
- `voice.captureSilenceGraceMs` 控制 Discord 报告说话者已停止后，OpenClaw 等待多长时间再最终确定该音频片段并进行 STT。默认值：`2000`；如果 Discord 将正常停顿拆分成断断续续的部分转录，请调高此值。
- 当 ElevenLabs 是选定的 TTS 提供商时，Discord 语音播放使用流式 TTS，并从提供商响应流开始播放。不支持流式传输的提供商会回退到合成临时文件路径。
- OpenClaw 会监控接收解密失败，并在短时间窗口内重复失败后通过离开并重新加入语音频道来自动恢复。
- 如果更新后接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖项报告和日志。内置的 `@discordjs/voice` 版本包含来自 discord.js PR #11449 的上游填充修复，该修复关闭了 discord.js issue #11419。
- 当 OpenClaw 最终确定已捕获的说话者片段时，出现 `The operation was aborted` 接收事件属于预期行为；它们是详细诊断信息，而不是警告。
- 详细的 Discord 语音日志会为每个接受的说话者片段包含一个长度受限的单行 STT 转录预览，因此调试时既能看到用户侧，也能看到智能体回复侧，而不会输出长度不受限的转录文本。
- 在 `agent-proxy` 模式下，强制咨询回退会跳过可能不完整的转录片段，例如以 `...` 结尾的文本、以 "and" 等连接词结尾的文本，以及 "be right back" 或 "bye" 等明显不可操作的结束语。当此机制阻止过时答案进入队列时，日志会显示 `forced agent consult skipped reason=...`。

### 在语音中跟随用户

如果希望 Discord 语音机器人跟随一个或多个已知 Discord 用户，而不是在启动时加入固定频道或等待 `/vc join`，请使用 `voice.followUsers`。

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

- `followUsers` 接受原始 Discord 用户 ID 和 `discord:<id>` 值。OpenClaw 会先规范化这两种形式，再与语音状态事件进行匹配。
- 配置 `followUsers` 后，`followUsersEnabled` 默认为 `true`。将其设置为 `false` 可保留已保存的列表，但停止自动语音跟随。
- 当被跟随的用户加入允许的语音频道时，OpenClaw 会加入该频道。当该用户移动时，OpenClaw 会跟随移动。当当前活跃的被跟随用户断开连接时，OpenClaw 会离开。
- 如果同一服务器中有多个被跟随用户，而当前活跃的被跟随用户离开，OpenClaw 会先移动到另一位已跟踪的被跟随用户所在频道，再考虑离开该服务器。如果多位被跟随用户同时移动，以最后观察到的语音状态事件为准。
- `allowedChannels` 仍然适用。位于禁止频道中的被跟随用户会被忽略，由跟随机制拥有的会话会移动到另一位被跟随用户所在频道或离开。
- OpenClaw 会在启动时以及按受限间隔协调遗漏的语音状态事件。协调过程会对已配置的服务器进行采样，并限制每次运行的 REST 查询次数，因此非常大的 `followUsers` 列表可能需要多个间隔才能收敛。
- 如果 Discord 或管理员在机器人跟随用户期间移动机器人，OpenClaw 会重建语音会话，并在目标频道获允许时保留跟随所有权。如果机器人被移到 `allowedChannels` 之外，OpenClaw 会离开，并在存在已配置目标时重新加入该目标。
- DAVE 接收恢复可能会在重复解密失败后离开并重新加入同一频道。由跟随机制拥有的会话会在该恢复路径中保留跟随所有权，因此之后被跟随用户断开连接时，机器人仍会离开频道。

选择加入模式：

- 对于个人或操作员设置，如果机器人应在你使用语音时自动进入语音频道，请使用 `followUsers`。
- 对于即使没有已跟踪用户使用语音也应保持在线的固定房间机器人，请使用 `autoJoin`。
- 对于一次性加入，或自动出现语音机器人会令人意外的房间，请使用 `/vc join`。

Discord 语音编解码器：

- 语音接收日志会显示 `discord voice: opus decoder: libopus-wasm`。
- 实时播放会先使用同一内置 `libopus-wasm` 软件包将原始 48 kHz 立体声 PCM 编码为 Opus，再将数据包交给 `@discordjs/voice`。
- 文件和提供商流播放会使用 ffmpeg 转码为原始 48 kHz 立体声 PCM，然后使用 `libopus-wasm` 生成发送到 Discord 的 Opus 数据包流。

STT 加 TTS 流水线：

- Discord PCM 捕获内容会转换为 WAV 临时文件。
- `tools.media.audio` 负责 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转写文本会通过 Discord 入口和路由发送，同时响应 LLM 按语音输出策略运行：该策略会隐藏智能体的 `tts` 工具并要求返回文本，因为最终 TTS 播放由 Discord 语音负责。
- 设置 `voice.model` 后，它仅覆盖此语音渠道轮次所用的响应 LLM。
- `voice.tts` 会覆盖合并到 `messages.tts`；支持流式传输的提供商会直接向播放器提供数据，否则会在已加入的渠道中播放生成的音频文件。

默认智能体代理语音渠道会话示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

如果没有 `voice.agentSession` 块，每个语音渠道都会获得各自经过路由的 OpenClaw 会话。例如，`/vc join channel:234567890123456789` 会与该 Discord 语音渠道对应的会话交互。实时模型只是语音前端；实质性请求会交给配置的 OpenClaw 智能体。如果实时模型在未调用咨询工具的情况下生成最终转写文本，OpenClaw 会强制执行咨询作为回退，以确保默认行为仍然像是在与智能体交谈。

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
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

将语音作为现有 Discord 渠道会话的扩展：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式下，机器人会加入配置的语音渠道，但 OpenClaw 智能体轮次会使用目标渠道正常路由的会话和智能体。实时语音会话会将返回结果朗读回语音渠道。监督智能体仍可根据其工具策略使用常规消息工具，包括在适当时另行发送一条 Discord 消息。

当委派的 OpenClaw 运行处于活动状态时，新的 Discord 语音转写文本会先作为实时运行控制处理，而不是立即启动另一个智能体轮次。“status”“cancel that”“use the smaller fix”或“when you're done also check tests”等短语会被分类为活动会话的状态、取消、Steering queue 或后续输入。状态、取消、已接受的 Steering queue 和后续结果会被朗读回语音渠道，让调用者知道 OpenClaw 是否已处理该请求。

可用的目标形式：

- `target: "channel:123456789012345678"` 通过 Discord 文本渠道会话进行路由。
- `target: "123456789012345678"` 会被视为渠道目标。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 通过相应私信会话进行路由。

回声较多时的 OpenAI Realtime 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

当模型通过开放的麦克风听到自己在 Discord 中的播放内容，但你仍希望通过说话打断它时，请使用此配置。OpenClaw 会阻止 OpenAI 因原始输入音频而自动中断，同时 `bargeIn: true` 允许 Discord 说话者开始事件和已处于活动状态的说话者音频在下一次捕获的轮次到达 OpenAI 之前取消活动的实时响应。`audioEndMs` 低于 `minBargeInAudioEndMs` 的过早插话信号会被视为可能的回声或噪声并被忽略，以免模型在第一个播放帧处就被截断。

预期的语音日志：

- 加入时：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 实时启动时：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 出现说话者音频时：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` 和 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 跳过过时语音时：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 实时响应完成时：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止或重置时：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 实时咨询时：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- 智能体回答时：`discord voice: agent turn answer ...`
- 精确语音进入队列时：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，随后是 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 检测到插话时：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，随后是 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 实时中断时：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，随后是 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回声或噪声时：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 禁用插话时：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 播放空闲时：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

若要调试音频被截断的问题，请按时间线阅读实时语音日志：

1. `realtime audio playback started` 表示 Discord 已开始播放助手音频。从此时起，桥接器开始统计助手输出分块、Discord PCM 字节数、提供商实时字节数以及合成音频时长。
2. `realtime speaker turn opened` 标志着一名 Discord 说话者变为活动状态。如果播放已处于活动状态且启用了 `bargeIn`，之后可能会出现 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 标志着收到该说话者轮次的第一个实际音频帧。此处出现 `outputActive=true` 或非零 `outputAudioMs`，表示助手播放仍处于活动状态时，麦克风正在发送输入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在助手播放处于活动状态时检测到了实时说话者音频。这有助于区分真正的中断与没有有效音频的 Discord 说话者开始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 已请求实时提供商取消或截断活动响应。它包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，因此你可以了解中断前实际播放了多少助手音频。
6. `realtime audio playback stopped reason=...` 是本地 Discord 播放的重置点。原因会指明是谁停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 汇总捕获到的输入轮次。`chunks=0` 或 `hasAudio=false` 表示说话者轮次已开始，但没有可用音频到达实时桥接器。`interruptedPlayback=true` 表示该输入轮次与助手输出重叠，并触发了插话逻辑。

可用字段：

- `outputAudioMs`：在该日志行之前，由实时提供商生成的助手音频时长。
- `audioMs`：播放停止前 OpenClaw 统计的助手音频时长。
- `elapsedMs`：打开和关闭播放流或说话者轮次之间的实际时间。
- `discordBytes`：发送到 Discord 语音或从中接收的 48 kHz 立体声 PCM 字节数。
- `realtimeBytes`：发送到实时提供商或从中接收的提供商格式 PCM 字节数。
- `playbackChunks`：为活动响应转发到 Discord 的助手音频分块数。
- `sinceLastAudioMs`：最后一个捕获到的说话者音频帧与说话者轮次关闭之间的间隔。

常见模式：

- 如果立即截断时出现 `source=active-speaker-audio`、较小的 `outputAudioMs`，并且同一用户就在附近，通常表示扬声器回声进入了麦克风。请提高 `voice.realtime.minBargeInAudioEndMs`、降低扬声器音量、使用耳机，或设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 后出现 `speaker turn closed ... hasAudio=false`，表示 Discord 报告说话者开始说话，但没有音频到达 OpenClaw。这可能是暂时性的 Discord 语音事件、噪声门行为，或客户端短暂启用麦克风。
- 如果出现 `audio playback stopped reason=stream-close`，附近却没有插话或 `provider-clear-audio`，则表示本地 Discord 播放流意外结束。请检查之前的提供商日志和 Discord 播放器日志。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在助手音频处于活动状态时有意丢弃了输入。如果你希望语音能够中断播放，请启用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或提供商 VAD 报告了语音，但 OpenClaw 没有可中断的活动播放。这不应导致音频被截断。

凭据会按组件分别解析：`voice.model` 使用 LLM 路由身份验证，`tools.media.audio` 使用 STT 身份验证，`messages.tts`/`voice.tts` 使用 TTS 身份验证，`voice.realtime.providers` 或提供商的常规身份验证配置使用实时提供商身份验证。

### 语音消息

Discord 语音消息会显示波形预览，并且要求使用 OGG/Opus 音频。OpenClaw 会自动生成波形，但需要 Gateway 网关主机上安装 `ffmpeg` 和 `ffprobe` 以便检查和转换。

- 提供一个**本地文件路径**（不接受 URL）。
- 省略文本内容（Discord 不接受在同一个负载中同时包含文本和语音消息）。
- 接受任何音频格式；OpenClaw 会根据需要转换为 OGG/Opus。

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排查

<AccordionGroup>
  <Accordion title="使用了不允许的意图，或机器人看不到服务器消息">

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时，启用 Server Members Intent
    - 更改 intents 后重启 Gateway 网关

  </Accordion>

  <Accordion title="公会消息意外被阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的公会允许列表
    - 如果存在公会 `channels` 映射，则仅允许列出的频道
    - 验证 `requireMention` 行为和提及模式

    实用检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention 为 false，但仍被阻止">
    常见原因：

    - `groupPolicy="allowlist"`，但没有匹配的公会/频道允许列表
    - `requireMention` 配置位置错误（必须位于 `channels.discord.guilds` 或频道条目下）
    - 发送者被公会/频道 `users` 允许列表阻止

  </Accordion>

  <Accordion title="Discord 轮次长时间运行或出现重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord Gateway 网关队列调节项：

    - 单账户：`channels.discord.eventQueue.listenerTimeout`
    - 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这仅控制 Discord Gateway 网关监听器的工作，而不控制智能体轮次的生命周期

    Discord 不会对已排队的智能体轮次应用渠道自身的超时。消息监听器会立即移交任务，而排队的 Discord 运行会保持各会话内的顺序，直到会话/工具/运行时生命周期完成或中止该任务。

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

  <Accordion title="Gateway 网关元数据查询超时警告">
    OpenClaw 在连接前会获取 Discord `/gateway/bot` 元数据。发生暂时性故障时，会回退到 Discord 的默认 Gateway 网关 URL，并对日志进行速率限制。

    元数据超时调节项：

    - 单账户：`channels.discord.gatewayInfoTimeoutMs`
    - 多账户：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未设置配置时的环境变量回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="Gateway 网关 READY 超时重启">
    OpenClaw 在启动期间以及运行时重新连接后，会等待 Discord Gateway 网关的 `READY` 事件。采用交错启动的多账户设置可能需要比默认值更长的启动 READY 等待窗口。

    READY 超时调节项：

    - 启动时单账户：`channels.discord.gatewayReadyTimeoutMs`
    - 启动时多账户：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 未设置配置时的启动环境变量回退：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 启动默认值：`15000`（15 秒），最大值：`120000`
    - 运行时单账户：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 运行时多账户：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 未设置配置时的运行时环境变量回退：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 运行时默认值：`30000`（30 秒），最大值：`120000`

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍可正常工作，但探测无法完整验证权限。

  </Accordion>

  <Accordion title="私信和配对问题">

    - 私信已禁用：`channels.discord.dm.enabled=false`
    - 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="Bot 之间的循环">
    默认情况下，会忽略由 Bot 发送的消息。

    如果设置 `channels.discord.allowBots=true`，请使用严格的提及和允许列表规则来避免循环行为。
    建议使用 `channels.discord.allowBots="mentions"`，仅接受提及该 Bot 的 Bot 消息。

    OpenClaw 还提供共享的 [Bot 循环防护](/zh-CN/channels/bot-loop-protection)。只要 `allowBots` 允许由 Bot 发送的消息进入分发流程，Discord 就会将入站事件映射为 `(account, channel, bot pair)` 事实；当该配对超过配置的事件预算后，通用配对防护机制会将其抑制。该防护机制可阻止失控的双 Bot 循环；过去只能依靠 Discord 的速率限制来停止这类循环。它不会影响单 Bot 部署，也不会影响保持在预算以内的一次性 Bot 回复。

    默认设置（设置 `allowBots` 后生效）：

    - `maxEventsPerWindow: 20` -- Bot 配对可在滑动窗口内交换 20 条消息
    - `windowSeconds: 60` -- 滑动窗口长度
    - `cooldownSeconds: 60` -- 一旦触发预算限制，任一方向上后续所有 Bot 间消息都会被丢弃一分钟

    在 `channels.defaults.botLoopProtection` 下统一配置共享默认值，然后在合法工作流需要更大余量时为 Discord 覆盖设置。优先级如下：

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
      // 可选的 Discord 全局覆盖。账户块会覆盖各个
      // 字段，并从此处继承省略的字段。
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // Alpha 仅在其他 Bot 提及它时才监听。
          allowBots: "mentions",
        },
        bravo: {
          // Bravo 监听 Discord 中由 Bot 发送的所有消息。
          allowBots: true,
          mentionAliases: {
            // 允许 Bravo 使用配置的用户 ID 编写对 Alpha 的 Discord 提及。
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // 每分钟最多允许五条消息，之后抑制该配对。
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

  <Accordion title="语音 STT 因 DecryptionFailed(...) 而中断">

    - 保持 OpenClaw 为最新版本（`openclaw update`），以确保包含 Discord 语音接收恢复逻辑
    - 确认 `channels.discord.voice.daveEncryption=true`（默认值）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在需要时调整
    - 监控日志中的以下内容：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后故障仍然持续，请收集日志，并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) 中的上游 DAVE 接收历史记录进行比较

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[Configuration reference - Discord](/zh-CN/gateway/config-channels#discord)。

<Accordion title="高价值 Discord 字段">

- 启动/身份验证：`enabled`、`token`、`applicationId`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dmPolicy`、`allowFrom`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`（全局）、`configWrites`、`slashCommand.ephemeral`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算，默认值为 `120000`）、`eventQueue.maxQueueSize`（默认值为 `10000`）、`eventQueue.maxConcurrency`（默认值为 `50`）
- Gateway 网关：`proxy`、`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回复/历史记录：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 传递：`textChunkLimit`（默认值为 `2000`）、`maxLinesPerMessage`（默认值为 `17`）
- 流式传输：`streaming.mode`、`streaming.chunkMode`、`streaming.preview.*`、`streaming.progress.*`、`streaming.block.*`（旧版扁平键 `streamMode`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`、`chunkMode` 会由 `openclaw doctor --fix` 迁移到 `streaming.*`）
- 媒体/重试：`mediaMaxMb`（限制 Discord 出站上传，默认值为 `100`）、`retry`
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`、`autoPresence.*`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents.enabled`、`agentComponents.ttlMs`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全与运维

- 将 Bot 令牌视为机密信息（在受监管环境中首选 `DISCORD_BOT_TOKEN`）。
- 授予最低权限的 Discord 权限。
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
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和安全加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将公会和频道映射到智能体。
  </Card>
  <Card title="斜杠命令" icon="terminal" href="/zh-CN/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>

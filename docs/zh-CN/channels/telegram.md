---
read_when:
    - 处理 Telegram 功能或网络钩子
summary: Telegram 机器人支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-04-28T23:40:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: aecd9edba56d0689a5823536a92171fa6e0c3ef56656f4699bb1e5793e248751
    source_path: channels/telegram.md
    workflow: 16
---

通过 grammY 可用于生产环境中的机器人私信和群组。长轮询是默认模式；webhook 模式是可选的。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    打开 Telegram 并与 **@BotFather** 聊天（确认用户名正好是 `@BotFather`）。

    运行 `/newbot`，按照提示操作，并保存令牌。

  </Step>

  <Step title="配置令牌和私信策略">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    环境变量回退：`TELEGRAM_BOT_TOKEN=...`（仅默认账号）。
    Telegram **不**使用 `openclaw channels login telegram`；请在配置/环境变量中配置令牌，然后启动 Gateway 网关。

  </Step>

  <Step title="启动 Gateway 网关并批准第一条私信">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配对码会在 1 小时后过期。

  </Step>

  <Step title="将机器人添加到群组">
    将机器人添加到你的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy`，以匹配你的访问模型。
  </Step>
</Steps>

<Note>
令牌解析顺序支持账号感知。实际使用中，配置值优先于环境变量回退，并且 `TELEGRAM_BOT_TOKEN` 仅适用于默认账号。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用**隐私模式**，这会限制它们能接收哪些群组消息。

    如果机器人必须看到所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式后，请在每个群组中移除并重新添加机器人，以便 Telegram 应用该更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。

    管理员机器人会接收所有群组消息，这对常驻群组行为很有用。

  </Accordion>

  <Accordion title="有用的 BotFather 开关">

    - `/setjoingroups` 用于允许/拒绝添加到群组
    - `/setprivacy` 用于群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制直接消息访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    使用 `dmPolicy: "open"` 且 `allowFrom: ["*"]` 时，任何找到或猜到机器人用户名的 Telegram 账号都可以向机器人发出命令。只应将它用于有意公开、且工具受到严格限制的机器人；单所有者机器人应使用带数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀会被接受并规范化。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 会阻止所有私信，并会被配置验证拒绝。
    设置过程只会要求输入数字用户 ID。
    如果你已升级且配置中包含 `@username` 允许列表条目，请运行 `openclaw doctor --fix` 解析它们（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖配对存储中的允许列表文件，`openclaw doctor --fix` 可以在 allowlist 流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单所有者机器人，建议使用 `dmPolicy: "allowlist"` 并配置显式的数字 `allowFrom` ID，以便让访问策略在配置中保持持久（而不是依赖之前的配对批准）。

    常见混淆：批准私信配对并不意味着“这个发送者在所有地方都已授权”。
    配对授予私信访问权限。如果还没有命令所有者，第一次获批的配对也会设置 `commands.ownerAllowFrom`，让仅所有者命令和执行批准拥有显式操作员账号。
    群组发送者授权仍然来自显式配置允许列表。
    如果你希望“我授权一次后，私信和群组命令都能使用”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`；对于仅所有者命令，请确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 查找你的 Telegram 用户 ID

    更安全（无第三方机器人）：

    1. 给你的机器人发私信。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和允许列表">
    两个控制项会共同生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 没有 `groups` 配置：
         - 使用 `groupPolicy: "open"`：任何群组都可以通过群组 ID 检查
         - 使用 `groupPolicy: "allowlist"`（默认）：群组会被阻止，直到你添加 `groups` 条目（或 `"*"`）
       - 已配置 `groups`：作为允许列表（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）。
    不要将 Telegram 群组或超级群组聊天 ID 放入 `groupAllowFrom`。负数聊天 ID 属于 `channels.telegram.groups`。
    非数字条目会被发送者授权忽略。
    安全边界（`2026.2.25+`）：群组发送者认证**不会**继承私信配对存储批准。
    配对只适用于私信。对于群组，请设置 `groupAllowFrom` 或按群组/按话题设置 `allowFrom`。
    如果未设置 `groupAllowFrom`，Telegram 会回退到配置中的 `allowFrom`，而不是配对存储。
    单所有者机器人的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果完全缺少 `channels.telegram`，运行时默认会以失败关闭方式使用 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

    示例：允许一个特定群组中的任何成员：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    示例：只允许一个特定群组内的特定用户：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      常见错误：`groupAllowFrom` 不是 Telegram 群组允许列表。

      - 将像 `-1001234567890` 这样的负数 Telegram 群组或超级群组聊天 ID 放到 `channels.telegram.groups` 下。
      - 当你想限制允许群组内哪些人可以触发机器人时，将像 `8734062810` 这样的 Telegram 用户 ID 放到 `groupAllowFrom` 下。
      - 仅当你希望允许群组中的任何成员都能与机器人交谈时，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行为">
    群组回复默认要求提及。

    提及可以来自：

    - 原生 `@botusername` 提及，或
    - 以下位置中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令开关：

    - `/activation always`
    - `/activation mention`

    这些只会更新会话状态。使用配置实现持久化。

    持久配置示例：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    获取群组聊天 ID：

    - 将群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 中读取 `chat.id`
    - 或检查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程拥有。
- 路由是确定性的：Telegram 入站消息会回复到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道信封，并包含回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>`，以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会使用支持线程感知的会话键路由，并在回复中保留线程 ID。
- 长轮询使用 grammY runner，并按聊天/按线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 长轮询在每个 Gateway 网关进程内受到保护，因此一次只能有一个活跃 poller 使用某个机器人令牌。如果你仍然看到 `getUpdates` 409 冲突，可能是另一个 OpenClaw Gateway 网关、脚本或外部 poller 正在使用同一个令牌。
- 默认情况下，长轮询看门狗会在 120 秒内没有完成的 `getUpdates` 活性信号后触发重启。只有当你的部署在长时间运行工作期间仍然看到误报的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 直接聊天：预览消息 + `editMessageText`
    - 群组/话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - `progress` 在 Telegram 上映射为 `partial`（与跨渠道命名兼容）
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（默认：预览流式传输处于活动状态时为 `true`）
    - 会检测旧版 `channels.telegram.streamMode` 和布尔 `streaming` 值；运行 `openclaw doctor --fix` 将它们迁移到 `channels.telegram.streaming.mode`

    工具进度预览更新是在工具运行时显示的简短“Working...”行，例如命令执行、文件读取、规划更新或补丁摘要。Telegram 默认保持启用这些内容，以匹配 `v2026.4.22` 及更高版本发布的 OpenClaw 行为。若要保留答案文本的编辑预览但隐藏工具进度行，请设置：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    仅当你想要只投递最终结果时，才使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，通用工具/进度闲聊会被抑制，而不是作为独立的“Working...”消息发送。批准提示、媒体载荷和错误仍然会通过正常的最终投递路由。仅当你只想保留答案预览编辑、同时隐藏工具进度状态行时，才使用 `streaming.preview.toolProgress: false`。

    对于纯文本回复：

    - 简短的私信/群组/话题预览：OpenClaw 会保留同一条预览消息，并在原处执行最终编辑
    - 早于约一分钟的预览：OpenClaw 会将完整回复作为新的最终消息发送，然后清理预览，因此 Telegram 的可见时间戳会反映完成时间，而不是预览创建时间

    对于复杂回复（例如媒体负载），OpenClaw 会回退到正常的最终交付，然后清理预览消息。

    预览流式传输与分块流式传输是分开的。当 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，避免重复流式传输。

    如果原生草稿传输不可用或被拒绝，OpenClaw 会自动回退到 `sendMessage` + `editMessageText`。

    仅限 Telegram 的推理流：

    - `/reasoning stream` 在生成时将推理发送到实时预览
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 会以纯文本重试。

    链接预览默认启用，可以通过 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册在启动时通过 `setMyCommands` 处理。

    原生命令默认值：

    - `commands.native: "auto"` 为 Telegram 启用原生命令

    添加自定义命令菜单项：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    规则：

    - 名称会被规范化（去掉开头的 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    注意：

    - 自定义命令只是菜单项；它们不会自动实现行为
    - 即使未显示在 Telegram 菜单中，插件/skill 命令在输入时仍然可以工作

    如果禁用原生命令，内置命令会被移除。自定义/插件命令在已配置时仍可注册。

    常见设置失败：

    - `setMyCommands failed` 带有 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 菜单在裁剪后仍然超出限制；减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接的 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并出现 `404: Not Found`，可能表示 `channels.telegram.apiRoot` 被设置成了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根地址，并且 `openclaw doctor --fix` 会移除意外尾随的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了已配置的 bot token。使用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 带有 network/fetch 错误通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻断。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码携带一个短期 bootstrap token。内置 bootstrap handoff 会将主节点 token 保持在 `scopes: []`；任何交接的 operator token 都会被限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap 作用域检查带有角色前缀，因此该 operator allowlist 只满足 operator 请求；非 operator 角色仍然需要其自身角色前缀下的作用域。

    如果设备使用已更改的认证详情重试（例如角色/作用域/公钥），之前的待处理请求会被取代，新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

    更多详情：[配对](/zh-CN/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘作用域：

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    按账号覆盖：

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    作用域：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（默认）

    旧版 `capabilities: ["inlineButtons"]` 映射到 `inlineButtons: "all"`。

    消息动作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    回调点击会作为文本传给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="供智能体和自动化使用的 Telegram 消息动作">
    Telegram 工具动作包括：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    渠道消息动作提供符合人体工学的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 目前默认启用，并且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用活动的配置/secret 快照（启动/重载），因此动作路径不会在每次发送时执行临时 SecretRef 重新解析。

    Reaction 移除语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复指定的 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    启用回复线程且原始 Telegram 文本或说明可用时，OpenClaw 会自动包含一段原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元，因此较长消息会从开头引用；如果 Telegram 拒绝该引用，则回退为普通回复。

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：

    - 话题会话键追加 `:topic:<threadId>`
    - 回复和正在输入状态会指向话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规话题（`threadId=1`）特殊情况：

    - 消息发送会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 正在输入动作仍会包含 `message_thread_id`

    话题继承：除非被覆盖，话题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅属于话题，不会从群组默认值继承。

    **按话题的智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这让每个话题都拥有自己隔离的工作区、记忆和会话。示例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    然后每个话题都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定固定 ACP harness 会话（`bindings[]`，带有 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及像 `-1001234567890:topic:42` 这样的带话题限定的 id）。目前限定于群组/超级群组中的论坛话题。参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天启动线程绑定的 ACP**：`/acp spawn <agent> --thread here|auto` 将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会在话题内固定启动确认。需要 `channels.telegram.threadBindings.spawnAcpSessions=true`。

    模板上下文公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的 DM 聊天会保留 DM 路由，但使用线程感知的会话键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 区分语音留言和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 强制作为语音留言发送
    - 入站语音留言转录会在智能体上下文中被框定为机器生成的非可信文本；提及检测仍使用原始转录，因此受提及门控的语音消息会继续工作。

    消息动作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 视频消息

    Telegram 区分视频文件和视频留言。

    消息动作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    视频留言不支持说明；提供的消息文本会单独发送。

    ### 贴纸

    入站贴纸处理：

    - 静态 WEBP：下载并处理（占位符 `<media:sticker>`）
    - 动画 TGS：跳过
    - 视频 WEBM：跳过

    贴纸上下文字段：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    贴纸缓存文件：

    - `~/.openclaw/telegram/sticker-cache.json`

    贴纸会被描述一次（如果可能）并缓存，以减少重复视觉调用。

    启用贴纸动作：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    发送贴纸动作：

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    搜索缓存的贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction 通知">
    Telegram reaction 会作为 `message_reaction` 更新到达（独立于消息负载）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    注意：

    - `own` 表示仅用户对机器人发送消息的反应（通过已发送消息缓存尽力处理）。
    - 反应事件仍遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在反应更新中提供话题 ID。
      - 非论坛群组路由到群聊会话
      - 论坛群组路由到群组通用话题会话（`:topic:1`），而不是精确的原始话题

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认反应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    注意：

    - Telegram 需要 unicode 表情符号（例如 "👀"）。
    - 使用 `""` 可为某个渠道或账号禁用反应。

  </Accordion>

  <Accordion title="来自 Telegram 事件和命令的配置写入">
    渠道配置写入默认启用（`configWrites !== false`）。

    Telegram 触发的写入包括：

    - 群组迁移事件（`migrate_to_chat_id`），用于更新 `channels.telegram.groups`
    - `/config set` 和 `/config unset`（需要启用命令）

    禁用：

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="长轮询与 webhook">
    默认使用长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选 `webhookPath`、`webhookHost`、`webhookPort`（默认值为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本地监听器绑定到 `127.0.0.1:8787`。对于公共入口，可以在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会在向 Telegram 返回 `200` 前验证请求防护、Telegram 密钥令牌和 JSON 正文。
    随后 OpenClaw 会通过与长轮询相同的按聊天/按话题机器人通道异步处理该更新，因此缓慢的智能体轮次不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会在按长度拆分前优先使用段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时时间（未设置时，使用 grammY 默认值）。
    - `channels.telegram.pollingStallThresholdMs` 默认为 `120000`；仅在误报轮询停滞重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 回复/引用/转发的补充上下文目前会按接收内容传递。
    - Telegram 允许列表主要限制谁可以触发智能体，而不是完整的补充上下文删改边界。
    - 私信历史控制项：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI/工具/动作）中的可恢复出站 API 错误。

    CLI 发送目标可以是数字聊天 ID 或用户名：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 投票使用 `openclaw message poll`，并支持论坛话题：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    仅限 Telegram 的投票标志：

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用于论坛话题（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带有 `buttons` 块的 `--presentation` 创建内联键盘
    - 当机器人可以在该聊天中置顶时，使用 `--pin` 或 `--delivery '{"pin":true}'` 请求置顶投递
    - 使用 `--force-document` 将出站图片和 GIF 作为文档发送，而不是压缩照片或动画媒体上传

    动作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保留常规发送启用状态

  </Accordion>

  <Accordion title="Telegram 中的执行审批">
    Telegram 支持在审批者私信中进行执行审批，并可选择在原始聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少一个审批者可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到来自 `commands.ownerAllowFrom` 的数字 owner ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与机器人对话，以及机器人在哪里发送正常回复。它们不会让某人成为执行审批者。当尚不存在命令 owner 时，首次批准的私信配对会引导创建 `commands.ownerAllowFrom`，因此单 owner 设置仍可工作，而无需在 `execApprovals.approvers` 下重复 ID。

    渠道投递会在聊天中显示命令文本；仅在受信任的群组/话题中启用 `channel` 或 `both`。当提示落在论坛话题中时，OpenClaw 会为审批提示和后续消息保留该话题。执行审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。带有 `plugin:` 前缀的审批 ID 会通过插件审批解析；其他 ID 会先通过执行审批解析。

    参见 [执行审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，Telegram 可以回复错误文本，也可以抑制该错误。两个配置键控制此行为：

| 键                                  | 值                | 默认值  | 描述                                                                                         |
| ----------------------------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送友好的错误消息。`silent` 会完全抑制错误回复。                           |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 向同一聊天发送错误回复的最小间隔时间。防止故障期间出现错误刷屏。                           |

支持按账号、按群组和按话题覆盖（继承方式与其他 Telegram 配置键相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="机器人不响应非提及群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后将机器人从群组中移除并重新添加
    - 当配置预期处理未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法进行成员探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，群组必须被列出（或包含 `"*"`）
    - 验证机器人是否为群组成员
    - 查看日志：`openclaw logs --follow` 以了解跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 伴随 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；减少插件/skill/自定义命令，或禁用原生菜单
    - `setMyCommands failed` 伴随网络/fetch 错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性存在问题

  </Accordion>

  <Accordion title="启动报告未授权令牌">

    - `getMe returned 401` 是为已配置机器人令牌返回的 Telegram 身份验证失败。
    - 在 BotFather 中重新复制或重新生成机器人令牌，然后更新默认账号的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是身份验证失败；将其视为“没有 webhook 存在”只会把同一个错误令牌失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ 加自定义 fetch/proxy 在 AbortSignal 类型不匹配时可能触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析到 IPv6；损坏的 IPv6 出站可能导致间歇性 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些作为可恢复网络错误进行重试。
    - 如果日志包含 `Polling stall detected`，OpenClaw 默认会在 120 秒内没有完成长轮询活性检查后重启轮询并重建 Telegram 传输。
    - 仅当长时间运行的 `getUpdates` 调用是健康的，但你的主机仍报告误报轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的 proxy、DNS、IPv6 或 TLS 出站问题。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）和 `dnsResultOrder=ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下工作得更好，请强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准范围应答（`198.18.0.0/15`）默认已允许用于 Telegram 媒体下载。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他 private/internal/special-use 地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选择启用也可按账号在 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 中使用。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持危险标志关闭。Telegram 媒体默认已允许 RFC 2544 基准范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅在可信、由操作员控制的代理环境中使用它，例如 Clash、Mihomo 或 Surge fake-IP 路由，并且这些环境会在 RFC 2544 基准测试范围之外合成私有或特殊用途应答。正常的公共互联网 Telegram 访问应保持关闭。
    </Warning>

    - 环境覆盖（临时）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 验证 DNS 应答：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[配置参考 - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 启动/凭证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 执行批准：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 话题/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根路径：`apiRoot`（仅限 Bot API 根路径；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史记录：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：配置两个或更多账号 ID 时，设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以显式指定默认路由。否则 OpenClaw 会回退到第一个规范化账号 ID，且 `openclaw doctor` 会发出警告。命名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户配对到 Gateway 网关。
  </Card>
  <Card title="Groups" icon="users" href="/zh-CN/channels/groups">
    群组和话题允许列表行为。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="Security" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将群组和话题映射到智能体。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

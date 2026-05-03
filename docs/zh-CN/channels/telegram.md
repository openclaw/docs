---
read_when:
    - 开发 Telegram 功能或网络钩子
summary: Telegram 机器人支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-05-03T15:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f234bc5f33eacbed3bfdc9d60285ea22ce4747f727cdb13863732238470a62d
    source_path: channels/telegram.md
    workflow: 16
---

可用于生产环境中的机器人私信和群组，基于 grammY。长轮询是默认模式；webhook 模式是可选的。

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
    打开 Telegram 并与 **@BotFather** 聊天（确认句柄确实是 `@BotFather`）。

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
    Telegram **不会**使用 `openclaw channels login telegram`；请在配置/环境变量中配置令牌，然后启动 Gateway 网关。

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
    将机器人添加到你的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy` 以匹配你的访问模型。
  </Step>
</Steps>

<Note>
令牌解析顺序是账号感知的。实际使用中，配置值优先于环境变量回退，且 `TELEGRAM_BOT_TOKEN` 仅适用于默认账号。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用**隐私模式**，这会限制它们能接收哪些群组消息。

    如果机器人必须查看所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式时，请在每个群组中移除并重新添加机器人，以便 Telegram 应用更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。

    管理员机器人会接收所有群组消息，这对始终在线的群组行为很有用。

  </Accordion>

  <Accordion title="有用的 BotFather 开关">

    - `/setjoingroups` 用于允许/拒绝添加到群组
    - `/setprivacy` 用于控制群组可见性行为

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

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 会让任何找到或猜到机器人用户名的 Telegram 账号都能指挥机器人。仅对有意公开且工具受到严格限制的机器人使用它；单所有者机器人应使用带数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀会被接受并规范化。
    在多账号配置中，限制性的顶层 `channels.telegram.allowFrom` 会被视为安全边界：账号级 `allowFrom: ["*"]` 条目不会让该账号公开，除非合并后的有效账号允许列表仍包含显式通配符。
    `dmPolicy: "allowlist"` 搭配空 `allowFrom` 会阻止所有私信，并会被配置校验拒绝。
    设置只会询问数字用户 ID。
    如果你已升级且配置中包含 `@username` 允许列表条目，请运行 `openclaw doctor --fix` 解析它们（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖配对存储允许列表文件，`openclaw doctor --fix` 可以在允许列表流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单所有者机器人，优先使用带显式数字 `allowFrom` ID 的 `dmPolicy: "allowlist"`，以便访问策略持久保存在配置中（而不是依赖之前的配对批准）。

    常见困惑：私信配对批准并不意味着“此发送者在所有地方都已获授权”。
    配对授予私信访问权限。如果尚不存在命令所有者，首次获批配对还会设置 `commands.ownerAllowFrom`，使仅所有者命令和执行批准拥有明确的操作员账号。
    群组发送者授权仍来自显式配置允许列表。
    如果你想要“我授权一次后，私信和群组命令都可用”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`；对于仅所有者命令，请确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 查找你的 Telegram 用户 ID

    更安全（无需第三方机器人）：

    1. 私信你的机器人。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和允许列表">
    两项控制会一起生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 没有 `groups` 配置：
         - 搭配 `groupPolicy: "open"`：任何群组都可以通过群组 ID 检查
         - 搭配 `groupPolicy: "allowlist"`（默认）：群组会被阻止，直到你添加 `groups` 条目（或 `"*"`）
       - 已配置 `groups`：作为允许列表（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）。
    不要将 Telegram 群组或超级群组聊天 ID 放入 `groupAllowFrom`。负数聊天 ID 应放在 `channels.telegram.groups` 下。
    非数字条目会在发送者授权中被忽略。
    安全边界（`2026.2.25+`）：群组发送者认证**不会**继承私信配对存储批准。
    配对仍仅限私信。对于群组，请设置 `groupAllowFrom` 或按群组/按话题设置 `allowFrom`。
    如果未设置 `groupAllowFrom`，Telegram 会回退到配置中的 `allowFrom`，而不是配对存储。
    单所有者机器人的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时注意事项：如果完全缺少 `channels.telegram`，运行时会默认故障关闭为 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

    示例：允许某个特定群组中的任何成员：

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

    示例：仅允许某个特定群组中的特定用户：

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

      - 将像 `-1001234567890` 这样的负数 Telegram 群组或超级群组聊天 ID 放在 `channels.telegram.groups` 下。
      - 当你想限制已允许群组内哪些人可以触发机器人时，将像 `8734062810` 这样的 Telegram 用户 ID 放在 `groupAllowFrom` 下。
      - 仅当你希望已允许群组中的任何成员都能与机器人对话时，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行为">
    群组回复默认需要提及。

    提及可以来自：

    - 原生 `@botusername` 提及，或
    - 以下位置中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令开关：

    - `/activation always`
    - `/activation mention`

    这些只会更新会话状态。使用配置来持久化。

    持久化配置示例：

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
    - 或从 `openclaw logs --follow` 读取 `chat.id`
    - 或检查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程拥有。
- 路由是确定性的：Telegram 入站会回复到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道信封，并包含回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会保留线程 ID 用于回复，但默认将私信保持在扁平会话中。当你有意需要私信话题会话隔离时，请配置 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true`，或匹配的话题配置。
- 长轮询使用 grammY runner，并按聊天/按线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 长轮询在每个 Gateway 网关进程内受到保护，因此一次只有一个活跃轮询器可以使用某个机器人令牌。如果你仍看到 `getUpdates` 409 冲突，很可能另一个 OpenClaw Gateway 网关、脚本或外部轮询器正在使用同一个令牌。
- 长轮询 watchdog 重启默认会在 120 秒内没有完成的 `getUpdates` 存活信号后触发。仅当你的部署在长时间运行工作期间仍出现误判的轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 直接聊天：预览消息 + `editMessageText`
    - 群组/话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - `progress` 在 Telegram 上映射为 `partial`（兼容跨渠道命名）
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（默认：预览流式传输启用时为 `true`）
    - 会检测旧版 `channels.telegram.streamMode` 和布尔型 `streaming` 值；运行 `openclaw doctor --fix` 将它们迁移到 `channels.telegram.streaming.mode`

    工具进度预览更新是在工具运行时显示的简短“正在工作...”行，例如命令执行、文件读取、规划更新或补丁摘要。Telegram 默认保持这些更新启用，以匹配 `v2026.4.22` 及之后版本发布的 OpenClaw 行为。若要为回答文本保留已编辑预览，但隐藏工具进度行，请设置：

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

    仅在你想要只交付最终结果时使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，通用的工具/进度闲聊会被抑制，而不是作为独立的 “Working...” 消息发送。审批提示、媒体载荷和错误仍会通过正常的最终交付路径发送。仅当你只想保留答案预览编辑，同时隐藏工具进度状态行时，使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 选中文本引用回复是例外。当 `replyToMode` 为 `"first"`、`"all"` 或 `"batched"`，并且入站消息包含选中的引用文本时，OpenClaw 会通过 Telegram 原生引用回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法为该轮显示简短的 “Working...” 行。没有选中引用文本的当前消息回复仍会保留预览流式传输。当工具进度可见性比原生引用回复更重要时，设置 `replyToMode: "off"`；或设置 `streaming.preview.toolProgress: false` 来确认这一权衡。
    </Note>

    对于纯文本回复：

    - 短私信/群组/话题预览：OpenClaw 会保留同一条预览消息，并在原位置执行最终编辑
    - 超过大约一分钟的预览：OpenClaw 会将完成的回复作为新的最终消息发送，然后清理预览，因此 Telegram 可见的时间戳会反映完成时间，而不是预览创建时间

    对于复杂回复（例如媒体载荷），OpenClaw 会回退到正常最终交付，然后清理预览消息。

    预览流式传输独立于分块流式传输。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    仅限 Telegram 的推理流：

    - `/reasoning stream` 会在生成期间将推理发送到实时预览
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 会以纯文本重试。

    链接预览默认启用，可以用 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册会在启动时通过 `setMyCommands` 处理。

    原生命令默认值：

    - `commands.native: "auto"` 会为 Telegram 启用原生命令

    添加自定义命令菜单条目：

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

    - 名称会规范化（去掉开头的 `/`，转换为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    说明：

    - 自定义命令只是菜单条目；它们不会自动实现行为
    - 插件/Skills 命令即使未显示在 Telegram 菜单中，输入时仍可工作

    如果禁用原生命令，内置命令会被移除。自定义/插件命令在配置后仍可注册。

    常见设置失败：

    - `setMyCommands failed` 并带有 `BOT_COMMANDS_TOO_MUCH`，表示 Telegram 菜单在裁剪后仍然溢出；减少插件/Skills/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接使用 Bot API curl 命令可以工作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并带有 `404: Not Found` 时，可能表示 `channels.telegram.apiRoot` 被设置成了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根地址，`openclaw doctor --fix` 会移除意外结尾的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了配置的机器人令牌。使用当前 BotFather 令牌更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 并带有网络/fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 当只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最新请求

    设置代码携带一个短期有效的引导令牌。内置引导交接会把主节点令牌保持在 `scopes: []`；任何交接出去的操作员令牌都会被限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。引导作用域检查带有角色前缀，因此该操作员允许列表只满足操作员请求；非操作员角色仍需要其自身角色前缀下的作用域。

    如果设备使用变更后的认证详情重试（例如角色/作用域/公钥），先前的待处理请求会被取代，新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

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

    旧版 `capabilities: ["inlineButtons"]` 会映射到 `inlineButtons: "all"`。

    消息操作示例：

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

    回调点击会作为文本传递给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="面向智能体和自动化的 Telegram 消息操作">
    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    渠道消息操作会公开便捷别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制项：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 目前默认启用，并且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用活动配置/密钥快照（启动/重载），因此操作路径不会在每次发送时执行临时 SecretRef 重新解析。

    移除反应语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    当启用回复线程，并且原始 Telegram 文本或标题可用时，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 码元，因此更长的消息会从开头引用；如果 Telegram 拒绝该引用，则回退为普通回复。

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：

    - 话题会话键追加 `:topic:<threadId>`
    - 回复和正在输入状态会指向话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规话题（`threadId=1`）特殊处理：

    - 消息发送会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 正在输入操作仍包含 `message_thread_id`

    话题继承：话题条目会继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅适用于话题，不会从群组默认值继承。

    **按话题进行智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这会让每个话题拥有自己的隔离工作区、记忆和会话。示例：

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

    然后，每个话题都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定固定 ACP harness 会话（`bindings[]`，其中 `type: "acp"` 且 `match.channel: "telegram"`、`peer.kind: "group"`，并使用类似 `-1001234567890:topic:42` 的话题限定 ID）。目前范围限定在群组/超级群组中的论坛话题。参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天生成线程绑定 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会在话题内固定生成确认。需要保持 `channels.telegram.threadBindings.spawnSessions` 启用（默认：`true`）。

    模板上下文会公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天默认会在扁平会话上保留私信路由和回复元数据；只有在配置了 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true` 或匹配的话题配置时，才会使用线程感知的会话键。使用顶层 `channels.telegram.dm.threadReplies` 设置账号默认值，或使用 `direct.<chatId>.threadReplies` 设置单个私信。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音便签和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 强制以语音便签发送
    - 入站语音便签转录会在智能体上下文中被框定为机器生成、
      不可信文本；提及检测仍会使用原始
      转录，因此受提及门控的语音消息会继续工作。

    消息操作示例：

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

    Telegram 会区分视频文件和视频便签。

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    视频备注不支持字幕；提供的消息文本会单独发送。

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

    贴纸会在可行时描述一次并缓存，以减少重复的视觉调用。

    启用贴纸操作：

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

    发送贴纸操作：

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    搜索已缓存的贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="表情回应通知">
    Telegram 表情回应会作为 `message_reaction` 更新到达（独立于消息负载）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    注意事项：

    - `own` 表示仅限用户对机器人发送消息的表情回应（通过已发送消息缓存尽力判断）。
    - 表情回应事件仍会遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在表情回应更新中提供话题 ID。
      - 非论坛群组会路由到群聊会话
      - 论坛群组会路由到群组通用话题会话（`:topic:1`），而不是精确的原始话题

    用于轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认表情回应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 兜底（`agents.list[].identity.emoji`，否则为 "👀"）

    注意事项：

    - Telegram 期望使用 unicode emoji（例如 "👀"）。
    - 使用 `""` 可为某个渠道或账户禁用该表情回应。

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
    默认使用长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选设置 `webhookPath`、`webhookHost`、`webhookPort`（默认值为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本地监听器绑定到 `127.0.0.1:8787`。对于公网入口，可以在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会在向 Telegram 返回 `200` 之前验证请求保护、Telegram secret token 和 JSON body。
    随后，OpenClaw 会通过与长轮询相同的按聊天/按话题机器人通道异步处理更新，因此较慢的智能体轮次不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会在按长度拆分前优先使用段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时（如果未设置，则使用 grammY 默认值）。机器人客户端会将配置值限制在 60 秒出站文本/输入状态请求保护以下，避免 grammY 在 OpenClaw 的传输保护和兜底逻辑运行前中止可见回复投递。长轮询仍使用 45 秒 `getUpdates` 请求保护，因此空闲轮询不会无限期挂起。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；仅在轮询停滞重启出现误报时，在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 回复/引用/转发的补充上下文目前会按收到的内容传递。
    - Telegram allowlist 主要控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI/工具/操作）中的可恢复出站 API 错误。入站最终回复投递也会对 Telegram 预连接失败使用有界的安全发送重试，但不会重试可能重复可见消息的模糊发送后网络信封。

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

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用于论坛话题（也可使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带有 `buttons` 块的 `--presentation` 创建内联键盘
    - 使用 `--pin` 或 `--delivery '{"pin":true}'` 在机器人可在该聊天中置顶时请求置顶投递
    - 使用 `--force-document` 将出站图片和 GIF 作为文档发送，而不是压缩照片或动画媒体上传

    操作控制：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保留常规发送功能

  </Accordion>

  <Accordion title="Telegram 中的执行审批">
    Telegram 支持在审批者私信中进行执行审批，也可以选择在原始聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少一个审批者可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字 owner ID）
    - `channels.telegram.execApprovals.target`：`dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与机器人对话以及正常回复发送到哪里。它们不会让某人成为执行审批者。当尚不存在命令 owner 时，第一次获批的私信配对会引导生成 `commands.ownerAllowFrom`，因此单 owner 设置仍可工作，而无需在 `execApprovals.approvers` 下重复 ID。

    渠道投递会在聊天中显示命令文本；仅在可信群组/话题中启用 `channel` 或 `both`。当提示落在论坛话题中时，OpenClaw 会为审批提示和后续消息保留该话题。执行审批默认在 30 分钟后过期。

    内联审批按钮还需要 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的审批 ID 会通过插件审批解析；其他 ID 会先通过执行审批解析。

    参见 [执行审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，Telegram 可以回复错误文本，也可以抑制错误回复。两个配置键控制此行为：

| 键                                  | 值                | 默认值  | 描述                                                                                       |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送友好的错误消息。`silent` 会完全抑制错误回复。                         |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同一聊天两次错误回复之间的最短时间。防止故障期间出现错误刷屏。                            |

支持按账户、按群组和按话题覆盖（继承方式与其他 Telegram 配置键相同）。

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
  <Accordion title="机器人不会响应非提及群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后将机器人从群组中移除并重新添加
    - 当配置期望未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法进行成员资格探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当 `channels.telegram.groups` 存在时，群组必须被列出（或包含 `"*"`）
    - 验证机器人在群组中的成员资格
    - 查看日志：`openclaw logs --follow`，以了解跳过原因

  </Accordion>

  <Accordion title="命令只部分生效或完全无效">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 携带 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；减少插件/skill/自定义命令，或禁用原生命令菜单
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 输入状态调用都有边界，并会在请求超时时通过 Telegram 的传输兜底重试一次。持续的网络/fetch 错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性存在问题

  </Accordion>

  <Accordion title="启动报告未授权 token">

    - `getMe returned 401` 是配置的机器人 token 发生 Telegram 身份验证失败。
    - 在 BotFather 中重新复制或重新生成机器人 token，然后更新默认账户的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间出现 `deleteWebhook 401 Unauthorized` 也是身份验证失败；将其视为“webhook 不存在”只会把同一个错误 token 失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/proxy 可能会在 AbortSignal 类型不匹配时触发立即中止行为。
    - 某些主机会先把 `api.telegram.org` 解析到 IPv6；损坏的 IPv6 出站可能导致 Telegram API 间歇性失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会把这些作为可恢复的网络错误重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用启动时成功的 `getMe` 探测，因此 runner 不需要在第一次 `getUpdates` 之前再执行第二次 `getMe`。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬时网络错误失败，OpenClaw 会继续进入长轮询，而不是再发起一次预轮询控制平面调用。仍处于活动状态的 webhook 会表现为 `getUpdates` 冲突；随后 OpenClaw 会重建 Telegram 传输并重试 webhook 清理。
    - 如果 Telegram 套接字按较短的固定周期回收，请检查是否设置了较低的 `channels.telegram.timeoutSeconds`；bot 客户端会将低于出站和 `getUpdates` 请求保护阈值的配置值钳制到保护范围内，但旧版本在该值低于这些保护阈值时可能会中止每次轮询或回复。
    - 如果日志包含 `Polling stall detected`，OpenClaw 默认会在 120 秒内没有完成的长轮询活性信号后重启轮询并重建 Telegram 传输。
    - `openclaw channels status --probe` 和 `openclaw doctor` 会在运行中的轮询账号在启动宽限期后仍未完成 `getUpdates`、运行中的 webhook 账号在启动宽限期后仍未完成 `setWebhook`，或最后一次成功的轮询传输活动已过期时发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告误报的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的 proxy、DNS、IPv6 或 TLS 出站问题。
    - Telegram 还会为 Bot API 传输遵循进程 proxy 环境变量，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果服务环境通过 `OPENCLAW_PROXY_URL` 配置了 OpenClaw 托管 proxy，且不存在标准 proxy 环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，然后是进程默认值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不适用，Node 22+ 会回退到 `ipv4first`。
    - 如果你的主机是 WSL2，或明确使用仅 IPv4 行为效果更好，请强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 默认已允许 Telegram 媒体下载使用 RFC 2544 基准测试范围地址（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明 proxy 在媒体下载期间把 `api.telegram.org` 重写到其他私有/内部/特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选择性启用也可按账号配置在
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的 proxy 将 Telegram 媒体主机解析到 `198.18.x.x`，先保持危险标志关闭。Telegram 媒体默认已允许 RFC 2544 基准测试范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅在受信任、由操作方控制的 proxy 环境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，并且这些环境会合成 RFC 2544 基准测试范围之外的私有或特殊用途答案。对于正常公共互联网 Telegram 访问，请保持关闭。
    </Warning>

    - 环境覆盖（临时）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 验证 DNS 答案：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[配置参考 - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="高信号 Telegram 字段">

- 启动/身份验证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根地址：`apiRoot`（仅 Bot API 根地址；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：配置两个或更多账号 ID 时，设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确默认路由。否则 OpenClaw 会回退到第一个规范化账号 ID，并且 `openclaw doctor` 会发出警告。命名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群组和话题允许列表行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将群组和话题映射到智能体。
  </Card>
  <Card title="故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

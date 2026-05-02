---
read_when:
    - 开发 Telegram 功能或网络钩子
summary: Telegram 机器人支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-05-02T06:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: af04e95d6011ab568e07c309bc7c154d9242a53e24b7f52a2381dbf30ed842a0
    source_path: channels/telegram.md
    workflow: 16
---

可用于通过 grammY 在生产环境中处理机器人私信和群组。默认模式是长轮询；webhook 模式为可选。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    打开 Telegram，并与 **@BotFather** 聊天（确认用户名确实是 `@BotFather`）。

    运行 `/newbot`，按提示操作，并保存令牌。

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
    将机器人添加到你的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy`，使其与你的访问模型匹配。
  </Step>
</Steps>

<Note>
令牌解析顺序是账号感知的。实际使用中，配置值优先于环境变量回退，而 `TELEGRAM_BOT_TOKEN` 只适用于默认账号。
</Note>

## Telegram 侧设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用**隐私模式**，这会限制它们能收到哪些群组消息。

    如果机器人必须看到所有群组消息，可以：

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
    - `/setprivacy` 用于群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制直接消息访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`)
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 会让任何找到或猜到机器人用户名的 Telegram 账号都能指挥机器人。仅将它用于有意公开且工具受到严格限制的机器人；单所有者机器人应使用包含数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀会被接受并规范化。
    在多账号配置中，限制性的顶层 `channels.telegram.allowFrom` 会被视为安全边界：账号级 `allowFrom: ["*"]` 条目不会让该账号公开，除非合并后的有效账号允许列表仍包含显式通配符。
    `dmPolicy: "allowlist"` 搭配空 `allowFrom` 会阻止所有私信，并被配置验证拒绝。
    设置过程只要求数字用户 ID。
    如果你已升级且配置中包含 `@username` 允许列表条目，请运行 `openclaw doctor --fix` 来解析它们（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖配对存储允许列表文件，`openclaw doctor --fix` 可以在 allowlist 流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单所有者机器人，优先使用 `dmPolicy: "allowlist"` 搭配显式数字 `allowFrom` ID，以便访问策略在配置中持久保存（而不是依赖之前的配对批准）。

    常见混淆：私信配对批准并不意味着“此发送者在所有地方都已获授权”。
    配对授予私信访问权限。如果还不存在命令所有者，第一次批准的配对还会设置 `commands.ownerAllowFrom`，让仅所有者命令和 exec 批准拥有一个显式操作账号。
    群组发送者授权仍来自显式配置允许列表。
    如果你希望“我授权一次，私信和群组命令都能工作”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`；对于仅所有者命令，确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

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
         - 搭配 `groupPolicy: "open"`：任何群组都能通过群组 ID 检查
         - 搭配 `groupPolicy: "allowlist"`（默认）：群组会被阻止，直到你添加 `groups` 条目（或 `"*"`)
       - 已配置 `groups`：作为允许列表（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）。
    不要将 Telegram 群组或超级群组聊天 ID 放入 `groupAllowFrom`。负数聊天 ID 属于 `channels.telegram.groups`。
    非数字条目会在发送者授权中被忽略。
    安全边界（`2026.2.25+`）：群组发送者认证**不会**继承私信配对存储批准。
    配对保持仅限私信。对于群组，请设置 `groupAllowFrom` 或按群组/话题设置 `allowFrom`。
    如果未设置 `groupAllowFrom`，Telegram 会回退到配置 `allowFrom`，而不是配对存储。
    单所有者机器人的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时注意事项：如果完全缺少 `channels.telegram`，运行时默认采用故障关闭的 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

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

    示例：只允许一个特定群组中的特定用户：

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

      - 将 `-1001234567890` 这样的负数 Telegram 群组或超级群组聊天 ID 放在 `channels.telegram.groups` 下。
      - 当你想限制已允许群组中哪些人可以触发机器人时，将 `8734062810` 这样的 Telegram 用户 ID 放在 `groupAllowFrom` 下。
      - 只有当你希望已允许群组中的任何成员都能与机器人对话时，才使用 `groupAllowFrom: ["*"]`。

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

    这些只更新会话状态。使用配置来实现持久化。

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
    - 或从 `openclaw logs --follow` 读取 `chat.id`
    - 或检查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程拥有。
- 路由是确定性的：Telegram 入站会回复到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道信封，并包含回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会使用线程感知的会话键进行路由，并为回复保留线程 ID。
- 长轮询使用 grammY runner，并按聊天/线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 长轮询在每个 Gateway 网关进程内部受到保护，因此同一时间只有一个活动 poller 可以使用一个机器人令牌。如果你仍看到 `getUpdates` 409 冲突，可能是另一个 OpenClaw Gateway 网关、脚本或外部 poller 正在使用同一个令牌。
- 默认情况下，长轮询 watchdog 会在 120 秒内没有完成的 `getUpdates` 活性信号后触发重启。只有当你的部署在长时间运行工作期间仍出现误判的轮询停滞重启时，才提高 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
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
    - 会检测旧版 `channels.telegram.streamMode` 和布尔值 `streaming`；运行 `openclaw doctor --fix` 可将它们迁移到 `channels.telegram.streaming.mode`

    工具进度预览更新是在工具运行时显示的简短“Working...”行，例如命令执行、文件读取、规划更新或补丁摘要。Telegram 默认保持启用这些内容，以匹配 `v2026.4.22` 及之后版本发布的 OpenClaw 行为。若要保留答案文本的已编辑预览，但隐藏工具进度行，请设置：

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

    仅当你希望只交付最终结果时，才使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，并且通用工具/进度闲聊会被抑制，而不是作为独立的“Working...”消息发送。批准提示、媒体载荷和错误仍会通过正常最终交付路由。仅当你只想保留答案预览编辑，同时隐藏工具进度状态行时，才使用 `streaming.preview.toolProgress: false`。

    对于纯文本回复：

    - 简短私信/群组/话题预览：OpenClaw 保留同一条预览消息，并在原位置执行最终编辑
    - 超过约一分钟的预览：OpenClaw 会将完成的回复作为新的最终消息发送，然后清理预览，因此 Telegram 的可见时间戳会反映完成时间，而不是预览创建时间

    对于复杂回复（例如媒体载荷），OpenClaw 会回退到普通的最终投递，然后清理预览消息。

    预览流式传输独立于分块流式传输。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，避免双重流式传输。

    仅 Telegram 的推理流：

    - `/reasoning stream` 会在生成时将推理发送到实时预览
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 会以纯文本重试。

    链接预览默认启用，可通过 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册会在启动时通过 `setMyCommands` 处理。

    原生命令默认值：

    - `commands.native: "auto"` 会为 Telegram 启用原生命令

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

    - 名称会被规范化（去除开头的 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    注意事项：

    - 自定义命令只是菜单项；它们不会自动实现行为
    - 插件/skill 命令即使未显示在 Telegram 菜单中，输入时仍然可以工作

    如果禁用原生命令，内置命令会被移除。配置后，自定义/插件命令仍可能注册。

    常见设置失败：

    - `setMyCommands failed` 并带有 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 菜单在裁剪后仍然溢出；减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并带有 `404: Not Found` 时，可能表示 `channels.telegram.apiRoot` 被设置成了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根地址，且 `openclaw doctor --fix` 会移除意外尾随的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了配置的 bot token。使用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 并带有网络/fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 当只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码携带短生命周期的 bootstrap token。内置 bootstrap 交接会让主节点 token 保持在 `scopes: []`；任何被交接的 operator token 都会被限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write` 范围内。Bootstrap 作用域检查带有角色前缀，因此该 operator allowlist 只满足 operator 请求；非 operator 角色仍需要其自身角色前缀下的作用域。

    如果设备使用已更改的认证详情重试（例如角色/作用域/公钥），先前的待处理请求会被取代，新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

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

    渠道消息操作公开符合人体工学的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，并且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用活动配置/secrets 快照（启动/重新加载），因此操作路径不会在每次发送时执行临时 SecretRef 重新解析。

    移除反应的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成的输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    当启用回复线程，并且原始 Telegram 文本或标题可用时，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元，因此较长消息会从开头引用；如果 Telegram 拒绝该引用，则回退为普通回复。

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
    - 正在输入操作仍会包含 `message_thread_id`

    话题继承：除非覆盖，话题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅限话题，不会从群组默认值继承。

    **按话题的智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这会让每个话题拥有自己隔离的工作区、记忆和会话。示例：

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

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定（`bindings[]`，带有 `type: "acp"` 和 `match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的带话题限定 ID）固定 ACP harness 会话。当前作用域限于群组/超级群组中的论坛话题。参见 [ACP Agents](/zh-CN/tools/acp-agents)。

    **从聊天中生成线程绑定的 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会在话题中置顶生成确认。需要保持启用 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留私信路由，但使用感知线程的会话键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音便签和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 强制以语音便签发送
    - 入站语音便签转写会在智能体上下文中被框定为机器生成的、
      不受信任文本；提及检测仍使用原始
      转写，因此提及门控的语音消息会继续工作。

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

    视频便签不支持标题；提供的消息文本会单独发送。

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

    贴纸会被描述一次（如果可能）并缓存，以减少重复的视觉调用。

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

    搜索缓存贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="反应通知">
    Telegram 反应会作为 `message_reaction` 更新到达（与消息载荷分离）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    注意事项：

    - `own` 表示仅针对机器人发送消息的用户回应（通过已发送消息缓存尽力实现）。
    - 回应事件仍会遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权的发送者会被丢弃。
    - Telegram 不会在回应更新中提供话题 ID。
      - 非论坛群组路由到群组聊天会话
      - 论坛群组路由到群组通用话题会话（`:topic:1`），而不是确切的原始话题

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认回应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    注意事项：

    - Telegram 需要 Unicode 表情符号（例如 "👀"）。
    - 使用 `""` 可禁用某个渠道或账号的回应。

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

    本地监听器绑定到 `127.0.0.1:8787`。对于公网入口，可以在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会先验证请求防护、Telegram secret token 和 JSON 正文，然后再向 Telegram 返回 `200`。
    随后 OpenClaw 会通过与长轮询相同的按聊天/按话题机器人通道异步处理更新，因此缓慢的智能体轮次不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会在按长度拆分之前优先使用段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认值 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.timeoutSeconds` 覆盖 Telegram API 客户端超时时间（未设置时使用 grammY 默认值）。长轮询机器人客户端会将低于 45 秒 `getUpdates` 请求防护的配置值钳制到该防护以下，以便空闲轮询不会在 30 秒轮询窗口完成前被中止。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；仅在轮询停滞重启误报时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认值 50）；`0` 表示禁用。
    - 回复/引用/转发的补充上下文目前会按收到的内容传递。
    - Telegram 允许列表主要控制谁可以触发智能体，并不是完整的补充上下文脱敏边界。
    - 私信历史控制项：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI/工具/操作）中可恢复的出站 API 错误。入站最终回复投递也会对 Telegram 预连接失败使用有界安全发送重试，但不会重试可能重复显示消息的发送后不明确网络封套。

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
    - 用于论坛话题的 `--thread-id`（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带 `buttons` 块的 `--presentation` 创建内联键盘
    - 当机器人可在该聊天中置顶时，使用 `--pin` 或 `--delivery '{"pin":true}'` 请求置顶投递
    - 使用 `--force-document` 将出站图片和 GIF 作为文档发送，而不是作为压缩照片或动画媒体上传

    操作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保持常规发送启用

  </Accordion>

  <Accordion title="Telegram 中的执行审批">
    Telegram 支持在审批者私信中进行执行审批，并可选择在原始聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少一个审批者可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字所有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与机器人对话，以及机器人将普通回复发送到哪里。它们不会让某人成为执行审批者。当还没有命令所有者时，首次获批的私信配对会引导初始化 `commands.ownerAllowFrom`，因此单所有者设置仍可工作，而无需在 `execApprovals.approvers` 下重复 ID。

    渠道投递会在聊天中显示命令文本；仅在可信群组/话题中启用 `channel` 或 `both`。当提示落在论坛话题中时，OpenClaw 会为审批提示和后续消息保留该话题。执行审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的审批 ID 通过插件审批解析；其他 ID 会先通过执行审批解析。

    请参阅[执行审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，Telegram 可以回复错误文本，也可以将其抑制。两个配置键控制此行为：

| 键                                  | 值                | 默认值  | 描述                                                                                         |
| ----------------------------------- | ----------------- | ------- | -------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送友好的错误消息。`silent` 会完全抑制错误回复。                           |
| `channels.telegram.errorCooldownMs` | 数字（毫秒）      | `60000` | 向同一聊天发送错误回复的最小间隔时间。可防止故障期间出现错误刷屏。                         |

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
  <Accordion title="机器人不响应未提及它的群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> 禁用
      - 然后将机器人从群组移除并重新添加
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法探测成员资格。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当 `channels.telegram.groups` 存在时，群组必须被列出（或包含 `"*"`）
    - 验证机器人是否为群组成员
    - 查看日志：`openclaw logs --follow` 以了解跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 并出现 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；请减少插件/Skills/自定义命令，或禁用原生菜单
    - `deleteMyCommands` / `setMyCommands` 启动调用是有界的，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/获取错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性存在问题

  </Accordion>

  <Accordion title="启动报告未授权令牌">

    - `getMe returned 401` 是针对已配置机器人令牌的 Telegram 身份验证失败。
    - 在 BotFather 中重新复制或重新生成机器人令牌，然后更新默认账号的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是身份验证失败；将其视为“没有 webhook 存在”只会把同一个错误令牌失败推迟到后续 API 调用。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬时网络错误而失败，OpenClaw 会检查 `getWebhookInfo`；当 Telegram 报告空 webhook URL 时，轮询会继续，因为清理已经满足。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/proxy 可能会在 AbortSignal 类型不匹配时触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站连接可能导致间歇性 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些作为可恢复的网络错误重试。
    - 如果 Telegram 套接字按较短的固定周期回收，请检查 `channels.telegram.timeoutSeconds` 是否过低；长轮询机器人客户端会将配置值限制在 `getUpdates` 请求保护值以下，但旧版本在该值低于长轮询超时时，可能会在每次轮询时中止。
    - 如果日志包含 `Polling stall detected`，OpenClaw 默认会在 120 秒内没有完成长轮询存活信号后重启轮询并重建 Telegram 传输。
    - `openclaw channels status --probe` 和 `openclaw doctor` 会在运行中的轮询账号在启动宽限期后仍未完成 `getUpdates`、运行中的 webhook 账号在启动宽限期后仍未完成 `setWebhook`，或最近一次成功的轮询传输活动已过期时发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告误判的轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的 proxy、DNS、IPv6 或 TLS 出站问题。
    - Telegram 的 Bot API 传输也会遵循进程 proxy 环境，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果在服务环境中通过 `OPENCLAW_PROXY_URL` 配置了 OpenClaw 托管 proxy，且没有标准 proxy 环境变量，Telegram 的 Bot API 传输也会使用该 URL。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到进程默认值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不适用，Node 22+ 会回退到 `ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下工作更好，请强制 family 选择：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 默认已允许 Telegram 媒体下载使用 RFC 2544 基准测试范围答案（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明 proxy 在媒体下载期间将 `api.telegram.org` 重写到其他私有/内部/特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一选择也可按账号在
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 中配置。
    - 如果你的 proxy 将 Telegram 媒体主机解析到 `198.18.x.x`，请先保持危险标志关闭。Telegram 媒体默认已允许 RFC 2544 基准测试范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅在受信任、由操作员控制的 proxy
      环境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，并且它们会合成 RFC 2544 基准测试
      范围之外的私有或特殊用途答案。对于普通公网 Telegram 访问，请保持关闭。
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

<Accordion title="High-signal Telegram fields">

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 执行批准：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根地址：`apiRoot`（仅 Bot API 根地址；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：配置两个或更多账号 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以显式指定默认路由。否则 OpenClaw 会回退到第一个规范化账号 ID，并且 `openclaw doctor` 会发出警告。命名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户与 Gateway 网关配对。
  </Card>
  <Card title="Groups" icon="users" href="/zh-CN/channels/groups">
    群组和主题允许列表行为。
  </Card>
  <Card title="Channel routing" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="Security" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和加固。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将群组和主题映射到智能体。
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

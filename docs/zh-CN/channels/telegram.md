---
read_when:
    - 开发 Telegram 功能或 Webhook 时
summary: Telegram 机器人支持状态、功能和配置
title: Telegram
x-i18n:
    generated_at: "2026-04-23T08:40:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 024b76c3c71537995fc4efc26887eae516846d3f845d135b263d4d7f270afbb7
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram（Bot API）

状态：基于 grammY，已为机器人私信和群组达到生产就绪。默认模式为长轮询；Webhook 模式可选。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断与修复操作手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式与示例。
  </Card>
</CardGroup>

## 快速开始

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    打开 Telegram，并与 **@BotFather** 聊天（确认用户名精确为 `@BotFather`）。

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
    Telegram **不**使用 `openclaw channels login telegram`；请在配置或环境变量中设置令牌，然后启动 Gateway 网关。

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
令牌解析顺序会感知账号。在实际中，配置值优先于环境变量回退，而 `TELEGRAM_BOT_TOKEN` 仅适用于默认账号。
</Note>

## Telegram 侧设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用 **隐私模式**，这会限制它们能接收到的群组消息。

    如果机器人必须看到群组中的所有消息，可以选择以下任一方式：

    - 通过 `/setprivacy` 关闭隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式后，请在每个群组中移除并重新添加机器人，以便 Telegram 应用该更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态由 Telegram 群组设置控制。

    管理员机器人会收到所有群组消息，这对始终在线的群组行为很有帮助。

  </Accordion>

  <Accordion title="有用的 BotFather 开关">

    - `/setjoingroups`：允许或拒绝加入群组
    - `/setprivacy`：控制群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制与激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`)
    - `disabled`

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。支持并会规范化 `telegram:` / `tg:` 前缀。
    配置验证会拒绝 `dmPolicy: "allowlist"` 且 `allowFrom` 为空的情况，因为这会阻止所有私信。
    设置过程仅要求填写数字用户 ID。
    如果你升级后发现配置中包含 `@username` 形式的 allowlist 条目，请运行 `openclaw doctor --fix` 进行解析（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖基于 pairing-store 的 allowlist 文件，`openclaw doctor --fix` 也可以在 allowlist 流程中将这些条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单一所有者的机器人，建议使用 `dmPolicy: "allowlist"` 并显式设置数字 `allowFrom` ID，这样访问策略可以稳定地保存在配置中（而不是依赖之前的配对批准）。

    常见困惑：批准私信配对并不意味着“此发送者在任何地方都已获授权”。
    配对只授予私信访问权限。群组发送者授权仍然来自显式配置的 allowlist。
    如果你希望“我授权一次后，私信和群组命令都能工作”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`。

    ### 查找你的 Telegram 用户 ID

    更安全的方法（不使用第三方机器人）：

    1. 给你的机器人发送私信。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和 allowlist">
    两项控制会同时生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 没有 `groups` 配置时：
         - 使用 `groupPolicy: "open"`：任意群组都可以通过群组 ID 检查
         - 使用 `groupPolicy: "allowlist"`（默认）：在你添加 `groups` 条目（或 `"*"`）之前，群组都会被阻止
       - 配置了 `groups`：其行为即为 allowlist（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）。
    不要把 Telegram 群组或超级群 chat ID 放进 `groupAllowFrom`。负数 chat ID 应放在 `channels.telegram.groups` 下。
    非数字条目会在发送者授权时被忽略。
    安全边界（`2026.2.25+`）：群组发送者授权**不会**继承私信 pairing-store 批准记录。
    配对仍然只适用于私信。对于群组，请设置 `groupAllowFrom` 或按群组/话题设置 `allowFrom`。
    如果 `groupAllowFrom` 未设置，Telegram 会回退到配置中的 `allowFrom`，而不是 pairing-store。
    单一所有者机器人的实用模式：将你的用户 ID 设置到 `channels.telegram.allowFrom`，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果完全缺少 `channels.telegram`，除非显式设置了 `channels.defaults.groupPolicy`，否则运行时默认采用故障关闭的 `groupPolicy="allowlist"`。

    示例：允许某个特定群组中的任意成员：

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
      常见错误：`groupAllowFrom` 不是 Telegram 群组 allowlist。

      - 像 `-1001234567890` 这样的 Telegram 群组或超级群负数 chat ID，应放在 `channels.telegram.groups` 下。
      - 像 `8734062810` 这样的 Telegram 用户 ID，应放在 `groupAllowFrom` 下，用于限制允许的群组中哪些人可以触发机器人。
      - 仅当你希望允许群组中的任意成员都能与机器人对话时，才使用 `groupAllowFrom: ["*"]`。
    </Warning>

  </Tab>

  <Tab title="提及行为">
    默认情况下，群组回复需要提及。

    提及可以来自：

    - 原生 `@botusername` 提及，或
    - 以下位置中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令开关：

    - `/activation always`
    - `/activation mention`

    这些只会更新会话状态。若要持久化，请使用配置。

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

    获取群组 chat ID 的方法：

    - 将一条群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 中读取 `chat.id`
    - 或查看 Bot API 的 `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程负责。
- 路由是确定性的：来自 Telegram 的入站回复会返回到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道信封格式，并附带回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会使用感知线程的会话键进行路由，并为回复保留线程 ID。
- 长轮询使用 grammY runner，并按每个 chat/每个线程顺序处理。整体 runner sink 并发度使用 `agents.defaults.maxConcurrent`。
- 默认情况下，如果 120 秒内没有完成的 `getUpdates` 存活信号，就会触发长轮询 watchdog 重启。只有当你的部署在长时间运行任务期间仍出现误报的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 私聊：预览消息 + `editMessageText`
    - 群组/话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - 在 Telegram 上，`progress` 会映射为 `partial`（与跨渠道命名兼容）
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。
    - 旧版 `channels.telegram.streamMode` 和布尔型 `streaming` 值会被自动映射

    对于纯文本回复：

    - 私信：OpenClaw 会保留同一条预览消息，并原地执行最终编辑（不会发送第二条消息）
    - 群组/话题：OpenClaw 会保留同一条预览消息，并原地执行最终编辑（不会发送第二条消息）

    对于复杂回复（例如媒体负载），OpenClaw 会回退到正常的最终发送，然后清理预览消息。

    预览流式传输与分块流式传输是分开的。当 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    如果原生草稿传输不可用或被拒绝，OpenClaw 会自动回退到 `sendMessage` + `editMessageText`。

    仅限 Telegram 的推理流：

    - `/reasoning stream` 会在生成期间将推理发送到实时预览中
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会被渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 会以纯文本重试。

    默认启用链接预览，可通过 `channels.telegram.linkPreview: false` 禁用。

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
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "创建图像" },
      ],
    },
  },
}
```

    规则：

    - 名称会被规范化（去掉前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突或重复项会被跳过并记录日志

    说明：

    - 自定义命令仅是菜单项；它们不会自动实现行为
    - 即使未显示在 Telegram 菜单中，plugin/Skills 命令在手动输入时仍然可以工作

    如果禁用原生命令，内置命令会被移除。若已配置，自定义/plugin 命令仍可注册。

    常见设置失败：

    - `setMyCommands failed` 且报错 `BOT_COMMANDS_TOO_MUCH`，表示即使精简后 Telegram 菜单仍然超出限制；请减少 plugin/Skills/自定义命令，或禁用 `channels.telegram.commands.native`。
    - `setMyCommands failed` 且报错网络/fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` plugin）

    安装 `device-pair` plugin 后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>`：显式批准
       - `/pair approve`：当只有一个待处理请求时使用
       - `/pair approve latest`：批准最新请求

    设置代码携带短期有效的 bootstrap 令牌。内置的 bootstrap 交接会将主节点令牌保持为 `scopes: []`；任何交接出的 operator 令牌都会限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write` 范围内。Bootstrap 作用域检查带有角色前缀，因此该 operator allowlist 只满足 operator 请求；非 operator 角色仍然需要其自身角色前缀下的作用域。

    如果设备以变更后的认证详情重试（例如角色/作用域/公钥），之前的待处理请求会被替代，新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

    更多详情： [配对](/zh-CN/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘作用范围：

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

    作用范围：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（默认）

    旧版 `capabilities: ["inlineButtons"]` 会映射为 `inlineButtons: "all"`。

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

    回调点击会作为文本传递给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="用于智能体和自动化的 Telegram 消息动作">
    Telegram 工具动作包括：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    渠道消息动作提供更易用的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用当前生效的配置/密钥快照（启动/重载时），因此动作路径不会在每次发送时临时重新解析 `SecretRef`。

    移除表情回应的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]`：回复触发消息
    - `[[reply_to:<id>]]`：回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 会禁用隐式回复线程处理。显式 `[[reply_to_*]]` 标签仍会生效。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群：

    - 话题会话键会追加 `:topic:<threadId>`
    - 回复和输入状态都会定向到该话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General 话题（`threadId=1`）特殊情况：

    - 发送消息时省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 输入状态动作仍然包含 `message_thread_id`

    话题继承：除非被覆盖，否则话题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅限话题级，不会从群组默认值继承。

    **按话题的智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这会为每个话题提供独立的工作区、记忆和会话。示例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General 话题 → main 智能体
                "3": { agentId: "zu" },        // 开发话题 → zu 智能体
                "5": { agentId: "coder" }      // 代码评审 → coder 智能体
              }
            }
          }
        }
      }
    }
    ```

    此后，每个话题都会有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久化 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定（`bindings[]` 中 `type: "acp"`，且 `match.channel: "telegram"`、`peer.kind: "group"`，以及带话题限定的 id，例如 `-1001234567890:topic:42`）固定到 ACP harness 会话。目前仅适用于群组/超级群中的论坛话题。参见 [ACP Agents](/zh-CN/tools/acp-agents)。

    **从聊天中生成线程绑定的 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到该会话。OpenClaw 会在话题内固定生成确认消息。要求 `channels.telegram.threadBindings.spawnAcpSessions=true`。

    模板上下文会暴露 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留私信路由，但使用感知线程的会话键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 区分语音消息和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中添加标签 `[[audio_as_voice]]` 可强制以语音消息发送

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

    Telegram 区分视频文件和视频笔记。

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

    视频笔记不支持说明文字；如果提供了消息文本，会单独发送。

    ### 贴纸

    入站贴纸处理：

    - 静态 WEBP：下载并处理（占位符 `<media:sticker>`）
    - 动态 TGS：跳过
    - 视频 WEBM：跳过

    贴纸上下文字段：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    贴纸缓存文件：

    - `~/.openclaw/telegram/sticker-cache.json`

    贴纸会在可能时仅描述一次并缓存，以减少重复的视觉调用。

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

    搜索已缓存贴纸：

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
    Telegram 表情回应以 `message_reaction` 更新形式到达（独立于消息负载）。

    启用后，OpenClaw 会将系统事件加入队列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`: `off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅处理用户对机器人已发送消息的表情回应（尽力而为，基于已发送消息缓存）。
    - 表情回应事件仍然遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在表情回应更新中提供线程 ID。
      - 非论坛群组会路由到群聊会话
      - 论坛群组会路由到群组的 General 话题会话（`:topic:1`），而不是原始精确话题

    用于轮询/Webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认表情回应">
    `ackReaction` 会在 OpenClaw 处理入站消息期间发送一个确认 emoji。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

    说明：

    - Telegram 需要 unicode emoji（例如 `"👀"`）。
    - 使用 `""` 可为某个渠道或账号禁用该表情回应。

  </Accordion>

  <Accordion title="来自 Telegram 事件和命令的配置写入">
    默认启用渠道配置写入（`configWrites !== false`）。

    由 Telegram 触发的写入包括：

    - 群组迁移事件（`migrate_to_chat_id`），用于更新 `channels.telegram.groups`
    - `/config set` 和 `/config unset`（需要启用命令）

    禁用方式：

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

  <Accordion title="长轮询与 Webhook">
    默认使用长轮询。若要使用 Webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；还可选设置 `webhookPath`、`webhookHost`、`webhookPort`（默认分别为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本地监听器绑定到 `127.0.0.1:8787`。若要公开接入，可以在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会在按长度拆分前优先按段落边界（空行）拆分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制 Telegram 入站和出站媒体大小。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时时间（未设置时使用 grammY 默认值）。
    - `channels.telegram.pollingStallThresholdMs` 默认为 `120000`；仅在出现误报的轮询停滞重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 回复/引用/转发的补充上下文当前会按接收时原样传递。
    - Telegram allowlist 主要用于控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助功能（CLI/工具/动作）中的可恢复出站 API 错误。

    CLI 发送目标可以是数字 chat ID 或用户名：

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
    - 论坛话题使用 `--thread-id`（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带有 `buttons` 块的 `--presentation` 来设置内联键盘
    - 使用 `--pin` 或 `--delivery '{"pin":true}'` 请求置顶发送，前提是机器人在该聊天中有置顶权限
    - `--force-document` 将出站图片和 GIF 作为文档发送，而不是作为压缩照片或动画媒体上传

    动作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用 Telegram 出站消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保留常规发送功能

  </Accordion>

  <Accordion title="Telegram 中的 exec 批准">
    Telegram 支持在 approver 私信中进行 exec 批准，也可以选择在原始聊天或话题中发布提示。Approver 必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少有一个 approver 可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到来自 `allowFrom` / `defaultTo` 的数字 owner ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    渠道投递会在聊天中显示命令文本；仅应在受信任的群组/话题中启用 `channel` 或 `both`。当提示落在论坛话题中时，OpenClaw 会为批准提示和后续消息保留该话题。Exec 批准默认会在 30 分钟后过期。

    内联批准按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标界面（`dm`、`group` 或 `all`）。带有 `plugin:` 前缀的批准 ID 会通过 plugin 批准解析；其他 ID 会优先通过 exec 批准解析。

    参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，Telegram 可以回复错误文本，也可以抑制该回复。两个配置键控制此行为：

| 键 | 值 | 默认值 | 描述 |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送一条友好的错误消息。`silent` 会完全抑制错误回复。 |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | 同一聊天两次错误回复之间的最短时间。可防止在故障期间刷屏。 |

支持按账号、按群组和按话题覆盖（继承方式与其他 Telegram 配置键相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 在此群组中抑制错误
        },
      },
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="机器人不响应群组中未提及它的消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后将机器人从群组中移除并重新添加
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会给出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法做成员资格探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，群组必须已列出（或包含 `"*"`)
    - 验证机器人是否已加入群组
    - 查看日志：`openclaw logs --follow` 以检查跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略是 `open`，命令授权仍然适用
    - `setMyCommands failed` 且报错 `BOT_COMMANDS_TOO_MUCH`，表示原生命令菜单条目过多；请减少 plugin/Skills/自定义命令，或禁用原生菜单
    - `setMyCommands failed` 且报错网络/fetch 错误，通常表示到 `api.telegram.org` 的 DNS/HTTPS 连通性有问题

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/proxy 可能会在 `AbortSignal` 类型不匹配时触发即时中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站连接可能导致 Telegram API 间歇性失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些视为可恢复网络错误并重试。
    - 如果日志包含 `Polling stall detected`，默认情况下，OpenClaw 会在 120 秒内没有完成的长轮询存活信号后重启轮询并重建 Telegram 传输层。
    - 仅当长时间运行的 `getUpdates` 调用本身正常，但你的主机仍报告误报的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续性停滞通常指向主机与 `api.telegram.org` 之间的 proxy、DNS、IPv6 或 TLS 出站问题。
    - 在直连出站/TLS 不稳定的 VPS 主机上，可通过 `channels.telegram.proxy` 转发 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）和 `dnsResultOrder=ipv4first`。
    - 如果你的主机是 WSL2，或者显式使用仅 IPv4 行为效果更好，可强制设置地址族选择：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准范围地址（`198.18.0.0/15`）默认已被允许用于 Telegram 媒体下载。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他私有/内部/特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选择启用也支持按账号设置：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析到 `198.18.x.x`，请先保持危险标志关闭。Telegram 媒体默认已经允许 RFC 2544 基准范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅应在受信任、由操作方控制的代理环境中使用，例如当 Clash、Mihomo 或 Surge 的 fake-IP 路由在 RFC 2544 基准范围之外生成私有或特殊用途地址答案时。对于普通公网 Telegram 访问，请保持关闭。
    </Warning>

    - 环境变量覆盖（临时）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 验证 DNS 响应：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助： [渠道故障排除](/zh-CN/channels/troubleshooting)。

## Telegram 配置参考指引

主要参考：

- `channels.telegram.enabled`：启用/禁用渠道启动。
- `channels.telegram.botToken`：机器人令牌（BotFather）。
- `channels.telegram.tokenFile`：从常规文件路径读取令牌。不接受符号链接。
- `channels.telegram.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.telegram.allowFrom`：私信 allowlist（数字 Telegram 用户 ID）。`allowlist` 至少要求一个发送者 ID。`open` 要求包含 `"*"`。`openclaw doctor --fix` 可以将旧版 `@username` 条目解析为 ID，也可以在 allowlist 迁移流程中从 pairing-store 文件恢复 allowlist 条目。
- `channels.telegram.actions.poll`：启用或禁用 Telegram 投票创建（默认：启用；但仍要求 `sendMessage`）。
- `channels.telegram.defaultTo`：CLI `--deliver` 在未提供显式 `--reply-to` 时使用的默认 Telegram 目标。
- `channels.telegram.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.telegram.groupAllowFrom`：群组发送者 allowlist（数字 Telegram 用户 ID）。`openclaw doctor --fix` 可以将旧版 `@username` 条目解析为 ID。非数字条目在鉴权时会被忽略。群组鉴权不会使用私信 pairing-store 回退（`2026.2.25+`）。
- 多账号优先级：
  - 当配置了两个或更多账号 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以显式指定默认路由。
  - 如果两者都未设置，OpenClaw 会回退到第一个规范化后的账号 ID，并且 `openclaw doctor` 会发出警告。
  - `channels.telegram.accounts.default.allowFrom` 和 `channels.telegram.accounts.default.groupAllowFrom` 仅适用于 `default` 账号。
  - 当账号级值未设置时，具名账号会继承 `channels.telegram.allowFrom` 和 `channels.telegram.groupAllowFrom`。
  - 具名账号不会继承 `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom`。
- `channels.telegram.groups`：每群组默认值 + allowlist（使用 `"*"` 作为全局默认值）。
  - `channels.telegram.groups.<id>.groupPolicy`：按群组覆盖 `groupPolicy`（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`：提及门控默认值。
  - `channels.telegram.groups.<id>.skills`：Skills 过滤器（省略 = 所有 Skills，空值 = 无）。
  - `channels.telegram.groups.<id>.allowFrom`：按群组覆盖发送者 allowlist。
  - `channels.telegram.groups.<id>.systemPrompt`：该群组的额外系统提示词。
  - `channels.telegram.groups.<id>.enabled`：当为 `false` 时禁用该群组。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`：按话题覆盖（群组字段 + 仅话题字段 `agentId`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`：将此话题路由到特定智能体（覆盖群组级和绑定路由）。
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`：按话题覆盖 `groupPolicy`（`open | allowlist | disabled`）。
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`：按话题覆盖提及门控。
- 顶层 `bindings[]` 中，`type: "acp"` 且在 `match.peer.id` 中使用规范话题 ID `chatId:topic:topicId`：持久化 ACP 话题绑定字段（参见 [ACP Agents](/zh-CN/tools/acp-agents#channel-specific-settings)）。
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`：将私信话题路由到特定智能体（行为与论坛话题相同）。
- `channels.telegram.execApprovals.enabled`：为此账号启用 Telegram 作为基于聊天的 exec 批准客户端。
- `channels.telegram.execApprovals.approvers`：允许批准或拒绝 exec 请求的 Telegram 用户 ID。当 `channels.telegram.allowFrom` 或直接的 `channels.telegram.defaultTo` 已标识 owner 时，此项可选。
- `channels.telegram.execApprovals.target`：`dm | channel | both`（默认：`dm`）。`channel` 和 `both` 会在存在时保留原始 Telegram 话题。
- `channels.telegram.execApprovals.agentFilter`：转发批准提示的可选智能体 ID 过滤器。
- `channels.telegram.execApprovals.sessionFilter`：转发批准提示的可选会话键过滤器（子串或正则）。
- `channels.telegram.accounts.<account>.execApprovals`：按账号覆盖 Telegram exec 批准路由和 approver 授权。
- `channels.telegram.capabilities.inlineButtons`：`off | dm | group | all | allowlist`（默认：allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`：按账号覆盖。
- `channels.telegram.commands.nativeSkills`：启用/禁用 Telegram 原生 Skills 命令。
- `channels.telegram.replyToMode`：`off | first | all`（默认：`off`）。
- `channels.telegram.textChunkLimit`：出站分块大小（字符数）。
- `channels.telegram.chunkMode`：`length`（默认）或 `newline`，表示在按长度分块前先按空行（段落边界）拆分。
- `channels.telegram.linkPreview`：切换出站消息的链接预览（默认：true）。
- `channels.telegram.streaming`：`off | partial | block | progress`（实时流式预览；默认：`partial`；`progress` 会映射为 `partial`；`block` 用于兼容旧版预览模式）。Telegram 预览流式传输使用单条预览消息并原地编辑。
- `channels.telegram.streaming.preview.toolProgress`：当预览流式传输激活时，复用实时预览消息来显示工具/进度更新（默认：`true`）。设为 `false` 可保留单独的工具/进度消息。
- `channels.telegram.mediaMaxMb`：Telegram 入站/出站媒体上限（MB，默认：100）。
- `channels.telegram.retry`：Telegram 发送辅助功能（CLI/工具/动作）在可恢复出站 API 错误上的重试策略（attempts、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`：覆盖 Node `autoSelectFamily`（true=启用，false=禁用）。在 Node 22+ 上默认启用，而 WSL2 默认禁用。
- `channels.telegram.network.dnsResultOrder`：覆盖 DNS 结果顺序（`ipv4first` 或 `verbatim`）。在 Node 22+ 上默认值为 `ipv4first`。
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`：危险的选择性启用项，适用于受信任的 fake-IP 或透明代理环境，即 Telegram 媒体下载会将 `api.telegram.org` 解析为默认 RFC 2544 基准范围允许列表之外的私有/内部/特殊用途地址。
- `channels.telegram.proxy`：Bot API 调用的代理 URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`：启用 Webhook 模式（要求 `channels.telegram.webhookSecret`）。
- `channels.telegram.webhookSecret`：Webhook 密钥（设置 `webhookUrl` 时必填）。
- `channels.telegram.webhookPath`：本地 Webhook 路径（默认 `/telegram-webhook`）。
- `channels.telegram.webhookHost`：本地 Webhook 绑定主机（默认 `127.0.0.1`）。
- `channels.telegram.webhookPort`：本地 Webhook 绑定端口（默认 `8787`）。
- `channels.telegram.actions.reactions`：门控 Telegram 工具表情回应。
- `channels.telegram.actions.sendMessage`：门控 Telegram 工具消息发送。
- `channels.telegram.actions.deleteMessage`：门控 Telegram 工具消息删除。
- `channels.telegram.actions.sticker`：门控 Telegram 贴纸动作——发送和搜索（默认：false）。
- `channels.telegram.reactionNotifications`：`off | own | all` —— 控制哪些表情回应会触发系统事件（未设置时默认：`own`）。
- `channels.telegram.reactionLevel`：`off | ack | minimal | extensive` —— 控制智能体的表情回应能力（未设置时默认：`minimal`）。
- `channels.telegram.errorPolicy`：`reply | silent` —— 控制错误回复行为（默认：`reply`）。支持按账号/群组/话题覆盖。
- `channels.telegram.errorCooldownMs`：同一聊天两次错误回复之间的最小毫秒数（默认：`60000`）。可防止在故障期间刷屏。

- [配置参考 - Telegram](/zh-CN/gateway/configuration-reference#telegram)

Telegram 专属高信号字段：

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；不接受符号链接）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- exec 批准：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- Webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 动作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

## 相关内容

- [配对](/zh-CN/channels/pairing)
- [群组](/zh-CN/channels/groups)
- [安全](/zh-CN/gateway/security)
- [渠道路由](/zh-CN/channels/channel-routing)
- [多智能体路由](/zh-CN/concepts/multi-agent)
- [故障排除](/zh-CN/channels/troubleshooting)

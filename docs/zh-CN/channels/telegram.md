---
read_when:
    - 开发 Telegram 功能或 webhook
summary: Telegram 机器人支持状态、功能与配置
title: Telegram
x-i18n:
    generated_at: "2026-04-24T03:37:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdd6ea0277e074f90306f91d51fd329c6914de85dde0ae09a731713f1bba98d9
    source_path: channels/telegram.md
    workflow: 15
---

可通过 grammY 用于机器人私信和群组，已达到生产可用级别。长轮询是默认模式；webhook 模式为可选。

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

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    打开 Telegram 并与 **@BotFather** 聊天（确认用户名严格为 `@BotFather`）。

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

    环境变量回退：`TELEGRAM_BOT_TOKEN=...`（仅适用于默认账户）。
    Telegram **不会** 使用 `openclaw channels login telegram`；请在配置 / 环境变量中设置令牌，然后启动 Gateway 网关。

  </Step>

  <Step title="启动 Gateway 网关并批准首个私信">

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
令牌解析顺序会感知账户。在实际使用中，配置值优先于环境变量回退，而 `TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
</Note>

## Telegram 侧设置

<AccordionGroup>
  <Accordion title="隐私模式与群组可见性">
    Telegram 机器人默认启用**隐私模式**，这会限制它们能接收到的群组消息。

    如果机器人必须看到所有群组消息，可选择以下任一方式：

    - 通过 `/setprivacy` 关闭隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式后，请在每个群组中移除并重新添加机器人，以便 Telegram 应用该变更。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。

    管理员机器人会接收所有群组消息，这对于始终在线的群组行为很有用。

  </Accordion>

  <Accordion title="BotFather 中有用的开关">

    - `/setjoingroups`：允许 / 禁止加入群组
    - `/setprivacy`：控制群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制与激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `channels.telegram.allowFrom` 接受数字形式的 Telegram 用户 ID。支持 `telegram:` / `tg:` 前缀，并会被标准化。
    如果 `dmPolicy: "allowlist"` 但 `allowFrom` 为空，则会阻止所有私信，并在配置校验时被拒绝。
    设置流程只会请求数字用户 ID。
    如果你升级后发现配置中包含 `@username` 形式的 allowlist 条目，请运行 `openclaw doctor --fix` 进行解析（尽力而为；需要 Telegram 机器人令牌）。
    如果你此前依赖配对存储的 allowlist 文件，`openclaw doctor --fix` 也可以在 allowlist 流程中将这些条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 尚未配置显式 ID 时）。

    对于单一所有者的机器人，推荐使用 `dmPolicy: "allowlist"` 并显式填写数字 `allowFrom` ID，以便将访问策略稳定保存在配置中（而不是依赖先前的配对批准）。

    常见误解：私信配对获批并不意味着“此发送者在任何地方都已获授权”。
    配对只授予私信访问权限。群组发送者授权仍然来自显式配置的 allowlist。
    如果你希望实现“我只授权一次，私信和群组命令都能使用”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`。

    ### 查找你的 Telegram 用户 ID

    更安全的方法（无需第三方机器人）：

    1. 向你的机器人发送私信。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略与 allowlist">
    有两个控制项会共同生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 没有 `groups` 配置：
         - 当 `groupPolicy: "open"` 时：任何群组都可以通过 group ID 检查
         - 当 `groupPolicy: "allowlist"`（默认）时：在你添加 `groups` 条目（或 `"*"`）之前，所有群组都会被阻止
       - 已配置 `groups`：其行为就是 allowlist（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字形式的 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被标准化）。
    不要将 Telegram 群组或超级群组 chat ID 放入 `groupAllowFrom`。负数 chat ID 应放在 `channels.telegram.groups` 下。
    非数字条目会在发送者授权中被忽略。
    安全边界（`2026.2.25+`）：群组发送者授权**不会**继承私信配对存储中的批准记录。
    配对仍然仅适用于私信。对于群组，请设置 `groupAllowFrom` 或每群组 / 每话题的 `allowFrom`。
    如果 `groupAllowFrom` 未设置，Telegram 会回退到配置中的 `allowFrom`，而不是配对存储。
    对于单一所有者机器人，一个实用模式是：将你的用户 ID 设置到 `channels.telegram.allowFrom`，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果 `channels.telegram` 完全缺失，运行时默认会采用失败即关闭的 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

    示例：允许某个指定群组中的任意成员：

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

    示例：只允许某个指定群组中的特定用户：

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

      - 像 `-1001234567890` 这样的负数 Telegram 群组或超级群组 chat ID，应放在 `channels.telegram.groups` 下。
      - 像 `8734062810` 这样的 Telegram 用户 ID，应放在 `groupAllowFrom` 下，用于限制允许群组内哪些人可以触发机器人。
      - 只有在你希望允许群组中的任意成员都能与机器人对话时，才使用 `groupAllowFrom: ["*"]`。
    </Warning>

  </Tab>

  <Tab title="提及行为">
    默认情况下，群组回复需要被提及。

    提及可来自：

    - 原生 `@botusername` 提及，或
    - 以下位置中的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令开关：

    - `/activation always`
    - `/activation mention`

    这些只会更新会话状态。若要持久化，请使用配置。

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

    获取群组 chat ID 的方法：

    - 将群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 中读取 `chat.id`
    - 或查看 Bot API `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程统一管理。
- 路由是确定性的：Telegram 入站消息会回复到 Telegram（模型不会自行选择渠道）。
- 入站消息会标准化为共享的渠道信封格式，带有回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会使用感知线程的会话键进行路由，并为回复保留 thread ID。
- 长轮询使用 grammY runner，并按每个聊天 / 每个线程进行顺序处理。整体 runner sink 并发数使用 `agents.defaults.maxConcurrent`。
- 默认情况下，若 120 秒内没有完成 `getUpdates` 活跃检查，则会触发长轮询 watchdog 重启。只有当你的部署在长时间运行任务期间仍然出现误判的 polling-stall 重启时，才增加 `channels.telegram.pollingStallThresholdMs`。该值的单位为毫秒，允许范围为 `30000` 到 `600000`；支持按账户覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 可以实时流式显示部分回复：

    - 私聊：预览消息 + `editMessageText`
    - 群组 / 话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - `progress` 在 Telegram 上会映射为 `partial`（兼容跨渠道命名）
    - `streaming.preview.toolProgress` 控制工具 / 进度更新是否复用同一个被编辑的预览消息（默认：`true`）。设为 `false` 可保留独立的工具 / 进度消息。
    - 旧版 `channels.telegram.streamMode` 和布尔型 `streaming` 值会被自动映射

    对于纯文本回复：

    - 私信：OpenClaw 会保留同一个预览消息，并原地执行最终编辑（不会发送第二条消息）
    - 群组 / 话题：OpenClaw 会保留同一个预览消息，并原地执行最终编辑（不会发送第二条消息）

    对于复杂回复（例如媒体负载），OpenClaw 会回退到常规最终投递，然后清理预览消息。

    预览流式传输独立于分块流式传输。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    如果原生草稿传输不可用 / 被拒绝，OpenClaw 会自动回退到 `sendMessage` + `editMessageText`。

    Telegram 专属推理流：

    - `/reasoning stream` 会在生成期间将推理内容发送到实时预览
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化与 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会被渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝已解析的 HTML，OpenClaw 会重试为纯文本。

    链接预览默认启用，可通过 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令与自定义命令">
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

    - 名称会被标准化（去除前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突 / 重复项会被跳过并记录日志

    说明：

    - 自定义命令仅是菜单项；不会自动实现行为
    - 即使未显示在 Telegram 菜单中，插件 / Skills 命令在手动输入时仍可工作

    如果禁用原生命令，内置命令会被移除。自定义 / 插件命令如果已配置，仍可能会注册。

    常见设置失败：

    - `setMyCommands failed` 且报错 `BOT_COMMANDS_TOO_MUCH`，表示即使在裁剪后 Telegram 菜单仍然超出限制；请减少插件 / Skills / 自定义命令数量，或禁用 `channels.telegram.commands.native`。
    - `setMyCommands failed` 且报错网络 / fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS / HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴该代码
    3. `/pair pending` 列出待处理请求（包括角色 / scopes）
    4. 批准请求：
       - `/pair approve <requestId>`：显式批准
       - `/pair approve`：当只有一个待处理请求时使用
       - `/pair approve latest`：批准最新请求

    该设置代码携带一个短期有效的 bootstrap token。内置 bootstrap 交接会将主节点 token 保持为 `scopes: []`；任何已交接的 operator token 都会被限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap scope 检查带有角色前缀，因此该 operator allowlist 仅满足 operator 请求；非 operator 角色仍需要其自身角色前缀下的 scopes。

    如果设备以变更后的认证详情重试（例如角色 / scopes / 公钥），之前的待处理请求会被新请求取代，而新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

    更多详情： [配对](/zh-CN/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘范围：

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

    按账户覆盖：

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

    范围：

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

  <Accordion title="面向智能体与自动化的 Telegram 消息动作">
    Telegram 工具动作包括：

    - `sendMessage`（`to`、`content`、可选的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选的 `iconColor`、`iconCustomEmojiId`）

    渠道消息动作提供了更易用的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    控制开关：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用的是当前生效的配置 / secrets 快照（启动 / 重载时），因此动作路径不会在每次发送时执行临时的 SecretRef 重新解析。

    移除 reaction 的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]`：回复触发消息
    - `[[reply_to:<id>]]`：回复指定的 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。

  </Accordion>

  <Accordion title="论坛话题与线程行为">
    论坛超级群组：

    - 话题会话键会追加 `:topic:<threadId>`
    - 回复与输入状态会发送到对应的话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规话题（`threadId=1`）特殊情况：

    - 发送消息时会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 输入动作仍会包含 `message_thread_id`

    话题继承：除非被覆盖，话题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 是话题专属项，不会从群组默认值继承。

    **按话题分配智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这让每个话题拥有各自隔离的工作区、记忆和会话。示例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 常规话题 → main 智能体
                "3": { agentId: "zu" },        // 开发话题 → zu 智能体
                "5": { agentId: "coder" }      // 代码审查 → coder 智能体
              }
            }
          }
        }
      }
    }
    ```

    此后，每个话题都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久化 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定来固定 ACP harness 会话（`bindings[]` 中使用 `type: "acp"`，并设置 `match.channel: "telegram"`、`peer.kind: "group"`，以及带话题限定的 id，例如 `-1001234567890:topic:42`）。当前仅适用于群组 / 超级群组中的论坛话题。参见 [ACP Agents](/zh-CN/tools/acp-agents)。

    **从聊天中生成线程绑定的 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到一个新的 ACP 会话；后续消息会直接路由到该会话。OpenClaw 会在当前话题中固定生成确认消息。要求 `channels.telegram.threadBindings.spawnAcpSessions=true`。

    模板上下文会暴露 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天仍保持私信路由，但会使用感知线程的会话键。

  </Accordion>

  <Accordion title="音频、视频与贴纸">
    ### 音频消息

    Telegram 会区分语音便笺和音频文件。

    - 默认：按音频文件行为处理
    - 在智能体回复中加入标签 `[[audio_as_voice]]` 可强制按语音便笺发送

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

    Telegram 会区分视频文件和视频便笺。

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

    视频便笺不支持标题说明；如果提供了消息文本，会单独发送。

    ### 贴纸

    入站贴纸处理：

    - 静态 WEBP：下载并处理（占位符为 `<media:sticker>`）
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

    贴纸会在可能的情况下仅描述一次并缓存，以减少重复的视觉调用。

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

  <Accordion title="Reaction 通知">
    Telegram reaction 会以 `message_reaction` 更新形式到达（独立于消息负载）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅针对用户对机器人发送消息的 reaction（尽力通过已发送消息缓存实现）。
    - Reaction 事件仍遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在 reaction 更新中提供线程 ID。
      - 非论坛群组会路由到群聊会话
      - 论坛群组会路由到群组的常规话题会话（`:topic:1`），而不是精确的原始话题

    轮询 / webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认 Reaction">
    `ackReaction` 会在 OpenClaw 处理入站消息期间发送一个确认 emoji。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体 identity emoji 回退（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Telegram 需要使用 unicode emoji（例如 "👀"）。
    - 使用 `""` 可为某个渠道或账户禁用该 reaction。

  </Accordion>

  <Accordion title="来自 Telegram 事件和命令的配置写入">
    渠道配置写入默认启用（`configWrites !== false`）。

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

  <Accordion title="长轮询与 webhook">
    默认使用长轮询。若要使用 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；还可选设置 `webhookPath`、`webhookHost`、`webhookPort`（默认分别为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本地监听器会绑定到 `127.0.0.1:8787`。对于公网入口，请在本地端口前放置反向代理，或有意将 `webhookHost` 设置为 `"0.0.0.0"`。

  </Accordion>

  <Accordion title="限制、重试与 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会优先按段落边界（空行）分割，再按长度分割。
    - `channels.telegram.mediaMaxMb`（默认 100）限制 Telegram 入站和出站媒体大小。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时（如果未设置，则使用 grammY 默认值）。
    - `channels.telegram.pollingStallThresholdMs` 默认为 `120000`；仅在出现 polling-stall 误报重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - reply / quote / forward 补充上下文当前会按接收时原样传递。
    - Telegram allowlist 主要用于控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助器（CLI / 工具 / 动作），用于处理可恢复的出站 API 错误。

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

    Telegram 专属投票标志：

    - `--poll-duration-seconds`（5 - 600）
    - `--poll-anonymous`
    - `--poll-public`
    - 论坛话题使用 `--thread-id`（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带有 `buttons` 块的 `--presentation` 来实现内联键盘
    - `--pin` 或 `--delivery '{"pin":true}'`，用于在机器人有权限固定消息的聊天中请求固定投递
    - `--force-document`，用于将出站图片和 GIF 作为文档发送，而不是作为压缩照片或动画媒体上传

    动作控制：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，但保留常规发送功能

  </Accordion>

  <Accordion title="Telegram 中的 exec 批准">
    Telegram 支持在批准者私信中进行 exec 批准，也可选择在原始聊天或话题中发布提示。批准者必须是数字形式的 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少有一个批准者可解析时会自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到来自 `allowFrom` / `defaultTo` 的数字所有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    渠道投递会在聊天中显示命令文本；仅在受信任的群组 / 话题中启用 `channel` 或 `both`。当提示落在论坛话题中时，OpenClaw 会为批准提示及其后续消息保留该话题。exec 批准默认会在 30 分钟后过期。

    内联批准按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。带有 `plugin:` 前缀的批准 ID 会通过插件批准解析；其他 ID 会优先通过 exec 批准解析。

    参见 [Exec approvals](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递错误或提供商错误时，Telegram 可以回复错误文本，也可以将其静默。两个配置键控制此行为：

| Key                                 | 值                | 默认值  | 说明                                                                                           |
| ----------------------------------- | ----------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送友好的错误消息。`silent` 会完全抑制错误回复。 |
| `channels.telegram.errorCooldownMs` | 数字（毫秒）      | `60000` | 同一聊天两次错误回复之间的最短时间。可防止服务中断期间错误刷屏。        |

支持按账户、按群组和按话题覆盖（继承规则与其他 Telegram 配置键相同）。

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
  <Accordion title="机器人不响应未提及的群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完全可见。
      - BotFather：`/setprivacy` -> Disable
      - 然后将机器人从群组中移除并重新添加
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可检查显式数字群组 ID；通配符 `"*"` 无法执行成员关系探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，必须列出该群组（或包含 `"*"`）
    - 验证机器人已加入该群组
    - 查看日志：使用 `openclaw logs --follow` 检查跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和 / 或数字 `allowFrom`）
    - 即使群组策略是 `open`，命令授权仍然适用
    - `setMyCommands failed` 且报错 `BOT_COMMANDS_TOO_MUCH`，表示原生命令菜单条目过多；请减少插件 / Skills / 自定义命令，或禁用原生菜单
    - `setMyCommands failed` 且报错网络 / fetch 错误，通常表示到 `api.telegram.org` 的 DNS / HTTPS 可达性存在问题

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch / 代理，如果 AbortSignal 类型不匹配，可能触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站链路可能导致 Telegram API 间歇性失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些视为可恢复网络错误并重试。
    - 如果日志包含 `Polling stall detected`，默认情况下，OpenClaw 会在 120 秒内没有完成长轮询活跃检查后重启轮询并重建 Telegram 传输层。
    - 仅当长时间运行的 `getUpdates` 调用本身健康，但你的主机仍报告 polling-stall 误报重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续卡住通常表明主机与 `api.telegram.org` 之间存在代理、DNS、IPv6 或 TLS 出站问题。
    - 在直连出站 / TLS 不稳定的 VPS 主机上，可通过 `channels.telegram.proxy` 转发 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）和 `dnsResultOrder=ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下工作更稳定，请强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准测试地址范围（`198.18.0.0/15`）默认已允许用于 Telegram 媒体下载。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他私有 / 内部 / 特殊用途地址，你可以选择启用 Telegram 专属绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 相同的启用项也支持按账户配置，路径为
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析到 `198.18.x.x`，请先保持危险标志关闭。Telegram 媒体默认已经允许 RFC 2544 基准测试范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 保护。只有在受信任、由操作员控制的代理环境中，例如 Clash、Mihomo 或 Surge 的 fake-IP 路由，在其生成 RFC 2544 基准测试范围之外的私有或特殊用途地址时，才应使用它。对于普通公网 Telegram 访问，请保持关闭。
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

## 配置参考

主要参考： [Configuration reference - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="高信号 Telegram 字段">

- 启动 / 认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；不接受符号链接）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- exec 批准：`execApprovals`、`accounts.*.execApprovals`
- 命令 / 菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程 / 回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化 / 投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体 / 网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 动作 / 能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入 / 历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账户优先级：当配置了两个或更多账户 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`），以显式指定默认路由。否则，OpenClaw 会回退到第一个标准化账户 ID，并由 `openclaw doctor` 发出警告。命名账户会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 的值。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户与 Gateway 网关配对。
  </Card>
  <Card title="Groups" icon="users" href="/zh-CN/channels/groups">
    群组和话题 allowlist 行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型与加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将群组和话题映射到智能体。
  </Card>
  <Card title="故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

---
read_when:
    - 处理 Telegram 功能或 webhook
summary: Telegram 机器人支持状态、功能和配置
title: Telegram
x-i18n:
    generated_at: "2026-04-25T04:09:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41d835e7b50a3a38fed62f252b1810475204beca4a4dd0f2b42ddaa3507deeab
    source_path: channels/telegram.md
    workflow: 15
---

通过 grammY 为机器人私信和群组提供可投入生产的支持。Long polling 是默认模式；webhook 模式为可选。

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
    打开 Telegram 并与 **@BotFather** 对话（确认用户名严格为 `@BotFather`）。

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

    环境变量回退：`TELEGRAM_BOT_TOKEN=...`（仅默认账户）。
    Telegram **不** 使用 `openclaw channels login telegram`；请在配置或环境变量中配置令牌，然后启动 Gateway 网关。

  </Step>

  <Step title="启动 Gateway 网关并批准第一条私信">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配对码将在 1 小时后过期。

  </Step>

  <Step title="将机器人添加到群组">
    将机器人添加到你的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy` 以匹配你的访问模型。
  </Step>
</Steps>

<Note>
令牌解析顺序会识别账户。在实际情况下，配置值优先于环境变量回退，而 `TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用 **隐私模式**，这会限制它们能接收到的群组消息。

    如果机器人必须看到所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式后，请在每个群组中移除机器人再重新添加，这样 Telegram 才会应用更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。

    具有管理员身份的机器人会接收所有群组消息，这对始终在线的群组行为很有用。

  </Accordion>

  <Accordion title="BotFather 中有用的开关">

    - `/setjoingroups`：允许或拒绝加入群组
    - `/setprivacy`：控制群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`（要求在 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `channels.telegram.allowFrom` 接受 Telegram 数字用户 ID。支持 `telegram:` / `tg:` 前缀，并会自动标准化。
    `dmPolicy: "allowlist"` 且 `allowFrom` 为空时会阻止所有私信，并被配置校验拒绝。
    设置时只会要求填写数字用户 ID。
    如果你已升级且配置中包含 `@username` allowlist 条目，请运行 `openclaw doctor --fix` 进行解析（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖配对存储 allowlist 文件，`openclaw doctor --fix` 可以在 allowlist 流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单一所有者机器人，建议优先使用 `dmPolicy: "allowlist"` 并在 `allowFrom` 中显式填写数字 ID，这样访问策略会稳定保存在配置中（而不是依赖过去的配对批准）。

    常见误解：私信配对批准并不表示“这个发送者在任何地方都已获授权”。
    配对只授予私信访问权限。群组发送者授权仍然来自显式配置 allowlist。
    如果你希望“我授权一次后，私信和群组命令都能工作”，请把你的 Telegram 数字用户 ID 放入 `channels.telegram.allowFrom`。

    ### 查找你的 Telegram 用户 ID

    更安全的方法（无需第三方机器人）：

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
       - 没有 `groups` 配置：
         - 配合 `groupPolicy: "open"`：任何群组都可以通过群组 ID 检查
         - 配合 `groupPolicy: "allowlist"`（默认）：在你添加 `groups` 条目（或 `"*"`）之前，群组会被阻止
       - 已配置 `groups`：其行为就是 allowlist（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为 Telegram 数字用户 ID（`telegram:` / `tg:` 前缀会被标准化）。
    不要把 Telegram 群组或超级群组 chat ID 放在 `groupAllowFrom` 中。负数 chat ID 应放在 `channels.telegram.groups` 下。
    非数字条目会在发送者授权时被忽略。
    安全边界（`2026.2.25+`）：群组发送者授权 **不会** 继承私信配对存储中的批准记录。
    配对仍然只用于私信。对于群组，请设置 `groupAllowFrom` 或每个群组 / 每个主题的 `allowFrom`。
    如果 `groupAllowFrom` 未设置，Telegram 会回退到配置中的 `allowFrom`，而不是配对存储。
    单一所有者机器人的实用模式：将你的用户 ID 设置到 `channels.telegram.allowFrom`，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果 `channels.telegram` 完全缺失，运行时默认会采用失败即关闭的 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

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

      - 将 `-1001234567890` 这样的 Telegram 群组或超级群组负数 chat ID 放在 `channels.telegram.groups` 下。
      - 当你想限制允许群组内哪些人可以触发机器人时，将 `8734062810` 这样的 Telegram 用户 ID 放在 `groupAllowFrom` 下。
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

    这些仅更新会话状态。要持久保存，请使用配置。

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

    - 将群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 中读取 `chat.id`
    - 或查看 Bot API `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程持有。
- 路由是确定性的：Telegram 入站回复会返回到 Telegram（模型不会选择渠道）。
- 入站消息会被标准化为共享渠道信封格式，并带有回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛主题会追加 `:topic:<threadId>` 以保持主题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会使用具备线程感知能力的会话键进行路由，并在回复中保留线程 ID。
- Long polling 使用 grammY runner，并按每个 chat / 每个线程顺序处理。runner sink 的整体并发数使用 `agents.defaults.maxConcurrent`。
- 默认情况下，如果在 120 秒内没有完成的 `getUpdates` 存活信号，Long-polling watchdog 会触发重启。只有在你的部署中仍然出现误判的 polling-stall 重启且任务运行时间较长时，才增加 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围是 `30000` 到 `600000`；支持按账户覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 私聊：预览消息 + `editMessageText`
    - 群组 / 主题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - `progress` 在 Telegram 上映射为 `partial`（与跨渠道命名兼容）
    - `streaming.preview.toolProgress` 控制工具 / 进度更新是否复用同一条已编辑的预览消息（默认：当预览流式传输处于激活状态时为 `true`）
    - 旧版 `channels.telegram.streamMode` 和布尔型 `streaming` 值会被自动映射

    工具进度预览更新是工具运行时显示的简短“Working...”提示行，例如命令执行、文件读取、计划更新或补丁摘要。Telegram 默认保持启用这些内容，以匹配 `v2026.4.22` 及之后已发布的 OpenClaw 行为。若你希望保留用于回答文本的已编辑预览，但隐藏工具进度行，请设置：

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

    仅当你想完全禁用 Telegram 预览编辑时，才使用 `streaming.mode: "off"`。如果你只想禁用工具进度状态行，请使用 `streaming.preview.toolProgress: false`。

    对于纯文本回复：

    - 私信：OpenClaw 会保留同一条预览消息，并在原位执行最终编辑（不会发送第二条消息）
    - 群组 / 主题：OpenClaw 会保留同一条预览消息，并在原位执行最终编辑（不会发送第二条消息）

    对于复杂回复（例如媒体负载），OpenClaw 会回退到正常的最终发送方式，然后清理预览消息。

    预览流式传输与分块流式传输是分开的。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

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
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "创建图像" },
      ],
    },
  },
}
```

    规则：

    - 名称会被标准化（去掉前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度为 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突或重复项会被跳过并记录日志

    说明：

    - 自定义命令仅是菜单项；它们不会自动实现行为
    - 即使未显示在 Telegram 菜单中，plugin / skill 命令在手动输入时仍可工作

    如果禁用了原生命令，内置命令会被移除。如果已配置，自定义 / plugin 命令仍可能注册。

    常见设置失败：

    - 出现 `setMyCommands failed` 且错误为 `BOT_COMMANDS_TOO_MUCH`，表示 Telegram 菜单在裁剪后仍然超限；请减少 plugin / skill / 自定义命令，或禁用 `channels.telegram.commands.native`。
    - 出现 `setMyCommands failed` 且为 network / fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS / HTTPS 被阻止。

    ### 设备配对命令（`device-pair` plugin）

    安装 `device-pair` plugin 后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴该代码
    3. `/pair pending` 列出待处理请求（包括角色 / scopes）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 当只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码带有短期有效的 bootstrap token。内置 bootstrap 交接会将主节点 token 保持为 `scopes: []`；任何被交接的 operator token 都会限制在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write` 范围内。Bootstrap scope 检查使用角色前缀，因此该 operator allowlist 仅满足 operator 请求；非 operator 角色仍需要其自身角色前缀下的 scopes。

    如果设备使用变更后的认证详情重试（例如角色 / scopes / 公钥），之前的待处理请求会被替代，新请求会使用不同的 `requestId`。请在批准前重新运行 `/pair pending`。

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
  message: "选择一个选项：",
  buttons: [
    [
      { text: "是", callback_data: "yes" },
      { text: "否", callback_data: "no" },
    ],
    [{ text: "取消", callback_data: "cancel" }],
  ],
}
```

    回调点击会作为文本传递给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="供智能体和自动化使用的 Telegram 消息动作">
    Telegram 工具动作包括：

    - `sendMessage`（`to`、`content`、可选的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选的 `iconColor`、`iconCustomEmojiId`）

    渠道消息动作公开更易用的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    控制开关：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用当前活动的配置 / secrets 快照（启动 / 重载时），因此动作路径不会在每次发送时临时重新解析 SecretRef。

    移除 reaction 的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复指定的 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。

  </Accordion>

  <Accordion title="论坛主题和线程行为">
    论坛超级群组：

    - 主题会话键会追加 `:topic:<threadId>`
    - 回复和输入状态会定向到主题线程
    - 主题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规主题（`threadId=1`）特殊情况：

    - 发送消息时省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 输入中动作仍然包含 `message_thread_id`

    主题继承：除非被覆盖，主题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅属于主题级别，不会从群组默认值继承。

    **按主题路由智能体**：每个主题都可以通过在主题配置中设置 `agentId` 路由到不同的智能体。这会让每个主题拥有各自隔离的工作区、记忆和会话。示例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 常规主题 → main 智能体
                "3": { agentId: "zu" },        // 开发主题 → zu 智能体
                "5": { agentId: "coder" }      // 代码审查 → coder 智能体
              }
            }
          }
        }
      }
    }
    ```

    之后，每个主题都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 主题绑定**：论坛主题可以通过顶层类型化 ACP 绑定（`bindings[]`，其中 `type: "acp"`，`match.channel: "telegram"`，`peer.kind: "group"`，以及带主题限定的 ID，如 `-1001234567890:topic:42`）固定到 ACP harness 会话。目前仅适用于群组 / 超级群组中的论坛主题。参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **来自聊天的线程绑定 ACP 派生**：`/acp spawn <agent> --thread here|auto` 会将当前主题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会将派生确认固定在主题内。要求 `channels.telegram.threadBindings.spawnAcpSessions=true`。

    模板上下文会公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保持私信路由，但使用具备线程感知能力的会话键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 区分语音便笺和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 以强制作为语音便笺发送

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

    Telegram 区分视频文件和视频便笺。

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

    视频便笺不支持说明文字；如果提供了消息文本，会单独发送。

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

    搜索已缓存贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "挥手的猫",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction 通知">
    Telegram reaction 会作为 `message_reaction` 更新到达（与消息负载分开）。

    启用后，OpenClaw 会将系统事件加入队列，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅处理用户对机器人已发送消息的 reaction（尽力而为，依赖已发送消息缓存）。
    - Reaction 事件仍遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在 reaction 更新中提供线程 ID。
      - 非论坛群组会路由到群组聊天会话
      - 论坛群组会路由到群组常规主题会话（`:topic:1`），而不是确切的原始主题

    用于 polling / webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 `"👀"`）

    说明：

    - Telegram 需要 unicode emoji（例如 `"👀"`）。
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

  <Accordion title="Long polling 与 webhook">
    默认是 Long polling。要使用 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选项包括 `webhookPath`、`webhookHost`、`webhookPort`（默认分别为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本地监听器绑定到 `127.0.0.1:8787`。对于公网入口，可以在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会在按长度拆分之前优先按段落边界（空行）拆分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制 Telegram 入站和出站媒体大小。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时（如果未设置，则使用 grammY 默认值）。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；仅在出现 polling-stall 误报重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 回复 / 引用 / 转发的补充上下文当前会按接收时原样传递。
    - Telegram allowlist 主要用于限制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI / 工具 / 动作）中的可恢复出站 API 错误。

    CLI 发送目标可以是数字 chat ID 或用户名：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 投票使用 `openclaw message poll`，并支持论坛主题：

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
    - 论坛主题使用 `--thread-id`（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带有 `buttons` 块的 `--presentation` 作为内联键盘
    - 使用 `--pin` 或 `--delivery '{"pin":true}'` 请求固定发送，前提是机器人在该聊天中有固定权限
    - `--force-document` 将出站图像和 GIF 作为文档发送，而不是压缩照片或动画媒体上传

    动作开关：

    - `channels.telegram.actions.sendMessage=false` 会禁用 Telegram 出站消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保留常规发送功能

  </Accordion>

  <Accordion title="Telegram 中的 exec 批准">
    Telegram 支持在 approver 私信中进行 exec 批准，也可以选择在来源聊天或主题中发布提示。Approver 必须是 Telegram 数字用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少有一个 approver 可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到来自 `allowFrom` / `defaultTo` 的数字所有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    渠道发送会在聊天中显示命令文本；仅在受信任的群组 / 主题中启用 `channel` 或 `both`。当提示落在论坛主题中时，OpenClaw 会为批准提示及其后续消息保留该主题。默认情况下，exec 批准会在 30 分钟后过期。

    内联批准按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的批准 ID 会通过 plugin 批准解析；其他则会优先通过 exec 批准解析。

    参见 [Exec 批准](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到发送或提供商错误时，Telegram 可以回复错误文本，也可以抑制错误回复。两个配置键控制此行为：

| 键                                  | 值                | 默认值  | 描述                                                                                      |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送友好的错误消息。`silent` 会完全抑制错误回复。                         |
| `channels.telegram.errorCooldownMs` | 数字（毫秒）      | `60000` | 同一聊天两次错误回复之间的最短时间。可防止在故障期间出现错误刷屏。                        |

支持按账户、按群组和按主题覆盖（继承规则与其他 Telegram 配置键相同）。

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
      - 然后移除机器人并重新添加到群组
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法执行成员资格探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，群组必须已列出（或包含 `"*"`）
    - 验证机器人是否在群组中
    - 查看日志：`openclaw logs --follow` 以获取跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和 / 或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - 出现 `setMyCommands failed` 且错误为 `BOT_COMMANDS_TOO_MUCH`，表示原生命令菜单条目过多；请减少 plugin / skill / 自定义命令，或禁用原生菜单
    - 出现 `setMyCommands failed` 且为 network / fetch 错误，通常表示到 `api.telegram.org` 的 DNS / HTTPS 可达性存在问题

  </Accordion>

  <Accordion title="Polling 或网络不稳定">

    - Node 22+ + 自定义 fetch / proxy 如果 AbortSignal 类型不匹配，可能触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站连接可能导致 Telegram API 间歇性失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将其作为可恢复网络错误重试。
    - 如果日志包含 `Polling stall detected`，默认情况下 OpenClaw 会在 120 秒内没有完成的 long-poll 存活信号后重启 polling，并重建 Telegram 传输。
    - 仅当长时间运行的 `getUpdates` 调用本身健康，但你的主机仍报告 polling-stall 误报重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续的 stall 通常表明主机与 `api.telegram.org` 之间存在 proxy、DNS、IPv6 或 TLS 出站问题。
    - 在直连出站 / TLS 不稳定的 VPS 主机上，可通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）和 `dnsResultOrder=ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下表现更好，请强制设置地址族选择：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 默认情况下，Telegram 媒体下载已允许 RFC 2544 基准范围应答（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他私有 / 内部 / 特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选择启用也可按账户设置，路径为
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持危险标志关闭。Telegram 媒体默认已经允许 RFC 2544 基准范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅应在受信任、由操作员控制的代理环境中使用，例如 Clash、Mihomo 或 Surge 的 fake-IP 路由场景，且它们会在 RFC 2544 基准范围之外生成私有或特殊用途应答。对于普通公网 Telegram 访问，请保持关闭。
    </Warning>

    - 环境变量覆盖（临时）：
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

更多帮助： [渠道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考： [配置参考 - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="高价值 Telegram 字段">

- 启动 / 认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- exec 批准：`execApprovals`、`accounts.*.execApprovals`
- 命令 / 菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程 / 回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化 / 发送：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体 / 网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 动作 / 功能：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reactions：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入 / 历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账户优先级：当配置了两个或更多账户 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确默认路由。否则 OpenClaw 会回退到第一个标准化账户 ID，并且 `openclaw doctor` 会发出警告。命名账户会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 的值。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群组和主题 allowlist 行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全" icon="shield" href="/zh-CN/gateway/security">
    威胁模型与加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将群组和主题映射到智能体。
  </Card>
  <Card title="故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

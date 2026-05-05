---
read_when:
    - 开发 Telegram 功能或网络钩子
summary: Telegram 机器人支持状态、功能能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-05-05T04:26:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c75169335378482b80f1ceb669cefaa034ad3e589cf5f1d14c8252608ee46a
    source_path: channels/telegram.md
    workflow: 16
---

Production-ready for bot DMs and groups via grammY. Long polling is the default mode; webhook mode is optional.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    Default DM policy for Telegram is pairing.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/zh-CN/channels/troubleshooting">
    Cross-channel diagnostics and repair playbooks.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/zh-CN/gateway/configuration">
    Full channel config patterns and examples.
  </Card>
</CardGroup>

## Quick setup

<Steps>
  <Step title="Create the bot token in BotFather">
    Open Telegram and chat with **@BotFather** (confirm the handle is exactly `@BotFather`).

    Run `/newbot`, follow prompts, and save the token.

  </Step>

  <Step title="Configure token and DM policy">

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

    Env fallback: `TELEGRAM_BOT_TOKEN=...` (default account only).
    Telegram does **not** use `openclaw channels login telegram`; configure token in config/env, then start gateway.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Pairing codes expire after 1 hour.

  </Step>

  <Step title="Add the bot to a group">
    Add the bot to your group, then set `channels.telegram.groups` and `groupPolicy` to match your access model.
  </Step>
</Steps>

<Note>
Token resolution order is account-aware. In practice, config values win over env fallback, and `TELEGRAM_BOT_TOKEN` only applies to the default account.
</Note>

## Telegram side settings

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram bots default to **Privacy Mode**, which limits what group messages they receive.

    If the bot must see all group messages, either:

    - disable privacy mode via `/setprivacy`, or
    - make the bot a group admin.

    When toggling privacy mode, remove + re-add the bot in each group so Telegram applies the change.

  </Accordion>

  <Accordion title="Group permissions">
    Admin status is controlled in Telegram group settings.

    Admin bots receive all group messages, which is useful for always-on group behavior.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` to allow/deny group adds
    - `/setprivacy` for group visibility behavior

  </Accordion>
</AccordionGroup>

## Access control and activation

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` controls direct message access:

    - `pairing` (default)
    - `allowlist` (requires at least one sender ID in `allowFrom`)
    - `open` (requires `allowFrom` to include `"*"`)
    - `disabled`

    `dmPolicy: "open"` with `allowFrom: ["*"]` lets any Telegram account that finds or guesses the bot username command the bot. Use it only for intentionally public bots with tightly restricted tools; one-owner bots should use `allowlist` with numeric user IDs.

    `channels.telegram.allowFrom` accepts numeric Telegram user IDs. `telegram:` / `tg:` prefixes are accepted and normalized.
    In multi-account configs, a restrictive top-level `channels.telegram.allowFrom` is treated as a safety boundary: account-level `allowFrom: ["*"]` entries do not make that account public unless the effective account allowlist still contains an explicit wildcard after merging.
    `dmPolicy: "allowlist"` with empty `allowFrom` blocks all DMs and is rejected by config validation.
    Setup asks for numeric user IDs only.
    If you upgraded and your config contains `@username` allowlist entries, run `openclaw doctor --fix` to resolve them (best-effort; requires a Telegram bot token).
    If you previously relied on pairing-store allowlist files, `openclaw doctor --fix` can recover entries into `channels.telegram.allowFrom` in allowlist flows (for example when `dmPolicy: "allowlist"` has no explicit IDs yet).

    For one-owner bots, prefer `dmPolicy: "allowlist"` with explicit numeric `allowFrom` IDs to keep access policy durable in config (instead of depending on previous pairing approvals).

    Common confusion: DM pairing approval does not mean "this sender is authorized everywhere".
    Pairing grants DM access. If no command owner exists yet, the first approved pairing also sets `commands.ownerAllowFrom` so owner-only commands and exec approvals have an explicit operator account.
    Group sender authorization still comes from explicit config allowlists.
    If you want "I am authorized once and both DMs and group commands work", put your numeric Telegram user ID in `channels.telegram.allowFrom`; for owner-only commands, make sure `commands.ownerAllowFrom` contains `telegram:<your user id>`.

    ### Finding your Telegram user ID

    Safer (no third-party bot):

    1. DM your bot.
    2. Run `openclaw logs --follow`.
    3. Read `from.id`.

    Official Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party method (less private): `@userinfobot` or `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Two controls apply together:

    1. **Which groups are allowed** (`channels.telegram.groups`)
       - no `groups` config:
         - with `groupPolicy: "open"`: any group can pass group-ID checks
         - with `groupPolicy: "allowlist"` (default): groups are blocked until you add `groups` entries (or `"*"`)
       - `groups` configured: acts as allowlist (explicit IDs or `"*"`)

    2. **Which senders are allowed in groups** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (default)
       - `disabled`

    `groupAllowFrom` is used for group sender filtering. If not set, Telegram falls back to `allowFrom`.
    `groupAllowFrom` entries should be numeric Telegram user IDs (`telegram:` / `tg:` prefixes are normalized).
    Do not put Telegram group or supergroup chat IDs in `groupAllowFrom`. Negative chat IDs belong under `channels.telegram.groups`.
    Non-numeric entries are ignored for sender authorization.
    Security boundary (`2026.2.25+`): group sender auth does **not** inherit DM pairing-store approvals.
    Pairing stays DM-only. For groups, set `groupAllowFrom` or per-group/per-topic `allowFrom`.
    If `groupAllowFrom` is unset, Telegram falls back to config `allowFrom`, not the pairing store.
    Practical pattern for one-owner bots: set your user ID in `channels.telegram.allowFrom`, leave `groupAllowFrom` unset, and allow the target groups under `channels.telegram.groups`.
    Runtime note: if `channels.telegram` is completely missing, runtime defaults to fail-closed `groupPolicy="allowlist"` unless `channels.defaults.groupPolicy` is explicitly set.

    Example: allow any member in one specific group:

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

    Example: allow only specific users inside one specific group:

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
      Common mistake: `groupAllowFrom` is not a Telegram group allowlist.

      - Put negative Telegram group or supergroup chat IDs like `-1001234567890` under `channels.telegram.groups`.
      - Put Telegram user IDs like `8734062810` under `groupAllowFrom` when you want to limit which people inside an allowed group can trigger the bot.
      - Use `groupAllowFrom: ["*"]` only when you want any member of an allowed group to be able to talk to the bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Group replies require mention by default.

    Mention can come from:

    - native `@botusername` mention, or
    - mention patterns in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Session-level command toggles:

    - `/activation always`
    - `/activation mention`

    These update session state only. Use config for persistence.

    Persistent config example:

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

    Getting the group chat ID:

    - forward a group message to `@userinfobot` / `@getidsbot`
    - or read `chat.id` from `openclaw logs --follow`
    - or inspect Bot API `getUpdates`

  </Tab>
</Tabs>

## Runtime behavior

- Telegram is owned by the gateway process.
- Routing is deterministic: Telegram inbound replies back to Telegram (the model does not pick channels).
- Inbound messages normalize into the shared channel envelope with reply metadata and media placeholders.
- Group sessions are isolated by group ID. Forum topics append `:topic:<threadId>` to keep topics isolated.
- DM messages can carry `message_thread_id`; OpenClaw preserves the thread ID for replies but keeps DMs on the flat session by default. Configure `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true`, or a matching topic config when you intentionally want DM topic session isolation.
- Long polling uses grammY runner with per-chat/per-thread sequencing. Overall runner sink concurrency uses `agents.defaults.maxConcurrent`.
- Long polling is guarded inside each gateway process so only one active poller can use a bot token at a time. If you still see `getUpdates` 409 conflicts, another OpenClaw gateway, script, or external poller is likely using the same token.
- Long-polling watchdog restarts trigger after 120 seconds without completed `getUpdates` liveness by default. Increase `channels.telegram.pollingStallThresholdMs` only if your deployment still sees false polling-stall restarts during long-running work. The value is in milliseconds and is allowed from `30000` to `600000`; per-account overrides are supported.
- Telegram Bot API has no read-receipt support (`sendReadReceipts` does not apply).

## Feature reference

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw can stream partial replies in real time:

    - direct chats: preview message + `editMessageText`
    - groups/topics: preview message + `editMessageText`

    Requirement:

    - `channels.telegram.streaming` is `off | partial | block | progress` (default: `partial`)
    - `progress` keeps one editable status draft and updates it with tool progress until final delivery
    - `streaming.preview.toolProgress` controls whether tool/progress updates reuse the same edited preview message (default: `true` when preview streaming is active)
    - `streaming.preview.commandText` controls command/exec detail inside those tool-progress lines: `raw` (default, preserves released behavior) or `status` (tool label only)
    - legacy `channels.telegram.streamMode` and boolean `streaming` values are detected; run `openclaw doctor --fix` to migrate them to `channels.telegram.streaming.mode`

    Tool-progress preview updates are the short status lines shown while tools run, for example command execution, file reads, planning updates, or patch summaries. Telegram keeps these enabled by default to match released OpenClaw behavior from `v2026.4.22` and later. To keep the edited preview for answer text but hide tool-progress lines, set:

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

    To keep tool-progress visible but hide command/exec text, set:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    对于进度草稿模式，将相同的命令文本策略放在 `streaming.progress` 下：

    ```json
    {
      "channels": {
        "telegram": {
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

    仅当你希望只进行最终交付时，才使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，通用工具/进度杂讯会被抑制，而不是作为独立 Status 消息发送。审批提示、媒体载荷和错误仍会通过正常的最终交付路径路由。当你只想保留答案预览编辑，同时隐藏工具进度 Status 行时，使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 选中文本引用回复是例外。当 `replyToMode` 为 `"first"`、`"all"` 或 `"batched"`，且入站消息包含选中的引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法为该轮显示短 Status 行。没有选中引用文本的当前消息回复仍会保留预览流式传输。当工具进度可见性比原生引用回复更重要时，设置 `replyToMode: "off"`；或者设置 `streaming.preview.toolProgress: false` 以接受该取舍。
    </Note>

    对于纯文本回复：

    - 简短私信/群组/topic 预览：OpenClaw 会保留同一条预览消息并在原位执行最终编辑，除非预览出现后发送过可见的非预览消息
    - 拆分成多条 Telegram 消息的长文本最终结果会尽可能复用现有预览作为第一个最终分块，然后只发送剩余分块
    - 预览之后出现可见的非预览输出：OpenClaw 会将完成后的回复作为新的最终消息发送，并清理旧预览，因此最终答案会出现在中间输出之后
    - 超过约一分钟的预览：OpenClaw 会将完成后的回复作为新的最终消息发送，然后清理预览，因此 Telegram 可见时间戳反映的是完成时间，而不是预览创建时间

    对于复杂回复（例如媒体载荷），OpenClaw 会回退到正常的最终交付，然后清理预览消息。

    预览流式传输与分块流式传输是分开的。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    仅限 Telegram 的推理流：

    - `/reasoning stream` 会在生成过程中将推理发送到实时预览
    - 最终交付后会删除推理预览；当推理应保持可见时，使用 `/reasoning on`
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本会渲染为 Telegram 安全 HTML。
    - 原始模型 HTML 会被转义，以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 会以纯文本重试。

    链接预览默认启用，可通过 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册会在启动时通过 `setMyCommands` 处理。

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

    - 名称会被规范化（移除前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    注意：

    - 自定义命令仅是菜单项；它们不会自动实现行为
    - 即使未显示在 Telegram 菜单中，插件/skill 命令在输入时仍可工作

    如果原生命令被禁用，内置命令会被移除。自定义/插件命令如果已配置，仍可能注册。

    常见设置失败：

    - `setMyCommands failed` 并带有 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 菜单在裁剪后仍然溢出；减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并返回 `404: Not Found` 时，可能表示 `channels.telegram.apiRoot` 被设置为完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根地址，且 `openclaw doctor --fix` 会移除意外尾随的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了已配置的 bot token。用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 并带有网络/fetch 错误通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS app 中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 当只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码携带一个短生命周期的 bootstrap token。内置 bootstrap 移交会将主节点 token 保持在 `scopes: []`；任何被移交的 operator token 都会被限定在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。Bootstrap 作用域检查带有角色前缀，因此该 operator 允许列表只满足 operator 请求；非 operator 角色仍需要其自身角色前缀下的作用域。

    如果设备使用变更后的认证详细信息（例如角色/作用域/公钥）重试，之前的待处理请求会被取代，新请求会使用不同的 `requestId`。批准前重新运行 `/pair pending`。

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

    单账号覆盖：

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

  <Accordion title="用于智能体和自动化的 Telegram 消息操作">
    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`，可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`，可选 `iconColor`、`iconCustomEmojiId`）

    频道消息操作暴露了符合人体工程学的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用活动配置/secrets 快照（启动/重新加载），因此操作路径不会在每次发送时执行临时 SecretRef 重新解析。

    Reaction 移除语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    当回复线程启用且原始 Telegram 文本或标题可用时，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元，因此更长的消息会从开头引用；如果 Telegram 拒绝引用，则回退为普通回复。

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会被遵循。

  </Accordion>

  <Accordion title="Forum topic 和线程行为">
    Forum supergroup：

    - topic 会话键会追加 `:topic:<threadId>`
    - 回复和正在输入操作会指向 topic 线程
    - topic 配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    General topic（`threadId=1`）特殊情况：

    - 消息发送会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 正在输入操作仍会包含 `message_thread_id`

    Topic 继承：topic 条目会继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅属于 topic，不会从群组默认值继承。

    **按 topic 的智能体路由**：每个 topic 都可以通过在 topic 配置中设置 `agentId` 路由到不同智能体。这让每个 topic 都有自己的隔离工作区、记忆和会话。示例：

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

    随后每个 topic 都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP topic 绑定**：Forum topic 可以通过顶层类型化 ACP 绑定（`bindings[]`，包含 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的 topic 限定 id）固定 ACP harness 会话。当前作用域限于群组/supergroup 中的 forum topic。参见 [ACP Agents](/zh-CN/tools/acp-agents)。

    **从聊天生成线程绑定 ACP**：`/acp spawn <agent> --thread here|auto` 将当前 topic 绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会在 topic 内固定生成确认。需要保持启用 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文会暴露 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天默认在扁平会话上保留私信路由和回复元数据；只有在配置了 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true` 或匹配的主题配置时，它们才会使用线程感知的会话键。使用顶层 `channels.telegram.dm.threadReplies` 作为账号默认值，或使用 `direct.<chatId>.threadReplies` 针对某个私信设置。

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### 音频消息

    Telegram 会区分语音消息和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中添加标签 `[[audio_as_voice]]` 可强制作为语音消息发送
    - 入站语音消息的转录会在智能体上下文中被标记为机器生成的、不受信任的文本；提及检测仍使用原始转录，因此受提及门控的语音消息会继续生效。

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

    Telegram 会区分视频文件和视频消息。

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

    视频消息不支持说明文字；提供的消息文本会单独发送。

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

    贴纸会被描述一次（如果可行），并缓存以减少重复的视觉调用。

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

  <Accordion title="Reaction notifications">
    Telegram 表情回应会以 `message_reaction` 更新形式到达（独立于消息负载）。

    启用后，OpenClaw 会将类似下面的系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅用户对机器人发送消息的表情回应（通过已发送消息缓存尽力判断）。
    - 表情回应事件仍遵守 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在表情回应更新中提供线程 ID。
      - 非论坛群组会路由到群聊会话
      - 论坛群组会路由到群组通用主题会话（`:topic:1`），而不是确切的来源主题

    用于轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退值（`agents.list[].identity.emoji`，否则为 “👀”）

    说明：

    - Telegram 期望 unicode 表情符号（例如 “👀”）。
    - 使用 `""` 可为某个渠道或账号禁用该表情回应。

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
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

  <Accordion title="Long polling vs webhook">
    默认使用长轮询。若要使用 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选设置 `webhookPath`、`webhookHost`、`webhookPort`（默认分别为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    本地监听器绑定到 `127.0.0.1:8787`。对于公网入口，可以在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    webhook 模式会在向 Telegram 返回 `200` 之前验证请求防护、Telegram secret token 和 JSON 正文。
    随后 OpenClaw 会通过与长轮询相同的按聊天/按主题机器人通道异步处理该更新，因此较慢的智能体回合不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会优先按段落边界（空行）切分，再按长度切分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500）控制 Telegram 相册/媒体组在 OpenClaw 将其作为一条入站消息分发前缓冲多久。如果相册部分到达较晚，请增大该值；若要降低相册回复延迟，请减小该值。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时（若未设置，则使用 grammY 默认值）。机器人客户端会将配置值限制在 60 秒出站文本/输入状态请求防护以下，避免 grammY 在 OpenClaw 的传输防护和回退逻辑运行前中止可见回复投递。长轮询仍使用 45 秒 `getUpdates` 请求防护，因此空闲轮询不会被无限期放弃。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；只有在出现误报的轮询停滞重启时，才在 `30000` 到 `600000` 之间调节。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 回复/引用/转发的补充上下文目前会按收到的内容传递。
    - Telegram 允许列表主要控制谁能触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI/工具/操作）中的可恢复出站 API 错误。入站最终回复投递也会针对 Telegram 预连接失败使用有界安全发送重试，但不会重试可能导致可见消息重复的模糊发送后网络封装。

    CLI 和消息工具发送目标可以是数字聊天 ID、用户名或论坛主题目标：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram 投票使用 `openclaw message poll`，并支持论坛主题：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    仅 Telegram 支持的投票标志：

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用于论坛主题（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带 `buttons` 块的 `--presentation` 创建内联键盘
    - 当机器人可以在该聊天中置顶时，使用 `--pin` 或 `--delivery '{"pin":true}'` 请求置顶投递
    - 使用 `--force-document` 将出站图片和 GIF 作为文档发送，而不是压缩照片或动画媒体上传

    操作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，但保留常规发送功能

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram 支持在审批者私信中进行 exec 审批，也可以选择在来源聊天或主题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少一个审批者可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字所有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与机器人对话以及机器人将普通回复发送到哪里。它们不会让某人成为 exec 审批者。当尚不存在命令所有者时，首次获批的私信配对会引导生成 `commands.ownerAllowFrom`，因此单所有者设置仍可正常工作，而不必在 `execApprovals.approvers` 下重复 ID。

    渠道投递会在聊天中显示命令文本；只应在受信任的群组/主题中启用 `channel` 或 `both`。当提示落在论坛主题中时，OpenClaw 会为审批提示和后续消息保留该主题。exec 审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标界面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的审批 ID 会通过插件审批解析；其他 ID 会先通过 exec 审批解析。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，Telegram 可以回复错误文本，也可以抑制它。两个配置键控制此行为：

| 键                                  | 值                | 默认值  | 描述                                                                                     |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply` 会向聊天发送友好的错误消息。`silent` 会完全抑制错误回复。 |
| `channels.telegram.errorCooldownMs` | 数字（毫秒）      | `60000` | 同一聊天两次错误回复之间的最短时间。防止故障期间产生错误刷屏。        |

支持按账号、按群组和按主题覆盖（继承方式与其他 Telegram 配置键相同）。

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
  <Accordion title="Bot does not respond to non mention group messages">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后移除机器人并重新添加到群组
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查明确的数字群组 ID；通配符 `"*"` 无法探测成员资格。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="机器人完全看不到群组消息">

    - 当 `channels.telegram.groups` 存在时，群组必须被列出（或包含 `"*"`）
    - 验证机器人在群组中的成员资格
    - 查看日志：使用 `openclaw logs --follow` 查看跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 与 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；减少插件/Skill/自定义命令，或禁用原生命令菜单
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 正在输入调用都有边界限制，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/抓取错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性存在问题

  </Accordion>

  <Accordion title="启动报告未授权令牌">

    - `getMe returned 401` 是配置的机器人令牌发生 Telegram 身份验证失败。
    - 在 BotFather 中重新复制或重新生成机器人令牌，然后为默认账号更新 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是身份验证失败；将其视为“webhook 不存在”只会把同一个错误令牌失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/proxy 可能会在 AbortSignal 类型不匹配时触发立即中止行为。
    - 某些主机会先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站可能导致间歇性 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些错误作为可恢复的网络错误重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用成功的启动 `getMe` 探测，因此运行器在第一次 `getUpdates` 之前不需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬态网络错误失败，OpenClaw 会继续进入长轮询，而不是再发起一次轮询前的控制平面调用。仍处于活动状态的 webhook 会表现为 `getUpdates` 冲突；随后 OpenClaw 会重建 Telegram 传输并重试 webhook 清理。
    - 如果 Telegram 套接字按较短的固定周期回收，请检查是否设置了较低的 `channels.telegram.timeoutSeconds`；机器人客户端会将低于出站和 `getUpdates` 请求保护值的配置值钳制到保护值以上，但旧版本在该值低于这些保护值时可能会中止每次轮询或回复。
    - 如果日志包含 `Polling stall detected`，默认情况下，OpenClaw 会在 120 秒内没有完成的长轮询存活信号后重启轮询并重建 Telegram 传输。
    - 当正在运行的轮询账号在启动宽限期后尚未完成 `getUpdates`、正在运行的 webhook 账号在启动宽限期后尚未完成 `setWebhook`，或最后一次成功的轮询传输活动已过期时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告错误的轮询停滞重启时，才增加 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的代理、DNS、IPv6 或 TLS 出站问题。
    - Telegram 也会遵循用于 Bot API 传输的进程代理环境变量，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果在服务环境中通过 `OPENCLAW_PROXY_URL` 配置了 OpenClaw 托管代理，并且不存在标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直连出站/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，然后是进程默认值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不适用，Node 22+ 会回退到 `ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下工作更好，请强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 默认情况下，Telegram 媒体下载已允许 RFC 2544 基准测试范围答案（`198.18.0.0/15`）。如果可信的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他私有/内部/特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一个可选启用项也可在每个账号级别使用：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持该危险标志关闭。Telegram 媒体默认已经允许 RFC 2544 基准测试范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram 媒体 SSRF 防护。仅在可信、由操作方控制的代理环境中使用它，例如 Clash、Mihomo 或 Surge fake-IP 路由，并且这些环境会合成 RFC 2544 基准测试范围之外的私有或特殊用途答案。对于普通公共互联网 Telegram 访问，请保持关闭。
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
- exec 批准：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根：`apiRoot`（仅 Bot API 根；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：当配置了两个或更多账号 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确默认路由。否则 OpenClaw 会回退到第一个规范化后的账号 ID，并且 `openclaw doctor` 会发出警告。命名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户配对到 Gateway 网关。
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

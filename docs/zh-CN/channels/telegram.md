---
read_when:
    - 处理 Telegram 功能或 Webhooks
summary: Telegram 机器人支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-07-06T10:46:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81802f9077e9339bae1c4b3296db2b1b76d4085593544305be37e43669173c0a
    source_path: channels/telegram.md
    workflow: 16
---

Production-ready for bot DMs and groups via grammY. Long polling is the default transport; webhook mode is optional.

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
    Both flows end with a token you paste into OpenClaw — pick one:

    - **Chat flow**: open Telegram, chat with **@BotFather** (confirm the handle is exactly `@BotFather`), run `/newbot`, follow the prompts, and save the token.
    - **Web flow**: open [BotFather's web app](https://t.me/BotFather?startapp) — it runs in every Telegram client, including [web.telegram.org](https://web.telegram.org) — create the bot in the UI, and copy its token.

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

    Env fallback: `TELEGRAM_BOT_TOKEN` (default account only; named accounts must use `botToken` or `tokenFile`).
    Telegram does **not** use `openclaw channels login telegram`; set the token in config/env, then start the gateway.

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
    Add the bot to your group, then get the two IDs group access needs:

    - your Telegram user ID, for `allowFrom` / `groupAllowFrom`
    - the Telegram group chat ID, as the key under `channels.telegram.groups`

    Get the group chat ID from `openclaw logs --follow`, a forwarded-ID bot, or Bot API `getUpdates`. After the group is allowed, `/whoami@<bot_username>` confirms the user and group IDs.

    Negative supergroup IDs starting with `-100` are group chat IDs. They go under `channels.telegram.groups`, not `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Token resolution is account-aware: `tokenFile` beats `botToken` beats env, and config always wins over `TELEGRAM_BOT_TOKEN` (which only resolves for the default account). After a successful startup, OpenClaw caches the bot identity for up to 24 hours so restarts skip an extra `getMe` call; changing or removing the token clears that cache.
</Note>

## Telegram side settings

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram bots default to **Privacy Mode**, which limits which group messages they receive.

    To see all group messages, either:

    - disable privacy mode via `/setprivacy`, or
    - make the bot a group admin.

    After toggling privacy mode, remove and re-add the bot in each group so Telegram applies the change.

  </Accordion>

  <Accordion title="Group permissions">
    Admin status is controlled in Telegram group settings. Admin bots receive all group messages, useful for always-on group behavior.
  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - `/setjoingroups` — allow/deny group adds
    - `/setprivacy` — group visibility behavior

    The same settings are available in [BotFather's web app](https://t.me/BotFather?startapp) if you prefer a UI over chat commands.

  </Accordion>
</AccordionGroup>

## Access control and activation

### Group bot identity

In groups and forum topics, an explicit mention of the configured bot handle (for example `@my_bot`) addresses the selected OpenClaw agent, even when the agent persona name differs from the Telegram username. Group silence policy still applies to unrelated traffic, but the bot handle itself is never "someone else."

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` controls direct message access:

    - `pairing` (default)
    - `allowlist` (requires at least one sender ID in `allowFrom`)
    - `open` (requires `allowFrom` to include `"*"`)
    - `disabled`

    `dmPolicy: "open"` with `allowFrom: ["*"]` lets any Telegram account that finds or guesses the bot username command the bot. Use it only for intentionally public bots with tightly restricted tools; one-owner bots should use `allowlist` with numeric user IDs.

    `channels.telegram.allowFrom` accepts numeric Telegram user IDs. `telegram:` / `tg:` prefixes are accepted and normalized.
    In multi-account configs, a restrictive top-level `channels.telegram.allowFrom` is a safety boundary: an account-level `allowFrom: ["*"]` does not make that account public unless the merged effective allowlist still contains an explicit wildcard.
    `dmPolicy: "allowlist"` with empty `allowFrom` blocks all DMs and is rejected by config validation.
    Setup asks for numeric user IDs only. If your config has `@username` allowlist entries from an older setup, run `openclaw doctor --fix` to resolve them to numeric IDs (best-effort; requires a Telegram bot token).
    If you previously relied on pairing-store allowlist files, `openclaw doctor --fix` can recover entries into `channels.telegram.allowFrom` for allowlist flows (for example when `dmPolicy: "allowlist"` has no explicit IDs yet).

    For one-owner bots, prefer `dmPolicy: "allowlist"` with explicit numeric `allowFrom` IDs over depending on previous pairing approvals.

    Common confusion: DM pairing approval does not mean "this sender is authorized everywhere." Pairing grants DM access only. If no command owner exists yet, the first approved pairing also sets `commands.ownerAllowFrom`, giving owner-only commands and exec approvals an explicit operator account. Group sender authorization still comes from explicit config allowlists.
    To be authorized for both DMs and group commands with one identity: put your numeric Telegram user ID in `channels.telegram.allowFrom`, and for owner-only commands make sure `commands.ownerAllowFrom` contains `telegram:<your user id>`.

    ### Finding your Telegram user ID

    Safer (no third-party bot): DM your bot, run `openclaw logs --follow`, read `from.id`.

    Official Bot API method:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Third-party (less private): `@userinfobot` or `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    Two controls apply together:

    1. **Which groups are allowed** (`channels.telegram.groups`)
       - no `groups` config, `groupPolicy: "open"`: any group passes group-ID checks
       - no `groups` config, `groupPolicy: "allowlist"` (default): all groups blocked until you add `groups` entries (or `"*"`)
       - `groups` configured: acts as an allowlist (explicit IDs or `"*"`)

    2. **Which senders are allowed in groups** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (default) / `disabled`

    `groupAllowFrom` filters group senders; if unset, Telegram falls back to `allowFrom` (not the pairing store — group sender auth never inherits DM pairing-store approvals, a security boundary since `2026.2.25`).
    `groupAllowFrom` entries should be numeric Telegram user IDs (`telegram:` / `tg:` prefixes are normalized); non-numeric entries are ignored. Do not put group or supergroup chat IDs here — negative chat IDs belong under `channels.telegram.groups`.
    Practical pattern for one-owner bots: set your user ID in `channels.telegram.allowFrom`, leave `groupAllowFrom` unset, and allow the target groups under `channels.telegram.groups`.
    If `channels.telegram` is entirely missing from config, runtime defaults to fail-closed `groupPolicy="allowlist"` unless `channels.defaults.groupPolicy` is explicitly set.

    Owner-only group setup:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Test from the group with `@<bot_username> ping`. Plain group messages do not trigger the bot while `requireMention: true`.

    Allow any member in one specific group:

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

    Allow only specific users inside one specific group:

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
      Common mistake: `groupAllowFrom` is not a group allowlist.

      - Negative Telegram group/supergroup chat IDs (`-1001234567890`) go under `channels.telegram.groups`.
      - Telegram user IDs (`8734062810`) go under `groupAllowFrom` to limit which people inside an allowed group can trigger the bot.
      - Use `groupAllowFrom: ["*"]` only to let any member of an allowed group talk to the bot.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Group replies require mention by default. A mention can come from:

    - a native `@botusername` mention, or
    - a mention pattern in `agents.list[].groupChat.mentionPatterns` or `messages.groupChat.mentionPatterns`

    Session-level toggles (state only, not persisted): `/activation always`, `/activation mention`. Use config for persistence:

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

    Group history context is always on and bounded by `historyLimit`. Set `channels.telegram.historyLimit: 0` to disable the group history window. `openclaw doctor --fix` removes the retired `includeGroupHistoryContext` key.

    Getting the group chat ID: forward a group message to `@userinfobot` / `@getidsbot`, read `chat.id` from `openclaw logs --follow`, inspect Bot API `getUpdates`, or (once the group is allowed) run `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Runtime behavior

- Telegram runs inside the gateway process.
- Routing is deterministic: Telegram inbound replies back to Telegram (the model does not pick channels).
- Inbound messages normalize into the shared channel envelope with reply metadata, media placeholders, and persisted reply-chain context for replies the gateway has observed.
- Group sessions are isolated by group ID. Forum topics append `:topic:<threadId>`.
- DM messages can carry `message_thread_id`; OpenClaw preserves it for replies. DM topic sessions split only when Telegram `getMe` reports `has_topics_enabled: true` for the bot; otherwise DMs stay on the flat session.
- Long polling uses the grammY runner with per-chat/per-thread sequencing. Runner sink concurrency uses `agents.defaults.maxConcurrent`.
- Multi-account startup bounds concurrent `getMe` probes so large bot fleets do not fan out every account probe at once.
- Each gateway process guards long polling so only one active poller can use a bot token at a time. Persistent `getUpdates` 409 conflicts point to another OpenClaw gateway, script, or external poller using the same token.
- The polling watchdog restarts after 120 seconds without completed `getUpdates` liveness by default. Raise `channels.telegram.pollingStallThresholdMs` (30000-600000, per-account overrides supported) only if your deployment sees false polling-stall restarts during long-running work.
- Telegram Bot API has no read-receipt support (`sendReadReceipts` does not apply).

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果你的配置仍包含这些键，升级后请运行 `openclaw doctor --fix`。私信话题路由现在遵循 Telegram `getMe.has_topics_enabled`（由 BotFather 线程模式控制）：启用话题的 bot 会在 Telegram 发送 `message_thread_id` 时使用线程范围的私信会话；其他私信保持扁平会话。
</Note>

## 功能参考

<AccordionGroup>
  <Accordion title="实时流预览（消息编辑）">
    OpenClaw 会在私聊、群组和话题中实时流式传输部分回复：发送一条预览消息，然后重复调用 `editMessageText`，并在原处完成最终回复。

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（默认值：`partial`）
    - 简短的初始答案预览会经过防抖处理；如果运行仍处于活动状态，则会在有界延迟后物化
    - `progress` 会为工具进度保留一个可编辑的状态草稿，在答案活动早于工具进度到达时显示稳定的状态标签，在完成时清除它，并将最终答案作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（预览流式传输启用时默认值：`true`）
    - `streaming.preview.commandText` 控制这些行中的命令/exec 详情：`raw`（默认值）或 `status`（仅工具标签）
    - `streaming.progress.commentary`（默认值：`false`）选择在临时进度草稿中包含助手的评论/前言文本
    - 会检测旧版 `channels.telegram.streamMode`、布尔型 `streaming` 值和已退役的原生草稿预览键；运行 `openclaw doctor --fix` 以迁移它们

    工具进度行是在工具运行时显示的简短状态更新（命令执行、文件读取、计划更新、补丁摘要、app-server 模式中的 Codex 前言/评论）。Telegram 默认保持启用这些行（匹配 `v2026.4.22`+ 已发布行为）。

    保留答案预览编辑，但隐藏工具进度行：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    保持工具进度可见，但隐藏命令/exec 文本：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` 模式会显示工具进度，但不会把最终答案编辑进那条消息。将命令文本策略放在 `streaming.progress` 下：

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

    `streaming.mode: "off"` 会禁用预览编辑，并抑制通用工具/进度闲聊，而不是将其作为独立状态消息发送；审批提示、媒体和错误仍通过正常最终投递路由。`streaming.preview.toolProgress: false` 仅保留答案预览编辑。

    <Note>
      选定引用回复是例外。当 `replyToMode` 为 `first`、`all` 或 `batched`，且入站消息有选定的引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法在该轮显示状态行。没有选定引用文本的当前消息回复仍会流式传输。当工具进度可见性比原生引用回复更重要时，设置 `replyToMode: "off"`；或设置 `streaming.preview.toolProgress: false` 以接受该取舍。
    </Note>

    对于纯文本回复：短预览会在原处获得最终编辑；拆分为多条消息的长最终回复会将预览复用为第一块，然后只发送剩余部分；progress 模式的最终回复会清除状态草稿并使用正常最终投递；如果在确认完成前最终编辑失败，OpenClaw 会回退到正常最终投递并清理过期预览。对于复杂回复（媒体载荷），OpenClaw 始终回退到正常最终投递并清理预览。

    预览流式传输和分块流式传输互斥——当明确启用分块流式传输时，OpenClaw 会跳过预览流以避免双重流式传输。

    推理：`/reasoning stream` 会在生成时将推理流式传输到实时预览中，然后在最终投递后删除推理预览（使用 `/reasoning on` 保持其可见）。最终答案发送时不包含推理文本。

  </Accordion>

  <Accordion title="富消息格式">
    默认情况下，出站文本使用标准 Telegram HTML 消息，可在当前客户端中阅读：粗体、斜体、链接、代码、剧透、引用——而不是 Bot API 10.1 仅富文本块（原生表格、详情、富媒体、公式）。

    选择启用 Bot API 10.1 富消息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    启用后：会告知智能体此 bot/账号可使用富消息；Markdown 文本通过 OpenClaw 的 Markdown IR 渲染为 Telegram 富 HTML；显式富 HTML 载荷会保留受支持的 Bot API 10.1 标签（标题、表格、详情、富媒体、公式）；媒体说明仍使用 Telegram HTML 说明（富消息不会替代说明，且说明上限为 1024 个字符）。

    这会让模型文本避开 Telegram 的富 Markdown 符号，因此像 `$400-600K` 这样的金额不会被解析为数学公式。长富文本会按 Telegram 的限制自动拆分。超过 20 列限制的表格会回退为代码块。

    默认值：关闭，用于客户端兼容性——一些当前 Desktop、Web、Android 和第三方客户端会将已接受的富消息渲染为不支持。除非该 bot 使用的每个客户端都能渲染它们，否则保持关闭。`/status` 会显示当前会话的富消息是开启还是关闭。

    链接预览默认开启。`channels.telegram.linkPreview: false` 会禁用富文本的自动实体检测。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 的命令菜单会在启动时通过 `setMyCommands` 注册。`commands.native: "auto"` 会为 Telegram 启用原生命令。

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

    规则：名称会被规范化（去掉前导 `/`，转为小写）；有效模式为 `a-z`、`0-9`、`_`，长度 1-32；自定义命令不能覆盖原生命令；冲突/重复项会被跳过并记录日志。

    自定义命令只是菜单项——它们不会自动实现行为。插件/skill 命令即使未显示在 Telegram 菜单中，在输入时仍可能工作。如果禁用原生命令，内置项会被移除；自定义/插件命令在配置后仍可注册。

    常见设置失败：

    - `setMyCommands failed` 带有 `BOT_COMMANDS_TOO_MUCH`，且修剪重试后仍出现，表示菜单仍然溢出；减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可工作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并显示 `404: Not Found` 时，通常表示 `channels.telegram.apiRoot` 被设置成了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根；`openclaw doctor --fix` 会移除意外的尾随 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了已配置的 bot token。使用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`（默认账号）；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 带有网络/fetch 错误时，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻断。

    ### 设备配对命令（`device-pair` 插件）

    安装后：

    1. `/pair` 生成设置代码
    2. 将代码粘贴到 iOS 应用中
    3. `/pair pending` 列出待处理请求（包括角色/权限范围）
    4. 批准：`/pair approve <requestId>`、`/pair approve`（仅有一个待处理请求时）或 `/pair approve latest`

    如果设备使用变更后的凭证详情（角色、权限范围、公钥）重试，之前的待处理请求会被新的 `requestId` 取代；批准前重新运行 `/pair pending`。

    更多详情：[配对](/zh-CN/channels/pairing#pair-via-telegram)。

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

    范围：`off`、`dm`、`group`、`all`、`allowlist`（默认值）。旧版 `capabilities: ["inlineButtons"]` 映射到 `"all"`。

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

    Mini App 按钮示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` 按钮仅在用户和 bot 之间的私聊中可用。

    未被已注册插件交互处理程序认领的回调点击会作为文本传给智能体：`callback_data: <value>`。

  </Accordion>

  <Accordion title="用于智能体和自动化的 Telegram 消息动作">
    动作：

    - `sendMessage`（`to`、`content`，可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`，可选 `presentation` 内联按钮；仅按钮编辑会更新回复标记）
    - `createForumTopic`（`chatId`、`name`，可选 `iconColor`、`iconCustomEmojiId`）

    易用别名：`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    门控：`channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（默认值：禁用）。`edit`、`createForumTopic` 和 `editForumTopic` 默认启用，没有专用开关。
    运行时发送使用启动/重载时的活动配置/密钥快照，因此动作路径不会在每次发送时重新解析 `SecretRef` 值。

    表情回应移除语义：[/tools/reactions](/zh-CN/tools/reactions)。

  </Accordion>

  <Accordion title="回复线程标签">
    生成输出中的显式回复线程标签：

    - `[[reply_to_current]]`——回复触发消息
    - `[[reply_to:<id>]]`——回复指定消息 ID

    `channels.telegram.replyToMode`：`off`（默认值）、`first`、`all`。

    启用回复线程且原始文本/说明可用时，OpenClaw 会自动添加原生引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元；更长消息会从开头引用，如果 Telegram 拒绝引用，则回退到普通回复。

    `off` 仅禁用隐式回复线程；显式 `[[reply_to_*]]` 标签仍会生效。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：话题会话键会追加 `:topic:<threadId>`；回复和正在输入状态会定向到该话题线程；话题配置路径是 `channels.telegram.groups.<chatId>.topics.<threadId>`。

    常规话题（`threadId=1`）是一个特殊情况：发送消息时会省略 `message_thread_id`（Telegram 会以 "thread not found" 拒绝 `sendMessage(...thread_id=1)`），但正在输入操作仍会包含 `message_thread_id`（经验证，这是让正在输入指示器显示所必需的）。

    话题条目会继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` 仅属于话题，不会从群组默认值继承。`topics."*"` 会为该群组中的每个话题设置默认值；精确话题 ID 仍优先于 `"*"`。

    **按话题的智能体路由**：每个话题都可以通过话题配置中的 `agentId` 路由到不同智能体，从而拥有自己的工作区、记忆和会话：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic -> main agent
                "3": { agentId: "zu" },        // Dev topic -> zu agent
                "5": { agentId: "coder" }      // Code review -> coder agent
              }
            }
          }
        }
      }
    }
    ```

    随后，每个话题都有自己的会话键，例如 `agent:zu:telegram:group:-1001234567890:topic:3`。

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化绑定（`bindings[]`，其中 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的话题限定 id）固定 ACP harness 会话。目前仅限于群组/超级群组中的论坛话题。请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天中生成线程绑定的 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里，OpenClaw 会在话题内固定生成确认。需要 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文会公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留回复元数据，但只有当 Telegram `getMe` 报告 `has_topics_enabled: true` 时，才会使用支持线程的会话键。
    已弃用的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆盖项已移除；BotFather 线程模式是唯一事实来源。运行 `openclaw doctor --fix` 以移除过期配置键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音便笺和音频文件。默认：音频文件行为；在智能体回复中标记 `[[audio_as_voice]]` 可强制发送语音便笺。入站语音便笺转录会在智能体上下文中被框定为机器生成的不可信文本，但提及检测仍会使用原始转录，因此需要提及门控的语音消息仍可正常工作。

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

    Telegram 会区分视频文件和视频便笺。视频便笺不支持标题；提供的消息文本会单独发送。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 贴纸

    入站：静态 WEBP 会被下载并处理（占位符 `<media:sticker>`）；动画 TGS 和视频 WEBM 会被跳过。

    贴纸上下文字段：`Sticker.emoji`、`Sticker.setName`、`Sticker.fileId`、`Sticker.fileUniqueId`、`Sticker.cachedDescription`。描述会缓存在 OpenClaw SQLite 插件状态中，以减少重复的视觉调用。

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

    发送：

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

  <Accordion title="表情回应通知">
    Telegram 表情回应会作为 `message_reaction` 更新到达，与消息载荷分离。启用后，OpenClaw 会将类似 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 的系统事件加入队列。

    - `channels.telegram.reactionNotifications`: `off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive`（默认：`minimal`）

    `own` 表示仅用户对机器人发送消息的表情回应（通过已发送消息缓存尽力实现）。表情回应事件仍会遵守 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。

    Telegram 不会在表情回应更新中提供线程 ID：非论坛群组会路由到群组聊天会话；论坛群组会路由到常规话题会话（`:topic:1`），而不是精确的原始话题。

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认表情回应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送确认 emoji。`messages.ackReactionScope` 决定它在*何时*发送。

    **Emoji 解析顺序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 回退（`agents.list[].identity.emoji`，否则为 "👀"）

    Telegram 需要 unicode emoji（例如 "👀"）；使用 `""` 可为某个渠道或账号禁用表情回应。

    **范围（`messages.ackReactionScope`，默认 `"group-mentions"`；目前没有 Telegram 账号或 Telegram 渠道覆盖项）：**

    `all`（私信 + 群组，包括环境房间事件）、`direct`（仅私信）、`group-all`（除环境房间事件外的所有群组消息，不含私信）、`group-mentions`（机器人被提及时的群组；**不含私信** — 默认）、`off` / `none`（已禁用）。

    <Note>
    默认范围（`group-mentions`）不会在私信或环境房间事件中触发确认表情回应。私信请使用 `direct` 或 `all`；只有 `all` 会确认环境房间事件。此值会在 Telegram 提供商启动时读取，因此需要重启 Gateway 网关才能使更改生效。
    </Note>

  </Accordion>

  <Accordion title="来自 Telegram 事件和命令的配置写入">
    渠道配置写入默认启用（`configWrites !== false`）。由 Telegram 触发的写入包括群组迁移事件（`migrate_to_chat_id`，更新 `channels.telegram.groups`）以及 `/config set` / `/config unset`（需要启用命令）。

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
    默认使用长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选项包括 `webhookPath`（默认 `/telegram-webhook`）、`webhookHost`（默认 `127.0.0.1`）、`webhookPort`（默认 `8787`）、`webhookCertPath`（用于直连 IP 或无域名设置的自签名证书 PEM）。

    在长轮询模式下，OpenClaw 只有在更新成功分发后才会持久化其重启水位线；失败的处理器会让该更新在同一进程中保持可重试状态，而不是将其标记为已完成。

    本地监听器默认绑定到 `127.0.0.1:8787`。对于公共入口，请在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会先验证请求防护、Telegram secret token 和 JSON 正文，然后才返回 `200`。OpenClaw 随后会通过长轮询所使用的相同按聊天/按话题机器人通道异步处理该更新，因此缓慢的智能体轮次不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认为 4000；`chunkMode="newline"` 会在按长度拆分前优先使用段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500，范围 10-60000）控制相册/媒体组在 OpenClaw 将其作为一条入站消息分发之前缓冲多久。如果相册部分到达较晚，可增大该值；若要降低相册回复延迟，可减小该值。
    - `channels.telegram.timeoutSeconds` 会覆盖 API 客户端超时（未设置时使用 grammY 默认值）。机器人客户端会将配置值限制在 60 秒出站文本/正在输入请求防护以下，避免 grammY 在 OpenClaw 的传输防护和回退运行之前中止可见回复投递。长轮询仍使用 45 秒 `getUpdates` 请求防护，因此空闲轮询不会被无限期挂起。
    - `channels.telegram.pollingStallThresholdMs` 默认为 120000；仅在误报轮询停滞重启时，才在 30000 到 600000 之间调优。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 当 Gateway 网关已观察到父消息时，回复/引用/转发补充上下文会规范化为一个选定的对话上下文窗口；已观察消息缓存位于 OpenClaw SQLite 插件状态中，`openclaw doctor --fix` 会导入旧版 sidecar。Telegram 每次更新只包含一个浅层 `reply_to_message`，因此早于缓存的链仅限于该载荷。
    - Telegram 允许列表主要控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` 适用于 Telegram 发送辅助函数（CLI/工具/操作）的可恢复出站 API 错误。入站最终回复投递会对连接前失败使用有界安全发送重试，但不会重试可能重复可见消息的模糊发送后网络信封。

    CLI 和消息工具发送目标接受数字聊天 ID、用户名或论坛话题目标：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    投票使用 `openclaw message poll`，并支持论坛话题：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    仅 Telegram 支持的投票标志：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（或 `:topic:` 目标）。`--poll-option` 重复 2-12 次（Telegram 的选项上限）。

    Telegram 发送还支持 `--presentation`，可配合用于内联键盘的 `buttons` 块（当 `channels.telegram.capabilities.inlineButtons` 允许时）；支持 `--pin` 或 `--delivery '{"pin":true}'`，可在机器人能在该聊天中固定消息时请求固定投递；还支持 `--force-document`，可将出站图片、GIF 和视频作为文档发送，而不是压缩/动画/视频上传。

    操作门控：`channels.telegram.actions.sendMessage=false` 会禁用包括投票在内的所有出站消息；`channels.telegram.actions.poll=false` 会在保留常规发送启用的同时禁用投票创建。

  </Accordion>

  <Accordion title="Telegram 中的 Exec 审批">
    Telegram 支持在审批者私信中进行 Exec 审批，并可选择在原始聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    - `channels.telegram.execApprovals.enabled`（`"auto"` 会在至少可解析一个审批人时启用）
    - `channels.telegram.execApprovals.approvers`（回退到来自 `commands.ownerAllowFrom` 的数字所有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与 Bot 对话，以及它把普通回复发送到哪里 —— 它们不会让某人成为 Exec 审批人。还没有命令所有者时，第一次已批准的私信配对会引导初始化 `commands.ownerAllowFrom`，因此单所有者设置无需在 `execApprovals.approvers` 下重复 ID 也能工作。

    渠道投递会在聊天中显示命令文本；只应在受信任的群组/话题中启用 `channel` 或 `both`。当提示进入论坛话题时，OpenClaw 会为审批提示和后续消息保留该话题。Exec 审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。带 `plugin:` 前缀的审批 ID 通过插件审批解析；其他 ID 会先通过 Exec 审批解析。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，错误策略会控制错误消息是否发送到 Telegram 聊天：

| 键                                  | 值                         | 默认值          | 描述                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` 会把每条错误消息发送到聊天。`once` 会在每个冷却窗口内只发送一次每条唯一错误消息（抑制重复的相同错误）。`silent` 从不把错误消息发送到聊天。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 策略的冷却窗口。错误发送后，同一条消息会被抑制，直到此间隔结束。可防止中断期间的错误刷屏。                                           |

支持按账号、按群组和按话题覆盖（继承方式与其他 Telegram 配置键相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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

## 故障排查

<AccordionGroup>
  <Accordion title="Bot 不响应非提及群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性：BotFather `/setprivacy` -> Disable，然后移除 Bot 并重新添加到群组。
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 会检查显式数字群组 ID；通配符 `"*"` 无法进行成员资格探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群组消息">

    - 当 `channels.telegram.groups` 存在时，必须列出该群组（或包含 `"*"`）。
    - 验证 Bot 在群组中的成员资格。
    - 查看 `openclaw logs --follow` 中的跳过原因。

  </Accordion>

  <Accordion title="命令部分工作或完全不工作">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）；即使群组策略是 `open`，命令授权仍然适用。
    - `setMyCommands failed` 带有 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；减少插件/skill/自定义命令，或禁用原生命令菜单。
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 输入状态调用有边界限制，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/抓取错误通常表示无法通过 DNS/HTTPS 访问 `api.telegram.org`。

  </Accordion>

  <Accordion title="启动报告未授权 token">

    - `getMe returned 401` 是已配置 Bot token 的 Telegram 凭证失败。请在 BotFather 中重新复制或重新生成 token，然后更新 `channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`（默认账号）。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是凭证失败；把它当作“没有 webhook 存在”只会把同一个错误 token 失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ 搭配自定义 fetch/proxy 时，如果 `AbortSignal` 类型不匹配，可能触发立即中止行为。
    - 某些主机会先把 `api.telegram.org` 解析到 IPv6；损坏的 IPv6 出站会导致间歇性 API 失败。
    - 带有 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!` 的日志会作为可恢复的网络错误重试。
    - 轮询启动期间，OpenClaw 会为 grammY 复用成功的启动 `getMe` 探测，因此运行器在第一次 `getUpdates` 之前不需要第二次 `getMe`。
    - 如果轮询启动期间 `deleteWebhook` 因瞬时网络错误失败，OpenClaw 会继续进入长轮询，而不是发起另一个预轮询控制平面调用。仍然活跃的 webhook 随后会表现为 `getUpdates` 冲突；OpenClaw 会重建传输并重试 webhook 清理。
    - 如果 Telegram 套接字按较短固定周期回收，请检查是否存在较低的 `channels.telegram.timeoutSeconds` —— Bot 客户端会把低于出站和 `getUpdates` 请求保护值的配置值钳制住，但较旧版本在此值低于这些保护值时可能会中止每次轮询或回复。
    - 日志中的 `Polling stall detected` 表示 OpenClaw 在默认 120 秒内没有完成长轮询活性后，会重启轮询并重建传输。
    - 当正在运行的轮询账号在启动宽限期后还没有完成 `getUpdates`，正在运行的 webhook 账号在启动宽限期后还没有完成 `setWebhook`，或上次成功的轮询传输活动已过期时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告误判的轮询停滞重启时，才提高 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向到 `api.telegram.org` 的代理、DNS、IPv6 或 TLS 出站问题。
    - Telegram 会遵循进程代理环境变量进行 Bot API 传输：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果为服务环境设置了 `OPENCLAW_PROXY_URL`，且不存在标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过代理路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序会依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`、进程默认值（例如 `NODE_OPTIONS=--dns-result-order=ipv4first`），如果都不适用，则在 Node 22+ 上回退到 `ipv4first`。
    - 在 WSL2 上，或当仅 IPv4 行为效果更好时，强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准测试范围答案（`198.18.0.0/15`）默认已允许用于 Telegram 媒体下载。如果受信任的 fake-IP 或透明代理在媒体下载期间把 `api.telegram.org` 改写到其他私有/内部/特殊用途地址，请选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一个选择加入项也可按账号在 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 使用。
    - 如果你的代理把 Telegram 媒体主机解析到 `198.18.x.x`，请先保持危险标志关闭 —— 该范围默认已经允许。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram 媒体 SSRF 防护。仅在受信任、由操作员控制的代理环境（Clash、Mihomo、Surge fake-IP 路由）中使用，这些环境会合成 RFC 2544 基准测试范围之外的私有或特殊用途答案。正常公共互联网 Telegram 访问请保持关闭。
    </Warning>

    - 临时环境覆盖：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - 验证 DNS 答案：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[渠道故障排查](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[Configuration reference - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="高信号 Telegram 字段">

- 启动/凭证：`enabled`、`botToken`、`tokenFile`（必须是常规文件；符号链接会被拒绝）、`accounts.*`
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 话题默认值：`groups.<chatId>.topics."*"` 适用于未匹配的论坛话题；精确话题 ID 会覆盖它
- Exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`、`threadBindings`
- 流式传输：`streaming`（模式 `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根：`apiRoot`（仅 Bot API 根；不要包含 `/bot<TOKEN>`）、`trustedLocalFileRoots`（自托管 Bot API 绝对 `file_path` 根）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：配置两个或更多账号 ID 时，设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确默认路由。否则 OpenClaw 会回退到第一个规范化账号 ID，且 `openclaw doctor` 会发出警告。命名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
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
  <Card title="故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

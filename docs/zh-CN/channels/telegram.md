---
read_when:
    - 处理 Telegram 功能或 Webhook
summary: Telegram Bot 支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-07-05T01:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e0df8772bc520e46be387b2c3a53d7407d39bd5ee77046f1cd36efab48182e2
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
    Add the bot to your group, then get both IDs that group access needs:

    - your Telegram user ID, used in `allowFrom` / `groupAllowFrom`
    - the Telegram group chat ID, used as the key under `channels.telegram.groups`

    For first-time setup, get the group chat ID from `openclaw logs --follow`, a forwarded-ID bot, or Bot API `getUpdates`. After the group is allowed, `/whoami@<bot_username>` can confirm the user and group IDs.

    Negative Telegram supergroup IDs that start with `-100` are group chat IDs. Put them under `channels.telegram.groups`, not under `groupAllowFrom`.

  </Step>
</Steps>

<Note>
Token resolution order is account-aware. In practice, config values win over env fallback, and `TELEGRAM_BOT_TOKEN` only applies to the default account.
After a successful startup, OpenClaw caches the bot identity in the state directory for up to 24 hours so restarts can avoid an extra Telegram `getMe` call; changing or removing the token clears that cache.
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

### Group bot identity

In Telegram groups and forum topics, an explicit mention of the configured bot handle (for example `@my_bot`) is treated as addressing the selected OpenClaw agent, even when the agent persona name differs from the Telegram username. The group silence policy still applies to unrelated group traffic, but the bot handle itself is not considered "someone else."

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

    Test it from the group with `@<bot_username> ping`. Plain group messages do not trigger the bot while `requireMention: true`.

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

    Group history context is always on for groups and bounded by
    `historyLimit`. Set `channels.telegram.historyLimit: 0` to disable the
    Telegram group history window. The retired `includeGroupHistoryContext`
    key is removed by `openclaw doctor --fix`.

    Getting the group chat ID:

    - forward a group message to `@userinfobot` / `@getidsbot`
    - or read `chat.id` from `openclaw logs --follow`
    - or inspect Bot API `getUpdates`
    - after the group is allowed, run `/whoami@<bot_username>` if native commands are enabled

  </Tab>
</Tabs>

## Runtime behavior

- Telegram 由 Gateway 网关进程拥有。
- 路由是确定性的：Telegram 入站消息会回复到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享频道信封，包含回复元数据、媒体占位符，以及 Gateway 网关已观察到的 Telegram 回复的持久化回复链上下文。
- 群组会话按群组 ID 隔离。论坛主题会追加 `:topic:<threadId>`，以保持主题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会保留它用于回复。只有当 Telegram `getMe` 报告该 Bot 的 `has_topics_enabled: true` 时，私信主题会话才会拆分；否则私信会保持在扁平会话上。
- 长轮询使用 grammY runner，并按每个聊天/每个线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 多账号启动会限制并发的 Telegram `getMe` 探测，避免大型 Bot 集群一次性展开所有账号探测。
- 长轮询在每个 Gateway 网关进程内受到保护，因此同一时间只有一个活跃 poller 可以使用某个 Bot token。如果你仍然看到 `getUpdates` 409 冲突，另一个 OpenClaw Gateway 网关、脚本或外部 poller 很可能正在使用同一个 token。
- 默认情况下，长轮询 watchdog 会在 120 秒内没有完成的 `getUpdates` 存活信号后触发重启。仅当你的部署在长时间运行工作期间仍然看到误判的轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果你的配置仍有这些键，升级后请运行 `openclaw doctor --fix`。私信主题路由现在遵循 Telegram `getMe.has_topics_enabled` 返回的 Bot 能力，该能力由 BotFather 线程模式控制：启用主题的 Bot 会在 Telegram 发送 `message_thread_id` 时使用线程范围的私信会话；其他私信会保持在扁平会话上。
</Note>

## 功能参考

<AccordionGroup>
  <Accordion title="实时流预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 直接聊天：预览消息 + `editMessageText`
    - 群组/主题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认值：`partial`）
    - 较短的初始回答预览会被防抖处理；如果运行仍处于活跃状态，会在有界延迟后物化
    - `progress` 会为工具进度保留一条可编辑的状态草稿，当回答活动早于工具进度到达时显示稳定状态标签，在完成时清除它，并将最终回答作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（默认值：预览流式传输处于活跃状态时为 `true`）
    - `streaming.preview.commandText` 控制这些工具进度行中的命令/exec 详情：`raw`（默认值，保留已发布行为）或 `status`（仅工具标签）
    - `streaming.progress.commentary`（默认值：`false`）选择在临时进度草稿中包含智能体评论/前言文本
    - 会检测旧版 `channels.telegram.streamMode`、布尔型 `streaming` 值，以及已停用的原生草稿预览键；运行 `openclaw doctor --fix` 将它们迁移到当前流式传输配置

    工具进度预览更新是在工具运行时显示的短状态行，例如命令执行、文件读取、计划更新、补丁摘要，或 Codex app-server 模式中的 Codex 前言/评论文本。Telegram 默认保持启用这些内容，以匹配 `v2026.4.22` 及更高版本中已发布的 OpenClaw 行为。

    若要保留回答文本的已编辑预览，但隐藏工具进度行，请设置：

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

    若要保持工具进度可见，但隐藏命令/exec 文本，请设置：

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

    当你想要可见的工具进度，但不想把最终回答编辑进同一条消息时，请使用 `progress` 模式。将命令文本策略放在 `streaming.progress` 下：

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

    仅当你想要只交付最终消息时，才使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，通用工具/进度闲聊会被抑制，而不是作为独立状态消息发送。审批提示、媒体载荷和错误仍通过正常最终交付路由。仅当你想保留回答预览编辑，同时隐藏工具进度状态行时，请使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 选中引用回复是例外。当 `replyToMode` 为 `"first"`、`"all"` 或 `"batched"`，且入站消息包含选中引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终回答，而不是编辑回答预览，因此 `streaming.preview.toolProgress` 无法显示该轮次的短状态行。没有选中引用文本的当前消息回复仍会保留预览流式传输。当工具进度可见性比原生引用回复更重要时，请设置 `replyToMode: "off"`；或设置 `streaming.preview.toolProgress: false` 以明确接受该取舍。
    </Note>

    对于纯文本回复：

    - 短私信/群组/主题预览：OpenClaw 会保留同一条预览消息，并在原处执行最终编辑
    - 拆分为多条 Telegram 消息的长文本最终回复会尽可能复用现有预览作为第一个最终分块，然后只发送剩余分块
    - 进度模式最终回复会清除状态草稿，并使用正常最终交付，而不是把草稿编辑成回答
    - 如果最终编辑在完成文本确认前失败，OpenClaw 会使用正常最终交付，并清理过时的预览

    对于复杂回复（例如媒体载荷），OpenClaw 会回退到正常最终交付，然后清理预览消息。

    预览流式传输独立于分块流式传输。当 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。

    推理流行为：

    - `/reasoning stream` 使用受支持渠道的推理预览路径；在 Telegram 上，它会在生成期间将推理流式传输到实时预览中
    - 推理预览会在最终交付后删除；当推理应保持可见时，请使用 `/reasoning on`
    - 最终回答发送时不包含推理文本

  </Accordion>

  <Accordion title="富消息格式">
    默认情况下，出站文本使用标准 Telegram HTML 消息，因此回复在当前 Telegram 客户端中保持可读。此兼容模式支持常规粗体、斜体、链接、代码、剧透和引用，但不支持 Bot API 10.1 的富文本专用块，例如原生表格、详情、富媒体和公式。

    设置 `channels.telegram.richMessages: true` 以选择使用 Bot API 10.1 富消息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    启用后：

    - 会告知智能体此 Bot/账号可使用 Telegram 富消息。
    - Markdown 文本会通过 OpenClaw 的 Markdown IR 渲染，并作为 Telegram 富 HTML 发送。
    - 显式富 HTML 载荷会保留受支持的 Bot API 10.1 标签，例如标题、表格、详情、富媒体和公式。
    - 媒体说明仍使用 Telegram HTML 说明，因为富消息不会替代说明。

    这会让模型文本避开 Telegram Rich Markdown 标记，因此 `$400-600K` 之类的金额不会被解析为数学公式。长富文本会自动按 Telegram 的富文本和富块限制拆分。超过 Telegram 列限制的表格会作为代码块发送。

    默认值：关闭，以保持客户端兼容性。富消息需要兼容的 Telegram 客户端；一些当前的 Desktop、Web、Android 和第三方客户端会将已接受的富消息显示为不支持。除非与该 Bot 一起使用的每个客户端都可以渲染它们，否则请保持此选项禁用。`/status` 会显示当前 Telegram 会话的富消息是开启还是关闭。

    链接预览默认启用。`channels.telegram.linkPreview: false` 会跳过富文本的自动实体检测。

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

    - 名称会规范化（去掉前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    说明：

    - 自定义命令只是菜单条目；它们不会自动实现行为
    - 插件/skill 命令即使未显示在 Telegram 菜单中，键入时仍可工作

    如果禁用原生命令，内置命令会被移除。自定义/插件命令在已配置时仍可注册。

    常见设置失败：

    - `setMyCommands failed` 并显示 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 菜单在裁剪后仍然溢出；请减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并显示 `404: Not Found` 时，可能意味着 `channels.telegram.apiRoot` 被设置成了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根路径，且 `openclaw doctor --fix` 会移除意外的尾随 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了已配置的 Bot token。请用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 并伴随网络/fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    当安装了 `device-pair` 插件时：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 当只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码携带短期 bootstrap token。内置设置代码 bootstrap 会返回一个持久 node token，带有 `scopes: []`，外加一个有界的 operator handoff token，用于受信任的移动端新手引导。该 operator token 可以读取设置时的原生配置，但不会授予配对变更作用域或 `operator.admin`。

    如果设备用变更后的凭证详情重试（例如角色/作用域/公钥），先前的待处理请求会被取代，新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

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

    Telegram `web_app` 按钮仅在用户与机器人之间的私聊中可用。

    未被已注册插件交互式处理程序认领的回调点击会作为文本传递给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="面向智能体和自动化的 Telegram 消息操作">
    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、可选 `presentation` 内联按钮；仅按钮编辑会更新回复标记）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    渠道消息操作会暴露易用的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制项：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 目前默认启用，并且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用活跃的配置/密钥快照（启动/重新加载），因此操作路径不会在每次发送时执行临时的 SecretRef 重新解析。

    移除回应的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成的输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定的 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    启用回复线程且原始 Telegram 文本或说明文字可用时，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元，因此更长的消息会从开头开始引用；如果 Telegram 拒绝该引用，则回退为普通回复。

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会生效。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：

    - 话题会话键会追加 `:topic:<threadId>`
    - 回复和输入状态会定向到话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    通用话题（`threadId=1`）特殊处理：

    - 发送消息会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 输入状态操作仍会包含 `message_thread_id`

    话题继承：除非覆盖，话题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅适用于话题，不会从群组默认值继承。
    `topics."*"` 会为该群组中的每个话题设置默认值；精确话题 ID 仍优先于 `"*"`。

    **按话题路由智能体**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这会为每个话题提供独立的工作区、记忆和会话。示例：

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

    随后，每个话题都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定（`bindings[]`，其中 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的话题限定 ID）固定 ACP harness 会话。目前作用域限定为群组/超级群组中的论坛话题。参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天生成线程绑定的 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会在话题内固定生成确认消息。需要保持启用 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文暴露 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留回复元数据；仅当 Telegram `getMe` 为机器人报告 `has_topics_enabled: true` 时，它们才使用线程感知的会话键。
    原先的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆盖项已被有意废弃；请将 BotFather 线程模式作为唯一事实来源，并运行 `openclaw doctor --fix` 来移除过时配置键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音消息和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 以强制作为语音消息发送
    - 入站语音消息转录会在智能体上下文中被标记为机器生成的、不可信的文本；提及检测仍使用原始转录，因此由提及门控的语音消息可以继续工作。

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

    贴纸描述会缓存在 OpenClaw SQLite 插件状态中，以减少重复的视觉调用。

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

  <Accordion title="Reaction notifications">
    Telegram 回复反应会以 `message_reaction` 更新到达（与消息载荷分开）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅用户对机器人发送消息的回复反应（通过已发送消息缓存尽力实现）。
    - 回复反应事件仍会遵守 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权的发送者会被丢弃。
    - Telegram 不会在回复反应更新中提供话题 ID。
      - 非论坛群组路由到群聊会话
      - 论坛群组路由到群组通用话题会话（`:topic:1`），而不是确切的来源话题

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。`ackReactionScope` 决定该表情符号实际在*何时*发送。

    **表情符号（`ackReaction`）解析顺序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Telegram 期望 Unicode 表情符号（例如 "👀"）。
    - 使用 `""` 可为某个渠道或账号禁用该回复反应。

    **范围（`messages.ackReactionScope`）：**

    Telegram provider 会从 `messages.ackReactionScope` 读取范围（默认 `"group-mentions"`）。目前没有 Telegram 账号级或 Telegram 渠道级覆盖项。

    取值：`"all"`（私信 + 群组）、`"direct"`（仅私信）、`"group-all"`（每条群组消息，无私信）、`"group-mentions"`（机器人被提及时的群组；**无私信** — 这是默认值）、`"off"` / `"none"`（禁用）。

    <Note>
    默认范围（`"group-mentions"`）不会在直接消息中触发确认回复反应。要在入站 Telegram 私信上获得确认回复反应，请将 `messages.ackReactionScope` 设为 `"direct"` 或 `"all"`。该值会在 Telegram provider 启动时读取，因此需要重启 Gateway 网关才能让更改生效。
    </Note>

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
    默认使用长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选项为 `webhookPath`、`webhookHost`、`webhookPort`（默认值为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在长轮询模式下，OpenClaw 仅在更新成功分发后持久化其重启水位线。如果处理程序失败，该更新会在同一进程中保持可重试，并且不会被写入为已完成以用于重启去重。

    本地监听器绑定到 `127.0.0.1:8787`。对于公共入口，请在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会先验证请求保护、Telegram secret token 和 JSON 正文，然后再向 Telegram 返回 `200`。
    随后 OpenClaw 会通过与长轮询相同的按聊天/按话题机器人通道异步处理更新，因此缓慢的智能体轮次不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 在按长度拆分前优先使用段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500）控制 Telegram 相册/媒体组在 OpenClaw 将其作为一条入站消息分发之前缓冲多久。如果相册部分到达较晚，请增大它；如果要降低相册回复延迟，请减小它。
    - `channels.telegram.timeoutSeconds` 覆盖 Telegram API 客户端超时（未设置时使用 grammY 默认值）。Bot 客户端会将配置值限制在 60 秒出站文本/正在输入请求保护以下，这样 grammY 就不会在 OpenClaw 的传输保护和回退运行前中止可见回复投递。长轮询仍使用 45 秒 `getUpdates` 请求保护，因此空闲轮询不会被无限期放弃。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；仅在出现误报轮询停滞重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 当 Gateway 网关已观察到父消息时，回复/引用/转发的补充上下文会被规范化到一个选定的会话上下文窗口中；已观察消息缓存位于 OpenClaw SQLite 插件状态中，`openclaw doctor --fix` 会导入旧版辅助文件。Telegram 在更新中只包含一个浅层 `reply_to_message`，因此早于缓存的链会受限于 Telegram 当前的更新载荷。
    - Telegram 允许列表主要限制谁可以触发智能体，而不是完整的补充上下文遮盖边界。
    - 私信历史控制项：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助函数（CLI/工具/操作）中的可恢复出站 API 错误。入站最终回复投递也会对 Telegram 预连接失败使用有界安全发送重试，但不会重试可能重复发送可见消息的模糊发送后网络信封。

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

    仅 Telegram 可用的投票标志：

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用于论坛主题（也可以使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带 `buttons` 块的 `--presentation` 创建内联键盘
    - 当 bot 可以在该聊天中置顶时，使用 `--pin` 或 `--delivery '{"pin":true}'` 请求置顶投递
    - 使用 `--force-document` 将出站图片、GIF 和视频作为文档发送，而不是压缩照片、动画媒体或视频上传

    操作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保留常规发送能力

  </Accordion>

  <Accordion title="Telegram 中的 Exec 审批">
    Telegram 支持在审批者私信中进行 Exec 审批，并可选择在原始聊天或主题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（当至少一个审批者可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字所有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与 bot 对话，以及它在哪里发送普通回复。它们不会让某人成为 Exec 审批者。当还没有命令所有者时，第一次已批准的私信配对会引导生成 `commands.ownerAllowFrom`，因此单所有者设置仍可在不重复填写 `execApprovals.approvers` 下 ID 的情况下工作。

    频道投递会在聊天中显示命令文本；仅在可信群组/主题中启用 `channel` 或 `both`。当提示落在论坛主题中时，OpenClaw 会为审批提示和后续消息保留该主题。Exec 审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的审批 ID 通过插件审批解析；其他 ID 优先通过 Exec 审批解析。

    请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，错误策略会控制是否向 Telegram 聊天发送错误消息：

| 键                                  | 值                         | 默认值          | 描述                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 将每条错误消息发送到聊天。`once` — 在每个冷却窗口内，每条唯一错误消息只发送一次（抑制重复的相同错误）。`silent` — 从不向聊天发送错误消息。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 策略的冷却窗口。发送错误后，在此间隔结束前会抑制相同错误消息。可防止故障期间产生错误刷屏。                                             |

支持按账号、按群组和按主题覆盖（与其他 Telegram 配置键使用相同继承）。

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

## 故障排除

<AccordionGroup>
  <Accordion title="Bot 不响应非提及群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather: `/setprivacy` -> Disable
      - 然后将 bot 从群组移除并重新添加
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法探测成员关系。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，必须列出该群组（或包含 `"*"`）
    - 验证 bot 在群组中的成员身份
    - 查看日志：使用 `openclaw logs --follow` 查看跳过原因

  </Accordion>

  <Accordion title="命令部分生效或完全不生效">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 伴随 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；请减少插件/skill/自定义命令，或禁用原生菜单
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 正在输入调用有边界限制，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/fetch 错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性问题

  </Accordion>

  <Accordion title="启动报告未授权令牌">

    - `getMe returned 401` 是配置的 bot 令牌发生 Telegram 身份验证失败。
    - 在 BotFather 中重新复制或重新生成 bot 令牌，然后为默认账号更新 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是身份验证失败；将其视为“没有 webhook 存在”只会把相同的错误令牌失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/proxy 可能会在 AbortSignal 类型不匹配时触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站可能导致间歇性 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些作为可恢复网络错误进行重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用成功的启动 `getMe` 探测，因此运行器不需要在第一次 `getUpdates` 之前再执行第二次 `getMe`。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬时网络错误失败，OpenClaw 会继续进入长轮询，而不是再次执行预轮询控制平面调用。仍然活跃的 webhook 会表现为 `getUpdates` 冲突；随后 OpenClaw 会重建 Telegram 传输并重试 webhook 清理。
    - 如果 Telegram 套接字按较短固定周期回收，请检查是否存在较低的 `channels.telegram.timeoutSeconds`；bot 客户端会将配置值限制在出站和 `getUpdates` 请求保护以下，但旧版本在该值低于这些保护时，可能会中止每次轮询或回复。
    - 如果日志包含 `Polling stall detected`，OpenClaw 默认会在 120 秒内没有完成长轮询活性后重启轮询并重建 Telegram 传输。
    - 当运行中的轮询账号在启动宽限期后尚未完成 `getUpdates`、运行中的 webhook 账号在启动宽限期后尚未完成 `setWebhook`，或上一次成功的轮询传输活动已陈旧时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告误报轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的 proxy、DNS、IPv6 或 TLS 出站问题。
    - Telegram 也会为 Bot API 传输遵循进程 proxy 环境变量，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果在服务环境中通过 `OPENCLAW_PROXY_URL` 配置了 OpenClaw 托管 proxy，且不存在标准 proxy 环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，然后是进程默认值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不适用，Node 22+ 会回退到 `ipv4first`。
    - 如果你的主机是 WSL2，或明确更适合仅 IPv4 行为，请强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准测试范围的应答（`198.18.0.0/15`）默认已允许
      用于 Telegram 媒体下载。如果受信任的 fake-IP 或
      透明代理在媒体下载期间将 `api.telegram.org` 重写为其他
      私有/内部/特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一选择也可按账号配置，位置为
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持
      危险标志关闭。Telegram 媒体默认已经允许 RFC 2544
      基准测试范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅在受信任且由操作员控制的代理环境中使用它，
      例如 Clash、Mihomo 或 Surge fake-IP 路由，并且它们会合成
      RFC 2544 基准测试范围之外的私有或特殊用途应答。普通公网
      Telegram 访问应保持关闭。
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

更多帮助：[频道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[配置参考 - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 启动/凭证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 话题默认值：`groups.<chatId>.topics."*"` 适用于未匹配的论坛话题；精确话题 ID 会覆盖它
- Exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`、`trustedLocalFileRoots`
- 自定义 API 根：`apiRoot`（仅 Bot API 根；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 动作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：配置两个或更多账号 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确默认路由。否则 OpenClaw 会回退到第一个规范化后的账号 ID，且 `openclaw doctor` 会发出警告。具名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户配对到 Gateway 网关。
  </Card>
  <Card title="Groups" icon="users" href="/zh-CN/channels/groups">
    群组和话题 allowlist 行为。
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
    跨频道诊断。
  </Card>
</CardGroup>

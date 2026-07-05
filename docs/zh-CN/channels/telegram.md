---
read_when:
    - 处理 Telegram 功能或 Webhooks
summary: Telegram Bot 支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-07-05T11:05:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5610b1cb8404da02ce1983ca05ff1b8dbd2e13b25eebc2a8bbc09e29d621151a
    source_path: channels/telegram.md
    workflow: 16
---

可用于生产环境，支持通过 grammY 处理 Bot 私信和群组。默认传输方式是长轮询；webhook 模式可选。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="频道故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复手册。
  </Card>
  <Card title="Gateway 配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的频道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建 Bot token">
    打开 Telegram，与 **@BotFather** 对话（确认句柄正是 `@BotFather`），运行 `/newbot`，按照提示操作，并保存 token。
  </Step>

  <Step title="配置 token 和私信策略">

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

    环境变量回退：`TELEGRAM_BOT_TOKEN`（仅限默认账户；命名账户必须使用 `botToken` 或 `tokenFile`）。
    Telegram **不**使用 `openclaw channels login telegram`；在配置/环境变量中设置 token，然后启动 Gateway 网关。

  </Step>

  <Step title="启动 Gateway 网关并批准第一个私信">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配对码会在 1 小时后过期。

  </Step>

  <Step title="将 Bot 添加到群组">
    将 Bot 添加到你的群组，然后获取群组访问所需的两个 ID：

    - 你的 Telegram 用户 ID，用于 `allowFrom` / `groupAllowFrom`
    - Telegram 群聊 ID，作为 `channels.telegram.groups` 下的键

    从 `openclaw logs --follow`、转发 ID Bot，或 Bot API `getUpdates` 获取群聊 ID。允许该群组后，`/whoami@<bot_username>` 会确认用户和群组 ID。

    以 `-100` 开头的负数超级群组 ID 是群聊 ID。它们应放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom` 下。

  </Step>
</Steps>

<Note>
token 解析会感知账户：`tokenFile` 优先于 `botToken`，`botToken` 优先于环境变量，并且配置始终优先于 `TELEGRAM_BOT_TOKEN`（后者只会为默认账户解析）。成功启动后，OpenClaw 会缓存 Bot 身份最长 24 小时，因此重启时会跳过额外的 `getMe` 调用；更改或移除 token 会清除此缓存。
</Note>

## Telegram 侧设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram Bot 默认启用**隐私模式**，这会限制它们接收哪些群组消息。

    若要查看所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将 Bot 设为群组管理员。

    切换隐私模式后，请在每个群组中移除并重新添加 Bot，以便 Telegram 应用该更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。管理员 Bot 会接收所有群组消息，适用于始终在线的群组行为。
  </Accordion>

  <Accordion title="有用的 BotFather 开关">

    - `/setjoingroups` — 允许/拒绝添加到群组
    - `/setprivacy` — 群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

### 群组 Bot 身份

在群组和论坛话题中，显式提及已配置的 Bot 句柄（例如 `@my_bot`）会寻址所选 OpenClaw agent，即使 agent 人设名称与 Telegram 用户名不同。群组静默策略仍适用于无关流量，但 Bot 句柄本身永远不是“其他人”。

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制直接消息访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 会让任何找到或猜到 Bot 用户名的 Telegram 账户都能命令该 Bot。仅将它用于工具受到严格限制的有意公开 Bot；单所有者 Bot 应使用带数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀会被接受并规范化。
    在多账户配置中，限制性的顶层 `channels.telegram.allowFrom` 是安全边界：账户级 `allowFrom: ["*"]` 不会让该账户公开，除非合并后的有效 allowlist 仍包含显式通配符。
    `dmPolicy: "allowlist"` 搭配空 `allowFrom` 会阻止所有私信，并会被配置校验拒绝。
    设置流程只会询问数字用户 ID。如果你的配置中有来自旧版设置的 `@username` allowlist 条目，请运行 `openclaw doctor --fix` 将它们解析为数字 ID（尽力而为；需要 Telegram Bot token）。
    如果你之前依赖配对存储 allowlist 文件，`openclaw doctor --fix` 可以将条目恢复到 `channels.telegram.allowFrom` 中，用于 allowlist 流程（例如当 `dmPolicy: "allowlist"` 还没有显式 ID 时）。

    对于单所有者 Bot，优先使用带显式数字 `allowFrom` ID 的 `dmPolicy: "allowlist"`，而不是依赖之前的配对批准。

    常见困惑：私信配对批准并不表示“此发送者在所有地方都已授权”。配对只授予私信访问权限。如果还没有命令所有者，第一次批准的配对还会设置 `commands.ownerAllowFrom`，为仅所有者命令和 exec 审批提供显式操作员账户。群组发送者授权仍来自显式配置 allowlist。
    若要用同一身份同时授权私信和群组命令：将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`，并且对于仅所有者命令，确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 查找你的 Telegram 用户 ID

    更安全（无需第三方 Bot）：私信你的 Bot，运行 `openclaw logs --follow`，读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和 allowlist">
    两项控制会一起生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 没有 `groups` 配置，`groupPolicy: "open"`：任何群组都通过群组 ID 检查
       - 没有 `groups` 配置，`groupPolicy: "allowlist"`（默认）：所有群组都会被阻止，直到你添加 `groups` 条目（或 `"*"`）
       - 已配置 `groups`：作为 allowlist 生效（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（默认）/ `disabled`

    `groupAllowFrom` 过滤群组发送者；如果未设置，Telegram 会回退到 `allowFrom`（不是配对存储 — 群组发送者认证从不继承私信配对存储批准，这是自 `2026.2.25` 起的安全边界）。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）；非数字条目会被忽略。不要在这里放群组或超级群组聊天 ID — 负数聊天 ID 属于 `channels.telegram.groups`。
    单所有者 Bot 的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    如果配置中完全缺少 `channels.telegram`，运行时会默认 fail-closed `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

    仅所有者群组设置：

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

    在群组中用 `@<bot_username> ping` 测试。当 `requireMention: true` 时，普通群组消息不会触发 Bot。

    允许一个特定群组中的任何成员：

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

    只允许一个特定群组中的特定用户：

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
      常见错误：`groupAllowFrom` 不是群组 allowlist。

      - 负数 Telegram 群组/超级群组聊天 ID（`-1001234567890`）放在 `channels.telegram.groups` 下。
      - Telegram 用户 ID（`8734062810`）放在 `groupAllowFrom` 下，用于限制允许群组内哪些人可以触发 Bot。
      - 仅在允许某个已允许群组的任意成员与 Bot 对话时，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行为">
    群组回复默认需要提及。提及可以来自：

    - 原生 `@botusername` 提及，或
    - `agents.list[].groupChat.mentionPatterns` 或 `messages.groupChat.mentionPatterns` 中的提及模式

    会话级开关（仅状态，不持久化）：`/activation always`、`/activation mention`。使用配置实现持久化：

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

    群组历史上下文始终开启，并受 `historyLimit` 限制。设置 `channels.telegram.historyLimit: 0` 可禁用群组历史窗口。`openclaw doctor --fix` 会移除已废弃的 `includeGroupHistoryContext` 键。

    获取群聊 ID：将群组消息转发给 `@userinfobot` / `@getidsbot`，从 `openclaw logs --follow` 读取 `chat.id`，检查 Bot API `getUpdates`，或（在群组已允许后）运行 `/whoami@<bot_username>`。

  </Tab>
</Tabs>

## 运行时行为

- Telegram 在 Gateway 网关进程内运行。
- 路由是确定性的：Telegram 入站会回复到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享频道信封，其中包含回复元数据、媒体占位符，以及 Gateway 网关已观察到的回复的持久化回复链上下文。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>`。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会为回复保留它。仅当 Telegram `getMe` 报告该 Bot 的 `has_topics_enabled: true` 时，私信话题会话才会拆分；否则私信保持扁平会话。
- 长轮询使用 grammY runner，并按每个聊天/每个线程排序。Runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 多账户启动会限制并发 `getMe` 探测，因此大型 Bot 集群不会一次性展开所有账户探测。
- 每个 Gateway 网关进程都会保护长轮询，确保同一时间只有一个活动 poller 可以使用一个 Bot token。持续的 `getUpdates` 409 冲突表示另一个 OpenClaw Gateway 网关、脚本或外部 poller 正在使用同一个 token。
- 轮询 watchdog 默认会在 120 秒内没有完成的 `getUpdates` 存活信号后重启。仅当你的部署在长时间运行工作期间出现误判的轮询停滞重启时，才提高 `channels.telegram.pollingStallThresholdMs`（30000-600000，支持按账户覆盖）。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已被移除。如果你的配置仍有这些键，升级后请运行 `openclaw doctor --fix`。私信话题路由现在遵循 Telegram `getMe.has_topics_enabled`（由 BotFather threaded mode 控制）：启用话题的 Bot 在 Telegram 发送 `message_thread_id` 时使用按线程划分的私信会话；其他私信保持扁平会话。
</Note>

## 功能参考

<AccordionGroup>
  <Accordion title="实时流预览（消息编辑）">
    OpenClaw 会在私聊、群组和话题中实时流式输出部分回复：先发送一条预览消息，然后反复调用 `editMessageText`，最后在原位置完成。

    - `channels.telegram.streaming` 是 `off | partial | block | progress`（默认：`partial`）
    - 简短的初始答案预览会经过防抖处理；如果运行仍处于活动状态，会在有界延迟后实体化
    - `progress` 会为工具进度保留一条可编辑的状态草稿，当答案活动早于工具进度到达时显示稳定的状态标签，在完成时清除它，并将最终答案作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（预览流式传输启用时默认：`true`）
    - `streaming.preview.commandText` 控制这些行内的命令/exec 详情：`raw`（默认）或 `status`（仅工具标签）
    - `streaming.progress.commentary`（默认：`false`）选择在临时进度草稿中包含助手评论/前言文本
    - 旧版 `channels.telegram.streamMode`、布尔 `streaming` 值和已退役的原生草稿预览键会被检测到；运行 `openclaw doctor --fix` 迁移它们

    工具进度行是在工具运行时显示的简短状态更新（命令执行、文件读取、规划更新、补丁摘要、app-server 模式中的 Codex 前言/评论）。Telegram 默认保持这些内容开启（匹配 `v2026.4.22`+ 发布后的行为）。

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

    `streaming.mode: "off"` 会禁用预览编辑，并抑制通用工具/进度闲聊，而不是将其作为独立状态消息发送；审批提示、媒体和错误仍会通过正常的最终投递路径路由。`streaming.preview.toolProgress: false` 只保留答案预览编辑。

    <Note>
      已选引用回复是例外。当 `replyToMode` 为 `first`、`all` 或 `batched`，且入站消息包含已选引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法在该轮显示状态行。没有已选引用文本的当前消息回复仍会流式输出。当工具进度可见性比原生引用回复更重要时，设置 `replyToMode: "off"`；或设置 `streaming.preview.toolProgress: false` 以接受该取舍。
    </Note>

    对于纯文本回复：简短预览会在原位置进行最终编辑；拆分为多条消息的较长最终内容会复用预览作为第一个分块，然后只发送剩余部分；进度模式的最终内容会清除状态草稿，并使用正常最终投递；如果在确认完成之前最终编辑失败，OpenClaw 会回退到正常最终投递，并清理过时的预览。对于复杂回复（媒体载荷），OpenClaw 始终会回退到正常最终投递，并清理预览。

    预览流式传输和分块流式传输互斥——当明确启用分块流式传输时，OpenClaw 会跳过预览流，避免双重流式传输。

    推理：`/reasoning stream` 会在生成时将推理流式输出到实时预览中，然后在最终投递后删除推理预览（使用 `/reasoning on` 保持其可见）。最终答案发送时不包含推理文本。

  </Accordion>

  <Accordion title="富消息格式">
    出站文本默认使用标准 Telegram HTML 消息，在当前客户端中均可阅读：粗体、斜体、链接、代码、剧透、引用——而不是 Bot API 10.1 的仅富文本块（原生表格、详情、富媒体、公式）。

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

    启用后：智能体会被告知此 bot/account 可使用富消息；Markdown 文本会通过 OpenClaw 的 Markdown IR 渲染为 Telegram 富 HTML；显式富 HTML 载荷会保留受支持的 Bot API 10.1 标签（标题、表格、详情、富媒体、公式）；媒体标题仍使用 Telegram HTML 标题（富消息不会替代标题，且标题上限为 1024 个字符）。

    这会让模型文本避开 Telegram 的富 Markdown 标记，因此 `$400-600K` 这样的金额不会被解析为数学公式。长富文本会按 Telegram 的限制自动拆分。超过 20 列限制的表格会回退为代码块。

    默认：关闭，以保持客户端兼容性——一些当前的 Desktop、Web、Android 和第三方客户端会将已接受的富消息渲染为不受支持。除非与该 bot 一起使用的每个客户端都能渲染它们，否则保持关闭。`/status` 会显示当前会话的富消息是开启还是关闭。

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

    规则：名称会被规范化（去除前导 `/`，转为小写）；有效模式为 `a-z`、`0-9`、`_`，长度 1-32；自定义命令不能覆盖原生命令；冲突/重复项会被跳过并记录日志。

    自定义命令只是菜单项——它们不会自动实现行为。即使未显示在 Telegram 菜单中，插件/skill 命令在输入时仍可能工作。如果禁用原生命令，内置命令会被移除；如果已配置，自定义/插件命令仍可能注册。

    常见设置失败：

    - `setMyCommands failed` 在一次裁剪重试后伴随 `BOT_COMMANDS_TOO_MUCH`，表示菜单仍然溢出；减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 以 `404: Not Found` 失败时，通常表示 `channels.telegram.apiRoot` 被设置为了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根；`openclaw doctor --fix` 会移除意外的尾随 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了配置的 bot token。使用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`（默认账号）；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 伴随网络/fetch 错误，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装后：

    1. `/pair` 生成设置代码
    2. 将代码粘贴到 iOS app 中
    3. `/pair pending` 列出待处理请求（包括角色/权限范围）
    4. 批准：`/pair approve <requestId>`、`/pair approve`（仅有一个待处理请求）或 `/pair approve latest`

    如果设备使用已变更的认证详情（角色、权限范围、公钥）重试，先前的待处理请求会被新的 `requestId` 取代；批准前请重新运行 `/pair pending`。

    更多详情：[配对](/zh-CN/channels/pairing#pair-via-telegram)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘权限范围：

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

    权限范围：`off`、`dm`、`group`、`all`、`allowlist`（默认）。旧版 `capabilities: ["inlineButtons"]` 会映射到 `"all"`。

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

    `web_app` 按钮只适用于用户与 bot 之间的私聊。

    未被已注册插件交互处理器认领的回调点击会作为文本传递给智能体：`callback_data: <value>`。

  </Accordion>

  <Accordion title="面向智能体和自动化的 Telegram 消息动作">
    动作：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、可选 `presentation` 内联按钮；仅按钮编辑会更新回复标记）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    易用别名：`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    门控：`channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（默认：禁用）。`edit`、`createForumTopic` 和 `editForumTopic` 默认启用，且没有专用开关。
    运行时发送会使用启动/重载时的活动配置/密钥快照，因此动作路径不会在每次发送时重新解析 `SecretRef` 值。

    表情回应移除语义：[/tools/reactions](/zh-CN/tools/reactions)。

  </Accordion>

  <Accordion title="回复线程标签">
    生成输出中的显式回复线程标签：

    - `[[reply_to_current]]`——回复触发消息
    - `[[reply_to:<id>]]`——回复特定消息 ID

    `channels.telegram.replyToMode`：`off`（默认）、`first`、`all`。

    当启用回复线程且原始文本/标题可用时，OpenClaw 会自动添加原生引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元；更长的消息会从开头引用，并在 Telegram 拒绝引用时回退为普通回复。

    `off` 只会禁用隐式回复线程；显式 `[[reply_to_*]]` 标签仍会生效。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：话题会话键追加 `:topic:<threadId>`；回复和正在输入状态会指向话题线程；话题配置路径为 `channels.telegram.groups.<chatId>.topics.<threadId>`。

    常规话题（`threadId=1`）是一个特殊情况：发送消息时会省略 `message_thread_id`（Telegram 会以 “thread not found” 拒绝 `sendMessage(...thread_id=1)`），但输入状态动作仍会包含 `message_thread_id`（经验上这是显示输入指示器所必需的）。

    话题条目会继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` 仅适用于话题，不会从群组默认值继承。`topics."*"` 为该群组中的每个话题设置默认值；精确话题 ID 仍然优先于 `"*"`。

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

    随后每个话题都会有自己的会话键，例如 `agent:zu:telegram:group:-1001234567890:topic:3`。

    **持久化 ACP 话题绑定**：论坛话题可以通过顶层类型化绑定固定 ACP harness 会话（`bindings[]`，其中包含 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的带话题限定的 ID）。当前范围限定为群组/超级群组中的论坛话题。参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天绑定线程的 ACP 生成**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里，并且 OpenClaw 会在话题内置顶生成确认。需要 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文会暴露 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留回复元数据，但只有在 Telegram `getMe` 报告 `has_topics_enabled: true` 时，才会使用支持线程的会话键。
    已停用的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆盖项已移除；BotFather 线程模式是唯一事实来源。运行 `openclaw doctor --fix` 以移除过时的配置键。

  </Accordion>

  <Accordion title="Audio, video, and stickers">
    ### 音频消息

    Telegram 会区分语音便条和音频文件。默认：音频文件行为；在智能体回复中标记 `[[audio_as_voice]]` 可强制发送语音便条。入站语音便条转录会在智能体上下文中被框定为机器生成的不可信文本，但提及检测仍会使用原始转录，因此受提及门控的语音消息仍可正常工作。

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

    Telegram 会区分视频文件和视频便条。视频便条不支持说明文字；提供的消息文本会单独发送。

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

    发送：

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
    Telegram 表情回应会以 `message_reaction` 更新的形式到达，独立于消息载荷。启用后，OpenClaw 会将类似 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 的系统事件加入队列。

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    `own` 表示仅用户对机器人发送消息的表情回应（通过已发送消息缓存尽力判断）。表情回应事件仍会遵守 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。

    Telegram 不会在表情回应更新中提供线程 ID：非论坛群组会路由到群组聊天会话；论坛群组会路由到常规话题会话（`:topic:1`），而不是精确的来源话题。

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认表情符号。`messages.ackReactionScope` 决定它在*何时*发送。

    **表情符号解析顺序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    Telegram 需要 unicode 表情符号（例如 "👀"）；使用 `""` 可为某个渠道或账号禁用该表情回应。

    **范围（`messages.ackReactionScope`，默认 `"group-mentions"`；目前没有 Telegram 账号或 Telegram 渠道覆盖项）：**

    `all`（私信 + 群组）、`direct`（仅私信）、`group-all`（每条群组消息，不含私信）、`group-mentions`（群组中机器人被提及时；**不含私信** — 默认）、`off` / `none`（已禁用）。

    <Note>
    默认范围（`group-mentions`）不会在私信中触发确认表情回应。为此请将 `messages.ackReactionScope` 设置为 `direct` 或 `all`。该值会在 Telegram provider 启动时读取，因此需要重启 Gateway 网关才能使更改生效。
    </Note>

  </Accordion>

  <Accordion title="Config writes from Telegram events and commands">
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

  <Accordion title="Long polling vs webhook">
    默认是长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选项包括 `webhookPath`（默认 `/telegram-webhook`）、`webhookHost`（默认 `127.0.0.1`）、`webhookPort`（默认 `8787`）、`webhookCertPath`（用于直连 IP 或无域名设置的自签名证书 PEM）。

    在长轮询模式下，OpenClaw 仅在更新成功分发后才会持久化其重启水位线；失败的处理程序会让该更新在同一进程中保持可重试状态，而不是将其标记为已完成。

    本地监听器默认绑定到 `127.0.0.1:8787`。对于公网入口，请在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会在返回 `200` 之前验证请求保护、Telegram secret token 和 JSON 正文。随后 OpenClaw 会通过与长轮询相同的按聊天/按话题机器人通道异步处理该更新，因此较慢的智能体轮次不会阻塞 Telegram 的送达 ACK。

  </Accordion>

  <Accordion title="Limits, retry, and CLI targets">
    - `channels.telegram.textChunkLimit` 默认值为 4000；`chunkMode="newline"` 会先优先按段落边界（空行）切分，再按长度切分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500，范围 10-60000）控制相册/媒体组在 OpenClaw 将其作为一条入站消息分发前缓冲多久。如果相册部分到达较晚，请增大该值；如果要降低相册回复延迟，请减小该值。
    - `channels.telegram.timeoutSeconds` 覆盖 API 客户端超时（未设置时使用 grammY 默认值）。机器人客户端会将低于 60 秒出站文本/输入状态请求保护的配置值钳制到该保护以内，这样 grammY 就不会在 OpenClaw 的传输保护和回退运行之前中止可见回复投递。长轮询仍使用 45 秒的 `getUpdates` 请求保护，避免空闲轮询被无限期挂起。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 120000；仅在误报轮询停滞重启时，才在 30000 到 600000 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 当 Gateway 网关已观察到父消息时，回复/引用/转发补充上下文会规范化为一个选定的对话上下文窗口；已观察消息缓存位于 OpenClaw SQLite 插件状态中，`openclaw doctor --fix` 会导入旧版 sidecar。Telegram 每次更新只包含一个浅层 `reply_to_message`，因此早于缓存的链只能受限于该载荷。
    - Telegram allowlist 主要用于限制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` 适用于 Telegram 发送辅助函数（CLI/工具/动作）中的可恢复出站 API 错误。入站最终回复投递会对连接前失败使用有界安全发送重试，但不会重试可能导致可见消息重复的歧义发送后网络信封。

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

    仅 Telegram 的投票标志：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（或 `:topic:` 目标）。`--poll-option` 重复 2-12 次（Telegram 的选项上限）。

    Telegram 发送还支持带 `buttons` 块的 `--presentation`，用于内联键盘（当 `channels.telegram.capabilities.inlineButtons` 允许时）；支持 `--pin` 或 `--delivery '{"pin":true}'`，用于在机器人可在该聊天中置顶时请求置顶投递；还支持 `--force-document`，用于将出站图片、GIF 和视频作为文档发送，而不是压缩/动画/视频上传。

    动作门控：`channels.telegram.actions.sendMessage=false` 会禁用所有出站消息，包括投票；`channels.telegram.actions.poll=false` 会禁用投票创建，同时保持常规发送启用。

  </Accordion>

  <Accordion title="Exec approvals in Telegram">
    Telegram 支持在审批者私信中进行 exec 审批，也可以选择在来源聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    - `channels.telegram.execApprovals.enabled`（`"auto"` 会在至少一个审批者可解析时启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字所有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与机器人对话，以及机器人将普通回复发送到哪里；它们不会让某人成为 Exec 审批人。首次获批的私信配对会在尚不存在命令所有者时引导设置 `commands.ownerAllowFrom`，因此单所有者设置无需在 `execApprovals.approvers` 下重复填写 ID。

    渠道投递会在聊天中显示命令文本；仅在可信群组/话题中启用 `channel` 或 `both`。当提示落入论坛话题时，OpenClaw 会为审批提示和后续消息保留该话题。Exec 审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的审批 ID 会通过插件审批解析；其他 ID 会先通过 Exec 审批解析。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，错误策略会控制错误消息是否到达 Telegram 聊天：

| 键                                  | 值                         | 默认值          | 描述                                                                                                                                                                                   |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` 会将每条错误消息发送到聊天。`once` 会在每个冷却窗口内只发送一次每条唯一错误消息（抑制重复的相同错误）。`silent` 从不向聊天发送错误消息。 |
| `channels.telegram.errorCooldownMs` | 数字（毫秒）               | `14400000` (4h) | `once` 策略的冷却窗口。错误发送后，在此间隔过去前会抑制相同消息。可防止故障期间错误刷屏。                                                           |

支持按账户、按群组和按话题覆盖（继承方式与其他 Telegram 配置键相同）。

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
  <Accordion title="Bot does not respond to non mention group messages">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性：BotFather `/setprivacy` -> Disable，然后将机器人从群组中移除并重新添加。
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 会检查显式数字群组 ID；通配符 `"*"` 无法进行成员探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - 当存在 `channels.telegram.groups` 时，必须列出该群组（或包含 `"*"`）。
    - 验证机器人在该群组中的成员身份。
    - 查看 `openclaw logs --follow` 中的跳过原因。

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）；即使群组策略为 `open`，命令授权仍然适用。
    - `setMyCommands failed` 携带 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；减少插件/skill/自定义命令，或禁用原生菜单。
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 输入状态调用都是有界的，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/抓取错误通常表示无法通过 DNS/HTTPS 访问 `api.telegram.org`。

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401` 是配置的机器人令牌发生 Telegram 认证失败。在 BotFather 中重新复制或重新生成令牌，然后更新 `channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`（默认账户）。
    - 启动期间出现 `deleteWebhook 401 Unauthorized` 也是认证失败；将其视为“没有 webhook 存在”只会把同一个坏令牌故障推迟到后续 API 调用。

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ 搭配自定义 fetch/proxy 时，如果 `AbortSignal` 类型不匹配，可能触发立即中止行为。
    - 一些主机会先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站会导致间歇性 API 故障。
    - 带有 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!` 的日志会作为可恢复网络错误重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用成功的启动 `getMe` 探测，因此运行器不需要在第一次 `getUpdates` 前再进行第二次 `getMe`。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬时网络错误失败，OpenClaw 会继续进入长轮询，而不是再发起另一个轮询前控制面调用。仍处于活动状态的 webhook 随后会表现为 `getUpdates` 冲突；OpenClaw 会重建传输并重试 webhook 清理。
    - 如果 Telegram 套接字按较短固定周期回收，请检查 `channels.telegram.timeoutSeconds` 是否过低；机器人客户端会将低于出站和 `getUpdates` 请求保护值的配置值钳制到保护值以上，但旧版本在该值低于这些保护值时可能会中止每次轮询或回复。
    - 日志中的 `Polling stall detected` 表示 OpenClaw 在默认 120 秒内没有完成长轮询活性后，会重启轮询并重建传输。
    - 当正在运行的轮询账户在启动宽限期后尚未完成 `getUpdates`、正在运行的 webhook 账户在启动宽限期后尚未完成 `setWebhook`，或最后一次成功的轮询传输活动已过期时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告误报的轮询停滞重启时，才提高 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向到 `api.telegram.org` 的代理、DNS、IPv6 或 TLS 出站问题。
    - Telegram 会遵循进程代理环境变量用于 Bot API 传输：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果为服务环境设置了 `OPENCLAW_PROXY_URL`，且不存在标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过代理路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，再到进程默认值（例如 `NODE_OPTIONS=--dns-result-order=ipv4first`）；如果都不适用，则在 Node 22+ 上回退到 `ipv4first`。
    - 在 WSL2 上，或当仅 IPv4 行为效果更好时，强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准测试范围的答案（`198.18.0.0/15`）默认已允许用于 Telegram 媒体下载。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他私有/内部/特殊用途地址，请选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一选择性启用项也可按账户在 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 配置。
    - 如果你的代理将 Telegram 媒体主机解析到 `198.18.x.x`，请先保持危险标志关闭；该范围默认已允许。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram 媒体 SSRF 防护。仅在可信、由操作员控制的代理环境（Clash、Mihomo、Surge fake-IP 路由）中使用，这些环境会在 RFC 2544 基准测试范围之外合成私有或特殊用途答案。正常公网 Telegram 访问请保持关闭。
    </Warning>

    - 临时环境覆盖：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - 验证 DNS 答案：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[Configuration reference - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="High-signal Telegram fields">

- 启动/认证：`enabled`、`botToken`、`tokenFile`（必须是常规文件；符号链接会被拒绝）、`accounts.*`
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 话题默认值：`groups.<chatId>.topics."*"` 应用于未匹配的论坛话题；精确话题 ID 会覆盖它
- Exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`、`threadBindings`
- 流式传输：`streaming`（模式 `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 格式/投递：`textChunkLimit`、`chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根：`apiRoot`（仅 Bot API 根；不要包含 `/bot<TOKEN>`）、`trustedLocalFileRoots`（自托管 Bot API 的绝对 `file_path` 根）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- 动作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账户优先级：配置两个或更多账户 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以显式指定默认路由。否则 OpenClaw 会回退到第一个规范化账户 ID，并且 `openclaw doctor` 会发出警告。命名账户会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
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

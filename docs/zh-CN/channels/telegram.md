---
read_when:
    - 处理 Telegram 功能或 webhook
summary: Telegram 机器人的支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:10:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

通过 grammY 支持可用于生产的机器人私信和群组。长轮询是默认模式；webhook 模式是可选的。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨频道诊断和修复手册。
  </Card>
  <Card title="Gateway 网关配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的频道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    打开 Telegram 并与 **@BotFather** 对话（确认用户名完全是 `@BotFather`）。

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
    将机器人添加到你的群组，然后获取群组访问所需的两个 ID：

    - 你的 Telegram 用户 ID，用于 `allowFrom` / `groupAllowFrom`
    - Telegram 群组聊天 ID，用作 `channels.telegram.groups` 下的键

    首次设置时，请从 `openclaw logs --follow`、转发 ID 机器人或 Bot API `getUpdates` 获取群组聊天 ID。允许该群组后，`/whoami@<bot_username>` 可以确认用户和群组 ID。

    以 `-100` 开头的负数 Telegram 超级群组 ID 是群组聊天 ID。请将它们放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom` 下。

  </Step>
</Steps>

<Note>
令牌解析顺序感知账户。实际使用中，配置值优先于环境变量回退，且 `TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
成功启动后，OpenClaw 会在状态目录中缓存机器人身份最多 24 小时，这样重启时可以避免额外调用一次 Telegram `getMe`；更改或移除令牌会清除该缓存。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用 **隐私模式**，这会限制它们接收的群组消息。

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

### 群组机器人身份

在 Telegram 群组和论坛话题中，明确提及已配置的机器人用户名（例如 `@my_bot`）会被视为向所选 OpenClaw 智能体发言，即使智能体人格名称不同于 Telegram 用户名。群组静默策略仍适用于无关的群组流量，但机器人用户名本身不会被视为“别人”。

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制直接消息访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 会允许任何找到或猜到机器人用户名的 Telegram 账户命令该机器人。仅在有意公开且工具受到严格限制的机器人上使用它；单所有者机器人应使用带数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀会被接受并规范化。
    在多账户配置中，限制性的顶层 `channels.telegram.allowFrom` 会被视为安全边界：账户级 `allowFrom: ["*"]` 条目不会让该账户公开，除非合并后的有效账户 allowlist 仍包含显式通配符。
    `dmPolicy: "allowlist"` 搭配空的 `allowFrom` 会阻止所有私信，并会被配置校验拒绝。
    设置只会要求填写数字用户 ID。
    如果你已升级且配置包含 `@username` allowlist 条目，请运行 `openclaw doctor --fix` 来解析它们（尽力而为；需要 Telegram 机器人令牌）。
    如果你以前依赖配对存储的 allowlist 文件，`openclaw doctor --fix` 可以在 allowlist 流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 尚无显式 ID 时）。

    对于单所有者机器人，建议使用 `dmPolicy: "allowlist"` 并设置显式数字 `allowFrom` ID，以便在配置中持久保存访问策略（而不是依赖之前的配对批准）。

    常见混淆：私信配对批准并不意味着“此发送者在所有地方都已授权”。
    配对授予私信访问权限。如果尚不存在命令所有者，首次批准的配对还会设置 `commands.ownerAllowFrom`，让仅所有者命令和 exec 审批拥有显式操作员账户。
    群组发送者授权仍来自显式配置 allowlist。
    如果你希望“我授权一次后，私信和群组命令都能工作”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`；对于仅所有者命令，请确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 查找你的 Telegram 用户 ID

    更安全（无需第三方机器人）：

    1. 向你的机器人发送私信。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和 allowlist">
    两项控制会一起生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 无 `groups` 配置：
         - 搭配 `groupPolicy: "open"`：任何群组都可以通过群组 ID 检查
         - 搭配 `groupPolicy: "allowlist"`（默认）：群组会被阻止，直到你添加 `groups` 条目（或 `"*"`）
       - 已配置 `groups`：作为 allowlist（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 会回退到 `allowFrom`。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）。
    不要把 Telegram 群组或超级群组聊天 ID 放入 `groupAllowFrom`。负数聊天 ID 应放在 `channels.telegram.groups` 下。
    非数字条目会在发送者授权时被忽略。
    安全边界（`2026.2.25+`）：群组发送者身份验证**不会**继承私信配对存储的批准。
    配对仅适用于私信。对于群组，请设置 `groupAllowFrom` 或按群组/按话题设置 `allowFrom`。
    如果 `groupAllowFrom` 未设置，Telegram 会回退到配置中的 `allowFrom`，而不是配对存储。
    单所有者机器人的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果完全缺少 `channels.telegram`，运行时默认采用故障关闭的 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

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

    在群组中用 `@<bot_username> ping` 测试。`requireMention: true` 时，普通群组消息不会触发机器人。

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
      常见错误：`groupAllowFrom` 不是 Telegram 群组 allowlist。

      - 将类似 `-1001234567890` 的负数 Telegram 群组或超级群组聊天 ID 放在 `channels.telegram.groups` 下。
      - 当你想限制允许群组内哪些人可以触发机器人时，将类似 `8734062810` 的 Telegram 用户 ID 放在 `groupAllowFrom` 下。
      - 仅当你希望允许群组中的任何成员都能与机器人对话时，才使用 `groupAllowFrom: ["*"]`。

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

    这些只会更新会话状态。持久化请使用配置。

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

    群组历史上下文默认是 `mention-only`：仅当之前的群组消息是发给机器人、是对机器人的回复，或是机器人自己的消息时，才会包含这些消息。将 `includeGroupHistoryContext: "recent"` 设为包含可信群组的近期房间历史。将 `includeGroupHistoryContext: "none"` 设为在下一轮中不发送任何之前的 Telegram 群组历史。

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    获取群组聊天 ID：

    - 将群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 读取 `chat.id`
    - 或检查 Bot API `getUpdates`
    - 群组被允许后，如果已启用原生命令，运行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由网关进程拥有。
- 路由是确定性的：Telegram 入站消息会回复到 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道信封，其中包含回复元数据、媒体占位符，以及网关已观察到的 Telegram 回复的持久化回复链上下文。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会保留它用于回复。只有当 Telegram `getMe` 报告该机器人 `has_topics_enabled: true` 时，私信话题会话才会拆分；否则私信会保持在扁平会话上。
- 长轮询使用 grammY runner，并按聊天/线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 多账号启动会限制并发 Telegram `getMe` 探测，因此大型机器人集群不会一次性扇出所有账号探测。
- 长轮询在每个网关进程内部受到保护，因此同一时间只有一个活动 poller 可以使用某个机器人令牌。如果你仍然看到 `getUpdates` 409 冲突，可能是另一个 OpenClaw 网关、脚本或外部 poller 正在使用同一个令牌。
- 默认情况下，长轮询 watchdog 会在 120 秒内没有完成的 `getUpdates` 活性信号后触发重启。只有当你的部署在长时间运行任务期间仍然出现误判的轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果升级后你的配置中仍有这些键，请运行 `openclaw doctor --fix`。私信话题路由现在遵循 Telegram `getMe.has_topics_enabled` 返回的机器人能力，该能力由 BotFather 的线程模式控制：启用话题的机器人会在 Telegram 发送 `message_thread_id` 时使用线程作用域的私信会话；其他私信会保持在扁平会话上。
</Note>

## 功能参考

<AccordionGroup>
  <Accordion title="实时流预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 直接聊天：预览消息 + `editMessageText`
    - 群组/话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - 短初始答案预览会进行防抖；如果运行仍处于活动状态，则会在有界延迟后实体化
    - `progress` 会为工具进度保留一条可编辑的状态草稿，在答案活动早于工具进度到达时显示稳定状态标签，在完成时清除它，并将最终答案作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（预览流式传输处于活动状态时默认：`true`）
    - `streaming.preview.commandText` 控制这些工具进度行中的命令/exec 详情：`raw`（默认，保留已发布行为）或 `status`（仅工具标签）
    - `streaming.progress.commentary`（默认：`false`）选择加入临时进度草稿中的助手 commentary/preamble 文本
    - 会检测旧版 `channels.telegram.streamMode`、布尔型 `streaming` 值以及已废弃的原生草稿预览键；运行 `openclaw doctor --fix` 将它们迁移到当前流式传输配置

    工具进度预览更新是在工具运行时显示的短状态行，例如命令执行、文件读取、计划更新、补丁摘要，或 Codex app-server 模式中的 Codex preamble/commentary 文本。Telegram 默认保持这些内容启用，以匹配 `v2026.4.22` 及更高版本发布的 OpenClaw 行为。

    若要保留答案文本的已编辑预览，但隐藏工具进度行，请设置：

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

    当你希望显示工具进度，但不将最终答案编辑进同一条消息时，请使用 `progress` 模式。将命令文本策略放在 `streaming.progress` 下：

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

    仅当你希望只交付最终消息时，才使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，通用工具/进度杂讯会被抑制，而不是作为独立状态消息发送。审批提示、媒体 payload 和错误仍会通过正常最终交付路由。仅当你想保留答案预览编辑，同时隐藏工具进度状态行时，使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 选中引用回复是例外。当 `replyToMode` 为 `"first"`、`"all"` 或 `"batched"`，且入站消息包含选中引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法为该轮次显示短状态行。不含选中引用文本的当前消息回复仍会保留预览流式传输。当工具进度可见性比原生引用回复更重要时，设置 `replyToMode: "off"`；或设置 `streaming.preview.toolProgress: false` 以明确接受该取舍。
    </Note>

    对于纯文本回复：

    - 短私信/群组/话题预览：OpenClaw 会保留同一条预览消息，并就地执行最终编辑
    - 拆分为多条 Telegram 消息的长文本最终回复会尽可能复用现有预览作为第一个最终分块，然后只发送剩余分块
    - 进度模式的最终回复会清除状态草稿，并使用正常最终交付，而不是把草稿编辑成答案
    - 如果最终编辑在确认完成文本之前失败，OpenClaw 会使用正常最终交付，并清理过期预览

    对于复杂回复（例如媒体 payload），OpenClaw 会回退到正常最终交付，然后清理预览消息。

    预览流式传输独立于分块流式传输。当为 Telegram 显式启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    推理流行为：

    - `/reasoning stream` 使用受支持渠道的推理预览路径；在 Telegram 上，它会在生成期间将推理流式传输到实时预览中
    - 推理预览会在最终交付后删除；当推理应保持可见时，请使用 `/reasoning on`
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="富消息格式">
    出站文本默认使用标准 Telegram HTML 消息，因此回复在当前 Telegram 客户端中保持可读。此兼容模式支持普通加粗、斜体、链接、代码、spoiler 和引用，但不支持 Bot API 10.1 的仅富消息块，例如原生表格、details、富媒体和公式。

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

    - 会告知智能体此机器人/账号可使用 Telegram 富消息。
    - Markdown 文本会通过 OpenClaw 的 Markdown IR 渲染，并作为 Telegram 富 HTML 发送。
    - 显式富 HTML payload 会保留受支持的 Bot API 10.1 标签，例如标题、表格、details、富媒体和公式。
    - 媒体标题仍使用 Telegram HTML 标题，因为富消息不会替换标题。

    这会让模型文本避开 Telegram Rich Markdown 标记，因此像 `$400-600K` 这样的货币不会被解析为数学公式。长富文本会自动按 Telegram 的富文本和富块限制拆分。超过 Telegram 列数限制的表格会作为代码块发送。

    默认：关闭，以兼容客户端。富消息需要兼容的 Telegram 客户端；一些当前的 Desktop、Web、Android 和第三方客户端会将已接受的富消息显示为不受支持。除非与机器人配合使用的每个客户端都能渲染它们，否则请保持此选项禁用。`/status` 会显示当前 Telegram 会话的富消息是开启还是关闭。

    链接预览默认启用。`channels.telegram.linkPreview: false` 会跳过富文本的自动实体检测。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册在启动时通过 `setMyCommands` 处理。

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

    - 名称会规范化（去掉开头的 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    说明：

    - 自定义命令只是菜单项；它们不会自动实现行为
    - 即使未显示在 Telegram 菜单中，插件/技能命令在输入时仍可以工作

    如果禁用原生命令，内置命令会被移除。配置后，自定义/插件命令仍可注册。

    常见设置失败：

    - `setMyCommands failed` 伴随 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 菜单在裁剪后仍然溢出；减少插件/技能/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并显示 `404: Not Found` 时，可能表示 `channels.telegram.apiRoot` 被设置为了完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须仅为 Bot API 根，并且 `openclaw doctor --fix` 会移除意外尾随的 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了配置的机器人令牌。使用当前 BotFather 令牌更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 伴随网络/fetch 错误通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最新请求

    设置代码携带一个短期 bootstrap 令牌。内置设置代码 bootstrap 仅限节点：第一次连接会创建一个待处理节点请求，批准后 Gateway 网关会返回一个持久节点令牌，并带有 `scopes: []`。它不会返回移交的操作员令牌；操作员访问需要单独批准的操作员配对或令牌流。

    如果设备使用变更后的 auth 详情重试（例如角色/作用域/公钥），之前的待处理请求会被取代，新请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

    更多详情：[配对](/zh-CN/channels/pairing#pair-via-telegram-recommended-for-ios)。

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

    范围：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（默认）

    旧版 `capabilities: ["inlineButtons"]` 会映射为 `inlineButtons: "all"`。

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

    未被已注册插件交互处理器声明处理的回调点击会作为文本传递给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Telegram 面向智能体和自动化的消息操作">
    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`、可选的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、可选的 `presentation` 内联按钮；仅按钮编辑会更新回复标记）
    - `createForumTopic`（`chatId`、`name`、可选的 `iconColor`、`iconCustomEmojiId`）

    渠道消息操作暴露了符合人体工学的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制项：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 当前默认启用，并且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用当前有效的配置/密钥快照（启动/重载），因此操作路径不会在每次发送时临时重新解析 SecretRef。

    表情回应移除语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    启用回复线程后，如果原始 Telegram 文本或标题可用，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元，因此更长的消息会从开头开始引用；如果 Telegram 拒绝该引用，则回退为普通回复。

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会生效。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：

    - 话题会话键会追加 `:topic:<threadId>`
    - 回复和正在输入目标指向该话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规话题（`threadId=1`）特殊情况：

    - 消息发送会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 正在输入操作仍包含 `message_thread_id`

    话题继承：除非被覆盖，否则话题条目会继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅属于话题，不会从群组默认值继承。
    `topics."*"` 会为该群组中的每个话题设置默认值；精确话题 ID 仍优先于 `"*"`。

    **按话题的智能体路由**：每个话题都可以通过在话题配置中设置 `agentId` 路由到不同的智能体。这会让每个话题拥有各自隔离的工作区、记忆和会话。示例：

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

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化 ACP 绑定（`bindings[]`，其中 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的带话题限定 ID）固定 ACP harness 会话。当前范围限定为群组/超级群组中的论坛话题。请参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天生成绑定线程的 ACP 会话**：`/acp spawn <agent> --thread here|auto` 会将当前话题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会在话题内固定生成确认。需要保持启用 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文暴露 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留回复元数据；只有当 Telegram `getMe` 报告该机器人 `has_topics_enabled: true` 时，它们才会使用线程感知的会话键。
    先前的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆盖项已被有意弃用；请将 BotFather 线程模式作为唯一真实来源，并运行 `openclaw doctor --fix` 移除过时的配置键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音备注和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 可强制以语音备注发送
    - 入站语音备注转写会在智能体上下文中被框定为机器生成的、不受信任的文本；提及检测仍使用原始转写，因此受提及门控的语音消息会继续工作。

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

    Telegram 会区分视频文件和视频笔记。

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

    视频笔记不支持说明文字；提供的消息文本会单独发送。

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
    Telegram 反应会以 `message_reaction` 更新形式到达（与消息载荷分离）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    注意事项：

    - `own` 表示仅用户对机器人发送消息的反应（通过已发送消息缓存尽力判断）。
    - 反应事件仍遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在反应更新中提供线程 ID。
      - 非论坛群组会路由到群组聊天会话
      - 论坛群组会路由到群组通用主题会话（`:topic:1`），而不是精确的原始主题

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reactions">
    OpenClaw 处理入站消息时，`ackReaction` 会发送一个确认表情符号。`ackReactionScope` 决定该表情符号实际发送的*时机*。

    **表情符号（`ackReaction`）解析顺序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退（`agents.list[].identity.emoji`，否则为 "👀"）

    注意事项：

    - Telegram 需要 unicode 表情符号（例如 "👀"）。
    - 使用 `""` 可为某个渠道或账号禁用反应。

    **范围（`messages.ackReactionScope`）：**

    Telegram provider 会从 `messages.ackReactionScope` 读取范围（默认 `"group-mentions"`）。目前没有 Telegram 账号级或 Telegram 渠道级覆盖。

    值：`"all"`（私信 + 群组）、`"direct"`（仅私信）、`"group-all"`（每条群组消息，不含私信）、`"group-mentions"`（机器人被提及时的群组；**不含私信**，这是默认值）、`"off"` / `"none"`（禁用）。

    <Note>
    默认范围（`"group-mentions"`）不会在直接消息中触发确认反应。要在入站 Telegram 私信上获得确认反应，请将 `messages.ackReactionScope` 设置为 `"direct"` 或 `"all"`。该值在 Telegram provider 启动时读取，因此需要重启 Gateway 网关才能使更改生效。
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
    默认使用长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选项包括 `webhookPath`、`webhookHost`、`webhookPort`（默认值为 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在长轮询模式下，OpenClaw 只有在更新成功分发后才会持久化其重启水位标记。如果处理程序失败，该更新在同一进程中仍可重试，并且不会被写入为已完成以用于重启去重。

    本地监听器绑定到 `127.0.0.1:8787`。对于公共入口，请在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会先验证请求防护、Telegram secret token 和 JSON 正文，然后再向 Telegram 返回 `200`。
    随后，OpenClaw 会通过与长轮询相同的按聊天/按主题机器人通道异步处理该更新，因此缓慢的智能体轮次不会阻塞 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会优先按段落边界（空行）拆分，再按长度拆分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500）控制 Telegram 相册/媒体组在 OpenClaw 将其作为一条入站消息分发前缓冲多久。如果相册分片到达较晚，可以增大它；如果要降低相册回复延迟，可以减小它。
    - `channels.telegram.timeoutSeconds` 覆盖 Telegram API 客户端超时（未设置时使用 grammY 默认值）。Bot 客户端会将配置值限制在 60 秒出站文本/输入状态请求保护以下，避免 grammY 在 OpenClaw 的传输保护和回退运行前中止可见回复投递。长轮询仍使用 45 秒 `getUpdates` 请求保护，避免空闲轮询被无限期放弃。
    - `channels.telegram.pollingStallThresholdMs` 默认值为 `120000`；仅在轮询停滞重启出现误报时，在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 当 Gateway 网关已观测到父消息时，回复/引用/转发的补充上下文会被规范化到一个选中的会话上下文窗口中；已观测消息缓存存储在 OpenClaw SQLite 插件状态中，`openclaw doctor --fix` 会导入旧版 sidecar。Telegram 在更新中只包含一个浅层 `reply_to_message`，因此早于缓存的链路会受限于 Telegram 当前更新载荷。
    - Telegram 允许列表主要用于限制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助逻辑（CLI/工具/操作）中的可恢复出站 API 错误。入站最终回复投递也会针对 Telegram 预连接失败使用有界的安全发送重试，但不会重试可能重复可见消息的发送后模糊网络信封。

    CLI 和消息工具发送目标可以是数字聊天 ID、用户名或论坛话题目标：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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

    - `--presentation` 搭配 `buttons` 块，用于在 `channels.telegram.capabilities.inlineButtons` 允许时显示内联键盘
    - `--pin` 或 `--delivery '{"pin":true}'`，用于在 Bot 可在该聊天中置顶时请求置顶投递
    - `--force-document`，用于将出站图片、GIF 和视频作为文档发送，而不是压缩照片、动画媒体或视频上传

    操作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保留常规发送能力

  </Accordion>

  <Accordion title="Telegram 中的 Exec 审批">
    Telegram 支持在审批者私信中进行 Exec 审批，也可以选择在发起聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（至少一个审批者可解析时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字 owner ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与 Bot 对话，以及它将普通回复发送到哪里。它们不会让某人成为 Exec 审批者。当尚未存在命令 owner 时，首次获批的私信配对会引导生成 `commands.ownerAllowFrom`，因此单 owner 设置仍然可以工作，而无需在 `execApprovals.approvers` 下重复 ID。

    渠道投递会在聊天中显示命令文本；仅在受信任的群组/话题中启用 `channel` 或 `both`。当提示进入论坛话题时，OpenClaw 会为审批提示和后续消息保留该话题。Exec 审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。带有 `plugin:` 前缀的审批 ID 通过插件审批解析；其他 ID 会先通过 Exec 审批解析。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，错误策略会控制是否向 Telegram 聊天发送错误消息：

| 键                                  | 值                         | 默认值          | 描述                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 将每条错误消息发送到聊天。`once` — 在每个冷却窗口内，每条唯一错误消息只发送一次（抑制重复的相同错误）。`silent` — 从不向聊天发送错误消息。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 策略的冷却窗口。错误发送后，相同错误消息会被抑制，直到该间隔结束。可防止故障期间错误刷屏。                                      |

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

## 故障排除

<AccordionGroup>
  <Accordion title="Bot 不响应非提及的群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather: `/setprivacy` -> Disable
      - 然后将 Bot 从群组移除并重新添加
    - 当配置预期接收未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法进行成员关系探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群组消息">

    - 当 `channels.telegram.groups` 存在时，群组必须列出（或包含 `"*"`）
    - 验证 Bot 在群组中的成员身份
    - 查看日志：`openclaw logs --follow` 以了解跳过原因

  </Accordion>

  <Accordion title="命令部分可用或完全不可用">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 搭配 `BOT_COMMANDS_TOO_MUCH` 表示原生命令菜单条目过多；减少插件/skill/自定义命令，或禁用原生命令菜单
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 输入状态调用是有界的，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/fetch 错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性问题

  </Accordion>

  <Accordion title="启动报告未授权 token">

    - `getMe returned 401` 是配置的 Bot token 发生 Telegram 身份验证失败。
    - 在 BotFather 中重新复制或重新生成 Bot token，然后更新默认账号的 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是身份验证失败；将其视为“没有 webhook 存在”只会把同一个错误 token 失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ 搭配自定义 fetch/proxy 时，如果 AbortSignal 类型不匹配，可能触发立即中止行为。
    - 某些主机会优先将 `api.telegram.org` 解析到 IPv6；损坏的 IPv6 出站可能导致间歇性 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些作为可恢复网络错误重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用成功的启动 `getMe` 探测，因此 runner 在第一次 `getUpdates` 之前不需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬时网络错误失败，OpenClaw 会继续进入长轮询，而不是再发起一次轮询前控制面调用。仍处于活动状态的 webhook 会表现为 `getUpdates` 冲突；随后 OpenClaw 会重建 Telegram 传输并重试 webhook 清理。
    - 如果 Telegram socket 以较短的固定节奏回收，请检查 `channels.telegram.timeoutSeconds` 是否过低；Bot 客户端会将配置值限制在出站和 `getUpdates` 请求保护以下，但旧版本在该值低于这些保护时可能中止每次轮询或回复。
    - 如果日志包含 `Polling stall detected`，OpenClaw 默认会在 120 秒内没有完成的长轮询存活信号后重启轮询并重建 Telegram 传输。
    - 当运行中的轮询账号在启动宽限期后仍未完成 `getUpdates`、运行中的 webhook 账号在启动宽限期后仍未完成 `setWebhook`，或最近一次成功的轮询传输活动已过期时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用健康，但你的主机仍报告误报轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的代理、DNS、IPv6 或 TLS 出站问题。
    - Telegram 也会遵循 Bot API 传输的进程代理环境变量，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果通过 `OPENCLAW_PROXY_URL` 为服务环境配置了 OpenClaw 托管代理，且不存在标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
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

    - RFC 2544 基准测试范围的应答（`198.18.0.0/15`）默认已允许
      用于 Telegram 媒体下载。如果受信任的 fake-IP 或
      透明代理在媒体下载期间将 `api.telegram.org` 重写为其他
      私有/内部/特殊用途地址，你可以选择启用
      仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选择启用项也可按账号设置在
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持
      关闭危险标志。Telegram 媒体默认已允许 RFC 2544
      基准测试范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅在受信任且由操作员控制的代理
      环境中使用，例如 Clash、Mihomo 或 Surge fake-IP 路由，并且它们会
      合成 RFC 2544 基准测试
      范围之外的私有或特殊用途应答。正常公共互联网 Telegram 访问请保持关闭。
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

更多帮助：[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[配置参考 - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="高信号 Telegram 字段">

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向常规文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 话题默认值：`groups.<chatId>.topics."*"` 适用于未匹配的论坛话题；精确话题 ID 会覆盖它
- Exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/送达：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根地址：`apiRoot`（仅 Bot API 根地址；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 动作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账号优先级：配置两个或更多账号 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确默认路由。否则 OpenClaw 会回退到第一个规范化账号 ID，并由 `openclaw doctor` 发出警告。命名账号会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群组和话题允许列表行为。
  </Card>
  <Card title="频道路由" icon="route" href="/zh-CN/channels/channel-routing">
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

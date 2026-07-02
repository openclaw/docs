---
read_when:
    - 处理 Telegram 功能或 Webhook
summary: Telegram 机器人支持状态、能力和配置
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:29:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

通过 grammY 支持可用于生产环境的机器人私信和群组。长轮询是默认模式；webhook 模式是可选的。

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
    打开 Telegram 并与 **@BotFather** 聊天（确认账号名正好是 `@BotFather`）。

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

    首次设置时，可从 `openclaw logs --follow`、转发 ID 机器人或 Bot API `getUpdates` 获取群组聊天 ID。允许该群组后，`/whoami@<bot_username>` 可以确认用户和群组 ID。

    以 `-100` 开头的负数 Telegram 超级群组 ID 是群组聊天 ID。请将它们放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom` 下。

  </Step>
</Steps>

<Note>
令牌解析顺序是感知账号的。实际使用中，配置值优先于环境变量回退，且 `TELEGRAM_BOT_TOKEN` 仅适用于默认账号。
成功启动后，OpenClaw 会在状态目录中缓存机器人身份，最长 24 小时，这样重启时可避免额外的 Telegram `getMe` 调用；更改或移除令牌会清除该缓存。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认使用**隐私模式**，这会限制它们接收的群组消息。

    如果机器人必须看到所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式时，请在每个群组中移除并重新添加机器人，以便 Telegram 应用变更。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。

    管理员机器人会接收所有群组消息，这对于常驻群组行为很有用。

  </Accordion>

  <Accordion title="有用的 BotFather 开关">

    - `/setjoingroups` 用于允许/拒绝添加到群组
    - `/setprivacy` 用于群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

### 群组机器人身份

在 Telegram 群组和论坛话题中，显式提及已配置的机器人账号名（例如 `@my_bot`）会被视为在寻址所选 OpenClaw 智能体，即使智能体 persona 名称不同于 Telegram 用户名。群组静默策略仍适用于无关的群组流量，但机器人账号名本身不被视为“其他人”。

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制直接消息访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 搭配 `allowFrom: ["*"]` 会让任何找到或猜到机器人用户名的 Telegram 账号都能命令该机器人。仅将它用于有意公开、且工具受到严格限制的机器人；单一所有者机器人应使用带数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀会被接受并规范化。
    在多账号配置中，限制性的顶层 `channels.telegram.allowFrom` 会被视为安全边界：账号级 `allowFrom: ["*"]` 条目不会让该账号公开，除非合并后的有效账号允许列表仍包含显式通配符。
    `dmPolicy: "allowlist"` 搭配空 `allowFrom` 会阻止所有私信，并会被配置验证拒绝。
    设置流程只要求数字用户 ID。
    如果你已升级且配置包含 `@username` 允许列表条目，请运行 `openclaw doctor --fix` 来解析它们（尽力而为；需要 Telegram 机器人令牌）。
    如果你之前依赖配对存储允许列表文件，`openclaw doctor --fix` 可以在允许列表流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 尚无显式 ID 时）。

    对于单一所有者机器人，建议使用带显式数字 `allowFrom` ID 的 `dmPolicy: "allowlist"`，以便将访问策略持久保存在配置中（而不是依赖之前的配对批准）。

    常见困惑：私信配对批准并不意味着“此发送者在所有地方都已授权”。
    配对授予私信访问权。如果还没有命令所有者，第一次获批的配对也会设置 `commands.ownerAllowFrom`，从而让仅所有者命令和 exec 审批拥有明确的操作员账号。
    群组发送者授权仍来自显式配置允许列表。
    如果你想要“我授权一次后，私信和群组命令都能工作”，请将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`；对于仅所有者命令，请确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 查找你的 Telegram 用户 ID

    更安全（无第三方机器人）：

    1. 给你的机器人发送私信。
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
       - 无 `groups` 配置：
         - 使用 `groupPolicy: "open"`：任何群组都可以通过群组 ID 检查
         - 使用 `groupPolicy: "allowlist"`（默认）：群组会被阻止，直到你添加 `groups` 条目（或 `"*"`）
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
    配对保持仅适用于私信。对于群组，请设置 `groupAllowFrom` 或按群组/按话题设置 `allowFrom`。
    如果 `groupAllowFrom` 未设置，Telegram 会回退到配置 `allowFrom`，而不是配对存储。
    单一所有者机器人的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，保持 `groupAllowFrom` 未设置，并在 `channels.telegram.groups` 下允许目标群组。
    运行时说明：如果完全缺少 `channels.telegram`，运行时默认使用故障关闭的 `groupPolicy="allowlist"`，除非显式设置了 `channels.defaults.groupPolicy`。

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

    在群组中用 `@<bot_username> ping` 测试它。当 `requireMention: true` 时，普通群组消息不会触发机器人。

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

    示例：仅允许一个特定群组中的特定用户：

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
      - 当你想限制允许群组内哪些人可以触发机器人时，将像 `8734062810` 这样的 Telegram 用户 ID 放在 `groupAllowFrom` 下。
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

    这些只会更新会话状态。使用配置实现持久化。

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

    群组历史上下文始终对群组启用，并受
    `historyLimit` 限制。设置 `channels.telegram.historyLimit: 0` 可禁用
    Telegram 群组历史窗口。已退役的 `includeGroupHistoryContext`
    键会由 `openclaw doctor --fix` 移除。

    获取群组聊天 ID：

    - 将群组消息转发给 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 读取 `chat.id`
    - 或检查 Bot API `getUpdates`
    - 允许该群组后，如果已启用原生命令，运行 `/whoami@<bot_username>`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 Gateway 网关进程拥有。
- 路由是确定性的：Telegram 入站消息会回复回 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道信封，包含回复元数据、媒体占位符，以及 Gateway 网关已观察到的 Telegram 回复的持久化回复链上下文。
- 群组会话按群组 ID 隔离。论坛话题会追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会保留它用于回复。只有当 Telegram `getMe` 为 bot 报告 `has_topics_enabled: true` 时，私信话题会话才会拆分；否则私信会保持在扁平会话上。
- 长轮询使用 grammY runner，并按聊天/线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- 多账号启动会限制并发 Telegram `getMe` 探测，避免大型 bot 集群一次性扇出所有账号探测。
- 长轮询在每个 Gateway 网关进程内部都有保护，因此同一时间只有一个活跃 poller 可以使用一个 bot token。如果你仍然看到 `getUpdates` 409 冲突，可能是另一个 OpenClaw Gateway 网关、脚本或外部 poller 正在使用同一个 token。
- 默认情况下，长轮询 watchdog 会在 120 秒内没有完成的 `getUpdates` 活性信号后触发重启。只有当你的部署在长时间运行的工作期间仍然看到误判的轮询停滞重启时，才应增大 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持按账号覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果升级后你的配置中仍有这些键，请运行 `openclaw doctor --fix`。私信话题路由现在遵循 Telegram `getMe.has_topics_enabled` 返回的 bot 能力，该能力由 BotFather threaded mode 控制：启用话题的 bot 会在 Telegram 发送 `message_thread_id` 时使用线程级私信会话；其他私信会保持在扁平会话上。
</Note>

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 直接聊天：预览消息 + `editMessageText`
    - 群组/话题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - 简短的初始答案预览会被防抖处理；如果运行仍处于活跃状态，则会在有界延迟后实体化
    - `progress` 会为工具进度保留一个可编辑的状态草稿；当答案活动早于工具进度到达时显示稳定状态标签；完成时清除它，并将最终答案作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条已编辑的预览消息（默认：预览流式传输活跃时为 `true`）
    - `streaming.preview.commandText` 控制这些工具进度行中的命令/exec 详情：`raw`（默认，保留已发布行为）或 `status`（仅工具标签）
    - `streaming.progress.commentary`（默认：`false`）选择在临时进度草稿中包含助手 commentary/preamble 文本
    - 会检测旧版 `channels.telegram.streamMode`、布尔 `streaming` 值和已退役的原生草稿预览键；运行 `openclaw doctor --fix` 将它们迁移到当前流式传输配置

    工具进度预览更新是在工具运行时显示的简短状态行，例如命令执行、文件读取、计划更新、补丁摘要，或 Codex app-server 模式中的 Codex preamble/commentary 文本。Telegram 默认保持启用这些内容，以匹配 `v2026.4.22` 及之后版本发布的 OpenClaw 行为。

    要保留答案文本的已编辑预览，但隐藏工具进度行，请设置：

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

    要保持工具进度可见，但隐藏命令/exec 文本，请设置：

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

    当你希望显示工具进度，但不把最终答案编辑进同一条消息时，请使用 `progress` 模式。将命令文本策略放在 `streaming.progress` 下：

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

    只有当你想要仅最终交付时，才使用 `streaming.mode: "off"`：Telegram 预览编辑会被禁用，通用工具/进度闲聊会被抑制，而不是作为独立状态消息发送。审批提示、媒体载荷和错误仍会通过正常最终交付路由。若你只想保留答案预览编辑，同时隐藏工具进度状态行，请使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 选中文本引用回复是例外。当 `replyToMode` 为 `"first"`、`"all"` 或 `"batched"`，且入站消息包含选中的引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法为该轮次显示简短状态行。没有选中文本引用的当前消息回复仍会保留预览流式传输。当工具进度可见性比原生引用回复更重要时，请设置 `replyToMode: "off"`；或设置 `streaming.preview.toolProgress: false` 以确认这一取舍。
    </Note>

    对于纯文本回复：

    - 简短的私信/群组/话题预览：OpenClaw 会保留同一条预览消息，并在原处执行最终编辑
    - 会拆分为多条 Telegram 消息的长文本最终回复，会尽可能复用现有预览作为第一个最终分块，然后只发送剩余分块
    - progress 模式的最终回复会清除状态草稿，并使用正常最终交付，而不是把草稿编辑成答案
    - 如果最终编辑在完成文本被确认前失败，OpenClaw 会使用正常最终交付，并清理过期预览

    对于复杂回复（例如媒体载荷），OpenClaw 会回退到正常最终交付，然后清理预览消息。

    预览流式传输与分块流式传输相互独立。当 Telegram 明确启用分块流式传输时，OpenClaw 会跳过预览流，以避免双重流式传输。

    推理流行为：

    - `/reasoning stream` 使用受支持渠道的推理预览路径；在 Telegram 上，它会在生成期间将推理流式传输到实时预览中
    - 推理预览会在最终交付后删除；当推理应保持可见时，请使用 `/reasoning on`
    - 最终答案发送时不包含推理文本

  </Accordion>

  <Accordion title="富消息格式">
    默认情况下，出站文本使用标准 Telegram HTML 消息，因此回复在当前 Telegram 客户端中仍保持可读。此兼容模式支持普通粗体、斜体、链接、代码、spoiler 和引用，但不支持 Bot API 10.1 的仅富内容块，例如原生表格、details、富媒体和公式。

    设置 `channels.telegram.richMessages: true` 以选择启用 Bot API 10.1 富消息：

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

    - 智能体会被告知此 bot/账号可使用 Telegram 富消息。
    - Markdown 文本会通过 OpenClaw 的 Markdown IR 渲染，并作为 Telegram 富 HTML 发送。
    - 显式富 HTML 载荷会保留受支持的 Bot API 10.1 标签，例如 headings、tables、details、rich media 和 formulas。
    - 媒体说明文字仍使用 Telegram HTML 说明文字，因为富消息不会替代说明文字。

    这会让模型文本避开 Telegram Rich Markdown 标记，因此像 `$400-600K` 这样的金额不会被解析为数学公式。长富文本会自动按 Telegram 的富文本和富块限制拆分。超过 Telegram 列数限制的表格会作为代码块发送。

    默认：关闭，以保证客户端兼容性。富消息需要兼容的 Telegram 客户端；一些当前的 Desktop、Web、Android 和第三方客户端会将已接受的富消息显示为不支持。除非与该 bot 一起使用的每个客户端都能渲染它们，否则请保持此选项禁用。`/status` 会显示当前 Telegram 会话的富消息是开启还是关闭。

    链接预览默认启用。`channels.telegram.linkPreview: false` 会跳过富文本的自动实体检测。

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

    - 名称会被规范化（去掉前导 `/`，转为小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复项会被跳过并记录日志

    说明：

    - 自定义命令只是菜单项；它们不会自动实现行为
    - 即使未显示在 Telegram 菜单中，插件/skill 命令在输入时仍然可以工作

    如果原生命令被禁用，内置命令会被移除。自定义/插件命令在已配置时仍可能注册。

    常见设置失败：

    - `setMyCommands failed` 加上 `BOT_COMMANDS_TOO_MUCH` 表示 Telegram 菜单在裁剪后仍然溢出；请减少插件/skill/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接 Bot API curl 命令可用，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 失败并返回 `404: Not Found` 时，可能表示 `channels.telegram.apiRoot` 被设置成完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API root，且 `openclaw doctor --fix` 会移除误加的尾随 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了配置的 bot token。请用当前 BotFather token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 会在轮询前停止，因此这不会被报告为 webhook 清理失败。
    - `setMyCommands failed` 加上网络/fetch 错误通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置代码
    2. 在 iOS app 中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/作用域）
    4. 批准请求：
       - `/pair approve <requestId>` 用于显式批准
       - 只有一个待处理请求时使用 `/pair approve`
       - `/pair approve latest` 用于最近的请求

    设置代码携带一个短期 bootstrap token。内置设置代码 bootstrap 仅限 node：首次连接会创建一个待处理 node 请求，批准后 Gateway 网关会返回一个持久 node token，带有 `scopes: []`。它不会返回移交的 operator token；operator 访问需要单独批准的 operator 配对或 token 流程。

    如果设备用已更改的凭证详情重试（例如角色/作用域/公钥），之前的待处理请求会被取代，新的请求会使用不同的 `requestId`。批准前请重新运行 `/pair pending`。

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

    Telegram `web_app` 按钮只在用户与 bot 之间的私聊中可用。

    未被已注册插件交互式处理程序声明处理的回调点击会作为文本传给智能体：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="用于智能体和自动化的 Telegram 消息操作">
    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、可选 `presentation` 内联按钮；仅按钮编辑会更新回复标记）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    频道消息操作公开符合人体工学的别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制项：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 目前默认启用，且没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送会使用活跃的配置/密钥快照（启动/重新加载），因此操作路径不会在每次发送时临时重新解析 SecretRef。

    移除回应的语义：[/tools/reactions](/zh-CN/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定的 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    启用回复线程且原始 Telegram 文本或标题可用时，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 码元，因此更长的消息会从开头开始引用；如果 Telegram 拒绝该引用，则回退为普通回复。

    注意：`off` 会禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍会生效。

  </Accordion>

  <Accordion title="论坛主题和线程行为">
    论坛超级群组：

    - 主题会话键追加 `:topic:<threadId>`
    - 回复和输入状态会定向到该主题线程
    - 主题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    常规主题（`threadId=1`）的特殊情况：

    - 消息发送会省略 `message_thread_id`（Telegram 会拒绝 `sendMessage(...thread_id=1)`）
    - 输入状态操作仍会包含 `message_thread_id`

    主题继承：主题条目会继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅属于主题，不会从群组默认值继承。
    `topics."*"` 会为该群组中的每个主题设置默认值；精确主题 ID 仍优先于 `"*"`。

    **按主题智能体路由**：每个主题都可以通过在主题配置中设置 `agentId` 路由到不同智能体。这会让每个主题拥有自己的隔离工作区、记忆和会话。示例：

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

    这样每个主题都有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久 ACP 主题绑定**：论坛主题可以通过顶层类型化 ACP 绑定固定 ACP harness 会话（`bindings[]`，其中 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"`，以及类似 `-1001234567890:topic:42` 的带主题限定 ID）。目前范围限定为群组/超级群组中的论坛主题。参见 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天中生成线程绑定 ACP**：`/acp spawn <agent> --thread here|auto` 会将当前主题绑定到新的 ACP 会话；后续消息会直接路由到那里。OpenClaw 会将生成确认固定在主题内。要求 `channels.telegram.threadBindings.spawnSessions` 保持启用（默认：`true`）。

    模板上下文公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留回复元数据；只有当 Telegram `getMe` 报告该 bot 的 `has_topics_enabled: true` 时，它们才会使用感知线程的会话键。
    以前的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆盖项已被有意废弃；请将 BotFather 线程模式作为唯一真实来源，并运行 `openclaw doctor --fix` 移除过时的配置键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音消息和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用标签 `[[audio_as_voice]]` 强制作为语音消息发送
    - 入站语音消息转录会在智能体上下文中被框定为机器生成的、不可信文本；提及检测仍使用原始转录，因此受提及门控的语音消息会继续工作。

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

    Telegram 区分视频文件和视频便签。

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

    视频便签不支持说明文字；提供的消息文本会单独发送。

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

  <Accordion title="反应通知">
    Telegram 反应会作为 `message_reaction` 更新到达（独立于消息载荷）。

    启用后，OpenClaw 会将如下系统事件加入队列：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认值：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认值：`minimal`）

    说明：

    - `own` 表示仅用户对 bot 发送消息的反应（通过已发送消息缓存尽力判断）。
    - 反应事件仍会遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权发送者会被丢弃。
    - Telegram 不会在反应更新中提供线程 ID。
      - 非论坛群组会路由到群组聊天会话
      - 论坛群组会路由到群组通用话题会话（`:topic:1`），而不是确切的原始话题

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack 反应">
    `ackReaction` 会在 OpenClaw 处理入站消息时发送一个确认 emoji。`ackReactionScope` 决定该 emoji 实际在*何时*发送。

    **Emoji（`ackReaction`）解析顺序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份 emoji 兜底（`agents.list[].identity.emoji`，否则为 "👀"）

    说明：

    - Telegram 需要 unicode emoji（例如 "👀"）。
    - 使用 `""` 可禁用某个渠道或账号的反应。

    **范围（`messages.ackReactionScope`）：**

    Telegram provider 会从 `messages.ackReactionScope` 读取范围（默认值 `"group-mentions"`）。目前没有 Telegram 账号级或 Telegram 渠道级覆盖项。

    取值：`"all"`（私信 + 群组）、`"direct"`（仅私信）、`"group-all"`（每条群组消息，不含私信）、`"group-mentions"`（在群组中 bot 被提及时；**不含私信**——这是默认值）、`"off"` / `"none"`（禁用）。

    <Note>
    默认范围（`"group-mentions"`）不会在直接消息中触发 ack 反应。若要在入站 Telegram 私信中获得 ack 反应，请将 `messages.ackReactionScope` 设置为 `"direct"` 或 `"all"`。该值会在 Telegram provider 启动时读取，因此需要重启 Gateway 网关才能让更改生效。
    </Note>

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

    在长轮询模式下，OpenClaw 仅在更新成功分发后才会持久化其重启水位线。如果处理程序失败，该更新在同一进程中仍可重试，并且不会被写为已完成以用于重启去重。

    本地监听器绑定到 `127.0.0.1:8787`。对于公共入口，请在本地端口前放置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会先验证请求保护、Telegram secret token 和 JSON 正文，然后才向 Telegram 返回 `200`。
    随后 OpenClaw 会通过与长轮询相同的按聊天/按话题 bot lane 异步处理该更新，因此缓慢的智能体轮次不会占用 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认值为 4000。
    - `channels.telegram.chunkMode="newline"` 会优先按段落边界（空行）切分，再按长度切分。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500）控制 Telegram 相册/媒体组在 OpenClaw 将其作为一条入站消息分发前缓冲多久。如果相册部分到达较晚，可以增大它；如果要降低相册回复延迟，可以减小它。
    - `channels.telegram.timeoutSeconds` 会覆盖 Telegram API 客户端超时（未设置时使用 grammY 默认值）。Bot 客户端会将配置值限制在 60 秒出站文本/输入状态请求保护阈值以下，避免 grammY 在 OpenClaw 的传输保护和回退运行前中止可见回复投递。长轮询仍使用 45 秒 `getUpdates` 请求保护，避免空闲轮询被无限期放弃。
    - `channels.telegram.pollingStallThresholdMs` 默认为 `120000`；仅在轮询停滞重启出现误报时，在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 表示禁用。
    - 当 Gateway 网关已观察到父消息时，回复/引用/转发的补充上下文会被规范化到一个选定的会话上下文窗口中；已观察消息缓存位于 OpenClaw SQLite 插件状态中，`openclaw doctor --fix` 会导入旧版 sidecar。Telegram 在更新中只包含一层浅层 `reply_to_message`，因此早于缓存的链条会受限于 Telegram 当前的更新载荷。
    - Telegram 白名单主要控制谁可以触发智能体，而不是完整的补充上下文脱敏边界。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送辅助逻辑（CLI/工具/操作），用于可恢复的出站 API 错误。入站最终回复投递也会对 Telegram 预连接失败使用有界安全发送重试，但不会重试可能导致可见消息重复的模糊发送后网络信封。

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

    仅 Telegram 可用的投票标志：

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用于论坛话题（也可以使用 `:topic:` 目标）

    Telegram 发送还支持：

    - 当 `channels.telegram.capabilities.inlineButtons` 允许时，使用带有 `buttons` 块的 `--presentation` 生成内联键盘
    - 当 bot 可以在该聊天中置顶时，使用 `--pin` 或 `--delivery '{"pin":true}'` 请求置顶投递
    - 使用 `--force-document` 将出站图片、GIF 和视频作为文档发送，而不是压缩照片、动画媒体或视频上传

    操作门控：

    - `channels.telegram.actions.sendMessage=false` 会禁用出站 Telegram 消息，包括投票
    - `channels.telegram.actions.poll=false` 会禁用 Telegram 投票创建，同时保持常规发送启用

  </Accordion>

  <Accordion title="Telegram 中的 Exec 审批">
    Telegram 支持在审批者私信中进行 Exec 审批，也可以选择在发起聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    配置路径：

    - `channels.telegram.execApprovals.enabled`（至少有一个可解析审批者时自动启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字所有者 ID）
    - `channels.telegram.execApprovals.target`: `dm`（默认）| `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与 bot 对话，以及它向哪里发送普通回复。它们不会让某人成为 Exec 审批者。当还没有命令所有者时，第一次获批的私信配对会引导写入 `commands.ownerAllowFrom`，因此单所有者设置仍可运行，无需在 `execApprovals.approvers` 下重复 ID。

    频道投递会在聊天中显示命令文本；仅在可信群组/话题中启用 `channel` 或 `both`。当提示落在论坛话题中时，OpenClaw 会为审批提示和后续消息保留该话题。Exec 审批默认 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标表面（`dm`、`group` 或 `all`）。带 `plugin:` 前缀的审批 ID 会通过插件审批解析；其他 ID 会先通过 Exec 审批解析。

    参见 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递或提供商错误时，错误策略会控制是否将错误消息发送到 Telegram 聊天：

| 键                                  | 值                         | 默认值          | 说明                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — 将每条错误消息发送到聊天。`once` — 在每个冷却窗口内，每条唯一错误消息只发送一次（抑制重复的相同错误）。`silent` — 从不向聊天发送错误消息。 |
| `channels.telegram.errorCooldownMs` | number (ms)                | `14400000` (4h) | `once` 策略的冷却窗口。错误发送后，在此间隔过去之前会抑制相同错误消息。用于防止中断期间的错误刷屏。                                      |

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
  <Accordion title="Bot 不响应未提及它的群组消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后将 bot 从群组中移除并重新添加
    - 当配置预期接收未提及 bot 的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法进行成员探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群组消息">

    - 当存在 `channels.telegram.groups` 时，群组必须被列出（或包含 `"*"`）
    - 验证 bot 是群组成员
    - 查看日志：用 `openclaw logs --follow` 查看跳过原因

  </Accordion>

  <Accordion title="命令部分生效或完全不生效">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略是 `open`，命令授权仍然适用
    - 带有 `BOT_COMMANDS_TOO_MUCH` 的 `setMyCommands failed` 表示原生命令菜单条目过多；减少插件/技能/自定义命令，或禁用原生命令菜单
    - 启动时的 `deleteMyCommands` / `setMyCommands` 调用和 `sendChatAction` 输入状态调用都有边界限制，并会在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/获取错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性问题

  </Accordion>

  <Accordion title="启动报告未授权令牌">

    - `getMe returned 401` 是已配置 bot 令牌的 Telegram 认证失败。
    - 在 BotFather 中重新复制或重新生成 bot 令牌，然后为默认账号更新 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是认证失败；将它视为“没有 webhook 存在”只会把同一个错误令牌失败延后到之后的 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ 加自定义 fetch/proxy 时，如果 AbortSignal 类型不匹配，可能触发立即中止行为。
    - 一些主机会优先将 `api.telegram.org` 解析到 IPv6；损坏的 IPv6 出站可能导致间歇性 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在会将这些作为可恢复网络错误重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用成功的启动 `getMe` 探测，因此运行器不需要在第一次 `getUpdates` 前再执行第二次 `getMe`。
    - 如果在轮询启动期间 `deleteWebhook` 因瞬时网络错误失败，OpenClaw 会继续进入长轮询，而不是再发起一次轮询前控制平面调用。仍处于活动状态的 webhook 会表现为 `getUpdates` 冲突；随后 OpenClaw 会重建 Telegram 传输并重试 webhook 清理。
    - 如果 Telegram 套接字按较短固定周期回收，请检查是否设置了过低的 `channels.telegram.timeoutSeconds`；bot 客户端会将配置值限制在出站和 `getUpdates` 请求保护阈值以下，但较旧版本在该值低于这些保护阈值时可能会中止每次轮询或回复。
    - 如果日志包含 `Polling stall detected`，OpenClaw 会在默认 120 秒没有完成的长轮询存活信号后重启轮询并重建 Telegram 传输。
    - 当正在运行的轮询账号在启动宽限期后尚未完成 `getUpdates`、正在运行的 webhook 账号在启动宽限期后尚未完成 `setWebhook`，或最后一次成功轮询传输活动已过期时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用是健康的，但你的主机仍报告误报的轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的代理、DNS、IPv6 或 TLS 出站问题。
    - Telegram 的 Bot API 传输也遵循进程代理环境变量，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果在服务环境中通过 `OPENCLAW_PROXY_URL` 配置了 OpenClaw 托管代理，并且没有标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直接出站/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，然后是进程默认值，例如 `NODE_OPTIONS=--dns-result-order=ipv4first`；如果都不适用，Node 22+ 会回退到 `ipv4first`。
    - 如果你的主机是 WSL2，或明确在仅 IPv4 行为下运行更好，请强制指定地址族选择：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 默认已允许 Telegram 媒体下载使用 RFC 2544 基准范围答案（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写到其他私有/内部/特殊用途地址，你可以选择启用仅限 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同一选择性启用项也可按账号配置，路径为
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果你的代理将 Telegram 媒体主机解析为 `198.18.x.x`，请先保持
      危险标志关闭。Telegram 媒体默认已允许 RFC 2544
      基准范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram
      媒体 SSRF 防护。仅在受信任、由操作员控制的代理环境中使用它，例如 Clash、Mihomo 或 Surge fake-IP 路由，并且这些环境会合成 RFC 2544 基准
      范围之外的私有或特殊用途答案。正常公网 Telegram 访问请保持关闭。
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

主要参考：[Configuration reference - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="高信号 Telegram 字段">

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向普通文件；符号链接会被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 话题默认值：`groups.<chatId>.topics."*"` 应用于未匹配的论坛话题；精确话题 ID 会覆盖它
- Exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`richMessages`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根路径：`apiRoot`（仅 Bot API 根路径；不要包含 `/bot<TOKEN>`）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
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

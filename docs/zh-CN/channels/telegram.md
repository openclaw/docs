---
read_when:
    - 开发 Telegram 功能或 Webhooks
summary: Telegram Bot 支持状态、功能和配置
title: Telegram
x-i18n:
    generated_at: "2026-07-16T11:23:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

通过 grammY 为机器人私信和群组提供可用于生产环境的支持。默认传输方式为长轮询；也可选择 webhook 模式。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    Telegram 的默认私信策略是配对。
  </Card>
  <Card title="渠道故障排除" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断和修复操作手册。
  </Card>
  <Card title="Gateway 配置" icon="settings" href="/zh-CN/gateway/configuration">
    完整的渠道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建机器人令牌">
    两种流程最终都会获得一个需要粘贴到 OpenClaw 中的令牌——任选其一：

    - **聊天流程**：打开 Telegram，与 **@BotFather** 聊天（确认用户名恰好是 `@BotFather`），运行 `/newbot`，按照提示操作并保存令牌。
    - **网页流程**：打开 [BotFather 的 Web 应用](https://t.me/BotFather?startapp)——它可在每个 Telegram 客户端中运行，包括 [web.telegram.org](https://web.telegram.org)——在界面中创建机器人并复制其令牌。

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

    环境变量回退：`TELEGRAM_BOT_TOKEN`（仅限默认账户；命名账户必须使用 `botToken` 或 `tokenFile`）。
    Telegram **不**使用 `openclaw channels login telegram`；请在配置/环境变量中设置令牌，然后启动 Gateway 网关。

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
    将机器人添加到你的群组，然后获取群组访问所需的两个 ID：

    - 你的 Telegram 用户 ID，用于 `allowFrom` / `groupAllowFrom`
    - Telegram 群组聊天 ID，作为 `channels.telegram.groups` 下的键

    从 `openclaw logs --follow`、转发消息获取 ID 的机器人或 Bot API `getUpdates` 获取群组聊天 ID。允许该群组后，`/whoami@<bot_username>` 会确认用户 ID 和群组 ID。

    以 `-100` 开头的负数超级群组 ID 是群组聊天 ID。它们应放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom` 下。

  </Step>
</Steps>

<Note>
令牌解析会区分账户：`tokenFile` 优先于 `botToken`，后者优先于环境变量；配置始终优先于 `TELEGRAM_BOT_TOKEN`（后者仅为默认账户解析）。成功启动后，OpenClaw 会缓存机器人身份，最长 24 小时，因此重启时可跳过额外的 `getMe` 调用；更改或移除令牌会清除该缓存。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram 机器人默认启用 **Privacy Mode**，这会限制它们能接收的群组消息。

    要查看所有群组消息，可采用以下任一方式：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式后，请在每个群组中移除机器人并重新添加，以便 Telegram 应用更改。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。管理员机器人会接收所有群组消息，适用于始终响应的群组行为。
  </Accordion>

  <Accordion title="实用的 BotFather 开关">

    - `/setjoingroups` — 允许/拒绝添加到群组
    - `/setprivacy` — 群组可见性行为

    如果你更喜欢使用界面而不是聊天命令，也可以在 [BotFather 的 Web 应用](https://t.me/BotFather?startapp)中使用相同设置。

  </Accordion>
</AccordionGroup>

## 仪表板 Mini App

在与机器人的私信中运行 `/dashboard`，以在 Telegram 内打开 OpenClaw 仪表板。

要求：

- 使用 `gateway.tailscale.mode: "serve"` 或 `"funnel"` 提供已发布的 HTTPS Mini App URL。
- 你的数字 Telegram 用户 ID 必须位于所选账户的有效 `allowFrom` 或 `commands.ownerAllowFrom` 中。
- 请使用私信。在群组中，`/dashboard` 会回复 `open this in a DM with the bot`，且不会发送按钮。
- Docker 安装：Serve/Funnel 模式要求 Gateway 网关在 `tailscaled` 旁绑定到回环地址，而使用已发布端口的桥接网络无法满足此要求。请使用 `network_mode: host` 运行 Gateway 网关容器，并将主机的 `tailscaled` 套接字（`/var/run/tailscale`）以及 `tailscale` CLI 挂载到容器中。

Mini App 是仅限 Tailscale 的 v1 路径，不支持 Telegram Web iframe。

## 访问控制和激活

### 群组机器人身份

在群组和论坛主题中，明确提及已配置的机器人用户名（例如 `@my_bot`）会寻址所选的 OpenClaw 智能体，即使智能体角色名称与 Telegram 用户名不同。群组静默策略仍适用于无关消息，但机器人用户名本身绝不会被视为“其他人”。

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`（要求 `allowFrom` 中至少有一个发送者 ID）
    - `open`（要求 `allowFrom` 包含 `"*"`）
    - `disabled`

    `dmPolicy: "open"` 配合 `allowFrom: ["*"]`，会允许任何找到或猜到机器人用户名的 Telegram 账户向机器人发出命令。仅应将其用于有意公开且工具受到严格限制的机器人；单所有者机器人应使用 `allowlist` 并指定数字用户 ID。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。接受 `telegram:` / `tg:` 前缀并会将其规范化。
    在多账户配置中，限制性的顶层 `channels.telegram.allowFrom` 是一道安全边界：除非合并后的有效允许列表仍包含显式通配符，否则账户级 `allowFrom: ["*"]` 不会使该账户公开。
    `dmPolicy: "allowlist"` 配合空的 `allowFrom` 会阻止所有私信，并会被配置验证拒绝。
    设置流程只会询问数字用户 ID。如果你的配置中有来自旧版设置流程的 `@username` 允许列表条目，请运行 `openclaw doctor --fix`，尽力将其解析为数字 ID（需要 Telegram 机器人令牌）。
    如果你以前依赖配对存储的允许列表文件，`openclaw doctor --fix` 可以将条目恢复到 `channels.telegram.allowFrom`，供允许列表流程使用（例如 `dmPolicy: "allowlist"` 尚无显式 ID 时）。

    对于单所有者机器人，建议使用 `dmPolicy: "allowlist"` 并显式指定数字 `allowFrom` ID，而不是依赖以前的配对批准。

    常见误解：批准私信配对并不意味着“此发送者在所有位置都已获授权”。配对仅授予私信访问权限。如果尚不存在命令所有者，首次获批的配对还会设置 `commands.ownerAllowFrom`，为仅所有者命令和 Exec 审批指定一个明确的操作员账户。群组发送者授权仍来自显式配置的允许列表。
    要让同一身份同时获得私信和群组命令的授权：将你的数字 Telegram 用户 ID 放入 `channels.telegram.allowFrom`；对于仅所有者命令，请确保 `commands.ownerAllowFrom` 包含 `telegram:<your user id>`。

    ### 查找你的 Telegram 用户 ID

    更安全的方法（无需第三方机器人）：向你的机器人发送私信，运行 `openclaw logs --follow`，查看 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和允许列表">
    以下两个控制项共同生效：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 未配置 `groups`，且 `groupPolicy: "open"`：任何群组都能通过群组 ID 检查
       - 未配置 `groups`，且 `groupPolicy: "allowlist"`（默认）：阻止所有群组，直到添加 `groups` 条目（或 `"*"`）
       - 已配置 `groups`：将其用作允许列表（显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open` / `allowlist`（默认）/ `disabled`

    `groupAllowFrom` 会筛选群组发送者；如果未设置，Telegram 会回退到 `allowFrom`（而不是配对存储——群组发送者授权绝不会继承私信配对存储的批准，这是自 `2026.2.25` 起设立的安全边界）。
    `groupAllowFrom` 条目应为数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀会被规范化）；非数字条目将被忽略。不要在此处放置群组或超级群组聊天 ID——负数聊天 ID 应放在 `channels.telegram.groups` 下。
    单所有者机器人的实用模式：在 `channels.telegram.allowFrom` 中设置你的用户 ID，不设置 `groupAllowFrom`，并在 `channels.telegram.groups` 下允许目标群组。
    如果配置中完全缺少 `channels.telegram`，运行时默认采用故障关闭的 `groupPolicy="allowlist"`，除非显式设置 `channels.defaults.groupPolicy`。

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

    在群组中使用 `@<bot_username> ping` 进行测试。`requireMention: true` 时，普通群组消息不会触发机器人。

    允许某个特定群组中的任何成员：

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

    仅允许某个特定群组中的指定用户：

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
      常见错误：`groupAllowFrom` 不是群组允许列表。

      - 负数 Telegram 群组/超级群组聊天 ID（`-1001234567890`）应放在 `channels.telegram.groups` 下。
      - Telegram 用户 ID（`8734062810`）应放在 `groupAllowFrom` 下，以限制允许群组中哪些人可以触发机器人。
      - 仅当要允许某个已允许群组中的任何成员与机器人交互时，才使用 `groupAllowFrom: ["*"]`。

    </Warning>

  </Tab>

  <Tab title="提及行为">
    默认情况下，群组回复需要提及机器人。提及可以来自：

    - 原生 `@botusername` 提及，或
    - `agents.list[].groupChat.mentionPatterns` 或 `messages.groupChat.mentionPatterns` 中的提及模式

    会话级开关（仅影响状态，不会持久化）：`/activation always`、`/activation mention`。如需持久化，请使用配置：

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

    群组历史上下文始终开启，并受 `historyLimit` 限制。设置 `channels.telegram.historyLimit: 0` 可禁用群组历史窗口。`openclaw doctor --fix` 会移除已停用的 `includeGroupHistoryContext` 键。

    获取群组聊天 ID：将群组消息转发给 `@userinfobot` / `@getidsbot`，从 `openclaw logs --follow` 中读取 `chat.id`，检查 Bot API `getUpdates`，或在允许群组后运行 `/whoami@<bot_username>`。

  </Tab>
</Tabs>

## 运行时行为

- Telegram 在 Gateway 网关进程内运行。
- 路由是确定性的：Telegram 入站消息的回复会返回 Telegram（模型不会选择渠道）。
- 入站消息会规范化为共享渠道封装，其中包含回复元数据、媒体占位符，以及 Gateway 网关已观察到的回复所对应的持久化回复链上下文。
- 群组会话按群组 ID 隔离。论坛话题会附加 `:topic:<threadId>`。
- 私信消息可以携带 `message_thread_id`；OpenClaw 会为回复保留该值。仅当 Telegram `getMe` 为该 Bot 报告 `has_topics_enabled: true` 时，私信话题才会拆分会话；否则私信仍使用扁平会话。
- 长轮询使用 grammY runner，并按聊天/话题顺序处理。Runner 接收端并发数使用 `agents.defaults.maxConcurrent`。
- 多账户启动会限制并发 `getMe` 探测数量，避免大型 Bot 集群同时展开所有账户探测。
- 每个 Gateway 网关进程都会保护长轮询，确保同一时间只有一个活跃轮询器可以使用某个 Bot Token。持续出现的 `getUpdates` 409 冲突表示另一个 OpenClaw Gateway 网关、脚本或外部轮询器正在使用同一 Token。
- 默认情况下，如果连续 120 秒没有完成 `getUpdates` 存活检测，轮询看门狗会重启。仅当部署在长时间运行的任务期间误触发轮询停滞重启时，才提高 `channels.telegram.pollingStallThresholdMs`（30000-600000，支持按账户覆盖）。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

<Note>
  `channels.telegram.dm.threadReplies` 和 `channels.telegram.direct.<chatId>.threadReplies` 已移除。如果升级后配置中仍有这些键，请运行 `openclaw doctor --fix`。私信话题路由现在遵循 Telegram `getMe.has_topics_enabled`（由 BotFather 的 threaded mode 控制）：启用话题的 Bot 在 Telegram 发送 `message_thread_id` 时使用按话题隔离的私信会话；其他私信仍使用扁平会话。
</Note>

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 会在私聊、群组和话题中实时流式传输部分回复：先发送一条预览消息，然后反复执行 `editMessageText`，最后在原消息中完成定稿。

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认值：`partial`）
    - 较短的初始回答预览会经过防抖；如果运行仍处于活跃状态，则会在有限延迟后实际生成
    - `progress` 为工具进度保留一份可编辑的状态草稿；如果回答活动早于工具进度到达，则显示稳定的状态标签；完成时清除该草稿，并将最终回答作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一条经过编辑的预览消息（默认值：预览流式传输处于活跃状态时为 `true`）
    - `streaming.preview.commandText` 控制这些行中的命令/Exec 详细程度：`raw`（默认值）或 `status`（仅显示工具标签）
    - `streaming.progress.commentary`（默认值：`false`）用于选择在临时进度草稿中加入智能体的评论/前置说明文本
    - 系统会检测旧版 `channels.telegram.streamMode`、布尔值 `streaming` 和已停用的原生草稿预览键；运行 `openclaw doctor --fix` 可迁移这些配置

    工具进度行是在工具运行期间显示的简短状态更新（命令执行、文件读取、计划更新、补丁摘要，以及 app-server 模式下的 Codex 前置说明/评论）。Telegram 默认启用这些更新（与 `v2026.4.22`+ 版本已发布的行为一致）。

    保留回答预览编辑，但隐藏工具进度行：

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

    保持工具进度可见，但隐藏命令/Exec 文本：

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

    `progress` 模式会显示工具进度，但不会通过编辑该消息来写入最终回答。请将命令文本策略放在 `streaming.progress` 下：

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

    `streaming.mode: "off"` 会禁用预览编辑，并抑制通用的工具/进度消息，而不是将其作为独立状态消息发送；审批提示、媒体和错误仍通过正常的最终交付路径发送。`streaming.preview.toolProgress: false` 仅保留回答预览编辑。

    <Note>
      选定文本的引用回复属于例外情况。当 `replyToMode` 为 `first`、`all` 或 `batched`，且入站消息包含选定的引用文本时，OpenClaw 会通过 Telegram 的原生引用回复路径发送最终回答，而不是编辑回答预览，因此 `streaming.preview.toolProgress` 无法在该轮显示状态行。不含选定引用文本的当前消息回复仍会流式传输。当工具进度可见性比原生引用回复更重要时，请设置 `replyToMode: "off"`；也可以设置 `streaming.preview.toolProgress: false` 来接受这一取舍。
    </Note>

    对于纯文本回复：短预览会在原消息中完成最终编辑；拆分成多条消息的长回复会将预览复用为第一个分块，然后仅发送剩余内容；进度模式的最终回复会清除状态草稿并使用正常的最终交付；如果在确认完成前最终编辑失败，OpenClaw 会回退到正常的最终交付并清理过期预览。对于复杂回复（媒体载荷），OpenClaw 始终回退到正常的最终交付并清理预览。

    预览流式传输与分块流式传输互斥——明确启用分块流式传输时，OpenClaw 会跳过预览流，以避免重复流式传输。

    推理：`/reasoning stream` 会在生成期间将推理过程流式传输到实时预览中，然后在最终交付后删除推理预览（使用 `/reasoning on` 可使其保持可见）。发送的最终回答不包含推理文本。

  </Accordion>

  <Accordion title="富消息格式">
    默认情况下，出站文本使用标准 Telegram HTML 消息，当前各客户端均可阅读：粗体、斜体、链接、代码、剧透、引用——而不是仅限 Bot API 10.2 富消息的区块（原生表格、详情、富媒体、公式）。

    选择启用 Bot API 10.2 富消息：

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    启用后：系统会告知智能体该 Bot/账户支持富消息（以及受支持的 Markdown + HTML 岛编写约定）；Markdown 文本会通过 OpenClaw 的 Markdown IR 渲染为有类型的 Bot API 10.2 富区块（标题、表格、详情、检查清单、富媒体、公式、地图、拼贴）；媒体说明文字仍使用 Telegram HTML 说明文字（富消息不会取代说明文字，且说明文字上限为 1024 个字符）。

    这样可避免模型文本接触 Telegram 的富 Markdown 符号，因此 `$400-600K` 之类的货币内容不会被解析为数学公式。较长的富文本会根据 Telegram 的限制自动拆分。超过 20 列限制的表格会回退为代码块。

    默认值：关闭，以确保客户端兼容性——部分当前 Desktop、Web、Android 和第三方客户端会将已接受的富消息显示为不受支持。除非与该 Bot 配合使用的每个客户端都能渲染富消息，否则请保持关闭。`/status` 会显示当前会话的富消息是开启还是关闭。

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
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "创建图像" },
      ],
    },
  },
}
```

    规则：名称会被规范化（移除开头的 `/` 并转换为小写）；有效模式为 `a-z`、`0-9`、`_`，长度为 1-32；自定义命令不能覆盖原生命令；存在冲突或重复的命令会被跳过并记录到日志中。

    自定义命令只是菜单项——不会自动实现行为。即使 Telegram 菜单中未显示插件/Skills 命令，手动输入时仍然可以使用。如果禁用了原生命令，内置命令会被移除；如已配置，自定义命令和插件命令仍可注册。

    常见设置失败：

    - 裁剪重试后，`setMyCommands failed` 仍与 `BOT_COMMANDS_TOO_MUCH` 一同出现，表示菜单依然超出限制；请减少插件/Skills/自定义命令，或禁用 `channels.telegram.commands.native`。
    - 当直接使用 Bot API curl 命令可以正常工作，但 `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 因 `404: Not Found` 而失败时，通常表示 `channels.telegram.apiRoot` 被设置为完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须仅为 Bot API 根地址；`openclaw doctor --fix` 会移除意外添加的尾部 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了所配置的 Bot Token。请使用当前 BotFather Token 更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`（默认账户）；OpenClaw 会在轮询前停止，因此不会将此问题报告为 webhook 清理失败。
    - `setMyCommands failed` 与网络/获取错误同时出现时，通常表示到 `api.telegram.org` 的出站 DNS/HTTPS 连接已被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装后：

    1. `/pair` 会生成设置代码
    2. 将代码粘贴到 iOS 应用中
    3. `/pair pending` 会列出待处理请求（包括角色/权限范围）
    4. 批准：`/pair approve <requestId>`、`/pair approve`（唯一的待处理请求）或 `/pair approve latest`

    如果设备使用已更改的身份验证详细信息（角色、权限范围、公钥）重试，之前的待处理请求会被新的 `requestId` 取代；请在批准前重新运行 `/pair pending`。

    更多详情：[配对](/zh-CN/channels/pairing#pair-via-telegram)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘的权限范围：

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

    权限范围：`off`、`dm`、`group`、`all`、`allowlist`（默认值）。旧版 `capabilities: ["inlineButtons"]` 会映射到 `"all"`。

    消息操作示例：

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

    Mini App 按钮示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "打开应用：",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "启动", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` 按钮仅适用于用户与 Bot 之间的私聊。

    未被已注册插件的交互处理程序认领的回调点击会以文本形式传递给智能体：`callback_data: <value>`。

  </Accordion>

  <Accordion title="面向智能体和自动化的 Telegram 消息操作">
    操作：

    - `sendMessage`（`to`、`content`、可选的 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content` 或 `caption`、可选的 `presentation` 内联按钮；仅编辑按钮会更新回复标记）
    - `createForumTopic`（`chatId`、`name`、可选的 `iconColor`、`iconCustomEmojiId`）

    便捷别名：`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`。

    启用条件：`channels.telegram.actions.sendMessage`、`deleteMessage`、`reactions`、`sticker`（默认：禁用）。`edit`、`createForumTopic` 和 `editForumTopic` 默认启用，没有专用开关。
    运行时发送使用启动/重新加载时的活动配置/密钥快照，因此操作路径不会在每次发送时重新解析 `SecretRef` 值。

    表情回应移除语义：[/tools/reactions](/zh-CN/tools/reactions)。

  </Accordion>

  <Accordion title="回复线程标签">
    生成输出中的显式回复线程标签：

    - `[[reply_to_current]]` — 回复触发消息
    - `[[reply_to:<id>]]` — 回复特定消息 ID

    `channels.telegram.replyToMode`：`off`（默认）、`first`、`all`。

    启用回复线程且原始文本/说明文字可用时，OpenClaw 会自动添加原生引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元；较长的消息会从开头开始引用，如果 Telegram 拒绝该引用，则回退为普通回复。

    `off` 仅禁用隐式回复线程；仍会遵循显式 `[[reply_to_*]]` 标签。

  </Accordion>

  <Accordion title="论坛话题和线程行为">
    论坛超级群组：话题会话键附加 `:topic:<threadId>`；回复和正在输入状态以话题线程为目标；话题配置路径为 `channels.telegram.groups.<chatId>.topics.<threadId>`。

    常规话题（`threadId=1`）属于特殊情况：发送消息时省略 `message_thread_id`（Telegram 会拒绝带有“thread not found”的 `sendMessage(...thread_id=1)`），但正在输入操作仍包含 `message_thread_id`（经实际验证，这是显示正在输入指示器所必需的）。

    除非被覆盖，否则话题条目继承群组设置（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。`agentId` 仅适用于话题，不继承群组默认值。`topics."*"` 为该群组中的每个话题设置默认值；确切的话题 ID 仍优先于 `"*"`。

    **按话题路由智能体**：每个话题都可以通过话题配置中的 `agentId` 路由到不同的智能体，使其拥有自己的工作区、记忆和会话：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 常规话题 -> main 智能体
                "3": { agentId: "zu" },        // 开发话题 -> zu 智能体
                "5": { agentId: "coder" }      // 代码审查 -> coder 智能体
              }
            }
          }
        }
      }
    }
    ```

    随后，每个话题都会有自己的会话键，例如 `agent:zu:telegram:group:-1001234567890:topic:3`。

    **持久 ACP 话题绑定**：论坛话题可以通过顶层类型化绑定固定 ACP harness 会话（`bindings[]`，包含 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"` 和话题限定 ID，例如 `-1001234567890:topic:42`）。目前范围仅限群组/超级群组中的论坛话题。参阅 [ACP 智能体](/zh-CN/tools/acp-agents)。

    **从聊天生成线程绑定的 ACP 会话**：`/acp spawn <agent> --thread here|auto` 将当前话题绑定到新的 ACP 会话；后续消息会直接路由到该会话，OpenClaw 还会将生成确认消息固定在话题中。需要 `channels.telegram.threadBindings.spawnSessions`（默认：`true`）。

    模板上下文会公开 `MessageThreadId` 和 `IsForum`。带有 `message_thread_id` 的私信聊天会保留回复元数据，但只有当 Telegram `getMe` 报告 `has_topics_enabled: true` 时，才会使用可感知线程的会话键。
    已停用的 `dm.threadReplies` 和 `direct.*.threadReplies` 覆盖项已被移除；BotFather 线程模式是唯一事实来源。运行 `openclaw doctor --fix` 以移除过时的配置键。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 会区分语音留言和音频文件。默认：按音频文件处理；在智能体回复中添加 `[[audio_as_voice]]` 标签可强制以语音留言形式发送。入站语音留言的转写文本在智能体上下文中会被标记为机器生成且不可信的文本，但提及检测仍使用原始转写文本，因此需要提及才能触发的语音消息仍可正常工作。

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

    Telegram 会区分视频文件和视频留言。视频留言不支持说明文字；提供的消息文本会单独发送。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### 位置和地点

    使用现有的 `send` 操作和一个独立的 `location` 对象。坐标会发送原生位置标记；同时添加 `name` 和 `address` 会发送原生地点卡片。位置发送不能与消息文本或媒体组合使用。

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### 贴纸

    入站：会下载并处理静态 WEBP（占位符 `<media:sticker>`）；跳过动画 TGS 和视频 WEBM。

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

  <Accordion title="表情回应通知">
    Telegram 表情回应以 `message_reaction` 更新的形式到达，与消息载荷分开。启用后，OpenClaw 会将类似 `Telegram reaction added: 👍 by Alice (@alice) on msg 42` 的系统事件加入队列。

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    `own` 表示仅接收用户对机器人所发消息的表情回应（通过已发送消息缓存尽力实现）。表情回应事件仍遵循 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未经授权的发送者会被丢弃。

    Telegram 不会在表情回应更新中提供线程 ID：非论坛群组路由到群聊会话；论坛群组路由到常规话题会话（`:topic:1`），而不是确切的来源话题。

    轮询/webhook 的 `allowed_updates` 会自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="确认表情回应">
    OpenClaw 处理入站消息时，`ackReaction` 会发送确认表情符号。`messages.ackReactionScope` 决定发送的*时机*。

    **表情符号解析顺序：**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - 智能体身份表情符号回退值（`agents.list[].identity.emoji`，否则为“👀”）

    Telegram 要求使用 Unicode 表情符号（例如“👀”）；使用 `""` 可为某个渠道或账户禁用该表情回应。

    **范围（`messages.ackReactionScope`，默认为 `"group-mentions"`；目前没有 Telegram 账户级或 Telegram 渠道级覆盖项）：**

    `all`（私信 + 群组，包括环境房间事件）、`direct`（仅私信）、`group-all`（除环境房间事件外的每条群组消息，不包括私信）、`group-mentions`（机器人在群组中被提及时；**不包括私信** — 默认）、`off` / `none`（禁用）。

    <Note>
    默认范围（`group-mentions`）不会在私信或环境房间事件中触发确认表情回应。私信请使用 `direct` 或 `all`；只有 `all` 会确认环境房间事件。该值会在 Telegram provider 启动时读取，因此需要重启 Gateway 网关才能使更改生效。
    </Note>

  </Accordion>

  <Accordion title="由 Telegram 事件和命令触发的配置写入">
    渠道配置写入默认启用（`configWrites !== false`）。由 Telegram 触发的写入包括群组迁移事件（`migrate_to_chat_id`，更新 `channels.telegram.groups`）和 `/config set` / `/config unset`（需要启用命令）。

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
    默认为长轮询。对于 webhook 模式，请设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选设置包括 `webhookPath`（默认 `/telegram-webhook`）、`webhookHost`（默认 `127.0.0.1`）、`webhookPort`（默认 `8787`）、`webhookCertPath`（用于直接 IP 或无域名设置的自签名证书 PEM）。

    在长轮询模式下，OpenClaw 仅在更新成功分派后持久化其重启水位线；处理程序失败时，该更新在同一进程中仍可重试，而不会被标记为已完成。

    本地监听器默认绑定到 `127.0.0.1:8787`。对于公共入口，请在本地端口前设置反向代理，或有意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式会验证请求防护条件、Telegram 密钥令牌和 JSON 正文，然后将更新提交到持久入口队列，之后返回空的 `200`。成功的持久接纳会包含 `x-openclaw-delivery-accepted: durable`；健康、路由、身份验证、验证和存储错误响应会省略此标头。反向代理和主机控制器可以要求存在该标头，从而区分 OpenClaw 接纳与通用的空 `200`，而无需根据响应时间推断是否已接受。

    随后，OpenClaw 会通过长轮询所使用的相同按聊天/按话题机器人通道异步处理更新，因此耗时较长的智能体轮次不会占用 Telegram 的投递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认为 4000；`streaming.chunkMode="newline"` 在按长度拆分前优先选择段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500，范围 10-60000）控制相册/媒体组在 OpenClaw 将其作为一条入站消息分派前的缓冲时长。如果相册中的内容到达较晚，请增大此值；如果要降低相册回复延迟，请减小此值。
    - `channels.telegram.timeoutSeconds` 会覆盖 API 客户端超时时间（未设置时应用 grammY 默认值）。Bot 客户端会将低于 60 秒出站文本/输入状态请求保护时限的配置值提升至该时限，以免 grammY 在 OpenClaw 的传输保护和回退机制能够运行之前中止可见回复的投递。长轮询仍使用 45 秒的 `getUpdates` 请求保护时限，以免无限期放弃空闲轮询。
    - `channels.telegram.pollingStallThresholdMs` 默认为 120000；仅在轮询停滞重启出现误报时，才在 30000 到 600000 之间调整。
    - 群组上下文历史记录使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 可将其禁用。
    - 当 Gateway 网关已观察到父消息时，回复/引用/转发的补充上下文会归一化为一个选定的对话上下文窗口；已观察消息的缓存位于 OpenClaw SQLite 插件状态中，`openclaw doctor --fix` 会导入旧版附属文件。Telegram 每次更新仅包含一个浅层 `reply_to_message`，因此早于缓存的消息链仅限于该载荷。
    - Telegram 允许列表主要限制谁可以触发智能体，并非完整的补充上下文脱敏边界。
    - 私信历史记录：`channels.telegram.dmHistoryLimit`、`channels.telegram.dms["<user_id>"].historyLimit`。
    - `channels.telegram.retry` 适用于 Telegram 发送辅助程序（CLI/工具/操作），用于处理可恢复的出站 API 错误。入站最终回复投递会对连接前故障进行有界安全发送重试，但不会重试可能导致可见消息重复的、发送后状态不明确的网络封装错误。

    CLI 和消息工具的发送目标接受数字聊天 ID、用户名或论坛话题目标：

```bash
openclaw message send --channel telegram --target 123456789 --message "你好"
openclaw message send --channel telegram --target @name --message "你好"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "你好，话题"
```

    投票使用 `openclaw message poll`，并支持论坛话题：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "发布吗？" --poll-option "是" --poll-option "否"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "选择时间" --poll-option "上午 10 点" --poll-option "下午 2 点" \
  --poll-duration-seconds 300 --poll-public
```

    仅限 Telegram 的投票标志：`--poll-duration-seconds`（5-600）、`--poll-anonymous`、`--poll-public`、`--thread-id`（或 `:topic:` 目标）。`--poll-option` 重复 2-12 次（Telegram 的选项上限）。

    Telegram 发送还支持：包含 `buttons` 块的 `--presentation`，用于内联键盘（当 `channels.telegram.capabilities.inlineButtons` 允许时）；`--pin` 或 `--delivery '{"pin":true}'`，用于在 Bot 能够在该聊天中置顶时请求置顶投递；以及 `--force-document`，用于将出站图片、GIF 和视频作为文档发送，而非以压缩图片、动画或视频上传。

    操作限制：`channels.telegram.actions.sendMessage=false` 会禁用包括投票在内的所有出站消息；`channels.telegram.actions.poll=false` 会禁用创建投票，但仍允许常规发送。

  </Accordion>

  <Accordion title="Telegram 中的 Exec 审批">
    Telegram 支持在审批者私信中进行 Exec 审批，并且可以选择在发起请求的聊天或话题中发布提示。审批者必须是数字 Telegram 用户 ID。

    - `channels.telegram.execApprovals.enabled`（至少能解析出一名审批者时，`"auto"` 会启用）
    - `channels.telegram.execApprovals.approvers`（回退到 `commands.ownerAllowFrom` 中的数字所有者 ID）
    - `channels.telegram.execApprovals.target`：`dm`（默认）| `channel` | `both`
    - `agentFilter`、`sessionFilter`

    `channels.telegram.allowFrom`、`groupAllowFrom` 和 `defaultTo` 控制谁可以与 Bot 交互以及正常回复发送到何处，并不会使某人成为 Exec 审批者。当尚不存在命令所有者时，首次获批的私信配对会初始化 `commands.ownerAllowFrom`，因此单所有者设置无需在 `execApprovals.approvers` 下重复配置 ID 即可工作。

    渠道投递会在聊天中显示命令文本；仅在可信群组/话题中启用 `channel` 或 `both`。当提示发送到论坛话题中时，OpenClaw 会为审批提示和后续消息保留该话题。Exec 审批默认在 30 分钟后过期。

    内联审批按钮还要求 `channels.telegram.capabilities.inlineButtons` 允许目标界面（`dm`、`group` 或 `all`）。以 `plugin:` 为前缀的审批 ID 通过插件审批解析；其他 ID 会优先通过 Exec 审批解析。

    请参阅 [Exec 审批](/zh-CN/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 错误回复控制

当智能体遇到投递错误或提供商错误时，错误策略控制错误消息是否会发送到 Telegram 聊天：

| 键                                  | 值                         | 默认值          | 描述                                                                                                                                                                                                     |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`、`once`、`silent` | `always`        | `always` 会将每条错误消息发送到聊天。`once` 在每个冷却窗口内仅发送一次各不相同的错误消息（抑制重复的相同错误）。`silent` 从不向聊天发送错误消息。 |
| `channels.telegram.errorCooldownMs` | 数字（ms）                | `14400000`（4h） | `once` 策略的冷却窗口。发送错误后，在此时间间隔过去前，相同消息会受到抑制。防止故障期间错误消息泛滥。                                           |

支持按账号、群组和话题覆盖（继承规则与其他 Telegram 配置键相同）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 抑制此群组中的错误
        },
      },
    },
  },
}
```

## 故障排查

<AccordionGroup>
  <Accordion title="Bot 不响应群组中未提及它的消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性：BotFather `/setprivacy` -> Disable，然后从群组中移除 Bot 并重新添加。
    - 当配置预期处理未提及 Bot 的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 会检查显式数字群组 ID；无法探测通配符 `"*"` 的成员资格。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全无法看到群组消息">

    - 存在 `channels.telegram.groups` 时，必须列出该群组（或包含 `"*"`）。
    - 验证 Bot 是否为该群组的成员。
    - 查看 `openclaw logs --follow` 了解跳过原因。

  </Accordion>

  <Accordion title="命令只能部分工作或完全无法工作">

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）；即使群组策略为 `open`，命令授权仍然适用。
    - `setMyCommands failed` 与 `BOT_COMMANDS_TOO_MUCH` 表示原生菜单的条目过多；请减少插件/Skills/自定义命令，或禁用原生菜单。
    - `deleteMyCommands` / `setMyCommands` 启动调用和 `sendChatAction` 输入状态调用均有界，并且在请求超时时会通过 Telegram 的传输回退重试一次。持续出现网络/fetch 错误通常表示无法通过 DNS/HTTPS 访问 `api.telegram.org`。

  </Accordion>

  <Accordion title="启动时报告令牌未获授权">

    - `getMe returned 401` 表示所配置 Bot 令牌的 Telegram 身份验证失败。请在 BotFather 中重新复制或重新生成令牌，然后更新 `channels.telegram.botToken`、`tokenFile`、`accounts.<id>.botToken` 或 `TELEGRAM_BOT_TOKEN`（默认账号）。
    - 启动期间出现 `deleteWebhook 401 Unauthorized` 也表示身份验证失败；将其视为“没有 Webhook”只会把同一个无效令牌错误推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - 如果 `AbortSignal` 类型不匹配，使用自定义 fetch/代理的 Node 22+ 可能会触发立即中止行为。
    - 部分主机会优先将 `api.telegram.org` 解析为 IPv6；IPv6 出站连接异常会导致间歇性 API 故障。
    - 日志中的 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!` 会作为可恢复网络错误进行重试。
    - 在轮询启动期间，OpenClaw 会为 grammY 复用启动时成功的 `getMe` 探测结果，因此运行器无需在首次 `getUpdates` 之前再次调用 `getMe`。
    - 如果在轮询启动期间 `deleteWebhook` 因暂时性网络错误而失败，OpenClaw 会继续进入长轮询，而不会再发起一次轮询前控制平面调用。如果 Webhook 仍处于活动状态，则会表现为 `getUpdates` 冲突；OpenClaw 会重建传输并重试 Webhook 清理。
    - 如果 Telegram 套接字按较短的固定周期重新建立，请检查 `channels.telegram.timeoutSeconds` 是否过低——Bot 客户端会将低于出站和 `getUpdates` 请求保护时限的配置值提升至相应时限，但旧版本在此值低于这些保护时限时可能会中止每次轮询或回复。
    - 日志中的 `Polling stall detected` 表示 OpenClaw 在默认 120 秒内未检测到已完成的长轮询活跃状态，因此会重启轮询并重建传输。
    - 当运行中的轮询账号在启动宽限期后尚未完成 `getUpdates`、运行中的 Webhook 账号在启动宽限期后尚未完成 `setWebhook`，或上次成功的轮询传输活动已过期时，`openclaw channels status --probe` 和 `openclaw doctor` 会发出警告。
    - 仅当长时间运行的 `getUpdates` 调用正常，但主机仍报告轮询停滞重启误报时，才提高 `channels.telegram.pollingStallThresholdMs`。持续停滞通常表示访问 `api.telegram.org` 时存在代理、DNS、IPv6 或 TLS 出站问题。
    - Telegram 的 Bot API 传输遵循进程代理环境变量：`HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果为服务环境设置了 `OPENCLAW_PROXY_URL`，且不存在标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在直接出站连接/TLS 不稳定的 VPS 主机上，通过代理路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ 默认使用 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序依次遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`、`channels.telegram.network.dnsResultOrder`，然后是进程默认值（例如 `NODE_OPTIONS=--dns-result-order=ipv4first`）；如果均不适用，则在 Node 22+ 上回退到 `ipv4first`。
    - 在 WSL2 上，或者仅使用 IPv4 的行为更好时，强制选择地址族：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - 默认情况下，Telegram 媒体下载已允许 RFC 2544 基准测试地址范围的解析结果（`198.18.0.0/15`）。如果受信任的 fake-IP 或透明代理在媒体下载期间将 `api.telegram.org` 重写为其他私有、内部或特殊用途地址，请选择启用仅限 Telegram 的绕过选项：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 每个账户也可通过 `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` 单独选择启用同一选项。
    - 如果代理将 Telegram 媒体主机解析到 `198.18.x.x`，请先保持危险标志关闭——默认情况下已经允许该地址范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram 媒体 SSRF 防护。仅应在受信任且由操作员控制的代理环境（Clash、Mihomo、Surge fake-IP 路由）中使用，这些环境会合成 RFC 2544 基准测试范围之外的私有或特殊用途解析结果。通过普通公共互联网访问 Telegram 时，请保持关闭。
    </Warning>

    - 临时环境变量覆盖：`OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`、`OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`。
    - 验证 DNS 解析结果：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[渠道故障排除](/zh-CN/channels/troubleshooting)。

## 配置参考

主要参考：[配置参考 - Telegram](/zh-CN/gateway/config-channels#telegram)。

<Accordion title="关键 Telegram 字段">

- 启动/身份验证：`enabled`、`botToken`、`tokenFile`（必须是普通文件；符号链接会被拒绝）、`accounts.*`
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- 话题默认值：`groups.<chatId>.topics."*"` 适用于未匹配的论坛话题；精确的话题 ID 会覆盖该值
- Exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`、`threadBindings`
- 流式传输：`streaming`（模式 `off | partial | block | progress`）、`streaming.preview.toolProgress`
- 格式化/投递：`textChunkLimit`、`streaming.chunkMode`、`richMessages`、`markdown.tables`（`off | bullets | code | block`）、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根路径：`apiRoot`（仅限 Bot API 根路径；不要包含 `/bot<TOKEN>`）、`trustedLocalFileRoots`（自托管 Bot API 的绝对 `file_path` 根路径）
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`、`webhookPort`、`webhookCertPath`
- 操作/能力：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- 表情回应：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`、`silentErrorReplies`
- 写入/历史记录：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账户优先级：配置两个或更多账户 ID 时，请设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以明确指定默认路由。否则，OpenClaw 会回退到第一个规范化的账户 ID，并由 `openclaw doctor` 发出警告。命名账户会继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不会继承 `accounts.default.*` 值。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="配对" icon="link" href="/zh-CN/channels/pairing">
    将 Telegram 用户与 Gateway 网关配对。
  </Card>
  <Card title="群组" icon="users" href="/zh-CN/channels/groups">
    群组和话题的允许列表行为。
  </Card>
  <Card title="渠道路由" icon="route" href="/zh-CN/channels/channel-routing">
    将入站消息路由到智能体。
  </Card>
  <Card title="安全性" icon="shield" href="/zh-CN/gateway/security">
    威胁模型和安全加固。
  </Card>
  <Card title="多智能体路由" icon="sitemap" href="/zh-CN/concepts/multi-agent">
    将群组和话题映射到智能体。
  </Card>
  <Card title="故障排查" icon="wrench" href="/zh-CN/channels/troubleshooting">
    跨渠道诊断。
  </Card>
</CardGroup>

---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack Bot 身份
summary: ClickClack Bot 令牌渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T11:21:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 通过一等支持的 ClickClack Bot 令牌，将 OpenClaw 连接到自托管的 ClickClack 工作区。

当需要让 OpenClaw 智能体以 ClickClack Bot 用户身份出现时，请使用此方式。ClickClack 支持独立服务 Bot 和用户拥有的 Bot；用户拥有的 Bot 会保留 `owner_user_id`，并且仅获得你授予的令牌权限范围。

## 快速设置

在 ClickClack 中，打开 **Workspace settings → Integrations → OpenClaw**，创建一个
Bot，并复制其令牌。然后配置渠道：

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace` 接受工作区 ID（`wsp_...`）、slug 或显示名称。
`channels add` 会在保存后验证服务器、令牌和工作区，然后
报告正在运行的 Gateway 网关是否已获取新账号。如果 OpenClaw
已在运行，ClickClack 会自动连接，无需执行第二条命令。
否则，请使用以下命令启动：

```bash
openclaw gateway
```

如需引导式设置，请运行：

```bash
openclaw onboard
```

选择 ClickClack，然后在提示时输入服务器 URL、Bot 令牌和工作区。
引导式设置会在保存后检查服务器、令牌和工作区；检查失败不会
丢弃配置。

### 替代方案：基于环境变量的令牌

默认账号可以读取 `CLICKCLACK_BOT_TOKEN`，而无需将令牌存储
在配置中：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

命名账号必须使用已配置的令牌或令牌文件；共享环境变量
特意仅限默认账号使用。

### JSON5 参考

等效的配置结构如下：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

仅当 `baseUrl`、令牌来源和
`workspace` 均已设置时，账号才视为已配置。令牌来源可以是 `token`、`tokenFile`，默认账号还可以使用
`CLICKCLACK_BOT_TOKEN`。`workspace` 接受工作区
ID（`wsp_...`）、slug 或名称；Gateway 网关会在启动时将其解析为 ID。

### 账号配置键

| 键                      | 默认值              | 说明                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 无（必需）          | ClickClack 服务器 URL。                                                                 |
| `token`                 | 无                  | 纯字符串或密钥引用（`source: "env" \| "file" \| "exec"`）形式的 Bot 令牌。              |
| `tokenFile`             | 无                  | Bot 令牌文件的路径；优先级高于 `token`。                                |
| `workspace`             | 无（必需）          | 工作区 ID、slug 或名称。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 运行完整的智能体管线；`"model"` 发送简短的直接模型补全。 |
| `defaultTo`             | `"channel:general"` | 出站路径未提供目标时使用的目标。                                                        |
| `allowFrom`             | `["*"]`             | 入站私信和频道消息的用户 ID 允许列表。                                                  |
| `botUserId`             | 自动检测            | 启动时根据 Bot 令牌身份解析。                                                           |
| `agentId`               | 路由默认值          | 将此账号的入站消息固定到一个智能体。                                                    |
| `toolsAllow`            | 无                  | 此账号的智能体回复所使用的工具允许列表。                                                |
| `model`、`systemPrompt` | 无                  | 供 `replyMode: "model"` 补全使用。                                                     |
| `commandMenu`           | `true`              | 将原生命令发布到 ClickClack 编辑器自动补全。                                            |
| `reconnectMs`           | `1500`              | 实时连接重连延迟（100 到 60000）。                                                      |

如果 `plugins.allow` 是一个非空的限制性列表，则在渠道设置中明确选择
ClickClack 或运行 `openclaw plugins enable clickclack`
会将 `clickclack` 追加到该列表。新手引导安装采用相同的
明确选择行为。这些路径不会覆盖 `plugins.deny` 或全局
`plugins.enabled: false` 设置。直接执行
`openclaw plugins install @openclaw/clickclack` 会遵循常规
插件安装策略，并且也会在现有允许列表中记录 ClickClack。

## 多个 Bot

每个账号都会建立自己的 ClickClack 实时连接，并使用自己的 Bot 令牌。

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 回复模式

- `replyMode: "agent"`（默认）通过常规智能体管线分派入站消息，包括会话记录和工具策略。
- `replyMode: "model"` 跳过智能体管线，并使用插件运行时的 `llm.complete` 直接进行 Bot 回复，还可选择通过 `model` 和 `systemPrompt` 调整回复。补全预算由所选提供商和模型决定。

模型模式会针对解析出的 Bot 智能体 ID 运行补全，因此需要
显式启用 `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任
位：

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

如果仅使用默认的 `agent` 回复模式，请保持信任位关闭；
该模式不需要此设置。

## 命令菜单

Gateway 网关启动时，每个已配置的账号都会将 OpenClaw 的原生
命令发布到 ClickClack。这些命令会显示在编辑器自动补全中，并标有
Bot 的用户名。每次启动时都会整体替换已发布的命令集，
包括在原生命令目录为空时清除过时菜单。

命令菜单同步默认启用。在账号上设置 `commandMenu: false`
可选择退出：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

令牌需要 `commands:write`。当前 ClickClack 的 `bot:write` 和
`bot:admin` 权限包包含该权限范围，也可以单独授予。
在引入命令菜单之前创建的令牌可能需要添加该权限范围或更换令牌。

同步采用尽力而为模式，并且每次 Gateway 网关启动时仅运行一次。缺少权限范围或网络
故障会记录警告；不含该端点的旧版 ClickClack 服务器会记录
调试级别日志。这些故障均不会阻止实时连接启动。智能体离线时菜单仍然
可用，当 Bot 离开工作区时，菜单会被移除。

此版本仅发布原生命令规范。别名以及
技能、插件或自定义命令目录不会添加到菜单。如果某个
名称也注册为 HTTP 斜杠命令，ClickClack 会优先分派该
注册；其他菜单命令继续通过常规消息
传递。

使用 `agent` 模式获取跨服务关联证据。对于采用规范 `msg_<ulid>` 结构的权威
ClickClack 消息 ID，渠道会派生出
确定性的 OpenClaw 运行 ID `clickclack:<message-id>`。随后，每次模型调用
都会在诊断信息中显示为 `clickclack:<message-id>:model:<n>`；当该
轮次使用 ClawRouter 时，同一模型调用 ID 会作为 `X-Request-ID` 发送。
`model` 模式会绕过常规的智能体运行/会话诊断，因此
不适合此证据路径。

当实时事件包含经过验证的 `payload.correlation_id` 时，
渠道会在权威消息获取请求和
随后生成的 ClickClack 回复请求中将其作为 `X-Correlation-ID` 携带。
值使用 ClickClack 的安全 128 字符集（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；无效值
会被省略。这些关联仅包含标识符，绝不包含消息正文、
提示词、补全、凭据或工具输出。

## 持久化媒体传递

包含媒体的智能体回复采用必需的持久化传递。OpenClaw 会在首次写入 ClickClack 前，
为每个部分分配稳定的消息和上传 nonce，因此
重试会复用相同的上传内容和消息，而不会消耗存储配额
或发布重复内容。如果重启后上传内容已存在，
OpenClaw 不会重新读取原始本地路径或远程媒体 URL。

此恢复约定要求 ClickClack 服务器支持：

- `GET /api/uploads/by-nonce`，并且在找到和未找到结果时
  返回 `X-ClickClack-Upload-Nonce: supported`。
- `GET /api/messages/by-nonce`，并且在找到和未找到结果时
  返回 `X-ClickClack-Message-Nonce: supported`。
- 针对相同的所有者作用域 nonce 和上传内容，支持幂等的消息创建和附件关联。

旧版服务器的通用 404 不会被视为发送不存在的证据。
OpenClaw 会让传递保持未解决状态，而不会冒险产生重复内容；请先更新
ClickClack，再启用会生成媒体的智能体回复。

## 智能体活动行

默认情况下，智能体轮次运行期间，ClickClack 渠道不会显示任何内容；只会呈现最终回复。在账号上设置 `agentActivity: true`，可在轮次进行期间发布持久化的 `agent_commentary` 和 `agent_tool` 消息行：

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

要求和行为：

- **默认关闭。** 标准设置和旧版 ClickClack 服务器不受影响。
- **需要 `agent_activity:write` 令牌权限范围。** 此权限范围独立于 `bot:write`，且不会从后者继承；启用该选项前，请使用 `--scopes bot:write,agent_activity:write` 创建 Bot 令牌（或向现有令牌授予该权限范围）。
- **尽力降级。** 如果令牌缺少 `agent_activity:write`，或服务器拒绝活动写入，系统会记录失败，最终回复仍会正常传递；不会显示活动行。
- 各行按轮次（`turn_id`）分组并合并，使一个逻辑步骤对应一行；工具行采用与 Discord/Slack/Telegram 相同的进度格式（工具名称加命令详情）。
- **归属元数据。** 智能体编写的帖子（活动行和最终回复）会携带根据该轮次实际使用的模型解析出的 `author_model` 和 `author_thinking` 字段（包括回退后的模型）。未定义这些列的服务器会忽略未知 JSON 字段；持久化这些字段的服务器可以按消息回答“哪一个模型以哪一级思考程度说出了这一行”。

## 目标

- `channel:<name-or-id>` 发送到工作区频道。未加限定的目标默认使用 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接会话。
- `thread:<message_id>` 在以该消息为根消息的帖子中回复。

显式出站目标也可以带有 `clickclack:` 或 `cc:` 提供商前缀。

出站媒体使用 ClickClack 的上传 API，然后将持久化的上传内容附加到所创建的频道消息、帖子回复或私信。对于本地文件和受支持的远程媒体 URL，遵循 OpenClaw 的常规媒体访问策略，每个文件的大小上限为 64 MiB。持久化队列发送会为每个上传和消息部分使用各自按所有者划分的 nonce，然后使用相同对象重试附件关联。有关服务器契约和恢复行为，请参阅[持久化媒体投递](#durable-media-delivery)。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack API 会强制执行 ClickClack 令牌权限范围。

- `bot:read`：读取工作区、频道、消息、帖子、私信、实时和个人资料数据。
- `bot:write`：`bot:read`，以及频道消息、帖子回复、私信、上传和命令菜单发布。
- `bot:admin`：`bot:write`，以及创建频道。
- `commands:write`：发布机器人的命令菜单。包含在当前的 `bot:write` 和 `bot:admin` 权限包中，也可以单独授予。
- `agent_activity:write`：持久化智能体活动行（`agent_commentary` / `agent_tool`）。不会由 `bot:write` 或 `bot:admin` 继承；仅在设置了 `agentActivity: true` 时才需要。

对于普通智能体聊天和命令菜单同步，OpenClaw 只需要当前的 `bot:write`。启用[智能体活动行](#agent-activity-rows)时，请添加 `agent_activity:write`。

## 故障排查

- `ClickClack is not configured for account "<id>"`：为该账户设置 `baseUrl`、`token`（例如通过 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：将 `workspace` 设置为 ClickClack 返回的工作区 ID、slug 或名称。
- 没有入站回复：确认令牌具有实时读取权限，并注意机器人会忽略自己的消息以及其他机器人发送的消息。
- 频道发送失败：确认机器人是工作区成员并具有 `bot:write`。
- 没有命令菜单：确认 `commandMenu` 不是 `false`，ClickClack 服务器支持 `PUT /api/bots/self/commands`，并且令牌具有 `commands:write`。

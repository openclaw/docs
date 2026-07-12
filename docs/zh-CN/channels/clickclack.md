---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack Bot 身份
summary: ClickClack 机器人令牌渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-07-11T20:18:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 通过一等支持的 ClickClack Bot 令牌，将 OpenClaw 连接到自托管的 ClickClack 工作区。

当你希望 OpenClaw 智能体以 ClickClack Bot 用户身份出现时，请使用此功能。ClickClack 支持独立服务 Bot 和用户拥有的 Bot；用户拥有的 Bot 会保留 `owner_user_id`，并且只获得你授予的令牌权限范围。

## 快速设置

在 ClickClack 服务器上创建 Bot 令牌：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

对于用户拥有的 Bot，请添加 `--owner <user_id>`。

配置 OpenClaw：

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

然后运行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

只有同时设置 `baseUrl`、`token` 和 `workspace` 后，账号才视为已配置。`workspace` 接受工作区 ID（`wsp_...`）、短名称或名称；Gateway 网关会在启动时将其解析为 ID。

### 账号配置键

| 键                      | 默认值              | 说明                                                                                   |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 无（必填）          | ClickClack 服务器 URL。                                                                  |
| `token`                 | 无（必填）          | 纯字符串或密钥引用（`source: "env" \| "file" \| "exec"`）。                       |
| `workspace`             | 无（必填）          | 工作区 ID、短名称或名称。                                                            |
| `replyMode`             | `"agent"`           | `"agent"` 运行完整智能体流水线；`"model"` 发送简短的直接模型补全。 |
| `defaultTo`             | `"channel:general"` | 出站路径未提供目标时使用的目标。                                      |
| `allowFrom`             | `["*"]`             | 入站私信和频道消息的用户 ID 允许列表。                                 |
| `botUserId`             | 自动检测            | 启动时从 Bot 令牌身份解析。                                        |
| `agentId`               | 路由默认值          | 将此账号的入站消息固定发送给一个智能体。                                       |
| `toolsAllow`            | 无                  | 此账号的智能体回复可使用的工具允许列表。                                     |
| `model`, `systemPrompt` | 无                  | 用于 `replyMode: "model"` 补全。                                               |
| `reconnectMs`           | `1500`              | 实时连接的重连延迟（100 到 60000）。                                                |

如果 `plugins.allow` 是非空的限制性列表，在渠道设置中明确选择
ClickClack 或运行 `openclaw plugins enable clickclack`，都会将
`clickclack` 追加到该列表。新手引导安装采用相同的
明确选择行为。这些路径不会覆盖 `plugins.deny` 或全局
`plugins.enabled: false` 设置。直接运行
`openclaw plugins install @openclaw/clickclack` 会遵循常规的
插件安装策略，并且也会将 ClickClack 记录到现有的允许列表中。

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

- `replyMode: "agent"`（默认）通过常规智能体流水线分派入站消息，包括会话记录和工具策略。
- `replyMode: "model"` 跳过智能体流水线，并使用插件运行时的 `llm.complete` 生成简短的 Bot 直接回复（可通过 `model` 和 `systemPrompt` 调整）。

模型模式会针对解析后的 Bot 智能体 ID 运行补全，因此需要显式启用
`plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任
标志：

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

如果你只使用默认的 `agent` 回复模式，请保持此信任标志关闭；
该模式不需要此标志。

使用 `agent` 模式获取跨服务关联证据。对于采用规范
`msg_<ulid>` 格式的权威 ClickClack 消息 ID，渠道会派生出
确定性的 OpenClaw 运行 ID `clickclack:<message-id>`。随后，每次模型调用
都会在诊断中显示为 `clickclack:<message-id>:model:<n>`；当该
轮次使用 ClawRouter 时，同一个模型调用 ID 会作为 `X-Request-ID` 发送。
`model` 模式会绕过常规的智能体运行/会话诊断，因此
不适用于此证据路径。

当实时事件包含经过验证的 `payload.correlation_id` 时，
渠道会将其作为 `X-Correlation-ID` 附加到权威消息获取请求和
由此产生的 ClickClack 回复请求中。值使用 ClickClack 的安全
128 字符集（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；无效值
会被省略。这些关联仅包含标识符，绝不包含消息正文、
提示词、补全内容、凭据或工具输出。

## 智能体活动行

默认情况下，ClickClack 渠道在智能体轮次运行期间不会显示任何内容；只会显示最终回复。在账号上设置 `agentActivity: true`，即可在轮次进行期间发布持久化的 `agent_commentary` 和 `agent_tool` 消息行：

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
- **需要 `agent_activity:write` 令牌权限范围。** 此权限范围独立于 `bot:write`，且不会从中继承；启用该选项前，请使用 `--scopes bot:write,agent_activity:write` 创建 Bot 令牌（或向现有令牌授予该权限范围）。
- **尽力降级。** 如果令牌缺少 `agent_activity:write`，或服务器拒绝写入活动，则会记录失败日志，但最终回复仍会正常送达；不会显示活动行。
- 各行按轮次（`turn_id`）分组并合并，使一个逻辑步骤对应一行；工具行采用与 Discord、Slack 和 Telegram 相同的进度格式（工具名称加命令详情）。
- **归属元数据。** 智能体发布的内容（活动行和最终回复）会携带根据该轮次实际使用的模型解析出的 `author_model` 和 `author_thinking` 字段（包括发生回退后的模型）。未定义这些列的服务器会忽略未知的 JSON 字段；持久化这些字段的服务器则可以按消息回答“这行内容由哪个模型以何种思考级别生成”。

## 目标

- `channel:<name-or-id>` 发送到工作区频道。无前缀的目标默认使用 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接对话。
- `thread:<message_id>` 在以该消息为根的讨论串中回复。

显式出站目标也可以带有 `clickclack:` 或 `cc:` 提供商前缀。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack 令牌权限范围由 ClickClack API 强制执行。

- `bot:read`：读取工作区、频道、消息、讨论串、私信、实时连接和个人资料数据。
- `bot:write`：包含 `bot:read`，并可发送频道消息、讨论串回复和私信，以及上传文件。
- `bot:admin`：包含 `bot:write`，并可创建频道。
- `agent_activity:write`：持久化智能体活动行（`agent_commentary` / `agent_tool`）。不会从 `bot:write` 或 `bot:admin` 继承；仅在设置 `agentActivity: true` 时需要。

OpenClaw 的常规智能体聊天只需要 `bot:write`。启用[智能体活动行](#agent-activity-rows)时，请添加 `agent_activity:write`。

## 故障排查

- `ClickClack is not configured for account "<id>"`：为该账号设置 `baseUrl`、`token`（例如通过 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：将 `workspace` 设置为 ClickClack 返回的工作区 ID、短名称或名称。
- 没有入站回复：确认令牌拥有实时读取权限，并注意 Bot 会忽略自己发送的消息和其他 Bot 发送的消息。
- 频道发送失败：确认 Bot 是工作区成员，并拥有 `bot:write`。

---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack Bot 身份
summary: ClickClack 机器人令牌渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 通过一等支持的 ClickClack Bot 令牌，将 OpenClaw 连接到自托管的 ClickClack 工作区。

如果你希望 OpenClaw 智能体以 ClickClack Bot 用户身份出现，请使用此方式。ClickClack 支持独立服务 Bot 和用户所有的 Bot；用户所有的 Bot 会保留 `owner_user_id`，并且仅获得你授予的令牌权限范围。

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

对于用户所有的 Bot，请添加 `--owner <user_id>`。

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

仅当 `baseUrl`、`token` 和 `workspace` 均已设置时，账号才视为已配置。`workspace` 接受工作区 ID（`wsp_...`）、slug 或名称；Gateway 网关会在启动时将其解析为 ID。

### 账号配置键

| 键                      | 默认值              | 说明                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 无（必填）          | ClickClack 服务器 URL。                                                                 |
| `token`                 | 无（必填）          | 纯字符串或密钥引用（`source: "env" \| "file" \| "exec"`）。                            |
| `workspace`             | 无（必填）          | 工作区 ID、slug 或名称。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 运行完整的智能体流水线；`"model"` 发送简短的直接模型补全。                    |
| `defaultTo`             | `"channel:general"` | 出站路径未提供目标时使用的目标。                                                        |
| `allowFrom`             | `["*"]`             | 入站私信和频道消息的用户 ID 允许列表。                                                  |
| `botUserId`             | 自动检测            | 启动时从 Bot 令牌身份解析。                                                             |
| `agentId`               | 路由默认值          | 将此账号的入站消息固定到一个智能体。                                                    |
| `toolsAllow`            | 无                  | 此账号的智能体回复可使用的工具允许列表。                                                |
| `model`, `systemPrompt` | 无                  | 用于 `replyMode: "model"` 补全。                                                        |
| `reconnectMs`           | `1500`              | 实时连接重连延迟（100 到 60000）。                                                      |

如果 `plugins.allow` 是非空的限制性列表，在渠道设置中明确选择
ClickClack 或运行 `openclaw plugins enable clickclack` 时，
会将 `clickclack` 追加到该列表。新手引导安装采用相同的
明确选择行为。这些路径不会覆盖 `plugins.deny` 或
全局 `plugins.enabled: false` 设置。直接运行
`openclaw plugins install @openclaw/clickclack` 会遵循常规
插件安装策略，并且也会将 ClickClack 记录到现有允许列表中。

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
- `replyMode: "model"` 跳过智能体流水线，并使用插件运行时的 `llm.complete` 生成简短的直接 Bot 回复（可选择通过 `model` 和 `systemPrompt` 调整）。

模型模式会基于解析后的 Bot 智能体 ID 运行补全，因此需要显式设置
`plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任
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

如果你仅使用默认的 `agent` 回复模式，请保持该信任位关闭；
此模式不需要它。

如需跨服务关联证据，请使用 `agent` 模式。对于采用规范
`msg_<ulid>` 形式的权威 ClickClack 消息 ID，渠道会派生出
确定性的 OpenClaw 运行 ID `clickclack:<message-id>`。随后，每次模型调用
都会在诊断中显示为 `clickclack:<message-id>:model:<n>`；当该
轮次使用 ClawRouter 时，同一个模型调用 ID 会作为 `X-Request-ID` 发送。
`model` 模式会绕过常规的智能体运行/会话诊断，因此
不适用于此证据路径。

当实时事件包含经过验证的 `payload.correlation_id` 时，
渠道会在权威消息获取请求和由此产生的 ClickClack 回复请求中将其作为
`X-Correlation-ID` 携带。值使用 ClickClack 的安全
128 字符集（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；无效值
会被省略。这些关联仅包含标识符，绝不包含消息正文、
提示词、补全、凭据或工具输出。

## 智能体活动行

默认情况下，智能体轮次运行期间 ClickClack 渠道不会显示任何内容；只有最终回复会送达。在账号上设置 `agentActivity: true`，即可在轮次进行期间发布持久化的 `agent_commentary` 和 `agent_tool` 消息行：

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
- **需要 `agent_activity:write` 令牌权限范围。** 此权限范围与 `bot:write` 分离，且不会从中继承；启用该选项前，请使用 `--scopes bot:write,agent_activity:write` 创建 Bot 令牌（或向现有令牌授予该权限范围）。
- **尽力降级。** 如果令牌缺少 `agent_activity:write`，或服务器拒绝写入活动，系统会记录失败，最终回复仍会正常送达；不会出现活动行。
- 各行按轮次（`turn_id`）分组并合并，使一个逻辑步骤对应一行；工具行采用与 Discord/Slack/Telegram 相同的进度格式（工具名称加命令详情）。
- **归属元数据。** 智能体创作的帖子（活动行和最终回复）会携带根据该轮次实际使用的模型解析出的 `author_model` 和 `author_thinking` 字段（包括发生回退后）。未定义这些列的服务器会忽略未知的 JSON 字段；持久化这些字段的服务器则可以按消息回答“哪一个模型以哪一级思考级别说出了这一行”。

## 目标

- `channel:<name-or-id>` 发送到工作区频道。裸目标默认为 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接会话。
- `thread:<message_id>` 在以该消息为根的线程中回复。

显式出站目标也可以携带 `clickclack:` 或 `cc:` 提供商前缀。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack API 会强制执行 ClickClack 令牌权限范围。

- `bot:read`：读取工作区/频道/消息/线程/私信/实时数据/个人资料数据。
- `bot:write`：`bot:read`，以及频道消息、线程回复、私信和上传。
- `bot:admin`：`bot:write`，以及创建频道。
- `agent_activity:write`：持久化智能体活动行（`agent_commentary` / `agent_tool`）。不会从 `bot:write` 或 `bot:admin` 继承；仅在设置 `agentActivity: true` 时需要。

对于常规智能体聊天，OpenClaw 仅需要 `bot:write`。启用[智能体活动行](#agent-activity-rows)时，请添加 `agent_activity:write`。

## 故障排查

- `ClickClack is not configured for account "<id>"`：为该账号设置 `baseUrl`、`token`（例如通过 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：将 `workspace` 设置为 ClickClack 返回的工作区 ID、slug 或名称。
- 没有入站回复：确认令牌具有实时读取权限，并注意 Bot 会忽略自身消息和其他 Bot 的消息。
- 频道发送失败：确认 Bot 是工作区成员并具有 `bot:write`。

---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack Bot 身份
summary: ClickClack bot-token 渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T17:39:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 164f6ee2e41092adf26d753c835ca82b2eb730e1fa93e987f07b7346441dff09
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 通过一等 ClickClack 机器人令牌将 OpenClaw 连接到自托管的 ClickClack 工作区。

当你希望 OpenClaw 智能体显示为 ClickClack 机器人用户时使用此功能。ClickClack 支持独立服务机器人和用户拥有的机器人；用户拥有的机器人会保留 `owner_user_id`，并且只接收你授予的令牌权限范围。

## 快速设置

在 ClickClack 服务器上创建机器人令牌：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

对于用户拥有的机器人，添加 `--owner <user_id>`。

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

只有当 `baseUrl`、`token` 和 `workspace` 全部设置后，账户才会被视为已配置。`workspace` 接受工作区 ID（`wsp_...`）、slug 或名称；Gateway 网关会在启动时将其解析为 ID。

### 账户配置键

| 键                      | 默认值              | 说明                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 无（必需）          | ClickClack 服务器 URL。                                                                 |
| `token`                 | 无（必需）          | 纯字符串或密钥引用（`source: "env" \| "file" \| "exec"`）。                             |
| `workspace`             | 无（必需）          | 工作区 ID、slug 或名称。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 运行完整智能体流水线；`"model"` 发送简短的直接模型补全。                      |
| `defaultTo`             | `"channel:general"` | 当出站路径未提供目标时使用的目标。                                                      |
| `allowFrom`             | `["*"]`             | 入站私信和渠道消息的用户 ID 允许列表。                                                  |
| `botUserId`             | 自动检测            | 启动时从机器人令牌身份解析。                                                           |
| `agentId`               | 路由默认值          | 将此账户的入站消息固定到一个智能体。                                                    |
| `toolsAllow`            | 无                  | 来自此账户的智能体回复的工具允许列表。                                                  |
| `model`, `systemPrompt` | 无                  | 由 `replyMode: "model"` 补全使用。                                                      |
| `reconnectMs`           | `1500`              | 实时重连延迟（100 到 60000）。                                                          |

如果 `plugins.allow` 是非空的限制性列表，在渠道设置中显式选择 ClickClack，或运行 `openclaw plugins enable clickclack`，会将 `clickclack` 追加到该列表。新手引导安装使用相同的显式选择行为。这些路径不会覆盖 `plugins.deny` 或全局 `plugins.enabled: false` 设置。直接运行 `openclaw plugins install @openclaw/clickclack` 会遵循常规插件安装策略，并且也会在现有允许列表中记录 ClickClack。

## 多机器人

每个账户都会打开自己的 ClickClack 实时连接，并使用自己的机器人令牌。

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

- `replyMode: "agent"`（默认）通过普通智能体流水线分发入站消息，包括会话记录和工具策略。
- `replyMode: "model"` 跳过智能体流水线，并使用插件运行时的 `llm.complete` 生成简短的直接机器人回复（可选地由 `model` 和 `systemPrompt` 塑形）。

模型模式会针对解析后的机器人智能体 ID 运行补全，这需要显式的 `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任位：

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

如果你只使用默认的 `agent` 回复模式，请保持信任位关闭；该模式不需要它。

## 智能体活动行

默认情况下，ClickClack 渠道在智能体轮次运行期间不显示任何内容；只会落地最终回复。在账户上设置 `agentActivity: true`，可在轮次进行期间发布持久的 `agent_commentary` 和 `agent_tool` 消息行：

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

- **默认关闭。** 标准设置和较旧的 ClickClack 服务器不受影响。
- **需要 `agent_activity:write` 令牌权限范围。** 此权限范围独立于 `bot:write`，且不会由其继承；启用该选项前，请使用 `--scopes bot:write,agent_activity:write` 创建机器人令牌（或向现有令牌授予该权限范围）。
- **尽力降级。** 如果令牌缺少 `agent_activity:write`，或服务器拒绝活动写入，失败会被记录到日志，最终回复仍会正常送达；不会出现活动行。
- 行会按轮次（`turn_id`）分组，并进行合并，使一个逻辑步骤对应一行；工具行使用与 Discord/Slack/Telegram 相同的进度格式（工具名称加命令详情）。
- **归因元数据。** 智能体撰写的帖子（活动行和最终回复）会携带 `author_model` 和 `author_thinking` 字段，这些字段从该轮次实际使用的模型解析而来（包括回退之后）。未定义这些列的服务器会忽略未知 JSON 字段；持久化这些字段的服务器可以按消息回答“是哪一个模型以哪种思考级别说了这一行”。

## 目标

- `channel:<name-or-id>` 发送到工作区渠道。裸目标默认使用 `channel:`。
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

ClickClack 令牌权限范围由 ClickClack API 强制执行。

- `bot:read`：读取工作区/渠道/消息/线程/私信/实时/个人资料数据。
- `bot:write`：`bot:read` 加渠道消息、线程回复、私信和上传。
- `bot:admin`：`bot:write` 加渠道创建。
- `agent_activity:write`：持久智能体活动行（`agent_commentary` / `agent_tool`）。不会由 `bot:write` 或 `bot:admin` 继承；仅在设置 `agentActivity: true` 时需要。

OpenClaw 在普通智能体聊天中只需要 `bot:write`。启用[智能体活动行](#agent-activity-rows)时添加 `agent_activity:write`。

## 故障排查

- `ClickClack is not configured for account "<id>"`：为该账户设置 `baseUrl`、`token`（例如通过 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：将 `workspace` 设置为 ClickClack 返回的工作区 ID、slug 或名称。
- 没有入站回复：确认令牌拥有实时读取访问权限，并注意机器人会忽略自己的消息以及来自其他机器人的消息。
- 渠道发送失败：验证机器人是该工作区的成员，并且拥有 `bot:write`。

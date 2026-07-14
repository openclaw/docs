---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack Bot 身份
summary: ClickClack Bot 令牌渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-07-14T13:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 76068c71c0d6cdb5153e74d69ec1a01a75f1bc6a5bcba636f5e41a1293c20139
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 通过一等支持的 ClickClack Bot Token，将 OpenClaw 连接到自托管的 ClickClack 工作区。

如果你希望 OpenClaw 智能体以 ClickClack Bot 用户的身份出现，请使用此方式。ClickClack 支持独立服务 Bot 和用户所有的 Bot；用户所有的 Bot 会保留 `owner_user_id`，且仅获得你授予的 Token 权限范围。

## 快速设置

在 ClickClack 服务器上创建 Bot Token：

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

仅当 `baseUrl`、`token` 和 `workspace` 均已设置时，账户才视为已配置。`workspace` 接受工作区 ID（`wsp_...`）、slug 或名称；Gateway 网关会在启动时将其解析为 ID。

### 账户配置键

| 键                      | 默认值              | 说明                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 无（必填）          | ClickClack 服务器 URL。                                                                 |
| `token`                 | 无（必填）          | 纯字符串或 Secret 引用（`source: "env" \| "file" \| "exec"`）。                         |
| `workspace`             | 无（必填）          | 工作区 ID、slug 或名称。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 运行完整的智能体流水线；`"model"` 发送简短的直接模型补全。 |
| `defaultTo`             | `"channel:general"` | 出站路径未提供目标时使用的目标。                                                        |
| `allowFrom`             | `["*"]`             | 入站私信和频道消息的用户 ID 允许列表。                                                  |
| `botUserId`             | 自动检测            | 启动时根据 Bot Token 身份解析。                                                         |
| `agentId`               | 路由默认值          | 将此账户的入站消息固定到一个智能体。                                                    |
| `toolsAllow`            | 无                  | 此账户的智能体回复可使用的工具允许列表。                                                |
| `model`, `systemPrompt` | 无                  | 供 `replyMode: "model"` 补全使用。                                                     |
| `reconnectMs`           | `1500`              | 实时重新连接延迟（100 到 60000）。                                                      |

如果 `plugins.allow` 是非空的限制性列表，在渠道设置中明确选择
ClickClack 或运行 `openclaw plugins enable clickclack` 时，会将
`clickclack` 追加到该列表。新手引导安装采用相同的
明确选择行为。这些路径不会覆盖 `plugins.deny` 或
全局 `plugins.enabled: false` 设置。直接运行
`openclaw plugins install @openclaw/clickclack` 会遵循常规
插件安装策略，并将 ClickClack 记录到现有允许列表中。

## 多个 Bot

每个账户都会建立自己的 ClickClack 实时连接，并使用各自的 Bot Token。

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
- `replyMode: "model"` 跳过智能体流水线，并使用插件运行时的 `llm.complete` 直接生成 Bot 回复，可选择通过 `model` 和 `systemPrompt` 调整其形式。补全预算由所选提供商和模型决定。

模型模式会针对解析出的 Bot 智能体 ID 运行补全，因此需要显式启用
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

如果仅使用默认的 `agent` 回复模式，请保持信任位关闭；该模式
不需要此信任位。

使用 `agent` 模式获取跨服务关联证据。对于采用规范 `msg_<ulid>` 形式的权威
ClickClack 消息 ID，该渠道会派生
确定性的 OpenClaw 运行 ID `clickclack:<message-id>`。随后，每次模型调用
都会在诊断中显示为 `clickclack:<message-id>:model:<n>`；当该
轮次使用 ClawRouter 时，相同的模型调用 ID 会作为 `X-Request-ID` 发送。
`model` 模式会绕过常规智能体运行/会话诊断，因此
不适用于此证据路径。

当实时事件包含经过验证的 `payload.correlation_id` 时，
渠道会在权威消息获取和
随后产生的 ClickClack 回复请求中将其作为 `X-Correlation-ID` 传递。
值使用 ClickClack 的安全
128 字符集（`A-Z`、`a-z`、`0-9`、`.`、`_`、`:` 和 `-`）；无效值
会被省略。这些关联仅包含标识符，绝不包含消息正文、
提示词、补全、凭据或工具输出。

## 持久化媒体投递

包含媒体的智能体回复必须使用持久化投递。OpenClaw 会在首次写入 ClickClack 前，
为每个部分的消息和上传分配稳定的 nonce，因此
重试会复用同一上传和消息，而不会消耗额外存储配额
或发布重复内容。如果重启后上传已存在，
OpenClaw 不会重新读取原始本地路径或远程媒体 URL。

此恢复契约要求 ClickClack 服务器支持：

- `GET /api/uploads/by-nonce`，并在
  找到和未找到的结果中包含 `X-ClickClack-Upload-Nonce: supported`。
- `GET /api/messages/by-nonce`，并在
  找到和未找到的结果中包含 `X-ClickClack-Message-Nonce: supported`。
- 对于相同的所有者作用域 nonce 和上传，消息创建和附件关联具有幂等性。

旧版服务器返回的通用 404 不会被视为发送不存在的证明。
OpenClaw 会将投递保留为未解决状态，而不是冒险产生重复内容；请在
启用会生成媒体的智能体回复前更新 ClickClack。

## 智能体活动行

默认情况下，智能体轮次运行期间 ClickClack 渠道不会显示任何内容；只会显示最终回复。在账户上设置 `agentActivity: true`，可在轮次进行期间发布持久化的 `agent_commentary` 和 `agent_tool` 消息行：

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

- **默认关闭。**标准设置和旧版 ClickClack 服务器不受影响。
- **需要 `agent_activity:write` Token 权限范围。**此权限范围独立于 `bot:write`，且不会由其继承；启用此选项前，请使用 `--scopes bot:write,agent_activity:write` 创建 Bot Token（或向现有 Token 授予该权限范围）。
- **尽力降级。**如果 Token 缺少 `agent_activity:write` 或服务器拒绝活动写入，系统会记录失败，最终回复仍会正常投递；不会显示活动行。
- 行按轮次（`turn_id`）分组并合并，使一个逻辑步骤对应一行；工具行使用与 Discord/Slack/Telegram 相同的进度格式（工具名称加命令详情）。
- **归属元数据。**智能体发布的内容（活动行和最终回复）会包含根据该轮次实际使用的模型（包括回退后使用的模型）解析出的 `author_model` 和 `author_thinking` 字段。未定义这些列的服务器会忽略未知的 JSON 字段；持久化这些字段的服务器可以针对每条消息回答“哪一个模型以何种思考级别说出了这行内容”。

## 目标

- `channel:<name-or-id>` 发送到工作区频道。裸目标默认为 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接对话。
- `thread:<message_id>` 在以该消息为根的线程中回复。

显式出站目标也可以带有 `clickclack:` 或 `cc:` 提供商前缀。

出站媒体使用 ClickClack 的上传 API，然后将持久化上传
附加到创建的频道消息、线程回复或私信。OpenClaw 的常规媒体访问策略
适用于本地文件和受支持的远程媒体 URL，每个文件的上限为 64 MiB。
持久化排队发送会为每个上传和消息部分使用独立的所有者作用域 nonce，
然后使用这些相同对象重试附件关联。有关服务器
契约和恢复行为，请参阅[持久化媒体投递](#durable-media-delivery)。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "你好"
openclaw message send --channel clickclack --target dm:usr_123 --message "你好"
openclaw message send --channel clickclack --target thread:msg_123 --message "继续跟进"
```

## 权限

ClickClack API 会强制执行 ClickClack Token 权限范围。

- `bot:read`：读取工作区/频道/消息/线程/私信/实时/个人资料数据。
- `bot:write`：`bot:read` 加上频道消息、线程回复、私信和上传。
- `bot:admin`：`bot:write` 加上频道创建。
- `agent_activity:write`：持久化智能体活动行（`agent_commentary` / `agent_tool`）。不会由 `bot:write` 或 `bot:admin` 继承；仅在设置 `agentActivity: true` 时需要。

对于常规智能体聊天，OpenClaw 只需要 `bot:write`。启用[智能体活动行](#agent-activity-rows)时，请添加 `agent_activity:write`。

## 故障排查

- `ClickClack is not configured for account "<id>"`：为该账户设置 `baseUrl`、`token`（例如通过 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：将 `workspace` 设置为 ClickClack 返回的工作区 ID、slug 或名称。
- 没有入站回复：确认 Token 具有实时读取权限，并注意 Bot 会忽略自身消息和其他 Bot 的消息。
- 频道发送失败：验证 Bot 是否为工作区成员并具有 `bot:write`。

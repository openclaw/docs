---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack bot 身份
summary: ClickClack bot-token 渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-07-05T11:01:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f268ab4ec96226a890aa1be7ccd1f05c9c92656aa5347864b1c74026dea9098
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 将 OpenClaw 通过一等支持的 ClickClack bot token 连接到自托管的 ClickClack 工作区。

当你希望 OpenClaw 智能体以 ClickClack bot 用户身份出现时使用此功能。ClickClack 支持独立服务 bot 和用户拥有的 bot；用户拥有的 bot 会保留 `owner_user_id`，并且只获得你授予的 token 权限范围。

## 快速设置

在 ClickClack 服务器上创建 bot token：

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

对于用户拥有的 bot，添加 `--owner <user_id>`。

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

只有同时设置了 `baseUrl`、`token` 和 `workspace`，账号才算已配置。`workspace` 接受工作区 id（`wsp_...`）、slug 或名称；Gateway 网关会在启动时将其解析为 id。

### 账号配置键

| 键                      | 默认值              | 说明                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 无（必填）          | ClickClack 服务器 URL。                                                                 |
| `token`                 | 无（必填）          | 明文字符串或 secret 引用（`source: "env" \| "file" \| "exec"`）。                       |
| `workspace`             | 无（必填）          | 工作区 id、slug 或名称。                                                                |
| `replyMode`             | `"agent"`           | `"agent"` 运行完整智能体流水线；`"model"` 发送简短的直接模型补全。                     |
| `defaultTo`             | `"channel:general"` | 出站路径未提供目标时使用的目标。                                                        |
| `allowFrom`             | `["*"]`             | 入站私信和频道消息的用户 id 允许列表。                                                  |
| `botUserId`             | 自动检测            | 启动时从 bot token 身份解析。                                                           |
| `agentId`               | 路由默认值          | 将此账号的入站消息固定到一个智能体。                                                    |
| `toolsAllow`            | 无                  | 来自此账号的智能体回复的工具允许列表。                                                  |
| `model`, `systemPrompt` | 无                  | 供 `replyMode: "model"` 补全使用。                                                       |
| `reconnectMs`           | `1500`              | 实时重连延迟（100 到 60000）。                                                          |

如果 `plugins.allow` 是非空的限制列表，则在频道设置中显式选择 ClickClack，或运行 `openclaw plugins enable clickclack`，都会将 `clickclack` 追加到该列表。新手引导安装使用相同的显式选择行为。这些路径不会覆盖 `plugins.deny` 或全局 `plugins.enabled: false` 设置。直接运行 `openclaw plugins install @openclaw/clickclack` 会遵循常规插件安装策略，并且也会在已有允许列表中记录 ClickClack。

## 多个 bot

每个账号都会打开自己的 ClickClack 实时连接，并使用自己的 bot token。

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
- `replyMode: "model"` 跳过智能体流水线，并使用插件运行时的 `llm.complete` 生成简短的直接 bot 回复（可选地由 `model` 和 `systemPrompt` 调整）。

模型模式会针对解析后的 bot 智能体 id 运行补全，这需要显式的 `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 信任位：

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

如果你只使用默认的 `agent` 回复模式，请保持该信任位关闭；在这种情况下不需要它。

## 目标

- `channel:<name-or-id>` 发送到工作区频道。裸目标默认使用 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接对话。
- `thread:<message_id>` 在以该消息为根的线程中回复。

显式出站目标也可以携带 `clickclack:` 或 `cc:` 提供商前缀。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack token 权限范围由 ClickClack API 强制执行。

- `bot:read`：读取工作区、频道、消息、线程、私信、实时和资料数据。
- `bot:write`：`bot:read` 加上频道消息、线程回复、私信和上传。
- `bot:admin`：`bot:write` 加上频道创建。

OpenClaw 的常规智能体聊天只需要 `bot:write`。

## 故障排查

- `ClickClack is not configured for account "<id>"`：为该账号设置 `baseUrl`、`token`（例如通过 `CLICKCLACK_BOT_TOKEN`）和 `workspace`。
- `ClickClack workspace not found: <value>`：将 `workspace` 设置为 ClickClack 返回的工作区 id、slug 或名称。
- 没有入站回复：确认 token 拥有实时读取权限，并注意 bot 会忽略自己的消息以及来自其他 bot 的消息。
- 频道发送失败：确认 bot 是工作区成员，并且拥有 `bot:write`。

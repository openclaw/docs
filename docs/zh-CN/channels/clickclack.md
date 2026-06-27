---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack 机器人身份
summary: ClickClack bot-token 渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T01:19:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 将 OpenClaw 通过一等 ClickClack 机器人令牌连接到自托管的 ClickClack 工作区。

当你希望 OpenClaw 智能体以 ClickClack 机器人用户身份出现时，请使用此配置。ClickClack 支持独立服务机器人和用户拥有的机器人；用户拥有的机器人会保留 `owner_user_id`，并且只获得你授予的令牌作用域。

## 快速设置

在 ClickClack 中创建机器人令牌：

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

对于用户拥有的机器人，添加 `--owner <user_id>`。

配置 OpenClaw：

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

然后运行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

如果 `plugins.allow` 是非空的限制性列表，在频道设置中明确选择 ClickClack，或运行 `openclaw plugins enable clickclack`，会将 `clickclack` 追加到该列表。新手引导安装使用相同的明确选择行为。这些路径不会覆盖 `plugins.deny` 或全局 `plugins.enabled: false` 设置。直接运行 `openclaw plugins install @openclaw/clickclack` 会遵循常规插件安装策略，并且也会在现有允许列表中记录 ClickClack。

## 多个机器人

每个账号都会打开自己的 ClickClack 实时连接，并使用自己的机器人令牌。

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` 会直接使用 `api.runtime.llm.complete` 生成简短的机器人回复。当账号设置了 `agentId` 时，OpenClaw 要求显式启用 `plugins.entries.clickclack.llm.allowAgentIdOverride` 信任位，这样插件才能为该机器人智能体运行补全。如果你只使用默认智能体路由，请保持关闭。

## 目标

- `channel:<name-or-id>` 发送到工作区频道。裸目标默认使用 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接对话。
- `thread:<message_id>` 在现有会话串中回复。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack API 会强制执行 ClickClack 令牌作用域。

- `bot:read`：读取工作区、频道、消息、会话串、私信、实时和个人资料数据。
- `bot:write`：包含 `bot:read`，以及频道消息、会话串回复、私信和上传。
- `bot:admin`：包含 `bot:write`，以及频道创建。

OpenClaw 的常规智能体聊天只需要 `bot:write`。

## 故障排除

- `ClickClack is not configured`：设置 `channels.clickclack.token` 或 `CLICKCLACK_BOT_TOKEN`。
- `workspace not found`：将 `workspace` 设置为 ClickClack 返回的工作区 ID 或 slug。
- 没有入站回复：确认令牌具有实时读取访问权限，并且机器人没有回复自己的消息。
- 频道发送失败：验证机器人是工作区成员，并且具有 `bot:write`。

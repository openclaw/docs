---
read_when:
    - 将 OpenClaw 连接到 ClickClack 工作区
    - 测试 ClickClack 机器人身份
summary: ClickClack bot-token 渠道设置和目标语法
title: ClickClack
x-i18n:
    generated_at: "2026-05-10T19:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack 通过一等 ClickClack 机器人令牌，将 OpenClaw 连接到自托管的 ClickClack 工作区。

当你希望 OpenClaw 智能体显示为 ClickClack 机器人用户时，请使用此功能。ClickClack 支持独立服务机器人和用户拥有的机器人；用户拥有的机器人会保留 `owner_user_id`，并且只接收你授予的令牌作用域。

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

`replyMode: "model"` 会直接使用 `api.runtime.llm.complete` 来生成简短的机器人回复。
当账号设置 `agentId` 时，OpenClaw 要求显式设置
`plugins.entries.clickclack.llm.allowAgentIdOverride` 信任位，以便插件
可以为该机器人智能体运行补全。如果你只使用默认
智能体路由，请保持关闭。

## 目标

- `channel:<name-or-id>` 发送到工作区渠道。裸目标默认使用 `channel:`。
- `dm:<user_id>` 创建或复用与该用户的直接对话。
- `thread:<message_id>` 在现有线程中回复。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack 令牌作用域由 ClickClack API 强制执行。

- `bot:read`：读取工作区/渠道/消息/线程/私信/实时/个人资料数据。
- `bot:write`：`bot:read` 加上渠道消息、线程回复、私信和上传。
- `bot:admin`：`bot:write` 加上创建渠道。

OpenClaw 的正常智能体聊天只需要 `bot:write`。

## 故障排除

- `ClickClack is not configured`：设置 `channels.clickclack.token` 或 `CLICKCLACK_BOT_TOKEN`。
- `workspace not found`：将 `workspace` 设置为 ClickClack 返回的工作区 ID 或 slug。
- 没有入站回复：确认令牌具有实时读取访问权限，并且机器人没有回复自己的消息。
- 渠道发送失败：确认机器人是工作区成员，并且具有 `bot:write`。

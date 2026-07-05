---
read_when:
    - 你想将 OpenClaw 连接到 IRC 频道或私信
    - 你正在配置 IRC 允许列表、群组策略或提及门控
summary: IRC 插件设置、访问控制和故障排查
title: IRC
x-i18n:
    generated_at: "2026-07-05T11:01:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

当你希望在经典频道（`#room`）和私信中使用 OpenClaw 时，请使用 IRC。
安装官方 IRC 插件，然后在 `channels.irc` 下配置它。

## 快速开始

1. 安装插件：

```bash
openclaw plugins install @openclaw/irc
```

2. 在 `~/.openclaw/openclaw.json` 中至少设置 host、nick 和要加入的频道：

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. 启动/重启 Gateway 网关：

```bash
openclaw gateway run
```

建议使用私有 IRC 服务器进行 bot 协调。如果你有意使用公共 IRC 网络，常见选择包括 Libera.Chat、OFTC 和 Snoonet。避免将可预测的公共频道用于 bot 或群集后通道流量。

## 连接设置

| 键                            | 默认值                         | 说明                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | 无（必填）                     | IRC 服务器主机名                                           |
| `port`                        | 启用 TLS 时为 `6697`，明文为 `6667` | 1-65535                                                     |
| `tls`                         | `true`                        | 仅在有意使用明文时设置为 `false`                           |
| `nick`                        | 无（必填）                     | Bot 昵称                                                   |
| `username`                    | nick，否则为 `openclaw`        | IRC 用户名                                                 |
| `realname`                    | `OpenClaw`                    | Realname/GECOS 字段                                        |
| `password` / `passwordFile`   | 无                            | 服务器密码；文件必须是常规文件                             |
| `channels`                    | 无                            | 要加入的频道（`["#openclaw"]`）                            |
| `accounts` / `defaultAccount` | 无                            | 多账号设置；环境变量只填充默认账号                         |

## 安全默认值

- IRC 使用 OpenClaw 操作员管理的转发代理路由之外的原始 TCP/TLS 套接字。在要求所有出站流量都通过该转发代理的部署中，除非明确批准直接 IRC 出站，否则请设置 `channels.irc.enabled=false`。
- `channels.irc.dmPolicy` 默认为 `"pairing"`：未知私信发送者会收到一个配对码，你可用 `openclaw pairing approve irc <code>` 批准。
- `channels.irc.groupPolicy` 默认为 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 时，请设置 `channels.irc.groups` 来定义允许的频道。
- 除非你有意接受明文传输，否则请使用 TLS（`channels.irc.tls=true`）。

## 访问控制

IRC 频道有两个独立的“门”：

1. **频道访问**（`groupPolicy` + `groups`）：bot 是否完全接受来自某个频道的消息。
2. **发送者访问**（`groupAllowFrom` / 按频道的 `groups["#channel"].allowFrom`）：谁被允许在该频道中触发 bot。

配置键：

- 私信允许列表（私信发送者访问）：`channels.irc.allowFrom`
- 群组发送者允许列表（频道发送者访问）：`channels.irc.groupAllowFrom`
- 按频道控制（频道 + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`，包含 `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills` 和 `systemPrompt`
- `channels.irc.groupPolicy="open"` 允许未配置的频道（**默认仍受提及门控限制**）

允许列表条目应使用稳定的发送者身份（`nick!user@host`）。
裸昵称匹配是可变的，并且仅在 `channels.irc.dangerouslyAllowNameMatching: true` 时启用。

### 常见陷阱：`allowFrom` 用于私信，而不是频道

如果你看到如下日志：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这表示该发送者未被允许发送**群组/频道**消息。可通过以下任一方式修复：

- 设置 `channels.irc.groupAllowFrom`（对所有频道全局生效），或
- 设置按频道的发送者允许列表：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#openclaw` 中的任何人与 bot 对话）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回复触发（提及）

即使某个频道已被允许（通过 `groupPolicy` + `groups`）且发送者也被允许，OpenClaw 在群组上下文中默认仍使用**提及门控**。当消息包含已连接的 bot 昵称，或匹配你配置的提及模式时，bot 会计为被提及。

这意味着你可能会看到类似 `drop channel … (missing-mention)` 的日志，除非消息包含与 bot 匹配的提及模式。

要让 bot 在 IRC 频道中**无需提及即可回复**，请为该频道禁用提及门控：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或者，允许**所有** IRC 频道（无按频道允许列表），并且仍无需提及即可回复：

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## 安全说明（推荐用于公共频道）

如果你在公共频道中允许 `allowFrom: ["*"]`，任何人都可以向 bot 发送提示。
为降低风险，请限制该频道的工具。

### 频道中所有人使用相同工具

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 按发送者使用不同工具（owner 获得更多权限）

使用 `toolsBySender` 对 `"*"` 应用更严格的策略，并对你的昵称应用更宽松的策略：

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

说明：

- `toolsBySender` 键应使用显式前缀（`channel:`、`id:`、`e164:`、`username:`、`name:`）。对于 IRC，请将 `id:` 与发送者身份值一起使用：`id:alice`，或使用 `id:alice!~alice@203.0.113.7` 进行更强匹配。
- 旧版无前缀键仍被接受，仅按 `id:` 匹配，并会发出弃用警告。
- 第一个匹配的发送者策略生效；`"*"` 是通配符回退。

有关群组访问与提及门控（以及它们如何交互）的更多信息，请参见：[/channels/groups](/zh-CN/channels/groups)。

## NickServ

要在连接后向 NickServ 识别身份：

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

默认情况下，只要设置了密码，就会运行 NickServ 身份识别（只有要选择退出时才需要将 `enabled` 设为 `false`）。`service` 默认为 `NickServ`；`passwordFile` 是内联 `password` 的替代方案。

连接时可选的一次性注册（`register: true` 需要 `registerEmail`）：

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

昵称注册完成后，请禁用 `register`，以避免重复尝试 REGISTER。

## 环境变量

默认账号支持：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（逗号分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

不能从工作区 `.env` 设置 `IRC_HOST`；请参见 [工作区 `.env` 文件](/zh-CN/gateway/security)。

## 故障排查

- 如果 bot 已连接但从不在频道中回复，请验证 `channels.irc.groups`，并检查提及门控是否正在丢弃消息（`missing-mention`）。如果你希望它无需被提及即可回复，请为该频道设置 `requireMention:false`。
- 如果登录失败，请验证昵称可用性和服务器密码。
- 如果 TLS 在自定义网络上失败，请验证主机/端口和证书设置。

## 相关

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

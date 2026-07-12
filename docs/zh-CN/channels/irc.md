---
read_when:
    - 你想将 OpenClaw 连接到 IRC 渠道或私信
    - 你正在配置 IRC 允许列表、群组策略或提及门控
summary: IRC 插件设置、访问控制和故障排查
title: IRC
x-i18n:
    generated_at: "2026-07-11T20:19:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

当你希望在经典频道（`#room`）和私信中使用 OpenClaw 时，请使用 IRC。
安装官方 IRC 插件，然后在 `channels.irc` 下进行配置。

## 快速开始

1. 安装插件：

```bash
openclaw plugins install @openclaw/irc
```

2. 至少在 `~/.openclaw/openclaw.json` 中设置主机、昵称和要加入的频道：

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

3. 启动或重启 Gateway 网关：

```bash
openclaw gateway run
```

建议使用私有 IRC 服务器进行 Bot 协作。如果你有意使用公共 IRC 网络，常见选择包括 Libera.Chat、OFTC 和 Snoonet。请避免使用容易猜到的公共频道传输 Bot 或集群的后台通信流量。

## 连接设置

| 键                            | 默认值                        | 说明                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | 无（必填）                    | IRC 服务器主机名                                            |
| `port`                        | TLS 使用 `6697`，明文使用 `6667` | 1-65535                                                     |
| `tls`                         | `true`                        | 仅在有意使用明文连接时设为 `false`                          |
| `nick`                        | 无（必填）                    | Bot 昵称                                                    |
| `username`                    | 昵称，否则为 `openclaw`       | IRC 用户名                                                  |
| `realname`                    | `OpenClaw`                    | 真实姓名/GECOS 字段                                         |
| `password` / `passwordFile`   | 无                            | 服务器密码；文件必须是常规文件                              |
| `channels`                    | 无                            | 要加入的频道（`["#openclaw"]`）                             |
| `accounts` / `defaultAccount` | 无                            | 多账号设置；环境变量仅填充默认账号                          |

## 安全默认设置

- IRC 使用 OpenClaw 操作员管理的正向代理路由之外的原始 TCP/TLS 套接字。在要求所有出站流量都通过该正向代理的部署中，除非明确批准直接访问 IRC，否则请设置 `channels.irc.enabled=false`。
- `channels.irc.dmPolicy` 默认为 `"pairing"`：未知的私信发送者会收到配对码，你可以使用 `openclaw pairing approve irc <code>` 批准该配对码。
- `channels.irc.groupPolicy` 默认为 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 时，请设置 `channels.irc.groups` 以定义允许的频道。
- 除非你有意接受明文传输，否则请使用 TLS（`channels.irc.tls=true`）。

## 访问控制

IRC 频道有两个相互独立的“关卡”：

1. **频道访问权限**（`groupPolicy` + `groups`）：Bot 是否完全接受来自某个频道的消息。
2. **发送者访问权限**（`groupAllowFrom` / 每频道的 `groups["#channel"].allowFrom`）：允许谁在该频道内触发 Bot。

配置键：

- 私信允许列表（私信发送者访问权限）：`channels.irc.allowFrom`
- 群组发送者允许列表（频道发送者访问权限）：`channels.irc.groupAllowFrom`
- 每频道控制项（频道、发送者和提及规则）：`channels.irc.groups["#channel"]`，包含 `requireMention`、`allowFrom`、`enabled`、`tools`、`toolsBySender`、`skills` 和 `systemPrompt`
- `channels.irc.groupPolicy="open"` 允许未配置的频道（**默认情况下仍需提及 Bot**）

允许列表条目应使用稳定的发送者身份（`nick!user@host`）。
仅昵称匹配可能发生变化，只有在设置 `channels.irc.dangerouslyAllowNameMatching: true` 时才会启用。

### 常见误区：`allowFrom` 用于私信，而非频道

如果你看到类似以下日志：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这表示该发送者无权发送**群组/频道**消息。可通过以下任一方式修复：

- 设置 `channels.irc.groupAllowFrom`（全局应用于所有频道），或
- 设置每频道发送者允许列表：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#openclaw` 中的任何人与 Bot 对话）：

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

即使频道已获允许（通过 `groupPolicy` + `groups`），且发送者也已获允许，OpenClaw 在群组场景中默认仍使用**提及限制**。当消息包含已连接 Bot 的昵称或匹配你配置的提及模式时，就视为已提及 Bot。

这意味着，除非消息包含与 Bot 匹配的提及模式，否则你可能会看到类似 `drop channel … (missing-mention)` 的日志。

若要让 Bot 在 IRC 频道中**无需提及即可回复**，请为该频道禁用提及限制：

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

或者，允许**所有** IRC 频道（无需每频道允许列表），同时仍可在没有提及的情况下回复：

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

## 安全说明（建议用于公共频道）

如果你在公共频道中允许 `allowFrom: ["*"]`，任何人都可以向 Bot 发送提示词。
为降低风险，请限制该频道可用的工具。

### 频道中的所有人使用相同工具

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

### 每位发送者使用不同工具（所有者拥有更多权限）

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

- `toolsBySender` 键应使用明确的前缀（`channel:`、`id:`、`e164:`、`username:`、`name:`）。对于 IRC，请将 `id:` 与发送者身份值配合使用：`id:alice`；如需更严格的匹配，可使用 `id:alice!~alice@203.0.113.7`。
- 仍接受未加前缀的旧版键，但只会按 `id:` 进行匹配，并发出弃用警告。
- 第一个匹配的发送者策略生效；`"*"` 是通配符回退项。

有关群组访问权限与提及限制的更多信息（以及它们如何相互作用），请参阅：[/channels/groups](/zh-CN/channels/groups)。

## NickServ

若要在连接后通过 NickServ 进行身份识别：

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

只要设置了密码，默认就会执行 NickServ 身份识别（只有在选择退出时才需要将 `enabled` 设为 `false`）。`service` 默认为 `NickServ`；`passwordFile` 可替代内联的 `password`。

连接时可选择执行一次性注册（`register: true` 要求设置 `registerEmail`）：

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

昵称注册完成后，请禁用 `register`，以免重复尝试执行 REGISTER。

## 环境变量

默认账号支持：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（以逗号分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

不能从工作区 `.env` 设置 `IRC_HOST`；请参阅[工作区 `.env` 文件](/zh-CN/gateway/security)。

## 故障排查

- 如果 Bot 已连接但从不在频道中回复，请检查 `channels.irc.groups`，**并且**确认提及限制是否正在丢弃消息（`missing-mention`）。如果希望它无需点名即可回复，请为该频道设置 `requireMention:false`。
- 如果登录失败，请检查昵称是否可用以及服务器密码是否正确。
- 如果自定义网络上的 TLS 连接失败，请检查主机、端口和证书配置。

## 相关内容

- [渠道概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群聊行为和提及限制
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全性](/zh-CN/gateway/security) — 访问模型和安全强化

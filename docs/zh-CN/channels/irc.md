---
read_when:
    - 你想将 OpenClaw 连接到 IRC 频道或私信
    - 你正在配置 IRC 允许列表、组策略或提及门控
summary: IRC 插件设置、访问控制和故障排除
title: IRC
x-i18n:
    generated_at: "2026-06-27T01:23:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
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

2. 在 `~/.openclaw/openclaw.json` 中启用 IRC 配置。
3. 至少设置：

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

建议使用私有 IRC 服务器进行机器人协作。如果你有意使用公共 IRC 网络，常见选择包括 Libera.Chat、OFTC 和 Snoonet。避免将可预测的公共频道用于机器人或集群后台通信流量。

4. 启动/重启 Gateway 网关：

```bash
openclaw gateway run
```

## 安全默认值

- IRC 使用 OpenClaw 操作员管理的转发代理路由之外的原始 TCP/TLS 套接字。在要求所有出站流量都通过该转发代理的部署中，除非明确批准直接 IRC 出站，否则请设置 `channels.irc.enabled=false`。
- `channels.irc.dmPolicy` 默认值为 `"pairing"`。
- `channels.irc.groupPolicy` 默认值为 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 时，设置 `channels.irc.groups` 来定义允许的频道。
- 除非你有意接受明文传输，否则请使用 TLS（`channels.irc.tls=true`）。

## 访问控制

IRC 频道有两个独立的“门禁”：

1. **渠道访问**（`groupPolicy` + `groups`）：机器人是否接受某个频道中的消息。
2. **发送者访问**（`groupAllowFrom` / 每频道 `groups["#channel"].allowFrom`）：谁可以在该频道中触发机器人。

配置键：

- 私信允许列表（私信发送者访问）：`channels.irc.allowFrom`
- 群组发送者允许列表（频道发送者访问）：`channels.irc.groupAllowFrom`
- 每频道控制（频道 + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允许未配置的频道（**默认仍由提及门控**）

允许列表条目应使用稳定的发送者身份（`nick!user@host`）。
裸昵称匹配是可变的，并且仅在 `channels.irc.dangerouslyAllowNameMatching: true` 时启用。

### 常见坑：`allowFrom` 用于私信，不用于频道

如果你看到类似日志：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这表示该发送者未被允许发送**群组/频道**消息。可通过以下任一方式修复：

- 设置 `channels.irc.groupAllowFrom`（对所有频道全局生效），或
- 设置每频道发送者允许列表：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#tuirc-dev` 中的任何人与机器人对话）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回复触发（提及）

即使某个频道已被允许（通过 `groupPolicy` + `groups`），且发送者也被允许，OpenClaw 在群组上下文中默认仍会使用**提及门控**。

这意味着除非消息包含匹配机器人的提及模式，否则你可能会看到类似 `drop channel … (missing-mention)` 的日志。

要让机器人在 IRC 频道中回复且**不需要提及**，请对该频道禁用提及门控：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或者允许**所有** IRC 频道（不使用每频道允许列表），并且仍然无需提及即可回复：

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

如果你在公共频道中允许 `allowFrom: ["*"]`，任何人都可以提示机器人。
为降低风险，请限制该频道的工具。

### 频道中所有人使用相同工具

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

### 按发送者使用不同工具（所有者获得更多权限）

使用 `toolsBySender` 对 `"*"` 应用更严格的策略，并对你的昵称应用较宽松的策略：

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- `toolsBySender` 键应对 IRC 发送者身份值使用 `id:`：
  `id:eigen`，或使用 `id:eigen!~eigen@174.127.248.171` 进行更强匹配。
- 旧版无前缀键仍会被接受，并且仅按 `id:` 匹配。
- 第一个匹配的发送者策略生效；`"*"` 是通配回退。

有关群组访问与提及门控（以及它们如何交互）的更多信息，请参阅：[/channels/groups](/zh-CN/channels/groups)。

## NickServ

连接后向 NickServ 识别身份：

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

连接时可选的一次性注册：

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

默认账户支持：

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

`IRC_HOST` 不能从工作区 `.env` 设置；请参阅 [工作区 `.env` 文件](/zh-CN/gateway/security)。

## 故障排除

- 如果机器人已连接但从不在频道中回复，请验证 `channels.irc.groups`，以及提及门控是否正在丢弃消息（`missing-mention`）。如果你希望它无需 ping 即可回复，请为该频道设置 `requireMention:false`。
- 如果登录失败，请验证昵称可用性和服务器密码。
- 如果自定义网络上的 TLS 失败，请验证主机/端口和证书设置。

## 相关内容

- [Channels 概览](/zh-CN/channels) — 所有支持的渠道
- [配对](/zh-CN/channels/pairing) — 私信身份验证和配对流程
- [群组](/zh-CN/channels/groups) — 群组聊天行为和提及门控
- [频道路由](/zh-CN/channels/channel-routing) — 消息的会话路由
- [安全](/zh-CN/gateway/security) — 访问模型和加固

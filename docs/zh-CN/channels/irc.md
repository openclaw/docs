---
read_when:
    - 你想将 OpenClaw 连接到 IRC 渠道或私信
    - 你正在配置 IRC allowlist、群组策略或提及门控
summary: IRC 插件设置、访问控制和故障排除
title: IRC
x-i18n:
    generated_at: "2026-04-05T08:15:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae80e09f991f861e8344cc7faea458a809ec88b9479b8c4a743554e46bba02a3
    source_path: channels/irc.md
    workflow: 15
---

# IRC

当你希望 OpenClaw 出现在经典频道（`#room`）和私信中时，请使用 IRC。
IRC 作为扩展插件提供，但它在主配置中的 `channels.irc` 下进行配置。

## 快速开始

1. 在 `~/.openclaw/openclaw.json` 中启用 IRC 配置。
2. 至少设置：

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.libera.chat",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. 启动 / 重启 Gateway 网关：

```bash
openclaw gateway run
```

## 默认安全设置

- `channels.irc.dmPolicy` 默认值为 `"pairing"`。
- `channels.irc.groupPolicy` 默认值为 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 时，请设置 `channels.irc.groups` 来定义允许的频道。
- 除非你明确接受明文传输，否则请使用 TLS（`channels.irc.tls=true`）。

## 访问控制

IRC 频道有两个独立的“门”：

1. **频道访问**（`groupPolicy` + `groups`）：机器人是否完全接受来自某个频道的消息。
2. **发送者访问**（`groupAllowFrom` / 按频道的 `groups["#channel"].allowFrom`）：在该频道中，谁有权触发机器人。

配置键：

- 私信 allowlist（私信发送者访问）：`channels.irc.allowFrom`
- 群组发送者 allowlist（频道发送者访问）：`channels.irc.groupAllowFrom`
- 按频道控制（频道 + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允许未配置的频道（**默认仍然启用提及门控**）

Allowlist 条目应使用稳定的发送者身份（`nick!user@host`）。
裸 nick 匹配是可变的，只有在 `channels.irc.dangerouslyAllowNameMatching: true` 时才会启用。

### 常见陷阱：`allowFrom` 用于私信，不用于频道

如果你看到如下日志：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这意味着该发送者**没有被允许**发送**群组 / 频道**消息。修复方法如下：

- 设置 `channels.irc.groupAllowFrom`（对所有频道全局生效），或
- 设置按频道的发送者 allowlist：`channels.irc.groups["#channel"].allowFrom`

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

即使某个频道已被允许（通过 `groupPolicy` + `groups`），并且发送者也被允许，OpenClaw 在群组上下文中默认仍会启用**提及门控**。

这意味着，除非消息中包含与机器人匹配的提及模式，否则你可能会看到类似 `drop channel … (missing-mention)` 的日志。

如果你希望机器人在 IRC 频道中**无需提及**即可回复，请为该频道禁用提及门控：

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

或者，如果你希望允许**所有** IRC 频道（无需按频道 allowlist），同时仍然可以无需提及就回复：

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

如果你在公共频道中设置 `allowFrom: ["*"]`，任何人都可以向机器人发出提示。
为降低风险，请限制该频道可用的工具。

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

### 按发送者区分工具权限（所有者拥有更多权限）

使用 `toolsBySender` 可对 `"*"` 应用更严格的策略，并对你的 nick 应用更宽松的策略：

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
  `id:eigen` 或 `id:eigen!~eigen@174.127.248.171` 以获得更强匹配。
- 旧版无前缀键仍然被接受，并且只会按 `id:` 匹配。
- 第一个匹配到的发送者策略优先生效；`"*"` 是通配回退项。

有关群组访问与提及门控（以及它们如何交互）的更多信息，请参阅：[/channels/groups](/channels/groups)。

## NickServ

要在连接后通过 NickServ 进行身份识别：

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

可选：连接时执行一次性注册：

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

在 nick 完成注册后，请禁用 `register`，以避免重复尝试 REGISTER。

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

## 故障排除

- 如果机器人已连接但从不在频道中回复，请检查 `channels.irc.groups`，**以及** 是否是提及门控丢弃了消息（`missing-mention`）。如果你希望它在无需 ping 的情况下回复，请为该频道设置 `requireMention:false`。
- 如果登录失败，请检查 nick 是否可用以及服务器密码是否正确。
- 如果自定义网络中的 TLS 失败，请检查 host / port 和证书设置。

## 相关内容

- [渠道概览](/channels) —— 所有支持的渠道
- [配对](/channels/pairing) —— 私信认证与配对流程
- [群组](/channels/groups) —— 群聊行为与提及门控
- [渠道路由](/channels/channel-routing) —— 消息的会话路由
- [安全](/gateway/security) —— 访问模型与加固

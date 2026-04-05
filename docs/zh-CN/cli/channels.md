---
read_when:
    - 你想添加/移除渠道账号（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
    - 你想检查渠道状态或查看渠道日志
summary: '`openclaw channels` 的 CLI 参考（账号、状态、登录/登出、日志）'
title: channels
x-i18n:
    generated_at: "2026-04-05T08:19:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: d0f558fdb5f6ec54e7fdb7a88e5c24c9d2567174341bd3ea87848bce4cba5d29
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

管理 Gateway 网关上聊天渠道的账号及其运行时状态。

相关文档：

- 渠道指南：[Channels](/channels/index)
- Gateway 网关配置：[Configuration](/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## 状态 / 能力 / 解析 / 日志

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（仅可与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：当 Gateway 网关可访问时，它会对每个账号运行
`probeAccount` 以及可选的 `auditAccount` 检查，因此输出可以包含传输状态以及探测结果，
例如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果 Gateway 网关不可访问，`channels status` 会回退为仅基于配置的摘要，
而不是实时探测输出。

## 添加 / 移除账号

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

提示：`openclaw channels add --help` 会显示每个渠道的参数（token、private key、app token、signal-cli 路径等）。

常见的非交互式添加参数包括：

- 机器人 token 渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env`，用于支持的默认账号环境变量认证

当你在不带参数的情况下运行 `openclaw channels add` 时，交互式向导可能会提示：

- 所选渠道中每个账号的账号 ID
- 这些账号的可选显示名称
- `Bind configured channel accounts to agents now?`

如果你确认立即绑定，向导会询问每个已配置渠道账号应由哪个智能体拥有，并写入账号作用域的路由绑定。

你也可以稍后使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/cli/agents)）。

当你向某个仍在使用单账号顶层设置的渠道添加非默认账号时，OpenClaw 会先将账号作用域的顶层值提升到该渠道的账号映射中，然后再写入新账号。大多数渠道会把这些值放到 `channels.<channel>.accounts.default`，但内置渠道也可能会保留一个现有的匹配提升账号。Matrix 是当前示例：如果已经存在一个具名账号，或者 `defaultAccount` 指向一个现有具名账号，则提升会保留该账号，而不是创建新的 `accounts.default`。

路由行为保持一致：

- 现有仅渠道级绑定（没有 `accountId`）将继续匹配默认账号。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择添加账号作用域的绑定。

如果你的配置已经处于混合状态（存在具名账号，同时仍设置了顶层单账号值），请运行 `openclaw doctor --fix`，将账号作用域的值移动到为该渠道选择的提升账号中。大多数渠道会提升到 `accounts.default`；Matrix 可以保留现有的具名/默认目标。

## 登录 / 登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

说明：

- `channels login` 支持 `--verbose`。
- 当只配置了一个受支持的登录目标时，`channels login` / `logout` 可以推断渠道。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 输出 `Claude: HTTP 403 ... user:profile` → 使用情况快照需要 `user:profile` 作用域。可使用 `--no-usage`，或提供 claude.ai 会话密钥（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或通过 Claude CLI 重新认证。
- 当 Gateway 网关不可访问时，`openclaw channels status` 会回退为仅基于配置的摘要。如果某个受支持渠道的凭证通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账号显示为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（在可用时包括 intents/scopes）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略时会列出所有渠道（包括扩展）。
- `--account` 只能与 `--channel` 一起使用。
- `--target` 接受 `channel:<id>` 或原始数字频道 id，并且仅适用于 Discord。
- 探测是提供商特定的：Discord intents + 可选频道权限；Slack bot + user scopes；Telegram bot 标志 + webhook；Signal 守护进程版本；Microsoft Teams app token + Graph 角色/作用域（在已知时附注）。没有探测能力的渠道会报告 `Probe: unavailable`。

## 将名称解析为 ID

使用提供商目录将渠道/用户名称解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明：

- 使用 `--kind user|group|auto` 强制指定目标类型。
- 当多个条目共享相同名称时，解析会优先选择活跃匹配项。
- `channels resolve` 是只读的。如果所选账号通过 SecretRef 配置，但该凭证在当前命令路径中不可用，命令会返回带说明的降级未解析结果，而不是中止整个运行。

---
read_when:
    - 你想添加/移除渠道账号（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
    - 你想检查渠道状态或实时查看渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、状态、登录/注销、日志）'
title: 渠道
x-i18n:
    generated_at: "2026-05-01T21:49:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9cfde99d49d63397756b182a20ae3936a6b23f2455616dc86ceb3f16a205c06
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

在 Gateway 网关上管理聊天渠道账户及其运行时 Status。

相关文档：

- 渠道指南：[渠道](/zh-CN/channels)
- Gateway 网关配置：[配置](/zh-CN/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## Status / 能力 / 解析 / 日志

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（仅与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`: `<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`: `--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：在可访问的 Gateway 网关上，它会按账户运行 `probeAccount` 和可选的 `auditAccount` 检查，因此输出可以包含传输状态以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探测结果。如果 Gateway 网关不可访问，`channels status` 会回退为仅配置摘要，而不是实时探测输出。

## 添加 / 移除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 会显示每个渠道的标志（令牌、私钥、应用令牌、signal-cli 路径等）。
</Tip>

`channels remove` 只作用于已安装/已配置的渠道插件。对于可安装目录渠道，请先使用 `channels add`。对于由运行时支持的渠道插件，`channels remove` 还会请求正在运行的 Gateway 网关先停止所选账户，然后再更新配置，因此禁用或删除账户不会让旧监听器继续活动到重启为止。

常见的非交互式添加入口包括：

- bot-token 渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env`，用于受支持情况下默认账户的环境变量支持凭证

如果在由标志驱动的添加命令期间需要安装某个渠道插件，OpenClaw 会使用该渠道的默认安装源，而不会打开交互式插件安装提示。

不带标志运行 `openclaw channels add` 时，交互式向导可以提示：

- 每个所选渠道的账户 ID
- 这些账户的可选显示名称
- `Bind configured channel accounts to agents now?`

如果你确认立即绑定，向导会询问哪个智能体应拥有每个已配置渠道账户，并写入账户范围的路由绑定。

你也可以稍后使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（见 [agents](/zh-CN/cli/agents)）。

当你向一个仍在使用单账户顶层设置的渠道添加非默认账户时，OpenClaw 会在写入新账户之前，把账户范围的顶层值提升到该渠道的账户映射中。大多数渠道会把这些值放到 `channels.<channel>.accounts.default`，但内置渠道可以改为保留现有的匹配已提升账户。Matrix 是当前示例：如果已经存在一个具名账户，或者 `defaultAccount` 指向现有具名账户，提升会保留该账户，而不是创建新的 `accounts.default`。

路由行为保持一致：

- 现有的仅渠道绑定（没有 `accountId`）会继续匹配默认账户。
- `channels add` 不会在非交互模式下自动创建或重写绑定。
- 交互式设置可以选择添加账户范围的绑定。

如果你的配置已经处于混合状态（存在具名账户，同时仍设置了顶层单账户值），请运行 `openclaw doctor --fix`，将账户范围的值移动到为该渠道选择的已提升账户中。大多数渠道会提升到 `accounts.default`；Matrix 可以改为保留现有具名/默认目标。

## 登录和登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--verbose`。
- 当只配置了一个受支持的登录目标时，`channels login` 和 `logout` 可以推断渠道。
- `channels logout` 在可访问时优先使用实时 Gateway 网关路径，因此登出会在清除渠道凭证状态之前停止任何活动监听器。如果本地 Gateway 网关不可访问，它会回退到本地凭证清理。
- 从 Gateway 网关主机上的终端运行 `channels login`。智能体 `exec` 会阻塞此交互式登录流程；可用时，应从聊天中使用渠道原生的智能体登录工具，例如 `whatsapp_login`。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 打印 `Claude: HTTP 403 ... user:profile` → 用量快照需要 `user:profile` 范围。使用 `--no-usage`，或提供 claude.ai 会话密钥（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或通过 Claude CLI 重新认证。
- 当 Gateway 网关不可访问时，`openclaw channels status` 会回退为仅配置摘要。如果受支持的渠道凭证通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账户报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用时包括意图/范围）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选项；省略它可列出每个渠道（包括插件）。
- `--account` 仅在与 `--channel` 一起使用时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 ID，并且仅适用于 Discord。
- 探测因提供商而异：Discord 意图 + 可选渠道权限；Slack bot + 用户范围；Telegram bot 标志 + webhook；Signal 守护进程版本；Microsoft Teams 应用令牌 + Graph 角色/范围（已知处会标注）。没有探测的渠道会报告 `Probe: unavailable`。

## 将名称解析为 ID

使用提供商目录将渠道/用户名称解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明：

- 使用 `--kind user|group|auto` 强制目标类型。
- 当多个条目共享同一名称时，解析会优先选择活动匹配项。
- `channels resolve` 是只读操作。如果所选账户通过 SecretRef 配置，但该凭证在当前命令路径中不可用，命令会返回带有说明的降级未解析结果，而不是中止整个运行。
- `channels resolve` 不会安装渠道插件。在为可安装目录渠道解析名称之前，请使用 `channels add --channel <name>`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [渠道概览](/zh-CN/channels)

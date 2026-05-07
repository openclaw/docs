---
read_when:
    - 你想要添加/移除渠道账号（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
    - 你想检查渠道状态或跟踪渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、状态、登录/登出、日志）'
title: 渠道
x-i18n:
    generated_at: "2026-05-07T13:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理 Gateway 网关上的聊天渠道账户及其运行时状态。

相关文档：

- 渠道指南：[Channels](/zh-CN/channels)
- Gateway 网关配置：[配置](/zh-CN/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` 只显示聊天渠道：默认显示已配置的账户，并为每个账户标出 `installed`、`configured` 和 `enabled` 状态标签。传入 `--all` 还会显示尚未配置账户的内置渠道，以及尚未落盘的可安装目录渠道。凭证提供商（OAuth + API keys）和模型提供商使用量/配额快照不再在这里打印；请使用 `openclaw models auth list` 查看提供商凭证配置档案，并使用 `openclaw status` 或 `openclaw models list` 查看使用量。

## Status / capabilities / resolve / logs

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（仅与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：在可访问的 Gateway 网关上，它会按账户运行
`probeAccount` 和可选的 `auditAccount` 检查，因此输出可包含传输协议
状态，以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探测结果。
如果 Gateway 网关不可访问，`channels status` 会回退到仅基于配置的摘要，
而不是实时探测输出。

不要把 `openclaw sessions`、Gateway 网关 `sessions.list` 或智能体
`sessions_list` 工具用作渠道套接字健康信号。这些界面报告的是
已存储的会话行，而不是提供商运行时状态。Discord 提供商重启后，
一个已连接但安静的账户可能是健康的，但直到下一次入站或出站会话事件之前，
都不会出现 Discord 会话行。

## 添加 / 移除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 会显示每个渠道的标志（token、private key、app token、signal-cli 路径等）。
</Tip>

`channels remove` 只作用于已安装/已配置的渠道插件。对于可安装目录渠道，请先使用 `channels add`。
对于由运行时支撑的渠道插件，`channels remove` 还会在更新配置前要求正在运行的 Gateway 网关停止所选账户，因此禁用或删除账户不会让旧监听器一直保持活动直到重启。

常见的非交互式添加界面包括：

- bot-token 渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输协议字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env`，用于受支持的默认账户环境变量凭证

如果渠道插件需要在由标志驱动的添加命令期间安装，OpenClaw 会使用该渠道的默认安装源，而不会打开交互式插件安装提示。

当你不带标志运行 `openclaw channels add` 时，交互式向导可能会提示：

- 每个所选渠道的账户 ID
- 这些账户的可选显示名称
- `Bind configured channel accounts to agents now?`

如果你确认现在绑定，向导会询问哪个智能体应拥有每个已配置的渠道账户，并写入按账户作用域的路由绑定。

你也可以之后使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/zh-CN/cli/agents)）。

当你向仍在使用单账户顶层设置的渠道添加非默认账户时，OpenClaw 会先把按账户作用域的顶层值提升到该渠道的账户映射中，再写入新账户。大多数渠道会把这些值放入 `channels.<channel>.accounts.default`，但内置渠道可以改为保留现有匹配的已提升账户。Matrix 是当前示例：如果已存在一个命名账户，或 `defaultAccount` 指向现有命名账户，提升会保留该账户，而不是创建新的 `accounts.default`。

路由行为保持一致：

- 现有仅渠道绑定（无 `accountId`）会继续匹配默认账户。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择添加按账户作用域的绑定。

如果你的配置已处于混合状态（存在命名账户且仍设置了顶层单账户值），请运行 `openclaw doctor --fix`，将按账户作用域的值移入为该渠道选择的已提升账户。大多数渠道会提升到 `accounts.default`；Matrix 可以改为保留现有命名/默认目标。

## 登录和登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--verbose`。
- 当只配置了一个受支持的登录目标时，`channels login` 和 `logout` 可以推断渠道。
- `channels logout` 在可访问时优先使用实时 Gateway 网关路径，因此登出会在清除渠道凭证状态前停止任何活动监听器。如果本地 Gateway 网关不可访问，它会回退到本地凭证清理。
- 请从 Gateway 网关主机上的终端运行 `channels login`。智能体 `exec` 会阻塞此交互式登录流程；可用时，应从聊天中使用渠道原生智能体登录工具，例如 `whatsapp_login`。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 不再打印模型提供商使用量/配额快照。要查看这些信息，请使用 `openclaw status`（概览）或 `openclaw models list`（按提供商）。
- 当 Gateway 网关不可访问时，`openclaw channels status` 会回退到仅基于配置的摘要。如果受支持的渠道凭据通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账户报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用时包括 intents/scopes）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略它可列出每个渠道（包括插件）。
- `--account` 仅在与 `--channel` 一起使用时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 ID，并且只适用于 Discord。对于 Discord 语音渠道，权限检查会标记缺失的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探测因提供商而异：Discord intents + 可选渠道权限；Slack bot + user scopes；Telegram bot flags + webhook；Signal daemon version；Microsoft Teams app token + Graph roles/scopes（已知处会标注）。没有探测的渠道会报告 `Probe: unavailable`。

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
- `channels resolve` 是只读的。如果所选账户通过 SecretRef 配置，但该凭据在当前命令路径中不可用，命令会返回带说明的降级未解析结果，而不是中止整个运行。
- `channels resolve` 不会安装渠道插件。请先使用 `channels add --channel <name>`，再为可安装目录渠道解析名称。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Channels 概览](/zh-CN/channels)

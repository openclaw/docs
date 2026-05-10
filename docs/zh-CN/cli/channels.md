---
read_when:
    - 你想添加/移除渠道账号（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
    - 你想检查渠道状态或实时查看渠道日志
summary: '`openclaw channels` 的 CLI 参考（账号、状态、登录/登出、日志）'
title: 渠道
x-i18n:
    generated_at: "2026-05-10T19:26:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

在 Gateway 网关上管理聊天渠道账号及其运行时 Status。

相关文档：

- 渠道指南：[渠道](/zh-CN/channels)
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

`channels list` 只显示聊天渠道：默认显示已配置的账号，并为每个账号显示 `installed`、`configured` 和 `enabled` Status 标签。传入 `--all` 还会显示尚未配置账号的内置渠道，以及尚未安装到磁盘上的可安装目录渠道。这里不再打印身份验证提供商（OAuth + API 密钥）和模型提供商使用量/配额快照；请使用 `openclaw models auth list` 查看提供商身份验证配置文件，使用 `openclaw status` 或 `openclaw models list` 查看使用量。

## Status / 能力 / 解析 / 日志

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（仅与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` 是实时路径：在可访问的 Gateway 网关上，它会按账号运行
`probeAccount` 和可选的 `auditAccount` 检查，因此输出可以包含传输
状态以及探测结果，例如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果无法访问 Gateway 网关，`channels status` 会回退到仅配置摘要，
而不是实时探测输出。

不要把 `openclaw sessions`、Gateway 网关 `sessions.list` 或智能体
`sessions_list` 工具用作渠道套接字健康信号。这些界面报告的是
已存储的对话行，而不是提供商运行时状态。Discord 提供商
重启后，已连接但安静的账号可能是健康的，而 Discord 会话
行要等到下一次入站或出站对话事件后才会出现。

## 添加 / 移除账号

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 会显示每个渠道的标志（令牌、私钥、应用令牌、signal-cli 路径等）。
</Tip>

`channels remove` 仅作用于已安装/已配置的渠道插件。对于可安装目录渠道，请先使用 `channels add`。
对于由运行时支持的渠道插件，`channels remove` 还会要求正在运行的 Gateway 网关在更新配置前停止所选账号，因此禁用或删除账号后，旧监听器不会一直保持活动直到重启。

常见的非交互式添加界面包括：

- 机器人令牌渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用于支持默认账号环境变量身份验证的渠道

如果在通过标志驱动的添加命令期间需要安装渠道插件，OpenClaw 会使用该渠道的默认安装源，而不会打开交互式插件安装提示。

当你不带标志运行 `openclaw channels add` 时，交互式向导可以提示：

- 每个所选渠道的账号 ID
- 这些账号的可选显示名称
- `Route these channel accounts to agents now?`

如果你确认立即绑定，向导会询问每个已配置渠道账号应由哪个智能体拥有，并写入账号作用域的路由绑定。

你之后也可以使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/zh-CN/cli/agents)）。

当你向仍在使用单账号顶层设置的渠道添加非默认账号时，OpenClaw 会先把账号作用域的顶层值提升到该渠道的账号映射中，然后再写入新账号。大多数渠道会把这些值放入 `channels.<channel>.accounts.default`，但内置渠道可以改为保留现有匹配的已提升账号。Matrix 是当前示例：如果一个命名账号已经存在，或者 `defaultAccount` 指向现有命名账号，提升会保留该账号，而不是创建新的 `accounts.default`。

路由行为保持一致：

- 现有仅渠道绑定（没有 `accountId`）会继续匹配默认账号。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择添加账号作用域绑定。

如果你的配置已经处于混合状态（存在命名账号，同时仍设置了顶层单账号值），请运行 `openclaw doctor --fix`，将账号作用域的值移入为该渠道选择的已提升账号。大多数渠道会提升到 `accounts.default`；Matrix 可以改为保留现有的命名/默认目标。

## 登录和登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--verbose`。
- 当只配置了一个受支持的登录目标时，`channels login` 和 `logout` 可以推断渠道。
- `channels logout` 在可访问时优先使用实时 Gateway 网关路径，因此会在清除渠道身份验证状态前停止任何活动监听器。如果本地 Gateway 网关不可访问，它会回退到本地身份验证清理。
- 请从 Gateway 网关主机上的终端运行 `channels login`。智能体 `exec` 会阻塞此交互式登录流程；可用时，应从聊天中使用渠道原生的智能体登录工具，例如 `whatsapp_login`。

## 故障排除

- 运行 `openclaw status --deep` 执行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 不再打印模型提供商使用量/配额快照。要查看这些信息，请使用 `openclaw status`（概览）或 `openclaw models list`（按提供商）。
- 当 Gateway 网关不可访问时，`openclaw channels status` 会回退到仅配置摘要。如果受支持的渠道凭据通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账号报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用时包括意图/作用域）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略它会列出每个渠道（包括扩展）。
- `--account` 仅在与 `--channel` 一起使用时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 ID，并且只适用于 Discord。对于 Discord 语音渠道，权限检查会标记缺失的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探测因提供商而异：Discord 意图 + 可选渠道权限；Slack 机器人 + 用户作用域；Telegram 机器人标志 + webhook；Signal 守护进程版本；Microsoft Teams 应用令牌 + Graph 角色/作用域（在已知位置标注）。没有探测的渠道会报告 `Probe: unavailable`。

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
- `channels resolve` 是只读的。如果所选账号通过 SecretRef 配置，但该凭据在当前命令路径中不可用，命令会返回带说明的降级未解析结果，而不是中止整个运行。
- `channels resolve` 不会安装渠道插件。对于可安装目录渠道，请在解析名称前使用 `channels add --channel <name>`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [渠道概览](/zh-CN/channels)

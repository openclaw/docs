---
read_when:
    - 你想添加或移除渠道账号（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp 等更多）
    - 你想检查渠道状态或跟踪渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、状态、能力、解析、日志、登录/注销）'
title: 渠道
x-i18n:
    generated_at: "2026-07-05T11:08:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理 Gateway 网关上的聊天渠道账号及其运行时状态。

相关文档：

- 渠道指南：[Channels](/zh-CN/channels)
- Gateway 配置：[Configuration](/zh-CN/gateway/configuration)

## 常用命令

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` 仅显示聊天渠道：默认显示已配置账号，并为每个账号显示 `installed`、`configured` 和 `enabled` 状态标签（使用 `--json` 输出机器可读内容）。传入 `--all` 还会显示尚未配置账号的内置渠道，以及尚未落盘的可安装目录渠道。提供商凭证和模型用量在其他位置管理：提供商凭证配置文件使用 `openclaw models auth list`，用量/配额使用 `openclaw status` 或 `openclaw models list`。

## 状态 / 能力 / 解析 / 日志

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`（默认 `10000`）、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（需要 `--channel`）、`--target <dest>`（需要 `--channel`）、`--timeout <ms>`（默认 `10000`，上限 `30000`）、`--json`
- `channels resolve <entries...>`：`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（默认 `auto`）、`--json`
- `channels logs`：`--channel <name|all>`（默认 `all`）、`--lines <n>`（默认 `200`）、`--json`

`channels status --probe` 是实时路径：在可访问的 Gateway 网关上，它会按账号运行
`probeAccount` 和可选的 `auditAccount` 检查，因此输出可以包含传输协议
状态以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探测结果。
如果 Gateway 网关不可访问，`channels status` 会回退到仅基于配置的摘要，
而不是实时探测输出。

不要将 `openclaw sessions`、Gateway 网关 `sessions.list` 或智能体
`sessions_list` 工具用作渠道套接字健康信号。这些表面报告的是
已存储的对话行，而不是提供商运行时状态。在 Discord 提供商
重启后，一个已连接但安静的账号可能是健康的，但直到下一次入站或出站对话事件之前，
都不会出现 Discord 会话行。

## 添加 / 移除账号

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 会显示每个渠道的标志（令牌、私钥、应用令牌、signal-cli 路径等）。
</Tip>

`channels remove` 仅作用于已安装/已配置的渠道插件。对于可安装目录渠道，请先使用 `channels add`。不带 `--delete` 时，它会询问是否禁用账号并保留其配置；`--delete` 会在不提示的情况下移除配置条目。
对于由运行时支持的渠道插件，`channels remove` 还会在更新配置前请求正在运行的 Gateway 网关停止所选账号，因此禁用或删除账号不会让旧监听器在重启前继续保持活动。

各渠道共享的非交互式添加标志：`--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir` 和 `--use-env`（由环境变量支持的凭证，仅默认账号，在支持时可用）。渠道专用标志包括：

| 渠道        | 标志                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

如果渠道插件需要在由标志驱动的添加命令期间安装，OpenClaw 会使用该渠道的默认安装源，而不会打开交互式插件安装提示。

当你不带标志运行 `openclaw channels add` 时，交互式向导可以提示：

- 每个所选渠道的账号 ID
- 这些账号的可选显示名称
- `Route these channel accounts to agents now?`

如果你确认立即绑定，向导会询问每个已配置渠道账号应由哪个智能体拥有，并写入账号范围的路由绑定。

之后你也可以使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/zh-CN/cli/agents)）。

当你向仍在使用单账号顶层设置的渠道添加非默认账号时，OpenClaw 会先将这些顶层值提升到该渠道的账号映射中，然后再写入新账号。当渠道恰好有一个已命名账号，或 `defaultAccount` 指向一个账号时，提升会复用该现有命名账号；否则这些值会落入 `channels.<channel>.accounts.default`。

路由行为保持一致：

- 现有的仅渠道绑定（无 `accountId`）继续匹配默认账号。
- `channels add` 在非交互模式下不会自动创建或重写绑定。
- 交互式设置可以选择添加账号范围的绑定。

如果你的配置已经处于混合状态（存在命名账号，同时仍设置了顶层单账号值），请运行 `openclaw doctor --fix`，将账号范围的值移动到为该渠道选择的已提升账号中。

## 登录和登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--account <id>` 和 `--verbose`；`channels logout` 支持 `--account <id>`。
- 当只有一个已配置渠道支持该操作时，`channels login` 和 `logout` 可以推断渠道；如果有多个，请传入 `--channel`。
- `channels logout` 在可访问时优先使用实时 Gateway 网关路径，因此登出会在清除渠道凭证状态前停止任何活动监听器。如果本地 Gateway 网关不可访问，它会回退到本地凭证清理；在 `gateway.mode: "remote"` 下，Gateway 网关错误会导致命令失败。
- 登录成功后，CLI 会请求可访问的本地 Gateway 网关启动该账号；在远程模式下，它会在本地保存凭证，并说明远程运行时未重启。
- 请在 Gateway 网关主机上的终端中运行 `channels login`。智能体 `exec` 会阻止这个交互式登录流程；可用时，应从聊天中使用渠道原生智能体登录工具，例如 `whatsapp_login`。

## 故障排查

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- 当 Gateway 网关不可访问时，`openclaw channels status` 会回退到仅基于配置的摘要。如果受支持的渠道凭证通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账号报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用时包括意图/权限范围）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略它会列出每个渠道（包括插件提供的渠道）。
- `--account` 仅在与 `--channel` 一起使用时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 ID，并且仅适用于 Discord。对于 Discord 语音渠道，权限检查会标记缺失的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探测是提供商专用的：Discord bot 身份 + 意图以及可选渠道权限；Slack bot + 用户权限范围；Telegram bot 标志 + webhook；Signal 守护进程版本；Microsoft Teams 应用令牌 + Graph 角色/权限范围（在已知时附注）。没有探测的渠道会报告 `Probe: unavailable`。

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
- `channels resolve` 是只读的。如果所选账号通过 SecretRef 配置，但该凭证在当前命令路径中不可用，命令会返回带说明的降级未解析结果，而不是中止整个运行。
- `channels resolve` 不会安装渠道插件。对于可安装目录渠道，请先使用 `channels add --channel <name>`，然后再解析名称。

## 相关

- [CLI 参考](/zh-CN/cli)
- [渠道概览](/zh-CN/channels)

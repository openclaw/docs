---
read_when:
    - 你想添加或移除渠道账户（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp 等）
    - 你想检查渠道状态或跟踪渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、状态、能力、解析、日志、登录/退出登录）'
title: 渠道
x-i18n:
    generated_at: "2026-07-11T20:23:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

管理聊天渠道账户及其在 Gateway 网关上的运行时状态。

相关文档：

- 渠道指南：[渠道](/zh-CN/channels)
- Gateway 配置：[配置](/zh-CN/gateway/configuration)

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

`channels list` 仅显示聊天渠道：默认显示已配置的账户，并为每个账户附上 `installed`、`configured` 和 `enabled` 状态标签（使用 `--json` 获取机器可读输出）。传入 `--all` 还会显示尚未配置账户的内置渠道，以及尚未安装到磁盘的可安装目录渠道。提供商身份验证和模型用量位于其他位置：使用 `openclaw models auth list` 查看提供商身份验证配置文件，使用 `openclaw status` 或 `openclaw models list` 查看用量/配额。

## 状态 / 能力 / 解析 / 日志

- `channels status`：`--channel <name>`、`--probe`、`--timeout <ms>`（默认值为 `10000`）、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（需要 `--channel`）、`--target <dest>`（需要 `--channel`）、`--timeout <ms>`（默认值为 `10000`，上限为 `30000`）、`--json`
- `channels resolve <entries...>`：`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（默认值为 `auto`）、`--json`
- `channels logs`：`--channel <name|all>`（默认值为 `all`）、`--lines <n>`（默认值为 `200`）、`--json`

`channels status --probe` 是实时检查路径：当 Gateway 网关可访问时，它会对每个账户运行 `probeAccount` 和可选的 `auditAccount` 检查，因此输出可以包含传输状态以及 `works`、`probe failed`、`audit ok` 或 `audit failed` 等探测结果。如果 Gateway 网关无法访问，`channels status` 会回退到仅基于配置的摘要，而不是实时探测输出。

不要将 `openclaw sessions`、Gateway 网关的 `sessions.list` 或智能体的 `sessions_list` 工具用作渠道套接字健康状态信号。这些界面报告的是已存储的对话记录，而不是提供商运行时状态。Discord 提供商重启后，已连接但处于静默状态的账户可能运行正常，而 Discord 会话记录要到下一次入站或出站对话事件发生后才会出现。

## 添加 / 移除账户

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 会显示各渠道专用的标志（令牌、私钥、应用令牌、signal-cli 路径等）。
</Tip>

`channels remove` 仅对已安装/已配置的渠道插件生效。对于目录中的可安装渠道，请先使用 `channels add`。不使用 `--delete` 时，它会询问是否禁用账户并保留其配置；`--delete` 会直接移除配置条目而不提示。
对于由运行时支持的渠道插件，`channels remove` 还会在更新配置前请求正在运行的 Gateway 网关停止选定账户，因此禁用或删除账户后，旧监听器不会继续保持活动状态直至重启。

各渠道共用的非交互式添加标志：`--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir` 和 `--use-env`（由环境变量支持的身份验证，仅限默认账户，并且仅在支持的渠道中可用）。渠道专用标志包括：

| 渠道        | 标志                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`                                   |
| iMessage    | `--cli-path`、`--db-path`、`--service`、`--region`                                                   |
| Matrix      | `--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit` |
| Nostr       | `--private-key`、`--relay-urls`                                                                      |
| Signal      | `--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`                          |
| Tlon        | `--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

如果通过标志驱动的添加命令需要安装渠道插件，OpenClaw 会使用该渠道的默认安装源，而不会打开交互式插件安装提示。

不带标志运行 `openclaw channels add` 时，交互式向导可能会提示：

- 每个所选渠道的账户 ID
- 这些账户的可选显示名称
- `Route these channel accounts to agents now?`

如果确认立即绑定，向导会询问哪个智能体应负责每个已配置的渠道账户，并写入账户范围的路由绑定。

之后也可以使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（请参阅[智能体](/zh-CN/cli/agents)）。

当你向仍在使用单账户顶层设置的渠道添加非默认账户时，OpenClaw 会先将这些顶层值提升到该渠道的账户映射中，然后再写入新账户。如果该渠道恰好有一个现有的命名账户，或 `defaultAccount` 指向某个账户，提升过程会复用该账户；否则，这些值会写入 `channels.<channel>.accounts.default`。

路由行为保持一致：

- 现有的仅限渠道绑定（没有 `accountId`）继续匹配默认账户。
- 在非交互模式下，`channels add` 不会自动创建或重写绑定。
- 交互式设置可以选择添加账户范围的绑定。

如果你的配置已经处于混合状态（既存在命名账户，又仍设置了顶层单账户值），请运行 `openclaw doctor --fix`，将账户范围的值移入为该渠道选定的提升后账户。

## 登录和退出登录（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--account <id>` 和 `--verbose`；`channels logout` 支持 `--account <id>`。
- 当只有一个已配置渠道支持相应操作时，`channels login` 和 `logout` 可以推断渠道；如果有多个渠道，请传入 `--channel`。
- 当实时 Gateway 网关可访问时，`channels logout` 优先使用实时 Gateway 网关路径，以便在清除渠道身份验证状态前停止所有活动监听器。如果本地 Gateway 网关无法访问，它会回退到本地身份验证清理；当 `gateway.mode: "remote"` 时，Gateway 网关错误会直接导致命令失败。
- 成功登录后，CLI 会请求可访问的本地 Gateway 网关启动该账户；在远程模式下，它会在本地保存身份验证信息，并注明远程运行时尚未重启。
- 请在 Gateway 网关主机的终端中运行 `channels login`。智能体的 `exec` 会阻止此交互式登录流程；从聊天中操作时，如有可用的渠道原生智能体登录工具（例如 `whatsapp_login`），应使用这些工具。

## 故障排查

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- 当 Gateway 网关无法访问时，`openclaw channels status` 会回退到仅基于配置的摘要。如果受支持渠道的凭据通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账户报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用时包括意图/权限范围）以及静态功能支持信息：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略它可列出所有渠道（包括由插件提供的渠道）。
- `--account` 仅可与 `--channel` 一起使用。
- `--target` 接受 `channel:<id>` 或原始数字渠道 ID，并且仅适用于 Discord。对于 Discord 语音渠道，权限检查会标记缺少的 `ViewChannel`、`Connect`、`Speak`、`SendMessages` 和 `ReadMessageHistory`。
- 探测因提供商而异：Discord Bot 身份和意图，以及可选的渠道权限；Slack Bot 和用户权限范围；Telegram Bot 标志和 webhook；Signal 守护进程版本；Microsoft Teams 应用令牌和 Graph 角色/权限范围（已知时会加以标注）。没有探测功能的渠道会报告 `Probe: unavailable`。

## 将名称解析为 ID

使用提供商目录将渠道/用户名解析为 ID：

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

说明：

- 使用 `--kind user|group|auto` 强制指定目标类型。
- 当多个条目名称相同时，解析会优先选择活动匹配项。
- `channels resolve` 是只读操作。如果选定账户通过 SecretRef 配置，但该凭据在当前命令路径中不可用，该命令会返回带有说明的降级未解析结果，而不会中止整个运行。
- `channels resolve` 不会安装渠道插件。在解析目录中可安装渠道的名称之前，请使用 `channels add --channel <name>`。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [渠道概览](/zh-CN/channels)

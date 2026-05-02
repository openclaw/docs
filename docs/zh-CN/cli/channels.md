---
read_when:
    - 你想添加/移除渠道账户（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（插件）/Signal/iMessage/Matrix）
    - 你想检查渠道状态或实时查看渠道日志
summary: '`openclaw channels` 的 CLI 参考（账户、状态、登录/注销、日志）'
title: 渠道
x-i18n:
    generated_at: "2026-05-02T07:01:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

在 Gateway 网关上管理聊天渠道账号及其运行时状态。

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

- `channels status`：`--probe`、`--timeout <ms>`、`--json`
- `channels capabilities`：`--channel <name>`、`--account <id>`（仅与 `--channel` 一起使用）、`--target <dest>`、`--timeout <ms>`、`--json`
- `channels resolve`：`<entries...>`、`--channel <name>`、`--account <id>`、`--kind <auto|user|group>`、`--json`
- `channels logs`：`--channel <name|all>`、`--lines <n>`、`--json`

`channels status --probe` 是实时路径：在可访问的 Gateway 网关上，它会按账号运行
`probeAccount` 和可选的 `auditAccount` 检查，因此输出可以包含传输协议
状态以及探测结果，例如 `works`、`probe failed`、`audit ok` 或 `audit failed`。
如果无法访问 Gateway 网关，`channels status` 会回退到仅配置摘要，
而不是实时探测输出。

不要将 `openclaw sessions`、Gateway 网关 `sessions.list` 或智能体
`sessions_list` 工具用作渠道套接字健康信号。这些表面报告的是
已存储的对话行，而不是提供商运行时状态。Discord 提供商
重启后，一个已连接但安静的账号可能是健康的，而在下一次入站或出站对话事件之前不会出现 Discord 会话
行。

## 添加 / 移除账号

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` 会显示各渠道的标志（令牌、私钥、应用令牌、signal-cli 路径等）。
</Tip>

`channels remove` 仅作用于已安装/已配置的渠道插件。对于可安装的目录渠道，请先使用 `channels add`。
对于运行时支持的渠道插件，`channels remove` 还会要求正在运行的 Gateway 网关在更新配置前停止所选账号，因此停用或删除账号不会让旧监听器在重启前继续保持活动。

常见的非交互式添加表面包括：

- bot-token 渠道：`--token`、`--bot-token`、`--app-token`、`--token-file`
- Signal/iMessage 传输协议字段：`--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`、`--db-path`、`--service`、`--region`
- Google Chat 字段：`--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`
- Matrix 字段：`--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit`
- Nostr 字段：`--private-key`、`--relay-urls`
- Tlon 字段：`--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`
- `--use-env` 用于在受支持时使用默认账号的环境变量支持凭证

如果在标志驱动的添加命令期间需要安装渠道插件，OpenClaw 会使用该渠道的默认安装来源，而不会打开交互式插件安装提示。

当你不带标志运行 `openclaw channels add` 时，交互式向导可以提示：

- 每个所选渠道的账号 ID
- 这些账号的可选显示名称
- `Bind configured channel accounts to agents now?`

如果你确认立即绑定，向导会询问哪个智能体应拥有每个已配置的渠道账号，并写入账号范围的路由绑定。

之后你也可以使用 `openclaw agents bindings`、`openclaw agents bind` 和 `openclaw agents unbind` 管理相同的路由规则（参见 [agents](/zh-CN/cli/agents)）。

当你向仍在使用单账号顶层设置的渠道添加非默认账号时，OpenClaw 会先将账号范围的顶层值提升到该渠道的账号映射中，然后再写入新账号。大多数渠道会将这些值放入 `channels.<channel>.accounts.default`，但内置渠道可以改为保留现有匹配的已提升账号。Matrix 是当前示例：如果已经存在一个命名账号，或者 `defaultAccount` 指向现有命名账号，提升会保留该账号，而不是创建新的 `accounts.default`。

路由行为保持一致：

- 现有的仅渠道绑定（没有 `accountId`）会继续匹配默认账号。
- `channels add` 不会在非交互模式下自动创建或重写绑定。
- 交互式设置可以选择添加账号范围的绑定。

如果你的配置已经处于混合状态（存在命名账号，同时仍设置了顶层单账号值），请运行 `openclaw doctor --fix`，将账号范围的值移入为该渠道选择的已提升账号。大多数渠道会提升到 `accounts.default`；Matrix 可以改为保留现有的命名/默认目标。

## 登录和登出（交互式）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` 支持 `--verbose`。
- 当只配置了一个受支持的登录目标时，`channels login` 和 `logout` 可以推断渠道。
- `channels logout` 在可访问时优先使用实时 Gateway 网关路径，因此登出会先停止任何活动监听器，再清除渠道凭证状态。如果无法访问本地 Gateway 网关，它会回退到本地凭证清理。
- 请从 Gateway 网关主机上的终端运行 `channels login`。智能体 `exec` 会阻塞这个交互式登录流程；可用时，应从聊天中使用渠道原生智能体登录工具，例如 `whatsapp_login`。

## 故障排除

- 运行 `openclaw status --deep` 进行广泛探测。
- 使用 `openclaw doctor` 获取引导式修复。
- `openclaw channels list` 打印 `Claude: HTTP 403 ... user:profile` → 使用情况快照需要 `user:profile` 作用域。使用 `--no-usage`，或提供 claude.ai 会话密钥（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`），或通过 Claude CLI 重新认证。
- 当无法访问 Gateway 网关时，`openclaw channels status` 会回退到仅配置摘要。如果受支持的渠道凭证通过 SecretRef 配置，但在当前命令路径中不可用，它会将该账号报告为已配置并附带降级说明，而不是显示为未配置。

## 能力探测

获取提供商能力提示（可用时包括 intents/scopes）以及静态功能支持：

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

说明：

- `--channel` 是可选的；省略它会列出每个渠道（包括扩展）。
- `--account` 仅在与 `--channel` 一起使用时有效。
- `--target` 接受 `channel:<id>` 或原始数字渠道 ID，并且仅适用于 Discord。
- 探测是提供商特定的：Discord intents + 可选渠道权限；Slack bot + 用户作用域；Telegram bot 标志 + webhook；Signal daemon 版本；Microsoft Teams 应用令牌 + Graph 角色/作用域（在已知处标注）。没有探测的渠道会报告 `Probe: unavailable`。

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
- `channels resolve` 不会安装渠道插件。解析可安装目录渠道的名称之前，请使用 `channels add --channel <name>`。

## 相关

- [CLI 参考](/zh-CN/cli)
- [渠道概览](/zh-CN/channels)

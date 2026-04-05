---
read_when:
    - 将 mac 应用与 Gateway 网关 生命周期集成时
summary: macOS 上的 Gateway 网关 生命周期（launchd）
title: Gateway 网关 生命周期
x-i18n:
    generated_at: "2026-04-05T08:37:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS 上的 Gateway 网关 生命周期

macOS 应用默认**通过 launchd 管理 Gateway 网关**，不会将
Gateway 网关 作为子进程启动。它会先尝试连接到已在配置端口上运行的
Gateway 网关；如果没有可连接的实例，则会通过外部 `openclaw` CLI 启用 launchd
服务（不包含嵌入式运行时）。这样可以为你提供可靠的登录自动启动和崩溃后重启能力。

子进程模式（由应用直接启动 Gateway 网关）当前**未在使用**。
如果你需要与 UI 更紧密的耦合，请在终端中手动运行 Gateway 网关。

## 默认行为（launchd）

- 应用会安装一个按用户划分的 LaunchAgent，标签为 `ai.openclaw.gateway`
  （使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；支持旧版 `com.openclaw.*`）。
- 启用本地模式时，应用会确保 LaunchAgent 已加载，并在需要时
  启动 Gateway 网关。
- 日志会写入 launchd 的 Gateway 网关 日志路径（可在调试设置中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名 profile 时，请将标签替换为 `ai.openclaw.<profile>`。

## 未签名的开发构建

`scripts/restart-mac.sh --no-sign` 用于在你没有签名密钥时进行
快速本地构建。为防止 launchd 指向未签名的 relay 二进制文件，它会：

- 写入 `~/.openclaw/disable-launchagent`。

如果存在该标记文件，已签名运行的 `scripts/restart-mac.sh` 会清除此覆盖设置。
如需手动重置：

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅附加模式

若要强制 macOS 应用**永不安装或管理 launchd**，请使用
`--attach-only`（或 `--no-launchd`）启动它。这会设置 `~/.openclaw/disable-launchagent`，
因此应用只会附加到已在运行的 Gateway 网关。你也可以在调试设置中切换相同
行为。

## 远程模式

远程模式永远不会启动本地 Gateway 网关。应用会使用通往远程主机的 SSH 隧道，
并通过该隧道进行连接。

## 为什么我们更倾向于 launchd

- 登录时自动启动。
- 内置重启/KeepAlive 语义。
- 可预测的日志和进程监管。

如果将来确实再次需要真正的子进程模式，应将其记录为一种
单独且明确的仅开发模式。

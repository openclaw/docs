---
read_when:
    - 将 mac 应用与 Gateway 网关生命周期集成
summary: Gateway 网关在 macOS 上的生命周期（launchd）
title: macOS 上的 Gateway 网关生命周期
x-i18n:
    generated_at: "2026-07-05T11:27:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS 应用默认通过 **launchd** 管理 Gateway 网关，并且不会将 Gateway 网关作为子进程启动。它会先尝试连接到配置端口上已经运行的 Gateway 网关；如果无法访问任何 Gateway 网关，它会通过外部 `openclaw` CLI 启用 launchd 服务（没有嵌入式运行时）。这可以在登录时可靠地自动启动，并在崩溃时重启。

子进程模式（由应用直接启动 Gateway 网关）目前**未使用**。如果你需要与 UI 更紧密地耦合，请在终端中手动运行 Gateway 网关。

## 默认行为（launchd）

- 应用会安装一个按用户配置的 LaunchAgent，标签为 `ai.openclaw.gateway`（使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`）。
- 启用本地模式时，应用会确保 LaunchAgent 已加载，并在需要时启动 Gateway 网关。
- 日志会写入 launchd gateway 日志路径（可在调试设置中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名配置文件时，将标签替换为 `ai.openclaw.<profile>`。

## 未签名的开发构建

`scripts/restart-mac.sh --no-sign` 用于没有签名密钥的快速本地构建。为阻止 launchd 指向未签名的 relay 二进制文件，它会写入 `~/.openclaw/disable-launchagent`。

如果该标记存在，签名运行 `scripts/restart-mac.sh` 会清除此覆盖。要手动重置：

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅连接模式

要强制 macOS 应用永不安装或管理 launchd，请使用 `--attach-only`（或 `--no-launchd`）启动它。这会设置 `~/.openclaw/disable-launchagent`，因此应用只会连接到已经运行的 Gateway 网关。也可以在调试设置中切换相同行为。

## 远程模式

远程模式永远不会启动本地 Gateway 网关。应用会使用 SSH 隧道连接到远程主机，并通过该隧道连接。

## 为什么我们偏好 launchd

- 登录时自动启动。
- 内置重启/KeepAlive 语义。
- 可预测的日志和监督。

如果将来再次需要真正的子进程模式，应将其记录为单独、明确的仅开发模式。

## 相关

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关运行手册](/zh-CN/gateway)

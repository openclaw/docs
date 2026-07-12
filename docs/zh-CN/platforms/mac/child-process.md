---
read_when:
    - 将 macOS 应用与 Gateway 网关生命周期集成
summary: macOS 上的 Gateway 网关生命周期（launchd）
title: macOS 上的 Gateway 网关生命周期
x-i18n:
    generated_at: "2026-07-11T20:38:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS 应用默认通过 **launchd** 管理 Gateway 网关，并且不会将 Gateway 网关生成为子进程。它会先尝试连接配置端口上已运行的 Gateway 网关；如果无法连接，则通过外部 `openclaw` CLI 启用 launchd 服务（不含嵌入式运行时）。这样可以确保登录时可靠地自动启动，并在崩溃后重新启动。

目前**未使用**子进程模式（由应用直接生成 Gateway 网关）。如果你需要让 Gateway 网关与 UI 更紧密地耦合，请在终端中手动运行 Gateway 网关。

## 默认行为（launchd）

- 应用会安装一个标签为 `ai.openclaw.gateway` 的每用户 LaunchAgent（使用 `--profile`/`OPENCLAW_PROFILE` 时则为 `ai.openclaw.<profile>`）。
- 启用本地模式后，应用会确保 LaunchAgent 已加载，并在需要时启动 Gateway 网关。
- 日志会写入 launchd 的 Gateway 网关日志路径（可在调试设置中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名配置文件时，请将标签替换为 `ai.openclaw.<profile>`。

## 未签名的开发构建

`scripts/restart-mac.sh --no-sign` 用于在没有签名密钥的情况下进行快速本地构建。为防止 launchd 指向未签名的中继二进制文件，该命令会写入 `~/.openclaw/disable-launchagent`。

如果存在此标记，运行已签名的 `scripts/restart-mac.sh` 时会清除此覆盖设置。若要手动重置：

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅连接模式

若要强制 macOS 应用永不安装或管理 launchd，请使用 `--attach-only`（或 `--no-launchd`）启动应用。这会设置 `~/.openclaw/disable-launchagent`，使应用仅连接已运行的 Gateway 网关。也可以在调试设置中切换相同的行为。

## 远程模式

远程模式绝不会启动本地 Gateway 网关。应用会建立通往远程主机的 SSH 隧道，并通过该隧道连接。

## 为什么我们更倾向于使用 launchd

- 登录时自动启动。
- 内置的重启/KeepAlive 机制。
- 可预测的日志和进程监管。

如果将来确实再次需要真正的子进程模式，应将其记录为一种独立、明确且仅供开发使用的模式。

## 相关内容

- [macOS 应用](/zh-CN/platforms/macos)
- [Gateway 网关运行手册](/zh-CN/gateway)

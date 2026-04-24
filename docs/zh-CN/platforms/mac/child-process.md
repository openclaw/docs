---
read_when:
    - 将 mac 应用与 Gateway 网关生命周期集成
summary: macOS 上的 Gateway 网关生命周期（launchd）
title: Gateway 网关生命周期
x-i18n:
    generated_at: "2026-04-24T04:05:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS 上的 Gateway 网关生命周期

macOS 应用默认**通过 launchd 管理 Gateway 网关**，不会将
Gateway 网关作为子进程生成。它会先尝试附加到已在配置端口上运行的
Gateway 网关；如果没有可访问的实例，则会通过外部 `openclaw` CLI 启用 launchd
服务（没有嵌入式运行时）。这样你就能获得可靠的登录自动启动和崩溃后自动重启。

子进程模式（由应用直接生成 Gateway 网关）目前**未在使用**。
如果你需要与 UI 更紧密耦合，请在终端中手动运行 Gateway 网关。

## 默认行为（launchd）

- 应用会安装一个每用户 LaunchAgent，标签为 `ai.openclaw.gateway`
  （使用 `--profile`/`OPENCLAW_PROFILE` 时为 `ai.openclaw.<profile>`；也支持旧版 `com.openclaw.*`）。
- 启用本地模式时，应用会确保 LaunchAgent 已加载，并在需要时
  启动 Gateway 网关。
- 日志会写入 launchd gateway 日志路径（可在 Debug Settings 中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

运行命名 profile 时，请将标签替换为 `ai.openclaw.<profile>`。

## 未签名开发构建

`scripts/restart-mac.sh --no-sign` 用于没有
签名密钥时的快速本地构建。为了防止 launchd 指向未签名的 relay 二进制文件，它会：

- 写入 `~/.openclaw/disable-launchagent`。

如果存在该标记，已签名运行的 `scripts/restart-mac.sh` 会清除此覆盖项。
如需手动重置：

```bash
rm ~/.openclaw/disable-launchagent
```

## 仅附加模式

若要强制 macOS 应用**永不安装或管理 launchd**，请使用
`--attach-only`（或 `--no-launchd`）启动它。这会设置 `~/.openclaw/disable-launchagent`，
因此应用只会附加到已在运行的 Gateway 网关。你也可以在 Debug Settings 中切换相同行为。

## 远程模式

远程模式绝不会启动本地 Gateway 网关。应用会使用指向
远程主机的 SSH 隧道，并通过该隧道进行连接。

## 为什么我们偏好 launchd

- 登录时自动启动。
- 内置重启/KeepAlive 语义。
- 可预测的日志和监管机制。

如果未来再次需要真正的子进程模式，应将其记录为
独立的、明确的仅开发模式。

## 相关内容

- [macOS app](/zh-CN/platforms/macos)
- [Gateway runbook](/zh-CN/gateway)

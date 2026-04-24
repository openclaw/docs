---
read_when:
    - 运行无头节点主机
    - 为 `system.run` 配对非 macOS 节点
summary: '`openclaw node` 的 CLI 参考（无头节点主机）'
title: 节点
x-i18n:
    generated_at: "2026-04-24T05:21:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61b16bdd0c52115bc9938a0fc975369159a4e45d743173ab4e65fce8292af51e
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

运行一个**无头节点主机**，连接到 Gateway 网关 WebSocket，并在此机器上公开
`system.run` / `system.which`。

## 为什么要使用节点主机？

当你希望智能体能够**在网络中的其他机器上运行命令**，而又不想在那些机器上安装完整的 macOS 配套应用时，可以使用节点主机。

常见用例：

- 在远程 Linux/Windows 机器上运行命令（构建服务器、实验室机器、NAS）。
- 将 exec 保持在 Gateway 网关上的**沙箱隔离**状态，同时把已批准的执行委托给其他主机。
- 为自动化或 CI 节点提供一个轻量级、无头的执行目标。

执行仍然受**exec 批准**和节点主机上按智能体划分的允许列表保护，因此你可以将命令访问范围保持为受限且明确。

## 浏览器代理（零配置）

如果节点上的 `browser.enabled` 未被禁用，节点主机会自动公布一个浏览器代理。这样，智能体无需额外配置即可在该节点上使用浏览器自动化。

默认情况下，该代理会公开节点的常规浏览器配置文件界面。如果你设置了 `nodeHost.browserProxy.allowProfiles`，该代理将变为受限模式：
不在允许列表中的配置文件目标会被拒绝，并且通过代理会阻止持久化配置文件的创建/删除路由。

如有需要，可在节点上禁用它：

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 运行（前台）

```bash
openclaw node run --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway 网关 WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway 网关 WebSocket 端口（默认：`18789`）
- `--tls`：对 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖节点 id（会清除配对令牌）
- `--display-name <name>`：覆盖节点显示名称

## 节点主机的 Gateway 网关认证

`openclaw node run` 和 `openclaw node install` 会从配置/环境变量中解析 Gateway 网关认证信息（节点命令上没有 `--token`/`--password` 标志）：

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后回退到本地配置：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机不会刻意继承 `gateway.remote.token` / `gateway.remote.password`。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未能解析，节点认证解析会以失败关闭的方式处理（不会用远程回退来掩盖问题）。
- 在 `gateway.mode=remote` 中，远程客户端字段（`gateway.remote.token` / `gateway.remote.password`）也会根据远程优先级规则纳入候选。
- 节点主机认证解析只接受 `OPENCLAW_GATEWAY_*` 环境变量。

对于连接到受信任私有网络中非 loopback `ws://` Gateway 网关的节点，请设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。如果不设置，节点启动将以失败关闭的方式终止，并提示你使用 `wss://`、SSH 隧道或 Tailscale。
`openclaw node install` 会将此显式启用项持久化到受监管的节点服务中。

## 服务（后台）

将无头节点主机安装为用户服务。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway 网关 WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway 网关 WebSocket 端口（默认：`18789`）
- `--tls`：对 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖节点 id（会清除配对令牌）
- `--display-name <name>`：覆盖节点显示名称
- `--runtime <runtime>`：服务运行时（`node` 或 `bun`）
- `--force`：如果已安装，则重新安装/覆盖

管理该服务：

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

如需前台节点主机（非服务），请使用 `openclaw node run`。

服务命令接受 `--json`，用于机器可读输出。

## 配对

首次连接会在 Gateway 网关上创建一个待处理的设备配对请求（`role: node`）。
可通过以下方式批准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果节点在认证细节（角色/作用域/公钥）发生变化后重试配对，之前待处理的请求会被新请求取代，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

节点主机会将其节点 id、令牌、显示名称和 Gateway 网关连接信息存储在
`~/.openclaw/node.json` 中。

## Exec 批准

`system.run` 受本地 exec 批准控制：

- `~/.openclaw/exec-approvals.json`
- [Exec 批准](/zh-CN/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从 Gateway 网关编辑）

对于已批准的异步节点 exec，OpenClaw 会在提示前准备规范化的 `systemRunPlan`。
之后转发的已批准 `system.run` 会复用该已存储的计划，因此在批准请求创建后，对命令/cwd/session 字段的编辑会被拒绝，而不是改变节点实际执行的内容。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)

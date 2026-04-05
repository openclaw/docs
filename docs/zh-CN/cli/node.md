---
read_when:
    - 运行无头节点主机
    - 为 `system.run` 配对非 macOS 节点
summary: '`openclaw node` 的 CLI 参考（无头节点主机）'
title: node
x-i18n:
    generated_at: "2026-04-05T08:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6123b33ec46f2b85f2c815947435ac91bbe84456165ff0e504453356da55b46d
    source_path: cli/node.md
    workflow: 15
---

# `openclaw node`

运行一个**无头节点主机**，连接到 Gateway 网关 WebSocket，并在此机器上公开
`system.run` / `system.which`。

## 为什么使用节点主机？

当你希望智能体能够**在网络中的其他机器上运行命令**，而无需在那里安装完整的 macOS 配套应用时，请使用节点主机。

常见使用场景：

- 在远程 Linux/Windows 机器上运行命令（构建服务器、实验室机器、NAS）。
- 将 exec 保持为在 Gateway 网关上**沙箱隔离**，但把已批准的运行委派给其他主机。
- 为自动化或 CI 节点提供轻量级、无头的执行目标。

执行仍然受 **exec 批准**和节点主机上的按智能体划分允许列表保护，因此你可以让命令访问保持范围受限且明确。

## 浏览器代理（零配置）

如果节点上的 `browser.enabled` 未被禁用，节点主机会自动公布一个浏览器代理。
这样智能体就可以在该节点上使用浏览器自动化，而无需额外配置。

默认情况下，代理会公开该节点正常的浏览器配置档表面。如果你设置了
`nodeHost.browserProxy.allowProfiles`，代理就会变为限制模式：
不在允许列表中的配置档目标会被拒绝，并且通过代理会阻止持久化配置档的
创建/删除路由。

如果需要，可在节点上禁用它：

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
- `--node-id <id>`：覆盖节点 id（会清除配对 token）
- `--display-name <name>`：覆盖节点显示名称

## 节点主机的 Gateway 网关认证

`openclaw node run` 和 `openclaw node install` 会从配置/环境变量解析 Gateway 网关认证（节点命令没有 `--token`/`--password` 标志）：

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后回退到本地配置：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机不会继承 `gateway.remote.token` / `gateway.remote.password`。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，节点认证解析会以失败关闭方式处理（不会由远程回退掩盖）。
- 在 `gateway.mode=remote` 中，远程客户端字段（`gateway.remote.token` / `gateway.remote.password`）也会按远程优先级规则参与解析。
- 节点主机认证解析仅认可 `OPENCLAW_GATEWAY_*` 环境变量。

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
- `--node-id <id>`：覆盖节点 id（会清除配对 token）
- `--display-name <name>`：覆盖节点显示名称
- `--runtime <runtime>`：服务运行时（`node` 或 `bun`）
- `--force`：如果已安装则重新安装/覆盖

管理该服务：

```bash
openclaw node status
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 可运行前台节点主机（非服务）。

服务命令支持 `--json`，用于机器可读输出。

## 配对

首次连接会在 Gateway 网关上创建一个待处理的设备配对请求（`role: node`）。
通过以下命令批准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果节点在认证详情（角色/作用域/公钥）发生变化后重试配对，
之前的待处理请求会被替换，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

节点主机会将其节点 id、token、显示名称和 Gateway 网关连接信息存储在
`~/.openclaw/node.json` 中。

## Exec 批准

`system.run` 受本地 exec 批准机制控制：

- `~/.openclaw/exec-approvals.json`
- [Exec 批准](/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从 Gateway 网关编辑）

对于已批准的异步节点 exec，OpenClaw 会在提示前准备规范化的 `systemRunPlan`。
之后转发的、已批准的 `system.run` 会复用该已存储计划，因此在批准请求创建后，
若再编辑 command/cwd/session 字段，将被拒绝，而不是改变节点实际执行的内容。

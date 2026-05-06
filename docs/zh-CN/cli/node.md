---
read_when:
    - 运行无头节点主机
    - 为 system.run 配对非 macOS 节点
summary: '`openclaw node` 的 CLI 参考（无头节点主机）'
title: 节点
x-i18n:
    generated_at: "2026-05-06T16:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

运行一个**无头节点主机**，它会连接到 Gateway 网关 WebSocket，并在这台机器上暴露
`system.run` / `system.which`。

## 为什么使用节点主机？

当你希望智能体在你的网络中的**其他机器上运行命令**，但又不想在那里安装完整的 macOS 配套应用时，可以使用节点主机。

常见用例：

- 在远程 Linux/Windows 机器上运行命令（构建服务器、实验室机器、NAS）。
- 将 exec 在 Gateway 网关上保持**沙箱隔离**，但把已批准的运行委派给其他主机。
- 为自动化或 CI 节点提供轻量级、无头的执行目标。

执行仍受节点主机上的 **exec 审批**和每个智能体的允许列表保护，因此你可以让命令访问保持有范围且显式。

## 浏览器代理（零配置）

如果节点上的 `browser.enabled` 未被禁用，节点主机会自动通告浏览器代理。这让智能体无需额外配置即可在该节点上使用浏览器自动化。

默认情况下，代理会暴露节点的常规浏览器配置文件表面。如果设置了 `nodeHost.browserProxy.allowProfiles`，代理会变为限制模式：非允许列表中的配置文件目标会被拒绝，持久配置文件的创建/删除路由会通过代理被阻止。

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
- `--tls`：为 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖节点 ID（清除配对令牌）
- `--display-name <name>`：覆盖节点显示名称

## 节点主机的 Gateway 网关认证

`openclaw node run` 和 `openclaw node install` 会从配置/环境变量解析 Gateway 网关认证（节点命令没有 `--token`/`--password` 标志）：

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后回退到本地配置：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机有意不继承 `gateway.remote.token` / `gateway.remote.password`。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且未解析成功，节点认证解析会失败关闭（不会用远程回退来掩盖）。
- 在 `gateway.mode=remote` 中，远程客户端字段（`gateway.remote.token` / `gateway.remote.password`）也会根据远程优先级规则纳入候选。
- 节点主机认证解析只识别 `OPENCLAW_GATEWAY_*` 环境变量。

对于连接到可信私有网络上非 local loopback `ws://` Gateway 网关的节点，请设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。如果不设置，节点启动会失败关闭，并要求你使用 `wss://`、SSH 隧道或 Tailscale。
这是一个进程环境变量 opt-in，不是 `openclaw.json` 配置键。
当 `openclaw node install` 的安装命令环境中存在该变量时，它会将其持久化到受监管的节点服务中。

## 服务（后台）

将无头节点主机安装为用户服务。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway 网关 WebSocket 主机（默认：`127.0.0.1`）
- `--port <port>`：Gateway 网关 WebSocket 端口（默认：`18789`）
- `--tls`：为 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖节点 ID（清除配对令牌）
- `--display-name <name>`：覆盖节点显示名称
- `--runtime <runtime>`：服务运行时（`node` 或 `bun`）
- `--force`：如果已安装，则重新安装/覆盖

管理服务：

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

使用 `openclaw node run` 运行前台节点主机（无服务）。

服务命令接受 `--json` 以输出机器可读结果。

节点主机会在进程内重试 Gateway 网关重启和网络关闭。如果 Gateway 网关报告终止性的令牌/密码/bootstrap 认证暂停，节点主机会记录关闭详情并以非零状态退出，以便 launchd/systemd 能使用新的配置和凭据重启它。需要配对的暂停会留在前台流程中，以便待处理请求可以被批准。

## 配对

首次连接会在 Gateway 网关上创建一个待处理的设备配对请求（`role: node`）。
通过以下方式批准它：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

在严格控制的节点网络中，Gateway 网关操作员可以显式 opt in，允许来自可信 CIDR 的首次节点配对自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

默认情况下此功能被禁用。它只适用于没有请求范围的新 `role: node` 配对。操作员/浏览器客户端、Control UI、WebChat，以及角色、范围、元数据或公钥升级仍需要手动批准。

如果节点使用变更后的认证详情（角色/范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

节点主机会将其节点 ID、令牌、显示名称和 Gateway 网关连接信息存储在
`~/.openclaw/node.json` 中。

## Exec 审批

`system.run` 受本地 exec 审批控制：

- `~/.openclaw/exec-approvals.json`
- [Exec 审批](/zh-CN/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从 Gateway 网关编辑）

对于已批准的异步节点 exec，OpenClaw 会在提示前准备规范的 `systemRunPlan`。
随后获批的 `system.run` 转发会复用存储的计划，因此在创建审批请求之后对命令/cwd/会话字段的编辑会被拒绝，而不是改变节点要执行的内容。

## 相关

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)

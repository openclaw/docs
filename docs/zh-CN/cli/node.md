---
read_when:
    - 运行无头节点主机
    - 为 `system.run` 配对非 macOS 节点
summary: '`openclaw node` 的 CLI 参考（无头节点主机）'
title: 节点
x-i18n:
    generated_at: "2026-07-12T21:23:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c350655e902f36ecf578c98edf0583ee6621dea6b916cc8da08c35673fef8e49
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

运行一个连接到 Gateway 网关 WebSocket，并在此计算机上公开
`system.run` / `system.which` 的**无头节点主机**。

在 macOS 上，菜单栏应用已将此节点主机运行时嵌入其自身的
节点连接中，并添加了 Mac 原生能力。仅当你有意在 Mac 上运行一个不使用该应用的无头节点时，
才使用 `openclaw node run`。同时运行两者会为同一台计算机创建两个节点身份。

## 为什么使用节点主机？

当你希望智能体在网络中的**其他计算机上运行命令**，而不想在那里安装完整的
macOS 配套应用时，请使用节点主机。

常见用例：

- 在远程 Linux/Windows 计算机上运行命令（构建服务器、实验室计算机、NAS）。
- 在 Gateway 网关上保持 Exec **沙箱隔离**，但将获批的运行委托给其他主机。
- 为自动化或 CI 节点提供轻量级无头执行目标。

节点主机上的 **Exec 审批**和按 Agent 配置的允许列表仍会保护执行，
因此你可以让命令访问保持范围明确且需显式授权。

`openclaw node run` 连接后可以发布由插件或 MCP 支持的工具。
默认情况下，Gateway 网关信任来自已配对节点的描述符，同时要求
每个描述符的命令仍处于该节点获批的命令范围内。智能体会将每个被接受的描述符视为普通插件工具，
但执行仍通过 `node.invoke` 进行，因此断开节点连接后，新
智能体运行中将不再有该工具。Gateway 网关操作员可以使用
`gateway.nodes.pluginTools.enabled: false` 禁用发布。

对于声明式 MCP 工具，请在节点计算机上的 `openclaw.json` 中，
在 `nodeHost.mcp.servers` 下添加常规 MCP 服务器结构，然后重启
节点主机。节点会声明受审批保护的 `mcp.tools.call.v1` 命令
族，并在连接后发布列出的工具；以后更改服务器列表
无需重新配对。请参阅
[节点托管的 MCP 服务器](/zh-CN/nodes#node-hosted-mcp-servers)。

## 浏览器代理（零配置）

如果节点上未禁用 `browser.enabled`，节点主机会自动公布浏览器代理。
这样，智能体无需额外配置即可在该节点上使用浏览器自动化。

默认情况下，代理公开节点的常规浏览器配置文件范围。如果设置
`nodeHost.browserProxy.allowProfiles`，代理将变为限制模式：
不在允许列表中的配置文件目标会被拒绝，并且持久配置文件的
创建/删除路由会被代理阻止。

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

- `--host <host>`：Gateway 网关 WebSocket 主机（默认值：`127.0.0.1`）
- `--port <port>`：Gateway 网关 WebSocket 端口（默认值：`18789`）
- `--context-path <path>`：Gateway 网关 WebSocket 上下文路径（例如 `/openclaw-gw`）。会附加到 WebSocket URL。
- `--tls`：对 Gateway 网关连接使用 TLS
- `--no-tls`：即使本地 Gateway 网关配置启用了 TLS，也强制使用明文 Gateway 网关连接
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖存储在 `node.json` 中的旧版客户端实例 ID（不会重置配对）
- `--display-name <name>`：覆盖节点显示名称

## 节点主机的 Gateway 网关身份验证

`openclaw node run` 和 `openclaw node install` 从配置/环境变量解析 Gateway 网关身份验证（节点命令没有 `--token`/`--password` 标志）：

- 首先检查 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 然后回退到本地配置：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机有意不继承 `gateway.remote.token` / `gateway.remote.password`。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但无法解析，节点身份验证解析将以失败关闭方式终止（不会由远程回退掩盖）。
- 在 `gateway.mode=remote` 中，远程客户端字段（`gateway.remote.token` / `gateway.remote.password`）也会按照远程优先级规则纳入考虑。
- 节点主机身份验证解析仅采用 `OPENCLAW_GATEWAY_*` 环境变量。

对于连接到明文 `ws://` Gateway 网关的节点，接受环回地址、私有 IP
字面量、`.local` 和 Tailnet `*.ts.net` 主机。对于其他
受信任的私有 DNS 名称，请设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`；如果不设置，
节点启动将以失败关闭方式终止，并要求你使用 `wss://`、SSH 隧道或
Tailscale。这是进程环境层面的主动选择，而不是 `openclaw.json` 配置
键。
如果该变量存在于安装命令的环境中，`openclaw node install` 会将其持久化到
受监管的节点服务中。

## 服务（后台）

将无头节点主机安装为用户服务（macOS 上使用 launchd，Linux 上使用 systemd，
Windows 上使用 Windows Task Scheduler）。

```bash
openclaw node install --host <gateway-host> --port 18789
```

选项：

- `--host <host>`：Gateway 网关 WebSocket 主机（默认值：`127.0.0.1`）
- `--port <port>`：Gateway 网关 WebSocket 端口（默认值：`18789`）
- `--context-path <path>`：Gateway 网关 WebSocket 上下文路径（例如 `/openclaw-gw`）。会附加到 WebSocket URL。
- `--tls`：对 Gateway 网关连接使用 TLS
- `--tls-fingerprint <sha256>`：预期的 TLS 证书指纹（sha256）
- `--node-id <id>`：覆盖存储在 `node.json` 中的旧版客户端实例 ID（不会重置配对）
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

使用 `openclaw node run` 运行前台节点主机（不使用服务）。

服务命令接受 `--json`，以输出机器可读的结果。

节点主机会在进程内重试 Gateway 网关重启和网络连接关闭。如果
Gateway 网关报告因令牌/密码/引导身份验证而进入终止性暂停状态，节点主机
会记录连接关闭详情并以非零状态退出，以便 launchd/systemd/Task Scheduler
能够使用最新配置和凭据将其重启。需要配对的暂停会保留在
前台流程中，以便批准待处理的请求。

## 配对

首次连接会在 Gateway 网关上创建一个待处理的设备配对请求（`role: node`）。

当 Gateway 网关主机能够以非交互方式通过 SSH 连接到节点主机时（相同用户、
受信任的主机密钥），系统会自动批准待处理请求：Gateway 网关
通过 SSH 在节点主机上运行 `openclaw node identity --json`，并在
设备密钥完全匹配时批准。这项功能默认启用；有关要求以及如何禁用它
（`gateway.nodes.pairing.sshVerify: false`），请参阅
[通过 SSH 验证的设备自动批准](/zh-CN/gateway/pairing#ssh-verified-device-auto-approval-default)。

否则，请通过以下命令手动批准：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

检查 Gateway 网关用于验证的本地节点身份：

```bash
openclaw node identity --json
```

它会输出 `identity/device.json` 中的设备 ID 和公钥，并且绝不会
创建或修改身份文件。

在受到严格控制的节点网络中，Gateway 网关操作员可以显式选择
对来自受信任 CIDR 的首次节点配对进行自动批准：

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

此功能默认禁用（未设置 `autoApproveCidrs`）。它仅适用于
没有请求权限范围，且来自 Gateway 网关所信任客户端 IP 的全新 `role: node` 配对。
操作员/浏览器客户端、Control UI、WebChat，以及角色、
权限范围、元数据或公钥升级仍需手动批准。

如果节点使用已更改的身份验证详情（角色/权限范围/公钥）重试配对，
先前的待处理请求将被取代，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

### 身份和配对状态

无头节点将其旧版客户端实例 ID 与 Gateway 网关用于配对和路由的
已签名设备身份分开保存。这些文件位于
OpenClaw 状态目录中（默认为 `~/.openclaw`，设置后则为 `$OPENCLAW_STATE_DIR`）：

| 文件                        | 用途                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | 旧版 `nodeId` 键下的客户端实例 ID、显示名称和 Gateway 网关连接元数据。客户端将此值作为 `instanceId` 发送。 |
| `identity/device.json`      | 已签名的 Ed25519 密钥对和派生设备 ID。对于签名连接，此设备 ID 是用于路由的节点 ID 和配对身份。              |
| `identity/device-auth.json` | 已配对的设备令牌，以加密设备 ID 和角色为键。                                                                              |

`--node-id` 只会更改 `node.json` 中的客户端实例 ID。它不会
更改加密设备 ID，也不会清除配对身份验证。仅删除
`node.json` 同样不会重置配对。要撤销节点并重新配对：

1. 在 Gateway 网关上运行 `openclaw nodes remove --node <id|name|ip>`。
2. 在节点上使用 `openclaw node restart` 重启已安装的服务，或
   停止并重新运行前台 `openclaw node run` 命令。这会启动
   设备配对流程。如果 `openclaw devices list` 未显示请求，
   且节点报告 `AUTH_DEVICE_TOKEN_MISMATCH`，请再重启或重新运行一次。
   被拒绝的尝试会清除现已撤销的本地令牌；下一次
   尝试即可请求配对。
3. 在 Gateway 网关上运行 `openclaw devices list`，然后运行
   `openclaw devices approve <deviceRequestId>`。
4. 再次重启或重新运行节点。因配对而暂停的客户端在批准后不会
   自动恢复；此次重新连接会创建单独的
   命令范围请求。
5. 在 Gateway 网关上运行 `openclaw nodes pending`，然后运行
   `openclaw nodes approve <nodeRequestId>`。

这两个请求 ID 各不相同。适用的受信任 CIDR 策略可以
自动批准首次设备配对步骤；命令范围批准仍是
一项单独检查。

旧版 OpenClaw 版本可能会在 `node.json` 中留下旧版 `token` 字段。
当前 OpenClaw 不使用该字段，并会在节点主机下次保存文件时将其删除。
请将 `identity/` 下的两个文件都保持私密；它们包含
设备密钥对和身份验证令牌。

## Exec 审批

`system.run` 受本地 Exec 审批控制：

- `$OPENCLAW_STATE_DIR/exec-approvals.json`，或者在未设置该变量时使用
  `~/.openclaw/exec-approvals.json`
- [Exec 审批](/zh-CN/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`（从 Gateway 网关编辑）

对于获批的异步节点 Exec，OpenClaw 会在提示审批前准备规范的 `systemRunPlan`。
后续获批的 `system.run` 转发会复用所存储的
计划，因此审批请求创建后对命令/cwd/会话字段的编辑会被拒绝，
而不会改变节点实际执行的内容。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [节点](/zh-CN/nodes)

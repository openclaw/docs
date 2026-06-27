---
read_when:
    - 运行或调试 Gateway 网关进程
summary: Gateway 网关服务、生命周期和运维运行手册
title: Gateway 网关运行手册
x-i18n:
    generated_at: "2026-06-27T02:02:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

使用此页面进行 Gateway 网关服务的第一天启动和第二天运维。

<CardGroup cols={2}>
  <Card title="深度故障排除" icon="siren" href="/zh-CN/gateway/troubleshooting">
    以症状为先的诊断，包含精确的命令阶梯和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
  <Card title="密钥管理" icon="key-round" href="/zh-CN/gateway/secrets">
    SecretRef 契约、运行时快照行为，以及迁移/重新加载操作。
  </Card>
  <Card title="Secrets plan 契约" icon="shield-check" href="/zh-CN/gateway/secrets-plan-contract">
    精确的 `secrets apply` 目标/路径规则和仅引用的 auth-profile 行为。
  </Card>
</CardGroup>

## 5 分钟本地启动

<Steps>
  <Step title="启动 Gateway 网关">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="验证服务健康">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基线：`Runtime: running`、`Connectivity probe: ok`，以及与你预期匹配的 `Capability: ...`。当你需要读权限范围的 RPC 证明，而不只是可达性时，请使用 `openclaw gateway status --require-rpc`。

  </Step>

  <Step title="验证渠道就绪状态">

```bash
openclaw channels status --probe
```

在 Gateway 网关可达时，这会运行每个账号的实时渠道探测和可选审计。
如果 Gateway 网关不可达，CLI 会回退到仅基于配置的渠道摘要，而不是实时探测输出。

  </Step>
</Steps>

<Note>
Gateway 网关配置重新加载会监视活动配置文件路径（从 profile/state 默认值解析，或在设置 `OPENCLAW_CONFIG_PATH` 时使用它）。
默认模式是 `gateway.reload.mode="hybrid"`。
首次成功加载后，运行中的进程会提供活动的内存中配置快照；成功重新加载会以原子方式替换该快照。
</Note>

## 运行时模型

- 一个始终在线的进程，用于路由、控制平面和渠道连接。
- 单个复用端口用于：
  - WebSocket 控制/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 插件 HTTP 路由，例如可选的 `/api/v1/admin/rpc`
  - Control UI 和钩子
- 默认绑定模式：`loopback`。
- 默认需要认证。共享密钥设置使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 local loopback
  反向代理设置可以使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 兼容端点

OpenClaw 当前最高杠杆的兼容性表面是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

这组端点为什么重要：

- 大多数 Open WebUI、LobeChat 和 LibreChat 集成会先探测 `/v1/models`。
- 许多 RAG 和记忆流水线预期存在 `/v1/embeddings`。
- Agent 原生客户端越来越倾向于使用 `/v1/responses`。

规划说明：

- `/v1/models` 以 Agent 优先：它返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是稳定别名，始终映射到已配置的默认 Agent。
- 当你想要后端提供商/模型覆盖时，请使用 `x-openclaw-model`；否则，所选 Agent 的正常模型和嵌入设置仍然掌控行为。

所有这些都运行在主 Gateway 网关端口上，并使用与其余 Gateway 网关 HTTP API 相同的受信任操作员认证边界。

Admin HTTP RPC（`POST /api/v1/admin/rpc`）是一个独立的、默认关闭的插件路由，供无法使用 WebSocket RPC 的主机工具使用。请参阅 [Admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)。

### 端口和绑定优先级

| 设置      | 解析顺序                                              |
| ------------ | ------------------------------------------------------------- |
| Gateway 网关端口 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| 绑定模式    | CLI/override → `gateway.bind` → `loopback`                    |

已安装的 Gateway 网关服务会在 supervisor 元数据中记录解析后的 `--port`。更改 `gateway.port` 后，运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，以便 launchd/systemd/schtasks 在新端口上启动进程。

Gateway 网关启动会在为非 local loopback 绑定播种本地
Control UI 源时使用相同的有效端口和绑定。例如，`--bind lan --port 3000`
会在运行时验证执行前播种 `http://localhost:3000` 和 `http://127.0.0.1:3000`。
将任何远程浏览器源（例如 HTTPS 代理 URL）显式添加到
`gateway.controlUi.allowedOrigins`。

### 热重新加载模式

| `gateway.reload.mode` | 行为                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 不重新加载配置                           |
| `hot`                 | 仅应用热安全变更                |
| `restart`             | 遇到需要重新启动的变更时重新启动         |
| `hybrid`（默认）    | 安全时热应用，需要时重新启动 |

## 操作员命令集

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` 用于额外的服务发现（LaunchDaemons/systemd system
units/schtasks），而不是更深入的 RPC 健康探测。

## 多个 Gateway 网关（同一主机）

大多数安装应该在每台机器上运行一个 Gateway 网关。单个 Gateway 网关可以托管多个
Agent 和渠道。

只有在你有意需要隔离或救援 bot 时，才需要多个 Gateway 网关。

有用检查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期情况：

- `gateway status --deep` 可能报告 `Other gateway-like services detected (best effort)`
  并在陈旧的 launchd/systemd/schtasks 安装仍然存在时打印清理提示。
- 当不同的 Gateway 网关响应，或 OpenClaw 无法证明可达目标是同一个 Gateway 网关时，
  `gateway probe` 可能警告 `multiple reachable gateway identities`。
  指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或已配置远程 URL，是一个
  具有多个传输的 Gateway 网关，即使传输端口不同。
- 如果这是有意的，请为每个 Gateway 网关隔离端口、配置/状态和工作区根目录。

每个实例的检查清单：

- 唯一的 `gateway.port`
- 唯一的 `OPENCLAW_CONFIG_PATH`
- 唯一的 `OPENCLAW_STATE_DIR`
- 唯一的 `agents.defaults.workspace`

示例：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

详细设置：[/gateway/multiple-gateways](/zh-CN/gateway/multiple-gateways)。

## 远程访问

首选：Tailscale/VPN。
回退：SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后将客户端本地连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不会绕过 Gateway 网关认证。对于共享密钥认证，客户端即使通过隧道仍然
必须发送 `token`/`password`。对于携带身份的模式，
请求仍然必须满足该认证路径。
</Warning>

参见：[远程 Gateway 网关](/zh-CN/gateway/remote)、[认证](/zh-CN/gateway/authentication)、[Tailscale](/zh-CN/gateway/tailscale)。

## 监督和服务生命周期

对类似生产的可靠性使用受监督运行。

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 进行重新启动。不要将 `openclaw gateway stop` 和 `openclaw gateway start` 串联起来作为重新启动的替代。

在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`，这会从当前启动会话中移除 LaunchAgent，而不会持久化禁用状态，因此 KeepAlive 自动恢复在意外崩溃后仍然有效，且 `gateway start` 会干净地重新启用。若要在重新启动之间持久抑制自动重生，请传入 `--disable`：`openclaw gateway stop --disable`。

LaunchAgent 标签是 `ai.openclaw.gateway`（默认）或 `ai.openclaw.<profile>`（命名 profile）。`openclaw doctor` 会审计并修复服务配置漂移。

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要在注销后保持持久运行，请启用 lingering：

```bash
sudo loginctl enable-linger <user>
```

当你需要自定义安装路径时的手动用户单元示例：

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

原生 Windows 托管启动使用名为 `OpenClaw Gateway`
（或命名 profile 的 `OpenClaw Gateway (<profile>)`）的计划任务。如果创建计划任务
被拒绝，OpenClaw 会回退到每用户 Startup 文件夹启动器，
它指向状态目录内的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux (system service)">

对多用户/始终在线主机使用系统单元。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与用户单元相同的服务主体，但将其安装到
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，并在你的 `openclaw` 二进制文件位于其他位置时调整
`ExecStart=`。

不要同时让 `openclaw doctor --fix` 为相同 profile/端口安装用户级 Gateway 网关服务。当 Doctor 找到系统级 OpenClaw Gateway 网关服务时，会拒绝该自动安装；当系统单元拥有生命周期时，请使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## Dev profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认包括隔离的状态/配置，以及基础 Gateway 网关端口 `19001`。

## 协议快速参考（操作员视角）

- 第一个客户端帧必须是 `connect`。
- Gateway 网关返回 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）。
- `hello-ok.features.methods` / `events` 是保守的发现列表，而不是
  每个可调用辅助路由的生成式转储。
- 请求：`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、配对/审批生命周期事件，
  以及 `shutdown`。

Agent 运行分为两个阶段：

1. 立即接受确认（`status:"accepted"`）
2. 最终完成响应（`status:"ok"|"error"`），中间会流式传输 `agent` 事件。

参见完整协议文档：[Gateway 协议](/zh-CN/gateway/protocol)。

## 运维检查

### 存活性

- 打开 WS 并发送 `connect`。
- 预期收到带快照的 `hello-ok` 响应。

### 就绪性

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 间隙恢复

事件不会重放。遇到序列间隙时，先刷新状态（`health`、`system-presence`），再继续。

## 常见失败特征

| 特征                                                           | 可能的问题                                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 没有有效 Gateway 网关认证路径时绑定到非 loopback 地址                           |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突                                                                        |
| `Gateway start blocked: set gateway.mode=local`                | 配置设置为远程模式，或受损配置中缺少本地模式标记                                |
| `unauthorized` during connect                                  | 客户端和 Gateway 网关之间的认证不匹配                                           |

如需完整的诊断步骤，请使用 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)。

## 安全保证

- Gateway 网关协议客户端会在 Gateway 网关不可用时快速失败（不会隐式回退到直接渠道）。
- 无效/非连接首帧会被拒绝并关闭。
- 优雅关闭会在套接字关闭前发出 `shutdown` 事件。

---

相关：

- [故障排除](/zh-CN/gateway/troubleshooting)
- [后台进程](/zh-CN/gateway/background-process)
- [配置](/zh-CN/gateway/configuration)
- [健康](/zh-CN/gateway/health)
- [Doctor](/zh-CN/gateway/doctor)
- [认证](/zh-CN/gateway/authentication)

## 相关

- [配置](/zh-CN/gateway/configuration)
- [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting)
- [远程访问](/zh-CN/gateway/remote)
- [密钥管理](/zh-CN/gateway/secrets)

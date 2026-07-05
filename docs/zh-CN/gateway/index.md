---
read_when:
    - 运行或调试 Gateway 网关进程
summary: Gateway 网关服务、生命周期和运维的运行手册
title: Gateway 网关运行手册
x-i18n:
    generated_at: "2026-07-05T11:18:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a14b9b6e00a1ec68703d2c6587d0a42cd14acd70f44c72423f33f94035b802e
    source_path: gateway/index.md
    workflow: 16
---

使用本页完成 Gateway 网关服务的第 1 天启动和第 2 天运维。

<CardGroup cols={2}>
  <Card title="深度故障排查" icon="siren" href="/zh-CN/gateway/troubleshooting">
    按症状优先的诊断，包含精确的命令阶梯和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/zh-CN/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
  <Card title="密钥管理" icon="key-round" href="/zh-CN/gateway/secrets">
    SecretRef 契约、运行时快照行为，以及迁移/重新加载操作。
  </Card>
  <Card title="密钥计划契约" icon="shield-check" href="/zh-CN/gateway/secrets-plan-contract">
    精确的 `secrets apply` 目标/路径规则，以及仅引用的认证配置文件行为。
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

  <Step title="验证服务健康状态">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基线：`Runtime: running`、`Connectivity probe: ok`，以及与你预期匹配的 `Capability` 行。使用 `openclaw gateway status --require-rpc` 来证明读权限范围的 RPC，而不只是证明可达性。

  </Step>

  <Step title="验证渠道就绪状态">

```bash
openclaw channels status --probe
```

当 Gateway 网关可达时，这会运行实时的逐账户渠道探测和可选审计。如果 Gateway 网关不可达，CLI 会回退到仅基于配置的渠道摘要。

  </Step>
</Steps>

<Note>
Gateway 配置重载会监视活动配置文件路径（从配置文件/状态默认值解析，或在设置 `OPENCLAW_CONFIG_PATH` 时使用该路径）。默认模式是 `gateway.reload.mode="hybrid"`。首次成功加载后，正在运行的进程会提供活动的内存配置快照；成功重载会以原子方式替换该快照。
</Note>

## 运行时模型

- 一个始终在线的进程，用于路由、控制平面和渠道连接。
- 单个复用端口用于：
  - WebSocket 控制/RPC
  - HTTP API（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 插件 HTTP 路由，例如可选的 `/api/v1/admin/rpc`
  - Control UI 和钩子
- 默认绑定模式：`loopback`。在检测到的容器环境内，有效默认值是 `auto`（解析为 `0.0.0.0` 以支持端口转发），除非 Tailscale serve/funnel 处于活动状态，此时始终强制为 `loopback`。
- 默认要求认证。共享密钥设置使用 `gateway.auth.token` / `gateway.auth.password`（或 `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），非 loopback 的反向代理设置可以使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 兼容端点

OpenClaw 杠杆效应最高的兼容性表面：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

为什么这组端点重要：

- 大多数 Open WebUI、LobeChat 和 LibreChat 集成会先探测 `/v1/models`。
- 许多 RAG 和记忆流水线期望 `/v1/embeddings`。
- Agent 原生客户端越来越偏好 `/v1/responses`。

`/v1/models` 以 Agent 优先：它会为每个已配置的 Agent 返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。`openclaw/default` 是稳定别名，始终映射到已配置的默认 Agent。当你想覆盖后端提供商/模型时发送 `x-openclaw-model`；否则，所选 Agent 的常规模型和嵌入设置会继续掌控行为。

所有这些端点都在主 Gateway 网关端口上运行，并使用与其余 Gateway 网关 HTTP API 相同的可信操作员认证边界。

Admin HTTP RPC（`POST /api/v1/admin/rpc`）是一个独立的、默认关闭的插件路由，面向无法使用 WebSocket RPC 的主机工具。参见 [Admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)。

### 端口和绑定优先级

| 设置      | 解析顺序                                                     |
| ------------ | -------------------------------------------------------------------- |
| Gateway 网关端口 | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| 绑定模式    | CLI/override → `gateway.bind` → `loopback`（或容器中的 `auto`） |

已安装的 Gateway 网关服务会在 supervisor 元数据中记录解析后的 `--port`。更改 `gateway.port` 后，运行 `openclaw doctor --fix` 或 `openclaw gateway install --force`，以便 launchd/systemd/schtasks 在新端口上启动进程。

Gateway 网关启动时，在为非 loopback 绑定植入本地 Control UI 源时，会使用相同的有效端口和绑定。例如，`--bind lan --port 3000` 会先植入 `http://localhost:3000` 和 `http://127.0.0.1:3000`，然后再运行运行时验证。将任何远程浏览器源（例如 HTTPS 代理 URL）显式添加到 `gateway.controlUi.allowedOrigins`。

### 热重载模式

| `gateway.reload.mode` | 行为                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | 不重载配置                           |
| `hot`                 | 仅应用热安全更改                |
| `restart`             | 遇到需要重启的更改时重启         |
| `hybrid`（默认）    | 安全时热应用，需要时重启 |

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

`gateway status --deep` 用于额外的服务发现（LaunchDaemons/systemd 系统单元/schtasks），不是更深入的 RPC 健康探测。

## 多个 Gateway 网关（同一主机）

大多数安装应在每台机器上运行一个 Gateway 网关。单个 Gateway 网关可以托管多个 Agent 和渠道。只有在你有意需要隔离或救援 bot 时，才需要多个 Gateway 网关。

有用的检查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期结果：

- `gateway status --deep` 可以报告 `Other gateway-like services detected (best effort)`，并在仍存在过期 launchd/systemd/schtasks 安装时打印清理提示。
- 当不同 Gateway 网关做出响应，或 OpenClaw 无法证明可达目标是同一个 Gateway 网关时，`gateway probe` 可能警告 `multiple reachable gateway identities`。指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或已配置的远程 URL，是具有多个传输协议的一个 Gateway 网关，即使传输端口不同也是如此。
- 如果这是有意为之，请为每个 Gateway 网关隔离端口、配置/状态和工作区根目录。

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
回退方案：SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

然后将客户端本地连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不会绕过 Gateway 网关认证。对于共享密钥认证，即使通过隧道，客户端仍
必须发送 `token`/`password`。对于带身份的模式，
请求仍必须满足对应的认证路径。
</Warning>

参见：[Remote Gateway](/zh-CN/gateway/remote)、[Authentication](/zh-CN/gateway/authentication)、[Tailscale](/zh-CN/gateway/tailscale)。

## 监督和服务生命周期

将 supervised 运行用于接近生产环境的可靠性。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

使用 `openclaw gateway restart` 进行重启。不要把 `openclaw gateway stop` 和 `openclaw gateway start` 串联起来作为重启替代方案。

在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`。这会从当前启动会话中移除 LaunchAgent，而不会持久化禁用，因此 KeepAlive 自动恢复在意外崩溃后仍然有效，且 `gateway start` 会干净地重新启用。若要跨重启持久禁止自动重新生成，请传入 `--disable`：`openclaw gateway stop --disable`。

LaunchAgent 标签是 `ai.openclaw.gateway`（默认）或 `ai.openclaw.<profile>`（命名配置文件）。`openclaw doctor` 会审计并修复服务配置漂移。

  </Tab>

  <Tab title="Linux（systemd user）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

若要在注销后保持持久运行，请启用 lingering：

```bash
sudo loginctl enable-linger $(whoami)
```

在没有桌面会话的无头服务器上，重试 `systemctl --user` 命令之前，还要确保已设置 `XDG_RUNTIME_DIR`（`export XDG_RUNTIME_DIR=/run/user/$(id -u)`）。

当你需要自定义安装路径时，可使用手动用户单元示例：

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows（原生）">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

原生 Windows 托管启动使用名为 `OpenClaw Gateway`
（或命名配置文件的 `OpenClaw Gateway (<profile>)`）的计划任务。如果计划任务
创建被拒绝，OpenClaw 会回退到每用户 Startup 文件夹启动器，
该启动器指向状态目录内的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（系统服务）">

对多用户/始终在线主机使用系统单元。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与用户单元相同的服务主体，但将其安装到
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，并在你的 `openclaw` 二进制位于其他位置时调整
`ExecStart=`。

不要同时让 `openclaw doctor --fix` 为同一配置文件/端口安装用户级 Gateway 网关服务。当 Doctor 发现系统级 OpenClaw Gateway 网关服务时，会拒绝该自动安装；当系统单元拥有生命周期时，请使用 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。

  </Tab>
</Tabs>

## Dev 配置文件快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认值包括隔离的状态/配置和基础 Gateway 网关端口 `19001`。

## 协议快速参考（操作员视角）

- 第一个客户端帧必须是 `connect`。
- Gateway 网关返回带有 `snapshot`（`presence`、`health`、`stateVersion`、`uptimeMs`）以及 `policy` 限制（`maxPayload`、`maxBufferedBytes`、`tickIntervalMs`）的 `hello-ok` 帧。
- `hello-ok.features.methods` / `events` 是保守的发现列表，不是
  每个可调用辅助路由的生成式转储。
- 请求：`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.operation`、`session.tool`、`sessions.changed`、
  `presence`、`tick`、`health`、`heartbeat`、配对/审批生命周期事件，
  以及 `shutdown`。

Agent 运行分两个阶段：

1. 立即接受确认（`status:"accepted"`）
2. 最终完成响应（`status:"ok"|"error"`），期间会流式传输 `agent` 事件。

参见完整协议文档：[Gateway Protocol](/zh-CN/gateway/protocol)。

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

### 缺口恢复

事件不会重放。遇到序列缺口时，先刷新状态（`health`、`system-presence`），再继续。

## 常见故障特征

| 特征                                                           | 可能问题                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 没有有效 Gateway 网关凭证路径时绑定到非 local loopback 地址                   |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突                                                                      |
| `Gateway start blocked: set gateway.mode=local`                | 配置设为远程模式，或损坏的配置中缺少 `gateway.mode`                           |
| 连接期间出现 `unauthorized`                                   | 客户端与 Gateway 网关之间的凭证不匹配                                         |

如需完整诊断路径，请使用 [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)。

## 安全保证

- Gateway 网关协议客户端会在 Gateway 网关不可用时快速失败（不会隐式回退到直接渠道）。
- 无效或非连接型首帧会被拒绝并关闭。
- 优雅关闭会在套接字关闭前发出 `shutdown` 事件。

## 相关

- [配置](/zh-CN/gateway/configuration)
- [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting)
- [后台进程](/zh-CN/gateway/background-process)
- [健康](/zh-CN/gateway/health)
- [Doctor](/zh-CN/gateway/doctor)
- [身份验证](/zh-CN/gateway/authentication)
- [远程访问](/zh-CN/gateway/remote)
- [密钥管理](/zh-CN/gateway/secrets)

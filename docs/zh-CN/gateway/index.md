---
read_when:
    - 运行或调试 Gateway 网关进程
summary: Gateway 网关服务、生命周期和运维的运行手册
title: Gateway 网关运行手册
x-i18n:
    generated_at: "2026-04-05T08:23:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec17674370de4e171779389c83580317308a4f07ebf335ad236a47238af18e1
    source_path: gateway/index.md
    workflow: 15
---

# Gateway 网关运行手册

使用本页处理 Gateway 网关服务的 day-1 启动和 day-2 运维。

<CardGroup cols={2}>
  <Card title="深度故障排除" icon="siren" href="/gateway/troubleshooting">
    按症状组织的诊断，包含精确的命令阶梯和日志特征。
  </Card>
  <Card title="配置" icon="sliders" href="/gateway/configuration">
    面向任务的设置指南 + 完整配置参考。
  </Card>
  <Card title="密钥管理" icon="key-round" href="/gateway/secrets">
    SecretRef 契约、运行时快照行为，以及迁移/重载操作。
  </Card>
  <Card title="密钥计划契约" icon="shield-check" href="/gateway/secrets-plan-contract">
    精确的 `secrets apply` 目标/路径规则，以及仅 ref 的 auth-profile 行为。
  </Card>
</CardGroup>

## 5 分钟本地启动

<Steps>
  <Step title="启动 Gateway 网关">

```bash
openclaw gateway --port 18789
# 调试/跟踪输出镜像到 stdio
openclaw gateway --port 18789 --verbose
# 强制终止所选端口上的监听器，然后启动
openclaw gateway --force
```

  </Step>

  <Step title="验证服务健康状态">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

健康基线：`Runtime: running` 和 `RPC probe: ok`。

  </Step>

  <Step title="验证渠道就绪状态">

```bash
openclaw channels status --probe
```

当 Gateway 网关可访问时，这会运行按账户划分的实时渠道探测和可选审计。
如果 Gateway 网关不可访问，CLI 会回退到仅基于配置的渠道摘要，而不是实时探测输出。

  </Step>
</Steps>

<Note>
Gateway 网关配置重载会监视活动配置文件路径（从 profile/状态默认值解析，或在设置了 `OPENCLAW_CONFIG_PATH` 时使用它）。
默认模式是 `gateway.reload.mode="hybrid"`。
首次成功加载后，运行中的进程会提供活动的内存配置快照；成功重载会以原子方式替换该快照。
</Note>

## 运行时模型

- 一个始终在线的进程，用于路由、控制平面和渠道连接。
- 单个复用端口用于：
  - WebSocket 控制/RPC
  - HTTP API、OpenAI 兼容接口（`/v1/models`、`/v1/embeddings`、`/v1/chat/completions`、`/v1/responses`、`/tools/invoke`）
  - 控制 UI 和 hooks
- 默认绑定模式：`loopback`。
- 默认要求鉴权。共享密钥部署使用
  `gateway.auth.token` / `gateway.auth.password`（或
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`），而非 loopback 的
  反向代理部署可使用 `gateway.auth.mode: "trusted-proxy"`。

## OpenAI 兼容端点

OpenClaw 当前最有杠杆效应的兼容接口集是：

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

为什么这组接口重要：

- 大多数 Open WebUI、LobeChat 和 LibreChat 集成会首先探测 `/v1/models`。
- 许多 RAG 和记忆流水线依赖 `/v1/embeddings`。
- 原生智能体客户端越来越倾向于使用 `/v1/responses`。

规划说明：

- `/v1/models` 是智能体优先的：它返回 `openclaw`、`openclaw/default` 和 `openclaw/<agentId>`。
- `openclaw/default` 是稳定别名，始终映射到配置的默认智能体。
- 当你想覆盖后端 provider/model 时，请使用 `x-openclaw-model`；否则所选智能体的常规模型和嵌入设置仍将保持控制。

所有这些都运行在主 Gateway 网关端口上，并使用与 Gateway 网关其余 HTTP API 相同的受信任操作员鉴权边界。

### 端口和绑定优先级

| Setting      | 解析顺序                                              |
| ------------ | ----------------------------------------------------- |
| Gateway port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind mode    | CLI/覆盖值 → `gateway.bind` → `loopback`                    |

### 热重载模式

| `gateway.reload.mode` | 行为                                   |
| --------------------- | -------------------------------------- |
| `off`                 | 不重载配置                           |
| `hot`                 | 仅应用热安全更改                |
| `restart`             | 遇到需要重启的更改时重启         |
| `hybrid`（默认）    | 安全时热应用，需要时重启 |

## 操作员命令集

```bash
openclaw gateway status
openclaw gateway status --deep   # 添加系统级服务扫描
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` 用于额外的服务发现（LaunchDaemons/systemd system
units/schtasks），而不是更深层的 RPC 健康探测。

## 多个 Gateway 网关（同一主机）

大多数安装应每台机器运行一个 Gateway 网关。单个 Gateway 网关可以托管多个
智能体和渠道。

只有当你明确需要隔离或救援机器人时，才需要多个 Gateway 网关。

实用检查：

```bash
openclaw gateway status --deep
openclaw gateway probe
```

预期行为：

- `gateway status --deep` 可能报告 `Other gateway-like services detected (best effort)`
  并在仍存在陈旧 launchd/systemd/schtasks 安装时打印清理提示。
- 当多个目标都有响应时，`gateway probe` 可能警告 `multiple reachable gateways`。
- 如果这是有意为之，请为每个 Gateway 网关隔离端口、配置/状态和工作区根目录。

详细设置：[/gateway/multiple-gateways](/gateway/multiple-gateways)。

## 远程访问

首选：Tailscale/VPN。
回退：SSH 隧道。

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

然后在本地将客户端连接到 `ws://127.0.0.1:18789`。

<Warning>
SSH 隧道不会绕过 Gateway 网关鉴权。对于共享密钥鉴权，客户端即使通过隧道
仍然必须发送 `token`/`password`。对于带身份模式，
请求仍然必须满足该鉴权路径。
</Warning>

参见：[Remote Gateway](/gateway/remote)、[Authentication](/gateway/authentication)、[Tailscale](/gateway/tailscale)。

## 监管和服务生命周期

对于接近生产环境的可靠性，请使用受监管运行。

<Tabs>
  <Tab title="macOS（launchd）">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

LaunchAgent 标签为 `ai.openclaw.gateway`（默认）或 `ai.openclaw.<profile>`（命名 profile）。`openclaw doctor` 会审计并修复服务配置漂移。

  </Tab>

  <Tab title="Linux（systemd user）">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

如需在注销后持续运行，请启用 lingering：

```bash
sudo loginctl enable-linger <user>
```

当你需要自定义安装路径时，可使用手动 user unit 示例：

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
的 Scheduled Task（命名 profile 时为 `OpenClaw Gateway (<profile>)`）。如果创建 Scheduled Task
被拒绝，OpenClaw 会回退到按用户的 Startup 文件夹启动器，该启动器指向状态目录中的 `gateway.cmd`。

  </Tab>

  <Tab title="Linux（系统服务）">

对于多用户/始终在线主机，请使用 system unit。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

使用与 user unit 相同的服务主体，但将其安装到
`/etc/systemd/system/openclaw-gateway[-<profile>].service` 下，并在
你的 `openclaw` 二进制文件位于其他位置时调整 `ExecStart=`。

  </Tab>
</Tabs>

## 一台主机上的多个 Gateway 网关

大多数部署应只运行**一个** Gateway 网关。
只有在需要严格隔离/冗余时才使用多个（例如救援 profile）。

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

参见：[多个 Gateway 网关](/gateway/multiple-gateways)。

### 开发 profile 快速路径

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

默认值包括隔离的状态/配置以及基础 Gateway 网关端口 `19001`。

## 协议快速参考（操作员视角）

- 客户端第一帧必须是 `connect`。
- Gateway 网关返回 `hello-ok` 快照（`presence`、`health`、`stateVersion`、`uptimeMs`、limits/policy）。
- `hello-ok.features.methods` / `events` 是保守的发现列表，而不是
  所有可调用辅助路由的自动生成清单。
- 请求：`req(method, params)` → `res(ok/payload|error)`。
- 常见事件包括 `connect.challenge`、`agent`、`chat`、
  `session.message`、`session.tool`、`sessions.changed`、`presence`、`tick`、
  `health`、`heartbeat`、配对/批准生命周期事件，以及 `shutdown`。

智能体运行分两阶段：

1. 立即接受确认（`status:"accepted"`）
2. 最终完成响应（`status:"ok"|"error"`），期间会穿插流式 `agent` 事件。

完整协议文档见：[Gateway Protocol](/gateway/protocol)。

## 运维检查

### 存活性

- 打开 WS 并发送 `connect`。
- 预期收到带快照的 `hello-ok` 响应。

### 就绪状态

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### 间隙恢复

事件不会重放。若出现序列间隙，请先刷新状态（`health`、`system-presence`），然后再继续。

## 常见故障特征

| Signature                                                      | Likely issue                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | 非 loopback 绑定但没有有效的 Gateway 网关鉴权路径                             |
| `another gateway instance is already listening` / `EADDRINUSE` | 端口冲突                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | 配置被设为远程模式，或受损配置中缺少本地模式标记 |
| `unauthorized` during connect                                  | 客户端与 Gateway 网关之间的鉴权不匹配                                        |

如需完整诊断阶梯，请使用 [Gateway 故障排除](/gateway/troubleshooting)。

## 安全保证

- 当 Gateway 网关不可用时，Gateway protocol 客户端会快速失败（不会隐式回退到直连渠道）。
- 非法/非 connect 的首帧会被拒绝并关闭连接。
- 优雅关闭会在 socket 关闭前发出 `shutdown` 事件。

---

相关内容：

- [故障排除](/gateway/troubleshooting)
- [后台进程](/gateway/background-process)
- [配置](/gateway/configuration)
- [健康状态](/gateway/health)
- [Doctor](/gateway/doctor)
- [鉴权](/gateway/authentication)

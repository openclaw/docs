---
read_when:
    - 从 CLI 运行 Gateway 网关（开发或服务器环境）
    - 调试 Gateway 网关认证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）—— 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-04-23T06:17:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60706df4d3c49271c4b53029eaae16672dde534c7f6f4ce68e04b58fb0cfa467
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway 网关 CLI

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。

本页中的子命令都位于 `openclaw gateway …` 之下。

相关文档：

- [/gateway/bonjour](/zh-CN/gateway/bonjour)
- [/gateway/discovery](/zh-CN/gateway/discovery)
- [/gateway/configuration](/zh-CN/gateway/configuration)

## 运行 Gateway 网关

运行一个本地 Gateway 网关进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

说明：

- 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。对于临时 / 开发运行，可使用 `--allow-unconfigured`。
- `openclaw onboard --mode local` 和 `openclaw setup` 预期会写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为已损坏或被覆盖的配置，并进行修复，而不是隐式假定为本地模式。
- 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测为 local”。
- 未启用认证时，禁止绑定到 loopback 之外的地址（安全护栏）。
- `SIGUSR1` 会在获得授权时触发进程内重启（默认启用 `commands.restart`；将 `commands.restart: false` 设为禁用手动重启，但 gateway 工具 / 配置 apply / update 仍然允许）。
- `SIGINT` / `SIGTERM` 处理程序会停止 gateway 进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw mode 输入包装了 CLI，请在退出前恢复终端。

### 选项

- `--port <port>`：WebSocket 端口（默认值来自配置 / 环境变量；通常为 `18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`：监听器绑定模式。
- `--auth <token|password>`：认证模式覆盖。
- `--token <token>`：token 覆盖（也会为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
- `--password <password>`：密码覆盖。警告：内联密码可能会暴露在本地进程列表中。
- `--password-file <path>`：从文件读取 gateway 密码。
- `--tailscale <off|serve|funnel>`：通过 Tailscale 暴露 Gateway 网关。
- `--tailscale-reset-on-exit`：关闭时重置 Tailscale serve / funnel 配置。
- `--allow-unconfigured`：允许在配置中没有 `gateway.mode=local` 时启动 gateway。此选项仅绕过临时 / 开发引导的启动保护；它不会写入或修复配置文件。
- `--dev`：如果缺失，则创建开发配置 + 工作区（跳过 `BOOTSTRAP.md`）。
- `--reset`：重置开发配置 + 凭证 + 会话 + 工作区（需要 `--dev`）。
- `--force`：启动前终止所选端口上任何现有的监听器。
- `--verbose`：详细日志。
- `--cli-backend-logs`：仅在控制台显示 CLI 后端日志（并启用 stdout / stderr）。
- `--ws-log <auto|full|compact>`：websocket 日志样式（默认 `auto`）。
- `--compact`：`--ws-log compact` 的别名。
- `--raw-stream`：将原始模型流事件记录到 jsonl。
- `--raw-stream-path <path>`：原始流 jsonl 路径。

启动性能分析：

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，可在 Gateway 网关启动期间记录各阶段耗时。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 以对 Gateway 网关启动进行基准测试。该基准会记录首个进程输出、`/healthz`、`/readyz` 以及启动追踪耗时。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

输出模式：

- 默认：便于阅读的格式（在 TTY 中带颜色）。
- `--json`：机器可读 JSON（无样式 / 无 spinner）。
- `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留便于阅读的布局。

共享选项（在支持的地方）：

- `--url <url>`：Gateway 网关 WebSocket URL。
- `--token <token>`：Gateway 网关 token。
- `--password <password>`：Gateway 网关密码。
- `--timeout <ms>`：超时 / 预算（因命令而异）。
- `--expect-final`：等待 “final” 响应（智能体调用）。

注意：设置 `--url` 时，CLI 不会回退到配置或环境变量凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活性探针：一旦服务器可以响应 HTTP，它就会返回。HTTP `/readyz` 端点更严格；当启动 sidecar、渠道或已配置钩子仍在稳定过程中时，它会保持未就绪状态。

### `gateway usage-cost`

从会话日志中获取 usage-cost 摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

选项：

- `--days <days>`：要包含的天数（默认 `30`）。

### `gateway stability`

从正在运行的 Gateway 网关中获取最近的诊断稳定性记录器信息。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

选项：

- `--limit <limit>`：要包含的最近事件最大数量（默认 `25`，最大 `1000`）。
- `--type <type>`：按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
- `--since-seq <seq>`：只包含指定诊断序列号之后的事件。
- `--bundle [path]`：读取持久化的稳定性 bundle，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅 `--bundle`）可读取状态目录下最新的 bundle，也可直接传入 bundle JSON 路径。
- `--export`：写出一个可共享的支持诊断 zip，而不是打印稳定性详情。
- `--output <path>`：`--export` 的输出路径。

说明：

- 记录器默认启用。仅当你需要禁用 Gateway 网关诊断心跳采集时，才设置 `diagnostics.enabled: false`。
- 记录会保留运维元数据：事件名称、计数、字节大小、内存读数、队列 / 会话状态、渠道 / plugin 名称以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、token、cookie、secret 值、主机名或原始会话 id。
- 在 Gateway 网关发生致命退出、关闭超时和重启启动失败时，只要记录器中有事件，OpenClaw 就会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。可使用 `openclaw gateway stability --bundle latest` 检查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也同样适用于 bundle 输出。

### `gateway diagnostics export`

写出一个本地诊断 zip，专门用于附加到 bug 报告中。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

选项：

- `--output <path>`：输出 zip 路径。默认为状态目录下的支持导出文件。
- `--log-lines <count>`：要包含的已脱敏日志行最大数量（默认 `5000`）。
- `--log-bytes <bytes>`：要检查的最大日志字节数（默认 `1000000`）。
- `--url <url>`：用于健康快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于健康快照的 Gateway 网关 token。
- `--password <password>`：用于健康快照的 Gateway 网关密码。
- `--timeout <ms>`：状态 / 健康快照超时（默认 `3000`）。
- `--no-stability-bundle`：跳过持久化稳定性 bundle 查找。
- `--json`：以 JSON 输出写入路径、大小和清单。

该导出内容包括清单、Markdown 摘要、配置形状、已脱敏配置详情、已脱敏日志摘要、已脱敏 Gateway 网关状态 / 健康快照，以及存在时的最新稳定性 bundle。

它 предназначен 用于共享。它会保留有助于调试的运维细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、plugin id、provider id、非敏感功能设置以及已脱敏的运维日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭证、cookie、账户 / 消息标识符、提示 / 指令文本、主机名和 secret 值。当某条 LogTape 风格消息看起来像用户 / 聊天 / 工具负载文本时，导出内容只会保留“该消息已省略”以及其字节数。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks）以及可选的连接性 / 认证能力探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

选项：

- `--url <url>`：添加显式探测目标。仍会探测已配置的远程目标和 localhost。
- `--token <token>`：用于探测的 token 认证。
- `--password <password>`：用于探测的密码认证。
- `--timeout <ms>`：探测超时（默认 `10000`）。
- `--no-probe`：跳过连接性探测（仅服务视图）。
- `--deep`：同时扫描系统级服务。
- `--require-rpc`：将默认连接性探测升级为读取探测，并在该读取探测失败时以非零状态退出。不能与 `--no-probe` 一起使用。

说明：

- 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
- 默认的 `gateway status` 可以证明服务状态、WebSocket 连接以及握手时可见的认证能力。它不能证明读 / 写 / 管理操作。
- 在可能的情况下，`gateway status` 会解析为探测认证而配置的 auth SecretRefs。
- 如果在该命令路径中某个必需的 auth SecretRef 无法解析，并且探测连接 / 认证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传入 `--token` / `--password`，或先解析 secret 来源。
- 如果探测成功，则会抑制未解析的 auth-ref 警告，以避免误报。
- 当脚本和自动化场景中仅有监听服务还不够、并且你还需要读范围 RPC 调用也保持健康时，请使用 `--require-rpc`。
- `--deep` 会尽力扫描额外的 launchd/systemd/schtasks 安装。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数环境应每台机器只运行一个 gateway。
- 人类可读输出包含已解析的文件日志路径，以及 CLI 与服务之间配置路径 / 有效性的快照，以帮助诊断 profile 或状态目录漂移。
- 在 Linux systemd 安装中，服务认证漂移检查会同时读取 unit 中 `Environment=` 和 `EnvironmentFile=` 的值（包括 `%h`、带引号的路径、多个文件以及可选的 `-` 文件）。
- 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRefs（优先使用服务命令环境变量，其次回退到进程环境变量）。
- 如果 token 认证实际上未激活（显式 `gateway.auth.mode` 为 `password` / `none` / `trusted-proxy`，或 mode 未设置且 password 可能胜出并且不存在可胜出的 token 候选），则 token 漂移检查会跳过配置 token 解析。

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你已配置的远程 gateway（如果已设置），以及
- localhost（local loopback），**即使已经配置了远程目标**。

如果你传入 `--url`，这个显式目标会被添加到前面。人类可读输出会将
目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

如果有多个 gateway 可达，它会全部打印出来。当你使用隔离的 profile / 端口（例如救援机器人）时，支持多个 gateway，但大多数安装仍只运行单个 gateway。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解释：

- `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 表示探测能够证明的认证能力。它与可达性是分开的。
- `Read probe: ok` 表示读范围的详细 RPC 调用（`health` / `status` / `system-presence` / `config.get`）也成功了。
- `Read probe: limited - missing scope: operator.read` 表示连接成功，但读范围 RPC 受限。这会被报告为**降级**可达性，而不是完全失败。
- 仅当所有被探测目标都不可达时，退出码才为非零。

JSON 说明（`--json`）：

- 顶层：
  - `ok`：至少有一个目标可达。
  - `degraded`：至少有一个目标的详细 RPC 受作用域限制。
  - `capability`：在所有可达目标中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
  - `primaryTargetId`：按以下顺序视为活动优先目标的最佳目标：显式 URL、SSH 隧道、已配置的远程目标，然后是 local loopback。
  - `warnings[]`：尽力提供的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
  - `network`：根据当前配置和主机网络推导出的 local loopback / tailnet URL 提示。
  - `discovery.timeoutMs` 和 `discovery.count`：本次探测实际使用的发现预算 / 结果数量。
- 每个目标（`targets[].connect`）：
  - `ok`：连接后并经过降级分类后的可达性。
  - `rpcOk`：完整详细 RPC 成功。
  - `scopeLimited`：由于缺少 operator 作用域，详细 RPC 失败。
- 每个目标（`targets[].auth`）：
  - `role`：可用时，在 `hello-ok` 中报告的认证角色。
  - `scopes`：可用时，在 `hello-ok` 中报告的已授予作用域。
  - `capability`：该目标对外呈现的认证能力分类。

常见警告代码：

- `ssh_tunnel_failed`：SSH 隧道建立失败；命令已回退为直接探测。
- `multiple_gateways`：有多个目标可达；除非你有意运行隔离的 profile（例如救援机器人），否则这并不常见。
- `auth_secretref_unresolved`：某个已配置的 auth SecretRef 无法为失败目标解析。
- `probe_scope_limited`：WebSocket 连接成功，但读取探测因缺少 `operator.read` 而受限。

#### 通过 SSH 连接远程目标（与 Mac 应用一致）

macOS 应用的“Remote over SSH”模式使用本地端口转发，使远程 gateway（其绑定可能仅限 loopback）能够通过 `ws://127.0.0.1:<port>` 访问。

CLI 等效命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

选项：

- `--ssh <target>`：`user@host` 或 `user@host:port`（端口默认为 `22`）。
- `--ssh-identity <path>`：身份文件。
- `--ssh-auto`：从已解析的发现端点中，将第一个发现到的 gateway 主机选作 SSH 目标
  （`local.` 加上已配置的广域域名（如果有））。仅包含 TXT 的
  提示会被忽略。

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

底层 RPC 辅助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

选项：

- `--params <json>`：用于 params 的 JSON 对象字符串（默认 `{}`）
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

说明：

- `--params` 必须是有效的 JSON。
- `--expect-final` 主要用于智能体风格的 RPC，这类调用会先流式发送中间事件，再发送最终负载。

## 管理 Gateway 网关服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

命令选项：

- `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
- `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
- `gateway uninstall|start|stop|restart`：`--json`

说明：

- `gateway install` 支持 `--port`、`--runtime`、`--token`、`--force`、`--json`。
- 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 可解析，但不会将解析出的 token 持久化到服务环境元数据中。
- 如果 token 认证需要 token，而配置的 token SecretRef 无法解析，安装会以安全关闭方式失败，而不是持久化后备明文。
- 对于 `gateway run` 的密码认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
- 在推断认证模式下，仅在 shell 中设置的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装时的 token 要求；安装托管服务时，请使用持久化配置（`gateway.auth.password` 或配置中的 `env`）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则会阻止安装，直到明确设置 mode。
- 生命周期命令接受 `--json` 以便脚本使用。

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（示例：`openclaw.internal.`），并设置 split DNS + DNS 服务器；参见 [/gateway/bonjour](/zh-CN/gateway/bonjour)

只有启用了 Bonjour 发现功能的 gateway（默认启用）才会广播信标。

广域发现记录包含（TXT）：

- `role`（gateway 角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；缺失时客户端会默认 SSH 目标端口为 `22`）
- `tailnetDns`（可用时的 MagicDNS 主机名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 是否启用 + 证书指纹）
- `cliPath`（写入广域区域的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

选项：

- `--timeout <ms>`：每条命令的超时时间（browse / resolve）；默认 `2000`。
- `--json`：机器可读输出（也会禁用样式 / spinner）。

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

说明：

- CLI 会扫描 `local.` 以及已配置的广域域名（如果已启用）。
- JSON 输出中的 `wsUrl` 是从已解析的服务端点推导出来的，而不是来自仅 TXT 的
  提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，只有当
  `discovery.mdns.mode` 为 `full` 时，才会广播 `sshPort` 和 `cliPath`。广域 DNS-SD 仍会写入 `cliPath`；`sshPort`
  在那里也仍然是可选的。

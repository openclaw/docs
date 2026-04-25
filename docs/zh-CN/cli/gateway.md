---
read_when:
    - 从 CLI 运行 Gateway 网关（开发或服务器）
    - 调试 Gateway 网关认证、绑定模式和连接性
    - 通过 Bonjour 发现网关（本地 + 广域 DNS-SD）
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）——运行、查询和发现网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-04-25T22:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce8f72ad74fc2956520c1c3af2252a5b22b3bda0f2023c5ca76cf8cddb1c0edb
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway 网关 CLI

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。

本页中的子命令位于 `openclaw gateway …` 下。

相关文档：

- [/gateway/bonjour](/zh-CN/gateway/bonjour)
- [/gateway/discovery](/zh-CN/gateway/discovery)
- [/gateway/configuration](/zh-CN/gateway/configuration)

## 运行 Gateway 网关

运行本地 Gateway 网关进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

说明：

- 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。对于临时/开发运行，请使用 `--allow-unconfigured`。
- 预期 `openclaw onboard --mode local` 和 `openclaw setup` 会写入 `gateway.mode=local`。如果该文件存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置，并修复它，而不是隐式假定为本地模式。
- 如果该文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测本地”。
- 未启用认证时，禁止绑定到 loopback 之外的地址（安全护栏）。
- 当已获授权时，`SIGUSR1` 会触发进程内重启（默认启用 `commands.restart`；设置 `commands.restart: false` 可阻止手动重启，但 gateway 工具/config apply/update 仍然允许）。
- `SIGINT`/`SIGTERM` 处理程序会停止 gateway 进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw-mode 输入封装 CLI，请在退出前恢复终端。

### 选项

- `--port <port>`：WebSocket 端口（默认值来自配置/环境变量；通常为 `18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`：监听器绑定模式。
- `--auth <token|password>`：认证模式覆盖。
- `--token <token>`：token 覆盖（也会为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
- `--password <password>`：密码覆盖。警告：内联密码可能会暴露在本地进程列表中。
- `--password-file <path>`：从文件读取 gateway 密码。
- `--tailscale <off|serve|funnel>`：通过 Tailscale 暴露 Gateway 网关。
- `--tailscale-reset-on-exit`：关闭时重置 Tailscale serve/funnel 配置。
- `--allow-unconfigured`：允许在配置中没有 `gateway.mode=local` 的情况下启动 gateway。此选项仅绕过临时/开发引导的启动保护；不会写入或修复配置文件。
- `--dev`：如果缺失则创建开发配置 + 工作区（跳过 `BOOTSTRAP.md`）。
- `--reset`：重置开发配置 + 凭证 + 会话 + 工作区（需要 `--dev`）。
- `--force`：启动前终止所选端口上的任何现有监听器。
- `--verbose`：详细日志。
- `--cli-backend-logs`：仅在控制台显示 CLI 后端日志（并启用 stdout/stderr）。
- `--ws-log <auto|full|compact>`：websocket 日志样式（默认 `auto`）。
- `--compact`：`--ws-log compact` 的别名。
- `--raw-stream`：将原始模型流事件记录到 jsonl。
- `--raw-stream-path <path>`：原始流 jsonl 路径。

启动分析：

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 以在 Gateway 网关启动期间记录各阶段耗时。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 以对 Gateway 网关启动进行基准测试。该基准会记录首个进程输出、`/healthz`、`/readyz` 和启动跟踪耗时。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

输出模式：

- 默认：人类可读（在 TTY 中带颜色）。
- `--json`：机器可读 JSON（无样式/旋转指示器）。
- `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类可读布局。

共享选项（在支持的地方）：

- `--url <url>`：Gateway 网关 WebSocket URL。
- `--token <token>`：Gateway 网关 token。
- `--password <password>`：Gateway 网关密码。
- `--timeout <ms>`：超时/预算（因命令而异）。
- `--expect-final`：等待“final”响应（智能体调用）。

注意：当你设置 `--url` 时，CLI 不会回退到配置或环境变量凭证。
请显式传递 `--token` 或 `--password`。缺少显式凭证会报错。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活探针：一旦服务器可以响应 HTTP，它就会返回。HTTP `/readyz` 端点更严格，在启动 sidecar、渠道或已配置钩子仍在稳定期间，它会持续显示未就绪。

### `gateway usage-cost`

从会话日志中获取 usage-cost 汇总。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

选项：

- `--days <days>`：要包含的天数（默认 `30`）。

### `gateway stability`

从正在运行的 Gateway 网关中获取最近的诊断稳定性记录器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

选项：

- `--limit <limit>`：要包含的最近事件最大数量（默认 `25`，最大 `1000`）。
- `--type <type>`：按诊断事件类型过滤，例如 `payload.large` 或 `diagnostic.memory.pressure`。
- `--since-seq <seq>`：仅包含某个诊断序列号之后的事件。
- `--bundle [path]`：读取持久化的稳定性 bundle，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅 `--bundle`）读取状态目录下最新的 bundle，或直接传入 bundle JSON 路径。
- `--export`：写出可共享的支持诊断 zip，而不是打印稳定性详情。
- `--output <path>`：`--export` 的输出路径。

说明：

- 记录会保留运维元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称，以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、token、cookie、密钥值、主机名或原始会话 id。设置 `diagnostics.enabled: false` 可完全禁用记录器。
- 在 Gateway 网关致命退出、关闭超时和重启启动失败时，只要记录器中有事件，OpenClaw 就会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 可检查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也适用于 bundle 输出。

### `gateway diagnostics export`

写出一个本地诊断 zip，用于附加到缺陷报告。
有关隐私模型和 bundle 内容，请参见 [Diagnostics Export](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

选项：

- `--output <path>`：输出 zip 路径。默认为状态目录下的支持导出文件。
- `--log-lines <count>`：要包含的最大脱敏日志行数（默认 `5000`）。
- `--log-bytes <bytes>`：要检查的最大日志字节数（默认 `1000000`）。
- `--url <url>`：用于健康状态快照的 Gateway 网关 WebSocket URL。
- `--token <token>`：用于健康状态快照的 Gateway 网关 token。
- `--password <password>`：用于健康状态快照的 Gateway 网关密码。
- `--timeout <ms>`：status/health 快照超时（默认 `3000`）。
- `--no-stability-bundle`：跳过持久化稳定性 bundle 查找。
- `--json`：以 JSON 格式打印写出的路径、大小和清单。

该导出包含清单、Markdown 摘要、配置形状、脱敏配置详情、脱敏日志摘要、脱敏后的 Gateway 网关 status/health 快照，以及存在时的最新稳定性 bundle。

它 предназначено 用于共享。它会保留有助于调试的运维细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件 id、provider id、非敏感功能设置，以及已脱敏的运维日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭证、cookie、账户/消息标识符、提示词/指令文本、主机名和密钥值。当某条 LogTape 风格消息看起来像用户/聊天/工具负载文本时，导出只会保留“某条消息已被省略”及其字节计数。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks），以及可选的连接性/认证能力探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

选项：

- `--url <url>`：添加一个显式探测目标。仍会探测已配置的远程目标 + localhost。
- `--token <token>`：用于探测的 token 认证。
- `--password <password>`：用于探测的密码认证。
- `--timeout <ms>`：探测超时（默认 `10000`）。
- `--no-probe`：跳过连接性探测（仅服务视图）。
- `--deep`：也扫描系统级服务。
- `--require-rpc`：将默认的连接性探测升级为读探测，并在该读探测失败时以非零状态退出。不能与 `--no-probe` 结合使用。

说明：

- 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
- 默认的 `gateway status` 可证明服务状态、WebSocket 连接，以及握手时可见的认证能力。它不能证明读/写/管理操作。
- 对于首次设备认证，诊断探测是非变更性的：如果已有缓存的设备 token，它们会复用该 token，但不会仅为检查状态而创建新的 CLI 设备身份或只读设备配对记录。
- 在可能的情况下，`gateway status` 会解析已配置的认证 SecretRef 以用于探测认证。
- 如果在此命令路径中未解析某个必需的认证 SecretRef，且探测连接/认证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传递 `--token`/`--password`，或先解析密钥来源。
- 如果探测成功，则会抑制未解析 auth-ref 的警告，以避免误报。
- 在脚本和自动化中，当仅有监听服务还不够、且你还需要读作用域 RPC 调用健康时，请使用 `--require-rpc`。
- `--deep` 会尽力扫描额外的 launchd/systemd/schtasks 安装。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数设置应在每台机器上只运行一个 gateway。
- 人类可读输出包含已解析的文件日志路径，以及 CLI 与服务的配置路径/有效性快照，以帮助诊断 profile 或状态目录漂移。
- 在 Linux systemd 安装中，服务认证漂移检查会同时读取单元中的 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件以及可选的 `-` 文件）。
- 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRef（优先使用服务命令环境变量，其次回退到进程环境变量）。
- 如果 token 认证实际上未激活（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可能获胜，同时没有任何 token 候选可能获胜），则 token 漂移检查会跳过配置 token 解析。

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你已配置的远程 gateway（如果已设置），以及
- localhost（loopback），**即使已配置远程目标**。

如果你传递 `--url`，该显式目标会添加在这两者之前。人类可读输出会将
这些目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

如果可访问多个网关，它会打印全部结果。当你使用隔离的 profile/端口时，支持多个网关（例如 rescue bot），但大多数安装仍只运行单个 gateway。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解释：

- `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
- `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 表示探测能够证明的认证能力。它与可达性是分开的。
- `Read probe: ok` 表示读作用域的详情 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功了。
- `Read probe: limited - missing scope: operator.read` 表示连接成功，但读作用域 RPC 受限。这会被报告为**降级的**可达性，而不是完全失败。
- 与 `gateway status` 一样，probe 会复用现有缓存的设备认证，但不会创建首次设备身份或配对状态。
- 仅当所有已探测目标都不可达时，退出码才为非零。

JSON 说明（`--json`）：

- 顶层：
  - `ok`：至少有一个目标可达。
  - `degraded`：至少有一个目标的详情 RPC 受到作用域限制。
  - `capability`：在可达目标中观察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
  - `primaryTargetId`：按以下顺序视为当前活动优胜目标的最佳目标：显式 URL、SSH 隧道、已配置的远程目标，然后是本地 local loopback。
  - `warnings[]`：尽力提供的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
  - `network`：根据当前配置和主机网络推导出的本地 local loopback/tailnet URL 提示。
  - `discovery.timeoutMs` 和 `discovery.count`：本次探测实际使用的设备发现预算/结果数量。
- 每个目标（`targets[].connect`）：
  - `ok`：连接 + 降级分类后的可达性。
  - `rpcOk`：完整详情 RPC 成功。
  - `scopeLimited`：由于缺少 operator 作用域而导致详情 RPC 失败。
- 每个目标（`targets[].auth`）：
  - `role`：在可用时，由 `hello-ok` 报告的认证角色。
  - `scopes`：在可用时，由 `hello-ok` 报告的已授予作用域。
  - `capability`：该目标暴露出的认证能力分类。

常见警告代码：

- `ssh_tunnel_failed`：SSH 隧道建立失败；该命令回退为直接探测。
- `multiple_gateways`：有多个目标可达；除非你有意运行隔离的 profile（例如 rescue bot），否则这通常不常见。
- `auth_secretref_unresolved`：某个已配置的认证 SecretRef 无法为失败目标解析。
- `probe_scope_limited`：WebSocket 连接成功，但读探测因缺少 `operator.read` 而受限。

#### 通过 SSH 连接远程目标（与 Mac 应用一致）

macOS 应用的“Remote over SSH”模式使用本地端口转发，使远程 gateway（可能仅绑定到 loopback）可以通过 `ws://127.0.0.1:<port>` 访问。

等效的 CLI：

```bash
openclaw gateway probe --ssh user@gateway-host
```

选项：

- `--ssh <target>`：`user@host` 或 `user@host:port`（端口默认为 `22`）。
- `--ssh-identity <path>`：身份文件。
- `--ssh-auto`：从已解析的设备发现端点中，选择第一个已发现的 gateway 主机作为 SSH 目标（`local.` 加上已配置的广域域名（如果有））。仅 TXT 的提示会被忽略。

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

底层 RPC 辅助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

选项：

- `--params <json>`：params 的 JSON 对象字符串（默认 `{}`）
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

说明：

- `--params` 必须是有效的 JSON。
- `--expect-final` 主要用于智能体风格的 RPC，这类 RPC 会在最终负载之前流式传输中间事件。

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
- 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证该 SecretRef 可被解析，但不会将解析出的 token 持久化到服务环境元数据中。
- 如果 token 认证需要 token，而已配置的 token SecretRef 无法解析，则安装会以安全关闭方式失败，而不是持久化回退的明文。
- 对于 `gateway run` 的密码认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
- 在推断认证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装 token 要求；安装受管服务时，请使用持久配置（`gateway.auth.password` 或配置中的 `env`）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则安装会被阻止，直到显式设置模式。
- 生命周期命令接受 `--json` 以用于脚本编写。

## 发现网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（例如：`openclaw.internal.`）并设置 split DNS + DNS 服务器；参见 [/gateway/bonjour](/zh-CN/gateway/bonjour)

只有启用了 Bonjour 设备发现的网关（默认启用）才会广播该信标。

广域设备发现记录包含（TXT）：

- `role`（网关角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；缺失时客户端默认 SSH 目标端口为 `22`）
- `tailnetDns`（可用时的 MagicDNS 主机名）
- `gatewayTls` / `gatewayTlsSha256`（TLS 已启用 + 证书指纹）
- `cliPath`（写入广域区域的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

选项：

- `--timeout <ms>`：每个命令的超时时间（browse/resolve）；默认 `2000`。
- `--json`：机器可读输出（也会禁用样式/旋转指示器）。

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

说明：

- CLI 会扫描 `local.`，以及启用时已配置的广域域名。
- JSON 输出中的 `wsUrl` 来自已解析的服务端点，而不是仅 TXT 的
  提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，只有当
  `discovery.mdns.mode` 为 `full` 时，才会广播 `sshPort` 和 `cliPath`。广域 DNS-SD 仍会写入 `cliPath`；`sshPort`
  在那里也仍然是可选的。

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关身份验证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）——运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-04-27T08:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c909e8f6e1fb56b612eb1a0826cd993626c9f65b1736924b33c95a37dc60d14
    source_path: cli/gateway.md
    workflow: 15
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令都位于 `openclaw gateway …` 之下。

<CardGroup cols={3}>
  <Card title="Bonjour 发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告并发现 Gateway 网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 Gateway 网关配置键。
  </Card>
</CardGroup>

## 运行 Gateway 网关

运行一个本地 Gateway 网关进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="启动行为">
    - 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。临时 / 开发运行可使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 预期会写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置，并修复它，而不是默认隐式假定为本地模式。
    - 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测为本地”。
    - 未启用身份验证时，禁止绑定到 loopback 之外的地址（安全护栏）。
    - 在获得授权时，`SIGUSR1` 会触发进程内重启（`commands.restart` 默认启用；设置 `commands.restart: false` 可阻止手动重启，但 gateway 工具 / 配置 apply/update 仍然允许）。
    - `SIGINT` / `SIGTERM` 处理器会停止 gateway 进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw-mode 输入封装 CLI，请在退出前恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自配置 / 环境变量；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  监听器绑定模式。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  身份验证模式覆盖值。
</ParamField>
<ParamField path="--token <token>" type="string">
  令牌覆盖值（也会为当前进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密码覆盖值。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  从文件读取 gateway 密码。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  通过 Tailscale 暴露 Gateway 网关。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  在关闭时重置 Tailscale serve / funnel 配置。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允许在配置中没有 `gateway.mode=local` 的情况下启动 gateway。仅用于临时 / 开发引导，绕过启动保护；不会写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置 + 凭证 + 会话 + 工作区（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  启动前终止所选端口上的任何现有监听器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  详细日志。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  仅在控制台中显示 CLI 后端日志（并启用 stdout / stderr）。
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  WebSocket 日志样式。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的别名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  将原始模型流事件记录到 jsonl。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始流 jsonl 路径。
</ParamField>

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。优先使用 `--password-file`、环境变量，或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### 启动性能分析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，可在 Gateway 网关启动期间记录各阶段耗时，包括每个阶段的 `eventLoopMax` 延迟，以及 installed-index、manifest registry、startup planning 和 owner-map 工作中的插件查找表耗时。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 以对 Gateway 网关启动进行基准测试。该基准会记录首个进程输出、`/healthz`、`/readyz`、启动跟踪耗时、事件循环延迟，以及插件查找表耗时详情。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（在 TTY 中带颜色）。
    - `--json`：机器可读 JSON（无样式 / 无 spinner）。
    - `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类可读布局。

  </Tab>
  <Tab title="共享选项">
    - `--url <url>`：Gateway 网关 WebSocket URL。
    - `--token <token>`：Gateway 网关令牌。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时 / 预算（因命令而异）。
    - `--expect-final`：等待“final”响应（智能体调用）。

  </Tab>
</Tabs>

<Note>
设置 `--url` 时，CLI 不会回退使用配置或环境变量中的凭证。请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活探针：一旦服务器可以响应 HTTP，它就会返回。HTTP `/readyz` 端点更严格，在启动 sidecar、渠道或已配置钩子仍在稳定期间会持续显示为未就绪。

### `gateway usage-cost`

从会话日志中获取 usage-cost 汇总。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天数。
</ParamField>

### `gateway stability`

从正在运行的 Gateway 网关获取最近的诊断稳定性记录器内容。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的最近事件的最大数量（最大为 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含某个诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性 bundle，而不是调用正在运行的 Gateway 网关。对状态目录下最新的 bundle 使用 `--bundle latest`（或仅 `--bundle`），或直接传入 bundle JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写出一个可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和 bundle 行为">
    - 记录会保留运维元数据：事件名称、计数、字节大小、内存读数、队列 / 会话状态、渠道 / 插件名称以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、cookie、秘密值、主机名或原始会话 ID。将 `diagnostics.enabled: false` 设为关闭，可完全禁用该记录器。
    - 在 Gateway 网关发生致命退出、关闭超时和重启启动失败时，如果记录器中有事件，OpenClaw 会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。可使用 `openclaw gateway stability --bundle latest` 检查最新 bundle；`--limit`、`--type` 和 `--since-seq` 同样适用于 bundle 输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写出一个本地诊断 zip，设计用于附加到 bug 报告。有关隐私模型和 bundle 内容，请参见 [Diagnostics Export](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认为状态目录下的支持导出文件。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已脱敏日志行最大数量。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要检查的最大日志字节数。
</ParamField>
<ParamField path="--url <url>" type="string">
  用于健康快照的 Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于健康快照的 Gateway 网关令牌。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于健康快照的 Gateway 网关密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Status / 健康快照超时。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化稳定性 bundle 查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印写入路径、大小和清单。
</ParamField>

该导出包含清单、Markdown 摘要、配置结构、已脱敏配置详情、已脱敏日志摘要、已脱敏 Gateway 网关状态 / 健康快照，以及存在时的最新稳定性 bundle。

它旨在被共享。它会保留有助于调试的运维细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件 ID、提供商 ID、非机密功能设置以及已脱敏的运维日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭证、cookie、账户 / 消息标识符、提示 / 指令文本、主机名和秘密值。当 LogTape 风格消息看起来像用户 / 聊天 / 工具负载文本时，导出只会保留“某条消息已被省略”及其字节计数。

### `gateway status`

`gateway status` 会显示 Gateway 网关服务（launchd / systemd / schtasks），以及可选的连接性 / 身份验证能力探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加显式探测目标。仍会探测已配置的远程地址和 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于探测的令牌身份验证。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于探测的密码身份验证。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探测超时。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳过连接性探测（仅服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  也扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将默认连接性探测升级为读取探测，并在该读取探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="Status 语义">
    - 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
    - 默认的 `gateway status` 可证明服务状态、WebSocket 连接以及握手时可见的身份验证能力。它不能证明读 / 写 / 管理操作。
    - 对于首次设备身份验证，诊断探针不会产生变更：如果已有缓存的设备令牌，它会复用该令牌，但不会仅为了检查状态而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能的情况下解析已配置的身份验证 SecretRef，用于探针身份验证。
    - 如果此命令路径中某个必需的身份验证 SecretRef 无法解析，且探针连接 / 身份验证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传入 `--token` / `--password`，或先解析对应的 secret 来源。
    - 如果探针成功，为避免误报，未解析的 auth-ref 警告会被抑制。
    - 当仅有监听服务还不够、你还需要读作用域的 RPC 调用也保持健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd / systemd / schtasks 安装项。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数环境应每台机器仅运行一个 gateway。
    - 人类可读输出会包含解析后的文件日志路径，以及 CLI 与服务配置路径 / 有效性快照，以帮助诊断 profile 或状态目录漂移。

  </Accordion>
  <Accordion title="Linux systemd 身份验证漂移检查">
    - 在 Linux systemd 安装中，服务身份验证漂移检查会同时读取单元中的 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件以及可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRef（优先使用服务命令环境变量，其次回退到进程环境变量）。
    - 如果令牌身份验证实际上未启用（显式 `gateway.auth.mode` 为 `password` / `none` / `trusted-proxy`，或 mode 未设置且 password 可能胜出，同时没有任何可能胜出的令牌候选值），则令牌漂移检查会跳过配置中的令牌解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你已配置的远程 gateway（如果已设置），以及
- localhost（local loopback），**即使已配置远程地址**。

如果你传入 `--url`，该显式目标会被添加到两者之前。人类可读输出会将目标标记为：

- `URL（显式）`
- `Remote（已配置）` 或 `Remote（已配置，未激活）`
- `Local loopback`

<Note>
如果有多个 gateway 可达，它会全部打印出来。当你使用隔离的 profile / 端口时，支持多个 gateway（例如 rescue bot），但大多数安装仍然只运行单个 gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="结果解读">
    - `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 表示探针能够证明的身份验证能力。它与可达性是分开的。
    - `Read probe: ok` 表示读作用域的详情 RPC 调用（`health` / `status` / `system-presence` / `config.get`）也成功了。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读作用域 RPC 受限。它会被报告为**降级**可达性，而不是完全失败。
    - 与 `gateway status` 一样，probe 会复用现有缓存的设备身份验证，但不会创建首次设备身份或配对状态。
    - 仅当所有被探测目标都不可达时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少有一个目标可达。
    - `degraded`：至少有一个目标的详情 RPC 因作用域限制而受限。
    - `capability`：所有可达目标中观测到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序选出的最佳活跃目标：显式 URL、SSH 隧道、已配置的远程目标，然后是 local loopback。
    - `warnings[]`：尽力生成的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
    - `network`：根据当前配置和主机网络推导出的 local loopback / tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：此次探测过程实际使用的设备发现预算 / 结果数量。

    每个目标（`targets[].connect`）：

    - `ok`：连接后并经过降级分类后的可达性。
    - `rpcOk`：完整详情 RPC 成功。
    - `scopeLimited`：详情 RPC 因缺少 operator 作用域而失败。

    每个目标（`targets[].auth`）：

    - `role`：在可用时，由 `hello-ok` 报告的身份验证角色。
    - `scopes`：在可用时，由 `hello-ok` 报告的已授予作用域。
    - `capability`：该目标暴露出的身份验证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道建立失败；命令已回退为直接探测。
    - `multiple_gateways`：可达目标不止一个；除非你有意运行隔离的 profile（例如 rescue bot），否则这并不常见。
    - `auth_secretref_unresolved`：某个失败目标的已配置身份验证 SecretRef 无法解析。
    - `probe_scope_limited`：WebSocket 连接成功，但读探针因缺少 `operator.read` 而受限。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 连接远程端（与 Mac 应用一致）

macOS 应用的“Remote over SSH”模式使用本地端口转发，使远程 gateway（其绑定地址可能仅为 loopback）可以通过 `ws://127.0.0.1:<port>` 访问。

等效 CLI：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（端口默认为 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身份文件。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  从解析后的设备发现端点（`local.` 加上已配置的广域域名（如果有））中，选择第一个发现到的 gateway 主机作为 SSH 目标。仅 TXT 的提示会被忽略。
</ParamField>

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

底层 RPC 帮助工具。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  参数的 JSON 对象字符串。
</ParamField>
<ParamField path="--url <url>" type="string">
  Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  Gateway 网关令牌。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 网关密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  超时预算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用于智能体风格的 RPC：在最终负载之前会先流式传输中间事件。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的 JSON 输出。
</ParamField>

<Note>
`--params` 必须是有效的 JSON。
</Note>

## 管理 Gateway 网关服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用 wrapper 安装

当托管服务必须通过另一个可执行文件启动时，请使用 `--wrapper`，例如
secret 管理器 shim 或 run-as helper。wrapper 会接收正常的 Gateway 网关参数，并负责最终使用这些参数执行 `openclaw` 或 Node。

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

你也可以通过环境变量设置 wrapper。`gateway install` 会验证该路径是
可执行文件，将 wrapper 写入服务的 `ProgramArguments`，并在服务环境中持久化
`OPENCLAW_WRAPPER`，供后续强制重装、更新和 Doctor 修复使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

要移除已持久化的 wrapper，请在重新安装时清空 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令选项">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway uninstall|start|stop|restart`：`--json`

  </Accordion>
  <Accordion title="生命周期行为">
    - 使用 `gateway restart` 重启托管服务。不要把 `gateway stop` 和 `gateway start` 串联起来作为重启替代方案；在 macOS 上，`gateway stop` 会先有意禁用 LaunchAgent，然后再停止它。
    - 生命周期命令接受 `--json`，便于脚本调用。

  </Accordion>
  <Accordion title="安装时的身份验证和 SecretRef">
    - 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 可解析，但不会将解析后的令牌持久化到服务环境元数据中。
    - 如果令牌身份验证需要令牌且已配置的令牌 SecretRef 无法解析，安装会以安全失败方式中止，而不是持久化回退的明文。
    - 对于 `gateway run` 的密码身份验证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，不要使用内联 `--password`。
    - 在推断身份验证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装时的令牌要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或配置中的 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则在显式设置 mode 之前会阻止安装。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（例如：`openclaw.internal.`），并设置 split DNS + DNS 服务器；参见 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 设备发现的 gateway（默认启用）才会通告该信标。

广域发现记录包含（TXT）：

- `role`（gateway 角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；缺失时客户端默认 SSH 目标端口为 `22`）
- `tailnetDns`（可用时的 MagicDNS 主机名）
- `gatewayTls` / `gatewayTlsSha256`（是否启用 TLS + 证书指纹）
- `cliPath`（写入广域 zone 的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每条命令的超时时间（browse / resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也会禁用样式 / spinner）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 会扫描 `local.`，以及启用时已配置的广域域名。
- JSON 输出中的 `wsUrl` 是从解析后的服务端点推导出来的，而不是来自仅 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，仅当 `discovery.mdns.mode` 为 `full` 时，才会广播 `sshPort` 和 `cliPath`。广域 DNS-SD 仍会写入 `cliPath`；`sshPort` 在那里也仍然是可选的。

</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

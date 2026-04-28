---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关的凭证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI (`openclaw gateway`) — 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-04-28T20:56:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 25680abf3f6f32fe9a5eea846ce6223c0d82896b5ae0bc09ea6bd8403ac34cfd
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令位于 `openclaw gateway …` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 设备发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告和发现 Gateway 网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 gateway 配置键。
  </Card>
</CardGroup>

## 运行 Gateway 网关

运行本地 Gateway 网关进程：

```bash
openclaw gateway
```

前台别名：

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="启动行为">
    - 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。仅将 `--allow-unconfigured` 用于临时/开发运行。
    - `openclaw onboard --mode local` 和 `openclaw setup` 应写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置并修复，而不是隐式假定为本地模式。
    - 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝替你“猜测为本地”。
    - 绑定到回环地址以外且没有身份验证会被阻止（安全护栏）。
    - `SIGUSR1` 在获得授权时会触发进程内重启（默认启用 `commands.restart`；设置 `commands.restart: false` 可阻止手动重启，而 Gateway 网关工具/配置的应用/更新仍会允许）。
    - `SIGINT`/`SIGTERM` 处理程序会停止 Gateway 网关进程，但不会恢复任何自定义终端状态。如果你用 TUI 或原始模式输入包装 CLI，请在退出前恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自配置/环境；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  监听器绑定模式。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  身份验证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  令牌覆盖（也会为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密码覆盖。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  从文件读取 Gateway 网关密码。
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  通过 Tailscale 暴露 Gateway 网关。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  关闭时重置 Tailscale serve/funnel 配置。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允许在配置中没有 `gateway.mode=local` 时启动 Gateway 网关。仅为临时/开发引导绕过启动保护；不会写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置 + 凭据 + 会话 + 工作区（需要 `--dev`）。
</ParamField>
<ParamField path="--force" type="boolean">
  启动前终止选定端口上的任何现有监听器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  详细日志。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  仅在控制台显示 CLI 后端日志（并启用 stdout/stderr）。
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

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 可在 Gateway 网关启动期间记录阶段耗时，包括每阶段 `eventLoopMax` 延迟，以及已安装索引、清单注册表、启动规划和 owner-map 工作的插件查询表耗时。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 可对 Gateway 网关启动进行基准测试。该基准测试会记录首个进程输出、`/healthz`、`/readyz`、启动跟踪耗时、事件循环延迟，以及插件查询表耗时详情。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（TTY 中带颜色）。
    - `--json`：机器可读 JSON（无样式/加载指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类可读布局。

  </Tab>
  <Tab title="共享选项">
    - `--url <url>`：Gateway 网关 WebSocket URL。
    - `--token <token>`：Gateway 网关令牌。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时/预算（因命令而异）。
    - `--expect-final`：等待“final”响应（智能体调用）。

  </Tab>
</Tabs>

<Note>
设置 `--url` 时，CLI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据是错误。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活探测：服务器能够响应 HTTP 后就会返回。HTTP `/readyz` 端点更严格，在启动边车、渠道或配置的钩子仍在稳定时会保持红色。本地或已认证的详细就绪响应包含一个 `eventLoop` 诊断块，其中包括事件循环延迟、事件循环利用率、CPU 核心比例和 `degraded` 标志。

### `gateway usage-cost`

从会话日志获取用量成本摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天数。
</ParamField>

### `gateway stability`

从正在运行的 Gateway 网关获取最近的诊断稳定性记录器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的最近事件最大数量（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性包，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅使用 `--bundle`）读取状态目录下的最新包，也可以直接传入包 JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和包行为">
    - 记录会保留运行元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称，以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、Cookie、秘密值、主机名或原始会话 ID。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 在 Gateway 网关致命退出、关闭超时和重启启动失败时，如果记录器中有事件，OpenClaw 会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新包；`--limit`、`--type` 和 `--since-seq` 也适用于包输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入本地诊断 zip，设计用于附加到 bug 报告。有关隐私模型和包内容，请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认为状态目录下的支持导出。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的最大已清理日志行数。
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
  Status/健康快照超时。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化稳定性包查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印写入路径、大小和清单。
</ParamField>

导出包含清单、Markdown 摘要、配置形状、已清理的配置详情、已清理的日志摘要、已清理的 Gateway 网关状态/健康快照，以及存在时的最新稳定性包。

它旨在用于共享。它保留有助于调试的运行详情，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件 ID、提供商 ID、非秘密功能设置，以及已脱敏的运行日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭据、Cookie、账户/消息标识符、提示/指令文本、主机名和秘密值。当 LogTape 风格的消息看起来像用户/聊天/工具载荷文本时，导出只保留消息已被省略这一事实及其字节数。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks），以及可选的连接性/身份验证能力探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加显式探测目标。仍会探测已配置的远程目标 + localhost。
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
  将默认连接性探测升级为读取探测，并在该读取探测失败时以非零状态退出。不能与 `--no-probe` 组合。
</ParamField>

<AccordionGroup>
  <Accordion title="Status 语义">
    - `gateway status` 即使在本地 CLI 配置缺失或无效时，也仍可用于诊断。
    - 默认的 `gateway status` 会验证服务状态、WebSocket 连接，以及握手时可见的身份验证能力。它不会验证读/写/管理员操作。
    - 诊断探测对于首次设备身份验证是非变更性的：当已有缓存设备令牌时会复用它，但不会仅为了检查状态而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能时为探测身份验证解析已配置的身份验证 SecretRefs。
    - 如果此命令路径中必需的身份验证 SecretRef 未解析，且探测连接性/身份验证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
    - 如果探测成功，会抑制未解析的 auth-ref 警告，以避免误报。
    - 当正在监听的服务还不够、你还需要读范围 RPC 调用也健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd/systemd/schtasks 安装。当检测到多个类似 Gateway 网关的服务时，人类可读输出会打印清理提示，并警告大多数设置应在每台机器上运行一个 Gateway 网关。
    - 人类可读输出包含已解析的文件日志路径，以及 CLI 与服务配置路径/有效性快照，帮助诊断配置文件或状态目录漂移。

  </Accordion>
  <Accordion title="Linux systemd 身份验证漂移检查">
    - 在 Linux systemd 安装中，服务身份验证漂移检查会从单元读取 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件以及可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRefs（先使用服务命令环境，再回退到进程环境）。
    - 如果令牌身份验证实际上未启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可能胜出并且没有令牌候选项可胜出），令牌漂移检查会跳过配置令牌解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你配置的远程 Gateway 网关（如果已设置），以及
- localhost（loopback）**即使已配置远程目标**。

如果你传入 `--url`，该显式目标会添加到两者之前。人类可读输出会将目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多个 Gateway 网关可访问，它会全部打印出来。当你使用隔离的配置文件/端口（例如救援机器人）时，支持多个 Gateway 网关，但大多数安装仍只运行单个 Gateway 网关。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解读">
    - `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测可验证的身份验证能力。它与可达性是分开的。
    - `Read probe: ok` 表示读范围详情 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功了。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读范围 RPC 受限。这会报告为**降级**可达性，而不是完全失败。
    - `Connect: ok` 之后的 `Read probe: failed` 表示 Gateway 网关接受了 WebSocket 连接，但后续读诊断超时或失败。这同样是**降级**可达性，而不是不可访问的 Gateway 网关。
    - 与 `gateway status` 类似，探测会复用现有缓存设备身份验证，但不会创建首次设备身份或配对状态。
    - 只有在没有任何被探测目标可达时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少一个目标可达。
    - `degraded`：至少一个目标接受了连接，但未完成完整详情 RPC 诊断。
    - `capability`：在可达目标中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序作为活跃胜出者处理的最佳目标：显式 URL、SSH 隧道、已配置远程目标，然后是 local loopback。
    - `warnings[]`：尽力提供的警告记录，包含 `code`、`message` 以及可选的 `targetIds`。
    - `network`：从当前配置和主机网络派生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：此次探测实际使用的设备发现预算/结果数量。

    每个目标（`targets[].connect`）：

    - `ok`：连接后的可达性 + 降级分类。
    - `rpcOk`：完整详情 RPC 成功。
    - `scopeLimited`：详情 RPC 因缺少操作员范围而失败。

    每个目标（`targets[].auth`）：

    - `role`：可用时在 `hello-ok` 中报告的身份验证角色。
    - `scopes`：可用时在 `hello-ok` 中报告的已授予范围。
    - `capability`：该目标暴露的身份验证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令已回退到直接探测。
    - `multiple_gateways`：多个目标可达；除非你有意运行隔离配置文件（例如救援机器人），否则这并不常见。
    - `auth_secretref_unresolved`：无法为失败目标解析已配置的身份验证 SecretRef。
    - `probe_scope_limited`：WebSocket 连接成功，但读探测因缺少 `operator.read` 而受限。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 访问远程（与 Mac 应用一致）

macOS 应用的“通过 SSH 访问远程”模式使用本地端口转发，让远程 Gateway 网关（可能只绑定到 loopback）可通过 `ws://127.0.0.1:<port>` 访问。

CLI 等效命令：

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
  从已解析的设备发现端点（`local.` 加上已配置的广域域名，如果有）中选择第一个发现的 Gateway 网关主机作为 SSH 目标。仅 TXT 提示会被忽略。
</ParamField>

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低层 RPC 辅助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  params 的 JSON 对象字符串。
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
  主要用于智能体式 RPC，这类 RPC 会在最终负载之前流式传输中间事件。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读 JSON 输出。
</ParamField>

<Note>
`--params` 必须是有效 JSON。
</Note>

## 管理 Gateway 网关服务

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### 使用包装器安装

当托管服务必须通过另一个可执行文件启动时使用 `--wrapper`，例如密钥管理器 shim 或 run-as 辅助程序。包装器会接收正常的 Gateway 网关参数，并负责最终用这些参数 exec `openclaw` 或 Node。

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

你也可以通过环境设置包装器。`gateway install` 会验证路径是可执行文件，将包装器写入服务 `ProgramArguments`，并在服务环境中持久化 `OPENCLAW_WRAPPER`，用于之后的强制重装、更新和 Doctor 修复。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

要移除已持久化的包装器，请在重新安装时清空 `OPENCLAW_WRAPPER`：

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
    - 使用 `gateway restart` 重启托管服务。不要将 `gateway stop` 和 `gateway start` 串联起来作为重启替代；在 macOS 上，`gateway stop` 会有意先禁用 LaunchAgent 再停止它。
    - 生命周期命令接受 `--json`，用于脚本。

  </Accordion>
  <Accordion title="安装时的身份验证和 SecretRefs">
    - 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 可解析，但不会将已解析令牌持久化到服务环境元数据中。
    - 如果令牌身份验证需要令牌且已配置的令牌 SecretRef 未解析，安装会封闭失败，而不是持久化回退明文。
    - 对于 `gateway run` 上的密码身份验证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或基于 SecretRef 的 `gateway.auth.password`，而不是内联 `--password`。
    - 在推断身份验证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装令牌要求；安装托管服务时请使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会被阻止，直到显式设置模式。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（示例：`openclaw.internal.`）并设置 split DNS + DNS 服务器；参见 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 设备发现（默认）的 Gateway 网关才会播发该信标。

广域设备发现记录包括（TXT）：

- `role`（Gateway 网关角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；当它不存在时，客户端默认 SSH 目标为 `22`）
- `tailnetDns`（MagicDNS 主机名，可用时）
- `gatewayTls` / `gatewayTlsSha256`（TLS 已启用 + 证书指纹）
- `cliPath`（写入广域区域的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每条命令的超时时间（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也会禁用样式/加载指示器）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 会在启用配置的广域域名时扫描 `local.` 加上该域名。
- JSON 输出中的 `wsUrl` 派生自解析后的服务端点，而不是来自仅 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，只有当 `discovery.mdns.mode` 为 `full` 时，才会广播 `sshPort` 和 `cliPath`。广域 DNS-SD 仍会写入 `cliPath`；`sshPort` 在那里也保持可选。

</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

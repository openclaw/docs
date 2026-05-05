---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关身份验证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI (`openclaw gateway`) — 运行、查询并发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-05-05T07:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89f798724971151cdd297fcdbbc1fe79dedc19f57521f2ad2c1fff0f9acf9b24
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令位于 `openclaw gateway …` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 设备发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告和查找 Gateway 网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 Gateway 网关配置键。
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
    - 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。将 `--allow-unconfigured` 用于临时/开发运行。
    - 预期 `openclaw onboard --mode local` 和 `openclaw setup` 会写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置并修复，而不是隐式假定为本地模式。
    - 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测本地模式”。
    - 不带身份验证绑定到 loopback 以外会被阻止（安全护栏）。
    - 获得授权时，`SIGUSR1` 会触发进程内重启（`commands.restart` 默认启用；设置 `commands.restart: false` 可阻止手动重启，同时仍允许 Gateway 网关工具/配置应用/更新）。
    - `SIGINT`/`SIGTERM` 处理程序会停止 Gateway 网关进程，但它们不会恢复任何自定义终端状态。如果你用 TUI 或 raw-mode 输入封装 CLI，请在退出前恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自配置/环境变量；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  监听器绑定模式。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  身份验证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  令牌覆盖（还会为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
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
  允许在配置中没有 `gateway.mode=local` 的情况下启动 Gateway 网关。仅为临时/开发 bootstrap 绕过启动保护；不会写入或修复配置文件。
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

## 重启 Gateway 网关

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --force
```

`openclaw gateway restart --safe` 会要求正在运行的 Gateway 网关在重启前对活跃的 OpenClaw 工作执行预检。如果排队操作、回复递送、嵌入式运行或任务运行处于活跃状态，Gateway 网关会报告阻塞项、合并重复的安全重启请求，并在活跃工作排空后重启。普通 `restart` 会保留现有服务管理器行为以实现兼容。仅当你明确需要立即覆盖路径时才使用 `--force`。

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。优先使用 `--password-file`、环境变量或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### 启动性能分析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 可在 Gateway 网关启动期间记录阶段耗时，包括每阶段的 `eventLoopMax` 延迟，以及已安装索引、清单注册表、启动规划和 owner-map 工作的插件查找表耗时。
- 将 `OPENCLAW_DIAGNOSTICS=timeline` 与 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 一起设置，可为外部 QA harness 写入尽力而为的 JSONL 启动诊断时间线。你也可以在配置中通过 `diagnostics.flags: ["timeline"]` 启用该标志；路径仍由环境变量提供。添加 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件循环样本。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 来对 Gateway 网关启动进行基准测试。基准会记录首次进程输出、`/healthz`、`/readyz`、启动跟踪耗时、事件循环延迟，以及插件查找表耗时详情。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（TTY 中带颜色）。
    - `--json`：机器可读 JSON（无样式/旋转指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：在保留人类可读布局的同时禁用 ANSI。

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
当你设置 `--url` 时，CLI 不会回退到配置或环境凭证。请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活探针：服务器能够响应 HTTP 后即返回。HTTP `/readyz` 端点更严格，在启动插件 sidecar、渠道或已配置钩子仍在稳定过程中时会保持红色。本地或已认证的详细就绪响应包含 `eventLoop` 诊断块，其中包含事件循环延迟、事件循环利用率、CPU 核心比例和 `degraded` 标志。

### `gateway usage-cost`

从会话日志获取 usage-cost 摘要。

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
  仅包含某个诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化稳定性包，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅 `--bundle`）读取状态目录下最新的包，或直接传入包 JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和包行为">
    - 记录会保留操作元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称，以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、cookie、密钥值、主机名或原始会话 ID。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 在 Gateway 网关致命退出、关闭超时和重启启动失败时，如果记录器有事件，OpenClaw 会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新包；`--limit`、`--type` 和 `--since-seq` 也适用于包输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入一个本地诊断 zip，设计用于附加到 bug 报告。有关隐私模型和包内容，请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认写入状态目录下的支持导出。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已清理日志行最大数量。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要检查的日志字节数上限。
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
  将写入的路径、大小和清单作为 JSON 打印。
</ParamField>

导出包含清单、Markdown 摘要、配置形状、已清理的配置详情、已清理的日志摘要、已清理的 Gateway 网关 Status/健康快照，以及存在时的最新稳定性包。

它旨在用于共享。它会保留有助于调试的操作详情，例如安全的 OpenClaw 日志字段、子系统名称、Status 代码、持续时间、已配置模式、端口、插件 ID、提供商 ID、非密钥功能设置，以及已脱敏的操作日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭证、cookie、账号/消息标识符、prompt/指令文本、主机名和密钥值。当 LogTape 风格消息看起来像用户/聊天/工具载荷文本时，导出只会保留消息已被省略这一事实及其字节数。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks）以及可选的连接/身份验证能力探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加一个显式探测目标。已配置的远程目标 + localhost 仍会被探测。
</ParamField>
<ParamField path="--token <token>" type="string">
  探测使用的令牌认证。
</ParamField>
<ParamField path="--password <password>" type="string">
  探测使用的密码认证。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探测超时。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳过连通性探测（仅服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同时扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将默认连通性探测升级为读取探测，并在该读取探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="Status 语义">
    - `gateway status` 即使在本地 CLI 配置缺失或无效时，也仍可用于诊断。
    - 默认的 `gateway status` 会证明服务状态、WebSocket 连接，以及握手时可见的认证能力。它不会证明读/写/管理员操作。
    - 诊断探测不会改变首次设备认证：已有缓存设备令牌时会复用它，但不会仅为了检查 Status 而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能时解析已配置的认证 SecretRefs，用于探测认证。
    - 如果此命令路径中必需的认证 SecretRef 未解析，`gateway status --json` 会在探测连通性/认证失败时报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析 secret 来源。
    - 如果探测成功，则会抑制未解析 auth-ref 警告以避免误报。
    - 当仅有监听中的服务还不够，而你还需要读作用域 RPC 调用也保持健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd/systemd/schtasks 安装。当检测到多个类似 Gateway 网关的服务时，人类可读输出会打印清理提示，并警告大多数设置应在每台机器上只运行一个 Gateway 网关。
    - 当服务进程为外部 supervisor 重启而干净退出时，`--deep` 也会报告最近一次 Gateway 网关 supervisor 重启交接。
    - 人类可读输出包含解析后的文件日志路径，以及 CLI 与服务配置路径/有效性快照，以帮助诊断 profile 或 state-dir 偏移。

  </Accordion>
  <Accordion title="Linux systemd 认证漂移检查">
    - 在 Linux systemd 安装中，服务认证漂移检查会从 unit 读取 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号的路径、多个文件，以及可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRefs（先使用服务命令环境，再回退到进程环境）。
    - 如果令牌认证实际上未激活（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可以胜出、同时没有令牌候选可以胜出），令牌漂移检查会跳过配置令牌解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试所有内容”的命令。它始终会探测：

- 你配置的远程 Gateway 网关（如果已设置），以及
- localhost（loopback），**即使已配置远程目标**。

如果传入 `--url`，该显式目标会被添加到两者之前。人类可读输出会将目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多个 Gateway 网关可达，它会全部打印出来。当你使用隔离的 profile/端口（例如救援 bot）时，支持多个 Gateway 网关，但大多数安装仍只运行一个 Gateway 网关。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解读">
    - `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测能证明的认证能力。它与可达性是分开的。
    - `Read probe: ok` 表示读作用域的详细 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读作用域 RPC 受限。这会报告为**降级**可达性，而不是完全失败。
    - `Connect: ok` 之后出现 `Read probe: failed` 表示 Gateway 网关接受了 WebSocket 连接，但后续读取诊断超时或失败。这也属于**降级**可达性，而不是 Gateway 网关不可达。
    - 与 `gateway status` 一样，探测会复用已有缓存设备认证，但不会创建首次设备身份或配对状态。
    - 仅当没有任何被探测目标可达时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少一个目标可达。
    - `degraded`：至少一个目标接受了连接，但没有完成完整的详细 RPC 诊断。
    - `capability`：在可达目标中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序视为活动胜出项的最佳目标：显式 URL、SSH tunnel、已配置远程目标，然后是 local loopback。
    - `warnings[]`：尽力生成的警告记录，包含 `code`、`message`，以及可选的 `targetIds`。
    - `network`：从当前配置和主机网络派生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：本次探测实际使用的设备发现预算/结果数量。

    每个目标（`targets[].connect`）：

    - `ok`：连接后的可达性 + 降级分类。
    - `rpcOk`：完整详细 RPC 成功。
    - `scopeLimited`：详细 RPC 因缺少 operator scope 而失败。

    每个目标（`targets[].auth`）：

    - `role`：可用时为 `hello-ok` 中报告的认证角色。
    - `scopes`：可用时为 `hello-ok` 中报告的已授予 scope。
    - `capability`：该目标呈现的认证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH tunnel 设置失败；命令已回退到直接探测。
    - `multiple_gateways`：超过一个目标可达；除非你有意运行隔离的 profile（例如救援 bot），否则这并不常见。
    - `auth_secretref_unresolved`：某个已配置的认证 SecretRef 无法为失败目标解析。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探测受限于缺少 `operator.read`。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 访问远程目标（与 Mac 应用一致）

macOS 应用的“通过 SSH 访问远程目标”模式会使用本地端口转发，让远程 Gateway 网关（可能只绑定到 loopback）可通过 `ws://127.0.0.1:<port>` 访问。

CLI 等价命令：

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
  从已解析的设备发现端点（`local.` 加上已配置的广域域名，如有）中选择第一个发现的 Gateway 网关主机作为 SSH 目标。仅 TXT 的提示会被忽略。
</ParamField>

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

低级 RPC 辅助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  用于 params 的 JSON 对象字符串。
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
  主要用于 agent 风格的 RPC，它们会在最终 payload 前流式传输中间事件。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读 JSON 输出。
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

### 使用包装器安装

当托管服务必须通过另一个可执行文件启动时使用 `--wrapper`，例如
secrets manager shim 或 run-as helper。包装器会接收正常的 Gateway 网关参数，并
负责最终 exec `openclaw` 或带有这些参数的 Node。

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

你也可以通过环境设置包装器。`gateway install` 会验证该路径是
可执行文件，将包装器写入服务 `ProgramArguments`，并在服务环境中持久化
`OPENCLAW_WRAPPER`，供后续强制重装、更新和 Doctor 修复使用。

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
    - `gateway restart`：`--safe`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start|stop`：`--json`

  </Accordion>
  <Accordion title="生命周期行为">
    - 使用 `gateway restart` 重启托管服务。不要将 `gateway stop` 和 `gateway start` 串联起来作为重启替代；在 macOS 上，`gateway stop` 会有意先禁用 LaunchAgent 再停止它。
    - `gateway restart --safe` 会要求正在运行的 Gateway 网关预检活跃的 OpenClaw 工作，并延迟重启，直到回复投递、嵌入式运行和任务运行排空。`--safe` 不能与 `--force` 或 `--wait` 组合使用。
    - `gateway restart --wait 30s` 会覆盖该次重启的已配置重启排空预算。裸数字表示毫秒；也接受 `s`、`m` 和 `h` 等单位。`--wait 0` 会无限期等待。
    - `gateway restart --force` 会跳过活跃工作排空并立即重启。当操作员已经检查列出的任务阻塞项，并希望 Gateway 网关立即恢复时使用它。
    - 生命周期命令接受 `--json`，便于脚本使用。

  </Accordion>
  <Accordion title="安装时的认证和 SecretRefs">
    - 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 可解析，但不会将解析出的 token 持久化到服务环境元数据中。
    - 如果 token 认证需要 token，而配置的 token SecretRef 未解析，安装会失败关闭，而不是持久化回退明文。
    - 对于 `gateway run` 上的密码认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
    - 在推断认证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装 token 要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，安装会被阻止，直到显式设置模式。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（示例：`openclaw.internal.`），并设置 split DNS + 一个 DNS 服务器；参见 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 设备发现的 Gateway 网关（默认）才会通告该信标。

广域设备发现记录包括（TXT）：

- `role`（Gateway 网关角色提示）
- `transport`（传输协议提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；缺失时客户端默认 SSH 目标为 `22`）
- `tailnetDns`（MagicDNS 主机名，可用时）
- `gatewayTls` / `gatewayTlsSha256`（TLS 已启用 + 证书指纹）
- `cliPath`（写入广域区域的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  单条命令超时（browse/resolve）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也会禁用样式和 spinner）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 会扫描 `local.`，以及启用时配置的广域域名。
- JSON 输出中的 `wsUrl` 派生自已解析的服务端点，而不是来自仅 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 上，只有当 `discovery.mdns.mode` 为 `full` 时才会广播 `sshPort` 和 `cliPath`。广域 DNS-SD 仍会写入 `cliPath`；`sshPort` 在那里也保持可选。

</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

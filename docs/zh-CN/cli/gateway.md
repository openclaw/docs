---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关凭证、绑定模式和连接性
    - 通过 Bonjour（本地 + 广域 DNS-SD）发现 Gateway 网关
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI (`openclaw gateway`) — 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-06-30T13:47:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c33900a9bdc61c1e922e424dbfce139c6591a7a5071ed8263b172e19bdf653b
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令位于 `openclaw gateway …` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 设备发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何发布和发现 Gateway 网关。
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
    - `openclaw onboard --mode local` 和 `openclaw setup` 应写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，请将其视为损坏或被覆盖的配置并修复，而不是隐式假定为本地模式。
    - 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测为本地”。
    - 不带认证绑定到 loopback 之外会被阻止（安全护栏）。
    - `lan`、`tailnet` 和 `custom` 当前通过仅 IPv4 的 BYOH 路径解析。
    - 仅 IPv6 的 BYOH 目前在此路径上不受原生支持。如果主机本身仅支持 IPv6，请使用 IPv4 sidecar 或代理。
    - `SIGUSR1` 在授权时触发进程内重启（`commands.restart` 默认启用；设置 `commands.restart: false` 可阻止手动重启，同时仍允许 Gateway 网关工具/配置 apply/update）。
    - `SIGINT`/`SIGTERM` 处理程序会停止 Gateway 网关进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw-mode 输入包装 CLI，请在退出前恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自配置/环境；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  监听器绑定模式。`lan`、`tailnet` 和 `custom` 当前通过仅 IPv4 的路径解析。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  认证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  令牌覆盖（也会为进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
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
<ParamField path="--bind custom + gateway.customBindHost" type="string">
  目前预期为 IPv4 地址。对于仅 IPv6 的 BYOH，请在 Gateway 网关前放置 IPv4 sidecar 或代理，并让 OpenClaw 指向该 IPv4 端点。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允许在配置中没有 `gateway.mode=local` 时启动 Gateway 网关。仅为临时/开发 bootstrap 绕过启动护栏；不会写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置 + 凭据 + 会话 + 工作区（需要 `--dev`）。
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
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` 会要求正在运行的 Gateway 网关预检活动工作，并在活动工作排空后调度一次合并后的重启。默认安全重启会等待活动工作，最长为配置的 `gateway.reload.deferralTimeoutMs`（默认 5 分钟）；当该预算用尽时会强制重启。将 `gateway.reload.deferralTimeoutMs` 设置为 `0`，可进行无限期安全等待且永不强制。普通 `restart` 保持现有 service-manager 行为；`--force` 仍是立即覆盖路径。

`openclaw gateway restart --safe --skip-deferral` 运行与 `--safe` 相同的 OpenClaw 感知协调重启，但会绕过活动工作延迟门禁，因此即使报告了阻塞项，Gateway 网关也会立即发出重启。当某个延迟被卡住的任务运行固定住，而单独使用 `--safe` 可能受 `gateway.reload.deferralTimeoutMs` 限制时，将其用作操作者逃生口。`--skip-deferral` 需要 `--safe`。

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。优先使用 `--password-file`、环境变量，或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### Gateway 网关性能剖析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 可在 Gateway 网关启动期间记录阶段耗时，包括每个阶段的 `eventLoopMax` 延迟，以及已安装索引、清单注册表、启动规划和 owner-map 工作的插件查找表耗时。
- 设置 `OPENCLAW_GATEWAY_RESTART_TRACE=1` 可记录重启范围的 `restart trace:` 行，涵盖重启信号处理、活动工作排空、关闭阶段、下一次启动、ready 耗时和内存指标。
- 设置 `OPENCLAW_DIAGNOSTICS=timeline` 并配合 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`，可为外部 QA harness 写入尽力而为的 JSONL 启动诊断时间线。你也可以在配置中用 `diagnostics.flags: ["timeline"]` 启用该标志；路径仍由环境提供。添加 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含 event-loop 样本。
- 先运行 `pnpm build`，再运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，以基于已构建的 CLI 入口对 Gateway 网关启动进行基准测试。该基准会记录首次进程输出、`/healthz`、`/readyz`、启动 trace 耗时、event-loop 延迟和插件查找表耗时详情。
- 先运行 `pnpm build`，再运行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，以在 macOS 或 Linux 上基于已构建的 CLI 入口对进程内 Gateway 网关重启进行基准测试。重启基准使用 SIGUSR1，在子进程中同时启用启动和重启 trace，并记录下一次 `/healthz`、下一次 `/readyz`、停机时间、ready 耗时、CPU、RSS 和重启 trace 指标。
- 将 `/healthz` 视为存活性，将 `/readyz` 视为可用就绪性。Trace 行和基准输出用于归属所有者；不要将一个 trace span 或一个样本视为完整的性能结论。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（TTY 中带颜色）。
    - `--json`：机器可读 JSON（无样式/加载指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：在保留人类布局的同时禁用 ANSI。

  </Tab>
  <Tab title="共享选项">
    - `--url <url>`：Gateway 网关 WebSocket URL。
    - `--token <token>`：Gateway 网关令牌。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时/预算（因命令而异）。
    - `--expect-final`：等待 “final” 响应（智能体调用）。

  </Tab>
</Tabs>

<Note>
设置 `--url` 时，CLI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据是错误。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP `/healthz` 端点是存活性探针：一旦服务器可以响应 HTTP，它就会返回。HTTP `/readyz` 端点更严格，在启动插件 sidecar、渠道或已配置的钩子仍在稳定时会保持红色。本地或已认证的详细就绪响应包含 `eventLoop` 诊断块，其中包含 event-loop 延迟、event-loop 利用率、CPU 核心比率和 `degraded` 标志。

<ParamField path="--port <port>" type="number">
  将此端口上的 local loopback Gateway 网关作为目标。这会为 health 调用覆盖 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

从会话日志获取 usage-cost 摘要。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  要包含的天数。
</ParamField>
<ParamField path="--agent <id>" type="string">
  将费用摘要限定到一个已配置的智能体 id。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  聚合所有已配置智能体的费用摘要。不能与 `--agent` 组合使用。
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
  要包含的近期事件最大数量（最大 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取已持久化的稳定性 bundle，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅 `--bundle`）读取状态目录下的最新 bundle，或直接传入 bundle JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和 bundle 行为">
    - 记录会保留运行元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、cookie、密钥值、主机名或原始会话 id。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 在致命 Gateway 网关退出、关闭超时和重启启动失败时，如果记录器有事件，OpenClaw 会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也适用于 bundle 输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入一个本地诊断 zip，设计用于附加到 bug 报告。有关隐私模型和 bundle 内容，请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认是状态目录下的支持导出。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的最大已净化日志行数。
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
  状态/健康快照超时时间。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化稳定性包查找。
</ParamField>
<ParamField path="--json" type="boolean">
  将写入路径、大小和清单打印为 JSON。
</ParamField>

导出包含一个清单、一份 Markdown 摘要、配置形状、已净化配置详情、已净化日志摘要、已净化 Gateway 网关状态/健康快照，以及存在时的最新稳定性包。

它用于共享。它会保留有助于调试的运行细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件 ID、提供商 ID、非敏感功能设置，以及已脱敏的运行日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭据、cookie、账号/消息标识符、提示词/指令文本、主机名和密钥值。当 LogTape 风格的消息看起来像用户/聊天/工具载荷文本时，导出只会保留该消息已被省略及其字节数。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks），以及可选的连接/认证能力探测。

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
  探测超时时间。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳过连接探测（仅服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同时扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将默认连接探测升级为读取探测，并在读取探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
    - 默认 `gateway status` 会验证服务状态、WebSocket 连接，以及握手时可见的认证能力。它不会验证读/写/管理员操作。
    - 对于首次设备认证，诊断探测不会产生变更：存在已缓存设备令牌时会复用它，但不会仅为了检查状态而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能时解析已配置的认证 SecretRefs，用于探测认证。
    - 如果此命令路径中所需的认证 SecretRef 未解析，且探测连接/认证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
    - 如果探测成功，未解析认证引用警告会被抑制，以避免误报。
    - 启用探测时，如果运行中的 Gateway 网关报告了版本，JSON 输出会包含 `gateway.version`；如果后续握手探测无法提供版本元数据，`--require-rpc` 可以回退到 `status.runtimeVersion` RPC 载荷。
    - 当仅有监听服务还不够，并且你还需要读范围 RPC 调用也健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd/systemd/schtasks 安装。当检测到多个类似 Gateway 网关的服务时，人类可读输出会打印清理提示，并警告大多数安装应在每台机器上运行一个 Gateway 网关。
    - 当服务进程为外部 supervisor 重启而干净退出时，`--deep` 也会报告最近的 Gateway 网关 supervisor 重启交接。
    - `--deep` 会以插件感知模式（`pluginValidation: "full"`）运行配置验证，并浮现已配置插件清单警告（例如缺少频道配置元数据），以便安装和更新冒烟检查能够捕获它们。默认 `gateway status` 保持快速只读路径，并跳过插件验证。
    - 人类可读输出包含已解析的文件日志路径，以及 CLI 与服务配置路径/有效性快照，以帮助诊断配置文件或状态目录漂移。

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - 在 Linux systemd 安装中，服务认证漂移检查会从 unit 中读取 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号路径、多个文件以及可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRefs（先用服务命令环境变量，再回退到进程环境变量）。
    - 如果令牌认证实际上未启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可能胜出且没有令牌候选可能胜出），令牌漂移检查会跳过配置令牌解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试所有内容”的命令。它始终探测：

- 你已配置的远程 Gateway 网关（如果已设置），以及
- localhost（loopback）**即使已配置远程目标**。

如果传入 `--url`，该显式目标会被添加到两者之前。人类可读输出会将目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多个探测目标可达，它会打印所有目标。SSH 隧道、TLS/代理 URL 和已配置的远程 URL 都可能指向同一个 Gateway 网关，即使它们的传输端口不同；`multiple_gateways` 仅保留给不同的或身份不明确的可达 Gateway 网关。当你使用隔离配置文件（例如救援机器人）时支持多个 Gateway 网关，但大多数安装仍只运行一个 Gateway 网关。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  将此端口用于 local loopback 探测目标和 SSH 隧道远程端口。没有 `--url` 时，这会选择 local loopback 目标，而不是已配置的 Gateway 网关环境 URL、环境端口或远程目标。
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测能够证明的认证能力。它独立于可达性。
    - `Read probe: ok` 表示读范围详情 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读范围 RPC 受限。这会报告为**降级**可达性，而不是完全失败。
    - `Connect: ok` 之后的 `Read probe: failed` 表示 Gateway 网关接受了 WebSocket 连接，但后续读取诊断超时或失败。这同样是**降级**可达性，而不是 Gateway 网关不可达。
    - 与 `gateway status` 一样，探测会复用现有缓存的设备认证，但不会创建首次设备身份或配对状态。
    - 只有在没有任何被探测目标可达时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON output">
    顶层：

    - `ok`：至少有一个目标可达。
    - `degraded`：至少有一个目标接受了连接，但没有完成完整详情 RPC 诊断。
    - `capability`：在可达目标中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序作为活跃胜出目标处理的最佳目标：显式 URL、SSH 隧道、已配置远程目标，然后是 local loopback。
    - `warnings[]`：尽力提供的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
    - `network`：从当前配置和主机网络派生出的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：本次探测实际使用的设备发现预算/结果计数。

    每个目标（`targets[].connect`）：

    - `ok`：连接后的可达性 + 降级分类。
    - `rpcOk`：完整详情 RPC 成功。
    - `scopeLimited`：详情 RPC 因缺少 operator scope 而失败。

    每个目标（`targets[].auth`）：

    - `role`：可用时，`hello-ok` 中报告的认证角色。
    - `scopes`：可用时，`hello-ok` 中报告的已授予 scope。
    - `capability`：该目标浮现出的认证能力分类。

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令回退到直接探测。
    - `multiple_gateways`：不同的 Gateway 网关身份可达，或 OpenClaw 无法证明可达目标是同一个 Gateway 网关。指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或已配置远程 URL 不会触发此警告。
    - `auth_secretref_unresolved`：无法为失败目标解析已配置的认证 SecretRef。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探测因缺少 `operator.read` 而受限。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 远程（与 Mac 应用一致）

macOS 应用的“通过 SSH 远程”模式使用本地端口转发，使远程 Gateway 网关（可能仅绑定到 loopback）可以通过 `ws://127.0.0.1:<port>` 访问。

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
  从已解析的设备发现端点（`local.` 加上已配置的广域域名，如果有）中选择第一个发现的 Gateway 网关主机作为 SSH 目标。仅 TXT 的提示会被忽略。
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
  主要用于智能体风格的 RPC，这类 RPC 会在最终载荷前流式传输中间事件。
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

当托管服务必须通过另一个可执行文件启动时，例如密钥管理器 shim 或 run-as 辅助程序，请使用 `--wrapper`。包装器会接收常规 Gateway 网关参数，并负责最终使用这些参数 exec `openclaw` 或 Node。

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

你也可以通过环境设置包装器。`gateway install` 会验证该路径是可执行文件，将包装器写入服务 `ProgramArguments`，并在服务环境中持久化 `OPENCLAW_WRAPPER`，用于之后的强制重新安装、更新和 Doctor 修复。

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
  <Accordion title="Command options">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - 使用 `gateway restart` 重启托管服务。不要将 `gateway stop` 和 `gateway start` 串联起来作为重启替代方案。
    - 在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`，这会从当前启动会话中移除 LaunchAgent，而不会持久化禁用状态 —— KeepAlive 自动恢复仍会在之后的崩溃中保持活跃，并且 `gateway start` 可以干净地重新启用，无需手动 `launchctl enable`。传入 `--disable` 可持久抑制 KeepAlive 和 RunAtLoad，使 Gateway 网关在下一次显式 `gateway start` 之前不会重新生成；当手动停止需要在重启或系统重启后继续生效时使用此选项。
    - `gateway restart --safe` 会要求正在运行的 Gateway 网关预检活动工作，并在活动工作排空后安排一次合并重启。默认的安全重启会等待活动工作，最长等待到配置的 `gateway.reload.deferralTimeoutMs`（默认 5 分钟）；当该预算耗尽时，重启会被强制执行。将 `gateway.reload.deferralTimeoutMs` 设置为 `0` 可进行无限期安全等待，且永不强制执行。`--safe` 不能与 `--force` 或 `--wait` 组合使用。
    - `gateway restart --wait 30s` 会覆盖该次重启的已配置重启排空预算。裸数字表示毫秒；也接受 `s`、`m` 和 `h` 等单位。`--wait 0` 会无限期等待。
    - `gateway restart --safe --skip-deferral` 会运行 OpenClaw 感知的安全重启，但绕过延迟门控，因此即使报告了阻塞项，Gateway 网关也会立即发出重启。它是用于任务运行延迟卡住时的操作员逃生通道；需要 `--safe`。
    - `gateway restart --force` 会跳过活动工作排空并立即重启。当操作员已经检查过列出的任务阻塞项并希望 Gateway 网关立即恢复时使用。
    - 生命周期命令接受 `--json` 以便编写脚本。

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证 SecretRef 可解析，但不会将解析后的令牌持久化到服务环境元数据中。
    - 如果令牌身份验证需要令牌，且配置的令牌 SecretRef 未解析，安装会失败关闭，而不是持久化回退明文。
    - 对于 `gateway run` 上的密码身份验证，相比内联 `--password`，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`。
    - 在推断身份验证模式下，仅存在于 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装令牌要求；安装托管服务时请使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会被阻止，直到显式设置模式。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域（示例：`openclaw.internal.`）并设置 split DNS + DNS 服务器；请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用 Bonjour 设备发现（默认）的 Gateway 网关才会广播信标。

广域设备发现记录可以包含以下 TXT 提示：

- `role`（Gateway 网关角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（仅完整设备发现模式；缺失时客户端默认 SSH 目标为 `22`）
- `tailnetDns`（MagicDNS 主机名，可用时）
- `gatewayTls` / `gatewayTlsSha256`（已启用 TLS + 证书指纹）
- `cliPath`（仅完整设备发现模式）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每个命令的超时时间（浏览/解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也会禁用样式/旋转指示器）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI 会扫描 `local.` 以及已启用的已配置广域域。
- JSON 输出中的 `wsUrl` 派生自已解析的服务端点，而不是来自 `lanHost` 或 `tailnetDns` 等仅 TXT 的提示。
- 在 `local.` mDNS 和广域 DNS-SD 上，只有当 `discovery.mdns.mode` 为 `full` 时，才会发布 `sshPort` 和 `cliPath`。

</Note>

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

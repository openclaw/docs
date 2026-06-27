---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关凭证、绑定模式和连接
    - 通过 Bonjour（本地 + 广域 DNS-SD）发现 Gateway 网关
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI (`openclaw gateway`) — 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-06-27T01:37:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de9aaeff1b592e867ffadf49a076e6e0f7069b966244b19d4eed91993c3ad738
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令位于 `openclaw gateway …` 下。

<CardGroup cols={3}>
  <Card title="Bonjour discovery" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="Discovery overview" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告和发现 Gateway 网关。
  </Card>
  <Card title="Configuration" href="/zh-CN/gateway/configuration">
    顶层 Gateway 网关配置键名。
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
  <Accordion title="Startup behavior">
    - 默认情况下，除非 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。对临时/开发运行使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 应写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置并修复，而不是隐式假定为本地模式。
    - 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测为本地”。
    - 不带认证绑定到 loopback 之外会被阻止（安全护栏）。
    - `lan`、`tailnet` 和 `custom` 目前通过仅 IPv4 的 BYOH 路径解析。
    - 此路径目前不原生支持仅 IPv6 的 BYOH。如果主机本身仅支持 IPv6，请使用 IPv4 sidecar 或代理。
    - 授权后，`SIGUSR1` 会触发进程内重启（默认启用 `commands.restart`；设置 `commands.restart: false` 可阻止手动重启，同时仍允许 Gateway 网关工具/配置应用/更新）。
    - `SIGINT`/`SIGTERM` 处理程序会停止 Gateway 网关进程，但不会恢复任何自定义终端状态。如果你用 TUI 或原始模式输入包装 CLI，请在退出前恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自配置/环境；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  监听器绑定模式。`lan`、`tailnet` 和 `custom` 目前通过仅 IPv4 的路径解析。
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  认证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  令牌覆盖（同时为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
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
  目前需要 IPv4 地址。对于仅 IPv6 的 BYOH，请在 Gateway 网关前放置 IPv4 sidecar 或代理，并将 OpenClaw 指向该 IPv4 端点。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  允许在配置中没有 `gateway.mode=local` 的情况下启动 Gateway 网关。仅为临时/开发引导绕过启动保护；不会写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置 + 工作区（跳过 BOOTSTRAP.md）。
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

`openclaw gateway restart --safe` 会要求正在运行的 Gateway 网关在重启前预检活动中的 OpenClaw 工作。如果队列操作、回复投递、嵌入式运行或任务运行处于活动状态，Gateway 网关会报告阻塞项，合并重复的安全重启请求，并在活动工作排空后重启。普通 `restart` 会保留现有服务管理器行为以保持兼容性。仅在你明确需要立即覆盖路径时使用 `--force`。

`openclaw gateway restart --safe --skip-deferral` 会运行与 `--safe` 相同的 OpenClaw 感知协调重启，但绕过活动工作延迟门控，因此即使报告了阻塞项，Gateway 网关也会立即发出重启。当某个卡住的任务运行固定了延迟，而单独使用 `--safe` 会无限期等待时，将其用作操作员逃生通道。`--skip-deferral` 需要 `--safe`。

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。优先使用 `--password-file`、环境变量或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### Gateway 网关性能分析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，在 Gateway 网关启动期间记录阶段耗时，包括每阶段的 `eventLoopMax` 延迟，以及 installed-index、manifest registry、启动规划和 owner-map 工作的插件查找表耗时。
- 设置 `OPENCLAW_GATEWAY_RESTART_TRACE=1`，记录重启作用域的 `restart trace:` 行，用于重启信号处理、活动工作排空、关闭阶段、下一次启动、就绪计时和内存指标。
- 设置 `OPENCLAW_DIAGNOSTICS=timeline` 并使用 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>`，为外部 QA harness 写入尽力而为的 JSONL 启动诊断时间线。你也可以在配置中用 `diagnostics.flags: ["timeline"]` 启用该标志；路径仍由环境提供。添加 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件循环样本。
- 先运行 `pnpm build`，然后运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，针对构建后的 CLI 入口对 Gateway 网关启动进行基准测试。该基准会记录首个进程输出、`/healthz`、`/readyz`、启动追踪耗时、事件循环延迟，以及插件查找表耗时详情。
- 先运行 `pnpm build`，然后运行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，在 macOS 或 Linux 上针对构建后的 CLI 入口对进程内 Gateway 网关重启进行基准测试。重启基准使用 SIGUSR1，在子进程中同时启用启动和重启追踪，并记录下一次 `/healthz`、下一次 `/readyz`、停机时间、就绪计时、CPU、RSS 和重启追踪指标。
- 将 `/healthz` 视为存活性，将 `/readyz` 视为可用就绪状态。追踪行和基准输出用于归因给所有者；不要将单个追踪跨度或单个样本视为完整的性能结论。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="Output modes">
    - 默认：人类可读（TTY 中带颜色）。
    - `--json`：机器可读 JSON（无样式/加载指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类布局。

  </Tab>
  <Tab title="Shared options">
    - `--url <url>`：Gateway 网关 WebSocket URL。
    - `--token <token>`：Gateway 网关令牌。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时/预算（因命令而异）。
    - `--expect-final`：等待 “final” 响应（智能体调用）。

  </Tab>
</Tabs>

<Note>
设置 `--url` 时，CLI 不会回退到配置或环境凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据会报错。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

HTTP `/healthz` 端点是存活性探针：只要服务器可以响应 HTTP 就会返回。HTTP `/readyz` 端点更严格，在启动插件 sidecar、渠道或已配置钩子仍在稳定时会保持红色。本地或已认证的详细就绪响应会包含一个 `eventLoop` 诊断块，其中包含事件循环延迟、事件循环利用率、CPU 核心比率和 `degraded` 标志。

<ParamField path="--port <port>" type="number">
  在此端口上定位 local loopback Gateway 网关。这会覆盖健康检查调用的 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

从会话日志获取使用成本摘要。

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
  将成本摘要限定到一个已配置的智能体 ID。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  汇总所有已配置智能体的成本摘要。不能与 `--agent` 组合使用。
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
  按诊断事件类型过滤，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含某个诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性包，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅 `--bundle`）读取状态目录下最新的包，或直接传入包 JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="Privacy and bundle behavior">
    - 记录会保留操作元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、渠道/插件名称，以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、令牌、cookie、密钥值、主机名或原始会话 ID。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 在 Gateway 网关致命退出、关闭超时和重启启动失败时，如果记录器中有事件，OpenClaw 会将同一诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。用 `openclaw gateway stability --bundle latest` 检查最新的包；`--limit`、`--type` 和 `--since-seq` 也适用于包输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入一个本地诊断 zip，设计用于附加到 bug 报告。关于隐私模型和包内容，请参见 [诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认是状态目录下的支持导出文件。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的最大脱敏日志行数。
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
  跳过已持久化的稳定性包查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印写入路径、大小和清单。
</ParamField>

导出内容包含清单、Markdown 摘要、配置形状、脱敏配置详情、脱敏日志摘要、脱敏 Gateway 网关状态/健康快照，以及存在时的最新稳定性包。

它旨在用于共享。它会保留有助于调试的运维细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、耗时、已配置模式、端口、插件 ID、提供商 ID、非机密功能设置，以及已脱敏的运维日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭据、cookie、账号/消息标识符、提示词/指令文本、主机名和密钥值。当 LogTape 风格的消息看起来像用户/聊天/工具载荷文本时，导出只保留消息已被省略以及其字节数。

### `gateway status`

`gateway status` 会显示 Gateway 网关服务（launchd/systemd/schtasks），并可选择探测连接性/认证能力。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加一个显式探测目标。仍会探测已配置的远程目标和 localhost。
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
  跳过连接性探测（仅服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同时扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将默认连接性探测升级为读取探测，并在该读取探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="状态语义">
    - 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
    - 默认 `gateway status` 会验证服务状态、WebSocket 连接，以及握手时可见的认证能力。它不会验证读/写/管理员操作。
    - 对于首次设备认证，诊断探测不会执行变更：存在已缓存设备令牌时会复用它，但不会仅为检查状态而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能时解析已配置的认证 SecretRefs，用于探测认证。
    - 如果此命令路径中所需的认证 SecretRef 未解析，且探测连接性/认证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析密钥来源。
    - 如果探测成功，则会抑制未解析认证引用的警告，以避免误报。
    - 启用探测时，如果运行中的 Gateway 网关报告版本，JSON 输出会包含 `gateway.version`；如果后续握手探测无法提供版本元数据，`--require-rpc` 可以回退到 `status.runtimeVersion` RPC 载荷。
    - 当仅有正在监听的服务还不够，并且你还需要读权限范围的 RPC 调用保持健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd/systemd/schtasks 安装。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数设置应在每台机器上只运行一个 gateway。
    - 当服务进程为外部 supervisor 重启而干净退出时，`--deep` 也会报告近期的 Gateway 网关 supervisor 重启交接。
    - `--deep` 会以插件感知模式（`pluginValidation: "full"`）运行配置验证，并显示已配置插件清单警告（例如缺少渠道配置元数据），以便安装和更新冒烟检查能捕获它们。默认 `gateway status` 会保留跳过插件验证的快速只读路径。
    - 人类可读输出会包含解析后的文件日志路径，以及 CLI 与服务配置路径/有效性快照，以帮助诊断 profile 或 state-dir 漂移。

  </Accordion>
  <Accordion title="Linux systemd 认证漂移检查">
    - 在 Linux systemd 安装中，服务认证漂移检查会从 unit 读取 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号路径、多个文件，以及可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时 env 解析 `gateway.auth.token` SecretRefs（先用服务命令 env，然后回退到进程 env）。
    - 如果令牌认证实际上未启用（显式 `gateway.auth.mode` 为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可能胜出、同时没有令牌候选可胜出），令牌漂移检查会跳过配置令牌解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你配置的远程 gateway（如果已设置），以及
- localhost（loopback），**即使已配置远程目标**。

如果你传入 `--url`，该显式目标会被添加到两者之前。人类可读输出会将目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果多个探测目标可达，它会打印所有目标。即使传输端口不同，SSH 隧道、TLS/代理 URL 和已配置的远程 URL 也可能都指向同一个 gateway；`multiple_gateways` 仅用于不同或身份存在歧义的可达 Gateway 网关。当你使用隔离 profile（例如救援 bot）时支持多个 gateway，但大多数安装仍只运行单个 gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  将此端口用于 local loopback 探测目标和 SSH 隧道远程端口。没有 `--url` 时，这会选择 local loopback 目标，而不是已配置的 gateway 环境 URL、环境端口或远程目标。
</ParamField>

<AccordionGroup>
  <Accordion title="解读">
    - `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测能验证的认证能力。它与可达性是分开的。
    - `Read probe: ok` 表示读权限范围的详细 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功了。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读权限范围的 RPC 受限。这会报告为**降级**可达性，而不是完全失败。
    - `Read probe: failed` 出现在 `Connect: ok` 之后，表示 Gateway 网关接受了 WebSocket 连接，但后续读取诊断超时或失败。这同样是**降级**可达性，而不是 Gateway 网关不可达。
    - 与 `gateway status` 一样，probe 会复用现有已缓存设备认证，但不会创建首次设备身份或配对状态。
    - 仅当没有任何被探测目标可达时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少一个目标可达。
    - `degraded`：至少一个目标接受了连接，但未完成完整的详细 RPC 诊断。
    - `capability`：在可达目标中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序选出的最佳活动胜出目标：显式 URL、SSH 隧道、已配置远程目标，然后是 local loopback。
    - `warnings[]`：尽力生成的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
    - `network`：基于当前配置和主机网络派生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：此轮探测实际使用的设备发现预算/结果数量。

    每个目标（`targets[].connect`）：

    - `ok`：连接后的可达性 + 降级分类。
    - `rpcOk`：完整详细 RPC 成功。
    - `scopeLimited`：详细 RPC 因缺少 operator scope 而失败。

    每个目标（`targets[].auth`）：

    - `role`：可用时在 `hello-ok` 中报告的认证角色。
    - `scopes`：可用时在 `hello-ok` 中报告的已授予 scope。
    - `capability`：为该目标呈现的认证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令回退到直接探测。
    - `multiple_gateways`：不同的 Gateway 网关身份可达，或 OpenClaw 无法证明可达目标是同一个 Gateway 网关。指向同一 Gateway 网关的 SSH 隧道、代理 URL 或已配置远程 URL 不会触发此警告。
    - `auth_secretref_unresolved`：无法为失败目标解析已配置的认证 SecretRef。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探测受限于缺少 `operator.read`。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 连接远程目标（与 Mac 应用一致）

macOS 应用的 “Remote over SSH” 模式使用本地端口转发，因此远程 gateway（可能仅绑定到 loopback）可在 `ws://127.0.0.1:<port>` 访问。

CLI 等价命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` 或 `user@host:port`（端口默认是 `22`）。
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  身份文件。
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  从解析后的设备发现端点（`local.` 加已配置的广域域名，如果有）中选取第一个发现的 gateway 主机作为 SSH 目标。仅 TXT 的提示会被忽略。
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
  主要用于在最终载荷前会流式传输中间事件的 agent 风格 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的 JSON 输出。
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

### 使用 wrapper 安装

当托管服务必须通过另一个可执行文件启动时，请使用 `--wrapper`，例如 secrets manager shim 或 run-as helper。该 wrapper 会接收常规 Gateway 网关参数，并负责最终用这些参数 exec `openclaw` 或 Node。

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

你也可以通过环境设置 wrapper。`gateway install` 会验证该路径是可执行文件，将 wrapper 写入服务 `ProgramArguments`，并在服务环境中持久化 `OPENCLAW_WRAPPER`，供后续强制重新安装、更新和 Doctor 修复使用。

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
  <Accordion title="Command options">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`：`--json`
    - `gateway stop`：`--disable`、`--json`

  </Accordion>
  <Accordion title="Lifecycle behavior">
    - 使用 `gateway restart` 重启托管服务。不要把 `gateway stop` 和 `gateway start` 串起来作为重启替代。
    - 在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`，这会从当前启动会话中移除 LaunchAgent，但不会持久化禁用状态；KeepAlive 自动恢复仍会在后续崩溃时保持活动，并且 `gateway start` 可以干净地重新启用，无需手动执行 `launchctl enable`。传入 `--disable` 可持久抑制 KeepAlive 和 RunAtLoad，使 Gateway 网关在下一次显式 `gateway start` 之前不会重新生成；当手动停止需要跨重启或系统重启保持时，请使用此选项。
    - `gateway restart --safe` 会请求正在运行的 Gateway 网关预检活跃的 OpenClaw 工作，并将重启延后到回复投递、嵌入式运行和任务运行都清空之后。`--safe` 不能与 `--force` 或 `--wait` 组合使用。
    - `gateway restart --wait 30s` 会覆盖该次重启配置的重启排空预算。裸数字表示毫秒；也接受 `s`、`m` 和 `h` 等单位。`--wait 0` 会无限期等待。
    - `gateway restart --safe --skip-deferral` 会运行 OpenClaw 感知的安全重启，但绕过延后门禁，因此即使报告了阻塞项，Gateway 网关也会立即发出重启。这是面向卡住的任务运行延后场景的操作员逃生通道；需要 `--safe`。
    - `gateway restart --force` 会跳过活跃工作排空并立即重启。当操作员已经检查过列出的任务阻塞项，并希望 Gateway 网关立即恢复时使用。
    - 生命周期命令接受 `--json` 以便脚本使用。

  </Accordion>
  <Accordion title="Auth and SecretRefs at install time">
    - 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证该 SecretRef 可解析，但不会把解析后的 token 持久化到服务环境元数据中。
    - 如果 token 认证需要 token 且配置的 token SecretRef 未解析，安装会失败关闭，而不是持久化回退明文。
    - 对于 `gateway run` 上的密码认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file`，或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
    - 在推断认证模式下，仅存在于 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装 token 要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，安装会被阻止，直到显式设置 mode。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域（示例：`openclaw.internal.`）并设置 split DNS + DNS 服务器；请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 发现（默认）的 Gateway 网关会播发该信标。

广域发现记录可以包含这些 TXT 提示：

- `role`（Gateway 网关角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（仅限完整发现模式；缺失时客户端默认 SSH 目标为 `22`）
- `tailnetDns`（MagicDNS 主机名，如果可用）
- `gatewayTls` / `gatewayTlsSha256`（TLS 已启用 + 证书指纹）
- `cliPath`（仅限完整发现模式）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每条命令的超时时间（浏览/解析）。
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
- CLI 会扫描 `local.`，以及已启用时配置的广域域。
- JSON 输出中的 `wsUrl` 派生自解析后的服务端点，而不是来自仅 TXT 的提示，例如 `lanHost` 或 `tailnetDns`。
- 在 `local.` mDNS 和广域 DNS-SD 上，只有当 `discovery.mdns.mode` 为 `full` 时，才会发布 `sshPort` 和 `cliPath`。

</Note>

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

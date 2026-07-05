---
read_when:
    - 从 CLI 运行 Gateway 网关（开发或服务器）
    - 调试 Gateway 网关身份验证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）— 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-07-05T11:07:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb1eb4aaba7681699f6048fc9a91b4117e90f20f24c9a696f688f0ac3b39a49e
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。下面的所有子命令都位于 `openclaw gateway ...` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 设备发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告和查找网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 Gateway 网关配置键。
  </Card>
</CardGroup>

## 运行 Gateway 网关

```bash
openclaw gateway
openclaw gateway run   # equivalent, explicit form
```

<AccordionGroup>
  <Accordion title="启动行为">
    - 除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则拒绝启动。将 `--allow-unconfigured` 用于临时/开发运行；它会绕过保护，但不会写入或修复配置。
    - `openclaw onboard --mode local` 和 `openclaw setup` 会写入 `gateway.mode=local`。如果配置文件存在但缺少 `gateway.mode`，会被视为损坏/被覆盖的配置，Gateway 网关会拒绝为你猜测 `local`；请重新运行新手引导、手动设置该键，或传入 `--allow-unconfigured`。
    - 未启用认证时，禁止绑定到 loopback 之外。
    - `--bind` 值 `lan`、`tailnet` 和 `custom` 目前通过仅 IPv4 路径解析；仅 IPv6 的自带主机设置需要在 Gateway 网关前放置 IPv4 sidecar 或代理。
    - 授权时，`SIGUSR1` 会触发进程内重启。`commands.restart`（默认：启用）控制外部发送的 `SIGUSR1`；将其设为 `false` 可阻止手动 OS 信号重启，同时仍允许通过 `gateway restart` 命令、gateway 工具以及配置应用/更新进行重启。
    - `SIGINT`/`SIGTERM` 会停止进程，但不会恢复自定义终端状态；如果你在 TUI 或 raw-mode 输入中包装 CLI，请在退出前自行恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认来自配置/环境变量；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  绑定模式：`loopback`（默认）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 的共享令牌。设置后默认使用 `OPENCLAW_GATEWAY_TOKEN`。
</ParamField>
<ParamField path="--auth <mode>" type="string">
  认证模式：`none`、`token`、`password`、`trusted-proxy`。
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` 的密码。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  从文件读取 Gateway 网关密码。
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale 暴露方式：`off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  关机时重置 Tailscale serve/funnel 配置。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  不强制要求 `gateway.mode=local` 即可启动。仅用于临时/开发 bootstrap；不会持久化或修复配置。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置 + 工作区（跳过 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置、凭据、会话和工作区。需要 `--dev`。
</ParamField>
<ParamField path="--force" type="boolean">
  启动前杀死目标端口上的任何现有监听器。
</ParamField>
<ParamField path="--verbose" type="boolean">
  将详细日志输出到 stdout/stderr。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  仅在控制台显示 CLI 后端日志（也会启用 stdout/stderr）。
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  WebSocket 日志样式：`auto`、`full`、`compact`。
</ParamField>
<ParamField path="--compact" type="boolean">
  `--ws-log compact` 的别名。
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  将原始模型流事件记录到 JSONL。
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  原始流 JSONL 路径。
</ParamField>

`--claude-cli-logs` 是 `--cli-backend-logs` 的已弃用别名。

对于 `--bind custom`，请将 `gateway.customBindHost` 设为 IPv4 地址；如果该地址不可用，Gateway 网关会回退到 `0.0.0.0`。仅 IPv6 的自带主机设置需要在 Gateway 网关前放置 IPv4 sidecar 或代理。

## 重启 Gateway 网关

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` 会要求正在运行的 Gateway 网关预检活动工作，并在这些工作排空后调度一次合并后的重启。等待受 `gateway.reload.deferralTimeoutMs` 限制（默认：5 分钟 / `300000`）；预算耗尽时会强制重启。将 `deferralTimeoutMs: 0` 设为无限期等待（并周期性发出仍在等待的警告），而不是强制重启。`--safe` 不能与 `--force` 或 `--wait` 组合使用。

`--skip-deferral` 会在安全重启时绕过活动工作延迟门禁，因此即使报告了阻塞项，Gateway 网关也会立即重启。它需要 `--safe`，请在延迟卡在失控任务上时使用。

`--wait <duration>` 会覆盖普通（非安全）重启的排空预算。接受裸毫秒值或单位后缀 `ms`、`s`、`m`、`h`、`d`（例如 `30s`、`5m`、`1h30m`）；`--wait 0` 会无限期等待。不兼容 `--force` 或 `--safe`。

`--force` 会跳过活动工作排空并立即重启。普通 `restart`（无标志）会保留现有服务管理器重启行为。

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。优先使用 `--password-file`、环境变量，或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### Gateway 网关性能分析

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 会在启动期间记录阶段耗时，包括每阶段的 `eventLoopMax` 延迟和插件查找表耗时（已安装索引、清单注册表、启动规划、owner-map 工作）。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` 会记录重启范围内的 `restart trace:` 行：信号处理、活动工作排空、关闭阶段、下一次启动、ready 耗时和内存指标。
- `OPENCLAW_DIAGNOSTICS=timeline` 与 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 会为外部 QA harness 写入 best-effort JSONL 启动诊断时间线（等同于配置 `diagnostics.flags: ["timeline"]`；路径仍仅支持环境变量）。添加 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件循环样本。
- 先运行 `pnpm build`，再运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，会基于已构建的 CLI 入口对 Gateway 网关启动进行基准测试：第一个进程输出、`/healthz`、`/readyz`、启动 trace 耗时、事件循环延迟和插件查找表耗时。
- 先运行 `pnpm build`，再运行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，会在 macOS 或 Linux 上对进程内重启进行基准测试（Windows 不支持；重启需要 `SIGUSR1`）。使用 `SIGUSR1`，在子进程中启用两种 trace，并记录下一个 `/healthz`、下一个 `/readyz`、停机时间、ready 耗时、CPU、RSS 和重启 trace 指标。
- `/healthz` 是存活性；`/readyz` 是可用就绪状态。请将 trace 行和基准测试输出视为所有者归因信号，而不是根据单个时间跨度或样本得出的完整性能结论。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

<Tabs>
  <Tab title="输出模式">
    - 默认：人类可读（在 TTY 中带颜色）。
    - `--json`：机器可读的 JSON（无样式/旋转指示器）。
    - `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类可读布局。

  </Tab>
  <Tab title="共享选项">
    - `--url <url>`：Gateway 网关 WebSocket URL。
    - `--token <token>`：Gateway 网关令牌。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时/预算（默认值因命令而异；请参阅下面的各个命令）。
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

`/healthz` 是存活探针：只要服务器可以响应 HTTP，它就会返回。`/readyz` 更严格，在启动插件 sidecar、渠道或已配置钩子仍在稳定时会保持红色。本地或已认证的详细 `/readyz` 响应包含一个 `eventLoop` 诊断块（延迟、利用率、CPU 核心比率、`degraded` 标志）。

<ParamField path="--port <port>" type="number">
  以此端口上的 local loopback Gateway 网关为目标。本次调用会覆盖 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

从会话日志中获取使用成本汇总。

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
  将汇总范围限定到一个已配置的智能体 id。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  聚合所有已配置的智能体。不能与 `--agent` 组合使用。
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
  读取持久化的稳定性包，而不是调用正在运行的 Gateway 网关。`--bundle latest`（或单独的 `--bundle`）会选择状态目录下最新的包；你也可以直接传入包的 JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和包行为">
    - 记录会保留运行元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、审批 id、渠道/插件名称，以及已脱敏的会话摘要。它们会排除聊天文本、webhook 正文、工具输出、原始请求/响应正文、令牌、cookie、密钥值、主机名和原始会话 id。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 致命 Gateway 网关退出、关闭超时和重启启动失败会在记录器有事件时，将同一个诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新包；`--limit`、`--type` 和 `--since-seq` 也适用于包输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入一个为错误报告设计的本地诊断 zip。有关隐私模型和包内容，请参阅 [诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认为状态目录下的支持导出。
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
  跳过持久化稳定性包查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 打印写入路径、大小和清单。
</ParamField>

导出包包含：`manifest.json`（文件清单）、`summary.md`（Markdown 摘要）、`diagnostics.json`（顶层配置/日志/设备发现/稳定性/状态/健康摘要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`，以及存在包时的 `stability/latest.json`。

它设计用于共享。它保留对调试有用的运行细节，包括安全日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件/提供商 ID、非敏感功能设置，以及已脱敏的运行日志消息；并省略或脱敏聊天文本、webhook 正文、工具输出、凭证、Cookie、账号/消息标识符、提示/指令文本、主机名和密钥值。当日志消息看起来像用户/聊天/工具载荷文本时（例如 “user said”、“chat text”、“tool output”、“webhook body”），导出只保留消息已被省略这一事实及其字节数。

### `gateway status`

显示 Gateway 网关服务（launchd/systemd/schtasks）以及可选的连接性/认证探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加显式探测目标。仍会探测已配置的远程目标 + localhost。
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
  将连接性探测升级为读取探测，如果失败则以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="Status semantics">
    - 即使本地 CLI 配置缺失或无效，也保持可用于诊断。
    - 默认输出证明服务状态、WebSocket 连接，以及握手时可见的认证能力，而不是读/写/管理员操作。
    - 对首次设备认证，探测不会产生变更：如果存在已缓存的设备令牌，它们会复用该令牌，但绝不会为了检查状态而创建新的 CLI 设备身份或只读配对记录。
    - 可能时，会解析已配置的认证 SecretRefs 以用于探测认证。如果所需 SecretRef 未解析，探测连接性/认证失败时，`--json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或修复密钥来源。探测成功后，未解析认证警告会被抑制。
    - 当正在运行的 Gateway 网关报告版本时，JSON 输出包含 `gateway.version`；如果握手探测无法提供版本元数据，`--require-rpc` 可以回退到 `status.runtimeVersion` RPC 载荷。
    - 当仅有监听服务还不够，并且还需要读权限范围 RPC 健康时，请在脚本/自动化中使用 `--require-rpc`。
    - `--deep` 会扫描额外的 launchd/systemd/schtasks 安装；当发现多个类似 Gateway 网关的服务时，人类可读输出会打印清理提示（通常是每台机器运行一个 Gateway 网关），并在相关时报告最近的 supervisor 重启移交。
    - `--deep` 还会以插件感知模式（`pluginValidation: "full"`）运行配置验证，并显示插件清单警告（例如缺少频道配置元数据）。默认 `gateway status` 保持快速只读路径，会跳过插件验证。
    - 人类可读输出包含解析后的文件日志路径，以及 CLI 与服务的配置路径/有效性，以帮助诊断配置档或状态目录漂移。

  </Accordion>
  <Accordion title="Linux systemd auth-drift checks">
    - 服务认证漂移检查会从 unit 中读取 `Environment=` 和 `EnvironmentFile=`（包括 `%h`、带引号的路径、多个文件，以及可选的 `-` 文件）。
    - 使用合并后的运行时环境解析 `gateway.auth.token` SecretRefs（先用服务命令环境，再回退到进程环境）。
    - 当令牌认证实际上未启用时（`gateway.auth.mode` 显式为 `password`/`none`/`trusted-proxy`，或模式未设置且密码可以胜出并且没有令牌候选可以胜出），令牌漂移检查会跳过配置令牌解析。

  </Accordion>
</AccordionGroup>

### `gateway probe`

“调试所有内容”命令。它始终探测：

- 你配置的远程 Gateway 网关（如果已设置），以及
- localhost（loopback），**即使已配置远程目标**。

传入 `--url` 会把该显式目标添加到两者之前。人类可读输出会将目标标记为 `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)` 和 `Local loopback`。

<Note>
如果多个探测目标可达，都会被打印。SSH 隧道、TLS/代理 URL 和已配置的远程 URL 即使使用不同传输端口，也可能指向同一个 Gateway 网关；`multiple_gateways` 仅用于不同或身份不明确的可达 Gateway 网关。支持为隔离配置档运行多个 Gateway 网关（例如救援 bot），但大多数安装只运行单个 Gateway 网关。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  将此端口用于 local loopback 探测目标和 SSH 隧道远程端口。如果没有 `--url`，这会只选择 local loopback 目标，而不是已配置的 Gateway 网关环境 URL、环境端口或远程目标。
</ParamField>

<AccordionGroup>
  <Accordion title="Interpretation">
    - `Reachable: yes` 表示至少一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测可以证明的认证能力，与可达性分开。
    - `Read probe: ok` 表示读权限范围的详细 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读权限范围 RPC 受限。报告为**降级**可达性，而不是完全失败。
    - `Read probe: failed` 出现在 `Connect: ok` 之后，表示 WebSocket 已连接，但后续读取诊断超时或失败；这同样是**降级**，不是不可达。
    - 与 `gateway status` 一样，probe 会复用现有缓存设备认证，但不会创建首次设备身份或配对状态。
    - 只有当没有任何被探测目标可达时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON output">
    顶层：

    - `ok`：至少一个目标可达。
    - `degraded`：至少一个目标接受了连接，但未完成完整的详细 RPC 诊断。
    - `capability`：在可达目标中看到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：应视为活动胜出者的最佳目标，顺序为：显式 URL、SSH 隧道、已配置远程目标、local loopback。
    - `warnings[]`：尽力而为的警告记录，包含 `code`、`message`、可选 `targetIds`。
    - `network`：从当前配置和主机网络派生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` / `discovery.count`：本次探测使用的实际设备发现预算/结果数量。

    每个目标（`targets[].connect`）：`ok`（可达性 + 降级分类）、`rpcOk`（完整详细 RPC 成功）、`scopeLimited`（详细 RPC 因缺少操作员权限范围而失败）。

    每个目标（`targets[].auth`）：可用时为 `hello-ok` 中报告的 `role` 和 `scopes`，以及显示出来的 `capability` 分类。

  </Accordion>
  <Accordion title="Common warning codes">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令回退到直接探测。
    - `multiple_gateways`：可达的是不同 Gateway 网关身份，或 OpenClaw 无法证明可达目标是同一个 Gateway 网关。指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或已配置远程 URL 不会触发此警告。
    - `auth_secretref_unresolved`：无法为失败目标解析已配置的认证 SecretRef。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探测因缺少 `operator.read` 而受限。
    - `local_tls_runtime_unavailable`：本地 Gateway 网关 TLS 已启用，但 OpenClaw 无法加载本地证书指纹。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 访问远程（与 Mac 应用一致）

macOS 应用的 “Remote over SSH” 模式使用本地端口转发，让仅 loopback 的远程 Gateway 网关可通过 `ws://127.0.0.1:<port>` 访问。

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
  从解析后的设备发现端点中选择第一个发现的 Gateway 网关主机作为 SSH 目标（`local.` 加上已配置的广域域名，如果有）。会忽略仅 TXT 的提示。
</ParamField>

配置默认值（可选）：`gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

底层 RPC 辅助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
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
<ParamField path="--timeout <ms>" type="number" default="10000">
  超时预算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用于会在最终载荷前流式传输中间事件的智能体风格 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的 JSON 输出。
</ParamField>

<Note>
`--params` 必须是有效 JSON，并且每个方法会验证自己的参数形状（额外字段或命名错误的字段会被拒绝）。
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

当托管服务必须通过另一个可执行文件启动时，请使用 `--wrapper`，例如密钥管理器 shim 或 run-as 辅助程序。包装器会接收正常的 Gateway 网关参数，并负责最终使用这些参数 exec `openclaw` 或 Node。

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

你也可以通过环境设置包装器。`gateway install` 会验证该路径是一个可执行文件，将包装器写入服务 `ProgramArguments`，并在服务环境中持久化 `OPENCLAW_WRAPPER`，用于后续强制重新安装、更新和 Doctor 修复。

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
    - `gateway install`：`--port`、`--runtime <node|bun>`（默认：`node`）、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`：`--json`
    - `gateway stop`：`--disable`、`--json`

  </Accordion>
  <Accordion title="生命周期行为">
    - 使用 `gateway restart` 重启托管服务。不要将 `gateway stop` 和 `gateway start` 串联起来作为重启替代方案。
    - 在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`，这会从当前启动会话中移除 LaunchAgent，而不会持久化禁用状态 — KeepAlive 自动恢复会在未来崩溃时保持活动，并且 `gateway start` 可以干净地重新启用，无需手动执行 `launchctl enable`。传入 `--disable` 可持久抑制 KeepAlive 和 RunAtLoad，使 Gateway 网关 在下一次显式执行 `gateway start` 前不会重新生成；当手动停止应在重启后仍然生效时，请使用此选项。
    - 生命周期命令接受 `--json`，用于脚本编写。

  </Accordion>
  <Accordion title="安装时的认证和 SecretRefs">
    - 当令牌认证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证该 SecretRef 可解析，但不会将解析后的令牌持久化到服务环境元数据中。
    - 如果令牌认证需要令牌，而配置的令牌 SecretRef 未解析，安装会以关闭失败方式终止，而不是持久化回退明文。
    - 对于 `gateway run` 上的密码认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
    - 在推断认证模式下，仅存在于 shell 的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装时的令牌要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，安装会被阻止，直到显式设置模式。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域（示例：`openclaw.internal.`）并设置拆分 DNS + DNS 服务器；参见 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用 Bonjour 设备发现（默认）的 Gateway 网关才会广播信标。

每个信标上的 TXT 提示：`role`（Gateway 网关角色提示）、`transport`（传输提示，例如 `gateway`）、`gatewayPort`（WebSocket 端口，通常是 `18789`）、`tailnetDns`（MagicDNS 主机名，可用时）、`gatewayTls` / `gatewayTlsSha256`（TLS 已启用 + 证书指纹）。`sshPort` 和 `cliPath` 仅在完整设备发现模式（`discovery.mdns.mode: "full"`；默认是 `"minimal"`，会省略它们，客户端随后默认使用端口 `22` 作为 SSH 目标）下发布。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每条命令的超时时间（浏览/解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（也会禁用样式/微调器）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 扫描 `local.`，以及已启用时配置的广域域。
- JSON 输出中的 `wsUrl` 派生自解析后的服务端点，而不是仅 TXT 提示，例如 `lanHost` 或 `tailnetDns`。
- `discovery.mdns.mode` 控制 `local.` mDNS 和广域 DNS-SD 上的 `sshPort`/`cliPath` 发布（见上文）。

</Note>

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

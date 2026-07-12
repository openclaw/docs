---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关身份验证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI（`openclaw gateway`）— 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-07-12T14:22:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、Hooks）。以下所有子命令都位于 `openclaw gateway ...` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 设备发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何发布和查找 Gateway 网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 Gateway 网关配置键。
  </Card>
</CardGroup>

## 运行 Gateway 网关

```bash
openclaw gateway
openclaw gateway run   # 等效的显式形式
```

<AccordionGroup>
  <Accordion title="启动行为">
    - 除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则拒绝启动。临时/开发运行可使用 `--allow-unconfigured`；它会绕过此保护，但不会写入或修复配置。
    - `openclaw onboard --mode local` 和 `openclaw setup` 会写入 `gateway.mode=local`。如果配置文件存在，但缺少 `gateway.mode`，则会将其视为配置损坏或被覆盖，Gateway 网关不会擅自为你推断 `local`——请重新运行新手引导、手动设置该键，或传入 `--allow-unconfigured`。
    - 禁止在没有身份验证的情况下绑定到 loopback 以外的地址。
    - 目前，`--bind` 的 `lan`、`tailnet` 和 `custom` 值仅通过 IPv4 路径解析；仅支持 IPv6 的自带主机设置需要在 Gateway 网关前配置 IPv4 边车或代理。
    - 获得授权时，`SIGUSR1` 会触发进程内重启。`commands.restart`（默认：启用）控制从外部发送的 `SIGUSR1`；将其设置为 `false` 可阻止手动通过操作系统信号重启，同时仍允许通过 `gateway restart` 命令、Gateway 网关工具以及配置应用/更新来重启。
    - `SIGINT`/`SIGTERM` 会停止进程，但不会恢复自定义终端状态——如果你将 CLI 包装在 TUI 或原始模式输入中，请在退出前自行恢复终端。

  </Accordion>
</AccordionGroup>

### 选项

<ParamField path="--port <port>" type="number">
  WebSocket 端口（默认值来自配置/环境变量；通常为 `18789`）。
</ParamField>
<ParamField path="--bind <mode>" type="string">
  绑定模式：`loopback`（默认）、`lan`、`tailnet`、`auto`、`custom`。
</ParamField>
<ParamField path="--token <token>" type="string">
  `connect.params.auth.token` 的共享令牌。设置 `OPENCLAW_GATEWAY_TOKEN` 时默认使用该值。
</ParamField>
<ParamField path="--auth <mode>" type="string">
  身份验证模式：`none`、`token`、`password`、`trusted-proxy`。
</ParamField>
<ParamField path="--password <password>" type="string">
  `--auth password` 使用的密码。
</ParamField>
<ParamField path="--password-file <path>" type="string">
  从文件读取 Gateway 网关密码。
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  Tailscale 暴露方式：`off`、`serve`、`funnel`。
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  关闭时重置 Tailscale serve/funnel 配置。
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  启动时不强制要求 `gateway.mode=local`。仅用于临时/开发引导；不会持久化或修复配置。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置和工作区（跳过 `BOOTSTRAP.md`）。
</ParamField>
<ParamField path="--reset" type="boolean">
  重置开发配置、凭据、会话和工作区。需要 `--dev`。
</ParamField>
<ParamField path="--force" type="boolean">
  启动前终止目标端口上任何现有的监听进程。
</ParamField>
<ParamField path="--verbose" type="boolean">
  将详细日志输出到 stdout/stderr。
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  控制台中仅显示 CLI 后端日志（同时启用 stdout/stderr）。
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

对于 `--bind custom`，请将 `gateway.customBindHost` 设置为 IPv4 地址。除 `127.0.0.1` 或 `0.0.0.0` 以外的任何地址，还要求同一端口上存在 `127.0.0.1`，以供同主机客户端使用；如果任一监听器无法绑定，启动都会失败。通配地址 `0.0.0.0` 不会添加单独的必需别名。仅支持 IPv6 的自带主机设置需要在 Gateway 网关前配置 IPv4 边车或代理。

## 重启 Gateway 网关

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` 会请求正在运行的 Gateway 网关预检活动工作，并在这些工作清空后安排一次合并重启。等待时间受 `gateway.reload.deferralTimeoutMs` 限制（默认：5 分钟 / `300000`）；超过时间预算后会强制重启。将 `deferralTimeoutMs: 0` 设置为无限期等待（并定期发出仍在等待的警告），而不是强制重启。`--safe` 不能与 `--force` 或 `--wait` 组合使用。

`--skip-deferral` 会在安全重启时绕过活动工作延迟门控，因此即使报告了阻塞项，Gateway 网关也会立即重启。它需要与 `--safe` 一起使用——当延迟被失控任务卡住时使用此选项。

`--wait <duration>` 会覆盖普通（非安全）重启的清空时间预算。接受不带单位的毫秒数，或带 `ms`、`s`、`m`、`h`、`d` 单位后缀的值（例如 `30s`、`5m`、`1h30m`）；`--wait 0` 表示无限期等待。不能与 `--force` 或 `--safe` 一起使用。

`--force` 会跳过活动工作的清空过程并立即重启。普通 `restart`（不带标志）会保留现有服务管理器的重启行为。

<Warning>
内联 `--password` 可能会暴露在本地进程列表中。建议使用 `--password-file`、环境变量或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### Gateway 网关性能分析

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` 会记录启动期间各阶段的耗时，包括每阶段的 `eventLoopMax` 延迟和插件查找表耗时（已安装索引、清单注册表、启动规划、所有者映射工作）。
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` 会记录重启范围内的 `restart trace:` 行：信号处理、活动工作清空、关闭阶段、下一次启动、就绪耗时和内存指标。
- `OPENCLAW_DIAGNOSTICS=timeline` 与 `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` 会写入尽力而为的 JSONL 启动诊断时间线，供外部 QA 测试框架使用（等同于配置 `diagnostics.flags: ["timeline"]`；路径仍只能通过环境变量设置）。添加 `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` 可包含事件循环采样。
- 先运行 `pnpm build`，再运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1`，可针对构建后的 CLI 入口对 Gateway 网关启动进行基准测试：首次进程输出、`/healthz`、`/readyz`、启动跟踪耗时、事件循环延迟和插件查找表耗时。
- 先运行 `pnpm build`，再运行 `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`，可在 macOS 或 Linux 上对进程内重启进行基准测试（Windows 不支持；重启需要 `SIGUSR1`）。该测试使用 `SIGUSR1`，在子进程中启用两种跟踪，并记录下一次 `/healthz`、下一次 `/readyz`、停机时间、就绪耗时、CPU、RSS 和重启跟踪指标。
- `/healthz` 表示存活状态；`/readyz` 表示可用就绪状态。应将跟踪行和基准测试输出视为所有者归因信号，而不是根据单个时间跨度或样本得出的完整性能结论。

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
    - `--timeout <ms>`：超时时间/预算（默认值因命令而异；请参阅下方各命令）。
    - `--expect-final`：等待“最终”响应（智能体调用）。

  </Tab>
</Tabs>

<Note>
设置 `--url` 后，CLI 不会回退使用配置或环境变量中的凭据。请显式传入 `--token` 或 `--password`。缺少显式凭据会导致错误。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` 是存活探针：服务器能够响应 HTTP 后便立即返回。`/readyz` 的要求更严格，在启动插件边车、渠道或已配置的 Hooks 仍处于稳定过程中时会保持红色。本地或经过身份验证的详细 `/readyz` 响应包含 `eventLoop` 诊断块（延迟、利用率、CPU 核心比率、`degraded` 标志）。

<ParamField path="--port <port>" type="number">
  以此端口上的 local loopback Gateway 网关为目标。对于此次调用，它会覆盖 `OPENCLAW_GATEWAY_URL` 和 `OPENCLAW_GATEWAY_PORT`。
</ParamField>

### `gateway usage-cost`

从会话日志中获取用量成本摘要。

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
  将摘要范围限定为一个已配置的智能体 ID。
</ParamField>
<ParamField path="--all-agents" type="boolean">
  汇总所有已配置的智能体。不能与 `--agent` 组合使用。
</ParamField>

### `gateway stability`

从正在运行的 Gateway 网关获取最近的诊断稳定性记录。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的近期事件数量上限（最大值为 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性包，而不是调用正在运行的 Gateway 网关。`--bundle latest`（或不带值的 `--bundle`）会选择状态目录下最新的包；你也可以直接传入包的 JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写入可共享的支持诊断 zip 文件，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和包行为">
    - 记录会保留运行元数据：事件名称、计数、字节大小、内存读数、队列/会话状态、审批 ID、渠道/插件名称以及经过脱敏的会话摘要。记录不包含聊天文本、webhook 正文、工具输出、原始请求/响应正文、令牌、Cookie、机密值、主机名和原始会话 ID。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 当记录器中存在事件时，Gateway 网关致命退出、关闭超时和重启启动失败会将相同的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。使用 `openclaw gateway stability --bundle latest` 检查最新的包；`--limit`、`--type` 和 `--since-seq` 同样适用于包输出。

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写入专为错误报告设计的本地诊断 zip 文件。有关隐私模型和包内容，请参阅[诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 ZIP 路径。默认为状态目录下的支持导出文件。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已清理日志行数上限。
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
  状态/健康快照超时时间。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化稳定性包查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 格式输出写入路径、大小和清单。
</ParamField>

导出包包含：`manifest.json`（文件清单）、`summary.md`（Markdown 摘要）、`diagnostics.json`（顶层配置/日志/设备发现/稳定性/状态/健康摘要）、`config/sanitized.json`、`status/gateway-status.json`、`health/gateway-health.json`、`logs/openclaw-sanitized.jsonl`，以及存在稳定性包时的 `stability/latest.json`。

它专为共享而设计。它会保留对调试有用的运行详情——安全的日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件/提供商 ID、非机密功能设置以及经过脱敏的运行日志消息——并省略或脱敏聊天文本、webhook 正文、工具输出、凭据、Cookie、账户/消息标识符、提示词/指令文本、主机名和机密值。当日志消息看起来像用户/聊天/工具载荷文本时（例如“用户说了什么”“聊天文本”“工具输出”“webhook 正文”），导出内容只保留消息已省略这一事实及其字节数。

### `gateway status`

显示 Gateway 网关服务（launchd/systemd/schtasks），以及可选的连接性/身份验证探测结果。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加显式探测目标。仍会探测已配置的远程目标和 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于探测的令牌身份验证。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于探测的密码身份验证。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  探测超时时间。
</ParamField>
<ParamField path="--no-probe" type="boolean">
  跳过连接性探测（仅显示服务视图）。
</ParamField>
<ParamField path="--deep" type="boolean">
  同时扫描系统级服务。
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  将连接性探测升级为读取探测，并在失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="状态语义">
    - 即使本地 CLI 配置缺失或无效，也仍可用于诊断。
    - 默认输出可证明服务状态、WebSocket 连接情况以及握手时可见的身份验证能力，但不能证明读取/写入/管理员操作可用。
    - 对首次设备身份验证执行的探测不会产生变更：如果存在已缓存的设备令牌，就会复用该令牌，但绝不会只为检查状态而创建新的 CLI 设备身份或只读配对记录。
    - 如果可能，会解析为探测身份验证配置的 SecretRef。如果必需的 SecretRef 未解析，并且探测连接/身份验证失败，`--json` 会报告 `rpc.authWarning`；请显式传递 `--token`/`--password` 或修复机密来源。探测成功后，不再显示未解析身份验证警告。
    - 当正在运行的 Gateway 网关报告版本时，JSON 输出会包含 `gateway.version`；如果握手探测无法提供版本元数据，`--require-rpc` 可以回退到 `status.runtimeVersion` RPC 载荷。
    - 当仅有正在侦听的服务还不够，并且还需要读取权限范围的 RPC 保持健康时，请在脚本/自动化中使用 `--require-rpc`。
    - `--deep` 会扫描额外的 launchd/systemd/schtasks 安装；找到多个类似 Gateway 网关的服务时，人类可读输出会显示清理提示（通常每台计算机只运行一个 Gateway 网关），并在相关时报告最近的监督器重启交接。
    - `--deep` 还会以插件感知模式（`pluginValidation: "full"`）运行配置验证，并显示插件清单警告（例如缺少渠道配置元数据）。默认的 `gateway status` 保持快速只读路径，跳过插件验证。
    - 人类可读输出包含解析后的文件日志路径，以及 CLI 与服务配置路径和有效性信息，以帮助诊断配置文件或状态目录偏移。

  </Accordion>
  <Accordion title="Linux systemd 身份验证偏移检查">
    - 服务身份验证偏移检查会读取单元中的 `Environment=` 和 `EnvironmentFile=`（包括 `%h`、带引号的路径、多个文件以及带可选 `-` 前缀的文件）。
    - 使用合并后的运行时环境解析 `gateway.auth.token` SecretRef（先使用服务命令环境，再回退到进程环境）。
    - 当令牌身份验证实际上未启用时，令牌偏移检查会跳过配置令牌解析（`gateway.auth.mode` 显式设为 `password`/`none`/`trusted-proxy`，或者未设置模式、密码可能优先且没有令牌候选项可以优先）。

  </Accordion>
</AccordionGroup>

### `gateway probe`

“调试一切”命令。它始终探测：

- 你配置的远程 Gateway 网关（如果已设置），以及
- localhost（local loopback），**即使已配置远程目标**。

传递 `--url` 会在这两个目标之前添加该显式目标。人类可读输出将目标标记为 `URL (explicit)`、`Remote (configured)` / `Remote (configured, inactive)` 和 `Local loopback`。

<Note>
如果多个探测目标均可访问，则会全部输出。即使传输端口不同，SSH 隧道、TLS/代理 URL 和已配置的远程 URL 也可能指向同一个 Gateway 网关；`multiple_gateways` 仅用于不同或身份不明确的可访问 Gateway 网关。支持针对相互隔离的配置文件运行多个 Gateway 网关（例如救援 Bot），但大多数安装只运行一个 Gateway 网关。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  将此端口用于 local loopback 探测目标和 SSH 隧道远程端口。如果未指定 `--url`，此选项将只选择 local loopback 目标，而不选择已配置的 Gateway 网关环境 URL、环境端口或远程目标。
</ParamField>

<AccordionGroup>
  <Accordion title="结果解读">
    - `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测能够证明的身份验证能力，与可访问性分开显示。
    - `Read probe: ok` 表示读取权限范围的详细 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也已成功。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读取权限范围的 RPC 受限。该情况报告为可访问性**降级**，而不是完全失败。
    - 在 `Connect: ok` 之后出现 `Read probe: failed`，表示 WebSocket 已连接，但后续读取诊断超时或失败——同样属于**降级**，而不是无法访问。
    - 与 `gateway status` 一样，探测会复用现有的已缓存设备身份验证，但不会创建首次设备身份或配对状态。
    - 仅当所有探测目标均不可访问时，退出码才为非零。

  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少有一个目标可访问。
    - `degraded`：至少有一个目标接受了连接，但未完成完整的详细 RPC 诊断。
    - `capability`：所有可访问目标中发现的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：应视为当前有效首选项的最佳目标，顺序为：显式 URL、SSH 隧道、已配置的远程目标、local loopback。
    - `warnings[]`：尽力提供的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
    - `network`：根据当前配置和主机网络派生的 local loopback/tailnet URL 提示。
    - `discovery.timeoutMs` / `discovery.count`：本次探测实际使用的设备发现预算/结果数量。

    每个目标（`targets[].connect`）：`ok`（可访问性 + 降级分类）、`rpcOk`（完整详细 RPC 成功）、`scopeLimited`（详细 RPC 因缺少操作员权限范围而失败）。

    每个目标（`targets[].auth`）：可用时显示 `hello-ok` 中报告的 `role` 和 `scopes`，以及对外显示的 `capability` 分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令已回退到直接探测。
    - `multiple_gateways`：可访问到不同的 Gateway 网关身份，或者 OpenClaw 无法证明可访问的目标属于同一个 Gateway 网关。指向同一 Gateway 网关的 SSH 隧道、代理 URL 或已配置远程 URL 不会触发此警告。
    - `auth_secretref_unresolved`：无法为失败的目标解析已配置的身份验证 SecretRef。
    - `probe_scope_limited`：WebSocket 连接成功，但读取探测因缺少 `operator.read` 而受限。
    - `local_tls_runtime_unavailable`：本地 Gateway 网关 TLS 已启用，但 OpenClaw 无法加载本地证书指纹。

  </Accordion>
</AccordionGroup>

#### 通过 SSH 远程连接（与 Mac 应用一致）

macOS 应用的 "Remote over SSH" 模式使用本地端口转发，使仅限 loopback 的远程 Gateway 网关可通过 `ws://127.0.0.1:<port>` 访问。

对应的 CLI 命令：

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
  从解析后的设备发现端点（`local.` 加上已配置的广域网域名，如有）中选择首个发现的 Gateway 网关主机作为 SSH 目标。仅 TXT 的提示会被忽略。
</ParamField>

配置默认值（可选）：`gateway.remote.sshTarget`、`gateway.remote.sshIdentity`。

### `gateway call <method>`

底层 RPC 辅助命令。

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  用于参数的 JSON 对象字符串。
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
  主要用于在最终载荷之前流式传输中间事件的智能体式 RPC。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读的 JSON 输出。
</ParamField>

<Note>
`--params` 必须是有效的 JSON，并且每个方法都会验证自己的参数结构（额外字段或字段名错误会被拒绝）。
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

当托管服务必须通过其他可执行文件启动时，请使用 `--wrapper`，例如机密管理器 shim 或以指定用户身份运行的辅助工具。包装器接收常规 Gateway 网关参数，并负责最终使用这些参数执行 `openclaw` 或 Node。

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

你也可以通过环境设置包装器。`gateway install` 会验证该路径是可执行文件，将包装器写入服务的 `ProgramArguments`，并在服务环境中持久保存 `OPENCLAW_WRAPPER`，供后续强制重新安装、更新和 Doctor 修复使用。

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

要移除持久保存的包装器，请在重新安装时清空 `OPENCLAW_WRAPPER`：

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="命令选项">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`（默认值：`node`）、`--token`、`--wrapper <path>`、`--force`、`--json`
    - `gateway restart`：`--safe`、`--skip-deferral`、`--force`、`--wait <duration>`、`--json`
    - `gateway uninstall|start`：`--json`
    - `gateway stop`：`--disable`、`--json`

  </Accordion>
  <Accordion title="生命周期行为">
    - 使用 `gateway restart` 重启托管服务。不要串联 `gateway stop` 和 `gateway start` 来代替重启。
    - 在 macOS 上，`gateway stop` 默认使用 `launchctl bootout`，它会从当前启动会话中移除 LaunchAgent，但不会持久禁用它——KeepAlive 自动恢复在后续崩溃时仍然有效，而 `gateway start` 无需手动执行 `launchctl enable` 即可重新启用。传入 `--disable` 可持久禁止 KeepAlive 和 RunAtLoad，使 Gateway 网关在下一次显式执行 `gateway start` 前不会重新生成；当手动停止需要在重启后继续生效时，请使用此选项。
    - 生命周期命令接受 `--json`，便于编写脚本。

  </Accordion>
  <Accordion title="安装时的身份验证和 SecretRef">
    - 当令牌身份验证需要令牌且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证该 SecretRef 是否可解析，但不会将解析后的令牌持久保存到服务环境元数据中。
    - 如果令牌身份验证需要令牌，而配置的令牌 SecretRef 无法解析，安装会以安全关闭方式失败，而不是持久保存作为回退的明文。
    - 对 `gateway run` 使用密码身份验证时，应优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而不是内联的 `--password`。
    - 在推断身份验证模式下，仅在 shell 中设置的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装时的令牌要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或配置中的 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，而 `gateway.auth.mode` 未设置，则会阻止安装，直到显式设置模式。

  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域（例如：`openclaw.internal.`），并设置分割 DNS 和 DNS 服务器；请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 设备发现（默认启用）的 Gateway 网关才会广播信标。

每个信标上的 TXT 提示：`role`（Gateway 网关角色提示）、`transport`（传输协议提示，例如 `gateway`）、`gatewayPort`（WebSocket 端口，通常为 `18789`）、`tailnetDns`（可用时为 MagicDNS 主机名）、`gatewayTls` / `gatewayTlsSha256`（已启用 TLS + 证书指纹）。仅在完整设备发现模式下（`discovery.mdns.mode: "full"`）发布 `sshPort` 和 `cliPath`；默认值为 `"minimal"`，会省略它们——此时客户端默认使用端口 `22` 作为 SSH 目标。

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  单条命令的超时时间（浏览/解析）。
</ParamField>
<ParamField path="--json" type="boolean">
  机器可读输出（同时禁用样式和加载动画）。
</ParamField>

示例：

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- 扫描 `local.`，如果启用了配置的广域域，也会同时扫描该域。
- JSON 输出中的 `wsUrl` 派生自解析后的服务端点，而不是 `lanHost` 或 `tailnetDns` 等仅存在于 TXT 中的提示。
- `discovery.mdns.mode` 控制 `local.` mDNS 和广域 DNS-SD 上的 `sshPort`/`cliPath` 发布（见上文）。

</Note>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

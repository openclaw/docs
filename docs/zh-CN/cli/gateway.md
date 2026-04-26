---
read_when:
    - 从 CLI 运行 Gateway 网关（开发环境或服务器）
    - 调试 Gateway 网关认证、绑定模式和连接性
    - 通过 Bonjour 发现 Gateway 网关（本地 + 广域 DNS-SD）
sidebarTitle: Gateway
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）—— 运行、查询和发现 Gateway 网关
title: Gateway 网关
x-i18n:
    generated_at: "2026-04-26T09:05:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8cdca95676f0b098e2dd79ff4245a32eaae82711ed6c2b7e39522331872cfd9
    source_path: cli/gateway.md
    workflow: 15
---

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、钩子）。本页中的子命令都位于 `openclaw gateway …` 下。

<CardGroup cols={3}>
  <Card title="Bonjour 发现" href="/zh-CN/gateway/bonjour">
    本地 mDNS + 广域 DNS-SD 设置。
  </Card>
  <Card title="设备发现概览" href="/zh-CN/gateway/discovery">
    OpenClaw 如何通告并发现 Gateway 网关。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration">
    顶层 gateway 配置键名。
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
    - 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。对于临时 / 开发运行，可使用 `--allow-unconfigured`。
    - `openclaw onboard --mode local` 和 `openclaw setup` 预期会写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为损坏或被覆盖的配置，并进行修复，而不是隐式假定为 local 模式。
    - 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝为你“猜测为 local”。
    - 未启用认证时，禁止绑定到 loopback 之外的地址（安全护栏）。
    - 在获得授权时，`SIGUSR1` 会触发进程内重启（默认启用 `commands.restart`；将 `commands.restart: false` 设为 false 可阻止手动重启，但 gateway 工具 / 配置 apply / update 仍然允许）。
    - `SIGINT` / `SIGTERM` 处理程序会停止 gateway 进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw-mode 输入封装了 CLI，请在退出前恢复终端。
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
  认证模式覆盖。
</ParamField>
<ParamField path="--token <token>" type="string">
  Token 覆盖（也会为该进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
</ParamField>
<ParamField path="--password <password>" type="string">
  密码覆盖。
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
  允许在配置中没有 `gateway.mode=local` 的情况下启动 gateway。仅绕过用于临时 / 开发引导的启动保护；不会写入或修复配置文件。
</ParamField>
<ParamField path="--dev" type="boolean">
  如果缺失，则创建开发配置 + 工作区（跳过 `BOOTSTRAP.md`）。
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
内联 `--password` 可能会在本地进程列表中暴露。优先使用 `--password-file`、环境变量或由 SecretRef 支持的 `gateway.auth.password`。
</Warning>

### 启动分析

- 设置 `OPENCLAW_GATEWAY_STARTUP_TRACE=1`，以在 Gateway 网关启动期间记录各阶段耗时。
- 运行 `pnpm test:startup:gateway -- --runs 5 --warmup 1` 以对 Gateway 网关启动进行基准测试。该基准测试会记录首个进程输出、`/healthz`、`/readyz` 和启动跟踪耗时。

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
    - `--token <token>`：Gateway 网关 token。
    - `--password <password>`：Gateway 网关密码。
    - `--timeout <ms>`：超时 / 预算（因命令而异）。
    - `--expect-final`：等待“final”响应（智能体调用）。
  </Tab>
</Tabs>

<Note>
当你设置 `--url` 时，CLI 不会回退到配置或环境变量凭证。请显式传递 `--token` 或 `--password`。缺少显式凭证会报错。
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

HTTP `/healthz` 端点是存活探针：一旦服务器可以响应 HTTP，它就会返回。HTTP `/readyz` 端点更严格；当启动 sidecar、渠道或已配置的钩子仍在稳定过程中时，它会保持为红色状态。

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

从正在运行的 Gateway 网关中获取最近的诊断稳定性记录器。

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  要包含的最近事件最大数量（最大为 `1000`）。
</ParamField>
<ParamField path="--type <type>" type="string">
  按诊断事件类型筛选，例如 `payload.large` 或 `diagnostic.memory.pressure`。
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  仅包含某个诊断序列号之后的事件。
</ParamField>
<ParamField path="--bundle [path]" type="string">
  读取持久化的稳定性 bundle，而不是调用正在运行的 Gateway 网关。使用 `--bundle latest`（或仅使用 `--bundle`）可读取状态目录下最新的 bundle，或者直接传入 bundle JSON 路径。
</ParamField>
<ParamField path="--export" type="boolean">
  写出可共享的支持诊断 zip，而不是打印稳定性详情。
</ParamField>
<ParamField path="--output <path>" type="string">
  `--export` 的输出路径。
</ParamField>

<AccordionGroup>
  <Accordion title="隐私和 bundle 行为">
    - 记录会保留运维元数据：事件名称、计数、字节大小、内存读数、队列 / 会话状态、渠道 / 插件名称以及已脱敏的会话摘要。它们不会保留聊天文本、webhook 正文、工具输出、原始请求或响应正文、token、cookie、密钥值、主机名或原始会话 id。设置 `diagnostics.enabled: false` 可完全禁用记录器。
    - 在 Gateway 网关发生致命退出、关闭超时和重启启动失败时，如果记录器中有事件，OpenClaw 会将同样的诊断快照写入 `~/.openclaw/logs/stability/openclaw-stability-*.json`。你可以使用 `openclaw gateway stability --bundle latest` 检查最新 bundle；`--limit`、`--type` 和 `--since-seq` 也适用于 bundle 输出。
  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

写出一个本地诊断 zip，专门用于附加到 bug 报告。有关隐私模型和 bundle 内容，请参见 [诊断导出](/zh-CN/gateway/diagnostics)。

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  输出 zip 路径。默认输出到状态目录下的支持导出文件。
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  要包含的已脱敏日志行最大数量。
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  要检查的日志字节最大数量。
</ParamField>
<ParamField path="--url <url>" type="string">
  用于健康快照的 Gateway 网关 WebSocket URL。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于健康快照的 Gateway 网关 token。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于健康快照的 Gateway 网关密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  Status / health 快照超时。
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  跳过持久化稳定性 bundle 查找。
</ParamField>
<ParamField path="--json" type="boolean">
  以 JSON 形式打印写入路径、大小和清单。
</ParamField>

该导出包含清单、Markdown 摘要、配置形状、已脱敏配置详情、已脱敏日志摘要、已脱敏 Gateway 网关 status / health 快照，以及存在时的最新稳定性 bundle。

它旨在被共享。它会保留有助于调试的运维细节，例如安全的 OpenClaw 日志字段、子系统名称、状态码、持续时间、已配置模式、端口、插件 id、provider id、非机密功能设置以及已脱敏的运维日志消息。它会省略或脱敏聊天文本、webhook 正文、工具输出、凭证、cookie、账户 / 消息标识符、提示词 / 指令文本、主机名和密钥值。当某条 LogTape 风格消息看起来像用户 / 聊天 / 工具负载文本时，导出只会保留该消息已被省略以及它的字节数。

### `gateway status`

`gateway status` 会显示 Gateway 网关服务（launchd / systemd / schtasks），以及对连接性 / 认证能力的可选探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  添加显式探测目标。仍会探测已配置的远程端点和 localhost。
</ParamField>
<ParamField path="--token <token>" type="string">
  用于探测的 token 认证。
</ParamField>
<ParamField path="--password <password>" type="string">
  用于探测的密码认证。
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
  将默认连接性探测升级为读探测，并在该读探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。
</ParamField>

<AccordionGroup>
  <Accordion title="Status 语义">
    - 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
    - 默认的 `gateway status` 会证明服务状态、WebSocket 连接以及握手时可见的认证能力。它不会证明读 / 写 / 管理操作。
    - 对于首次设备认证，诊断探测是非变更性的：如果已有缓存的设备 token，它会复用该 token，但不会仅为了检查 status 而创建新的 CLI 设备身份或只读设备配对记录。
    - `gateway status` 会在可能的情况下解析已配置的认证 SecretRef 以用于探测认证。
    - 如果在此命令路径中所需的认证 SecretRef 无法解析，且探测连接 / 认证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传递 `--token` / `--password`，或先解析密钥来源。
    - 如果探测成功，则会抑制未解析 auth-ref 的警告，以避免误报。
    - 当仅有正在监听的服务还不够、并且你还需要读范围 RPC 调用也保持健康时，请在脚本和自动化中使用 `--require-rpc`。
    - `--deep` 会尽力扫描额外的 launchd / systemd / schtasks 安装。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数设置应为每台机器运行一个 gateway。
    - 人类可读输出包含已解析的文件日志路径，以及 CLI 与服务配置路径 / 有效性快照，以帮助诊断 profile 或状态目录漂移。
  </Accordion>
  <Accordion title="Linux systemd 认证漂移检查">
    - 在 Linux systemd 安装中，服务认证漂移检查会同时读取 unit 中的 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号路径、多个文件以及可选的 `-` 文件）。
    - 漂移检查会使用合并后的运行时环境变量解析 `gateway.auth.token` SecretRef（优先使用服务命令环境变量，其次回退到进程环境变量）。
    - 如果 token 认证实际上未激活（显式 `gateway.auth.mode` 为 `password` / `none` / `trusted-proxy`，或者 mode 未设置且 password 可能生效，同时没有任何 token 候选可生效），则 token 漂移检查会跳过配置 token 解析。
  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` 是“调试一切”的命令。它始终会探测：

- 你配置的远程 gateway（如果已设置），以及
- localhost（loopback），**即使已配置远程端点也是如此**。

如果你传递 `--url`，则该显式目标会被添加到这两者之前。人类可读输出会将目标标记为：

- `URL (explicit)`
- `Remote (configured)` 或 `Remote (configured, inactive)`
- `Local loopback`

<Note>
如果可到达多个 gateway，它会全部打印出来。当你使用隔离的 profile / 端口（例如救援 bot）时，支持多个 gateway，但大多数安装仍然只运行单个 gateway。
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="解释">
    - `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` 报告探测能够证明的认证能力。它与可达性是分开的。
    - `Read probe: ok` 表示读范围详情 RPC 调用（`health` / `status` / `system-presence` / `config.get`）也成功了。
    - `Read probe: limited - missing scope: operator.read` 表示连接成功，但读范围 RPC 受到限制。这会被报告为**降级**可达性，而不是完全失败。
    - 与 `gateway status` 一样，probe 会复用现有缓存的设备认证，但不会创建首次设备身份或配对状态。
    - 只有当所有被探测目标都不可达时，退出码才会为非零。
  </Accordion>
  <Accordion title="JSON 输出">
    顶层：

    - `ok`：至少有一个目标可达。
    - `degraded`：至少有一个目标的详情 RPC 因范围受限。
    - `capability`：在所有可达目标中观察到的最佳能力（`read_only`、`write_capable`、`admin_capable`、`pairing_pending`、`connected_no_operator_scope` 或 `unknown`）。
    - `primaryTargetId`：按以下顺序应视为当前活动胜出的最佳目标：显式 URL、SSH 隧道、已配置远程端点，然后是本地 loopback。
    - `warnings[]`：尽力而为的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
    - `network`：根据当前配置和主机网络推导出的本地 loopback / tailnet URL 提示。
    - `discovery.timeoutMs` 和 `discovery.count`：本次 probe 使用的实际发现预算 / 结果数量。

    每个目标（`targets[].connect`）：

    - `ok`：连接后并结合降级分类得到的可达性。
    - `rpcOk`：完整详情 RPC 成功。
    - `scopeLimited`：详情 RPC 因缺少 operator 范围而失败。

    每个目标（`targets[].auth`）：

    - `role`：在可用时，由 `hello-ok` 报告的认证角色。
    - `scopes`：在可用时，由 `hello-ok` 报告的已授予范围。
    - `capability`：为该目标呈现的认证能力分类。

  </Accordion>
  <Accordion title="常见警告代码">
    - `ssh_tunnel_failed`：SSH 隧道设置失败；命令已回退为直接探测。
    - `multiple_gateways`：有多个目标可达；除非你有意运行隔离 profile（例如救援 bot），否则这并不常见。
    - `auth_secretref_unresolved`：某个失败目标的已配置认证 SecretRef 无法解析。
    - `probe_scope_limited`：WebSocket 连接成功，但读探测因缺少 `operator.read` 而受限。
  </Accordion>
</AccordionGroup>

#### 通过 SSH 连接远程端点（与 Mac 应用一致）

macOS 应用的“Remote over SSH”模式使用本地端口转发，使远程 gateway（它可能仅绑定到 loopback）可以通过 `ws://127.0.0.1:<port>` 访问。

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
  从已解析的发现端点（`local.` 加上已配置的广域域名（如果有））中选择首个发现的 gateway 主机作为 SSH 目标。会忽略仅 TXT 的提示。
</ParamField>

配置（可选，用作默认值）：

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

底层 RPC 辅助工具。

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
  Gateway 网关 token。
</ParamField>
<ParamField path="--password <password>" type="string">
  Gateway 网关密码。
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  超时预算。
</ParamField>
<ParamField path="--expect-final" type="boolean">
  主要用于智能体风格的 RPC，这类 RPC 会在最终负载之前流式传输中间事件。
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

<AccordionGroup>
  <Accordion title="命令选项">
    - `gateway status`：`--url`、`--token`、`--password`、`--timeout`、`--no-probe`、`--require-rpc`、`--deep`、`--json`
    - `gateway install`：`--port`、`--runtime <node|bun>`、`--token`、`--force`、`--json`
    - `gateway uninstall|start|stop|restart`：`--json`
  </Accordion>
  <Accordion title="服务安装和生命周期说明">
    - `gateway install` 支持 `--port`、`--runtime`、`--token`、`--force`、`--json`。
    - 使用 `gateway restart` 重启受管服务。不要把 `gateway stop` 和 `gateway start` 串起来代替重启；在 macOS 上，`gateway stop` 会在停止前故意禁用 LaunchAgent。
    - 当 token 认证需要 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证该 SecretRef 可解析，但不会将解析后的 token 持久化到服务环境元数据中。
    - 如果 token 认证需要 token 且已配置的 token SecretRef 无法解析，安装会以关闭失败方式终止，而不是持久化回退明文。
    - 对于 `gateway run` 的密码认证，相比内联 `--password`，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`。
    - 在推断认证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装时对 token 的要求；安装受管服务时，请使用持久配置（`gateway.auth.password` 或配置 `env`）。
    - 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且未设置 `gateway.auth.mode`，则安装会被阻止，直到显式设置 mode。
    - 生命周期命令接受 `--json` 以供脚本使用。
  </Accordion>
</AccordionGroup>

## 发现 Gateway 网关（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 多播 DNS-SD：`local.`
- 单播 DNS-SD（Wide-Area Bonjour）：选择一个域名（例如：`openclaw.internal.`），并设置 split DNS + DNS 服务器；参见 [Bonjour](/zh-CN/gateway/bonjour)。

只有启用了 Bonjour 发现（默认启用）的 gateway 才会通告该信标。

Wide-Area 发现记录包含（TXT）：

- `role`（gateway 角色提示）
- `transport`（传输提示，例如 `gateway`）
- `gatewayPort`（WebSocket 端口，通常为 `18789`）
- `sshPort`（可选；当其缺失时，客户端会将默认 SSH 目标设为 `22`）
- `tailnetDns`（MagicDNS 主机名，如果可用）
- `gatewayTls` / `gatewayTlsSha256`（是否启用 TLS + 证书指纹）
- `cliPath`（写入广域区域的远程安装提示）

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  每个命令的超时时间（browse / resolve）。
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
- CLI 会扫描 `local.` 以及已配置的广域域名（如果已启用）。
- JSON 输出中的 `wsUrl` 是根据已解析的服务端点推导得出的，而不是来自 `lanHost` 或 `tailnetDns` 这类仅 TXT 的提示。
- 在 `local.` mDNS 上，只有当 `discovery.mdns.mode` 为 `full` 时，才会广播 `sshPort` 和 `cliPath`。Wide-Area DNS-SD 仍会写入 `cliPath`；`sshPort` 在那里也仍然是可选的。
</Note>

## 相关

- [CLI 参考](/zh-CN/cli)
- [Gateway 网关运行手册](/zh-CN/gateway)

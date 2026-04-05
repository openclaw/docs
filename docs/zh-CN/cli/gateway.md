---
read_when:
    - 从 CLI 运行 Gateway 网关（开发或服务器环境）
    - 调试 Gateway 网关认证、绑定模式和连接性
    - 通过 Bonjour 发现 gateways（本地 + 广域 DNS-SD）
summary: OpenClaw Gateway 网关 CLI（`openclaw gateway`）——运行、查询和发现 gateways
title: gateway
x-i18n:
    generated_at: "2026-04-05T08:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e311ded0dbad84b8212f0968f3563998d49c5e0eb292a0dc4b3bd3c22d4fa7f2
    source_path: cli/gateway.md
    workflow: 15
---

# Gateway CLI

Gateway 网关是 OpenClaw 的 WebSocket 服务器（渠道、节点、会话、hooks）。

本页中的子命令都位于 `openclaw gateway …` 之下。

相关文档：

- [/gateway/bonjour](/gateway/bonjour)
- [/gateway/discovery](/gateway/discovery)
- [/gateway/configuration](/gateway/configuration)

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

- 默认情况下，除非在 `~/.openclaw/openclaw.json` 中设置了 `gateway.mode=local`，否则 Gateway 网关会拒绝启动。临时/开发运行请使用 `--allow-unconfigured`。
- 预期 `openclaw onboard --mode local` 和 `openclaw setup` 会写入 `gateway.mode=local`。如果文件存在但缺少 `gateway.mode`，应将其视为配置损坏或被覆盖，并进行修复，而不是隐式假定为 local 模式。
- 如果文件存在且缺少 `gateway.mode`，Gateway 网关会将其视为可疑的配置损坏，并拒绝替你“猜测为 local”。
- 未启用认证时，禁止绑定到 loopback 之外的地址（安全护栏）。
- 在获得授权时，`SIGUSR1` 会触发进程内重启（默认启用 `commands.restart`；设置 `commands.restart: false` 可阻止手动重启，但 gateway 工具/配置 apply/update 仍然允许）。
- `SIGINT`/`SIGTERM` 处理器会停止 gateway 进程，但不会恢复任何自定义终端状态。如果你用 TUI 或 raw mode 输入包装该 CLI，请在退出前恢复终端。

### 选项

- `--port <port>`：WebSocket 端口（默认值来自配置/环境变量；通常为 `18789`）。
- `--bind <loopback|lan|tailnet|auto|custom>`：监听器绑定模式。
- `--auth <token|password>`：认证模式覆盖。
- `--token <token>`：token 覆盖（也会为当前进程设置 `OPENCLAW_GATEWAY_TOKEN`）。
- `--password <password>`：password 覆盖。警告：内联 password 可能会暴露在本地进程列表中。
- `--password-file <path>`：从文件读取 gateway password。
- `--tailscale <off|serve|funnel>`：通过 Tailscale 暴露 Gateway 网关。
- `--tailscale-reset-on-exit`：关闭时重置 Tailscale serve/funnel 配置。
- `--allow-unconfigured`：在配置中没有 `gateway.mode=local` 时也允许 gateway 启动。这只会绕过临时/开发引导的启动护栏；不会写入或修复配置文件。
- `--dev`：如果缺失，则创建开发配置和工作区（跳过 `BOOTSTRAP.md`）。
- `--reset`：重置开发配置 + 凭证 + 会话 + 工作区（需要 `--dev`）。
- `--force`：启动前杀掉所选端口上任何现有的监听器。
- `--verbose`：详细日志。
- `--cli-backend-logs`：仅在控制台显示 CLI 后端日志（并启用 stdout/stderr）。
- `--claude-cli-logs`：`--cli-backend-logs` 的废弃别名。
- `--ws-log <auto|full|compact>`：websocket 日志样式（默认 `auto`）。
- `--compact`：`--ws-log compact` 的别名。
- `--raw-stream`：将原始模型流事件记录到 jsonl。
- `--raw-stream-path <path>`：原始流 jsonl 路径。

## 查询正在运行的 Gateway 网关

所有查询命令都使用 WebSocket RPC。

输出模式：

- 默认：人类可读（在 TTY 中带颜色）。
- `--json`：机器可读 JSON（无样式/旋转指示器）。
- `--no-color`（或 `NO_COLOR=1`）：禁用 ANSI，同时保留人类可读布局。

共享选项（在支持的地方）：

- `--url <url>`：Gateway 网关 WebSocket URL。
- `--token <token>`：Gateway 网关 token。
- `--password <password>`：Gateway 网关 password。
- `--timeout <ms>`：超时/预算（因命令而异）。
- `--expect-final`：等待“final”响应（智能体调用）。

注意：设置 `--url` 后，CLI 不会回退到配置或环境变量中的凭证。
请显式传入 `--token` 或 `--password`。缺少显式凭证会报错。

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

### `gateway usage-cost`

从会话日志中获取 usage-cost 汇总。

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

选项：

- `--days <days>`：要包含的天数（默认 `30`）。

### `gateway status`

`gateway status` 显示 Gateway 网关服务（launchd/systemd/schtasks）以及可选的 RPC 探测。

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

选项：

- `--url <url>`：添加一个显式探测目标。仍会探测已配置的远程地址和 localhost。
- `--token <token>`：探测使用的 token 认证。
- `--password <password>`：探测使用的 password 认证。
- `--timeout <ms>`：探测超时（默认 `10000`）。
- `--no-probe`：跳过 RPC 探测（仅查看服务）。
- `--deep`：同时扫描系统级服务。
- `--require-rpc`：当 RPC 探测失败时以非零状态退出。不能与 `--no-probe` 组合使用。

说明：

- 即使本地 CLI 配置缺失或无效，`gateway status` 仍可用于诊断。
- `gateway status` 会在可能时解析已配置的认证 SecretRef，以用于探测认证。
- 如果此命令路径中无法解析必需的认证 SecretRef，且探测连接/认证失败，`gateway status --json` 会报告 `rpc.authWarning`；请显式传入 `--token`/`--password`，或先解析该密钥来源。
- 如果探测成功，则会抑制未解析认证引用的警告，以避免误报。
- 当脚本和自动化场景中仅有监听服务还不够、你还需要 Gateway 网关 RPC 本身健康时，请使用 `--require-rpc`。
- `--deep` 会额外尽力扫描 launchd/systemd/schtasks 安装项。当检测到多个类似 gateway 的服务时，人类可读输出会打印清理提示，并警告大多数安装应当每台机器只运行一个 gateway。
- 人类可读输出会包含已解析的文件日志路径，以及 CLI 与服务的配置路径/有效性快照，以帮助诊断 profile 或状态目录漂移。
- 在 Linux systemd 安装中，服务认证漂移检查会同时读取 unit 中的 `Environment=` 和 `EnvironmentFile=` 值（包括 `%h`、带引号路径、多个文件和可选 `-` 文件）。
- 漂移检查会使用合并后的运行时环境解析 `gateway.auth.token` SecretRef（优先使用服务命令环境，其次回退到进程环境）。
- 如果 token 认证实际上未启用（`gateway.auth.mode` 明确为 `password`/`none`/`trusted-proxy`，或 mode 未设置且 password 可能生效且没有任何 token 候选值可能生效），则 token 漂移检查会跳过配置 token 解析。

### `gateway probe`

`gateway probe` 是“调试所有内容”的命令。它始终会探测：

- 你已配置的远程 gateway（如果已设置），以及
- 本地 localhost（local loopback），**即使已配置远程地址也是如此**。

如果你传入 `--url`，该显式目标会被加到前面，优先于其他两个。人类可读输出会将目标标记为：

- `URL（显式）`
- `Remote（已配置）` 或 `Remote（已配置但未激活）`
- `Local loopback`

如果可达多个 gateway，它会全部打印出来。当你使用隔离的 profiles/ports（例如救援 bot）时，支持多个 gateways，但大多数安装仍然只运行单个 gateway。

```bash
openclaw gateway probe
openclaw gateway probe --json
```

解释：

- `Reachable: yes` 表示至少有一个目标接受了 WebSocket 连接。
- `RPC: ok` 表示详情 RPC 调用（`health`/`status`/`system-presence`/`config.get`）也成功了。
- `RPC: limited - missing scope: operator.read` 表示连接成功，但详情 RPC 受 scope 限制。这会被报告为**降级**可达性，而不是完全失败。
- 仅当所有被探测目标都不可达时，退出码才为非零。

JSON 说明（`--json`）：

- 顶层：
  - `ok`：至少有一个目标可达。
  - `degraded`：至少有一个目标的详情 RPC 因 scope 限制而受限。
  - `primaryTargetId`：按以下顺序视为活动优先目标的最佳目标：显式 URL、SSH 隧道、已配置远程地址，然后是 local loopback。
  - `warnings[]`：尽力生成的警告记录，包含 `code`、`message` 和可选的 `targetIds`。
  - `network`：根据当前配置和主机网络推导出的 local loopback/tailnet URL 提示。
  - `discovery.timeoutMs` 和 `discovery.count`：本次探测使用的实际发现预算/结果数量。
- 每个目标（`targets[].connect`）：
  - `ok`：连接后加上降级分类后的可达性。
  - `rpcOk`：完整详情 RPC 成功。
  - `scopeLimited`：详情 RPC 因缺少 operator scope 而失败。

常见警告代码：

- `ssh_tunnel_failed`：SSH 隧道建立失败；命令已回退为直接探测。
- `multiple_gateways`：有多个目标可达；除非你有意运行隔离的 profiles（例如救援 bot），否则这并不常见。
- `auth_secretref_unresolved`：失败目标的某个已配置认证 SecretRef 无法解析。
- `probe_scope_limited`：WebSocket 连接成功，但详情 RPC 因缺少 `operator.read` 而受限。

#### 通过 SSH 访问远程端（与 Mac 应用一致）

macOS 应用中的 “Remote over SSH” 模式使用本地端口转发，使远程 gateway（它可能只绑定在 loopback 上）可通过 `ws://127.0.0.1:<port>` 访问。

CLI 等价命令：

```bash
openclaw gateway probe --ssh user@gateway-host
```

选项：

- `--ssh <target>`：`user@host` 或 `user@host:port`（端口默认 `22`）。
- `--ssh-identity <path>`：身份文件。
- `--ssh-auto`：从已解析的
  发现端点（`local.` 加上已配置的广域域名（如果有））中，选择第一个发现到的 gateway 主机作为 SSH 目标。仅有 TXT 的
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

- `--params <json>`：参数的 JSON 对象字符串（默认 `{}`）
- `--url <url>`
- `--token <token>`
- `--password <password>`
- `--timeout <ms>`
- `--expect-final`
- `--json`

说明：

- `--params` 必须是有效 JSON。
- `--expect-final` 主要用于智能体风格的 RPC：它们会先流式发送中间事件，再给出最终负载。

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
- 当 token 认证要求 token 且 `gateway.auth.token` 由 SecretRef 管理时，`gateway install` 会验证该 SecretRef 可被解析，但不会将解析后的 token 持久化到服务环境元数据中。
- 如果 token 认证要求 token，而配置的 token SecretRef 无法解析，安装会以关闭方式失败，而不是持久化回退的纯文本。
- 对于 `gateway run` 的 password 认证，优先使用 `OPENCLAW_GATEWAY_PASSWORD`、`--password-file` 或由 SecretRef 支持的 `gateway.auth.password`，而不是内联 `--password`。
- 在推断认证模式下，仅 shell 中的 `OPENCLAW_GATEWAY_PASSWORD` 不会放宽安装对 token 的要求；安装托管服务时，请使用持久配置（`gateway.auth.password` 或配置中的 `env`）。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`，且 `gateway.auth.mode` 未设置，则在显式设置 mode 之前会阻止安装。
- 生命周期命令接受 `--json` 以便脚本使用。

## 发现 gateways（Bonjour）

`gateway discover` 会扫描 Gateway 网关信标（`_openclaw-gw._tcp`）。

- 组播 DNS-SD：`local.`
- 单播 DNS-SD（广域 Bonjour）：选择一个域名（例如：`openclaw.internal.`）并设置 split DNS + DNS 服务器；参见 [/gateway/bonjour](/gateway/bonjour)

只有启用了 Bonjour 设备发现的 gateways（默认启用）才会广播该信标。

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

选项：

- `--timeout <ms>`：每个命令的超时时间（browse/resolve）；默认 `2000`。
- `--json`：机器可读输出（同时禁用样式/旋转指示器）。

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

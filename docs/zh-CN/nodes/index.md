---
read_when:
    - 将 iOS/Android 节点配对到 Gateway 网关
    - 将节点 canvas/camera 用作智能体上下文
    - 添加新的节点命令或 CLI 辅助工具
summary: 节点：用于 canvas/camera/screen/device/notifications/system 的配对、能力、权限和 CLI 辅助工具
title: 节点
x-i18n:
    generated_at: "2026-04-27T12:53:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59ab02fe377c5f3dae0e86aa14c6ae9a211259c52061630c4daf29bd3d1cb443
    source_path: nodes/index.md
    workflow: 15
---

**节点**是连接到 Gateway 网关 **WebSocket**（与 operator 使用同一端口）的配套设备（macOS/iOS/Android/无头），连接时使用 `role: "node"`，并通过 `node.invoke` 暴露命令接口（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。协议细节请参见：[Gateway 网关 协议](/zh-CN/gateway/protocol)。

旧版传输协议：[Bridge protocol（旧版节点，历史参考）](/zh-CN/gateway/bridge-protocol)（TCP JSONL；仅供当前节点作历史参考）。

macOS 也可以运行在**节点模式**下：菜单栏应用会连接到 Gateway 网关 的 WS 服务器，并将其本地的 canvas/camera 命令作为节点暴露出来（因此 `openclaw nodes …` 可以针对这台 Mac 工作）。在远程 Gateway 网关 模式下，浏览器自动化由 CLI 节点主机（`openclaw node run` 或已安装的节点服务）处理，而不是由原生应用节点处理。

注意：

- 节点是**外围设备**，不是 Gateway 网关。它们不运行 gateway 服务。
- Telegram/WhatsApp 等消息会到达 **gateway**，而不是节点。
- 故障排除手册：[/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)

## 配对 + 状态

**WS 节点使用设备配对。** 节点在 `connect` 期间会提供设备身份；Gateway 网关 会为 `role: node` 创建设备配对请求。可通过 devices CLI（或 UI）进行批准。

快速 CLI：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

如果某个节点以变更后的认证细节（role/scopes/public key）重试，先前待处理的请求会被替换，并创建新的 `requestId`。请在批准前重新运行 `openclaw devices list`。

注意：

- 当节点的设备配对角色包含 `node` 时，`nodes status` 会将该节点标记为**已配对**。
- 设备配对记录是持久化的已批准角色契约。token 轮换会保持在该契约内部；它不能将已配对节点升级为配对批准未授予的其他角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是另一个由 gateway 拥有的节点配对存储；它**不会**控制 WS `connect` 握手。
- `openclaw nodes remove --node <id|name|ip>` 会从这个独立的、由 gateway 拥有的节点配对存储中删除过期条目。
- 批准范围遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 远程节点主机（system.run）

当你的 Gateway 网关 运行在一台机器上，而你希望命令在另一台机器上执行时，请使用**节点主机**。模型仍然与 **gateway** 通信；当选择 `host=node` 时，gateway 会将 `exec` 调用转发到**节点主机**。

### 各部分运行位置

- **Gateway 网关 主机**：接收消息、运行模型、路由工具调用。
- **节点主机**：在节点机器上执行 `system.run`/`system.which`。
- **审批**：通过 `~/.openclaw/exec-approvals.json` 在节点主机上强制执行。

审批说明：

- 基于审批的节点执行会绑定精确的请求上下文。
- 对于直接的 shell/运行时文件执行，OpenClaw 还会尽力绑定一个具体的本地文件操作数；如果该文件在执行前发生变化，则拒绝执行。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别唯一的具体本地文件，则会拒绝基于审批的执行，而不是假装覆盖了完整运行时语义。对于更广泛的解释器语义，请使用沙箱隔离、独立主机，或显式的受信任允许列表/完整工作流。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 通过 SSH 隧道连接远程 Gateway 网关（loopback 绑定）

如果 Gateway 网关 绑定到 loopback（`gateway.bind=loopback`，本地模式默认值），远程节点主机将无法直接连接。请创建 SSH 隧道，并让节点主机指向隧道的本地端。

示例（节点主机 -> gateway 主机）：

```bash
# 终端 A（保持运行）：将本地 18790 转发到 gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 终端 B：导出 gateway token，并通过隧道连接
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意：

- `openclaw node run` 支持 token 或 password 认证。
- 优先使用环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退项为 `gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机会刻意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，`gateway.remote.token` / `gateway.remote.password` 会根据远程优先级规则生效。
- 如果已配置活动中的本地 `gateway.auth.*` SecretRefs 但未解析，节点主机认证会以失败关闭方式处理。
- 节点主机认证解析仅识别 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### 配对 + 命名

在 gateway 主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果节点以变更后的认证细节重试，请重新运行 `openclaw devices list` 并批准当前的 `requestId`。

命名选项：

- 在 `openclaw node run` / `openclaw node install` 上使用 `--display-name`（持久保存在节点上的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（gateway 覆盖）。

### 将命令加入允许列表

Exec 审批是**按节点主机**划分的。可从 gateway 添加允许列表条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

审批存储在节点主机上的 `~/.openclaw/exec-approvals.json`。

### 让 exec 指向节点

配置默认值（gateway 配置）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或者按会话设置：

```
/exec host=node security=allowlist node=<id-or-name>
```

设置完成后，任何带有 `host=node` 的 `exec` 调用都会在节点主机上运行（受节点允许列表/审批约束）。

`host=auto` 不会自行隐式选择节点，但允许来自 `auto` 的显式逐次调用 `host=node` 请求。如果你希望节点 exec 成为该会话的默认行为，请显式设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关内容：

- [节点主机 CLI](/zh-CN/cli/node)
- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)

## 调用命令

底层方式（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

针对常见的“为智能体提供 MEDIA 附件”工作流，还提供了更高层的辅助工具。

## 截图（canvas 快照）

如果节点正在显示 Canvas（WebView），`canvas.snapshot` 会返回 `{ format, base64 }`。

CLI 辅助工具（写入临时文件并打印 `MEDIA:<path>`）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控制

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意：

- `canvas present` 接受 URL 或本地文件路径（`--target`），并支持可选的 `--x/--y/--width/--height` 用于定位。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意：

- 仅支持 A2UI v0.8 JSONL（v0.9/createSurface 会被拒绝）。

## 照片 + 视频（节点 camera）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 默认：两个朝向都拍摄（2 行 MEDIA）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

视频片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意：

- 节点必须处于**前台**，`canvas.*` 和 `camera.*` 才可用（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 片段时长会被限制（当前为 `<= 60s`），以避免过大的 base64 负载。
- Android 会在可能时提示 `CAMERA`/`RECORD_AUDIO` 权限；若权限被拒绝，将以 `*_PERMISSION_REQUIRED` 失败。

## 屏幕录制（节点）

受支持的节点会暴露 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意：

- `screen.record` 的可用性取决于节点平台。
- 屏幕录制会被限制为 `<= 60s`。
- `--no-audio` 会在受支持的平台上禁用麦克风采集。
- 多屏幕情况下，使用 `--screen <index>` 选择显示器。

## 位置（节点）

当在设置中启用位置功能时，节点会暴露 `location.get`。

CLI 辅助工具：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意：

- 位置功能**默认关闭**。
- “始终”需要系统权限；后台获取属于尽力而为。
- 响应包含纬度/经度、精度（米）和时间戳。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持蜂窝通信时，Android 节点可以暴露 `sms.send`。

底层调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意：

- 在能力被宣告之前，必须先在 Android 设备上接受权限提示。
- 不支持蜂窝通信的纯 Wi‑Fi 设备不会宣告 `sms.send`。

## Android 设备 + 个人数据命令

当启用了相应能力时，Android 节点可以宣告额外的命令族。

可用命令族：

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

调用示例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注意：

- motion 命令会根据可用传感器进行能力门控。

## 系统命令（节点主机 / mac 节点）

macOS 节点暴露 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。
无头节点主机暴露 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

示例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意：

- `system.run` 会在负载中返回 stdout/stderr/退出码。
- shell 执行现在通过设置了 `host=node` 的 `exec` 工具进行；`nodes` 仍然是显式节点命令的直接 RPC 接口。
- `nodes invoke` 不暴露 `system.run` 或 `system.run.prepare`；它们仅保留在 exec 路径上。
- exec 路径会在审批前准备规范化的 `systemRunPlan`。一旦审批通过，gateway 转发的是该已存储的计划，而不是任何之后由调用方编辑的 command/cwd/session 字段。
- `system.notify` 会遵循 macOS 应用中的通知权限状态。
- 无法识别的节点 `platform` / `deviceFamily` 元数据会使用保守的默认允许列表，其中不包含 `system.run` 和 `system.which`。如果你确实需要在未知平台上使用这些命令，请通过 `gateway.nodes.allowCommands` 显式添加。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 `--env` 值会被收缩为显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 对于允许列表模式中的始终允许决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化任何允许列表条目。
- 在允许列表模式下的 Windows 节点主机上，通过 `cmd.exe /c` 运行的 shell 包装器需要审批（仅有允许列表条目并不会自动允许这种包装器形式）。
- `system.notify` 支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 节点主机会忽略 `PATH` 覆盖，并剥离危险的启动/ shell 键（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）。如果你需要额外的 PATH 条目，请配置节点主机服务环境（或将工具安装到标准位置），而不是通过 `--env` 传递 `PATH`。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中的 exec 审批控制（设置 → Exec approvals）。Ask/allowlist/full 的行为与无头节点主机相同；被拒绝的提示会返回 `SYSTEM_RUN_DENIED`。
- 在无头节点主机上，`system.run` 受 exec 审批控制（`~/.openclaw/exec-approvals.json`）。

## Exec 节点绑定

当有多个节点可用时，你可以将 exec 绑定到特定节点。
这会为 `exec host=node` 设置默认节点（并且可以按智能体覆盖）。

全局默认值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按智能体覆盖：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

取消设置以允许任意节点：

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 权限映射

节点可以在 `node.list` / `node.describe` 中包含一个 `permissions` 映射，按权限名称作为键（例如 `screenRecording`、`accessibility`），值为布尔值（`true` = 已授予）。

## 无头节点主机（跨平台）

OpenClaw 可以运行一个**无头节点主机**（无 UI），它会连接到 Gateway 网关 WebSocket 并暴露 `system.run` / `system.which`。这在 Linux/Windows 上，或者你想在服务器旁运行一个最小节点时很有用。

启动方式：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意：

- 仍然需要配对（Gateway 网关 会显示设备配对提示）。
- 节点主机会将其节点 id、token、显示名称和 Gateway 网关 连接信息存储在 `~/.openclaw/node.json` 中。
- Exec 审批会通过本地 `~/.openclaw/exec-approvals.json` 强制执行
  （参见 [Exec approvals](/zh-CN/tools/exec-approvals)）。
- 在 macOS 上，无头节点主机默认会在本地执行 `system.run`。设置
  `OPENCLAW_NODE_EXEC_HOST=app` 可将 `system.run` 路由到配套应用 exec 主机；再添加
  `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求必须使用应用主机，并在其不可用时以失败关闭方式处理。
- 当 Gateway 网关 WS 使用 TLS 时，请添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用会作为节点连接到 Gateway 网关 WS 服务器（因此 `openclaw nodes …` 可以针对这台 Mac 工作）。
- 在远程模式下，该应用会为 Gateway 网关 端口打开 SSH 隧道，并连接到 `localhost`。

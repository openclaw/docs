---
read_when:
    - 将 iOS/Android 节点配对到 Gateway 网关
    - 使用节点画布/摄像头作为智能体上下文
    - 添加新的 Node 命令或 CLI 辅助工具
summary: 节点：用于画布/摄像头/屏幕/设备/通知/系统的配对、能力、权限和 CLI 辅助工具
title: 节点
x-i18n:
    generated_at: "2026-04-30T04:07:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 060319f540fe3c4d168516df8cced9caad26d9281592c9a9537ab6df393dce43
    source_path: nodes/index.md
    workflow: 16
---

**节点** 是一种配套设备（macOS/iOS/Android/无头设备），它会使用 `role: "node"` 连接到 Gateway 网关 **WebSocket**（与操作者使用同一端口），并通过 `node.invoke` 暴露命令表面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

旧版传输协议：[Bridge protocol](/zh-CN/gateway/bridge-protocol)（TCP JSONL；
仅供当前节点历史参考）。

macOS 也可以在 **节点模式** 下运行：菜单栏应用会连接到 Gateway 网关的
WS 服务器，并将其本地画布/相机命令作为节点暴露（因此
`openclaw nodes …` 可针对这台 Mac 工作）。在远程 Gateway 网关模式下，浏览器
自动化由 CLI 节点主机（`openclaw node run` 或已安装的
节点服务）处理，而不是由原生应用节点处理。

注意事项：

- 节点是 **外围设备**，不是网关。它们不会运行网关服务。
- Telegram/WhatsApp 等消息会落到 **网关**，不是节点。
- 故障排除运行手册：[/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)

## 配对 + 状态

**WS 节点使用设备配对。** 节点在 `connect` 期间提供设备身份；Gateway 网关
会为 `role: node` 创建设备配对请求。通过设备 CLI（或 UI）批准。

快速 CLI：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

如果节点使用已更改的身份验证详情（角色/范围/公钥）重试，先前的
待处理请求会被取代，并创建新的 `requestId`。批准前请重新运行
`openclaw devices list`。

注意事项：

- 当设备配对角色包含 `node` 时，`nodes status` 会将节点标记为 **已配对**。
- 设备配对记录是持久的已批准角色契约。令牌
  轮换会保持在该契约内；它不能把已配对节点升级为
  配对批准从未授予的其他角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是单独的 Gateway 网关自有
  节点配对存储；它 **不会** 控制 WS `connect` 握手。
- `openclaw nodes remove --node <id|name|ip>` 会从该
  单独的 Gateway 网关自有节点配对存储中删除过期条目。
- 批准范围遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 远程节点主机（system.run）

当你的 Gateway 网关运行在一台机器上，而你想在另一台机器上执行命令时，请使用 **节点主机**。模型仍然与 **网关** 通信；当选择 `host=node` 时，网关
会把 `exec` 调用转发到 **节点主机**。

### 运行位置

- **Gateway 网关主机**：接收消息、运行模型、路由工具调用。
- **节点主机**：在节点机器上执行 `system.run`/`system.which`。
- **批准**：通过 `~/.openclaw/exec-approvals.json` 在节点主机上强制执行。

批准说明：

- 基于批准的节点运行会绑定确切的请求上下文。
- 对于直接 shell/运行时文件执行，OpenClaw 还会尽力绑定一个具体本地
  文件操作数，并在该文件执行前发生变化时拒绝运行。
- 如果 OpenClaw 无法为解释器/运行时命令准确识别一个具体本地文件，
  基于批准的执行会被拒绝，而不是假装已覆盖完整运行时。对于更广泛的解释器语义，请使用沙箱隔离、
  独立主机，或显式受信任的允许列表/完整工作流。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 通过 SSH 隧道访问远程 Gateway 网关（loopback 绑定）

如果 Gateway 网关绑定到 loopback（`gateway.bind=loopback`，本地模式默认值），
远程节点主机无法直接连接。创建 SSH 隧道，并将
节点主机指向隧道的本地端。

示例（节点主机 -> Gateway 网关主机）：

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意事项：

- `openclaw node run` 支持令牌或密码身份验证。
- 首选环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退为 `gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机会有意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，`gateway.remote.token` / `gateway.remote.password` 可按远程优先级规则使用。
- 如果已配置活动的本地 `gateway.auth.*` SecretRefs 但无法解析，节点主机身份验证会失败关闭。
- 节点主机身份验证解析只认可 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### 配对 + 命名

在 Gateway 网关主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果节点使用已更改的身份验证详情重试，请重新运行 `openclaw devices list`
并批准当前的 `requestId`。

命名选项：

- `openclaw node run` / `openclaw node install` 上的 `--display-name`（持久保存在节点上的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（网关覆盖）。

### 将命令加入允许列表

Exec 批准是 **按节点主机** 生效的。从网关添加允许列表条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

批准记录位于节点主机的 `~/.openclaw/exec-approvals.json`。

### 将 exec 指向节点

配置默认值（网关配置）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或按会话设置：

```
/exec host=node security=allowlist node=<id-or-name>
```

设置后，任何带有 `host=node` 的 `exec` 调用都会在节点主机上运行（受
节点允许列表/批准约束）。

`host=auto` 不会自行隐式选择节点，但允许从 `auto` 发出显式的按调用 `host=node` 请求。如果你希望节点 exec 成为会话默认值，请显式设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关内容：

- [节点主机 CLI](/zh-CN/cli/node)
- [Exec 工具](/zh-CN/tools/exec)
- [Exec 批准](/zh-CN/tools/exec-approvals)

## 调用命令

底层方式（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

针对常见的“给智能体一个 MEDIA 附件”工作流，也提供了更高层的辅助命令。

## 命令策略

节点命令必须通过两道门禁后才能被调用：

1. 节点必须在其 WebSocket `connect.commands` 列表中声明该命令。
2. 网关的平台策略必须允许已声明的命令。

Windows 和 macOS 配套节点默认允许安全的已声明命令，例如
`canvas.*`、`camera.list`、`location.get` 和 `screen.snapshot`。
危险或涉及较多隐私的命令，例如 `camera.snap`、`camera.clip` 和
`screen.record`，仍然需要通过
`gateway.nodes.allowCommands` 显式选择启用。`gateway.nodes.denyCommands` 始终优先于
默认值和额外允许列表条目。

插件拥有的节点命令可以添加 Gateway 网关 node-invoke 策略。该策略
会在允许列表检查之后、转发到节点之前运行，因此原始
`node.invoke`、CLI 辅助命令和专用智能体工具共享同一个插件
权限边界。危险的插件节点命令仍然需要显式
`gateway.nodes.allowCommands` 选择启用。

节点更改其声明的命令列表后，请拒绝旧的设备配对
并批准新请求，以便网关存储更新后的命令快照。

## 屏幕截图（画布快照）

如果节点正在显示 Canvas（WebView），`canvas.snapshot` 会返回 `{ format, base64 }`。

CLI 辅助命令（写入临时文件并打印 `MEDIA:<path>`）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控件

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意事项：

- `canvas present` 接受 URL 或本地文件路径（`--target`），还可使用可选的 `--x/--y/--width/--height` 进行定位。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意事项：

- 仅支持 A2UI v0.8 JSONL（会拒绝 v0.9/createSurface）。

## 照片 + 视频（节点相机）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

视频片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意事项：

- 对于 `canvas.*` 和 `camera.*`，节点必须处于 **前台**（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 片段时长会被限制（当前为 `<= 60s`），以避免过大的 base64 载荷。
- Android 会尽可能提示授予 `CAMERA`/`RECORD_AUDIO` 权限；被拒绝的权限会以 `*_PERMISSION_REQUIRED` 失败。

## 屏幕录制（节点）

受支持的节点会暴露 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意事项：

- `screen.record` 可用性取决于节点平台。
- 屏幕录制会被限制为 `<= 60s`。
- `--no-audio` 会在受支持的平台上禁用麦克风捕获。
- 当有多个屏幕可用时，使用 `--screen <index>` 选择显示器。

## 位置（节点）

当设置中启用位置时，节点会暴露 `location.get`。

CLI 辅助命令：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意事项：

- 位置默认 **关闭**。
- “始终”需要系统权限；后台获取会尽力执行。
- 响应包含纬度/经度、准确度（米）和时间戳。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持电话功能时，Android 节点可以暴露 `sms.send`。

底层调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意事项：

- 必须先在 Android 设备上接受权限提示，能力才会被公布。
- 不带电话功能的仅 Wi-Fi 设备不会公布 `sms.send`。

## Android 设备 + 个人数据命令

当相应能力已启用时，Android 节点可以公布额外的命令系列。

可用系列：

- `device.status`、`device.info`、`device.permissions`、`device.health`
- `notifications.list`、`notifications.actions`
- `photos.latest`
- `contacts.search`、`contacts.add`
- `calendar.events`、`calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`、`motion.pedometer`

调用示例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

注意：

- 动作命令受可用传感器的能力门控限制。

## 系统命令（节点主机 / Mac 节点）

macOS 节点公开 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。
无头节点主机公开 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

示例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

注意：

- `system.run` 在载荷中返回 stdout/stderr/退出码。
- Shell 执行现在通过 `exec` 工具并使用 `host=node`；`nodes` 仍是显式节点命令的直接 RPC 接口。
- `nodes invoke` 不公开 `system.run` 或 `system.run.prepare`；它们只保留在 exec 路径上。
- exec 路径会在批准前准备一个规范的 `systemRunPlan`。一旦批准被授予，Gateway 网关会转发该已存储的计划，而不是后续由调用方编辑过的 command/cwd/session 字段。
- `system.notify` 遵循 macOS 应用上的通知权限状态。
- 无法识别的节点 `platform` / `deviceFamily` 元数据会使用保守的默认允许列表，其中不包含 `system.run` 和 `system.which`。如果你确实需要为未知平台使用这些命令，请通过 `gateway.nodes.allowCommands` 显式添加它们。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 Shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 `--env` 值会被缩减为显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允许列表模式下，对于始终允许决策，已知的分发包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化允许列表条目。
- 在允许列表模式下，Windows 节点主机通过 `cmd.exe /c` 运行 Shell 包装器时需要批准（仅有允许列表条目不会自动允许该包装器形式）。
- `system.notify` 支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 节点主机会忽略 `PATH` 覆盖，并剥离危险的启动/ Shell 键（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）。如果你需要额外的 PATH 条目，请改为配置节点主机服务环境（或将工具安装到标准位置），而不是通过 `--env` 传递 `PATH`。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中的 exec 批准门控（Settings → Exec approvals）。
  Ask/allowlist/full 的行为与无头节点主机相同；被拒绝的提示会返回 `SYSTEM_RUN_DENIED`。
- 在无头节点主机上，`system.run` 受 exec 批准门控（`~/.openclaw/exec-approvals.json`）。

## Exec 节点绑定

当有多个节点可用时，你可以将 exec 绑定到特定节点。
这会为 `exec host=node` 设置默认节点（也可以按智能体覆盖）。

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

节点可以在 `node.list` / `node.describe` 中包含 `permissions` 映射，以权限名称为键（例如 `screenRecording`、`accessibility`），值为布尔值（`true` = 已授予）。

## 无头节点主机（跨平台）

OpenClaw 可以运行一个**无头节点主机**（无 UI），它连接到 Gateway 网关
WebSocket，并公开 `system.run` / `system.which`。这在 Linux/Windows 上很有用，
也适合在服务器旁运行一个最小节点。

启动它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意：

- 仍然需要配对（Gateway 网关会显示设备配对提示）。
- 节点主机会将其节点 ID、令牌、显示名称和 Gateway 网关连接信息存储在 `~/.openclaw/node.json` 中。
- Exec 批准会通过 `~/.openclaw/exec-approvals.json` 在本地强制执行
  （参见 [Exec 批准](/zh-CN/tools/exec-approvals)）。
- 在 macOS 上，无头节点主机默认在本地执行 `system.run`。设置
  `OPENCLAW_NODE_EXEC_HOST=app` 可将 `system.run` 路由到配套应用的 exec 主机；添加
  `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求使用应用主机，并在它不可用时安全失败。
- 当 Gateway 网关 WS 使用 TLS 时，添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用作为节点连接到 Gateway 网关 WS 服务器（因此 `openclaw nodes …` 可对此 Mac 生效）。
- 在远程模式下，应用会为 Gateway 网关端口打开 SSH 隧道并连接到 `localhost`。

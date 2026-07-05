---
read_when:
    - 将 iOS/Android 节点配对到 Gateway 网关
    - 将节点画布/摄像头用于智能体上下文
    - 添加新的节点命令或 CLI 辅助工具
summary: 节点：用于画布/摄像头/屏幕/设备/通知/系统的配对、能力、权限和 CLI 辅助工具
title: 节点
x-i18n:
    generated_at: "2026-07-05T11:25:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8a781c60e80989d35dcf5bfefe8a3c706e1a1682377876e0d83da924bfcb908
    source_path: nodes/index.md
    workflow: 16
---

一个 **节点** 是连接到 Gateway 网关 **WebSocket**（与操作员使用相同端口）的配套设备（macOS/iOS/Android/headless），连接时使用 `role: "node"`，并通过 `node.invoke` 暴露命令面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

旧版传输：[Bridge protocol](/zh-CN/gateway/bridge-protocol)（TCP JSONL；仅作为当前节点的历史参考）。

macOS 也可以在 **节点模式** 下运行：菜单栏应用连接到 Gateway 网关的 WS 服务器，并将本地 canvas/camera 命令作为节点暴露出来（因此 `openclaw nodes …` 可以针对此 Mac 工作）。在远程 Gateway 网关模式下，浏览器自动化由 CLI 节点主机（`openclaw node run` 或已安装的节点服务）处理，而不是由原生应用节点处理。

节点是**外设**，不是 Gateway 网关：它们不运行 Gateway 网关服务，频道消息（Telegram、WhatsApp 等）到达 Gateway 网关，而不是节点。

故障排查运行手册：[/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)

## 配对 + 状态

WS 节点使用**设备配对**。节点在 `connect` 期间提交设备身份；Gateway 网关会为 `role: node` 创建设备配对请求。通过设备 CLI（或 UI）批准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待处理配对请求会在 5 分钟后过期；完整的请求/批准/token 生命周期见 [Gateway 网关拥有的配对](/zh-CN/gateway/pairing)。如果节点使用已更改的认证详情（角色/权限范围/公钥）重试，之前的待处理请求会被取代，并创建新的 `requestId`——批准前请重新运行 `openclaw devices list`。

- 当节点的设备配对角色包含 `node` 时，`nodes status` 会将该节点标记为**已配对**。
- 设备配对记录是持久的已批准角色契约。Token 轮换保持在该契约内；它不能将已配对节点升级到配对批准从未授予的角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是一个独立的、由 Gateway 网关拥有的节点配对存储，用于跨重连跟踪节点已批准的命令/能力面。它**不会**门控 WS `connect` 握手——设备配对负责这一点。
- `openclaw nodes remove --node <id|name|ip>` 会移除节点配对。对于设备支持的节点，它会撤销 `devices/paired.json` 中该设备的 `node` 角色，并断开该设备的节点角色会话：混合角色设备会保留其行且只失去 `node` 角色，而仅节点设备行会被删除。它还会清除独立节点配对存储中的任何匹配条目。`operator.pairing` 可以移除其他设备上的非操作员节点行；设备 token 调用方在混合角色设备上撤销自己的节点角色时，还需要 `operator.admin`。
- 批准权限范围遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 远程节点主机（system.run）

当你的 Gateway 网关在一台机器上运行，而你想让命令在另一台机器上执行时，请使用**节点主机**。模型仍然与 **Gateway 网关**通信；当选择 `host=node` 时，Gateway 网关会将 `exec` 调用转发到**节点主机**。

| 角色         | 职责                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway 网关主机 | 接收消息、运行模型、路由工具调用。            |
| 节点主机    | 在节点机器上执行 `system.run`/`system.which`。        |
| 审批    | 通过 `~/.openclaw/exec-approvals.json` 在节点主机上强制执行。 |

审批说明：

- 基于审批的节点运行会绑定精确请求上下文。exec 路径会在审批前准备规范的 `systemRunPlan`；一旦授予，Gateway 网关会转发已存储的计划，而不是任何随后由调用方编辑的 command/cwd/session 字段，并会在运行前重新验证工作目录。
- 对于直接 shell/runtime 文件执行，OpenClaw 还会尽力绑定一个具体的本地文件操作数，并在该文件执行前发生变化时拒绝运行。
- 如果 OpenClaw 无法为解释器/runtime 命令准确识别一个具体的本地文件，基于审批的执行会被拒绝，而不是假装具备完整 runtime 覆盖。对于更广泛的解释器语义，请使用沙箱隔离、独立主机，或显式受信任的 allowlist/完整工作流。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 还接受 `--context-path`（Gateway 网关 WS 上下文路径）、`--tls`、`--tls-fingerprint <sha256>` 和 `--node-id`（覆盖它会清除配对 token）。

### 通过 SSH 隧道访问远程 Gateway 网关（loopback 绑定）

如果 Gateway 网关绑定到 loopback（`gateway.bind=loopback`，本地模式默认值），远程节点主机无法直接连接。创建 SSH 隧道，并将节点主机指向隧道的本地端。

示例（节点主机 -> Gateway 网关主机）：

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

说明：

- `openclaw node run` 支持 token 或密码认证。
- 优先使用环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退为 `gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机会有意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，`gateway.remote.token` / `gateway.remote.password` 可按远程优先级规则使用。
- 如果已配置活跃的本地 `gateway.auth.*` SecretRefs 但未解析，节点主机认证会失败关闭。
- 节点主机认证解析只认可 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 还接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`、`--runtime <node|bun>`（默认：node）以及用于重新安装的 `--force`。`node status`、`node stop` 和 `node uninstall` 也可用。

### 配对 + 命名

在 Gateway 网关主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果节点使用已更改的认证详情重试，请重新运行 `openclaw devices list` 并批准当前 `requestId`。

命名选项：

- `openclaw node run` / `openclaw node install` 上的 `--display-name`（持久保存在节点上的 `~/.openclaw/node.json` 中，与节点 id、token 和 Gateway 网关连接信息并列）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 网关覆盖）。

### 将命令加入 allowlist

Exec 审批是**按节点主机**配置的。从 Gateway 网关添加 allowlist 条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

审批位于节点主机上的 `~/.openclaw/exec-approvals.json`。

### 将 exec 指向节点

配置默认值（Gateway 网关配置）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或按会话配置：

```text
/exec host=node security=allowlist node=<id-or-name>
```

设置后，任何带有 `host=node` 的 `exec` 调用都会在节点主机上运行（受节点 allowlist/审批约束）。

`host=auto` 不会自行隐式选择节点，但允许来自 `auto` 的显式逐调用 `host=node` 请求。如果你想让节点 exec 成为会话默认值，请显式设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关内容：

- [节点主机 CLI](/zh-CN/cli/node)
- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)

### 本地模型推理

桌面或服务器节点可以暴露在该节点上运行的 Ollama 服务器中的聊天能力模型。智能体使用 Ollama 插件的 `node_inference` 工具发现已安装模型，并远程运行有边界的 prompt；Gateway 网关不需要直接网络访问 Ollama。设置、模型过滤和直接验证命令见 [Ollama 节点本地推理](/zh-CN/providers/ollama#node-local-inference)。

## 调用命令

低层级（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 会阻止 `system.run` 和 `system.run.prepare`；这些命令只能通过带有 `host=node` 的 `exec` 工具运行（见上文）。常见的“给智能体一个 MEDIA 附件”工作流（canvas、camera、screen、location，见下文）有更高层级的辅助命令。

## 命令策略

节点命令必须通过两个关卡后才能被调用：

1. 节点必须在其 WebSocket `connect.commands` 列表中声明该命令。
2. Gateway 网关的、由平台和审批派生的 allowlist 必须包含声明的命令。

按平台的默认 allowlist（在插件默认值以及 `allowCommands`/`denyCommands` 覆盖之前）：

| 平台 | 默认允许的命令                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（像 `system.run` 这样的节点主机命令由审批门控，见下文）                                                                                                                                                                                                                                  |

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）是 iOS、Android、macOS、Windows 和未知平台（不包括 Linux）上的插件默认值；它们在 iOS 上全部限制为前台使用。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once` 默认允许用于任何声明了 `talk` 能力或声明了 `talk.*` 命令的节点，与平台标签无关。

桌面主机命令（macOS/Windows 上的 `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`screen.snapshot`）不属于上面的静态平台默认表。它们会在操作员批准声明这些命令的配对请求后可用，之后节点已获批准的命令集会在重新连接时继续携带这些命令。

危险或隐私敏感的命令仍然需要通过 `gateway.nodes.allowCommands` 显式选择启用，即使节点声明了它们：`camera.snap`、`camera.clip`、`screen.record`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` 始终优先于默认值和额外的允许列表条目。

插件拥有的节点命令可以添加 Gateway 网关节点调用策略。该策略会在允许列表检查之后、转发到节点之前运行，因此原始 `node.invoke`、CLI 辅助命令和专用智能体工具共享同一个插件权限边界。危险的插件节点命令仍然需要通过 `gateway.nodes.allowCommands` 显式选择启用。

节点更改其声明的命令列表后，请拒绝旧设备配对并批准新请求，以便 Gateway 网关存储更新后的命令快照。

## 配置（`openclaw.json`）

节点相关设置位于 `gateway.nodes` 和 `tools.exec` 下：

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

使用精确的节点命令名称。即使平台默认值或 `allowCommands` 条目原本会允许某个命令，`denyCommands` 也会移除该命令。有关 Gateway 网关节点配对和命令策略字段详情，请参阅 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#gateway)。

按智能体覆盖 exec 节点：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## 截图（canvas 快照）

如果节点正在显示 Canvas（WebView），`canvas.snapshot` 会返回 `{ format, base64 }`。

CLI 辅助命令（写入临时文件并打印保存路径）：

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

说明：

- `canvas present` 接受 URL 或本地文件路径（`--target`），也接受可选的 `--x/--y/--width/--height` 用于定位。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

说明：

- 移动节点使用内置的应用拥有 A2UI 页面进行支持操作的渲染。
- 仅支持 A2UI v0.8 JSONL（会拒绝 v0.9/createSurface）。
- iOS 和 Android 会渲染远程 Gateway 网关 Canvas 页面，但 A2UI 按钮操作只会从内置的应用拥有 A2UI 页面分发。在这些移动客户端上，由 Gateway 网关托管的 HTTP/HTTPS A2UI 页面仅用于渲染。

## 照片 + 视频（节点摄像头）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

视频片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

说明：

- 节点必须在**前台**，才能使用 `canvas.*` 和 `camera.*`（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 节点会限制片段时长，以保持 base64 载荷可控（各平台的具体限制请参阅 [摄像头捕获](/zh-CN/nodes/camera)）。`nodes` 智能体工具还会在转发调用前，将请求的 `durationMs` 限制在 300000（5 分钟）；节点自身会强制执行更严格的限制。
- Android 会在可能时提示授予 `CAMERA`/`RECORD_AUDIO` 权限；权限被拒绝时会以 `*_PERMISSION_REQUIRED` 失败。

## 屏幕录制（节点）

受支持的节点会暴露 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

说明：

- `screen.record` 可用性取决于节点平台。
- `nodes` 智能体工具会将请求的 `durationMs` 限制在 300000（5 分钟）；节点可能会强制执行更严格的限制，以限制返回载荷大小。
- `--no-audio` 会在受支持的平台上禁用麦克风捕获。
- 当有多个屏幕可用时，使用 `--screen <index>` 选择显示器（0 = 主屏）。

## 位置（节点）

在设置中启用位置后，节点会暴露 `location.get`。

CLI 辅助命令：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

说明：

- 位置默认**关闭**。
- “始终”需要系统权限；后台获取是尽力而为。
- 响应包含纬度/经度、精度（米）和时间戳。
- 完整参数/响应形状和错误码：[位置命令](/zh-CN/nodes/location-command)。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持电话功能时，Android 节点可以暴露 `sms.send` 和 `sms.search`。这两个命令默认属于危险命令：在调用它们之前，Gateway 网关操作员还必须将它们添加到 `gateway.nodes.allowCommands`（请参阅 [命令策略](#command-policy)）。

底层调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

说明：

- 必须先在 Android 设备上接受权限提示，才会声明该能力。
- 没有电话功能的仅 Wi-Fi 设备不会声明 `sms.send`。

## 设备和个人数据命令

iOS、Android 和 macOS 节点默认会声明多个只读数据命令（请参阅 [命令策略](#command-policy) 表）；Android 还额外暴露一组更大的命令族，由其应用内设置控制。

可用命令族：

- `device.status`、`device.info` — iOS、Android、macOS、Windows。
- `device.permissions`、`device.health`、`device.apps` — 仅 Android；`device.apps` 需要在 Android 设置中启用已安装应用共享，默认返回启动器可见应用。
- `notifications.list`、`notifications.actions` — 仅 Android。
- `photos.latest` — iOS、Android、macOS。
- `contacts.search` — iOS、Android、macOS（只读默认值）；`contacts.add` 是危险命令，需要 `gateway.nodes.allowCommands`。
- `calendar.events` — iOS、Android、macOS（只读默认值）；`calendar.add` 是危险命令，需要 `gateway.nodes.allowCommands`。
- `reminders.list` — iOS、Android、macOS（只读默认值）；`reminders.add` 是危险命令，需要 `gateway.nodes.allowCommands`。
- `callLog.search` — 仅 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android、macOS；由可用传感器能力控制。

调用示例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 系统命令（节点主机 / mac 节点）

macOS 节点暴露 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。无头节点主机暴露 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

示例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

说明：

- `system.run` 会在载荷中返回 stdout/stderr/退出码。
- Shell 执行现在会通过 `exec` 工具并使用 `host=node`；`nodes` 仍是显式节点命令的直接 RPC 表面。
- `nodes invoke` 不暴露 `system.run` 或 `system.run.prepare`；它们仅保留在 exec 路径上。
- exec 路径会在审批前准备规范的 `systemRunPlan`。一旦授予审批，Gateway 网关会转发该已存储的计划，而不是任何后续由调用方编辑的 command/cwd/session 字段。
- `system.notify` 遵循 macOS 应用上的通知权限状态；支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 未识别的节点 `platform` / `deviceFamily` 元数据会使用保守的默认允许列表，其中不包含 `system.run` 和 `system.which`。如果你有意需要为未知平台使用这些命令，请通过 `gateway.nodes.allowCommands` 显式添加它们。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 `--env` 值会缩减到显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允许列表模式下，对于始终允许决策，已知调度包装器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化允许列表条目。
- 在允许列表模式下的 Windows 节点主机上，通过 `cmd.exe /c` 运行的 shell 包装器需要审批（仅有允许列表条目不会自动允许这种包装器形式）。
- 节点主机会忽略 `--env` 中的 `PATH` 覆盖，并在运行命令前剥离一大组维护中的解释器/shell 启动变量（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。如果你需要额外的 PATH 条目，请配置节点主机服务环境（或将工具安装到标准位置），而不是通过 `--env` 传递 `PATH`。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中的 exec 审批控制（设置 → Exec 审批）。询问/允许列表/完全模式的行为与无头节点主机相同；被拒绝的提示会返回 `SYSTEM_RUN_DENIED`。
- 在无头节点主机上，`system.run` 受 exec 审批控制（`~/.openclaw/exec-approvals.json`）；在 macOS 上，具体请参阅下方 [无头节点主机](#headless-node-host-cross-platform) 下的 exec-host 路由环境变量。

## Exec 节点绑定

当有多个节点可用时，你可以将 exec 绑定到特定节点。这会为 `exec host=node` 设置默认节点（并且可以按智能体覆盖）。

全局默认值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按智能体覆盖：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

取消设置以允许任意节点：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 权限映射

节点可以在 `node.list` / `node.describe` 中包含一个 `permissions` 映射，以权限名称（例如 `screenRecording`、`accessibility`、`location`）为键，并使用布尔值（`true` = 已授予）。

## 无头节点主机（跨平台）

OpenClaw 可以运行一个连接到 Gateway 网关 WebSocket 并暴露 `system.run` / `system.which` 的**无头节点主机**（无 UI）。这在 Linux/Windows 上很有用，或用于在服务器旁运行一个最小节点。

启动它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

说明：

- 仍然需要配对（Gateway 网关会显示设备配对提示）。
- 节点主机会将其节点 id、令牌、显示名称和 Gateway 网关连接信息存储在 `~/.openclaw/node.json` 中。
- Exec 审批通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（参见 [Exec 审批](/zh-CN/tools/exec-approvals)）。
- 在 macOS 上，无头节点主机默认在本地执行 `system.run`。设置 `OPENCLAW_NODE_EXEC_HOST=app` 可通过配套应用 exec 主机路由 `system.run`；添加 `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求使用应用主机，并在其不可用时失败关闭。
- 当 Gateway 网关 WS 使用 TLS 时，添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用会作为节点连接到 Gateway 网关 WS 服务器（因此 `openclaw nodes …` 可以对这台 Mac 生效）。
- 在远程模式下，应用会为 Gateway 网关端口打开 SSH 隧道并连接到 `localhost`。

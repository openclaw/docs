---
read_when:
    - 将 iOS/Android 节点配对到 Gateway 网关
    - 将 node canvas/camera 用于智能体上下文
    - 添加新的节点命令或 CLI 辅助工具
summary: 节点：配对、能力、权限，以及用于 canvas/camera/screen/device/notifications/system 的 CLI 辅助工具
title: 节点
x-i18n:
    generated_at: "2026-07-06T21:48:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 942ddfdbd2210c54537fe57d5f50f20f53eaa2478c2ccb81886f2cedd4e9ea73
    source_path: nodes/index.md
    workflow: 16
---

一个**节点**是连接到 Gateway 网关 **WebSocket**（与操作员使用相同端口）的配套设备（macOS/iOS/Android/无头设备），使用 `role: "node"`，并通过 `node.invoke` 暴露命令表面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。协议详情：[Gateway 网关协议](/zh-CN/gateway/protocol)。

旧版传输协议：[Bridge protocol](/zh-CN/gateway/bridge-protocol)（TCP JSONL；对于当前节点仅作历史参考）。

macOS 也可以在**节点模式**下运行：菜单栏应用会连接到 Gateway 网关的 WS 服务器，并将其本地画布/摄像头命令作为节点暴露出来（因此 `openclaw nodes …` 可以作用于这台 Mac）。在远程 Gateway 网关模式下，浏览器自动化由 CLI 节点主机（`openclaw node run` 或已安装的节点服务）处理，而不是由原生应用节点处理。

节点是**外设**，不是网关：它们不运行网关服务，渠道消息（Telegram、WhatsApp 等）会落到网关上，而不是节点上。

故障排查运行手册：[/nodes/troubleshooting](/zh-CN/nodes/troubleshooting)

## 配对 + 状态

WS 节点使用**设备配对**。节点会在 `connect` 期间呈现设备身份；Gateway 网关会为 `role: node` 创建设备配对请求。通过设备 CLI（或 UI）批准。

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

待处理的配对请求会在设备最后一次重试 5 分钟后过期——持续重连的设备会保持同一个待处理请求（以及 `requestId`）有效，而不是每隔几分钟生成一个新提示；完整的请求/批准/令牌生命周期见 [Gateway 网关拥有的配对](/zh-CN/gateway/pairing)。如果节点使用已更改的认证详情（角色/权限范围/公钥）重试，先前的待处理请求会被取代，并创建新的 `requestId`——客户端会收到针对被取代请求的 `device.pair.resolved` 事件，你应在批准前重新运行 `openclaw devices list`。

- 当设备配对角色包含 `node` 时，`nodes status` 会将节点标记为**已配对**。
- 设备配对记录是持久的已批准角色契约。令牌轮换保持在该契约内部；它不能将已配对节点升级为配对批准从未授予的角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是单独的、由 Gateway 网关拥有的节点配对存储，用于跨重连跟踪节点已批准的命令/能力表面。它**不会**控制 WS `connect` 握手——设备配对负责这一点。
- `openclaw nodes remove --node <id|name|ip>` 会移除节点配对。对于由设备支持的节点，它会在 `devices/paired.json` 中撤销该设备的 `node` 角色，并断开该设备的节点角色会话：混合角色设备会保留其行且只失去 `node` 角色，而仅节点设备的行会被删除。它还会从单独的节点配对存储中清除任何匹配条目。`operator.pairing` 可以移除其他设备上的非操作员节点行；设备令牌调用方在混合角色设备上撤销自己的节点角色时，还需要 `operator.admin`。
- 批准权限范围遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非 exec 节点命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 版本偏差和升级顺序

Gateway 网关在 N-1 协议窗口内接受已认证的节点客户端。
因此，当前 v4 Gateway 网关会在连接同时声明
`role: "node"` 和 `client.mode: "node"` 时接受 v3 节点。操作员和 UI 会话仍然必须
使用当前协议。

对于分阶段的设备集群升级，请先升级 Gateway 网关，然后升级每个节点。
N-1 节点在升级期间仍然可见且可管理；Gateway 网关
会记录 `legacy node protocol accepted`，并附带升级建议。配对、
设备认证、命令允许列表和 exec 审批仍然适用。
插件拥有的能力和命令会保持隐藏，直到节点升级到
当前协议。早于 N-1 的节点需要先通过带外方式升级，然后
才能重新连接。

## 远程节点主机（system.run）

当你的 Gateway 网关运行在一台机器上，而你希望命令在另一台机器上执行时，请使用**节点主机**。模型仍然与**网关**通信；当选择 `host=node` 时，网关会将 `exec` 调用转发给**节点主机**。

| 角色         | 职责                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway 网关主机 | 接收消息、运行模型、路由工具调用。            |
| 节点主机    | 在节点机器上执行 `system.run`/`system.which`。        |
| 审批    | 通过 `~/.openclaw/exec-approvals.json` 在节点主机上强制执行。 |

审批说明：

- 由审批支持的节点运行会绑定精确的请求上下文。exec 路径会在审批前准备规范的 `systemRunPlan`；一旦授权，网关会转发该已存储计划，而不是任何后来由调用方编辑的 command/cwd/session 字段，并会在运行前重新验证工作目录。
- 对于直接 shell/运行时文件执行，OpenClaw 还会尽力绑定一个具体的本地文件操作数，并在该文件在执行前发生变化时拒绝运行。
- 如果 OpenClaw 无法为解释器/运行时命令精确识别一个具体的本地文件，则会拒绝由审批支持的执行，而不是假装具备完整运行时覆盖。对于更广泛的解释器语义，请使用沙箱隔离、独立主机，或显式的可信允许列表/完整工作流。

### 启动节点主机（前台）

在节点机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run` 还接受 `--context-path`（Gateway 网关 WS 上下文路径）、`--tls`、`--tls-fingerprint <sha256>` 和 `--node-id`（覆盖它会清除配对令牌）。

### 通过 SSH 隧道访问远程 Gateway 网关（loopback 绑定）

如果 Gateway 网关绑定到 loopback（`gateway.bind=loopback`，本地模式下默认），远程节点主机无法直接连接。创建 SSH 隧道，并将节点主机指向隧道的本地端。

示例（节点主机 -> Gateway 网关主机）：

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

说明：

- `openclaw node run` 支持令牌或密码认证。
- 优先使用环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退为 `gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，节点主机会有意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，`gateway.remote.token` / `gateway.remote.password` 可按远程优先级规则使用。
- 如果配置了活动的本地 `gateway.auth.*` SecretRefs 但未解析，节点主机认证会故障关闭。
- 节点主机认证解析只遵循 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动节点主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install` 还接受 `--context-path`、`--tls`、`--tls-fingerprint`、`--node-id`、`--runtime <node|bun>`（默认：node）和 `--force` 以重新安装。`node status`、`node stop` 和 `node uninstall` 也可用。

### 配对 + 命名

在 Gateway 网关主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果节点使用已更改的认证详情重试，请重新运行 `openclaw devices list` 并批准当前的 `requestId`。

命名选项：

- 在 `openclaw node run` / `openclaw node install` 上使用 `--display-name`（会与节点 ID、令牌和 Gateway 网关连接信息一起持久保存在节点上的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 网关覆盖）。

### 将命令加入允许列表

Exec 审批是**按节点主机**配置的。从 Gateway 网关添加允许列表条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

审批保存在节点主机上的 `~/.openclaw/exec-approvals.json`。

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

设置后，任何带有 `host=node` 的 `exec` 调用都会在节点主机上运行（受节点允许列表/审批约束）。

`host=auto` 不会自行隐式选择节点，但允许从 `auto` 发起显式的按调用 `host=node` 请求。如果你希望节点 exec 成为会话默认值，请显式设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关：

- [节点主机 CLI](/zh-CN/cli/node)
- [Exec 工具](/zh-CN/tools/exec)
- [Exec 审批](/zh-CN/tools/exec-approvals)

### 本地模型推理

桌面或服务器节点可以暴露在该节点上运行的 Ollama 服务器中的聊天能力模型。智能体使用 Ollama 插件的 `node_inference` 工具来发现已安装模型，并远程运行有界提示；Gateway 网关不需要直接网络访问 Ollama。设置、模型过滤和直接验证命令见 [Ollama 节点本地推理](/zh-CN/providers/ollama#node-local-inference)。

## 调用命令

低级别（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke` 会阻止 `system.run` 和 `system.run.prepare`；这些命令只能通过带有 `host=node` 的 `exec` 工具运行（见上文）。对于常见的“给智能体一个 MEDIA 附件”工作流（画布、摄像头、屏幕、位置，见下文），存在更高级别的辅助命令。

## 命令策略

节点命令必须先通过两道门禁才能被调用：

1. 节点必须在其 WebSocket `connect.commands` 列表中声明该命令。
2. 网关的、由平台和审批派生的允许列表必须包含已声明的命令。

按平台划分的默认允许列表（在插件默认值以及 `allowCommands`/`denyCommands` 覆盖之前）：

| 平台 | 默认允许的命令                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`（像 `system.run` 这样的节点主机命令受审批控制，见下文）                                                                                                                                                                                                                                  |

`canvas.*` 命令（`canvas.present`、`canvas.hide`、`canvas.navigate`、`canvas.eval`、`canvas.snapshot`、`canvas.a2ui.*`）在 iOS、Android、macOS、Windows 和未知平台（不包括 Linux）上是插件默认项；它们在 iOS 上都限制为前台使用。

`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once` 默认允许用于任何声明 `talk` 能力或声明 `talk.*` 命令的节点，不受平台标签影响。

桌面主机命令（macOS/Windows 上的 `system.run`、`system.run.prepare`、`system.which`、`browser.proxy`、`screen.snapshot`）不属于上方静态平台默认表。操作员批准声明这些命令的配对请求后，它们才会可用；之后节点已批准的命令集会在重新连接时继续携带这些命令。

危险或涉及大量隐私的命令仍需要通过 `gateway.nodes.allowCommands` 显式选择启用，即使节点声明了这些命令：`camera.snap`、`camera.clip`、`screen.record`、`contacts.add`、`calendar.add`、`reminders.add`、`sms.send`、`sms.search`。`gateway.nodes.denyCommands` 始终优先于默认值和额外允许列表条目。

插件拥有的节点命令可以添加 Gateway 网关节点调用策略。该策略在允许列表检查之后、转发到节点之前运行，因此原始 `node.invoke`、CLI 辅助工具和专用智能体工具共享同一个插件权限边界。危险的插件节点命令仍需要显式选择启用 `gateway.nodes.allowCommands`。

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

使用确切的节点命令名称。即使平台默认值或 `allowCommands` 条目本来会允许某个命令，`denyCommands` 也会移除该命令。有关 Gateway 网关节点配对和命令策略字段详情，请参阅 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#gateway)。

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

## 屏幕截图（canvas 快照）

如果节点正在显示 Canvas（WebView），`canvas.snapshot` 会返回 `{ format, base64 }`。

CLI 辅助工具（写入临时文件并打印保存路径）：

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

注意：

- `canvas present` 接受 URL 或本地文件路径（`--target`），并可选使用 `--x/--y/--width/--height` 进行定位。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意：

- 移动端节点使用内置的应用拥有的 A2UI 页面来进行支持操作的渲染。
- 仅支持 A2UI v0.8 JSONL（v0.9/createSurface 会被拒绝）。
- iOS 和 Android 会渲染远程 Gateway 网关 Canvas 页面，但 A2UI 按钮操作只会从内置的应用拥有的 A2UI 页面分发。Gateway 网关托管的 HTTP/HTTPS A2UI 页面在这些移动客户端上仅用于渲染。

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

注意：

- 对于 `canvas.*` 和 `camera.*`，节点必须处于**前台**（后台调用会返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 节点会限制片段时长，以保持 base64 载荷可管理（确切的各平台限制见 [摄像头拍摄](/zh-CN/nodes/camera)）。`nodes` 智能体工具还会在转发调用之前将请求的 `durationMs` 上限设为 300000（5 分钟）；节点自身会执行更严格的限制。
- Android 会在可能时提示授予 `CAMERA`/`RECORD_AUDIO` 权限；被拒绝的权限会以 `*_PERMISSION_REQUIRED` 失败。

## 屏幕录制（节点）

支持的节点会暴露 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意：

- `screen.record` 可用性取决于节点平台。
- `nodes` 智能体工具会将请求的 `durationMs` 上限设为 300000（5 分钟）；节点可能会执行更严格的限制，以约束返回的载荷大小。
- `--no-audio` 会在支持的平台上禁用麦克风采集。
- 有多个屏幕可用时，使用 `--screen <index>` 选择显示器（0 = 主显示器）。

## 位置（节点）

在设置中启用位置时，节点会暴露 `location.get`。

CLI 辅助工具：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意：

- 位置默认**关闭**。
- “始终”需要系统权限；后台获取是尽力而为。
- 响应包含纬度/经度、精度（米）和时间戳。
- 完整参数/响应形状和错误代码：[位置命令](/zh-CN/nodes/location-command)。

## SMS（Android 节点）

当用户授予 **SMS** 权限且设备支持电话功能时，Android 节点可以暴露 `sms.send` 和 `sms.search`。这两个命令默认都是危险命令：Gateway 网关操作员还必须先将它们添加到 `gateway.nodes.allowCommands`，才能调用它们（参见 [命令策略](#command-policy)）。

对于只读 SMS 搜索，请在 `openclaw.json` 中显式选择启用：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

仅当节点也应能够发送消息时，才单独添加 `sms.send`。Android 权限和 Gateway 网关命令授权彼此独立；授予手机权限不会编辑 Gateway 网关策略。

低层调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意：

- `sms.search` 可能会在授予 `READ_SMS` 之前声明，因此调用可以返回权限诊断；读取消息仍需要该 Android 权限。
- 没有电话功能的纯 Wi-Fi 设备不会宣告 `sms.send`。
- `requires explicit gateway.nodes.allowCommands opt-in` 错误表示手机声明了该命令，但 Gateway 网关操作员尚未授权它。

## 设备和个人数据命令

iOS、Android 和 macOS 节点默认会宣告多个只读数据命令（见 [命令策略](#command-policy) 表）；Android 还会额外暴露一组更大的命令族，并由其应用内设置控制。

可用命令族：

- `device.status`、`device.info` — iOS、Android、macOS、Windows。
- `device.permissions`、`device.health`、`device.apps` — 仅 Android；`device.apps` 需要在 Android 设置中启用已安装应用共享，并默认返回启动器可见应用。
- `notifications.list`、`notifications.actions` — 仅 Android。
- `photos.latest` — iOS、Android、macOS。
- `contacts.search` — iOS、Android、macOS（只读默认值）；`contacts.add` 是危险命令，需要 `gateway.nodes.allowCommands`。
- `calendar.events` — iOS、Android、macOS（只读默认值）；`calendar.add` 是危险命令，需要 `gateway.nodes.allowCommands`。
- `reminders.list` — iOS、Android、macOS（只读默认值）；`reminders.add` 是危险命令，需要 `gateway.nodes.allowCommands`。
- `callLog.search` — 仅 Android。
- `motion.activity`、`motion.pedometer` — iOS、Android、macOS；受可用传感器能力控制。

示例调用：

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

- `system.run` 在载荷中返回 stdout/stderr/退出码。
- Shell 执行现在会通过带有 `host=node` 的 `exec` 工具；`nodes` 仍然是显式节点命令的直接 RPC 表面。
- `nodes invoke` 不暴露 `system.run` 或 `system.run.prepare`；它们只保留在 exec 路径上。
- exec 路径会在审批前准备规范的 `systemRunPlan`。一旦审批获准，Gateway 网关会转发该已存储的计划，而不是任何之后由调用方编辑过的 command/cwd/session 字段。
- `system.notify` 遵循 macOS 应用上的通知权限状态；支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- 无法识别的节点 `platform` / `deviceFamily` 元数据会使用保守的默认允许列表，该列表排除 `system.run` 和 `system.which`。如果你确实需要在未知平台上使用这些命令，请通过 `gateway.nodes.allowCommands` 显式添加它们。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围内的 `--env` 值会缩减为显式允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 在允许列表模式下，对于始终允许的决策，已知的分发包装器（`env`、`flock`、`nice`、`nohup`、`stdbuf`、`timeout`）会持久化内部可执行文件路径，而不是包装器路径。如果无法安全解包，则不会自动持久化任何允许列表条目。
- 在允许列表模式下，Windows 节点主机上通过 `cmd.exe /c` 运行的 shell 包装器需要审批（仅有允许列表条目不会自动允许该包装器形式）。
- 节点主机会忽略 `--env` 中的 `PATH` 覆盖，并在运行命令前剥离一组庞大且持续维护的解释器/shell 启动变量（例如 `NODE_OPTIONS`、`PYTHONPATH`、`BASH_ENV`、`DYLD_*`、`LD_*`）。如果你需要额外的 PATH 条目，请配置节点主机服务环境（或将工具安装到标准位置），而不是通过 `--env` 传递 `PATH`。
- 在 macOS 节点模式下，`system.run` 受 macOS 应用中的 exec 审批控制（Settings → Exec approvals）。Ask/allowlist/full 的行为与无头节点主机相同；被拒绝的提示会返回 `SYSTEM_RUN_DENIED`。
- 在无头节点主机上，`system.run` 受 exec 审批控制（`~/.openclaw/exec-approvals.json`）；特别是在 macOS 上，请参见下方 [无头节点主机](#headless-node-host-cross-platform) 下的 exec-host 路由环境变量。

## Exec 节点绑定

当有多个节点可用时，你可以将 exec 绑定到特定节点。这会为 `exec host=node` 设置默认节点（并且可按智能体覆盖）。

全局默认值：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按智能体覆盖：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

取消设置以允许任何节点：

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 权限映射

节点可以在 `node.list` / `node.describe` 中包含 `permissions` 映射，以权限名称（例如 `screenRecording`、`accessibility`、`location`）为键，并使用布尔值（`true` = 已授予）。

## 无头节点主机（跨平台）

OpenClaw 可以运行一个连接到 Gateway 网关 WebSocket 并暴露 `system.run` / `system.which` 的**无头节点主机**（无 UI）。这适用于 Linux/Windows，或在服务器旁运行一个最小节点。

启动它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

说明：

- 仍然需要配对（Gateway 网关会显示设备配对提示）。
- 节点主机会将其节点 ID、令牌、显示名称和 Gateway 网关连接信息存储在 `~/.openclaw/node.json` 中。
- Exec 审批会通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（参见 [Exec 审批](/zh-CN/tools/exec-approvals)）。
- 在 macOS 上，无头节点主机默认会在本地执行 `system.run`。设置 `OPENCLAW_NODE_EXEC_HOST=app` 可通过配套应用 exec 主机路由 `system.run`；添加 `OPENCLAW_NODE_EXEC_FALLBACK=0` 可要求使用应用主机，并在其不可用时失败关闭。
- 当 Gateway 网关 WS 使用 TLS 时，添加 `--tls` / `--tls-fingerprint`。

## Mac 节点模式

- macOS 菜单栏应用会作为节点连接到 Gateway 网关 WS 服务器（因此 `openclaw nodes …` 可对此 Mac 生效）。
- 在远程模式下，应用会为 Gateway 网关端口打开 SSH 隧道并连接到 `localhost`。

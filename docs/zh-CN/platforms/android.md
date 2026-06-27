---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android 网关发现或认证
    - 验证各客户端的聊天历史记录一致性
summary: Android 应用（节点）：连接运行手册 + Connect/Chat/Voice/Canvas 命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-06-27T02:28:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 应用可在 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 获取。它是配套节点，需要一个正在运行的 OpenClaw Gateway 网关。源代码也位于 [OpenClaw 仓库](https://github.com/openclaw/openclaw) 的 `apps/android` 下；构建说明见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。
</Note>

## 支持快照

- 角色：配套节点应用（Android 不托管 Gateway 网关）。
- 需要 Gateway 网关：是（通过 WSL2 在 macOS、Linux 或 Windows 上运行）。
- 安装：应用使用 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，Gateway 网关使用[入门指南](/zh-CN/start/getting-started)，然后进行[配对](/zh-CN/channels/pairing)。
- Gateway 网关：[运行手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 网关主机上。见 [Gateway 网关](/zh-CN/gateway)。

## 连接运行手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公网上的主机，Android 需要安全端点：

- 首选：Tailscale Serve / Funnel，使用 `https://<magicdns>` / `wss://<magicdns>`
- 同样支持：任何其他带真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有 LAN 地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前提条件

- 你可以在“主”机器上运行 Gateway 网关。
- Android 设备/模拟器可以访问 gateway WebSocket：
  - 同一 LAN，使用 mDNS/NSD，**或**
  - 同一 Tailscale tailnet，使用广域 Bonjour / 单播 DNS-SD（见下文），**或**
  - 手动 gateway 主机/端口（备用）
- Tailnet/公网移动端配对**不**使用原始 tailnet IP `ws://` 端点。改用 Tailscale Serve 或另一个 `wss://` URL。
- 你可以在 gateway 机器上运行 CLI（`openclaw`）（或通过 SSH 运行）。

### 1. 启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

确认日志中看到类似内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 远程访问 Android，优先使用 Serve/Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供安全的 `wss://` / `https://` 端点。单纯的 `gateway.bind: "tailnet"` 设置不足以完成首次远程 Android 配对，除非你还单独终止 TLS。

### 2. 验证设备发现（可选）

从 gateway 机器运行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域设备发现域，请与以下命令对比：

```bash
openclaw gateway discover --json
```

它会一次性显示 `local.` 加上已配置的广域域，并使用解析后的服务端点，而不是仅使用 TXT 提示。

#### 通过单播 DNS-SD 进行 Tailnet（维也纳 ⇄ 伦敦）设备发现

Android NSD/mDNS 设备发现不会跨网络。如果你的 Android 节点和 gateway 位于不同网络但通过 Tailscale 连接，请改用广域 Bonjour / 单播 DNS-SD。

仅有设备发现并不足以完成 tailnet/公网 Android 配对。发现到的路由仍需要安全端点（`wss://` 或 Tailscale Serve）：

1. 在 gateway 主机上设置 DNS-SD 区域（示例 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域配置 Tailscale split DNS，指向该 DNS 服务器。

详情和 CoreDNS 配置示例：[Bonjour](/zh-CN/gateway/bonjour)。

### 3. 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持 gateway 连接存活。
- 打开**连接**标签页。
- 使用**设置代码**或**手动**模式。
- 如果设备发现被阻止，请在**高级控件**中使用手动主机/端口。对于私有 LAN 主机，`ws://` 仍可使用。对于 Tailscale/公网主机，请启用 TLS，并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 会在启动时自动重连：

- 手动端点（如果已启用），否则
- 上次发现的 gateway（尽力而为）。

### 在线状态存活信标

经过身份验证的节点会话连接后，以及当前台服务仍保持连接而应用转入后台时，Android 会调用 `node.event`，并携带 `event: "node.presence.alive"`。只有在已知经过身份验证的节点设备身份后，gateway 才会将其记录为已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

只有当 gateway 响应包含 `handled: true` 时，应用才会将该信标计为已成功记录。较旧的 gateway 可能用 `{ "ok": true }` 确认 `node.event`；该响应是兼容的，但不会计为持久的最后在线时间更新。

### 4. 批准配对（CLI）

在 gateway 机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情：[配对](/zh-CN/channels/pairing)。

可选：如果 Android 节点始终从严格受控的子网连接，你可以通过显式 CIDR 或精确 IP 选择启用首次节点自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

默认情况下此功能已禁用。它只适用于没有请求作用域的新 `role: node` 配对。操作员/浏览器配对，以及任何角色、作用域、元数据或公钥变更，仍需要手动批准。

### 5. 验证节点已连接

- 通过节点状态：

  ```bash
  openclaw nodes status
  ```

- 通过 Gateway 网关：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6. 聊天 + 历史记录

Android 聊天标签页支持会话选择（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（已规范化显示；内联指令标签会从可见文本中剥离，纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 和被截断的工具调用块）以及泄漏的 ASCII/全角模型控制标记会被剥离，纯静默标记的 assistant 行（如精确的 `NO_REPLY` / `no_reply`）会被省略，过大的行可替换为占位符）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7. 画布 + 摄像头

#### Gateway 网关画布主机（推荐用于 Web 内容）

如果你希望节点显示 agent 可在磁盘上编辑的真实 HTML/CSS/JS，请将节点指向 Gateway 网关画布主机。

<Note>
节点从 Gateway 网关 HTTP 服务器加载画布（与 `gateway.port` 同一端口，默认 `18789`）。
</Note>

1. 在 gateway 主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 将节点导航到它（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（可选）：如果两台设备都在 Tailscale 上，请使用 MagicDNS 名称或 tailnet IP，而不是 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此服务器会向 HTML 注入实时重载客户端，并在文件变更时重新加载。Gateway 网关还提供 `/__openclaw__/a2ui/`，但 Android 应用会将远程 A2UI 页面视为仅渲染页面。具备动作能力的 A2UI 命令会先使用应用内置、由应用拥有的 A2UI 页面，再应用消息。

画布命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 旧版别名）。这些命令使用应用内置、由应用拥有的 A2UI 页面，以支持具备动作能力的渲染。

摄像头命令（仅前台；受权限限制）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参数和 CLI 辅助工具见[摄像头节点](/zh-CN/nodes/camera)。

### 8. 语音 + 扩展 Android 命令面

- 语音标签页：Android 有两种显式采集模式。**麦克风**是手动语音标签页会话，会将每次停顿作为一个聊天轮次发送，并在应用离开前台或用户离开语音标签页时停止。**Talk** 是连续 Talk 模式，会一直监听，直到被关闭或节点断开连接。
- Talk 模式会在采集开始前将现有前台服务从 `connectedDevice` 提升为 `connectedDevice|microphone`，并在 Talk 模式停止时降级。节点服务声明了带 `CHANGE_NETWORK_STATE` 的 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 还要求声明 `FOREGROUND_SERVICE_MICROPHONE`、获得 `RECORD_AUDIO` 运行时授权，并在运行时使用麦克风服务类型。
- 默认情况下，Android Talk 使用原生语音识别、Gateway 网关聊天，以及通过已配置 gateway Talk 提供商的 `talk.speak`。只有当 `talk.speak` 不可用时，才使用本地系统 TTS。
- 只有当 `talk.realtime.mode` 为 `realtime` 且 `talk.realtime.transport` 为 `gateway-relay` 时，Android Talk 才使用实时 Gateway 网关中继。
- Android UX/运行时中仍禁用语音唤醒。
- 其他 Android 命令族（可用性取决于设备、权限和用户设置）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - 仅当已启用**设置 > 手机能力 > 已安装应用**时，`device.apps` 才可用；默认列出启动器可见的应用。
  - `notifications.list`、`notifications.actions`（见下方[通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant 入口点

Android 支持通过系统 Assistant 触发器（Google Assistant）启动 OpenClaw。配置后，按住主页按钮或说 “Hey Google, ask OpenClaw...” 会打开应用，并将提示词传入聊天编辑器。

这使用在应用清单中声明的 Android **App Actions** 元数据。Gateway 网关侧不需要额外配置，assistant intent 完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，以及用户是否已将 OpenClaw 设为默认 assistant 应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 gateway。多个控件可让你限定转发哪些通知以及何时转发。

| 键                               | 类型           | 描述                                                                                           |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 只转发来自这些包名的通知。如果设置，所有其他包都会被忽略。                                     |
| `notifications.denyPackages`     | string[]       | 永不转发来自这些包名的通知。在 `allowPackages` 之后应用。                                      |
| `notifications.quietHours.start` | string (HH:mm) | 免打扰时间窗口的开始时间（本地设备时间）。该窗口期间通知会被抑制。                             |
| `notifications.quietHours.end`   | string (HH:mm) | 免打扰时间窗口的结束时间。                                                                     |
| `notifications.rateLimit`        | number         | 每个包每分钟可转发的最大通知数。超出的通知会被丢弃。                                           |

通知选择器还会对转发的通知事件使用更安全的行为，防止意外转发敏感系统通知。

示例配置：

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
通知转发需要 Android Notification Listener 权限。应用会在设置期间提示授予此权限。
</Note>

## 相关

- [iOS 应用](/zh-CN/platforms/ios)
- [节点](/zh-CN/nodes)
- [Android 节点故障排除](/zh-CN/nodes/troubleshooting)

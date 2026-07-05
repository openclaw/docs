---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android Gateway 网关设备发现或身份验证
    - 从远程 Mac 镜像或控制 Android 设备
    - 验证各客户端之间的聊天历史一致性
summary: Android 应用（节点）：连接运行手册 + Connect/Chat/Voice/Canvas 命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-07-05T20:18:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb86ad2c7e4966b110e7e760c537e681c9a71207b06f01ac4daa123b52cdded7
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 应用可在 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 获取。它是一个配套节点，需要正在运行的 OpenClaw Gateway 网关。来源：[apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[构建说明](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## 支持快照

- 角色：配套节点应用（Android 不托管 Gateway 网关）。
- 需要 Gateway 网关：是（通过 WSL2 在 macOS、Linux 或 Windows 上运行）。
- 安装：应用使用 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，Gateway 网关参见[入门指南](/zh-CN/start/getting-started)，然后参见[配对](/zh-CN/channels/pairing)。
- Gateway 网关：[运行手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

系统控制（launchd/systemd）位于 Gateway 网关主机上 — 参见 [Gateway 网关](/zh-CN/gateway)。

## 从远程 Mac 镜像并控制 Android

[scrcpy](https://github.com/Genymobile/scrcpy) 会在 macOS 窗口中镜像 Android 屏幕，并通过 Android Debug Bridge（ADB）转发键盘和指针输入。这是操作员侧工作流，与 OpenClaw 节点连接分离。当 Android 设备和 Mac 位于不同位置但共享一个私有 Tailscale 网络时，它很有用。

### 开始之前

- 在 Android 设备和 Mac 上安装 Tailscale，并将两者连接到同一个 tailnet。
- 在 Android 上启用 **开发者选项** 和 **USB 调试**。Android 16 将 **无线调试** 放在 **设置 > 系统 > 开发者选项** 下。参见 [Android 开发者选项](https://developer.android.com/studio/debug/dev-options)。
- 在 Mac 上安装 scrcpy 和 ADB：

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 首次连接时保持 Android 设备可用。Android 必须先批准每台 Mac 的 ADB 密钥，该 Mac 才能控制设备。

### 通过 TCP 启用 ADB

初始设置时，通过 USB 将 Android 设备连接到受信任的计算机，并批准其调试提示。然后运行：

```bash
adb devices
adb tcpip 5555
```

现在可以断开 USB。如果设备重启或调试重置后端口 5555 停止监听，请重复这个本地设置步骤。Android 11 及更高版本也可以通过 **无线调试 > 使用配对码配对设备** 和 `adb pair` 建立初始信任。

### 只允许控制器 Mac

带有限制性授权的 tailnet 必须显式允许控制器 Mac 访问 Android 设备上的 TCP 端口 5555。向 tailnet 策略添加一条窄规则，将示例地址替换为两个设备的稳定 Tailscale IP：

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

参见 [Tailscale grants](https://tailscale.com/docs/reference/syntax/grants) 了解主机别名和其他选择器。不要将此端口授权给公共互联网，也不要用 Funnel 暴露它：已授权的 ADB 客户端对设备拥有广泛控制权。

### 连接并开始镜像

在远程 Mac 上：

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

此 Mac 首次执行 `adb connect` 时，Android 上会显示授权对话框。解锁设备，确认密钥指纹，并且只有在信任该 Mac 时才选择 **始终允许使用这台计算机进行调试**。成功的 `adb devices` 条目以 `device` 结尾；`unauthorized` 表示设备上的提示尚未批准。

scrcpy 窗口打开后，可以直接使用它，或通过 macOS 屏幕自动化工具（例如 [Peekaboo](https://peekaboo.sh/)）定位它。scrcpy 负责显示和输入；Tailscale 只提供私有网络路径。

### 故障排查

- `Connection timed out`：验证 TCP 5555 的 tailnet 授权。成功的 `tailscale ping` 只能证明对等节点可达，不能证明策略允许此 TCP 端口。从 Mac 使用 `nc -vz <android-tailnet-ip> 5555` 测试。
- `unauthorized`：解锁 Android 并批准远程 Mac 的 ADB 密钥，或在 **无线调试 > 已配对的设备** 下移除过期工作站并重新配对。
- `Connection refused`：本地重新连接并再次运行 `adb tcpip 5555`。
- 列出多个设备：保留显式的 `--serial <android-tailnet-ip>:5555` 参数。

完成后，关闭 scrcpy 并断开 ADB：

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 连接运行手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公共主机，Android 需要安全端点：

- 首选：Tailscale Serve / Funnel，使用 `https://<magicdns>` / `wss://<magicdns>`
- 也支持：任何其他带真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有 LAN 地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前提条件

- Gateway 网关在另一台机器上运行（或可通过 SSH 访问）。
- Android 设备/模拟器可以访问 Gateway 网关 WebSocket：
  - 使用 mDNS/NSD 的同一 LAN，**或**
  - 使用 Wide-Area Bonjour / 单播 DNS-SD 的同一 Tailscale tailnet（见下文），**或**
  - 手动 Gateway 网关主机/端口（回退）
- Tailnet/公共移动端配对**不**使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- Gateway 网关机器上（或通过 SSH）可用的 `openclaw` CLI，用于批准配对请求。

### 1. 启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

确认日志中看到类似内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 的远程 Android 访问，优先使用 Serve/Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供安全的 `wss://` / `https://` 端点。普通的 `gateway.bind: "tailnet"` 设置不足以支持首次远程 Android 配对，除非你还单独终止 TLS。

### 2. 验证设备发现（可选）

从 Gateway 网关机器运行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域设备发现域，请对比：

```bash
openclaw gateway discover --json
```

这会在一次执行中显示 `local.` 加已配置的广域域，并使用已解析的服务端点，而不是仅使用 TXT 提示。

#### 通过单播 DNS-SD 进行跨网络设备发现

Android NSD/mDNS 设备发现不会跨网络。如果 Android 节点和 Gateway 网关位于不同网络，但通过 Tailscale 连接，请改用 Wide-Area Bonjour / 单播 DNS-SD。仅设备发现不足以完成 tailnet/公共 Android 配对 — 被发现的路由仍需要安全端点（`wss://` 或 Tailscale Serve）：

1. 在 Gateway 网关主机上设置 DNS-SD 区域（示例 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域配置 Tailscale split DNS，指向该 DNS 服务器。

详情和 CoreDNS 配置示例：[Bonjour](/zh-CN/gateway/bonjour)。

### 3. 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持其 Gateway 网关连接存活。
- 打开 **连接** 标签页。
- 使用 **设置码** 或 **手动** 模式。
- 如果设备发现被阻止，请在 **高级控制** 中使用手动主机/端口。对于私有 LAN 主机，`ws://` 仍然可用。对于 Tailscale/公共主机，请启用 TLS 并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 启动时会自动重新连接：如果启用则使用手动端点，否则使用最后发现的 Gateway 网关（尽力而为）。

### 在线状态存活信标

经过身份验证的节点会话连接后，以及当前台服务仍处于连接状态而应用进入后台时，Android 会调用带有 `event: "node.presence.alive"` 的 `node.event`。只有在已知经过身份验证的节点设备身份之后，Gateway 网关才会将其作为 `lastSeenAtMs`/`lastSeenReason` 记录到已配对的节点/设备元数据上。

只有当 Gateway 网关响应包含 `handled: true` 时，应用才会将该信标计为已成功记录。较旧的 Gateway 网关可能会用 `{ "ok": true }` 确认 `node.event`；该响应是兼容的，但不计为持久的最后可见更新。

### 4. 批准配对（CLI）

在 Gateway 网关机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情：[配对](/zh-CN/channels/pairing)。

可选：如果 Android 节点始终从严格控制的子网连接，你可以通过显式 CIDR 或精确 IP 选择启用首次节点自动批准：

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

默认禁用此功能。它仅适用于没有请求权限范围的新 `role: node` 配对。操作员/浏览器配对，以及任何角色、权限范围、元数据或公钥变更，仍需要手动批准。

### 5. 验证节点已连接

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 聊天 + 历史记录

Android 聊天标签页支持会话选择（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（显示规范化 — 内联指令标签、纯文本工具调用 XML 载荷（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>` 及截断变体）和泄露的 ASCII/全角模型控制令牌会被剥离；静默令牌助手行（例如精确的 `NO_REPLY` / `no_reply`）会被省略；过大的行可被替换为占位符）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` -> `event:"chat"`

### 7. Canvas + 相机

#### Gateway 网关 Canvas 主机（推荐用于 Web 内容）

要让节点显示智能体可在磁盘上编辑的真实 HTML/CSS/JS，请将节点指向 Gateway 网关 Canvas 主机。

<Note>
节点从 Gateway 网关 HTTP 服务器加载 Canvas（与 `gateway.port` 相同端口，默认 `18789`）。
</Note>

1. 在 Gateway 网关主机上创建 `~/.openclaw/workspace/canvas/index.html`。
2. 将节点导航到它（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（可选）：如果两台设备都在 Tailscale 上，请使用 MagicDNS 名称或 tailnet IP 替代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此服务器会向 HTML 注入实时重载客户端，并在文件变更时重新加载。Gateway 网关也提供 `/__openclaw__/a2ui/`，但 Android 应用将远程 A2UI 页面视为仅渲染。具备动作能力的 A2UI 命令使用应用自带的 A2UI 页面。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 旧版别名）。它们使用应用自带的 A2UI 页面进行具备动作能力的渲染。

相机命令（仅前台；受权限控制）：`camera.snap`（jpg）、`camera.clip`（mp4）。参数和 CLI 辅助命令参见[相机节点](/zh-CN/nodes/camera)。

### 8. 语音 + 扩展的 Android 命令表面

- 语音标签页：Android 有两种明确的采集模式。**麦克风** 是手动语音标签页会话，会将每次停顿作为一个聊天轮次发送，并在应用离开前台或用户离开语音标签页时停止。**Talk** 是连续 Talk 模式，会持续监听，直到被关闭或节点断开连接。
- Talk 模式会在开始采集前，将现有前台服务从 `connectedDevice` 提升为 `connectedDevice|microphone`，然后在 Talk 模式停止时降级。节点服务声明了带有 `CHANGE_NETWORK_STATE` 的 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 还要求声明 `FOREGROUND_SERVICE_MICROPHONE`、授予 `RECORD_AUDIO` 运行时权限，并在运行时使用麦克风服务类型。
- 默认情况下，Android Talk 使用原生语音识别、Gateway 网关聊天，以及通过已配置的 Gateway 网关 Talk 提供商调用 `talk.speak`。只有在 `talk.speak` 不可用时才使用本地系统 TTS。
- 只有当 `talk.realtime.mode` 为 `realtime` 且 `talk.realtime.transport` 为 `gateway-relay` 时，Android Talk 才会使用实时 Gateway 网关中继。
- 语音唤醒已在源代码中实现（`VoiceWakeMode`），但已发布的应用运行时在连接时始终强制将其设为 `off` —— 目前没有面向用户的开关。
- 其他 Android 命令族（可用性取决于设备、权限和用户设置）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - 仅当启用 **设置 > 手机能力 > 已安装应用** 时，`device.apps` 才可用；默认列出启动器可见的应用（传入 `includeNonLaunchable` 可获取完整列表）。
  - `notifications.list`、`notifications.actions`（见下方[通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助手入口点

Android 支持从系统助手触发器（Google Assistant）启动 OpenClaw。长按主页按钮（或其他 `ACTION_ASSIST` 触发器）会打开应用；说出“嘿 Google，让 OpenClaw `<prompt>`”会匹配应用声明的 App Actions 查询模式，并将提示词传入聊天编辑器，但不会自动发送。

这使用了在应用清单中声明的 Android **App Actions**（`shortcuts.xml` capability）。不需要 Gateway 网关侧配置 —— 助手意图完全由 Android 应用处理。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，以及用户是否已将 OpenClaw 设为默认助手应用。
</Note>

## 通知转发

Android 可以将设备通知作为 `node.event` 项转发到 Gateway 网关。这是在**设备上**配置的，位于应用的设置面板中，而不是在 Gateway 网关/`openclaw.json` 配置中。

| 设置                        | 描述                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 转发通知事件                | 主开关。默认关闭；需要先授予通知监听器访问权限。                                                                                                                                                     |
| 包过滤器                    | **允许列表**（仅转发列出的包 ID）或**阻止列表**（默认：除列出 ID 之外的所有包）。在阻止列表模式下，OpenClaw 自身的包始终被排除，以防止转发循环。                                                       |
| 静默时段                    | 本地 HH:mm 开始/结束窗口，会抑制转发。默认禁用；启用后默认值为 `22:00`-`07:00`。                                                                                                                     |
| 每分钟最大事件数            | 每台设备对转发通知的速率限制。默认 20。                                                                                                                                                              |
| 路由会话键                  | 可选。将转发的通知事件固定到特定会话，而不是设备的默认通知路由。                                                                                                                                     |

<Note>
通知转发需要 Android 通知监听器权限。应用会在设置期间提示授予此权限。
</Note>

## 相关

- [iOS 应用](/zh-CN/platforms/ios)
- [节点](/zh-CN/nodes)
- [Android 节点故障排查](/zh-CN/nodes/troubleshooting)

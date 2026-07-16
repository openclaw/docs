---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android Gateway 网关发现或身份验证
    - 从远程 Mac 镜像或控制 Android 设备
    - 验证各客户端间的聊天记录一致性
summary: Android 应用（节点）：连接运行手册 + Connect/Chat/Voice/Canvas 命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-07-16T11:42:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
官方 Android 应用可通过 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 获取，也可从受支持的 [GitHub Releases](https://github.com/openclaw/openclaw/releases) 下载已签名的独立 APK。它是一个配套节点，需要正在运行的 OpenClaw Gateway 网关。源代码：[apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)（[构建说明](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)）。
</Note>

## 支持概览

- 角色：配套节点应用（Android 不托管 Gateway 网关）。
- 需要 Gateway 网关：是（通过 WSL2 在 macOS、Linux 或 Windows 上运行）。
- 安装：[Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 或从受支持的 [GitHub Release](https://github.com/openclaw/openclaw/releases) 获取 `OpenClaw-Android.apk`；参阅 Gateway 网关的[入门指南](/zh-CN/start/getting-started)，然后进行[配对](/zh-CN/channels/pairing)。
- Gateway 网关：[运行手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

系统控制（launchd/systemd）位于 Gateway 网关主机上——请参阅 [Gateway 网关](/zh-CN/gateway)。

## 在 Google Play 之外安装

常规正式版和修正版 GitHub Releases 包含通用的 `OpenClaw-Android.apk` 和 `OpenClaw-Android-SHA256SUMS.txt`。APK 根据发布标签构建，使用 OpenClaw Android 发布密钥签名，并附带 GitHub Actions 来源证明。

选择一个同时列出这两个资源的[发布版本](https://github.com/openclaw/openclaw/releases)，然后在旁加载前下载并验证该确切标签：

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Google Play 和独立 APK 安装使用不同的更新渠道，并且可能具有不同的签名身份。切换渠道前，Android 可能要求卸载现有应用，这会移除其本地应用数据。正常更新时请始终使用同一渠道。
</Warning>

## 从远程 Mac 镜像和控制 Android

[scrcpy](https://github.com/Genymobile/scrcpy) 可在 macOS 窗口中镜像 Android 屏幕，并通过 Android Debug Bridge（ADB）转发键盘和指针输入。这是操作员侧的工作流，与 OpenClaw 节点连接相互独立。当 Android 设备和 Mac 位于不同地点但共享同一个私有 Tailscale 网络时，此功能非常有用。

### 开始之前

- 在 Android 设备和 Mac 上安装 Tailscale，并将两者连接到同一个 tailnet。
- 在 Android 上启用 **Developer options** 和 **USB debugging**。Android 16 将 **Wireless
  debugging** 放在 **Settings > System > Developer options** 下。请参阅 [Android 开发者
  选项](https://developer.android.com/studio/debug/dev-options)。
- 在 Mac 上安装 scrcpy 和 ADB：

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 首次连接时，请确保 Android 设备可用。每台 Mac 必须先由 Android 批准其 ADB
  密钥，才能控制该设备。

### 启用基于 TCP 的 ADB

首次设置时，通过 USB 将 Android 设备连接到受信任的计算机，并批准其调试提示。然后运行：

```bash
adb devices
adb tcpip 5555
```

现在可以断开 USB。如果设备重启或重置调试设置后端口 5555 停止监听，请重复此本地设置步骤。Android 11 及更高版本还可以使用 **Wireless debugging > Pair device with pairing code** 和 `adb pair` 建立初始信任。

### 仅允许控制端 Mac

采用限制性授权规则的 tailnet 必须明确允许控制端 Mac 访问 Android 设备的 TCP 端口 5555。向 tailnet 策略添加一条范围严格的规则，并将示例地址替换为两台设备的稳定 Tailscale IP：

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

有关主机别名和其他选择器，请参阅 [Tailscale 授权规则](https://tailscale.com/docs/reference/syntax/grants)。请勿向公共互联网开放此端口，也不要使用 Funnel 将其暴露出去：经过授权的 ADB 客户端对设备拥有广泛的控制权限。

### 连接并开始镜像

在远程 Mac 上：

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

此 Mac 首次执行 `adb connect` 时，Android 上会显示授权对话框。解锁设备，确认密钥指纹，并且仅在 Mac 受信任时选择 **Always allow from this computer**。成功的 `adb devices` 条目以 `device` 结尾；`unauthorized` 表示尚未批准设备上的提示。

scrcpy 窗口打开后，可以直接使用，也可以通过 macOS 屏幕自动化工具（例如 [Peekaboo](https://peekaboo.sh/)）操作它。scrcpy 负责显示和输入；Tailscale 仅提供私有网络路径。

### 故障排查

- `Connection timed out`：验证 TCP 5555 的 tailnet 授权规则。成功的 `tailscale ping` 只能证明
  对等设备可达，并不表示策略允许使用此 TCP 端口。在 Mac 上使用
  `nc -vz <android-tailnet-ip> 5555` 进行测试。
- `unauthorized`：解锁 Android 并批准远程 Mac 的 ADB 密钥，或者在 **Wireless debugging > Paired devices** 下移除失效的工作站，然后重新配对。
- `Connection refused`：在本地重新连接，然后再次运行 `adb tcpip 5555`。
- 列出了多个设备：保留显式的 `--serial <android-tailnet-ip>:5555` 参数。

完成后，关闭 scrcpy 并断开 ADB：

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 连接运行手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公共主机，Android 要求使用安全端点：

- 首选：使用 `https://<magicdns>` / `wss://<magicdns>` 的 Tailscale Serve / Funnel
- 也支持：具有真实 TLS 端点的任何其他 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有 LAN 地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接（`10.0.2.2`）；非 local loopback 设置会自动使用受限的操作员访问权限

### 前提条件

- Gateway 网关正在另一台计算机上运行（或可通过 SSH 访问）。
- Android 设备/模拟器可以访问 Gateway 网关 WebSocket：
  - 通过 mDNS/NSD 连接到同一个 LAN，**或**
  - 使用 Wide-Area Bonjour / 单播 DNS-SD 连接到同一个 Tailscale tailnet（见下文），**或**
  - 手动指定 Gateway 网关主机/端口（回退方案）
- Tailnet/公共移动设备配对**不**使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- Gateway 网关计算机上（或通过 SSH）可以使用 `openclaw` CLI，以批准配对请求。

### 1. 启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

确认日志中出现类似以下内容：

- `listening on ws://0.0.0.0:18789`

通过 Tailscale 进行远程 Android 访问时，首选 Serve/Funnel，而不是直接绑定原始 tailnet：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供安全的 `wss://` / `https://` 端点。除非另行终止 TLS，否则仅设置 `gateway.bind: "tailnet"` 不足以支持首次远程 Android 配对。

### 2. 验证设备发现（可选）

在 Gateway 网关计算机上：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/zh-CN/gateway/bonjour)。

如果还配置了广域设备发现域，请与以下命令的结果进行比较：

```bash
openclaw gateway discover --json
```

该命令会一次性显示 `local.` 以及已配置的广域域，并使用解析后的服务端点，而不是仅使用 TXT 提示。

#### 通过单播 DNS-SD 进行跨网络设备发现

Android NSD/mDNS 设备发现无法跨越网络。如果 Android 节点和 Gateway 网关位于不同网络，但通过 Tailscale 连接，请改用 Wide-Area Bonjour / 单播 DNS-SD。对于 tailnet/公共 Android 配对，仅有设备发现还不够——发现的路由仍需使用安全端点（`wss://` 或 Tailscale Serve）：

1. 在 Gateway 网关主机上设置 DNS-SD 区域（例如 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为所选域配置 Tailscale 拆分 DNS，并使其指向该 DNS 服务器。

详细信息和 CoreDNS 配置示例：[Bonjour](/zh-CN/gateway/bonjour)。

### 3. 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（常驻通知）保持与 Gateway 网关的连接。
- 打开 **Connect** 选项卡。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果设备发现受阻，请在 **Advanced controls** 中手动指定主机/端口。对于私有 LAN 主机，`ws://` 仍然有效。对于 Tailscale/公共主机，请启用 TLS，并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 会在启动时自动重新连接到当前配对的 Gateway 网关（对于通过设备发现找到的 Gateway 网关，此操作尽力而为，且这些 Gateway 网关必须在网络上可见）。

官方设置代码默认通过 `wss://` 将 Android 作为节点连接，并授予完整的 Gateway 网关操作员访问权限。明文非 local loopback 的 `ws://` 设置会自动使用受限访问权限，以保障持有者令牌的安全。**Settings → Gateway** 会显示 **Full** 或 **Limited** 访问权限。对于受限连接，请配置 `wss://` 或 Tailscale Serve，在 Control UI 中或使用 `openclaw qr` 生成新的完整访问权限代码，然后在该页面扫描或粘贴代码并重新连接。希望使用受限配置的操作员可以在 Control UI 中选择 **Limited access**，或运行 `openclaw qr --limited`。

### 多个 Gateway 网关

应用会保留其已配对的每个 Gateway 网关的注册表，因此可以在它们之间切换而无需重新配对：

- **Settings -> Gateways** 会列出已配对的 Gateway 网关，并标记当前使用的网关。点按一个条目即可切换；应用会终止当前会话并重新连接到所选 Gateway 网关。
- 配对了多个 Gateway 网关时，**Connect** 选项卡会显示快速切换器。
- 凭据、设备令牌、TLS 信任、聊天历史记录和排队的离线消息均按 Gateway 网关分别存储。切换时绝不会混合不同 Gateway 网关的状态，离线时排队的消息也只会发送到其原本对应的 Gateway 网关。
- **Forget** 会移除 Gateway 网关的注册表条目及其凭据、设备令牌、TLS 固定信息和缓存聊天记录。

### 在线状态信标

经过身份验证的节点会话连接后，以及应用转入后台但前台服务仍保持连接时，Android 会使用 `event: "node.presence.alive"` 调用 `node.event`。只有在确定经过身份验证的节点设备身份后，Gateway 网关才会将其记录为已配对节点/设备元数据中的 `lastSeenAtMs`/`lastSeenReason`。

仅当 Gateway 网关响应包含 `handled: true` 时，应用才会将该信标计为成功记录。旧版 Gateway 网关可能会使用 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不计为持久的最后上线时间更新。

### 4. 批准配对（CLI）

在 Gateway 网关计算机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情：[配对](/zh-CN/channels/pairing)。

可选：如果 Android 节点始终从严格管控的子网连接，可以选择通过明确的 CIDR 或精确 IP 地址自动批准首次节点配对：

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

此功能默认禁用。它仅适用于没有请求权限范围的新 `role: node` 配对。操作员/浏览器配对以及任何角色、权限范围、元数据或公钥变更仍需手动批准。

### 5. 验证节点已连接

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 聊天 + 历史记录

Android 聊天标签页支持选择会话（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（显示时经过规范化——会移除内联指令标签、纯文本工具调用 XML 载荷（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>` 及其截断变体），以及泄漏的 ASCII/全角模型控制令牌；会省略仅含静默令牌的助手行，例如内容严格等于 `NO_REPLY` / `no_reply` 的行；过大的行可能会替换为占位符）
- 发送：`chat.send`
- 持久发送：每次发送（文本、选取的图片和语音留言）都会在尝试网络连接前记录到设备上按 Gateway 网关划分的发件箱中，因此应用终止不会导致已提交的输入丢失。离线期间排队的发送会在重新连接后按顺序投递，并使用稳定的幂等键；只有当该轮次出现在规范的 `chat.history` 中后，发送才会从队列移除——仅收到确认不视为投递成功的证明。结果不明确时（确认丢失、应用在发送过程中被终止、Gateway 网关在写入对话记录前重启），会显示为带有明确 **重试**/**删除** 操作的可见行，而不会自动重发。斜杠命令绝不会在重新连接后自动重放；它们会停留在队列中，等待明确重试。队列有容量限制（每个 Gateway 网关最多 50 条消息和 48 MB 附件数据），未发送的行会在 48 小时后过期。从未提交的编辑器草稿无法跨进程持久保存。
- 推送更新（尽力而为）：`chat.subscribe` -> `event:"chat"`
- 收听：长按助手消息并选择 **Listen** 即可听取内容；音频通过 Gateway 网关的 `tts.speak` 使用已配置的 TTS 提供商链生成，当 Gateway 网关无法生成音频时，则使用设备上的系统 TTS。切换会话、新建聊天、应用进入后台或关闭聊天时，播放都会停止。

### 7. Canvas + 相机

#### Gateway 网关 Canvas 主机（推荐用于 Web 内容）

要让节点显示智能体可在磁盘上编辑的真实 HTML/CSS/JS，请将节点指向 Gateway 网关 Canvas 主机。

<Note>
节点从 Gateway 网关 HTTP 服务器加载 Canvas（端口与 `gateway.port` 相同，默认为 `18789`）。
</Note>

1. 在 Gateway 网关主机上创建 `~/.openclaw/workspace/canvas/index.html`。
2. 让节点导航到该地址（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（可选）：如果两台设备均使用 Tailscale，请使用 MagicDNS 名称或 tailnet IP，而不是 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此服务器会将实时重载客户端注入 HTML，并在文件变更时重新加载。Gateway 网关还会提供 `/__openclaw__/a2ui/`，但 Android 应用将远程 A2UI 页面视为仅供渲染。支持操作的 A2UI 命令使用应用内置且由应用所有的 A2UI 页面。

Canvas 命令（仅限前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认为 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 为旧版别名）。这些命令使用应用内置且由应用所有的 A2UI 页面进行支持操作的渲染。

相机命令（仅限前台；受权限控制）：`camera.snap`（jpg）、`camera.clip`（mp4）。有关参数和 CLI 辅助命令，请参阅[相机节点](/zh-CN/nodes/camera)。

### 8. 语音 + 扩展的 Android 命令面

- 语音标签页：Android 提供两种明确的采集模式。**Mic** 是语音标签页中的手动会话，每次停顿都会作为一个聊天轮次发送；当应用离开前台或用户离开语音标签页时，会话即停止。**Talk** 是持续的 Talk 模式，将一直监听，直到关闭该模式或节点断开连接。
- Talk 模式会在开始采集前将现有前台服务从 `connectedDevice` 提升为 `connectedDevice|microphone`，并在 Talk 模式停止后将其降级。节点服务使用 `CHANGE_NETWORK_STATE` 声明 `FOREGROUND_SERVICE_CONNECTED_DEVICE`；Android 14+ 还要求声明 `FOREGROUND_SERVICE_MICROPHONE`、授予 `RECORD_AUDIO` 运行时权限，并在运行时使用麦克风服务类型。
- 默认情况下，Android Talk 使用原生语音识别、Gateway 网关聊天以及通过已配置的 Gateway 网关 Talk 提供商提供的 `talk.speak`。仅当 `talk.speak` 不可用时，才使用本地系统 TTS。
- 仅当 `talk.realtime.mode` 为 `realtime` 且 `talk.realtime.transport` 为 `gateway-relay` 时，Android Talk 才使用实时 Gateway 网关中继。
- Android 不公布 `voiceWake` 能力。请使用 **Mic** 或 **Talk** 进行语音输入。
- 其他 Android 命令族（可用性取决于设备、权限和用户设置）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - 仅当启用 **Settings > Phone Capabilities > Installed Apps** 时才提供 `device.apps`；默认列出启动器中可见的应用（传入 `includeNonLaunchable` 可获取完整列表）。
  - `notifications.list`、`notifications.actions`（参阅下方的[通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

### 9. 工作区文件（只读）

主页概览包含一个 **文件** 卡片，它通过只读的 `agents.workspace.list` / `agents.workspace.get` Gateway 网关 RPC 浏览当前智能体的工作区：可逐层进入目录、预览文本和图片，并通过 Android 分享面板导出。不提供任何写入操作，且 Gateway 网关会限制预览大小。

## 审核命令审批

具有 `operator.admin` 的操作员连接，或由 Gateway 网关明确指定的已配对
`operator.approvals` 连接，可以在 **Settings -> Approvals** 下审核
待处理的 Exec 请求。应用会先加载 Gateway 网关经过清理的审批记录，然后才启用按钮；应用会显示所有
安全警告以及该请求提供的确切决策，并将
审批 ID 和所有者类型提交回 Gateway 网关。

审批状态与 Control UI 和受支持的聊天界面共享。
首个提交的答案生效；即使另一个界面率先作答，Android 也会显示该规范结果。如果解决响应丢失或 Gateway 网关
断开连接，应用会保持操作锁定，并在
再次提供决策前重新读取审批。

早于统一审批方法的 Gateway 网关会回退到已发布的
Exec 专用方法。待处理审核仍然可用，但保留的终端状态
和更丰富的跨界面结果需要更新后的 Gateway 网关。

## 助手入口点

Android 支持通过系统助手触发器（Google Assistant）启动 OpenClaw。按住主页按钮（或其他 `ACTION_ASSIST` 触发器）会打开应用；说出 “Hey Google, ask OpenClaw `<prompt>`” 会匹配应用声明的 App Actions 查询模式，并将提示词传入聊天编辑器，而不会自动发送。

此功能使用应用清单中声明的 Android **App Actions**（`shortcuts.xml` 能力）。无需任何 Gateway 网关端配置——助手意图完全由 Android 应用处理。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，以及用户是否已将 OpenClaw 设置为默认助手应用。
</Note>

## 通知转发

Android 可将设备通知作为 `node.event` 项转发到 Gateway 网关。此功能需在应用的设置面板中**在设备上**配置，而不是在 Gateway 网关/`openclaw.json` 配置中设置。

| 设置                        | 说明                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | 主开关。默认关闭；必须先授予 Notification Listener Access。                                                                                                                                          |
| Package Filter              | **Allowlist**（仅转发列出的软件包 ID）或 **Blocklist**（默认：除列出的 ID 外，转发所有软件包）。在 Blocklist 模式下，始终排除 OpenClaw 自身的软件包，以防止转发循环。 |
| Quiet Hours                 | 抑制转发的本地 HH:mm 起止时间窗口。默认禁用；启用后默认为 `22:00`-`07:00`。                                                                                                    |
| Max Events / Minute         | 每台设备转发通知的速率限制。默认值为 20。                                                                                                                                                             |
| Route Session Key           | 可选。将转发的通知事件固定到特定会话，而不是使用设备的默认通知路由。                                                                                                                                 |

<Note>
通知转发需要 Android Notification Listener 权限。应用会在设置过程中提示授予此权限。
</Note>

始终排除 WhatsApp、WhatsApp Business、Telegram、Telegram X、Discord 和 Signal 的通知。它们的消息已由原生 OpenClaw 渠道会话所有；将 Android 通知作为单独的节点事件转发，可能会导致回复被路由到错误的对话。

## 相关内容

- [iOS 应用](/zh-CN/platforms/ios)
- [节点](/zh-CN/nodes)
- [Android 节点故障排查](/zh-CN/nodes/troubleshooting)

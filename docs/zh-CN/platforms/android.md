---
read_when:
    - 配对或重新连接 Android 节点
    - 调试 Android Gateway 网关的设备发现或认证
    - 验证各客户端的聊天历史一致性
summary: Android 应用（节点）：连接运行手册 + 连接/聊天/语音/画布命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-04-28T11:57:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Android 应用尚未公开发布。源代码位于 [OpenClaw repository](https://github.com/openclaw/openclaw) 的 `apps/android` 下。你可以使用 Java 17 和 Android SDK（`./gradlew :app:assemblePlayDebug`）自行构建。构建说明见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。
</Note>

## 支持概览

- 角色：配套节点应用（Android 不托管 Gateway 网关）。
- 需要 Gateway 网关：是（通过 WSL2 在 macOS、Linux 或 Windows 上运行）。
- 安装：[入门指南](/zh-CN/start/getting-started) + [配对](/zh-CN/channels/pairing)。
- Gateway 网关：[运行手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway 网关协议](/zh-CN/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 网关主机上。见 [Gateway 网关](/zh-CN/gateway)。

## 连接运行手册

Android 节点应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公共主机，Android 需要安全端点：

- 首选：Tailscale Serve / Funnel，使用 `https://<magicdns>` / `wss://<magicdns>`
- 也支持：任何其他带真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有 LAN 地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前提条件

- 你可以在“主”机器上运行 Gateway 网关。
- Android 设备/模拟器可以访问 Gateway 网关 WebSocket：
  - 带 mDNS/NSD 的同一 LAN，**或**
  - 使用广域 Bonjour / 单播 DNS-SD 的同一 Tailscale tailnet（见下文），**或**
  - 手动 Gateway 网关主机/端口（备用）
- Tailnet/公共移动端配对**不**使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在 Gateway 网关机器上运行 CLI（`openclaw`）（或通过 SSH 运行）。

### 1) 启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

确认日志中能看到类似内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 的远程 Android 访问，请优先使用 Serve/Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供安全的 `wss://` / `https://` 端点。普通的 `gateway.bind: "tailnet"` 设置不足以完成首次远程 Android 配对，除非你还单独终止 TLS。

### 2) 验证设备发现（可选）

在 Gateway 网关机器上：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域设备发现域，请对比：

```bash
openclaw gateway discover --json
```

这会一次性显示 `local.` 以及已配置的广域域，并使用已解析的服务端点，而不是仅使用 TXT 提示。

#### 通过单播 DNS-SD 进行 Tailnet（维也纳 ⇄ 伦敦）设备发现

Android NSD/mDNS 设备发现不会跨网络。如果你的 Android 节点和 Gateway 网关位于不同网络，但通过 Tailscale 连接，请改用广域 Bonjour / 单播 DNS-SD。

仅设备发现不足以完成 tailnet/公共 Android 配对。发现到的路由仍需要安全端点（`wss://` 或 Tailscale Serve）：

1. 在 Gateway 网关主机上设置 DNS-SD 区域（示例 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域配置 Tailscale 分割 DNS，指向该 DNS 服务器。

详情和 CoreDNS 配置示例：[Bonjour](/zh-CN/gateway/bonjour)。

### 3) 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持 Gateway 网关连接存活。
- 打开 **Connect** 标签页。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果设备发现被阻止，请在 **Advanced controls** 中使用手动主机/端口。对于私有 LAN 主机，`ws://` 仍可使用。对于 Tailscale/公共主机，请开启 TLS 并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 会在启动时自动重新连接：

- 手动端点（如果启用），否则
- 上次发现的 Gateway 网关（尽力而为）。

### 存活状态信标

已认证的节点会话连接后，以及应用进入后台但前台服务仍保持连接时，Android 会调用 `node.event`，并传入 `event: "node.presence.alive"`。Gateway 网关只会在已知已认证节点设备身份之后，将其记录为已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

只有当 Gateway 网关响应包含 `handled: true` 时，应用才会将该信标计为已成功记录。旧版 Gateway 网关可能会用 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不计为持久的最后可见更新。

### 4) 批准配对（CLI）

在 Gateway 网关机器上：

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

默认禁用。它仅适用于没有请求范围的新 `role: node` 配对。操作员/浏览器配对以及任何角色、范围、元数据或公钥变更仍需要手动批准。

### 5) 验证节点已连接

- 通过节点 Status：

  ```bash
  openclaw nodes status
  ```

- 通过 Gateway 网关：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 聊天 + 历史记录

Android Chat 标签页支持会话选择（默认 `main`，以及其他现有会话）：

- 历史记录：`chat.history`（显示已规范化；内联指令标签会从可见文本中移除，纯文本工具调用 XML 负载（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及被截断的工具调用块）和泄漏的 ASCII/全角模型控制令牌会被移除，纯静默令牌 assistant 行，例如精确的 `NO_REPLY` / `no_reply` 会被省略，超大行可替换为占位符）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 摄像头

#### Gateway 网关 Canvas Host（推荐用于 Web 内容）

如果你希望节点显示 agent 可以在磁盘上编辑的真实 HTML/CSS/JS，请将节点指向 Gateway 网关 canvas host。

<Note>
节点从 Gateway 网关 HTTP 服务器加载 canvas（端口与 `gateway.port` 相同，默认 `18789`）。
</Note>

1. 在 Gateway 网关主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 将节点导航到它（LAN）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（可选）：如果两台设备都在 Tailscale 上，请使用 MagicDNS 名称或 tailnet IP 替代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此服务器会向 HTML 注入实时重载客户端，并在文件变更时重新加载。
A2UI host 位于 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 旧版别名）

摄像头命令（仅前台；受权限控制）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参数和 CLI 辅助命令见 [Camera 节点](/zh-CN/nodes/camera)。

### 8) 语音 + 扩展 Android 命令面

- Voice 标签页：Android 有两种明确的采集模式。**Mic** 是手动 Voice 标签页会话，会将每次暂停作为一次聊天轮次发送，并在应用离开前台或用户离开 Voice 标签页时停止。**Talk** 是连续 Talk Mode，会持续监听，直到被关闭或节点断开连接。
- Talk Mode 会在采集开始前将现有前台服务从 `dataSync` 提升为 `dataSync|microphone`，并在 Talk Mode 停止时降级。Android 14+ 需要 `FOREGROUND_SERVICE_MICROPHONE` 声明、`RECORD_AUDIO` 运行时授权，以及运行时的 microphone 服务类型。
- 语音回复通过配置的 Gateway 网关 Talk provider 使用 `talk.speak`。仅当 `talk.speak` 不可用时，才使用本地系统 TTS。
- Android UX/运行时中仍禁用语音唤醒。
- 其他 Android 命令族（可用性取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（见下方[通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## Assistant 入口点

Android 支持从系统 assistant 触发器（Google Assistant）启动 OpenClaw。配置后，按住主屏幕按钮或说 “Hey Google, ask OpenClaw...” 会打开应用，并将提示传入聊天编辑器。

这使用在应用清单中声明的 Android **App Actions** 元数据。Gateway 网关端不需要额外配置，assistant intent 完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，以及用户是否已将 OpenClaw 设为默认 assistant 应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 Gateway 网关。多个控制项可让你限定转发哪些通知以及何时转发。

| 键                               | 类型           | 描述                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 仅转发来自这些包名的通知。如果已设置，所有其他包都会被忽略。      |
| `notifications.denyPackages`     | string[]       | 绝不转发来自这些包名的通知。在 `allowPackages` 之后应用。              |
| `notifications.quietHours.start` | string (HH:mm) | 安静时段窗口的开始时间（本地设备时间）。此窗口内会抑制通知。 |
| `notifications.quietHours.end`   | string (HH:mm) | 安静时段窗口的结束时间。                                                                        |
| `notifications.rateLimit`        | number         | 每个包每分钟最多转发的通知数。超出的通知会被丢弃。         |

通知选择器还会对转发的通知事件使用更安全的行为，防止意外转发敏感系统通知。

配置示例：

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

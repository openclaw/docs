---
read_when:
    - 配对或重新连接 Android node
    - 调试 Android Gateway 网关发现或认证
    - 验证不同客户端之间的聊天历史一致性
summary: Android 应用（node）：连接运行手册 + Connect/Chat/Voice/Canvas 命令界面
title: Android 应用
x-i18n:
    generated_at: "2026-04-25T05:54:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **注意：** Android 应用尚未公开发布。源代码可在 [OpenClaw 仓库](https://github.com/openclaw/openclaw) 的 `apps/android` 下获取。你可以使用 Java 17 和 Android SDK 自行构建（`./gradlew :app:assemblePlayDebug`）。构建说明请参见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。

## 支持概览

- 角色：配套 node 应用（Android 不承载 Gateway 网关）。
- 是否需要 Gateway 网关：是（在 macOS、Linux 或通过 WSL2 的 Windows 上运行）。
- 安装：[入门指南](/zh-CN/start/getting-started) + [配对](/zh-CN/channels/pairing)。
- Gateway 网关：[运行手册](/zh-CN/gateway) + [配置](/zh-CN/gateway/configuration)。
  - 协议：[Gateway protocol](/zh-CN/gateway/protocol)（nodes + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 网关主机上。请参见 [Gateway 网关](/zh-CN/gateway)。

## 连接运行手册

Android node 应用 ⇄（mDNS/NSD + WebSocket）⇄ **Gateway 网关**

Android 直接连接到 Gateway 网关 WebSocket，并使用设备配对（`role: node`）。

对于 Tailscale 或公网主机，Android 需要安全端点：

- 首选：Tailscale Serve / Funnel，使用 `https://<magicdns>` / `wss://<magicdns>`
- 同样支持：任何其他带真实 TLS 端点的 `wss://` Gateway 网关 URL
- 明文 `ws://` 仍支持私有局域网地址 / `.local` 主机，以及 `localhost`、`127.0.0.1` 和 Android 模拟器桥接地址（`10.0.2.2`）

### 前提条件

- 你可以在“主”机器上运行 Gateway 网关。
- Android 设备/模拟器可以访问 Gateway 网关 WebSocket：
  - 位于同一局域网并使用 mDNS/NSD，**或**
  - 位于同一 Tailscale tailnet，并使用 Wide-Area Bonjour / 单播 DNS-SD（见下文），**或**
  - 手动指定 Gateway 网关主机/端口（回退方案）
- tailnet/公网移动配对**不**使用原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在 Gateway 网关机器上运行 CLI（`openclaw`）（或通过 SSH 运行）。

### 1）启动 Gateway 网关

```bash
openclaw gateway --port 18789 --verbose
```

在日志中确认你能看到类似以下内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 的远程 Android 访问，优先使用 Serve/Funnel，而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这会为 Android 提供安全的 `wss://` / `https://` 端点。单独使用普通的 `gateway.bind: "tailnet"` 设置，不足以完成首次远程 Android 配对，除非你另外终止 TLS。

### 2）验证设备发现（可选）

在 Gateway 网关机器上运行：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明： [Bonjour](/zh-CN/gateway/bonjour)。

如果你还配置了广域设备发现域，请对比以下命令结果：

```bash
openclaw gateway discover --json
```

它会一次性显示 `local.` 和已配置的广域域名，并使用已解析的
服务端点，而不是仅依赖 TXT 提示。

#### 通过单播 DNS-SD 进行 tailnet（维也纳 ⇄ 伦敦）设备发现

Android NSD/mDNS 设备发现不会跨网络。如果你的 Android node 和 Gateway 网关位于不同网络，但都连接到了 Tailscale，请改用 Wide-Area Bonjour / 单播 DNS-SD。

仅有设备发现并不足以支持 tailnet/公网 Android 配对。发现到的路由仍然需要安全端点（`wss://` 或 Tailscale Serve）：

1. 在 Gateway 网关主机上设置一个 DNS-SD 区域（例如 `openclaw.internal.`），并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域配置 Tailscale split DNS，并指向该 DNS 服务器。

详情和示例 CoreDNS 配置： [Bonjour](/zh-CN/gateway/bonjour)。

### 3）从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持与 Gateway 网关的连接。
- 打开 **Connect** 标签页。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果设备发现被阻止，请在 **Advanced controls** 中手动输入主机/端口。对于私有局域网主机，`ws://` 仍然可用。对于 Tailscale/公网主机，请启用 TLS，并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 会在启动时自动重连：

- 若已启用，则使用手动端点，否则
- 使用最近发现的 Gateway 网关（尽力而为）。

### 4）批准配对（CLI）

在 Gateway 网关机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情： [配对](/zh-CN/channels/pairing)。

可选：如果 Android node 始终只会从严格受控的子网连接，
你可以通过显式 CIDR 或精确 IP，启用首次 node 自动批准：

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

此功能默认禁用。它仅适用于全新的 `role: node` 配对，并且
没有请求任何 scope。操作员/浏览器配对，以及任何角色、scope、元数据或
公钥变更，仍然需要手动批准。

### 5）验证 node 已连接

- 通过 nodes 状态：

  ```bash
  openclaw nodes status
  ```

- 通过 Gateway 网关：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6）聊天 + 历史记录

Android Chat 标签页支持会话选择（默认 `main`，以及其他已有会话）：

- 历史记录：`chat.history`（显示归一化；可见文本中的内联指令标签会被
  去除，纯文本工具调用 XML 负载（包括
  `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、
  `<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>`，以及
  被截断的工具调用块）和泄露的 ASCII/全角模型控制令牌
  会被移除，纯静默令牌的助手行，例如精确的 `NO_REPLY` /
  `no_reply`，会被省略，过大的行则可能会被占位符替代）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7）Canvas + 相机

#### Gateway Canvas Host（推荐用于 Web 内容）

如果你希望 node 显示智能体可在磁盘上编辑的真实 HTML/CSS/JS 内容，请让 node 指向 Gateway 网关 canvas host。

注意：nodes 从 Gateway 网关 HTTP 服务器加载 canvas（与 `gateway.port` 使用同一端口，默认 `18789`）。

1. 在 Gateway 网关主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 将 node 导航到该页面（局域网）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet（可选）：如果两台设备都在 Tailscale 上，请使用 MagicDNS 名称或 tailnet IP 替代 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

该服务器会向 HTML 注入实时重载客户端，并在文件变更时重新加载。
A2UI host 位于 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 可返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 为旧版别名）

相机命令（仅前台；受权限控制）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参数和 CLI 辅助命令请参见 [Camera node](/zh-CN/nodes/camera)。

### 8）语音 + 扩展 Android 命令界面

- 语音：Android 在 Voice 标签页中使用单一麦克风开/关流程，支持转录捕获和 `talk.speak` 播放。仅当 `talk.speak` 不可用时，才使用本地系统 TTS。应用离开前台时，语音会停止。
- 语音唤醒/通话模式切换目前已从 Android UX/运行时中移除。
- 其他 Android 命令族（是否可用取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（见下方 [通知转发](#notification-forwarding)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助手入口点

Android 支持通过系统助手触发器启动 OpenClaw（Google
Assistant）。配置完成后，长按 Home 键或说“Hey Google, ask
OpenClaw...”即可打开应用，并将提示词传入聊天输入框。

这使用的是在应用清单中声明的 Android **App Actions** 元数据。Gateway 网关侧
无需额外配置——助手 intent 完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 的可用性取决于设备、Google Play Services 版本，
以及用户是否已将 OpenClaw 设为默认助手应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 Gateway 网关。有多项控制项可让你限定转发哪些通知以及何时转发。

| 键名 | 类型 | 说明 |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 仅转发来自这些包名的通知。如果已设置，所有其他包都会被忽略。 |
| `notifications.denyPackages`     | string[]       | 永不转发来自这些包名的通知。在 `allowPackages` 之后应用。 |
| `notifications.quietHours.start` | string (HH:mm) | 静默时段窗口开始时间（设备本地时间）。在该窗口期间通知会被抑制。 |
| `notifications.quietHours.end`   | string (HH:mm) | 静默时段窗口结束时间。 |
| `notifications.rateLimit`        | number         | 每个包每分钟允许转发的最大通知数。超出的通知会被丢弃。 |

通知选择器对转发的通知事件也采用了更安全的行为，避免意外转发敏感的系统通知。

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
通知转发需要 Android Notification Listener 权限。应用会在设置期间提示你授予该权限。
</Note>

## 相关内容

- [iOS 应用](/zh-CN/platforms/ios)
- [Nodes](/zh-CN/nodes)
- [Android node 故障排除](/zh-CN/nodes/troubleshooting)

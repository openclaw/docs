---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源码运行 iOS 应用
    - 调试 Gateway 网关发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排查
title: iOS 应用
x-i18n:
    generated_at: "2026-07-06T10:49:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b118e6983ba0077e9d4752548ef3ea3adfe699a10398f673520610076004da1b
    source_path: platforms/ios.md
    workflow: 16
---

可用性：iPhone app 构建在为某个版本启用时会通过 Apple 渠道分发。本地开发构建也可以从源码运行。

## 它的作用

- 通过 WebSocket（LAN 或 tailnet）连接到 Gateway 网关。
- 暴露节点能力：画布、屏幕快照、相机捕获、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并报告节点状态事件。
- 为每个已配对 Gateway 网关保留一个小型只读离线缓存，包含最近的聊天会话和转录记录：冷启动会立即绘制最后已知的转录记录，并在 Gateway 网关响应后刷新；断开连接时仍可浏览最近聊天；重置/遗忘会清除受保护的本地缓存。
- 将断开连接时发送的文本消息排入每个 Gateway 网关持久发件箱（最多 50 条）：排队的气泡会显示在转录记录中，重连时按顺序发送，并使用幂等键确保不会重复发送；在显示为“未发送”并在消息上下文菜单中提供重试/删除之前，会使用退避策略重试；离线超过 48 小时后会过期而不是发送；重置/遗忘会随缓存一起清空队列。

## 要求

- Gateway 网关运行在另一台设备上（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 使用同一 LAN，**或**
  - 通过单播 DNS-SD 使用 tailnet（示例域：`openclaw.internal.`），**或**
  - 手动主机/端口（回退）。

## 快速开始（配对 + 连接）

1. 启动一个已认证的 Gateway 网关，并提供你的手机可以访问的路由。Tailscale
   Serve 是推荐的远程路径：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于可信的同 LAN 设置，请改用已认证的 `gateway.bind: "lan"`。
默认的 loopback 绑定无法从手机访问。如果 Gateway 网关尚未配置，请先运行 `openclaw onboard`，以便设置代码创建流程拥有令牌或密码认证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择**节点**，然后在**设备**卡片中点击**配对移动设备**。

3. 在 iOS app 中，打开**设置** -> **Gateway 网关**，扫描二维码（或粘贴设置代码），然后连接。

   如果设置代码同时包含 LAN 和 Tailscale Serve 路由，app 会按顺序探测它们，并保存第一个可访问的端点。

4. 官方 app 会自动连接。如果**设备**显示待处理请求，请在批准前检查其角色和权限范围。

Apple Watch 配套应用没有单独的 OpenClaw 配对批准。在 Apple 的 Watch app 中将 Watch 与 iPhone 配对，从
**Watch app -> My Watch -> Available Apps** 安装 OpenClaw，然后在两台设备上各打开一次 OpenClaw。OpenClaw 会立即跟随 Apple Watch 配对和安装变更；Gateway 网关的设备批准覆盖 iPhone 节点。

Control UI 按钮需要一个已配对且具有 `operator.admin` 的会话。作为终端回退，请在 iOS app 中选择一个已发现的 Gateway 网关（或启用手动主机并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 使用已变更的认证细节（角色/权限范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从严格受控的子网连接，你可以选择使用显式 CIDR 或精确 IP 启用首次节点自动批准：

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

默认情况下这是禁用的。它仅适用于没有请求权限范围的新 `role: node` 配对。操作员/浏览器配对，以及任何角色、权限范围、元数据或公钥变更仍然需要手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs 令牌发布到 Gateway 网关。来自公共发布通道的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`；此基础 URL 对 App Store 分发是硬编码的，不读取任何覆盖值。

自定义中继部署需要一个有意分离的 iOS 构建/部署路径，其 中继 URL 必须与 Gateway 网关中继 URL 匹配。App Store 发布通道永远不接受自定义中继 URL。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

流程工作方式：

- iOS app 使用 App Attest 和 StoreKit app transaction JWS 向中继注册。
- 中继返回一个不透明的中继句柄，以及一个注册范围内的发送授权。
- iOS app 获取已配对 Gateway 网关身份（`gateway.identity.get`），并将其包含在中继注册中，因此中继支持的注册会委托给该特定 Gateway 网关。
- app 使用 `push.apns.register` 将该中继支持的注册转发到已配对 Gateway 网关。
- Gateway 网关使用该已存储的中继句柄执行 `push.test`、后台唤醒和唤醒轻推。
- 如果 app 后续连接到不同的 Gateway 网关，或连接到具有不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

此路径下 Gateway 网关**不**需要的内容：不需要部署级中继令牌，也不需要用于官方 App Store 中继支持发送的直接 APNs 密钥。

预期操作员流程：

1. 安装官方 iOS app。
2. 可选：仅在使用有意分离的自定义中继构建时，在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将 app 与 Gateway 网关配对，并让它完成连接。
4. app 在拥有 APNs 令牌、操作员会话已连接且中继注册成功后，会发布一次 `push.apns.register`。
5. 此后，`push.test`、重连唤醒和唤醒轻推可以使用已存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或重要位置事件唤醒 app 时，app 会尝试一次短暂的节点重连，然后调用 `node.event`，其中 `event: "node.presence.alive"`。Gateway 网关只有在已知认证节点设备身份之后，才会将其作为已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason` 记录。

只有当 Gateway 网关响应包含 `handled: true` 时，app 才会将后台唤醒视为已成功记录。较旧的 Gateway 网关可能会用 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不计为持久的最后可见更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖使用（`gateway.push.apns.relay.baseUrl` 是配置优先路径）。
- App Store 发布构建的推送模式会硬编码托管中继主机，并且永远不读取中继 URL 覆盖值；`OPENCLAW_PUSH_RELAY_BASE_URL` 构建时环境变量只影响本地/沙箱 iOS 构建模式。

## 认证和信任流程

该中继的存在是为了强制执行直接在 Gateway 网关上使用 APNs 无法为官方 iOS 构建提供的两个约束：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`：app 通过常规 Gateway 网关认证流程与 Gateway 网关配对，获得一个已认证的节点会话和一个已认证的操作员会话。操作员会话调用 `gateway.identity.get`。
2. `iOS app -> relay`：app 通过 HTTPS 调用中继注册端点，并提供 App Attest 证明和 StoreKit app transaction JWS。中继验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求官方/生产分发路径；这会阻止本地 Xcode/dev 构建使用托管中继，因为本地构建无法满足官方 Apple 分发证明。
3. `gateway identity delegation`：在中继注册之前，app 从 `gateway.identity.get` 获取已配对 Gateway 网关身份，并将其包含在中继注册负载中。中继返回一个中继句柄，以及一个委托给该 Gateway 网关身份的注册范围内发送授权。
4. `gateway -> relay`：Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。在 `push.test`、重连唤醒和唤醒轻推时，Gateway 网关使用自己的设备身份签署发送请求；中继会同时根据注册时委托的 Gateway 网关身份验证已存储的发送授权和 Gateway 网关签名。即使另一个 Gateway 网关以某种方式获得该句柄，也不能复用该已存储注册。
5. `relay -> APNs`：中继拥有生产 APNs 凭据，以及官方构建的原始 APNs 令牌。对于中继支持的官方构建，Gateway 网关永远不会存储原始 APNs 令牌；中继代表已配对 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：将生产 APNs 凭据保留在用户 Gateway 网关之外，避免在 Gateway 网关上存储官方构建的原始 APNs 令牌，仅允许官方 OpenClaw iOS 构建使用托管中继，并防止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍使用直接 APNs。如果你在不使用中继的情况下测试这些构建，Gateway 网关仍需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储 App Store Connect 认证信息，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 交付。

推荐的 Gateway 网关主机存储方式，与 `~/.openclaw/credentials/` 下的其他提供商凭据一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件，也不要将其放在仓库 checkout 下。

## 设备发现路径

### Bonjour（LAN）

iOS app 会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览相同的广域 DNS-SD 设备发现域。同 LAN Gateway 网关会自动从 `local.` 出现；跨网络设备发现可以使用已配置的广域域，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域；示例：`openclaw.internal.`）和 Tailscale split DNS。CoreDNS 示例见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中启用**手动主机**，并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## 画布 + A2UI

iOS 节点会渲染一个 WKWebView 画布。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关画布主机从 Gateway 网关 HTTP 服务器（与 `gateway.port` 相同的端口，默认 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 节点会将内置脚手架保留为已连接默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用内置的 app 自有 A2UI 页面。
- 远程 Gateway 网关 A2UI 页面在 iOS 上仅可渲染；原生 A2UI 按钮操作只接受来自内置 app 自有页面的操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## Computer Use 关系

iOS 应用是移动节点界面，而不是 Codex Computer Use 后端。Codex Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令暴露 iPhone 能力，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍然可以通过调用节点命令，经由 OpenClaw 操作 iOS 应用，但这些调用会经过 Gateway 网关节点协议，并遵循 iOS 前台/后台限制。将 [Codex Computer Use](/zh-CN/plugins/codex-computer-use) 用于本地桌面控制，将本页用于 iOS 节点能力。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在设置中使用。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI 实时 Talk 使用客户端拥有的 WebRTC；显式的 `gateway-relay` 配置仍归 Gateway 网关拥有。请参阅 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会公布 `talk` 能力，并且可以声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；Gateway 网关默认允许受信任且支持 Talk 的节点使用这些按键通话命令。
- iOS 可能会暂停后台音频；当应用未处于活跃状态时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切到前台（canvas/camera/screen 命令需要它）。
- `A2UI_HOST_UNAVAILABLE`：内置的 A2UI 页面在应用 WebView 中不可访问；让应用保持在前台的 Screen 标签页，然后重试。
- 配对提示从未出现：运行 `openclaw devices list` 并手动批准。
- Watch 不显示 iPhone 状态：确认 iPhone 在 `watch.status` 中报告 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配对为 false，请在 Apple 的 Watch 应用中配对
  Watch。如果安装为 false，请从 **My Watch -> Available Apps** 安装配套应用。
  完成任一更改后，在 Watch 上打开一次 OpenClaw；即时可达仍要求两个应用都在运行，
  而排队的更新可以稍后在后台到达。
- 重新安装后重连失败：钥匙串中的配对令牌已清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关发现或画布命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-07-06T21:49:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae9061342b4f8a04afd1a7d2829b71ce9cd2bdd3b5124a54b9b6196b7ed755c3
    source_path: platforms/ios.md
    workflow: 16
---

可用性：启用某个发布版本时，iPhone app 构建会通过 Apple 渠道分发。本地开发构建也可以从源码运行。

## 它的功能

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 暴露节点能力：Canvas、屏幕快照、相机拍摄、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并上报节点状态事件。
- 从智能体界面（文件）以只读方式浏览所选智能体的工作区：目录下钻、带语法高亮的文本预览、图片预览和共享表单导出。不执行写入操作；预览大小由 Gateway 网关限制。
- 为每个已配对 Gateway 网关保留一个小型只读离线缓存，保存最近的聊天会话和转录：冷启动会立即绘制最后已知的转录，并在 Gateway 网关响应后刷新；断开连接时仍可浏览最近聊天；重置/忘记会清除受保护的本地缓存。
- 将断开连接时发送的文本消息排入每个 Gateway 网关的持久发件箱（最多 50 条）：排队的气泡会显示在转录中，重连后按顺序刷新并进行幂等重试，在规范历史确认发送前保持持久化，在显示重试/删除操作前使用退避重试，离线 48 小时后过期而不是发送；重置/忘记会随缓存一起清除队列。
- 按需朗读助手消息：在聊天中长按消息并选择 **收听**。app 会使用已配置的 TTS 提供商播放受支持的 Gateway 网关 `tts.speak` 片段，并在 Gateway 网关音频不可用或无法播放时回退到设备端语音。切换会话或进入后台时会停止播放。

## 要求

- Gateway 网关运行在另一台设备上（macOS、Linux，或通过 WSL2 的 Windows）。
- 网络路径：
  - 通过 Bonjour 在同一 LAN，**或**
  - 通过单播 DNS-SD 的 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动主机/端口（回退）。

## 快速开始（配对 + 连接）

1. 启动一个已认证的 Gateway 网关，并提供手机可访问的路由。Tailscale
   Serve 是推荐的远程路径：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于受信任的同一 LAN 设置，请改用已认证的 `gateway.bind: "lan"`。
默认的 loopback 绑定无法从手机访问。如果尚未配置
Gateway 网关，请先运行 `openclaw onboard`，以便设置代码
创建流程拥有令牌或密码认证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择 **节点**，然后在 **设备** 卡片中点击
   **配对移动设备**。

3. 在 iOS app 中，打开 **设置** -> **Gateway 网关**，扫描二维码（或粘贴
   设置代码），然后连接。

   如果设置代码同时包含 LAN 和 Tailscale Serve 路由，app
   会按顺序探测它们，并保存第一个可访问的端点。

4. 官方 app 会自动连接。如果 **设备** 显示待处理
   请求，请在批准前检查它的角色和权限范围。

Apple Watch 配套应用没有单独的 OpenClaw 配对批准。
请在 Apple 的 Watch app 中将 Watch 与 iPhone 配对，从
**Watch app -> 我的手表 -> 可用 App** 安装 OpenClaw，然后在两台
设备上各打开一次 OpenClaw。OpenClaw 会立即跟随 Apple Watch 的配对和安装变更；
Gateway 网关的设备批准覆盖 iPhone 节点。

Control UI 按钮需要已配对且拥有 `operator.admin` 的会话。
作为终端回退方式，请在 iOS app 中选择一个已发现的 Gateway 网关（或启用
手动主机并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 使用变更后的认证详情（角色/权限范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从严格受控的子网连接，你可以选择使用显式 CIDR 或精确 IP 开启首次节点自动批准：

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

默认禁用此功能。它只适用于未请求任何权限范围的新 `role: node` 配对。操作员/浏览器配对，以及任何角色、权限范围、元数据或公钥变更，仍然需要手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs 令牌发布到 Gateway 网关。来自公开发布通道的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`；此基础 URL 为 App Store 分发硬编码，不读取任何覆盖项。

自定义中继部署需要刻意分离的 iOS 构建/部署路径，其中继 URL 必须与 Gateway 网关中继 URL 匹配。App Store 发布通道从不接受自定义中继 URL。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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

- iOS app 使用 App Attest 和 StoreKit app 交易 JWS 向中继注册。
- 中继返回一个不透明的中继句柄，以及注册范围内的发送授权。
- iOS app 获取已配对 Gateway 网关身份（`gateway.identity.get`），并将其包含在中继注册中，因此中继支持的注册会委派给该特定 Gateway 网关。
- app 使用 `push.apns.register` 将该中继支持的注册转发给已配对 Gateway 网关。
- Gateway 网关将该已存储的中继句柄用于 `push.test`、后台唤醒和唤醒轻推。
- 如果 app 之后连接到不同的 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

此路径中 Gateway 网关**不**需要的内容：不需要部署级中继令牌，也不需要用于官方 App Store 中继支持发送的直接 APNs 密钥。

预期操作员流程：

1. 安装官方 iOS app。
2. 可选：仅在使用刻意分离的自定义中继构建时，在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将 app 与 Gateway 网关配对，并让它完成连接。
4. 一旦 app 拥有 APNs 令牌、操作员会话已连接且中继注册成功，它会发布一次 `push.apns.register`。
5. 之后，`push.test`、重连唤醒和唤醒轻推可以使用已存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或显著位置事件唤醒 app 时，app 会尝试进行一次短暂的节点重连，然后调用 `node.event` 并传入 `event: "node.presence.alive"`。Gateway 网关只有在已知经过认证的节点设备身份后，才会将其记录为已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

只有当 Gateway 网关响应包含 `handled: true` 时，app 才会将后台唤醒视为已成功记录。较旧的 Gateway 网关可能会用 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不会计为持久的最后可见时间更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖项使用（`gateway.push.apns.relay.baseUrl` 是配置优先路径）。
- App Store 发布构建的推送模式会硬编码托管中继主机，并且从不读取中继 URL 覆盖项 —— `OPENCLAW_PUSH_RELAY_BASE_URL` 构建时环境变量只影响本地/沙箱 iOS 构建模式。

## 认证和信任流程

中继的存在是为了强制执行两个约束，而直接在 Gateway 网关上使用 APNs 无法为官方 iOS 构建提供这些约束：

- 只有通过 Apple 分发的正版 OpenClaw iOS 构建可以使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`：app 通过正常的 Gateway 网关认证流程与 Gateway 网关配对，获得一个已认证的节点会话，以及一个已认证的操作员会话。操作员会话调用 `gateway.identity.get`。
2. `iOS app -> relay`：app 通过 HTTPS 调用中继注册端点，并提供 App Attest 证明和 StoreKit app 交易 JWS。中继验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求官方/生产分发路径 —— 这会阻止本地 Xcode/dev 构建使用托管中继，因为本地构建无法满足官方 Apple 分发证明。
3. `gateway identity delegation`：在中继注册前，app 从 `gateway.identity.get` 获取已配对 Gateway 网关身份，并将其包含在中继注册载荷中。中继返回一个中继句柄，以及委派给该 Gateway 网关身份的注册范围内发送授权。
4. `gateway -> relay`：Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。在 `push.test`、重连唤醒和唤醒轻推时，Gateway 网关用自己的设备身份签署发送请求；中继会同时验证已存储的发送授权，以及 Gateway 网关签名是否匹配注册时委派的 Gateway 网关身份。即使另一个 Gateway 网关以某种方式获得该句柄，也无法复用该已存储注册。
5. `relay -> APNs`：中继拥有官方构建的生产 APNs 凭证和原始 APNs 令牌。对于中继支持的官方构建，Gateway 网关从不存储原始 APNs 令牌；中继代表已配对 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：让生产 APNs 凭证远离用户 Gateway 网关，避免在 Gateway 网关上存储官方构建的原始 APNs 令牌，只允许官方 OpenClaw iOS 构建使用托管中继，并防止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍使用直接 APNs。如果你在不使用中继的情况下测试这些构建，Gateway 网关仍然需要直接 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储 App Store Connect 认证信息，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 投递。

推荐的 Gateway 网关主机存储方式，与 `~/.openclaw/credentials/` 下的其他提供商凭证保持一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件，也不要将其放在 repo checkout 下。

## 设备发现路径

### Bonjour（LAN）

iOS app 会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览同一个广域 DNS-SD 设备发现域。同一 LAN 的 Gateway 网关会自动从 `local.` 出现；跨网络设备发现可以使用已配置的广域域名，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：`openclaw.internal.`）和 Tailscale 分割 DNS。CoreDNS 示例见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中启用 **手动主机**，并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## 多个 Gateway 网关

app 会保留它已配对过的每个 Gateway 网关的注册表，因此你可以在它们之间切换而无需重新配对：

- **设置 -> Gateway 网关** 会显示 **已配对 Gateway 网关** 列表，并标记当前活动 Gateway 网关。点按条目即可切换；应用会关闭当前会话并重新连接到所选 Gateway 网关。当配对了多个 Gateway 网关时，连接行旁会出现快速切换菜单。
- 凭证、TLS 信任决策、按 Gateway 网关区分的偏好设置，以及缓存的聊天历史都会按 Gateway 网关存储。切换绝不会在 Gateway 网关之间混用状态，推送注册也会跟随当前活动 Gateway 网关。
- 滑动某个已配对 Gateway 网关（或使用其上下文菜单）选择 **忘记**，这会移除它的凭证、设备令牌、TLS pin 和缓存聊天。
- 发现到的 Gateway 网关必须在网络上可见，才能切换到它们；手动配置的 Gateway 网关会按保存的主机和端口重新连接。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas 主机会从 Gateway 网关 HTTP 服务器提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`（与 `gateway.port` 使用同一端口，默认 `18789`）。
- iOS 节点会将内置脚手架保留为已连接的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用内置的应用自有 A2UI 页面。
- 远程 Gateway 网关 A2UI 页面在 iOS 上仅用于渲染；原生 A2UI 按钮操作只接受来自内置应用自有页面的操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## Codex Computer Use 关系

iOS 应用是一个移动节点界面，不是 Codex Computer Use 后端。Codex Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令暴露 iPhone 能力，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍然可以通过调用节点命令，经由 OpenClaw 操作 iOS 应用，但这些调用会走 Gateway 网关节点协议，并遵循 iOS 前台/后台限制。使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use) 进行本地桌面控制；使用本页了解 iOS 节点能力。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在设置中使用。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI realtime Talk 使用客户端自有的 WebRTC；显式的 `gateway-relay` 配置仍由 Gateway 网关拥有。参见 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会通告 `talk` 能力，并且可以声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；Gateway 网关默认允许受信任且支持 Talk 的节点使用这些按键通话命令。
- iOS 可能会挂起后台音频；当应用未处于活动状态时，应将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切到前台（canvas/camera/screen 命令需要这样做）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 中无法访问内置 A2UI 页面；让应用保持在 Screen 标签页前台，然后重试。
- 配对提示一直不出现：运行 `openclaw devices list` 并手动批准。
- Watch 不显示 iPhone 状态：确认 iPhone 在 `watch.status` 中报告 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配对为 false，请在 Apple 的 Watch 应用中配对
  Watch。如果安装为 false，请从 **My Watch -> Available Apps** 安装配套应用。
  任一变更完成后，在 Watch 上打开一次 OpenClaw；即时可达性仍然要求两个应用都在运行，
  而排队的更新可以稍后在后台到达。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

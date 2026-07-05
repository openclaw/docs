---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-07-05T17:42:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44e1f065bedeca67fcbb11d9666865cebfb2a7636f8eeeb2216d90a72c29e0b6
    source_path: platforms/ios.md
    workflow: 16
---

可用性：启用某个发布版本时，iPhone app 构建会通过 Apple 渠道分发。本地开发构建也可以从源码运行。

## 它的作用

- 通过 WebSocket（LAN 或 tailnet）连接到 Gateway 网关。
- 暴露节点能力：Canvas、屏幕快照、相机拍摄、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并报告节点状态事件。

## 要求

- Gateway 网关在另一台设备上运行（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 使用同一 LAN，**或**
  - 通过单播 DNS-SD 使用 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动主机/端口（回退）。

## 快速开始（配对 + 连接）

1. 启动一个经过身份验证的 Gateway 网关，并提供手机可访问的路由。推荐的远程路径是 Tailscale
   Serve：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于受信任的同一 LAN 设置，请改用经过身份验证的 `gateway.bind: "lan"`。
默认的 loopback 绑定无法从手机访问。如果
Gateway 网关尚未配置，请先运行 `openclaw onboard`，这样设置代码
创建时会有令牌或密码身份验证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择**节点**，然后在**设备**卡片中点击
   **配对移动设备**。

3. 在 iOS app 中，打开**设置** -> **Gateway 网关**，扫描二维码（或粘贴
   设置代码），然后连接。

   如果设置代码同时包含 LAN 和 Tailscale Serve 路由，app
   会按顺序探测它们，并保存第一个可访问的端点。

4. 官方 app 会自动连接。如果**设备**显示待处理
   请求，请在批准前检查它的角色和权限范围。

Control UI 按钮需要一个已经配对且具有 `operator.admin` 的会话。
作为终端回退方式，请在 iOS app 中选择一个已发现的 Gateway 网关（或启用
手动主机并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果 app 使用变更后的身份验证详情（角色/权限范围/公钥）重试配对，之前的待处理请求会被取代，并创建新的 `requestId`。批准前请再次运行 `openclaw devices list`。

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

默认情况下此功能处于禁用状态。它只适用于没有请求权限范围的新 `role: node` 配对。操作员/浏览器配对，以及任何角色、权限范围、元数据或公钥变更，仍然需要手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs 令牌发布到 Gateway 网关。来自公开发布通道的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`；此基础 URL 是为 App Store 分发硬编码的，不读取任何覆盖项。

自定义中继部署需要有意独立的 iOS 构建/部署路径，其中继 URL 必须与 Gateway 网关中继 URL 匹配。App Store 发布通道从不接受自定义中继 URL。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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

流程的工作方式：

- iOS app 使用 App Attest 和 StoreKit app transaction JWS 向中继注册。
- 中继返回一个不透明的中继句柄以及注册范围内的发送授权。
- iOS app 获取已配对的 Gateway 网关身份（`gateway.identity.get`），并在中继注册中包含它，因此由中继支持的注册会委托给该特定 Gateway 网关。
- app 使用 `push.apns.register` 将该中继支持的注册转发到已配对的 Gateway 网关。
- Gateway 网关将存储的中继句柄用于 `push.test`、后台唤醒和唤醒提示。
- 如果 app 后续连接到其他 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

此路径下 Gateway 网关**不**需要的内容：不需要部署级中继令牌，也不需要用于官方 App Store 中继支持发送的直接 APNs 密钥。

预期的操作员流程：

1. 安装官方 iOS app。
2. 可选：仅在使用有意独立的自定义中继构建时，在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将 app 与 Gateway 网关配对，并让它完成连接。
4. 一旦 app 拥有 APNs 令牌、操作员会话已连接且中继注册成功，它就会发布 `push.apns.register`。
5. 之后，`push.test`、重新连接唤醒和唤醒提示可以使用存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或重要位置事件唤醒 app 时，app 会尝试一次短暂的节点重新连接，然后调用 `node.event`，并携带 `event: "node.presence.alive"`。只有在已知经过身份验证的节点设备身份后，Gateway 网关才会将其记录为已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

只有当 Gateway 网关响应包含 `handled: true` 时，app 才会将后台唤醒视为已成功记录。较旧的 Gateway 网关可能会以 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不计为持久的上次可见更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖项使用（`gateway.push.apns.relay.baseUrl` 是配置优先路径）。
- App Store 发布构建的推送模式硬编码托管中继主机，并且从不读取中继 URL 覆盖项 — `OPENCLAW_PUSH_RELAY_BASE_URL` 构建时环境变量只影响本地/沙箱 iOS 构建模式。

## 身份验证和信任流程

中继的存在是为了强制执行直接在 Gateway 网关上使用 APNs 无法为官方 iOS 构建提供的两个约束：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建可以使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`：app 通过正常的 Gateway 网关身份验证流程与 Gateway 网关配对，获得经过身份验证的节点会话以及经过身份验证的操作员会话。操作员会话调用 `gateway.identity.get`。
2. `iOS app -> relay`：app 通过 HTTPS 调用中继注册端点，并提供 App Attest 证明以及 StoreKit app transaction JWS。中继会验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求官方/生产分发路径 — 这会阻止本地 Xcode/开发构建使用托管中继，因为本地构建无法满足官方 Apple 分发证明。
3. `gateway identity delegation`：在中继注册前，app 从 `gateway.identity.get` 获取已配对的 Gateway 网关身份，并将其包含在中继注册载荷中。中继返回一个中继句柄以及委托给该 Gateway 网关身份的注册范围发送授权。
4. `gateway -> relay`：Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。在 `push.test`、重新连接唤醒和唤醒提示时，Gateway 网关使用自己的设备身份对发送请求签名；中继会根据注册时委托的 Gateway 网关身份，验证存储的发送授权和 Gateway 网关签名。其他 Gateway 网关无法复用该存储的注册，即使它以某种方式获得了句柄。
5. `relay -> APNs`：中继拥有生产 APNs 凭据以及官方构建的原始 APNs 令牌。对于中继支持的官方构建，Gateway 网关从不存储原始 APNs 令牌；中继代表已配对的 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：让生产 APNs 凭据不进入用户的 Gateway 网关，避免在 Gateway 网关上存储官方构建的原始 APNs 令牌，只允许官方 OpenClaw iOS 构建使用托管中继，并阻止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍然使用直接 APNs。如果你在不使用中继的情况下测试这些构建，Gateway 网关仍需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储 App Store Connect 身份验证信息，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 投递。

推荐的 Gateway 网关主机存储方式，与 `~/.openclaw/credentials/` 下的其他提供商凭据保持一致：

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

iOS app 会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览同一个广域 DNS-SD 设备发现域。同一 LAN 上的 Gateway 网关会自动从 `local.` 出现；跨网络设备发现可以使用配置的广域域名，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：`openclaw.internal.`）和 Tailscale split DNS。CoreDNS 示例请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中，启用**手动主机**并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas 主机从 Gateway 网关 HTTP 服务器（与 `gateway.port` 相同的端口，默认 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 节点将内置脚手架保留为连接后的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用内置的 app 自有 A2UI 页面。
- 远程 Gateway 网关 A2UI 页面在 iOS 上仅用于渲染；原生 A2UI 按钮操作只接受来自内置 app 自有页面的操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## 与 Computer Use 的关系

iOS app 是移动节点表面，不是 Codex Computer Use 后端。Codex Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS app 通过 OpenClaw 节点命令暴露 iPhone 能力，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍可通过调用节点命令，经由 OpenClaw 操作 iOS app，但这些调用会经过 Gateway 网关节点协议，并遵循 iOS 前台/后台限制。本地桌面控制请使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)，iOS 节点能力请参考此页面。

### Canvas eval / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在设置中使用。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI realtime Talk 使用客户端拥有的 WebRTC；显式的 `gateway-relay` 配置仍由 Gateway 网关拥有。请参阅 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会公布 `talk` 能力，并可声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；Gateway 网关默认允许受信任且支持 Talk 的节点使用这些按住说话命令。
- iOS 可能会挂起后台音频；当应用未处于活跃状态时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切到前台（画布/相机/屏幕命令需要这样做）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 中无法访问内置的 A2UI 页面；让应用在屏幕标签页保持前台状态，然后重试。
- 配对提示从未出现：运行 `openclaw devices list` 并手动批准。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

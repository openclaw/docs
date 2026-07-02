---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源码运行 iOS 应用
    - 调试 Gateway 网关发现或画布命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-07-02T22:22:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

可用性：iPhone 应用构建在为某个发布启用时会通过 Apple 渠道分发。本地开发构建也可以从源码运行。

## 它的作用

- 通过 WebSocket（LAN 或 tailnet）连接到 Gateway 网关。
- 暴露节点能力：画布、屏幕快照、相机拍摄、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并上报节点状态事件。

## 要求

- Gateway 网关在另一台设备上运行（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 使用同一 LAN，**或**
  - 通过单播 DNS-SD 使用 Tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动主机/端口（回退）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开设置并选择一个已发现的 Gateway 网关（或启用手动主机并输入主机/端口）。

3. 在 Gateway 网关主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用已更改的凭证详情（角色/作用域/公钥）重试配对，
之前待处理的请求会被取代，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从严格受控的子网连接，你
可以通过显式 CIDR 或精确 IP 选择启用首次节点自动批准：

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

默认禁用此功能。它仅适用于没有请求作用域的全新 `role: node` 配对。
Operator/browser 配对，以及任何角色、作用域、元数据或
公钥更改仍需要手动批准。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs
令牌发布到 Gateway 网关。

来自公开发布通道的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`。

自定义中继部署需要刻意独立的 iOS 构建/部署路径，其 中继 URL 必须与 Gateway 网关中继 URL 匹配。公开 App Store 发布通道不接受自定义中继 URL 覆盖。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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

- iOS 应用使用 App Attest 和 StoreKit 应用交易 JWS 向中继注册。
- 中继返回一个不透明的中继句柄，以及一个注册作用域的发送授权。
- iOS 应用获取已配对的 Gateway 网关身份，并在中继注册中包含该身份，因此由中继支持的注册会委托给该特定 Gateway 网关。
- 应用使用 `push.apns.register` 将该中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关使用存储的中继句柄处理 `push.test`、后台唤醒和唤醒提醒。
- 自定义 Gateway 网关中继 URL 必须与内置到 iOS 构建中的中继 URL 匹配。
- 如果应用之后连接到其他 Gateway 网关，或连接到中继基准 URL 不同的构建，它会刷新中继注册，而不是复用旧绑定。

此路径下 Gateway 网关**不**需要的内容：

- 不需要部署范围的中继令牌。
- 不需要用于官方 App Store 中继支持发送的直接 APNs 密钥。

预期的操作员流程：

1. 安装官方 iOS 应用。
2. 可选：仅在使用刻意独立的自定义中继构建时，在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并让它完成连接。
4. 应用在拥有 APNs 令牌、operator 会话已连接且中继注册成功后，会自动发布 `push.apns.register`。
5. 之后，`push.test`、重新连接唤醒和唤醒提醒可以使用存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或重大位置事件唤醒应用时，应用
会尝试进行一次短暂的节点重连，然后调用 `node.event`，并带上 `event: "node.presence.alive"`。
Gateway 网关仅在已知经过认证的节点设备身份之后，才会将其作为
已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason` 记录下来。

只有当 Gateway 网关响应包含 `handled: true` 时，应用才会认为后台唤醒已成功记录。
较旧的 Gateway 网关可能会用 `{ "ok": true }` 确认 `node.event`；该响应
兼容，但不计为持久的最后可见时间更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖使用。
- 公开 App Store 发布通道会拒绝 iOS 构建中的 `OPENCLAW_PUSH_RELAY_BASE_URL`。

## 认证和信任流程

中继的存在是为了强制执行两个直接在 Gateway 网关上使用 APNs 无法为
官方 iOS 构建提供的约束：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定
  Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过普通 Gateway 网关认证流程与 Gateway 网关配对。
   - 这会给应用一个经过认证的节点会话，以及一个经过认证的 operator 会话。
   - operator 会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明以及 StoreKit 应用交易 JWS。
   - 中继会验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求
     官方/生产分发路径。
   - 这会阻止本地 Xcode/dev 构建使用托管中继。本地构建可能已签名，
     但它不满足中继预期的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用会从
     `gateway.identity.get` 获取已配对的 Gateway 网关身份。
   - 应用会在中继注册载荷中包含该 Gateway 网关身份。
   - 中继返回一个中继句柄和一个注册作用域的发送授权，这些内容会委托给
     该 Gateway 网关身份。

4. `gateway -> relay`
   - Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。
   - 在 `push.test`、重新连接唤醒和唤醒提醒时，Gateway 网关使用自己的
     设备身份签名发送请求。
   - 中继会根据注册时委托的
     Gateway 网关身份验证已存储的发送授权和 Gateway 网关签名。
   - 即使另一个 Gateway 网关以某种方式获得句柄，也无法复用该存储的注册。

5. `relay -> APNs`
   - 中继拥有生产 APNs 凭证，以及官方构建的原始 APNs 令牌。
   - 对于中继支持的官方构建，Gateway 网关从不存储原始 APNs 令牌。
   - 中继代表已配对的 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：

- 将生产 APNs 凭证保留在用户 Gateway 网关之外。
- 避免在 Gateway 网关上存储官方构建的原始 APNs 令牌。
- 仅允许官方 OpenClaw iOS 构建使用托管中继。
- 防止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍然使用直接 APNs。如果你在没有中继的情况下测试这些构建，
Gateway 网关仍需要直接 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储
App Store Connect 认证，例如 `APP_STORE_CONNECT_KEY_ID` 和
`APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 投递。

推荐的 Gateway 网关主机存储方式：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件，也不要将其放在仓库检出目录下。

## 设备发现路径

### Bonjour（LAN）

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览相同的
广域 DNS-SD 设备发现域。同一 LAN 上的 Gateway 网关会自动从 `local.` 出现；
跨网络设备发现可以使用配置的广域域，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：
`openclaw.internal.`）和 Tailscale 拆分 DNS。
CoreDNS 示例见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中，启用**手动主机**并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## 画布 + A2UI

iOS 节点渲染 WKWebView 画布。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关画布主机提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供服务（与 `gateway.port` 相同端口，默认 `18789`）。
- iOS 节点将内置脚手架保留为已连接的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用内置的应用所有 A2UI 页面。
- 远程 Gateway 网关 A2UI 页面在 iOS 上仅用于渲染；原生 A2UI 按钮操作只接受来自内置应用所有页面的操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## Computer Use 关系

iOS 应用是移动节点表面，而不是 Codex Computer Use 后端。Codex
Computer Use 和 `cua-driver mcp` 通过 MCP
工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令暴露 iPhone 能力，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍然可以通过调用节点
命令，经由 OpenClaw 操作 iOS 应用，但这些调用会通过 Gateway 网关节点协议，并遵循 iOS
前台/后台限制。使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
进行本地桌面控制；使用本页了解 iOS 节点能力。

### 画布求值 / 快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在设置中使用。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI 实时 Talk 使用客户端拥有的 WebRTC；显式 `gateway-relay` 配置仍归 Gateway 网关所有。参见 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会宣告 `talk` 能力，并可以声明
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  Gateway 网关默认允许受信任且支持
  Talk 的节点使用这些按键通话命令。
- iOS 可能会暂停后台音频；当应用未激活时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（画布/相机/屏幕命令需要它）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 中无法访问内置 A2UI 页面；让应用在屏幕标签页保持前台并重试。
- 配对提示从未出现：运行 `openclaw devices list` 并手动批准。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

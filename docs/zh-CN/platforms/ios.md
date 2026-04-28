---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、canvas 和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-04-28T00:47:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41d96525ff38ab19b5fdd622da954d4b2bdd66380230fc8db7a811b2865dd446
    source_path: platforms/ios.md
    workflow: 15
---

可用性：内部预览。iOS 应用尚未公开分发。

## 它的作用

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 暴露节点能力：Canvas、屏幕快照、相机捕获、位置、通话模式、语音唤醒。
- 接收 `node.invoke` 命令并上报节点状态事件。

## 要求

- 在另一台设备上运行的 Gateway 网关（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 处于同一 LAN，**或**
  - 通过单播 DNS-SD 处于 tailnet 中（示例域名：`openclaw.internal.`），**或**
  - 手动填写主机/端口（回退方式）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开“设置”并选择一个已发现的 Gateway 网关（或启用“手动主机”并输入主机/端口）。

3. 在 Gateway 网关所在主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用在认证详情发生变化后（角色/作用域/公钥）重试配对，
之前待处理的请求会被替换，并创建一个新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从受严格控制的子网连接，
你可以选择启用首次节点自动批准，并明确指定 CIDR 或精确 IP：

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

此功能默认禁用。它仅适用于全新的 `role: node` 配对，且
没有请求任何作用域。operator/browser 配对，以及任何角色、作用域、元数据或
公钥变更，仍然需要手动批准。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建版本的中继支持推送

官方分发的 iOS 构建版本使用外部推送中继，而不是将原始 APNs
令牌直接发布到 Gateway 网关。

Gateway 网关侧要求：

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
- 中继返回一个不透明的中继句柄以及一个注册范围的发送授权。
- iOS 应用获取已配对的 Gateway 网关身份，并将其包含在中继注册中，因此该中继支持的注册会委托给这个特定的 Gateway 网关。
- 应用通过 `push.apns.register` 将这个中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关将该已存储的中继句柄用于 `push.test`、后台唤醒和唤醒提示。
- Gateway 网关的中继基础 URL 必须与官方/TestFlight iOS 构建中内置的中继 URL 一致。
- 如果应用稍后连接到不同的 Gateway 网关，或连接到使用不同中继基础 URL 的构建版本，它会刷新中继注册，而不是复用旧绑定。

对于这一路径，Gateway 网关**不**需要：

- 不需要部署范围的中继令牌。
- 官方/TestFlight 中继支持发送不需要直接 APNs 密钥。

预期的操作员流程：

1. 安装官方/TestFlight iOS 构建版本。
2. 在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并让它完成连接。
4. 应用在获得 APNs 令牌、operator 会话已连接且中继注册成功后，会自动发布 `push.apns.register`。
5. 此后，`push.test`、重连唤醒和唤醒提示都可以使用这个已存储的中继支持注册。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖项使用。

## 认证与信任流程

设置中继是为了强制执行两个约束，这些约束是 Gateway 网关直接连接 APNs 无法为
官方 iOS 构建版本提供的：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建版本才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过正常的 Gateway 网关认证流程与 Gateway 网关配对。
   - 这会给应用一个已认证的节点会话以及一个已认证的 operator 会话。
   - operator 会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明以及 StoreKit 应用交易 JWS。
   - 中继会验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求使用
     official/production 分发路径。
   - 这就是为什么本地 Xcode/dev 构建无法使用托管中继。本地构建也许已经
     签名，但它不满足中继所要求的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用会通过
     `gateway.identity.get` 获取已配对的 Gateway 网关身份。
   - 应用会将该 Gateway 网关身份包含在中继注册负载中。
   - 中继返回一个中继句柄和一个注册范围的发送授权，这两者都被委托给
     该 Gateway 网关身份。

4. `gateway -> relay`
   - Gateway 网关会存储来自 `push.apns.register` 的中继句柄和发送授权。
   - 在执行 `push.test`、重连唤醒和唤醒提示时，Gateway 网关会使用其
     自身设备身份对发送请求签名。
   - 中继会依据注册时委托的 Gateway 网关身份，同时验证已存储的发送授权和 Gateway 网关签名。
   - 另一台 Gateway 网关即使设法获得了该句柄，也无法复用这份已存储注册。

5. `relay -> APNs`
   - 中继持有用于官方构建版本的生产 APNs 凭证和原始 APNs 令牌。
   - 对于由中继支持的官方构建版本，Gateway 网关绝不会存储原始 APNs 令牌。
   - 中继代表已配对的 Gateway 网关将最终推送发送到 APNs。

创建此设计的原因：

- 让生产 APNs 凭证不进入用户的 Gateway 网关。
- 避免在 Gateway 网关上存储官方构建版本的原始 APNs 令牌。
- 只允许官方/TestFlight OpenClaw 构建版本使用托管中继。
- 防止一台 Gateway 网关向属于另一台 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍然使用直接 APNs。如果你在没有中继的情况下测试这些构建版本，
Gateway 网关仍然需要直接 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 仅存储
App Store Connect / TestFlight 认证信息，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不会配置
本地 iOS 构建的直接 APNs 传递。

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

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览同一个
广域 DNS-SD 设备发现域。同一 LAN 上的 Gateway 网关会自动从 `local.` 显示出来；
跨网络设备发现可以使用配置好的广域域名，而无需更改 beacon 类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：
`openclaw.internal.`）和 Tailscale split DNS。
CoreDNS 示例请参见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在“设置”中，启用**手动主机**并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 来驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas 主机会提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 使用相同端口，默认 `18789`）。
- 当广播了 canvas 主机 URL 时，iOS 节点会在连接后自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 可以返回内置脚手架。

## 与 Computer Use 的关系

iOS 应用是移动节点界面，不是 Codex Computer Use 后端。Codex
Computer Use 和 `cua-driver mcp` 通过 MCP
工具控制本地 macOS 桌面；iOS 应用则通过 OpenClaw 节点命令暴露 iPhone 能力，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍然可以通过调用节点
命令来经由 OpenClaw 操作 iOS 应用，但这些调用会经过 Gateway 网关节点协议，并遵循 iOS
前台/后台限制。使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
进行本地桌面控制，而本页用于了解 iOS 节点能力。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + 通话模式

- 语音唤醒和通话模式可在“设置”中使用。
- iOS 可能会挂起后台音频；当应用未处于活动状态时，语音功能应视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（canvas/camera/screen 命令需要前台）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 网关未广播 canvas 主机 URL；请检查 [Gateway configuration](/zh-CN/gateway/configuration) 中的 `canvasHost`。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- 重装后重连失败：Keychain 配对令牌已被清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

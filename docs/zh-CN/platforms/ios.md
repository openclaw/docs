---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关设备发现或画布命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-05-06T01:52:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

可用性：内部预览版。iOS 应用尚未公开分发。

## 作用

- 通过 WebSocket（LAN 或 tailnet）连接到 Gateway 网关。
- 暴露节点能力：Canvas、Screen snapshot、Camera capture、Location、Talk 模式、Voice wake。
- 接收 `node.invoke` 命令并上报节点状态事件。

## 要求

- Gateway 网关在另一台设备上运行（macOS、Linux，或通过 WSL2 运行 Windows）。
- 网络路径：
  - 通过 Bonjour 使用同一 LAN，**或**
  - 通过单播 DNS-SD 使用 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动主机/端口（备用）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中打开设置，然后选择一个已发现的 Gateway 网关（或启用 Manual Host 并输入主机/端口）。

3. 在 Gateway 网关主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用变更后的认证详情（角色/作用域/公钥）重试配对，
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

默认禁用此功能。它仅适用于全新的 `role: node` 配对，且
不请求任何作用域。操作员/浏览器配对，以及任何角色、作用域、元数据或
公钥变更，仍需要手动批准。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs
令牌发布给 Gateway 网关。

Gateway 网关端要求：

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
- iOS 应用获取已配对的 Gateway 网关身份，并将其包含在中继注册中，因此中继支持的注册会委托给该特定 Gateway 网关。
- 应用通过 `push.apns.register` 将该中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关将这个存储的中继句柄用于 `push.test`、后台唤醒和唤醒提示。
- Gateway 网关中继基础 URL 必须与官方/TestFlight iOS 构建内置的中继 URL 匹配。
- 如果应用之后连接到其他 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

此路径下 Gateway 网关**不**需要：

- 不需要部署级中继令牌。
- 不需要用于官方/TestFlight 中继支持发送的直接 APNs 密钥。

预期操作员流程：

1. 安装官方/TestFlight iOS 构建。
2. 在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并等待它完成连接。
4. 应用在获得 APNs 令牌、操作员会话已连接且中继注册成功后，会自动发布 `push.apns.register`。
5. 之后，`push.test`、重连唤醒和唤醒提示可以使用存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或重要位置事件唤醒应用时，应用
会尝试一次短暂的节点重连，然后调用 `node.event`，并传入 `event: "node.presence.alive"`。
Gateway 网关只有在已知经过认证的节点设备身份之后，才会把这记录为已配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

应用只有在 Gateway 网关响应包含
`handled: true` 时，才会认为后台唤醒已成功记录。较旧的 Gateway 网关可能会用 `{ "ok": true }` 确认 `node.event`；该响应
兼容，但不算作持久的最近可见更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境覆盖使用。

## 认证和信任流程

中继的存在是为了强制执行直接在 Gateway 网关上使用 APNs 无法为
官方 iOS 构建提供的两个约束：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建可以使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过常规 Gateway 网关认证流程与 Gateway 网关配对。
   - 这会给应用一个经过认证的节点会话，以及一个经过认证的操作员会话。
   - 操作员会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明和 StoreKit 应用交易 JWS。
   - 中继验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求
     官方/生产分发路径。
   - 这会阻止本地 Xcode/开发构建使用托管中继。本地构建可能已
     签名，但它不满足中继预期的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用从
     `gateway.identity.get` 获取已配对的 Gateway 网关身份。
   - 应用在中继注册载荷中包含该 Gateway 网关身份。
   - 中继返回一个中继句柄，以及一个注册作用域的发送授权，并将它们委托给
     该 Gateway 网关身份。

4. `gateway -> relay`
   - Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。
   - 在 `push.test`、重连唤醒和唤醒提示时，Gateway 网关用自己的
     设备身份签署发送请求。
   - 中继会根据注册时委托的
     Gateway 网关身份验证已存储的发送授权和 Gateway 网关签名。
   - 另一个 Gateway 网关无法复用该已存储的注册，即使它以某种方式获得了句柄。

5. `relay -> APNs`
   - 中继拥有生产 APNs 凭据和官方构建的原始 APNs 令牌。
   - 对于中继支持的官方构建，Gateway 网关从不存储原始 APNs 令牌。
   - 中继代表已配对的 Gateway 网关将最终推送发送到 APNs。

创建此设计的原因：

- 让生产 APNs 凭据不进入用户的 Gateway 网关。
- 避免在 Gateway 网关上存储官方构建的原始 APNs 令牌。
- 只允许官方/TestFlight OpenClaw 构建使用托管中继。
- 防止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍使用直接 APNs。如果你在不使用中继的情况下测试这些构建，
Gateway 网关仍需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，而不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储
App Store Connect / TestFlight 认证信息，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不会为本地 iOS 构建配置
直接 APNs 投递。

推荐的 Gateway 网关主机存储方式：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件，也不要把它放在仓库检出目录下。

## 设备发现路径

### Bonjour（LAN）

iOS 应用在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览相同的
广域 DNS-SD 设备发现域。同一 LAN 的 Gateway 网关会自动从 `local.` 出现；
跨网络设备发现可以使用已配置的广域域，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：
`openclaw.internal.`）和 Tailscale split DNS。
有关 CoreDNS 示例，请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中，启用 **Manual Host** 并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点渲染 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas 主机提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供服务（与 `gateway.port` 使用同一端口，默认 `18789`）。
- 当连接时收到已发布的 canvas 主机 URL，iOS 节点会自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## 与 Computer Use 的关系

iOS 应用是一个移动节点表面，而不是 Codex Computer Use 后端。Codex
Computer Use 和 `cua-driver mcp` 通过 MCP
工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令暴露 iPhone 能力，
例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍可通过调用节点
命令经由 OpenClaw 操作 iOS 应用，但这些调用会经过 Gateway 网关节点协议，并遵循 iOS
前台/后台限制。使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
进行本地桌面控制，并使用本页了解 iOS 节点能力。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk 模式

- Voice wake 和 Talk 模式可在设置中使用。
- 支持 Talk 的 iOS 节点会发布 `talk` 能力，并可以声明
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  Gateway 网关默认允许受信任且支持
  Talk 的节点使用这些一键通命令。
- iOS 可能会挂起后台音频；当应用未处于活跃状态时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切到前台（canvas/camera/screen 命令需要前台）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 网关未发布 canvas 主机 URL；检查 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `canvasHost`。
- 配对提示从未出现：运行 `openclaw devices list` 并手动批准。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

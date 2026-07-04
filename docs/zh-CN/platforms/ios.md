---
read_when:
    - 配对或重新连接 iOS 节点
    - 运行 iOS 应用源码
    - 调试 Gateway 网关发现或画布命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-07-04T17:49:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

可用性：启用某个发布版本时，iPhone 应用构建会通过 Apple 渠道分发。本地开发构建也可以从源代码运行。

## 它的作用

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 暴露节点能力：Canvas、Screen snapshot、Camera capture、Location、Talk 模式、Voice wake。
- 接收 `node.invoke` 命令并报告节点状态事件。

## 要求

- Gateway 网关在另一台设备上运行（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 使用同一 LAN，**或**
  - 通过单播 DNS-SD 使用 Tailnet（示例域：`openclaw.internal.`），**或**
  - 手动主机/端口（兜底）。

## 快速开始（配对 + 连接）

1. 启动一个已认证的 Gateway 网关，并配置手机可访问的路由。Tailscale
   Serve 是推荐的远程路径：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于受信任的同一 LAN 设置，请改用已认证的 `gateway.bind: "lan"`。
默认的 loopback 绑定无法从手机访问。如果尚未配置
Gateway 网关，请先运行 `openclaw onboard`，以便设置代码
创建有 token 或密码认证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择 **节点**，然后在 **设备** 卡片中点击
   **配对移动设备**。

3. 在 iOS 应用中，打开 **设置** → **Gateway 网关**，扫描二维码（或粘贴
   设置代码），然后连接。

4. 官方应用会自动连接。如果 **设备** 显示待处理
   请求，请在批准前检查其角色和作用域。

Control UI 按钮需要一个已经配对且具有 `operator.admin` 的会话。
作为终端兜底方案，请在 iOS 应用中选择一个已发现的 Gateway 网关（或启用
Manual Host 并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用已更改的认证详情（角色/作用域/公钥）重试配对，
之前的待处理请求会被取代，并创建新的 `requestId`。
批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从严格受控的子网连接，你
可以选择使用显式 CIDR 或精确 IP 启用首次节点自动批准：

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

默认情况下此功能禁用。它仅适用于没有请求作用域的全新 `role: node` 配对。Operator/浏览器配对以及任何角色、作用域、元数据或
公钥更改仍然需要手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs
token 发布到 Gateway 网关。

公共发布通道中的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`。

自定义中继部署需要一个有意分离的 iOS 构建/部署路径，其中继 URL 与 Gateway 网关中继 URL 匹配。公共 App Store 发布通道不接受自定义中继 URL 覆盖。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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

- iOS 应用使用 App Attest 和 StoreKit 应用交易 JWS 向中继注册。
- 中继返回一个不透明的中继句柄，以及一个限定于注册范围的发送授权。
- iOS 应用获取已配对的 Gateway 网关身份，并将其包含在中继注册中，因此由中继支持的注册会委托给该特定 Gateway 网关。
- 应用使用 `push.apns.register` 将该中继支持的注册转发到已配对的 Gateway 网关。
- Gateway 网关使用已存储的中继句柄处理 `push.test`、后台唤醒和唤醒提示。
- 自定义 Gateway 网关中继 URL 必须与内置到 iOS 构建中的中继 URL 匹配。
- 如果应用随后连接到不同的 Gateway 网关，或连接到具有不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

对于此路径，Gateway 网关**不**需要：

- 不需要部署范围的中继 token。
- 官方 App Store 中继支持发送不需要直接 APNs 密钥。

预期的操作员流程：

1. 安装官方 iOS 应用。
2. 可选：仅在使用有意分离的自定义中继构建时，在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并让它完成连接。
4. 应用在获得 APNs token、operator 会话已连接且中继注册成功后，会自动发布 `push.apns.register`。
5. 之后，`push.test`、重新连接唤醒和唤醒提示可以使用已存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或显著位置事件唤醒应用时，应用
会尝试短暂重新连接节点，然后调用 `node.event`，并带上 `event: "node.presence.alive"`。
Gateway 网关仅在已知经过认证的节点设备身份后，才会在已配对的节点/设备元数据上
将其记录为 `lastSeenAtMs`/`lastSeenReason`。

只有当 Gateway 网关响应包含 `handled: true` 时，应用才会将后台唤醒视为已成功记录。
旧版 Gateway 网关可能用 `{ "ok": true }` 确认 `node.event`；该响应
兼容，但不算作持久的最后在线更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖使用。
- 公共 App Store 发布通道会拒绝用于 iOS 构建的 `OPENCLAW_PUSH_RELAY_BASE_URL`。

## 认证和信任流程

中继的存在是为了强制执行直接在 Gateway 网关上使用 APNs 无法为
官方 iOS 构建提供的两个约束：

- 只有通过 Apple 分发的正版 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定
  Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过正常的 Gateway 网关认证流程与 Gateway 网关配对。
   - 这会给应用一个已认证的节点会话以及一个已认证的 operator 会话。
   - operator 会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明以及 StoreKit 应用交易 JWS。
   - 中继验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求
     官方/生产分发路径。
   - 这会阻止本地 Xcode/dev 构建使用托管中继。本地构建可以被
     签名，但它不满足中继预期的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用从
     `gateway.identity.get` 获取已配对的 Gateway 网关身份。
   - 应用在中继注册载荷中包含该 Gateway 网关身份。
   - 中继返回一个中继句柄和一个限定于注册范围的发送授权，它们被委托给
     该 Gateway 网关身份。

4. `gateway -> relay`
   - Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。
   - 在 `push.test`、重新连接唤醒和唤醒提示时，Gateway 网关使用其
     自身设备身份对发送请求签名。
   - 中继根据注册中委托的
     Gateway 网关身份，验证已存储的发送授权和 Gateway 网关签名。
   - 其他 Gateway 网关无法复用该已存储注册，即使它以某种方式获得了该句柄。

5. `relay -> APNs`
   - 中继拥有生产 APNs 凭据以及官方构建的原始 APNs token。
   - 对于中继支持的官方构建，Gateway 网关从不存储原始 APNs token。
   - 中继代表已配对的 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：

- 将生产 APNs 凭据留在用户 Gateway 网关之外。
- 避免在 Gateway 网关上存储官方构建的原始 APNs token。
- 仅允许官方 OpenClaw iOS 构建使用托管中继。
- 防止一个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍使用直接 APNs。如果你在没有中继的情况下测试这些构建，
Gateway 网关仍需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储
App Store Connect 认证，例如 `APP_STORE_CONNECT_KEY_ID` 和
`APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 交付。

推荐的 Gateway 网关主机存储：

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

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览同一个
广域 DNS-SD 设备发现域。同一 LAN 的 Gateway 网关会自动从 `local.` 显示；
跨网络设备发现可以使用已配置的广域域，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域；示例：
`openclaw.internal.`）和 Tailscale split DNS。
请参阅 [Bonjour](/zh-CN/gateway/bonjour) 了解 CoreDNS 示例。

### 手动主机/端口

在设置中启用 **Manual Host**，并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点渲染一个 WKWebView Canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 Canvas 主机提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 相同端口，默认 `18789`）。
- iOS 节点将内置脚手架保留为连接后的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用内置的应用自有 A2UI 页面。
- 远程 Gateway 网关 A2UI 页面在 iOS 上仅可渲染；原生 A2UI 按钮操作仅接受来自内置应用自有页面的操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## Computer Use 关系

iOS 应用是移动节点界面，不是 Codex Computer Use 后端。Codex
Computer Use 和 `cua-driver mcp` 通过 MCP
工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令
暴露 iPhone 能力，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍可通过 OpenClaw 调用节点
命令来操作 iOS 应用，但这些调用会经过 Gateway 网关节点协议，并遵循 iOS
前台/后台限制。请使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)
进行本地桌面控制，并使用本页了解 iOS 节点能力。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk 模式

- 语音唤醒和 Talk 模式可在设置中使用。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI 实时 Talk 使用客户端拥有的 WebRTC；显式的 `gateway-relay` 配置仍由 Gateway 网关拥有。参见 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会通告 `talk` 能力，并可以声明
  `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；
  Gateway 网关默认允许受信任且支持 Talk 的节点使用这些按键通话命令。
- iOS 可能会暂停后台音频；当应用未处于活动状态时，应将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切到前台（画布、相机、屏幕命令需要这样做）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 中无法访问内置的 A2UI 页面；让应用在“屏幕”标签页保持前台，然后重试。
- 配对提示从不出现：运行 `openclaw devices list` 并手动批准。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

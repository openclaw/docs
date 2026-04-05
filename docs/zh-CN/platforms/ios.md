---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源码运行 iOS 应用
    - 调试 gateway 发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、canvas 和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-04-05T08:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e9d9cec58afd4003dff81d3e367bfbc6a634c1b229e433e08fd78fbb5f2e5a9
    source_path: platforms/ios.md
    workflow: 15
---

# iOS 应用（节点）

可用性：内部预览。iOS 应用尚未公开发布。

## 它的作用

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 提供节点能力：Canvas、屏幕快照、摄像头捕获、位置、对话模式、语音唤醒。
- 接收 `node.invoke` 命令并上报节点状态事件。

## 要求

- 在另一台设备上运行的 Gateway 网关（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 处于同一 LAN，**或**
  - 通过单播 DNS-SD 的 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动输入主机 / 端口（回退方案）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开设置并选择一个已发现的 gateway，或者启用 Manual Host 并输入主机 / 端口。

3. 在 gateway 主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用在认证详情（角色 / scopes / 公钥）变更后重试配对，
之前处于待处理状态的请求会被替换，并创建新的 `requestId`。
请在批准前再次运行 `openclaw devices list`。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的基于中继的推送

官方发布的 iOS 构建使用外部推送中继，而不是将原始 APNs
令牌直接发布到 gateway。

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

流程工作方式如下：

- iOS 应用使用 App Attest 和应用回执向中继注册。
- 中继返回一个不透明的 relay handle，以及一个按注册范围限定的发送授权。
- iOS 应用会获取已配对 gateway 的身份，并将其包含在中继注册中，因此该基于中继的注册会委托给那个特定的 gateway。
- 应用会通过 `push.apns.register` 将该基于中继的注册转发给已配对的 gateway。
- gateway 会将该已存储的 relay handle 用于 `push.test`、后台唤醒和唤醒提醒。
- gateway 的中继 base URL 必须与官方 / TestFlight iOS 构建中内置的中继 URL 一致。
- 如果应用之后连接到不同的 gateway，或者连接到内置了不同中继 base URL 的构建，它会刷新中继注册，而不是复用旧绑定。

对于此路径，gateway **不**需要的内容：

- 不需要部署范围的中继令牌。
- 对于官方 / TestFlight 的基于中继发送，不需要直接的 APNs 密钥。

预期的运维流程：

1. 安装官方 / TestFlight iOS 构建。
2. 在 gateway 上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 gateway 配对，并让它完成连接。
4. 在应用拿到 APNs 令牌、运维会话已连接且中继注册成功后，应用会自动发布 `push.apns.register`。
5. 之后，`push.test`、重连唤醒和唤醒提醒就可以使用已存储的基于中继的注册。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 gateway 的临时环境变量覆盖项使用。

## 认证与信任流程

中继的存在是为了强制执行两个约束，而这些约束是官方 iOS 构建在直接由 gateway 发送 APNs 时无法提供的：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建才能使用托管中继。
- gateway 只能向与该特定 gateway 配对的 iOS 设备发送基于中继的推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过常规 Gateway 网关认证流程与 gateway 配对。
   - 这会给应用一个已认证的节点会话，以及一个已认证的运维会话。
   - 运维会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明和应用回执。
   - 中继会验证 bundle ID、App Attest 证明和 Apple 回执，并要求使用官方 / 生产分发路径。
   - 这就是为什么本地 Xcode / 开发构建无法使用托管中继。本地构建可能是已签名的，但不满足中继所要求的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用会通过 `gateway.identity.get` 获取已配对 gateway 的身份。
   - 应用会在中继注册载荷中包含该 gateway 身份。
   - 中继返回一个 relay handle 和一个按注册范围限定的发送授权，并将其委托给该 gateway 身份。

4. `gateway -> relay`
   - gateway 会存储来自 `push.apns.register` 的 relay handle 和发送授权。
   - 在执行 `push.test`、重连唤醒和唤醒提醒时，gateway 会使用它自己的设备身份对发送请求进行签名。
   - 中继会根据注册时委托的 gateway 身份，验证已存储的发送授权以及 gateway 签名。
   - 即使另一个 gateway 以某种方式获得了该 handle，也无法复用这个已存储的注册。

5. `relay -> APNs`
   - 中继持有用于官方构建的生产 APNs 凭证和原始 APNs 令牌。
   - 对于基于中继的官方构建，gateway 永远不会存储原始 APNs 令牌。
   - 中继会代表已配对的 gateway 将最终推送发送到 APNs。

创建此设计的原因：

- 让生产 APNs 凭证不出现在用户的 gateway 中。
- 避免在 gateway 上存储官方构建的原始 APNs 令牌。
- 仅允许官方 / TestFlight OpenClaw 构建使用托管中继。
- 防止一个 gateway 向属于另一个 gateway 的 iOS 设备发送唤醒推送。

本地 / 手动构建仍然使用直接 APNs。如果你在不使用中继的情况下测试这些构建，
gateway 仍然需要直接 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

## 发现路径

### Bonjour（LAN）

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在已配置时浏览相同的
广域 DNS-SD 发现域。同一 LAN 上的 gateways 会自动通过 `local.` 出现；
跨网络发现可以使用已配置的广域域名，而无需更改 beacon 类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：
`openclaw.internal.`）和 Tailscale split DNS。
CoreDNS 示例请参见 [Bonjour](/gateway/bonjour)。

### 手动主机 / 端口

在设置中，启用 **Manual Host** 并输入 gateway 主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 来驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关的 canvas host 提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 相同的端口，默认 `18789`）。
- 当广播了 canvas host URL 时，iOS 节点会在连接时自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 可返回内置 scaffold。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + 对话模式

- 设置中提供语音唤醒和对话模式。
- iOS 可能会挂起后台音频；当应用未处于活动状态时，应将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：请将 iOS 应用切换到前台（canvas / camera / screen 命令需要它处于前台）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 网关未广播 canvas host URL；请检查 [Gateway 配置](/gateway/configuration) 中的 `canvasHost`。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- 重装后重连失败：Keychain 配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/channels/pairing)
- [设备发现](/gateway/discovery)
- [Bonjour](/gateway/bonjour)

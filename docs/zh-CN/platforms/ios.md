---
read_when:
    - 配对或重新连接 iOS 节点
    - 从源码运行 iOS 应用
    - 调试 Gateway 网关发现或 canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、canvas 和故障排除
title: iOS 应用
x-i18n:
    generated_at: "2026-04-25T05:54:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

可用性：内部预览。iOS 应用尚未公开分发。

## 功能说明

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 暴露节点能力：Canvas、屏幕快照、相机捕获、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并上报节点 Status 事件。

## 要求

- Gateway 网关运行在另一台设备上（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 处于同一 LAN，**或**
  - 通过单播 DNS-SD 处于 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动输入主机/端口（回退方案）。

## 快速开始（配对 + 连接）

1. 启动 Gateway 网关：

```bash
openclaw gateway --port 18789
```

2. 在 iOS 应用中，打开“设置”并选择一个已发现的网关（或启用“手动主机”并输入主机/端口）。

3. 在网关主机上批准配对请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用变更后的认证详情（角色/作用域/公钥）重试配对，
之前的待处理请求会被替换，并创建新的 `requestId`。
请在批准前再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从严格受控的子网连接，
你可以通过显式 CIDR 或精确 IP 选择启用首次节点自动批准：

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

此功能默认禁用。它仅适用于没有请求作用域的全新 `role: node` 配对。
运维人员/浏览器配对，以及任何角色、作用域、元数据或
公钥变更，仍然需要手动批准。

4. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 官方构建的中继支持推送

官方分发的 iOS 构建会使用外部推送中继，而不是将原始 APNs
令牌发布到网关。

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

- iOS 应用使用 App Attest 和应用回执向中继注册。
- 中继返回一个不透明的中继句柄以及一个注册作用域的发送授权。
- iOS 应用会获取已配对 Gateway 网关的身份，并将其包含在中继注册中，因此该中继支持的注册会委派给这个特定的 Gateway 网关。
- 应用通过 `push.apns.register` 将该中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关会将这个已存储的中继句柄用于 `push.test`、后台唤醒和唤醒提示。
- Gateway 网关中继基础 URL 必须与官方/TestFlight iOS 构建中内置的中继 URL 匹配。
- 如果应用之后连接到不同的 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

对于此路径，Gateway 网关**不**需要：

- 不需要部署范围的中继令牌。
- 官方/TestFlight 中继支持发送不需要直接 APNs 密钥。

预期的运维流程：

1. 安装官方/TestFlight iOS 构建。
2. 在网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与网关配对，并等待它完成连接。
4. 在应用获得 APNs 令牌、运维会话已连接且中继注册成功后，应用会自动发布 `push.apns.register`。
5. 之后，`push.test`、重连唤醒和唤醒提示都可以使用已存储的中继支持注册。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为网关的临时环境变量覆盖。

## 认证和信任流

设置中继是为了强制执行两个约束，而网关直连 APNs 无法为
官方 iOS 构建提供这些约束：

- 只有通过 Apple 分发的真实 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳说明：

1. `iOS app -> gateway`
   - 应用首先通过常规 Gateway 网关认证流与网关配对。
   - 这会给应用一个已认证的节点会话和一个已认证的运维会话。
   - 运维会话用于调用 `gateway.identity.get`。

2. `iOS app -> relay`
   - 应用通过 HTTPS 调用中继注册端点。
   - 注册包含 App Attest 证明和应用回执。
   - 中继会验证 bundle ID、App Attest 证明和 Apple 回执，并要求使用
     官方/生产分发路径。
   - 这就是为什么本地 Xcode/开发构建无法使用托管中继。本地构建也许已签名，
     但它不满足中继所要求的官方 Apple 分发证明。

3. `gateway identity delegation`
   - 在中继注册之前，应用会从
     `gateway.identity.get` 获取已配对 Gateway 网关的身份。
   - 应用会在中继注册负载中包含该 Gateway 网关身份。
   - 中继会返回一个中继句柄和一个注册作用域的发送授权，并将其委派给
     该 Gateway 网关身份。

4. `gateway -> relay`
   - Gateway 网关会存储来自 `push.apns.register` 的中继句柄和发送授权。
   - 在 `push.test`、重连唤醒和唤醒提示时，Gateway 网关会使用其
     自身设备身份对发送请求进行签名。
   - 中继会根据注册时委派的 Gateway 网关身份，验证已存储的发送授权和 Gateway 网关签名。
   - 其他 Gateway 网关即使设法获取了该句柄，也无法复用该已存储注册。

5. `relay -> APNs`
   - 中继持有官方构建的生产 APNs 凭证和原始 APNs 令牌。
   - 对于中继支持的官方构建，Gateway 网关永远不会存储原始 APNs 令牌。
   - 中继代表已配对的 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：

- 让生产 APNs 凭证不出现在用户 Gateway 网关中。
- 避免在 Gateway 网关上存储官方构建的原始 APNs 令牌。
- 仅允许官方/TestFlight OpenClaw 构建使用托管中继。
- 防止某个 Gateway 网关向属于其他 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍然使用直连 APNs。如果你在没有中继的情况下测试这些构建，
Gateway 网关仍然需要直接 APNs 凭证：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机运行时环境变量，而不是 Fastlane 设置。`apps/ios/fastlane/.env` 只存储
App Store Connect / TestFlight 认证信息，例如 `ASC_KEY_ID` 和 `ASC_ISSUER_ID`；它不会为本地 iOS 构建配置
直连 APNs 投递。

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

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并且在已配置时，也会浏览相同的
广域 DNS-SD 设备发现域。同一 LAN 上的 Gateway 网关会通过 `local.` 自动出现；
跨网络设备发现可以使用已配置的广域域名，而无需更改 beacon 类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名；示例：
`openclaw.internal.`）以及 Tailscale split DNS。
CoreDNS 示例请参见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在“设置”中，启用**手动主机**并输入 Gateway 网关主机 + 端口（默认 `18789`）。

## Canvas + A2UI

iOS 节点会渲染一个 WKWebView canvas。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关 canvas 主机会提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 使用相同端口，默认 `18789`）。
- 当广播了 canvas 主机 URL 时，iOS 节点会在连接时自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置 scaffold。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在“设置”中启用。
- iOS 可能会暂停后台音频；当应用未处于活动状态时，请将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（canvas/相机/屏幕命令需要它）。
- `A2UI_HOST_NOT_CONFIGURED`：Gateway 网关没有广播 canvas 主机 URL；请检查 [Gateway 网关配置](/zh-CN/gateway/configuration) 中的 `canvasHost`。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- 重新安装后重连失败：Keychain 配对令牌已被清除；请重新配对该节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

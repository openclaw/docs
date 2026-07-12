---
read_when:
    - 配对或重新连接 iOS 节点
    - 启用或排查直连 Apple Watch 节点故障
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关发现或画布命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、Canvas 和故障排查
title: iOS 应用
x-i18n:
    generated_at: "2026-07-12T14:35:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30d70f6df7fa1226bbcc79da4e7ece29f8531d5ea1fcf23b742e78d36fb9fc02
    source_path: platforms/ios.md
    workflow: 16
---

可用性：启用某个版本的 iPhone 应用构建后，会通过 Apple 渠道分发。本地开发构建也可以从源代码运行。

## 功能

- 通过 WebSocket 连接到 Gateway 网关（LAN 或 tailnet）。
- 提供节点能力：Canvas、屏幕快照、相机拍摄、位置、Talk 模式、语音唤醒。
- 接收 `node.invoke` 命令并报告节点状态事件。
- 可从智能体界面（Files）以只读方式浏览所选智能体的工作区：逐层进入目录、查看带语法高亮的文本预览和图像预览，以及通过共享菜单导出。不执行写入操作；预览大小受 Gateway 网关限制。
- 为每个已配对的 Gateway 网关保留一个小型只读离线缓存，其中包含最近的聊天会话和文字记录：冷启动时立即显示最后已知的文字记录，并在 Gateway 网关响应后刷新；断开连接期间仍可浏览最近的聊天；重置/遗忘操作会清除受保护的本地缓存。
- 将断开连接期间发送的文本消息放入每个 Gateway 网关各自的持久发件箱队列（最多 50 条）：排队中的消息气泡会显示在文字记录中；重新连接后按顺序发送并进行幂等重试；在规范历史记录确认发送成功前保持持久化；在显示重试/删除操作前采用退避策略重试；离线超过 48 小时后过期而不再发送；重置/遗忘操作会同时清除队列和缓存。
- 按需朗读助手消息：长按 Chat 中的消息并选择 **Listen**。应用会使用已配置的 TTS 提供商播放 Gateway 网关支持的 `tts.speak` 音频；当 Gateway 网关音频不可用或无法播放时，回退到设备端语音。切换会话或应用进入后台时会停止播放。

## 要求

- Gateway 网关运行在另一台设备上（macOS、Linux 或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 使用同一 LAN，**或**
  - 通过单播 DNS-SD 使用 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动指定主机/端口（回退方案）。

## 快速开始（配对 + 连接）

1. 启动一个已通过身份验证且具有手机可达路由的 Gateway 网关。推荐使用 Tailscale
   Serve 作为远程连接路径：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于可信的同一 LAN 设置，请改用已通过身份验证的 `gateway.bind: "lan"`。
默认的 local loopback 绑定无法从手机访问。如果尚未配置
Gateway 网关，请先运行 `openclaw onboard`，以便创建设置代码时具有令牌或密码身份验证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择 **Nodes**，然后在 **Devices** 页面上点击
   **Pair mobile device**。

3. 在 iOS 应用中，打开 **Settings** -> **Gateway**，扫描二维码（或粘贴
   设置代码），然后连接。

   如果设置代码同时包含 LAN 和 Tailscale Serve 路由，应用会
   按顺序探测这些路由，并保存第一个可访问的端点。

4. 官方应用会自动连接。如果 **Pending approval** 显示了一个
   请求，请先检查其角色和权限范围，再批准该请求。

Control UI 按钮要求已有一个具备 `operator.admin` 的配对会话。
作为终端回退方案，请在 iOS 应用中选择已发现的 Gateway 网关（或启用
Manual Host 并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用变更后的身份验证详细信息（角色/权限范围/公钥）重试配对，先前的待处理请求将被取代，并创建新的 `requestId`。批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从受到严格控制的子网连接，你可以选择通过明确的 CIDR 或确切 IP 地址启用首次节点自动批准：

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

此功能默认禁用。它仅适用于未请求任何权限范围的新 `role: node` 配对。操作员/浏览器配对，以及角色、权限范围、元数据或公钥发生的任何变更，仍需要手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

默认情况下，Apple Watch 配套应用会继续使用现有的 iPhone 中继，
无需单独与 Gateway 网关配对。在 Apple 的 Watch 应用中将 Watch 与 iPhone 配对，
从 **Watch app -> My Watch -> Available
Apps** 安装 OpenClaw，然后分别在两台设备上打开一次 OpenClaw。

## 审核命令审批

具有 `operator.admin` 的操作员连接，或由 Gateway 网关明确指定的已配对
`operator.approvals` 连接，可以在 iPhone 上审核待处理的 Exec 请求。审批卡片会显示 Gateway 网关提供的
已净化命令预览、警告、主机上下文、过期时间，以及该请求提供的
决策选项。已配对的 Apple Watch 会通过现有的 iPhone 中继接收相同的
审核者安全提示，并提供精简的仅允许一次/拒绝决策子集。Watch 直接连接 Gateway 网关的模式不会接收
审批提示。

审批状态与 Control UI 和受支持的聊天界面共享。
第一个提交的答复生效。在其他界面解决请求后、收到远程
已解决通知后，以及解决确认可能丢失时，iPhone 和 Watch 都会获取 Gateway 网关的规范
终止记录。在回读确认请求是否仍处于待处理状态之前，
操作始终不可用。

审批所有权绑定到所选 Gateway 网关。切换 Gateway 网关时，不能
将旧提示应用于替换后的连接。早于统一审批方法的 Gateway 网关会
回退到已发布的 Exec 专用方法；要使用保留的终止状态和更丰富的跨界面结果，
需要更新 Gateway 网关。

## 可选的 Apple Watch 直接节点

直接模式会为 Watch 提供自己的已签名节点身份和 Gateway 网关连接。
当 OpenClaw 处于活动状态时，即使配对的 iPhone 不可用，受支持的节点命令仍可
通过 Watch 的 Wi-Fi 或蜂窝网络工作。

要求：

- iPhone 已使用 `operator.admin` 权限范围连接到 Gateway 网关。
- 设置代码公开一个使用 watchOS 信任证书的 `wss://` Gateway 网关端点；
  Watch 会轮询对应的 `https://` 来源。不支持纯 HTTP、自签名证书或仅使用指纹的信任方式。有关端点配置，请参阅 [Gateway 网关所有的
  配对](/zh-CN/gateway/pairing)。local loopback、仅限 iPhone 和仅限 tailnet 的路由无法由 Watch 独立访问。
- 使用蜂窝网络需要支持蜂窝网络且已开通有效服务的 Apple Watch。
- OpenClaw 在 Watch 上处于活动状态。Apple 不允许普通 watchOS 应用
  保持通用 WebSocket/TCP 连接，因此直接节点会使用短轮询 HTTPS，
  并在应用返回前台时重新连接。请参阅 Apple 的
  [watchOS 低级网络指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

设置：

1. 在 iPhone 上，打开 **Settings -> Apple Watch**。
2. 点击 **Enable Direct Gateway Connection**。
3. 在短期有效的设置代码过期前，在 Watch 上打开 OpenClaw。
4. 使用 `openclaw nodes status` 验证单独的 Apple Watch 行。

设置代码包含一个短期有效、仅限节点的引导凭据；在其过期前，
应像对待密码一样保护它。它绝不会包含 iPhone 保存的 Gateway 网关
密码或令牌。配对后，Watch 会存储自己的设备令牌，并
删除引导凭据。直接模式仅涵盖下列命令。
Chat、Talk、审批和现有的 `watch.*` 通知流程仍属于
iPhone 中继功能，并且仍需要已配对的 iPhone。

watchOS 直接节点命令：

| 界面          | 命令                           | 说明                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 设备          | `device.info`, `device.status` | Watch 身份、电池、温度、存储空间和网络。                |
| 通知          | `system.notify`                | 应用处于活动状态时可用；需要 Watch 权限。               |

watchOS 不向第三方应用提供 WebKit，因此 Watch 直接节点
不会公布 Canvas 命令。

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs 令牌公布给 Gateway 网关。来自公共发布通道的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`；此基础 URL 硬编码用于 App Store 分发，不读取任何覆盖值。

自定义中继部署需要刻意使用单独的 iOS 构建/部署路径，并确保其中继 URL 与 Gateway 网关中继 URL 匹配。App Store 发布通道绝不接受自定义中继 URL。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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
- 中继返回一个不透明的中继句柄，以及作用域限定于该注册的发送授权。
- iOS 应用获取已配对 Gateway 网关的身份（`gateway.identity.get`），并在中继注册时包含该身份，以便将中继支持的注册委托给该特定 Gateway 网关。
- 应用通过 `push.apns.register` 将该中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关将存储的中继句柄用于 `push.test`、后台唤醒和唤醒提示。
- 如果应用之后连接到其他 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

此路径中 Gateway 网关**不**需要：无需部署范围的中继令牌，也无需用于官方 App Store 中继支持发送的直接 APNs 密钥。

预期操作员流程：

1. 安装官方 iOS 应用。
2. 可选：仅当使用刻意单独构建的自定义中继版本时，才在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并等待其完成连接。
4. 当应用获取 APNs 令牌、操作员会话已连接且中继注册成功后，会公布 `push.apns.register`。
5. 此后，`push.test`、重新连接唤醒和唤醒提示都可以使用已存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或显著位置事件唤醒应用时，应用会尝试进行一次短暂的节点重连，然后调用 `node.event`，并传入 `event: "node.presence.alive"`。仅在确认已通过身份验证的节点设备身份后，Gateway 网关才会将此信息记录为已配对节点/设备元数据中的 `lastSeenAtMs`/`lastSeenReason`。

只有当 Gateway 网关响应包含 `handled: true` 时，应用才会将后台唤醒视为已成功记录。较旧的 Gateway 网关可能使用 `{ "ok": true }` 确认 `node.event`；该响应具有兼容性，但不算作持久的最后在线时间更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可作为 Gateway 网关的临时环境变量覆盖值（优先使用配置路径 `gateway.push.apns.relay.baseUrl`）。
- App Store 发布构建的推送模式会硬编码托管中继主机，并且绝不读取中继 URL 覆盖值——构建时环境变量 `OPENCLAW_PUSH_RELAY_BASE_URL` 仅影响本地/沙箱 iOS 构建模式。

## 身份验证和信任流程

中继用于强制实施直接在 Gateway 网关上使用 APNs 时无法为官方 iOS 构建提供的两项约束：

- 只有通过 Apple 分发的正版 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送中继支持的推送。

逐跳流程：

1. `iOS app -> gateway`：应用通过常规 Gateway 网关身份验证流程与 Gateway 网关配对，从而获得一个已通过身份验证的节点会话和一个已通过身份验证的操作员会话。操作员会话调用 `gateway.identity.get`。
2. `iOS app -> relay`：应用通过 HTTPS 调用中继注册端点，并提供 App Attest 证明和 StoreKit 应用交易 JWS。中继会验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求使用官方/生产分发路径——这会阻止本地 Xcode/开发构建使用托管中继，因为本地构建无法满足官方 Apple 分发证明要求。
3. `gateway identity delegation`：在注册中继之前，应用从 `gateway.identity.get` 获取已配对 Gateway 网关的身份，并将其包含在中继注册载荷中。中继会返回一个中继句柄，以及一个委托给该 Gateway 网关身份、作用域限定于此次注册的发送授权。
4. `gateway -> relay`：Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。在 `push.test`、重新连接唤醒和唤醒提示发生时，Gateway 网关使用自己的设备身份对发送请求签名；中继会根据注册时委托的 Gateway 网关身份，同时验证已存储的发送授权和 Gateway 网关签名。即使另一个 Gateway 网关通过某种方式获得了该句柄，也无法复用这份已存储的注册信息。
5. `relay -> APNs`：中继拥有生产环境 APNs 凭据，以及官方构建的原始 APNs 令牌。对于由中继支持的官方构建，Gateway 网关永远不会存储原始 APNs 令牌；中继代表已配对的 Gateway 网关向 APNs 发送最终推送。

创建此设计的原因：避免将生产环境 APNs 凭据放入用户的 Gateway 网关，避免在 Gateway 网关上存储官方构建的原始 APNs 令牌，仅允许官方 OpenClaw iOS 构建使用托管中继，并防止某个 Gateway 网关向属于另一个 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍使用直接 APNs。如果你在不使用中继的情况下测试这些构建，Gateway 网关仍需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机的运行时环境变量，而不是 Fastlane 设置。`apps/ios/fastlane/.env` 仅存储 App Store Connect 身份验证信息，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 投递。

建议按以下方式在 Gateway 网关主机上存储，与 `~/.openclaw/credentials/` 下其他提供商凭据的存储方式保持一致：

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

不要提交 `.p8` 文件，也不要将其放在仓库检出目录下。

## 设备发现路径

### Bonjour（局域网）

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览相同的广域 DNS-SD 设备发现域。同一局域网中的 Gateway 网关会自动通过 `local.` 显示；跨网络设备发现可以使用已配置的广域域名，无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域名，例如 `openclaw.internal.`）和 Tailscale 分割 DNS。有关 CoreDNS 示例，请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中启用 **Manual Host**，然后输入 Gateway 网关主机和端口（默认值为 `18789`）。

## 多个 Gateway 网关

应用会保存已配对的每个 Gateway 网关的注册表，因此你可以在它们之间切换，而无需重新配对：

- **Settings -> Gateway** 会显示 **Paired Gateways** 列表，并标记当前活动的 Gateway 网关。点按某个条目即可切换；应用会断开当前会话并重新连接到所选 Gateway 网关。配对了多个 Gateway 网关时，连接行旁边会显示快速切换菜单。
- 凭据、TLS 信任决策、每个 Gateway 网关的偏好设置以及缓存的聊天记录会按 Gateway 网关分别存储。切换绝不会混用不同 Gateway 网关的状态，推送注册也会跟随当前活动的 Gateway 网关。
- 轻扫已配对的 Gateway 网关（或使用其上下文菜单）以 **Forget** 它，这会删除其凭据、设备令牌、TLS 固定信息和缓存的聊天记录。
- 必须能在网络上发现 Gateway 网关，才能切换到它们；手动添加的 Gateway 网关会使用已保存的主机和端口重新连接。

## Canvas + A2UI

iOS 节点会渲染 WKWebView 画布。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意：

- Gateway 网关画布主机通过 Gateway 网关 HTTP 服务器（与 `gateway.port` 使用相同端口，默认值为 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 节点将内置框架保留为连接后的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用随应用内置且由应用所有的 A2UI 页面。
- 在 iOS 上，远程 Gateway 网关 A2UI 页面仅用于渲染；仅接受来自随应用内置且由应用所有的页面的原生 A2UI 按钮操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置框架。

## 与计算机使用的关系

iOS 应用是移动节点界面，而不是 Codex Computer Use 后端。Codex Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS 应用通过 OpenClaw 节点命令公开 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍可通过调用节点命令，借助 OpenClaw 操作 iOS 应用，但这些调用会经过 Gateway 网关节点协议，并受 iOS 前台/后台限制约束。使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use) 控制本地桌面；有关 iOS 节点功能，请参阅本页面。

### Canvas 求值/快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 可在设置中使用语音唤醒和 Talk 模式。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI 实时 Talk 使用客户端所有的 WebRTC；显式的 `gateway-relay` 配置仍由 Gateway 网关所有。请参阅 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会通告 `talk` 能力，并可声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；默认情况下，Gateway 网关允许受信任且支持 Talk 的节点使用这些按键通话命令。
- iOS 可能会暂停后台音频；应用未处于活动状态时，应将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（画布/相机/屏幕命令要求应用处于前台）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 无法访问内置的 A2UI 页面；让应用保持在前台并停留在 Screen 选项卡，然后重试。
- 配对提示始终未出现：运行 `openclaw devices list` 并手动批准。
- Watch 未显示 iPhone 状态：确认 iPhone 在 `watch.status` 中报告 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配对状态为 false，请在 Apple 的 Watch 应用中配对
  Watch。如果安装状态为 false，请从 **My Watch -> Available Apps** 安装配套应用。
  完成任一更改后，在 Watch 上打开一次 OpenClaw；即时可达仍要求两个应用都在运行，
  而排队的更新可以稍后在后台送达。
- 重新安装后无法重新连接：钥匙串中的配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

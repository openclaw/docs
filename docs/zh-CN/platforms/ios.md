---
read_when:
    - 配对或重新连接 iOS 节点
    - 启用或排查直连 Apple Watch 节点的故障
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关发现或 Canvas 命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、Canvas 和故障排查
title: iOS 应用
x-i18n:
    generated_at: "2026-07-16T11:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

可用性：为某个版本启用时，iPhone 应用构建会通过 Apple 渠道分发。本地开发构建也可以从源代码运行。

## 功能

- 通过 WebSocket（局域网或 tailnet）连接到 Gateway 网关。
- 提供节点能力：Canvas、屏幕快照、相机拍摄、位置、Talk 模式、语音唤醒，以及选择启用的健康摘要。
- 接收 `node.invoke` 命令并报告节点状态事件。
- 通过智能体界面（文件）以只读方式浏览所选智能体的工作区：逐层浏览目录、查看带语法高亮的文本预览和图像预览，以及通过共享表单导出。不执行写入操作；预览大小由 Gateway 网关限制。
- 为每个已配对的 Gateway 网关保留近期聊天会话和转录内容的小型只读离线缓存：冷启动时立即显示最后已知的转录内容，并在 Gateway 网关响应后刷新；断开连接时仍可浏览近期聊天；重置或忘记操作会清除受保护的本地缓存。
- 将断开连接期间发送的文本消息加入每个 Gateway 网关各自的持久发件箱队列（最多 50 条）：排队中的气泡会显示在转录内容中；重新连接后按顺序发送，并进行幂等重试；在规范历史记录确认发送前始终持久保留；先按退避策略重试，再显示重试/删除操作；离线 48 小时后将过期而不再发送；重置或忘记操作会同时清除队列和缓存。
- 按需朗读助手消息：长按聊天中的消息并选择 **Listen**。应用会使用已配置的 TTS 提供商播放 Gateway 网关支持的 `tts.speak` 音频片段；当 Gateway 网关音频不可用或无法播放时，则回退到设备端语音。切换会话或应用进入后台时，播放会停止。

## 要求

- Gateway 网关需在另一台设备上运行（macOS、Linux，或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 连接同一局域网，**或**
  - 通过单播 DNS-SD 连接 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动指定主机/端口（回退方案）。

## 快速开始（配对并连接）

首次启动时，应用会显示简短的配对说明和权限页面（通知、相机、麦克风、照片、联系人、日历、提醒事项、位置）。所有授权都是可选的，之后可以在 **Settings** -> **Permissions** 或 iOS 的 Settings 应用中更改。

1. 启动一个已通过身份验证且具有手机可达路由的 Gateway 网关。建议将 Tailscale
   Serve 用作远程路径：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于可信的同一局域网设置，请改用已通过身份验证的 `gateway.bind: "lan"`。
默认的 loopback 绑定无法从手机访问。如果尚未配置 Gateway 网关，请先运行
`openclaw onboard`，确保创建设置代码时具有令牌或密码身份验证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择 **Nodes**，然后在 **Devices** 页面上点击
   **Pair mobile device**。建议使用完整访问权限，且默认已选中；仅当你希望省略
   Gateway 网关管理控制时才选择 Limited access，然后点击 **Create setup code**。

3. 在 iOS 应用中，打开 **Settings** -> **Gateway**，扫描二维码（或粘贴
   设置代码），然后连接。

   如果设置代码同时包含局域网和 Tailscale Serve 路由，应用会按顺序
   探测它们，并保存第一个可访问的端点。

4. 官方应用会自动连接。如果 **Pending approval** 显示请求，请在批准前
   检查其角色和权限范围。

   **Settings → Gateway** 会显示已保存的操作员连接具有 **Full** 还是 **Limited** 访问权限。
   为确保不记名令牌安全，明文局域网 `ws://` 设置会自动限制访问权限。
   如果访问权限受限，请配置 `wss://` 或 Tailscale Serve，从 Control UI 或
   `openclaw qr` 扫描新的完整访问设置代码，然后重新连接以启用设置和升级。

Control UI 按钮要求已有一个具备 `operator.admin` 的已配对会话。
作为终端回退方案，在 iOS 应用中选择已发现的 Gateway 网关（或启用
Manual Host 并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用已更改的身份验证详细信息（角色/权限范围/公钥）重试配对，之前的待处理请求将被取代，并创建新的 `requestId`。请在批准前再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从受到严格控制的子网连接，可以通过明确指定 CIDR 或精确 IP 地址，选择启用首次节点自动批准：

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

此功能默认禁用。它仅适用于未请求任何权限范围的全新 `role: node` 配对。操作员/浏览器配对以及任何角色、权限范围、元数据或公钥变更仍需手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## HealthKit 摘要

iOS 节点可以返回选择启用的只读 HealthKit 汇总数据，范围为当前日历日。iPhone 授权与明确的 Gateway 网关命令授权是相互独立的门槛。有关设置、调用、有效载荷字段、隐私行为和故障排除，请参阅 [HealthKit 摘要](/zh-CN/platforms/ios-healthkit)。

默认情况下，Apple Watch 配套应用会继续使用现有的 iPhone 中继，无需单独进行 Gateway 网关配对。在 Apple 的 Watch 应用中将 Watch 与 iPhone 配对，通过 **Watch app -> My Watch -> Available
Apps** 安装 OpenClaw，然后在两台设备上各打开一次 OpenClaw。

## 审核命令审批

具备 `operator.admin` 的操作员连接，或由 Gateway 网关明确指定的已配对
`operator.approvals` 连接，可以在 iPhone 上审核待处理的 Exec 请求。审批卡片会显示
Gateway 网关提供的已清理命令预览、警告、主机上下文、到期时间，以及该请求提供的
决策选项。已配对的 Apple Watch 会通过现有的 iPhone 中继接收相同的审核者安全提示，
并提供精简的仅允许一次/拒绝决策子集。Apple Watch 直接连接 Gateway 网关的模式不传送
审批提示。

审批状态与 Control UI 和支持的聊天界面共享。第一个已提交的答案生效。当其他界面解决请求后、
收到远程已解决通知后，以及解决确认可能丢失时，iPhone 和 Watch 都会获取 Gateway 网关的
规范终态记录。在该回读确认请求是否仍处于待处理状态之前，操作始终不可用。

审批归属绑定到所选 Gateway 网关。切换 Gateway 网关时，不能将旧提示应用于替代连接。
早于统一审批方法的 Gateway 网关会回退到已发布的 Exec 专用方法；若要保留终态状态并获得
更丰富的跨界面结果，则需要更新 Gateway 网关。

## 可选的 Apple Watch 直接节点

直接模式为 Watch 提供独立的签名节点身份和 Gateway 网关连接。
只要 OpenClaw 处于活动状态，即使已配对的 iPhone 不可用，受支持的节点命令仍可通过
Watch 的 Wi-Fi 或蜂窝网络运行。

要求：

- iPhone 已使用 `operator.admin` 权限范围连接到 Gateway 网关。
- 设置代码公布一个具有 watchOS 所信任证书的 `wss://` Gateway 网关端点；
  Watch 会轮询对应的 `https://` 源。不支持明文 HTTP、自签名证书或仅指纹信任。
  有关端点配置，请参阅 [Gateway 网关负责的配对](/zh-CN/gateway/pairing)。loopback、仅限 iPhone
  和仅限 tailnet 的路由无法由 Watch 独立访问。
- 使用蜂窝网络需要支持蜂窝网络且服务已激活的 Apple Watch。
- OpenClaw 在 Watch 上处于活动状态。Apple 不允许普通 watchOS 应用
  保持通用 WebSocket/TCP 连接，因此直接节点使用短时 HTTPS 轮询，并在应用返回前台时
  重新连接。请参阅 Apple 的 [watchOS 底层网络指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

设置：

1. 在 iPhone 上打开 **Settings -> Apple Watch**。
2. 点按 **Enable Direct Gateway Connection**。
3. 在短期有效的设置代码过期前，在 Watch 上打开 OpenClaw。
4. 使用 `openclaw nodes status` 验证单独的 Apple Watch 行。

设置代码包含一个短期有效且仅供节点使用的引导凭据；在其过期前，应像对待密码一样对待它。
它绝不会包含 iPhone 保存的 Gateway 网关密码或令牌。配对后，Watch 会存储自己的设备令牌，
并删除引导凭据。直接模式仅涵盖下方列出的命令。聊天、Talk、审批和现有
`watch.*` 通知流程仍属于 iPhone 中继功能，仍需已配对的 iPhone。

watchOS 直接节点命令：

| 界面          | 命令                           | 说明                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 设备          | `device.info`、`device.status` | Watch 身份、电池、温度、存储和网络。                    |
| 通知          | `system.notify`                | 应用处于活动状态时可用；需要 Watch 权限。               |

watchOS 不向第三方应用提供 WebKit，因此直接 Watch 节点不会公布 Canvas 命令。

## 官方构建的中继式推送

官方分发的 iOS 构建使用外部推送中继，而不是向 Gateway 网关公布原始 APNs 令牌。公共发布渠道中的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`；此基础 URL 在 App Store 分发版本中是硬编码的，不读取任何覆盖值。

自定义中继部署需要刻意使用单独的 iOS 构建/部署路径，其中继 URL 必须与 Gateway 网关的中继 URL 匹配。App Store 发布渠道绝不接受自定义中继 URL。如果使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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
- 中继返回一个不透明的中继句柄，以及一个限定于本次注册的发送授权。
- iOS 应用获取已配对的 Gateway 网关身份（`gateway.identity.get`），并将其包含在中继注册中，因此中继式注册会委托给该特定 Gateway 网关。
- 应用使用 `push.apns.register` 将该中继式注册转发给已配对的 Gateway 网关。
- Gateway 网关使用存储的中继句柄处理 `push.test`、后台唤醒和唤醒提示。
- 如果应用之后连接到其他 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不会复用旧绑定。

对于此路径，Gateway 网关**不需要**：无需部署范围的中继令牌，也无需用于官方 App Store 中继式发送的直接 APNs 密钥。

预期操作员流程：

1. 安装官方 iOS 应用。
2. 可选：仅在使用刻意单独构建的自定义中继版本时，才在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并等待其完成连接。
4. 当应用获得 APNs 令牌、操作员会话已连接且中继注册成功后，会发布 `push.apns.register`。
5. 之后，`push.test`、重新连接唤醒和唤醒提示便可使用已存储的中继式注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或重大位置变化事件唤醒应用时，应用会尝试短暂重新连接节点，然后使用 `event: "node.presence.alive"` 调用 `node.event`。仅当已知经过身份验证的节点设备身份后，Gateway 网关才会在已配对的节点/设备元数据中将其记录为 `lastSeenAtMs`/`lastSeenReason`。

仅当 Gateway 网关响应包含 `handled: true` 时，应用才会认为后台唤醒已成功记录。较旧的 Gateway 网关可能会使用 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不算作持久的最后在线时间更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可用作 Gateway 网关的临时环境变量覆盖（`gateway.push.apns.relay.baseUrl` 是配置优先的路径）。
- App Store 发布构建的推送模式硬编码了托管中继主机，且绝不会读取中继 URL 覆盖值——构建时环境变量 `OPENCLAW_PUSH_RELAY_BASE_URL` 仅影响本地/沙箱 iOS 构建模式。

## 身份验证和信任流程

中继用于实施官方 iOS 构建中直接在 Gateway 网关上使用 APNs 无法满足的两项约束：

- 只有通过 Apple 分发的正版 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送由中继支持的推送。

逐跳流程：

1. `iOS app -> gateway`：应用通过常规 Gateway 网关身份验证流程与 Gateway 网关配对，从而获得经过身份验证的节点会话和经过身份验证的操作员会话。操作员会话调用 `gateway.identity.get`。
2. `iOS app -> relay`：应用通过 HTTPS 调用中继注册端点，并提供 App Attest 证明和 StoreKit 应用交易 JWS。中继验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求使用官方/生产分发路径——这会阻止本地 Xcode/开发构建使用托管中继，因为本地构建无法满足官方 Apple 分发证明要求。
3. `gateway identity delegation`：注册中继之前，应用从 `gateway.identity.get` 获取已配对的 Gateway 网关身份，并将其包含在中继注册载荷中。中继返回一个中继句柄，以及委托给该 Gateway 网关身份的注册范围发送授权。
4. `gateway -> relay`：Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。发生 `push.test`、重新连接唤醒和唤醒提醒时，Gateway 网关使用自己的设备身份对发送请求签名；中继根据注册时委托的 Gateway 网关身份，同时验证已存储的发送授权和 Gateway 网关签名。即使另一个 Gateway 网关以某种方式获得了该句柄，也无法复用已存储的注册信息。
5. `relay -> APNs`：中继持有生产 APNs 凭据以及官方构建的原始 APNs 令牌。对于由中继支持的官方构建，Gateway 网关绝不会存储原始 APNs 令牌；中继代表已配对的 Gateway 网关向 APNs 发送最终推送。

采用此设计的原因是：避免将生产 APNs 凭据放入用户的 Gateway 网关，避免在 Gateway 网关上存储官方构建的原始 APNs 令牌，仅允许官方 OpenClaw iOS 构建使用托管中继，并防止某个 Gateway 网关向归其他 Gateway 网关所有的 iOS 设备发送唤醒推送。

本地/手动构建仍使用直接 APNs。如果不使用中继测试这些构建，Gateway 网关仍需要直接 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机的运行时环境变量，而非 Fastlane 设置。`apps/ios/fastlane/.env` 仅存储 App Store Connect 身份验证信息，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 投递。

推荐采用以下 Gateway 网关主机存储方式，这与 `~/.openclaw/credentials/` 下的其他提供商凭据一致：

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

iOS 应用在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览相同的广域 DNS-SD 设备发现域。来自 `local.` 的同一局域网 Gateway 网关会自动出现；跨网络设备发现可使用配置的广域域，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域；示例：`openclaw.internal.`）和 Tailscale 分离 DNS。有关 CoreDNS 示例，请参阅 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在 Settings 中启用 **Manual Host**，然后输入 Gateway 网关主机和端口（默认值为 `18789`）。

## 多个 Gateway 网关

应用会维护其已配对的所有 Gateway 网关的注册表，因此无需再次配对即可在它们之间切换：

- **Settings -> Gateway** 会显示 **Paired Gateways** 列表，并标记当前使用的 Gateway 网关。轻点条目即可切换；应用会断开当前会话，然后重新连接到所选 Gateway 网关。当已配对多个 Gateway 网关时，连接行旁边会显示快速切换菜单。
- 凭据、TLS 信任决定、各 Gateway 网关的偏好设置以及缓存的聊天记录均按 Gateway 网关分别存储。切换绝不会混用不同 Gateway 网关的状态，推送注册也会跟随当前使用的 Gateway 网关。
- 轻扫已配对的 Gateway 网关（或使用其上下文菜单），然后选择 **Forget**，即可移除其凭据、设备令牌、TLS 固定信息和缓存的聊天记录。
- 通过设备发现找到的 Gateway 网关必须在网络上可见才能切换到它们；手动添加的 Gateway 网关会使用已保存的主机和端口重新连接。

## Canvas + A2UI

iOS 节点会渲染 WKWebView 画布。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关画布主机通过 Gateway 网关 HTTP 服务器（端口与 `gateway.port` 相同，默认值为 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 节点将内置脚手架保留为连接后的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用由应用所有的内置 A2UI 页面。
- 远程 Gateway 网关 A2UI 页面在 iOS 上仅用于渲染；仅由应用所有的内置页面可以触发原生 A2UI 按钮操作。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置脚手架。

## 与计算机使用的关系

iOS 应用是移动节点界面，而不是 Codex Computer Use 后端。Codex Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS 应用则通过 OpenClaw 节点命令公开 iPhone 功能，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍可通过调用节点命令，经由 OpenClaw 操作 iOS 应用，但这些调用会通过 Gateway 网关节点协议，并受 iOS 前台/后台限制约束。如需控制本地桌面，请使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use)；有关 iOS 节点功能，请参阅本页面。

### 画布求值/快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 可在 Settings 中使用语音唤醒和 Talk 模式。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI 实时 Talk 使用客户端持有的 WebRTC；显式的 `gateway-relay` 配置仍由 Gateway 网关持有。请参阅 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会公布 `talk` 能力，并可声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；对于受信任且支持 Talk 的节点，Gateway 网关默认允许这些按住说话命令。
- iOS 可能会暂停后台音频；应用未处于活动状态时，应将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（画布/相机/屏幕命令要求应用位于前台）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 无法访问内置 A2UI 页面；让应用停留在前台的 Screen 标签页，然后重试。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- Watch 未显示 iPhone 状态：确认 iPhone 在 `watch.status` 中报告 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配对状态为 false，请在 Apple 的 Watch 应用中配对
  Watch。如果安装状态为 false，请从 **My Watch -> Available Apps** 安装配套应用。
  完成任一更改后，在 Watch 上打开一次 OpenClaw；要立即保持可达，仍需两个应用都在运行，
  而排队的更新可以稍后在后台送达。
- 重新安装后无法重新连接：钥匙串中的配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

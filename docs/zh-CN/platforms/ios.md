---
read_when:
    - 配对或重新连接 iOS 节点
    - 启用或排查直连 Apple Watch 节点的故障
    - 从源代码运行 iOS 应用
    - 调试 Gateway 网关发现或画布命令
summary: iOS 节点应用：连接到 Gateway 网关、配对、画布和故障排查
title: iOS 应用
x-i18n:
    generated_at: "2026-07-12T21:24:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf3c90d9b9be2fdfd1e4b85eebe9b79fe17a8f4aeaf05b60d4911c781e87c075
    source_path: platforms/ios.md
    workflow: 16
---

可用性：当某个版本启用时，iPhone 应用构建会通过 Apple 渠道分发。本地开发构建也可以从源代码运行。

## 功能

- 通过 WebSocket（LAN 或 tailnet）连接到 Gateway 网关。
- 提供节点能力：Canvas、屏幕快照、相机拍摄、位置、Talk 模式、语音唤醒，以及可选择启用的健康摘要。
- 接收 `node.invoke` 命令并报告节点状态事件。
- 可从智能体界面（Files）以只读方式浏览所选智能体的工作区：逐级查看目录、预览带语法高亮的文本、预览图像，以及通过共享表单导出。不支持写入操作；预览大小受 Gateway 网关限制。
- 为每个已配对的 Gateway 网关保留近期聊天会话和对话记录的小型只读离线缓存：冷启动时立即显示最后已知的对话记录，并在 Gateway 网关响应后刷新；断开连接期间仍可浏览近期聊天；重置/遗忘操作会清除受保护的本地缓存。
- 将断开连接期间发送的文本消息放入按 Gateway 网关划分的持久发件箱队列（最多 50 条）：排队中的消息气泡会显示在对话记录中；重新连接后按顺序发送，并进行幂等重试；在规范历史记录确认发送前保持持久存储；先按退避策略重试，再显示重试/删除操作；离线超过 48 小时后消息会过期而不再发送；重置/遗忘操作会随缓存一并清除队列。
- 按需朗读助手消息：在聊天中长按消息并选择 **Listen**。应用会使用已配置的 TTS 提供商播放 Gateway 网关支持的 `tts.speak` 音频片段；当 Gateway 网关音频不可用或无法播放时，回退到设备端语音。切换会话或应用进入后台时，播放会停止。

## 要求

- Gateway 网关运行在另一台设备上（macOS、Linux 或通过 WSL2 运行的 Windows）。
- 网络路径：
  - 通过 Bonjour 连接到同一 LAN，**或**
  - 通过单播 DNS-SD 连接到 tailnet（示例域名：`openclaw.internal.`），**或**
  - 手动指定主机/端口（回退方式）。

## 快速开始（配对 + 连接）

1. 启动一个已通过身份验证、且手机可访问其路由的 Gateway 网关。建议使用 Tailscale
   Serve 作为远程访问路径：

```bash
openclaw gateway --port 18789 --tailscale serve
```

对于受信任的同一 LAN 环境，请改用已通过身份验证的 `gateway.bind: "lan"`。
默认的回环绑定无法从手机访问。如果尚未配置 Gateway 网关，请先运行
`openclaw onboard`，以便创建设置代码时具有令牌或密码身份验证路径。

2. 打开 [Control UI](/zh-CN/web/control-ui)，选择 **Nodes**，然后在 **Devices** 页面点击
   **Pair mobile device**。

3. 在 iOS 应用中，打开 **Settings** -> **Gateway**，扫描二维码（或粘贴
   设置代码），然后连接。

   如果设置代码同时包含 LAN 和 Tailscale Serve 路由，应用会按顺序探测这些路由，
   并保存第一个可访问的端点。

4. 官方应用会自动连接。如果显示 **Pending approval** 请求，
   请在批准前检查其角色和权限范围。

Control UI 按钮要求已有一个具备 `operator.admin` 的配对会话。
作为终端回退方式，请在 iOS 应用中选择发现的 Gateway 网关（或启用
Manual Host 并输入主机/端口），然后在 Gateway 网关主机上批准请求：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

如果应用使用已更改的身份验证详细信息（角色/权限范围/公钥）重试配对，之前的待处理请求将被取代，并创建新的 `requestId`。批准前请再次运行 `openclaw devices list`。

可选：如果 iOS 节点始终从受到严格控制的子网连接，你可以通过显式指定 CIDR 或确切 IP，选择启用首次节点自动批准：

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

此功能默认禁用。它仅适用于未请求任何权限范围的新 `role: node` 配对。操作员/浏览器配对，以及角色、权限范围、元数据或公钥的任何变更，仍需手动批准。

5. 验证连接：

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 健康摘要

iOS 节点可以返回设备端针对 `today` 的只读汇总数据。固定摘要包括步数、睡眠时长、平均静息心率，以及锻炼次数/时长。它绝不会返回单条 HealthKit 样本、来源、元数据、临床记录或写入权限。

此功能有两个相互独立的选择启用步骤：

1. 在 iOS 应用中，打开 **Settings -> Permissions -> Privacy & Access -> Health Summaries**，
   然后点击 **Enable & Share Summaries**。披露说明会解释：请求的汇总数据将通过你的 Gateway 网关离开手机、发送到你配置的 AI
   提供商，并且可能保留在聊天历史记录中。
2. 将 `health.summary` 添加到 `gateway.nodes.allowCommands`，然后拒绝并
   重新批准已更改的 iPhone 节点命令界面。请确保 Gateway 网关仅限本地
   或 tailnet 访问；启用此敏感命令后，安全审计会报告该命令。

模型使用现有的 `nodes` 工具，并设置 `action: "invoke"`、
`invokeCommand: "health.summary"`，以及将 `invokeParamsJson` 设置为
`{"period":"today"}`。

HealthKit 有意不透露读取权限是否已被拒绝。因此，缺少指标只表示没有返回可读取的值；这既不能证明权限遭拒，也不能证明不存在健康数据。OpenClaw 将摘要限制在当前日历日内，以免有限的历史访问窗口使多日总量看起来像是完整数据。OpenClaw 不会在后台摄取健康数据，也不会将摘要用于诊断或医疗建议。

默认情况下，Apple Watch 配套应用继续使用现有的 iPhone 中继，无需单独与 Gateway 网关配对。请在 Apple 的 Watch 应用中将 Watch 与 iPhone 配对，通过
**Watch app -> My Watch -> Available Apps** 安装 OpenClaw，然后分别在两台设备上打开一次 OpenClaw。

## 审核命令审批

具有 `operator.admin` 的操作员连接，或者由 Gateway 网关明确指定的已配对
`operator.approvals` 连接，可以在 iPhone 上审核待处理的 Exec 请求。审批卡片会显示 Gateway 网关提供的已清理命令预览、警告、主机上下文、到期时间，以及该请求提供的决策选项。已配对的 Apple Watch 会通过现有的 iPhone 中继接收相同的审核者安全提示，并提供精简的一次性允许/拒绝决策子集。Apple Watch 直接连接 Gateway 网关的模式不传递审批提示。

审批状态与 Control UI 及受支持的聊天界面共享。首个提交的答案生效。当其他界面处理了请求、收到远程处理完成通知，以及可能丢失处理确认时，iPhone 和 Watch 都会获取 Gateway 网关的规范终态记录。在回读确认请求是否仍处于待处理状态之前，操作始终不可用。

审批归属绑定到所选 Gateway 网关。切换 Gateway 网关时，不能将旧提示应用于替代连接。早于统一审批方法的 Gateway 网关会回退到已发布的 Exec 专用方法；要保留终态以及获得更丰富的跨界面结果，需要更新后的 Gateway 网关。

## 可选的 Apple Watch 直接节点

直接模式为 Watch 提供独立的签名节点身份和 Gateway 网关连接。当 OpenClaw 处于活动状态时，即使已配对的 iPhone 不可用，受支持的节点命令仍可通过 Watch 的 Wi-Fi 或蜂窝网络运行。

要求：

- iPhone 已通过 `operator.admin` 权限范围连接到 Gateway 网关。
- 设置代码公布一个使用 watchOS 信任证书的 `wss://` Gateway 网关端点；Watch 会轮询对应的 `https://` 源。不支持纯 HTTP、自签名证书或仅指纹信任。有关端点配置，请参阅 [Gateway 网关负责的配对](/zh-CN/gateway/pairing)。Watch 无法独立访问回环、仅限 iPhone 和仅限 tailnet 的路由。
- 使用蜂窝网络需要支持蜂窝网络且已启用服务的 Apple Watch。
- OpenClaw 在 Watch 上处于活动状态。Apple 不允许普通 watchOS 应用持续保持通用 WebSocket/TCP 连接，因此直接节点会使用短 HTTPS 轮询，并在应用返回前台时重新连接。请参阅 Apple 的
  [watchOS 底层网络指南](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)。

设置：

1. 在 iPhone 上打开 **Settings -> Apple Watch**。
2. 点击 **Enable Direct Gateway Connection**。
3. 在短期有效的设置代码过期前，在 Watch 上打开 OpenClaw。
4. 使用 `openclaw nodes status` 验证单独的 Apple Watch 行。

设置代码包含一个短期有效、仅供节点使用的引导凭据；在过期前应像保护密码一样保护它。它绝不会包含 iPhone 保存的 Gateway 网关密码或令牌。配对后，Watch 会存储自己的设备令牌并删除引导凭据。直接模式仅覆盖下列命令。聊天、Talk、审批和现有的 `watch.*` 通知流程仍属于 iPhone 中继功能，并且仍需要已配对的 iPhone。

watchOS 直接节点命令：

| 界面 | 命令 | 说明 |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 设备 | `device.info`, `device.status` | Watch 身份、电池、温度、存储和网络。 |
| 通知 | `system.notify` | 应用处于活动状态时可用；需要 Watch 权限。 |

watchOS 不向第三方应用提供 WebKit，因此 Watch 直接节点不会公布 Canvas 命令。

## 官方构建的中继支持推送

官方分发的 iOS 构建使用外部推送中继，而不是将原始 APNs 令牌发布给 Gateway 网关。来自公共发布通道的官方 App Store 构建使用托管中继 `https://ios-push-relay.openclaw.ai`；此基础 URL 被硬编码用于 App Store 分发，不会读取任何覆盖配置。

自定义中继部署需要使用刻意独立的 iOS 构建/部署路径，并确保其中继 URL 与 Gateway 网关中继 URL 匹配。App Store 发布通道绝不会接受自定义中继 URL。如果你使用自定义中继构建，请设置匹配的 Gateway 网关中继 URL：

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
- 中继返回一个不透明的中继句柄，以及一个限于此次注册的发送授权。
- iOS 应用获取已配对的 Gateway 网关身份（`gateway.identity.get`），并将其包含在中继注册中，使中继支持的注册仅委托给该特定 Gateway 网关。
- 应用通过 `push.apns.register` 将该中继支持的注册转发给已配对的 Gateway 网关。
- Gateway 网关使用存储的中继句柄执行 `push.test`、后台唤醒和唤醒提示。
- 如果应用之后连接到其他 Gateway 网关，或连接到使用不同中继基础 URL 的构建，它会刷新中继注册，而不是复用旧绑定。

此路径中 Gateway 网关**不**需要：部署范围的中继令牌，也不需要用于官方 App Store 中继支持发送的直接 APNs 密钥。

预期的操作员流程：

1. 安装官方 iOS 应用。
2. 可选：仅在使用刻意独立的自定义中继构建时，在 Gateway 网关上设置 `gateway.push.apns.relay.baseUrl`。
3. 将应用与 Gateway 网关配对，并等待连接完成。
4. 当应用获得 APNs 令牌、操作员会话已连接且中继注册成功后，应用会发布 `push.apns.register`。
5. 此后，`push.test`、重新连接唤醒和唤醒提示即可使用存储的中继支持注册。

## 后台存活信标

当 iOS 因静默推送、后台刷新或显著位置变化事件唤醒应用时，应用会尝试短暂重新连接节点，然后调用 `node.event`，并传入 `event: "node.presence.alive"`。仅在获知经过身份验证的节点设备身份后，Gateway 网关才会将其作为 `lastSeenAtMs`/`lastSeenReason` 记录到已配对节点/设备的元数据中。

仅当 Gateway 网关响应中包含 `handled: true` 时，应用才会将后台唤醒视为已成功记录。旧版 Gateway 网关可能会使用 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不算作持久的最后在线时间更新。

兼容性说明：

- `OPENCLAW_APNS_RELAY_BASE_URL` 仍可用作 Gateway 网关的临时环境变量覆盖项（配置优先路径为 `gateway.push.apns.relay.baseUrl`）。
- App Store 发布版本的推送模式硬编码了托管中继主机，并且从不读取中继 URL 覆盖项——构建时环境变量 `OPENCLAW_PUSH_RELAY_BASE_URL` 仅影响本地/沙箱 iOS 构建模式。

## 身份验证和信任流程

中继服务用于实施官方 iOS 构建中由 Gateway 网关直接连接 APNs 无法满足的两项约束：

- 只有通过 Apple 分发的正版 OpenClaw iOS 构建才能使用托管中继。
- Gateway 网关只能为与该特定 Gateway 网关配对的 iOS 设备发送由中继支持的推送。

逐跳流程：

1. `iOS app -> gateway`：应用通过常规 Gateway 网关身份验证流程与 Gateway 网关配对，从而获得经过身份验证的节点会话和经过身份验证的操作员会话。操作员会话调用 `gateway.identity.get`。
2. `iOS app -> relay`：应用通过 HTTPS 调用中继注册端点，并提供 App Attest 证明和 StoreKit 应用交易 JWS。中继会验证 bundle ID、App Attest 证明和 Apple 分发证明，并要求使用官方/生产分发路径——这会阻止本地 Xcode/开发构建使用托管中继，因为本地构建无法满足官方 Apple 分发证明要求。
3. `gateway identity delegation`：在中继注册之前，应用会从 `gateway.identity.get` 获取已配对 Gateway 网关的身份，并将其包含在中继注册负载中。中继会返回一个中继句柄，以及委托给该 Gateway 网关身份、作用域限定于此次注册的发送授权。
4. `gateway -> relay`：Gateway 网关存储来自 `push.apns.register` 的中继句柄和发送授权。在执行 `push.test`、重新连接唤醒和唤醒提示时，Gateway 网关使用自己的设备身份对发送请求签名；中继会根据注册时委托的 Gateway 网关身份，同时验证已存储的发送授权和 Gateway 网关签名。即使另一个 Gateway 网关以某种方式获得该句柄，也无法复用该已存储的注册。
5. `relay -> APNs`：中继拥有官方构建的生产 APNs 凭据和原始 APNs 令牌。对于由中继支持的官方构建，Gateway 网关绝不会存储原始 APNs 令牌；中继代表已配对的 Gateway 网关将最终推送发送到 APNs。

创建此设计的原因：避免将生产 APNs 凭据放入用户的 Gateway 网关，避免在 Gateway 网关上存储官方构建的原始 APNs 令牌，仅允许官方 OpenClaw iOS 构建使用托管中继，并防止一个 Gateway 网关向归属另一 Gateway 网关的 iOS 设备发送唤醒推送。

本地/手动构建仍直接使用 APNs。如果你在不使用中继的情况下测试这些构建，Gateway 网关仍需要直接使用的 APNs 凭据：

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

这些是 Gateway 网关主机的运行时环境变量，而不是 Fastlane 设置。`apps/ios/fastlane/.env` 仅存储 App Store Connect 身份验证信息，例如 `APP_STORE_CONNECT_KEY_ID` 和 `APP_STORE_CONNECT_ISSUER_ID`；它不会为本地 iOS 构建配置直接 APNs 投递。

建议采用以下 Gateway 网关主机存储方式，与 `~/.openclaw/credentials/` 下其他提供商凭据的存储方式保持一致：

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

iOS 应用会在 `local.` 上浏览 `_openclaw-gw._tcp`，并在配置后浏览同一广域 DNS-SD 设备发现域。同一局域网内的 Gateway 网关会通过 `local.` 自动显示；跨网络设备发现可以使用配置的广域域，而无需更改信标类型。

### Tailnet（跨网络）

如果 mDNS 被阻止，请使用单播 DNS-SD 区域（选择一个域；示例：`openclaw.internal.`）和 Tailscale 分流 DNS。CoreDNS 示例参见 [Bonjour](/zh-CN/gateway/bonjour)。

### 手动主机/端口

在设置中，启用**手动主机**并输入 Gateway 网关主机和端口（默认值为 `18789`）。

## 多个 Gateway 网关

应用会保存其已配对的每个 Gateway 网关的注册表，因此你无需重新配对即可在它们之间切换：

- **设置 -> Gateway 网关**会显示**已配对的 Gateway 网关**列表，并标记当前活动的 Gateway 网关。轻触条目即可切换；应用会断开当前会话并重新连接到所选 Gateway 网关。配对了多个 Gateway 网关时，连接行旁会显示快速切换菜单。
- 凭据、TLS 信任决定、每个 Gateway 网关的偏好设置以及缓存的聊天记录均按 Gateway 网关分别存储。切换绝不会混用不同 Gateway 网关之间的状态，推送注册也会跟随当前活动的 Gateway 网关。
- 轻扫已配对的 Gateway 网关（或使用其上下文菜单）以**忘记**它，这会移除其凭据、设备令牌、TLS 固定信息和缓存的聊天记录。
- 若要切换到通过设备发现找到的 Gateway 网关，该 Gateway 网关必须在网络上可见；手动添加的 Gateway 网关会使用已保存的主机和端口重新连接。

## Canvas + A2UI

iOS 节点会渲染 WKWebView 画布。使用 `node.invoke` 驱动它：

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

说明：

- Gateway 网关画布主机通过 Gateway 网关 HTTP 服务器（端口与 `gateway.port` 相同，默认值为 `18789`）提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- iOS 节点将内置框架保留为连接后的默认视图。`canvas.a2ui.push` 和 `canvas.a2ui.reset` 使用应用内置并由应用所有的 A2UI 页面。
- 在 iOS 上，远程 Gateway 网关 A2UI 页面仅用于渲染；只有来自应用内置并由应用所有的页面的原生 A2UI 按钮操作才会被接受。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回内置框架。

## 与计算机使用的关系

iOS 应用是移动节点界面，而不是 Codex Computer Use 后端。Codex Computer Use 和 `cua-driver mcp` 通过 MCP 工具控制本地 macOS 桌面；iOS 应用则通过 OpenClaw 节点命令公开 iPhone 能力，例如 `canvas.*`、`camera.*`、`screen.*`、`location.*` 和 `talk.*`。

智能体仍可通过调用节点命令，经由 OpenClaw 操作 iOS 应用，但这些调用会经过 Gateway 网关节点协议，并受 iOS 前台/后台限制。使用 [Codex Computer Use](/zh-CN/plugins/codex-computer-use) 控制本地桌面；有关 iOS 节点能力，请参阅本页。

### Canvas 求值/快照

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + Talk 模式

- 语音唤醒和 Talk 模式可在设置中使用。
- 当 `talk.realtime.transport` 为 `webrtc` 时，OpenAI 实时 Talk 使用客户端所有的 WebRTC；显式的 `gateway-relay` 配置仍由 Gateway 网关所有。参见 [Talk 模式](/zh-CN/nodes/talk)。
- 支持 Talk 的 iOS 节点会公布 `talk` 能力，并可声明 `talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel` 和 `talk.ptt.once`；对于受信任且支持 Talk 的节点，Gateway 网关默认允许这些按键通话命令。
- iOS 可能会暂停后台音频；应用未处于活动状态时，应将语音功能视为尽力提供。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`：将 iOS 应用切换到前台（画布/相机/屏幕命令要求应用位于前台）。
- `A2UI_HOST_UNAVAILABLE`：应用 WebView 无法访问内置 A2UI 页面；让应用在屏幕标签页中保持前台运行，然后重试。
- 配对提示始终不出现：运行 `openclaw devices list` 并手动批准。
- Watch 未显示 iPhone 状态：确认 iPhone 在 `watch.status` 中报告 `watchPaired: true`
  和 `watchAppInstalled: true`。如果配对状态为 false，请在 Apple 的 Watch 应用中配对
  Watch。如果安装状态为 false，请从 **My Watch -> Available Apps** 安装配套应用。
  进行任一更改后，在 Watch 上打开一次 OpenClaw；即时可访问仍要求两个应用都在运行，
  而排队的更新可稍后在后台送达。
- 重新安装后无法重新连接：钥匙串中的配对令牌已被清除；请重新配对节点。

## 相关文档

- [配对](/zh-CN/channels/pairing)
- [设备发现](/zh-CN/gateway/discovery)
- [Bonjour](/zh-CN/gateway/bonjour)

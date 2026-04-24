---
read_when:
    - 你希望一个 OpenClaw 智能体加入一个 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入显式的 Meet URL，并使用默认实时语音设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-24T19:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08d1bc95465cc1a6063d5ef6707babf69d16f7f244bd4a9e88a28e3f7a62b2f9
    source_path: plugins/google-meet.md
    workflow: 15
---

适用于 OpenClaw 的 Google Meet 参会支持 —— 该插件在设计上是显式的：

- 它只会加入显式的 `https://meet.google.com/...` URL。
- `realtime` 语音是默认模式。
- 当需要更深层的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：实时收听/回话使用 `realtime`，仅加入/控制浏览器而不启用实时语音桥接则使用 `transcribe`。
- 认证起点是个人 Google OAuth，或已经登录的 Chrome 配置文件。
- 不会自动播报同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码，以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音 provider。默认使用 OpenAI；Google Gemini Live 也可与
`realtime.provider: "google"` 配合使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的
安装器要求重启后 macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项是否都已就绪：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

启用该插件：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

检查设置：

```bash
openclaw googlemeet setup
```

设置输出旨在供智能体读取。它会报告 Chrome 配置文件、
音频桥接、节点固定、延迟的实时引导，以及在配置了 Twilio 委派时，
`voice-call` 插件和 Twilio 凭证是否已准备就绪。
在要求智能体加入之前，请将任何 `ok: false` 检查视为阻塞项。
脚本或机器可读输出请使用 `openclaw googlemeet setup --json`。

加入会议：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体通过 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

对于仅观察/浏览器控制的加入，请设置 `"mode": "transcribe"`。这样
不会启动双向实时模型桥接，因此它不会在会议中回话。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，为
OpenClaw 使用的麦克风/扬声器路径选择 `BlackHole 2ch`。
为了获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的路由图；单个 BlackHole 设备
足以完成第一次冒烟测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或模型 API 密钥，
仅仅是为了让 VM 承载 Chrome。你可以在本地运行 Gateway 网关和智能体，
然后在 VM 中运行一个节点主机。只需在 VM 中启用一次内置插件，
这样节点就会通告 Chrome 命令：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时
  provider，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，
  以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥，或模型
  provider 设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，以便 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 可以看到音频设备和 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

在 VM 中安装或更新 OpenClaw，然后在那里启用内置插件：

```bash
openclaw plugins enable google-meet
```

在 VM 中启动节点主机：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是局域网 IP，且你未使用 TLS，则除非你明确允许该受信任私有网络，
否则节点会拒绝明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时，也请使用同一个环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境变量，不是
`openclaw.json` 设置。当该变量出现在安装命令中时，`openclaw node install` 会将其存储到 LaunchAgent
环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关可以看到该节点，并且它通告了 `googlemeet.chrome`
以及浏览器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 网关主机上通过该节点路由 Meet：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

现在从 Gateway 网关主机正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者要求智能体使用 `google_meet` 工具，并设置 `transport: "chrome-node"`。

如果你想做一个单命令冒烟测试，用于创建或复用会话、说出一段已知
短语，并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

如果浏览器配置文件未登录、Meet 正在等待主持人批准加入，或
Chrome 需要麦克风/摄像头权限，则 join/test-speech 结果会报告
`manualActionRequired: true`，并附带 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，将该消息报告给操作员，
并仅在完成手动浏览器操作后重试。

如果省略 `chromeNode.node`，只有在恰好有一个已连接节点同时通告 `googlemeet.chrome`
和浏览器控制时，OpenClaw 才会自动选择。
如果连接了多个具备能力的节点，请将 `chromeNode.node` 设置为节点 id、
显示名称或远程 IP。

常见故障检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，
  批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。同时确认
  Gateway 网关主机已通过
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` 允许这两个节点命令。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch`，
  然后重启 VM。
- Chrome 已打开但无法加入：在 VM 中登录浏览器配置文件，或者
  保持设置 `chrome.guestName` 以便访客加入。访客自动加入通过节点浏览器代理使用 OpenClaw
  浏览器自动化；请确保节点浏览器
  配置指向你想使用的配置文件，例如
  `browser.defaultProfile: "user"` 或一个已命名的现有会话配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。
  在打开新标签页之前，OpenClaw 会先激活同一个 Meet URL 的现有标签页。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备
  路径；使用独立的虚拟设备或类似 Loopback 的路由
  以获得干净的双工音频。

## 安装说明

Chrome 的 `realtime` 默认设置使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play`
  命令来实现默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建
  `BlackHole 2ch` 音频设备，供 Chrome/Meet 路由使用。

OpenClaw 不内置或重新分发这两个软件包。文档要求用户
通过 Homebrew 将它们作为主机依赖安装。SoX 的许可证为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建的是一个将 BlackHole
与 OpenClaw 一起内置的安装器或 appliance，请审查 BlackHole
上游许可条款，或从 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输会在 Google Chrome 中打开 Meet URL，并以已登录的
Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。
如果已配置，它还会在打开 Chrome 之前运行音频桥接健康检查命令和启动命令。
当 Chrome/音频位于 Gateway 网关主机上时使用 `chrome`；
当 Chrome/音频位于已配对节点（例如 Parallels macOS VM）上时使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 的麦克风和扬声器音频通过本地 OpenClaw 音频桥接进行路由。
如果未安装 `BlackHole 2ch`，加入会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输是一个严格的拨号方案，并委派给 Voice Call 插件。
它不会从 Meet 页面解析电话号码。

当无法使用 Chrome 参会，或者你想要电话拨入作为回退方式时，请使用它。
Google Meet 必须为会议提供电话拨入号码和 PIN；
OpenClaw 不会从 Meet 页面中发现这些信息。

在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

通过环境变量或配置提供 Twilio 凭证。环境变量可以让密钥不出现在 `openclaw.json` 中：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后，重启或重新加载 Gateway 网关；在已运行的 Gateway 网关进程重新加载之前，
插件配置变更不会生效。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委派接线完成后，`googlemeet setup` 会包含成功的
`twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

当会议需要自定义序列时，使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

Google Meet Media API 访问优先使用个人 OAuth 客户端。配置
`oauth.clientId` 以及可选的 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个带有刷新令牌的 `oauth` 配置块。它使用 PKCE、
位于 `http://localhost:8085/oauth2callback` 的 localhost 回调，以及使用 `--manual` 的手动
复制/粘贴流程。

这些环境变量可作为回退方案接受：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

通过 `spaces.get` 解析 Meet URL、代码或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在进行媒体操作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

只有在确认你的 Cloud
项目、OAuth 主体和会议参与者都已加入 Google
Workspace Developer Preview Program 的 Meet 媒体 API 预览后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome `realtime` 路径只需要启用插件、BlackHole、SoX，
以及一个后端实时语音 provider 密钥。默认使用 OpenAI；设置
`realtime.provider: "google"` 可使用 Google Gemini Live：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

在 `plugins.entries.google-meet.config` 下设置插件配置：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

默认值：

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`：`chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录 Meet 的访客
  页面上使用的名称
- `chrome.autoJoin: true`：在 `chrome-node` 上通过 OpenClaw 浏览器自动化尽力完成访客名称填写并点击“立即加入”
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是
  打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，
  然后再触发实时引导
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law
  音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law
  音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短口头回复，
  深层回答使用 `openclaw_agent_consult`
- `realtime.introMessage`：当实时桥接
  连接时进行简短口头就绪检查；将其设为 `""` 可静默加入

可选覆盖项：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

仅使用 Twilio 的配置：

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输时，它会将实际的
PSTN 呼叫和 DTMF 委派给 Voice Call 插件。如果未启用 `voice-call`，
Google Meet 仍然可以验证并记录拨号计划，但无法发起
Twilio 呼叫。

## 工具

智能体可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

当 Chrome 运行在 Gateway 网关主机上时，使用 `transport: "chrome"`。当
Chrome 运行在已配对节点（例如 Parallels
VM）上时，使用 `transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在
Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 可列出活动会话，或检查某个会话 ID。使用
`action: "speak"` 并提供 `sessionId` 和 `message`，可让实时智能体
立即说话。使用 `action: "test_speech"` 可创建或复用会话、
触发一个已知短语，并在 Chrome 主机可报告时返回 `inCall`
健康状态。使用 `action: "leave"` 可将会话标记为已结束。

`status` 在可用时会包含 Chrome 健康状态：

- `inCall`：Chrome 看起来已进入 Meet 通话
- `micMuted`：尽力检测的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器
  配置文件需要手动登录、主持人批准加入、授予权限，或进行浏览器控制修复后语音才能工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接上次收到或发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome `realtime` 模式针对实时语音回路进行了优化。实时语音
provider 会听取会议音频，并通过配置的音频桥接进行发声。
当实时模型需要更深层的推理、当前信息或常规
OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，并携带最近的
会议转录上下文，然后向实时语音会话返回简明的口头回答。
语音模型随后可以将该回答说回会议中。

`realtime.toolPolicy` 控制咨询运行方式：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用正常的
  智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按 Meet 会话范围隔离，因此在同一场会议期间，
后续咨询调用可以复用先前的咨询上下文。

要在 Chrome 完全加入通话后强制执行一次口头就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入并发声冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 在线测试清单

在将会议交给无人值守智能体之前，请使用以下流程：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 `chrome-node` 状态：

- `googlemeet setup` 全部为绿色。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，且 `test-speech` 返回的 Chrome 健康状态中
  `inCall: true`。

对于 Twilio 冒烟测试，请使用一个会公开电话拨入详情的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin` 和
  `twilio-voice-call-credentials` 检查。
- Gateway 网关重新加载后，CLI 中可用 `voicecall`。
- 返回的会话具有 `transport: "twilio"` 和一个 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断被委派的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。
运行中的智能体只能看到当前 Gateway 网关
进程注册的插件工具。

### 没有已连接的具备 Google Meet 能力的节点

在节点主机上运行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 网关主机上，批准节点并验证命令：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

该节点必须处于已连接状态，并列出 `googlemeet.chrome` 以及 `browser.proxy`。
Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

### 浏览器已打开，但智能体无法加入

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果
它报告 `manualActionRequired: true`，请将 `manualActionMessage` 展示给操作员，
并在完成浏览器操作前停止重试。

常见手动操作：

- 登录 Chrome 配置文件。
- 通过 Meet 主持人账号批准访客加入。
- 授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

### 智能体已加入，但不会说话

检查 `realtime` 路径：

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

使用 `mode: "realtime"` 实现收听/回话。`mode: "transcribe"` 按设计
不会启动双向实时语音桥接。

还要验证：

- Gateway 网关主机上有可用的实时 provider 密钥，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主机上可以看到 `BlackHole 2ch`。
- Chrome 主机上存在 `rec` 和 `play`。
- Meet 麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径进行路由。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。
将其添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载
Gateway 网关。

当 Twilio 后端缺少账户
SID、auth token 或主叫号码时，`twilio-voice-call-credentials` 会失败。在 Gateway 网关主机上设置这些值：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

然后重启或重新加载 Gateway 网关，并运行：

```bash
openclaw googlemeet setup
```

### Twilio 呼叫已开始，但始终未进入会议

确认 Meet 事件公开了电话拨入详情。传入准确的拨入
号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果 provider 在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 官方媒体 API 偏向接收，因此向 Meet
通话中发声仍然需要一个参会者路径。该插件让这一边界保持可见：
Chrome 负责浏览器参会和本地音频路由；Twilio 负责
电话拨入参会。

Chrome `realtime` 模式需要以下之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 负责
  实时模型桥接，并在这些
  命令与所选实时语音 provider 之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令负责整个本地
  音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到独立的
虚拟设备，或类似 Loopback 的虚拟设备图。单个共享的
BlackHole 设备可能会把其他参会者的声音回送进通话。

`googlemeet speak` 会触发 Chrome
会话的活动实时音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio
会话，`leave` 还会挂断底层语音呼叫。

## 相关内容

- [Voice call 插件](/zh-CN/plugins/voice-call)
- [Talk mode](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

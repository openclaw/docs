---
read_when:
    - 你希望一个 OpenClaw 智能体加入 Google Meet 通话
    - 你希望一个 OpenClaw 智能体创建新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入指定的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-24T23:09:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c12bc2abf8a9bddc56f1fc281e1f7d628ff10d1bcfc99541cd7a085eac017544
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 的 Google Meet 参会支持——该插件是按显式设计构建的：

- 它只加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建一个新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深层的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 智能体使用 `mode` 选择加入行为：实时收听/回话使用 `realtime`，加入/控制浏览器但不启用实时语音桥接则使用 `transcribe`。
- 认证起始方式可以是个人 Google OAuth，或一个已经登录的 Chrome 配置文件。
- 没有自动同意提示公告。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受一个拨入号码，以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流使用。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音提供商。OpenAI 是默认选项；Google Gemini Live 也可用于
`realtime.provider: "google"`：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启后，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项是否就绪：

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

该设置输出旨在供智能体读取。它会报告 Chrome 配置文件、音频桥接、节点固定、延迟的实时引导，以及在配置了 Twilio 委派时，`voice-call` 插件和 Twilio 凭证是否已就绪。
在要求智能体加入之前，将任何 `ok: false` 检查都视为阻塞项。
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

创建一个新会议，然后加入：

```bash
openclaw googlemeet create
openclaw googlemeet join https://meet.google.com/new-abcd-xyz --transport chrome-node
```

`googlemeet create` 有两条路径：

- API 创建：当已配置 Google Meet OAuth 凭证时使用。这是最确定性的路径，不依赖浏览器 UI 状态。
- 浏览器回退：当 OAuth 凭证缺失时使用。OpenClaw 会使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件已经登录 Google。浏览器自动化会处理 Meet 自身的首次麦克风提示；该提示不会被视为 Google 登录失败。

命令输出包含一个 `source` 字段（`api` 或 `browser`），这样智能体就可以说明使用了哪条路径。

或者告诉智能体：“创建一个 Google Meet，用实时语音加入它，然后把链接发给我。” 智能体应先使用 `action: "create"` 调用 `google_meet`，复制返回的 `meetingUri`，然后再使用 `action: "join"` 和该 URL 调用 `google_meet`。

```json
{
  "action": "create"
}
```

```json
{
  "action": "join",
  "url": "https://meet.google.com/new-abcd-xyz",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

如果是仅观察/浏览器控制的加入，请设置 `"mode": "transcribe"`。这不会启动双向实时模型桥接，因此它不会在会议中回话。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，为 OpenClaw 使用的麦克风/扬声器路径选择 `BlackHole 2ch`。若要获得干净的双向音频，请使用独立的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备足以完成首次冒烟测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或配置模型 API 密钥，仅仅为了让 VM 承载 Chrome。你可以在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。只需在 VM 中启用一次内置插件，这样节点就会通告 Chrome 命令：

各部分运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥，或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，这样 macOS 才会暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 能看到音频设备和 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

在 VM 中安装或更新 OpenClaw，然后在其中启用内置插件：

```bash
openclaw plugins enable google-meet
```

在 VM 中启动节点主机：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是局域网 IP，并且你未使用 TLS，那么除非你为该受信任的私有网络显式启用，否则节点会拒绝明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时，也要使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，不是 `openclaw.json` 设置。`openclaw node install` 会在安装命令中存在该变量时，将其存储到 LaunchAgent 环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能看到该节点，并且它同时通告了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

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

现在可以像平常一样从 Gateway 网关主机加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体使用 `google_meet` 工具，并设置 `transport: "chrome-node"`。

如果要运行一个单命令冒烟测试，用于创建或复用会话、说出一段已知短语并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在加入过程中，OpenClaw 浏览器自动化会填写访客姓名、点击加入/请求加入，并在出现该提示时接受 Meet 的首次“使用麦克风”选择。在仅通过浏览器创建会议期间，如果 Meet 没有暴露使用麦克风按钮，它也可以在不使用麦克风的情况下继续通过相同提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限，或 Meet 卡在自动化无法解决的提示上，那么 join/test-speech 结果会报告
`manualActionRequired: true`，并附带 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，报告该确切消息以及当前的 `browserUrl`/`browserTitle`，并且只在手动浏览器操作完成后再重试。

如果省略 `chromeNode.node`，只有在恰好有一个已连接节点同时通告 `googlemeet.chrome` 和浏览器控制时，OpenClaw 才会自动选择。
如果连接了多个具备能力的节点，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见故障检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。另外还要确认 Gateway 网关主机允许这两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 可以打开但无法加入：在 VM 中登录浏览器配置文件，或者保留 `chrome.guestName` 用于访客加入。访客自动加入通过节点浏览器代理使用 OpenClaw 浏览器自动化；请确保节点浏览器配置指向你想使用的配置文件，例如
  `browser.defaultProfile: "user"` 或某个已命名的 existing-session 配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会在打开新标签页之前，为相同 Meet URL 激活现有标签页；浏览器创建会议时，也会在打开新标签页之前复用进行中的 `https://meet.google.com/new` 或 Google 账户提示标签页。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；若要获得干净的双向音频，请使用独立的虚拟设备或类似 Loopback 的路由方式。

## 安装说明

Chrome 实时默认配置会使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play` 命令来实现默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch` 音频设备，供 Chrome/Meet 路由使用。

OpenClaw 不内置，也不重新分发这两个软件包。文档要求用户通过 Homebrew 将它们作为主机依赖安装。SoX 的许可证为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建的是一个将 BlackHole 与 OpenClaw 一起打包的安装程序或设备，请审查 BlackHole 上游许可证条款，或向 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 前运行音频桥接健康检查命令和启动命令。当 Chrome/音频运行在 Gateway 网关主机上时，请使用 `chrome`；当 Chrome/音频运行在已配对节点上（例如 Parallels macOS VM）时，请使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接来路由 Chrome 麦克风和扬声器音频。如果未安装 `BlackHole 2ch`，加入会以设置错误失败，而不是静默地在没有音频路径的情况下加入。

### Twilio

Twilio 传输方式是一个严格的拨号计划，由 Voice Call 插件委派执行。它不会解析 Meet 页面中的电话号码。

当无法使用 Chrome 参会，或者你想使用电话拨入作为后备方案时，请使用此方式。Google Meet 必须为该会议暴露电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面中发现这些信息。

请在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 或者设置为 "twilio"，如果应将 Twilio 作为默认选项
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

通过环境变量或配置提供 Twilio 凭证。环境变量可以将密钥保留在 `openclaw.json` 之外：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后，重启或重新加载 Gateway 网关；在 Gateway 网关进程重新加载之前，插件配置更改不会出现在已运行的 Gateway 网关进程中。

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

如果会议需要自定义序列，请使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

OAuth 对于创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你需要正式的 API 创建、空间解析或 Meet Media API 预检时，请配置 OAuth。

Google Meet API 访问优先使用个人 OAuth 客户端。配置
`oauth.clientId`，并可选配置 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个带刷新令牌的 `oauth` 配置块。它使用 PKCE、本地主机回调 `http://localhost:8085/oauth2callback`，并通过 `--manual` 提供手动复制/粘贴流程。

OAuth 同意范围包括 Meet 空间创建、Meet 空间读取权限以及 Meet 会议媒体读取权限。如果你是在支持会议创建之前完成认证的，请重新运行 `openclaw googlemeet auth login --json`，以便刷新令牌具备 `meetings.space.created` scope。

浏览器回退不需要 OAuth 凭证。在该模式下，Google 认证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

支持以下环境变量作为回退值：

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

在媒体工作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri` 和来源。使用 OAuth 凭证时，它会使用正式的 Google Meet API。没有 OAuth 凭证时，它会回退为使用固定 Chrome 节点上已登录的浏览器配置文件。智能体可以使用带 `action: "create"` 的 `google_meet` 工具来创建会议，然后使用返回的 `meetingUri` 通过 `action: "join"` 调用。

浏览器回退的 JSON 输出示例：

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  }
}
```

API 创建的 JSON 输出示例：

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  }
}
```

创建 Meet 只会创建或发现会议 URL。`chrome` 或 `chrome-node` 传输方式仍然需要一个已登录 Google 的 Chrome 配置文件，才能通过浏览器加入。如果该配置文件已登出，OpenClaw 会报告
`manualActionRequired: true` 或浏览器回退错误，并要求操作员在重试前完成 Google 登录。

只有在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入 Google Workspace Developer Preview Program for Meet media APIs 之后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 实时路径只需要启用插件、安装 BlackHole、SoX，以及提供一个后端实时语音提供商密钥。OpenAI 是默认选项；设置
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
- `chromeNode.node`：`chrome-node` 可选的节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在已登出 Meet 访客界面中使用的名称
- `chrome.autoJoin: true`：通过 OpenClaw 浏览器自动化在 `chrome-node` 上尽力填写访客名并点击立即加入
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：在触发实时引导前，等待 Meet 标签页报告已在通话中
- `chrome.audioInputCommand`：SoX `rec` 命令，将 8 kHz G.711 mu-law 音频写入 stdout
- `chrome.audioOutputCommand`：SoX `play` 命令，从 stdin 读取 8 kHz G.711 mu-law 音频
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短口头回复，较深入的回答使用
  `openclaw_agent_consult`
- `realtime.introMessage`：实时桥接连接时的简短口头就绪检查；将其设置为 `""` 可静默加入

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
    introMessage: "准确地说：我到了。",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

仅 Twilio 配置：

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输时，它会将实际的 PSTN 呼叫和 DTMF 委派给 Voice Call 插件。如果未启用 `voice-call`，Google Meet 仍然可以验证并记录拨号计划，但无法发起 Twilio 呼叫。

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

当 Chrome 在 Gateway 网关主机上运行时，使用 `transport: "chrome"`。当 Chrome 在已配对节点上运行时，例如 Parallels VM，请使用
`transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 可列出活动会话或检查某个会话 ID。使用带 `sessionId` 和 `message` 的 `action: "speak"` 可让实时智能体立即发言。使用 `action: "test_speech"` 可创建或复用会话、触发一段已知短语，并在 Chrome 主机可报告时返回 `inCall` 健康状态。使用 `action: "leave"` 可将会话标记为已结束。

`status` 在可用时包含 Chrome 健康信息：

- `inCall`：Chrome 看起来已进入 Meet 通话
- `micMuted`：尽力检测的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限授予，或浏览器控制修复，发言功能才能正常工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接最近一次收到或发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "准确地说：我到了，而且正在听。"
}
```

## 实时智能体咨询

Chrome 实时模式针对实时语音循环进行了优化。实时语音提供商会听取会议音频，并通过配置的音频桥接发声。当实时模型需要更深入的推理、最新信息或普通 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，结合最近的会议转录上下文，并向实时语音会话返回简洁的口头回答。随后语音模型就可以将该回答说回会议中。它与 Voice Call 共用同一个实时咨询工具。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按每个 Meet 会话进行作用域划分，因此在同一场会议期间，后续咨询调用可以复用先前的咨询上下文。

要在 Chrome 完全加入通话后强制执行一次口头就绪检查：

```bash
openclaw googlemeet speak meet_... "准确地说：我到了，而且正在听。"
```

如果要执行完整的加入并发言冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "准确地说：我到了，而且正在听。"
```

## 实时测试检查清单

在将会议交给无人值守智能体之前，请使用以下顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "准确地说：Google Meet 发言测试完成。"
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页已加入通话，并且 `test-speech` 返回带有 `inCall: true` 的 Chrome 健康状态。

如果是 Twilio 冒烟测试，请使用一个会暴露电话拨入详情的会议：

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
- `googlemeet leave <sessionId>` 会挂断已委派的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。
正在运行的智能体只能看到当前 Gateway 网关进程已注册的插件工具。

### 没有已连接的 Google Meet 能力节点

在节点主机上，运行：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 网关主机上，批准该节点并验证命令：

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

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它报告
`manualActionRequired: true`，请向操作员展示 `manualActionMessage`，并在浏览器操作完成前停止重试。

常见的手动操作：

- 登录 Chrome 配置文件。
- 从 Meet 主持人账户准入访客。
- 当出现 Chrome 原生权限提示时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示“你希望会议中的其他人听到你的声音吗？”就报告“未登录”。那是 Meet 的音频选择过渡界面；OpenClaw 会在可用时通过浏览器自动化点击**使用麦克风**，并继续等待真正的会议状态。对于仅创建的浏览器回退，OpenClaw 可能会点击**不使用麦克风继续**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

当配置了 OAuth 凭证时，`googlemeet create` 会首先使用 Google Meet API 的 `spaces.create` 端点。没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持之后签发的。较旧的令牌可能缺少 `meetings.space.created` scope；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 和
  `chromeNode.node` 指向一个已连接节点，并且该节点具备 `browser.proxy` 和
  `googlemeet.chrome`。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会在打开新标签页之前复用现有的 `https://meet.google.com/new` 或 Google 账户提示标签页。如果智能体超时，请重试该工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果 Meet 显示“你希望会议中的其他人听到你的声音吗？”，请保持该标签页打开。OpenClaw 应通过浏览器自动化点击**使用麦克风**，或在仅创建回退场景下点击**不使用麦克风继续**，并继续等待生成的 Meet URL。如果无法继续，错误中应提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体加入了，但没有说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

若要实现收听/回话，请使用 `mode: "realtime"`。`mode: "transcribe"` 是刻意不启动双向实时语音桥接的。

同时还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主机上可以看到 `BlackHole 2ch`。
- Chrome 主机上存在 `rec` 和 `play`。
- Meet 麦克风和扬声器通过 OpenClaw 使用的虚拟音频路径进行路由。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。
将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载 Gateway 网关。

当 Twilio 后端缺少 account SID、auth token 或 caller number 时，
`twilio-voice-call-credentials` 会失败。在 Gateway 网关主机上设置这些值：

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

确认 Meet 事件暴露了电话拨入详情。传入准确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 的官方媒体 API 偏向接收，因此要在 Meet 通话中发言，仍然需要一个参会路径。该插件让这个边界保持可见：
Chrome 处理浏览器参会和本地音频路由；Twilio 处理电话拨入参会。

Chrome 实时模式需要以下其中之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 接管实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令接管整个本地音频路径，并且必须在启动或验证其守护进程后退出。

若要获得干净的双向音频，请将 Meet 输出和 Meet 麦克风路由到独立的虚拟设备，或使用类似 Loopback 的虚拟设备图。单个共享的 BlackHole 设备可能会将其他参与者的声音回送进通话中。

`googlemeet speak` 会为一个 Chrome 会话触发活动的实时音频桥接。
`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 还会挂断底层语音呼叫。

## 相关内容

- [Voice call 插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

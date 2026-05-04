---
read_when:
    - 你希望一个 OpenClaw 智能体加入 Google Meet 通话
    - 你希望 OpenClaw 智能体创建新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输协议
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入显式 Meet URL，并使用智能体回话默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-05-04T04:47:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9caeb2d4540b833c75cd0f3b5f61a99f0a6bb16ca71a96011d25e4ea103a4601
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 参与者支持适用于 OpenClaw，插件按设计是显式的：

- 它只会加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建新的 Meet 空间，然后加入返回的 URL。
- `agent` 是默认的回话模式：实时转录会监听，已配置的 OpenClaw 智能体会回答，常规 OpenClaw TTS 会在 Meet 中发声。
- `bidi` 仍可作为备用的直接实时语音模型模式使用。
- 智能体通过 `mode` 选择加入行为：使用 `agent` 进行实时监听/回话，使用 `bidi` 作为直接实时语音备用模式，或使用 `transcribe` 加入/控制浏览器但不启用回话桥接。
- 身份验证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 不会自动播报同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列；它不能直接拨打 Meet URL。
- CLI 命令是 `googlemeet`；`meet` 保留用于更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，并配置实时转录提供商和常规 OpenClaw TTS。OpenAI 是默认转录提供商；Google Gemini Live 也可作为单独的 `bidi` 语音备用方案，配合 `realtime.voiceProvider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装器需要重启后，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证两个组件：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

启用插件：

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

设置输出旨在便于智能体读取，并且感知模式。它会报告 Chrome 配置文件、节点固定状态，以及在实时 Chrome 加入场景下报告 BlackHole/SoX 音频桥接和延迟实时开场检查。对于仅观察加入，请使用 `--mode transcribe` 检查同一传输；该模式会跳过实时音频前置条件，因为它不会通过桥接监听或发声：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

配置 Twilio 委托后，设置还会报告 `voice-call` 插件、Twilio 凭据和公开 webhook 暴露是否就绪。在请求智能体加入之前，应将任何 `ok: false` 检查视为所检查传输和模式的阻塞项。使用 `openclaw googlemeet setup --json` 获取脚本或机器可读输出。在智能体尝试之前，使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 对特定传输进行预检。

对于 Twilio，当默认传输是 Chrome 时，始终显式预检传输：

```bash
openclaw googlemeet setup --transport twilio
```

这会在智能体尝试拨入会议前捕获缺失的 `voice-call` 接线、Twilio 凭据或无法访问的 webhook 暴露。

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
  "mode": "agent"
}
```

面向智能体的 `google_meet` 工具在非 macOS 主机上仍可用于工件、日历、设置、转录、Twilio 和 `chrome-node` 流程。本地 Chrome 回话操作在这些主机上会被阻止，因为内置的 Chrome 音频路径目前依赖 macOS `BlackHole 2ch`。在 Linux 上，使用 `mode: "transcribe"`、Twilio 拨入，或使用 macOS `chrome-node` 主机参与 Chrome 回话。

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

对于通过 API 创建的房间，当你希望房间的免敲门策略显式设置而不是继承自 Google 账号默认值时，请使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` 允许任何拥有 Meet URL 的人无需敲门即可加入。`TRUSTED` 允许主持组织的受信任用户、受邀外部用户和拨入用户无需敲门即可加入。`RESTRICTED` 将免敲门进入限制为受邀者。这些设置只适用于官方 Google Meet API 创建路径，因此必须配置 OAuth 凭据。

如果你在此选项可用之前已完成 Google Meet 身份验证，请在将 `meetings.space.settings` 作用域添加到你的 Google OAuth 同意屏幕后，重新运行 `openclaw googlemeet auth login --json`。

仅创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：在已配置 Google Meet OAuth 凭据时使用。这是最确定性的路径，不依赖浏览器 UI 状态。
- 浏览器备用路径：在没有 OAuth 凭据时使用。OpenClaw 使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件已登录 Google。浏览器自动化会处理 Meet 自己的首次运行麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程还会先尝试复用现有 Meet 标签页，再打开新标签页。匹配会忽略无害的 URL 查询字符串，例如 `authuser`，因此智能体重试时应聚焦已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含 `source` 字段（`api` 或 `browser`），因此智能体可以说明使用了哪条路径。`create` 默认加入新会议，并返回 `joined: true` 以及加入会话。若只生成 URL，请在 CLI 中使用 `create --no-join`，或向工具传递 `"join": false`。

或者告诉智能体：“创建一个 Google Meet，使用智能体回话模式加入，并把链接发给我。” 智能体应使用 `action: "create"` 调用 `google_meet`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

对于仅观察/浏览器控制加入，请设置 `"mode": "transcribe"`。这不会启动双工实时语音桥接，不需要 BlackHole 或 SoX，也不会在会议中回话。此模式下的 Chrome 加入还会避免 OpenClaw 的麦克风/摄像头权限授予，并避免 Meet **使用麦克风**路径。如果 Meet 显示音频选择插页，自动化会尝试无麦克风路径，否则报告需要手动操作，而不会打开本地麦克风。在转录模式下，托管 Chrome 传输还会安装尽力而为的 Meet 字幕观察器。`googlemeet status --json` 和 `googlemeet doctor` 会显示 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`，以及简短的 `recentTranscript` 尾部，以便操作员判断浏览器是否已加入通话，以及 Meet 字幕是否正在产生文本。
当你需要是/否探测时，请使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：它会以转录模式加入，等待新的字幕或转录变化，并返回 `listenVerified`、`listenTimedOut`、手动操作字段以及最新字幕健康状态。

实时会话期间，`google_meet` Status 包含浏览器和音频桥接健康状态，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近输入/输出时间戳、字节计数器和桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可行时处理。登录、主持人准入和浏览器/操作系统权限提示会作为手动操作报告，并附带原因和消息，供智能体转述。托管 Chrome 会话只有在浏览器健康状态报告 `inCall: true` 后才会发出开场语或测试短语；否则 Status 会报告 `speechReady: false`，并阻止发声尝试，而不是假装智能体已在会议中发言。

本地 Chrome 通过已登录的 OpenClaw 浏览器配置文件加入。实时模式需要 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的图；单个 BlackHole 设备足以进行首次冒烟测试，但可能产生回声。

### 本地 Gateway 网关 + Parallels Chrome

仅为了让 VM 拥有 Chrome，你**不**需要在 macOS VM 内运行完整的 OpenClaw Gateway 网关或配置模型 API key。在本地运行 Gateway 网关和智能体，然后在 VM 中运行节点主机。在 VM 上启用一次内置插件，以便节点通告 Chrome 命令：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、Agent 工作区、模型/API key、实时提供商和 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT key 或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，让 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 可以看到音频设备和 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中安装或更新 OpenClaw，然后在那里启用内置插件：

```bash
openclaw plugins enable google-meet
```

在 VM 中启动节点主机：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是 LAN IP 且你未使用 TLS，除非你为该受信任私有网络显式选择加入，否则节点会拒绝明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时使用同一环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境变量，不是 `openclaw.json` 设置。`openclaw node install` 会在安装命令中存在该变量时，将其存储在 LaunchAgent 环境中。

从 Gateway 网关主机批准节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关可以看到节点，并且节点通告了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

```bash
openclaw nodes status
```

在 Gateway 网关主机上将 Meet 路由到该节点：

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

或要求智能体使用带有 `transport: "chrome-node"` 的 `google_meet` 工具。

对于一条命令完成的冒烟测试，它会创建或复用会话、说出已知短语，并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

实时加入期间，OpenClaw 浏览器自动化会填写访客名称，点击
Join/Ask to join，并在 Meet 的首次运行 “Use microphone” 选项提示出现时接受它。在仅观察加入或仅浏览器创建会议期间，当同一提示提供无麦克风选项时，它会继续跳过该提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、
Chrome 需要麦克风/摄像头权限才能进行实时加入，或 Meet 卡在自动化无法解决的提示上，加入/测试语音结果会报告
`manualActionRequired: true`，并带有 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，报告该准确消息以及当前的
`browserUrl`/`browserTitle`，并且只在手动浏览器操作完成后重试。

如果省略 `chromeNode.node`，OpenClaw 只会在恰好有一个已连接节点同时声明
`googlemeet.chrome` 和浏览器控制能力时自动选择。如果连接了多个具备能力的节点，请将
`chromeNode.node` 设置为节点 ID、显示名称或远程 IP。

常见失败检查：

- `Configured Google Meet node ... is not usable: offline`：固定节点已被
  Gateway 网关知道但不可用。智能体应将该节点视为诊断状态，而不是可用的
  Chrome 主机，并报告设置阻塞项，而不是回退到另一种传输协议，除非用户要求这样做。
- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，
  批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。同时确认
  Gateway 网关主机允许两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被检查的主机上安装
  `blackhole-2ch`，并在使用本地 Chrome 音频前重启。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装
  `blackhole-2ch`，并重启 VM。
- Chrome 打开但无法加入：登录 VM 内的浏览器配置文件，或保留
  `chrome.guestName` 以进行访客加入。访客自动加入会通过节点浏览器代理使用
  OpenClaw 浏览器自动化；请确保节点浏览器配置指向你想要的配置文件，例如
  `browser.defaultProfile: "user"` 或命名的现有会话配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw
  会在打开新标签页前激活同一 Meet URL 的现有标签页，并且浏览器会议创建会在打开另一个标签页前复用正在进行的
  `https://meet.google.com/new` 或 Google 账号提示标签页。
- 无音频：在 Meet 中，将麦克风/扬声器通过 OpenClaw 使用的虚拟音频设备路径路由；使用单独的虚拟设备或类似
  Loopback 的路由来获得干净的双工音频。

## 安装说明

Chrome 回传默认使用两个外部工具：

- `sox`：命令行音频工具。该插件为默认 24 kHz PCM16 音频桥接使用显式
  CoreAudio 设备命令。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 Chrome/Meet 可路由经过的
  `BlackHole 2ch` 音频设备。

OpenClaw 不捆绑或再分发任一软件包。文档要求用户通过 Homebrew 将它们作为主机依赖安装。SoX 许可证为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建的安装器或设备将
BlackHole 与 OpenClaw 捆绑，请审查 BlackHole 的上游许可条款，或从 Existential Audio 获取单独许可证。

## 传输协议

### Chrome

Chrome 传输协议通过 OpenClaw 浏览器控制打开 Meet URL，并以已登录的
OpenClaw 浏览器配置文件身份加入。在 macOS 上，插件会在启动前检查
`BlackHole 2ch`。如果已配置，它还会在打开 Chrome 前运行音频桥接健康命令和启动命令。当
Chrome/音频位于 Gateway 网关主机上时使用 `chrome`；当 Chrome/音频位于已配对节点（例如
Parallels macOS VM）上时使用 `chrome-node`。对于本地 Chrome，请用
`browser.defaultProfile` 选择配置文件；`chrome.browserProfile` 会传递给
`chrome-node` 主机。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接路由 Chrome 麦克风和扬声器音频。如果未安装
`BlackHole 2ch`，加入会以设置错误失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输协议是委托给 Voice Call 插件的严格拨号计划。它不会解析
Meet 页面来获取电话号码。

当无法使用 Chrome 参与，或你想要电话拨入回退时使用此方式。Google Meet 必须为会议公开电话拨入号码和
PIN；OpenClaw 不会从 Meet 页面发现这些信息。

在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

通过环境或配置提供 Twilio 凭据。环境可让密钥不进入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果那是你的实时语音提供商，请改用 `realtime.provider: "openai"` 搭配
OpenAI provider 插件和 `OPENAI_API_KEY`。

启用 `voice-call` 后重启或重新加载 Gateway 网关；插件配置变更不会出现在已经运行的
Gateway 网关进程中，直到它重新加载。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委托已接好时，`googlemeet setup` 会包含成功的
`twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和
`twilio-voice-call-webhook` 检查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

当会议需要自定义序列时使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

OAuth 对创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你需要官方
API 创建、空间解析或 Meet Media API 预检检查时，请配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建 Google Cloud OAuth 客户端，请求所需作用域，授权一个
Google 账号，然后将生成的刷新令牌存储在 Google Meet 插件配置中，或提供
`OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不会替代 Chrome 加入路径。当你使用浏览器参与时，Chrome 和 Chrome-node 传输协议仍会通过已登录的
Chrome 配置文件、BlackHole/SoX 以及已连接节点加入。OAuth 仅用于官方
Google Meet API 路径：创建会议空间、解析空间，并运行 Meet Media API 预检检查。

### 创建 Google 凭据

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - **Internal** 对 Google Workspace 组织最简单。
   - **External** 适用于个人/测试设置；当应用处于 Testing 状态时，将每个会授权该应用的
     Google 账号添加为测试用户。
4. 添加 OpenClaw 请求的作用域：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建 OAuth 客户端 ID。
   - 应用类型：**Web application**。
   - 已获授权的重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

`meetings.space.created` 是 Google Meet `spaces.create` 所必需的。
`meetings.space.readonly` 让 OpenClaw 能够将 Meet URL/代码解析为空间。
`meetings.space.settings` 让 OpenClaw 能够在 API 房间创建期间传递
`SpaceConfig` 设置，例如 `accessType`。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体工作；Google 可能要求为实际
Media API 使用加入 Developer Preview。如果你只需要基于浏览器的
Chrome 加入，可以完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId`，并可选配置 `oauth.clientSecret`，或将它们作为环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印包含刷新令牌的 `oauth` 配置块。它使用 PKCE、`http://localhost:8085/oauth2callback` 上的
localhost 回调，以及通过 `--manual` 的手动复制/粘贴流程。

示例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

当浏览器无法访问本地回调时使用手动模式：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 输出包括：

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

将 `oauth` 对象存储在 Google Meet 插件配置下：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

当你不想在配置中放入刷新令牌时，优先使用环境变量。如果配置和环境值都存在，插件会先解析配置，然后再回退到环境。

OAuth 同意包含 Meet 空间创建、Meet 空间读取访问和 Meet 会议媒体读取访问。如果你在会议创建支持存在之前已完成身份验证，请重新运行
`openclaw googlemeet auth login --json`，以便刷新令牌具备
`meetings.space.created` 作用域。

### 使用 Doctor 验证 OAuth

当你想要快速、非密钥的健康检查时，运行 OAuth Doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不需要已连接的 Chrome 节点。它会检查 OAuth 配置是否存在，以及刷新令牌是否可以生成访问令牌。JSON 报告仅包含状态字段，例如
`ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息；它不会打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查                | 含义                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或缓存的访问令牌。       |
| `oauth-token`        | 缓存的访问令牌仍然有效，或刷新令牌已签发新的访问令牌。 |
| `meet-spaces-get`    | 可选的 `--meeting` 检查已解析现有的 Meet 空间。                             |
| `meet-spaces-create` | 可选的 `--create-space` 检查已创建新的 Meet 空间。                               |

若还要证明 Google Meet API 已启用以及 `spaces.create` 范围可用，请运行有副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性的 Meet URL。当你需要确认 Google Cloud 项目已启用 Meet API，并且已授权账号拥有 `meetings.space.created` 范围时使用它。

若要证明对现有会议空间的读取访问权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 可证明对已授权 Google 账号可访问的现有空间具有读取访问权限。这些检查返回 `403` 通常表示 Google Meet REST API 已禁用、已同意授权的刷新令牌缺少所需范围，或 Google 账号无法访问该 Meet 空间。刷新令牌错误表示需要重新运行 `openclaw googlemeet auth login
--json`，并存储新的 `oauth` 块。

浏览器回退不需要 OAuth 凭据。在该模式下，Google 身份验证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

这些环境变量可作为回退：

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

在处理媒体前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 创建会议记录后，列出会议工件和出席情况：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录。当你需要该会议的所有保留记录时，传入 `--all-conference-records`。

Calendar 查询可在读取 Meet 工件前，从 Google Calendar 解析会议 URL：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索带有 Google Meet 链接的 Calendar 事件。使用 `--event <query>` 搜索匹配的事件文本，并使用 `--calendar <id>` 指定非主日历。Calendar 查询需要包含 Calendar events readonly 范围的新 OAuth 登录。
`calendar-events` 会预览匹配的 Meet 事件，并标记 `latest`、`artifacts`、`attendance` 或 `export` 将选择的事件。

如果你已经知道会议记录 ID，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

当你想在通话后关闭房间时，可结束 API 创建空间中的活动会议：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

这会调用 Google Meet `spaces.endActiveConference`，并且对于已授权账号可管理的空间，需要带有 `meetings.space.created` 范围的 OAuth。
OpenClaw 接受 Meet URL、会议代码或 `spaces/{id}` 输入，并在结束活动会议前将其解析为 API 空间资源。
它独立于 `googlemeet leave`：`leave` 会停止 OpenClaw 的本地/会话参与，而 `end-active-conference` 会请求 Google Meet 结束该空间的活动会议。

写入可读报告：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` 会在 Google 为会议公开相关内容时，返回会议记录元数据，以及参与者、录制文件、转录稿、结构化转录条目和智能笔记资源元数据。使用 `--no-transcript-entries` 可跳过大型会议的条目查询。`attendance` 会将参与者展开为参与者会话行，其中包含首次/最后出现时间、总会话时长、迟到/提前离开标记，并按已登录用户或显示名称合并重复的参与者资源。传入 `--no-merge-duplicates` 可保持原始参与者资源分离，传入 `--late-after-minutes` 可调整迟到检测，传入 `--early-before-minutes` 可调整提前离开检测。

`export` 会写入一个文件夹，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用过的 Calendar 事件，以及任何部分检索警告。传入 `--zip` 还会在文件夹旁边写入一个可移植归档。传入 `--include-doc-bodies` 可通过 Google Drive `files.export` 导出链接的转录稿和智能笔记 Google Docs 文本；这需要一次新的 OAuth 登录，并包含 Drive Meet 只读范围。没有 `--include-doc-bodies` 时，导出仅包含 Meet 元数据和结构化转录条目。如果 Google 返回部分工件失败，例如智能笔记列表、转录条目或 Drive 文档正文错误，摘要和清单会保留警告，而不是让整个导出失败。
使用 `--dry-run` 可获取相同的工件/出勤数据并打印清单 JSON，而不创建文件夹或 ZIP。这在写入大型导出前，或当智能体只需要计数、所选记录和警告时很有用。

智能体也可以通过 `google_meet` 工具创建同一个包：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

设置 `"dryRun": true` 可仅返回导出清单并跳过文件写入。

智能体也可以创建一个由 API 支持、带显式访问策略的房间：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

并且它们可以结束已知房间的活动会议：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

对于先监听验证，智能体应先使用 `test_listen`，再声称该会议有用：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

针对真实保留会议运行受保护的实时冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

针对有人会发言且 Meet 字幕可用的会议运行实时先监听浏览器探测：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

实时冒烟环境：

- `OPENCLAW_LIVE_TEST=1` 启用受保护的实时测试。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代码或 `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth client id。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供刷新令牌。
- 可选：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和 `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用不带 `OPENCLAW_` 前缀的相同回退名称。

基础工件/出勤实时冒烟测试需要 `https://www.googleapis.com/auth/meetings.space.readonly` 和 `https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar 查询需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文档正文导出需要 `https://www.googleapis.com/auth/drive.meet.readonly`。

创建新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。使用 OAuth 凭证时，它会使用官方 Google Meet API。没有 OAuth 凭证时，它会使用固定 Chrome 节点中已登录的浏览器配置文件作为回退。智能体可以使用带有 `action: "create"` 的 `google_meet` 工具一步完成创建和加入。对于仅创建 URL，传入 `"join": false`。

来自浏览器回退的 JSON 输出示例：

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

如果浏览器回退在创建 URL 前遇到 Google 登录或 Meet 权限阻断，Gateway 网关方法会返回失败响应，而 `google_meet` 工具会返回结构化详情，而不是纯字符串：

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

当智能体看到 `manualActionRequired: true` 时，它应报告 `manualActionMessage` 以及浏览器节点/标签页上下文，并停止打开新的 Meet 标签页，直到操作员完成浏览器步骤。

来自 API 创建的 JSON 输出示例：

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

创建 Meet 默认会加入会议。Chrome 或 Chrome-node 传输协议仍然
需要已登录的 Google Chrome 配置文件，才能通过浏览器加入。如果该
配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或
浏览器回退错误，并要求操作者完成 Google 登录后再重试。

仅在确认你的 Cloud 项目、OAuth 主体和会议参与者已加入 Google
Workspace Developer Preview Program for Meet media APIs 后，才设置
`preview.enrollmentAcknowledged: true`。

## 配置

通用 Chrome 智能体路径只需要启用插件、BlackHole、SoX、一个
实时转录提供商密钥，以及一个已配置的 OpenClaw TTS 提供商。
OpenAI 是默认转录提供商；将 `realtime.voiceProvider` 设为
`"google"`，并设置 `realtime.model`，即可在 `bidi` 模式下使用
Google Gemini Live，而无需更改默认智能体模式转录提供商：

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
- `defaultMode: "agent"`（`"realtime"` 仅作为 `"agent"` 的旧版
  兼容别名被接受；新的工具调用应使用 `"agent"`）
- `chromeNode.node`：可选的 `chrome-node` 节点 ID/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录的 Meet 访客
  屏幕上使用的名称
- `chrome.autoJoin: true`：通过 `chrome-node` 上的 OpenClaw 浏览器自动化，
  尽力填写访客名称并点击“立即加入”
- `chrome.reuseExistingTab: true`：激活已有的 Meet 标签页，而不是
  打开重复标签页
- `chrome.waitForInCallMs: 20000`：在触发回话开场前，等待 Meet 标签页
  报告已进入通话
- `chrome.audioFormat: "pcm16-24khz"`：命令对音频格式。仅对仍然输出
  电话音频的旧版/自定义命令对使用 `"g711-ulaw-8khz"`。
- `chrome.audioBufferBytes: 4096`：用于生成的 Chrome 命令对音频命令的
  SoX 处理缓冲区。这是 SoX 默认 8192 字节缓冲区的一半，可降低默认管道
  延迟，同时在繁忙主机上保留增大空间。低于 SoX 最小值的值会被钳制为
  17 字节。
- `chrome.audioInputCommand`：从 CoreAudio `BlackHole 2ch` 读取并以
  `chrome.audioFormat` 写入音频的 SoX 命令
- `chrome.audioOutputCommand`：读取 `chrome.audioFormat` 音频并写入
  CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：可选的本地麦克风命令，在助手播放处于
  活跃状态时，写入有符号 16 位小端单声道 PCM，用于检测人工插话。当前
  适用于 Gateway 网关托管的 `chrome` 命令对桥接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上
  计为人工打断的 RMS 电平
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上
  计为人工打断的峰值电平
- `chrome.bargeInCooldownMs: 900`：重复清除人工打断之间的最小延迟
- `mode: "agent"`：默认回话模式。参与者语音由已配置的实时转录提供商转录，
  发送到每个会议子智能体会话中的已配置 OpenClaw 智能体，并通过正常的
  OpenClaw TTS 运行时回放。
- `mode: "bidi"`：回退的直接双向实时模型模式。实时语音提供商直接回答
  参与者语音，并可调用 `openclaw_agent_consult` 获取更深入/工具支持的答案。
- `mode: "transcribe"`：无回话桥接的仅观察模式。
- `realtime.provider: "openai"`：当下面的作用域提供商字段未设置时使用的
  兼容回退。
- `realtime.transcriptionProvider: "openai"`：`agent` 模式用于实时转录的
  提供商 ID。
- `realtime.voiceProvider`：`bidi` 模式用于直接实时语音的提供商 ID。将其
  设为 `"google"` 可使用 Gemini Live，同时让智能体模式转录继续使用
  OpenAI。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的语音回复，并使用
  `openclaw_agent_consult` 获取更深入的答案
- `realtime.introMessage`：实时桥接连接时的简短语音就绪检查；将其设为
  `""` 可静默加入
- `realtime.agentId`：用于 `openclaw_agent_consult` 的可选 OpenClaw
  智能体 ID；默认为 `main`

可选覆盖项：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输协议时，它会将实际的
PSTN 呼叫、DTMF 和开场问候委托给 Voice Call 插件。Voice Call 会先播放
DTMF 序列，再打开实时媒体流，然后将保存的开场文本用作初始实时问候。如果
未启用 `voice-call`，Google Meet 仍可验证并记录拨号计划，但无法发起
Twilio 呼叫。

## 工具

智能体可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

当 Chrome 运行在 Gateway 网关主机上时，使用 `transport: "chrome"`。
当 Chrome 运行在配对节点（如 Parallels VM）上时，使用
`transport: "chrome-node"`。两种情况下，模型提供商和
`openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证
保留在那里。使用默认 `mode: "agent"` 时，实时转录提供商负责监听，已配置的
OpenClaw 智能体生成答案，常规 OpenClaw TTS 将其说入 Meet。当你希望
实时语音模型直接回答时，使用 `mode: "bidi"`。原始的 `mode: "realtime"`
仍作为 `mode: "agent"` 的旧版兼容别名被接受，但不再在智能体工具架构中公开。

使用 `action: "status"` 列出活动会话或检查某个会话 ID。使用
`action: "speak"` 搭配 `sessionId` 和 `message`，让实时智能体立即发声。
使用 `action: "test_speech"` 创建或复用会话、触发已知短语，并在 Chrome
主机可以报告时返回 `inCall` 健康状态。`test_speech` 始终强制使用
`mode: "agent"`，如果被要求在 `mode: "transcribe"` 下运行则会失败，因为
仅观察会话有意不能输出语音。其 `speechOutputVerified` 结果基于本次测试
调用期间实时音频输出字节增加，因此复用的会话中较早的音频不会被计为新的
成功语音检查。使用 `action: "leave"` 将会话标记为已结束。

`status` 会在可用时包含 Chrome 健康状态：

- `inCall`：Chrome 似乎已进入 Meet 通话
- `micMuted`：尽力获取的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：
  浏览器配置文件需要人工登录、Meet 主持人准入、权限或浏览器控制修复后，
  语音才能工作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：当前是否
  允许托管 Chrome 语音。`speechReady: false` 表示 OpenClaw 未将开场/测试
  短语发送进音频桥接。
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接最近接收或发送音频的时间
- `audioOutputRouted` / `audioOutputDeviceLabel`：Meet 标签页的媒体输出是否
  已主动路由到桥接使用的 BlackHole 设备
- `lastSuppressedInputAt` / `suppressedInputBytes`：助手播放处于活跃状态时被
  忽略的 loopback 输入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 智能体和 Bidi 模式

Chrome `agent` 模式针对“我的智能体在会议中”的行为进行了优化。实时转录
提供商听取会议音频，最终的参与者转录会路由到已配置的 OpenClaw 智能体，
答案则通过正常的 OpenClaw TTS 运行时说出。当你希望实时语音模型直接回答时，
设置 `mode: "bidi"`。
在咨询前，会合并相邻的最终转录片段，避免一个发言轮次产生多个过时的部分答案。
当排队的助手音频仍在播放时，也会抑制实时输入，并且在智能体咨询前忽略近期类似
助手的转录回声，避免 BlackHole loopback 让智能体回答自己的语音。

| 模式    | 由谁决定答案                  | 语音输出路径                           | 适用场景                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 已配置的 OpenClaw 智能体      | 正常 OpenClaw TTS 运行时               | 你需要“我的智能体在会议中”的行为                      |
| `bidi`  | 实时语音模型                  | 实时语音提供商音频响应                 | 你需要最低延迟的对话式语音循环                        |

在 `bidi` 模式下，当实时模型需要更深入的推理、最新信息或常规 OpenClaw
工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，并带上最近的会议转录上下文，然后返回
简洁的语音答案。在 `agent` 模式下，OpenClaw 会将该答案直接发送到 TTS 运行时；
在 `bidi` 模式下，实时语音模型可以将咨询结果说回会议中。它使用与 Voice Call
相同的共享咨询机制。

默认情况下，咨询针对 `main` 智能体运行。当某个 Meet 通道应咨询专用的
OpenClaw 智能体工作区、模型默认值、工具策略、记忆和会话历史时，设置
`realtime.agentId`。

智能体模式咨询使用每个会议专属的
`agent:<id>:subagent:google-meet:<session>` 会话键，因此后续问题可以保留
会议上下文，同时继承已配置智能体的正常智能体策略。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按每个 Meet 会话限定范围，因此后续咨询调用可以在同一场会议中复用
先前的咨询上下文。

要在 Chrome 完全加入通话后强制进行语音就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入并发言冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试清单

在把会议交给无人值守的智能体之前，使用此顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- 当 Chrome-node 是默认传输协议或固定了某个节点时，`googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 显示选定节点已连接。
- 选定节点同时公布 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，并且 `test-speech` 返回包含 `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机，例如 Parallels macOS VM，在更新 Gateway 网关或 VM 后，这是最短的安全检查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这证明 Gateway 网关插件已加载，VM 节点已使用当前令牌连接，并且 Meet 音频桥可用，然后智能体再打开真实会议标签页。

对于 Twilio 冒烟测试，请使用公开电话拨入详情的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。
- Gateway 网关重新加载后，CLI 中可以使用 `voicecall`。
- 返回的会话包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 显示先提供 DTMF TwiML，再提供实时 TwiML，然后是已排队初始问候语的实时桥。
- `googlemeet leave <sessionId>` 会挂断委托的语音通话。

## 故障排除

### 智能体看不到 Google Meet 工具

确认 Gateway 网关配置中已启用该插件，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。正在运行的智能体只能看到当前 Gateway 网关进程注册的插件工具。

在非 macOS Gateway 网关主机上，面向智能体的 `google_meet` 工具仍然可见，但本地 Chrome 回声发言动作会在到达音频桥之前被阻止。本地 Chrome 回声发言音频目前依赖 macOS `BlackHole 2ch`，因此 Linux 智能体应使用 `mode: "transcribe"`、Twilio 拨入或 macOS `chrome-node` 主机，而不是默认的本地 Chrome 智能体路径。

### 没有已连接且支持 Google Meet 的节点

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

节点必须已连接，并列出 `googlemeet.chrome` 以及 `browser.proxy`。Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 失败，或 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启该节点。对于 LAN Gateway 网关，这通常意味着：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然后重新加载节点服务并重新运行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 浏览器打开但智能体无法加入

对仅观察加入运行 `googlemeet test-listen`，对实时加入运行 `googlemeet test-speech`，然后检查返回的 Chrome 健康状态。如果任一探测报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，并停止重试，直到浏览器操作完成。

常见的手动操作：

- 登录 Chrome 配置文件。
- 从 Meet 主持人账号批准访客加入。
- 当 Chrome 原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示 “Do you want people to hear you in the meeting?” 就报告“未登录”。这是 Meet 的音频选择插页；可用时，OpenClaw 会通过浏览器自动化点击 **Use microphone**，并继续等待真实会议状态。对于仅创建的浏览器回退，OpenClaw 可能会点击 **Continue without microphone**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

配置了 OAuth 凭证时，`googlemeet create` 会先使用 Google Meet API `spaces.create` 端点。没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持之后签发的。较旧的令牌可能缺少 `meetings.space.created` 范围；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 且 `chromeNode.node` 指向一个已连接并具有 `browser.proxy` 和 `googlemeet.chrome` 的节点。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会在打开新标签页之前复用现有 `https://meet.google.com/new` 或 Google 账号提示标签页。如果智能体超时，请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 指导操作员。在该操作完成之前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the meeting?”，请保持标签页打开。OpenClaw 应通过浏览器自动化点击 **Use microphone**，或对于仅创建的回退点击 **Continue without microphone**，并继续等待生成的 Meet URL。如果它无法完成，错误应提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体已加入但不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

对正常的 STT -> OpenClaw 智能体 -> TTS 回声发言路径使用 `mode: "agent"`，或对直接实时语音回退使用 `mode: "bidi"`。`mode: "transcribe"` 会有意不启动回声发言桥。对于仅观察调试，请在参与者发言后运行 `openclaw googlemeet status --json <session-id>`，并检查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 为 true，但 `transcriptLines` 保持为 `0`，可能是 Meet 字幕已禁用、自观察器安装以来没有人发言、Meet UI 已变更，或该会议语言/账号无法使用实时字幕。

`googlemeet test-speech` 始终检查实时路径，并报告本次调用是否观察到桥输出字节。如果 `speechOutputVerified` 为 false 且 `speechOutputTimedOut` 为 true，实时提供商可能已接受话语，但 OpenClaw 未看到新的输出字节到达 Chrome 音频桥。

还要验证：

- Gateway 网关主机上可用实时提供商密钥，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主机上可见 `BlackHole 2ch`。
- Chrome 主机上存在 `sox`。
- Meet 麦克风和扬声器通过 OpenClaw 使用的虚拟音频路径路由。对于本地 Chrome 实时加入，`doctor` 应显示 `meet output routed: yes`。

`googlemeet doctor [session-id]` 会打印会话、节点、通话中状态、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最后音频时间戳、字节计数器和浏览器 URL。当你需要原始 JSON 时，使用 `googlemeet status [session-id] --json`。当你需要验证 Google Meet OAuth 刷新且不暴露令牌时，使用 `googlemeet doctor --oauth`；当你还需要 Google Meet API 证明时，添加 `--meeting` 或 `--create-space`。

如果智能体超时且你能看到已经打开的 Meet 标签页，请检查该标签页，而不是再打开一个：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具动作是 `recover_current_tab`。它会聚焦并检查选定传输协议的现有 Meet 标签页。使用 `chrome` 时，它通过 Gateway 网关使用本地浏览器控制；使用 `chrome-node` 时，它使用已配置的 Chrome 节点。它不会打开新标签页或创建新会话；它会报告当前阻塞因素，例如登录、准入、权限或音频选择状态。CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行；`chrome-node` 还要求 Chrome 节点已连接。

### Twilio 设置检查失败

当不允许或未启用 `voice-call` 时，`twilio-voice-call-plugin` 会失败。将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，并重新加载 Gateway 网关。

当 Twilio 后端缺少账号 SID、认证令牌或呼叫方号码时，`twilio-voice-call-credentials` 会失败。在 Gateway 网关主机上设置这些变量：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

当 `voice-call` 没有公开 webhook 暴露，或 `publicUrl` 指向 loopback 或专用网络空间时，`twilio-voice-call-webhook` 会失败。将 `plugins.entries.voice-call.config.publicUrl` 设置为公开提供商 URL，或配置 `voice-call` 隧道/Tailscale 暴露。

Loopback 和专用 URL 不能用于运营商回调。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`。

对于稳定的公开 URL：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

对于本地开发，请使用隧道或 Tailscale 暴露，而不是专用主机 URL：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

然后重启或重新加载 Gateway 网关并运行：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 默认只检查就绪状态。要对特定号码进行演练：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你有意发起实时外拨通知通话时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通话开始但从未进入会议

确认 Meet 事件公开电话拨入详情。传入精确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商需要在输入 PIN 前暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

如果电话呼叫已创建，但 Meet 名单始终没有显示拨入参与者：

- 运行 `openclaw googlemeet doctor <session-id>`，确认委派的 Twilio 呼叫 ID、DTMF 是否已排队，以及是否已请求开场问候语。
- 运行 `openclaw voicecall status --call-id <id>`，并确认呼叫仍处于活动状态。
- 运行 `openclaw voicecall tail`，检查 Twilio webhook 是否到达 Gateway 网关。
- 运行 `openclaw logs --follow`，查找 Twilio Meet 序列：Google Meet 委派加入，Voice Call 启动电话呼叫段，Google Meet 等待 `voiceCall.dtmfDelayMs`，通过 `voicecall.dtmf` 发送 DTMF，等待 `voiceCall.postDtmfSpeechDelayMs`，然后通过 `voicecall.speak` 请求开场语音。
- 重新运行 `openclaw googlemeet setup --transport twilio`；绿色设置检查是必需的，但不能证明会议 PIN 序列正确。
- 确认拨入号码与 PIN 属于同一个 Meet 邀请和区域。
- 如果 Meet 应答较慢，或呼叫转录在 DTMF 发送后仍显示要求输入 PIN 的提示，请增加 `voiceCall.dtmfDelayMs`。
- 如果参与者已加入但你听不到问候语，请检查 `openclaw logs --follow` 中 DTMF 后的 `voicecall.speak` 请求，以及媒体流 TTS 播放或 Twilio `<Say>` 回退。如果呼叫转录中仍包含 “enter the meeting PIN”，则电话呼叫段尚未加入 Meet 房间，因此会议参与者不会听到语音。

如果 webhook 没有到达，请先调试 Voice Call 插件：提供商必须能够访问 `plugins.entries.voice-call.config.publicUrl` 或配置的隧道。
请参阅 [Voice Call 故障排除](/zh-CN/plugins/voice-call#troubleshooting)。

## 备注

Google Meet 的官方媒体 API 以接收为主，因此要在 Meet 呼叫中发言，仍然需要一条参与者路径。此插件会让这个边界保持可见：
Chrome 处理浏览器参与和本地音频路由；Twilio 处理电话拨入参与。

Chrome 回话模式需要 `BlackHole 2ch`，并且还需要以下之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有该桥接，并在这些命令与所选提供商之间以 `chrome.audioFormat` 管道传输音频。Agent 模式使用实时转录加常规 TTS；bidi 模式使用实时语音提供商。默认 Chrome 路径是 24 kHz PCM16，并设置 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可用于旧版命令对。
- `chrome.audioBridgeCommand`：外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。这仅对 `bidi` 有效，因为 `agent` 模式需要直接访问命令对以进行 TTS。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到不同的虚拟设备，或路由到 Loopback 风格的虚拟设备图。单个共享的 BlackHole 设备可能会把其他参与者的声音回送到呼叫中。

使用命令对 Chrome 桥接时，`chrome.bargeInInputCommand` 可以监听单独的本地麦克风，并在人类开始说话时清除助手播放。即使共享的 BlackHole loopback 输入在助手播放期间被临时抑制，这也能让人类语音优先于助手输出。与 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand` 一样，它是由操作员配置的本地命令。请使用显式的可信命令路径或参数列表，不要将其指向来自不受信任位置的脚本。

`googlemeet speak` 会触发 Chrome 会话的活动回话音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 也会挂断底层语音呼叫。当你还想关闭 API 管理空间的活动 Google Meet 会议时，请使用 `googlemeet end-active-conference`。

## 相关内容

- [Voice Call 插件](/zh-CN/plugins/voice-call)
- [通话模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

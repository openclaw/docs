---
read_when:
    - 你想让 OpenClaw 智能体加入 Google Meet 通话
    - 你希望 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome node 或 Twilio 配置为 Google Meet 传输协议
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并使用智能体回话默认值
title: Google Meet 插件
x-i18n:
    generated_at: "2026-05-04T06:21:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 459802231a807001d96d43950993f612234a5394fbe8c57a9992e97e8851dda2
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 对 OpenClaw 的参与者支持——该插件按设计就是显式的：

- 它只会加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建新的 Meet 空间，然后加入返回的
  URL。
- `agent` 是默认回话模式：实时转写会监听，已配置的 OpenClaw 智能体会回答，并且常规 OpenClaw TTS 会向 Meet 中说话。
- `bidi` 仍可作为回退的直接实时语音模型模式使用。
- 智能体通过 `mode` 选择加入行为：使用 `agent` 进行实时
  监听/回话，使用 `bidi` 作为直接实时语音回退，或使用 `transcribe`
  加入/控制浏览器而不启用回话桥接。
- 凭证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动同意声明。
- 默认 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码以及可选 PIN 或 DTMF 序列；它
  不能直接拨打 Meet URL。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体
  电话会议工作流。

## 快速开始

安装本地音频依赖，并配置一个实时转写
提供商以及常规 OpenClaw TTS。OpenAI 是默认转写
提供商；Google Gemini Live 也可作为单独的 `bidi` 语音回退使用，并设置
`realtime.voiceProvider: "google"`：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的
安装程序需要重启后，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证两项内容：

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

设置输出旨在让智能体可读，并感知模式。它会报告 Chrome
配置文件、节点固定情况，并且对于实时 Chrome 加入，会报告 BlackHole/SoX 音频
桥接和延迟实时介绍检查。对于仅观察加入，使用 `--mode transcribe` 检查相同
传输；该模式会跳过实时音频前置条件，
因为它不会通过该桥接监听或说话：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

配置 Twilio 委派后，设置也会报告
`voice-call` 插件、Twilio 凭证和公开 webhook 暴露是否就绪。
在要求智能体加入前，将任何 `ok: false` 检查视为对应传输和模式的阻塞项。
对脚本或机器可读输出使用 `openclaw googlemeet setup --json`。在智能体尝试之前，使用
`--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 预检特定
传输。

对于 Twilio，当默认传输是 Chrome 时，始终显式预检该传输：

```bash
openclaw googlemeet setup --transport twilio
```

这会在智能体尝试拨打会议前，捕获缺失的 `voice-call` 连接、Twilio 凭证或不可达的
webhook 暴露。

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

面向智能体的 `google_meet` 工具在非 macOS 主机上仍可用于
工件、日历、设置、转写、Twilio 和 `chrome-node` 流程。本地
Chrome 回话操作在这些主机上会被阻止，因为内置 Chrome 音频路径
目前依赖 macOS `BlackHole 2ch`。在 Linux 上，使用 `mode: "transcribe"`、
Twilio 拨入，或使用 macOS `chrome-node` 主机进行 Chrome 回话
参与。

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

对于通过 API 创建的房间，如果你希望房间的免敲门策略显式设置，而不是继承自 Google
账号默认值，请使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` 允许任何拥有 Meet URL 的人无需敲门即可加入。`TRUSTED` 允许
主办组织的受信任用户、受邀外部用户和拨入用户
无需敲门即可加入。`RESTRICTED` 将免敲门进入限制为受邀者。这些
设置只适用于官方 Google Meet API 创建路径，因此必须配置 OAuth
凭证。

如果你在此选项可用之前已认证 Google Meet，请在将
`meetings.space.settings` 范围添加到你的 Google OAuth 同意屏幕后，重新运行
`openclaw googlemeet auth login --json`。

仅创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：在已配置 Google Meet OAuth 凭证时使用。这是
  最确定的路径，不依赖浏览器 UI 状态。
- 浏览器回退：在缺少 OAuth 凭证时使用。OpenClaw 使用
  固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google
  重定向到真实会议代码 URL，然后返回该 URL。此路径要求
  节点上的 OpenClaw Chrome 配置文件已登录 Google。
  浏览器自动化会处理 Meet 自身的首次运行麦克风提示；该提示
  不会被视为 Google 登录失败。
  加入和创建流程也会在打开新标签页前尝试复用现有 Meet 标签页。
  匹配时会忽略 `authuser` 等无害 URL 查询字符串，因此
  智能体重试时应聚焦已打开的会议，而不是创建第二个
  Chrome 标签页。

命令/工具输出包含 `source` 字段（`api` 或 `browser`），以便智能体
解释使用了哪条路径。`create` 默认加入新会议，并
返回 `joined: true` 以及加入会话。若只生成 URL，请在
CLI 上使用 `create --no-join`，或向工具传递 `"join": false`。

或者告诉智能体：“创建一个 Google Meet，用智能体回话模式加入，
并把链接发给我。”智能体应调用 `google_meet`，并设置
`action: "create"`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

对于仅观察/浏览器控制加入，设置 `"mode": "transcribe"`。这不会
启动双工实时语音桥接，不需要 BlackHole 或 SoX，
也不会向会议中回话。此模式下的 Chrome 加入还会避免
OpenClaw 的麦克风/摄像头权限授予，并避开 Meet **使用
麦克风** 路径。如果 Meet 显示音频选择中间页，自动化会尝试
无麦克风路径，否则会报告需要手动操作，而不是打开
本地麦克风。在 transcribe 模式下，托管 Chrome 传输也会安装
尽力而为的 Meet 字幕观察器。`googlemeet status --json` 和
`googlemeet doctor` 会暴露 `captioning`、`captionsEnabledAttempted`、
`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText`
以及简短的 `recentTranscript` 尾部，以便操作员判断浏览器
是否已加入通话，以及 Meet 字幕是否正在产生文本。
当你需要是/否探测时，使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：
它会以 transcribe 模式加入，等待新的字幕或
转写变化，并返回 `listenVerified`、`listenTimedOut`、手动
操作字段以及最新字幕健康状态。

在实时会话期间，`google_meet` Status 包含浏览器和音频桥接
健康状态，例如 `inCall`、`manualActionRequired`、`providerConnected`、
`realtimeReady`、`audioInputActive`、`audioOutputActive`、最后输入/输出
时间戳、字节计数器和桥接关闭状态。如果安全的 Meet 页面提示
出现，浏览器自动化会在可行时处理它。登录、主持人准入和
浏览器/操作系统权限提示会以手动操作报告，并附带原因和
消息，供智能体转达。托管 Chrome 会话只会在浏览器健康状态报告
`inCall: true` 后发出介绍或测试短语；否则 Status 会报告
`speechReady: false`，并阻止该说话尝试，而不是假装
智能体已向会议中说话。

本地 Chrome 加入通过已登录的 OpenClaw 浏览器配置文件完成。实时模式
要求使用 `BlackHole 2ch` 来提供 OpenClaw 使用的麦克风/扬声器路径。为了
获得干净的双工音频，请使用独立的虚拟设备或 Loopback 风格的图；一个
BlackHole 设备足以进行首次冒烟测试，但可能产生回声。

### 本地 Gateway 网关 + Parallels Chrome

仅仅为了让 VM 拥有 Chrome，你**不**需要在 macOS VM 内运行完整的 OpenClaw Gateway 网关或模型 API key。
在本地运行 Gateway 网关和智能体，然后在 VM 中运行
节点主机。在 VM 上启用一次内置插件，以便节点
通告 Chrome 命令：

运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、Agent 工作区、模型/API keys、实时
  提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，
  以及已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT key 或模型
  提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，以便 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 能看到音频设备和 SoX 命令：

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

如果 `<gateway-host>` 是 LAN IP 且你未使用 TLS，除非你为该受信任的私有网络显式启用，否则节点会拒绝
明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时，使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，而不是
`openclaw.json` 设置。当它存在于安装命令上时，`openclaw node install` 会将其存储在 LaunchAgent
环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关看到了该节点，并且它通告了 `googlemeet.chrome`
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

或要求智能体使用 `google_meet` 工具，并设置 `transport: "chrome-node"`。

对于创建或复用会话、说出已知短语并打印会话健康状态的一条命令冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在实时加入期间，OpenClaw 浏览器自动化会填写访客名称，点击
“加入/请求加入”，并在出现 Meet 首次运行的“使用麦克风”选项提示时接受它。
在仅观察加入或仅浏览器创建会议期间，如果同一提示提供无麦克风选项，它会继续通过该提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限才能实时加入，或 Meet 卡在自动化无法解决的提示上，加入/测试语音结果会报告
`manualActionRequired: true`，并带有 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，报告该精确消息以及当前的
`browserUrl`/`browserTitle`，并且只在手动浏览器操作完成后重试。

如果省略 `chromeNode.node`，OpenClaw 仅在正好一个已连接节点同时通告
`googlemeet.chrome` 和浏览器控制时自动选择。如果连接了多个有能力的节点，请将
`chromeNode.node` 设置为节点 ID、显示名称或远程 IP。

常见失败检查：

- `Configured Google Meet node ... is not usable: offline`：固定节点已被
  Gateway 网关知道但不可用。智能体应将该节点视为诊断状态，而不是可用的 Chrome 主机，并报告设置阻塞问题，而不是回退到另一种传输协议，除非用户要求这样做。
- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，
  批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。还要确认 Gateway 网关主机允许这两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被检查的主机上安装
  `blackhole-2ch`，并在使用本地 Chrome 音频前重启。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装
  `blackhole-2ch`，并重启 VM。
- Chrome 打开但无法加入：登录 VM 内的浏览器配置文件，或保持设置
  `chrome.guestName` 以进行访客加入。访客自动加入通过节点浏览器代理使用
  OpenClaw 浏览器自动化；请确保节点浏览器配置指向你想使用的配置文件，例如
  `browser.defaultProfile: "user"` 或一个已命名的 existing-session 配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw
  会在打开新标签页前激活同一 Meet URL 的现有标签页，并且浏览器会议创建会在打开另一个标签页前复用进行中的
  `https://meet.google.com/new` 或 Google 账号提示标签页。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；使用独立的虚拟设备或 Loopback 风格路由以获得干净的双工音频。

## 安装说明

Chrome 回听默认使用两个外部工具：

- `sox`：命令行音频工具。该插件为默认 24 kHz PCM16 音频桥接使用显式 CoreAudio
  设备命令。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 Chrome/Meet 可路由通过的
  `BlackHole 2ch` 音频设备。

OpenClaw 不捆绑或再分发这两个包。文档要求用户通过 Homebrew 将它们作为主机依赖安装。SoX 的许可证是
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 是 GPL-3.0。如果你构建的安装器或设备将 BlackHole 与 OpenClaw 捆绑，请审查 BlackHole 的上游许可条款，或从 Existential Audio 获取单独许可证。

## 传输协议

### Chrome

Chrome 传输协议通过 OpenClaw 浏览器控制打开 Meet URL，并以已登录的 OpenClaw 浏览器配置文件加入。在 macOS 上，该插件会在启动前检查
`BlackHole 2ch`。如果已配置，它还会在打开 Chrome 前运行音频桥接健康命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时使用
`chrome`；当 Chrome/音频位于已配对节点（例如 Parallels macOS VM）上时使用
`chrome-node`。对于本地 Chrome，使用 `browser.defaultProfile` 选择配置文件；`chrome.browserProfile` 会传递给
`chrome-node` 主机。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 麦克风和扬声器音频路由通过本地 OpenClaw 音频桥接。如果未安装
`BlackHole 2ch`，加入会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输协议是委托给 Voice Call 插件的严格拨号计划。它不会解析 Meet 页面来获取电话号码。

当 Chrome 参与不可用，或你想要电话拨入回退时使用此方式。Google Meet 必须为会议公开电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面发现这些信息。

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

如果这是你的实时语音提供商，请改用带 OpenAI provider 插件和
`OPENAI_API_KEY` 的 `realtime.provider: "openai"`。

启用 `voice-call` 后重启或重新加载 Gateway 网关；插件配置更改在重新加载前不会出现在已运行的 Gateway 网关进程中。

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

OAuth 对于创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你需要官方 API 创建、空间解析或 Meet Media API 预检检查时配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建 Google Cloud OAuth 客户端，请求所需作用域，授权 Google 账号，然后将生成的刷新令牌存储在 Google Meet 插件配置中，或提供
`OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不会替代 Chrome 加入路径。Chrome 和 Chrome-node 传输协议在你使用浏览器参与时，仍然通过已登录的 Chrome 配置文件、BlackHole/SoX，以及已连接节点加入。OAuth 仅用于官方 Google Meet API 路径：创建会议空间、解析空间，以及运行 Meet Media API 预检检查。

### 创建 Google 凭据

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - 对于 Google Workspace 组织，**内部** 最简单。
   - **外部** 适用于个人/测试设置；当应用处于测试中时，将每个会授权该应用的 Google 账号添加为测试用户。
4. 添加 OpenClaw 请求的作用域：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建 OAuth 客户端 ID。
   - 应用类型：**Web 应用**。
   - 已授权重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 让 OpenClaw 能够将 Meet URL/代码解析为空间。
`meetings.space.settings` 让 OpenClaw 在 API 房间创建期间传递 `SpaceConfig` 设置，例如
`accessType`。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体工作；Google 可能会要求实际使用 Media API 时加入 Developer Preview。
如果你只需要基于浏览器的 Chrome 加入，请完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId` 和可选的 `oauth.clientSecret`，或将它们作为环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印包含刷新令牌的 `oauth` 配置块。它使用 PKCE、`http://localhost:8085/oauth2callback` 上的 localhost 回调，以及带
`--manual` 的手动复制/粘贴流程。

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

JSON 输出包含：

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

当你不想让刷新令牌进入配置时，优先使用环境变量。如果配置值和环境值都存在，插件会先解析配置，然后回退到环境。

OAuth 同意包含 Meet 空间创建、Meet 空间读取访问，以及 Meet 会议媒体读取访问。如果你在会议创建支持存在之前完成过认证，请重新运行
`openclaw googlemeet auth login --json`，以便刷新令牌拥有
`meetings.space.created` 作用域。

### 使用 Doctor 验证 OAuth

当你需要快速、非密钥的健康检查时运行 OAuth Doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不需要已连接的 Chrome 节点。它会检查 OAuth 配置是否存在，以及刷新令牌是否能生成访问令牌。JSON 报告只包含状态字段，例如
`ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息；它不会打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查                 | 含义                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或已缓存的访问令牌。                     |
| `oauth-token`        | 缓存的访问令牌仍然有效，或刷新令牌已生成新的访问令牌。                                  |
| `meet-spaces-get`    | 可选的 `--meeting` 检查已解析到现有的 Meet 空间。                                       |
| `meet-spaces-create` | 可选的 `--create-space` 检查已创建新的 Meet 空间。                                      |

如果还要证明 Google Meet API 已启用以及 `spaces.create` 作用域可用，请运行带有副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性 Meet URL。当你需要确认 Google Cloud 项目已启用 Meet API，并且已授权账号拥有 `meetings.space.created` 作用域时使用它。

要证明对现有会议空间的读取访问权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 会证明对已授权 Google 账号可访问的现有空间具有读取访问权限。这些检查返回 `403` 通常表示 Google Meet REST API 已禁用、已同意授权的刷新令牌缺少所需作用域，或该 Google 账号无法访问该 Meet 空间。refresh-token 错误表示需要重新运行 `openclaw googlemeet auth login
--json` 并存储新的 `oauth` 块。

浏览器回退方案不需要 OAuth 凭据。在该模式下，Google 认证来自所选节点上已登录的 Chrome 个人资料，而不是 OpenClaw 配置。

这些环境变量可作为回退值：

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

在 Meet 创建会议记录后列出会议产物和出席情况：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录。当你需要该会议保留的每条记录时，传入 `--all-conference-records`。

Calendar 查找可以先从 Google Calendar 解析会议 URL，然后再读取 Meet 产物：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索带有 Google Meet 链接的 Calendar 事件。使用 `--event <query>` 搜索匹配的事件文本，使用 `--calendar <id>` 指定非主日历。Calendar 查找需要包含 Calendar events readonly 作用域的新 OAuth 登录。`calendar-events` 会预览匹配的 Meet 事件，并标记 `latest`、`artifacts`、`attendance` 或 `export` 将选择的事件。

如果你已经知道会议记录 ID，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

当你想在通话后关闭房间时，可以结束 API 创建空间中的活跃会议：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

这会调用 Google Meet `spaces.endActiveConference`，并且要求 OAuth 对已授权账号可管理的空间拥有 `meetings.space.created` 作用域。OpenClaw 接受 Meet URL、会议代码或 `spaces/{id}` 输入，并在结束活跃会议前将其解析为 API 空间资源。它与 `googlemeet leave` 分开：`leave` 会停止 OpenClaw 的本地/会话参与，而 `end-active-conference` 会请求 Google Meet 结束该空间的活跃会议。

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

当 Google 为会议公开相关内容时，`artifacts` 会返回会议记录元数据，以及参与者、录制、转录、结构化转录条目和智能笔记资源元数据。对大型会议使用 `--no-transcript-entries` 可跳过条目查找。`attendance` 会将参与者展开为参与者会话行，包含首次/最后出现时间、总会话时长、迟到/提前离开标记，并按已登录用户或显示名称合并重复的参与者资源。传入 `--no-merge-duplicates` 可保留原始参与者资源彼此分离，传入 `--late-after-minutes` 可调整迟到检测，传入 `--early-before-minutes` 可调整提前离开检测。

`export` 会写入一个文件夹，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用过的 Calendar 事件以及任何部分检索警告。传入 `--zip` 还会在文件夹旁写入可移植归档。传入 `--include-doc-bodies` 可通过 Google Drive `files.export` 导出链接的转录和智能笔记 Google Docs 文本；这需要包含 Drive Meet readonly 作用域的新 OAuth 登录。不使用 `--include-doc-bodies` 时，导出仅包含 Meet 元数据和结构化转录条目。如果 Google 返回部分产物失败，例如智能笔记列表、转录条目或 Drive 文档正文错误，摘要和清单会保留警告，而不是让整个导出失败。使用 `--dry-run` 可获取相同的产物/出席数据并打印清单 JSON，而不创建文件夹或 ZIP。这在写入大型导出前，或智能体只需要计数、所选记录和警告时很有用。

智能体也可以通过 `google_meet` 工具创建相同的包：

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

智能体也可以使用显式访问策略创建 API 支持的房间：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

它们还可以结束已知房间中的活跃会议：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

对于先监听验证，智能体应先使用 `test_listen`，再声明会议有用：

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

实时冒烟测试环境：

- `OPENCLAW_LIVE_TEST=1` 启用受保护的实时测试。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代码或
  `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth
  客户端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供
  刷新令牌。
- 可选：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用不带 `OPENCLAW_` 前缀的相同回退名称。

基础产物/出席情况实时冒烟测试需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar 查找需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文档正文导出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

创建新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。使用 OAuth 凭据时，它会使用官方 Google Meet API。没有 OAuth 凭据时，它会使用固定 Chrome 节点已登录的浏览器个人资料作为回退方案。智能体可以使用带有 `action: "create"` 的 `google_meet` 工具一步完成创建并加入。若只创建 URL，传入 `"join": false`。

浏览器回退方案的示例 JSON 输出：

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

如果浏览器回退方案在创建 URL 之前遇到 Google 登录或 Meet 权限阻碍，Gateway 网关方法会返回失败响应，`google_meet` 工具会返回结构化详情，而不是普通字符串：

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

当智能体看到 `manualActionRequired: true` 时，应报告 `manualActionMessage` 以及浏览器节点/标签页上下文，并停止打开新的 Meet 标签页，直到操作者完成浏览器步骤。

API 创建的示例 JSON 输出：

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

默认情况下，创建 Meet 会加入会议。Chrome 或 Chrome-node 传输仍然
需要已登录的 Google Chrome 配置文件才能通过浏览器加入。如果该
配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或
浏览器回退错误，并要求操作员完成 Google 登录后再重试。

只有在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入适用于 Meet 媒体 API 的 Google
Workspace Developer Preview Program 之后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

通用 Chrome 智能体路径只需要启用插件、BlackHole、SoX、一个
实时转写提供商密钥，以及一个已配置的 OpenClaw TTS 提供商。
OpenAI 是默认转写提供商；将 `realtime.voiceProvider` 设为
`"google"`，并设置 `realtime.model`，即可在 `bidi` 模式下使用 Google Gemini Live，
同时不改变默认智能体模式的转写提供商：

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
- `chromeNode.node`：用于 `chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在已退出登录的 Meet 访客
  屏幕上使用的名称
- `chrome.autoJoin: true`：通过 `chrome-node` 上的 OpenClaw 浏览器自动化，
  尽力填写访客名称并点击 Join Now
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是
  打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，
  然后触发回话开场
- `chrome.audioFormat: "pcm16-24khz"`：命令对音频格式。仅对仍然输出
  电话音频的旧版/自定义命令对使用 `"g711-ulaw-8khz"`。
- `chrome.audioBufferBytes: 4096`：用于生成的 Chrome
  命令对音频命令的 SoX 处理缓冲区。这是 SoX 默认 8192 字节缓冲区的一半，
  可降低默认管道延迟，同时保留在繁忙主机上调高的余量。
  低于 SoX 最小值的数值会被钳制为 17 字节。
- `chrome.audioInputCommand`：从 CoreAudio `BlackHole 2ch`
  读取并以 `chrome.audioFormat` 写入音频的 SoX 命令
- `chrome.audioOutputCommand`：读取 `chrome.audioFormat`
  格式的音频并写入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：可选的本地麦克风命令，在
  assistant 播放处于活动状态时，写入有符号 16 位小端单声道 PCM，
  用于检测人工插话。这目前适用于 Gateway 网关托管的
  `chrome` 命令对桥接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand`
  上被视为人工打断的 RMS 电平
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand`
  上被视为人工打断的峰值电平
- `chrome.bargeInCooldownMs: 900`：重复清除人工打断之间的最小延迟
- `mode: "agent"`：默认回话模式。参与者语音由已配置的实时转写提供商转写，
  发送到按会议划分的子智能体会话中的已配置 OpenClaw 智能体，
  并通过常规 OpenClaw TTS 运行时回放。
- `mode: "bidi"`：回退的直接双向实时模型模式。实时语音提供商直接回答
  参与者语音，并且可以调用 `openclaw_agent_consult`
  来获取更深入/由工具支持的答案。
- `mode: "transcribe"`：不带回话桥接的仅观察模式。
- `realtime.provider: "openai"`：在下面的作用域化提供商字段未设置时使用的兼容回退。
- `realtime.transcriptionProvider: "openai"`：`agent` 模式用于实时转写的
  提供商 id。
- `realtime.voiceProvider`：`bidi` 模式用于直接实时语音的提供商 id。
  将其设为 `"google"` 可使用 Gemini Live，同时保持智能体模式转写使用 OpenAI。
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的语音回复，使用
  `openclaw_agent_consult` 获取更深入的答案
- `realtime.introMessage`：实时桥接连接时的简短语音就绪检查；
  将其设为 `""` 可静默加入
- `realtime.agentId`：用于 `openclaw_agent_consult` 的可选 OpenClaw
  智能体 id；默认为 `main`

可选覆盖：

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

ElevenLabs 用于智能体模式下的监听和发声：

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

持久 Meet 语音来自
`messages.tts.providers.elevenlabs.voiceId`。启用 TTS 模型覆盖时，
智能体回复也可以使用逐条回复的 `[[tts:voiceId=... model=eleven_v3]]`
指令，但配置是会议的确定性默认值。加入时，日志应显示
`transcriptionProvider=elevenlabs`，并且每条语音回复都应记录
`provider=elevenlabs model=eleven_v3 voice=<voiceId>`。

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输时，它会把
实际的 PSTN 呼叫、DTMF 和开场问候委托给 Voice Call 插件。Voice Call
会在打开实时媒体流之前播放 DTMF 序列，然后使用保存的开场文本作为初始实时问候。
如果未启用 `voice-call`，Google Meet 仍可验证并记录拨号方案，
但无法发起 Twilio 呼叫。

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

当 Chrome 在 Gateway 网关主机上运行时，使用 `transport: "chrome"`。
当 Chrome 在配对节点（例如 Parallels VM）上运行时，使用
`transport: "chrome-node"`。在这两种情况下，模型提供商和
`openclaw_agent_consult` 都在 Gateway 网关主机上运行，因此模型凭证保留在那里。
使用默认 `mode: "agent"` 时，实时转写提供商负责监听，已配置的 OpenClaw
智能体生成答案，常规 OpenClaw TTS 将其说进 Meet。需要实时语音模型直接回答时，
使用 `mode: "bidi"`。原始 `mode: "realtime"` 仍作为
`mode: "agent"` 的旧版兼容别名被接受，但不再在智能体工具 schema 中展示。
智能体模式日志会在桥接启动时包含解析后的转写提供商/模型，并在每次合成回复后包含
TTS 提供商、模型、语音、输出格式和采样率。

使用 `action: "status"` 列出活动会话或检查某个会话 ID。使用
`action: "speak"` 搭配 `sessionId` 和 `message`，让实时智能体立即发声。
使用 `action: "test_speech"` 创建或复用会话、触发已知短语，并在 Chrome 主机可以报告时返回
`inCall` 健康状态。`test_speech` 始终强制使用 `mode: "agent"`，
如果要求在 `mode: "transcribe"` 下运行则会失败，因为仅观察会话有意不能发出语音。
它的 `speechOutputVerified` 结果基于本次测试调用期间实时音频输出字节数是否增加，
因此复用会话中较早的音频不会被计为新的成功语音检查。使用 `action: "leave"`
将会话标记为已结束。

可用时，`status` 包含 Chrome 健康状态：

- `inCall`：Chrome 似乎已进入 Meet 通话
- `micMuted`：尽力获取的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：
  在语音可工作之前，浏览器配置文件需要手动登录、Meet 主持人准入、权限或
  浏览器控制修复
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：当前是否允许
  托管 Chrome 语音。`speechReady: false` 表示 OpenClaw 没有把开场/测试短语发送到音频桥接。
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：最近从桥接看到或发送到桥接的音频
- `audioOutputRouted` / `audioOutputDeviceLabel`：Meet 标签页的媒体输出是否已主动路由到桥接使用的
  BlackHole 设备
- `lastSuppressedInputAt` / `suppressedInputBytes`：assistant 播放处于活动状态时被忽略的 loopback 输入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 智能体与 Bidi 模式

Chrome `agent` 模式针对“我的智能体在会议中”行为进行了优化。
实时转写提供商会听取会议音频，最终参与者转写会路由到已配置的 OpenClaw 智能体，
答案则通过常规 OpenClaw TTS 运行时说出。当你希望实时语音模型直接回答时，
设置 `mode: "bidi"`。
相邻的最终转写片段会在咨询前合并，因此一次发言不会产生多个过时的部分答案。
排队的 assistant 音频仍在播放时，实时输入也会被抑制，
并且在智能体咨询之前会忽略近期类似 assistant 的转写回声，
这样 BlackHole loopback 不会让智能体回答自己的语音。

| 模式    | 由谁决定答案        | 语音输出路径                     | 使用场景                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 已配置的 OpenClaw 智能体 | 常规 OpenClaw TTS 运行时            | 你需要“我的智能体在会议中”的行为        |
| `bidi`  | 实时语音模型      | 实时语音提供商音频响应 | 你需要最低延迟的对话式语音循环 |

在 `bidi` 模式下，当实时模型需要更深入的推理、当前信息或常规 OpenClaw 工具时，
它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，并带上最近的会议转录上下文，然后返回简洁的语音回答。在 `agent` 模式下，OpenClaw 会将该回答直接发送到 TTS 运行时；在 `bidi` 模式下，实时语音模型可以把咨询结果说回会议中。它与语音通话使用相同的共享咨询机制。

默认情况下，咨询会针对 `main` 智能体运行。当某个 Meet 通道应咨询专用的 OpenClaw Agent 工作区、模型默认值、工具策略、记忆和会话历史时，请设置 `realtime.agentId`。

智能体模式的咨询使用按会议划分的 `agent:<id>:subagent:google-meet:<session>` 会话键，因此后续问题会保留会议上下文，同时从配置的智能体继承正常的智能体策略。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：公开咨询工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公开咨询工具，并让常规智能体使用正常的智能体工具策略。
- `none`：不要向实时语音模型公开咨询工具。

咨询会话键按每个 Meet 会话限定范围，因此后续咨询调用可以在同一场会议期间复用之前的咨询上下文。

若要在 Chrome 完全加入通话后强制进行语音就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入并说话 smoke 如下：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试检查清单

在把会议交给无人值守智能体之前，使用以下顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- 当 Chrome-node 是默认传输协议或固定了一个节点时，`googlemeet setup` 会包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，并且 `test-speech` 返回带有 `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机，例如 Parallels macOS 虚拟机，这是更新 Gateway 网关或虚拟机后最短的安全检查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载、虚拟机节点已使用当前令牌连接，并且在智能体打开真实会议标签页之前，Meet 音频桥接已可用。

对于 Twilio smoke，请使用公开电话拨入详情的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。
- Gateway 网关重新加载后，CLI 中可以使用 `voicecall`。
- 返回的会话包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 显示先提供 DTMF TwiML，再提供实时 TwiML，然后是一个已排队初始问候语的实时桥接。
- `googlemeet leave <sessionId>` 会挂断委托的语音通话。

## 故障排除

### 智能体看不到 Google Meet 工具

确认 Gateway 网关配置中已启用插件，然后重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。正在运行的智能体只能看到当前 Gateway 网关进程注册的插件工具。

在非 macOS Gateway 网关主机上，面向智能体的 `google_meet` 工具仍然可见，但本地 Chrome 回话音频操作会在到达音频桥接之前被阻止。本地 Chrome 回话音频目前依赖 macOS `BlackHole 2ch`，因此 Linux 智能体应使用 `mode: "transcribe"`、Twilio 拨入，或 macOS `chrome-node` 主机，而不是默认的本地 Chrome 智能体路径。

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

节点必须已连接，并列出 `googlemeet.chrome` 加 `browser.proxy`。Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 在 `chrome-node-connected` 上失败，或 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点。对于 LAN Gateway 网关，这通常意味着：

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

### 浏览器打开了，但智能体无法加入

对仅观察加入运行 `googlemeet test-listen`，或对实时加入运行 `googlemeet test-speech`，然后检查返回的 Chrome 健康状态。如果任一探测报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，并停止重试，直到浏览器操作完成。

常见手动操作：

- 登录 Chrome 个人资料。
- 从 Meet 主持账号准入访客。
- 当 Chrome 原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示 “Do you want people to hear you in the meeting?” 就报告“未登录”。这是 Meet 的音频选择插页；OpenClaw 会在可用时通过浏览器自动化点击 **Use microphone**，并继续等待真实会议状态。对于仅创建的浏览器回退，OpenClaw 可能会点击 **Continue without microphone**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

配置 OAuth 凭证时，`googlemeet create` 首先使用 Google Meet API `spaces.create` 端点。没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持后生成的。较旧令牌可能缺少 `meetings.space.created` scope；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 且 `chromeNode.node` 指向一个已连接、带有 `browser.proxy` 和 `googlemeet.chrome` 的节点。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 个人资料已登录 Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会在打开新标签页前复用现有 `https://meet.google.com/new` 或 Google 账号提示标签页。如果智能体超时，请重试工具调用，而不是手动打开另一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 来指导操作员。在该操作完成之前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the meeting?”，请让标签页保持打开。OpenClaw 应通过浏览器自动化点击 **Use microphone**，或对于仅创建回退点击 **Continue without microphone**，并继续等待生成的 Meet URL。如果做不到，错误应提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体已加入但不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

对于正常的 STT -> OpenClaw 智能体 -> TTS 回话音频路径，使用 `mode: "agent"`；对于直接实时语音回退，使用 `mode: "bidi"`。`mode: "transcribe"` 有意不会启动回话音频桥接。对于仅观察调试，请在参与者说话后运行 `openclaw googlemeet status --json <session-id>`，并检查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 为 true 但 `transcriptLines` 保持 `0`，可能是 Meet 字幕被禁用、观察器安装后还没有人说话、Meet UI 已更改，或会议语言/账号不支持实时字幕。

`googlemeet test-speech` 始终检查实时路径，并报告本次调用是否观察到桥接输出字节。如果 `speechOutputVerified` 为 false 且 `speechOutputTimedOut` 为 true，则实时提供商可能已接受话语，但 OpenClaw 没有看到新的输出字节到达 Chrome 音频桥接。

还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主机上可以看到 `BlackHole 2ch`。
- Chrome 主机上存在 `sox`。
- Meet 麦克风和扬声器通过 OpenClaw 使用的虚拟音频路径进行路由。对于本地 Chrome 实时加入，`doctor` 应显示 `meet output routed: yes`。

`googlemeet doctor [session-id]` 会打印会话、节点、通话中状态、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最后音频时间戳、字节计数器和浏览器 URL。当你需要原始 JSON 时，使用 `googlemeet status [session-id] --json`。当你需要在不暴露令牌的情况下验证 Google Meet OAuth 刷新时，使用 `googlemeet doctor --oauth`；当你还需要 Google Meet API 证明时，添加 `--meeting` 或 `--create-space`。

如果智能体已超时，而你可以看到一个 Meet 标签页已经打开，请检查该标签页，而不要再打开另一个：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`。它会聚焦并检查所选传输协议的现有 Meet 标签页。使用 `chrome` 时，它通过 Gateway 网关使用本地浏览器控制；使用 `chrome-node` 时，它使用配置的 Chrome 节点。它不会打开新标签页或创建新会话；它会报告当前阻塞项，例如登录、准入、权限或音频选择状态。CLI 命令会与配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行；`chrome-node` 还要求 Chrome 节点已连接。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，并重新加载 Gateway 网关。

当 Twilio 后端缺少账号 SID、身份验证令牌或主叫号码时，`twilio-voice-call-credentials` 会失败。在 Gateway 网关主机上设置这些值：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

当 `voice-call` 没有公开 webhook 暴露，或 `publicUrl` 指向 loopback 或私有网络空间时，`twilio-voice-call-webhook` 会失败。将 `plugins.entries.voice-call.config.publicUrl` 设置为公共提供商 URL，或配置 `voice-call` 隧道/Tailscale 暴露。

Loopback 和私有 URL 对运营商回调无效。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`。

对于稳定的公共 URL：

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

对于本地开发，请使用隧道或 Tailscale 暴露，而不是私有主机 URL：

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

`voicecall smoke` 默认仅检查就绪状态。若要对特定号码进行试运行：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明确想发起实际外拨通知通话时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通话已开始但始终未进入会议

确认 Meet 事件公开了电话拨入详情。传入确切的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商需要在输入 PIN 前暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

如果电话通话已创建，但 Meet 名单中始终没有显示拨入参与者：

- 运行 `openclaw googlemeet doctor <session-id>`，确认委派的 Twilio 通话 ID、DTMF 是否已排队，以及是否已请求开场问候。
- 运行 `openclaw voicecall status --call-id <id>`，并确认通话仍处于活动状态。
- 运行 `openclaw voicecall tail`，并检查 Twilio webhook 是否正在到达 Gateway 网关。
- 运行 `openclaw logs --follow`，并查找 Twilio Meet 序列：Google Meet 委派加入，Voice Call 启动电话段，Google Meet 等待 `voiceCall.dtmfDelayMs`，使用 `voicecall.dtmf` 发送 DTMF，等待 `voiceCall.postDtmfSpeechDelayMs`，然后使用 `voicecall.speak` 请求开场语音。
- 重新运行 `openclaw googlemeet setup --transport twilio`；绿色的设置检查是必需的，但不能证明会议 PIN 序列正确。
- 确认拨入号码属于与 PIN 相同的 Meet 邀请和区域。
- 如果 Meet 应答较慢，或通话转录在发送 DTMF 后仍显示要求输入 PIN 的提示，请增大 `voiceCall.dtmfDelayMs`。
- 如果参与者已加入但你听不到问候，请检查 `openclaw logs --follow` 中的 DTMF 后 `voicecall.speak` 请求，以及媒体流 TTS 播放或 Twilio `<Say>` 回退。如果通话转录仍包含 “enter the meeting PIN”，说明电话段尚未加入 Meet 房间，因此会议参与者听不到语音。

如果 webhook 未到达，请先调试 Voice Call 插件：提供商必须能够访问 `plugins.entries.voice-call.config.publicUrl` 或配置的隧道。请参阅[语音通话故障排除](/zh-CN/plugins/voice-call#troubleshooting)。

## 备注

Google Meet 的官方媒体 API 偏向接收，因此要在 Meet 通话中发言，仍需要一个参与者路径。此插件让这一边界保持可见：Chrome 处理浏览器参与和本地音频路由；Twilio 处理电话拨入参与。

Chrome 回话模式需要 `BlackHole 2ch`，并搭配以下任一项：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有桥接，并在这些命令与所选提供商之间通过 `chrome.audioFormat` 管道传输音频。智能体模式使用实时转录加常规 TTS；双向模式使用实时语音提供商。默认 Chrome 路径是 24 kHz PCM16，使用 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可用于旧版命令对。
- `chrome.audioBridgeCommand`：外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。这仅对 `bidi` 有效，因为 `agent` 模式需要直接访问命令对来进行 TTS。

为了获得清晰的双工音频，请将 Meet 输出和 Meet 麦克风路由到不同的虚拟设备，或使用 Loopback 风格的虚拟设备图。单个共享 BlackHole 设备可能会把其他参与者的声音回送到通话中。

使用命令对 Chrome 桥接时，`chrome.bargeInInputCommand` 可以监听单独的本地麦克风，并在人类开始说话时清除助手播放。即使共享的 BlackHole local loopback 输入在助手播放期间被临时抑制，这也能让人类语音优先于助手输出。和 `chrome.audioInputCommand`、`chrome.audioOutputCommand` 一样，它是操作员配置的本地命令。请使用明确可信的命令路径或参数列表，不要将其指向来自不受信任位置的脚本。

`googlemeet speak` 会触发 Chrome 会话的活动回话音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 还会挂断底层语音通话。当你还想关闭 API 管理空间中的活动 Google Meet 会议时，请使用 `googlemeet end-active-conference`。

## 相关内容

- [Voice Call 插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

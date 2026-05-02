---
read_when:
    - 你想让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你希望 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输协议
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入显式指定的 Meet 网址，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-05-02T10:00:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet 对 OpenClaw 的参与者支持是有意设计为显式的：

- 它只加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建一个新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：使用 `realtime` 进行实时监听/回话，或使用 `transcribe` 加入/控制浏览器而不使用实时语音桥接。
- 认证最初使用个人 Google OAuth 或已登录的 Chrome 配置文件。
- 没有自动同意公告。
- 默认 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列；它不能直接拨打 Meet URL。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖并配置后端实时语音提供商。OpenAI 是默认值；Google Gemini Live 也可以与 `realtime.provider: "google"` 配合使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装器要求重启后，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项：

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

设置输出旨在让智能体可读，并且感知模式。它会报告 Chrome 配置文件、节点固定，以及对于实时 Chrome 加入，报告 BlackHole/SoX 音频桥接和延迟的实时开场检查。对于仅观察加入，请用 `--mode transcribe` 检查同一传输协议；该模式会跳过实时音频先决条件，因为它不会通过桥接监听或发声：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

配置了 Twilio 委托时，设置还会报告 `voice-call` 插件、Twilio 凭据和公开 webhook 暴露是否就绪。在要求智能体加入之前，把任何 `ok: false` 检查视为对应传输协议和模式的阻断项。对脚本或机器可读输出使用 `openclaw googlemeet setup --json`。在智能体尝试之前，使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 预检特定传输协议。

对于 Twilio，当默认传输协议是 Chrome 时，始终显式预检传输协议：

```bash
openclaw googlemeet setup --transport twilio
```

这会在智能体尝试拨打会议之前捕获缺失的 `voice-call` 接线、Twilio 凭据或不可达的 webhook 暴露。

加入会议：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或让智能体通过 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

面向智能体的 `google_meet` 工具在非 macOS 主机上仍可用于制品、日历、设置、转写、Twilio 和 `chrome-node` 流程。本地 Chrome 实时操作会在这些主机上被阻止，因为内置的实时 Chrome 音频路径目前依赖 macOS `BlackHole 2ch`。在 Linux 上，请使用 `mode: "transcribe"`、Twilio 拨入，或使用 macOS `chrome-node` 主机进行实时 Chrome 参会。

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

对于 API 创建的房间，如果你希望房间的免敲门策略是显式的，而不是继承自 Google 账号默认值，请使用 Google Meet `SpaceConfig.accessType`：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` 允许任何拥有 Meet URL 的人无需敲门即可加入。`TRUSTED` 允许主办方组织的受信任用户、受邀外部用户和拨入用户无需敲门即可加入。`RESTRICTED` 将免敲门进入限制为受邀者。这些设置仅适用于官方 Google Meet API 创建路径，因此必须配置 OAuth 凭据。

如果你在此选项可用之前已认证 Google Meet，请在将 `meetings.space.settings` scope 添加到你的 Google OAuth 同意屏幕后，重新运行 `openclaw googlemeet auth login --json`。

仅创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：在配置了 Google Meet OAuth 凭据时使用。这是最确定的路径，并且不依赖浏览器 UI 状态。
- 浏览器回退：在缺少 OAuth 凭据时使用。OpenClaw 使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件已经登录 Google。浏览器自动化会处理 Meet 自己的首次运行麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程还会在打开新标签页前尝试复用现有 Meet 标签页。匹配会忽略无害的 URL 查询字符串，例如 `authuser`，因此智能体重试时应聚焦已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含 `source` 字段（`api` 或 `browser`），以便智能体说明使用了哪条路径。`create` 默认加入新会议，并返回 `joined: true` 以及加入会话。若只生成 URL，请在 CLI 上使用 `create --no-join`，或向工具传递 `"join": false`。

或告诉智能体：“创建一个 Google Meet，用实时语音加入，并把链接发给我。”智能体应调用 `google_meet`，传入 `action: "create"`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

对于仅观察/浏览器控制加入，设置 `"mode": "transcribe"`。这不会启动双工实时模型桥接，不需要 BlackHole 或 SoX，也不会在会议中回话。此模式下的 Chrome 加入还会避免 OpenClaw 的麦克风/摄像头权限授予，并避免 Meet 的 **Use microphone** 路径。如果 Meet 显示音频选择插页，自动化会尝试无麦克风路径，否则报告需要手动操作，而不是打开本地麦克风。在 transcribe 模式下，托管 Chrome 传输协议还会安装尽力而为的 Meet 字幕观察器。`googlemeet status --json` 和 `googlemeet doctor` 会显示 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText` 和短的 `recentTranscript` 尾部，以便操作员判断浏览器是否已加入通话，以及 Meet 字幕是否正在生成文本。
当你需要是/否探测时，使用 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`：它会以 transcribe 模式加入，等待新的字幕或转写变化，并返回 `listenVerified`、`listenTimedOut`、手动操作字段和最新字幕健康状态。

在实时会话期间，`google_meet` 状态包含浏览器和音频桥接健康信息，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最后输入/输出时间戳、字节计数器和桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可行时处理它。登录、主持人准入以及浏览器/操作系统权限提示会作为手动操作报告，并带有原因和消息，供智能体转述。托管 Chrome 会话只有在浏览器健康报告 `inCall: true` 后才会发出开场白或测试短语；否则状态会报告 `speechReady: false`，并阻止语音尝试，而不是假装智能体已在会议中发声。

本地 Chrome 加入会通过已登录的 OpenClaw 浏览器配置文件。实时模式需要 `BlackHole 2ch` 来支持 OpenClaw 使用的麦克风/扬声器路径。为获得干净的双工音频，请使用独立的虚拟设备或 Loopback 风格的图；单个 BlackHole 设备足以完成首次冒烟测试，但可能产生回声。

### 本地 Gateway 网关 + Parallels Chrome

如果只是让 VM 拥有 Chrome，你**不**需要在 macOS VM 内运行完整的 OpenClaw Gateway 网关或配置模型 API key。在本地运行 Gateway 网关和智能体，然后在 VM 中运行节点主机。在 VM 上启用一次内置插件，让节点通告 Chrome 命令：

各处运行内容：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API key、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT key 或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，使 macOS 暴露 `BlackHole 2ch`：

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

如果 `<gateway-host>` 是 LAN IP 且你没有使用 TLS，除非你为该受信任的私有网络显式选择加入，否则节点会拒绝明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，而不是 `openclaw.json` 设置。当安装命令中存在它时，`openclaw node install` 会将其存储在 LaunchAgent 环境中。

从 Gateway 网关主机批准节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关可以看到节点，并且节点通告了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

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

实时加入期间，OpenClaw 浏览器自动化会填写访客姓名，点击
Join/Ask to join，并在出现 Meet 首次运行的 “Use microphone” 选择提示时接受该选项。仅观察加入或仅浏览器创建会议期间，如果同一个提示提供了不使用麦克风的选项，它会继续通过该提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限才能实时加入，或 Meet 卡在自动化无法处理的提示上，加入/test-speech 结果会报告
`manualActionRequired: true`，并附带 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，报告该确切消息以及当前的 `browserUrl`/`browserTitle`，并且仅在手动浏览器操作完成后重试。

如果省略 `chromeNode.node`，OpenClaw 只会在恰好一个已连接节点同时声明 `googlemeet.chrome` 和浏览器控制能力时自动选择。
如果连接了多个具备能力的节点，请将 `chromeNode.node` 设置为节点 ID、显示名称或远程 IP。

常见失败检查：

- `Configured Google Meet node ... is not usable: offline`：固定的节点已被
  Gateway 网关知晓但不可用。智能体应将该节点视为诊断状态，而不是可用的 Chrome 主机，并报告设置阻塞项，而不是回退到另一种传输协议，除非用户要求这样做。
- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，
  批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。还要确认 Gateway 网关主机允许这两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被检查的主机上安装 `blackhole-2ch`，并在使用本地 Chrome 音频前重启。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch`，并重启 VM。
- Chrome 打开但无法加入：登录 VM 内的浏览器配置文件，或为访客加入保留
  `chrome.guestName` 设置。访客自动加入通过节点浏览器代理使用 OpenClaw 浏览器自动化；请确保节点浏览器配置指向你想使用的配置文件，例如
  `browser.defaultProfile: "user"` 或某个具名的 existing-session 配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会在打开新标签页前激活同一 Meet URL 的现有标签页，并且浏览器会议创建会在打开另一个标签页前复用进行中的 `https://meet.google.com/new` 或 Google 账号提示标签页。
- 无音频：在 Meet 中，将麦克风/扬声器通过 OpenClaw 使用的虚拟音频设备路径进行路由；使用独立的虚拟设备或 Loopback 风格的路由来获得干净的双工音频。

## 安装说明

Chrome 实时默认设置使用两个外部工具：

- `sox`：命令行音频工具。插件为默认的 24 kHz PCM16 音频桥接使用显式 CoreAudio 设备命令。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 Chrome/Meet 可通过其路由的 `BlackHole 2ch` 音频设备。

OpenClaw 不捆绑或再分发任一软件包。文档要求用户通过 Homebrew 将它们安装为主机依赖。SoX 的许可证为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建的安装程序或设备将 BlackHole 与 OpenClaw 捆绑，请审查 BlackHole 的上游许可条款，或从 Existential Audio 获取单独许可。

## 传输协议

### Chrome

Chrome 传输协议通过 OpenClaw 浏览器控制打开 Meet URL，并作为已登录的 OpenClaw 浏览器配置文件加入。
在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 前运行音频桥接健康命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时使用 `chrome`；当 Chrome/音频位于配对节点（例如 Parallels macOS VM）上时使用 `chrome-node`。对于本地 Chrome，使用
`browser.defaultProfile` 选择配置文件；`chrome.browserProfile` 会传递给
`chrome-node` 主机。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 麦克风和扬声器音频通过本地 OpenClaw 音频桥接路由。如果未安装
`BlackHole 2ch`，加入会失败并显示设置错误，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输协议是委托给 Voice Call 插件的严格拨号计划。
它不会从 Meet 页面解析电话号码。

当 Chrome 参与不可用，或你想要电话拨入后备方案时使用它。Google Meet 必须为该会议公开电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面发现这些信息。

在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上启用：

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

通过环境或配置提供 Twilio 凭证。环境会让密钥不进入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后重启或重新加载 Gateway 网关；插件配置更改在重新加载前不会出现在已运行的 Gateway 网关进程中。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委托接线完成后，`googlemeet setup` 会包含成功的
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

OAuth 对创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你需要官方 API 创建、空间解析或 Meet Media API 预检检查时配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建 Google Cloud OAuth 客户端，请求所需作用域，授权一个 Google 账号，然后将生成的刷新令牌存储在 Google Meet 插件配置中，或提供
`OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不会替代 Chrome 加入路径。当你使用浏览器参与时，Chrome 和 Chrome-node 传输协议仍会通过已登录的 Chrome 配置文件、BlackHole/SoX 以及已连接节点加入。OAuth 仅用于官方 Google Meet API 路径：创建会议空间、解析空间，以及运行 Meet Media API 预检检查。

### 创建 Google 凭证

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - 对 Google Workspace 组织来说，**Internal** 最简单。
   - **External** 可用于个人/测试设置；当应用处于 Testing 状态时，将每个会授权该应用的 Google 账号添加为测试用户。
4. 添加 OpenClaw 请求的作用域：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建 OAuth 客户端 ID。
   - 应用类型：**Web application**。
   - 已授权重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

`meetings.space.created` 是 Google Meet `spaces.create` 所必需的。
`meetings.space.readonly` 让 OpenClaw 能够将 Meet URL/代码解析为空间。
`meetings.space.settings` 让 OpenClaw 能够在 API 房间创建期间传递
`SpaceConfig` 设置，例如 `accessType`。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体工作；Google 可能要求为实际使用 Media API 注册 Developer Preview。
如果你只需要基于浏览器的 Chrome 加入，可以完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId`，并可选择配置 `oauth.clientSecret`，或将它们作为环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印包含刷新令牌的 `oauth` 配置块。它使用 PKCE、`http://localhost:8085/oauth2callback` 上的 localhost 回调，以及通过 `--manual` 进行的手动复制/粘贴流程。

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

当你不想让刷新令牌进入配置时，优先使用环境变量。如果配置和环境值都存在，插件会先解析配置，然后再回退到环境。

OAuth 同意包括 Meet 空间创建、Meet 空间读取访问，以及 Meet 会议媒体读取访问。如果你在会议创建支持存在之前已完成身份验证，请重新运行
`openclaw googlemeet auth login --json`，以便刷新令牌拥有 `meetings.space.created` 作用域。

### 使用 Doctor 验证 OAuth

当你需要快速、无密钥的健康检查时运行 OAuth Doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不要求已连接 Chrome 节点。它会检查 OAuth 配置是否存在，以及刷新令牌能否生成访问令牌。JSON 报告仅包含状态字段，例如 `ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息；它不会打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查                 | 含义                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或存在缓存的访问令牌。                   |
| `oauth-token`        | 缓存的访问令牌仍然有效，或刷新令牌生成了新的访问令牌。                                  |
| `meet-spaces-get`    | 可选的 `--meeting` 检查解析了现有 Meet 空间。                                           |
| `meet-spaces-create` | 可选的 `--create-space` 检查创建了新的 Meet 空间。                                      |

要同时证明 Google Meet API 已启用以及 `spaces.create` 作用域可用，请运行带副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性的 Meet URL。当你需要确认 Google Cloud 项目已启用 Meet API，并且授权账号拥有 `meetings.space.created` 范围时使用它。

要验证对现有会议空间的读取访问权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 可验证对授权 Google 账号可访问的现有空间的读取访问权限。这些检查返回 `403` 通常表示 Google Meet REST API 已禁用、已同意授权的刷新令牌缺少所需范围，或者该 Google 账号无法访问该 Meet 空间。刷新令牌错误表示需要重新运行 `openclaw googlemeet auth login
--json`，并存储新的 `oauth` 块。

浏览器回退模式不需要 OAuth 凭据。在该模式下，Google 认证来自所选节点上已登录的 Chrome 配置文件，而不是来自 OpenClaw 配置。

这些环境变量可作为回退项：

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

在 Meet 创建会议记录后列出会议工件和出席记录：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录。当你想获取该会议保留的所有记录时，传入 `--all-conference-records`。

Calendar 查找可以先从 Google Calendar 解析会议 URL，然后再读取 Meet 工件：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索带有 Google Meet 链接的 Calendar 事件。使用 `--event <query>` 搜索匹配的事件文本，并使用 `--calendar <id>` 指定非主日历。Calendar 查找需要一次新的 OAuth 登录，并包含 Calendar 事件只读范围。`calendar-events` 会预览匹配的 Meet 事件，并标记 `latest`、`artifacts`、`attendance` 或 `export` 将选择的事件。

如果你已经知道会议记录 ID，可以直接定位它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

当你想在通话后关闭房间时，可以结束 API 创建空间的活跃会议：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

这会调用 Google Meet `spaces.endActiveConference`，并要求 OAuth 拥有 `meetings.space.created` 范围，且该空间可由授权账号管理。OpenClaw 接受 Meet URL、会议代码或 `spaces/{id}` 输入，并在结束活跃会议前将其解析为 API 空间资源。它与 `googlemeet leave` 是分开的：`leave` 会停止 OpenClaw 的本地/会话参与，而 `end-active-conference` 会请求 Google Meet 结束该空间的活跃会议。

写出可读报告：

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

当 Google 为会议公开这些信息时，`artifacts` 会返回会议记录元数据，以及参与者、录制、文字记录、结构化文字记录条目和智能笔记资源元数据。使用 `--no-transcript-entries` 可跳过大型会议的条目查找。`attendance` 会将参与者展开为参与者会话行，包含首次/最后出现时间、总会话时长、迟到/提前离开标记，并按已登录用户或显示名称合并重复的参与者资源。传入 `--no-merge-duplicates` 可保持原始参与者资源分开，传入 `--late-after-minutes` 可调整迟到检测，传入 `--early-before-minutes` 可调整提前离开检测。

`export` 会写入一个文件夹，包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用过的 Calendar 事件，以及任何部分检索警告。传入 `--zip` 还会在文件夹旁写入一个可移植归档。传入 `--include-doc-bodies` 可通过 Google Drive `files.export` 导出链接的文字记录和智能笔记 Google Docs 文本；这需要一次新的 OAuth 登录，并包含 Drive Meet 只读范围。不使用 `--include-doc-bodies` 时，导出只包含 Meet 元数据和结构化文字记录条目。如果 Google 返回部分工件失败，例如智能笔记列表、文字记录条目或 Drive 文档正文错误，摘要和清单会保留警告，而不是让整个导出失败。使用 `--dry-run` 可获取相同的工件/出席数据并打印清单 JSON，而不创建文件夹或 ZIP。这在写入大型导出之前，或者当智能体只需要计数、所选记录和警告时很有用。

智能体也可以通过 `google_meet` 工具创建同样的包：

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

设置 `"dryRun": true` 可只返回导出清单并跳过文件写入。

智能体也可以创建带有显式访问策略的 API 支持房间：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

它们还可以结束已知房间的活跃会议：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

对于先监听验证，智能体应在声称会议有用之前使用 `test_listen`：

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
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向一个保留的 Meet URL、代码或
  `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth
  客户端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供
  刷新令牌。
- 可选：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用相同的回退名称，但不带
  `OPENCLAW_` 前缀。

基础工件/出席记录实时冒烟测试需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar
查找需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive
文档正文导出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。使用 OAuth 凭据时，它会使用官方 Google Meet API。没有 OAuth 凭据时，它会使用固定 Chrome 节点的已登录浏览器配置文件作为回退。智能体可以使用 `google_meet` 工具并指定 `action: "create"`，在一步中创建并加入。若只创建 URL，传入 `"join": false`。

浏览器回退的 JSON 输出示例：

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

如果浏览器回退在创建 URL 之前遇到 Google 登录或 Meet 权限阻塞，Gateway 网关方法会返回失败响应，而 `google_meet` 工具会返回结构化详细信息，而不是纯字符串：

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

当智能体看到 `manualActionRequired: true` 时，应报告 `manualActionMessage` 以及浏览器节点/标签页上下文，并停止打开新的 Meet 标签页，直到操作员完成浏览器步骤。

API 创建的 JSON 输出示例：

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

创建 Meet 默认会加入。Chrome 或 Chrome-node 传输协议仍然需要已登录的 Google Chrome 配置文件，才能通过浏览器加入。如果配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员完成 Google 登录后再重试。

只有在确认你的 Cloud 项目、OAuth 主体和会议参与者均已加入 Google Workspace Developer Preview Program 的 Meet 媒体 API 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 实时路径只需要启用插件、BlackHole、SoX 和一个后端实时语音提供商密钥。OpenAI 是默认值；设置 `realtime.provider: "google"` 可使用 Google Gemini Live：

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
- `chromeNode.node`：用于 `chrome-node` 的可选节点 ID/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录的 Meet 访客屏幕上使用的名称
- `chrome.autoJoin: true`：通过 `chrome-node` 上的 OpenClaw 浏览器自动化尽力填写访客名称并点击 Join Now
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，然后触发实时介绍语
- `chrome.audioFormat: "pcm16-24khz"`：命令对音频格式。仅对仍输出电话音频的旧版/自定义命令对使用 `"g711-ulaw-8khz"`。
- `chrome.audioInputCommand`：从 CoreAudio `BlackHole 2ch` 读取并以 `chrome.audioFormat` 写入音频的 SoX 命令
- `chrome.audioOutputCommand`：读取 `chrome.audioFormat` 音频并写入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `chrome.bargeInInputCommand`：可选的本地麦克风命令，在助手播放处于活动状态时写入有符号 16 位小端单声道 PCM，用于检测人工插话。当前这适用于 Gateway 网关托管的 `chrome` 命令对桥接。
- `chrome.bargeInRmsThreshold: 650`：在 `chrome.bargeInInputCommand` 上计为人工打断的 RMS 电平
- `chrome.bargeInPeakThreshold: 2500`：在 `chrome.bargeInInputCommand` 上计为人工打断的峰值电平
- `chrome.bargeInCooldownMs: 900`：重复人工打断清除之间的最小延迟
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短语音回复，并使用 `openclaw_agent_consult` 获取更深入的答案
- `realtime.introMessage`：实时桥接连接时的简短语音就绪检查；将其设为 `""` 可静默加入
- `realtime.agentId`：用于 `openclaw_agent_consult` 的可选 OpenClaw 智能体 ID；默认为 `main`

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
  realtime: {
    provider: "google",
    agentId: "jay",
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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输协议时，它会把实际的 PSTN 呼叫、DTMF 和介绍问候委托给 Voice Call 插件。Voice Call 会先播放 DTMF 序列，再打开实时媒体流，然后使用保存的介绍文本作为初始实时问候语。如果未启用 `voice-call`，Google Meet 仍可验证并记录拨号计划，但无法发起 Twilio 呼叫。

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

当 Chrome 在 Gateway 网关主机上运行时，使用 `transport: "chrome"`。当 Chrome 在配对节点（例如 Parallels VM）上运行时，使用 `transport: "chrome-node"`。这两种情况下，实时模型和 `openclaw_agent_consult` 都在 Gateway 网关主机上运行，因此模型凭证会保留在那里。

使用 `action: "status"` 列出活动会话或检查会话 ID。使用带有 `sessionId` 和 `message` 的 `action: "speak"` 让实时智能体立即发言。使用 `action: "test_speech"` 创建或复用会话、触发已知短语，并在 Chrome 主机可以报告时返回 `inCall` 健康状态。`test_speech` 始终强制使用 `mode: "realtime"`，如果要求以 `mode: "transcribe"` 运行会失败，因为仅观察会话会有意禁止发出语音。其 `speechOutputVerified` 结果基于本次测试调用期间实时音频输出字节数是否增加，因此带有旧音频的复用会话不会计为一次新的成功语音检查。使用 `action: "leave"` 将会话标记为已结束。

可用时，`status` 包含 Chrome 健康状态：

- `inCall`：Chrome 似乎已在 Meet 通话中
- `micMuted`：尽力判断的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限授予或浏览器控制修复，语音才能工作
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`：当前是否允许托管 Chrome 语音。`speechReady: false` 表示 OpenClaw 未将介绍语/测试短语发送到音频桥接。
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：最后一次从桥接收到或发送到桥接的音频时间
- `lastSuppressedInputAt` / `suppressedInputBytes`：助手播放处于活动状态时被忽略的 loopback 输入

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome 实时模式针对实时语音循环进行了优化。实时语音提供商会听取会议音频，并通过配置的音频桥接发声。当实时模型需要更深入的推理、当前信息或普通 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在幕后使用最近的会议转录上下文运行常规 OpenClaw 智能体，并向实时语音会话返回简洁的语音答案。随后语音模型可以把该答案说回会议中。它使用与 Voice Call 相同的共享实时咨询工具。

默认情况下，咨询会针对 `main` 智能体运行。当某个 Meet 通道应咨询专用 OpenClaw Agent 工作区、模型默认值、工具策略、记忆和会话历史时，请设置 `realtime.agentId`。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用普通智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按每个 Meet 会话划定范围，因此在同一场会议中，后续咨询调用可以复用先前的咨询上下文。

要在 Chrome 完全加入通话后强制执行语音就绪检查：

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

在将会议交给无人值守的智能体之前，使用此序列：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- 当 Chrome-node 是默认传输协议或已固定某个节点时，`googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点同时广播 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，并且 `test-speech` 返回带有 `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机，例如 Parallels macOS VM，这是更新 Gateway 网关或 VM 后最短的安全检查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载、VM 节点已使用当前令牌连接，并且 Meet 音频桥接可用，然后智能体再打开真实会议标签页。

对于 Twilio 冒烟测试，请使用一个暴露电话拨入详细信息的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。
- Gateway 网关重新加载后，`voicecall` 可在 CLI 中使用。
- 返回的会话包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 显示在实时 TwiML 之前提供了 DTMF TwiML，然后显示已排队初始问候语的实时桥接。
- `googlemeet leave <sessionId>` 挂断委托的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。正在运行的智能体只能看到当前 Gateway 网关进程注册的插件工具。

在非 macOS Gateway 网关主机上，面向智能体的 `google_meet` 工具仍然可见，但本地 Chrome 实时操作会在到达音频桥接之前被阻止。本地 Chrome 实时音频当前依赖 macOS `BlackHole 2ch`，因此 Linux 智能体应使用 `mode: "transcribe"`、Twilio 拨入或 macOS `chrome-node` 主机，而不是默认的本地 Chrome 实时路径。

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

该节点必须已连接，并列出 `googlemeet.chrome` 以及 `browser.proxy`。Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 失败，或 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点。对于 LAN Gateway 网关，这通常意味着：

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

对于仅观察加入，运行 `googlemeet test-listen`；对于实时加入，运行 `googlemeet test-speech`，然后检查返回的 Chrome 健康状态。如果任一探测报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，并停止重试，直到浏览器操作完成。

常见手动操作：

- 登录 Chrome 配置文件。
- 从 Meet 主持人账号准入访客。
- 当 Chrome 原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅仅因为 Meet 显示“你希望会议中的其他人听到你的声音吗？”就报告“未登录”。这是 Meet 的音频选择过渡页；OpenClaw 会在可用时通过浏览器自动化点击 **使用麦克风**，并继续等待真正的会议状态。对于仅创建会议的浏览器回退路径，OpenClaw 可能会点击 **继续且不使用麦克风**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

`googlemeet create` 会在配置了 OAuth 凭证时首先使用 Google Meet API 的 `spaces.create` 端点。如果没有 OAuth 凭证，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在加入创建支持之后签发的。较旧的令牌可能缺少 `meetings.space.created` 作用域；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 且 `chromeNode.node` 指向一个已连接的节点，并配置了 `browser.proxy` 和 `googlemeet.chrome`。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会在打开新标签页之前复用现有的 `https://meet.google.com/new` 或 Google 帐号提示标签页。如果智能体超时，请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 来指导操作者。在该操作完成前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示“你希望会议中的其他人听到你的声音吗？”，请保持标签页打开。OpenClaw 应该通过浏览器自动化点击 **使用麦克风**，或者对于仅创建会议的回退路径点击 **继续且不使用麦克风**，并继续等待生成的 Meet URL。如果无法完成，错误应提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体加入后不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

对于监听/回话，请使用 `mode: "realtime"`。`mode: "transcribe"` 会有意不启动双工实时语音桥。对于仅观察调试，在参与者说话后运行 `openclaw googlemeet status --json <session-id>`，并检查 `captioning`、`transcriptLines` 和 `lastCaptionText`。如果 `inCall` 为 true 但 `transcriptLines` 一直是 `0`，可能是 Meet 字幕被禁用、观察器安装后没有人说话、Meet UI 已变化，或当前会议语言/帐号无法使用实时字幕。

`googlemeet test-speech` 始终检查实时路径，并报告该次调用是否观察到了桥接输出字节。如果 `speechOutputVerified` 为 false 且 `speechOutputTimedOut` 为 true，实时提供商可能已经接受了发言，但 OpenClaw 没有看到新的输出字节到达 Chrome 音频桥。

还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主机上可以看到 `BlackHole 2ch`。
- Chrome 主机上存在 `sox`。
- Meet 麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径进行路由。

`googlemeet doctor [session-id]` 会打印会话、节点、通话中状态、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最近音频时间戳、字节计数器和浏览器 URL。需要原始 JSON 时，请使用 `googlemeet status [session-id] --json`。需要在不暴露令牌的情况下验证 Google Meet OAuth 刷新时，请使用 `googlemeet doctor --oauth`；如果还需要 Google Meet API 证明，请添加 `--meeting` 或 `--create-space`。

如果智能体超时，而你能看到已经打开的 Meet 标签页，请检查该标签页，不要再打开新的标签页：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等价的工具操作是 `recover_current_tab`。它会聚焦并检查所选传输协议的现有 Meet 标签页。使用 `chrome` 时，它通过 Gateway 网关使用本地浏览器控制；使用 `chrome-node` 时，它使用已配置的 Chrome 节点。它不会打开新标签页或创建新会话；它会报告当前阻塞原因，例如登录、准入、权限或音频选择状态。CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行；`chrome-node` 还要求 Chrome 节点已连接。

### Twilio 设置检查失败

当不允许或未启用 `voice-call` 时，`twilio-voice-call-plugin` 会失败。请将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载 Gateway 网关。

当 Twilio 后端缺少帐号 SID、认证令牌或主叫号码时，`twilio-voice-call-credentials` 会失败。请在 Gateway 网关主机上设置这些值：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

当 `voice-call` 没有公开 webhook 暴露，或者 `publicUrl` 指向回环地址或私有网络空间时，`twilio-voice-call-webhook` 会失败。请将 `plugins.entries.voice-call.config.publicUrl` 设置为公开提供商 URL，或配置 `voice-call` 隧道/Tailscale 暴露。

回环地址和私有 URL 不能用于运营商回调。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`。

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

然后重启或重新加载 Gateway 网关，并运行：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 默认仅检查就绪状态。要对特定号码进行试运行：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有当你明确想要拨打实时出站通知电话时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通话开始但始终未进入会议

确认 Meet 事件暴露了电话拨入详细信息。传入准确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

如果电话呼叫已创建，但 Meet 名单中始终没有显示拨入参与者：

- 运行 `openclaw googlemeet doctor <session-id>`，确认委派的 Twilio 通话 ID、DTMF 是否已排队，以及是否已请求开场问候。
- 运行 `openclaw voicecall status --call-id <id>`，确认通话仍处于活动状态。
- 运行 `openclaw voicecall tail`，检查 Twilio webhook 是否到达 Gateway 网关。
- 运行 `openclaw logs --follow`，查找 Twilio Meet 序列：Google Meet 委派加入，Voice Call 启动电话侧，Google Meet 等待 `voiceCall.dtmfDelayMs`，使用 `voicecall.dtmf` 发送 DTMF，等待 `voiceCall.postDtmfSpeechDelayMs`，然后使用 `voicecall.speak` 请求开场语音。
- 重新运行 `openclaw googlemeet setup --transport twilio`；绿色设置检查是必需的，但不能证明会议 PIN 序列是正确的。
- 确认拨入号码属于与 PIN 相同的 Meet 邀请和区域。
- 如果 Meet 应答较慢，或发送 DTMF 后通话转录仍显示要求输入 PIN 的提示，请增大 `voiceCall.dtmfDelayMs`。
- 如果参与者加入了但你听不到问候，请检查 `openclaw logs --follow` 中的 DTMF 后 `voicecall.speak` 请求，以及媒体流 TTS 播放或 Twilio `<Say>` 回退。如果通话转录仍包含“输入会议 PIN”，则电话侧尚未加入 Meet 房间，因此会议参与者不会听到语音。

如果 webhook 没有到达，请先调试 Voice Call 插件：提供商必须能访问 `plugins.entries.voice-call.config.publicUrl` 或已配置的隧道。请参阅 [语音通话故障排除](/zh-CN/plugins/voice-call#troubleshooting)。

## 备注

Google Meet 的官方媒体 API 以接收为主，因此向 Meet 通话中说话仍需要参与者路径。此插件会明确保留该边界：Chrome 负责浏览器参与和本地音频路由；Twilio 负责电话拨入参与。

Chrome 实时模式需要 `BlackHole 2ch`，并且还需要以下其中一种：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥，并在这些命令和所选实时语音提供商之间以 `chrome.audioFormat` 传输音频。默认 Chrome 路径是 24 kHz PCM16；8 kHz G.711 mu-law 仍可用于旧版命令对。
- `chrome.audioBridgeCommand`：外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到单独的虚拟设备，或路由到类似 Loopback 的虚拟设备图。单个共享 BlackHole 设备可能会把其他参与者的声音回传进通话中。

使用命令对 Chrome 桥时，`chrome.bargeInInputCommand` 可以监听单独的本地麦克风，并在人类开始说话时清除助手播放。即使共享的 BlackHole 回环输入在助手播放期间被临时抑制，这也能让人类语音优先于助手输出。与 `chrome.audioInputCommand` 和 `chrome.audioOutputCommand` 一样，它是由操作者配置的本地命令。请使用明确可信的命令路径或参数列表，不要将其指向不可信位置中的脚本。

`googlemeet speak` 会触发 Chrome 会话的活动实时音频桥。`googlemeet leave` 会停止该桥。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 还会挂断底层语音通话。当你还想关闭 API 管理空间中的活动 Google Meet 会议时，请使用 `googlemeet end-active-conference`。

## 相关

- [Voice Call 插件](/zh-CN/plugins/voice-call)
- [通话模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

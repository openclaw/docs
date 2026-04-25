---
read_when:
    - 你希望 OpenClaw 智能体加入 Google Meet 通话
    - 你希望 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 使用实时语音默认设置加入显式 Meet URL
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-25T05:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c96496a06d00e719ecd0af4b8edf1423cbbc37f7773672e2456baaf06c7ca0ec
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 的 Google Meet 参会支持——该插件在设计上是显式的：

- 它只会加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深层推理或工具时，实时语音可以回调完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：实时听讲/回话使用 `realtime`，加入/控制浏览器但不启用实时语音桥接则使用 `transcribe`。
- 认证起点是个人 Google OAuth，或已登录的 Chrome 配置文件。
- 没有自动同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音提供商。默认使用 OpenAI；Google Gemini Live 也可配合 `realtime.provider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序需要重启后，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

设置输出是为智能体可读而设计的。它会报告 Chrome 配置文件、音频桥接、节点固定、延迟实时引导，以及在配置了 Twilio 委托时，`voice-call` 插件和 Twilio 凭证是否已就绪。
在请求智能体加入之前，将任何 `ok: false` 检查都视为阻塞项。
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

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

只创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：当配置了 Google Meet OAuth 凭证时使用。这是最确定性的路径，不依赖浏览器 UI 状态。
- 浏览器回退：当不存在 OAuth 凭证时使用。OpenClaw 会使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件已经登录 Google。
  浏览器自动化会处理 Meet 自身首次运行的麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程也会在打开新标签页前尝试复用现有 Meet 标签页。匹配会忽略无害的 URL 查询字符串，例如 `authuser`，因此智能体重试时应聚焦已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含 `source` 字段（`api` 或 `browser`），这样智能体可以解释使用了哪条路径。`create` 默认会加入新会议，并返回 `joined: true` 以及加入会话。若只想生成 URL，可在 CLI 上使用 `create --no-join`，或向工具传入 `"join": false`。

或者直接告诉智能体：“创建一个 Google Meet，用实时语音加入它，然后把链接发给我。” 智能体应以 `action: "create"` 调用 `google_meet`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

对于仅观察/仅浏览器控制的加入，将 `"mode"` 设为 `"transcribe"`。这不会启动双工实时模型桥接，因此它不会在会议中回话。

在实时会话期间，`google_meet` 状态包括浏览器和音频桥接健康信息，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最后输入/输出时间戳、字节计数和桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可能时处理它。登录、主持人准入以及浏览器/操作系统权限提示会被报告为需要手动操作，并附带原因和供智能体转达的消息。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，选择 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用单独的虚拟设备或 Loopback 风格的音频图；单个 BlackHole 设备足够完成首次烟雾测试，但可能产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或模型 API 密钥，才能让 VM 承担 Chrome。只需在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。只需在 VM 中启用一次内置插件，这样节点就会通告 Chrome 命令：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI / 节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI / GPT 密钥或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，使 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 能看到音频设备和 SoX 命令：

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

在 VM 中安装或更新 OpenClaw，然后在其中启用该内置插件：

```bash
openclaw plugins enable google-meet
```

在 VM 中启动节点主机：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是局域网 IP，且你未使用 TLS，那么除非你为该受信任私有网络显式选择加入，否则节点会拒绝该明文 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

当你将节点安装为 LaunchAgent 时，也要使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，而不是 `openclaw.json` 设置。当该环境变量出现在安装命令中时，`openclaw node install` 会将其存储到 LaunchAgent 环境中。

在 Gateway 网关主机上批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能看到该节点，并且它通告了 `googlemeet.chrome` 以及浏览器能力 / `browser.proxy`：

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

现在可以从 Gateway 网关主机正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者要求智能体使用 `google_meet` 工具，并指定 `transport: "chrome-node"`。

对于一个一条命令即可完成的烟雾测试——创建或复用会话、播放已知短语，并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在加入期间，OpenClaw 浏览器自动化会填写访客名、点击 Join / Ask to join，并在出现提示时接受 Meet 首次运行的 “Use microphone” 选择。在仅浏览器创建会议期间，如果 Meet 没有暴露 use-microphone 按钮，它也可以在不使用麦克风的情况下继续通过相同提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限，或者 Meet 卡在自动化无法解决的提示上，则 join / test-speech 结果会报告 `manualActionRequired: true`，并带有 `manualActionReason` 和 `manualActionMessage`。智能体应停止重试加入，报告该确切消息以及当前的 `browserUrl` / `browserTitle`，并且只在手动浏览器操作完成后再重试。

如果省略 `chromeNode.node`，则只有在恰好有一个已连接节点同时通告 `googlemeet.chrome` 和浏览器控制时，OpenClaw 才会自动选择它。如果连接了多个有能力的节点，请将 `chromeNode.node` 设为节点 id、显示名称或远程 IP。

常见失败检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。同时确认 Gateway 网关主机允许这两个节点命令，设置为 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 打开了但无法加入：在 VM 内的浏览器配置文件中登录，或者保持设置 `chrome.guestName` 以进行访客加入。访客自动加入通过节点浏览器代理使用 OpenClaw 浏览器自动化；请确保节点浏览器配置指向你想使用的配置文件，例如 `browser.defaultProfile: "user"` 或某个已存在会话的命名配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会在打开新标签页前激活同一 Meet URL 的现有标签页，而浏览器会议创建也会复用进行中的 `https://meet.google.com/new` 或 Google 账户提示标签页，而不是再打开一个。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；要获得干净的双工音频，请使用单独的虚拟设备或 Loopback 风格路由。

## 安装说明

Chrome 实时默认值使用两个外部工具：

- `sox`：命令行音频工具。该插件使用其 `rec` 和 `play` 命令来实现默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch` 音频设备，供 Chrome / Meet 路由使用。

OpenClaw 不捆绑也不重新分发这两个包。文档要求用户通过 Homebrew 将其安装为主机依赖。SoX 的许可证为 `LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建了一个捆绑 BlackHole 和 OpenClaw 的安装程序或设备，请审查 BlackHole 上游许可条款，或向 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 前运行音频桥接健康检查命令和启动命令。当 Chrome / 音频位于 Gateway 网关主机上时使用 `chrome`；当 Chrome / 音频位于已配对节点（例如 Parallels macOS VM）上时使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接路由 Chrome 麦克风和扬声器音频。如果未安装 `BlackHole 2ch`，加入会以设置错误失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输是一种严格的拨号方案，并委托给 Voice Call 插件。它不会解析 Meet 页面中的电话号码。

当无法使用 Chrome 参会，或你希望使用电话拨入作为回退方案时，请使用此方式。Google Meet 必须为该会议提供电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面中发现这些信息。

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

通过环境变量或配置提供 Twilio 凭证。使用环境变量可以避免将密钥写入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后，请重启或重新加载 Gateway 网关；插件配置变更在重新加载之前不会出现在已运行的 Gateway 网关进程中。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委托接线完成后，`googlemeet setup` 会包含成功的 `twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查。

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

对于创建 Meet 链接，OAuth 是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你希望使用官方 API 创建、空间解析或 Meet Media API 预检时，请配置 OAuth。

Google Meet API 访问优先使用个人 OAuth 客户端。配置 `oauth.clientId`，并可选配置 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个包含刷新令牌的 `oauth` 配置块。它使用 PKCE、位于 `http://localhost:8085/oauth2callback` 的本地回调，以及使用 `--manual` 的手动复制/粘贴流程。

OAuth 同意范围包括 Meet 空间创建、Meet 空间读取访问和 Meet 会议媒体读取访问。如果你在支持会议创建功能之前就已完成认证，请重新运行 `openclaw googlemeet auth login --json`，以便让刷新令牌具备 `meetings.space.created` scope。

浏览器回退不需要 OAuth 凭证。在该模式下，Google 认证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

接受以下环境变量作为回退：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或 `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

通过 `spaces.get` 解析 Meet URL、代码或 `spaces/{id}`：

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

在进行媒体工作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。使用 OAuth 凭证时，它会使用官方 Google Meet API。没有 OAuth 凭证时，它会回退为使用固定 Chrome 节点上已登录的浏览器配置文件。智能体可以使用 `google_meet` 工具，通过 `action: "create"` 一步完成创建和加入。如果只需要创建 URL，请传入 `"join": false`。

浏览器回退的示例 JSON 输出：

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

如果浏览器回退在创建 URL 之前遇到 Google 登录或 Meet 权限阻塞，Gateway 网关方法会返回失败响应，而 `google_meet` 工具会返回结构化细节，而不是纯字符串：

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

当智能体看到 `manualActionRequired: true` 时，应报告 `manualActionMessage` 以及浏览器节点/标签页上下文，并在操作员完成浏览器步骤之前停止打开新的 Meet 标签页。

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

创建 Meet 默认会加入。Chrome 或 Chrome 节点传输仍然需要一个已登录 Google 的 Chrome 配置文件，才能通过浏览器加入。如果该配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员先完成 Google 登录再重试。

只有在确认你的 Cloud 项目、OAuth principal 和会议参与者都已加入 Meet media APIs 的 Google Workspace Developer Preview Program 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 实时路径只需要启用插件、安装 BlackHole、SoX，以及一个后端实时语音提供商密钥。默认使用 OpenAI；设置 `realtime.provider: "google"` 可改用 Google Gemini Live：

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
- `chromeNode.node`：`chrome-node` 的可选节点 id / 名称 / IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在已退出登录的 Meet 访客页面上使用的名称
- `chrome.autoJoin: true`：通过 OpenClaw 浏览器自动化，在 `chrome-node` 上尽力填写访客名并点击 Join Now
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已进入通话，然后再触发实时引导
- `chrome.audioInputCommand`：SoX `rec` 命令，将 8 kHz G.711 mu-law 音频写入 stdout
- `chrome.audioOutputCommand`：SoX `play` 命令，从 stdin 读取 8 kHz G.711 mu-law 音频
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短口语回复，较深入回答使用 `openclaw_agent_consult`
- `realtime.introMessage`：实时桥接连接时的简短口头就绪检查；设为 `""` 可静默加入

可选覆盖：

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输时，它会将实际 PSTN 呼叫和 DTMF 委托给 Voice Call 插件。如果未启用 `voice-call`，Google Meet 仍然可以校验并记录拨号方案，但无法发起 Twilio 呼叫。

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

当 Chrome 运行在 Gateway 网关主机上时，使用 `transport: "chrome"`。当 Chrome 运行在已配对节点（例如 Parallels VM）上时，使用 `transport: "chrome-node"`。这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 列出活动会话或检查某个会话 ID。使用带有 `sessionId` 和 `message` 的 `action: "speak"`，让实时智能体立即说话。使用 `action: "test_speech"` 创建或复用会话、触发已知短语，并在 Chrome 主机能够报告时返回 `inCall` 健康状态。使用 `action: "leave"` 将会话标记为已结束。

`status` 在可用时会包含 Chrome 健康信息：

- `inCall`：Chrome 看起来已在 Meet 通话中
- `micMuted`：尽力检测的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限授予，或浏览器控制修复后语音才能工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接上次接收或发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome 实时模式针对实时语音循环做了优化。实时语音提供商会听取会议音频，并通过已配置的音频桥接说话。当实时模型需要更深层的推理、最新信息或常规 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，附带最近的会议转录上下文，并向实时语音会话返回简洁的口语回答。然后语音模型就可以把该回答说回会议中。它使用与 Voice Call 相同的共享实时咨询工具。

`realtime.toolPolicy` 控制咨询运行方式：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按 Meet 会话进行作用域划分，因此后续咨询调用可以在同一会议期间复用先前的咨询上下文。

要在 Chrome 完全加入通话后强制进行一次口头就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

如需完整的“加入并发言”烟雾测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 在线测试检查清单

在把会议交给无人值守智能体之前，请使用以下顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome 节点状态：

- `googlemeet setup` 全部为绿色。
- 当 Chrome 节点是默认传输方式或固定了节点时，`googlemeet setup` 会包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点通告了 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入了通话，并且 `test-speech` 返回的 Chrome 健康状态中包含 `inCall: true`。

对于远程 Chrome 主机，例如 Parallels macOS VM，在更新 Gateway 网关或 VM 后，这是最短且安全的检查方式：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载、VM 节点使用当前令牌已连接，以及 Meet 音频桥接在智能体打开真实会议标签页之前可用。

对于 Twilio 烟雾测试，请使用一个会暴露电话拨入详情的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查。
- Gateway 网关重新加载后，CLI 中可用 `voicecall`。
- 返回的会话具有 `transport: "twilio"` 和一个 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断被委托的语音通话。

## 故障排除

### 智能体看不到 Google Meet 工具

确认该插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。
正在运行的智能体只能看到当前 Gateway 网关进程已注册的插件工具。

### 没有已连接的 Google Meet 可用节点

在节点主机上运行：

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

该节点必须处于已连接状态，并列出 `googlemeet.chrome` 和 `browser.proxy`。
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

如果 `googlemeet setup` 的 `chrome-node-connected` 失败，或者 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点。对于局域网 Gateway 网关，这通常意味着：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然后重新加载节点服务，并再次运行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 浏览器打开了，但智能体无法加入

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它报告 `manualActionRequired: true`，请将 `manualActionMessage` 展示给操作员，并在浏览器操作完成前停止重试。

常见手动操作：

- 登录 Chrome 配置文件。
- 通过 Meet 主持人账户准入该访客。
- 当 Chrome 原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示 “Do you want people to hear you in the meeting?” 就报告“未登录”。这是 Meet 的音频选择过渡页；OpenClaw 会在可用时通过浏览器自动化点击 **Use microphone**，并继续等待真实会议状态。对于仅创建的浏览器回退，由于创建 URL 不需要实时音频路径，OpenClaw 可能会点击 **Continue without microphone**。

### 会议创建失败

当配置了 OAuth 凭证时，`googlemeet create` 会首先使用 Google Meet API 的 `spaces.create` 端点。
没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持之后签发的。较旧的令牌可能缺少 `meetings.space.created` scope；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"`，并且 `chromeNode.node` 指向一个已连接且具备 `browser.proxy` 和 `googlemeet.chrome` 的节点。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会复用现有的 `https://meet.google.com/new` 或 Google 账户提示标签页，而不是打开新标签页。如果智能体超时，请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 来指导操作员。在该操作完成之前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the meeting?”，请保持标签页打开。OpenClaw 应该通过浏览器自动化点击 **Use microphone**，或者对于仅创建回退点击 **Continue without microphone**，然后继续等待生成的 Meet URL。如果它无法这样做，错误中应提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体加入了，但不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

对于听讲/回话，请使用 `mode: "realtime"`。`mode: "transcribe"` 按设计不会启动双工实时语音桥接。

另外还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- 在 Chrome 主机上能看到 `BlackHole 2ch`。
- 在 Chrome 主机上存在 `rec` 和 `play`。
- Meet 的麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径进行路由。

`googlemeet doctor [session-id]` 会打印会话、节点、是否在通话中、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最后音频时间戳、字节计数和浏览器 URL。
当你需要原始 JSON 时，请使用 `googlemeet status [session-id]`。

如果某个智能体超时，而你已经能看到一个已打开的 Meet 标签页，请在不再打开新标签页的情况下检查该标签页：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`。它会聚焦并检查已配置 Chrome 节点上的现有 Meet 标签页。它不会打开新标签页，也不会创建新会话；它会报告当前阻塞项，例如登录、准入、权限或音频选择状态。该 CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行，并且 Chrome 节点必须已连接。

### Twilio 设置检查失败

当 `voice-call` 不在 allow 列表中或未启用时，`twilio-voice-call-plugin` 会失败。
请将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，并重新加载 Gateway 网关。

当 Twilio 后端缺少 account SID、auth token 或 caller number 时，`twilio-voice-call-credentials` 会失败。请在 Gateway 网关主机上设置这些变量：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

然后重启或重新加载 Gateway 网关，并运行：

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 默认仅进行就绪性检查。要对特定号码进行 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明确想发起真实的外呼通知电话时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通话开始了，但始终没有进入会议

确认 Meet 事件提供了电话拨入详情。传入准确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 的官方媒体 API 偏向接收，因此要在 Meet 通话中说话，仍然需要通过参会者路径。这个插件让这一边界保持可见：
Chrome 负责浏览器参会和本地音频路由；Twilio 负责电话拨入参会。

Chrome 实时模式需要以下两种方式之一：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到不同的虚拟设备，或使用 Loopback 风格的虚拟设备图。单个共享的 BlackHole 设备可能会把其他参会者的声音回传到通话中。

`googlemeet speak` 会触发 Chrome 会话的活动实时音频桥接。
`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委托的 Twilio 会话，`leave` 也会挂断底层语音通话。

## 相关内容

- [Voice call plugin](/zh-CN/plugins/voice-call)
- [Talk mode](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

---
read_when:
    - 你希望让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你希望让一个 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 的传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入显式的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-25T00:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83256d1c374aeaf18f9b2bdf7ae9cdfa9e053422c65b2db4dcee7013505b555a
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 的 Google Meet 参与者支持——该插件在设计上是显式的：

- 它只会加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建一个新的 Meet 空间，然后加入返回的
  URL。
- `realtime` 语音是默认模式。
- 当需要更深层的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：实时收听/回话使用 `realtime`，而 `transcribe`
  用于加入/控制浏览器，但不启用实时语音桥接。
- 认证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受一个拨入号码，以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音
提供商。OpenAI 是默认值；Google Gemini Live 也可通过
`realtime.provider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的
安装程序需要重启，之后 macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两部分：

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

该设置输出设计为便于智能体读取。它会报告 Chrome 配置文件、
音频桥接、节点固定、延迟实时介绍，以及在配置了 Twilio 委派时，
`voice-call` 插件和 Twilio 凭证是否已就绪。
将任何 `ok: false` 检查都视为在请求智能体加入前的阻塞项。
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

创建一个新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

只创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：当已配置 Google Meet OAuth 凭证时使用。这是
  最具确定性的路径，并且不依赖浏览器 UI 状态。
- 浏览器回退：当 OAuth 凭证缺失时使用。OpenClaw 会使用固定的 Chrome 节点，
  打开 `https://meet.google.com/new`，等待 Google 重定向到真实的
  会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件
  已经登录 Google。
  浏览器自动化会处理 Meet 自己的首次运行麦克风提示；该提示不会被视为 Google 登录失败。

命令/工具输出包含一个 `source` 字段（`api` 或 `browser`），这样智能体
就可以解释使用了哪条路径。默认情况下，`create` 会加入新会议，并返回
`joined: true` 以及加入会话。如只想生成 URL，请在
CLI 中使用 `create --no-join`，或向工具传入 `"join": false`。

或者告诉智能体：“创建一个 Google Meet，用实时语音加入它，并把
链接发给我。” 智能体应使用 `action: "create"` 调用 `google_meet`，然后
分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

对于仅观察/浏览器控制的加入，请设置 `"mode": "transcribe"`。这不会
启动双工实时模型桥接，因此它不会在会议中回话。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，选择 `BlackHole 2ch` 作为
OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用
独立的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备
足以完成首次 smoke 测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不需要**在 macOS VM 中运行完整的 OpenClaw Gateway 网关或模型 API 密钥，
只为了让 VM 承担 Chrome。你可以在本地运行 Gateway 网关和智能体，
然后在 VM 中运行一个节点主机。只需在 VM 上启用一次内置插件，
这样节点就会通告 Chrome 命令：

各部分运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时
  提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，
  以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥或模型
  提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，这样 macOS 才会暴露 `BlackHole 2ch`：

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

如果 `<gateway-host>` 是一个局域网 IP，而你没有使用 TLS，则节点会拒绝该
明文 WebSocket，除非你为该受信任的私有网络显式启用：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时也要使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，而不是
`openclaw.json` 设置。`openclaw node install` 会在安装命令中存在该变量时，
将它存储到 LaunchAgent 环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关可以看到该节点，并且它同时通告了 `googlemeet.chrome`
和浏览器能力/`browser.proxy`：

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

或者让智能体使用带有 `transport: "chrome-node"` 的 `google_meet` 工具。

如需一个单命令 smoke 测试，用于创建或复用会话、说出一段已知短语并打印
会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在加入过程中，OpenClaw 浏览器自动化会填写访客名称，点击 Join/Ask
to join，并在 Meet 出现首次运行的 “Use microphone” 提示时接受该选择。
在仅浏览器的会议创建期间，如果 Meet 没有暴露 use-microphone 按钮，
它也可以在不使用麦克风的情况下继续通过相同提示。
如果浏览器配置文件未登录、Meet 正在等待主持人
准入、Chrome 需要麦克风/摄像头权限，或 Meet 卡在某个
自动化无法解决的提示上，join/test-speech 结果会报告
`manualActionRequired: true`，并附带 `manualActionReason` 和
`manualActionMessage`。智能体应停止重试加入，报告这条确切
消息以及当前的 `browserUrl`/`browserTitle`，并且只在手动浏览器操作完成后再重试。

如果省略 `chromeNode.node`，只有在恰好有一个已连接节点
同时通告 `googlemeet.chrome` 和浏览器控制时，OpenClaw 才会自动选择。
如果连接了多个有能力的节点，请将 `chromeNode.node` 设置为节点 id、
显示名称或远程 IP。

常见故障检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，
  批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和
  `openclaw plugins enable browser`。同时确认
  Gateway 网关主机允许这两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch`
  并重启 VM。
- Chrome 打开了但无法加入：在 VM 中登录浏览器配置文件，或者
  保持设置 `chrome.guestName` 用于访客加入。访客自动加入使用 OpenClaw
  通过节点浏览器代理进行的浏览器自动化；请确保节点浏览器
  配置指向你想要的配置文件，例如
  `browser.defaultProfile: "user"` 或某个已命名的 existing-session 配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw
  会在打开新标签页之前激活同一 Meet URL 的现有标签页，并且
  浏览器会议创建会复用一个进行中的 `https://meet.google.com/new`
  或 Google 账号提示标签页，而不是再打开一个。
- 没有音频：在 Meet 中，将麦克风/扬声器通过 OpenClaw 使用的虚拟音频设备
  路径进行路由；为获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的路由。

## 安装说明

Chrome 的 realtime 默认值使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play`
  命令作为默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建
  `BlackHole 2ch` 音频设备，供 Chrome/Meet 路由使用。

OpenClaw 不会内置或重新分发这两个软件包。文档要求用户
通过 Homebrew 将它们作为主机依赖安装。SoX 的许可为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建一个
将 BlackHole 与 OpenClaw 一起打包的安装程序或 appliance，请审查 BlackHole 的
上游许可条款，或向 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输会在 Google Chrome 中打开 Meet URL，并以已登录的
Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。
如果已配置，它还会在打开 Chrome 前运行一个音频桥接健康检查命令和启动命令。
当 Chrome/音频位于 Gateway 网关主机上时使用 `chrome`；
当 Chrome/音频位于已配对节点（如 Parallels macOS VM）上时使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接来路由 Chrome 的麦克风和扬声器音频。
如果未安装 `BlackHole 2ch`，加入会因设置错误而失败，而不是静默加入却没有音频路径。

### Twilio

Twilio 传输是一种严格的拨号计划，并委派给 Voice Call 插件。它
不会解析 Meet 页面以提取电话号码。

当无法使用 Chrome 参与，或者你想要电话拨入回退时，请使用此方式。
Google Meet 必须为该会议暴露电话拨入号码和 PIN；
OpenClaw 不会从 Meet 页面发现这些信息。

请在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上启用：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 或将 "twilio" 设为默认值，如果 Twilio 应作为默认传输方式
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

通过环境变量或配置提供 Twilio 凭证。使用环境变量可以将
密钥保留在 `openclaw.json` 之外：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后，请重启或重新加载 Gateway 网关；插件配置变更
在 Gateway 网关进程重新加载前，不会出现在已运行的进程中。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委派已接通时，`googlemeet setup` 会包含成功的
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

## OAuth 与预检

OAuth 对于创建 Meet 链接是可选的，因为 `googlemeet create` 可以
回退到浏览器自动化。当你需要官方 API 创建、
空间解析或 Meet Media API 预检时，请配置 OAuth。

Google Meet API 访问首先使用个人 OAuth 客户端。配置
`oauth.clientId`，以及可选的 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个包含 refresh token 的 `oauth` 配置块。它使用 PKCE、
`http://localhost:8085/oauth2callback` 上的 localhost 回调，以及可通过 `--manual`
启用的手动复制/粘贴流程。

OAuth 同意范围包括 Meet 空间创建、Meet 空间读取访问，以及 Meet
会议媒体读取访问。如果你在会议创建支持出现之前就已完成认证，
请重新运行 `openclaw googlemeet auth login --json`，以便 refresh token 拥有 `meetings.space.created` 作用域。

浏览器回退不需要 OAuth 凭证。在这种模式下，Google
认证来自所选节点上已登录的 Chrome 配置文件，而不是来自 OpenClaw 配置。

以下环境变量可作为回退值使用：

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

在进行媒体工作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源以及加入会话。有 OAuth
凭证时，它会使用官方 Google Meet API。没有 OAuth 凭证时，它会
使用固定 Chrome 节点上已登录的浏览器配置文件作为回退。智能体可以
使用 `action: "create"` 调用 `google_meet` 工具，以一步完成创建和加入。
如仅创建 URL，请传入 `"join": false`。

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

默认情况下，创建 Meet 时会立即加入。Chrome 或 Chrome-node 传输仍然
需要一个已登录 Google 的 Chrome 配置文件才能通过浏览器加入。如果该
配置文件已登出，OpenClaw 会报告 `manualActionRequired: true` 或
浏览器回退错误，并要求操作员先完成 Google 登录再重试。

只有在确认你的 Cloud 项目、OAuth 主体以及会议参与者都已加入 Google
Workspace Developer Preview Program for Meet media APIs 后，
才将 `preview.enrollmentAcknowledged: true` 设为 true。

## 配置

常见的 Chrome realtime 路径只需要启用插件、安装 BlackHole、SoX，
以及一个后端实时语音提供商密钥。OpenAI 是默认值；设置
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
- `chrome.guestName: "OpenClaw Agent"`：在已登出 Meet 访客
  界面上使用的名称
- `chrome.autoJoin: true`：在 `chrome-node` 上通过 OpenClaw 浏览器自动化尽力完成访客名称填写并点击 Join Now
- `chrome.reuseExistingTab: true`：激活已有 Meet 标签页，而不是
  打开重复标签页
- `chrome.waitForInCallMs: 20000`：在触发实时介绍前，等待 Meet 标签页报告已进入通话
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law
  音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law
  音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口头回复，较深层回答则使用
  `openclaw_agent_consult`
- `realtime.introMessage`：当实时桥接
  连接后执行简短的口头就绪检查；将其设为 `""` 可静默加入

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
Google Meet 仍然可以验证并记录拨号计划，但无法发起 Twilio 呼叫。

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

当 Chrome 运行在 Gateway 网关主机上时使用 `transport: "chrome"`。当
Chrome 运行在已配对节点（如 Parallels VM）上时，使用
`transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在
Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 列出活动会话或检查某个会话 ID。使用
带有 `sessionId` 和 `message` 的 `action: "speak"`，让实时智能体
立即发声。使用 `action: "test_speech"` 创建或复用会话，
触发一段已知短语，并在 Chrome 主机可报告时返回 `inCall`
健康状态。使用 `action: "leave"` 将会话标记为结束。

`status` 在可用时包含 Chrome 健康状态：

- `inCall`：Chrome 看起来已经进入 Meet 通话
- `micMuted`：尽力判断的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：该
  浏览器配置文件需要手动登录、Meet 主持人准入、权限处理，或
  浏览器控制修复，语音功能才能工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接中最近一次接收到或发送出去的音频时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome realtime 模式针对实时语音循环做了优化。实时语音
提供商会听取会议音频，并通过已配置的音频桥接发声。
当实时模型需要更深层推理、最新信息或普通 OpenClaw 工具时，
它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规的 OpenClaw 智能体，并带上最近的
会议转录上下文，然后向实时语音会话返回一条简洁的口头回答。语音模型
随后可以将这条回答说回会议中。
它与 Voice Call 共用同一个实时咨询工具。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用正常的
  智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按 Meet 会话作用域划分，因此在同一次会议期间，
后续咨询调用可以复用先前的咨询上下文。

若要在 Chrome 完全加入通话后强制执行一次口头就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

若要执行完整的加入并发声 smoke 测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试清单

在将会议交给无人值守的智能体之前，请使用以下流程：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，并且 `test-speech` 返回包含
  `inCall: true` 的 Chrome 健康状态。

对于 Twilio smoke 测试，请使用一个暴露电话拨入详情的会议：

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
- 返回的会话具有 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断被委派的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认该插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。
正在运行的智能体只能看到由当前 Gateway 网关
进程注册的插件工具。

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

该节点必须已连接，并列出 `googlemeet.chrome` 以及 `browser.proxy`。
Gateway 网关配置还必须允许这些节点命令：

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

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它
报告 `manualActionRequired: true`，请将 `manualActionMessage` 展示给操作员，
并在浏览器操作完成前停止重试。

常见的手动操作：

- 登录 Chrome 配置文件。
- 由 Meet 主持人账号批准访客加入。
- 当 Chrome 的原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

如果 Meet 显示 “Do you want people to
hear you in the meeting?”，不要仅因此报告“未登录”。
这是 Meet 的音频选择过渡页；在可用时，OpenClaw 会通过浏览器自动化点击 **Use microphone**，并继续等待真实的会议状态。对于仅创建的浏览器回退路径，OpenClaw
可能会点击 **Continue without microphone**，因为创建 URL 并不需要
实时音频路径。

### 会议创建失败

当配置了 OAuth 凭证时，`googlemeet create` 会首先使用 Google Meet API 的 `spaces.create` 端点。
没有 OAuth 凭证时，它会回退到固定 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，
  或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：refresh token 是在添加创建支持之后签发的。
  较旧的 token 可能缺少 `meetings.space.created` 作用域；请重新运行
  `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 和
  `chromeNode.node` 指向一个已连接节点，并且该节点具备 `browser.proxy` 和
  `googlemeet.chrome`。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录
  Google，并且能够打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试时会复用现有的 `https://meet.google.com/new`
  或 Google 账号提示标签页，而不是打开新标签页。如果智能体超时，
  请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the
  meeting?”，请保持该标签页打开。OpenClaw 应通过浏览器
  自动化点击 **Use microphone**，或者在仅创建的回退路径中点击 **Continue without microphone**，
  然后继续等待生成的 Meet URL。如果它做不到，错误信息应提到
  `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体已加入，但不说话

检查 realtime 路径：

```bash
openclaw googlemeet setup
openclaw googlemeet status
```

收听/回话请使用 `mode: "realtime"`。`mode: "transcribe"` 则是有意
不启动双工实时语音桥接。

另外还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- 在 Chrome 主机上可以看到 `BlackHole 2ch`。
- 在 Chrome 主机上存在 `rec` 和 `play`。
- Meet 的麦克风和扬声器通过 OpenClaw 使用的虚拟音频路径进行路由。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。
请将其添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载
Gateway 网关。

当 Twilio 后端缺少 account
SID、auth token 或 caller number 时，`twilio-voice-call-credentials` 会失败。在 Gateway 网关主机上设置这些值：

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

确认该 Meet 事件暴露了电话拨入详情。传入精确的拨入
号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商需要在输入 PIN 前暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 的官方媒体 API 主要是接收导向的，因此向 Meet
通话中发声仍然需要一个参与者路径。该插件会明确保留这条边界：
Chrome 负责浏览器参与和本地音频路由；Twilio 负责
电话拨入参与。

Chrome realtime 模式需要以下其一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 负责
  实时模型桥接，并在这些
  命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令负责整个本地
  音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到独立的
虚拟设备，或使用类似 Loopback 的虚拟设备图。
单个共享的 BlackHole 设备可能会将其他参与者的声音回送到通话中。

`googlemeet speak` 会触发 Chrome
会话的活动实时音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 还会挂断底层语音呼叫。

## 相关内容

- [Voice call plugin](/zh-CN/plugins/voice-call)
- [Talk mode](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

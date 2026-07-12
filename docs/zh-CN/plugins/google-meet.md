---
read_when:
    - 你想让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你想让 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并默认启用智能体语音回复
title: Google Meet 插件
x-i18n:
    generated_at: "2026-07-12T14:36:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw 智能体可通过 `google-meet` 插件加入明确指定的 Meet URL。该插件的范围特意设计得很窄：

- 它只加入 `https://meet.google.com/...` URL；绝不会使用自行发现的电话号码拨入会议。
- `googlemeet create` 可以通过 Google Meet API（或浏览器回退方案）创建新的 Meet URL，并默认加入该会议。
- Chrome 参会使用已登录的 Chrome 配置文件，也可以选择在已配对节点上运行。Twilio 参会通过[语音通话插件](/zh-CN/plugins/voice-call)拨打电话号码，并附加 PIN/DTMF；它无法直接拨打 Meet URL。
- `mode: "agent"`（默认）使用实时提供商转录参会者的语音，将其路由到配置的 OpenClaw 智能体，并使用常规 OpenClaw TTS 朗读回答。`mode: "bidi"` 允许实时语音模型直接回答。`mode: "transcribe"` 以仅观察方式加入，不进行语音回应。
- 插件加入通话时不会自动播放同意声明。
- CLI 命令为 `googlemeet`；`meet` 保留用于更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖项，然后设置实时提供商密钥。OpenAI 是 `agent` 模式的默认转录提供商；Google Gemini Live 可用作 `bidi` 模式的语音提供商：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 仅当 bidi 模式的 realtime.voiceProvider 为 "google" 时才需要
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 Chrome 用于路由音频的 `BlackHole 2ch` 虚拟音频设备。Homebrew 安装程序要求重启，之后 macOS 才会显示该设备：

```bash
sudo reboot
```

重启后，验证这两个组件：

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

检查设置，然后加入：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

`setup` 输出可供智能体读取，并会根据模式和传输方式调整：它会报告 Chrome 配置文件、节点固定情况，以及实时 Chrome 加入所需的 BlackHole/SoX 音频桥接和延迟开场白检查。仅观察加入会跳过实时功能的前置条件：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

配置 Twilio 委派后，`setup` 还会报告 `voice-call`、Twilio 凭据和公开 webhook 暴露是否就绪。智能体加入前，应将任何 `ok: false` 检查视为该传输方式或模式的阻断项。使用 `--json` 获取机器可读输出，并使用 `--transport chrome|chrome-node|twilio` 提前检查特定传输方式：

```bash
openclaw googlemeet setup --transport twilio
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

在非 macOS Gateway 网关主机上，`google_meet` 仍会显示，可用于工件、日历、设置、转录、Twilio 和 `chrome-node` 操作，但本地 Chrome 语音回应（`transport: "chrome"` 且 `mode: "agent"` 或 `"bidi"`）会在到达音频桥接前被阻止，因为该路径目前依赖 macOS `BlackHole 2ch`。请改用 `mode: "transcribe"`、Twilio 拨入或 macOS `chrome-node` 主机。

### 创建会议

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` 有两条路径，结果的 `source` 字段会报告所用路径：

- **`api`**：配置 Google Meet OAuth 凭据时使用。行为确定，不依赖浏览器 UI 状态。
- **`browser`**：未配置 OAuth 凭据时使用。OpenClaw 会在固定的 Chrome 节点上打开 `https://meet.google.com/new`，并等待 Google 重定向到真实的会议代码 URL；该节点上的 OpenClaw Chrome 配置文件必须已登录 Google。加入和创建操作都会优先复用现有 Meet 标签页（或正在处理的 `.../new` / Google 账号提示标签页），而不是打开新标签页；标签页匹配会忽略 `authuser` 等无害的查询字符串。

`create` 默认加入会议，并返回 `joined: true` 和加入会话。传入 `--no-join`（CLI）或 `"join": false`（工具）可仅创建 URL。

对于通过 API 创建的会议室，请设置明确的访问策略，而不是继承 Google 账号的默认值：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | 无需请求加入即可参会的人员                                  |
| --------------- | ----------------------------------------------------------- |
| `OPEN`          | 任何拥有 Meet URL 的人                                      |
| `TRUSTED`       | 主办方组织内的可信用户、受邀外部用户和拨入用户              |
| `RESTRICTED`    | 仅限受邀者                                                  |

此设置仅适用于通过 API 创建的会议室，因此必须配置 OAuth。如果你在此选项推出前已完成身份验证，请在 OAuth consent screen 中添加 `meetings.space.settings` scope 后，重新运行 `openclaw googlemeet auth login --json`。

如果浏览器回退方案遇到 Google 登录或 Meet 权限阻断，工具会返回 `manualActionRequired: true`，以及 `manualActionReason`、`manualActionMessage` 和 `browser.nodeId`/`browser.targetId`/`browserUrl`。请报告该消息，并停止打开新的 Meet 标签页，直到操作员完成浏览器步骤。

### 仅观察加入

设置 `"mode": "transcribe"` 可跳过双工实时桥接（不需要 BlackHole/SoX，也不进行语音回应）。转录模式的 Chrome 加入还会跳过 OpenClaw 的麦克风/摄像头权限授予以及 Meet 的 **Use microphone** 流程；如果 Meet 显示音频选择中间页面，自动化会先尝试 **Continue without microphone**。在此模式下，受管 Chrome 传输会安装一个尽力而为的 Meet 字幕观察器。`googlemeet status --json` 和 `googlemeet doctor` 会报告 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText` 以及 `recentTranscript` 尾部内容。

要读取有界会话转录，请读取所跟踪的确切 Meet 标签页：

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

观察器在 Meet 页面中最多保留 2,000 行已完成的字幕。可见的渐进文本会一直保留在状态健康信息的尾部，直到字幕行完成，因此保存 `nextIndex` 不会跳过后续的文本扩展；离开时会先完成可见行，再生成快照。`droppedLines` 报告超过上限时从开头丢失的行。最近结束的四个会话转录在 Gateway 网关重启前仍可读取。更早结束的转录会返回 `evicted: true`。这是有意使用的运行时内存，而不是持久会议历史存储：重启 Gateway 网关、在生成快照前关闭标签页或超出文档所述上限，都可能导致字幕丢失。

要执行是/否式的收听探测：

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

它会以转录模式加入，等待新的字幕/转录变化，并返回 `listenVerified`、`listenTimedOut`、手动操作字段以及当前字幕健康信息。

### 实时会话健康状态

在语音回应会话期间，`google_meet` 状态会报告 Chrome/音频桥接健康信息：`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近的输入/输出时间戳、字节计数器以及桥接关闭状态。受管 Chrome 会话仅在健康信息报告 `inCall: true` 后才会朗读开场白/测试短语；否则会设置 `speechReady: false` 并阻止语音尝试，而不是静默地不执行任何操作。

本地 Chrome 通过已登录的 OpenClaw 浏览器配置文件加入，并且麦克风/扬声器路径需要 `BlackHole 2ch`。首次冒烟测试只需一个 BlackHole 设备，但可能产生回声；要获得清晰的双工音频，请使用独立的虚拟设备或 Loopback 风格的音频图。

## 本地 Gateway 网关 + Parallels Chrome

如果只是让 macOS VM 提供 Chrome，则无需在 VM 内运行完整的 Gateway 网关，也不需要配置模型 API key。在本地运行 Gateway 网关和智能体；在 VM 中运行节点主机。

| 运行位置             | 内容                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway 网关主机     | OpenClaw Gateway 网关、Agent 工作区、模型/API key、实时提供商、Google Meet 插件配置             |
| Parallels macOS VM   | OpenClaw CLI/节点主机、Chrome、SoX、BlackHole 2ch、已登录 Google 的 Chrome 配置文件              |
| VM 中不需要          | Gateway 网关服务、智能体配置、模型提供商设置                                                    |

安装 VM 依赖项、重启并验证：

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

在 VM 中启用插件并启动节点主机：

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

如果 `<gateway-host>` 是不使用 TLS 的 LAN IP，请为该可信专用网络显式启用此选项：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

安装为 LaunchAgent 时使用相同的标志（这是进程环境；如果安装命令中提供了该标志，它会存储在 LaunchAgent 环境中，而不是作为 `openclaw.json` 设置）：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

从 Gateway 网关主机批准该节点，然后确认它同时公布 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

通过该节点路由 Meet：

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
            guestName: "OpenClaw 智能体",
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

要使用单条命令执行冒烟测试，创建或复用会话、朗读已知短语并打印会话健康信息：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

实时加入期间，浏览器自动化会填写访客姓名，点击 Join/Ask to join，并在 Meet 首次运行时出现 "Use microphone" 提示时接受该提示（仅观察加入和仅通过浏览器创建会议时则选择 "Continue without microphone"）。如果配置文件已退出登录、Meet 正在等待主办方准入、Chrome 需要麦克风/摄像头权限，或者 Meet 卡在尚未处理的提示上，结果会报告 `manualActionRequired: true`，以及 `manualActionReason` 和 `manualActionMessage`。请停止重试，报告该消息以及 `browserUrl`/`browserTitle`，并仅在手动操作完成后重试。

如果省略 `chromeNode.node`，则只有在恰好一个已连接节点同时公布 `googlemeet.chrome` 和浏览器控制能力时，OpenClaw 才会自动选择该节点；连接了多个具备相应能力的节点时，请固定 `chromeNode.node`（节点 ID、显示名称或远程 IP）。

### 常见故障检查

| 症状                                                     | 修复方法                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Configured Google Meet node ... is not usable: offline` | 已固定的节点已知但不可用。报告此设置阻塞问题；除非被要求，否则不要静默回退到其他传输方式。                                                                                                                                                                               |
| `No connected Google Meet-capable node`                  | 在虚拟机中运行 `openclaw node run`，批准配对，并在其中运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。确认 `gateway.nodes.allowCommands` 包含 `googlemeet.chrome` 和 `browser.proxy`。                                                   |
| `BlackHole 2ch audio device not found`                   | 在正在检查的主机上安装 `blackhole-2ch`，然后重启。                                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | 在虚拟机中安装 `blackhole-2ch`，然后重启虚拟机。                                                                                                                                                                                                                         |
| Chrome 已打开但无法加入                                  | 在虚拟机的浏览器配置文件中登录，或保持设置 `chrome.guestName`。访客自动加入功能通过节点浏览器代理使用 OpenClaw 浏览器自动化；将节点的 `browser.defaultProfile`（或一个具名的现有会话配置文件）指向你需要的配置文件。                                                     |
| Meet 标签页重复                                          | 保持 `chrome.reuseExistingTab: true`。OpenClaw 会激活具有相同 URL 的现有标签页；在打开新标签页之前，创建操作会复用正在处理的 `.../new` 或 Google 账号提示标签页。                                                                                                        |
| 没有音频                                                 | 通过 OpenClaw 使用的虚拟音频路径路由 Meet 麦克风和扬声器；使用独立的虚拟设备或 Loopback 式路由，以获得清晰的双工音频。                                                                                                                                                   |

## 安装说明

Chrome 回话默认使用两个 OpenClaw 未内置或再分发的外部工具；请通过 Homebrew 将它们安装为主机依赖项：

- `sox`：命令行音频实用工具。插件会针对默认的 24 kHz PCM16 音频桥接发出明确的 CoreAudio 设备命令。
- `blackhole-2ch`：macOS 虚拟音频驱动程序，提供 Chrome/Meet 路由所使用的 `BlackHole 2ch` 设备。

SoX 采用 `LGPL-2.0-only AND GPL-2.0-only` 许可；BlackHole 采用 GPL-3.0 许可。如果你构建的安装程序或设备将 BlackHole 与 OpenClaw 捆绑，请审查 BlackHole 的上游许可条款，或从 Existential Audio 获取单独的许可证。

## 传输方式

| 传输方式      | 适用场景                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/音频运行在 Gateway 网关主机上                                                              |
| `chrome-node` | Chrome/音频运行在已配对节点上（例如 Parallels macOS 虚拟机）                                      |
| `twilio`      | Chrome 无法参与时，通过 Voice Call 插件使用电话拨入作为回退方式                                   |

### Chrome

通过 OpenClaw 浏览器控制打开 Meet URL，并以已登录的 OpenClaw 浏览器配置文件加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`；如果已配置，则会在打开 Chrome 前运行音频桥接健康检查/启动命令。对于本地 Chrome，使用 `browser.defaultProfile` 选择配置文件；`chrome.browserProfile` 则会传递给 `chrome-node` 主机。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 麦克风/扬声器音频通过本地 OpenClaw 音频桥接路由。如果未安装 `BlackHole 2ch`，加入操作会因设置错误而失败，而不是在没有音频路径的情况下加入。

### Twilio

委托给 [Voice Call 插件](/zh-CN/plugins/voice-call)的严格拨号方案。它不会解析 Meet 页面以获取电话号码；Google Meet 必须为会议提供电话拨入号码和 PIN。

在 Gateway 网关主机上启用 Voice Call，而不是在 Chrome 节点上：

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 或者，如果 Twilio 应作为默认值，则设置为 "twilio"
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
            instructions: "以 OpenClaw 智能体身份加入此 Google Meet。请保持简短。",
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

通过环境变量提供 Twilio 凭据，避免将密钥写入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果 OpenAI 是实时语音提供商，则改用 `realtime.provider: "openai"` 和 `OPENAI_API_KEY`。

启用 `voice-call` 后，重启或重新加载 Gateway 网关；插件配置更改在重新加载前不会生效。验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

连接 Twilio 委托后，`googlemeet setup` 会包含 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

使用 `--dtmf-sequence` 指定自定义序列，并在 PIN 前加上 `w` 或逗号以暂停：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

创建 Meet 链接时 OAuth 是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。为通过官方 API 创建会议、解析空间或执行 Meet Media API 预检配置 OAuth。Chrome/Chrome-node 加入从不依赖 OAuth；无论是否配置 OAuth，它们都会使用已登录的 Chrome 配置文件、BlackHole/SoX，以及（对于 `chrome-node`）已连接的节点。

### 创建 Google 凭据

在 Google Cloud Console 中：

<Steps>
<Step title="创建或选择项目">
</Step>
<Step title="启用 Google Meet REST API">
</Step>
<Step title="配置 OAuth consent screen">
对于 Google Workspace 组织，Internal 最简单。External 适用于个人/测试设置；应用处于 Testing 状态时，将每个需要授权的 Google 账号添加为测试用户。
</Step>
<Step title="添加请求的权限范围">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`（Calendar 查找）
- `https://www.googleapis.com/auth/drive.meet.readonly`（文字记录/智能笔记文档正文导出）

</Step>
<Step title="创建 OAuth client ID">
应用类型为 **Web application**。Authorized redirect URI：

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="复制 client ID 和 client secret">
</Step>
</Steps>

`spaces.create` 需要 `meetings.space.created`。`meetings.space.readonly` 用于将 Meet URL/代码解析为空间。`meetings.space.settings` 允许 OpenClaw 在通过 API 创建会议室时传递 `SpaceConfig` 设置，例如 `accessType`。`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体工作；实际使用 Media API 时，Google 可能要求加入 Developer Preview。仅使用 `--today`/`--event` 查找日历时才需要 `calendar.events.readonly`。仅使用 `--include-doc-bodies` 导出时才需要 `drive.meet.readonly`。如果你只需要基于浏览器的 Chrome 加入，请完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId` 和可选的 `oauth.clientSecret`（或通过环境变量传递），然后运行：

```bash
openclaw googlemeet auth login --json
```

此命令会通过 `http://localhost:8085/oauth2callback` 上的 localhost 回调运行 PKCE 流程，并输出包含刷新令牌的 `oauth` 配置块。当浏览器无法访问本地回调时，添加 `--manual` 以使用复制/粘贴流程：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 输出：

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

将 `oauth` 对象存储在插件配置下：

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

如果不希望将刷新令牌写入配置，请优先使用环境变量；系统会先解析配置，然后以环境变量作为回退。如果你在支持创建会议、查找日历或导出文档正文之前完成了身份验证，请重新运行 `openclaw googlemeet auth login --json`，使刷新令牌涵盖当前的权限范围集合。

### 使用 Doctor 验证 OAuth

```bash
openclaw googlemeet doctor --oauth --json
```

此命令会检查 OAuth 配置是否存在，以及刷新令牌能否生成访问令牌，而无需加载 Chrome 运行时或要求连接节点。报告仅包含状态字段（`ok`、`configured`、`tokenSource`、`expiresAt`、检查消息），绝不会输出访问令牌、刷新令牌或客户端密钥。

| 检查项               | 含义                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 和 `oauth.refreshToken`，或存在缓存的访问令牌                    |
| `oauth-token`        | 缓存的访问令牌仍然有效，或刷新令牌已生成新令牌                                         |
| `meet-spaces-get`    | 可选的 `--meeting` 检查已解析现有 Meet 空间                                            |
| `meet-spaces-create` | 可选的 `--create-space` 检查已创建新的 Meet 空间                                       |

使用会产生副作用的创建检查，验证 Meet API 已启用并具有 `spaces.create` 权限范围：

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

验证对现有空间的读取权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

这些检查返回 `403` 通常意味着 Meet REST API 未启用、刷新令牌缺少所需权限范围，或者 Google 账号无法访问该空间。出现刷新令牌错误意味着需要重新运行 `openclaw googlemeet auth login --json`，并存储新的 `oauth` 块。

浏览器回退无需 OAuth；其中的 Google 身份验证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

以下环境变量可用作回退：

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 或 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 或 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 或 `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 或 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 或 `GOOGLE_MEET_PREVIEW_ACK`

### 解析、预检和读取工件

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet 创建会议记录后：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录；传入 `--all-conference-records` 可处理所有保留的记录。

日历查询会先从 Google Calendar 解析会议 URL，再读取工件（需要包含 Calendar 事件只读权限范围的刷新令牌）：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索包含 Meet 链接的事件；`--event <query>` 搜索文本匹配的事件；`--calendar <id>` 指定非主日历。`calendar-events` 会预览匹配的事件，并标记 `latest`/`artifacts`/`attendance`/`export` 将选择哪一个。

如果已知会议记录 ID，可直接指定：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

关闭 API 创建的空间中的会议室：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

此命令调用 `spaces.endActiveConference`，对于授权账号可管理的空间，需要具有 `meetings.space.created` 权限范围的 OAuth。它接受 Meet URL、会议代码或 `spaces/{id}`，并先将其解析为 API 空间资源。这与 `googlemeet leave` 不同：`leave` 会停止 OpenClaw 的本地/会话参与；`end-active-conference` 则请求 Google Meet 结束该空间中正在进行的会议。

写入易读的报告：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

当 Google 提供相应数据时，`artifacts` 会返回会议记录元数据，以及参与者、录制内容、转录文本、结构化转录条目和智能笔记资源元数据。对于大型会议，`--no-transcript-entries` 可跳过条目查询。`attendance` 会将参与者展开为参与者会话行，其中包含首次/最后出现时间、会话总时长、迟到/早退标志，并按已登录用户或显示名称合并重复的参与者资源；`--no-merge-duplicates` 会将原始资源分开保留，`--late-after-minutes`/`--early-before-minutes` 用于调整阈值。

`export` 会写入一个文件夹，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用的任何 Calendar 事件以及部分检索警告。`--zip` 还会在文件夹旁写入一个可移植归档文件。`--include-doc-bodies` 会通过 Drive `files.export` 导出链接的转录文本/智能笔记 Google Docs 文本（需要 Drive Meet 只读权限范围）；如果不使用该选项，导出内容仅包含 Meet 元数据和结构化转录条目。部分工件失败（智能笔记列举、转录条目或文档正文错误）会将警告保留在摘要/清单中，而不会导致整个导出失败。`--dry-run` 会获取相同的数据并输出清单 JSON，但不会创建文件夹或 ZIP。

智能体通过 `google_meet` 工具使用相同的操作（`export`、带有 `accessType` 的 `create`、`end_active_conference`、`test_listen`）；请参阅[工具](#tool)。

### 实时冒烟测试

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| 变量                                                                                                                      | 用途                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | 启用受保护的实时测试                                                   |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | 保留的 Meet URL、代码或 `spaces/{id}`                                  |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth 客户端 ID                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | 刷新令牌                                                               |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | 可选；不带 `OPENCLAW_` 前缀的同名回退变量也可用                        |

基础工件/出席情况冒烟测试需要 `meetings.space.readonly` 和 `meetings.conference.media.readonly`。Calendar 查询需要 `calendar.events.readonly`。Drive 文档正文导出需要 `drive.meet.readonly`。

### 创建示例

```bash
openclaw googlemeet create
```

输出新会议的 URI、来源和加入会话。使用 OAuth 时，它会使用 Meet API；不使用 OAuth 时，则使用固定 Chrome 节点上已登录的配置文件。浏览器回退 JSON：

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

如果浏览器回退首先遇到 Google 登录或 Meet 权限阻止项，`google_meet` 会返回结构化详细信息，而不是纯字符串：

```json
{
  "source": "browser",
  "error": "google-login-required: 在 OpenClaw 浏览器配置文件中登录 Google，然后重试创建会议。",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "在 OpenClaw 浏览器配置文件中登录 Google，然后重试创建会议。",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

API 创建 JSON：

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

创建后默认加入，但 Chrome/Chrome 节点仍需已登录的 Google 配置文件才能通过浏览器加入；如果已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员完成 Google 登录后重试。

仅在确认你的 Cloud 项目、OAuth 主体和会议参与者均已加入适用于 Meet 媒体 API 的 Google Workspace Developer Preview Program 后，才可设置 `preview.enrollmentAcknowledged: true`。

## 配置

常用的 Chrome 智能体路径只需要启用插件、BlackHole、SoX、实时提供商密钥，以及已配置的 OpenClaw TTS 提供商：

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

### 默认值

| 键                                | 默认值                                   | 说明                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | 接受 `"realtime"` 作为 `"agent"` 的旧版别名；新调用方应使用 `"agent"`                                                                                                                                             |
| `chromeNode.node`                 | 未设置                                   | `chrome-node` 的节点 ID/名称/IP；当可能连接多个具备相应能力的节点时为必填项                                                                                                                                        |
| `chrome.launch`                   | `true`                                   | 启动 Chrome 以加入会议；仅在复用已打开的会话时设为 `false`                                                                                                                                                        |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | 显示在未登录的 Meet 访客界面上                                                                                                                                                                                    |
| `chrome.autoJoin`                 | `true`                                   | 在 `chrome-node` 上尽力填写访客名称并点击 Join Now                                                                                                                                                                |
| `chrome.reuseExistingTab`         | `true`                                   | 激活现有 Meet 标签页，而不是打开重复标签页                                                                                                                                                                        |
| `chrome.waitForInCallMs`          | `20000`                                  | 在触发回话开场白之前，等待 Meet 标签页报告已进入通话                                                                                                                                                              |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | 命令对音频格式；`"g711-ulaw-8khz"` 仅用于输出电话音频的旧版/自定义命令对                                                                                                                                          |
| `chrome.audioBufferBytes`         | `4096`                                   | 用于生成的命令对音频命令的 SoX 处理缓冲区（为 SoX 默认 8192 字节缓冲区的一半，可降低管道延迟）；值的下限限制为 17 字节                                                                                             |
| `chrome.audioInputCommand`        | 生成的 SoX 命令                          | 从 CoreAudio `BlackHole 2ch` 读取，并以 `chrome.audioFormat` 格式写入音频                                                                                                                                          |
| `chrome.audioOutputCommand`       | 生成的 SoX 命令                          | 读取 `chrome.audioFormat` 格式的音频，并写入 CoreAudio `BlackHole 2ch`                                                                                                                                             |
| `chrome.bargeInInputCommand`      | 未设置                                   | 可选的本地麦克风命令，在助手播放期间写入有符号 16 位小端序单声道 PCM，用于检测人工插话；适用于由 Gateway 网关托管的命令对桥接                                                                                      |
| `chrome.bargeInRmsThreshold`      | `650`                                    | 视为人工打断的 RMS 电平                                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | 视为人工打断的峰值电平                                                                                                                                                                                            |
| `chrome.bargeInCooldownMs`        | `900`                                    | 重复清除打断状态之间的最短延迟                                                                                                                                                                                    |
| `mode`（每个请求）                | `"agent"`                                | 回话模式；请参阅[智能体和双向模式](#agent-and-bidi-modes)表                                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | 当下方限定范围的字段未设置时使用的兼容性回退值                                                                                                                                                                    |
| `realtime.transcriptionProvider`  | `"openai"`                               | `agent` 模式用于实时转写的提供商 ID                                                                                                                                                                               |
| `realtime.voiceProvider`          | 未设置                                   | `bidi` 模式用于直接实时语音的提供商 ID；设为 `"google"` 可使用 Gemini Live，同时让智能体模式的转写继续使用 OpenAI。与 `realtime.model` 配合可选择具体的 Gemini Live 模型。                                          |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | 请参阅[智能体和双向模式](#agent-and-bidi-modes)                                                                                                                                                                   |
| `realtime.instructions`           | 简短的口语回复指令                       | 指示模型简短作答，并使用 `openclaw_agent_consult` 提供更深入的回答                                                                                                                                                 |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | 实时桥接连接时播报一次；设为 `""` 可静默加入                                                                                                                                                                      |
| `realtime.agentId`                | `"main"`                                 | `openclaw_agent_consult` 使用的 OpenClaw 智能体 ID                                                                                                                                                                |
| `voiceCall.enabled`               | `true`                                   | 将 Twilio PSTN 通话、DTMF 和开场问候交由 Voice Call 插件处理                                                                                                                                                      |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | 通过 Twilio 播放由 PIN 生成的 DTMF 序列前的初始等待时间                                                                                                                                                           |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Voice Call 启动 Twilio 通话段后，请求实时开场问候前的延迟                                                                                                                                                         |

`chrome.audioBridgeCommand` 和 `chrome.audioBridgeHealthCommand` 允许外部桥接接管整个本地音频路径，而不使用 `chrome.audioInputCommand`/`chrome.audioOutputCommand`；有关哪些模式可以使用它们的限制，请参阅[说明](#notes)。

已有针对旧版 `realtime.provider: "google"` 结构的 `openclaw doctor --fix` 迁移：当 `realtime.voiceProvider: "google"` 和 `realtime.transcriptionProvider: "openai"` 尚未设置时，它会将该意图迁移到这两个字段。

### 可选覆盖项

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
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

在智能体模式下，收听和语音输出均使用 ElevenLabs：

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

Meet 的固定语音来自 `messages.tts.providers.elevenlabs.speakerVoiceId`。启用 TTS 模型覆盖后，智能体回复也可以使用按回复指定的 `[[tts:speakerVoiceId=... model=eleven_v3]]` 指令，但对于会议，配置是确定性的默认设置。加入会议时，日志会显示 `transcriptionProvider=elevenlabs`，每次语音回复都会记录 `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`。

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

使用 Twilio 传输且 `voiceCall.enabled: true`（默认值）时，Voice Call 会先播放 DTMF 序列，再打开实时媒体流，然后使用已保存的开场文本作为初始实时问候。如果未启用 `voice-call`，Google Meet 仍可验证并记录拨号方案，但无法拨打 Twilio 电话。

将 `voiceCall.gatewayUrl` 保持未设置，以使用本地可信的 Gateway 网关运行时，这会在整个通话期间保留发起调用的智能体。已配置的 Gateway 网关 URL 仍是一个显式 WebSocket 目标，且无法验证插件来源；非默认智能体加入时会以失败关闭，而不是静默使用另一个智能体。需要按智能体进行路由时，请在同一个 Gateway 网关进程中运行 Google Meet 和 Voice Call。

## 工具

智能体使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | 用途                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| `join`                  | 加入显式指定的 Meet URL                                                                                |
| `create`                | 创建空间（默认同时加入）；支持 `accessType`/`entryPointAccess`                                        |
| `status`                | 列出活动会话，或通过 `sessionId` 检查某个会话                                                         |
| `setup_status`          | 运行与 `googlemeet setup` 相同的检查                                                                   |
| `resolve_space`         | 通过 `spaces.get` 解析 URL、代码或 `spaces/{id}`                                                       |
| `preflight`             | 验证 OAuth 和会议解析的前置条件                                                                        |
| `latest`                | 查找某个会议的最新会议记录                                                                             |
| `calendar_events`       | 预览包含 Meet 链接的日历事件                                                                           |
| `artifacts`             | 列出会议记录以及参与者、录制、转录文本和智能笔记元数据                                                 |
| `attendance`            | 列出参与者和参与者会话                                                                                 |
| `export`                | 写入工件、出席情况、转录文本和清单包；设置 `"dryRun": true` 可仅生成清单                               |
| `recover_current_tab`   | 聚焦或检查现有 Meet 标签页，而不打开新标签页                                                          |
| `transcript`            | 读取有界字幕转录文本；`sinceIndex` 从上一个 `nextIndex` 处继续                                        |
| `leave`                 | 结束会话（Chrome 点击离开；仅关闭其打开的标签页；Twilio 挂断）                                        |
| `end_active_conference` | 结束由 API 管理的空间中正在进行的 Google Meet 会议                                                     |
| `speak`                 | 根据 `sessionId` 和 `message`，让实时智能体立即说话                                                    |
| `test_speech`           | 创建或复用会话，触发一个已知短语，并返回 Chrome 健康状态                                               |
| `test_listen`           | 创建或复用仅观察会话，等待字幕或转录文本发生变化                                                       |

`test_speech` 始终强制使用 `mode: "agent"` 或 `"bidi"`；如果要求以 `mode: "transcribe"` 运行，则会失败，因为仅观察会话无法输出语音。其 `speechOutputVerified` 结果依据该次调用期间实时音频输出字节数是否增加，因此复用会话中的旧音频不算作新的检查。

对于 Chrome 传输，`leave` 点击 Meet 的离开通话按钮后，会让复用的用户自有标签页保持打开。由 OpenClaw 打开的标签页会在离开后关闭。

当 Chrome 运行在 Gateway 网关主机上时，使用 `transport: "chrome"`；当它运行在已配对节点上时，使用 `transport: "chrome-node"`。在这两种情况下，模型提供商和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭据会保留在那里。智能体模式日志会在桥接启动时包含解析后的转录提供商/模型，并在每次合成回复后包含 TTS 提供商/模型/语音/输出格式/采样率。原始的 `mode: "realtime"` 仍作为 `mode: "agent"` 的旧版兼容别名被接受，但不再出现在该工具公布的 `mode` 枚举中。

使用 API 支持的房间并指定明确访问策略进行 `create`：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

结束已知房间中正在进行的会议：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

在声称会议可用前，优先进行监听验证：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

按需说话：

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "一字不差地说：我在这里，正在听。"
}
```

`status` 会在可用时包含 Chrome 健康状态：

| 字段                                                                  | 含义                                                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `inCall`                                                              | Chrome 看起来已进入 Meet 通话                                                                                      |
| `micMuted`                                                            | 尽力确定的 Meet 麦克风状态                                                                                         |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | 在语音功能可用前，浏览器配置文件需要手动登录、Meet 主持人准入、权限授予或浏览器控制修复                            |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | 当前是否允许托管 Chrome 输出语音；`speechReady: false` 表示 OpenClaw 未发送开场或测试短语                         |
| `providerConnected` / `realtimeReady`                                 | 实时语音桥接状态                                                                                                   |
| `lastInputAt` / `lastOutputAt`                                        | 最近一次从桥接接收或向桥接发送音频的时间                                                                           |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Meet 标签页的媒体输出是否已主动路由至桥接使用的 BlackHole 设备                                                    |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | 智能体播放语音期间被忽略的环回输入                                                                                 |

## 智能体和 bidi 模式

| 模式    | 由谁决定回答                   | 语音输出路径                         | 适用场景                                           |
| ------- | ------------------------------ | ------------------------------------ | -------------------------------------------------- |
| `agent` | 已配置的 OpenClaw 智能体       | 常规 OpenClaw TTS 运行时             | 你需要“我的智能体正在会议中”的行为                 |
| `bidi`  | 实时语音模型                   | 实时语音提供商的音频响应             | 你需要延迟最低的对话语音循环                       |

`agent` 模式：实时转录提供商监听会议音频，参与者的最终转录文本会路由至已配置的 OpenClaw 智能体，回答则通过常规 OpenClaw TTS 播放。相邻的最终转录文本片段会在咨询前合并，避免一个口语轮次产生多个过时的局部回答；排队的智能体音频仍在播放时，实时输入会被抑制；近期类似智能体发言的转录回声会在咨询前被忽略，以免 BlackHole 环回导致智能体回应自己的语音。

`bidi` 模式：实时语音模型直接回答，并可调用 `openclaw_agent_consult` 以进行更深入的推理、获取当前信息或使用常规 OpenClaw 工具。咨询工具会在后台运行常规 OpenClaw 智能体，并附带近期会议转录文本上下文，然后返回简洁的口语回答；在 `agent` 模式下，OpenClaw 会将该回答直接发送至 TTS；在 `bidi` 模式下，实时语音模型可将其说出来。它与 Voice Call 使用相同的共享咨询机制。

默认情况下，咨询针对 `main` 智能体运行；设置 `realtime.agentId` 可将某条 Meet 通道指向专用的智能体工作区、模型默认值、工具策略、记忆和会话历史。智能体模式咨询使用按会议划分的 `agent:<id>:subagent:google-meet:<session>` 会话键，因此后续问题可保留会议上下文，同时继承常规智能体策略。当智能体在智能体模式下调用 `google_meet` 时，咨询会话会在回答参与者发言前派生调用方的当前转录文本；Meet 会话保持独立，因此会议中的后续交流不会直接修改调用方的转录文本。

`realtime.toolPolicy` 控制咨询运行：

| 策略             | 行为                                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 公开咨询工具；将常规智能体限制为使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get`                 |
| `owner`          | 公开咨询工具；允许常规智能体使用其正常的工具策略                                                                                  |
| `none`           | 不向实时语音模型公开咨询工具                                                                                                      |

咨询会话键按 Meet 会话划分，因此在同一会议中，后续咨询调用会复用之前的咨询上下文。

在 Chrome 完全加入后强制执行口语就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入并说话冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试检查清单

在将会议交给无人值守的智能体之前：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色；当 Chrome-node 是默认传输或固定了某个节点时，其中包括 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接，并同时公布 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页成功加入，且 `test-speech` 返回 Chrome 健康状态，其中 `inCall: true`。

对于 Parallels macOS 虚拟机等远程 Chrome 主机，更新 Gateway 网关或虚拟机后，最简短的安全检查为：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这证明 Gateway 网关插件已加载、虚拟机节点已使用当前令牌连接，并且在智能体打开真实会议标签页之前，Meet 音频桥接可用。

进行 Twilio 冒烟测试时，请使用提供电话拨入信息的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含状态为绿色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。
- Gateway 网关重新加载后，CLI 中即可使用 `voicecall`。
- 返回的会话包含 `transport: "twilio"` 和一个 `twilio.voiceCallId`。
- `openclaw logs --follow` 显示先提供 DTMF TwiML，再提供实时 TwiML，随后建立实时桥接并将初始问候语加入队列。
- `googlemeet leave <sessionId>` 会挂断委托的语音通话。

## 故障排查

### 智能体无法看到 Google Meet 工具

确认插件已启用并重新加载 Gateway 网关；正在运行的智能体只能看到当前 Gateway 网关进程注册的插件工具：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

在非 macOS 的 Gateway 网关主机上，`google_meet` 仍然可见，但本地 Chrome 回话操作会在到达音频桥接之前被阻止。请使用 `mode: "transcribe"`、Twilio 电话拨入，或 macOS `chrome-node` 主机，而不是默认的本地 Chrome 智能体路径。

### 没有已连接且支持 Google Meet 的节点

在节点主机上：

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

在 Gateway 网关主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

节点必须已连接，并列出 `googlemeet.chrome` 和 `browser.proxy`；Gateway 网关配置必须同时允许两者：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 未通过 `chrome-node-connected` 检查，或 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然后重新加载节点服务并再次运行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 浏览器已打开，但智能体无法加入

对于仅观察式加入，运行 `googlemeet test-listen`；对于实时加入，运行 `googlemeet test-speech`，然后检查返回的 Chrome 健康状态。如果任一命令报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，并停止重试，直到浏览器操作完成。

常见的手动操作：登录 Chrome 配置文件；从 Meet 主持人账户准许访客加入；出现原生提示时授予 Chrome 麦克风/摄像头权限；关闭或修复卡住的 Meet 权限对话框。

不要仅仅因为 Meet 询问 “Do you want people to hear you in the meeting?” 就报告“未登录”；这是 Meet 的音频选择过渡页面。浏览器自动化可用时，OpenClaw 会点击 **Use microphone**，并继续等待真正的会议状态；对于仅创建的浏览器回退路径，它可能改为点击 **Continue without microphone**，因为生成 URL 不需要实时音频路径。

### 会议创建失败

配置 OAuth 后，`googlemeet create` 使用 Meet API 的 `spaces.create`；否则使用固定的 Chrome 节点浏览器。请确认：

- **API 创建**：存在 `oauth.clientId` 和 `oauth.refreshToken`（或匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量），并且刷新令牌是在添加创建支持后生成的；旧令牌可能缺少 `meetings.space.created`，因此请重新运行 `openclaw googlemeet auth login --json`。
- **浏览器回退**：`defaultTransport: "chrome-node"` 和 `chromeNode.node` 指向一个已连接且具有 `browser.proxy` 和 `googlemeet.chrome` 的节点；该节点上的 OpenClaw Chrome 配置文件已登录，并且可以打开 `https://meet.google.com/new`。
- **浏览器回退重试**：打开新标签页之前，复用现有的 `.../new` 或 Google 账户提示标签页；重试工具调用，而不是手动打开另一个标签页。
- **手动操作**：如果工具返回 `manualActionRequired: true`，请使用 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 指导操作员；不要循环重试。
- **音频选择过渡页面**：如果 Meet 显示 “Do you want people to hear you in the meeting?”，请保持标签页打开。OpenClaw 应点击 **Use microphone** 或（仅创建时）**Continue without microphone**，并继续等待生成的 URL；如果无法完成，错误应提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体已加入但不说话

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

STT -> OpenClaw 智能体 -> TTS 路径使用 `mode: "agent"`；直接实时语音回退使用 `mode: "bidi"`。`mode: "transcribe"` 有意不启动回话桥接。进行仅观察式调试时，请在参与者发言后运行 `openclaw googlemeet status --json <session-id>`，并检查 `captioning`、`transcriptLines`、`lastCaptionText`。如果 `inCall` 为 true，但 `transcriptLines` 一直为 `0`，则可能是 Meet 字幕已禁用、安装观察器后无人发言、Meet UI 已更改，或该会议语言/账户不支持实时字幕。

`googlemeet test-speech` 始终检查实时路径，并报告该次调用是否观察到桥接输出字节。如果 `speechOutputVerified` 为 false 且 `speechOutputTimedOut` 为 true，则实时提供商可能已接受该话语，但 OpenClaw 未看到新的输出字节到达 Chrome 音频桥接。

还要验证：Gateway 网关主机上有可用的实时提供商密钥（`OPENAI_API_KEY` 或 `GEMINI_API_KEY`）；Chrome 主机上可以看到 `BlackHole 2ch`；该主机上存在 `sox`；Meet 麦克风/扬声器通过虚拟音频路径路由（对于本地 Chrome 实时加入，`doctor` 应显示 `meet output routed: yes`）。

`googlemeet doctor [session-id]` 会输出会话、节点、通话中状态、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最后音频时间戳、字节计数器和浏览器 URL。使用 `googlemeet status [session-id] --json` 获取原始 JSON；使用 `googlemeet doctor --oauth`（添加 `--meeting` 或 `--create-space`）在不暴露令牌的情况下验证 OAuth 刷新。

如果智能体超时，并且 Meet 标签页已打开，请直接检查该标签页，不要再打开一个：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`：它会针对所选传输方式（`chrome` 使用本地浏览器控制，`chrome-node` 使用已配置节点）聚焦并检查现有 Meet 标签页，而不会打开新的标签页或会话，并报告当前阻碍因素（登录、准入、权限、音频选择状态）。CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行；`chrome-node` 还要求节点已连接。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败：将其添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载 Gateway 网关。

当 Twilio 后端缺少账户 SID、身份验证令牌或主叫号码时，`twilio-voice-call-credentials` 会失败：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

当 `voice-call` 没有公开的 webhook 暴露方式，或 `publicUrl` 指向环回/专用网络空间时，`twilio-voice-call-webhook` 会失败。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`；运营商回调无法访问这些地址。请将 `plugins.entries.voice-call.config.publicUrl` 设置为公共 URL，或配置隧道/Tailscale 暴露：

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
          // 或
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

重启或重新加载 Gateway 网关，然后运行：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

默认情况下，`voicecall smoke` 仅检查就绪状态。对指定号码进行试运行：

```bash
openclaw voicecall smoke --to "+15555550123"
```

仅在有意发起真实外呼时添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通话已开始，但始终未进入会议

确认 Meet 事件提供电话拨入详细信息，并传入准确的拨入号码及 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

在 `--dtmf-sequence` 开头使用 `w` 或逗号，可在输入 PIN 前暂停。

如果通话已创建，但 Meet 参与者列表始终未显示拨入参与者：

- `openclaw googlemeet doctor <session-id>`：确认委托的 Twilio 通话 ID、DTMF 是否已加入队列，以及是否请求了开场问候语。
- `openclaw voicecall status --call-id <id>`：确认通话仍处于活动状态。
- `openclaw voicecall tail`：确认 Twilio webhook 正在到达 Gateway 网关。
- `openclaw logs --follow`：查找 Twilio Meet 序列：Google Meet 委托加入操作，Voice Call 存储并提供连接前 DTMF TwiML，Voice Call 为 Twilio 通话提供实时 TwiML，然后 Google Meet 使用 `voicecall.speak` 请求开场语音。
- 重新运行 `openclaw googlemeet setup --transport twilio`；绿色设置检查是必需条件，但不能证明会议 PIN 序列正确。
- 确认拨入号码与 PIN 属于同一 Meet 邀请和地区。
- 如果 Meet 应答缓慢，或发送连接前 DTMF 后，通话转录仍显示 PIN 提示，请将 `voiceCall.dtmfDelayMs` 从默认的 12 秒调大。
- 如果参与者已加入但你听不到问候语，请在 `openclaw logs --follow` 中检查 DTMF 后的 `voicecall.speak` 请求，以及媒体流 TTS 播放或 Twilio `<Say>` 回退。如果转录仍显示 “enter the meeting PIN”，则电话端尚未加入 Meet 会议室，因此参与者不会听到语音。

如果 webhook 未到达，请先调试 Voice Call 插件：提供商必须能够访问 `plugins.entries.voice-call.config.publicUrl` 或已配置的隧道。请参阅[语音通话故障排查](/zh-CN/plugins/voice-call#troubleshooting)。

## 说明

Google Meet 的官方媒体 API 以接收为主，因此要在通话中发言，仍需要参与者路径。此插件明确保留了该边界：Chrome 负责浏览器参会和本地音频路由；Twilio 负责电话拨入参会。

Chrome 回话模式需要 `BlackHole 2ch`，并搭配以下任一方案：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 负责桥接，并在这些命令与所选提供商之间，以 `chrome.audioFormat` 指定的格式传输音频。`agent` 模式使用实时转录加常规 TTS；`bidi` 模式使用实时语音提供商。默认路径为 24 kHz PCM16，并使用 `chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可用于旧版命令对。
- `chrome.audioBridgeCommand`：外部桥接命令负责整个本地音频路径，并且必须在启动或验证其守护进程后退出。仅适用于 `bidi`，因为 `agent` 模式需要直接访问命令对以执行 TTS。

使用命令对式 Chrome 桥接时，`chrome.bargeInInputCommand` 可以监听单独的本地麦克风，并在人开始说话时清除智能体播放的音频。这样，即使智能体播放音频期间共享的 BlackHole 环回输入暂时受到抑制，也能让人声优先于智能体输出。与 `chrome.audioInputCommand`/`chrome.audioOutputCommand` 一样，它是由操作员配置的本地命令：请使用明确且可信的命令路径或参数列表，绝不要使用来自不可信位置的脚本。

为获得清晰的双工音频，请让 Meet 输出和 Meet 麦克风分别通过不同的虚拟设备传输，或使用 Loopback 式虚拟设备图；单个共享的 BlackHole 设备可能会将其他参与者的声音回传到通话中。

`googlemeet speak` 会为 Chrome 会话触发当前的回话音频桥接；`googlemeet leave` 会将其停止（对于通过 Voice Call 委派的 Twilio 会话，还会挂断底层通话）。对于由 API 管理的空间，可使用 `googlemeet end-active-conference` 同时关闭当前的 Google Meet 会议。

## 相关内容

- [语音通话插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [Building plugins](/zh-CN/plugins/building-plugins)

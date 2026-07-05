---
read_when:
    - 你想让 OpenClaw 智能体加入 Google Meet 通话
    - 你希望 OpenClaw 智能体创建新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输协议
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确的 Meet URL，并使用智能体回话默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-07-05T11:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60b47f2a7bfb2e96a1f75daef4f130851e5190e3f600dd48c0675ec6a5cdc12a
    source_path: plugins/google-meet.md
    workflow: 16
---

`google-meet` 插件会代表 OpenClaw 智能体加入显式 Meet URL。它有意保持范围很窄：

- 它只加入 `https://meet.google.com/...` URL；绝不会从它自行发现的电话号码拨入会议。
- `googlemeet create` 可以通过 Google Meet API（或浏览器回退）创建新的 Meet URL，并默认加入该会议。
- Chrome 参与使用已登录的 Chrome 配置文件，也可以在已配对的节点上进行。Twilio 参与会通过 [Voice call 插件](/zh-CN/plugins/voice-call)拨打电话号码加 PIN/DTMF；它无法直接拨打 Meet URL。
- `mode: "agent"`（默认）使用实时提供商转写参会者语音，将其路由到已配置的 OpenClaw 智能体，并使用常规 OpenClaw TTS 播报答案。`mode: "bidi"` 让实时语音模型直接回答。`mode: "transcribe"` 以仅观察方式加入，不回话。
- 插件加入通话时不会自动播报同意声明。
- CLI 命令是 `googlemeet`；`meet` 保留给更宽泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，然后设置实时提供商密钥。OpenAI 是 `agent` 模式的默认转写提供商；Google Gemini Live 可用作 `bidi` 模式的语音提供商：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 Chrome 路由所用的 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装器要求重启后 macOS 才会暴露该设备：

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

检查设置，然后加入：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

`setup` 输出可由智能体读取，并且会感知模式/传输方式：它会报告 Chrome 配置文件、节点固定，以及针对实时 Chrome 加入场景的 BlackHole/SoX 音频桥和延迟开场检查。仅观察加入会跳过实时前置条件：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

配置了 Twilio 委托时，`setup` 还会报告 `voice-call`、Twilio 凭证和公共 webhook 暴露是否就绪。在智能体加入之前，应将该传输方式/模式下任何 `ok: false` 检查视为阻断项。使用 `--json` 获取机器可读输出，并使用 `--transport chrome|chrome-node|twilio` 提前预检特定传输方式：

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

在非 macOS Gateway 网关主机上，`google_meet` 对 artifact、日历、设置、转写、Twilio 和 `chrome-node` 操作仍然可见，但本地 Chrome 回话（`transport: "chrome"` 搭配 `mode: "agent"` 或 `"bidi"`）会在到达音频桥之前被阻止，因为该路径当前依赖 macOS `BlackHole 2ch`。请改用 `mode: "transcribe"`、Twilio 拨入，或 macOS `chrome-node` 主机。

### 创建会议

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` 有两条路径，结果的 `source` 字段会报告使用哪一条：

- **`api`**：配置了 Google Meet OAuth 凭证时使用。行为确定；不依赖浏览器 UI 状态。
- **`browser`**：未配置 OAuth 凭证时使用。OpenClaw 会在固定的 Chrome 节点上打开 `https://meet.google.com/new`，并等待 Google 重定向到真实的会议代码 URL；该节点上的 OpenClaw Chrome 配置文件必须已经登录 Google。加入和创建都会先复用现有 Meet 标签页（或正在进行的 `.../new` / Google 账号提示标签页），然后才打开新标签页；标签页匹配会忽略 `authuser` 这类无害查询字符串。

`create` 默认会加入，并返回 `joined: true` 以及加入会话。传入 `--no-join`（CLI）或 `"join": false`（工具）可只创建 URL。

对于通过 API 创建的房间，请设置显式访问策略，而不是继承 Google 账号默认值：

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | 谁可以无需敲门加入                                                |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | 拥有 Meet URL 的任何人                                             |
| `TRUSTED`       | 主办方组织的受信任用户、受邀外部用户和拨入用户                    |
| `RESTRICTED`    | 仅受邀者                                                            |

这只适用于通过 API 创建的房间，因此必须配置 OAuth。如果你在此选项存在之前已经完成身份验证，请在向 OAuth 同意屏幕添加 `meetings.space.settings` scope 后，重新运行 `openclaw googlemeet auth login --json`。

如果浏览器回退遇到 Google 登录或 Meet 权限阻断，工具会返回 `manualActionRequired: true`，并附带 `manualActionReason`、`manualActionMessage` 以及 `browser.nodeId`/`browser.targetId`/`browserUrl`。报告该消息，并停止打开新的 Meet 标签页，直到操作员完成浏览器步骤。

### 仅观察加入

设置 `"mode": "transcribe"` 可跳过双工实时桥（不需要 BlackHole/SoX，也不会回话）。转写模式的 Chrome 加入还会跳过 OpenClaw 的麦克风/摄像头权限授权以及 Meet **Use microphone** 路径；如果 Meet 显示音频选择插屏，自动化会先尝试 **Continue without microphone**。此模式下的托管 Chrome 传输会安装一个尽力而为的 Meet 字幕观察器。`googlemeet status --json` 和 `googlemeet doctor` 会报告 `captioning`、`captionsEnabledAttempted`、`transcriptLines`、`lastCaptionAt`、`lastCaptionSpeaker`、`lastCaptionText` 以及 `recentTranscript` 尾部。

用于是/否监听探测：

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

它会以转写模式加入，等待新的字幕/转写活动，并返回 `listenVerified`、`listenTimedOut`、手动操作字段以及当前字幕健康状态。

### 实时会话健康

在回话会话期间，`google_meet` 状态会报告 Chrome/音频桥健康状态：`inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近输入/输出时间戳、字节计数器以及桥已关闭状态。托管 Chrome 会话只有在健康状态报告 `inCall: true` 后才会播报开场/测试短语；否则 `speechReady: false`，并且语音尝试会被阻止，而不是静默空操作。

本地 Chrome 会通过已登录的 OpenClaw 浏览器配置文件加入，并需要 `BlackHole 2ch` 提供麦克风/扬声器路径。单个 BlackHole 设备足以进行首次冒烟测试，但可能产生回声；若要获得干净的双工音频，请使用独立的虚拟设备或 Loopback 风格的图。

## 本地 Gateway 网关 + Parallels Chrome

如果只是为了给 macOS VM 提供 Chrome，则不需要在 VM 内部运行完整 Gateway 网关或配置模型 API key。在本地运行 Gateway 网关和智能体；在 VM 中运行节点主机。

| 运行位置             | 内容                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway 网关主机     | OpenClaw Gateway 网关、智能体工作区、模型/API keys、实时提供商、Google Meet 插件配置          |
| Parallels macOS VM   | OpenClaw CLI/节点主机、Chrome、SoX、BlackHole 2ch、已登录 Google 的 Chrome 配置文件            |
| VM 中不需要          | Gateway 网关服务、智能体配置、模型提供商设置                                                    |

安装 VM 依赖、重启并验证：

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

如果 `<gateway-host>` 是没有 TLS 的 LAN IP，请为该受信任私有网络显式启用：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

作为 LaunchAgent 安装时也使用相同标志（它是进程环境，在安装命令中出现时会存储在 LaunchAgent 环境中，不是 `openclaw.json` 设置）：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

从 Gateway 网关主机批准该节点，然后确认它同时声明了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

将 Meet 路由到该节点：

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

用于创建或复用会话、播报已知短语并打印会话健康状态的一条命令冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

实时加入期间，浏览器自动化会填写访客名称、点击加入/请求加入，并在 Meet 首次运行的 “Use microphone” 提示出现时接受该提示（或在仅观察加入和仅浏览器创建会议期间选择 “Continue without microphone”）。如果配置文件已退出登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限，或 Meet 卡在未解决的提示上，结果会报告 `manualActionRequired: true`，并附带 `manualActionReason` 和 `manualActionMessage`。停止重试，报告该消息以及 `browserUrl`/`browserTitle`，并且仅在手动操作完成后重试。

如果省略 `chromeNode.node`，OpenClaw 只会在恰好有一个已连接节点同时声明 `googlemeet.chrome` 和浏览器控制时自动选择；当连接了多个具备能力的节点时，请固定 `chromeNode.node`（节点 id、显示名称或远程 IP）。

### 常见失败检查

| 症状                                                     | 修复                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | 固定的节点已知但不可用。报告设置阻塞问题；除非被要求，否则不要静默回退到其他传输方式。                                                                                                                                    |
| `No connected Google Meet-capable node`                  | 在 VM 中运行 `openclaw node run`，批准配对，并在那里运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。确认 `gateway.nodes.allowCommands` 包含 `googlemeet.chrome` 和 `browser.proxy`。                              |
| `BlackHole 2ch audio device not found`                   | 在正在检查的主机上安装 `blackhole-2ch` 并重启。                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | 在 VM 中安装 `blackhole-2ch` 并重启 VM。                                                                                                                                                                                                                |
| Chrome 打开但无法加入                             | 登录 VM 中的浏览器配置文件，或保持设置 `chrome.guestName`。访客自动加入会通过节点浏览器代理使用 OpenClaw 浏览器自动化；将节点的 `browser.defaultProfile`（或具名的现有会话配置文件）指向你想使用的配置文件。 |
| Meet 标签页重复                                      | 保持 `chrome.reuseExistingTab: true`。OpenClaw 会为相同 URL 激活现有标签页，并且在打开另一个标签页之前，创建流程会复用进行中的 `.../new` 或 Google 账号提示标签页。                                                                      |
| 没有音频                                                 | 将 Meet 麦克风/扬声器路由到 OpenClaw 使用的虚拟音频路径；使用独立的虚拟设备或 Loopback 风格路由来获得干净的双工音频。                                                                                                              |

## 安装说明

Chrome 回话默认值使用两个 OpenClaw 不捆绑或再分发的外部工具；请通过 Homebrew 将它们安装为主机依赖：

- `sox`：命令行音频实用工具。该插件会为默认的 24 kHz PCM16 音频桥接发出显式 CoreAudio 设备命令。
- `blackhole-2ch`：macOS 虚拟音频驱动，提供 Chrome/Meet 路由经过的 `BlackHole 2ch` 设备。

SoX 采用 `LGPL-2.0-only AND GPL-2.0-only` 许可；BlackHole 采用 GPL-3.0。如果你构建的安装程序或设备将 BlackHole 与 OpenClaw 捆绑，请审查 BlackHole 的上游许可，或从 Existential Audio 获取单独许可。

## 传输方式

| 传输方式     | 使用场景                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/音频位于 Gateway 网关主机                                                        |
| `chrome-node` | Chrome/音频位于已配对节点上（例如 Parallels macOS VM）                        |
| `twilio`      | 当 Chrome 参与不可用时，通过 Voice Call 插件使用电话拨入回退 |

### Chrome

通过 OpenClaw 浏览器控制打开 Meet URL，并以已登录的 OpenClaw 浏览器配置文件加入。在 macOS 上，该插件会在启动前检查 `BlackHole 2ch`，并且如果已配置，会在打开 Chrome 前运行音频桥接健康/启动命令。对于本地 Chrome，使用 `browser.defaultProfile` 选择配置文件；`chrome.browserProfile` 会传递给 `chrome-node` 主机。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 麦克风/扬声器音频会通过本地 OpenClaw 音频桥接路由。如果未安装 `BlackHole 2ch`，加入会以设置错误失败，而不是在没有音频路径的情况下加入。

### Twilio

委托给 [Voice call 插件](/zh-CN/plugins/voice-call)的严格拨号计划。它不会解析 Meet 页面来查找电话号码；Google Meet 必须为该会议公开电话拨入号码和 PIN。

在 Gateway 网关主机上启用 Voice Call，而不是 Chrome 节点：

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

通过环境提供 Twilio 凭证，避免将密钥放入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

如果 OpenAI 是实时语音提供商，请改用 `realtime.provider: "openai"` 和 `OPENAI_API_KEY`。

启用 `voice-call` 后重启或重新加载 Gateway 网关；插件配置变更在重新加载前不会生效。验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委托已接好时，`googlemeet setup` 会包含 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

使用 `--dtmf-sequence` 指定自定义序列，并用开头的 `w` 或逗号在 PIN 前加入暂停：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

OAuth 对创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。为官方 API 创建、空间解析或 Meet Media API 预检配置 OAuth。Chrome/Chrome-node 加入从不依赖 OAuth；无论如何，它们都使用已登录的 Chrome 配置文件、BlackHole/SoX，以及（对于 `chrome-node`）已连接节点。

### 创建 Google 凭证

在 Google Cloud Console 中：

<Steps>
<Step title="创建或选择项目">
</Step>
<Step title="启用 Google Meet REST API">
</Step>
<Step title="配置 OAuth 同意屏幕">
对于 Google Workspace 组织，Internal 最简单。External 可用于个人/测试设置；当应用处于 Testing 状态时，将每个会授权它的 Google 账号添加为测试用户。
</Step>
<Step title="添加请求的作用域">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`（Calendar 查找）
- `https://www.googleapis.com/auth/drive.meet.readonly`（转录/智能笔记文档正文导出）

</Step>
<Step title="创建 OAuth 客户端 ID">
应用类型 **Web application**。已授权的重定向 URI：

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="复制客户端 ID 和客户端密钥">
</Step>
</Steps>

`meetings.space.created` 是 `spaces.create` 必需的。`meetings.space.readonly` 会将 Meet URL/代码解析为空间。`meetings.space.settings` 允许 OpenClaw 在 API 房间创建期间传递 `SpaceConfig` 设置，例如 `accessType`。`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体工作；Google 可能要求为实际 Media API 使用加入 Developer Preview。`calendar.events.readonly` 仅在 `--today`/`--event` 日历查找时需要。`drive.meet.readonly` 仅在 `--include-doc-bodies` 导出时需要。如果你只需要基于浏览器的 Chrome 加入，请完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId` 和可选的 `oauth.clientSecret`（或以环境变量传入），然后运行：

```bash
openclaw googlemeet auth login --json
```

这会运行 PKCE 流程，并在 `http://localhost:8085/oauth2callback` 上使用 localhost 回调，然后打印一个包含刷新令牌的 `oauth` 配置块。当浏览器无法访问本地回调时，添加 `--manual` 使用复制/粘贴流程：

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

如果你不想让刷新令牌出现在配置中，优先使用环境变量；配置会先解析，然后环境作为回退。如果你在会议创建、日历查找或文档正文导出支持存在之前完成过认证，请重新运行 `openclaw googlemeet auth login --json`，确保刷新令牌覆盖当前作用域集合。

### 使用 Doctor 验证 OAuth

```bash
openclaw googlemeet doctor --oauth --json
```

这会检查 OAuth 配置是否存在，以及刷新令牌是否能生成访问令牌，而不会加载 Chrome 运行时或要求已连接节点。报告只包含状态字段（`ok`、`configured`、`tokenSource`、`expiresAt`、检查消息），并且绝不会打印访问令牌、刷新令牌或客户端密钥。

| 检查                | 含义                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或存在缓存的访问令牌 |
| `oauth-token`        | 缓存的访问令牌仍有效，或刷新令牌已生成新的访问令牌    |
| `meet-spaces-get`    | 可选的 `--meeting` 检查已解析现有 Meet 空间                       |
| `meet-spaces-create` | 可选的 `--create-space` 检查已创建新的 Meet 空间                         |

使用会产生副作用的创建检查证明 Meet API 已启用，并且 `spaces.create` 权限范围可用：

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

证明对现有空间的读取访问权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

这些检查返回 `403` 通常意味着 Meet REST API 已禁用、刷新令牌缺少所需权限范围，或 Google 账号无法访问该空间。刷新令牌错误意味着需要重新运行 `openclaw googlemeet auth login --json`，并存储新的 `oauth` 块。

浏览器回退不需要 OAuth；其中的 Google 身份验证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

以下环境变量可作为回退值使用：

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

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录；传入 `--all-conference-records` 可处理每条保留的记录。

Calendar 查找会先从 Google Calendar 解析会议 URL，然后再读取工件（需要包含 Calendar events readonly 权限范围的刷新令牌）：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索带有 Meet 链接的事件；`--event <query>` 会搜索匹配的事件文本；`--calendar <id>` 会指定非主日历。`calendar-events` 会预览匹配的事件，并标记 `latest`/`artifacts`/`attendance`/`export` 将选择哪一个。

如果你已经知道会议记录 ID，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

关闭 API 创建空间的房间：

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

调用 `spaces.endActiveConference`，并要求对授权账号可管理的空间使用带有 `meetings.space.created` 权限范围的 OAuth。接受 Meet URL、会议代码或 `spaces/{id}`，并先将其解析为 API 空间资源。这不同于 `googlemeet leave`：`leave` 会停止 OpenClaw 的本地/会话参与；`end-active-conference` 会请求 Google Meet 结束该空间的活动会议。

写入可读报告：

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

当 Google 暴露相关数据时，`artifacts` 会返回会议记录元数据，以及参与者、录制、转录、结构化转录条目和智能笔记资源元数据。`--no-transcript-entries` 会跳过大型会议的条目查找。`attendance` 会将参与者展开为参与者会话行，包含首次/最后出现时间、总会话时长、迟到/早退标记，并按已登录用户或显示名称合并重复的参与者资源；`--no-merge-duplicates` 会保留原始资源分离，`--late-after-minutes`/`--early-before-minutes` 可调整阈值。

`export` 会写入一个文件夹，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录选中的输入、导出选项、会议记录、输出文件、计数、令牌来源、使用的任何 Calendar 事件，以及部分检索警告。`--zip` 还会在文件夹旁写入一个可移植归档。`--include-doc-bodies` 会通过 Drive `files.export` 导出链接的转录/智能笔记 Google Docs 文本（需要 Drive Meet readonly 权限范围）；不使用它时，导出只包含 Meet 元数据和结构化转录条目。部分工件失败（智能笔记列表、转录条目或文档正文错误）会将警告保留在摘要/清单中，而不是让整个导出失败。`--dry-run` 会获取相同数据并打印清单 JSON，而不创建文件夹或 ZIP。

智能体通过 `google_meet` 工具使用相同操作（`export`、带 `accessType` 的 `create`、`end_active_conference`、`test_listen`）；请参见[工具](#tool)。

### 实时烟雾测试

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
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | 可选；不带 `OPENCLAW_` 前缀的同名回退值也可使用                       |

基础工件/出勤烟雾测试需要 `meetings.space.readonly` 和 `meetings.conference.media.readonly`。Calendar 查找需要 `calendar.events.readonly`。Drive 文档正文导出需要 `drive.meet.readonly`。

### 创建示例

```bash
openclaw googlemeet create
```

打印新的会议 URI、来源和加入会话。使用 OAuth 时会使用 Meet API；不使用时，会使用固定 Chrome 节点上已登录的配置文件。浏览器回退 JSON：

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

如果浏览器回退先遇到 Google 登录或 Meet 权限阻塞，`google_meet` 会返回结构化详情，而不是纯字符串：

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

创建默认会加入会议，但 Chrome/Chrome-node 仍需要已登录的 Google 配置文件才能通过浏览器加入；如果已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员完成 Google 登录后重试。

只有在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入适用于 Meet 媒体 API 的 Google Workspace Developer Preview Program 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 智能体路径只需要启用插件、BlackHole、SoX、一个实时提供商密钥，以及已配置的 OpenClaw TTS 提供商：

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

| 键                                | 默认值                                   | 说明                                                                                                                                                                                                                  |
| --------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                       |
| `defaultMode`                     | `"agent"`                                | `"realtime"` 作为 `"agent"` 的旧版别名被接受；新的调用方应使用 `"agent"`                                                                                                                                              |
| `chromeNode.node`                 | 未设置                                   | `chrome-node` 的节点 ID/名称/IP；当可能连接多个具备能力的节点时必填                                                                                                                                                   |
| `chrome.launch`                   | `true`                                   | 为加入会议启动 Chrome；仅在复用已打开的会话时设置为 `false`                                                                                                                                                           |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                       |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | 显示在未登录的 Meet 访客屏幕上                                                                                                                                                                                        |
| `chrome.autoJoin`                 | `true`                                   | 在 `chrome-node` 上尽力填充访客名称并点击“立即加入”                                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | 激活现有的 Meet 标签页，而不是打开重复标签页                                                                                                                                                                          |
| `chrome.waitForInCallMs`          | `20000`                                  | 在 Talk-back 简介触发前，等待 Meet 标签页报告已进入通话                                                                                                                                                               |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | 命令对音频格式；`"g711-ulaw-8khz"` 仅用于发出电话音频的旧版/自定义命令对                                                                                                                                              |
| `chrome.audioBufferBytes`         | `4096`                                   | 生成的命令对音频命令的 SoX 处理缓冲区（SoX 默认 8192 字节缓冲区的一半，可降低管道延迟）；值会被限制为最小 17 字节                                                                                                    |
| `chrome.audioInputCommand`        | 生成的 SoX 命令                          | 从 CoreAudio `BlackHole 2ch` 读取，并以 `chrome.audioFormat` 写入音频                                                                                                                                                 |
| `chrome.audioOutputCommand`       | 生成的 SoX 命令                          | 以 `chrome.audioFormat` 读取音频，并写入 CoreAudio `BlackHole 2ch`                                                                                                                                                    |
| `chrome.bargeInInputCommand`      | 未设置                                   | 可选的本地麦克风命令，写入有符号 16 位小端单声道 PCM，用于在助手播放期间检测人工插话；适用于 Gateway 网关托管的命令对桥接                                                                                           |
| `chrome.bargeInRmsThreshold`      | `650`                                    | 计为人工打断的 RMS 电平                                                                                                                                                                                               |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | 计为人工打断的峰值电平                                                                                                                                                                                                |
| `chrome.bargeInCooldownMs`        | `900`                                    | 重复清除打断之间的最小延迟                                                                                                                                                                                           |
| `mode`（每次请求）                | `"agent"`                                | Talk-back 模式；参见 [Agent 和 bidi 模式](#agent-and-bidi-modes)表                                                                                                                                                   |
| `realtime.provider`               | `"openai"`                               | 当下面的作用域字段未设置时使用的兼容性回退                                                                                                                                                                           |
| `realtime.transcriptionProvider`  | `"openai"`                               | `agent` 模式用于实时转录的提供商 ID                                                                                                                                                                                  |
| `realtime.voiceProvider`          | 未设置                                   | `bidi` 模式用于直接实时语音的提供商 ID；设置为 `"google"` 可使用 Gemini Live，同时保持 Agent 模式转录使用 OpenAI。与 `realtime.model` 搭配使用以选择具体的 Gemini Live 模型。                                          |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | 参见 [Agent 和 bidi 模式](#agent-and-bidi-modes)                                                                                                                                                                     |
| `realtime.instructions`           | 简短口头回复指令                         | 告诉模型简短发言，并使用 `openclaw_agent_consult` 处理更深入的回答                                                                                                                                                   |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | 实时桥接连接时播放一次；设置为 `""` 可静默加入                                                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | `openclaw_agent_consult` 使用的 OpenClaw 智能体 ID                                                                                                                                                                   |
| `voiceCall.enabled`               | `true`                                   | 将 Twilio PSTN 呼叫、DTMF 和开场问候委托给 Voice Call 插件                                                                                                                                                           |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | 通过 Twilio 播放从 PIN 派生的 DTMF 序列前的前置等待                                                                                                                                                                  |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Voice Call 启动 Twilio 呼叫段后，请求实时开场问候前的延迟                                                                                                                                                            |

`chrome.audioBridgeCommand` 和 `chrome.audioBridgeHealthCommand` 允许外部桥接拥有整个本地音频路径，而不是使用 `chrome.audioInputCommand`/`chrome.audioOutputCommand`；关于哪些模式可以使用它们的限制，请参见[说明](#notes)。

存在一个用于旧版 `realtime.provider: "google"` 形状的 `openclaw doctor --fix` 迁移：当这些字段尚未设置时，它会将该意图移动到 `realtime.voiceProvider: "google"` 加上 `realtime.transcriptionProvider: "openai"`。

### 可选覆盖

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
        speakerVoice: "Kore",
      },
    },
  },
}
```

ElevenLabs 用于 Agent 模式的收听和发言：

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

持久的 Meet 语音来自 `messages.tts.providers.elevenlabs.speakerVoiceId`。当启用 TTS 模型覆盖时，Agent 回复也可以使用每条回复的 `[[tts:speakerVoiceId=... model=eleven_v3]]` 指令，但配置是会议的确定性默认值。加入时，日志会显示 `transcriptionProvider=elevenlabs`，每条语音回复都会记录 `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`。

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

使用 `voiceCall.enabled: true`（默认值）和 Twilio 传输时，Voice Call 会在打开实时媒体流之前放置 DTMF 序列，然后使用保存的简介文本作为初始实时问候。如果未启用 `voice-call`，Google Meet 仍可验证并记录拨号方案，但无法发起 Twilio 呼叫。

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

| `action`                | 用途                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `join`                  | 加入明确的 Meet URL                                                                                     |
| `create`                | 创建空间（并默认加入）；支持 `accessType`/`entryPointAccess`                                            |
| `status`                | 列出活动会话，或通过 `sessionId` 检查某个会话                                                           |
| `setup_status`          | 运行与 `googlemeet setup` 相同的检查                                                                    |
| `resolve_space`         | 通过 `spaces.get` 解析 URL/代码/`spaces/{id}`                                                           |
| `preflight`             | 验证 OAuth + 会议解析前提条件                                                                           |
| `latest`                | 查找会议的最新会议记录                                                                                  |
| `calendar_events`       | 预览带有 Meet 链接的 Calendar 事件                                                                       |
| `artifacts`             | 列出会议记录以及参与者/录制/转写/智能笔记元数据                                                        |
| `attendance`            | 列出参与者和参与者会话                                                                                  |
| `export`                | 写入工件/出席情况/转写/清单包；设置 `"dryRun": true` 可仅生成清单                                      |
| `recover_current_tab`   | 聚焦/检查现有 Meet 标签页，而不打开新标签页                                                             |
| `leave`                 | 结束会话（对委托会话会挂断底层 Twilio 通话）                                                            |
| `end_active_conference` | 结束 API 管理空间的活动 Google Meet 会议                                                                |
| `speak`                 | 在给定 `sessionId` 和 `message` 时，让实时智能体立即发言                                                |
| `test_speech`           | 创建/复用会话，触发已知短语，返回 Chrome 健康状态                                                       |
| `test_listen`           | 创建/复用仅观察会话，等待字幕/转写发生变化                                                              |

`test_speech` 始终强制使用 `mode: "agent"` 或 `"bidi"`，如果要求在 `mode: "transcribe"` 中运行则会失败，因为仅观察会话无法发出语音。它的 `speechOutputVerified` 结果基于该调用期间实时音频输出字节数是否增加，因此复用的会话中较早的音频不会被算作新的检查。

当 Chrome 在 Gateway 网关主机上运行时使用 `transport: "chrome"`；当它在已配对节点上运行时使用 `transport: "chrome-node"`。两种情况下，模型提供商和 `openclaw_agent_consult` 都在 Gateway 网关主机上运行，因此模型凭据保留在那里。智能体模式日志会在桥接启动时包含解析到的转写提供商/模型，并在每次合成回复后包含 TTS 提供商/模型/语音/输出格式/采样率。原始 `mode: "realtime"` 仍作为 `mode: "agent"` 的旧版兼容别名被接受，但不再在该工具的 `mode` 枚举中宣传。

使用 API 支持的房间和明确访问策略的 `create`：

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

结束已知房间的活动会议：

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

在声称会议有用之前先进行监听验证：

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

按需发言：

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

`status` 会在可用时包含 Chrome 健康状态：

| 字段                                                                  | 含义                                                                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome 似乎已进入 Meet 通话                                                                                   |
| `micMuted`                                                            | 尽力判断的 Meet 麦克风状态                                                                                    |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | 浏览器配置文件需要手动登录、Meet 主持人准入、权限，或在语音可用前修复浏览器控制                               |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | 当前是否允许托管 Chrome 语音；`speechReady: false` 表示 OpenClaw 未发送开场/测试短语                          |
| `providerConnected` / `realtimeReady`                                 | 实时语音桥接状态                                                                                               |
| `lastInputAt` / `lastOutputAt`                                        | 上次从桥接收到/发送到桥接的音频                                                                               |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Meet 标签页的媒体输出是否已主动路由到桥接的 BlackHole 设备                                                    |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | 助手播放处于活动状态时被忽略的环回输入                                                                        |

## 智能体和 `bidi` 模式

| 模式    | 由谁决定答案                  | 语音输出路径                           | 使用场景                                   |
| ------- | ----------------------------- | -------------------------------------- | ------------------------------------------ |
| `agent` | 已配置的 OpenClaw 智能体      | 常规 OpenClaw TTS 运行时               | 你想要“我的智能体正在会议中”的行为         |
| `bidi`  | 实时语音模型                  | 实时语音提供商音频响应                 | 你想要最低延迟的对话式语音循环             |

`agent` 模式：实时转写提供商会听取会议音频，最终参与者转写会路由到已配置的 OpenClaw 智能体，答案通过常规 OpenClaw TTS 播放。在咨询前会合并相邻的最终转写片段，避免一个口头轮次产生多个过时的部分答案；当排队的助手音频仍在播放时会抑制实时输入，并且会在咨询前忽略近期类似助手的转写回声，避免 BlackHole 环回让智能体回答自己的语音。

`bidi` 模式：实时语音模型直接回答，并且可以调用 `openclaw_agent_consult` 进行更深入的推理、获取当前信息，或使用常规 OpenClaw 工具。咨询工具会在后台运行常规 OpenClaw 智能体，带上近期会议转写上下文，并返回简洁的口头答案；在 `agent` 模式下，OpenClaw 会将该答案直接发送给 TTS；在 `bidi` 模式下，实时语音模型可以把它说出来。它使用与 Voice Call 相同的共享咨询机制。

默认情况下，咨询会针对 `main` 智能体运行；设置 `realtime.agentId` 可将 Meet 通道指向专用的 Agent 工作区、模型默认值、工具策略、记忆和会话历史。智能体模式咨询使用按会议划分的 `agent:<id>:subagent:google-meet:<session>` 会话键，因此后续问题会保留会议上下文，同时继承常规智能体策略。当智能体在智能体模式下调用 `google_meet` 时，顾问会话会在回答参与者语音前分叉调用方的当前转写；Meet 会话保持独立，因此会议后续问题不会直接修改调用方转写。

`realtime.toolPolicy` 控制咨询运行：

| 策略             | 行为                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露咨询工具；将常规智能体限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search`、`memory_get`                |
| `owner`          | 暴露咨询工具；允许常规智能体使用其正常工具策略                                                                               |
| `none`           | 不向实时语音模型暴露咨询工具                                                                                                 |

咨询会话键按 Meet 会话限定范围，因此同一会议期间的后续咨询调用会复用先前的咨询上下文。

在 Chrome 完全加入后强制执行一次口头就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整加入并发言烟雾测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试清单

在把会议交给无人值守智能体之前：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色，并且当 Chrome-node 是默认传输或已固定某个节点时包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接，并公布 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页已加入，且 `test-speech` 返回包含 `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机，例如 Parallels macOS 虚拟机，在更新 Gateway 网关或虚拟机后，最短的安全检查是：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可证明 Gateway 网关插件已加载、虚拟机节点已使用当前令牌连接，并且 Meet 音频桥接在智能体打开真实会议标签页前可用。

对于 Twilio 烟雾测试，请使用暴露电话拨入详细信息的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin`、`twilio-voice-call-credentials` 和 `twilio-voice-call-webhook` 检查。
- Gateway 网关重新加载后，`voicecall` 在 CLI 中可用。
- 返回的会话包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `openclaw logs --follow` 显示在实时 TwiML 之前已提供 DTMF TwiML，然后显示实时桥接以及已排队的初始问候。
- `googlemeet leave <sessionId>` 会挂断委托的语音通话。

## 故障排查

### 智能体看不到 Google Meet 工具

确认插件已启用并重新加载 Gateway 网关；正在运行的智能体只能看到当前 Gateway 网关进程注册的插件工具：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

在非 macOS Gateway 网关主机上，`google_meet` 仍然可见，但本地 Chrome 回话操作会在进入音频桥之前被阻止。请使用 `mode: "transcribe"`、Twilio 拨入，或 macOS `chrome-node` 主机，而不是默认的本地 Chrome agent 路径。

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

节点必须已连接，并列出 `googlemeet.chrome` 和 `browser.proxy`；Gateway 网关配置必须允许两者：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 在 `chrome-node-connected` 处失败，或 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点：

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

### 浏览器打开但 agent 无法加入

运行 `googlemeet test-listen` 进行仅观察加入，或运行 `googlemeet test-speech` 进行实时加入，然后检查返回的 Chrome 健康状态。如果任一报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，并在浏览器操作完成前停止重试。

常见的手动操作：登录 Chrome 配置文件；从 Meet 主持账号准入访客；在原生提示出现时授予 Chrome 麦克风/摄像头权限；关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 询问 “Do you want people to hear you in the meeting?” 就报告 “未登录”；那是 Meet 的音频选择插页。OpenClaw 会在可用时通过浏览器自动化点击 **Use microphone**，并继续等待真实会议状态；对于仅创建的浏览器回退，它可能改为点击 **Continue without microphone**，因为生成 URL 不需要实时音频路径。

### 会议创建失败

`googlemeet create` 在配置 OAuth 时使用 Meet API `spaces.create`，否则使用固定的 Chrome 节点浏览器。确认：

- **API 创建**：存在 `oauth.clientId` 和 `oauth.refreshToken`（或匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量），且刷新令牌是在添加创建支持之后生成的；较旧的令牌可能缺少 `meetings.space.created`，因此请重新运行 `openclaw googlemeet auth login --json`。
- **浏览器回退**：`defaultTransport: "chrome-node"` 和 `chromeNode.node` 指向一个已连接且具有 `browser.proxy` 和 `googlemeet.chrome` 的节点；该节点上的 OpenClaw Chrome 配置文件已登录，并且可以打开 `https://meet.google.com/new`。
- **浏览器回退重试**：先复用已有的 `.../new` 或 Google 账号提示标签页，再打开新标签页；重试工具调用，而不是手动再打开一个标签页。
- **手动操作**：如果工具返回 `manualActionRequired: true`，请使用 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 指导操作员；不要循环重试。
- **音频选择插页**：如果 Meet 显示 “Do you want people to hear you in the meeting?”，保持标签页打开。OpenClaw 应点击 **Use microphone** 或（仅创建时）**Continue without microphone**，并继续等待生成的 URL；如果无法执行，错误应提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### agent 已加入但不说话

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "agent"` 走 STT -> OpenClaw agent -> TTS 路径，使用 `mode: "bidi"` 走直接实时语音回退。`mode: "transcribe"` 有意不启动回话桥。对于仅观察调试，请在参与者发言后运行 `openclaw googlemeet status --json <session-id>`，并检查 `captioning`、`transcriptLines`、`lastCaptionText`。如果 `inCall` 为 true 但 `transcriptLines` 一直是 `0`，可能是 Meet 字幕被禁用、观察者安装后还没有人发言、Meet UI 已更改，或该会议语言/账号不可用实时字幕。

`googlemeet test-speech` 始终检查实时路径，并报告此次调用是否观察到桥输出字节。如果 `speechOutputVerified` 为 false 且 `speechOutputTimedOut` 为 true，实时提供商可能已接受话语，但 OpenClaw 没有看到新的输出字节到达 Chrome 音频桥。

还要验证：Gateway 网关主机上有可用的实时提供商密钥（`OPENAI_API_KEY` 或 `GEMINI_API_KEY`）；Chrome 主机上可见 `BlackHole 2ch`；那里存在 `sox`；Meet 麦克风/扬声器通过虚拟音频路径路由（对于本地 Chrome 实时加入，`doctor` 应显示 `meet output routed: yes`）。

`googlemeet doctor [session-id]` 会打印会话、节点、通话中状态、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最后音频时间戳、字节计数器和浏览器 URL。使用 `googlemeet status [session-id] --json` 查看原始 JSON，并使用 `googlemeet doctor --oauth`（添加 `--meeting` 或 `--create-space`）验证 OAuth 刷新且不暴露令牌。

如果 agent 超时且 Meet 标签页已经打开，请检查它，而不要再打开一个：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`：它会为所选传输聚焦并检查现有 Meet 标签页（`chrome` 使用本地浏览器控制，`chrome-node` 使用配置的节点），不打开新标签页或会话，并报告当前阻塞项（登录、准入、权限、音频选择状态）。CLI 命令会连接到配置的 Gateway 网关，该 Gateway 网关必须正在运行；`chrome-node` 还要求节点已连接。

### Twilio 设置检查失败

当不允许或未启用 `voice-call` 时，`twilio-voice-call-plugin` 会失败：将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载 Gateway 网关。

当 Twilio 后端缺少账号 SID、认证令牌或主叫号码时，`twilio-voice-call-credentials` 会失败：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

当 `voice-call` 没有公开 webhook 暴露，或 `publicUrl` 指向 loopback/专用网络空间时，`twilio-voice-call-webhook` 会失败。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`；运营商回调无法访问这些地址。将 `plugins.entries.voice-call.config.publicUrl` 设置为公开 URL，或配置隧道/Tailscale 暴露：

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

重启或重新加载 Gateway 网关，然后：

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 默认仅检查就绪状态。对特定号码执行 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

仅在有意拨打实时出站电话时添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 呼叫开始但从未进入会议

确认 Meet 事件暴露电话拨入详情，并传入准确的拨入号码加 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

在 `--dtmf-sequence` 中使用前导 `w` 或逗号，在 PIN 前加入暂停。

如果呼叫已创建，但 Meet 名单中始终没有显示拨入参与者：

- `openclaw googlemeet doctor <session-id>`：确认委托的 Twilio 呼叫 ID、DTMF 是否已排队，以及是否请求了介绍问候语。
- `openclaw voicecall status --call-id <id>`：确认呼叫仍处于活动状态。
- `openclaw voicecall tail`：确认 Twilio webhooks 正在到达 Gateway 网关。
- `openclaw logs --follow`：查找 Twilio Meet 序列：Google Meet 委托加入，Voice Call 存储并提供连接前 DTMF TwiML，Voice Call 为 Twilio 呼叫提供实时 TwiML，然后 Google Meet 使用 `voicecall.speak` 请求介绍语音。
- 重新运行 `openclaw googlemeet setup --transport twilio`；绿色设置检查是必需的，但不能证明会议 PIN 序列正确。
- 确认拨入号码属于与 PIN 相同的 Meet 邀请和地区。
- 如果 Meet 应答较慢，或在发送连接前 DTMF 后呼叫转录仍显示 PIN 提示，请将 `voiceCall.dtmfDelayMs` 从默认的 12 秒调高。
- 如果参与者加入但你听不到问候语，请检查 `openclaw logs --follow` 中的 DTMF 后 `voicecall.speak` 请求，以及媒体流 TTS 播放或 Twilio `<Say>` 回退。如果转录仍显示 “enter the meeting PIN”，电话链路尚未加入 Meet 房间，因此参与者不会听到语音。

如果 webhooks 没有到达，请先调试 Voice Call 插件：提供商必须能够访问 `plugins.entries.voice-call.config.publicUrl` 或配置的隧道。参见 [语音呼叫故障排除](/zh-CN/plugins/voice-call#troubleshooting)。

## 说明

Google Meet 的官方媒体 API 以接收为导向，因此向通话中说话仍需要参与者路径。此插件让该边界保持可见：Chrome 处理浏览器参与和本地音频路由；Twilio 处理电话拨入参与。

Chrome 回话模式需要 `BlackHole 2ch`，并且需要以下任一项：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有桥，并以 `chrome.audioFormat` 在这些命令与所选提供商之间传输音频。`agent` 模式使用实时转录加常规 TTS；`bidi` 模式使用实时语音提供商。默认路径是 24 kHz PCM16，`chrome.audioBufferBytes: 4096`；8 kHz G.711 mu-law 仍可用于旧版命令对。
- `chrome.audioBridgeCommand`：外部桥命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。仅对 `bidi` 有效，因为 `agent` 模式需要直接访问命令对以用于 TTS。

使用命令对 Chrome 桥时，`chrome.bargeInInputCommand` 可以监听单独的本地麦克风，并在人类开始说话时清除助手播放，使人类语音即使在助手播放期间共享 BlackHole loopback 输入被暂时抑制时也能优先于助手输出。与 `chrome.audioInputCommand`/`chrome.audioOutputCommand` 一样，它是操作员配置的本地命令：使用明确受信任的命令路径或参数列表，绝不要使用来自不受信任位置的脚本。

为获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到不同的虚拟设备，或使用类似 Loopback 的虚拟设备图；单个共享 BlackHole 设备可能会把其他参与者的声音回声回通话中。

`googlemeet speak` 会为 Chrome 会话触发活动的语音回复音频桥接；`googlemeet leave` 会停止它（并且对于通过 Voice Call 委派的 Twilio 会话，会挂断底层通话）。使用 `googlemeet end-active-conference` 还可以关闭 API 管理空间中的活动 Google Meet 会议。

## 相关

- [语音通话插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

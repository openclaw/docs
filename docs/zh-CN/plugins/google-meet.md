---
read_when:
    - 你希望一个 OpenClaw 智能体加入 Google Meet 通话
    - 你正在将 Chrome 或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 使用实时语音默认设置加入明确的 Meet URL
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-24T02:06:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a3b040007d09f1bc13aea1b046868b85c39380f287b1185e644cb8b83761bf5
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（插件）

OpenClaw 的 Google Meet 参与者支持。

该插件在设计上是显式的：

- 它只会加入明确的 `https://meet.google.com/...` URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 认证初始方式为个人 Google OAuth 或已登录的 Chrome 配置文件。
- 没有自动的同意提示播报。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流使用。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 之前运行音频桥接健康检查命令和启动命令。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

通过本地 OpenClaw 音频桥接路由 Chrome 的麦克风和扬声器音频。如果未安装 `BlackHole 2ch`，加入会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输方式是一个严格的拨号方案，委托给 Voice Call 插件处理。它不会解析 Meet 页面中的电话号码。

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

Google Meet Media API 访问首先使用个人 OAuth 客户端。配置 `oauth.clientId`，并可选配置 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个包含刷新令牌的 `oauth` 配置块。它使用 PKCE、位于 `http://localhost:8085/oauth2callback` 的 localhost 回调，以及通过 `--manual` 启用的手动复制/粘贴流程。

这些环境变量可作为回退值使用：

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

在进行媒体相关工作之前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

只有在确认你的 Cloud 项目、OAuth 主体以及会议参与者都已加入适用于 Meet media API 的 Google Workspace Developer Preview Program 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome 实时路径只需要启用该插件、BlackHole、SoX 和一个 OpenAI 密钥：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
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
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law 音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law 音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口头回复，在需要更深入回答时使用 `openclaw_agent_consult`

可选覆盖项：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  realtime: {
    toolPolicy: "owner",
  },
}
```

仅适用于 Twilio 的配置：

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

## 工具

智能体可以使用 `google_meet` 工具：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome",
  "mode": "realtime"
}
```

使用 `action: "status"` 可列出活动会话或检查某个会话 ID。使用 `action: "leave"` 可将某个会话标记为已结束。

## 实时智能体咨询

Chrome 实时模式针对实时语音循环进行了优化。实时语音提供商会听取会议音频，并通过已配置的音频桥接发声。当实时模型需要更深入的推理、最新信息或常规 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，附带最近的会议转录上下文，并向实时语音会话返回简洁的口头回答。然后语音模型就可以将该回答再次说回会议中。

`realtime.toolPolicy` 控制咨询运行方式：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为只能使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用普通的智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按 Meet 会话进行作用域隔离，因此后续的咨询调用可以在同一场会议期间复用先前的咨询上下文。

## 说明

Google Meet 的官方媒体 API 主要面向接收，因此要在 Meet 通话中发言，仍然需要参与者路径。该插件让这一边界保持可见：Chrome 处理浏览器参与和本地音频路由；Twilio 处理电话拨入式参与。

Chrome 实时模式需要以下两者之一：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风分别路由到不同的虚拟设备，或使用类似 Loopback 的虚拟设备图。单个共享的 BlackHole 设备可能会将其他参与者的声音回声回传到通话中。

对于 Chrome 会话，`googlemeet leave` 会停止基于命令对的实时音频桥接。对于通过 Voice Call 插件委托的 Twilio 会话，它还会挂断底层语音通话。

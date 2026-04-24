---
read_when:
    - 你想让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你正在将 Chrome 或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-24T01:59:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92e61135fc2b767f26b17628a9cdf699015114ddb6cf8313510bd8c3298a908c
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（插件）

适用于 OpenClaw 的 Google Meet 参与者支持。

该插件在设计上是显式的：

- 它只会加入明确指定的 `https://meet.google.com/...` URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 认证一开始使用个人 Google OAuth 或已登录的 Chrome 配置文件。
- 不会自动播报同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流使用。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查是否存在 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 之前运行音频桥接健康检查命令和启动命令。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
```

将 Chrome 的麦克风和扬声器音频通过本地 OpenClaw 音频桥接进行路由。如果未安装 `BlackHole 2ch`，加入操作会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输方式是一个严格的拨号计划，并委托给 Voice Call 插件处理。它不会解析 Meet 页面中的电话号码。

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

Google Meet Media API 访问优先使用个人 OAuth 客户端。配置 `oauth.clientId` 和可选的 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会输出一个包含刷新令牌的 `oauth` 配置块。它使用 PKCE、位于 `http://localhost:8085/oauth2callback` 的 localhost 回调，以及通过 `--manual` 进行的手动复制/粘贴流程。

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

在进行媒体相关工作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

只有在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入适用于 Meet 媒体 API 的 Google Workspace Developer Preview Program 后，才将 `preview.enrollmentAcknowledged: true` 设为启用。

## 配置

在 `plugins.entries.google-meet.config` 下设置配置：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome",
          defaultMode: "realtime",
          defaults: {
            meeting: "https://meet.google.com/abc-defg-hij",
          },
          preview: {
            enrollmentAcknowledged: false,
          },
          chrome: {
            audioBackend: "blackhole-2ch",
            launch: true,
            browserProfile: "Default",
            // 命令对桥接：输入将 8 kHz G.711 mu-law 音频写入 stdout。
            audioInputCommand: [
              "rec",
              "-q",
              "-t",
              "raw",
              "-r",
              "8000",
              "-c",
              "1",
              "-e",
              "mu-law",
              "-b",
              "8",
              "-",
            ],
            // 输出从 stdin 读取 8 kHz G.711 mu-law 音频。
            audioOutputCommand: [
              "play",
              "-q",
              "-t",
              "raw",
              "-r",
              "8000",
              "-c",
              "1",
              "-e",
              "mu-law",
              "-b",
              "8",
              "-",
            ],
          },
          twilio: {
            defaultDialInNumber: "+15551234567",
            defaultPin: "123456",
          },
          voiceCall: {
            enabled: true,
            gatewayUrl: "ws://127.0.0.1:18789",
            dtmfDelayMs: 2500,
          },
          realtime: {
            provider: "openai",
            model: "gpt-realtime",
            instructions: "你将以 Peter 的 OpenClaw 智能体身份加入一个私人 Google Meet。除非被要求，否则请简短回答。",
            toolPolicy: "safe-read-only",
            providers: {
              openai: {
                apiKey: { env: "OPENAI_API_KEY" },
              },
            },
          },
          auth: {
            provider: "google-oauth",
          },
          oauth: {
            clientId: "your-google-oauth-client-id.apps.googleusercontent.com",
            refreshToken: "stored-refresh-token",
          },
        },
      },
    },
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

使用 `action: "status"` 可列出活动中的会话或检查某个会话 ID。使用 `action: "leave"` 可将会话标记为已结束。

## 说明

Google Meet 的官方媒体 API 主要面向接收，因此要在 Meet 通话中发言，仍然需要一个参与者路径。该插件保持这一边界清晰可见：Chrome 负责浏览器参与和本地音频路由；Twilio 负责电话拨入参与。

实时模式会为语音模型提供一个工具 `openclaw_agent_consult`，除非 `realtime.toolPolicy` 设为 `none`。该工具会向常规 OpenClaw 智能体请求一个简洁的口头回答，并将最近的会议转录内容作为上下文。使用 `safe-read-only` 时，咨询运行仅限于读取/搜索/记忆工具。使用 `owner` 时，它会继承常规智能体工具策略。

Chrome 实时模式需要以下其中之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 负责实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：外部桥接命令负责整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请通过独立的虚拟设备或类似 Loopback 的虚拟设备图，将 Meet 输出和 Meet 麦克风路由开来。单个共享的 BlackHole 设备可能会将其他参与者的声音回传进通话。

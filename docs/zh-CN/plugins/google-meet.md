---
read_when:
    - 你希望一个 OpenClaw 智能体加入 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-24T05:21:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 055419591c83130e64303f76af666da60d7623f358d1e2a1f2f9d8cf89f5ce85
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet（插件）

适用于 OpenClaw 的 Google Meet 参与者支持。

该插件在设计上是显式的：

- 它只会加入明确的 `https://meet.google.com/...` URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 认证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动同意公告。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流使用。

## 快速开始

安装本地音频依赖，并确保 realtime 提供商可以使用 OpenAI：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启后 macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项：

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

加入会议：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体通过 `google_meet` 工具加入：

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，选择 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。要获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备足以进行第一次冒烟测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或配置模型 API 密钥，只是为了让 VM 承载 Chrome。你可以在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。在 VM 中将内置插件启用一次，这样节点就会声明 Chrome 命令：

各组件运行位置如下：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、realtime 提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥，或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，以便 macOS 暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 能看到该音频设备和 SoX 命令：

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

如果 `<gateway-host>` 是局域网 IP，且你未使用 TLS，那么除非你为该受信任私有网络显式启用明文 WebSocket，否则节点会拒绝该连接：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时，也使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能够看到该节点，并且它声明了 `googlemeet.chrome`：

```bash
openclaw nodes status
```

在 Gateway 网关主机上通过该节点路由 Meet：

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

现在你可以像平常一样从 Gateway 网关主机加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者让智能体使用 `google_meet` 工具并传入 `transport: "chrome-node"`。

如果省略 `chromeNode.node`，只有在恰好只有一个已连接节点声明了 `googlemeet.chrome` 时，OpenClaw 才会自动选择该节点。如果连接了多个具备该能力的节点，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见失败检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet`。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 已打开但无法加入：在 VM 内登录 Chrome，并确认该配置文件可以手动加入该 Meet URL。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；使用独立的虚拟设备或类似 Loopback 的路由以获得干净的双工音频。

## 安装说明

Chrome realtime 默认路径使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play` 命令来提供默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch` 音频设备，以供 Chrome/Meet 路由使用。

OpenClaw 不会捆绑或重新分发这两个软件包。文档要求用户通过 Homebrew 将它们作为主机依赖进行安装。SoX 的许可证为 `LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建了一个将 BlackHole 与 OpenClaw 一起捆绑的安装程序或 appliance，请审查 BlackHole 上游许可条款，或从 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 之前运行一个音频桥接健康检查命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时，使用 `chrome`；当 Chrome/音频位于已配对节点（如 Parallels macOS VM）上时，使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 的麦克风和扬声器音频路由到本地 OpenClaw 音频桥接。如果未安装 `BlackHole 2ch`，加入操作会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输是一个严格的拨号方案，并委托给 Voice Call 插件。它不会解析 Meet 页面中的电话号码。

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

Google Meet Media API 访问首先使用个人 OAuth 客户端。配置 `oauth.clientId`，并可选配置 `oauth.clientSecret`，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印一个包含刷新令牌的 `oauth` 配置块。它使用 PKCE、位于 `http://localhost:8085/oauth2callback` 的 localhost 回调，以及通过 `--manual` 进行的手动复制/粘贴流程。

这些环境变量可作为回退使用：

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

在进行媒体工作之前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

仅在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入适用于 Meet media API 的 Google Workspace Developer Preview Program 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome realtime 路径只需要启用插件、BlackHole、SoX，以及一个 OpenAI 密钥：

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
- `chromeNode.node`：用于 `chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law 音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law 音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口头回复，较深入的回答则使用 `openclaw_agent_consult`

可选覆盖项：

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
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
  "transport": "chrome-node",
  "mode": "realtime"
}
```

当 Chrome 在 Gateway 网关主机上运行时，使用 `transport: "chrome"`。当 Chrome 在已配对节点（如 Parallels VM）上运行时，使用 `transport: "chrome-node"`。在这两种情况下，realtime 模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 列出活动会话，或检查某个会话 ID。使用 `action: "leave"` 将某个会话标记为已结束。

## Realtime 智能体 consult

Chrome realtime 模式针对实时语音循环进行了优化。实时语音提供商会听取会议音频，并通过已配置的音频桥接进行发声。当 realtime 模型需要更深入的推理、最新信息或普通 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

consult 工具会在后台运行常规 OpenClaw 智能体，附带最近的会议转录上下文，并向 realtime 语音会话返回简洁的口头回答。随后，语音模型就可以将该回答说回会议中。

`realtime.toolPolicy` 控制 consult 运行方式：

- `safe-read-only`：公开 consult 工具，并将常规智能体限制为使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：公开 consult 工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向 realtime 语音模型公开 consult 工具。

consult 会话键按 Meet 会话进行作用域隔离，因此在同一场会议期间，后续的 consult 调用可以复用先前的 consult 上下文。

## 注意事项

Google Meet 的官方 media API 偏向接收，因此要在 Meet 通话中发言，仍然需要一个参与者路径。该插件将这一边界保持为可见状态：Chrome 负责浏览器参与和本地音频路由；Twilio 负责电话拨入参与。

Chrome realtime 模式需要以下二者之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 负责 realtime 模型桥接，并在这些命令与所选 realtime 语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令负责整个本地音频路径，并且必须在启动或验证其守护进程后退出。

要获得干净的双工音频，请通过独立的虚拟设备或类似 Loopback 的虚拟设备图来路由 Meet 输出和 Meet 麦克风。单个共享的 BlackHole 设备可能会将其他参与者的声音回送进通话中。

对于 Chrome 会话，`googlemeet leave` 会停止命令对 realtime 音频桥接。对于通过 Voice Call 插件委托的 Twilio 会话，它还会挂断底层语音通话。

## 相关内容

- [Voice call 插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

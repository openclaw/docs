---
read_when:
    - 你想让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你想让一个 OpenClaw 智能体创建新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-25T06:52:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d512862fc3fd8da8b3e581bb69f04238ca533de448b90481ff39ac333061d50c
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 的 Google Meet 参会支持——该插件在设计上是显式的：

- 它只会加入明确指定的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建一个新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：使用 `realtime` 进行实时收听/回话，或使用 `transcribe` 在不启用实时语音桥接的情况下加入/控制浏览器。
- 认证起始方式为个人 Google OAuth 或已登录的 Chrome 配置文件。
- 没有自动的同意提示播报。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受一个拨入号码，以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流使用。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音提供商。OpenAI 是默认项；Google Gemini Live 也可与 `realtime.provider: "google"` 一起使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启，macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两部分都已就绪：

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

设置输出旨在让智能体可读。它会报告 Chrome 配置文件、音频桥接、节点固定、延迟的实时介绍，以及在配置了 Twilio 委派时，`voice-call` 插件和 Twilio 凭证是否就绪。
在要求智能体加入之前，将任何 `ok: false` 的检查都视为阻塞项。
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

仅创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：当 Google Meet OAuth 凭证已配置时使用。这是最可预测的路径，不依赖浏览器 UI 状态。
- 浏览器回退：当 OAuth 凭证缺失时使用。OpenClaw 使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。这条路径要求节点上的 OpenClaw Chrome 配置文件已登录 Google。
  浏览器自动化会处理 Meet 自身的首次运行麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程也会在打开新标签页前尝试复用现有的 Meet 标签页。匹配时会忽略无害的 URL 查询字符串，例如 `authuser`，因此智能体的重试应聚焦到已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含一个 `source` 字段（`api` 或 `browser`），这样智能体可以说明使用了哪条路径。
`create` 默认会加入新会议，并返回 `joined: true` 以及加入会话。若只想生成 URL，请在 CLI 中使用 `create --no-join`，或向工具传入 `"join": false`。

或者告诉智能体：“创建一个 Google Meet，用实时语音加入，并把链接发给我。”
智能体应使用 `action: "create"` 调用 `google_meet`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

若要仅观察/控制浏览器地加入，请设置 `"mode": "transcribe"`。这样不会启动双工实时模型桥接，因此它不会在会议中回话。

在实时会话期间，`google_meet` 状态会包含浏览器和音频桥接健康信息，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近输入/输出时间戳、字节计数，以及桥接关闭状态。
如果出现安全的 Meet 页面提示，浏览器自动化会在可处理时自动处理。
登录、主持人准入以及浏览器/操作系统权限提示会作为手动操作报告，并带有原因和消息，供智能体转达。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，选择 `BlackHole 2ch` 作为 OpenClaw 使用的麦克风/扬声器路径。为了获得干净的双工音频，请使用独立的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备足以完成首次冒烟测试，但可能会产生回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中部署完整的 OpenClaw Gateway 网关或模型 API 密钥，只是为了让 VM 承担 Chrome。
你可以在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。只需在 VM 中启用一次内置插件，这样节点就会广播 Chrome 命令：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，macOS 才会暴露 `BlackHole 2ch`：

```bash
sudo reboot
```

重启后，验证 VM 能看到该音频设备和 SoX 命令：

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

如果 `<gateway-host>` 是局域网 IP 且你未使用 TLS，除非你为该受信任私有网络显式启用明文 WebSocket，否则节点会拒绝它：

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，不是 `openclaw.json` 设置。
当它出现在安装命令中时，`openclaw node install` 会将其存储到 LaunchAgent 环境中。

在 Gateway 网关主机上批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能看到该节点，并且它同时广播了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

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

现在就可以从 Gateway 网关主机正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或者要求智能体使用 `google_meet` 工具并设置 `transport: "chrome-node"`。

如需执行一个单命令冒烟测试，以创建或复用会话、说出一段已知短语并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在加入过程中，OpenClaw 浏览器自动化会填写访客名称、点击 Join/Ask to join，并在出现该提示时接受 Meet 首次运行的 “Use microphone” 选项。
在仅通过浏览器创建会议时，如果 Meet 没有暴露使用麦克风按钮，它也可以在不使用麦克风的情况下继续越过同一个提示。
如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限，或 Meet 卡在某个自动化无法解决的提示上，加入/`test-speech` 结果会报告 `manualActionRequired: true`，并附带 `manualActionReason` 和 `manualActionMessage`。
智能体应停止重试加入，报告这条原样消息以及当前的 `browserUrl`/`browserTitle`，并且仅在手动浏览器操作完成后才重试。

如果省略 `chromeNode.node`，只有在恰好有一个已连接节点同时广播 `googlemeet.chrome` 和浏览器控制能力时，OpenClaw 才会自动选择。
如果连接了多个具备能力的节点，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见故障检查：

- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。还要确认 Gateway 网关主机通过 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]` 允许这两个节点命令。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 已打开但无法加入：在 VM 中登录浏览器配置文件，或者保留 `chrome.guestName` 以访客身份加入。访客自动加入使用 OpenClaw 通过节点浏览器代理执行的浏览器自动化；请确保节点浏览器配置指向你想使用的配置文件，例如 `browser.defaultProfile: "user"` 或某个已命名的现有会话配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会先激活相同 Meet URL 的现有标签页，再打开新标签页；而且浏览器会议创建会复用进行中的 `https://meet.google.com/new` 或 Google 账号提示标签页，而不是再打开一个。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；使用独立的虚拟设备或类似 Loopback 的路由以获得干净的双工音频。

## 安装说明

Chrome 实时默认设置使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play` 命令来实现默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch` 音频设备，供 Chrome/Meet 路由使用。

OpenClaw 不会内置或重新分发这两个软件包。文档要求用户通过 Homebrew 将它们作为主机依赖安装。
SoX 采用 `LGPL-2.0-only AND GPL-2.0-only` 许可；BlackHole 采用 GPL-3.0 许可。
如果你要构建一个将 BlackHole 与 OpenClaw 一起打包的安装程序或设备，请审查 BlackHole 上游的许可条款，或从 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。
如果进行了配置，它还会在打开 Chrome 之前运行音频桥接健康检查命令和启动命令。
当 Chrome/音频位于 Gateway 网关主机上时，请使用 `chrome`；当 Chrome/音频位于已配对节点上（例如 Parallels macOS VM）时，请使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

将 Chrome 麦克风和扬声器音频通过本地 OpenClaw 音频桥接进行路由。如果未安装 `BlackHole 2ch`，加入会因设置错误而失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输方式是一种严格的拨号计划，委派给 Voice Call 插件处理。它不会解析 Meet 页面以获取电话号码。

当无法使用 Chrome 参会，或者你想要一个电话拨入后备方案时，请使用此方式。Google Meet 必须为该会议提供电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面中发现这些信息。

在 Gateway 网关主机上启用 Voice Call 插件，而不是在 Chrome 节点上：

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

通过环境变量或配置提供 Twilio 凭证。环境变量可将密钥保留在 `openclaw.json` 之外：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后请重启或重新加载 Gateway 网关；在 Gateway 网关进程重新加载之前，插件配置变更不会出现在已运行的进程中。

然后进行验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委派连通后，`googlemeet setup` 会包含成功的 `twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

当会议需要自定义序列时，请使用 `--dtmf-sequence`：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 和预检

OAuth 对于创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你需要官方 API 创建、空间解析或 Meet Media API 预检时，请配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建一个 Google Cloud OAuth 客户端，请求所需作用域，授权一个 Google 账号，然后将生成的 refresh token 存储在 Google Meet 插件配置中，或提供 `OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不会替代 Chrome 加入路径。使用浏览器参会时，Chrome 和 `chrome-node` 传输方式仍然通过已登录的 Chrome 配置文件、BlackHole/SoX，以及一个已连接节点来加入。OAuth 仅用于官方 Google Meet API 路径：创建会议空间、解析空间，以及执行 Meet Media API 预检。

### 创建 Google 凭证

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - 对于 Google Workspace 组织，**Internal** 最简单。
   - **External** 适用于个人/测试设置；当应用处于 Testing 状态时，将每个会授权该应用的 Google 账号添加为测试用户。
4. 添加 OpenClaw 请求的作用域：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建一个 OAuth client ID。
   - 应用类型：**Web application**。
   - 已获授权的重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制 client ID 和 client secret。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 允许 OpenClaw 将 Meet URL/代码解析为会议空间。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体相关工作；对于实际的 Media API 使用，Google 可能要求加入 Developer Preview。
如果你只需要基于浏览器的 Chrome 加入，可完全跳过 OAuth。

### 生成 refresh token

配置 `oauth.clientId`，并可选配置 `oauth.clientSecret`，或将它们作为环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会输出一个包含 refresh token 的 `oauth` 配置块。它使用 PKCE、本地回调 `http://localhost:8085/oauth2callback`，以及通过 `--manual` 启用的手动复制/粘贴流程。

示例：

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

当浏览器无法访问本地回调时，请使用手动模式：

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

将 `oauth` 对象存储到 Google Meet 插件配置下：

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

如果你不想将 refresh token 放入配置中，优先使用环境变量。
如果配置和环境变量值同时存在，插件会优先解析配置，然后再回退到环境变量。

OAuth 同意内容包括 Meet 空间创建、Meet 空间读取访问，以及 Meet 会议媒体读取访问。如果你在会议创建支持出现之前就已完成认证，请重新运行 `openclaw googlemeet auth login --json`，以便 refresh token 包含 `meetings.space.created` 作用域。

### 使用 Doctor 验证 OAuth

当你需要快速、无密钥暴露的健康检查时，请运行 OAuth Doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不要求连接 Chrome 节点。它会检查 OAuth 配置是否存在，以及 refresh token 是否可以生成 access token。JSON 报告仅包含 `ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息等状态字段；它不会输出 access token、refresh token 或 client secret。

常见结果：

| 检查 | 含义 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config` | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或存在已缓存的 access token。 |
| `oauth-token` | 已缓存的 access token 仍然有效，或 refresh token 已生成新的 access token。 |
| `meet-spaces-get` | 可选的 `--meeting` 检查已解析出一个现有 Meet 空间。 |
| `meet-spaces-create` | 可选的 `--create-space` 检查已创建一个新的 Meet 空间。 |

如需一并证明 Google Meet API 已启用以及具备 `spaces.create` 作用域，请运行带副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性的 Meet URL。当你需要确认 Google Cloud 项目已启用 Meet API，且已授权账号具备 `meetings.space.created` 作用域时，请使用它。

如需证明对现有会议空间具有读取权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 可证明已授权的 Google 账号对某个现有空间具有读取权限。来自这些检查的 `403` 通常表示 Google Meet REST API 未启用、已同意的 refresh token 缺少所需作用域，或该 Google 账号无权访问该 Meet 空间。若是 refresh token 错误，则表示应重新运行 `openclaw googlemeet auth login --json` 并存储新的 `oauth` 块。

浏览器回退不需要 OAuth 凭证。在该模式下，Google 认证来自所选节点上已登录的 Chrome 配置文件，而不是来自 OpenClaw 配置。

以下环境变量可作为回退值：

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

在进行媒体相关工作前运行预检：

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

在 Meet 创建会议记录后，列出会议工件和出勤情况：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
```

如果你已经知道 conference record id，可以直接使用它：

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

`artifacts` 会在 Google 为该会议暴露这些资源时，返回会议记录元数据，以及参与者、录音、转录、结构化 transcript-entry 和智能笔记资源元数据。对于大型会议，可使用 `--no-transcript-entries` 跳过条目查询。`attendance` 会将参与者展开为 participant-session 行，并附带加入/离开时间戳。这些命令仅使用 Meet REST API；Google Docs/Drive 文档正文下载被明确排除在范围之外，因为那需要单独的 Google Docs/Drive 访问权限。

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会输出新的 `meeting uri`、来源以及加入会话。使用 OAuth 凭证时，它会使用官方 Google Meet API。没有 OAuth 凭证时，它会回退为使用固定的 Chrome 节点上已登录的浏览器配置文件。智能体可以使用 `google_meet` 工具并设置 `action: "create"`，以一步完成创建和加入。若仅创建 URL，请传入 `"join": false`。

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

如果浏览器回退在创建 URL 之前遇到 Google 登录或 Meet 权限阻塞，Gateway 网关方法会返回失败响应，而 `google_meet` 工具会返回结构化详情，而不是普通字符串：

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

当智能体看到 `manualActionRequired: true` 时，它应报告 `manualActionMessage`，再加上浏览器节点/标签页上下文，并停止打开新的 Meet 标签页，直到操作员完成该浏览器步骤。

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

创建 Meet 默认会自动加入。`chrome` 或 `chrome-node` 传输方式仍然需要一个已登录 Google 的 Chrome 配置文件才能通过浏览器加入。如果该配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员先完成 Google 登录再重试。

仅在确认你的 Cloud 项目、OAuth 主体以及会议参与者都已加入用于 Meet 媒体 API 的 Google Workspace Developer Preview Program 后，才将 `preview.enrollmentAcknowledged: true` 设置为 true。

## 配置

常见的 Chrome 实时路径只需要启用插件、安装 BlackHole、SoX，以及一个后端实时语音提供商密钥。OpenAI 是默认项；设置 `realtime.provider: "google"` 可使用 Google Gemini Live：

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
- `chromeNode.node`：用于 `chrome-node` 的可选节点 id/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在已退出登录的 Meet 访客界面上使用的名称
- `chrome.autoJoin: true`：通过 OpenClaw 浏览器自动化，在 `chrome-node` 上尽力填写访客名称并点击 Join Now
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，然后再触发实时介绍
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law 音频写入 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law 音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的语音回复，并在需要更深入回答时使用 `openclaw_agent_consult`
- `realtime.introMessage`：当实时桥接连接时的简短语音就绪检查；将其设为 `""` 可静默加入

可选覆盖项：

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输方式时，它会将实际的 PSTN 通话和 DTMF 委派给 Voice Call 插件。如果 `voice-call` 未启用，Google Meet 仍然可以验证并记录拨号计划，但无法发起 Twilio 通话。

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

当 Chrome 运行在 Gateway 网关主机上时，使用 `transport: "chrome"`。当 Chrome 运行在已配对节点上（例如 Parallels VM）时，使用 `transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证保留在那里。

使用 `action: "status"` 列出活动会话或检查某个会话 ID。使用 `action: "speak"` 并传入 `sessionId` 和 `message`，让实时智能体立即发声。使用 `action: "test_speech"` 创建或复用会话、触发一段已知短语，并在 Chrome 主机可报告时返回 `inCall` 健康状态。使用 `action: "leave"` 将会话标记为已结束。

`status` 在可用时包含 Chrome 健康信息：

- `inCall`：Chrome 看起来已进入 Meet 通话
- `micMuted`：尽力检测的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限授予，或浏览器控制修复，语音功能才能正常工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接最近一次接收/发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体 consult

Chrome 实时模式针对实时语音循环进行了优化。实时语音提供商会听取会议音频，并通过已配置的音频桥接发声。当实时模型需要更深入的推理、最新信息或常规 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

consult 工具会在后台运行常规 OpenClaw 智能体，附带最近的会议转录上下文，并向实时语音会话返回简洁的口语化回答。随后语音模型可以将该回答说回会议中。它使用与 Voice Call 相同的共享实时 consult 工具。

`realtime.toolPolicy` 控制 consult 运行方式：

- `safe-read-only`：暴露 consult 工具，并将常规智能体限制为使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`
- `owner`：暴露 consult 工具，并允许常规智能体使用正常的智能体工具策略
- `none`：不向实时语音模型暴露 consult 工具

consult 会话键按每个 Meet 会话进行作用域隔离，因此在同一场会议期间，后续 consult 调用可以复用之前的 consult 上下文。

如需在 Chrome 完全加入通话后强制执行一次语音就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入并发声冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 现场测试检查清单

在将会议交给无人值守的智能体之前，使用以下流程：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 `chrome-node` 状态：

- `googlemeet setup` 全部为绿色。
- 当 `chrome-node` 是默认传输方式或节点已固定时，`googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点同时广播 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，且 `test-speech` 返回带有 `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机（例如 Parallels macOS VM），在更新 Gateway 网关或 VM 后，这是最短且安全的检查方式：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载、VM 节点已使用当前令牌连接，并且 Meet 音频桥接在智能体打开真实会议标签页之前可用。

对于 Twilio 冒烟测试，请使用一个会暴露电话拨入详情的会议：

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
- 返回的会话包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断被委派的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。正在运行的智能体只能看到由当前 Gateway 网关进程注册的插件工具。

### 没有已连接的具备 Google Meet 能力的节点

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

该节点必须已连接，并列出 `googlemeet.chrome` 和 `browser.proxy`。Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 检查失败，或者 Gateway 网关日志报告 `gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启节点。对于局域网 Gateway 网关，通常意味着：

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

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它报告 `manualActionRequired: true`，请向操作员展示 `manualActionMessage`，并在浏览器操作完成前停止重试。

常见手动操作：

- 登录 Chrome 配置文件。
- 从 Meet 主持人账号批准访客加入。
- 当出现 Chrome 原生权限提示时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示 “Do you want people to hear you in the meeting?” 就报告“未登录”。那是 Meet 的音频选择过渡界面；在可用时，OpenClaw 会通过浏览器自动化点击 **Use microphone**，并继续等待真实会议状态。对于仅创建 URL 的浏览器回退，OpenClaw 可能会点击 **Continue without microphone**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

当配置了 OAuth 凭证时，`googlemeet create` 会首先使用 Google Meet API 的 `spaces.create` 端点。没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：refresh token 是在添加创建支持之后生成的。较旧的令牌可能缺少 `meetings.space.created` 作用域；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 和 `chromeNode.node` 指向一个已连接节点，该节点具有 `browser.proxy` 和 `googlemeet.chrome`。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会在打开新标签页之前复用现有的 `https://meet.google.com/new` 或 Google 账号提示标签页。如果智能体超时，请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 来引导操作员。在该操作完成之前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the meeting?”，请保持该标签页打开。OpenClaw 应通过浏览器自动化点击 **Use microphone**，或者在仅创建的回退场景下点击 **Continue without microphone**，然后继续等待生成的 Meet URL。如果无法做到，错误中应提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体已加入但不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 进行收听/回话。`mode: "transcribe"` 按设计不会启动双工实时语音桥接。

还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- Chrome 主机上可以看到 `BlackHole 2ch`。
- Chrome 主机上存在 `rec` 和 `play`。
- Meet 的麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径进行路由。

`googlemeet doctor [session-id]` 会输出会话、节点、通话中状态、手动操作原因、实时提供商连接状态、`realtimeReady`、音频输入/输出活动、最近音频时间戳、字节计数和浏览器 URL。当你需要原始 JSON 时，请使用 `googlemeet status [session-id]`。当你需要在不暴露令牌的情况下验证 Google Meet OAuth 刷新时，请使用 `googlemeet doctor --oauth`；如果还需要 Google Meet API 证明，请添加 `--meeting` 或 `--create-space`。

如果智能体超时，而你已经看到有 Meet 标签页处于打开状态，请在不再打开另一个标签页的情况下检查该标签页：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`。它会聚焦并检查配置的 Chrome 节点上现有的 Meet 标签页。它不会打开新标签页，也不会创建新会话；它会报告当前阻塞项，例如登录、准入、权限或音频选择状态。CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行，且 Chrome 节点必须已连接。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。
请将其添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，然后重新加载 Gateway 网关。

当 Twilio 后端缺少 account SID、auth token 或 caller number 时，`twilio-voice-call-credentials` 会失败。请在 Gateway 网关主机上设置这些值：

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

`voicecall smoke` 默认仅进行就绪性检查。若要对某个特定号码进行 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明确想发起真实的外呼通知电话时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 呼叫已开始，但始终未进入会议

确认 Meet 事件暴露了电话拨入详情。传入精确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 的官方媒体 API 偏向接收方向，因此向 Meet 通话中发声仍然需要一个参会者路径。该插件将这一边界保持为可见：Chrome 负责浏览器参会和本地音频路由；Twilio 负责电话拨入参会。

Chrome 实时模式需要以下之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥接，并在这些命令与所选实时语音提供商之间传输 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请将 Meet 输出和 Meet 麦克风路由到独立的虚拟设备，或使用类似 Loopback 的虚拟设备图。单个共享的 BlackHole 设备可能会将其他参会者的声音回送进通话。

`googlemeet speak` 会触发 Chrome 会话的活动实时音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委派的 Twilio 会话，`leave` 还会挂断底层语音呼叫。

## 相关内容

- [Voice call 插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

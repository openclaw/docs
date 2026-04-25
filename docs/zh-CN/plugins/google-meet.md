---
read_when:
    - 你希望一个 OpenClaw 智能体加入 Google Meet 通话
    - 你希望一个 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输方式
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-25T19:10:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: a33455733a0818145c6efdd6e739068652806f73a7e35c22430911f7d436f7fe
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw 的 Google Meet 参与支持——该插件在设计上是明确受限的：

- 它只会加入明确指定的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建一个新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深层推理或工具时，实时语音可以回调到完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：使用 `realtime` 进行实时收听/回话，或使用 `transcribe` 在不启用实时语音桥接的情况下加入/控制浏览器。
- 身份验证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 不会自动播报同意声明。
- 默认的 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码，并可选接受 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖，并配置一个后端实时语音提供商。默认是 OpenAI；Google Gemini Live 也可与 `realtime.provider: "google"` 一起使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启后 macOS 才会暴露该设备：

```bash
sudo reboot
```

重启后，验证这两项是否都已就绪：

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

该设置输出旨在供智能体读取。它会报告 Chrome 配置文件、音频桥接、节点固定、延迟的实时介绍，以及在配置了 Twilio 委托时，`voice-call` 插件和 Twilio 凭证是否已就绪。把任何 `ok: false` 的检查都视为在要求智能体加入之前必须解决的阻塞项。对脚本或机器可读输出，请使用 `openclaw googlemeet setup --json`。使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 可在智能体尝试之前预检特定传输方式。

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

`googlemeet create` 有两种路径：

- API 创建：当已配置 Google Meet OAuth 凭证时使用。这是最可预测的路径，不依赖浏览器 UI 状态。
- 浏览器回退：当缺少 OAuth 凭证时使用。OpenClaw 会使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。这条路径要求节点上的 OpenClaw Chrome 配置文件已登录 Google。浏览器自动化会处理 Meet 自身的首次运行麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程还会在打开新标签页之前尝试复用现有 Meet 标签页。匹配时会忽略诸如 `authuser` 之类无害的 URL 查询字符串，因此智能体重试时应聚焦已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含一个 `source` 字段（`api` 或 `browser`），以便智能体解释使用了哪条路径。`create` 默认会加入新会议，并返回 `joined: true` 以及加入会话。若只想生成 URL，请在 CLI 中使用 `create --no-join`，或向工具传递 `"join": false`。

或者告诉智能体：“创建一个 Google Meet，用实时语音加入它，然后把链接发给我。” 智能体应调用带有 `action: "create"` 的 `google_meet`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

若要仅观察/仅控制浏览器地加入，请设置 `"mode": "transcribe"`。这不会启动双向实时模型桥接，因此它不会在会议中回话。

在实时会话期间，`google_meet` 状态包含浏览器和音频桥接健康信息，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近输入/输出时间戳、字节计数以及桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可能时处理它。登录、主持人准入，以及浏览器/操作系统权限提示会作为手动操作报告，并附带原因和消息供智能体转达。

Chrome 会以已登录的 Chrome 配置文件身份加入。在 Meet 中，为 OpenClaw 使用的麦克风/扬声器路径选择 `BlackHole 2ch`。要获得干净的双工音频，请使用单独的虚拟设备或类似 Loopback 的音频图；单个 BlackHole 设备足以完成首次冒烟测试，但可能会回声。

### 本地 Gateway 网关 + Parallels Chrome

你**不**需要在 macOS VM 中运行完整的 OpenClaw Gateway 网关或模型 API 密钥，只是为了让 VM 托管 Chrome。你可以在本地运行 Gateway 网关和智能体，然后在 VM 中运行一个节点主机。在 VM 中启用一次内置插件，使节点通告 Chrome 命令即可：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及一个已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，使 macOS 暴露 `BlackHole 2ch`：

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

如果 `<gateway-host>` 是局域网 IP 且你未使用 TLS，除非你为该受信任私有网络显式选择启用，否则节点会拒绝纯文本 WebSocket：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

把节点安装为 LaunchAgent 时也要使用相同的环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境变量，不是 `openclaw.json` 设置。`openclaw node install` 会在该环境变量出现在安装命令中时，将其存储到 LaunchAgent 环境中。

从 Gateway 网关主机批准该节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能看到该节点，并且它同时通告了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

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

或者要求智能体使用 `google_meet` 工具并指定 `transport: "chrome-node"`。

若要进行一个单命令冒烟测试，用于创建或复用会话、说出一段已知短语并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在加入期间，OpenClaw 浏览器自动化会填写访客名称、点击“加入”/“请求加入”，并在出现该提示时接受 Meet 首次运行时的“使用麦克风”选项。在仅通过浏览器创建会议期间，如果 Meet 没有暴露“使用麦克风”按钮，它也可以在不使用麦克风的情况下继续越过同一提示。如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要麦克风/摄像头权限，或者 Meet 卡在自动化无法解决的提示上，`join`/`test-speech` 结果会报告 `manualActionRequired: true`，并附带 `manualActionReason` 和 `manualActionMessage`。智能体应停止重试加入，报告该准确消息以及当前的 `browserUrl`/`browserTitle`，并仅在手动浏览器操作完成后重试。

如果省略了 `chromeNode.node`，只有在恰好有一个已连接节点同时通告 `googlemeet.chrome` 和浏览器控制能力时，OpenClaw 才会自动选择。如果连接了多个有能力的节点，请将 `chromeNode.node` 设置为节点 id、显示名称或远程 IP。

常见故障检查：

- `Configured Google Meet node ... is not usable: offline`：固定的节点已被 Gateway 网关识别，但当前不可用。智能体应将该节点视为诊断状态，而不是可用的 Chrome 主机，并报告设置阻塞项，而不是回退到其他传输方式，除非用户明确要求这样做。
- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。同时确认 Gateway 网关主机允许这两个节点命令：
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被检查的主机上安装 `blackhole-2ch`，并在使用本地 Chrome 音频前重启。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch`，并重启 VM。
- Chrome 已打开但无法加入：在 VM 中登录浏览器配置文件，或保持设置 `chrome.guestName` 以供访客加入。访客自动加入使用 OpenClaw 通过节点浏览器代理进行的浏览器自动化；确保节点浏览器配置指向你想使用的配置文件，例如 `browser.defaultProfile: "user"` 或某个已存在会话的命名配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会在打开新标签页前激活相同 Meet URL 的现有标签页，而浏览器创建会议也会在打开另一个标签页之前复用进行中的 `https://meet.google.com/new` 或 Google 账号提示标签页。
- 没有音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；使用单独的虚拟设备或类似 Loopback 的路由，以获得干净的双工音频。

## 安装说明

Chrome `realtime` 默认使用两个外部工具：

- `sox`：命令行音频工具。该插件使用它的 `rec` 和 `play` 命令作为默认的 8 kHz G.711 mu-law 音频桥接。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch` 音频设备，供 Chrome/Meet 进行音频路由。

OpenClaw 不会捆绑或重新分发这两个软件包。文档要求用户通过 Homebrew 将它们作为主机依赖进行安装。SoX 采用 `LGPL-2.0-only AND GPL-2.0-only` 许可；BlackHole 采用 GPL-3.0。如果你构建了一个将 BlackHole 与 OpenClaw 一起捆绑的安装程序或设备，请审查 BlackHole 上游的许可条款，或向 Existential Audio 获取单独许可。

## 传输方式

### Chrome

Chrome 传输方式会在 Google Chrome 中打开 Meet URL，并以已登录的 Chrome 配置文件身份加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在打开 Chrome 之前运行音频桥接健康检查命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时使用 `chrome`；当 Chrome/音频位于已配对节点（例如 Parallels macOS VM）上时使用 `chrome-node`。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接来路由 Chrome 的麦克风和扬声器音频。如果未安装 `BlackHole 2ch`，加入操作会以设置错误失败，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输方式是委托给 Voice Call 插件的严格拨号方案。它不会解析 Meet 页面中的电话号码。

当无法使用 Chrome 参与，或者你希望使用电话拨入作为回退方式时，请使用它。Google Meet 必须为该会议提供电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面中发现这些信息。

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

通过环境变量或配置提供 Twilio 凭证。环境变量可以避免将密钥写入 `openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后，重启或重新加载 Gateway 网关；插件配置更改在 Gateway 网关进程重新加载之前不会出现在已运行的进程中。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委托接线完成后，`googlemeet setup` 将包含成功的 `twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查项。

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

OAuth 对创建 Meet 链接来说是可选的，因为 `googlemeet create` 可以回退到浏览器自动化。当你希望使用官方 API 创建、空间解析或 Meet Media API 预检时，请配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建一个 Google Cloud OAuth 客户端，请求所需作用域，授权一个 Google 账号，然后将生成的刷新令牌存储在 Google Meet 插件配置中，或提供 `OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不能替代 Chrome 加入路径。当你使用浏览器参与时，Chrome 和 `chrome-node` 传输方式仍然通过已登录的 Chrome 配置文件、BlackHole/SoX，以及已连接节点来加入。OAuth 仅用于官方 Google Meet API 路径：创建会议空间、解析空间，以及运行 Meet Media API 预检。

### 创建 Google 凭证

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - 对 Google Workspace 组织而言，**Internal** 最简单。
   - **External** 适用于个人/测试设置；当应用处于 Testing 状态时，请将每个会授权该应用的 Google 账号添加为测试用户。
4. 添加 OpenClaw 请求的作用域：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建一个 OAuth 客户端 ID。
   - 应用类型：**Web application**。
   - 已获授权的重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

`meetings.space.created` 是 Google Meet `spaces.create` 所必需的。
`meetings.space.readonly` 允许 OpenClaw 将 Meet URL/代码解析为会议空间。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体相关工作；Google 可能要求加入 Developer Preview 才能实际使用 Media API。如果你只需要基于浏览器的 Chrome 加入方式，可以完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId`，并可选配置 `oauth.clientSecret`，或者将它们作为环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会输出一个带有刷新令牌的 `oauth` 配置块。它使用 PKCE、本地回调 `http://localhost:8085/oauth2callback`，以及配合 `--manual` 的手动复制/粘贴流程。

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

如果你不希望将刷新令牌写入配置，优先使用环境变量。如果配置和值都存在，插件会优先解析配置，然后再回退到环境变量。

OAuth 同意内容包括 Meet 空间创建、Meet 空间读取权限，以及 Meet 会议媒体读取权限。如果你在支持会议创建功能之前就已完成身份验证，请重新运行 `openclaw googlemeet auth login --json`，以便刷新令牌包含 `meetings.space.created` 作用域。

### 使用 Doctor 验证 OAuth

当你需要快速、无密钥暴露的健康检查时，请运行 OAuth Doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不需要连接的 Chrome 节点。它会检查 OAuth 配置是否存在，以及刷新令牌是否能生成访问令牌。JSON 报告仅包含状态字段，例如 `ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息；它不会打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查项               | 含义                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或存在缓存的访问令牌。                    |
| `oauth-token`        | 缓存的访问令牌仍然有效，或者刷新令牌已生成新的访问令牌。                                  |
| `meet-spaces-get`    | 可选的 `--meeting` 检查已解析现有 Meet 空间。                                            |
| `meet-spaces-create` | 可选的 `--create-space` 检查已创建新的 Meet 空间。                                       |

若还要证明 Google Meet API 已启用以及 `spaces.create` 作用域可用，请运行带副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性的 Meet URL。当你需要确认 Google Cloud 项目已启用 Meet API，并且已授权账号具有 `meetings.space.created` 作用域时，请使用它。

若要证明对现有会议空间具有读取权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 可证明已授权的 Google 账号对其可访问的现有空间具有读取权限。这些检查返回 `403` 通常意味着 Google Meet REST API 未启用、已同意的刷新令牌缺少所需作用域，或者该 Google 账号无法访问该 Meet 空间。刷新令牌错误则表示需要重新运行 `openclaw googlemeet auth login --json` 并存储新的 `oauth` 块。

浏览器回退方式不需要 OAuth 凭证。在该模式下，Google 身份验证来自所选节点上已登录的 Chrome 配置文件，而不是 OpenClaw 配置。

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

在 Meet 已创建会议记录后，列出会议产物和出席情况：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

配合 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录。若你希望获取该会议的所有保留记录，请传入 `--all-conference-records`。

日历查找可以先从 Google Calendar 解析会议 URL，再读取 Meet 产物：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索带有 Google Meet 链接的 Calendar 事件。使用 `--event <query>` 搜索匹配的事件文本，使用 `--calendar <id>` 指定非主日历。日历查找需要一次新的 OAuth 登录，其中包含 Calendar events readonly 作用域。
`calendar-events` 会预览匹配的 Meet 事件，并标记 `latest`、`artifacts`、`attendance` 或 `export` 将会选择的事件。

如果你已经知道会议记录 id，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

编写一份可读报告：

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

`artifacts` 会返回会议记录元数据，以及 Google 为该会议提供时的参与者、录制、转录、结构化转录条目和智能笔记资源元数据。对大型会议，使用 `--no-transcript-entries` 可跳过条目查询。`attendance` 会将参与者展开为参与者会话行，其中包含首次/最后出现时间、总会话时长、迟到/提前离开标记，以及按已登录用户或显示名称合并后的重复参与者资源。传入 `--no-merge-duplicates` 可保持原始参与者资源彼此分离，传入 `--late-after-minutes` 可调整迟到判定，传入 `--early-before-minutes` 可调整提前离开判定。

`export` 会写出一个文件夹，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用过的 Calendar 事件，以及任何部分获取警告。传入 `--zip` 还会在该文件夹旁边额外写出一个可移植归档文件。传入 `--include-doc-bodies` 可通过 Google Drive `files.export` 导出关联转录和智能笔记 Google Docs 的正文文本；这需要一次新的 OAuth 登录，其中包含 Drive Meet readonly 作用域。不使用 `--include-doc-bodies` 时，导出仅包含 Meet 元数据和结构化转录条目。如果 Google 返回部分产物失败，例如智能笔记列表、转录条目或 Drive 文档正文错误，摘要和清单会保留该警告，而不是使整个导出失败。
使用 `--dry-run` 可获取相同的产物/出席数据，并打印清单 JSON，而不创建文件夹或 ZIP。这在写出大型导出之前，或当智能体只需要计数、已选记录和警告时很有用。

智能体也可以通过 `google_meet` 工具创建相同的打包内容：

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

针对真实保留会议运行受保护的 live 冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

live 冒烟测试环境：

- `OPENCLAW_LIVE_TEST=1` 启用受保护的 live 测试。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向一个已保留的 Meet URL、代码或 `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth 客户端 id。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供刷新令牌。
- 可选：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和 `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用相同的回退名称，只是不带 `OPENCLAW_` 前缀。

基础的产物/出席 live 冒烟测试需要
`https://www.googleapis.com/auth/meetings.space.readonly` 和
`https://www.googleapis.com/auth/meetings.conference.media.readonly`。Calendar 查找需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文档正文导出需要
`https://www.googleapis.com/auth/drive.meet.readonly`。

创建一个新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。有 OAuth 凭证时，它会使用官方 Google Meet API。没有 OAuth 凭证时，它会回退为使用固定的 Chrome 节点上已登录的浏览器配置文件。智能体可以使用带有 `action: "create"` 的 `google_meet` 工具一步完成创建和加入。若只创建 URL，请传入 `"join": false`。

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

当智能体看到 `manualActionRequired: true` 时，应报告 `manualActionMessage`，并附带浏览器节点/标签页上下文，同时停止打开新的 Meet 标签页，直到操作人员完成浏览器步骤。

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

创建 Meet 默认会加入会议。`chrome` 或 `chrome-node` 传输方式仍然需要一个已登录 Google 的 Chrome 配置文件，才能通过浏览器加入。如果该配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作人员先完成 Google 登录再重试。

仅在确认你的 Cloud 项目、OAuth 主体和会议参与者都已加入 Google Workspace Developer Preview Program for Meet media APIs 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

常见的 Chrome `realtime` 路径只需要启用插件、BlackHole、SoX，以及一个后端实时语音提供商密钥。默认是 OpenAI；设置 `realtime.provider: "google"` 可使用 Google Gemini Live：

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
- `chrome.guestName: "OpenClaw Agent"`：在已退出登录的 Meet 访客界面中使用的名称
- `chrome.autoJoin: true`：通过 OpenClaw 浏览器自动化在 `chrome-node` 上尽力填写访客名并点击“立即加入”
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：等待 Meet 标签页报告已在通话中，再触发实时介绍
- `chrome.audioInputCommand`：将 8 kHz G.711 mu-law 音频写到 stdout 的 SoX `rec` 命令
- `chrome.audioOutputCommand`：从 stdin 读取 8 kHz G.711 mu-law 音频的 SoX `play` 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的口头回复，需要更深入回答时使用 `openclaw_agent_consult`
- `realtime.introMessage`：实时桥接连接时的简短口头就绪检查；将其设为 `""` 可静默加入

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输方式时，它会将实际 PSTN 呼叫和 DTMF 委托给 Voice Call 插件。如果未启用 `voice-call`，Google Meet 仍可验证并记录拨号方案，但无法发起 Twilio 呼叫。

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

当 Chrome 在 Gateway 网关主机上运行时，使用 `transport: "chrome"`。当 Chrome 在已配对节点（例如 Parallels VM）上运行时，使用 `transport: "chrome-node"`。在这两种情况下，实时模型和 `openclaw_agent_consult` 都运行在 Gateway 网关主机上，因此模型凭证会保留在那里。

使用 `action: "status"` 可列出活动会话或检查某个会话 ID。使用带有 `sessionId` 和 `message` 的 `action: "speak"` 可让实时智能体立即发言。使用 `action: "test_speech"` 可创建或复用会话、触发一段已知短语，并在 Chrome 主机能够报告时返回 `inCall` 健康状态。使用 `action: "leave"` 可将会话标记为已结束。

`status` 在可用时包含 Chrome 健康信息：

- `inCall`：Chrome 看起来已进入 Meet 通话
- `micMuted`：尽力而为的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限授予，或浏览器控制修复后语音功能才可工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：最近一次从桥接接收或发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome `realtime` 模式针对实时语音回路进行了优化。实时语音提供商会听取会议音频，并通过配置的音频桥接进行发言。当实时模型需要更深层推理、当前信息或常规 OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

consult 工具会在幕后运行常规 OpenClaw 智能体，附带最近的会议转录上下文，并向实时语音会话返回简洁的口头回答。然后语音模型可以将该回答回说到会议中。它与 Voice Call 使用同一个共享的实时 consult 工具。

`realtime.toolPolicy` 控制 consult 运行：

- `safe-read-only`：暴露 consult 工具，并将常规智能体限制为使用 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。
- `owner`：暴露 consult 工具，并允许常规智能体使用正常的智能体工具策略。
- `none`：不向实时语音模型暴露 consult 工具。

consult 会话键按 Meet 会话逐个限定，因此在同一会议期间，后续 consult 调用可以复用之前的 consult 上下文。

若要在 Chrome 完全加入通话后强制执行一次口头就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

对于完整的加入并发言冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Live 测试检查清单

在将会议交给无人值守的智能体之前，使用以下顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- 当 `chrome-node` 是默认传输方式或已固定某个节点时，`googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，并且 `test-speech` 返回带有 `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机（例如 Parallels macOS VM），这是在 Gateway 网关或 VM 更新后最短且安全的检查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载、VM 节点已使用当前令牌连接，并且 Meet 音频桥接在智能体打开真实会议标签页之前已可用。

对于 Twilio 冒烟测试，请使用一个会公开电话拨入详情的会议：

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

预期的 Twilio 状态：

- `googlemeet setup` 包含绿色的 `twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查项。
- Gateway 网关重新加载后，CLI 中可用 `voicecall`。
- 返回的会话包含 `transport: "twilio"` 和一个 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断已委托的语音呼叫。

## 故障排除

### 智能体看不到 Google Meet 工具

确认该插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。正在运行的智能体只能看到当前 Gateway 网关进程已注册的插件工具。

### 没有已连接的具备 Google Meet 能力的节点

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

该节点必须处于已连接状态，并列出 `googlemeet.chrome` 和 `browser.proxy`。Gateway 网关配置必须允许这些节点命令：

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

如果 `googlemeet setup` 的 `chrome-node-connected` 检查失败，或者 Gateway 网关日志报告
`gateway token mismatch`，请使用当前 Gateway 网关令牌重新安装或重启该节点。对于局域网 Gateway 网关，通常意味着：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

然后重新加载节点服务，并重新运行：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 浏览器已打开，但智能体无法加入

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它报告 `manualActionRequired: true`，请将 `manualActionMessage` 显示给操作人员，并在浏览器操作完成前停止重试。

常见的手动操作：

- 登录到 Chrome 配置文件。
- 从 Meet 主持人账号批准该访客。
- 当出现 Chrome 原生权限提示时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅因为 Meet 显示 “Do you want people to hear you in the meeting?” 就报告“未登录”。这是 Meet 的音频选择过渡页；OpenClaw 会在可用时通过浏览器自动化点击 **Use microphone**，并继续等待真正的会议状态。对于仅创建 URL 的浏览器回退，OpenClaw 可能会点击 **Continue without microphone**，因为创建 URL 不需要实时音频路径。

### 会议创建失败

当配置了 OAuth 凭证时，`googlemeet create` 会首先使用 Google Meet API `spaces.create` 端点。没有 OAuth 凭证时，它会回退到固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，或者存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持之后生成的。较旧的令牌可能缺少 `meetings.space.created` 作用域；请重新运行 `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 且 `chromeNode.node` 指向一个已连接的节点，该节点具有 `browser.proxy` 和 `googlemeet.chrome`。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 配置文件已登录 Google，并能够打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会复用现有的 `https://meet.google.com/new` 或 Google 账号提示标签页，而不是打开新标签页。如果智能体超时，请重试工具调用，而不要手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和 `manualActionMessage` 来指导操作人员。在该操作完成前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the meeting?”，请保持该标签页打开。OpenClaw 应通过浏览器自动化点击 **Use microphone**，或者在仅创建的回退路径中点击 **Continue without microphone**，然后继续等待生成的 Meet URL。如果它做不到，错误应提及 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体加入了，但不说话

检查 `realtime` 路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 进行收听/回话。`mode: "transcribe"` 按设计不会启动双向实时语音桥接。

还要验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- `BlackHole 2ch` 在 Chrome 主机上可见。
- `rec` 和 `play` 在 Chrome 主机上存在。
- Meet 的麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径进行路由。

`googlemeet doctor [session-id]` 会打印会话、节点、通话中状态、手动操作原因、实时提供商连接、`realtimeReady`、音频输入/输出活动、最近音频时间戳、字节计数以及浏览器 URL。当你需要原始 JSON 时，请使用 `googlemeet status [session-id]`。当你需要在不暴露令牌的前提下验证 Google Meet OAuth 刷新时，请使用 `googlemeet doctor --oauth`；当你还需要 Google Meet API 证明时，请加上 `--meeting` 或 `--create-space`。

如果智能体超时，而你能看到已有一个 Meet 标签页打开，请在不打开另一个标签页的情况下检查该标签页：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

对应的工具动作是 `recover_current_tab`。它会聚焦并检查配置好的 Chrome 节点上的现有 Meet 标签页。它不会打开新标签页，也不会创建新会话；它会报告当前阻塞项，例如登录、准入、权限或音频选择状态。CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行，并且 Chrome 节点必须已连接。

### Twilio 设置检查失败

当 `voice-call` 未被允许或未启用时，`twilio-voice-call-plugin` 会失败。请将其添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，并重新加载 Gateway 网关。

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

`voicecall smoke` 默认只做就绪性检查。若要对特定号码执行 dry-run：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明确希望发起真实的出站通知呼叫时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 呼叫开始了，但始终未进入会议

确认 Meet 事件公开了电话拨入详情。传入精确的拨入号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前导 `w` 或逗号。

## 说明

Google Meet 的官方媒体 API 偏向接收，因此要向 Meet 通话中发言，仍然需要一个参与者路径。该插件保持这一边界清晰可见：Chrome 负责浏览器参与和本地音频路由；Twilio 负责电话拨入参与。

Chrome `realtime` 模式需要以下之一：

- `chrome.audioInputCommand` 加 `chrome.audioOutputCommand`：OpenClaw 负责实时模型桥接，并在这些命令与所选实时语音提供商之间传递 8 kHz G.711 mu-law 音频。
- `chrome.audioBridgeCommand`：一个外部桥接命令负责整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请通过单独的虚拟设备或类似 Loopback 的虚拟设备图来路由 Meet 输出和 Meet 麦克风。单个共享的 BlackHole 设备可能会将其他参与者的声音回声回通话中。

`googlemeet speak` 会触发 Chrome 会话的活动实时音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委托的 Twilio 会话，`leave` 还会挂断底层语音呼叫。

## 相关内容

- [Voice call 插件](/zh-CN/plugins/voice-call)
- [Talk 模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

---
read_when:
    - 你想让一个 OpenClaw 智能体加入 Google Meet 通话
    - 你希望 OpenClaw 智能体创建一个新的 Google Meet 通话
    - 你正在将 Chrome、Chrome 节点或 Twilio 配置为 Google Meet 传输协议
summary: Google Meet 插件：通过 Chrome 或 Twilio 加入明确指定的 Meet URL，并使用实时语音默认设置
title: Google Meet 插件
x-i18n:
    generated_at: "2026-04-28T11:58:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 09779496b4aad3c854937dfeb69966372dd1a61eaafcf9da06831fa4bad8f34d
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw 的 Google Meet 参与者支持 —— 该插件按设计保持显式：

- 它只会加入显式的 `https://meet.google.com/...` URL。
- 它可以通过 Google Meet API 创建新的 Meet 空间，然后加入返回的 URL。
- `realtime` 语音是默认模式。
- 当需要更深入的推理或工具时，实时语音可以回调完整的 OpenClaw 智能体。
- 智能体通过 `mode` 选择加入行为：使用 `realtime` 进行实时聆听/回话，或使用 `transcribe` 加入/控制浏览器而不启用实时语音桥接。
- 凭证从个人 Google OAuth 或已登录的 Chrome 配置文件开始。
- 没有自动同意公告。
- 默认 Chrome 音频后端是 `BlackHole 2ch`。
- Chrome 可以在本地运行，也可以在已配对的节点主机上运行。
- Twilio 接受拨入号码，以及可选的 PIN 或 DTMF 序列。
- CLI 命令是 `googlemeet`；`meet` 保留给更广泛的智能体电话会议工作流。

## 快速开始

安装本地音频依赖并配置后端实时语音提供商。OpenAI 是默认值；Google Gemini Live 也可以配合 `realtime.provider: "google"` 使用：

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` 会安装 `BlackHole 2ch` 虚拟音频设备。Homebrew 的安装程序要求重启后，macOS 才会暴露该设备：

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

设置输出旨在供智能体读取，并且感知模式。它会报告 Chrome 配置文件、节点固定，以及对于实时 Chrome 加入，报告 BlackHole/SoX 音频桥接和延迟实时介绍检查。对于仅观察加入，使用 `--mode transcribe` 检查同一传输协议；该模式会跳过实时音频前置条件，因为它不会通过桥接聆听或发声：

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

配置 Twilio 委派后，设置还会报告 `voice-call` 插件和 Twilio 凭据是否就绪。在要求智能体加入之前，把任何 `ok: false` 检查视为所检查传输协议和模式的阻塞项。对脚本或机器可读输出使用 `openclaw googlemeet setup --json`。在智能体尝试之前，使用 `--transport chrome`、`--transport chrome-node` 或 `--transport twilio` 预检特定传输协议。

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

创建新会议并加入：

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

只创建 URL 而不加入：

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` 有两条路径：

- API 创建：在配置了 Google Meet OAuth 凭据时使用。这是最确定的路径，不依赖浏览器 UI 状态。
- 浏览器回退：在缺少 OAuth 凭据时使用。OpenClaw 使用固定的 Chrome 节点，打开 `https://meet.google.com/new`，等待 Google 重定向到真实的会议代码 URL，然后返回该 URL。此路径要求节点上的 OpenClaw Chrome 配置文件已经登录 Google。浏览器自动化会处理 Meet 自己的首次运行麦克风提示；该提示不会被视为 Google 登录失败。
  加入和创建流程还会尝试先复用现有 Meet 标签页，再打开新标签页。匹配会忽略 `authuser` 等无害的 URL 查询字符串，因此智能体重试时应聚焦已打开的会议，而不是创建第二个 Chrome 标签页。

命令/工具输出包含 `source` 字段（`api` 或 `browser`），因此智能体可以说明使用了哪条路径。`create` 默认会加入新会议，并返回 `joined: true` 以及加入会话。若只要生成 URL，请在 CLI 上使用 `create --no-join`，或向工具传递 `"join": false`。

或告诉智能体：“创建一个 Google Meet，使用实时语音加入，并把链接发给我。”智能体应调用 `google_meet`，设置 `action: "create"`，然后分享返回的 `meetingUri`。

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

对于仅观察/浏览器控制的加入，设置 `"mode": "transcribe"`。这不会启动双工实时模型桥接，不需要 BlackHole 或 SoX，也不会在会议中回话。此模式下的 Chrome 加入还会避免 OpenClaw 的麦克风/摄像头权限授予，并避免 Meet **使用麦克风** 路径。如果 Meet 显示音频选择插页，自动化会尝试无麦克风路径；否则会报告需要手动操作，而不是打开本地麦克风。

在实时会话期间，`google_meet` Status 包含浏览器和音频桥接健康信息，例如 `inCall`、`manualActionRequired`、`providerConnected`、`realtimeReady`、`audioInputActive`、`audioOutputActive`、最近输入/输出时间戳、字节计数器和桥接关闭状态。如果出现安全的 Meet 页面提示，浏览器自动化会在可行时处理它。登录、主持人准入以及浏览器/操作系统权限提示会作为需要手动操作报告，并附带原因和消息，供智能体转述。

本地 Chrome 会通过已登录的 OpenClaw 浏览器配置文件加入。实时模式需要 `BlackHole 2ch`，用于 OpenClaw 使用的麦克风/扬声器路径。为获得干净的双工音频，请使用独立的虚拟设备或 Loopback 风格的图；单个 BlackHole 设备足以进行首次冒烟测试，但可能产生回声。

### 本地 Gateway 网关 + Parallels Chrome

如果只是让 macOS VM 拥有 Chrome，你**不**需要在其中运行完整的 OpenClaw Gateway 网关或模型 API 密钥。请在本地运行 Gateway 网关和智能体，然后在 VM 中运行节点主机。在 VM 上启用一次内置插件，以便节点公布 Chrome 命令：

各组件运行位置：

- Gateway 网关主机：OpenClaw Gateway 网关、智能体工作区、模型/API 密钥、实时提供商，以及 Google Meet 插件配置。
- Parallels macOS VM：OpenClaw CLI/节点主机、Google Chrome、SoX、BlackHole 2ch，以及已登录 Google 的 Chrome 配置文件。
- VM 中不需要：Gateway 网关服务、智能体配置、OpenAI/GPT 密钥或模型提供商设置。

安装 VM 依赖：

```bash
brew install blackhole-2ch sox
```

安装 BlackHole 后重启 VM，让 macOS 暴露 `BlackHole 2ch`：

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

如果 `<gateway-host>` 是 LAN IP 且你未使用 TLS，节点会拒绝明文 WebSocket，除非你为该受信任的私有网络选择启用：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

将节点安装为 LaunchAgent 时使用相同环境变量：

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 是进程环境，不是 `openclaw.json` 设置。当安装命令中存在它时，`openclaw node install` 会将其存入 LaunchAgent 环境。

从 Gateway 网关主机批准节点：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

确认 Gateway 网关能看到该节点，并且它公布了 `googlemeet.chrome` 和浏览器能力/`browser.proxy`：

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

现在从 Gateway 网关主机正常加入：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

或要求智能体使用 `google_meet` 工具，并设置 `transport: "chrome-node"`。

如需执行一个单命令冒烟测试，用于创建或复用会话、说出已知短语并打印会话健康状态：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

在实时加入期间，OpenClaw 浏览器自动化会填写访客名称，点击加入/请求加入，并在 Meet 首次运行的“使用麦克风”选项出现时接受它。在仅观察加入或仅浏览器会议创建期间，如果可用，它会在不使用麦克风的情况下继续通过同一提示。如果浏览器配置文件未登录、Meet 正在等待主持人准入、Chrome 需要实时加入的麦克风/摄像头权限，或者 Meet 卡在自动化无法解决的提示上，加入/test-speech 结果会报告 `manualActionRequired: true`，并带有 `manualActionReason` 和 `manualActionMessage`。智能体应停止重试加入，报告该确切消息以及当前 `browserUrl`/`browserTitle`，并且只在手动浏览器操作完成后重试。

如果省略 `chromeNode.node`，OpenClaw 只会在恰好有一个已连接节点同时公布 `googlemeet.chrome` 和浏览器控制时自动选择。如果连接了多个具备能力的节点，请将 `chromeNode.node` 设置为节点 ID、显示名称或远程 IP。

常见故障检查：

- `Configured Google Meet node ... is not usable: offline`：固定的节点已被 Gateway 网关知晓但不可用。智能体应将该节点视为诊断状态，而不是可用的 Chrome 主机，并报告设置阻塞项，而不是回退到另一个传输协议，除非用户要求这样做。
- `No connected Google Meet-capable node`：在 VM 中启动 `openclaw node run`，批准配对，并确保已在 VM 中运行 `openclaw plugins enable google-meet` 和 `openclaw plugins enable browser`。同时确认 Gateway 网关主机允许这两个节点命令：`gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`。
- `BlackHole 2ch audio device not found`：在被检查的主机上安装 `blackhole-2ch`，并在使用本地 Chrome 音频前重启。
- `BlackHole 2ch audio device not found on the node`：在 VM 中安装 `blackhole-2ch` 并重启 VM。
- Chrome 打开但无法加入：在 VM 内的浏览器配置文件中登录，或保持设置 `chrome.guestName` 以进行访客加入。访客自动加入通过节点浏览器代理使用 OpenClaw 浏览器自动化；确保节点浏览器配置指向你想使用的配置文件，例如 `browser.defaultProfile: "user"` 或一个已命名的现有会话配置文件。
- 重复的 Meet 标签页：保持启用 `chrome.reuseExistingTab: true`。OpenClaw 会先激活同一 Meet URL 的现有标签页，再打开新标签页；浏览器会议创建也会先复用进行中的 `https://meet.google.com/new` 或 Google 账号提示标签页，再打开另一个。
- 无音频：在 Meet 中，将麦克风/扬声器路由到 OpenClaw 使用的虚拟音频设备路径；为干净的双工音频使用独立的虚拟设备或 Loopback 风格的路由。

## 安装说明

Chrome 实时默认配置使用两个外部工具：

- `sox`：命令行音频工具。该插件为默认的 24 kHz PCM16 音频桥接使用显式 CoreAudio
  设备命令。
- `blackhole-2ch`：macOS 虚拟音频驱动。它会创建 `BlackHole 2ch`
  音频设备，Chrome/Meet 可以通过它路由音频。

OpenClaw 不内置或再分发任一软件包。文档要求用户通过 Homebrew
将它们安装为主机依赖项。SoX 的许可证为
`LGPL-2.0-only AND GPL-2.0-only`；BlackHole 为 GPL-3.0。如果你构建的
安装程序或设备将 BlackHole 与 OpenClaw 捆绑在一起，请查看 BlackHole 的
上游许可条款，或从 Existential Audio 获取单独的许可证。

## 传输协议

### Chrome

Chrome 传输协议通过 OpenClaw 浏览器控制打开 Meet URL，并以已登录的 OpenClaw 浏览器
配置文件加入。在 macOS 上，插件会在启动前检查 `BlackHole 2ch`。如果已配置，它还会在
打开 Chrome 前运行音频桥接健康检查命令和启动命令。当 Chrome/音频位于 Gateway 网关主机上时使用
`chrome`；当 Chrome/音频位于配对节点（例如 Parallels macOS VM）上时使用
`chrome-node`。对于本地 Chrome，使用 `browser.defaultProfile` 选择
配置文件；`chrome.browserProfile` 会传递给 `chrome-node` 主机。

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

通过本地 OpenClaw 音频桥接路由 Chrome 麦克风和扬声器音频。如果未安装
`BlackHole 2ch`，加入会失败并返回设置错误，而不是在没有音频路径的情况下静默加入。

### Twilio

Twilio 传输协议是一个严格的拨号计划，委托给 Voice Call 插件。它
不会解析 Meet 页面来查找电话号码。

当 Chrome 参与不可用，或你需要电话拨入后备方案时使用此方式。
Google Meet 必须为会议公开电话拨入号码和 PIN；OpenClaw 不会从 Meet 页面发现这些信息。

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

通过环境或配置提供 Twilio 凭据。环境变量可避免将密钥写入
`openclaw.json`：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

启用 `voice-call` 后重启或重新加载 Gateway 网关；插件配置更改
不会出现在已运行的 Gateway 网关进程中，直到它重新加载。

然后验证：

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

当 Twilio 委托已接通时，`googlemeet setup` 会包含成功的
`twilio-voice-call-plugin` 和 `twilio-voice-call-credentials` 检查。

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

OAuth 对于创建 Meet 链接是可选的，因为 `googlemeet create` 可以回退到
浏览器自动化。当你需要官方 API 创建、空间解析或 Meet Media API 预检检查时，
请配置 OAuth。

Google Meet API 访问使用用户 OAuth：创建 Google Cloud OAuth 客户端，
请求所需范围，授权 Google 账号，然后将生成的刷新令牌存储在 Google Meet 插件
配置中，或提供 `OPENCLAW_GOOGLE_MEET_*` 环境变量。

OAuth 不会替代 Chrome 加入路径。Chrome 和 Chrome-node 传输协议
在你使用浏览器参与时，仍然通过已登录的 Chrome 配置文件、BlackHole/SoX
以及已连接节点加入。OAuth 仅用于官方 Google Meet API 路径：
创建会议空间、解析空间，并运行 Meet Media API 预检检查。

### 创建 Google 凭据

在 Google Cloud Console 中：

1. 创建或选择一个 Google Cloud 项目。
2. 为该项目启用 **Google Meet REST API**。
3. 配置 OAuth 同意屏幕。
   - 对 Google Workspace 组织而言，**Internal** 最简单。
   - **External** 适用于个人/测试设置；当应用处于 Testing 状态时，
     将每个会授权该应用的 Google 账号添加为测试用户。
4. 添加 OpenClaw 请求的范围：
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. 创建 OAuth 客户端 ID。
   - 应用类型：**Web application**。
   - 已获授权的重定向 URI：

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 复制客户端 ID 和客户端密钥。

Google Meet `spaces.create` 需要 `meetings.space.created`。
`meetings.space.readonly` 允许 OpenClaw 将 Meet URL/代码解析为空间。
`meetings.conference.media.readonly` 用于 Meet Media API 预检和媒体
工作；实际使用 Media API 时，Google 可能要求加入 Developer Preview。
如果你只需要基于浏览器的 Chrome 加入，请完全跳过 OAuth。

### 生成刷新令牌

配置 `oauth.clientId` 和可选的 `oauth.clientSecret`，或将它们作为
环境变量传入，然后运行：

```bash
openclaw googlemeet auth login --json
```

该命令会打印包含刷新令牌的 `oauth` 配置块。它使用 PKCE、
`http://localhost:8085/oauth2callback` 上的 localhost 回调，以及配合
`--manual` 的手动复制/粘贴流程。

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

当你不希望刷新令牌出现在配置中时，优先使用环境变量。
如果配置和值环境同时存在，插件会先解析配置，然后回退到环境变量。

OAuth 同意包含 Meet 空间创建、Meet 空间读取访问权限，以及 Meet
会议媒体读取访问权限。如果你是在会议创建支持存在之前完成身份验证，
请重新运行 `openclaw googlemeet auth login --json`，让刷新令牌具备
`meetings.space.created` 范围。

### 使用 doctor 验证 OAuth

当你需要快速、无密钥输出的健康检查时，运行 OAuth doctor：

```bash
openclaw googlemeet doctor --oauth --json
```

这不会加载 Chrome 运行时，也不需要已连接的 Chrome 节点。它会
检查 OAuth 配置是否存在，以及刷新令牌能否生成访问令牌。JSON 报告
只包含 `ok`、`configured`、`tokenSource`、`expiresAt` 和检查消息等
状态字段；它不会打印访问令牌、刷新令牌或客户端密钥。

常见结果：

| 检查                 | 含义                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | 存在 `oauth.clientId` 加 `oauth.refreshToken`，或存在缓存的访问令牌。                  |
| `oauth-token`        | 缓存的访问令牌仍然有效，或刷新令牌已生成新的访问令牌。                                 |
| `meet-spaces-get`    | 可选的 `--meeting` 检查解析了现有 Meet 空间。                                          |
| `meet-spaces-create` | 可选的 `--create-space` 检查创建了新的 Meet 空间。                                     |

如需同时证明 Google Meet API 已启用并且具备 `spaces.create` 范围，请运行
会产生副作用的创建检查：

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` 会创建一个一次性 Meet URL。当你需要确认
Google Cloud 项目已启用 Meet API，并且已授权账号具备
`meetings.space.created` 范围时使用它。

要证明对现有会议空间的读取访问权限：

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 和 `resolve-space` 会证明对已授权
Google 账号可访问的现有空间具有读取访问权限。这些检查返回 `403`
通常表示 Google Meet REST API 已禁用、已同意的刷新令牌缺少所需范围，
或该 Google 账号无法访问该 Meet 空间。刷新令牌错误表示需要重新运行
`openclaw googlemeet auth login --json` 并存储新的 `oauth` 块。

浏览器回退不需要 OAuth 凭据。在该模式下，Google 身份验证来自所选节点上
已登录的 Chrome 配置文件，而不是来自 OpenClaw 配置。

这些环境变量可作为回退值接受：

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

在 Meet 创建会议记录后列出会议工件和出勤记录：

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

使用 `--meeting` 时，`artifacts` 和 `attendance` 默认使用最新的会议记录。
当你需要该会议的每条保留记录时，传入 `--all-conference-records`。

日历查找可以先从 Google Calendar 解析会议 URL，再读取 Meet 工件：

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` 会在今天的 `primary` 日历中搜索带有 Google Meet 链接的日历事件。使用 `--event <query>` 搜索匹配的事件文本，使用 `--calendar <id>` 指定非主日历。日历查询需要重新进行 OAuth 登录，并包含日历事件只读作用域。
`calendar-events` 会预览匹配的 Meet 事件，并标记 `latest`、`artifacts`、`attendance` 或 `export` 将选择的事件。

如果你已经知道会议记录 ID，可以直接指定它：

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

写入可读报告：

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

`artifacts` 会返回会议记录元数据，以及 Google 为该会议公开的参与者、录制、转写、结构化转写条目和智能笔记资源元数据。使用 `--no-transcript-entries` 可为大型会议跳过条目查询。`attendance` 会将参与者展开为参与者会话行，包含首次/最后出现时间、总会话时长、迟到/提前离开标记，并按已登录用户或显示名称合并重复的参与者资源。传入 `--no-merge-duplicates` 可保留原始参与者资源并保持分离，传入 `--late-after-minutes` 可调整迟到检测，传入 `--early-before-minutes` 可调整提前离开检测。

`export` 会写入一个文件夹，其中包含 `summary.md`、`attendance.csv`、`transcript.md`、`artifacts.json`、`attendance.json` 和 `manifest.json`。`manifest.json` 会记录所选输入、导出选项、会议记录、输出文件、计数、令牌来源、使用过的日历事件，以及任何部分检索警告。传入 `--zip` 还会在文件夹旁写入一个可移植归档。传入 `--include-doc-bodies` 可通过 Google Drive `files.export` 导出关联的转写和智能笔记 Google Docs 文本；这需要重新进行 OAuth 登录，并包含 Drive Meet 只读作用域。不使用 `--include-doc-bodies` 时，导出只包含 Meet 元数据和结构化转写条目。如果 Google 返回部分工件失败，例如智能笔记列表、转写条目或 Drive 文档正文错误，摘要和清单会保留警告，而不是让整个导出失败。
使用 `--dry-run` 可获取相同的工件/出勤数据并打印清单 JSON，而不创建文件夹或 ZIP。这在写入大型导出之前很有用，或者当智能体只需要计数、所选记录和警告时也很有用。

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

针对真实保留会议运行受保护的实时冒烟测试：

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

实时冒烟测试环境：

- `OPENCLAW_LIVE_TEST=1` 启用受保护的实时测试。
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` 指向保留的 Meet URL、代码或 `spaces/{id}`。
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 或 `GOOGLE_MEET_CLIENT_ID` 提供 OAuth 客户端 ID。
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 或 `GOOGLE_MEET_REFRESH_TOKEN` 提供刷新令牌。
- 可选：`OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`、`OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 和 `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 使用不带 `OPENCLAW_` 前缀的相同回退名称。

基础工件/出勤实时冒烟测试需要 `https://www.googleapis.com/auth/meetings.space.readonly` 和 `https://www.googleapis.com/auth/meetings.conference.media.readonly`。日历查询需要 `https://www.googleapis.com/auth/calendar.events.readonly`。Drive 文档正文导出需要 `https://www.googleapis.com/auth/drive.meet.readonly`。

创建新的 Meet 空间：

```bash
openclaw googlemeet create
```

该命令会打印新的 `meeting uri`、来源和加入会话。使用 OAuth 凭据时，它会使用官方 Google Meet API。没有 OAuth 凭据时，它会使用固定 Chrome 节点的已登录浏览器配置文件作为回退。智能体可以使用 `google_meet` 工具并指定 `action: "create"`，在一步中创建并加入。对于仅创建 URL，传入 `"join": false`。

来自浏览器回退的 JSON 输出示例：

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

如果浏览器回退在能够创建 URL 之前遇到 Google 登录或 Meet 权限阻塞，Gateway 网关方法会返回失败响应，`google_meet` 工具会返回结构化详细信息，而不是普通字符串：

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

来自 API 创建的 JSON 输出示例：

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

创建 Meet 默认会加入会议。Chrome 或 Chrome 节点传输仍需要已登录的 Google Chrome 配置文件才能通过浏览器加入。如果配置文件已退出登录，OpenClaw 会报告 `manualActionRequired: true` 或浏览器回退错误，并要求操作员完成 Google 登录后再重试。

只有在确认你的 Cloud 项目、OAuth 主体和会议参与者已加入 Google Workspace Developer Preview Program 以使用 Meet 媒体 API 后，才设置 `preview.enrollmentAcknowledged: true`。

## 配置

通用 Chrome 实时路径只需要启用插件、BlackHole、SoX 和后端实时语音提供商密钥。OpenAI 是默认值；设置 `realtime.provider: "google"` 可使用 Google Gemini Live：

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
- `chromeNode.node`：`chrome-node` 的可选节点 ID/名称/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`：在未登录的 Meet 访客屏幕上使用的名称
- `chrome.autoJoin: true`：在 `chrome-node` 上通过 OpenClaw 浏览器自动化尽力填写访客名称并点击立即加入
- `chrome.reuseExistingTab: true`：激活现有 Meet 标签页，而不是打开重复标签页
- `chrome.waitForInCallMs: 20000`：在触发实时介绍之前，等待 Meet 标签页报告已在通话中
- `chrome.audioFormat: "pcm16-24khz"`：命令对音频格式。仅对仍输出电话音频的旧版/自定义命令对使用 `"g711-ulaw-8khz"`。
- `chrome.audioInputCommand`：从 CoreAudio `BlackHole 2ch` 读取并以 `chrome.audioFormat` 写入音频的 SoX 命令
- `chrome.audioOutputCommand`：以 `chrome.audioFormat` 读取音频并写入 CoreAudio `BlackHole 2ch` 的 SoX 命令
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`：简短的语音回复，并使用 `openclaw_agent_consult` 获取更深入的回答
- `realtime.introMessage`：实时桥接连接时的简短语音就绪检查；将其设置为 `""` 可静默加入
- `realtime.agentId`：用于 `openclaw_agent_consult` 的可选 OpenClaw 智能体 ID；默认为 `main`

可选覆盖：

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

`voiceCall.enabled` 默认为 `true`；使用 Twilio 传输时，它会将实际 PSTN 呼叫和 DTMF 委托给 Voice Call 插件。如果未启用 `voice-call`，Google Meet 仍可以验证并记录拨号计划，但无法发起 Twilio 呼叫。

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

当 Chrome 在 Gateway 网关主机上运行时，使用 `transport: "chrome"`。当 Chrome 在已配对节点（例如 Parallels VM）上运行时，使用 `transport: "chrome-node"`。两种情况下，实时模型和 `openclaw_agent_consult` 都在 Gateway 网关主机上运行，因此模型凭据会留在那里。

使用 `action: "status"` 列出活动会话或检查会话 ID。使用 `action: "speak"` 并传入 `sessionId` 和 `message`，可让实时智能体立即发言。使用 `action: "test_speech"` 可创建或复用会话、触发已知短语，并在 Chrome 主机能够报告时返回 `inCall` 健康状态。`test_speech` 始终强制 `mode: "realtime"`，如果要求它以 `mode: "transcribe"` 运行则会失败，因为仅观察会话有意不能发出语音。它的 `speechOutputVerified` 结果基于本次测试调用期间实时音频输出字节数是否增加，因此带有旧音频的复用会话不会算作新的成功语音检查。使用 `action: "leave"` 将会话标记为已结束。

`status` 会在可用时包含 Chrome 健康状态：

- `inCall`：Chrome 看起来位于 Meet 通话中
- `micMuted`：尽力判断的 Meet 麦克风状态
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`：浏览器配置文件需要手动登录、Meet 主持人准入、权限或浏览器控制修复后，语音才能工作
- `providerConnected` / `realtimeReady`：实时语音桥接状态
- `lastInputAt` / `lastOutputAt`：桥接最后一次接收或发送音频的时间

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 实时智能体咨询

Chrome 实时模式针对实时语音循环进行了优化。实时语音
提供商会听取会议音频，并通过已配置的音频桥接发声。
当实时模型需要更深入的推理、当前信息或普通
OpenClaw 工具时，它可以调用 `openclaw_agent_consult`。

咨询工具会在后台运行常规 OpenClaw 智能体，并附带最近的
会议转录上下文，然后向实时语音会话返回简洁的口语回答。语音模型随后可以把该回答说回会议中。
它使用与语音通话相同的共享实时咨询工具。

默认情况下，咨询会针对 `main` 智能体运行。当某条
Meet 通道需要咨询专用的 OpenClaw Agent 工作区、模型默认值、
工具策略、记忆和会话历史时，请设置 `realtime.agentId`。

`realtime.toolPolicy` 控制咨询运行：

- `safe-read-only`：暴露咨询工具，并将常规智能体限制为只能使用
  `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和
  `memory_get`。
- `owner`：暴露咨询工具，并允许常规智能体使用普通的
  智能体工具策略。
- `none`：不向实时语音模型暴露咨询工具。

咨询会话键按每个 Meet 会话划定范围，因此后续咨询调用可以在同一场会议期间复用先前的咨询上下文。

要在 Chrome 完全加入通话后强制执行一次语音就绪检查：

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

完整的加入并发声冒烟测试：

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 实时测试清单

在把会议交给无人值守的智能体之前，使用以下顺序：

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

预期的 Chrome-node 状态：

- `googlemeet setup` 全部为绿色。
- 当 Chrome-node 是默认传输协议或已固定某个节点时，
  `googlemeet setup` 包含 `chrome-node-connected`。
- `nodes status` 显示所选节点已连接。
- 所选节点同时通告 `googlemeet.chrome` 和 `browser.proxy`。
- Meet 标签页加入通话，并且 `test-speech` 返回带有
  `inCall: true` 的 Chrome 健康状态。

对于远程 Chrome 主机，例如 Parallels macOS VM，这是更新 Gateway 网关或 VM 后最短的安全检查：

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

这可以证明 Gateway 网关插件已加载，VM 节点已使用
当前令牌连接，并且在智能体打开真实会议标签页之前，Meet 音频桥接可用。

对于 Twilio 冒烟测试，请使用会公开电话拨入详情的会议：

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
- Gateway 网关重新加载后，`voicecall` 可在 CLI 中使用。
- 返回的会话包含 `transport: "twilio"` 和 `twilio.voiceCallId`。
- `googlemeet leave <sessionId>` 会挂断委派的语音通话。

## 故障排除

### 智能体看不到 Google Meet 工具

确认插件已在 Gateway 网关配置中启用，并重新加载 Gateway 网关：

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

如果你刚刚编辑了 `plugins.entries.google-meet`，请重启或重新加载 Gateway 网关。
正在运行的智能体只能看到当前 Gateway 网关
进程注册的插件工具。

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

节点必须已连接，并列出 `googlemeet.chrome` 以及 `browser.proxy`。
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

如果 `googlemeet setup` 的 `chrome-node-connected` 失败，或 Gateway 网关日志报告
`gateway token mismatch`，请使用当前 Gateway 网关
令牌重新安装或重启节点。对于 LAN Gateway 网关，这通常意味着：

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

运行 `googlemeet test-speech` 并检查返回的 Chrome 健康状态。如果它
报告 `manualActionRequired: true`，请向操作员显示 `manualActionMessage`，
并在浏览器操作完成之前停止重试。

常见的手动操作：

- 登录 Chrome 个人资料。
- 从 Meet 主持人账号准许访客加入。
- 当 Chrome 原生权限提示出现时，授予 Chrome 麦克风/摄像头权限。
- 关闭或修复卡住的 Meet 权限对话框。

不要仅仅因为 Meet 显示 “Do you want people to
hear you in the meeting?” 就报告“未登录”。这是 Meet 的音频选择中间页；OpenClaw
会在可用时通过浏览器自动化点击 **Use microphone**，并继续
等待真实会议状态。对于仅创建的浏览器回退，OpenClaw
可能会点击 **Continue without microphone**，因为创建 URL 不需要
实时音频路径。

### 会议创建失败

配置 OAuth 凭据时，`googlemeet create` 会首先使用 Google Meet API 的 `spaces.create` 端点。
没有 OAuth 凭据时，它会回退到已固定的 Chrome 节点浏览器。请确认：

- 对于 API 创建：已配置 `oauth.clientId` 和 `oauth.refreshToken`，
  或存在匹配的 `OPENCLAW_GOOGLE_MEET_*` 环境变量。
- 对于 API 创建：刷新令牌是在添加创建支持后签发的。
  较旧的令牌可能缺少 `meetings.space.created` 范围；请重新运行
  `openclaw googlemeet auth login --json` 并更新插件配置。
- 对于浏览器回退：`defaultTransport: "chrome-node"` 和
  `chromeNode.node` 指向已连接且具备 `browser.proxy` 和
  `googlemeet.chrome` 的节点。
- 对于浏览器回退：该节点上的 OpenClaw Chrome 个人资料已登录
  Google，并且可以打开 `https://meet.google.com/new`。
- 对于浏览器回退：重试会在打开新标签页之前复用现有的 `https://meet.google.com/new`
  或 Google 账号提示标签页。如果智能体超时，
  请重试工具调用，而不是手动再打开一个 Meet 标签页。
- 对于浏览器回退：如果工具返回 `manualActionRequired: true`，请使用
  返回的 `browser.nodeId`、`browser.targetId`、`browserUrl` 和
  `manualActionMessage` 指导操作员。在该
  操作完成之前，不要循环重试。
- 对于浏览器回退：如果 Meet 显示 “Do you want people to hear you in the
  meeting?”，请保持标签页打开。OpenClaw 应通过浏览器
  自动化点击 **Use microphone**，或对于仅创建回退点击 **Continue without microphone**，
  并继续等待生成的 Meet URL。如果无法做到，
  错误应提到 `meet-audio-choice-required`，而不是 `google-login-required`。

### 智能体加入但不说话

检查实时路径：

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

使用 `mode: "realtime"` 进行监听/回话。`mode: "transcribe"` 会有意
不启动双工实时语音桥接。`googlemeet test-speech`
总是检查实时路径，并报告在该次调用中是否观察到桥接输出字节。
如果 `speechOutputVerified` 为 false 且
`speechOutputTimedOut` 为 true，则实时提供商可能已接受
发话，但 OpenClaw 未看到新的输出字节到达 Chrome 音频
桥接。

还请验证：

- Gateway 网关主机上有可用的实时提供商密钥，例如
  `OPENAI_API_KEY` 或 `GEMINI_API_KEY`。
- `BlackHole 2ch` 在 Chrome 主机上可见。
- Chrome 主机上存在 `sox`。
- Meet 麦克风和扬声器已通过 OpenClaw 使用的虚拟音频路径路由。

`googlemeet doctor [session-id]` 会打印会话、节点、通话内状态、
手动操作原因、实时提供商连接、`realtimeReady`、音频
输入/输出活动、最后音频时间戳、字节计数器和浏览器 URL。
当你需要原始 JSON 时，请使用 `googlemeet status [session-id]`。当你需要验证 Google Meet OAuth 刷新且不暴露令牌时，请使用
`googlemeet doctor --oauth`；如果还需要 Google Meet API 证明，请添加 `--meeting` 或 `--create-space`。

如果智能体超时，并且你能看到已经打开的 Meet 标签页，请在不打开另一个标签页的情况下检查该标签页：

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

等效的工具操作是 `recover_current_tab`。它会为所选传输协议聚焦并检查
现有的 Meet 标签页。使用 `chrome` 时，它通过 Gateway 网关使用本地
浏览器控制；使用 `chrome-node` 时，它使用已配置的
Chrome 节点。它不会打开新标签页或创建新会话；它会报告
当前阻塞项，例如登录、准入、权限或音频选择状态。
CLI 命令会与已配置的 Gateway 网关通信，因此 Gateway 网关必须正在运行；
`chrome-node` 还要求 Chrome 节点已连接。

### Twilio 设置检查失败

当 `voice-call` 不被允许或未启用时，`twilio-voice-call-plugin` 会失败。
请将它添加到 `plugins.allow`，启用 `plugins.entries.voice-call`，并重新加载
Gateway 网关。

当 Twilio 后端缺少账号 SID、认证令牌或主叫号码时，`twilio-voice-call-credentials` 会失败。在 Gateway 网关主机上设置这些值：

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

然后重启或重新加载 Gateway 网关并运行：

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

默认情况下，`voicecall smoke` 仅检查就绪状态。要对特定号码执行试运行：

```bash
openclaw voicecall smoke --to "+15555550123"
```

只有在你明确想要拨打实时出站通知
电话时，才添加 `--yes`：

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 通话开始但从未进入会议

确认 Meet 事件公开了电话拨入详情。传入准确的拨入
号码和 PIN，或自定义 DTMF 序列：

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

如果提供商在输入 PIN 前需要暂停，请在 `--dtmf-sequence` 中使用前置的 `w` 或逗号。

## 备注

Google Meet 的官方媒体 API 偏向接收，因此要在 Meet
通话中发言仍然需要参与者路径。此插件让该边界保持可见：
Chrome 处理浏览器参与和本地音频路由；Twilio 处理
电话拨入参与。

Chrome 实时模式需要 `BlackHole 2ch`，并且还需要以下之一：

- `chrome.audioInputCommand` 加上 `chrome.audioOutputCommand`：OpenClaw 拥有实时模型桥接，并在这些命令与所选实时语音提供商之间以 `chrome.audioFormat` 传送音频。默认 Chrome 路径是 24 kHz PCM16；8 kHz G.711 mu-law 仍可用于旧版命令对。
- `chrome.audioBridgeCommand`：外部桥接命令拥有整个本地音频路径，并且必须在启动或验证其守护进程后退出。

为了获得干净的双工音频，请通过独立的虚拟设备或 Loopback 风格的虚拟设备图来路由 Meet 输出和 Meet 麦克风。单个共享的 BlackHole 设备可能会把其他参与者的声音回送到通话中。

`googlemeet speak` 会为 Chrome 会话触发当前活动的实时音频桥接。`googlemeet leave` 会停止该桥接。对于通过 Voice Call 插件委托的 Twilio 会话，`leave` 还会挂断底层语音通话。

## 相关

- [Voice Call 插件](/zh-CN/plugins/voice-call)
- [对话模式](/zh-CN/nodes/talk)
- [构建插件](/zh-CN/plugins/building-plugins)

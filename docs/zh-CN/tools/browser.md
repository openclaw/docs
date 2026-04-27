---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 排查 openclaw 为什么会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置和生命周期
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-27T07:13:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e576b013e49917b6d5b118c22d7b91a65e1f1997dc86eb51881ed30806dafe9
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个由**专用 Chrome/Brave/Edge/Chromium 配置文件**组成的环境，并由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地
控制服务进行管理（仅限 loopback）。

新手视角：

- 可以把它理解为一个**单独的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 连接到你真实、已登录的 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖动/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，当浏览器
  插件启用时，它会教智能体使用 snapshot、
  stable-tab、stale-ref 和 manual-blocker 恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的表面，用于
智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果根本没有 `openclaw browser`，或者智能体提示浏览器工具
不可用，请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它即可用另一个注册相同 `browser` 工具名称的插件来替换它：

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

默认设置需要同时启用 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。如果只禁用插件，会一次性移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保持不变，以供替代方案使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 智能体指引

工具配置说明：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果智能体或某个
派生的子智能体需要使用浏览器自动化，请在 profile
阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

对于单个智能体，请使用 `agents.list[].tools.alsoAllow: ["browser"]`。
仅设置 `tools.subagents.tools.allow: ["browser"]` 还不够，因为子智能体
策略会在 profile 过滤之后才应用。

浏览器插件提供两层智能体指引：

- `browser` 工具描述携带始终启用的精简契约：选择
  正确的配置文件，在同一标签页上保留引用，使用 `tabId`/标签进行标签页
  定位，并在多步骤工作时加载浏览器 skill。
- 内置的 `browser-automation` skill 携带更长的操作循环：
  先检查状态/标签页，给任务标签页加标签，操作前先做快照，在 UI 变化后重新快照，
  过期引用恢复一次，并将登录/2FA/captcha 或
  摄像头/麦克风阻塞报告为需要人工操作，而不是猜测。

当插件启用时，由插件内置的 Skills 会列在智能体的可用 Skills 中。
完整的 skill 说明按需加载，因此日常轮次不会承担全部 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 未知，`browser.request` 缺失，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中未包含 `browser`。请添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 不能替代允许列表成员资格——允许列表控制插件加载，而工具策略只会在加载后运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管、隔离的浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于连接你**真实、已登录的 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户
  正在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想指定某种浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在信任私有网络访问时启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    localLaunchTimeoutMs: 15000, // 本地受管 Chrome 发现超时（毫秒）
    localCdpReadyTimeoutMs: 8000, // 本地受管启动后 CDP 就绪超时（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器 act 超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认：true
      idleMinutes: 120, // 设为 0 以禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 以禁用每会话上限
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="端口和可达性">

- 控制服务绑定到 loopback，端口从 `gateway.port` 派生（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会使同一族中的派生端口一起偏移。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；只有远程 CDP 才需要设置这些值。未设置时，`cdpUrl` 默认使用受管本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性
  检查，以及打开标签页的 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于
  它们的 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的受管 Chrome
  进程暴露其 CDP HTTP 端点的时间预算。`localCdpReadyTimeoutMs` 是
  进程被发现后，CDP websocket 就绪的后续时间预算。
  在 Raspberry Pi、低配 VPS 或较旧硬件上，如 Chromium
  启动较慢，请提高这些值。数值必须是正整数，且不超过 `120000` 毫秒；无效
  配置值会被拒绝。
- `actionTimeoutMs` 是浏览器 `act` 请求的默认时间预算，当调用方未传递 `timeoutMs` 时使用。客户端传输层会增加一个小的宽限窗口，以便长时间等待可以完成，而不是在 HTTP 边界处超时。
- `tabCleanup` 是对主智能体浏览器会话所打开标签页的尽力清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们显式跟踪的标签页；主会话则会保留活动标签页以供复用，然后在后台关闭空闲或超额的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页会在导航前经过 SSRF 防护，并在最终 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动为 OpenClaw 管理的浏览器设置代理。默认情况下，受管 Chrome 直接启动，因此提供商代理设置不会削弱浏览器 SSRF 检查。
- 如需为受管浏览器本身设置代理，请通过 `browser.extraArgs` 传入显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非你有意启用私有网络浏览器访问，否则严格 SSRF 模式会阻止显式浏览器代理路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当你明确信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在浏览器已运行时附加。
- `headless` 可以全局设置，也可以按本地受管配置文件设置。按配置文件设置的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持 headless，而另一个仍然可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会请求对本地受管配置文件进行一次性 headless 启动，而不会改写 `browser.headless` 或配置文件设置。existing-session、attach-only 和远程 CDP 配置文件会拒绝此覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，如果环境、配置文件或全局
  配置都未显式选择有界面模式，则本地受管配置文件会自动默认使用 headless。`openclaw browser status --json`
  会将 `headlessSource` 报告为 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会为当前进程强制本地受管启动使用 headless。`OPENCLAW_BROWSER_HEADLESS=0` 会为普通启动强制使用有界面模式，并在 Linux 主机没有显示服务器时返回可执行的错误；显式的 `start --headless` 请求在该次启动中仍然优先。
- `executablePath` 可以全局设置，也可以按本地受管配置文件设置。按配置文件设置的值会覆盖 `browser.executablePath`，因此不同的受管配置文件可以启动不同的 Chromium 系浏览器。这两种形式都接受 `~` 作为你的操作系统主目录。
- `color`（顶层和按配置文件）会为浏览器 UI 着色，以便你看到哪个配置文件处于活动状态。
- 默认配置文件是 `openclaw`（受管独立模式）。使用 `defaultProfile: "user"` 可选择加入已登录用户浏览器。
- 自动检测顺序：如果系统默认浏览器是 Chromium 系，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序检测。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该 driver 设置 `cdpUrl`。
- 当某个 existing-session 配置文件需要附加到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。该路径也接受 `~` 作为你的操作系统主目录。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他基于 Chromium 的浏览器

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖
自动检测。顶层和按配置文件的 `executablePath` 值都接受 `~`
作为你的操作系统主目录：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或者按平台在配置中设置：

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

按配置文件设置的 `executablePath` 仅影响 OpenClaw
启动的本地受管配置文件。`existing-session` 配置文件会附加到已在运行的浏览器，
而远程 CDP 配置文件则使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在安装浏览器的机器上运行节点主机；Gateway 网关将浏览器操作代理到该节点主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程的 Chromium 系浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于运行在 loopback 上的外部托管 CDP 服务（例如在 Docker 中发布到 `127.0.0.1` 的 Browserless），还应设置 `attachOnly: true`。没有 `attachOnly` 的 loopback CDP 会被视为本地 OpenClaw 受管浏览器配置文件。
- `headless` 仅影响 OpenClaw 启动的本地受管配置文件。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 也遵循相同的本地受管配置文件规则。对运行中的本地受管配置文件修改该值时，会将该配置文件标记为需要重启/协调，以便下次启动时使用新的二进制文件。

不同配置文件模式的停止行为不同：

- 本地受管配置文件：`openclaw browser stop` 会停止
  由 OpenClaw 启动的浏览器进程
- attach-only 和远程 CDP 配置文件：`openclaw browser stop` 会关闭活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖（视口、
  配色方案、区域设置、时区、离线模式及类似状态），即使
  没有由 OpenClaw 启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询参数令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时会保留这些认证信息。对于
令牌，优先使用环境变量或密钥管理器，而不是将它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在安装有浏览器的机器上运行**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需任何额外浏览器配置。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**公开其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空可保持旧版/默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有允许列表中的配置文件可被定位，持久化配置文件的创建/删除路由会在代理接口上被阻止。
- 如果你不想启用它，可将其禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 公开
CDP 连接 URL。OpenClaw 可以使用任一形式，但对于远程浏览器配置文件，
最简单的选项是使用 Browserless 连接文档中的直接 WebSocket URL。

示例：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

说明：

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless 令牌。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 提供给你的是 HTTPS 基础 URL，你可以将其转换为
  `wss://` 用于直接 CDP 连接，也可以保留 HTTPS URL 并让 OpenClaw
  发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 在 Docker 中自托管，而 OpenClaw 运行在宿主机上时，请将
Browserless 视为外部托管的 CDP 服务：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl` 中的地址必须能从
OpenClaw 进程访问。Browserless 还必须公布一个与之匹配的可达端点；
请将 Browserless `EXTERNAL` 设置为同一个 OpenClaw 可访问的公共 WebSocket 基址，例如
`ws://127.0.0.1:3000`、`ws://browserless:3000` 或稳定的私有 Docker
网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向
OpenClaw 无法访问的地址，那么 CDP HTTP 看起来可能是正常的，但 WebSocket
附加仍然会失败。

对于 loopback 上的 Browserless 配置文件，不要让 `attachOnly` 保持未设置。没有
`attachOnly` 时，OpenClaw 会将该 loopback 端口视为本地受管浏览器
配置文件，并可能报告该端口正在使用但不属于 OpenClaw。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 调用 `/json/version` 以发现 WebSocket 调试器 URL，然后
  建立连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，其中路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。
  OpenClaw 通过 WebSocket 握手直接连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将协议规范化为 `http`/`https`）；
  如果发现返回了 `webSocketDebuggerUrl`，则使用它，否则 OpenClaw
  会回退为在裸根路径上直接进行 WebSocket 握手。如果公布的
  WebSocket 端点拒绝 CDP 握手，但配置的裸根路径
  可以接受，OpenClaw 也会回退到该根路径。这使得指向本地 Chrome 的裸 `ws://`
  仍可连接，因为 Chrome 只接受来自 `/json/version` 的特定按目标路径的 WebSocket
  升级；而托管
  提供商在其发现端点公布了不适合 Playwright CDP 的短期 URL 时，仍可以使用其根 WebSocket 端点。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个用于运行
headless 浏览器的云平台，内置 CAPTCHA 求解、隐身模式和住宅代理。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

说明：

- [注册](https://www.browserbase.com/sign-up)，然后从 [Overview 仪表板](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API 密钥。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话步骤。
- 免费层每月允许一个并发会话和一个浏览器小时。
  付费计划限制请参阅 [定价](https://www.browserbase.com/pricing)。
- 完整 API
  参考、SDK 指南和集成示例请参阅 [Browserbase 文档](https://docs.browserbase.com)。

## 安全性

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API **仅**使用共享密钥认证：
  gateway token Bearer 认证、`x-openclaw-password`，或使用
  已配置 gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份请求头和 `gateway.auth.mode: "trusted-proxy"`
  **不能**用于认证这个独立的 loopback 浏览器 API。
- 如果启用了浏览器控制但未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该令牌。
- 将 Gateway 网关和任何节点主机保持在私有网络中（Tailscale）；避免公开暴露。
- 将远程 CDP URL/令牌视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期令牌。
- 避免将长期令牌直接嵌入配置文件中。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 OpenClaw 管理**：具有独立用户数据目录 + CDP 端口的专用 Chromium 系浏览器实例
- **远程**：显式 CDP URL（运行在其他地方的 Chromium 系浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件内置用于 Chrome MCP existing-session 附加。
- 除 `user` 外，existing-session 配置文件需要显式启用；请使用 `--driver existing-session` 创建。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 连接现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的 Chromium 系浏览器配置文件。
这样会复用该浏览器配置文件中已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：使用 Chrome DevTools MCP 与你的浏览器会话协作](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，
可以创建自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是
  默认的本地 Google Chrome 配置文件。

对于 Brave、Edge、Chromium 或非默认 Chrome 配置文件，请使用 `userDataDir`。
`~` 会展开为你的操作系统主目录：

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

然后在对应的浏览器中：

1. 打开该浏览器的远程调试 inspect 页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见 inspect 页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时附加冒烟测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功时应看到的结果：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 从所选的实时标签页返回 refs

如果附加失败，请检查：

- 目标 Chromium 系浏览器版本是否为 `144+`
- 该浏览器的 inspect 页面中是否已启用远程调试
- 浏览器是否显示了附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它不能替你在浏览器端启用远程调试

智能体使用方式：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用自定义 existing-session 配置文件，请传入该显式配置文件名称。
- 仅在用户就在电脑前可以批准附加
  提示时，才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 这条路径比隔离的 `openclaw` 配置文件风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于此 driver，OpenClaw 不会启动浏览器；它只会附加。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被透传以定位该用户数据目录。
- Existing-session 可以附加到所选主机上，或通过已连接的
  浏览器节点附加。如果 Chrome 位于其他地方且没有连接任何浏览器节点，请改用
  远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的
`npx chrome-devtools-mcp@latest` 流程不符合你的需求时（离线主机、
固定版本、内置二进制文件），可以按配置文件覆盖启动的 Chrome DevTools MCP 服务器：

| 字段 | 作用 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要启动的可执行文件，用于替代 `npx`。按原样解析；绝对路径会被保留。 |
| `mcpArgs` | 原样传递给 `mcpCommand` 的参数数组。会替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。 |

当在 existing-session 配置文件上设置 `cdpUrl` 时，OpenClaw 会跳过
`--autoConnect`，并自动将该端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志和 `userDataDir` 不能同时组合使用：当设置了 `cdpUrl` 时，
`userDataDir` 会在 Chrome MCP 启动时被忽略，因为 Chrome MCP 会附加到
端点背后正在运行的浏览器，而不是打开一个配置文件
目录。

<Accordion title="Existing-session 功能限制">

与受管的 `openclaw` 配置文件相比，existing-session driver 的限制更多：

- **截图** — 支持整页截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支持 CSS 选择器）。`click-coords` 会点击可见视口坐标，不需要 snapshot ref。`click` 仅支持鼠标左键。`type` 不支持 `slowly=true`；请改用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用单独设置超时。`select` 只接受单个值。
- **等待 / 上传 / 对话框** — `wait --url` 支持精确匹配、子串匹配和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次只能上传一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管模式功能** — 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **可预测的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后是
  稳定的 `tabId` 句柄，例如 `t1`、可选标签以及原始 `targetId`。
  智能体应复用 `suggestedTargetId`；原始 id 仍保留供
  调试和兼容性使用。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用项：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖。

平台说明：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、
  `/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下常见的 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见安装位置。

## 控制 API（可选）

用于脚本和调试时，Gateway 网关会暴露一个小型的**仅限 loopback 的 HTTP
控制 API**，以及与之匹配的 `openclaw browser` CLI（快照、refs、wait
增强功能、JSON 输出、调试工作流）。完整参考请参阅
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特有问题（尤其是 snap Chromium），请参阅
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参阅
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的失败，它们指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`，当
    配置了 loopback 外部 CDP 服务却未设置 `attachOnly: true` 时
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍可用时，`open`、`navigate`、snapshot 或标签页打开流程因浏览器/网络策略错误而失败

使用以下最小序列来区分这两类问题：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 失败并显示 `not reachable after start`，先排查 CDP 就绪问题。
- 如果 `start` 成功但 `tabs` 失败，说明控制平面仍然不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，说明浏览器控制平面已启动，失败点在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基础受管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个默认拒绝的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管配置文件，CDP 健康检查会有意跳过对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全指引：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用精确的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是宽泛的私有网络访问。
- 仅在明确受信任且已审查、并且确实需要私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制方式

智能体获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

其映射方式如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot `ref` ID 来点击/输入/拖动/选择。
- `browser screenshot` 捕获像素（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪状态。
- `browser` 接受：
  - `profile` 用于选择命名的浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果连接了具备浏览器能力的节点，除非你固定使用 `target="host"` 或 `target="node"`，否则该工具可能会自动路由到该节点。

这让智能体保持可预测，并避免使用脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) — 浏览器控制的风险与加固

---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置和生命周期管理
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T18:12:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。
它与你的个人浏览器相互隔离，并通过 Gateway 网关内部的一个小型本地控制服务进行管理
（仅限 loopback）。

面向初学者的理解方式：

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一个安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的、已登录的 Chrome 会话。

## 你将获得的内容

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，当启用浏览器插件时，它会教智能体使用快照、
  稳定标签页、过期引用和手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的界面，
用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 命令完全不存在，或者智能体提示浏览器工具不可用，
请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。若要用另一个注册了相同 `browser` 工具名称的插件替换它，请将其禁用：

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

默认情况下，需要同时满足 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。仅禁用插件会一次性移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保持不变，以供替代方案使用。

浏览器配置变更需要重启 Gateway 网关，以便插件重新注册其服务。

## 智能体指引

工具配置文件说明：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果智能体或某个
派生子智能体需要使用浏览器自动化，请在配置文件阶段添加 browser：

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
策略是在配置文件过滤之后才应用的。

浏览器插件内置了两个层级的智能体指引：

- `browser` 工具说明携带了精简的常驻契约：选择正确的配置文件，
  在同一标签页上保持引用，使用 `tabId`/标签 来定位标签页，并在进行多步骤工作时加载浏览器 Skills。
- 内置的 `browser-automation` Skills 则承载了更完整的操作循环：
  先检查状态/标签页，为任务标签页加标签，在操作前创建快照，
  在 UI 变化后重新快照，遇到过期引用时恢复一次，并将登录/2FA/captcha 或
  摄像头/麦克风阻塞报告为需要手动操作，而不是猜测处理。

当插件启用时，插件内置 Skills 会出现在智能体的可用 Skills 列表中。完整的 Skills 说明会按需加载，因此日常轮次不会承担完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 无法识别，`browser.request` 缺失，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。请将其加入：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代允许列表成员资格——允许列表控制插件是否加载，而工具策略只有在加载之后才会运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于连接你**真实的、已登录的 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，
  优先使用 `profile="user"`。
- 当你希望指定某种浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管理模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
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

- 控制服务绑定到 loopback 上，其端口基于 `gateway.port` 派生而来（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会使同一组中的派生端口一起变化。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅在远程 CDP 场景中才需要设置这些值。未设置时，`cdpUrl` 默认为受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性检查
  以及标签页打开 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于
  它们的 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的受管理 Chrome 进程暴露其 CDP HTTP 端点的时间预算。`localCdpReadyTimeoutMs` 是在进程被发现之后，用于等待 CDP websocket 就绪的后续时间预算。
  在 Raspberry Pi、低配 VPS 或较旧硬件上，如果 Chromium
  启动较慢，请调高这些值。这些值的上限为 120000 ms。
- `actionTimeoutMs` 是浏览器 `act` 请求的默认时间预算，当调用方未传入 `timeoutMs` 时会使用它。客户端传输层会增加一个小的宽限窗口，以便较长的等待能够完成，而不是在 HTTP 边界超时。
- `tabCleanup` 是针对主智能体浏览器会话中打开标签页的尽力清理机制。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们明确跟踪的标签页；主会话则会保留活动标签页以便复用，然后在后台关闭空闲或超出数量限制的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页会在导航前受到 SSRF 保护，并会在最终的 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动为 OpenClaw 管理的浏览器启用代理。受管理的 Chrome 默认直接启动，因此提供商代理设置不会削弱浏览器的 SSRF 检查。
- 若要为受管理的浏览器本身启用代理，请通过 `browser.extraArgs` 传入显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非你已明确启用私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在你明确相信私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在浏览器已经运行时附加。
- `headless` 可以在全局或每个本地受管理配置文件级别设置。每个配置文件的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个则保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会为本地受管理配置文件请求一次性无头启动，而不会改写 `browser.headless` 或配置文件配置。existing-session、attach-only 和远程 CDP 配置文件会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，当环境或配置文件/全局配置都未明确选择有界面模式时，本地受管理配置文件会自动默认使用无头模式。`openclaw browser status --json`
  会将 `headlessSource` 报告为 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会为当前进程强制本地受管理启动使用无头模式。`OPENCLAW_BROWSER_HEADLESS=0` 会为常规启动强制使用有界面模式，并在没有显示服务器的 Linux 主机上返回可操作的错误；显式的 `start --headless` 请求仍会在那一次启动中具有更高优先级。
- `executablePath` 可以在全局或每个本地受管理配置文件级别设置。每个配置文件的值会覆盖 `browser.executablePath`，因此不同的受管理配置文件可以启动不同的基于 Chromium 的浏览器。
- `color`（顶层和每个配置文件）会为浏览器 UI 着色，以便你看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（受管理的独立模式）。使用 `defaultProfile: "user"` 可选择加入已登录用户浏览器模式。
- 自动检测顺序：如果系统默认浏览器是基于 Chromium 的，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary 的顺序检测。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当某个 existing-session 配置文件需要附加到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖
自动检测。`~` 会展开为你的操作系统主目录：

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

按配置文件设置的 `executablePath` 仅影响 OpenClaw 启动的本地受管理配置文件。
`existing-session` 配置文件则会附加到一个已经运行中的浏览器，
而远程 CDP 配置文件会使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的机器上运行一个节点主机；Gateway 网关会将浏览器操作代理到该节点主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到一个远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于在 loopback 上运行的外部受管理 CDP 服务（例如发布到 `127.0.0.1` 的 Docker 中的 Browserless），还需要设置 `attachOnly: true`。如果 loopback CDP
  未设置 `attachOnly`，则会被视为一个由 OpenClaw 管理的本地浏览器配置文件。
- `headless` 仅影响 OpenClaw 启动的本地受管理配置文件。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 也遵循同样的本地受管理配置文件规则。在一个
  正在运行的本地受管理配置文件上更改它，会将该配置文件标记为需要重启/协调，
  以便下次启动时使用新的二进制文件。

不同配置文件模式下，停止行为也不同：

- 本地受管理配置文件：`openclaw browser stop` 会停止由
  OpenClaw 启动的浏览器进程
- attach-only 和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖项（视口、
  颜色方案、区域设置、时区、离线模式及类似状态），即使
  OpenClaw 并未启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询参数 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时都会保留这些认证信息。对于 token，优先使用环境变量或密钥管理器，
而不是将它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在有浏览器的机器上运行了一个**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需任何额外的浏览器配置。
这是远程网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。将其留空可保留旧版/默认行为：所有已配置的配置文件仍可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为一个最小权限边界：只有在允许列表中的配置文件才可以被作为目标，并且持久化配置文件的创建/删除路由会在代理表面被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 可以使用任意一种形式，但
对于远程浏览器配置文件，最简单的选项是使用 Browserless 连接文档中提供的直接 WebSocket URL。

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

- 请将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 给你的是一个 HTTPS 基础 URL，你可以将其转换为
  `wss://` 以建立直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw
  去发现 `/json/version`。

### 在同一主机上的 Browserless Docker

当 Browserless 以 Docker 自托管，且 OpenClaw 运行在宿主机上时，
应将 Browserless 视为一个外部受管理的 CDP 服务：

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

`browser.profiles.browserless.cdpUrl` 中的地址必须能够从
OpenClaw 进程访问到。Browserless 还必须通告一个匹配的可访问端点；
请将 Browserless `EXTERNAL` 设置为同一个面向 OpenClaw 的公共 WebSocket 基址，例如
`ws://127.0.0.1:3000`、`ws://browserless:3000` 或一个稳定的私有 Docker
网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向一个
OpenClaw 无法访问的地址，那么即使 CDP HTTP 看起来健康，WebSocket
附加仍然会失败。

对于 loopback Browserless 配置文件，不要让 `attachOnly` 保持未设置。若未设置
`attachOnly`，OpenClaw 会将该 loopback 端口视为本地受管理浏览器
配置文件，并可能报告该端口正在被使用，但并不归 OpenClaw 所有。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  进行连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，其路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。
  OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，且没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试进行 HTTP
  `/json/version` 发现（将协议标准化为 `http`/`https`）；
  如果发现过程返回了 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw
  会回退为在裸根路径上直接进行 WebSocket 握手。如果通告的
  WebSocket 端点拒绝 CDP 握手，但已配置的裸根路径
  可以接受，那么 OpenClaw 也会回退到该根路径。这使得一个指向本地 Chrome 的裸 `ws://`
  仍然可以连接，因为 Chrome 只接受来自 `/json/version` 中特定逐目标路径的 WebSocket
  升级；而托管提供商仍然可以在其发现
  端点通告一个不适合 Playwright CDP 的短生命周期 URL 时，使用它们的根 WebSocket 端点。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行
无头浏览器，内置 CAPTCHA 解决、隐身模式和住宅代理。

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

- [注册](https://www.browserbase.com/sign-up)，并从 [概览仪表板](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 请将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话步骤。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费计划限制请参见 [定价](https://www.browserbase.com/pricing)。
- 完整的 API
  参考、SDK 指南和集成示例，请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全性

核心要点：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对来进行。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥认证**：
  gateway token bearer auth、`x-openclaw-password`，或带有
  已配置 Gateway 网关密码的 HTTP Basic auth。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"` 
  **不能**用于认证这个独立的 loopback 浏览器 API。
- 如果启用了浏览器控制且未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 如果 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy`，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和任何节点主机保留在私有网络中（Tailscale）；避免对公网暴露。
- 请将远程 CDP URL/token 视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短生命周期 token。
- 避免将长生命周期 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 OpenClaw 管理**：一个专用的基于 Chromium 的浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **远程**：显式的 CDP URL（运行在其他位置的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件内置用于 Chrome MCP existing-session 附加。
- 除了 `user` 之外，existing-session 配置文件都需要显式启用；请使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 范围中分配。
- 删除配置文件会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方的
Chrome DevTools MCP 服务器附加到一个正在运行的基于 Chromium 的浏览器配置文件。这样可以复用该浏览器配置文件中
已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：在你的浏览器会话中使用 Chrome DevTools MCP](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用
不同的名称、颜色或浏览器数据目录，也可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，它会连接到
  默认的本地 Google Chrome 配置文件。

对于 Brave、Edge、Chromium 或非默认的 Chrome 配置文件，请使用 `userDataDir`：

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

1. 打开该浏览器用于远程调试的 inspect 页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见的 inspect 页面：

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
- `snapshot` 返回所选实时标签页中的 refs

如果附加不起作用，请检查：

- 目标的基于 Chromium 的浏览器版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器已显示附加同意提示，且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它无法
  替你启用浏览器端的远程调试

智能体使用方式：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用的是自定义 existing-session 配置文件，请传入该明确的配置文件名称。
- 只有当用户就在电脑前、可以批准附加
  提示时，才选择此模式。
- Gateway 网关或节点主机可以生成 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 这条路径比隔离的 `openclaw` 配置文件风险更高，因为它可以
  在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会进行附加。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被一并传递，以定位到该用户数据目录。
- Existing-session 可以在所选主机上附加，也可以通过已连接的
  浏览器节点附加。如果 Chrome 位于其他地方，且没有浏览器节点已连接，请改用
  远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的
`npx chrome-devtools-mcp@latest` 流程不符合你的需求时（离线主机、
固定版本、供应商内置二进制），可按配置文件覆盖所生成的 Chrome DevTools MCP 服务器：

| 字段         | 作用 |
| ------------ | ---- |
| `mcpCommand` | 要生成的可执行文件，用于替代 `npx`。按原样解析；支持绝对路径。 |
| `mcpArgs`    | 原样传递给 `mcpCommand` 的参数数组。会替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。 |

当在 existing-session 配置文件上设置了 `cdpUrl` 时，OpenClaw 会跳过
`--autoConnect`，并自动将端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志与 `userDataDir` 不能同时使用：当设置了 `cdpUrl` 时，
在 Chrome MCP 启动中会忽略 `userDataDir`，因为 Chrome MCP 会附加到
端点背后的正在运行中的浏览器，而不是打开某个配置文件
目录。

<Accordion title="Existing-session 功能限制">

与受管理的 `openclaw` 配置文件相比，existing-session 驱动受到的限制更多：

- **截图** — 支持页面捕获和 `--ref` 元素捕获；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要使用快照 refs（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要快照 ref。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用单独设置超时。`select` 仅接受单个值。
- **等待 / 上传 / 对话框** — `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次只能上传一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管理模式功能** — 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管理浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流发生冲突。
- **可预测的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后返回
  稳定的 `tabId` 句柄，例如 `t1`、可选标签，以及原始 `targetId`。
  智能体应复用 `suggestedTargetId`；原始 id 仍然保留，用于
  调试和兼容性。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以通过 `browser.executablePath` 进行覆盖。

平台说明：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、
  `/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下常见的 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见安装位置。

## 控制 API（可选）

为了便于脚本编写和调试，Gateway 网关暴露了一个小型的**仅限 loopback 的 HTTP
控制 API**，以及一个对应的 `openclaw browser` CLI（快照、refs、等待
增强能力、JSON 输出、调试工作流）。完整参考请参阅
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

关于 Linux 特有的问题（尤其是 snap Chromium），请参阅
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

关于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参阅
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的失败，它们分别指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`，当一个
    loopback 外部 CDP 服务在未配置 `attachOnly: true` 的情况下被设置时
- 导航 SSRF 阻止：
  - `open`、`navigate`、snapshot 或标签页打开流程因浏览器/网络策略错误而失败，但 `start` 和 `tabs` 仍然可用

使用以下最小序列来区分这两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 以 `not reachable after start` 失败，先排查 CDP 就绪问题。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则说明浏览器控制平面已启动，失败出在导航策略或目标页面上。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基本的受管理浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个失败即关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管理配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制执行。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着之后的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用窄范围的主机例外，如 `hostnameAllowlist` 或 `allowedHostnames`，而不是广泛开放私有网络访问。
- 仅在私有网络浏览器访问是明确需要且经过审查的受信环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制工作方式

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 来执行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素内容（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪状态。
- `browser` 接受：
  - `profile`，用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果连接了具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持可预测性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) — 浏览器控制风险与加固

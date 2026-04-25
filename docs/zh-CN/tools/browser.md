---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T17:32:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a136bf08703bd108badcd01c02e961d76785f8d23d1c5035e5038963885796
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置档案**，由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地
控制服务进行管理（仅 loopback）。

初学者视角：

- 可以把它理解为一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置档案**不会**触碰你的个人浏览器配置档案。
- 智能体可以在一个安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置档案会通过 Chrome MCP 连接到你真实的已登录 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置档案（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，在浏览器
  插件启用时，教会智能体使用 snapshot、
  stable-tab、stale-ref 和 manual-blocker 恢复循环。
- 可选的多配置档案支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的表面，用于
智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到 “Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果完全没有 `openclaw browser`，或者智能体提示浏览器工具
不可用，请跳转到 [缺失的浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。如果你想用另一个注册相同 `browser` 工具名称的插件替换它，请禁用它：

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

默认值要求同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。仅禁用插件会将 `openclaw browser` CLI、`browser.request` 网关方法、智能体工具和控制服务作为一个整体移除；你的 `browser.*` 配置将保持不变，以便替换方案使用。

浏览器配置变更需要重启 Gateway 网关，以便插件重新注册其服务。

## 智能体指引

工具配置档案说明：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果智能体或某个
派生的子智能体需要使用浏览器自动化，请在配置档案阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

对于单个智能体，使用 `agents.list[].tools.alsoAllow: ["browser"]`。
仅设置 `tools.subagents.tools.allow: ["browser"]` 还不够，因为子智能体
策略是在配置档案过滤之后才应用的。

浏览器插件附带两层智能体指引：

- `browser` 工具说明包含精简的常驻契约：选择
  正确的配置档案、在同一标签页中保持 ref、一致使用 `tabId`/标签进行标签页
  定位，并在进行多步骤工作时加载浏览器 Skills。
- 内置的 `browser-automation` Skills 包含更长的操作循环：
  先检查 Status/标签页、为任务标签页加标签、操作前先做快照、
  UI 变化后重新快照、对 stale ref 进行一次恢复，并将登录/2FA/captcha 或
  摄像头/麦克风阻塞报告为手动操作，而不是猜测。

插件内置 Skills 会在插件启用时列在智能体的可用 Skills 中。完整的 Skills 指令按需加载，因此日常轮次不会承担全部 token 成本。

## 缺失的浏览器命令或工具

如果升级后 `openclaw browser` 变成未知命令、缺少 `browser.request`，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。把它加上：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代 allowlist 成员资格——allowlist 决定插件是否加载，而工具策略只会在加载之后运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置档案：`openclaw` 与 `user`

- `openclaw`：受管、隔离的浏览器（不需要扩展）。
- `user`：内置的 Chrome MCP 连接配置档案，用于连接你**真实的已登录 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，且用户
  在电脑前可以点击/批准任何连接提示时，优先使用 `profile="user"`。
- 当你想要某种特定浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认值：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在信任私有网络访问时选择启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置档案覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    localLaunchTimeoutMs: 15000, // 本地受管 Chrome 发现超时（毫秒）
    localCdpReadyTimeoutMs: 8000, // 本地受管启动后 CDP 就绪超时（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器 act 超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认值：true
      idleMinutes: 120, // 设为 0 可禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 可禁用按会话限制
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

<Accordion title="端口与可达性">

- 控制服务绑定到 loopback，端口由 `gateway.port` 派生（默认 `18791` = 网关 + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会同步移动这一组派生端口。
- 本地 `openclaw` 配置档案会自动分配 `cdpPort`/`cdpUrl`；仅远程 CDP 需要设置这些值。未设置时，`cdpUrl` 默认指向受管本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的受管 Chrome
  进程暴露其 CDP HTTP 端点的预算时间。`localCdpReadyTimeoutMs` 是
  在发现进程后等待 CDP websocket 就绪的后续预算时间。
  在 Raspberry Pi、低端 VPS 或较旧硬件上，如果 Chromium
  启动较慢，请提高这些值。上限为 120000 ms。
- `actionTimeoutMs` 是浏览器 `act` 请求的默认预算时间，当调用方未传 `timeoutMs` 时使用。客户端传输层会增加一个小的宽限窗口，这样长时间等待可以完成，而不会在 HTTP 边界处超时。
- `tabCleanup` 是对主智能体浏览器会话中打开的标签页进行尽力清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们显式跟踪的标签页；主会话会保留活动标签页以供复用，然后在后台关闭空闲或超量的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和 open-tab 在导航前会进行 SSRF 防护，并在导航完成后的最终 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/provider 的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动为 OpenClaw 管理的浏览器启用代理。受管 Chrome 默认直接启动，因此 provider 代理设置不会削弱浏览器 SSRF 检查。
- 若要为受管浏览器本身设置代理，请通过 `browser.extraArgs` 传递显式的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非你明确启用了私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当你有意信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍支持作为旧版别名。

</Accordion>

<Accordion title="配置档案行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在已有浏览器运行时连接。
- `headless` 可以全局设置，也可以按本地受管配置档案设置。按配置档案设置的值会覆盖 `browser.headless`，因此一个本地启动的配置档案可以保持无头，而另一个保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会请求一次性的
  无头启动，仅针对本地受管配置档案，且不会重写
  `browser.headless` 或配置档案配置。现有会话、仅连接和
  远程 CDP 配置档案会拒绝该覆盖，因为 OpenClaw 不会启动那些
  浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，本地受管配置档案
  会自动默认为无头模式，前提是环境或配置档案/全局
  配置都没有显式选择有头模式。`openclaw browser status --json`
  会将 `headlessSource` 报告为 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会为当前进程
  强制本地受管启动使用无头模式。`OPENCLAW_BROWSER_HEADLESS=0` 会为普通
  启动强制有头模式，并在没有显示服务器的 Linux 主机上返回可操作错误；
  但显式的 `start --headless` 请求仍会在那一次启动中优先生效。
- `executablePath` 可以全局设置，也可以按本地受管配置档案设置。按配置档案设置的值会覆盖 `browser.executablePath`，因此不同的受管配置档案可以启动不同的 Chromium 系浏览器。
- `color`（顶层和按配置档案）会给浏览器 UI 着色，这样你可以看到当前活动的是哪个配置档案。
- 默认配置档案是 `openclaw`（受管独立模式）。使用 `defaultProfile: "user"` 可选择默认接入已登录的用户浏览器。
- 自动检测顺序：系统默认浏览器（如果是 Chromium 系）；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为此驱动设置 `cdpUrl`。
- 当某个 existing-session 配置档案需要连接到非默认的 Chromium 用户配置档案（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖
自动检测。`~` 会展开为你的操作系统主目录：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或者在配置中按平台设置：

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

按配置档案设置的 `executablePath` 仅影响由 OpenClaw
启动的本地受管配置档案。`existing-session` 配置档案则会连接到一个已经在运行的浏览器，
而远程 CDP 配置档案使用的是 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关会启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的那台机器上运行一个节点主机；Gateway 网关会将浏览器操作代理到它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）来
  连接到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于运行在 loopback 上的外部受管 CDP 服务（例如在
  Docker 中运行并发布到 `127.0.0.1` 的 Browserless），还要设置 `attachOnly: true`。如果是 loopback CDP
  且未设置 `attachOnly`，会被视为一个由 OpenClaw 管理的本地浏览器配置档案。
- `headless` 仅影响由 OpenClaw 启动的本地受管配置档案。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 也遵循同样的本地受管配置档案规则。在一个
  正在运行的本地受管配置档案上更改它，会将该配置档案标记为需要重启/协调，以便
  下一次启动时使用新的二进制文件。

停止行为会因配置档案模式而异：

- 本地受管配置档案：`openclaw browser stop` 会停止
  由 OpenClaw 启动的浏览器进程
- 仅连接和远程 CDP 配置档案：`openclaw browser stop` 会关闭活动的
  控制会话，并释放 Playwright/CDP 模拟覆盖（视口、
  配色方案、区域设置、时区、离线模式以及类似状态），即使
  没有任何浏览器进程是由 OpenClaw 启动的

远程 CDP URL 可以包含认证信息：

- 查询参数令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
到 CDP WebSocket 时都会保留这些认证信息。对于令牌，优先使用
环境变量或密钥管理器，而不是将它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在有浏览器的那台机器上运行了一个**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需任何额外的浏览器配置。
这是远程网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置档案来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。将其留空即可保留旧版/默认行为：所有已配置的配置档案都可以通过代理访问，包括配置档案创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有在 allowlist 中的配置档案才能被定位，而且持久化配置档案的创建/删除路由会在代理表面被阻止。
- 如果你不想启用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，它通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 可以使用这两种形式，但
对于远程浏览器配置档案，最简单的选项是直接使用 Browserless 连接文档中的 WebSocket URL。

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
- 如果 Browserless 提供给你的是 HTTPS 基础 URL，你可以将它转换为
  `wss://` 来进行直接 CDP 连接，或者保留该 HTTPS URL，让 OpenClaw
  发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 在 Docker 中自托管，而 OpenClaw 运行在宿主机上时，
应将 Browserless 视为一个外部受管的 CDP 服务：

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
OpenClaw 进程访问到。Browserless 还必须通告一个匹配且可达的端点；
请将 Browserless 的 `EXTERNAL` 设置为同一个对 OpenClaw 可达的公共 WebSocket 基础地址，例如
`ws://127.0.0.1:3000`、`ws://browserless:3000` 或一个稳定的私有 Docker
网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向
一个 OpenClaw 无法访问的地址，CDP HTTP 看起来可能是健康的，但 WebSocket
连接仍然会失败。

对于 loopback Browserless 配置档案，不要让 `attachOnly` 保持未设置。没有
`attachOnly` 时，OpenClaw 会将这个 loopback 端口视为本地受管浏览器
配置档案，并可能报告该端口正在使用中，但并不归 OpenClaw 所有。

## 直接 WebSocket CDP provider

某些托管浏览器服务暴露的是一个**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  建立连接。没有 WebSocket 后备。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  之一。OpenClaw 会直接通过 WebSocket 握手建立连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将 scheme 规范化为 `http`/`https`）；
  如果发现返回了 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw
  会回退到裸根路径上的直接 WebSocket 握手。如果已通告的
  WebSocket 端点拒绝 CDP 握手，但配置的裸根路径
  接受它，OpenClaw 也会回退到该根路径。这样一来，一个指向本地 Chrome 的裸 `ws://`
  仍然可以建立连接，因为 Chrome 只接受在 `/json/version` 提供的特定按目标路径上的 WebSocket
  升级，而托管 provider 在其发现
  端点通告了一个不适合 Playwright CDP 的短期 URL 时，仍然可以使用其根 WebSocket 端点。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个用于运行
无头浏览器的云平台，内置 CAPTCHA 求解、隐身模式和住宅代理。

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
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整 API
  参考、SDK 指南和集成示例，请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全性

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关认证或节点配对流转。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥认证**：
  Gateway 网关令牌 bearer 认证、`x-openclaw-password`，或带有
  已配置网关密码的 HTTP Basic 认证。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"` **不会**
  为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制且未配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token`，并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该令牌。
- 请将 Gateway 网关和任何节点主机保留在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/令牌视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 在可能的情况下，优先使用加密端点（HTTPS 或 WSS）以及短期令牌。
- 避免将长期令牌直接嵌入配置文件中。

## 配置档案（多浏览器）

OpenClaw 支持多个具名配置档案（路由配置）。配置档案可以是：

- **openclaw 受管**：一个专用的基于 Chromium 的浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **remote**：一个显式的 CDP URL（运行在别处的基于 Chromium 的浏览器）
- **existing session**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置档案

默认值：

- 如果缺失，会自动创建 `openclaw` 配置档案。
- 内置 `user` 配置档案用于 Chrome MCP existing-session 连接。
- 除 `user` 之外，existing-session 配置档案需要显式启用；请使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 范围分配。
- 删除配置档案会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方的
Chrome DevTools MCP 服务器连接到一个正在运行的基于 Chromium 的浏览器配置档案。这样会复用该浏览器配置档案中
已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置档案：

- `user`

可选：如果你想要一个不同的
名称、颜色或浏览器数据目录，也可以创建自己的自定义 existing-session 配置档案。

默认行为：

- 内置的 `user` 配置档案使用 Chrome MCP 自动连接，它会定位到
  默认的本地 Google Chrome 配置档案。

对于 Brave、Edge、Chromium 或非默认 Chrome 配置档案，请使用 `userDataDir`：

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

1. 打开该浏览器的远程调试检查页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 连接时批准连接提示。

常见检查页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时连接冒烟测试：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功时的表现：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 返回所选活动标签页中的 ref

如果连接不起作用，请检查：

- 目标的基于 Chromium 的浏览器版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器已显示连接授权提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  对于默认自动连接配置档案，Chrome 是否已在本地安装，但它无法
  替你启用浏览器侧的远程调试

智能体使用：

- 当你需要用户的已登录浏览器状态时，使用 `profile="user"`。
- 如果你使用自定义 existing-session 配置档案，请传入那个显式配置档案名称。
- 仅当用户在电脑前能够批准连接
  提示时，才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置档案相比，这条路径风险更高，因为它可以
  在你的已登录浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会连接。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被传递进去以定位该用户数据目录。
- existing-session 可以连接到所选主机上的浏览器，或通过已连接的
  浏览器节点进行连接。如果 Chrome 位于别处且没有已连接的浏览器节点，请改用
  远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的
`npx chrome-devtools-mcp@latest` 流程不符合你的需要时（离线主机、
固定版本、内置二进制文件），你可以按配置档案覆盖启动的 Chrome DevTools MCP 服务器：

| 字段 | 作用 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要启动的可执行文件，用来替代 `npx`。按原样解析；绝对路径会被直接采用。 |
| `mcpArgs` | 原样传递给 `mcpCommand` 的参数数组。会替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。 |

当在 existing-session 配置档案上设置了 `cdpUrl` 时，OpenClaw 会跳过
`--autoConnect`，并自动将该端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志与 `userDataDir` 不能组合使用：当设置了 `cdpUrl` 时，
Chrome MCP 启动会忽略 `userDataDir`，因为 Chrome MCP 会连接到
该端点背后的正在运行的浏览器，而不是打开某个配置档案
目录。

<Accordion title="existing-session 功能限制">

与受管的 `openclaw` 配置档案相比，existing-session 驱动的限制更多：

- **截图** — 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** — `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot ref（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要 snapshot ref。`click` 仅支持左键。`type` 不支持 `slowly=true`；请改用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** — `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次只能上传一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管功能** — 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置档案。
- **专用端口**：避免使用 `9222`，以防与你的开发工作流发生冲突。
- **可预测的标签页控制**：`tabs` 会优先返回 `suggestedTargetId`，然后是
  稳定的 `tabId` 句柄（如 `t1`）、可选标签以及原始 `targetId`。
  智能体应复用 `suggestedTargetId`；原始 id 则保留用于
  调试和兼容性。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 进行覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、
  `/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下常见的 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见安装位置。

## 控制 API（可选）

对于脚本和调试，Gateway 网关暴露了一个小型的**仅 loopback HTTP
控制 API**，以及一个匹配的 `openclaw browser` CLI（快照、ref、等待
增强、JSON 输出、调试工作流）。完整参考见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特定问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的失败，它们指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面是健康的。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但某个页面导航目标被策略拒绝了。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`，当一个
    loopback 外部 CDP 服务在未设置 `attachOnly: true` 的情况下被配置时
- 导航 SSRF 阻止：
  - `open`、`navigate`、snapshot 或标签页打开流程因浏览器/网络策略错误而失败，而 `start` 和 `tabs` 仍然工作

使用这个最小序列来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 因 `not reachable after start` 失败，先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，控制平面仍然不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则说明浏览器控制平面已正常启动，失败发生在导航策略或目标页面上。
- 如果 `start`、`tabs` 和 `open` 都成功，则说明基础的受管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个默认拒绝的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管配置档案，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全指引：

- **不要**默认放宽浏览器 SSRF 策略。
- 优先使用精确的主机例外，如 `hostnameAllowlist` 或 `allowedHostnames`，而不是宽泛的私有网络访问。
- 仅在有意信任且经过审查、并且确实需要私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制如何工作

智能体获得**一个工具**来进行浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

它的映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot `ref` ID 来执行 click/type/drag/select。
- `browser screenshot` 捕获像素（整页、元素或带标签的 ref）。
- `browser doctor` 检查 Gateway 网关、插件、配置档案、浏览器和标签页就绪状态。
- `browser` 接受：
  - `profile` 用于选择具名浏览器配置档案（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果已连接一个支持浏览器的节点，工具可能会自动路由到它，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持可预测，并避免脆弱的选择器。

## 相关内容

- [Tools Overview](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [Security](/zh-CN/gateway/security) — 浏览器控制的风险与加固

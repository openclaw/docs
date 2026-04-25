---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成的浏览器控制服务 + 操作命令
title: 浏览器（OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T08:15:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8277b012479cad5f02dade2f0dd2ea77dffe1b1535934a0401f67e756065c3c
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由智能体控制。  
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地控制服务进行管理（仅限 loopback）。

初学者视角：

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 连接到你真实的、已登录的 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 可预测的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skills，用于在启用浏览器插件时教会智能体使用快照、稳定标签页、陈旧引用和手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主力浏览器。  
它是一个安全、隔离的界面，用于智能体自动化和验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启 Gateway 网关。

如果完全没有 `openclaw browser`，或者智能体提示浏览器工具不可用，请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。若要用另一个注册同名 `browser` 工具的插件替换它，请将其禁用：

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

默认行为需要同时满足 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。仅禁用插件会一次性移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保留，以供替代插件使用。

浏览器配置变更需要重启 Gateway 网关，以便插件重新注册其服务。

## 智能体指引

浏览器插件提供两个层级的智能体指引：

- `browser` 工具说明包含简洁的常驻约定：选择正确的配置文件、在同一标签页内保持引用一致、使用 `tabId`/标签来定位标签页，以及在执行多步骤任务时加载浏览器 Skills。
- 内置的 `browser-automation` Skills 包含更完整的操作循环：先检查状态/标签页，给任务标签页打标签，在操作前创建快照，在 UI 变更后重新创建快照，遇到陈旧引用时重试一次恢复，并将登录/2FA/captcha 或摄像头/麦克风阻塞报告为需要手动处理，而不是猜测。

启用插件后，插件内置的 Skills 会列在智能体可用的 Skills 中。完整的 Skills 指令按需加载，因此常规轮次无需承担全部 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 无法识别、缺少 `browser.request`，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。把它加上：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代出现在 allowlist 中——allowlist 决定插件是否加载，而工具策略只会在加载之后运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：托管的隔离浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 连接配置文件，用于连接你**真实的、已登录的 Chrome** 会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有的已登录会话很重要，且用户正坐在电脑前可以点击/批准任何连接提示时，优先使用 `profile="user"`。
- 当你想指定某种浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认值：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在信任私有网络访问时启用
      // allowPrivateNetwork: true, // 旧别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧的单配置文件覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器 act 超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认值：true
      idleMinutes: 120, // 设为 0 可禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 可禁用每个会话的标签页上限
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

- 控制服务绑定到 loopback，使用一个基于 `gateway.port` 派生出的端口（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会让同一组派生端口整体移动。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅在远程 CDP 时才需要设置这些值。未设置时，`cdpUrl` 默认使用托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。
- `actionTimeoutMs` 是浏览器 `act` 请求的默认时限，当调用方没有传入 `timeoutMs` 时使用。客户端传输层会额外增加一个小的缓冲窗口，这样长时间等待可以完成，而不是在 HTTP 边界超时。
- `tabCleanup` 是针对主智能体浏览器会话所打开标签页的尽力清理机制。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭其显式跟踪的标签页；主会话会保留活跃标签页以供复用，然后在后台关闭空闲或超额的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页在导航前会进行 SSRF 防护，并在之后对最终的 `http(s)` URL 做尽力复检。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 托管的浏览器。托管的 Chrome 默认直接启动，因此提供商代理设置不会削弱浏览器的 SSRF 检查。
- 若要代理托管浏览器本身，请通过 `browser.extraArgs` 传入显式的 Chrome 代理参数，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式的浏览器代理路由，除非你明确启用了私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在你有意信任私有网络浏览器访问时启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧别名受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在浏览器已经运行时进行连接。
- `headless` 可以在全局或每个本地托管配置文件中设置。每个配置文件的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个保持可见。
- `executablePath` 可以在全局或每个本地托管配置文件中设置。每个配置文件的值会覆盖 `browser.executablePath`，因此不同的托管配置文件可以启动不同的 Chromium 系浏览器。
- `color`（顶层和每个配置文件）会为浏览器 UI 着色，以便你看出当前激活的是哪个配置文件。
- 默认配置文件是 `openclaw`（托管的独立模式）。使用 `defaultProfile: "user"` 可改为默认使用已登录的用户浏览器。
- 自动检测顺序：系统默认浏览器（如果它是 Chromium 系）；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当某个 existing-session 配置文件需要连接到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他 Chromium 系浏览器）

如果你的**系统默认**浏览器是 Chromium 系（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可以覆盖自动检测。  
`~` 会展开为你的操作系统主目录：

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

每个配置文件的 `executablePath` 仅影响由 OpenClaw 启动的本地托管配置文件。`existing-session` 配置文件会连接到一个已在运行的浏览器，而远程 CDP 配置文件则使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关会启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行一个节点主机；Gateway 网关会将浏览器操作代理过去。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以连接到远程 Chromium 系浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- `headless` 仅影响由 OpenClaw 启动的本地托管配置文件。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 也遵循相同的本地托管配置文件规则。在运行中的本地托管配置文件上更改它，会将该配置文件标记为需要重启/协调，以便下次启动时使用新的二进制文件。

不同配置文件模式下，停止行为有所不同：

- 本地托管配置文件：`openclaw browser stop` 会停止由 OpenClaw 启动的浏览器进程
- 仅连接和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前控制会话，并释放 Playwright/CDP 仿真覆盖项（视口、配色方案、区域设置、时区、离线模式及类似状态），即使 OpenClaw 没有启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询参数 token（例如，`https://provider.example?token=<token>`）
- HTTP Basic 认证（例如，`https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接到 CDP WebSocket 时会保留认证信息。  
对于 token，优先使用环境变量或密钥管理器，而不是将其提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的那台机器上运行了一个**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，而无需任何额外的浏览器配置。  
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。将其留空即可保留旧版/默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有 allowlist 中的配置文件可以作为目标，并且持久化配置文件的创建/删除路由会在代理界面上被阻止。
- 如果你不想启用它，可以关闭：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 可以使用任一形式，但对于远程浏览器配置文件，最简单的选项是使用 Browserless 连接文档中的直接 WebSocket URL。

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

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（见其文档）。
- 如果 Browserless 提供给你的是 HTTPS 基础 URL，你可以将其转换为 `wss://` 用于直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw 去发现 `/json/version`。

## 直接 WebSocket CDP 提供商

有些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。  
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后进行连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或  
  `wss://...` 且路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`。  
  OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过 `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，且没有  
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP `/json/version` 发现（将 scheme 规范化为 `http`/`https`）；如果发现返回了 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw 会回退为在裸根路径上直接进行 WebSocket 握手。这使得指向本地 Chrome 的裸 `ws://` 仍可连接，因为 Chrome 只接受来自 `/json/version` 中特定目标路径的 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行无头浏览器，内置 CAPTCHA 解决、隐身模式和住宅代理。

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

- [注册](https://www.browserbase.com/sign-up)，然后从 [Overview dashboard](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此无需手动创建会话。
- 免费套餐每月允许一个并发会话和一个浏览器小时。  
  付费方案限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整的 API 参考、SDK 指南和集成示例，请参见 [Browserbase docs](https://docs.browserbase.com)。

## 安全

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关的认证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API **仅使用共享密钥认证**：gateway token bearer 认证、`x-openclaw-password`，或使用已配置 gateway 密码的 HTTP Basic 认证。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"` **不会**为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制且未配置共享密钥认证，OpenClaw 会在启动时自动生成 `gateway.auth.token`，并将其持久化到配置中。
- 如果 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy`，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和所有节点主机放在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/token 视为机密；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期 token 直接嵌入配置文件中。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **openclaw-managed**：一个专用的 Chromium 系浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **remote**：一个显式的 CDP URL（运行在其他地方的 Chromium 系浏览器）
- **existing session**：通过 Chrome DevTools MCP 自动连接你的现有 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件内置用于 Chrome MCP existing-session 连接。
- 除 `user` 之外，existing-session 配置文件需要显式启用；请使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除某个配置文件时，其本地数据目录会被移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器连接到一个正在运行的 Chromium 系浏览器配置文件。这样可以复用该浏览器配置文件中已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是默认的本地 Google Chrome 配置文件。

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
3. 保持浏览器运行，并在 OpenClaw 连接时批准连接提示。

常见的 inspect 页面：

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
- `tabs` 会列出你已经打开的浏览器标签页
- `snapshot` 会从所选中的实时标签页返回引用

如果连接不起作用，请检查：

- 目标 Chromium 系浏览器的版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器已显示连接授权提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它无法替你在浏览器端启用远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用的是自定义 existing-session 配置文件，请传入那个明确的配置文件名称。
- 仅当用户正坐在电脑前，可以批准连接提示时，才选择这种模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 这一路径比隔离的 `openclaw` 配置文件风险更高，因为它可以在你已登录的浏览器会话中执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会进行连接。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，它会一并传递，以便定位该用户数据目录。
- Existing-session 可以连接到所选主机上，或通过已连接的浏览器节点连接。如果 Chrome 位于别处且没有连接浏览器节点，请改用远程 CDP 或节点主机。

<Accordion title="Existing-session 功能限制">

与托管的 `openclaw` 配置文件相比，existing-session 驱动限制更多：

- **截图** —— 支持页面截图和 `--ref` 元素截图；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作** —— `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 ref（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要快照 ref。`click` 仅支持鼠标左键。`type` 不支持 `slowly=true`；请改用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持逐调用超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** —— `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅托管模式功能** —— 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **可预测的标签页控制**：`tabs` 会优先返回 `suggestedTargetId`，然后是稳定的 `tabId` 句柄（例如 `t1`）、可选标签以及原始 `targetId`。智能体应复用 `suggestedTargetId`；原始 id 仍保留用于调试和兼容性。

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
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下常见的 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见的安装位置。

## 控制 API（可选）

对于脚本编写和调试，Gateway 网关会暴露一个小型的**仅限 loopback 的 HTTP 控制 API**，以及与之对应的 `openclaw browser` CLI（快照、ref、等待增强功能、JSON 输出、调试工作流）。完整参考请参见 [浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特有问题（尤其是 snap Chromium），请参见  
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见  
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这两者是不同的失败类型，并且指向不同的代码路径。

- **CDP 启动或就绪失败**表示 OpenClaw 无法确认浏览器控制平面处于健康状态。
- **导航 SSRF 阻止**表示浏览器控制平面是健康的，但页面导航目标被策略拒绝了。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍然可用时，`open`、`navigate`、快照或打开标签页流程因浏览器/网络策略错误而失败

使用下面这组最小命令来区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何理解结果：

- 如果 `start` 因 `not reachable after start` 失败，先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍然不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面已启动，失败点在导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基础的托管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用一个故障关闭的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 托管配置文件，CDP 健康检查会有意跳过浏览器 SSRF 可达性强制，以便 OpenClaw 自身的本地控制平面正常工作。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- 默认情况下**不要**放宽浏览器 SSRF 策略。
- 优先使用精确的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是宽泛地允许私有网络访问。
- 仅在明确受信任、确实需要并已审核私有网络浏览器访问的环境中使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制方式

智能体获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

它的映射方式如下：

- `browser snapshot` 返回一个稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照中的 `ref` ID 来执行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素内容（整页、元素或带标签的 ref）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪状态。
- `browser` 接受：
  - `profile`：选择一个命名的浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）：选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) —— 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 沙箱隔离环境中的浏览器控制
- [安全](/zh-CN/gateway/security) —— 浏览器控制风险与加固

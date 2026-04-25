---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试为什么 OpenClaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置和生命周期
summary: 集成浏览器控制服务 + 操作命令
title: 浏览器（OpenClaw 托管）
x-i18n:
    generated_at: "2026-04-25T05:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e150084059ae485cfb83ef70fd9d5d3ca46c5bd42431df3667857192009ec14c
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium profile**，由智能体进行控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部一个小型本地控制服务进行管理
（仅 loopback）。

面向初学者的理解方式：

- 你可以把它看作一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` profile **不会**触碰你的个人浏览器 profile。
- 智能体可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` profile 会通过 Chrome MCP 附加到你真实的、已登录的 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器 profile（默认使用橙色强调色）。
- 确定性的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖动/选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skill，在启用 browser 插件时，它会教智能体使用 snapshot、stable-tab、stale-ref 和 manual-blocker 恢复循环。
- 可选的多 profile 支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的表面，用于智能体自动化和验证。

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

如果 `openclaw browser` 完全不存在，或者智能体提示 browser 工具不可用，请跳转到 [缺少 browser 命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。若要用另一个注册相同 `browser` 工具名的插件来替换它，请禁用该插件：

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

默认情况下，需要同时满足 `plugins.entries.browser.enabled` **以及** `browser.enabled=true`。仅禁用插件会整体移除 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务；你的 `browser.*` 配置会保持不变，以供替代实现使用。

浏览器配置更改需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 智能体指引

browser 插件提供两个层级的智能体指引：

- `browser` 工具说明承载了紧凑、始终启用的约定：选择正确的 profile，在同一标签页上保持 refs，使用 `tabId`/labels 进行标签页定向，并在多步骤任务中加载 browser Skill。
- 内置的 `browser-automation` Skill 承载了更长的操作循环：先检查状态/标签页，为任务标签页打标签，在操作前创建快照，在 UI 变化后重新创建快照，恢复一次 stale refs，并将登录/2FA/captcha 或摄像头/麦克风阻塞报告为需要手动操作，而不是猜测。

当插件启用时，插件内置的 Skills 会列在智能体可用 Skills 中。完整的 Skill 指令会按需加载，因此常规轮次不会支付完整的 token 成本。

## 缺少 browser 命令或工具

如果升级后 `openclaw browser` 变成未知命令、`browser.request` 丢失，或者智能体报告 browser 工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。把它加上：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代 allowlist 成员资格 —— allowlist 决定插件是否加载，而工具策略只会在加载后才运行。完全移除 `plugins.allow` 也会恢复默认行为。

## Profiles：`openclaw` 与 `user`

- `openclaw`：受管、隔离的浏览器（不需要扩展）。
- `user`：内置的 Chrome MCP 附加 profile，用于你的**真实已登录 Chrome** 会话。

对于智能体 browser 工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- `profile` 是你希望指定某种特定浏览器模式时的显式覆盖项。

如果你希望默认使用受管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认：true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在受信任的私有网络访问场景下启用
      // allowPrivateNetwork: true, // 旧别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧的单 profile 覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时（毫秒）
    tabCleanup: {
      enabled: true, // 默认：true
      idleMinutes: 120, // 设为 0 可禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 可禁用每会话上限
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

- 控制服务会绑定到 loopback，端口由 `gateway.port` 推导而来（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会让同一族中的派生端口一起变化。
- 本地 `openclaw` profiles 会自动分配 `cdpPort`/`cdpUrl`；只有远程 CDP 才需要设置这些值。未设置时，`cdpUrl` 默认指向受管本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。
- `tabCleanup` 是对由主智能体 browser 会话打开的标签页进行尽力而为的清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们显式跟踪的标签页；主会话会让活动标签页保持可复用，然后在后台关闭空闲或超出上限的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- browser navigation 和 open-tab 会在导航前经过 SSRF 防护，并在之后对最终的 `http(s)` URL 进行尽力而为的复检。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 托管的浏览器。受管 Chrome 默认直接启动，因此提供商代理设置不会削弱 browser SSRF 检查。
- 如果要代理受管浏览器本身，请通过 `browser.extraArgs` 传入显式 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式 browser 代理路由，除非你明确启用了私有网络 browser 访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在你明确受信任私有网络 browser 访问时启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍然作为旧别名受支持。

</Accordion>

<Accordion title="Profile 行为">

- `attachOnly: true` 表示绝不启动本地浏览器；只有在浏览器已经运行时才附加。
- `headless` 可以在全局或按本地受管 profile 设置。按 profile 的值会覆盖 `browser.headless`，因此一个本地启动的 profile 可以保持 headless，而另一个仍然可见。
- `executablePath` 也可以在全局或按本地受管 profile 设置。按 profile 的值会覆盖 `browser.executablePath`，因此不同的受管 profiles 可以启动不同的 Chromium 系浏览器。
- `color`（顶层和按 profile）会给浏览器 UI 加上色调，这样你可以看出当前活动的是哪个 profile。
- 默认 profile 是 `openclaw`（受管独立模式）。使用 `defaultProfile: "user"` 可切换为已登录用户浏览器。
- 自动检测顺序：系统默认浏览器（如果它是 Chromium 系）；否则 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当一个 existing-session profile 应附加到非默认 Chromium 用户 profile（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他 Chromium 系浏览器）

如果你的**系统默认**浏览器是 Chromium 系（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖
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

按 profile 设置的 `executablePath` 只影响 OpenClaw 启动的本地受管 profiles。`existing-session` profiles 会附加到一个已经运行的浏览器，而远程 CDP profiles 会使用 `cdpUrl` 背后的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行一个节点主机；Gateway 网关会把 browser 操作代理给它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程 Chromium 系浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- `headless` 只影响 OpenClaw 启动的本地受管 profiles。它不会重启或更改 existing-session 或远程 CDP 浏览器。
- `executablePath` 也遵循同样的本地受管 profile 规则。在正在运行的本地受管 profile 上修改它，会将该 profile 标记为需要重启/对齐，以便下次启动时使用新的二进制文件。

停止行为会因 profile 模式而不同：

- 本地受管 profiles：`openclaw browser stop` 会停止由 OpenClaw 启动的浏览器进程
- attach-only 和远程 CDP profiles：`openclaw browser stop` 会关闭当前控制会话，并释放 Playwright/CDP 模拟覆盖状态（viewport、color scheme、locale、timezone、offline mode 以及类似状态），即使 OpenClaw 实际上并未启动任何浏览器进程

远程 CDP URL 可以包含认证信息：

- 查询参数 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点和连接到 CDP WebSocket 时会保留这些认证信息。
对于 token，优先使用环境变量或密钥管理器，而不是把它们提交到配置文件中。

## 节点 browser 代理（默认零配置）

如果你在拥有浏览器的那台机器上运行了一个**节点主机**，OpenClaw 就可以
自动将 browser 工具调用路由到该节点，而无需额外的 browser 配置。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地 browser 控制服务器。
- Profiles 来自该节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选项。保持为空即可沿用旧版/默认行为：所有已配置的 profiles 都仍然可以通过代理访问，包括 profile 创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有 allowlist 中的 profiles 才能被定向，而且持久化的 profile 创建/删除路由会在代理表面上被阻止。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，它通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 两种形式都可以使用，但对于远程浏览器 profile，
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

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless token。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 提供给你的是一个 HTTPS 基础 URL，你可以将其转换为
  `wss://` 以建立直接 CDP 连接，也可以保留 HTTPS URL，让 OpenClaw
  去发现 `/json/version`。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形态，并自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket debugger URL，
  然后建立连接。不会回退到 WebSocket。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，并带有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  路径。OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，且没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)，
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将协议规范化为 `http`/`https`）；
  如果发现结果返回了 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw
  会回退为对裸根路径进行直接 WebSocket 握手。这让指向本地 Chrome 的裸 `ws://`
  仍然可以连接，因为 Chrome 只接受位于
  `/json/version` 返回的特定按目标路径上的 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行
无头浏览器，内置 CAPTCHA 求解、隐身模式和住宅代理。

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

- [注册](https://www.browserbase.com/sign-up)，然后从 [概览仪表板](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话。
- 免费层允许一个并发会话以及每月一个浏览器小时。
  付费计划限制请参见 [定价](https://www.browserbase.com/pricing)。
- 完整 API 参考、SDK 指南和集成示例请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全

关键点：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关认证或节点配对进行。
- 独立的 loopback 浏览器 HTTP API **只**使用共享密钥认证：
  gateway token bearer auth、`x-openclaw-password`，或者使用已配置
  gateway password 的 HTTP Basic auth。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"`
  **不能**对这个独立的 loopback 浏览器 API 进行认证。
- 如果启用了浏览器控制，但没有配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 如果 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy`，OpenClaw **不会**自动生成该 token。
- 将 Gateway 网关和任何节点主机保留在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/token 视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期 token 直接写入配置文件。

## Profiles（多浏览器）

OpenClaw 支持多个命名 profiles（路由配置）。Profiles 可以是：

- **OpenClaw 托管**：一个专用的 Chromium 系浏览器实例，带有自己的用户数据目录 + CDP 端口
- **远程**：一个显式的 CDP URL（在其他地方运行的 Chromium 系浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome profile

默认值：

- 如果缺失，会自动创建 `openclaw` profile。
- `user` profile 是内置的，用于 Chrome MCP existing-session 附加。
- 除 `user` 外，existing-session profiles 需要显式启用；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除 profile 会将其本地数据目录移到回收站。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过
官方 Chrome DevTools MCP 服务器附加到一个正在运行的 Chromium 系浏览器 profile。
这会复用该浏览器 profile 中已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：使用 Chrome DevTools MCP 调试你的浏览器会话](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置 profile：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，
可以创建你自己的自定义 existing-session profile。

默认行为：

- 内置的 `user` profile 使用 Chrome MCP 自动连接，目标是
  默认的本地 Google Chrome profile。

对于 Brave、Edge、Chromium 或非默认 Chrome profile，请使用 `userDataDir`：

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

常见 inspect 页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时附加 smoke 测试：

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
- `snapshot` 返回来自所选活动标签页的 refs

如果附加不起作用，需要检查：

- 目标 Chromium 系浏览器版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器显示了附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  对于默认自动连接 profiles，Chrome 是否已在本地安装，但它不能替你
  启用浏览器侧的远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用的是自定义 existing-session profile，请传入那个显式 profile 名称。
- 只有当用户就在电脑前可以批准附加提示时，才应选择这种模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 这条路径比隔离的 `openclaw` profile 风险更高，因为它可以
  在你已登录的浏览器会话内执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只会附加。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被透传，以定位到该用户数据目录。
- Existing-session 可以附加到选定主机上，或通过已连接的
  browser 节点附加。如果 Chrome 位于别处且没有连接 browser 节点，请改用
  远程 CDP 或节点主机。

<Accordion title="Existing-session 功能限制">

与受管的 `openclaw` profile 相比，existing-session 驱动受到更多限制：

- **截图** —— 页面捕获和 `--ref` 元素捕获可用；CSS `--element` 选择器不可用。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面或基于 ref 的元素截图不需要 Playwright。
- **操作** —— `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs（不支持 CSS 选择器）。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 仅接受单个值。
- **等待 / 上传 / 对话框** —— `wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅受管功能** —— 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要受管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器 profile。
- **专用端口**：避开 `9222`，以防与开发工作流冲突。
- **确定性的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后是
  稳定的 `tabId` 句柄（如 `t1`）、可选标签以及原始 `targetId`。
  智能体应复用 `suggestedTargetId`；原始 id 仍然保留，用于
  调试和兼容性。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

为了便于脚本编写和调试，Gateway 网关暴露了一个小型的**仅 loopback 的 HTTP
控制 API**，以及与之对应的 `openclaw browser` CLI（快照、refs、wait
增强、JSON 输出、调试工作流）。完整参考请参见
[Browser 控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特有问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机部署，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败 vs 导航 SSRF 阻止

这是两类不同的故障，它们指向不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面是健康的。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标因策略被拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍然可用时，`open`、`navigate`、snapshot 或打开标签页流程因浏览器/网络策略错误而失败

使用下面这组最小命令来区分这两类问题：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 以 `not reachable after start` 失败，先排查 CDP 就绪问题。
- 如果 `start` 成功，但 `tabs` 失败，则控制平面仍然不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面已启动，故障位于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 都成功，则基础受管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会采用 fail-closed 的 SSRF 策略对象。
- 对于本地 loopback 的 `openclaw` 受管 profile，CDP 健康检查会有意跳过对 OpenClaw 自身本地控制平面的 browser SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功，并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全建议：

- **不要**默认放宽 browser SSRF 策略。
- 优先使用像 `hostnameAllowlist` 或 `allowedHostnames` 这样的窄范围主机例外，而不是广泛开放私有网络访问。
- 仅在明确受信任、确实需要并已审查私有网络 browser 访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制如何工作

智能体会获得**一个工具**用于浏览器自动化：

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射关系如下：

- `browser snapshot` 返回一个稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot 的 `ref` ID 来执行 click/type/drag/select。
- `browser screenshot` 捕获像素（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、profile、浏览器和标签页就绪状态。
- `browser` 接受：
  - `profile`，用于选择命名浏览器 profile（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`），用于选择浏览器所在位置。
  - 在沙箱会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱会话默认是 `sandbox`，非沙箱会话默认是 `host`。
  - 如果已连接具备浏览器能力的节点，工具可能会自动路由到该节点，除非你显式固定 `target="host"` 或 `target="node"`。

这样可以让智能体保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱环境中的浏览器控制
- [安全](/zh-CN/gateway/security) — 浏览器控制的风险与加固

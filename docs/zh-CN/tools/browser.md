---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 排查为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置和生命周期
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-25T00:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9870292f4205b01a072af10c989e8815f448a8f51c8863692fa5d1ba134bd0ee
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw 可以运行一个**专用的 Chrome / Brave / Edge / Chromium 配置文件**，由智能体控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部的一个小型本地
控制服务进行管理（仅 loopback）。

初学者视角：

- 可以把它理解为一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 连接到你真实的、已登录的 Chrome 会话。

## 你能获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认橙色强调）。
- 可预测的标签页控制（列出 / 打开 / 聚焦 / 关闭）。
- 智能体操作（点击 / 输入 / 拖拽 / 选择）、快照、截图、PDF。
- 一个内置的 `browser-automation` Skill，在启用浏览器
  插件时，它会教智能体使用快照、
  稳定标签页、过期 ref 和手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`、...）。

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

如果你看到 “Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 完全不存在，或者智能体提示浏览器工具
不可用，请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。你可以禁用它，以便用另一个注册了相同 `browser` 工具名称的插件替换它：

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

默认情况下需要同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。如果只禁用插件，会一次性移除 `openclaw browser` CLI、`browser.request` gateway 方法、智能体工具和控制服务；你的 `browser.*` 配置会保持不变，以供替代实现使用。

浏览器配置变更需要重启 Gateway 网关，以便插件重新注册其服务。

## 智能体指引

浏览器插件提供两个层级的智能体指引：

- `browser` 工具说明携带始终启用的精简契约：选择
  正确的配置文件、在同一个标签页内保持 refs 一致、使用 `tabId` / 标签进行标签页
  定位，以及在执行多步骤任务时加载浏览器 Skill。
- 内置的 `browser-automation` Skill 携带更长的操作循环：
  先检查状态 / 标签页、为任务标签页加标签、在执行操作前先做快照、在 UI 变化后重新快照、
  对过期 ref 恢复一次，并把登录 / 2FA / captcha 或
  摄像头 / 麦克风阻塞报告为手动操作，而不是猜测处理。

当插件启用时，插件内置的 Skills 会列在智能体的可用 Skills 中。完整的 Skill 指令按需加载，因此常规
轮次不会支付完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 变成未知命令、缺少 `browser.request`，或者智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表中遗漏了 `browser`。请将它加入：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`、`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 都不能替代允许列表成员资格——允许列表控制插件加载，而工具策略只有在加载之后才会运行。完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：托管的、隔离的浏览器（无需扩展）。
- `user`：内置的 Chrome MCP 连接配置文件，用于连接你**真实的已登录 Chrome**
  会话。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户
  正坐在电脑前可以点击 / 批准任何连接提示时，优先使用 `profile="user"`。
- 当你想要指定某种浏览器模式时，`profile` 是显式覆盖项。

如果你想默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json` 中。

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
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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

- 控制服务会绑定到 loopback，端口由 `gateway.port` 推导而来（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会使同一组派生端口一起变化。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort` / `cdpUrl`；仅在远程 CDP 时设置它们。未设置时，`cdpUrl` 默认使用托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP HTTP 可达性检查；`remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 握手。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页会在导航前进行 SSRF 防护，并在导航后的最终 `http(s)` URL 上尽力再次检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当你有意信任私有网络浏览器访问时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；只有当浏览器已在运行时才连接。
- `color`（顶层和每个配置文件级别）会为浏览器 UI 着色，方便你看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（托管的独立实例）。使用 `defaultProfile: "user"` 可改为默认使用已登录的用户浏览器。
- 自动检测顺序：若系统默认浏览器是基于 Chromium，则优先使用它；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome MCP，而不是原始 CDP。不要为这个驱动设置 `cdpUrl`。
- 当某个 existing-session 配置文件需要连接到非默认的 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。

</Accordion>

</AccordionGroup>

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是基于 Chromium 的（Chrome / Brave / Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖
自动检测：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
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

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 loopback 控制服务，并可以启动本地浏览器。
- **远程控制（节点主机）：** 在装有浏览器的机器上运行节点主机；Gateway 网关会将浏览器操作代理到该节点。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  连接到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

不同配置文件模式下，停止行为也不同：

- 本地托管配置文件：`openclaw browser stop` 会停止
  由 OpenClaw 启动的浏览器进程
- 仅连接和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前活动的
  控制会话，并释放 Playwright / CDP 模拟覆盖（视口、
  配色方案、区域设置、时区、离线模式以及类似状态），即使
  并没有任何浏览器进程是由 OpenClaw 启动的

远程 CDP URL 可以包含认证信息：

- 查询参数 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic 认证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接
CDP WebSocket 时都会保留这些认证信息。对于 token，请优先使用环境变量或 secrets manager，
不要把它们提交到配置文件中。

## 节点浏览器代理（默认零配置）

如果你在拥有浏览器的机器上运行了一个**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，而无需任何额外的浏览器配置。
这是远程 gateway 的默认路径。

说明：

- 节点主机会通过一个**代理命令**公开其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空即可保留旧版 / 默认行为：所有已配置的配置文件都可通过代理访问，包括配置文件创建 / 删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有允许列表中的配置文件可以被访问，并且代理界面上的持久化配置文件创建 / 删除路由会被阻止。
- 如果你不想启用它，可将其禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过
HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 可以使用任一种形式，但
对于远程浏览器配置文件，最简单的方式是直接使用 Browserless 连接文档中的
WebSocket URL。

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
- 选择与你 Browserless 账号匹配的区域端点（参见其文档）。
- 如果 Browserless 提供给你的是 HTTPS 基础 URL，你可以将它转换为
  `wss://` 以建立直接 CDP 连接，也可以保留 HTTPS URL，让 OpenClaw
  去发现 `/json/version`。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务暴露的是**直接 WebSocket** 端点，而不是
标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并会自动选择正确的连接策略：

- **HTTP(S) 发现** — `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  再建立连接。不提供 WebSocket 回退。
- **直接 WebSocket 端点** — `ws://host[:port]/devtools/<kind>/<id>` 或
  `wss://...`，并带有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>`
  路径。OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根路径** — `ws://host[:port]` 或 `wss://host[:port]`，且没有
  `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP
  `/json/version` 发现（将 scheme 规范化为 `http` / `https`）；
  如果发现结果返回 `webSocketDebuggerUrl`，则使用它，否则 OpenClaw
  会回退为在裸根路径上直接进行 WebSocket 握手。这样一来，
  指向本地 Chrome 的裸 `ws://` 仍然可以连接，因为 Chrome 只接受来自
  `/json/version` 中特定每目标路径上的 WebSocket 升级。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个用于运行
无头浏览器的云平台，内置 CAPTCHA 解决、隐身模式和住宅代理。

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

- [注册](https://www.browserbase.com/sign-up)，并从 [Overview 仪表板](https://www.browserbase.com/overview)
  复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此
  不需要手动创建会话步骤。
- 免费套餐每月允许一个并发会话和一个浏览器小时。
  付费套餐限制请参见 [定价](https://www.browserbase.com/pricing)。
- 完整 API
  参考、SDK 指南和集成示例请参见 [Browserbase 文档](https://docs.browserbase.com)。

## 安全性

关键概念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关认证或节点配对流转。
- 独立的 loopback 浏览器 HTTP API **仅**使用共享密钥认证：
  gateway bearer token、`x-openclaw-password`，或携带
  已配置 gateway password 的 HTTP Basic auth。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"`
  **不会**为这个独立的 loopback 浏览器 API 提供认证。
- 如果启用了浏览器控制，但没有配置共享密钥认证，OpenClaw
  会在启动时自动生成 `gateway.auth.token`，并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是
  `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和任何节点主机都保持在私有网络中（Tailscale）；避免公开暴露。
- 将远程 CDP URL / token 视为 secrets；优先使用环境变量或 secrets manager。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期有效的 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个具名配置文件（路由配置）。配置文件可以是：

- **由 OpenClaw 托管**：一个专用的基于 Chromium 的浏览器实例，拥有独立用户数据目录 + CDP 端口
- **远程**：显式 CDP URL（在其他地方运行的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接你现有的 Chrome 配置文件

默认值：

- 如果缺少，`openclaw` 配置文件会自动创建。
- `user` 配置文件是内置的，用于通过 Chrome MCP 连接 existing-session。
- 除 `user` 外，existing-session 配置文件需要显式启用；请使用 `--driver existing-session` 创建。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件时，会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用 existing-session

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器连接到一个正在运行的基于 Chromium 的浏览器配置文件。
这样可以复用该浏览器配置文件中
已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想要使用不同的
名称、颜色或浏览器数据目录，也可以创建你自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是
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
3. 保持浏览器运行，并在 OpenClaw 连接时批准连接提示。

常见 inspect 页面：

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

成功时应表现为：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 返回当前选中的活动标签页中的 refs

如果连接不起作用，请检查：

- 目标的基于 Chromium 的浏览器版本是否为 `144+`
- 该浏览器的 inspect 页面中是否已启用远程调试
- 浏览器是否显示了连接同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查
  对于默认自动连接配置文件，Chrome 是否已在本地安装，但它无法替你
  启用浏览器端的远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果你使用自定义 existing-session 配置文件，请传入其显式配置文件名称。
- 只有在用户坐在电脑前可以批准连接
  提示时，才选择这种模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 与隔离的 `openclaw` 配置文件相比，这条路径风险更高，因为它可以
  在你已登录的浏览器会话内执行操作。
- 对于这个驱动，OpenClaw 不会启动浏览器；它只负责连接。
- OpenClaw 在此处使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果
  设置了 `userDataDir`，它会被一并传递，以定位该用户数据目录。
- existing-session 可以在所选主机上连接，也可以通过一个已连接的
  浏览器节点连接。如果 Chrome 位于别处且没有已连接的浏览器节点，请改用
  远程 CDP 或节点主机。

<Accordion title="existing-session 功能限制">

与托管的 `openclaw` 配置文件相比，existing-session 驱动的限制更多：

- **截图**——页面截图和 `--ref` 元素截图可用；不支持 CSS `--element` 选择器。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。页面截图或基于 ref 的元素截图不需要 Playwright。
- **操作**——`click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 refs（不支持 CSS 选择器）。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持每次调用的超时设置。`select` 只接受单个值。
- **等待 / 上传 / 对话框**——`wait --url` 支持精确、子串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅托管功能**——批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避开 `9222`，防止与开发工作流冲突。
- **可预测的标签页控制**：`tabs` 会先返回 `suggestedTargetId`，然后
  返回稳定的 `tabId` 句柄，例如 `t1`、可选标签以及原始 `targetId`。
  智能体应复用 `suggestedTargetId`；原始 id 则继续保留用于
  调试和兼容性。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖它。

平台说明：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

为便于脚本编写和调试，Gateway 网关暴露了一个小型的**仅限 loopback 的 HTTP
控制 API**，以及配套的 `openclaw browser` CLI（快照、refs、wait
增强功能、JSON 输出、调试工作流）。完整参考请参见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），请参见
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参见
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的失败，对应不同的代码路径。

- **CDP 启动或就绪失败** 表示 OpenClaw 无法确认浏览器控制平面是健康的。
- **导航 SSRF 阻止** 表示浏览器控制平面是健康的，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- 导航 SSRF 阻止：
  - 当 `start` 和 `tabs` 仍可工作时，`open`、`navigate`、快照或打开标签页流程因浏览器 / 网络策略错误而失败

使用以下最小序列区分这两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果的解读方式：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪状态。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍然不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面已启动，失败原因在于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 全都成功，则基本的托管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置默认也会使用失败即关闭的 SSRF 策略对象。
- 对于本地 local loopback 的托管 `openclaw` 配置文件，CDP 健康检查会有意跳过对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制。
- 导航保护是单独的。`start` 或 `tabs` 成功，并不意味着后续的 `open` 或 `navigate` 目标一定被允许。

安全指导：

- 默认情况下**不要**放宽浏览器 SSRF 策略。
- 与宽泛的私有网络访问相比，应优先使用更窄的主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`。
- 仅在你有意信任、确实需要私有网络浏览器访问且已完成审查的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制原理

智能体获得**一个工具**用于浏览器自动化：

- `browser` — doctor / status / start / stop / tabs / open / focus / close / snapshot / screenshot / navigate / act

其映射关系如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照中的 `ref` ID 来点击 / 输入 / 拖拽 / 选择。
- `browser screenshot` 捕获像素（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页的就绪状态。
- `browser` 接受：
  - `profile`：用于选择具名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）：用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱隔离会话默认使用 `host`。
  - 如果已连接具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让智能体保持可预测，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) —— 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) —— 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) —— 浏览器控制的风险与加固

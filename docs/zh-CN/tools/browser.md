---
read_when:
    - 添加由 agent 控制的浏览器自动化
    - 调试为什么 openclaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置和生命周期
summary: 集成式浏览器控制服务与操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-04-05T10:11:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# 浏览器（由 openclaw 管理）

OpenClaw 可以运行一个**专用的 Chrome/Brave/Edge/Chromium 配置文件**，由 agent 控制。
它与你的个人浏览器隔离，并通过 Gateway 网关内部一个小型本地控制服务进行管理（仅限 loopback）。

面向初学者的理解方式：

- 可以把它看作一个**独立的、仅供 agent 使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- agent 可以在一条安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实的、已登录的 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认带橙色强调色）。
- 确定性的标签页控制（列出/打开/聚焦/关闭）。
- Agent 操作（点击/输入/拖动/选择）、snapshots、screenshots、PDF。
- 可选的多配置文件支持（`openclaw`、`work`、`remote`，等等）。

这个浏览器**不是**你日常使用的主浏览器。它是一个安全、隔离的接口，用于 agent 自动化与验证。

## 快速开始

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到“Browser disabled”，请在配置中启用它（见下文），然后重启 Gateway 网关。

如果 `openclaw browser` 命令完全不存在，或者 agent 提示浏览器工具不可用，请跳转到 [缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具现在是一个默认启用的内置插件。这意味着你可以在不移除 OpenClaw 其余插件系统的情况下禁用或替换它：

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

在安装另一个提供相同 `browser` 工具名称的插件之前，请先禁用这个内置插件。默认浏览器体验需要同时满足以下条件：

- `plugins.entries.browser.enabled` 未被禁用
- `browser.enabled=true`

如果你只关闭插件，那么内置浏览器 CLI（`openclaw browser`）、gateway 方法（`browser.request`）、agent 工具，以及默认浏览器控制服务都会一起消失。你的 `browser.*` 配置会保持不变，以便替换插件复用。

内置浏览器插件现在也拥有浏览器运行时实现。Core 仅保留共享插件 SDK helpers，以及对旧内部导入路径的兼容性重新导出。实际上，删除或替换浏览器插件包，会移除整套浏览器功能，而不会留下第二套由 core 拥有的运行时实现。

浏览器配置变更仍然需要重启 Gateway 网关，这样内置插件才能使用新设置重新注册其浏览器服务。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 突然变成未知命令，或者 agent 报告找不到浏览器工具，最常见原因是受限的 `plugins.allow` 列表中没有包含 `browser`。

错误配置示例：

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

修复方式：将 `browser` 添加到插件 allowlist 中：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

重要说明：

- 当设置了 `plugins.allow` 时，仅设置 `browser.enabled=true` 本身并不够。
- 当设置了 `plugins.allow` 时，仅设置 `plugins.entries.browser.enabled=true` 本身也不够。
- `tools.alsoAllow: ["browser"]` **不会**加载内置浏览器插件。它只会在插件已经加载后调整工具策略。
- 如果你不需要受限的插件 allowlist，删除 `plugins.allow` 也可以恢复默认的内置浏览器行为。

典型症状：

- `openclaw browser` 是未知命令。
- `browser.request` 缺失。
- Agent 报告浏览器工具不可用或缺失。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：受管理、隔离的浏览器（不需要扩展）。
- `user`：内置的 Chrome MCP 附加配置文件，用于接入你**真实已登录的 Chrome** 会话。

对于 agent 浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，优先使用 `profile="user"`。
- 当你想要特定浏览器模式时，`profile` 是显式覆盖项。

如果你希望默认使用受管理模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
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

说明：

- 浏览器控制服务会绑定到一个基于 `gateway.port` 派生出的 loopback 端口
  （默认：`18791`，即 gateway + 2）。
- 如果你覆盖了 Gateway 网关端口（`gateway.port` 或 `OPENCLAW_GATEWAY_PORT`），
  派生出的浏览器端口也会随之移动，以保持同一个“端口族”。
- 未设置时，`cdpUrl` 默认为受管理的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程（非 loopback）CDP 可达性检查。
- `remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 可达性检查。
- 浏览器导航/打开标签页在导航前会经过 SSRF 防护，并在导航后对最终 `http(s)` URL 尽力重新检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现/探测（`cdpUrl`，包括 `/json/version` 查找）也会被检查。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认为 `true`（trusted-network 模型）。设置为 `false` 可启用严格的仅公共网络浏览。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为 legacy 别名保留以兼容。
- `attachOnly: true` 表示“绝不启动本地浏览器；如果它已经运行，则只进行附加。”
- `color` + 每个配置文件自己的 `color` 会为浏览器 UI 加上色调，让你看到当前激活的是哪个配置文件。
- 默认配置文件是 `openclaw`（由 OpenClaw 管理的独立浏览器）。使用 `defaultProfile: "user"` 可切换为已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器是 Chromium 系列，则优先使用它；否则按 Chrome → Brave → Edge → Chromium → Chrome Canary。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl` —— 只有远程 CDP 才需要设置这些字段。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该 driver 设置 `cdpUrl`。
- 如果某个 existing-session 配置文件需要附加到 Brave 或 Edge 这类非默认 Chromium 用户配置文件，请设置 `browser.profiles.<name>.userDataDir`。

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果你的**系统默认**浏览器是 Chromium 系列（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。你也可以通过设置 `browser.executablePath` 来覆盖自动检测：

CLI 示例：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## 本地控制与远程控制

- **本地控制（默认）：**Gateway 网关启动 loopback 控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：**在拥有浏览器的机器上运行节点主机；Gateway 网关会将浏览器操作代理到它。
- **远程 CDP：**设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程 Chromium 浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

停止行为会因配置文件模式而不同：

- 本地受管理配置文件：`openclaw browser stop` 会停止由 OpenClaw 启动的浏览器进程
- attach-only 和远程 CDP 配置文件：`openclaw browser stop` 会关闭当前控制会话，并释放 Playwright/CDP 模拟覆盖（viewport、color scheme、locale、timezone、offline mode 以及类似状态），即使 OpenClaw 并未启动任何浏览器进程

远程 CDP URL 可以包含 auth：

- 查询 token（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接 CDP WebSocket 时都会保留这些 auth。对于 token，优先使用环境变量或 secrets manager，而不是将其提交到配置文件中。

## 节点浏览器代理（零配置默认）

如果你在拥有浏览器的机器上运行了**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，而无需任何额外浏览器配置。这是远程 gateways 的默认路径。

说明：

- 节点主机会通过一个**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空即可使用 legacy/默认行为：所有已配置的 profiles 都可通过代理访问，包括 profile 创建/删除路由。
- 如果你设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只有 allowlist 中的 profiles 可以作为目标，并且代理接口上的持久 profile 创建/删除路由会被阻止。
- 如果你不想启用它：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 gateway 上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一个托管的 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 两种形式都支持，但对于远程浏览器配置文件，最简单的方式是直接使用 Browserless 连接文档中提供的 WebSocket URL。

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

- 请将 `<BROWSERLESS_API_KEY>` 替换为你的真实 Browserless token。
- 请选择与你的 Browserless 账户匹配的区域端点（见其文档）。
- 如果 Browserless 提供给你一个 HTTPS 基础 URL，你可以将它转换为 `wss://` 以进行直接 CDP 连接，或者保留 HTTPS URL，让 OpenClaw 去发现 `/json/version`。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务会暴露一个**直接 WebSocket** 端点，而不是标准的基于 HTTP 的 CDP 发现接口（`/json/version`）。OpenClaw 两者都支持：

- **HTTP(S) 端点** —— OpenClaw 会调用 `/json/version` 来发现 WebSocket 调试器 URL，然后再连接。
- **WebSocket 端点**（`ws://` / `wss://`）—— OpenClaw 会直接连接，跳过 `/json/version`。适用于像 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com) 这样的服务，或者任何直接提供 WebSocket URL 的提供商。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个云平台，用于运行无头浏览器，内置 CAPTCHA 求解、stealth mode 和住宅代理。

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

- 请先 [注册](https://www.browserbase.com/sign-up)，然后从 [Overview dashboard](https://www.browserbase.com/overview) 复制你的 **API Key**。
- 请将 `<BROWSERBASE_API_KEY>` 替换为你的真实 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此不需要手动创建会话。
- 免费套餐允许一个并发会话以及每月一个浏览器小时。付费套餐限制请参见 [pricing](https://www.browserbase.com/pricing)。
- 完整 API 参考、SDK 指南和集成示例请参阅 [Browserbase docs](https://docs.browserbase.com)。

## 安全

关键理念：

- 浏览器控制仅限 loopback；访问通过 Gateway 网关 auth 或节点配对来流转。
- 独立的 loopback 浏览器 HTTP API **只使用共享密钥 auth**：
  gateway token bearer auth、`x-openclaw-password`，或者带已配置 gateway 密码的 HTTP Basic auth。
- Tailscale Serve 身份头和 `gateway.auth.mode: "trusted-proxy"` **不能**为这个独立的 loopback 浏览器 API 提供身份验证。
- 如果启用了浏览器控制但未配置共享密钥 auth，OpenClaw 会在启动时自动生成 `gateway.auth.token` 并将其持久化到配置中。
- 当 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy` 时，OpenClaw **不会**自动生成该 token。
- 请将 Gateway 网关和任何节点主机保留在私有网络中（Tailscale）；避免暴露到公网。
- 将远程 CDP URL/token 视为 secrets；优先使用环境变量或 secrets manager。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短生命周期 token。
- 避免将长期 token 直接嵌入配置文件。

## 配置文件（多浏览器）

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：

- **由 openclaw 管理**：一个专用的 Chromium 浏览器实例，拥有自己的用户数据目录和 CDP 端口
- **远程**：一个显式的 CDP URL（浏览器运行在别处）
- **现有会话**：通过 Chrome DevTools MCP 自动连接到你现有的 Chrome 配置文件

默认值：

- 如果缺失，会自动创建 `openclaw` 配置文件。
- `user` 配置文件是内置的，用于 Chrome MCP existing-session 附加。
- 除 `user` 外，existing-session 配置文件都需要显式启用；请使用 `--driver existing-session` 创建。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件时，会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用 existing-session

OpenClaw 还可以通过官方的 Chrome DevTools MCP 服务器附加到一个正在运行的 Chromium 浏览器配置文件。这会复用该浏览器配置文件中已经打开的标签页和登录状态。

官方背景说明和设置参考：

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，也可以创建自己的自定义 existing-session 配置文件。

默认行为：

- 内置的 `user` 配置文件使用 Chrome MCP 自动连接，目标是本地默认 Google Chrome 配置文件。

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

然后在对应浏览器中：

1. 打开该浏览器的远程调试 inspect 页面。
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

成功的表现：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 从所选的实时标签页返回 refs

如果附加不起作用，请检查：

- 目标 Chromium 浏览器版本是否为 `144+`
- 该浏览器的 inspect 页面中是否启用了远程调试
- 浏览器是否显示了附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查默认自动连接配置文件所需的 Chrome 是否已在本地安装，但它不能替你在浏览器端启用远程调试

Agent 使用方式：

- 当你需要用户已登录浏览器状态时，使用 `profile="user"`。
- 如果你使用的是自定义 existing-session 配置文件，请传入该显式配置文件名称。
- 只有当用户就在电脑前可以批准附加提示时，才选择这种模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`

说明：

- 这种路径比隔离的 `openclaw` 配置文件风险更高，因为它可以在你已登录的浏览器会话中执行操作。
- 对于这个 driver，OpenClaw 不会启动浏览器；它只会附加到现有会话。
- OpenClaw 在这里使用官方的 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，OpenClaw 会将其传入，以便定位该显式 Chromium 用户数据目录。
- Existing-session 截图支持页面截图和来自 snapshot 的 `--ref` 元素截图，但不支持 CSS `--element` 选择器。
- Existing-session 页面截图无需 Playwright，即可通过 Chrome MCP 工作。
  基于 ref 的元素截图（`--ref`）在那里也可用，但 `--full-page` 不能与 `--ref` 或 `--element` 组合使用。
- Existing-session 操作仍比受管理浏览器路径受限：
  - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要 snapshot refs，而不是 CSS 选择器
  - `click` 仅支持鼠标左键（不支持按钮覆盖或修饰键）
  - `type` 不支持 `slowly=true`；请改用 `fill` 或 `press`
  - `press` 不支持 `delayMs`
  - `hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持每次调用单独设置超时覆盖
  - `select` 当前仅支持单个值
- Existing-session `wait --url` 与其他浏览器 driver 一样，支持精确、子串和 glob 模式。`wait --load networkidle` 目前尚不支持。
- Existing-session 上传 hooks 需要 `ref` 或 `inputRef`，一次只支持一个文件，且不支持 CSS `element` 定位。
- Existing-session 对话框 hooks 不支持超时覆盖。
- 有些功能仍然需要受管理浏览器路径，包括批量操作、PDF 导出、下载拦截和 `responsebody`。
- Existing-session 仅适用于宿主机本地。如果 Chrome 位于另一台机器或另一个网络命名空间，请改用远程 CDP 或节点主机。

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **确定性标签页控制**：按 `targetId` 定位标签页，而不是“最后一个标签页”。

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
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见安装位置。

## 控制 API（可选）

对于仅限本地的集成，Gateway 网关会暴露一个小型 loopback HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- Snapshot/screenshot：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- Hooks：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点都接受 `?profile=<name>`。

如果配置了共享密钥 gateway auth，浏览器 HTTP 路由也要求 auth：

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>`，或使用该密码的 HTTP Basic auth

说明：

- 这个独立的 loopback 浏览器 API **不会**消费 trusted-proxy 或 Tailscale Serve 身份头。
- 如果 `gateway.auth.mode` 是 `none` 或 `trusted-proxy`，这些 loopback 浏览器路由也不会继承这些带身份信息的模式；请保持它们仅限 loopback。

### Playwright 要求

某些功能（navigate/act/AI snapshot/role snapshot、元素截图、PDF）需要 Playwright。如果未安装 Playwright，这些端点会返回明确的 501 错误。

没有 Playwright 仍可使用的功能：

- ARIA snapshots
- 当每个标签页可用 CDP WebSocket 时，受管理 `openclaw` 浏览器的页面截图
- `existing-session` / Chrome MCP 配置文件的页面截图
- 从 snapshot 输出中基于 `--ref` 的 `existing-session` 截图

仍然需要 Playwright 的功能：

- `navigate`
- `act`
- AI snapshots / role snapshots
- 基于 CSS 选择器的元素截图（`--element`）
- 完整浏览器 PDF 导出

元素截图也会拒绝 `--full-page`；该路由会返回 `fullPage is not supported for element screenshots`。

如果你看到 `Playwright is not available in this gateway build`，请安装完整的 Playwright 包（不是 `playwright-core`）并重启 gateway，或者重新安装带浏览器支持的 OpenClaw。

#### Docker Playwright 安装

如果你的 Gateway 网关运行在 Docker 中，请避免使用 `npx playwright`（会与 npm override 发生冲突）。
请使用内置 CLI：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

要持久保存浏览器下载内容，请设置 `PLAYWRIGHT_BROWSERS_PATH`（例如
`/home/node/.cache/ms-playwright`），并确保通过 `OPENCLAW_HOME_VOLUME` 或 bind mount 持久化 `/home/node`。请参阅 [Docker](/zh-CN/install/docker)。

## 工作原理（内部）

高层流程如下：

- 一个小型**控制服务器**接收 HTTP 请求。
- 它通过 **CDP** 连接到 Chromium 浏览器（Chrome/Brave/Edge/Chromium）。
- 对于高级操作（点击/输入/snapshot/PDF），它会在 CDP 之上使用 **Playwright**。
- 当缺少 Playwright 时，仅能使用不依赖 Playwright 的操作。

这种设计让 agent 使用稳定、确定性的接口，同时允许你在本地/远程浏览器和配置文件之间切换。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 来指定目标配置文件。
所有命令也都接受 `--json` 以输出机器可读格式（稳定载荷）。

基础命令：

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

检查：

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

生命周期说明：

- 对于 attach-only 和远程 CDP 配置文件，测试结束后 `openclaw browser stop` 仍然是正确的清理命令。它会关闭当前控制会话并清除临时模拟覆盖，而不是杀掉底层浏览器。
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

操作：

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状态：

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

说明：

- `upload` 和 `dialog` 是**预置**调用；请在触发文件选择器/对话框的 click/press 之前先运行它们。
- 下载和 trace 输出路径被限制在 OpenClaw 临时根目录下：
  - traces：`/tmp/openclaw`（回退：`${os.tmpdir()}/openclaw`）
  - downloads：`/tmp/openclaw/downloads`（回退：`${os.tmpdir()}/openclaw/downloads`）
- 上传路径被限制在 OpenClaw 临时 uploads 根目录下：
  - uploads：`/tmp/openclaw/uploads`（回退：`${os.tmpdir()}/openclaw/uploads`）
- `upload` 也可以通过 `--input-ref` 或 `--element` 直接设置文件输入框。
- `snapshot`：
  - `--format ai`（安装了 Playwright 时的默认值）：返回一个带数字 refs 的 AI snapshot（`aria-ref="<n>"`）。
  - `--format aria`：返回可访问性树（无 refs；仅用于检查）。
  - `--efficient`（或 `--mode efficient`）：紧凑的 role snapshot 预设（interactive + compact + depth + 更低 maxChars）。
  - 配置默认值（仅工具/CLI）：设置 `browser.snapshotDefaults.mode: "efficient"`，以便在调用方未传 mode 时使用 efficient snapshots（请参阅 [Gateway 配置参考](/zh-CN/gateway/configuration-reference#browser)）。
  - Role snapshot 选项（`--interactive`、`--compact`、`--depth`、`--selector`）会强制生成基于 role 的 snapshot，并带有如 `ref=e12` 这样的 refs。
  - `--frame "<iframe selector>"` 将 role snapshots 的作用域限制到某个 iframe（与 `e12` 这类 role refs 搭配使用）。
  - `--interactive` 会输出一个扁平、易于选择的交互元素列表（最适合驱动操作）。
  - `--labels` 会额外输出一张仅视口截图，并叠加 ref 标签（打印 `MEDIA:<path>`）。
- `click`/`type`/等操作需要来自 `snapshot` 的 `ref`（数字 `12` 或 role ref `e12`）。
  设计上不支持将 CSS 选择器用于操作。

## Snapshots 和 refs

OpenClaw 支持两种“snapshot”风格：

- **AI snapshot（数字 refs）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字 refs 的文本 snapshot。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，ref 通过 Playwright 的 `aria-ref` 解析。

- **Role snapshot（如 `e12` 这样的 role refs）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：基于 role 的列表/树，带有 `[ref=e12]`（以及可选的 `[nth=1]`）。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，ref 通过 `getByRole(...)` 解析（对重复项再配合 `nth()`）。
  - 添加 `--labels` 可包含一张叠加 `e12` 标签的视口截图。

Ref 行为：

- Refs **不会在导航后保持稳定**；如果某项操作失败，请重新运行 `snapshot` 并使用新的 ref。
- 如果 role snapshot 是通过 `--frame` 获取的，则这些 role refs 会被限制在该 iframe 中，直到下一次 role snapshot。

## 等待增强能力

你可以等待的不只是时间/文本：

- 等待 URL（支持 Playwright glob）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待某个选择器变为可见：
  - `openclaw browser wait "#main"`

这些条件可以组合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当操作失败时（例如“not visible”“strict mode violation”“covered”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在 interactive 模式下优先使用 role refs）
3. 如果仍然失败：运行 `openclaw browser highlight <ref>` 以查看 Playwright 实际定位到了什么
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 深度调试：录制 trace：
   - `openclaw browser trace start`
   - 重现问题
   - `openclaw browser trace stop`（会打印 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 形式的 role snapshots 包含 `refs` 和一个小型 `stats` 块（lines/chars/refs/interactive），以便工具推断载荷大小和密度。

## 状态与环境控制项

这些选项适用于“让网站表现得像 X”这类工作流：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- Storage：`storage local|session get|set|clear`
- Offline：`set offline on|off`
- Headers：`set headers --headers-json '{"X-Debug":"1"}'`（legacy `set headers --json '{"X-Debug":"1"}'` 仍受支持）
- HTTP Basic auth：`set credentials user pass`（或 `--clear`）
- Geolocation：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- Media：`set media dark|light|no-preference|none`
- Timezone / locale：`set timezone ...`、`set locale ...`
- Device / viewport：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- `openclaw` 浏览器配置文件可能包含已登录会话；请将其视为敏感内容。
- `browser act kind=evaluate` / `openclaw browser evaluate` 以及 `wait --fn`
  会在页面上下文中执行任意 JavaScript。Prompt Injection 可能引导它执行不当代码。如果你不需要，请用 `browser.evaluateEnabled=false` 禁用。
- 关于登录与反机器人说明（X/Twitter 等），请参阅 [浏览器登录 + X/Twitter 发帖](/zh-CN/tools/browser-login)。
- 请将 Gateway 网关/节点主机保持私有（仅限 loopback 或 tailnet）。
- 远程 CDP 端点能力很强；请通过隧道并加以保护。

严格模式示例（默认阻止私有/内部目标）：

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## 故障排除

对于 Linux 特有问题（尤其是 snap Chromium），请参阅
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参阅
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

## Agent 工具 + 控制方式

Agent 会获得**一个工具**用于浏览器自动化：

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式如下：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用 snapshot `ref` ID 来执行 click/type/drag/select。
- `browser screenshot` 抓取像素（整页或元素）。
- `browser` 接受：
  - `profile` 用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果连接了具备浏览器能力的节点，工具可能会自动路由到该节点，除非你固定指定 `target="host"` 或 `target="node"`。

这样可以让 agent 保持确定性，并避免脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) — 所有可用的 agent 工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) — 沙箱隔离环境中的浏览器控制
- [安全](/zh-CN/gateway/security) — 浏览器控制的风险与加固

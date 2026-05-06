---
read_when:
    - 添加由智能体控制的浏览器自动化
    - 调试 OpenClaw 为何会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-05-06T12:51:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以运行一个由智能体控制的**专用 Chrome/Brave/Edge/Chromium 配置文件**。
它与你的个人浏览器隔离，并通过 Gateway 网关内的小型本地
控制服务管理（仅限 local loopback）。

新手视角：

- 可以把它理解为一个**独立的、仅供智能体使用的浏览器**。
- `openclaw` 配置文件**不会**触碰你的个人浏览器配置文件。
- 智能体可以在安全通道中**打开标签页、读取页面、点击和输入**。
- 内置的 `user` 配置文件会通过 Chrome MCP 附加到你真实已登录的 Chrome 会话。

## 你会得到什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 确定性的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、屏幕截图、PDF。
- 一个内置的 `browser-automation` 技能，用于在启用浏览器
  插件时，教智能体使用快照、稳定标签页、过期引用和手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主浏览器。它是用于
智能体自动化和验证的安全、隔离表面。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果你看到 “Browser disabled”，请在配置中启用它（见下文），然后重启
Gateway 网关。

如果 `openclaw browser` 完全缺失，或者智能体说浏览器工具
不可用，请跳到[缺少浏览器命令或工具](/zh-CN/tools/browser#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它即可替换为另一个注册相同 `browser` 工具名称的插件：

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

默认值需要同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。仅禁用插件会把 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务作为一个整体移除；你的 `browser.*` 配置会保持不变，可供替代实现使用。

浏览器配置变更需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 智能体指南

工具配置文件说明：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。如果智能体或
派生的子智能体应使用浏览器自动化，请在配置文件
阶段添加浏览器：

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
策略会在配置文件过滤之后应用。

浏览器插件提供两层智能体指南：

- `browser` 工具描述包含紧凑的常驻契约：选择
  正确的配置文件、在同一标签页上保持引用、使用 `tabId`/标签进行标签页
  定向，并为多步骤工作加载浏览器技能。
- 内置的 `browser-automation` 技能包含更长的操作循环：
  先检查状态/标签页、标记任务标签页、操作前创建快照、在 UI 变化后重新创建快照、
  对过期引用恢复一次，并把登录/2FA/验证码或
  摄像头/麦克风阻塞报告为需要手动操作，而不是猜测。

当插件启用时，插件内置技能会列在智能体的可用 Skills 中。
完整技能说明按需加载，因此常规轮次不需要承担完整 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 未知、`browser.request` 缺失，或者智能体报告浏览器工具不可用，常见原因是 `plugins.allow` 列表省略了 `browser`，并且不存在根级 `browser` 配置块。添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 块，例如 `browser.enabled=true` 或 `browser.profiles.<name>`，即使在限制性的 `plugins.allow` 下也会激活内置浏览器插件，与渠道配置行为一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身不能替代 allowlist 成员资格。完全移除 `plugins.allow` 也会恢复默认值。

## 配置文件：`openclaw` 与 `user`

- `openclaw`：托管的隔离浏览器（无需扩展）。
- `user`：用于你的**真实已登录 Chrome**
  会话的内置 Chrome MCP 附加配置文件。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有已登录会话很重要，并且用户在电脑前可以点击/批准任何附加提示时，
  优先使用 `profile="user"`。
- 当你想要特定浏览器模式时，`profile` 是显式覆盖。

如果你希望默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

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

<Accordion title="Ports and reachability">

- 控制服务会绑定到 local loopback 上的一个端口，该端口派生自 `gateway.port`（默认 `18791` = gateway + 2）。覆盖 `gateway.port` 或 `OPENCLAW_GATEWAY_PORT` 会让派生端口在同一组端口中偏移。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`；仅对远程 CDP 设置这些值。未设置时，`cdpUrl` 默认指向托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性
  检查以及打开标签页的 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于
  它们的 CDP WebSocket 握手。
- `localLaunchTimeoutMs` 是本地启动的托管 Chrome
  进程暴露其 CDP HTTP 端点的预算。`localCdpReadyTimeoutMs` 是在进程被发现后，
  CDP websocket 就绪的后续预算。
  在 Raspberry Pi、低端 VPS 或 Chromium
  启动较慢的旧硬件上调高这些值。值必须是最多 `120000` ms 的正整数；无效
  配置值会被拒绝。
- 重复的托管 Chrome 启动/就绪失败会按
  配置文件触发熔断。连续失败多次后，OpenClaw 会短暂停止新的启动
  尝试，而不是在每次浏览器工具调用时都生成 Chromium。修复
  启动问题、在不需要时禁用浏览器，或在修复后重启
  Gateway 网关。
- 当调用方未传入 `timeoutMs` 时，`actionTimeoutMs` 是浏览器 `act` 请求的默认预算。客户端传输会增加一个小的宽限窗口，使长时间等待能够完成，而不是在 HTTP 边界超时。
- `tabCleanup` 是对主智能体浏览器会话打开的标签页进行的尽力清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们显式跟踪的标签页；主会话会保留活跃标签页以便复用，然后在后台关闭空闲或超出数量限制的已跟踪标签页。

</Accordion>

<Accordion title="SSRF policy">

- 浏览器导航和打开标签页会在导航前受到 SSRF 防护，并在之后对最终的 `http(s)` URL 进行尽力重新检查。
- 在严格 SSRF 模式下，远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）也会被检查。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 管理的浏览器。托管 Chrome 默认直接启动，因此提供商代理设置不会削弱浏览器 SSRF 检查。
- 要代理托管浏览器本身，请通过 `browser.extraArgs` 传入显式 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非有意启用了私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在有意信任私有网络浏览器访问时启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` 表示绝不启动本地浏览器；只有在已有浏览器运行时才附加。
- `headless` 可以全局设置，也可以按本地托管配置文件设置。按配置文件设置的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个仍然可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会为本地托管配置文件请求一次性无头启动，而不会重写 `browser.headless` 或配置文件配置。现有会话、仅附加和远程 CDP 配置文件会拒绝该覆盖，因为 OpenClaw 不会启动这些浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，如果环境和配置文件/全局配置都没有明确选择有头模式，本地托管配置文件会自动默认使用无头模式。`openclaw browser status --json` 会将 `headlessSource` 报告为 `env`、`profile`、`config`、`request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会强制当前进程的本地托管启动使用无头模式。`OPENCLAW_BROWSER_HEADLESS=0` 会强制普通启动使用有头模式，并在没有显示服务器的 Linux 主机上返回可操作的错误；显式的 `start --headless` 请求仍会对那一次启动生效。
- `executablePath` 可以全局设置，也可以按本地托管配置文件设置。按配置文件设置的值会覆盖 `browser.executablePath`，因此不同的托管配置文件可以启动不同的基于 Chromium 的浏览器。两种形式都接受 `~` 表示你的 OS 主目录。
- `color`（顶层和按配置文件）会给浏览器 UI 着色，以便你看出当前活动的是哪个配置文件。
- 默认配置文件是 `openclaw`（托管独立配置）。使用 `defaultProfile: "user"` 可选择已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器基于 Chromium，则使用它；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。不要为该驱动设置 `cdpUrl`。
- 当现有会话配置文件应附加到非默认 Chromium 用户配置文件（Brave、Edge 等）时，设置 `browser.profiles.<name>.userDataDir`。该路径也接受 `~` 表示你的 OS 主目录。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他基于 Chromium 的浏览器

如果你的**系统默认**浏览器基于 Chromium（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖自动检测。顶层和按配置文件的 `executablePath` 值都接受 `~` 表示你的 OS 主目录：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或按平台在配置中设置：

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

按配置文件的 `executablePath` 只影响 OpenClaw 启动的本地托管配置文件。`existing-session` 配置文件会改为附加到已运行的浏览器，远程 CDP 配置文件则使用 `cdpUrl` 后面的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关会启动回环控制服务，并且可以启动本地浏览器。
- **远程控制（节点主机）：** 在有浏览器的机器上运行节点主机；Gateway 网关会将浏览器操作代理给它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以附加到远程的基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于 loopback 上外部托管的 CDP 服务（例如在 Docker 中发布到 `127.0.0.1` 的 Browserless），也要设置 `attachOnly: true`。没有 `attachOnly` 的 Loopback CDP 会被视为本地 OpenClaw 托管的浏览器配置文件。
- `headless` 只影响 OpenClaw 启动的本地托管配置文件。它不会重启或更改现有会话或远程 CDP 浏览器。
- `executablePath` 遵循同样的本地托管配置文件规则。在正在运行的本地托管配置文件上更改它，会将该配置文件标记为需要重启/协调，以便下一次启动使用新的二进制文件。

停止行为因配置文件模式而异：

- 本地托管配置文件：`openclaw browser stop` 会停止 OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭活动控制会话，并释放 Playwright/CDP 模拟覆盖项（视口、配色方案、区域设置、时区、离线模式和类似状态），即使 OpenClaw 没有启动任何浏览器进程

远程 CDP URL 可以包含凭证：

- 查询令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 凭证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接到 CDP WebSocket 时会保留凭证。令牌应优先使用环境变量或机密管理器，而不是提交到配置文件。

## 节点浏览器代理（零配置默认值）

如果你在有浏览器的机器上运行**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，而不需要任何额外的浏览器配置。这是远程 Gateway 网关的默认路径。

注意事项：

- 节点主机会通过**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自该节点自己的 `browser.profiles` 配置（与本地相同）。
- `nodeHost.browserProxy.allowProfiles` 是可选的。将它留空即可使用旧版/默认行为：所有已配置的配置文件都仍可通过代理访问，包括配置文件创建/删除路由。
- 如果设置 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界：只能以允许列表中的配置文件为目标，并且代理表面会阻止持久配置文件创建/删除路由。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一项托管 Chromium 服务，通过 HTTPS 和 WebSocket 暴露 CDP 连接 URL。OpenClaw 可以使用任一形式，但对于远程浏览器配置文件，最简单的选项是 Browserless 连接文档中的直接 WebSocket URL。

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

注意事项：

- 将 `<BROWSERLESS_API_KEY>` 替换为你的真实 Browserless 令牌。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 给你的是 HTTPS 基础 URL，你可以将其转换为 `wss://` 以进行直接 CDP 连接，也可以保留 HTTPS URL，让 OpenClaw 发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 在 Docker 中自托管，并且 OpenClaw 在主机上运行时，应将 Browserless 视为外部托管的 CDP 服务：

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

`browser.profiles.browserless.cdpUrl` 中的地址必须能被 OpenClaw 进程访问。Browserless 还必须通告一个匹配且可访问的端点；将 Browserless `EXTERNAL` 设置为同一个面向 OpenClaw 的公共 WebSocket 基础地址，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或稳定的私有 Docker 网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向 OpenClaw 无法访问的地址，则 CDP HTTP 可能看起来正常，但 WebSocket 附加仍会失败。

不要让 loopback Browserless 配置文件的 `attachOnly` 保持未设置。没有 `attachOnly` 时，OpenClaw 会将 loopback 端口视为本地托管浏览器配置文件，并可能报告该端口正在使用但不归 OpenClaw 所有。

## 直接 WebSocket CDP 提供商

一些托管浏览器服务暴露**直接 WebSocket**端点，而不是标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形态，并自动选择正确的连接策略：

- **HTTP(S) 发现** - `http://host[:port]` 或 `https://host[:port]`。OpenClaw 调用 `/json/version` 来发现 WebSocket 调试器 URL，然后连接。没有 WebSocket 回退。
- **直接 WebSocket 端点** - `ws://host[:port]/devtools/<kind>/<id>` 或带有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 路径的 `wss://...`。OpenClaw 会直接通过 WebSocket 握手连接，并完全跳过 `/json/version`。
- **裸 WebSocket 根地址** - `ws://host[:port]` 或 `wss://host[:port]`，没有 `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP `/json/version` 发现（将协议规范化为 `http`/`https`）；如果发现返回 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw 会回退到裸根地址上的直接 WebSocket 握手。如果通告的 WebSocket 端点拒绝 CDP 握手，但配置的裸根地址接受它，OpenClaw 也会回退到该根地址。这样，指向本地 Chrome 的裸 `ws://` 仍能连接，因为 Chrome 只接受来自 `/json/version` 的特定按目标路径上的 WebSocket 升级，而托管提供商在其发现端点通告的短生命周期 URL 不适合 Playwright CDP 时，仍可以使用其根 WebSocket 端点。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个用于运行无头浏览器的云平台，内置 CAPTCHA 解决、隐身模式和住宅代理。

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

注意事项：

- [注册](https://www.browserbase.com/sign-up)，并从[概览仪表板](https://www.browserbase.com/overview)复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你的真实 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此不需要手动创建会话步骤。
- 免费层允许一个并发会话和每月一个浏览器小时。付费计划限制请参阅[定价](https://www.browserbase.com/pricing)。
- 完整 API 参考、SDK 指南和集成示例请参阅 [Browserbase 文档](https://docs.browserbase.com)。

## 安全

核心概念：

- 浏览器控制仅限 local loopback；访问流程通过 Gateway 网关的认证或节点配对。
- 独立的 local loopback 浏览器 HTTP API **仅使用共享密钥认证**：
  Gateway 网关令牌 bearer 认证、`x-openclaw-password`，或使用已配置
  Gateway 网关密码的 HTTP Basic 认证。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"` **不会**
  认证这个独立的 local loopback 浏览器 API。
- 如果浏览器控制已启用且未配置共享密钥认证，OpenClaw 会为该次启动生成一个仅运行时有效的 Gateway 网关令牌。如果客户端需要跨重启保持稳定密钥，请显式配置
  `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或
  `OPENCLAW_GATEWAY_PASSWORD`。
- 当 `gateway.auth.mode` 已经是 `password`、`none` 或 `trusted-proxy` 时，
  OpenClaw **不会**自动生成该令牌。
- 将 Gateway 网关和任何节点主机保持在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/令牌视为密钥；优先使用环境变量或密钥管理器。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期令牌。
- 避免将长期有效的令牌直接嵌入配置文件。

## 配置档（多浏览器）

OpenClaw 支持多个具名配置档（路由配置）。配置档可以是：

- **openclaw-managed**：一个专用的基于 Chromium 的浏览器实例，拥有自己的用户数据目录 + CDP 端口
- **remote**：显式 CDP URL（运行在其他位置的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接使用你的现有 Chrome 配置档

默认值：

- 如果缺失，会自动创建 `openclaw` 配置档。
- `user` 配置档是内置的，用于 Chrome MCP 现有会话附加。
- 除 `user` 外，现有会话配置档需要显式启用；使用 `--driver existing-session` 创建。
- 本地 CDP 端口默认从 **18800-18899** 分配。
- 删除配置档会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的基于 Chromium 的浏览器配置档。这会复用该浏览器配置档中已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：将 Chrome DevTools MCP 与你的浏览器会话配合使用](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置档：

- `user`

可选：如果你想使用不同的名称、颜色或浏览器数据目录，可以创建自己的自定义现有会话配置档。

默认行为：

- 内置的 `user` 配置档使用 Chrome MCP 自动连接，目标是默认的本地 Google Chrome 配置档。

对 Brave、Edge、Chromium 或非默认 Chrome 配置档使用 `userDataDir`。
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

然后在匹配的浏览器中：

1. 打开该浏览器用于远程调试的检查页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见检查页面：

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

成功的表现：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 从选中的实时标签页返回引用

如果附加无法工作，需要检查：

- 目标基于 Chromium 的浏览器版本是 `144+`
- 该浏览器的检查页面中已启用远程调试
- 浏览器显示了附加同意提示，并且你已接受
- `openclaw doctor` 会迁移旧的基于插件的浏览器配置，并检查默认自动连接配置档是否已在本地安装 Chrome，但它无法替你启用浏览器侧远程调试

Agent 使用：

- 当你需要用户的已登录浏览器状态时，使用 `profile="user"`。
- 如果使用自定义现有会话配置档，请传入该显式配置档名称。
- 只有当用户在电脑前可以批准附加提示时，才选择此模式。
- Gateway 网关或节点主机可以生成 `npx chrome-devtools-mcp@latest --autoConnect`

注意：

- 此路径比隔离的 `openclaw` 配置档风险更高，因为它可以在你的已登录浏览器会话中执行操作。
- OpenClaw 不会为此驱动启动浏览器；它只会附加。
- OpenClaw 在这里使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果设置了
  `userDataDir`，它会被透传以定位该用户数据目录。
- 现有会话可以在选定主机上附加，也可以通过已连接的浏览器节点附加。如果 Chrome 位于其他位置且没有连接浏览器节点，请改用远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的 `npx chrome-devtools-mcp@latest` 流程不符合你的需求（离线主机、固定版本、内置二进制文件）时，可以按配置档覆盖生成的 Chrome DevTools MCP 服务器：

| 字段         | 作用                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要生成的可执行文件，用来替代 `npx`。按原样解析；支持绝对路径。                                                            |
| `mcpArgs`    | 逐字传递给 `mcpCommand` 的参数数组。替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。 |

当在现有会话配置档上设置 `cdpUrl` 时，OpenClaw 会跳过
`--autoConnect` 并自动将端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志不能与 `userDataDir` 组合使用：当设置 `cdpUrl` 时，
Chrome MCP 启动会忽略 `userDataDir`，因为 Chrome MCP 会附加到端点背后的运行中浏览器，而不是打开配置档目录。

<Accordion title="现有会话功能限制">

与托管的 `openclaw` 配置档相比，现有会话驱动约束更多：

- **屏幕截图** - 页面捕获和 `--ref` 元素捕获可用；CSS `--element` 选择器不可用。`--full-page` 不能与 `--ref` 或 `--element` 组合使用。基于页面或引用的元素截图不需要 Playwright。
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照引用（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要快照引用。`click` 仅支持左键。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持按调用设置超时。`select` 接受单个值。
- **等待 / 上传 / 对话框** - `wait --url` 支持精确、子字符串和 glob 模式；不支持 `wait --load networkidle`。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖。
- **仅托管功能** - 批量操作、PDF 导出、下载拦截和 `responsebody` 仍然需要托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置档。
- **专用端口**：避免使用 `9222`，以防与开发工作流冲突。
- **确定性的标签页控制**：`tabs` 先返回 `suggestedTargetId`，然后返回稳定的 `tabId` 句柄，例如 `t1`、可选标签以及原始 `targetId`。
  Agent 应复用 `suggestedTargetId`；原始 ID 仍可用于调试和兼容性。

## 浏览器选择

本地启动时，OpenClaw 会选择第一个可用项：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下的常见 Chrome/Brave/Edge/Chromium 位置。
- Windows：检查常见安装位置。

## 控制 API（可选）

对于脚本编写和调试，Gateway 网关暴露一个小型的**仅限 local loopback 的 HTTP
控制 API**，以及匹配的 `openclaw browser` CLI（快照、引用、等待增强、JSON 输出、调试工作流）。完整参考见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排除

对于 Linux 特定问题（尤其是 snap Chromium），请参阅
[浏览器故障排除](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分主机设置，请参阅
[WSL2 + Windows + 远程 Chrome CDP 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 拦截

这些是不同的失败类别，并且指向不同的代码路径。

- **CDP 启动或就绪失败**表示 OpenClaw 无法确认浏览器控制平面健康。
- **导航 SSRF 拦截**表示浏览器控制平面健康，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 当配置了 local loopback 外部 CDP 服务但没有 `attachOnly: true` 时，出现
    `Port <port> is in use for profile "<name>" but not by openclaw`
- 导航 SSRF 拦截：
  - `open`、`navigate`、快照或打开标签页流程失败，并出现浏览器/网络策略错误，但 `start` 和 `tabs` 仍然可用

使用这个最小序列区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 因 `not reachable after start` 失败，请先排查 CDP 就绪问题。
- 如果 `start` 成功但 `tabs` 失败，控制平面仍然不健康。将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功但 `open` 或 `navigate` 失败，说明浏览器控制平面已启动，失败位于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 都成功，说明基本的托管浏览器控制路径健康。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置也默认使用 fail-closed SSRF 策略对象。
- 对于本地 local loopback `openclaw` 托管配置档，CDP 健康检查会有意跳过对 OpenClaw 自己本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。成功的 `start` 或 `tabs` 结果并不表示之后的 `open` 或 `navigate` 目标被允许。

安全指导：

- 默认情况下**不要**放宽浏览器 SSRF 策略。
- 优先使用窄范围主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是广泛的私有网络访问。
- 只有在有意信任、需要并已审查私有网络浏览器访问的环境中，才使用 `dangerouslyAllowPrivateNetwork: true`。

## Agent 工具 + 控制工作原理

智能体会获得 **一个工具** 用于浏览器自动化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照的 `ref` ID 来点击、输入、拖动、选择。
- `browser screenshot` 捕获像素（整页、元素或带标签的引用）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页是否就绪。
- `browser` 接受：
  - `profile` 用于选择命名的浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认使用 `sandbox`，非沙箱会话默认使用 `host`。
  - 如果已连接支持浏览器的节点，该工具可能会自动路由到它，除非你固定 `target="host"` 或 `target="node"`。

这让智能体保持确定性，并避免脆弱的选择器。

## 相关

- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) - 沙箱隔离环境中的浏览器控制
- [安全](/zh-CN/gateway/security) - 浏览器控制风险与加固

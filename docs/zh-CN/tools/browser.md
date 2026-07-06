---
read_when:
    - 添加智能体控制的浏览器自动化
    - 调试为什么 OpenClaw 会干扰你自己的 Chrome
    - 在 macOS 应用中实现浏览器设置 + 生命周期
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-06T10:54:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24095eddbad905a96b3aa15e4ee94aba8dffa05bafce01bfc7fda914d41266ef
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以运行一个由智能体控制的**专用 Chrome/Brave/Edge/Chromium 配置文件**。它通过 Gateway 网关内的小型本地控制服务运行（仅回环），并与你的个人浏览器隔离。

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。`openclaw` 配置文件绝不会接触你的个人浏览器配置文件。
- 智能体会在这个隔离通道中打开标签页、读取页面、点击并输入内容。
- 内置的 `user` 配置文件则会通过 Chrome DevTools MCP 附加到你真实的已登录 Chrome 会话。

## 你将获得什么

- 一个名为 **openclaw** 的独立浏览器配置文件（默认橙色强调色）。
- 确定性的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖拽/选择）、快照、截图、PDF。
- 基于 Playwright 的配置文件会把直接附件导航保存到托管下载目录，并在最终 URL 策略验证后返回 `{ url, suggestedFilename, path }` 元数据。
- 当操作立即启动一个或多个下载时，基于 Playwright 的智能体操作会返回包含相同托管元数据的 `downloads` 数组。
- 内置的 `browser-automation` 技能会在启用浏览器插件时，教智能体使用快照、稳定标签页、失效引用和手动阻塞恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主浏览器。它是一个用于智能体自动化和验证的安全、隔离界面。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“Browser disabled” 表示插件或 `browser.enabled` 已关闭；请参阅[配置](#configuration)和[插件控制](#plugin-control)。

如果完全缺少 `openclaw browser`，或者智能体表示浏览器工具不可用，请跳到[缺少浏览器命令或工具](#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是一个内置插件。禁用它后，可以用另一个注册相同 `browser` 工具名称的插件替换它：

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

默认值需要同时设置 `plugins.entries.browser.enabled` **和** `browser.enabled=true`。仅禁用插件会将 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务作为一个整体移除；你的 `browser.*` 配置会保留，以供替代插件使用。

浏览器配置更改需要重启 Gateway 网关，这样插件才能重新注册其服务。

## 智能体指引

工具配置文件说明：`tools.profile: "coding"` 包含 `web_search` 和 `web_fetch`，但不包含完整的 `browser` 工具。若要让智能体或生成的子智能体使用浏览器自动化，请在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

对于单个智能体，使用 `agents.list[].tools.alsoAllow: ["browser"]`。仅设置 `tools.subagents.tools.allow: ["browser"]` 不够，因为子智能体策略是在配置文件过滤之后应用的。

浏览器插件提供两级智能体指引：

- `browser` 工具描述包含精简的常驻契约：选择正确的配置文件、让引用保持在同一标签页上、使用 `tabId`/标签进行标签页定位，并在多步骤工作中加载浏览器技能。
- 内置的 `browser-automation` 技能包含更长的操作循环：先检查状态/标签页、标记任务标签页、操作前创建快照、UI 变化后重新创建快照、对失效引用恢复一次，并把登录/2FA/captcha 或摄像头/麦克风阻塞报告为需要手动操作，而不是猜测。

启用插件后，插件内置技能会列在智能体可用 Skills 中。完整技能说明会按需加载，因此常规轮次不会支付完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后 `openclaw browser` 未知、缺少 `browser.request`，或智能体报告浏览器工具不可用，通常原因是 `plugins.allow` 列表遗漏了 `browser`，并且没有根级 `browser` 配置块。添加它：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级 `browser` 块（`browser` 下的任何键，例如 `browser.enabled=true` 或 `browser.profiles.<name>`）会在受限的 `plugins.allow` 下激活内置浏览器插件，与内置渠道配置行为一致。`plugins.entries.browser.enabled=true` 和 `tools.alsoAllow: ["browser"]` 本身不能替代 allowlist 成员身份。完全移除 `plugins.allow` 也会恢复默认值。

## 配置文件：`openclaw`、`user`、`chrome`

- `openclaw`：托管的隔离浏览器（不需要扩展）。
- `user`：内置 Chrome DevTools MCP 附加配置文件，用于你的**真实已登录 Chrome** 会话。Chrome 会在 OpenClaw 第一次附加时显示阻塞式 “Allow remote debugging?” 提示，因此必须有人在电脑旁。
- `chrome`：内置[Chrome 扩展](/tools/chrome-extension)配置文件，用于你的**真实已登录 Chrome** 会话。即使桌前没人，也可以从手机使用，因为它通过 OpenClaw 浏览器扩展驱动标签页，而不是远程调试端口，因此不会出现 “Allow remote debugging?” 提示。

对于智能体浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，且用户**不在电脑旁**（Telegram、WhatsApp 等）时，优先使用 `profile="chrome"`（扩展）。
- 当现有登录会话很重要，且用户**在电脑旁**可以批准附加提示时，优先使用 `profile="user"`（Chrome MCP）。
- 当你想要特定浏览器模式时，`profile` 是显式覆盖项。

如果你想默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // default: true
    evaluateEnabled: true, // default: true; false disables act:evaluate (arbitrary JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
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
    // snapshotDefaults: { mode: "efficient" }, // default snapshot mode when the caller omits one
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

当调用方没有传入显式 `snapshotFormat` 或 `mode` 时，`browser.snapshotDefaults.mode: "efficient"` 会更改默认 `snapshot` 提取模式；每次调用的快照选项见[浏览器控制 API](/zh-CN/tools/browser-control)。

### 截图视觉（支持纯文本模型）

当主模型是纯文本模型（不支持视觉/多模态）时，浏览器截图会返回模型无法读取的图像块。浏览器截图会复用现有的图像理解配置，因此为媒体理解配置的图像模型可以把截图描述为文本，而不需要任何浏览器专用模型设置。

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**工作方式：**

1. 智能体调用 `browser screenshot`，图像会像往常一样捕获到磁盘。
2. 浏览器工具会询问现有的图像理解运行时，是否可以使用已配置的媒体图像模型、共享媒体模型、图像模型默认值或有凭证支持的图像提供商来描述截图。
3. 视觉模型返回文本描述，该描述会用 `wrapExternalContent`（提示注入防护）包装，并作为文本块而不是图像块返回给智能体。
4. 如果图像理解不可用、被跳过或失败，浏览器会回退为返回原始图像块。

使用现有的 `tools.media.image` / `tools.media.models` 字段来配置模型回退、超时、字节限制、配置文件和提供商请求设置。

如果当前活动的主模型已经支持视觉，并且没有配置显式图像理解模型，OpenClaw 会保留正常图像结果，以便主模型直接读取截图。

<AccordionGroup>

<Accordion title="Ports and reachability">

- 控制服务绑定到回环地址上的端口，该端口由 `gateway.port` 派生（默认 `18791` = Gateway 网关 + 2）。`OPENCLAW_GATEWAY_PORT` 优先于 `gateway.port`；任一设置都会让同一端口族中的派生端口一起偏移。
- 本地 `openclaw` 配置文件会从控制端口上方 9 个端口开始的范围自动分配 `cdpPort`/`cdpUrl`（默认 `18800`-`18899`）；仅在
  远程 CDP 配置文件或附加到现有会话端点时设置这些值。未设置时，`cdpUrl` 默认使用
  托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性
  检查以及打开标签页的 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于
  它们的 CDP WebSocket 握手。持久远程 Playwright 标签页枚举
  使用两者中较大的值作为操作截止时间。
- `localLaunchTimeoutMs` 是本地启动的托管 Chrome
  进程暴露其 CDP HTTP 端点的预算。`localCdpReadyTimeoutMs` 是
  进程被发现后 CDP websocket 就绪的后续预算。
  在 Raspberry Pi、低端 VPS 或 Chromium
  启动缓慢的旧硬件上提高这些值。值必须是最大 `120000` ms 的正整数；无效的
  配置值会被拒绝。
- 重复的托管 Chrome 启动/就绪失败会按
  配置文件触发断路。连续失败数次后，OpenClaw 会短暂暂停新的启动
  尝试，而不是在每次浏览器工具调用时都生成 Chromium。修复
  启动问题，如果不需要浏览器则禁用它，或在修复后重启
  Gateway 网关。
- `actionTimeoutMs` 是调用方未传入 `timeoutMs` 时浏览器 `act` 请求的默认预算。客户端传输会添加一个很小的宽限窗口，使长时间等待可以完成，而不是在 HTTP 边界超时。
- `tabCleanup` 是对主智能体浏览器会话打开的标签页进行的尽力清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭它们明确跟踪的标签页；主会话会让活动标签页保持可复用，然后在后台关闭空闲或超量的已跟踪标签页。

</Accordion>

<Accordion title="SSRF policy">

- 浏览器导航和打开标签页会在导航前受到 SSRF 防护，并在之后对最终 `http(s)` URL 进行尽力重新检查。
- 在严格 SSRF 模式下，也会检查远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 管理的浏览器。托管 Chrome 默认直接启动，因此提供商代理设置不会削弱浏览器 SSRF 检查。
- OpenClaw 管理的本地 CDP 就绪探测和 DevTools WebSocket 连接会绕过托管网络代理，直连准确启动的回环端点，因此当操作员代理阻止回环出站时，`openclaw browser start` 仍然可用。
- 要代理托管浏览器本身，请通过 `browser.extraArgs` 传入显式 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。严格 SSRF 模式会阻止显式浏览器代理路由，除非有意启用了私有网络浏览器访问。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅在有意信任私有网络浏览器访问时启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。

</Accordion>

<Accordion title="Profile behavior">

- `attachOnly: true` 表示永不启动本地浏览器；只有在已有浏览器运行时才附加。
- `headless` 可全局设置，也可按本地托管配置文件设置。按配置文件设置的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头，而另一个保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会请求
  本地托管配置文件的一次性无头启动，而不会重写
  `browser.headless` 或配置文件配置。现有会话、仅附加和
  远程 CDP 配置文件会拒绝该覆盖，因为 OpenClaw 不会启动这些
  浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，当环境和配置文件/全局
  配置都没有显式选择有头模式时，本地托管配置文件
  会自动默认无头。`openclaw browser status --json`
  将 `headlessSource` 报告为 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会强制当前进程的本地托管启动为无头。
  `OPENCLAW_BROWSER_HEADLESS=0` 会强制普通启动使用有头模式，并在没有显示服务器的 Linux 主机上返回可操作的错误；
  显式的 `start --headless` 请求仍会对该次启动优先生效。
- `executablePath` 可全局设置，也可按本地托管配置文件设置。按配置文件设置的值会覆盖 `browser.executablePath`，因此不同的托管配置文件可以启动不同的基于 Chromium 的浏览器。两种形式都接受 `~` 表示你的 OS 主目录。
- `color`（顶层和按配置文件）会给浏览器 UI 着色，以便你看到哪个配置文件处于活动状态。
- 默认配置文件是 `openclaw`（托管独立）。使用 `defaultProfile: "user"` 选择登录用户浏览器。
- 自动检测顺序：如果系统默认浏览器基于 Chromium，则使用它；否则依次为 Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。它可以通过 Chrome MCP 自动连接附加，或在你已经有运行中浏览器的 DevTools 端点时通过 `cdpUrl` 附加。
- `driver: "extension"` 通过 [OpenClaw Chrome extension](/tools/chrome-extension) 驱动你已登录的 Chrome。中继拥有自己的回环端点，因此这些配置文件不接受 `cdpUrl`。这是唯一一种在电脑前无人值守时可用的登录浏览器模式。
- 当现有会话配置文件应附加到非默认 Chromium 用户配置文件（Brave、Edge 等）时，设置 `browser.profiles.<name>.userDataDir`。此路径也接受 `~` 表示你的 OS 主目录。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他基于 Chromium 的浏览器

如果你的**系统默认**浏览器基于 Chromium（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖
自动检测。顶层和按配置文件的 `executablePath` 值接受 `~`
表示你的 OS 主目录：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

或在配置中按平台设置：

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

按配置文件的 `executablePath` 仅影响 OpenClaw
启动的本地托管配置文件。`existing-session` 配置文件会改为附加到已经运行的浏览器，
远程 CDP 配置文件则使用 `cdpUrl` 后面的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动回环控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在拥有浏览器的机器上运行节点主机；Gateway 网关将浏览器操作代理给它。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于回环地址上的外部托管 CDP 服务（例如在
  Docker 中发布到 `127.0.0.1` 的 Browserless），还要设置 `attachOnly: true`。没有 `attachOnly` 的回环 CDP
  会被视为本地 OpenClaw 托管浏览器配置文件。
- `headless` 仅影响 OpenClaw 启动的本地托管配置文件。它不会重启或更改现有会话或远程 CDP 浏览器。
- `executablePath` 遵循相同的本地托管配置文件规则。在
  运行中的本地托管配置文件上更改它，会将该配置文件标记为需要重启/协调，以便
  下一次启动使用新的二进制文件。

停止行为因配置文件模式而异：

- 本地托管配置文件：`openclaw browser stop` 会停止
  OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭活动的
  控制会话，并释放 Playwright/CDP 仿真覆盖（视口、
  配色方案、区域设置、时区、离线模式以及类似状态），即使
  没有浏览器进程由 OpenClaw 启动

远程 CDP URL 可以包含认证信息：

- 查询令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic auth（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接到
CDP WebSocket 时会保留认证信息。对于令牌，优先使用环境变量或密钥管理器，
而不是将其提交到配置文件。

## 节点浏览器代理（零配置默认）

如果你在拥有浏览器的机器上运行**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，无需任何额外浏览器配置。
这是远程 Gateway 网关的默认路径。

说明：

- 节点主机通过**代理命令**暴露其本地浏览器控制服务器。
- 配置文件来自节点自己的 `browser.profiles` 配置（与本地相同）。
- 无论 `allowProfiles` 如何，代理命令从不允许持久配置文件变更（`create-profile`、`delete-profile`、`reset-profile`）；请直接在节点上进行这些更改。
- `nodeHost.browserProxy.allowProfiles` 是可选的。留空以使用旧版/默认行为：所有已配置的配置文件仍可通过代理访问。
- 如果设置 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界，用于限制代理将目标指向哪些配置文件名称。
- 如果你不想使用它，可以禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`（也接受 `"auto"` 以选择单个已连接的浏览器节点，或 `"manual"` 以要求显式节点参数）

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一种托管 Chromium 服务，它通过 HTTPS 和 WebSocket 暴露
CDP 连接 URL。OpenClaw 可以使用任一形式，但
对于远程浏览器配置文件，最简单的选项是 Browserless 连接文档中的直接 WebSocket URL。

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

- 将 `<BROWSERLESS_API_KEY>` 替换为你的真实 Browserless 令牌。
- 选择与你的 Browserless 账户匹配的区域端点（参见其文档）。
- 如果 Browserless 给你一个 HTTPS 基础 URL，你可以将其转换为
  `wss://` 用于直接 CDP 连接，或保留 HTTPS URL 并让 OpenClaw
  发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 在 Docker 中自托管且 OpenClaw 在主机上运行时，将
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

`browser.profiles.browserless.cdpUrl` 中的地址必须能从 OpenClaw 进程访问。Browserless 还必须通告一个匹配且可访问的端点；将 Browserless 的 `EXTERNAL` 设置为同一个面向 OpenClaw 的公开 WebSocket 基址，例如 `ws://127.0.0.1:3000`、`ws://browserless:3000`，或稳定的私有 Docker 网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向 OpenClaw 无法访问的地址，CDP HTTP 可能看起来健康，但 WebSocket 附加仍会失败。

不要让 local loopback Browserless 配置的 `attachOnly` 保持未设置。没有 `attachOnly` 时，OpenClaw 会将 local loopback 端口视为本地托管的浏览器配置，并可能报告该端口正在使用但不归 OpenClaw 所有。

## 直接 WebSocket CDP 提供商

某些托管浏览器服务会公开**直接 WebSocket**端点，而不是标准的基于 HTTP 的 CDP 发现（`/json/version`）。OpenClaw 接受三种 CDP URL 形态，并会自动选择正确的连接策略：

- **HTTP(S) 发现** - `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 调用 `/json/version` 来发现 WebSocket 调试器 URL，然后连接。没有 WebSocket fallback。
- **直接 WebSocket 端点** - `ws://host[:port]/devtools/<kind>/<id>`，或带有 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 路径的 `wss://...`。
  OpenClaw 通过 WebSocket 握手直接连接，并完全跳过 `/json/version`。
- **裸 WebSocket 根地址** - `ws://host[:port]` 或 `wss://host[:port]`，没有 `/devtools/...` 路径（例如 [Browserless](https://browserless.io)、[Browserbase](https://www.browserbase.com)）。OpenClaw 会先尝试 HTTP `/json/version` 发现（将 scheme 规范化为 `http`/`https`）；如果发现返回 `webSocketDebuggerUrl`，就使用它，否则 OpenClaw fallback 到裸根地址上的直接 WebSocket 握手。如果通告的 WebSocket 端点拒绝 CDP 握手，但配置的裸根地址接受它，OpenClaw 也会 fallback 到该根地址。这样，指向本地 Chrome 的裸 `ws://` 仍可连接，因为 Chrome 只接受来自 `/json/version` 的特定按目标路径上的 WebSocket 升级；同时，托管提供商在其发现端点通告不适合 Playwright CDP 的短期 URL 时，仍可使用其根 WebSocket 端点。

`openclaw browser doctor` 使用与运行时附加相同的先发现、WebSocket fallback 逻辑，因此能够成功连接的裸根 URL 不会被诊断报告为不可达。

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

说明：

- [注册](https://www.browserbase.com/sign-up)，并从[概览仪表盘](https://www.browserbase.com/overview)复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你的真实 Browserbase API key。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此不需要手动创建会话步骤。
- 查看[价格](https://www.browserbase.com/pricing)，了解当前免费层限制和付费套餐。
- 查看 [Browserbase 文档](https://docs.browserbase.com)，获取完整 API 参考、SDK 指南和集成示例。

### Notte

[Notte](https://www.notte.cc) 是一个用于运行无头浏览器的云平台，内置隐身、住宅代理和 CDP 原生 WebSocket 网关。

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

说明：

- [注册](https://console.notte.cc)，并从控制台设置页面复制你的 **API Key**。
- 将 `<NOTTE_API_KEY>` 替换为你的真实 Notte API key。
- Notte 会在 WebSocket 连接时自动创建浏览器会话，因此不需要手动创建会话步骤。WebSocket 断开连接时，会销毁该会话。
- 查看[价格](https://www.notte.cc/#pricing)，了解当前免费层限制和付费套餐。
- 查看 [Notte 文档](https://docs.notte.cc)，获取完整 API 参考、SDK 指南和集成示例。

## 安全

关键思路：

- 浏览器控制仅限 local loopback；访问通过 Gateway 网关的认证或节点配对流转。
- 独立的 local loopback 浏览器 HTTP API **仅使用共享密钥认证**：
  gateway token bearer auth、`x-openclaw-password`，或使用已配置 gateway 密码的 HTTP Basic auth。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"` **不会**认证这个独立的 local loopback 浏览器 API。
- 如果浏览器控制已启用且未配置共享密钥认证，OpenClaw 会在启动时自动生成并持久化浏览器控制凭据：
  当 `gateway.auth.mode` 为 `none` 时生成 token，或当它为 `trusted-proxy` 时生成密码（通过 `gateway.auth.password` 持久化，以便进程外 local loopback 客户端能够解析）。当该模式已经配置显式字符串凭据，或 `gateway.auth.mode` 为 `password` 时，会跳过自动生成。
- 如果你想使用自己控制的稳定密钥，而不是生成的密钥，请显式配置 `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或 `OPENCLAW_GATEWAY_PASSWORD`。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期 token。
- 避免将长期 token 直接嵌入配置文件。
- 将 Gateway 网关和任何节点主机保持在私有网络（Tailscale）上；避免公开暴露。
- 将远程 CDP URL/token 视为密钥；优先使用环境变量或密钥管理器。

## 配置（多浏览器）

OpenClaw 支持多个命名配置（路由配置）。配置可以是：

- **openclaw-managed**：专用的基于 Chromium 的浏览器实例，带有自己的用户数据目录 + CDP 端口
- **remote**：显式 CDP URL（在其他位置运行的基于 Chromium 的浏览器）
- **existing session**：通过 Chrome DevTools MCP 自动连接你的现有 Chrome 配置

默认值：

- 如果缺失，会自动创建 `openclaw` 配置。
- `user` 配置是内置的，用于 Chrome MCP existing-session 附加。
- 除 `user` 之外，existing-session 配置需要显式启用；使用 `--driver existing-session` 创建它们。
- 本地 CDP 端口默认从 **18800-18899** 分配。
- 删除配置会将其本地数据目录移到废纸篓。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的基于 Chromium 的浏览器配置。这会复用该浏览器配置中已经打开的标签页和登录状态。

官方背景和设置参考：

- [Chrome for Developers：将 Chrome DevTools MCP 与你的浏览器会话配合使用](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置：`user`。如果你想使用不同的名称、颜色或浏览器数据目录，可以创建自己的自定义 existing-session 配置。

默认情况下，内置 `user` 配置使用 Chrome MCP 自动连接，目标是默认的本地 Google Chrome 配置。对 Brave、Edge、Chromium 或非默认 Chrome 配置使用 `userDataDir`。`~` 会展开为你的 OS 主目录：

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

1. 打开该浏览器用于远程调试的 inspect 页面。
2. 启用远程调试。
3. 保持浏览器运行，并在 OpenClaw 附加时批准连接提示。

常见 inspect 页面：

- Chrome：`chrome://inspect/#remote-debugging`
- Brave：`brave://inspect/#remote-debugging`
- Edge：`edge://inspect/#remote-debugging`

实时附加 smoke test：

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

成功状态如下：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出你已经打开的浏览器标签页
- `snapshot` 返回所选实时标签页中的 refs

如果附加无法工作，请检查：

- 目标基于 Chromium 的浏览器版本为 `144+`
- 该浏览器的 inspect 页面中已启用远程调试
- 浏览器已显示附加同意提示，并且你已接受
- 如果 Chrome 是用显式 `--remote-debugging-port` 启动的，请将 `browser.profiles.<name>.cdpUrl` 设置为该 DevTools 端点，而不是依赖 Chrome MCP 自动连接
- `openclaw doctor` 会迁移旧的基于扩展的浏览器配置，并检查默认自动连接配置是否在本地安装了 Chrome，但它不能替你启用浏览器侧远程调试

Agent 使用：

- 当你需要用户已登录的浏览器状态时，使用 `profile="user"`。
- 如果使用自定义 existing-session 配置，请传入该显式配置名称。
- 仅在用户位于电脑前可以批准附加提示时选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`。

说明：

- 这条路径的风险高于隔离的 `openclaw` 配置，因为它可以在你的已登录浏览器会话中操作。
- OpenClaw 不会为此驱动启动浏览器；它只会附加。
- OpenClaw 在这里使用官方 Chrome DevTools MCP `--autoConnect` 流。如果设置了 `userDataDir`，它会被透传，以定位该用户数据目录。
- Existing-session 可以在所选主机上附加，也可以通过已连接的浏览器节点附加。如果 Chrome 位于其他位置且没有连接浏览器节点，请改用远程 CDP 或节点主机。

### 自定义 Chrome MCP 启动

当默认的 `npx chrome-devtools-mcp@latest` 流不符合你的需求时（离线主机、固定版本、供应商内置二进制文件），可按配置覆盖每个配置启动的 Chrome DevTools MCP 服务器：

| 字段         | 作用                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 要启动的可执行文件，用于替代 `npx`。按原样解析；绝对路径会被保留。                                                        |
| `mcpArgs`    | 原样传递给 `mcpCommand` 的参数数组。替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。                          |

当在 existing-session 配置上设置 `cdpUrl` 时，OpenClaw 会跳过 `--autoConnect`，并自动将端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志和 `userDataDir` 不能组合使用：当设置 `cdpUrl` 时，Chrome MCP 启动会忽略 `userDataDir`，因为 Chrome MCP 会附加到端点背后的正在运行的浏览器，而不是打开配置目录。

<Accordion title="Existing-session 功能限制">

与托管的 `openclaw` 配置相比，existing-session 驱动约束更多：

- **截图** - 页面捕获和 `--ref` 元素捕获可用；CSS `--element` 选择器不可用。基于页面或 ref 的元素截图不需要 Playwright。（`--full-page` 在任何配置文件上都不能与 `--ref` 或 `--element` 组合使用，不只是现有会话。）
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照 ref（不能使用 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要快照 ref。`click` 仅限左键（不支持按钮覆盖或修饰键）。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select`、`fill` 和 `evaluate` 不支持逐调用的 `timeoutMs` 覆盖。`select` 接受单个值。不支持 `batch`；请逐个发送操作。
- **等待 / 上传 / 对话框** - `wait --url` 支持精确、子字符串和 glob 模式（与托管模式相同）；`wait --load networkidle` 在现有会话配置文件上不受支持（它适用于托管以及原始/远程 CDP 配置文件）。上传钩子需要 `ref` 或 `inputRef`，一次一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖或 `dialogId`。
- **对话框可见性** - 当某个操作打开模态对话框时，托管浏览器操作响应会包含 `blockedByDialog` 和 `browserState.dialogs.pending`；快照也会包含待处理对话框状态。在对话框待处理期间，使用 `browser dialog --accept/--dismiss --dialog-id <id>` 响应。在 OpenClaw 之外处理的对话框会显示在 `browserState.dialogs.recent` 下。
- **仅托管功能** - PDF 导出、下载拦截和 `responsebody` 仍然需要托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会触碰你的个人浏览器配置文件。
- **专用端口**：避开 `9222`，防止与开发工作流冲突。
- **确定性的标签页控制**：`tabs` 先返回 `suggestedTargetId`，然后返回稳定的 `tabId` 句柄，例如 `t1`、可选标签和原始 `targetId`。
  Agent 应复用 `suggestedTargetId`；原始 id 仍可用于调试和兼容。

## 浏览器选择

本地启动时，OpenClaw 会选择第一个可用项：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以用 `browser.executablePath` 覆盖。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和
  `/usr/lib/chromium-browser` 下的常见 Chrome/Brave/Edge/Chromium 位置，以及
  `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 下由 Playwright 管理的 Chromium。
- Windows：检查常见安装位置。

## 控制 API（可选）

对于脚本编写和调试，Gateway 网关暴露一个小型**仅限回环的 HTTP
控制 API**，以及匹配的 `openclaw browser` CLI（快照、refs、等待
增强、JSON 输出、调试工作流）。完整参考见
[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排查

对于 Linux 特定问题（尤其是 snap Chromium），请参阅
[浏览器故障排查](/zh-CN/tools/browser-linux-troubleshooting)。

对于 WSL2 Gateway 网关 + Windows Chrome 分主机设置，请参阅
[WSL2 + Windows + 远程 Chrome CDP 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 拦截

这是不同的失败类别，并且指向不同的代码路径。

- **CDP 启动或就绪失败**表示 OpenClaw 无法确认浏览器控制平面健康。
- **导航 SSRF 拦截**表示浏览器控制平面健康，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 当配置了不带 `attachOnly: true` 的回环外部 CDP 服务时，出现
    `Port <port> is in use for profile "<name>" but not by openclaw`
- 导航 SSRF 拦截：
  - `open`、`navigate`、快照或打开标签页流程因浏览器/网络策略错误而失败，但 `start` 和 `tabs` 仍然可用

使用这个最小序列区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

如何解读结果：

- 如果 `start` 失败并显示 `not reachable after start`，先排查 CDP 就绪性。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍然不健康。将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功但 `open` 或 `navigate` 失败，则浏览器控制平面已启动，失败发生在导航策略或目标页面中。
- 如果 `start`、`tabs` 和 `open` 全部成功，则基本的托管浏览器控制路径是健康的。

重要行为细节：

- 即使你没有配置 `browser.ssrfPolicy`，浏览器配置也默认使用失败关闭的 SSRF 策略对象。
- 对于 local loopback `openclaw` 托管配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自有本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。成功的 `start` 或 `tabs` 结果并不意味着后续的 `open` 或 `navigate` 目标会被允许。

安全指导：

- 默认情况下**不要**放宽浏览器 SSRF 策略。
- 优先使用窄范围主机例外，例如 `hostnameAllowlist` 或 `allowedHostnames`，而不是宽泛的私有网络访问。
- 仅在有意信任、需要并已审核私有网络浏览器访问的环境中使用 `dangerouslyAllowPrivateNetwork: true`。

## Agent 工具 + 控制如何工作

Agent 会获得**一个工具**用于浏览器自动化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 进行点击/输入/拖拽/选择。
- `browser screenshot` 捕获像素（整页、元素或带标签的 refs）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页就绪性。
- `browser` 接受：
  - `profile` 用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在位置。
  - 在沙箱隔离会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离会话默认为 `sandbox`，非沙箱会话默认为 `host`。
  - 如果连接了支持浏览器的节点，工具可能会自动路由到该节点，除非你固定 `target="host"` 或 `target="node"`。

这会保持 Agent 的确定性，并避免脆弱的选择器。

## 相关

- [工具概览](/zh-CN/tools) - 所有可用 Agent 工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) - 沙箱隔离环境中的浏览器控制
- [安全](/zh-CN/gateway/security) - 浏览器控制风险和加固

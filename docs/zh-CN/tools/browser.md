---
read_when:
    - 添加由智能体控制的浏览器自动化功能
    - 调试 OpenClaw 为何会干扰你自己的 Chrome 浏览器
    - 在 macOS 应用中实现浏览器设置和生命周期管理
summary: 集成式浏览器控制服务 + 操作命令
title: 浏览器（由 OpenClaw 管理）
x-i18n:
    generated_at: "2026-07-12T14:47:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw 可以运行由智能体控制的**专用 Chrome/Brave/Edge/Chromium 配置文件**。它通过 Gateway 网关内部的小型本地控制服务（仅限回环访问）运行，并与你的个人浏览器隔离。

- 可以把它看作一个**独立的、仅供智能体使用的浏览器**。`openclaw` 配置文件绝不会接触你的个人浏览器配置文件。
- 智能体在这个隔离环境中打开标签页、读取页面、点击和输入。
- 内置的 `user` 配置文件则通过 Chrome DevTools MCP 连接到你真实的、已登录的 Chrome 会话。

## 你将获得

- 一个名为 **openclaw** 的独立浏览器配置文件（默认使用橙色强调色）。
- 确定性的标签页控制（列出/打开/聚焦/关闭）。
- 智能体操作（点击/输入/拖动/选择）、快照、屏幕截图和 PDF。
- 基于 Playwright 的配置文件会将直接访问附件产生的文件保存到托管下载目录中，并在最终 URL 策略验证后返回 `{ url, suggestedFilename, path }` 元数据。
- 当基于 Playwright 的智能体操作立即启动一个或多个下载时，会返回包含相同托管元数据的 `downloads` 数组。
- 内置的 `browser-automation` Skill；启用浏览器插件后，它会向智能体说明快照、
  稳定标签页、过期引用以及手动阻塞问题的恢复循环。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

这个浏览器**不是**你的日常主力浏览器。它是一个安全、隔离的界面，用于
智能体自动化和验证。

在 macOS 上，你可以明确地将 Chrome 系浏览器的系统配置文件中的 Cookie 复制到独立的托管配置文件中。托管浏览器仍使用自己的用户数据目录；只会复制选定的 Cookie，本地存储和 IndexedDB 不会被复制。有关导入命令和限制，请参阅[配置文件](#profiles-multi-browser)或 [`openclaw browser` CLI 参考](/zh-CN/cli/browser)。

## 快速开始

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

“浏览器已禁用”表示插件或 `browser.enabled` 已关闭；请参阅
[配置](#configuration)和[插件控制](#plugin-control)。

如果完全没有 `openclaw browser` 命令，或者智能体提示浏览器工具
不可用，请跳转到[缺少浏览器命令或工具](#missing-browser-command-or-tool)。

## 插件控制

默认的 `browser` 工具是内置插件。禁用它后，可以用另一个注册相同 `browser` 工具名称的插件替代：

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

使用默认设置时，`plugins.entries.browser.enabled` **和** `browser.enabled=true` 必须同时满足。仅禁用插件会将 `openclaw browser` CLI、`browser.request` Gateway 网关方法、智能体工具和控制服务作为一个整体移除；你的 `browser.*` 配置会保持不变，以供替代插件使用。

更改浏览器配置后需要重启 Gateway 网关，以便插件重新注册其服务。

## 智能体指南

工具配置文件说明：`tools.profile: "coding"` 包含 `web_search` 和
`web_fetch`，但不包含完整的 `browser` 工具。要允许智能体或
派生的子智能体使用浏览器自动化，请在配置文件
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
仅设置 `tools.subagents.tools.allow: ["browser"]` 并不足够，因为子智能体
策略是在配置文件过滤之后应用的。

浏览器插件提供两个层级的智能体指南：

- `browser` 工具描述包含简洁的常驻契约：选择
  正确的配置文件、使引用始终位于同一标签页、使用 `tabId`/标签指定
  目标标签页，并在执行多步骤工作时加载浏览器 Skill。
- 内置的 `browser-automation` Skill 提供更完整的操作循环：
  首先检查状态/标签页、为任务标签页添加标签、操作前创建快照、界面变化
  后重新创建快照、对过期引用尝试恢复一次，并将登录/双重身份验证/验证码或
  摄像头/麦克风阻塞问题报告为需要手动操作，而不是猜测处理方式。

启用插件后，插件内置的 Skills 会列在智能体的可用 Skills 中。完整的 Skill
说明会按需加载，因此日常轮次无需承担完整的 token 成本。

## 缺少浏览器命令或工具

如果升级后无法识别 `openclaw browser`、缺少 `browser.request`，或智能体报告浏览器工具不可用，通常是因为 `plugins.allow` 列表中没有 `browser`，并且根级别不存在 `browser` 配置块。请添加：

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

显式的根级别 `browser` 配置块（`browser` 下的任意键，例如
`browser.enabled=true` 或 `browser.profiles.<name>`）即使在限制严格的
`plugins.allow` 下也会激活内置浏览器插件，这与内置
渠道配置的行为一致。`plugins.entries.browser.enabled=true` 和
`tools.alsoAllow: ["browser"]` 本身不能替代允许列表成员身份。
完全移除 `plugins.allow` 也会恢复默认行为。

## 配置文件：`openclaw`、`user`、`chrome`

- `openclaw`：托管且隔离的浏览器（无需扩展程序）。
- `user`：内置的 Chrome DevTools MCP 连接配置文件，用于连接你**真实的、
  已登录的 Chrome** 会话。OpenClaw 首次连接时，Chrome 会显示阻塞式
  “Allow remote debugging?” 提示，因此必须有人在电脑旁。
- `chrome`：内置的 [Chrome 扩展程序](/zh-CN/tools/chrome-extension)配置文件，用于
  连接你**真实的、已登录的 Chrome** 会话。即使电脑旁无人，也可以通过手机
  使用，因为它通过 OpenClaw 浏览器扩展程序驱动标签页，而不是使用
  远程调试端口，因此不会出现“Allow remote debugging?”提示。

对于智能体的浏览器工具调用：

- 默认：使用隔离的 `openclaw` 浏览器。
- 当现有登录会话很重要，并且用户**不在电脑旁**（Telegram、WhatsApp 等）时，
  优先使用 `profile="chrome"`（扩展程序）。
- 当现有登录会话很重要，并且用户**在电脑旁**、可以批准连接提示时，
  优先使用 `profile="user"`（Chrome MCP）。
- 当你需要指定特定浏览器模式时，使用 `profile` 进行显式覆盖。

如果希望默认使用托管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json`。

```json5
{
  browser: {
    enabled: true, // 默认值：true
    evaluateEnabled: true, // 默认值：true；设为 false 会禁用 act:evaluate（任意 JS）
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在需要访问可信私有网络时选择启用
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 旧版单配置文件覆盖项
    remoteCdpTimeoutMs: 1500, // 远程 CDP HTTP 超时时间（毫秒）
    remoteCdpHandshakeTimeoutMs: 3000, // 远程 CDP WebSocket 握手超时时间（毫秒）
    localLaunchTimeoutMs: 15000, // 本地托管 Chrome 发现超时时间（毫秒）
    localCdpReadyTimeoutMs: 8000, // 本地托管浏览器启动后的 CDP 就绪超时时间（毫秒）
    actionTimeoutMs: 60000, // 默认浏览器操作超时时间（毫秒）
    tabCleanup: {
      enabled: true, // 默认值：true
      idleMinutes: 120, // 设为 0 可禁用空闲清理
      maxTabsPerSession: 8, // 设为 0 可禁用每个会话的上限
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // 调用方省略模式时使用的默认快照模式
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

当调用方未显式传递 `snapshotFormat` 或 `mode` 时，
`browser.snapshotDefaults.mode: "efficient"` 会更改默认的 `snapshot`
提取模式；有关单次调用的快照选项，请参阅[浏览器控制 API](/zh-CN/tools/browser-control)。

### 屏幕截图视觉理解（支持纯文本模型）

当主模型仅支持文本（不支持视觉/多模态）时，浏览器
屏幕截图会返回模型无法读取的图像块。浏览器屏幕截图
会复用现有的图像理解配置，因此为媒体理解配置的图像模型
可以将屏幕截图描述为文本，无需任何浏览器专用模型设置。

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // 添加回退候选项；首个成功的候选项胜出
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // 标记为支持图像时，共享媒体模型也可使用。
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // 也会遵循现有的图像模型默认设置。
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**工作原理：**

1. 智能体调用 `browser screenshot`，图像会像往常一样捕获并保存到磁盘。
2. 浏览器工具会询问现有的图像理解运行时，是否可以使用已配置的媒体图像模型、共享媒体
   模型、图像模型默认设置或有身份验证支持的图像提供商来描述屏幕截图。
3. 视觉模型返回文本描述，该描述经 `wrapExternalContent`（提示词注入防护）封装后，
   以文本块而非图像块的形式返回给智能体。
4. 如果图像理解不可用、被跳过或失败，浏览器会
   回退为返回原始图像块。

屏幕截图图像块是私有工具结果：智能体可以查看它们，
但 OpenClaw 不会自动将它们附加到渠道回复中。若要分享
屏幕截图，请要求智能体使用消息工具显式发送。

请使用现有的 `tools.media.image` / `tools.media.models` 字段配置模型
回退、超时时间、字节限制、配置文件和提供商请求设置。

如果当前主模型已支持视觉，并且没有显式配置图像
理解模型，OpenClaw 会保留正常的图像结果，以便
主模型直接读取屏幕截图。

<AccordionGroup>

<Accordion title="端口和可达性">

- 控制服务绑定到 local loopback，所用端口根据 `gateway.port` 推导（默认 `18791` = Gateway 网关端口 + 2）。`OPENCLAW_GATEWAY_PORT` 的优先级高于 `gateway.port`；设置其中任一项都会相应偏移同一端口组中的派生端口。
- 本地 `openclaw` 配置文件会从控制端口以上 9 个端口开始的范围内自动分配 `cdpPort`/`cdpUrl`（默认 `18800`-`18899`）；仅应为
  远程 CDP 配置文件或现有会话端点附加设置这些值。未设置 `cdpUrl` 时，其默认值为
  托管的本地 CDP 端口。
- `remoteCdpTimeoutMs` 适用于远程和 `attachOnly` CDP HTTP 可达性
  检查及打开标签页的 HTTP 请求；`remoteCdpHandshakeTimeoutMs` 适用于
  相应的 CDP WebSocket 握手。持久化远程 Playwright 标签页枚举
  使用两者中的较大值作为操作截止时间。
- `localLaunchTimeoutMs` 是在本地启动的托管 Chrome
  进程公开其 CDP HTTP 端点的时间预算。`localCdpReadyTimeoutMs` 是发现进程后
  等待 CDP WebSocket 就绪的后续时间预算。
  在 Raspberry Pi、低端 VPS 或 Chromium
  启动较慢的旧硬件上，请提高这些值。值必须是最大不超过 `120000` ms 的正整数；无效的
  配置值会被拒绝。
- 托管 Chrome 反复启动失败或就绪失败时，会按
  配置文件触发熔断。连续失败数次后，OpenClaw 会短暂暂停新的启动
  尝试，而不是每次调用浏览器工具时都生成 Chromium 进程。请修复
  启动问题；如果不需要浏览器，则将其禁用；或在修复后重启
  Gateway 网关。
- 当调用方未传递 `timeoutMs` 时，`actionTimeoutMs` 是浏览器 `act` 请求的默认时间预算。客户端传输层会增加一个较小的宽限窗口，使长时间等待能够完成，而不是在 HTTP 边界超时。
- `tabCleanup` 对主智能体浏览器会话打开的标签页执行尽力而为的清理。子智能体、cron 和 ACP 生命周期清理仍会在会话结束时关闭其明确跟踪的标签页；主会话会保留活动标签页以供复用，然后在后台关闭空闲或超出数量限制的已跟踪标签页。

</Accordion>

<Accordion title="SSRF 策略">

- 浏览器导航和打开标签页请求会接受预检。在操作期间及有界的操作后宽限期内，受保护的 Playwright 交互（点击、坐标点击、悬停、拖动、滚动、选择、按键、输入、填写表单和求值）会在发送 HTTP 请求字节之前，拦截被策略拒绝的顶层及子框架文档加载，然后尽力重新检查最终的 `http(s)` URL。
- 每次全新启动 OpenClaw 托管的 Chrome 前，OpenClaw 都会尽力禁用网络预测，以抑制观察到的 Chromium 针对这些被拒绝加载所进行的推测性预连接。这是一项纵深防御措施，而非策略边界：跨控制服务重启复用的浏览器以及其他浏览器后端可能不会应用此加固。Playwright 路由仍不是网络防火墙，也不会拦截重定向跳转、弹出窗口的首次请求、Service Worker 流量、在有界防护窗口结束后运行的页面代码，或每一条后台/子资源路径。完整的出站隔离需要所有者侧隔离或实施策略的代理。
- 在严格 SSRF 模式下，也会检查远程 CDP 端点发现和 `/json/version` 探测（`cdpUrl`）。
- Gateway 网关/提供商的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 和 `NO_PROXY` 环境变量不会自动代理 OpenClaw 托管的浏览器。托管 Chrome 默认直接连接，以防止提供商代理设置削弱浏览器 SSRF 检查。
- OpenClaw 托管的本地 CDP 就绪探测和 DevTools WebSocket 连接会针对已启动的确切 local loopback 端点绕过托管网络代理，因此当操作员代理阻止 local loopback 出站流量时，`openclaw browser start` 仍可正常工作。
- 要代理托管浏览器本身，请通过 `browser.extraArgs` 传递明确的 Chrome 代理标志，例如 `--proxy-server=...` 或 `--proxy-pac-url=...`。除非有意启用了浏览器对专用网络的访问，否则严格 SSRF 模式会阻止明确的浏览器代理路由。
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认关闭；仅当明确信任浏览器访问专用网络时才启用。
- `browser.ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受到支持。

</Accordion>

<Accordion title="配置文件行为">

- `attachOnly: true` 表示绝不启动本地浏览器；仅在已有浏览器运行时附加。
- `headless` 可以全局设置，也可以按本地托管配置文件设置。按配置文件设置的值会覆盖 `browser.headless`，因此一个本地启动的配置文件可以保持无头模式，而另一个仍保持可见。
- `POST /start?headless=true` 和 `openclaw browser start --headless` 会为本地托管配置文件请求
  一次性无头启动，而不会重写
  `browser.headless` 或配置文件设置。现有会话、仅附加和
  远程 CDP 配置文件会拒绝此覆盖，因为 OpenClaw 不会启动这些
  浏览器进程。
- 在没有 `DISPLAY` 或 `WAYLAND_DISPLAY` 的 Linux 主机上，如果环境和配置文件/全局
  配置都未明确选择有界面模式，本地托管配置文件
  会自动默认为无头模式。请使用无歧义的浏览器级形式
  `openclaw browser --json status`；末尾形式 `openclaw browser status --json`
  也可使用，因为 `status` 未定义自己的 `--json`。该命令会将
  `headlessSource` 报告为 `env`、`profile`、`config`、
  `request`、`linux-display-fallback` 或 `default`。
- `OPENCLAW_BROWSER_HEADLESS=1` 会强制当前进程的本地托管启动使用无头模式。
  `OPENCLAW_BROWSER_HEADLESS=0` 会强制普通启动使用有界面模式，并在没有显示服务器的
  Linux 主机上返回可操作的错误；明确的 `start --headless` 请求仍会在该次启动中优先。
- 浏览器控制路由和编程式客户端会保留无显示错误中
  便于阅读的 `error`，并公开稳定原因
  `no_display_for_headed_profile`。其 `details` 仅包含 `profile`、
  `requestedHeadless`、`headlessSource` 和 `displayPresent`，因此 API 客户端无需匹配消息文本
  即可选择正确的修复方式。
- 对于正在运行的本地托管配置文件，状态和 Doctor 会查询 Chrome 的
  浏览器级 CDP 端点，以获取渲染器、后端、设备/驱动程序、功能
  状态、驱动程序规避措施以及硬件加速视频能力。结果会针对该浏览器进程
  缓存，并由 `openclaw browser --json status` 完整公开。
  被动状态调用不会启动 Chrome。
  现有会话、扩展、远程 CDP 和沙箱浏览器仍彼此独立，
  不会通过此托管主机路径接受检查。
- 无头托管 Chrome 仍使用保守的 `--disable-gpu` 默认值。
  诊断不会启用硬件加速、添加全局硬件加速设置，
  也不会授予沙箱浏览器设备访问权限。
- `executablePath` 可以全局设置，也可以按本地托管配置文件设置。按配置文件设置的值会覆盖 `browser.executablePath`，因此不同的托管配置文件可以启动不同的 Chromium 系浏览器。两种形式都接受代表操作系统主目录的 `~`。
- `color`（顶层和按配置文件）会为浏览器 UI 着色，以便你查看哪个配置文件处于活动状态。
- 默认配置文件为 `openclaw`（托管独立实例）。使用 `defaultProfile: "user"` 选择使用已登录的用户浏览器。
- 自动检测顺序：如果系统默认浏览器基于 Chromium，则使用它；否则依次检测 Chrome、Brave、Edge、Chromium、Chrome Canary。
- `driver: "existing-session"` 使用 Chrome DevTools MCP，而不是原始 CDP。它可以通过 Chrome MCP 自动连接进行附加，也可以在你已有运行中浏览器的 DevTools 端点时通过 `cdpUrl` 附加。
- `driver: "extension"` 通过 [OpenClaw Chrome 扩展](/zh-CN/tools/chrome-extension)控制你已登录的 Chrome。中继服务拥有其 local loopback 端点，因此这些配置文件不接受 `cdpUrl`。这是唯一能在计算机旁无人值守时工作的已登录浏览器模式。
- 当现有会话配置文件应附加到非默认 Chromium 用户配置文件（Brave、Edge 等）时，请设置 `browser.profiles.<name>.userDataDir`。此路径也接受代表操作系统主目录的 `~`。

</Accordion>

</AccordionGroup>

## 使用 Brave 或其他 Chromium 系浏览器

如果你的**系统默认**浏览器基于 Chromium（Chrome/Brave/Edge 等），
OpenClaw 会自动使用它。设置 `browser.executablePath` 可覆盖
自动检测。顶层和按配置文件设置的 `executablePath` 值均接受代表
操作系统主目录的 `~`：

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
启动的本地托管配置文件。`existing-session` 配置文件会改为附加到已在运行的浏览器，
而远程 CDP 配置文件使用 `cdpUrl` 所指向的浏览器。

## 本地控制与远程控制

- **本地控制（默认）：** Gateway 网关启动 local loopback 控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：** 在装有浏览器的计算机上运行节点主机；Gateway 网关会将浏览器操作代理到该主机。
- **远程 CDP：** 设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以
  附加到远程 Chromium 系浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。
- 对于 local loopback 上由外部管理的 CDP 服务（例如
  Docker 中发布到 `127.0.0.1` 的 Browserless），还需设置 `attachOnly: true`。未设置 `attachOnly` 的 local loopback CDP
  会被视为本地 OpenClaw 托管的浏览器配置文件。
- `headless` 仅影响 OpenClaw 启动的本地托管配置文件。它不会重启或更改现有会话或远程 CDP 浏览器。
- `executablePath` 遵循相同的本地托管配置文件规则。在正在运行的
  本地托管配置文件上更改此值会将该配置文件标记为需要重启/协调，以便
  下次启动使用新的二进制文件。

停止行为因配置文件模式而异：

- 本地托管配置文件：`openclaw browser stop` 会停止
  OpenClaw 启动的浏览器进程
- 仅附加和远程 CDP 配置文件：`openclaw browser stop` 会关闭活动
  控制会话并释放 Playwright/CDP 模拟覆盖（视口、
  配色方案、语言区域、时区、离线模式和类似状态），即使
  OpenClaw 并未启动浏览器进程

远程 CDP URL 可以包含身份验证信息：

- 查询令牌（例如 `https://provider.example?token=<token>`）
- HTTP Basic 身份验证（例如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点和连接
CDP WebSocket 时会保留身份验证信息。对于令牌，优先使用环境变量或密钥管理器，
而不是将其提交到配置文件中。

## 节点浏览器代理（零配置默认方式）

如果你在装有浏览器的计算机上运行**节点主机**，OpenClaw 可以
自动将浏览器工具调用路由到该节点，无需任何额外浏览器配置。
这是远程 Gateway 网关的默认路径。

注意事项：

- 节点主机通过一个**代理命令**公开其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- 无论 `allowProfiles` 如何设置，代理命令都绝不允许永久性配置文件变更（`create-profile`、`delete-profile`、`reset-profile`）；请直接在节点上进行这些变更。
- `nodeHost.browserProxy.allowProfiles` 是可选的。将其留空可保留旧版/默认行为：所有已配置的配置文件仍可通过代理访问。
- 如果设置了 `nodeHost.browserProxy.allowProfiles`，OpenClaw 会将其视为最小权限边界，限制代理可将哪些配置文件名称作为目标。
- 如果你不需要此功能，请将其禁用：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在 Gateway 网关上：`gateway.nodes.browser.mode="off"`（也接受 `"auto"` 以选择单个已连接的浏览器节点，或接受 `"manual"` 以要求显式指定节点参数）

## Browserless（托管式远程 CDP）

[Browserless](https://browserless.io) 是一项托管式 Chromium 服务，通过 HTTPS 和 WebSocket 公开
CDP 连接 URL。OpenClaw 可以使用任一形式，但对于远程浏览器配置文件，最简单的选项是使用
Browserless 连接文档中的直接 WebSocket URL。

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

注意：

- 将 `<BROWSERLESS_API_KEY>` 替换为你真实的 Browserless 令牌。
- 选择与你的 Browserless 账户匹配的区域端点（请参阅其文档）。
- 如果 Browserless 为你提供 HTTPS 基础 URL，你可以将其转换为
  `wss://` 以进行直接 CDP 连接，也可以保留 HTTPS URL，让 OpenClaw
  发现 `/json/version`。

### 同一主机上的 Browserless Docker

当 Browserless 自托管于 Docker 中，而 OpenClaw 在主机上运行时，请将
Browserless 视为外部管理的 CDP 服务：

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

`browser.profiles.browserless.cdpUrl` 中的地址必须能被
OpenClaw 进程访问。Browserless 还必须公布一个匹配且可访问的端点；
请将 Browserless 的 `EXTERNAL` 设置为同一个对 OpenClaw 可见的 WebSocket 基础地址，例如
`ws://127.0.0.1:3000`、`ws://browserless:3000`，或稳定的私有 Docker
网络地址。如果 `/json/version` 返回的 `webSocketDebuggerUrl` 指向
OpenClaw 无法访问的地址，则 CDP HTTP 看起来可能正常，但 WebSocket
附加仍会失败。

不要为 local loopback Browserless 配置文件省略 `attachOnly`。
如果没有 `attachOnly`，OpenClaw 会将 local loopback 端口视为本地托管浏览器
配置文件，并可能报告该端口正在使用，但不归 OpenClaw 所有。

## 直接 WebSocket CDP 提供商

一些托管式浏览器服务公开的是**直接 WebSocket** 端点，而不是
基于 HTTP 的标准 CDP 发现端点（`/json/version`）。OpenClaw 接受三种
CDP URL 形式，并自动选择正确的连接策略：

- **HTTP(S) 发现** - `http://host[:port]` 或 `https://host[:port]`。
  OpenClaw 调用 `/json/version` 来发现 WebSocket 调试器 URL，然后
  建立连接。不回退到 WebSocket。
- **直接 WebSocket 端点** - `ws://host[:port]/devtools/<kind>/<id>`，或
  路径为 `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 的
  `wss://...`。OpenClaw 直接通过 WebSocket 握手连接，并完全跳过
  `/json/version`。
- **裸 WebSocket 根地址** - 不含 `/devtools/...` 路径的
  `ws://host[:port]` 或 `wss://host[:port]`（例如 [Browserless](https://browserless.io)、
  [Browserbase](https://www.browserbase.com)）。OpenClaw 首先尝试通过 HTTP
  `/json/version` 进行发现（将协议规范化为 `http`/`https`）；
  如果发现结果返回 `webSocketDebuggerUrl`，则使用该 URL；否则 OpenClaw
  会回退到在裸根地址上直接进行 WebSocket 握手。如果公布的
  WebSocket 端点拒绝 CDP 握手，但配置的裸根地址
  接受握手，OpenClaw 也会回退到该根地址。这样，指向本地 Chrome 的裸 `ws://`
  仍可连接，因为 Chrome 只接受在 `/json/version` 返回的特定目标路径上进行 WebSocket
  升级；同时，当托管提供商的发现
  端点公布不适用于 Playwright CDP 的短期 URL 时，它们仍可使用其根 WebSocket 端点。

`openclaw browser doctor` 使用与运行时附加相同的“优先发现、回退 WebSocket”
逻辑，因此诊断不会将能够成功连接的裸根 URL
报告为无法访问。

### Browserbase

[Browserbase](https://www.browserbase.com) 是一个用于运行
无头浏览器的云平台，内置 CAPTCHA 解决、隐身模式和住宅
代理功能。

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

注意：

- [注册](https://www.browserbase.com/sign-up)，并从 [Overview dashboard](https://www.browserbase.com/overview)
  复制你的 **API Key**。
- 将 `<BROWSERBASE_API_KEY>` 替换为你真实的 Browserbase API 密钥。
- Browserbase 会在 WebSocket 连接时自动创建浏览器会话，因此无需
  手动创建会话。
- 有关当前免费层级限制和付费计划，请参阅[定价](https://www.browserbase.com/pricing)。
- 有关完整 API 参考、SDK 指南和集成示例，请参阅
  [Browserbase 文档](https://docs.browserbase.com)。

### Notte

[Notte](https://www.notte.cc) 是一个用于运行无头
浏览器的云平台，内置隐身功能、住宅代理和原生 CDP
WebSocket Gateway 网关。

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

注意：

- [注册](https://console.notte.cc)，并从
  控制台设置页面复制你的 **API Key**。
- 将 `<NOTTE_API_KEY>` 替换为你真实的 Notte API 密钥。
- Notte 会在 WebSocket 连接时自动创建浏览器会话，因此无需手动
  创建会话。WebSocket 断开连接时，该会话会被销毁。
- 有关当前免费层级限制和付费计划，请参阅[定价](https://www.notte.cc/#pricing)。
- 有关完整 API 参考、SDK
  指南和集成示例，请参阅 [Notte 文档](https://docs.notte.cc)。

## 安全

核心要点：

- 浏览器控制仅限 local loopback；访问通过 Gateway 网关的身份验证或节点配对进行。
- 独立的 local loopback 浏览器 HTTP API **仅使用共享密钥身份验证**：
  Gateway 网关令牌承载身份验证、`x-openclaw-password`，或使用
  已配置 Gateway 网关密码的 HTTP Basic 身份验证。
- Tailscale Serve 身份标头和 `gateway.auth.mode: "trusted-proxy"`
  **不会**对此独立的 local loopback 浏览器 API 进行身份验证。
- 如果启用了浏览器控制，但未配置共享密钥身份验证，OpenClaw
  会在启动时自动生成并持久化浏览器控制凭据：
  当 `gateway.auth.mode` 为 `none` 时生成令牌，当其为
  `trusted-proxy` 时生成密码（通过 `gateway.auth.password` 持久化，以便进程外
  local loopback 客户端能够解析它）。如果已为该模式显式配置
  字符串凭据，或 `gateway.auth.mode` 为 `password`，
  则跳过自动生成。
- 如果你希望使用自己控制的稳定密钥而非生成的密钥，请显式配置
  `gateway.auth.token`、`gateway.auth.password`、`OPENCLAW_GATEWAY_TOKEN` 或
  `OPENCLAW_GATEWAY_PASSWORD`。

远程 CDP 提示：

- 尽可能优先使用加密端点（HTTPS 或 WSS）和短期令牌。
- 避免将长期令牌直接嵌入配置文件。
- 将 Gateway 网关和所有节点主机保留在私有网络（Tailscale）中；避免公开暴露。
- 将远程 CDP URL/令牌视为密钥；优先使用环境变量或密钥管理器。

## 配置文件（多浏览器）

OpenClaw 支持多个具名配置文件（路由配置）。配置文件可以是：

- **OpenClaw 托管**：一个专用的基于 Chromium 的浏览器实例，具有自己的用户数据目录和 CDP 端口
- **远程**：显式 CDP URL（在其他位置运行的基于 Chromium 的浏览器）
- **现有会话**：通过 Chrome DevTools MCP 自动连接使用你现有的 Chrome 配置文件

默认值：

- 如果缺少 `openclaw` 配置文件，则会自动创建。
- `user` 配置文件是内置的，用于 Chrome MCP 现有会话附加。
- 除 `user` 外，现有会话配置文件需选择启用；使用 `--driver existing-session` 创建。
- 默认情况下，本地 CDP 端口从 **18800-18899** 范围分配。
- 删除配置文件会将其本地数据目录移至废纸篓。

所有控制端点均接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## 通过 Chrome DevTools MCP 使用现有会话

OpenClaw 还可以通过官方 Chrome DevTools MCP 服务器附加到正在运行的
基于 Chromium 的浏览器配置文件。这样会复用该浏览器配置文件中
已打开的标签页和登录状态。

官方背景资料和设置参考：

- [Chrome for Developers：将 Chrome DevTools MCP 与浏览器会话配合使用](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

内置配置文件：`user`。如果你希望使用不同的名称、颜色或浏览器数据目录，
请创建自己的自定义现有会话配置文件。

默认情况下，内置的 `user` 配置文件使用 Chrome MCP 自动连接，其目标是
默认的本地 Google Chrome 配置文件。对于 Brave、Edge、Chromium 或非默认 Chrome 配置文件，请使用 `userDataDir`。`~` 会展开为你的操作系统主
目录：

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

成功时的表现：

- `status` 显示 `driver: existing-session`
- `status` 显示 `transport: chrome-mcp`
- `status` 显示 `running: true`
- `tabs` 列出浏览器中已打开的标签页
- `snapshot` 返回所选实时标签页的引用

如果附加无法正常工作，请检查：

- 目标基于 Chromium 的浏览器版本为 `144+`
- 已在该浏览器的检查页面中启用远程调试
- 浏览器已显示附加同意提示，并且你已接受
- 如果 Chrome 使用显式 `--remote-debugging-port` 启动，请将
  `browser.profiles.<name>.cdpUrl` 设置为该 DevTools 端点，而不是依赖
  Chrome MCP 自动连接
- `openclaw doctor` 会迁移基于旧扩展的浏览器配置，并检查默认自动连接配置文件所需的
  Chrome 是否安装在本地，但它无法代你启用
  浏览器端远程调试

智能体使用：

- 当你需要用户已登录的浏览器状态时，请使用 `profile="user"`。
- 如果使用自定义的现有会话配置文件，请传入该配置文件的明确名称。
- 仅当用户在计算机旁、能够批准附加提示时，才选择此模式。
- Gateway 网关或节点主机可以启动 `npx chrome-devtools-mcp@latest --autoConnect`。

注意：

- 与隔离的 `openclaw` 配置文件相比，此路径风险更高，因为它可以在你已登录的浏览器会话中执行操作。
- OpenClaw 不会为此驱动程序启动浏览器；它只会附加到浏览器。
- OpenClaw 在此使用官方 Chrome DevTools MCP `--autoConnect` 流程。如果设置了 `userDataDir`，则会将其透传，以定位到该用户数据目录。
- 现有会话可以附加到所选主机，也可以通过已连接的浏览器节点附加。如果 Chrome 位于其他位置且未连接浏览器节点，请改用远程 CDP 或节点主机。
- Chrome MCP 目标和快照引用的作用域仅限于一个 MCP 子进程。该进程重启后，请再次运行 `browser tabs`，在执行特定于目标的操作前明确选择一个新目标，并在使用引用前获取新快照。每个引用仅对其目标和最新快照有效。即使替代标签页的 URL 相同，旧别名也不会转移到该标签页。
- Chrome DevTools MCP 当前通过进程本地的数字页面 ID 路由页面工具。进程作用域的句柄可防止跨子进程替换复用，但相邻工具调用之间发生进程内浏览器上下文替换时，仍可能将操作重新定向。要实现完全原子的路由，需要上游页面工具支持稳定的目标 ID。

### 自定义 Chrome MCP 启动

当默认的 `npx chrome-devtools-mcp@latest` 流程不符合你的需求时（离线主机、固定版本、内置二进制文件），可以按配置文件覆盖所启动的 Chrome DevTools MCP 服务器：

| 字段         | 作用                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | 用于代替 `npx` 启动的可执行文件。按原样解析；支持绝对路径。                                                                |
| `mcpArgs`    | 原样传递给 `mcpCommand` 的参数数组。替换默认的 `chrome-devtools-mcp@latest --autoConnect` 参数。                            |

在现有会话配置文件中设置 `cdpUrl` 后，OpenClaw 会跳过 `--autoConnect`，并自动将端点转发给 Chrome MCP：

- `http(s)://...` → `--browserUrl <url>`（DevTools HTTP 发现端点）。
- `ws(s)://...` → `--wsEndpoint <url>`（直接 CDP WebSocket）。

端点标志不能与 `userDataDir` 组合使用：设置 `cdpUrl` 后，Chrome MCP 启动时会忽略 `userDataDir`，因为 Chrome MCP 会附加到端点背后的运行中浏览器，而不是打开配置文件目录。

<Accordion title="现有会话功能限制">

与托管的 `openclaw` 配置文件相比，现有会话驱动程序受到更多限制：

- **屏幕截图** - 支持页面捕获和基于 `--ref` 的元素捕获；不支持 CSS `--element` 选择器。页面截图或基于引用的元素截图不需要 Playwright。（在任何配置文件中，`--full-page` 都不能与 `--ref` 或 `--element` 组合使用，并非仅限现有会话。）
- **操作** - `click`、`type`、`hover`、`scrollIntoView`、`drag` 和 `select` 需要快照引用（不支持 CSS 选择器）。`click-coords` 点击可见视口坐标，不需要快照引用。`click` 仅支持鼠标左键（不支持覆盖按钮或修饰键）。`type` 不支持 `slowly=true`；请使用 `fill` 或 `press`。`press` 不支持 `delayMs`。`type`、`hover`、`scrollIntoView`、`drag`、`select` 和 `fill` 不支持按调用覆盖 `timeoutMs`；`evaluate` 支持。`select` 接受单个值。不支持 `batch`；请逐个发送操作。
- **等待 / 上传 / 对话框** - `wait --url` 支持精确、子字符串和 glob 模式（与托管模式相同）；现有会话配置文件不支持 `wait --load networkidle`（托管和原始/远程 CDP 配置文件支持）。上传钩子需要 `ref` 或 `inputRef`，每次只能上传一个文件，不支持 CSS `element`。对话框钩子不支持超时覆盖或 `dialogId`。
- **对话框可见性** - 当某个操作打开模态对话框时，托管浏览器操作响应会包含 `blockedByDialog` 和 `browserState.dialogs.pending`；快照也会包含待处理的对话框状态。存在待处理对话框时，请使用 `browser dialog --accept/--dismiss --dialog-id <id>` 响应。在 OpenClaw 外部处理的对话框会显示在 `browserState.dialogs.recent` 下。
- **仅限托管模式的功能** - PDF 导出、下载拦截和 `responsebody` 仍需要使用托管浏览器路径。

</Accordion>

## 隔离保证

- **专用用户数据目录**：绝不会访问你的个人浏览器配置文件。
- **专用端口**：避开 `9222`，以防与开发工作流冲突。
- **确定性的标签页控制**：`tabs` 首先返回 `suggestedTargetId`，然后返回稳定的 `tabId` 句柄（例如 `t1`）、可选标签以及原始 `targetId`。智能体应复用 `suggestedTargetId`；原始 ID 仍可用于调试和兼容性。

## 浏览器选择

在本地启动时，OpenClaw 会选择第一个可用的浏览器：

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

你可以使用 `browser.executablePath` 覆盖此选择。

平台：

- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：检查 `/usr/bin`、`/snap/bin`、`/opt/google`、`/opt/brave.com`、`/usr/lib/chromium` 和 `/usr/lib/chromium-browser` 下常见的 Chrome/Brave/Edge/Chromium 位置，以及 `PLAYWRIGHT_BROWSERS_PATH` 或 `~/.cache/ms-playwright` 下由 Playwright 管理的 Chromium。
- Windows：检查常见安装位置。

## 控制 API（可选）

为了便于编写脚本和调试，Gateway 网关提供了一个小型的**仅限回环地址的 HTTP 控制 API**，以及配套的 `openclaw browser` CLI（快照、引用、增强等待功能、JSON 输出、调试工作流）。完整参考请参阅[浏览器控制 API](/zh-CN/tools/browser-control)。

## 故障排查

有关 Linux 特有的问题（尤其是 snap Chromium），请参阅[浏览器故障排查](/zh-CN/tools/browser-linux-troubleshooting)。

有关 WSL2 Gateway 网关 + Windows Chrome 分离主机设置，请参阅 [WSL2 + Windows + 远程 Chrome CDP 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)。

### CDP 启动失败与导航 SSRF 阻止

这是两类不同的故障，分别指向不同的代码路径。

- **CDP 启动或就绪失败**意味着 OpenClaw 无法确认浏览器控制平面是否健康。
- **导航 SSRF 阻止**意味着浏览器控制平面健康，但页面导航目标被策略拒绝。

常见示例：

- CDP 启动或就绪失败：
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 当配置了回环地址外部 CDP 服务但未设置 `attachOnly: true` 时：`Port <port> is in use for profile "<name>" but not by openclaw`
- 导航 SSRF 阻止：
  - `open`、`navigate`、快照或打开标签页的流程因浏览器/网络策略错误而失败，但 `start` 和 `tabs` 仍然有效

使用以下最小操作序列区分两者：

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

结果解读方式：

- 如果 `start` 因 `not reachable after start` 而失败，请先排查 CDP 就绪状态。
- 如果 `start` 成功但 `tabs` 失败，则控制平面仍不健康。应将其视为 CDP 可达性问题，而不是页面导航问题。
- 如果 `start` 和 `tabs` 成功，但 `open` 或 `navigate` 失败，则浏览器控制平面已启动，故障位于导航策略或目标页面。
- 如果 `start`、`tabs` 和 `open` 均成功，则基本的托管浏览器控制路径健康。

重要行为细节：

- 即使你未配置 `browser.ssrfPolicy`，浏览器配置也默认使用故障时关闭的 SSRF 策略对象。
- 对于 local loopback `openclaw` 托管配置文件，CDP 健康检查会有意跳过针对 OpenClaw 自身本地控制平面的浏览器 SSRF 可达性强制检查。
- 导航保护是独立的。`start` 或 `tabs` 成功并不意味着后续 `open` 或 `navigate` 的目标会被允许。

安全指南：

- 默认**不要**放宽浏览器 SSRF 策略。
- 与广泛允许私有网络访问相比，应优先使用 `hostnameAllowlist` 或 `allowedHostnames` 等范围明确的主机例外。
- 仅在有意设为可信、需要且已审查私有网络浏览器访问的环境中使用 `dangerouslyAllowPrivateNetwork: true`。

## 智能体工具 + 控制工作原理

智能体获得**一个工具**用于浏览器自动化：

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

映射方式：

- `browser snapshot` 返回稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 执行点击/输入/拖动/选择。
- `browser screenshot` 捕获像素（整个页面、元素或带标签的引用）。
- `browser doctor` 检查 Gateway 网关、插件、配置文件、浏览器和标签页的就绪状态。
- `browser` 接受：
  - 使用 `profile` 选择命名的浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - 使用 `target`（`sandbox` | `host` | `node`）选择浏览器所在位置。
  - 在沙箱隔离的会话中，`target: "host"` 要求 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略 `target`：沙箱隔离的会话默认为 `sandbox`，非沙箱会话默认为 `host`。
  - 如果连接了支持浏览器的节点，该工具可能会自动路由到该节点，除非你固定使用 `target="host"` 或 `target="node"`。

这可以让智能体保持确定性，并避免使用脆弱的选择器。

## 相关内容

- [工具概览](/zh-CN/tools) - 所有可用的智能体工具
- [沙箱隔离](/zh-CN/gateway/sandboxing) - 沙箱隔离环境中的浏览器控制
- [安全性](/zh-CN/gateway/security) - 浏览器控制风险与加固

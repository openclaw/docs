---
read_when:
    - 你需要精确的字段级配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关配置参考，涵盖核心 OpenClaw 键名、默认值，以及指向专用子系统参考的链接
title: 配置参考
x-i18n:
    generated_at: "2026-05-02T05:38:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a5820cac79161975cb4ab4ba8171df3d29366cbee2913d093374e2aa8b604a1
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的核心配置参考。有关面向任务的概览，请参阅 [配置](/zh-CN/gateway/configuration)。

涵盖主要的 OpenClaw 配置界面，并在子系统有自己的更深入参考时链接到相应页面。渠道和插件拥有的命令目录以及深层记忆/QMD 调整项位于它们自己的页面，而不是此页面。

代码真相：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置/插件/渠道元数据
- `config.schema.lookup` 返回一个路径限定的 schema 节点，供下钻工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面验证配置文档基线哈希

智能体查找路径：编辑前，使用 `gateway` 工具操作 `config.schema.lookup` 获取精确的字段级文档和约束。使用 [配置](/zh-CN/gateway/configuration) 获取面向任务的指导，并使用此页面了解更广泛的字段映射、默认值以及指向子系统参考的链接。

专用深度参考：

- [记忆配置参考](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [斜杠命令](/zh-CN/tools/slash-commands)，适用于当前内置 + 打包命令目录
- 拥有相关渠道专属命令表面的渠道/插件页面

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段都是可选的 — 省略时，OpenClaw 会使用安全默认值。

---

## 渠道

各渠道配置键已移至专用页面 — 请参阅 [配置 — 渠道](/zh-CN/gateway/config-channels)，了解 `channels.*`，包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 以及其他内置渠道（凭证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

已移至专用页面 — 请参阅 [配置 — 智能体](/zh-CN/gateway/config-agents)，了解：

- `agents.defaults.*`（工作区、模型、thinking、heartbeat、记忆、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、裁剪）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.speechLocale`：用于 iOS/macOS 上 Talk 语音识别的可选 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转写文本前保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义提供商 / base-URL 设置已移至专用页面 — 请参阅 [配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## Models

提供商定义、模型允许列表和自定义提供商设置位于 [配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。`models` 根级也拥有全局模型目录行为。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：按提供商 id 键控的自定义提供商映射。
- `models.pricing.enabled`：控制后台定价引导。当为 `false` 时，Gateway 网关启动会跳过 OpenRouter 和 LiteLLM 定价目录获取；已配置的 `models.providers.*.models[].cost` 值仍可用于本地成本估算。

## MCP

OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，并由嵌入式 Pi 和其他运行时适配器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令会在配置编辑期间管理此区块，而不会连接到目标服务器。

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`：命名的 stdio 或远程 MCP 服务器定义，供暴露已配置 MCP 工具的运行时使用。远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是 CLI 原生别名，`openclaw mcp set` 和 `openclaw doctor --fix` 会将其规范化为标准 `transport` 字段。
- `mcp.sessionIdleTtlMs`：会话限定的内置 MCP 运行时的空闲 TTL。一次性嵌入式运行会请求运行结束清理；此 TTL 是长生命周期会话和未来调用方的后备机制。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时来热应用。下一次工具发现/使用会根据新配置重新创建它们，因此已移除的 `mcp.servers` 条目会立即被回收，而不是等待空闲 TTL。

有关运行时行为，请参阅 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和 [CLI 后端](/zh-CN/gateway/cli-backends#bundle-mcp-overlays)。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅用于内置 Skills 的可选允许列表（不影响托管/工作区 Skills）。
- `load.extraDirs`：额外的共享 skill 根目录（最低优先级）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，会优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：`metadata.openclaw.install` 规范的 node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使某个 skill 已内置/安装，也会禁用它。
- `entries.<skillKey>.apiKey`：为声明主环境变量的 Skills 提供的便捷项（明文字符串或 SecretRef 对象）。

---

## 插件

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- 设备发现接受原生 OpenClaw 插件以及兼容的 Codex bundle 和 Claude bundle，包括无 manifest 的 Claude 默认布局 bundle。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选允许列表（只加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件限定的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：为 `false` 时，核心会阻止 `before_prompt_build`，并忽略来自旧版 `before_agent_start` 的 prompt 变更字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子和受支持的由 bundle 提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：为 `true` 时，受信任的非内置插件可以从类型化钩子读取原始对话内容，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件为后台子智能体运行请求逐次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖的标准 `provider/model` 目标的可选允许列表。仅在你有意允许任何模型时使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（在可用时由原生 OpenClaw 插件 schema 验证）。
- 渠道插件账号/运行时设置位于 `channels.<id>` 下，并应由拥有该插件的 manifest `channelConfigs` 元数据描述，而不是由中央 OpenClaw 选项注册表描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：Firecrawl API key（接受 SecretRef）。回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API base URL（默认：`https://api.firecrawl.dev`；自托管覆盖必须指向私有/内部端点）。
  - `onlyMainContent`：仅从页面中提取主内容（默认：`true`）。
  - `maxAgeMs`：最大缓存时长，单位为毫秒（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间，单位为秒（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok Web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：记忆 dreaming 设置。有关阶段和阈值，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：主 dreaming 开关（默认 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 节奏（默认为 `"0 3 * * *"`）。
  - `model`：可选的 Dream Diary 子智能体模型覆盖。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；与 `allowedModels` 搭配使用以限制目标。模型不可用错误会使用会话默认模型重试一次；信任或允许列表失败不会静默回退。
  - 阶段策略和阈值是实现细节（不是面向用户的配置键）。
- 完整记忆配置位于 [记忆配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件也可以从 `settings.json` 贡献嵌入式 Pi 默认值；OpenClaw 会将这些默认值作为经过清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁应用。
- `plugins.slots.memory`：选择活动记忆插件 id，或使用 `"none"` 禁用记忆插件。
- `plugins.slots.contextEngine`：选择活动 context engine 插件 id；除非你安装并选择其他 engine，否则默认为 `"legacy"`。

请参阅 [插件](/zh-CN/tools/plugin)。

---

## 浏览器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 会禁用 `act:evaluate` 和 `wait --fn`。
- `tabCleanup` 会在空闲一段时间后，或在会话超出上限时，回收已跟踪的主智能体标签页。设置 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可禁用对应的单项清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置时会被禁用，因此浏览器导航默认保持严格模式。
- 仅在你有意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间也会受到同样的私有网络阻止限制。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 配置显式例外。
- 远程配置文件仅支持附加连接（启动/停止/重置已禁用）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)；当你的提供商提供直接的 DevTools WebSocket URL 时使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程和 `attachOnly` CDP 可达性以及标签页打开请求。托管的 local loopback 配置文件会保留本地 CDP 默认值。
- 如果外部托管的 CDP 服务可通过 loopback 访问，请为该配置文件设置 `attachOnly: true`；否则 OpenClaw 会将该 loopback 端口视为本地托管浏览器配置文件，并可能报告本地端口归属错误。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以附加到所选主机或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以定位特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：使用快照/引用驱动的操作而不是 CSS 选择器定位、单文件上传钩子、无对话框超时覆盖、无 `wait --load networkidle`，并且不支持 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；只有远程 CDP 才需要显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局 `browser.executablePath`。可用它让一个配置文件运行在 Chrome 中，另一个运行在 Brave 中。
- 本地托管配置文件会使用 `browser.localLaunchTimeoutMs` 在进程启动后进行 Chrome CDP HTTP 发现，并使用 `browser.localCdpReadyTimeoutMs` 检查启动后的 CDP websocket 就绪状态。在 Chrome 能成功启动但就绪检查与启动过程发生竞态的较慢主机上，可提高这些值。两个值都必须是最大为 `120000` ms 的正整数；无效配置值会被拒绝。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，在启动 Chromium 前会将其展开为你的 OS 主目录。`existing-session` 配置文件上的每配置文件 `userDataDir` 也会进行波浪号展开。
- 控制服务：仅 loopback（端口派生自 `gateway.port`，默认 `18791`）。
- `extraArgs` 会向本地 Chromium 启动追加额外启动标志（例如 `--disable-gpu`、窗口尺寸或调试标志）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`：原生应用 UI 外观的强调色（Talk Mode 气泡色调等）。
- `assistant`：Control UI 身份覆盖。回退到当前活动智能体身份。

---

## Gateway 网关

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：用于 WS + HTTP 的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版绑定别名**：在 `gateway.bind` 中使用绑定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` 绑定会监听容器内的 `127.0.0.1`。使用 Docker 桥接网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此无法访问 Gateway 网关。使用 `--network host`，或设置 `bind: "lan"`（或将 `bind: "custom"` 与 `customBindHost: "0.0.0.0"` 搭配使用）以监听所有接口。
- **身份验证**：默认必需。非 loopback 绑定要求 Gateway 网关身份验证。实际使用中，这意味着共享令牌/密码，或使用带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认会生成一个令牌。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。两者都配置且未设置模式时，启动以及服务安装/修复流程会失败。
- `gateway.auth.mode: "none"`：显式无身份验证模式。仅用于可信的 local loopback 设置；新手引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将浏览器/用户身份验证委派给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（见 [可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）。默认情况下，此模式预期使用**非 loopback** 代理来源；同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。内部同主机调用方可以使用 `gateway.auth.password` 作为本地直接回退；`gateway.auth.token` 仍与 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份标头可以满足控制界面/WebSocket 身份验证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 标头身份验证；它们会改用 Gateway 网关的常规 HTTP 身份验证模式。此无令牌流程假设 Gateway 网关主机可信。当 `tailscale.mode = "serve"` 时默认为 `true`。
- `gateway.auth.rateLimit`：可选的身份验证失败限制器。按客户端 IP 和身份验证范围应用（shared-secret 和 device-token 独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve 控制界面路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败之前被串行化。因此，来自同一客户端的并发错误尝试可能会在第二个请求触发限制器，而不是两个请求都作为普通不匹配竞态通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；当你有意希望 localhost 流量也受到速率限制时（用于测试设置或严格代理部署），请设置为 `false`。
- 浏览器来源的 WS 身份验证尝试始终会被节流，并且禁用 loopback 豁免（作为防御浏览器型 localhost 暴力破解的纵深防御）。
- 在 loopback 上，这些浏览器来源的锁定会按规范化后的 `Origin`
  值隔离，因此来自某个 localhost 来源的重复失败不会自动
  锁定另一个来源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback 绑定）或 `funnel`（公开，需要身份验证）。
- `controlUi.allowedOrigins`：用于 Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。当预期浏览器客户端来自非 loopback 来源时必需。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host 标头来源策略的部署启用 Host 标头来源回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端进程环境
  破例覆盖项，允许向可信私有网络
  IP 使用明文 `ws://`；明文默认仍仅限 loopback。没有对应的 `openclaw.json`
  配置，并且诸如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 之类的浏览器私有网络配置不会影响 Gateway 网关
  WebSocket 客户端。
- `gateway.remote.token` / `.password` 是远程客户端凭据字段。它们本身不会配置 Gateway 网关身份验证。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 构建在向 Gateway 网关发布由中继支持的注册后，用于外部 APNs 中继的基础 HTTPS URL。此 URL 必须与编译进 iOS 构建的中继 URL 匹配。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到中继的发送超时，单位为毫秒。默认为 `10000`。
- 由中继支持的注册会委派给特定的 Gateway 网关身份。配对的 iOS 应用会获取 `gateway.identity.get`，在中继注册中包含该身份，并将注册范围的发送授权转发给 Gateway 网关。另一个 Gateway 网关无法复用该已存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上方中继配置的临时环境变量覆盖项。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅开发用途的逃生开关，用于 loopback HTTP 中继 URL。生产中继 URL 应保持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：预身份验证 Gateway 网关 WebSocket 握手超时，单位为毫秒。默认：`15000`。设置 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 时它优先。在负载较高或低功耗主机上，如果本地客户端可能在启动预热仍在稳定时连接，请增大此值。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔，单位为分钟。设置为 `0` 可全局禁用健康监控重启。默认：`5`。
- `gateway.channelStaleEventThresholdMinutes`：过期套接字阈值，单位为分钟。保持此值大于或等于 `gateway.channelHealthCheckMinutes`。默认：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号在滚动一小时内的最大健康监控重启次数。默认：`10`。
- `channels.<provider>.healthMonitor.enabled`：每渠道选择退出健康监控重启，同时保持全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的每账号覆盖项。设置后，它优先于渠道级覆盖项。
- 只有在 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可以使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且无法解析，解析会失败关闭（不会用远程回退掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。loopback 条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**让 loopback 请求有资格使用 `gateway.auth.mode: "trusted-proxy"`。
- `allowRealIpFallback`：当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选的 CIDR/IP 允许列表，用于自动批准首次节点设备配对，且无请求的范围。未设置时禁用。它不会自动批准操作员/浏览器/控制界面/WebChat 配对，也不会自动批准角色、范围、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在配对和平台允许列表评估后，对声明的节点命令进行全局允许/拒绝塑形。使用 `allowCommands` 选择启用危险节点命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台默认值或显式允许原本会包含某个命令，`denyCommands` 也会移除它。节点更改其声明的命令列表后，请拒绝并重新批准该设备配对，以便 Gateway 网关存储更新后的命令快照。
- `gateway.tools.deny`：为 HTTP `POST /tools/invoke` 阻止的额外工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 获取。
- 可选响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅为你控制的 HTTPS 来源设置；见 [可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在一台主机上使用唯一端口和状态目录运行多个 Gateway 网关：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`：在 Gateway 网关监听器处启用 TLS 终止（HTTPS/WSS）（默认：`false`）。
- `autoGenerate`：未配置显式文件时，自动生成本地自签名证书/密钥对；仅用于本地/开发。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；保持权限受限。
- `caPath`：用于客户端验证或自定义信任链的可选 CA 捆绑包路径。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`：控制配置编辑在运行时如何应用。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置更改时始终重启 Gateway 网关进程。
  - `"hot"`：在进程内应用更改而不重启。
  - `"hybrid"`（默认）：先尝试热重载；如果需要则回退到重启。
- `debounceMs`：应用配置更改前的防抖窗口，单位为毫秒（非负整数）。
- `deferralTimeoutMs`：在强制重启前等待进行中操作的可选最长时间，单位为毫秒。省略它以使用默认有界等待（`300000`）；设置为 `0` 表示无限期等待并定期记录仍在等待的警告。

---

## 钩子

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

身份验证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查询字符串钩子令牌会被拒绝。

验证与安全注意事项：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；重复使用 Gateway 网关令牌会被拒绝。
- `hooks.path` 不能是 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个映射或预设使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要该选择加入。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认值：`false`）时，才接受请求载荷中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染的映射 `sessionKey` 值会被视为外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- `{{messages[0].subject}}` 这样的模板会从载荷读取。
- `transform` 可以指向返回钩子操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且保留在 `hooks.transformsDir` 内（绝对路径和路径遍历会被拒绝）。
- `agentId` 路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 全部允许，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于没有显式 `sessionKey` 的钩子智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任何映射或预设使用模板化的 `sessionKey` 时，它会变为必需。
- `deliver: true` 会将最终回复发送到某个渠道；`channel` 默认为 `last`。
- `model` 会覆盖此钩子运行的 LLM（如果设置了模型目录，则必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留这种按消息路由，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果需要 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖该预设，而不是使用模板化默认值。

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 配置后，Gateway 网关会在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可禁用。
- 不要在 Gateway 网关旁边单独运行 `gog gmail watch serve`。

---

## Canvas 主机

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 在 Gateway 网关端口下通过 HTTP 提供智能体可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保留 `gateway.bind: "loopback"`（默认值）。
- 非 loopback 绑定：canvas 路由需要 Gateway 网关认证（令牌/密码/可信代理），与其他 Gateway 网关 HTTP 表面相同。
- Node WebView 通常不会发送认证标头；节点配对并连接后，Gateway 网关会公布节点作用域的能力 URL，用于 canvas/A2UI 访问。
- 能力 URL 绑定到活动节点 WS 会话，并且很快过期。不使用基于 IP 的回退。
- 将实时重载客户端注入到所提供的 HTML 中。
- 为空时自动创建起始 `index.html`。
- 还会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
- 对于大型目录或 `EMFILE` 错误，请禁用实时重载。

---

## 设备发现

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（默认值）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 当系统主机名是有效 DNS 标签时，主机名默认使用系统主机名，否则回退到 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS。

设置：`openclaw dns setup --apply`。

---

## 环境

### `env`（内联环境变量）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 仅当进程环境变量缺少该键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件导入缺失的预期键名。
- 完整优先级请参阅[环境](/zh-CN/help/environment)。

### 环境变量替换

在任何配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 只匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/空变量会在配置加载时报错。
- 使用 `$${VAR}` 转义为字面量 `${VAR}`。
- 可与 `$include` 配合使用。

---

## 密钥

密钥引用是增量式的：明文值仍然可用。

### `SecretRef`

使用一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

校验：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id 不得包含 `.` 或 `..` 这样的以斜杠分隔的路径段（例如 `a/../b` 会被拒绝）

### 支持的凭据表面

- 规范矩阵：[SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 面向受支持的 `openclaw.json` 凭据路径。
- `auth-profiles.json` 引用包含在运行时解析和审计覆盖范围内。

### 密钥提供商配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注意：

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式下，`id` 必须是 `"value"`）。
- 当 Windows ACL 校验不可用时，file 和 exec 提供商路径会以关闭失败方式处理。仅对无法校验但可信的路径设置 `allowInsecurePath: true`。
- `exec` 提供商需要绝对 `command` 路径，并通过 stdin/stdout 使用协议载荷。
- 默认情况下，符号链接命令路径会被拒绝。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时校验解析后的目标路径。
- 如果配置了 `trustedDirs`，可信目录检查会应用于解析后的目标路径。
- 默认情况下，`exec` 子进程环境是最小化的；使用 `passEnv` 显式传入所需变量。
- 密钥引用会在激活时解析到内存快照中，随后请求路径只读取该快照。
- 激活期间会应用活动表面过滤：已启用表面上的未解析引用会导致启动/重载失败，而非活动表面会被跳过并附带诊断信息。

---

## 凭证存储

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 每个智能体的配置文件存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持静态凭据模式的值级引用（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 旧版扁平 `auth-profiles.json` 映射（例如 `{ "provider": { "apiKey": "..." } }`）不是运行时格式；`openclaw doctor --fix` 会将它们重写为规范的 `provider:default` API key 配置文件，并生成 `.legacy-flat.*.bak` 备份。
- OAuth 模式配置文件（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭据。
- 静态运行时凭据来自已解析的内存快照；发现旧版静态 `auth.json` 条目时会将其清理。
- 旧版 OAuth 从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参阅 [OAuth](/zh-CN/concepts/oauth)。
- 密钥运行时行为以及 `audit/configure/apply` 工具：[密钥管理](/zh-CN/gateway/secrets)。

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`：当配置文件因真实的账单/额度不足错误而失败时的基础退避时间（小时，默认值：`5`）。即使在 `401`/`403` 响应上，显式账单文本仍可能归入这里，但特定提供商的文本匹配器仍限定在其所属提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 用量窗口或组织/工作区支出限额消息会继续走 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的按提供商覆盖账单退避小时数。
- `billingMaxHours`：账单退避指数增长的小时上限（默认值：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避时间（分钟，默认值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认值：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口（小时，默认值：`24`）。
- `overloadedProfileRotations`：在切换到模型回退之前，因过载错误允许的最大同提供商 auth-profile 轮换次数（默认值：`1`）。`ModelNotReadyException` 等提供商繁忙形态会归入这里。
- `overloadedBackoffMs`：重试过载的提供商/配置文件轮换前的固定延迟（默认值：`0`）。
- `rateLimitedProfileRotations`：在切换到模型回退之前，因速率限制错误允许的最大同提供商 auth-profile 轮换次数（默认值：`1`）。该速率限制桶包含提供商形态文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 日志记录

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 以使用稳定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：轮转前活动日志文件的最大大小（字节）（正整数；默认：`104857600` = 100 MB）。OpenClaw 会在活动文件旁最多保留五个带编号的归档文件。
- `redactSensitive` / `redactPatterns`：尽力对控制台输出、文件日志、OTLP 日志记录以及持久化的会话转录文本进行遮蔽。`redactSensitive: "off"` 只会禁用这项通用日志/转录策略；UI/工具/诊断安全表面在发出前仍会遮蔽密钥。

---

## 诊断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`：检测输出的主开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持像 `"telegram.*"` 或 `"*"` 这样的通配符）。
- `stuckSessionWarnMs`：用于将长时间运行的处理会话分类为 `session.long_running`、`session.stalled` 或 `session.stuck` 的无进展时间阈值（毫秒）。回复、工具、Status、分块和 ACP 进度会重置计时器；重复的 `session.stuck` 诊断在未变化时会退避。
- `otel.enabled`：启用 OpenTelemetry 导出流水线（默认：`false`）。完整配置、信号目录和隐私模型请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的信号专用 OTLP 端点。设置后，它们只会为对应信号覆盖 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用链路追踪、指标或日志导出。
- `otel.sampleRate`：链路追踪采样率 `0`–`1`。
- `otel.flushIntervalMs`：定期遥测刷新间隔（毫秒）。
- `otel.captureContent`：选择性启用 OTEL span 属性的原始内容捕获。默认关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式允许你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：启用最新实验性 GenAI span 提供商属性的环境开关。默认情况下，span 会保留旧版 `gen_ai.system` 属性以保持兼容；GenAI 指标使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：用于已注册全局 OpenTelemetry SDK 的宿主的环境开关。随后 OpenClaw 会跳过插件拥有的 SDK 启动/关闭，同时保持诊断监听器处于活动状态。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：在对应配置键未设置时使用的信号专用端点环境变量。
- `cacheTrace.enabled`：为嵌入式运行记录缓存追踪快照（默认：`false`）。
- `cacheTrace.filePath`：缓存追踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存追踪输出中包含哪些内容（全部默认：`true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`：npm/git 安装的发布渠道，即 `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小延迟小时数（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：stable 渠道发布扩散的额外时间窗口（小时）（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行的频率（小时）（默认：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`：全局 ACP 功能门控（默认：`true`；设为 `false` 可隐藏 ACP 分发和生成入口）。
- `dispatch.enabled`：ACP 会话轮次分发的独立门控（默认：`true`）。设为 `false` 可保留 ACP 命令可用，同时阻止执行。
- `backend`：默认 ACP 运行时后端 ID（必须匹配已注册的 ACP 运行时插件）。
  如果设置了 `plugins.allow`，请包含后端插件 ID（例如 `acpx`），否则内置默认插件不会加载。
- `defaultAgent`：生成时未指定显式目标时的后备 ACP 目标智能体 ID。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 ID 允许列表；为空表示没有额外限制。
- `maxConcurrentSessions`：可同时处于活动状态的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口（毫秒）。
- `stream.maxChunkChars`：拆分流式分块投影前的最大分块大小。
- `stream.repeatSuppression`：每个轮次抑制重复的 Status/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 会增量流式传输；`"final_only"` 会缓冲到轮次终止事件。
- `stream.hiddenBoundarySeparator`：隐藏工具事件后的可见文本前的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的最大助手输出字符数。
- `stream.maxSessionUpdateChars`：投影 ACP 状态/更新行的最大字符数。
- `stream.tagVisibility`：标签名称到流式事件布尔可见性覆盖的记录。
- `runtime.ttlMinutes`：ACP 会话 worker 符合清理条件前的空闲 TTL（分钟）。
- `runtime.installCommand`：引导 ACP 运行时环境时运行的可选安装命令。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` 控制横幅标语样式：
  - `"random"`（默认）：轮换的幽默/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍会显示横幅标题/版本）。
- 如需隐藏整个横幅（而不仅是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

---

## 向导

CLI 引导式设置流程（`onboard`、`configure`、`doctor`）写入的元数据：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## 身份

请参阅 [智能体默认值](/zh-CN/gateway/config-agents#agent-defaults) 下的 `agents.list` 身份字段。

---

## Bridge（旧版，已移除）

当前构建不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键不再属于配置架构的一部分（在移除前验证会失败；`openclaw doctor --fix` 可以移除未知键）。

<Accordion title="Legacy bridge config (historical reference)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`：已完成的隔离 Cron 运行会话在从 `sessions.json` 裁剪前保留多长时间。也控制已归档删除的 Cron 转录的清理。默认：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：裁剪前每个运行日志文件（`cron/runs/<jobId>.jsonl`）的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志裁剪时保留的最新行数。默认：`2000`。
- `webhookToken`：用于 Cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；如果省略，则不会发送 auth 标头。
- `webhook`：已弃用的旧版后备 webhook URL（http/https），仅用于仍包含 `notify: true` 的已存储任务。

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`：一次性任务在瞬时错误上的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组（毫秒）（默认：`[30000, 60000, 300000]`；1–10 项）。
- `retryOn`：触发重试的错误类型，即 `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则重试所有瞬时类型。

仅适用于一次性 Cron 任务。重复任务使用单独的失败处理。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`：启用 Cron 任务失败提醒（默认：`false`）。
- `after`：触发提醒前的连续失败次数（正整数，最小：`1`）。
- `cooldownMs`：同一任务重复提醒之间的最小毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入提醒阈值（默认：`false`）。跳过的运行会单独跟踪，不会影响执行错误退避。
- `mode`：投递模式，即 `"announce"` 通过渠道消息发送；`"webhook"` 发布到已配置的 webhook。
- `accountId`：用于限定提醒投递范围的可选账号或渠道 ID。

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- 所有作业的 cron 失败通知的默认目标位置。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够目标数据时，默认为 `"announce"`。
- `channel`：用于公告投递的渠道覆盖项。`"last"` 会复用最后已知的投递渠道。
- `to`：显式公告目标或 webhook URL。webhook 模式必填。
- `accountId`：用于投递的可选账号覆盖项。
- 单个作业的 `delivery.failureDestination` 会覆盖此全局默认值。
- 当既未设置全局失败目标位置，也未设置单个作业失败目标位置时，已经通过 `announce` 投递的作业会在失败时回退到该主要公告目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 作业，除非该作业的主要 `delivery.mode` 为 `"webhook"`。

参见 [Cron 作业](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                                |
| `{{RawBody}}`      | 原始正文（无历史记录/发送者包装）                 |
| `{{BodyStripped}}` | 移除群组提及后的正文                              |
| `{{From}}`         | 发送者标识符                                      |
| `{{To}}`           | 目标标识符                                        |
| `{{MessageSid}}`   | 渠道消息 ID                                       |
| `{{SessionId}}`    | 当前会话 UUID                                     |
| `{{IsNewSession}}` | 创建新会话时为 `"true"`                           |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                    |
| `{{MediaPath}}`    | 本地媒体路径                                      |
| `{{MediaType}}`    | 媒体类型（图片/音频/文档/……）                     |
| `{{Transcript}}`   | 音频转录文本                                      |
| `{{Prompt}}`       | CLI 条目的已解析媒体提示词                        |
| `{{MaxChars}}`     | CLI 条目的已解析最大输出字符数                    |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群组主题（尽力而为）                              |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）                          |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）                        |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）                        |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等）      |

---

## 配置包含（`$include`）

将配置拆分到多个文件：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合并行为：**

- 单个文件：替换包含它的对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在包含项之后合并（覆盖已包含的值）。
- 嵌套包含：最多 10 层。
- 路径：相对于包含它的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。绝对路径/`../` 形式仅在仍解析到该边界内时才允许。
- OpenClaw 拥有的写入如果只更改一个由单文件包含支持的顶层部分，会写入该被包含文件。例如，`plugins install` 会在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，并保持 `openclaw.json` 不变。
- 根包含、包含数组以及带有同级覆盖项的包含，对 OpenClaw 拥有的写入是只读的；这些写入会失败关闭，而不是展平配置。
- 错误：针对缺失文件、解析错误和循环包含提供清晰消息。

---

_相关：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

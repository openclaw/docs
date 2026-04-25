---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关 配置参考，涵盖核心 OpenClaw 键名、默认值以及指向各专用子系统参考文档的链接
title: 配置参考
x-i18n:
    generated_at: "2026-04-25T17:30:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0578d9e78c063f579922498b993a2fd4398c66dc01d1e89ccaa56b777467c2
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若需面向任务的概览，请参阅 [配置](/zh-CN/gateway/configuration)。

本文涵盖 OpenClaw 的主要配置面，并在某个子系统拥有更深入的专用参考时提供链接。由渠道和插件自行管理的命令目录，以及深入的 memory/QMD 调节项，位于各自独立页面，而不在本页中说明。

代码事实依据：

- `openclaw config schema` 会输出用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置/插件/渠道元数据
- `config.schema.lookup` 会返回单个按路径作用域划分的 schema 节点，供下钻工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面对配置文档基线哈希进行验证

专用深入参考：

- [内存配置参考](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及位于 `plugins.entries.memory-core.config.dreaming` 下的 Dreaming 配置
- [斜杠命令](/zh-CN/tools/slash-commands)，适用于当前内置 + 捆绑命令目录
- 各自所属的渠道/插件页面，适用于渠道专属命令面

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段均为可选 —— OpenClaw 在省略时会使用安全默认值。

---

## 渠道

每个渠道的配置键已迁移到专用页面 —— 请参阅
[配置 — 渠道](/zh-CN/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 及其他
内置渠道（认证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

已迁移到专用页面 —— 请参阅
[配置 — 智能体](/zh-CN/gateway/config-agents)，内容包括：

- `agents.defaults.*`（工作区、模型、思考、心跳、内存、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由与绑定）
- `session.*`（会话生命周期、压缩、清理）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保持平台默认的暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、由 provider 支持的工具配置，以及自定义
provider / 基础 URL 设置，已迁移到专用页面 —— 请参阅
[配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## MCP

由 OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，
供嵌入式 Pi 和其他运行时适配器使用。`openclaw mcp list`、
`show`、`set` 和 `unset` 命令可管理此配置块，且在编辑配置期间不会连接到
目标服务器。

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

- `mcp.servers`：已命名的 stdio 或远程 MCP 服务器定义，供公开已配置 MCP 工具的运行时使用。
- `mcp.sessionIdleTtlMs`：面向会话作用域的内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求在运行结束时清理；此 TTL 是面向
  长生命周期会话和未来调用方的兜底机制。
- `mcp.*` 下的变更会通过释放缓存的会话 MCP 运行时来热应用。
  下一次工具发现/使用时会根据新配置重新创建它们，因此被移除的
  `mcp.servers` 条目会立即被回收，而不是等待空闲 TTL 到期。

有关运行时行为，请参阅 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和
[CLI 后端](/zh-CN/gateway/cli-backends#bundle-mcp-overlays)。

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

- `allowBundled`：仅适用于内置技能的可选允许列表（受管理/工作区技能不受影响）。
- `load.extraDirs`：额外的共享技能根目录（优先级最低）。
- `install.preferBrew`：为 true 时，如果存在 `brew`，
  将优先使用 Homebrew 安装器，然后才回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规范的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使技能已内置/已安装，也会禁用该技能。
- `entries.<skillKey>.apiKey`：为声明了主环境变量的技能提供的便捷字段（明文字符串或 SecretRef 对象）。

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
- 发现机制接受原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括无 manifest 的 Claude 默认布局 bundle。
- **配置变更需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先生效。
- `plugins.entries.<id>.apiKey`：插件级 API 密钥便捷字段（插件支持时可用）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子，以及受支持的由 bundle 提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非内置插件可以从 `llm_input`、`llm_output` 和 `agent_end` 等类型化钩子中读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件，使其可为后台子智能体运行请求按次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：适用于受信任子智能体覆盖的规范 `provider/model` 目标的可选允许列表。仅当你确实有意允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（可在可用时由原生 OpenClaw 插件 schema 验证）。
- 渠道插件的账号/运行时设置位于 `channels.<id>` 下，应由所属插件 manifest 的 `channelConfigs` 元数据描述，而不是由集中式 OpenClaw 选项注册表描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 网页抓取 provider 设置。
  - `apiKey`：Firecrawl API 密钥（接受 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主内容（默认：`true`）。
  - `maxAgeMs`：最大缓存保留时间，单位为毫秒（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时，单位为秒（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 网页搜索）设置。
  - `enabled`：启用 X Search provider。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。有关阶段和阈值，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：Dreaming 总开关（默认 `false`）。
  - `frequency`：每次完整 Dreaming 扫描的 cron 周期（默认值为 `"0 3 * * *"`）。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整的内存配置位于 [内存配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件也可以通过 `settings.json` 提供嵌入式 Pi 默认值；OpenClaw 会将其作为净化后的智能体设置应用，而不是作为原始 OpenClaw 配置补丁应用。
- `plugins.slots.memory`：选择当前激活的内存插件 id，或使用 `"none"` 以禁用内存插件。
- `plugins.slots.contextEngine`：选择当前激活的上下文引擎插件 id；默认值为 `"legacy"`，除非你安装并选择了其他引擎。
- `plugins.installs`：由 CLI 管理的安装元数据，供 `openclaw plugins update` 使用。
  - 包括 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为受管理状态；优先使用 CLI 命令，而不是手动编辑。

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
- `tabCleanup` 会在空闲一段时间后，或当某个
  会话超过其上限时，回收已跟踪的主智能体标签页。将 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 设为
  0，可分别禁用这些单独的清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 在未设置时为禁用状态，因此浏览器导航默认保持严格模式。
- 仅当你明确愿意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/发现检查期间也会受到相同的私有网络阻止规则约束。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受到支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 来设置显式例外。
- 远程配置文件仅支持附加模式（禁用 start/stop/reset）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；使用 WS(S)
  则适用于你的 provider 直接提供 DevTools WebSocket URL 的情况。
- 如果外部管理的 CDP 服务可通过 loopback 访问，请将该
  配置文件的 `attachOnly: true`；否则 OpenClaw 会将该 loopback 端口视为
  本地受管浏览器配置文件，并可能报告本地端口归属错误。
- `existing-session` 配置文件使用 Chrome MCP 而非 CDP，并且可以附加到
  所选主机上，或通过已连接的浏览器节点进行附加。
- `existing-session` 配置文件可设置 `userDataDir`，以指定某个特定的
  基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：
  使用 snapshot/ref 驱动的操作而不是 CSS 选择器定位、单文件上传
  钩子、不支持对话框超时覆盖、不支持 `wait --load networkidle`，以及不支持
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地受管 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 场景下才需要显式设置 `cdpUrl`。
- 本地受管配置文件可设置 `executablePath`，以覆盖该配置文件的全局
  `browser.executablePath`。用它可以让一个配置文件运行在
  Chrome 中，而另一个运行在 Brave 中。
- 本地受管配置文件在进程启动后会使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP
  发现，并使用 `browser.localCdpReadyTimeoutMs` 检查启动后 CDP websocket 就绪情况。
  在较慢的主机上，如果 Chrome 能成功启动但就绪检查与启动过程发生竞争，请提高这些值。
- 自动检测顺序：默认浏览器（若基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 接受 `~` 以表示你的操作系统主目录。
- Control 服务：仅 loopback（端口由 `gateway.port` 派生，默认值为 `18791`）。
- `extraArgs` 会将额外启动标志附加到本地 Chromium 启动命令中（例如
  `--disable-gpu`、窗口大小设置或调试标志）。

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

- `seamColor`：原生应用 UI 外框的强调色（Talk 模式气泡着色等）。
- `assistant`：Control UI 身份覆盖。未设置时回退到当前激活的智能体身份。

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

<Accordion title="Gateway 网关字段详情">

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：用于 WS + HTTP 的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内部监听 `127.0.0.1`。在 Docker bridge 网络（`-p 18789:18789`）下，流量会到达 `eth0`，因此 Gateway 网关不可达。请使用 `--network host`，或设置 `bind: "lan"`（或使用 `bind: "custom"` 并配合 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认必须启用。非 loopback bind 要求 Gateway 网关认证。实际使用中，这意味着共享 token/password，或使用设置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。新手引导向导默认会生成一个 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式将 `gateway.auth.mode` 设为 `token` 或 `password`。若两者均已配置但未设置 mode，则启动以及服务安装/修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅适用于受信任的本地 local loopback 部署；新手引导提示中不会提供此选项，这是有意为之。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知型反向代理，并信任来自 `gateway.trustedProxies` 的身份头（见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求使用**非 loopback** 的代理来源；同机 loopback 反向代理不满足 trusted-proxy 认证要求。
- `gateway.auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份头可用于满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 头认证；它们仍遵循 Gateway 网关的常规 HTTP 认证模式。当 `tailscale.mode = "serve"` 时，默认值为 `true`。
- `gateway.auth.rateLimit`：可选的认证失败限流器。按客户端 IP 和认证作用域生效（共享密钥与设备 token 分别独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，对于相同 `{scope, clientIp}` 的失败尝试，会在写入失败记录前进行串行化。因此，同一客户端并发的错误尝试可能会在第二个请求时触发限流，而不是两个请求都以普通不匹配的方式竞争通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；当你明确希望 localhost 流量也受限流约束时（例如测试环境或严格代理部署），请将其设为 `false`。
- 来自浏览器源的 WS 认证尝试始终会启用限流，且不会豁免 loopback（作为针对基于浏览器的 localhost 暴力破解的纵深防御）。
- 在 loopback 上，这些来自浏览器源的锁定会按规范化后的 `Origin`
  值进行隔离，因此来自某个 localhost 源的重复失败不会自动
  锁定另一个源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开访问，要求认证）。
- `controlUi.allowedOrigins`：用于 Gateway 网关 WebSocket 连接的显式浏览器源允许列表。当预期浏览器客户端来自非 loopback 源时，这是必需项。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，启用 Host 头源回退，用于那些有意依赖 Host 头源策略的部署。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须为 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端进程环境中的紧急放行
  覆盖项，允许对受信任私有网络 IP 使用明文 `ws://`；
  默认情况下，明文连接仍仅限 loopback。没有对应的 `openclaw.json`
  配置项，并且浏览器私有网络配置（例如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`）不会影响 Gateway 网关
  WebSocket 客户端。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身并不会配置 Gateway 网关认证。
- `gateway.push.apns.relay.baseUrl`：用于官方/TestFlight iOS 构建的外部 APNs relay 的基础 HTTPS URL；这些构建会在将基于 relay 的注册发布到 Gateway 网关后使用该 relay。此 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时，单位为毫秒。默认值为 `10000`。
- 基于 relay 的注册会委托给某个特定的 Gateway 网关身份。配对后的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并将一个注册作用域的发送授权转发给 Gateway 网关。另一个 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：对上述 relay 配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅供开发使用的逃生舱配置，用于允许 loopback HTTP relay URL。生产环境的 relay URL 应保持使用 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔，单位为分钟。设为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧套接字阈值，单位为分钟。应保持其大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号在滚动一小时内的最大健康监控重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：用于按渠道选择退出健康监控重启，同时保持全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖项。设置后，其优先级高于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可将 `gateway.remote.*` 用作回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但无法解析，则解析会以关闭失败方式处理（不会被远程回退所掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端头的反向代理 IP。仅列出你控制的代理。loopback 条目对于同机代理/本地检测场景仍然有效（例如 Tailscale Serve 或本地反向代理），但它们**不会**使 loopback 请求有资格使用 `gateway.auth.mode: "trusted-proxy"`。
- `allowRealIpFallback`：为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现关闭失败行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选的 CIDR/IP 允许列表，用于自动批准首次节点设备配对，且该配对未请求任何作用域。未设置时为禁用状态。这不会自动批准 operator/browser/Control UI/WebChat 配对，也不会自动批准角色、作用域、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在配对和允许列表评估完成后，对已声明节点命令进行全局允许/拒绝塑形。
- `gateway.tools.deny`：对 HTTP `POST /tools/invoke` 额外阻止的工具名称（在默认拒绝列表基础上扩展）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 抓取。
- 可选的响应加固头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅针对你控制的 HTTPS 源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在同一主机上运行多个 Gateway 网关时，请为每个实例使用唯一的端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

请参阅 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

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
- `autoGenerate`：当未配置显式文件时，自动生成本地自签名证书/密钥对；仅供本地/开发使用。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；请限制其访问权限。
- `caPath`：可选的 CA bundle 路径，用于客户端验证或自定义信任链。

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 0,
    },
  },
}
```

- `mode`：控制在运行时如何应用配置编辑。
  - `"off"`：忽略实时编辑；变更需要显式重启。
  - `"restart"`：配置发生变化时始终重启 Gateway 网关进程。
  - `"hot"`：不重启，直接在进程内应用变更。
  - `"hybrid"`（默认）：先尝试热重载；如有需要再回退为重启。
- `debounceMs`：应用配置变更前的防抖窗口，单位为毫秒（非负整数）。
- `deferralTimeoutMs`：可选的最长等待时间，单位为毫秒，用于等待进行中的操作完成后再强制重启。省略或设为 `0` 表示无限期等待，并定期记录“仍在等待”的警告。

---

## Hooks

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

认证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查询字符串中的 hook token 会被拒绝。

验证和安全说明：

- `hooks.enabled=true` 要求提供非空的 `hooks.token`。
- `hooks.token` 必须**不同于** `gateway.auth.token`；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个映射或 preset 使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要此显式启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true` 时，才接受请求负载中的 `sessionKey`（默认：`false`）。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 通过模板渲染得到的映射 `sessionKey` 值会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径中的某个负载字段。
- 类似 `{{messages[0].subject}}` 的模板会从负载中读取值。
- `transform` 可以指向一个返回 hook 动作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，且必须位于 `hooks.transformsDir` 范围内（绝对路径和路径穿越会被拒绝）。
- `agentId` 会路由到特定智能体；未知 id 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于未显式提供 `sessionKey` 的 hook 智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方以及由模板驱动的映射会话键设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任意映射或 preset 使用模板化 `sessionKey` 时，它会变为必填项。
- `deliver: true` 会将最终回复发送到某个渠道；`channel` 默认为 `last`。
- `model` 会覆盖本次 hook 运行所使用的 LLM（如果已设置模型目录，则该模型必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由方式，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖该 preset，而不是使用默认的模板化值。

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

- 配置后，Gateway 网关会在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可禁用此行为。
- 不要在 Gateway 网关旁边单独运行另一个 `gog gmail watch serve`。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 通过 Gateway 网关端口下的 HTTP 提供可由智能体编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback bind：canvas 路由与其他 Gateway 网关 HTTP 面相同，要求 Gateway 网关认证（token/password/trusted-proxy）。
- 节点 WebView 通常不会发送认证头；在节点完成配对并连接后，Gateway 网关会公布节点作用域的能力 URL，供 canvas/A2UI 访问使用。
- 能力 URL 绑定到当前活动的节点 WS 会话，并且会很快过期。不使用基于 IP 的回退机制。
- 会将 live-reload 客户端注入到已提供的 HTML 中。
- 为空时会自动创建初始 `index.html`。
- 还会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 变更需要重启 Gateway 网关。
- 对于大型目录或出现 `EMFILE` 错误时，请禁用 live reload。

---

## 设备发现

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` 和 `sshPort`。
- `full`：包含 `cliPath` 和 `sshPort`。
- 主机名默认为 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

会在 `~/.openclaw/dns/` 下写入一个单播 DNS-SD 区域。若要实现跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS。

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

- 仅当进程环境中缺少对应键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录下的 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 完整优先级请参阅 [环境](/zh-CN/help/environment)。

### 环境变量替换

可在任意配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配全大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/为空的变量会在配置加载时报错。
- 使用 `$${VAR}` 可转义为字面量 `${VAR}`。
- 适用于 `$include`。

---

## Secrets

SecretRef 是增量能力：明文值仍然可用。

### `SecretRef`

使用如下对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 id：绝对 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 id 不得包含 `.` 或 `..` 的斜杠分隔路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证面

- 规范矩阵：[SecretRef 凭证面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 会定位受支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` 中的引用会纳入运行时解析和审计覆盖范围。

### Secret providers 配置

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

说明：

- `file` provider 支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式下，`id` 必须为 `"value"`）。
- 当 Windows ACL 验证不可用时，file 和 exec provider 路径会以关闭失败方式处理。仅对无法验证但你信任的路径设置 `allowInsecurePath: true`。
- `exec` provider 要求使用绝对 `command` 路径，并通过 stdin/stdout 传输协议负载。
- 默认情况下，符号链接命令路径会被拒绝。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时会验证解析后的目标路径。
- 如果配置了 `trustedDirs`，则受信任目录检查会应用于解析后的目标路径。
- `exec` 子进程环境默认是最小化的；请使用 `passEnv` 显式传入所需变量。
- Secret 引用会在激活时解析为内存快照，之后请求路径只会读取该快照。
- 激活期间会应用活动表面过滤：已启用表面上的未解析引用会导致启动/重载失败，而不活跃表面会被跳过并记录诊断信息。

---

## 认证存储

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

- 每个智能体的 profile 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持值级别引用（静态凭证模式下，`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- OAuth 模式 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中的已解析快照；发现旧版静态 `auth.json` 条目时会进行清理。
- 旧版 OAuth 会从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参阅 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为以及 `audit/configure/apply` 工具：请参阅 [Secrets 管理](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：当某个 profile 因真实
  计费/额度不足错误失败时的基础退避时长（单位：小时，默认：`5`）。即使在 `401`/`403` 响应中，显式的计费文本
  仍可能落入这里，但 provider 专属文本
  匹配器仍只作用于拥有它们的 provider（例如 OpenRouter 的
  `Key limit exceeded`）。可重试的 HTTP `402` 用量窗口或
  organization/workspace 支出上限消息则仍归入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的按 provider 覆盖计费退避时长（单位：小时）。
- `billingMaxHours`：计费退避指数增长的上限时长（单位：小时，默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避时长（单位：分钟，默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的上限时长（单位：分钟，默认：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口（单位：小时，默认：`24`）。
- `overloadedProfileRotations`：同一 provider 在因过载错误失败时，切换到模型回退前允许的最大 auth-profile 轮换次数（默认：`1`）。诸如 `ModelNotReadyException` 之类的 provider 忙碌形态会归入这里。
- `overloadedBackoffMs`：在重试过载的 provider/profile 轮换前的固定延迟（默认：`0`）。
- `rateLimitedProfileRotations`：同一 provider 在因速率限制错误失败时，切换到模型回退前允许的最大 auth-profile 轮换次数（默认：`1`）。该速率限制桶包括 provider 形态文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 日志

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
- 设置 `logging.file` 可使用稳定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：在抑制写入前允许的最大日志文件大小，单位为字节（正整数；默认：`524288000` = 500 MB）。生产部署请使用外部日志轮转。

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

- `enabled`：instrumentation 输出的总开关（默认：`true`）。
- `flags`：用于启用定向日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 这样的通配符）。
- `stuckSessionWarnMs`：当某个会话保持在 processing 状态时，用于发出卡住会话警告的时长阈值，单位为毫秒。
- `otel.enabled`：启用 OpenTelemetry 导出管线（默认：`false`）。
- `otel.endpoint`：OTel 导出的收集器 URL。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求一起发送的额外 HTTP/gRPC 元数据头。
- `otel.serviceName`：资源属性中的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或日志导出。
- `otel.sampleRate`：trace 采样率，范围 `0`–`1`。
- `otel.flushIntervalMs`：定期刷新遥测数据的间隔，单位为毫秒。
- `otel.captureContent`：为 OTEL span 属性显式启用原始内容捕获。默认关闭。布尔值 `true` 会捕获非 system 的消息/工具内容；对象形式则允许你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OPENCLAW_OTEL_PRELOADED=1`：适用于已注册全局 OpenTelemetry SDK 的主机的环境开关。此时 OpenClaw 会跳过插件自有的 SDK 启动/关闭，同时保持诊断监听器处于活动状态。
- `cacheTrace.enabled`：为嵌入式运行记录缓存跟踪快照（默认：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存跟踪输出中包含哪些内容（默认均为：`true`）。

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

- `channel`：用于 npm/git 安装的发布渠道 —— `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：在 Gateway 网关启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小时延，单位为小时（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：stable 渠道额外的发布扩散窗口，单位为小时（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道执行检查的频率，单位为小时（默认：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: false,
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

- `enabled`：全局 ACP 功能门控（默认：`false`）。
- `dispatch.enabled`：ACP 会话轮次分发的独立门控（默认：`true`）。设为 `false` 可在阻止执行的同时保留 ACP 命令可用。
- `backend`：默认 ACP 运行时后端 id（必须匹配某个已注册的 ACP 运行时插件）。
- `defaultAgent`：当派生运行未指定显式目标时，使用的后备 ACP 目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id 允许列表；为空表示不增加额外限制。
- `maxConcurrentSessions`：可同时处于活动状态的 ACP 会话上限。
- `stream.coalesceIdleMs`：流式文本的空闲合并刷新窗口，单位为毫秒。
- `stream.maxChunkChars`：在拆分流式分块投影前允许的最大分块大小。
- `stream.repeatSuppression`：按轮次抑制重复的状态/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 表示增量流式传输；`"final_only"` 表示缓冲到轮次终结事件再输出。
- `stream.hiddenBoundarySeparator`：在隐藏工具事件之后、可见文本之前插入的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次可投影的智能体输出字符上限。
- `stream.maxSessionUpdateChars`：投影 ACP 状态/更新行的最大字符数。
- `stream.tagVisibility`：tag 名称到布尔可见性覆盖的记录，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话 worker 在可被清理前的空闲 TTL，单位为分钟。
- `runtime.installCommand`：在引导 ACP 运行时环境时运行的可选安装命令。

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
  - `"random"`（默认）：轮换显示有趣/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍会显示横幅标题/版本）。
- 若要隐藏整个横幅（而不仅是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

---

## 向导

由 CLI 引导式设置流程（`onboard`、`configure`、`doctor`）写入的元数据：

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

## Bridge protocol（旧版节点，历史参考）（旧版，已移除）

当前构建已不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除前，验证会失败；`openclaw doctor --fix` 可以去除未知键）。

<Accordion title="旧版 bridge 配置（历史参考）">

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
    maxConcurrentRuns: 2,
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

- `sessionRetention`：在从 `sessions.json` 中清理完成的隔离 cron 运行会话之前保留多长时间。也控制已归档、已删除的 cron 转录内容的清理。默认：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在触发裁剪前的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志裁剪时保留的最新行数。默认：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；若省略则不会发送认证头。
- `webhook`：已弃用的旧版后备 webhook URL（http/https），仅用于那些仍设置了 `notify: true` 的已存储任务。

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

- `maxAttempts`：一次性任务在瞬态错误下的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试对应的退避延迟数组，单位为毫秒（默认：`[30000, 60000, 300000]`；1–10 个条目）。
- `retryOn`：会触发重试的错误类型 —— `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则表示对所有瞬态类型都重试。

仅适用于一次性 cron 任务。周期性任务使用单独的失败处理机制。

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`：为 cron 任务启用失败告警（默认：`false`）。
- `after`：连续失败多少次后才触发告警（正整数，最小值：`1`）。
- `cooldownMs`：同一任务两次重复告警之间的最小间隔，单位为毫秒（非负整数）。
- `mode`：投递模式 —— `"announce"` 通过渠道消息发送；`"webhook"` 则向配置的 webhook 发起 POST。
- `accountId`：用于限定告警投递范围的可选账号或渠道 id。

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

- 所有任务共享的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够的目标数据时，默认值为 `"announce"`。
- `channel`：announce 投递的渠道覆盖项。`"last"` 会复用上次已知的投递渠道。
- `to`：显式的 announce 目标或 webhook URL。webhook 模式下为必填。
- `accountId`：可选的投递账号覆盖项。
- 每个任务的 `delivery.failureDestination` 会覆盖这个全局默认值。
- 当全局和每任务失败目标都未设置时，已经通过 `announce` 投递的任务在失败时会回退到其主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的任务，除非该任务的主 `delivery.mode` 为 `"webhook"`。

请参阅 [Cron Jobs](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 说明                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                                |
| `{{RawBody}}`      | 原始正文（无历史/发送者包装）                     |
| `{{BodyStripped}}` | 去除了群组提及的正文                              |
| `{{From}}`         | 发送者标识符                                      |
| `{{To}}`           | 目标标识符                                        |
| `{{MessageSid}}`   | 渠道消息 id                                       |
| `{{SessionId}}`    | 当前会话 UUID                                     |
| `{{IsNewSession}}` | 当创建了新会话时为 `"true"`                       |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                    |
| `{{MediaPath}}`    | 本地媒体路径                                      |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…）                |
| `{{Transcript}}`   | 音频转录文本                                      |
| `{{Prompt}}`       | 为 CLI 条目解析得到的媒体提示词                   |
| `{{MaxChars}}`     | 为 CLI 条目解析得到的最大输出字符数               |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群组主题（尽力而为）                              |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）                          |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）                        |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）                        |
| `{{Provider}}`     | provider 提示（whatsapp、telegram、discord 等）   |

---

## 配置 include（`$include`）

将配置拆分为多个文件：

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

- 单个文件：替换所在的对象。
- 文件数组：按顺序进行深度合并（后者覆盖前者）。
- 同级键：在 include 之后合并（覆盖 include 的值）。
- 嵌套 include：最多支持 10 层深度。
- 路径：相对于发起 include 的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）之内。仅当最终解析结果仍位于该边界内时，才允许使用绝对路径/`../` 形式。
- 当由 OpenClaw 管理的写入仅变更某个由单文件 include 支持的顶层 section 时，写入会透传到该 include 文件。例如，`plugins install` 会更新 `plugins: { $include: "./plugins.json5" }` 中的 `plugins.json5`，并保持 `openclaw.json` 不变。
- 根级 include、include 数组，以及带有同级覆盖的 include，对于由 OpenClaw 管理的写入均为只读；这类写入会以关闭失败方式处理，而不是将配置拍平。
- 错误：对缺失文件、解析错误和循环 include 提供清晰消息。

---

_相关内容：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

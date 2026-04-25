---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关配置参考，涵盖 OpenClaw 核心键名、默认值，以及指向各专用子系统参考文档的链接
title: 配置参考
x-i18n:
    generated_at: "2026-04-25T11:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14818087bd47a685a30140f7995840785797ffda556e68b757b8ba10043deea8
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若想查看面向任务的概览，请参见 [配置](/zh-CN/gateway/configuration)。

本页涵盖 OpenClaw 的主要配置面，并在子系统拥有更深入的独立参考文档时提供链接。由渠道和插件自行管理的命令目录，以及更深入的 memory/QMD 调整项，位于各自页面中，而不在本页展开。

代码真相：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema；在可用时，还会合并内置 / 插件 / 渠道元数据
- `config.schema.lookup` 会返回一个按路径范围限定的 schema 节点，供下钻工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面对配置文档基线哈希进行验证

专门的深入参考：

- [Memory 配置参考](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及位于 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [Slash 命令](/zh-CN/tools/slash-commands)，适用于当前内置 + 内置打包的命令目录
- 渠道特定命令面的所属渠道 / 插件页面

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段都是可选的——省略时，OpenClaw 会使用安全的默认值。

---

## 渠道

每个渠道的配置键已移至专门页面——请参见
[配置 — 渠道](/zh-CN/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage，以及其他
内置渠道（认证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

已移至专门页面——请参见
[配置 — 智能体](/zh-CN/gateway/config-agents)，内容包括：

- `agents.defaults.*`（工作区、模型、思考、心跳、内存、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、清理）
- `messages.*`（消息传递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保持平台默认的静默等待窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义
provider / 基础 URL 设置，已移至专门页面——请参见
[配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## MCP

由 OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，
并由嵌入式 Pi 及其他运行时适配器使用。`openclaw mcp list`、
`show`、`set` 和 `unset` 命令可管理此配置块，而不会在编辑配置时连接到
目标服务器。

```json5
{
  mcp: {
    // 可选。默认值：600000 ms（10 分钟）。设为 0 可禁用空闲驱逐。
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

- `mcp.servers`：为公开已配置 MCP 工具的运行时提供命名的 stdio 或远程 MCP 服务器定义。
- `mcp.sessionIdleTtlMs`：用于会话范围内内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求在运行结束时清理；此 TTL 是为
  长生命周期会话和未来调用方准备的兜底机制。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时来热应用。
  下一次工具发现 / 使用会根据新配置重新创建它们，因此被移除的
  `mcp.servers` 条目会立即清除，而不是等到空闲 TTL 到期。

运行时行为请参见 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和
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

- `allowBundled`：仅针对内置 Skills 的可选允许列表（托管 / 工作区 Skills 不受影响）。
- `load.extraDirs`：额外的共享 Skills 根目录（优先级最低）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规范的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使 Skills 已内置 / 已安装，也会禁用它。
- `entries.<skillKey>.apiKey`：为声明了主环境变量的 Skills 提供的便捷字段（明文字符串或 SecretRef 对象）。

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
- 设备发现支持原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括无 manifest 的 Claude 默认布局 bundle。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子，以及受支持 bundle 提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：为 `true` 时，受信任的非内置插件可从 `llm_input`、`llm_output` 和 `agent_end` 等类型化钩子中读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件，使其能够为后台子智能体运行请求按次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：用于受信任子智能体覆盖的可选规范 `provider/model` 目标允许列表。只有在你有意允许任意模型时，才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（可在有对应 schema 时由原生 OpenClaw 插件 schema 验证）。
- 渠道插件的账号 / 运行时设置位于 `channels.<id>` 下，应由所属插件 manifest 的 `channelConfigs` 元数据描述，而不是由中心化的 OpenClaw 选项注册表描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 网页抓取 provider 设置。
  - `apiKey`：Firecrawl API key（接受 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey`，或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认值：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主要内容（默认值：`true`）。
  - `maxAgeMs`：缓存的最长保留时间（毫秒）（默认值：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间（秒）（默认值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok 网页搜索）设置。
  - `enabled`：启用 X Search provider。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。阶段和阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：dreaming 总开关（默认值 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 频率（默认值为 `"0 3 * * *"`）。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整的 memory 配置位于 [Memory 配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件还可以通过 `settings.json` 提供嵌入式 Pi 默认值；OpenClaw 会将其作为经过净化的智能体设置应用，而不是作为原始 OpenClaw 配置补丁应用。
- `plugins.slots.memory`：选择当前启用的 memory 插件 id，或设为 `"none"` 以禁用 memory 插件。
- `plugins.slots.contextEngine`：选择当前启用的上下文引擎插件 id；默认值为 `"legacy"`，除非你安装并选择了其他引擎。
- `plugins.installs`：由 CLI 管理的安装元数据，供 `openclaw plugins update` 使用。
  - 包括 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为托管状态；优先使用 CLI 命令，而不是手动编辑。

请参见 [插件](/zh-CN/tools/plugin)。

---

## 浏览器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在受信任的私有网络访问场景下选择启用
      // allowPrivateNetwork: true, // 旧版别名
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
  禁用各自对应的清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 在未设置时默认禁用，因此浏览器导航默认保持严格模式。
- 仅在你有意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性 / 发现检查期间也会受到相同的私有网络阻止规则约束。
- `ssrfPolicy.allowPrivateNetwork` 仍然作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 来设置显式例外。
- 远程配置文件仅支持附加模式（禁用 start/stop/reset）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；使用 WS(S)
  则适用于你的提供商直接提供 DevTools WebSocket URL 的情况。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以附加到
  所选主机上，或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以指向特定的
  基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件仍受当前 Chrome MCP 路由限制约束：
  使用 snapshot/ref 驱动的操作而不是 CSS 选择器定位、单文件上传
  钩子、不支持对话框超时覆盖、不支持 `wait --load networkidle`，且不支持
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；只有
  远程 CDP 才需要显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局
  `browser.executablePath`。你可以用它让一个配置文件运行在 Chrome 中，
  另一个运行在 Brave 中。
- 本地托管配置文件在进程启动后使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP
  发现，并使用 `browser.localCdpReadyTimeoutMs` 检查启动后 CDP websocket 是否就绪。
  在较慢的主机上，如果 Chrome 已成功启动但就绪检查与启动过程发生竞争，请提高这些值。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 接受 `~` 作为你的操作系统主目录。
- 控制服务：仅限 loopback（端口由 `gateway.port` 派生，默认值为 `18791`）。
- `extraArgs` 会将额外的启动标志附加到本地 Chromium 启动参数中（例如
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
- `assistant`：Control UI 身份覆盖。会回退到当前激活的智能体身份。

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
- **旧版 bind 别名**：请在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关将无法访问。请使用 `--network host`，或设置 `bind: "lan"`（或使用 `bind: "custom"` 并设置 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认必须启用。非 loopback bind 需要 Gateway 网关认证。实际意味着使用共享 token/password，或使用设置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。新手引导向导默认会生成一个 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。若两者都已配置但未设置 mode，启动和服务安装 / 修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于受信任的本地 local loopback 设置；新手引导提示中不会提供该选项，这是有意设计。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知型反向代理，并信任来自 `gateway.trustedProxies` 的身份头（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求代理来源是**非 loopback**；同主机的 loopback 反向代理不满足 trusted-proxy 认证要求。
- `gateway.auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份头可以满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 头认证；它们仍遵循 Gateway 网关的常规 HTTP 认证模式。当 `tailscale.mode = "serve"` 时，默认值为 `true`。这种无 token 流程假定 Gateway 网关主机是受信任的。
- `gateway.auth.rateLimit`：可选的认证失败限流器。按客户端 IP 和认证作用域生效（共享密钥和设备 token 分别独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，对于相同 `{scope, clientIp}` 的失败尝试，会在写入失败记录前进行串行化。因此，同一客户端的并发错误尝试，可能会在第二个请求时触发限流，而不是两个请求都像普通不匹配那样竞争通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认值为 `true`；如果你有意也要对 localhost 流量做限流（例如测试环境或严格代理部署），请设为 `false`。
- 来自浏览器源的 WS 认证尝试始终会启用限流，并禁用 loopback 豁免（作为防御纵深，用于抵御基于浏览器的 localhost 暴力破解）。
- 在 loopback 上，这些源自浏览器的锁定会按标准化后的 `Origin`
  值彼此隔离，因此，某个 localhost 源的重复失败不会自动
  锁定另一个源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开访问，需要认证）。
- `controlUi.allowedOrigins`：Gateway 网关 WebSocket 连接的显式浏览器源允许列表。当预期浏览器客户端来自非 loopback 源时，这是必需的。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host-header 源策略的部署启用 Host-header 源回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端进程环境中的
  紧急放行覆盖项，允许对受信任的私有网络 IP 使用明文 `ws://`；
  默认情况下，明文仍仅限 loopback。没有等效的 `openclaw.json`
  配置项，而且诸如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 之类的浏览器私有网络配置也不会影响 Gateway
  WebSocket 客户端。
- `gateway.remote.token` / `.password`：远程客户端凭证字段。它们本身不会配置 Gateway 网关认证。
- `gateway.push.apns.relay.baseUrl`：外部 APNs relay 的基础 HTTPS URL，供官方版 / TestFlight iOS 构建在向 Gateway 网关发布基于 relay 的注册后使用。此 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时时间（毫秒）。默认值为 `10000`。
- 基于 relay 的注册会委托给特定的 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并将一个按注册范围限定的发送授权转发给 Gateway 网关。其他 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：用于覆盖上述 relay 配置的临时环境变量。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅用于开发的放行开关，允许 loopback HTTP relay URL。生产环境的 relay URL 应保持为 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔，单位为分钟。设为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：过期 socket 阈值，单位为分钟。请保持其大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：滚动一小时内每个渠道 / 账号允许的最大健康监控重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：按渠道关闭健康监控重启，同时保留全局监控启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖。设置后，其优先级高于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可将 `gateway.remote.*` 用作回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未能解析，则解析会以封闭方式失败（不会通过远程回退来掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端头的反向代理 IP。只列出你控制的代理。loopback 条目对于同主机代理 / 本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**使 loopback 请求符合 `gateway.auth.mode: "trusted-proxy"` 的资格。
- `allowRealIpFallback`：为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现封闭失败行为。
- `gateway.nodes.pairing.autoApproveCidrs`：用于自动批准首次节点设备配对的可选 CIDR/IP 允许列表，仅适用于未请求任何作用域的情况。未设置时为禁用状态。它不会自动批准 operator/browser/Control UI/WebChat 配对，也不会自动批准角色、作用域、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在完成配对和允许列表评估后，对已声明节点命令进行全局允许 / 拒绝整形。
- `gateway.tools.deny`：为 HTTP `POST /tools/invoke` 额外阻止的工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：将工具名称从默认 HTTP 拒绝列表中移除。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和 / 或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 获取。
- 可选的响应加固头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅对你控制的 HTTPS 源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在一台主机上运行多个 Gateway 网关时，请为每个实例使用唯一的端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

请参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

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

- `enabled`：在 Gateway 网关监听器处启用 TLS 终止（HTTPS/WSS）（默认值：`false`）。
- `autoGenerate`：在未配置显式文件时，自动生成本地自签名证书 / 密钥对；仅适用于本地 / 开发用途。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；请限制访问权限。
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

- `mode`：控制配置编辑在运行时如何应用。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置变更时始终重启 Gateway 网关进程。
  - `"hot"`：在不重启的情况下进程内应用更改。
  - `"hybrid"`（默认）：优先尝试热重载；如有需要则回退为重启。
- `debounceMs`：应用配置更改前的防抖窗口（毫秒）（非负整数）。
- `deferralTimeoutMs`：可选的最长等待时间（毫秒），用于等待进行中的操作结束，超时后强制重启。省略或设为 `0` 时，将无限等待，并周期性记录“仍在等待”的警告。

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

验证与安全说明：

- `hooks.enabled=true` 要求 `hooks.token` 为非空。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个 mapping 或 preset 使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 并将 `hooks.allowRequestSessionKey=true`。静态 mapping 键不需要该显式启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有当 `hooks.allowRequestSessionKey=true`（默认值：`false`）时，才接受请求负载中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染后的 mapping `sessionKey` 值会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径中的某个负载字段。
- 类似 `{{messages[0].subject}}` 的模板会从负载中读取值。
- `transform` 可以指向一个返回 hook 操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且必须位于 `hooks.transformsDir` 内（绝对路径和路径穿越会被拒绝）。
- `agentId` 会路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于没有显式 `sessionKey` 的 hook 智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方以及模板驱动的 mapping 会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + mapping）的可选前缀允许列表，例如 `["hook:"]`。当任意 mapping 或 preset 使用模板化 `sessionKey` 时，它将成为必需项。
- `deliver: true` 会将最终回复发送到某个渠道；`channel` 默认为 `last`。
- `model`：覆盖此 hook 运行使用的 LLM（如果设置了模型目录，则该值必须在允许范围内）。

</Accordion>

### Gmail 集成

- 内置 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由方式，请设置 `hooks.allowRequestSessionKey: true`，并将 `hooks.allowedSessionKeyPrefixes` 约束为匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖该 preset，而不是使用模板化默认值。

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

- 配置完成后，Gateway 网关会在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可禁用。
- 不要在 Gateway 网关旁边单独运行另一个 `gog gmail watch serve`。

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

- 在 Gateway 网关端口下通过 HTTP 提供可由智能体编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认值）。
- 非 loopback bind：canvas 路由与其他 Gateway 网关 HTTP 面相同，都要求 Gateway 网关认证（token/password/trusted-proxy）。
- 节点 WebView 通常不会发送认证头；节点完成配对并连接后，Gateway 网关会为 canvas/A2UI 访问通告节点作用域的 capability URL。
- capability URL 绑定到当前活动的节点 WS 会话，并且会很快过期。不使用基于 IP 的回退。
- 会将 live-reload 客户端注入到所提供的 HTML 中。
- 为空时会自动创建起始 `index.html`。
- 还会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
- 对于大型目录或出现 `EMFILE` 错误时，请禁用实时重载。

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

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 主机名默认为 `openclaw`。可使用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域网（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

会在 `~/.openclaw/dns/` 下写入一个单播 DNS-SD 区域。若需跨网络设备发现，请配合使用 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS。

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
- `.env` 文件：当前工作目录下的 `.env` + `~/.openclaw/.env`（二者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 完整优先级请参见 [环境](/zh-CN/help/environment)。

### 环境变量替换

可在任何配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配全大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失 / 为空的变量会在加载配置时抛出错误。
- 使用 `$${VAR}` 可转义为字面量 `${VAR}`。
- 也适用于 `$include`。

---

## Secrets

SecretRef 是增量式能力：明文值仍然可用。

### `SecretRef`

使用以下一种对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 id：绝对 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 id 不能包含以 `/` 分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证面

- 规范矩阵：[SecretRef 凭证面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 会针对受支持的 `openclaw.json` 凭证路径生效。
- `auth-profiles.json` 中的 refs 也包含在运行时解析和审计覆盖范围内。

### Secret 提供商配置

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

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（在 `singleValue` 模式下，`id` 必须是 `"value"`）。
- 当无法进行 Windows ACL 验证时，file 和 exec 提供商路径会以封闭方式失败。仅对无法验证但受信任的路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求 `command` 为绝对路径，并通过 stdin/stdout 使用协议负载。
- 默认情况下，符号链接命令路径会被拒绝。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时仍会验证解析后的目标路径。
- 如果配置了 `trustedDirs`，受信任目录检查会应用到解析后的目标路径。
- `exec` 子进程环境默认最小化；请用 `passEnv` 显式传递所需变量。
- Secret refs 会在激活时解析为内存中的快照，之后请求路径只读取该快照。
- 激活期间会应用活跃面过滤：启用面上的未解析 refs 会导致启动 / 重载失败，而非活跃面会被跳过并记录诊断信息。

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

- 每个智能体的 profile 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持值级 refs（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`），适用于静态凭证模式。
- OAuth 模式的 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中已解析的快照；发现旧版静态 `auth.json` 条目时会进行清理。
- 旧版 OAuth 会从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参见 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为以及 `audit/configure/apply` 工具：请参见 [Secrets 管理](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：当某个 profile 因真实的
  计费 / 额度不足错误而失败时，按小时计算的基础退避时间（默认值：`5`）。即使在 `401` / `403` 响应上，显式计费文本
  仍可能落入这里，但提供商特定的文本
  匹配器仍只作用于拥有它们的提供商（例如 OpenRouter 的
  `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或
  organization/workspace 支出上限消息仍会落入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的按提供商覆盖计费退避小时数。
- `billingMaxHours`：计费退避指数增长的小时上限（默认值：`24`）。
- `authPermanentBackoffMinutes`：用于高置信度 `auth_permanent` 失败的基础退避分钟数（默认值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认值：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口，单位为小时（默认值：`24`）。
- `overloadedProfileRotations`：对于过载错误，在切换到模型回退前，允许的同提供商 auth-profile 轮换最大次数（默认值：`1`）。如 `ModelNotReadyException` 这类 provider 忙碌形态会归入这里。
- `overloadedBackoffMs`：重试过载提供商 / profile 轮换前的固定延迟（毫秒）（默认值：`0`）。
- `rateLimitedProfileRotations`：对于限流错误，在切换到模型回退前，允许的同提供商 auth-profile 轮换最大次数（默认值：`1`）。该限流桶包括提供商特定文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- 设置 `logging.file` 可使用固定路径。
- `consoleLevel` 在使用 `--verbose` 时会提升为 `debug`。
- `maxFileBytes`：写入被抑制前允许的最大日志文件大小（字节）（正整数；默认值：`524288000` = 500 MB）。生产部署请使用外部日志轮转。

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

- `enabled`：仪表输出的总开关（默认值：`true`）。
- `flags`：用于启用定向日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 这样的通配符）。
- `stuckSessionWarnMs`：当会话持续处于处理状态时，发出卡住会话警告的时长阈值（毫秒）。
- `otel.enabled`：启用 OpenTelemetry 导出管线（默认值：`false`）。
- `otel.endpoint`：OTel 导出的 collector URL。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据头。
- `otel.serviceName`：资源属性使用的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.sampleRate`：trace 采样率，范围 `0`–`1`。
- `otel.flushIntervalMs`：定期刷新遥测数据的时间间隔（毫秒）。
- `otel.captureContent`：用于 OTel span 属性中原始内容采集的显式启用项。默认关闭。布尔值 `true` 会采集非 system 的消息 / 工具内容；对象形式则允许你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OPENCLAW_OTEL_PRELOADED=1`：适用于已注册全局 OpenTelemetry SDK 的主机的环境开关。此时 OpenClaw 会跳过由插件管理的 SDK 启动 / 关闭流程，同时保持诊断监听器处于活动状态。
- `cacheTrace.enabled`：为嵌入式运行记录缓存跟踪快照（默认值：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存跟踪输出中包含的内容（默认值均为 `true`）。

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

- `channel`：用于 npm/git 安装的发布渠道——`"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认值：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认值：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小时延（小时）（默认值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：stable 渠道额外的发布扩散窗口（小时）（默认值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行频率（小时）（默认值：`1`；最大值：`24`）。

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

- `enabled`：全局 ACP 功能开关（默认值：`false`）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认值：`true`）。设为 `false` 可在阻止执行的同时保留 ACP 命令可用。
- `backend`：默认 ACP 运行时后端 id（必须与已注册的 ACP 运行时插件匹配）。
- `defaultAgent`：当派生运行未指定显式目标时使用的 ACP 目标智能体 id。
- `allowedAgents`：ACP 运行时会话允许使用的智能体 id 允许列表；为空表示不增加额外限制。
- `maxConcurrentSessions`：同时活跃的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲合并刷新窗口（毫秒）。
- `stream.maxChunkChars`：流式分块投影在拆分前允许的最大块大小。
- `stream.repeatSuppression`：每轮抑制重复的状态 / 工具行（默认值：`true`）。
- `stream.deliveryMode`：`"live"` 表示增量流式传输；`"final_only"` 表示缓冲至轮次终结事件后再输出。
- `stream.hiddenBoundarySeparator`：在隐藏工具事件之后、可见文本之前插入的分隔符（默认值：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的智能体输出最大字符数。
- `stream.maxSessionUpdateChars`：投影的 ACP 状态 / 更新行的最大字符数。
- `stream.tagVisibility`：记录标签名到布尔可见性覆盖的映射，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话 worker 在可被清理前的空闲 TTL（分钟）。
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
  - `"random"`（默认）：轮换显示有趣 / 季节性标语。
  - `"default"`：固定中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍会显示横幅标题 / 版本）。
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

请参见 [智能体默认值](/zh-CN/gateway/config-agents#agent-defaults) 下的 `agents.list` 身份字段。

---

## Bridge protocol（旧版节点，历史参考）（旧版，已移除）

当前构建已不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除前，验证会失败；`openclaw doctor --fix` 可移除未知键）。

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

- `sessionRetention`：在从 `sessions.json` 中清理前，已完成的隔离 cron 运行会话保留多长时间。也控制已归档删除的 cron 转录内容的清理。默认值：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在触发清理前允许的最大大小。默认值：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志清理时保留的最新行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook `POST` 投递（`delivery.mode = "webhook"`）的 bearer token；若省略，则不会发送认证头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），仅用于仍然带有 `notify: true` 的已存储任务。

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

- `maxAttempts`：一次性任务在瞬时错误下的最大重试次数（默认值：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试对应的退避延迟数组（毫秒）（默认值：`[30000, 60000, 300000]`；1–10 项）。
- `retryOn`：触发重试的错误类型——`"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略时会对所有瞬时类型重试。

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

- `enabled`：启用 cron 任务失败告警（默认值：`false`）。
- `after`：连续失败多少次后触发告警（正整数，最小值：`1`）。
- `cooldownMs`：同一任务重复告警之间的最小间隔（毫秒）（非负整数）。
- `mode`：投递模式——`"announce"` 通过渠道消息发送；`"webhook"` 向配置的 webhook 发起 POST。
- `accountId`：可选的账号或渠道 id，用于限定告警投递范围。

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

- 所有任务共用的默认 cron 失败通知目标。
- `mode`：`"announce"` 或 `"webhook"`；在目标数据足够时，默认值为 `"announce"`。
- `channel`：announce 投递的渠道覆盖。`"last"` 会复用上次已知的投递渠道。
- `to`：显式的 announce 目标或 webhook URL。webhook 模式下为必填。
- `accountId`：可选的投递账号覆盖。
- 每个任务的 `delivery.failureDestination` 会覆盖此全局默认值。
- 当既未设置全局失败目标也未设置每个任务的失败目标时，那些已通过 `announce` 投递的任务在失败时会回退到其主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的任务，除非该任务的主 `delivery.mode` 是 `"webhook"`。

请参见 [Cron Jobs](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| Variable           | 描述 |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文 |
| `{{RawBody}}`      | 原始正文（无历史 / 发送者包装） |
| `{{BodyStripped}}` | 已去除群组提及的正文 |
| `{{From}}`         | 发送者标识符 |
| `{{To}}`           | 目标标识符 |
| `{{MessageSid}}`   | 渠道消息 id |
| `{{SessionId}}`    | 当前会话 UUID |
| `{{IsNewSession}}` | 新建会话时为 `"true"` |
| `{{MediaUrl}}`     | 入站媒体伪 URL |
| `{{MediaPath}}`    | 本地媒体路径 |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…） |
| `{{Transcript}}`   | 音频转录文本 |
| `{{Prompt}}`       | CLI 条目的已解析媒体提示词 |
| `{{MaxChars}}`     | CLI 条目的已解析最大输出字符数 |
| `{{ChatType}}`     | `"direct"` 或 `"group"` |
| `{{GroupSubject}}` | 群组主题（尽力而为） |
| `{{GroupMembers}}` | 群组成员预览（尽力而为） |
| `{{SenderName}}`   | 发送者显示名称（尽力而为） |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为） |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等） |

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

- 单个文件：替换其所在的对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在 include 之后合并（覆盖 include 中的值）。
- 嵌套 include：最多支持 10 层。
- 路径：相对于包含它的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内部。绝对路径 / `../` 形式仅在最终解析后仍位于该边界内时才允许。
- 如果 OpenClaw 自主管理的写入仅更改了一个由单文件 include 支持的顶层 section，则会直接写入该 include 文件。例如，`plugins install` 会更新 `plugins: { $include: "./plugins.json5" }` 对应的 `plugins.json5`，并保持 `openclaw.json` 不变。
- 根级 include、include 数组，以及带同级覆盖的 include，对于 OpenClaw 自主管理的写入都是只读的；这些写入会以封闭方式失败，而不是将配置展平。
- 错误：对缺失文件、解析错误和循环 include 提供清晰的错误消息。

---

_相关内容：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

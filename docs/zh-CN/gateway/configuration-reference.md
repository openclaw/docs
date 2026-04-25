---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关 或工具配置块
summary: Gateway 网关 配置参考，涵盖核心 OpenClaw 键名、默认值，以及指向专用子系统参考的链接
title: 配置参考
x-i18n:
    generated_at: "2026-04-25T06:52:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f658493b3354d2f5dca8adf8a32d3d1c07691a35923badb2cbd697d69e0f50f9
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若要查看面向任务的概览，请参见 [配置](/zh-CN/gateway/configuration)。

涵盖 OpenClaw 的主要配置面，并在某个子系统有更深入的独立参考时提供链接。由渠道和插件拥有的命令目录，以及更深入的内存 / QMD 调节项，位于各自的页面中，而不是本页。

代码事实来源：

- `openclaw config schema` 会输出用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置 / 插件 / 渠道元数据
- `config.schema.lookup` 会返回一个按路径范围限定的 schema 节点，用于下钻工具
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面验证配置文档基线哈希

专用深入参考：

- [内存配置参考](/zh-CN/reference/memory-config)，用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [斜杠命令](/zh-CN/tools/slash-commands)，用于当前内置 + 打包的命令目录
- 渠道特定命令面的所属渠道 / 插件页面

配置格式为 **JSON5**（允许注释 + 尾随逗号）。所有字段都是可选的 —— OpenClaw 在省略时会使用安全的默认值。

---

## 渠道

每个渠道的配置键已移至专用页面 —— 请参见
[配置 — 渠道](/zh-CN/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他
内置渠道（身份验证、访问控制、多账户、提及门控）。

## 智能体默认值、多智能体、会话和消息

已移至专用页面 —— 请参见
[配置 — 智能体](/zh-CN/gateway/config-agents)，内容包括：

- `agents.defaults.*`（工作区、模型、思考、心跳、内存、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、清理）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保持平台默认的停顿窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义
提供商 / base-URL 设置已移至专用页面 —— 请参见
[配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## MCP

由 OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，
并由嵌入式 Pi 和其他运行时适配器使用。`openclaw mcp list`、
`show`、`set` 和 `unset` 命令会管理这个配置块，而不会在编辑配置期间连接到
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

- `mcp.servers`：为暴露已配置 MCP 工具的运行时提供具名的 stdio 或远程 MCP 服务器定义。
- `mcp.sessionIdleTtlMs`：会话范围内内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求在运行结束时清理；这个 TTL 是
  长生命周期会话和未来调用方的兜底机制。

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
- `install.preferBrew`：为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，然后才回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规范的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使 Skill 已内置 / 已安装，也会禁用该 Skill。
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
- 设备发现接受原生 OpenClaw 插件，以及兼容的 Codex 包和 Claude 包，包括无 manifest 的 Claude 默认布局包。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先生效。
- `plugins.entries.<id>.apiKey`：插件级 API 密钥便捷字段（插件支持时可用）。
- `plugins.entries.<id>.env`：插件范围的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子以及受支持的包提供钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非内置插件可以从 `llm_input`、`llm_output` 和 `agent_end` 等类型化钩子中读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件可以为后台子智能体运行请求按次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖的规范 `provider/model` 目标可选允许列表。仅当你确实想允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（在可用时由原生 OpenClaw 插件 schema 验证）。
- 渠道插件的账户 / 运行时设置位于 `channels.<id>` 下，应由所属插件的 manifest `channelConfigs` 元数据描述，而不是由中央 OpenClaw 选项注册表描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 网页抓取提供商设置。
  - `apiKey`：Firecrawl API 密钥（接受 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主体内容（默认：`true`）。
  - `maxAgeMs`：缓存的最大存活时间（毫秒）（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间（秒）（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web search）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。阶段和阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：dreaming 总开关（默认 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 频率（默认 `"0 3 * * *"`）。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整内存配置位于 [内存配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude 包插件也可以从 `settings.json` 提供嵌入式 Pi 默认值；OpenClaw 会将它们作为经过净化的智能体设置应用，而不是作为原始 OpenClaw 配置补丁应用。
- `plugins.slots.memory`：选择活动内存插件 id，或用 `"none"` 禁用内存插件。
- `plugins.slots.contextEngine`：选择活动上下文引擎插件 id；默认为 `"legacy"`，除非你安装并选择了其他引擎。
- `plugins.installs`：由 CLI 管理的安装元数据，供 `openclaw plugins update` 使用。
  - 包含 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为受管状态；优先使用 CLI 命令，而不是手动编辑。

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
- `tabCleanup` 会在空闲时间后，或当某个会话超过其上限时，回收被跟踪的主智能体标签页。将 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 设为 0 可禁用各自对应的清理模式。
- 未设置时，`ssrfPolicy.dangerouslyAllowPrivateNetwork` 为禁用状态，因此浏览器导航默认保持严格模式。
- 仅当你明确愿意信任私有网络浏览器导航时，才将 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 设为 true。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性 / 设备发现检查期间也会受到相同的私有网络阻止策略约束。
- `ssrfPolicy.allowPrivateNetwork` 仍然作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 进行显式例外配置。
- 远程配置文件仅支持附加模式（禁用 start / stop / reset）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；当你的提供商直接提供 DevTools WebSocket URL 时，请使用 WS(S)。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以附加到所选主机上，或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以定位特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前的 Chrome MCP 路由限制：使用基于 snapshot / ref 的操作，而不是 CSS 选择器定位；单文件上传钩子；不支持对话框超时覆盖；不支持 `wait --load networkidle`；也不支持 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 场景下才需要显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局 `browser.executablePath`。可用它让一个配置文件运行在 Chrome 中，另一个运行在 Brave 中。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 接受表示你的操作系统主目录的 `~`。
- 控制服务：仅限 loopback（端口从 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 会为本地 Chromium 启动追加额外的启动标志（例如
  `--disable-gpu`、窗口尺寸设置或调试标志）。

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

- `seamColor`：原生应用 UI 外壳的强调色（Talk 模式气泡色调等）。
- `assistant`：Control UI 身份覆盖。会回退到当前活动智能体身份。

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

<Accordion title="Gateway 网关 字段详情">

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关 会拒绝启动。
- `port`：用于 WS + HTTP 的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内部监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关 无法访问。请使用 `--network host`，或设置 `bind: "lan"`（或 `bind: "custom"` 且 `customBindHost: "0.0.0.0"`）以在所有接口上监听。
- **Auth**：默认必须启用。非 loopback 绑定要求 Gateway 网关 身份验证。实际使用中，这意味着共享 token / password，或使用 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认会生成 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。当两者都已配置且未设置 mode 时，启动以及服务安装 / 修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于可信的本地 local loopback 设置；新手引导提示中不会提供此选项，这是有意为之。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求**非 loopback** 的代理来源；同一主机上的 loopback 反向代理不满足 trusted-proxy auth 要求。
- `gateway.auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份标头可满足 Control UI / WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 标头认证；它们仍遵循 Gateway 网关 的常规 HTTP 认证模式。当 `tailscale.mode = "serve"` 时默认值为 `true`。这种无 token 流程假定 Gateway 网关 所在主机可信。
- `gateway.auth.rateLimit`：可选的认证失败限流器。按客户端 IP 和认证作用域生效（共享密钥和设备 token 会分别跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，相同 `{scope, clientIp}` 的失败尝试会在失败写入前被串行化。因此，同一客户端的并发错误尝试可能会在第二个请求上触发限流，而不是两个请求都作为普通不匹配竞态通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认值为 `true`；如果你确实希望 localhost 流量也受限流影响（用于测试设置或严格代理部署），请设为 `false`。
- 来自浏览器源的 WS 认证尝试始终会启用限流，且不会豁免 loopback（作为防御纵深措施，以防浏览器对 localhost 进行暴力破解）。
- 在 loopback 上，这些来自浏览器源的锁定会按规范化后的 `Origin`
  值隔离，因此来自某个 localhost 源的重复失败不会自动
  锁定另一个源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开访问，需要认证）。
- `controlUi.allowedOrigins`：用于 Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。当预期浏览器客户端来自非 loopback 来源时，这是必需的。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为那些有意依赖 Host 标头来源策略的部署启用基于 Host 标头的来源回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws / wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端进程环境变量中的紧急放行覆盖，允许对可信私有网络
  IP 使用明文 `ws://`；默认情况下，明文仍然仅限 loopback。没有对应的 `openclaw.json`
  配置项，且诸如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 之类的浏览器私有网络配置不会影响 Gateway 网关
  WebSocket 客户端。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身不会配置 Gateway 网关 认证。
- `gateway.push.apns.relay.baseUrl`：官方 / TestFlight iOS 构建在将基于 relay 的注册发布到 Gateway 网关 后，供其使用的外部 APNs relay 的基础 HTTPS URL。此 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关 到 relay 的发送超时时间（毫秒）。默认值为 `10000`。
- 基于 relay 的注册会委托给某个特定的 Gateway 网关 身份。配对的 iOS 应用会获取 `gateway.identity.get`，将该身份包含在 relay 注册中，并将一个按注册范围划分的发送授权转发给 Gateway 网关。其他 Gateway 网关 无法复用这个已存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅用于开发的例外开关，可为 loopback HTTP relay URL 放行。生产环境的 relay URL 应保持为 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔（分钟）。设为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧套接字阈值（分钟）。应保持大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道 / 账户在滚动一小时内允许的最大健康监控重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控启用的情况下，按渠道选择退出健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户渠道的按账户覆盖。设置后，它会优先于渠道级覆盖。
- 本地 Gateway 网关 调用路径仅在 `gateway.auth.*` 未设置时才可将 `gateway.remote.*` 用作回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且无法解析，则解析会以关闭方式失败（不会被远程回退掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。loopback 条目对于同主机代理 / 本地检测设置仍然有效（例如 Tailscale Serve 或本地反向代理），但它们**不会**让 loopback 请求有资格使用 `gateway.auth.mode: "trusted-proxy"`。
- `allowRealIpFallback`：为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关 会接受 `X-Real-IP`。默认值为 `false`，以实现失败即关闭的行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选的 CIDR / IP 允许列表，用于自动批准首次节点设备配对，且该配对没有请求任何作用域。未设置时为禁用状态。它不会自动批准 operator / browser / Control UI / WebChat 配对，也不会自动批准角色、作用域、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在完成配对和允许列表评估之后，对已声明节点命令进行全局允许 / 拒绝整形。
- `gateway.tools.deny`：为 HTTP `POST /tools/invoke` 额外阻止的工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和 / 或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 抓取。
- 可选的响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅对你控制的 HTTPS 来源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在同一主机上运行多个 Gateway 网关，并使用唯一端口和状态目录：

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

- `enabled`：在 Gateway 网关 监听器处启用 TLS 终止（HTTPS / WSS）（默认值：`false`）。
- `autoGenerate`：在未配置显式文件时自动生成本地自签名 cert / key 对；仅用于本地 / 开发环境。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；应保持权限受限。
- `caPath`：可选的 CA bundle 路径，用于客户端验证或自定义信任链。

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
  - `"restart"`：配置更改时始终重启 Gateway 网关 进程。
  - `"hot"`：在进程内应用更改而不重启。
  - `"hybrid"`（默认）：先尝试热重载；如有需要则回退到重启。
- `debounceMs`：应用配置更改前的防抖窗口（毫秒）（非负整数）。
- `deferralTimeoutMs`：在强制重启前等待进行中操作的最长时间（毫秒）（默认值：`300000` = 5 分钟）。

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
会拒绝查询字符串中的 hook token。

验证和安全说明：

- `hooks.enabled=true` 要求 `hooks.token` 为非空。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个映射或 preset 使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要该显式启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true` 时，才接受请求负载中的 `sessionKey`（默认：`false`）。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 经过模板渲染的映射 `sessionKey` 值会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的某个负载字段。
- 像 `{{messages[0].subject}}` 这样的模板会从负载中读取。
- `transform` 可以指向返回 hook 动作的 JS / TS 模块。
  - `transform.module` 必须是相对路径，并且必须位于 `hooks.transformsDir` 内（绝对路径和路径穿越会被拒绝）。
- `agentId` 会路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 全部允许，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于未显式指定 `sessionKey` 的 hook 智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任意映射或 preset 使用模板化的 `sessionKey` 时，它就成为必需项。
- `deliver: true` 会将最终回复发送到某个渠道；`channel` 默认为 `last`。
- `model` 会为这次 hook 运行覆盖 LLM（如果设置了模型目录，则必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由的方式，请设置 `hooks.allowRequestSessionKey: true`，并将 `hooks.allowedSessionKeyPrefixes` 约束为与 Gmail 命名空间匹配，例如 `["hook:", "hook:gmail:"]`。
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

- 配置后，Gateway 网关 会在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可禁用。
- 不要在 Gateway 网关 旁边单独运行另一个 `gog gmail watch serve`。

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

- 会通过 Gateway 网关 端口下的 HTTP 提供由智能体可编辑的 HTML / CSS / JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：请保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback 绑定：canvas 路由与其他 Gateway 网关 HTTP 面相同，要求 Gateway 网关 认证（token / password / trusted-proxy）。
- 节点 WebView 通常不会发送认证标头；节点完成配对并连接后，Gateway 网关 会为 canvas / A2UI 访问公布节点作用域的能力 URL。
- 能力 URL 绑定到当前活动的节点 WS 会话，并且会很快过期。不使用基于 IP 的回退。
- 会向所提供的 HTML 注入实时重载客户端。
- 为空时会自动创建初始 `index.html`。
- 也会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
- 对于大型目录或 `EMFILE` 错误，请禁用实时重载。

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
- 主机名默认为 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

会在 `~/.openclaw/dns/` 下写入一个单播 DNS-SD 区域。对于跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS。

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

- 只有在进程环境中缺少该键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 完整优先级请参见 [环境](/zh-CN/help/environment)。

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
- 缺失 / 为空的变量会在配置加载时抛出错误。
- 使用 `$${VAR}` 可转义为字面量 `${VAR}`。
- 可与 `$include` 一起使用。

---

## Secrets

SecretRef 是增量式的：明文值仍然可用。

### `SecretRef`

使用如下对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 id 不能包含以斜杠分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证面

- 规范矩阵：[SecretRef 凭证面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 面向受支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` 中的引用已纳入运行时解析和审计覆盖范围。

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

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式下，`id` 必须为 `"value"`）。
- 当无法验证 Windows ACL 时，file 和 exec 提供商路径会以关闭方式失败。仅对无法验证但可信的路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求使用绝对 `command` 路径，并通过 stdin / stdout 上的协议负载进行通信。
- 默认情况下，会拒绝符号链接命令路径。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时验证解析后的目标路径。
- 如果配置了 `trustedDirs`，则可信目录检查会应用于解析后的目标路径。
- 默认情况下，`exec` 子进程环境最小化；请通过 `passEnv` 显式传递所需变量。
- Secret 引用会在激活时解析为内存中的快照，之后请求路径只会读取该快照。
- 激活期间会应用活动面过滤：已启用面上的未解析引用会导致启动 / 重载失败，而非活动面则会被跳过并给出诊断信息。

---

## Auth 存储

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
- `auth-profiles.json` 对静态凭证模式支持值级引用（`api_key` 对应 `keyRef`，`token` 对应 `tokenRef`）。
- OAuth 模式 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中的已解析快照；发现旧版静态 `auth.json` 条目时会清理掉。
- 旧版 OAuth 会从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参见 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为以及 `audit/configure/apply` 工具：参见 [Secrets Management](/zh-CN/gateway/secrets)。

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
  账单 / 余额不足错误而失败时的基础回退时间（小时）（默认：`5`）。即使在 `401` / `403` 响应上，显式的账单文本
  也仍可能归入这里，但提供商特定的文本
  匹配器仍仅限于拥有它们的提供商（例如 OpenRouter 的
  `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或
  organization / workspace 支出上限消息则仍归入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：账单回退小时数的可选按提供商覆盖。
- `billingMaxHours`：账单回退指数增长的小时上限（默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础回退时间（分钟）（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 回退增长的分钟上限（默认：`60`）。
- `failureWindowHours`：用于回退计数器的滚动时间窗口（小时）（默认：`24`）。
- `overloadedProfileRotations`：对于过载错误，在切换到模型回退之前，同一提供商 auth-profile 的最大轮换次数（默认：`1`）。像 `ModelNotReadyException` 这样的提供商忙碌形态会归入这里。
- `overloadedBackoffMs`：在重试过载的提供商 / profile 轮换前的固定延迟（默认：`0`）。
- `rateLimitedProfileRotations`：对于限流错误，在切换到模型回退之前，同一提供商 auth-profile 的最大轮换次数（默认：`1`）。该限流桶包括提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- `maxFileBytes`：在抑制写入之前允许的最大日志文件大小（字节）（正整数；默认：`524288000` = 500 MB）。生产部署请使用外部日志轮转。

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
- `flags`：用于启用定向日志输出的标志字符串数组（支持通配符，如 `"telegram.*"` 或 `"*"`）。
- `stuckSessionWarnMs`：当会话保持在处理中状态时，用于发出卡住会话警告的年龄阈值（毫秒）。
- `otel.enabled`：启用 OpenTelemetry 导出管道（默认：`false`）。
- `otel.endpoint`：用于 OTel 导出的 collector URL。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP / gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.sampleRate`：`0`–`1` 的 trace 采样率。
- `otel.flushIntervalMs`：定期刷新 telemetry 的间隔（毫秒）。
- `otel.captureContent`：为 OTEL span 属性选择性启用原始内容捕获。默认关闭。布尔值 `true` 会捕获非 system 消息 / 工具内容；对象形式可让你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `cacheTrace.enabled`：为嵌入式运行记录缓存跟踪快照（默认：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存跟踪输出中包含哪些内容（默认全部为 `true`）。

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

- `channel`：用于 npm / git 安装的发布渠道 —— `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关 启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小延迟（小时）（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：stable 渠道发布扩散窗口的额外小时数（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道执行检查的间隔（小时）（默认：`1`；最大：`24`）。

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

- `enabled`：全局 ACP 功能开关（默认：`false`）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认：`true`）。设为 `false` 可在阻止执行的同时保留 ACP 命令可用。
- `backend`：默认 ACP 运行时后端 id（必须匹配已注册的 ACP 运行时插件）。
- `defaultAgent`：当派生运行未指定显式目标时使用的 ACP 目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id 列表；空值表示无额外限制。
- `maxConcurrentSessions`：同时活跃的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲合并刷新窗口（毫秒）。
- `stream.maxChunkChars`：拆分流式分块投影前的最大块大小。
- `stream.repeatSuppression`：每轮抑制重复的状态 / 工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 逐步流式输出；`"final_only"` 则缓冲到轮次终止事件时再输出。
- `stream.hiddenBoundarySeparator`：隐藏工具事件之后、可见文本之前的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的助手输出最大字符数。
- `stream.maxSessionUpdateChars`：投影的 ACP 状态 / 更新行的最大字符数。
- `stream.tagVisibility`：标签名称到布尔可见性覆盖的记录，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话工作进程在可被清理前的空闲 TTL（分钟）。
- `runtime.installCommand`：在引导 ACP 运行时环境时执行的可选安装命令。

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
  - `"random"`（默认）：轮换的有趣 / 季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍会显示横幅标题 / 版本）。
- 若要隐藏整个横幅（而不仅仅是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

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

请参见 [智能体默认值](/zh-CN/gateway/config-agents#agent-defaults) 下 `agents.list` 的身份字段。

---

## Bridge protocol（旧版节点，历史参考）（旧版，已移除）

当前构建已不再包含 TCP Bridge protocol（旧版节点，历史参考）。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除之前，验证会失败；`openclaw doctor --fix` 可以清除未知键）。

<Accordion title="旧版 Bridge protocol（旧版节点，历史参考）配置（历史参考）">

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

- `sessionRetention`：在从 `sessions.json` 中清理之前，保留已完成的隔离 cron 运行会话的时长。也控制已归档且已删除的 cron 转录内容的清理。默认值：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在清理前允许的最大大小。默认值：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志清理时保留的最新行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；若省略，则不会发送 auth 标头。
- `webhook`：已弃用的旧版回退 webhook URL（http / https），仅用于仍带有 `notify: true` 的已存储任务。

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

- `maxAttempts`：一次性任务在瞬时错误下允许的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试的回退延迟数组（毫秒）（默认：`[30000, 60000, 300000]`；1–10 个条目）。
- `retryOn`：会触发重试的错误类型 —— `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则会重试所有瞬时类型。

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
- `after`：在触发告警前的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一任务重复告警之间的最小间隔（毫秒）（非负整数）。
- `mode`：投递模式 —— `"announce"` 通过渠道消息发送；`"webhook"` 则 POST 到已配置的 webhook。
- `accountId`：用于限定告警投递范围的可选账户或渠道 id。

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

- 所有任务共用的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够的目标数据时，默认值为 `"announce"`。
- `channel`：announce 投递的渠道覆盖。`"last"` 会复用最后一次已知的投递渠道。
- `to`：显式 announce 目标或 webhook URL。在 webhook 模式下为必填项。
- `accountId`：投递的可选账户覆盖。
- 每个任务的 `delivery.failureDestination` 会覆盖这个全局默认值。
- 当既未设置全局失败目标，也未设置每任务失败目标时，已通过 `announce` 投递的任务会在失败时回退到其主 announce 目标。
- `delivery.failureDestination` 仅对 `sessionTarget="isolated"` 的任务受支持，除非该任务的主 `delivery.mode` 为 `"webhook"`。

请参见 [Cron 任务](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| Variable           | 描述 |
| ------------------ | ---- |
| `{{Body}}`         | 完整的入站消息正文 |
| `{{RawBody}}`      | 原始正文（无历史记录 / 发送者包装） |
| `{{BodyStripped}}` | 去除群组提及后的正文 |
| `{{From}}`         | 发送者标识符 |
| `{{To}}`           | 目标标识符 |
| `{{MessageSid}}`   | 渠道消息 id |
| `{{SessionId}}`    | 当前会话 UUID |
| `{{IsNewSession}}` | 新建会话时为 `"true"` |
| `{{MediaUrl}}`     | 入站媒体伪 URL |
| `{{MediaPath}}`    | 本地媒体路径 |
| `{{MediaType}}`    | 媒体类型（image / audio / document / …） |
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

- 单个文件：替换所在的包含对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在 include 之后合并（覆盖 include 的值）。
- 嵌套 include：最多 10 层深。
- 路径：相对于发起 include 的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。只有在最终仍解析到该边界内时，才允许使用绝对路径 / `../` 形式。
- 当 OpenClaw 自有写入仅更改由单文件 include 支持的某个顶层区段时，这些更改会直写到该 include 文件。例如，`plugins install` 会把 `plugins: { $include: "./plugins.json5" }` 的更新写入 `plugins.json5`，并保持 `openclaw.json` 不变。
- 对于根级 include、include 数组以及带有同级覆盖的 include，OpenClaw 自有写入为只读；这些写入会以关闭方式失败，而不是将配置展平。
- 错误：对缺失文件、解析错误和循环 include 提供清晰的错误消息。

---

_相关内容：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

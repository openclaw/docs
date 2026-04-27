---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: 用于核心 OpenClaw 键、默认值以及指向各专用子系统参考文档链接的 Gateway 网关配置参考。
title: 配置参考
x-i18n:
    generated_at: "2026-04-27T10:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddab94da7979c191961b3d947e55d55e0f266b3e12f56350ed11e47fd03ebaf6
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若需面向任务的概览，请参见 [配置](/zh-CN/gateway/configuration)。

本页涵盖 OpenClaw 的主要配置面，并在某个子系统拥有更深入的独立参考时提供相应链接。渠道和插件自行管理的命令目录，以及深层 memory/QMD 调整项，位于各自页面，而非本页。

代码事实来源：

- `openclaw config schema` 会输出用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置/插件/渠道元数据
- `config.schema.lookup` 会返回一个按路径范围限定的 schema 节点，用于下钻工具
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 面验证配置文档基线哈希

智能体查询路径：在修改前，请使用 `gateway` 工具动作 `config.schema.lookup` 获取精确到字段级别的文档和约束。面向任务的指导请使用 [配置](/zh-CN/gateway/configuration)，而本页用于查看更广泛的字段映射、默认值以及到子系统参考页面的链接。

专门的深度参考：

- [内存配置参考](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及位于 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [斜杠命令](/zh-CN/tools/slash-commands)，适用于当前内置 + 捆绑命令目录
- 对于渠道专属命令面，请参见对应渠道/插件页面

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段均为可选 —— OpenClaw 在省略时会使用安全默认值。

---

## Channels

每个渠道的配置键已移至独立页面 —— 请参见
[配置 — channels](/zh-CN/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 以及其他
内置渠道（认证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话与消息

已移至独立页面 —— 请参见
[配置 — 智能体](/zh-CN/gateway/config-agents)，内容包括：

- `agents.defaults.*`（工作区、模型、思考、心跳、内存、媒体、skills、沙箱）
- `multiAgent.*`（多智能体路由与绑定）
- `session.*`（会话生命周期、压缩、修剪）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.speechLocale`：iOS/macOS 上 Talk 语音识别使用的可选 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保持平台默认停顿窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）

## 工具与自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义
提供商 / base-URL 设置已移至独立页面 —— 请参见
[配置 — 工具与自定义提供商](/zh-CN/gateway/config-tools)。

## MCP

由 OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，
供嵌入式 Pi 和其他运行时适配器使用。`openclaw mcp list`、
`show`、`set` 和 `unset` 命令会管理此配置块，而不会在
编辑配置期间连接到目标服务器。

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

- `mcp.servers`：为暴露已配置 MCP 工具的运行时提供按名称区分的 stdio 或远程 MCP 服务器定义。
- `mcp.sessionIdleTtlMs`：用于会话级内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求在运行结束时清理；此 TTL 是长期会话和未来调用方的兜底机制。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时来热应用。
  下一次工具发现/使用时会根据新配置重新创建它们，因此被移除的
  `mcp.servers` 条目会立即清理，而不必等待空闲 TTL。

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅针对内置 skills 的可选允许列表（不影响受管理/workspace skills）。
- `load.extraDirs`：额外的共享 skill 根目录（优先级最低）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规范的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使某个 skill 已内置/已安装，也会将其禁用。
- `entries.<skillKey>.apiKey`：为声明了主环境变量的 skill 提供的便捷字段（明文字符串或 SecretRef 对象）。

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
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（插件支持时可用）。
- `plugins.entries.<id>.env`：插件作用域环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子以及受支持的 bundle 提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：为 `true` 时，受信任的非内置插件可以从类型化钩子中读取原始会话内容，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任该插件可以为后台子智能体运行请求按次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖可用的规范化 `provider/model` 目标可选允许列表。仅在你明确想允许任意模型时使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（在可用时由原生 OpenClaw 插件 schema 验证）。
- 渠道插件的账号/运行时设置位于 `channels.<id>` 下，应由所属插件 manifest 的 `channelConfigs` 元数据描述，而不是由集中式 OpenClaw 选项注册表描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：Firecrawl API key（接受 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认值：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主内容（默认值：`true`）。
  - `maxAgeMs`：最大缓存时长（毫秒）（默认值：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时秒数（默认值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。阶段和阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：dreaming 总开关（默认值 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 频率（默认值为 `"0 3 * * *"`）。
  - `model`：可选的 Dream Diary 子智能体模型覆盖。要求 `plugins.entries.memory-core.subagent.allowModelOverride: true`；可配合 `allowedModels` 限制目标。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整 memory 配置位于 [内存配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件也可以通过 `settings.json` 提供嵌入式 Pi 默认值；OpenClaw 会将其作为经过净化的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动 memory 插件 id，或使用 `"none"` 禁用 memory 插件。
- `plugins.slots.contextEngine`：选择活动 context engine 插件 id；默认值为 `"legacy"`，除非你安装并选择了其他引擎。

请参见 [Plugins](/zh-CN/tools/plugin)。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在受信任的私有网络访问中选择启用
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
- `tabCleanup` 会在空闲一段时间后，或当某个会话超过其标签页上限时，回收已跟踪的主智能体标签页。将 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 设为 0，可分别禁用对应的单项清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 在未设置时处于禁用状态，因此浏览器导航默认保持严格模式。
- 仅当你明确信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间也会受到相同的私有网络阻止。
- `ssrfPolicy.allowPrivateNetwork` 仍然作为旧版别名受到支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 来添加显式例外。
- 远程配置文件仅支持附加模式（禁用启动/停止/重置）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；
  当你的提供商直接提供 DevTools WebSocket URL 时，请使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程及
  `attachOnly` CDP 的可达性检查，以及打开标签页请求。受管理的 local loopback
  配置文件会继续使用本地 CDP 默认值。
- 如果某个外部管理的 CDP 服务可通过 loopback 访问，请将该
  配置文件的 `attachOnly: true` 设为 true；否则 OpenClaw 会将该 loopback 端口视为
  本地受管理浏览器配置文件，并可能报告本地端口占用错误。
- `existing-session` 配置文件使用 Chrome MCP 而非 CDP，并且可以附加到所选主机或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以定位特定的
  Chromium 内核浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件会保留当前 Chrome MCP 的路由限制：
  使用 snapshot/ref 驱动的操作，而不是 CSS 选择器定位；单文件上传
  钩子；不支持对话框超时覆盖；不支持 `wait --load networkidle`；也不支持
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地受管理的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 场景下才显式设置 `cdpUrl`。
- 本地受管理配置文件可以设置 `executablePath`，以覆盖该配置文件的全局
  `browser.executablePath`。你可以用它让一个配置文件运行在 Chrome 中，另一个运行在 Brave 中。
- 本地受管理配置文件会在进程启动后使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP
  发现，并使用 `browser.localCdpReadyTimeoutMs` 检查启动后的 CDP websocket 就绪状态。
  在较慢主机上，如果 Chrome 已成功启动但就绪检查与启动发生竞争，请提高这两个值。
  两个值都必须是最大不超过 `120000` ms 的正整数；无效配置值会被拒绝。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都
  支持在 Chromium 启动前将 `~` 和 `~/...` 展开为你操作系统的 home 目录。
  `existing-session` 配置文件中的按配置文件设置的 `userDataDir` 也会进行波浪号展开。
- 控制服务：仅 loopback（端口由 `gateway.port` 派生，默认值为 `18791`）。
- `extraArgs` 会向本地 Chromium 启动附加额外启动标志（例如
  `--disable-gpu`、窗口大小设置或调试标志）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji、短文本、图片 URL 或 data URI
    },
  },
}
```

- `seamColor`：原生应用 UI 外观的强调色（Talk 模式气泡着色等）。
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
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 用于 mode=trusted-proxy；参见 /gateway/trusted-proxy-auth
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
      // allowExternalEmbedUrls: false, // 危险：允许绝对外部 http(s) 嵌入 URL
      // allowedOrigins: ["https://control.example.com"], // 非 loopback Control UI 必填
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的 Host 标头源回退模式
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
    // 可选。默认值 false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 可选。默认未设置/禁用。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 额外的 /tools/invoke HTTP 拒绝项
      deny: ["browser"],
      // 从默认 HTTP 拒绝列表中移除工具
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

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。只有在 `local` 模式下，Gateway 网关才允许启动。
- `port`：WS + HTTP 共用的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关无法访问。请使用 `--network host`，或设置 `bind: "lan"`（或 `bind: "custom"` 并配合 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认必需。非 loopback bind 必须启用 Gateway 网关认证。实际使用中，这意味着共享 token/password，或使用设置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认会生成一个 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式将 `gateway.auth.mode` 设为 `token` 或 `password`。如果两者都已配置但未设置 mode，启动以及服务安装/修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于受信任的本地 loopback 设置；新手引导提示不会提供此选项，这是有意为之。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求代理来源为**非 loopback**；同主机上的 loopback 反向代理不满足 trusted-proxy 认证要求。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份标头可以满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用这种 Tailscale 标头认证；它们仍遵循 Gateway 网关正常的 HTTP 认证模式。这种无 token 流程假定 Gateway 网关主机是受信任的。当 `tailscale.mode = "serve"` 时，默认值为 `true`。
- `gateway.auth.rateLimit`：可选的认证失败限速器。按客户端 IP 和认证范围分别生效（共享密钥和设备 token 会分别跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败记录前进行串行化。因此，同一客户端并发的错误尝试，可能会在第二个请求时触发限速器，而不是两个请求都作为普通不匹配同时通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；如果你有意让 localhost 流量也受到限速（例如用于测试环境或严格代理部署），请设为 `false`。
- 来自浏览器来源的 WS 认证尝试始终会被限流，且不会豁免 loopback（作为防御纵深的一部分，以防浏览器发起的 localhost 暴力破解）。
- 在 loopback 上，这些浏览器来源的锁定会按规范化后的 `Origin`
  值隔离，因此来自某个 localhost origin 的重复失败不会自动
  锁定另一个 origin。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开访问，需要认证）。
- `controlUi.allowedOrigins`：用于 Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。当预期浏览器客户端来自非 loopback 来源时，此项为必填。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，启用基于 Host 标头的来源回退，适用于有意依赖 Host 标头来源策略的部署。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须为 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端进程环境变量中的
  break-glass 覆盖项，允许向受信任私有网络 IP 使用明文 `ws://`；
  默认仍仅允许 loopback 使用明文。没有对应的 `openclaw.json`
  配置项，并且浏览器私有网络配置，例如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`，不会影响 Gateway 网关
  WebSocket 客户端。
- `gateway.remote.token` / `.password`：远程客户端凭证字段。它们本身不会配置 Gateway 网关认证。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 构建在将基于 relay 的注册发布到 Gateway 网关后，供外部 APNs relay 使用的基础 HTTPS URL。此 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时时间（毫秒）。默认值为 `10000`。
- 基于 relay 的注册会委派给特定的 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并向 Gateway 网关转发一个以注册为范围的发送授权。另一个 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 配置的临时环境变量覆盖项。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅开发环境可用的逃生舱设置，用于 loopback HTTP relay URL。生产 relay URL 应保持使用 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔（分钟）。设为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧 socket 阈值（分钟）。应保持大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号在滚动一小时内允许的最大健康监控重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控开启的同时，按渠道选择退出健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖项。设置后会优先于渠道级覆盖项。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可以回退使用 `gateway.remote.*`。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但未能解析，则解析会以关闭方式失败（不会用远程回退来掩盖问题）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理），loopback 条目仍然有效，但它们**不会**让 loopback 请求符合 `gateway.auth.mode: "trusted-proxy"` 的要求。
- `allowRealIpFallback`：当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现失败即关闭的行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选的 CIDR/IP 允许列表，用于自动批准首次节点设备配对，前提是没有请求任何作用域。未设置时禁用。它不会自动批准 operator/browser/Control UI/WebChat 配对，也不会自动批准角色、作用域、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在完成配对和允许列表评估后，对声明的节点命令进行全局允许/拒绝控制。
- `gateway.tools.deny`：额外阻止用于 HTTP `POST /tools/invoke` 的工具名（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；如需禁用 URL 抓取，请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false`。
- 可选的响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅对你控制的 HTTPS 来源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在同一主机上运行多个 Gateway 网关时，请为每个实例使用不同的端口和状态目录：

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

- `enabled`：在 Gateway 网关监听器上启用 TLS 终止（HTTPS/WSS）（默认值：`false`）。
- `autoGenerate`：当未配置显式文件时，自动生成本地自签名 cert/key 对；仅适用于本地/开发环境。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；应限制其访问权限。
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

- `mode`：控制运行时如何应用配置修改。
  - `"off"`：忽略实时修改；更改需要显式重启。
  - `"restart"`：配置变更时始终重启 Gateway 网关进程。
  - `"hot"`：无需重启，在进程内应用更改。
  - `"hybrid"`（默认）：先尝试热重载；如有需要则回退到重启。
- `debounceMs`：应用配置更改前的防抖窗口，单位为毫秒（非负整数）。
- `deferralTimeoutMs`：可选的最长等待时间（毫秒），用于等待进行中的操作完成后再强制重启。省略此项或设为 `0` 表示无限等待，并定期记录“仍在等待”的警告。

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

- `hooks.enabled=true` 要求提供非空的 `hooks.token`。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果某个 mapping 或 preset 使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态 mapping 键不需要此显式启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true` 时，才接受请求负载中的 `sessionKey`（默认值：`false`）。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染后的 mapping `sessionKey` 值会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的某个负载字段。
- 像 `{{messages[0].subject}}` 这样的模板会从负载中读取。
- `transform` 可以指向一个返回 hook action 的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且必须位于 `hooks.transformsDir` 内（绝对路径和路径穿越会被拒绝）。
- `agentId` 将路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 全部允许，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于未显式提供 `sessionKey` 的 hook 智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的 mapping 会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + mapping）的可选前缀允许列表，例如 `["hook:"]`。当任一 mapping 或 preset 使用模板化 `sessionKey` 时，此项变为必需。
- `deliver: true` 会将最终回复发送到渠道；`channel` 默认为 `last`。
- `model`：覆盖此次 hook 运行的 LLM（如果设置了模型目录，则该模型必须在允许范围内）。

</Accordion>

### Gmail 集成

- 内置 Gmail preset 使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由的方式，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
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

- 配置后，Gateway 网关会在启动时自动启动 `gog gmail watch serve`。如需禁用，请设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1`。
- 不要在 Gateway 网关旁边单独运行另一个 `gog gmail watch serve`。

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 通过 Gateway 网关端口下的 HTTP 提供由智能体可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback bind：canvas 路由与其他 Gateway 网关 HTTP 面相同，需要 Gateway 网关认证（token/password/trusted-proxy）。
- 节点 WebView 通常不会发送认证标头；在节点完成配对并连接后，Gateway 网关会为 canvas/A2UI 访问通告节点作用域的 capability URL。
- capability URL 绑定到当前活动节点的 WS 会话，并且过期很快。不会使用基于 IP 的回退。
- 会向所提供的 HTML 中注入 live-reload 客户端。
- 为空时会自动创建起始 `index.html`。
- 也会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
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

- `minimal`（默认）：在 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 当系统主机名是有效 DNS 标签时，hostname 默认使用系统主机名，否则回退为 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

会在 `~/.openclaw/dns/` 下写入一个单播 DNS-SD 区域。若需跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS。

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

- 仅当进程环境中缺少该键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录下的 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
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

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/为空的变量会在加载配置时抛出错误。
- 使用 `$${VAR}` 可转义为字面量 `${VAR}`。
- 可与 `$include` 一起使用。

---

## Secrets

SecretRef 是增量式的：明文值仍然可用。

### `SecretRef`

使用以下对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 `id` 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 `id`：绝对 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 `id` 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 `id` 不能包含以 `/` 分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证面

- 规范矩阵：[SecretRef 凭证面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 会定位受支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` 中的引用也包含在运行时解析和审计覆盖范围内。

### Secret providers 配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选的显式 env provider
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
- 当 Windows ACL 验证不可用时，file 和 exec provider 路径会以关闭方式失败。仅对无法验证但受信任的路径设置 `allowInsecurePath: true`。
- `exec` provider 要求 `command` 为绝对路径，并通过 stdin/stdout 使用协议负载。
- 默认情况下，符号链接命令路径会被拒绝。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时仍验证解析后的目标路径。
- 如果配置了 `trustedDirs`，受信任目录检查会应用到解析后的目标路径。
- `exec` 子进程环境默认最小化；如需变量，请通过 `passEnv` 显式传递。
- SecretRef 会在激活时解析为内存快照，之后请求路径仅从该快照读取。
- 激活时会应用活动面过滤：启用面上的未解析引用会导致启动/重载失败，而非活动面会跳过并记录诊断信息。

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

- 按智能体区分的 profile 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持静态凭证模式的值级引用（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- OAuth 模式的 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 提供支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中的已解析快照；发现旧版静态 `auth.json` 条目时会将其清理。
- 旧版 OAuth 会从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参见 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为以及 `audit/configure/apply` 工具：请参见 [Secrets Management](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：当某个 profile 因真实账单/余额不足错误失败时的基础退避时长（小时）（默认值：`5`）。即使响应为 `401`/`403`，显式的账单类文本仍可能归入这里，但提供商特定的文本匹配器仍会限定在其所属提供商内（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 用量窗口或 organization/workspace 支出上限消息，仍会归入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的按提供商覆盖账单退避小时数。
- `billingMaxHours`：账单退避指数增长的上限（小时）（默认值：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避时长（分钟）（默认值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的上限（分钟）（默认值：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口（小时）（默认值：`24`）。
- `overloadedProfileRotations`：在切换到模型回退前，同一提供商内因过载错误而允许进行的最大 auth-profile 轮换次数（默认值：`1`）。像 `ModelNotReadyException` 这样的提供商繁忙形态会落到这里。
- `overloadedBackoffMs`：在重试过载的提供商/profile 轮换前的固定延迟（毫秒）（默认值：`0`）。
- `rateLimitedProfileRotations`：在切换到模型回退前，同一提供商内因速率限制错误而允许进行的最大 auth-profile 轮换次数（默认值：`1`）。该速率限制桶包括提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 以及 `resource exhausted`。

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
- 设置 `logging.file` 以使用固定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：轮转前活动日志文件的最大大小（字节）（正整数；默认值：`104857600` = 100 MB）。OpenClaw 会在活动文件旁保留最多五个带编号的归档文件。
- `redactSensitive` / `redactPatterns`：尽力对控制台输出、文件日志、OTLP 日志记录以及持久化的会话转录文本进行脱敏。

---

## Diagnostics

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

- `enabled`：仪表输出的总开关（默认值：`true`）。
- `flags`：用于启用定向日志输出的标志字符串数组（支持诸如 `"telegram.*"` 或 `"*"` 之类的通配符）。
- `stuckSessionWarnMs`：当会话仍处于处理中状态时，发出卡住会话警告的年龄阈值（毫秒）。
- `otel.enabled`：启用 OpenTelemetry 导出管道（默认值：`false`）。有关完整配置、信号目录和隐私模型，请参见 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：用于 OTel 导出的采集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的按信号区分的 OTLP 端点。设置后，它们仅对对应信号覆盖 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.sampleRate`：trace 采样率，范围 `0`–`1`。
- `otel.flushIntervalMs`：周期性遥测刷新间隔（毫秒）。
- `otel.captureContent`：选择启用 OTEL span 属性中的原始内容捕获。默认关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式则允许你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：环境开关，用于启用最新的实验性 GenAI span provider 属性。默认情况下，span 会保留旧版 `gen_ai.system` 属性以保持兼容；GenAI metrics 使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：适用于已注册全局 OpenTelemetry SDK 的主机的环境开关。此时 OpenClaw 会跳过由插件拥有的 SDK 启动/关闭，同时保持诊断监听器处于活动状态。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：当对应配置键未设置时使用的按信号区分端点环境变量。
- `cacheTrace.enabled`：记录嵌入式运行的缓存跟踪快照（默认值：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
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

- `channel`：用于 npm/git 安装的发布渠道 —— `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认值：`true`）。
- `auto.enabled`：为软件包安装启用后台自动更新（默认值：`false`）。
- `auto.stableDelayHours`：稳定渠道自动应用前的最短延迟（小时）（默认值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：稳定渠道额外发布分散窗口（小时）（默认值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行的频率（小时）（默认值：`1`；最大值：`24`）。

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

- `enabled`：全局 ACP 功能开关（默认值：`true`；设为 `false` 可隐藏 ACP 分发和生成相关入口）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认值：`true`）。设为 `false` 可保留 ACP 命令可用，同时阻止执行。
- `backend`：默认 ACP 运行时后端 id（必须匹配已注册的 ACP 运行时插件）。
  如果设置了 `plugins.allow`，请包含该后端插件 id（例如 `acpx`），否则内置默认插件将不会加载。
- `defaultAgent`：当生成操作未指定显式目标时使用的 ACP 后备目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id 允许列表；空值表示不施加额外限制。
- `maxConcurrentSessions`：允许同时处于活动状态的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲合并刷新窗口（毫秒）。
- `stream.maxChunkChars`：在拆分流式分块投影前允许的最大块大小。
- `stream.repeatSuppression`：按轮次抑制重复的状态/工具行（默认值：`true`）。
- `stream.deliveryMode`：`"live"` 递增式流式输出；`"final_only"` 会缓冲直到轮次终结事件。
- `stream.hiddenBoundarySeparator`：在隐藏工具事件之后、可见文本之前插入的分隔符（默认值：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次可投影的智能体输出最大字符数。
- `stream.maxSessionUpdateChars`：可投影的 ACP 状态/更新行最大字符数。
- `stream.tagVisibility`：用于流式事件的标签名到布尔可见性覆盖的记录。
- `runtime.ttlMinutes`：ACP 会话工作器空闲多久后可被清理的 TTL（分钟）。
- `runtime.installCommand`：引导 ACP 运行时环境时可选执行的安装命令。

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
  - `"off"`：不显示标语文本（仍显示横幅标题/版本）。
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

## Identity

请参见 [智能体默认值](/zh-CN/gateway/config-agents#agent-defaults) 下的 `agents.list` identity 字段。

---

## Bridge protocol（旧版节点，历史参考）

当前构建已不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除前验证会失败；`openclaw doctor --fix` 可移除未知键）。

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
    maxConcurrentRuns: 2, // cron 分发 + 隔离的 cron 智能体轮次执行
    webhook: "https://example.invalid/legacy", // 用于已存储 notify:true 作业的已弃用回退项
    webhookToken: "replace-with-dedicated-token", // 可选的出站 webhook 认证 bearer token
    sessionRetention: "24h", // 时长字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

- `sessionRetention`：在从 `sessions.json` 中修剪前，保留已完成隔离 cron 运行会话的时长。也控制已归档的已删除 cron 转录内容的清理。默认值：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在修剪前的最大大小。默认值：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志修剪时保留的最新行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；若省略则不会发送认证标头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），仅用于仍设置了 `notify: true` 的已存储作业。

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

- `maxAttempts`：一次性作业在瞬时错误下允许的最大重试次数（默认值：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组（毫秒）（默认值：`[30000, 60000, 300000]`；1–10 个条目）。
- `retryOn`：触发重试的错误类型 —— `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则表示重试所有瞬时错误类型。

仅适用于一次性 cron 作业。周期性作业使用单独的失败处理机制。

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

- `enabled`：启用 cron 作业失败告警（默认值：`false`）。
- `after`：在触发告警前所需的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一作业重复告警之间的最小间隔（毫秒）（非负整数）。
- `includeSkipped`：是否将连续跳过的运行计入告警阈值（默认值：`false`）。跳过的运行会单独跟踪，不影响执行错误退避。
- `mode`：投递模式 —— `"announce"` 通过渠道消息发送；`"webhook"` 向已配置的 webhook 发送 POST 请求。
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

- 所有作业共用的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够的目标数据时，默认值为 `"announce"`。
- `channel`：announce 投递的渠道覆盖项。`"last"` 会复用最后一个已知投递渠道。
- `to`：显式的 announce 目标或 webhook URL。在 webhook 模式下为必填。
- `accountId`：可选的投递账号覆盖项。
- 每个作业的 `delivery.failureDestination` 会覆盖这个全局默认值。
- 当全局和单作业失败目标都未设置时，已经通过 `announce` 投递的作业会在失败时回退到其主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的作业，除非该作业的主 `delivery.mode` 为 `"webhook"`。

请参见 [Cron Jobs](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量 | 说明 |
| ------------------ | ------------------------------------------------- |
| `{{Body}}` | 完整入站消息正文 |
| `{{RawBody}}` | 原始正文（不含历史记录/发送者包装） |
| `{{BodyStripped}}` | 去除群组提及后的正文 |
| `{{From}}` | 发送者标识符 |
| `{{To}}` | 目标标识符 |
| `{{MessageSid}}` | 渠道消息 id |
| `{{SessionId}}` | 当前会话 UUID |
| `{{IsNewSession}}` | 新会话创建时为 `"true"` |
| `{{MediaUrl}}` | 入站媒体伪 URL |
| `{{MediaPath}}` | 本地媒体路径 |
| `{{MediaType}}` | 媒体类型（image/audio/document/…） |
| `{{Transcript}}` | 音频转录文本 |
| `{{Prompt}}` | CLI 条目的已解析媒体提示词 |
| `{{MaxChars}}` | CLI 条目的已解析最大输出字符数 |
| `{{ChatType}}` | `"direct"` 或 `"group"` |
| `{{GroupSubject}}` | 群组主题（尽力而为） |
| `{{GroupMembers}}` | 群组成员预览（尽力而为） |
| `{{SenderName}}` | 发送者显示名称（尽力而为） |
| `{{SenderE164}}` | 发送者电话号码（尽力而为） |
| `{{Provider}}` | 提供商提示（whatsapp、telegram、discord 等） |

---

## 配置包含（`$include`）

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

- 单个文件：替换所在容器对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在 include 之后合并（覆盖 include 的值）。
- 嵌套 include：最多 10 层深。
- 路径：相对于包含它的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。只有在最终解析结果仍位于该边界内时，才允许使用绝对路径/`../` 形式。
- 当 OpenClaw 自有写入仅更改由单文件 include 支持的一个顶层 section 时，会直写到该 include 文件。例如，`plugins install` 会将 `plugins: { $include: "./plugins.json5" }` 的更新写入 `plugins.json5`，并保持 `openclaw.json` 不变。
- 根级 include、include 数组以及带有同级覆盖的 include，对于 OpenClaw 自有写入均为只读；这类写入会以关闭方式失败，而不是将配置展平。
- 错误：对于缺失文件、解析错误和循环 include，会给出清晰的错误消息。

---

_相关内容：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

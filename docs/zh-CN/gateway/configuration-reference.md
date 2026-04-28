---
read_when:
    - 你需要精确的字段级配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具的配置块
summary: Gateway 网关配置参考，涵盖 OpenClaw 核心键、默认值，以及指向专用子系统参考的链接
title: 配置参考
x-i18n:
    generated_at: "2026-04-28T11:51:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6123522ecc016e5dcbede9bfd215491dc04e5b94bce5fcff1b555c29f54ff1e
    source_path: gateway/configuration-reference.md
    workflow: 16
---

核心配置参考，适用于 `~/.openclaw/openclaw.json`。有关面向任务的概览，请参阅[配置](/zh-CN/gateway/configuration)。

涵盖主要 OpenClaw 配置表面；当某个子系统有自己的更深入参考时，会链接到对应页面。渠道和插件拥有的命令目录，以及深层 memory/QMD 开关，位于各自页面，而不是本页。

代码事实来源：

- `openclaw config schema` 会打印用于校验和控制 UI 的实时 JSON Schema；在可用时会合并内置/插件/渠道元数据
- `config.schema.lookup` 会返回一个按路径限定的 schema 节点，供下钻工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面校验配置文档基线哈希

智能体查找路径：编辑前，使用 `gateway` 工具动作 `config.schema.lookup`
获取精确的字段级文档和约束。使用
[配置](/zh-CN/gateway/configuration) 获取面向任务的指导，并使用本页
查看更广泛的字段映射、默认值以及指向子系统参考的链接。

专用深层参考：

- [内存配置参考](/zh-CN/reference/memory-config)，用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 Dreaming 配置
- [Slash commands](/zh-CN/tools/slash-commands)，用于当前内置 + 内置打包命令目录
- 所属渠道/插件页面，用于渠道特定的命令表面

配置格式为 **JSON5**（允许注释 + 尾随逗号）。所有字段都是可选的 — 省略时 OpenClaw 会使用安全默认值。

---

## 渠道

按渠道配置键已移至专用页面 — 请参阅
[配置 — 渠道](/zh-CN/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他
内置渠道（认证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

已移至专用页面 — 请参阅
[配置 — 智能体](/zh-CN/gateway/config-agents)，了解：

- `agents.defaults.*`（工作区、模型、思考、心跳、内存、媒体、skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、修剪）
- `messages.*`（消息投递、TTS、markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.speechLocale`：可选的 BCP 47 区域设置 ID，用于 iOS/macOS 上的 Talk 语音识别
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保留平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义
提供商 / base-URL 设置已移至专用页面 — 请参阅
[配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## Models

提供商定义、模型允许列表和自定义提供商设置位于
[配置 — 工具和自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根级还拥有全局模型目录行为。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：按提供商 ID 作为键的自定义提供商映射。
- `models.pricing.enabled`：控制后台定价启动流程。当为
  `false` 时，Gateway 网关启动会跳过 OpenRouter 和 LiteLLM 定价目录抓取；
  已配置的 `models.providers.*.models[].cost` 值仍可用于本地成本
  估算。

## MCP

由 OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，并由嵌入式 Pi
和其他运行时适配器使用。`openclaw mcp list`、
`show`、`set` 和 `unset` 命令会管理此块，且在配置编辑期间不会连接到
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

- `mcp.servers`：命名 stdio 或远程 MCP 服务器定义，供暴露已配置 MCP 工具的运行时使用。
  远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI 原生别名，`openclaw mcp set` 和
  `openclaw doctor --fix` 会将其规范化为标准 `transport` 字段。
- `mcp.sessionIdleTtlMs`：会话级内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求运行结束清理；此 TTL 是长生命周期会话和未来调用方的兜底。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时来热应用。
  下一次工具发现/使用会根据新配置重新创建它们，因此被移除的
  `mcp.servers` 条目会立即回收，而不是等待空闲 TTL。

请参阅 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和
[CLI 后端](/zh-CN/gateway/cli-backends#bundle-mcp-overlays)，了解运行时行为。

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

- `allowBundled`：可选的内置 Skills 允许列表（受管理/工作区 Skills 不受影响）。
- `load.extraDirs`：额外的共享 Skill 根目录（最低优先级）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规格的 node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false` 会禁用某个 Skill，即使它是内置/已安装的。
- `entries.<skillKey>.apiKey`：用于声明主环境变量的 Skills 的便利字段（明文字符串或 SecretRef 对象）。

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
- 设备发现接受原生 OpenClaw 插件，以及兼容的 Codex 包和 Claude 包，包括没有清单的 Claude 默认布局包。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便利字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，core 会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会改动 prompt 的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子和受支持包提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非内置插件可以从类型化钩子读取原始对话内容，例如 `llm_input`、`llm_output`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件，使其可以为后台子智能体运行请求按次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：用于受信任子智能体覆盖的规范 `provider/model` 目标可选允许列表。只有在你有意允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.config`：插件定义的配置对象（在可用时由原生 OpenClaw 插件 schema 校验）。
- 渠道插件账号/运行时设置位于 `channels.<id>` 下，并应由所属插件的清单 `channelConfigs` 元数据描述，而不是由中央 OpenClaw 选项注册表描述。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：Firecrawl API key（接受 SecretRef）。回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅从页面提取主要内容（默认：`true`）。
  - `maxAgeMs`：最大缓存时间，单位为毫秒（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间，单位为秒（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory dreaming 设置。请参阅 [Dreaming](/zh-CN/concepts/dreaming)，了解阶段和阈值。
  - `enabled`：主 dreaming 开关（默认 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 频率（默认为 `"0 3 * * *"`）。
  - `model`：可选的 Dream Diary 子智能体模型覆盖。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；搭配 `allowedModels` 使用以限制目标。模型不可用错误会使用会话默认模型重试一次；信任或允许列表失败不会静默回退。
  - 阶段策略和阈值是实现细节（不是面向用户的配置键）。
- 完整内存配置位于[内存配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude 包插件也可以从 `settings.json` 提供嵌入式 Pi 默认值；OpenClaw 会将这些默认值作为经过清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动内存插件 ID，或使用 `"none"` 禁用内存插件。
- `plugins.slots.contextEngine`：选择活动 context engine 插件 ID；默认是 `"legacy"`，除非你安装并选择了另一个引擎。

请参阅[插件](/zh-CN/tools/plugin)。

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
- `tabCleanup` 会在空闲时间后，或在会话超出上限时，回收已跟踪的主智能体标签页。设置 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可禁用对应的单项清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置时会被禁用，因此浏览器导航默认保持严格。
- 仅在你有意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间，也会受到同样的私有网络阻断限制。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 明确配置例外。
- 远程配置文件仅支持附加（禁用启动/停止/重置）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)；当你的提供商提供直接的 DevTools WebSocket URL 时使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程和 `attachOnly` CDP 可达性，以及标签页打开请求。托管的 loopback 配置文件保留本地 CDP 默认值。
- 如果外部托管的 CDP 服务可通过 loopback 访问，请将该配置文件的 `attachOnly: true`；否则 OpenClaw 会把该 loopback 端口视为本地托管浏览器配置文件，并可能报告本地端口所有权错误。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以在所选主机上或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以指向特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：使用快照/ref 驱动的操作，而不是 CSS 选择器定位；单文件上传钩子；无对话框超时覆盖；无 `wait --load networkidle`；且不支持 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；只有远程 CDP 才需要显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局 `browser.executablePath`。可用它让一个配置文件运行 Chrome，另一个运行 Brave。
- 本地托管配置文件在进程启动后，会使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP 发现，并使用 `browser.localCdpReadyTimeoutMs` 等待启动后的 CDP websocket 就绪。在较慢主机上，如果 Chrome 能成功启动但就绪检查与启动过程发生竞态，请调高这些值。两个值都必须是最大为 `120000` ms 的正整数；无效配置值会被拒绝。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，表示在 Chromium 启动前展开为你的操作系统主目录。`existing-session` 配置文件中的每配置文件 `userDataDir` 也会进行波浪号展开。
- 控制服务：仅 loopback（端口派生自 `gateway.port`，默认 `18791`）。
- `extraArgs` 会向本地 Chromium 启动追加额外启动标志（例如 `--disable-gpu`、窗口大小设置或调试标志）。

---

## 界面

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

- `seamColor`：原生应用 UI 外框的强调色（Talk Mode 气泡色调等）。
- `assistant`：Control UI 身份覆盖。回退到活动智能体身份。

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

- `mode`: `local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`: WS + HTTP 共用的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版绑定别名**：在 `gateway.bind` 中使用绑定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` 绑定会在容器内监听 `127.0.0.1`。使用 Docker 桥接网络（`-p 18789:18789`）时，流量会从 `eth0` 到达，因此 Gateway 网关无法访问。使用 `--network host`，或设置 `bind: "lan"`（或使用 `bind: "custom"` 并设置 `customBindHost: "0.0.0.0"`）以监听所有网络接口。
- **凭证**：默认必需。非 `loopback` 绑定需要 Gateway 网关凭证。实际中这意味着共享令牌/密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认会生成令牌。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。当两者都已配置且未设置模式时，启动以及服务安装/修复流程会失败。
- `gateway.auth.mode: "none"`：显式无凭证模式。仅用于可信的 local loopback 设置；新手引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将浏览器/用户凭证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见 [可信代理凭证](/zh-CN/gateway/trusted-proxy-auth)）。默认情况下，此模式期望代理来源为**非 loopback**；同主机的 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。内部同主机调用方可以使用 `gateway.auth.password` 作为本地直连回退；`gateway.auth.token` 仍然与 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 当为 `true` 时，Tailscale Serve 身份标头可以满足 Control UI/WebSocket 凭证要求（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 标头凭证；它们会改为遵循 Gateway 网关的常规 HTTP 凭证模式。此无令牌流程假设 Gateway 网关主机是可信的。当 `tailscale.mode = "serve"` 时，默认值为 `true`。
- `gateway.auth.rateLimit`: 可选的凭证失败限制器。按客户端 IP 和凭证范围应用（shared-secret 和 device-token 会独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败之前串行化。因此，来自同一客户端的并发错误尝试可能会在第二个请求时触发限制器，而不是两个请求都以普通不匹配的形式竞速通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；当你有意希望 localhost 流量也受到速率限制时（例如测试设置或严格代理部署），请设置为 `false`。
- 浏览器来源的 WS 凭证尝试始终会被节流，并禁用 loopback 豁免（针对基于浏览器的 localhost 暴力破解提供纵深防御）。
- 在 loopback 上，这些浏览器来源的锁定会按规范化的 `Origin`
  值隔离，因此来自某个 localhost 来源的重复失败不会自动
  锁定另一个不同来源。
- `tailscale.mode`: `serve`（仅 tailnet，loopback 绑定）或 `funnel`（公开，需要凭证）。
- `controlUi.allowedOrigins`: Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。当预期浏览器客户端来自非 loopback 来源时必需。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危险模式，会为有意依赖 Host 标头来源策略的部署启用 Host 标头来源回退。
- `remote.transport`: `ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: 客户端进程环境
  break-glass 覆盖，允许对可信私有网络
  IP 使用明文 `ws://`；明文默认仍仅限 loopback。没有等价的 `openclaw.json`
  配置，并且诸如
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` 之类的浏览器私有网络配置不会影响 Gateway 网关
  WebSocket 客户端。
- `gateway.remote.token` / `.password` 是远程客户端凭据字段。它们本身不会配置 Gateway 网关凭证。
- `gateway.push.apns.relay.baseUrl`: 外部 APNs 中继的 HTTPS 基础 URL，官方/TestFlight iOS 构建在向 Gateway 网关发布中继支持的注册后会使用它。此 URL 必须与编译进 iOS 构建的中继 URL 匹配。
- `gateway.push.apns.relay.timeoutMs`: Gateway 网关到中继的发送超时时间，单位为毫秒。默认值：`10000`。
- 中继支持的注册会委托给特定的 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在中继注册中包含该身份，并将注册范围的发送授权转发给 Gateway 网关。另一个 Gateway 网关无法复用该已存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述中继配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 仅用于开发的逃生口，允许 loopback HTTP 中继 URL。生产中继 URL 应保持使用 HTTPS。
- `gateway.channelHealthCheckMinutes`: 渠道健康监控间隔，单位为分钟。设置为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`: 陈旧套接字阈值，单位为分钟。保持其大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`: 滚动一小时内每个渠道/账户的最大健康监控重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`: 单个渠道的退出选项，用于在保持全局监控启用的同时禁用健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多账户渠道的单账户覆盖。设置后，它优先于渠道级覆盖。
- 仅当未设置 `gateway.auth.*` 时，本地 Gateway 网关调用路径才能使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且无法解析，解析会以关闭方式失败（不会用远程回退掩盖）。
- `trustedProxies`: 终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。loopback 条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**让 loopback 请求符合 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`: 当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`: 可选的 CIDR/IP 允许列表，用于在没有请求范围的情况下自动批准首次节点设备配对。未设置时禁用。它不会自动批准 operator/browser/Control UI/WebChat 配对，也不会自动批准角色、范围、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 在配对和平台允许列表评估之后，对已声明节点命令进行全局允许/拒绝整形。使用 `allowCommands` 选择启用危险节点命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台默认或显式允许本应包含某个命令，`denyCommands` 也会移除该命令。节点更改其声明的命令列表后，请拒绝并重新批准该设备配对，以便 Gateway 网关存储更新后的命令快照。
- `gateway.tools.deny`: 阻止 HTTP `POST /tools/invoke` 的额外工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`: 从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 禁用 URL 获取。
- 可选响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅为你控制的 HTTPS 来源设置；参见 [可信代理凭证](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在一台主机上使用唯一端口和状态目录运行多个 Gateway 网关：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

参见 [多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

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

- `enabled`: 在 Gateway 网关监听器上启用 TLS 终止（HTTPS/WSS）（默认值：`false`）。
- `autoGenerate`: 在未配置显式文件时自动生成本地自签名证书/密钥对；仅用于本地/开发。
- `certPath`: TLS 证书文件的文件系统路径。
- `keyPath`: TLS 私钥文件的文件系统路径；保持权限受限。
- `caPath`: 用于客户端验证或自定义信任链的可选 CA bundle 路径。

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

- `mode`: 控制运行时如何应用配置编辑。
  - `"off"`: 忽略实时编辑；更改需要显式重启。
  - `"restart"`: 配置变更时始终重启 Gateway 网关进程。
  - `"hot"`: 在进程内应用更改，无需重启。
  - `"hybrid"`（默认）：先尝试热重载；如果需要则回退到重启。
- `debounceMs`: 应用配置变更前的去抖窗口，单位为毫秒（非负整数）。
- `deferralTimeoutMs`: 可选的最长等待时间，单位为毫秒，用于在强制重启前等待正在进行的操作。省略或设置为 `0` 表示无限期等待，并定期记录仍在等待的警告。

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

凭证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查询字符串钩子令牌会被拒绝。

验证与安全注意事项：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 必须与 `gateway.auth.token` **不同**；复用 Gateway 网关令牌会被拒绝。
- `hooks.path` 不能是 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要该选择启用项。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认值：`false`）时，才接受请求载荷中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染得到的映射 `sessionKey` 值会被视为外部提供的值，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="Mapping details">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- `{{messages[0].subject}}` 这样的模板从载荷读取内容。
- `transform` 可以指向返回钩子操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且保留在 `hooks.transformsDir` 内（绝对路径和路径遍历会被拒绝）。
- `agentId` 路由到特定智能体；未知 ID 回退到默认智能体。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 拒绝全部）。
- `defaultSessionKey`：可选的固定会话键，用于没有显式 `sessionKey` 的钩子智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任何映射或预设使用模板化的 `sessionKey` 时，它会变为必需项。
- `deliver: true` 将最终回复发送到渠道；`channel` 默认为 `last`。
- `model` 会覆盖此钩子运行使用的 LLM（如果设置了模型目录，则必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖该预设，而不是使用模板化默认值。

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
- 不要在 Gateway 网关旁边另行运行 `gog gmail watch serve`。

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
- 仅本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback 绑定：画布路由需要 Gateway 网关认证（令牌/密码/可信代理），与其他 Gateway 网关 HTTP 表面相同。
- Node WebViews 通常不会发送认证标头；节点配对并连接后，Gateway 网关会公布节点作用域的能力 URL，用于访问画布/A2UI。
- 能力 URL 绑定到活动节点 WS 会话，并且很快过期。不使用基于 IP 的回退。
- 将实时重载客户端注入到所提供的 HTML 中。
- 为空时自动创建起始 `index.html`。
- 也会在 `/__openclaw__/a2ui/` 提供 A2UI。
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

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 当系统主机名是有效 DNS 标签时，主机名默认使用系统主机名，否则回退到 `openclaw`。可用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）+ Tailscale 分割 DNS。

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

- 仅当进程环境缺少该键时，才会应用内联环境变量。
- `.env` 文件：CWD `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件导入缺失的预期键名。
- 完整优先级见[环境](/zh-CN/help/environment)。

### 环境变量替换

在任意配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 只匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/空变量会在配置加载时报错。
- 使用 `$${VAR}` 转义，以表示字面量 `${VAR}`。
- 可与 `$include` 配合使用。

---

## 密钥

密钥引用是增量式的：明文值仍然可用。

### `SecretRef`

使用一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` id 不得包含 `.` 或 `..` 这类以斜杠分隔的路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证作用面

- 规范矩阵：[SecretRef 凭证作用面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 面向受支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` 引用会纳入运行时解析和审计覆盖范围。

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

说明：

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必须是 `"value"`）。
- 当 Windows ACL 验证不可用时，file 和 exec 提供商路径会以关闭方式失败。仅对无法验证但可信的路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求使用绝对 `command` 路径，并通过 stdin/stdout 使用协议载荷。
- 默认情况下会拒绝符号链接命令路径。设置 `allowSymlinkCommand: true` 可在验证解析后的目标路径时允许符号链接路径。
- 如果配置了 `trustedDirs`，可信目录检查会应用到解析后的目标路径。
- 默认情况下，`exec` 子环境是最小化的；请使用 `passEnv` 显式传递所需变量。
- 密钥引用会在激活时解析为内存快照，随后请求路径只读取该快照。
- 激活期间会应用活跃作用面过滤：已启用作用面上的未解析引用会导致启动/重新加载失败，而非活跃作用面会被跳过并附带诊断信息。

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
- `auth-profiles.json` 支持静态凭证模式的值级引用（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 旧版扁平 `auth-profiles.json` 映射（例如 `{ "provider": { "apiKey": "..." } }`）不是运行时格式；`openclaw doctor --fix` 会将它们重写为规范的 `provider:default` API key 配置文件，并创建 `.legacy-flat.*.bak` 备份。
- OAuth 模式配置文件（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自内存中解析后的快照；发现旧版静态 `auth.json` 条目时会将其清理。
- 旧版 OAuth 从 `~/.openclaw/credentials/oauth.json` 导入。
- 见 [OAuth](/zh-CN/concepts/oauth)。
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

- `billingBackoffHours`：当配置文件因真实的计费/额度不足错误而失败时，基础退避小时数（默认值：`5`）。明确的计费文本即使出现在 `401`/`403` 响应中，仍可能归入这里，但提供商专属的文本匹配器只限定在拥有它们的提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或组织/工作区支出限制消息则会留在 `rate_limit` 路径中。
- `billingBackoffHoursByProvider`：可选的按提供商计费退避小时数覆盖值。
- `billingMaxHours`：计费退避指数增长的小时数上限（默认值：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避分钟数（默认值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟数上限（默认值：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口小时数（默认值：`24`）。
- `overloadedProfileRotations`：在切换到模型回退前，过载错误允许的同一提供商 auth-profile 最大轮换次数（默认值：`1`）。例如 `ModelNotReadyException` 这类提供商繁忙形态会归入这里。
- `overloadedBackoffMs`：重试过载提供商/配置文件轮换前的固定延迟（默认值：`0`）。
- `rateLimitedProfileRotations`：在切换到模型回退前，速率限制错误允许的同一提供商 auth-profile 最大轮换次数（默认值：`1`）。该速率限制桶包含提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- 设置 `logging.file` 以使用稳定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：轮转前当前活跃日志文件的最大字节数（正整数；默认值：`104857600` = 100 MB）。OpenClaw 会在活跃文件旁保留最多五个编号归档。
- `redactSensitive` / `redactPatterns`：对控制台输出、文件日志、OTLP 日志记录和持久化会话转录文本进行尽力而为的遮蔽。`redactSensitive: "off"` 只会禁用这种通用日志/转录策略；UI/工具/诊断安全表面在发出前仍会遮蔽密钥。

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

- `enabled`：仪表化输出的总开关（默认值：`true`）。
- `flags`：用于启用定向日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 等通配符）。
- `stuckSessionWarnMs`：当会话保持处理状态时，发出卡住会话警告的年龄阈值，单位为 ms。
- `otel.enabled`：启用 OpenTelemetry 导出管线（默认值：`false`）。完整配置、信号目录和隐私模型请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：用于 OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的信号特定 OTLP 端点。设置后，它们只会覆盖该信号的 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认值）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.sampleRate`：trace 采样率 `0`–`1`。
- `otel.flushIntervalMs`：周期性遥测刷新间隔，单位为 ms。
- `otel.captureContent`：选择启用 OTEL span 属性的原始内容捕获。默认关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式可让你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs` 和 `systemPrompt`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用于最新实验性 GenAI span provider 属性的环境开关。默认情况下，span 会保留旧版 `gen_ai.system` 属性以保持兼容；GenAI metrics 使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：用于已注册全局 OpenTelemetry SDK 的宿主的环境开关。随后 OpenClaw 会跳过插件自有 SDK 的启动/关闭，同时保持诊断监听器处于活跃状态。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：当匹配的配置键未设置时使用的信号特定端点环境变量。
- `cacheTrace.enabled`：为嵌入式运行记录缓存 trace 快照（默认值：`false`）。
- `cacheTrace.filePath`：缓存 trace JSONL 的输出路径（默认值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存 trace 输出中包含的内容（全部默认：`true`）。

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

- `channel`：npm/git 安装的发布渠道 — `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认值：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认值：`false`）。
- `auto.stableDelayHours`：稳定渠道自动应用前的最小延迟小时数（默认值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：额外的稳定渠道发布扩散窗口小时数（默认值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行频率，单位为小时（默认值：`1`；最大值：`24`）。

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

- `enabled`：全局 ACP 功能门控（默认值：`true`；设为 `false` 可隐藏 ACP 分派和生成入口）。
- `dispatch.enabled`：ACP 会话回合分派的独立门控（默认值：`true`）。设为 `false` 可保留 ACP 命令可用，同时阻止执行。
- `backend`：默认 ACP 运行时后端 id（必须匹配已注册的 ACP 运行时插件）。
  如果设置了 `plugins.allow`，请包含后端插件 id（例如 `acpx`），否则内置默认插件不会加载。
- `defaultAgent`：当生成未指定显式目标时使用的后备 ACP 目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id 许可列表；为空表示没有额外限制。
- `maxConcurrentSessions`：同时活跃的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口，单位为 ms。
- `stream.maxChunkChars`：拆分流式块投影前的最大块大小。
- `stream.repeatSuppression`：按回合抑制重复的 Status/工具行（默认值：`true`）。
- `stream.deliveryMode`：`"live"` 会增量流式传输；`"final_only"` 会缓冲到回合终止事件。
- `stream.hiddenBoundarySeparator`：隐藏工具事件之后、可见文本之前的分隔符（默认值：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 回合投影的助手输出最大字符数。
- `stream.maxSessionUpdateChars`：投影的 ACP Status/更新行最大字符数。
- `stream.tagVisibility`：将标签名称映射到流式事件布尔可见性覆盖值的记录。
- `runtime.ttlMinutes`：ACP 会话 worker 在可被清理前的空闲 TTL，单位为分钟。
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
  - `"random"`（默认值）：轮换显示有趣/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍显示横幅标题/版本）。
- 要隐藏整个横幅（而不只是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

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

当前构建不再包含 TCP Bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键不再是配置架构的一部分（验证会失败，直到移除；`openclaw doctor --fix` 可以剥离未知键）。

<Accordion title="旧版 Bridge 配置（历史参考）">

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

- `sessionRetention`：在从 `sessions.json` 中清理前，已完成的隔离 cron 运行会话保留多久。也控制已归档删除 cron 转录的清理。默认值：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在清理前的最大大小。默认值：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志清理时保留的最新行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；如果省略，则不发送认证标头。
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

- `maxAttempts`：一次性任务遇到瞬态错误时的最大重试次数（默认值：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组，单位为 ms（默认值：`[30000, 60000, 300000]`；1–10 项）。
- `retryOn`：触发重试的错误类型 — `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略时会重试所有瞬态类型。

仅适用于一次性 cron 任务。周期性任务使用单独的失败处理。

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

- `enabled`：启用 cron 任务失败警报（默认值：`false`）。
- `after`：触发警报前的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一任务的重复警报之间的最小毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入警报阈值（默认值：`false`）。跳过的运行会单独跟踪，不会影响执行错误退避。
- `mode`：投递模式 — `"announce"` 通过渠道消息发送；`"webhook"` 发布到已配置的 webhook。
- `accountId`：用于限定警报投递范围的可选账号或渠道 id。

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

- 所有作业的 cron 失败通知的默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够的目标数据时，默认为 `"announce"`。
- `channel`：用于 announce 投递的渠道覆盖项。`"last"` 会复用最后一次已知的投递渠道。
- `to`：显式的 announce 目标或 webhook URL。webhook 模式必填。
- `accountId`：用于投递的可选账号覆盖项。
- 单个作业的 `delivery.failureDestination` 会覆盖这个全局默认值。
- 当既没有设置全局失败目标，也没有设置单个作业失败目标时，已经通过 `announce` 投递的作业在失败时会回退到该主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 作业，除非该作业的主 `delivery.mode` 是 `"webhook"`。

参见 [Cron 作业](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                      |
| ------------------ | ----------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                        |
| `{{RawBody}}`      | 原始正文（无历史记录/发送者包装）         |
| `{{BodyStripped}}` | 已移除群组提及的正文                      |
| `{{From}}`         | 发送者标识符                              |
| `{{To}}`           | 目标标识符                                |
| `{{MessageSid}}`   | 渠道消息 ID                               |
| `{{SessionId}}`    | 当前会话 UUID                             |
| `{{IsNewSession}}` | 创建新会话时为 `"true"`                   |
| `{{MediaUrl}}`     | 入站媒体伪 URL                            |
| `{{MediaPath}}`    | 本地媒体路径                              |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…）        |
| `{{Transcript}}`   | 音频转录文本                              |
| `{{Prompt}}`       | CLI 条目的已解析媒体提示词                |
| `{{MaxChars}}`     | CLI 条目的已解析最大输出字符数            |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                   |
| `{{GroupSubject}}` | 群组主题（尽力获取）                      |
| `{{GroupMembers}}` | 群组成员预览（尽力获取）                  |
| `{{SenderName}}`   | 发送者显示名称（尽力获取）                |
| `{{SenderE164}}`   | 发送者电话号码（尽力获取）                |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等） |

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

- 单个文件：替换包含它的对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在 includes 之后合并（覆盖已包含的值）。
- 嵌套 includes：最多深入 10 层。
- 路径：相对于执行包含的文件解析，但必须保留在顶层配置目录（`openclaw.json` 的 `dirname`）内。绝对路径/`../` 形式只有在仍解析到该边界内时才允许。
- 由 OpenClaw 拥有的写入，如果只更改单个顶层分区且该分区由单文件 include 支持，则会透传写入该包含文件。例如，`plugins install` 会在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，并保持 `openclaw.json` 不变。
- 根 includes、include 数组以及带有同级覆盖项的 includes 对于 OpenClaw 拥有的写入是只读的；这些写入会失败关闭，而不是扁平化配置。
- 错误：针对缺失文件、解析错误和循环 includes 提供清晰消息。

---

_相关：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

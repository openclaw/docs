---
read_when:
    - 你需要精确的字段级配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关配置参考，涵盖核心 OpenClaw 键、默认值，并链接到专用子系统参考
title: 配置参考
x-i18n:
    generated_at: "2026-06-30T22:06:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

OpenClaw 核心配置参考，适用于 `~/.openclaw/openclaw.json`。如需面向任务的概览，请参阅[配置](/zh-CN/gateway/configuration)。

涵盖主要 OpenClaw 配置表面；当某个子系统有自己的更深入参考时，会链接到对应页面。频道和插件拥有的命令目录，以及深层记忆/QMD 开关，位于各自页面，而不是此页面。

代码事实来源：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema；可用时会合并内置/插件/频道元数据
- `config.schema.lookup` 返回一个按路径限定的 schema 节点，用于下钻工具
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面验证配置文档基线哈希

Agent 查找路径：编辑前，使用 `gateway` 工具动作 `config.schema.lookup` 获取精确的字段级文档和约束。使用[配置](/zh-CN/gateway/configuration)获取面向任务的指导；使用本页了解更广泛的字段地图、默认值以及子系统参考链接。

专用深层参考：

- [记忆配置参考](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [斜杠命令](/zh-CN/tools/slash-commands)，适用于当前内置 + 内置打包命令目录
- 拥有频道特定命令表面的频道/插件页面

配置格式为 **JSON5**（允许注释 + 尾随逗号）。所有字段都是可选的 - 省略时 OpenClaw 会使用安全默认值。

---

## 频道

按频道配置键已移至专用页面 - 请参阅
[配置 - 频道](/zh-CN/gateway/config-channels)，了解 `channels.*`，
包括 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 以及其他
内置频道（认证、访问控制、多账号、提及门控）。

## Agent 默认值、多 Agent、会话和消息

已移至专用页面 - 请参阅
[配置 - 智能体](/zh-CN/gateway/config-agents)，了解：

- `agents.defaults.*`（工作区、模型、thinking、Heartbeat、记忆、媒体、Skills、沙箱）
- `multiAgent.*`（多 Agent 路由和绑定）
- `session.*`（会话生命周期、压缩、修剪）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 实时咨询背后完整 OpenClaw agent 运行的 thinking level 覆盖
  - `talk.consultFastMode`：Control UI Talk 实时咨询的一次性 fast-mode 覆盖
  - `talk.speechLocale`：iOS/macOS 上 Talk 语音识别的可选 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录稿前保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）
  - `talk.realtime.consultRouting`：针对跳过 `openclaw_agent_consult` 的已最终确定实时 Talk 转录稿的 Gateway 网关中继回退

## 工具和自定义提供商

工具策略、实验性开关、提供商支持的工具配置，以及自定义
提供商 / base-URL 设置已移至专用页面 - 请参阅
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## Models

提供商定义、模型 allowlist 和自定义提供商设置位于
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根节点还拥有全局模型目录行为。

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：按 provider id 建立键的自定义提供商映射。
- `models.providers.*.localService`：本地模型服务器的可选按需进程管理器。OpenClaw 会探测已配置的健康端点，在需要时启动绝对路径 `command`，等待就绪，然后发送模型请求。参阅[本地模型服务](/zh-CN/gateway/local-model-services)。
- `models.pricing.enabled`：控制后台 pricing 引导流程；该流程会在 sidecar 和频道到达 Gateway 网关 ready 路径后启动。当为 `false` 时，Gateway 网关会跳过 OpenRouter 和 LiteLLM pricing-catalog 获取；已配置的 `models.providers.*.models[].cost` 值仍可用于本地成本估算。

## MCP

OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，并由嵌入式 OpenClaw 和其他运行时适配器消费。`openclaw mcp list`、`show`、`set` 和 `unset` 命令会管理此块，并且在配置编辑期间不会连接到目标服务器。

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`：命名的 stdio 或远程 MCP 服务器定义，供暴露已配置 MCP 工具的运行时使用。
  远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI 原生别名，`openclaw mcp set` 和
  `openclaw doctor --fix` 会将其规范化为标准 `transport` 字段。
- `mcp.servers.<name>.enabled`：设置为 `false` 可保留已保存的服务器定义，同时将其排除在嵌入式 OpenClaw MCP 设备发现和工具投影之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：按服务器设置的 MCP 请求超时，单位为秒或毫秒。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：按服务器设置的连接超时，单位为秒或毫秒。
- `mcp.servers.<name>.supportsParallelToolCalls`：给可选择是否发起并行 MCP 工具调用的适配器使用的可选并发提示。
- `mcp.servers.<name>.auth`：对于需要 OAuth 的 HTTP MCP 服务器，设置为 `"oauth"`。运行 `openclaw mcp login <name>` 将令牌存储到 OpenClaw 状态下。
- `mcp.servers.<name>.oauth`：可选的 OAuth scope、redirect URL 和 client metadata URL 覆盖。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：用于私有端点和双向 TLS 的 HTTP TLS 控制。
- `mcp.servers.<name>.toolFilter`：可选的按服务器工具选择。`include` 会将发现的 MCP 工具限制为匹配名称；`exclude` 会隐藏匹配名称。条目可以是精确 MCP 工具名称，也可以是简单 `*` glob。带有资源或提示词的服务器还会生成实用工具名称（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`），这些名称使用相同过滤器。
- `mcp.servers.<name>.codex`：可选的 Codex app-server 投影控制。
  此块只是用于 Codex app-server 线程的 OpenClaw 元数据；它不会影响 ACP 会话、通用 Codex harness 配置或其他运行时适配器。
  非空 `codex.agents` 会将服务器限制到列出的 OpenClaw agent id。
  空的、空白的或无效的限定 agent 列表会被配置验证拒绝，并且会被运行时投影路径省略，而不是变成全局列表。
  `codex.defaultToolsApprovalMode` 会为该服务器发出 Codex 原生
  `default_tools_approval_mode`。OpenClaw 会在将原生 `mcp_servers` 配置传递给 Codex 之前移除 `codex`
  块。省略该块可让服务器投影到每个 Codex app-server agent，并使用 Codex 默认 MCP 审批行为。
- `mcp.sessionIdleTtlMs`：会话作用域内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求 run-end 清理；此 TTL 是长生命周期会话和未来调用方的兜底。
- `mcp.*` 下的变更会通过处置缓存的会话 MCP 运行时来热应用。
  下一次工具发现/使用会根据新配置重新创建它们，因此移除的 `mcp.servers` 条目会立即回收，而不是等待空闲 TTL。
- 运行时设备发现还会通过丢弃该会话的缓存目录来遵守 MCP 工具列表变更通知。声明资源或提示词的服务器会获得用于列出/读取资源以及列出/获取提示词的实用工具。重复的工具调用失败会短暂暂停受影响服务器，然后再尝试另一次调用。

参阅 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和
[CLI 后端](/zh-CN/gateway/cli-backends#bundle-mcp-overlays)了解运行时行为。

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`：仅适用于内置 Skills 的可选 allowlist（不影响托管/工作区 Skills）。
- `load.extraDirs`：额外的共享 Skills 根目录（最低优先级）。
- `load.allowSymlinkTargets`：受信任的真实目标根目录；当 skill symlink 位于其配置源根目录之外时，可解析到这些根目录。
- `workshop.allowSymlinkTargetWrites`：允许 Skill Workshop apply 通过已受信任的 symlink 目标写入（默认值：false）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install`
  规格的 node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允许受信任的 `operator.admin` Gateway 网关客户端安装通过 `skills.upload.*` 暂存的私有 zip 归档（默认值：false）。这只会启用 uploaded-archive 路径；正常的 ClawHub 安装不需要它。
- `entries.<skillKey>.enabled: false` 会禁用某个 skill，即使它已内置/已安装。
- `entries.<skillKey>.apiKey`：为声明主环境变量的 Skills 提供便利方式（明文字符串或 SecretRef 对象）。

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

- 从 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的包或 bundle 目录加载，也会加载 `plugins.load.paths` 中列出的文件或目录。
- 将独立插件文件放入 `plugins.load.paths`；自动发现的扩展根目录会忽略顶层 `.js`、`.mjs` 和 `.ts` 文件，因此这些根目录中的辅助脚本不会阻塞启动。
- 设备发现接受原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括没有清单的 Claude 默认布局 bundle。
- **配置变更需要重启 Gateway 网关。**
- `allow`：可选允许列表（只加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便利字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会改变提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子和受支持的 bundle 提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非内置插件可以从类型化钩子读取原始对话内容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件为后台子智能体运行请求按运行配置的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖的规范 `provider/model` 目标可选允许列表。仅当你有意允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：显式信任此插件为 `api.runtime.llm.complete` 请求模型覆盖。
- `plugins.entries.<id>.llm.allowedModels`：受信任插件 LLM completion 覆盖的规范 `provider/model` 目标可选允许列表。仅当你有意允许任意模型时才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：显式信任此插件针对非默认 Agent id 运行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：插件定义的配置对象（当可用时由原生 OpenClaw 插件 schema 验证）。
- 频道插件账户/运行时设置位于 `channels.<id>` 下，并应由所属插件清单的 `channelConfigs` 元数据描述，而不是由中央 OpenClaw 选项注册表描述。

### Codex harness 插件配置

内置 `codex` 插件在
`plugins.entries.codex.config` 下拥有原生 Codex app-server harness 设置。完整配置
表面请参见 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)，运行时模型
请参见 [Codex harness](/zh-CN/plugins/codex-harness)。

`codexPlugins` 仅适用于选择原生 Codex harness 的会话。
它不会为 OpenClaw 提供商运行、ACP
对话绑定或任何非 Codex harness 启用 Codex 插件。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`：为 Codex harness 启用原生 Codex
  插件/app 支持。默认值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已迁移插件 app elicitations 的默认破坏性操作策略。
  使用 `true` 接受安全的 Codex approval schemas 且不提示，使用 `false`
  拒绝它们，使用 `"auto"` 将 Codex 要求的审批路由到 OpenClaw
  插件审批，或使用 `"always"` 对每个插件写入/破坏性
  操作都发起询问且不使用持久审批。`"always"` 模式会在线程启动前，为受影响 app
  清除持久 Codex
  按工具审批覆盖。
  默认值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：当全局 `codexPlugins.enabled` 也为 true 时，启用一个
  已迁移插件条目。
  默认值：显式条目为 `true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  稳定的 marketplace 身份。V1 仅支持 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：来自迁移的稳定
  Codex 插件身份，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  按插件配置的破坏性操作覆盖。省略时，使用全局
  `allow_destructive_actions` 值。按插件配置的值接受相同的
  `true`、`false`、`"auto"` 或 `"always"` 策略。

`codexPlugins.enabled` 是全局启用指令。迁移写入的显式插件
条目是持久安装和修复资格集合。
不支持 `plugins["*"]`，没有 `install` 开关，本地
`marketplacePath` 值有意不作为配置字段，因为它们是
特定于主机的。

`app/list` 就绪检查会缓存一小时，并在过期时
异步刷新。Codex 线程 app 配置是在 Codex harness
会话建立时计算的，而不是每个轮次都计算；更改原生插件配置后，请使用 `/new`、`/reset` 或重启 Gateway 网关。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：用于更高限额的可选 Firecrawl API key（接受 SecretRef）。回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认值：`https://api.firecrawl.dev`；自托管覆盖必须指向私有/内部端点）。
  - `onlyMainContent`：仅从页面提取主要内容（默认值：`true`）。
  - `maxAgeMs`：最大缓存时间，单位为毫秒（默认值：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时，单位为秒（默认值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok Web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：记忆 dreaming 设置。阶段和阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：dreaming 总开关（默认值 `false`）。
  - `frequency`：每次完整 dreaming 扫描的 cron 频率（默认 `"0 3 * * *"`）。
  - `model`：可选的 Dream Diary 子智能体模型覆盖。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；与 `allowedModels` 搭配以限制目标。模型不可用错误会使用会话默认模型重试一次；信任或允许列表失败不会静默回退。
  - 阶段策略和阈值是实现细节（不是面向用户的配置键）。
- 完整记忆配置位于 [Memory configuration reference](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 启用的 Claude bundle 插件也可以从 `settings.json` 贡献嵌入式 OpenClaw 默认值；OpenClaw 会将它们作为经过清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活跃的记忆插件 id，或选择 `"none"` 以禁用记忆插件。
- `plugins.slots.contextEngine`：选择活跃的上下文引擎插件 id；除非你安装并选择了其他引擎，否则默认值为 `"legacy"`。

请参见 [插件](/zh-CN/tools/plugin)。

---

## 跟进承诺

`commitments` 控制推断式跟进承诺记忆：OpenClaw 可以从对话轮次中检测 check-in，并通过 heartbeat 运行交付它们。

- `commitments.enabled`：为推断式跟进承诺启用隐藏 LLM 提取、存储和 heartbeat 交付。默认值：`false`。
- `commitments.maxPerDay`：滚动一天内每个 Agent 会话交付的推断式跟进承诺最大数量。默认值：`3`。

请参见 [推断式跟进承诺](/zh-CN/concepts/commitments)。

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
- `tabCleanup` 会在空闲时间后或会话超过上限时回收已跟踪的 primary-agent 标签页。设置 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可禁用这些单独的清理模式。
- 未设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork` 时会禁用它，因此浏览器导航默认保持严格。
- 仅当你有意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间会受到相同的私有网络阻断限制。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 来配置显式例外。
- 远程配置文件仅可附加（禁用 start/stop/reset）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)；当你的提供商给你直接的 DevTools WebSocket URL 时使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程和 `attachOnly` CDP 可达性以及标签页打开请求。托管的 local loopback 配置文件保留本地 CDP 默认值。
- 如果外部托管的 CDP 服务可通过 loopback 访问，请将该配置文件的 `attachOnly: true`；否则 OpenClaw 会将 loopback 端口视为本地托管浏览器配置文件，并可能报告本地端口所有权错误。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以在所选主机上附加，也可以通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以指向特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- 当 Chrome 已在 DevTools HTTP(S) 发现端点或直接 WS(S) 端点后运行时，`existing-session` 配置文件可以设置 `cdpUrl`。在该模式下，OpenClaw 会将端点传递给 Chrome MCP，而不是使用自动连接；`userDataDir` 会被 Chrome MCP 启动参数忽略。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：使用快照/引用驱动操作而非 CSS selector 定位、单文件上传钩子、无对话框超时覆盖、无 `wait --load networkidle`，并且没有 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅对远程 CDP 配置文件或 existing-session 端点附加显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局 `browser.executablePath`。可用它让一个配置文件运行在 Chrome 中，另一个运行在 Brave 中。
- 本地托管配置文件在进程启动后使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP 发现，并使用 `browser.localCdpReadyTimeoutMs` 进行启动后的 CDP websocket 就绪检查。在 Chrome 能成功启动但就绪检查与启动过程竞争的较慢主机上调高它们。两个值都必须是最大为 `120000` ms 的正整数；无效配置值会被拒绝。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 在 Chromium 启动前都接受 `~` 和 `~/...` 表示你的操作系统主目录。
  `existing-session` 配置文件上的按配置文件 `userDataDir` 也会展开波浪号。
- 控制服务：仅 loopback（端口派生自 `gateway.port`，默认 `18791`）。
- `extraArgs` 会将额外启动标志追加到本地 Chromium 启动（例如 `--disable-gpu`、窗口大小或调试标志）。

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

- `seamColor`：原生应用 UI chrome 的强调色（Talk 模式气泡色调等）。
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
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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
- `port`: WS + HTTP 的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`: `auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版绑定别名**：在 `gateway.bind` 中使用绑定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` 绑定会在容器内监听 `127.0.0.1`。使用 Docker 桥接网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关无法访问。使用 `--network host`，或设置 `bind: "lan"`（或使用 `bind: "custom"` 并设置 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认必需。非 loopback 绑定需要 Gateway 网关认证。实际使用中，这意味着共享令牌/密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认生成令牌。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。两者都已配置但未设置模式时，启动和服务安装/修复流程会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于可信的 local loopback 设置；新手引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将浏览器/用户认证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。此模式默认预期代理来源为**非 loopback**；同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。内部同主机调用方可以使用 `gateway.auth.password` 作为本地直连回退；`gateway.auth.token` 仍与 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`: 当为 `true` 时，Tailscale Serve 身份标头可以满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不**使用该 Tailscale 标头认证；它们改为遵循 Gateway 网关的常规 HTTP 认证模式。此无令牌流程假定 Gateway 网关主机可信。当 `tailscale.mode = "serve"` 时默认值为 `true`。
- `gateway.auth.rateLimit`: 可选的认证失败限制器。按客户端 IP 和认证作用域应用（shared-secret 和 device-token 独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，相同 `{scope, clientIp}` 的失败尝试会在写入失败记录前被串行化。因此，来自同一客户端的并发错误尝试可能会在第二个请求时触发限制器，而不是两个请求都以普通不匹配的方式竞争通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认值为 `true`；当你有意也想对 localhost 流量限速时（用于测试设置或严格代理部署），请设置为 `false`。
- 浏览器来源的 WS 认证尝试始终会被节流，并禁用 loopback 豁免（针对基于浏览器的 localhost 暴力破解提供纵深防御）。
- 在 loopback 上，这些浏览器来源锁定会按规范化后的 `Origin`
  值隔离，因此来自某个 localhost 来源的重复失败不会自动
  锁定另一个来源。
- `tailscale.mode`: `serve`（仅 tailnet，loopback 绑定）或 `funnel`（公开，需要认证）。
- `tailscale.serviceName`: Serve 模式的可选 Tailscale Service 名称，例如
  `svc:openclaw`。设置后，OpenClaw 会将其传递给 `tailscale serve
--service`，这样 Control UI 可以通过命名 Service 暴露，而不是通过
  设备主机名暴露。该值必须使用 Tailscale 的 `svc:<dns-label>`
  Service 名称格式；启动时会报告派生的 Service URL。
- `tailscale.preserveFunnel`: 当为 `true` 且 `tailscale.mode = "serve"` 时，OpenClaw
  会在启动时重新应用 Serve 之前检查 `tailscale funnel status`，如果外部配置的 Funnel 路由已覆盖 Gateway 网关端口，则跳过
  应用。默认值为 `false`。
- `controlUi.allowedOrigins`: Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。公开的非 loopback 浏览器来源需要此项。从 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主机加载的私有同源 LAN/Tailnet UI，无需启用 Host 标头回退即可接受。
- `controlUi.chatMessageMaxWidth`: 分组 Control UI 聊天消息的可选最大宽度。接受受约束的 CSS 宽度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: 危险模式，用于为有意依赖 Host 标头来源策略的部署启用 Host 标头来源回退。
- `remote.transport`: `ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，公共主机的 `remote.url` 必须为 `wss://`；明文 `ws://` 仅对 loopback、LAN、link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主机接受。
- `remote.remotePort`: 远程 SSH 主机上的 Gateway 网关端口。默认值为 `18789`；当本地隧道端口不同于远程 Gateway 网关端口时使用此项。
- `gateway.remote.token` / `.password` 是远程客户端凭据字段。它们本身不会配置 Gateway 网关认证。
- `gateway.push.apns.relay.baseUrl`: 外部 APNs 中继的 HTTPS 基础 URL，用于基于中继的 iOS 构建将注册发布到 Gateway 网关之后。公开的 App Store/TestFlight 构建使用托管的 OpenClaw 中继。自定义中继 URL 必须匹配刻意分离的 iOS 构建/部署路径，且该路径的中继 URL 指向该中继。
- `gateway.push.apns.relay.timeoutMs`: Gateway 网关到中继的发送超时时间（毫秒）。默认值为 `10000`。
- 基于中继的注册会委托给特定 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在中继注册中包含该身份，并将注册作用域的发送授权转发给 Gateway 网关。另一个 Gateway 网关无法复用该已存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: 上述中继配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: 仅开发用的逃生口，用于 loopback HTTP 中继 URL。生产中继 URL 应保持使用 HTTPS。
- `gateway.handshakeTimeoutMs`: 认证前 Gateway 网关 WebSocket 握手超时时间（毫秒）。默认值：`15000`。设置后，`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 优先。当负载较高或低性能主机上的本地客户端可连接，但启动预热仍在稳定时，请增大此值。
- `gateway.channelHealthCheckMinutes`: 频道健康监视器间隔（分钟）。设置为 `0` 可全局禁用健康监视器重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`: 过期套接字阈值（分钟）。保持此值大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`: 每个渠道/账号在滚动一小时内的最大健康监视器重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`: 单渠道的健康监视器重启退出选项，同时保持全局监视器启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: 多账号渠道的单账号覆盖。设置后，它优先于渠道级覆盖。
- 仅当未设置 `gateway.auth.*` 时，本地 Gateway 网关调用路径才能使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且未解析，解析会失败关闭（不会被远程回退掩盖）。
- `trustedProxies`: 终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。Loopback 条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**让 loopback 请求具备使用 `gateway.auth.mode: "trusted-proxy"` 的资格。
- `allowRealIpFallback`: 当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`: 可选的 CIDR/IP 允许列表，用于自动批准首次节点设备配对且没有请求作用域的情况。未设置时禁用。它不会自动批准操作员/浏览器/Control UI/WebChat 配对，也不会自动批准角色、作用域、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: 配对和平台允许列表评估之后，对声明的节点命令进行全局允许/拒绝塑形。使用 `allowCommands` 选择启用危险节点命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台默认值或显式允许本会包含某个命令，`denyCommands` 也会移除该命令。节点更改其声明的命令列表后，请拒绝并重新批准该设备配对，以便 Gateway 网关存储更新后的命令快照。
- `gateway.tools.deny`: 为 HTTP `POST /tools/invoke` 阻止的额外工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`: 从默认 HTTP 拒绝列表中移除工具名称，适用于
  owner/admin 调用方。这不会将带有身份的 `operator.write`
  调用方升级为 owner/admin 访问；即使加入允许列表，`cron`、`gateway` 和 `nodes` 对非 owner 调用方仍然
  不可用。

</Accordion>

### OpenAI 兼容端点

- Admin HTTP RPC：默认作为 `admin-http-rpc` 插件关闭。启用该插件以注册 `POST /api/v1/admin/rpc`。参见 [Admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)。
- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表会被视为未设置；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 获取。
- 可选响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅为你控制的 HTTPS 来源设置；参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

使用唯一端口和状态目录在一台主机上运行多个 Gateway 网关：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

参见 [Multiple Gateways](/zh-CN/gateway/multiple-gateways)。

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
- `autoGenerate`: 当未配置显式文件时，自动生成本地自签名证书/密钥对；仅用于本地/开发。
- `certPath`: TLS 证书文件的文件系统路径。
- `keyPath`: TLS 私钥文件的文件系统路径；请保持权限受限。
- `caPath`: 用于客户端验证或自定义信任链的可选 CA 捆绑包路径。

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

- `mode`：控制运行时如何应用配置编辑。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置更改时始终重启 Gateway 网关进程。
  - `"hot"`：在进程内应用更改，无需重启。
  - `"hybrid"`（默认）：先尝试热重载；如有需要则回退到重启。
- `debounceMs`：应用配置更改前的防抖窗口，单位为 ms（非负整数）。
- `deferralTimeoutMs`：可选的最长等待时间，单位为 ms，用于在强制重启或频道热重载之前等待进行中的操作。省略时使用默认的有界等待（`300000`）；设置为 `0` 表示无限期等待，并定期记录仍在等待的警告。

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

验证和安全说明：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 应与活动的 Gateway 网关共享密钥凭证（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；启动时如果检测到复用，会记录非致命安全警告。
- `openclaw security audit` 会将钩子/Gateway 网关凭证复用标记为严重发现，包括仅在审计时提供的 Gateway 网关密码凭证（`--auth password --password <password>`）。运行 `openclaw doctor --fix` 轮换已持久化且被复用的 `hooks.token`，然后更新外部钩子发送方以使用新的钩子令牌。
- `hooks.path` 不能是 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要此显式启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 只有当 `hooks.allowRequestSessionKey=true`（默认值：`false`）时，才接受请求载荷中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染的映射 `sessionKey` 值会被视为外部提供，也需要 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- `{{messages[0].subject}}` 这类模板会从载荷中读取。
- `transform` 可以指向一个返回钩子动作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且保持在 `hooks.transformsDir` 内（绝对路径和路径穿越会被拒绝）。
  - 将 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作区 skill 目录会被拒绝。如果 `openclaw doctor` 报告此路径无效，请将转换模块移入钩子转换目录，或移除 `hooks.transformsDir`。
- `agentId` 路由到特定智能体；未知 ID 会回退到默认智能体。
- `allowedAgentIds`：限制生效的智能体路由，包括省略 `agentId` 时的默认智能体路径（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于没有显式 `sessionKey` 的钩子智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任何映射或预设使用模板化 `sessionKey` 时，它会变为必需。
- `deliver: true` 会将最终回复发送到频道；`channel` 默认为 `last`。
- `model` 会为本次钩子运行覆盖 LLM（如果设置了模型目录，则必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留这种按消息路由，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请使用静态 `sessionKey` 覆盖该预设，而不是使用模板化默认值。

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
- 不要在 Gateway 网关旁边单独运行一个 `gog gmail watch serve`。

---

## Canvas 插件主机

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- 在 Gateway 网关端口下通过 HTTP 提供智能体可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback 绑定：Canvas 路由需要 Gateway 网关凭证（令牌/密码/可信代理），与其他 Gateway 网关 HTTP 表面相同。
- Node WebViews 通常不会发送凭证标头；节点完成配对并连接后，Gateway 网关会公布节点作用域的能力 URL，用于访问 Canvas/A2UI。
- 能力 URL 绑定到活动节点 WS 会话，并且会很快过期。不使用基于 IP 的回退。
- 向提供的 HTML 注入实时重载客户端。
- 为空时自动创建起始 `index.html`。
- 也在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
- 对大型目录或 `EMFILE` 错误禁用实时重载。

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

- `minimal`（启用内置 `bonjour` 插件时的默认值）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播广播仍要求启用内置 `bonjour` 插件。
- `off`：在不更改插件启用状态的情况下抑制 LAN 多播广播。
- 内置 `bonjour` 插件会在 macOS 主机上自动启动，在 Linux、Windows 和容器化 Gateway 网关部署中需要显式启用。
- 主机名默认使用系统主机名（当它是有效 DNS 标签时），否则回退到 `openclaw`。可用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域 (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络设备发现，请配合 DNS 服务器（推荐 CoreDNS）+ Tailscale split DNS 使用。

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
- `.env` 文件：CWD `.env` + `~/.openclaw/.env`（两者都不会覆盖已有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 完整优先级请参阅[环境](/zh-CN/help/environment)。

### 环境变量替换

使用 `${VAR_NAME}` 在任意配置字符串中引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失或为空的变量会在配置加载时抛出错误。
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

验证：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：绝对 JSON pointer（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 AWS 风格的 `secret#json_key` 选择器）
- `source: "exec"` id 不得包含 `.` 或 `..` 作为以斜杠分隔的路径段（例如 `a/../b` 会被拒绝）

### 支持的凭证表面

- 规范矩阵：[SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 面向受支持的 `openclaw.json` 凭证路径。
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

说明：

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式中，`id` 必须是 `"value"`）。
- 当 Windows ACL 验证不可用时，文件和 exec 提供商路径会按关闭策略失败。仅对无法验证但可信的路径设置 `allowInsecurePath: true`。
- `exec` 提供商需要绝对 `command` 路径，并在 stdin/stdout 上使用协议载荷。
- 默认情况下，会拒绝符号链接命令路径。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时验证解析后的目标路径。
- 如果配置了 `trustedDirs`，可信目录检查会应用于解析后的目标路径。
- 默认情况下，`exec` 子进程环境是最小化的；请用 `passEnv` 显式传入所需变量。
- 密钥引用会在激活时解析为内存中的快照，之后请求路径只读取该快照。
- 激活期间会应用启用表面过滤：启用表面上的未解析引用会导致启动/重载失败，而未启用表面会被跳过并带有诊断信息。

---

## 凭证存储

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- 按智能体配置档案存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持静态凭据模式的值级引用（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 旧版扁平 `auth-profiles.json` 映射（例如 `{ "provider": { "apiKey": "..." } }`）不是运行时格式；`openclaw doctor --fix` 会将它们重写为规范的 `provider:default` API-key 配置档案，并创建 `.legacy-flat.*.bak` 备份。
- OAuth 模式配置档案（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭据。
- 静态运行时凭据来自内存中已解析的快照；发现旧版静态 `auth.json` 条目时会将其清理。
- 旧版 OAuth 从 `~/.openclaw/credentials/oauth.json` 导入。
- 参见 [OAuth](/zh-CN/concepts/oauth)。
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

- `billingBackoffHours`：当配置档案因真实的账单/余额不足错误失败时，以小时为单位的基础退避时间（默认：`5`）。即使响应为 `401`/`403`，明确的账单文本仍可能进入这里，但特定于提供商的文本匹配器仍限定在拥有它们的提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或组织/工作区支出上限消息会改走 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的按提供商覆盖账单退避小时数。
- `billingMaxHours`：账单退避指数增长的小时上限（默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避分钟数（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口小时数（默认：`24`）。
- `overloadedProfileRotations`：在切换到模型回退之前，过载错误允许的同一提供商 auth-profile 最大轮换次数（默认：`1`）。`ModelNotReadyException` 等提供商繁忙形态会进入这里。
- `overloadedBackoffMs`：重试过载提供商/配置档案轮换前的固定延迟（默认：`0`）。
- `rateLimitedProfileRotations`：在切换到模型回退之前，限流错误允许的同一提供商 auth-profile 最大轮换次数（默认：`1`）。该限流桶包括提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- `maxFileBytes`：轮转前活动日志文件的最大字节大小（正整数；默认：`104857600` = 100 MB）。OpenClaw 会在活动文件旁最多保留五个带编号的归档文件。
- `redactSensitive` / `redactPatterns`：对控制台输出、文件日志、OTLP 日志记录和持久化会话转录文本进行尽力而为的遮蔽。`redactSensitive: "off"` 只会禁用这一通用日志/转录策略；UI/工具/诊断安全表面在发出前仍会遮蔽密钥。

---

## 诊断

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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

- `enabled`：检测输出的总开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 等通配符）。
- `stuckSessionWarnMs`：用于将长时间运行的处理会话分类为 `session.long_running`、`session.stalled` 或 `session.stuck` 的无进展时长阈值（毫秒）。回复、工具、状态、分块和 ACP 进度会重置计时器；重复的 `session.stuck` 诊断在未变化时会退避。
- `stuckSessionAbortMs`：符合条件的停滞活动工作可为恢复而 abort-drain 之前的无进展时长阈值（毫秒）。未设置时，OpenClaw 使用更安全的扩展嵌入式运行窗口，至少为 5 分钟且为 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：当内存压力达到 `critical` 时捕获经遮蔽的 OOM 前稳定性快照（默认：`false`）。设为 `true` 可在保留正常内存压力事件的同时，添加稳定性包文件扫描/写入。
- `otel.enabled`：启用 OpenTelemetry 导出管道（默认：`false`）。完整配置、信号目录和隐私模型见 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：用于 OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的特定信号 OTLP 端点。设置后，它们仅覆盖该信号的 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.logsExporter`：日志导出接收端：`"otlp"`（默认）、`"stdout"`（每个 stdout 行一个 JSON 对象）或 `"both"`。
- `otel.sampleRate`：trace 采样率 `0`-`1`。
- `otel.flushIntervalMs`：周期性 telemetry 刷新间隔（毫秒）。
- `otel.captureContent`：选择性启用 OTEL span 属性的原始内容捕获。默认关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式允许你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用于最新实验性 GenAI 推理 span 形态的环境变量开关，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名称、`CLIENT` span kind，以及用 `gen_ai.provider.name` 替代旧版 `gen_ai.system`。默认情况下，为兼容性，span 保留 `openclaw.model.call` 和 `gen_ai.system`；GenAI metrics 使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：用于已注册全局 OpenTelemetry SDK 的主机的环境变量开关。随后 OpenClaw 会跳过插件拥有的 SDK 启动/关闭，同时保持诊断监听器处于活动状态。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：在匹配的配置键未设置时使用的特定信号端点环境变量。
- `cacheTrace.enabled`：记录嵌入式运行的缓存 trace 快照（默认：`false`）。
- `cacheTrace.filePath`：缓存 trace JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
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

- `channel`：npm/git 安装的发布渠道 - `"stable"`、`"beta"` 或 `"dev"`。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：stable 渠道自动应用前的最小延迟小时数（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：stable 渠道发布扩散的额外窗口小时数（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行频率（小时）（默认：`1`；最大：`24`）。

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
- `backend`：默认 ACP 运行时后端 id（必须匹配已注册的 ACP 运行时插件）。
  请先安装后端插件；如果设置了 `plugins.allow`，请包含后端插件 id（例如 `acpx`），否则 ACP 后端不会加载。
- `defaultAgent`：当生成未指定显式目标时使用的后备 ACP 目标智能体 id。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 id allowlist；为空表示无额外限制。
- `maxConcurrentSessions`：最大并发活动 ACP 会话数。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口（毫秒）。
- `stream.maxChunkChars`：拆分流式分块投影前的最大分块大小。
- `stream.repeatSuppression`：按轮次抑制重复的状态/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 增量流式传输；`"final_only"` 缓冲到轮次终止事件。
- `stream.hiddenBoundarySeparator`：隐藏工具事件后、可见文本前的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的最大助手输出字符数。
- `stream.maxSessionUpdateChars`：投影 ACP 状态/更新行的最大字符数。
- `stream.tagVisibility`：标签名称到流式事件布尔可见性覆盖项的记录。
- `runtime.ttlMinutes`：ACP 会话 worker 符合清理条件前的空闲 TTL 分钟数。
- `runtime.installCommand`：引导 ACP 运行时环境时要运行的可选安装命令。

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
  - `"random"`（默认）：轮换的趣味/季节性标语。
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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## 身份

请参阅 [Agent 默认值](/zh-CN/gateway/config-agents#agent-defaults) 下的 `agents.list` 身份字段。

---

## Bridge（旧版，已移除）

当前构建不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键不再属于配置 schema（在移除前验证会失败；`openclaw doctor --fix` 可以移除未知键）。

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
    maxConcurrentRuns: 8, // 默认；cron 分发 + 隔离的 cron agent-turn 执行
    webhook: "https://example.invalid/legacy", // 已弃用；用于已存储 notify:true 作业的回退
    webhookToken: "replace-with-dedicated-token", // 用于出站 webhook 认证的可选 bearer token
    sessionRetention: "24h", // duration 字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

- `sessionRetention`：从 `sessions.json` 清理之前，保留已完成的隔离 cron 运行会话的时长。也控制已归档删除 cron 转录内容的清理。默认值：`24h`；设置为 `false` 可禁用。
- `runLog.maxBytes`：为兼容旧版基于文件的 cron 运行日志而接受。默认值：`2_000_000` 字节。
- `runLog.keepLines`：每个作业保留的最新 SQLite 运行历史行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；如果省略，则不发送认证标头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），由 `openclaw doctor --fix` 用于迁移仍带有 `notify: true` 的已存储作业；运行时投递使用每个作业的 `delivery.mode="webhook"` 加 `delivery.to`，或在保留 announce 投递时使用 `delivery.completionDestination`。

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

- `maxAttempts`：cron 作业在瞬时错误时的最大重试次数（默认：`3`；范围：`0`-`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组，单位为毫秒（默认：`[30000, 60000, 300000]`；1-10 个条目）。
- `retryOn`：触发重试的错误类型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略时重试所有瞬时类型。

一次性作业会保持启用，直到重试次数耗尽，然后在保留最终错误状态的同时禁用。周期性作业使用相同的瞬时重试策略，在下一次计划时段之前，在退避后再次运行；永久错误或瞬时重试耗尽会回退到带错误退避的正常周期性计划。

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

- `enabled`：为 cron 作业启用失败警报（默认：`false`）。
- `after`：触发警报前的连续失败次数（正整数，最小：`1`）。
- `cooldownMs`：同一作业重复警报之间的最小毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入警报阈值（默认：`false`）。跳过的运行会单独跟踪，并且不影响执行错误退避。
- `mode`：投递模式 - `"announce"` 通过渠道消息发送；`"webhook"` 发布到已配置的 webhook。
- `accountId`：用于限定警报投递范围的可选账号或渠道 ID。

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

- 所有作业的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够目标数据时，默认使用 `"announce"`。
- `channel`：announce 投递的渠道覆盖项。`"last"` 复用最后一个已知投递渠道。
- `to`：显式 announce 目标或 webhook URL。webhook 模式必需。
- `accountId`：用于投递的可选账号覆盖项。
- 每个作业的 `delivery.failureDestination` 会覆盖此全局默认值。
- 当既未设置全局失败目标，也未设置每个作业的失败目标时，已通过 `announce` 投递的作业会在失败时回退到其主要 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的作业，除非该作业的主要 `delivery.mode` 是 `"webhook"`。

请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为 [后台任务](/zh-CN/automation/tasks) 跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                               |
| ------------------ | -------------------------------------------------- |
| `{{Body}}`         | 完整入站消息正文                                   |
| `{{RawBody}}`      | 原始正文（无历史/发送者包装器）                    |
| `{{BodyStripped}}` | 去除群组提及的正文                                 |
| `{{From}}`         | 发送者标识符                                       |
| `{{To}}`           | 目标标识符                                         |
| `{{MessageSid}}`   | 渠道消息 ID                                        |
| `{{SessionId}}`    | 当前会话 UUID                                      |
| `{{IsNewSession}}` | 创建新会话时为 `"true"`                            |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                     |
| `{{MediaPath}}`    | 本地媒体路径                                       |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…）                 |
| `{{Transcript}}`   | 音频转录文本                                       |
| `{{Prompt}}`       | CLI 条目的已解析媒体提示词                         |
| `{{MaxChars}}`     | CLI 条目的已解析最大输出字符数                     |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                            |
| `{{GroupSubject}}` | 群组主题（尽力而为）                               |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）                           |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）                         |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）                         |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等）       |

---

## 配置包含（`$include`）

将配置拆分到多个文件中：

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

- 单个文件：替换所在对象。
- 文件数组：按顺序深度合并（后面的覆盖前面的）。
- 同级键：在 include 后合并（覆盖已包含的值）。
- 嵌套 include：最多 10 层深。
- 路径：相对于包含它的文件解析，但必须保持在顶级配置目录内（`openclaw.json` 的 `dirname`）。仅当绝对路径/`../` 形式仍解析到该边界内时才允许。路径不能包含空字节，并且在解析前后都必须严格短于 4096 个字符。
- 仅更改单个顶级小节且该小节由单文件 include 支持的 OpenClaw 所有写入，会透传写入该包含文件。例如，`plugins install` 会在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，并保持 `openclaw.json` 不变。
- 根 include、include 数组以及带同级覆盖的 include 对 OpenClaw 所有写入是只读的；这些写入会失败关闭，而不是将配置扁平化。
- 错误：对缺失文件、解析错误、循环 include、无效路径格式和长度过长提供清晰消息。

---

_相关：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

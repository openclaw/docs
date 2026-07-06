---
read_when:
    - 你需要精确的字段级配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: Gateway 网关配置参考，涵盖核心 OpenClaw 键、默认值，以及指向专用子系统参考的链接
title: 配置参考
x-i18n:
    generated_at: "2026-07-06T10:48:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e431290ad59b7b350150149ca603b014c5611751c62162913193a7c470ecd190
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的字段级参考：键名、默认值，以及指向更深入子系统页面的链接。面向任务的设置指南见 [配置](/zh-CN/gateway/configuration)。渠道和插件拥有的命令目录，以及深层记忆/QMD 调整项位于各自页面，不在此处。

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段都是可选的；省略时 OpenClaw 会使用安全默认值。

以代码事实为准，优先于本页：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema，并已合并内置/插件/渠道元数据。
- 智能体在编辑配置前，应调用 `gateway` 工具动作 `config.schema.lookup`，获取一个精确路径范围内的 schema 节点。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面验证本文档的基线哈希。

专用深入参考：

- [记忆配置参考](/zh-CN/reference/memory-config)：涵盖 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置。
- [斜杠命令](/zh-CN/tools/slash-commands)：当前内置 + 内置打包命令目录。
- 拥有渠道特定命令表面的渠道/插件页面。

---

## 频道

每个渠道的配置键位于 [配置 - 频道](/zh-CN/gateway/config-channels)：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他内置渠道的 `channels.*`（身份验证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

参见 [配置 - 智能体](/zh-CN/gateway/config-agents)，了解：

- `agents.defaults.*`（工作区、模型、thinking、heartbeat、记忆、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、修剪）
- `messages.*`（消息投递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：Control UI Talk 实时咨询背后的完整 OpenClaw 智能体运行的 thinking 级别覆盖
  - `talk.consultFastMode`：Control UI Talk 实时咨询的一次性快速模式覆盖
  - `talk.speechLocale`：iOS/macOS 上 Talk 语音识别的可选 BCP 47 locale id
  - `talk.silenceTimeoutMs`：未设置时，Talk 在发送转写文本前保留平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）
  - `talk.realtime.consultRouting`：用于已完成的实时 Talk 转写文本的 Gateway 网关中继回退，这些转写文本会跳过 `openclaw_agent_consult`

## 工具和自定义提供商

工具策略、实验性开关、提供商支持的工具配置，以及自定义
提供商 / base-URL 设置位于
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## Models

提供商定义、模型 allowlist 和自定义提供商设置位于
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。
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
- `models.providers`：按提供商 id 作为键的自定义提供商映射。
- `models.providers.*.localService`：本地模型服务器的可选按需进程管理器。OpenClaw 会探测配置的健康端点，在需要时启动绝对路径 `command`，等待就绪，然后发送模型请求。参见 [本地模型服务](/zh-CN/gateway/local-model-services)。
- `models.pricing.enabled`：控制后台 pricing bootstrap，该流程会在 sidecar 和渠道到达 Gateway 网关 ready 路径后启动。当为 `false` 时，Gateway 网关会跳过 OpenRouter 和 LiteLLM 定价目录抓取；已配置的 `models.providers.*.models[].cost` 值仍可用于本地成本估算。

## MCP

OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，并由嵌入式 OpenClaw 和其他运行时适配器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令会管理此配置块，且在配置编辑期间不会连接目标服务器。

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

- `mcp.servers`：为暴露已配置 MCP 工具的运行时提供的具名 stdio 或远程 MCP 服务器定义。
  远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；
  `type: "http"` 是 CLI 原生别名，`openclaw mcp set` 和
  `openclaw doctor --fix` 会将其规范化为标准 `transport` 字段。
- `mcp.servers.<name>.enabled`：设为 `false` 可保留已保存的服务器定义，同时将其排除在嵌入式 OpenClaw MCP 发现和工具投影之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：每台服务器的 MCP 请求超时，单位为秒或毫秒。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：每台服务器的连接超时，单位为秒或毫秒。
- `mcp.servers.<name>.supportsParallelToolCalls`：可选并发提示，供能够选择是否发起并行 MCP 工具调用的适配器使用。
- `mcp.servers.<name>.auth`：对需要 OAuth 的 HTTP MCP 服务器设为 `"oauth"`。运行 `openclaw mcp login <name>`，将 token 存储到 OpenClaw 状态下。
- `mcp.servers.<name>.oauth`：可选 OAuth scope、redirect URL 和 client metadata URL 覆盖。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：用于私有端点和双向 TLS 的 HTTP TLS 控制项。
- `mcp.servers.<name>.toolFilter`：可选的每服务器工具选择。`include`
  将发现到的 MCP 工具限制为匹配名称；`exclude` 隐藏匹配名称。条目可以是精确 MCP 工具名称，也可以是简单 `*` glob。带有资源或 prompt 的服务器还会生成实用工具名称（`resources_list`、
  `resources_read`、`prompts_list`、`prompts_get`），这些名称使用相同过滤器。
- `mcp.servers.<name>.codex`：可选 Codex app-server 投影控制。此配置块仅是 Codex app-server 线程的 OpenClaw 元数据；它不会影响 ACP 会话、通用 Codex harness 配置或其他运行时适配器。
  非空 `codex.agents` 会将服务器限制到列出的 OpenClaw 智能体 id。
  空白、空列表或无效的范围化智能体列表会被配置验证拒绝，并由运行时投影路径省略，而不是变成全局配置。
  `codex.defaultToolsApprovalMode` 会为该服务器发出 Codex 原生的
  `default_tools_approval_mode`。OpenClaw 会在把原生 `mcp_servers` 配置传给 Codex 前剥离 `codex`
  配置块。省略该配置块时，服务器会以 Codex 默认 MCP 审批行为投影给每个 Codex app-server 智能体。
- `mcp.sessionIdleTtlMs`：会话范围内置 MCP 运行时的空闲 TTL。
  一次性嵌入式运行会请求运行结束清理；此 TTL 是长生命周期会话和未来调用方的兜底机制。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时来热应用。
  下一次工具发现/使用会从新配置重新创建它们，因此已删除的 `mcp.servers` 条目会立即被清理，而不是等待空闲 TTL。
- 运行时发现还会通过丢弃该会话的缓存目录来响应 MCP 工具列表变更通知。声明资源或 prompt 的服务器会获得用于列出/读取资源和列出/获取 prompt 的实用工具。重复工具调用失败会让受影响服务器短暂暂停，然后再尝试下一次调用。

运行时行为参见 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和
[CLI 后端](/zh-CN/gateway/cli-backends#bundle-mcp-overlays)。

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

- `allowBundled`：仅用于内置 Skills 的可选 allowlist（不影响托管/工作区 Skills）。
- `load.extraDirs`：额外共享 Skill 根目录（最低优先级）。
- `load.allowSymlinkTargets`：受信任的真实目标根目录，当 Skill 符号链接位于其配置的源根目录之外时，可以解析到这些目录。
- `workshop.allowSymlinkTargetWrites`：允许 Skill Workshop apply 写入已经受信任的符号链接目标（默认：false）。
- `install.preferBrew`：为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：`metadata.openclaw.install` 规格的 node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允许受信任的 `operator.admin` Gateway 网关客户端安装通过 `skills.upload.*` 暂存的私有 zip 归档（默认：false）。这只启用上传归档路径；普通 ClawHub 安装不需要它。
- `entries.<skillKey>.enabled: false`：即使 Skill 是内置/已安装的，也会禁用它。
- `entries.<skillKey>.apiKey`：为声明主环境变量的 Skills 提供便利写法（明文字符串或 SecretRef 对象）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制 Skill 发现和面向模型的 Skills prompt。
- Skill Workshop 自主/审批设置（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）记录在 [Skills 配置](/zh-CN/tools/skills-config) 中。

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
- 将独立插件文件放入 `plugins.load.paths`；自动发现的 extension 根目录会忽略顶层 `.js`、`.mjs` 和 `.ts` 文件，因此这些根目录中的辅助脚本不会阻塞启动。
- 设备发现接受原生 OpenClaw 插件，以及兼容的 Codex bundle 和 Claude bundle，包括没有清单的 Claude 默认布局 bundle。
- **配置变更需要重启 Gateway 网关。**
- `allow`：可选允许列表（只加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便利字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会改变 prompt 的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子以及受支持的 bundle 提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：当为 `true` 时，受信任的非内置插件可以从类型化钩子读取原始对话内容，例如 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end`。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件，让它可以为后台子智能体运行请求按运行覆盖 `provider` 和 `model`。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅在你有意允许任何模型时才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：显式信任此插件，让它可以为 `api.runtime.llm.complete` 请求模型覆盖。
- `plugins.entries.<id>.llm.allowedModels`：受信任插件 LLM completion 覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅在你有意允许任何模型时才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：显式信任此插件，让它可以针对非默认智能体 id 运行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：插件定义的配置对象（当可用时由原生 OpenClaw 插件 schema 验证）。
- 渠道插件账号/运行时设置位于 `channels.<id>` 下，并且应由所属插件清单的 `channelConfigs` 元数据描述，而不是由集中式 OpenClaw 选项注册表描述。

### Codex harness 插件配置

内置的 `codex` 插件拥有 `plugins.entries.codex.config` 下的原生 Codex app-server harness 设置。完整配置表面见 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)，运行时模型见 [Codex harness](/zh-CN/plugins/codex-harness)。

`codexPlugins` 仅适用于选择原生 Codex harness 的会话。它不会为 OpenClaw 提供商运行、ACP 对话绑定或任何非 Codex harness 启用 Codex 插件。

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

- `plugins.entries.codex.config.codexPlugins.enabled`：为 Codex harness 启用原生 Codex 插件/app 支持。默认值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：已迁移插件 app elicitation 的默认破坏性操作策略。使用 `true` 可在不提示的情况下接受安全的 Codex 审批 schema，使用 `false` 可拒绝它们，使用 `"auto"` 可将 Codex 所需审批路由到 OpenClaw 插件审批，或使用 `"ask"` 在没有持久审批的情况下为每个插件写入/破坏性操作提示。`"ask"` 模式会清除受影响 app 的持久 Codex 按工具审批覆盖，并在 Codex 线程启动前为该 app 选择人工审批 reviewer。默认值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：当全局 `codexPlugins.enabled` 也为 true 时，启用一个已迁移的插件条目。显式条目的默认值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：稳定的 marketplace 身份。V1 仅支持 `"openai-curated"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：迁移得到的稳定 Codex 插件身份，例如 `"google-calendar"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：按插件的破坏性操作覆盖。省略时使用全局 `allow_destructive_actions` 值。按插件值接受相同的 `true`、`false`、`"auto"` 或 `"ask"` 策略。

每个使用 `"ask"` 的已准入插件 app 都会把该 app 的审批请求路由到人工 reviewer。其他 app 和非 app 线程审批会保留其配置的 reviewer，因此混合插件策略不会继承 `"ask"` 行为。

`codexPlugins.enabled` 是全局启用指令。由迁移写入的显式插件条目是持久安装和修复资格集合。不支持 `plugins["*"]`，没有 `install` 开关，并且本地 `marketplacePath` 值有意不作为配置字段，因为它们是主机特定的。

`app/list` 就绪检查会缓存一小时，并在过期时异步刷新。Codex 线程 app 配置是在 Codex harness 会话建立时计算的，而不是在每个轮次都计算；更改原生插件配置后，请使用 `/new`、`/reset` 或重启 Gateway 网关。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl web-fetch 提供商设置。
  - `apiKey`：用于更高限制的可选 Firecrawl API key（接受 SecretRef）。回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认值：`https://api.firecrawl.dev`；自托管覆盖必须指向私有/内部端点）。
  - `onlyMainContent`：仅从页面提取主要内容（默认值：`true`）。
  - `maxAgeMs`：最大缓存年龄，单位为毫秒（默认值：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间，单位为秒（默认值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok Web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：记忆 Dreaming 设置。阶段和阈值见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：主 Dreaming 开关（默认值 `false`）。
  - `frequency`：每次完整 Dreaming 扫描的 cron 节奏（默认为 `"0 3 * * *"`）。
  - `model`：可选 Dream Diary 子智能体模型覆盖。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；与 `allowedModels` 搭配使用以限制目标。模型不可用错误会使用会话默认模型重试一次；信任或允许列表失败不会静默回退。
  - 阶段策略和阈值是实现细节（不是面向用户的配置键）。
- 完整记忆配置位于 [Memory 配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件还可以从 `settings.json` 提供嵌入式 OpenClaw 默认值；OpenClaw 会将这些默认值作为经过清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动记忆插件 id，或使用 `"none"` 禁用记忆插件。
- `plugins.slots.contextEngine`：选择活动上下文引擎插件 id；除非安装并选择其他引擎，否则默认为 `"legacy"`。

见 [插件](/zh-CN/tools/plugin)。

---

## 跟进承诺

`commitments` 控制推断式跟进承诺记忆：OpenClaw 可以从对话轮次中检测 check-in，并通过 heartbeat 运行交付它们。

- `commitments.enabled`：为推断式跟进承诺启用隐藏 LLM 提取、存储和 heartbeat 交付。默认值：`false`。
- `commitments.maxPerDay`：滚动一天内每个智能体会话交付的最大推断式跟进承诺数量。默认值：`3`。

见 [推断式跟进承诺](/zh-CN/concepts/commitments)。

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
- `tabCleanup` 会在空闲时间后或会话超过上限时回收已跟踪的主智能体标签页。设置 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 可禁用这些单独的清理模式。
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` 未设置时处于禁用状态，因此浏览器导航默认保持严格。
- 仅当你有意信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间也会受到相同的私有网络阻止限制。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 设置显式例外。
- 远程配置文件仅可附加（禁用启动/停止/重置）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)；当你的提供商提供直接的 DevTools WebSocket URL 时使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程和 `attachOnly` CDP 可达性以及标签页打开请求。托管式 local loopback 配置文件保留本地 CDP 默认值。持久远程 Playwright 标签页枚举使用较大的值作为其操作截止时间。
- 如果外部托管的 CDP 服务可通过 loopback 访问，请将该配置文件的 `attachOnly: true`；否则 OpenClaw 会将该 loopback 端口视为本地托管的浏览器配置文件，并可能报告本地端口所有权错误。
- `existing-session` 配置文件使用 Chrome MCP 而不是 CDP，并且可以附加到所选主机或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以指向特定的基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- 当 Chrome 已经在 DevTools HTTP(S) 发现端点或直接 WS(S) 端点后运行时，`existing-session` 配置文件可以设置 `cdpUrl`。在该模式下，OpenClaw 会将端点传递给 Chrome MCP，而不是使用自动连接；`userDataDir` 会被 Chrome MCP 启动参数忽略。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：使用快照/ref 驱动的操作而不是 CSS 选择器定位、单文件上传钩子、无对话框超时覆盖、无 `wait --load networkidle`，并且没有 `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅对远程 CDP 配置文件或现有会话端点附加显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局 `browser.executablePath`。可用它让一个配置文件运行在 Chrome，另一个运行在 Brave。
- 本地托管配置文件在进程启动后使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP 发现，并使用 `browser.localCdpReadyTimeoutMs` 检查启动后的 CDP websocket 就绪状态。在 Chrome 能成功启动但就绪检查与启动过程竞争的较慢主机上，请提高这些值。两个值都必须是最大为 `120000` ms 的正整数；无效配置值会被拒绝。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都接受 `~` 和 `~/...`，表示 Chromium 启动前你的操作系统主目录。
  `existing-session` 配置文件上的按配置文件 `userDataDir` 也会展开波浪号。
- 控制服务：仅 loopback（端口派生自 `gateway.port`，默认 `18791`）。
- `extraArgs` 会向本地 Chromium 启动附加额外启动标志（例如 `--disable-gpu`、窗口大小或调试标志）。

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

- `seamColor`：原生应用 UI 边框的强调色（Talk 模式气泡色调等）。
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
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
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

<Accordion title="Gateway field details">

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：WS + HTTP 的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会从 `eth0` 到达，因此无法访问 Gateway 网关。使用 `--network host`，或设置 `bind: "lan"`（或设置 `bind: "custom"` 并使用 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认必需。非 loopback bind 需要 Gateway 网关认证。实践中，这意味着共享 token/密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认生成 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRefs），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。当两者都已配置且 mode 未设置时，启动和服务安装/修复流程会失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于受信任的 local loopback 设置；新手引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将浏览器/用户认证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见 [Trusted Proxy Auth](/zh-CN/gateway/trusted-proxy-auth)）。默认情况下，此模式期望 **非 loopback** 代理来源；同主机 loopback 反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。内部同主机调用方可以使用 `gateway.auth.password` 作为本地直连回退；`gateway.auth.token` 仍然与 trusted-proxy 模式互斥。
- `gateway.auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份标头可以满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 标头认证；它们会改为遵循 Gateway 网关的常规 HTTP 认证模式。此无 token 流程假定 Gateway 网关主机是受信任的。当 `tailscale.mode = "serve"` 时默认为 `true`。
- `gateway.auth.rateLimit`：可选的认证失败限速器。按客户端 IP 和认证范围应用（shared-secret 和 device-token 会独立跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败记录前串行化。因此，来自同一客户端的并发错误尝试可能会在第二个请求触发限速器，而不是两个请求都作为普通不匹配竞态通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；当你有意也想限制 localhost 流量（用于测试设置或严格代理部署）时，设置为 `false`。
- 浏览器来源的 WS 认证尝试始终会被限速，并禁用 loopback 豁免（作为防御浏览器发起的 localhost 暴力破解的纵深防护）。
- 在 loopback 上，这些浏览器来源锁定按规范化后的 `Origin`
  值隔离，因此来自一个 localhost 来源的重复失败不会自动
  锁定另一个来源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开，需要认证）。
- `tailscale.serviceName`：Serve 模式下可选的 Tailscale Service 名称，例如
  `svc:openclaw`。设置后，OpenClaw 会将其传递给 `tailscale serve
--service`，以便 Control UI 可以通过命名 Service 暴露，而不是
  通过设备主机名暴露。该值必须使用 Tailscale 的 `svc:<dns-label>`
  Service 名称格式；启动时会报告派生出的 Service URL。
- `tailscale.preserveFunnel`：当为 `true` 且 `tailscale.mode = "serve"` 时，OpenClaw
  会在启动时重新应用 Serve 之前检查 `tailscale funnel status`，如果外部配置的 Funnel 路由已经覆盖 Gateway 网关端口，则跳过
  重新应用。默认值为 `false`。
- `controlUi.allowedOrigins`：Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。公开的非 loopback 浏览器来源必需。来自 loopback、RFC1918/link-local、`.local`、`.ts.net` 或 Tailscale CGNAT 主机的私有同源 LAN/Tailnet UI 加载无需启用 Host-header 回退即可接受。
- `controlUi.chatMessageMaxWidth`：分组 Control UI 聊天消息的可选最大宽度。接受受约束的 CSS 宽度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host-header 来源策略的部署启用 Host-header 来源回退。
- `terminal.enabled`：选择启用管理员范围的操作员终端。默认值：`false`。终端会在所选 Agent 工作区中启动主机 PTY，继承 Gateway 网关进程环境，并拒绝用于 `sandbox.mode: "all"` 的智能体。仅在受信任的操作员部署中启用；更改它会重启 Gateway 网关并更新 Control UI 内容安全策略。
- `terminal.shell`：可选 shell 可执行文件。未设置时，OpenClaw 在 Unix 上使用 `$SHELL`，在 Windows 上使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`：终端会话在连接断开后（页面重新加载、笔记本睡眠）继续存活多久，并可通过 `terminal.attach` 重新附加且重放其最近输出。默认值：`300`。设置为 `0` 可在连接断开时立即终止会话。分离会话会继续运行其命令，因此在共享或暴露主机上应缩短此时间。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，公开主机的 `remote.url` 必须为 `wss://`；明文 `ws://` 仅对 loopback、LAN、link-local、`.local`、`.ts.net` 和 Tailscale CGNAT 主机接受。
- `remote.remotePort`：远程 SSH 主机上的 Gateway 网关端口。默认为 `18789`；当本地隧道端口与远程 Gateway 网关端口不同时使用此项。
- `remote.sshHostKeyPolicy`：macOS SSH 隧道主机密钥策略。`strict` 是默认值，并要求已有受信任密钥。`openssh` 是对托管别名的有效 OpenSSH 配置的显式选择加入；使用前请检查匹配的用户和系统 SSH 设置。除非再次显式选择加入，否则 macOS 应用和 `configure-remote` 会在更改目标时将此策略重置为 `strict`。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身不会配置 Gateway 网关认证。
- `gateway.push.apns.relay.baseUrl`：外部 APNs relay 的基础 HTTPS URL，用于 relay 支持的 iOS 构建将注册发布到 Gateway 网关之后。公开 App Store 构建使用托管的 OpenClaw relay。自定义 relay URL 必须匹配一个有意分离的 iOS 构建/部署路径，且该路径的 relay URL 指向该 relay。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时时间，单位为毫秒。默认为 `10000`。
- relay 支持的注册会委托给特定 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并向 Gateway 网关转发注册范围的发送授权。另一个 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅用于开发的 loopback HTTP relay URL 逃生口。生产 relay URL 应保持使用 HTTPS。
- `gateway.handshakeTimeoutMs`：认证前 Gateway 网关 WebSocket 握手超时时间，单位为毫秒。默认值：`15000`。设置 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 时优先使用它。在负载较高或低功耗主机上，如果本地客户端可以连接但启动预热仍在稳定中，请增大此值。
- `gateway.channelHealthCheckMinutes`：渠道健康监视器间隔，单位为分钟。设置为 `0` 可全局禁用健康监视器重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧 socket 阈值，单位为分钟。保持其大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号在滚动一小时内的健康监视器最大重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：每渠道选择退出健康监视器重启，同时保持全局监视器启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的每账号覆盖。设置后，它优先于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可以使用 `gateway.remote.*` 作为回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置且未解析，解析会失败关闭（不会被远程回退掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。loopback 条目对同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**让 loopback 请求有资格使用 `gateway.auth.mode: "trusted-proxy"`。
- `allowRealIpFallback`：为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，用于失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选 CIDR/IP 允许列表，用于自动批准首次节点设备配对且没有请求权限范围的情况。未设置时禁用。它不会自动批准操作员/浏览器/Control UI/WebChat 配对，也不会自动批准角色、权限范围、元数据或公钥升级。
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在配对和平台允许列表评估之后，对已声明节点命令进行全局允许/拒绝塑形。使用 `allowCommands` 选择启用危险节点命令，例如 `camera.snap`、`camera.clip` 和 `screen.record`；即使平台默认值或显式允许原本会包含某个命令，`denyCommands` 也会移除该命令。节点更改其声明的命令列表后，请拒绝并重新批准该设备配对，以便 Gateway 网关存储更新后的命令快照。
- `gateway.tools.deny`：为 HTTP `POST /tools/invoke` 阻止的额外工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称，适用于
  owner/admin 调用方。这不会将携带身份的 `operator.write`
  调用方升级为 owner/admin 访问；即使加入允许列表，`cron`、`gateway` 和 `nodes` 仍然
  对非 owner 调用方不可用。

</Accordion>

### OpenAI 兼容端点

- 管理员 HTTP RPC：默认关闭，作为 `admin-http-rpc` 插件提供。启用该插件以注册 `POST /api/v1/admin/rpc`。参见 [Admin HTTP RPC](/zh-CN/plugins/admin-http-rpc)。
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

在一台主机上使用唯一端口和状态目录运行多个 Gateway 网关：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`），`--profile <name>`（使用 `~/.openclaw-<name>`）。

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

- `enabled`：在 Gateway 网关监听器上启用 TLS 终止（HTTPS/WSS）（默认值：`false`）。
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
  - `"hot"`：在进程内应用更改，无需重启。
  - `"hybrid"`（默认）：先尝试热重载；如果需要，则回退到重启。
- `debounceMs`：应用配置更改前的防抖窗口，单位为 ms（非负整数；默认值：`300`）。
- `deferralTimeoutMs`：在强制重启或渠道热重载前，等待进行中操作的可选最长时间，单位为 ms。省略它会使用默认的有界等待（`300000`）；设为 `0` 会无限期等待，并定期记录仍在等待的警告。

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
查询字符串 hook token 会被拒绝。

验证和安全说明：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` 应不同于活动 Gateway 网关共享密钥认证（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）；启动时如果检测到复用，会记录一条非致命安全警告。
- `openclaw security audit` 会将 hook/Gateway 网关认证复用标记为关键发现，包括仅在审计时提供的 Gateway 网关密码认证（`--auth password --password <password>`）。运行 `openclaw doctor --fix` 轮换已持久化且被复用的 `hooks.token`，然后更新外部 hook 发送方以使用新的 hook token。
- `hooks.path` 不能是 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用模板化 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要该选择性启用。

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
- `transform` 可以指向一个返回 hook 操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且保留在 `hooks.transformsDir` 内（绝对路径和路径遍历会被拒绝）。
  - 将 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作区 skill 目录会被拒绝。如果 `openclaw doctor` 报告此路径无效，请将 transform 模块移动到 hooks transforms 目录中，或移除 `hooks.transformsDir`。
- `agentId` 路由到特定智能体；未知 ID 会回退到默认智能体。
- `allowedAgentIds`：限制有效的智能体路由，包括省略 `agentId` 时的默认智能体路径（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：用于没有显式 `sessionKey` 的 hook 智能体运行的可选固定会话键。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：用于显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任何映射或预设使用模板化 `sessionKey` 时，它会变为必需。
- `deliver: true` 会将最终回复发送到一个渠道；`channel` 默认为 `last`。
- `model` 会覆盖此 hook 运行使用的 LLM（如果设置了模型目录，则必须被允许）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留该按消息路由，请设置 `hooks.allowRequestSessionKey: true`，并约束 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
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
- 不要在 Gateway 网关旁边另行运行 `gog gmail watch serve`。

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

- 通过 Gateway 网关端口下的 HTTP 提供智能体可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback 绑定：canvas 路由需要 Gateway 网关认证（token/password/trusted-proxy），与其他 Gateway 网关 HTTP 表面相同。
- 节点 WebView 通常不会发送认证标头；节点完成配对并连接后，Gateway 网关会通告用于访问 canvas/A2UI 的节点作用域能力 URL。
- 能力 URL 绑定到活动节点 WS 会话，并且很快过期。不使用基于 IP 的回退。
- 将实时重载客户端注入提供的 HTML。
- 为空时自动创建起始 `index.html`。
- 还在 `/__openclaw__/a2ui/` 提供 A2UI。
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

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；LAN 多播通告仍要求启用内置的 `bonjour` 插件。
- `off`：在不更改插件启用状态的情况下禁止 LAN 多播通告。
- 内置的 `bonjour` 插件会在 macOS 主机上自动启动，在 Linux、Windows 和容器化 Gateway 网关部署中需要手动启用。
- 当系统主机名是有效的 DNS 标签时，主机名默认使用系统主机名，否则回退为 `openclaw`。可用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。
- `OPENCLAW_DISABLE_BONJOUR=1` 会直接禁用 mDNS 通告，并覆盖 `discovery.mdns.mode`。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络设备发现，请搭配 DNS 服务器（推荐 CoreDNS）+ Tailscale 分流 DNS。

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

- 只有当进程环境中缺少对应键时，才会应用内联环境变量。
- `.env` 文件：CWD `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置中导入缺失的预期键名。
- 完整优先级见[环境](/zh-CN/help/environment)。

### 环境变量替换

在任意配置字符串中用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/空变量会在配置加载时报错。
- 使用 `$${VAR}` 转义，以表示字面量 `${VAR}`。
- 可与 `$include` 配合使用。

---

## 密钥

Secret refs 是增量能力：纯文本值仍然可用。

### `SecretRef`

使用一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

校验：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 AWS 风格的 `secret#json_key` 选择器）
- `source: "exec"` ids 不得包含 `.` 或 `..` 斜杠分隔路径片段（例如 `a/../b` 会被拒绝）

### 支持的凭据表面

- 规范矩阵：[SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 面向受支持的 `openclaw.json` 凭据路径。
- `auth-profiles.json` refs 包含在运行时解析和审计覆盖范围内。

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
- 当 Windows ACL 验证不可用时，文件和 exec 提供商路径会失败关闭。仅对无法验证的可信路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求 `command` 使用绝对路径，并在 stdin/stdout 上使用协议载荷。
- 默认情况下，会拒绝符号链接命令路径。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时验证解析后的目标路径。
- 如果配置了 `trustedDirs`，可信目录检查会应用于解析后的目标路径。
- `exec` 子进程环境默认是最小化的；请使用 `passEnv` 显式传递所需变量。
- Secret 引用会在激活时解析到内存快照中，随后请求路径只读取该快照。
- 激活期间会应用活动表面过滤：已启用表面上的未解析引用会导致启动/重新加载失败，而非活动表面会被跳过并附带诊断。

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

- 每个智能体的 profile 存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 对静态凭证模式支持值级引用（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 旧版扁平 `auth-profiles.json` 映射（例如 `{ "provider": { "apiKey": "..." } }`）不是运行时格式；`openclaw doctor --fix` 会将其重写为规范的 `provider:default` API-key profile，并创建 `.legacy-flat.*.bak` 备份。
- OAuth 模式 profile（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自已在内存中解析的快照；发现旧版静态 `auth.json` 条目时会将其清理。
- 旧版 OAuth 从 `~/.openclaw/credentials/oauth.json` 导入。
- 请参阅 [OAuth](/zh-CN/concepts/oauth)。
- Secrets 运行时行为和 `audit/configure/apply` 工具：[Secrets Management](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：当 profile 因真实的账单/信用额度不足错误而失败时，以小时为单位的基础退避（默认：`5`）。即使响应是 `401`/`403`，明确的账单文本仍可能落入这里，但特定提供商的文本匹配器仍限定在拥有它们的提供商范围内（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 用量窗口或组织/工作区支出限制消息会保留在 `rate_limit` 路径中。
- `billingBackoffHoursByProvider`：可选的按提供商覆盖账单退避小时数。
- `billingMaxHours`：账单退避指数增长的小时上限（默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避分钟数（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口小时数（默认：`24`）。
- `overloadedProfileRotations`：在切换到模型回退前，过载错误允许的同一提供商 auth-profile 最大轮换次数（默认：`1`）。诸如 `ModelNotReadyException` 的提供商繁忙形态会落入这里。
- `overloadedBackoffMs`：重试过载提供商/profile 轮换前的固定延迟（默认：`0`）。
- `rateLimitedProfileRotations`：在切换到模型回退前，限流错误允许的同一提供商 auth-profile 最大轮换次数（默认：`1`）。该限流桶包含提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- 使用 `--verbose` 时，`consoleLevel` 会提升到 `debug`。
- `maxFileBytes`：轮换前活动日志文件的最大大小（字节，正整数；默认：`104857600` = 100 MB）。OpenClaw 会在活动文件旁保留最多五个编号归档。
- `redactSensitive` / `redactPatterns`：尽力对控制台输出、文件日志、OTLP 日志记录和持久化会话转录文本进行遮蔽。`redactSensitive: "off"` 只会禁用此通用日志/转录策略；UI/工具/诊断安全表面在发出前仍会遮蔽密钥。

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

- `enabled`：仪表化输出的总开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 等通配符）。
- `stuckSessionWarnMs`：以毫秒为单位的无进展时长阈值，用于将长时间运行的处理会话分类为 `session.long_running`、`session.stalled` 或 `session.stuck`（默认：`120000`）。回复、工具、状态、分块和 ACP 进度会重置计时器；重复的 `session.stuck` 诊断会在没有变化时退避。
- `stuckSessionAbortMs`：以毫秒为单位的无进展时长阈值，达到后符合条件的停滞活动工作可通过中止排空进行恢复。未设置时，OpenClaw 使用更安全的扩展嵌入式运行窗口，至少为 5 分钟且为 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：当内存压力达到 `critical` 时捕获已脱敏的 OOM 前稳定性快照（默认：`false`）。设置为 `true` 可添加稳定性包文件扫描/写入，同时保留正常的内存压力事件。
- `otel.enabled`：启用 OpenTelemetry 导出管线（默认：`false`）。完整配置、信号目录和隐私模型请参阅 [OpenTelemetry export](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：用于 OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的特定信号 OTLP 端点。设置后，它们只会覆盖该信号的 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或 log 导出。
- `otel.logsExporter`：日志导出接收端：`"otlp"`（默认）、`"stdout"`（每个 stdout 行输出一个 JSON 对象）或 `"both"`。
- `otel.sampleRate`：trace 采样率 `0`-`1`。
- `otel.flushIntervalMs`：定期 telemetry 刷新间隔，单位为毫秒。
- `otel.captureContent`：选择性启用原始内容捕获，用于 OTEL span 属性。默认关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式允许你显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用于最新实验性 GenAI 推理 span 形态的环境变量开关，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名称、`CLIENT` span kind，以及使用 `gen_ai.provider.name` 替代旧版 `gen_ai.system`。默认情况下，span 保留 `openclaw.model.call` 和 `gen_ai.system` 以保持兼容；GenAI metrics 使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：适用于已注册全局 OpenTelemetry SDK 的宿主的环境变量开关。随后 OpenClaw 会跳过插件拥有的 SDK 启动/关闭，同时保持诊断监听器活动。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：当匹配的配置键未设置时使用的特定信号端点环境变量。
- `cacheTrace.enabled`：为嵌入式运行记录缓存 trace 快照（默认：`false`）。
- `cacheTrace.filePath`：缓存 trace JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存 trace 输出中包含的内容（均默认为：`true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | extended-stable | beta | dev
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

- `channel`：发布渠道 - `"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。Extended-stable 是仅包、前台/按需渠道；启动检查和后台自动更新会跳过它。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：稳定渠道自动应用前的最小延迟小时数（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：稳定渠道推出的额外分散窗口小时数（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道检查运行频率，单位为小时（默认：`1`；最大：`24`）。

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    fallbacks: ["acpx-secondary"],
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

- `enabled`：全局 ACP 功能开关（默认：`true`；设为 `false` 可隐藏 ACP 分发和生成操作入口）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认：`true`）。设为 `false` 可保留 ACP 命令可用，同时阻止执行。
- `backend`：默认 ACP 运行时后端 ID（必须匹配已注册的 ACP 运行时插件）。
  请先安装后端插件；如果设置了 `plugins.allow`，还要包含后端插件 ID（例如 `acpx`），否则 ACP 后端不会加载。
- `fallbacks`：当主后端在产生任何输出之前因看似临时的错误（不可用、达到速率限制、配额耗尽或过载）提前失败时，按顺序尝试的备用 ACP 后端 ID 列表。每一项都必须匹配已注册的 ACP 运行时插件后端。
- `defaultAgent`：当生成未指定明确目标时使用的备用 ACP 目标智能体 ID。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 ID 允许列表；为空表示没有额外限制。
- `maxConcurrentSessions`：同时处于活动状态的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口，单位为毫秒。
- `stream.maxChunkChars`：拆分流式块投影前的最大分块大小。
- `stream.repeatSuppression`：按轮次抑制重复的状态/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 会增量流式传输；`"final_only"` 会缓冲到轮次终止事件。
- `stream.hiddenBoundarySeparator`：隐藏工具事件之后、可见文本之前的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的助手输出最大字符数。
- `stream.maxSessionUpdateChars`：投影 ACP 状态/更新行的最大字符数。
- `stream.tagVisibility`：标签名称到布尔可见性覆盖的记录，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话工作进程在可清理前的空闲 TTL，单位为分钟。
- `runtime.installCommand`：引导 ACP 运行时环境时可选运行的安装命令。

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
- 要隐藏整个横幅（不只是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## 身份

请参阅 [Agent 默认值](/zh-CN/gateway/config-agents#agent-defaults)下的 `agents.list` 身份字段。

---

## 桥接（旧版，已移除）

当前构建不再包含 TCP 桥接。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键不再属于配置 schema（在移除前验证会失败；`openclaw doctor --fix` 可以移除未知键）。

<Accordion title="旧版桥接配置（历史参考）">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`：在从 `sessions.json` 中清理之前，保留已完成的隔离 cron 运行会话的时长。也控制已归档删除 cron 转录的清理。默认：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：为兼容较旧的基于文件的 cron 运行日志而接受。默认：`2_000_000` 字节。
- `runLog.keepLines`：每个任务保留的最新 SQLite 运行历史行数。默认：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；如果省略，则不会发送认证标头。
- `webhook`：已弃用的旧版备用 webhook URL（http/https），供 `openclaw doctor --fix` 用于迁移仍带有 `notify: true` 的已存储任务；运行时投递使用每个任务的 `delivery.mode="webhook"` 加 `delivery.to`，或在保留公告投递时使用 `delivery.completionDestination`。

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

- `maxAttempts`：cron 任务遇到临时错误时的最大重试次数（默认：`3`；范围：`0`-`10`）。
- `backoffMs`：每次重试尝试的退避延迟数组，单位为毫秒（默认：`[30000, 60000, 300000]`；1-10 项）。
- `retryOn`：触发重试的错误类型 - `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略时重试所有临时类型。

一次性任务会保持启用，直到重试次数耗尽，然后在保留最终错误状态的同时禁用。重复任务使用相同的临时重试策略，在下一次计划时段之前先等待退避后再次运行；永久错误或临时重试耗尽会回退到带错误退避的正常重复计划。

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

- `enabled`：为 cron 任务启用失败警报（默认：`false`）。
- `after`：触发警报前的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一任务重复警报之间的最小毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入警报阈值（默认：`false`）。跳过的运行会单独跟踪，不影响执行错误退避。
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

- 所有任务的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当有足够的目标数据时默认使用 `"announce"`。
- `channel`：公告投递的渠道覆盖。`"last"` 会复用上一次已知的投递渠道。
- `to`：明确的公告目标或 webhook URL。webhook 模式必填。
- `accountId`：可选的投递账号覆盖。
- 每个任务的 `delivery.failureDestination` 会覆盖此全局默认值。
- 当既没有设置全局失败目标，也没有设置每任务失败目标时，已通过 `announce` 投递的任务会在失败时回退到该主要公告目标。
- 仅当任务的主要 `delivery.mode` 为 `"webhook"` 时，或任务为 `sessionTarget="isolated"` 时，才支持 `delivery.failureDestination`。

请参阅 [Cron 任务](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整入站消息正文                                  |
| `{{RawBody}}`      | 原始正文（无历史/发送者包装）                     |
| `{{BodyStripped}}` | 去除群组提及后的正文                              |
| `{{From}}`         | 发送者标识符                                      |
| `{{To}}`           | 目标标识符                                        |
| `{{MessageSid}}`   | 渠道消息 ID                                       |
| `{{SessionId}}`    | 当前会话 UUID                                     |
| `{{IsNewSession}}` | 创建新会话时为 `"true"`                           |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                    |
| `{{MediaPath}}`    | 本地媒体路径                                      |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…）                |
| `{{Transcript}}`   | 音频转录                                          |
| `{{Prompt}}`       | 为 CLI 条目解析出的媒体提示词                     |
| `{{MaxChars}}`     | 为 CLI 条目解析出的最大输出字符数                 |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群组主题（尽力获取）                              |
| `{{GroupMembers}}` | 群组成员预览（尽力获取）                          |
| `{{SenderName}}`   | 发送者显示名称（尽力获取）                        |
| `{{SenderE164}}`   | 发送者电话号码（尽力获取）                        |
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
- 文件数组：按顺序深度合并（后面的覆盖前面的）。
- 同级键：在包含之后合并（覆盖已包含的值）。
- 嵌套包含：最多深 10 层。
- 路径：相对于发起包含的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。绝对路径/`../` 形式仅在仍解析到该边界内时才允许。设置 `OPENCLAW_INCLUDE_ROOTS`（绝对路径）可允许配置目录之外的额外根目录。
- 限制：路径不得包含空字节，并且在解析前后都必须严格短于 4096 个字符；每个被包含的文件上限为 2 MB。
- 由 OpenClaw 拥有的写入，如果只更改由单文件包含支持的一个顶层分区，会写入该被包含文件。例如，`plugins install` 会在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，并保持 `openclaw.json` 不变。
- 根包含、包含数组，以及带同级覆盖的包含，对 OpenClaw 拥有的写入是只读的；这些写入会失败关闭，而不是扁平化配置。
- 错误：对缺失文件、解析错误、循环包含、无效路径格式和长度过长提供清晰消息。

---

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)
- [Doctor](/zh-CN/gateway/doctor)

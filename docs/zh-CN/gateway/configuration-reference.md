---
read_when:
    - 你需要精确的字段级配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: 核心 OpenClaw 键、默认值及专用子系统参考链接的 Gateway 配置参考
title: 配置参考
x-i18n:
    generated_at: "2026-07-12T14:28:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c8a9141db733a6513778a7218933ee5989c62db11472ec6e1e70bd8bf3fcbac8
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的字段级参考：键、默认值，以及指向更深入子系统页面的链接。有关面向任务的设置指导，请参阅[配置](/zh-CN/gateway/configuration)。由渠道和插件负责的命令目录以及深层记忆/QMD 调节选项位于各自的页面中，而不在此处。

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段均为可选；省略时，OpenClaw 会使用安全的默认值。

代码事实优先于本页面：

- `openclaw config schema` 会输出用于验证和 Control UI 的实时 JSON Schema，其中已合并内置/插件/渠道元数据。
- 编辑配置前，智能体应调用 `gateway` 工具操作 `config.schema.lookup`，以获取一个精确的、限定到具体路径的 schema 节点。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面验证本文档的基线哈希。

专门的深入参考：

- [记忆配置参考](/zh-CN/reference/memory-config)：涵盖 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 Dreaming 配置。
- [斜杠命令](/zh-CN/tools/slash-commands)：涵盖当前的内置命令和捆绑命令目录。
- 有关渠道特定的命令表面，请参阅对应的渠道/插件页面。

---

## 渠道

各渠道的配置键位于[配置 - 渠道](/zh-CN/gateway/config-channels)：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 及其他内置渠道使用 `channels.*`（身份验证、访问控制、多账户、提及门控）。

## Agent 默认设置、多 Agent、会话和消息

请参阅[配置 - 智能体](/zh-CN/gateway/config-agents)，了解：

- `agents.defaults.*`（工作区、模型、思考、Heartbeat、记忆、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、修剪）
- `messages.*`（消息传递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：为 Control UI Talk 实时咨询背后的完整 OpenClaw 智能体运行覆盖思考级别
  - `talk.consultFastMode`：用于 Control UI Talk 实时咨询的一次性快速模式覆盖
  - `talk.speechLocale`：用于 iOS/macOS 上 Talk 语音识别的可选 BCP 47 区域设置 ID
  - `talk.silenceTimeoutMs`：未设置时，Talk 在发送转录文本前保留平台默认的暂停时长（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`：用于跳过 `openclaw_agent_consult` 的已完成实时 Talk 转录文本的 Gateway 网关中继回退机制

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义提供商 / 基础 URL 设置，详见
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## Models

提供商定义、模型允许列表和自定义提供商设置位于
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根节点还负责全局模型目录行为。

```json5
{
  models: {
    // 可选。默认值：true。更改后需要重启 Gateway 网关。
    pricing: { enabled: false },
  },
}
```

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：以提供商 ID 为键的自定义提供商映射。
- `models.providers.*.localService`：用于本地模型服务器的可选按需进程管理器。OpenClaw 会探测已配置的健康检查端点，在需要时启动绝对路径 `command`，等待服务就绪，然后发送模型请求。请参阅[本地模型服务](/zh-CN/gateway/local-model-services)。
- `models.pricing.enabled`：控制在边车进程和渠道进入 Gateway 网关就绪路径后启动的后台定价引导流程。设为 `false` 时，Gateway 网关会跳过获取 OpenRouter 和 LiteLLM 定价目录；已配置的 `models.providers.*.models[].cost` 值仍可用于本地成本估算。

## MCP

由 OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，由嵌入式 OpenClaw 和其他运行时适配器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令可以管理此配置块，并且在编辑配置期间不会连接到目标服务器。

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
        // 可选的 Codex app-server 投影控制。
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`：供公开已配置 MCP 工具的运行时使用的命名 stdio 或远程 MCP 服务器定义。远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是 CLI 原生别名，`openclaw mcp set` 和 `openclaw doctor --fix` 会将其规范化为标准的 `transport` 字段。
- `mcp.servers.<name>.enabled`：设为 `false` 可保留已保存的服务器定义，同时将其从嵌入式 OpenClaw MCP 设备发现和工具投影中排除。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：以秒或毫秒为单位的每服务器 MCP 请求超时时间。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：以秒或毫秒为单位的每服务器连接超时时间。
- `mcp.servers.<name>.supportsParallelToolCalls`：可选的并发提示，供能够选择是否并行发出 MCP 工具调用的适配器使用。
- `mcp.servers.<name>.auth`：对于需要 OAuth 的 HTTP MCP 服务器，设为 `"oauth"`。运行 `openclaw mcp login <name>` 可将令牌存储在 OpenClaw 状态中。
- `mcp.servers.<name>.oauth`：可选的 OAuth 权限范围、重定向 URL 和客户端元数据 URL 覆盖项。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：用于私有端点和双向 TLS 的 HTTP TLS 控制项。
- `mcp.servers.<name>.toolFilter`：可选的每服务器工具选择。`include` 将发现的 MCP 工具限制为名称匹配的工具；`exclude` 隐藏名称匹配的工具。条目可以是精确的 MCP 工具名称或简单的 `*` glob。具有资源或提示词的服务器还会生成实用工具名称（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`），这些名称使用相同的过滤器。
- `mcp.servers.<name>.codex`：可选的 Codex app-server 投影控制。此配置块是仅供 Codex app-server 线程使用的 OpenClaw 元数据；它不会影响 ACP 会话、通用 Codex harness 配置或其他运行时适配器。非空的 `codex.agents` 会将服务器限制为列出的 OpenClaw 智能体 ID。配置验证会拒绝为空、空白或无效的限定范围智能体列表，运行时投影路径也会将其省略，而不会使其变为全局列表。`codex.defaultToolsApprovalMode` 会为该服务器生成 Codex 原生的 `default_tools_approval_mode`。OpenClaw 在将原生 `mcp_servers` 配置传递给 Codex 之前会移除 `codex` 配置块。省略此配置块，可继续为每个 Codex app-server 智能体投影该服务器，并使用 Codex 默认的 MCP 审批行为。
- `mcp.sessionIdleTtlMs`：会话范围内置 MCP 运行时的空闲 TTL。一次性嵌入式运行会请求在运行结束时清理；此 TTL 是长期会话和未来调用方的兜底机制。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时进行热应用。下一次工具发现或使用会根据新配置重新创建这些运行时，因此已移除的 `mcp.servers` 条目会立即被清理，而不必等待空闲 TTL。
- 运行时设备发现还会响应 MCP 工具列表变更通知，丢弃该会话的缓存目录。声明资源或提示词的服务器会获得用于列出/读取资源以及列出/获取提示词的实用工具。工具调用连续失败时，受影响的服务器会短暂暂停，然后才会尝试再次调用。

有关运行时行为，请参阅 [MCP](/zh-CN/cli/mcp#openclaw-as-an-mcp-client-registry) 和
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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅用于内置 Skills 的可选允许列表（不影响托管/工作区 Skills）。
- `load.extraDirs`：额外的共享 Skills 根目录（优先级最低）。
- `load.allowSymlinkTargets`：当 Skills 符号链接位于其已配置源根目录之外时，允许其解析到的可信实际目标根目录。
- `workshop.allowSymlinkTargetWrites`：允许 Skill Workshop 应用操作通过已受信任的符号链接目标进行写入（默认值：false）。
- `install.preferBrew`：设为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装程序，然后再回退到其他类型的安装程序。
- `install.nodeManager`：`metadata.openclaw.install` 规范的 Node 安装程序偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允许受信任的 `operator.admin` Gateway 网关客户端安装通过 `skills.upload.*` 暂存的私有 zip 归档（默认值：false）。这只会启用上传归档路径；常规 ClawHub 安装不需要此选项。
- `entries.<skillKey>.enabled: false`：即使某个 Skills 已内置或安装，也将其禁用。
- `entries.<skillKey>.apiKey`：为声明了主要环境变量的 Skills 提供的便捷配置（明文字符串或 SecretRef 对象）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制 Skills 发现和面向模型的 Skills 提示词。
- Skill Workshop 自主性/审批设置（`workshop.autonomous.enabled`、`workshop.approvalPolicy`、`workshop.maxPending`、`workshop.maxSkillBytes`）记录在 [Skills 配置](/zh-CN/tools/skills-config)中。

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

- 从 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的软件包或 bundle 目录，以及 `plugins.load.paths` 中列出的文件或目录加载。
- 将独立插件文件放入 `plugins.load.paths`；自动发现的扩展根目录会忽略顶层 `.js`、`.mjs` 和 `.ts` 文件，因此这些根目录中的辅助脚本不会阻止启动。
- 设备发现支持原生 OpenClaw 插件以及兼容的 Codex bundle 和 Claude bundle，包括无清单且采用 Claude 默认布局的 bundle。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选的允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（当插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：设为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子和受支持的 bundle 所提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：设为 `true` 时，受信任的非内置插件可通过 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end` 等类型化钩子读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：明确信任此插件，允许其为后台子智能体运行请求每次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅当你有意允许任何模型时才使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明确信任此插件，允许其为 `api.runtime.llm.complete` 请求模型覆盖。
- `plugins.entries.<id>.llm.allowedModels`：受信任插件的 LLM 补全覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅当你有意允许任何模型时才使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明确信任此插件，允许其针对非默认智能体 ID 运行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：插件定义的配置对象（如果有原生 OpenClaw 插件 schema，则由其验证）。
- 渠道插件的账户/运行时设置位于 `channels.<id>` 下，应由所属插件清单的 `channelConfigs` 元数据描述，而不是由 OpenClaw 中央选项注册表描述。

### Codex harness 插件配置

内置 `codex` 插件在
`plugins.entries.codex.config` 下管理原生 Codex app-server harness 设置。有关完整配置
表面，请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)；
有关运行时模型，请参阅 [Codex harness](/zh-CN/plugins/codex-harness)。

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
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
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
  插件/应用支持。默认值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`：在每个新建的原生 Codex
  线程中公开当前已通过身份验证的 Codex 账户所连接的全部可访问应用。默认值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已配置插件应用发起请求时采用的默认破坏性操作策略。
  使用 `true` 可在不提示的情况下接受安全的 Codex 审批 schema，使用 `false`
  可拒绝这些请求，使用 `"auto"` 可通过 OpenClaw
  插件审批处理 Codex 要求的审批，使用 `"ask"` 则会对每次插件写入/破坏性
  操作发出提示，且不保存持久审批。`"ask"` 模式会清除受影响应用的持久 Codex
  按工具审批覆盖，并在 Codex 线程启动前为该应用选择人工
  审批审阅者。
  默认值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：当全局 `codexPlugins.enabled`
  也为 true 时，启用已配置的插件条目。
  对显式条目，默认值为：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  稳定的市场标识；每个已解析条目都必须同时提供此字段和 `pluginName`。
  支持 `"openai-curated"` 和 `"workspace-directory"`。缺少任一
  标识字段的条目将被忽略。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：稳定的
  Codex 插件标识，必须与 `marketplaceName` 一起提供。
  `workspace-directory` 条目必须使用 `plugin/list` 返回的、包含准确市场限定符的
  `summary.id`，例如
  `"example-plugin@workspace-directory"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  每个插件的破坏性操作覆盖。省略时，使用全局
  `allow_destructive_actions` 值。每个插件的值支持相同的
  `true`、`false`、`"auto"` 或 `"ask"` 策略。

每个获准且使用 `"ask"` 的插件应用都会将该应用的审批请求
交由人工审阅者处理。其他应用和非应用线程审批仍使用其
已配置的审阅者，因此混合插件策略不会继承 `"ask"` 行为。

`codexPlugins.enabled` 是全局启用指令。迁移所写入的显式插件
条目是持久保留的精选安装和修复资格集合。手动配置的
`workspace-directory` 条目必须已安装并启用，且其所属应用必须可访问；OpenClaw
不会安装这些条目，也不会为其执行身份验证。如果 Codex 拒绝显式工作区
目录请求，已启用的工作区条目将以
`marketplace_missing` 方式拒绝开放，而默认目录中的精选条目仍然
可用。不支持 `plugins["*"]`，不存在 `install` 开关，并且
本地 `marketplacePath` 值有意不作为配置字段，因为这些值
因主机而异。有关 app-server 版本和
就绪要求，请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

`app/list` 就绪检查会缓存一小时，并在过期时
异步刷新。Codex 线程应用配置在建立 Codex harness
会话时计算，而不是每轮都计算；更改原生插件配置后，请使用 `/new`、`/reset` 或重启 Gateway
网关。

`codexPlugins.allow_all_plugins` 会将当前可访问的所有账户
应用快照到每个新建的原生 Codex 线程中。它不会安装插件或应用，
无法访问的应用仍会被排除。账户应用使用全局
`codexPlugins.allow_destructive_actions` 策略。同一个应用同时出现在两条路径中时，
显式插件条目优先。如果无法读取 `app/list`，
账户级公开将拒绝开放。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 网页获取提供商设置。
  - `apiKey`：用于提高限额的可选 Firecrawl API key（接受 SecretRef）。依次回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认值：`https://api.firecrawl.dev`；自托管覆盖必须指向私有/内部端点）。
  - `onlyMainContent`：仅提取页面的主要内容（默认值：`true`）。
  - `maxAgeMs`：最大缓存时间，以毫秒为单位（默认值：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间，以秒为单位（默认值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok Web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4.3"`）。
- `plugins.entries.memory-core.config.dreaming`：记忆 Dreaming 设置。有关阶段和阈值，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：Dreaming 总开关（默认值为 `false`）。
  - `frequency`：每轮完整 Dreaming 扫描的 cron 频率（默认为 `"0 3 * * *"`）。
  - `model`：可选的 Dream Diary 子智能体模型覆盖。要求 `plugins.entries.memory-core.subagent.allowModelOverride: true`；与 `allowedModels` 配合使用可限制目标。模型不可用错误会使用会话默认模型重试一次；信任或允许列表失败不会静默回退。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整记忆配置位于[记忆配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件还可以从 `settings.json` 提供内嵌的 OpenClaw 默认值；OpenClaw 会将其作为经过清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动记忆插件 ID，或使用 `"none"` 禁用记忆插件。
- `plugins.slots.contextEngine`：选择活动上下文引擎插件 ID；除非你安装并选择其他引擎，否则默认为 `"legacy"`。

请参阅[插件](/zh-CN/tools/plugin)。

---

## 跟进承诺

`commitments` 控制推断式后续记忆：OpenClaw 可以从对话轮次中检测待跟进事项，并通过 Heartbeat 运行交付这些事项。

- `commitments.enabled`：为推断式跟进承诺启用隐藏的 LLM 提取、存储和 Heartbeat 交付。默认值：`false`。
- `commitments.maxPerDay`：滚动一天内，每个智能体会话最多交付的推断式跟进承诺数量。默认值：`3`。

请参阅[推断式跟进承诺](/zh-CN/concepts/commitments)。

---

## 浏览器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在受信任的私有网络访问场景中选择启用
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
- `tabCleanup` 会在跟踪的主智能体标签页空闲一段时间后，或会话超过其上限时回收这些标签页。将 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 设置为
  可分别禁用对应的清理模式。
- 未设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork` 时，该选项处于禁用状态，因此浏览器导航默认保持严格限制。
- 仅当你明确信任浏览器导航访问专用网络时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/发现检查期间也受相同的专用网络阻止规则约束。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 设置明确的例外。
- 远程配置文件仅支持附加（启动/停止/重置已禁用）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  如果你希望 OpenClaw 发现 `/json/version`，请使用 HTTP(S)；如果提供商向你提供直接的 DevTools WebSocket URL，
  请使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程及
  `attachOnly` CDP 可达性检查和标签页打开请求。托管的 loopback
  配置文件保留本地 CDP 默认值。持久远程 Playwright 标签页
  枚举使用较大的值作为其操作截止时间。
- 如果可通过 loopback 访问外部管理的 CDP 服务，请将该
  配置文件的 `attachOnly: true`；否则，OpenClaw 会将 loopback 端口视为
  本地托管浏览器配置文件，并可能报告本地端口所有权错误。
- `existing-session` 配置文件使用 Chrome MCP 而非 CDP，并且可以附加到
  所选主机或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以指定特定的
  基于 Chromium 的浏览器配置文件，例如 Brave 或 Edge。
- 当 Chrome 已在 DevTools HTTP(S) 发现端点或直接 WS(S) 端点后运行时，
  `existing-session` 配置文件可以设置 `cdpUrl`。在该
  模式下，OpenClaw 会将端点传递给 Chrome MCP，而不是使用自动连接；
  Chrome MCP 启动参数会忽略 `userDataDir`。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：
  使用快照/引用驱动的操作，而不是 CSS 选择器定位；仅支持单文件上传
  钩子；不支持对话框超时覆盖；不支持 `wait --load networkidle`；也不支持
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅对远程 CDP 配置文件或 existing-session 端点
  附加显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局
  `browser.executablePath`。使用此选项可让一个配置文件运行在
  Chrome 中，另一个运行在 Brave 中。
- 本地托管配置文件在进程启动后使用 `browser.localLaunchTimeoutMs` 进行 Chrome CDP HTTP
  发现，并使用 `browser.localCdpReadyTimeoutMs` 等待
  启动后的 CDP WebSocket 就绪。在较慢的主机上，如果 Chrome
  能够成功启动，但就绪检查与启动过程发生竞态，请增大这些值。两个值都必须是
  最大为 `120000` ms 的正整数；无效的配置值会被拒绝。
- 自动检测顺序：基于 Chromium 的默认浏览器 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 均
  接受 `~` 和 `~/...`，并在启动 Chromium 前将其解析为你的操作系统主目录。
  `existing-session` 配置文件中每个配置文件的 `userDataDir` 也会展开波浪号。
- 控制服务：仅限 loopback（端口由 `gateway.port` 派生，默认为 `18791`）。
- `extraArgs` 会向本地 Chromium 启动过程追加额外的启动标志（例如
  `--disable-gpu`、窗口尺寸或调试标志）。

---

## 用户界面

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 表情符号、短文本、图片 URL 或数据 URI
    },
  },
}
```

- `seamColor`：原生应用 UI 外观的强调色（Talk 模式气泡色调等）。
- `assistant`：Control UI 身份覆盖。未设置时回退到当前智能体身份。

---

## Gateway 网关

```json5
{
  gateway: {
    mode: "local", // 本地 | 远程
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // 无 | 令牌 | 密码 | 受信任代理
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 用于 mode=trusted-proxy；请参阅 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // 关闭 | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // 为工具调用选择启用由 AI 生成的用途标题（会消耗实用模型令牌）
      // embedSandbox: "scripts", // 严格 | 脚本 | 受信任
      // allowExternalEmbedUrls: false, // 危险：允许绝对外部 http(s) 嵌入 URL
      // chatMessageMaxWidth: "min(1280px, 82%)", // 可选的居中聊天记录最大宽度
      // allowedOrigins: ["https://control.example.com"], // 非 loopback Control UI 必须设置
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的 Host 标头来源回退模式
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    terminal: {
      enabled: false,
      // shell: "/bin/zsh",
    },
    remote: {
      url: "ws://127.0.0.1:18789",
      transport: "ssh", // ssh | 直接连接
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // 可选。默认为 false。
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // 可选。默认未设置/禁用。
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
        // 经 SSH 验证的自动批准。默认：启用（true）。
        // 设置为 false 只会禁用 SSH 验证；不会影响
        // 上面的 autoApproveCidrs。若只允许手动节点配对，请设置为 false 并且
        // 取消设置 autoApproveCidrs。传入对象可进行调整：{ user, identity,
        // timeoutMs, cidrs }。
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 额外禁止通过 /tools/invoke HTTP 调用的工具
      deny: ["browser"],
      // 为所有者/管理员调用方从默认 HTTP 禁止列表中移除工具
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

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非设置为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：WS + HTTP 共用的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（可用时使用 Tailscale IPv4，否则使用环回地址）或 `custom`（一个 IPv4 地址）。解析后的 `tailnet` 地址以及除 `127.0.0.1` 或 `0.0.0.0` 以外的任何 `custom` 地址，都要求在同一端口上使用 `127.0.0.1`，以供同主机客户端使用；如果任一监听器无法绑定，启动就会失败。非环回暴露仍仅限所选接口。
- **旧版绑定别名**：在 `gateway.bind` 中使用绑定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` 绑定会在容器内监听 `127.0.0.1`。使用 Docker 桥接网络（`-p 18789:18789`）时，流量会从 `eth0` 到达，因此无法访问 Gateway 网关。请使用 `--network host`，或设置 `bind: "lan"`（也可设置 `bind: "custom"` 并使用 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **身份验证**：默认必需。非环回绑定要求进行 Gateway 网关身份验证。实际上，这意味着使用共享令牌/密码，或使用配置了 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。新手引导向导默认生成令牌。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。如果两者均已配置但未设置模式，启动以及服务安装/修复流程都会失败。
- `gateway.auth.mode: "none"`：显式的无身份验证模式。仅用于可信的本地环回设置；新手引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将浏览器/用户身份验证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）。默认情况下，此模式要求代理来源为**非环回地址**；同主机环回反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。同主机内部调用方可以使用 `gateway.auth.password` 作为本地直接回退方案；`gateway.auth.token` 仍与可信代理模式互斥。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份标头可以满足 Control UI/WebSocket 身份验证要求（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 标头进行身份验证，而是遵循 Gateway 网关的常规 HTTP 身份验证模式。此无令牌流程假定 Gateway 网关主机可信。当 `tailscale.mode = "serve"` 时，默认为 `true`。
- `gateway.auth.rateLimit`：可选的身份验证失败限流器。按客户端 IP 和身份验证作用域应用（共享密钥和设备令牌分别跟踪）。被阻止的尝试返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败记录前串行处理。因此，来自同一客户端的并发错误尝试可能会在第二个请求时触发限流器，而不是两个请求都因竞争而仅被视为普通的不匹配。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；如果你有意也要对 localhost 流量进行限流（用于测试设置或严格的代理部署），请设置为 `false`。
- 浏览器来源的 WS 身份验证尝试始终会受到限流，且禁用环回豁免（纵深防御，防止基于浏览器对 localhost 进行暴力破解）。
- 在环回地址上，这些浏览器来源的锁定会按规范化后的 `Origin`
  值相互隔离，因此来自一个 localhost 来源的重复失败不会自动
  锁定另一个来源。
- `tailscale.mode`：`serve`（仅限 tailnet，环回绑定）或 `funnel`（公开，需要身份验证）。
- `tailscale.serviceName`：Serve 模式下可选的 Tailscale Service 名称，例如
  `svc:openclaw`。设置后，OpenClaw 会将其传递给 `tailscale serve
--service`，从而可通过具名 Service 而不是设备主机名公开 Control UI。
  该值必须使用 Tailscale 的 `svc:<dns-label>` Service 名称格式；
  启动时会报告派生出的 Service URL。
- `tailscale.preserveFunnel`：当为 `true` 且 `tailscale.mode = "serve"` 时，OpenClaw
  会在启动时重新应用 Serve 之前检查 `tailscale funnel status`，如果外部配置的
  Funnel 路由已覆盖 Gateway 网关端口，则跳过重新应用。
  默认为 `false`。
- `controlUi.allowedOrigins`：Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。公开的非环回浏览器来源必须配置此项。从环回地址、RFC1918/链路本地地址、`.local`、`.ts.net` 或 Tailscale CGNAT 主机加载的私有同源 LAN/Tailnet UI，无需启用 Host 标头回退即可被接受。
- `controlUi.toolTitles`：选择启用由 AI 为 Control UI 聊天中的工具调用生成用途标题。默认值：`false`（工具呈现保持完全确定性，不会发起后台模型调用）。启用后，`chat.toolTitles` 方法会通过标准实用模型路由为复杂调用添加标签——使用智能体的 `utilityModel`（这是操作员做出的决定，可能会像其他实用任务一样，将有限的工具参数发送给所选提供商），或会话提供商声明的默认小型模型（OpenAI → `gpt-5.6-luna`，Anthropic → `claude-haiku-4-5`）——并将结果缓存在按智能体划分的状态数据库中，因此重复查看绝不会再次计费。与所有其他实用任务一样，`utilityModel: \"\"` 会禁用标题；标题绝不会回退到主模型。
- `controlUi.chatMessageMaxWidth`：居中显示的 Control UI 聊天记录的可选最大宽度。接受受约束的 CSS 宽度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host 标头来源策略的部署启用 Host 标头来源回退。
- `terminal.enabled`：选择启用管理员作用域的操作员终端。默认值：`false`。终端会在所选 Agent 工作区中启动主机 PTY，继承 Gateway 网关进程环境，并且拒绝为配置了 `sandbox.mode: "all"` 的智能体启动。仅应在可信的操作员部署中启用；更改此设置会重启 Gateway 网关并更新 Control UI 内容安全策略。
- `terminal.shell`：可选的 Shell 可执行文件。未设置时，OpenClaw 在 Unix 上使用 `$SHELL`，在 Windows 上使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`：终端会话在连接断开（页面重新加载、笔记本电脑休眠）后继续存活的时长，在此期间可通过 `terminal.attach` 重新附加，并重放其最近输出。默认值：`300`。设置为 `0` 可在连接断开的瞬间终止会话。已分离会话会继续运行其命令，因此在共享或公开主机上应缩短此时间。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，公开主机的 `remote.url` 必须使用 `wss://`；明文 `ws://` 仅可用于环回、LAN、链路本地、`.local`、`.ts.net` 和 Tailscale CGNAT 主机。
- `remote.remotePort`：远程 SSH 主机上的 Gateway 网关端口。默认为 `18789`；当本地隧道端口与远程 Gateway 网关端口不同时，请使用此项。
- `remote.sshHostKeyPolicy`：macOS SSH 隧道主机密钥策略。`strict` 是默认值，要求密钥已受信任。`openssh` 是显式选择使用托管别名的有效 OpenSSH 配置；使用前请检查匹配的用户和系统 SSH 设置。更改目标时，macOS 应用和 `configure-remote` 会将此策略重置为 `strict`，除非再次显式选择启用。
- `gateway.remote.token` / `.password` 是远程客户端凭据字段。它们本身不会配置 Gateway 网关身份验证。
- `gateway.push.apns.relay.baseUrl`：外部 APNs 中继的 HTTPS 基础 URL，在基于中继的 iOS 构建将注册信息发布到 Gateway 网关后使用。公开的 App Store 构建使用托管的 OpenClaw 中继。自定义中继 URL 必须与有意单独设置的 iOS 构建/部署路径相匹配，且该路径的中继 URL 指向该中继。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关向中继发送请求的超时时间，以毫秒为单位。默认为 `10000`。
- 基于中继的注册会委托给特定的 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在中继注册中包含该身份，并将注册作用域的发送授权转发给 Gateway 网关。其他 Gateway 网关无法复用该已存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述中继配置的临时环境变量覆盖项。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅用于开发的逃生开关，允许使用环回 HTTP 中继 URL。生产中继 URL 应继续使用 HTTPS。
- `gateway.handshakeTimeoutMs`：身份验证前的 Gateway 网关 WebSocket 握手超时时间，以毫秒为单位。默认值：`15000`。设置 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 后，其优先级更高。在负载较高或性能较低的主机上，如果本地客户端能在启动预热仍未稳定时发起连接，请增大此值。
- `gateway.channelHealthCheckMinutes`：渠道健康监控间隔，以分钟为单位。设置为 `0` 可全局禁用健康监控重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧套接字阈值，以分钟为单位。此值应大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：滚动一小时内，每个渠道/账号可由健康监控执行的最大重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：在保持全局监控启用的同时，按渠道选择停用健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖设置。设置后，其优先级高于渠道级覆盖设置。
- 仅当未设置 `gateway.auth.*` 时，本地 Gateway 网关调用路径才能使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置的 `gateway.auth.token` / `gateway.auth.password` 无法解析，解析将以关闭方式失败（不会用远程回退掩盖问题）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。仅列出你控制的代理。环回条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**使环回请求符合 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`：当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以实现失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选的 CIDR/IP 允许列表，用于自动批准首次进行且未请求任何作用域的节点设备配对。未设置时禁用。此设置不会自动批准操作员/浏览器/Control UI/WebChat 配对，也不会自动批准角色、作用域、元数据或公钥升级。
- `gateway.nodes.pairing.sshVerify`：通过 SSH 验证后自动批准首次节点设备配对（默认启用）。Gateway 网关会通过 SSH 回连配对主机（BatchMode、严格主机密钥），仅当 `openclaw node identity` 的设备密钥完全匹配时才批准。适用条件下限与 `autoApproveCidrs` 相同；除非通过 `cidrs` 覆盖，否则探测仅限私有/CGNAT 来源地址。设置为 `false` 可禁用，或设置为 `{ user, identity, timeoutMs, cidrs }` 进行调整。参见[节点配对](/zh-CN/gateway/pairing#ssh-verified-device-auto-approval-default)。
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在完成配对和平台允许列表评估后，对已声明的节点命令应用全局允许/拒绝规则。使用 `allowCommands` 明确启用危险的节点命令，例如 `camera.snap`、`camera.clip`、`screen.record`、`sms.search` 和 `sms.send`；即使平台默认设置或显式允许原本会包含某个命令，`denyCommands` 也会将其移除。Android SMS 权限与 Gateway 网关命令授权相互独立。节点更改其声明的命令列表后，请拒绝该设备配对并重新批准，以便 Gateway 网关存储更新后的命令快照。
  - `gateway.tools.deny`：额外阻止通过 HTTP `POST /tools/invoke` 调用的工具名称（扩展默认拒绝列表）。
  - `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称，供
  所有者/管理员调用方使用。这不会将携带身份信息的 `operator.write`
  调用方提升为所有者/管理员访问权限；即使已加入允许列表，非所有者调用方仍
  无法使用 `cron`、`gateway` 和 `nodes`。

</Accordion>

### OpenAI 兼容端点

- 管理 HTTP RPC：默认关闭，以 `admin-http-rpc` 插件形式提供。启用该插件即可注册 `POST /api/v1/admin/rpc`。请参阅[管理 HTTP RPC](/zh-CN/plugins/admin-http-rpc)。
- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空允许列表视为未设置；使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 禁用 URL 获取。
- 可选的响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅为你控制的 HTTPS 源设置；请参阅[可信代理身份验证](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

使用唯一端口和状态目录，在一台主机上运行多个 Gateway 网关：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

请参阅[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

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
- `autoGenerate`：未配置显式文件时，自动生成本地自签名证书/密钥对；仅用于本地/开发环境。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；应限制其访问权限。
- `caPath`：用于客户端验证或自定义信任链的可选 CA 证书包路径。

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

- `mode`：控制如何在运行时应用配置编辑。
  - `"off"`：忽略实时编辑；更改需要显式重启。
  - `"restart"`：配置更改时始终重启 Gateway 网关进程。
  - `"hot"`：在进程内应用更改，无需重启。
  - `"hybrid"`（默认值）：先尝试热重载；必要时回退到重启。
- `debounceMs`：应用配置更改前的防抖时间窗口，以毫秒为单位（非负整数；默认值：`300`）。
- `deferralTimeoutMs`：可选的最长等待时间，以毫秒为单位，用于在强制重启或渠道热重载前等待正在进行的操作完成。省略该值时使用默认的有界等待时间（`300000`）；设置为 `0` 可无限期等待，并定期记录仍在等待的警告。

---

## 云端工作节点环境

云端工作节点需主动启用。如果缺少 `cloudWorkers`，或 `profiles` 为空，OpenClaw 不接受创建任何新的工作节点。之前创建的持久记录仍会进行协调并保持可见；现有的 Gateway 网关/节点投影不变。

每个工作节点提供商都必须从可信的预配输出中返回 SSH `hostKey`，格式必须严格为 `algorithm base64`，不能包含主机名或注释。引导程序会将该密钥写入隔离的 `known_hosts` 文件，使用 `StrictHostKeyChecking=yes`，并在提供商未提供该密钥时于打开连接前失败。不存在首次使用时信任的回退机制。

隧道按需设置，而不是预配过程的一部分。启动后，Gateway 网关会将工作节点本地 Unix 套接字反向转发到其环回 WebSocket 端点。该套接字位于随机分配、仅所有者可访问的远程目录中；与环回 TCP 端口不同，多用户工作节点上的其他账户无法访问它，也不会与其他环境的端口冲突。仅当隧道所有者仍为当前所有者时，SSH 保活和有上限的重连退避才会运行。停止隧道时，会先阻止重新连接，再关闭 SSH 进程。

控制流量和工作区传输使用相互独立的 SSH 连接。两者复用相同的已解析身份和隔离的固定 `known_hosts` 文件，但工作区传输不会与长期运行的隧道共享 SSH 连接复用，因此 rsync 无法阻塞控制流量。

### Crabbox 配置文件

内置 `crabbox` 提供商通过本地 Crabbox CLI 预配支持 SSH 的租约。内部的 `settings.provider` 用于选择 Crabbox 后端；它与外部 OpenClaw 提供商 ID 相互独立。

```json5
{
  cloudWorkers: {
    profiles: {
      production: {
        provider: "crabbox",
        install: "bundle", // 默认值；仅对已发布的 Gateway 网关版本使用 "npm"。
        settings: {
          provider: "aws",
          class: "standard",
          ttl: "24h",
          idleTimeout: "60m",
          // 可选的绝对路径。默认值：同级 ../crabbox/bin/crabbox，然后是 PATH。
          binary: "/usr/local/bin/crabbox",
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `settings.provider`（必需）：通过 `--provider` 传递的 Crabbox 后端。使用其 inspect 输出中包含 SSH 端点的后端；`aws` 选择直接 AWS 后端。
- `settings.class`（必需）：通过 `--class` 传递的 Crabbox 机器类别。
- `settings.ttl` 和 `settings.idleTimeout`（必需）：通过 `--ttl` 和 `--idle-timeout` 传递的正数 Go 时长字符串。这些提供商侧的故障保护机制不同于下方存储的 OpenClaw `lifetime` 策略。
- `settings.binary`：可选的 Crabbox 可执行文件绝对路径。如果未设置，OpenClaw 会先检查同级 Crabbox 检出目录，再检查 `PATH` 中的可执行条目，最后调用 `crabbox`，以便在 CLI 缺失时仍将其作为可见的提供商错误报告。

未知设置将被拒绝。Crabbox 凭据和后端特定的账户配置仍由 Crabbox 管理；不要将它们放入 `settings`。OpenClaw 仅调用本地 CLI，此插件不会发起任何提供商网络调用。预配时始终传递 `--keep=true`；OpenClaw 负责外部生命周期，并使用 `crabbox stop` 销毁租约。

<Warning>
  OpenClaw 通过提供商所有的密钥解析器解析 Crabbox 租约本地的 `sshKey` 路径。当前 `crabbox inspect --json` 输出不会公开已预配的 `sshHostKey`，因此 Crabbox 支持的工作节点仍会在引导或设置隧道前以失败关闭方式终止。Crabbox 必须预配权威的每租约主机密钥，并以严格的 `algorithm base64` 格式返回 `sshHostKey`，不能包含主机名或注释。其当前租约本地的 `known_hosts` 缓存不是预配信任材料。
</Warning>

### 静态 SSH 开发配置文件

```json5
{
  cloudWorkers: {
    profiles: {
      development: {
        provider: "static-ssh",
        settings: {
          host: "worker.example.test",
          port: 22,
          user: "openclaw",
          hostKey: "ssh-ed25519 <base64-public-host-key>",
          keyRef: {
            source: "env",
            provider: "default",
            id: "OPENCLAW_WORKER_SSH_KEY",
          },
        },
        lifetime: {
          idleTimeoutMinutes: 60,
          maxLifetimeMinutes: 1440,
        },
      },
    },
  },
}
```

- `profiles`：具有非空、去除首尾空白后 ID 的命名工作节点配置文件。每个配置文件选择一个由插件注册的提供商。
- `provider`：非空的工作节点提供商 ID。示例使用内置 `crabbox` 提供商和 QA Lab `static-ssh` 提供商。
- `install`：工作节点安装方法。`"bundle"`（默认值）传输 Gateway 网关已安装构建的内容哈希包，并支持已发布、开发中和未发布的版本。`"npm"` 是针对未经修改的打包版本的主动启用优化；它从公共 npm 注册表安装 `openclaw@<exact gateway version>`，绝不会安装 `latest`。
- 配置后会自动选择内置提供商插件，但显式禁用设置和 `plugins.allow` 仍然适用。配置允许列表时，请包含提供商 ID（例如 `crabbox`）。外部提供商插件也必须安装并显式启用。
- `settings`：由提供商所有且大小受限的 JSON。所选插件定义并验证其键；对包含密钥的值使用 [SecretRef 对象](/zh-CN/gateway/secrets)。静态 SSH 提供商要求提供 `host`、`user`、`hostKey` 和 `keyRef`；`port` 默认为 `22`。`hostKey` 必须是从已知主机或其他可信渠道获得的一行 OpenSSH 公共主机密钥（`algorithm base64`），且不能带选项前缀。
- `lifetime.idleTimeoutMinutes`：以分钟为单位的正整数，存储供后续空闲回收策略使用。
- `lifetime.maxLifetimeMinutes`：以分钟为单位的正整数，存储供后续生命周期策略使用。

工作节点上必须已经安装受支持的 Node 运行时（22.19+、23.11+ 或 24+）。主动启用的 `"npm"` 方法还需要 `npm`，并且需要能够通过出站 HTTPS 访问公共 npm 注册表。联网工具链设置属于提供商策略；引导程序会报告可操作的错误，而不会自行安装工具链。

此基础功能会安装并验证 Gateway 网关构建，并提供隧道启动/停止生命周期，但不会启动通用 OpenClaw CLI。自包含的工作节点入口和循环将在下一个云端工作节点里程碑中实现。

每条持久环境记录都会在创建时的配置文件快照中保留其已验证的提供商设置、已解析的安装方法和生命周期策略。更改或删除命名配置文件会影响新创建的环境；只要所属插件仍然可用，现有记录就会继续使用该快照进行生命周期协调。

在首个云端工作节点版本中，生命周期值仅作为数据使用；自动执行将在后续生命周期工作中实现。配置文件更改需要重启 Gateway 网关。

<Warning>
  `static-ssh` 提供商是源代码树中的 QA Lab 开发工具，不包含在打包发行版中。在其共享主机上运行的工作节点可以读取不相关的主机数据，因此不要将此提供商用作生产环境隔离边界。
  其操作员必须提供预期的 `hostKey`；OpenClaw 不会从首次连接中学习或接受密钥。
  销毁其租约只会释放 OpenClaw 的逻辑记录；不会停止或清理主机。
</Warning>

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
        messageTemplate: "发件人：{{messages[0].from}}\n主题：{{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

身份验证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
查询字符串中的 Hook 令牌会被拒绝。

验证和安全注意事项：

- `hooks.enabled=true` 要求 `hooks.token` 非空。
- `hooks.token` 应与当前 Gateway 网关共享密钥身份验证（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；启动时若检测到重复使用，会记录一条非致命安全警告。
- `openclaw security audit` 会将钩子/Gateway 网关身份验证凭据重复使用标记为严重发现，包括仅在审计时提供的 Gateway 网关密码身份验证（`--auth password --password <password>`）。运行 `openclaw doctor --fix` 以轮换已持久化且重复使用的 `hooks.token`，然后更新外部钩子发送方以使用新的钩子令牌。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要选择启用此功能。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认值：`false`）时，才接受请求载荷中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 由模板渲染的映射 `sessionKey` 值会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 后面的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- `{{messages[0].subject}}` 之类的模板从载荷中读取数据。
- `transform` 可以指向返回钩子操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且必须位于 `hooks.transformsDir` 内（绝对路径和路径遍历会被拒绝）。
  - 请将 `hooks.transformsDir` 保持在 `~/.openclaw/hooks/transforms` 下；工作区 Skills 目录会被拒绝。如果 `openclaw doctor` 报告此路径无效，请将转换模块移入钩子转换目录，或移除 `hooks.transformsDir`。
- `agentId` 将请求路由到特定智能体；未知 ID 会回退到默认智能体。
- `allowedAgentIds`：限制实际的智能体路由，包括省略 `agentId` 时的默认智能体路径（`*` 或省略 = 全部允许，`[]` = 全部拒绝）。
- `defaultSessionKey`：可选的固定会话键，用于未显式指定 `sessionKey` 的钩子智能体运行。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任何映射或预设使用模板化的 `sessionKey` 时，此项为必需项。
- `deliver: true` 将最终回复发送到渠道；`channel` 默认为 `last`。
- `model` 覆盖此次钩子运行使用的 LLM（如果设置了模型目录，则该模型必须在允许范围内）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留这种按消息路由，请设置 `hooks.allowRequestSessionKey: true`，并限制 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果需要使用 `hooks.allowRequestSessionKey: false`，请使用静态 `sessionKey` 覆盖预设，而不是使用模板化默认值。

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

- 配置后，Gateway 网关会在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可将其禁用。
- 不要在 Gateway 网关运行的同时单独运行 `gog gmail watch serve`。

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
            // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- 在 Gateway 网关端口下通过 HTTP 提供可由智能体编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认值）。
- 非回环绑定：与其他 Gateway 网关 HTTP 接口一样，Canvas 路由需要 Gateway 网关身份验证（令牌/密码/可信代理）。
- 节点 WebView 通常不会发送身份验证标头；节点配对并连接后，Gateway 网关会公布节点范围的能力 URL，以访问 Canvas/A2UI。
- 能力 URL 绑定到当前节点 WS 会话，并会很快过期。不使用基于 IP 的回退。
- 将实时重载客户端注入所提供的 HTML。
- 目录为空时自动创建初始 `index.html`。
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

- `minimal`（默认值）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`；局域网多播广播仍要求启用内置 `bonjour` 插件。
- `off`：在不更改插件启用状态的情况下禁止局域网多播广播。
- 内置 `bonjour` 插件会在 macOS 主机上自动启动，而在 Linux、Windows 和容器化 Gateway 网关部署中需要选择启用。
- 当系统主机名是有效的 DNS 标签时，主机名默认为系统主机名，否则回退到 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。
- `OPENCLAW_DISABLE_BONJOUR=1` 会完全禁用 mDNS 广播，并覆盖 `discovery.mdns.mode`。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络设备发现，请将其与 DNS 服务器（推荐 CoreDNS）和 Tailscale 分割 DNS 配合使用。

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

- 仅当进程环境中缺少相应键时，才会应用内联环境变量。
- `.env` 文件：CWD 中的 `.env` + `~/.openclaw/.env`（均不会覆盖现有变量）。
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

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失或为空的变量会在加载配置时引发错误。
- 使用 `$${VAR}` 转义，以表示字面量 `${VAR}`。
- 可与 `$include` 配合使用。

---

## 密钥

密钥引用是附加功能：纯文本值仍然有效。

### `SecretRef`

使用以下一种对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 ID 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 ID：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 ID 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 AWS 风格的 `secret#json_key` 选择器）
- `source: "exec"` 的 ID 不得包含以斜杠分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

### 支持的凭据接口

- 规范矩阵：[SecretRef 凭据接口](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 的目标是受支持的 `openclaw.json` 凭据路径。
- `auth-profiles.json` 引用包含在运行时解析和审计覆盖范围内。

### 密钥提供商配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选的显式环境变量提供商
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
- 当无法验证 Windows ACL 时，文件提供商和 exec 提供商的路径会采用失败关闭策略。仅对无法验证的可信路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求使用绝对 `command` 路径，并通过 stdin/stdout 使用协议载荷。
- 默认情况下，符号链接命令路径会被拒绝。设置 `allowSymlinkCommand: true` 可在验证解析后的目标路径时允许符号链接路径。
- 如果配置了 `trustedDirs`，可信目录检查将应用于解析后的目标路径。
- 默认情况下，`exec` 子进程环境是最小化的；请使用 `passEnv` 显式传递所需变量。
- 密钥引用会在激活时解析到内存快照中，之后请求路径只读取该快照。
- 激活期间会应用活动接口过滤：已启用接口上的未解析引用会导致启动/重新加载失败，而非活动接口会被跳过并生成诊断信息。

---

## 身份验证存储

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

- 每个智能体的配置文件存储在 `<agentDir>/auth-profiles.json`。
- 对于静态凭据模式，`auth-profiles.json` 支持值级引用（`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- 旧版扁平 `auth-profiles.json` 映射（例如 `{ "provider": { "apiKey": "..." } }`）不是运行时格式；`openclaw doctor --fix` 会将其重写为规范的 `provider:default` API 密钥配置文件，并创建 `.legacy-flat.*.bak` 备份。
- OAuth 模式配置文件（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 提供的身份验证配置文件凭据。
- 静态运行时凭据来自已解析的内存快照；发现旧版静态 `auth.json` 条目时会将其清除。
- 从 `~/.openclaw/credentials/oauth.json` 导入旧版 OAuth 数据。
- 请参阅 [OAuth](/zh-CN/concepts/oauth)。
- 密钥运行时行为及 `audit/configure/apply` 工具：[密钥管理](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：配置文件因真实的账单/余额不足错误而失败时的基础退避小时数（默认值：`5`）。即使响应为 `401`/`403`，明确的账单相关文本仍可归入此处，但提供商特定的文本匹配器仍仅限于其所属提供商（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或组织/工作区支出限额消息则继续归入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的按提供商账单退避小时数覆盖值。
- `billingMaxHours`：账单退避指数增长的小时数上限（默认值：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避分钟数（默认值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟数上限（默认值：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口小时数（默认值：`24`）。
- `overloadedProfileRotations`：对于过载错误，在切换到模型回退之前，同一提供商身份验证配置文件的最大轮换次数（默认值：`1`）。`ModelNotReadyException` 等提供商繁忙形式归入此处。
- `overloadedBackoffMs`：重试过载的提供商/配置文件轮换之前的固定延迟（默认值：`0`）。
- `rateLimitedProfileRotations`：对于速率限制错误，在切换到模型回退之前，同一提供商身份验证配置文件的最大轮换次数（默认值：`1`）。该速率限制类别包括提供商特有的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 审计

```json5
{
  audit: {
    enabled: true,
    messages: "off", // 关闭 | 直接会话 | 全部
  },
}
```

Gateway 网关将智能体运行和工具操作的**仅元数据**审计事件记录到共享状态数据库中。消息生命周期元数据需要单独选择启用。账本存储身份、时间、工具名称和规范化结果，但绝不存储提示词、消息正文、工具参数、结果或原始错误文本。消息行不存储原始的平台账号、对话、消息和目标 ID。运行/工具会话键仍可用于关联，且其本身可能包含平台账号或对端 ID。记录将在 30 天后过期，账本最多保留 100,000 行。可使用 [`openclaw audit`](/zh-CN/cli/audit) 或 [`audit.activity.list`](/zh-CN/gateway/protocol#audit-ledger-rpc) Gateway RPC 查询。完整的数据模型、隐私语义和覆盖限制，请参阅[审计历史](/zh-CN/gateway/audit)。

- `enabled`：记录新的审计事件（默认值：`true`）。审计跟踪默认启用，因为仅在事件发生后才启用的审计跟踪无法解释该事件。设置为 `false` 后，Gateway 网关重启时将停止插入新事件；现有记录在过期前仍可读取。重新启用后会从该时间点恢复记录，不会回填期间的空缺。
- `messages`：消息元数据范围（默认值：`"off"`）。`"direct"` 仅记录已知的直接对话。`"all"` 还会记录群组、频道和未知类型的对话。这两种模式均不包含内容，并在可进行关联时使用当前安装环境本地的带密钥假名替换原始标识符。这些信息用于辅助关联，而非匿名化；状态数据库会存储派生密钥，但 RPC 和 CLI 导出不会包含该密钥。

运行中的 Gateway 网关会在启动时读取 `audit.enabled` 和 `audit.messages`；更改任一设置后请重启。目前消息覆盖范围包括到达核心分发环节并被接受的入站消息，以及到达共享持久化投递环节的每个原始逻辑出站回复载荷对应的一行终态记录。绕过这些共享边界的插件本地路径和直接发送路径尚未覆盖。这个有界后台写入器采用尽力而为方式，并非无损的合规归档。

---

## 日志

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // 美观 | 紧凑 | json
    redactSensitive: "tools", // 关闭 | 工具
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 以使用固定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：轮换前活动日志文件的最大字节数（正整数；默认值：`104857600` = 100 MB）。OpenClaw 最多会在活动文件旁保留五个带编号的归档文件。
- `redactSensitive` / `redactPatterns`：对控制台输出、文件日志、OTLP 日志记录以及持久化会话转录文本进行尽力而为的遮盖。`redactSensitive: "off"` 仅禁用这一通用日志/转录策略；UI、工具和诊断安全界面仍会在输出前遮盖密钥。

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

- `enabled`：检测输出的总开关（默认值：`true`）。
- `flags`：用于启用针对性日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 等通配符）。
- `stuckSessionWarnMs`：无进展时长阈值（毫秒），用于将长时间运行的处理会话分类为 `session.long_running`、`session.stalled` 或 `session.stuck`（默认值：`120000`）。回复、工具、状态、分块和 ACP 进度会重置计时器；状态不变时，重复的 `session.stuck` 诊断会逐步退避。
- `stuckSessionAbortMs`：无进展时长阈值（毫秒），达到后可对符合条件且停滞的活动工作执行中止并排空，以便恢复。未设置时，OpenClaw 使用更安全的延长嵌入式运行窗口，其值至少为 5 分钟且为 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：当内存压力达到 `critical` 时，捕获经过脱敏的 OOM 前稳定性快照（默认值：`false`）。设置为 `true` 可增加稳定性数据包的文件扫描/写入，同时保留常规内存压力事件。
- `otel.enabled`：启用 OpenTelemetry 导出管道（默认值：`false`）。有关完整配置、信号目录和隐私模型，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：用于 OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的信号专用 OTLP 端点。设置后，仅针对对应信号覆盖 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认值）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用跟踪、指标或日志导出。
- `otel.logsExporter`：日志导出目标：`"otlp"`（默认值）、`"stdout"`（每个 stdout 行输出一个 JSON 对象）或 `"both"`。
- `otel.sampleRate`：跟踪采样率 `0`-`1`。
- `otel.flushIntervalMs`：遥测数据的定期刷新间隔（毫秒）。
- `otel.captureContent`：选择启用将原始内容捕获到 OTEL span 属性中。默认关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式允许显式启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用于启用最新实验性 GenAI 推理 span 结构的环境变量开关，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名称、`CLIENT` span 类型，以及使用 `gen_ai.provider.name` 取代旧版 `gen_ai.system`。默认情况下，span 会保留 `openclaw.model.call` 和 `gen_ai.system` 以保持兼容性；GenAI 指标使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：用于已注册全局 OpenTelemetry SDK 的主机的环境变量开关。此时 OpenClaw 会跳过插件拥有的 SDK 启动/关闭流程，同时保持诊断监听器处于活动状态。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：当对应配置键未设置时使用的信号专用端点环境变量。
- `cacheTrace.enabled`：记录嵌入式运行的缓存跟踪快照（默认值：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存跟踪输出中包含的内容（默认值均为 `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // 稳定版 | 长期稳定版 | 测试版 | 开发版
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

- `channel`：发布渠道——`"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。长期稳定版仅适用于软件包：前台命令负责安装，而 Gateway 网关可发出只读更新提示。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认值：`true`）。已存储的长期稳定版选择使用相同的只读提示和 24 小时提示计划。
- `auto.enabled`：为稳定版和测试版软件包安装启用后台自动更新（默认值：`false`）。长期稳定版永远不会自动应用更新。
- `auto.stableDelayHours`：自动应用稳定版渠道更新前的最短延迟小时数（默认值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：稳定版渠道额外的分批发布分散窗口小时数（默认值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：测试版渠道检查的运行频率（小时）（默认值：`1`；最大值：`24`）。稳定版延迟/抖动和测试版轮询设置不适用于长期稳定版。

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
      deliveryMode: "live", // 实时 | 仅最终结果
      hiddenBoundarySeparator: "paragraph", // 无 | 空格 | 换行 | 段落
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`：全局 ACP 功能开关（默认值：`true`；设为 `false` 可隐藏 ACP 分派和生成入口）。
- `dispatch.enabled`：ACP 会话轮次分派的独立开关（默认值：`true`）。设为 `false` 可在保留 ACP 命令可用的同时阻止执行。
- `backend`：默认 ACP 运行时后端 ID（必须与已注册的 ACP 运行时插件匹配）。
  请先安装后端插件；如果设置了 `plugins.allow`，请将后端插件 ID（例如 `acpx`）加入其中，否则 ACP 后端将不会加载。
- `fallbacks`：ACP 后端 ID 的有序回退列表。当主后端在产生任何输出之前，因类似临时故障的错误（不可用、达到速率限制、配额耗尽或过载）而提前失败时，将依次尝试这些后端。每个条目都必须与已注册的 ACP 运行时插件后端匹配。
- `defaultAgent`：生成时未指定明确目标的情况下使用的 ACP 回退目标智能体 ID。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 ID 白名单；为空表示不施加额外限制。
- `maxConcurrentSessions`：可同时处于活动状态的 ACP 会话数上限。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口，单位为 ms。
- `stream.maxChunkChars`：拆分流式分块投影前允许的最大块大小。
- `stream.repeatSuppression`：在每个轮次中抑制重复的状态/工具行（默认值：`true`）。
- `stream.deliveryMode`：`"live"` 表示增量流式传输；`"final_only"` 表示缓冲至轮次终止事件发生。
- `stream.hiddenBoundarySeparator`：隐藏的工具事件之后、可见文本之前使用的分隔符（默认值：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次可投影的助手输出字符数上限。
- `stream.maxSessionUpdateChars`：投影的 ACP 状态/更新行的最大字符数。
- `stream.tagVisibility`：从标签名称到流式事件布尔可见性覆盖值的映射。
- `runtime.ttlMinutes`：ACP 会话工作进程在可被清理前的空闲 TTL，单位为分钟。
- `runtime.installCommand`：引导 ACP 运行时环境时可选择运行的安装命令。

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
  - `"random"`（默认）：轮换显示幽默/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍显示横幅标题/版本）。
- 要隐藏整个横幅（而不仅是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

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

## 身份信息

请参阅 [Agent 默认设置](/zh-CN/gateway/config-agents#agent-defaults)下的 `agents.list` 身份字段。

---

## Bridge（旧版，已移除）

当前版本不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置模式（移除前验证会失败；`openclaw doctor --fix` 可以清除未知键）。

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
    maxConcurrentRuns: 8, // 默认值；cron 分派 + 隔离的 cron 智能体轮次执行
    webhook: "https://example.invalid/legacy", // 用于已存储的 notify:true 任务的已弃用回退项
    webhookToken: "replace-with-dedicated-token", // 用于出站 webhook 身份验证的可选 bearer token
    sessionRetention: "24h", // 时长字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认值为 2_000_000 字节
      keepLines: 2000, // 默认值为 2000
    },
  },
}
```

- `sessionRetention`：在清理 SQLite 会话行之前，保留已完成的隔离 cron 运行会话的时长。还控制已归档且已删除的 cron 转录记录的清理。默认值：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：为兼容较旧的文件存储型 cron 运行日志而接受。默认值：`2_000_000` 字节。
- `runLog.keepLines`：每个任务保留的最新 SQLite 运行历史记录行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；如果省略，则不发送身份验证标头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），由 `openclaw doctor --fix` 用于迁移仍包含 `notify: true` 的已存储任务；运行时投递使用每个任务的 `delivery.mode="webhook"` 和 `delivery.to`，或者在保留公告投递时使用 `delivery.completionDestination`。

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

- `maxAttempts`：cron 作业发生瞬时错误时的最大重试次数（默认值：`3`；范围：`0`-`10`）。
- `backoffMs`：每次重试的退避延迟数组，单位为毫秒（默认值：`[30000, 60000, 300000]`；1-10 个条目）。
- `retryOn`：触发重试的错误类型——`"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略此项可重试所有瞬时错误类型。

一次性作业在重试次数耗尽前会保持启用，之后将被禁用，同时保留最终错误状态。重复作业使用相同的瞬时错误重试策略，在下一个计划时间段之前先等待退避时间，然后再次运行；永久性错误或瞬时错误重试次数耗尽后，将回退到带错误退避的正常重复计划。

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

- `enabled`：启用 cron 作业失败警报（默认值：`false`）。
- `after`：触发警报前的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一作业重复发出警报的最小间隔毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入警报阈值（默认值：`false`）。跳过的运行会单独跟踪，不影响执行错误的退避。
- `mode`：投递模式——`"announce"` 通过渠道消息发送；`"webhook"` 发送到已配置的 webhook。
- `accountId`：可选的账号或渠道 ID，用于限定警报投递范围。

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
- `mode`：`"announce"` 或 `"webhook"`；当目标数据足够时，默认为 `"announce"`。
- `channel`：公告投递的渠道覆盖设置。`"last"` 会复用最后已知的投递渠道。
- `to`：明确的公告目标或 webhook URL。webhook 模式下必填。
- `accountId`：可选的投递账号覆盖设置。
- 每个作业的 `delivery.failureDestination` 会覆盖此全局默认值。
- 如果既未设置全局失败目标，也未设置每个作业的失败目标，已通过 `announce` 投递的作业在失败时会回退到其主要公告目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 作业，除非作业的主要 `delivery.mode` 为 `"webhook"`。

请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                           |
| ------------------ | ---------------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                             |
| `{{RawBody}}`      | 原始正文（不含历史记录/发送者包装）            |
| `{{BodyStripped}}` | 已移除群组提及的正文                           |
| `{{From}}`         | 发送者标识符                                   |
| `{{To}}`           | 目标标识符                                     |
| `{{MessageSid}}`   | 渠道消息 ID                                    |
| `{{SessionId}}`    | 当前会话 UUID                                  |
| `{{IsNewSession}}` | 创建新会话时为 `"true"`                        |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                 |
| `{{MediaPath}}`    | 本地媒体路径                                   |
| `{{MediaType}}`    | 媒体类型（图像/音频/文档/……）                  |
| `{{Transcript}}`   | 音频转录文本                                   |
| `{{Prompt}}`       | 为 CLI 条目解析后的媒体提示词                  |
| `{{MaxChars}}`     | 为 CLI 条目解析后的最大输出字符数              |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                         |
| `{{GroupSubject}}` | 群组主题（尽力获取）                           |
| `{{GroupMembers}}` | 群组成员预览（尽力获取）                       |
| `{{SenderName}}`   | 发送者显示名称（尽力获取）                     |
| `{{SenderE164}}`   | 发送者电话号码（尽力获取）                     |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等）    |

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

- 单个文件：替换其所在的对象。
- 文件数组：按顺序深度合并（后面的覆盖前面的）。
- 同级键：在包含操作之后合并（覆盖包含的值）。
- 嵌套包含：最多支持 10 层。
- 路径：相对于执行包含操作的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。仅当绝对路径或 `../` 形式解析后仍位于该边界内时，才允许使用。设置 `OPENCLAW_INCLUDE_ROOTS`（绝对路径）可允许配置目录之外的其他根目录。
- 限制：路径不得包含空字节，并且解析前后的长度都必须严格小于 4096 个字符；每个包含文件的大小上限为 2 MB。
- 如果 OpenClaw 发起的写入仅更改由单文件包含支持的一个顶层部分，则会直接写入该包含文件。例如，`plugins install` 会在 `plugins.json5` 中更新 `plugins: { $include: "./plugins.json5" }`，并保持 `openclaw.json` 不变。
- 对于 OpenClaw 发起的写入，根包含、包含数组以及带有同级覆盖项的包含均为只读；这些写入会以失败关闭方式终止，而不会扁平化配置。
- 错误：针对文件缺失、解析错误、循环包含、无效路径格式和长度过长提供清晰的消息。

---

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)
- [Doctor](/zh-CN/gateway/doctor)

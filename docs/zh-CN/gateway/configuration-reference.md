---
read_when:
    - 你需要确切的字段级配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: 核心 OpenClaw 键、默认值以及专用子系统参考链接的 Gateway 配置参考
title: 配置参考
x-i18n:
    generated_at: "2026-07-12T21:23:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f0388cacfc5eb2b33f7a55775e4c7d289e0955409fc9b1e3f84199371fe4d1c4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

`~/.openclaw/openclaw.json` 的字段级参考：键、默认值，以及指向更深入子系统页面的链接。有关面向任务的设置指南，请参阅[配置](/zh-CN/gateway/configuration)。由渠道和插件负责的命令目录以及深层记忆/QMD 调节项位于各自的页面中，而不在此处。

配置格式为 **JSON5**（允许注释和尾随逗号）。所有字段均为可选；省略时，OpenClaw 会使用安全的默认值。

代码事实优先于本页面：

- `openclaw config schema` 输出用于验证和 Control UI 的实时 JSON Schema，其中已合并内置组件、插件和渠道的元数据。
- 编辑配置前，智能体应调用 `gateway` 工具操作 `config.schema.lookup`，查询一个精确的、限定路径的 schema 节点。
- `pnpm config:docs:check` / `pnpm config:docs:gen` 根据当前 schema 表面验证本文档的基线哈希。

专门的深入参考：

- [记忆配置参考](/zh-CN/reference/memory-config)：涵盖 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置。
- [斜杠命令](/zh-CN/tools/slash-commands)：涵盖当前的内置命令和随附命令目录。
- 有关渠道特定的命令表面，请参阅对应渠道/插件的页面。

---

## 渠道

各渠道的配置键位于[配置 - 渠道](/zh-CN/gateway/config-channels)：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 及其他内置渠道使用 `channels.*`（身份验证、访问控制、多账户、提及限制）。

## Agent 默认设置、多 Agent、会话和消息

请参阅[配置 - 智能体](/zh-CN/gateway/config-agents)，了解：

- `agents.defaults.*`（工作区、模型、思考、Heartbeat、记忆、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、剪枝）
- `messages.*`（消息传递、TTS、Markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.consultThinkingLevel`：覆盖 Control UI Talk 实时咨询背后完整 OpenClaw 智能体运行的思考级别
  - `talk.consultFastMode`：Control UI 中 Talk 实时咨询的一次性快速模式覆盖
  - `talk.speechLocale`：用于 iOS/macOS 上 Talk 语音识别的可选 BCP 47 区域设置 ID
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保留平台默认的暂停时间窗口（`700 ms on macOS and Android, 900 ms on iOS`）
  - `talk.realtime.consultRouting`：用于跳过 `openclaw_agent_consult` 的已完成 Talk 实时转录文本的 Gateway 网关中继回退方案

## 工具和自定义提供商

工具策略、实验性开关、由提供商支持的工具配置，以及自定义
提供商 / 基础 URL 设置，请参阅
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools)。

## Models

提供商定义、模型允许列表和自定义提供商设置位于
[配置 - 工具和自定义提供商](/zh-CN/gateway/config-tools#custom-providers-and-base-urls)。
`models` 根配置还负责全局模型目录行为。

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
- `models.providers.*.localService`：本地模型服务器的可选按需进程管理器。OpenClaw 会探测已配置的健康检查端点，在需要时启动绝对路径 `command`，等待服务就绪，然后发送模型请求。请参阅[本地模型服务](/zh-CN/gateway/local-model-services)。
- `models.pricing.enabled`：控制在边车进程和渠道进入 Gateway 网关就绪路径后启动的后台定价引导。当设为 `false` 时，Gateway 网关会跳过获取 OpenRouter 和 LiteLLM 定价目录；已配置的 `models.providers.*.models[].cost` 值仍可用于本地成本估算。

## MCP

OpenClaw 管理的 MCP 服务器定义位于 `mcp.servers` 下，供嵌入式 OpenClaw 和其他运行时适配器使用。`openclaw mcp list`、`show`、`set` 和 `unset` 命令可以管理此配置块，且在编辑配置时不会连接目标服务器。

```json5
{
  mcp: {
    // 可选。默认值：600000 ms（10 分钟）。设为 0 可禁用空闲逐出。
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

- `mcp.servers`：具名的 stdio 或远程 MCP 服务器定义，供暴露已配置 MCP 工具的运行时使用。远程条目使用 `transport: "streamable-http"` 或 `transport: "sse"`；`type: "http"` 是 CLI 原生别名，`openclaw mcp set` 和 `openclaw doctor --fix` 会将其规范化为标准 `transport` 字段。
- `mcp.servers.<name>.enabled`：设为 `false` 可保留已保存的服务器定义，同时将其排除在嵌入式 OpenClaw MCP 设备发现和工具投影之外。
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`：每个服务器的 MCP 请求超时时间，以秒或毫秒为单位。
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`：每个服务器的连接超时时间，以秒或毫秒为单位。
- `mcp.servers.<name>.supportsParallelToolCalls`：可选的并发提示，供能够选择是否并行发起 MCP 工具调用的适配器使用。
- `mcp.servers.<name>.auth`：对于需要 OAuth 的 HTTP MCP 服务器，设为 `"oauth"`。运行 `openclaw mcp login <name>` 可将令牌存储在 OpenClaw 状态中。
- `mcp.servers.<name>.oauth`：可选的 OAuth 权限范围、重定向 URL 和客户端元数据 URL 覆盖项。
- `mcp.servers.<name>.sslVerify`、`clientCert`、`clientKey`：用于私有端点和双向 TLS 的 HTTP TLS 控制项。
- `mcp.servers.<name>.toolFilter`：可选的按服务器工具选择配置。`include` 将发现到的 MCP 工具限制为名称匹配的工具；`exclude` 隐藏名称匹配的工具。条目可以是确切的 MCP 工具名称，也可以是简单的 `*` glob。具有资源或提示词的服务器还会生成实用工具名称（`resources_list`、`resources_read`、`prompts_list`、`prompts_get`），这些名称使用相同的过滤器。
- `mcp.servers.<name>.codex`：可选的 Codex app-server 投影控制。此配置块仅是用于 Codex app-server 线程的 OpenClaw 元数据；它不会影响 ACP 会话、通用 Codex harness 配置或其他运行时适配器。非空的 `codex.agents` 会将服务器限制为列出的 OpenClaw 智能体 ID。为空、空白或无效的限定范围智能体列表会被配置验证拒绝，并由运行时投影路径省略，而不会变为全局配置。`codex.defaultToolsApprovalMode` 会为该服务器生成 Codex 原生的 `default_tools_approval_mode`。OpenClaw 在将原生 `mcp_servers` 配置传递给 Codex 之前，会移除 `codex` 配置块。省略此配置块可继续将服务器投影到每个 Codex app-server 智能体，并使用 Codex 的默认 MCP 审批行为。
- `mcp.sessionIdleTtlMs`：会话范围内置 MCP 运行时的空闲 TTL。一次性嵌入式运行会请求在运行结束时清理；此 TTL 是长期会话和未来调用方的兜底机制。
- `mcp.*` 下的更改会通过释放缓存的会话 MCP 运行时来热应用。下一次发现或使用工具时，会根据新配置重新创建这些运行时，因此已移除的 `mcp.servers` 条目会立即清除，而不必等待空闲 TTL。
- 运行时设备发现还会响应 MCP 工具列表变更通知，丢弃该会话的缓存目录。声明资源或提示词的服务器会获得用于列出/读取资源以及列出/获取提示词的实用工具。工具调用连续失败时，受影响的服务器会短暂暂停，然后再尝试下一次调用。

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

- `allowBundled`：仅用于内置技能的可选允许列表（不影响托管技能/工作区技能）。
- `load.extraDirs`：额外的共享技能根目录（优先级最低）。
- `load.allowSymlinkTargets`：当技能符号链接位于其已配置源根目录之外时，允许该链接解析到的可信真实目标根目录。
- `workshop.allowSymlinkTargetWrites`：允许 Skill Workshop 应用操作透过已受信任的符号链接写入目标（默认值：false）。
- `install.preferBrew`：设为 true 时，如果 `brew` 可用，则优先使用 Homebrew 安装程序，再回退到其他类型的安装程序。
- `install.nodeManager`：`metadata.openclaw.install` 规范的 Node 安装程序偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `install.allowUploadedArchives`：允许可信的 `operator.admin` Gateway 网关客户端安装通过 `skills.upload.*` 暂存的私有 zip 归档（默认值：false）。这只会启用上传归档路径；正常的 ClawHub 安装不需要此设置。
- `entries.<skillKey>.enabled: false`：即使技能已内置或安装，也将其禁用。
- `entries.<skillKey>.apiKey`：为声明主要环境变量的技能提供的便捷配置（明文字符串或 SecretRef 对象）。
- `limits.maxCandidatesPerRoot`、`limits.maxSkillsLoadedPerSource`、`limits.maxSkillsInPrompt`、`limits.maxSkillsPromptChars`、`limits.maxSkillFileBytes`：限制技能发现和面向模型的 Skills 提示词。
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

- 从 `~/.openclaw/extensions` 和 `<workspace>/.openclaw/extensions` 下的软件包或捆绑包目录，以及 `plugins.load.paths` 中列出的文件或目录加载。
- 将独立插件文件放入 `plugins.load.paths`；自动发现的扩展根目录会忽略顶层 `.js`、`.mjs` 和 `.ts` 文件，因此这些根目录中的辅助脚本不会阻止启动。
- 设备发现支持原生 OpenClaw 插件以及兼容的 Codex 捆绑包和 Claude 捆绑包，包括没有清单且采用 Claude 默认布局的捆绑包。
- **配置更改需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API key 便捷字段（插件支持时）。
- `plugins.entries.<id>.env`：插件作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中修改提示词的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件钩子和受支持的捆绑包所提供的钩子目录。
- `plugins.entries.<id>.hooks.allowConversationAccess`：为 `true` 时，受信任的非内置插件可以从 `llm_input`、`llm_output`、`before_model_resolve`、`before_agent_reply`、`before_agent_run`、`before_agent_finalize` 和 `agent_end` 等类型化钩子中读取原始对话内容。
- `plugins.entries.<id>.subagent.allowModelOverride`：明确允许信任此插件为后台子智能体运行请求单次运行的 `provider` 和 `model` 覆盖。
- `plugins.entries.<id>.subagent.allowedModels`：受信任子智能体覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅在你明确希望允许任意模型时使用 `"*"`。
- `plugins.entries.<id>.llm.allowModelOverride`：明确允许信任此插件为 `api.runtime.llm.complete` 请求模型覆盖。
- `plugins.entries.<id>.llm.allowedModels`：受信任插件的 LLM 补全覆盖可使用的规范 `provider/model` 目标的可选允许列表。仅在你明确希望允许任意模型时使用 `"*"`。
- `plugins.entries.<id>.llm.allowAgentIdOverride`：明确允许信任此插件针对非默认智能体 ID 运行 `api.runtime.llm.complete`。
- `plugins.entries.<id>.config`：插件定义的配置对象（可用时由原生 OpenClaw 插件架构验证）。
- 渠道插件的账户和运行时设置位于 `channels.<id>` 下，应由所属插件清单中的 `channelConfigs` 元数据描述，而不是由 OpenClaw 中央选项注册表描述。

### Codex harness 插件配置

内置 `codex` 插件在
`plugins.entries.codex.config` 下拥有原生 Codex app-server harness 设置。完整配置
表面请参阅 [Codex harness reference](/zh-CN/plugins/codex-harness-reference)，运行时模型请参阅
[Codex harness](/zh-CN/plugins/codex-harness)。

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
- `plugins.entries.codex.config.codexPlugins.allow_all_plugins`：在
  每个新的原生 Codex 线程中公开当前已连接到已认证 Codex 账户的所有可访问应用。默认值：`false`。
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`：
  已配置插件应用请求的默认破坏性操作策略。
  使用 `true` 可在不提示的情况下接受安全的 Codex 审批架构，使用 `false`
  可拒绝这些请求，使用 `"auto"` 可通过 OpenClaw
  插件审批路由 Codex 要求的审批，使用 `"ask"` 则会针对每个插件写入/破坏性
  操作进行提示，且不提供持久审批。`"ask"` 模式会清除受影响应用的持久 Codex
  单工具审批覆盖，并在 Codex 线程启动前为该应用选择人工
  审批审核者。
  默认值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`：当全局
  `codexPlugins.enabled` 也为 true 时，启用已配置的插件条目。
  显式条目的默认值：`true`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`：
  稳定的市场身份标识，每个已解析条目都必须与 `pluginName` 一起提供。
  支持 `"openai-curated"` 和 `"workspace-directory"`。缺少任一
  身份字段的条目都会被忽略。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`：稳定的
  Codex 插件身份标识，必须与 `marketplaceName` 一起提供。
  `workspace-directory` 条目必须使用 `plugin/list` 返回的、带有准确市场限定符的
  `summary.id`，例如
  `"example-plugin@workspace-directory"`。
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`：
  每插件破坏性操作覆盖。省略时，使用全局
  `allow_destructive_actions` 值。每插件值接受相同的
  `true`、`false`、`"auto"` 或 `"ask"` 策略。

每个获准且使用 `"ask"` 的插件应用都会将该应用的审批请求
路由给人工审核者。其他应用和非应用线程审批会保留其
已配置的审核者，因此混合插件策略不会继承 `"ask"` 行为。

`codexPlugins.enabled` 是全局启用指令。迁移写入的显式插件
条目构成持久的精选安装和修复
资格集合。手动配置的 `workspace-directory` 条目必须已经
安装并启用，且其所属应用必须可访问；OpenClaw
不会安装这些条目或为其进行身份验证。如果 Codex 拒绝显式工作区
目录请求，已启用的工作区条目会以
`marketplace_missing` 失败关闭，而默认目录中的精选条目仍然
可用。不支持 `plugins["*"]`，没有 `install` 开关，并且
本地 `marketplacePath` 值有意不设为配置字段，因为它们
取决于主机。有关 app-server 版本和
就绪要求，请参阅 [Native Codex plugins](/zh-CN/plugins/codex-native-plugins)。

`app/list` 就绪检查会缓存一小时，并在过期时
异步刷新。Codex 线程应用配置在建立 Codex harness
会话时计算，而不是每轮都计算；更改原生插件配置后，请使用 `/new`、`/reset` 或重启 Gateway 网关。

`codexPlugins.allow_all_plugins` 会将当前可访问的所有账户
应用快照到每个新的原生 Codex 线程中。它不会安装插件或应用，
不可访问的应用仍会被排除。账户应用使用全局
`codexPlugins.allow_destructive_actions` 策略。同一应用同时存在于两种路径中时，
显式插件条目优先。如果无法读取 `app/list`，
账户范围公开会失败关闭。

- `plugins.entries.firecrawl.config.webFetch`：Firecrawl 网页抓取提供商设置。
  - `apiKey`：用于提高限额的可选 Firecrawl API key（接受 SecretRef）。回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认值：`https://api.firecrawl.dev`；自托管覆盖必须指向私有/内部端点）。
  - `onlyMainContent`：仅从页面提取主要内容（默认值：`true`）。
  - `maxAgeMs`：缓存最长有效期，以毫秒为单位（默认值：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时时间，以秒为单位（默认值：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X Search（Grok Web 搜索）设置。
  - `enabled`：启用 X Search 提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4.3"`）。
- `plugins.entries.memory-core.config.dreaming`：记忆梦境设置。有关阶段和阈值，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：梦境总开关（默认值为 `false`）。
  - `frequency`：每次完整梦境扫描的 cron 周期（默认为 `"0 3 * * *"`）。
  - `model`：可选的梦境日记子智能体模型覆盖。需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`；请与 `allowedModels` 配合使用以限制目标。模型不可用错误会使用会话默认模型重试一次；信任或允许列表失败不会静默回退。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整的记忆配置位于 [记忆配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude 捆绑插件还可以从 `settings.json` 提供嵌入式 OpenClaw 默认值；OpenClaw 会将其作为经过清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁。
- `plugins.slots.memory`：选择活动记忆插件 ID，或使用 `"none"` 禁用记忆插件。
- `plugins.slots.contextEngine`：选择活动上下文引擎插件 ID；除非你安装并选择其他引擎，否则默认为 `"legacy"`。

请参阅[插件](/zh-CN/tools/plugin)。

---

## 跟进承诺

`commitments` 控制推断式跟进记忆：OpenClaw 可以从对话轮次中检测后续检查事项，并通过 Heartbeat 运行交付这些事项。

- `commitments.enabled`：为推断式跟进承诺启用隐藏的 LLM 提取、存储和 Heartbeat 交付。默认值：`false`。
- `commitments.maxPerDay`：滚动一天内，每个智能体会话最多交付的推断式跟进承诺数。默认值：`3`。

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
      // dangerouslyAllowPrivateNetwork: true, // 仅在访问受信任的私有网络时选择启用
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
- `tabCleanup` 会在跟踪的主智能体标签页闲置一段时间后，或会话超过其上限时回收这些标签页。将 `idleMinutes: 0` 或 `maxTabsPerSession: 0` 设置为 0 可分别禁用对应的清理模式。
- 未设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork` 时，该选项处于禁用状态，因此浏览器导航默认保持严格模式。
- 仅当你明确信任私有网络浏览器导航时，才应设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置文件端点（`profiles.*.cdpUrl`）在可达性/发现检查期间受相同的私有网络阻止规则约束。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受到支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 设置明确的例外。
- 远程配置文件仅支持附加（启动/停止/重置已禁用）。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。
  如果你希望 OpenClaw 发现 `/json/version`，请使用 HTTP(S)；如果提供商直接为你提供 DevTools WebSocket URL，请使用 WS(S)。
- `remoteCdpTimeoutMs` 和 `remoteCdpHandshakeTimeoutMs` 适用于远程及
  `attachOnly` CDP 可达性检查和标签页打开请求。托管的回环
  配置文件继续使用本地 CDP 默认值。持久化远程 Playwright 标签页
  枚举使用较大的值作为操作截止时间。
- 如果可以通过回环访问外部托管的 CDP 服务，请将该
  配置文件的 `attachOnly: true`；否则 OpenClaw 会将该回环端口视为
  本地托管浏览器配置文件，并可能报告本地端口所有权错误。
- `existing-session` 配置文件使用 Chrome MCP 而非 CDP，并且可以在
  所选主机上或通过已连接的浏览器节点附加。
- `existing-session` 配置文件可以设置 `userDataDir`，以指定特定的
  Chromium 系浏览器配置文件，例如 Brave 或 Edge。
- 当 Chrome 已在 DevTools HTTP(S) 发现端点或直接 WS(S) 端点后运行时，
  `existing-session` 配置文件可以设置 `cdpUrl`。在该
  模式下，OpenClaw 会将端点传递给 Chrome MCP，而不是使用自动连接；
  Chrome MCP 启动参数会忽略 `userDataDir`。
- `existing-session` 配置文件继续遵循当前 Chrome MCP 路由限制：
  使用快照/引用驱动的操作，而非 CSS 选择器定位；单文件上传
  钩子；不支持对话框超时覆盖；不支持 `wait --load networkidle`；也不支持
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置文件会自动分配 `cdpPort` 和 `cdpUrl`；仅对
  远程 CDP 配置文件或 existing-session 端点
  附加显式设置 `cdpUrl`。
- 本地托管配置文件可以设置 `executablePath`，以覆盖该配置文件的全局
  `browser.executablePath`。可使用此选项让一个配置文件运行
  Chrome，另一个运行 Brave。
- 本地托管配置文件使用 `browser.localLaunchTimeoutMs` 等待进程启动后的 Chrome CDP HTTP
  发现，并使用 `browser.localCdpReadyTimeoutMs` 等待
  启动后的 CDP websocket 就绪状态。在较慢的主机上，如果 Chrome
  成功启动但就绪检查与启动过程发生竞争，请增大这些值。这两个值必须是
  不超过 `120000` ms 的正整数；无效的配置值会被拒绝。
- 自动检测顺序：基于 Chromium 的默认浏览器 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- `browser.executablePath` 和 `browser.profiles.<name>.executablePath` 都
  接受 `~` 和 `~/...`，在启动 Chromium 前将其解析为你的操作系统主目录。
  `existing-session` 配置文件中按配置文件设置的 `userDataDir` 也会展开波浪号。
- 控制服务：仅限回环（端口由 `gateway.port` 派生，默认为 `18791`）。
- `extraArgs` 会向本地 Chromium 启动过程追加额外的启动标志（例如
  `--disable-gpu`、窗口尺寸或调试标志）。

---

## UI

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
      mode: "token", // 无 | 令牌 | 密码 | 可信代理
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
      mode: "off", // 关闭 | 服务 | 隧道
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // toolTitles: false, // 选择启用为工具调用生成 AI 用途标题（会消耗实用模型令牌）
      // embedSandbox: "scripts", // 严格 | 脚本 | 可信
      // allowExternalEmbedUrls: false, // 危险：允许绝对外部 http(s) 嵌入 URL
      // chatMessageMaxWidth: "min(1280px, 82%)", // 可选的居中聊天记录最大宽度
      // allowedOrigins: ["https://control.example.com"], // 非回环 Control UI 必须设置
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
      transport: "ssh", // ssh | 直接
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
        // 设置为 false 仅禁用 SSH 验证；这不会影响
        // 上面的 autoApproveCidrs。若要仅手动进行节点配对，请设置为 false 并且
        // 不设置 autoApproveCidrs。可传入对象进行调整：{ user, identity,
        // timeoutMs, cidrs }。
        sshVerify: true,
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // 其他 /tools/invoke HTTP 拒绝项
      deny: ["browser"],
      // 为所有者/管理员调用方从默认 HTTP 拒绝列表中移除工具
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

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非设为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：WS + HTTP 共用的单一多路复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（可用时使用 Tailscale IPv4，否则使用环回地址）或 `custom`（一个 IPv4 地址）。解析出的 `tailnet` 地址，以及除 `127.0.0.1` 或 `0.0.0.0` 之外的任何 `custom` 地址，都要求在同一端口上监听 `127.0.0.1`，以供同一主机上的客户端使用；任一监听器无法绑定时，启动都会失败。非环回暴露仍仅限于所选接口。
- **旧版绑定别名**：在 `gateway.bind` 中使用绑定模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而不是主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` 绑定会在容器内监听 `127.0.0.1`。使用 Docker 网桥网络（`-p 18789:18789`）时，流量通过 `eth0` 到达，因此无法访问 Gateway 网关。请使用 `--network host`，或设置 `bind: "lan"`（或将 `bind: "custom"` 与 `customBindHost: "0.0.0.0"` 搭配使用），以监听所有接口。
- **身份验证**：默认必需。非环回绑定需要 Gateway 网关身份验证。实际上，这意味着需要共享令牌/密码，或使用 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。新手引导向导默认生成令牌。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请将 `gateway.auth.mode` 显式设置为 `token` 或 `password`。如果二者均已配置但未设置模式，启动以及服务安装/修复流程都会失败。
- `gateway.auth.mode: "none"`：显式无身份验证模式。仅用于受信任的本地环回设置；新手引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将浏览器/用户身份验证委托给身份感知型反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）。此模式默认要求代理来源为**非环回地址**；同一主机上的环回反向代理需要显式设置 `gateway.auth.trustedProxy.allowLoopback = true`。同一主机上的内部调用方可以使用 `gateway.auth.password` 作为本地直接回退；`gateway.auth.token` 与受信任代理模式仍然互斥。
- `gateway.auth.allowTailscale`：设为 `true` 时，Tailscale Serve 身份标头可以满足 Control UI/WebSocket 身份验证要求（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 标头进行身份验证；它们仍遵循 Gateway 网关的常规 HTTP 身份验证模式。此无令牌流程假定 Gateway 网关主机可信。当 `tailscale.mode = "serve"` 时，默认为 `true`。
- `gateway.auth.rateLimit`：可选的身份验证失败限速器。按客户端 IP 和身份验证范围应用（共享密钥与设备令牌分别跟踪）。被阻止的尝试返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径中，来自同一 `{scope, clientIp}` 的失败尝试会在写入失败记录前串行处理。因此，来自同一客户端的并发错误尝试可能在第二个请求时触发限速器，而不是两个请求都因竞态而仅作为普通不匹配通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；如果你有意也要对 localhost 流量进行限速（用于测试设置或严格代理部署），请设为 `false`。
- 来自浏览器源的 WS 身份验证尝试始终会受到限速，并禁用环回豁免（纵深防御浏览器发起的 localhost 暴力破解）。
- 在环回地址上，这些来自浏览器源的锁定会按规范化后的 `Origin`
  值相互隔离，因此来自一个 localhost 源的重复失败不会自动
  锁定其他源。
- `tailscale.mode`：`serve`（仅 tailnet，环回绑定）或 `funnel`（公开，需要身份验证）。
- `tailscale.serviceName`：Serve 模式下可选的 Tailscale Service 名称，例如
  `svc:openclaw`。设置后，OpenClaw 会将其传递给 `tailscale serve
--service`，这样便可通过命名 Service 暴露 Control UI，而不是
  使用设备主机名。该值必须采用 Tailscale 的 `svc:<dns-label>`
  Service 名称格式；启动时会报告派生出的 Service URL。
- `tailscale.preserveFunnel`：当设为 `true` 且 `tailscale.mode = "serve"` 时，OpenClaw
  会在启动时重新应用 Serve 之前检查 `tailscale funnel status`，如果
  外部配置的 Funnel 路由已覆盖 Gateway 网关端口，则跳过重新应用。
  默认为 `false`。
- `controlUi.allowedOrigins`：允许连接 Gateway 网关 WebSocket 的显式浏览器源允许列表。公开的非环回浏览器源必须配置此项。对于从环回地址、RFC1918/链路本地地址、`.local`、`.ts.net` 或 Tailscale CGNAT 主机加载的私有同源 LAN/Tailnet UI，无需启用 Host 标头回退即可接受。
- `controlUi.toolTitles`：选择启用由 AI 为 Control UI 聊天中的工具调用生成用途标题。默认值：`false`（工具渲染保持完全确定性，不会在后台调用模型）。启用后，`chat.toolTitles` 方法会通过标准实用模型路由为复杂调用添加标签——使用智能体的 `utilityModel`（这是一项操作员决策，与所有实用任务一样，可能会将有限的工具参数发送给所选提供商），或会话提供商声明的默认小模型（OpenAI → `gpt-5.6-luna`，Anthropic → `claude-haiku-4-5`）——并将结果缓存在每个智能体的状态数据库中，因此重复查看绝不会再次计费。与其他所有实用任务一样，`utilityModel: \"\"` 会禁用标题；标题绝不会回退到主模型。
- `controlUi.chatMessageMaxWidth`：居中显示的 Control UI 聊天记录的可选最大宽度。接受受限的 CSS 宽度值，例如 `960px`、`82%`、`min(1280px, 82%)` 和 `calc(100% - 2rem)`。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host 标头源策略的部署启用 Host 标头源回退。
- `terminal.enabled`：选择启用仅限管理员范围的操作员终端。默认值：`false`。终端会在所选 Agent 工作区中启动主机 PTY，继承 Gateway 网关进程环境，并拒绝为配置了 `sandbox.mode: "all"` 的智能体启动。仅在受信任的操作员部署中启用；更改此项会重启 Gateway 网关并更新 Control UI 内容安全策略。
- `terminal.shell`：可选的 shell 可执行文件。未设置时，OpenClaw 在 Unix 上使用 `$SHELL`，在 Windows 上使用 `%ComSpec%`。
- `terminal.detachedSessionTimeoutSeconds`：终端连接断开（页面重新加载、笔记本电脑休眠）后，会话继续存活的时长；在此期间仍可通过 `terminal.attach` 重新连接，并重放最近的输出。默认值：`300`。设为 `0` 可在连接断开时立即终止会话。已分离的会话会继续运行其命令，因此在共享或对外暴露的主机上应缩短此时间。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。使用 `direct` 时，面向公共主机的 `remote.url` 必须为 `wss://`；明文 `ws://` 仅适用于环回地址、LAN、链路本地地址、`.local`、`.ts.net` 和 Tailscale CGNAT 主机。
- `remote.remotePort`：远程 SSH 主机上的 Gateway 网关端口。默认为 `18789`；当本地隧道端口与远程 Gateway 网关端口不同时使用此项。
- `remote.sshHostKeyPolicy`：macOS SSH 隧道的主机密钥策略。`strict` 是默认值，并要求密钥已受信任。`openssh` 表示显式选择对托管别名使用实际生效的 OpenSSH 配置；使用前请检查匹配的用户和系统 SSH 设置。更改目标时，macOS 应用和 `configure-remote` 会将此策略重置为 `strict`，除非再次显式选择启用。
- `gateway.remote.token` / `.password` 是远程客户端凭据字段。它们本身不会配置 Gateway 网关身份验证。
- `gateway.push.apns.relay.baseUrl`：外部 APNs 中继的 HTTPS 基础 URL，在由中继支持的 iOS 构建将注册信息发布到 Gateway 网关后使用。公开的 App Store 构建使用托管的 OpenClaw 中继。自定义中继 URL 必须与有意独立设置的 iOS 构建/部署路径匹配，且该路径的中继 URL 指向相应中继。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到中继的发送超时时间，以毫秒为单位。默认为 `10000`。
- 由中继支持的注册会委托给特定的 Gateway 网关身份。已配对的 iOS 应用会获取 `gateway.identity.get`，在中继注册中包含该身份，并将限定于此次注册的发送授权转发给 Gateway 网关。其他 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：用于覆盖上述中继配置的临时环境变量。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅限开发环境的应急选项，用于允许环回 HTTP 中继 URL。生产中继 URL 应始终使用 HTTPS。
- `gateway.handshakeTimeoutMs`：身份验证前的 Gateway 网关 WebSocket 握手超时时间，以毫秒为单位。默认值：`15000`。设置 `OPENCLAW_HANDSHAKE_TIMEOUT_MS` 后，其优先级更高。在负载较高或性能较低的主机上，如果本地客户端能在启动预热尚未完全稳定时建立连接，请增大此值。
- `gateway.channelHealthCheckMinutes`：渠道健康监控器的检查间隔，以分钟为单位。设为 `0` 可全局禁用健康监控器重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：过期套接字阈值，以分钟为单位。此值应大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个渠道/账号在滚动一小时内允许的健康监控器最大重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：按渠道选择退出健康监控器重启，同时保持全局监控器启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖项。设置后，其优先级高于渠道级覆盖项。
- 仅当未设置 `gateway.auth.*` 时，本地 Gateway 网关调用路径才能使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 但无法解析，则解析会以失败关闭方式终止（不会通过远程回退掩盖问题）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。仅列出你控制的代理。环回条目对于同一主机上的代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**使环回请求符合 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`：设为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认值为 `false`，以保持失败关闭行为。
- `gateway.nodes.pairing.autoApproveCidrs`：可选的 CIDR/IP 允许列表，用于自动批准首次进行且未请求任何权限范围的节点设备配对。未设置时禁用。此项不会自动批准操作员/浏览器/Control UI/WebChat 配对，也不会自动批准角色、权限范围、元数据或公钥升级。
- `gateway.nodes.pairing.sshVerify`：通过 SSH 验证后自动批准首次节点设备配对（默认：启用）。Gateway 网关会通过 SSH 回连配对主机（BatchMode、严格主机密钥），并且仅当 `openclaw node identity` 的设备密钥完全匹配时才批准。适用资格下限与 `autoApproveCidrs` 相同；除非通过 `cidrs` 覆盖，否则探测仅限私有/CGNAT 源地址。设为 `false` 可禁用，或使用 `{ user, identity, timeoutMs, cidrs }` 进行调整。参见[节点配对](/zh-CN/gateway/pairing#ssh-verified-device-auto-approval-default)。
  - `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`：在完成配对和平台允许列表评估后，对声明的节点命令进行全局允许/拒绝控制。使用 `allowCommands` 显式启用危险的节点命令，例如 `camera.snap`、`camera.clip`、`screen.record`、`health.summary`、`sms.search` 和 `sms.send`；即使平台默认设置或显式允许原本会包含某个命令，`denyCommands` 也会将其移除。iOS 健康权限、Android 短信权限和 Gateway 网关命令授权相互独立。节点更改其声明的命令列表后，请拒绝该设备配对并重新批准，使 Gateway 网关存储更新后的命令快照。
  - `gateway.tools.deny`：为 HTTP `POST /tools/invoke` 额外屏蔽的工具名称（扩展默认拒绝列表）。
  - `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称，供
  所有者/管理员调用方使用。这不会将携带身份的 `operator.write`
  调用方升级为所有者/管理员访问权限；即使已加入允许列表，非所有者调用方仍
  无法使用 `cron`、`gateway` 和 `nodes`。

</Accordion>

### OpenAI 兼容端点

- 管理 HTTP RPC：默认关闭，以 `admin-http-rpc` 插件形式提供。启用该插件即可注册 `POST /api/v1/admin/rpc`。请参阅[管理 HTTP RPC](/zh-CN/plugins/admin-http-rpc)。
- Chat Completions：默认禁用。使用 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
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

使用各自独立的端口和状态目录，在一台主机上运行多个 Gateway 网关：

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

- `enabled`：在 Gateway 网关监听器（HTTPS/WSS）上启用 TLS 终止（默认值：`false`）。
- `autoGenerate`：未配置明确文件时，自动生成本地自签名证书/密钥对；仅限本地/开发用途。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；应严格限制权限。
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
  - `"off"`：忽略实时编辑；更改需要明确重启。
  - `"restart"`：配置更改时始终重启 Gateway 网关进程。
  - `"hot"`：在进程内应用更改，无需重启。
  - `"hybrid"`（默认值）：先尝试热重载；必要时回退到重启。
- `debounceMs`：应用配置更改前的防抖时间窗口，以毫秒为单位（非负整数；默认值：`300`）。
- `deferralTimeoutMs`：可选的最大等待时间，以毫秒为单位，用于在强制重启或渠道热重载前等待正在进行的操作。省略时使用默认的有限等待时间（`300000`）；设置为 `0` 时将无限期等待，并定期记录仍有操作待完成的警告。

---

## 云端工作节点环境

云端工作节点需要主动启用。如果缺少 `cloudWorkers`，或者 `profiles` 为空，OpenClaw 不接受创建任何新工作节点。之前创建的持久记录仍会进行协调并保持可见；现有 Gateway 网关/节点投影不变。

每个工作节点提供商都必须从可信的预配输出中返回 SSH `hostKey`，格式必须恰好为 `algorithm base64`，不得包含主机名或注释。引导程序会将该密钥写入隔离的 `known_hosts` 文件，使用 `StrictHostKeyChecking=yes`，并在提供商未提供该密钥时，在建立连接前失败。不存在首次使用时信任的回退机制。

隧道按需设置，而不是预配流程的一部分。启动后，Gateway 网关会通过反向转发，将工作节点本地的 Unix 套接字连接到其 loopback WebSocket 端点。该套接字位于随机分配且仅所有者可访问的远程目录中；与 loopback TCP 端口不同，多用户工作节点上的其他账户无法访问它，也不会与其他环境的端口冲突。仅当隧道所有者仍为当前所有者时，SSH 保活和有上限的重连退避才会运行。停止隧道时，会先阻止重新连接，再关闭 SSH 进程。

控制流量和工作区传输使用不同的 SSH 连接。两者复用同一个已解析身份和隔离的固定 `known_hosts` 文件，但工作区传输不会与长期运行的隧道共享 SSH 连接复用，因此 rsync 不会阻塞控制流量。

### Crabbox 配置文件

内置 `crabbox` 提供商通过本地 Crabbox CLI 预配支持 SSH 的租约。内部的 `settings.provider` 用于选择 Crabbox 后端；它与外层的 OpenClaw 提供商 ID 相互独立。

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

- `settings.provider`（必需）：通过 `--provider` 传递的 Crabbox 后端。应使用其检查输出中包含 SSH 端点的后端；`aws` 选择直接 AWS 后端。
- `settings.class`（必需）：传递给 `--class` 的 Crabbox 机器类别。
- `settings.ttl` 和 `settings.idleTimeout`（必需）：传递给 `--ttl` 和 `--idle-timeout` 的正 Go 时长字符串。这些提供商侧故障保护与下方存储的 OpenClaw `lifetime` 策略彼此独立。
- `settings.binary`：可选的 Crabbox 可执行文件绝对路径。如果未设置，OpenClaw 会依次检查同级 Crabbox 检出目录、`PATH` 中的可执行条目，最后调用 `crabbox`，以便缺失 CLI 时仍显示明确的提供商错误。

未知设置会被拒绝。Crabbox 凭据和后端特定的账户配置仍由 Crabbox 管理；不要将它们放入 `settings`。OpenClaw 只调用本地 CLI，此插件不会发起提供商网络调用。预配始终传递 `--keep=true`；OpenClaw 管理外部生命周期，并使用 `crabbox stop` 销毁租约。

<Warning>
  OpenClaw 通过提供商自有的机密解析器解析 Crabbox 租约本地的 `sshKey` 路径。当前 `crabbox inspect --json` 输出不会公开已预配的 `sshHostKey`，因此 Crabbox 支持的工作节点在引导或隧道设置前仍会以失败关闭方式终止。Crabbox 必须预配权威的每租约主机密钥，并以恰好为 `algorithm base64` 的格式返回 `sshHostKey`，不得包含主机名或注释。其当前租约本地的 `known_hosts` 缓存不能作为预配信任材料。
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

- `profiles`：具名工作节点配置文件，其 ID 必须非空且已去除首尾空白。每个配置文件选择一个由插件注册的提供商。
- `provider`：非空的工作节点提供商 ID。示例使用内置 `crabbox` 提供商和 QA Lab `static-ssh` 提供商。
- `install`：工作节点安装方式。`"bundle"`（默认值）传输 Gateway 网关已安装构建的内容哈希软件包，并支持已发布、开发中和未发布的版本。`"npm"` 是针对未经修改的已打包发行版的主动启用优化；它从公共 npm 注册表安装 `openclaw@<exact gateway version>`，绝不会安装 `latest`。
- 配置后会自动选择内置提供商插件，但明确禁用项和 `plugins.allow` 仍然适用。配置允许列表时，应包含提供商 ID（例如 `crabbox`）。外部提供商插件还必须已安装并明确启用。
- `settings`：由提供商管理的受限 JSON。所选插件定义并验证其键；对包含机密的值使用 [SecretRef 对象](/zh-CN/gateway/secrets)。静态 SSH 提供商要求提供 `host`、`user`、`hostKey` 和 `keyRef`；`port` 默认为 `22`。`hostKey` 必须是从已知主机或其他可信渠道获取的一行 OpenSSH 公共主机密钥（`algorithm base64`），且不得带有选项前缀。
- `lifetime.idleTimeoutMinutes`：为后续空闲回收策略存储的正整数分钟数。
- `lifetime.maxLifetimeMinutes`：为后续生命周期策略存储的正整数分钟数。

工作节点上必须已安装受支持的 Node 运行时（22.19+、23.11+ 或 24+）。主动启用的 `"npm"` 方式还要求安装 `npm`，并能够通过出站 HTTPS 访问公共 npm 注册表。联网工具链设置属于提供商策略；引导程序会报告可操作的错误，而不是自行安装工具链。

此基础设施会安装并验证 Gateway 网关构建，并提供隧道启动/停止生命周期，但不会启动通用 OpenClaw CLI。自包含的工作节点入口和循环将在下一个云端工作节点里程碑中实现。

每条持久环境记录都会在创建时的配置文件快照中保留其已经过验证的提供商设置、已解析的安装方式和生命周期策略。更改或删除具名配置文件会影响新建操作；只要负责该记录的插件仍然可用，现有记录就会继续使用该快照进行生命周期协调。

在首个云端工作节点版本中，生命周期值仅作为数据存储；自动执行将在后续生命周期工作中实现。配置文件更改需要重启 Gateway 网关。

<Warning>
  `static-ssh` 提供商是源代码树中的 QA Lab 开发工具，不包含在打包发行版中。在其共享主机上运行的工作节点可以读取无关的主机数据，因此不要将此提供商用作生产环境的隔离边界。
  其操作员必须提供预期的 `hostKey`；OpenClaw 不会从首次连接中获知或接受密钥。
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
查询字符串中的钩子令牌会被拒绝。

验证和安全注意事项：

- `hooks.enabled=true` 要求 `hooks.token` 非空。
- `hooks.token` 应与当前 Gateway 网关共享密钥身份验证（`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 或 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`）不同；启动时若检测到重复使用，会记录一条非致命安全警告。
- `openclaw security audit` 会将 hook/Gateway 网关身份验证重复使用标记为严重问题，包括仅在审计时提供的 Gateway 网关密码身份验证（`--auth password --password <password>`）。运行 `openclaw doctor --fix` 轮换持久化且重复使用的 `hooks.token`，然后更新外部 hook 发送方以使用新的 hook 令牌。
- `hooks.path` 不能是 `/`；请使用 `/hooks` 等专用子路径。
- 如果 `hooks.allowRequestSessionKey=true`，请限制 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 和 `hooks.allowRequestSessionKey=true`。静态映射键不需要此项选择性启用。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认值：`false`）时，才接受请求载荷中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 模板渲染的映射 `sessionKey` 值被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- `{{messages[0].subject}}` 等模板从载荷中读取数据。
- `transform` 可以指向返回 hook 操作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且必须位于 `hooks.transformsDir` 内（绝对路径和路径遍历会被拒绝）。
  - 请将 `hooks.transformsDir` 保留在 `~/.openclaw/hooks/transforms` 下；工作区 Skills 目录会被拒绝。如果 `openclaw doctor` 报告此路径无效，请将转换模块移入 hook 转换目录，或移除 `hooks.transformsDir`。
- `agentId` 将请求路由到特定智能体；未知 ID 会回退到默认智能体。
- `allowedAgentIds`：限制有效的智能体路由，包括省略 `agentId` 时的默认智能体路径（`*` 或省略 = 全部允许，`[]` = 全部拒绝）。
- `defaultSessionKey`：未显式指定 `sessionKey` 的 hook 智能体运行所使用的可选固定会话键。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认值：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。任何映射或预设使用模板化的 `sessionKey` 时，此项为必填。
- `deliver: true` 将最终回复发送到渠道；`channel` 默认为 `last`。
- `model` 会覆盖此次 hook 运行所使用的 LLM（如果已设置模型目录，则必须允许使用该模型）。

</Accordion>

### Gmail 集成

- 内置 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果保留这种按消息路由的方式，请设置 `hooks.allowRequestSessionKey: true`，并限制 `hooks.allowedSessionKeyPrefixes` 以匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果需要使用 `hooks.allowRequestSessionKey: false`，请用静态 `sessionKey` 覆盖预设，而不要使用模板化默认值。

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

- 配置后，Gateway 网关会在启动时自动运行 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可将其禁用。
- 不要在 Gateway 网关之外同时单独运行 `gog gmail watch serve`。

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

- 通过 Gateway 网关端口下的 HTTP 提供智能体可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认值）。
- 非 local loopback 绑定：canvas 路由与其他 Gateway 网关 HTTP 接口一样，需要 Gateway 网关身份验证（令牌/密码/可信代理）。
- 节点 WebView 通常不会发送身份验证标头；节点完成配对并连接后，Gateway 网关会通告供 canvas/A2UI 访问的节点范围能力 URL。
- 能力 URL 绑定到当前节点 WS 会话，并会很快过期。不使用基于 IP 的回退机制。
- 将实时重载客户端注入所提供的 HTML 中。
- 为空时自动创建初始 `index.html`。
- 还会在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需要重启 Gateway 网关。
- 对于大型目录或出现 `EMFILE` 错误时，请禁用实时重载。

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
- `full`：包含 `cliPath` + `sshPort`；LAN 多播通告仍要求启用内置 `bonjour` 插件。
- `off`：在不更改插件启用状态的情况下禁止 LAN 多播通告。
- 内置 `bonjour` 插件会在 macOS 主机上自动启动；在 Linux、Windows 和容器化 Gateway 网关部署中则需选择性启用。
- 如果系统主机名是有效的 DNS 标签，默认使用该主机名，否则回退到 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 可覆盖此设置。
- `OPENCLAW_DISABLE_BONJOUR=1` 会直接禁用 mDNS 通告，并覆盖 `discovery.mdns.mode`。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。若要实现跨网络设备发现，请配合使用 DNS 服务器（推荐 CoreDNS）和 Tailscale 分流 DNS。

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
- `.env` 文件：CWD 中的 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 有关完整优先级，请参阅[环境](/zh-CN/help/environment)。

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

使用以下对象结构之一：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 AWS 风格的 `secret#json_key` 选择器）
- `source: "exec"` 的 id 不得包含以斜杠分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

### 支持的凭据接口

- 规范矩阵：[SecretRef 凭据接口](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 以受支持的 `openclaw.json` 凭据路径为目标。
- `auth-profiles.json` 引用包含在运行时解析和审计覆盖范围内。

### 密钥提供商配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选的显式环境提供商
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

- `file` 提供商支持 `mode: "json"` 和 `mode: "singleValue"`（在 singleValue 模式下，`id` 必须为 `"value"`）。
- 当 Windows ACL 验证不可用时，文件和 exec 提供商路径会采用失败关闭策略。仅对无法验证的可信路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求 `command` 使用绝对路径，并通过 stdin/stdout 使用协议载荷。
- 默认情况下会拒绝符号链接命令路径。设置 `allowSymlinkCommand: true` 可在验证解析后的目标路径时允许符号链接路径。
- 如果配置了 `trustedDirs`，可信目录检查会应用于解析后的目标路径。
- 默认情况下，`exec` 子进程环境最小化；请通过 `passEnv` 显式传递必需变量。
- 密钥引用会在激活时解析到内存快照中，之后请求路径只读取该快照。
- 激活期间会应用活动接口筛选：已启用接口上未解析的引用会导致启动/重新加载失败，而非活动接口会被跳过并产生诊断信息。

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
- `{ "provider": { "apiKey": "..." } }` 等旧版扁平 `auth-profiles.json` 映射不是运行时格式；`openclaw doctor --fix` 会将其重写为规范的 `provider:default` API 密钥配置文件，并创建 `.legacy-flat.*.bak` 备份。
- OAuth 模式配置文件（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的身份验证配置文件凭据。
- 静态运行时凭据来自内存中的已解析快照；发现旧版静态 `auth.json` 条目时会将其清除。
- 从 `~/.openclaw/credentials/oauth.json` 导入旧版 OAuth 数据。
- 请参阅 [OAuth](/zh-CN/concepts/oauth)。
- 密钥运行时行为和 `audit/configure/apply` 工具：[密钥管理](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：配置文件因确切的计费/余额不足错误而失败时，以小时为单位的基础退避时间（默认值：`5`）。明确的计费文本即使出现在 `401`/`403` 响应中，仍可归入此处，但特定于提供商的文本匹配器仅适用于其所属提供商（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或组织/工作区支出限额消息仍归入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：可选的各提供商计费退避小时数覆盖设置。
- `billingMaxHours`：计费退避指数增长的小时数上限（默认值：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避时间，以分钟为单位（默认值：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟数上限（默认值：`60`）。
- `failureWindowHours`：用于退避计数器的滚动窗口，以小时为单位（默认值：`24`）。
- `overloadedProfileRotations`：遇到过载错误时，在切换到模型回退之前，同一提供商内身份验证配置文件的最大轮换次数（默认值：`1`）。`ModelNotReadyException` 等表示提供商繁忙的错误形式归入此处。
- `overloadedBackoffMs`：重试过载的提供商/配置文件轮换前的固定延迟（默认值：`0`）。
- `rateLimitedProfileRotations`：遇到速率限制错误时，在切换到模型回退之前，同一提供商内身份验证配置文件的最大轮换次数（默认值：`1`）。该速率限制类别包括提供商特有的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

---

## 审计

```json5
{
  audit: {
    enabled: true,
    messages: "off", // 关闭 | 直接对话 | 全部
  },
}
```

Gateway 网关将智能体运行和工具操作的**仅元数据**审计事件记录到共享状态数据库中。消息生命周期元数据需单独选择启用。账本存储身份、时间信息、工具名称和规范化结果，但绝不存储提示词、消息正文、工具参数、结果或原始错误文本。消息行不存储原始的平台账户、对话、消息和目标 ID。运行/工具会话键仍可用于关联，而这些键本身可能包含平台账户或对端 ID。记录会在 30 天后过期，账本上限为 100,000 行。可通过 [`openclaw audit`](/zh-CN/cli/audit) 或 [`audit.activity.list`](/zh-CN/gateway/protocol#audit-ledger-rpc) Gateway 网关 RPC 查询。有关完整数据模型、隐私语义和覆盖范围限制，请参阅[审计历史](/zh-CN/gateway/audit)。

- `enabled`：记录新的审计事件（默认值：`true`）。账本默认开启，因为只有在事件发生后才启用的审计跟踪无法解释该事件。设置为 `false` 后，Gateway 网关重启时将停止插入新事件；现有记录在过期前仍可读取。重新开启后会从该时间点恢复记录，不会回填中断期间的空缺。
- `messages`：消息元数据范围（默认值：`"off"`）。`"direct"` 仅记录已知的直接对话。`"all"` 还会记录群组、频道和未知类型的对话。两种模式都不包含内容，并会在可进行关联时，使用安装环境本地的带密钥假名替换原始标识符。这些标识符用于辅助关联，而非实现匿名化；状态数据库存储派生密钥，但 RPC 和 CLI 导出内容不包含该密钥。

运行中的 Gateway 网关会在启动时读取 `audit.enabled` 和 `audit.messages`；更改任一设置后请重启。目前的消息覆盖范围包括到达核心分派的已接受入站消息，以及每个到达共享持久交付路径的原始逻辑出站回复载荷对应的一条终结记录。绕过这些共享边界的插件本地路径和直接发送路径尚未覆盖。有界后台写入器采用尽力而为方式，并非无损的合规归档。

---

## 日志

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // 美观 | 紧凑 | JSON
    redactSensitive: "tools", // 关闭 | 工具
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 可使用稳定路径。
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：轮换前活动日志文件的最大字节数（正整数；默认值：`104857600` = 100 MB）。OpenClaw 在活动文件旁最多保留五个带编号的归档。
- `redactSensitive` / `redactPatterns`：对控制台输出、文件日志、OTLP 日志记录和持久化会话转录文本进行尽力而为的遮盖。`redactSensitive: "off"` 仅禁用这项通用日志/转录策略；UI、工具和诊断安全界面仍会在输出前遮盖密钥。

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
- `flags`：启用目标日志输出的标志字符串数组（支持 `"telegram.*"` 或 `"*"` 等通配符）。
- `stuckSessionWarnMs`：用于将长时间运行的处理会话分类为 `session.long_running`、`session.stalled` 或 `session.stuck` 的无进展时长阈值，以毫秒为单位（默认值：`120000`）。回复、工具、状态、分块和 ACP 进度会重置计时器；状态不变时，重复的 `session.stuck` 诊断会执行退避。
- `stuckSessionAbortMs`：符合条件的停滞活动任务可通过中止并排空来恢复之前的无进展时长阈值，以毫秒为单位。未设置时，OpenClaw 使用更安全的扩展嵌入式运行窗口，该窗口至少为 5 分钟且为 `stuckSessionWarnMs` 的 3 倍。
- `memoryPressureSnapshot`：当内存压力达到 `critical` 时，捕获经过遮盖的 OOM 前稳定性快照（默认值：`false`）。设置为 `true` 可添加稳定性捆绑包的文件扫描/写入，同时保留常规内存压力事件。
- `otel.enabled`：启用 OpenTelemetry 导出管道（默认值：`false`）。有关完整配置、信号目录和隐私模型，请参阅 [OpenTelemetry 导出](/zh-CN/gateway/opentelemetry)。
- `otel.endpoint`：用于 OTel 导出的收集器 URL。
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`：可选的特定信号 OTLP 端点。设置后，它们仅针对相应信号覆盖 `otel.endpoint`。
- `otel.protocol`：`"http/protobuf"`（默认值）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据标头。
- `otel.serviceName`：资源属性的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用跟踪、指标或日志导出。
- `otel.logsExporter`：日志导出目标：`"otlp"`（默认值）、`"stdout"`（每个标准输出行一个 JSON 对象）或 `"both"`。
- `otel.sampleRate`：跟踪采样率 `0`-`1`。
- `otel.flushIntervalMs`：定期遥测刷新间隔，以毫秒为单位。
- `otel.captureContent`：选择启用 OTEL span 属性的原始内容捕获。默认为关闭。布尔值 `true` 会捕获非系统消息/工具内容；对象形式允许你明确启用 `inputMessages`、`outputMessages`、`toolInputs`、`toolOutputs`、`systemPrompt` 和 `toolDefinitions`。
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`：用于启用最新实验性 GenAI 推理 span 形式的环境变量，包括 `{gen_ai.operation.name} {gen_ai.request.model}` span 名称、`CLIENT` span 类型，以及使用 `gen_ai.provider.name` 代替旧版 `gen_ai.system`。默认情况下，span 保留 `openclaw.model.call` 和 `gen_ai.system` 以保持兼容性；GenAI 指标使用有界语义属性。
- `OPENCLAW_OTEL_PRELOADED=1`：用于已注册全局 OpenTelemetry SDK 的主机的环境变量。此时 OpenClaw 会跳过插件所拥有的 SDK 启动/关闭流程，同时保持诊断监听器处于活动状态。
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`、`OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` 和 `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`：当匹配的配置键未设置时使用的特定信号端点环境变量。
- `cacheTrace.enabled`：记录嵌入式运行的缓存跟踪快照（默认值：`false`）。
- `cacheTrace.filePath`：缓存跟踪 JSONL 的输出路径（默认值：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存跟踪输出中包含的内容（默认值均为 `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // 稳定版 | 扩展稳定版 | 测试版 | 开发版
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

- `channel`：发布渠道——`"stable"`、`"extended-stable"`、`"beta"` 或 `"dev"`。扩展稳定版仅适用于软件包：前台命令负责安装，而 Gateway 网关可发出只读更新提示。
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认值：`true`）。已存储的扩展稳定版选择使用相同的只读提示和 24 小时提示周期。
- `auto.enabled`：为稳定版和测试版软件包安装启用后台自动更新（默认值：`false`）。扩展稳定版永远不会自动应用更新。
- `auto.stableDelayHours`：稳定版渠道自动应用更新前的最小延迟小时数（默认值：`6`；最大值：`168`）。
- `auto.stableJitterHours`：稳定版渠道额外的分批发布时间窗口，以小时为单位（默认值：`12`；最大值：`168`）。
- `auto.betaCheckIntervalHours`：测试版渠道检查的运行频率，以小时为单位（默认值：`1`；最大值：`24`）。稳定版延迟/抖动设置和测试版轮询设置不适用于扩展稳定版。

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

- `enabled`：全局 ACP 功能开关（默认值：`true`；设为 `false` 可隐藏 ACP 分发和生成入口）。
- `dispatch.enabled`：ACP 会话轮次分发的独立开关（默认值：`true`）。设为 `false` 可保留 ACP 命令，同时阻止执行。
- `backend`：默认 ACP 运行时后端 ID（必须与已注册的 ACP 运行时插件匹配）。
  请先安装后端插件；如果设置了 `plugins.allow`，请将后端插件 ID（例如 `acpx`）加入其中，否则 ACP 后端不会加载。
- `fallbacks`：当主后端在生成任何输出之前，因看似暂时性的错误（不可用、受速率限制、配额耗尽或过载）提前失败时，按顺序尝试的备用 ACP 后端 ID 列表。每个条目都必须与已注册的 ACP 运行时插件后端匹配。
- `defaultAgent`：生成时未指定显式目标的情况下使用的备用 ACP 目标智能体 ID。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 ID 允许列表；为空表示不施加额外限制。
- `maxConcurrentSessions`：同时处于活动状态的 ACP 会话数上限。
- `stream.coalesceIdleMs`：流式文本的空闲刷新窗口，单位为 ms。
- `stream.maxChunkChars`：拆分流式块投影前允许的最大分块大小。
- `stream.repeatSuppression`：在每个轮次内抑制重复的状态/工具行（默认值：`true`）。
- `stream.deliveryMode`：`"live"` 以增量方式流式传输；`"final_only"` 缓冲至轮次终止事件。
- `stream.hiddenBoundarySeparator`：隐藏工具事件后、可见文本前使用的分隔符（默认值：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的助手输出字符数上限。
- `stream.maxSessionUpdateChars`：投影的 ACP 状态/更新行的字符数上限。
- `stream.tagVisibility`：标签名称到流式事件布尔可见性覆盖值的映射记录。
- `runtime.ttlMinutes`：ACP 会话工作进程在符合清理条件前的空闲 TTL，单位为分钟。
- `runtime.installCommand`：引导 ACP 运行时环境时可选执行的安装命令。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // 随机 | 默认 | 关闭
    },
  },
}
```

- `cli.banner.taglineMode` 控制横幅标语样式：
  - `"random"`（默认值）：轮换显示幽默/季节性标语。
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

## 身份

请参阅 [Agent 默认设置](/zh-CN/gateway/config-agents#agent-defaults) 下的 `agents.list` 身份字段。

---

## 桥接（旧版，已移除）

当前构建已不再包含 TCP 桥接。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置架构（移除前验证会失败；`openclaw doctor --fix` 可以清除未知键）。

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
    maxConcurrentRuns: 8, // 默认值；cron 分发 + 隔离的 cron 智能体轮次执行
    webhook: "https://example.invalid/legacy", // 已弃用，用于已存储 notify:true 作业的备用项
    webhookToken: "replace-with-dedicated-token", // 用于出站 webhook 身份验证的可选 bearer token
    sessionRetention: "24h", // 时长字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认值 2_000_000 字节
      keepLines: 2000, // 默认值 2000
    },
  },
}
```

- `sessionRetention`：在清理 SQLite 会话行之前，保留已完成的隔离 cron 运行会话的时长。也控制对已归档、已删除 cron 转录的清理。默认值：`24h`；设为 `false` 可禁用。
- `runLog.maxBytes`：为兼容旧版基于文件的 cron 运行日志而接受。默认值：`2_000_000` 字节。
- `runLog.keepLines`：每个作业保留的最新 SQLite 运行历史记录行数。默认值：`2000`。
- `webhookToken`：用于 cron webhook POST 交付（`delivery.mode = "webhook"`）的 bearer token；如果省略，则不会发送身份验证标头。
- `webhook`：已弃用的旧版备用 webhook URL（http/https），由 `openclaw doctor --fix` 用于迁移仍包含 `notify: true` 的已存储作业；运行时交付使用每个作业的 `delivery.mode="webhook"` 与 `delivery.to`，或在保留公告交付时使用 `delivery.completionDestination`。

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

- `maxAttempts`：cron 作业遇到暂时性错误时的最大重试次数（默认值：`3`；范围：`0`-`10`）。
- `backoffMs`：每次重试的退避延迟数组，单位为 ms（默认值：`[30000, 60000, 300000]`；1-10 个条目）。
- `retryOn`：触发重试的错误类型——`"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略则重试所有暂时性类型。

一次性作业在重试次数耗尽前保持启用，之后将禁用，同时保留最终错误状态。重复作业使用相同的暂时性错误重试策略，在下一个计划时段之前经过退避后再次运行；永久性错误或暂时性错误重试耗尽后，会回退到带错误退避的正常重复计划。

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

- `enabled`：为 cron 作业启用失败警报（默认值：`false`）。
- `after`：触发警报前的连续失败次数（正整数，最小值：`1`）。
- `cooldownMs`：同一作业重复警报之间的最小毫秒数（非负整数）。
- `includeSkipped`：将连续跳过的运行计入警报阈值（默认值：`false`）。跳过的运行会单独跟踪，并且不影响执行错误退避。
- `mode`：交付模式——`"announce"` 通过渠道消息发送；`"webhook"` 发布到已配置的 webhook。
- `accountId`：用于限定警报交付范围的可选账户或渠道 ID。

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
- `mode`：`"announce"` 或 `"webhook"`；存在足够的目标数据时，默认为 `"announce"`。
- `channel`：公告交付的渠道覆盖值。`"last"` 会复用上次已知的交付渠道。
- `to`：显式公告目标或 webhook URL。webhook 模式下必填。
- `accountId`：可选的交付账户覆盖值。
- 每个作业的 `delivery.failureDestination` 会覆盖此全局默认值。
- 如果全局和每个作业均未设置失败目标，已通过 `announce` 交付的作业会在失败时回退到该主要公告目标。
- 除非作业的主要 `delivery.mode` 为 `"webhook"`，否则 `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 作业。

请参阅 [Cron 作业](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                                |
| `{{RawBody}}`      | 原始正文（无历史记录/发送者包装）                 |
| `{{BodyStripped}}` | 已移除群组提及的正文                              |
| `{{From}}`         | 发送者标识符                                      |
| `{{To}}`           | 目标标识符                                        |
| `{{MessageSid}}`   | 渠道消息 ID                                       |
| `{{SessionId}}`    | 当前会话 UUID                                     |
| `{{IsNewSession}}` | 创建新会话时为 `"true"`                           |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                    |
| `{{MediaPath}}`    | 本地媒体路径                                      |
| `{{MediaType}}`    | 媒体类型（图像/音频/文档/……）                    |
| `{{Transcript}}`   | 音频转录                                          |
| `{{Prompt}}`       | 为 CLI 条目解析后的媒体提示词                     |
| `{{MaxChars}}`     | 为 CLI 条目解析后的最大输出字符数                 |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群组主题（尽力获取）                              |
| `{{GroupMembers}}` | 群组成员预览（尽力获取）                          |
| `{{SenderName}}`   | 发送者显示名称（尽力获取）                        |
| `{{SenderE164}}`   | 发送者电话号码（尽力获取）                        |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等）      |

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

- 单个文件：替换包含它的对象。
- 文件数组：按顺序深度合并（后面的覆盖前面的）。
- 同级键：在包含操作后合并（覆盖包含的值）。
- 嵌套包含：最多可嵌套 10 层。
- 路径：相对于执行包含操作的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）内。仅当绝对路径/`../` 形式解析后仍位于该边界内时才允许使用。设置 `OPENCLAW_INCLUDE_ROOTS`（绝对路径）可允许配置目录之外的其他根目录。
- 限制：路径不得包含空字节，且解析前后长度都必须严格小于 4096 个字符；每个被包含的文件上限为 2 MB。
- 当 OpenClaw 自有写入操作只更改由单文件包含支持的一个顶层节时，会直接写入该被包含文件。例如，`plugins install` 会更新 `plugins.json5` 中的 `plugins: { $include: "./plugins.json5" }`，并保持 `openclaw.json` 不变。
- 对于 OpenClaw 自有写入操作，根级包含、包含数组以及带同级覆盖的包含均为只读；这些写入操作会以失败关闭方式终止，而不会扁平化配置。
- 错误：针对文件缺失、解析错误、循环包含、无效路径格式和长度超限提供清晰消息。

---

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)
- [Doctor](/zh-CN/gateway/doctor)

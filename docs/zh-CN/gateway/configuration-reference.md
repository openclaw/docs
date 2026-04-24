---
read_when:
    - 你需要精确到字段级别的配置语义或默认值
    - 你正在验证渠道、模型、Gateway 网关或工具配置块
summary: 用于核心 OpenClaw 键、默认值以及专用子系统参考链接的 Gateway 网关配置参考
title: 配置参考
x-i18n:
    generated_at: "2026-04-24T03:39:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b7376da4fcd8f30605040018d76324ae732f5c577fbe46878ec4b81ea6b6c
    source_path: gateway/configuration-reference.md
    workflow: 15
---

`~/.openclaw/openclaw.json` 的核心配置参考。若需面向任务的概览，请参见[配置](/zh-CN/gateway/configuration)。

本页介绍 OpenClaw 的主要配置面，并在某个子系统拥有更深入的独立参考时提供跳转链接。它**不会**尝试在同一页中内联每个渠道/插件拥有的命令目录，也不会内联所有深层 memory/QMD 调节项。

代码事实依据：

- `openclaw config schema` 会打印用于验证和 Control UI 的实时 JSON Schema，并在可用时合并内置/插件/渠道元数据
- `config.schema.lookup` 会返回一个按路径限定的 schema 节点，用于深入查询工具
- `pnpm config:docs:check` / `pnpm config:docs:gen` 会根据当前 schema 表面校验配置文档基线哈希

专门的深度参考：

- [Memory 配置参考](/zh-CN/reference/memory-config)，适用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations`，以及位于 `plugins.entries.memory-core.config.dreaming` 下的 Dreaming 配置
- [Slash Commands](/zh-CN/tools/slash-commands)，适用于当前内置 + 内置插件命令目录
- 各自的渠道/插件页面，适用于特定渠道的命令面

配置格式是 **JSON5**（允许注释和尾随逗号）。所有字段均为可选 —— OpenClaw 在省略时会使用安全默认值。

---

## 渠道

每个渠道的配置键已迁移到独立页面 —— 请参见
[配置 — 渠道](/zh-CN/gateway/config-channels)，其中包括 `channels.*`，
涵盖 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 及其他
内置渠道（身份验证、访问控制、多账号、提及门控）。

## 智能体默认值、多智能体、会话和消息

已迁移到独立页面 —— 请参见
[配置 — 智能体](/zh-CN/gateway/config-agents)，内容包括：

- `agents.defaults.*`（工作区、模型、思考、心跳、memory、媒体、Skills、沙箱）
- `multiAgent.*`（多智能体路由和绑定）
- `session.*`（会话生命周期、压缩、清理）
- `messages.*`（消息投递、TTS、markdown 渲染）
- `talk.*`（Talk 模式）
  - `talk.silenceTimeoutMs`：未设置时，Talk 会在发送转录文本前保持平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）

## 工具

### 工具配置档案

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置一个基础允许列表：

本地新手引导会在未设置时，将新的本地配置默认设为 `tools.profile: "coding"`（已有的显式配置档案会保留）。

| Profile     | Includes                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                             |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                       |
| `full`      | 无限制（与未设置相同）                                                                                                          |

### 工具分组

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名）                                                       |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                           |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                   |
| `group:ui`         | `browser`、`canvas`                                                                                                     |
| `group:automation` | `cron`、`gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`、`image_generate`、`video_generate`、`tts`                                                                      |
| `group:openclaw`   | 所有内置工具（不包括提供商插件）                                                                                        |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会生效。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步限制特定提供商或模型可用的工具。顺序为：基础配置档案 → 提供商配置档案 → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

控制沙箱外的提升权限 `exec` 访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 按智能体覆盖（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 会按会话存储状态；内联指令仅应用于单条消息。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用配置的逃逸路径（默认为 `gateway`，若 exec 目标为 `node`，则使用 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具循环安全检查**默认关闭**。设置 `enabled: true` 可启用检测。
设置可在全局 `tools.loopDetection` 中定义，也可在每个智能体的 `agents.list[].tools.loopDetection` 中覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`：为循环分析保留的最大工具调用历史数。
- `warningThreshold`：用于警告的重复无进展模式阈值。
- `criticalThreshold`：用于阻止严重循环的更高重复阈值。
- `globalCircuitBreakerThreshold`：对任何无进展运行的硬停止阈值。
- `detectors.genericRepeat`：对重复的同工具/同参数调用发出警告。
- `detectors.knownPollNoProgress`：对已知轮询工具（`process.poll`、`command_status` 等）的无进展情况发出警告/阻止。
- `detectors.pingPong`：对交替出现的无进展成对模式发出警告/阻止。
- 如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证会失败。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 可选；省略时自动检测
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

配置入站媒体理解（图片/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 选择启用：将已完成的异步音乐/视频直接发送到渠道
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="媒体模型条目字段">

**提供商条目**（`type: "provider"` 或省略）：

- `provider`：API 提供商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
- `model`：模型 ID 覆盖值
- `profile` / `preferredProfile`：`auth-profiles.json` 配置档案选择

**CLI 条目**（`type: "cli"`）：

- `command`：要运行的可执行文件
- `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等）

**通用字段：**

- `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → image，`google` → image+audio+video，`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：按条目覆盖。
- 失败时会回退到下一个条目。

提供商身份验证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

**异步完成字段：**

- `asyncCompletion.directSend`：当为 `true` 时，已完成的异步 `music_generate`
  和 `video_generate` 任务会优先尝试直接投递到渠道。默认值：`false`
  （旧版的请求者会话唤醒/模型投递路径）。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制会话工具（`sessions_list`、`sessions_history`、`sessions_send`）可定位哪些会话。

默认值：`tree`（当前会话 + 由其派生的会话，例如子智能体）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

说明：

- `self`：仅当前会话键。
- `tree`：当前会话 + 由当前会话派生的会话（子智能体）。
- `agent`：属于当前智能体 ID 的任何会话（如果你在相同智能体 ID 下按发送者运行会话，可能包含其他用户）。
- `all`：任何会话。跨智能体定位仍需要 `tools.agentToAgent`。
- 沙箱收紧：当当前会话处于沙箱隔离状态，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 选择启用：设为 true 以允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件总计 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件 1 MB
        retainOnSessionKeep: false, // 当 cleanup="keep" 时保留附件
      },
    },
  },
}
```

说明：

- 附件仅支持 `runtime: "subagent"`。ACP 运行时会拒绝它们。
- 文件会被具体化到子工作区中的 `.openclaw/attachments/<uuid>/`，并附带一个 `.manifest.json`。
- 附件内容会自动从转录持久化中脱敏。
- Base64 输入会使用严格的字母表/填充检查以及解码前大小保护进行验证。
- 目录权限为 `0700`，文件权限为 `0600`。
- 清理遵循 `cleanup` 策略：`delete` 始终会删除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留附件。

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性内置工具标志。默认关闭，除非适用 strict-agentic GPT-5 自动启用规则。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 启用实验性的 update_plan
    },
  },
}
```

说明：

- `planTool`：为非平凡的多步骤工作跟踪启用结构化的 `update_plan` 工具。
- 默认值：`false`，除非 `agents.defaults.embeddedPi.executionContract`（或按智能体覆盖值）被设置为 `"strict-agentic"`，且当前运行使用 OpenAI 或 OpenAI Codex 的 GPT-5 系列模型。设为 `true` 可在该范围之外强制启用该工具，设为 `false` 则即使在 strict-agentic GPT-5 运行中也保持关闭。
- 启用后，系统提示还会添加使用说明，使模型仅在处理重要工作时使用它，并且最多只保留一个 `in_progress` 步骤。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：生成子智能体时使用的默认模型。若省略，子智能体会继承调用方的模型。
- `allowAgents`：当请求智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 可用目标智能体 ID 的默认允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- `runTimeoutSeconds`：当工具调用未指定 `runTimeoutSeconds` 时，`sessions_spawn` 使用的默认超时（秒）。`0` 表示不超时。
- 按子智能体的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

OpenClaw 使用内置模型目录。可通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 针对自定义身份验证需求，可使用 `authHeader: true` + `headers`。
- 使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录（或使用旧版环境变量别名 `PI_CODING_AGENT_DIR`）。
- 匹配提供商 ID 的合并优先级：
  - 智能体 `models.json` 中非空的 `baseUrl` 值优先。
  - 智能体中非空的 `apiKey` 值仅在当前配置/auth profile 上下文中该提供商不是 SecretRef 管理时优先。
  - 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用使用 `ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`），而不是持久化已解析的密钥。
  - 由 SecretRef 管理的提供商 header 值会从源标记刷新（环境变量引用使用 `secretref-env:ENV_VAR_NAME`，文件/exec 引用使用 `secretref-managed`）。
  - 智能体中为空或缺失的 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
  - 匹配模型的 `contextWindow`/`maxTokens` 会在显式配置值和隐式目录值之间取较高者。
  - 匹配模型的 `contextTokens` 在存在时会保留显式运行时上限；可用它限制有效上下文，而不改变模型原生元数据。
  - 当你希望配置完全重写 `models.json` 时，请使用 `models.mode: "replace"`。
  - 标记持久化以源为准：标记从活动源配置快照（解析前）写入，而不是从已解析的运行时密钥值写入。

### 提供商字段详情

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：按提供商 ID 键控的自定义提供商映射。
  - 安全编辑：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 进行增量更新。若未传入 `--replace`，`config set` 会拒绝破坏性替换。
- `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
- `models.providers.*.apiKey`：提供商凭证（优先使用 SecretRef/环境变量替换）。
- `models.providers.*.auth`：身份验证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，将 `options.num_ctx` 注入请求中（默认：`true`）。
- `models.providers.*.authHeader`：在需要时强制通过 `Authorization` 头传输凭证。
- `models.providers.*.baseUrl`：上游 API 基础 URL。
- `models.providers.*.headers`：用于代理/租户路由的额外静态头。
- `models.providers.*.request`：模型提供商 HTTP 请求的传输层覆盖。
  - `request.headers`：额外头（与提供商默认值合并）。值支持 SecretRef。
  - `request.auth`：身份验证策略覆盖。模式：`"provider-default"`（使用提供商内置身份验证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value` 和可选的 `prefix`）。
  - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。两种模式都支持可选的 `tls` 子对象。
  - `request.tls`：直连的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（均支持 SecretRef）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`：当为 `true` 时，如果 DNS 将 `baseUrl` 解析到私有、CGNAT 或类似地址范围，则允许通过提供商 HTTP 获取保护访问该 `baseUrl` 的 HTTPS（这是面向受信任自托管 OpenAI 兼容端点的运维人员选择启用项）。WebSocket 使用同一个 `request` 处理头/TLS，但不使用该 fetch SSRF 防护门。默认 `false`。
- `models.providers.*.models`：显式的提供商模型目录条目。
- `models.providers.*.models.*.contextWindow`：模型原生上下文窗口元数据。
- `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。当你希望有效上下文预算小于模型原生 `contextWindow` 时，可使用它。
- `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于 `api: "openai-completions"` 且存在非空、非原生 `baseUrl`（主机不是 `api.openai.com`）的情况，OpenClaw 会在运行时强制将其设为 `false`。空或省略的 `baseUrl` 会保留默认的 OpenAI 行为。
- `models.providers.*.models.*.compat.requiresStringContent`：适用于仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。当为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组压平成普通字符串。
- `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
- `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选提供商 ID 过滤器。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新轮询间隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的回退上下文窗口。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的回退最大输出 token 数。

### 提供商示例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7（Cerebras）" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6（Cerebras）" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7（Cerebras）" },
          { id: "zai-glm-4.6", name: "GLM 4.6（Cerebras）" },
        ],
      },
    },
  },
}
```

Cerebras 请使用 `cerebras/zai-glm-4.7`；Z.AI 直连请使用 `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目录请使用 `opencode/...` 引用，Go 目录请使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

设置 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 都是可接受的别名。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

- 通用端点：`https://api.z.ai/api/paas/v4`
- Coding 端点（默认）：`https://api.z.ai/api/coding/paas/v4`
- 对于通用端点，请定义一个带有 `baseUrl` 覆盖的自定义提供商。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

对于中国区端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

原生 Moonshot 端点在共享的
`openai-completions` 传输上声明了流式使用兼容性，而 OpenClaw 会基于端点能力
而不是仅基于内置提供商 ID 来决定相关行为。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

兼容 Anthropic，属于内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（兼容 Anthropic）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

基础 URL 不应包含 `/v1`（Anthropic 客户端会自动追加它）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直连）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

设置 `MINIMAX_API_KEY`。快捷方式：
`openclaw onboard --auth-choice minimax-global-api` 或
`openclaw onboard --auth-choice minimax-cn-api`。
模型目录默认仅包含 M2.7。
在兼容 Anthropic 的流式传输路径上，除非你明确自行设置 `thinking`，
否则 OpenClaw 默认会禁用 MiniMax 的思考模式。`/fast on` 或
`params.fastMode: true` 会将 `MiniMax-M2.7` 重写为
`MiniMax-M2.7-highspeed`。

</Accordion>

<Accordion title="本地模型（LM Studio）">

参见[本地模型](/zh-CN/gateway/local-models)。简而言之：在性能足够强的硬件上通过 LM Studio Responses API 运行大型本地模型；同时保留已合并的托管模型作为回退。

</Accordion>

---

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

- `allowBundled`：仅适用于内置 Skills 的可选允许列表（不影响托管/工作区 Skills）。
- `load.extraDirs`：额外的共享 Skills 根目录（优先级最低）。
- `install.preferBrew`：当为 true 且 `brew` 可用时，优先使用 Homebrew 安装器，然后再回退到其他安装器类型。
- `install.nodeManager`：用于 `metadata.openclaw.install` 规范的 Node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`）。
- `entries.<skillKey>.enabled: false`：即使该 Skill 已内置/已安装，也会将其禁用。
- `entries.<skillKey>.apiKey`：为声明主环境变量的 Skill 提供的便捷 API 密钥字段（明文字符串或 SecretRef 对象）。

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
- **配置变更需要重启 Gateway 网关。**
- `allow`：可选允许列表（仅加载列出的插件）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：插件级 API 密钥便捷字段（在插件支持时可用）。
- `plugins.entries.<id>.env`：插件作用域环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：当为 `false` 时，核心会阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 中会修改提示的字段，同时保留旧版 `modelOverride` 和 `providerOverride`。适用于原生插件 hooks 和受支持的 bundle 提供的 hook 目录。
- `plugins.entries.<id>.subagent.allowModelOverride`：显式信任此插件，以便其为后台子智能体运行请求按次覆盖 `provider` 和 `model`。
- `plugins.entries.<id>.subagent.allowedModels`：受信任的子智能体覆盖可选的规范 `provider/model` 目标允许列表。仅在你确实希望允许任意模型时使用 `"*"`。
- `plugins.entries.<id>.config`：由插件定义的配置对象（在可用时通过原生 OpenClaw 插件 schema 验证）。
- `plugins.entries.firecrawl.config.webFetch`：Firecrawl Web 抓取提供商设置。
  - `apiKey`：Firecrawl API 密钥（支持 SecretRef）。会回退到 `plugins.entries.firecrawl.config.webSearch.apiKey`、旧版 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY` 环境变量。
  - `baseUrl`：Firecrawl API 基础 URL（默认：`https://api.firecrawl.dev`）。
  - `onlyMainContent`：仅提取页面主体内容（默认：`true`）。
  - `maxAgeMs`：最大缓存年龄（毫秒）（默认：`172800000` / 2 天）。
  - `timeoutSeconds`：抓取请求超时秒数（默认：`60`）。
- `plugins.entries.xai.config.xSearch`：xAI X 搜索（Grok Web 搜索）设置。
  - `enabled`：启用 X 搜索提供商。
  - `model`：用于搜索的 Grok 模型（例如 `"grok-4-1-fast"`）。
- `plugins.entries.memory-core.config.dreaming`：memory Dreaming 设置。阶段和阈值请参见 [Dreaming](/zh-CN/concepts/dreaming)。
  - `enabled`：Dreaming 总开关（默认 `false`）。
  - `frequency`：每次完整 Dreaming 扫描的 cron 频率（默认 `"0 3 * * *"`）。
  - 阶段策略和阈值属于实现细节（不是面向用户的配置键）。
- 完整 memory 配置位于[Memory 配置参考](/zh-CN/reference/memory-config)：
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- 已启用的 Claude bundle 插件还可以通过 `settings.json` 提供内嵌的 Pi 默认值；OpenClaw 会将这些值作为已清理的智能体设置应用，而不是作为原始 OpenClaw 配置补丁应用。
- `plugins.slots.memory`：选择活动的 memory 插件 ID，或使用 `"none"` 禁用 memory 插件。
- `plugins.slots.contextEngine`：选择活动的上下文引擎插件 ID；默认值为 `"legacy"`，除非你安装并选择了其他引擎。
- `plugins.installs`：由 CLI 管理的安装元数据，供 `openclaw plugins update` 使用。
  - 包含 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为托管状态；优先使用 CLI 命令，而不是手动编辑。

参见 [Plugins](/zh-CN/tools/plugin)。

---

## 浏览器

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 仅在信任私有网络访问时选择启用
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
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
- 未设置时，`ssrfPolicy.dangerouslyAllowPrivateNetwork` 为禁用状态，因此浏览器导航默认保持严格模式。
- 仅当你明确信任私有网络浏览器导航时，才设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: true`。
- 在严格模式下，远程 CDP 配置档案端点（`profiles.*.cdpUrl`）在可达性/设备发现检查期间也会受到相同的私有网络阻止。
- `ssrfPolicy.allowPrivateNetwork` 仍作为旧版别名受支持。
- 在严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 来配置显式例外。
- 远程配置档案为仅附加模式（禁用启动/停止/重置）。
- `profiles.*.cdpUrl` 支持 `http://`、`https://`、`ws://` 和 `wss://`。
  当你希望 OpenClaw 发现 `/json/version` 时，请使用 HTTP(S)；
  当你的提供商直接提供 DevTools WebSocket URL 时，请使用 WS(S)。
- `existing-session` 配置档案使用 Chrome MCP 而非 CDP，并且可以附加到所选主机或通过已连接的浏览器节点附加。
- `existing-session` 配置档案可设置 `userDataDir`，以定位特定的基于 Chromium 的浏览器配置档案，例如 Brave 或 Edge。
- `existing-session` 配置档案保持当前 Chrome MCP 路由限制：
  使用 snapshot/ref 驱动操作而不是 CSS 选择器定位、单文件上传 hooks、
  不支持对话框超时覆盖、不支持 `wait --load networkidle`，以及不支持
  `responsebody`、PDF 导出、下载拦截或批量操作。
- 本地托管的 `openclaw` 配置档案会自动分配 `cdpPort` 和 `cdpUrl`；仅在远程 CDP 场景中显式设置 `cdpUrl`。
- 自动检测顺序：默认浏览器（如果基于 Chromium）→ Chrome → Brave → Edge → Chromium → Chrome Canary。
- Control 服务：仅 loopback（端口从 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 会向本地 Chromium 启动附加额外的启动标志（例如
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
      // allowedOrigins: ["https://control.example.com"], // 非 loopback Control UI 必需
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的 Host 头来源回退模式
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
    // 可选。默认 false。
    allowRealIpFallback: false,
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

- `mode`：`local`（运行 Gateway 网关）或 `remote`（连接到远程 Gateway 网关）。除非为 `local`，否则 Gateway 网关会拒绝启动。
- `port`：用于 WS + HTTP 的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：请在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），不要使用主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 注意事项**：默认的 `loopback` bind 会在容器内监听 `127.0.0.1`。使用 Docker bridge 网络（`-p 18789:18789`）时，流量会到达 `eth0`，因此 Gateway 网关将无法访问。请使用 `--network host`，或设置 `bind: "lan"`（或 `bind: "custom"` 并配合 `customBindHost: "0.0.0.0"`）以监听所有接口。
- **身份验证**：默认必需。非 loopback bind 需要 Gateway 网关身份验证。实际上，这意味着你需要共享 token/密码，或使用带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知型反向代理。新手引导默认会生成一个 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式设置 `gateway.auth.mode` 为 `token` 或 `password`。如果两者都已配置但 mode 未设置，启动以及服务安装/修复流程都会失败。
- `gateway.auth.mode: "none"`：显式的无身份验证模式。仅用于受信任的本地 local loopback 设置；新手引导提示不会主动提供该选项。
- `gateway.auth.mode: "trusted-proxy"`：将身份验证委托给身份感知型反向代理，并信任来自 `gateway.trustedProxies` 的身份头（参见[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth)）。此模式要求代理来源**不是 loopback**；同主机 loopback 反向代理不满足 trusted-proxy 身份验证要求。
- `gateway.auth.allowTailscale`：当为 `true` 时，Tailscale Serve 身份头可以满足 Control UI/WebSocket 身份验证（通过 `tailscale whois` 验证）。HTTP API 端点**不会**使用该 Tailscale 头身份验证；它们仍遵循 Gateway 网关的常规 HTTP 身份验证模式。当 `tailscale.mode = "serve"` 时，默认值为 `true`。这种无 token 流程假定 Gateway 网关主机是受信任的。
- `gateway.auth.rateLimit`：可选的身份验证失败限流器。按客户端 IP 和身份验证作用域应用（共享密钥和设备 token 会分别跟踪）。被阻止的尝试会返回 `429` + `Retry-After`。
  - 在异步 Tailscale Serve Control UI 路径上，同一 `{scope, clientIp}` 的失败尝试会在写入失败记录前串行化。因此，同一客户端的并发错误尝试可能会在第二个请求时触发限流，而不是两个请求都作为普通不匹配直接通过。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；如果你有意也要对 localhost 流量进行限流（例如测试环境或严格代理部署），请将其设为 `false`。
- 来自浏览器来源的 WS 身份验证尝试始终会在禁用 loopback 豁免的情况下进行节流（作为对基于浏览器的 localhost 暴力破解的纵深防御）。
- 在 loopback 上，这些浏览器来源的锁定会按归一化后的 `Origin`
  值彼此隔离，因此一个 localhost 来源的重复失败不会自动
  锁定另一个来源。
- `tailscale.mode`：`serve`（仅 tailnet，loopback bind）或 `funnel`（公开访问，需要身份验证）。
- `controlUi.allowedOrigins`：Gateway 网关 WebSocket 连接的显式浏览器来源允许列表。当浏览器客户端将从非 loopback 来源连接时，这是必需项。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，用于启用基于 Host 头的来源回退，适用于有意依赖 Host 头来源策略的部署。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。对于 `direct`，`remote.url` 必须是 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端侧的紧急覆盖开关，允许对受信任私有网络 IP 使用明文 `ws://`；默认仍然只允许在 loopback 上使用明文。
- `gateway.remote.token` / `.password` 是远程客户端凭证字段。它们本身不会配置 Gateway 网关身份验证。
- `gateway.push.apns.relay.baseUrl`：外部 APNs 中继的基础 HTTPS URL，供官方/TestFlight iOS 构建在向 Gateway 网关发布基于 relay 的注册后使用。该 URL 必须与编译进 iOS 构建中的 relay URL 一致。
- `gateway.push.apns.relay.timeoutMs`：Gateway 网关到 relay 的发送超时（毫秒）。默认值为 `10000`。
- 基于 relay 的注册会委派给特定的 Gateway 网关身份。配对的 iOS 应用会获取 `gateway.identity.get`，在 relay 注册中包含该身份，并将作用于该注册的发送授权转发给 Gateway 网关。另一个 Gateway 网关无法复用该已存储注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅供开发使用的逃生舱，用于 loopback HTTP relay URL。生产环境 relay URL 应保持为 HTTPS。
- `gateway.channelHealthCheckMinutes`：渠道健康监视间隔（分钟）。设为 `0` 可全局禁用健康监视重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧 socket 阈值（分钟）。应保持大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：滚动一小时内每个渠道/账号允许的最大健康监视重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：按渠道选择退出健康监视重启，同时保持全局监视启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账号渠道的按账号覆盖。设置后会优先于渠道级覆盖。
- 仅当 `gateway.auth.*` 未设置时，本地 Gateway 网关调用路径才可使用 `gateway.remote.*` 作为回退。
- 如果通过 SecretRef 显式配置了 `gateway.auth.token` / `gateway.auth.password` 且未解析，则解析会以关闭方式失败（不会用远程回退来掩盖问题）。
- `trustedProxies`：终止 TLS 或注入转发客户端头的反向代理 IP。只列出你控制的代理。loopback 条目对于同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）仍然有效，但它们**不会**使 loopback 请求符合 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`：当为 `true` 时，如果缺少 `X-Forwarded-For`，Gateway 网关会接受 `X-Real-IP`。默认 `false`，以保持失败即关闭的行为。
- `gateway.tools.deny`：通过 HTTP `POST /tools/invoke` 额外阻止的工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    空的允许列表会被视为未设置；请使用 `gateway.http.endpoints.responses.files.allowUrl=false`
    和/或 `gateway.http.endpoints.responses.images.allowUrl=false` 来禁用 URL 获取。
- 可选的响应加固头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅对你控制的 HTTPS 来源设置；参见[受信任代理身份验证](/zh-CN/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在一台主机上运行多个 Gateway 网关时，请使用唯一的端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

参见[多个 Gateway 网关](/zh-CN/gateway/multiple-gateways)。

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

- `enabled`：在 Gateway 网关监听器上启用 TLS 终止（HTTPS/WSS）（默认：`false`）。
- `autoGenerate`：当未配置显式文件时，自动生成本地自签名证书/密钥对；仅适用于本地/开发环境。
- `certPath`：TLS 证书文件的文件系统路径。
- `keyPath`：TLS 私钥文件的文件系统路径；应限制权限。
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

- `mode`：控制运行时如何应用配置编辑。
  - `"off"`：忽略实时编辑；变更需要显式重启。
  - `"restart"`：配置变更时始终重启 Gateway 网关进程。
  - `"hot"`：在不重启的情况下进程内应用变更。
  - `"hybrid"`（默认）：优先尝试热重载；如有需要则回退到重启。
- `debounceMs`：应用配置变更前的防抖窗口（毫秒）（非负整数）。
- `deferralTimeoutMs`：在强制重启前等待进行中操作完成的最长时间（毫秒）（默认：`300000` = 5 分钟）。

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

身份验证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。
拒绝使用查询字符串中的 hook token。

验证和安全说明：

- `hooks.enabled=true` 需要非空的 `hooks.token`。
- `hooks.token` **必须**与 `gateway.auth.token` 不同；复用 Gateway 网关 token 会被拒绝。
- `hooks.path` 不能为 `/`；请使用专用子路径，例如 `/hooks`。
- 如果 `hooks.allowRequestSessionKey=true`，请约束 `hooks.allowedSessionKeyPrefixes`（例如 `["hook:"]`）。
- 如果映射或预设使用了模板化的 `sessionKey`，请设置 `hooks.allowedSessionKeyPrefixes` 并将 `hooks.allowRequestSessionKey=true`。静态映射键不需要该选择启用项。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认：`false`）时，才接受请求负载中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析
  - 由模板渲染出的映射 `sessionKey` 值也会被视为外部提供，因此同样要求 `hooks.allowRequestSessionKey=true`。

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的某个负载字段。
- `{{messages[0].subject}}` 之类的模板会从负载中读取。
- `transform` 可以指向一个返回 hook 动作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，并且必须位于 `hooks.transformsDir` 内（绝对路径和路径穿越会被拒绝）。
- `agentId` 路由到特定智能体；未知 ID 会回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：hook 智能体运行在未显式提供 `sessionKey` 时使用的可选固定会话键。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方和模板驱动的映射会话键设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。当任何映射或预设使用模板化 `sessionKey` 时，它会变为必需项。
- `deliver: true` 会将最终回复发送到某个渠道；`channel` 默认为 `last`。
- `model` 会覆盖此次 hook 运行的 LLM（如果已设置模型目录，则该模型必须被允许）。

</Accordion>

### Gmail 集成

- 内置的 Gmail 预设使用 `sessionKey: "hook:gmail:{{messages[0].id}}"`。
- 如果你保留这种按消息路由的方式，请设置 `hooks.allowRequestSessionKey: true`，并将 `hooks.allowedSessionKeyPrefixes` 约束为匹配 Gmail 命名空间，例如 `["hook:", "hook:gmail:"]`。
- 如果你需要 `hooks.allowRequestSessionKey: false`，请使用静态 `sessionKey` 覆盖该预设，而不是使用默认的模板化值。

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
- 不要在 Gateway 网关之外单独运行 `gog gmail watch serve`。

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

- 通过 Gateway 网关端口下的 HTTP 提供可由智能体编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非 loopback bind：canvas 路由与其他 Gateway 网关 HTTP 表面一样，需要 Gateway 网关身份验证（token/password/trusted-proxy）。
- 节点 WebView 通常不会发送身份验证头；在节点完成配对并连接后，Gateway 网关会为 canvas/A2UI 访问公布节点作用域的能力 URL。
- 能力 URL 绑定到当前活跃的节点 WS 会话，并且会很快过期。不使用基于 IP 的回退。
- 会向提供的 HTML 中注入 live-reload 客户端。
- 为空时会自动创建初始 `index.html`。
- 同时也会在 `/__openclaw__/a2ui/` 提供 A2UI。
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

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 主机名默认为 `openclaw`。可通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域网（DNS-SD）

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

- 仅当进程环境中缺少相应键时，才会应用内联环境变量。
- `.env` 文件：当前工作目录 `.env` + `~/.openclaw/.env`（两者都不会覆盖现有变量）。
- `shellEnv`：从你的登录 shell 配置文件中导入缺失的预期键名。
- 完整优先级请参见[环境变量](/zh-CN/help/environment)。

### 环境变量替换

你可以在任意配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/为空的变量会在配置加载时抛出错误。
- 使用 `$${VAR}` 可转义为字面量 `${VAR}`。
- 适用于 `$include`。

---

## 密钥

SecretRef 是增量式的：明文值依然可用。

### `SecretRef`

使用以下对象结构之一：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证规则：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` 的 `id` 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` 的 `id`：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` 的 `id` 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` 的 `id` 不能包含 `.` 或 `..` 这样的斜杠分隔路径片段（例如 `a/../b` 会被拒绝）

### 支持的凭证表面

- 规范矩阵：[SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)
- `secrets apply` 以受支持的 `openclaw.json` 凭证路径为目标。
- `auth-profiles.json` 引用包含在运行时解析和审计覆盖范围内。

### 密钥提供商配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选的显式 env 提供商
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
- 当无法进行 Windows ACL 验证时，文件和 exec 提供商路径会以失败即关闭的方式处理。仅对无法验证但受信任的路径设置 `allowInsecurePath: true`。
- `exec` 提供商要求使用绝对 `command` 路径，并通过 stdin/stdout 使用协议负载。
- 默认情况下，符号链接命令路径会被拒绝。设置 `allowSymlinkCommand: true` 可允许符号链接路径，同时验证其解析后的目标路径。
- 如果配置了 `trustedDirs`，则受信任目录检查会应用于解析后的目标路径。
- `exec` 子进程环境默认最小化；请通过 `passEnv` 显式传入所需变量。
- SecretRef 会在激活时解析为内存快照，之后请求路径只读取该快照。
- 激活期间会应用活动表面过滤：已启用表面上未解析的引用会导致启动/重载失败，而非活动表面会被跳过并记录诊断信息。

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

- 按智能体的配置档案存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持值级引用（静态凭证模式下，`api_key` 使用 `keyRef`，`token` 使用 `tokenRef`）。
- OAuth 模式配置档案（`auth.profiles.<id>.mode = "oauth"`）不支持由 SecretRef 支持的 auth-profile 凭证。
- 静态运行时凭证来自已解析的内存快照；发现旧版静态 `auth.json` 条目时会进行清理。
- 从 `~/.openclaw/credentials/oauth.json` 导入旧版 OAuth。
- 参见 [OAuth](/zh-CN/concepts/oauth)。
- 密钥运行时行为以及 `audit/configure/apply` 工具：参见[密钥管理](/zh-CN/gateway/secrets)。

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

- `billingBackoffHours`：当某个配置档案因真实的计费/余额不足错误而失败时，使用的基础退避时长（小时）（默认：`5`）。即使是在 `401`/`403` 响应中，只要包含明确的计费文本，也仍可能进入这里，但提供商特定的文本匹配器只会作用于拥有它们的提供商（例如 OpenRouter 的 `Key limit exceeded`）。可重试的 HTTP `402` 使用窗口或组织/工作区支出上限消息，仍会进入 `rate_limit` 路径。
- `billingBackoffHoursByProvider`：按提供商覆盖计费退避小时数的可选配置。
- `billingMaxHours`：计费退避指数增长的小时上限（默认：`24`）。
- `authPermanentBackoffMinutes`：高置信度 `auth_permanent` 失败的基础退避时长（分钟）（默认：`10`）。
- `authPermanentMaxMinutes`：`auth_permanent` 退避增长的分钟上限（默认：`60`）。
- `failureWindowHours`：用于退避计数器的滚动时间窗口（小时）（默认：`24`）。
- `overloadedProfileRotations`：针对过载错误，在切换到模型回退之前，同一提供商 auth-profile 允许的最大轮换次数（默认：`1`）。像 `ModelNotReadyException` 这类提供商繁忙错误会归入此类。
- `overloadedBackoffMs`：在重试过载的提供商/配置档案轮换前的固定延迟（毫秒）（默认：`0`）。
- `rateLimitedProfileRotations`：针对限流错误，在切换到模型回退之前，同一提供商 auth-profile 允许的最大轮换次数（默认：`1`）。该限流桶包括提供商形态的文本，例如 `Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 和 `resource exhausted`。

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
- 使用 `--verbose` 时，`consoleLevel` 会提升为 `debug`。
- `maxFileBytes`：在抑制继续写入前，日志文件允许的最大字节数（正整数；默认：`524288000` = 500 MB）。生产部署请使用外部日志轮转。

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

- `enabled`：检测输出总开关（默认：`true`）。
- `flags`：启用定向日志输出的标志字符串数组（支持像 `"telegram.*"` 或 `"*"` 这样的通配符）。
- `stuckSessionWarnMs`：当会话持续处于处理中状态时，用于发出卡住会话警告的年龄阈值（毫秒）。
- `otel.enabled`：启用 OpenTelemetry 导出流水线（默认：`false`）。
- `otel.endpoint`：OTel 导出的采集器 URL。
- `otel.protocol`：`"http/protobuf"`（默认）或 `"grpc"`。
- `otel.headers`：随 OTel 导出请求发送的额外 HTTP/gRPC 元数据头。
- `otel.serviceName`：资源属性中的服务名称。
- `otel.traces` / `otel.metrics` / `otel.logs`：启用 trace、metrics 或日志导出。
- `otel.sampleRate`：`0`–`1` 的 trace 采样率。
- `otel.flushIntervalMs`：定期刷出遥测数据的时间间隔（毫秒）。
- `cacheTrace.enabled`：为嵌入式运行记录缓存追踪快照（默认：`false`）。
- `cacheTrace.filePath`：缓存追踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存追踪输出中包含的内容（默认全部为 `true`）。

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
- `checkOnStart`：Gateway 网关启动时检查 npm 更新（默认：`true`）。
- `auto.enabled`：为包安装启用后台自动更新（默认：`false`）。
- `auto.stableDelayHours`：稳定渠道自动应用前的最小时延（小时）（默认：`6`；最大：`168`）。
- `auto.stableJitterHours`：稳定渠道额外的发布扩散窗口（小时）（默认：`12`；最大：`168`）。
- `auto.betaCheckIntervalHours`：beta 渠道执行检查的频率（小时）（默认：`1`；最大：`24`）。

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
- `backend`：默认 ACP 运行时后端 ID（必须匹配已注册的 ACP 运行时插件）。
- `defaultAgent`：当 spawn 未指定显式目标时，使用的回退 ACP 目标智能体 ID。
- `allowedAgents`：允许用于 ACP 运行时会话的智能体 ID 列表；为空表示无额外限制。
- `maxConcurrentSessions`：同时活跃的 ACP 会话最大数量。
- `stream.coalesceIdleMs`：流式文本的空闲合并刷出窗口（毫秒）。
- `stream.maxChunkChars`：拆分流式块投影前允许的最大分块大小。
- `stream.repeatSuppression`：每轮抑制重复的状态/工具行（默认：`true`）。
- `stream.deliveryMode`：`"live"` 表示增量流式输出；`"final_only"` 表示缓冲到轮次终结事件后再输出。
- `stream.hiddenBoundarySeparator`：隐藏工具事件后、可见文本前使用的分隔符（默认：`"paragraph"`）。
- `stream.maxOutputChars`：每个 ACP 轮次投影的最大助手输出字符数。
- `stream.maxSessionUpdateChars`：投影的 ACP 状态/更新行允许的最大字符数。
- `stream.tagVisibility`：记录标签名称到布尔可见性覆盖值的映射，用于流式事件。
- `runtime.ttlMinutes`：ACP 会话工作进程在可被清理前的空闲 TTL（分钟）。
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

- `cli.banner.taglineMode` 控制 banner 标语样式：
  - `"random"`（默认）：轮换的有趣/季节性标语。
  - `"default"`：固定的中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：不显示标语文本（仍显示 banner 标题/版本）。
- 若要隐藏整个 banner（而不只是标语），请设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

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

请参见[智能体默认值](/zh-CN/gateway/config-agents#agent-defaults)下 `agents.list` 的身份字段。

---

## Bridge protocol（旧版节点，历史参考）

当前构建已不再包含 TCP bridge。节点通过 Gateway 网关 WebSocket 连接。`bridge.*` 键已不再属于配置 schema 的一部分（在移除前验证会失败；`openclaw doctor --fix` 可清除未知键）。

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
    webhook: "https://example.invalid/legacy", // 已弃用：为已保存的 notify:true 任务提供回退
    webhookToken: "replace-with-dedicated-token", // 可选：出站 webhook 身份验证使用的 bearer token
    sessionRetention: "24h", // 时长字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

- `sessionRetention`：在从 `sessions.json` 清理前，已完成的隔离 cron 运行会话应保留多长时间。也控制已归档并已删除的 cron 转录的清理。默认：`24h`；设置为 `false` 可禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）在清理前允许的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志清理时保留的最新行数。默认：`2000`。
- `webhookToken`：用于 cron webhook POST 投递（`delivery.mode = "webhook"`）的 bearer token；若省略则不会发送身份验证头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），仅用于那些仍带有 `notify: true` 的已保存任务。

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

- `maxAttempts`：一次性任务在临时错误下允许的最大重试次数（默认：`3`；范围：`0`–`10`）。
- `backoffMs`：每次重试所使用的退避延迟数组（毫秒）（默认：`[30000, 60000, 300000]`；1–10 个条目）。
- `retryOn`：触发重试的错误类型 —— `"rate_limit"`、`"overloaded"`、`"network"`、`"timeout"`、`"server_error"`。省略时表示重试所有临时错误类型。

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

- `enabled`：启用 cron 任务失败告警（默认：`false`）。
- `after`：连续失败多少次后触发告警（正整数，最小值：`1`）。
- `cooldownMs`：同一任务重复告警之间的最小间隔（毫秒）（非负整数）。
- `mode`：投递模式 —— `"announce"` 通过渠道消息发送；`"webhook"` 向已配置的 webhook 发起 POST。
- `accountId`：可选的账号或渠道 ID，用于限定告警投递范围。

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

- 所有任务通用的 cron 失败通知默认目标。
- `mode`：`"announce"` 或 `"webhook"`；当存在足够的目标数据时，默认为 `"announce"`。
- `channel`：用于 announce 投递的渠道覆盖值。`"last"` 会复用最近一次已知的投递渠道。
- `to`：显式的 announce 目标或 webhook URL。对于 webhook 模式这是必填项。
- `accountId`：可选的投递账号覆盖值。
- 每个任务的 `delivery.failureDestination` 会覆盖此全局默认值。
- 当既未设置全局也未设置每任务失败目标时，那些本身已通过 `announce` 投递的任务在失败时会回退到其主 announce 目标。
- `delivery.failureDestination` 仅支持 `sessionTarget="isolated"` 的任务，除非该任务的主 `delivery.mode` 为 `"webhook"`。

参见 [Cron Jobs](/zh-CN/automation/cron-jobs)。隔离的 cron 执行会作为[后台任务](/zh-CN/automation/tasks)进行跟踪。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整的入站消息正文                                |
| `{{RawBody}}`      | 原始正文（不含历史/发送者包装）                   |
| `{{BodyStripped}}` | 去除了群组提及的正文                              |
| `{{From}}`         | 发送者标识符                                      |
| `{{To}}`           | 目标标识符                                        |
| `{{MessageSid}}`   | 渠道消息 ID                                       |
| `{{SessionId}}`    | 当前会话 UUID                                     |
| `{{IsNewSession}}` | 新会话已创建时为 `"true"`                         |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                    |
| `{{MediaPath}}`    | 本地媒体路径                                      |
| `{{MediaType}}`    | 媒体类型（image/audio/document/…）                |
| `{{Transcript}}`   | 音频转录文本                                      |
| `{{Prompt}}`       | 为 CLI 条目解析出的媒体提示                       |
| `{{MaxChars}}`     | 为 CLI 条目解析出的最大输出字符数                 |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群组主题（尽力而为）                              |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）                          |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）                        |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）                        |
| `{{Provider}}`     | 提供商提示（whatsapp、telegram、discord 等）      |

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

- 单个文件：替换所在的对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：在 include 之后合并（覆盖已包含的值）。
- 嵌套 include：最多支持 10 层。
- 路径：相对于包含它的文件解析，但必须保持在顶层配置目录（`openclaw.json` 的 `dirname`）之内。仅当绝对路径或 `../` 形式最终仍解析到该边界之内时才允许使用。
- 只变更某个由单文件 include 支持的顶层分区时，由 OpenClaw 拥有的写入会透传到该包含文件。例如，`plugins install` 会更新 `plugins: { $include: "./plugins.json5" }` 中的 `plugins.json5`，并保持 `openclaw.json` 不变。
- 根 include、include 数组以及带有同级覆盖的 include 对于 OpenClaw 拥有的写入是只读的；这些写入会以失败即关闭的方式处理，而不是将配置拍平。
- 错误：会为缺失文件、解析错误和循环 include 提供清晰的错误信息。

---

_相关内容：[配置](/zh-CN/gateway/configuration) · [配置示例](/zh-CN/gateway/configuration-examples) · [Doctor](/zh-CN/gateway/doctor)_

## 相关内容

- [配置](/zh-CN/gateway/configuration)
- [配置示例](/zh-CN/gateway/configuration-examples)

---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义提供商或覆盖基础 URL
    - 设置与 OpenAI 兼容的自托管端点
summary: 工具配置（策略、实验性开关、提供商支持的工具）以及自定义提供商 / 基础 URL 设置
title: 配置——工具和自定义提供商
x-i18n:
    generated_at: "2026-04-24T04:02:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` 配置键以及自定义提供商 / 基础 URL 设置。有关智能体、渠道和其他顶层配置键，请参阅
[配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置文件

`tools.profile` 会在 `tools.allow` / `tools.deny` 之前设置基础允许列表：

当未设置时，本地新手引导默认会将新的本地配置设为 `tools.profile: "coding"`（现有的显式配置文件会被保留）。

| 配置文件 | 包含内容 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` | 仅 `session_status` |
| `coding` | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` | 不限制（与未设置相同） |

### 工具组

| 组 | 工具 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名） |
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`x_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `cron`、`gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list` |
| `group:media` | `image`、`image_generate`、`video_generate`、`tts` |
| `group:openclaw` | 所有内置工具（不包括提供商插件） |

### `tools.allow` / `tools.deny`

全局工具允许 / 拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会生效。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

针对特定提供商或模型进一步限制工具。顺序：基础配置文件 → 提供商配置文件 → allow / deny。

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
- `/elevated on|off|ask|full` 会按会话存储状态；内联指令仅对单条消息生效。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`，当 `exec` 目标为 `node` 时则使用 `node`）。

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

工具循环安全检查默认**关闭**。设置 `enabled: true` 以启用检测。
这些设置可在全局 `tools.loopDetection` 中定义，并可在每个智能体的 `agents.list[].tools.loopDetection` 中覆盖。

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

- `historySize`：为循环分析保留的最大工具调用历史记录数。
- `warningThreshold`：用于发出警告的重复无进展模式阈值。
- `criticalThreshold`：用于阻止严重循环的更高重复阈值。
- `globalCircuitBreakerThreshold`：任何无进展运行的硬停止阈值。
- `detectors.genericRepeat`：对重复的相同工具 / 相同参数调用发出警告。
- `detectors.knownPollNoProgress`：对已知轮询工具（`process.poll`、`command_status` 等）的无进展情况发出警告 / 阻止。
- `detectors.pingPong`：对交替出现的无进展配对模式发出警告 / 阻止。
- 如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证将失败。

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
        provider: "firecrawl", // 可选；省略则自动检测
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

配置入站媒体理解（图像 / 音频 / 视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 选择启用：将已完成的异步音乐 / 视频直接发送到渠道
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

- `provider`：API 提供商 id（`openai`、`anthropic`、`google` / `gemini`、`groq` 等）
- `model`：模型 id 覆盖值
- `profile` / `preferredProfile`：`auth-profiles.json` 配置文件选择

**CLI 条目**（`type: "cli"`）：

- `command`：要运行的可执行文件
- `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等）

**通用字段：**

- `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai` / `anthropic` / `minimax` → image，`google` → image + audio + video，`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：每个条目的覆盖值。
- 失败时会回退到下一个条目。

提供商认证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

**异步完成字段：**

- `asyncCompletion.directSend`：当为 `true` 时，已完成的异步 `music_generate`
  和 `video_generate` 任务会优先尝试直接发送到渠道。默认值：`false`
  （旧版的请求者会话唤醒 / 模型投递路径）。

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

控制哪些会话可以被会话工具（`sessions_list`、`sessions_history`、`sessions_send`）作为目标。

默认值：`tree`（当前会话 + 由其生成的会话，例如子智能体）。

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
- `tree`：当前会话 + 由当前会话生成的会话（子智能体）。
- `agent`：属于当前智能体 id 的任何会话（如果你在同一个智能体 id 下按发送者运行会话，则可能包括其他用户）。
- `all`：任何会话。跨智能体定向仍需要 `tools.agentToAgent`。
- 沙箱限制：当当前会话处于沙箱隔离状态，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 选择启用：设为 true 以允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件合计最多 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件最多 1 MB
        retainOnSessionKeep: false, // 当 cleanup="keep" 时保留附件
      },
    },
  },
}
```

说明：

- 附件仅支持 `runtime: "subagent"`。ACP 运行时会拒绝它们。
- 文件会以实体形式写入子工作区的 `.openclaw/attachments/<uuid>/`，并附带一个 `.manifest.json`。
- 附件内容会自动从 transcript 持久化中脱敏。
- Base64 输入会通过严格的字符集 / 填充检查以及解码前大小保护进行验证。
- 文件权限为：目录 `0700`，文件 `0600`。
- 清理遵循 `cleanup` 策略：`delete` 总是会删除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留附件。

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性的内置工具标志。默认关闭，除非适用严格 agentic GPT-5 自动启用规则。

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

- `planTool`：为非简单的多步骤工作跟踪启用结构化 `update_plan` 工具。
- 默认值：`false`，除非 `agents.defaults.embeddedPi.executionContract`（或每个智能体的覆盖值）在 OpenAI 或 OpenAI Codex GPT-5 系列运行中设置为 `"strict-agentic"`。设为 `true` 可在该范围外强制启用此工具；设为 `false` 则即使在严格 agentic GPT-5 运行中也保持关闭。
- 启用后，系统提示也会加入使用指引，以便模型仅在实质性工作中使用它，并且始终最多只保留一个 `in_progress` 步骤。

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

- `model`：生成的子智能体默认模型。如果省略，子智能体将继承调用方的模型。
- `allowAgents`：当请求智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 目标智能体 id 的默认允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- `runTimeoutSeconds`：当工具调用未提供 `runTimeoutSeconds` 时，`sessions_spawn` 的默认超时时间（秒）。`0` 表示无超时。
- 每个子智能体的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

OpenClaw 使用内置模型目录。可通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

```json5
{
  models: {
    mode: "merge", // merge（默认） | replace
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

- 对于自定义认证需求，请使用 `authHeader: true` + `headers`。
- 可使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录（或使用遗留环境变量别名 `PI_CODING_AGENT_DIR`）。
- 匹配提供商 ID 的合并优先级：
  - 非空的智能体 `models.json` `baseUrl` 值优先。
  - 非空的智能体 `apiKey` 值仅在该提供商在当前配置 / auth-profile 上下文中**不**由 SecretRef 管理时优先。
  - 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用为 `ENV_VAR_NAME`，文件 / exec 引用为 `secretref-managed`），而不是持久化已解析的密钥。
  - 由 SecretRef 管理的提供商 header 值会从源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，文件 / exec 引用为 `secretref-managed`）。
  - 空的或缺失的智能体 `apiKey` / `baseUrl` 会回退到配置中的 `models.providers`。
  - 匹配模型的 `contextWindow` / `maxTokens` 会在显式配置值和隐式目录值之间取较高者。
  - 匹配模型的 `contextTokens` 在存在时会保留显式运行时上限；当你希望限制有效上下文而不修改模型原生元数据时，请使用它。
  - 当你希望配置完全重写 `models.json` 时，请使用 `models.mode: "replace"`。
  - 标记持久化遵循来源权威：标记从活动源配置快照（解析前）写入，而不是从已解析的运行时密钥值写入。

### 提供商字段详情

- `models.mode`：提供商目录行为（`merge` 或 `replace`）。
- `models.providers`：以提供商 id 为键的自定义提供商映射。
  - 安全编辑：对增量更新，请使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。除非传入 `--replace`，否则 `config set` 会拒绝破坏性替换。
- `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
- `models.providers.*.apiKey`：提供商凭证（优先使用 SecretRef / 环境变量替换）。
- `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求中注入 `options.num_ctx`（默认：`true`）。
- `models.providers.*.authHeader`：在需要时强制通过 `Authorization` header 传递凭证。
- `models.providers.*.baseUrl`：上游 API 基础 URL。
- `models.providers.*.headers`：用于代理 / 租户路由的额外静态 headers。
- `models.providers.*.request`：模型提供商 HTTP 请求的传输层覆盖。
  - `request.headers`：额外 headers（与提供商默认值合并）。值支持 SecretRef。
  - `request.auth`：认证策略覆盖。模式：`"provider-default"`（使用提供商内置认证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value` 和可选 `prefix`）。
  - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY` / `HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。这两种模式都接受可选的 `tls` 子对象。
  - `request.tls`：直连的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（均支持 SecretRef）、`serverName`、`insecureSkipVerify`。
  - `request.allowPrivateNetwork`：当为 `true` 时，如果 DNS 将 `baseUrl` 解析到私有、CGNAT 或类似地址范围，则允许通过提供商 HTTP 抓取保护访问 HTTPS `baseUrl`（这是对受信任自托管 OpenAI 兼容端点的运维显式启用）。WebSocket 对 headers / TLS 使用相同的 `request`，但不受该抓取 SSRF 防护门控影响。默认值为 `false`。
- `models.providers.*.models`：显式的提供商模型目录条目。
- `models.providers.*.models.*.contextWindow`：模型原生上下文窗口元数据。
- `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。当你希望有效上下文预算小于模型原生 `contextWindow` 时，请使用它。
- `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于 `api: "openai-completions"` 且 `baseUrl` 为非空的非原生地址（主机不是 `api.openai.com`）时，OpenClaw 会在运行时将其强制设为 `false`。空的 / 省略的 `baseUrl` 会保留默认 OpenAI 行为。
- `models.providers.*.models.*.compat.requiresStringContent`：用于仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。当为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组压平成普通字符串。
- `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根路径。
- `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启 / 关闭隐式发现。
- `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选 provider-id 过滤器。
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的后备上下文窗口。
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的后备最大输出 token 数。

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
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

对于 Cerebras，请使用 `cerebras/zai-glm-4.7`；对于直接连接 Z.AI，请使用 `zai/glm-4.7`。

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
- 编码端点（默认）：`https://api.z.ai/api/coding/paas/v4`
- 若使用通用端点，请定义带有基础 URL 覆盖的自定义提供商。

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

对于中国端点：`baseUrl: "https://api.moonshot.cn/v1"`，或使用 `openclaw onboard --auth-choice moonshot-api-key-cn`。

原生 Moonshot 端点会在共享的
`openai-completions` 传输层上声明流式使用兼容性，而 OpenClaw 会基于端点能力
而不只是基于内置提供商 id 本身来处理这一点。

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

与 Anthropic 兼容的内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

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

基础 URL 不应包含 `/v1`（Anthropic 客户端会自行追加）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

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
在兼容 Anthropic 的流式传输路径上，除非你显式设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax thinking。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为
`MiniMax-M2.7-highspeed`。

</Accordion>

<Accordion title="本地模型（LM Studio）">

参见 [本地模型](/zh-CN/gateway/local-models)。简而言之：在性能足够强的硬件上，通过 LM Studio Responses API 运行大型本地模型；同时保留已合并的托管模型作为后备。

</Accordion>

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) —— 其他顶层键
- [配置——智能体](/zh-CN/gateway/config-agents)
- [配置——渠道](/zh-CN/gateway/config-channels)
- [工具和插件](/zh-CN/tools)

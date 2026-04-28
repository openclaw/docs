---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义提供商或覆盖基础 URL
    - 设置 OpenAI 兼容的自托管端点
sidebarTitle: Tools and custom providers
summary: 工具配置（策略、实验性开关、由提供商支持的工具）和自定义提供商/基础 URL 设置
title: 配置 — 工具和自定义提供商
x-i18n:
    generated_at: "2026-04-28T11:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 配置键和自定义提供商 / 基础 URL 设置。对于智能体、渠道和其他顶层配置键，请参阅 [配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置文件

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地新手引导会在未设置时将新的本地配置默认为 `tools.profile: "coding"`（现有的显式配置文件会保留）。
</Note>

| 配置文件    | 包含项                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 无限制（与未设置相同）                                                                                                          |

### 工具组

| 组                 | 工具                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` 可作为 `exec` 的别名）                                                       |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | 所有内置工具（不包括提供商插件）                                                                                        |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步限制特定提供商或模型的工具。顺序：基础配置文件 → 提供商配置文件 → 允许/拒绝。

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

- 每个智能体的覆盖项（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 按会话存储状态；内联指令仅应用于单条消息。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用配置的逃逸路径（默认是 `gateway`，或当 exec 目标为 `node` 时使用 `node`）。

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

工具循环安全检查**默认禁用**。设置 `enabled: true` 可启用检测。设置可以在 `tools.loopDetection` 中全局定义，并可在每个智能体的 `agents.list[].tools.loopDetection` 中覆盖。

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

<ParamField path="historySize" type="number">
  为循环分析保留的最大工具调用历史记录。
</ParamField>
<ParamField path="warningThreshold" type="number">
  发出警告的重复无进展模式阈值。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  阻塞关键循环的更高重复阈值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何无进展运行的硬停止阈值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  对重复的相同工具/相同参数调用发出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  对已知轮询工具（`process.poll`、`command_status` 等）的无进展情况发出警告/阻塞。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替出现的无进展成对模式发出警告/阻塞。
</ParamField>

<Warning>
如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证会失败。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
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

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **提供商条目**（`type: "provider"` 或省略）：

    - `provider`：API 提供商 id（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 id 覆盖项
    - `profile` / `preferredProfile`：`auth-profiles.json` profile 选择

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 会将已弃用的 `{input}` 占位符迁移为 `{{MediaPath}}`）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → 图像，`google` → 图像+音频+视频，`groq` → 音频。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：逐条目覆盖项。
    - `tools.media.image.timeoutSeconds` 以及匹配的图像模型 `timeoutSeconds` 条目，也会在智能体调用显式 `image` 工具时应用。
    - 失败会回退到下一个条目。

    提供商认证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：当为 `true` 时，已完成的异步 `music_generate` 和 `video_generate` 任务会优先尝试直接投递到渠道。默认值：`false`（旧版请求者会话唤醒/模型投递路径）。

  </Accordion>
</AccordionGroup>

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

控制哪些会话可作为会话工具（`sessions_list`、`sessions_history`、`sessions_send`）的目标。

默认值：`tree`（当前会话 + 由它派生的会话，例如子智能体）。

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

<AccordionGroup>
  <Accordion title="Visibility scopes">
    - `self`：仅当前会话键。
    - `tree`：当前会话 + 由当前会话派生的会话（子智能体）。
    - `agent`：属于当前智能体 id 的任何会话（如果你在同一智能体 id 下按发送者运行会话，可能包含其他用户）。
    - `all`：任何会话。跨智能体定向仍然需要 `tools.agentToAgent`。
    - 沙箱限制：当当前会话处于沙箱隔离状态且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Attachment notes">
    - 附件仅支持 `runtime: "subagent"`。ACP 运行时会拒绝它们。
    - 文件会被物化到子工作区的 `.openclaw/attachments/<uuid>/`，并带有 `.manifest.json`。
    - 附件内容会自动从转录持久化中脱敏。
    - Base64 输入会通过严格的字母表/填充检查以及解码前大小保护进行验证。
    - 目录权限为 `0700`，文件权限为 `0600`。
    - 清理遵循 `cleanup` 策略：`delete` 总是移除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留附件。

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性内置工具标志。默认关闭，除非适用严格智能体式 GPT-5 自动启用规则。

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`：为非平凡的多步骤工作跟踪启用结构化 `update_plan` 工具。
- 默认值：`false`，除非为 OpenAI 或 OpenAI Codex GPT-5 系列运行将 `agents.defaults.embeddedPi.executionContract`（或按智能体覆盖项）设为 `"strict-agentic"`。设为 `true` 可在该范围之外强制启用该工具，或设为 `false` 可即使在 strict-agentic GPT-5 运行中也保持关闭。
- 启用后，系统提示还会添加使用指导，使模型只在实质性工作中使用它，并最多保持一个步骤为 `in_progress`。

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

- `model`：生成的子智能体的默认模型。省略时，子智能体继承调用方的模型。
- `allowAgents`：当请求方智能体没有设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 目标智能体 ID 的默认允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- `runTimeoutSeconds`：当工具调用省略 `runTimeoutSeconds` 时，`sessions_spawn` 的默认超时时间（秒）。`0` 表示无超时。
- 按子智能体的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和 base URL

OpenClaw 使用内置模型目录。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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

<AccordionGroup>
  <Accordion title="认证和合并优先级">
    - 对自定义认证需求使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录（或使用旧版环境变量别名 `PI_CODING_AGENT_DIR`）。
    - 匹配提供商 ID 的合并优先级：
      - 非空的智能体 `models.json` `baseUrl` 值优先。
      - 非空的智能体 `apiKey` 值仅在该提供商在当前配置/认证配置文件上下文中不由 SecretRef 管理时优先。
      - SecretRef 管理的提供商 `apiKey` 值会从来源标记刷新（环境变量引用用 `ENV_VAR_NAME`，文件/执行引用用 `secretref-managed`），而不是持久化解析后的密钥。
      - SecretRef 管理的提供商 header 值会从来源标记刷新（环境变量引用用 `secretref-env:ENV_VAR_NAME`，文件/执行引用用 `secretref-managed`）。
      - 空或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
      - 匹配模型的 `contextWindow`/`maxTokens` 使用显式配置值和隐式目录值中的较高值。
      - 匹配模型的 `contextTokens` 会在存在显式运行时上限时保留它；使用它可以在不更改原生模型元数据的情况下限制有效上下文。
      - 当你希望配置完全重写 `models.json` 时，使用 `models.mode: "replace"`。
      - 标记持久化以来源为准：标记从活动来源配置快照（解析前）写入，而不是从解析后的运行时密钥值写入。

  </Accordion>
</AccordionGroup>

### 提供商字段详情

<AccordionGroup>
  <Accordion title="顶层目录">
    - `models.mode`：提供商目录行为（`merge` 或 `replace`）。
    - `models.providers`：按提供商 ID 为键的自定义提供商映射。
      - 安全编辑：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 进行增量更新。除非传入 `--replace`，否则 `config set` 会拒绝破坏性替换。

  </Accordion>
  <Accordion title="提供商连接和认证">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。对于 MLX、vLLM、SGLang 以及大多数 OpenAI 兼容本地服务器这类自托管 `/v1/chat/completions` 后端，请使用 `openai-completions`。带有 `baseUrl` 但没有 `api` 的自定义提供商默认使用 `openai-completions`；仅当后端支持 `/v1/responses` 时才设置 `openai-responses`。
    - `models.providers.*.apiKey`：提供商凭据（优先使用 SecretRef/环境变量替换）。
    - `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当模型条目未设置 `contextWindow` 时，该提供商下模型的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当模型条目未设置 `contextTokens` 时，该提供商下模型的默认有效运行时上下文上限。
    - `models.providers.*.maxTokens`：当模型条目未设置 `maxTokens` 时，该提供商下模型的默认输出 token 上限。
    - `models.providers.*.timeoutSeconds`：可选的按提供商设置的模型 HTTP 请求超时时间（秒），包括连接、header、body 以及总请求中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求注入 `options.num_ctx`（默认：`true`）。
    - `models.providers.*.authHeader`：在需要时强制通过 `Authorization` header 传输凭据。
    - `models.providers.*.baseUrl`：上游 API base URL。
    - `models.providers.*.headers`：用于代理/租户路由的额外静态 header。

  </Accordion>
  <Accordion title="请求传输覆盖">
    `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖。

    - `request.headers`：额外 header（与提供商默认值合并）。值接受 SecretRef。
    - `request.auth`：认证策略覆盖。模式：`"provider-default"`（使用提供商内置认证）、`"authorization-bearer"`（带 `token`）、`"header"`（带 `headerName`、`value`，可选 `prefix`）。
    - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（带 `url`）。两种模式都接受可选的 `tls` 子对象。
    - `request.tls`：直连的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（均接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：当为 `true` 时，如果 DNS 解析到私有、CGNAT 或类似网段，则允许通过提供商 HTTP fetch 防护访问 `baseUrl` 的 HTTPS（操作员对受信任自托管 OpenAI 兼容端点的选择性启用）。`localhost`、`127.0.0.1` 和 `[::1]` 这类 local loopback 模型提供商流式 URL 会自动允许，除非此项被显式设为 `false`；LAN、tailnet 和私有 DNS 主机仍需要选择性启用。WebSocket 使用同一个 `request` 处理 header/TLS，但不使用该 fetch SSRF gate。默认值为 `false`。

  </Accordion>
  <Accordion title="模型目录条目">
    - `models.providers.*.models`：显式提供商模型目录条目。
    - `models.providers.*.models.*.input`：模型输入模态。纯文本模型使用 `["text"]`，原生图像/视觉模型使用 `["text", "image"]`。只有在所选模型标记为支持图像时，图像附件才会注入到智能体轮次中。
    - `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。这会覆盖该模型的提供商级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。这会覆盖提供商级 `contextTokens`；当你希望使用小于模型原生 `contextWindow` 的有效上下文预算时使用它；`openclaw models list` 会在两者不同时显示这两个值。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于带非空非原生 `baseUrl`（host 不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 在运行时强制将其设为 `false`。空/省略的 `baseUrl` 保持默认 OpenAI 行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：用于仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。当为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组展平为普通字符串。

  </Accordion>
  <Accordion title="Amazon Bedrock 发现">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选提供商 ID 过滤器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的后备上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的后备最大输出 token 数。

  </Accordion>
</AccordionGroup>

交互式自定义提供商新手引导会为 GPT-4o、Claude、Gemini、Qwen-VL、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等常见视觉模型 ID 推断图像输入，并对已知纯文本系列跳过额外问题。未知模型 ID 仍会提示确认是否支持图像。非交互式新手引导使用相同推断；传入 `--custom-image-input` 可强制使用支持图像的元数据，或传入 `--custom-text-input` 可强制使用纯文本元数据。

### 提供商示例

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    内置 `cerebras` 提供商插件可通过 `openclaw onboard --auth-choice cerebras-api-key` 配置此项。仅在覆盖默认值时使用显式提供商配置。

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
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
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    对 Cerebras 使用 `cerebras/zai-glm-4.7`；对 Z.AI 直连使用 `zai/glm-4.7`。

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

    Anthropic 兼容，内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    参见 [本地模型](/zh-CN/gateway/local-models)。简而言之：通过 LM Studio Responses API 在高性能硬件上运行大型本地模型；保留合并的托管模型作为回退。
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
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
                input: ["text"],
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

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录默认仅包含 M2.7。在 Anthropic 兼容的流式传输路径上，除非你显式自行设置 `thinking`，否则 OpenClaw 默认禁用 MiniMax 思考。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
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

    对于中国端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端点会在共享的 `openai-completions` 传输上声明流式使用量兼容性，并且 OpenClaw 会根据端点能力而非仅根据内置提供商 ID 来启用这一点。

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

    设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目录使用 `opencode/...` 引用，Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    基础 URL 应省略 `/v1`（Anthropic 客户端会追加它）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
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
    - 对于通用端点，请定义一个自定义提供商并覆盖基础 URL。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [配置 — 渠道](/zh-CN/gateway/config-channels)
- [配置参考](/zh-CN/gateway/configuration-reference) — 其他顶层键
- [工具和插件](/zh-CN/tools)

---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义 provider 或覆盖 base URL
    - 设置与 OpenAI 兼容的自托管端点
sidebarTitle: Tools and custom providers
summary: 工具配置（策略、实验性开关、provider 支持的工具）以及自定义 provider/base-URL 设置
title: 配置——工具和自定义 provider
x-i18n:
    generated_at: "2026-04-27T11:10:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cb18ee1b2d16309ba2eedb0408f63df58ae7f319dfe8c4cb3bf2a868415463a
    source_path: gateway/config-tools.md
    workflow: 15
---

`tools.*` 配置键和自定义 provider / base-URL 设置。对于智能体、渠道及其他顶层配置键，请参阅 [配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置档案

`tools.profile` 在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地新手引导会在未设置时，默认将新的本地配置设为 `tools.profile: "coding"`（已显式设置的配置档案会被保留）。
</Note>

| 配置档案    | 包含内容                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                             |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                       |
| `full`      | 不限制（与未设置相同）                                                                                                          |

### 工具组

| 组                 | 工具                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名）                                                      |
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
| `group:openclaw`   | 所有内置工具（不包括 provider 插件）                                                                                    |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭时也会生效。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步限制特定 provider 或模型可用的工具。顺序：基础配置档案 → provider 配置档案 → allow/deny。

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

- 每个智能体的覆盖配置（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 会按会话存储状态；内联指令仅对单条消息生效。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认为 `gateway`，或者当 exec 目标为 `node` 时使用 `node`）。

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

工具循环安全检查**默认关闭**。设置 `enabled: true` 以启用检测。设置可在全局 `tools.loopDetection` 中定义，并可在每个智能体的 `agents.list[].tools.loopDetection` 中覆盖。

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
  为循环分析保留的最大工具调用历史记录数量。
</ParamField>
<ParamField path="warningThreshold" type="number">
  用于发出警告的重复无进展模式阈值。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用于阻止严重循环的更高重复阈值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  对任何无进展运行执行硬停止的阈值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  对重复调用相同工具 / 相同参数的情况发出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  对已知轮询工具（`process.poll`、`command_status` 等）的无进展情况发出警告 / 阻止。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替出现的成对无进展模式发出警告 / 阻止。
</ParamField>

<Warning>
如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，则验证失败。
</Warning>

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

配置入站媒体理解（图片 / 音频 / 视频）：

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
  <Accordion title="媒体模型条目字段">
    **Provider 条目**（`type: "provider"` 或省略）：

    - `provider`：API provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 id 覆盖值
    - `profile` / `preferredProfile`：`auth-profiles.json` 配置档案选择

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；已弃用的 `{input}` 也可作为 `{{MediaPath}}` 的别名使用）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → image，`google` → image+audio+video，`groq` → audio。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：每个条目的覆盖设置。
    - `tools.media.image.timeoutSeconds` 以及对应图片模型中的 `timeoutSeconds` 条目，在智能体调用显式 `image` 工具时也会生效。
    - 失败时会回退到下一个条目。

    Provider 身份验证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：当为 `true` 时，已完成的异步 `music_generate` 和 `video_generate` 任务会优先尝试直接投递到渠道。默认值：`false`（旧版请求者会话唤醒 / 模型投递路径）。

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

控制会话工具（`sessions_list`、`sessions_history`、`sessions_send`）可以定位哪些会话。

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

<AccordionGroup>
  <Accordion title="可见性范围">
    - `self`：仅当前会话键。
    - `tree`：当前会话 + 由当前会话生成的会话（子智能体）。
    - `agent`：属于当前智能体 id 的任何会话（如果你在同一个智能体 id 下按发送者运行会话，则可能包含其他用户）。
    - `all`：任何会话。跨智能体定位仍然需要 `tools.agentToAgent`。
    - 沙箱钳制：当当前会话处于沙箱隔离状态，且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="附件说明">
    - 附件仅支持 `runtime: "subagent"`。ACP 运行时会拒绝它们。
    - 文件会在子工作区中实体化到 `.openclaw/attachments/<uuid>/`，并附带一个 `.manifest.json`。
    - 附件内容会自动从转录持久化中脱敏。
    - Base64 输入会通过严格的字母表 / 填充检查以及解码前大小保护进行校验。
    - 目录权限为 `0700`，文件权限为 `0600`。
    - 清理遵循 `cleanup` 策略：`delete` 始终删除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留附件。
  </Accordion>
</AccordionGroup>

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

- `planTool`：为非平凡的多步骤工作跟踪启用结构化 `update_plan` 工具。
- 默认值：`false`，除非针对 OpenAI 或 OpenAI Codex 的 GPT-5 系列运行，将 `agents.defaults.embeddedPi.executionContract`（或每个智能体的覆盖设置）设为 `"strict-agentic"`。设为 `true` 可在该范围之外强制启用此工具，设为 `false` 则即使在 strict-agentic GPT-5 运行中也保持关闭。
- 启用后，系统提示词还会添加使用指南，以便模型仅在处理实质性工作时使用它，并始终最多只保留一个 `in_progress` 步骤。

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

- `model`：生成的子智能体默认使用的模型。如果省略，子智能体会继承调用方的模型。
- `allowAgents`：当请求方智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 可定位的目标智能体 id 默认允许列表（`["*"]` = 任意；默认：仅同一智能体）。
- `runTimeoutSeconds`：当工具调用省略 `runTimeoutSeconds` 时，`sessions_spawn` 使用的默认超时时间（秒）。`0` 表示无超时。
- 每个子智能体的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义 provider 和 base URL

OpenClaw 使用内置模型目录。可通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义 provider。

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

<AccordionGroup>
  <Accordion title="身份验证和合并优先级">
    - 对于自定义身份验证需求，使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR`（或旧版环境变量别名 `PI_CODING_AGENT_DIR`）覆盖智能体配置根目录。
    - 对于匹配的 provider ID，合并优先级如下：
      - 非空的智能体 `models.json` `baseUrl` 值优先。
      - 非空的智能体 `apiKey` 值仅在当前配置 / 身份配置档案上下文中该 provider 不由 SecretRef 管理时优先。
      - 由 SecretRef 管理的 provider `apiKey` 值会根据源标记刷新（环境变量引用为 `ENV_VAR_NAME`，文件 / exec 引用为 `secretref-managed`），而不会持久化已解析的密钥。
      - 由 SecretRef 管理的 provider 头部值会根据源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，文件 / exec 引用为 `secretref-managed`）。
      - 空或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
      - 匹配模型的 `contextWindow`/`maxTokens` 会在显式配置值与隐式目录值之间采用较高者。
      - 匹配模型的 `contextTokens` 在显式运行时上限存在时会保留它；使用它可在不更改模型原生元数据的情况下限制有效上下文。
      - 当你希望配置完全重写 `models.json` 时，使用 `models.mode: "replace"`。
      - 标记持久化以源为准：标记从活动源配置快照（解析前）写入，而不是从已解析的运行时密钥值写入。
  </Accordion>
</AccordionGroup>

### Provider 字段详情

<AccordionGroup>
  <Accordion title="顶层目录">
    - `models.mode`：provider 目录行为（`merge` 或 `replace`）。
    - `models.providers`：按 provider id 键控的自定义 provider 映射。
      - 安全编辑：对增量更新，使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`。`config set` 会拒绝破坏性替换，除非你传入 `--replace`。
  </Accordion>
  <Accordion title="Provider 连接和身份验证">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
    - `models.providers.*.apiKey`：provider 凭证（优先使用 SecretRef / 环境变量替换）。
    - `models.providers.*.auth`：身份验证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当模型条目未设置 `contextWindow` 时，此 provider 下模型的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当模型条目未设置 `contextTokens` 时，此 provider 下模型的默认有效运行时上下文上限。
    - `models.providers.*.maxTokens`：当模型条目未设置 `maxTokens` 时，此 provider 下模型的默认输出 token 上限。
    - `models.providers.*.timeoutSeconds`：可选的每个 provider 模型 HTTP 请求超时时间（秒），包括连接、头部、正文及整个请求中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求中注入 `options.num_ctx`（默认：`true`）。
    - `models.providers.*.authHeader`：在需要时强制通过 `Authorization` 头传输凭证。
    - `models.providers.*.baseUrl`：上游 API base URL。
    - `models.providers.*.headers`：用于代理 / 租户路由的额外静态头部。
  </Accordion>
  <Accordion title="请求传输覆盖">
    `models.providers.*.request`：模型 provider HTTP 请求的传输覆盖设置。

    - `request.headers`：额外头部（与 provider 默认值合并）。值支持 SecretRef。
    - `request.auth`：身份验证策略覆盖。模式：`"provider-default"`（使用 provider 内置身份验证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value` 和可选的 `prefix`）。
    - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。两种模式都接受可选的 `tls` 子对象。
    - `request.tls`：直接连接的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（均支持 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：当为 `true` 时，如果 DNS 将 `baseUrl` 解析到私有、CGNAT 或类似网段，则通过 provider HTTP 抓取保护允许对 `baseUrl` 进行 HTTPS 访问（这是面向受信任自托管 OpenAI 兼容端点的运维人员选择启用项）。WebSocket 使用相同的 `request` 处理头部 / TLS，但不使用该抓取 SSRF 防护门。默认值为 `false`。

  </Accordion>
  <Accordion title="模型目录条目">
    - `models.providers.*.models`：显式的 provider 模型目录条目。
    - `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。它会覆盖该模型的 provider 级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。它会覆盖 provider 级 `contextTokens`；当你希望有效上下文预算小于模型原生 `contextWindow` 时使用它；当两者不同，`openclaw models list` 会同时显示这两个值。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于 `api: "openai-completions"` 且 `baseUrl` 为非空、非原生地址（host 不是 `api.openai.com`）的情况，OpenClaw 会在运行时强制将其设为 `false`。空的 / 省略的 `baseUrl` 会保留默认 OpenAI 行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：适用于仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。当为 `true` 时，OpenClaw 会在发送请求前，将纯文本的 `messages[].content` 数组展平为普通字符串。
  </Accordion>
  <Accordion title="Amazon Bedrock 发现">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根节点。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启 / 关闭隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：可选的 provider-id 过滤器，用于定向发现。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的回退上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的回退最大输出 token 数。
  </Accordion>
</AccordionGroup>

### Provider 示例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    内置的 `cerebras` provider 插件可通过 `openclaw onboard --auth-choice cerebras-api-key` 进行配置。只有在需要覆盖默认值时，才使用显式 provider 配置。

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

    对于 Cerebras，使用 `cerebras/zai-glm-4.7`；对于 Z.AI 直连，使用 `zai/glm-4.7`。

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

    与 Anthropic 兼容的内置 provider。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本地模型（LM Studio）">
    请参阅 [本地模型](/zh-CN/gateway/local-models)。简而言之：在配置较强的硬件上通过 LM Studio Responses API 运行大型本地模型；同时保留已合并的托管模型作为回退。
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

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录默认仅包含 M2.7。在 Anthropic 兼容的流式路径上，除非你显式自行设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax thinking。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。

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

    原生 Moonshot 端点会在共享的 `openai-completions` 传输上声明流式传输使用兼容性，而 OpenClaw 会依据端点能力而不仅仅是内置 provider id 来判断这一点。

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

    设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。对 Zen 目录使用 `opencode/...` 引用，对 Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（Anthropic 兼容）">
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

    Base URL 不应包含 `/v1`（Anthropic 客户端会追加它）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

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
    - 对于通用端点，请定义一个带有 base URL 覆盖的自定义 provider。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [配置——智能体](/zh-CN/gateway/config-agents)
- [配置——渠道](/zh-CN/gateway/config-channels)
- [配置参考](/zh-CN/gateway/configuration-reference) —— 其他顶层键
- [工具和插件](/zh-CN/tools)

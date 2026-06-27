---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义提供商或覆盖基础 URL
    - 设置 OpenAI 兼容的自托管端点
sidebarTitle: Tools and custom providers
summary: 工具配置（策略、实验性开关、提供商支持的工具）和自定义提供商/base-URL 设置
title: 配置 — 工具和自定义提供商
x-i18n:
    generated_at: "2026-06-27T01:58:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 配置键和自定义提供商 / 基础 URL 设置。有关智能体、渠道和其他顶级配置键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置档

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地新手引导会在未设置时将新的本地配置默认设为 `tools.profile: "coding"`（会保留已有的显式配置档）。
</Note>

| 配置档      | 包含                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                                               |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`skill_workshop`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                                         |
| `full`      | 无限制（与未设置相同）                                                                                                                            |

### 工具组

| 组                 | 工具                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名）                                                       |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                           |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                   |
| `group:ui`         | `browser`、`canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`、`update_plan`                                                                                            |
| `group:media`      | `image`、`image_generate`、`music_generate`、`video_generate`、`tts`                                                     |
| `group:openclaw`   | 所有内置工具（不包括提供商插件）                                                                                        |
| `group:plugins`    | 已加载插件拥有的工具，包括通过 `bundle-mcp` 暴露的已配置 MCP 服务器                                                     |

### 沙箱工具策略中的 MCP 和插件工具

已配置的 MCP 服务器会作为插件拥有的工具暴露在 `bundle-mcp` 插件 id 下。常规工具配置档可以允许它们，但 `tools.sandbox.tools` 是沙箱隔离会话的额外门禁。如果沙箱模式是 `"all"` 或 `"non-main"`，当 MCP/插件工具应可见时，请在沙箱工具允许列表中包含以下条目之一：

- `bundle-mcp`，用于来自 `mcp.servers` 的 OpenClaw 管理的 MCP 服务器
- 特定原生插件的插件 id
- `group:plugins`，用于所有已加载的插件拥有工具
- 精确的 MCP 服务器工具名称或服务器 glob，例如 `outlook__send_mail` 或 `outlook__*`，当你只想允许一个服务器时使用

服务器 glob 使用提供商安全的 MCP 服务器前缀，不一定是原始 `mcp.servers` 键。非 `[A-Za-z0-9_-]` 字符会变成 `-`，不以字母开头的名称会获得 `mcp-` 前缀，过长或重复的前缀可能会被截断或添加后缀；例如，`mcp.servers["Outlook Graph"]` 使用类似 `outlook-graph__*` 的 glob。

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

如果没有该沙箱层条目，MCP 服务器仍可成功加载，但其工具会在提供商请求前被过滤。使用 `openclaw doctor` 捕获 `mcp.servers` 中 OpenClaw 管理的服务器的这种形状。从内置插件清单或 Claude `.mcp.json` 加载的 MCP 服务器使用相同的沙箱门禁，但此诊断尚不会枚举这些来源；如果它们的工具在沙箱隔离轮次中消失，请使用相同的允许列表条目。

### `tools.codeMode`

`tools.codeMode` 启用通用 OpenClaw 代码模式表面。为带工具的运行启用后，模型只会看到 `exec` 和 `wait`；常规 OpenClaw 工具会移到沙箱内 `tools.*` 目录桥后面，MCP 工具则可通过生成的 `MCP` 命名空间使用。

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

也接受简写形式：

```json5
{
  tools: { codeMode: true },
}
```

在代码模式中，MCP 声明会通过只读虚拟 API 文件表面暴露。访客代码可以调用 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，在调用 `MCP.<server>.<tool>()` 前检查 TypeScript 风格的签名。有关运行时契约、限制和调试步骤，请参阅[代码模式](/zh-CN/reference/code-mode)。

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是独立的工具 id。`allow: ["write"]` 也会为兼容模型启用 `apply_patch`，但 `deny: ["write"]` 不会拒绝 `apply_patch`。要阻止所有文件变更，请拒绝 `group:fs`，或显式列出每个会修改文件的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

进一步限制特定提供商或模型的工具。顺序：基础配置档 → 提供商配置档 → 允许/拒绝。

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

### `tools.toolsBySender`

限制特定请求者身份可用的工具。这是在渠道访问控制之上的纵深防御；发送者值必须来自渠道适配器，而不是消息文本。

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

键使用显式前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。渠道 id 是规范 OpenClaw id；`teams` 等别名会规范化为 `msteams`。旧版无前缀键仅会作为 `id:` 接受。匹配顺序是 channel+id、id、e164、username、name，然后是通配符。

按智能体的 `agents.list[].tools.toolsBySender` 在匹配时会覆盖全局发送者匹配，即使使用空 `{}` 策略也是如此。

### `tools.elevated`

控制沙箱外部的提升权限 exec 访问：

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

- 按智能体覆盖（`agents.list[].tools.elevated`）只能进一步限制。
- `/elevated on|off|ask|full` 会按会话存储状态；内联指令仅应用于单条消息。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用已配置的逃逸路径（默认是 `gateway`，或当 exec 目标是 `node` 时使用 `node`）。

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
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 可激活检测。设置可以在 `tools.loopDetection` 中全局定义，并在每个智能体的 `agents.list[].tools.loopDetection` 中覆盖。

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
  为循环分析保留的最大工具调用历史。
</ParamField>
<ParamField path="warningThreshold" type="number">
  用于警告的重复无进展模式阈值。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  用于阻止严重循环的更高重复阈值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何无进展运行的硬停止阈值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  对重复的同工具/同参数调用发出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  对已知轮询工具（`process.poll`、`command_status` 等）发出警告/阻止。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替的无进展成对模式发出警告/阻止。
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
        directSend: false, // deprecated: completions stay agent-mediated
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
    **提供商条目**（`type: "provider"` 或省略）：

    - `provider`：API 提供商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆盖
    - `profile` / `preferredProfile`：`auth-profiles.json` 配置文件选择

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 会将已弃用的 `{input}` 占位符迁移为 `{{MediaPath}}`）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → 图像，`google` → 图像+音频+视频，`groq` → 音频。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：每个条目的覆盖项。
    - 当智能体调用显式的 `image` 工具时，`tools.media.image.timeoutSeconds` 和匹配图像模型的 `timeoutSeconds` 条目也会生效。对于图像理解，此超时适用于请求本身，不会因先前的准备工作而减少。
    - 失败会回退到下一个条目。

    提供商身份验证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：已弃用的兼容性标志。已完成的异步媒体任务仍由请求者会话中介处理，因此智能体会收到结果、决定如何告知用户，并在源投递需要时使用消息工具。

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

控制哪些会话可被会话工具（`sessions_list`、`sessions_history`、`sessions_send`）作为目标。

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
  <Accordion title="可见性作用域">
    - `self`：仅当前会话键。
    - `tree`：当前会话 + 由当前会话生成的会话（子智能体）。
    - `agent`：属于当前智能体 ID 的任何会话（如果你在同一智能体 ID 下运行按发送者划分的会话，可能包含其他用户）。
    - `all`：任何会话。跨智能体定向仍需要 `tools.agentToAgent`。
    - 沙箱钳制：当当前会话处于沙箱隔离状态且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。
    - 当不是 `all` 时，`sessions_list` 会包含一个紧凑的 `visibility` 字段，
      描述有效模式，并警告当前作用域之外的一些会话可能会被
      省略。

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
  <Accordion title="附件说明">
    - 附件需要 `enabled: true`。
    - 子智能体附件会被物化到子工作区的 `.openclaw/attachments/<uuid>/`，并带有 `.manifest.json`。
    - ACP 附件仅支持图像，并在通过相同的文件数量、单文件字节数和总字节数限制后内联转发到 ACP 运行时。
    - 附件内容会自动从转录持久化中遮盖。
    - Base64 输入会通过严格的字母表/填充检查和解码前大小保护进行验证。
    - 子智能体附件文件权限为目录 `0700`、文件 `0600`。
    - 子智能体清理遵循 `cleanup` 策略：`delete` 始终移除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留附件。

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
- 默认值：`false`，除非 `agents.defaults.embeddedAgent.executionContract`（或每智能体覆盖）被设置为 OpenAI 或 OpenAI Codex GPT-5 系列运行的 `"strict-agentic"`。设置为 `true` 可在该作用域之外强制启用该工具，或设置为 `false` 可即使对严格智能体式 GPT-5 运行也保持关闭。
- 启用后，系统提示还会添加使用指南，使模型仅将其用于实质性工作，并最多保持一个步骤为 `in_progress`。

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
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：生成的子智能体的默认模型。如果省略，子智能体会继承调用者的模型。
- `allowAgents`：当请求者智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 已配置目标智能体 ID 的默认允许列表（`["*"]` = 任何已配置目标；默认值：仅同一智能体）。其智能体配置已被删除的陈旧条目会被 `sessions_spawn` 拒绝，并从 `agents_list` 中省略；运行 `openclaw doctor --fix` 以清理它们。
- `runTimeoutSeconds`：`sessions_spawn` 的默认超时（秒）。`0` 表示无超时。
- `announceTimeoutMs`：Gateway 网关 `agent` 公告投递尝试的每次调用超时（毫秒）。默认值：`120000`。瞬时重试可能会让总公告等待时间长于一次配置的超时。
- 每子智能体工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

提供商插件会发布自己的模型目录行。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

配置自定义/本地提供商 `baseUrl` 也是模型 HTTP 请求的窄网络信任决策：OpenClaw 允许该精确的 `scheme://host:port` 源通过受保护的 fetch 路径，而不会添加单独的配置选项或信任其他私有源。

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
  <Accordion title="身份验证和合并优先级">
    - 对自定义身份验证需求，使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录。
    - 匹配提供商 ID 的合并优先级：
      - 非空的智能体 `models.json` `baseUrl` 值优先。
      - 非空的智能体 `apiKey` 值仅在该提供商未在当前配置/身份验证配置文件上下文中由 SecretRef 管理时优先。
      - 由 SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用为 `ENV_VAR_NAME`，文件/exec 引用为 `secretref-managed`），而不是持久化已解析的密钥。
      - 由 SecretRef 管理的提供商标头值会从源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，文件/exec 引用为 `secretref-managed`）。
      - 空或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
      - 匹配模型的 `contextWindow`/`maxTokens` 使用显式配置和隐式目录值中的较高值。
      - 匹配模型的 `contextTokens` 会在存在时保留显式运行时上限；使用它可在不更改原生模型元数据的情况下限制有效上下文。
      - 提供商插件目录会作为生成的插件拥有目录分片存储在智能体的插件状态下。
      - 当你希望配置完全重写 `models.json` 和活跃插件目录分片时，使用 `models.mode: "replace"`。
      - 标记持久化以源为权威：标记从活跃源配置快照（解析前）写入，而不是从已解析的运行时密钥值写入。

  </Accordion>
</AccordionGroup>

### 提供商字段详情

<AccordionGroup>
  <Accordion title="顶层目录">
    - `models.mode`：提供商目录行为（`merge` 或 `replace`）。
    - `models.providers`：按提供商 ID 键控的自定义提供商映射。
      - 安全编辑：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 进行增量更新。除非传递 `--replace`，否则 `config set` 会拒绝破坏性替换。

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。对于自托管的 `/v1/chat/completions` 后端，例如 MLX、vLLM、SGLang 以及大多数 OpenAI 兼容的本地服务器，使用 `openai-completions`。带有 `baseUrl` 但没有 `api` 的自定义提供商默认使用 `openai-completions`；仅当后端支持 `/v1/responses` 时才设置 `openai-responses`。
    - `models.providers.*.apiKey`：提供商凭证（优先使用 SecretRef/环境变量替换）。
    - `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当模型条目未设置 `contextWindow` 时，此提供商下模型的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当模型条目未设置 `contextTokens` 时，此提供商下模型的默认有效运行时上下文上限。
    - `models.providers.*.maxTokens`：当模型条目未设置 `maxTokens` 时，此提供商下模型的默认输出 token 上限。
    - `models.providers.*.timeoutSeconds`：可选的按提供商配置的模型 HTTP 请求超时时间（秒），包括连接、标头、正文以及总请求中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求中注入 `options.num_ctx`（默认：`true`）。
    - `models.providers.*.authHeader`：在需要时强制通过 `Authorization` 标头传输凭证。
    - `models.providers.*.baseUrl`：上游 API 基础 URL。
    - `models.providers.*.headers`：用于代理/租户路由的额外静态标头。

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖项。

    - `request.headers`：额外标头（与提供商默认值合并）。值接受 SecretRef。
    - `request.auth`：认证策略覆盖项。模式：`"provider-default"`（使用提供商内置认证）、`"authorization-bearer"`（带 `token`）、`"header"`（带 `headerName`、`value`、可选 `prefix`）。
    - `request.proxy`：HTTP 代理覆盖项。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（带 `url`）。两种模式都接受可选的 `tls` 子对象。
    - `request.tls`：直接连接的 TLS 覆盖项。字段：`ca`、`cert`、`key`、`passphrase`（都接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：为 `true` 时，允许模型提供商 HTTP 请求通过提供商 HTTP fetch 防护访问私有、CGNAT 或类似地址范围。自定义/本地提供商基础 URL 已信任精确配置的源，但元数据/link-local 源除外，后者在没有显式选择加入时仍会被阻止。将其设置为 `false` 可退出精确源信任。WebSocket 对标头/TLS 使用相同的 `request`，但不使用该 fetch SSRF 门禁。默认值为 `false`。

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`：显式的提供商模型目录条目。
    - `models.providers.*.models.*.input`：模型输入模态。纯文本模型使用 `["text"]`，原生图像/视觉模型使用 `["text", "image"]`。只有当所选模型标记为支持图像时，图像附件才会注入到智能体轮次中。
    - `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。这会覆盖该模型的提供商级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。这会覆盖提供商级 `contextTokens`；当你想要比模型原生 `contextWindow` 更小的有效上下文预算时使用；当两者不同时，`openclaw models list` 会显示两个值。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选兼容性提示。对于带有非空非原生 `baseUrl`（主机不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 会在运行时将其强制为 `false`。空的/省略的 `baseUrl` 会保留默认 OpenAI 行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：面向仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组展平为普通字符串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：面向严格 OpenAI 兼容聊天端点的可选兼容性提示。为 `true` 时，OpenClaw 会在发送请求前将传出的 Chat Completions 消息对象裁剪为 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：可选的思考载荷提示。对于 Together 风格的 `reasoning.enabled` 使用 `"together"`，对于顶层 `enable_thinking` 使用 `"qwen"`，或者对于支持请求级聊天模板 kwargs 的 Qwen 系列 OpenAI 兼容服务器（例如 vLLM）上的 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。配置后的 vLLM Qwen 模型会为这些格式暴露二元 `/think` 选择（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`：面向 DeepSeek 风格 Chat Completions 后端的可选兼容性提示，这些后端要求重放时先前的 assistant 消息保留 `reasoning_content`。为 `true` 时，OpenClaw 会在传出的 assistant 消息上保留该字段。当接入一个会在剥离 reasoning 后拒绝请求的自定义 DeepSeek 兼容代理时使用。默认值为 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选提供商 ID 过滤器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的后备上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的后备最大输出 token 数。

  </Accordion>
</AccordionGroup>

交互式自定义提供商新手引导会为常见视觉模型 ID 推断图像输入，例如 GPT-4o、Claude、Gemini、Qwen-VL、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V，并跳过已知纯文本系列的额外问题。未知模型 ID 仍会提示是否支持图像。非交互式新手引导使用相同的推断；传入 `--custom-image-input` 可强制使用支持图像的元数据，或传入 `--custom-text-input` 可强制使用纯文本元数据。

### 提供商示例

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    官方外部 `cerebras` 提供商插件可以通过 `openclaw onboard --auth-choice cerebras-api-key` 配置此项。仅在覆盖默认值时使用显式提供商配置。

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
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic 兼容的内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    参见 [Local Models](/zh-CN/gateway/local-models)。简而言之：在高性能硬件上通过 LM Studio Responses API 运行大型本地模型；保留合并的托管模型作为后备。
  </Accordion>
  <Accordion title="MiniMax M3 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
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
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录默认使用 M3，并且也包含 M2.7 变体。在 Anthropic 兼容的流式传输路径上，除非你显式自行设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax M2.x thinking；MiniMax-M3（以及 M3.x）默认保持提供商省略/自适应的 thinking 路径。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。

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

    原生 Moonshot 端点在共享的 `openai-completions` 传输上声明流式传输 usage 兼容性，并且 OpenClaw 会基于端点能力而不只是内置提供商 ID 来启用该能力。

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

    设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。对 Zen 目录使用 `opencode/...` 引用，或对 Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

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

    Base URL 应省略 `/v1`（Anthropic 客户端会追加它）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

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

    设置 `ZAI_API_KEY`。模型引用使用规范的 `zai/*` 提供商 ID。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

    - 通用端点：`https://api.z.ai/api/paas/v4`
    - 代码端点（默认）：`https://api.z.ai/api/coding/paas/v4`
    - 对于通用端点，请定义一个带有 Base URL 覆盖的自定义提供商。

  </Accordion>
</AccordionGroup>

---

## 相关内容

- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [配置 — 渠道](/zh-CN/gateway/config-channels)
- [配置参考](/zh-CN/gateway/configuration-reference) — 其他顶层键
- [工具和插件](/zh-CN/tools)

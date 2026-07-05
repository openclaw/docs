---
read_when:
    - 配置 `tools.*` 策略、允许列表或实验性功能
    - 注册自定义提供商或覆盖基础 URL
    - 设置 OpenAI 兼容的自托管端点
sidebarTitle: Tools and custom providers
summary: Tools 配置（策略、实验性开关、提供商支持的工具）和自定义提供商/base-URL 设置
title: 配置 — 工具和自定义提供商
x-i18n:
    generated_at: "2026-07-05T11:17:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5205ff85e78d2eaa8f4eeced902e86383b9f92d8d1762b64d54f1e10c9bc379b
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` 配置键和自定义提供商 / base-URL 设置。对于智能体、渠道和其他顶级配置键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 工具

### 工具配置文件

`tools.profile` 会在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地新手引导会在未设置时将新的本地配置默认设为 `tools.profile: "coding"`（保留现有的显式配置文件）。
</Note>

| 配置文件 | 包含 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal` | 仅 `session_status` |
| `coding` | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop`、`image`、`image_generate`、`music_generate`、`video_generate` |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status` |
| `full` | 无限制（与未设置相同） |

`coding` 和 `messaging` 还会隐式允许 `bundle-mcp`（已配置的 MCP 服务器）。

### 工具组

| 组 | 工具 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime` | `exec`、`process`、`code_execution`（`bash` 可作为 `exec` 的别名） |
| `group:fs` | `read`、`write`、`edit`、`apply_patch` |
| `group:sessions` | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory` | `memory_search`、`memory_get` |
| `group:web` | `web_search`、`x_search`、`web_fetch` |
| `group:ui` | `browser`、`canvas` |
| `group:automation` | `heartbeat_respond`、`cron`、`gateway` |
| `group:messaging` | `message` |
| `group:nodes` | `nodes` |
| `group:agents` | `agents_list`、`get_goal`、`create_goal`、`update_goal`、`update_plan`、`skill_workshop` |
| `group:media` | `image`、`image_generate`、`music_generate`、`video_generate`、`tts` |
| `group:openclaw` | 上述所有内置工具，但不包括 `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas`（不包括插件工具） |
| `group:plugins` | 已加载插件拥有的工具，包括通过 `bundle-mcp` 暴露的已配置 MCP 服务器 |

### 沙箱工具策略中的 MCP 和插件工具

已配置的 MCP 服务器会作为 `bundle-mcp` 插件 ID 下由插件拥有的工具暴露。普通工具配置文件可以允许它们，但 `tools.sandbox.tools` 是沙箱隔离会话的额外关卡。如果沙箱模式为 `"all"` 或 `"non-main"`，当 MCP/插件工具应该可见时，请在沙箱工具允许列表中包含以下条目之一：

- `bundle-mcp`，用于来自 `mcp.servers` 的 OpenClaw 管理的 MCP 服务器
- 特定原生插件的插件 ID
- `group:plugins`，用于所有已加载的插件拥有的工具
- 精确的 MCP 服务器工具名称或服务器 glob，例如 `outlook__send_mail` 或 `outlook__*`，当你只想要一个服务器时使用

服务器 glob 使用提供商安全的 MCP 服务器前缀，不一定是原始 `mcp.servers` 键。非 `[A-Za-z0-9_-]` 字符会变成 `-`，不以字母开头的名称会获得 `mcp-` 前缀，较长或重复的前缀可能会被截断或追加后缀；例如，`mcp.servers["Outlook Graph"]` 使用类似 `outlook-graph__*` 的 glob。

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

如果没有该沙箱层条目，MCP 服务器仍可成功加载，但其工具会在提供商请求之前被过滤。使用 `openclaw doctor` 捕获 `mcp.servers` 中 OpenClaw 管理的服务器的这种形态。从内置插件清单或 Claude `.mcp.json` 加载的 MCP 服务器使用同一个沙箱关卡，但此诊断尚未枚举这些来源；如果它们的工具在沙箱隔离轮次中消失，请使用相同的允许列表条目。

### `tools.codeMode`

`tools.codeMode` 启用通用 OpenClaw 代码模式表面。当为带工具的运行启用时，模型只会看到 `exec` 和 `wait`；普通 OpenClaw 工具会移到沙箱内 `tools.*` 目录桥接之后，MCP 工具可通过生成的 `MCP` 命名空间使用。

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

在代码模式中，MCP 声明会通过只读虚拟 API 文件表面暴露。Guest 代码可以调用 `API.list("mcp")` 和 `API.read("mcp/<server>.d.ts")`，在调用 `MCP.<server>.<tool>()` 之前检查 TypeScript 风格的签名。请参阅[代码模式](/zh-CN/reference/code-mode)了解运行时契约、限制和调试步骤。

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是独立的工具 ID。`allow: ["write"]` 对兼容模型也会启用 `apply_patch`，但 `deny: ["write"]` 不会拒绝 `apply_patch`。要阻止所有文件变更，请拒绝 `group:fs`，或显式列出每个会变更文件的工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` 和 `alsoAllow` 不能在同一作用域（`tools`、`tools.byProvider.<id>`、`agents.list[].tools`）同时设置，配置验证会拒绝。请将 `alsoAllow` 条目合并到 `allow`，或者移除 `allow`，改用 `profile` + `alsoAllow`。
</Note>

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

键使用显式前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。渠道 ID 是规范的 OpenClaw ID；`teams` 等别名会规范化为 `msteams`。旧版无前缀键仅按 `id:` 接受。匹配顺序为 channel+id、id、e164、username、name，然后是通配符。

每智能体的 `agents.list[].tools.toolsBySender` 在匹配时会覆盖全局发送者匹配，即使策略为空 `{}` 也是如此。

### `tools.elevated`

控制沙箱外的提升权限 Exec 访问：

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

- 每智能体覆盖（`agents.list[].tools.elevated`）只能进一步收紧限制。
- `/elevated on|off|ask|full` 按会话存储状态；内联指令只应用于单条消息。
- 提升权限的 `exec` 会绕过沙箱隔离，并使用配置的逃逸路径（默认是 `gateway`，或在 exec 目标为 `node` 时使用 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

除 `applyPatch.allowModels` 外，所示值均为默认值（默认情况下为空/未设置，表示任何兼容模型都可以使用 `apply_patch`）。`approvalRunningNoticeMs` 会在基于审批的 exec 长时间运行时发出运行中通知；`0` 会禁用它。

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 可启用检测。设置可以在全局 `tools.loopDetection` 中定义，并可在每智能体的 `agents.list[].tools.loopDetection` 中覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  为循环分析保留的最大工具调用历史记录。
</ParamField>
<ParamField path="warningThreshold" type="number">
  针对重复无进展模式发出警告的阈值。
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  在发生这么多次未命中后，阻止重复调用同一个不可用/未知工具名称。
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
  对已知轮询工具（`process.poll`、`command_status` 等）的无进展行为发出警告/阻止。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替出现的无进展成对模式发出警告/阻止。
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  自动压缩后防护保持启用的尝试次数；如果智能体在该窗口内重复相同的（工具、参数、结果），则中止。
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
        apiKey: "brave_api_key", // or BRAVE_API_KEY env (Brave provider)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

除 `provider` 和 `userAgent` 外，显示的值都是默认值。`maxResponseBytes` 会限制在 32000–10000000；`maxChars` 会限制到 `maxCharsCap`（提高 `maxCharsCap` 以允许更大的响应）。

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

`concurrency`（默认 `2`）、`audio.maxBytes`（默认 20 MB）和 `video.maxBytes`（默认 50 MB）显示的是它们的默认值；`image.maxBytes` 默认是 10 MB。按能力划分的请求超时默认值：图像/音频为 `60` 秒，视频为 `120` 秒。

<AccordionGroup>
  <Accordion title="Media model entry fields">
    **提供商条目**（`type: "provider"` 或省略）：

    - `provider`：API 提供商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：模型 ID 覆盖
    - `profile` / `preferredProfile`：`auth-profiles.json` 配置文件选择

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 会把已弃用的 `{input}` 占位符迁移到 `{{MediaPath}}`）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。每个提供商插件都会声明自己的默认能力集；例如，内置 `openai` 提供商默认支持图像+音频，`anthropic`/`minimax` 支持图像，`google` 支持图像+音频+视频，`groq` 支持音频。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：按条目覆盖。
    - 当智能体调用显式的 `image` 工具时，`tools.media.image.timeoutSeconds` 以及匹配的图像模型 `timeoutSeconds` 条目也会适用。对于图像理解，此超时适用于请求本身，不会被较早的准备工作缩短。
    - 失败会回退到下一个条目。

    提供商认证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：已弃用的兼容性标志。已完成的异步媒体任务仍由请求方会话中介处理，这样智能体会接收结果，决定如何告知用户，并在源端投递需要时使用消息工具。

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

控制哪些会话可以被会话工具（`sessions_list`、`sessions_history`、`sessions_send`）作为目标。

默认：`tree`（当前会话 + 由它生成的会话，例如子智能体）。

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
    - `tree`：当前会话 + 由当前会话生成的会话（子智能体）。
    - `agent`：属于当前智能体 ID 的任意会话（如果你在同一智能体 ID 下运行按发送方划分的会话，可能包含其他用户）。
    - `all`：任意会话。跨智能体定向仍需要 `tools.agentToAgent`。
    - 沙箱限制：当当前会话已沙箱隔离，并且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"`（默认值）时，即使 `tools.sessions.visibility="all"`，可见性也会被强制为 `tree`。
    - 当不是 `all` 时，`sessions_list` 会包含一个紧凑的 `visibility` 字段，
      描述有效模式，并警告当前范围之外的某些会话可能会
      被省略。

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
    - 附件需要 `enabled: true`。
    - 子智能体附件会在子工作区中实体化到 `.openclaw/attachments/<uuid>/`，并带有 `.manifest.json`。
    - ACP 附件仅支持图像，并会在通过相同的文件数量、单文件字节数和总字节数限制后，内联转发到 ACP 运行时。
    - 附件内容会自动从转录持久化中脱敏。
    - Base64 输入会通过严格的字母表/填充检查和解码前大小保护进行验证。
    - 子智能体附件文件权限：目录为 `0700`，文件为 `0600`。
    - 子智能体清理遵循 `cleanup` 策略：`delete` 始终删除附件；只有当 `retainOnSessionKeep: true` 时，`keep` 才会保留附件。

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
- 默认：`false`，除非 `agents.defaults.embeddedAgent.executionContract`（或按智能体覆盖）针对使用 `openai` 提供商运行的 GPT-5 系列模型 ID 设置为 `"strict-agentic"`（这也涵盖 OpenAI Codex CLI 运行，因为 Codex 认证/模型路由位于 `openai` 提供商下）。设置为 `true` 可在该范围之外强制启用此工具，或设置为 `false` 即使在严格智能体式 GPT-5 运行中也保持关闭。
- 启用后，系统提示还会添加使用指导，使模型只在实质性工作中使用它，并且最多保持一个步骤为 `in_progress`。

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

- `model`：生成的子智能体的默认模型。如果省略，子智能体会继承调用方的模型。
- `allowAgents`：当请求方智能体未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 可用的已配置目标智能体 ID 默认允许列表（`["*"]` = 任意已配置目标；默认：仅同一智能体）。其智能体配置已被删除的陈旧条目会被 `sessions_spawn` 拒绝，并从 `agents_list` 中省略；运行 `openclaw doctor --fix` 清理它们。
- `maxConcurrent`：最大并发子智能体运行数。默认：`8`。
- `runTimeoutSeconds`：当调用方未传入自己的覆盖时，`sessions_spawn` 的超时（秒）。默认：`0`（无超时）；上面显示的 `900` 是常见的选择启用值，不是内置默认值。
- `announceTimeoutMs`：Gateway 网关 `agent` 公告投递尝试的每次调用超时（毫秒）。默认：`120000`。瞬时重试可能会让总公告等待时间长于一个已配置超时。
- `archiveAfterMinutes`：子智能体会话完成后，经过多少分钟自动归档。默认：`60`；`0` 会禁用自动归档。
- 按子智能体配置的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

提供商插件会发布自己的模型目录行。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

配置自定义/本地提供商 `baseUrl` 也是模型 HTTP 请求的窄范围网络信任决策：OpenClaw 允许该确切的 `scheme://host:port` 源通过受保护的 fetch 路径，而不会添加单独的配置选项，也不会信任其他私有源。

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | etc.
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
  <Accordion title="Auth and merge precedence">
    - 对自定义认证需求，使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR` 覆盖智能体配置根目录。
    - 匹配提供商 ID 的合并优先级：
      - 非空的智能体 `models.json` `baseUrl` 值优先。
      - 只有当该提供商在当前配置/认证配置文件上下文中不由 SecretRef 管理时，非空的智能体 `apiKey` 值才优先。
      - SecretRef 管理的提供商 `apiKey` 值会从源标记刷新（环境变量引用为 `ENV_VAR_NAME`，文件/执行引用为 `secretref-managed`），而不是持久化已解析的密钥。
      - SecretRef 管理的提供商标头值会从源标记刷新（环境变量引用为 `secretref-env:ENV_VAR_NAME`，文件/执行引用为 `secretref-managed`）。
      - 空的或缺失的智能体 `apiKey`/`baseUrl` 会回退到配置中的 `models.providers`。
      - 匹配模型 `contextWindow`/`maxTokens`：当显式配置值存在且有效（正的有限数字）时，显式配置值优先；否则使用隐式/生成的目录值。
      - 匹配模型 `contextTokens` 遵循同样的显式优先、否则隐式规则；使用它可以在不更改原生模型元数据的情况下限制有效上下文。
      - 提供商插件目录会作为生成的、归插件所有的目录分片，存储在智能体的插件状态下。
      - 当你希望配置完全重写 `models.json` 并跳过合并归插件所有的目录分片时，使用 `models.mode: "replace"`。
      - 标记持久化以源为权威：标记从活跃源配置快照（解析前）写入，而不是从已解析的运行时密钥值写入。

  </Accordion>
</AccordionGroup>

### 提供商字段详情

<AccordionGroup>
  <Accordion title="顶层目录">
    - `models.mode`：提供商目录行为（`merge` 或 `replace`）。
    - `models.providers`：按提供商 id 键控的自定义提供商映射。
      - 安全编辑：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 进行增量更新。除非传入 `--replace`，否则 `config set` 会拒绝破坏性替换。

  </Accordion>
  <Accordion title="提供商连接和凭证">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`openai-chatgpt-responses`、`anthropic-messages`、`google-generative-ai`、`google-vertex`、`github-copilot`、`bedrock-converse-stream`、`ollama`、`azure-openai-responses`）。对于 MLX、vLLM、SGLang 以及大多数 OpenAI 兼容本地服务器等自托管 `/v1/chat/completions` 后端，请使用 `openai-completions`。带有 `baseUrl` 但没有 `api` 的自定义提供商默认使用 `openai-completions`；仅当后端支持 `/v1/responses` 时才设置 `openai-responses`。
    - `models.providers.*.apiKey`：提供商凭据（优先使用 SecretRef/env 替换）。
    - `models.providers.*.auth`：身份验证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当模型条目未设置 `contextWindow` 时，此提供商下模型的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当模型条目未设置 `contextTokens` 时，此提供商下模型的默认有效运行时上下文上限。
    - `models.providers.*.maxTokens`：当模型条目未设置 `maxTokens` 时，此提供商下模型的默认输出 token 上限。
    - `models.providers.*.timeoutSeconds`：可选的按提供商配置的模型 HTTP 请求超时时间（秒），包括连接、标头、正文和总请求中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，向请求中注入 `options.num_ctx`（默认：`true`）。
    - `models.providers.*.authHeader`：在需要时强制通过 `Authorization` 标头传输凭据。
    - `models.providers.*.baseUrl`：上游 API 基础 URL。
    - `models.providers.*.headers`：用于代理/租户路由的额外静态标头。

  </Accordion>
  <Accordion title="请求传输覆盖项">
    `models.providers.*.request`：模型提供商 HTTP 请求的传输覆盖项。

    - `request.headers`：额外标头（与提供商默认值合并）。值接受 SecretRef。
    - `request.auth`：身份验证策略覆盖。模式：`"provider-default"`（使用提供商内置身份验证）、`"authorization-bearer"`（带 `token`）、`"header"`（带 `headerName`、`value`，可选 `prefix`）。
    - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（带 `url`）。两种模式都接受可选的 `tls` 子对象。
    - `request.tls`：直接连接的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（都接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：当为 `true` 时，允许模型提供商 HTTP 请求通过提供商 HTTP fetch 防护访问私有、CGNAT 或类似网段。自定义/本地提供商基础 URL 已信任精确配置的源，但元数据/link-local 源除外，除非显式选择加入，否则仍会被阻止。将此项设为 `false` 可选择退出精确源信任。WebSocket 对标头/TLS 使用相同的 `request`，但不使用该 fetch SSRF 门控。默认 `false`。

  </Accordion>
  <Accordion title="模型目录条目">
    - `models.providers.*.models`：显式提供商模型目录条目。
    - `models.providers.*.models.*.input`：模型输入模态。纯文本模型使用 `["text"]`，原生图像/视觉模型使用 `["text", "image"]`。仅当所选模型标记为支持图像时，图像附件才会注入到智能体轮次中。
    - `models.providers.*.models.*.contextWindow`：原生模型上下文窗口元数据。这会覆盖该模型的提供商级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的运行时上下文上限。这会覆盖提供商级 `contextTokens`；当你想要比模型原生 `contextWindow` 更小的有效上下文预算时使用；当两者不同时，`openclaw models list` 会显示两个值。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选的兼容性提示。对于带有非空非原生 `baseUrl`（主机不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 会在运行时强制将其设为 `false`。空/省略的 `baseUrl` 保持默认 OpenAI 行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：针对仅支持字符串的 OpenAI 兼容聊天端点的可选兼容性提示。当为 `true` 时，OpenClaw 会在发送请求前将纯文本 `messages[].content` 数组展平为普通字符串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：针对严格 OpenAI 兼容聊天端点的可选兼容性提示。当为 `true` 时，OpenClaw 会在发送请求前将传出的 Chat Completions 消息对象剥离为 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：可选的思考负载提示。对于 Together 风格的 `reasoning.enabled` 使用 `"together"`，对于顶层 `enable_thinking` 使用 `"qwen"`，或者对于支持请求级 chat-template kwargs 的 Qwen 系列 OpenAI 兼容服务器（例如 vLLM）上的 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。已配置的 vLLM Qwen 模型会为这些格式公开二元 `/think` 选择（`off`、`on`）。
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`：针对 DeepSeek 风格 Chat Completions 后端的可选兼容性提示，这类后端要求重放时先前的 assistant 消息保留 `reasoning_content`。当为 `true` 时，OpenClaw 会在传出的 assistant 消息上保留该字段。为自定义 DeepSeek 兼容代理接线且该代理会在推理被剥离后拒绝请求时使用。默认 `false`。

  </Accordion>
  <Accordion title="Amazon Bedrock 发现">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开启/关闭隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：用于发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：用于定向发现的可选提供商 id 过滤器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：已发现模型的备用上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：已发现模型的备用最大输出 token 数。

  </Accordion>
</AccordionGroup>

交互式自定义提供商新手引导会根据已知视觉模型 id 模式推断图像输入支持，包括 GPT-4o/GPT-4.1/GPT-5+、`o1`/`o3`/`o4` 推理系列、Claude、Gemini、任何以 `-vl` 结尾的 id（Qwen-VL 及类似模型），以及 LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V 等命名系列；对于已知纯文本系列（Llama、DeepSeek、Mistral/Mixtral、Kimi/Moonshot、Codestral、Devstral、Phi、QwQ、CodeLlama，以及没有 vl/vision 后缀的裸 Qwen id），它会跳过额外问题。未知模型 ID 仍会提示确认图像支持。非交互式新手引导使用相同推断；传入 `--custom-image-input` 可强制使用支持图像的元数据，或传入 `--custom-text-input` 可强制使用纯文本元数据。

### 提供商示例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
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

    Cerebras 使用 `cerebras/zai-glm-4.7`；Z.AI 直连使用 `zai/glm-4.7`。

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
  <Accordion title="本地模型（LM Studio）">
    参见[本地模型](/zh-CN/gateway/local-models)。简而言之：在性能足够的硬件上通过 LM Studio Responses API 运行大型本地模型；保留已合并的托管模型作为回退。
  </Accordion>
  <Accordion title="MiniMax M3（直连）">
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

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录默认使用 M3，并且也包含 M2.7 变体。在 Anthropic 兼容流式路径上，除非你显式设置 `thinking`，否则 OpenClaw 默认会禁用 MiniMax M2.x 思考；MiniMax-M3（以及 M3.x）默认保持在提供商的省略/自适应思考路径上。`/fast on` 或 `params.fastMode: true` 会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

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

    对于中国端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端点在共享的 `openai-completions` 传输协议上声明兼容流式用量，OpenClaw 会根据端点能力而不只是内置提供商 ID 来启用这一点。

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
    - 编程端点：`https://api.z.ai/api/coding/paas/v4`
    - 默认的 `zai-api-key` 凭证选项会探测你的密钥并自动检测它属于哪个端点（如果检测结果不确定，则回退到提示，默认为 Global）。也提供专用的 CN 和 Coding-Plan 凭证选项用于显式选择。
    - 对于通用端点，请定义一个带有 Base URL 覆盖的自定义提供商。

  </Accordion>
</AccordionGroup>

---

## 相关

- [配置 — 智能体](/zh-CN/gateway/config-agents)
- [配置 — 渠道](/zh-CN/gateway/config-channels)
- [配置参考](/zh-CN/gateway/configuration-reference) — 其他顶层键
- [工具和插件](/zh-CN/tools)

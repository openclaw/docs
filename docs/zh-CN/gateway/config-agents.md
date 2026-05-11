---
read_when:
    - 调优智能体默认值（模型、思考、工作区、Heartbeat、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息递送和 Talk 模式行为
summary: 智能体默认值、多智能体路由、会话、消息和 Talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-05-11T20:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

智能体范围的配置键位于 `agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下。关于渠道、工具、Gateway 网关运行时以及其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示的 Runtime 行中。如果未设置，OpenClaw 会从工作区向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

可选的默认 Skills 允许列表，适用于未设置 `agents.list[].skills` 的智能体。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- 省略 `agents.defaults.skills` 时，默认不限制 Skills。
- 省略 `agents.list[].skills` 时，会继承默认值。
- 设置 `agents.list[].skills: []` 表示没有 Skills。
- 非空的 `agents.list[].skills` 列表是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

跳过创建选定的可选工作区文件，同时仍写入必需的引导文件。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区引导文件注入系统提示。默认值：`"always"`。

- `"continuation-skip"`：安全的延续轮次（在一次完成的助手回复之后）会跳过工作区引导重新注入，从而减少提示大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每一轮都禁用工作区引导和上下文文件注入。仅适用于完全自行掌控提示生命周期的智能体（自定义上下文引擎、会构建自身上下文的原生运行时，或专门的无引导工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件在截断前的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件合计注入的最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制引导上下文被截断时，智能体可见的系统提示通知。默认值：`"once"`。

- `"off"`：从不向系统提示注入截断通知文本。
- `"once"`：按每个唯一的截断签名注入一次简短通知（推荐）。
- `"always"`：只要存在截断，就在每次运行时注入简短通知。

详细的原始/注入计数和配置调优字段会保留在上下文/状态报告和日志等诊断信息中；常规 WebChat 用户/运行时上下文只会获得简短的恢复通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算所有权映射

OpenClaw 有多个高容量提示/上下文预算，它们会按子系统有意拆分，而不是全部经过一个通用旋钮。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的重置/启动模型运行前奏，包括最近的每日 `memory/*.md` 文件。裸聊天 `/new` 和 `/reset` 命令会在不调用模型的情况下确认重置。
- `skills.limits.*`：
  注入系统提示的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界的运行时摘录和注入的运行时自有块。
- `memory.qmd.limits.*`：
  索引记忆搜索片段和注入大小。

仅当某个智能体需要不同预算时，才使用匹配的单智能体覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制重置/启动模型运行时在首轮注入的启动前奏。裸聊天 `/new` 和 `/reset` 命令会在不调用模型的情况下确认重置，因此不会加载此前奏。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

有界运行时上下文表面的共享默认值。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：在添加截断元数据和延续通知之前，默认的 `memory_get` 摘录上限。
- `memoryGetDefaultLines`：省略 `lines` 时，默认的 `memory_get` 行窗口。
- `toolResultMaxChars`：实时工具结果上限，用于持久化结果和溢出恢复。
- `postCompactionMaxChars`：压缩后刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 旋钮的单智能体覆盖。省略的字段会从 `agents.defaults.contextLimits` 继承。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系统提示的紧凑 Skills 列表全局上限。这不影响按需读取 `SKILL.md` 文件。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示预算的单智能体覆盖。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在提供商调用之前，转写记录/工具图像块中图像最长边的最大像素尺寸。默认值：`1200`。

较低的值通常会减少截图密集型运行的视觉 token 用量和请求载荷大小。较高的值会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统提示上下文中的时区（不是消息时间戳）。回退为主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示中的时间格式。默认值：`auto`（操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式仅设置主模型。
  - 对象形式设置主模型以及有序的故障转移模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径用作其视觉模型配置。
  - 当选定模型或默认模型无法接受图片输入时，也用作回退路由。
  - 优先使用显式的 `provider/model` 引用。为兼容性也接受裸 ID；如果裸 ID 在 `models.providers.*.models` 中唯一匹配一个已配置且支持图片的条目，OpenClaw 会将其限定到该提供商。存在歧义的已配置匹配项需要显式的提供商前缀。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享的图片生成能力以及未来任何生成图片的工具/插件界面使用。
  - 典型值：用于原生 Gemini 图片生成的 `google/gemini-3.1-flash-image-preview`，用于 fal 的 `fal/fal-ai/flux/dev`，用于 OpenAI Images 的 `openai/gpt-image-2`，或用于透明背景 OpenAI PNG/WebP 输出的 `openai/gpt-image-1.5`。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图片生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享的音乐生成能力和内置的 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享的视频生成能力和内置的 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
  - 内置的 Qwen 视频生成提供商最多支持 1 个输出视频、1 张输入图片、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，然后回退到解析后的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传递 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中提取回退模式考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细程度。取值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要和进度草稿工具行的详情模式。取值：`"explain"`（默认，紧凑的人类可读标签）或 `"raw"`（可用时追加原始命令/详情）。每个智能体的 `agents.list[].toolProgressDetail` 会覆盖此默认值。
- `reasoningDefault`：智能体的默认推理可见性。取值：`"off"`、`"on"`、`"stream"`。每个智能体的 `agents.list[].reasoningDefault` 会覆盖此默认值。只有在未设置逐消息或会话推理覆盖项时，已配置的推理默认值才会应用于 owner、授权发送者或 operator-admin Gateway 网关上下文。
- `elevatedDefault`：智能体的默认提升输出级别。取值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如通过 OpenAI API key 或 Codex OAuth 访问时使用 `openai/gpt-5.5`）。如果省略提供商，OpenClaw 会先尝试别名，然后为该精确模型 ID 尝试唯一的已配置提供商匹配项，最后才回退到已配置的默认提供商（这是已弃用的兼容行为，因此应优先使用显式 `provider/model`）。如果该提供商不再暴露已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露过期的已移除提供商默认值。
- `models`：已配置的模型目录以及 `/model` 的允许列表。每个条目都可以包含 `alias`（快捷方式）和 `params`（特定于提供商，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 条目，例如 `"openai-codex/*": {}` 或 `"vllm/*": {}`，可以显示所选提供商的所有已发现模型，而无需手动列出每个模型 ID。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传递 `--replace`，否则 `config set` 会拒绝会移除现有允许列表条目的替换。
  - 提供商作用域的配置/新手引导流程会把选定的提供商模型合并到此映射中，并保留已配置的其他无关提供商。
  - 对于直接 OpenAI Responses 模型，服务器端压缩会自动启用。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务器端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有模型的全局默认提供商参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（逐模型）覆盖，然后 `agents.list[].params`（匹配的智能体 ID）按键覆盖。详情参见 [Prompt Caching](/zh-CN/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，extra body 优先；非原生 completions 路由之后仍会剥离仅 OpenAI 支持的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容的聊天模板参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于关闭 thinking 的 `vllm/nemotron-3-*`，内置 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式 `chat_template_kwargs` 会覆盖生成的默认值，而 `extra_body.chat_template_kwargs` 仍具有最终优先级。对于 vLLM Qwen thinking 控制，在该模型条目上将 `params.qwenThinkingFormat` 设置为 `"chat-template"` 或 `"top-level"`。
- `compat.thinkingFormat`：OpenAI 兼容的 thinking 载荷样式。对 Qwen 风格的顶层 `enable_thinking` 使用 `"qwen"`，或在支持请求级聊天模板 kwargs 的 Qwen 系列后端（例如 vLLM）上，对 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 会将禁用的 thinking 映射为 `false`，将启用的 thinking 映射为 `true`。
- `compat.supportedReasoningEfforts`：逐模型的 OpenAI 兼容推理强度列表。对于真正接受它的自定义端点，包含 `"xhigh"`；随后 OpenClaw 会在命令菜单、Gateway 网关会话行、会话补丁验证、智能体 CLI 验证以及该已配置提供商/模型的 `llm-task` 验证中暴露 `/think xhigh`。当后端需要针对某个规范级别使用特定于提供商的值时，使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：仅 Z.AI 可选启用的保留 thinking。启用且 thinking 开启时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放之前的 `reasoning_content`；参见 [Z.AI thinking 和保留 thinking](/zh-CN/providers/zai#thinking-and-preserved-thinking)。
- `localService`：可选的提供商级进程管理器，用于本地/自托管模型服务器。当所选模型属于该提供商时，OpenClaw 会探测 `healthUrl`（或 `baseUrl + "/models"`），如果端点不可用，则用 `args` 启动 `command`，最多等待 `readyTimeoutMs`，然后发送模型请求。`command` 必须是绝对路径。`idleStopMs: 0` 会让进程保持运行直到 OpenClaw 退出；正值会在对应毫秒数的空闲后停止由 OpenClaw 生成的进程。参见 [本地模型服务](/zh-CN/gateway/local-model-services)。
- 运行时策略属于提供商或模型，不属于 `agents.defaults`。提供商范围规则使用 `models.providers.<provider>.agentRuntime`，模型特定规则使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。官方 OpenAI provider 上的 OpenAI 智能体模型默认选择 Codex。
- 修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及回退添加/移除命令）会保存规范对象形式，并在可能时保留现有回退列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话仍会串行化）。默认值：4。

### 运行时策略

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`：`"auto"`、`"pi"`、已注册的插件 harness ID，或受支持的 CLI 后端别名。内置 Codex 插件注册 `codex`；内置 Anthropic 插件提供 `claude-cli` CLI 后端。
- `id: "auto"` 允许已注册的插件 harness 声明支持的轮次，并在没有匹配 harness 时使用 PI。显式插件运行时（例如 `id: "codex"`）要求该 harness 存在，并在不可用或失败时闭合失败。
- 整个智能体范围的运行时键是旧版机制。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、会话运行时固定项以及 `OPENCLAW_AGENT_RUNTIME` 会被运行时选择忽略。运行 `openclaw doctor --fix` 移除过期值。
- OpenAI 智能体模型默认使用 Codex harness；当你想显式指定时，提供商/模型 `agentRuntime.id: "codex"` 仍然有效。
- 对于 Claude CLI 部署，优先使用 `model: "anthropic/claude-opus-4-7"` 加模型作用域的 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/claude-opus-4-7` 模型引用仍可兼容使用，但新配置应保持提供商/模型选择的规范形式，并将执行后端放在提供商/模型运行时策略中。
- 这仅控制文本智能体轮次执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用各自的提供商/模型设置。

**内置别名简写**（仅当模型位于 `agents.defaults.models` 中时适用）：

| 别名                | 模型                                   |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 以支持工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可将其禁用。
Anthropic Claude 4.6 模型在未设置显式思考级别时默认使用 `adaptive` 思考。

### `agents.defaults.cliBackends`

用于纯文本后备运行（无工具调用）的可选 CLI 后端。适合作为 API 提供商失败时的备份。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本优先；工具始终禁用。
- 设置 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时，支持图像透传。
- `reseedFromRawTranscriptWhenUncompacted: true` 允许后端在第一个压缩摘要存在之前，从有界的原始 OpenClaw 转录尾部恢复安全失效的会话。凭证配置文件或凭证纪元变更仍然绝不会进行原始重播种。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个由 OpenClaw 组装的系统提示。可在默认级别（`agents.defaults.systemPromptOverride`）或按智能体（`agents.list[].systemPromptOverride`）设置。按智能体的值优先；空值或仅包含空白的值会被忽略。适用于受控提示实验。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

按模型系列应用的、与提供商无关的提示叠加层。GPT-5 系列模型 ID 会跨提供商接收共享行为契约；`personality` 仅控制友好的交互风格层。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（默认）和 `"on"` 会启用友好的交互风格层。
- `"off"` 仅禁用友好层；带标签的 GPT-5 行为契约仍保持启用。
- 当这个共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

周期性 Heartbeat 运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API 密钥认证）或 `1h`（OAuth 认证）。设置为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，会从系统提示中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认值：`true`。
- `suppressToolErrorWarnings`：为 true 时，会在 Heartbeat 运行期间抑制工具错误警告载荷。
- `timeoutSeconds`：Heartbeat 智能体轮次在被中止前允许的最长秒数。保持未设置则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许直接目标投递。`block` 抑制直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，Heartbeat 运行使用轻量引导上下文，并且仅保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 Heartbeat 都在没有先前对话历史的新会话中运行。隔离模式与 cron `sessionTarget: "isolated"` 相同。将每次 Heartbeat 的令牌成本从约 100K 降低到约 2-5K 令牌。
- `skipWhenBusy`：为 true 时，Heartbeat 运行会在额外忙碌通道上延后：子智能体或嵌套命令工作。即使没有此标志，Cron 通道也始终会延后 Heartbeat。
- 按智能体：设置 `agents.list[].heartbeat`。当任何智能体定义了 `heartbeat` 时，**只有那些智能体**会运行 Heartbeat。
- Heartbeat 会运行完整智能体轮次——更短的间隔会消耗更多令牌。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（用于长历史的分块摘要）。请参阅[压缩](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩提供商插件的 ID。设置后，会调用该提供商的 `summarize()`，而不是内置 LLM 摘要。失败时回退到内置方式。设置提供商会强制 `mode: "safeguard"`。请参阅[压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：单次压缩操作在 OpenClaw 中止前允许的最长秒数。默认值：`900`。
- `keepRecentTokens`：用于逐字保留最近转录尾部的 Pi 截点预算。显式设置时，手动 `/compact` 会遵循此值；否则手动压缩是硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要时前置内置的不透明标识符保留指导。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：用于 safeguard 摘要的格式异常输出重试检查。在 safeguard 模式下默认启用；设置 `enabled: false` 可跳过审计。
- `midTurnPrecheck`：可选的 Pi 工具循环压力检查。当 `enabled: true` 时，OpenClaw 会在追加工具结果后、下一次模型调用前检查上下文压力。如果上下文已无法容纳，它会在提交提示之前中止当前尝试，并复用现有的预检查恢复路径来截断工具结果，或压缩后重试。适用于 `default` 和 `safeguard` 两种压缩模式。默认：禁用。
- `postCompactionSections`：压缩后要重新注入的可选 AGENTS.md H2/H3 节名称。默认值为 `["Session Startup", "Red Lines"]`；设置为 `[]` 可禁用重新注入。当未设置或显式设置为该默认对时，也会接受较旧的 `Every Session`/`Safety` 标题作为旧版回退。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。当主会话应保持使用一个模型，而压缩摘要应在另一个模型上运行时使用；未设置时，压缩使用会话的主模型。
- `maxActiveTranscriptBytes`：可选字节阈值（`number` 或类似 `"20mb"` 的字符串），当活动 JSONL 超过阈值时，在运行前触发常规本地压缩。需要 `truncateAfterCompaction`，以便成功压缩后可轮转到更小的后继转录。未设置或为 `0` 时禁用。
- `notifyUser`：为 `true` 时，在压缩开始和完成时向用户发送简短通知（例如，“正在压缩上下文...”和“压缩完成”）。默认禁用，以保持压缩静默。
- `memoryFlush`：自动压缩前用于存储持久记忆的静默智能体轮次。当此清理轮次应保留在本地模型上时，将 `model` 设置为精确的提供商/模型，例如 `ollama/qwen3:8b`；该覆盖不会继承活动会话的回退链。当工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 前，从内存上下文中剪除**旧工具结果**。**不会**修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` 启用剪除遍历。
- `ttl` 控制剪除在上一次缓存触碰之后多久可以再次运行。
- 剪除会先对超大的工具结果进行软裁剪，然后在需要时硬清除更旧的工具结果。

**软裁剪**会保留开头 + 结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

注意：

- 图像块绝不会被裁剪/清除。
- 比例按字符计算（近似值），不是精确令牌数。
- 如果助手消息少于 `keepLastAssistants` 条，则跳过剪除。

</Accordion>

请参阅[会话剪除](/zh-CN/concepts/session-pruning)了解行为详情。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才能启用分块回复。
- 渠道覆盖项：`channels.<channel>.blockStreamingCoalesce`（以及按账号的变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500ms。按智能体覆盖：`agents.list[].humanDelay`。

有关行为 + 分块的详细信息，请参阅 [流式传输](/zh-CN/concepts/streaming)。

### 输入状态指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：直接聊天/提及时为 `instant`，未提及的群聊中为 `message`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

请参阅 [输入状态指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南请参阅 [沙箱隔离](/zh-CN/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox details">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：通用的 SSH 支持的远程运行时
- `openshell`：OpenShell 运行时

选择 `backend: "openshell"` 时，运行时特定设置会移至
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域工作区的绝对远程根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在运行时实体化为临时文件的内联内容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略旋钮

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 基于 SecretRef 的 `*Data` 值会在沙箱会话启动前，从活动的 secrets 运行时快照中解析

**SSH 后端行为：**

- 创建或重新创建后，对远程工作区播种一次
- 然后保持远程 SSH 工作区为权威
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：`~/.openclaw/sandboxes` 下的按作用域沙箱工作区
- `ro`：`/workspace` 中的沙箱工作区，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：按会话的容器 + 工作区
- `agent`：每个智能体一个容器 + 工作区（默认）
- `shared`：共享容器和工作区（无跨会话隔离）

**OpenShell 插件配置：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：执行前从本地播种远程，执行后同步回本地；本地工作区保持权威
- `remote`：创建沙箱时播种远程一次，然后保持远程工作区为权威

在 `remote` 模式下，在 OpenClaw 外部进行的主机本地编辑，不会在播种步骤之后自动同步到沙箱中。
传输方式是通过 SSH 进入 OpenShell 沙箱，但插件拥有沙箱生命周期和可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根目录、root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 会被阻止。默认情况下，`"container:<id>"` 也会被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（破窗选项）。

**入站附件** 会暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局绑定和按智能体绑定会合并。

**沙箱隔离的浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 会注入到系统提示词中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，并且 OpenClaw 会发出一个短期有效的 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话把目标设为主机浏览器。
- `network` 默认值为 `openclaw-sandbox-browser`（专用桥接网络）。只有在你明确想要全局桥接连通性时，才设置为 `bridge`。
- `cdpSourceRange` 可选地将容器边界处的 CDP 入口限制为一个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只会将额外主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并针对容器主机调优：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions`（默认启用）
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu`
    默认启用；如果 WebGL/3D 使用需要，可以通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用。
  - 如果你的工作流依赖扩展，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改；设置为 `0` 可使用 Chromium 的
    默认进程限制。
  - 当启用 `noSandbox` 时，还会加上 `--no-sandbox`。
  - 默认值是容器镜像基线；如需更改容器默认值，请使用带自定义
    entrypoint 的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像（从源码 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

对于没有源码 checkout 的 npm 安装，请参阅 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，了解内联 `docker build` 命令。

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 为智能体指定自己的 TTS 提供商、声音、模型、
风格或自动 TTS 模式。智能体块会深度合并到全局
`messages.tts` 之上，因此共享凭证可以保留在一个位置，而各个
智能体只覆盖它们所需的声音或提供商字段。活动智能体的
覆盖会应用于自动语音回复、`/tts audio`、`/tts status` 和
`tts` 智能体工具。有关提供商示例和优先级，请参阅 [文本转语音](/zh-CN/tools/tts#per-agent-voice-overrides)。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的智能体 ID（必填）。
- `default`：设置多个时，第一个生效（会记录警告）。如果没有设置，则列表中的第一项为默认值。
- `model`：字符串形式会为每个智能体设置严格的主模型，且没有模型回退；对象形式 `{ primary }` 也同样严格，除非你添加 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 让该智能体启用回退，或使用 `{ primary, fallbacks: [] }` 明确指定严格行为。只覆盖 `primary` 的 Cron 作业仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：每个智能体的流参数，会合并覆盖 `agents.defaults.models` 中选定的模型条目。使用它为智能体指定 `cacheRetention`、`temperature` 或 `maxTokens` 等覆盖项，而无需复制整个模型目录。
- `tts`：可选的每个智能体文本转语音覆盖项。该块会深度合并到 `messages.tts` 上，因此请将共享的提供商凭证和回退策略保留在 `messages.tts` 中，并且只在这里设置与人格相关的值，例如提供商、语音、模型、风格或自动模式。
- `skills`：可选的每个智能体 Skills 允许列表。如果省略，智能体会在设置了 `agents.defaults.skills` 时继承它；显式列表会替换默认值而不是合并，`[]` 表示不启用 Skills。
- `thinkingDefault`：可选的每个智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当没有设置每条消息或会话覆盖项时，会覆盖此智能体的 `agents.defaults.thinkingDefault`。选定的提供商/模型配置决定哪些值有效；对于 Google Gemini，`adaptive` 会保留提供商拥有的动态思考（Gemini 3/3.1 上省略 `thinkingLevel`，Gemini 2.5 上使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的每个智能体默认推理可见性（`on | off | stream`）。当没有设置每条消息或会话推理覆盖项时，会覆盖此智能体的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：可选的每个智能体快速模式默认值（`true | false`）。当没有设置每条消息或会话快速模式覆盖项时适用。
- `models`：可选的每个智能体模型目录/运行时覆盖项，以完整的 `provider/model` ID 为键。使用 `models["provider/model"].agentRuntime` 配置每个智能体的运行时例外。
- `runtime`：可选的每个智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 和 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：从 `emoji` 派生 `ackReaction`，从 `name`/`emoji` 派生 `mentionPatterns`。
- `subagents.allowAgents`：显式 `sessions_spawn.agentId` 目标的智能体 ID 允许列表（`["*"]` = 任意；默认：仅同一智能体）。当应允许以自身为目标的 `agentId` 调用时，请包含请求方 ID。
- 沙箱继承保护：如果请求方会话处于沙箱隔离中，`sessions_spawn` 会拒绝会以非沙箱隔离方式运行的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关内运行多个隔离的智能体。参见 [Multi-Agent](/zh-CN/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `type`（可选）：普通路由使用 `route`（缺失类型时默认是 route），持久 ACP 对话绑定使用 `acp`。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；渠道专用）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道）
6. 默认智能体

在每一层级内，第一个匹配的 `bindings` 条目生效。

对于 `type: "acp"` 条目，OpenClaw 会按精确的对话身份（`match.channel` + 账号 + `match.peer.id`）解析，并且不使用上面的路由绑定层级顺序。

### 每个智能体访问配置文件

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="No filesystem access (messaging only)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

优先级详情见 [多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

---

## 会话

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session field details">

- **`scope`**：群聊上下文的基础会话分组策略。
  - `per-sender`（默认）：每个发送者在一个渠道上下文中获得隔离的会话。
  - `global`：一个渠道上下文中的所有参与者共享单个会话（仅在有意共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：按发送者 ID 跨渠道隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 ID 映射到带提供商前缀的对端，用于跨渠道会话共享。`/dock_discord` 等停靠命令使用同一映射，将当前会话的回复路由切换到另一个已链接的渠道对端；请参阅[频道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主要重置策略。`daily` 会在 `atHour` 本地时间重置；`idle` 会在 `idleMinutes` 后重置。两者都配置时，先过期者生效。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。Heartbeat、cron 唤醒、exec 通知和 Gateway 网关记账等后台/系统事件写入可以更新 `updatedAt`，但它们不会让每日/空闲会话保持新鲜。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名。
- **`mainKey`**：旧版字段。运行时始终使用 `"main"` 作为主直接聊天桶。
- **`agentToAgent.maxPingPongTurns`**：智能体到智能体交换期间，智能体之间最大往返回复轮次数（整数，范围：`0`-`20`，默认：`5`）。`0` 会禁用乒乓链式回复。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 可作别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个拒绝规则生效。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 应用清理。
  - `pruneAfter`：过期条目的年龄截止时间（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。运行时写入批量清理时，会为生产规模的上限保留一个小的高水位缓冲；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - `rotateBytes`：已弃用并被忽略；`openclaw doctor --fix` 会从旧配置中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留期。默认使用 `pruneAfter`；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会先移除最旧的制品/会话。
  - `highWaterBytes`：预算清理后的可选目标。默认为 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认非活动自动取消聚焦小时数（`0` 禁用；提供商可以覆盖）
  - `maxAgeHours`：默认硬性最大年龄小时数（`0` 禁用；提供商可以覆盖）
  - `spawnSessions`：从 `sessions_spawn` 和 ACP 线程生成创建线程绑定工作会话的默认门控。启用线程绑定时默认为 `true`；提供商/账号可以覆盖。
  - `defaultSpawnContext`：线程绑定生成的默认原生子智能体上下文（`"fork"` 或 `"isolated"`）。默认为 `"fork"`。

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

按渠道/账号覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（最具体者生效）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 派生为 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述             | 示例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 短模型名称       | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称       | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别     | `high`, `low`, `off`        |
| `{identity.name}` | 智能体身份名称   |（与 `"auto"` 相同）         |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认回应

- 默认使用当前智能体的 `identity.emoji`，否则使用 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → 身份回退。
- 作用域：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord、Telegram、WhatsApp 和 iMessage 等支持回应的渠道上，回复后移除确认回应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期状态回应。
  在 Slack 和 Discord 上，未设置时会在确认回应处于活动状态时保持状态回应启用。
  在 Telegram 上，需要显式将其设为 `true` 才能启用生命周期状态回应。

### 入站防抖

将来自同一发送者的快速纯文本消息批处理为单个智能体轮次。媒体/附件会立即刷新。控制命令会绕过防抖。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` 控制默认自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好，`/tts status` 会显示有效状态。
- `summaryModel` 会覆盖 `agents.defaults.model.primary` 以用于自动摘要。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（选择启用）。
- API 密钥会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请包含你想使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 ID 可作为 `microsoft` 的别名。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序为配置，然后是 `OPENAI_TTS_BASE_URL`，再然后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型/语音校验。

---

## Talk

Talk 模式（macOS/iOS/Android）的默认值。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- 配置多个 Talk 提供商时，`talk.provider` 必须匹配 `talk.providers` 中的某个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容。运行 `openclaw doctor --fix` 可将持久化配置重写为 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- `ELEVENLABS_API_KEY` 回退仅在未配置 Talk API 密钥时适用。
- `providers.*.voiceAliases` 允许 Talk 指令使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 辅助程序使用的 Hugging Face 仓库。省略时，macOS 使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会在存在时通过内置 `openclaw-mlx-tts` 辅助程序运行，或通过 `PATH` 上的可执行文件运行；`OPENCLAW_MLX_TTS_BIN` 会覆盖开发用辅助程序路径。
- `consultThinkingLevel` 控制 Control UI Talk 实时 `openclaw_agent_consult` 调用背后的完整 OpenClaw 智能体运行的思考级别。保持未设置可保留正常的会话/模型行为。
- `consultFastMode` 为 Control UI Talk 实时咨询设置一次性快速模式覆盖，而不更改会话的正常快速模式设置。
- `speechLocale` 设置 iOS/macOS Talk 语音识别使用的 BCP 47 区域设置 ID。保持未设置可使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户静默后等待多久再发送转录。未设置时保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）。
- `realtime.instructions` 将面向提供商的系统指令追加到 OpenClaw 的内置实时提示中，因此可以配置语音风格，而不会丢失默认的 `openclaw_agent_consult` 指引。

---

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

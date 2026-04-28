---
read_when:
    - 调整智能体默认值（模型、思考、工作区、心跳、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息投递和 talk-mode 行为
summary: 智能体默认值、多智能体路由、会话、消息和对话配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-04-28T11:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: a664de6b9abf629f31b55927b73610896cf86dafd57cf6708ebbbc9c5e188a0d
    source_path: gateway/config-agents.md
    workflow: 16
---

智能体范围的配置键位于 `agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 下。关于渠道、工具、Gateway 网关运行时以及其他
顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示词的运行时行中。如果未设置，OpenClaw 会从工作区向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

可选的默认 Skills 允许列表，供未设置
`agents.list[].skills` 的智能体使用。

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

- 省略 `agents.defaults.skills`，默认不限制 Skills。
- 省略 `agents.list[].skills` 以继承默认值。
- 设置 `agents.list[].skills: []` 表示没有 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；
  它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区引导文件注入系统提示词。默认值：`"always"`。

- `"continuation-skip"`：安全的续接轮次（在已完成的助手响应之后）会跳过工作区引导的重新注入，从而减少提示词大小。心跳运行和压缩后的重试仍会重建上下文。
- `"never"`：在每个轮次都禁用工作区引导和上下文文件注入。仅用于完全自行掌控提示词生命周期的智能体（自定义上下文引擎、会构建自身上下文的原生运行时，或专门不需要引导的工作流）。心跳和压缩恢复轮次也会跳过注入。

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

跨所有工作区引导文件注入的最大总字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制引导上下文被截断时，智能体可见的警告文本。
默认值：`"once"`。

- `"off"`：从不向系统提示词注入警告文本。
- `"once"`：每个唯一截断签名只注入一次警告（推荐）。
- `"always"`：只要存在截断，每次运行都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算所有权映射

OpenClaw 有多个高容量提示词/上下文预算，并且它们有意按子系统拆分，
而不是全部流经一个通用旋钮。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的重置/启动模型运行前序内容，包括最近的每日
  `memory/*.md` 文件。裸聊天 `/new` 和 `/reset` 命令会在不调用模型的情况下确认重置。
- `skills.limits.*`：
  注入系统提示词的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界运行时摘录和注入的运行时自有块。
- `memory.qmd.limits.*`：
  已索引记忆搜索片段和注入大小。

仅当某个智能体需要不同预算时，才使用匹配的按智能体覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重置/启动模型运行时注入的首轮启动前序内容。
裸聊天 `/new` 和 `/reset` 命令会在不调用模型的情况下确认重置，
因此它们不会加载此前序内容。

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

- `memoryGetMaxChars`：添加截断元数据和续接提示前，默认的 `memory_get` 摘录上限。
- `memoryGetDefaultLines`：省略 `lines` 时，默认的 `memory_get` 行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：压缩后刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 旋钮的按智能体覆盖项。省略的字段会继承自
`agents.defaults.contextLimits`。

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

注入系统提示词的紧凑 Skills 列表全局上限。这不会影响按需读取 `SKILL.md` 文件。

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

Skills 提示词预算的按智能体覆盖项。

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

在调用提供商之前，转录/工具图像块中最长图像边的最大像素尺寸。
默认值：`1200`。

较低的值通常会降低大量截图运行的视觉 token 用量和请求负载大小。
较高的值会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统提示词上下文的时区（不是消息时间戳）。回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示词中的时间格式。默认值：`auto`（操作系统偏好）。

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - 字符串形式只设置主模型。
  - 对象形式设置主模型以及有序故障切换模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径用作其视觉模型配置。
  - 当选定/默认模型无法接受图像输入时，也用作回退路由。
  - 优先使用显式 `provider/model` 引用。为兼容性也接受裸 ID；如果某个裸 ID 在 `models.providers.*.models` 中唯一匹配一个已配置且支持图像的条目，OpenClaw 会将其限定到该提供商。配置中存在歧义匹配时，需要显式提供商前缀。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享的图像生成能力以及未来任何生成图像的工具/插件表面使用。
  - 典型值：用于原生 Gemini 图像生成的 `google/gemini-3.1-flash-image-preview`、用于 fal 的 `fal/fal-ai/flux/dev`、用于 OpenAI Images 的 `openai/gpt-image-2`，或用于透明背景 OpenAI PNG/WebP 输出的 `openai/gpt-image-1.5`。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享的音乐生成能力以及内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API 密钥。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享的视频生成能力以及内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API 密钥。
  - 内置 Qwen 视频生成提供商最多支持 1 个输出视频、1 个输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，然后回退到解析后的会话/默认模型。
- `pdfMaxBytesMb`：调用时未传入 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中提取回退模式考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `elevatedDefault`：智能体的默认提升输出级别。值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如，用 API 密钥访问时为 `openai/gpt-5.5`，用 Codex OAuth 时为 `openai-codex/gpt-5.5`）。如果省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 ID 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商（已弃用的兼容行为，因此优先使用显式 `provider/model`）。如果该提供商不再公开配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露过期的已移除提供商默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目可以包含 `alias`（快捷方式）和 `params`（提供商特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传入 `--replace`，否则 `config set` 会拒绝会移除现有允许列表条目的替换。
  - 提供商作用域的配置/新手引导流程会将选定的提供商模型合并到此映射中，并保留已配置的无关提供商。
  - 对于直接 OpenAI Responses 模型，会自动启用服务器端压缩。使用 `params.responsesServerCompaction: false` 停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务器端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有模型的全局默认提供商参数。在 `agents.defaults.params` 设置（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后 `agents.list[].params`（匹配的智能体 ID）按键覆盖。详情参见 [提示缓存](/zh-CN/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，额外请求体优先；非原生 completions 路由之后仍会剥离仅 OpenAI 使用的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容的聊天模板参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于关闭思考的 `vllm/nemotron-3-*`，内置 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式 `chat_template_kwargs` 会覆盖生成的默认值，而 `extra_body.chat_template_kwargs` 仍具有最终优先级。对于 vLLM Qwen 思考控制，在该模型条目上将 `params.qwenThinkingFormat` 设置为 `"chat-template"` 或 `"top-level"`。
- `params.preserveThinking`：仅 Z.AI 可选择启用的保留思考。启用且思考开启时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放之前的 `reasoning_content`；参见 [Z.AI 思考与保留思考](/zh-CN/providers/zai#thinking-and-preserved-thinking)。
- `agentRuntime`：默认低级智能体运行时策略。省略的 ID 默认使用 OpenClaw Pi。使用 `id: "pi"` 强制使用内置 PI 执行框架，使用 `id: "auto"` 允许已注册的插件执行框架认领受支持模型，使用已注册的执行框架 ID（如 `id: "codex"`），或使用受支持的 CLI 后端别名（如 `id: "claude-cli"`）。设置 `fallback: "none"` 可禁用自动 PI 回退。除非你在同一覆盖作用域中设置 `fallback: "pi"`，否则 `codex` 等显式插件运行时默认封闭失败。将模型引用保持为规范的 `provider/model`；通过运行时配置选择 Codex、Claude CLI、Gemini CLI 和其他执行后端，而不是使用旧版运行时提供商前缀。了解这与提供商/模型选择的区别，参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- 改变这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及回退添加/移除命令）会保存规范对象形式，并尽可能保留现有回退列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话仍会串行化）。默认值：4。

### `agents.defaults.agentRuntime`

`agentRuntime` 控制哪个低级执行器运行智能体回合。大多数
部署应保留默认 OpenClaw Pi 运行时。当受信任
插件提供原生执行框架（例如内置 Codex 应用服务器执行框架）时，
或当你想使用受支持的 CLI 后端（例如 Claude CLI）时，可使用它。关于心智
模型，参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`：`"auto"`、`"pi"`、已注册的插件执行框架 ID，或受支持的 CLI 后端别名。内置 Codex 插件注册 `codex`；内置 Anthropic 插件提供 `claude-cli` CLI 后端。
- `fallback`：`"pi"` 或 `"none"`。在 `id: "auto"` 中，省略的回退默认值为 `"pi"`，这样旧配置在没有插件执行框架认领运行时仍可继续使用 PI。在显式插件运行时模式中（例如 `id: "codex"`），省略的回退默认值为 `"none"`，因此缺失执行框架会失败，而不是静默使用 PI。运行时覆盖不会从更宽作用域继承回退；当你有意需要该兼容回退时，请在显式运行时旁一起设置 `fallback: "pi"`。选定的插件执行框架失败始终会直接暴露。
- 环境覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 会覆盖 `id`；`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` 会覆盖该进程的回退。
- 对于仅 Codex 部署，设置 `model: "openai/gpt-5.5"` 和 `agentRuntime.id: "codex"`。你也可以显式设置 `agentRuntime.fallback: "none"` 以提升可读性；它是显式插件运行时的默认值。
- 对于 Claude CLI 部署，优先使用 `model: "anthropic/claude-opus-4-7"` 加 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/claude-opus-4-7` 模型引用仍可兼容使用，但新配置应保持提供商/模型选择为规范形式，并将执行后端放在 `agentRuntime.id` 中。
- 较旧的运行时策略键会由 `openclaw doctor --fix` 重写为 `agentRuntime`。
- 执行框架选择会在第一次嵌入式运行后按会话 ID 固定。配置/环境变更会影响新的或重置的会话，而不会影响现有转录记录。带有转录历史但没有记录固定项的旧版会话会被视为已固定到 PI。`/status` 会报告有效运行时，例如 `Runtime: OpenClaw Pi Default` 或 `Runtime: OpenAI Codex`。
- 这只控制文本智能体回合执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用各自的提供商/模型设置。

**内置别名简写**（仅当模型位于 `agents.defaults.models` 中时适用）：

| 别名                | 模型                                       |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off`，或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 用于工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
Anthropic Claude 4.6 模型在未设置显式思考级别时，默认使用 `adaptive` 思考。

### `agents.defaults.cliBackends`

用于纯文本回退运行的可选 CLI 后端（无工具调用）。当 API 提供商失败时，可用作备用方案。

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

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个由 OpenClaw 组装的系统提示词。可在默认层级（`agents.defaults.systemPromptOverride`）或每个智能体（`agents.list[].systemPromptOverride`）设置。每智能体的值优先；空值或仅包含空白的值会被忽略。适用于受控提示词实验。

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

按模型家族应用的、独立于提供商的提示词叠加层。GPT-5 系列模型 ID 会在各提供商间收到共享行为契约；`personality` 仅控制友好的交互风格层。

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

- `"friendly"`（默认）和 `"on"` 启用友好的交互风格层。
- `"off"` 仅禁用友好层；带标签的 GPT-5 行为契约仍会启用。
- 当此共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

周期性心跳运行。

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

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API 密钥认证）或 `1h`（OAuth 认证）。设为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，从系统提示词中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入启动上下文。默认值：`true`。
- `suppressToolErrorWarnings`：为 true 时，在心跳运行期间抑制工具错误警告负载。
- `timeoutSeconds`：心跳智能体轮次在中止前允许的最长秒数。留空则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许向直接目标投递。`block` 抑制向直接目标投递，并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，心跳运行使用轻量启动上下文，并且仅保留工作区启动文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳都会在没有既往对话历史的全新会话中运行。与 cron `sessionTarget: "isolated"` 使用相同隔离模式。将每次心跳的 token 成本从约 100K 降至约 2-5K token。
- 每智能体：设置 `agents.list[].heartbeat`。当任何智能体定义了 `heartbeat` 时，**只有这些智能体**会运行心跳。
- 心跳会运行完整的智能体轮次，间隔越短消耗的 token 越多。

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

- `mode`：`default` 或 `safeguard`（用于长历史的分块摘要）。参见[压缩](/zh-CN/concepts/compaction)。
- `provider`：已注册的压缩提供商插件的 ID。设置后，会调用该提供商的 `summarize()`，而不是内置 LLM 摘要。失败时回退到内置方式。设置提供商会强制 `mode: "safeguard"`。参见[压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止单次压缩操作前允许的最长秒数。默认值：`900`。
- `keepRecentTokens`：用于逐字保留最新转录尾部的 Pi 截断点预算。手动 `/compact` 在显式设置时会遵循此值；否则手动压缩是硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要期间前置内置的不透明标识符保留指引。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：用于 safeguard 摘要的格式异常输出重试检查。在 safeguard 模式下默认启用；设置 `enabled: false` 可跳过审计。
- `postCompactionSections`：可选的 AGENTS.md H2/H3 章节名称，用于在压缩后重新注入。默认值为 `["Session Startup", "Red Lines"]`；设为 `[]` 可禁用重新注入。未设置或显式设置为该默认组合时，也会接受较旧的 `Every Session`/`Safety` 标题作为旧版回退。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。当主会话应保持使用一个模型，而压缩摘要应在另一个模型上运行时使用；未设置时，压缩使用会话的主模型。
- `maxActiveTranscriptBytes`：可选字节阈值（`number` 或类似 `"20mb"` 的字符串），当活动 JSONL 增长超过阈值时，会在运行前触发普通本地压缩。需要 `truncateAfterCompaction`，以便成功压缩后能够轮换到更小的后继转录。未设置或为 `0` 时禁用。
- `notifyUser`：为 `true` 时，会在压缩开始和完成时向用户发送简短通知（例如，“正在压缩上下文...”和“压缩完成”）。默认禁用，以保持压缩静默。
- `memoryFlush`：自动压缩前的静默智能体轮次，用于存储持久记忆。当此清理轮次应保留在本地模型上时，将 `model` 设为精确的提供商/模型，例如 `ollama/qwen3:8b`；该覆盖不会继承活动会话的回退链。当工作区为只读时跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 之前，从内存上下文中裁剪**旧工具结果**。**不会**修改磁盘上的会话历史。

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

- `mode: "cache-ttl"` 启用裁剪过程。
- `ttl` 控制裁剪在多久后可以再次运行（从上次缓存触达之后计算）。
- 裁剪会先对过大的工具结果进行软裁剪，然后在需要时硬清除较旧的工具结果。

**软裁剪**会保留开头 + 结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

注意：

- 图像块永远不会被裁剪/清除。
- 比例基于字符（近似值），不是精确 token 计数。
- 如果助理消息少于 `keepLastAssistants` 条，则会跳过裁剪。

</Accordion>

行为细节参见[会话裁剪](/zh-CN/concepts/session-pruning)。

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
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及每账号变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500ms。每智能体覆盖：`agents.list[].humanDelay`。

行为和分块细节参见[流式传输](/zh-CN/concepts/streaming)。

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
- 每会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见[输入状态指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南参见[沙箱隔离](/zh-CN/gateway/sandboxing)。

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

<Accordion title="沙箱详情">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：通用 SSH 支持的远程运行时
- `openshell`：OpenShell 运行时

选择 `backend: "openshell"` 时，运行时专属设置会移至
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：采用 `user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域划分工作区的远程绝对根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在运行时具现化为临时文件的内联内容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略开关

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 基于 SecretRef 的 `*Data` 值会在沙箱会话启动前，从活动的密钥运行时快照中解析

**SSH 后端行为：**

- 创建或重新创建后，对远程工作区执行一次种子初始化
- 随后保持远程 SSH 工作区为权威来源
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：位于 `~/.openclaw/sandboxes` 下的按作用域划分的沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：每个会话一个容器和工作区
- `agent`：每个智能体一个容器和工作区（默认）
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

- `mirror`：在执行前从本地为远程写入种子内容，执行后同步回来；本地工作区保持为权威来源
- `remote`：创建沙箱时对远程执行一次种子初始化，随后保持远程工作区为权威来源

在 `remote` 模式下，种子步骤之后，在 OpenClaw 外部进行的主机本地编辑不会自动同步到沙箱中。
传输方式是通过 SSH 进入 OpenShell 沙箱，但插件负责沙箱生命周期和可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根目录和 root 用户。

**容器默认使用 `network: "none"`** — 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 会被阻止。默认情况下，`"container:<id>"` 会被阻止，除非你明确设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（应急开关）。

**传入附件** 会被暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载其他主机目录；全局绑定和按智能体绑定会合并。

**沙箱浏览器**（`sandbox.browser.enabled`）：容器内的 Chromium + CDP。noVNC URL 会注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出短期有效的令牌 URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用桥接网络）。仅当你明确需要全局桥接连通性时，才设置为 `bridge`。
- `cdpSourceRange` 可选地将容器边缘的 CDP 入站访问限制到某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅将其他主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
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
    默认启用；如果 WebGL/3D 使用场景需要，可以用
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用它们。
  - 如果你的工作流依赖扩展，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改；设置为 `0` 可使用 Chromium 的
    默认进程限制。
  - 当启用 `noSandbox` 时，还会加上 `--no-sandbox`。
  - 默认值是容器镜像基线；若要更改容器默认值，请使用带自定义入口点的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 为某个智能体指定自己的 TTS 提供商、语音、模型、
风格或自动 TTS 模式。智能体块会在全局
`messages.tts` 之上执行深度合并，因此共享凭证可以保留在同一处，而各个
智能体只覆盖所需的语音或提供商字段。活动智能体的
覆盖适用于自动朗读回复、`/tts audio`、`/tts status` 和
`tts` 智能体工具。查看[文本转语音](/zh-CN/tools/tts#per-agent-voice-overrides)
了解提供商示例和优先级。

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
        agentRuntime: { id: "auto", fallback: "pi" },
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

- `id`：稳定的智能体 id（必填）。
- `default`：设置多个时，第一个生效（会记录警告）。如果没有设置，则列表第一项是默认值。
- `model`：字符串形式会设置严格的每个智能体主模型，不使用模型回退；对象形式 `{ primary }` 也同样严格，除非你添加 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 让该智能体启用回退，或使用 `{ primary, fallbacks: [] }` 明确设置严格行为。只覆盖 `primary` 的 Cron 作业仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：每个智能体的流式参数，会合并覆盖 `agents.defaults.models` 中选定的模型条目。用它为特定智能体覆盖 `cacheRetention`、`temperature` 或 `maxTokens` 等设置，而不必复制整个模型目录。
- `tts`：可选的每个智能体文本转语音覆盖。该块会深度合并覆盖 `messages.tts`，因此请将共享的提供商凭据和回退策略保留在 `messages.tts` 中，并且只在这里设置人设专用值，例如提供商、语音、模型、风格或自动模式。
- `skills`：可选的每个智能体技能允许列表。如果省略，则智能体会在设置了 `agents.defaults.skills` 时继承它；显式列表会替换默认值而不是合并，`[]` 表示没有技能。
- `thinkingDefault`：可选的每个智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当没有设置每条消息或会话级覆盖时，会覆盖该智能体的 `agents.defaults.thinkingDefault`。选定的提供商/模型配置文件会控制哪些值有效；对于 Google Gemini，`adaptive` 会保留提供商自有的动态思考（Gemini 3/3.1 上省略 `thinkingLevel`，Gemini 2.5 上使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的每个智能体默认推理可见性（`on | off | stream`）。当没有设置每条消息或会话级推理覆盖时适用。
- `fastModeDefault`：可选的每个智能体快速模式默认值（`true | false`）。当没有设置每条消息或会话级快速模式覆盖时适用。
- `agentRuntime`：可选的每个智能体底层运行时策略覆盖。使用 `{ id: "codex" }` 可让一个智能体仅使用 Codex，而其他智能体在 `auto` 模式下保留默认 Pi 回退。
- `runtime`：可选的每个智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用带有 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）的 `type: "acp"`。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：从 `emoji` 派生 `ackReaction`，从 `name`/`emoji` 派生 `mentionPatterns`。
- `subagents.allowAgents`：显式 `sessions_spawn.agentId` 目标的智能体 id 允许列表（`["*"]` = 任意；默认值：仅同一智能体）。当需要允许自目标 `agentId` 调用时，请包含请求者 id。
- 沙箱继承保护：如果请求者会话已沙箱隔离，`sessions_spawn` 会拒绝将以非沙箱方式运行的目标。
- `subagents.requireAgentId`：为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件；默认值：false）。

---

## 多智能体路由

在一个 Gateway 网关内运行多个隔离的智能体。请参阅 [多智能体](/zh-CN/concepts/multi-agent)。

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

- `type`（可选）：`route` 用于常规路由（缺少 type 时默认为 route），`acp` 用于持久 ACP 对话绑定。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；特定渠道）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（渠道范围）
6. 默认智能体

在每一层中，第一个匹配的 `bindings` 条目生效。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份（`match.channel` + 账号 + `match.peer.id`）解析，并且不会使用上面的路由绑定层级顺序。

### 每个智能体的访问配置文件

<Accordion title="完全访问（无沙箱）">

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

<Accordion title="只读工具 + 工作区">

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

<Accordion title="无文件系统访问（仅消息）">

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

优先级详情请参见 [Multi-Agent 沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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

<Accordion title="会话字段详情">

- **`scope`**：群组聊天上下文的基础会话分组策略。
  - `per-sender`（默认）：每个发送者在一个渠道上下文中获得一个隔离的会话。
  - `global`：一个渠道上下文中的所有参与者共享单个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：跨渠道按发送者 id 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的对等方，以便跨渠道共享会话。`/dock_discord` 等停靠命令使用同一映射，将当前会话的回复路由切换到另一个已链接的渠道对等方；参见[渠道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主要重置策略。`daily` 在本地时间 `atHour` 重置；`idle` 在 `idleMinutes` 后重置。两者都配置时，先过期者生效。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。心跳、cron 唤醒、exec 通知和 Gateway 网关记账等后台/系统事件写入可以更新 `updatedAt`，但它们不会让每日/空闲会话保持新鲜。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名。
- **`parentForkMaxTokens`**：创建分叉线程会话时允许的父会话 `totalTokens` 最大值（默认 `100000`）。
  - 如果父会话 `totalTokens` 高于此值，OpenClaw 会启动新的线程会话，而不是继承父会话的转录历史。
  - 设为 `0` 可禁用此保护，并始终允许父会话分叉。
- **`mainKey`**：旧版字段。运行时始终使用 `"main"` 作为主直接聊天桶。
- **`agentToAgent.maxPingPongTurns`**：智能体到智能体交换期间，智能体之间的最大往返回合数（整数，范围：`0`–`5`）。`0` 会禁用乒乓式串联。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 可作为别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个 deny 生效。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会执行清理。
  - `pruneAfter`：陈旧条目的年龄截断值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。运行时会以小的高水位缓冲批量写入清理，以适配生产规模上限；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - `rotateBytes`：已弃用并被忽略；`openclaw doctor --fix` 会从较旧配置中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留期。默认为 `pruneAfter`；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会先移除最旧的工件/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认为 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认的非活动自动取消聚焦时间，以小时为单位（`0` 禁用；提供商可以覆盖）
  - `maxAgeHours`：默认的硬性最大年龄，以小时为单位（`0` 禁用；提供商可以覆盖）

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
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
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

按渠道/账户覆盖项：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析规则（最具体者优先）：账户 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 派生 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述                 | 示例                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 简短模型名称         | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称           | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别         | `high`, `low`, `off`        |
| `{identity.name}` | 智能体身份名称       | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认回应

- 默认使用活动智能体的 `identity.emoji`，否则使用 `"👀"`。设置为 `""` 可禁用。
- 按渠道覆盖项：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → 渠道 → `messages.ackReaction` → 身份回退值。
- 作用域：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord、Telegram、WhatsApp 和 BlueBubbles 等支持回应的渠道上，在回复后移除确认回应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期 Status 回应。
  在 Slack 和 Discord 上，未设置时，如果确认回应处于活动状态，Status 回应会保持启用。
  在 Telegram 上，需要显式设置为 `true` 才能启用生命周期 Status 回应。

### 入站防抖

将同一发送者快速发送的纯文本消息合并为一次智能体轮次。媒体/附件会立即刷新。控制命令会绕过防抖。

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

- `auto` 控制默认自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好设置，`/tts status` 会显示有效状态。
- `summaryModel` 会为自动摘要覆盖 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（需选择启用）。
- API 密钥会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请包含你要使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 ID 可作为 `microsoft` 的别名使用。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序为配置，然后是 `OPENAI_TTS_BASE_URL`，然后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型/语音验证。

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- 配置多个 Talk 提供商时，`talk.provider` 必须匹配 `talk.providers` 中的一个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，并会自动迁移到 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 仅当未配置 Talk API 密钥时，才会使用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 让 Talk 指令可以使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX helper 使用的 Hugging Face 仓库。如果省略，macOS 会使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会通过内置的 `openclaw-mlx-tts` helper（如果存在）或 `PATH` 上的可执行文件运行；`OPENCLAW_MLX_TTS_BIN` 会为开发覆盖 helper 路径。
- `speechLocale` 设置 iOS/macOS Talk 语音识别使用的 BCP 47 区域设置 ID。未设置时使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户沉默后等待多久才发送转录文本。未设置时会保留平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）。

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

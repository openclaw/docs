---
read_when:
    - 调优智能体默认设置（模型、思考、工作区、Heartbeat、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息投递和 talk-mode 行为
summary: 智能体默认设置、多智能体路由、会话、消息和 talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-05-02T06:09:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559bb427555768c91720bac10ee60bf2ba5a081117b741a02c140b14267ce1bf
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、
`messages.*` 和 `talk.*` 下的智能体作用域配置键名。对于渠道、工具、Gateway 网关运行时和其他
顶级键名，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

系统提示词 Runtime 行中显示的可选仓库根目录。如果未设置，OpenClaw 会从工作区向上遍历自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

可选的默认技能允许列表，用于未设置
`agents.list[].skills` 的智能体。

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

- 省略 `agents.defaults.skills` 表示默认不限制 Skills。
- 省略 `agents.list[].skills` 表示继承默认值。
- 设置 `agents.list[].skills: []` 表示没有 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它
  不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

跳过创建所选可选工作区文件，同时仍写入必需的引导文件。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

控制何时将工作区引导文件注入系统提示词。默认值：`"always"`。

- `"continuation-skip"`：安全的延续轮次（在已完成的助手回复之后）会跳过重新注入工作区引导内容，从而减少提示词大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每一轮都禁用工作区引导和上下文文件注入。仅将此用于完全自行掌控提示词生命周期的智能体（自定义上下文引擎、构建自身上下文的原生运行时，或专用的无引导工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

截断前每个工作区引导文件的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

注入的所有工作区引导文件的总最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制引导上下文被截断时智能体可见的警告文本。
默认值：`"once"`。

- `"off"`：绝不将警告文本注入系统提示词。
- `"once"`：对每个唯一的截断签名只注入一次警告（推荐）。
- `"always"`：存在截断时在每次运行中都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算归属映射

OpenClaw 有多个高容量提示词/上下文预算，它们
有意按子系统拆分，而不是全部经过一个通用
开关。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  普通工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性重置/启动模型运行前序内容，包括最近的每日
  `memory/*.md` 文件。裸聊天 `/new` 和 `/reset` 命令会
  在不调用模型的情况下确认重置。
- `skills.limits.*`：
  注入系统提示词的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界运行时摘录和注入的运行时拥有块。
- `memory.qmd.limits.*`：
  索引化记忆搜索片段和注入大小设置。

仅当某个智能体需要不同
预算时，才使用匹配的按智能体覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重置/启动模型运行时注入的第一轮启动前序内容。
裸聊天 `/new` 和 `/reset` 命令会在不调用
模型的情况下确认重置，因此不会加载此前序内容。

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

- `memoryGetMaxChars`：添加截断
  元数据和延续提示前的默认 `memory_get` 摘录上限。
- `memoryGetDefaultLines`：省略 `lines` 时默认的 `memory_get` 行窗口。
- `toolResultMaxChars`：用于持久化结果和
  溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：压缩后
  刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 开关的按智能体覆盖项。省略的字段会继承
自 `agents.defaults.contextLimits`。

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

注入系统提示词的紧凑 Skills 列表的全局上限。这
不会影响按需读取 `SKILL.md` 文件。

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

在调用提供商之前，转录/工具图片块中图片最长边的最大像素尺寸。
默认值：`1200`。

较低的值通常会减少截图密集型运行中的视觉 token 使用量和请求载荷大小。
较高的值会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统提示词上下文使用的时区（不是消息时间戳）。回退到主机时区。

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
  - 对象形式设置主模型以及有序故障转移模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径用作其视觉模型配置。
  - 当选定/默认模型无法接受图像输入时，也用作备用路由。
  - 优先使用显式 `provider/model` 引用。裸 ID 为兼容性而接受；如果裸 ID 唯一匹配 `models.providers.*.models` 中已配置且支持图像的条目，OpenClaw 会将其限定到该提供商。存在歧义的已配置匹配需要显式提供商前缀。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享图像生成能力以及任何未来生成图像的工具/插件界面使用。
  - 典型值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，`openai/gpt-image-2` 用于 OpenAI Images，或 `openai/gpt-image-1.5` 用于透明背景 OpenAI PNG/WebP 输出。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享音乐生成能力以及内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享视频生成能力以及内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
  - 内置 Qwen 视频生成提供商最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，再回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传入 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中提取备用模式考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `reasoningDefault`：智能体的默认推理可见性。值：`"off"`、`"on"`、`"stream"`。每智能体的 `agents.list[].reasoningDefault` 会覆盖此默认值。仅当没有设置每消息或会话推理覆盖时，已配置的推理默认值才会应用于所有者、已授权发送者或操作员管理员 Gateway 网关上下文。
- `elevatedDefault`：智能体的默认提升输出级别。值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 API key 访问使用 `openai/gpt-5.5`，Codex OAuth 使用 `openai-codex/gpt-5.5`）。如果你省略提供商，OpenClaw 会先尝试别名，然后尝试该精确模型 ID 的唯一已配置提供商匹配，最后才回退到已配置的默认提供商（已弃用的兼容行为，因此优先使用显式 `provider/model`）。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露陈旧的已移除提供商默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目可以包含 `alias`（快捷方式）和 `params`（提供商特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传入 `--replace`，否则 `config set` 会拒绝移除现有允许列表条目的替换。
  - 提供商范围的配置/新手引导流程会将选定的提供商模型合并到此映射，并保留已配置的无关提供商。
  - 对于直接 OpenAI Responses 模型，服务器端压缩会自动启用。使用 `params.responsesServerCompaction: false` 停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务器端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用到所有模型的全局默认提供商参数。在 `agents.defaults.params` 设置（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基准）会被 `agents.defaults.models["provider/model"].params`（每模型）覆盖，然后 `agents.list[].params`（匹配智能体 ID）按键覆盖。详情参见 [提示缓存](/zh-CN/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，额外 body 获胜；非原生 completions 路由随后仍会剥离仅 OpenAI 支持的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容聊天模板参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于关闭 thinking 的 `vllm/nemotron-3-*`，内置 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式 `chat_template_kwargs` 会覆盖生成的默认值，且 `extra_body.chat_template_kwargs` 仍具有最终优先级。对于 vLLM Qwen thinking 控制，在该模型条目上将 `params.qwenThinkingFormat` 设置为 `"chat-template"` 或 `"top-level"`。
- `compat.supportedReasoningEfforts`：每模型 OpenAI 兼容推理强度列表。对于真正接受它的自定义端点，包含 `"xhigh"`；OpenClaw 随后会在命令菜单、Gateway 网关会话行、会话补丁验证、智能体 CLI 验证以及 `llm-task` 验证中为该已配置提供商/模型公开 `/think xhigh`。当后端需要某个规范级别的提供商特定值时，使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：仅 Z.AI 的保留 thinking 选择加入项。启用且 thinking 开启时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放先前的 `reasoning_content`；参见 [Z.AI thinking 与保留 thinking](/zh-CN/providers/zai#thinking-and-preserved-thinking)。
- `agentRuntime`：默认低级智能体运行时策略。省略的 ID 默认使用 OpenClaw Pi。使用 `id: "pi"` 强制内置 PI harness，使用 `id: "auto"` 让已注册插件 harness 认领受支持的模型，使用已注册 harness ID（如 `id: "codex"`），或使用受支持的 CLI 后端别名（如 `id: "claude-cli"`）。设置 `fallback: "none"` 可禁用自动 PI 回退。显式插件运行时（如 `codex`）默认关闭失败，除非你在同一覆盖范围内设置 `fallback: "pi"`。保持模型引用为规范的 `provider/model`；通过运行时配置选择 Codex、Claude CLI、Gemini CLI 和其他执行后端，而不是使用旧版运行时提供商前缀。参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)，了解它与提供商/模型选择的区别。
- 会改写这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及备用添加/移除命令）会保存规范对象形式，并尽可能保留现有备用列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话仍会串行化）。默认值：4。

### `agents.defaults.agentRuntime`

`agentRuntime` 控制哪个低级执行器运行智能体轮次。大多数
部署应保留默认 OpenClaw Pi 运行时。当可信
插件提供原生 harness（例如内置 Codex app-server harness）时使用它，
或者当你想使用受支持的 CLI 后端（例如 Claude CLI）时使用它。关于心智
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

- `id`：`"auto"`、`"pi"`、已注册插件 harness ID，或受支持的 CLI 后端别名。内置 Codex 插件注册 `codex`；内置 Anthropic 插件提供 `claude-cli` CLI 后端。
- `fallback`：`"pi"` 或 `"none"`。在 `id: "auto"` 中，省略的 fallback 默认为 `"pi"`，以便旧配置在没有插件 harness 认领运行时继续使用 PI。在显式插件运行时模式中，例如 `id: "codex"`，省略的 fallback 默认为 `"none"`，因此缺少 harness 会失败，而不是静默使用 PI。运行时覆盖不会从更广范围继承 fallback；当你有意需要该兼容性回退时，请在显式运行时旁设置 `fallback: "pi"`。选定插件 harness 的失败始终会直接暴露。
- 环境覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 覆盖 `id`；`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` 覆盖该进程的 fallback。
- 对于仅 Codex 的部署，设置 `model: "openai/gpt-5.5"` 和 `agentRuntime.id: "codex"`。你也可以显式设置 `agentRuntime.fallback: "none"` 以提高可读性；它是显式插件运行时的默认值。
- 对于 Claude CLI 部署，优先使用 `model: "anthropic/claude-opus-4-7"` 加 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/claude-opus-4-7` 模型引用仍可用于兼容，但新配置应保持提供商/模型选择规范，并将执行后端放在 `agentRuntime.id` 中。
- 旧版运行时策略键会由 `openclaw doctor --fix` 重写为 `agentRuntime`。
- 首次嵌入式运行后，harness 选择会按会话 ID 固定。配置/环境变更会影响新的或重置的会话，而不会影响现有转录。具有转录历史但没有记录固定选择的旧版会话会被视为已固定到 PI。`/status` 会报告有效运行时，例如 `Runtime: OpenClaw Pi Default` 或 `Runtime: OpenAI Codex`。
- 这仅控制文本智能体轮次执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用各自的提供商/模型设置。

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

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 以进行工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可将其禁用。
Anthropic Claude 4.6 模型在未设置显式思考级别时默认使用 `adaptive` 思考。

### `agents.defaults.cliBackends`

用于纯文本回退运行的可选 CLI 后端（无工具调用）。在 API 提供商失败时可作为备用方案。

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
- 当 `imageArg` 接受文件路径时，支持图片透传。

### `agents.defaults.systemPromptOverride`

将整个 OpenClaw 组装的系统提示词替换为固定字符串。可在默认级别（`agents.defaults.systemPromptOverride`）或按智能体（`agents.list[].systemPromptOverride`）设置。按智能体的值优先；空值或仅包含空白字符的值会被忽略。适用于受控提示词实验。

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

按模型族应用的、与提供商无关的提示词叠加层。GPT-5 家族模型 ID 会跨提供商接收共享行为契约；`personality` 仅控制友好的交互风格层。

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
- `"off"` 仅禁用友好层；带标记的 GPT-5 行为契约仍保持启用。
- 当此共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

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

- `every`：时长字符串（ms/s/m/h）。默认：`30m`（API key 凭证）或 `1h`（OAuth 凭证）。设为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，会从系统提示词中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认：`true`。
- `suppressToolErrorWarnings`：为 true 时，会在 Heartbeat 运行期间抑制工具错误警告负载。
- `timeoutSeconds`：Heartbeat 智能体回合在被中止前允许的最长秒数。未设置时使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直连/私信投递策略。`allow`（默认）允许投递到直连目标。`block` 会抑制投递到直连目标并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，Heartbeat 运行使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 Heartbeat 都在没有先前对话历史的新会话中运行。与 cron `sessionTarget: "isolated"` 的隔离模式相同。将每次 Heartbeat 的 token 成本从约 100K 降至约 2-5K token。
- `skipWhenBusy`：为 true 时，Heartbeat 运行会因额外忙碌通道而推迟：子智能体或嵌套命令工作。即使没有此标志，cron 通道也始终会推迟 Heartbeat。
- 按智能体：设置 `agents.list[].heartbeat`。当任何智能体定义了 `heartbeat` 时，**只有这些智能体**会运行 Heartbeat。
- Heartbeat 会运行完整的智能体回合 — 更短的间隔会消耗更多 token。

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

- `mode`：`default` 或 `safeguard`（用于长历史的分块摘要）。参见 [Compaction](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩提供商插件的 ID。设置后，会调用该提供商的 `summarize()`，而不是内置 LLM 摘要。失败时回退到内置摘要。设置提供商会强制使用 `mode: "safeguard"`。参见 [Compaction](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：单次压缩操作在 OpenClaw 中止前允许的最长秒数。默认：`900`。
- `keepRecentTokens`：用于逐字保留最新转录尾部的 Pi 截断点预算。手动 `/compact` 在显式设置时会遵循此值；否则手动压缩是硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要期间前置内置的不透明标识符保留指导。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：针对 safeguard 摘要的格式异常输出重试检查。safeguard 模式默认启用；设置 `enabled: false` 可跳过审计。
- `midTurnPrecheck`：可选的 Pi 工具循环压力检查。当 `enabled: true` 时，OpenClaw 会在附加工具结果后、下一次模型调用前检查上下文压力。如果上下文不再适配，它会在提交提示词前中止当前尝试，并复用现有预检查恢复路径来截断工具结果，或进行压缩后重试。适用于 `default` 和 `safeguard` 两种压缩模式。默认：禁用。
- `postCompactionSections`：压缩后要重新注入的可选 AGENTS.md H2/H3 章节名称。默认为 `["Session Startup", "Red Lines"]`；设置为 `[]` 可禁用重新注入。未设置或显式设置为该默认对时，旧版 `Every Session`/`Safety` 标题也会作为兼容回退被接受。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。当主会话应保留一个模型、但压缩摘要应在另一个模型上运行时使用；未设置时，压缩使用会话的主模型。
- `maxActiveTranscriptBytes`：可选字节阈值（`number` 或类似 `"20mb"` 的字符串），当活动 JSONL 超过该阈值时，会在运行前触发普通本地压缩。需要 `truncateAfterCompaction`，以便成功压缩后可以轮转到更小的后继转录。未设置或为 `0` 时禁用。
- `notifyUser`：为 `true` 时，会在压缩开始和完成时向用户发送简短通知（例如，“正在压缩上下文...”和“压缩完成”）。默认禁用，以保持压缩静默。
- `memoryFlush`：自动压缩前的静默 agentic 回合，用于存储持久记忆。当此维护回合应停留在本地模型上时，将 `model` 设置为精确的提供商/模型，例如 `ollama/qwen3:8b`；该覆盖不会继承活动会话回退链。工作区为只读时跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 前，从内存上下文中修剪**旧工具结果**。**不会**修改磁盘上的会话历史。

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

- `mode: "cache-ttl"` 启用修剪过程。
- `ttl` 控制修剪多久可以再次运行（在上次缓存触达之后）。
- 修剪会先软修剪过大的工具结果，然后在需要时硬清除更旧的工具结果。

**软修剪**会保留开头 + 结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

注意：

- 图片块永远不会被修剪/清除。
- 比率基于字符（近似），不是精确 token 计数。
- 如果助手消息少于 `keepLastAssistants` 条，则跳过修剪。

</Accordion>

行为详情见 [Session Pruning](/zh-CN/concepts/session-pruning)。

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

请参阅 [流式传输](/zh-CN/concepts/streaming)，了解行为和分块详情。

### 输入指示器

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

- 默认值：直接聊天/提及时为 `instant`，未提及的群聊为 `message`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

请参阅 [输入指示器](/zh-CN/concepts/typing-indicators)。

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
- `ssh`：通用 SSH 支持的远程运行时
- `openshell`：OpenShell 运行时

选择 `backend: "openshell"` 时，运行时专用设置会移动到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域工作区的绝对远程根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在运行时物化为临时文件的内联内容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略开关

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话启动前，从活跃的密钥运行时快照中解析

**SSH 后端行为：**

- 创建或重新创建后，会为远程工作区播种一次
- 然后保持远程 SSH 工作区为权威副本
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：`~/.openclaw/sandboxes` 下的按作用域沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读/写方式挂载到 `/workspace`

**作用域：**

- `session`：每个会话一个容器 + 工作区
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

- `mirror`：执行前从本地播种到远程，执行后同步回来；本地工作区保持为权威副本
- `remote`：创建沙箱时播种远程一次，然后保持远程工作区为权威副本

在 `remote` 模式下，播种步骤之后，在 OpenClaw 外部进行的主机本地编辑不会自动同步到沙箱中。
传输方式是通过 SSH 进入 OpenShell 沙箱，但插件负责沙箱生命周期和可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根目录和 root 用户。

**容器默认使用 `network: "none"`** — 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 被阻止。默认情况下 `"container:<id>"` 被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（应急开关）。

**入站附件** 会暂存到活跃工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载其他主机目录；全局绑定和按智能体绑定会合并。

**沙箱浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，并且 OpenClaw 会发出短期有效的令牌 URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认使用 `openclaw-sandbox-browser`（专用桥接网络）。仅当你明确需要全局桥接连通性时，才设置为 `bridge`。
- `cdpSourceRange` 可选地将容器边缘的 CDP 入站限制到一个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只会把其他主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
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
    默认启用；如果 WebGL/3D 使用需要它们，可以通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用。
  - 如果你的工作流依赖扩展，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展。
  - `--renderer-process-limit=2` 可以通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改；设置为 `0` 可使用 Chromium 的
    默认进程限制。
  - 当启用 `noSandbox` 时，还会加上 `--no-sandbox`。
  - 默认值是容器镜像基线；要更改容器默认值，请使用带有自定义
    入口点的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像（从源码检出目录）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

对于没有源码检出目录的 npm 安装，请参阅 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，了解内联 `docker build` 命令。

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 为某个智能体指定自己的 TTS 提供商、语音、模型、
风格或自动 TTS 模式。智能体块会深度合并到全局
`messages.tts` 之上，因此共享凭证可以保留在一个位置，而各个
智能体只覆盖它们需要的语音或提供商字段。活跃智能体的
覆盖适用于自动语音回复、`/tts audio`、`/tts status` 和
`tts` 智能体工具。请参阅 [文本转语音](/zh-CN/tools/tts#per-agent-voice-overrides)，
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

- `id`：稳定的智能体 ID（必填）。
- `default`：设置多个时，第一个生效（会记录警告）。如果未设置，则列表中的第一项为默认项。
- `model`：字符串形式会为每个智能体设置严格的主模型，不带模型回退；对象形式 `{ primary }` 也同样严格，除非你添加 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 可让该智能体启用回退，或使用 `{ primary, fallbacks: [] }` 明确启用严格行为。仅覆盖 `primary` 的 Cron 作业仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：每个智能体的流参数，会覆盖合并到 `agents.defaults.models` 中选中的模型条目。可用它为智能体设置专属覆盖项，例如 `cacheRetention`、`temperature` 或 `maxTokens`，无需复制整个模型目录。
- `tts`：可选的每个智能体文本转语音覆盖项。该块会深度合并到 `messages.tts` 之上，因此请将共享的提供商凭证和回退策略保留在 `messages.tts`，并只在此处设置人设专属值，例如提供商、语音、模型、风格或自动模式。
- `skills`：可选的每个智能体 Skills 允许列表。如果省略，智能体会在设置了 `agents.defaults.skills` 时继承它；显式列表会替换默认项而不是合并，`[]` 表示不使用 Skills。
- `thinkingDefault`：可选的每个智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置每条消息或会话覆盖项时，会覆盖该智能体的 `agents.defaults.thinkingDefault`。选中的提供商/模型配置决定哪些值有效；对于 Google Gemini，`adaptive` 会保留提供商拥有的动态思考（Gemini 3/3.1 中省略 `thinkingLevel`，Gemini 2.5 中使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的每个智能体默认推理可见性（`on | off | stream`）。当未设置每条消息或会话推理覆盖项时，会覆盖该智能体的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：可选的每个智能体快速模式默认值（`true | false`）。当未设置每条消息或会话快速模式覆盖项时适用。
- `agentRuntime`：可选的每个智能体底层运行时策略覆盖项。使用 `{ id: "codex" }` 可让一个智能体仅使用 Codex，而其他智能体在 `auto` 模式中保留默认的 PI 回退。
- `runtime`：可选的每个智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 以及 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：相对于工作区的路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：从 `emoji` 派生 `ackReaction`，从 `name`/`emoji` 派生 `mentionPatterns`。
- `subagents.allowAgents`：用于显式 `sessions_spawn.agentId` 目标的智能体 ID 允许列表（`["*"]` = 任意；默认：仅同一智能体）。当应允许以自身为目标的 `agentId` 调用时，请包含请求者 ID。
- 沙箱继承保护：如果请求者会话已沙箱隔离，`sessions_spawn` 会拒绝那些将以非沙箱隔离方式运行的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件；默认：false）。

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

- `type`（可选）：`route` 用于普通路由（缺少 type 时默认使用 route），`acp` 用于持久 ACP 对话绑定。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；渠道专属）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道）
6. 默认智能体

在每一层级内，第一个匹配的 `bindings` 条目生效。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份（`match.channel` + 账号 + `match.peer.id`）解析，不使用上面的路由绑定层级顺序。

### 每个智能体访问配置文件

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

有关优先级详情，请参阅 [多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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

<Accordion title="会话字段详情">

- **`scope`**：群聊上下文的基础会话分组策略。
  - `per-sender`（默认）：每个发送者在一个渠道上下文中获得隔离的会话。
  - `global`：一个渠道上下文中的所有参与者共享单个会话（仅在需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：跨渠道按发送者 id 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的对端，用于跨渠道共享会话。`/dock_discord` 等 Dock 命令使用同一映射，将活动会话的回复路由切换到另一个已链接的渠道对端；参见 [渠道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主重置策略。`daily` 在 `atHour` 本地时间重置；`idle` 在 `idleMinutes` 后重置。两者同时配置时，先到期者生效。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。heartbeat、cron 唤醒、exec 通知和 Gateway 网关记账等后台/系统事件写入可以更新 `updatedAt`，但它们不会让每日/空闲会话保持新鲜。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 作为 `direct` 的别名被接受。
- **`mainKey`**：旧版字段。运行时始终使用 `"main"` 作为主直接聊天存储桶。
- **`agentToAgent.maxPingPongTurns`**：智能体到智能体交换期间，智能体之间的最大往返回复轮数（整数，范围：`0`–`5`）。`0` 会禁用往返链式回复。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个拒绝规则生效。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会执行清理。
  - `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。对于生产规模的上限，运行时写入批量清理时会保留一个小的高水位缓冲；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - `rotateBytes`：已弃用并被忽略；`openclaw doctor --fix` 会将其从旧配置中移除。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 记录归档的保留期。默认使用 `pruneAfter`；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会先删除最旧的构件/会话。
  - `highWaterBytes`：预算清理后的可选目标。默认是 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认不活动自动取消聚焦时间，单位为小时（`0` 禁用；提供商可以覆盖）
  - `maxAgeHours`：默认硬性最长年龄，单位为小时（`0` 禁用；提供商可以覆盖）
  - `spawnSessions`：从 `sessions_spawn` 和 ACP 线程生成创建线程绑定工作会话的默认门控。线程绑定启用时默认为 `true`；提供商/账号可以覆盖。
  - `defaultSpawnContext`：线程绑定生成的默认原生子智能体上下文（`"fork"` 或 `"isolated"`）。默认是 `"fork"`。

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

### 回复前缀

按渠道/账号覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（最具体者优先）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 会派生为 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述             | 示例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 短模型名称       | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称       | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别     | `high`, `low`, `off`        |
| `{identity.name}` | 智能体身份名称   |（与 `"auto"` 相同）          |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认使用活动智能体的 `identity.emoji`，否则使用 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → 身份回退。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord、Telegram、WhatsApp 和 BlueBubbles 等支持反应的渠道上，回复后移除确认反应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期 Status 反应。
  在 Slack 和 Discord 上，未设置时，如果确认反应处于活动状态，则会保持 Status 反应启用。
  在 Telegram 上，显式设为 `true` 才能启用生命周期 Status 反应。

### 入站防抖

将同一发送者快速发送的纯文本消息批处理为单个智能体轮次。媒体/附件会立即刷新。控制命令会绕过防抖。

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

- `auto` 控制默认的自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好，`/tts status` 会显示有效状态。
- `summaryModel` 会为自动摘要覆盖 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认是 `false`（选择加入）。
- API 密钥会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请包含你想使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 id 会作为 `microsoft` 的别名被接受。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序为配置，然后是 `OPENAI_TTS_BASE_URL`，然后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型/语音验证。

---

## 语音对话

语音对话模式（macOS/iOS/Android）的默认值。

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

- 配置多个语音对话提供商时，`talk.provider` 必须匹配 `talk.providers` 中的某个键。
- 旧版扁平语音对话键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，并会自动迁移到 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- `ELEVENLABS_API_KEY` 回退仅在未配置语音对话 API 密钥时适用。
- `providers.*.voiceAliases` 让语音对话指令可以使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 辅助程序使用的 Hugging Face 仓库。如果省略，macOS 会使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会通过内置的 `openclaw-mlx-tts` 辅助程序（如果存在）运行，或通过 `PATH` 上的可执行文件运行；`OPENCLAW_MLX_TTS_BIN` 会为开发覆盖辅助程序路径。
- `speechLocale` 设置 iOS/macOS 语音对话语音识别使用的 BCP 47 区域设置 id。留空则使用设备默认值。
- `silenceTimeoutMs` 控制语音对话模式在用户静默后等待多久再发送转录。未设置时保持平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）。

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

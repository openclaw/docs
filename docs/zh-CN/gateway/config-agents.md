---
read_when:
    - 调整智能体默认设置（模型、思考、工作区、Heartbeat、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息投递和 Talk 模式行为
summary: 智能体默认值、多 Agent 路由、会话、消息和 Talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-07-05T01:56:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28ffd1dbee664b692993a1029732e6d6cc01031864a8784e5c1efb3bdc0a356d
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下按 Agent 作用域配置的键。对于渠道、工具、Gateway 网关运行时和其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## Agent 默认值

### `agents.defaults.workspace`

默认值：设置了 `OPENCLAW_WORKSPACE_DIR` 时使用它，否则使用 `~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

显式的 `agents.defaults.workspace` 值优先于 `OPENCLAW_WORKSPACE_DIR`。当你不想把该路径写入配置时，可以使用环境变量将默认智能体指向挂载的工作区。

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示的 Runtime 行中。如果未设置，OpenClaw 会从工作区向上遍历自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

可选的默认技能允许列表，用于未设置 `agents.list[].skills` 的智能体。

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

- 默认情况下，省略 `agents.defaults.skills` 表示不限制 Skills。
- 省略 `agents.list[].skills` 表示继承默认值。
- 设置 `agents.list[].skills: []` 表示无 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

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

- `"continuation-skip"`：安全的续接轮次（在已完成的助手响应之后）会跳过重新注入工作区引导文件，从而减少提示大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每一轮禁用工作区引导文件和上下文文件注入。仅将此用于完全自行拥有提示生命周期的智能体（自定义上下文引擎、构建自身上下文的原生运行时，或专门的无引导工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

按 Agent 覆盖：`agents.list[].contextInjection`。省略的值会继承 `agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件在截断前的最大字符数。默认值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

按 Agent 覆盖：`agents.list[].bootstrapMaxChars`。省略的值会继承 `agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件合计注入的最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

按 Agent 覆盖：`agents.list[].bootstrapTotalMaxChars`。省略的值会继承 `agents.defaults.bootstrapTotalMaxChars`。

### 按 Agent 的引导配置覆盖

当某个智能体需要与共享默认值不同的提示注入行为时，使用按 Agent 的引导配置覆盖。省略的字段会从 `agents.defaults` 继承。

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制引导上下文被截断时，智能体可见的系统提示通知。默认值：`"always"`。

- `"off"`：从不向系统提示注入截断通知文本。
- `"once"`：针对每个唯一的截断签名注入一次简明通知。
- `"always"`：存在截断时，每次运行都注入简明通知（推荐）。

详细的原始/注入计数和配置调优字段会保留在诊断信息中，例如上下文/状态报告和日志；常规 WebChat 用户/运行时上下文只会收到简明的恢复通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文预算所有权映射

OpenClaw 有多个高容量提示/上下文预算，并且有意按子系统拆分，而不是全部流经一个通用开关。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的重置/启动模型运行前奏，包括最近每日的 `memory/*.md` 文件。裸聊天 `/new` 和 `/reset` 命令会确认重置，而不调用模型。
- `skills.limits.*`：
  注入系统提示的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界运行时摘录和注入的运行时拥有块。
- `memory.qmd.limits.*`：
  已索引的记忆搜索片段和注入大小。

仅当某个智能体需要不同预算时，才使用匹配的按 Agent 覆盖：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重置/启动模型运行中注入的首轮启动前奏。裸聊天 `/new` 和 `/reset` 命令会确认重置而不调用模型，因此不会加载此前奏。

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
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：添加截断元数据和续接通知前，默认的 `memory_get` 摘录上限。
- `memoryGetDefaultLines`：省略 `lines` 时，默认的 `memory_get` 行窗口。
- `toolResultMaxChars`：高级实时工具结果上限，用于持久化结果和溢出恢复。保持未设置即可使用模型上下文自动上限：低于 100K token 时为 `16000` 字符，达到 100K+ token 时为 `32000` 字符，达到 200K+ token 时为 `64000` 字符。对于长上下文模型，最高可接受 `1000000` 的显式值，但有效上限仍限制在约模型上下文窗口的 30%。`openclaw doctor --deep` 会打印有效上限，并且 Doctor 只会在显式覆盖已过时或没有效果时发出警告。
- `postCompactionMaxChars`：压缩后刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

对共享 `contextLimits` 开关的按 Agent 覆盖。省略的字段会从 `agents.defaults.contextLimits` 继承。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系统提示的紧凑 Skills 列表的全局上限。这不会影响按需读取 `SKILL.md` 文件。

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

Skills 提示预算的按 Agent 覆盖。

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

在 provider 调用前，转录/工具图像块中图像最长边的最大像素尺寸。默认值：`1200`。

较低的值通常会减少大量截图运行中的视觉 token 用量和请求负载大小。较高的值会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

从文件路径、URL 和媒体引用加载图像时的图像工具压缩/细节偏好。默认值：`auto`。

OpenClaw 会根据所选图像模型调整 resize 阶梯。例如，Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL 和托管的 Llama 4 视觉模型可使用比旧版/默认高细节视觉路径更大的图像，而多图像轮次在 `auto` 模式下会更激进地压缩，以控制 token 和延迟成本。

值：

- `auto`：根据模型限制和图像数量自适应。
- `efficient`：偏好较小图像，以降低 token 和字节用量。
- `balanced`：使用标准的中间折中阶梯。
- `high`：为截图、图表和文档图像保留更多细节。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系统提示上下文使用的时区（不是消息时间戳）。回退到主机时区。

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
      utilityModel: "openai/gpt-5.4-mini",
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
  - 字符串形式只设置主模型。
  - 对象形式设置主模型以及有序故障转移模型。
- `utilityModel`：可选的 `provider/model` 引用或别名，用于短小的内部任务。目前它为生成的 Control UI 会话标题、Telegram 私信主题标题和 Discord 自动线程标题提供支持。未设置时，这些任务会回退到智能体的主模型；`agents.list[].utilityModel` 会覆盖默认值，而特定操作的模型覆盖会优先于两者。
  实用任务会发起单独的模型调用，并将特定于任务的内容发送给所选模型提供商。仪表板标题生成最多发送第一条非命令消息的前 1,000 个字符。请选择符合你的成本和数据处理要求的提供商。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径用作其视觉模型配置。
  - 当所选/默认模型无法接受图像输入时，也用作回退路由。
  - 优先使用显式 `provider/model` 引用。裸 ID 出于兼容性会被接受；如果裸 ID 唯一匹配 `models.providers.*.models` 中已配置且支持图像的条目，OpenClaw 会将其限定到该提供商。存在歧义的已配置匹配需要显式提供商前缀。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享图像生成能力以及未来任何生成图像的工具/插件表面使用。
  - 典型值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，`openai/gpt-image-2` 用于 OpenAI Images，或 `openai/gpt-image-1.5` 用于透明背景的 OpenAI PNG/WebP 输出。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证（例如 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY` 用于 `google/*`，`OPENAI_API_KEY` 或 OpenAI Codex OAuth 用于 `openai/gpt-image-2` / `openai/gpt-image-1.5`，`FAL_KEY` 用于 `fal/*`）。
  - 如果省略，`image_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享音乐生成能力和内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享视频生成能力和内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断一个有凭证支持的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
  - 官方 Qwen 视频生成插件最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，然后回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传递 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中提取回退模式考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要和进度草稿工具行的详细模式。值：`"explain"`（默认，紧凑的人类可读标签）或 `"raw"`（可用时追加原始命令/详情）。按智能体配置的 `agents.list[].toolProgressDetail` 会覆盖此默认值。
- `reasoningDefault`：智能体的默认推理可见性。值：`"off"`、`"on"`、`"stream"`。按智能体配置的 `agents.list[].reasoningDefault` 会覆盖此默认值。配置的推理默认值只会在未设置逐消息或会话推理覆盖时，应用于所有者、已授权发送者或操作员管理员 Gateway 网关上下文。
- `elevatedDefault`：智能体的默认提升权限输出级别。值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 `openai/gpt-5.5` 用于 OpenAI API key 或 Codex OAuth 访问）。如果省略提供商，OpenClaw 会先尝试别名，然后尝试该确切模型 ID 的唯一已配置提供商匹配，最后才回退到已配置的默认提供商（已弃用的兼容行为，因此优先使用显式 `provider/model`）。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置提供商/模型，而不是暴露过时的已移除提供商默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目都可以包含 `alias`（快捷方式）和 `params`（提供商特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `"openai/*": {}` 或 `"vllm/*": {}` 等 `provider/*` 条目，可以显示所选提供商的所有已发现模型，而无需手动列出每个模型 ID。
  - 当该提供商的每个动态发现模型都应使用同一运行时时，请向 `provider/*` 条目添加 `agentRuntime`。精确 `provider/model` 运行时策略仍优先于通配符。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传递 `--replace`，否则 `config set` 会拒绝会移除现有允许列表条目的替换。
  - 按提供商限定的配置/新手引导流程会将所选提供商模型合并到此映射中，并保留已配置的无关提供商。
  - 对于直接 OpenAI Responses 模型，会自动启用服务器端压缩。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。请参阅 [OpenAI 服务器端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有模型的全局默认提供商参数。在 `agents.defaults.params` 设置（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后 `agents.list[].params`（匹配的智能体 ID）按键覆盖。详情请参阅 [提示缓存](/zh-CN/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 范围的默认提供商路由策略。OpenClaw 会将其转发到 OpenRouter 请求的 `provider` 对象；按模型配置的 `agents.defaults.models["openrouter/<model>"].params.provider` 和智能体参数会按键覆盖。请参阅 [OpenRouter 提供商路由](/zh-CN/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，额外请求体优先生效；非原生 completions 路由之后仍会剥离仅 OpenAI 支持的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容的聊天模板参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于关闭 thinking 的 `vllm/nemotron-3-*`，内置 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式 `chat_template_kwargs` 会覆盖生成的默认值，而 `extra_body.chat_template_kwargs` 仍拥有最终优先级。已配置的 vLLM Qwen 和 Nemotron thinking 模型会公开二元 `/think` 选项（`off`、`on`），而不是多级 effort 阶梯。
- `compat.thinkingFormat`：OpenAI 兼容的 thinking 负载样式。使用 `"together"` 表示 Together 风格的 `reasoning.enabled`，使用 `"qwen"` 表示 Qwen 风格的顶层 `enable_thinking`，或在支持请求级聊天模板 kwargs 的 Qwen 系列后端（如 vLLM）上使用 `"qwen-chat-template"` 表示 `chat_template_kwargs.enable_thinking`。OpenClaw 会将禁用 thinking 映射为 `false`，将启用 thinking 映射为 `true`，并且已配置的 vLLM Qwen 模型会为这些格式公开二元 `/think` 选项。
- `compat.supportedReasoningEfforts`：按模型配置的 OpenAI 兼容推理 effort 列表。对于确实接受它的自定义端点，请包含 `"xhigh"`；随后 OpenClaw 会在命令菜单、Gateway 网关会话行、会话 patch 校验、智能体 CLI 校验和该已配置提供商/模型的 `llm-task` 校验中公开 `/think xhigh`。当后端需要针对规范级别使用提供商特定值时，请使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：仅 Z.AI 可选启用的保留 thinking。启用且 thinking 打开时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放先前的 `reasoning_content`；请参阅 [Z.AI thinking 和保留 thinking](/zh-CN/providers/zai#thinking-and-preserved-thinking)。
- `localService`：可选的提供商级进程管理器，用于本地/自托管模型服务器。当所选模型属于该提供商时，OpenClaw 会探测 `healthUrl`（或 `baseUrl + "/models"`），如果端点离线，则用 `args` 启动 `command`，最多等待 `readyTimeoutMs`，然后发送模型请求。`command` 必须是绝对路径。`idleStopMs: 0` 会让进程保持运行直到 OpenClaw 退出；正值会在对应数量的空闲毫秒后停止由 OpenClaw 启动的进程。请参阅 [本地模型服务](/zh-CN/gateway/local-model-services)。
- 运行时策略属于提供商或模型，不属于 `agents.defaults`。使用 `models.providers.<provider>.agentRuntime` 设置提供商范围规则，或使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` 设置模型特定规则。官方 OpenAI provider 上的 OpenAI 智能体模型默认选择 Codex。
- 会变更这些字段的配置写入器（例如 `/models set`、`/models set-image` 和回退添加/移除命令）会保存规范对象形式，并尽可能保留现有回退列表。
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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`：`"auto"`、`"openclaw"`、已注册的插件 harness id，或受支持的 CLI 后端别名。内置 Codex 插件会注册 `codex`；内置 Anthropic 插件提供 `claude-cli` CLI 后端。
- `id: "auto"` 让已注册的插件 harness 接管受支持的轮次，并在没有 harness 匹配时使用 OpenClaw。显式插件运行时（例如 `id: "codex"`）要求该 harness 存在；如果它不可用或失败，则会失败关闭。
- `id: "pi"` 仅作为 `openclaw` 的弃用别名被接受，用于保留 v2026.5.22 及更早版本中已发布的配置。新配置应使用 `openclaw`。
- 运行时优先级首先是精确模型策略（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`），然后是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最后是 `models.providers.<provider>.agentRuntime` 处的提供商级策略。
- 整个智能体范围的运行时键是旧版配置。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、会话运行时固定项和 `OPENCLAW_AGENT_RUNTIME` 会被运行时选择忽略。运行 `openclaw doctor --fix` 移除过期值。
- OpenAI 智能体模型默认使用 Codex harness；当你想显式指定时，提供商/模型 `agentRuntime.id: "codex"` 仍然有效。
- 对于 Claude CLI 部署，优先使用 `model: "anthropic/claude-opus-4-8"` 加模型作用域的 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/claude-opus-4-7` 模型引用仍会为兼容性继续工作，但新配置应保持提供商/模型选择为规范形式，并把执行后端放在提供商/模型运行时策略中。
- 这仅控制文本智能体轮次执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用其提供商/模型设置。

**内置别名简写**（仅在模型位于 `agents.defaults.models` 中时适用）：

| 别名                | 模型                            |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 以进行工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
Anthropic Claude Opus 4.8 在 OpenClaw 中默认关闭思考；当显式启用自适应思考时，Anthropic 提供商拥有的 effort 默认值为 `high`。Claude 4.6 模型在未设置显式思考级别时默认使用 `adaptive`。

### `agents.defaults.cliBackends`

用于纯文本后备运行的可选 CLI 后端（无工具调用）。当 API 提供商失败时，可用作备份。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- CLI 后端以文本为主；工具始终禁用。
- 设置 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时，支持图片透传。
- `reseedFromRawTranscriptWhenUncompacted: true` 允许后端在第一个压缩摘要存在之前，从有界的原始 OpenClaw 转录尾部恢复安全的失效会话。凭证配置文件或凭据纪元变更仍然绝不会进行原始重新播种。

### `agents.defaults.promptOverlays`

按模型系列应用于 OpenClaw 组装的提示词表面的、与提供商无关的提示词叠加。GPT-5 系列模型 id 会在 OpenClaw/提供商路由中接收共享行为契约；`personality` 仅控制友好的交互风格层。原生 Codex 应用服务器路由保留 Codex 拥有的基础/模型指令，而不是此 OpenClaw GPT-5 叠加，并且 OpenClaw 会为原生线程禁用 Codex 的内置 personality。

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
- `"off"` 仅禁用友好层；带标签的 GPT-5 行为契约仍保持启用。
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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`：持续时间字符串（ms/s/m/h）。默认：`30m`（API key 凭证）或 `1h`（OAuth 凭证）。设置为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，会从系统提示词中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认：`true`。
- `suppressToolErrorWarnings`：为 true 时，在 Heartbeat 运行期间抑制工具错误警告载荷。
- `timeoutSeconds`：Heartbeat 智能体轮次在被中止前允许的最长秒数。保持未设置时，如果设置了 `agents.defaults.timeoutSeconds` 则使用它，否则使用 Heartbeat 节奏并上限为 600 秒。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许直接目标投递。`block` 抑制直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，Heartbeat 运行使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 Heartbeat 都在没有先前对话历史的新会话中运行。与 cron `sessionTarget: "isolated"` 使用相同的隔离模式。将每次 Heartbeat 的 token 成本从约 100K 降至约 2-5K token。
- `skipWhenBusy`：为 true 时，Heartbeat 运行会因该智能体的额外繁忙通道而延后：其自身按会话键划分的子智能体或嵌套命令工作。即使没有此标志，Cron 通道也始终会延后 Heartbeat。
- 按智能体配置：设置 `agents.list[].heartbeat`。当任何智能体定义 `heartbeat` 时，**只有这些智能体**运行 Heartbeat。
- Heartbeat 会运行完整智能体轮次——间隔越短消耗的 token 越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` 或 `safeguard`（用于长历史记录的分块摘要）。参见 [压缩](/zh-CN/concepts/compaction)。
- `provider`: 已注册压缩提供商插件的 ID。设置后会调用该提供商的 `summarize()`，而不是内置 LLM 摘要生成。失败时会回退到内置摘要。设置提供商会强制使用 `mode: "safeguard"`。参见 [压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`: 单次压缩操作在 OpenClaw 中止前允许的最大秒数。默认值：`180`。
- `keepRecentTokens`: 智能体用于逐字保留最近转录尾部的截断点预算。显式设置时，手动 `/compact` 会遵循该值；否则手动压缩是一个硬检查点。
- `identifierPolicy`: `strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要生成期间预置内置的不透明标识符保留指导。
- `identifierInstructions`: 当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`: 针对 safeguard 摘要的格式错误输出重试检查。在 safeguard 模式下默认启用；设置 `enabled: false` 可跳过审计。
- `midTurnPrecheck`: 可选的工具循环压力检查。当 `enabled: true` 时，OpenClaw 会在追加工具结果后、下一次模型调用前检查上下文压力。如果上下文不再适配，它会在提交提示词前中止当前尝试，并复用现有的预检查恢复路径来截断工具结果，或进行压缩后重试。适用于 `default` 和 `safeguard` 两种压缩模式。默认值：禁用。
- `postCompactionSections`: 压缩后要重新注入的可选 AGENTS.md H2/H3 章节名称。未设置或设置为 `[]` 时禁用重新注入。显式设置 `["Session Startup", "Red Lines"]` 会启用这一对章节，并保留旧版 `Every Session`/`Safety` 回退。仅当额外上下文值得承担重复项目指导（这些指导可能已被压缩摘要捕获）的风险时，才启用此项。
- `model`: 仅用于压缩摘要生成的可选 `provider/model-id`，或来自 `agents.defaults.models` 的裸别名。裸别名会在分派前解析；发生冲突时，已配置的字面模型 ID 保持优先级。当主会话应保留一个模型、而压缩摘要应在另一个模型上运行时使用此项；未设置时，压缩使用会话的主模型。
- `maxActiveTranscriptBytes`: 可选字节阈值（`number` 或类似 `"20mb"` 的字符串），当活动 JSONL 超过该阈值时，会在运行前触发正常的本地压缩。需要 `truncateAfterCompaction`，以便压缩成功后可以轮转到更小的后继转录。未设置或为 `0` 时禁用。
- `notifyUser`: 为 `true` 时，在压缩开始和完成时向用户发送简短通知（例如，“正在压缩上下文...”和“压缩完成”）。默认禁用，以保持压缩静默。
- `memoryFlush`: 自动压缩前的静默智能体轮次，用于存储持久记忆。当此维护轮次应保持在本地模型上时，将 `model` 设置为精确的提供商/模型，例如 `ollama/qwen3:8b`；该覆盖不会继承活动会话的回退链。当工作区为只读时会跳过。

### `agents.defaults.runRetries`

嵌入式 Agent Runtimes 的外层运行循环重试迭代边界，用于防止故障恢复期间出现无限执行循环。请注意，此设置目前仅适用于嵌入式 Agent Runtimes，不适用于 ACP 或 CLI 运行时。

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: 外层运行循环的基础运行重试迭代次数。默认值：`24`。
- `perProfile`: 每个回退配置候选额外授予的运行重试迭代次数。默认值：`8`。
- `min`: 运行重试迭代次数的绝对最小限制。默认值：`32`。
- `max`: 运行重试迭代次数的绝对最大限制，用于防止失控执行。默认值：`160`。

### `agents.defaults.contextPruning`

在发送给 LLM 前，从内存上下文中剪枝**旧工具结果**。**不会**修改磁盘上的会话历史。

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

<Accordion title="cache-ttl 模式行为">

- `mode: "cache-ttl"` 启用剪枝流程。
- `ttl` 控制剪枝多久之后可以再次运行（自上次缓存触达后计算）。
- 剪枝会先软裁剪过大的工具结果，然后在需要时硬清除更旧的工具结果。
- `softTrimRatio` 和 `hardClearRatio` 接受从 `0.0` 到 `1.0` 的值；配置验证会拒绝该范围外的值。

**软裁剪**会保留开头 + 结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

注意：

- 图像块永远不会被裁剪/清除。
- 比例基于字符数（近似），不是精确的 token 数。
- 如果助手消息少于 `keepLastAssistants` 条，则跳过剪枝。

</Accordion>

有关行为详情，请参见 [会话剪枝](/zh-CN/concepts/session-pruning)。

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
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及按账户的变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`: 分块回复之间的随机暂停。`natural` = 800–2500ms。按智能体覆盖：`agents.list[].humanDelay`。

有关行为和分块详情，请参见 [流式传输](/zh-CN/concepts/streaming)。

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

参见 [输入状态指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南请参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

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

- `docker`: 本地 Docker 运行时（默认）
- `ssh`: 通用 SSH 支持的远程运行时
- `openshell`: OpenShell 运行时

选择 `backend: "openshell"` 时，运行时特定设置会移到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`: `user@host[:port]` 形式的 SSH 目标
- `command`: SSH 客户端命令（默认值：`ssh`）
- `workspaceRoot`: 用于按作用域工作区的绝对远程根目录
- `identityFile` / `certificateFile` / `knownHostsFile`: 传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`: 内联内容或 SecretRefs，OpenClaw 会在运行时将其物化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH 主机密钥策略旋钮

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 基于 SecretRef 的 `*Data` 值会在沙箱会话启动前，从活动密钥运行时快照中解析

**SSH 后端行为：**

- 创建或重新创建后，会播种一次远程工作区
- 随后保持远程 SSH 工作区为规范来源
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程变更同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`: 位于 `~/.openclaw/sandboxes` 下的按作用域沙箱工作区
- `ro`: 沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`: 智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`: 每个会话一个容器 + 工作区
- `agent`: 每个智能体一个容器 + 工作区（默认）
- `shared`: 共享容器和工作区（无跨会话隔离）

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

- `mirror`：exec 前从本地播种远程，exec 后同步回来；本地工作区保持为权威副本
- `remote`：创建沙箱时播种远程一次，然后保持远程工作区为权威副本

在 `remote` 模式下，播种步骤之后，在 OpenClaw 外部进行的主机本地编辑不会自动同步到沙箱中。
传输方式是通过 SSH 进入 OpenShell 沙箱，但该插件负责沙箱生命周期和可选的镜像同步。

**`setupCommand`** 在容器创建后运行一次（通过 `sh -lc`）。需要网络出站、可写 root、root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 会被阻止。`"container:<id>"` 默认会被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（应急开关）。
活跃 OpenClaw 沙箱中的 Codex app-server 轮次会使用同一出站设置来进行其原生代码模式网络访问。

**入站附件** 会暂存到活跃工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局绑定和按智能体绑定会合并。

**沙箱隔离浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 会注入系统提示词。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出一个短期有效的令牌 URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用桥接网络）。仅当你明确需要全局桥接连通性时才设置为 `bridge`。
- `cdpSourceRange` 可选地将容器边缘的 CDP 入站限制为一个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅会把额外的主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替代浏览器容器的 `docker.binds`。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并针对容器主机进行了调优：
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
    默认启用；如果 WebGL/3D 使用需要，可以用
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用。
  - 如果你的工作流依赖扩展，`OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展。
  - `--renderer-process-limit=2` 可以用
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 修改；设置为 `0` 可使用 Chromium 的
    默认进程限制。
  - 当 `noSandbox` 启用时，还会加上 `--no-sandbox`。
  - 默认值是容器镜像基线；如需修改容器默认值，请使用带自定义
    entrypoint 的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅支持 Docker。

构建镜像（从源代码检出）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

对于没有源代码检出的 npm 安装，请参阅 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，了解内联 `docker build` 命令。

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 为某个智能体提供自己的 TTS 提供商、声音、模型、
风格或自动 TTS 模式。智能体块会深度合并到全局
`messages.tts` 之上，因此共享凭证可以保留在一个位置，而各个
智能体只覆盖它们需要的声音或提供商字段。活跃智能体的
覆盖会应用于自动语音回复、`/tts audio`、`/tts status` 和
`tts` 智能体工具。请参阅[文本转语音](/zh-CN/tools/tts#per-agent-voice-overrides)，
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
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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

- `id`：稳定的智能体 id（必需）。
- `default`：当设置多个时，第一个生效（会记录警告）。如果没有设置，则列表中的第一个条目为默认。
- `model`：字符串形式会为该智能体设置严格的主模型，且没有模型 fallback；对象形式 `{ primary }` 也同样严格，除非你添加 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 可让该智能体选择启用 fallback，或使用 `{ primary, fallbacks: [] }` 明确采用严格行为。仅覆盖 `primary` 的 Cron 作业仍会继承默认 fallback，除非你设置 `fallbacks: []`。
- `utilityModel`：可选的按智能体覆盖，用于生成会话和线程标题等短内部任务。会 fallback 到 `agents.defaults.utilityModel`，然后是该智能体的主模型。
- `params`：按智能体配置的流参数，会合并到 `agents.defaults.models` 中选定的模型条目之上。用它为特定智能体覆盖 `cacheRetention`、`temperature` 或 `maxTokens` 等，而不需要复制整个模型目录。
- `tts`：可选的按智能体文本转语音覆盖。该块会深度合并到 `messages.tts` 之上，因此请将共享提供商凭证和 fallback 策略保留在 `messages.tts` 中，并只在这里设置特定人格相关的值，例如提供商、声音、模型、风格或自动模式。
- `skills`：可选的按智能体 Skills 允许列表。如果省略，智能体会在设置时继承 `agents.defaults.skills`；显式列表会替代默认值而不是合并，`[]` 表示没有 Skills。
- `thinkingDefault`：可选的按智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置按消息或会话覆盖时，会为该智能体覆盖 `agents.defaults.thinkingDefault`。选定的提供商/模型 profile 控制哪些值有效；对于 Google Gemini，`adaptive` 会保留提供商拥有的动态思考（Gemini 3/3.1 上省略 `thinkingLevel`，Gemini 2.5 上为 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的按智能体默认推理可见性（`on | off | stream`）。当未设置按消息或会话推理覆盖时，会为该智能体覆盖 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：可选的按智能体快速模式默认值（`"auto" | true | false`）。当未设置按消息或会话快速模式覆盖时适用。
- `models`：可选的按智能体模型目录/运行时覆盖，键为完整的 `provider/model` id。使用 `models["provider/model"].agentRuntime` 配置按智能体运行时例外。
- `runtime`：可选的按智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 并配置 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- 本地工作区相对的 `identity.avatar` 图片文件限制为 2 MB。`http(s)` URL 和 `data:` URI 不会使用本地文件大小限制检查。
- `identity` 会派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：显式 `sessions_spawn.agentId` 目标的已配置智能体 id 允许列表（`["*"]` = 任意已配置目标；默认：仅同一智能体）。当应允许自目标 `agentId` 调用时，请包含请求者 id。已删除智能体配置的过时条目会被 `sessions_spawn` 拒绝，并从 `agents_list` 中省略；运行 `openclaw doctor --fix` 清理它们，或者如果该目标在继承默认值的同时仍应可被生成，请添加一个最小 `agents.list[]` 条目。
- 沙箱继承防护：如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些会以非沙箱方式运行的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择 profile；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关内运行多个隔离的智能体。请参阅[多智能体](/zh-CN/concepts/multi-agent)。

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

- `type`（可选）：`route` 用于普通路由（缺失 type 默认是 route），`acp` 用于持久 ACP 对话绑定。
- `match.channel`（必需）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；特定渠道）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道）
6. 默认智能体

在每一层级内，第一个匹配的 `bindings` 条目生效。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份（`match.channel` + 账号 + `match.peer.id`）解析，而不会使用上面的 route 绑定层级顺序。

### 按智能体访问 profile

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

有关优先级细节，请参阅[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
      mode: "enforce", // enforce (default) | warn
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
  - `per-sender`（默认）：每个发送者在一个渠道上下文内获得隔离的会话。
  - `global`：一个渠道上下文中的所有参与者共享单个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：跨渠道按发送者 ID 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 ID 映射到带提供商前缀的对端，以便跨渠道共享会话。`/dock_discord` 等 Dock 命令使用同一张映射，将活跃会话的回复路由切换到另一个已关联的渠道对端；请参阅[渠道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主要重置策略。`daily` 在本地时间 `atHour` 重置；`idle` 在 `idleMinutes` 后重置。两者同时配置时，先到期者生效。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。Heartbeat、cron 唤醒、exec 通知和 Gateway 网关记账等后台/系统事件写入可以更新 `updatedAt`，但它们不会让每日/空闲会话保持新鲜。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名。
- **`mainKey`**：旧版字段。运行时始终使用 `"main"` 作为主直接聊天桶。
- **`agentToAgent.maxPingPongTurns`**：Agent 到 Agent 交换期间，智能体之间来回回复的最大轮数（整数，范围：`0`-`20`，默认：`5`）。`0` 会禁用来回链式回复。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，带旧版 `dm` 别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个拒绝规则生效。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`enforce` 会执行清理并且是默认值；`warn` 仅发出警告。
  - `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。运行时写入批量清理时会为生产规模上限保留一个小的高水位缓冲；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - 短生命周期的 Gateway 网关模型运行探测会话使用固定 `24h` 保留期，但清理由压力门控：只有达到会话条目维护/上限压力时，才会移除陈旧的严格模型运行探测行。只有匹配 `agent:*:explicit:model-run-<uuid>` 的严格显式探测键符合条件；普通 direct、group、thread、cron、hook、Heartbeat、ACP 和子智能体会话不会继承这个 24h 保留期。模型运行清理执行时，会先于更广泛的 `pruneAfter` 陈旧条目清理和 `maxEntries` 上限执行。
  - `rotateBytes`：已弃用并被忽略；`openclaw doctor --fix` 会从旧配置中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留期。默认使用 `pruneAfter`；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会优先移除最旧的工件/会话。
  - `highWaterBytes`：预算清理后的可选目标。默认为 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认不活动自动取消聚焦小时数（`0` 禁用；提供商可以覆盖）
  - `maxAgeHours`：默认硬性最长年龄小时数（`0` 禁用；提供商可以覆盖）
  - `spawnSessions`：从 `sessions_spawn` 和 ACP 线程生成创建线程绑定工作会话的默认门控。线程绑定启用时默认为 `true`；提供商/账号可以覆盖。
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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

解析方式（最具体者优先）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 派生为 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述                 | 示例                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 短模型名称           | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称           | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别         | `high`, `low`, `off`        |
| `{identity.name}` | 智能体身份名称       | （同 `"auto"`）             |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认回应

- 默认使用活跃智能体的 `identity.emoji`，否则使用 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → 身份回退值。
- 作用域：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord、Signal、Telegram、WhatsApp 和 iMessage 等支持回应的渠道上，会在回复后移除确认回应。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 和 WhatsApp 上启用生命周期状态回应。
  在 Slack 和 Discord 上，未设置时会在确认回应处于活跃状态时保持状态回应启用。
  在 Signal、Telegram 和 WhatsApp 上，需要显式设为 `true` 才能启用生命周期状态回应。
- `messages.statusReactions.emojis`：覆盖生命周期表情键：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 只允许固定的回应集合，因此不支持的已配置表情会回退到该聊天最接近的受支持状态变体。

### 入站防抖

将同一发送者快速连续发送的纯文本消息批处理为单个智能体轮次。媒体/附件会立即刷新。控制命令会绕过防抖。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` 控制默认 auto-TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好设置，`/tts status` 会显示生效状态。
- `summaryModel` 会覆盖 `agents.defaults.model.primary`，用于自动摘要。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（选择启用）。
- API key 会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请包含你要使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 ID 会作为 `microsoft` 的别名被接受。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序是先配置，然后是 `OPENAI_TTS_BASE_URL`，最后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为 OpenAI 兼容的 TTS 服务器，并放宽模型/语音校验。

---

## Talk

Talk 模式（macOS/iOS/Android）的默认值。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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
- 仅在未配置 Talk API key 时，才会应用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许 Talk 指令使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 辅助程序使用的 Hugging Face 仓库。如果省略，macOS 会使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会在存在时通过内置 `openclaw-mlx-tts` 辅助程序运行，或通过 `PATH` 上的可执行文件运行；`OPENCLAW_MLX_TTS_BIN` 会覆盖开发用辅助程序路径。
- `consultThinkingLevel` 控制 Control UI Talk 实时 `openclaw_agent_consult` 调用背后的完整 OpenClaw agent 运行的思考级别。保持未设置可保留正常会话/模型行为。
- `consultFastMode` 为 Control UI Talk 实时咨询设置一次性快速模式覆盖，而不会更改会话的正常快速模式设置。
- `speechLocale` 设置 iOS/macOS Talk 语音识别使用的 BCP 47 语言区域 ID。保持未设置可使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户静默后等待多长时间再发送转录文本。未设置时会保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）。
- `realtime.instructions` 会向 OpenClaw 内置实时提示追加面向提供商的系统指令，因此可以配置语音风格，而不会丢失默认的 `openclaw_agent_consult` 指引。
- `realtime.consultRouting` 控制当实时提供商生成最终用户转录文本但没有 `openclaw_agent_consult` 时的 Gateway 网关中继回退：`provider-direct` 会保留直接提供商回复，而 `force-agent-consult` 会通过 OpenClaw 路由最终请求。

---

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

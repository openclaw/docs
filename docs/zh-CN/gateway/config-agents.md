---
read_when:
    - 调整智能体默认设置（模型、思考、工作区、Heartbeat、媒体、Skills）
    - 配置多 Agent 路由和绑定
    - 调整会话、消息投递和 Talk 模式行为
summary: Agent 默认设置、多 Agent 路由、会话、消息和 Talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-07-12T14:28:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 054fbb866e4c02a64a1e8041421a478e3c1fd01311f57f293c6420a6516ebddb
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下的 Agent 范围配置键。有关渠道、工具、Gateway 网关运行时和其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## Agent 默认配置

### `agents.defaults.workspace`

默认值：如果设置了 `OPENCLAW_WORKSPACE_DIR`，则使用该值；否则为 `~/.openclaw/workspace`（当 `OPENCLAW_PROFILE` 设置为非默认配置文件时，则为 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

显式设置的 `agents.defaults.workspace` 值优先于 `OPENCLAW_WORKSPACE_DIR`。如果你不想将路径写入配置，可使用该环境变量让默认 Agent 指向已挂载的工作区。

### `agents.defaults.repoRoot`

可选的仓库根目录，显示在系统提示词的 Runtime 行中。如果未设置，OpenClaw 会从工作区开始向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

可选的默认 Skills 允许列表，适用于未设置 `agents.list[].skills` 的 Agent。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 不使用 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills`，默认不限制 Skills。
- 省略 `agents.list[].skills`，以继承默认值。
- 设置 `agents.list[].skills: []`，表示不使用 Skills。
- 非空的 `agents.list[].skills` 列表是该 Agent 的最终集合，不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁止自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

跳过创建选定的可选工作区文件，同时仍写入必需的引导文件（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

- `"continuation-skip"`：安全的续接轮次（在助手完成响应后）跳过重新注入工作区引导文件，从而减小提示词大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每个轮次中禁用工作区引导文件和上下文文件注入。仅将此选项用于完全自行管理提示词生命周期的 Agent（自定义上下文引擎、自行构建上下文的原生运行时，或不使用引导文件的专用工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

按 Agent 覆盖：`agents.list[].contextInjection`。省略的值会继承 `agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件在截断前允许的最大字符数。默认值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

按 Agent 覆盖：`agents.list[].bootstrapMaxChars`。省略的值会继承 `agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件总共可注入的最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

按 Agent 覆盖：`agents.list[].bootstrapTotalMaxChars`。省略的值会继承 `agents.defaults.bootstrapTotalMaxChars`。

### 按 Agent 覆盖引导配置文件

当某个 Agent 需要不同于共享默认值的提示词注入行为时，请使用按 Agent 覆盖的引导配置文件。省略的字段会继承自 `agents.defaults`。

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

控制引导上下文被截断时，系统提示词中 Agent 可见的通知。默认值：`"always"`。

- `"off"`：绝不向系统提示词注入截断通知文本。
- `"once"`：每个唯一的截断签名仅注入一次简短通知。
- `"always"`：存在截断时，每次运行都注入简短通知（推荐）。

详细的原始/注入计数和配置调优字段会保留在上下文/状态报告和日志等诊断信息中；常规 WebChat 用户/运行时上下文只会收到简短的恢复通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文预算所有权映射

OpenClaw 有多个大容量提示词/上下文预算，它们按子系统有意拆分，而不是全部通过一个通用配置项进行控制。

| 预算                                                            | 涵盖范围                                                                                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 常规工作区引导注入                                                                                                                                                      |
| `agents.defaults.startupContext.*`                             | 一次性重置/启动模型运行前置上下文，包括近期的每日 `memory/*.md` 文件。单独发送聊天命令 `/new` 和 `/reset` 时，系统会确认操作，但不会调用模型                             |
| `skills.limits.*`                                              | 注入系统提示词的精简 Skills 列表                                                                                                                                        |
| `agents.defaults.contextLimits.*`                              | 有界运行时摘录和注入的运行时自有块                                                                                                                                      |
| `memory.qmd.limits.*`                                          | 索引记忆搜索片段和注入大小                                                                                                                                              |

对应的单 Agent 覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制重置/启动模型运行时注入的首轮启动前置上下文。单独发送聊天命令 `/new` 和 `/reset` 时，系统会确认重置，但不会调用模型，因此不会加载此前置上下文。

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

- `memoryGetMaxChars`：添加截断元数据和继续读取提示前，`memory_get` 摘录的默认上限。
- `memoryGetDefaultLines`：省略 `lines` 时，`memory_get` 的默认行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的高级实时工具结果上限。若不设置，则使用模型上下文自动上限：低于 100K 个 token 时为 `16000` 个字符，达到 100K+ 个 token 时为 `32000` 个字符，达到 200K+ 个 token 时为 `64000` 个字符。对于长上下文模型，可接受最高 `1000000` 的显式值，但有效上限仍限制为模型上下文窗口的约 30%。`openclaw doctor --deep` 会输出有效上限，并且 Doctor 仅在显式覆盖值已过时或不起作用时发出警告。
- `postCompactionMaxChars`：压缩后刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 配置项的单 Agent 覆盖。省略的字段会继承 `agents.defaults.contextLimits`。

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // 此 Agent 的高级上限
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系统提示词的精简 Skills 列表的全局上限。这不会影响按需读取 `SKILL.md` 文件。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

单 Agent 的 Skills 提示词预算覆盖。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

调用提供商前，转录内容/工具图像块中图像最长边的最大像素尺寸。
默认值：`1200`。

对于大量使用截图的运行，较低的值通常可以减少视觉 token 用量和请求载荷大小。较高的值可以保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

从文件路径、URL 和媒体引用加载图像时，图像工具的压缩/细节偏好。
默认值：`auto`。

OpenClaw 会根据所选图像模型调整缩放阶梯。例如，与较旧的模型或默认的高细节视觉路径相比，Claude Opus 4.8、OpenAI GPT-5.6 Sol、Qwen VL 和托管式 Llama 4 视觉模型可以使用更大的图像；而在 `auto` 模式下，多图像轮次会进行更激进的压缩，以控制 token 和延迟成本。

可选值：

- `auto`：根据模型限制和图像数量进行调整。
- `efficient`：优先使用较小的图像，以减少 token 和字节用量。
- `balanced`：使用标准的折中缩放阶梯。
- `high`：为截图、图表和文档图像保留更多细节。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

系统提示词上下文使用的时区（不是消息时间戳）。未设置时回退到主机时区。

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
      params: { cacheRetention: "long" }, // 全局默认提供商参数
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式仅设置主模型。
  - 对象形式设置主模型及按顺序排列的故障转移模型。
- `utilityModel`：可选的 `provider/model` 引用或别名，用于简短的内部任务。目前用于生成 Control UI 会话标题、Telegram 私信主题标题、Discord 自动线程标题和[进度草稿旁白](/zh-CN/concepts/progress-drafts#narrated-status)。未设置时，如果主提供商声明了小模型默认值，OpenClaw 会采用该值（OpenAI → `gpt-5.6-luna`，Anthropic → `claude-haiku-4-5`）；否则，标题任务回退到智能体的主模型，旁白则保持关闭。设置 `utilityModel: ""` 可完全禁用实用模型路由。`agents.list[].utilityModel` 会覆盖默认值（每个智能体的空值会为该智能体禁用此功能），而操作专用的模型覆盖优先级高于两者。实用任务会发起单独的模型调用，并将任务专用内容发送给所选模型提供商。仪表板标题生成最多发送第一条非命令消息的前 1,000 个字符；旁白会发送入站请求以及经过脱敏的精简工具摘要。请选择符合你的成本和数据处理要求的提供商。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `image` 工具路径用作其视觉模型配置。
  - 当所选模型或默认模型无法接受图像输入时，也用于回退路由。
  - 建议使用显式的 `provider/model` 引用。为兼容性也接受裸 ID；如果某个裸 ID 在 `models.providers.*.models` 中唯一匹配一个已配置且支持图像的条目，OpenClaw 会为其补全该提供商。若存在多个已配置的匹配项，则必须显式指定提供商前缀。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享图像生成能力以及未来任何生成图像的工具或插件界面使用。
  - 典型值：原生 Gemini 图像生成使用 `google/gemini-3.1-flash-image-preview`，fal 使用 `fal/fal-ai/flux/dev`，OpenAI Images 使用 `openai/gpt-image-2`，需要透明背景的 OpenAI PNG/WebP 输出则使用 `openai/gpt-image-1.5`。
  - 如果直接选择提供商/模型，还需配置匹配的提供商身份验证（例如，`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断出由身份验证支持的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享音乐生成能力和内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断出由身份验证支持的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。
  - 如果直接选择提供商/模型，还需配置匹配的提供商身份验证/API 密钥。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由共享视频生成能力和内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断出由身份验证支持的默认提供商。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果直接选择提供商/模型，还需配置匹配的提供商身份验证/API 密钥。
  - 官方 Qwen 视频生成插件最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 由 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会先回退到 `imageModel`，然后回退到解析后的会话/默认模型。
- `pdfMaxBytesMb`：调用时未传递 `maxBytesMb` 时，`pdf` 工具使用的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在提取回退模式下考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。可选值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `toolProgressDetail`：用于 `/verbose` 工具摘要和进度草稿工具行的详细信息模式。可选值：`"explain"`（默认，精简的易读标签）或 `"raw"`（可用时附加原始命令/详细信息）。每个智能体的 `agents.list[].toolProgressDetail` 会覆盖此默认值。
- `reasoningDefault`：智能体的默认推理可见性。可选值：`"off"`、`"on"`、`"stream"`。每个智能体的 `agents.list[].reasoningDefault` 会覆盖此默认值。仅当没有设置每条消息或会话的推理覆盖时，配置的推理默认值才会应用于所有者、已授权发送者或操作员管理员 Gateway 网关上下文。
- `elevatedDefault`：智能体的默认提升权限输出级别。可选值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如，通过 Codex OAuth 访问时使用 `openai/gpt-5.6-sol`）。如果省略提供商，OpenClaw 会先尝试别名，再查找与该确切模型 ID 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商（这是已弃用的兼容行为，因此建议使用显式的 `provider/model`）。如果该提供商不再提供已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露已移除提供商的过期默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目可包含 `alias`（快捷方式）和 `params`（提供商专用参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `"openai/*": {}` 或 `"vllm/*": {}` 等 `provider/*` 条目，可以显示所选提供商中发现的所有模型，而无需手动列出每个模型 ID。
  - 当某个提供商的所有动态发现模型都应使用相同运行时时，请向 `provider/*` 条目添加 `agentRuntime`。精确的 `provider/model` 运行时策略仍优先于通配符。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传递 `--replace`，否则 `config set` 会拒绝将导致现有允许列表条目被移除的替换操作。
  - 提供商范围的配置/新手引导流程会将所选提供商的模型合并到此映射中，并保留已配置的其他无关提供商。
  - 对于直接使用 OpenAI Responses 的模型，系统会自动启用服务端压缩。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。请参阅 [OpenAI 服务端压缩](/zh-CN/providers/openai#advanced-configuration)。
- `params`：应用于所有模型的全局默认提供商参数。在 `agents.defaults.params` 中设置（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（每个模型）覆盖，然后 `agents.list[].params`（匹配的智能体 ID）按键覆盖。详情请参阅[提示词缓存](/zh-CN/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 范围的默认提供商路由策略。OpenClaw 会将其转发到 OpenRouter 请求的 `provider` 对象；每个模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 和智能体参数会按键覆盖。请参阅 [OpenRouter 提供商路由](/zh-CN/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，则额外请求体优先；非原生 completions 路由随后仍会移除仅限 OpenAI 的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容的聊天模板参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于关闭思考的 `vllm/nemotron-3-*`，内置 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式的 `chat_template_kwargs` 会覆盖生成的默认值，而 `extra_body.chat_template_kwargs` 仍具有最终优先级。已配置的 vLLM Qwen 和 Nemotron 思考模型会提供二元 `/think` 选项（`off`、`on`），而不是多级强度阶梯。
- `compat.thinkingFormat`：OpenAI 兼容的思考载荷样式。Together 风格的 `reasoning.enabled` 使用 `"together"`，Qwen 风格的顶层 `enable_thinking` 使用 `"qwen"`，对于支持请求级聊天模板 kwargs 的 Qwen 系列后端（例如 vLLM），`chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 会将禁用思考映射为 `false`，将启用思考映射为 `true`，并且已配置的 vLLM Qwen 模型会为这些格式提供二元 `/think` 选项。
- `compat.supportedReasoningEfforts`：每个模型的 OpenAI 兼容推理强度列表。对于确实接受 `"xhigh"` 的自定义端点，请将其包含在列表中；随后，OpenClaw 会在命令菜单、Gateway 网关会话行、会话补丁验证、智能体 CLI 验证和该已配置提供商/模型的 `llm-task` 验证中提供 `/think xhigh`。如果后端需要为规范级别使用提供商专用值，请使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：仅限 Z.AI 的保留思考选择性启用项。启用且思考处于开启状态时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放之前的 `reasoning_content`；请参阅 [Z.AI 思考与保留思考](/zh-CN/providers/zai#advanced-configuration)。
- `localService`：用于本地/自托管模型服务器的可选提供商级进程管理器。当所选模型属于该提供商时，OpenClaw 会探测 `healthUrl`（或 `baseUrl + "/models"`）；如果端点不可用，则使用 `args` 启动 `command`，等待最多 `readyTimeoutMs`，然后发送模型请求。`command` 必须是绝对路径。`idleStopMs: 0` 会让进程一直运行到 OpenClaw 退出；正值会在指定的空闲毫秒数后停止由 OpenClaw 启动的进程。请参阅[本地模型服务](/zh-CN/gateway/local-model-services)。
- 运行时策略应配置在提供商或模型上，而不是 `agents.defaults` 上。提供商范围的规则使用 `models.providers.<provider>.agentRuntime`，模型专用规则使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。仅凭提供商/模型前缀绝不会选择 harness。当运行时未设置或设为 `auto` 时，OpenAI 仅可对没有自定义请求覆盖的确切官方 HTTPS Platform Responses 或 ChatGPT Responses 路由隐式选择 Codex。请参阅 [OpenAI 隐式智能体运行时](/zh-CN/providers/openai#implicit-agent-runtime)。
- 修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及添加/移除回退项的命令）会保存规范对象形式，并尽可能保留现有回退列表。
- `maxConcurrent`：跨会话并行运行智能体的最大数量（每个会话内部仍会串行执行）。默认值：`4`。

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
      model: "openai/gpt-5.6-sol",
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

- `id`：`"auto"`、`"openclaw"`、已注册的插件 harness ID，或受支持的 CLI 后端别名。内置 Codex 插件注册了 `codex`；内置 Anthropic 插件提供 `claude-cli` CLI 后端。
- `id: "auto"` 允许已注册的插件 harness 接管声明或以其他方式满足其支持契约的有效路由，并在没有 harness 匹配时使用 OpenClaw。显式插件运行时（例如 `id: "codex"`）要求该 harness 和兼容的有效路由；如果任一项不可用或执行失败，它将以关闭方式失败。
- `id: "pi"` 仅作为 `openclaw` 的已弃用别名接受，以保留 v2026.5.22 及更早版本中已发布的配置。新配置应使用 `openclaw`。
- 运行时优先级依次为：精确模型策略（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`），然后是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最后是 `models.providers.<provider>.agentRuntime` 中的提供商级策略。
- 整个智能体范围的运行时键属于旧版配置。运行时选择会忽略 `agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、会话运行时固定项和 `OPENCLAW_AGENT_RUNTIME`。运行 `openclaw doctor --fix` 以移除过时值。
- 符合条件的精确官方 HTTPS OpenAI Responses/ChatGPT 路由，如果没有用户编写的请求覆盖项，可以隐式使用 Codex harness。提供商/模型的 `agentRuntime.id: "codex"` 会将 Codex 设为以关闭方式失败的必需项，但不会让不兼容的路由变为兼容。
- 对于 Claude CLI 部署，建议使用 `model: "anthropic/claude-opus-4-8"`，并搭配模型范围的 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/<model>` 引用仍可用于兼容，但新配置应保持提供商/模型选择的规范形式，并将执行后端放在提供商/模型运行时策略中。
- 这仅控制文本智能体轮次的执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用各自的提供商/模型设置。

**内置别名简写**（仅当模型位于 `agents.defaults.models` 中时适用）：

| 别名                  | 模型                            |
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

除非设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`，否则 Z.AI GLM-4.x 模型会自动启用思考模式。
Z.AI 模型默认启用 `tool_stream`，以便流式传输工具调用。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可将其禁用。
在 OpenClaw 中，Anthropic Claude Opus 4.8 默认关闭思考；显式启用自适应思考时，由 Anthropic 提供商负责的 effort 默认值为 `high`。未设置显式思考级别时，Claude 4.6 模型默认为 `adaptive`。

### `agents.defaults.cliBackends`

用于纯文本回退运行的可选 CLI 后端（无工具调用）。适合作为 API 提供商失败时的备用方案。

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
          // 或者，当 CLI 接受提示词文件标志时使用 systemPromptFileArg。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为主；工具始终处于禁用状态。
- 设置 `sessionArg` 后支持会话。
- 当 `imageArg` 接受文件路径时，支持图像透传。
- `reseedFromRawTranscriptWhenUncompacted: true` 允许后端在首次压缩摘要生成前，从有界的 OpenClaw 原始记录末尾恢复可安全恢复的
  已失效会话。身份验证配置文件或凭据纪元发生变化时，
  仍绝不会使用原始记录重新播种。

### `agents.defaults.promptOverlays`

按模型系列应用于 OpenClaw 组装提示词界面的提供商无关提示词叠加层。GPT-5 系列模型 ID 会在 OpenClaw/提供商路由中接收共享行为契约；`personality` 仅控制友好的交互风格层。原生 Codex app-server 路由保留 Codex 自有的基础/模型指令，而不使用此 OpenClaw GPT-5 叠加层，并且 OpenClaw 会为原生线程禁用 Codex 的内置 personality。

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
- 未设置此共享配置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

周期性 Heartbeat 运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 表示禁用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 默认值：true；false 会从系统提示词中省略 Heartbeat 部分
        lightContext: false, // 默认值：false；true 仅保留工作区引导文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认值：false；true 会在新会话中运行每次 Heartbeat（无对话历史记录）
        skipWhenBusy: false, // 默认值：false；true 还会等待此智能体的子智能体/嵌套通道
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认值：none | 可选值：last | whatsapp | telegram | discord | ...
        prompt: "如果 HEARTBEAT.md 存在，请读取它……",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API 密钥身份验证）或 `1h`（OAuth 身份验证）。设置为 `0m` 可禁用。
- `includeSystemPromptSection`：设为 false 时，从系统提示词中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认值：`true`。
- `suppressToolErrorWarnings`：设为 true 时，在 Heartbeat 运行期间抑制工具错误警告负载。
- `timeoutSeconds`：Heartbeat 智能体轮次中止前允许的最长时间（秒）。不设置时，如果配置了 `agents.defaults.timeoutSeconds`，则使用该值；否则使用 Heartbeat 周期，且上限为 600 秒。
- `directPolicy`：直接消息/私信投递策略。`allow`（默认）允许向直接目标投递。`block` 抑制向直接目标投递，并发出 `reason=dm-blocked`。
- `lightContext`：设为 true 时，Heartbeat 运行使用轻量级引导上下文，并且只保留工作区引导文件中的 `HEARTBEAT.md`。
- `isolatedSession`：设为 true 时，每次 Heartbeat 都在不含先前对话历史的新会话中运行。隔离模式与 cron 的 `sessionTarget: "isolated"` 相同。将每次 Heartbeat 的令牌成本从约 100K 降至约 2-5K 个令牌。
- `skipWhenBusy`：设为 true 时，如果该智能体的额外繁忙通道正在运行，Heartbeat 会推迟：包括其自身按会话键控的子智能体或嵌套命令工作。即使未启用此标志，cron 通道也始终会推迟 Heartbeat。
- 按智能体配置：设置 `agents.list[].heartbeat`。当任一智能体定义了 `heartbeat` 时，**仅这些智能体**运行 Heartbeat。
- Heartbeat 会运行完整的智能体轮次——间隔越短，消耗的令牌越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已注册的压缩提供商插件 ID（可选）
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "准确保留部署 ID、工单 ID 和 host:port 对。", // 当 identifierPolicy=custom 时使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 可选的工具循环压力检查
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // 选择启用 AGENTS.md 部分重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选的仅压缩模型覆盖项
        truncateAfterCompaction: true, // 压缩后轮换到更小的后继 JSONL
        maxActiveTranscriptBytes: "20mb", // 可选的预检本地压缩触发条件
        notifyUser: true, // 在压缩开始/完成以及内存刷新降级时发出通知（默认值：false）
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 可选的仅内存刷新模型覆盖项
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "会话即将压缩。立即存储持久记忆。",
          prompt: "将所有需要长期保留的笔记写入 memory/YYYY-MM-DD.md；如果没有内容需要存储，请回复完全一致的静默令牌 NO_REPLY。",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（对较长历史记录进行分块摘要）。请参阅[压缩](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩提供商插件的 ID。设置后，将调用该提供商的 `summarize()`，而不是内置的 LLM 摘要。失败时回退到内置摘要。设置提供商会强制使用 `mode: "safeguard"`。请参阅[压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：单次压缩操作在被 OpenClaw 中止前允许的最大秒数。默认值：`180`。
- `reserveTokens`：压缩后为模型输出和未来工具结果预留的 token 余量。当模型上下文窗口已知时，OpenClaw 会限制有效预留量，使其无法耗尽提示词预算。
- `reserveTokensFloor`：嵌入式运行时强制执行的最小预留量。设置为 `0` 可禁用下限。该下限仍受当前上下文窗口上限约束。
- `keepRecentTokens`：智能体用于逐字保留最新转录末尾内容的截断点预算。显式设置时，手动 `/compact` 会遵循此值；否则，手动压缩是一个硬检查点。
- `recentTurnsPreserve`：在保护性摘要之外逐字保留的最近用户/助手轮次数。默认值：`3`。
- `maxHistoryShare`：压缩后允许保留历史记录占总上下文预算的最大比例（范围为 `0.1`-`0.9`）。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要期间前置内置的不透明标识符保留指导。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：针对保护性摘要的输出格式错误重试检查。保护模式下默认启用；设置 `enabled: false` 可跳过审核。
- `midTurnPrecheck`：可选的工具循环压力检查。当 `enabled: true` 时，OpenClaw 会在追加工具结果后、下一次调用模型前检查上下文压力。如果上下文已无法容纳内容，它会在提交提示词前中止当前尝试，并复用现有的预检查恢复路径来截断工具结果，或进行压缩后重试。适用于 `default` 和 `safeguard` 两种压缩模式。默认值：禁用。
- `postIndexSync`：压缩后的会话记忆重新索引模式。默认值：`"async"`。如需最高的新鲜度，请使用 `"await"`；如需降低压缩延迟，请使用 `"async"`；仅当会话记忆同步由其他位置处理时，才使用 `"off"`。
- `postCompactionSections`：压缩后要重新注入的可选 AGENTS.md H2/H3 章节名称。未设置或设置为 `[]` 时，重新注入功能会被禁用。显式设置 `["Session Startup", "Red Lines"]` 会启用这对章节，并保留旧版 `Every Session`/`Safety` 回退。仅当额外上下文的价值足以抵消重复压缩摘要中已包含的项目指导这一风险时，才启用此选项。
- `model`：仅用于压缩摘要的可选 `provider/model-id`，或来自 `agents.defaults.models` 的裸别名。裸别名会在分派前解析；发生冲突时，已配置的字面模型 ID 优先。当主会话应继续使用一个模型，而压缩摘要应在另一个模型上运行时，请使用此选项；未设置时，压缩使用会话的主模型。
- `truncateAfterCompaction`：压缩后轮换当前会话转录，使未来轮次仅加载摘要和未摘要的末尾内容，同时保留归档的上一份完整转录。防止长期运行的会话中当前转录无限增长。默认值：`false`。
- `maxActiveTranscriptBytes`：可选的字节阈值（`number` 或类似 `"20mb"` 的字符串）；当转录历史记录超过该阈值时，会在运行前触发普通本地压缩。需要启用 `truncateAfterCompaction`，以便成功压缩后能够轮换为更小的后继转录。未设置或设为 `0` 时禁用。
- `notifyUser`：设为 `true` 时，会向用户发送简短的上下文维护通知：压缩开始和完成时（例如，“正在压缩上下文...”和“压缩完成”），以及压缩前记忆刷新耗尽、回复因此以降级状态继续时（例如，“记忆维护暂时失败；继续生成你的回复。”）。默认禁用，以保持这些通知静默。
- `memoryFlush`：自动压缩前执行的静默智能体轮次，用于存储持久记忆。如果此维护轮次应始终使用本地模型，请将 `model` 设置为精确的提供商/模型，例如 `ollama/qwen3:8b`；此覆盖不会继承当前会话的回退链。即使 token 计数器已过时，`forceFlushTranscriptBytes` 也会在转录大小达到阈值时强制刷新。工作区为只读时跳过。

### `agents.defaults.runRetries`

嵌入式智能体运行时的外层运行循环重试迭代边界，用于防止故障恢复期间出现无限执行循环。此设置仅适用于嵌入式智能体运行时，不适用于 ACP 或 CLI 运行时。

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

- `base`：外层运行循环的基础运行重试迭代次数。默认值：`24`。
- `perProfile`：为每个回退配置候选项额外提供的运行重试迭代次数。默认值：`8`。
- `min`：运行重试迭代次数的最小绝对限制。默认值：`32`。
- `max`：运行重试迭代次数的最大绝对限制，用于防止失控执行。默认值：`160`。

### `agents.defaults.contextPruning`

在发送给 LLM 前，从内存上下文中修剪**旧工具结果**。**不会**修改磁盘上的会话历史记录。默认禁用；设置 `mode: "cache-ttl"` 可启用。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (default) | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes; default: 5m
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

- `mode: "cache-ttl"` 启用修剪过程。
- `ttl` 控制可以再次运行修剪的频率（从上次缓存访问后开始计算）。默认值：`5m`。
- 修剪会先对过大的工具结果执行软修剪，然后在需要时硬清除更早的工具结果。
- `softTrimRatio` 和 `hardClearRatio` 接受从 `0.0` 到 `1.0` 的值；配置验证会拒绝超出此范围的值。

**软修剪**会保留开头和结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

注意：

- 图像块永远不会被修剪或清除。
- 比率基于字符数（近似值），而不是精确的 token 数。
- 如果助手消息数量少于 `keepLastAssistants`，则跳过修剪。

</Accordion>

有关行为详情，请参阅[会话修剪](/zh-CN/concepts/session-pruning)。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (default) | natural | custom (use minMs/maxMs)
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才能启用分块回复。
- 渠道覆盖项：`channels.<channel>.blockStreamingCoalesce`（以及按账户设置的变体）。Discord、Google Chat、Mattermost、MS Teams、Signal 和 Slack 默认使用 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`：首选分块边界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`：分块回复之间的随机暂停。默认值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未设置的边界都会回退到自然范围）。按智能体覆盖：`agents.list[].humanDelay`。

有关行为和分块详情，请参阅[流式传输](/zh-CN/concepts/streaming)。

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

- 默认值：直接聊天/提及时为 `instant`，未提及智能体的群聊中为 `message`。
- `typingIntervalSeconds` 默认值：`6`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

请参阅[输入状态指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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
          gpus: "all",
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

以上所示的默认值（`off`/`docker`/`agent`/`none`/`bookworm-slim` 镜像/`none` 网络等）是 OpenClaw 的实际默认值，而不仅仅是示例值。

<Accordion title="沙箱详情">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：由通用 SSH 支持的远程运行时
- `openshell`：OpenShell 运行时

选择 `backend: "openshell"` 后，运行时特定设置将移至
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：采用 `user@host[:port]` 格式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域划分工作区的远程绝对根目录（默认：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRef，OpenClaw 会在运行时将其具体化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略选项（两者默认均为 `true`）

**SSH 身份验证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 在沙箱会话启动前，会从当前密钥运行时快照中解析由 SecretRef 支持的 `*Data` 值

**SSH 后端行为：**

- 创建或重新创建后，仅初始化远程工作区一次
- 此后以远程 SSH 工作区为规范
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问权限：**

- `none`：位于 `~/.openclaw/sandboxes` 下的按作用域划分的沙箱工作区（默认）
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：每个会话使用独立的容器和工作区
- `agent`：每个智能体使用一个容器和工作区（默认）
- `shared`：共享容器和工作区（会话之间不隔离）

**OpenShell 插件配置：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror（默认）| remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 可选
          gatewayEndpoint: "https://lab.example", // 可选
          policy: "strict", // 可选的 OpenShell 策略 ID
          providers: ["openai"], // 可选
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：执行前从本地初始化远程工作区，执行后同步回来；本地工作区保持为规范
- `remote`：创建沙箱时仅初始化远程工作区一次，此后以远程工作区为规范

在 `remote` 模式下，完成初始化步骤后，不会自动将在 OpenClaw 之外进行的主机本地编辑同步到沙箱中。
传输方式是通过 SSH 连接到 OpenShell 沙箱，但沙箱生命周期和可选的镜像同步由插件负责。

**`setupCommand`** 在容器创建后运行一次（通过 `sh -lc`）。需要网络出站访问权限、可写根目录以及 root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请将其设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 会被阻止。除非你明确设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急解锁），否则默认阻止 `"container:<id>"`。
在活跃 OpenClaw 沙箱中运行的 Codex app-server 轮次，其原生代码模式网络访问也使用相同的出站设置。

**入站附件**会暂存到当前工作区的 `media/inbound/*` 中。

**`docker.binds`** 会挂载额外的主机目录；全局绑定和按智能体绑定会合并。

**沙箱浏览器**（`sandbox.browser.enabled`，默认 `false`）：容器中的 Chromium + CDP。noVNC URL 会注入系统提示词。不要求在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 身份验证，OpenClaw 会生成一个短期有效的令牌 URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离的会话以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用桥接网络）。仅当你明确需要全局桥接连接时，才将其设置为 `bridge`。此处也会阻止 `"host"`。
- `cdpSourceRange` 可选择将容器边界处的 CDP 入站访问限制为某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅将额外的主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会取代浏览器容器的 `docker.binds`。
- 沙箱浏览器容器中的 Chromium 始终使用 `--no-sandbox --disable-setuid-sandbox` 启动（容器不具备 Chrome 自身沙箱所需的内核原语）；没有可用于更改此行为的配置开关。
- 启动默认值在 `scripts/sandbox-browser-entrypoint.sh` 中定义，并针对容器主机进行了调优：
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`、`--disable-gpu` 和 `--disable-software-rasterizer`
    默认启用；如果 WebGL/3D 使用需要这些功能，可以通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 将其禁用。
  - `--disable-extensions`（默认启用）；如果你的工作流依赖扩展，
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 可重新启用扩展。
  - 默认使用 `--renderer-process-limit=2`；可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改，设置为 `0` 可使用 Chromium 的
    默认进程限制。
  - 仅在启用 `headless` 时使用 `--headless=new`。
  - 这些默认值是容器镜像的基准配置；若要更改容器默认值，请使用带有自定义
    入口点的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像（从源码检出目录）：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选的浏览器镜像
```

对于没有源码检出目录的 npm 安装，请参阅[沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，其中提供了内联 `docker build` 命令。

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 为智能体单独指定 TTS 提供商、语音、模型、
风格或自动 TTS 模式。智能体配置块会深度合并并覆盖全局
`messages.tts`，因此共享凭据可以集中保存在一处，而各个
智能体只需覆盖所需的语音或提供商字段。当前智能体的
覆盖设置适用于自动语音回复、`/tts audio`、`/tts status` 和
`tts` 智能体工具。有关提供商示例和优先级，请参阅[文本转语音](/zh-CN/tools/tts#per-agent-voice-overrides)。

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
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // 按智能体覆盖思考级别
        reasoningDefault: "on", // 按智能体覆盖推理可见性
        fastModeDefault: false, // 按智能体覆盖快速模式
        params: { cacheRetention: "none" }, // 按键覆盖匹配的 defaults.models 参数
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 设置后替换 agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "乐于助人的树懒",
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
            mode: "persistent", // persistent | oneshot
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
- `default`：设置多个时，第一个生效（并记录警告）。如果未设置，则列表中的第一项为默认项。
- `model`：字符串形式会设置严格的按智能体主模型，不使用模型回退；对象形式 `{ primary }` 同样是严格模式，除非添加 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 为该智能体启用回退，或使用 `{ primary, fallbacks: [] }` 明确指定严格行为。仅覆盖 `primary` 的 Cron 任务仍会继承默认回退，除非设置 `fallbacks: []`。
- `utilityModel`：可选的按智能体覆盖，用于生成会话和话题标题等简短内部任务。依次回退到 `agents.defaults.utilityModel`、主提供商声明的默认小模型，再到此智能体的主模型。空字符串会为此智能体禁用实用模型路由。
- `params`：按智能体设置的流式参数，会合并并覆盖 `agents.defaults.models` 中选定模型的条目。可使用此项设置 `cacheRetention`、`temperature` 或 `maxTokens` 等智能体专属覆盖，而无需复制整个模型目录。
- `tts`：可选的按智能体文本转语音覆盖。此块会深度合并并覆盖 `messages.tts`，因此请将共享的提供商凭据和回退策略保留在 `messages.tts` 中，并仅在此处设置提供商、语音、模型、风格或自动模式等角色专属值。
- `skills`：可选的按智能体 Skills 允许列表。如果省略，智能体会继承已设置的 `agents.defaults.skills`；显式列表会替换默认值，而不是与其合并，`[]` 表示不使用任何 Skills。
- `thinkingDefault`：可选的按智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置按消息或会话覆盖时，为此智能体覆盖 `agents.defaults.thinkingDefault`。所选提供商/模型配置决定哪些值有效；对于 Google Gemini，`adaptive` 会保留由提供商控制的动态思考（Gemini 3/3.1 省略 `thinkingLevel`，Gemini 2.5 使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的按智能体默认推理可见性（`on | off | stream`）。当未设置按消息或会话推理覆盖时，为此智能体覆盖 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：可选的按智能体快速模式默认值（`"auto" | true | false`）。在未设置按消息或会话快速模式覆盖时应用。
- `models`：可选的按智能体模型目录/运行时覆盖，以完整的 `provider/model` ID 为键。使用 `models["provider/model"].agentRuntime` 设置按智能体运行时例外。
- `runtime`：可选的按智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，请使用 `type: "acp"` 及 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- 工作区相对路径指向的本地 `identity.avatar` 图像文件大小限制为 2 MB。`http(s)` URL 和 `data:` URI 不受本地文件大小限制检查。
- `identity` 会派生默认值：根据 `emoji` 派生 `ackReaction`，根据 `name`/`emoji` 派生 `mentionPatterns`。
- `subagents.allowAgents`：为显式 `sessions_spawn.agentId` 目标配置的智能体 ID 允许列表（`["*"]` = 任意已配置目标；默认：仅同一智能体）。如需允许将 `agentId` 指向请求者自身，请包含请求者 ID。智能体配置已删除的过期条目会被 `sessions_spawn` 拒绝，并从 `agents_list` 中省略；运行 `openclaw doctor --fix` 可清理这些条目，如果该目标应在继承默认值的同时仍可被创建，也可以添加最简 `agents.list[]` 条目。
- 沙箱继承保护：如果请求者会话处于沙箱隔离状态，`sessions_spawn` 会拒绝将在非沙箱环境中运行的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置；默认值：false）。
- `subagents.maxConcurrent`：子智能体执行中可并发运行的子智能体数量上限。默认值：`8`。
- `subagents.maxChildrenPerAgent`：单个智能体会话可创建的活跃子项数量上限。默认值：`5`。
- `subagents.maxSpawnDepth`：创建子智能体的最大嵌套深度（`1`-`5`）。默认值：`1`（不允许嵌套）。
- `subagents.archiveAfterMinutes`：已完成子智能体状态在归档前的保留时长。默认值：`60`。

---

## 多 Agent 路由

在一个 Gateway 网关内运行多个隔离的智能体。请参阅[多 Agent](/zh-CN/concepts/multi-agent)。

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

- `type`（可选）：`route` 用于普通路由（缺少 type 时默认为 route），`acp` 用于持久化 ACP 对话绑定。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；特定于渠道）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道）
6. 默认智能体

在每个层级中，第一个匹配的 `bindings` 条目生效。

对于 `type: "acp"` 条目，OpenClaw 按精确的对话身份（`match.channel` + 账户 + `match.peer.id`）解析，不使用上述路由绑定层级顺序。

### 按智能体访问配置

<Accordion title="完全访问权限（无沙箱）">

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

<Accordion title="无文件系统访问权限（仅消息传递）">

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

有关优先级的详细信息，请参阅[多 Agent 沙盒和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
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
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
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
  - `per-sender`（默认）：每个发送者在渠道上下文中拥有一个隔离的会话。
  - `global`：渠道上下文中的所有参与者共享单个会话（仅当需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：跨渠道按发送者 ID 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账户 + 渠道 + 发送者隔离（推荐用于多账户场景）。
- **`identityLinks`**：将规范 ID 映射到带提供商前缀的对端，以便跨渠道共享会话。`/dock_discord` 等停靠命令使用同一映射，将活动会话的回复路由切换到另一个已关联渠道的对端；请参阅[渠道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主要重置策略。`daily` 在当地时间 `atHour` 重置；`idle` 在 `idleMinutes` 后重置。当两者均已配置时，以先到期者为准。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。Heartbeat、cron 唤醒、Exec 通知和 Gateway 网关内部记录等后台/系统事件写入可以更新 `updatedAt`，但不会使每日/空闲会话保持新鲜。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。接受旧版 `dm` 作为 `direct` 的别名。
- **`resetByChannel`**：以提供商/渠道 ID 为键的按渠道重置覆盖。当会话的渠道有匹配条目时，该条目会完全优先于此会话的 `resetByType`/`reset`。仅当某个渠道需要不同于类型级策略的重置行为时使用。
- **`mainKey`**：旧版字段。运行时始终使用 `"main"` 作为主要直接聊天分组。
- **`agentToAgent.maxPingPongTurns`**：智能体间交互期间，智能体之间回复往返的最大轮次（整数，范围：`0`-`20`，默认值：`5`）。`0` 会禁用乒乓式链式回复。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版别名为 `dm`）、`keyPrefix` 或 `rawKeyPrefix` 匹配。首个拒绝规则优先。
- **`maintenance`**：会话存储清理和保留控制。
  - `mode`：`enforce` 执行清理并且是默认值；`warn` 仅发出警告。
  - `pruneAfter`：过期条目的存留时间阈值（默认值为 `30d`）。
  - `maxEntries`：SQLite 会话条目的最大数量（默认值为 `500`）。对于生产规模的上限，运行时写入会使用一个较小的高水位缓冲区执行批量清理；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - 短期 Gateway 网关模型运行探测会话采用固定的 `24h` 保留期，但清理由压力触发：仅当达到会话条目维护/上限压力时，才会移除过期的严格模型运行探测行。只有与 `agent:*:explicit:model-run-<uuid>` 匹配的严格显式探测键才符合条件；普通的直接、群组、线程、cron、hook、Heartbeat、ACP 和子智能体会话不会继承此 24h 保留期。执行模型运行清理时，它会先于范围更广的 `pruneAfter` 过期条目清理和 `maxEntries` 上限执行。
  - `rotateBytes`：已弃用并被忽略；`openclaw doctor --fix` 会将其从旧配置中移除。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 对话记录归档的保留期。默认为 `pruneAfter`；设置为 `false` 可将其禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下记录警告；在 `enforce` 模式下优先移除最旧的工件/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认为 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：会话对话记录写入锁控制。仅当正常的对话记录准备、清理、压缩或镜像工作争用时间超过默认策略时才进行调整。
  - `acquireTimeoutMs`：获取锁时等待多少毫秒后将会话报告为忙碌。默认值：`60000`；环境变量覆盖：`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：现有锁经过多少毫秒后会被视为过期并回收。默认值：`1800000`；环境变量覆盖：`OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：进程内锁在被持有多少毫秒后，监视程序可将其释放。默认值：`300000`；环境变量覆盖：`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：总默认开关（提供商可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认在不活动多少小时后自动取消聚焦（`0` 会禁用；提供商可以覆盖）
  - `maxAgeHours`：默认最大存续时长（小时）（`0` 会禁用；提供商可以覆盖）
  - `spawnSessions`：用于控制是否允许从 `sessions_spawn` 和 ACP 线程派生创建线程绑定工作会话的默认门控。当启用线程绑定时，默认为 `true`；提供商/账户可以覆盖。
  - `defaultSpawnContext`：线程绑定派生的默认原生子智能体上下文（`"fork"` 或 `"isolated"`）。默认为 `"fork"`。

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer（默认）| followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize（默认）
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 表示禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

按渠道/账户覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（最具体的优先）：账户 → 渠道 → 全局。`""` 会禁用前缀并停止级联。`"auto"` 会生成 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述             | 示例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 模型简称         | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称       | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别     | `high`、`low`、`off`        |
| `{identity.name}` | 智能体身份名称   | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认表情回应

- 默认使用当前智能体的 `identity.emoji`，否则使用 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → 渠道 → `messages.ackReaction` → 身份回退值。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all` 或 `off`/`none`（完全禁用确认表情回应）。
- `removeAckAfterReply`：回复后移除确认表情回应，适用于 Slack、Discord、Signal、Telegram、WhatsApp 和 iMessage 等支持表情回应的渠道。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 和 WhatsApp 上启用生命周期状态表情回应。
  在 Discord 上，当确认表情回应处于活动状态时，不设置此项会保持启用状态表情回应。
  在 Slack、Signal、Telegram 和 WhatsApp 上，需要将其显式设为 `true` 才能启用生命周期状态表情回应。
  默认情况下，Slack 使用其原生智能体线程状态和轮换的加载消息来显示进度，同时保持配置的确认表情回应不变。
- `messages.statusReactions.emojis`：覆盖生命周期表情符号键：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 仅允许一组固定的表情回应，因此不受支持的已配置表情符号会回退到
  该聊天最接近且受支持的状态变体。

### 队列

- `mode`：当会话运行处于活动状态时收到入站消息所采用的队列策略。默认值：`"steer"`。
  - `steer`：将新提示注入当前运行。
  - `followup`：在当前运行完成后运行新提示。
  - `collect`：批量收集兼容消息，稍后一起运行。
  - `interrupt`：中止当前运行，然后开始处理最新提示。
- `debounceMs`：分派已排队或已引导消息前的延迟。默认值：`500`。
- `cap`：应用丢弃策略前允许排队的最大消息数。默认值：`20`。
- `drop`：超出上限时采用的策略。`"summarize"`（默认）会丢弃最旧的条目，但保留精简摘要；`"old"` 会丢弃最旧的条目且不保留摘要；`"new"` 会拒绝最新条目。
- `byChannel`：按提供商 ID 设置的各渠道 `mode` 覆盖值。
- `debounceMsByChannel`：按提供商 ID 设置的各渠道 `debounceMs` 覆盖值。

### 入站防抖

将来自同一发送者的快速连续纯文本消息批量合并为一个智能体轮次。媒体/附件会立即触发处理。控制命令不经过防抖。默认 `debounceMs`：`2000`。

### 其他消息键

- `messages.messagePrefix`：入站用户消息到达智能体运行时之前，在其前面添加的文本前缀。对于渠道上下文标记，应谨慎使用。
- `messages.visibleReplies`：控制私信、群组和渠道对话中的可见来源回复（`"message_tool"` 要求使用 `message(action=send)` 生成可见输出；`"automatic"` 与之前一样发布普通回复）。
- `messages.usageTemplate` / `messages.responseUsage`：自定义 `/usage` 页脚模板和默认的逐回复用量模式（`off | tokens | full`，另有旧版 `on` 作为 `tokens` 的别名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群组消息提及触发规则和历史记录窗口大小。
- `messages.suppressToolErrors`：设为 `true` 时，隐藏向用户显示的 `⚠️` 工具错误警告（智能体仍可在上下文中看到错误并重试）。默认值：`false`。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "off", // off（默认）| always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` 控制默认的自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好设置，`/tts status` 会显示实际生效的状态。
- `summaryModel` 会覆盖用于自动摘要的 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用（`enabled !== false`）；`modelOverrides.allowProvider` 需显式启用。
- API key 会回退使用 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件所有。如果设置了 `plugins.allow`，请将你要使用的每个 TTS 提供商插件包含在内，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 ID 可作为 `microsoft` 的别名使用。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序依次为配置、`OPENAI_TTS_BASE_URL`，最后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型和语音验证。

---

## Talk

Talk 模式（macOS/iOS/Android 和浏览器 Control UI）的默认设置。

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "以温暖的语气说话，并保持回答简短。",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- 配置多个 Talk 提供商时，`talk.provider` 必须与 `talk.providers` 中的某个键匹配。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容。运行 `openclaw doctor --fix`，将持久化配置重写为 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS Talk 客户端行为）。
- `providers.*.apiKey` 接受纯文本字符串或 SecretRef 对象。
- 仅当未配置 Talk API 密钥时，才会应用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许 Talk 指令使用易记名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 辅助程序使用的 Hugging Face 仓库。如果省略，macOS 将使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会优先通过内置的 `openclaw-mlx-tts` 辅助程序运行（如果存在），否则使用 `PATH` 上的可执行文件；`OPENCLAW_MLX_TTS_BIN` 可在开发期间覆盖辅助程序路径。
- `consultThinkingLevel` 控制 Control UI Talk 实时 `openclaw_agent_consult` 调用背后的完整 OpenClaw 智能体运行的思考级别。保持未设置可保留正常的会话/模型行为。
- `consultFastMode` 为 Control UI Talk 实时咨询设置一次性快速模式覆盖，而不更改会话的常规快速模式设置。
- `speechLocale` 设置 iOS/macOS Talk 语音识别使用的 BCP 47 区域设置 ID。保持未设置则使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户停止说话后等待多长时间再发送转录文本。保持未设置则沿用平台默认的停顿时长（`700 ms on macOS and Android, 900 ms on iOS`）。
- `realtime.instructions` 将面向提供商的系统指令附加到 OpenClaw 的内置实时提示词中，因此可以配置语音风格，而不会丢失默认的 `openclaw_agent_consult` 指引。
- `realtime.vadThreshold` 设置提供商的语音活动阈值，范围从 `0`（最灵敏）到 `1`（最不灵敏）。保持未设置则沿用提供商默认值。
- `realtime.silenceDurationMs` 设置提供商提交实时用户轮次前的正整数静默时长。保持未设置则沿用提供商默认值。
- `realtime.prefixPaddingMs` 设置检测到语音开始前保留的音频量，值为非负整数。保持未设置则沿用提供商默认值。
- `realtime.reasoningEffort` 设置实时会话的提供商特定推理级别。保持未设置则沿用提供商默认值。
- `realtime.consultRouting`：当实时提供商生成不含 `openclaw_agent_consult` 的最终用户转录文本时，`"provider-direct"`（默认）会保留提供商的直接回复。`"force-agent-consult"` 则改为通过 OpenClaw 路由最终请求。

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

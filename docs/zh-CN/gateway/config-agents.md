---
read_when:
    - 调整智能体默认值（模型、思考、工作区、Heartbeat、媒体、Skills）
    - 配置多 Agent 路由和绑定
    - 调整会话、消息递送和 Talk 模式行为
summary: 智能体默认值、多智能体路由、会话、消息和 Talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-07-06T10:49:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c9f5c0cee452a223ca4aab91edd58127cb7b52d905012a86ff45e57261524a8
    source_path: gateway/config-agents.md
    workflow: 16
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下的智能体作用域配置键。对于渠道、工具、Gateway 网关运行时和其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认值

### `agents.defaults.workspace`

默认值：设置了 `OPENCLAW_WORKSPACE_DIR` 时使用它，否则使用 `~/.openclaw/workspace`（当 `OPENCLAW_PROFILE` 设置为非默认配置文件时，使用 `~/.openclaw/workspace-<profile>`）。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

显式的 `agents.defaults.workspace` 值优先于 `OPENCLAW_WORKSPACE_DIR`。当你不想把该路径写入配置时，可以使用环境变量将默认智能体指向已挂载的工作区。

### `agents.defaults.repoRoot`

在系统提示词的 Runtime 行中显示的可选仓库根目录。如果未设置，OpenClaw 会从工作区向上遍历并自动检测。

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

- 省略 `agents.defaults.skills` 表示默认不限制 Skills。
- 省略 `agents.list[].skills` 表示继承默认值。
- 设置 `agents.list[].skills: []` 表示无 Skills。
- 非空的 `agents.list[].skills` 列表是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用工作区 bootstrap 文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）的自动创建。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

跳过创建选定的可选工作区文件，同时仍写入必需的 bootstrap 文件（`AGENTS.md`、`TOOLS.md`、`BOOTSTRAP.md`）。有效值：`SOUL.md`、`USER.md`、`HEARTBEAT.md` 和 `IDENTITY.md`。

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

控制何时将工作区 bootstrap 文件注入系统提示词。默认值：`"always"`。

- `"continuation-skip"`：安全的延续轮次（在一次完成的助手响应之后）会跳过工作区 bootstrap 的重新注入，从而减小提示词大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每个轮次都禁用工作区 bootstrap 和上下文文件注入。仅对完全自行管理提示词生命周期的智能体使用此选项（自定义上下文引擎、构建自身上下文的原生运行时，或无需 bootstrap 的专用工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

按智能体覆盖：`agents.list[].contextInjection`。省略的值继承 `agents.defaults.contextInjection`。

### `agents.defaults.bootstrapMaxChars`

每个工作区 bootstrap 文件在截断前的最大字符数。默认值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

按智能体覆盖：`agents.list[].bootstrapMaxChars`。省略的值继承 `agents.defaults.bootstrapMaxChars`。

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区 bootstrap 文件合计注入的最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

按智能体覆盖：`agents.list[].bootstrapTotalMaxChars`。省略的值继承 `agents.defaults.bootstrapTotalMaxChars`。

### 按智能体覆盖 bootstrap 配置文件

当某个智能体需要与共享默认值不同的提示词注入行为时，使用按智能体的 bootstrap 配置文件覆盖。省略的字段继承自 `agents.defaults`。

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

控制 bootstrap 上下文被截断时，智能体可见的系统提示词通知。默认值：`"always"`。

- `"off"`：绝不向系统提示词注入截断通知文本。
- `"once"`：每个唯一截断签名只注入一次简洁通知。
- `"always"`：存在截断时，每次运行都注入简洁通知（推荐）。

详细的原始/注入计数和配置调优字段保留在诊断信息中，例如上下文/状态报告和日志；常规 WebChat 用户/运行时上下文只会收到简洁的恢复通知。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### 上下文预算所有权映射

OpenClaw 有多个高容量提示词/上下文预算，并且它们有意按子系统拆分，而不是全部流经一个通用开关。

| 预算                                                           | 覆盖范围                                                                                                                                                        |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | 常规工作区 bootstrap 注入                                                                                                                                        |
| `agents.defaults.startupContext.*`                             | 一次性重置/启动模型运行前导内容，包括最近的每日 `memory/*.md` 文件。裸聊天 `/new` 和 `/reset` 会在不调用模型的情况下确认重置                                      |
| `skills.limits.*`                                              | 注入系统提示词的紧凑 Skills 列表                                                                                                                                 |
| `agents.defaults.contextLimits.*`                              | 有边界的运行时摘录和注入的运行时所有块                                                                                                                           |
| `memory.qmd.limits.*`                                          | 已索引记忆搜索片段和注入大小                                                                                                                                     |

对应的按智能体覆盖：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在重置/启动模型运行时注入的首轮启动前导内容。裸聊天 `/new` 和 `/reset` 命令会在不调用模型的情况下确认重置，因此不会加载此前导内容。

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

有边界运行时上下文表面的共享默认值。

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

- `memoryGetMaxChars`：添加截断元数据和延续通知前，默认 `memory_get` 摘录上限。
- `memoryGetDefaultLines`：省略 `lines` 时默认的 `memory_get` 行窗口。
- `toolResultMaxChars`：高级实时工具结果上限，用于持久化结果和溢出恢复。保持未设置时使用模型上下文自动上限：低于 100K tokens 时为 `16000` 字符，100K+ tokens 时为 `32000` 字符，200K+ tokens 时为 `64000` 字符。长上下文模型可接受最高 `1000000` 的显式值，但有效上限仍限制为模型上下文窗口的大约 30%。`openclaw doctor --deep` 会打印有效上限，且 Doctor 仅在显式覆盖已过时或没有效果时发出警告。
- `postCompactionMaxChars`：压缩后刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 开关的按智能体覆盖。省略的字段继承自 `agents.defaults.contextLimits`。

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
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入系统提示词的紧凑 Skills 列表的全局上限。这不会影响按需读取 `SKILL.md` 文件。

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills 提示词预算的按智能体覆盖。

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

提供商调用前，转录/工具图像块中图像最长边的最大像素大小。默认值：`1200`。

较低值通常会减少大量截图运行中的视觉 token 用量和请求载荷大小。较高值会保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

从文件路径、URL 和媒体引用加载图像时的图像工具压缩/细节偏好。默认值：`auto`。

OpenClaw 会根据所选图像模型调整缩放阶梯。例如，Claude Opus 4.8、OpenAI GPT-5.5、Qwen VL 和托管的 Llama 4 视觉模型可以使用比旧版/默认高细节视觉路径更大的图像，而多图像轮次在 `auto` 模式下会更积极地压缩，以控制 token 和延迟成本。

值：

- `auto`：适配模型限制和图像数量。
- `efficient`：偏好较小图像，以降低 token 和字节用量。
- `balanced`：使用标准的中间档阶梯。
- `high`：为截图、图表和文档图像保留更多细节。

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式只设置主模型。
  - 对象形式设置主模型以及有序故障转移模型。
- `utilityModel`：可选的 `provider/model` 引用或别名，用于短小的内部任务。它目前用于生成 Control UI 会话标题、Telegram 私信话题标题和 Discord 自动线程标题。未设置时，这些任务会回退到智能体的主模型；`agents.list[].utilityModel` 会覆盖默认值，而特定操作的模型覆盖会优先于二者。实用任务会发起单独的模型调用，并将任务特定内容发送给选定的模型提供商。仪表板标题生成最多发送第一条非命令消息的前 1,000 个字符。请选择符合你的成本和数据处理要求的提供商。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被 `image` 工具路径用作其视觉模型配置。
  - 当选定/默认模型不能接受图像输入时，也会用作回退路由。
  - 优先使用显式 `provider/model` 引用。出于兼容性也接受裸 ID；如果裸 ID 唯一匹配 `models.providers.*.models` 中已配置且支持图像的条目，OpenClaw 会将其限定到该提供商。存在歧义的已配置匹配需要显式提供商前缀。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被共享图像生成能力以及任何未来生成图像的工具/插件表面使用。
  - 典型值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，`openai/gpt-image-2` 用于 OpenAI Images，或 `openai/gpt-image-1.5` 用于透明背景 OpenAI PNG/WebP 输出。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍可推断带凭证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被共享音乐生成能力和内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍可推断带凭证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被共享视频生成能力和内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍可推断带凭证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 ID 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商凭证/API key。
  - 官方 Qwen 视频生成插件最多支持 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被 `pdf` 工具用于模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，然后回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：未在调用时传入 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中提取回退模式考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。取值：`"off"`、`"on"`、`"full"`。默认：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要和进度草稿工具行的详细模式。取值：`"explain"`（默认，紧凑的人类可读标签）或 `"raw"`（可用时附加原始命令/详情）。按智能体配置的 `agents.list[].toolProgressDetail` 会覆盖此默认值。
- `reasoningDefault`：智能体的默认推理可见性。取值：`"off"`、`"on"`、`"stream"`。按智能体配置的 `agents.list[].reasoningDefault` 会覆盖此默认值。已配置的推理默认值只会在没有设置逐消息或会话推理覆盖时，应用于所有者、已授权发送者或操作员管理员 Gateway 网关上下文。
- `elevatedDefault`：智能体的默认提升输出级别。取值：`"off"`、`"on"`、`"ask"`、`"full"`。默认：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 `openai/gpt-5.5` 用于 OpenAI API key 或 Codex OAuth 访问）。如果省略提供商，OpenClaw 会先尝试别名，然后为该精确模型 ID 查找唯一的已配置提供商匹配，最后才回退到已配置的默认提供商（已弃用的兼容行为，因此优先使用显式 `provider/model`）。如果该提供商不再公开已配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露陈旧的已移除提供商默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目可以包含 `alias`（快捷方式）和 `params`（提供商特定，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、OpenRouter `provider` 路由、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 使用 `provider/*` 条目，例如 `"openai/*": {}` 或 `"vllm/*": {}`，可显示所选提供商的所有已发现模型，而不必手动列出每个模型 ID。
  - 当该提供商的每个动态发现模型都应使用相同运行时时，请向 `provider/*` 条目添加 `agentRuntime`。精确的 `provider/model` 运行时策略仍优先于通配符。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传入 `--replace`，否则 `config set` 会拒绝会移除现有允许列表条目的替换。
  - 提供商作用域的配置/新手引导流程会将所选提供商模型合并到此映射中，并保留已配置的无关提供商。
  - 对于直接 OpenAI Responses 模型，服务端压缩会自动启用。使用 `params.responsesServerCompaction: false` 停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务端压缩](/zh-CN/providers/openai#advanced-configuration)。
- `params`：应用于所有模型的全局默认提供商参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（逐模型）覆盖，然后 `agents.list[].params`（匹配的智能体 ID）按键覆盖。详情参见 [Prompt 缓存](/zh-CN/reference/prompt-caching)。
- `models.providers.openrouter.params.provider`：OpenRouter 范围的默认提供商路由策略。OpenClaw 会将其转发到 OpenRouter 请求的 `provider` 对象；逐模型的 `agents.defaults.models["openrouter/<model>"].params.provider` 和智能体参数会按键覆盖。参见 [OpenRouter 提供商路由](/zh-CN/providers/openrouter#advanced-configuration)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，会合并到 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，额外请求体会胜出；非原生 completions 路由之后仍会剥离仅 OpenAI 使用的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容聊天模板参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于关闭思考的 `vllm/nemotron-3-*`，内置 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式 `chat_template_kwargs` 会覆盖生成的默认值，而 `extra_body.chat_template_kwargs` 仍拥有最终优先级。已配置的 vLLM Qwen 和 Nemotron 思考模型会公开二元 `/think` 选择（`off`、`on`），而不是多级 effort 阶梯。
- `compat.thinkingFormat`：OpenAI 兼容的思考载荷样式。对 Together 风格的 `reasoning.enabled` 使用 `"together"`，对 Qwen 风格的顶层 `enable_thinking` 使用 `"qwen"`，或在支持请求级聊天模板 kwargs 的 Qwen 系列后端（例如 vLLM）上，对 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。OpenClaw 会将禁用思考映射为 `false`，将启用思考映射为 `true`，并且已配置的 vLLM Qwen 模型会为这些格式公开二元 `/think` 选择。
- `compat.supportedReasoningEfforts`：逐模型的 OpenAI 兼容推理 effort 列表。对于真正接受该值的自定义端点，包含 `"xhigh"`；随后 OpenClaw 会在命令菜单、Gateway 网关会话行、会话补丁验证、智能体 CLI 验证和该已配置提供商/模型的 `llm-task` 验证中公开 `/think xhigh`。当后端需要某个规范级别的提供商特定值时，请使用 `compat.reasoningEffortMap`。
- `params.preserveThinking`：仅 Z.AI 可选启用的保留思考。启用且思考开启时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放先前的 `reasoning_content`；参见 [Z.AI 思考和保留思考](/zh-CN/providers/zai#advanced-configuration)。
- `localService`：可选的提供商级进程管理器，用于本地/自托管模型服务器。当选定模型属于该提供商时，OpenClaw 会探测 `healthUrl`（或 `baseUrl + "/models"`），如果端点不可用，则用 `args` 启动 `command`，等待最多 `readyTimeoutMs`，然后发送模型请求。`command` 必须是绝对路径。`idleStopMs: 0` 会让进程保持运行直到 OpenClaw 退出；正值会在对应空闲毫秒数后停止由 OpenClaw 生成的进程。参见 [本地模型服务](/zh-CN/gateway/local-model-services)。
- 运行时策略属于提供商或模型，而不是 `agents.defaults`。使用 `models.providers.<provider>.agentRuntime` 配置提供商范围规则，或使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` 配置模型特定规则。官方 OpenAI provider 上的 OpenAI 智能体模型默认选择 Codex。
- 修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及回退添加/移除命令）会保存规范对象形式，并尽可能保留现有回退列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话仍会串行执行）。默认：`4`。

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
- `id: "auto"` 允许已注册的插件 harness 声明其支持的轮次，并在没有 harness 匹配时使用 OpenClaw。显式插件运行时（例如 `id: "codex"`）要求该 harness 存在；如果它不可用或失败，则会故障关闭。
- `id: "pi"` 仅作为 `openclaw` 的已弃用别名被接受，用于保留 v2026.5.22 及更早版本已发布配置。新配置应使用 `openclaw`。
- 运行时优先级首先是精确模型策略（`agents.list[].models["provider/model"]`、`agents.defaults.models["provider/model"]` 或 `models.providers.<provider>.models[]`），然后是 `agents.list[]` / `agents.defaults.models["provider/*"]`，最后是 `models.providers.<provider>.agentRuntime` 处的提供商级策略。
- 整个智能体级运行时键是遗留配置。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、会话运行时固定项和 `OPENCLAW_AGENT_RUNTIME` 会被运行时选择忽略。运行 `openclaw doctor --fix` 以移除过时值。
- OpenAI agent 模型默认使用 Codex harness；当你想显式指定时，提供商/模型的 `agentRuntime.id: "codex"` 仍然有效。
- 对于 Claude CLI 部署，建议使用 `model: "anthropic/claude-opus-4-8"` 加模型作用域的 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/<model>` 引用仍可兼容使用，但新配置应保持提供商/模型选择规范，并将执行后端放在提供商/模型运行时策略中。
- 这只控制文本智能体轮次执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用其提供商/模型设置。

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
Z.AI 模型默认启用 `tool_stream` 以进行工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false` 可将其禁用。
Anthropic Claude Opus 4.8 在 OpenClaw 中默认关闭思考；当显式启用自适应思考时，Anthropic 提供商拥有的 effort 默认值为 `high`。未设置显式思考级别时，Claude 4.6 模型默认使用 `adaptive`。

### `agents.defaults.cliBackends`

用于纯文本后备运行（无工具调用）的可选 CLI 后端。当 API 提供商失败时，可作为备份使用。

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

- CLI 后端以文本优先；工具始终禁用。
- 设置 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时支持图像透传。
- `reseedFromRawTranscriptWhenUncompacted: true` 允许后端在首次压缩摘要存在之前，从有界的原始 OpenClaw transcript 尾部恢复安全的已失效会话。认证配置文件或凭据 epoch 变更仍绝不会使用原始内容重新播种。

### `agents.defaults.promptOverlays`

按模型系列应用于 OpenClaw 组装提示词表面的、与提供商无关的提示词叠加层。GPT-5 系列模型 id 会在 OpenClaw/提供商路由之间接收共享行为契约；`personality` 只控制友好的交互风格层。原生 Codex app-server 路由会保留 Codex 拥有的基础/模型指令，而不是使用此 OpenClaw GPT-5 叠加层，并且 OpenClaw 会为原生线程禁用 Codex 的内置 personality。

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

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API key 认证）或 `1h`（OAuth 认证）。设为 `0m` 可禁用。
- `includeSystemPromptSection`：为 false 时，从系统提示词中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入启动上下文。默认值：`true`。
- `suppressToolErrorWarnings`：为 true 时，在 Heartbeat 运行期间抑制工具错误警告载荷。
- `timeoutSeconds`：Heartbeat 智能体轮次被中止前允许的最长秒数。留空时，如果设置了 `agents.defaults.timeoutSeconds` 则使用它，否则使用 Heartbeat 周期并上限为 600 秒。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许直接目标投递。`block` 会抑制直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，Heartbeat 运行使用轻量级启动上下文，并且只保留工作区启动文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 Heartbeat 都在没有先前对话历史的新会话中运行。与 cron `sessionTarget: "isolated"` 相同的隔离模式。将每次 Heartbeat 的 token 成本从约 100K 降到约 2-5K token。
- `skipWhenBusy`：为 true 时，当该智能体有额外繁忙通道时，Heartbeat 运行会推迟：其自己的按会话键分组的子智能体或嵌套命令工作。Cron 通道始终推迟 Heartbeat，即使没有此标志。
- 按智能体：设置 `agents.list[].heartbeat`。当任一智能体定义了 `heartbeat` 时，**只有这些智能体**运行 Heartbeat。
- Heartbeat 会运行完整智能体轮次，间隔越短消耗的 token 越多。

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
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // notices when compaction starts/completes and on memory-flush degradation (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（用于长历史的分块摘要）。参见 [压缩](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩提供商插件的 id。设置后会调用提供商的 `summarize()`，而不是内置 LLM 摘要生成。失败时回退到内置摘要。设置提供商会强制 `mode: "safeguard"`。参见 [压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：单次压缩操作允许的最长秒数，超过后 OpenClaw 会中止。默认值：`180`。
- `reserveTokens`：压缩后为模型输出和后续工具结果保留的 token 余量。当模型上下文窗口已知时，OpenClaw 会限制有效保留量，避免其消耗提示预算。
- `reserveTokensFloor`：嵌入式运行时强制执行的最小保留量。设置为 `0` 可禁用下限。该下限仍受当前上下文窗口上限约束。
- `keepRecentTokens`：智能体切点预算，用于逐字保留最近的转录尾部。手动 `/compact` 在显式设置时会遵守此值；否则手动压缩是硬检查点。
- `recentTurnsPreserve`：在 safeguard 摘要外逐字保留的最近用户/助手轮次数。默认值：`3`。
- `maxHistoryShare`：压缩后保留历史允许占总上下文预算的最大比例（范围 `0.1`-`0.9`）。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要期间前置内置的不透明标识符保留指引。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：针对 safeguard 摘要的格式异常输出重试检查。在 safeguard 模式下默认启用；设置 `enabled: false` 可跳过审计。
- `midTurnPrecheck`：可选的工具循环压力检查。当 `enabled: true` 时，OpenClaw 会在追加工具结果后、下一次模型调用前检查上下文压力。如果上下文已无法容纳，它会在提交提示前中止当前尝试，并复用现有预检查恢复路径来截断工具结果，或执行压缩后重试。适用于 `default` 和 `safeguard` 两种压缩模式。默认：禁用。
- `postIndexSync`：压缩后的会话记忆重新索引模式。默认值：`"async"`。使用 `"await"` 可获得最强新鲜度，使用 `"async"` 可降低压缩延迟，只有在会话记忆同步由其他位置处理时才使用 `"off"`。
- `postCompactionSections`：压缩后可选重新注入的 AGENTS.md H2/H3 章节名称。未设置或设置为 `[]` 时禁用重新注入。显式设置 `["Session Startup", "Red Lines"]` 会启用这一对章节，并保留旧版 `Every Session`/`Safety` 回退。仅当额外上下文值得承担重复项目指引的风险时才启用，因为这些指引可能已被压缩摘要捕获。
- `model`：仅用于压缩摘要的可选 `provider/model-id`，或来自 `agents.defaults.models` 的裸别名。裸别名会在分发前解析；配置的字面模型 ID 在冲突时保留优先级。当主会话应保留一个模型、但压缩摘要应在另一个模型上运行时使用此项；未设置时，压缩使用会话的主模型。
- `truncateAfterCompaction`：压缩后轮换当前会话 JSONL，使后续轮次只加载摘要和未摘要尾部，同时保留之前的完整转录归档。防止长时间运行会话中的当前转录无限增长。默认值：`false`。
- `maxActiveTranscriptBytes`：可选字节阈值（`number` 或类似 `"20mb"` 的字符串），当当前 JSONL 增长超过阈值时，会在运行前触发普通本地压缩。需要 `truncateAfterCompaction`，这样成功压缩后才能轮换为更小的后继转录。未设置或为 `0` 时禁用。
- `notifyUser`：为 `true` 时，向用户发送简短的上下文维护通知：压缩开始和完成时（例如，“正在压缩上下文...”和“压缩完成”），以及压缩前记忆刷新已耗尽、因此回复以降级状态继续时（例如，“记忆维护暂时失败；正在继续你的回复。”）。默认禁用，以保持这些通知静默。
- `memoryFlush`：自动压缩前用于存储持久记忆的静默智能体轮次。当此维护轮次应保留在本地模型上时，将 `model` 设置为精确提供商/模型，例如 `ollama/qwen3:8b`；该覆盖不会继承当前会话回退链。`forceFlushTranscriptBytes` 会在转录文件大小达到阈值时强制刷新，即使 token 计数器已过期。工作区为只读时跳过。

### `agents.defaults.runRetries`

嵌入式 Agent Runtimes 的外层运行循环重试迭代边界，用于在失败恢复期间防止无限执行循环。此设置仅适用于嵌入式 Agent Runtimes，不适用于 ACP 或 CLI 运行时。

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
- `perProfile`：每个回退配置候选额外授予的运行重试迭代次数。默认值：`8`。
- `min`：运行重试迭代次数的绝对最小限制。默认值：`32`。
- `max`：运行重试迭代次数的绝对最大限制，用于防止失控执行。默认值：`160`。

### `agents.defaults.contextPruning`

在发送到 LLM 之前，从内存上下文中修剪**旧工具结果**。**不会**修改磁盘上的会话历史。默认禁用；设置 `mode: "cache-ttl"` 可启用。

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` 启用修剪流程。
- `ttl` 控制修剪再次运行的频率（从上次缓存触碰后开始计算）。默认值：`5m`。
- 修剪会先对过大的工具结果执行软修剪，然后在需要时硬清除更旧的工具结果。
- `softTrimRatio` 和 `hardClearRatio` 接受从 `0.0` 到 `1.0` 的值；配置验证会拒绝该范围外的值。

**软修剪**会保留开头 + 结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

说明：

- 图片块从不修剪/清除。
- 比例基于字符（近似），不是精确 token 计数。
- 如果助手消息少于 `keepLastAssistants` 条，则跳过修剪。

</Accordion>

行为细节参见 [会话修剪](/zh-CN/concepts/session-pruning)。

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
- 渠道覆盖项：`channels.<channel>.blockStreamingCoalesce`（以及按账号配置的变体）。Discord、Google Chat、Mattermost、MS Teams、Signal 和 Slack 默认 `minChars: 1500` / `idleMs: 1000`。
- `blockStreamingChunk.breakPreference`：首选分块边界（`"paragraph" | "newline" | "sentence"`）。
- `humanDelay`：分块回复之间的随机暂停。默认值：`off`。`natural` = 800-2500ms。`custom` 使用 `minMs`/`maxMs`（任何未设置的边界都会回退到自然范围）。按智能体覆盖：`agents.list[].humanDelay`。

行为和分块细节参见 [流式传输](/zh-CN/concepts/streaming)。

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

- 默认值：直接聊天/提及时为 `instant`，未提及的群聊为 `message`。
- `typingIntervalSeconds` 默认值：`6`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见 [输入状态指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南参见 [沙箱隔离](/zh-CN/gateway/sandboxing)。

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

上面显示的默认值（`off`/`docker`/`agent`/`none`/`bookworm-slim` 镜像/`none` 网络等）是实际的 OpenClaw 默认值，而不只是示例值。

<Accordion title="Sandbox details">

**后端：**

- `docker`：本地 Docker 运行时（默认）
- `ssh`：通用的 SSH 后端远程运行时
- `openshell`：OpenShell 运行时

选择 `backend: "openshell"` 时，运行时专用设置会移动到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：采用 `user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域工作区的绝对远程根目录（默认：`/tmp/openclaw-sandboxes`）
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在运行时物化为临时文件的内联内容或 SecretRefs
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略旋钮（两者默认均为 `true`）

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话启动前，从活动密钥运行时快照中解析

**SSH 后端行为：**

- 在创建或重新创建后，仅初始化一次远程工作区
- 然后保持远程 SSH 工作区为规范来源
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：位于 `~/.openclaw/sandboxes` 下的按作用域沙箱工作区（默认）
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：按会话创建容器 + 工作区
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
          mode: "mirror", // mirror (default) | remote
          command: "openshell",
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

- `mirror`：执行前从本地初始化远程，执行后同步回来；本地工作区保持为规范来源
- `remote`：创建沙箱时仅初始化一次远程，然后保持远程工作区为规范来源

在 `remote` 模式下，在 OpenClaw 外部进行的主机本地编辑不会在初始化步骤后自动同步到沙箱。
传输方式是通过 SSH 进入 OpenShell 沙箱，但插件负责沙箱生命周期和可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根目录和 root 用户。

**容器默认使用 `network: "none"`** — 如果智能体需要出站访问，请设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 会被阻止。默认情况下 `"container:<id>"` 会被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急破例）。
活动 OpenClaw 沙箱中的 Codex app-server 轮次会使用同一个出口设置来进行其原生代码模式网络访问。

**入站附件** 会暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载其他主机目录；全局绑定和按智能体绑定会被合并。

**沙箱隔离浏览器**（`sandbox.browser.enabled`，默认 `false`）：容器中的 Chromium + CDP。noVNC URL 会注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 凭证，并且 OpenClaw 会发出短期有效的令牌 URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认使用 `openclaw-sandbox-browser`（专用桥接网络）。仅当你明确需要全局桥接连通性时，才设置为 `bridge`。这里也会阻止 `"host"`。
- `cdpSourceRange` 可选地将容器边缘的 CDP 入口限制到一个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅将其他主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
- 沙箱浏览器容器的 Chromium 始终使用 `--no-sandbox --disable-setuid-sandbox` 启动（容器没有 Chrome 自身沙箱所需的内核原语）；没有用于此项的配置开关。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并针对容器主机调优：
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
    默认启用；如果 WebGL/3D 使用场景需要，可以通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用。
  - `--disable-extensions`（默认启用）；如果你的工作流依赖扩展，
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展。
  - 默认使用 `--renderer-process-limit=2`；可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 更改，设置为 `0` 可使用 Chromium 的
    默认进程限制。
  - 仅当启用 `headless` 时才使用 `--headless=new`。
  - 默认值是容器镜像基线；如需更改容器默认值，请使用带自定义
    entrypoint 的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像（从源码 checkout）：

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

对于没有源码 checkout 的 npm 安装，请参阅 [沙箱隔离 § 镜像和设置](/zh-CN/gateway/sandboxing#images-and-setup)，获取内联 `docker build` 命令。

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 为智能体指定自己的 TTS 提供商、语音、模型、
风格或自动 TTS 模式。智能体块会深度合并到全局
`messages.tts` 之上，因此共享凭证可以保留在一个位置，而各个
智能体只覆盖它们所需的语音或提供商字段。活动智能体的
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

- `id`：稳定的智能体 id（必填）。
- `default`：设置多个时，第一个生效（会记录警告）。如果没有设置，则列表中的第一项为默认值。
- `model`：字符串形式会设置严格的单智能体主模型，且没有模型回退；对象形式 `{ primary }` 也同样严格，除非你添加 `fallbacks`。使用 `{ primary, fallbacks: [...] }` 可让该智能体启用回退，或使用 `{ primary, fallbacks: [] }` 明确指定严格行为。仅覆盖 `primary` 的 Cron 任务仍会继承默认回退，除非你设置 `fallbacks: []`。
- `utilityModel`：可选的单智能体覆盖项，用于生成会话和线程标题等短内部任务。回退到 `agents.defaults.utilityModel`，然后回退到此智能体的主模型。
- `params`：单智能体流参数，会覆盖合并到 `agents.defaults.models` 中选定的模型条目上。可用于 `cacheRetention`、`temperature` 或 `maxTokens` 等智能体专属覆盖，而不需要复制整个模型目录。
- `tts`：可选的单智能体文本转语音覆盖项。该块会深度合并到 `messages.tts` 上，因此请将共享的提供商凭证和回退策略保留在 `messages.tts` 中，并在此处仅设置 persona 专属值，例如提供商、声音、模型、风格或自动模式。
- `skills`：可选的单智能体 Skills 允许列表。如果省略，智能体会在已设置时继承 `agents.defaults.skills`；显式列表会替换默认值而不是合并，且 `[]` 表示无 Skills。
- `thinkingDefault`：可选的单智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置单消息或会话覆盖时，会覆盖此智能体的 `agents.defaults.thinkingDefault`。所选的提供商/模型配置决定哪些值有效；对于 Google Gemini，`adaptive` 会保留由提供商拥有的动态思考（Gemini 3/3.1 上省略 `thinkingLevel`，Gemini 2.5 上使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的单智能体默认推理可见性（`on | off | stream`）。当未设置单消息或会话推理覆盖时，会覆盖此智能体的 `agents.defaults.reasoningDefault`。
- `fastModeDefault`：可选的单智能体快速模式默认值（`"auto" | true | false`）。在未设置单消息或会话快速模式覆盖时应用。
- `models`：可选的单智能体模型目录/运行时覆盖，以完整的 `provider/model` id 为键。使用 `models["provider/model"].agentRuntime` 设置单智能体运行时例外。
- `runtime`：可选的单智能体运行时描述符。当智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 以及 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- 本地工作区相对的 `identity.avatar` 图像文件限制为 2 MB。`http(s)` URL 和 `data:` URI 不会按本地文件大小限制检查。
- `identity` 会派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：已配置智能体 id 的允许列表，用于显式 `sessions_spawn.agentId` 目标（`["*"]` = 任意已配置目标；默认：仅同一智能体）。当应允许以自身为目标的 `agentId` 调用时，请包含请求者 id。其智能体配置已删除的过期条目会被 `sessions_spawn` 拒绝，并从 `agents_list` 中省略；运行 `openclaw doctor --fix` 清理它们，或在该目标应在继承默认值的同时保持可生成时，添加一个最小的 `agents.list[]` 条目。
- 沙箱继承保护：如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝将以非沙箱方式运行的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置文件；默认：false）。
- `subagents.maxConcurrent`：子智能体执行中的最大并发子智能体运行数。默认值：`8`。
- `subagents.maxChildrenPerAgent`：单个智能体会话可生成的最大活动子项数。默认值：`5`。
- `subagents.maxSpawnDepth`：子智能体生成的最大嵌套深度（`1`-`5`）。默认值：`1`（无嵌套）。
- `subagents.archiveAfterMinutes`：已完成子智能体状态归档前的时长。默认值：`60`。

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

- `type`（可选）：`route` 表示普通路由（缺失 type 时默认为 route），`acp` 表示持久 ACP 对话绑定。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账号；省略 = 默认账号）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；渠道特定）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（整个渠道）
6. 默认智能体

在每一层级内，第一个匹配的 `bindings` 条目生效。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份（`match.channel` + 账号 + `match.peer.id`）解析，并且不使用上面的路由绑定层级顺序。

### 单智能体访问配置文件

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

有关优先级详情，请参见 [Multi-Agent 沙箱和工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
  - `per-sender`（默认）：每个发送者在一个渠道上下文中获得隔离的会话。
  - `global`：一个渠道上下文中的所有参与者共享单个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：跨渠道按发送者 id 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账号 + 渠道 + 发送者隔离（推荐用于多账号）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的对等方，用于跨渠道会话共享。诸如 `/dock_discord` 的停靠命令使用同一映射，将活动会话的回复路由切换到另一个已链接的渠道对等方；参见 [频道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主要重置策略。`daily` 会在 `atHour` 本地时间重置；`idle` 会在 `idleMinutes` 后重置。两者同时配置时，先到期者生效。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。后台/系统事件写入（如 heartbeat、cron 唤醒、exec 通知和 Gateway 网关 记账）可以更新 `updatedAt`，但不会让每日/空闲会话保持新鲜。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 作为 `direct` 的别名被接受。
- **`resetByChannel`**：按渠道重置覆盖，以提供商/渠道 id 为键。当会话的渠道有匹配条目时，它会直接优先于该会话的 `resetByType`/`reset`。仅在某个渠道需要与类型级策略不同的重置行为时使用。
- **`mainKey`**：旧版字段。运行时始终使用 `"main"` 作为主直聊存储桶。
- **`agentToAgent.maxPingPongTurns`**：智能体到智能体交换期间，智能体之间最大来回回复轮次数（整数，范围：`0`-`20`，默认：`5`）。`0` 会禁用来回链式回复。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，带旧版 `dm` 别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个拒绝规则生效。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`enforce` 应用清理并且是默认值；`warn` 仅发出警告。
  - `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。运行时会用一个小的高水位缓冲区批量写入清理，以适配生产规模上限；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - 短生命周期的 Gateway 网关 模型运行探测会话使用固定 `24h` 保留期，但清理受压力门控：只有达到会话条目维护/上限压力时，才会移除陈旧的严格模型运行探测行。只有匹配 `agent:*:explicit:model-run-<uuid>` 的严格显式探测键符合条件；普通 direct、group、thread、cron、hook、heartbeat、ACP 和子智能体会话不会继承这个 24h 保留期。当模型运行清理执行时，它会先于更宽泛的 `pruneAfter` 陈旧条目清理和 `maxEntries` 上限执行。
  - `rotateBytes`：已弃用并被忽略；`openclaw doctor --fix` 会从旧配置中移除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 逐字稿归档的保留期。默认使用 `pruneAfter`；设置为 `false` 可禁用。
  - `maxDiskBytes`：可选的会话目录磁盘预算。在 `warn` 模式下记录警告；在 `enforce` 模式下先移除最旧的工件/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认是 `maxDiskBytes` 的 `80%`。
- **`writeLock`**：会话逐字稿写入锁控制。仅当合法的逐字稿准备、清理、压缩或镜像工作争用时间超过默认策略时才调整。
  - `acquireTimeoutMs`：获取锁时等待的毫秒数，超时后报告会话繁忙。默认值：`60000`；环境变量覆盖 `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`。
  - `staleMs`：现有锁被视为陈旧并回收前的毫秒数。默认值：`1800000`；环境变量覆盖 `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`。
  - `maxHoldMs`：已持有的进程内锁在 watchdog 释放前可保持持有的毫秒数。默认值：`300000`；环境变量覆盖 `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认不活跃自动取消聚焦小时数（`0` 禁用；提供商可以覆盖）
  - `maxAgeHours`：默认硬性最大年龄小时数（`0` 禁用；提供商可以覆盖）
  - `spawnSessions`：从 `sessions_spawn` 和 ACP 线程生成创建线程绑定工作会话的默认门控。启用线程绑定时默认为 `true`；提供商/账号可以覆盖。
  - `defaultSpawnContext`：线程绑定生成的默认原生子智能体上下文（`"fork"` 或 `"isolated"`）。默认值为 `"fork"`。

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (default) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (default)
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

解析（最具体者优先）：账号 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 派生为 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述             | 示例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 短模型名称       | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称       | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别     | `high`, `low`, `off`        |
| `{identity.name}` | Agent 身份名称   | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认表情回应

- 默认使用活动 Agent 的 `identity.emoji`，否则使用 `"👀"`。设置为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账号 → 渠道 → `messages.ackReaction` → 身份回退值。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all`，或 `off`/`none`（完全禁用确认表情回应）。
- `removeAckAfterReply`：在 Slack、Discord、Signal、Telegram、WhatsApp 和 iMessage 等支持表情回应的渠道上，回复后移除确认表情回应。
- `messages.statusReactions.enabled`：在 Slack、Discord、Signal、Telegram 和 WhatsApp 上启用生命周期状态表情回应。
  在 Discord 上，未设置时，如果确认表情回应处于活动状态，则保持启用状态表情回应。
  在 Slack、Signal、Telegram 和 WhatsApp 上，显式设置为 `true` 以启用生命周期状态表情回应。
  Slack 默认使用其原生助手线程状态和轮换加载消息显示进度，同时保持配置的确认表情回应静态不变。
- `messages.statusReactions.emojis`：覆盖生命周期 emoji 键：
  `queued`、`thinking`、`compacting`、`tool`、`coding`、`web`、`deploy`、`build`、
  `concierge`、`done`、`error`、`stallSoft` 和 `stallHard`。
  Telegram 只允许固定的表情回应集合，因此不受支持的已配置 emoji 会回退
  到该聊天中最接近的受支持状态变体。

### 队列

- `mode`：当会话运行处于活动状态时，到达的入站消息使用的队列策略。默认值：`"steer"`。
  - `steer`：将新提示注入活动运行。
  - `followup`：在活动运行完成后运行新提示。
  - `collect`：批处理兼容消息，稍后一起运行。
  - `interrupt`：在启动最新提示前中止活动运行。
- `debounceMs`：分发已排队/已 steer 消息前的延迟。默认值：`500`。
- `cap`：应用丢弃策略前的最大排队消息数。默认值：`20`。
- `drop`：超过上限时的策略。`"summarize"`（默认）会丢弃最旧条目但保留压缩摘要；`"old"` 丢弃最旧条目且不保留摘要；`"new"` 拒绝最新项目。
- `byChannel`：按渠道的 `mode` 覆盖，以提供商 id 为键。
- `debounceMsByChannel`：按渠道的 `debounceMs` 覆盖，以提供商 id 为键。

### 入站防抖

将来自同一发送者的快速纯文本消息批处理为单个智能体轮次。媒体/附件会立即刷新。控制命令会绕过防抖。默认 `debounceMs`：`2000`。

### 其他消息键

- `messages.messagePrefix`：在入站用户消息到达 Agent Runtimes 前预置的前缀文本。谨慎用于渠道上下文标记。
- `messages.visibleReplies`：控制 direct、group 和 channel 对话中的可见来源回复（`"message_tool"` 要求使用 `message(action=send)` 产生可见输出；`"automatic"` 像以前一样发布普通回复）。
- `messages.usageTemplate` / `messages.responseUsage`：自定义 `/usage` 页脚模板和默认每条回复用量模式（`off | tokens | full`，另有旧版 `on` 作为 `tokens` 的别名）。
- `messages.groupChat.mentionPatterns` / `historyLimit`：群组消息提及触发器和历史窗口大小。
- `messages.suppressToolErrors`：为 `true` 时，抑制向用户显示的 `⚠️` 工具错误警告（智能体仍会在上下文中看到错误并可重试）。默认值：`false`。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "off", // off (default) | always | inbound | tagged
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

- `auto` 控制默认的自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好，`/tts status` 会显示生效状态。
- `summaryModel` 会覆盖用于自动摘要的 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用（`enabled !== false`）；`modelOverrides.allowProvider` 需要选择启用。
- API 密钥会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请包含你想使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 id 会作为 `microsoft` 的别名被接受。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序是配置，然后是 `OPENAI_TTS_BASE_URL`，然后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为兼容 OpenAI 的 TTS 服务器，并放宽模型/语音校验。

---

## Talk

Talk 模式（macOS/iOS/Android 和浏览器 Control UI）的默认值。

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
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
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

- 配置多个 Talk 提供商时，`talk.provider` 必须匹配 `talk.providers` 中的一个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容。运行 `openclaw doctor --fix` 可将持久化配置重写为 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`（macOS Talk 客户端行为）。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 仅在未配置 Talk API 密钥时，才会应用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 让 Talk 指令可以使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 辅助程序使用的 Hugging Face 仓库。如果省略，macOS 会使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会在存在时通过内置的 `openclaw-mlx-tts` 辅助程序运行，或通过 `PATH` 上的可执行文件运行；`OPENCLAW_MLX_TTS_BIN` 会覆盖开发用辅助程序路径。
- `consultThinkingLevel` 控制 Control UI Talk 实时 `openclaw_agent_consult` 调用背后的完整 OpenClaw agent 运行的思考级别。保持未设置可保留正常会话/模型行为。
- `consultFastMode` 为 Control UI Talk 实时 consult 设置一次性快速模式覆盖，而不会更改会话的正常快速模式设置。
- `speechLocale` 设置 iOS/macOS Talk 语音识别使用的 BCP 47 区域设置 id。保持未设置会使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户静默后等待多久才发送转录。未设置会保留平台默认暂停窗口（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）。
- `realtime.instructions` 会向 OpenClaw 内置实时提示追加面向提供商的系统指令，因此可配置语音风格而不丢失默认 `openclaw_agent_consult` 指引。
- `realtime.vadThreshold` 设置提供商的语音活动阈值，范围从 `0`（最敏感）到 `1`（最不敏感）。未设置会保留提供商默认值。
- `realtime.silenceDurationMs` 设置提供商提交实时用户轮次前的正整数静默窗口。未设置会保留提供商默认值。
- `realtime.prefixPaddingMs` 设置在检测到语音开始前保留的非负整数音频量。未设置会保留提供商默认值。
- `realtime.reasoningEffort` 设置实时会话的提供商特定推理级别。未设置会保留提供商默认值。
- `realtime.consultRouting`：`"provider-direct"`（默认）会在实时提供商生成没有 `openclaw_agent_consult` 的最终用户转录时，保留直接提供商回复。`"force-agent-consult"` 会改为通过 OpenClaw 路由最终请求。

---

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

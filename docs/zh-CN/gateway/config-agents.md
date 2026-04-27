---
read_when:
    - 调整智能体默认设置（模型、思考、工作区、心跳、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息投递和通话模式行为
summary: 智能体默认设置、多智能体路由、会话、消息和通话配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-04-27T21:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce596408bea2d07967f3fdd968497ecd3666e687d7d526e165fca3abfa345542
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下按智能体作用域划分的配置键。关于渠道、工具、Gateway 网关运行时以及其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认设置

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示中的 Runtime 行里。如果未设置，OpenClaw 会从工作区向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

对未设置 `agents.list[].skills` 的智能体生效的可选默认 Skills 允许列表。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skills
    ],
  },
}
```

- 省略 `agents.defaults.skills`，则默认 Skills 不受限制。
- 省略 `agents.list[].skills` 以继承默认值。
- 将 `agents.list[].skills: []` 设为空 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用自动创建工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区引导文件注入到系统提示中。默认值：`"always"`。

- `"continuation-skip"`：安全的续接轮次（在助手已完成响应之后）会跳过工作区引导内容的重新注入，从而减小提示大小。Heartbeat 运行和压缩后的重试仍会重建上下文。
- `"never"`：在每一轮都禁用工作区引导和上下文文件注入。仅将此选项用于完全自行管理其提示生命周期的智能体（自定义上下文引擎、构建自身上下文的原生运行时，或专门的不带引导工作流）。Heartbeat 和压缩恢复轮次同样会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件在被截断前允许的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件合计可注入的最大字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制当引导上下文被截断时，向智能体显示的警告文本。默认值：`"once"`。

- `"off"`：绝不将警告文本注入系统提示。
- `"once"`：对每个唯一的截断签名仅注入一次警告（推荐）。
- `"always"`：只要存在截断，每次运行都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算归属映射

OpenClaw 有多个高容量提示 / 上下文预算，这些预算会按子系统有意拆分，而不是全部通过一个通用旋钮统一控制。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区引导注入。
- `agents.defaults.startupContext.*`：
  一次性的 `/new` 和 `/reset` 启动前导内容，包括最近的每日
  `memory/*.md` 文件。
- `skills.limits.*`：
  注入到系统提示中的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界的运行时摘录和由运行时拥有的注入块。
- `memory.qmd.limits.*`：
  已索引的 memory 搜索片段与注入大小控制。

仅当某个智能体需要不同预算时，才使用对应的按智能体覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在裸 `/new` 和 `/reset` 运行时注入的首轮启动前导内容。

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

用于有界运行时上下文面的共享默认值。

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

- `memoryGetMaxChars`：`memory_get` 摘录的默认上限；在添加截断元数据和续接提示前生效。
- `memoryGetDefaultLines`：当省略 `lines` 时，`memory_get` 使用的默认行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：压缩后刷新注入期间，`AGENTS.md` 摘录的字符上限。

#### `agents.list[].contextLimits`

对共享 `contextLimits` 旋钮的按智能体覆盖。省略的字段将继承自 `agents.defaults.contextLimits`。

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

注入到系统提示中的紧凑 Skills 列表的全局上限。这不会影响按需读取 `SKILL.md` 文件。

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

Skills 提示预算的按智能体覆盖。

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

在调用提供商之前，transcript / 工具图片块中图像最长边的最大像素尺寸。默认值：`1200`。

较低的值通常会减少视觉 token 用量和以截图为主的运行中的请求负载大小。
较高的值则能保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

用于系统提示上下文的时区（不是消息时间戳）。会回退到主机时区。

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
      params: { cacheRetention: "long" }, // 全局默认提供商参数
      agentRuntime: {
        id: "pi", // pi | auto | 已注册的 harness id，例如 codex
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

- `model`：既可接受字符串（`"provider/model"`），也可接受对象（`{ primary, fallbacks }`）。
  - 字符串形式只设置主模型。
  - 对象形式会设置主模型以及按顺序排列的故障转移模型。
- `imageModel`：既可接受字符串（`"provider/model"`），也可接受对象（`{ primary, fallbacks }`）。
  - 作为 `image` 工具路径的视觉模型配置使用。
  - 当所选 / 默认模型无法接受图片输入时，也会作为回退路由使用。
- `imageGenerationModel`：既可接受字符串（`"provider/model"`），也可接受对象（`{ primary, fallbacks }`）。
  - 用于共享的图像生成能力，以及任何将来会生成图像的工具 / 插件入口面。
  - 典型值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，`openai/gpt-image-2` 用于 OpenAI Images，或 `openai/gpt-image-1.5` 用于支持透明背景的 OpenAI PNG/WebP 输出。
  - 如果你直接选择某个提供商 / 模型，也要配置对应的提供商凭证（例如 `google/*` 需要 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` / `openai/gpt-image-1.5` 需要 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 需要 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍然可以推断出一个具备凭证的默认提供商。它会先尝试当前默认提供商，然后按 provider id 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：既可接受字符串（`"provider/model"`），也可接受对象（`{ primary, fallbacks }`）。
  - 用于共享的音乐生成能力以及内置的 `music_generate` 工具。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍然可以推断出一个具备凭证的默认提供商。它会先尝试当前默认提供商，然后按 provider id 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择某个提供商 / 模型，也要配置对应的提供商凭证 / API key。
- `videoGenerationModel`：既可接受字符串（`"provider/model"`），也可接受对象（`{ primary, fallbacks }`）。
  - 用于共享的视频生成能力以及内置的 `video_generate` 工具。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍然可以推断出一个具备凭证的默认提供商。它会先尝试当前默认提供商，然后按 provider id 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择某个提供商 / 模型，也要配置对应的提供商凭证 / API key。
  - 内置的 Qwen 视频生成提供商最多支持 1 个输出视频、1 张输入图片、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：既可接受字符串（`"provider/model"`），也可接受对象（`{ primary, fallbacks }`）。
  - 用于 `pdf` 工具的模型路由。
  - 如果省略，PDF 工具会先回退到 `imageModel`，再回退到解析后的当前会话 / 默认模型。
- `pdfMaxBytesMb`：当调用时未传入 `maxBytesMb`，`pdf` 工具使用的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在提取回退模式下考虑的默认最大页数。
- `verboseDefault`：智能体的默认详细级别。取值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `elevatedDefault`：智能体的默认增强输出级别。取值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 `openai/gpt-5.5` 表示 API key 访问，或 `openai-codex/gpt-5.5` 表示 Codex OAuth）。如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商（这是已弃用的兼容行为，因此更推荐显式使用 `provider/model`）。如果该提供商不再公开配置中的默认模型，OpenClaw 会回退到第一个已配置的提供商 / 模型，而不是继续暴露一个已过期、已移除提供商的默认值。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目都可以包含 `alias`（快捷方式）和 `params`（提供商特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body` / `extraBody`）。
  - 安全编辑方式：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。除非传入 `--replace`，否则 `config set` 会拒绝会移除现有允许列表条目的替换操作。
  - 按提供商作用域划分的配置 / 新手引导流程会把所选提供商模型合并到此映射中，并保留已配置的无关提供商。
  - 对于直接使用 OpenAI Responses 的模型，会自动启用服务端压缩。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或者用 `params.responsesCompactThreshold` 覆盖阈值。参见 [OpenAI 服务端压缩](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有模型的全局默认提供商参数。设置在 `agents.defaults.params` 下（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（按模型）覆盖，然后再由 `agents.list[].params`（匹配的智能体 id）按键覆盖。详情参见[提示缓存](/zh-CN/reference/prompt-caching)。
- `params.extra_body` / `params.extraBody`：高级透传 JSON，会合并到用于 OpenAI 兼容代理的 `api: "openai-completions"` 请求体中。如果它与生成的请求键冲突，则以 extra body 为准；非原生 completions 路由之后仍会剥离仅适用于 OpenAI 的 `store`。
- `params.chat_template_kwargs`：vLLM / OpenAI 兼容的 chat template 参数，会合并到顶层 `api: "openai-completions"` 请求体中。对于 `vllm/nemotron-3-*` 且关闭 thinking 的情况，内置的 vLLM 插件会自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式设置的 `chat_template_kwargs` 会覆盖生成的默认值，而 `extra_body.chat_template_kwargs` 仍具有最终优先级。对于 vLLM Qwen 的 thinking 控制，请在该模型条目上将 `params.qwenThinkingFormat` 设为 `"chat-template"` 或 `"top-level"`。
- `params.preserveThinking`：仅适用于 Z.AI 的保留 thinking 选择加入项。启用后，当 thinking 打开时，OpenClaw 会发送 `thinking.clear_thinking: false` 并重放先前的 `reasoning_content`；参见 [Z.AI thinking 和保留 thinking](/zh-CN/providers/zai#thinking-and-preserved-thinking)。
- `agentRuntime`：默认的底层智能体运行时策略。省略 `id` 时默认使用 OpenClaw Pi。使用 `id: "pi"` 可强制使用内置 PI harness，使用 `id: "auto"` 可让已注册插件 harness 认领其支持的模型，使用类似 `id: "codex"` 的已注册 harness id，或使用类似 `id: "claude-cli"` 的受支持 CLI 后端别名。设置 `fallback: "none"` 可禁用自动回退到 PI。像 `codex` 这样的显式插件运行时默认采用失败即停，除非你在同一覆盖作用域中设置 `fallback: "pi"`。模型引用应保持规范格式 `provider/model`；应通过运行时配置选择 Codex、Claude CLI、Gemini CLI 和其他执行后端，而不是使用旧式运行时提供商前缀。关于它与提供商 / 模型选择的区别，参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。
- 会改写这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及回退 add/remove 命令）会保存为规范对象形式，并尽可能保留现有回退列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话本身仍然串行）。默认值：`4`。

### `agents.defaults.agentRuntime`

`agentRuntime` 控制由哪个底层执行器来运行智能体轮次。大多数部署应保留默认的 OpenClaw Pi 运行时。当受信任插件提供原生 harness 时使用它，例如内置的 Codex app-server harness，或者当你想使用受支持的 CLI 后端（例如 Claude CLI）时也可使用。关于其心智模型，参见 [Agent Runtimes](/zh-CN/concepts/agent-runtimes)。

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

- `id`：`"auto"`、`"pi"`、已注册插件 harness id，或受支持 CLI 后端别名。内置 Codex 插件注册了 `codex`；内置 Anthropic 插件提供 `claude-cli` CLI 后端。
- `fallback`：`"pi"` 或 `"none"`。在 `id: "auto"` 时，省略 fallback 会默认使用 `"pi"`，这样旧配置在没有插件 harness 认领运行时仍可继续使用 PI。在显式插件运行时模式下，例如 `id: "codex"`，省略 fallback 默认是 `"none"`，这样缺少 harness 时会直接失败，而不是静默使用 PI。运行时覆盖不会从更宽泛的作用域继承 fallback；如果你确实希望这种兼容性回退，请在显式运行时旁边一并设置 `fallback: "pi"`。所选插件 harness 的失败始终会直接呈现。
- 环境变量覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 会覆盖 `id`；`OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` 会覆盖该进程的 fallback。
- 对于仅使用 Codex 的部署，设置 `model: "openai/gpt-5.5"` 和 `agentRuntime.id: "codex"`。你也可以显式设置 `agentRuntime.fallback: "none"` 以提升可读性；对于显式插件运行时，这本就是默认值。
- 对于 Claude CLI 部署，建议使用 `model: "anthropic/claude-opus-4-7"` 搭配 `agentRuntime.id: "claude-cli"`。旧式 `claude-cli/claude-opus-4-7` 模型引用仍可用于兼容，但新配置应保持提供商 / 模型选择为规范形式，并把执行后端放在 `agentRuntime.id` 中。
- 较旧的运行时策略键会由 `openclaw doctor --fix` 重写为 `agentRuntime`。
- 在第一次嵌入式运行后，harness 选择会按 session id 固定。配置 / 环境变量变更会影响新的或已重置的会话，不会影响现有 transcript。带有 transcript 历史但没有记录固定值的旧会话，会被视为已固定到 PI。`/status` 会报告实际运行时，例如 `Runtime: OpenClaw Pi Default` 或 `Runtime: OpenAI Codex`。
- 这只控制文本智能体轮次执行。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用它们各自的提供商 / 模型设置。

**内置别名简写**（仅当模型存在于 `agents.defaults.models` 中时适用）：

| 别名                | 模型                                       |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` 或 `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

你自己配置的别名始终优先于默认值。

Z.AI 的 GLM-4.x 模型会自动启用 thinking 模式，除非你设置 `--thinking off`，或者你自己定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 以进行工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false` 可禁用它。
Anthropic Claude 4.6 模型在未显式设置 thinking 级别时，默认使用 `adaptive` thinking。

### `agents.defaults.cliBackends`

用于纯文本回退运行（无工具调用）的可选 CLI 后端。当 API 提供商失败时，可作为备份。

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
          // 或者当 CLI 接受提示文件标志时，使用 systemPromptFileArg。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为主；工具始终被禁用。
- 设置了 `sessionArg` 时支持会话。
- 如果 `imageArg` 接受文件路径，则支持图片透传。

### `agents.defaults.systemPromptOverride`

用一个固定字符串替换整个由 OpenClaw 组装的系统提示。可在默认级别设置（`agents.defaults.systemPromptOverride`），也可按智能体设置（`agents.list[].systemPromptOverride`）。按智能体设置的值优先级更高；空值或仅包含空白字符的值会被忽略。适用于受控的提示实验。

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

按模型家族应用的、与提供商无关的提示叠加层。GPT-5 家族模型 id 会跨提供商收到共享行为契约；`personality` 仅控制友好交互风格这一层。

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

- `"friendly"`（默认）和 `"on"` 会启用友好交互风格层。
- `"off"` 仅禁用友好层；带标签的 GPT-5 行为契约仍然启用。
- 当这个共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

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
        includeSystemPromptSection: true, // 默认：true；false 会从系统提示中省略 Heartbeat 部分
        lightContext: false, // 默认：false；true 仅从工作区引导文件中保留 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 会在全新会话中运行每次 heartbeat（无对话历史）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认：none | 可选值：last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：时长字符串（ms/s/m/h）。默认值：`30m`（API key 凭证）或 `1h`（OAuth 凭证）。设为 `0m` 可禁用。
- `includeSystemPromptSection`：设为 false 时，会从系统提示中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入引导上下文。默认值：`true`。
- `suppressToolErrorWarnings`：设为 true 时，在 heartbeat 运行期间会抑制工具错误警告负载。
- `timeoutSeconds`：在中止前，单次 heartbeat 智能体轮次允许的最长时间（秒）。若不设置，则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接 / 私信投递策略。`allow`（默认）允许直接目标投递。`block` 会抑制直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：设为 true 时，heartbeat 运行使用轻量引导上下文，并且只从工作区引导文件中保留 `HEARTBEAT.md`。
- `isolatedSession`：设为 true 时，每次 heartbeat 都会在一个没有任何先前对话历史的新会话中运行。与 cron 的 `sessionTarget: "isolated"` 使用相同的隔离模式。可将每次 heartbeat 的 token 成本从约 100K 降至约 2-5K token。
- 按智能体设置：使用 `agents.list[].heartbeat`。当任意智能体定义了 `heartbeat` 时，**只有这些智能体** 会运行 heartbeat。
- Heartbeat 会运行完整的智能体轮次 —— 间隔越短，消耗的 token 越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已注册 compaction 提供商插件的 id（可选）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // 当 identifierPolicy=custom 时使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 表示禁用重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选，仅用于 compaction 的模型覆盖
        truncateAfterCompaction: true, // compaction 后轮换到更小的后继 JSONL
        maxActiveTranscriptBytes: "20mb", // 可选，运行前触发本地 compaction 的阈值
        notifyUser: true, // 在 compaction 开始和完成时发送简短通知（默认：false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（针对长历史进行分块摘要）。参见[压缩](/zh-CN/concepts/compaction)。
- `provider`：已注册 compaction 提供商插件的 id。设置后，会调用该提供商的 `summarize()`，而不是使用内置 LLM 摘要。失败时会回退到内置实现。设置提供商会强制启用 `mode: "safeguard"`。参见[压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止单次 compaction 操作前允许的最长秒数。默认值：`900`。
- `keepRecentTokens`：Pi 切分点预算，用于原样保留最近的 transcript 尾部。手动 `/compact` 在显式设置时会遵循此值；否则手动 compaction 是一个硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在 compaction 摘要期间预置内置的不透明标识符保留指南。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：针对 safeguard 摘要的输出格式异常重试检查。默认在 safeguard 模式下启用；设为 `enabled: false` 可跳过审计。
- `postCompactionSections`：compaction 后要重新注入的可选 `AGENTS.md` H2 / H3 小节名称。默认值为 `["Session Startup", "Red Lines"]`；设为 `[]` 可禁用重新注入。当未设置或显式设为该默认对时，也接受较旧的 `Every Session` / `Safety` 标题作为旧版回退。
- `model`：可选的 `provider/model-id` 覆盖，仅用于 compaction 摘要。当主会话应继续使用一个模型，而 compaction 摘要应使用另一个模型时使用；未设置时，compaction 使用会话的主模型。
- `maxActiveTranscriptBytes`：可选的字节阈值（`number` 或类似 `"20mb"` 的字符串）；当活动 JSONL 增长超过该阈值时，会在运行前触发常规本地 compaction。要求开启 `truncateAfterCompaction`，以便成功 compaction 后轮换到更小的后继 transcript。未设置或设为 `0` 时禁用。
- `notifyUser`：当设为 `true` 时，会在 compaction 开始和完成时向用户发送简短通知（例如“正在压缩上下文...”和“压缩完成”）。默认禁用，以保持 compaction 静默。
- `memoryFlush`：自动 compaction 之前的静默智能体轮次，用于存储持久记忆。当工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在将内容发送给 LLM 之前，从内存上下文中清理**旧的工具结果**。**不会**修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 时长（ms/s/m/h），默认单位：分钟
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

- `mode: "cache-ttl"` 会启用清理过程。
- `ttl` 控制在上次缓存触碰之后，多久才能再次运行清理。
- 清理会先对过大的工具结果进行软截断，必要时再对更旧的工具结果执行硬清除。

**软截断**会保留开头和结尾，并在中间插入 `...`。

**硬清除**会用占位符替换整个工具结果。

说明：

- 图片块永远不会被截断 / 清除。
- 各比例基于字符数（近似值），不是精确 token 数。
- 如果助手消息少于 `keepLastAssistants` 条，则跳过清理。

</Accordion>

行为详情参见[会话清理](/zh-CN/concepts/session-pruning)。

### 分块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram 渠道需要显式设置 `*.blockStreaming: true` 才会启用分块回复。
- 渠道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及按账户变体）。Signal/Slack/Discord/Google Chat 默认使用 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500 毫秒。按智能体覆盖：`agents.list[].humanDelay`。

行为和分块详情参见[流式传输](/zh-CN/concepts/streaming)。

### 输入中指示器

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

- 默认值：私聊 / 提及时使用 `instant`，未提及的群聊使用 `message`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见[输入中指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南请参见[沙箱隔离](/zh-CN/gateway/sandboxing)。

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
          // 也支持 SecretRef / 内联内容：
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

选择 `backend: "openshell"` 时，运行时特定设置会移动到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于按作用域划分工作区的远程绝对根路径
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRef，OpenClaw 会在运行时将其实体化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略控制项

**SSH 凭证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话启动前，从活动 secrets 运行时快照中解析

**SSH 后端行为：**

- 在创建或重建后，仅对远程工作区进行一次初始化
- 然后保持远程 SSH 工作区为规范副本
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程变更同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：在 `~/.openclaw/sandboxes` 下使用按作用域划分的沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区只读挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

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
          gateway: "lab", // 可选
          gatewayEndpoint: "https://lab.example", // 可选
          policy: "strict", // 可选 OpenShell 策略 id
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

- `mirror`：执行前先从本地初始化到远程，执行后再同步回本地；本地工作区保持为规范副本
- `remote`：在创建沙箱时仅对远程进行一次初始化，之后保持远程工作区为规范副本

在 `remote` 模式下，在 OpenClaw 之外于主机本地所做的编辑，在初始化步骤之后不会自动同步到沙箱中。
传输方式是通过 SSH 进入 OpenShell 沙箱，但插件负责沙箱生命周期以及可选的镜像同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根文件系统和 root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请设为 `"bridge"`（或自定义 bridge 网络）。
默认会阻止 `"host"`。默认也会阻止 `"container:<id>"`，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（破玻璃紧急开关）。

**入站附件** 会暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局和按智能体的 binds 会合并。

**沙箱浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 会注入到系统提示中。在 `openclaw.json` 中不要求启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出一个短时有效的 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话以主机浏览器为目标。
- `network` 默认是 `openclaw-sandbox-browser`（专用 bridge 网络）。仅当你明确需要全局 bridge 连通性时才设置为 `bridge`。
- `cdpSourceRange` 可选地将容器边界上的 CDP 入站限制为某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅将额外的主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
- 启动默认值定义在 `scripts/sandbox-browser-entrypoint.sh` 中，并已针对容器主机进行调优：
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
  - `--disable-3d-apis`、`--disable-software-rasterizer` 和 `--disable-gpu` 默认启用；如果你的工作流需要 WebGL / 3D，可通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 禁用这些标志。
  - 如果你的工作流依赖扩展，可通过
    `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 重新启用扩展。
  - `--renderer-process-limit=2` 可通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 修改；设为 `0` 以使用 Chromium 的
    默认进程上限。
  - 另外，在启用 `noSandbox` 时还会加上 `--no-sandbox`。
  - 这些默认值是容器镜像基线；若要更改容器默认值，请使用带有自定义
    entrypoint 的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅适用于 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
```

### `agents.list`（按智能体覆盖）

使用 `agents.list[].tts` 可为某个智能体指定自己的 TTS 提供商、语音、模型、风格或自动 TTS 模式。该智能体块会在全局 `messages.tts` 之上进行深度合并，因此共享凭证可以保留在一个位置，而各个智能体只需覆盖自己需要的语音或提供商字段。当前智能体的覆盖会应用于自动语音回复、`/tts audio`、`/tts status` 以及 `tts` 智能体工具。关于提供商示例和优先级，请参见[文本转语音](/zh-CN/tools/tts#per-agent-voice-overrides)。

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
        thinkingDefault: "high", // 按智能体覆盖的 thinking 级别
        reasoningDefault: "on", // 按智能体覆盖的 reasoning 可见性
        fastModeDefault: false, // 按智能体覆盖的 fast mode
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 按键覆盖匹配 defaults.models 的 params
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 设置后会替换 agents.defaults.skills
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
- `default`：如果设置了多个，以第一个为准（会记录警告）。如果都未设置，则列表中的第一个条目为默认值。
- `model`：字符串形式只覆盖 `primary`；对象形式 `{ primary, fallbacks }` 会同时覆盖两者（`[]` 会禁用全局回退）。只覆盖 `primary` 的 cron 作业仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：按智能体作用域划分的流参数，会合并到 `agents.defaults.models` 中选定模型条目之上。用它来做智能体特定覆盖，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而无需复制整个模型目录。
- `tts`：可选的按智能体文本转语音覆盖。该块会在 `messages.tts` 之上深度合并，因此共享的提供商凭证和回退策略应保留在 `messages.tts` 中，而这里只设置角色特定值，例如提供商、语音、模型、风格或自动模式。
- `skills`：可选的按智能体 Skills 允许列表。如果省略，则在设置了 `agents.defaults.skills` 时继承该值；显式列表会替换默认值而不是合并，`[]` 表示不启用任何 Skills。
- `thinkingDefault`：可选的按智能体默认 thinking 级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置按消息或会话覆盖时，会覆盖此智能体的 `agents.defaults.thinkingDefault`。所选提供商 / 模型配置决定哪些值有效；对于 Google Gemini，`adaptive` 会保留由提供商掌控的动态 thinking（在 Gemini 3/3.1 上省略 `thinkingLevel`，在 Gemini 2.5 上使用 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的按智能体默认 reasoning 可见性（`on | off | stream`）。在未设置按消息或会话的 reasoning 覆盖时生效。
- `fastModeDefault`：可选的按智能体默认 fast mode（`true | false`）。在未设置按消息或会话的 fast-mode 覆盖时生效。
- `agentRuntime`：可选的按智能体底层运行时策略覆盖。使用 `{ id: "codex" }` 可让某个智能体仅使用 Codex，而其他智能体仍在 `auto` 模式下保留默认的 PI 回退。
- `runtime`：可选的按智能体运行时描述符。当该智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 和 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会推导默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name` / `emoji`。
- `subagents.allowAgents`：用于显式 `sessions_spawn.agentId` 目标的智能体 id 允许列表（`["*"]` = 任意；默认：仅同一智能体）。如果应允许自定向的 `agentId` 调用，请包含请求者 id。
- 沙箱继承保护：如果请求者会话处于沙箱隔离中，`sessions_spawn` 会拒绝那些会以非沙箱方式运行的目标。
- `subagents.requireAgentId`：设为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关中运行多个彼此隔离的智能体。参见[多智能体](/zh-CN/concepts/multi-agent)。

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

- `type`（可选）：普通路由使用 `route`（缺失 `type` 时默认也是 route），持久化 ACP 对话绑定使用 `acp`。
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
5. `match.accountId: "*"`（渠道范围）
6. 默认智能体

在每一层级中，首个匹配的 `bindings` 条目获胜。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份（`match.channel` + account + `match.peer.id`）进行解析，不使用上面的 route 绑定层级顺序。

### 按智能体访问配置

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

优先级详情请参见[多智能体沙箱隔离与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
    parentForkMaxTokens: 100000, // 超过此 token 数时跳过父线程分叉（0 表示禁用）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 时长或 false
      maxDiskBytes: "500mb", // 可选硬预算
      highWaterBytes: "400mb", // 可选清理目标
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 默认按小时计的无活动自动取消聚焦（`0` 表示禁用）
      maxAgeHours: 0, // 默认按小时计的硬最大时长（`0` 表示禁用）
    },
    mainKey: "main", // 旧版字段（运行时始终使用 "main"）
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
  - `per-sender`（默认）：在一个渠道上下文内，每个发送者都有独立会话。
  - `global`：一个渠道上下文中的所有参与者共享同一个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信的分组方式。
  - `main`：所有私信共享主会话。
  - `per-peer`：跨渠道按发送者 id 隔离。
  - `per-channel-peer`：按渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账户 + 渠道 + 发送者隔离（推荐用于多账户）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的 peer，用于跨渠道共享会话。像 `/dock_discord` 这样的 dock 命令也使用同一映射，将当前会话的回复路由切换到另一个已关联渠道 peer；参见[渠道停靠](/zh-CN/concepts/channel-docking)。
- **`reset`**：主重置策略。`daily` 会在本地时间 `atHour` 重置；`idle` 会在空闲 `idleMinutes` 后重置。如果两者都配置，则先到期者优先。每日重置的新鲜度使用会话行的 `sessionStartedAt`；空闲重置的新鲜度使用 `lastInteractionAt`。像 heartbeat、cron 唤醒、exec 通知和 Gateway 网关记账这样的后台 / 系统事件写入可能会更新 `updatedAt`，但它们不会保持 daily / idle 会话的新鲜状态。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名。
- **`parentForkMaxTokens`**：创建分叉线程会话时，允许父会话拥有的最大 `totalTokens`（默认 `100000`）。
  - 如果父会话的 `totalTokens` 高于此值，OpenClaw 会启动一个新的线程会话，而不是继承父 transcript 历史。
  - 设为 `0` 可禁用此保护，并始终允许父级分叉。
- **`mainKey`**：旧版字段。运行时对主私聊桶始终使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：智能体之间交换过程中，允许的最大来回回复轮数（整数，范围：`0`–`5`）。`0` 会禁用 ping-pong 链式往返。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 为别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。首个 deny 生效。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 会执行清理。
  - `pruneAfter`：陈旧条目的年龄截止值（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。对于生产规模上限，运行时写入会用一个较小的高水位缓冲执行批量清理；`openclaw sessions cleanup --enforce` 会立即应用该上限。
  - `rotateBytes`：当 `sessions.json` 超过该大小时进行轮换（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` transcript 归档的保留期。默认继承 `pruneAfter`；设为 `false` 可禁用。
  - `maxDiskBytes`：可选的 sessions 目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会优先移除最旧的制品 / 会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认是 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认按小时计的无活动自动取消聚焦（`0` 表示禁用；提供商可覆盖）
  - `maxAgeHours`：默认按小时计的硬最大时长（`0` 表示禁用；提供商可覆盖）

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
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

按渠道 / 账户覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（最具体者优先）：账户 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 会派生为 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述             | 示例                        |
| ----------------- | ---------------- | --------------------------- |
| `{model}`         | 短模型名称       | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符   | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称       | `anthropic`                 |
| `{thinkingLevel}` | 当前 thinking 级别 | `high`、`low`、`off`        |
| `{identity.name}` | 智能体身份名称   | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认使用当前智能体的 `identity.emoji`，否则为 `"👀"`。设为 `""` 可禁用。
- 按渠道覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → 渠道 → `messages.ackReaction` → identity 回退。
- 作用范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在支持反应的渠道（如 Slack、Discord、Telegram、WhatsApp 和 BlueBubbles）中，回复后移除确认反应。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期 Status 反应。
  在 Slack 和 Discord 上，未设置时，如果确认反应处于激活状态，则保持 Status 反应启用。
  在 Telegram 上，必须显式将其设为 `true` 才会启用生命周期 Status 反应。

### 入站防抖

将来自同一发送者的快速纯文本消息批处理为单次智能体轮次。媒体 / 附件会立即刷新。控制命令会绕过防抖。

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

- `auto` 控制默认自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可覆盖本地偏好，`/tts status` 会显示实际生效状态。
- `summaryModel` 会覆盖自动摘要所使用的 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（选择启用）。
- API key 会回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY` 和 `OPENAI_API_KEY`。
- 内置语音提供商由插件拥有。如果设置了 `plugins.allow`，请包含你想使用的每个 TTS 提供商插件，例如用于 Edge TTS 的 `microsoft`。旧版 `edge` 提供商 id 可作为 `microsoft` 的别名接受。
- `providers.openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序是配置、然后 `OPENAI_TTS_BASE_URL`，最后是 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为 OpenAI 兼容的 TTS 服务器，并放宽模型 / 语音校验。

---

## 通话

Talk 模式（macOS / iOS / Android）的默认设置。

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

- 当配置了多个 Talk 提供商时，`talk.provider` 必须与 `talk.providers` 中的某个键匹配。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，并会自动迁移到 `talk.providers.<provider>` 中。
- Voice ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 仅当未配置 Talk API key 时，才会应用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 让 Talk 指令可以使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 辅助工具所使用的 Hugging Face 仓库。若省略，macOS 使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放会通过内置的 `openclaw-mlx-tts` 辅助工具运行；如果该工具不存在，则使用 `PATH` 上的可执行文件；开发时可用 `OPENCLAW_MLX_TTS_BIN` 覆盖辅助工具路径。
- `speechLocale` 设置 iOS / macOS Talk 语音识别所使用的 BCP 47 locale id。若不设置，则使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户静默多久后发送 transcript。未设置时保留平台默认暂停窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）。

---

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速设置
- [配置示例](/zh-CN/gateway/configuration-examples)

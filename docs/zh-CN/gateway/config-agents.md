---
read_when:
    - 调整智能体默认设置（模型、思考、工作区、心跳、媒体、Skills）
    - 配置多智能体路由和绑定
    - 调整会话、消息投递和 talk 模式行为
summary: 智能体默认设置、多智能体路由、会话、消息和 talk 配置
title: 配置 — 智能体
x-i18n:
    generated_at: "2026-04-24T03:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

`agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 下的智能体作用域配置键。对于渠道、工具、Gateway 网关运行时及其他顶层键，请参阅[配置参考](/zh-CN/gateway/configuration-reference)。

## 智能体默认设置

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的仓库根目录，会显示在系统提示中的 Runtime 行里。如果未设置，OpenClaw 会从工作区开始向上遍历并自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

对于未设置 `agents.list[].skills` 的智能体，可选的默认技能 allowlist。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无技能
    ],
  },
}
```

- 省略 `agents.defaults.skills`，则默认 Skills 不受限制。
- 省略 `agents.list[].skills`，则继承默认值。
- 设置 `agents.list[].skills: []` 表示不启用任何 Skills。
- 非空的 `agents.list[].skills` 列表就是该智能体的最终集合；它不会与默认值合并。

### `agents.defaults.skipBootstrap`

禁用工作区 bootstrap 文件的自动创建（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制何时将工作区 bootstrap 文件注入到系统提示中。默认值：`"always"`。

- `"continuation-skip"`：安全的续接轮次（在助手完成回复之后）会跳过工作区 bootstrap 的重新注入，从而减少提示大小。Heartbeat 运行和压缩后重试仍会重建上下文。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区 bootstrap 文件在被截断前允许的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

跨所有工作区 bootstrap 文件注入的最大总字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制当 bootstrap 上下文被截断时，对智能体可见的警告文本。默认值：`"once"`。

- `"off"`：绝不向系统提示中注入警告文本。
- `"once"`：对于每个唯一的截断签名只注入一次警告（推荐）。
- `"always"`：只要存在截断，就在每次运行时都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算归属映射

OpenClaw 有多个高容量的提示/上下文预算，这些预算会按子系统有意拆分，而不是全部流经某一个通用调节项。

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`：
  常规工作区 bootstrap 注入。
- `agents.defaults.startupContext.*`：
  一次性的 `/new` 和 `/reset` 启动前导内容，包括最近的每日
  `memory/*.md` 文件。
- `skills.limits.*`：
  注入到系统提示中的紧凑 Skills 列表。
- `agents.defaults.contextLimits.*`：
  有界的运行时摘录和由运行时拥有的注入块。
- `memory.qmd.limits.*`：
  已索引的记忆搜索片段和注入大小控制。

仅当某个智能体需要不同预算时，再使用对应的每智能体覆盖项：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在裸 `/new` 和 `/reset` 运行中注入的首轮启动前导内容。

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

- `memoryGetMaxChars`：`memory_get` 摘录在添加截断元数据和续接提示前的默认上限。
- `memoryGetDefaultLines`：当省略 `lines` 时，`memory_get` 的默认行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：压缩后刷新注入期间 `AGENTS.md` 摘录的字符上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 调节项的每智能体覆盖项。省略的字段会继承 `agents.defaults.contextLimits`。

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

Skills 提示预算的每智能体覆盖项。

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

在调用提供商之前，转录记录/工具图像块中图像最长边的最大像素尺寸。
默认值：`1200`。

较低的值通常会减少视觉 token 用量和截图密集型运行的请求负载大小。
较高的值则能保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

用于系统提示上下文的时区（不影响消息时间戳）。回退为主机时区。

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
      embeddedHarness: {
        runtime: "auto", // auto | pi | 已注册的 harness id，例如 codex
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
  - 对象形式设置主模型以及按顺序排列的故障转移模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于 `image` 工具路径，作为其视觉模型配置。
  - 当已选择/默认模型无法接受图像输入时，也会用作回退路由。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享的图像生成能力，以及任何未来用于生成图像的工具/插件表面。
  - 典型值：`google/gemini-3.1-flash-image-preview` 用于原生 Gemini 图像生成，`fal/fal-ai/flux/dev` 用于 fal，或 `openai/gpt-image-2` 用于 OpenAI Images。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商认证（例如 `google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/gpt-image-2` 使用 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，`fal/*` 使用 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍然可以推断出一个带认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的图像生成提供商。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享的音乐生成能力和内置 `music_generate` 工具。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.5+`。
  - 如果省略，`music_generate` 仍然可以推断出一个带认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的音乐生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商认证/API 密钥。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享的视频生成能力和内置 `video_generate` 工具。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍然可以推断出一个带认证的提供商默认值。它会先尝试当前默认提供商，然后按提供商 id 顺序尝试其余已注册的视频生成提供商。
  - 如果你直接选择提供商/模型，也要配置匹配的提供商认证/API 密钥。
  - 内置的 Qwen 视频生成提供商支持最多 1 个输出视频、1 张输入图像、4 个输入视频、10 秒时长，以及提供商级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于 `pdf` 工具的模型路由。
  - 如果省略，PDF 工具会回退到 `imageModel`，然后再回退到已解析的会话/默认模型。
- `pdfMaxBytesMb`：当调用时未传入 `maxBytesMb` 时，`pdf` 工具使用的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具在提取回退模式下默认考虑的最大页数。
- `verboseDefault`：智能体的默认详细级别。取值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `elevatedDefault`：智能体的默认增强输出级别。取值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式为 `provider/model`（例如 API 密钥访问使用 `openai/gpt-5.4`，Codex OAuth 使用 `openai-codex/gpt-5.5`）。如果你省略提供商，OpenClaw 会先尝试别名，然后尝试与该精确模型 id 唯一匹配的已配置提供商，最后才回退到已配置的默认提供商（这是已弃用的兼容行为，因此建议优先使用显式 `provider/model`）。如果该提供商不再公开配置的默认模型，OpenClaw 会回退到第一个已配置的提供商/模型，而不是暴露一个已失效、已移除提供商的默认值。
- `models`：`/model` 使用的已配置模型目录和 allowlist。每个条目都可以包含 `alias`（快捷方式）和 `params`（提供商特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。`config set` 会拒绝替换那些会移除现有 allowlist 条目的操作，除非你传入 `--replace`。
  - 提供商作用域的配置/新手引导流程会将所选提供商模型合并到此映射中，并保留已经配置的其他无关提供商。
  - 对于直接使用的 OpenAI Responses 模型，会自动启用服务端压缩。使用 `params.responsesServerCompaction: false` 可停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。请参阅 [OpenAI server-side compaction](/zh-CN/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有模型的全局默认提供商参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）会被 `agents.defaults.models["provider/model"].params`（每模型）覆盖，然后再由 `agents.list[].params`（匹配的智能体 id）按键覆盖。详情请参阅 [Prompt Caching](/zh-CN/reference/prompt-caching)。
- `embeddedHarness`：默认的底层嵌入式智能体运行时策略。使用 `runtime: "auto"` 让已注册插件 harness 认领受支持模型，使用 `runtime: "pi"` 强制使用内置 PI harness，或使用已注册的 harness id，例如 `runtime: "codex"`。设置 `fallback: "none"` 可禁用自动 PI 回退。
- 会变更这些字段的配置写入器（例如 `/models set`、`/models set-image` 以及回退 add/remove 命令）会保存规范化对象形式，并在可能时保留现有回退列表。
- `maxConcurrent`：跨会话的最大并行智能体运行数（每个会话本身仍然串行）。默认值：4。

### `agents.defaults.embeddedHarness`

`embeddedHarness` 控制哪个底层执行器运行嵌入式智能体轮次。
大多数部署应保持默认值 `{ runtime: "auto", fallback: "pi" }`。
当受信任插件提供原生 harness 时使用它，例如内置的
Codex app-server harness。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`：`"auto"`、`"pi"` 或已注册的插件 harness id。内置 Codex 插件会注册 `codex`。
- `fallback`：`"pi"` 或 `"none"`。当未选择任何插件 harness 时，`"pi"` 会保留内置 PI harness 作为兼容性回退。`"none"` 则会在插件 harness 缺失或不受支持时直接失败，而不是静默使用 PI。已选择的插件 harness 失败始终会直接暴露出来。
- 环境变量覆盖：`OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` 会覆盖 `runtime`；`OPENCLAW_AGENT_HARNESS_FALLBACK=none` 会为该进程禁用 PI 回退。
- 对于仅使用 Codex 的部署，设置 `model: "openai/gpt-5.5"`、`embeddedHarness.runtime: "codex"` 和 `embeddedHarness.fallback: "none"`。
- 在首次嵌入式运行后，harness 选择会按会话 id 固定。配置/环境变量变更会影响新的或已重置的会话，不会影响现有转录记录。带有转录历史但没有记录固定值的旧会话会被视为已固定到 PI。`/status` 会在 `Fast` 旁显示非 PI harness id，例如 `codex`。
- 这只控制嵌入式聊天 harness。媒体生成、视觉、PDF、音乐、视频和 TTS 仍使用各自的提供商/模型设置。

**内置别名简写**（仅当模型位于 `agents.defaults.models` 中时生效）：

| 别名                | 模型                                               |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` 或已配置的 Codex OAuth GPT-5.5    |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off`，或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 以支持工具调用流式传输。设置 `agents.defaults.models["zai/<model>"].params.tool_stream` 为 `false` 可将其禁用。
Anthropic Claude 4.6 模型在未设置显式思考级别时，默认使用 `adaptive` 思考。

### `agents.defaults.cliBackends`

用于纯文本回退运行（无工具调用）的可选 CLI 后端。当 API 提供商失败时，可作为备用方案。

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
- 设置了 `sessionArg` 时支持会话。
- 当 `imageArg` 接受文件路径时，支持图像透传。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个由 OpenClaw 组装的系统提示。可在默认级别设置（`agents.defaults.systemPromptOverride`），也可按智能体设置（`agents.list[].systemPromptOverride`）。每智能体值优先级更高；空字符串或仅包含空白字符的值会被忽略。适用于受控提示实验。

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

按模型家族应用的、与提供商无关的提示覆盖层。GPT-5 系列模型 id 会跨提供商接收共享的行为契约；`personality` 仅控制友好交互风格层。

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
- 当未设置此共享配置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

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
        includeSystemPromptSection: true, // 默认值：true；false 会从系统提示中省略 Heartbeat 部分
        lightContext: false, // 默认值：false；true 只保留工作区 bootstrap 文件中的 HEARTBEAT.md
        isolatedSession: false, // 默认值：false；true 会让每次 Heartbeat 在全新会话中运行（无对话历史）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认值：none | 可选值：last | whatsapp | telegram | discord | ...
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
- `includeSystemPromptSection`：为 false 时，会从系统提示中省略 Heartbeat 部分，并跳过将 `HEARTBEAT.md` 注入到 bootstrap 上下文中。默认值：`true`。
- `suppressToolErrorWarnings`：为 true 时，会在 Heartbeat 运行期间抑制工具错误警告负载。
- `timeoutSeconds`：Heartbeat 智能体轮次在被中止前允许的最长秒数。若留空，则使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/私信投递策略。`allow`（默认）允许直接目标投递。`block` 会抑制直接目标投递，并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，Heartbeat 运行会使用轻量 bootstrap 上下文，并且只保留工作区 bootstrap 文件中的 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 Heartbeat 都会在一个全新会话中运行，没有先前的对话历史。与 cron `sessionTarget: "isolated"` 使用相同的隔离模式。可将每次 Heartbeat 的 token 成本从约 100K 降低到约 2-5K。
- 每智能体：设置 `agents.list[].heartbeat`。当任意智能体定义了 `heartbeat` 时，**只有这些智能体**会运行 Heartbeat。
- Heartbeat 会运行完整的智能体轮次——间隔越短，消耗的 token 越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 已注册压缩提供商插件的 id（可选）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // 当 identifierPolicy=custom 时使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 表示禁用重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选，仅用于压缩的模型覆盖
        notifyUser: true, // 当压缩开始和完成时发送简短通知（默认值：false）
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

- `mode`：`default` 或 `safeguard`（针对长历史的分块摘要）。请参阅[压缩](/zh-CN/concepts/compaction)。
- `provider`：已注册压缩提供商插件的 id。设置后，会调用该提供商的 `summarize()`，而不是内置 LLM 摘要。失败时会回退到内置实现。设置提供商会强制使用 `mode: "safeguard"`。请参阅[压缩](/zh-CN/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 在中止单次压缩操作前允许的最长秒数。默认值：`900`。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 会在压缩摘要时预置内建的不透明标识符保留指引。
- `identifierInstructions`：当 `identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `postCompactionSections`：压缩后要重新注入的可选 `AGENTS.md` H2/H3 章节名。默认值为 `["Session Startup", "Red Lines"]`；设置为 `[]` 可禁用重新注入。当未设置或显式设置为这对默认值时，旧版 `Every Session`/`Safety` 标题也会作为兼容性回退被接受。
- `model`：可选的 `provider/model-id` 覆盖项，仅用于压缩摘要。当主会话需要保持一个模型，但压缩摘要应运行在另一个模型上时使用；未设置时，压缩会使用会话的主模型。
- `notifyUser`：为 `true` 时，会在压缩开始和完成时向用户发送简短通知（例如 “Compacting context...” 和 “Compaction complete”）。默认禁用，以保持压缩静默进行。
- `memoryFlush`：自动压缩前的静默智能体轮次，用于存储持久记忆。当工作区为只读时会跳过。

### `agents.defaults.contextPruning`

在发送给 LLM 之前，从内存上下文中裁剪**旧的工具结果**。**不会**修改磁盘上的会话历史。

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

- `mode: "cache-ttl"` 启用裁剪过程。
- `ttl` 控制下次允许再次执行裁剪的时间间隔（自上次缓存触碰后开始计算）。
- 裁剪会先对超大的工具结果做软裁剪，如仍有需要，再对更旧的工具结果做硬清除。

**软裁剪**会保留开头和结尾，并在中间插入 `...`。

**硬清除**会用占位文本替换整个工具结果。

说明：

- 图像块永远不会被裁剪/清除。
- 比例基于字符数（近似值），而不是精确 token 数。
- 如果 assistant 消息数量少于 `keepLastAssistants`，则会跳过裁剪。

</Accordion>

有关行为细节，请参阅[会话裁剪](/zh-CN/concepts/session-pruning)。

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
- 渠道覆盖项：`channels.<channel>.blockStreamingCoalesce`（以及每账户变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500ms。每智能体覆盖项：`agents.list[].humanDelay`。

有关行为和分块细节，请参阅[流式传输](/zh-CN/concepts/streaming)。

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

- 默认值：直接聊天/被提及时为 `instant`，未被提及的群聊为 `message`。
- 每会话覆盖项：`session.typingMode`、`session.typingIntervalSeconds`。

请参阅[输入状态指示器](/zh-CN/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式智能体的可选沙箱隔离。完整指南请参阅[沙箱隔离](/zh-CN/gateway/sandboxing)。

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

当选择 `backend: "openshell"` 时，运行时特定设置会移动到
`plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 形式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于每个作用域工作区的远程绝对根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：内联内容或 SecretRef，OpenClaw 会在运行时将其实体化为临时文件
- `strictHostKeyChecking` / `updateHostKeys`：OpenSSH 主机密钥策略调节项

**SSH 认证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- 由 SecretRef 支持的 `*Data` 值会在沙箱会话启动前，从活动 secrets 运行时快照中解析

**SSH 后端行为：**

- 在创建或重建后对远程工作区进行一次初始化播种
- 然后保持远程 SSH 工作区为规范副本
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不会自动将远程更改同步回主机
- 不支持沙箱浏览器容器

**工作区访问：**

- `none`：在 `~/.openclaw/sandboxes` 下为每个作用域创建沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，智能体工作区以只读方式挂载到 `/agent`
- `rw`：智能体工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：每会话一个容器 + 工作区
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
          policy: "strict", // 可选的 OpenShell policy id
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

- `mirror`：执行前将本地内容播种到远端，执行后再同步回来；本地工作区保持为规范副本
- `remote`：在创建沙箱时将本地内容播种到远端一次，然后保持远端工作区为规范副本

在 `remote` 模式下，在 OpenClaw 外部对主机本地所做的编辑，在播种步骤完成后不会自动同步到沙箱中。
传输通过 SSH 进入 OpenShell 沙箱，但插件负责沙箱生命周期和可选的 mirror 同步。

**`setupCommand`** 会在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根文件系统和 root 用户。

**容器默认使用 `network: "none"`** —— 如果智能体需要出站访问，请将其设置为 `"bridge"`（或自定义 bridge 网络）。
`"host"` 会被阻止。默认情况下，`"container:<id>"` 也会被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急破例）。

**入站附件** 会被暂存到活动工作区中的 `media/inbound/*`。

**`docker.binds`** 会挂载额外的主机目录；全局和每智能体的 binds 会合并。

**沙箱隔离浏览器**（`sandbox.browser.enabled`）：在容器中运行 Chromium + CDP。noVNC URL 会注入到系统提示中。不需要在 `openclaw.json` 中启用 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 会发出一个短期有效的 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）会阻止沙箱隔离会话将目标指向主机浏览器。
- `network` 默认值为 `openclaw-sandbox-browser`（专用 bridge 网络）。只有在你明确需要全局 bridge 连通性时，才设置为 `bridge`。
- `cdpSourceRange` 可以选择性地在容器边界将 CDP 入站限制到某个 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 只会把额外的主机目录挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。
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
    默认启用；如果你的 WebGL/3D 使用场景需要，可以通过
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` 将其关闭。
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 会重新启用扩展，如果你的工作流依赖它们。
  - `--renderer-process-limit=2` 可以通过
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 修改；设置为 `0` 则使用 Chromium 的
    默认进程限制。
  - 当启用 `noSandbox` 时，还会加上 `--no-sandbox` 和 `--disable-setuid-sandbox`。
  - 这些默认值是容器镜像的基线；若要修改容器默认值，请使用带有自定义
    entrypoint 的自定义浏览器镜像。

</Accordion>

浏览器沙箱隔离和 `sandbox.docker.binds` 仅支持 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
```

### `agents.list`（每智能体覆盖项）

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
        thinkingDefault: "high", // 每智能体思考级别覆盖
        reasoningDefault: "on", // 每智能体推理可见性覆盖
        fastModeDefault: false, // 每智能体快速模式覆盖
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // 按键覆盖匹配的 defaults.models params
        skills: ["docs-search"], // 设置后替换 agents.defaults.skills
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
- `default`：若设置了多个，则第一个生效（会记录警告）。如果都未设置，则列表中的第一个条目为默认值。
- `model`：字符串形式只覆盖 `primary`；对象形式 `{ primary, fallbacks }` 会同时覆盖两者（`[]` 表示禁用全局回退）。仅覆盖 `primary` 的 cron 任务仍会继承默认回退，除非你设置 `fallbacks: []`。
- `params`：按智能体的流参数，会合并到 `agents.defaults.models` 中所选模型条目之上。可用于智能体特定覆盖，例如 `cacheRetention`、`temperature` 或 `maxTokens`，而无需复制整个模型目录。
- `skills`：可选的每智能体 Skills allowlist。如果省略，且已设置 `agents.defaults.skills`，则该智能体会继承它；显式列表会替换默认值而不是合并，`[]` 表示无 Skills。
- `thinkingDefault`：可选的每智能体默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。当未设置每消息或每会话覆盖时，会覆盖此智能体的 `agents.defaults.thinkingDefault`。
- `reasoningDefault`：可选的每智能体默认推理可见性（`on | off | stream`）。当未设置每消息或每会话推理覆盖时生效。
- `fastModeDefault`：可选的每智能体默认快速模式（`true | false`）。当未设置每消息或每会话快速模式覆盖时生效。
- `embeddedHarness`：可选的每智能体底层 harness 策略覆盖。使用 `{ runtime: "codex", fallback: "none" }` 可让某个智能体仅使用 Codex，而其他智能体保留默认的 PI 回退。
- `runtime`：可选的每智能体运行时描述符。当该智能体应默认使用 ACP harness 会话时，使用 `type: "acp"` 以及 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 会派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：`sessions_spawn` 使用的智能体 id allowlist（`["*"]` = 任意；默认：仅限同一智能体）。
- 沙箱继承保护：如果请求方会话在沙箱中运行，`sessions_spawn` 会拒绝那些会以非沙箱方式运行的目标。
- `subagents.requireAgentId`：为 true 时，会阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式选择配置；默认：false）。

---

## 多智能体路由

在一个 Gateway 网关内运行多个相互隔离的智能体。请参阅[多智能体](/zh-CN/concepts/multi-agent)。

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

- `type`（可选）：`route` 用于普通路由（未设置时默认为 route），`acp` 用于持久化 ACP 对话绑定。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；渠道特定）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（渠道范围）
6. 默认智能体

在每一层中，第一个匹配的 `bindings` 条目胜出。

对于 `type: "acp"` 条目，OpenClaw 会按精确对话身份解析（`match.channel` + account + `match.peer.id`），不会使用上面的 route 绑定层级顺序。

### 每智能体访问配置

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

有关优先级细节，请参阅[多智能体沙箱与工具](/zh-CN/tools/multi-agent-sandbox-tools)。

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
    parentForkMaxTokens: 100000, // 当超过此 token 数时跳过父线程 fork（0 表示禁用）
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
      idleHours: 24, // 默认的空闲自动取消聚焦时长（小时，`0` 表示禁用）
      maxAgeHours: 0, // 默认的硬最大时长（小时，`0` 表示禁用）
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
  - `per-sender`（默认）：每个发送者在频道上下文中都有独立会话。
  - `global`：频道上下文中的所有参与者共享一个会话（仅在确实需要共享上下文时使用）。
- **`dmScope`**：私信如何分组。
  - `main`：所有私信共享主会话。
  - `per-peer`：按发送者 id 跨渠道隔离。
  - `per-channel-peer`：按每个渠道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按每个账户 + 渠道 + 发送者隔离（推荐用于多账户）。
- **`identityLinks`**：将规范 id 映射到带提供商前缀的 peer，以实现跨渠道会话共享。
- **`reset`**：主重置策略。`daily` 会在本地时间 `atHour` 重置；`idle` 会在 `idleMinutes` 后重置。当两者都已配置时，先到期者优先。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名使用。
- **`parentForkMaxTokens`**：创建 fork 线程会话时，父会话允许的最大 `totalTokens`（默认 `100000`）。
  - 如果父会话的 `totalTokens` 高于该值，OpenClaw 会启动一个全新的线程会话，而不是继承父转录历史。
  - 设置为 `0` 可禁用此保护，并始终允许从父级 fork。
- **`mainKey`**：旧版字段。运行时始终对主直接聊天桶使用 `"main"`。
- **`agentToAgent.maxPingPongTurns`**：智能体间通信时允许的最大来回回复轮数（整数，范围：`0`–`5`）。`0` 表示禁用乒乓式链式回复。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 为别名）、`keyPrefix` 或 `rawKeyPrefix` 进行匹配。第一个 deny 规则优先。
- **`maintenance`**：会话存储清理 + 保留控制。
  - `mode`：`warn` 只发出警告；`enforce` 会执行清理。
  - `pruneAfter`：陈旧条目的时间截断点（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中允许的最大条目数（默认 `500`）。
  - `rotateBytes`：当 `sessions.json` 超过该大小时进行轮转（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录归档的保留时间。默认等于 `pruneAfter`；设置为 `false` 可禁用。
  - `maxDiskBytes`：可选的 sessions 目录磁盘预算。在 `warn` 模式下会记录警告；在 `enforce` 模式下会优先移除最旧的工件/会话。
  - `highWaterBytes`：预算清理后的可选目标值。默认值为 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定会话功能的全局默认值。
  - `enabled`：主默认开关（提供商可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认的空闲自动取消聚焦时长（小时，`0` 表示禁用；提供商可覆盖）
  - `maxAgeHours`：默认的硬最大时长（小时，`0` 表示禁用；提供商可覆盖）

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

### 回复前缀

每渠道/账户覆盖项：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析顺序（越具体优先级越高）：账户 → 渠道 → 全局。`""` 会禁用并停止级联。`"auto"` 会派生为 `[{identity.name}]`。

**模板变量：**

| 变量              | 说明           | 示例                        |
| ----------------- | -------------- | --------------------------- |
| `{model}`         | 短模型名       | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符 | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称     | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别   | `high`、`low`、`off`        |
| `{identity.name}` | 智能体身份名称 | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认为活动智能体的 `identity.emoji`，否则为 `"👀"`。设置 `""` 可禁用。
- 每渠道覆盖项：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → 渠道 → `messages.ackReaction` → identity 回退值。
- 作用域：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在 Slack、Discord 和 Telegram 上，回复后移除 ack。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期状态反应。
  在 Slack 和 Discord 上，如果未设置，则当确认反应处于激活状态时保持状态反应启用。
  在 Telegram 上，需显式将其设置为 `true` 才会启用生命周期状态反应。

### 入站去抖

将同一发送者的快速纯文本消息批量合并为一个智能体轮次。媒体/附件会立即刷新。控制命令会绕过去抖。

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
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` 控制默认自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好，`/tts status` 会显示生效状态。
- `summaryModel` 会覆盖自动摘要使用的 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（需主动启用）。
- API 密钥会回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- `openai.baseUrl` 会覆盖 OpenAI TTS 端点。解析顺序为配置，然后 `OPENAI_TTS_BASE_URL`，最后是 `https://api.openai.com/v1`。
- 当 `openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 会将其视为 OpenAI 兼容的 TTS 服务器，并放宽模型/语音校验。

---

## Talk

Talk 模式（macOS/iOS/Android）的默认设置。

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
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- 当配置了多个 Talk 提供商时，`talk.provider` 必须匹配 `talk.providers` 中的某个键。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，并会自动迁移到 `talk.providers.<provider>`。
- 语音 ID 会回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 只有在未配置 Talk API 密钥时，才会使用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许 Talk 指令使用易记名称。
- `silenceTimeoutMs` 控制 Talk 模式在用户静音后等待多久再发送转录。未设置时会保留平台默认停顿窗口（`macOS 和 Android 为 700 ms，iOS 为 900 ms`）。

---

## 相关

- [配置参考](/zh-CN/gateway/configuration-reference) — 所有其他配置键
- [配置](/zh-CN/gateway/configuration) — 常见任务和快速开始
- [配置示例](/zh-CN/gateway/configuration-examples)

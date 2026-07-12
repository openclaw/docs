---
read_when:
    - 调整思考、快速模式或详细指令的解析方式或默认值
summary: /think、/fast、/verbose、/trace 的指令语法及推理可见性
title: 思考级别
x-i18n:
    generated_at: "2026-07-11T21:02:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## 功能说明

- 任何入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max | ultra`，大致对应 Anthropic 经典魔法词阶梯中的“思考”<“深入思考”<“更深入思考”<“极致思考”：
  - minimal ~“思考”
  - low ~“深入思考”
  - medium ~“更深入思考”
  - high ~“极致思考”（最大预算）
  - xhigh ~“极致思考+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7+ 的推理强度）
  - adaptive → 由提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7+ 以及 Google Gemini 动态思考支持）
  - max → 提供商最大推理强度（Anthropic Claude Opus 4.7+；Ollama 将其映射到最高原生 `think` 强度）
  - ultra → 提供商最大推理强度，并在所选模型/运行时支持时主动编排子智能体
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。提供商插件会声明所选模型的确切级别集合，包括二元级别 `on` 等标签。
  - 仅对支持 `adaptive`、`xhigh`、`max` 和 `ultra` 的提供商/模型/运行时配置文件显示这些级别。为不支持的级别输入指令时，系统会拒绝该指令并列出该模型的有效选项。
  - 已存储但不受支持的级别会根据提供商配置文件的级别顺序重新映射。在非自适应模型上，`adaptive` 回退到 `medium`；`xhigh` 和 `max` 则回退到所选模型支持的最高非 `off` 级别。
  - 未显式设置思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - 除非显式设置思考级别，否则 Anthropic Claude Opus 4.8 和 Opus 4.7 会保持关闭思考。启用自适应思考后，Opus 4.8 由提供商决定的默认推理强度为 `high`。
  - Anthropic Claude Opus 4.7+ 将 `/think xhigh` 映射为自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 的推理强度设置。
  - Anthropic Claude Opus 4.7+ 也提供 `/think max`；它映射到由提供商决定的同一最大推理强度路径。
  - 直连 DeepSeek V4 模型提供 `/think xhigh|max`；两者都映射到 DeepSeek 的 `reasoning_effort: "max"`，而较低的非 `off` 级别映射到 `high`。
  - 通过 OpenRouter 路由的 DeepSeek V4 模型提供 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning.effort` 值，而不是 DeepSeek 原生的顶层 `reasoning_effort`。较低的非 `off` 级别映射到 `high`，已存储的 `max` 覆盖值则回退到 `xhigh`。
  - 支持思考的 Ollama 模型提供 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 原生 API 接受 `low`、`medium` 和 `high` 推理强度字符串。
  - OpenAI GPT 模型通过模型特定的 Responses API 推理强度支持来映射 `/think`。仅当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理载荷，而不是发送不受支持的值。
  - GPT-5.6 Sol 和 Terra 通过 Codex 运行时提供原生 `/think ultra`。GPT-5.6 Luna 提供最高至 `max` 的级别，因为其 Codex 目录未声明支持 Ultra。
  - 嵌入式 OpenClaw 运行时为 GPT-5.6 Sol、Terra 和 Luna 提供逻辑上的 `/think ultra`。它会发送提供商最大推理强度，并添加作用域限定于本次运行的主动子智能体编排指引。
  - 自定义 OpenAI 兼容目录条目可以通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来选择支持 `/think xhigh`。这会使用映射出站 OpenAI 推理强度载荷的同一兼容性元数据，因此菜单、会话验证、智能体 CLI 和 `llm-task` 会与传输行为保持一致。
  - 已配置但过时的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为这条已退役路由可能通过推理字段返回最终答案文本。
  - Google Gemini 将 `/think adaptive` 映射到 Gemini 由提供商决定的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax M2.x（`minimax/MiniMax-M2*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这样可以避免 M2.x 的非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。MiniMax-M3（以及 M3.x）不受此限制：M3 会发送正确的 Anthropic 思考块，并在禁用思考时返回空内容，因此 OpenClaw 会让 M3 继续使用提供商的省略/自适应思考路径。
  - 对大多数 GLM 模型而言，Z.AI（`zai/*`）采用二元级别（`on`/`off`）。GLM-5.2 是例外：它提供 `/think off|low|high|max`，将 `low` 和 `high` 映射到 Z.AI 的 `reasoning_effort: "high"`，并将 `max` 映射到 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）始终进行思考。其配置文件仅提供 `on`，且 OpenClaw 会按 Moonshot 的要求省略出站 `thinking` 字段。其他 `moonshot/*` 模型将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 的 `tool_choice` 只接受 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅应用于该消息）。
2. 会话覆盖值（通过发送仅含指令的消息设置）。
3. 每智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如有提供商声明的默认值，则使用该值；否则，具备推理能力的模型解析为 `medium` 或该模型支持的最接近的非 `off` 级别，不具备推理能力的模型则保持 `off`。

## 设置会话默认值

- 发送一条**仅包含**指令的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会在当前会话中持续生效（默认按发送者区分）。使用 `/think default` 清除会话覆盖值，并继承已配置的默认值或提供商默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 会存储显式的关闭覆盖值。在你更改或清除会话覆盖值之前，它会一直禁用思考。
- 系统会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），系统会拒绝该命令并给出提示，同时保持会话状态不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 智能体应用方式

- **嵌入式 OpenClaw**：解析后的级别会传递给进程内 OpenClaw 智能体运行时。
- **Claude CLI 后端**：使用 `claude-cli` 时，具体的非关闭级别会通过 `--effort` 传递给 Claude Code；`adaptive` 会移除已配置的推理强度标志，并将实际推理强度交由 Claude Code 的环境、设置和模型默认值决定。参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

## 快速模式（/fast）

- 级别：`auto|on|off|default`。
- 仅含指令的消息会切换会话快速模式覆盖值，并回复 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 清除会话覆盖值，并继承已配置的默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前实际生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅含指令的 `/fast auto|on|off` 覆盖值（`/fast default` 清除此层）
  2. 会话覆盖值
  3. 每智能体默认值（`agents.list[].fastModeDefault`）
  4. 每模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- `auto` 会将会话/配置模式保持为自动，但会为每次新的模型调用独立解析。在自动截止时间之前开始的调用会启用快速模式；之后开始的重试、回退、工具结果或继续调用会禁用快速模式。截止时间默认为 60 秒；可在当前模型上设置 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 来更改它。
- 对于 `openai/*`，快速模式通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射到 OpenAI 优先处理。
- 对于由 Codex 支持的 `openai/*` / `openai-codex/*` 模型，快速模式会在 Codex Responses 中发送相同的 `service_tier=priority` 标志。原生 Codex 应用服务器轮次仅在 `turn/start` 或线程启动/恢复时接收该层级，因此 `auto` 无法更改已经运行中的应用服务器轮次的层级；它会应用于 OpenClaw 启动的下一个模型轮次。
- 对于直连公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 且通过 OAuth 身份验证的流量，快速模式映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 同时设置时，显式 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理基础 URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。
- 启用快速模式时，`/status` 显示 `Fast`；配置模式为自动时，显示 `Fast:auto`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最低详细程度）| `full` | `off`（默认）。
- 仅含指令的消息会切换会话详细输出，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储显式的会话覆盖值；可在会话 UI 中选择 `inherit` 来清除它。
- 已获授权的外部渠道发送者可以持久化会话详细输出覆盖值。内部 Gateway 网关/Webchat 客户端需要 `operator.admin` 才能持久化该值。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 启用详细输出后，会生成结构化工具结果的智能体会将每次工具调用作为单独的仅元数据消息发回；如有可用信息，其前缀为 `<emoji> <tool-name>: <arg>`。这些工具摘要会在每个工具启动后立即发送（单独的消息气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但除非详细级别为 `full`，否则会隐藏原始错误详情后缀。
- 当详细级别为 `full` 时，工具输出也会在完成后转发（单独的消息气泡，并截断至安全长度）。如果你在某次运行进行期间切换 `/verbose on|full|off`，后续工具消息气泡会遵循新设置。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和进度草稿工具行的形式。使用 `"explain"`（默认）可显示紧凑的易读标签，例如 `🛠️ Exec: checking JS syntax`；如果还希望附加原始命令/详情以便调试，请使用 `"raw"`。每智能体的 `agents.list[].toolProgressDetail` 会覆盖默认值。
  - `explain`：`🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`：`🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 插件跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 的范围比 `/verbose` 更窄：它只显示由插件生成的跟踪/调试行，例如主动记忆调试摘要。
- 跟踪行可以显示在 `/status` 中，也可以在正常智能体回复后作为后续诊断消息显示。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息用于切换回复中是否显示思考块。
- 启用后，推理将作为一条以 `Thinking` 为前缀的**独立消息**发送。
- `stream`：当活跃渠道支持推理预览时，在生成回复期间流式传输推理，随后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖值，再是按智能体设置的默认值（`agents.list[].reasoningDefault`），然后是全局默认值（`agents.defaults.reasoningDefault`），最后是回退值（`off`）。

OpenClaw 会保守处理格式错误的本地模型推理标签。在普通回复中，闭合的 `<think>...</think>` 块会保持隐藏；已显示文本之后未闭合的推理内容也会隐藏。如果回复完全包裹在单个未闭合的起始标签中，并且原本会以空文本形式发送，OpenClaw 会移除格式错误的起始标签并发送剩余文本。

## 相关内容

- 提升权限模式文档位于[提升权限模式](/zh-CN/tools/elevated)。

## Heartbeat

- Heartbeat 探测正文是配置的 Heartbeat 提示词（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令照常生效（但应避免通过 Heartbeat 更改会话默认值）。
- Heartbeat 默认仅发送最终负载。若还要发送独立的 `Thinking` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true`，或按智能体设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天界面

- 页面加载时，Web 聊天的思考选择器会从入站会话存储或配置中同步该会话已保存的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖值；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖值。
- 如果在模型、推理或速度选择器的更改仍在应用时发送消息，系统会等待所有待处理的选择器补丁完成；如果更改失败，消息会保持未发送状态，以便检查。
- 第一个选项始终用于清除覆盖值。它显示 `Inherited: <resolved level>`；当继承的思考功能已禁用时，则显示 `Inherited: Off`。
- 显式选择器选项使用其直接级别标签，同时保留已有的提供商标签（例如，提供商为 `max` 选项标注的 `Maximum`）。
- 选择器使用 Gateway 网关会话行或默认值返回的 `thinkingLevels`，并保留 `thinkingOptions` 作为旧版标签列表。浏览器界面不会维护自己的提供商正则表达式列表；插件负责管理模型专属的级别集合。
- `/think:<level>` 仍然有效，并会更新同一个已保存的会话级别，因此聊天指令与选择器会保持同步。

## 提供商配置文件

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，以定义模型支持的级别和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以使直接 Anthropic 目录与代理目录保持一致。
- 每个配置文件级别都有一个存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、`max` 或 `ultra`），并且可以包含用于显示的 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 配置文件钩子会在可用时接收合并后的目录信息，其中包括 `reasoning`、`compat.thinkingFormat` 和 `compat.supportedReasoningEfforts`。仅当配置的请求契约支持相应负载时，才使用这些信息公开二元或自定义配置文件。
- 需要验证显式思考覆盖值的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` 和 `api.runtime.agent.normalizeThinkingLevel(...)`；不应自行维护提供商或模型级别列表。当工具负责执行路径时（例如始终采用嵌入式运行），请传入 `agentRuntime`。
- 能够访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，从而在插件侧验证中反映 `compat.supportedReasoningEfforts` 的选择性启用。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）会继续作为兼容适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行或默认值会公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，使 ACP 或聊天客户端呈现与运行时验证所用内容相同的配置文件 ID 和标签。

---
read_when:
    - 调整思考、快速模式或详细输出指令的解析或默认值
summary: /think、/fast、/verbose、/trace 和推理可见性的指令语法
title: 思考级别
x-i18n:
    generated_at: "2026-07-12T14:49:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## 功能说明

- 任何入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max | ultra`，大致对应 Anthropic 经典的魔法词阶梯："think" < "think hard" < "think harder" < "ultrathink"：
  - minimal ~ "think"
  - low ~ "think hard"
  - medium ~ "think harder"
  - high ~ "ultrathink"（最大预算）
  - xhigh ~ "ultrathink+"（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7+ 工作量）
  - adaptive → 由提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7+ 和 Google Gemini 动态思考支持）
  - max → 提供商最大推理强度（Anthropic Claude Opus 4.7+；Ollama 将其映射到最高原生 `think` 强度）
  - ultra → 提供商最大推理强度，并在所选模型/运行时支持时主动编排子智能体
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。提供商插件会为所选模型声明确切的级别集合，包括二元 `on` 等标签。
  - 仅对支持 `adaptive`、`xhigh`、`max` 和 `ultra` 的提供商/模型/运行时配置文件显示这些级别。为不受支持的级别输入指令时，系统会拒绝该指令并列出该模型的有效选项。
  - 已存储但不受支持的现有级别会按照提供商配置文件中的等级重新映射。在非自适应模型上，`adaptive` 回退到 `medium`；`xhigh` 和 `max` 则回退到所选模型支持的最高非关闭级别。
  - 未显式设置思考级别时，Anthropic Claude 4.6 模型默认为 `adaptive`。
  - 除非显式设置思考级别，否则 Anthropic Claude Opus 4.8 和 Opus 4.7 会保持关闭思考。启用自适应思考后，Opus 4.8 由提供商管理的默认工作量为 `high`。
  - Anthropic Claude Opus 4.7+ 将 `/think xhigh` 映射为自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 工作量设置。
  - Anthropic Claude Opus 4.7+ 还提供 `/think max`；它映射到相同的由提供商管理的最大工作量路径。
  - 直连 DeepSeek V4 模型提供 `/think xhigh|max`；两者都映射到 DeepSeek `reasoning_effort: "max"`，较低的非关闭级别则映射到 `high`。
  - 通过 OpenRouter 路由的 DeepSeek V4 模型提供 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning.effort` 值，而不是 DeepSeek 原生的顶层 `reasoning_effort`。较低的非关闭级别映射到 `high`，已存储的 `max` 覆盖值回退到 `xhigh`。
  - 支持思考的 Ollama 模型提供 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` 工作量字符串。
  - OpenAI GPT 模型根据特定模型的 Responses API 工作量支持来映射 `/think`。仅当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理负载，而不会发送不受支持的值。
  - GPT-5.6 Sol 和 Terra 通过 Codex 运行时提供原生 `/think ultra`。GPT-5.6 Luna 提供到 `max` 为止的级别，因为其 Codex 目录未声明 Ultra。
  - 嵌入式 OpenClaw 运行时为 GPT-5.6 Sol、Terra 和 Luna 提供逻辑 `/think ultra`。它会发送提供商最大工作量，并添加仅限本次运行的主动子智能体编排指导。
  - 自定义 OpenAI 兼容目录条目可通过将 `"xhigh"` 添加到 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 来启用 `/think xhigh`。这会使用映射出站 OpenAI 推理工作量负载的同一兼容性元数据，因此菜单、会话验证、智能体 CLI 和 `llm-task` 会与传输行为保持一致。
  - 过时的已配置 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为该已退役路由可能通过推理字段返回最终答案文本。
  - Google Gemini 将 `/think adaptive` 映射到 Gemini 由提供商管理的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到最接近的 Gemini `thinkingLevel`，或该模型系列对应的预算。
  - Anthropic 兼容流式路径上的 MiniMax M2.x（`minimax/MiniMax-M2*`）默认为 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这可避免 M2.x 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。MiniMax-M3（以及 M3.x）不受此限制：M3 会发出正确的 Anthropic 思考块，并在禁用思考时返回空内容，因此 OpenClaw 让 M3 继续使用提供商的省略/自适应思考路径。
  - 对大多数 GLM 模型而言，Z.AI（`zai/*`）采用二元模式（`on`/`off`）。GLM-5.2 是例外：它提供 `/think off|low|high|max`，将 `low` 和 `high` 映射到 Z.AI `reasoning_effort: "high"`，并将 `max` 映射到 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）始终进行思考。其配置文件仅提供 `on`，并且 OpenClaw 会按照 Moonshot 的要求省略出站 `thinking` 字段。其他 `moonshot/*` 模型将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 的 `tool_choice` 仅接受 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅适用于该消息）。
2. 会话覆盖（通过发送仅含指令的消息来设置）。
3. 每智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如果提供商声明了默认值，则使用该值；否则，支持推理的模型会解析为 `medium` 或该模型最接近的、受支持且非 `off` 的级别，不支持推理的模型则保持为 `off`。

## 设置会话默认值

- 发送一条**仅**包含指令的消息（允许包含空白字符），例如 `/think:medium` 或 `/t high`。
- 此设置会在当前会话中持续生效（默认按发送者区分）。使用 `/think default` 清除会话覆盖，并继承已配置的默认值或提供商默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 会存储显式的关闭覆盖。它会禁用思考，直到你更改或清除会话覆盖。
- 系统会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，且会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 智能体的应用方式

- **嵌入式 OpenClaw**：解析后的级别会传递给进程内的 OpenClaw 智能体运行时。
- **Claude CLI 后端**：使用 `claude-cli` 时，具体的非关闭级别会作为 `--effort` 传递给 Claude Code；`adaptive` 会移除已配置的 effort 标志，并将实际 effort 委托给 Claude Code 的环境、设置和模型默认值。请参阅 [CLI 后端](/zh-CN/gateway/cli-backends)。

## 快速模式 (/fast)

- 级别：`auto|on|off|default`。
- 仅含指令的消息会切换会话的快速模式覆盖设置，并回复 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 可清除会话覆盖设置并继承已配置的默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前实际生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅含指令的 `/fast auto|on|off` 覆盖设置（`/fast default` 会清除此层）
  2. 会话覆盖设置
  3. 按智能体设置的默认值（`agents.list[].fastModeDefault`）
  4. 按模型设置的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退值：`off`
- `auto` 会将会话/配置模式保持为 auto，但会为每个新的模型调用单独解析。自动截止时间之前开始的调用会启用快速模式；之后开始的重试、回退、工具结果或续接调用会禁用快速模式。截止时间默认为 60 秒；在当前模型上设置 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 可更改此值。
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射到 OpenAI 优先处理。
- 对于由 Codex 支持的 `openai/*` / `openai-codex/*` 模型，快速模式会在 Codex Responses 中发送相同的 `service_tier=priority` 标志。原生 Codex app-server 轮次仅在 `turn/start` 或线程启动/恢复时接收该层级，因此 `auto` 无法为已在运行的 app-server 轮次重新设置层级；它会应用于 OpenClaw 启动的下一个模型轮次。
- 对于直接发往公共 `anthropic/*` 的请求，包括发送至 `api.anthropic.com` 且通过 OAuth 身份验证的流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于通过 Anthropic 兼容路径使用的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 同时设置时，显式的 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理基础 URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。
- 启用快速模式时，`/status` 会显示 `Fast`；配置模式为 auto 时，则显示 `Fast:auto`。

## 详细指令 (/verbose 或 /v)

- 级别：`on`（最少）| `full` | `off`（默认）。
- 仅含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会更改状态。
- `/verbose off` 会存储显式的会话覆盖设置；可在会话 UI 中选择 `inherit` 将其清除。
- 已获授权的外部渠道发送者可以持久保存会话详细模式覆盖设置。内部 Gateway 网关/WebChat 客户端需要 `operator.admin` 才能持久保存该设置。
- 内联指令仅影响该消息；其他情况下应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 启用详细模式时，对于会生成结构化工具结果的智能体，每次工具调用都会作为独立的纯元数据消息发送回来；在信息可用时，以 `<emoji> <tool-name>: <arg>` 为前缀。这些工具摘要会在每个工具启动后立即发送（独立气泡），而不是作为流式增量发送。
- 工具失败摘要在正常模式下仍然可见，但除非详细模式为 `full`，否则会隐藏原始错误详情后缀。
- 当详细模式为 `full` 时，工具输出也会在完成后转发（独立气泡，并截断至安全长度）。如果你在运行过程中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和进度草稿工具行的形式。使用 `"explain"`（默认）可显示简洁易懂的标签，例如 `🛠️ Exec: checking JS syntax`；如果还希望附加原始命令/详情以便调试，请使用 `"raw"`。按智能体设置的 `agents.list[].toolProgressDetail` 会覆盖默认值。
  - `explain`：`🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`：`🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 插件跟踪指令 (/trace)

- 级别：`on` | `off`（默认）。
- 仅含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；其他情况下应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 的范围比 `/verbose` 更窄：它仅显示由插件生成的跟踪/调试行，例如主动记忆调试摘要。
- 跟踪行可能显示在 `/status` 中，也可能在正常的助手回复后作为后续诊断消息显示。

## 推理可见性 (/reasoning)

- 级别：`on|off|stream`。
- 仅包含指令的消息用于切换是否在回复中显示思考块。
- 启用后，推理内容会作为一条以 `Thinking` 为前缀的**单独消息**发送。
- `stream`：当活跃渠道支持推理预览时，在生成回复期间流式传输推理内容，然后发送不含推理内容的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖值、各智能体默认值（`agents.list[].reasoningDefault`）、全局默认值（`agents.defaults.reasoningDefault`），最后是回退值（`off`）。

对于格式错误的本地模型推理标签，系统会采取保守处理。正常回复中的闭合 `<think>...</think>` 块会保持隐藏，已显示文本之后未闭合的推理内容也会被隐藏。如果回复完全包含在单个未闭合的起始标签中，并且原本会以空文本形式发送，OpenClaw 会移除格式错误的起始标签并发送剩余文本。

## 相关内容

- 提升权限模式的文档请参阅[提升权限模式](/zh-CN/tools/elevated)。

## Heartbeat

- Heartbeat 探测正文是已配置的 Heartbeat 提示词（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令照常生效（但应避免通过 Heartbeat 更改会话默认值）。
- Heartbeat 默认仅交付最终载荷。若还要发送单独的 `Thinking` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true`，或为每个智能体设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天界面

- 页面加载时，Web 聊天的思考级别选择器会从入站会话存储/配置中读取并显示该会话已存储的级别。
- 选择其他级别后，会立即通过 `sessions.patch` 写入会话覆盖值；它不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖值。
- 如果在模型、推理或速度选择器的更改仍在应用时发送消息，系统会等待所有待处理的选择器补丁完成；如果有更改失败，消息将保持未发送状态，以供检查。
- 第一个选项始终是清除覆盖值。它显示为 `Inherited: <resolved level>`；当继承的思考功能已禁用时，则显示 `Inherited: Off`。
- 显式选择器选项直接使用其级别标签，同时保留已有的提供商标签（例如，提供商为 `max` 选项标注的 `Maximum`）。
- 选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器界面不维护自己的提供商正则表达式列表；插件负责定义特定模型的级别集合。
- `/think:<level>` 仍然有效，并会更新同一个已存储的会话级别，因此聊天指令与选择器会保持同步。

## 提供商配置文件

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，以定义模型支持的级别和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以确保直接 Anthropic 目录和代理目录保持一致。
- 每个配置文件级别都有一个用于存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive`、`max` 或 `ultra`），并且可以包含用于显示的 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 如果合并后的目录事实可用，配置文件钩子会接收这些事实，包括 `reasoning`、`compat.thinkingFormat` 和 `compat.supportedReasoningEfforts`。仅当已配置的请求契约支持相应载荷时，才使用这些事实公开二元或自定义配置文件。
- 需要验证显式思考覆盖值的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` 和 `api.runtime.agent.normalizeThinkingLevel(...)`；不应自行维护提供商/模型级别列表。当工具拥有执行路径时（例如始终使用嵌入式运行），请传入 `agentRuntime`。
- 能访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，以便插件侧验证能够反映 `compat.supportedReasoningEfforts` 的显式启用设置。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值会公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端呈现与运行时验证所用配置文件相同的 ID 和标签。

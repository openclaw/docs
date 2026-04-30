---
read_when:
    - 调整 thinking、fast-mode 或 verbose 指令解析或默认值
summary: /think、/fast、/verbose、/trace 的指令语法和推理可见性
title: 思考级别
x-i18n:
    generated_at: "2026-04-30T15:38:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## 它的作用

- 任意入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应思考（支持 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 动态思考）
  - max → 提供商最大推理（Anthropic Claude Opus 4.7；Ollama 会将其映射到自己的最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。提供商插件会声明所选模型的精确级别集合，包括二进制 `on` 等标签。
  - `adaptive`、`xhigh` 和 `max` 只会为支持它们的提供商/模型配置文件展示。为不支持的级别输入的指令会被拒绝，并返回该模型的有效选项。
  - 已存储的过期不支持级别会按提供商配置文件的等级重新映射。在非自适应模型上，`adaptive` 会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - Anthropic Claude 4.6 模型在未设置显式思考级别时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用自适应思考。除非你显式设置思考级别，否则其 API effort 默认值仍由提供商拥有。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射到自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也暴露 `/think max`；它会映射到同一个提供商拥有的最大 effort 路径。
  - DeepSeek V4 模型暴露 `/think xhigh|max`；两者都会映射到 DeepSeek `reasoning_effort: "max"`，而较低的非 `off` 级别会映射到 `high`。
  - 支持思考的 Ollama 模型暴露 `/think low|medium|high|max`；`max` 会映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型会通过特定模型的 Responses API effort 支持来映射 `/think`。只有目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理载荷，而不是发送不支持的值。
  - 自定义 OpenAI 兼容目录条目可以通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设为包含 `"xhigh"` 来选择启用 `/think xhigh`。这会使用同一套兼容元数据来映射出站 OpenAI 推理 effort 载荷，因此菜单、会话校验、智能体 CLI 和 `llm-task` 会与传输行为保持一致。
  - 过期配置的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为那条已废弃路由可能通过推理字段返回最终答案文本。
  - Google Gemini 会将 `/think adaptive` 映射到 Gemini 由提供商拥有的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型家族最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这可以避免 MiniMax 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支持二进制思考（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅应用于该消息）。
2. 会话覆盖（通过发送仅含指令的消息设置）。
3. 每个智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：可用时使用提供商声明的默认值；否则，具备推理能力的模型会解析为 `medium` 或该模型支持的最接近的非 `off` 级别，不具备推理能力的模型保持 `off`。

## 设置会话默认值

- 发送一条**只包含**该指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 这会固定到当前会话（默认按发送者区分）；通过 `/think:off` 或会话空闲重置清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并附带提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前有效快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅含指令的 `/fast on|off`
  2. 会话覆盖
  3. 每个智能体默认值（`agents.list[].fastModeDefault`）
  4. 每个模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在支持的 Responses 请求上发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送同一个 `service_tier=priority` 标志。OpenClaw 在两个凭证路径之间保持一个共享的 `/fast` 开关。
- 对于直接公开的 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic service tiers：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当显式 Anthropic `serviceTier` / `service_tier` 模型参数与快速模式默认值同时设置时，前者会覆盖后者。OpenClaw 仍会对非 Anthropic 代理基础 URL 跳过 Anthropic service-tier 注入。
- `/status` 只有在快速模式启用时才显示 `Fast`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅含指令的消息会切换会话详细日志并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不改变状态。
- `/verbose off` 会存储显式会话覆盖；可在会话 UI 中选择 `inherit` 来清除。
- 内联指令只影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 启用详细模式时，会发出结构化工具结果的智能体（Pi 和其他 JSON 智能体）会把每次工具调用作为单独的仅元数据消息发回，可用时前缀为 `<emoji> <tool-name>: <arg>`（路径/命令）。这些工具摘要会在每个工具启动后立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍可见，但原始错误详情后缀会隐藏，除非详细级别为 `on` 或 `full`。
- 当详细级别为 `full` 时，工具输出也会在完成后转发（单独气泡，截断到安全长度）。如果你在一次运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。

## 插件跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅含指令的消息会切换会话插件跟踪输出并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令只影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只暴露插件拥有的跟踪/调试行，例如 Active Memory 调试摘要。
- 跟踪行可以出现在 `/status` 中，也可以在普通助手回复之后作为后续诊断消息出现。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为**单独消息**发送，并以 `Reasoning:` 为前缀。
- `stream`（仅 Telegram）：在回复生成期间将推理流式传输到 Telegram 草稿气泡中，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每个智能体默认值（`agents.list[].reasoningDefault`），最后回退（`off`）。

格式错误的本地模型推理标签会被保守处理。已闭合的 <think>...</think> 块在普通回复中保持隐藏，已可见文本之后未闭合的推理也会隐藏。如果回复完全包裹在单个未闭合起始标签中，并且原本会作为空文本交付，OpenClaw 会移除格式错误的起始标签并交付剩余文本。

## 相关

- 提权模式文档位于 [提权模式](/zh-CN/tools/elevated)。

## Heartbeat

- Heartbeat 探测正文是配置的 Heartbeat 提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令会照常应用（但应避免从 Heartbeat 更改会话默认值）。
- Heartbeat 交付默认只发送最终载荷。如需同时发送单独的 `Reasoning:` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- 页面加载时，Web 聊天思考选择器会从入站会话存储/配置镜像该会话已存储的级别。
- 选择另一个级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活跃会话模型的提供商思考配置文件，以及 `/status` 和 `session_status` 使用的同一套回退逻辑。
- 选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不保留自己的提供商正则列表；插件拥有特定模型的级别集合。
- `/think:<level>` 仍然有效，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## 提供商配置文件

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，用于定义模型支持的级别和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以便直接 Anthropic 和代理目录保持一致。
- 每个配置级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示用的 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 需要验证显式思考覆盖设置的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应维护自己的提供商/模型级别列表。
- 能访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，这样 `compat.supportedReasoningEfforts` 选择启用项会体现在插件侧验证中。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）会继续作为兼容性适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值会公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/chat 客户端渲染与运行时验证所用相同的配置 `id` 和标签。

---
read_when:
    - 调整 thinking、fast-mode 或 verbose 指令的解析或默认值
summary: 用于 /think、/fast、/verbose、/trace 的指令语法和推理可见性
title: 思考级别
x-i18n:
    generated_at: "2026-04-29T10:39:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## 作用

- 任意入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应思考（支持 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 动态思考）
  - max → 提供商最大推理（Anthropic Claude Opus 4.7；Ollama 会将其映射到最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置档案驱动。提供商插件会为所选模型声明准确的级别集合，包括二元 `on` 等标签。
  - `adaptive`、`xhigh` 和 `max` 只会为支持它们的提供商/模型配置档案展示。针对不支持级别的类型化指令会被拒绝，并返回该模型的有效选项。
  - 已存储的现有不支持级别会按提供商配置档案排名重新映射。`adaptive` 在非自适应模型上回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 off 级别。
  - Anthropic Claude 4.6 模型在未显式设置思考级别时默认为 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用自适应思考。除非你显式设置思考级别，否则它的 API effort 默认值仍由提供商拥有。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射到自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也暴露 `/think max`；它映射到同一个提供商拥有的最大 effort 路径。
  - 支持思考的 Ollama 模型会暴露 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型会通过模型特定的 Responses API effort 支持来映射 `/think`。只有当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理载荷，而不是发送不支持的值。
  - 自定义 OpenAI 兼容目录条目可以通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来选择加入 `/think xhigh`。这会使用与出站 OpenAI 推理 effort 载荷映射相同的兼容元数据，因此菜单、会话验证、智能体 CLI 和 `llm-task` 会与传输行为保持一致。
  - 陈旧配置的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为那条已退役路由可能会通过推理字段返回最终答案文本。
  - Google Gemini 会将 `/think adaptive` 映射到 Gemini 的提供商拥有的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式传输路径上的 MiniMax（`minimax/*`）默认为 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这可避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支持二元思考（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅应用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每个智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：可用时使用提供商声明的默认值；否则，具备推理能力的模型会解析为 `medium`，或该模型最接近的受支持非 `off` 级别；非推理模型保持 `off`。

## 设置会话默认值

- 发送一条**只包含**指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 这会在当前会话中保持生效（默认按发送者区分）；通过 `/think:off` 或会话空闲重置清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前有效快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖
  3. 每个智能体默认值（`agents.list[].fastModeDefault`）
  4. 每个模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求上发送 `service_tier=priority` 来映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 会在两个认证路径之间保持一个共享的 `/fast` 开关。
- 对于直接公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当两者都设置时，显式 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。OpenClaw 仍会对非 Anthropic 代理基础 URL 跳过 Anthropic 服务层级注入。
- `/status` 仅在启用快速模式时显示 `Fast`。

## 详细日志指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细日志，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储显式会话覆盖；可在 Sessions UI 中选择 `inherit` 来清除它。
- 内联指令只影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细日志级别。
- 启用详细日志时，会发出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每个工具调用作为自己的仅元数据消息发回，可用时前缀为 `<emoji> <tool-name>: <arg>`（路径/命令）。这些工具摘要会在每个工具启动时立即发送（独立气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍可见，但原始错误详情后缀会隐藏，除非详细日志为 `on` 或 `full`。
- 当详细日志为 `full` 时，工具输出也会在完成后转发（独立气泡，截断到安全长度）。如果你在运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。

## 插件跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令只影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只暴露插件拥有的跟踪/调试行，例如 Active Memory 调试摘要。
- 跟踪行可能出现在 `/status` 中，也可能在正常助手回复之后作为后续诊断消息出现。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为**单独消息**发送，前缀为 `Reasoning:`。
- `stream`（仅 Telegram）：在回复生成时将推理流式传输到 Telegram 草稿气泡中，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每个智能体默认值（`agents.list[].reasoningDefault`），然后是回退（`off`）。

格式错误的本地模型推理标签会被保守处理。闭合的 `<think>...</think>` 块在正常回复中保持隐藏，已可见文本之后未闭合的推理也会隐藏。如果回复完全由单个未闭合开标签包裹，且否则会作为空文本投递，OpenClaw 会移除格式错误的开标签并投递剩余文本。

## 相关

- 提权模式文档位于 [提权模式](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文是配置的心跳提示（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会照常应用（但请避免从心跳中更改会话默认值）。
- 心跳投递默认只发送最终载荷。若还要发送单独的 `Reasoning:` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- 页面加载时，Web 聊天思考选择器会从入站会话存储/配置中镜像会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活动会话模型的提供商思考配置档案，以及 `/status` 和 `session_status` 使用的相同回退逻辑。
- 选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不保留自己的提供商正则列表；插件拥有模型特定的级别集合。
- `/think:<level>` 仍然有效，并会更新同一个已存储会话级别，因此聊天指令和选择器会保持同步。

## 提供商配置档案

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，用于定义该模型支持的等级和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以便直接 Anthropic 和代理目录保持一致。
- 每个配置等级都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含显示用的 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 需要验证显式思考覆盖值的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应保留自己的提供商/模型等级列表。
- 能访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，这样 `compat.supportedReasoningEfforts` 的选择加入会反映在插件侧验证中。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容适配器保留，但新的自定义等级集合应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，因此 ACP/chat 客户端会渲染与运行时验证所用相同的配置 id 和标签。

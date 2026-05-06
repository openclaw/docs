---
read_when:
    - 调整 thinking、fast-mode 或 verbose 指令的解析或默认值
summary: /think、/fast、/verbose、/trace 的指令语法和推理可见性
title: 思考级别
x-i18n:
    generated_at: "2026-05-06T04:11:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## 功能说明

- 任意入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由 provider 管理的自适应思考（支持 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 动态思考）
  - max → provider 最大推理（Anthropic Claude Opus 4.7；Ollama 会将其映射到自身最高的原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- Provider 说明：
  - 思考菜单和选择器由 provider 配置文件驱动。Provider 插件会为所选模型声明确切的级别集合，包括二元 `on` 等标签。
  - `adaptive`、`xhigh` 和 `max` 只会对支持它们的 provider/模型配置文件展示。对不支持级别的类型化指令会被拒绝，并提示该模型的有效选项。
  - 已存储的不受支持级别会按 provider 配置文件排序重新映射。`adaptive` 在非自适应模型上回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - Anthropic Claude 4.6 模型在未设置显式思考级别时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用自适应思考。除非你显式设置思考级别，否则其 API effort 默认值仍由 provider 拥有。
  - Anthropic Claude Opus 4.7 将 `/think xhigh` 映射到自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也暴露 `/think max`；它映射到同一个 provider 拥有的最大 effort 路径。
  - 直连 DeepSeek V4 模型暴露 `/think xhigh|max`；两者都会映射到 DeepSeek `reasoning_effort: "max"`，而较低的非 `off` 级别会映射到 `high`。
  - 通过 OpenRouter 路由的 DeepSeek V4 模型暴露 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning_effort` 值。已存储的 `max` 覆盖会回退到 `xhigh`。
  - 支持思考的 Ollama 模型暴露 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型会通过特定模型的 Responses API effort 支持来映射 `/think`。只有目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用的 reasoning 载荷，而不是发送不受支持的值。
  - 自定义 OpenAI 兼容目录条目可以通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来选择支持 `/think xhigh`。这使用与出站 OpenAI reasoning effort 载荷映射相同的兼容元数据，因此菜单、会话验证、agent CLI 和 `llm-task` 会与传输行为一致。
  - 过期配置的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为该已退役路由可能通过 reasoning 字段返回最终答案文本。
  - Google Gemini 将 `/think adaptive` 映射到 Gemini 的 provider 拥有的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这会避免 MiniMax 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元思考（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅应用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每个 agent 的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：有可用的 provider 声明默认值时使用它；否则支持推理的模型解析为 `medium` 或该模型最接近的受支持非 `off` 级别，不支持推理的模型保持 `off`。

## 设置会话默认值

- 发送一条**仅**包含指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 这会对当前会话生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按 agent 应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi agent 运行时。
- **Claude CLI 后端**：使用 `claude-cli` 时，非 off 级别会作为 `--effort` 传递给 Claude Code；参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖
  3. 每个 agent 的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求中发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 在两条认证路径之间保留一个共享的 `/fast` 切换。
- 对于直连公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当两者都设置时，显式 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理基础 URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。
- `/status` 仅在快速模式启用时显示 `Fast`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不改变状态。
- `/verbose off` 会存储显式会话覆盖；可在会话 UI 中选择 `inherit` 来清除。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 启用 verbose 时，会发出结构化工具结果的 agent（Pi、其他 JSON agent）会将每次工具调用作为自己的仅元数据消息发回，在可用时前缀为 `<emoji> <tool-name>: <arg>`。这些工具摘要会在每个工具启动后立即发送（独立气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍可见，但原始错误详情后缀会隐藏，除非 verbose 为 `on` 或 `full`。
- verbose 为 `full` 时，工具输出也会在完成后转发（独立气泡，截断到安全长度）。如果你在运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和进度草稿工具行的形态。使用 `"explain"`（默认）可获得紧凑的人类可读标签，例如 `🛠️ Exec: checking JS syntax`；如果还想附加原始命令/详情以便调试，请使用 `"raw"`。每个 agent 的 `agents.list[].toolProgressDetail` 会覆盖默认值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 插件跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只暴露插件拥有的跟踪/调试行，例如主动记忆调试摘要。
- 跟踪行可能出现在 `/status` 中，也可能在正常 assistant 回复后作为后续诊断消息出现。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示思考块。
- 启用后，reasoning 会作为**单独消息**发送，前缀为 `Reasoning:`。
- `stream`（仅 Telegram）：在回复生成期间将 reasoning 流式传输到 Telegram 草稿气泡中，然后发送不含 reasoning 的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前 reasoning 级别。
- 解析顺序：内联指令，然后会话覆盖，然后每个 agent 的默认值（`agents.list[].reasoningDefault`），然后回退（`off`）。

格式异常的本地模型 reasoning 标签会被保守处理。闭合的 `<think>...</think>` 块在正常回复中保持隐藏，已经可见文本后的未闭合 reasoning 也会隐藏。如果回复完全包裹在单个未闭合开始标签中，且原本会作为空文本交付，OpenClaw 会移除格式异常的开始标签并交付剩余文本。

## 相关

- 提权模式文档位于 [提权模式](/zh-CN/tools/elevated)。

## Heartbeats

- Heartbeat 探测正文是配置的 heartbeat 提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令会照常应用（但应避免从 heartbeat 更改会话默认值）。
- Heartbeat 交付默认只发送最终载荷。若还要发送单独的 `Reasoning:` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个 agent 的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- 页面加载时，Web 聊天思考选择器会从入站会话存储/配置镜像会话已存储的级别。
- 选择另一个级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活跃会话模型的 provider 思考配置文件，以及 `/status` 和 `session_status` 使用的相同回退逻辑。
- 选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，并保留 `thinkingOptions` 作为旧版标签列表。浏览器 UI 不保留自己的 provider 正则列表；插件拥有特定模型的级别集合。
- `/think:<level>` 仍然有效，并会更新同一个已存储会话级别，因此聊天指令和选择器会保持同步。

## Provider 配置文件

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，用于定义该模型支持的级别和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以便直连 Anthropic 和代理目录保持一致。
- 每个配置档案级别都有一个存储用规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含显示用 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 需要验证显式思考覆盖值的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应维护自己的提供商/模型级别列表。
- 可以访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，以便 `compat.supportedReasoningEfforts` 的选择加入能反映在插件侧验证中。
- 已发布的旧钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）会继续作为兼容性适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值会公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端呈现与运行时验证所使用的相同配置档案 id 和标签。

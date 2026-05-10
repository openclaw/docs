---
read_when:
    - 调整 thinking、fast-mode 或 verbose 指令解析或默认值
summary: 用于 /think、/fast、/verbose、/trace 以及推理可见性的指令语法
title: 思考级别
x-i18n:
    generated_at: "2026-05-10T19:52:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## 它的作用

- 任意入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深度思考”
  - medium → “更深度思考”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 提供商管理的自适应思考（支持 Claude 4.6 on Anthropic/Bedrock、Anthropic Claude Opus 4.7，以及 Google Gemini 动态思考）
  - max → 提供商最大推理（Anthropic Claude Opus 4.7；Ollama 会将其映射到最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。提供商插件会声明所选模型的确切级别集合，包括二元 `on` 等标签。
  - `adaptive`、`xhigh` 和 `max` 仅会为支持它们的提供商/模型配置文件展示。对于不支持的级别，类型化指令会被拒绝，并返回该模型的有效选项。
  - 已存储的不受支持级别会按提供商配置文件排名重新映射。在非自适应模型上，`adaptive` 回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - Anthropic Claude 4.6 模型在未设置显式思考级别时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用自适应思考。除非你显式设置思考级别，否则其 API effort 默认值仍由提供商拥有。
  - Anthropic Claude Opus 4.7 将 `/think xhigh` 映射到自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也公开 `/think max`；它会映射到相同的提供商拥有的最大 effort 路径。
  - 直连 DeepSeek V4 模型公开 `/think xhigh|max`；二者都映射到 DeepSeek `reasoning_effort: "max"`，而较低的非 `off` 级别映射到 `high`。
  - 经 OpenRouter 路由的 DeepSeek V4 模型公开 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning_effort` 值。已存储的 `max` 覆盖值会回退到 `xhigh`。
  - 支持思考的 Ollama 模型公开 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型会通过特定模型的 Responses API effort 支持来映射 `/think`。只有目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的 payload，而不是发送不受支持的值。
  - 自定义 OpenAI 兼容目录条目可以通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来选择加入 `/think xhigh`。这会使用同一套映射出站 OpenAI reasoning effort payload 的 compat 元数据，因此菜单、会话验证、智能体 CLI 和 `llm-task` 会与传输行为保持一致。
  - 过期的已配置 OpenRouter Hunter Alpha refs 会跳过代理推理注入，因为这个已退役路由可能会通过推理字段返回最终答案文本。
  - Google Gemini 将 `/think adaptive` 映射到 Gemini 的提供商拥有的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这样可以避免 MiniMax 非原生 Anthropic 流格式泄漏 `reasoning_content` delta。
  - Z.AI（`zai/*`）仅支持二元思考（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 仅接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅应用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：可用时使用提供商声明的默认值；否则，支持推理的模型解析为 `medium` 或该模型最接近的受支持非 `off` 级别，不支持推理的模型保持 `off`。

## 设置会话默认值

- 发送一条**仅**包含该指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 该设置会固定到当前会话（默认按发送者区分）。使用 `/think default` 清除会话覆盖并继承已配置/提供商默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 会存储显式 off 覆盖。它会禁用思考，直到你更改或清除会话覆盖。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，且会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。
- **Claude CLI 后端**：使用 `claude-cli` 时，非 off 级别会作为 `--effort` 传递给 Claude Code；请参阅 [CLI 后端](/zh-CN/gateway/cli-backends)。

## 快速模式（/fast）

- 级别：`on|off|default`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。使用 `/fast default` 清除会话覆盖并继承已配置默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前有效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off` 覆盖（`/fast default` 清除此层）
  2. 会话覆盖
  3. 每智能体默认值（`agents.list[].fastModeDefault`）
  4. 每模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会在受支持的 Responses 请求中发送 `service_tier=priority`，映射到 OpenAI 优先级处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 会在两个认证路径之间保留一个共享的 `/fast` 开关。
- 对于直连公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 同时设置时，显式 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic 服务层级注入。
- `/status` 仅在启用快速模式时显示 `Fast`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储显式会话覆盖；可在会话 UI 中选择 `inherit` 来清除它。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 启用详细模式时，发出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为独立的仅元数据消息发回，可用时前缀为 `<emoji> <tool-name>: <arg>`。这些工具摘要会在每个工具启动时立即发送（独立气泡），而不是作为流式 delta 发送。
- 工具失败摘要在普通模式下仍可见，但原始错误详情后缀会被隐藏，除非详细模式为 `on` 或 `full`。
- 当详细模式为 `full` 时，工具输出也会在完成后转发（独立气泡，截断到安全长度）。如果你在运行过程中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和进度草稿工具行的形态。使用 `"explain"`（默认）获取紧凑的人类标签，例如 `🛠️ Exec: checking JS syntax`；调试时若也需要追加原始命令/详情，请使用 `"raw"`。每智能体 `agents.list[].toolProgressDetail` 会覆盖默认值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 插件跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只公开插件拥有的跟踪/调试行，例如 Active Memory 调试摘要。
- 跟踪行可以出现在 `/status` 中，也可以在普通助手回复后作为后续诊断消息出现。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为**单独消息**发送，前缀为 `Reasoning:`。
- `stream`（仅 Telegram）：在生成回复时将推理流式传输到 Telegram 草稿气泡，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每智能体默认值（`agents.list[].reasoningDefault`），然后是全局默认值（`agents.defaults.reasoningDefault`），最后是回退（`off`）。

格式错误的本地模型推理标签会被保守处理。闭合的 `<think>...</think>` 块在普通回复中保持隐藏，已可见文本之后未闭合的推理也会被隐藏。如果回复完全包裹在单个未闭合的起始标签中，且否则会作为空文本交付，OpenClaw 会移除格式错误的起始标签并交付剩余文本。

## 相关

- 提权模式文档位于 [提权模式](/zh-CN/tools/elevated)。

## Heartbeats

- Heartbeat 探测正文是已配置的 Heartbeat 提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令照常应用（但应避免从 Heartbeats 更改会话默认值）。
- Heartbeat 交付默认仅发送最终 payload。若还要发送单独的 `Reasoning:` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每智能体 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天思考选择器会在页面加载时，从入站会话存储/配置中映射该会话已存储的等级。
- 选择其他等级会立即通过 `sessions.patch` 写入会话覆盖项；它不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖项。
- 第一个选项始终是清除覆盖项的选择。当会话继承的是非关闭状态的有效默认值时，它显示 `Inherited: <resolved level>`；当继承的思考已禁用时，它显示 `Off`。
- 显式选择器选项会标记为覆盖项，同时在存在提供商标签时保留该标签（例如，对于提供商标记的 `max` 选项，显示为 `Override: maximum`）。
- 选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器界面不会保留自己的提供商正则表达式列表；插件拥有模型专属的等级集合。
- `/think:<level>` 仍然可用，并会更新同一个已存储会话等级，因此聊天指令和选择器会保持同步。

## 提供商配置档案

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，用于定义模型支持的等级和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以便直接 Anthropic 目录和代理目录保持一致。
- 每个配置档案等级都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示用 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 需要验证显式思考覆盖项的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应保留自己的提供商/模型等级列表。
- 能访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，这样 `compat.supportedReasoningEfforts` 的选择加入会反映在插件侧验证中。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容适配器保留，但新的自定义等级集合应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值会公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，这样 ACP/聊天客户端会渲染与运行时验证所用一致的配置档案 ID 和标签。

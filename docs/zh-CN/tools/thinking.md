---
read_when:
    - 调整思考、快速模式或详细模式的指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 的指令语法以及推理可见性'
title: 思考级别
x-i18n:
    generated_at: "2026-04-27T13:32:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d79dc5a84bb2e695fafb6f2298aabf253126dc20d474bc64ca19a7fe6ac5454
    source_path: tools/thinking.md
    workflow: 15
---

## 它的作用

- 任何入站消息体中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超强思考”（最大预算）
  - xhigh → “超强思考+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini 动态思考支持此模式）
  - max → 提供商最大推理（Anthropic Claude Opus 4.7；Ollama 会将其映射到其最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都会映射到 `xhigh`。
  - `highest` 会映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。提供商插件会为所选模型声明精确支持的级别集合，包括像二元 `on` 这样的标签。
  - 只有支持这些级别的提供商 / 模型配置文件才会声明 `adaptive`、`xhigh` 和 `max`。如果输入的指令级别不受支持，则会拒绝，并返回该模型的有效选项。
  - 已存储但不受支持的旧级别会按提供商配置文件等级重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最高非 `off` 级别。
  - 当未显式设置思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 默认不使用自适应思考。除非你显式设置思考级别，否则它的 API effort 默认值仍由提供商决定。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 还支持 `/think max`；它会映射到同一条由提供商控制的最大 effort 路径。
  - 支持思考的 Ollama 模型会暴露 `/think low|medium|high|max`；`max` 会映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` 这几个 effort 字符串。
  - OpenAI GPT 模型会通过特定模型支持的 Responses API effort 能力来映射 `/think`。`/think off` 只有在目标模型支持时才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的 payload，而不是发送不受支持的值。
  - 过时的已配置 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为该已退役路由可能会通过推理字段返回最终答案文本。
  - Google Gemini 会将 `/think adaptive` 映射到 Gemini 由提供商控制的动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型家族最接近的 Gemini `thinkingLevel` 或 budget。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这可避免 MiniMax 的非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支持二元思考（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅作用于该条消息）。
2. 会话覆盖（通过发送仅包含指令的消息来设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如果可用，则使用提供商声明的默认值；否则，支持推理的模型会解析为 `medium` 或该模型最接近的受支持非 `off` 级别，不支持推理的模型则保持为 `off`。

## 设置会话默认值

- 发送一条**仅包含该指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 这会在当前会话中持续生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅指令消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联 / 仅指令 `/fast on|off`
  2. 会话覆盖
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在支持的 Responses 请求上发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 会在两种凭证路径之间共享同一个 `/fast` 切换。
- 对于直接公共的 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic service tiers：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当 Anthropic 的显式 `serviceTier` / `service_tier` 模型参数与快速模式默认值同时设置时，前者会覆盖后者。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic service-tier 注入。
- 仅当快速模式启用时，`/status` 才会显示 `Fast`。

## 详细指令（`/verbose` 或 `/v`）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅指令消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不改变状态。
- `/verbose off` 会存储一个显式的会话覆盖；可在会话 UI 中选择 `inherit` 来清除。
- 内联指令仅影响该条消息；否则应用会话 / 全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 当 verbose 为开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息发回，并在可用时以前缀 `<emoji> <tool-name>: <arg>` 显示（路径 / 命令）。这些工具摘要会在每个工具启动时立即发送（独立气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀只有在 verbose 为 `on` 或 `full` 时才会显示。
- 当 verbose 为 `full` 时，工具输出在完成后也会被转发（独立气泡，截断到安全长度）。如果你在某次运行进行中切换 `/verbose on|full|off`，后续的工具气泡会遵循新的设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅指令消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该条消息；否则应用会话 / 全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件拥有的 trace / debug 行，例如 Active Memory 调试摘要。
- trace 行可以显示在 `/status` 中，也可以作为普通助手回复后的后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅指令消息会切换是否在回复中显示思考块。
- 启用后，推理会作为一条**单独消息**发送，并以 `Reasoning:` 为前缀。
- `stream`（仅 Telegram）：在生成回复时，将推理流式输出到 Telegram 草稿气泡中，然后发送不包含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每个智能体默认值（`agents.list[].reasoningDefault`），最后是回退（`off`）。

对于格式错误的本地模型推理标签，会采用保守处理方式。闭合的 `<think>...</think>` 块在普通回复中保持隐藏，而在已出现可见文本之后出现的未闭合推理内容也会隐藏。如果某条回复完全被单个未闭合的起始标签包裹，并且否则会导致发送空文本，OpenClaw 会移除这个格式错误的起始标签，并发送剩余文本。

## 相关内容

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测消息体为已配置的心跳提示（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会照常生效（但应避免通过心跳更改会话默认值）。
- 心跳传递默认只发送最终 payload。若还要发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天思考选择器在页面加载时，会从入站会话存储 / 配置中镜像该会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活动会话模型的提供商思考配置文件，以及 `/status` 和 `session_status` 使用的相同回退逻辑。
- 选择器使用 Gateway 网关会话行 / 默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不会维护自己的提供商正则列表；模型特定的级别集合由插件负责。
- `/think:<level>` 仍然有效，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## 提供商配置文件

- 提供商插件可以暴露 `resolveThinkingProfile(ctx)`，用于定义模型支持的级别及默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以便让直接 Anthropic 和代理 catalog 保持一致。
- 每个配置文件级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 需要校验显式思考覆盖的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应维护自己的提供商 / 模型级别列表。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容性适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行 / 默认值会暴露 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，这样 ACP / 聊天客户端就能渲染与运行时校验相同的配置文件 id 和标签。

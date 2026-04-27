---
read_when:
    - 调整 thinking、快速模式或详细输出指令的解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 和 reasoning 可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-27T12:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29369485fc69e98bd6705128d360d66addd7a5057ddc01e4010820b73f48142c
    source_path: tools/thinking.md
    workflow: 15
---

## 它的作用

- 任意入站消息正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → provider 管理的自适应 thinking（支持 Anthropic / Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini dynamic thinking）
  - max → provider 最大 reasoning（Anthropic Claude Opus 4.7；Ollama 会将其映射为其原生最高 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都会映射为 `xhigh`。
  - `highest` 会映射为 `high`。
- provider 说明：
  - Thinking 菜单和选择器由 provider 配置档案驱动。Provider 插件会为所选模型声明精确的级别集合，包括诸如二元 `on` 之类的标签。
  - `adaptive`、`xhigh` 和 `max` 仅会针对支持它们的 provider / 模型配置档案显示。对于不受支持级别的类型化指令，会拒绝并返回该模型的有效选项。
  - 已存储但不受支持的现有级别会按 provider 配置档案等级重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最高非 `off` 级别。
  - 当未显式设置 thinking 级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认启用 adaptive thinking。其 API effort 默认值仍由 provider 决定，除非你显式设置 thinking 级别。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为 adaptive thinking 加上 `output_config.effort: "xhigh"`，因为 `/think` 是一个 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也暴露 `/think max`；它会映射到同一个由 provider 管理的最大 effort 路径。
  - 支持 thinking 的 Ollama 模型暴露 `/think low|medium|high|max`；`max` 会映射为原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型会根据模型特定的 Responses API effort 支持来映射 `/think`。`/think off` 仅在目标模型支持时才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用 reasoning 的载荷，而不是发送不受支持的值。
  - 过时的 OpenRouter Hunter Alpha 配置引用会跳过代理 reasoning 注入，因为那条已退役的路由可能会通过 reasoning 字段返回最终回答文本。
  - Google Gemini 会将 `/think adaptive` 映射为 Gemini 由 provider 管理的 dynamic thinking。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射为该模型系列中最接近的 Gemini `thinkingLevel` 或预算。
  - 在与 Anthropic 兼容的流式路径上，MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可避免 MiniMax 的非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元 thinking（`on` / `off`）。任何非 `off` 的级别都视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 仅接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅作用于该条消息）。
2. 会话覆盖值（通过发送仅包含指令的消息来设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：优先使用 provider 声明的默认值；否则，支持 reasoning 的模型会解析为 `medium` 或该模型支持的最接近非 `off` 级别，而不支持 reasoning 的模型则保持为 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会固定到当前会话（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并返回提示，同时不会更改会话状态。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前 thinking 级别。

## 按智能体应用

- **嵌入式 Pi**：解析出的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅指令消息会切换会话快速模式覆盖值，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 会按以下顺序解析快速模式：
  1. 内联 / 仅指令 `/fast on|off`
  2. 会话覆盖值
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求上发送 `service_tier=priority`，映射为 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送同样的 `service_tier=priority` 标志。OpenClaw 会在这两种认证路径之间共享同一个 `/fast` 开关。
- 对于直接发送到 `api.anthropic.com` 的公开 `anthropic/*` 请求（包括经 OAuth 认证的流量），快速模式会映射为 Anthropic 服务层级：`/fast on` 设为 `service_tier=auto`，`/fast off` 设为 `service_tier=standard_only`。
- 对于走 Anthropic 兼容路径的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当显式设置了 Anthropic `serviceTier` / `service_tier` 模型参数时，它会在两者同时设置时覆盖快速模式默认值。对于非 Anthropic 代理 `baseUrl`，OpenClaw 仍会跳过 Anthropic 服务层级注入。
- 仅当快速模式启用时，`/status` 才会显示 `Fast`。

## 详细输出指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 仅指令消息会切换会话详细输出，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储一个显式的会话覆盖值；可在 Sessions UI 中通过选择 `inherit` 清除。
- 内联指令仅影响该条消息；否则会应用会话 / 全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前 verbose 级别。
- 当 verbose 开启时，输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息回发，并在可用时加上前缀 `<emoji> <tool-name>: <arg>`（路径 / 命令）。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀会被隐藏，除非 verbose 为 `on` 或 `full`。
- 当 verbose 为 `full` 时，工具输出也会在完成后转发（单独气泡，并截断到安全长度）。如果你在运行过程中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅指令消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该条消息；否则会应用会话 / 全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它只暴露由插件拥有的 trace / debug 行，例如 Active Memory 调试摘要。
- Trace 行可能出现在 `/status` 中，也可能在正常助手回复之后作为后续诊断消息出现。

## Reasoning 可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅指令消息会切换是否在回复中显示 thinking 块。
- 启用时，reasoning 会作为一条**单独消息**发送，并以 `Reasoning:` 开头。
- `stream`（仅 Telegram）：在生成回复期间，将 reasoning 流式写入 Telegram 草稿气泡中，然后发送不含 reasoning 的最终回答。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前 reasoning 级别。
- 解析顺序：内联指令，然后是会话覆盖值，然后是每个智能体的默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

格式错误的本地模型 reasoning 标签会被保守处理。闭合的 `<think>...</think>` 块在普通回复中仍会隐藏，而在已出现可见文本之后出现的未闭合 reasoning 也会被隐藏。如果一条回复被单个未闭合开始标签完整包裹，且否则会作为空文本发送，OpenClaw 会移除该格式错误的开始标签，并发送剩余文本。

## 相关

- Elevated mode 文档位于[Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文是已配置的心跳提示词（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会照常应用（但应避免通过心跳更改会话默认值）。
- 心跳传递默认仅发送最终载荷。如需同时发送单独的 `Reasoning:` 消息（如可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天 thinking 选择器在页面加载时会从入站会话存储 / 配置中镜像该会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖值；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖值。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析出的默认值来自当前会话模型的 provider thinking 配置档案，以及 `/status` 和 `session_status` 使用的同一套回退逻辑。
- 选择器使用 gateway 会话行 / 默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不会保留自己的 provider 正则列表；模型特定级别集合由插件负责。
- `/think:<level>` 仍然有效，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## Provider 配置档案

- Provider 插件可暴露 `resolveThinkingProfile(ctx)` 以定义该模型支持的级别和默认值。
- 每个配置档案级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示用 `label`。二元 provider 使用 `{ id: "low", label: "on" }`。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留为兼容性适配器，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行 / 默认值会暴露 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP / 聊天客户端渲染与运行时校验所使用的同一配置档案 ID 和标签。

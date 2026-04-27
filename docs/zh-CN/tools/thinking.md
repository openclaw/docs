---
read_when:
    - 调整思考、快速模式或详细模式的指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 以及推理可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-27T13:19:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7eaa5f397e1ecc327b8706f3fee8cd44e4986ddc23159e20e6d026911eb331e0
    source_path: tools/thinking.md
    workflow: 15
---

## 它的作用

- 可在任何入站消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超深度思考”（最大预算）
  - xhigh → “ultrathink+”（适用于 GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 由提供商管理的自适应思考（适用于 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7，以及 Google Gemini dynamic thinking）
  - max → 提供商的最大推理级别（Anthropic Claude Opus 4.7；Ollama 会将其映射为其原生最高 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 会映射为 `xhigh`。
  - `highest` 会映射为 `high`。
- 提供商说明：
  - 思考菜单和选择器由 provider 配置文件驱动。提供商插件会为所选模型声明精确的级别集合，包括如二元 `on` 这样的标签。
  - 仅当 provider/模型配置文件支持时，才会展示 `adaptive`、`xhigh` 和 `max`。如果输入了不受支持级别的类型化指令，将拒绝该指令，并返回该模型的有效选项。
  - 已存储但不受支持的旧级别会按 provider 配置文件的等级重新映射。`adaptive` 在非自适应模型上会回退为 `medium`，而 `xhigh` 和 `max` 会回退为所选模型支持的最高非 `off` 级别。
  - 当未显式设置思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用 adaptive thinking。除非你显式设置思考级别，否则其 API effort 默认值仍由 provider 决定。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为 adaptive thinking 加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 还支持 `/think max`；它会映射到相同的 provider 管理的最大 effort 路径。
  - 支持思考的 Ollama 模型支持 `/think low|medium|high|max`；`max` 会映射为原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` 这几种 effort 字符串。
  - OpenAI GPT 模型会根据具体模型对 Responses API effort 的支持情况来映射 `/think`。仅当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的负载，而不是发送不受支持的值。
  - 过期配置的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为该已退役路由可能会通过推理字段返回最终答案文本。
  - Google Gemini 会将 `/think adaptive` 映射为 Gemini 由提供商管理的 dynamic thinking。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射为该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这可避免 MiniMax 非原生 Anthropic 流格式中泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元思考（`on`/`off`）。任何非 `off` 级别都会视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 仅接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值标准化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅对该条消息生效）。
2. 会话覆盖值（通过发送仅包含指令的消息设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：如果可用，则使用 provider 声明的默认值；否则，支持推理的模型会解析为 `medium` 或该模型支持的最接近的非 `off` 级别，不支持推理的模型则保持 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会在当前会话中保持生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝，并给出提示，同时不会更改会话状态。
- 发送不带参数的 `/think`（或 `/think:`）即可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内的 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅含指令的消息会切换会话快速模式覆盖值，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）即可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖值
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求上发送 `service_tier=priority` 来映射为 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送同样的 `service_tier=priority` 标志。OpenClaw 会在两种认证路径之间共享同一个 `/fast` 开关。
- 对于直接公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当显式设置了 Anthropic `serviceTier` / `service_tier` 模型参数时，它会在两者同时设置时覆盖快速模式默认值。对于非 Anthropic 代理基础 URL，OpenClaw 仍会跳过注入 Anthropic 服务层级。
- 仅当快速模式启用时，`/status` 才会显示 `Fast`。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 仅含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会更改状态。
- `/verbose off` 会存储一个显式的会话覆盖值；可在 Sessions UI 中选择 `inherit` 来清除它。
- 内联指令仅对该条消息生效；否则会应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）即可查看当前详细级别。
- 当 verbose 开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息发回；如果可用，会以 `<emoji> <tool-name>: <arg>` 作为前缀（路径/命令）。这些工具摘要会在每个工具启动时立即发送（独立消息气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但除非 verbose 为 `on` 或 `full`，否则会隐藏原始错误详情后缀。
- 当 verbose 为 `full` 时，工具输出也会在完成后转发（独立消息气泡，截断到安全长度）。如果你在运行过程中切换 `/verbose on|full|off`，后续的工具消息气泡会遵循新的设置。

## 插件 trace 指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅含指令的消息会切换会话插件 trace 输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅对该条消息生效；否则会应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）即可查看当前 trace 级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件自身的 trace/debug 行，例如 Active Memory 调试摘要。
- Trace 行可能会出现在 `/status` 中，也可能在正常助手回复后作为后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅含指令的消息会切换是否在回复中显示 thinking 块。
- 启用后，推理会作为**单独一条消息**发送，并以 `Reasoning:` 为前缀。
- `stream`（仅限 Telegram）：会在回复生成期间将推理流式写入 Telegram 草稿气泡，随后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）即可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖值，再然后是每个智能体的默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

格式错误的本地模型推理标签会被保守处理。闭合的 `<think>...</think>` 块在普通回复中会保持隐藏；在已有可见文本之后出现的未闭合推理内容也会被隐藏。如果回复整体被单个未闭合起始标签包裹，且否则会导致发送空文本，OpenClaw 会移除这个格式错误的起始标签，并发送剩余文本。

## 相关内容

- Elevated mode 文档见 [Elevated mode](/zh-CN/tools/elevated)。

## Heartbeats

- Heartbeat 探测消息正文为配置的 heartbeat prompt（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令会照常生效（但应避免通过 heartbeat 更改会话默认值）。
- Heartbeat 发送默认仅包含最终负载。如需同时发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天中的思考选择器会在页面加载时，镜像入站会话存储/配置中该会话的已存储级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖值；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自活动会话模型的 provider thinking 配置文件，以及 `/status` 和 `session_status` 使用的同一套回退逻辑。
- 选择器使用 Gateway 网关 会话行/默认值返回的 `thinkingLevels`，并保留 `thinkingOptions` 作为旧版标签列表。浏览器 UI 不会维护自己的 provider 正则列表；模型专属级别集由插件负责。
- `/think:<level>` 仍然可用，并会更新相同的已存储会话级别，因此聊天指令与选择器始终保持同步。

## 提供商配置文件

- 提供商插件可暴露 `resolveThinkingProfile(ctx)` 以定义模型支持的级别和默认值。
- 每个配置文件级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含一个显示 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 需要验证显式思考覆盖值的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 和 `api.runtime.agent.normalizeThinkingLevel(...)`；不应维护自己的 provider/模型级别列表。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留为兼容适配器，但新的自定义级别集应使用 `resolveThinkingProfile`。
- Gateway 网关 行/默认值会暴露 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时验证所使用的相同配置文件 id 和标签。

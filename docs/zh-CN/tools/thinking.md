---
read_when:
    - 调整思考、快速模式或详细指令解析或默认值
summary: /think、/fast、/verbose、/trace 的指令语法和推理可见性
title: 思考等级
x-i18n:
    generated_at: "2026-06-27T03:33:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## 作用

- 任意传入正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超深度思考”（最大预算）
  - xhigh → “超深度思考+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7+ effort）
  - adaptive → 提供商管理的自适应思考（支持 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7+ 以及 Google Gemini 动态思考）
  - max → 提供商最大推理（Anthropic Claude Opus 4.7+；Ollama 会将其映射到自身最高的原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。提供商插件会声明所选模型的确切级别集合，包括二元 `on` 等标签。
  - 只有支持 `adaptive`、`xhigh` 和 `max` 的提供商/模型配置文件才会展示它们。对不支持级别的类型化指令会被拒绝，并返回该模型的有效选项。
  - 已存储的不支持级别会按提供商配置文件等级重新映射。`adaptive` 在非自适应模型上回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - Anthropic Claude 4.6 模型在未显式设置思考级别时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.8 和 Opus 4.7 保持思考关闭，除非你显式设置思考级别。启用自适应思考后，Opus 4.8 的提供商自有 effort 默认值为 `high`。
  - Anthropic Claude Opus 4.7+ 将 `/think xhigh` 映射为自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus effort 设置。
  - Anthropic Claude Opus 4.7+ 也公开 `/think max`；它映射到同一个提供商自有的最大 effort 路径。
  - 直连 DeepSeek V4 模型公开 `/think xhigh|max`；两者都会映射到 DeepSeek `reasoning_effort: "max"`，而较低的非 `off` 级别映射到 `high`。
  - 通过 OpenRouter 路由的 DeepSeek V4 模型公开 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning_effort` 值。已存储的 `max` 覆盖会回退到 `xhigh`。
  - 支持思考的 Ollama 模型公开 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型会通过模型特定的 Responses API effort 支持来映射 `/think`。只有目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略禁用推理的载荷，而不是发送不支持的值。
  - 自定义 OpenAI 兼容目录条目可通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来启用 `/think xhigh`。这使用同一套 compat 元数据来映射出站 OpenAI 推理 effort 载荷，因此菜单、会话验证、智能体 CLI 和 `llm-task` 会与传输行为保持一致。
  - 过期配置的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为该已停用路由可能通过推理字段返回最终回答文本。
  - Google Gemini 将 `/think adaptive` 映射到 Gemini 的提供商自有动态思考。Gemini 3 请求会省略固定的 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax M2.x（`minimax/MiniMax-M2*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这样可避免 M2.x 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。MiniMax-M3（以及 M3.x）例外：M3 会发出正确的 Anthropic 思考块，并在禁用思考时返回空内容，因此 OpenClaw 会让 M3 继续使用提供商的省略/自适应思考路径。
  - Z.AI（`zai/*`）对大多数 GLM 模型是二元的（`on`/`off`）。GLM-5.2 是例外：它公开 `/think off|low|high|max`，将 `low` 和 `high` 映射到 Z.AI `reasoning_effort: "high"`，并将 `max` 映射到 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）始终会思考。其配置文件只公开 `on`，并且 OpenClaw 会按 Moonshot 要求省略出站 `thinking` 字段。其他 `moonshot/*` 模型会将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` 的 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅应用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：有提供商声明的默认值时使用它；否则支持推理的模型解析为 `medium` 或该模型最接近的受支持非 `off` 级别，不支持推理的模型保持 `off`。

## 设置会话默认值

- 发送一条**仅**包含指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 该设置会固定到当前会话（默认按发送者区分）。使用 `/think default` 清除会话覆盖并继承配置/提供商默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 会存储显式关闭覆盖。它会禁用思考，直到你更改或清除会话覆盖。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并给出提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 OpenClaw**：解析后的级别会传递给进程内 OpenClaw 智能体运行时。
- **Claude CLI 后端**：使用 `claude-cli` 时，非 off 级别会作为 `--effort` 传递给 Claude Code；参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

## 快速模式（/fast）

- 级别：`auto|on|off|default`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 清除会话覆盖并继承配置的默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast auto|on|off` 覆盖（`/fast default` 会清除此层）
  2. 会话覆盖
  3. 每智能体默认值（`agents.list[].fastModeDefault`）
  4. 每模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- `auto` 会将会话/配置模式保持为 auto，但会独立解析每次新的模型调用。在自动截止时间前开始的调用会启用快速模式；之后的重试、回退、工具结果或续接调用会以禁用快速模式开始。截止时间默认是 60 秒；在活动模型上设置 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 可更改它。
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求上发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 Codex 支持的 `openai/*` / `openai-codex/*` 模型，快速模式会在 Codex Responses 上发送同一个 `service_tier=priority` 标志。原生 Codex app-server 轮次只会在 `turn/start` 或线程开始/恢复时收到层级，因此 `auto` 无法为已在运行的 app-server 轮次重新分层；它会应用于 OpenClaw 启动的下一次模型轮次。
- 对于直连公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。
- 同时设置时，显式 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。OpenClaw 仍会对非 Anthropic 代理基础 URL 跳过 Anthropic 服务层级注入。
- `/status` 会在启用快速模式时显示 `Fast`，在配置模式为 auto 时显示 `Fast:auto`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细日志，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储显式会话覆盖；可在会话 UI 中选择 `inherit` 来清除它。
- 授权的外部渠道发送者可以持久化会话详细日志覆盖。内部 Gateway 网关/webchat 客户端需要 `operator.admin` 才能持久化它。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 开启详细日志时，发出结构化工具结果的智能体会将每个工具调用作为自己的仅元数据消息发回，可用时前缀为 `<emoji> <tool-name>: <arg>`。这些工具摘要会在每个工具启动后立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀会被隐藏，除非详细级别为 `full`。
- 当详细级别为 `full` 时，工具输出也会在完成后转发（单独气泡，截断到安全长度）。如果你在运行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和进度草稿工具行的形态。使用 `"explain"`（默认）可得到紧凑的人类标签，例如 `🛠️ Exec: checking JS syntax`；如果你还想附加原始命令/详情用于调试，请使用 `"raw"`。每智能体 `agents.list[].toolProgressDetail` 会覆盖默认值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 插件跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件跟踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只公开插件拥有的跟踪/调试行，例如 Active Memory 调试摘要。
- 跟踪行可出现在 `/status` 中，也可在正常助手回复后作为后续诊断消息出现。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示思考块。
- 启用时，推理会作为**单独消息**发送，前缀为 `Thinking`。
- `stream`：当活动渠道支持推理预览时，在生成回复期间流式传输推理，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每智能体默认值（`agents.list[].reasoningDefault`），然后是全局默认值（`agents.defaults.reasoningDefault`），最后是回退（`off`）。

格式异常的本地模型推理标签会被保守处理。已闭合的 `<think>...</think>` 块在普通回复中保持隐藏，已显示文本之后未闭合的推理内容也会隐藏。如果某条回复完全包裹在单个未闭合的开始标签中，并且原本会作为空文本发送，OpenClaw 会移除格式异常的开始标签，并发送剩余文本。

## 相关内容

- 提升权限模式文档位于 [提升权限模式](/zh-CN/tools/elevated)。

## Heartbeat

- Heartbeat 探测正文是配置的 Heartbeat 提示词（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令照常生效（但应避免通过 Heartbeat 更改会话默认值）。
- Heartbeat 发送默认仅发送最终载荷。若还要发送单独的 `Thinking` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true`，或按 Agent 设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- 页面加载时，Web 聊天的思考选择器会从入站会话存储/配置中镜像该会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是清除覆盖的选项。它会显示 `Inherited: <resolved level>`，当继承的思考被禁用时则显示 `Inherited: Off`。
- 显式选择器选项使用其直接级别标签，同时在存在提供商标签时保留这些标签（例如，对于提供商标记的 `max` 选项显示 `Maximum`）。
- 该选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，并将 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不保留自己的提供商正则列表；插件拥有模型特定的级别集合。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## 提供商配置档案

- 提供商插件可以暴露 `resolveThinkingProfile(ctx)`，用于定义模型支持的级别和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以便直接 Anthropic 和代理目录保持一致。
- 每个配置档案级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含显示用的 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 配置档案钩子会在可用时接收合并后的目录事实，包括 `reasoning`、`compat.thinkingFormat` 和 `compat.supportedReasoningEfforts`。仅在已配置的请求契约支持匹配载荷时，才使用这些事实来暴露二元或自定义配置档案。
- 需要验证显式思考覆盖的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应保留自己的提供商/模型级别列表。
- 可访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，以便在插件侧验证中体现 `compat.supportedReasoningEfforts` 的选择启用。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）会作为兼容适配器保留，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值会暴露 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时验证所用相同的配置档案 ID 和标签。

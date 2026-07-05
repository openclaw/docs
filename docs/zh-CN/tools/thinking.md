---
read_when:
    - 调整 thinking、fast-mode 或 verbose 指令解析或默认值
summary: /think、/fast、/verbose、/trace 的指令语法和推理可见性
title: 思考级别
x-i18n:
    generated_at: "2026-07-05T11:49:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11723a45d9b38c8eb32ca837dd2fa64eb737ca711e6d35f8a628dbc75ad10edc
    source_path: tools/thinking.md
    workflow: 16
---

## 作用

- 任意入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`，大致对应 Anthropic 经典的 “think” < “think hard” < “think harder” < “ultrathink” 魔法词阶梯：
  - minimal ~ “think”
  - low ~ “think hard”
  - medium ~ “think harder”
  - high ~ “ultrathink”（最大预算）
  - xhigh ~ “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7+ effort）
  - adaptive → 提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7+ 和 Google Gemini 动态思考支持）
  - max → 提供商最大推理（Anthropic Claude Opus 4.7+；Ollama 会将其映射到最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由提供商配置文件驱动。Provider plugins 会为所选模型声明确切的级别集合，包括二进制 `on` 等标签。
  - `adaptive`、`xhigh` 和 `max` 只会为支持它们的提供商/模型配置文件展示。不支持级别的类型化指令会被拒绝，并返回该模型的有效选项。
  - 现有已存储但不受支持的级别会按提供商配置文件等级重新映射。`adaptive` 在非自适应模型上回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非关闭级别。
  - Anthropic Claude 4.6 模型在未显式设置思考级别时默认使用 `adaptive`。
  - Anthropic Claude Opus 4.8 和 Opus 4.7 会保持思考关闭，除非你显式设置思考级别。启用自适应思考后，Opus 4.8 的提供商自有 effort 默认值为 `high`。
  - Anthropic Claude Opus 4.7+ 会将 `/think xhigh` 映射到自适应思考加 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus effort 设置。
  - Anthropic Claude Opus 4.7+ 也公开 `/think max`；它映射到同一条提供商自有最大 effort 路径。
  - 直连 DeepSeek V4 模型公开 `/think xhigh|max`；二者都映射到 DeepSeek `reasoning_effort: "max"`，而较低的非关闭级别映射到 `high`。
  - 通过 OpenRouter 路由的 DeepSeek V4 模型公开 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning.effort` 值，而不是 DeepSeek 原生顶层 `reasoning_effort`。较低的非关闭级别映射到 `high`，已存储的 `max` 覆盖值会回退到 `xhigh`。
  - 支持思考的 Ollama 模型公开 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型通过模型特定的 Responses API effort 支持来映射 `/think`。`/think off` 仅在目标模型支持时发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理负载，而不是发送不受支持的值。
  - 自定义 OpenAI 兼容目录条目可以通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来选择启用 `/think xhigh`。这使用与出站 OpenAI 推理 effort 负载映射相同的兼容元数据，因此菜单、会话校验、Agent CLI 和 `llm-task` 会与传输行为保持一致。
  - 过期配置的 OpenRouter Hunter Alpha 引用会跳过代理推理注入，因为该已停用路由可能通过推理字段返回最终答案文本。
  - Google Gemini 会将 `/think adaptive` 映射到 Gemini 的提供商自有动态思考。Gemini 3 请求会省略固定 `thinkingLevel`，而 Gemini 2.5 请求会发送 `thinkingBudget: -1`；固定级别仍会映射到该模型系列最接近的 Gemini `thinkingLevel` 或预算。
  - Anthropic 兼容流式路径上的 MiniMax M2.x（`minimax/MiniMax-M2*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这避免了 M2.x 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。MiniMax-M3（以及 M3.x）不受此限制：M3 会发出正确的 Anthropic 思考块，并在禁用思考时返回空内容，因此 OpenClaw 让 M3 保持在提供商的省略/自适应思考路径上。
  - Z.AI（`zai/*`）对大多数 GLM 模型是二进制（`on`/`off`）。GLM-5.2 是例外：它公开 `/think off|low|high|max`，将 `low` 和 `high` 映射到 Z.AI `reasoning_effort: "high"`，并将 `max` 映射到 `reasoning_effort: "max"`。
  - Moonshot Kimi K2.7 Code（`moonshot/kimi-k2.7-code`）始终会思考。其配置文件只公开 `on`，且 OpenClaw 会按 Moonshot 要求省略出站 `thinking` 字段。其他 `moonshot/*` 模型会将 `/think off` 映射到 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用思考时，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅适用于该消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每个智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：可用时使用提供商声明的默认值；否则，支持推理的模型解析为 `medium` 或该模型最接近的受支持非 `off` 级别，不支持推理的模型保持 `off`。

## 设置会话默认值

- 发送一条**只包含**指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 该设置会固定到当前会话（默认按发送者区分）。使用 `/think default` 清除会话覆盖并继承已配置/提供商默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 会存储一个显式关闭覆盖。它会禁用思考，直到你更改或清除会话覆盖。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并附带提示，且会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 OpenClaw**：解析后的级别会传递给进程内 OpenClaw agent runtime。
- **Claude CLI 后端**：使用 `claude-cli` 时，非关闭级别会作为 `--effort` 传递给 Claude Code；参见 [CLI 后端](/zh-CN/gateway/cli-backends)。

## 快速模式（/fast）

- 级别：`auto|on|off|default`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode set to auto.`、`Fast mode enabled.` 或 `Fast mode disabled.`。使用 `/fast default` 清除会话覆盖并继承已配置默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast auto|on|off` 覆盖（`/fast default` 会清除此层）
  2. 会话覆盖
  3. 每个智能体默认值（`agents.list[].fastModeDefault`）
  4. 每个模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- `auto` 会将会话/配置模式保持为自动，但会独立解析每一次新的模型调用。在自动截止时间之前开始的调用会启用快速模式；之后的重试、回退、工具结果或继续调用会在快速模式禁用状态下开始。截止时间默认为 60 秒；在活动模型上设置 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` 可更改它。
- 对于 `openai/*`，快速模式通过在受支持的 Responses 请求上发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于由 Codex 支持的 `openai/*` / `openai-codex/*` 模型，快速模式会在 Codex Responses 上发送同一个 `service_tier=priority` 标志。原生 Codex app-server 轮次只会在 `turn/start` 或线程开始/恢复时接收该层级，因此 `auto` 无法为已经运行的 app-server 轮次重新分层；它会应用到 OpenClaw 启动的下一个模型轮次。
- 对于直连公共 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当显式 Anthropic `serviceTier` / `service_tier` 模型参数与快速模式默认值同时设置时，模型参数会覆盖快速模式默认值。OpenClaw 仍会对非 Anthropic 代理 base URL 跳过 Anthropic 服务层级注入。
- `/status` 会在快速模式启用时显示 `Fast`，并在配置模式为 auto 时显示 `Fast:auto`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示且不更改状态。
- `/verbose off` 会存储一个显式会话覆盖；可在 Sessions UI 中选择 `inherit` 来清除它。
- 已授权的外部渠道发送者可以持久化会话详细模式覆盖。内部 Gateway 网关/webchat 客户端需要 `operator.admin` 才能持久化它。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 当详细模式开启时，发出结构化工具结果的智能体会将每个工具调用作为其自己的仅元数据消息发回，可用时以前缀 `<emoji> <tool-name>: <arg>` 开头。这些工具摘要会在每个工具启动后立即发送（独立气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀会被隐藏，除非详细模式为 `full`。
- 当详细模式为 `full` 时，工具输出也会在完成后转发（独立气泡，并截断到安全长度）。如果你在某次运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。
- `agents.defaults.toolProgressDetail` 控制 `/verbose` 工具摘要和进度草稿工具行的形态。使用 `"explain"`（默认）可获得紧凑的人类标签，例如 `🛠️ Exec: checking JS syntax`；当你还希望追加原始命令/详情以便调试时，使用 `"raw"`。每个智能体的 `agents.list[].toolProgressDetail` 会覆盖默认值。
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## 插件追踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件追踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前追踪级别。
- `/trace` 的范围比 `/verbose` 更窄：它只公开插件拥有的追踪/调试行，例如 Active Memory 调试摘要。
- 追踪行可能出现在 `/status` 中，也可能在正常 assistant 回复后作为后续诊断消息出现。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示思考块。
- 启用后，推理会作为**独立消息**发送，并以前缀 `Thinking` 开头。
- `stream`：当活动渠道支持推理预览时，会在回复生成期间流式传输推理，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每个智能体默认值（`agents.list[].reasoningDefault`），然后是全局默认值（`agents.defaults.reasoningDefault`），最后是回退（`off`）。

格式错误的本地模型推理标签会被保守处理。闭合的 `<think>...</think>` 块在普通回复中保持隐藏，已可见文本之后未闭合的推理内容也会被隐藏。如果回复完全包裹在单个未闭合的起始标签中，并且否则会作为空文本发送，OpenClaw 会移除格式错误的起始标签并发送剩余文本。

## 相关

- 提升权限模式文档位于 [提升权限模式](/zh-CN/tools/elevated)。

## Heartbeat

- Heartbeat 探测正文是配置的 Heartbeat 提示词（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。Heartbeat 消息中的内联指令照常生效（但应避免通过 Heartbeat 更改会话默认值）。
- Heartbeat 发送默认只发送最终负载。若还要发送单独的 `Thinking` 消息（可用时），请设置 `agents.defaults.heartbeat.includeReasoning: true`，或按 Agent 设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天思考选择器会在页面加载时映射来自入站会话存储/配置的会话已存储级别。
- 选择另一个级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是清除覆盖的选择。它显示 `Inherited: <resolved level>`，当继承的思考被禁用时也会显示 `Inherited: Off`。
- 显式选择器选项使用其直接级别标签，同时在存在提供商标签时保留这些标签（例如，对于提供商标记的 `max` 选项显示 `Maximum`）。
- 选择器使用 Gateway 网关会话行/默认值返回的 `thinkingLevels`，而 `thinkingOptions` 保留为旧版标签列表。浏览器 UI 不保留自己的提供商正则列表；插件拥有模型特定的级别集。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

## 提供商配置文件

- 提供商插件可以公开 `resolveThinkingProfile(ctx)`，用于定义模型支持的级别和默认值。
- 代理 Claude 模型的提供商插件应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以保持直接 Anthropic 和代理目录一致。
- 每个配置文件级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可以包含显示用 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 配置文件钩子会在可用时接收合并后的目录事实，包括 `reasoning`、`compat.thinkingFormat` 和 `compat.supportedReasoningEfforts`。只有在已配置的请求契约支持匹配负载时，才使用这些事实公开二元或自定义配置文件。
- 需要验证显式思考覆盖的工具插件应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加上 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应保留自己的提供商/模型级别列表。
- 有权访问已配置自定义模型元数据的工具插件可以将 `catalog` 传入 `resolveThinkingPolicy`，这样 `compat.supportedReasoningEfforts` 的选择启用会反映在插件侧验证中。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍作为兼容适配器保留，但新的自定义级别集应使用 `resolveThinkingProfile`。
- Gateway 网关行/默认值公开 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时验证所用相同的配置文件 ID 和标签。

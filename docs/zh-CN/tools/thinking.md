---
read_when:
    - 调整思考、快速模式或详细模式指令的解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 以及推理可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-24T00:34:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## 功能说明

- 可在任何入站消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “更深入地思考”
  - medium → “更深入地思考”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → 提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6 以及 Anthropic Claude Opus 4.7 支持）
  - max → 提供商最大推理（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射为 `xhigh`。
  - `highest` 映射为 `high`。
- 提供商说明：
  - 思考菜单和选择器由 provider profile 驱动。provider 插件会为所选模型声明精确支持的级别集合，包括如二元 `on` 之类的标签。
  - 仅对支持这些级别的 provider/模型 profile 才会公布 `adaptive`、`xhigh` 和 `max`。如果输入了不受支持级别的类型化指令，将使用该模型的有效选项拒绝该指令。
  - 已存储但不受支持的现有级别会按 provider profile 的等级重新映射。`adaptive` 在非自适应模型上会回退到 `medium`，而 `xhigh` 和 `max` 会回退到所选模型支持的最大非 `off` 级别。
  - 当未显式设置思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认启用自适应思考。除非你显式设置思考级别，否则其 API effort 默认值仍由 provider 控制。
  - Anthropic Claude Opus 4.7 会将 `/think xhigh` 映射为自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也公开 `/think max`；它映射到相同的 provider 控制最大 effort 路径。
  - OpenAI GPT 模型会通过特定模型支持的 Responses API effort 将 `/think` 进行映射。只有当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用的推理负载，而不是发送不受支持的值。
  - Anthropic 兼容流式路径上的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置思考。这样可以避免 MiniMax 非原生 Anthropic 流格式泄漏 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元思考（`on`/`off`）。任何非 `off` 级别都视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用思考时，Moonshot 仅接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅应用于该条消息）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：若可用，则使用 provider 声明的默认值；否则，具备推理能力的模型解析为 `medium` 或该模型支持的最接近的非 `off` 级别，不具备推理能力的模型保持 `off`。

## 设置会话默认值

- 发送一条**仅包含该指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会对当前会话生效（默认按发送者区分）；通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），该命令会被拒绝并附带提示，同时会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **Embedded Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式通过在受支持的 Responses 请求中发送 `service_tier=priority` 来映射为 OpenAI 优先级处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 在这两种认证路径之间保持一个共享的 `/fast` 开关。
- 对于直接发送到 `api.anthropic.com` 的公共 `anthropic/*` 请求（包括 OAuth 认证流量），快速模式会映射到 Anthropic service tiers：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。
- 如果同时设置了显式 Anthropic `serviceTier` / `service_tier` 模型参数，它们会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过注入 Anthropic service tier。
- 仅当快速模式启用时，`/status` 才显示 `Fast`。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最少）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会更改状态。
- `/verbose off` 会存储一个显式会话覆盖；可在 Sessions UI 中选择 `inherit` 来清除。
- 内联指令仅影响该条消息；否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 当详细模式开启时，能够发出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息回传；如有可用参数（路径/命令），会以 `<emoji> <tool-name>: <arg>` 作为前缀。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 在普通模式下，工具失败摘要仍然可见，但原始错误详情后缀会被隐藏，除非详细模式为 `on` 或 `full`。
- 当详细模式为 `full` 时，工具输出也会在完成后转发（单独气泡，截断到安全长度）。如果你在一次运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件追踪指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件追踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该条消息；否则应用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前追踪级别。
- `/trace` 比 `/verbose` 更窄：它仅公开插件自身的追踪/调试行，例如 Active Memory 调试摘要。
- 追踪行可出现在 `/status` 中，也可在正常助手回复后作为后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示思考块。
- 启用时，推理会作为**单独消息**发送，并带有前缀 `Reasoning:`。
- `stream`（仅 Telegram）：在回复生成期间将推理流式写入 Telegram 草稿气泡，然后发送不含推理的最终答案。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖，然后是每个智能体默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

## 相关内容

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测消息正文为已配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令会照常生效（但应避免通过心跳更改会话默认值）。
- 心跳传递默认仅发送最终负载。若也要发送单独的 `Reasoning:` 消息（如可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天思考选择器在页面加载时，会镜像来自入站会话存储/配置中的该会话已存储级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等待下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自当前会话模型的 provider 思考 profile，以及 `/status` 和 `session_status` 使用的同一套回退逻辑。
- 该选择器使用 Gateway 网关会话行返回的 `thinkingOptions`。浏览器 UI 不维护自己的 provider 正则列表；模型特定级别集合由插件控制。
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器保持同步。

## Provider profiles

- provider 插件可暴露 `resolveThinkingProfile(ctx)`，用于定义模型支持的级别和默认值。
- 每个 profile 级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并可包含显示用 `label`。二元 provider 使用 `{ id: "low", label: "on" }`。
- 已发布的旧版钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留为兼容适配器，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行会公开 `thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时验证相同的 profile。

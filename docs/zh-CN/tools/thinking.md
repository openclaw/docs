---
read_when:
    - 调整思考、快速模式或详细模式的指令解析或默认值
summary: '`/think`、`/fast`、`/verbose`、`/trace` 和推理可见性的指令语法'
title: 思考级别
x-i18n:
    generated_at: "2026-04-21T08:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# 思考级别（`/think` 指令）

## 它的作用

- 可在任何入站消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “思考”
  - low → “深入思考”
  - medium → “更深入思考”
  - high → “超深度思考”（最大预算）
  - xhigh → “超深度思考 +”（GPT-5.2 + Codex 模型，以及 Anthropic Claude Opus 4.7 的 effort）
  - adaptive → 由提供商管理的自适应思考（Anthropic/Bedrock 上的 Claude 4.6，以及 Anthropic Claude Opus 4.7 支持）
  - max → 提供商最大推理（当前为 Anthropic Claude Opus 4.7）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射到 `xhigh`。
  - `highest` 映射到 `high`。
- 提供商说明：
  - 思考菜单和选择器由 provider profile 驱动。提供商插件会为所选模型声明确切支持的级别集合，包括如二元 `on` 这样的标签。
  - `adaptive`、`xhigh` 和 `max` 只会针对支持它们的 provider/model profile 进行展示。若输入了不受支持的级别指令，将拒绝该指令，并返回该模型的有效选项。
  - 现有已存储但不受支持的级别，包括切换模型后旧的 `max` 值，会被重新映射为所选模型支持的最高级别。
  - 当未显式设置思考级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认使用自适应思考。其 API effort 默认值仍由提供商控制，除非你显式设置思考级别。
  - 对于 Anthropic Claude Opus 4.7，`/think xhigh` 会映射为自适应思考加上 `output_config.effort: "xhigh"`，因为 `/think` 是思考指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 也支持 `/think max`；它会映射到同一个由提供商控制的最大 effort 路径。
  - OpenAI GPT 模型会根据具体模型对 Responses API effort 的支持来映射 `/think`。只有当目标模型支持时，`/think off` 才会发送 `reasoning.effort: "none"`；否则 OpenClaw 会省略已禁用推理的 payload，而不会发送不受支持的值。
  - 走 Anthropic 兼容流式路径的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可避免 MiniMax 非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）只支持二元思考（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射为 `thinking: { type: "disabled" }`，并将任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅对该条消息生效）。
2. 会话覆盖项（通过发送仅包含指令的消息来设置）。
3. 每个智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：若可用，则使用提供商声明的默认值；对于其他被标记为支持推理的 catalog 模型，使用 `low`；否则为 `off`。

## 设置会话默认值

- 发送一条**仅包含指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会在当前会话中保持生效（默认按发送者区分）；可通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝，并给出提示，同时保持会话状态不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内的 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖项，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送不带模式的 `/fast`（或 `/fast status`）可查看当前生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖项
  3. 每个智能体的默认值（`agents.list[].fastModeDefault`）
  4. 每个模型的配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式通过在受支持的 Responses 请求中发送 `service_tier=priority`，映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送同样的 `service_tier=priority` 标志。OpenClaw 在这两种认证路径之间共享同一个 `/fast` 开关。
- 对于直接发往公共 `anthropic/*` 的请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic 服务层级：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于走 Anthropic 兼容路径的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当二者同时设置时，显式的 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic service-tier 注入。

## 详细模式指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话详细模式，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示，但不会更改状态。
- `/verbose off` 会存储为显式会话覆盖项；可在 Sessions UI 中选择 `inherit` 来清除。
- 内联指令仅影响该条消息；否则使用会话/全局默认值。
- 发送不带参数的 `/verbose`（或 `/verbose:`）可查看当前详细级别。
- 当详细模式开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为独立的仅元数据消息发回；若可用，会以前缀 `<emoji> <tool-name>: <arg>` 的形式显示（路径/命令）。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀会被隐藏，除非详细级别为 `on` 或 `full`。
- 当详细级别为 `full` 时，工具输出也会在完成后转发（单独气泡，并截断到安全长度）。如果你在运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新的设置。

## 插件追踪指令（`/trace`）

- 级别：`on` | `off`（默认）。
- 仅包含指令的消息会切换会话插件追踪输出，并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该条消息；否则使用会话/全局默认值。
- 发送不带参数的 `/trace`（或 `/trace:`）可查看当前追踪级别。
- `/trace` 比 `/verbose` 更窄：它只暴露插件拥有的追踪/调试行，例如 Active Memory 调试摘要。
- 追踪行可出现在 `/status` 中，也可作为普通助手回复后的后续诊断消息出现。

## 推理可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示 thinking 块。
- 启用后，推理会作为**单独一条消息**发送，并以 `Reasoning:` 为前缀。
- `stream`（仅 Telegram）：在回复生成过程中，将推理流式写入 Telegram 草稿气泡，最终发送的正式答案不包含推理。
- 别名：`/reason`。
- 发送不带参数的 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是会话覆盖项，然后是每个智能体的默认值（`agents.list[].reasoningDefault`），最后回退为 `off`。

## 相关内容

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## 心跳

- 心跳探测正文为已配置的心跳提示词（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令仍照常生效（但应避免通过心跳更改会话默认值）。
- 心跳传递默认只发送最终 payload。若还要发送单独的 `Reasoning:` 消息（若可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个智能体的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天中的思考选择器会在页面加载时，从入站会话存储/config 中镜像该会话已存储的级别。
- 选择其他级别会立即通过 `sessions.patch` 写入会话覆盖项；它不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自当前活动会话模型的 provider thinking profile。
- 选择器使用 Gateway 网关会话行返回的 `thinkingOptions`。浏览器 UI 不会维护自己的 provider 正则列表；模型特定级别集合由插件负责。
- `/think:<level>` 仍然有效，并会更新同一个已存储的会话级别，因此聊天指令与选择器保持同步。

## Provider profiles

- 提供商插件可暴露 `resolveThinkingProfile(ctx)` 来定义模型支持的级别及默认值。
- 每个 profile 级别都有一个已存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并且可包含一个显示用 `label`。二元提供商使用 `{ id: "low", label: "on" }`。
- 已发布的旧版 hook（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）仍保留作为兼容适配器，但新的自定义级别集合应使用 `resolveThinkingProfile`。
- Gateway 网关行会暴露 `thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染与运行时校验相同的 profile。

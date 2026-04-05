---
read_when:
    - 调整 thinking、快速模式或 verbose 指令解析或默认值
summary: 用于 /think、/fast、/verbose 和 reasoning 可见性的指令语法
title: Thinking 级别
x-i18n:
    generated_at: "2026-04-05T10:12:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking 级别（`/think` 指令）

## 它的作用

- 可在任何传入消息正文中使用的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink”（最大预算）
  - xhigh → “ultrathink+”（仅限 GPT-5.2 + Codex 模型）
  - adaptive → 由提供商管理的自适应 reasoning 预算（适用于 Anthropic Claude 4.6 模型家族）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 都映射到 `xhigh`。
  - `highest`、`max` 都映射到 `high`。
- 提供商说明：
  - 当未设置显式 thinking 级别时，Anthropic Claude 4.6 模型默认使用 `adaptive`。
  - 走 Anthropic-compatible 流式路径的 MiniMax（`minimax/*`）默认使用 `thinking: { type: "disabled" }`，除非你在模型参数或请求参数中显式设置 thinking。这样可以避免 MiniMax 的非原生 Anthropic 流格式泄露 `reasoning_content` 增量。
  - Z.AI（`zai/*`）仅支持二元 thinking（`on`/`off`）。任何非 `off` 级别都会被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）会将 `/think off` 映射到 `thinking: { type: "disabled" }`，将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。启用 thinking 时，Moonshot 仅接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值规范化为 `auto`。

## 解析顺序

1. 消息中的内联指令（仅对该条消息生效）。
2. 会话覆盖（通过发送仅包含指令的消息设置）。
3. 按智能体的默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：Anthropic Claude 4.6 模型为 `adaptive`，其他支持 reasoning 的模型为 `low`，否则为 `off`。

## 设置会话默认值

- 发送一条**只包含该指令**的消息（允许空白字符），例如 `/think:medium` 或 `/t high`。
- 该设置会固定到当前会话中（默认按发送者区分）；会通过 `/think:off` 或会话空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令会被拒绝并附带提示，会话状态保持不变。
- 发送不带参数的 `/think`（或 `/think:`）可查看当前 thinking 级别。

## 按智能体应用

- **嵌入式 Pi**：解析后的级别会传递给进程内 Pi 智能体运行时。

## 快速模式（`/fast`）

- 级别：`on|off`。
- 仅包含指令的消息会切换会话快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 不带模式发送 `/fast`（或 `/fast status`）可查看当前实际生效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. 会话覆盖
  3. 按智能体的默认值（`agents.list[].fastModeDefault`）
  4. 按模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式会通过在受支持的 Responses 请求上发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式会在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 会在这两条认证路径之间共用一个 `/fast` 开关。
- 对于直连公开 `anthropic/*` 请求，包括发送到 `api.anthropic.com` 的 OAuth 认证流量，快速模式会映射到 Anthropic service tier：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic-compatible 路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）会将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
- 当两者同时设置时，显式的 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。对于非 Anthropic 代理 base URL，OpenClaw 仍会跳过 Anthropic service-tier 注入。

## Verbose 指令（`/verbose` 或 `/v`）

- 级别：`on`（最简）| `full` | `off`（默认）。
- 仅包含指令的消息会切换会话 verbose，并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别会返回提示而不更改状态。
- `/verbose off` 会存储一个显式会话覆盖；可在 Sessions UI 中选择 `inherit` 来清除。
- 内联指令仅影响当前消息；其他情况适用会话/全局默认值。
- 不带参数发送 `/verbose`（或 `/verbose:`）可查看当前 verbose 级别。
- 当 verbose 开启时，会输出结构化工具结果的智能体（Pi、其他 JSON 智能体）会将每次工具调用作为单独的仅元数据消息发回；如果可用，会以 `<emoji> <tool-name>: <arg>` 为前缀（路径/命令）。这些工具摘要会在每个工具启动时立即发送（单独气泡），而不是作为流式增量发送。
- 在普通模式下，工具失败摘要仍然可见，但原始错误详情后缀会被隐藏，除非 verbose 为 `on` 或 `full`。
- 当 verbose 为 `full` 时，工具输出也会在完成后转发（单独气泡，并截断到安全长度）。如果你在运行进行中切换 `/verbose on|full|off`，后续工具气泡会遵循新设置。

## Reasoning 可见性（`/reasoning`）

- 级别：`on|off|stream`。
- 仅包含指令的消息会切换是否在回复中显示 thinking 块。
- 启用后，reasoning 会作为**单独消息**发送，并带有 `Reasoning:` 前缀。
- `stream`（仅 Telegram）：在回复生成期间，将 reasoning 流式写入 Telegram 草稿气泡中，然后发送不包含 reasoning 的最终答案。
- 别名：`/reason`。
- 不带参数发送 `/reasoning`（或 `/reasoning:`）可查看当前 reasoning 级别。
- 解析顺序：内联指令，然后会话覆盖，然后按智能体默认值（`agents.list[].reasoningDefault`），最后回退（`off`）。

## 相关内容

- Elevated mode 文档位于 [Elevated mode](/zh-CN/tools/elevated)。

## Heartbeats

- Heartbeat 探测消息正文是已配置的 heartbeat 提示词（默认值：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。heartbeat 消息中的内联指令会照常生效（但应避免通过 heartbeat 更改会话默认值）。
- Heartbeat 投递默认仅发送最终载荷。若还要发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或按智能体设置 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天中的 thinking 选择器会在页面加载时，从传入会话存储/配置中镜像该会话的已存储级别。
- 选择另一个级别会立即通过 `sessions.patch` 写入会话覆盖；它不会等到下一次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 `Default (<resolved level>)`，其中解析后的默认值来自当前会话模型：Anthropic/Bedrock 上的 Claude 4.6 为 `adaptive`，其他支持 reasoning 的模型为 `low`，否则为 `off`。
- 该选择器会保持提供商感知：
  - 大多数提供商显示 `off | minimal | low | medium | high | adaptive`
  - Z.AI 显示二元选项 `off | on`
- `/think:<level>` 仍然可用，并会更新同一个已存储的会话级别，因此聊天指令和选择器会保持同步。

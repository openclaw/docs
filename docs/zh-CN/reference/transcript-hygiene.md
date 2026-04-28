---
read_when:
    - 你正在调试与对话记录结构相关的提供商请求拒绝问题
    - 你正在更改会话记录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 ID 不匹配问题
summary: 参考：提供商特定的会话记录清理与修复规则
title: 对话记录整理规范
x-i18n:
    generated_at: "2026-04-28T19:51:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文）对转录记录应用**特定于提供商的修复**。其中大多数都是**内存中**调整，用于满足严格的提供商要求。单独的会话文件修复流程也可能在加载会话前重写已存储的 JSONL，方式是丢弃格式错误的 JSONL 行，或修复语法有效但已知会在重放期间被提供商拒绝的已持久化轮次。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 仅运行时提示上下文不进入用户可见的转录记录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- Thinking 签名清理
- 图像载荷清理
- 提供商重放前清理空白文本块
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 重放的空 assistant 错误轮次修复

如果你需要转录记录存储详情，请参阅：

- [会话管理深度解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录记录

运行时/系统上下文可以添加到某个轮次的模型提示中，但它不是最终用户编写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 Pi 运行保留一个单独面向转录记录的提示正文。已存储的可见用户轮次使用该转录记录正文，而不是运行时增强后的提示。

对于已经持久化运行时包装器的旧版会话，Gateway 网关历史表面会在向 WebChat、TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有转录记录卫生处理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些处理。

与转录记录卫生处理分开，会话文件会在加载前被修复（如有需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防由于大小限制导致提供商端拒绝（对过大的 base64 图像进行缩放/重新压缩）。

这也有助于控制支持视觉的模型由图像驱动的 token 压力。较低的最大尺寸通常会减少 token 使用量；较高的尺寸会保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。
- 当此流程遍历重放内容时，会移除空白文本块。变为空的 assistant 轮次会从重放副本中丢弃；变为空的用户和工具结果轮次会收到一个非空的已省略内容占位符。

---

## 全局规则：格式错误的工具调用

在构建模型上下文之前，会丢弃同时缺少 `input` 和 `arguments` 的 assistant 工具调用块。这样可以防止提供商因部分持久化的工具调用而拒绝（例如，在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 的 `sanitizeSessionHistory` 中应用

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send`（包括智能体到智能体的回复/公告步骤）向另一个会话发送提示时，OpenClaw 会将创建的用户轮次持久化为：

- `message.provenance.kind = "inter_session"`

OpenClaw 还会在路由后的提示文本前添加同一轮次的 `[Inter-session message ... isUser=false]` 标记，以便活动模型调用能区分外部会话输出和外部最终用户指令。可用时，此标记包含源会话、渠道和工具。为了提供商兼容性，转录记录仍使用 `role: "user"`，但可见文本和来源元数据都会将该轮次标记为跨会话数据。

在上下文重建期间，OpenClaw 会对仅具有来源元数据的较旧持久化跨会话用户轮次应用同一标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对 OpenAI Responses/Codex 转录记录，丢弃孤立的推理签名（没有后续内容块的独立推理项），并在模型路由切换后丢弃可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项载荷，包括加密的空摘要项，以便手动/WebSocket 重放保留与 assistant 输出项配对所需的 `rs_*` 状态。
- 不进行工具调用 ID 清理。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重排序。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离思考签名。

**OpenAI 兼容 Gemma 4**

- 历史 assistant thinking/reasoning 块会在重放前被剥离，以便本地 OpenAI 兼容 Gemma 4 服务器不会接收先前轮次的推理内容。
- 当前同轮次工具调用延续会保留附加到工具调用的 assistant 推理块，直到工具结果已重放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修复（如果历史以 assistant 开始，则前置一个很小的用户引导）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续用户轮次以满足严格交替）。
- 启用 thinking 时，会从传出的 Anthropic Messages 载荷中剥离尾随的 assistant 预填充轮次，包括 Cloudflare AI Gateway 路由。
- 在提供商转换前，会剥离缺失、为空或空白的重放签名的 thinking 块。如果这会使 assistant 轮次为空，OpenClaw 会使用非空的已省略推理文本保留轮次形状。
- 必须剥离的较旧仅 thinking assistant 轮次会替换为非空的已省略推理文本，以便提供商适配器不会丢弃重放轮次。

**Amazon Bedrock（Converse API）**

- 空 assistant 流错误轮次会在重放前被修复为非空回退文本块。Bedrock Converse 会拒绝带有 `content: []` 的 assistant 消息，因此带有 `stopReason: "error"` 且内容为空的已持久化 assistant 轮次也会在加载前在磁盘上修复。
- 仅包含空白文本块的 assistant 流错误轮次会从内存中的重放副本中丢弃，而不是重放无效的空白块。
- 缺失、为空或空白的重放签名的 Claude thinking 块会在 Converse 重放前被剥离。如果这会使 assistant 轮次为空，OpenClaw 会使用非空的已省略推理文本保留轮次形状。
- 必须剥离的较旧仅 thinking assistant 轮次会替换为非空的已省略推理文本，以便 Converse 重放保持严格轮次形状。
- 重放会过滤 OpenClaw 投递镜像和 Gateway 网关注入的 assistant 轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（字母数字，长度为 9）。

**OpenRouter Gemini**

- 思考签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有提供商**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录记录卫生处理：

- 一个 **transcript-sanitize 插件**会在每次上下文构建时运行，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行特定于提供商的清理，这造成了重复工作。
- 提供商策略之外还会发生额外变更，包括：
  - 在持久化前从 assistant 文本中剥离 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用后截断 assistant 内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses` 的 `call_id|fc_id` 配对）。2026.1.22 清理移除了该插件，将逻辑集中到运行器中，并使 OpenAI 在图像清理之外保持**不改动**。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)

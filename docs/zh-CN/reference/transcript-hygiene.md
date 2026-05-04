---
read_when:
    - 你正在调试与对话记录结构相关的提供商请求被拒问题
    - 你正在更改会话记录清理或工具调用修复逻辑
    - 你正在调查各提供商之间的 tool-call id 不匹配问题
summary: 参考：提供商特定的会话记录清理和修复规则
title: 会话记录整理
x-i18n:
    generated_at: "2026-05-04T23:37:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文时）对转录应用**特定提供商的修正**。其中大多数是在**内存中**进行的调整，用于满足严格的提供商要求。单独的会话文件修复流程也可能在加载会话前重写存储的 JSONL，但仅限格式错误的行或作为持久记录无效的已持久化轮次。已交付的助手回复会保留在磁盘上；特定提供商的助手预填内容剥离只会在构造出站 payload 时发生。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 仅运行时使用的提示上下文不进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- Thinking 签名清理
- 图像 payload 清理
- 提供商重放前的空白文本块清理
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 重放的空助手错误轮次修复

如果你需要转录存储细节，请参见：

- [会话管理深入解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时/系统上下文可以添加到某一轮的模型提示中，但它不是最终用户编写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 Pi 运行保留一个单独面向转录的提示正文。存储的可见用户轮次会使用该转录正文，而不是运行时增强后的提示。

对于已经持久化运行时包装的旧版会话，Gateway 网关历史记录接口会在向 WebChat、TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有转录清理都集中在嵌入式 runner 中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定要应用哪些处理。

与转录清理分开，会话文件会在加载前进行修复（如有需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式 runner）调用

---

## 全局规则：图像清理

图像 payload 始终会被清理，以防因大小限制导致提供商端拒绝（对超大的 base64 图像进行缩小/重新压缩）。

这也有助于控制具备视觉能力的模型因图像产生的 token 压力。较低的最大尺寸通常会减少 token 使用量；较高的尺寸会保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。
- 此流程遍历重放内容时会移除空白文本块。变为空的助手轮次会从重放副本中删除；变为空的用户和工具结果轮次会收到一个非空的已省略内容占位符。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 的助手工具调用块会在构建模型上下文前被丢弃。这可以避免提供商因部分持久化的工具调用而拒绝请求（例如在触发速率限制失败后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 的 `sanitizeSessionHistory` 中应用

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 向另一个会话发送提示时（包括智能体到智能体的回复/公告步骤），OpenClaw 会将创建的用户轮次持久化，并带有：

- `message.provenance.kind = "inter_session"`

OpenClaw 还会在被路由的提示文本前加上同一轮的 `[Inter-session message ... isUser=false]` 标记，以便当前模型调用能够区分外部会话输出和外部最终用户指令。此标记会在可用时包含源会话、渠道和工具。为兼容提供商，转录仍使用 `role: "user"`，但可见文本和来源元数据都会将该轮次标记为跨会话数据。

在上下文重建期间，OpenClaw 会将同样的标记应用到较早持久化、仅包含来源元数据的跨会话用户轮次。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对 OpenAI Responses/Codex 转录丢弃孤立的 reasoning 签名（没有后续内容块的独立 reasoning 项），并在模型路由切换后丢弃可重放的 OpenAI reasoning。
- 保留可重放的 OpenAI Responses reasoning 项 payload，包括加密的空摘要项，以便手动/WebSocket 重放能让所需的 `rs_*` 状态与助手输出项保持配对。
- 原生 ChatGPT Codex Responses 遵循 Codex wire 对等行为，在不携带先前 item ID 的情况下重放之前的 Responses reasoning/message/function payload，同时保留会话 `prompt_cache_key`。
- 不清理工具调用 ID。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重排序。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离思考签名。

**兼容 OpenAI 的 Gemma 4**

- 历史助手 thinking/reasoning 块会在重放前被剥离，因此本地兼容 OpenAI 的 Gemma 4 服务器不会收到先前轮次的 reasoning 内容。
- 当前同一轮工具调用续接会保留附加到工具调用的助手 reasoning 块，直到工具结果完成重放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格轮次交替）。
- Google 轮次排序修正（如果历史记录以助手开头，则前置一个极小的用户引导）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（兼容 Anthropic）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续用户轮次以满足严格交替要求）。
- 启用 thinking 时，会从出站 Anthropic Messages payload 中剥离末尾的助手预填轮次，包括 Cloudflare AI Gateway 网关路由。
- 缺失、为空或空白重放签名的 thinking 块会在提供商转换前被剥离。如果这会使助手轮次变空，OpenClaw 会使用非空的已省略 reasoning 文本保留轮次形状。
- 必须剥离的较旧纯 thinking 助手轮次会替换为非空的已省略 reasoning 文本，这样提供商适配器不会丢弃该重放轮次。

**Amazon Bedrock（Converse API）**

- 空助手流错误轮次会在重放前修复为非空的回退文本块。Bedrock Converse 会拒绝包含 `content: []` 的助手消息，因此带有 `stopReason: "error"` 且内容为空的已持久化助手轮次也会在加载前在磁盘上修复。
- 仅包含空白文本块的助手流错误轮次会从内存中的重放副本中删除，而不是重放无效的空白块。
- 缺失、为空或空白重放签名的 Claude thinking 块会在 Converse 重放前被剥离。如果这会使助手轮次变空，OpenClaw 会使用非空的已省略 reasoning 文本保留轮次形状。
- 必须剥离的较旧纯 thinking 助手轮次会替换为非空的已省略 reasoning 文本，这样 Converse 重放会保持严格轮次形状。
- 重放会过滤 OpenClaw delivery-mirror 和 Gateway 网关注入的助手轮次。
- 图像清理按全局规则应用。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（字母数字，长度为 9）。

**OpenRouter Gemini**

- 思考签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 启用 reasoning 时，会从已验证的 OpenRouter 兼容 OpenAI 的 Anthropic 模型 payload 中剥离末尾的助手预填轮次，以匹配直接 Anthropic 和 Cloudflare Anthropic 的重放行为。

**其他所有情况**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录清理：

- 一个 **transcript-sanitize 插件**会在每次上下文构建时运行，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- runner 也会执行特定提供商的清理，造成重复工作。
- 提供商策略之外还发生了其他变更，包括：
  - 在持久化前从助手文本中剥离 `<final>` 标签。
  - 丢弃空助手错误轮次。
  - 在工具调用后截断助手内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses` 的 `call_id|fc_id` 配对）。2026.1.22 的清理移除了该插件，将逻辑集中到 runner 中，并使 OpenAI 在图像清理之外保持**不改动**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)

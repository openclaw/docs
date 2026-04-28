---
read_when:
    - 你正在调试与会话记录结构相关的提供商请求拒绝问题
    - 你正在更改转录清理或工具调用修复逻辑
    - 你正在调查不同提供商之间的工具调用 ID 不匹配问题
summary: 参考：提供商特定的记录清理和修复规则
title: 会话记录规范
x-i18n:
    generated_at: "2026-04-28T19:38:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51459c719c6314b2980057d7e1e003e1598e8fe4a619c081aa25ce29200645a8
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 在运行前（构建模型上下文时）会对转录应用**特定于提供商的修复**。其中大多数是为了满足严格的提供商要求而使用的**内存中**调整。单独的会话文件修复过程也可能在加载会话之前重写已存储的 JSONL，要么丢弃格式错误的 JSONL 行，要么修复语法有效但已知会在重放期间被
提供商拒绝的持久化轮次。发生修复时，原始文件会备份在
会话文件旁边。

范围包括：

- 仅运行时的提示上下文不会进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思维签名清理
- Thinking 签名清理
- 图像载荷清理
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 重放的空助手错误轮次修复

如果你需要转录存储细节，请参阅：

- [会话管理深入解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时/系统上下文可以添加到某一轮的模型提示中，但它
不是最终用户编写的内容。OpenClaw 会为 Gateway 网关 回复、排队的后续消息、ACP、CLI 和嵌入式 Pi
运行保留单独面向转录的提示正文。已存储的可见用户轮次使用该转录正文，而不是
运行时增强后的提示。

对于已经持久化运行时包装器的旧版会话，Gateway 网关 历史记录
表面会在向 WebChat、
TUI、REST 或 SSE 客户端返回消息之前应用显示投影。

---

## 运行位置

所有转录卫生处理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些处理。

与转录卫生处理分开，会话文件会在加载前被修复（如果需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防因大小
限制（缩小/重新压缩过大的 base64 图像）导致提供商端拒绝。

这也有助于控制支持视觉的模型中由图像驱动的 token 压力。
较低的最大尺寸通常会减少 token 使用量；较高的尺寸会保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

在构建模型上下文之前，会丢弃同时缺少 `input` 和 `arguments` 的助手工具调用块。
这可以防止部分持久化的工具调用
（例如，在速率限制失败之后）导致提供商拒绝。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 向另一个会话发送提示时（包括
智能体到智能体的回复/公告步骤），OpenClaw 会将创建的用户轮次持久化为：

- `message.provenance.kind = "inter_session"`

OpenClaw 还会在被路由的提示文本前添加同一轮的 `[Inter-session message ... isUser=false]`
标记，让当前模型调用能够区分
外部会话输出和外部最终用户指令。该标记会在可用时包含
源会话、渠道和工具。为了提供商兼容性，转录仍使用
`role: "user"`，但可见文本和来源
元数据都会将该轮标记为跨会话数据。

在上下文重建期间，OpenClaw 会对只有来源元数据的旧持久化
跨会话用户轮次应用同样的标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对 OpenAI Responses/Codex 转录丢弃孤立的推理签名（没有后续内容块的独立推理项），并在模型路由切换后丢弃可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项载荷，包括加密的空摘要项，使手动/WebSocket 重放保留必需的 `rs_*` 状态，并与助手输出项配对。
- 不进行工具调用 ID 清理。
- 工具结果配对修复可能会移动真实匹配输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重新排序。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离思维签名。

**OpenAI 兼容的 Gemma 4**

- 历史助手 thinking/reasoning 块会在重放前被剥离，使本地
  OpenAI 兼容的 Gemma 4 服务器不会收到先前轮次的推理内容。
- 当前同一轮工具调用续接会保留附加到工具调用上的助手推理块，
  直到工具结果已被重放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修正（如果历史记录以助手开头，则前置一个很小的用户引导）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的用户轮次以满足严格交替）。
- 启用 thinking 时，会从传出的 Anthropic Messages
  载荷中剥离尾随的助手预填充轮次，包括 Cloudflare AI Gateway 路由。
- 在提供商转换前，会剥离缺失、为空或空白的重放签名的 thinking 块。如果这会清空一个助手轮次，OpenClaw 会用非空的已省略推理文本
  保留轮次形状。
- 必须被剥离的较旧仅 thinking 助手轮次会被替换为
  非空的已省略推理文本，使提供商适配器不会丢弃重放
  轮次。

**Amazon Bedrock（Converse API）**

- 空助手流错误轮次会在重放前修复为非空的后备文本块。
  Bedrock Converse 会拒绝带有 `content: []` 的助手消息，因此
  带有 `stopReason: "error"` 且内容为空的持久化助手轮次也会
  在加载前被写入磁盘修复。
- 缺失、为空或空白的重放签名的 Claude thinking 块会
  在 Converse 重放前被剥离。如果这会清空一个助手轮次，OpenClaw
  会用非空的已省略推理文本保留轮次形状。
- 必须被剥离的较旧仅 thinking 助手轮次会被替换为
  非空的已省略推理文本，使 Converse 重放保持严格的轮次形状。
- 重放会过滤 OpenClaw 交付镜像和 Gateway 网关注入的助手轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（字母数字长度 9）。

**OpenRouter Gemini**

- 思维签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 会应用多层转录卫生处理：

- 一个 **transcript-sanitize 插件**会在每次上下文构建时运行，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行特定于提供商的清理，这造成了重复工作。
- 提供商策略之外还会发生其他变更，包括：
  - 在持久化前从助手文本中剥离 `<final>` 标签。
  - 丢弃空助手错误轮次。
  - 在工具调用之后修剪助手内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 清理移除了该插件，将
逻辑集中到运行器中，并让 OpenAI 在图像清理之外**不做改动**。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)

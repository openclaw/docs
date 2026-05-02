---
read_when:
    - 你正在调试与对话记录结构相关的提供商请求拒绝问题
    - 你正在更改会话记录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 ID 不匹配问题
summary: 参考：提供商特定的会话记录清理和修复规则
title: 会话记录整理
x-i18n:
    generated_at: "2026-05-02T05:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文时）对对话记录应用**提供商特定修复**。其中大多数是**内存中**调整，用于满足严格的提供商要求。另一个单独的会话文件修复过程也可能在加载会话前重写已存储的 JSONL，方式可能是丢弃格式异常的 JSONL 行，或修复语法有效但已知会在
提供商重放期间被拒绝的持久化轮次。发生修复时，原始文件会在
会话文件旁边备份。

范围包括：

- 仅运行时使用的提示上下文不会进入用户可见的对话记录轮次
- 工具调用 id 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- Thinking 签名清理
- 图像载荷清理
- 提供商重放前的空白文本块清理
- 用户输入来源标记（用于跨会话路由提示）
- Bedrock Converse 重放的空助手错误轮次修复

如果你需要对话记录存储细节，请参阅：

- [会话管理深度解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户对话记录

可以为某个轮次将运行时/系统上下文添加到模型提示中，但它
不是终端用户创作的内容。OpenClaw 会为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 Pi
运行保留单独的面向对话记录的
提示正文。已存储的可见用户轮次会使用该对话记录正文，而不是
运行时增强后的提示。

对于已经持久化运行时包装器的旧版会话，Gateway 网关历史
界面会在向 WebChat、
TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有对话记录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些处理。

与对话记录清理分开，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防止因大小
限制导致提供商端拒绝（缩小/重新压缩过大的 base64 图像）。

这也有助于控制支持视觉的模型中由图像驱动的 token 压力。
较低的最大尺寸通常会减少 token 使用量；较高的尺寸会保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。
- 当此过程遍历重放内容时，会移除空白文本块。变为空的助手
  轮次会从重放副本中丢弃；变为空的用户轮次和工具结果
  轮次会收到一个非空的省略内容占位符。

---

## 全局规则：格式异常的工具调用

在构建模型上下文前，会丢弃同时缺少 `input` 和 `arguments` 的助手工具调用块。
这可以防止提供商因部分
持久化的工具调用而拒绝请求（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory` 中应用

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 将提示发送到另一个会话时（包括
智能体到智能体的回复/公告步骤），OpenClaw 会持久化创建的用户轮次，并包含：

- `message.provenance.kind = "inter_session"`

OpenClaw 还会在路由后的提示文本前，为同一轮次添加一个 `[Inter-session message ... isUser=false]`
标记，使当前模型调用能够区分
来自其他会话的输出与外部终端用户指令。该标记会在可用时包含
源会话、渠道和工具。为兼容提供商，对话记录仍使用
`role: "user"`，但可见文本和来源
元数据都会将该轮次标记为跨会话数据。

在上下文重建期间，OpenClaw 会对仅具有来源元数据的旧持久化
跨会话用户轮次应用相同标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses/Codex 对话记录，丢弃孤立的推理签名（没有后续内容块的独立推理项），并在模型路由切换后丢弃可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项载荷，包括加密的空摘要项，以便手动/WebSocket 重放保持必需的 `rs_*` 状态与助手输出项配对。
- 不清理工具调用 id。
- 工具结果配对修复可能会移动真实的匹配输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重排序。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离思考签名。

**OpenAI 兼容 Gemma 4**

- 历史助手思考/推理块会在重放前被剥离，避免本地
  OpenAI 兼容 Gemma 4 服务器接收前一轮的推理内容。
- 当前同一轮次的工具调用续接会保留附加在工具调用上的助手推理块，
  直到工具结果已被重放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修正（如果历史以助手开头，则前置一条极小的用户引导）。
- Antigravity Claude：规范化 Thinking 签名；丢弃未签名的 Thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续用户轮次以满足严格交替）。
- 启用 Thinking 时，会从传出的 Anthropic Messages
  载荷中剥离尾随的助手预填充轮次，包括 Cloudflare AI Gateway 路由。
- 缺失、为空或空白重放签名的 Thinking 块会在
  提供商转换前被剥离。如果这使助手轮次变为空，OpenClaw 会使用
  非空的已省略推理文本保留轮次形状。
- 必须剥离的较旧纯 Thinking 助手轮次会被替换为
  非空的已省略推理文本，以便提供商适配器不会丢弃重放
  轮次。

**Amazon Bedrock（Converse API）**

- 空助手流错误轮次会在重放前修复为非空回退文本块。
  Bedrock Converse 会拒绝 `content: []` 的助手消息，因此
  带有 `stopReason: "error"` 且内容为空的持久化助手轮次也会
  在加载前在磁盘上修复。
- 仅包含空白文本块的助手流错误轮次会从
  内存中的重放副本中丢弃，而不是重放无效的空白块。
- 缺失、为空或空白重放签名的 Claude Thinking 块会
  在 Converse 重放前被剥离。如果这使助手轮次变为空，OpenClaw
  会使用非空的已省略推理文本保留轮次形状。
- 必须剥离的较旧纯 Thinking 助手轮次会被替换为
  非空的已省略推理文本，以便 Converse 重放保持严格的轮次形状。
- 重放会过滤 OpenClaw 投递镜像和 Gateway 网关注入的助手轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于模型 id 的检测）**

- 工具调用 id 清理：strict9（字母数字，长度 9）。

**OpenRouter Gemini**

- 思考签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 启用推理时，会从已验证的 OpenRouter
  OpenAI 兼容 Anthropic 模型载荷中剥离尾随的助手预填充轮次，与
  直接 Anthropic 和 Cloudflare Anthropic 重放行为一致。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 发布之前，OpenClaw 应用了多层对话记录清理：

- 一个**对话记录清理插件**在每次上下文构建时运行，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 id（包括保留 `_`/`-` 的非严格模式）。
- 运行器还执行提供商特定清理，这造成了重复工作。
- 提供商策略之外还发生了其他变更，包括：
  - 在持久化前从助手文本中剥离 `<final>` 标签。
  - 丢弃空助手错误轮次。
  - 在工具调用后截断助手内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 清理移除了该插件，将
逻辑集中到运行器中，并使 OpenAI 除图像清理外保持**不改动**。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)

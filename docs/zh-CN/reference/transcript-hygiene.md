---
read_when:
    - 你正在调试与对话记录结构相关的提供商请求拒绝问题
    - 你正在更改会话记录清理或工具调用修复逻辑
    - 你正在调查不同提供商之间的工具调用 ID 不匹配问题
summary: 参考：特定于提供商的会话记录清理和修复规则
title: 会话记录整理
x-i18n:
    generated_at: "2026-05-03T04:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文时）对对话记录应用**提供商特定的修复**。其中大多数是**内存中**调整，用于满足严格的提供商要求。单独的会话文件修复流程也可能在加载会话前重写已存储的 JSONL，但仅限格式错误的行或无效持久记录的已持久化回合。已交付的助手回复会保留在磁盘上；提供商特定的助手预填充剥离只会在构造出站载荷时发生。发生修复时，原始文件会备份在会话文件旁边。

范围包括：

- 仅运行时的提示上下文不进入用户可见的对话记录回合
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 回合验证 / 排序
- Thought 签名清理
- Thinking 签名清理
- 图像载荷清理
- 提供商重放前清理空白文本块
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 重放的空助手错误回合修复

如果你需要对话记录存储详情，请参阅：

- [会话管理深度解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户对话记录

运行时/系统上下文可以添加到某个回合的模型提示中，但它不是终端用户创作的内容。OpenClaw 会为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 Pi 运行保留单独面向对话记录的提示正文。已存储的可见用户回合使用该对话记录正文，而不是包含运行时增强内容的提示。

对于已经持久化运行时包装器的旧版会话，Gateway 网关历史记录界面会在向 WebChat、TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有对话记录卫生处理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定要应用哪些处理。

与对话记录卫生处理分开，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防提供商端因大小限制而拒绝（对过大的 base64 图像进行降采样/重新压缩）。

这也有助于控制支持视觉的模型中由图像驱动的 token 压力。较低的最大尺寸通常会减少 token 使用量；较高的尺寸会保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认：`1200`）。
- 当此流程遍历重放内容时，会移除空白文本块。变为空的助手回合会从重放副本中删除；变为空的用户和工具结果回合会收到非空的已省略内容占位符。

---

## 全局规则：格式错误的工具调用

在构建模型上下文之前，会删除同时缺少 `input` 和 `arguments` 的助手工具调用块。这可以防止提供商因部分持久化的工具调用而拒绝请求（例如，在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory` 应用

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 向另一个会话发送提示时（包括智能体到智能体的回复/公告步骤），OpenClaw 会持久化创建的用户回合并设置：

- `message.provenance.kind = "inter_session"`

OpenClaw 还会在路由后的提示文本前添加同一回合的 `[Inter-session message ... isUser=false]` 标记，使活跃模型调用能够区分外部会话输出和外部终端用户指令。此标记在可用时包含源会话、渠道和工具。为兼容提供商，对话记录仍使用 `role: "user"`，但可见文本和来源元数据都会将该回合标记为跨会话数据。

在上下文重建期间，OpenClaw 会对仅有来源元数据的较旧持久化跨会话用户回合应用同一标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对 OpenAI Responses/Codex 对话记录，删除孤立的 reasoning 签名（后面没有内容块的独立 reasoning 项），并在模型路由切换后删除可重放的 OpenAI reasoning。
- 保留可重放的 OpenAI Responses reasoning 项载荷，包括加密的空摘要项，以便手动/WebSocket 重放保留与助手输出项配对所需的 `rs_*` 状态。
- 不清理工具调用 ID。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行回合验证或重排。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离 thought 签名。

**OpenAI 兼容的 Gemma 4**

- 历史助手 thinking/reasoning 块会在重放前被剥离，因此本地 OpenAI 兼容 Gemma 4 服务器不会收到前序回合的 reasoning 内容。
- 当前同一回合的工具调用延续会保留附加到工具调用的助手 reasoning 块，直到工具结果已被重放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 回合验证（Gemini 风格的回合交替）。
- Google 回合排序修正（如果历史记录以助手开头，则前置一个微小的用户 bootstrap）。
- Antigravity Claude：规范化 thinking 签名；删除未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 回合验证（合并连续用户回合以满足严格交替）。
- 当启用 thinking 时，尾部助手预填充回合会从出站 Anthropic Messages 载荷中剥离，包括 Cloudflare AI Gateway 网关路由。
- 在提供商转换之前，会剥离缺失、为空或空白重放签名的 thinking 块。如果这使助手回合变为空，OpenClaw 会使用非空的已省略 reasoning 文本保留回合形状。
- 必须剥离的较旧纯 thinking 助手回合会替换为非空的已省略 reasoning 文本，这样提供商适配器不会丢弃重放回合。

**Amazon Bedrock（Converse API）**

- 空助手流错误回合会在重放前修复为非空后备文本块。Bedrock Converse 会拒绝 `content: []` 的助手消息，因此带有 `stopReason: "error"` 且内容为空的持久化助手回合也会在加载前在磁盘上修复。
- 仅包含空白文本块的助手流错误回合会从内存重放副本中删除，而不是重放无效的空白块。
- 在 Converse 重放前，会剥离缺失、为空或空白重放签名的 Claude thinking 块。如果这使助手回合变为空，OpenClaw 会使用非空的已省略 reasoning 文本保留回合形状。
- 必须剥离的较旧纯 thinking 助手回合会替换为非空的已省略 reasoning 文本，以便 Converse 重放保持严格回合形状。
- 重放会过滤 OpenClaw 交付镜像和 Gateway 网关注入的助手回合。
- 图像清理通过全局规则应用。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（字母数字，长度 9）。

**OpenRouter Gemini**

- Thought 签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 当启用 reasoning 时，经验证的 OpenRouter OpenAI 兼容 Anthropic 模型载荷会剥离尾部助手预填充回合，与直接 Anthropic 和 Cloudflare Anthropic 重放行为一致。

**其他所有提供商**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层对话记录卫生处理：

- 每次构建上下文时都会运行一个**对话记录清理插件**，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行提供商特定的清理，造成重复工作。
- 其他变更发生在提供商策略之外，包括：
  - 在持久化前从助手文本中剥离 `<final>` 标签。
  - 删除空助手错误回合。
  - 在工具调用后裁剪助手内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses` 的 `call_id|fc_id` 配对）。2026.1.22 清理移除了该插件，将逻辑集中到运行器中，并让 OpenAI 除图像清理外保持**不触碰**。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)

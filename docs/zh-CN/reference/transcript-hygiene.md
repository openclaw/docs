---
read_when:
    - 你正在调试与对话记录结构相关的提供商请求拒绝问题
    - 你正在更改对话记录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 ID 不匹配问题
summary: 参考：特定提供商的会话记录清理和修复规则
title: 会话记录整理
x-i18n:
    generated_at: "2026-05-10T19:48:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文时）对转录记录应用**提供商特定修复**。其中大多数是为满足严格提供商要求而使用的**内存中**调整。单独的会话文件修复流程也可能在加载会话前重写已存储的 JSONL，但只针对格式错误的行或作为持久记录无效的已持久化轮次。已交付的助手回复会保留在磁盘上；提供商特定的助手预填充剥离只会在构造出站载荷时发生。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 仅运行时提示词上下文不进入用户可见的转录记录轮次
- 工具调用 ID 清理
- 工具调用输入校验
- 工具结果配对修复
- 轮次校验 / 排序
- 思维签名清理
- Thinking 签名清理
- 图像载荷清理
- 提供商重放前清理空白文本块
- 用户输入来源标记（用于跨会话路由提示词）
- Bedrock Converse 重放的空助手错误轮次修复

如果你需要转录记录存储细节，请参阅：

- [会话管理深度解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录记录

运行时/系统上下文可以添加到某个轮次的模型提示词中，但它不是
最终用户撰写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 Pi
运行保留单独面向转录记录的提示词正文。已存储的可见用户轮次使用该转录记录正文，而不是
经过运行时增强的提示词。

对于已经持久化运行时包装器的旧版会话，Gateway 网关历史
界面会在向 WebChat、TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有转录记录卫生处理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些处理。

独立于转录记录卫生处理，会话文件会在加载前（如有需要）被修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防因大小限制而被提供商端拒绝
（缩小/重新压缩过大的 base64 图像）。

这也有助于控制支持视觉的模型由图像驱动的 token 压力。
较低的最大尺寸通常会减少 token 用量；较高的尺寸会保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。
- 此流程遍历重放内容时会移除空白文本块。变为空的助手
  轮次会从重放副本中删除；变为空的用户和工具结果
  轮次会收到非空的省略内容占位符。

---

## 全局规则：格式错误的工具调用

在构建模型上下文前，会丢弃同时缺少 `input` 和 `arguments` 的助手工具调用块。
这可防止提供商因部分持久化的工具调用而拒绝请求（例如，在速率限制失败后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send`（包括智能体到智能体的回复/公告步骤）向另一个会话发送提示词时，OpenClaw 会持久化创建的用户轮次，并带有：

- `message.provenance.kind = "inter_session"`

OpenClaw 还会在路由后的提示词文本前添加同轮次的 `[Inter-session message ... isUser=false]`
标记，以便活动模型调用能够区分外部会话输出和外部最终用户指令。此标记在可用时会包括
源会话、渠道和工具。为保持提供商兼容性，转录记录仍使用
`role: "user"`，但可见文本和来源元数据都会将该轮次标记为跨会话数据。

在上下文重建期间，OpenClaw 会对较早持久化的、只有来源元数据的
跨会话用户轮次应用相同标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图像清理。
- 对 OpenAI Responses/Codex 转录记录，丢弃孤立的推理签名（后面没有内容块的独立推理项），并在模型路由切换后丢弃可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项载荷，包括加密的空摘要项，以便手动/WebSocket 重放保持所需的 `rs_*` 状态与助手输出项配对。
- Native ChatGPT Codex Responses 遵循 Codex 传输一致性，在不带先前项 ID 的情况下重放先前的 Responses 推理/消息/函数载荷，同时保留会话 `prompt_cache_key`。
- 不进行工具调用 ID 清理。
- 工具结果配对修复可能移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次校验或重新排序。
- 会将缺失的 OpenAI Responses 系列工具输出合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离思维签名。

**OpenAI 兼容的 Chat Completions**

- 历史助手 thinking/reasoning 块会在重放前被剥离，使
  本地和代理风格的 OpenAI 兼容服务器不会收到先前轮次的
  `reasoning` 或 `reasoning_content` 等推理字段。
- 当前同轮次工具调用延续会保留附加到工具调用上的助手推理块，
  直到工具结果已被重放。
- 提供商拥有的例外可以在其传输协议要求
  重放推理元数据时选择退出。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次校验（Gemini 风格的轮次交替）。
- Google 轮次排序修正（如果历史以助手开头，则前置一个很小的用户引导）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次校验（合并连续用户轮次以满足严格交替）。
- 启用 thinking 时，会从出站 Anthropic Messages
  载荷中剥离尾随助手预填充轮次，包括 Cloudflare AI Gateway 网关路由。
- 在提供商转换前，会剥离缺失、为空或空白重放签名的 Thinking 块。
  如果这会清空一个助手轮次，OpenClaw 会用非空的省略推理文本
  保持轮次形状。
- 必须被剥离的较旧纯 thinking 助手轮次会替换为
  非空的省略推理文本，使提供商适配器不会丢弃该重放
  轮次。

**Amazon Bedrock（Converse API）**

- 空助手流错误轮次会在重放前修复为非空回退文本块。
  Bedrock Converse 会拒绝带有 `content: []` 的助手消息，因此
  带有 `stopReason: "error"` 且内容为空的已持久化助手轮次也会
  在加载前在磁盘上修复。
- 只包含空白文本块的助手流错误轮次会从内存中的重放副本中
  丢弃，而不是重放无效的空白块。
- 在 Converse 重放前，会剥离缺失、为空或空白重放签名的
  Claude thinking 块。如果这会清空一个助手轮次，OpenClaw
  会用非空的省略推理文本保持轮次形状。
- 必须被剥离的较旧纯 thinking 助手轮次会替换为
  非空的省略推理文本，使 Converse 重放保持严格的轮次形状。
- 重放会过滤 OpenClaw 交付镜像和 Gateway 网关注入的助手轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- 思维签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 启用 reasoning 时，会从已验证的 OpenRouter
  OpenAI 兼容 Anthropic 模型载荷中剥离尾随助手预填充轮次，匹配
  直接 Anthropic 和 Cloudflare Anthropic 重放行为。

**其他所有情况**

- 仅进行图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录记录卫生处理：

- 一个**转录记录清理插件**会在每次上下文构建时运行，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- 运行器还执行提供商特定的清理，这会重复处理。
- 提供商策略之外还会发生额外变更，包括：
  - 在持久化前从助手文本中剥离 `<final>` 标签。
  - 丢弃空助手错误轮次。
  - 在工具调用后截断助手内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 清理移除了该插件，将
逻辑集中到运行器中，并使 OpenAI 除图像清理外保持**不触碰**。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)

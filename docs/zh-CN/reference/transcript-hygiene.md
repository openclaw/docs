---
read_when:
    - 你正在调试与对话记录结构相关的提供商请求拒绝问题
    - 你正在更改转录内容清理或工具调用修复逻辑
    - 你正在调查不同提供商之间的工具调用 ID 不匹配问题
summary: 参考：特定提供商的转录清理与修复规则
title: 转录记录整理
x-i18n:
    generated_at: "2026-07-11T20:56:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文时）对转录内容应用**特定于提供商的修复**。其中大多数是为满足提供商的严格要求而进行的**内存内**调整。单独的会话文件修复流程也可能在加载会话前重写已存储的 JSONL，但仅限于格式错误的行或属于无效持久记录的已持久化轮次。已交付的助手回复会保留在磁盘上；特定于提供商的助手预填充内容移除仅在构建出站载荷时进行。

发生修复时，原始文件会先写入同级的临时
`*.bak-<pid>-<ts>` 文件，然后再执行原子替换；替换成功后会删除该备份。仅当清理本身失败时才会保留备份，并在这种情况下返回其路径。

范围包括：

- 防止仅供运行时使用的提示词上下文进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证/排序
- 思维签名清理
- 推理签名清理
- 图像载荷清理
- 提供商重放前的空白文本块清理
- 提供商重放前的不完整纯推理长度限制轮次清理
- 用户输入来源标记（用于跨会话路由的提示词）
- Bedrock Converse 重放时的空助手错误轮次修复

如需了解转录存储的详细信息，请参阅
[会话管理深入解析](/zh-CN/reference/session-management-compaction)。

---

## 全局规则：运行时上下文不是用户转录内容

可以将运行时/系统上下文添加到某个轮次的模型提示词中，但它不是终端用户创作的内容。OpenClaw 为 Gateway 网关回复、排队的后续消息、ACP、CLI 和嵌入式 OpenClaw 运行保留单独的面向转录内容的提示词正文。存储的可见用户轮次使用该转录正文，而不是经过运行时扩充的提示词。

对于已经持久化运行时包装内容的旧版会话，Gateway 网关历史记录接口会在向 WebChat、TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有转录内容清理均集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`，以 `provider`、`modelApi` 和 `modelId` 为键）
- 清理/修复应用：`src/agents/embedded-agent-runner/replay-history.ts`
  中的 `sanitizeSessionHistory`

会话文件修复独立于转录内容清理，并在加载前按需执行：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 由 `src/agents/embedded-agent-runner/run/attempt.ts` 和
  `src/agents/embedded-agent-runner/compact.ts` 调用

---

## 全局规则：图像清理

始终会清理图像载荷，以防因大小限制而被提供商拒绝（缩小尺寸/重新压缩过大的 base64 图像）。这也有助于控制视觉模型中由图像引起的 token 压力：较小的最大尺寸可减少 token 使用量，较大的尺寸则能保留更多细节。

实现：

- `src/agents/embedded-agent-helpers/images.ts` 中的
  `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 可通过 `agents.defaults.imageMaxDimensionPx` 配置图像最大边长
  （默认值：`1200`）
- 此流程遍历重放内容时也会移除空白文本块。
  如果助手轮次因此变为空，则从重放副本中丢弃；如果用户轮次和工具结果轮次变为空，
  则会收到一个非空的内容已省略占位符。

---

## 全局规则：格式错误的工具调用

在构建模型上下文前，会丢弃同时缺少 `input` 和 `arguments` 的助手工具调用块。这样可以避免提供商拒绝只持久化了一部分的工具调用（例如发生速率限制失败后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `sanitizeSessionHistory`
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## 全局规则：不完整的纯推理轮次

如果助手轮次触及提供商输出限制，且仅包含思考或已遮盖的思考内容，则会从内存中的重放副本中省略。此类轮次包含不完整的提供商状态，并且可能携带不完整的推理签名。

空的长度限制轮次保持不变；包含可见文本、工具调用或未知内容块的长度限制轮次也保持不变。不会重写已存储的转录内容。

实现：`src/agents/embedded-agent-runner/replay-history.ts` 中的
`normalizeAssistantReplayContent`

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 将提示词发送到另一个会话时（包括智能体间的回复/通知步骤），OpenClaw 会将创建的用户轮次持久化，并设置 `message.provenance.kind = "inter_session"`。

OpenClaw 还会在路由后的提示词文本前添加同轮次的 `[跨会话消息] ... isUser=false` 标记，使当前模型调用可以区分其他会话的输出与外部终端用户指令。该标记会在可用时包含来源会话、渠道和工具。为了兼容提供商，转录内容仍使用 `role: "user"`，但可见文本和来源元数据都会将该轮次标记为跨会话数据。

重建上下文时，OpenClaw 也会对仅具有来源元数据的旧版已持久化跨会话用户轮次应用相同标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅清理图像。
- 对 OpenAI Responses/Codex 转录内容，丢弃孤立的推理签名（后面没有内容块的独立推理项）；切换模型路由后，也会丢弃可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项载荷，包括具有加密空摘要的项目，使手动/WebSocket 重放可将所需的 `rs_*` 状态与助手输出项保持配对。
- 原生 ChatGPT Codex Responses 遵循 Codex 线路协议一致性，在不包含先前项目 ID 的情况下重放之前的 Responses 推理/消息/函数载荷，同时保留会话的 `prompt_cache_key`。
- OpenAI Responses 系列重放会保留规范的 `call_*|fc_*` 同模型推理配对，但在转换为 pi-ai 载荷前，会以确定性方式规范化格式错误或过长的 `call_id`/函数调用项 ID。
- 工具结果配对修复可能会移动真正匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重新排序；不移除思维签名。

**OpenAI 兼容的 Chat Completions**

- 重放前会移除历史助手思考/推理块，避免本地和代理式 OpenAI 兼容服务器收到先前轮次中的 `reasoning` 或 `reasoning_content` 等推理字段。
- 当前同轮次的工具调用延续会使助手推理块继续附加到工具调用，直至工具结果完成重放。
- 设置了 `reasoning: true` 的自定义/自托管模型条目会保留重放的推理元数据。
- 当提供商的线路协议要求重放推理元数据时，该提供商拥有的例外规则可以选择退出此行为。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格限制为字母和数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修复（如果历史记录以助手轮次开头，则在前面添加一条极短的用户引导消息）。
- Antigravity Claude：规范化推理签名；丢弃无签名的思考块。

**Anthropic / Minimax（兼容 Anthropic）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的用户轮次以满足严格交替要求）。
- 启用思考时，会从出站 Anthropic Messages 载荷中移除末尾的助手预填充轮次，包括 Cloudflare AI Gateway 网关路由。
- 会话经过压缩后，会在提供商重放前移除压缩前助手的推理签名。生成推理签名时，它们在密码学上与对话前缀绑定；压缩后前缀会发生变化（摘要内容取代原始内容），因此重放原始签名会导致 Anthropic 以 “Invalid signature in thinking block” 拒绝请求。思考文本会作为无签名块保留，然后由下述规则处理。
- 在转换为提供商格式前，会移除重放签名缺失、为空或仅含空白的思考块。如果这导致助手轮次变为空，OpenClaw 会使用非空的推理已省略文本维持轮次结构。
- 对于必须移除的旧版纯思考助手轮次，会使用非空的推理已省略文本替换，以防提供商适配器丢弃该重放轮次。

**Amazon Bedrock（Converse API）**

- 重放前，会将空的助手流式错误轮次修复为非空的后备文本块。Bedrock Converse 会拒绝 `content: []` 的助手消息，因此对于已持久化且 `stopReason:
"error"`、内容为空的助手轮次，也会在加载前于磁盘上进行修复。
- 如果助手流式错误轮次仅包含空白文本块，则会从内存中的重放副本中丢弃，而不是重放无效的空白块。
- 会话经过压缩后，会在 Converse 重放前移除压缩前助手的推理签名，原因与上述 Anthropic 相同。
- 会在 Converse 重放前移除重放签名缺失、为空或仅含空白的 Claude 思考块。如果这导致助手轮次变为空，OpenClaw 会使用非空的推理已省略文本维持轮次结构。
- 对于必须移除的旧版纯思考助手轮次，会使用非空的推理已省略文本替换，使 Converse 重放保持严格的轮次结构。
- 重放会过滤 OpenClaw 交付镜像助手轮次和 Gateway 网关注入的助手轮次。
- 按照全局规则应用图像清理。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（字母和数字，长度为 9）。

**OpenRouter Gemini**

- 思维签名清理：移除非 base64 的 `thought_signature` 值（保留 base64 值）。

**OpenRouter Anthropic**

- 启用推理时，会从经过验证的 OpenRouter OpenAI 兼容 Anthropic 模型载荷中移除末尾的助手预填充轮次，与直接使用 Anthropic 和 Cloudflare Anthropic 时的重放行为保持一致。

**其他所有提供商**

- 仅清理图像。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 会应用多层转录内容清理：

- 每次构建上下文时都会运行一个**转录内容清理扩展**，它可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行特定于提供商的清理，造成重复处理。
- 提供商策略之外还会发生其他修改，包括在持久化前移除助手文本中的 `<final>` 标签、丢弃空的助手错误轮次，以及裁剪工具调用后的助手内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses` 的 `call_id|fc_id` 配对问题）。2026.1.22 的清理移除了该扩展，将逻辑集中到运行器中，并使 OpenAI 除图像清理外**完全不做修改**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话修剪](/zh-CN/concepts/session-pruning)

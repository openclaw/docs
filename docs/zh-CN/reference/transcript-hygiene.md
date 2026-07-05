---
read_when:
    - 你正在调试与转录形态相关的提供商请求拒绝
    - 你正在更改转录清理或工具调用修复逻辑
    - 你正在调查各提供商之间的工具调用 ID 不匹配问题
summary: 参考：特定于提供商的转录记录清理和修复规则
title: 转录记录清理
x-i18n:
    generated_at: "2026-07-05T11:41:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw 会在运行前（构建模型上下文时）对转录应用**特定于提供商的修复**。其中大多数是为了满足严格提供商要求而使用的**内存中**调整。单独的会话文件修复流程也可能在加载会话前重写已存储的 JSONL，但仅限格式错误的行或无效持久记录的已持久化轮次。已送达的助手回复会保留在磁盘上；特定于提供商的助手预填充剥离只会在构造出站载荷时发生。

发生修复时，原始文件会先写入一个临时的 `*.bak-<pid>-<ts>` 同级文件，再执行原子替换；替换成功后会移除该备份。只有当清理本身失败时才会保留备份，并在这种情况下回传该路径。

范围包括：

- 仅运行时的提示上下文不进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- Thinking 签名清理
- 图像载荷清理
- 提供商重放前的空白文本块清理
- 提供商重放前的不完整仅推理长度轮次清理
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 重放的空助手错误轮次修复

如果你需要转录存储细节，请参阅
[会话管理深入解析](/zh-CN/reference/session-management-compaction)。

---

## 全局规则：运行时上下文不是用户转录

运行时/系统上下文可以添加到某一轮的模型提示中，但它不是最终用户编写的内容。OpenClaw 会为 Gateway 网关回复、排队的跟进消息、ACP、CLI 和嵌入式 OpenClaw 运行保留一个单独的面向转录的提示正文。存储的可见用户轮次使用该转录正文，而不是运行时增强后的提示。

对于已经持久化运行时包装器的旧版会话，Gateway 网关历史表面会在向 WebChat、TUI、REST 或 SSE 客户端返回消息前应用显示投影。

---

## 运行位置

所有转录卫生处理都集中在嵌入式 runner 中：

- 策略选择：`src/agents/transcript-policy.ts`
  （`resolveTranscriptPolicy`，按 `provider`、`modelApi` 和 `modelId` 作为键）
- 清理/修复应用：`src/agents/embedded-agent-runner/replay-history.ts` 中的
  `sanitizeSessionHistory`

与转录卫生处理分开，会话文件会在加载前进行修复（如有需要）：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `src/agents/embedded-agent-runner/run/attempt.ts` 和
  `src/agents/embedded-agent-runner/compact.ts` 调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防因大小限制导致提供商端拒绝（对过大的 base64 图像进行缩放/重新压缩）。这也有助于控制支持视觉的模型中由图像驱动的 token 压力：较低的最大尺寸会减少 token 用量，较高的尺寸会保留细节。

实现：

- `src/agents/embedded-agent-helpers/images.ts` 中的
  `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置
  （默认值：`1200`）
- 此流程遍历重放内容时会移除空白文本块。
  变为空的助手轮次会从重放副本中丢弃；变为空的用户轮次和工具结果轮次会收到一个非空的省略内容占位符。

---

## 全局规则：格式错误的工具调用

在构建模型上下文前，会丢弃同时缺少 `input` 和 `arguments` 的助手工具调用块。这可以防止部分持久化的工具调用导致提供商拒绝（例如，在速率限制失败后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `sanitizeSessionHistory`
  （`src/agents/embedded-agent-runner/replay-history.ts`）

---

## 全局规则：不完整的仅推理轮次

如果助手轮次达到提供商输出限制，并且只包含 thinking 或 redacted-thinking 内容，则会从内存中的重放副本中省略。此类轮次包含不完整的提供商状态，并且可能携带部分 thinking 签名。

空长度轮次保持不变，带有可见文本、工具调用或未知内容块的长度轮次也保持不变。存储的转录不会被重写。

实现：`src/agents/embedded-agent-runner/replay-history.ts` 中的
`normalizeAssistantReplayContent`

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 向另一个会话发送提示时（包括智能体到智能体的回复/公告步骤），OpenClaw 会持久化创建的用户轮次，并设置 `message.provenance.kind = "inter_session"`。

OpenClaw 还会在被路由的提示文本前添加同一轮 `[Inter-session message] ... isUser=false` 标记，使当前模型调用能够区分外部会话输出和外部最终用户指令。可用时，此标记会包含来源会话、渠道和工具。为兼容提供商，转录仍使用 `role: "user"`，但可见文本和来源元数据都会将该轮次标记为跨会话数据。

上下文重建期间，OpenClaw 会对仅包含来源元数据的较早持久化跨会话用户轮次应用相同标记。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对 OpenAI Responses/Codex 转录，丢弃孤立的推理签名（没有后续内容块的独立推理项），并在模型路由切换后丢弃可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项载荷，包括加密的空摘要项，以便手动/WebSocket 重放保留与助手输出项配对所需的 `rs_*` 状态。
- 原生 ChatGPT Codex Responses 遵循 Codex 线路一致性，在不带先前项目 ID 的情况下重放先前的 Responses 推理/消息/函数载荷，同时保留会话 `prompt_cache_key`。
- OpenAI Responses 系列重放会保留规范的 `call_*|fc_*` 同模型推理配对，但在 pi-ai 载荷转换前，会确定性地规范化格式错误或过长的 `call_id`/函数调用项 ID。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次验证或重排序；不剥离思考签名。

**OpenAI 兼容 Chat Completions**

- 历史助手 thinking/reasoning 块会在重放前被剥离，使本地和代理风格的 OpenAI 兼容服务器不会收到先前轮次的推理字段，例如 `reasoning` 或 `reasoning_content`。
- 当前同一轮的工具调用续接会保留附加到工具调用的助手推理块，直到工具结果已被重放。
- 带有 `reasoning: true` 的自定义/自托管模型条目会保留重放的推理元数据。
- 当提供商自有例外的线路协议需要重放推理元数据时，可以选择退出。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修复（如果历史以助手开头，则前置一个微型用户引导）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续用户轮次以满足严格交替）。
- 当启用 thinking 时，会从出站 Anthropic Messages 载荷中剥离尾随的助手预填充轮次，包括 Cloudflare AI Gateway 网关路由。
- 会话已压缩时，提供商重放前会剥离压缩前的助手 thinking 签名。Thinking 签名在生成时以加密方式绑定到对话前缀；压缩后前缀会变化（摘要内容替代原始内容），因此重放原始签名会导致 Anthropic 拒绝请求，并返回 “Invalid signature in thinking block”。Thinking 文本会作为未签名块保留，然后由下面的规则处理。
- 缺失、为空或空白的重放签名对应的 thinking 块会在提供商转换前被剥离。如果这会使助手轮次变为空，OpenClaw 会保留轮次形状，并填入非空的省略推理文本。
- 必须被剥离的较旧仅 thinking 助手轮次会替换为非空的省略推理文本，使提供商适配器不会丢弃该重放轮次。

**Amazon Bedrock（Converse API）**

- 空的助手流错误轮次会在重放前修复为非空的回退文本块。Bedrock Converse 会拒绝带有 `content: []` 的助手消息，因此带有 `stopReason:
"error"` 且内容为空的已持久化助手轮次也会在加载前在磁盘上修复。
- 仅包含空白文本块的助手流错误轮次会从内存中的重放副本中丢弃，而不是重放无效的空白块。
- 会话已压缩时，Converse 重放前会剥离压缩前的助手 thinking 签名，原因与上面的 Anthropic 相同。
- 缺失、为空或空白的重放签名对应的 Claude thinking 块会在 Converse 重放前被剥离。如果这会使助手轮次变为空，OpenClaw 会保留轮次形状，并填入非空的省略推理文本。
- 必须被剥离的较旧仅 thinking 助手轮次会替换为非空的省略推理文本，使 Converse 重放保持严格轮次形状。
- 重放会过滤 OpenClaw 送达镜像和 Gateway 网关注入的助手轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于模型 ID 的检测）**

- 工具调用 ID 清理：strict9（字母数字，长度 9）。

**OpenRouter Gemini**

- 思考签名清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 当启用推理时，会从已验证的 OpenRouter OpenAI 兼容 Anthropic 模型载荷中剥离尾随的助手预填充轮次，与直接 Anthropic 和 Cloudflare Anthropic 重放行为一致。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录卫生处理：

- 一个 **transcript-sanitize 扩展**在每次上下文构建时运行，并且可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 ID（包括保留 `_`/`-` 的非严格模式）。
- runner 也会执行特定于提供商的清理，导致工作重复。
- 其他变更发生在提供商策略之外，包括在持久化前从助手文本中剥离 `<final>` 标签、丢弃空助手错误轮次，以及在工具调用后裁剪助手内容。

这种复杂性造成了跨提供商回归（尤其是 `openai-responses` 的 `call_id|fc_id` 配对）。2026.1.22 清理移除了该扩展，将逻辑集中到 runner 中，并让 OpenAI 在图像清理之外保持**不触碰**。

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话剪枝](/zh-CN/concepts/session-pruning)

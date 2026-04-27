---
read_when:
    - 你正在调试与转录内容结构相关的提供商请求拒绝问题
    - 你正在更改转录内容清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 ID 不匹配问题
summary: 参考：特定提供商的转录清理和修复规则
title: 转录内容卫生规范
x-i18n:
    generated_at: "2026-04-27T23:00:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32242fe22101e83906881fb66b89f2555cab8559f5f6f73308d94dec068c8088
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

OpenClaw 会在运行前（构建模型上下文时）对转录内容应用**特定提供商的修复**。其中大多数是用于满足严格提供商要求的**内存中**调整。另有一个独立的会话文件修复过程，也可能在加载会话前重写已存储的 JSONL：要么丢弃格式错误的 JSONL 行，要么修复那些在语法上有效、但已知会在回放期间被提供商拒绝的持久化轮次。
当发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- 仅运行时的提示上下文，不进入用户可见的转录轮次
- 工具调用 ID 清理
- 工具调用输入校验
- 工具结果配对修复
- 轮次校验 / 排序
- 思考签名清理
- thinking 签名清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由的提示）
- Bedrock Converse 回放中的空 assistant 错误轮次修复

如果你需要转录存储细节，请参阅：

- [会话管理深入解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录内容

运行时 / system 上下文可以添加到某个轮次的模型提示中，但它不是最终用户创作的内容。OpenClaw 会为 Gateway 网关回复、排队的后续操作、ACP、CLI 和嵌入式 Pi 运行保留一个独立的、面向转录的提示正文。已存储的可见用户轮次使用该转录正文，而不是经过运行时增强的提示。

对于已经持久化运行时包装器的旧版会话，Gateway 网关历史记录界面会在将消息返回给 WebChat、TUI、REST 或 SSE 客户端之前应用显示投影。

---

## 运行位置

所有转录内容卫生规范都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理 / 修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些处理。

与转录内容卫生规范分开的是，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像负载始终会被清理，以防止因大小限制导致提供商侧拒绝（对过大的 base64 图像进行缩放 / 重新压缩）。

这也有助于控制由图像驱动的 token 压力，适用于支持视觉的模型。
较小的最大图像尺寸通常会减少 token 使用量；较大的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。

---

## 全局规则：格式错误的工具调用

在构建模型上下文之前，缺少 `input` 和 `arguments` 的 assistant 工具调用块会被丢弃。
这可以防止提供商因部分持久化的工具调用而拒绝请求（例如，在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 将提示发送到另一个会话时（包括智能体到智能体的 reply / announce 步骤），OpenClaw 会将创建的用户轮次持久化，并附带：

- `message.provenance.kind = "inter_session"`

此元数据会在追加到转录内容时写入，不会改变角色
（出于提供商兼容性，`role: "user"` 保持不变）。转录读取器可以据此避免将这些路由的内部提示视为最终用户创作的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次添加一个简短的 `[Inter-session message]`
标记，以便模型将它们与外部最终用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses / Codex 转录内容，丢弃孤立的 reasoning 签名（后面没有内容块的独立 reasoning 条目），并在模型路由切换后丢弃可回放的 OpenAI reasoning。
- 保留可回放的 OpenAI Responses reasoning 条目负载，包括加密的空摘要条目，以便手动 / WebSocket 回放保留与 assistant 输出条目配对所需的 `rs_*` 状态。
- 不进行工具调用 ID 清理。
- 工具结果配对修复可能会移动真正匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不进行轮次校验或重排。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 回放规范化。
- 不移除 thought 签名。

**OpenAI-compatible Gemma 4**

- 在回放前移除历史 assistant thinking / reasoning 块，以便本地 OpenAI-compatible Gemma 4 服务器不会收到先前轮次的 reasoning 内容。
- 当前同轮次的工具调用延续会保留附加到工具调用上的 assistant reasoning 块，直到工具结果已被回放。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 ID 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次校验（Gemini 风格的轮次交替）。
- Google 轮次顺序修复（如果历史记录以 assistant 开始，则预置一个很小的 user 引导消息）。
- Antigravity Claude：规范化 thinking 签名；丢弃未签名的 thinking 块。

**Anthropic / Minimax（Anthropic-compatible）**

- 工具结果配对修复和合成工具结果。
- 轮次校验（合并连续的 user 轮次以满足严格交替要求）。
- 启用 thinking 时，会从发往 Anthropic Messages 负载中移除尾部 assistant 预填充轮次，包括 Cloudflare AI Gateway 路由。
- 缺少、为空或仅空白的回放签名的 thinking 块，会在提供商转换前被移除。如果这导致 assistant 轮次为空，OpenClaw 会使用非空的省略 reasoning 文本来保留轮次结构。
- 必须被移除的旧版纯 thinking assistant 轮次，会被替换为非空的省略 reasoning 文本，以便提供商适配器不会丢弃该回放轮次。

**Amazon Bedrock（Converse API）**

- 空的 assistant 流式错误轮次会在回放前修复为非空的回退文本块。Bedrock Converse 会拒绝 `content: []` 的 assistant 消息，因此，已持久化且 `stopReason: "error"` 并带有空内容的 assistant 轮次，也会在加载前于磁盘上修复。
- 缺少、为空或仅空白的回放签名的 Claude thinking 块，会在 Converse 回放前被移除。如果这导致 assistant 轮次为空，OpenClaw 会使用非空的省略 reasoning 文本来保留轮次结构。
- 必须被移除的旧版纯 thinking assistant 轮次，会被替换为非空的省略 reasoning 文本，以便 Converse 回放保持严格的轮次结构。
- 回放会过滤掉 OpenClaw 投递镜像和 Gateway 网关注入的 assistant 轮次。
- 图像清理通过全局规则生效。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 ID 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- thought 签名清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录内容卫生规范：

- 一个**转录清理扩展**会在每次构建上下文时运行，并且可以：
  - 修复工具使用 / 结果配对。
  - 清理工具调用 ID（包括保留 `_` / `-` 的非严格模式）。
- 运行器也会执行特定提供商的清理，这造成了重复处理。
- 提供商策略之外还存在额外的变更，包括：
  - 在持久化前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用之后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归问题（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理工作移除了该扩展，将逻辑集中到运行器中，并使 OpenAI 除图像清理外保持**不做额外处理**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)

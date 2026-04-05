---
read_when:
    - 你正在调试与转录形状相关的提供商请求拒绝问题
    - 你正在修改转录清理或工具调用修复逻辑
    - 你正在调查跨提供商的工具调用 id 不匹配问题
summary: 参考：提供商专用的转录清理与修复规则
title: 转录清理
x-i18n:
    generated_at: "2026-04-05T10:08:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# 转录清理（提供商修复）

本文档描述了在一次运行之前应用到转录上的**提供商专用修复**（构建模型上下文时）。这些是用于满足严格提供商要求的**内存中**调整。这些清理步骤**不会**重写磁盘上存储的 JSONL 转录；不过，在会话加载之前，单独的会话文件修复过程可能会通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会在会话文件旁边进行备份。

范围包括：

- 工具调用 id 清理
- 工具调用输入校验
- 工具结果配对修复
- 轮次校验 / 排序
- thought signature 清理
- 图像负载清理
- 用户输入来源标记（用于跨会话路由的提示词）

如果你需要转录存储的详细信息，请参见：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 运行位置

所有转录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/google.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录清理分开的是，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）中调用

---

## 全局规则：图像清理

图像负载始终会被清理，以防因大小限制导致提供商侧拒绝
（对过大的 base64 图像进行缩放/重新压缩）。

这也有助于控制支持视觉的模型中由图像驱动的 token 压力。
较低的最大尺寸通常会减少 token 使用量；较高的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 的 assistant 工具调用区块会在构建模型上下文前被丢弃。
这可防止提供商因部分持久化的工具调用而拒绝请求（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 应用于 `src/agents/pi-embedded-runner/google.ts` 中的 `sanitizeSessionHistory`

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 将提示词发送到另一个会话时（包括
智能体对智能体的回复/公告步骤），OpenClaw 会将创建的用户轮次持久化为：

- `message.provenance.kind = "inter_session"`

该元数据会在追加转录时写入，不会改变角色
（为兼容提供商，`role: "user"` 保持不变）。转录读取器可以利用
这一点，避免将路由的内部提示词视为最终用户撰写的指令。

在上下文重建期间，OpenClaw 还会在内存中为这些用户轮次前置一个简短的 `[Inter-session message]`
标记，以便模型将它们与
外部最终用户指令区分开来。

---

## 提供商矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses/Codex 转录，丢弃孤立的 reasoning signature（后面没有内容区块的独立 reasoning 项）。
- 不进行工具调用 id 清理。
- 不进行工具结果配对修复。
- 不进行轮次校验或重排序。
- 不生成合成工具结果。
- 不移除 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次校验（Gemini 风格轮次交替）。
- Google 轮次排序修复（如果历史记录以 assistant 开始，则前置一个很小的用户 bootstrap）。
- Antigravity Claude：规范化 thinking signature；丢弃未签名的 thinking 区块。

**Anthropic / Minimax（兼容 Anthropic）**

- 工具结果配对修复和合成工具结果。
- 轮次校验（合并连续的用户轮次，以满足严格交替要求）。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 id 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- Thought signature 清理：移除非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 会应用多层转录清理：

- 一个 **transcript-sanitize 扩展** 会在每次构建上下文时运行，并且可能：
  - 修复工具使用/结果配对。
  - 清理工具调用 id（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行提供商专用清理，从而造成重复工作。
- 还有额外的变更发生在提供商策略之外，包括：
  - 在持久化之前从 assistant 文本中移除 `<final>` 标签。
  - 丢弃空的 assistant 错误轮次。
  - 在工具调用之后裁剪 assistant 内容。

这种复杂性导致了跨提供商回归（尤其是 `openai-responses`
`call_id|fc_id` 配对）。2026.1.22 的清理工作移除了该扩展，将
逻辑集中到运行器中，并使 OpenAI 除图像清理之外保持**不触碰**。

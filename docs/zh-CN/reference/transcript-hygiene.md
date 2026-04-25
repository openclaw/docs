---
read_when:
    - 你正在调试与转录结构相关的 provider 请求拒绝问题
    - 你正在修改转录清理或工具调用修复逻辑
    - 你正在调查跨 provider 的工具调用 id 不匹配问题
summary: 参考：provider 特定的转录清理与修复规则
title: 转录清理规范
x-i18n:
    generated_at: "2026-04-25T05:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

本文档说明在运行前（构建模型上下文时）应用于转录的**provider 特定修复**。这些是用于满足严格 provider 要求的**仅内存**调整。这些清理步骤**不会**重写磁盘上存储的 JSONL 转录；不过，在加载会话之前，单独的会话文件修复过程可能会通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会在会话文件旁边生成备份。

范围包括：

- 仅运行时的提示上下文保持不进入用户可见的转录轮次
- 工具调用 id 清理
- 工具调用输入验证
- 工具结果配对修复
- 轮次验证/排序
- thought signature 清理
- 图像载荷清理
- 用户输入来源标记（用于跨会话路由提示）

如果你需要转录存储细节，请参见：

- [会话管理深入解析](/zh-CN/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时/系统上下文可以添加到某个轮次的模型提示中，但它不是最终用户撰写的内容。OpenClaw 会为 Gateway 网关回复、排队的后续操作、ACP、CLI 和嵌入式 Pi 运行保留一个单独的、面向转录的提示正文。存储的可见用户轮次使用该转录正文，而不是运行时增强后的提示。

对于已经持久化了运行时包装器的旧会话，Gateway 网关历史记录界面会在将消息返回给 WebChat、TUI、REST 或 SSE 客户端之前应用显示投影。

---

## 运行位置

所有转录清理都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些规则。

与转录清理分开的是，会话文件会在加载前按需修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像载荷始终会被清理，以防止因大小限制导致 provider 侧拒绝（对过大的 base64 图像进行缩放/重新压缩）。

这也有助于控制视觉能力模型下由图像驱动的 token 压力。较低的最大尺寸通常会减少 token 使用；较高的尺寸则保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认：`1200`）。

---

## 全局规则：格式错误的工具调用

缺少 `input` 和 `arguments` 的助手工具调用块会在构建模型上下文之前被丢弃。这可防止 provider 因部分持久化的工具调用而拒绝请求（例如，在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 的 `sanitizeSessionHistory` 中应用

---

## 全局规则：跨会话输入来源

当智能体通过 `sessions_send` 向另一个会话发送提示时（包括智能体到智能体的 reply/announce 步骤），OpenClaw 会在追加转录时将创建的用户轮次持久化为：

- `message.provenance.kind = "inter_session"`

该元数据会在转录追加时写入，不会更改角色
（为了 provider 兼容性，仍保留 `role: "user"`）。转录读取器可以利用这一点，避免将路由的内部提示视为最终用户撰写的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次前置一个简短的 `[Inter-session message]` 标记，以便模型将其与外部最终用户指令区分开来。

---

## provider 矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses/Codex 转录，丢弃孤立的 reasoning signature（后面没有内容块的独立 reasoning 项），并在模型路由切换后丢弃可重放的 OpenAI reasoning。
- 不做工具调用 id 清理。
- 工具结果配对修复可能会移动真实匹配的输出，并为缺失的工具调用合成 Codex 风格的 `aborted` 输出。
- 不做轮次验证或重排序。
- 缺失的 OpenAI Responses 系列工具输出会被合成为 `aborted`，以匹配 Codex 重放规范化。
- 不剥离 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- 工具调用 id 清理：严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证（Gemini 风格轮次交替）。
- Google 轮次顺序修复（如果历史以 assistant 开头，则前置一个极小的 user 引导项）。
- Antigravity Claude：规范化 thinking signature；丢弃未签名的 thinking 块。

**Anthropic / MiniMax（Anthropic 兼容）**

- 工具结果配对修复和合成工具结果。
- 轮次验证（合并连续的 user 轮次以满足严格交替要求）。

**Mistral（包括基于 model-id 的检测）**

- 工具调用 id 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- thought signature 清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 版本之前，OpenClaw 应用了多层转录清理：

- 每次构建上下文时都会运行一个 **transcript-sanitize 扩展**，其可以：
  - 修复工具使用/结果配对。
  - 清理工具调用 id（包括保留 `_`/`-` 的非严格模式）。
- 运行器还会执行 provider 特定清理，从而导致重复处理。
- 另外还有一些发生在 provider 策略之外的变更，包括：
  - 在持久化前从助手文本中剥离 `<final>` 标签。
  - 丢弃空的助手错误轮次。
  - 在工具调用后裁剪助手内容。

这种复杂性导致了跨 provider 的回归问题（尤其是 `openai-responses` 的 `call_id|fc_id` 配对）。2026.1.22 的清理移除了该扩展，将逻辑集中到运行器中，并让 OpenAI 除图像清理之外保持**不触碰**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话清理](/zh-CN/concepts/session-pruning)

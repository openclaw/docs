---
read_when:
    - 你正在调试与转录形状相关的 provider 请求拒绝问题
    - 你正在更改转录清理或 tool-call 修复逻辑
    - 你正在调查跨 provider 的 tool-call id 不匹配问题
summary: 参考：provider 专用的转录清理与修复规则
title: 转录卫生处理
x-i18n:
    generated_at: "2026-04-24T04:07:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# 转录卫生处理（Provider 修复）

本文档描述了在一次运行前（构建模型上下文时）应用于转录的**provider 专用修复**。这些是用于满足严格 provider 要求的**内存中**调整。这些卫生处理步骤**不会**重写磁盘上存储的 JSONL 转录；不过，独立的会话文件修复流程可能会在加载会话前通过丢弃无效行来重写格式错误的 JSONL 文件。发生修复时，原始文件会在会话文件旁边备份。

范围包括：

- Tool call id 清理
- Tool call 输入验证
- Tool result 配对修复
- 轮次验证 / 排序
- 思维签名清理
- 图片负载清理
- 用户输入来源标记（用于跨会话路由提示词）

如果你需要了解转录存储细节，请参见：

- [/reference/session-management-compaction](/zh-CN/reference/session-management-compaction)

---

## 运行位置

所有转录卫生处理都集中在嵌入式 runner 中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

该策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用哪些处理。

与转录卫生处理分开，会话文件会在加载前根据需要进行修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 由 `run/attempt.ts` 和 `compact.ts`（嵌入式 runner）调用

---

## 全局规则：图片清理

图片负载始终会被清理，以防止因大小限制而被 provider 端拒绝
（对过大的 base64 图片进行缩放/重新压缩）。

这也有助于控制支持视觉的模型所承受的图片驱动 token 压力。
更低的最大尺寸通常会减少 token 使用量；更高的尺寸则能保留更多细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图片边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认：`1200`）。

---

## 全局规则：格式错误的 tool calls

缺少 `input` 和 `arguments` 的 assistant tool-call block 会在构建模型上下文前被丢弃。
这可防止因部分持久化的 tool call 而导致 provider 拒绝（例如在速率限制失败之后）。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 的 `sanitizeSessionHistory` 中应用

---

## 全局规则：跨会话输入来源

当一个智能体通过 `sessions_send` 将提示词发送到另一个会话时（包括
智能体到智能体的 reply/announce 步骤），OpenClaw 会将创建出的用户轮次持久化，并附带：

- `message.provenance.kind = "inter_session"`

这段元数据会在追加到转录时写入，不会改变角色
（为了 provider 兼容性，`role: "user"` 仍然保留）。转录读取器可以使用
它来避免将路由过来的内部提示词视为终端用户撰写的指令。

在重建上下文期间，OpenClaw 还会在内存中为这些用户轮次前置一个简短的 `[Inter-session message]`
标记，以便模型将其与外部终端用户指令区分开来。

---

## Provider 矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅进行图片清理。
- 对 OpenAI Responses/Codex 转录，丢弃孤立的 reasoning 签名（即后面没有内容 block 的独立 reasoning 项）。
- 不进行 tool call id 清理。
- 不进行 tool result 配对修复。
- 不进行轮次验证或重排序。
- 不生成合成 tool result。
- 不剥离 thought signature。

**Google（Generative AI / Gemini CLI / Antigravity）**

- Tool call id 清理：严格字母数字。
- Tool result 配对修复和合成 tool result。
- 轮次验证（Gemini 风格的轮次交替）。
- Google 轮次排序修复（如果历史以 assistant 开头，则预置一个极小的用户 bootstrap）。
- Antigravity Claude：规范化 thinking signature；丢弃未签名的 thinking blocks。

**Anthropic / MiniMax（兼容 Anthropic）**

- Tool result 配对修复和合成 tool result。
- 轮次验证（合并连续的用户轮次，以满足严格交替要求）。

**Mistral（包括基于 model id 的检测）**

- Tool call id 清理：strict9（长度为 9 的字母数字）。

**OpenRouter Gemini**

- Thought signature 清理：剥离非 base64 的 `thought_signature` 值（保留 base64）。

**其他所有情况**

- 仅进行图片清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 发布之前，OpenClaw 会应用多层转录卫生处理：

- 一个 **transcript-sanitize extension** 会在每次构建上下文时运行，并且可以：
  - 修复 tool use/result 配对。
  - 清理 tool call id（包括保留 `_`/`-` 的非严格模式）。
- runner 也会执行 provider 专用清理，这造成了重复工作。
- provider 策略之外还会发生额外变更，包括：
  - 在持久化前从 assistant 文本中剥离 `<final>` 标签。
  - 丢弃空的 assistant error 轮次。
  - 在 tool call 之后裁剪 assistant 内容。

这种复杂性导致了跨 provider 回归（尤其是 `openai-responses`
`call_id|fc_id` 配对问题）。2026.1.22 的清理移除了该 extension，将
逻辑集中到 runner 中，并使 OpenAI 除图片清理外变为**不触碰**。

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话裁剪](/zh-CN/concepts/session-pruning)

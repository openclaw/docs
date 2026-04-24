---
read_when:
    - 你看到了一个 `.experimental` 配置键，想知道它是否稳定
    - 你想尝试预览版运行时功能，同时不将它们与正常默认设置混淆
    - 你想在一个地方找到当前已记录的实验性标志
summary: OpenClaw 中实验性标志的含义，以及当前已记录了哪些实验性标志
title: 实验性功能
x-i18n:
    generated_at: "2026-04-24T04:02:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a97e8efa180844e1ca94495d626956847a15a15bba0846aaf54ff9c918cda02
    source_path: concepts/experimental-features.md
    workflow: 15
---

OpenClaw 中的实验性功能是**选择加入的预览能力**。它们被放在显式标志之后，是因为在成为稳定默认值或长期公开契约之前，仍然需要真实环境中的验证。

请将它们与普通配置区别对待：

- 默认情况下保持**关闭**，除非相关文档明确建议你尝试某个标志。
- 预期其**结构和行为会比稳定配置变化得更快**。
- 如果已有稳定路径，优先使用稳定路径。
- 如果你要大范围部署 OpenClaw，请先在较小环境中测试实验性标志，再将其纳入共享基线。

## 当前已记录的标志

| Surface | Key | Use it when | More |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本地模型运行时 | `agents.defaults.experimental.localModelLean` | 较小或更严格的本地后端无法处理 OpenClaw 完整的默认工具能力 | [本地模型](/zh-CN/gateway/local-models) |
| 记忆搜索 | `agents.defaults.memorySearch.experimental.sessionMemory` | 你希望 `memory_search` 为先前的会话转录建立索引，并接受额外的存储/索引成本 | [记忆配置参考](/zh-CN/reference/memory-config#session-memory-search-experimental) |
| 结构化规划工具 | `tools.experimental.planTool` | 你希望在兼容的运行时和 UI 中公开结构化的 `update_plan` 工具，用于多步骤工作跟踪 | [Gateway 网关配置参考](/zh-CN/gateway/config-tools#toolsexperimental) |

## 本地模型精简模式

`agents.defaults.experimental.localModelLean: true` 是为较弱的本地模型环境提供的缓冲阀。它会裁剪像 `browser`、`cron` 和 `message` 这样的重量级默认工具，使提示结构更小，在小上下文或更严格的 OpenAI 兼容后端中更不易出问题。

这**不是**正常路径。如果你的后端能够稳定处理完整运行时，请保持关闭。

## 实验性不等于隐藏

如果某个功能是实验性的，OpenClaw 应该在文档和配置路径本身中明确说明。它**不应该**做的是，把预览行为偷偷塞进一个看起来稳定的默认开关里，然后假装那是正常用法。那样只会让配置能力变得混乱。

## 相关内容

- [功能](/zh-CN/concepts/features)
- [发布渠道](/zh-CN/install/development-channels)

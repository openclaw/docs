---
read_when:
    - 你想减少工具输出造成的上下文增长
    - 你想了解 Anthropic 提示缓存优化
summary: 裁剪旧工具结果，以保持上下文精简并提高缓存效率
title: 会话修剪
x-i18n:
    generated_at: "2026-07-05T11:15:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

会话剪枝会在每次 LLM 调用前，从上下文中裁剪**旧工具结果**。它可以减少累积工具输出（exec 结果、文件读取、搜索结果）造成的上下文膨胀，而不会重写普通对话文本。

<Info>
剪枝仅在内存中进行 -- 它不会修改磁盘上的会话转录记录。你的完整历史始终会被保留。
</Info>

## 为什么重要

长会话会累积工具输出，从而撑大上下文窗口。这会增加成本，并且可能比必要情况更早触发[压缩](/zh-CN/concepts/compaction)。

剪枝对 **Anthropic 提示缓存**尤其有价值。缓存 TTL 过期后，下一个请求会重新缓存完整提示。剪枝会减少缓存写入大小，从而直接降低成本。

## 工作原理

剪枝以 `cache-ttl` 模式运行，同时受时间检查和上下文大小检查约束：

1. 等待缓存 TTL 过期（手动设置时默认为 5 分钟；Anthropic 自动默认值请参阅[智能默认值](#smart-defaults)）。在 TTL 到期前，剪枝会被完全跳过，以保留相邻轮次的提示缓存复用。
2. TTL 到期后，根据模型的上下文窗口估算总上下文大小。如果比例低于 `softTrimRatio`（默认 0.3），则跳过剪枝并继续运行 TTL 计时。
3. 对超过比例的过大工具结果执行**软裁剪**：保留开头和结尾（默认各 1500 个字符，合计上限为 4000 个字符），中间插入 `...`。
4. 如果比例仍然达到或超过 `hardClearRatio`（默认 0.5），并且仍剩下至少 `minPrunableToolChars`（默认 50,000）个字符的可剪枝工具内容，则**硬清除**这些结果：用占位符替换其内容（默认 `[Old tool result content cleared]`）。
5. 只有在剪枝实际改变上下文时才重置 TTL 计时，这样后续请求可以复用新的缓存。

无论阈值如何，都会应用两条安全规则：最近的 `keepLastAssistants` 个助手轮次（默认 3）永远不会被剪枝，并且会话第一条用户消息之前的任何内容都永远不会被剪枝（保护像 `SOUL.md`/`USER.md` 这样的引导读取）。

只有 `toolResult` 消息符合条件；普通对话文本会保持不变。使用 `agents.defaults.contextPruning.tools.{allow,deny}` 来限定哪些工具名称可以被剪枝。

## 旧版图片清理

OpenClaw 还会为在历史中保留原始图片块或提示水合媒体标记的会话构建单独的幂等重放视图。

- 它会按字节完全一致地保留**最近 3 个已完成轮次**，让最近后续请求的提示缓存前缀保持稳定。这个计数包含所有已完成轮次，不只是包含图片的轮次，因此纯文本轮次也会占用窗口。
- 在重放视图中，来自 `user` 或 `toolResult` 历史的较旧且已处理图片块会被替换为 `[image data removed - already processed by model]`。
- 较旧的文本媒体引用，例如 `[media attached: ...]`、`[Image: source: ...]` 和 `media://inbound/...`，会被替换为 `[media reference removed - already processed by model]`。当前轮次的附件标记会保持完整，以便视觉模型仍能水合新图片。
- 原始会话转录记录不会被重写，因此历史查看器仍可渲染原始消息条目及其图片。
- 这与上面的常规缓存 TTL 剪枝是分开的。它的存在是为了阻止重复图片载荷或过期媒体引用在后续轮次中破坏提示缓存。

## 智能默认值

内置 Anthropic 插件在首次解析 Anthropic（或 Claude CLI）凭证配置文件时，会自动配置剪枝和 Heartbeat 节奏，但仅限你尚未显式设置的字段：

| 凭证模式 | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token（包括复用 Claude CLI） | `cache-ttl` | `1h` | `1h` |
| API key | `cache-ttl` | `1h` | `30m` |

如果你自己设置了 `agents.defaults.contextPruning.mode` 或 `agents.defaults.heartbeat.every`，OpenClaw 不会覆盖它们。此自动默认值仅对 Anthropic 系列凭证触发；其他提供商的剪枝默认为 `off`，除非你进行配置。

## 启用或禁用

对于非 Anthropic 提供商，剪枝默认关闭。要启用：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

要禁用：设置 `mode: "off"`。

## 剪枝与压缩对比

|            | 剪枝 | 压缩 |
| ---------- | ------------------ | ----------------------- |
| **内容** | 裁剪工具结果 | 总结对话 |
| **保存？** | 否（按请求） | 是（在转录记录中） |
| **范围** | 仅工具结果 | 整个对话 |

两者相互补充 -- 剪枝会在压缩周期之间保持工具输出精简。

## 延伸阅读

- [压缩](/zh-CN/concepts/compaction)：基于摘要的上下文缩减
- [Gateway 配置](/zh-CN/gateway/configuration)：所有剪枝配置开关（`contextPruning.*`）

## 相关

- [会话管理](/zh-CN/concepts/session)
- [会话工具](/zh-CN/concepts/session-tool)
- [上下文引擎](/zh-CN/concepts/context-engine)

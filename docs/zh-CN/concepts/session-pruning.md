---
read_when:
    - 你希望减少工具输出导致的上下文增长
    - 你想了解 Anthropic 提示词缓存优化
summary: 裁剪旧的工具结果，以保持上下文精简并提高缓存效率
title: 会话修剪
x-i18n:
    generated_at: "2026-07-11T20:28:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

会话修剪会在每次 LLM 调用前，从上下文中移除**旧工具结果**。它无需重写正常对话文本，即可减少累积工具输出（执行结果、文件读取结果、搜索结果）造成的上下文膨胀。

<Info>
修剪仅在内存中进行——不会修改磁盘上的会话记录。你的完整历史记录始终会被保留。
</Info>

## 为什么重要

长会话会累积工具输出，使上下文窗口膨胀。这会增加成本，并可能导致系统比必要时间更早执行[压缩](/zh-CN/concepts/compaction)。

修剪对 **Anthropic 提示缓存**尤其有价值。缓存 TTL 过期后，下一个请求会重新缓存完整提示。修剪可减少缓存写入量，从而直接降低成本。

## 工作原理

修剪以 `cache-ttl` 模式运行，同时受时间检查和上下文大小检查控制：

1. 等待缓存 TTL 过期（手动设置时默认为 5 分钟；Anthropic 的自动默认值请参阅[智能默认值](#smart-defaults)）。TTL 到期前会完全跳过修剪，以便相邻轮次继续复用提示缓存。
2. TTL 到期后，根据模型的上下文窗口估算上下文总大小。如果比例低于 `softTrimRatio`（默认为 0.3），则跳过修剪，并让 TTL 计时继续运行。
3. 对超过该比例的超大工具结果执行**软修剪**：保留开头和结尾（默认各 1500 个字符，合计最多 4000 个字符），并在中间插入 `...`。
4. 如果比例仍达到或超过 `hardClearRatio`（默认为 0.5），且仍有至少 `minPrunableToolChars`（默认为 50,000）个字符的可修剪工具内容，则**彻底清除**这些结果：将其内容替换为占位符（默认为 `[旧工具结果内容已清除]`）。
5. 仅当修剪确实改变了上下文时才重置 TTL 计时，以便后续请求复用新缓存。

无论阈值如何，都会应用两项安全规则：绝不修剪最近的 `keepLastAssistants` 个助手轮次（默认为 3 个），也绝不修剪会话第一条用户消息之前的任何内容（用于保护 `SOUL.md`/`USER.md` 等启动读取内容）。

只有 `toolResult` 消息符合修剪条件；正常对话文本不会受到影响。使用 `agents.defaults.contextPruning.tools.{allow,deny}` 限定哪些工具名称可以被修剪。

## 旧版图片清理

对于历史记录中持久化了原始图片块或提示注水媒体标记的会话，OpenClaw 还会构建一个独立且幂等的重放视图。

- 它会逐字节保留**最近 3 个已完成轮次**，以确保近期后续交互的提示缓存前缀保持稳定。此数量包括所有已完成轮次，而不仅是包含图片的轮次，因此纯文本轮次也会占用该窗口。
- 在重放视图中，来自 `user` 或 `toolResult` 历史记录中较早且已处理的图片块会被替换为 `[图片数据已移除——模型已处理]`。
- 较早的文本媒体引用（例如 `[media attached: ...]`、`[Image: source: ...]` 和 `media://inbound/...`）会被替换为 `[媒体引用已移除——模型已处理]`。当前轮次的附件标记会保持不变，因此视觉模型仍可载入新图片。
- 原始会话记录不会被重写，因此历史记录查看器仍可呈现原始消息条目及其图片。
- 这与上述常规缓存 TTL 修剪相互独立。它用于防止重复图片负载或过时媒体引用导致后续轮次的提示缓存失效。

## 智能默认值

内置的 Anthropic 插件在首次解析 Anthropic（或 Claude CLI）身份验证配置文件时，会自动配置修剪和 Heartbeat 频率，但仅会配置你尚未显式设置的字段：

| 身份验证模式                           | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| -------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/令牌（包括复用 Claude CLI）      | `cache-ttl`           | `1h`                 | `1h`              |
| API 密钥                               | `cache-ttl`           | `1h`                 | `30m`             |

如果你自行设置了 `agents.defaults.contextPruning.mode` 或 `agents.defaults.heartbeat.every`，OpenClaw 不会覆盖它们。此自动默认设置仅对 Anthropic 系列身份验证生效；除非你自行配置，否则其他提供商的修剪模式为 `off`。

## 启用或禁用

对于非 Anthropic 提供商，修剪默认关闭。要启用修剪：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

要禁用修剪：将 `mode` 设置为 `"off"`。

## 修剪与压缩对比

|              | 修剪               | 压缩             |
| ------------ | ------------------ | ---------------- |
| **内容**     | 修剪工具结果       | 总结对话         |
| **是否保存？** | 否（按请求执行） | 是（保存在记录中） |
| **范围**     | 仅工具结果         | 整个对话         |

两者相辅相成——修剪可在两次压缩周期之间保持工具输出精简。

## 延伸阅读

- [压缩](/zh-CN/concepts/compaction)：基于摘要缩减上下文
- [Gateway 配置](/zh-CN/gateway/configuration)：所有修剪配置选项（`contextPruning.*`）

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话工具](/zh-CN/concepts/session-tool)
- [上下文引擎](/zh-CN/concepts/context-engine)

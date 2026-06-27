---
read_when:
    - 你想减少由工具输出导致的上下文增长
    - 你想了解 Anthropic 提示缓存优化
summary: 裁剪旧的工具结果，以保持上下文精简并提高缓存效率
title: 会话裁剪
x-i18n:
    generated_at: "2026-04-26T02:22:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
    postprocess_version: locale-links-v1
---

会话裁剪会在每次 LLM 调用前，从上下文中裁剪**旧的工具结果**。它可以减少由累计工具输出（执行结果、文件读取结果、搜索结果）带来的上下文膨胀，同时不会改写普通对话文本。

<Info>
裁剪仅发生在内存中——不会修改磁盘上的会话记录。
你的完整历史始终会被保留。
</Info>

## 为什么这很重要

长会话会不断累积工具输出，从而撑大上下文窗口。这会增加成本，并可能迫使系统比必要情况下更早进行 [压缩](/zh-CN/concepts/compaction)。

对于 **Anthropic 提示缓存** 来说，裁剪尤其有价值。缓存 TTL 过期后，下一次请求会重新缓存完整提示词。裁剪可以减少缓存写入大小，从而直接降低成本。

## 工作原理

1. 等待缓存 TTL 过期（默认 5 分钟）。
2. 找出适合常规裁剪的旧工具结果（对话文本保持不变）。
3. 对超大的结果进行**软裁剪**——保留开头和结尾，并插入 `...`。
4. 对其余内容进行**硬清除**——替换为占位符。
5. 重置 TTL，以便后续请求复用新的缓存。

## 旧图片清理

OpenClaw 还会为那些在历史中保留了原始图片块或提示词注入媒体标记的会话，构建一个独立的、幂等的重放视图。

- 它会逐字节保留**最近 3 个已完成轮次**，以确保最近后续请求的提示缓存前缀保持稳定。
- 在重放视图中，来自 `user` 或 `toolResult` 历史记录里、较早且已经处理过的图片块，可以被替换为 `[image data removed - already processed by model]`。
- 较早的文本媒体引用，例如 `[media attached: ...]`、`[Image: source: ...]` 和 `media://inbound/...`，可以被替换为 `[media reference removed - already processed by model]`。当前轮次的附件标记会保持不变，这样视觉模型仍然可以为新图片注入内容。
- 原始会话记录不会被重写，因此历史查看器仍然可以渲染原始消息条目及其中的图片。
- 这与常规的缓存 TTL 裁剪是分开的。它的存在，是为了防止重复的图片负载或过期媒体引用在后续轮次中破坏提示缓存。

## 智能默认值

OpenClaw 会为 Anthropic 配置文件自动启用裁剪：

| 配置文件类型 | 已启用裁剪 | 心跳 |
| ------------------------------------------------------- | --------------- | --------- |
| Anthropic OAuth/令牌认证（包括 Claude CLI 复用） | 是 | 1 小时 |
| API 密钥 | 是 | 30 分钟 |

如果你设置了显式值，OpenClaw 不会覆盖它们。

## 启用或禁用

对于非 Anthropic 提供商，裁剪默认关闭。要启用：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

要禁用：将 `mode` 设为 `“off”`。

## 裁剪与压缩

|            | 裁剪 | 压缩 |
| ---------- | ------------------ | ----------------------- |
| **是什么**   | 裁剪工具结果 | 总结对话 |
| **会保存吗？** | 否（按请求） | 是（写入记录） |
| **范围** | 仅工具结果 | 整个对话 |

它们彼此互补——裁剪可以在压缩周期之间保持工具输出精简。

## 延伸阅读

- [压缩](/zh-CN/concepts/compaction) —— 基于摘要的上下文缩减
- [Gateway 网关配置](/zh-CN/gateway/configuration) —— 所有裁剪配置项
  （`contextPruning.*`）

## 相关内容

- [会话管理](/zh-CN/concepts/session)
- [会话工具](/zh-CN/concepts/session-tool)
- [上下文引擎](/zh-CN/concepts/context-engine)

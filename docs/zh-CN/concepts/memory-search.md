---
read_when:
    - 你想了解 memory_search 的工作方式
    - 你想选择一个嵌入提供商
    - 你想调优搜索质量
summary: 内存搜索如何使用嵌入和混合检索来查找相关笔记
title: 内存搜索
x-i18n:
    generated_at: "2026-04-27T10:58:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7c6dbc694a6ac6b9ab8773ebee245bb18d92a226c56f4ebb5df4dfa255ad940a
    source_path: concepts/memory-search.md
    workflow: 15
---

`memory_search` 会从你的内存文件中查找相关笔记，即使措辞与原始文本不同也能找到。它的工作方式是先将内存索引为小块，然后使用嵌入、关键词或两者结合来搜索这些内容。

## 快速开始

如果你已配置 GitHub Copilot 订阅、OpenAI、Gemini、Voyage 或 Mistral API 密钥，内存搜索会自动工作。若要显式设置提供商：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // 或 "gemini"、"local"、"ollama" 等。
      },
    },
  },
}
```

如果你想使用无需 API 密钥的本地嵌入，请在 OpenClaw 旁安装可选的 `node-llama-cpp` 运行时包，并使用 `provider: "local"`。

某些与 OpenAI 兼容的嵌入端点需要非对称标签，例如搜索时使用 `input_type: "query"`，索引块时使用 `input_type: "document"` 或 `"passage"`。请使用 `memorySearch.queryInputType` 和 `memorySearch.documentInputType` 进行配置；参见[内存配置参考](/zh-CN/reference/memory-config#provider-specific-config)。

## 支持的提供商

| 提供商 | ID | 需要 API 密钥 | 说明 |
| -------------- | ---------------- | ------------- | ---------------------------------------------------- |
| Bedrock | `bedrock` | 否 | 当 AWS 凭证链可解析时自动检测 |
| Gemini | `gemini` | 是 | 支持图像/音频索引 |
| GitHub Copilot | `github-copilot` | 否 | 自动检测，使用 Copilot 订阅 |
| Local | `local` | 否 | GGUF 模型，下载大小约 0.6 GB |
| Mistral | `mistral` | 是 | 自动检测 |
| Ollama | `ollama` | 否 | 本地，必须显式设置 |
| OpenAI | `openai` | 是 | 自动检测，速度快 |
| Voyage | `voyage` | 是 | 自动检测 |

## 搜索如何工作

OpenClaw 会并行运行两条检索路径，然后合并结果：

```mermaid
flowchart LR
    Q["Query"] --> E["Embedding"]
    Q --> T["Tokenize"]
    E --> VS["Vector Search"]
    T --> BM["BM25 Search"]
    VS --> M["Weighted Merge"]
    BM --> M
    M --> R["Top Results"]
```

- **向量搜索** 会查找语义相近的笔记（“gateway host” 可以匹配 “the machine running OpenClaw”）。
- **BM25 关键词搜索** 会查找精确匹配项（ID、错误字符串、配置键名）。

如果只有一条路径可用（没有嵌入或没有 FTS），则仅运行另一条路径。

当嵌入不可用时，OpenClaw 仍会基于 FTS 结果使用词法排序，而不是只退化为原始精确匹配排序。这种降级模式会提升查询词覆盖更强且文件路径更相关的片段，因此即使没有 `sqlite-vec` 或嵌入提供商，也能保持不错的召回效果。

## 提升搜索质量

当你有大量历史笔记时，有两个可选功能会很有帮助：

### 时间衰减

旧笔记的排序权重会逐渐降低，因此最近的信息会优先显示。默认半衰期为 30 天，这意味着上个月的笔记得分会降到原始权重的 50%。像 `MEMORY.md` 这样的常青文件永远不会衰减。

<Tip>
如果你的智能体已经积累了数月的日常笔记，并且过时信息总是排在最新上下文之前，请启用时间衰减。
</Tip>

### MMR（多样性）

减少重复结果。如果五条笔记都提到了相同的路由器配置，MMR 会确保顶部结果覆盖不同主题，而不是重复返回相似内容。

<Tip>
如果 `memory_search` 总是从不同的每日日志中返回几乎重复的片段，请启用 MMR。
</Tip>

### 同时启用两者

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## 多模态内存

借助 Gemini Embedding 2，你可以在 Markdown 之外一并索引图像和音频文件。搜索查询仍然是文本，但可以匹配视觉和音频内容。设置方法请参见[内存配置参考](/zh-CN/reference/memory-config)。

## 会话内存搜索

你也可以选择为会话转录建立索引，以便 `memory_search` 能回忆更早的对话。这是通过 `memorySearch.experimental.sessionMemory` 选择启用的实验功能。详情请参见[配置参考](/zh-CN/reference/memory-config)。

## 故障排除

**没有结果？** 运行 `openclaw memory status` 检查索引。如果索引为空，请运行 `openclaw memory index --force`。

**只有关键词匹配？** 你的嵌入提供商可能尚未配置。请检查 `openclaw memory status --deep`。

**本地嵌入超时？** `ollama`、`lmstudio` 和 `local` 默认使用更长的内联批处理超时时间。如果只是主机较慢，请设置 `agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds`，然后重新运行 `openclaw memory index --force`。

**找不到 CJK 文本？** 请使用 `openclaw memory index --force` 重建 FTS 索引。

## 延伸阅读

- [Active Memory](/zh-CN/concepts/active-memory) -- 用于交互式聊天会话的子智能体内存
- [Memory](/zh-CN/concepts/memory) -- 文件布局、后端、工具
- [内存配置参考](/zh-CN/reference/memory-config) -- 所有配置项

## 相关内容

- [Memory 概览](/zh-CN/concepts/memory)
- [Active memory](/zh-CN/concepts/active-memory)
- [内置内存引擎](/zh-CN/concepts/memory-builtin)

---
read_when:
    - 你想了解默认记忆后端
    - 你想配置嵌入提供商或混合搜索
summary: 默认基于 SQLite 的记忆后端，支持关键词、向量和混合搜索
title: 内置记忆引擎
x-i18n:
    generated_at: "2026-04-05T08:21:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# 内置记忆引擎

内置引擎是默认的记忆后端。它会将你的记忆索引存储在
每个智能体对应的 SQLite 数据库中，入门时不需要任何额外依赖。

## 它提供什么

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）。
- **向量搜索**：通过任意受支持提供商提供的嵌入实现。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过 trigram 分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门指南

如果你拥有 OpenAI、Gemini、Voyage 或 Mistral 的 API 密钥，内置
引擎会自动检测并启用向量搜索。无需配置。

如需显式设置提供商：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

如果没有嵌入提供商，则只能使用关键词搜索。

## 支持的嵌入提供商

| Provider | ID        | Auto-detected | Notes                               |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI   | `openai`  | Yes           | 默认：`text-embedding-3-small`   |
| Gemini   | `gemini`  | Yes           | 支持多模态（图像 + 音频） |
| Voyage   | `voyage`  | Yes           |                                     |
| Mistral  | `mistral` | Yes           |                                     |
| Ollama   | `ollama`  | No            | 本地，需显式设置               |
| Local    | `local`   | Yes (first)   | GGUF 模型，约 0.6 GB 下载        |

自动检测会按上表所示顺序，选择第一个能够解析其 API 密钥的提供商。
设置 `memorySearch.provider` 可进行覆盖。

## 索引的工作方式

OpenClaw 会将 `MEMORY.md` 和 `memory/*.md` 索引为若干分块（约 400 个 token，
并带有 80 个 token 的重叠），并将其存储在每个智能体对应的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **文件监听：** 对记忆文件的更改会触发去抖后的重新索引（1.5 秒）。
- **自动重新索引：** 当嵌入提供商、模型或分块配置
  发生变化时，整个索引会自动重建。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你也可以使用
`memorySearch.extraPaths` 为工作区外的 Markdown 文件建立索引。参见
[配置参考](/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

对于大多数用户来说，内置引擎都是正确选择：

- 开箱即用，无需额外依赖。
- 能很好地处理关键词和向量搜索。
- 支持所有嵌入提供商。
- 混合搜索结合了两种检索方法的优势。

如果你需要重排序、查询
扩展，或想为工作区外的目录建立索引，请考虑切换到 [QMD](/concepts/memory-qmd)。

如果你希望获得跨会话记忆和自动用户建模，请考虑 [Honcho](/concepts/memory-honcho)。

## 故障排除

**记忆搜索被禁用？** 检查 `openclaw memory status`。如果未检测到提供商，
请显式设置一个，或添加 API 密钥。

**结果陈旧？** 运行 `openclaw memory index --force` 进行重建。监听器
在少数边缘情况下可能会漏掉更改。

**sqlite-vec 无法加载？** OpenClaw 会自动回退到进程内余弦相似度
计算。请检查日志中的具体加载错误。

## 配置

有关嵌入提供商设置、混合搜索调优（权重、MMR、时间
衰减）、批量索引、多模态记忆、sqlite-vec、额外路径以及所有
其他配置项，请参见
[记忆配置参考](/reference/memory-config)。

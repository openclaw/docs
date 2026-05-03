---
read_when:
    - 你想了解默认记忆后端
    - 你想配置嵌入提供商或混合搜索
summary: 基于 SQLite 的默认记忆后端，支持关键词、向量和混合搜索
title: 内置记忆引擎
x-i18n:
    generated_at: "2026-05-03T16:43:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

内置引擎是默认的记忆后端。它会把你的记忆索引存储在每个智能体的 SQLite 数据库中，并且入门不需要额外依赖。

## 它提供什么

- **关键词搜索**：通过 FTS5 全文索引实现（BM25 评分）。
- **向量搜索**：通过任意受支持提供商的 embeddings 实现。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过 trigram 分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门指南

如果你有 OpenAI、Gemini、Voyage、Mistral 或 DeepInfra 的 API key，内置
引擎会自动检测它并启用向量搜索。无需配置。

要显式设置提供商：

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

如果没有 embedding 提供商，则只可使用关键词搜索。

要强制使用内置本地 embedding 提供商，请在 OpenClaw 旁安装可选的
`node-llama-cpp` 运行时包，然后将 `local.modelPath`
指向一个 GGUF 文件：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 支持的 embedding 提供商

| 提供商    | ID          | 自动检测 | 说明                                |
| --------- | ----------- | -------- | ----------------------------------- |
| OpenAI    | `openai`    | 是       | 默认：`text-embedding-3-small`      |
| Gemini    | `gemini`    | 是       | 支持多模态（图像 + 音频）           |
| Voyage    | `voyage`    | 是       |                                     |
| Mistral   | `mistral`   | 是       |                                     |
| DeepInfra | `deepinfra` | 是       | 默认：`BAAI/bge-m3`                 |
| Ollama    | `ollama`    | 否       | 本地，需显式设置                    |
| Local     | `local`     | 是（优先） | 可选 `node-llama-cpp` 运行时       |

自动检测会按所示顺序选择第一个能解析到 API key 的提供商。设置
`memorySearch.provider` 可覆盖该选择。

## 索引的工作方式

OpenClaw 会将 `MEMORY.md` 和 `memory/*.md` 索引为片段（约 400 个 token，
重叠 80 个 token），并存储到每个智能体的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **存储维护：** SQLite WAL sidecar 会通过定期 checkpoint 和关闭时 checkpoint 进行限制。
- **文件监听：** 记忆文件变更会触发防抖的重新索引（1.5 秒）。
- **自动重新索引：** 当 embedding 提供商、模型或分块配置发生变化时，会自动重建整个索引。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 索引工作区外的 Markdown 文件。参见
[配置参考](/zh-CN/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

内置引擎适合大多数用户：

- 开箱即用，无需额外依赖。
- 能很好地处理关键词搜索和向量搜索。
- 支持所有 embedding 提供商。
- 混合搜索结合了两种检索方式的优势。

如果你需要 reranking、查询扩展，或想索引工作区外的目录，请考虑切换到
[QMD](/zh-CN/concepts/memory-qmd)。

如果你想要带自动用户建模的跨会话记忆，请考虑
[Honcho](/zh-CN/concepts/memory-honcho)。

## 故障排除

**记忆搜索被禁用了？** 检查 `openclaw memory status`。如果未检测到提供商，
请显式设置一个，或添加 API key。

**未检测到本地提供商？** 确认本地路径存在，然后运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立 CLI 命令和 Gateway 网关使用相同的 `local` 提供商 ID。
如果提供商设置为 `auto`，只有当 `memorySearch.local.modelPath`
指向现有本地文件时，才会优先考虑本地 embeddings。

**结果过旧？** 运行 `openclaw memory index --force` 重建索引。监听器
在极少数边缘情况下可能会漏掉变更。

**sqlite-vec 未加载？** OpenClaw 会自动回退到进程内余弦相似度。
`openclaw memory status --deep` 会将本地向量存储与 embedding 提供商
分开报告，因此 `Vector store: unavailable` 指向 sqlite-vec 加载问题，
而 `Embeddings: unavailable` 指向提供商/认证或模型就绪问题。查看日志以了解具体加载错误。

## 配置

有关 embedding 提供商设置、混合搜索调优（权重、MMR、时间衰减）、
批量索引、多模态记忆、sqlite-vec、额外路径以及所有其他配置选项，请参见
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [主动记忆](/zh-CN/concepts/active-memory)

---
read_when:
    - 你想了解默认记忆后端
    - 你想配置嵌入提供商或混合搜索
summary: 默认基于 SQLite 的记忆后端，支持关键词、向量和混合搜索
title: 内置记忆引擎
x-i18n:
    generated_at: "2026-04-24T02:14:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

内置引擎是默认的记忆后端。它会将你的记忆索引存储在每个智能体专属的 SQLite 数据库中，入门时无需额外依赖。

## 它提供的功能

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）实现。
- **向量搜索**：通过任意受支持提供商提供的嵌入实现。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过 trigram 分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门指南

如果你拥有 OpenAI、Gemini、Voyage 或 Mistral 的 API 密钥，内置引擎会自动检测并启用向量搜索。无需配置。

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

如需强制使用内置本地嵌入提供商，请将 `local.modelPath` 指向一个 GGUF 文件：

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

## 支持的嵌入提供商

| 提供商 | ID        | 自动检测 | 说明 |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI   | `openai`  | 是           | 默认：`text-embedding-3-small`   |
| Gemini   | `gemini`  | 是           | 支持多模态（图像 + 音频） |
| Voyage   | `voyage`  | 是           |                                     |
| Mistral  | `mistral` | 是           |                                     |
| Ollama   | `ollama`  | 否            | 本地，需显式设置               |
| Local    | `local`   | 是（优先）   | GGUF 模型，下载大小约 0.6 GB        |

自动检测会按照上表顺序，选择第一个可解析出 API 密钥的提供商。设置 `memorySearch.provider` 可覆盖此行为。

## 索引的工作方式

OpenClaw 会将 `MEMORY.md` 和 `memory/*.md` 索引为若干块（约 400 个 token，重叠 80 个 token），并将它们存储在每个智能体专属的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **文件监视：** 记忆文件发生变化时，会触发带防抖的重新索引（1.5 秒）。
- **自动重新索引：** 当嵌入提供商、模型或分块配置发生变化时，整个索引会自动重建。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你还可以使用 `memorySearch.extraPaths` 为工作区外的 Markdown 文件建立索引。参见
[配置参考](/zh-CN/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

对于大多数用户来说，内置引擎是正确的选择：

- 开箱即用，无需额外依赖。
- 能很好地处理关键词搜索和向量搜索。
- 支持所有嵌入提供商。
- 混合搜索结合了两种检索方式的优势。

如果你需要重排序、查询扩展，或者希望为工作区外的目录建立索引，可以考虑切换到 [QMD](/zh-CN/concepts/memory-qmd)。

如果你希望获得跨会话记忆以及自动用户建模，可以考虑 [Honcho](/zh-CN/concepts/memory-honcho)。

## 故障排除

**记忆搜索被禁用？** 检查 `openclaw memory status`。如果未检测到提供商，请显式设置一个，或添加 API 密钥。

**未检测到本地提供商？** 确认本地路径存在，并运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立 CLI 命令和 Gateway 网关使用相同的 `local` 提供商 ID。
当提供商设置为 `auto` 时，只有在 `memorySearch.local.modelPath` 指向一个现有本地文件的情况下，才会优先考虑本地嵌入。

**结果过时？** 运行 `openclaw memory index --force` 以重建索引。监视器在极少数边缘情况下可能会漏掉变更。

**sqlite-vec 无法加载？** OpenClaw 会自动回退到进程内余弦相似度计算。请检查日志以查看具体加载错误。

## 配置

有关嵌入提供商设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态记忆、sqlite-vec、额外路径以及所有其他配置项，请参见
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [活跃记忆](/zh-CN/concepts/active-memory)

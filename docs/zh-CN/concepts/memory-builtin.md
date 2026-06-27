---
read_when:
    - 你想了解默认记忆后端
    - 你想配置嵌入提供商或混合搜索
summary: 默认的基于 SQLite 的记忆后端，支持关键词、向量和混合搜索
title: 内置记忆引擎
x-i18n:
    generated_at: "2026-06-27T01:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

内置引擎是默认记忆后端。它将你的记忆索引存储在每个智能体的 SQLite 数据库中，开始使用不需要额外依赖。

## 它提供什么

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）。
- **向量搜索**：通过任意受支持提供商的嵌入。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过三元组分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门指南

默认情况下，内置引擎使用 OpenAI 嵌入。如果你已经配置了
`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`，向量搜索无需额外的记忆配置即可工作。

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

如果没有嵌入提供商，则只有关键词搜索可用。

要强制使用本地 GGUF 嵌入，请安装官方 llama.cpp 提供商插件，
然后将 `local.modelPath` 指向一个 GGUF 文件：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

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

| 提供商            | ID                  | 说明                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | 使用 AWS 凭证链                     |
| DeepInfra         | `deepinfra`         | 默认：`BAAI/bge-m3`                 |
| Gemini            | `gemini`            | 支持多模态（图像 + 音频）           |
| GitHub Copilot    | `github-copilot`    | 使用 Copilot 订阅                   |
| 本地              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 本地/自托管                         |
| OpenAI            | `openai`            | 默认：`text-embedding-3-small`      |
| OpenAI 兼容       | `openai-compatible` | 通用 `/v1/embeddings` 端点          |
| Voyage            | `voyage`            |                                     |

设置 `memorySearch.provider` 以从 OpenAI 切换到其他提供商。

## 索引如何工作

OpenClaw 会将 `MEMORY.md` 和 `memory/*.md` 索引为分块（约 400 个 token，
80 个 token 重叠），并将它们存储在每个智能体的 SQLite 数据库中。

- **索引位置：** 所属智能体数据库，位于
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **存储维护：** SQLite WAL sidecar 通过定期检查点和关闭检查点进行限制。
- **文件监听：** 记忆文件的变更会触发防抖重新索引（1.5 秒）。
- **自动重新索引：** 当嵌入提供商、模型或分块配置变更时，整个索引会自动重建。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 索引工作区外的 Markdown 文件。请参阅
[配置参考](/zh-CN/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

内置引擎适合大多数用户：

- 开箱即用，无需额外依赖。
- 能很好地处理关键词搜索和向量搜索。
- 支持所有嵌入提供商。
- 混合搜索结合了两种检索方式的优势。

如果你需要重排序、查询扩展，或想索引工作区外的目录，请考虑切换到 [QMD](/zh-CN/concepts/memory-qmd)。

如果你想要带有自动用户建模的跨会话记忆，请考虑 [Honcho](/zh-CN/concepts/memory-honcho)。

## 故障排除

**记忆搜索被禁用？** 检查 `openclaw memory status`。如果未检测到提供商，请显式设置一个提供商或添加 API key。

**未检测到本地提供商？** 确认本地路径存在并运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立 CLI 命令和 Gateway 网关使用相同的 `local` 提供商 ID。
当你想使用本地嵌入时，请设置 `memorySearch.provider: "local"`。

**结果过旧？** 运行 `openclaw memory index --force` 进行重建。在少见的边缘情况下，监听器可能会漏掉变更。

**sqlite-vec 未加载？** OpenClaw 会自动回退到进程内余弦相似度。
`openclaw memory status --deep` 会将本地向量存储与嵌入提供商分开报告，因此 `Vector store: unavailable` 指向 sqlite-vec 加载问题，而 `Embeddings: unavailable` 指向提供商/认证或模型就绪问题。请查看日志中的具体加载错误。

## 配置

关于嵌入提供商设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态记忆、sqlite-vec、额外路径以及所有其他配置开关，请参阅
[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [主动记忆](/zh-CN/concepts/active-memory)

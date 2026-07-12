---
read_when:
    - 你想了解默认的记忆后端
    - 你想要配置嵌入提供商或混合搜索
summary: 基于 SQLite 的默认记忆后端，支持关键词搜索、向量搜索和混合搜索
title: 内置记忆引擎
x-i18n:
    generated_at: "2026-07-11T20:27:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

内置引擎是默认的记忆后端。它将记忆索引存储在每个 Agent 独立的 SQLite 数据库中，无需额外依赖即可开始使用。

## 提供的功能

- 通过 FTS5 全文索引（BM25 评分）进行**关键词搜索**。
- 通过任意受支持提供商的嵌入进行**向量搜索**。
- 结合两者以获得最佳结果的**混合搜索**。
- 通过三元组分词支持中文、日文和韩文的 **CJK 支持**。
- 使用 **sqlite-vec 加速**数据库内的向量查询（可选）。

## 入门指南

默认情况下，内置引擎使用 OpenAI 嵌入。如果已配置 `OPENAI_API_KEY` 或 `models.providers.openai.apiKey`，则无需额外的记忆配置即可使用向量搜索。

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

如果没有嵌入提供商，则只能使用关键词搜索。

要强制使用本地 GGUF 嵌入，请安装官方 llama.cpp 提供商插件，然后将 `local.modelPath` 指向 GGUF 文件：

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
| GitHub Copilot    | `github-copilot`    | 使用你的 Copilot 订阅               |
| LM Studio         | `lmstudio`          | 本地/自托管                         |
| 本地              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 本地/自托管                         |
| OpenAI            | `openai`            | 默认：`text-embedding-3-small`      |
| OpenAI 兼容       | `openai-compatible` | 通用 `/v1/embeddings` 端点          |
| Voyage            | `voyage`            |                                     |

设置 `memorySearch.provider` 可从 OpenAI 切换到其他提供商。

## 索引的工作原理

OpenClaw 将 `MEMORY.md` 和 `memory/*.md` 分块建立索引（默认每块 400 个词元，重叠 80 个词元），并将其存储在每个 Agent 独立的 SQLite 数据库中。

- **索引位置：**所属 Agent 的数据库，位于
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **存储维护：**通过定期检查点和关闭时检查点限制 SQLite WAL 辅助文件的大小。
- **文件监视：**记忆文件的变更会触发经过防抖处理的重新索引（默认为 1.5 秒）。
- **自动重新索引：**当嵌入提供商、模型、分块配置、已配置的数据源或作用域发生变化时，索引会自动重建。
- **按需重新索引：**`openclaw memory index --force`

<Info>
你还可以使用 `memorySearch.extraPaths` 为工作区之外的 Markdown 文件建立索引。请参阅[配置参考](/zh-CN/reference/memory-config#additional-memory-paths)。
</Info>

## 适用场景

内置引擎适合大多数用户：

- 无需额外依赖，开箱即用。
- 能够良好处理关键词搜索和向量搜索。
- 支持所有嵌入提供商。
- 混合搜索结合了两种检索方式的优势。

如果你需要重排序、查询扩展，或者希望为工作区之外的目录建立索引，可以考虑切换到 [QMD](/zh-CN/concepts/memory-qmd)。

如果你希望获得具有自动用户建模功能的跨会话记忆，可以考虑使用 [Honcho](/zh-CN/concepts/memory-honcho)。

## 故障排查

**记忆搜索已禁用？**检查 `openclaw memory status`。如果未检测到提供商，请显式设置一个提供商或添加 API 密钥。

**未检测到本地提供商？**确认本地路径存在，然后运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立的 CLI 命令和 Gateway 网关使用相同的 `local` 提供商 ID。需要本地嵌入时，请设置 `memorySearch.provider: "local"`。

**结果过时？**运行 `openclaw memory index --force` 以重建索引。在极少数边缘情况下，文件监视器可能会漏掉变更。

**sqlite-vec 无法加载？**OpenClaw 会自动回退到进程内余弦相似度计算。`openclaw memory status --deep` 会分别报告本地向量存储和嵌入提供商，因此 `Vector store: unavailable` 表示 sqlite-vec 加载问题，而 `Embeddings: unavailable` 表示提供商/身份验证或模型就绪状态存在问题。请查看日志以了解具体的加载错误。

## 配置

有关嵌入提供商设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态记忆、sqlite-vec、额外路径以及所有其他配置选项，请参阅[记忆配置参考](/zh-CN/reference/memory-config)。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [主动记忆](/zh-CN/concepts/active-memory)

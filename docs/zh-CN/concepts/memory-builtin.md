---
read_when:
    - 你想了解默认记忆后端
    - 你想配置嵌入提供商或混合搜索
summary: 默认的基于 SQLite 的记忆后端，支持关键词、向量和混合搜索
title: 内置记忆引擎
x-i18n:
    generated_at: "2026-07-05T11:13:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

内置引擎是默认记忆后端。它会将你的记忆索引存储在每个智能体的 SQLite 数据库中，并且无需额外依赖即可开始使用。

## 它提供什么

- **关键字搜索**，通过 FTS5 全文索引实现（BM25 评分）。
- **向量搜索**，通过任何受支持提供商的 embeddings 实现。
- **混合搜索**，结合两者以获得最佳结果。
- **CJK 支持**，通过 trigram 分词支持中文、日文和韩文。
- **sqlite-vec 加速**，用于数据库内向量查询（可选）。

## 入门指南

默认情况下，内置引擎使用 OpenAI embeddings。如果已经配置了 `OPENAI_API_KEY` 或 `models.providers.openai.apiKey`，向量搜索无需额外记忆配置即可工作。

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

如果没有 embedding 提供商，则只有关键字搜索可用。

要强制使用本地 GGUF embeddings，请安装官方 llama.cpp provider 插件，然后将 `local.modelPath` 指向一个 GGUF 文件：

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

## 支持的 embedding 提供商

| 提供商            | ID                  | 说明                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | 使用 AWS 凭证链                     |
| DeepInfra         | `deepinfra`         | 默认值：`BAAI/bge-m3`               |
| Gemini            | `gemini`            | 支持多模态（图像 + 音频）           |
| GitHub Copilot    | `github-copilot`    | 使用你的 Copilot 订阅               |
| LM Studio         | `lmstudio`          | 本地/自托管                         |
| 本地              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 本地/自托管                         |
| OpenAI            | `openai`            | 默认值：`text-embedding-3-small`    |
| OpenAI 兼容       | `openai-compatible` | 通用 `/v1/embeddings` 端点          |
| Voyage            | `voyage`            |                                     |

设置 `memorySearch.provider` 可切换为不使用 OpenAI。

## 索引如何工作

OpenClaw 会将 `MEMORY.md` 和 `memory/*.md` 索引为块（默认 400 个 token，80 个 token 重叠），并将它们存储在每个智能体的 SQLite 数据库中。

- **索引位置：** 所属智能体数据库，位于
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **存储维护：** SQLite WAL sidecar 会通过定期和关闭时 checkpoint 进行限制。
- **文件监视：** 记忆文件的更改会触发防抖重新索引（默认 1.5 秒）。
- **自动重新索引：** 当 embedding 提供商、模型、分块配置、配置的来源或作用域发生变化时，索引会自动重建。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你也可以使用 `memorySearch.extraPaths` 索引工作区之外的 Markdown 文件。参见[配置参考](/zh-CN/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

内置引擎适合大多数用户：

- 开箱即用，无需额外依赖。
- 能很好地处理关键字和向量搜索。
- 支持所有 embedding 提供商。
- 混合搜索结合了两种检索方法的优势。

如果你需要重排序、查询扩展，或想要索引工作区之外的目录，请考虑切换到 [QMD](/zh-CN/concepts/memory-qmd)。

如果你想要带自动用户建模的跨会话记忆，请考虑 [Honcho](/zh-CN/concepts/memory-honcho)。

## 故障排查

**记忆搜索被禁用？** 检查 `openclaw memory status`。如果未检测到提供商，请显式设置一个，或添加 API key。

**未检测到本地提供商？** 确认本地路径存在并运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立 CLI 命令和 Gateway 网关都使用相同的 `local` 提供商 ID。当你想使用本地 embeddings 时，设置 `memorySearch.provider: "local"`。

**结果过旧？** 运行 `openclaw memory index --force` 进行重建。在少数边缘情况下，监视器可能会漏掉更改。

**sqlite-vec 未加载？** OpenClaw 会自动回退到进程内余弦相似度。`openclaw memory status --deep` 会将本地向量存储与 embedding 提供商分开报告，因此 `Vector store:
unavailable` 指向 sqlite-vec 加载问题，而 `Embeddings: unavailable` 指向提供商/凭证或模型就绪问题。请检查日志以查看具体加载错误。

## 配置

关于 embedding 提供商设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态记忆、sqlite-vec、额外路径以及所有其他配置选项，请参见[Memory 配置参考](/zh-CN/reference/memory-config)。

## 相关

- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [主动记忆](/zh-CN/concepts/active-memory)

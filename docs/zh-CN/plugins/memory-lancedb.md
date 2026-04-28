---
read_when:
    - 你正在配置内置的 `memory-lancedb` 插件
    - 你希望使用由 LanceDB 支持的长期记忆，并启用自动回忆或自动捕获
    - 你正在使用本地兼容 OpenAI 的嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 配置内置的 LanceDB Memory 插件，包括本地兼容 Ollama 的嵌入模型
title: Memory LanceDB
x-i18n:
    generated_at: "2026-04-28T00:47:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24f877d5fe17eecb182c0eec06c264a8e2f46d4e31987e1a10a320d36003662c
    source_path: plugins/memory-lancedb.md
    workflow: 15
---

`memory-lancedb` 是一个内置的内存插件，它将长期记忆存储在 LanceDB 中，并使用嵌入模型进行回忆。它可以在模型轮次开始前自动回忆相关记忆，并在响应后捕获重要事实。

当你希望使用本地向量数据库来存储记忆、需要一个兼容 OpenAI 的嵌入端点，或者希望将记忆数据库保存在默认内置记忆存储之外时，请使用它。

<Note>
`memory-lancedb` 是一个活动记忆插件。请通过设置 `plugins.slots.memory = "memory-lancedb"` 来启用它。像 `memory-wiki` 这样的配套插件可以与它同时运行，但活动记忆插槽只能由一个插件占用。
</Note>

## 快速开始

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

更改插件配置后，重启 Gateway 网关：

```bash
openclaw gateway restart
```

然后验证插件是否已加载：

```bash
openclaw plugins list
```

## 由提供商支持的嵌入模型

`memory-lancedb` 可以使用与 `memory-core` 相同的记忆嵌入提供商适配器。设置 `embedding.provider`，并省略 `embedding.apiKey`，即可使用该提供商已配置的身份验证配置文件、环境变量或 `models.providers.<provider>.apiKey`。

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

这种方式适用于暴露嵌入凭证的提供商身份验证配置文件。例如，当 Copilot 配置文件或套餐支持嵌入时，你可以使用 GitHub Copilot：

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth（`openai-codex`）不是 OpenAI Platform 的嵌入凭证。若要使用 OpenAI 嵌入，请使用 OpenAI API key 身份验证配置文件、`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`。仅使用 OAuth 的用户可以改用其他支持嵌入的提供商，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入模型

对于 Ollama 嵌入模型，优先推荐使用内置的 Ollama 嵌入提供商。它使用原生的 Ollama `/api/embed` 端点，并遵循 [Ollama](/zh-CN/providers/ollama) 文档中所述与 Ollama provider 相同的身份验证 / base URL 规则。

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

对于非标准嵌入模型，请设置 `dimensions`。OpenClaw 已知 `text-embedding-3-small` 和 `text-embedding-3-large` 的维度；自定义模型需要在配置中提供该值，以便 LanceDB 能够创建向量列。

如果你使用较小的本地嵌入模型，并且看到本地服务器返回上下文长度错误，请降低 `recallMaxChars`。

## 兼容 OpenAI 的提供商

某些兼容 OpenAI 的嵌入提供商会拒绝 `encoding_format` 参数，而另一些则会忽略它，并始终返回 `number[]` 向量。因此，`memory-lancedb` 会在嵌入请求中省略 `encoding_format`，并接受浮点数组响应或 base64 编码的 float32 响应。

如果你有一个原始的兼容 OpenAI 的嵌入端点，但它没有内置的提供商适配器，请省略 `embedding.provider`（或保留为 `openai`），并设置 `embedding.apiKey` 以及 `embedding.baseUrl`。这样可以保留直接兼容 OpenAI 的客户端路径。

对于模型维度不是内置已知值的提供商，请设置 `embedding.dimensions`。例如，ZhiPu `embedding-3` 使用 `2048` 维：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## 回忆与捕获限制

`memory-lancedb` 有两个独立的文本长度限制：

| 设置 | 默认值 | 范围 | 适用于 |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 发送到嵌入 API 用于回忆的文本 |
| `captureMaxChars` | `500`   | 100-10000 | 符合捕获条件的 assistant 消息长度 |

`recallMaxChars` 控制自动回忆、`memory_recall` 工具、`memory_forget` 查询路径以及 `openclaw ltm search`。自动回忆会优先使用当前轮次中最新的用户消息，只有在没有可用用户消息时才会退回到完整提示词。这样可以避免将渠道元数据和大型提示块发送到嵌入请求中。

`captureMaxChars` 控制响应是否足够短，从而可被纳入自动捕获范围。它不会限制回忆查询嵌入。

## 命令

当 `memory-lancedb` 是活动记忆插件时，它会注册 `ltm` CLI 命名空间：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

智能体还会从活动记忆插件获得 LanceDB 记忆工具：

- `memory_recall`：用于由 LanceDB 支持的回忆
- `memory_store`：用于保存重要事实、偏好、决策和实体
- `memory_forget`：用于删除匹配的记忆

## 存储

默认情况下，LanceDB 数据位于 `~/.openclaw/memory/lancedb`。你可以通过 `dbPath` 覆盖该路径：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` 接受 LanceDB 存储后端的字符串键 / 值对，并支持 `${ENV_VAR}` 展开：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## 运行时依赖

`memory-lancedb` 依赖原生的 `@lancedb/lancedb` 包。打包的 OpenClaw 安装会先尝试使用内置运行时依赖；如果内置导入不可用，它可以在 OpenClaw 状态目录下修复插件运行时依赖。

如果较旧的安装在插件加载期间记录缺少 `dist/package.json` 或缺少 `@lancedb/lancedb` 的错误，请升级 OpenClaw 并重启 Gateway 网关。

如果插件记录 LanceDB 在 `darwin-x64` 上不可用，请在该机器上使用默认记忆后端、将 Gateway 网关迁移到受支持的平台，或禁用 `memory-lancedb`。

## 故障排除

### 输入长度超过上下文长度

这通常意味着嵌入模型拒绝了回忆查询：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

设置更低的 `recallMaxChars`，然后重启 Gateway 网关：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

对于 Ollama，还要确认从 Gateway 网关主机可以访问嵌入服务器：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不受支持的嵌入模型

如果不设置 `dimensions`，则只知道内置的 OpenAI 嵌入维度。对于本地或自定义嵌入模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### 插件已加载但没有出现任何记忆

检查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 被禁用，插件会回忆现有记忆，但不会自动存储新记忆。如果你想启用自动捕获，请使用 `memory_store` 工具或启用 `autoCapture`。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [活动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [Memory Wiki](/zh-CN/plugins/memory-wiki)
- [Ollama](/zh-CN/providers/ollama)

---
read_when:
    - 你正在配置内置的 memory-lancedb 插件
    - 你想要由 LanceDB 支持、具备自动召回或自动捕获功能的长期记忆
    - 你正在使用本地 OpenAI 兼容的嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 配置内置的 LanceDB 记忆插件，包括本地 Ollama 兼容的嵌入
title: Memory LanceDB
x-i18n:
    generated_at: "2026-04-29T11:47:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是一个内置记忆插件，会把长期记忆存储在
LanceDB 中，并使用嵌入进行召回。它可以在模型轮次之前自动召回相关
记忆，并在响应之后捕获重要事实。

当你想为记忆使用本地向量数据库、需要一个
OpenAI 兼容的嵌入端点，或想把记忆数据库放在默认内置记忆存储之外时，可以使用它。

<Note>
`memory-lancedb` 是一个活跃记忆插件。通过选择记忆槽位来启用它：
`plugins.slots.memory = "memory-lancedb"`。`memory-wiki` 等配套插件可以与它并行运行，但只有一个插件拥有活跃记忆槽位。
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

然后验证插件已加载：

```bash
openclaw plugins list
```

## 提供商支持的嵌入

`memory-lancedb` 可以使用与 `memory-core` 相同的记忆嵌入提供商适配器。设置 `embedding.provider` 并省略 `embedding.apiKey`，即可使用该提供商已配置的认证配置文件、环境变量，或 `models.providers.<provider>.apiKey`。

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

这一路径适用于公开嵌入凭据的提供商认证配置文件。例如，当 Copilot 配置文件/套餐支持嵌入时，可以使用 GitHub Copilot：

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

OpenAI Codex / ChatGPT OAuth（`openai-codex`）不是 OpenAI Platform 的嵌入凭据。对于 OpenAI 嵌入，请使用 OpenAI API 密钥认证配置文件、`OPENAI_API_KEY`，或 `models.providers.openai.apiKey`。仅使用 OAuth 的用户可以改用其他具备嵌入能力的提供商，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入

对于 Ollama 嵌入，优先使用内置的 Ollama 嵌入提供商。它使用原生 Ollama `/api/embed` 端点，并遵循 [Ollama](/zh-CN/providers/ollama) 中记录的相同认证/base URL 规则。

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

为非标准嵌入模型设置 `dimensions`。OpenClaw 知道 `text-embedding-3-small` 和 `text-embedding-3-large` 的维度；自定义模型需要在配置中提供该值，以便 LanceDB 创建向量列。

对于较小的本地嵌入模型，如果你看到本地服务器返回上下文长度错误，请降低 `recallMaxChars`。

## OpenAI 兼容提供商

某些 OpenAI 兼容的嵌入提供商会拒绝 `encoding_format` 参数，而其他提供商会忽略它并始终返回 `number[]` 向量。因此，`memory-lancedb` 会在嵌入请求中省略 `encoding_format`，并接受浮点数组响应或 base64 编码的 float32 响应。

如果你有一个原始的 OpenAI 兼容嵌入端点，但没有内置提供商适配器，请省略 `embedding.provider`（或将其保留为 `openai`），并设置 `embedding.apiKey` 和 `embedding.baseUrl`。这样可以保留直接的 OpenAI 兼容客户端路径。

对于模型维度未内置的提供商，请设置 `embedding.dimensions`。例如，智谱 `embedding-3` 使用 `2048` 维：

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

## 召回和捕获限制

`memory-lancedb` 有两个独立的文本限制：

| 设置              | 默认值  | 范围      | 适用于                                        |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 发送到嵌入 API 用于召回的文本                 |
| `captureMaxChars` | `500`   | 100-10000 | 可被捕获的助手消息长度                        |

`recallMaxChars` 控制自动召回、`memory_recall` 工具、`memory_forget` 查询路径，以及 `openclaw ltm search`。自动召回会优先使用该轮次中的最新用户消息，并且只有在没有可用用户消息时才回退到完整提示词。这样可以避免把渠道元数据和大型提示词块放入嵌入请求。

`captureMaxChars` 控制响应是否足够短、可以纳入自动捕获考虑范围。它不会限制召回查询嵌入。

## 命令

当 `memory-lancedb` 是活跃记忆插件时，它会注册 `ltm` CLI 命名空间：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

该插件还会为 `openclaw memory` 扩展一个非向量的 `query` 子命令，该命令直接针对 LanceDB 表运行：

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`：逗号分隔的列允许列表（默认值为 `id`、`text`、`importance`、`category`、`createdAt`）。
- `--filter <condition>`：SQL 风格的 WHERE 子句；最多 200 个字符，并限制为字母数字、比较运算符、引号、括号，以及少量安全标点。
- `--limit <n>`：正整数；默认值为 `10`。
- `--order-by <column>:<asc|desc>`：在筛选后应用的内存内排序；排序列会自动包含在投影中。

智能体还会从活跃记忆插件获得 LanceDB 记忆工具：

- `memory_recall` 用于 LanceDB 支持的召回
- `memory_store` 用于保存重要事实、偏好、决策和实体
- `memory_forget` 用于移除匹配的记忆

## 存储

默认情况下，LanceDB 数据位于 `~/.openclaw/memory/lancedb` 下。使用 `dbPath` 覆盖该路径：

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

`storageOptions` 接受 LanceDB 存储后端的字符串键/值对，并支持 `${ENV_VAR}` 展开：

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

`memory-lancedb` 依赖原生 `@lancedb/lancedb` 包。打包版 OpenClaw 安装会先尝试使用内置运行时依赖；当内置导入不可用时，它可以在 OpenClaw 状态目录下修复插件运行时依赖。

如果较旧的安装在插件加载期间记录缺失 `dist/package.json` 或缺失 `@lancedb/lancedb` 错误，请升级 OpenClaw 并重启 Gateway 网关。

如果插件记录 LanceDB 在 `darwin-x64` 上不可用，请在该机器上使用默认记忆后端、将 Gateway 网关迁移到受支持的平台，或禁用 `memory-lancedb`。

## 故障排除

### 输入长度超过上下文长度

这通常表示嵌入模型拒绝了召回查询：

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

对于 Ollama，还要验证 Gateway 网关主机可以访问嵌入服务器：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支持的嵌入模型

如果没有 `dimensions`，只有内置 OpenAI 嵌入维度是已知的。对于本地或自定义嵌入模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### 插件已加载但没有出现记忆

检查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已禁用，该插件会召回现有记忆，但不会自动存储新记忆。如果你想自动捕获，请使用 `memory_store` 工具或启用 `autoCapture`。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [活跃记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [Memory Wiki](/zh-CN/plugins/memory-wiki)
- [Ollama](/zh-CN/providers/ollama)

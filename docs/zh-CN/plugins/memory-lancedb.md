---
read_when:
    - 你正在配置内置的 memory-lancedb 插件
    - 你希望使用基于 LanceDB 的长期记忆，并启用自动召回或自动捕获
    - 你正在使用本地兼容 OpenAI 的嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 配置内置的 LanceDB 记忆插件，包括兼容本地 Ollama 的嵌入模型
title: Memory LanceDB
x-i18n:
    generated_at: "2026-04-28T00:01:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: e3d0e1a286dfae36967a04863c047f40b629656efa62364c65e67283d3c7a945
    source_path: plugins/memory-lancedb.md
    workflow: 15
---

`memory-lancedb` 是一个内置的记忆插件，它将长期记忆存储在 LanceDB 中，并使用嵌入模型进行召回。它可以在模型轮次开始前自动召回相关记忆，并在响应后捕获重要事实。

当你想要为记忆使用本地向量数据库、需要兼容 OpenAI 的嵌入端点，或者想让记忆数据库独立于默认的内置记忆存储之外时，可以使用它。

<Note>
`memory-lancedb` 是一个活跃记忆插件。请通过设置 `plugins.slots.memory = "memory-lancedb"` 来启用它并选择记忆槽位。像 `memory-wiki` 这样的配套插件可以与它同时运行，但只有一个插件可以拥有活跃记忆槽位。
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
            apiKey: "${OPENAI_API_KEY}",
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

## Ollama 嵌入模型

`memory-lancedb` 通过兼容 OpenAI 的 embeddings API 调用嵌入模型。对于 Ollama 嵌入模型，请在这里使用 Ollama 的 `/v1` 兼容端点。这仅用于嵌入；Ollama 聊天/模型提供商使用 [Ollama](/zh-CN/providers/ollama) 中记录的原生 Ollama API URL。

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
            apiKey: "ollama",
            baseUrl: "http://127.0.0.1:11434/v1",
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

对于非标准嵌入模型，请设置 `dimensions`。OpenClaw 知道 `text-embedding-3-small` 和 `text-embedding-3-large` 的维度；自定义模型需要你在配置中提供该值，这样 LanceDB 才能创建向量列。

对于较小的本地嵌入模型，如果你看到本地服务器返回上下文长度错误，请降低 `recallMaxChars`。

## 召回和捕获限制

`memory-lancedb` 有两个独立的文本限制：

| Setting           | Default | Range     | Applies to                                    |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 发送到嵌入 API 用于召回的文本                 |
| `captureMaxChars` | `500`   | 100-10000 | 有资格被捕获的助手消息长度                    |

`recallMaxChars` 控制自动召回、`memory_recall` 工具、`memory_forget` 查询路径以及 `openclaw ltm search`。自动召回会优先使用当前轮次中最新的用户消息，只有在没有用户消息可用时才回退到完整提示词。这样可以避免将渠道元数据和大型提示词块发送到嵌入请求中。

`captureMaxChars` 控制响应是否足够短，从而可以被视为适合自动捕获。它不会限制召回查询的嵌入。

## 命令

当 `memory-lancedb` 是活跃记忆插件时，它会注册 `ltm` CLI 命名空间：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

智能体还会从活跃记忆插件获得 LanceDB 记忆工具：

- `memory_recall`：用于基于 LanceDB 的召回
- `memory_store`：用于保存重要事实、偏好、决策和实体
- `memory_forget`：用于删除匹配的记忆

## 存储

默认情况下，LanceDB 数据位于 `~/.openclaw/memory/lancedb` 下。你可以使用 `dbPath` 覆盖该路径：

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

`storageOptions` 接受用于 LanceDB 存储后端的字符串键值对，并支持 `${ENV_VAR}` 展开：

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

`memory-lancedb` 依赖原生 `@lancedb/lancedb` 包。打包后的 OpenClaw 安装会先尝试使用内置运行时依赖；当内置导入不可用时，它还能在 OpenClaw 状态目录下修复该插件的运行时依赖。

如果较旧的安装在插件加载期间记录了缺少 `dist/package.json` 或缺少 `@lancedb/lancedb` 的错误，请升级 OpenClaw 并重启 Gateway 网关。

如果插件记录 LanceDB 在 `darwin-x64` 上不可用，请在该机器上使用默认记忆后端、将 Gateway 网关迁移到受支持的平台，或禁用 `memory-lancedb`。

## 故障排除

### 输入长度超出上下文长度

这通常意味着嵌入模型拒绝了召回查询：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

请设置更低的 `recallMaxChars`，然后重启 Gateway 网关：

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

对于 Ollama，还要验证嵌入服务器可从 Gateway 网关主机访问：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支持的嵌入模型

如果没有设置 `dimensions`，系统只知道内置 OpenAI 嵌入模型的维度。对于本地或自定义嵌入模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### 插件已加载但没有出现任何记忆

检查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 被禁用，插件会召回现有记忆，但不会自动存储新记忆。如果你希望自动捕获，请使用 `memory_store` 工具或启用 `autoCapture`。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [活跃记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [Memory Wiki](/zh-CN/plugins/memory-wiki)
- [Ollama](/zh-CN/providers/ollama)

---
read_when:
    - 你正在配置 memory-lancedb 插件
    - 你想要基于 LanceDB 的长期记忆，并具备自动召回或自动捕获功能
    - 你正在使用本地 OpenAI 兼容的嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 配置官方外部 LanceDB 记忆插件，包括本地 Ollama 兼容嵌入
title: Memory LanceDB
x-i18n:
    generated_at: "2026-07-05T11:31:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是一个官方外部插件，用于在 LanceDB 中存储长期记忆，并支持向量搜索。它可以在模型轮次前自动召回相关记忆，并在响应后自动捕获重要事实。

当你需要本地向量数据库、OpenAI 兼容的嵌入端点，或默认内置记忆后端之外的记忆存储时，可以使用它。

## 安装

```bash
openclaw plugins install @openclaw/memory-lancedb
```

该插件发布到 npm；它不会内置到 OpenClaw 运行时镜像中。安装它会写入插件条目、启用插件，并将 `plugins.slots.memory` 切换为 `memory-lancedb`。如果当前已有其他插件拥有记忆槽位，该插件会被禁用并显示警告。

<Note>
`memory-wiki` 等配套插件可以与 `memory-lancedb` 并行运行，但同一时间只能有一个插件拥有活跃记忆槽位。
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

更改插件配置后重启 Gateway 网关，然后验证它已加载：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入配置

`embedding` 是必需项，且必须至少包含一个字段。`provider` 默认值为 `openai`；`model` 默认值为 `text-embedding-3-small`。

| 字段                   | 类型          | 说明                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 字符串        | 适配器 ID，例如 `openai`、`github-copilot`、`ollama`。默认值为 `openai`。 |
| `embedding.model`      | 字符串        | 默认值为 `text-embedding-3-small`。                                      |
| `embedding.apiKey`     | 字符串        | 可选；支持 `${ENV_VAR}` 展开。                                           |
| `embedding.baseUrl`    | 字符串        | 可选；支持 `${ENV_VAR}` 展开。                                           |
| `embedding.dimensions` | 整数 (>=1) | 对于不在内置表中的模型是必需项（见下文）。               |

存在两种请求路径：

- **提供商适配器路径**（默认）：设置 `embedding.provider`，并省略
  `embedding.apiKey`/`embedding.baseUrl`。该插件会通过 `memory-core` 使用的相同记忆嵌入适配器，解析提供商已配置的凭证配置文件、环境变量或 `models.providers.<provider>.apiKey`。这是 `github-copilot`、`ollama` 以及任何其他支持嵌入的内置提供商所用的路径。
- **直接 OpenAI 兼容客户端路径**：不设置 `embedding.provider`（或设为 `"openai"`），并设置 `embedding.apiKey` 和 `embedding.baseUrl`。当原始 OpenAI 兼容嵌入端点没有内置提供商适配器时，使用此路径。

OpenAI Codex / ChatGPT OAuth 不是 OpenAI Platform 嵌入凭证。对于 OpenAI 嵌入，请使用 OpenAI API key 凭证配置文件、`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`。仅使用 OAuth 的用户应选择其他支持嵌入的提供商，例如 `github-copilot` 或 `ollama`。

```json5
{
  plugins: {
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

某些 OpenAI 兼容嵌入端点会拒绝 `encoding_format` 参数；其他端点会忽略它并始终返回 `number[]`。`memory-lancedb` 会在请求中省略 `encoding_format`，并接受浮点数组或 base64 编码的 float32 响应，因此两种响应形态都无需配置即可使用。

### 维度

OpenClaw 仅内置了 `text-embedding-3-small` (1536) 和 `text-embedding-3-large` (3072) 的维度。任何其他模型都需要显式设置 `embedding.dimensions`，以便 LanceDB 可以创建向量列，例如 2048 维的智谱 `embedding-3`：

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

## Ollama 嵌入

使用内置 Ollama 提供商适配器路径（`embedding.provider: "ollama"`）。它会调用 Ollama 的原生 `/api/embed` 端点，并遵循与 [Ollama](/zh-CN/providers/ollama) 提供商相同的凭证/base URL 规则。

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

`mxbai-embed-large` 不在内置维度表中，因此 `dimensions` 是必需项。对于较小的本地嵌入模型，如果本地服务器返回上下文长度错误，请降低 `recallMaxChars`。

## 召回和捕获限制

| 设置              | 默认值 | 范围                         | 适用于                                                     |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 发送到嵌入 API 用于召回的文本。                           |
| `captureMaxChars` | `500`   | 100-10000                    | 可用于自动捕获的消息长度。                                |
| `customTriggers`  | `[]`    | 0-50 项，每项 <=100 字符 | 使自动捕获考虑某条消息的字面短语。 |

`recallMaxChars` 会限制 `before_prompt_build` 自动召回查询、`memory_recall` 工具、`memory_forget` 查询路径以及 `openclaw ltm search`。自动召回会嵌入该轮次中的最新用户消息，并且仅在没有用户消息时回退到完整提示，从而避免将频道元数据和大型提示块放入嵌入请求中。

`captureMaxChars` 控制该轮次 `agent_end` 事件中的用户消息是否足够短、可被考虑用于自动捕获；它不会影响召回查询。

`customTriggers` 会添加不使用正则表达式的字面自动捕获短语。内置触发器覆盖常见的英语、捷克语、中文、日语和韩语记忆短语（`remember`、`prefer`、`记住`、`覚えて`、`기억해` 以及类似短语）。

自动捕获还会拒绝看起来像信封/传输元数据、提示注入载荷或已注入的 `<relevant-memories>` 上下文的文本，并将每个智能体轮次最多捕获 3 条记忆。

## 命令

只要安装了 `memory-lancedb`，它就会注册 `ltm` CLI 命名空间（不只是当它拥有活跃记忆槽位时）：

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` 会直接针对 LanceDB 表运行非向量查询：

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 标志                              | 默认值                                  | 说明                                                                                                                                      |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 逗号分隔的列允许列表。                                                                                                                    |
| `--filter <condition>`            | 无                                      | SQL 风格的 WHERE 子句。最多 200 个字符；仅允许字母数字、`_-`、空白，以及 `='"<>!.,()%*`。                              |
| `--limit <n>`                     | `10`                                    | 正整数。                                                                                                                                  |
| `--order-by <column>:<asc\|desc>` | 无                                      | 过滤运行后在内存中排序；排序列会自动添加到投影中，如果未被请求，则会从输出中剥离。 |

智能体会从活跃记忆插件获得三个工具：

- `memory_recall`：对已存储记忆进行向量搜索。
- `memory_store`：保存事实、偏好、决策或实体（拒绝看起来像提示注入载荷的文本；跳过近似重复的存储）。
- `memory_forget`：按 `memoryId` 删除，或按 `query` 删除（自动删除一个分数高于 90% 的匹配项，否则列出候选 ID 以便消歧）。

## 存储

LanceDB 数据默认位于 `~/.openclaw/memory/lancedb`。使用 `dbPath` 覆盖：

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

`storageOptions` 接受用于 LanceDB 存储后端（例如 S3 兼容对象存储）的字符串键/值对，并支持 `${ENV_VAR}` 展开：

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

## 运行时依赖和平台支持

`memory-lancedb` 依赖原生 `@lancedb/lancedb` 包，该包由插件包拥有（不是 OpenClaw 核心发行包）。Gateway 网关启动不会修复插件依赖；如果原生依赖缺失或加载失败，请重新安装或更新插件包并重启 Gateway 网关。

`@lancedb/lancedb` 不发布适用于 `darwin-x64`（Intel Mac）的原生构建。在该平台上，插件会在加载时记录 LanceDB 不可用；请使用默认记忆后端、在受支持的平台/架构上运行 Gateway 网关，或禁用 `memory-lancedb`。

## 故障排查

### 输入长度超过上下文长度

嵌入模型拒绝了召回查询：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

降低 `recallMaxChars`，然后重启 Gateway 网关：

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

对于 Ollama，还要使用其原生 embed 端点验证嵌入服务器可从 Gateway 网关主机访问：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支持的嵌入模型

如果没有 `embedding.dimensions`，只知道内置 OpenAI 嵌入维度（`text-embedding-3-small`、`text-embedding-3-large`）。对于任何其他模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### 插件已加载但没有显示记忆

确认 `plugins.slots.memory` 指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已禁用，插件仍会召回现有记忆，但不会自动存储新的记忆。请使用 `memory_store` 工具，或启用 `autoCapture`。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [Memory Wiki](/zh-CN/plugins/memory-wiki)
- [Ollama](/zh-CN/providers/ollama)

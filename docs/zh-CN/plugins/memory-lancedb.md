---
read_when:
    - 你正在配置 memory-lancedb 插件
    - 你希望使用由 LanceDB 支持、具备自动回忆或自动捕获功能的长期记忆
    - 你正在使用与 OpenAI 兼容的本地嵌入模型，例如 Ollama
sidebarTitle: Memory LanceDB
summary: 配置官方外部 Memory LanceDB 插件，包括本地 Ollama 兼容嵌入模型
title: Memory LanceDB
x-i18n:
    generated_at: "2026-07-16T11:46:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` 是一个官方外部插件，使用 LanceDB 和向量搜索存储长期记忆。它可以在模型轮次之前自动召回相关记忆，并在响应之后自动捕获重要事实。

它适用于本地向量数据库、兼容 OpenAI 的嵌入端点，或默认内置记忆后端之外的记忆存储。

## 安装

```bash
openclaw plugins install @openclaw/memory-lancedb
```

该插件发布在 npm 上；它并未内置于 OpenClaw 运行时镜像中。安装会写入插件条目、启用插件，并将 `plugins.slots.memory` 切换为 `memory-lancedb`。如果当前由另一个插件占用记忆槽位，则会禁用该插件并发出警告。

<Note>
`memory-wiki` 等配套插件可以与 `memory-lancedb` 同时运行，但同一时间只能有一个插件占用活动记忆槽位。
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

更改插件配置后重启 Gateway 网关，然后验证它是否已加载：

```bash
openclaw gateway restart
openclaw plugins list
```

## 嵌入配置

`embedding` 是必需项，并且必须至少包含一个字段。`provider` 默认为 `openai`；`model` 默认为 `text-embedding-3-small`。

| 字段                  | 类型          | 说明                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 字符串        | 适配器 ID，例如 `openai`、`github-copilot`、`ollama`。默认为 `openai`。 |
| `embedding.model`      | 字符串        | 默认为 `text-embedding-3-small`。                                        |
| `embedding.apiKey`     | 字符串        | 可选；支持 `${ENV_VAR}` 展开。                               |
| `embedding.baseUrl`    | 字符串        | 可选；支持 `${ENV_VAR}` 展开。                               |
| `embedding.dimensions` | 整数 (>=1) | 对于不在内置表中的模型为必需项（见下文）。               |

存在两种请求路径：

- **提供商适配器路径**（默认）：设置 `embedding.provider`，并省略
  `embedding.apiKey`/`embedding.baseUrl`。该插件会通过 `memory-core` 使用的相同记忆嵌入适配器，解析提供商已配置的身份验证配置文件、环境变量或
  `models.providers.<provider>.apiKey`。此路径适用于 `github-copilot`、`ollama`
  以及任何其他支持嵌入的内置提供商。
- **兼容 OpenAI 的直接客户端路径**：不设置 `embedding.provider`
  （或设置为 `"openai"`），并设置 `embedding.apiKey` 和 `embedding.baseUrl`。此路径适用于没有内置提供商适配器的原始 OpenAI 兼容嵌入端点。

OpenAI Codex / ChatGPT OAuth 不是 OpenAI Platform 嵌入凭据。
对于 OpenAI 嵌入，请使用 OpenAI API key 身份验证配置文件、`OPENAI_API_KEY` 或
`models.providers.openai.apiKey`。仅使用 OAuth 的用户应选择其他支持嵌入的提供商，例如 `github-copilot` 或 `ollama`。

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

某些兼容 OpenAI 的嵌入端点会拒绝 `encoding_format` 参数；其他端点会忽略它，并始终返回 `number[]`。`memory-lancedb` 会在请求中省略 `encoding_format`，并接受浮点数数组或以 base64 编码的 float32 响应，因此两种响应格式无需配置即可使用。

### 维度

OpenClaw 仅为 `text-embedding-3-small` (1536) 和
`text-embedding-3-large` (3072) 提供内置维度。其他模型都需要显式设置
`embedding.dimensions`，以便 LanceDB 创建向量列，例如维度为 2048 的
ZhiPu `embedding-3`：

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

使用内置的 Ollama 提供商适配器路径（`embedding.provider: "ollama"`）。
它调用 Ollama 的原生 `/api/embed` 端点，并遵循与 [Ollama](/zh-CN/providers/ollama) 提供商相同的身份验证/基础 URL 规则。

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

`mxbai-embed-large` 不在内置维度表中，因此必须设置 `dimensions`。对于小型本地嵌入模型，如果本地服务器返回上下文长度错误，请降低 `recallMaxChars`。

## 召回和捕获限制

| 设置           | 默认值 | 范围                        | 适用于                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 为召回而发送至嵌入 API 的文本。                 |
| `captureMaxChars` | `500`   | 100-10000                    | 符合自动捕获条件的消息长度。                  |
| `customTriggers`  | `[]`    | 0-50 项，每项 <=100 个字符 | 使自动捕获考虑某条消息的字面短语。 |

`recallMaxChars` 限制 `before_prompt_build` 自动召回查询、
`memory_recall` 工具、`memory_forget` 查询路径和 `openclaw ltm
search`。自动召回会嵌入该轮次中的最新用户消息，仅在不存在用户消息时才回退到完整提示词，从而避免将渠道元数据和大型提示词块包含在嵌入请求中。

`captureMaxChars` 控制轮次的 `agent_end`
事件中的用户消息是否足够短，从而可被纳入自动捕获考虑；它不会影响召回查询。

`customTriggers` 可添加不使用正则表达式的字面自动捕获短语。内置触发词涵盖常见的英语、捷克语、中文、日语和韩语记忆短语（`remember`、`prefer`、`记住`、`覚えて`、`기억해` 等）。

自动捕获还会拒绝看起来像信封/传输元数据、提示词注入载荷或已注入的 `<relevant-memories>` 上下文的文本，并将每个智能体轮次捕获的记忆数量限制为 3 条。

每条记忆均归一个智能体所有。召回、重复检测、捕获、列出、原始查询和删除都会在返回或修改行之前强制检查该所有者。设置了 `memorySearch.enabled: false`（位于 `agents.list[]` 中或通过 `agents.defaults` 设置）的智能体也不会获得 `memory_recall`、`memory_store` 或 `memory_forget` 工具，并且不会参与自动召回或捕获，即使插件级 `autoRecall`/`autoCapture` 标志已开启。

## 命令

只要安装了 `memory-lancedb`，它就会注册 `ltm` CLI 命名空间（而不仅仅是在它占用活动记忆槽位时）：

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` 直接对 LanceDB 表运行非向量查询：

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 标志                              | 默认值                                 | 说明                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | 已配置的默认智能体                | 选择私有智能体命名空间。可用于 `list`、`search`、`query` 和 `stats`。                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 以逗号分隔的列允许列表。                                                                                                         |
| `--filter <condition>`            | 无                                    | 对输出列执行一次比较，例如 `category = 'preference'` 或 `importance >= 0.8`。字符串值必须加引号。             |
| `--limit <n>`                     | `10`                                    | 正整数。                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | 无                                    | 过滤器运行后在内存中排序；排序列会自动添加到投影中，如果未请求该列，则从输出中移除。 |

智能体可从活动记忆插件获得三个工具：

- `memory_recall`：对已存储的记忆执行向量搜索。
- `memory_store`：保存事实、偏好、决策或实体（拒绝看起来像提示词注入载荷的文本；跳过近似重复的存储内容）。
- `memory_forget`：按 `memoryId` 删除，或按 `query` 删除（自动删除得分高于 90% 的单个匹配项，否则列出候选 ID 以消除歧义）。

## 存储

LanceDB 数据默认存储在 `~/.openclaw/memory/lancedb`。可通过 `dbPath` 覆盖：

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

该插件维护一个 LanceDB 表，并在每一行存储规范化的智能体所有者。这是存储边界，而不是搜索后的过滤器：智能体所有权在向量排名之前应用，并包含在列出、查询、计数和删除谓词中。`ltm query --filter` 接受对公共输出列进行的一次经过验证的比较。存储会将该比较与强制所有者谓词分开构建，因此过滤器无法将查询范围扩大到其他智能体。

在按智能体划分所有权之前创建的数据库没有可靠的行来源信息。升级时，`openclaw doctor --fix` 会将这些旧版行一次性分配给已配置的默认智能体。在迁移完成之前，运行时访问会以关闭方式失败；其他智能体永远不会继承旧的共享行。

`storageOptions` 接受用于 LanceDB 存储后端（例如兼容 S3 的对象存储）的字符串键值对，并支持 `${ENV_VAR}` 展开：

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

## 运行时依赖项和平台支持

`memory-lancedb` 依赖原生 `@lancedb/lancedb` 软件包，该软件包归插件包所有（不属于 OpenClaw 核心发行版）。Gateway 网关启动时不会修复插件依赖项；如果缺少原生依赖项或加载失败，请重新安装或更新插件包，然后重启 Gateway 网关。

`@lancedb/lancedb` 不为 `darwin-x64`（Intel Mac）发布原生构建。在该平台上，插件会在加载时记录 LanceDB 不可用；请使用默认记忆后端、在受支持的平台/架构上运行 Gateway 网关，或禁用 `memory-lancedb`。

## 故障排查

### 输入长度超出上下文长度

嵌入模型拒绝了召回查询：

```text
memory-lancedb: 召回失败：错误：400 输入长度超出上下文长度
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

对于 Ollama，还应使用其原生嵌入端点，验证 Gateway 网关主机能否访问嵌入服务器：

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支持的嵌入模型

如果没有 `embedding.dimensions`，则仅已知内置 OpenAI 嵌入模型的维度（`text-embedding-3-small`、`text-embedding-3-large`）。对于任何其他模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### 插件已加载，但未显示任何记忆

确认 `plugins.slots.memory` 指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 已禁用，插件仍会召回现有记忆，但不会自动存储新记忆。请使用 `memory_store` 工具，或启用 `autoCapture`。

## 相关内容

- [记忆概览](/zh-CN/concepts/memory)
- [主动记忆](/zh-CN/concepts/active-memory)
- [记忆搜索](/zh-CN/concepts/memory-search)
- [Memory Wiki](/zh-CN/plugins/memory-wiki)
- [Ollama](/zh-CN/providers/ollama)

---
read_when:
    - 你想配置记忆搜索提供商或嵌入模型
    - 你想要设置 QMD 后端
    - 你想要调整混合搜索、MMR 或时间衰减参数
    - 你希望启用多模态记忆索引
sidebarTitle: Memory config
summary: 内存搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置选项
title: 记忆配置参考
x-i18n:
    generated_at: "2026-07-12T14:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

此页面列出了 OpenClaw 记忆搜索的所有配置选项。有关概念性概览，请参阅：

<CardGroup cols={2}>
  <Card title="记忆概览" href="/zh-CN/concepts/memory">
    记忆的工作原理。
  </Card>
  <Card title="内置引擎" href="/zh-CN/concepts/memory-builtin">
    默认 SQLite 后端。
  </Card>
  <Card title="QMD 引擎" href="/zh-CN/concepts/memory-qmd">
    本地优先的辅助进程。
  </Card>
  <Card title="记忆搜索" href="/zh-CN/concepts/memory-search">
    搜索管线和调优。
  </Card>
  <Card title="主动记忆" href="/zh-CN/concepts/active-memory">
    用于交互式会话的记忆子智能体。
  </Card>
</CardGroup>

除非另有说明，否则所有记忆搜索设置都位于 `openclaw.json` 的 `agents.defaults.memorySearch` 下（或按智能体通过 `agents.list[].memorySearch` 覆盖）。

<Note>
如果你要查找的是**主动记忆**功能开关和子智能体配置，它位于 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

主动记忆采用双重门控模型：

1. 插件必须已启用，并以当前智能体 ID 为目标
2. 请求必须来自符合条件的交互式持久聊天会话

有关激活模型、插件所有的配置、对话记录持久化和安全发布模式，请参阅[主动记忆](/zh-CN/concepts/active-memory)。
</Note>

---

## 提供商选择

| 键         | 类型      | 默认值           | 描述                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 启用或禁用记忆搜索                                                                                                                                                                                                                                                                          |
| `provider` | `string`  | `"openai"`       | 嵌入适配器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已配置的 `models.providers.<id>`，其 `api` 指向记忆嵌入适配器或 OpenAI 兼容模型 API |
| `model`    | `string`  | 提供商默认值     | 嵌入模型名称                                                                                                                                                                                                                                                                                |
| `fallback` | `string`  | `"none"`         | 主适配器失败时使用的回退适配器 ID                                                                                                                                                                                                                                                          |

未设置 `provider` 时，OpenClaw 使用 OpenAI 嵌入。显式设置 `provider`
可使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、
Voyage、本地 GGUF 模型或 OpenAI 兼容的 `/v1/embeddings` 端点。
仍使用 `provider: "auto"` 的旧版配置会解析为 `openai`。

<Warning>
更改嵌入提供商、模型、提供商设置、来源、作用域、
分块方式或分词器，可能导致现有 SQLite 向量索引不兼容。
OpenClaw 会暂停向量搜索并报告索引标识警告，而不是
自动重新嵌入所有内容。准备就绪后，使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建索引。
</Warning>

当未设置 `provider`、存在旧版 `provider: "auto"`，或
`provider: "none"` 有意选择仅 FTS 模式时，即使嵌入不可用，记忆召回仍可
使用词法 FTS 排名。

显式指定的非本地提供商采用故障关闭策略。如果将 `memorySearch.provider` 设置为
由具体远程服务支持的提供商，例如 Bedrock、DeepInfra、Gemini、GitHub
Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage 或 OpenAI 兼容的
自定义提供商，而该提供商在运行时不可用，则 `memory_search`
会返回不可用结果，而不会静默改用仅 FTS 召回。请修复
提供商/身份验证配置、切换到可访问的提供商，或在需要有意仅使用 FTS 召回时设置
`provider: "none"`。

### 自定义提供商 ID

对于 `ollama` 等记忆专用提供商适配器，或 `openai-responses` / `openai-completions` 等 OpenAI 兼容模型 API，`memorySearch.provider` 可以指向自定义的 `models.providers.<id>` 条目。OpenClaw 会解析该提供商的 `api` 所有者以确定嵌入适配器，同时保留自定义提供商 ID，用于端点、身份验证和模型前缀处理。这样，多 GPU 或多主机设置就可以将记忆嵌入专用于特定的本地端点：

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API 密钥解析

远程嵌入需要 API 密钥。Bedrock 改用 AWS SDK 默认凭证链（实例角色、SSO、访问密钥或 Bedrock API 密钥）。

| 提供商         | 环境变量                                            | 配置键                              |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 凭证链或 `AWS_BEARER_TOKEN_BEDROCK`             | 无需 API 密钥                       |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 通过设备登录获得的身份验证配置文件  |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（占位符）                          | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 仅适用于聊天/补全，不能满足嵌入请求。
</Note>

---

## 远程端点配置

对于不应继承全局 OpenAI 聊天凭证的通用 OpenAI 兼容
`/v1/embeddings` 服务器，请使用 `provider: "openai-compatible"`。

<ParamField path="remote.baseUrl" type="string">
  自定义 API 基础 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆盖 API 密钥。
</ParamField>
<ParamField path="remote.headers" type="object">
  额外的 HTTP 标头（与提供商默认值合并）。
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## 提供商特定配置

<AccordionGroup>
  <Accordion title="Gemini">
    | 键                     | 类型     | 默认值                 | 描述                                      |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 还支持 `gemini-embedding-2-preview`       |
    | `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072       |

    <Warning>
    更改模型或 `outputDimensionality` 会改变索引标识。OpenClaw
    会暂停向量搜索，直到你显式重建记忆索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 兼容输入类型">
    OpenAI 兼容的嵌入端点可以选择使用提供商特定的 `input_type` 请求字段。这适用于要求为查询嵌入和文档嵌入使用不同标签的非对称嵌入模型。

    | 键                  | 类型     | 默认值 | 描述                                                |
    | ------------------- | -------- | ------ | --------------------------------------------------- |
    | `inputType`         | `string` | 未设置 | 查询和文档嵌入共用的 `input_type`                   |
    | `queryInputType`    | `string` | 未设置 | 查询时的 `input_type`；覆盖 `inputType`             |
    | `documentInputType` | `string` | 未设置 | 索引/文档的 `input_type`；覆盖 `inputType`          |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    当上游模型以不同方式处理这些标签时，更改这些值会影响提供商批量索引的嵌入缓存标识，之后应重新索引记忆。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入配置

    Bedrock 使用 AWS SDK 默认凭证链以及由 OpenClaw 检查的持有者令牌，因此配置中不会存储 API 密钥。如果 OpenClaw 在具有 Bedrock 权限的实例角色的 EC2 上运行，只需设置提供商和模型：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | 键                     | 类型     | 默认值                         | 描述                            |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意 Bedrock 嵌入模型 ID        |
    | `outputDimensionality` | `number` | 模型默认值                     | 对于 Titan V2：256、512 或 1024 |

    **支持的模型**（包含系列检测和默认维度）：

    | 模型 ID                                    | 提供商     | 默认维度 | 可配置维度                      |
    | ------------------------------------------- | ---------- | -------- | ------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024     | 256, 512, 1024                  |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536     | --                              |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536     | --                              |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024     | --                              |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024     | 256, 384, 1024, 3072            |
    | `cohere.embed-english-v3`                  | Cohere     | 1024     | --                              |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024     | --                              |
    | `cohere.embed-v4:0`                        | Cohere     | 1536     | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512      | --                              |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024     | --                              |

    带吞吐量后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）和带区域前缀的推理配置文件 ID（例如 `us.amazon.titan-embed-text-v2:0`）继承基础模型的配置。

    **区域：**按以下顺序解析：`memorySearch.remote.baseUrl` 覆盖值、`models.providers.amazon-bedrock.baseUrl` 配置、`AWS_REGION`、`AWS_DEFAULT_REGION`，最后默认使用 `us-east-1`。

    **身份验证：**OpenClaw 首先检查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，然后回退到标准 AWS SDK 默认凭证提供商链：

    1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非同时设置了 `AWS_PROFILE`
    2. SSO（仅当配置了 SSO 字段时）
    3. 共享凭证和配置文件（`fromIni`，包括 `AWS_PROFILE`）
    4. 凭证进程（AWS 配置文件中的 `credential_process`）
    5. Web 身份令牌凭证
    6. ECS 或 EC2 实例元数据凭证

    **IAM 权限：**IAM 角色或用户需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    为实现最小权限，请将 `InvokeModel` 的范围限定为特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本地（GGUF + llama.cpp）">
    | 键                    | 类型               | 默认值                  | 描述                                                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自动下载                | GGUF 模型文件的路径                                                                                                                                                                                                                                                                                                                           |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 默认值   | 已下载模型的缓存目录                                                                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | 嵌入上下文的上下文窗口大小。4096 可覆盖典型分块（128-512 个令牌），同时限制非权重显存占用。在资源受限的主机上可降至 1024-2048。`"auto"` 使用模型训练时的最大值——不建议用于 8B+ 模型（Qwen3-Embedding-8B：最高 40 960 个令牌可能会将显存占用推高至约 32 GB）。 |

    请先安装官方 llama.cpp 提供商：`openclaw plugins install @openclaw/llama-cpp-provider`。
    默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。源码检出仍需要批准原生构建：先运行 `pnpm approve-builds`，然后运行 `pnpm rebuild node-llama-cpp`。

    使用独立 CLI 验证与 Gateway 网关相同的提供商路径：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    数值型 `local.contextSize` 值还会影响 node-llama-cpp 的 GPU 层自动放置，使模型权重和请求的嵌入上下文能够一起装入。运行时加载后，`openclaw memory status --deep` 会报告最后已知的 llama.cpp 后端、设备、卸载、请求的上下文以及带时间戳的内存信息；被动状态检查不会加载模型。

    对于本地 GGUF 嵌入，请显式设置 `provider: "local"`。显式本地配置支持 `hf:` 和 HTTP(S) 模型引用（通过 node-llama-cpp 的模型解析），但它们不会更改默认提供商。

  </Accordion>
</AccordionGroup>

### 内联嵌入超时

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆盖记忆索引期间内联嵌入批次的超时时间。

未设置时使用提供商默认值：`local`、`ollama` 和 `lmstudio` 等本地/自行托管的提供商为 600 秒，托管提供商为 120 秒。当本地 CPU 密集型嵌入批次运行正常但速度较慢时，请增大此值。
</ParamField>

---

## 索引行为

除非另有说明，以下配置均位于 `memorySearch.sync` 下：

| 键                             | 类型      | 默认值 | 描述                                             |
| ------------------------------ | --------- | ------ | ------------------------------------------------ |
| `onSessionStart`               | `boolean` | `true` | 会话启动时同步记忆索引                           |
| `onSearch`                     | `boolean` | `true` | 检测到内容更改后，在搜索时延迟同步               |
| `watch`                        | `boolean` | `true` | 监视记忆文件（chokidar），并在发生更改时安排重建索引 |
| `watchDebounceMs`              | `number`  | `1500` | 合并快速文件监视事件的防抖时间窗口               |
| `intervalMinutes`              | `number`  | `0`    | 以分钟为单位的定期重建索引间隔（`0` 表示禁用）   |
| `sessions.postCompactionForce` | `boolean` | `true` | 在压缩触发转录更新后强制重建会话索引             |

<ParamField path="chunking.tokens" type="number">
  在嵌入前拆分记忆源时使用的分块大小，以 token 计（默认值：400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  相邻分块之间的 token 重叠量，用于保留拆分边界附近的上下文（默认值：80）。
</ParamField>

<Note>
更改 `chunking.tokens` 或 `chunking.overlap` 会改变分块边界，并使现有索引标识失效（请参阅“提供商选择”下的警告）。
</Note>

---

## 混合搜索配置

以下配置均位于 `memorySearch.query` 下：

| 键           | 类型     | 默认值 | 描述                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | 注入前返回的最大记忆命中数 |
| `minScore`   | `number` | `0.35`  | 纳入命中结果所需的最低相关性分数  |

以下配置位于 `memorySearch.query.hybrid` 下：

| 键                    | 类型      | 默认值 | 描述                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | 启用 BM25 + 向量混合搜索 |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数的权重（0-1）     |
| `textWeight`          | `number`  | `0.3`   | BM25 分数的权重（0-1）       |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小倍数     |

<Tabs>
  <Tab title="MMR（多样性）">
    | 键            | 类型      | 默认值 | 描述                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性 |
  </Tab>
  <Tab title="时间衰减（新近度）">
    | 键                           | 类型      | 默认值 | 描述               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 启用新近度提升      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 分数每 N 天减半 |

    长期有效的文件（`MEMORY.md`、`memory/` 中不含日期的文件）永不衰减。

  </Tab>
</Tabs>

### 完整示例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## 其他记忆路径

| 键           | 类型       | 描述                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | 要编入索引的其他目录或文件 |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

路径可以是绝对路径，也可以是相对于工作区的路径。目录会以递归方式扫描其中的 `.md` 文件。符号链接的处理取决于当前启用的后端：内置引擎会跳过符号链接，而 QMD 则遵循底层 QMD 扫描器的行为。

对于 Agent 范围内的跨 Agent 对话记录搜索，请使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。这些额外集合采用相同的 `{ path, name, pattern? }` 结构，但会按 Agent 合并；当路径指向当前工作区之外时，还可以保留明确指定的共享名称。如果同一解析后的路径同时出现在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 会保留第一个条目并跳过重复项。

---

## 多模态记忆（Gemini）

使用 Gemini Embedding 2 将图像和音频与 Markdown 一同编入索引：

| 键                        | 类型       | 默认值     | 描述                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 可编入索引的最大文件大小（10 MiB）    |

<Note>
仅适用于 `extraPaths` 中的文件。默认记忆根目录仍仅支持 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。
</Note>

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键                 | 类型      | 默认值  | 描述                          |
| ------------------ | --------- | ------- | ----------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中缓存分块嵌入      |
| `cache.maxEntries` | `number`  | 未设置  | 缓存嵌入数量的尽力而为上限    |

避免在重新索引或更新转录记录时对未更改的文本重新生成嵌入。将 `maxEntries` 保持为未设置可使用无界缓存；如果磁盘增长比重新索引的峰值速度更重要，请设置该值。设置后，一旦缓存超过限制，将优先清理最旧的条目（按最后更新时间排序）。

---

## 批量索引

| 键                            | 类型      | 默认值  | 描述                 |
| ----------------------------- | --------- | ------- | -------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 并行内联嵌入         |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API     |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理作业       |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成       |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 轮询间隔             |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 批处理超时           |

适用于 `gemini`、`openai` 和 `voyage`。对于大规模回填，OpenAI 批处理通常速度最快且成本最低。

`remote.nonBatchConcurrency` 控制本地/自托管提供商使用的内联嵌入调用，以及未启用提供商批处理 API 时托管提供商使用的内联嵌入调用。Ollama 的非批量索引默认值为 `1`，以避免给规模较小的本地主机造成过大压力；在配置更高的计算机上可设置更大的值。

这与 `sync.embeddingBatchTimeoutSeconds` 不同，后者控制内联嵌入调用的超时时间。

---

## 会话记忆搜索（实验性）

为会话转录记录建立索引，并通过 `memory_search` 提供这些记录：

| 键                            | 类型       | 默认值       | 描述                                   |
| ----------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引                           |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含转录记录       |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 触发重新索引的字节阈值                 |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 触发重新索引的消息阈值                 |

<Warning>
会话索引需要显式启用，并且异步运行。结果可能略有滞后。会话日志存储在磁盘上，因此应将文件系统访问视为信任边界。
</Warning>

会话转录记录的搜索结果也遵循
[`tools.sessions.visibility`](/zh-CN/gateway/config-tools#toolssessions)。默认的
`tree` 可见性仅公开当前会话及其派生的会话。若要从其他会话（例如私信）中
回忆由 Gateway 网关分派的同一智能体的不相关会话，请有意将可见性扩大为
`agent`（仅当还需要跨智能体回忆且智能体间策略允许时，才使用 `all`）。

以下示例将这些设置放在 `agents.defaults` 下。如果只有一个智能体应为会话
转录记录建立索引并进行搜索，也可以在该智能体的覆盖配置中应用等效的
`memorySearch` 设置。

对于同一智能体从 Gateway 网关到私信的回忆：

<Tabs>
  <Tab title="内置后端">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD 后端">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

使用 QMD 时，仅设置 `agents.defaults.memorySearch.experimental.sessionMemory` 和
`sources: ["sessions"]` 并不会将转录记录导出到 QMD。还需要设置
`memory.qmd.sessions.enabled: true`。

---

  ## SQLite 向量加速（sqlite-vec）

  | 键                           | 类型      | 默认值  | 描述                         |
  | ---------------------------- | --------- | ------- | ---------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 进行向量查询 |
  | `store.vector.extensionPath` | `string`  | 内置    | 覆盖 sqlite-vec 路径         |

  当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦相似度计算。

  ---

  ## 索引存储

  内置记忆索引位于每个智能体的 OpenClaw SQLite 数据库中：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。

  | 键                    | 类型     | 默认值      | 描述                                      |
  | --------------------- | -------- | ----------- | ----------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 分词器（`unicode61` 或 `trigram`）   |

  ---

  ## QMD 后端配置

  设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置均位于 `memory.qmd` 下：

  | 键                       | 类型      | 默认值   | 描述                                                                            |
  | ------------------------ | --------- | -------- | ------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | QMD 可执行文件路径；当服务的 `PATH` 与你的 shell 不同时，请设置绝对路径         |
  | `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`                                          |
  | `rerank`                 | `boolean` | --       | 配合 `searchMode: "query"` 和 QMD 2.1+ 设置为 `false`，以跳过 QMD 重排序        |
  | `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`                                         |
  | `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`                                            |
  | `sessions.enabled`       | `boolean` | `false`  | 将会话转录导出到 QMD                                                            |
  | `sessions.retentionDays` | `number`  | --       | 转录保留期限                                                                    |
  | `sessions.exportDir`     | `string`  | --       | 导出目录                                                                        |

  `searchMode: "search"` 仅使用词法搜索/BM25。对于该模式，OpenClaw 不会运行语义向量就绪探测或 QMD 嵌入维护，包括执行 `memory status --deep` 时；`vsearch` 和 `query` 仍然要求 QMD 向量已就绪并存在嵌入。

  `rerank: false` 仅更改 QMD `query` 模式，并要求 QMD 2.1 或更高版本。在直接 CLI 模式下，OpenClaw 会传递 `--no-rerank`；在由 mcporter 支持的 MCP 模式下，它会向 QMD 的统一查询工具传递 `rerank: false`。不设置该项即可使用 QMD 的默认查询重排序行为。

  OpenClaw 优先使用当前的 QMD 集合和 MCP 查询格式，但会在需要时尝试兼容的集合模式标志和旧版 MCP 工具名称，以保持旧版 QMD 可用。当 QMD 声明支持多个集合过滤器时，会使用一个 QMD 进程搜索同源集合；旧版 QMD 构建则继续使用逐集合兼容路径。同源是指持久记忆集合（默认记忆文件加自定义路径）归为一组，而会话转录集合仍作为单独的一组，以便来源多样化仍能同时使用这两类输入。

  <Note>
  QMD 模型覆盖设置保留在 QMD 侧，而不属于 OpenClaw 配置。如果需要全局覆盖 QMD 的模型，请在 Gateway 网关运行时环境中设置 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL` 等环境变量。
  </Note>

  ### mcporter 集成

  所有设置均位于 `memory.qmd.mcporter` 下。通过长时间运行的 `mcporter` MCP 守护进程路由 QMD 搜索，而不是为每次查询生成 `qmd` 进程，从而减少较大模型的冷启动开销。

  | 键            | 类型      | 默认值  | 描述                                                                       |
  | ------------- | --------- | ------- | -------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false` | 通过 mcporter 路由 QMD 调用，而不是为每个请求生成 `qmd` 进程               |
  | `serverName`  | `string`  | `qmd`   | 以 `lifecycle: keep-alive` 运行 `qmd mcp` 的 mcporter 服务器名称            |
  | `startDaemon` | `boolean` | `true`  | 当 `enabled` 为 true 时，自动启动 mcporter 守护进程                         |

  要求已安装 `mcporter` 且其位于 PATH 中，还需配置一个运行 `qmd mcp` 的 mcporter 服务器。对于可接受逐查询进程生成开销的简单本地设置，请保持禁用。

  <AccordionGroup>
  <Accordion title="更新计划">
    | 键                        | 类型      | 默认值   | 描述                                                                         |
    | ------------------------- | --------- | -------- | ---------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | 刷新间隔                                                                     |
    | `update.debounceMs`       | `number`  | `15000`  | 对文件更改进行防抖                                                           |
    | `update.onBoot`           | `boolean` | `true`   | 长时间运行的 QMD 管理器打开时刷新；设置为 false 可跳过启动后的立即更新       |
    | `update.startup`          | `string`  | `off`    | 可选的 Gateway 网关启动时 QMD 初始化：`off`、`idle` 或 `immediate`           |
    | `update.startupDelayMs`   | `number`  | `120000` | 运行 `startup: "idle"` 刷新前的延迟                                          |
    | `update.waitForBootSync`  | `boolean` | `false`  | 阻止管理器打开，直到初始刷新完成                                             |
    | `update.embedInterval`    | `string`  | `60m`    | 独立的嵌入执行周期                                                           |
    | `update.commandTimeoutMs` | `number`  | `30000`  | QMD 维护命令（集合列出/添加）的超时时间                                      |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 每个 `qmd update` 周期的超时时间                                             |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 每个 `qmd embed` 周期的超时时间                                              |
  </Accordion>
  <Accordion title="限制">
    | 键                        | 类型     | 默认值 | 描述                   |
    | ------------------------- | -------- | ------ | ---------------------- |
    | `limits.maxResults`       | `number` | `4`    | 最大搜索结果数         |
    | `limits.maxSnippetChars`  | `number` | `450`  | 限制摘要长度           |
    | `limits.maxInjectedChars` | `number` | `2200` | 限制注入字符总数       |
    | `limits.timeoutMs`        | `number` | `4000` | 搜索超时时间           |
  </Accordion>
  <Accordion title="范围">
    控制哪些会话可以接收 QMD 搜索结果。架构与 [`session.sendPolicy`](/zh-CN/gateway/config-agents#session) 相同：

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    内置默认设置仅允许私信/直接会话，并拒绝群组和其他渠道类型。`match.keyPrefix` 匹配规范化后的会话键；`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 适用于所有后端：

    | 值               | 行为                                                   |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（默认）   | 在片段中包含 `Source: <path#line>` 页脚                |
    | `on`             | 始终包含页脚                                           |
    | `off`            | 省略页脚（路径仍会在内部传递给智能体）                 |

  </Accordion>
</AccordionGroup>

启用 Gateway 网关启动时的 QMD 初始化后，OpenClaw 只会为符合条件的智能体启动 QMD。如果 `update.onBoot` 为 true，且未配置间隔更新或嵌入维护，则启动时会使用一次性管理器执行启动刷新，随后将其关闭。如果配置了更新或嵌入间隔，则启动时会打开长期运行的 QMD 管理器，由其管理监视器和间隔计时器；`update.onBoot: false` 只会跳过启动后立即执行的刷新。

### 完整 QMD 示例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming 在 `plugins.entries.memory-core.config.dreaming` 下配置，而不是在 `agents.defaults.memorySearch` 下。

Dreaming 作为一次定时扫描运行，并将内部的浅层/深层/REM 阶段用作实现细节。

有关概念行为和斜杠命令，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| 键                                     | 类型      | 默认值       | 说明                                                                                                                            |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全启用或禁用 Dreaming                                                                                                         |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整 Dreaming 扫描的可选 cron 周期                                                                                              |
| `model`                                | `string`  | 默认模型      | 可选的 Dream Diary 子智能体模型覆盖                                                                                             |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 从每个提升至 `MEMORY.md` 的短期回忆片段中保留的最大估算 token 数；来源元数据仍然可见                                           |

### 示例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming 将机器状态写入 `memory/.dreams/`。
- Dreaming 将人类可读的叙事输出写入 `DREAMS.md`（或现有的 `dreams.md`）。
- `dreaming.model` 使用现有的插件子智能体信任门控；启用前请设置 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- 当配置的模型不可用时，Dream Diary 会使用会话默认模型重试一次。信任或允许列表验证失败会记录到日志中，不会静默重试。
- 浅层/深层/REM 阶段策略和阈值属于内部行为，而不是面向用户的配置。

</Note>

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)

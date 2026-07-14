---
read_when:
    - 你想要配置记忆搜索提供商或嵌入模型
    - 你想要设置 QMD 后端
    - 你想要调整混合搜索、MMR 或时间衰减机制
    - 你想启用多模态记忆索引
sidebarTitle: Memory config
summary: 记忆搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置选项
title: 记忆配置参考
x-i18n:
    generated_at: "2026-07-14T13:54:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 1947d6d654de85059ef777a3a6387f6db5b76c8d688fbb539a063162d323c1f6
    source_path: reference/memory-config.md
    workflow: 16
---

本页列出了 OpenClaw 记忆搜索的所有配置选项。有关概念性概览，请参阅：

<CardGroup cols={2}>
  <Card title="记忆概览" href="/zh-CN/concepts/memory">
    记忆的工作原理。
  </Card>
  <Card title="内置引擎" href="/zh-CN/concepts/memory-builtin">
    默认的 SQLite 后端。
  </Card>
  <Card title="QMD 引擎" href="/zh-CN/concepts/memory-qmd">
    本地优先的伴随服务。
  </Card>
  <Card title="记忆搜索" href="/zh-CN/concepts/memory-search">
    搜索管线和调优。
  </Card>
  <Card title="主动记忆" href="/zh-CN/concepts/active-memory">
    用于交互式会话的记忆子智能体。
  </Card>
</CardGroup>

除非另有说明，否则所有记忆搜索设置都位于 `openclaw.json` 中的 `agents.defaults.memorySearch` 下（或按智能体配置的 `agents.list[].memorySearch` 覆盖项中）。

<Note>
如果你要查找的是**主动记忆**功能开关和子智能体配置，它们位于 `plugins.entries.active-memory` 下，而不是 `memorySearch` 下。

主动记忆使用双重门控模型：

1. 必须启用该插件，并将当前智能体 ID 设为目标
2. 请求必须来自符合条件的交互式持久聊天会话

有关激活模型、插件所有的配置、记录持久化和安全发布模式，请参阅[主动记忆](/zh-CN/concepts/active-memory)。
</Note>

---

## 提供商选择

| 键        | 类型      | 默认值          | 说明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 启用或禁用记忆搜索                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | 嵌入适配器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已配置的 `models.providers.<id>`，其 `api` 指向记忆嵌入适配器或 OpenAI 兼容的模型 API |
| `model`    | `string`  | 提供商默认值 | 嵌入模型名称                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主适配器失败时使用的回退适配器 ID                                                                                                                                                                                                                                                  |

未设置 `provider` 时，OpenClaw 使用 OpenAI 嵌入。要使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、Voyage、本地 GGUF 模型或 OpenAI 兼容的 `/v1/embeddings` 端点，请显式设置 `provider`。
仍使用 `provider: "auto"` 的旧配置会解析为 `openai`。

<Warning>
更改嵌入提供商、模型、提供商设置、来源、范围、分块方式或分词器，可能会导致现有 SQLite 向量索引不兼容。
OpenClaw 会暂停向量搜索并报告索引标识警告，而不是自动重新嵌入所有内容。准备就绪后，请使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建索引。
</Warning>

当 `provider` 未设置、存在旧版 `provider: "auto"`，或
`provider: "none"` 有意选择仅 FTS 模式时，即使嵌入不可用，记忆召回仍可使用
FTS 词法排名。

显式指定的非本地提供商会采用失败关闭策略。如果将 `memorySearch.provider` 设置为
由远程服务支持的具体提供商，例如 Bedrock、DeepInfra、Gemini、GitHub
Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage 或 OpenAI 兼容的
自定义提供商，而该提供商在运行时不可用，则 `memory_search`
会返回不可用结果，而不是静默使用仅 FTS 召回。请修复
提供商/身份验证配置、切换到可访问的提供商；如果确实需要仅 FTS 召回，也可以设置
`provider: "none"`。

### 自定义提供商 ID

`memorySearch.provider` 可以指向用于记忆专用提供商适配器（例如 `ollama`）或 OpenAI 兼容模型 API（例如 `openai-responses` / `openai-completions`）的自定义 `models.providers.<id>` 条目。OpenClaw 会解析该提供商的 `api` 所有者以确定嵌入适配器，同时保留自定义提供商 ID，用于处理端点、身份验证和模型前缀。这样，多 GPU 或多主机设置便可将记忆嵌入专用于特定的本地端点：

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

远程嵌入需要 API 密钥。Bedrock 则使用 AWS SDK 默认凭证链（实例角色、SSO、访问密钥或 Bedrock API 密钥）。

| 提供商       | 环境变量                                             | 配置键                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 凭证链或 `AWS_BEARER_TOKEN_BEDROCK` | 无需 API 密钥                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 通过设备登录获取的身份验证配置文件       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（占位符）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 仅适用于聊天/补全，无法满足嵌入请求。
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

## 提供商专用配置

<AccordionGroup>
  <Accordion title="Gemini">
    | 键                    | 类型     | 默认值                | 说明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 还支持 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072        |

    <Warning>
    更改模型或 `outputDimensionality` 会改变索引标识。在你显式重建记忆索引之前，OpenClaw
    会暂停向量搜索。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 兼容的输入类型">
    OpenAI 兼容的嵌入端点可以选择使用提供商专用的 `input_type` 请求字段。这适用于要求查询嵌入和文档嵌入使用不同标签的非对称嵌入模型。

    | 键                 | 类型     | 默认值 | 说明                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | 未设置   | 查询嵌入和文档嵌入共用的 `input_type`   |
    | `queryInputType`    | `string` | 未设置   | 查询时的 `input_type`；覆盖 `inputType`          |
    | `documentInputType` | `string` | 未设置   | 索引/文档的 `input_type`；覆盖 `inputType`      |

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

    更改这些值会影响提供商批量索引的嵌入缓存标识；当上游模型以不同方式处理这些标签时，应随后重新索引记忆。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入配置

    Bedrock 使用 AWS SDK 默认凭证链以及经 OpenClaw 检查的持有者令牌，因此配置中不会存储 API 密钥。如果 OpenClaw 在具有 Bedrock 支持的实例角色的 EC2 上运行，只需设置提供商和模型：

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

    | 键                    | 类型     | 默认值                        | 说明                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意 Bedrock 嵌入模型 ID  |
    | `outputDimensionality` | `number` | 模型默认值                  | 对于 Titan V2：256、512 或 1024 |

    **支持的模型**（包括系列检测和维度默认值）：

    | 模型 ID                                     | 提供商     | 默认维度      | 可配置维度                 |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    带吞吐量后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）和带区域前缀的推理配置文件 ID（例如 `us.amazon.titan-embed-text-v2:0`）会继承基础模型的配置。

    **区域：**按以下顺序解析：`memorySearch.remote.baseUrl` 覆盖项、`models.providers.amazon-bedrock.baseUrl` 配置、`AWS_REGION`、`AWS_DEFAULT_REGION`，最后使用默认值 `us-east-1`。

    **身份验证：**OpenClaw 首先检查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，然后回退到标准 AWS SDK 默认凭证提供商链：

    1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非还设置了 `AWS_PROFILE`
    2. SSO（仅当已配置 SSO 字段时）
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

    为遵循最小权限原则，请将 `InvokeModel` 的范围限定到特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本地（GGUF + llama.cpp）">
    | 键                    | 类型               | 默认值                  | 描述                                                                                                                                                                                                                                                                                                                   |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自动下载                | GGUF 模型文件的路径                                                                                                                                                                                                                                                                                                    |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 默认值   | 已下载模型的缓存目录                                                                                                                                                                                                                                                                                                   |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入上下文的上下文窗口大小。4096 可覆盖常见分块（128-512 个 token），同时限制非权重 VRAM 占用。在资源受限的主机上可降低至 1024-2048。`"auto"` 使用模型训练时的最大值——不建议用于 8B+ 模型（Qwen3-Embedding-8B：最高 40 960 个 token，可能将 VRAM 占用推高至约 32 GB）。 |

    请先安装官方 llama.cpp 提供商：`openclaw plugins install @openclaw/llama-cpp-provider`。
    默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。源码检出仍需批准原生构建：先运行 `pnpm approve-builds`，再运行 `pnpm rebuild node-llama-cpp`。

    使用独立 CLI 验证 Gateway 网关所用的同一提供商路径：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    数值型 `local.contextSize` 值也会用于指导 node-llama-cpp 自动放置 GPU 层，以便同时容纳模型权重和请求的嵌入上下文。运行时加载后，`openclaw memory status --deep` 会报告最近已知的 llama.cpp 后端、设备、卸载情况、请求的上下文，以及带时间戳的内存信息；被动状态检查不会加载模型。

    为本地 GGUF 嵌入显式设置 `provider: "local"`。显式本地配置支持 `hf:` 和 HTTP(S) 模型引用（通过 node-llama-cpp 的模型解析），但它们不会更改默认提供商。

  </Accordion>
</AccordionGroup>

### 内联嵌入超时

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆盖记忆索引期间内联嵌入批次的超时时间。

未设置时使用提供商默认值：`local`、`ollama` 和 `lmstudio` 等本地/自托管提供商为 600 秒，托管提供商为 120 秒。当本地 CPU 密集型嵌入批次运行正常但速度较慢时，请增大此值。
</ParamField>

---

## 索引行为

除非另有说明，以下配置均位于 `memorySearch.sync` 下：

| 键                             | 类型      | 默认值  | 描述                                                                  |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | 会话启动时同步记忆索引                                                |
| `onSearch`                     | `boolean` | `true`  | 检测到内容变更后，在搜索时延迟同步                                    |
| `watch`                        | `boolean` | `true`  | 监视记忆文件（chokidar），并在发生变更时安排重新索引                   |
| `watchDebounceMs`              | `number`  | `1500`  | 用于合并连续文件监视事件的防抖窗口                                    |
| `intervalMinutes`              | `number`  | `0`     | 周期性重新索引的间隔分钟数（`0` 表示禁用）             |
| `sessions.postCompactionForce` | `boolean` | `true`  | 在压缩触发对话记录更新后强制重新索引会话                              |

<ParamField path="chunking.tokens" type="number">
  嵌入前拆分记忆来源时使用的分块大小，以 token 为单位（默认值：400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  相邻分块之间重叠的 token 数，用于保留拆分边界附近的上下文（默认值：80）。
</ParamField>

<Note>
更改 `chunking.tokens` 或 `chunking.overlap` 会改变分块边界，并使现有索引标识失效（请参阅“提供商选择”下的警告）。
</Note>

---

## 混合搜索配置

以下配置均位于 `memorySearch.query` 下：

| 键           | 类型     | 默认值  | 描述                                      |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | 注入前返回的最大记忆命中数                |
| `minScore`   | `number` | `0.35`  | 纳入命中结果所需的最低相关性分数          |

以下配置位于 `memorySearch.query.hybrid` 下：

| 键                    | 类型      | 默认值  | 描述                               |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | 启用 BM25 + 向量混合搜索           |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数的权重（0-1）              |
| `textWeight`          | `number`  | `0.3`   | BM25 分数的权重（0-1）             |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小倍数                     |

<Tabs>
  <Tab title="MMR（多样性）">
    | 键            | 类型      | 默认值  | 描述                                  |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序                       |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性        |
  </Tab>
  <Tab title="时间衰减（时效性）">
    | 键                           | 类型      | 默认值  | 描述                         |
    | ---------------------------- | --------- | ------- | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 启用时效性加权               |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 分数每 N 天减半              |

    长期有效的文件（`MEMORY.md`、`memory/` 中未注明日期的文件）永不衰减。

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

| 键           | 类型       | 描述                               |
| ------------ | ---------- | ---------------------------------- |
| `extraPaths` | `string[]` | 要索引的其他目录或文件             |

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

路径可以是绝对路径，也可以是相对于工作区的路径。系统会递归扫描目录中的 `.md` 文件。符号链接的处理方式取决于启用的后端：内置引擎会跳过符号链接，而 QMD 则遵循底层 QMD 扫描器的行为。

对于 Agent 范围内的跨 Agent 对话记录搜索，请使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。这些额外集合采用相同的 `{ path, name, pattern? }` 结构，但会按 Agent 合并；当路径指向当前工作区之外时，还可保留显式指定的共享名称。如果 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中出现相同的解析后路径，QMD 会保留第一项并跳过重复项。

---

## 多模态记忆（Gemini）

使用 Gemini Embedding 2，将图像和音频与 Markdown 一同建立索引：

| 键                       | 类型       | 默认值    | 说明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 索引的最大文件大小（10 MiB）    |

<Note>
仅适用于 `extraPaths` 中的文件。默认记忆根目录仍仅支持 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。
</Note>

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键                | 类型      | 默认值 | 说明                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中缓存分块嵌入             |
| `cache.maxEntries` | `number`  | 未设置   | 缓存嵌入数量的尽力而为上限 |

可防止在重新索引或更新会话记录时对未更改的文本重新生成嵌入。将 `maxEntries` 保持未设置可使用无上限缓存；当磁盘增长比重新索引的峰值速度更重要时，请设置该值。设置后，一旦缓存超过限制，将首先清理最旧的条目（按最后更新时间排序）。

---

## 批量索引

| 键                           | 类型      | 默认值 | 说明                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 并行内联嵌入 |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理作业        |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 轮询间隔              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 批处理超时              |

适用于 `gemini`、`openai` 和 `voyage`。对于大规模回填，OpenAI 批处理通常速度最快且成本最低。

`remote.nonBatchConcurrency` 控制本地/自托管提供商以及未启用提供商批处理 API 时托管提供商所使用的内联嵌入调用。对于非批量索引，Ollama 默认为 `1`，以避免让较小的本地主机不堪重负；在性能更强的机器上可设置更高的值。

这与 `sync.embeddingBatchTimeoutSeconds` 不同，后者控制内联嵌入调用的超时时间。

---

## 会话记忆搜索（实验性）

为会话记录建立索引，并通过 `memory_search` 呈现结果：

| 键                           | 类型       | 默认值      | 说明                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引                 |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含会话记录 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 触发重新索引的字节阈值              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 触发重新索引的消息数阈值           |

<Warning>
会话索引需要主动启用，并以异步方式运行。结果可能略有滞后。会话日志存储在磁盘上，因此应将文件系统访问视为信任边界。
</Warning>

会话记录命中结果也遵循
[`tools.sessions.visibility`](/zh-CN/gateway/config-tools#toolssessions)。默认的
`tree` 可见性仅公开当前会话及其派生的会话。若要从另一个
会话（例如私信）中召回由 Gateway 网关分发的同一智能体但不相关的会话，
请有意将可见性扩大到 `agent`（仅当还需要跨智能体召回且智能体间策略允许时，
才使用 `all`）。

以下示例将这些设置放在 `agents.defaults` 下。如果只有一个
智能体应索引和搜索会话记录，也可以在该智能体的覆盖配置中
应用等效的 `memorySearch` 设置。

对于从 Gateway 网关到私信的同一智能体召回：

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
`sources: ["sessions"]` 不会将会话记录导出到 QMD。还需要设置
`memory.qmd.sessions.enabled: true`。

---

## SQLite 向量加速（sqlite-vec）

| 键                          | 类型      | 默认值 | 说明                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 进行向量查询 |
| `store.vector.extensionPath` | `string`  | 内置 | 覆盖 sqlite-vec 路径          |

当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦相似度计算。

---

## 索引存储

内置记忆索引存储在每个智能体的 OpenClaw SQLite 数据库中，路径为
`agents/<agentId>/agent/openclaw-agent.sqlite`。

| 键                   | 类型     | 默认值     | 说明                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 分词器（`unicode61` 或 `trigram`） |

---

## QMD 后端配置

将 `memory.backend = "qmd"` 设置为启用。所有 QMD 设置均位于 `memory.qmd` 下：

| 键                      | 类型      | 默认值  | 说明                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径；当服务的 `PATH` 与 shell 不同时，请设置绝对路径 |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`                                          |
| `rerank`                 | `boolean` | --       | 配合 `searchMode: "query"` 和 QMD 2.1+ 设置为 `false`，以跳过 QMD 重排序          |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 将会话记录导出到 QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | 会话记录保留期限                                                                  |
| `sessions.exportDir`     | `string`  | --       | 导出目录                                                                      |

`searchMode: "search"` 仅使用词法/BM25。OpenClaw 在该模式下不会运行语义向量就绪探测或 QMD 嵌入维护，包括在 `memory status --deep` 期间；`vsearch` 和 `query` 仍需要 QMD 向量就绪和嵌入。

`rerank: false` 仅更改 QMD 的 `query` 模式，并且需要 QMD 2.1 或更高版本。在直接 CLI 模式下，OpenClaw 会传递 `--no-rerank`；在由 mcporter 支持的 MCP 模式下，它会向 QMD 的统一查询工具传递 `rerank: false`。保持未设置可使用 QMD 的默认查询重排序行为。

OpenClaw 优先使用当前的 QMD 集合和 MCP 查询形式，但在需要时会尝试兼容的集合模式标志和旧版 MCP 工具名称，以保持旧版 QMD 正常工作。当 QMD 声明支持多个集合过滤器时，同源集合会由单个 QMD 进程搜索；旧版 QMD 构建则继续使用按集合区分的兼容路径。“同源”是指持久记忆集合（默认记忆文件加自定义路径）归为一组，而会话记录集合仍作为单独一组，因此来源多样化仍具有两类输入。

<Note>
QMD 模型覆盖设置应保留在 QMD 侧，而不是 OpenClaw 配置中。如果需要全局覆盖 QMD 的模型，请在 Gateway 网关运行时环境中设置 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL` 等环境变量。
</Note>

### mcporter 集成

所有设置均位于 `memory.qmd.mcporter` 下。通过长时间运行的 `mcporter` MCP 守护进程路由 QMD 搜索，而不是每次查询都启动 `qmd`，从而减少大型模型的冷启动开销。

| 键           | 类型      | 默认值 | 说明                                                            |
| ------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`     | `boolean` | `false` | 通过 mcporter 路由 QMD 调用，而不是每个请求都启动 `qmd` |
| `serverName`  | `string`  | `qmd`   | 使用 `lifecycle: keep-alive` 运行 `qmd mcp` 的 mcporter 服务器名称  |
| `startDaemon` | `boolean` | `true`  | 当 `enabled` 为 true 时自动启动 mcporter 守护进程         |

需要安装 `mcporter` 并确保其位于 PATH 中，还需要配置一个运行 `qmd mcp` 的 mcporter 服务器。对于可以接受每次查询启动进程开销的简单本地设置，请保持禁用。

<AccordionGroup>
  <Accordion title="更新计划">
    | 键                       | 类型      | 默认值 | 说明                           |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 刷新间隔                      |
    | `update.debounceMs`       | `number`  | `15000` | 对文件更改进行防抖                 |
    | `update.onBoot`           | `boolean` | `true`  | 在长驻 QMD 管理器打开时刷新；设为 false 可跳过启动时的立即更新 |
    | `update.startup`          | `string`  | `off`   | 可选的 Gateway 网关启动时 QMD 初始化：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` 刷新运行前的延迟 |
    | `update.waitForBootSync`  | `boolean` | `false` | 阻止管理器打开，直到其初始刷新完成 |
    | `update.embedInterval`    | `string`  | `60m`   | 单独的嵌入执行周期                |
    | `update.commandTimeoutMs` | `number`  | `30000` | QMD 维护命令（集合列出/添加）的超时时间 |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 每个 `qmd update` 周期的超时时间   |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 每个 `qmd embed` 周期的超时时间    |
  </Accordion>
  <Accordion title="限制">
    | 键                       | 类型     | 默认值 | 说明                |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | 最大搜索结果数         |
    | `limits.maxSnippetChars`  | `number` | `450`   | 限制片段长度       |
    | `limits.maxInjectedChars` | `number` | `2200`  | 限制注入字符总数 |
    | `limits.timeoutMs`        | `number` | `4000`  | QMD 后端搜索期间 QMD 命令的超时时间，包括 `memory_search`；设置、同步、内置回退和补充工作仍使用默认工具截止时间 |
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

    发布的默认设置仅允许私信/直接会话，拒绝群组和其他渠道类型。`match.keyPrefix` 匹配规范化后的会话键；`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 适用于所有后端：

    | 值            | 行为                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（默认） | 在片段中包含 `Source: <path#line>` 页脚    |
    | `on`             | 始终包含页脚                               |
    | `off`            | 省略页脚（路径仍会在内部传递给智能体） |

  </Accordion>
</AccordionGroup>

启用 Gateway 网关启动时 QMD 初始化后，OpenClaw 只会为符合条件的智能体启动 QMD。如果 `update.onBoot` 为 true，且未配置间隔/嵌入维护，启动时会使用一次性管理器执行启动刷新，然后将其关闭。如果配置了更新或嵌入间隔，启动时会打开长驻 QMD 管理器，由其管理监视器和间隔计时器；`update.onBoot: false` 只跳过启动时的立即刷新。

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

Dreaming 在 `plugins.entries.memory-core.config.dreaming` 下配置，而不是在 `agents.defaults.memorySearch` 下配置。

Dreaming 作为一次定时扫描运行，并将内部的轻度/深度/REM 阶段作为实现细节。

有关概念行为和斜杠命令，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| 键                                    | 类型      | 默认值       | 说明                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全启用或禁用 Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整 Dreaming 扫描的可选 cron 执行周期                                                                                |
| `model`                                | `string`  | 默认模型 | 可选的 Dream Diary 子智能体模型覆盖                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 从每个提升到 `MEMORY.md` 的短期回忆片段中保留的最大估算 token 数；来源元数据仍然可见 |

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
- 配置的模型不可用时，Dream Diary 会使用会话默认模型重试一次。信任或允许列表失败会被记录到日志中，且不会静默重试。
- 轻度/深度/REM 阶段策略和阈值属于内部行为，并非面向用户的配置。

</Note>

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)

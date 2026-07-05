---
read_when:
    - 你想配置记忆搜索提供商或嵌入模型
    - 你想设置 QMD 后端
    - 你想调整混合搜索、MMR 或时间衰减
    - 你想启用多模态记忆索引
sidebarTitle: Memory config
summary: 记忆搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置选项
title: 记忆配置参考
x-i18n:
    generated_at: "2026-07-05T11:39:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a31a8f3a77b994ca394612f39c2134527a4c7b25baec9ab280c6e3ee7ac0b0f1
    source_path: reference/memory-config.md
    workflow: 16
---

此页面列出了 OpenClaw 记忆搜索的每个配置开关。有关概念概览，请参阅：

<CardGroup cols={2}>
  <Card title="记忆概览" href="/zh-CN/concepts/memory">
    记忆的工作方式。
  </Card>
  <Card title="内置引擎" href="/zh-CN/concepts/memory-builtin">
    默认 SQLite 后端。
  </Card>
  <Card title="QMD 引擎" href="/zh-CN/concepts/memory-qmd">
    本地优先的 sidecar。
  </Card>
  <Card title="记忆搜索" href="/zh-CN/concepts/memory-search">
    搜索管线和调优。
  </Card>
  <Card title="主动记忆" href="/zh-CN/concepts/active-memory">
    用于交互式会话的记忆子智能体。
  </Card>
</CardGroup>

除非另有说明，所有记忆搜索设置都位于 `openclaw.json` 中的 `agents.defaults.memorySearch` 下（或每个 agent 的 `agents.list[].memorySearch` 覆盖项）。

<Note>
如果你要找的是 **主动记忆** 功能开关和子智能体配置，它位于 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

主动记忆使用双门控模型：

1. 插件必须已启用并指向当前 agent id
2. 请求必须是符合条件的交互式持久聊天会话

有关激活模型、插件拥有的配置、转录持久化和安全发布模式，请参阅 [主动记忆](/zh-CN/concepts/active-memory)。
</Note>

---

## 提供商选择

| 键名        | 类型      | 默认值          | 描述                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 启用或禁用记忆搜索                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | 嵌入适配器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已配置的 `models.providers.<id>`，其 `api` 指向记忆嵌入适配器或 OpenAI 兼容模型 API |
| `model`    | `string`  | 提供商默认值 | 嵌入模型名称                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主提供商失败时使用的回退适配器 ID                                                                                                                                                                                                                                                  |

未设置 `provider` 时，OpenClaw 使用 OpenAI 嵌入。显式设置 `provider`
可使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、
Voyage、本地 GGUF 模型或 OpenAI 兼容的 `/v1/embeddings` 端点。
仍写着 `provider: "auto"` 的旧版配置会解析为 `openai`。

<Warning>
更改嵌入提供商、模型、提供商设置、来源、范围、
分块或 tokenizer 可能会使现有 SQLite 向量索引不兼容。
OpenClaw 会暂停向量搜索并报告索引身份警告，而不是
自动重新嵌入所有内容。准备好后，请使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重建。
</Warning>

当 `provider` 未设置、存在旧版 `provider: "auto"`，或
`provider: "none"` 有意选择仅 FTS 模式时，在嵌入不可用的情况下，记忆召回仍可
使用词法 FTS 排名。

显式的非本地提供商会失败关闭。如果你将 `memorySearch.provider` 设置为
具体的远程后端提供商，例如 Bedrock、DeepInfra、Gemini、GitHub
Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage，或 OpenAI 兼容的
自定义提供商，而该提供商在运行时不可用，`memory_search`
会返回不可用结果，而不是静默使用仅 FTS 召回。请修复
提供商/认证配置、切换到可访问的提供商，或在你希望有意使用仅 FTS 召回时设置
`provider: "none"`。

### 自定义提供商 ID

`memorySearch.provider` 可以指向自定义 `models.providers.<id>` 条目，用于特定记忆的提供商适配器（例如 `ollama`），或用于 OpenAI 兼容模型 API（例如 `openai-responses` / `openai-completions`）。OpenClaw 会解析该提供商的 `api` 所有者用于嵌入适配器，同时保留自定义提供商 ID 以处理端点、认证和模型前缀。这使多 GPU 或多主机设置可以将记忆嵌入专用于特定本地端点：

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

### API key 解析

远程嵌入需要 API key。Bedrock 改用 AWS SDK 默认凭证链（实例角色、SSO、访问密钥或 Bedrock API key）。

| 提供商       | 环境变量                                             | 配置键                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 凭证链，或 `AWS_BEARER_TOKEN_BEDROCK` | 不需要 API key                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 通过设备登录的认证配置       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（占位符）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 仅覆盖聊天/补全，不满足嵌入请求。
</Note>

---

## 远程端点配置

对不应继承全局 OpenAI 聊天凭证的通用 OpenAI 兼容
`/v1/embeddings` 服务器使用 `provider: "openai-compatible"`。

<ParamField path="remote.baseUrl" type="string">
  自定义 API 基础 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆盖 API key。
</ParamField>
<ParamField path="remote.headers" type="object">
  额外 HTTP 标头（与提供商默认值合并）。
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
    | 键名                    | 类型     | 默认值                | 描述                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072        |

    <Warning>
    更改模型或 `outputDimensionality` 会改变索引身份。OpenClaw
    会暂停向量搜索，直到你显式重建记忆索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 兼容输入类型">
    OpenAI 兼容嵌入端点可以选择加入提供商特定的 `input_type` 请求字段。这对于需要为查询嵌入和文档嵌入使用不同标签的非对称嵌入模型很有用。

    | 键名                 | 类型     | 默认值 | 描述                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | 未设置   | 查询和文档嵌入共享的 `input_type`   |
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

    当上游模型以不同方式处理这些标签时，更改这些值会影响提供商批量索引的嵌入缓存身份，并应随后重新索引记忆。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入配置

    Bedrock 使用 AWS SDK 默认凭证链以及 OpenClaw 检查的 bearer token，因此配置中不会存储 API key。如果 OpenClaw 在具有 Bedrock 权限实例角色的 EC2 上运行，只需设置提供商和模型：

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

    | 键名                    | 类型     | 默认值                        | 描述                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意 Bedrock 嵌入模型 ID  |
    | `outputDimensionality` | `number` | 模型默认值                  | 对于 Titan V2：256、512 或 1024 |

    **支持的模型**（带系列检测和维度默认值）：

    | 模型 ID                                    | 提供商     | 默认维度 | 可配置维度                 |
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

    **区域：**按以下顺序解析：`memorySearch.remote.baseUrl` 覆盖项、`models.providers.amazon-bedrock.baseUrl` 配置、`AWS_REGION`、`AWS_DEFAULT_REGION`，然后默认使用 `us-east-1`。

    **身份验证：**OpenClaw 会先检查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，然后回退到标准 AWS SDK 默认凭证提供商链：

    1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非同时设置了 `AWS_PROFILE`
    2. SSO（仅在已配置 SSO 字段时）
    3. 共享凭证和配置文件（`fromIni`，包含 `AWS_PROFILE`）
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

    为实现最小权限，请将 `InvokeModel` 限定到特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本地（GGUF + llama.cpp）">
    | 键                    | 类型               | 默认值                  | 描述                                                                                                                                                                                                                                                                                                                   |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自动下载                | GGUF 模型文件路径                                                                                                                                                                                                                                                                                                      |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 默认值   | 下载模型的缓存目录                                                                                                                                                                                                                                                                                                    |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入上下文的上下文窗口大小。4096 可覆盖常见分块（128-512 个 token），同时限制非权重 VRAM。受限主机可降低到 1024-2048。`"auto"` 使用模型训练时的最大值，不建议用于 8B+ 模型（Qwen3-Embedding-8B：最高 40 960 个 token 可能将 VRAM 推到约 32 GB）。 |

    先安装官方 llama.cpp 提供商：`openclaw plugins install @openclaw/llama-cpp-provider`。
    默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。源码检出仍需要原生构建批准：先运行 `pnpm approve-builds`，再运行 `pnpm rebuild node-llama-cpp`。

    使用独立 CLI 验证 Gateway 网关使用的同一提供商路径：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    为本地 GGUF 嵌入显式设置 `provider: "local"`。显式本地配置支持 `hf:` 和 HTTP(S) 模型引用（通过 node-llama-cpp 的模型解析），但它们不会更改默认提供商。

  </Accordion>
</AccordionGroup>

### 内联嵌入超时

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆盖记忆索引期间内联嵌入批次的超时时间。

未设置时使用提供商默认值：对于 `local`、`ollama` 和 `lmstudio` 等本地/自托管提供商为 600 秒，对于托管提供商为 120 秒。当本地受 CPU 限制的嵌入批次运行正常但较慢时，请增大此值。
</ParamField>

---

## 索引行为

除非另有说明，全部位于 `memorySearch.sync` 下：

| 键                             | 类型      | 默认值 | 描述                                                                 |
| ------------------------------ | --------- | ------- | -------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | 会话开始时同步记忆索引                                               |
| `onSearch`                     | `boolean` | `true`  | 检测到内容变化后，在搜索时延迟同步                                   |
| `watch`                        | `boolean` | `true`  | 监视记忆文件（chokidar）并在变化时安排重新索引                       |
| `watchDebounceMs`              | `number`  | `1500`  | 用于合并快速文件监视事件的防抖窗口                                   |
| `intervalMinutes`              | `number`  | `0`     | 定期重新索引间隔（分钟，`0` 表示禁用）                               |
| `sessions.postCompactionForce` | `boolean` | `true`  | 压缩触发的转录更新后强制重新索引会话                                 |

<ParamField path="chunking.tokens" type="number">
  在嵌入前拆分记忆源时使用的分块大小，单位为 token（默认值：400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  相邻分块之间的 token 重叠量，用于保留拆分边界附近的上下文（默认值：80）。
</ParamField>

<Note>
更改 `chunking.tokens` 或 `chunking.overlap` 会改变分块边界，并使现有索引标识失效（请参阅“提供商选择”下的警告）。
</Note>

---

## 混合搜索配置

全部位于 `memorySearch.query` 下：

| 键           | 类型     | 默认值 | 描述                         |
| ------------ | -------- | ------- | ---------------------------- |
| `maxResults` | `number` | `6`     | 注入前返回的最大记忆命中数   |
| `minScore`   | `number` | `0.35`  | 纳入命中的最低相关性分数     |

以及 `memorySearch.query.hybrid` 下：

| 键                    | 类型      | 默认值 | 描述                         |
| --------------------- | --------- | ------- | ---------------------------- |
| `enabled`             | `boolean` | `true`  | 启用混合 BM25 + 向量搜索     |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数权重（0-1）          |
| `textWeight`          | `number`  | `0.3`   | BM25 分数权重（0-1）         |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小乘数               |

<Tabs>
  <Tab title="MMR（多样性）">
    | 键            | 类型      | 默认值  | 描述                             |
    | ------------- | --------- | ------- | -------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序                  |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性   |
  </Tab>
  <Tab title="时间衰减（近因性）">
    | 键                           | 类型      | 默认值 | 描述                  |
    | ---------------------------- | --------- | ------- | --------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 启用近因性加权        |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 每 N 天分数减半       |

    常青文件（`MEMORY.md`、`memory/` 中非日期命名的文件）永不衰减。

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

| 键           | 类型       | 描述                         |
| ------------ | ---------- | ---------------------------- |
| `extraPaths` | `string[]` | 要索引的其他目录或文件       |

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

路径可以是绝对路径，也可以相对于工作区。目录会递归扫描 `.md` 文件。符号链接处理取决于当前后端：内置引擎会跳过符号链接，而 QMD 会遵循底层 QMD 扫描器行为。

对于按 Agent 作用域的跨 Agent 转录搜索，请使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。这些额外集合遵循相同的 `{ path, name, pattern? }` 形状，但它们会按 Agent 合并，并且当路径指向当前工作区之外时，可以保留显式共享名称。如果同一个解析路径同时出现在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 会保留第一个条目并跳过重复项。

---

## 多模态记忆（Gemini）

使用 Gemini Embedding 2 将图片和音频与 Markdown 一起索引：

| 键                        | 类型       | 默认值     | 描述                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引                        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 用于索引的最大文件大小（10 MiB）      |

<Note>
仅适用于 `extraPaths` 中的文件。默认记忆根目录仅支持 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。
</Note>

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（图片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键                 | 类型      | 默认值 | 描述                                         |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中缓存分块嵌入                    |
| `cache.maxEntries` | `number`  | 未设置  | 缓存嵌入数量的尽力上限                     |

在重新索引或转录更新期间，避免对未更改的文本重新生成嵌入。保持 `maxEntries` 未设置可使用无界缓存；当磁盘增长比峰值重新索引速度更重要时再设置它。设置后，一旦缓存超过限制，最旧的条目（按最后更新时间）会最先被清理。

---

## 批量索引

| 键                            | 类型      | 默认值 | 描述                 |
| ----------------------------- | --------- | ------- | -------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 并行内联嵌入         |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API     |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批量作业         |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批量完成         |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 轮询间隔             |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 批量超时             |

适用于 `gemini`、`openai` 和 `voyage`。对于大型回填，OpenAI 批量通常最快且成本最低。

`remote.nonBatchConcurrency` 控制本地/自托管提供商使用的内联嵌入调用，以及托管提供商在提供商批量 API 未启用时使用的内联嵌入调用。Ollama 的非批量索引默认值为 `1`，以避免让较小的本地主机不堪重负；在更大的机器上可设置更高的值。

这与 `sync.embeddingBatchTimeoutSeconds` 分开，后者控制内联嵌入调用的超时时间。

---

## 会话记忆搜索（实验性）

索引会话转录，并通过 `memory_search` 暴露它们：

| 键                            | 类型       | 默认值       | 描述                         |
| ----------------------------- | ---------- | ------------ | ---------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引                 |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含转录 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 重新索引的字节阈值           |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 重新索引的消息阈值           |

<Warning>
会话索引是选择启用的，并且会异步运行。结果可能略有陈旧。会话日志位于磁盘上，因此请将文件系统访问视为信任边界。
</Warning>

会话转录命中也遵守
[`tools.sessions.visibility`](/zh-CN/gateway/config-tools#toolssessions)。默认的
`tree` 可见性只暴露当前会话及其派生的会话。若要从不同会话（例如私信）中召回一个无关的、同一智能体的、由 Gateway 网关分发的会话，请有意将可见性扩大到 `agent`（只有在也需要跨智能体召回且智能体到智能体策略允许时，才使用 `all`）。

下面的示例将这些设置放在 `agents.defaults` 下。你也可以在按智能体覆盖中应用等效的 `memorySearch` 设置，用于仅让一个智能体索引和搜索会话转录。

对于同一智能体的 Gateway 网关到私信召回：

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

使用 QMD 时，`agents.defaults.memorySearch.experimental.sessionMemory` 和
`sources: ["sessions"]` 本身不会把转录导出到 QMD。还需要设置
`memory.qmd.sessions.enabled: true`。

---

## SQLite 向量加速（sqlite-vec）

| 键                           | 类型      | 默认值 | 描述                         |
| ---------------------------- | --------- | ------- | ---------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 进行向量查询 |
| `store.vector.extensionPath` | `string`  | 内置    | 覆盖 sqlite-vec 路径         |

  当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦相似度。

  ---

  ## 索引存储

  内置记忆索引位于每个智能体的 OpenClaw SQLite 数据库：
  `agents/<agentId>/agent/openclaw-agent.sqlite`。

  | 键                    | 类型     | 默认值      | 描述                                      |
  | --------------------- | -------- | ----------- | ----------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 分词器（`unicode61` 或 `trigram`） |

  ---

  ## QMD 后端配置

  设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置都位于 `memory.qmd` 下：

  | 键                       | 类型      | 默认值   | 描述                                                                                   |
  | ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | QMD 可执行文件路径；当服务 `PATH` 与你的 shell 不同时，请设置绝对路径                  |
  | `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`                                                  |
  | `rerank`                 | `boolean` | --       | 与 `searchMode: "query"` 和 QMD 2.1+ 一起设置为 `false`，以跳过 QMD 重排序             |
  | `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`                                                 |
  | `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`                                                    |
  | `sessions.enabled`       | `boolean` | `false`  | 将会话转录导出到 QMD                                                                   |
  | `sessions.retentionDays` | `number`  | --       | 转录保留期                                                                             |
  | `sessions.exportDir`     | `string`  | --       | 导出目录                                                                               |

  `searchMode: "search"` 仅使用词法/BM25。OpenClaw 不会为该模式运行语义向量就绪探测或 QMD 嵌入维护，包括在 `memory status --deep` 期间；`vsearch` 和 `query` 仍然需要 QMD 向量就绪状态和嵌入。

  `rerank: false` 只会更改 QMD `query` 模式，并且需要 QMD 2.1 或更新版本。在直接 CLI 模式下，OpenClaw 会传递 `--no-rerank`；在由 mcporter 支持的 MCP 模式下，它会向 QMD 的统一查询工具传递 `rerank: false`。保持未设置即可使用 QMD 默认的查询重排序行为。

  OpenClaw 优先使用当前的 QMD 集合和 MCP 查询形状，但会在需要时尝试兼容的集合模式标志和旧版 MCP 工具名称，从而保持旧版 QMD 发布可用。当 QMD 声明支持多个集合过滤器时，同源集合会用一个 QMD 进程搜索；旧版 QMD 构建会保留按集合划分的兼容路径。同源表示持久记忆集合（默认记忆文件加自定义路径）会归为一组，而会话转录集合会保留为单独一组，因此来源多样化仍然同时拥有两类输入。

  <Note>
  QMD 模型覆盖保留在 QMD 侧，而不是 OpenClaw 配置中。如果你需要全局覆盖 QMD 的模型，请在 Gateway 网关运行时环境中设置环境变量，例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
  </Note>

  ### mcporter 集成

  全部位于 `memory.qmd.mcporter` 下。通过长驻 `mcporter` MCP 守护进程路由 QMD 搜索，而不是每次查询都生成 `qmd`，从而降低较大模型的冷启动开销。

  | 键            | 类型      | 默认值  | 描述                                                                 |
  | ------------- | --------- | ------- | -------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false` | 通过 mcporter 路由 QMD 调用，而不是每次请求都生成 `qmd`              |
  | `serverName`  | `string`  | `qmd`   | 运行带有 `lifecycle: keep-alive` 的 `qmd mcp` 的 mcporter 服务器名称 |
  | `startDaemon` | `boolean` | `true`  | 当 `enabled` 为 true 时自动启动 mcporter 守护进程                    |

  需要安装 `mcporter` 并位于 PATH 上，还需要配置一个运行 `qmd mcp` 的 mcporter 服务器。对于每次查询生成进程的成本可接受的更简单本地设置，请保持禁用。

  <AccordionGroup>
  <Accordion title="更新时间表">
    | 键                        | 类型      | 默认值   | 描述                                                                 |
    | --------------------------- | --------- | -------- | ---------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | 刷新间隔                                                           |
    | `update.debounceMs`       | `number`  | `15000`  | 对文件变更防抖                                                     |
    | `update.onBoot`           | `boolean` | `true`   | 长驻 QMD 管理器启动时刷新；设置为 false 可跳过立即启动更新        |
    | `update.startup`          | `string`  | `off`    | 可选的 Gateway 网关启动 QMD 初始化：`off`、`idle` 或 `immediate`   |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` 刷新运行前的延迟                                 |
    | `update.waitForBootSync`  | `boolean` | `false`  | 阻塞管理器启动，直到其初始刷新完成                                 |
    | `update.embedInterval`    | `string`  | `60m`    | 单独的嵌入节奏                                                     |
    | `update.commandTimeoutMs` | `number`  | `30000`  | QMD 维护命令（集合 list/add）的超时                                |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 每个 `qmd update` 周期的超时                                       |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 每个 `qmd embed` 周期的超时                                        |
  </Accordion>
  <Accordion title="限制">
    | 键                        | 类型     | 默认值 | 描述                 |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | 最大搜索结果      |
    | `limits.maxSnippetChars`  | `number` | `450`   | 限制片段长度      |
    | `limits.maxInjectedChars` | `number` | `2200`  | 限制注入字符总数  |
    | `limits.timeoutMs`        | `number` | `4000`  | 搜索超时          |
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

    随附的默认值是仅限私信/direct，拒绝群组和其他渠道类型。`match.keyPrefix` 匹配规范化后的会话键；`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 适用于所有后端：

    | 值            | 行为                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（默认） | 在代码片段中包含 `Source: <path#line>` 页脚    |
    | `on`             | 始终包含页脚                               |
    | `off`            | 省略页脚（路径仍会在内部传递给智能体） |

  </Accordion>
</AccordionGroup>

启用 gateway-start QMD 初始化时，OpenClaw 只会为符合条件的智能体启动 QMD。如果 `update.onBoot` 为 true，且未配置间隔/embed 维护，启动时会使用一次性管理器执行启动刷新，然后关闭它。如果配置了更新或 embed 间隔，启动时会打开长期运行的 QMD 管理器，使其拥有 watcher 和间隔计时器；`update.onBoot: false` 只会跳过立即启动刷新。

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

Dreaming 配置在 `plugins.entries.memory-core.config.dreaming` 下，而不是 `agents.defaults.memorySearch` 下。

Dreaming 作为一次定时扫描运行，并将内部的 light/deep/REM 阶段作为实现细节。

有关概念行为和斜杠命令，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| 键                                    | 类型      | 默认值       | 描述                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完全启用或禁用 Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整 Dreaming 扫描的可选 cron 频率                                                                                |
| `model`                                | `string`  | 默认模型 | 可选的梦日记子智能体模型覆盖                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 从每个提升到 `MEMORY.md` 的短期召回代码片段中保留的最大估算 token 数；来源元数据仍保持可见 |

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
- 当配置的模型不可用时，梦日记会使用会话默认模型重试一次。信任或允许列表失败会被记录到日志，且不会静默重试。
- light/deep/REM 阶段策略和阈值是内部行为，不是面向用户的配置。

</Note>

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [记忆概览](/zh-CN/concepts/memory)
- [记忆搜索](/zh-CN/concepts/memory-search)

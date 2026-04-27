---
read_when:
    - 你想要配置 Memory 搜索提供商或嵌入模型
    - 你想要设置 QMD 后端
    - 你想要调整混合搜索、MMR 或时间衰减参数
    - 你想要启用多模态 Memory 索引
sidebarTitle: Memory config
summary: Memory 搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置选项
title: Memory 配置参考
x-i18n:
    generated_at: "2026-04-27T13:13:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: e063a62b44b7d4fa2df017301cf675678ab71a65f53c78af85f0aa925bb79277
    source_path: reference/memory-config.md
    workflow: 15
---

此页面列出了 OpenClaw Memory 搜索的每一个配置选项。概念性概览请参见：

<CardGroup cols={2}>
  <Card title="Memory 概览" href="/zh-CN/concepts/memory">
    Memory 的工作方式。
  </Card>
  <Card title="内置引擎" href="/zh-CN/concepts/memory-builtin">
    默认的 SQLite 后端。
  </Card>
  <Card title="QMD 引擎" href="/zh-CN/concepts/memory-qmd">
    本地优先的 sidecar。
  </Card>
  <Card title="Memory 搜索" href="/zh-CN/concepts/memory-search">
    搜索管线与调优。
  </Card>
  <Card title="活跃 Memory" href="/zh-CN/concepts/active-memory">
    用于交互式会话的 Memory 子智能体。
  </Card>
</CardGroup>

除非另有说明，所有 Memory 搜索设置都位于 `openclaw.json` 的 `agents.defaults.memorySearch` 下。

<Note>
如果你要查找的是 **活跃 Memory** 的功能开关和子智能体配置，它位于 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

活跃 Memory 使用双门控模型：

1. 必须启用该插件，并且其目标为当前智能体 id
2. 该请求必须是符合条件的交互式持久聊天会话

有关激活模型、插件自有配置、对话记录持久化和安全上线模式，请参见 [Active Memory](/zh-CN/concepts/active-memory)。
</Note>

---

## 提供商选择

| 键         | 类型      | 默认值         | 描述                                                                                                        |
| ---------- | --------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自动检测       | 嵌入适配器 ID：`bedrock`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`voyage` |
| `model`    | `string`  | 提供商默认值   | 嵌入模型名称                                                                                                |
| `fallback` | `string`  | `"none"`       | 当主提供商失败时使用的回退适配器 ID                                                                         |
| `enabled`  | `boolean` | `true`         | 启用或禁用 Memory 搜索                                                                                      |

### 自动检测顺序

当未设置 `provider` 时，OpenClaw 会选择第一个可用项：

<Steps>
  <Step title="local">
    如果已配置 `memorySearch.local.modelPath` 且该文件存在，则会选中。
  </Step>
  <Step title="github-copilot">
    如果可以解析到 GitHub Copilot token（环境变量或认证配置文件），则会选中。
  </Step>
  <Step title="openai">
    如果可以解析到 OpenAI 密钥，则会选中。
  </Step>
  <Step title="gemini">
    如果可以解析到 Gemini 密钥，则会选中。
  </Step>
  <Step title="voyage">
    如果可以解析到 Voyage 密钥，则会选中。
  </Step>
  <Step title="mistral">
    如果可以解析到 Mistral 密钥，则会选中。
  </Step>
  <Step title="bedrock">
    如果 AWS SDK 凭证链可解析（实例角色、访问密钥、profile、SSO、web identity 或共享配置），则会选中。
  </Step>
</Steps>

支持 `ollama`，但不会自动检测（请显式设置）。

### API 密钥解析

远程嵌入需要 API 密钥。Bedrock 则改用 AWS SDK 默认凭证链（实例角色、SSO、访问密钥）。

| 提供商         | 环境变量                                           | 配置键                            |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS 凭证链                                         | 不需要 API 密钥                   |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | 通过设备登录的认证配置文件        |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY`（占位符）                         | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth 仅覆盖 chat/completions，不满足嵌入请求的要求。
</Note>

---

## 远程端点配置

用于自定义兼容 OpenAI 的端点，或覆盖提供商默认值：

<ParamField path="remote.baseUrl" type="string">
  自定义 API 基础 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆盖 API 密钥。
</ParamField>
<ParamField path="remote.headers" type="object">
  额外的 HTTP 标头（会与提供商默认值合并）。
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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
    | 键                     | 类型     | 默认值                 | 描述                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview`        |
    | `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072        |

    <Warning>
    更改模型或 `outputDimensionality` 会触发自动全量重新索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible 输入类型">
    兼容 OpenAI 的嵌入端点可以选择启用提供商特定的 `input_type` 请求字段。这对于需要为查询嵌入和文档嵌入使用不同标签的非对称嵌入模型非常有用。

    | 键                  | 类型     | 默认值 | 描述                                              |
    | ------------------- | -------- | ------ | ------------------------------------------------- |
    | `inputType`         | `string` | 未设置 | 查询嵌入和文档嵌入共用的 `input_type`             |
    | `queryInputType`    | `string` | 未设置 | 查询时的 `input_type`；覆盖 `inputType`           |
    | `documentInputType` | `string` | 未设置 | 索引/文档的 `input_type`；覆盖 `inputType`        |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    更改这些值会影响提供商批量索引的嵌入缓存标识；如果上游模型对这些标签区别对待，则应随后执行一次 Memory 重新索引。

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock 使用 AWS SDK 默认凭证链——不需要 API 密钥。如果 OpenClaw 在带有 Bedrock 权限实例角色的 EC2 上运行，只需设置提供商和模型：

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

    | 键                     | 类型     | 默认值                         | 描述                          |
    | ---------------------- | -------- | ------------------------------ | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意 Bedrock 嵌入模型 ID      |
    | `outputDimensionality` | `number` | 模型默认值                     | 对于 Titan V2：256、512 或 1024 |

    **支持的模型**（包含家族检测和默认维度）：

    | 模型 ID                                    | 提供商     | 默认维度 | 可配置维度          |
    | ------------------------------------------ | ---------- | -------- | ------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024     | 256、512、1024      |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536     | --                  |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536     | --                  |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024     | --                  |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024     | 256、384、1024、3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024     | --                  |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024     | --                  |
    | `cohere.embed-v4:0`                        | Cohere     | 1536     | 256-1536            |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512      | --                  |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024     | --                  |

    带吞吐量后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）会继承基础模型的配置。

    **认证：** Bedrock 认证使用标准 AWS SDK 凭证解析顺序：

    1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO token 缓存
    3. Web identity token 凭证
    4. 共享凭证和配置文件
    5. ECS 或 EC2 元数据凭证

    区域会从 `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` 提供商的 `baseUrl` 中解析，或默认使用 `us-east-1`。

    **IAM 权限：** IAM 角色或用户需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    为了实现最小权限原则，请将 `InvokeModel` 限定到特定模型：

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local（GGUF + node-llama-cpp）">
    | 键                    | 类型               | 默认值                 | 描述                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自动下载               | GGUF 模型文件的路径                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 默认值  | 已下载模型的缓存目录                                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入上下文的上下文窗口大小。4096 可覆盖典型分块（128–512 token），同时限制非权重 VRAM 占用。在受限主机上可降到 1024–2048。`"auto"` 使用模型训练时的最大值——不建议用于 8B+ 模型（Qwen3-Embedding-8B：40 960 token → 约 32 GB VRAM，而在 4096 时约为 8.8 GB）。 |

    默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。需要原生构建：`pnpm approve-builds`，然后执行 `pnpm rebuild node-llama-cpp`。

    使用独立 CLI 验证 Gateway 网关所使用的相同提供商路径：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    如果 `provider` 为 `auto`，只有当 `local.modelPath` 指向现有本地文件时，才会选择 `local`。`hf:` 和 HTTP(S) 模型引用仍可在显式设置 `provider: "local"` 时使用，但在模型尚未落盘前，它们不会让 `auto` 优先选择 local。

  </Accordion>
</AccordionGroup>

### 内联嵌入超时

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆盖 Memory 索引期间内联嵌入批次的超时时间。

未设置时使用提供商默认值：对于 `local`、`ollama` 和 `lmstudio` 等本地/自托管提供商为 600 秒，对于托管提供商为 120 秒。当本地 CPU 密集型嵌入批次运行正常但较慢时，可增大此值。
</ParamField>

---

## 混合搜索配置

全部位于 `memorySearch.query.hybrid` 下：

| 键                    | 类型      | 默认值 | 描述                         |
| --------------------- | --------- | ------ | ---------------------------- |
| `enabled`             | `boolean` | `true` | 启用混合 BM25 + 向量搜索     |
| `vectorWeight`        | `number`  | `0.7`  | 向量分数的权重（0-1）        |
| `textWeight`          | `number`  | `0.3`  | BM25 分数的权重（0-1）       |
| `candidateMultiplier` | `number`  | `4`    | 候选池大小乘数               |

<Tabs>
  <Tab title="MMR（多样性）">
    | 键            | 类型      | 默认值  | 描述                               |
    | ------------- | --------- | ------- | ---------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序                    |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性     |
  </Tab>
  <Tab title="时间衰减（新近性）">
    | 键                           | 类型      | 默认值  | 描述                    |
    | ---------------------------- | --------- | ------- | ----------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 启用新近性加权          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 分数每 N 天减半         |

    常青文件（`MEMORY.md`、`memory/` 中不带日期的文件）永远不会衰减。

  </Tab>
</Tabs>

### 完整示例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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

## 额外 Memory 路径

| 键           | 类型       | 描述                           |
| ------------ | ---------- | ------------------------------ |
| `extraPaths` | `string[]` | 要建立索引的额外目录或文件     |

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

路径可以是绝对路径，也可以是相对于工作区的路径。目录会递归扫描 `.md` 文件。符号链接的处理方式取决于当前后端：内置引擎会忽略符号链接，而 QMD 会遵循底层 QMD 扫描器的行为。

对于按智能体范围进行的跨智能体对话记录搜索，请使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。这些额外集合遵循相同的 `{ path, name, pattern? }` 结构，但会按智能体合并，并且当路径指向当前工作区之外时，可以保留显式共享名称。如果同一个解析后路径同时出现在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 会保留第一项并跳过重复项。

---

## 多模态 Memory（Gemini）

使用 Gemini Embedding 2，为图片和音频与 Markdown 一起建立索引：

| 键                        | 类型       | 默认值     | 描述                                 |
| ------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引                       |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 建立索引的最大文件大小               |

<Note>
仅适用于 `extraPaths` 中的文件。默认 Memory 根目录仍然只支持 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。
</Note>

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（图片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键                 | 类型      | 默认值  | 描述                            |
| ------------------ | --------- | ------- | ------------------------------- |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中缓存分块嵌入        |
| `cache.maxEntries` | `number`  | `50000` | 最大缓存嵌入数量                |

可防止在重新索引或更新对话记录时，对未更改的文本重复生成嵌入。

---

## 批量索引

| 键                            | 类型      | 默认值  | 描述                 |
| ----------------------------- | --------- | ------- | -------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API     |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理任务数     |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成       |
| `remote.batch.pollIntervalMs` | `number`  | --      | 轮询间隔             |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批处理超时时间       |

适用于 `openai`、`gemini` 和 `voyage`。对于大规模回填，OpenAI 批处理通常最快且成本最低。

这与 `sync.embeddingBatchTimeoutSeconds` 是分开的；后者用于控制内联嵌入调用，适用于本地/自托管提供商，以及在未启用提供商批量 API 时的托管提供商。

---

## 会话 Memory 搜索（实验性）

为会话对话记录建立索引，并通过 `memory_search` 提供结果：

| 键                            | 类型       | 默认值       | 描述                                  |
| ----------------------------- | ---------- | ------------ | ------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引                          |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含对话记录      |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 触发重新索引的字节阈值                |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 触发重新索引的消息阈值                |

<Warning>
会话索引需要显式启用，并且以异步方式运行。结果可能会有轻微滞后。会话日志存储在磁盘上，因此应将文件系统访问视为信任边界。
</Warning>

---

## SQLite 向量加速（sqlite-vec）

| 键                           | 类型      | 默认值  | 描述                              |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 对向量查询使用 sqlite-vec         |
| `store.vector.extensionPath` | `string`  | 内置    | 覆盖 sqlite-vec 路径              |

当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦相似度计算。

---

## 索引存储

| 键                    | 类型     | 默认值                                | 描述                                     |
| --------------------- | -------- | ------------------------------------- | ---------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支持 `{agentId}` token）       |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 分词器（`unicode61` 或 `trigram`）  |

---

## QMD 后端配置

设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置都位于 `memory.qmd` 下：

| 键                       | 类型      | 默认值   | 描述                                         |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径                           |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`       |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`      |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`         |
| `sessions.enabled`       | `boolean` | `false`  | 为会话对话记录建立索引                       |
| `sessions.retentionDays` | `number`  | --       | 对话记录保留期                               |
| `sessions.exportDir`     | `string`  | --       | 导出目录                                     |

`searchMode: "search"` 仅支持词法/BM25 搜索。OpenClaw 不会为该模式运行语义向量就绪性探测或 QMD 嵌入维护，包括在 `memory status --deep` 期间；`vsearch` 和 `query` 则仍然需要 QMD 向量就绪性和嵌入。

OpenClaw 优先使用当前的 QMD collection 和 MCP 查询结构，但也会通过回退到旧版 `--mask` collection 标志和旧版 MCP 工具名称来保持与较早 QMD 版本的兼容。

<Note>
QMD 模型覆盖保留在 QMD 侧，而不是 OpenClaw 配置中。如果你需要全局覆盖 QMD 的模型，请在 Gateway 网关运行时环境中设置环境变量，例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
</Note>

<AccordionGroup>
  <Accordion title="更新计划">
    | 键                        | 类型      | 默认值  | 描述                           |
    | ------------------------- | --------- | ------- | ------------------------------ |
    | `update.interval`         | `string`  | `5m`    | 刷新间隔                       |
    | `update.debounceMs`       | `number`  | `15000` | 文件变更去抖动                 |
    | `update.onBoot`           | `boolean` | `true`  | 启动时刷新                     |
    | `update.waitForBootSync`  | `boolean` | `false` | 在刷新完成前阻塞启动           |
    | `update.embedInterval`    | `string`  | --      | 单独的嵌入执行周期             |
    | `update.commandTimeoutMs` | `number`  | --      | QMD 命令的超时时间             |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作的超时时间         |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD 嵌入操作的超时时间         |
  </Accordion>
  <Accordion title="限制">
    | 键                        | 类型     | 默认值  | 描述                     |
    | ------------------------- | -------- | ------- | ------------------------ |
    | `limits.maxResults`       | `number` | `6`     | 最大搜索结果数           |
    | `limits.maxSnippetChars`  | `number` | --      | 限制摘要长度             |
    | `limits.maxInjectedChars` | `number` | --      | 限制注入的总字符数       |
    | `limits.timeoutMs`        | `number` | `4000`  | 搜索超时时间             |
  </Accordion>
  <Accordion title="范围">
    控制哪些会话可以接收 QMD 搜索结果。使用与 [`session.sendPolicy`](/zh-CN/gateway/config-agents#session) 相同的模式：

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

    已发布的默认配置允许 direct 和 channel 会话，同时仍然拒绝群组。

    默认仅限私信。`match.keyPrefix` 匹配标准化后的会话键；`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 适用于所有后端：

    | 值               | 行为                                               |
    | ---------------- | -------------------------------------------------- |
    | `auto`（默认）   | 在摘要中包含 `Source: <path#line>` 页脚            |
    | `on`             | 始终包含页脚                                       |
    | `off`            | 省略页脚（路径仍会在内部传递给智能体）             |

  </Accordion>
</AccordionGroup>

### 完整 QMD 示例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming 的配置位于 `plugins.entries.memory-core.config.dreaming` 下，而不是 `agents.defaults.memorySearch` 下。

Dreaming 作为一次计划中的完整扫描运行，并将内部的 light/deep/REM 阶段作为实现细节使用。

有关概念性行为和斜杠命令，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| 键          | 类型      | 默认值      | 描述                                     |
| ----------- | --------- | ----------- | ---------------------------------------- |
| `enabled`   | `boolean` | `false`     | 完全启用或禁用 Dreaming                  |
| `frequency` | `string`  | `0 3 * * *` | 可选的完整 Dreaming 扫描 cron 周期       |
| `model`     | `string`  | 默认模型    | 可选的 Dream Diary 子智能体模型覆盖      |

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
- Dreaming 会将机器状态写入 `memory/.dreams/`。
- Dreaming 会将人类可读的叙事输出写入 `DREAMS.md`（或现有的 `dreams.md`）。
- `dreaming.model` 使用现有的插件子智能体信任门控；启用它之前，请先设置 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- light/deep/REM 阶段策略和阈值属于内部行为，不是面向用户的配置。
</Note>

## 相关内容

- [配置参考](/zh-CN/gateway/configuration-reference)
- [Memory 概览](/zh-CN/concepts/memory)
- [Memory 搜索](/zh-CN/concepts/memory-search)

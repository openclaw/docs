---
read_when:
    - 你想要配置内存搜索提供商或嵌入模型
    - 你想要设置 QMD 后端
    - 你想要调整混合搜索、MMR 或时间衰减
    - 你想要启用多模态内存索引
summary: 内存搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置项
title: 内存配置参考
x-i18n:
    generated_at: "2026-04-23T21:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8f91c15c149feb1a351585d246f3155ce56164cbda3e773dd63ebfa6c1b63b7
    source_path: reference/memory-config.md
    workflow: 15
---

此页面列出了 OpenClaw 内存搜索的所有配置项。有关概念概览，请参阅：

- [Memory Overview](/zh-CN/concepts/memory) —— 内存的工作方式
- [Builtin Engine](/zh-CN/concepts/memory-builtin) —— 默认的 SQLite 后端
- [QMD Engine](/zh-CN/concepts/memory-qmd) —— 本地优先的 sidecar
- [Memory Search](/zh-CN/concepts/memory-search) —— 搜索流水线与调优
- [Active Memory](/zh-CN/concepts/active-memory) —— 为交互式会话启用 memory 子智能体

除非另有说明，所有内存搜索设置都位于 `openclaw.json` 中的 `agents.defaults.memorySearch` 下。

如果你要查找 **active memory** 功能开关和子智能体配置，这些内容位于 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

Active memory 使用双门控模型：

1. 必须启用该插件，并将其目标指向当前智能体 ID
2. 请求必须是符合条件的交互式持久聊天会话

有关激活模型、插件自有配置、转录持久化以及安全发布模式，请参阅 [Active Memory](/zh-CN/concepts/active-memory)。

---

## 提供商选择

| Key        | Type      | Default          | Description                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自动检测         | 嵌入适配器 ID：`bedrock`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`voyage` |
| `model`    | `string`  | 提供商默认值     | 嵌入模型名称                                                                                                  |
| `fallback` | `string`  | `"none"`         | 当主提供商失败时使用的回退适配器 ID                                                                           |
| `enabled`  | `boolean` | `true`           | 启用或禁用内存搜索                                                                                            |

### 自动检测顺序

当未设置 `provider` 时，OpenClaw 会选择第一个可用项：

1. `local` —— 如果已配置 `memorySearch.local.modelPath` 且文件存在。
2. `github-copilot` —— 如果可以解析到 GitHub Copilot 令牌（环境变量或认证配置文件）。
3. `openai` —— 如果可以解析到 OpenAI 密钥。
4. `gemini` —— 如果可以解析到 Gemini 密钥。
5. `voyage` —— 如果可以解析到 Voyage 密钥。
6. `mistral` —— 如果可以解析到 Mistral 密钥。
7. `bedrock` —— 如果 AWS SDK 凭证链可解析（实例角色、访问密钥、profile、SSO、web identity 或共享配置）。

支持 `ollama`，但不会自动检测（请显式设置）。

### API 密钥解析

远程嵌入需要 API 密钥。Bedrock 则使用 AWS SDK 默认凭证链（实例角色、SSO、访问密钥）。

| Provider       | Env var                                            | Config key                        |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS 凭证链                                         | 不需要 API 密钥                   |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | 通过设备登录的认证配置文件        |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY`（占位符）                         | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

Codex OAuth 仅适用于聊天/补全，不满足嵌入请求的要求。

---

## 远程端点配置

用于自定义 OpenAI 兼容端点或覆盖提供商默认值：

| Key              | Type     | Description                             |
| ---------------- | -------- | --------------------------------------- |
| `remote.baseUrl` | `string` | 自定义 API 基础 URL                     |
| `remote.apiKey`  | `string` | 覆盖 API 密钥                           |
| `remote.headers` | `object` | 额外的 HTTP 请求头（与提供商默认值合并） |

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

## Gemini 专属配置

| Key                    | Type     | Default                | Description                               |
| ---------------------- | -------- | ---------------------- | ----------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview`       |
| `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2，可选 768、1536 或 3072 |

<Warning>
更改模型或 `outputDimensionality` 会触发自动全量重新索引。
</Warning>

---

## Bedrock 嵌入配置

Bedrock 使用 AWS SDK 默认凭证链 —— 不需要 API 密钥。
如果 OpenClaw 运行在启用了 Bedrock 实例角色的 EC2 上，只需设置 provider 和 model：

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

| Key                    | Type     | Default                        | Description                    |
| ---------------------- | -------- | ------------------------------ | ------------------------------ |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意 Bedrock 嵌入模型 ID       |
| `outputDimensionality` | `number` | 模型默认值                     | 对于 Titan V2，可选 256、512 或 1024 |

### 支持的模型

以下模型受支持（包含系列检测和默认维度）：

| Model ID                                   | Provider   | Default Dims | Configurable Dims    |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

带吞吐量后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）会继承基础模型的配置。

### 认证

Bedrock 认证使用标准 AWS SDK 凭证解析顺序：

1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
2. SSO 令牌缓存
3. Web identity 令牌凭证
4. 共享凭证和配置文件
5. ECS 或 EC2 元数据凭证

区域将从 `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` 提供商的 `baseUrl` 中解析，或默认使用 `us-east-1`。

### IAM 权限

IAM 角色或用户需要具备：

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

为了实现最小权限，应将 `InvokeModel` 限定到特定模型：

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## 本地嵌入配置

| Key                   | Type               | Default                | Description                                                                                                                                                                                                                                                                                     |
| --------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | 自动下载               | GGUF 模型文件路径                                                                                                                                                                                                                                                                               |
| `local.modelCacheDir` | `string`           | node-llama-cpp 默认值  | 已下载模型的缓存目录                                                                                                                                                                                                                                                                            |
| `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入上下文的上下文窗口大小。4096 可覆盖典型分块（128–512 个 token），同时限制非权重 VRAM 占用。在受限主机上可降至 1024–2048。`"auto"` 使用模型训练时的最大值——不建议用于 8B+ 模型（Qwen3-Embedding-8B：40 960 个 token → 约 32 GB VRAM，而在 4096 时约为 8.8 GB）。 |

默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。
需要原生构建：`pnpm approve-builds`，然后执行 `pnpm rebuild node-llama-cpp`。

---

## 混合搜索配置

全部位于 `memorySearch.query.hybrid` 下：

| Key                   | Type      | Default | Description                    |
| --------------------- | --------- | ------- | ------------------------------ |
| `enabled`             | `boolean` | `true`  | 启用混合 BM25 + 向量搜索       |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数权重（0-1）            |
| `textWeight`          | `number`  | `0.3`   | BM25 分数权重（0-1）           |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小乘数                 |

### MMR（多样性）

| Key           | Type      | Default | Description                        |
| ------------- | --------- | ------- | ---------------------------------- |
| `mmr.enabled` | `boolean` | `false` | 启用 MMR 重新排序                  |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性     |

### 时间衰减（新近性）

| Key                          | Type      | Default | Description          |
| ---------------------------- | --------- | ------- | -------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | 启用新近性加权       |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | 每 N 天分数减半      |

常青文件（`MEMORY.md`、`memory/` 中无日期的文件）永远不会衰减。

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

## 其他内存路径

| Key          | Type       | Description                    |
| ------------ | ---------- | ------------------------------ |
| `extraPaths` | `string[]` | 要建立索引的其他目录或文件     |

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

路径可以是绝对路径，也可以是相对于工作区的路径。目录会递归扫描 `.md` 文件。符号链接的处理取决于当前启用的后端：内置引擎会忽略符号链接，而 QMD 则遵循底层 QMD 扫描器的行为。

对于按智能体作用域划分的跨智能体转录搜索，请使用 `agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。这些额外集合使用相同的 `{ path, name, pattern? }` 结构，但会按智能体合并，并且当路径指向当前工作区之外时，可以保留显式共享名称。
如果同一个解析后的路径同时出现在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 会保留第一项并跳过重复项。

---

## 多模态内存（Gemini）

使用 Gemini Embedding 2 将图像和音频与 Markdown 一起建立索引：

| Key                       | Type       | Default    | Description                         |
| ------------------------- | ---------- | ---------- | ----------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引                      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 建立索引时允许的最大文件大小        |

仅适用于 `extraPaths` 中的文件。默认内存根目录仍然只支持 Markdown。
需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`
（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| Key                | Type      | Default | Description                     |
| ------------------ | --------- | ------- | ------------------------------- |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中缓存分块嵌入        |
| `cache.maxEntries` | `number`  | `50000` | 最大缓存嵌入数量                |

可防止在重新索引或更新转录时，对未更改的文本重复生成嵌入。

---

## 批量索引

| Key                           | Type      | Default | Description              |
| ----------------------------- | --------- | ------- | ------------------------ |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API         |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理任务数         |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成           |
| `remote.batch.pollIntervalMs` | `number`  | --      | 轮询间隔                 |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批处理超时时间           |

适用于 `openai`、`gemini` 和 `voyage`。对于大规模回填，OpenAI 批处理通常最快且成本最低。

---

## 会话内存搜索（实验性）

为会话转录建立索引，并通过 `memory_search` 暴露：

| Key                           | Type       | Default      | Description                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引                            |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含转录            |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 触发重新索引的字节阈值                  |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 触发重新索引的消息阈值                  |

会话索引需要显式启用，并以异步方式运行。结果可能会有轻微滞后。会话日志保存在磁盘上，因此应将文件系统访问视为信任边界。

---

## SQLite 向量加速（sqlite-vec）

| Key                          | Type      | Default | Description                        |
| ---------------------------- | --------- | ------- | ---------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 执行向量查询       |
| `store.vector.extensionPath` | `string`  | bundled | 覆盖 sqlite-vec 路径               |

当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦相似度计算。

---

## 索引存储

| Key                   | Type     | Default                               | Description                             |
| --------------------- | -------- | ------------------------------------- | --------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支持 `{agentId}` 占位符）     |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 分词器（`unicode61` 或 `trigram`） |

---

## QMD 后端配置

设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置都位于
`memory.qmd` 下：

| Key                      | Type      | Default  | Description                                |
| ------------------------ | --------- | -------- | ------------------------------------------ |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径                         |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`     |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`    |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`       |
| `sessions.enabled`       | `boolean` | `false`  | 为会话转录建立索引                         |
| `sessions.retentionDays` | `number`  | --       | 转录保留时长                               |
| `sessions.exportDir`     | `string`  | --       | 导出目录                                   |

OpenClaw 优先使用当前 QMD collection 和 MCP 查询结构，但也会通过回退到旧版 `--mask` collection 标志和旧版 MCP 工具名称，在需要时继续兼容较旧的 QMD 版本。

QMD 模型覆盖配置保留在 QMD 侧，而不是 OpenClaw 配置中。如果你需要全局覆盖 QMD 的模型，请在 Gateway 网关运行时环境中设置环境变量，例如
`QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。

### 更新计划

| Key                       | Type      | Default | Description                      |
| ------------------------- | --------- | ------- | -------------------------------- |
| `update.interval`         | `string`  | `5m`    | 刷新间隔                         |
| `update.debounceMs`       | `number`  | `15000` | 文件变更防抖时间                 |
| `update.onBoot`           | `boolean` | `true`  | 启动时刷新                       |
| `update.waitForBootSync`  | `boolean` | `false` | 启动时阻塞，直到刷新完成         |
| `update.embedInterval`    | `string`  | --      | 单独的嵌入执行周期               |
| `update.commandTimeoutMs` | `number`  | --      | QMD 命令超时时间                 |
| `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作超时时间             |
| `update.embedTimeoutMs`   | `number`  | --      | QMD 嵌入操作超时时间             |

### 限制

| Key                       | Type     | Default | Description            |
| ------------------------- | -------- | ------- | ---------------------- |
| `limits.maxResults`       | `number` | `6`     | 最大搜索结果数         |
| `limits.maxSnippetChars`  | `number` | --      | 限制摘要长度           |
| `limits.maxInjectedChars` | `number` | --      | 限制注入的总字符数     |
| `limits.timeoutMs`        | `number` | `4000`  | 搜索超时时间           |

### 作用域

用于控制哪些会话可以接收 QMD 搜索结果。使用与
[`session.sendPolicy`](/zh-CN/gateway/configuration-reference#session) 相同的 schema：

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

随附的默认配置允许 direct 和 channel 会话，同时仍然拒绝 group。

默认仅限私信。`match.keyPrefix` 匹配规范化后的会话键；
`match.rawKeyPrefix` 匹配原始键，包括 `agent:<id>:`。

### 引用

`memory.citations` 适用于所有后端：

| Value            | Behavior                                  |
| ---------------- | ----------------------------------------- |
| `auto`（默认）   | 在摘要中包含 `Source: <path#line>` 页脚   |
| `on`             | 始终包含页脚                              |
| `off`            | 省略页脚（路径仍会在内部传递给智能体）    |

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

Dreaming 配置位于 `plugins.entries.memory-core.config.dreaming` 下，
而不是 `agents.defaults.memorySearch` 下。

Dreaming 作为一次计划中的完整扫描运行，并将内部的 light/deep/REM 阶段作为实现细节。

有关概念行为和斜杠命令，请参阅 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| Key         | Type      | Default     | Description                         |
| ----------- | --------- | ----------- | ----------------------------------- |
| `enabled`   | `boolean` | `false`     | 完全启用或禁用 Dreaming             |
| `frequency` | `string`  | `0 3 * * *` | 可选的完整 Dreaming 扫描 cron 周期  |

### 示例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

说明：

- Dreaming 会将机器状态写入 `memory/.dreams/`。
- Dreaming 会将人类可读的叙事输出写入 `DREAMS.md`（或现有的 `dreams.md`）。
- light/deep/REM 阶段策略和阈值属于内部行为，不是面向用户的配置。

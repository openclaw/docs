---
read_when:
    - 你想要配置 Memory 搜索提供商或嵌入模型
    - 你想要设置 QMD 后端
    - 你想要调整混合搜索、MMR 或时间衰减
    - 你想要启用多模态 Memory 索引
summary: Memory 搜索、嵌入提供商、QMD、混合搜索和多模态索引的所有配置项
title: Memory 配置参考
x-i18n:
    generated_at: "2026-04-24T02:14:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfc2535bc53278ff6ef1f21fcb5a1caeb5c229bd9caa6859d517c354ba8460fd
    source_path: reference/memory-config.md
    workflow: 15
---

这个页面列出了 OpenClaw Memory 搜索的所有配置项。有关概念性概览，请参见：

- [Memory Overview](/zh-CN/concepts/memory) -- Memory 的工作原理
- [Builtin Engine](/zh-CN/concepts/memory-builtin) -- 默认的 SQLite 后端
- [QMD Engine](/zh-CN/concepts/memory-qmd) -- local-first 侧车服务
- [Memory Search](/zh-CN/concepts/memory-search) -- 搜索流水线和调优
- [Active Memory](/zh-CN/concepts/active-memory) -- 为交互式会话启用 Memory 子智能体

除非另有说明，所有 Memory 搜索设置都位于 `openclaw.json` 中的 `agents.defaults.memorySearch` 下。

如果你要找的是 **active memory** 功能开关和子智能体配置，它位于 `plugins.entries.active-memory` 下，而不是 `memorySearch`。

Active memory 使用双重门控模型：

1. 必须启用该插件，并将其目标指向当前智能体 id
2. 该请求必须是符合条件的交互式持久聊天会话

有关激活模型、插件自有配置、转录持久化以及安全发布模式，请参见 [Active Memory](/zh-CN/concepts/active-memory)。

---

## 提供商选择

| Key        | Type      | Default          | Description                                                                                                   |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自动检测         | 嵌入适配器 ID：`bedrock`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`voyage` |
| `model`    | `string`  | 提供商默认值     | 嵌入模型名称                                                                                                  |
| `fallback` | `string`  | `"none"`         | 当主适配器失败时使用的回退适配器 ID                                                                           |
| `enabled`  | `boolean` | `true`           | 启用或禁用 Memory 搜索                                                                                        |

### 自动检测顺序

当未设置 `provider` 时，OpenClaw 会选择第一个可用项：

1. `local` -- 如果已配置 `memorySearch.local.modelPath` 且文件存在。
2. `github-copilot` -- 如果可以解析 GitHub Copilot token（环境变量或 auth profile）。
3. `openai` -- 如果可以解析 OpenAI 密钥。
4. `gemini` -- 如果可以解析 Gemini 密钥。
5. `voyage` -- 如果可以解析 Voyage 密钥。
6. `mistral` -- 如果可以解析 Mistral 密钥。
7. `bedrock` -- 如果 AWS SDK 凭证链可解析（实例角色、访问密钥、profile、SSO、web identity 或共享配置）。

支持 `ollama`，但不会自动检测（请显式设置它）。

### API 密钥解析

远程嵌入需要 API 密钥。Bedrock 则改用 AWS SDK 默认凭证链（实例角色、SSO、访问密钥）。

| Provider       | Env var                                            | Config key                        |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS 凭证链                                         | 不需要 API 密钥                   |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | 通过设备登录的 auth profile       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY`（占位符）                         | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

Codex OAuth 仅适用于 chat/completions，不满足嵌入请求。

---

## 远程端点配置

用于自定义 OpenAI 兼容端点或覆盖提供商默认值：

| Key              | Type     | Description                              |
| ---------------- | -------- | ---------------------------------------- |
| `remote.baseUrl` | `string` | 自定义 API 基础 URL                      |
| `remote.apiKey`  | `string` | 覆盖 API 密钥                            |
| `remote.headers` | `object` | 额外的 HTTP 标头（与提供商默认值合并）   |

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

## Gemini 专用配置

| Key                    | Type     | Default                | Description                             |
| ---------------------- | -------- | ---------------------- | --------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview`     |
| `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072     |

<Warning>
更改模型或 `outputDimensionality` 会触发自动全量重新索引。
</Warning>

---

## Bedrock 嵌入配置

Bedrock 使用 AWS SDK 默认凭证链 -- 不需要 API 密钥。
如果 OpenClaw 运行在带有 Bedrock 权限实例角色的 EC2 上，只需设置
provider 和 model：

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
| `outputDimensionality` | `number` | 模型默认值                     | 对于 Titan V2：256、512 或 1024 |

### 支持的模型

支持以下模型（带系列检测和维度默认值）：

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

带吞吐量后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）会继承
基础模型的配置。

### 身份验证

Bedrock 身份验证使用标准 AWS SDK 凭证解析顺序：

1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
2. SSO token 缓存
3. Web identity token 凭证
4. 共享凭证和配置文件
5. ECS 或 EC2 元数据凭证

区域从 `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock`
提供商的 `baseUrl` 中解析，或默认使用 `us-east-1`。

### IAM 权限

IAM 角色或用户需要：

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

为了实现最小权限，请将 `InvokeModel` 限定到特定模型：

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## 本地嵌入配置

| Key                   | Type               | Default                | Description                                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | 自动下载               | GGUF 模型文件路径                                                                                                                                                                                                                                                                                                    |
| `local.modelCacheDir` | `string`           | node-llama-cpp 默认值  | 已下载模型的缓存目录                                                                                                                                                                                                                                                                                                 |
| `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入上下文的上下文窗口大小。4096 可覆盖典型分块（128–512 tokens），同时限制非权重 VRAM 占用。在资源受限的主机上可降低到 1024–2048。`"auto"` 会使用模型训练时的最大值 —— 不建议用于 8B+ 模型（Qwen3-Embedding-8B：40 960 tokens → 约 32 GB VRAM，而在 4096 下约为 8.8 GB）。 |

默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。
需要原生构建：`pnpm approve-builds`，然后执行 `pnpm rebuild node-llama-cpp`。

使用独立 CLI 验证 Gateway 网关所使用的同一路径提供商：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

如果 `provider` 为 `auto`，只有当 `local.modelPath` 指向
现有本地文件时，才会选择 `local`。`hf:` 和 HTTP(S) 模型引用仍可在
`provider: "local"` 时显式使用，但在模型可用于磁盘之前，它们不会让 `auto`
优先选择 local。

---

## 混合搜索配置

全部位于 `memorySearch.query.hybrid` 下：

| Key                   | Type      | Default | Description                       |
| --------------------- | --------- | ------- | --------------------------------- |
| `enabled`             | `boolean` | `true`  | 启用混合 BM25 + 向量搜索          |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数权重（0-1）               |
| `textWeight`          | `number`  | `0.3`   | BM25 分数权重（0-1）              |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小乘数                    |

### MMR（多样性）

| Key           | Type      | Default | Description                         |
| ------------- | --------- | ------- | ----------------------------------- |
| `mmr.enabled` | `boolean` | `false` | 启用 MMR 重新排序                   |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性      |

### 时间衰减（新近性）

| Key                          | Type      | Default | Description          |
| ---------------------------- | --------- | ------- | -------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | 启用新近性加权       |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | 分数每 N 天减半      |

常青文件（`MEMORY.md`、`memory/` 中非日期命名的文件）永远不会衰减。

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

## 其他 Memory 路径

| Key          | Type       | Description                  |
| ------------ | ---------- | ---------------------------- |
| `extraPaths` | `string[]` | 要建立索引的其他目录或文件   |

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

路径可以是绝对路径或相对于工作区的路径。目录会递归扫描
`.md` 文件。符号链接处理取决于当前后端：
内置引擎会忽略符号链接，而 QMD 会遵循底层 QMD
扫描器的行为。

对于按智能体范围进行的跨智能体转录搜索，请使用
`agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。
这些额外集合遵循相同的 `{ path, name, pattern? }` 结构，但它们会按智能体合并，
并且当路径指向当前工作区之外时，可以保留显式共享名称。
如果相同的解析路径同时出现在 `memory.qmd.paths` 和
`memorySearch.qmd.extraCollections` 中，QMD 会保留第一项并跳过
重复项。

---

## 多模态 Memory（Gemini）

使用 Gemini Embedding 2 将图像和音频与 Markdown 一起建立索引：

| Key                       | Type       | Default    | Description                        |
| ------------------------- | ---------- | ---------- | ---------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引                     |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 可建立索引的最大文件大小           |

仅适用于 `extraPaths` 中的文件。默认 Memory 根路径仍然只支持 Markdown。
需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`
（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| Key                | Type      | Default | Description                    |
| ------------------ | --------- | ------- | ------------------------------ |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中缓存分块嵌入       |
| `cache.maxEntries` | `number`  | `50000` | 最大缓存嵌入数量               |

可防止在重新索引或转录更新期间对未更改文本重复生成嵌入。

---

## 批量索引

| Key                           | Type      | Default | Description              |
| ----------------------------- | --------- | ------- | ------------------------ |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API         |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理作业数         |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成           |
| `remote.batch.pollIntervalMs` | `number`  | --      | 轮询间隔                 |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批处理超时时间           |

适用于 `openai`、`gemini` 和 `voyage`。对于大型回填任务，OpenAI 批处理通常
最快且最便宜。

---

## 会话 Memory 搜索（实验性）

为会话转录建立索引，并通过 `memory_search` 提供结果：

| Key                           | Type       | Default      | Description                              |
| ----------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用会话索引                             |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含转录             |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 触发重新索引的字节数阈值                 |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 触发重新索引的消息数阈值                 |

会话索引需显式启用，并以异步方式运行。结果可能会略有
滞后。会话日志存储在磁盘上，因此应将文件系统访问视为信任
边界。

---

## SQLite 向量加速（sqlite-vec）

| Key                          | Type      | Default | Description                    |
| ---------------------------- | --------- | ------- | ------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`  | 对向量查询使用 sqlite-vec      |
| `store.vector.extensionPath` | `string`  | 内置    | 覆盖 sqlite-vec 路径           |

当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内余弦
相似度。

---

## 索引存储

| Key                   | Type     | Default                               | Description                                 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支持 `{agentId}` token）          |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 分词器（`unicode61` 或 `trigram`）     |

---

## QMD 后端配置

设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置都位于
`memory.qmd` 下：

| Key                      | Type      | Default  | Description                                  |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径                           |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`       |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`      |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`         |
| `sessions.enabled`       | `boolean` | `false`  | 为会话转录建立索引                           |
| `sessions.retentionDays` | `number`  | --       | 转录保留期                                   |
| `sessions.exportDir`     | `string`  | --       | 导出目录                                     |

OpenClaw 优先使用当前的 QMD collection 和 MCP query 结构，但会通过回退到旧版 `--mask` collection 标志
以及旧版 MCP 工具名称来保持对旧版 QMD 发布的兼容性。

QMD 模型覆盖保留在 QMD 侧，而不是 OpenClaw 配置中。如果你需要
全局覆盖 QMD 的模型，请在 Gateway 网关运行时环境中设置环境变量，
例如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。

### 更新计划

| Key                       | Type      | Default | Description                           |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval`         | `string`  | `5m`    | 刷新间隔                              |
| `update.debounceMs`       | `number`  | `15000` | 文件更改去抖时间                      |
| `update.onBoot`           | `boolean` | `true`  | 启动时刷新                            |
| `update.waitForBootSync`  | `boolean` | `false` | 阻塞启动直到刷新完成                  |
| `update.embedInterval`    | `string`  | --      | 单独的嵌入执行周期                    |
| `update.commandTimeoutMs` | `number`  | --      | QMD 命令超时时间                      |
| `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作超时时间                  |
| `update.embedTimeoutMs`   | `number`  | --      | QMD 嵌入操作超时时间                  |

### 限制

| Key                       | Type     | Default | Description         |
| ------------------------- | -------- | ------- | ------------------- |
| `limits.maxResults`       | `number` | `6`     | 最大搜索结果数      |
| `limits.maxSnippetChars`  | `number` | --      | 限制片段长度        |
| `limits.maxInjectedChars` | `number` | --      | 限制注入总字符数    |
| `limits.timeoutMs`        | `number` | `4000`  | 搜索超时时间        |

### 范围

控制哪些会话可以接收 QMD 搜索结果。使用与
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

随附默认配置允许 direct 和 channel 会话，同时仍然拒绝
群组。

默认仅限私信。`match.keyPrefix` 匹配规范化后的会话键；
`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

### 引用

`memory.citations` 适用于所有后端：

| Value            | Behavior                                      |
| ---------------- | --------------------------------------------- |
| `auto`（默认）   | 在片段中包含 `Source: <path#line>` 页脚       |
| `on`             | 始终包含页脚                                  |
| `off`            | 省略页脚（路径仍会在内部传递给智能体）        |

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

Dreaming 作为一次计划中的完整扫描运行，并将内部的 light/deep/REM 阶段
作为实现细节来使用。

有关概念行为和斜杠命令，请参见 [Dreaming](/zh-CN/concepts/dreaming)。

### 用户设置

| Key         | Type      | Default     | Description                                  |
| ----------- | --------- | ----------- | -------------------------------------------- |
| `enabled`   | `boolean` | `false`     | 完全启用或禁用 Dreaming                      |
| `frequency` | `string`  | `0 3 * * *` | 完整 Dreaming 扫描的可选 cron 执行周期       |

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

注意：

- Dreaming 将机器状态写入 `memory/.dreams/`。
- Dreaming 将人类可读的叙述性输出写入 `DREAMS.md`（或现有的 `dreams.md`）。
- light/deep/REM 阶段策略和阈值属于内部行为，不是面向用户的配置。

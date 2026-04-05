---
read_when:
    - 你想配置 memory 搜索提供商或嵌入模型
    - 你想设置 QMD 后端
    - 你想调优混合搜索、MMR 或时间衰减
    - 你想启用多模态 memory 索引
summary: memory 搜索、嵌入提供商、QMD、混合搜索和多模态索引的全部配置项
title: Memory 配置参考
x-i18n:
    generated_at: "2026-04-05T10:08:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Memory 配置参考

本页列出了 OpenClaw memory 搜索的所有配置项。有关概念性概览，请参见：

- [Memory Overview](/zh-CN/concepts/memory) -- memory 的工作原理
- [Builtin Engine](/zh-CN/concepts/memory-builtin) -- 默认 SQLite 后端
- [QMD Engine](/zh-CN/concepts/memory-qmd) -- 本地优先的 sidecar
- [Memory Search](/zh-CN/concepts/memory-search) -- 搜索管道与调优

除非另有说明，所有 memory 搜索设置都位于 `openclaw.json` 中的
`agents.defaults.memorySearch` 下。

---

## 提供商选择

| 键         | 类型      | 默认值           | 说明                                                               |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------ |
| `provider` | `string`  | 自动检测         | 嵌入适配器 ID：`openai`、`gemini`、`voyage`、`mistral`、`ollama`、`local` |
| `model`    | `string`  | 提供商默认值     | 嵌入模型名称                                                       |
| `fallback` | `string`  | `"none"`         | 当主适配器失败时使用的回退适配器 ID                                |
| `enabled`  | `boolean` | `true`           | 启用或禁用 memory 搜索                                             |

### 自动检测顺序

当未设置 `provider` 时，OpenClaw 会选择第一个可用项：

1. `local` -- 如果已配置 `memorySearch.local.modelPath` 且文件存在。
2. `openai` -- 如果可以解析到 OpenAI 密钥。
3. `gemini` -- 如果可以解析到 Gemini 密钥。
4. `voyage` -- 如果可以解析到 Voyage 密钥。
5. `mistral` -- 如果可以解析到 Mistral 密钥。

支持 `ollama`，但不会自动检测（请显式设置）。

### API 密钥解析

远程嵌入需要 API 密钥。OpenClaw 会从以下位置解析：
认证配置文件、`models.providers.*.apiKey` 或环境变量。

| 提供商  | 环境变量                       | 配置键                            |
| ------- | ------------------------------ | --------------------------------- |
| OpenAI  | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini  | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage  | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Ollama  | `OLLAMA_API_KEY`（占位符）     | --                                |

Codex OAuth 仅覆盖聊天/completions，不满足嵌入请求需求。

---

## 远程端点配置

用于自定义 OpenAI-compatible 端点或覆盖提供商默认值：

| 键               | 类型     | 说明                                |
| ---------------- | -------- | ----------------------------------- |
| `remote.baseUrl` | `string` | 自定义 API base URL                 |
| `remote.apiKey`  | `string` | 覆盖 API 密钥                       |
| `remote.headers` | `object` | 额外 HTTP 标头（与提供商默认值合并） |

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

| 键                     | 类型     | 默认值                 | 说明                                       |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview`        |
| `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072        |

<Warning>
更改模型或 `outputDimensionality` 会触发自动全量重建索引。
</Warning>

---

## 本地嵌入配置

| 键                    | 类型     | 默认值                 | 说明                         |
| --------------------- | -------- | ---------------------- | ---------------------------- |
| `local.modelPath`     | `string` | 自动下载               | GGUF 模型文件路径            |
| `local.modelCacheDir` | `string` | node-llama-cpp 默认值  | 已下载模型的缓存目录         |

默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。
需要原生构建：`pnpm approve-builds` 然后 `pnpm rebuild node-llama-cpp`。

---

## 混合搜索配置

全部位于 `memorySearch.query.hybrid` 下：

| 键                    | 类型      | 默认值  | 说明                             |
| --------------------- | --------- | ------- | -------------------------------- |
| `enabled`             | `boolean` | `true`  | 启用混合 BM25 + 向量搜索         |
| `vectorWeight`        | `number`  | `0.7`   | 向量分数权重（0-1）              |
| `textWeight`          | `number`  | `0.3`   | BM25 分数权重（0-1）             |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小乘数                   |

### MMR（多样性）

| 键            | 类型      | 默认值  | 说明                               |
| ------------- | --------- | ------- | ---------------------------------- |
| `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序                    |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性     |

### 时间衰减（新近性）

| 键                           | 类型      | 默认值  | 说明                       |
| ---------------------------- | --------- | ------- | -------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | 启用新近性加权             |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | 每 N 天分数减半            |

常青文件（`MEMORY.md`、`memory/` 中无日期文件）永远不会衰减。

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

## 其他 memory 路径

| 键           | 类型       | 说明                              |
| ------------ | ---------- | --------------------------------- |
| `extraPaths` | `string[]` | 要索引的其他目录或文件            |

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

路径可以是绝对路径或工作区相对路径。目录会递归扫描
`.md` 文件。符号链接处理方式取决于当前后端：
内置引擎会忽略符号链接，而 QMD 会遵循底层 QMD
扫描器的行为。

对于按智能体范围的跨智能体 transcript 搜索，请使用
`agents.list[].memorySearch.qmd.extraCollections`，而不是 `memory.qmd.paths`。
这些额外集合遵循相同的 `{ path, name, pattern? }` 结构，但它们会按智能体合并，并且当路径指向当前工作区之外时，可以保留显式共享名称。
如果相同的解析路径同时出现在 `memory.qmd.paths` 和
`memorySearch.qmd.extraCollections` 中，QMD 会保留第一项并跳过重复项。

---

## 多模态 memory（Gemini）

使用 Gemini Embedding 2，将图像和音频与 Markdown 一起建立索引：

| 键                        | 类型       | 默认值     | 说明                                   |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引                         |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]`  |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 可索引的最大文件大小                   |

仅适用于 `extraPaths` 中的文件。默认 memory 根目录仍然只支持 Markdown。
需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`
（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键                 | 类型      | 默认值  | 说明                            |
| ------------------ | --------- | ------- | ------------------------------- |
| `cache.enabled`    | `boolean` | `false` | 在 SQLite 中缓存分块嵌入        |
| `cache.maxEntries` | `number`  | `50000` | 最大缓存嵌入数量                |

可防止在重建索引或 transcript 更新期间对未更改的文本重复生成嵌入。

---

## 批量索引

| 键                            | 类型      | 默认值  | 说明                     |
| ----------------------------- | --------- | ------- | ------------------------ |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API         |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批处理作业           |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批处理完成           |
| `remote.batch.pollIntervalMs` | `number`  | --      | 轮询间隔                 |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批处理超时               |

适用于 `openai`、`gemini` 和 `voyage`。对于大规模回填，OpenAI 批处理通常
最快且最便宜。

---

## 会话 memory 搜索（实验性）

为会话 transcript 建立索引，并通过 `memory_search` 暴露：

| 键                            | 类型       | 默认值        | 说明                                 |
| ----------------------------- | ---------- | ------------- | ------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`       | 启用会话索引                         |
| `sources`                     | `string[]` | `["memory"]`  | 添加 `"sessions"` 以包含 transcript  |
| `sync.sessions.deltaBytes`    | `number`   | `100000`      | 触发重建索引的字节阈值               |
| `sync.sessions.deltaMessages` | `number`   | `50`          | 触发重建索引的消息阈值               |

会话索引为选择启用，并且异步运行。结果可能会有轻微滞后。
会话日志存储在磁盘上，因此应将文件系统访问视为信任边界。

---

## SQLite 向量加速（sqlite-vec）

| 键                           | 类型      | 默认值   | 说明                            |
| ---------------------------- | --------- | -------- | ------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`   | 使用 sqlite-vec 进行向量查询    |
| `store.vector.extensionPath` | `string`  | 内置     | 覆盖 sqlite-vec 路径            |

当 sqlite-vec 不可用时，OpenClaw 会自动回退到进程内 cosine
similarity。

---

## 索引存储

| 键                    | 类型     | 默认值                                | 说明                                  |
| --------------------- | -------- | ------------------------------------- | ------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支持 `{agentId}` token）    |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer（`unicode61` 或 `trigram`） |

---

## QMD 后端配置

设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置都位于
`memory.qmd` 下：

| 键                       | 类型      | 默认值   | 说明                                         |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径                           |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`       |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`      |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`         |
| `sessions.enabled`       | `boolean` | `false`  | 为会话 transcript 建立索引                   |
| `sessions.retentionDays` | `number`  | --       | transcript 保留期                            |
| `sessions.exportDir`     | `string`  | --       | 导出目录                                     |

### 更新计划

| 键                        | 类型      | 默认值   | 说明                               |
| ------------------------- | --------- | -------- | ---------------------------------- |
| `update.interval`         | `string`  | `5m`     | 刷新间隔                           |
| `update.debounceMs`       | `number`  | `15000`  | 文件变更防抖                       |
| `update.onBoot`           | `boolean` | `true`   | 启动时刷新                         |
| `update.waitForBootSync`  | `boolean` | `false`  | 启动时阻塞直到刷新完成             |
| `update.embedInterval`    | `string`  | --       | 单独的嵌入频率                     |
| `update.commandTimeoutMs` | `number`  | --       | QMD 命令超时                       |
| `update.updateTimeoutMs`  | `number`  | --       | QMD 更新操作超时                   |
| `update.embedTimeoutMs`   | `number`  | --       | QMD 嵌入操作超时                   |

### 限制

| 键                        | 类型     | 默认值  | 说明                     |
| ------------------------- | -------- | ------- | ------------------------ |
| `limits.maxResults`       | `number` | `6`     | 最大搜索结果数           |
| `limits.maxSnippetChars`  | `number` | --      | 限制摘要长度             |
| `limits.maxInjectedChars` | `number` | --      | 限制注入的总字符数       |
| `limits.timeoutMs`        | `number` | `4000`  | 搜索超时                 |

### 范围

控制哪些会话可以接收 QMD 搜索结果。与
[`session.sendPolicy`](/zh-CN/gateway/configuration-reference#session) 使用相同的 schema：

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

默认仅限私信。`match.keyPrefix` 匹配规范化后的会话键；
`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

### 引用

`memory.citations` 适用于所有后端：

| 值               | 行为                                              |
| ---------------- | ------------------------------------------------- |
| `auto`（默认）   | 在摘要中包含 `Source: <path#line>` 页脚           |
| `on`             | 始终包含页脚                                      |
| `off`            | 省略页脚（路径仍会在内部传递给智能体）            |

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

## Dreaming（实验性）

Dreaming 配置位于 `plugins.entries.memory-core.config.dreaming` 下，
而不是 `agents.defaults.memorySearch` 下。有关概念细节和聊天
命令，请参见 [Dreaming](/zh-CN/concepts/memory-dreaming)。

| 键                 | 类型     | 默认值         | 说明                                    |
| ------------------ | -------- | -------------- | --------------------------------------- |
| `mode`             | `string` | `"off"`        | 预设：`off`、`core`、`rem` 或 `deep`    |
| `cron`             | `string` | 预设默认值     | 计划任务的 Cron 表达式覆盖              |
| `timezone`         | `string` | 用户时区       | 用于计划评估的时区                      |
| `limit`            | `number` | 预设默认值     | 每个周期可提升的最大候选数              |
| `minScore`         | `number` | 预设默认值     | 提升所需的最小加权分数                  |
| `minRecallCount`   | `number` | 预设默认值     | 最小召回次数阈值                        |
| `minUniqueQueries` | `number` | 预设默认值     | 最小不同查询数阈值                      |

### 预设默认值

| 模式    | 频率           | minScore | minRecallCount | minUniqueQueries |
| ------- | -------------- | -------- | -------------- | ---------------- |
| `off`   | 已禁用         | --       | --             | --               |
| `core`  | 每天凌晨 3 点  | 0.75     | 3              | 2                |
| `rem`   | 每 6 小时      | 0.85     | 4              | 3                |
| `deep`  | 每 12 小时     | 0.80     | 3              | 3                |

### 示例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

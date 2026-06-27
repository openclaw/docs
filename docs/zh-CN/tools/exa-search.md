---
read_when:
    - 你想使用 Exa 进行 `web_search`
    - 你需要一个 `EXA_API_KEY`
    - 你需要神经搜索或内容提取
summary: Exa AI 搜索 -- 带内容提取的神经搜索和关键词搜索
title: Exa 搜索
x-i18n:
    generated_at: "2026-06-27T03:26:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw 支持将 [Exa AI](https://exa.ai/) 用作 `web_search` 提供商。Exa
提供神经、关键词和混合搜索模式，并内置内容
提取（高亮、文本、摘要）。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## 获取 API key

<Steps>
  <Step title="Create an account">
    在 [exa.ai](https://exa.ai/) 注册，并从你的
    仪表板生成 API key。
  </Step>
  <Step title="Store the key">
    在 Gateway 网关环境中设置 `EXA_API_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 配置

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**环境替代方式：**在 Gateway 网关环境中设置 `EXA_API_KEY`。
对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。

## Base URL 覆盖

当 Exa 搜索请求应通过兼容代理或备用 Exa 端点时，设置 `plugins.entries.exa.config.webSearch.baseUrl`。OpenClaw
会通过添加 `https://` 来规范化裸主机，并追加 `/search`，除非
路径已以它结尾。解析后的端点会包含在搜索缓存
键中，因此来自不同 Exa 端点的结果不会共享。

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number">
要返回的结果数（1–100）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜索模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤器。
</ParamField>

<ParamField path="date_after" type="string">
此日期之后的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
此日期之前的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
内容提取选项（见下文）。
</ParamField>

### 内容提取

Exa 可以随搜索结果一起返回提取的内容。传入 `contents`
对象即可启用：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| 内容选项 | 类型                                                                  | 描述            |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 提取完整页面文本 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句子  |
| `summary`       | `boolean \| { query }`                                                | AI 生成的摘要   |

### 搜索模式

| 模式             | 描述                       |
| ---------------- | --------------------------------- |
| `auto`           | Exa 选择最佳模式（默认） |
| `neural`         | 基于语义/含义的搜索     |
| `fast`           | 快速关键词搜索              |
| `deep`           | 全面的深度搜索              |
| `deep-reasoning` | 带推理的深度搜索        |
| `instant`        | 最快结果                   |

## 说明

- 如果未提供 `contents` 选项，Exa 默认使用 `{ highlights: true }`，
  因此结果会包含关键句摘录
- 可用时，结果会保留 Exa API
  响应中的 `highlightScores` 和 `summary` 字段
- 结果描述会优先从高亮解析，其次是摘要，再其次是
  全文，以可用者为准
- `freshness` 和 `date_after`/`date_before` 不能组合使用，请使用一种
  时间过滤模式
- 每次查询最多可返回 100 个结果（受 Exa 搜索类型
  限制约束）
- 结果默认缓存 15 分钟（可通过
  `cacheTtlMinutes` 配置）
- Exa 是一个官方 API 集成，提供结构化 JSON 响应

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 带国家/语言过滤器的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 带域名过滤的结构化结果

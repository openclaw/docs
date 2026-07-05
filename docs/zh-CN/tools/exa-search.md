---
read_when:
    - 你想使用 Exa 进行 web_search
    - 你需要一个 EXA_API_KEY
    - 你需要神经搜索或内容提取
summary: Exa AI 搜索 -- 支持内容提取的神经搜索和关键词搜索
title: Exa 搜索
x-i18n:
    generated_at: "2026-07-05T11:44:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) 是一个 `web_search` 提供商，支持神经、关键词和混合搜索模式，并内置内容提取（高亮、文本、摘要）。

## 安装插件

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## 获取 API key

<Steps>
  <Step title="Create an account">
    在 [exa.ai](https://exa.ai/) 注册，并从你的仪表盘生成 API key。
  </Step>
  <Step title="Store the key">
    在 Gateway 网关环境中设置 `EXA_API_KEY`，或通过以下命令配置：

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

**环境替代方案：**在 Gateway 网关环境中设置 `EXA_API_KEY`。对于 Gateway 网关安装，请将它放在 `~/.openclaw/.env` 中。参见[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

## Base URL 覆盖

设置 `plugins.entries.exa.config.webSearch.baseUrl`，将 Exa 搜索请求路由到兼容代理或替代端点。OpenClaw 会通过前置 `https://` 来规范化裸主机，并追加 `/search`，除非路径已经以它结尾。解析后的端点是搜索缓存键的一部分，因此来自不同端点的结果绝不会共享。

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
要返回的结果数（1-100，受 Exa 搜索类型限制约束）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜索模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间筛选器。不能与 `date_after`/`date_before` 组合使用。
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

传入 `contents` 对象来控制结果中提取的内容：

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

| 内容选项        | 类型                                                                  | 描述             |
| --------------- | --------------------------------------------------------------------- | ---------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 提取完整页面文本 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句       |
| `summary`       | `boolean \| { query }`                                                | AI 生成的摘要    |

如果省略 `contents`，Exa 默认使用 `{ highlights: true }`，因此结果会包含关键句摘录。结果描述会优先取自高亮，其次是摘要，再其次是完整文本 -- 以最先可用的为准。结果还会在可用时保留 Exa API 响应中的原始 `highlightScores` 和 `summary` 字段。

### 搜索模式

| 模式             | 描述                         |
| ---------------- | ---------------------------- |
| `auto`           | Exa 选择最佳模式（默认）     |
| `neural`         | 基于语义/含义的搜索          |
| `fast`           | 快速关键词搜索               |
| `deep`           | 全面的深度搜索               |
| `deep-reasoning` | 带推理的深度搜索             |
| `instant`        | 最快结果                     |

## 说明

- `count` 最多接受 100，受 Exa 搜索类型限制约束。
- 结果默认缓存 15 分钟。配置共享的 `tools.web.search.cacheTtlMinutes`（分钟）和 `tools.web.search.timeoutSeconds`（默认 30s），即可更改所有 `web_search` 提供商（包括 Exa）的缓存和请求超时。

## 相关

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 带国家/语言筛选器的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 带域名筛选的结构化结果

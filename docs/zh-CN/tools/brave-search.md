---
read_when:
    - 你想将 Brave Search 用于 `web_search`
    - 你需要 `BRAVE_API_KEY` 或套餐详情
summary: 用于 `web_search` 的 Brave Search API 设置
title: Brave Search
x-i18n:
    generated_at: "2026-04-05T10:10:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc026a69addf74375a0e407805b875ff527c77eb7298b2f5bb0e165197f77c0c
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw 支持将 Brave Search API 作为 `web_search` 提供商。

## 获取 API key

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建一个 Brave Search API 账户
2. 在控制台中，选择 **Search** 套餐并生成一个 API key。
3. 将该 key 存储到配置中，或在 Gateway 网关环境中设置 `BRAVE_API_KEY`。

## 配置示例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Brave 搜索的提供商特定设置现在位于 `plugins.entries.brave.config.webSearch.*` 下。
Legacy `tools.web.search.apiKey` 仍可通过兼容性 shim 加载，但它不再是规范配置路径。

`webSearch.mode` 控制 Brave 传输方式：

- `web`（默认）：普通 Brave Web 搜索，返回标题、URL 和摘要
- `llm-context`：Brave LLM Context API，返回预提取的文本块和来源，用于 grounding

## 工具参数

| 参数 | 描述 |
| ------------- | ------------------------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 返回结果数量（1-10，默认：5） |
| `country` | 2 位 ISO 国家代码（例如 `"US"`、`"DE"`） |
| `language` | 搜索结果使用的 ISO 639-1 语言代码（例如 `"en"`、`"de"`、`"fr"`） |
| `search_lang` | Brave 搜索语言代码（例如 `en`、`en-gb`、`zh-hans`） |
| `ui_lang` | UI 元素的 ISO 语言代码 |
| `freshness` | 时间过滤：`day`（24 小时）、`week`、`month` 或 `year` |
| `date_after` | 仅返回此日期之后发布的结果（YYYY-MM-DD） |
| `date_before` | 仅返回此日期之前发布的结果（YYYY-MM-DD） |

**示例：**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 说明

- OpenClaw 使用 Brave 的 **Search** 套餐。如果你有 legacy 订阅（例如最初的免费套餐，每月 2,000 次查询），它仍然有效，但不包含较新的功能，例如 LLM Context 或更高的速率限制。
- 每个 Brave 套餐都包含**每月 5 美元的免费额度**（按月续期）。Search 套餐价格为每 1,000 次请求 5 美元，因此该额度可覆盖每月 1,000 次查询。请在 Brave 控制台中设置你的使用上限，以避免产生意外费用。当前套餐信息请参阅 [Brave API portal](https://brave.com/search/api/)。
- Search 套餐包含 LLM Context 端点和 AI 推理使用权。若要存储结果以训练或微调模型，则需要具有明确存储权利的套餐。请参阅 Brave 的 [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式返回 grounding 后的来源条目，而不是普通 Web 搜索摘要结果形态。
- `llm-context` 模式不支持 `ui_lang`、`freshness`、`date_after` 或 `date_before`。
- `ui_lang` 必须包含区域子标签，例如 `en-US`。
- 默认会将结果缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商与自动检测
- [Perplexity Search](/tools/perplexity-search) -- 带域过滤的结构化结果
- [Exa Search](/tools/exa-search) -- 带内容提取的神经搜索

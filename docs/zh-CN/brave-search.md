---
read_when:
    - 你想将 Brave Search 用于 `web_search`
    - 你需要 `BRAVE_API_KEY` 或套餐详情
summary: 用于 `web_search` 的 Brave Search API 设置
title: Brave 搜索（旧版路径）
x-i18n:
    generated_at: "2026-04-24T04:00:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw 支持将 Brave Search API 作为 `web_search` 提供商。

## 获取 API 密钥

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建一个 Brave Search API 账户
2. 在控制台中，选择 **Search** 套餐并生成一个 API 密钥。
3. 将该密钥存储在配置中，或在 Gateway 网关环境中设置 `BRAVE_API_KEY`。

## 配置示例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // 或 "llm-context"
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

提供商专属的 Brave 搜索设置现在位于 `plugins.entries.brave.config.webSearch.*` 下。
旧版的 `tools.web.search.apiKey` 仍可通过兼容性 shim 加载，但它不再是规范的配置路径。

`webSearch.mode` 控制 Brave 的传输方式：

- `web`（默认）：普通的 Brave 网页搜索，返回标题、URL 和摘要
- `llm-context`：Brave LLM Context API，返回预提取的文本块和用于溯源的来源

## 工具参数

| 参数 | 描述 |
| ------------- | ------------------------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 要返回的结果数量（1-10，默认：5） |
| `country` | 2 字母 ISO 国家代码（例如 `"US"`、`"DE"`） |
| `language` | 搜索结果的 ISO 639-1 语言代码（例如 `"en"`、`"de"`、`"fr"`） |
| `search_lang` | Brave 搜索语言代码（例如 `en`、`en-gb`、`zh-hans`） |
| `ui_lang` | UI 元素的 ISO 语言代码 |
| `freshness` | 时间筛选：`day`（24 小时）、`week`、`month` 或 `year` |
| `date_after` | 仅返回在此日期之后发布的结果（YYYY-MM-DD） |
| `date_before` | 仅返回在此日期之前发布的结果（YYYY-MM-DD） |

**示例：**

```javascript
// 按国家和语言限定的搜索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近结果（过去一周）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日期范围搜索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 说明

- OpenClaw 使用 Brave 的 **Search** 套餐。如果你使用的是旧版订阅（例如最初的免费套餐，每月 2,000 次查询），它仍然有效，但不包含较新的功能，例如 LLM Context 或更高的速率限制。
- 每个 Brave 套餐都包含**每月 5 美元免费额度**（按月续期）。Search 套餐的费用为每 1,000 次请求 5 美元，因此该额度可覆盖每月 1,000 次查询。请在 Brave 控制台中设置你的使用上限，以避免产生意外费用。有关当前套餐，请参阅 [Brave API portal](https://brave.com/search/api/)。
- Search 套餐包含 LLM Context 端点和 AI 推理权利。若要存储结果以训练或微调模型，则需要具备明确存储权利的套餐。请参阅 Brave 的 [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式返回带有依据来源的条目，而不是普通网页搜索摘要的结果形态。
- `llm-context` 模式不支持 `ui_lang`、`freshness`、`date_after` 或 `date_before`。
- `ui_lang` 必须包含区域子标签，例如 `en-US`。
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。

有关完整的 `web_search` 配置，请参阅 [Web tools](/zh-CN/tools/web)。

## 相关内容

- [Brave 搜索](/zh-CN/tools/brave-search)

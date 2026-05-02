---
read_when:
    - 你想使用 Brave Search 进行 web_search
    - 你需要 BRAVE_API_KEY 或套餐详情
summary: 用于 web_search 的 Brave Search API 设置
title: Brave 搜索
x-i18n:
    generated_at: "2026-05-02T06:53:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06cfef368f01d0af91ddb4e8adc13b7699019cbf662783b88c573049bfb77e18
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw 支持将 Brave Search API 用作 `web_search` 提供商。

## 获取 API key

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建 Brave Search API 账号
2. 在仪表板中，选择 **Search** 方案并生成 API key。
3. 将该键存储在配置中，或在 Gateway 网关环境中设置 `BRAVE_API_KEY`。

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

Brave 提供商专用搜索设置现在位于 `plugins.entries.brave.config.webSearch.*` 下。
旧版 `tools.web.search.apiKey` 仍会通过兼容性 shim 加载，但它不再是规范配置路径。

`webSearch.mode` 控制 Brave 传输方式：

- `web`（默认）：普通 Brave 网页搜索，包含标题、URL 和摘要片段
- `llm-context`：Brave LLM Context API，包含预提取的文本块和用于依据来源的来源信息

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
要返回的结果数量（1–10）。
</ParamField>

<ParamField path="country" type="string">
2 字母 ISO 国家/地区代码（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
搜索结果的 ISO 639-1 语言代码（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave 搜索语言代码（例如 `en`、`en-gb`、`zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 元素的 ISO 语言代码。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤器 — `day` 表示 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回在此日期之后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回在此日期之前发布的结果（`YYYY-MM-DD`）。
</ParamField>

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

- OpenClaw 使用 Brave **Search** 方案。如果你有旧版订阅（例如原始的每月 2,000 次查询 Free 方案），它仍然有效，但不包含 LLM Context 或更高频率限制等较新功能。
- 每个 Brave 方案都包含 **每月 \$5 免费额度**（会续期）。Search 方案价格为每 1,000 次请求 \$5，因此该额度可覆盖每月 1,000 次查询。请在 Brave 仪表板中设置你的用量限制，以避免意外收费。有关当前方案，请参阅 [Brave API 门户](https://brave.com/search/api/)。
- Search 方案包含 LLM Context 端点和 AI 推理权限。存储结果以训练或调优模型需要具有明确存储权限的方案。请参阅 Brave [服务条款](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式返回有依据来源的来源条目，而不是普通网页搜索摘要形态。
- `llm-context` 模式支持 `freshness` 以及有界的 `date_after` + `date_before` 范围。它不支持 `ui_lang`；没有 `date_after` 的 `date_before` 会被拒绝，因为 Brave 要求自定义 freshness 范围同时包含开始日期和结束日期。
- `ui_lang` 必须包含区域子标签，例如 `en-US`。
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。
- 启用 `brave.http` 诊断标志，可在故障排除时记录 Brave 请求 URL/查询参数、响应状态/耗时，以及搜索缓存命中/未命中/写入事件。该标志绝不会记录 API key 或响应正文，但搜索查询可能包含敏感信息。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 支持域名过滤的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) -- 支持内容提取的神经搜索

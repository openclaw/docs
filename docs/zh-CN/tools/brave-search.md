---
read_when:
    - 你想将 Brave Search 用于 web_search
    - 你需要 BRAVE_API_KEY 或方案详情
summary: web_search 的 Brave Search API 设置
title: Brave 搜索
x-i18n:
    generated_at: "2026-07-05T11:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw 支持将 Brave Search API 作为 `web_search` 提供商。

## 获取 API key

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建 Brave Search API 账户
2. 在仪表板中，选择 **Search** 方案并生成 API key。
3. 将密钥存储在配置中，或在 Gateway 网关环境中设置 `BRAVE_API_KEY`。

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Brave 提供商专用搜索设置位于 `plugins.entries.brave.config.webSearch.*` 下；这是规范配置路径。共享的顶层 `tools.web.search.apiKey` 和限定作用域的 `tools.web.search.brave.*` 仍会通过兼容性合并加载，但新配置应使用上面的插件作用域路径。

`webSearch.mode` 控制 Brave 传输方式：

- `web`（默认）：常规 Brave 网页搜索，包含标题、URL 和摘要片段
- `llm-context`：Brave LLM Context API，包含预提取的文本块和用于溯源的来源

`webSearch.baseUrl` 可以将 Brave 请求指向可信的 Brave 兼容代理
或网关。OpenClaw 会把 `/res/v1/web/search` 或 `/res/v1/llm/context` 追加到
已配置的 base URL，并将 base URL 保留在缓存键中。公共
端点必须使用 `https://`；`http://` 仅接受用于可信的 loopback
或私有网络代理主机。

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
时间筛选器 — `day` 为 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回此日期之后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回此日期之前发布的结果（`YYYY-MM-DD`）。
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

- OpenClaw 使用 Brave **Search** 方案。如果你有旧版订阅（例如原始的每月 2,000 次查询 Free 方案），它仍然有效，但不包含 LLM Context 或更高速率限制等较新功能。
- 每个 Brave 方案都包含**每月 \$5 免费额度**（续期）。Search 方案每 1,000 次请求收费 \$5，因此该额度覆盖每月 1,000 次查询。请在 Brave 仪表板中设置你的使用限制，以避免意外收费。请参阅 [Brave API portal](https://brave.com/search/api/) 了解当前方案。
- Search 方案包含 LLM Context 端点和 AI 推理权利。存储结果以训练或调优模型需要具有明确存储权利的方案。请参阅 Brave [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式返回带有溯源的来源条目，而不是常规网页搜索摘要片段形状。
- `llm-context` 模式支持 `freshness` 以及有边界的 `date_after` + `date_before` 范围。它不支持 `ui_lang`；没有 `date_after` 的 `date_before` 会被拒绝，因为 Brave 要求自定义新鲜度范围同时包含开始日期和结束日期。
- `ui_lang` 必须包含区域子标签，例如 `en-US`。
- 默认情况下，结果会缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。
- 自定义 `webSearch.baseUrl` 值会包含在 Brave 缓存标识中，因此
  代理特定响应不会发生冲突。
- 启用 `brave.http` 诊断标志，可在故障排除时记录 Brave 请求 URL/查询参数、响应状态/耗时，以及搜索缓存命中/未命中/写入事件。该标志绝不会记录 API key 或响应正文，但搜索查询可能包含敏感信息。

## 相关

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 支持域名过滤的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) -- 支持内容提取的神经搜索

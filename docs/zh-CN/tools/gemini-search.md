---
read_when:
    - 你想使用 Gemini 进行 web_search
    - 你需要 GEMINI_API_KEY 或 models.providers.google.apiKey
    - 你需要 Google Search grounding
summary: Gemini 通过 Google Search 提供依据的网页搜索
title: Gemini 搜索
x-i18n:
    generated_at: "2026-06-27T03:28:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支持带有内置
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
的 Gemini 模型，它会返回由实时 Google Search 结果支持并带有引用的 AI 合成答案。

## 获取 API key

<Steps>
  <Step title="创建密钥">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 并创建一个
    API key。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `GEMINI_API_KEY`，复用
    `models.providers.google.apiKey`，或通过以下方式配置专用的 Web 搜索密钥：

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**凭证优先级：**Gemini Web 搜索会先使用
`plugins.entries.google.config.webSearch.apiKey`，然后是 `GEMINI_API_KEY`，
再然后是 `models.providers.google.apiKey`。对于基础 URL，专用的
`plugins.entries.google.config.webSearch.baseUrl` 优先于
`models.providers.google.baseUrl`。

对于 Gateway 网关安装，请将环境密钥放入 `~/.openclaw/.env`。

## 工作原理

与返回链接和摘要列表的传统搜索提供商不同，Gemini 使用 Google Search grounding
生成带有内联引用的 AI 合成答案。结果同时包含合成答案和源 URL。

- 来自 Gemini grounding 的引用 URL 会自动从 Google 重定向 URL 解析为直接 URL。
- 重定向解析会在返回最终引用 URL 之前使用 SSRF 防护路径（HEAD + 重定向检查 +
  http/https 验证）。
- 重定向解析使用严格的 SSRF 默认设置，因此会阻止重定向到私有/内部目标。

## 支持的参数

Gemini 搜索支持 `query`、`freshness`、`date_after` 和 `date_before`。

`count` 会被接受以兼容共享的 `web_search`，但 Gemini grounding
仍会返回一个带引用的合成答案，而不是 N 条结果列表。

`freshness` 接受 `day`、`week`、`month`、`year`，以及共享快捷方式
`pd`、`pw`、`pm` 和 `py`。`day`/`pd` 会向 Gemini
查询添加近期性指令，而不是硬性的 24 小时范围。`week`、`month`、`year`，以及显式的
`date_after`/`date_before` 范围会设置 Gemini Google Search grounding 的
`timeRangeFilter`。不支持 `country`、`language` 和 `domain_filter`。

## 模型选择

默认模型是 `gemini-2.5-flash`（快速且经济高效）。任何支持 grounding 的 Gemini
模型都可以通过 `plugins.entries.google.config.webSearch.model` 使用。

## 基础 URL 覆盖

当 Gemini Web 搜索必须通过操作方代理或自定义的 Gemini 兼容端点路由时，设置
`plugins.entries.google.config.webSearch.baseUrl`。如果未设置，Gemini Web
搜索会复用 `models.providers.google.baseUrl`。普通的
`https://generativelanguage.googleapis.com` 值会规范化为
`https://generativelanguage.googleapis.com/v1beta`；自定义代理路径会在去除尾部斜杠后按提供值保留。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 结构化结果 + 内容提取

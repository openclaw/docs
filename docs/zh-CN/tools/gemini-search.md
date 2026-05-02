---
read_when:
    - 你想使用 Gemini 进行 web_search
    - 你需要一个 GEMINI_API_KEY
    - 你想要 Google Search 作为事实依据
summary: 基于 Google Search 依据增强的 Gemini 网页搜索
title: Gemini 搜索
x-i18n:
    generated_at: "2026-05-02T04:04:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e48b73a59f1af08cb1e30f149a18534dc76ba8dff26935d83fe8ccdaa8ab74e6
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支持带内置
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
的 Gemini 模型，它会返回由实时 Google Search 结果支持并带有引用的 AI 合成答案。

## 获取 API key

<Steps>
  <Step title="Create a key">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 并创建一个
    API key。
  </Step>
  <Step title="Store the key">
    在 Gateway 网关环境中设置 `GEMINI_API_KEY`，或通过以下方式配置：

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional proxy/base URL override
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

**环境替代方案：**在 Gateway 网关环境中设置 `GEMINI_API_KEY`。
对于 Gateway 网关安装，请将它放在 `~/.openclaw/.env` 中。

## 工作原理

不同于返回链接和摘要列表的传统搜索提供商，Gemini 使用 Google Search grounding 来生成带有内联引用的 AI 合成答案。结果同时包含合成答案和源
URL。

- 来自 Gemini grounding 的引用 URL 会自动从 Google
  重定向 URL 解析为直接 URL。
- 重定向解析会使用 SSRF 防护路径（HEAD + 重定向检查 +
  http/https 校验），然后返回最终引用 URL。
- 重定向解析使用严格的 SSRF 默认设置，因此指向
  私有/内部目标的重定向会被阻止。

## 支持的参数

Gemini 搜索支持 `query`、`freshness`、`date_after` 和 `date_before`。

`count` 可用于兼容共享的 `web_search`，但 Gemini grounding
仍会返回一个带引用的合成答案，而不是 N 条结果列表。

`freshness` 接受 `day`、`week`、`month`、`year`，以及共享快捷值
`pd`、`pw`、`pm` 和 `py`。OpenClaw 会将这些值，或显式的
`date_after`/`date_before` 范围，转换为 Gemini Google Search grounding 的
`timeRangeFilter`。不支持 `country`、`language` 和 `domain_filter`。

## 模型选择

默认模型是 `gemini-2.5-flash`（快速且成本效益高）。任何支持 grounding 的 Gemini
模型都可以通过 `plugins.entries.google.config.webSearch.model` 使用。

## Base URL 覆盖

当 Gemini Web 搜索必须通过运营方代理或自定义 Gemini 兼容端点路由时，请设置
`plugins.entries.google.config.webSearch.baseUrl`。普通的
`https://generativelanguage.googleapis.com` 值会被规范化为
`https://generativelanguage.googleapis.com/v1beta`；自定义代理路径会在去除末尾斜杠后按提供值保留。

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 结构化结果 + 内容提取

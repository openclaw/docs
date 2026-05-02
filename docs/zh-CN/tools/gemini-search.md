---
read_when:
    - 你想使用 Gemini 进行 web_search
    - 你需要一个 GEMINI_API_KEY
    - 你想要 Google Search grounding
summary: 使用 Google Search 作为依据的 Gemini 网页搜索
title: Gemini 搜索
x-i18n:
    generated_at: "2026-05-02T02:49:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e36382dc6a4f9a30f12025cc81bb7ed4999e56a236fc85ee7a37444674bf798
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支持带有内置
[Google Search 依据增强](https://ai.google.dev/gemini-api/docs/grounding)
的 Gemini 模型，它会返回由实时 Google Search 结果支持并附带引用的 AI 综合生成答案。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 并创建一个
    API 密钥。
  </Step>
  <Step title="存储密钥">
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
对于 gateway 安装，请将其放入 `~/.openclaw/.env`。

## 工作原理

与返回链接和摘要列表的传统搜索提供商不同，
Gemini 使用 Google Search 依据增强来生成带有
内联引用的 AI 综合答案。结果同时包含综合生成的答案和来源
URL。

- 来自 Gemini 依据增强的引用 URL 会自动从 Google
  重定向 URL 解析为直接 URL。
- 重定向解析使用 SSRF 防护路径（HEAD + 重定向检查 +
  http/https 验证），然后再返回最终引用 URL。
- 重定向解析使用严格的 SSRF 默认设置，因此会阻止重定向到
  私有/内部目标。

## 支持的参数

Gemini 搜索支持 `query`。

为兼容共享的 `web_search`，会接受 `count`，但 Gemini 依据增强
仍然返回一个带引用的综合生成答案，而不是 N 个结果的
列表。

不支持特定于提供商的过滤器，例如 `country`、`language`、`freshness` 和
`domain_filter`。

## 模型选择

默认模型是 `gemini-2.5-flash`（快速且成本效益高）。任何支持依据增强的 Gemini
模型都可以通过
`plugins.entries.google.config.webSearch.model` 使用。

## Base URL 覆盖

当 Gemini Web 搜索必须通过操作方代理或自定义的 Gemini 兼容端点路由时，设置 `plugins.entries.google.config.webSearch.baseUrl`。普通的 `https://generativelanguage.googleapis.com` 值会规范化为
`https://generativelanguage.googleapis.com/v1beta`；自定义代理路径会在去除末尾斜杠后按提供的形式保留。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity Search](/zh-CN/tools/perplexity-search) -- 结构化结果 + 内容提取

---
read_when:
    - 你想将 Gemini 用于 `web_search`
    - 你需要一个 `GEMINI_API_KEY`
    - 你想使用 Google 搜索 grounding
summary: 带有 Google 搜索 grounding 的 Gemini Web 搜索
title: Gemini 搜索
x-i18n:
    generated_at: "2026-04-05T10:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42644176baca6b4b041142541618f6f68361d410d6f425cc4104cd88d9f7c480
    source_path: tools/gemini-search.md
    workflow: 15
---

# Gemini 搜索

OpenClaw 支持带有内置
[Google 搜索 grounding](https://ai.google.dev/gemini-api/docs/grounding)
的 Gemini 模型，它会返回由实时 Google 搜索结果支持、带有引用的 AI 合成答案。

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

**环境变量替代方式：** 在 Gateway 网关环境中设置 `GEMINI_API_KEY`。
对于 Gateway 网关安装，请将其放在 `~/.openclaw/.env` 中。

## 工作原理

与返回链接和摘要列表的传统搜索提供商不同，
Gemini 使用 Google 搜索 grounding 生成带有内联引用的 AI 合成答案。
结果同时包含合成答案和源 URL。

- 来自 Gemini grounding 的引用 URL 会自动从 Google
  重定向 URL 解析为直接 URL。
- 在返回最终引用 URL 之前，重定向解析会先使用 SSRF 防护路径（HEAD + 重定向检查 +
  http/https 校验）。
- 重定向解析使用严格的 SSRF 默认设置，因此会阻止重定向到
  私有/内部目标。

## 支持的参数

Gemini 搜索支持 `query`。

为兼容共享 `web_search`，也接受 `count`，但 Gemini grounding
仍然返回一个带引用的合成答案，而不是 N 条结果
列表。

不支持提供商专用过滤器，例如 `country`、`language`、`freshness` 和
`domain_filter`。

## 模型选择

默认模型为 `gemini-2.5-flash`（速度快且成本效益高）。任何支持 grounding 的 Gemini
模型都可以通过
`plugins.entries.google.config.webSearch.model` 使用。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave 搜索](/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity 搜索](/tools/perplexity-search) -- 结构化结果 + 内容提取

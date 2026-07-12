---
read_when:
    - 你想使用 Gemini 进行 `web_search`
    - 你需要 `GEMINI_API_KEY` 或 `models.providers.google.apiKey`
    - 你想使用 Google 搜索依据功能
summary: 使用 Google 搜索依据的 Gemini 网页搜索
title: Gemini 搜索
x-i18n:
    generated_at: "2026-07-11T20:59:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支持内置
[Google 搜索溯源](https://ai.google.dev/gemini-api/docs/grounding)的 Gemini 模型，
它会返回由实时 Google 搜索结果支持并附带引用的 AI 综合答案。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 并创建一个
    API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `GEMINI_API_KEY`，复用
    `models.providers.google.apiKey`，或通过以下命令配置专用的网页搜索密钥：

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
            apiKey: "AIza...", // 如果已设置 GEMINI_API_KEY 或 models.providers.google.apiKey，则可选
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 可选；回退到 models.providers.google.baseUrl
            model: "gemini-2.5-flash", // 默认值
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

**凭据优先级：**Gemini 网页搜索首先使用
`plugins.entries.google.config.webSearch.apiKey`，然后是 `GEMINI_API_KEY`，
最后是 `models.providers.google.apiKey`。对于基础 URL，专用的
`plugins.entries.google.config.webSearch.baseUrl` 优先于
`models.providers.google.baseUrl`。

对于 Gateway 网关安装，请将环境密钥放入 `~/.openclaw/.env`。

## 工作原理

传统搜索提供商会返回链接和摘要列表，而 Gemini 使用 Google 搜索溯源
生成带有内联引用的 AI 综合答案。结果同时包含综合答案和来源
URL。

- Gemini 溯源返回的引用 URL 会通过 OpenClaw 受 SSRF 防护的
  获取路径发起 HEAD 请求，自动将 Google 重定向 URL 解析为直接 URL
  （跟随重定向并验证 http/https）。
- 重定向解析采用严格的 SSRF 默认设置，因此会阻止重定向到
  私有或内部目标。

## 支持的参数

Gemini 搜索支持 `query`、`freshness`、`date_after` 和 `date_before`。

为兼容共享的 `web_search`，也接受 `count`，但 Gemini 溯源仍会
返回一条带引用的综合答案，而不是包含 N 条结果的列表。

`freshness` 接受 `day`、`week`、`month`、`year`，以及共享的快捷值
`pd`、`pw`、`pm` 和 `py`。`day`/`pd` 会向 Gemini 查询添加近期性指令，
而不是设置严格的 24 小时时间范围。`week`、`month`、`year` 以及明确的
`date_after`/`date_before` 范围会设置 Gemini Google 搜索溯源的
`timeRangeFilter`。不支持 `country`、`language` 和 `domain_filter`。

## 模型选择

默认模型为 `gemini-2.5-flash`（速度快且经济高效）。可以通过
`plugins.entries.google.config.webSearch.model` 使用任何支持溯源的
Gemini 模型。

## 基础 URL 覆盖

当 Gemini 网页搜索必须通过运营方代理或自定义的 Gemini 兼容端点进行路由时，
请设置 `plugins.entries.google.config.webSearch.baseUrl`。如果未设置，
Gemini 网页搜索会复用 `models.providers.google.baseUrl`。普通的
`https://generativelanguage.googleapis.com` 值会被规范化为
`https://generativelanguage.googleapis.com/v1beta`；自定义代理路径在移除
末尾斜杠后会按原样保留。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave 搜索](/zh-CN/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity 搜索](/zh-CN/tools/perplexity-search) -- 结构化结果 + 内容提取

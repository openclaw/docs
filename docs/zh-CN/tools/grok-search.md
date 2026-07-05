---
read_when:
    - 你想使用 Grok 进行 web_search
    - 你想使用 xAI OAuth 或 XAI_API_KEY 进行 Web 搜索
summary: 通过 xAI 基于网页依据的响应进行 Grok 网页搜索
title: Grok 搜索
x-i18n:
    generated_at: "2026-07-05T11:44:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 基于网页检索的响应来生成由实时搜索结果和引文支撑的 AI 综合答案。

Grok Web 搜索会优先使用已有的 xAI OAuth 登录（如果可用）。如果不存在 OAuth 配置档案，同一个 xAI API key 也会驱动内置的 `x_search` 工具，用于 X（原 Twitter）帖子搜索，以及 `code_execution` 工具。将密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 还可以让 OpenClaw 将其作为内置 xAI 模型提供商的后备凭证复用。

对于帖子级 X 指标（转发、回复、书签、浏览量），请使用带有精确帖子 URL 或 status ID 的 [`x_search`](/zh-CN/tools/web#x_search)，而不是宽泛的搜索查询。

## 新手引导和配置

在 `openclaw onboard` 或 `openclaw configure --section
web` 期间选择 **Grok**，可让 OpenClaw 复用已有的 xAI OAuth 配置档案，而无需提示输入单独的 Web 搜索密钥。没有 OAuth 时，它会回退到 xAI API key 设置。

随后 OpenClaw 会提供一个后续步骤，使用同一个 xAI 凭证启用 `x_search`。该后续步骤：

- 仅在你为 `web_search` 选择 Grok 后出现
- 不是单独的顶层 Web 搜索提供商选项
- 可以选择在同一流程中设置 `x_search` 模型

跳过它后，可以稍后在配置中启用或更改 `x_search`。

## 登录或获取 API key

<Steps>
  <Step title="Use xAI OAuth">
    如果你已经在新手引导或模型认证期间使用 xAI 登录，请选择 Grok 作为 `web_search` 提供商。不需要单独的 API key：

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    当 OAuth 不可用，或你有意使用基于密钥的 Web 搜索配置时，请从 [xAI](https://console.x.ai/) 获取 API key。
  </Step>
  <Step title="Store the key">
    在 Gateway 网关环境中设置 `XAI_API_KEY`，或通过以下方式配置：

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**凭证替代方案：**`openclaw models auth login --provider xai
--method oauth`、Gateway 网关环境中的 `XAI_API_KEY`，或
`plugins.entries.xai.config.webSearch.apiKey`。对于 Gateway 网关安装，请将环境变量放入 `~/.openclaw/.env`。

## 工作原理

Grok 使用 xAI 基于网页检索的响应来综合带有内联引文的答案，类似于 Gemini 的 Google Search grounding 方法。

## 支持的参数

Grok 搜索支持 `query`。为兼容共享的 `web_search`，也接受 `count`，但 Grok 始终返回一个带引文的综合答案，而不是 N 条结果列表。不支持提供商特定的过滤器。

Grok 默认使用 60 秒超时，因为 xAI Responses 基于网页检索的搜索可能比共享的 `web_search` 默认值运行更久。可使用 `tools.web.search.timeoutSeconds` 覆盖该设置。

## 基础 URL 覆盖

设置 `plugins.entries.xai.config.webSearch.baseUrl`，可将 Grok Web 搜索路由到操作员代理或兼容 xAI 的 Responses 端点。OpenClaw 会在修剪尾随斜杠后向 `<baseUrl>/responses` 发送请求。除非设置了 `plugins.entries.xai.config.xSearch.baseUrl`，否则 `x_search` 会回退到同一个 `webSearch.baseUrl`。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web Search 中的 x_search](/zh-CN/tools/web#x_search) -- 通过 xAI 提供一等 X 搜索
- [Gemini Search](/zh-CN/tools/gemini-search) -- 通过 Google grounding 生成 AI 综合答案

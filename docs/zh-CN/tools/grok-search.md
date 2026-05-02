---
read_when:
    - 你想使用 Grok 进行 web_search
    - 你需要 XAI_API_KEY 才能进行网页搜索
summary: 通过 xAI 基于 Web 事实的响应进行 Grok Web 搜索
title: Grok 搜索
x-i18n:
    generated_at: "2026-05-02T02:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 基于网页依据的响应生成由实时搜索结果支持并带有引用的 AI 合成答案。

同一个 `XAI_API_KEY` 也可以为内置的 `x_search` 工具提供支持，用于 X（原 Twitter）帖子搜索。如果你将密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 现在也会将它作为内置 xAI 模型提供商的备用密钥复用。

对于帖子级 X 指标，例如转发、回复、书签或浏览量，请优先使用带有确切帖子 URL 或 status ID 的 `x_search`，而不是宽泛的搜索查询。

## 新手引导和配置

如果你在以下过程中选择 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以显示一个单独的后续步骤，使用同一个 `XAI_API_KEY` 启用 `x_search`。该后续步骤：

- 只会在你为 `web_search` 选择 Grok 后出现
- 不是单独的顶层网页搜索提供商选项
- 可以在同一流程中选择性设置 `x_search` 模型

如果你跳过它，可以稍后在配置中启用或更改 `x_search`。

## 获取 API key

<Steps>
  <Step title="创建密钥">
    从 [xAI](https://console.x.ai/) 获取 API key。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `XAI_API_KEY`，或通过以下命令配置：

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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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

**环境替代方式：**在 Gateway 网关环境中设置 `XAI_API_KEY`。
对于 Gateway 网关安装，请将它放在 `~/.openclaw/.env` 中。

## 工作原理

Grok 使用 xAI 基于网页依据的响应生成带有内联引用的答案，类似于 Gemini 的 Google Search grounding 方法。

## 支持的参数

Grok 搜索支持 `query`。

`count` 会被接受，以兼容共享的 `web_search`，但 Grok 仍会返回一个带有引用的合成答案，而不是 N 条结果列表。

目前不支持提供商特定的过滤器。

Grok 使用提供商特定的 60 秒默认超时，因为 xAI Responses 基于网页依据的搜索可能比共享的 `web_search` 默认值运行更久。设置 `tools.web.search.timeoutSeconds` 可以覆盖它。

## Base URL 覆盖

当 Grok 网页搜索应通过操作员代理或 xAI 兼容的 Responses 端点路由时，设置 `plugins.entries.xai.config.webSearch.baseUrl`。OpenClaw 会在去除尾随斜杠后向 `<baseUrl>/responses` 发送请求。除非设置了 `plugins.entries.xai.config.xSearch.baseUrl`，否则 `x_search` 使用同一个 `webSearch.baseUrl` 作为备用值。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web Search 中的 x_search](/zh-CN/tools/web#x_search) -- 通过 xAI 实现的一等 X 搜索
- [Gemini Search](/zh-CN/tools/gemini-search) -- 通过 Google grounding 生成的 AI 合成答案

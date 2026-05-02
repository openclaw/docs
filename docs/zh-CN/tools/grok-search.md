---
read_when:
    - 你想使用 Grok 进行 web_search
    - 你需要 XAI_API_KEY 才能进行网页搜索
summary: 通过 xAI 基于网页检索的响应实现 Grok 网页搜索
title: Grok 搜索
x-i18n:
    generated_at: "2026-05-02T01:59:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab38ee8614ba4bab9a3bf91cb14d4565f1766513594fd2d1a280ff4b2fed1478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 基于网页的响应来生成由实时搜索结果和引用支撑的 AI 综合回答。

同一个 `XAI_API_KEY` 也可以为内置的 `x_search` 工具提供支持，用于搜索 X（前身为 Twitter）帖子。如果你将 key 存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 现在也会将它作为内置 xAI 模型提供商的备用值复用。

对于帖子级 X 指标，例如转帖、回复、书签或浏览量，优先使用带有确切帖子 URL 或状态 ID 的 `x_search`，而不是宽泛的搜索查询。

## 新手引导和配置

如果你在以下流程中选择 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以显示一个单独的后续步骤，用同一个 `XAI_API_KEY` 启用 `x_search`。该后续步骤：

- 只会在你为 `web_search` 选择 Grok 后出现
- 不是单独的顶层网页搜索提供商选项
- 可以在同一流程中选择性设置 `x_search` 模型

如果你跳过它，可以稍后在配置中启用或更改 `x_search`。

## 获取 API key

<Steps>
  <Step title="创建 key">
    从 [xAI](https://console.x.ai/) 获取 API key。
  </Step>
  <Step title="存储 key">
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

**环境替代方案：**在 Gateway 网关环境中设置 `XAI_API_KEY`。
对于 Gateway 网关安装，将它放在 `~/.openclaw/.env` 中。

## 工作原理

Grok 使用 xAI 基于网页的响应来综合带有行内引用的回答，类似于 Gemini 的 Google 搜索 grounding 方法。

## 支持的参数

Grok 搜索支持 `query`。

`count` 会被接受，以兼容共享的 `web_search`，但 Grok 仍会返回一个带引用的综合回答，而不是 N 条结果列表。

目前不支持提供商特定的过滤器。

Grok 使用提供商特定的 60 秒默认超时时间，因为 xAI Responses 基于网页的搜索可能比共享的 `web_search` 默认时间运行更久。设置 `tools.web.search.timeoutSeconds` 可覆盖它。

## 相关内容

- [网页搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [网页搜索中的 x_search](/zh-CN/tools/web#x_search) -- 通过 xAI 提供一等 X 搜索
- [Gemini 搜索](/zh-CN/tools/gemini-search) -- 通过 Google grounding 提供 AI 综合回答

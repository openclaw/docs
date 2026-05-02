---
read_when:
    - 你想使用 Kimi 进行 web_search
    - 你需要 KIMI_API_KEY 或 MOONSHOT_API_KEY
summary: 通过 Moonshot 网页搜索使用 Kimi 网页搜索
title: Kimi 搜索
x-i18n:
    generated_at: "2026-05-02T06:10:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw 支持将 Kimi 作为 `web_search` 提供商，使用 Moonshot Web 搜索生成带引用的 AI 合成答案。

## 获取 API key

<Steps>
  <Step title="创建密钥">
    从 [Moonshot AI](https://platform.moonshot.cn/) 获取 API key。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，或通过以下命令配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，OpenClaw 还可以询问：

- Moonshot API 区域：
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 默认的 Kimi Web 搜索模型（默认为 `kimi-k2.6`）

## 配置

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

如果你为聊天使用中国 API 主机（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`），当省略 `tools.web.search.kimi.baseUrl` 时，OpenClaw 会为 Kimi `web_search` 复用同一个主机，因此来自 [platform.moonshot.cn](https://platform.moonshot.cn/) 的密钥不会误打到国际端点（通常会返回 HTTP 401）。当你需要不同的搜索基础 URL 时，请用 `tools.web.search.kimi.baseUrl` 覆盖。

**环境变量替代方案：**在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。对于 Gateway 网关安装，请将它放入 `~/.openclaw/.env`。

如果省略 `baseUrl`，OpenClaw 默认使用 `https://api.moonshot.ai/v1`。
如果省略 `model`，OpenClaw 默认使用 `kimi-k2.6`。

## 工作原理

Kimi 使用 Moonshot Web 搜索生成带内联引用的答案，类似于 Gemini 和 Grok 的基于依据的响应方式。

只有在 Moonshot 返回原生 Web 搜索依据证据后，OpenClaw 才会将 Kimi `web_search` 视为成功，例如可重放的 `$web_search` 工具负载、`search_results` 或引用 URL。如果 Kimi 立即停止，并给出类似 “I cannot browse the internet” 的普通聊天答案且没有依据证据，OpenClaw 会返回结构化的 `kimi_web_search_ungrounded` 错误，而不是将该文本包装为搜索结果。请重试查询，切换到 Brave 等结构化提供商，或者在你已有目标 URL 时使用 `web_fetch` / 浏览器工具。

## 支持的参数

Kimi 搜索支持 `query`。

为了兼容共享的 `web_search`，会接受 `count`，但 Kimi 仍会返回一个带引用的合成答案，而不是 N 条结果列表。

目前不支持提供商特定的过滤器。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Moonshot AI](/zh-CN/providers/moonshot) -- Moonshot 模型 + Kimi Coding 提供商文档
- [Gemini Search](/zh-CN/tools/gemini-search) -- 通过 Google grounding 生成的 AI 合成答案
- [Grok Search](/zh-CN/tools/grok-search) -- 通过 xAI grounding 生成的 AI 合成答案

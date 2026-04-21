---
read_when:
    - 你想使用 Kimi 进行 `web_search`
    - 你需要 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
summary: 通过 Moonshot 网页搜索进行 Kimi 网页搜索
title: Kimi 搜索
x-i18n:
    generated_at: "2026-04-21T01:06:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi 搜索

OpenClaw 支持将 Kimi 用作 `web_search` 提供商，使用 Moonshot 网页搜索生成带引用的 AI 综合答案。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    从 [Moonshot AI](https://platform.moonshot.cn/) 获取 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，OpenClaw 还可能会询问：

- Moonshot API 区域：
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 默认的 Kimi 网页搜索模型（默认为 `kimi-k2.6`）

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

如果你为聊天使用中国 API 主机（`models.providers.moonshot.baseUrl`：
`https://api.moonshot.cn/v1`），当省略 `tools.web.search.kimi.baseUrl` 时，OpenClaw 会为 Kimi `web_search` 复用同一个主机，因此来自 [platform.moonshot.cn](https://platform.moonshot.cn/) 的密钥不会误打到国际端点（这通常会返回 HTTP 401）。当你需要不同的搜索基础 URL 时，可使用 `tools.web.search.kimi.baseUrl` 覆盖。

**环境变量替代方式：** 在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。对于 gateway 安装，请将其放在 `~/.openclaw/.env` 中。

如果你省略 `baseUrl`，OpenClaw 默认使用 `https://api.moonshot.ai/v1`。
如果你省略 `model`，OpenClaw 默认使用 `kimi-k2.6`。

## 工作原理

Kimi 使用 Moonshot 网页搜索生成带有内联引用的综合答案，类似于 Gemini 和 Grok 的 grounded response 方法。

## 支持的参数

Kimi 搜索支持 `query`。

出于共享 `web_search` 兼容性考虑，也接受 `count`，但 Kimi 仍会返回一个带引用的综合答案，而不是 N 条结果列表。

目前暂不支持提供商特定过滤器。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Moonshot AI](/zh-CN/providers/moonshot) -- Moonshot 模型 + Kimi Coding 提供商文档
- [Gemini Search](/zh-CN/tools/gemini-search) -- 通过 Google grounding 生成 AI 综合答案
- [Grok Search](/zh-CN/tools/grok-search) -- 通过 xAI grounding 生成 AI 综合答案

---
read_when:
    - 你想使用 Kimi 进行 web_search
    - 你需要 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
summary: 通过 Moonshot Web 搜索使用 Kimi Web 搜索
title: Kimi 搜索
x-i18n:
    generated_at: "2026-07-05T11:45:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi 是一个由 Moonshot 原生 Web 搜索支持的 `web_search` 提供商。Moonshot 会合成一个带行内引用的答案，类似 Gemini 和 Grok 的有依据响应提供商，而不是返回排序后的结果列表。

## 设置

<Steps>
  <Step title="创建密钥">
    从 [Moonshot AI](https://platform.moonshot.cn/) 获取 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`（对于 Gateway 网关安装，将其添加到 `~/.openclaw/.env`），或通过以下方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 还会提示输入：

- Moonshot API 区域：`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`
- Web 搜索模型（默认为 `kimi-k2.6`）

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

省略 `tools.web.search.provider` 时，会根据可用的 API 密钥自动检测；如果配置了多个搜索凭证，请将其显式设置为 `kimi`。

`tools.web.search.kimi` 下的等效作用域形式（`apiKey`、`baseUrl`、`model`）也可使用；两种形状都会合并到同一个解析后的配置中。

默认值：省略时，`baseUrl` 默认为 `https://api.moonshot.ai/v1`，`model` 默认为 `kimi-k2.6`。

如果聊天流量使用中国主机（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`），当 Kimi `web_search` 未设置自己的 `baseUrl` 时，会自动复用该主机，因此 `.cn` 密钥不会意外请求国际端点（该端点会对这些密钥返回 HTTP 401）。设置显式的 Kimi `baseUrl` 可覆盖此继承行为。

## 依据要求

OpenClaw 只有在 Moonshot 的响应包含原生 Web 搜索依据证据后，才会返回 Kimi `web_search` 结果，例如 `$web_search` 工具调用回放、`search_results` 或引用 URL。如果 Kimi 直接回答且没有依据（例如 “I cannot browse the internet”），OpenClaw 会返回 `kimi_web_search_ungrounded` 错误，而不是将该文本视为搜索结果。请重试查询，切换到结构化提供商（如 Brave），或在你已经有目标 URL 时使用 `web_fetch` / 浏览器工具。

## 工具参数

| 参数                                                            | 支持                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | 是                                                                                                                       |
| `count`                                                         | 为跨提供商兼容性而接受，但会被忽略：Kimi 始终返回一个合成答案，而不是 N 条结果列表                                      |
| `country`, `language`, `freshness`, `date_after`, `date_before` | 否                                                                                                                       |

## 相关

- [Web 搜索概览](/zh-CN/tools/web) - 所有提供商和自动检测
- [Moonshot AI](/zh-CN/providers/moonshot) - Moonshot 模型 + Kimi Coding 提供商文档
- [Gemini 搜索](/zh-CN/tools/gemini-search) - 通过 Google 依据生成的 AI 合成答案
- [Grok 搜索](/zh-CN/tools/grok-search) - 通过 xAI 依据生成的 AI 合成答案

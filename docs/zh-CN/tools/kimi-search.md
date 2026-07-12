---
read_when:
    - 你想使用 Kimi 进行 `web_search`
    - 你需要 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
summary: 通过 Moonshot Web 搜索使用 Kimi Web 搜索
title: Kimi 搜索
x-i18n:
    generated_at: "2026-07-11T21:01:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi 是由 Moonshot 原生网络搜索支持的 `web_search` 提供商。与 Gemini 和 Grok 的有依据响应提供商类似，Moonshot 会综合生成一个带有行内引用的答案，而不是返回按排名排列的结果列表。

## 设置

<Steps>
  <Step title="创建密钥">
    从 [Moonshot AI](https://platform.moonshot.cn/) 获取 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 网关环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`（对于 Gateway 网关安装，请将其添加到 `~/.openclaw/.env`），或通过以下命令配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，还会提示输入：

- Moonshot API 区域：`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`
- 网络搜索模型（默认为 `kimi-k2.6`）

## 配置

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 如果已设置 KIMI_API_KEY 或 MOONSHOT_API_KEY，则可选
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

省略 `tools.web.search.provider` 时，会根据可用的 API 密钥自动检测；如果配置了多个搜索凭据，请将其显式设置为 `kimi`。

`tools.web.search.kimi` 下的等效作用域形式（`apiKey`、`baseUrl`、`model`）也可使用；两种形式会合并为同一个解析后的配置。

默认值：省略 `baseUrl` 时默认为 `https://api.moonshot.ai/v1`，`model` 默认为 `kimi-k2.6`。

如果聊天流量使用中国区主机（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`），且 Kimi `web_search` 未设置自己的 `baseUrl`，则会自动复用该主机，以免 `.cn` 密钥意外访问国际端点（该端点会对这些密钥返回 HTTP 401）。设置显式的 Kimi `baseUrl` 可覆盖此继承行为。

## 依据要求

只有在 Moonshot 的响应包含原生网络搜索依据证据（例如 `$web_search` 工具调用重放、`search_results` 或引用 URL）后，OpenClaw 才会返回 Kimi `web_search` 结果。如果 Kimi 在没有依据的情况下直接回答（例如“我无法浏览互联网”），OpenClaw 会返回 `kimi_web_search_ungrounded` 错误，而不会将该文本视为搜索结果。请重试查询、切换到 Brave 等结构化提供商，或者在已有目标 URL 时使用 `web_fetch` / 浏览器工具。

## 工具参数

| 参数                                                            | 支持情况                                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `query`                                                         | 是                                                                                                        |
| `count`                                                         | 为实现跨提供商兼容而接受，但会被忽略：Kimi 始终返回一个综合答案，而不是包含 N 个结果的列表                 |
| `country`, `language`, `freshness`, `date_after`, `date_before` | 否                                                                                                        |

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) - 所有提供商和自动检测
- [Moonshot AI](/zh-CN/providers/moonshot) - Moonshot 模型和 Kimi Coding 提供商文档
- [Gemini 搜索](/zh-CN/tools/gemini-search) - 通过 Google 依据生成的 AI 综合答案
- [Grok 搜索](/zh-CN/tools/grok-search) - 通过 xAI 依据生成的 AI 综合答案

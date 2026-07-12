---
read_when:
    - 你想要一个无需 API key 的 Web 搜索提供商
    - 你想使用 DuckDuckGo 进行 `web_search`
    - 你希望使用一个明确选择的、无需密钥的搜索提供商
summary: DuckDuckGo Web 搜索——无需密钥的提供商（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-07-11T21:00:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支持将 DuckDuckGo 用作**无需密钥**的 `web_search` 提供商。不需要 API key 或账户。

<Warning>
  DuckDuckGo 是一项**实验性、非官方**集成，它会抓取 DuckDuckGo 的非 JavaScript HTML 搜索页面，而非使用官方 API。机器人验证页面或 HTML 变更可能导致偶发故障。
</Warning>

## 设置

DuckDuckGo 绝不会被自动选择，因为自动检测仅考虑具有可用凭据的提供商。请显式设置：

<Steps>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # 选择 "duckduckgo" 作为提供商
    ```
  </Step>
</Steps>

## 配置

直接在配置中设置提供商：

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

可选的插件级区域和安全搜索设置：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo 区域代码
            safeSearch: "moderate", // "strict"、"moderate" 或 "off"
          },
        },
      },
    },
  },
}
```

## 工具参数

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
要返回的结果数（1-10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 区域代码（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
安全搜索级别。
</ParamField>

`region` 和 `safeSearch` 工具参数会按查询覆盖上述插件配置值。

## 注意事项

- **无需 API key**——选择 DuckDuckGo 作为 `web_search` 提供商后即可使用。
- **实验性**——抓取 DuckDuckGo 的非 JavaScript HTML 搜索页面，而非使用官方 API 或 SDK。结果依赖页面结构，后者可能随时更改，恕不另行通知。
- **机器人验证风险**——大量使用或自动化使用时，DuckDuckGo 可能提供 CAPTCHA 或阻止请求。
- **仅限显式选择**——OpenClaw 的自动检测仅考虑具有可用凭据的提供商，因此绝不会自动选择 DuckDuckGo 这类无需密钥的提供商；你必须设置 `provider: "duckduckgo"`。
- 未配置时，**安全搜索默认为 `moderate`**。

<Tip>
  对于生产用途，请考虑使用 [Brave Search](/zh-CN/tools/brave-search)（提供免费套餐）或其他由 API 支持的提供商。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web)——所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search)——提供免费套餐的结构化结果
- [Exa Search](/zh-CN/tools/exa-search)——支持内容提取的神经搜索

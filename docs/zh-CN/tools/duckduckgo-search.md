---
read_when:
    - 你需要一个不需要 API key 的 Web 搜索提供商
    - 你想使用 DuckDuckGo 进行 web_search
    - 你需要一个显式选择的免密钥搜索提供商
summary: DuckDuckGo Web 搜索 -- 免密钥提供商（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-07-05T11:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支持将 DuckDuckGo 作为**免密钥** `web_search` 提供商。无需 API key 或账号。

<Warning>
  DuckDuckGo 是一个**实验性的非官方**集成，会抓取 DuckDuckGo 的非 JavaScript HTML 搜索页面，而不是官方 API。预计偶尔会因机器人验证页面或 HTML 变更而损坏。
</Warning>

## 设置

DuckDuckGo 永远不会被自动选择，因为自动检测只会考虑具备可用凭证的提供商。请显式设置它：

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

区域和 SafeSearch 的可选插件级设置：

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
SafeSearch 级别。
</ParamField>

`region` 和 `safeSearch` 工具参数会按查询覆盖上方的插件配置值。

## 说明

- **无需 API key** —— 选择 DuckDuckGo 作为 `web_search` 提供商后即可使用。
- **实验性** —— 抓取 DuckDuckGo 的非 JavaScript HTML 搜索页面，而不是官方 API 或 SDK。结果取决于页面结构，页面结构可能在不通知的情况下变化。
- **机器人验证风险** —— DuckDuckGo 可能会在高频或自动化使用时提供 CAPTCHA 或阻止请求。
- **仅支持显式选择** —— OpenClaw 的自动检测只会考虑具备可用凭证的提供商，因此像 DuckDuckGo 这样的免密钥提供商永远不会被自动选择；你必须设置 `provider: "duckduckgo"`。
- **未配置时，SafeSearch 默认为 `moderate`**。

<Tip>
  生产环境使用时，请考虑 [Brave Search](/zh-CN/tools/brave-search)（提供免费套餐）或其他 API 支持的提供商。
</Tip>

## 相关

- [Web Search 概览](/zh-CN/tools/web) —— 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) —— 提供免费套餐的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) —— 支持内容提取的神经搜索

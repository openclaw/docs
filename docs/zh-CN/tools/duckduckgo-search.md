---
read_when:
    - 你想要一个无需 API key 的 Web 搜索提供商
    - 你想使用 DuckDuckGo 进行 web_search
    - 你想要一个显式选择的免密钥搜索提供商
summary: DuckDuckGo Web 搜索 -- 无需密钥的提供商（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-06-27T03:26:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支持 DuckDuckGo 作为**无需密钥**的 `web_search` 提供商。无需 API
密钥或账户。

<Warning>
  DuckDuckGo 是一个**实验性、非官方**集成，它从 DuckDuckGo 的非 JavaScript 搜索页面拉取结果，
  而不是使用官方 API。请预期机器人挑战页面或 HTML 变更可能偶尔导致故障。
</Warning>

## 设置

不需要 API 密钥，只需将 DuckDuckGo 设置为你的提供商：

<Steps>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## 配置

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

用于区域和 SafeSearch 的可选插件级设置：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
要返回的结果数量（1-10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 区域代码（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 级别。
</ParamField>

区域和 SafeSearch 也可以在插件配置中设置（见上文）；工具参数会按查询覆盖配置值。

## 说明

- **无 API 密钥** - 选择 DuckDuckGo 作为你的 `web_search` 提供商后即可使用
- **实验性** - 从 DuckDuckGo 的非 JavaScript HTML 搜索页面收集结果，而不是使用官方 API 或 SDK
- **机器人挑战风险** - 在高频或自动化使用下，DuckDuckGo 可能会提供 CAPTCHA 或阻止请求
- **HTML 解析** - 结果依赖页面结构，而页面结构可能在不通知的情况下变化
- **显式选择** - 当未配置由 API 支持的提供商时，OpenClaw 不会自动选择 DuckDuckGo
- **未配置时，SafeSearch 默认为 moderate**

<Tip>
  对于生产使用，请考虑 [Brave Search](/zh-CN/tools/brave-search)（提供免费套餐）或其他由 API 支持的提供商。
</Tip>

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 提供免费套餐的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索

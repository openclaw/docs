---
read_when:
    - 你想要一个不需要 API key 的 Web 搜索提供商
    - 你想使用 DuckDuckGo 进行 web_search
    - 你需要一个零配置搜索回退方案
summary: DuckDuckGo Web 搜索 -- 无需密钥的备用提供商（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-05-06T01:53:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支持将 DuckDuckGo 作为**无需密钥**的 `web_search` 提供商。无需 API
密钥或账户。

<Warning>
  DuckDuckGo 是一个**实验性、非官方**集成，它从 DuckDuckGo 的非 JavaScript 搜索页面拉取结果，而不是官方 API。可能会
  因机器人验证页面或 HTML 变更而偶尔中断。
</Warning>

## 设置

无需 API 密钥，只需将 DuckDuckGo 设置为你的提供商：

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
要返回的结果数（1-10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 区域代码（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 级别。
</ParamField>

区域和 SafeSearch 也可以在插件配置中设置（见上文），工具
参数会按每个查询覆盖配置值。

## 备注

- **无需 API 密钥** - 开箱即用，零配置
- **实验性** - 从 DuckDuckGo 的非 JavaScript HTML
  搜索页面收集结果，而不是官方 API 或 SDK
- **机器人验证风险** - 在高频或自动化使用下，DuckDuckGo 可能会提供 CAPTCHA 或阻止请求
- **HTML 解析** - 结果依赖页面结构，而页面结构可能会在未通知的情况下更改
- **自动检测顺序** - DuckDuckGo 是第一个无需密钥的回退项
  （顺序 100）。已配置密钥的 API 后端提供商会先运行，
  然后是 Ollama Web 搜索（顺序 110），再然后是 SearXNG（顺序 200）
- **未配置时 SafeSearch 默认为 moderate**

<Tip>
  生产使用时，建议考虑 [Brave Search](/zh-CN/tools/brave-search)（提供免费层级）
  或其他 API 后端提供商。
</Tip>

## 相关

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave Search](/zh-CN/tools/brave-search) -- 提供免费层级的结构化结果
- [Exa Search](/zh-CN/tools/exa-search) -- 带内容提取的神经搜索

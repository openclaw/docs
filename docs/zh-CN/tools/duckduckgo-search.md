---
read_when:
    - 你想使用一个无需 API 密钥的 Web 搜索提供商
    - 你想将 DuckDuckGo 用于 web_search
    - 你需要一个零配置的搜索回退方案
summary: DuckDuckGo Web 搜索——免密钥回退提供商（实验性，基于 HTML）
title: DuckDuckGo 搜索
x-i18n:
    generated_at: "2026-04-05T10:10:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# DuckDuckGo 搜索

OpenClaw 支持将 DuckDuckGo 用作**免密钥**的 `web_search` 提供商。不需要 API 密钥或账号。

<Warning>
  DuckDuckGo 是一种**实验性、非官方**集成，它从 DuckDuckGo 的非 JavaScript 搜索页面提取结果——而不是官方 API。你应预期它偶尔会因机器人挑战页面或 HTML 变更而失效。
</Warning>

## 设置

无需 API 密钥——只需将 DuckDuckGo 设置为你的提供商：

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

| 参数 | 说明 |
| ------------ | ---------------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 返回结果数量（1-10，默认：5） |
| `region` | DuckDuckGo 区域代码（例如 `us-en`、`uk-en`、`de-de`） |
| `safeSearch` | SafeSearch 级别：`strict`、`moderate`（默认）或 `off` |

区域和 SafeSearch 也可以在插件配置中设置（见上文）——工具参数会按每次查询覆盖配置值。

## 说明

- **无需 API 密钥**——开箱即用，零配置
- **实验性**——从 DuckDuckGo 的非 JavaScript HTML 搜索页面收集结果，而不是官方 API 或 SDK
- **机器人挑战风险**——在高频或自动化使用下，DuckDuckGo 可能会返回 CAPTCHA 或阻止请求
- **HTML 解析**——结果依赖页面结构，而页面结构可能会在没有通知的情况下变更
- **自动检测顺序**——DuckDuckGo 是自动检测中的第一个免密钥回退项（顺序 100）。已配置密钥的 API 支持提供商会先运行，然后是 Ollama Web 搜索（顺序 110），再然后是 SearXNG（顺序 200）
- **在未配置时，SafeSearch 默认为 moderate**

<Tip>
  对于生产环境使用，请考虑 [Brave 搜索](/tools/brave-search)（提供免费层级）或其他有 API 支持的提供商。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Brave 搜索](/tools/brave-search) -- 具有免费层级的结构化结果
- [Exa 搜索](/tools/exa-search) -- 带内容提取的神经搜索

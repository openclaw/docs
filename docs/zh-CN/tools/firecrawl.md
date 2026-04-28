---
read_when:
- 你想使用 Firecrawl 支持的网页提取
- 你需要一个 Firecrawl API key
- 你想将 Firecrawl 用作 `web_search` 提供商
- 你想为 `web_fetch` 使用反机器人提取能力
summary: Firecrawl 搜索、抓取和 `web_fetch` 回退机制
title: Firecrawl
x-i18n:
  generated_at: '2026-04-23T21:08:11Z'
  model: gpt-5.4
  provider: openai
  source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
  source_path: tools/firecrawl.md
  workflow: 15
---
OpenClaw 可以通过三种方式使用 **Firecrawl**：

- 作为 `web_search` 提供商
- 作为显式插件工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作为 `web_fetch` 的回退提取器

它是一个托管的提取 / 搜索服务，支持绕过机器人防护和缓存，
这有助于处理 JS 较重的网站，或那些会拦截普通 HTTP 抓取的页面。

## 获取 API key

1. 创建一个 Firecrawl 账户并生成 API key。
2. 将其存储到配置中，或在 Gateway 网关环境中设置 `FIRECRAWL_API_KEY`。

## 配置 Firecrawl 搜索

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

说明：

- 在新手引导中选择 Firecrawl，或运行 `openclaw configure --section web` 时选择它，会自动启用内置 Firecrawl 插件。
- 使用 Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 对于 Firecrawl 专用控制项，如 `sources`、`categories` 或结果抓取，请使用 `firecrawl_search`。
- `baseUrl` 覆盖必须保持为 `https://api.firecrawl.dev`。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜索和抓取 base URL 的共享环境变量回退值。

## 配置 Firecrawl 抓取 + `web_fetch` 回退

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

说明：

- 只有在 API key 可用时（`plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`），才会尝试 Firecrawl 回退。
- `maxAgeMs` 控制缓存结果允许的最大陈旧时间（毫秒）。默认值为 2 天。
- 旧版 `tools.web.fetch.firecrawl.*` 配置可通过 `openclaw doctor --fix` 自动迁移。
- Firecrawl scrape / base URL 覆盖仅限于 `https://api.firecrawl.dev`。

`firecrawl_scrape` 会复用相同的 `plugins.entries.firecrawl.config.webFetch.*` 设置和环境变量。

## Firecrawl 插件工具

### `firecrawl_search`

如果你想使用 Firecrawl 专用搜索控制项，而不是通用 `web_search`，请使用这个工具。

核心参数：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

对于 JS 较重或带机器人防护的页面，如果普通 `web_fetch` 效果较弱，请使用这个工具。

核心参数：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隐匿 / 反机器人绕过

Firecrawl 暴露了一个用于绕过机器人防护的**代理模式**参数（`basic`、`stealth` 或 `auto`）。
OpenClaw 对 Firecrawl 请求始终使用 `proxy: "auto"` 加上 `storeInCache: true`。
如果省略 `proxy`，Firecrawl 默认使用 `auto`。当基础尝试失败时，`auto` 会重试 stealth 代理，这可能会比仅使用 basic 抓取消耗更多积分。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 的提取顺序：

1. Readability（本地）
2. Firecrawl（如果被选中，或被自动检测为当前活动的 web-fetch 回退提供商）
3. 基本 HTML 清理（最后回退）

选择开关是 `tools.web.fetch.provider`。如果省略它，OpenClaw
会根据可用凭证自动检测第一个就绪的 web-fetch 提供商。
目前内置提供商是 Firecrawl。

## 相关内容

- [网页搜索概览](/zh-CN/tools/web) —— 所有提供商与自动检测
- [Web Fetch](/zh-CN/tools/web-fetch) —— 带 Firecrawl 回退的 `web_fetch` 工具
- [Tavily](/zh-CN/tools/tavily) —— 搜索 + 提取工具

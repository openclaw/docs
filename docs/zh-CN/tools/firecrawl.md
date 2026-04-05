---
read_when:
    - 你想使用由 Firecrawl 支持的 Web 内容提取
    - 你需要 Firecrawl API 密钥
    - 你想将 Firecrawl 用作 `web_search` 提供商
    - 你想为 `web_fetch` 使用反机器人提取
summary: Firecrawl 搜索、抓取和 `web_fetch` 回退
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T10:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw 可以通过三种方式使用 **Firecrawl**：

- 作为 `web_search` 提供商
- 作为显式插件工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作为 `web_fetch` 的回退提取器

它是一项托管式提取/搜索服务，支持机器人绕过和缓存，
这对于 JS 较重的网站或会阻止普通 HTTP 抓取的页面很有帮助。

## 获取 API 密钥

1. 创建一个 Firecrawl 账户并生成 API 密钥。
2. 将其存储在配置中，或在 gateway 环境中设置 `FIRECRAWL_API_KEY`。

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

- 在新手引导中选择 Firecrawl，或运行 `openclaw configure --section web` 选择它时，会自动启用内置 Firecrawl 插件。
- 搭配 Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 如需 Firecrawl 专属控制项，例如 `sources`、`categories` 或结果抓取，请使用 `firecrawl_search`。
- `baseUrl` 覆盖值必须保持为 `https://api.firecrawl.dev`。
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

- 只有在 API 密钥可用时（`plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`），才会尝试 Firecrawl 回退。
- `maxAgeMs` 控制缓存结果允许的最大陈旧时间（毫秒）。默认值为 2 天。
- 旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。
- Firecrawl 抓取/base URL 覆盖值仅限于 `https://api.firecrawl.dev`。

`firecrawl_scrape` 会复用相同的 `plugins.entries.firecrawl.config.webFetch.*` 设置和环境变量。

## Firecrawl 插件工具

### `firecrawl_search`

当你希望使用 Firecrawl 专属搜索控制，而不是通用 `web_search` 时，请使用此工具。

核心参数：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

对于 JS 较重或受机器人防护的页面，而普通 `web_fetch` 效果较弱时，请使用此工具。

核心参数：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隐身 / 机器人绕过

Firecrawl 提供了一个用于绕过机器人的**代理模式**参数（`basic`、`stealth` 或 `auto`）。
OpenClaw 对 Firecrawl 请求始终使用 `proxy: "auto"` 加 `storeInCache: true`。
如果省略 `proxy`，Firecrawl 默认使用 `auto`。`auto` 会在基础尝试失败时使用 stealth 代理重试，这可能比仅使用 basic 抓取
消耗更多额度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 的提取顺序：

1. Readability（本地）
2. Firecrawl（如果已选择，或被自动检测为当前活跃的 web-fetch 回退）
3. 基础 HTML 清理（最后的回退）

选择开关是 `tools.web.fetch.provider`。如果你省略它，OpenClaw
会从可用凭证中自动检测第一个已就绪的 web-fetch 提供商。
当前内置提供商是 Firecrawl。

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web Fetch](/tools/web-fetch) -- 带 Firecrawl 回退的 `web_fetch` 工具
- [Tavily](/tools/tavily) -- 搜索 + 提取工具

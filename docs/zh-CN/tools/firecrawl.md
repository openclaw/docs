---
read_when:
    - 你想要基于 Firecrawl 的网页提取
    - 你需要一个 Firecrawl API 密钥
    - 你想将 Firecrawl 作为 web_search 提供商
    - 你希望为 web_fetch 启用反机器人提取
summary: Firecrawl 搜索、抓取和 web_fetch 回退
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T05:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a04a9585dac65579454c5b9539a5fc1e315392c5956b9273e370406ecdbbd3e
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以通过三种方式使用 **Firecrawl**：

- 作为 `web_search` 提供商
- 作为显式插件工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作为 `web_fetch` 的备用提取器

它是一个托管的提取/搜索服务，支持绕过机器人防护和缓存，
这有助于处理 JS 密集型网站或阻止普通 HTTP 抓取的页面。

## 获取 API 密钥

1. 创建 Firecrawl 账户并生成 API 密钥。
2. 将其存储在配置中，或在 Gateway 网关环境中设置 `FIRECRAWL_API_KEY`。

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

注意：

- 在新手引导或 `openclaw configure --section web` 中选择 Firecrawl 会自动启用内置 Firecrawl 插件。
- 使用 Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 对于 Firecrawl 专用控制项，例如 `sources`、`categories` 或结果抓取，请使用 `firecrawl_search`。
- `baseUrl` 默认指向位于 `https://api.firecrawl.dev` 的托管 Firecrawl。仅允许为私有/内部端点使用自托管覆盖；HTTP 仅对这些私有目标接受。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜索和抓取基础 URL 的共享环境变量备用值。

## 配置 Firecrawl 抓取 + web_fetch 备用

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

注意：

- 仅当 API 密钥可用时（`plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`），才会运行 Firecrawl 备用尝试。
- `maxAgeMs` 控制缓存结果可保留的时长（毫秒）。默认值为 2 天。
- 旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。
- Firecrawl 抓取/基础 URL 覆盖遵循与搜索相同的托管/私有规则：公共托管流量使用 `https://api.firecrawl.dev`；自托管覆盖必须解析到私有/内部端点。

`firecrawl_scrape` 会复用相同的 `plugins.entries.firecrawl.config.webFetch.*` 设置和环境变量。

### 自托管 Firecrawl

当你自行运行 Firecrawl 时，设置 `plugins.entries.firecrawl.config.webSearch.baseUrl`、
`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。
OpenClaw 仅对 loopback、私有网络、`.local`、`.internal` 或 `.localhost`
目标接受 `http://`。公共自定义主机会被拒绝，避免 Firecrawl API 密钥
被意外发送到任意端点。

## Firecrawl 插件工具

### `firecrawl_search`

当你需要 Firecrawl 专用搜索控制项，而不是通用 `web_search` 时使用它。

核心参数：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

对于普通 `web_fetch` 效果较弱的 JS 密集型或受机器人防护的页面，请使用它。

核心参数：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隐身 / 绕过机器人防护

Firecrawl 公开了一个用于绕过机器人防护的 **proxy mode** 参数（`basic`、`stealth` 或 `auto`）。
OpenClaw 始终对 Firecrawl 请求使用 `proxy: "auto"` 加 `storeInCache: true`。
如果省略 proxy，Firecrawl 默认使用 `auto`。如果基础尝试失败，`auto` 会使用隐身代理重试，这可能比仅使用基础抓取消耗更多额度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 提取顺序：

1. Readability（本地）
2. Firecrawl（如果已选择，或被自动检测为活动的 web-fetch 备用项）
3. 基础 HTML 清理（最后备用项）

选择开关是 `tools.web.fetch.provider`。如果你省略它，OpenClaw
会从可用凭证中自动检测第一个已就绪的 web-fetch 提供商。
目前内置提供商是 Firecrawl。

## 相关

- [Web Search 概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web Fetch](/zh-CN/tools/web-fetch) -- 带有 Firecrawl 备用项的 web_fetch 工具
- [Tavily](/zh-CN/tools/tavily) -- 搜索 + 提取工具

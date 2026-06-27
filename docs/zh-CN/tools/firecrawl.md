---
read_when:
    - 你需要由 Firecrawl 支持的 Web 提取
    - 你想要无需密钥的 Firecrawl web_fetch
    - 搜索或更高限额需要 Firecrawl API 密钥
    - 你想将 Firecrawl 作为 web_search 提供商
    - 你想为 `web_fetch` 添加反机器人提取功能
summary: Firecrawl 搜索、抓取和 web_fetch 回退
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T03:28:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以通过三种方式使用 **Firecrawl**：

- 作为 `web_search` 提供商
- 作为显式插件工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作为 `web_fetch` 的后备提取器

它是一个托管的提取/搜索服务，支持绕过机器人检测和缓存，
这有助于处理大量使用 JS 的站点或阻止普通 HTTP 抓取的页面。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 无密钥 web_fetch 和 API 密钥

显式选择的托管 Firecrawl `web_fetch` 后备支持在没有 API 密钥的情况下使用入门访问。
在 Gateway 网关环境中添加 `FIRECRAWL_API_KEY`，
或者在需要更高限额时进行配置。Firecrawl `web_search` 和
`firecrawl_scrape` 需要 API 密钥。

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

- 在新手引导中选择 Firecrawl，或运行 `openclaw configure --section web`，会自动启用已安装的 Firecrawl 插件。
- 使用 Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 对于 Firecrawl 专用控制项，例如 `sources`、`categories` 或结果抓取，请使用 `firecrawl_search`。
- `baseUrl` 默认指向托管 Firecrawl：`https://api.firecrawl.dev`。仅允许为私有/内部端点设置自托管覆盖；HTTP 仅对这些私有目标可接受。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜索和抓取基础 URL 的共享环境变量后备。

## 配置 Firecrawl web_fetch 后备

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- 显式选择的 Firecrawl `web_fetch` 后备无需 API 密钥即可工作。配置后，OpenClaw 会发送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY` 以获得更高限额。
- 在新手引导期间选择 Firecrawl，或运行 `openclaw configure --section web`，会启用该插件并为 `web_fetch` 选择 Firecrawl，除非已经配置了另一个抓取提供商。
- `firecrawl_scrape` 需要 API 密钥。
- `maxAgeMs` 控制缓存结果可保留的最长时间（毫秒）。默认值为 2 天。
- 旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。
- Firecrawl 抓取/基础 URL 覆盖遵循与搜索相同的托管/私有规则：公共托管流量使用 `https://api.firecrawl.dev`；自托管覆盖必须解析到私有/内部端点。
- `firecrawl_scrape` 会在将目标 URL 转发给 Firecrawl 之前，拒绝明显的私有、loopback、元数据以及非 HTTP(S) 目标 URL，这与显式 Firecrawl 抓取调用的 `web_fetch` 目标安全契约一致。

`firecrawl_scrape` 会复用相同的 `plugins.entries.firecrawl.config.webFetch.*` 设置和环境变量，包括其必需的 API 密钥。

### 自托管 Firecrawl

当你自行运行 Firecrawl 时，设置 `plugins.entries.firecrawl.config.webSearch.baseUrl`、
`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。
OpenClaw 仅对 loopback、私有网络、`.local`、`.internal` 或 `.localhost`
目标接受 `http://`。公共自定义主机会被拒绝，以避免意外将 Firecrawl API 密钥发送到任意端点。

## Firecrawl 插件工具

### `firecrawl_search`

当你想使用 Firecrawl 专用搜索控制项，而不是通用 `web_search` 时使用它。

核心参数：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

对于大量使用 JS 或受机器人防护保护、普通 `web_fetch` 效果较弱的页面，请使用它。

核心参数：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隐身 / 绕过机器人检测

Firecrawl 提供用于绕过机器人检测的 **proxy mode** 参数（`basic`、`stealth` 或 `auto`）。
OpenClaw 始终对 Firecrawl 请求使用 `proxy: "auto"` 加 `storeInCache: true`。
如果省略 proxy，Firecrawl 默认使用 `auto`。如果基础尝试失败，`auto` 会使用隐身代理重试，这可能比仅基础抓取消耗更多额度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 提取顺序：

1. Readability（本地）
2. Firecrawl（被选中时，或从已配置凭据自动检测到时）
3. 基础 HTML 清理（最后后备）

选择开关是 `tools.web.fetch.provider`。如果省略它，OpenClaw
会从可用凭据中自动检测第一个就绪的 web-fetch 提供商。
官方 Firecrawl 插件提供该后备。

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web Fetch](/zh-CN/tools/web-fetch) -- 带 Firecrawl 后备的 web_fetch 工具
- [Tavily](/zh-CN/tools/tavily) -- 搜索 + 提取工具

---
read_when:
    - 你希望使用由 Firecrawl 支持的 Web 内容提取功能
    - 你想要无密钥的 Firecrawl `web_fetch`
    - 你需要 Firecrawl API key 才能使用搜索或获得更高的限额
    - 你想将 Firecrawl 用作 `web_search` 提供商
    - 你希望 `web_fetch` 具备反机器人提取能力
summary: Firecrawl 搜索、抓取和 web_fetch 回退机制
title: Firecrawl
x-i18n:
    generated_at: "2026-07-11T21:01:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以通过三种方式使用 **Firecrawl**：

- 作为 `web_search` 提供商
- 作为显式插件工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作为 `web_fetch` 的备用提取器

它是一项托管式提取/搜索服务，支持绕过机器人防护和缓存，有助于处理大量使用 JS 的网站或阻止普通 HTTP 获取的页面。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 无密钥 web_fetch 和 API 密钥

显式选择的托管 Firecrawl `web_fetch` 备用方案支持无需 API 密钥的入门级访问。当你需要更高限额时，请在 Gateway 网关环境中添加 `FIRECRAWL_API_KEY` 或对其进行配置。Firecrawl `web_search` 和 `firecrawl_scrape` 需要 API 密钥。

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

- 在新手引导或 `openclaw configure --section web` 中选择 Firecrawl，会自动启用已安装的 Firecrawl 插件。
- 使用 Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 如需使用 Firecrawl 专用控制项（例如 `sources`、`categories` 或结果抓取），请使用 `firecrawl_search`。
- `baseUrl` 默认为位于 `https://api.firecrawl.dev` 的托管 Firecrawl。仅允许对私有/内部端点使用自托管覆盖；只有这些私有目标才接受 HTTP。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜索和抓取基础 URL 共用的环境变量备用值。
- Firecrawl 搜索请求的默认超时时间为 30 秒；`firecrawl_search` 的 `timeoutSeconds` 参数可按调用覆盖该值。

## 配置 Firecrawl web_fetch 备用方案

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 显式选择会启用无密钥备用方案
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

注意：

- 显式选择的 Firecrawl `web_fetch` 备用方案无需 API 密钥即可工作。配置后，OpenClaw 会发送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`，以获得更高限额。
- 在新手引导或 `openclaw configure --section web` 中选择 Firecrawl，会启用该插件并为 `web_fetch` 选择 Firecrawl，除非已配置其他获取提供商。
- `firecrawl_scrape` 需要 API 密钥。
- `maxAgeMs` 控制可使用的缓存结果最长时间（毫秒）。默认值为 172,800,000 毫秒（2 天）。
- `onlyMainContent` 默认为 `true`；`timeoutSeconds` 默认为 60。
- `openclaw doctor --fix` 会自动迁移旧版 `tools.web.fetch.firecrawl.*` 和 `tools.web.search.firecrawl.*` 配置。
- Firecrawl 抓取/基础 URL 覆盖遵循与搜索相同的托管/私有规则：公共托管流量使用 `https://api.firecrawl.dev`；自托管覆盖必须解析为私有/内部端点。
- `firecrawl_scrape` 在将目标 URL 转发给 Firecrawl 前，会拒绝明显的私有地址、回环地址、元数据地址以及非 HTTP(S) 目标 URL，使显式 Firecrawl 抓取调用符合 `web_fetch` 的目标安全契约。

`firecrawl_scrape` 会复用相同的 `plugins.entries.firecrawl.config.webFetch.*` 设置和环境变量，包括其必需的 API 密钥。

### 自托管 Firecrawl

自行运行 Firecrawl 时，请设置 `plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。OpenClaw 仅对回环地址、私有网络、`.local`、`.internal` 或 `.localhost` 目标接受 `http://`。系统会拒绝公共自定义主机，避免 Firecrawl API 密钥被意外发送到任意端点。

## Firecrawl 插件工具

### `firecrawl_search`

当你需要 Firecrawl 专用搜索控制项而非通用 `web_search` 时，请使用此工具。

参数：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

对于大量使用 JS 或受机器人防护、普通 `web_fetch` 效果不佳的页面，请使用此工具。

参数：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隐匿模式/绕过机器人防护

除非调用方覆盖相关参数，否则 `firecrawl_scrape` 和 `web_fetch` 的 Firecrawl 备用方案默认使用 `proxy: "auto"` 以及 `storeInCache: true`。`firecrawl_search` 和 Firecrawl `web_search` 提供商没有 `proxy`/`storeInCache` 控制项；隐匿代理模式仅适用于抓取/获取请求。

Firecrawl 的 `proxy` 模式控制机器人防护绕过方式（`basic`、`stealth` 或 `auto`）。如果基础尝试失败，`auto` 会使用隐匿代理重试，与仅使用基础抓取相比，这可能消耗更多额度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 的提取顺序：

1. Readability（本地）
2. 已配置的获取提供商，例如 Firecrawl（已选择时，或根据已配置的凭据自动检测到时）
3. 基本 HTML 清理（最终备用方案）

选择配置项为 `tools.web.fetch.provider`。如果省略该配置项，OpenClaw 会根据可用凭据自动检测第一个已就绪的网页获取提供商。官方 Firecrawl 插件提供该备用方案。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [网页获取](/zh-CN/tools/web-fetch) -- 带有 Firecrawl 备用方案的 `web_fetch` 工具
- [Tavily](/zh-CN/tools/tavily) -- 搜索和提取工具

---
read_when:
    - 你希望使用 Firecrawl 支持的网页内容提取
    - 你需要免密钥的 Firecrawl Search（免费）或免密钥的 `web_fetch`
    - 你需要 Firecrawl API key 才能使用搜索或获得更高的限额
    - 你希望将 Firecrawl 用作 web_search 提供商
    - 你希望 `web_fetch` 具备反机器人提取能力
summary: Firecrawl 搜索、抓取和 web_fetch 回退机制
title: Firecrawl
x-i18n:
    generated_at: "2026-07-14T13:58:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
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

## 无密钥访问和 API 密钥

Firecrawl 注册了两个 `web_search` 提供商：

- **Firecrawl 搜索**（`firecrawl`）— 使用托管的 `/v2/search` API 和你的
  密钥；存在密钥时会自动检测。
- **Firecrawl 搜索（免费）**（`firecrawl-free`）— 使用托管的无密钥入门
  层级，无需 API 密钥。它**只能主动选择**，绝不会自动选中，因为
  选择它会将你的搜索查询发送到 Firecrawl 的免费层级。

显式选择的 Firecrawl `web_fetch` 备用方案同样无需密钥。显式
`firecrawl_search` 和 `firecrawl_scrape` 工具需要 API 密钥。在 Gateway 网关环境中添加
`FIRECRAWL_API_KEY`，或配置它以获得更高的限制。

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
- 在新手引导中选择 **Firecrawl 搜索（免费）**（或设置 `provider: "firecrawl-free"`），即可在没有 API 密钥的情况下无密钥运行。使用密钥的 **Firecrawl 搜索**提供商会发送 `plugins.entries.firecrawl.config.webSearch.apiKey` 或 `FIRECRAWL_API_KEY`。
- Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 若要使用 Firecrawl 专属控制项（例如 `sources`、`categories` 或结果抓取），请使用 `firecrawl_search`。
- `baseUrl` 默认使用位于 `https://api.firecrawl.dev` 的托管 Firecrawl。仅允许为私有/内部端点设置自托管覆盖；只有这些私有目标才接受 HTTP。
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

- 显式选择的 Firecrawl `web_fetch` 备用方案无需 API 密钥即可工作。配置后，OpenClaw 会发送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`，以获得更高的限制。
- 在新手引导或 `openclaw configure --section web` 中选择 Firecrawl，会启用插件并为 `web_fetch` 选择 Firecrawl，除非已经配置了其他获取提供商。
- `firecrawl_scrape` 需要 API 密钥。
- `maxAgeMs` 控制可使用多旧的缓存结果（毫秒）。默认值为 172,800,000 毫秒（2 天）。
- `onlyMainContent` 默认为 `true`；`timeoutSeconds` 默认为 60。
- 旧版 `tools.web.fetch.firecrawl.*` 和 `tools.web.search.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。
- Firecrawl 抓取/基础 URL 覆盖遵循与搜索相同的托管/私有规则：公共托管流量使用 `https://api.firecrawl.dev`；自托管覆盖必须解析为私有/内部端点。
- `firecrawl_scrape` 会在将目标 URL 转发给 Firecrawl 前，拒绝明显的私有、环回、元数据和非 HTTP(S) URL，与显式 Firecrawl 抓取调用的 `web_fetch` 目标安全契约一致。

`firecrawl_scrape` 复用相同的 `plugins.entries.firecrawl.config.webFetch.*` 设置和环境变量，包括其必需的 API 密钥。

### 自托管 Firecrawl

自行运行 Firecrawl 时，请设置 `plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。OpenClaw 仅对环回、私有网络、`.local`、`.internal` 或 `.localhost` 目标接受 `http://`。公共自定义主机会被拒绝，以免 Firecrawl API 密钥意外发送到任意端点。

## Firecrawl 插件工具

### `firecrawl_search`

需要使用 Firecrawl 专属搜索控制项而非通用 `web_search` 时，请使用此工具。需要 API 密钥。

参数：

- `query`
- `count`（1-100）
- `sources`
- `categories`
- `includeDomains` / `excludeDomains`（仅限主机名；互斥）
- `tbs`（时间筛选器，例如 `qdr:d`、`qdr:w`、`sbd:1`）
- `location` 和 `country`（地理位置定向）
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

## 隐身模式/绕过机器人防护

除非调用方覆盖这些参数，否则 `firecrawl_scrape` 和 `web_fetch` Firecrawl 备用方案默认使用 `proxy: "auto"` 加 `storeInCache: true`。`firecrawl_search` 和 `web_search` Firecrawl 提供商没有 `proxy`/`storeInCache` 控制项；隐身代理模式仅适用于抓取/获取请求。

Firecrawl 的 `proxy` 模式控制机器人防护绕过（`basic`、`stealth` 或 `auto`）。如果基础尝试失败，`auto` 会使用隐身代理重试，这可能比仅使用基础抓取消耗更多额度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 提取顺序：

1. Readability（本地）
2. 已配置的获取提供商，例如 Firecrawl（选中时，或根据已配置的凭据自动检测到时）
3. 基础 HTML 清理（最终备用方案）

选择控制项为 `tools.web.fetch.provider`。如果省略它，OpenClaw 会根据可用凭据自动检测第一个就绪的网页获取提供商。官方 Firecrawl 插件提供该备用方案。

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [Web 获取](/zh-CN/tools/web-fetch) -- 带 Firecrawl 备用方案的 web_fetch 工具
- [Tavily](/zh-CN/tools/tavily) -- 搜索和提取工具

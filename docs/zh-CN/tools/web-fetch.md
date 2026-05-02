---
read_when:
    - 你想获取一个 URL 并提取可读内容
    - 你需要配置 web_fetch 或其 Firecrawl 后备方案
    - 你想了解 web_fetch 的限制和缓存
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- HTTP 获取并提取可读内容
title: 网页抓取
x-i18n:
    generated_at: "2026-05-02T05:39:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f455da77c20049f0ed0246fa53e9f49d3cf2004e65bd64a0bf871861c6e93229
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 工具会执行普通的 HTTP GET，并提取可读内容
（HTML 转为 markdown 或文本）。它**不会**执行 JavaScript。

对于 JS 密集型站点或受登录保护的页面，请改用
[Web 浏览器](/zh-CN/tools/browser)。

## 快速开始

`web_fetch` **默认启用** -- 无需配置。智能体可以
立即调用它：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具参数

<ParamField path="url" type="string" required>
要抓取的 URL。仅限 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主内容提取后的输出格式。
</ParamField>

<ParamField path="maxChars" type="number">
将输出截断为这么多个字符。
</ParamField>

## 工作原理

<Steps>
  <Step title="Fetch">
    使用类似 Chrome 的 User-Agent 和 `Accept-Language`
    标头发送 HTTP GET。阻止私有/内部主机名，并重新检查重定向。
  </Step>
  <Step title="Extract">
    在 HTML 响应上运行 Readability（主内容提取）。
  </Step>
  <Step title="Fallback (optional)">
    如果 Readability 失败且已配置 Firecrawl，则通过
    Firecrawl API 以规避机器人检测模式重试。
  </Step>
  <Step title="Cache">
    结果会缓存 15 分钟（可配置），以减少对同一 URL 的重复
    抓取。
  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl 回退

如果 Readability 提取失败，`web_fetch` 可以回退到
[Firecrawl](/zh-CN/tools/firecrawl)，用于规避机器人检测并获得更好的提取效果：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 支持 SecretRef 对象。
旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。

<Note>
  如果 Firecrawl 已启用，但其 SecretRef 未解析且没有
  `FIRECRAWL_API_KEY` 环境变量回退，Gateway 网关启动会快速失败。
</Note>

<Note>
  Firecrawl `baseUrl` 覆盖会被锁定：托管流量使用
  `https://api.firecrawl.dev`；自托管覆盖必须指向私有或
  内部端点，并且仅这些私有目标接受 `http://`。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 会显式选择抓取回退提供商。
- 如果省略 `provider`，OpenClaw 会根据可用凭据自动检测第一个就绪的 web-fetch
  提供商。非沙箱隔离的 `web_fetch` 可以使用已安装的插件，这些插件声明
  `contracts.webFetchProviders` 并在运行时注册匹配的提供商。当前内置提供商是 Firecrawl。
- 沙箱隔离的 `web_fetch` 调用仍仅限于内置提供商。
- 如果禁用 Readability，`web_fetch` 会直接跳到选定的
  提供商回退。如果没有可用提供商，它会以关闭方式失败。

## 限制和安全

- `maxChars` 会被限制到 `tools.web.fetch.maxCharsCap`
- 响应正文在解析前会被限制在 `maxResponseBytes`；超大
  响应会被截断并附带警告
- 私有/内部主机名会被阻止
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是针对
  受信任假 IP 代理栈的窄范围选择启用项；除非你的代理拥有
  这些合成地址范围并执行自己的目标策略，否则请保持未设置
- 重定向会被检查，并受 `maxRedirects` 限制
- `web_fetch` 是尽力而为的工具 -- 某些站点需要 [Web 浏览器](/zh-CN/tools/browser)

## 工具配置文件

如果你使用工具配置文件或允许列表，请添加 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 相关内容

- [Web 搜索](/zh-CN/tools/web) -- 使用多个提供商搜索 Web
- [Web 浏览器](/zh-CN/tools/browser) -- 用于 JS 密集型站点的完整浏览器自动化
- [Firecrawl](/zh-CN/tools/firecrawl) -- Firecrawl 搜索和抓取工具

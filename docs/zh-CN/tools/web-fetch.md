---
read_when:
    - 你想获取一个 URL 并提取可读内容
    - 你需要配置 web_fetch 或它的 Firecrawl 备用方案
    - 你想了解 `web_fetch` 的限制和缓存
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- HTTP 获取并提取可读内容
title: Web 获取
x-i18n:
    generated_at: "2026-06-27T03:35:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 工具会执行普通 HTTP GET 并提取可读内容
（HTML 转为 Markdown 或文本）。它**不会**执行 JavaScript。

对于大量依赖 JS 的网站或受登录保护的页面，请改用
[Web Browser](/zh-CN/tools/browser)。

## 快速开始

`web_fetch` **默认启用** -- 无需配置。智能体可以
立即调用它：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具参数

<ParamField path="url" type="string" required>
要抓取的 URL。仅支持 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主内容提取后的输出格式。
</ParamField>

<ParamField path="maxChars" type="number">
将输出截断到这么多字符。
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
    如果 Readability 失败且选择了 Firecrawl，则通过
    Firecrawl API 以绕过 Bot 的模式重试。
  </Step>
  <Step title="Cache">
    结果会缓存 15 分钟（可配置），以减少对同一 URL 的重复
    抓取。
  </Step>
</Steps>

## 进度更新

`web_fetch` 仅在抓取五秒后仍处于待处理状态时，才会发出一行公开进度：

```text
Fetching page content...
```

快速缓存命中和迅速完成的网络响应会在计时器触发前结束，因此
不会显示进度行。如果调用被取消，计时器会被清除。
当抓取最终完成时，智能体会收到正常的工具结果；
进度行只是渠道 UI 状态，绝不会包含抓取到的页面
内容。

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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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
[Firecrawl](/zh-CN/tools/firecrawl)，用于绕过 Bot 并获得更好的提取效果：

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` 是可选的，并支持 SecretRef 对象。
旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。

<Note>
  如果你配置了 Firecrawl API-key SecretRef，但它无法解析且没有
  `FIRECRAWL_API_KEY` 环境变量回退，Gateway 网关启动会快速失败。
</Note>

<Note>
  Firecrawl `baseUrl` 覆盖受到限制：托管流量使用
  `https://api.firecrawl.dev`；自托管覆盖必须指向私有或
  内部端点，并且 `http://` 只会被这些私有目标接受。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 会显式选择抓取回退提供商。
- 如果省略 `provider`，OpenClaw 会从已配置凭证中自动检测第一个就绪的 Web 抓取
  提供商。非沙箱隔离的 `web_fetch` 可以使用已安装的插件，这些插件声明
  `contracts.webFetchProviders` 并在运行时注册匹配的
  提供商。官方 Firecrawl 插件提供此
  回退。
- 沙箱隔离的 `web_fetch` 调用允许内置提供商，以及
  官方 npm 或 ClawHub 来源已验证的已安装提供商。当前这允许
  官方 Firecrawl 插件；第三方外部抓取插件仍被排除。
- 如果禁用 Readability，`web_fetch` 会直接跳到选定的
  提供商回退。如果没有可用提供商，它会按封闭失败处理。

## 受信任的环境代理

如果你的部署要求 `web_fetch` 通过受信任的出站
HTTP(S) 代理，请设置 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍会在发送请求前应用基于主机名的 SSRF 检查，
但它会让代理解析 DNS，而不是执行本地 DNS
固定。仅当代理由操作员控制，并且在 DNS 解析后仍执行
出站策略时，才启用此项。

<Note>
  如果未配置 HTTP(S) 代理环境变量，或目标主机被
  `NO_PROXY` 排除，`web_fetch` 会回退到带本地 DNS
  固定的普通严格路径。
</Note>

## 限制和安全

- `maxChars` 会被限制到 `tools.web.fetch.maxCharsCap`
- 响应正文会在解析前限制为 `maxResponseBytes`；超大的
  响应会被截断并附带警告
- 私有/内部主机名会被阻止
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是针对
  受信任假 IP 代理栈的窄范围选择启用项；除非你的代理拥有
  这些合成范围并执行自己的目标策略，否则请保持未设置
- 重定向会被检查，并受 `maxRedirects` 限制
- `useTrustedEnvProxy` 是显式选择启用项，只应为
  操作员控制且在 DNS 解析后仍执行出站策略的代理启用
- `web_fetch` 是尽力而为的 -- 某些网站需要 [Web Browser](/zh-CN/tools/browser)

## 工具配置集

如果你使用工具配置集或允许列表，请添加 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 相关

- [Web Search](/zh-CN/tools/web) -- 使用多个提供商搜索 Web
- [Web Browser](/zh-CN/tools/browser) -- 面向大量依赖 JS 的网站的完整浏览器自动化
- [Firecrawl](/zh-CN/tools/firecrawl) -- Firecrawl 搜索和抓取工具

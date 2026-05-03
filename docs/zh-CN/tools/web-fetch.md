---
read_when:
    - 你想获取一个 URL 并提取可读内容
    - 你需要配置 web_fetch 或其 Firecrawl 回退方案
    - 你想了解 web_fetch 的限制和缓存
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- HTTP 获取并提取可读内容
title: 网页获取
x-i18n:
    generated_at: "2026-05-03T21:39:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 工具会执行普通的 HTTP GET，并提取可读内容（将 HTML 转为 Markdown 或文本）。它**不会**执行 JavaScript。

对于重度依赖 JS 的站点或受登录保护的页面，请改用
[Web 浏览器](/zh-CN/tools/browser)。

## 快速开始

`web_fetch` **默认启用**，无需配置。智能体可以立即调用它：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具参数

<ParamField path="url" type="string" required>
要获取的 URL。仅支持 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主内容提取后的输出格式。
</ParamField>

<ParamField path="maxChars" type="number">
将输出截断为指定字符数。
</ParamField>

## 工作原理

<Steps>
  <Step title="获取">
    使用类似 Chrome 的 User-Agent 和 `Accept-Language` 标头发送 HTTP GET。阻止私有/内部主机名，并重新检查重定向。
  </Step>
  <Step title="提取">
    在 HTML 响应上运行 Readability（主内容提取）。
  </Step>
  <Step title="回退（可选）">
    如果 Readability 失败且已配置 Firecrawl，则通过带机器人规避模式的 Firecrawl API 重试。
  </Step>
  <Step title="缓存">
    结果会缓存 15 分钟（可配置），以减少对同一 URL 的重复获取。
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
[Firecrawl](/zh-CN/tools/firecrawl)，用于机器人规避和更好的提取：

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

`plugins.entries.firecrawl.config.webFetch.apiKey` 支持 SecretRef 对象。旧版 `tools.web.fetch.firecrawl.*` 配置会由 `openclaw doctor --fix` 自动迁移。

<Note>
  如果 Firecrawl 已启用，并且其 SecretRef 未解析且没有 `FIRECRAWL_API_KEY` 环境变量回退，Gateway 网关启动会快速失败。
</Note>

<Note>
  Firecrawl `baseUrl` 覆盖会被锁定：托管流量使用 `https://api.firecrawl.dev`；自托管覆盖必须指向私有或内部端点，并且 `http://` 仅对这些私有目标可接受。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 会显式选择获取回退提供商。
- 如果省略 `provider`，OpenClaw 会从可用凭证中自动检测第一个就绪的 Web 获取提供商。非沙箱隔离的 `web_fetch` 可以使用已安装的插件，这些插件声明 `contracts.webFetchProviders` 并在运行时注册匹配的提供商。目前内置提供商是 Firecrawl。
- 沙箱隔离的 `web_fetch` 调用仍仅限于内置提供商。
- 如果禁用 Readability，`web_fetch` 会直接跳到选定的提供商回退。如果没有可用提供商，它会以封闭方式失败。

## 可信环境代理

如果你的部署要求 `web_fetch` 通过可信的出站 HTTP(S) 代理，请设置 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍会在发送请求前应用基于主机名的 SSRF 检查，但会让代理解析 DNS，而不是执行本地 DNS 固定。仅当该代理由操作方控制，并在 DNS 解析后强制执行出站策略时，才启用此选项。

<Note>
  如果未配置 HTTP(S) 代理环境变量，或目标主机被 `NO_PROXY` 排除，`web_fetch` 会回退到带本地 DNS 固定的普通严格路径。
</Note>

## 限制与安全

- `maxChars` 会被限制到 `tools.web.fetch.maxCharsCap`
- 响应体在解析前会被限制为 `maxResponseBytes`；超大响应会被截断并附带警告
- 私有/内部主机名会被阻止
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是面向可信假 IP 代理栈的窄范围选择加入项；除非你的代理拥有这些合成范围并强制执行自己的目标策略，否则请保持未设置
- 重定向会被检查，并受 `maxRedirects` 限制
- `useTrustedEnvProxy` 是显式选择加入项，只应为由操作方控制、且在 DNS 解析后仍会强制执行出站策略的代理启用
- `web_fetch` 是尽力而为的工具，有些站点需要使用 [Web 浏览器](/zh-CN/tools/browser)

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

- [Web 搜索](/zh-CN/tools/web) -- 使用多个提供商搜索网页
- [Web 浏览器](/zh-CN/tools/browser) -- 面向重度依赖 JS 站点的完整浏览器自动化
- [Firecrawl](/zh-CN/tools/firecrawl) -- Firecrawl 搜索和抓取工具

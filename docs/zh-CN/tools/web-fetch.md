---
read_when:
    - 你想获取一个 URL 并提取可读内容
    - 你需要配置 web_fetch 或其 Firecrawl 回退
    - 你想了解 web_fetch 限制和缓存
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- HTTP 获取并提取可读内容
title: 网页获取
x-i18n:
    generated_at: "2026-07-05T11:50:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 会执行普通 HTTP GET，并提取可读内容（HTML 转为
markdown 或文本）。它**不会**执行 JavaScript。对于重度依赖 JS 的站点或
受登录保护的页面，请改用 [Web 浏览器](/zh-CN/tools/browser)。

## 快速开始

默认启用，无需配置：

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
将输出截断到这么多字符。会被限制在 `tools.web.fetch.maxCharsCap` 内。
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
    如果 Readability 失败且有可用的抓取提供商，则通过
    该提供商重试（例如 Firecrawl 的绕过机器人检测模式）。
  </Step>
  <Step title="Cache">
    结果会缓存 15 分钟（可配置），以减少对同一 URL 的重复
    抓取。
  </Step>
</Steps>

## 进度更新

`web_fetch` 仅在抓取五秒后仍处于待处理状态时发出公开进度行：

```text
Fetching page content...
```

快速缓存命中和快速网络响应会在计时器触发前完成，因此
它们不会显示进度行。取消调用会清除计时器。
进度行只是渠道 UI 状态，绝不会包含抓取到的页面内容。

## 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000, // default output chars; capped by maxCharsCap
        maxCharsCap: 20000, // hard cap for maxChars param
        maxResponseBytes: 750000, // max download size before truncation (32000-10000000)
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
[Firecrawl](/zh-CN/tools/firecrawl)，用于绕过机器人检测并获得更好的提取结果：

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
            maxAgeMs: 172800000, // cache duration (2 days)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 是可选项，并支持 SecretRef 对象。
旧版 `tools.web.fetch.firecrawl.*` 配置会通过 `openclaw doctor --fix`
自动迁移到 `plugins.entries.firecrawl.config.webFetch`。

<Note>
  如果你配置了 Firecrawl API key SecretRef，但它无法解析且没有
  `FIRECRAWL_API_KEY` 环境变量回退，Gateway 网关启动会快速失败。
</Note>

<Note>
  Firecrawl `baseUrl` 覆盖会被锁定：托管流量使用
  `https://api.firecrawl.dev`；自托管覆盖必须指向私有或
  内部端点，并且 `http://` 仅对这些私有目标接受。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 会显式选择抓取回退提供商。
- 如果省略 `provider`，OpenClaw 会从已配置凭证中自动检测第一个就绪的 web-fetch
  提供商。非沙箱隔离的 `web_fetch` 可以使用已安装的插件，这些插件需声明
  `contracts.webFetchProviders` 并在运行时注册匹配的提供商。官方 Firecrawl 插件目前提供此
  回退。
- 沙箱隔离的 `web_fetch` 调用允许内置提供商，以及官方 npm 或 ClawHub 来源已验证的已安装提供商。
  目前这允许官方 Firecrawl 插件；第三方外部抓取插件仍会被排除。
- 如果禁用 Readability，`web_fetch` 会直接跳到所选
  提供商回退。如果没有可用提供商，则会失败并关闭。

## 可信环境代理

如果你的部署要求 `web_fetch` 通过可信的出站
HTTP(S) 代理，请设置 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍会在发送请求前应用基于主机名的 SSRF 检查，
但会让代理解析 DNS，而不是执行本地 DNS
固定。仅当代理由操作员控制，并在 DNS 解析后强制执行
出站策略时，才启用此选项。

<Note>
  如果没有配置 HTTP(S) 代理环境变量，或目标主机被
  `NO_PROXY` 排除，`web_fetch` 会回退到带本地 DNS
  固定的常规严格路径。
</Note>

## 限制和安全

- `maxChars` 会被限制在 `tools.web.fetch.maxCharsCap` 内（默认 `20000`）
- 响应正文会在解析前限制为 `maxResponseBytes`（默认 `750000`，限制在
  32000-10000000 内）；过大的响应会被截断并显示警告
- 私有/内部主机名会被阻止
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是面向
  可信假 IP 代理栈的窄范围选择加入项；除非你的代理拥有
  这些合成范围并强制执行自己的目标策略，否则不要设置它们
- 重定向会被检查，并受 `maxRedirects` 限制（默认 `3`）
- `useTrustedEnvProxy` 是显式选择加入项，只应为
  由操作员控制且在 DNS 解析后仍强制执行出站策略的代理启用
- `web_fetch` 是尽力而为的工具；某些站点需要 [Web 浏览器](/zh-CN/tools/browser)

## 工具配置档

如果你使用工具配置档或允许列表，请添加 `web_fetch` 或 `group:web`：

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
- [Web 浏览器](/zh-CN/tools/browser) -- 面向重度依赖 JS 站点的完整浏览器自动化
- [Firecrawl](/zh-CN/tools/firecrawl) -- Firecrawl 搜索和抓取工具

---
read_when:
    - 你想要获取 URL 并提取可读内容
    - 你需要配置 `web_fetch` 或其 Firecrawl 回退方案
    - 你想了解 `web_fetch` 的限制和缓存机制
sidebarTitle: Web Fetch
summary: web_fetch 工具——通过 HTTP 获取并提取可读内容
title: 网页抓取
x-i18n:
    generated_at: "2026-07-11T21:02:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 执行普通的 HTTP GET，并提取可读内容（将 HTML 转换为
Markdown 或文本）。它**不会**执行 JavaScript。对于高度依赖 JS 的网站或
受登录保护的页面，请改用 [Web 浏览器](/zh-CN/tools/browser)。

## 快速开始

默认启用，无需配置：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具参数

<ParamField path="url" type="string" required>
要获取的 URL。仅支持 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
提取主要内容后的输出格式。
</ParamField>

<ParamField path="maxChars" type="number">
将输出截断为指定字符数。上限为 `tools.web.fetch.maxCharsCap`。
</ParamField>

## 工作原理

<Steps>
  <Step title="获取">
    使用类似 Chrome 的 User-Agent 和 `Accept-Language`
    标头发送 HTTP GET。阻止私有/内部主机名，并重新检查重定向。
  </Step>
  <Step title="提取">
    对 HTML 响应运行 Readability（主要内容提取）。
  </Step>
  <Step title="回退（可选）">
    如果 Readability 失败且有可用的获取提供商，则通过
    该提供商重试（例如 Firecrawl 的机器人规避模式）。
  </Step>
  <Step title="缓存">
    结果会缓存 15 分钟（可配置），以减少对同一 URL
    的重复获取。
  </Step>
</Steps>

## 进度更新

仅当获取操作在五秒后仍处于待处理状态时，`web_fetch` 才会发出一行公开进度信息：

```text
正在获取页面内容...
```

快速缓存命中和迅速完成的网络响应会在计时器触发前结束，因此
不会显示进度信息。取消调用会清除计时器。该进度信息仅表示渠道 UI 状态，
绝不会包含获取到的页面内容。

## 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 默认值：true
        provider: "firecrawl", // 可选；省略则自动检测
        maxChars: 20000, // 默认输出字符数；受 maxCharsCap 限制
        maxCharsCap: 20000, // maxChars 参数的硬性上限
        maxResponseBytes: 750000, // 截断前的最大下载大小（32000-10000000）
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // 允许受信任的 HTTP(S) 环境代理解析 DNS
        readability: true, // 使用 Readability 提取
        userAgent: "Mozilla/5.0 ...", // 覆盖 User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // 为使用 198.18.0.0/15 的受信任虚假 IP 代理选择启用
          allowIpv6UniqueLocalRange: true, // 为使用 fc00::/7 的受信任虚假 IP 代理选择启用
        },
      },
    },
  },
}
```

## Firecrawl 回退

如果 Readability 提取失败，`web_fetch` 可以回退到
[Firecrawl](/zh-CN/tools/firecrawl)，以规避机器人限制并改善提取效果：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 可选；省略则根据可用凭据自动检测
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // 可选；省略则使用无密钥的入门访问
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // 缓存时长（2 天）
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
  如果配置了 Firecrawl API 密钥 SecretRef，但该引用无法解析且没有
  `FIRECRAWL_API_KEY` 环境变量作为回退，Gateway 网关启动会立即失败。
</Note>

<Note>
  Firecrawl `baseUrl` 覆盖受到严格限制：托管流量使用
  `https://api.firecrawl.dev`；自托管覆盖必须指向私有或
  内部端点，并且仅对这些私有目标接受 `http://`。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 用于显式选择获取回退提供商。
- 如果省略 `provider`，OpenClaw 会根据已配置的凭据自动检测首个就绪的网页获取
  提供商。非沙箱隔离的 `web_fetch` 可以使用已安装的插件，只要这些插件声明
  `contracts.webFetchProviders` 并在运行时注册匹配的提供商。目前官方
  Firecrawl 插件提供此回退。
- 沙箱隔离的 `web_fetch` 调用允许使用内置提供商，以及官方 npm 或 ClawHub
  来源已经验证的已安装提供商。目前这允许使用官方 Firecrawl 插件；第三方
  外部获取插件仍被排除。
- 如果禁用 Readability，`web_fetch` 会直接跳到选定的提供商回退。如果没有
  可用的提供商，则以关闭方式失败。

## 受信任的环境代理

如果你的部署要求 `web_fetch` 通过受信任的出站
HTTP(S) 代理，请设置 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍会在发送请求之前应用基于主机名的 SSRF 检查，
但会让代理解析 DNS，而不是在本地进行 DNS 固定。仅当代理由操作员控制，
并且在 DNS 解析后强制执行出站策略时，才应启用此选项。

<Note>
  如果未配置 HTTP(S) 代理环境变量，或者目标主机被
  `NO_PROXY` 排除，`web_fetch` 会回退到使用本地 DNS
  固定的常规严格路径。
</Note>

## 限制与安全

- `maxChars` 的上限为 `tools.web.fetch.maxCharsCap`（默认值为 `20000`）
- 响应正文在解析前受 `maxResponseBytes` 限制（默认值为 `750000`，限制在
  32000-10000000 之间）；过大的响应会被截断并显示警告
- 私有/内部主机名会被阻止
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是针对
  受信任虚假 IP 代理栈的有限选择启用项；除非你的代理拥有这些合成地址范围
  并强制执行自身的目标策略，否则请不要设置它们
- 重定向会接受检查，并受 `maxRedirects` 限制（默认值为 `3`）
- `useTrustedEnvProxy` 是显式选择启用项，仅应为由操作员控制，且在 DNS
  解析后仍强制执行出站策略的代理启用
- `web_fetch` 仅尽力而为——某些网站需要使用 [Web 浏览器](/zh-CN/tools/browser)

## 工具配置文件

如果你使用工具配置文件或允许列表，请添加 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // 或：allow: ["group:web"]（包括 web_fetch、web_search 和 x_search）
  },
}
```

## 相关内容

- [Web 搜索](/zh-CN/tools/web)——通过多个提供商搜索网页
- [Web 浏览器](/zh-CN/tools/browser)——针对高度依赖 JS 的网站进行完整浏览器自动化
- [Firecrawl](/zh-CN/tools/firecrawl)——Firecrawl 搜索和抓取工具

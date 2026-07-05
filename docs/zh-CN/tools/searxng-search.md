---
read_when:
    - 你想要一个自托管的 Web 搜索提供商
    - 你想使用 SearXNG 进行 web_search
    - 你需要一个注重隐私或隔离网络的搜索选项
summary: SearXNG Web 搜索 -- 自托管、无需密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
    generated_at: "2026-07-05T11:46:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支持将 [SearXNG](https://docs.searxng.org/) 作为**自托管、无需密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，会聚合来自 Google、Bing、DuckDuckGo 和其他来源的结果。

优势：

- **免费且无限制** —— 无需 API key 或商业订阅
- **隐私 / 隔离网络** —— 查询永远不会离开你的网络
- **随处可用** —— 不受商业搜索 API 的区域限制

## 设置

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用你有权访问的任何现有 SearXNG 部署。生产环境设置请参阅
    [SearXNG 文档](https://docs.searxng.org/)。

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    或设置环境变量，并让自动检测找到它：

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG 实例的插件级设置：

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` 也接受 SecretRef 对象（例如 `{ source: "env", id: "SEARXNG_BASE_URL" }`）。

## 环境变量

将 `SEARXNG_BASE_URL` 设置为配置的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

解析顺序：已配置的 `baseUrl` 字符串，然后是 `baseUrl` 上的内联环境变量 SecretRef，然后是 `SEARXNG_BASE_URL`。当没有设置任何配置路径且存在 `SEARXNG_BASE_URL`，同时未显式选择提供商时，自动检测会选择 SearXNG。

## 插件配置参考

| 字段         | 描述                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 实例的基础 URL（必需）                                |
| `categories` | 逗号分隔的类别，例如 `general`、`news` 或 `science`                |
| `language`   | 结果语言代码，例如 `en`、`de` 或 `fr`                              |

`web_search` 工具调用也接受 `count`（1-10 条结果）、`categories` 和 `language` 作为每次调用的覆盖项。

## 说明

- **JSON API** —— 使用 SearXNG 原生的 `format=json` 端点，而不是 HTML 抓取
- **图片结果 URL** —— 当 SearXNG 返回直接图片 URL 时，图片类别结果会包含 `img_src`
- **无需 API key** —— 可直接用于任何 SearXNG 实例
- **基础 URL 验证** —— `baseUrl` 必须是有效的 `http://` 或 `https://` URL
- **网络防护** —— `http://` 基础 URL 必须指向受信任的私有主机或回环主机（公共主机必须使用 `https://`）；解析到私有/内部地址的 `https://` 基础 URL 会获得相同的自托管许可，而公开解析的 `https://` 基础 URL 会保持严格的 SSRF 防护
- **自动检测顺序** —— SearXNG 需要配置 `baseUrl`（在已有必需凭据的提供商中顺序为 200）。DuckDuckGo 或 Ollama Web Search 等无需密钥的提供商不会隐式赢得自动检测；它们只会在显式选择 `provider` 时激活
- **自托管** —— 你控制实例、查询和上游搜索引擎
- **类别** 未配置时默认为 `general`
- **类别回退** —— 如果非 `general` 类别请求成功但返回零条结果，OpenClaw 会使用 `general` 对同一查询重试一次，然后才返回空结果集
- **结果缓存** —— 相同查询（相同的查询、数量、类别、语言和基础 URL）会在进程内短 TTL 缓存
- **版本要求** —— 插件声明 `minHostVersion: >=2026.6.9`

<Tip>
  要让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例已在 `settings.yml` 的 `search.formats` 下启用 `json` 格式。
</Tip>

## 相关内容

- [Web Search 概览](/zh-CN/tools/web) —— 所有提供商和自动检测
- [DuckDuckGo 搜索](/zh-CN/tools/duckduckgo-search) —— 另一个无需密钥的提供商
- [Brave 搜索](/zh-CN/tools/brave-search) —— 提供免费层的结构化结果

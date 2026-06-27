---
read_when:
    - 你想要一个自托管的 Web 搜索提供商
    - 你想使用 SearXNG 进行 web_search
    - 你需要一个注重隐私或隔离网络的搜索选项
summary: SearXNG Web 搜索 -- 自托管、无需密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
    generated_at: "2026-06-27T03:31:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支持 [SearXNG](https://docs.searxng.org/) 作为**自托管、无需密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，会聚合来自 Google、Bing、DuckDuckGo 和其他来源的结果。

优势：

- **免费且不限量** -- 无需 API key 或商业订阅
- **隐私 / 隔离网络** -- 查询永远不会离开你的网络
- **随处可用** -- 不受商业搜索 API 的地区限制

## 设置

<Steps>
  <Step title="安装插件">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="运行一个 SearXNG 实例">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或者使用你有权访问的任何现有 SearXNG 部署。生产环境设置请参阅
    [SearXNG 文档](https://docs.searxng.org/)。

  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    或者设置环境变量，让自动检测找到它：

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

`baseUrl` 字段也接受 SecretRef 对象。

传输规则：

- `https://` 适用于公开或私有的 SearXNG 主机
- `http://` 只接受可信的私有网络或 loopback 主机
- 公开 SearXNG 主机必须使用 `https://`
- 私有/内部主机使用自托管网络防护；公开的 `https://`
  主机会保持严格的 Web 搜索防护，且不能重定向到私有地址

## 环境变量

设置 `SEARXNG_BASE_URL` 作为配置的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

当设置了 `SEARXNG_BASE_URL` 且未配置显式提供商时，自动检测会自动选择 SearXNG（优先级最低 -- 任何带有密钥的 API 后端提供商都会优先胜出）。

## 插件配置参考

| 字段         | 描述                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 实例的基础 URL（必填）                                |
| `categories` | 逗号分隔的分类，例如 `general`、`news` 或 `science`                |
| `language`   | 结果语言代码，例如 `en`、`de` 或 `fr`                              |

## 说明

- **JSON API** -- 使用 SearXNG 原生的 `format=json` 端点，而不是 HTML 抓取
- **图片结果 URL** -- 当 SearXNG 返回直接图片 URL 时，图片分类结果会包含 `img_src`
- **无需 API key** -- 开箱即可配合任何 SearXNG 实例使用
- **基础 URL 验证** -- `baseUrl` 必须是有效的 `http://` 或 `https://`
  URL；公开主机必须使用 `https://`
- **网络防护** -- 私有/内部 SearXNG 端点会显式启用私有网络访问；公开的 `https://` SearXNG 端点保留严格的 SSRF 保护
- **自动检测顺序** -- SearXNG 会在已配置密钥的 API 后端提供商之后检查（顺序 200）。DuckDuckGo 或 Ollama Web Search 等无需密钥的提供商不会在未显式选择提供商的情况下被自动选中
- **自托管** -- 你控制实例、查询和上游搜索引擎
- **分类** 未配置时默认为 `general`
- **分类回退** -- 如果非 `general` 分类请求成功但返回零结果，OpenClaw 会先用 `general` 对同一查询重试一次，然后才返回空结果集

<Tip>
  要让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例在 `settings.yml` 的 `search.formats` 下启用了 `json`
  格式。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [DuckDuckGo Search](/zh-CN/tools/duckduckgo-search) -- 另一个无需密钥的提供商
- [Brave Search](/zh-CN/tools/brave-search) -- 提供免费层的结构化结果

---
read_when:
    - 你想要一个自托管的 Web 搜索提供商
    - 你想将 SearXNG 用于 `web_search`
    - 你需要一个注重隐私或气隙环境下的搜索选项
summary: SearXNG Web 搜索——自托管、免密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
    generated_at: "2026-04-05T10:12:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# SearXNG 搜索

OpenClaw 支持将 [SearXNG](https://docs.searxng.org/) 作为**自托管、免密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，会聚合来自 Google、Bing、DuckDuckGo 及其他来源的结果。

优点：

- **免费且不限量** —— 不需要 API key 或商业订阅
- **隐私 / 气隙** —— 查询不会离开你的网络
- **适用于任何地方** —— 不受商业搜索 API 的地区限制

## 设置

<Steps>
  <Step title="运行一个 SearXNG 实例">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或者使用你已有权限访问的任何 SearXNG 部署。生产环境设置请参阅
    [SearXNG documentation](https://docs.searxng.org/)。

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

- `https://` 适用于公共或私有的 SearXNG 主机
- `http://` 仅接受受信任的私有网络或 loopback 主机
- 公共 SearXNG 主机必须使用 `https://`

## 环境变量

将 `SEARXNG_BASE_URL` 作为配置的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

当设置了 `SEARXNG_BASE_URL` 且未显式配置 provider 时，自动检测会自动选择 SearXNG（优先级最低——任何已配置 key 的 API 型 provider 都会优先胜出）。

## 插件配置参考

| 字段 | 描述 |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl` | 你的 SearXNG 实例基础 URL（必填） |
| `categories` | 用逗号分隔的分类，例如 `general`、`news` 或 `science` |
| `language` | 结果的语言代码，例如 `en`、`de` 或 `fr` |

## 说明

- **JSON API** —— 使用 SearXNG 原生 `format=json` 端点，而不是抓取 HTML
- **无 API key** —— 开箱即用，适用于任何 SearXNG 实例
- **基础 URL 验证** —— `baseUrl` 必须是有效的 `http://` 或 `https://`
  URL；公共主机必须使用 `https://`
- **自动检测顺序** —— 在自动检测中，SearXNG 最后检查（顺序 200）。
  已配置 key 的 API 型 providers 会先运行，然后是 DuckDuckGo（顺序 100），再然后是 Ollama Web 搜索（顺序 110）
- **自托管** —— 你可以控制实例、查询和上游搜索引擎
- **Categories** 未配置时默认为 `general`

<Tip>
  为了让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例已在其 `settings.yml` 的 `search.formats` 下启用 `json` 格式。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商与自动检测
- [DuckDuckGo Search](/tools/duckduckgo-search) -- 另一个免密钥回退选项
- [Brave Search](/tools/brave-search) -- 带免费层的结构化结果

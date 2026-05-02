---
read_when:
    - 你想要一个自托管的 Web 搜索提供商
    - 你想使用 SearXNG 进行 web_search
    - 你需要注重隐私或离线隔离的搜索选项
summary: SearXNG 网页搜索 -- 自托管、无需密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
    generated_at: "2026-05-02T05:43:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7689776ff1858afeb6584500d30ff5d076699fa724a8ff16912870aa77d9f889
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支持 [SearXNG](https://docs.searxng.org/) 作为一个**自托管、免密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，会聚合来自 Google、Bing、DuckDuckGo 和其他来源的结果。

优势：

- **免费且无限制** -- 不需要 API key 或商业订阅
- **隐私 / 隔离网络** -- 查询永远不会离开你的网络
- **随处可用** -- 不受商业搜索 API 的区域限制

## 设置

<Steps>
  <Step title="运行一个 SearXNG 实例">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或者使用任何你有权访问的现有 SearXNG 部署。生产环境设置请参阅
    [SearXNG 文档](https://docs.searxng.org/)。

  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    或设置环境变量，让自动检测找到它：

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

- `https://` 适用于公共或私有 SearXNG 主机
- `http://` 只接受可信的专用网络或回环主机
- 公共 SearXNG 主机必须使用 `https://`
- 私有/内部主机使用自托管网络保护；公共 `https://`
  主机保持严格的 Web 搜索保护，并且不能重定向到私有地址

## 环境变量

设置 `SEARXNG_BASE_URL` 作为配置的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

当设置了 `SEARXNG_BASE_URL` 且没有配置显式提供商时，自动检测会自动选择 SearXNG（优先级最低 -- 任何带有密钥的 API 支持提供商都会先胜出）。

## 插件配置参考

| 字段         | 描述                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 实例的基础 URL（必需）                                |
| `categories` | 逗号分隔的类别，例如 `general`、`news` 或 `science`                |
| `language`   | 结果的语言代码，例如 `en`、`de` 或 `fr`                            |

## 注意事项

- **JSON API** -- 使用 SearXNG 原生的 `format=json` 端点，而不是 HTML 抓取
- **无需 API key** -- 开箱即可与任何 SearXNG 实例配合使用
- **基础 URL 验证** -- `baseUrl` 必须是有效的 `http://` 或 `https://`
  URL；公共主机必须使用 `https://`
- **网络保护** -- 私有/内部 SearXNG 端点会选择启用
  专用网络访问；公共 `https://` SearXNG 端点保持严格的 SSRF
  防护
- **自动检测顺序** -- SearXNG 在自动检测中最后检查（顺序 200）。配置了密钥的 API 支持提供商会先运行，然后是 DuckDuckGo（顺序 100），再然后是 Ollama Web 搜索（顺序 110）
- **自托管** -- 你控制实例、查询和上游搜索引擎
- **类别** 未配置时默认为 `general`

<Tip>
  为了让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例已在 `settings.yml` 的 `search.formats` 下启用 `json`
  格式。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [DuckDuckGo 搜索](/zh-CN/tools/duckduckgo-search) -- 另一个免密钥备用方案
- [Brave 搜索](/zh-CN/tools/brave-search) -- 带免费层的结构化结果

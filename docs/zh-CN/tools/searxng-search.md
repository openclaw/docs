---
read_when:
    - 你想要一个自托管的 Web 搜索提供商
    - 你想使用 SearXNG 进行 web_search
    - 你需要一个注重隐私或适用于隔离网络的搜索选项
summary: SearXNG Web 搜索 -- 自托管、无需密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
    generated_at: "2026-05-02T07:19:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支持 [SearXNG](https://docs.searxng.org/) 作为**自托管、
无密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，
可聚合来自 Google、Bing、DuckDuckGo 和其他来源的结果。

优点：

- **免费且无限制** -- 无需 API key 或商业订阅
- **隐私 / 隔离网络** -- 查询永远不会离开你的网络
- **随处可用** -- 不受商业搜索 API 区域限制

## 设置

<Steps>
  <Step title="运行一个 SearXNG 实例">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用你有权访问的任何现有 SearXNG 部署。生产环境设置请参阅
    [SearXNG 文档](https://docs.searxng.org/)。

  </Step>
  <Step title="配置">
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

`baseUrl` 字段也接受 SecretRef 对象。

传输规则：

- `https://` 可用于公共或私有 SearXNG 主机
- `http://` 只接受可信私有网络或回环主机
- 公共 SearXNG 主机必须使用 `https://`
- 私有/内部主机使用自托管网络防护；公共 `https://`
  主机保留严格的 Web 搜索防护，且不能重定向到私有
  地址

## 环境变量

将 `SEARXNG_BASE_URL` 作为配置的替代方式设置：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

设置 `SEARXNG_BASE_URL` 且未配置显式提供商时，自动检测
会自动选择 SearXNG（优先级最低 -- 任何带有密钥的 API 后端提供商
都会先胜出）。

## 插件配置参考

| 字段         | 描述                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 实例的基础 URL（必需）                       |
| `categories` | 逗号分隔的类别，例如 `general`、`news` 或 `science` |
| `language`   | 结果的语言代码，例如 `en`、`de` 或 `fr`              |

## 注意事项

- **JSON API** -- 使用 SearXNG 原生的 `format=json` 端点，而不是抓取 HTML
- **图片结果 URL** -- 当 SearXNG 返回直接图片 URL 时，图片类别结果会包含 `img_src`
- **无需 API key** -- 开箱即可配合任何 SearXNG 实例使用
- **基础 URL 验证** -- `baseUrl` 必须是有效的 `http://` 或 `https://`
  URL；公共主机必须使用 `https://`
- **网络防护** -- 私有/内部 SearXNG 端点选择启用
  私有网络访问；公共 `https://` SearXNG 端点保留严格的 SSRF
  防护
- **自动检测顺序** -- 在自动检测中，SearXNG 最后检查（顺序 200）。
  先运行已配置密钥的 API 后端提供商，然后是
  DuckDuckGo（顺序 100），再然后是 Ollama Web 搜索（顺序 110）
- **自托管** -- 由你控制实例、查询和上游搜索引擎
- **类别** 未配置时默认为 `general`
- **类别回退** -- 如果非 `general` 类别请求成功但
  返回零个结果，OpenClaw 会先使用 `general` 对同一查询重试一次，
  然后才返回空结果集

<Tip>
  要让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例已在其 `settings.yml` 的 `search.formats` 下启用 `json`
  格式。
</Tip>

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [DuckDuckGo 搜索](/zh-CN/tools/duckduckgo-search) -- 另一种无密钥回退方案
- [Brave 搜索](/zh-CN/tools/brave-search) -- 带免费套餐的结构化结果

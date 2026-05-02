---
read_when:
    - 你想要一个自托管的 Web 搜索提供商
    - 你想使用 SearXNG 进行 web_search
    - 你需要注重隐私或隔离网络的搜索选项
summary: SearXNG Web 搜索 -- 自托管、无需密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
    generated_at: "2026-05-02T06:00:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8743325d4d4fdccad04956154bb87b1bd7f7155fb063a09cee3733a73e8d0c30
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支持将 [SearXNG](https://docs.searxng.org/) 用作**自托管、
免密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，
会聚合来自 Google、Bing、DuckDuckGo 和其他来源的结果。

优势：

- **免费且无限制** -- 不需要 API key 或商业订阅
- **隐私 / 隔离网络** -- 查询永远不会离开你的网络
- **随处可用** -- 不受商业搜索 API 的地区限制

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

- `https://` 适用于公开或私有 SearXNG 主机
- `http://` 只接受受信任的私有网络或回环主机
- 公开 SearXNG 主机必须使用 `https://`
- 私有/内部主机使用自托管网络防护；公开 `https://`
  主机仍使用严格的 Web 搜索防护，并且不能重定向到私有
  地址

## 环境变量

将 `SEARXNG_BASE_URL` 设为配置的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

当设置了 `SEARXNG_BASE_URL` 且未配置显式提供商时，自动检测会
自动选择 SearXNG（优先级最低 -- 任何配置了密钥的 API 支持提供商
都会先胜出）。

## 插件配置参考

| 字段         | 说明                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `baseUrl`    | 你的 SearXNG 实例的基础 URL（必填）                                  |
| `categories` | 逗号分隔的分类，例如 `general`、`news` 或 `science`                  |
| `language`   | 结果的语言代码，例如 `en`、`de` 或 `fr`                              |

## 备注

- **JSON API** -- 使用 SearXNG 原生 `format=json` 端点，而不是 HTML 抓取
- **图片结果 URL** -- 当 SearXNG 返回直接图片 URL 时，图片分类结果会包含 `img_src`
- **无需 API key** -- 开箱即可与任何 SearXNG 实例配合使用
- **基础 URL 验证** -- `baseUrl` 必须是有效的 `http://` 或 `https://`
  URL；公开主机必须使用 `https://`
- **网络防护** -- 私有/内部 SearXNG 端点选择启用
  私有网络访问；公开 `https://` SearXNG 端点保留严格 SSRF
  保护
- **自动检测顺序** -- 在自动检测中，SearXNG 最后检查（顺序 200）。
  已配置密钥的 API 支持提供商先运行，然后是 DuckDuckGo（顺序 100），再然后是 Ollama Web 搜索（顺序 110）
- **自托管** -- 你控制实例、查询和上游搜索引擎
- **分类**未配置时默认使用 `general`

<Tip>
  要让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例已在其
  `settings.yml` 的 `search.formats` 下启用 `json`
  格式。
</Tip>

## 相关

- [Web 搜索概览](/zh-CN/tools/web) -- 所有提供商和自动检测
- [DuckDuckGo 搜索](/zh-CN/tools/duckduckgo-search) -- 另一个免密钥回退方案
- [Brave Search](/zh-CN/tools/brave-search) -- 提供免费套餐的结构化结果

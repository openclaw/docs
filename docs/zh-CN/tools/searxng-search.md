---
read_when:
- 你想要一个自托管的 Web 搜索提供商
- 你想将 SearXNG 用于 `web_search`
- 你需要一个注重隐私或适用于隔离网络环境的搜索方案
summary: SearXNG Web 搜索 —— 自托管、免密钥的元搜索提供商
title: SearXNG 搜索
x-i18n:
  generated_at: '2026-04-23T21:09:52Z'
  model: gpt-5.4
  provider: openai
  source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
  source_path: tools/searxng-search.md
  workflow: 15
---
OpenClaw 支持将 [SearXNG](https://docs.searxng.org/) 作为一个**自托管、
免密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，
可聚合来自 Google、Bing、DuckDuckGo 以及其他来源的结果。

优势：

- **免费且不限量** —— 不需要 API 密钥，也不需要商业订阅
- **隐私 / 隔离网络** —— 查询不会离开你的网络
- **适用于任何环境** —— 没有商业搜索 API 的区域限制

## 设置

<Steps>
  <Step title="运行一个 SearXNG 实例">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用你已有权限访问的任意 SearXNG 部署。生产环境设置请参见
    [SearXNG 文档](https://docs.searxng.org/)。

  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # 选择 "searxng" 作为提供商
    ```

    或设置环境变量，让自动检测发现它：

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
            categories: "general,news", // 可选
            language: "en", // 可选
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
- `http://` 仅接受用于受信任的私有网络或 loopback 主机
- 公开 SearXNG 主机必须使用 `https://`

## 环境变量

可将 `SEARXNG_BASE_URL` 作为配置的替代方案：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

当设置了 `SEARXNG_BASE_URL` 且未显式配置提供商时，自动检测
会自动选择 SearXNG（优先级最低 —— 任何带密钥的 API 驱动提供商都优先）。

## 插件配置参考

| 字段 | 描述 |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl` | 你的 SearXNG 实例的基础 URL（必填） |
| `categories` | 用逗号分隔的分类，例如 `general`、`news` 或 `science` |
| `language` | 结果的语言代码，例如 `en`、`de` 或 `fr` |

## 说明

- **JSON API** —— 使用 SearXNG 原生 `format=json` 端点，而不是抓取 HTML
- **无 API 密钥** —— 开箱即用，适用于任意 SearXNG 实例
- **Base URL 验证** —— `baseUrl` 必须是有效的 `http://` 或 `https://`
  URL；公开主机必须使用 `https://`
- **自动检测顺序** —— 在自动检测中，SearXNG 最后检查（顺序 200）。带已配置密钥的 API 驱动提供商会先运行，然后是
  DuckDuckGo（顺序 100），再然后是 Ollama Web 搜索（顺序 110）
- **自托管** —— 你可以控制实例、查询和上游搜索引擎
- **categories** 在未配置时默认为 `general`

<Tip>
  若要让 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例已在其 `settings.yml` 的 `search.formats` 下启用 `json`
  格式。
</Tip>

## 相关内容

- [Web 搜索概览](/zh-CN/tools/web) —— 所有提供商与自动检测
- [DuckDuckGo 搜索](/zh-CN/tools/duckduckgo-search) —— 另一个免密钥回退方案
- [Brave 搜索](/zh-CN/tools/brave-search) —— 带免费层的结构化结果

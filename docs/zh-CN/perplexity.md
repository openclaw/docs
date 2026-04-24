---
read_when:
    - 你想将 Perplexity Search 用于 Web 搜索
    - 你需要设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
summary: 用于 `web_search` 的 Perplexity Search API 以及 Sonar / OpenRouter 兼容性
title: Perplexity 搜索（旧版路径）
x-i18n:
    generated_at: "2026-04-24T04:04:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw 支持将 Perplexity Search API 作为 `web_search` 提供商。
它会返回包含 `title`、`url` 和 `snippet` 字段的结构化结果。

为保持兼容性，OpenClaw 也支持旧版的 Perplexity Sonar / OpenRouter 设置。
如果你使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 密钥，或设置了 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，则该提供商会切换到 chat-completions 路径，并返回带引用的 AI 合成答案，而不是结构化的 Search API 结果。

## 获取 Perplexity API 密钥

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建一个 Perplexity 账户
2. 在控制台中生成一个 API 密钥
3. 将该密钥存储在配置中，或在 Gateway 网关环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果你已经在通过 OpenRouter 使用 Perplexity Sonar，请保留 `provider: "perplexity"`，并在 Gateway 网关环境中设置 `OPENROUTER_API_KEY`，或将 `sk-or-...` 密钥存储在 `plugins.entries.perplexity.config.webSearch.apiKey` 中。

可选兼容性控制项：

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 配置示例

### 原生 Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar 兼容性

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## 在哪里设置密钥

**通过配置：**运行 `openclaw configure --section web`。它会将密钥存储到
`~/.openclaw/openclaw.json` 中的 `plugins.entries.perplexity.config.webSearch.apiKey`。
该字段也接受 SecretRef 对象。

**通过环境变量：**在 Gateway 网关进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。
对于 Gateway 网关安装，请将其放入
`~/.openclaw/.env`（或你的服务环境）中。参见[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

如果已配置 `provider: "perplexity"`，且 Perplexity 密钥 SecretRef 未解析且没有环境变量后备，则启动 / 重载会快速失败。

## 工具参数

这些参数适用于原生 Perplexity Search API 路径。

| 参数 | 描述 |
| --------------------- | ---------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 要返回的结果数量（1-10，默认：5） |
| `country` | 2 字母 ISO 国家代码（例如 `"US"`、`"DE"`） |
| `language` | ISO 639-1 语言代码（例如 `"en"`、`"de"`、`"fr"`） |
| `freshness` | 时间筛选：`day`（24 小时）、`week`、`month` 或 `year` |
| `date_after` | 仅返回在此日期之后发布的结果（YYYY-MM-DD） |
| `date_before` | 仅返回在此日期之前发布的结果（YYYY-MM-DD） |
| `domain_filter` | 域名允许列表 / 拒绝列表数组（最多 20 个） |
| `max_tokens` | 内容总预算（默认：25000，最大：1000000） |
| `max_tokens_per_page` | 每页 token 上限（默认：2048） |

对于旧版 Sonar / OpenRouter 兼容路径：

- 接受 `query`、`count` 和 `freshness`
- 其中的 `count` 仅用于兼容；响应仍然是一个带引用的合成答案，而不是 N 条结果列表
- Search API 专属筛选项，如 `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page`
  会返回显式错误

**示例：**

```javascript
// 按国家和语言限定的搜索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近结果（过去一周）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日期范围搜索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名筛选（允许列表）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 域名筛选（拒绝列表 - 使用 - 前缀）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 提取更多内容
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 域名筛选规则

- 每个筛选器最多 20 个域名
- 同一请求中不能混用允许列表和拒绝列表
- 对拒绝列表条目使用 `-` 前缀（例如 `["-reddit.com"]`）

## 说明

- Perplexity Search API 返回结构化的 Web 搜索结果（`title`、`url`、`snippet`）
- OpenRouter 或显式设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 会为了兼容性将 Perplexity 切换回 Sonar chat completions
- Sonar / OpenRouter 兼容模式返回一个带引用的合成答案，而不是结构化结果行
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）

有关完整的 `web_search` 配置，请参阅 [Web tools](/zh-CN/tools/web)。
更多详情请参阅 [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart)。

## 相关内容

- [Perplexity 搜索](/zh-CN/tools/perplexity-search)
- [Web 搜索](/zh-CN/tools/web)

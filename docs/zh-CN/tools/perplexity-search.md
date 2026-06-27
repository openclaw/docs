---
read_when:
    - 你想使用 Perplexity Search 进行 Web 搜索
    - 你需要设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
summary: Perplexity Search API 以及 web_search 的 Sonar/OpenRouter 兼容性
title: Perplexity 搜索
x-i18n:
    generated_at: "2026-06-27T03:30:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw 支持将 Perplexity Search API 用作 `web_search` 提供商。
它会返回包含 `title`、`url` 和 `snippet` 字段的结构化结果。

为保持兼容性，OpenClaw 也支持旧版 Perplexity Sonar/OpenRouter 设置。
如果你使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 密钥，或设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，该提供商会切换到 chat-completions 路径，并返回带引用的 AI 合成答案，而不是结构化的 Search API 结果。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 获取 Perplexity API key

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建 Perplexity 账号
2. 在仪表盘中生成 API key
3. 将密钥存储到配置中，或在 Gateway 网关环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果你已经在为 Perplexity Sonar 使用 OpenRouter，请保留 `provider: "perplexity"`，并在 Gateway 网关环境中设置 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中存储 `sk-or-...` 密钥。

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

**通过配置：**运行 `openclaw configure --section web`。它会将密钥存储在
`~/.openclaw/openclaw.json` 中的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。
该字段也接受 SecretRef 对象。

**通过环境：**在 Gateway 网关进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。
对于 gateway 安装，请将其放入
`~/.openclaw/.env`（或你的服务环境）。参见[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

如果已配置 `provider: "perplexity"`，且 Perplexity 密钥 SecretRef 未解析并且没有环境回退，启动/重载会快速失败。

## 工具参数

这些参数适用于原生 Perplexity Search API 路径。

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
要返回的结果数量（1-10）。
</ParamField>

<ParamField path="country" type="string">
2 字母 ISO 国家/地区代码（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 语言代码（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤器 - `day` 表示 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回此日期之后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回此日期之前发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="domain_filter" type="string[]">
域名允许列表/拒绝列表数组（最多 20 个）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
总内容预算（最多 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
每页 token 限制。
</ParamField>

对于旧版 Sonar/OpenRouter 兼容路径：

- 接受 `query`、`count` 和 `freshness`
- `count` 在此处仅用于兼容；响应仍然是一个带引用的合成答案，而不是 N 个结果的列表
- 仅 Search API 支持的过滤器，例如 `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page`
  会返回明确错误

**示例：**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 域名过滤规则

- 每个过滤器最多 20 个域名
- 不能在同一个请求中混用允许列表和拒绝列表
- 对拒绝列表条目使用 `-` 前缀（例如 `["-reddit.com"]`）

## 说明

- Perplexity Search API 返回结构化网页搜索结果（`title`、`url`、`snippet`）
- OpenRouter 或显式的 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 会将 Perplexity 切回 Sonar chat completions 以保持兼容性
- Sonar/OpenRouter 兼容性返回一个带引用的合成答案，而不是结构化结果行
- 默认情况下结果会缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）

## 相关

<CardGroup cols={2}>
  <Card title="Web 搜索概览" href="/zh-CN/tools/web" icon="globe">
    所有提供商和自动检测规则。
  </Card>
  <Card title="Brave 搜索" href="/zh-CN/tools/brave-search" icon="shield">
    带国家/地区和语言过滤器的结构化结果。
  </Card>
  <Card title="Exa 搜索" href="/zh-CN/tools/exa-search" icon="magnifying-glass">
    带内容提取的神经搜索。
  </Card>
  <Card title="Perplexity Search API 文档" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    官方 Perplexity Search API 快速开始和参考。
  </Card>
</CardGroup>

---
read_when:
    - 你想使用 Perplexity Search 进行 Web 搜索
    - 你需要设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`
summary: 用于 `web_search` 的 Perplexity Search API 及 Sonar/OpenRouter 兼容性
title: Perplexity 搜索
x-i18n:
    generated_at: "2026-07-11T21:01:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw 支持将 Perplexity Search API 用作 `web_search` 提供商。它返回包含 `title`、`url` 和 `snippet` 字段的结构化结果。

为保持兼容性，OpenClaw 还支持旧版 Perplexity Sonar/OpenRouter 设置。如果你使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 密钥，或设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，提供商将切换到聊天补全路径，并返回带引用的 AI 综合回答，而不是结构化的 Search API 结果。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 获取 Perplexity API 密钥

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建 Perplexity 账户。
2. 在控制面板中生成 API 密钥。
3. 将密钥存储在配置中，或在 Gateway 网关环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果你已使用 OpenRouter 调用 Perplexity Sonar，请保留 `provider: "perplexity"`，并在 Gateway 网关环境中设置 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中存储 `sk-or-...` 密钥。

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

### OpenRouter / Sonar 兼容模式

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

## 密钥设置位置

**通过配置：**运行 `openclaw configure --section web`。该命令会将密钥存储到 `~/.openclaw/openclaw.json` 的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。该字段也接受 SecretRef 对象。

**通过环境：**在 Gateway 网关进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`（或你的服务环境）中。请参阅[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

如果已配置 `provider: "perplexity"`，但 Perplexity 密钥 SecretRef 无法解析且没有环境变量回退，启动或重新加载将快速失败。

## 工具参数

以下参数适用于原生 Perplexity Search API 路径。

<ParamField path="query" type="string" required>
搜索查询。
</ParamField>

<ParamField path="count" type="number" default="5">
要返回的结果数量（1-10）。
</ParamField>

<ParamField path="country" type="string">
两字母 ISO 国家/地区代码（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 语言代码（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间筛选条件——`day` 表示 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回在此日期之后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回在此日期之前发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="domain_filter" type="string[]">
域名允许列表/拒绝列表数组（最多 20 个）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
内容总预算（最多 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
每页 token 上限。
</ParamField>

对于旧版 Sonar/OpenRouter 兼容路径：

- 接受 `query`、`count` 和 `freshness`。
- 在该路径中，`count` 仅用于兼容；响应仍是一个带引用的综合回答，而不是包含 N 个结果的列表。
- 仅限 Search API 的筛选条件（`country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`）会返回明确错误。

**示例：**

```javascript
// 针对特定国家/地区和语言的搜索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近的结果（过去一周）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 按日期范围搜索
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

// 域名筛选（拒绝列表——添加 - 前缀）
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

- 每个筛选条件最多包含 20 个域名。
- 同一请求中不能混合允许列表和拒绝列表条目。
- 对拒绝列表条目使用 `-` 前缀（例如 `["-reddit.com"]`）。

## 注意事项

- Perplexity Search API 返回结构化 Web 搜索结果（`title`、`url`、`snippet`）。
- 使用 OpenRouter，或显式设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，会将 Perplexity 切换回 Sonar 聊天补全以保持兼容性。
- Sonar/OpenRouter 兼容模式返回一个带引用的综合回答，而不是结构化结果行。
- 默认情况下，结果会缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。

## 相关内容

<CardGroup cols={2}>
  <Card title="Web 搜索概览" href="/zh-CN/tools/web" icon="globe">
    所有提供商和自动检测规则。
  </Card>
  <Card title="Brave 搜索" href="/zh-CN/tools/brave-search" icon="shield">
    支持国家/地区和语言筛选的结构化结果。
  </Card>
  <Card title="Exa 搜索" href="/zh-CN/tools/exa-search" icon="magnifying-glass">
    支持内容提取的神经搜索。
  </Card>
  <Card title="Perplexity Search API 文档" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Perplexity Search API 官方快速开始和参考文档。
  </Card>
</CardGroup>

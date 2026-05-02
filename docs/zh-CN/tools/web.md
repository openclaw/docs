---
read_when:
    - 你想启用或配置 web_search
    - 你想启用或配置 x_search
    - 你需要选择一个搜索提供商
    - 你想了解自动检测和提供商回退
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜索网页、搜索 X 帖子，或获取页面内容
title: Web 搜索
x-i18n:
    generated_at: "2026-05-02T03:43:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 873d953c068096a926940eb7065961814900417afdfbcf04946a6cefcd58f578
    source_path: tools/web.md
    workflow: 16
---

`web_search` 工具使用你配置的提供商搜索 Web，并返回结果。结果会按查询缓存 15 分钟（可配置）。

OpenClaw 还包含用于 X（前 Twitter）帖子的 `x_search`，以及用于轻量级 URL 抓取的 `web_fetch`。在这个阶段，`web_fetch` 保持本地运行，而 `web_search` 和 `x_search` 可以在底层使用 xAI Responses。

<Info>
  `web_search` 是一个轻量级 HTTP 工具，不是浏览器自动化。对于
  JS 密集型网站或登录场景，请使用 [Web 浏览器](/zh-CN/tools/browser)。对于
  抓取特定 URL，请使用 [Web Fetch](/zh-CN/tools/web-fetch)。
</Info>

## 快速开始

<Steps>
  <Step title="选择提供商">
    选择一个提供商并完成任何必需的设置。有些提供商不需要密钥，而其他提供商使用 API key。详情请参阅下面的提供商页面。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    这会存储提供商和任何所需凭证。你也可以设置一个环境变量（例如 `BRAVE_API_KEY`），并对 API 支持的提供商跳过此步骤。
  </Step>
  <Step title="使用">
    智能体现在可以调用 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    对于 X 帖子，请使用：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 选择提供商

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-CN/tools/brave-search">
    带摘要片段的结构化结果。支持 `llm-context` 模式，以及国家/语言筛选。提供免费套餐。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-CN/tools/duckduckgo-search">
    免密钥回退。不需要 API key。基于非官方 HTML 的集成。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-CN/tools/exa-search">
    神经网络 + 关键词搜索，并支持内容提取（高亮、文本、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-CN/tools/firecrawl">
    结构化结果。最适合与 `firecrawl_search` 和 `firecrawl_scrape` 搭配，用于深度提取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-CN/tools/gemini-search">
    通过 Google Search grounding 提供带引用的 AI 合成答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-CN/tools/grok-search">
    通过 xAI Web grounding 提供带引用的 AI 合成答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-CN/tools/kimi-search">
    通过 Moonshot Web 搜索提供带引用的 AI 合成答案。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-CN/tools/minimax-search">
    通过 MiniMax Coding Plan search API 提供结构化结果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-CN/tools/ollama-search">
    通过已登录的本地 Ollama 主机或托管的 Ollama API 搜索。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-CN/tools/perplexity-search">
    带内容提取控制和域名筛选的结构化结果。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-CN/tools/searxng-search">
    自托管元搜索。不需要 API key。聚合 Google、Bing、DuckDuckGo 等。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-CN/tools/tavily">
    带搜索深度、主题筛选，以及用于 URL 提取的 `tavily_extract` 的结构化结果。
  </Card>
</CardGroup>

### 提供商比较

| 提供商                                    | 结果样式                   | 筛选                                             | API key                                                                                 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-CN/tools/brave-search)              | 结构化摘要片段             | 国家、语言、时间、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/zh-CN/tools/duckduckgo-search)    | 结构化摘要片段             | --                                               | 无（免密钥）                                                                            |
| [Exa](/zh-CN/tools/exa-search)                  | 结构化 + 已提取内容        | 神经网络/关键词模式、日期、内容提取              | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-CN/tools/firecrawl)             | 结构化摘要片段             | 通过 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-CN/tools/gemini-search)            | AI 合成 + 引用             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-CN/tools/grok-search)                | AI 合成 + 引用             | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/zh-CN/tools/kimi-search)                | AI 合成 + 引用             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-CN/tools/minimax-search)   | 结构化摘要片段             | 区域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/zh-CN/tools/ollama-search) | 结构化摘要片段             | --                                               | 已登录本地主机无需密钥；直接 `https://ollama.com` 搜索使用 `OLLAMA_API_KEY`             |
| [Perplexity](/zh-CN/tools/perplexity-search)    | 结构化摘要片段             | 国家、语言、时间、域名、内容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-CN/tools/searxng-search)          | 结构化摘要片段             | 分类、语言                                       | 无（自托管）                                                                            |
| [Tavily](/zh-CN/tools/tavily)                   | 结构化摘要片段             | 通过 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自动检测

## 原生 OpenAI Web 搜索

当 OpenClaw Web 搜索已启用且未固定托管提供商时，直接 OpenAI Responses 模型会自动使用 OpenAI 托管的 `web_search` 工具。这是内置 OpenAI 插件中由提供商拥有的行为，只适用于原生 OpenAI API 流量，不适用于 OpenAI 兼容代理基础 URL 或 Azure 路由。将 `tools.web.search.provider` 设置为另一个提供商（例如 `brave`），可为 OpenAI 模型保留托管的 `web_search` 工具；或设置 `tools.web.search.enabled: false`，以同时禁用托管搜索和原生 OpenAI 搜索。

## 原生 Codex Web 搜索

支持 Codex 的模型可以选择使用提供商原生 Responses `web_search` 工具，而不是 OpenClaw 托管的 `web_search` 函数。

- 在 `tools.web.search.openaiCodex` 下配置它
- 它只会为支持 Codex 的模型激活（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的提供商）
- 托管的 `web_search` 仍适用于非 Codex 模型
- `mode: "cached"` 是默认且推荐的设置
- `tools.web.search.enabled: false` 会同时禁用托管搜索和原生搜索

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

如果启用了原生 Codex 搜索，但当前模型不支持 Codex，OpenClaw 会保留正常的托管 `web_search` 行为。

## 设置 Web 搜索

文档和设置流程中的提供商列表按字母顺序排列。自动检测会保留单独的优先级顺序。

如果未设置 `provider`，OpenClaw 会按此顺序检查提供商，并使用第一个已就绪的提供商：

首先是 API 支持的提供商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** -- `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`（顺序 20）
4. **Grok** -- `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`（顺序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）

之后是免密钥回退：

10. **DuckDuckGo** -- 不需要账号或 API key 的免密钥 HTML 回退（顺序 100）
11. **Ollama Web Search** -- 当你配置的本地 Ollama 主机可访问且已通过 `ollama signin` 登录时，通过它提供免密钥回退；当主机需要时可复用 Ollama provider bearer auth；配置了 `OLLAMA_API_KEY` 时可调用直接 `https://ollama.com` 搜索（顺序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

如果未检测到提供商，它会回退到 Brave（你会看到提示你配置密钥的缺失密钥错误）。

<Note>
  所有提供商密钥字段都支持 SecretRef 对象。对于内置的 API 支持 Web 搜索提供商，包括 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Perplexity 和 Tavily，位于 `plugins.entries.<plugin>.config.webSearch.apiKey` 下的插件作用域 SecretRef 都会被解析；无论提供商是通过 `tools.web.search.provider` 显式选择，还是通过自动检测选择。在自动检测模式下，OpenClaw 只解析所选提供商的密钥 -- 未选中的 SecretRef 保持非活动状态，因此你可以配置多个提供商，而不会为未使用的提供商支付解析成本。
</Note>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

提供商专用配置（API key、基础 URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。示例请参阅提供商页面。

`web_fetch` 回退提供商选择是单独的：

- 使用 `tools.web.fetch.provider` 选择它
- 或省略该字段，让 OpenClaw 从可用凭证中自动检测第一个已就绪的 Web 抓取提供商
- 非沙箱隔离的 `web_fetch` 可以使用声明了 `contracts.webFetchProviders` 的已安装插件提供商；沙箱隔离的抓取保持仅使用内置提供商
- 目前内置的 Web 抓取提供商是 Firecrawl，配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下

当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，OpenClaw 还可以询问：

- Moonshot API 区域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认 Kimi Web 搜索模型（默认为 `kimi-k2.6`）

对于 `x_search`，配置 `plugins.entries.xai.config.xSearch.*`。它使用与 Grok 网页搜索相同的 `XAI_API_KEY` 回退。
旧版 `tools.web.x_search.*` 配置会由 `openclaw doctor --fix` 自动迁移。
当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 Grok 时，OpenClaw 也可以使用同一个密钥提供可选的 `x_search` 设置。
这是 Grok 路径中的一个单独后续步骤，不是单独的顶层网页搜索提供商选项。如果你选择其他提供商，OpenClaw 不会显示 `x_search` 提示。

### 存储 API 密钥

<Tabs>
  <Tab title="Config file">
    运行 `openclaw configure --section web`，或直接设置密钥：

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Environment variable">
    在 Gateway 网关进程环境中设置提供商环境变量：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    对于 Gateway 网关安装，请将它放入 `~/.openclaw/.env`。
    参见 [环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数                  | 说明                                                   |
| --------------------- | ------------------------------------------------------ |
| `query`               | 搜索查询（必填）                                       |
| `count`               | 返回的结果数量（1-10，默认值：5）                      |
| `country`             | 2 字母 ISO 国家/地区代码（例如 "US"、"DE"）            |
| `language`            | ISO 639-1 语言代码（例如 "en"、"de"）                  |
| `search_lang`         | 搜索语言代码（仅 Brave）                               |
| `freshness`           | 时间过滤器：`day`、`week`、`month` 或 `year`           |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                         |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                         |
| `ui_lang`             | UI 语言代码（仅 Brave）                                |
| `domain_filter`       | 域名允许列表/拒绝列表数组（仅 Perplexity）             |
| `max_tokens`          | 总内容预算，默认 25000（仅 Perplexity）                |
| `max_tokens_per_page` | 每页 token 限制，默认 2048（仅 Perplexity）            |

<Warning>
  并非所有参数都适用于所有提供商。Brave `llm-context` 模式会拒绝 `ui_lang`；`date_before` 也需要 `date_after`，因为 Brave 自定义新鲜度范围要求同时提供开始日期和结束日期。
  Gemini、Grok 和 Kimi 会返回一个带引用的综合答案。它们接受 `count` 以兼容共享工具，但它不会改变基于依据的答案形态。
  当你使用 Sonar/OpenRouter 兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）时，Perplexity 的行为相同。
  SearXNG 仅对受信任的私有网络或 local loopback 主机接受 `http://`；
  公共 SearXNG 端点必须使用 `https://`。
  Firecrawl 和 Tavily 通过 `web_search` 仅支持 `query` 和 `count`
  -- 如需高级选项，请使用它们的专用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（原 Twitter）帖子，并返回带引用的 AI 综合答案。它接受自然语言查询和可选的结构化过滤器。OpenClaw 仅在服务此工具调用的请求中启用内置 xAI `x_search` 工具。

<Note>
  xAI 文档说明 `x_search` 支持关键词搜索、语义搜索、用户搜索和主题串获取。对于转帖、回复、书签或浏览量等单帖互动统计，优先使用针对准确帖子 URL 或状态 ID 的定向查找。宽泛的关键词搜索可能找到正确帖子，但返回的单帖元数据不够完整。一个好的模式是：先定位帖子，然后运行第二个聚焦该准确帖子的 `x_search` 查询。
</Note>

### x_search 配置

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

当设置了 `plugins.entries.xai.config.xSearch.baseUrl` 时，`x_search` 会发布到 `<baseUrl>/responses`。如果省略该字段，它会回退到 `plugins.entries.xai.config.webSearch.baseUrl`，再回退到旧版 `tools.web.search.grok.baseUrl`，最后回退到公共 xAI 端点。

### x_search 参数

| 参数                         | 说明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜索查询（必填）                                       |
| `allowed_x_handles`          | 将结果限制为特定 X handle                              |
| `excluded_x_handles`         | 排除特定 X handle                                      |
| `from_date`                  | 仅包含此日期当天或之后的帖子（YYYY-MM-DD）             |
| `to_date`                    | 仅包含此日期当天或之前的帖子（YYYY-MM-DD）             |
| `enable_image_understanding` | 允许 xAI 检查匹配帖子附带的图片                        |
| `enable_video_understanding` | 允许 xAI 检查匹配帖子附带的视频                        |

### x_search 示例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 示例

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具配置文件

如果你使用工具配置文件或允许列表，请添加 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## 相关内容

- [Web Fetch](/zh-CN/tools/web-fetch) -- 获取 URL 并提取可读内容
- [Web Browser](/zh-CN/tools/browser) -- 面向 JS 密集型站点的完整浏览器自动化
- [Grok Search](/zh-CN/tools/grok-search) -- 将 Grok 用作 `web_search` 提供商
- [Ollama Web 搜索](/zh-CN/tools/ollama-search) -- 通过你的 Ollama 主机进行免密钥网页搜索

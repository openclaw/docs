---
read_when:
    - 你想要启用或配置 `web_search`
    - 你想要启用或配置 `x_search`
    - 你需要选择一个搜索提供商
    - 你想要了解自动检测和提供商回退机制
sidebarTitle: Web Search
summary: '`web_search`、`x_search` 和 `web_fetch` —— 搜索网页、搜索 X 帖子，或抓取页面内容'
title: Web 搜索
x-i18n:
    generated_at: "2026-04-22T21:50:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e568670e1e15f195dbac1a249723a2ad873d6c49217575959b8eea2cb14ef75
    source_path: tools/web.md
    workflow: 15
---

# Web 搜索

`web_search` 工具使用你配置的提供商搜索网页并返回结果。结果会按查询缓存 15 分钟（可配置）。

OpenClaw 还包含用于搜索 X（原 Twitter）帖子的 `x_search`，以及用于轻量级 URL 抓取的 `web_fetch`。在此阶段，`web_fetch` 保持本地运行，而 `web_search` 和 `x_search` 可以在底层使用 xAI Responses。

<Info>
  `web_search` 是一个轻量级 HTTP 工具，不是浏览器自动化工具。对于大量依赖 JS 的网站或需要登录的场景，请使用 [Web Browser](/zh-CN/tools/browser)。如果要抓取特定 URL，请使用 [Web Fetch](/zh-CN/tools/web-fetch)。
</Info>

## 快速开始

<Steps>
  <Step title="选择提供商">
    选择一个提供商并完成所需设置。有些提供商无需密钥，而有些需要使用 API 密钥。详情请参阅下方的提供商页面。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    这会存储提供商以及所需的任何凭证。你也可以设置一个环境变量（例如 `BRAVE_API_KEY`），并在使用基于 API 的提供商时跳过这一步。
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
    带摘要片段的结构化结果。支持 `llm-context` 模式、国家/语言筛选。提供免费层级。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-CN/tools/duckduckgo-search">
    无需密钥的回退选项。不需要 API 密钥。基于非官方 HTML 集成。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-CN/tools/exa-search">
    神经搜索 + 关键词搜索，并支持内容提取（高亮、文本、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-CN/tools/firecrawl">
    结构化结果。最适合与 `firecrawl_search` 和 `firecrawl_scrape` 搭配使用，以进行深度提取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-CN/tools/gemini-search">
    通过 Google 搜索 grounding 提供带引用的 AI 合成答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-CN/tools/grok-search">
    通过 xAI 网页 grounding 提供带引用的 AI 合成答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-CN/tools/kimi-search">
    通过 Moonshot 网页搜索提供带引用的 AI 合成答案。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-CN/tools/minimax-search">
    通过 MiniMax Coding Plan 搜索 API 提供结构化结果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-CN/tools/ollama-search">
    通过你配置的 Ollama 主机提供无密钥搜索。需要先执行 `ollama signin`。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-CN/tools/perplexity-search">
    提供带内容提取控制和域名筛选的结构化结果。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-CN/tools/searxng-search">
    自托管元搜索。无需 API 密钥。聚合 Google、Bing、DuckDuckGo 等来源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-CN/tools/tavily">
    提供带搜索深度、主题筛选以及用于 URL 提取的 `tavily_extract` 的结构化结果。
  </Card>
</CardGroup>

### 提供商对比

| 提供商 | 结果样式 | 筛选项 | API 密钥 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/zh-CN/tools/brave-search)              | 结构化摘要片段             | 国家、语言、时间、`llm-context` 模式             | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/zh-CN/tools/duckduckgo-search)    | 结构化摘要片段             | --                                               | 无（无需密钥）                                                                   |
| [Exa](/zh-CN/tools/exa-search)                  | 结构化 + 提取内容          | 神经/关键词模式、日期、内容提取                  | `EXA_API_KEY`                                                                    |
| [Firecrawl](/zh-CN/tools/firecrawl)             | 结构化摘要片段             | 通过 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/zh-CN/tools/gemini-search)            | AI 合成 + 引用             | --                                               | `GEMINI_API_KEY`                                                                 |
| [Grok](/zh-CN/tools/grok-search)                | AI 合成 + 引用             | --                                               | `XAI_API_KEY`                                                                    |
| [Kimi](/zh-CN/tools/kimi-search)                | AI 合成 + 引用             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/zh-CN/tools/minimax-search)   | 结构化摘要片段             | 区域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/zh-CN/tools/ollama-search) | 结构化摘要片段             | --                                               | 默认无；需要执行 `ollama signin`，也可复用 Ollama 提供商的 bearer 凭证           |
| [Perplexity](/zh-CN/tools/perplexity-search)    | 结构化摘要片段             | 国家、语言、时间、域名、内容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/zh-CN/tools/searxng-search)          | 结构化摘要片段             | 类别、语言                                       | 无（自托管）                                                                     |
| [Tavily](/zh-CN/tools/tavily)                   | 结构化摘要片段             | 通过 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                 |

## 自动检测

## 原生 OpenAI Web 搜索

当启用 OpenClaw Web 搜索且未固定托管提供商时，直接使用 OpenAI Responses 模型会自动使用 OpenAI 托管的 `web_search` 工具。这是内置 OpenAI 插件中的提供商自有行为，仅适用于原生 OpenAI API 流量，不适用于 OpenAI 兼容代理 base URL 或 Azure 路由。将 `tools.web.search.provider` 设置为其他提供商（如 `brave`）可让 OpenAI 模型继续使用托管的 `web_search` 工具，或设置 `tools.web.search.enabled: false` 以同时禁用托管搜索和原生 OpenAI 搜索。

## 原生 Codex Web 搜索

支持 Codex 的模型可以选择使用提供商原生的 Responses `web_search` 工具，而不是 OpenClaw 托管的 `web_search` 函数。

- 在 `tools.web.search.openaiCodex` 下配置
- 它仅对支持 Codex 的模型生效（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的提供商）
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

如果已启用原生 Codex 搜索，但当前模型不支持 Codex，OpenClaw 会保留常规托管 `web_search` 行为。

## 设置 Web 搜索

文档和设置流程中的提供商列表按字母顺序排列。自动检测使用单独的优先级顺序。

如果未设置 `provider`，OpenClaw 会按以下顺序检查提供商，并使用第一个已就绪的提供商：

首先是基于 API 的提供商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** -- `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`（顺序 20）
4. **Grok** -- `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`（顺序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）

之后是无需密钥的回退选项：

10. **DuckDuckGo** -- 无需账户或 API 密钥的无密钥 HTML 回退选项（顺序 100）
11. **Ollama Web Search** -- 通过你配置的 Ollama 主机提供的无密钥回退选项；要求 Ollama 可访问且已通过 `ollama signin` 登录，如果主机需要，也可以复用 Ollama 提供商的 bearer 凭证（顺序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

如果未检测到任何提供商，它会回退到 Brave（你会收到缺少密钥的错误提示，要求你进行配置）。

<Note>
  所有提供商密钥字段都支持 SecretRef 对象。位于 `plugins.entries.<plugin>.config.webSearch.apiKey` 下的插件级 SecretRef 会为内置的 Exa、Firecrawl、Gemini、Grok、Kimi、Perplexity 和 Tavily 提供商解析，无论该提供商是通过 `tools.web.search.provider` 显式选择，还是通过自动检测选中。在自动检测模式下，OpenClaw 只会解析已选中提供商的密钥 —— 未选中的 SecretRef 会保持未激活状态，因此你可以同时保留多个提供商配置，而不需要为未使用的提供商支付解析成本。
</Note>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 默认：true
        provider: "brave", // 或省略以启用自动检测
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

提供商特定配置（API 密钥、base URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。示例请参阅各提供商页面。

`web_fetch` 的回退提供商选择是独立的：

- 使用 `tools.web.fetch.provider` 选择
- 或省略该字段，让 OpenClaw 从可用凭证中自动检测第一个已就绪的 web-fetch 提供商
- 当前内置的 web-fetch 提供商是 Firecrawl，配置位于 `plugins.entries.firecrawl.config.webFetch.*`

当你在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 **Kimi** 时，OpenClaw 还可能询问：

- Moonshot API 区域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认的 Kimi Web 搜索模型（默认为 `kimi-k2.6`）

对于 `x_search`，请配置 `plugins.entries.xai.config.xSearch.*`。它使用与 Grok Web 搜索相同的 `XAI_API_KEY` 回退。
旧版 `tools.web.x_search.*` 配置会由 `openclaw doctor --fix` 自动迁移。
当你在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 Grok 时，
OpenClaw 还可以提供使用同一密钥的可选 `x_search` 设置。
这是 Grok 路径中的一个单独后续步骤，而不是一个单独的顶层
Web 搜索提供商选择。如果你选择了其他提供商，OpenClaw 不会
显示 `x_search` 提示。

### 存储 API 密钥

<Tabs>
  <Tab title="配置文件">
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
  <Tab title="环境变量">
    在 Gateway 网关进程环境中设置提供商环境变量：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。
    参见 [环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数                  | 说明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜索查询（必填）                                      |
| `count`               | 返回结果数（1-10，默认：5）                           |
| `country`             | 2 字母 ISO 国家代码（例如 “US”、“DE”）               |
| `language`            | ISO 639-1 语言代码（例如 “en”、“de”）                |
| `search_lang`         | 搜索语言代码（仅 Brave）                              |
| `freshness`           | 时间筛选：`day`、`week`、`month` 或 `year`            |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                        |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                        |
| `ui_lang`             | UI 语言代码（仅 Brave）                               |
| `domain_filter`       | 域名允许列表/拒绝列表数组（仅 Perplexity）            |
| `max_tokens`          | 总内容预算，默认 25000（仅 Perplexity）               |
| `max_tokens_per_page` | 每页 token 限制，默认 2048（仅 Perplexity）           |

<Warning>
  并非所有参数都适用于所有提供商。Brave 的 `llm-context` 模式会拒绝 `ui_lang`、`freshness`、`date_after` 和 `date_before`。
  Gemini、Grok 和 Kimi 会返回一个带引用的 AI 合成答案。
  它们接受 `count` 以兼容共享工具，但这不会改变 grounded 答案的形态。
  当你使用 Sonar/OpenRouter
  兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）时，Perplexity 的行为也是如此。
  SearXNG 仅对受信任的私有网络或 loopback 主机接受 `http://`；
  公共 SearXNG 端点必须使用 `https://`。
  Firecrawl 和 Tavily 通过 `web_search`
  仅支持 `query` 和 `count` —— 如需高级选项，请使用它们的专用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（原 Twitter）帖子，并返回
带引用的 AI 合成答案。它接受自然语言查询以及
可选的结构化筛选。OpenClaw 仅会在服务于此次工具调用的请求上启用内置的 xAI `x_search`
工具。

<Note>
  xAI 文档说明，`x_search` 支持关键词搜索、语义搜索、用户
  搜索和线程抓取。对于单条帖子的互动统计，如转发、回复、收藏或浏览量，建议优先对确切帖子 URL
  或状态 ID 进行定向查询。宽泛的关键词搜索可能找到正确帖子，但返回的单帖元数据会不那么完整。
  一个好的模式是：先定位帖子，然后
  运行第二次 `x_search` 查询，专门聚焦于该确切帖子。
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
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // 如果已设置 XAI_API_KEY，则可选
          },
        },
      },
    },
  },
}
```

### x_search 参数

| 参数                         | 说明                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `query`                      | 搜索查询（必填）                                      |
| `allowed_x_handles`          | 将结果限制为特定 X 账号                               |
| `excluded_x_handles`         | 排除特定 X 账号                                       |
| `from_date`                  | 仅包含此日期或之后的帖子（YYYY-MM-DD）                |
| `to_date`                    | 仅包含此日期或之前的帖子（YYYY-MM-DD）                |
| `enable_image_understanding` | 让 xAI 检查匹配帖子附带的图片                         |
| `enable_video_understanding` | 让 xAI 检查匹配帖子附带的视频                         |

### x_search 示例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 单帖统计：尽可能使用确切状态 URL 或状态 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 示例

```javascript
// 基本搜索
await web_search({ query: "OpenClaw plugin SDK" });

// 德语定向搜索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近结果（过去一周）
await web_search({ query: "AI developments", freshness: "week" });

// 日期范围
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名筛选（仅 Perplexity）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具配置档

如果你使用工具配置档或允许列表，请添加 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]  （包含 web_search、x_search 和 web_fetch）
  },
}
```

## 相关内容

- [Web Fetch](/zh-CN/tools/web-fetch) -- 抓取一个 URL 并提取可读内容
- [Web Browser](/zh-CN/tools/browser) -- 面向大量依赖 JS 的网站的完整浏览器自动化
- [Grok Search](/zh-CN/tools/grok-search) -- 将 Grok 作为 `web_search` 提供商
- [Ollama Web Search](/zh-CN/tools/ollama-search) -- 通过你的 Ollama 主机进行无密钥网页搜索

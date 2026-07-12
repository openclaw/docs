---
read_when:
    - 你想启用或配置 web_search
    - 你想要启用或配置 x_search
    - 你需要选择一个搜索提供商
    - 你想了解自动检测和提供商选择
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch —— 搜索 Web、搜索 X 帖子或获取页面内容
title: Web 搜索
x-i18n:
    generated_at: "2026-07-11T21:02:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` 使用你配置的提供商搜索 Web，并返回
标准化结果；结果按查询缓存 15 分钟（可配置）。OpenClaw
还内置了用于搜索 X（原 Twitter）帖子的 `x_search`，以及用于
轻量级 URL 获取的 `web_fetch`。`web_fetch` 始终在本地运行；当 Grok 是提供商时，
`web_search` 通过 xAI Responses 路由，而 `x_search` 始终使用
xAI Responses。

<Info>
  `web_search` 是轻量级 HTTP 工具，不是浏览器自动化工具。对于
  大量使用 JS 的网站或需要登录的场景，请使用 [Web 浏览器](/zh-CN/tools/browser)。如需
  获取特定 URL，请使用 [Web Fetch](/zh-CN/tools/web-fetch)。
</Info>

## 快速开始

<Steps>
  <Step title="选择提供商">
    选择提供商并完成所有必要设置。部分提供商
    无需密钥，其他提供商则需要 API key。详情请参阅下方的
    提供商页面。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    此命令会存储提供商及所有必要的凭据。对于 API 支持的
    提供商，你也可以改为设置该提供商的环境变量（例如
    `BRAVE_API_KEY`），并跳过此步骤。
  </Step>
  <Step title="使用">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    对于 X 帖子：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 选择提供商

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-CN/tools/brave-search">
    提供带摘要的结构化结果。支持 `llm-context` 模式以及国家/语言筛选。提供免费套餐。
  </Card>
  <Card title="Codex 托管搜索" icon="search" href="/zh-CN/plugins/codex-harness">
    通过你的 Codex app-server 账户提供基于来源的 AI 综合回答。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-CN/tools/duckduckgo-search">
    无需密钥的提供商。不需要 API key。采用非官方的 HTML 集成。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-CN/tools/exa-search">
    神经网络 + 关键词搜索，并支持内容提取（重点内容、文本、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-CN/tools/firecrawl">
    提供结构化结果。搭配 `firecrawl_search` 和 `firecrawl_scrape` 进行深度提取时效果最佳。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-CN/tools/gemini-search">
    通过 Google 搜索溯源提供带引用的 AI 综合回答。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-CN/tools/grok-search">
    通过 xAI Web 溯源提供带引用的 AI 综合回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-CN/tools/kimi-search">
    通过 Moonshot Web 搜索提供带引用的 AI 综合回答；无溯源的聊天回退会明确失败。
  </Card>
  <Card title="MiniMax 搜索" icon="globe" href="/zh-CN/tools/minimax-search">
    通过 MiniMax Token Plan 搜索 API 提供结构化结果。
  </Card>
  <Card title="Ollama Web 搜索" icon="globe" href="/zh-CN/tools/ollama-search">
    通过已登录的本地 Ollama 主机或托管的 Ollama API 进行搜索。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-CN/tools/parallel-search">
    付费 Parallel 搜索 API（`PARALLEL_API_KEY`）；提供更高的速率限制和目标调优。
  </Card>
  <Card title="Parallel 搜索（免费）" icon="layer-group" href="/zh-CN/tools/parallel-search">
    无需密钥，需主动启用。Parallel 的免费 Search MCP 提供针对 LLM 优化的密集摘录，无需 API key。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-CN/tools/perplexity-search">
    提供结构化结果，并支持内容提取控制和域名筛选。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-CN/tools/searxng-search">
    自托管元搜索。不需要 API key。聚合 Google、Bing、DuckDuckGo 等搜索引擎。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-CN/tools/tavily">
    提供结构化结果，支持搜索深度、主题筛选，并可通过 `tavily_extract` 提取 URL 内容。
  </Card>
</CardGroup>

### 提供商比较

| 提供商                                           | 结果样式                                                       | 筛选条件                                         | API key                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-CN/tools/brave-search)                     | 结构化摘要                                                     | 国家、语言、时间、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [Codex 托管搜索](/zh-CN/plugins/codex-harness)         | AI 综合回答 + 来源 URL                                         | 域名、上下文大小、用户位置                       | 无；使用 Codex/OpenAI 登录                                                              |
| [DuckDuckGo](/zh-CN/tools/duckduckgo-search)           | 结构化摘要                                                     | --                                               | 无（无需密钥）                                                                          |
| [Exa](/zh-CN/tools/exa-search)                         | 结构化结果 + 提取内容                                          | 神经网络/关键词模式、日期、内容提取              | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-CN/tools/firecrawl)                    | 结构化摘要                                                     | 通过 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-CN/tools/gemini-search)                   | AI 综合回答 + 引用                                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-CN/tools/grok-search)                       | AI 综合回答 + 引用                                             | --                                               | xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/zh-CN/tools/kimi-search)                       | AI 综合回答 + 引用；无溯源的聊天回退会失败                    | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax 搜索](/zh-CN/tools/minimax-search)            | 结构化摘要                                                     | 区域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web 搜索](/zh-CN/tools/ollama-search)          | 结构化摘要                                                     | --                                               | 已登录的本地主机无需密钥；直接搜索 `https://ollama.com` 时使用 `OLLAMA_API_KEY`         |
| [Parallel](/zh-CN/tools/parallel-search)               | 按 LLM 上下文相关度排序的密集摘录                              | --                                               | `PARALLEL_API_KEY`（付费）                                                              |
| [Parallel 搜索（免费）](/zh-CN/tools/parallel-search)  | 按 LLM 上下文相关度排序的密集摘录                              | --                                               | 无（免费 Search MCP）                                                                   |
| [Perplexity](/zh-CN/tools/perplexity-search)           | 结构化摘要                                                     | 国家、语言、时间、域名、内容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-CN/tools/searxng-search)                 | 结构化摘要                                                     | 类别、语言                                       | 无（自托管）                                                                            |
| [Tavily](/zh-CN/tools/tavily)                          | 结构化摘要                                                     | 通过 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自动检测

文档和设置流程中的提供商列表按字母顺序排列。自动检测使用
另一套固定的优先级顺序，并且找到已配置的提供商时，只会选择需要
凭据的提供商（`requiresCredential !== false`）。如果未设置
`provider`，OpenClaw 会按以下顺序检查提供商，并使用
第一个已就绪的提供商：

首先是 API 支持的提供商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax 搜索** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（顺序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；可选的 `plugins.entries.exa.config.webSearch.baseUrl` 可覆盖 Exa 端点（顺序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）
10. **Parallel** -- 通过 `PARALLEL_API_KEY` 或 `plugins.entries.parallel.config.webSearch.apiKey` 使用付费 Parallel 搜索 API；可选的 `plugins.entries.parallel.config.webSearch.baseUrl` 可覆盖该端点（顺序 75）

之后是已配置端点的提供商：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

**Parallel 搜索（免费）**、**DuckDuckGo**、
**Ollama Web 搜索**和 **Codex 托管搜索**等无需密钥的提供商
绝不会在自动检测中胜出，即使它们有内部顺序值。只有当你
通过 `tools.web.search.provider` 或
`openclaw configure --section web` 显式选择它们时，才会使用这些提供商。
OpenClaw 不会仅仅因为未配置 API 支持的提供商，就将托管的
`web_search` 查询发送给无需密钥的提供商。

OpenAI Responses 模型是例外：当未设置 `tools.web.search.provider`
时，它们会使用 OpenAI 的原生 Web 搜索，而不是上述托管
提供商（见下文）。将 `tools.web.search.provider` 设置为
`parallel-free`（或其他提供商），即可改为通过托管路径
路由这些模型。

<Note>
  所有提供商密钥字段均支持 SecretRef 对象。位于
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下的插件作用域 SecretRef
  会为已安装且由 API 支持的 Web 搜索提供商进行解析，其中包括 Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 和 Tavily；
  无论提供商是通过 `tools.web.search.provider` 显式选定，还是
  通过自动检测选定，均是如此。在自动检测模式下，OpenClaw 只解析
  所选提供商的密钥——未选中的 SecretRef 会保持未激活状态，因此你可以
  配置多个提供商，而无需为未使用的提供商承担解析成本。
</Note>

## OpenAI 原生 Web 搜索

OpenAI Responses 直连模型（`api: "openai-responses"`、提供商为 `openai`，且未设置基础 URL 或使用 OpenAI 官方 API 基础 URL）在启用 OpenClaw Web 搜索且未指定托管提供商时，会自动使用 OpenAI 托管的 `web_search` 工具。这是内置 OpenAI 插件中由提供商负责的行为，不适用于与 OpenAI 兼容的代理基础 URL 或 Azure 路由。将 `tools.web.search.provider` 设置为 `brave` 等其他提供商，可让 OpenAI 模型继续使用托管的 `web_search` 工具；也可设置 `tools.web.search.enabled: false`，同时禁用托管搜索和 OpenAI 原生搜索。

## 原生 Codex Web 搜索

启用 Web 搜索且未选择托管提供商时，Codex app-server 运行时会自动使用 Codex 托管的 `web_search` 工具。原生托管搜索与 OpenClaw 的托管 `web_search` 动态工具互斥，因此托管搜索无法绕过原生域名限制。当托管搜索不可用、被明确禁用或由所选托管提供商替代时，OpenClaw 会使用托管工具。OpenClaw 会保持禁用 Codex 的独立 `web.run` 扩展（`features.standalone_web_search: false`），因为生产环境中的 app-server 流量会拒绝用户定义的 `web` 命名空间。

- 在 `tools.web.search.openaiCodex` 下配置原生搜索
- 设置 `tools.web.search.provider: "codex"`，将 Codex Hosted Search 配置为任意父模型的托管 `web_search` 提供商。每次调用都会运行一个有界的临时 Codex app-server 轮次；如果 Codex 未生成托管的 `webSearch` 项，则调用失败
- `mode: "cached"` 是默认偏好设置，但对于不受限制的 app-server 轮次，Codex 会将其解析为实时外部访问；设置为 `"live"` 可明确请求实时访问
- 将 `tools.web.search.provider` 设置为 `brave` 等托管提供商，以改用 OpenClaw 的托管 `web_search`
- 设置 `tools.web.search.openaiCodex.enabled: false` 可选择不使用 Codex 托管搜索；其他托管提供商仍然可用
- 限制 Codex 原生工具表面时，托管 `web_search` 仍然可用
- 设置 `allowedDomains` 后，如果托管搜索不可用，自动托管回退会以失败关闭，从而避免绕过原生允许列表
- 禁用工具的纯 LLM 运行会同时禁用原生搜索和托管搜索
- `tools.web.search.enabled: false` 会同时禁用托管搜索和原生搜索

持久生效的 Codex 搜索策略变更会启动新的绑定线程，确保已加载的 app-server 线程不会继续保留过期的托管搜索访问权限。每轮次的临时限制会使用一个临时受限线程，并保留现有绑定以供之后恢复。

OpenAI ChatGPT Responses 直连流量也可使用 OpenAI 托管的 `web_search` 工具。这条独立路径仍需通过 `tools.web.search.openaiCodex.enabled: true` 主动启用，并且仅适用于使用 `api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // 可选：也允许非 Codex 父模型使用 Codex Hosted Search。
        provider: "codex",
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

对于不支持 Codex 原生搜索的运行时和提供商，Codex 可以通过 OpenClaw 的动态工具命名空间使用托管的 `web_search` 回退。当你需要 OpenClaw 提供商专属的网络控制，而不是 Codex 托管搜索时，请明确指定托管提供商。

选择 `provider: "codex"` 会启用内置的 `codex` 插件，并使用上文所示的同一组 `tools.web.search.openaiCodex` 限制。请先使用 `openclaw models auth login --provider openai` 对 Codex app-server 进行身份验证。父智能体可以使用任意模型或运行时；只有有界搜索工作进程通过 Codex 运行。

## 网络安全

托管 HTTP `web_search` 提供商调用使用 OpenClaw 的受防护获取路径，其范围仅限于当前提供商自身的主机名。仅对该主机名，OpenClaw 允许 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 与 `fc00::/7` 范围内返回伪 IP DNS 结果。其他私有地址、回环地址、链路本地地址和元数据目标仍会被阻止。Codex Hosted Search 是例外：它的有界工作进程将网络访问委托给 Codex app-server 托管的 `web_search` 工具。

此自动放行不适用于任意 `web_fetch` URL。对于 `web_fetch`，仅当受信任代理拥有这些合成地址范围时，才应明确启用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 默认值：true
        provider: "brave", // 也可省略以自动检测
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

提供商专属配置（API 密钥、基础 URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。在专用 Web 搜索配置和 `GEMINI_API_KEY` 之后，Gemini 还可将 `models.providers.google.apiKey` 和 `models.providers.google.baseUrl` 用作优先级较低的回退。示例请参阅各提供商页面。
Grok 还可复用通过 `openclaw models auth login --provider xai --method oauth` 创建的 xAI OAuth 身份验证配置文件；API 密钥配置仍作为回退。

系统会根据内置和已安装插件清单声明的 Web 搜索提供商 ID 验证 `tools.web.search.provider`。像 `"brvae"` 这样的拼写错误会导致配置验证失败，而不是静默回退到自动检测。如果配置的提供商仅有过期的插件依据，例如卸载第三方插件后残留的 `plugins.entries.<plugin>` 块，OpenClaw 会保持启动流程的韧性并报告警告，以便你重新安装插件或运行 `openclaw doctor --fix` 清理过期配置。

`web_fetch` 的回退提供商选择是独立的：

- 使用 `tools.web.fetch.provider` 选择
- 或省略该字段，让 OpenClaw 根据已配置的凭据自动检测第一个就绪的 Web 获取提供商
- 非沙箱隔离的 `web_fetch` 可使用声明了 `contracts.webFetchProviders` 的已安装插件提供商；沙箱隔离的获取操作允许使用内置提供商和经过验证的官方插件安装，但排除第三方外部插件
- 目前，官方 Firecrawl 插件是唯一内置的 `webFetchProviders` 贡献者，其配置位于 `plugins.entries.firecrawl.config.webFetch.*` 下

当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，OpenClaw 还可以询问：

- Moonshot API 区域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认 Kimi Web 搜索模型（默认为 `kimi-k2.6`）

对于 `x_search`，请配置 `plugins.entries.xai.config.xSearch.*`。它使用与聊天相同的 xAI 身份验证配置文件，或 Grok Web 搜索使用的 `XAI_API_KEY`／插件 Web 搜索凭据。
旧版 `tools.web.x_search.*` 配置会由 `openclaw doctor --fix` 自动迁移。
当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 Grok 时，OpenClaw 还会在 Grok 设置完成后，立即使用相同凭据提供可选的 `x_search` 设置。这是 Grok 路径中的一个独立后续步骤，而不是单独的顶层 Web 搜索提供商选项。如果你选择其他提供商，OpenClaw 不会显示 `x_search` 提示。

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
    请参阅[环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数                  | 说明                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 搜索查询（必填）                                                   |
| `count`               | 返回的结果数量（1-10，默认值：5）                                  |
| `country`             | 双字母 ISO 国家/地区代码（例如 "US"、"DE"）                        |
| `language`            | ISO 639-1 语言代码（例如 "en"、"de"）                              |
| `search_lang`         | 搜索语言代码（仅限 Brave）                                         |
| `freshness`           | 时间筛选器：`day`、`week`、`month` 或 `year`                       |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                                     |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                                     |
| `ui_lang`             | UI 语言代码（仅限 Brave）                                          |
| `domain_filter`       | 域名允许列表／拒绝列表数组（仅限 Perplexity）                      |
| `max_tokens`          | 总内容令牌预算，仅限原生 Perplexity Search API                     |
| `max_tokens_per_page` | 每页提取令牌限制，仅限原生 Perplexity Search API                   |

<Warning>
  并非所有参数都适用于所有提供商。Brave 的 `llm-context` 模式会拒绝 `ui_lang`；`date_before` 还必须与 `date_after` 一同使用，因为 Brave 自定义新鲜度范围要求同时提供开始日期和结束日期。
  Gemini、Grok 和 Kimi 会返回一条带有引用的综合答案。它们接受 `count` 以保持共享工具兼容性，但该参数不会改变基于检索信息的答案结构。Gemini 将 `day` 新鲜度视为近期性提示；更宽泛的新鲜度值和明确日期会设置 Google Search 基于检索信息的时间范围。
  通过 Sonar/OpenRouter 兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl`／`model` 或 `OPENROUTER_API_KEY`）使用 Perplexity 时，其行为相同；该路径也不支持 `max_tokens` 和 `max_tokens_per_page`。
  SearXNG 仅允许受信任的私有网络主机或回环主机使用 `http://`；公共 SearXNG 端点必须使用 `https://`。
  Firecrawl 和 Tavily 通过 `web_search` 时仅支持 `query` 和 `count`——如需高级选项，请使用它们的专用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（前称 Twitter）帖子，并返回带有引用的 AI 综合答案。它接受自然语言查询和可选的结构化筛选器。OpenClaw 会按请求构造内置的 xAI `x_search` 工具，而不是永久注册它，因此该工具仅在实际调用它的轮次中处于活动状态。

<Warning>
  `x_search` 在 xAI 的服务器上运行。xAI 对每 1,000 次工具调用收取 5 美元，此外还会收取模型输入和输出令牌费用。
</Warning>

<Note>
  xAI 文档说明 `x_search` 支持关键词搜索、语义搜索、用户搜索和线程获取。对于转帖、回复、书签或浏览量等单帖互动统计数据，建议针对确切的帖子 URL 或状态 ID 执行定向查询。宽泛的关键词搜索可能会找到正确的帖子，但返回的单帖元数据可能不够完整。一个良好的模式是：先找到帖子，再执行第二次 `x_search` 查询，聚焦于该确切帖子。
</Note>

### x_search 配置

省略 `enabled` 时，仅当当前模型的提供商为 `xai` 且能解析到 xAI 凭据时，才会公开 `x_search`。如果当前模型具有已知的非 xAI 提供商，请将 `plugins.entries.xai.config.xSearch.enabled` 设置为 `true`，以选择启用跨提供商使用。如果当前模型的提供商缺失或无法解析，该工具将保持隐藏。将 `enabled` 设置为 `false` 可对所有提供商禁用该工具。始终需要 xAI 凭据。

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // 对已知的非 xAI 模型提供商为必需
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // 可选，覆盖 webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // 如果已设置 xAI 身份验证配置文件或 XAI_API_KEY，则为可选
            baseUrl: "https://api.x.ai/v1", // 可选的共享 xAI Responses 基础 URL
          },
        },
      },
    },
  },
}
```

设置 `plugins.entries.xai.config.xSearch.baseUrl` 后，`x_search` 会向 `<baseUrl>/responses` 发送 POST 请求。如果省略该字段，则依次回退到 `plugins.entries.xai.config.webSearch.baseUrl`、旧版 `tools.web.search.grok.baseUrl`，最后回退到公开的 xAI 端点（`https://api.x.ai/v1`）。

### x_search 参数

| 参数                         | 说明                                         |
| ---------------------------- | -------------------------------------------- |
| `query`                      | 搜索查询（必填）                             |
| `allowed_x_handles`          | 将结果限制为最多 20 个 X 用户名              |
| `excluded_x_handles`         | 排除最多 20 个 X 用户名                      |
| `from_date`                  | 仅包含此日期或之后的帖子（YYYY-MM-DD）       |
| `to_date`                    | 仅包含此日期或之前的帖子（YYYY-MM-DD）       |
| `enable_image_understanding` | 允许 xAI 检查匹配帖子所附的图片              |
| `enable_video_understanding` | 允许 xAI 检查匹配帖子所附的视频              |

`allowed_x_handles` 和 `excluded_x_handles` 互斥。

### x_search 示例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 单篇帖子统计信息：尽可能使用准确的帖子 URL 或帖子 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 示例

```javascript
// 基本搜索
await web_search({ query: "OpenClaw plugin SDK" });

// 德语特定搜索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近的结果（过去一周）
await web_search({ query: "AI developments", freshness: "week" });

// 日期范围
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名筛选（仅限 Perplexity）
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
    // 或：allow: ["group:web"]（包括 web_search、x_search 和 web_fetch）
  },
}
```

## 相关内容

- [网页抓取](/zh-CN/tools/web-fetch) -- 获取 URL 并提取可读内容
- [网页浏览器](/zh-CN/tools/browser) -- 针对大量使用 JS 的网站进行完整浏览器自动化
- [Grok 搜索](/zh-CN/tools/grok-search) -- 使用 Grok 作为 `web_search` 提供商
- [Ollama Web 搜索](/zh-CN/tools/ollama-search) -- 通过你的 Ollama 主机进行无需密钥的网页搜索

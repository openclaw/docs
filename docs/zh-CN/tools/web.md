---
read_when:
    - 你想启用或配置 web_search
    - 你想启用或配置 x_search
    - 你需要选择一个搜索提供商
    - 你想了解自动检测和提供商选择
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜索网页、搜索 X 帖子，或获取页面内容
title: Web 搜索
x-i18n:
    generated_at: "2026-06-27T03:36:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

`web_search` 工具会使用你配置的提供商搜索 Web，并返回结果。结果会按查询缓存 15 分钟（可配置）。

OpenClaw 还包含用于 X（原 Twitter）帖子的 `x_search`，以及用于轻量级 URL 获取的 `web_fetch`。在这一阶段，`web_fetch` 保持本地执行，而 `web_search` 和 `x_search` 可以在底层使用 xAI Responses。

<Info>
  `web_search` 是轻量级 HTTP 工具，不是浏览器自动化。对于
  JS 密集型网站或登录场景，请使用 [Web Browser](/zh-CN/tools/browser)。对于
  获取特定 URL，请使用 [Web Fetch](/zh-CN/tools/web-fetch)。
</Info>

## 快速开始

<Steps>
  <Step title="Choose a provider">
    选择一个提供商，并完成任何必需的设置。一些提供商无需密钥，
    其他提供商则使用 API key。详情请参阅下面的提供商页面。
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    这会存储提供商以及任何所需凭证。你也可以设置一个环境变量
    （例如 `BRAVE_API_KEY`），并针对 API 支持的提供商跳过此步骤。
  </Step>
  <Step title="Use it">
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
    带摘要片段的结构化结果。支持 `llm-context` 模式、国家/语言过滤器。提供免费层。
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/zh-CN/plugins/codex-harness">
    通过你的 Codex app-server 账户提供基于来源的 AI 合成答案。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-CN/tools/duckduckgo-search">
    无需密钥的提供商。不需要 API key。非官方的基于 HTML 的集成。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-CN/tools/exa-search">
    神经 + 关键词搜索，并带内容提取（高亮、文本、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-CN/tools/firecrawl">
    结构化结果。最好与 `firecrawl_search` 和 `firecrawl_scrape` 搭配用于深度提取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-CN/tools/gemini-search">
    通过 Google Search grounding 提供带引用的 AI 合成答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-CN/tools/grok-search">
    通过 xAI Web grounding 提供带引用的 AI 合成答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-CN/tools/kimi-search">
    通过 Moonshot Web 搜索提供带引用的 AI 合成答案；未 grounding 的聊天回退会显式失败。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-CN/tools/minimax-search">
    通过 MiniMax Token Plan search API 提供结构化结果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-CN/tools/ollama-search">
    通过已登录的本地 Ollama 主机或托管的 Ollama API 搜索。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-CN/tools/parallel-search">
    付费 Parallel Search API（`PARALLEL_API_KEY`）；更高的速率限制和目标调优。
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/zh-CN/tools/parallel-search">
    无需密钥的可选方案。Parallel 的免费 Search MCP，提供面向 LLM 优化的密集摘录且不需要 API key。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-CN/tools/perplexity-search">
    结构化结果，带内容提取控制和域名过滤。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-CN/tools/searxng-search">
    自托管元搜索。不需要 API key。聚合 Google、Bing、DuckDuckGo 等。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-CN/tools/tavily">
    结构化结果，带搜索深度、主题过滤，以及用于 URL 提取的 `tavily_extract`。
  </Card>
</CardGroup>

### 提供商对比

| 提供商                                         | 结果样式                                                   | 过滤器                                          | API key                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-CN/tools/brave-search)                     | 结构化摘要片段                                            | 国家、语言、时间、`llm-context` 模式      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/zh-CN/plugins/codex-harness)    | AI 合成 + 来源 URL                                   | 域名、上下文大小、用户位置             | 无；使用 Codex/OpenAI 登录                                                         |
| [DuckDuckGo](/zh-CN/tools/duckduckgo-search)           | 结构化摘要片段                                            | --                                               | 无（无需密钥）                                                                         |
| [Exa](/zh-CN/tools/exa-search)                         | 结构化 + 已提取内容                                         | 神经/关键词模式、日期、内容提取    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-CN/tools/firecrawl)                    | 结构化摘要片段                                            | 通过 `firecrawl_search` 工具                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-CN/tools/gemini-search)                   | AI 合成 + 引用                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-CN/tools/grok-search)                       | AI 合成 + 引用                                     | --                                               | xAI OAuth、`XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/zh-CN/tools/kimi-search)                       | AI 合成 + 引用；未 grounding 的聊天回退会失败 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-CN/tools/minimax-search)          | 结构化摘要片段                                            | 区域（`global` / `cn`）                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/zh-CN/tools/ollama-search)        | 结构化摘要片段                                            | --                                               | 已登录本地主机无需；直接搜索 `https://ollama.com` 时使用 `OLLAMA_API_KEY` |
| [Parallel](/zh-CN/tools/parallel-search)               | 针对 LLM 上下文排序的密集摘录                          | --                                               | `PARALLEL_API_KEY`（付费）                                                               |
| [Parallel Search (Free)](/zh-CN/tools/parallel-search) | 针对 LLM 上下文排序的密集摘录                          | --                                               | 无（免费 Search MCP）                                                                  |
| [Perplexity](/zh-CN/tools/perplexity-search)           | 结构化摘要片段                                            | 国家、语言、时间、域名、内容限制 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-CN/tools/searxng-search)                 | 结构化摘要片段                                            | 类别、语言                             | 无（自托管）                                                                      |
| [Tavily](/zh-CN/tools/tavily)                          | 结构化摘要片段                                            | 通过 `tavily_search` 工具                         | `TAVILY_API_KEY`                                                                        |

## 自动检测

## 原生 OpenAI Web 搜索

当 OpenClaw Web 搜索启用且未固定托管提供商时，直接的 OpenAI Responses 模型会自动使用 OpenAI 托管的 `web_search` 工具。这是内置 OpenAI 插件中的提供商自有行为，并且只适用于原生 OpenAI API 流量，不适用于 OpenAI 兼容代理 base URL 或 Azure 路由。将 `tools.web.search.provider` 设置为其他提供商（例如 `brave`），即可为 OpenAI 模型保留托管的 `web_search` 工具；或者设置 `tools.web.search.enabled: false` 以同时禁用托管搜索和原生 OpenAI 搜索。

## 原生 Codex Web 搜索

当 Web 搜索启用且未选择托管提供商时，Codex app-server 运行时会自动使用 Codex 托管的 `web_search` 工具。原生托管搜索和 OpenClaw 托管的 `web_search` 动态工具互斥，因此托管搜索无法绕过原生域名限制。当托管搜索不可用、被显式禁用，或被所选托管提供商替代时，OpenClaw 会使用托管工具。OpenClaw 保持禁用 Codex 的独立 `web.run` 扩展，因为生产 app-server 流量会拒绝其用户定义的 `web` 命名空间。

- 在 `tools.web.search.openaiCodex` 下配置原生搜索
- 设置 `tools.web.search.provider: "codex"`，将 Codex Hosted Search 配置为任意父模型的托管 `web_search` 提供商。每次调用都会运行一个有界的临时 Codex app-server 轮次，并且如果 Codex 未发出托管的 `webSearch` 项则会失败。
- `mode: "cached"` 是默认偏好，但 Codex 会针对不受限制的 app-server 轮次将其解析为实时外部访问；设置 `"live"` 可显式请求实时访问
- 将 `tools.web.search.provider` 设置为托管提供商（例如 `brave`），以改用 OpenClaw 托管的 `web_search`
- 设置 `tools.web.search.openaiCodex.enabled: false` 以退出 Codex 托管搜索；其他托管提供商仍然可用
- 限制 Codex 原生工具表面也会保持托管的 `web_search` 可用
- 设置 `allowedDomains` 时，如果托管搜索不可用，自动托管回退会失败关闭，因此原生允许列表无法被绕过
- 禁用工具的仅 LLM 运行会同时禁用原生搜索和托管搜索
- `tools.web.search.enabled: false` 会同时禁用托管搜索和原生搜索

持久生效的 Codex 搜索策略变更会启动新的绑定线程，因此已加载的 app-server 线程无法保留过期的托管搜索访问权限。临时的逐轮限制会使用一个临时受限线程，并保留现有绑定以供之后恢复。

直接的 OpenAI ChatGPT Responses 流量也可以使用 OpenAI 托管的 `web_search` 工具。该独立路径仍然通过 `tools.web.search.openaiCodex.enabled: true` 选择启用，并且仅适用于使用 `api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
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

对于不支持原生 Codex 搜索的运行时和提供商，Codex 可以通过 OpenClaw 的动态工具命名空间使用托管的 `web_search` 回退。当你需要 OpenClaw 的提供商专属网络控制，而不是 Codex 托管搜索时，请使用显式托管提供商。

Selecting `provider: "codex"` 会启用内置的 `codex` 插件，并使用上面显示的相同 `tools.web.search.openaiCodex` 限制。请先使用 `openclaw models auth login --provider openai` 认证 Codex app-server。父智能体可以使用任意模型或运行时；只有有界搜索 worker 会通过 Codex 运行。

## 网络安全

托管 HTTP `web_search` 提供商调用使用 OpenClaw 的受保护 fetch 路径。对于受信任的提供商 API 主机，OpenClaw 仅允许该提供商主机名使用 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 与 `fc00::/7` 中的 fake-IP DNS 应答。其他私有、loopback、link-local 和 metadata 目标仍会被阻止。Codex Hosted Search 是例外：它的有界 worker 会将网络访问委派给 Codex app-server 的托管 `web_search` 工具。

此自动放行不适用于任意 `web_fetch` URL。对于 `web_fetch`，只有当你受信任的代理拥有这些合成地址段时，才显式启用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 设置 Web 搜索

文档和设置流程中的提供商列表按字母顺序排列。自动检测保留单独的优先级顺序。

如果未设置 `provider`，OpenClaw 会按以下顺序检查提供商，并使用第一个就绪的提供商：

优先使用 API 支持的提供商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（顺序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；可选的 `plugins.entries.exa.config.webSearch.baseUrl` 会覆盖 Exa 端点（顺序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）
10. **Parallel** -- 通过 `PARALLEL_API_KEY` 或 `plugins.entries.parallel.config.webSearch.apiKey` 使用付费 Parallel Search API；可选的 `plugins.entries.parallel.config.webSearch.baseUrl` 会覆盖端点（顺序 75）

然后是已配置端点的提供商：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

**Parallel Search (Free)**、**DuckDuckGo**、**Ollama Web 搜索** 和 **Codex Hosted Search** 等免密钥提供商，仅在你通过 `tools.web.search.provider` 或 `openclaw configure --section web` 显式选择它们时可用。OpenClaw 不会仅因为未配置 API 支持的提供商，就将托管 `web_search` 查询发送给免密钥提供商。

OpenAI Responses 模型是例外：当 `tools.web.search.provider` 未设置时，它们会使用 OpenAI 的原生 Web 搜索，而不是上面的托管提供商。将 `tools.web.search.provider` 设置为 `parallel-free`（或其他提供商）可让它们通过托管路径路由。

<Note>
  所有提供商密钥字段都支持 SecretRef 对象。位于 `plugins.entries.<plugin>.config.webSearch.apiKey` 下的插件作用域 SecretRef 会为已安装的 API 支持 Web 搜索提供商解析，包括 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 和 Tavily，无论该提供商是通过 `tools.web.search.provider` 显式选择，还是通过自动检测选中。在自动检测模式下，OpenClaw 只解析已选中的提供商密钥 -- 未选中的 SecretRef 会保持非活动状态，因此你可以配置多个提供商，而无需为未使用的提供商支付解析成本。
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

提供商特定配置（API 密钥、base URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 还可以在其专用 Web 搜索配置和 `GEMINI_API_KEY` 之后，以较低优先级回退复用 `models.providers.google.apiKey` 和 `models.providers.google.baseUrl`。请参阅提供商页面中的示例。
Grok 还可以复用来自 `openclaw models auth login --provider xai --method oauth` 的 xAI OAuth 认证配置；API 密钥配置仍是回退项。

`tools.web.search.provider` 会根据内置和已安装插件清单声明的 Web 搜索提供商 ID 进行验证。像 `"brvae"` 这样的拼写错误会导致配置验证失败，而不是静默回退到自动检测。如果已配置的提供商只有过期插件证据，例如卸载第三方插件后残留的 `plugins.entries.<plugin>` 块，OpenClaw 会保持启动韧性并报告警告，以便你重新安装插件或运行 `openclaw doctor --fix` 清理过期配置。

`web_fetch` 回退提供商选择是独立的：

- 使用 `tools.web.fetch.provider` 选择它
- 或省略该字段，让 OpenClaw 从已配置凭证中自动检测第一个就绪的 web-fetch 提供商
- 非沙箱隔离的 `web_fetch` 可以使用声明了 `contracts.webFetchProviders` 的已安装插件提供商；沙箱隔离 fetch 允许内置提供商和已验证的官方插件安装，但排除第三方外部插件
- 官方 Firecrawl 插件提供 web-fetch 回退，并在 `plugins.entries.firecrawl.config.webFetch.*` 下配置

当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，OpenClaw 还可以询问：

- Moonshot API 区域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认 Kimi Web 搜索模型（默认为 `kimi-k2.6`）

对于 `x_search`，请配置 `plugins.entries.xai.config.xSearch.*`。它使用与聊天相同的 xAI 认证配置，或 Grok Web 搜索使用的 `XAI_API_KEY` / 插件 Web 搜索凭证。
旧版 `tools.web.x_search.*` 配置会由 `openclaw doctor --fix` 自动迁移。
当你在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 Grok 时，OpenClaw 还可以使用相同凭证提供可选的 `x_search` 设置。
这是 Grok 路径中的一个独立后续步骤，而不是单独的顶层 Web 搜索提供商选项。如果你选择其他提供商，OpenClaw 不会显示 `x_search` 提示。

### 存储 API 密钥

<Tabs>
  <Tab title="Config file">
    运行 `openclaw configure --section web` 或直接设置密钥：

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

    对于 Gateway 网关安装，请将其放入 `~/.openclaw/.env`。
    请参阅 [环境变量](/zh-CN/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数                  | 描述                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜索查询（必需）                                      |
| `count`               | 要返回的结果数（1-10，默认：5）                       |
| `country`             | 2 字母 ISO 国家/地区代码（例如 “US”、“DE”）           |
| `language`            | ISO 639-1 语言代码（例如 “en”、“de”）                 |
| `search_lang`         | 搜索语言代码（仅 Brave）                              |
| `freshness`           | 时间过滤器：`day`、`week`、`month` 或 `year`          |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                        |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                        |
| `ui_lang`             | UI 语言代码（仅 Brave）                               |
| `domain_filter`       | 域名允许列表/拒绝列表数组（仅 Perplexity）            |
| `max_tokens`          | 总内容预算，默认 25000（仅 Perplexity）               |
| `max_tokens_per_page` | 每页 token 限制，默认 2048（仅 Perplexity）           |

<Warning>
  并非所有参数都适用于所有提供商。Brave `llm-context` 模式会拒绝 `ui_lang`；`date_before` 也需要 `date_after`，因为 Brave 自定义 freshness 范围要求同时提供开始和结束日期。
  Gemini、Grok 和 Kimi 会返回一个带引用的综合答案。它们接受 `count` 以保持共享工具兼容性，但这不会改变 grounded answer 的形态。Gemini 将 `day` freshness 视为新近性提示；更宽的 freshness 值和显式日期会设置 Google Search grounding 时间范围。
  当你使用 Sonar/OpenRouter 兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 或 `OPENROUTER_API_KEY`）时，Perplexity 的行为也相同。
  SearXNG 仅对受信任的私有网络或 loopback 主机接受 `http://`；公共 SearXNG 端点必须使用 `https://`。
  Firecrawl 和 Tavily 通过 `web_search` 仅支持 `query` 和 `count` -- 如需高级选项，请使用它们的专用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（以前称为 Twitter）帖子，并返回带引用的 AI 综合答案。它接受自然语言查询和可选的结构化过滤器。OpenClaw 仅在服务此工具调用的请求上启用内置 xAI `x_search` 工具。

<Note>
  xAI 文档说明 `x_search` 支持关键词搜索、语义搜索、用户搜索和线程获取。对于转发、回复、书签或浏览量等单帖互动统计，优先对确切帖子 URL 或状态 ID 进行定向查找。宽泛的关键词搜索可能找到正确帖子，但返回的单帖 metadata 不够完整。一个好的模式是：先定位帖子，然后运行第二次聚焦于该确切帖子的 `x_search` 查询。
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
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

设置 `plugins.entries.xai.config.xSearch.baseUrl` 时，`x_search` 会向 `<baseUrl>/responses` 发送请求。如果省略该字段，它会回退到 `plugins.entries.xai.config.webSearch.baseUrl`，然后是旧版 `tools.web.search.grok.baseUrl`，最后是公共 xAI 端点。

### x_search 参数

| 参数                         | 描述                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜索查询（必填）                                      |
| `allowed_x_handles`          | 将结果限制为特定 X handle                             |
| `excluded_x_handles`         | 排除特定 X handle                                     |
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
// 单帖统计：尽可能使用确切的状态 URL 或状态 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 示例

```javascript
// 基础搜索
await web_search({ query: "OpenClaw plugin SDK" });

// 德国特定搜索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近结果（过去一周）
await web_search({ query: "AI developments", freshness: "week" });

// 日期范围
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名过滤（仅 Perplexity）
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
    // 或：allow: ["group:web"]  （包含 web_search、x_search 和 web_fetch）
  },
}
```

## 相关

- [Web Fetch](/zh-CN/tools/web-fetch) -- 获取 URL 并提取可读内容
- [Web Browser](/zh-CN/tools/browser) -- 针对 JS 密集型网站的完整浏览器自动化
- [Grok Search](/zh-CN/tools/grok-search) -- 使用 Grok 作为 `web_search` 提供商
- [Ollama Web 搜索](/zh-CN/tools/ollama-search) -- 通过你的 Ollama 主机进行免密钥网页搜索

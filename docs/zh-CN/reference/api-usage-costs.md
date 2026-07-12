---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、成本和使用情况的可见性
    - 你正在解释 /status 或 /usage 的费用报告
summary: 审计哪些功能可能产生费用、使用了哪些密钥，以及如何查看用量
title: API 使用和费用
x-i18n:
    generated_at: "2026-07-11T20:54:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

OpenClaw 中可能调用付费提供商 API 的功能一览，包括各功能从何处读取凭据，以及产生的费用会显示在哪里。

## 费用显示位置

**`/status`**（每会话快照）

- 显示当前会话所用模型、上下文用量和上次响应的 token 数。
- 当 OpenClaw 拥有当前模型的用量元数据和本地定价时，为上次回复添加**预估费用**；这也包括具有明确价格但不使用 API key 的提供商，例如 Bedrock `aws-sdk` 模型。
- 如果实时会话快照中的数据不完整，`/status` 会从最新的对话记录用量条目中恢复 token/缓存计数器和当前模型标签。现有的非零实时值优先于对话记录数据；当已存储的总量缺失或较小时，与提示词规模相符的对话记录总量仍可优先采用。

**`/usage`**（每条消息的页脚）

- `/usage full` 会在每条回复后附加用量页脚；如果已配置本地定价且用量元数据可用，其中还会包含**预估费用**。
- `/usage tokens` 仅显示 token。订阅式 OAuth/token 和 CLI 运行时仅显示 token，除非它们提供兼容的用量元数据及明确的本地价格。
- `/usage cost` 输出本地费用摘要；`/usage off` 禁用页脚。
- Gemini CLI 说明：`stream-json` 和旧版 `json` 输出都会在 `stats` 中包含用量。OpenClaw 会将 `stats.cached` 规范化为 `cacheRead`，并在需要时通过 `stats.input_tokens - stats.cached` 推导输入 token 数。

**Control UI → 用量**（跨会话分析）

- 显示所选日期范围内根据对话记录计算的 token 和预估费用总量，并按提供商、模型、智能体、渠道和 token 类型细分。
- 比较以所选范围结束日期为终点的较短日历窗口。缺失日期按零用量的日历日计算；不会通过跳过这些日期来生成更密集的窗口。
- 直接标注每日图表的刻度。`√` 徽标表示使用平方根压缩，使低用量日期仍然可见。
- 这些总量描述可用的本地会话历史记录，而不是提供商账单或终身计费账本。当某些条目缺少定价时，界面会发出警告。

**CLI 用量窗口**（提供商配额，而非每条消息的费用）

- `openclaw status --usage` 和 `openclaw channels list` 以 `X% left` 的形式显示提供商的**用量窗口**。
- 当前支持用量窗口的提供商包括：Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（涵盖 ChatGPT/Codex OAuth/token 身份验证）、Xiaomi 和 z.ai。完整的提供商/标志列表请参阅[模型 CLI](/zh-CN/cli/models)和[渠道 CLI](/zh-CN/cli/channels)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会将其反转；存在基于计数的字段时，以这些字段为准。如果响应包含 `model_remains` 数组，OpenClaw 会选择聊天模型条目，在需要时根据时间戳推导窗口标签，并在方案标签中包含模型名称。
- 用量身份验证会优先使用提供商专用钩子；如果没有可用钩子，OpenClaw 会改为从身份验证配置文件、环境变量或配置中查找匹配的 OAuth/API key 凭据。

详细示例请参阅 [Token 使用和费用](/zh-CN/reference/token-use)。

<Note>
Anthropic 已确认，除非其发布新政策，否则复用 Claude CLI（包括 `claude -p`）属于获准的集成模式。Anthropic 不提供每条消息的美元费用估算，因此 `/usage full` 无法显示 Claude CLI 用量的费用。
</Note>

## 如何发现密钥

- **身份验证配置文件**：按智能体存储在 `auth-profiles.json` 中。
- **环境变量**：例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **配置**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`，可将密钥导出到技能进程的环境变量中。

## 可能消耗密钥额度的功能

### 核心模型响应（聊天 + 工具）

每次回复或工具调用都在当前模型提供商上运行。这是用量和费用的主要来源，也包括在 OpenClaw 本地界面之外计费的订阅式托管方案：OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI/GLM Coding Plan，以及启用了 Extra Usage 的 Anthropic Claude 登录路径。

定价配置请参阅[模型](/zh-CN/providers/models)，显示方式请参阅 [Token 使用和费用](/zh-CN/reference/token-use)。

### 媒体理解（音频/图像/视频）

在回复流水线运行之前，可以通过提供商 API 对入站媒体进行摘要或转录。各插件分别注册所支持的提供商，且列表会随插件增加而变化；当前列表和配置请参阅[媒体理解](/zh-CN/nodes/media-understanding)。

### 图像和视频生成

`image_generate` 和 `video_generate` 会路由到任一可用的已配置提供商。当未设置 `agents.defaults.imageGenerationModel` 时，图像生成可以推断一个由身份验证支持的默认提供商；视频生成则要求显式设置 `agents.defaults.videoGenerationModel`（例如 `qwen/wan2.6-t2v`）。

当前提供商列表请参阅[图像生成](/zh-CN/tools/image-generation)和[视频生成](/zh-CN/tools/video-generation)。

### 记忆嵌入和语义搜索

当 `agents.defaults.memorySearch.provider` 指定远程适配器时（例如 `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`），语义记忆搜索会使用嵌入 API。`memorySearch.provider = "lmstudio"` 或 `"ollama"` 会使用本地/自托管服务器，通常不会产生托管服务费用。`memorySearch.provider = "local"` 会将所有处理保留在设备上，不使用 API。可选的 `memorySearch.fallback` 提供商可在本地嵌入失败时接管处理。

请参阅[记忆](/zh-CN/concepts/memory)。

### Web 搜索工具

根据所选提供商，`web_search` 可能产生用量费用。每个提供商都会先从环境变量读取密钥，再从 `plugins.entries.<id>.config.webSearch.apiKey` 读取：

| 提供商                 | 环境变量                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | 无需密钥；非官方、基于 HTML，不计费                                                                                                                                   |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini（Google 搜索）  | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok（xAI）            | xAI OAuth 配置文件或 `XAI_API_KEY`                                                                                                                                     |
| Kimi（Moonshot）       | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`                                                                          |
| Ollama Web 搜索        | 对可访问且已登录的本地主机无需密钥；直接使用 `https://ollama.com` 搜索需要 `OLLAMA_API_KEY`；受身份验证保护的主机会复用常规 Ollama 提供商的 bearer 身份验证 |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`；无需密钥/自托管，不产生托管服务费用                                                                                                                |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

旧版 `tools.web.search.*` 配置路径仍可通过兼容性垫片加载，但不再是推荐的配置入口。

**Brave Search 免费额度**：每个方案每月都包含自动续期的 5 美元免费额度。Search 方案每 1,000 次请求收费 5 美元，因此该额度可免费覆盖每月 1,000 次请求。请在 Brave 控制面板中设置用量上限，以避免意外费用。

请参阅 [Web 工具](/zh-CN/tools/web)。

### Web 获取工具（Firecrawl）

`web_fetch` 可以使用 Firecrawl 的免密钥入门额度；添加 `FIRECRAWL_API_KEY`（或 `plugins.entries.firecrawl.config.webFetch.apiKey`）可获得更高限额。如果未配置 Firecrawl，该工具会回退到直接获取，并使用内置的 `web-readability` 插件（不使用付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

请参阅 [Web 工具](/zh-CN/tools/web)。

### 提供商用量快照（状态/健康）

`openclaw status --usage` 和 `openclaw models status --json` 会调用提供商用量端点，以显示配额窗口或身份验证健康状态。调用频率较低，但仍会访问提供商 API。

请参阅[模型 CLI](/zh-CN/cli/models)。

### 压缩保护摘要

压缩保护机制可以使用当前模型对会话历史进行摘要，运行时会调用提供商 API。

请参阅[会话管理和压缩](/zh-CN/reference/session-management-compaction)。

### 模型扫描/探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

请参阅[模型 CLI](/zh-CN/cli/models)。

### Talk（语音）

配置后，Talk 模式可以调用 ElevenLabs：`ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`。

请参阅 [Talk 模式](/zh-CN/nodes/talk)。

### Skills（第三方 API）

Skills 可以将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果某个技能使用该密钥访问外部 API，费用取决于该技能的提供商。

请参阅 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [Token 使用和费用](/zh-CN/reference/token-use)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)

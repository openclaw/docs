---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、费用和使用情况可见性
    - 你正在解释 /status 或 /usage 成本报告
summary: 审计哪些内容可能花费费用、使用了哪些密钥，以及如何查看用量
title: API 使用和费用
x-i18n:
    generated_at: "2026-07-05T11:38:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d31e60931d8142ea808ae2eb8ed10d9f241ce987e46eadc9d8b7d0614befd1a1
    source_path: reference/api-usage-costs.md
    workflow: 16
---

可调用付费提供商 API 的 OpenClaw 功能地图，包括每项功能读取凭证的位置，以及产生的费用出现在哪里。

## 费用出现的位置

**`/status`**（按会话快照）

- 显示当前会话模型、上下文使用量和上一次响应的 token 数。
- 当 OpenClaw 拥有用量元数据，并且主动模型有本地定价时，会为上一条回复添加**预估费用**，其中包括明确标价的非 API key 提供商，例如 Bedrock `aws-sdk` 模型。
- 如果实时会话快照信息稀疏，`/status` 会从最新的 transcript 用量条目恢复 token/cache 计数器和主动模型标签。已有的非零实时值优先于 transcript 数据；当已存储总量缺失或更小时，接近 prompt 大小的 transcript 总量仍可优先使用。

**`/usage`**（按消息页脚）

- `/usage full` 会为每条回复追加用量页脚，包括在已配置本地定价且有用量元数据时的**预估费用**。
- `/usage tokens` 仅显示 token。订阅式 OAuth/token 和 CLI 运行时仅显示 token，除非它们提供兼容的用量元数据以及明确的本地价格。
- `/usage cost` 会打印本地费用摘要；`/usage off` 会禁用页脚。
- Gemini CLI 说明：`stream-json` 和旧版 `json` 输出都会在 `stats` 下携带用量。OpenClaw 会将 `stats.cached` 规范化为 `cacheRead`，并在需要时从 `stats.input_tokens - stats.cached` 推导输入 token。

**CLI 用量窗口**（提供商配额，而非按消息费用）

- `openclaw status --usage` 和 `openclaw channels list` 会以 `X% left` 的形式显示提供商**用量窗口**。
- 当前支持用量窗口的提供商：Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（覆盖 ChatGPT/Codex OAuth/token 认证）、Xiaomi 和 z.ai。完整的提供商/标志列表见 [模型 CLI](/zh-CN/cli/models) 和 [Channels CLI](/zh-CN/cli/channels)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会反转它们；当存在基于计数的字段时，计数字段优先。如果响应包含 `model_remains` 数组，OpenClaw 会选择聊天模型条目，在需要时从时间戳推导窗口标签，并在计划标签中包含模型名称。
- 用量认证优先来自提供商特定的钩子；不可用时，OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API key 凭证。

详细示例见 [Token use and costs](/zh-CN/reference/token-use)。

<Note>
Anthropic 已确认，复用 Claude CLI（包括 `claude -p`）是一种获准的集成模式，除非其发布新政策。Anthropic 不公开按消息的美元估算，因此 `/usage full` 无法显示 Claude CLI 用量的费用。
</Note>

## key 的发现方式

- **认证配置文件**：按 Agent 存储在 `auth-profiles.json` 中。
- **环境变量**：例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **配置**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`，可将 key 导出到技能进程的环境变量中。

## 可能消耗 key 的功能

### 核心模型响应（聊天 + 工具）

每条回复或工具调用都会在当前模型提供商上运行。这是用量和费用的主要来源，也包括在 OpenClaw 本地 UI 之外计费的订阅式托管计划：OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI/GLM Coding Plan，以及 Anthropic 启用额外用量的 Claude 登录路径。

定价配置见 [Models](/zh-CN/providers/models)，显示方式见 [Token use and costs](/zh-CN/reference/token-use)。

### 媒体理解（音频/图像/视频）

入站媒体可在回复流水线运行前通过提供商 API 进行摘要或转录。提供商支持按插件注册，并会随着插件添加而变化；当前列表和配置见 [媒体理解](/zh-CN/nodes/media-understanding)。

### 图像和视频生成

`image_generate` 和 `video_generate` 会路由到任何可用的已配置提供商。未设置 `agents.defaults.imageGenerationModel` 时，图像生成可推断一个有认证支持的默认提供商；视频生成需要显式设置 `agents.defaults.videoGenerationModel`（例如 `qwen/wan2.6-t2v`）。

当前提供商列表见 [图像生成](/zh-CN/tools/image-generation) 和 [视频生成](/zh-CN/tools/video-generation)。

### 记忆嵌入和语义搜索

当 `agents.defaults.memorySearch.provider` 指定远程适配器（例如 `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）时，语义记忆搜索会使用嵌入 API。`memorySearch.provider = "lmstudio"` 或 `"ollama"` 会针对本地/自托管服务器运行，通常没有托管计费。`memorySearch.provider = "local"` 会将所有内容保留在设备端，不产生 API 用量。可选的 `memorySearch.fallback` 提供商可覆盖本地嵌入失败。

见 [记忆](/zh-CN/concepts/memory)。

### Web 搜索工具

`web_search` 是否产生用量费用取决于所选提供商。每个提供商都会先从环境变量读取 key，然后读取 `plugins.entries.<id>.config.webSearch.apiKey`：

| 提供商                 | 环境变量                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | 无需 key；非官方，基于 HTML，无计费                                                                                                                                     |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini（Google Search） | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok（xAI）             | xAI OAuth 配置文件或 `XAI_API_KEY`                                                                                                                                      |
| Kimi（Moonshot）        | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`                                                                                                                                    |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`                                                                          |
| Ollama Web 搜索        | 对可访问且已登录的本地主机无需 key；直接 `https://ollama.com` 搜索使用 `OLLAMA_API_KEY`；受认证保护的主机会复用常规 Ollama 提供商 bearer 认证                         |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`；无需 key/自托管，无托管计费                                                                                                                        |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

旧版 `tools.web.search.*` 配置路径仍会通过兼容性 shim 加载，但已不再是推荐使用的表面。

**Brave Search 免费额度**：每个计划都包含每月续期的 5 美元免费额度。Search 计划价格为每 1,000 次请求 5 美元，因此该额度可免费覆盖每月 1,000 次请求。请在 Brave 仪表板中设置用量限制，以避免意外费用。

见 [Web 工具](/zh-CN/tools/web)。

### Web 抓取工具（Firecrawl）

`web_fetch` 可使用无 key 的 Firecrawl 入门访问；添加 `FIRECRAWL_API_KEY`（或 `plugins.entries.firecrawl.config.webFetch.apiKey`）可获得更高限制。如果未配置 Firecrawl，该工具会回退到直接抓取加内置 `web-readability` 插件（无付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

见 [Web 工具](/zh-CN/tools/web)。

### 提供商用量快照（状态/健康）

`openclaw status --usage` 和 `openclaw models status --json` 会调用提供商用量端点，以显示配额窗口或认证健康状态。这些调用量很低，但仍会触达提供商 API。

见 [模型 CLI](/zh-CN/cli/models)。

### 压缩保护摘要

压缩保护可使用当前模型摘要会话历史，运行时会调用提供商 API。

见 [会话管理与压缩](/zh-CN/reference/session-management-compaction)。

### 模型扫描/探测

`openclaw models scan` 可探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

见 [模型 CLI](/zh-CN/cli/models)。

### Talk（语音）

配置后，Talk 模式可调用 ElevenLabs：`ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`。

见 [Talk 模式](/zh-CN/nodes/talk)。

### Skills（第三方 API）

Skills 可将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果某个 skill 使用该 key 调用外部 API，费用会由该 skill 的提供商决定。

见 [Skills](/zh-CN/tools/skills)。

## 相关

- [Token use and costs](/zh-CN/reference/token-use)
- [Prompt caching](/zh-CN/reference/prompt-caching)
- [Usage tracking](/zh-CN/concepts/usage-tracking)

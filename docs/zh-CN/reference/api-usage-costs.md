---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、成本和使用可见性
    - 你正在解释 /status 或 /usage 的费用报告
summary: 审计哪些内容可能产生费用、使用了哪些密钥，以及如何查看用量
title: API 使用和费用
x-i18n:
    generated_at: "2026-06-27T03:13:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

本文档列出**可能调用 API key 的功能**以及其费用会出现在哪里。它重点说明可能产生提供商用量或付费 API 调用的 OpenClaw 功能。

## 费用会出现在哪里（聊天 + CLI）

**每会话费用快照**

- `/status` 显示当前会话模型、上下文用量以及上一条回复的 token。
- 如果 OpenClaw 拥有当前模型的用量元数据和本地定价，`/status` 还会显示上一条回复的**预估费用**。这可能包括已显式定价的非 API-key 提供商，例如 Bedrock `aws-sdk` 模型。
- 如果实时会话元数据较少，`/status` 可以从最新的转录用量条目中恢复 token/缓存计数器和当前运行时模型标签。已有的非零实时值仍然优先，而当存储总数缺失或更小时，接近提示大小的转录总数可以胜出。

**每消息费用页脚**

- `/usage full` 会在每条回复后附加用量页脚；当已为当前模型配置本地定价且用量元数据可用时，其中包括**预估费用**。
- `/usage tokens` 只显示 token；订阅式 OAuth/token 和 CLI 流程仍然只显示 token，除非该运行时提供兼容的用量元数据并且已配置显式本地价格。
- Gemini CLI 说明：默认的 `stream-json` 输出和旧版 JSON 覆盖都会从 `stats` 读取用量，将 `stats.cached` 规范化为 `cacheRead`，并在需要时从 `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用法已再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成已获许可，除非 Anthropic 发布新政策。Anthropic 仍未公开 OpenClaw 可在 `/usage full` 中显示的每消息美元估算。

**CLI 用量窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 显示提供商**用量窗口**（配额快照，而不是每消息费用）。
- 人类可读输出在各提供商之间统一为 `X% left`。
- 当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：其原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会在显示前对其取反。存在基于计数的字段时，它们仍然优先。如果提供商返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 这些配额窗口的用量凭证会在可用时来自提供商专用钩子；否则 OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API-key 凭证。

详情和示例见 [Token use & costs](/zh-CN/reference/token-use)。

## key 的发现方式

OpenClaw 可以从以下位置获取凭证：

- **认证配置文件**（按智能体，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），它们可能会将 key 导出到技能进程环境中。

## 可能消耗 key 的功能

### 1) 核心模型回复（聊天 + 工具）

每条回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是用量和费用的主要来源。

这也包括订阅式托管提供商，它们仍会在 OpenClaw 本地 UI 之外计费，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及启用了**额外用量**的 Anthropic OpenClaw Claude 登录路径。

定价配置见 [Models](/zh-CN/providers/models)，显示方式见 [Token use & costs](/zh-CN/reference/token-use)。

### 2) 媒体理解（音频/图像/视频）

入站媒体可以在回复运行前进行摘要/转录。这会使用模型/提供商 API。

- 音频：OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

见 [Media understanding](/zh-CN/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成功能也可能消耗提供商 key：

- 图像生成：OpenAI / Google / DeepInfra / fal / MiniMax
- 视频生成：DeepInfra / Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断一个由认证支持的默认提供商。视频生成目前需要显式的 `agents.defaults.videoGenerationModel`，例如 `qwen/wan2.6-t2v`。

见 [Image generation](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen) 和 [Models](/zh-CN/concepts/models)。

### 4) 记忆嵌入 + 语义搜索

配置为远程提供商时，语义记忆搜索会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI 嵌入
- `memorySearch.provider = "gemini"` → Gemini 嵌入
- `memorySearch.provider = "voyage"` → Voyage 嵌入
- `memorySearch.provider = "mistral"` → Mistral 嵌入
- `memorySearch.provider = "deepinfra"` → DeepInfra 嵌入
- `memorySearch.provider = "lmstudio"` → LM Studio 嵌入（本地/自托管）
- `memorySearch.provider = "ollama"` → Ollama 嵌入（本地/自托管；通常没有托管 API 计费）
- 如果本地嵌入失败，可选回退到远程提供商

你可以使用 `memorySearch.provider = "local"` 保持本地运行（无 API 用量）。

见 [Memory](/zh-CN/concepts/memory)。

### 5) Web 搜索工具

`web_search` 可能会根据你的提供商产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：xAI OAuth 配置文件、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：对于可访问且已登录的本地 Ollama 主机，无需 key；直接 `https://ollama.com` 搜索使用 `OLLAMA_API_KEY`，受认证保护的主机可以复用常规 Ollama 提供商 bearer 认证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：显式选择时为免 key 提供商（无 API 计费，但非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（免 key/自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍会通过临时兼容垫片加载，但它们不再是推荐的配置表面。

**Brave Search 免费额度：**每个 Brave 套餐都包含每月续期的 \$5 免费额度。Search 套餐每 1,000 次请求收费 \$5，因此该额度可免费覆盖每月 1,000 次请求。请在 Brave 仪表板中设置你的用量限制，以避免意外费用。

见 [Web 工具](/zh-CN/tools/web)。

### 5) Web 抓取工具（Firecrawl）

`web_fetch` 可以通过免 key 入门访问调用 **Firecrawl**。添加 API key 可获得更高限制：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退到直接抓取加内置 `web-readability` 插件（无付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

见 [Web 工具](/zh-CN/tools/web)。

### 6) 提供商用量快照（状态/健康）

一些状态命令会调用**提供商用量端点**来显示配额窗口或认证健康状态。这些通常是低频调用，但仍会访问提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

见 [模型 CLI](/zh-CN/cli/models)。

### 7) 压缩保护摘要

压缩保护可以使用**当前模型**对会话历史进行摘要，这会在运行时调用提供商 API。

见 [Session management + compaction](/zh-CN/reference/session-management-compaction)。

### 8) 模型扫描/探测

启用探测时，`openclaw models scan` 可以探测 OpenRouter 模型，并使用 `OPENROUTER_API_KEY`。

见 [模型 CLI](/zh-CN/cli/models)。

### 9) Talk（语音）

配置后，Talk 模式可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

见 [Talk 模式](/zh-CN/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以在 `skills.entries.<name>.apiKey` 中存储 `apiKey`。如果某个 skill 使用该 key 访问外部 API，它可能会根据该 skill 的提供商产生费用。

见 [Skills](/zh-CN/tools/skills)。

## 相关

- [Token use and costs](/zh-CN/reference/token-use)
- [Prompt caching](/zh-CN/reference/prompt-caching)
- [Usage tracking](/zh-CN/concepts/usage-tracking)

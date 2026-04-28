---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、费用和使用情况可见性
    - 你正在说明 /status 或 /usage 的费用报告
summary: 审计哪些项目会产生费用、使用了哪些密钥，以及如何查看使用情况
title: API 使用情况和费用
x-i18n:
    generated_at: "2026-04-28T00:33:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5638007a77a93701ce4ed9139a6c4377c951e2d69941423c3e1b19b5bd52d5d5
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 使用情况和费用

本文档列出了**哪些功能会调用 API 密钥**以及这些费用会显示在哪里。重点介绍 OpenClaw 中可能产生提供商使用量或付费 API 调用的功能。

## 费用显示在哪里（聊天 + CLI）

**每个会话的费用快照**

- `/status` 会显示当前会话模型、上下文使用情况以及上一条响应的 token。
- 如果模型使用的是**API 密钥身份验证**，`/status` 还会显示上一条回复的**预估费用**。
- 如果实时会话元数据较少，`/status` 可以从最新的转录使用记录中恢复 token/缓存计数器以及当前活动运行时模型标签。现有的非零实时值仍然优先；当存储的总计缺失或更小时，基于提示词大小的转录总计也可以优先生效。

**每条消息的费用页脚**

- `/usage full` 会在每条回复后附加使用情况页脚，其中包括**预估费用**（仅限 API 密钥）。
- `/usage tokens` 仅显示 token；订阅式 OAuth/token 和 CLI 流程会隐藏美元费用。
- Gemini CLI 说明：当 CLI 返回 JSON 输出时，OpenClaw 会从 `stats` 读取使用情况，将 `stats.cached` 规范化为 `cacheRead`，并在需要时根据 `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 说明：Anthropic 员工告诉我们，再次允许 OpenClaw 风格的 Claude CLI 使用，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用法视为此集成中被认可的方式，除非 Anthropic 发布新的策略。Anthropic 仍未提供 OpenClaw 可在 `/usage full` 中显示的逐条消息美元费用估算。

**CLI 使用窗口（provider 配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示 provider 的**使用窗口**（配额快照，而非逐条消息费用）。
- 面向用户的输出会在不同提供商之间统一为 `X% left`。
- 当前支持使用窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、小米和 z.ai。
- MiniMax 说明：其原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会在显示前对其取反。如果存在基于计数的字段，则这些字段仍然优先。如果 provider 返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，并在需要时根据时间戳推导窗口标签，同时在套餐标签中包含模型名称。
- 这些配额窗口的使用情况身份验证会在可用时来自 provider 专用钩子；否则，OpenClaw 会回退为从 auth 配置文件、环境变量或配置中匹配 OAuth/API 密钥凭证。

详情和示例请参阅 [Token 使用情况和费用](/zh-CN/reference/token-use)。

## 如何发现密钥

OpenClaw 可以从以下位置获取凭证：

- **Auth 配置文件**（按智能体区分，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），它们可能会将密钥导出到 skill 进程环境中。

## 哪些功能会消耗密钥

### 1) 核心模型响应（聊天 + 工具）

每条回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是使用量和费用的主要来源。

这也包括订阅式托管提供商，它们仍会在 OpenClaw 的本地 UI 之外计费，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及启用了 **Extra Usage** 的 Anthropic OpenClaw Claude 登录路径。

有关定价配置，请参阅 [Models](/zh-CN/providers/models)；有关显示方式，请参阅 [Token 使用情况和费用](/zh-CN/reference/token-use)。

### 2) 媒体理解（音频/图像/视频）

在回复运行之前，入站媒体可能会被总结或转录。这会使用模型/提供商 API。

- 音频：OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot AI / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot AI。

请参阅 [媒体理解](/zh-CN/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成能力也可能会消耗提供商密钥：

- 图像生成：OpenAI / Google / DeepInfra / fal / MiniMax
- 视频生成：DeepInfra / Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断使用具备身份验证的 provider 默认值。视频生成当前需要显式设置 `agents.defaults.videoGenerationModel`，例如 `qwen/wan2.6-t2v`。

请参阅 [图像生成](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen) 和 [Models](/zh-CN/concepts/models)。

### 4) 记忆嵌入 + 语义搜索

当配置为远程提供商时，语义记忆搜索会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（本地/自托管）
- `memorySearch.provider = "ollama"` → Ollama embeddings（本地/自托管；通常不会产生托管 API 计费）
- 如果本地嵌入失败，可选回退到远程提供商

你可以通过设置 `memorySearch.provider = "local"` 保持本地运行（无 API 使用）。

请参阅 [内存](/zh-CN/concepts/memory)。

### 5) Web 搜索工具

`web_search` 可能会根据你的提供商产生使用费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot AI）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：对于可访问且已登录的本地 Ollama host 无需密钥；直接 `https://ollama.com` 搜索使用 `OLLAMA_API_KEY`，而受身份验证保护的 host 可以复用普通 Ollama provider bearer auth
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：无密钥回退方案（无 API 计费，但非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（无密钥/自托管；无托管 API 计费）

旧版 `tools.web.search.*` provider 路径仍会通过临时兼容层加载，但它们已不再是推荐的配置界面。

**Brave Search 免费额度：** 每个 Brave 套餐都包含每月可续期的 5 美元免费额度。Search 套餐价格为每 1,000 次请求 5 美元，因此该额度可覆盖每月 1,000 次免费请求。请在 Brave 控制台中设置使用上限，以避免意外费用。

请参阅 [Web 工具](/zh-CN/tools/web)。

### 5) Web 抓取工具（Firecrawl）

当存在 API 密钥时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退为直接抓取加内置 `web-readability` 插件（无付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

请参阅 [Web 工具](/zh-CN/tools/web)。

### 6) Provider 使用情况快照（status/health）

某些状态命令会调用**provider 使用情况端点**，以显示配额窗口或身份验证健康状态。
这些通常是低频调用，但仍会命中 provider API：

- `openclaw status --usage`
- `openclaw models status --json`

请参阅 [Models CLI](/zh-CN/cli/models)。

### 7) 压缩保护总结

压缩保护机制可以使用**当前模型**对会话历史进行总结，这在运行时会调用提供商 API。

请参阅 [会话管理 + 压缩](/zh-CN/reference/session-management-compaction)。

### 8) 模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

请参阅 [Models CLI](/zh-CN/cli/models)。

### 9) Talk（语音）

配置后，Talk 模式可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

请参阅 [Talk 模式](/zh-CN/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以在 `skills.entries.<name>.apiKey` 中存储 `apiKey`。如果某个 skill 使用该密钥调用外部 API，则可能会根据该 skill 的提供商产生费用。

请参阅 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [Token 使用情况和费用](/zh-CN/reference/token-use)
- [提示词缓存](/zh-CN/reference/prompt-caching)
- [使用情况跟踪](/zh-CN/concepts/usage-tracking)

---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、费用和用量可见性
    - 你正在说明 `/status` 或 `/usage` 的费用报告
summary: 审计哪些项目可能会产生费用、会使用哪些密钥，以及如何查看用量
title: API 用量和费用
x-i18n:
    generated_at: "2026-04-27T01:11:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d61fb753442d3be6987877c296238c350d81fcaa8f785f3f33c23463b7831836
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 用量和费用

本文档列出了**可能调用 API 密钥的功能**以及其费用会显示在哪里。它重点介绍可能生成提供商用量或付费 API 调用的 OpenClaw 功能。

## 费用显示位置（聊天 + CLI）

**按会话的费用快照**

- `/status` 会显示当前会话模型、上下文用量以及上一条回复的 token 数。
- 如果模型使用**API 密钥认证**，`/status` 还会显示上一条回复的**预估费用**。
- 如果实时会话元数据较少，`/status` 可以从最近的转录用量条目中恢复 token / 缓存计数器以及当前激活运行时的模型标签。现有的非零实时数值仍然优先；当存储的总计缺失或更小时，基于提示大小的转录总计可能会胜出。

**按消息的费用页脚**

- `/usage full` 会在每条回复后附加一个用量页脚，其中包括**预估费用**（仅 API 密钥）。
- `/usage tokens` 只显示 token；订阅式 OAuth / token 和 CLI 流程会隐藏美元费用。
- Gemini CLI 说明：当 CLI 返回 JSON 输出时，OpenClaw 会从 `stats` 读取用量，将 `stats.cached` 规范化为 `cacheRead`，并在需要时从 `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 说明：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用量再次被允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用量视为此集成的已获准行为，除非 Anthropic 发布新政策。Anthropic 仍然不会公开 OpenClaw 可在 `/usage full` 中显示的按消息美元预估值。

**CLI 用量窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示提供商的**用量窗口**（配额快照，而不是按消息费用）。
- 面向用户的输出会被规范化为跨提供商统一的 `X% left`。
- 当前支持用量窗口的提供商有：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：其原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会在显示前将其反转。如果存在基于计数的字段，则这些字段仍然优先。如果提供商返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，在需要时根据时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 这些配额窗口的用量认证会在可用时来自提供商特定的钩子；否则 OpenClaw 会回退为从认证配置文件、环境变量或配置中匹配 OAuth / API 密钥凭证。

详见 [Token 用量与费用](/zh-CN/reference/token-use) 了解详情和示例。

## 如何发现密钥

OpenClaw 可以从以下位置获取凭证：

- **认证配置文件**（每个智能体独立，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），可将密钥导出到 skill 进程环境中。

## 可能消耗密钥的功能

### 1) 核心模型回复（聊天 + 工具）

每次回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是用量和费用的主要来源。

这也包括订阅式托管提供商，它们仍会在 OpenClaw 本地 UI 之外计费，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及启用 **Extra Usage** 的 Anthropic OpenClaw Claude 登录路径。

定价配置请参见 [Models](/zh-CN/providers/models)，显示方式请参见 [Token 用量与费用](/zh-CN/reference/token-use)。

### 2) 媒体理解（音频 / 图像 / 视频）

入站媒体可以在回复运行前先被总结 / 转录。这会使用模型 / 提供商 API。

- 音频：OpenAI / Groq / Deepgram / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

参见 [媒体理解](/zh-CN/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成能力也可能消耗提供商密钥：

- 图像生成：OpenAI / Google / fal / MiniMax
- 视频生成：Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断出一个带认证支持的提供商默认值。视频生成当前需要显式设置 `agents.defaults.videoGenerationModel`，例如 `qwen/wan2.6-t2v`。

参见 [图像生成](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen) 和 [Models](/zh-CN/concepts/models)。

### 4) 记忆嵌入 + 语义搜索

语义记忆搜索在配置为远程提供商时会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（本地 / 自托管）
- `memorySearch.provider = "ollama"` → Ollama embeddings（本地 / 自托管；通常不会产生托管 API 计费）
- 如果本地嵌入失败，可选择回退到远程提供商

你可以使用 `memorySearch.provider = "local"` 保持本地运行（无 API 用量）。

参见 [Memory](/zh-CN/concepts/memory)。

### 5) Web 搜索工具

`web_search` 可能会根据你的提供商产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：对于可访问且已登录的本地 Ollama 主机，无需密钥；直接使用 `https://ollama.com` 搜索时使用 `OLLAMA_API_KEY`，受认证保护的主机可以复用普通 Ollama provider bearer 认证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：免密钥回退方案（无 API 计费，但属于非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（免密钥 / 自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍会通过临时兼容层加载，但它们已不再是推荐的配置入口。

**Brave Search 免费额度：** Brave 的每个套餐都包含每月 \$5 的自动续期免费额度。Search 套餐费用为每 1,000 次请求 \$5，因此该额度可覆盖每月 1,000 次请求且无需付费。请在 Brave 控制台中设置用量上限，以避免意外费用。

参见 [Web 工具](/zh-CN/tools/web)。

### 5) Web 抓取工具（Firecrawl）

当存在 API 密钥时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退为直接抓取加内置 `web-readability` 插件（无付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

参见 [Web 工具](/zh-CN/tools/web)。

### 6) 提供商用量快照（status / health）

某些状态命令会调用**提供商用量端点**以显示配额窗口或认证健康状态。
这些通常是低频调用，但仍然会访问提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

参见 [Models CLI](/zh-CN/cli/models)。

### 7) 压缩保护总结

压缩保护可以使用**当前模型**总结会话历史，这在运行时会调用提供商 API。

参见 [会话管理 + 压缩](/zh-CN/reference/session-management-compaction)。

### 8) 模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并会在启用探测时使用 `OPENROUTER_API_KEY`。

参见 [Models CLI](/zh-CN/cli/models)。

### 9) Talk（语音）

Talk 模式在配置后可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

参见 [Talk 模式](/zh-CN/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以在 `skills.entries.<name>.apiKey` 中存储 `apiKey`。如果某个 skill 使用该密钥访问外部 API，则可能根据该 skill 的提供商产生费用。

参见 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [Token 用量和费用](/zh-CN/reference/token-use)
- [Prompt 缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)

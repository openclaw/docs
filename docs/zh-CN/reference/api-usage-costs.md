---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、成本和使用情况可见性
    - 你正在说明 /status 或 /usage 的成本报告
summary: 审计哪些内容可能产生费用、使用了哪些密钥，以及如何查看用量
title: API 使用量和费用
x-i18n:
    generated_at: "2026-05-06T05:01:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

本文档列出**可能调用 API key 的功能**以及其费用显示位置。它重点说明可能产生提供商用量或付费 API 调用的 OpenClaw 功能。

## 费用显示位置（聊天 + CLI）

**每个会话的费用快照**

- `/status` 会显示当前会话模型、上下文用量以及上一次响应的 token。
- 如果模型使用 **API-key 认证**，`/status` 还会显示上一次回复的**预估费用**。
- 如果实时会话元数据较少，`/status` 可以从最新的 transcript 用量条目中恢复 token/cache 计数器以及活动运行时模型标签。现有的非零实时值仍然优先；当已存储总量缺失或更小时，prompt 大小的 transcript 总量可能胜出。

**每条消息的费用页脚**

- `/usage full` 会在每条回复后附加用量页脚，包括**预估费用**（仅限 API-key）。
- `/usage tokens` 仅显示 token；订阅式 OAuth/token 和 CLI 流程会隐藏美元费用。
- Gemini CLI 注意事项：当 CLI 返回 JSON 输出时，OpenClaw 会从 `stats` 读取用量，将 `stats.cached` 标准化为 `cacheRead`，并在需要时根据 `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 注意事项：Anthropic 员工告诉我们，OpenClaw 风格的 Claude CLI 用量已再次允许，因此 OpenClaw 将 Claude CLI 复用和 `claude -p` 用量视为此集成中已获认可的用法，除非 Anthropic 发布新策略。Anthropic 仍未公开 OpenClaw 可在 `/usage full` 中显示的逐消息美元预估。

**CLI 用量窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示提供商**用量窗口**（配额快照，不是逐消息费用）。
- 人类可读输出会在各提供商间统一为 `X% left`。
- 当前用量窗口提供商：Anthropic、GitHub Copilot、Gemini CLI、OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 注意事项：其原始 `usage_percent` / `usagePercent` 字段表示剩余配额，因此 OpenClaw 会在显示前将其反转。存在基于数量的字段时，它们仍然优先。如果提供商返回 `model_remains`，OpenClaw 会优先使用聊天模型条目，在需要时从时间戳推导窗口标签，并在计划标签中包含模型名称。
- 这些配额窗口的用量认证会在可用时来自提供商特定钩子；否则 OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API-key 凭证。

详情和示例见 [Token use & costs](/zh-CN/reference/token-use)。

## key 的发现方式

OpenClaw 可以从以下位置获取凭证：

- **认证配置文件**（每个智能体，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、`talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），可将 key 导出到 skill 进程环境中。

## 可能消耗 key 的功能

### 1) 核心模型响应（聊天 + 工具）

每次回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是用量和费用的主要来源。

这也包括订阅式托管提供商，它们仍会在 OpenClaw 本地 UI 之外计费，例如 **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及启用 **Extra Usage** 的 Anthropic OpenClaw Claude 登录路径。

价格配置见 [Models](/zh-CN/providers/models)，显示方式见 [Token use & costs](/zh-CN/reference/token-use)。

### 2) 媒体理解（音频/图像/视频）

入站媒体可以在回复运行前被总结/转录。这会使用模型/提供商 API。

- 音频：OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

见 [媒体理解](/zh-CN/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成能力也可能消耗提供商 key：

- 图像生成：OpenAI / Google / DeepInfra / fal / MiniMax
- 视频生成：DeepInfra / Qwen

当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断一个由认证支持的默认提供商。视频生成目前需要显式设置 `agents.defaults.videoGenerationModel`，例如 `qwen/wan2.6-t2v`。

见 [图像生成](/zh-CN/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen) 和 [Models](/zh-CN/concepts/models)。

### 4) 记忆嵌入 + 语义搜索

当配置为远程提供商时，语义记忆搜索会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI embeddings
- `memorySearch.provider = "gemini"` → Gemini embeddings
- `memorySearch.provider = "voyage"` → Voyage embeddings
- `memorySearch.provider = "mistral"` → Mistral embeddings
- `memorySearch.provider = "deepinfra"` → DeepInfra embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio embeddings（本地/自托管）
- `memorySearch.provider = "ollama"` → Ollama embeddings（本地/自托管；通常没有托管 API 计费）
- 如果本地嵌入失败，可选择回退到远程提供商

你可以使用 `memorySearch.provider = "local"` 让它保持本地运行（无 API 用量）。

见 [Memory](/zh-CN/concepts/memory)。

### 5) Web 搜索工具

`web_search` 可能会根据你的提供商产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：对于可访问且已登录的本地 Ollama 主机无需 key；直接搜索 `https://ollama.com` 使用 `OLLAMA_API_KEY`，受认证保护的主机可复用普通 Ollama 提供商 bearer 认证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：无需 key 的回退方案（无 API 计费，但非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（无需 key/自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍会通过临时兼容 shim 加载，但它们不再是推荐的配置表面。

**Brave Search 免费额度：** 每个 Brave 计划都包含每月续期的 \$5 免费额度。Search 计划每 1,000 次请求收费 \$5，因此该额度可免费覆盖每月 1,000 次请求。请在 Brave 仪表板中设置你的用量限制，以避免意外收费。

见 [Web 工具](/zh-CN/tools/web)。

### 5) Web 获取工具（Firecrawl）

当存在 API key 时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退到直接获取并使用内置 `web-readability` 插件（无付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

见 [Web 工具](/zh-CN/tools/web)。

### 6) 提供商用量快照（状态/健康检查）

某些状态命令会调用**提供商用量端点**来显示配额窗口或认证健康状态。这些调用通常频率较低，但仍会命中提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

见 [Models CLI](/zh-CN/cli/models)。

### 7) 压缩保护总结

压缩保护可以使用**当前模型**总结会话历史，它运行时会调用提供商 API。

见 [会话管理 + 压缩](/zh-CN/reference/session-management-compaction)。

### 8) 模型扫描 / 探测

`openclaw models scan` 可以探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

见 [Models CLI](/zh-CN/cli/models)。

### 9) Talk（语音）

配置后，Talk 模式可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

见 [Talk 模式](/zh-CN/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以在 `skills.entries.<name>.apiKey` 中存储 `apiKey`。如果某个 skill 使用该 key 调用外部 API，它可能会按该 skill 的提供商产生费用。

见 [Skills](/zh-CN/tools/skills)。

## 相关内容

- [Token 使用和费用](/zh-CN/reference/token-use)
- [Prompt caching](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)

---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、成本和用量可见性
    - 你在解释 /status 或 /usage 成本报告
summary: 审计哪些功能会花钱、使用了哪些密钥，以及如何查看用量
title: API 用量与成本
x-i18n:
    generated_at: "2026-04-05T10:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API 用量与成本

本文档列出了**可能调用 API 密钥的功能**以及它们的成本会显示在哪里。它重点说明
OpenClaw 中可能产生提供商用量或付费 API 调用的功能。

## 成本显示位置（聊天 + CLI）

**按会话的成本快照**

- `/status` 会显示当前会话模型、上下文用量以及上一次响应的 token 数。
- 如果模型使用**API 密钥认证**，`/status` 还会显示上一次回复的**估算成本**。
- 如果实时会话元数据较少，`/status` 可以从最新转录中的用量
  条目恢复 token/缓存计数器和当前活动运行时模型标签。
  现有的非零实时值仍然优先，如果存储的总量缺失或更小，
  按提示大小统计的转录总量也可以优先生效。

**按消息的成本页脚**

- `/usage full` 会在每条回复后附加一个用量页脚，其中包括**估算成本**（仅限 API 密钥）。
- `/usage tokens` 仅显示 token；基于订阅的 OAuth/token 和 CLI 流程会隐藏美元成本。
- Gemini CLI 说明：当 CLI 返回 JSON 输出时，OpenClaw 会从
  `stats` 读取用量，将 `stats.cached` 规范化为 `cacheRead`，并在需要时从
  `stats.input_tokens - stats.cached` 推导输入 token。

Anthropic 说明：Anthropic 公开的 Claude Code 文档仍将直接 Claude
Code 终端用量计入 Claude 套餐限制。另一方面，Anthropic 已告知 OpenClaw
用户，从 **2026 年 4 月 4 日太平洋时间下午 12:00 / 英国夏令时晚上 8:00** 起，
**OpenClaw** 的 Claude 登录路径将被视为第三方 harness 用法，
并且需要单独于订阅计费的 **Extra Usage**。Anthropic
并未提供 OpenClaw 可在
`/usage full` 中显示的逐条消息美元估算值。

**CLI 用量窗口（提供商配额）**

- `openclaw status --usage` 和 `openclaw channels list` 会显示提供商**用量窗口**
  （配额快照，而不是逐条消息成本）。
- 人类可读输出会在各提供商之间统一规范为 `X% left`。
- 当前支持用量窗口的提供商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 说明：其原始 `usage_percent` / `usagePercent` 字段表示剩余
  配额，因此 OpenClaw 会在显示前将其取反。如果存在基于计数的字段，
  这些字段仍然优先生效。如果提供商返回 `model_remains`，OpenClaw 会优先选择
  聊天模型条目，必要时从时间戳推导窗口标签，
  并在套餐标签中包含模型名称。
- 这些配额窗口的用量认证会在可用时优先来自提供商特定 hooks；
  否则 OpenClaw 会回退到从认证配置文件、环境变量或配置中匹配 OAuth/API 密钥
  凭证。

详情和示例参见 [Token 使用与成本](/zh-CN/reference/token-use)。

## 如何发现密钥

OpenClaw 可以从以下位置获取凭证：

- **认证配置文件**（按智能体划分，存储在 `auth-profiles.json` 中）。
- **环境变量**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **配置**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、
  `plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、
  `talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），它们可能会将密钥导出到 Skill 进程环境中。

## 会消耗密钥的功能

### 1) 核心模型响应（聊天 + 工具）

每次回复或工具调用都会使用**当前模型提供商**（OpenAI、Anthropic 等）。这是
用量和成本的主要来源。

这也包括那些仍在 OpenClaw 本地 UI 之外计费的订阅式托管提供商，
例如 **OpenAI Codex**、**Alibaba Cloud Model Studio
Coding Plan**、**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及
启用了 **Extra Usage** 的 Anthropic OpenClaw Claude 登录路径。

关于定价配置参见 [模型](/zh-CN/providers/models)，关于显示方式参见 [Token 使用与成本](/zh-CN/reference/token-use)。

### 2) 媒体理解（音频/图像/视频）

在运行回复之前，可以先对输入媒体进行摘要或转录。这会使用模型/提供商 API。

- 音频：OpenAI / Groq / Deepgram / Google / Mistral。
- 图像：OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 视频：Google / Qwen / Moonshot。

参见 [媒体理解](/zh-CN/nodes/media-understanding)。

### 3) 图像和视频生成

共享生成能力也可能消耗提供商密钥：

- 图像生成：OpenAI / Google / fal / MiniMax
- 视频生成：Qwen

当
`agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断一个基于认证的提供商默认值。视频生成目前
需要显式设置 `agents.defaults.videoGenerationModel`，例如
`qwen/wan2.6-t2v`。

参见 [图像生成](/tools/image-generation)、[Qwen Cloud](/zh-CN/providers/qwen)
和 [模型](/zh-CN/concepts/models)。

### 4) 记忆嵌入 + 语义搜索

语义记忆搜索在配置为远程提供商时会使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI 嵌入
- `memorySearch.provider = "gemini"` → Gemini 嵌入
- `memorySearch.provider = "voyage"` → Voyage 嵌入
- `memorySearch.provider = "mistral"` → Mistral 嵌入
- `memorySearch.provider = "ollama"` → Ollama 嵌入（本地/自托管；通常没有托管 API 计费）
- 如果本地嵌入失败，可选择回退到远程提供商

你可以通过设置 `memorySearch.provider = "local"` 保持本地运行（不使用 API）。

参见 [记忆](/zh-CN/concepts/memory)。

### 5) Web 搜索工具

`web_search` 可能会根据你的提供商产生用量费用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web 搜索**：默认不需要密钥，但需要可访问的 Ollama 主机以及 `ollama signin`；当主机要求认证时，也可以复用普通 Ollama 提供商 bearer 认证
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：无密钥回退（不产生 API 计费，但属于非官方且基于 HTML）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（无密钥/自托管；无托管 API 计费）

旧版 `tools.web.search.*` 提供商路径仍会通过临时兼容层加载，但它们已不再是推荐的配置入口。

**Brave Search 免费额度：** 每个 Brave 套餐都包含每月 \$5 的可续期
免费额度。Search 套餐费用为每 1,000 次请求 \$5，因此该额度可覆盖
每月 1,000 次请求且无需付费。请在 Brave 控制台中设置用量上限，
以避免意外收费。

参见 [Web 工具](/zh-CN/tools/web)。

### 5) Web 抓取工具（Firecrawl）

当存在 API 密钥时，`web_fetch` 可以调用 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未配置 Firecrawl，该工具会回退到直接抓取 + readability（无付费 API）。

参见 [Web 工具](/zh-CN/tools/web)。

### 6) 提供商用量快照（status/health）

某些状态命令会调用**提供商用量端点**来显示配额窗口或认证健康状态。
这些通常是低频调用，但仍会访问提供商 API：

- `openclaw status --usage`
- `openclaw models status --json`

参见 [Models CLI](/cli/models)。

### 7) 压缩保护摘要

压缩保护可以使用**当前模型**对会话历史进行摘要，
因此运行时会调用提供商 API。

参见 [会话管理 + 压缩](/zh-CN/reference/session-management-compaction)。

### 8) 模型扫描 / 探测

`openclaw models scan` 在启用探测时可以探测 OpenRouter 模型，并使用 `OPENROUTER_API_KEY`。

参见 [Models CLI](/cli/models)。

### 9) Talk（语音）

Talk 模式在配置后可以调用 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

参见 [Talk 模式](/zh-CN/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以将 `apiKey` 存储在 `skills.entries.<name>.apiKey` 中。如果某个 Skill 使用该密钥访问外部
API，则可能根据该 Skill 的提供商产生费用。

参见 [Skills](/zh-CN/tools/skills)。

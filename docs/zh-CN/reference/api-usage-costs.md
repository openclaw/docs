---
read_when:
    - 你想了解哪些功能可能会调用付费 API
    - 你需要审计密钥、成本和使用可见性
    - 你正在解释 /status 或 /usage 的成本报告
summary: 审计哪些内容可能产生费用、使用了哪些密钥，以及如何查看用量
title: API 使用和费用
x-i18n:
    generated_at: "2026-07-06T10:53:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

可调用付费提供商 API 的 OpenClaw 功能地图、每项功能读取凭证的位置，以及产生的费用显示在哪里。

## 费用显示在哪里

**`/status`**（按会话快照）

- 显示当前会话模型、上下文用量，以及最后一次响应的 token。
- 当 OpenClaw 拥有用量元数据和当前模型的本地定价时，会为最后一次回复添加**预估费用**，包括 Bedrock `aws-sdk` 模型等显式定价的非 API key 提供商。
- 如果实时会话快照信息较少，`/status` 会从最新的 transcript 用量条目中恢复 token/cache 计数器和当前模型标签。现有的非零实时值优先于 transcript 数据；当存储的总量缺失或更小时，prompt 大小的 transcript 总量仍可优先。

**`/usage`**（按消息页脚）

- `/usage full` 会在每条回复后追加用量页脚；当已配置本地定价且有用量元数据时，也会包含**预估费用**。
- `/usage tokens` 仅显示 token。订阅式 OAuth/token 和 CLI 运行时仅显示 token，除非它们提供兼容的用量元数据以及显式本地价格。
- `/usage cost` 打印本地费用摘要；`/usage off` 禁用页脚。
- Gemini CLI 说明：`stream-json` 和旧版 `json` 输出都会在 `stats` 下携带用量。OpenClaw 会将 `stats.cached` 规范化为 `cacheRead`，并在需要时从 `stats.input_tokens - stats.cached` 推导输入 token。

**Control UI → 用量**（跨会话分析）

- 显示所选日期范围内从 transcript 派生的 token 和预估费用总量，并按提供商、模型、智能体、渠道和 token 类型拆分。
- 比较以所选范围结束日期为终点的较短日历窗口。缺失日期按零用量日历日计算；不会跳过它们来生成更密集的窗口。
- 直接标注每日图表刻度。`√` 徽标表示平方根压缩正在让低用量日期保持可见。
- 这些总量描述的是可用的本地会话历史，而不是提供商发票或生命周期计费账本。当部分条目缺少定价时，UI 会发出警告。

**CLI 用量窗口**（提供商配额，而非按消息费用）

- `openclaw status --usage` 和 `openclaw channels list` 会以 `X% left` 显示提供商**用量窗口**。
- 当前用量窗口提供商：Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（涵盖 ChatGPT/Codex OAuth/token 凭证）、Xiaomi 和 z.ai。完整的提供商/flag 列表见[模型 CLI](/zh-CN/cli/models)和[渠道 CLI](/zh-CN/cli/channels)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段报告剩余配额，因此 OpenClaw 会将其反转；存在基于计数的字段时，它们优先。如果响应包含 `model_remains` 数组，OpenClaw 会选择聊天模型条目，在需要时从时间戳推导窗口标签，并在套餐标签中包含模型名称。
- 用量凭证优先来自可用的提供商特定钩子，否则 OpenClaw 会回退到从凭证配置档案、环境变量或配置中匹配 OAuth/API key 凭证。

详细示例见 [Token 用量和费用](/zh-CN/reference/token-use)。

<Note>
Anthropic 已确认 Claude CLI 复用（包括 `claude -p`）是一种受认可的集成模式，除非它发布新策略。Anthropic 不公开按消息的金额预估，因此 `/usage full` 无法显示 Claude CLI 用量的费用。
</Note>

## key 如何发现

- **凭证配置档案**：按智能体存储在 `auth-profiles.json` 中。
- **环境变量**：例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **配置**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`，可将 key 导出到 skill 进程环境变量。

## 可能花费 key 的功能

### 核心模型响应（聊天 + 工具）

每次回复或工具调用都在当前模型提供商上运行。这是用量和费用的主要来源，包括在 OpenClaw 本地 UI 之外计费的订阅式托管套餐：OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI/GLM Coding Plan，以及启用 Extra Usage 的 Anthropic Claude 登录路径。

定价配置见 [Models](/zh-CN/providers/models)，显示方式见 [Token 用量和费用](/zh-CN/reference/token-use)。

### 媒体理解（音频/图像/视频）

入站媒体可在回复流水线运行前通过提供商 API 摘要或转录。提供商支持按插件注册，并会随着插件添加而变化；当前列表和配置见[媒体理解](/zh-CN/nodes/media-understanding)。

### 图像和视频生成

`image_generate` 和 `video_generate` 会路由到可用的已配置提供商。当 `agents.defaults.imageGenerationModel` 未设置时，图像生成可以推断由凭证支持的默认提供商；视频生成需要显式的 `agents.defaults.videoGenerationModel`（例如 `qwen/wan2.6-t2v`）。

当前提供商列表见[图像生成](/zh-CN/tools/image-generation)和[视频生成](/zh-CN/tools/video-generation)。

### 记忆嵌入和语义搜索

当 `agents.defaults.memorySearch.provider` 命名远程适配器（例如 `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）时，语义记忆搜索会使用嵌入 API。`memorySearch.provider = "lmstudio"` 或 `"ollama"` 会针对本地/自托管服务器运行，通常没有托管计费。`memorySearch.provider = "local"` 将所有内容保留在设备端，不产生 API 用量。可选的 `memorySearch.fallback` 提供商可覆盖本地嵌入失败。

见[记忆](/zh-CN/concepts/memory)。

### Web 搜索工具

`web_search` 可能根据所选提供商产生用量费用。每个提供商先从环境变量读取 key，然后读取 `plugins.entries.<id>.config.webSearch.apiKey`：

| 提供商                 | 环境变量                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | 无需 key；非官方，基于 HTML，无计费                                                                                                                                     |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini（Google Search） | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok（xAI）             | xAI OAuth 配置档案或 `XAI_API_KEY`                                                                                                                                     |
| Kimi（Moonshot）        | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`                                                                          |
| Ollama Web 搜索        | 对可访问且已登录的本地主机无需 key；直接 `https://ollama.com` 搜索使用 `OLLAMA_API_KEY`；受凭证保护的主机会复用普通 Ollama 提供商 bearer 凭证                         |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`；无需 key/自托管，无托管计费                                                                                                                        |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

旧版 `tools.web.search.*` 配置路径仍会通过兼容性 shim 加载，但不再是推荐界面。

**Brave Search 免费额度**：每个套餐都包含每月续期的 5 美元免费额度。Search 套餐价格为每 1,000 次请求 5 美元，因此该额度可免费覆盖每月 1,000 次请求。在 Brave 仪表板中设置用量限制以避免意外费用。

见 [Web 工具](/zh-CN/tools/web)。

### Web 获取工具（Firecrawl）

`web_fetch` 可使用免 key 的 starter 访问调用 Firecrawl；添加 `FIRECRAWL_API_KEY`（或 `plugins.entries.firecrawl.config.webFetch.apiKey`）可获得更高限制。如果未配置 Firecrawl，该工具会回退到直接 fetch 加内置的 `web-readability` 插件（无付费 API）。禁用 `plugins.entries.web-readability.enabled` 可跳过本地 Readability 提取。

见 [Web 工具](/zh-CN/tools/web)。

### 提供商用量快照（状态/健康）

`openclaw status --usage` 和 `openclaw models status --json` 会调用提供商用量端点以显示配额窗口或凭证健康状态。这些调用量很低，但仍会命中提供商 API。

见[模型 CLI](/zh-CN/cli/models)。

### 压缩保护摘要

压缩保护可以使用当前模型摘要会话历史，运行时会调用提供商 API。

见[会话管理和压缩](/zh-CN/reference/session-management-compaction)。

### 模型扫描/探测

`openclaw models scan` 可探测 OpenRouter 模型，并在启用探测时使用 `OPENROUTER_API_KEY`。

见[模型 CLI](/zh-CN/cli/models)。

### Talk（语音）

配置后，Talk 模式可调用 ElevenLabs：`ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`。

见 [Talk 模式](/zh-CN/nodes/talk)。

### Skills（第三方 API）

Skills 可在 `skills.entries.<name>.apiKey` 中存储 `apiKey`。如果某个 skill 使用该 key 调用外部 API，费用由该 skill 的提供商决定。

见 [Skills](/zh-CN/tools/skills)。

## 相关

- [Token 用量和费用](/zh-CN/reference/token-use)
- [Prompt 缓存](/zh-CN/reference/prompt-caching)
- [用量跟踪](/zh-CN/concepts/usage-tracking)

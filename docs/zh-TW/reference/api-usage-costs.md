---
read_when:
    - 您想了解哪些功能可能會呼叫付費 API
    - 您需要稽核金鑰、成本和使用情況可見性
    - 你正在說明 /status 或 /usage 的成本報告
summary: 審查哪些項目可能產生費用、使用了哪些金鑰，以及如何檢視用量
title: API 使用量與成本
x-i18n:
    generated_at: "2026-05-06T09:18:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8e6f9f8248ddb4241d00191aa231f1d72a2128a7995b4ed0ec0e18a7ed6dd69
    source_path: reference/api-usage-costs.md
    workflow: 16
---

這份文件列出**可能呼叫 API 金鑰的功能**，以及其成本顯示的位置。重點放在
可能產生供應商用量或付費 API 呼叫的 OpenClaw 功能。

## 成本顯示的位置（聊天 + CLI）

**每個工作階段的成本快照**

- `/status` 會顯示目前工作階段模型、上下文用量，以及上一則回覆的權杖數。
- 如果模型使用 **API 金鑰驗證**，`/status` 也會顯示上一則回覆的**預估成本**。
- 如果即時工作階段中繼資料不足，`/status` 可以從最新逐字稿用量
  項目中復原權杖/快取計數器與作用中的執行階段模型標籤。既有的非零即時值仍會優先採用，
  且在已儲存總數缺失或較小時，提示大小的逐字稿總數可以勝出。

**每則訊息的成本頁尾**

- `/usage full` 會在每則回覆附加用量頁尾，包含**預估成本**（僅 API 金鑰）。
- `/usage tokens` 只顯示權杖；訂閱式 OAuth/權杖與 CLI 流程會隱藏美元成本。
- Gemini CLI 備註：當 CLI 回傳 JSON 輸出時，OpenClaw 會從
  `stats` 讀取用量，將 `stats.cached` 正規化為 `cacheRead`，並在需要時從
  `stats.input_tokens - stats.cached` 推導輸入權杖。

Anthropic 備註：Anthropic 人員告訴我們，OpenClaw 風格的 Claude CLI 用法
已再次允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude CLI 重用與
`claude -p` 用法視為此整合的核准用法。
Anthropic 仍未公開 OpenClaw 可在 `/usage full` 中顯示的每則訊息美元估算。

**CLI 用量視窗（供應商配額）**

- `openclaw status --usage` 和 `openclaw channels list` 會顯示供應商**用量視窗**
  （配額快照，而非每則訊息成本）。
- 人類可讀輸出會在各供應商間正規化為 `X% left`。
- 目前的用量視窗供應商：Anthropic、GitHub Copilot、Gemini CLI、
  OpenAI Codex、MiniMax、Xiaomi 和 z.ai。
- MiniMax 備註：其原始 `usage_percent` / `usagePercent` 欄位代表剩餘
  配額，因此 OpenClaw 會在顯示前反轉它們。存在以計數為基礎的欄位時仍會優先採用。
  如果供應商回傳 `model_remains`，OpenClaw 會偏好聊天模型項目，
  在需要時從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- 這些配額視窗的用量驗證會在可用時來自供應商特定掛鉤；
  否則 OpenClaw 會退回使用來自驗證設定檔、環境或設定中相符的 OAuth/API 金鑰
  憑證。

詳情與範例請參閱[權杖使用量與成本](/zh-TW/reference/token-use)。

## 金鑰的探索方式

OpenClaw 可以從以下來源取得憑證：

- **驗證設定檔**（每個代理程式一份，儲存在 `auth-profiles.json`）。
- **環境變數**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **設定**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、
  `plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、
  `talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），可將金鑰匯出到技能程序環境。

## 可能花費金鑰的功能

### 1) 核心模型回覆（聊天 + 工具）

每則回覆或工具呼叫都會使用**目前的模型供應商**（OpenAI、Anthropic 等）。這是
用量與成本的主要來源。

這也包含仍在 OpenClaw 本機 UI 之外計費的訂閱式託管供應商，
例如 **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、
**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及啟用
**額外用量** 的 Anthropic OpenClaw Claude 登入路徑。

定價設定請參閱[模型](/zh-TW/providers/models)，顯示方式請參閱[權杖使用量與成本](/zh-TW/reference/token-use)。

### 2) 媒體理解（音訊/圖片/影片）

傳入媒體可以在回覆執行前先摘要/轉錄。這會使用模型/供應商 API。

- 音訊：OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 圖片：OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 影片：Google / Qwen / Moonshot。

請參閱[媒體理解](/zh-TW/nodes/media-understanding)。

### 3) 圖片與影片生成

共用的生成能力也可能花費供應商金鑰：

- 圖片生成：OpenAI / Google / DeepInfra / fal / MiniMax
- 影片生成：DeepInfra / Qwen

當 `agents.defaults.imageGenerationModel` 未設定時，圖片生成可以推斷有驗證支援的供應商預設值。
影片生成目前需要明確的 `agents.defaults.videoGenerationModel`，例如
`qwen/wan2.6-t2v`。

請參閱[圖片生成](/zh-TW/tools/image-generation)、[Qwen Cloud](/zh-TW/providers/qwen)
和[模型](/zh-TW/concepts/models)。

### 4) 記憶嵌入 + 語意搜尋

設定為遠端供應商時，語意記憶搜尋會使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI 嵌入
- `memorySearch.provider = "gemini"` → Gemini 嵌入
- `memorySearch.provider = "voyage"` → Voyage 嵌入
- `memorySearch.provider = "mistral"` → Mistral 嵌入
- `memorySearch.provider = "deepinfra"` → DeepInfra 嵌入
- `memorySearch.provider = "lmstudio"` → LM Studio 嵌入（本機/自行託管）
- `memorySearch.provider = "ollama"` → Ollama 嵌入（本機/自行託管；通常沒有託管 API 計費）
- 如果本機嵌入失敗，可選擇退回遠端供應商

你可以使用 `memorySearch.provider = "local"` 保持本機執行（無 API 用量）。

請參閱[記憶](/zh-TW/concepts/memory)。

### 5) 網頁搜尋工具

`web_search` 可能會依供應商產生用量費用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**：對可連線且已登入的本機 Ollama 主機不需要金鑰；直接使用 `https://ollama.com` 搜尋會使用 `OLLAMA_API_KEY`，受驗證保護的主機可以重用一般 Ollama 供應商 bearer 驗證
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：免金鑰退回方案（無 API 計費，但非官方且以 HTML 為基礎）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（免金鑰/自行託管；無託管 API 計費）

舊版 `tools.web.search.*` 供應商路徑仍會透過暫時相容性墊片載入，但已不再是建議的設定介面。

**Brave Search 免費額度：** 每個 Brave 方案都包含每月更新的 \$5
免費額度。Search 方案費用為每 1,000 次請求 \$5，因此額度可免費涵蓋
每月 1,000 次請求。請在 Brave 儀表板中設定用量限制，
以避免非預期費用。

請參閱[網頁工具](/zh-TW/tools/web)。

### 5) 網頁擷取工具（Firecrawl）

當存在 API 金鑰時，`web_fetch` 可以呼叫 **Firecrawl**：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未設定 Firecrawl，此工具會退回直接擷取加上隨附的 `web-readability` Plugin（無付費 API）。停用 `plugins.entries.web-readability.enabled` 可略過本機 Readability 擷取。

請參閱[網頁工具](/zh-TW/tools/web)。

### 6) 供應商用量快照（狀態/健康狀態）

部分狀態命令會呼叫**供應商用量端點**來顯示配額視窗或驗證健康狀態。
這些通常是低流量呼叫，但仍會命中供應商 API：

- `openclaw status --usage`
- `openclaw models status --json`

請參閱[模型 CLI](/zh-TW/cli/models)。

### 7) Compaction 保護摘要

Compaction 保護可以使用**目前模型**摘要工作階段歷史，
執行時會呼叫供應商 API。

請參閱[工作階段管理 + Compaction](/zh-TW/reference/session-management-compaction)。

### 8) 模型掃描 / 探測

`openclaw models scan` 可以探測 OpenRouter 模型，並在啟用探測時使用 `OPENROUTER_API_KEY`。

請參閱[模型 CLI](/zh-TW/cli/models)。

### 9) 對話（語音）

設定後，對話模式可以呼叫 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

請參閱[對話模式](/zh-TW/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以在 `skills.entries.<name>.apiKey` 中儲存 `apiKey`。如果某個 skill 使用該金鑰呼叫外部
API，可能會依該 skill 的供應商產生成本。

請參閱[Skills](/zh-TW/tools/skills)。

## 相關

- [權杖使用量與成本](/zh-TW/reference/token-use)
- [提示快取](/zh-TW/reference/prompt-caching)
- [用量追蹤](/zh-TW/concepts/usage-tracking)

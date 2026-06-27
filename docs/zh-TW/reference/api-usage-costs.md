---
read_when:
    - 您想了解哪些功能可能會呼叫付費 API
    - 你需要稽核金鑰、成本與使用情況可見性
    - 你正在說明 /status 或 /usage 成本報告
summary: 稽核哪些項目可能花費金錢、使用哪些金鑰，以及如何查看用量
title: API 使用量與費用
x-i18n:
    generated_at: "2026-06-27T19:59:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 473028747c3e8eab60667106d22616aa185f867d01238b856f4235faad957a9e
    source_path: reference/api-usage-costs.md
    workflow: 16
---

本文件列出**可能呼叫 API 金鑰的功能**，以及其費用會顯示在哪裡。內容聚焦於可能產生供應商用量或付費 API 呼叫的 OpenClaw 功能。

## 費用顯示位置（聊天 + 命令列介面）

**每個工作階段的費用快照**

- `/status` 會顯示目前工作階段的模型、脈絡用量，以及上一則回應的 token。
- 如果 OpenClaw 具有作用中模型的用量中繼資料與本機價格，
  `/status` 也會顯示上一則回覆的**預估費用**。這可以包含
  明確定價的非 API 金鑰供應商，例如 Bedrock `aws-sdk` 模型。
- 如果即時工作階段中繼資料不足，`/status` 可以從最新的逐字稿用量
  項目復原 token/快取計數器與作用中執行階段模型標籤。現有的非零即時值
  仍會優先，而當已儲存總計缺失或較小時，提示大小的逐字稿總計可能優先。

**每則訊息的費用頁尾**

- `/usage full` 會在每則回覆附加用量頁尾，當作用中模型已設定本機價格且
  用量中繼資料可用時，會包含**預估費用**。
- `/usage tokens` 只顯示 token；訂閱式 OAuth/token 與命令列介面流程
  仍只顯示 token，除非該執行階段提供相容的用量中繼資料，
  且已設定明確的本機價格。
- Gemini 命令列介面備註：預設的 `stream-json` 輸出與舊版 JSON 覆寫
  都會從 `stats` 讀取用量，將 `stats.cached` 正規化為 `cacheRead`，
  並在需要時從 `stats.input_tokens - stats.cached` 推導輸入 token。

Anthropic 備註：Anthropic 員工告訴我們，OpenClaw 風格的 Claude 命令列介面用量
已再次被允許，因此除非 Anthropic 發布新政策，OpenClaw 會將 Claude 命令列介面重用與
`claude -p` 用量視為此整合核准的用法。
Anthropic 仍未公開 OpenClaw 可在 `/usage full` 顯示的每則訊息美元估算。

**命令列介面用量時段（供應商配額）**

- `openclaw status --usage` 與 `openclaw channels list` 會顯示供應商**用量時段**
  （配額快照，而非每則訊息費用）。
- 人類可讀輸出會在各供應商間正規化為 `X% left`。
- 目前的用量時段供應商：Anthropic、GitHub Copilot、Gemini 命令列介面、
  OpenAI Codex、MiniMax、Xiaomi 與 z.ai。
- MiniMax 備註：其原始 `usage_percent` / `usagePercent` 欄位表示剩餘
  配額，因此 OpenClaw 會在顯示前反轉它們。若存在以計數為基礎的欄位，仍會優先。
  如果供應商回傳 `model_remains`，OpenClaw 會優先使用聊天模型項目，
  在需要時從時間戳記推導時段標籤，並在方案標籤中包含模型名稱。
- 這些配額時段的用量驗證會在可用時來自供應商專屬鉤子；否則 OpenClaw
  會退回使用來自驗證設定檔、env 或 config 的相符 OAuth/API 金鑰憑證。

詳情與範例請見 [Token 用量與費用](/zh-TW/reference/token-use)。

## 金鑰如何被探索

OpenClaw 可以從以下位置取得憑證：

- **驗證設定檔**（每個代理各自設定，儲存在 `auth-profiles.json`）。
- **環境變數**（例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`）。
- **Config**（`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、
  `plugins.entries.firecrawl.config.webFetch.apiKey`、`memorySearch.*`、
  `talk.providers.*.apiKey`）。
- **Skills**（`skills.entries.<name>.apiKey`），可能會將金鑰匯出到技能程序 env。

## 可能花費金鑰的功能

### 1) 核心模型回應（聊天 + 工具）

每則回覆或工具呼叫都會使用**目前的模型供應商**（OpenAI、Anthropic 等）。這是
用量與費用的主要來源。

這也包含仍在 OpenClaw 本機使用者介面之外計費的訂閱式託管供應商，
例如 **OpenAI Codex**、**Alibaba Cloud Model Studio Coding Plan**、
**MiniMax Coding Plan**、**Z.AI / GLM Coding Plan**，以及啟用
**Extra Usage** 的 Anthropic OpenClaw Claude 登入路徑。

定價 config 請見 [模型](/zh-TW/providers/models)，顯示方式請見 [Token 用量與費用](/zh-TW/reference/token-use)。

### 2) 媒體理解（音訊/圖片/影片）

傳入媒體可在回覆執行前進行摘要/轉錄。這會使用模型/供應商 API。

- 音訊：OpenAI / Groq / Deepgram / DeepInfra / Google / Mistral。
- 圖片：OpenAI / OpenRouter / Anthropic / DeepInfra / Google / MiniMax / Moonshot / Qwen / Z.AI。
- 影片：Google / Qwen / Moonshot。

請見 [媒體理解](/zh-TW/nodes/media-understanding)。

### 3) 圖片與影片生成

共用的生成能力也可能花費供應商金鑰：

- 圖片生成：OpenAI / Google / DeepInfra / fal / MiniMax
- 影片生成：DeepInfra / Qwen

當 `agents.defaults.imageGenerationModel` 未設定時，圖片生成可以推斷具驗證支援的供應商預設值。
影片生成目前需要明確的 `agents.defaults.videoGenerationModel`，例如
`qwen/wan2.6-t2v`。

請見 [圖片生成](/zh-TW/tools/image-generation)、[Qwen Cloud](/zh-TW/providers/qwen)，
以及 [模型](/zh-TW/concepts/models)。

### 4) 記憶嵌入 + 語意搜尋

當設定為遠端供應商時，語意記憶搜尋會使用**嵌入 API**：

- `memorySearch.provider = "openai"` → OpenAI 嵌入
- `memorySearch.provider = "gemini"` → Gemini 嵌入
- `memorySearch.provider = "voyage"` → Voyage 嵌入
- `memorySearch.provider = "mistral"` → Mistral 嵌入
- `memorySearch.provider = "deepinfra"` → DeepInfra 嵌入
- `memorySearch.provider = "lmstudio"` → LM Studio 嵌入（本機/自託管）
- `memorySearch.provider = "ollama"` → Ollama 嵌入（本機/自託管；通常沒有託管 API 計費）
- 如果本機嵌入失敗，可選擇退回遠端供應商

你可以使用 `memorySearch.provider = "local"` 保持本機執行（無 API 用量）。

請見 [記憶](/zh-TW/concepts/memory)。

### 5) 網頁搜尋工具

`web_search` 可能會依供應商產生用量費用：

- **Brave Search API**：`BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**：`EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**：`FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini（Google Search）**：`GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
- **Grok（xAI）**：xAI OAuth 設定檔、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi（Moonshot）**：`KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**：`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**：對可連線且已登入的本機 Ollama 主機免金鑰；直接使用 `https://ollama.com` 搜尋會使用 `OLLAMA_API_KEY`，而受驗證保護的主機可重用一般 Ollama 供應商 bearer 驗證
- **Perplexity Search API**：`PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**：`TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**：明確選取時為免金鑰供應商（無 API 計費，但非官方且以 HTML 為基礎）
- **SearXNG**：`SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（免金鑰/自託管；無託管 API 計費）

舊版 `tools.web.search.*` 供應商路徑仍會透過暫時相容 shim 載入，但已不再是建議的 config 介面。

**Brave Search 免費額度：** 每個 Brave 方案都包含每月更新的 \$5 免費額度。
Search 方案每 1,000 次請求費用為 \$5，因此該額度可免費涵蓋
每月 1,000 次請求。請在 Brave 儀表板中設定用量限制，
以避免非預期費用。

請見 [網頁工具](/zh-TW/tools/web)。

### 5) 網頁擷取工具（Firecrawl）

`web_fetch` 可透過免金鑰的入門存取呼叫 **Firecrawl**。加入 API 金鑰
可獲得更高限制：

- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webFetch.apiKey`

如果未設定 Firecrawl，該工具會退回直接擷取加上內建的 `web-readability` 外掛（無付費 API）。
停用 `plugins.entries.web-readability.enabled` 可略過本機 Readability 擷取。

請見 [網頁工具](/zh-TW/tools/web)。

### 6) 供應商用量快照（狀態/健康狀態）

某些狀態命令會呼叫**供應商用量端點**以顯示配額時段或驗證健康狀態。
這些通常是低用量呼叫，但仍會觸及供應商 API：

- `openclaw status --usage`
- `openclaw models status --json`

請見 [模型命令列介面](/zh-TW/cli/models)。

### 7) 壓縮防護摘要

壓縮防護可以使用**目前模型**摘要工作階段歷史，執行時會
呼叫供應商 API。

請見 [工作階段管理 + 壓縮](/zh-TW/reference/session-management-compaction)。

### 8) 模型掃描 / 探測

啟用探測時，`openclaw models scan` 可以探測 OpenRouter 模型，並使用 `OPENROUTER_API_KEY`。

請見 [模型命令列介面](/zh-TW/cli/models)。

### 9) Talk（語音）

設定後，Talk 模式可以呼叫 **ElevenLabs**：

- `ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`

請見 [Talk 模式](/zh-TW/nodes/talk)。

### 10) Skills（第三方 API）

Skills 可以在 `skills.entries.<name>.apiKey` 儲存 `apiKey`。如果某個 skill 將該金鑰用於外部
API，則可能會依該 skill 的供應商產生費用。

請見 [Skills](/zh-TW/tools/skills)。

## 相關

- [Token 用量與費用](/zh-TW/reference/token-use)
- [提示快取](/zh-TW/reference/prompt-caching)
- [用量追蹤](/zh-TW/concepts/usage-tracking)

---
read_when:
    - 您想瞭解哪些功能可能會呼叫付費 API
    - 你需要稽核金鑰、成本與用量可見性
    - 你正在說明 /status 或 /usage 的費用報告功能
summary: 稽核哪些項目可能產生費用、使用了哪些金鑰，以及如何查看用量
title: API 使用量與費用
x-i18n:
    generated_at: "2026-07-11T21:45:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

OpenClaw 可呼叫付費供應商 API 的功能、各功能讀取憑證的位置，以及所產生費用顯示位置的對照表。

## 費用顯示位置

**`/status`**（每個工作階段的快照）

- 顯示目前工作階段的模型、上下文用量，以及上次回應的權杖數。
- 當 OpenClaw 具有使用量中繼資料和使用中模型的本機定價時，會加入上次回覆的**預估費用**，包括具有明確定價但不使用 API 金鑰的供應商，例如 Bedrock `aws-sdk` 模型。
- 如果即時工作階段快照的資料不足，`/status` 會從最新逐字稿使用量項目中恢復權杖／快取計數器和使用中模型標籤。現有的非零即時值優先於逐字稿資料；當儲存的總數缺失或較小時，提示詞規模的逐字稿總數仍可優先採用。

**`/usage`**（每則訊息的頁尾）

- `/usage full` 會在每則回覆後附加使用量頁尾；當已設定本機定價且有使用量中繼資料時，其中會包含**預估費用**。
- `/usage tokens` 僅顯示權杖。訂閱制 OAuth／權杖和命令列介面執行階段僅顯示權杖，除非它們提供相容的使用量中繼資料及明確的本機價格。
- `/usage cost` 會輸出本機費用摘要；`/usage off` 會停用頁尾。
- Gemini CLI 注意事項：`stream-json` 和舊版 `json` 輸出都會將使用量放在 `stats` 下。OpenClaw 會將 `stats.cached` 正規化為 `cacheRead`，並在需要時以 `stats.input_tokens - stats.cached` 推導輸入權杖數。

**Control UI → Usage**（跨工作階段分析）

- 顯示所選日期範圍內根據逐字稿推導的權杖與預估費用總計，並依供應商、模型、代理程式、頻道及權杖類型細分。
- 比較以所選範圍結束日期為終點的較短日曆期間。缺少的日期會計為零用量的日曆日，不會略過以建立更密集的期間。
- 直接標示每日圖表的刻度。`√` 徽章表示正在使用平方根壓縮，以維持低用量日期的可見度。
- 這些總計描述可用的本機工作階段歷程，而非供應商發票或終身計費帳本。若部分項目缺少定價，UI 會發出警告。

**命令列介面使用量期間**（供應商配額，而非每則訊息費用）

- `openclaw status --usage` 和 `openclaw channels list` 會以 `X% left` 顯示供應商的**使用量期間**。
- 目前支援使用量期間的供應商：Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（涵蓋 ChatGPT／Codex OAuth／權杖驗證）、Xiaomi 及 z.ai。完整的供應商／旗標清單請參閱[模型命令列介面](/zh-TW/cli/models)和[頻道命令列介面](/zh-TW/cli/channels)。
- MiniMax 的原始 `usage_percent`／`usagePercent` 欄位回報剩餘配額，因此 OpenClaw 會將其反轉；若有基於計數的欄位，則以其為準。如果回應包含 `model_remains` 陣列，OpenClaw 會選取聊天模型項目，必要時從時間戳記推導期間標籤，並在方案標籤中包含模型名稱。
- 如果有可用的供應商專用掛鉤，使用量驗證會從中取得；否則 OpenClaw 會退回比對來自驗證設定檔、環境或設定的 OAuth／API 金鑰憑證。

詳細範例請參閱[權杖使用量與費用](/zh-TW/reference/token-use)。

<Note>
Anthropic 已確認，除非其發布新政策，否則重複使用 Claude CLI（包括 `claude -p`）是獲准的整合模式。Anthropic 不提供每則訊息的金額預估，因此 `/usage full` 無法顯示 Claude CLI 使用量的費用。
</Note>

## 金鑰的探索方式

- **驗證設定檔**：每個代理程式各自儲存於 `auth-profiles.json`。
- **環境變數**：例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **設定**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`，可能會將金鑰匯出至技能程序的環境。

## 可能使用金鑰並產生費用的功能

### 核心模型回應（聊天與工具）

每則回覆或工具呼叫都會在目前的模型供應商上執行。這是使用量與費用的主要來源，包括在 OpenClaw 本機 UI 之外計費的訂閱制代管方案：OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI／GLM Coding Plan，以及啟用 Extra Usage 的 Anthropic Claude 登入路徑。

定價設定請參閱[模型](/zh-TW/providers/models)，顯示方式請參閱[權杖使用量與費用](/zh-TW/reference/token-use)。

### 媒體理解（音訊／圖片／影片）

在回覆管線執行前，可以先透過供應商 API 摘要或轉錄傳入媒體。供應商支援是按外掛註冊，並會隨外掛加入而變更；目前的清單與設定請參閱[媒體理解](/zh-TW/nodes/media-understanding)。

### 圖片與影片生成

`image_generate` 和 `video_generate` 會路由至任何可用且已設定的供應商。當未設定 `agents.defaults.imageGenerationModel` 時，圖片生成可推斷以驗證資訊支援的預設供應商；影片生成則必須明確設定 `agents.defaults.videoGenerationModel`（例如 `qwen/wan2.6-t2v`）。

目前的供應商清單請參閱[圖片生成](/zh-TW/tools/image-generation)和[影片生成](/zh-TW/tools/video-generation)。

### 記憶嵌入與語意搜尋

當 `agents.defaults.memorySearch.provider` 指定遠端配接器（例如 `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）時，語意記憶搜尋會使用嵌入 API。`memorySearch.provider = "lmstudio"` 或 `"ollama"` 會針對本機／自行代管伺服器執行，通常不會產生代管服務帳單。`memorySearch.provider = "local"` 會讓所有處理都留在裝置上，不使用 API。可選的 `memorySearch.fallback` 供應商可因應本機嵌入失敗。

請參閱[記憶](/zh-TW/concepts/memory)。

### 網頁搜尋工具

`web_search` 可能會依所選供應商產生使用費。每個供應商會先從環境變數讀取金鑰，再從 `plugins.entries.<id>.config.webSearch.apiKey` 讀取：

| 供應商                 | 環境變數                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | 無需金鑰；非官方、基於 HTML，無費用                                                                                                                                   |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini（Google Search） | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok（xAI）            | xAI OAuth 設定檔或 `XAI_API_KEY`                                                                                                                                       |
| Kimi（Moonshot）       | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`                                                                           |
| Ollama Web Search      | 對可連線且已登入的本機主機無需金鑰；直接使用 `https://ollama.com` 搜尋時需使用 `OLLAMA_API_KEY`；受驗證保護的主機會重複使用一般 Ollama 供應商的持有人驗證                 |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`；無需金鑰／自行代管，無代管服務帳單                                                                                                                |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

舊版 `tools.web.search.*` 設定路徑仍會透過相容性墊片載入，但已不再是建議使用的介面。

**Brave Search 免費額度**：每個方案每月包含可續期的 5 美元免費額度。Search 方案每 1,000 次請求收費 5 美元，因此此額度每月可免費涵蓋 1,000 次請求。請在 Brave 儀表板中設定使用量上限，以免產生意外費用。

請參閱[網頁工具](/zh-TW/tools/web)。

### 網頁擷取工具（Firecrawl）

`web_fetch` 可以使用 Firecrawl 的無金鑰入門存取；加入 `FIRECRAWL_API_KEY`（或 `plugins.entries.firecrawl.config.webFetch.apiKey`）可取得更高的限制。如果未設定 Firecrawl，工具會退回直接擷取並使用隨附的 `web-readability` 外掛（不使用付費 API）。停用 `plugins.entries.web-readability.enabled` 可略過本機 Readability 擷取。

請參閱[網頁工具](/zh-TW/tools/web)。

### 供應商使用量快照（狀態／健康情況）

`openclaw status --usage` 和 `openclaw models status --json` 會呼叫供應商的使用量端點，以顯示配額期間或驗證健康情況。呼叫量很低，但仍會存取供應商 API。

請參閱[模型命令列介面](/zh-TW/cli/models)。

### 壓縮防護摘要

壓縮防護可使用目前模型摘要工作階段歷程，執行時會呼叫供應商 API。

請參閱[工作階段管理與壓縮](/zh-TW/reference/session-management-compaction)。

### 模型掃描／探測

`openclaw models scan` 可以探測 OpenRouter 模型，並在啟用探測時使用 `OPENROUTER_API_KEY`。

請參閱[模型命令列介面](/zh-TW/cli/models)。

### Talk（語音）

設定後，Talk 模式可以呼叫 ElevenLabs：`ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`。

請參閱[Talk 模式](/zh-TW/nodes/talk)。

### Skills（第三方 API）

Skills 可將 `apiKey` 儲存在 `skills.entries.<name>.apiKey`。如果技能使用該金鑰存取外部 API，費用將依該技能的供應商計算。

請參閱[Skills](/zh-TW/tools/skills)。

## 相關內容

- [權杖使用量與費用](/zh-TW/reference/token-use)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)

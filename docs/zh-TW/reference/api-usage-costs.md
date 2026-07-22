---
read_when:
    - 你想瞭解哪些功能可能會呼叫付費 API
    - 你需要稽核金鑰、成本和用量可見性
    - 你正在說明 /status 或 /usage 的費用報告功能
summary: 稽核哪些項目可能產生費用、使用哪些金鑰，以及如何檢視用量
title: API 使用量與費用
x-i18n:
    generated_at: "2026-07-22T10:49:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22caad8b8fa168739563223b3663a04adceeef7e83576a53dc9cdf885a35750d
    source_path: reference/api-usage-costs.md
    workflow: 16
---

可呼叫付費供應商 API 的 OpenClaw 功能一覽、各功能從何處讀取認證資訊，以及產生的費用會顯示於何處。

## 費用顯示位置

**`/status`**（每個工作階段的快照）

- 顯示目前工作階段的模型、上下文用量及上次回應的權杖數。
- 當 OpenClaw 具有使用量中繼資料及作用中模型的本機定價時，會加入上次回覆的**預估費用**，包括 Bedrock `aws-sdk` 模型等已明確定價且不使用 API 金鑰的供應商。
- 若即時工作階段快照資訊不足，`/status` 會從最新的對話記錄使用量項目復原權杖／快取計數器及作用中模型標籤。現有非零的即時值優先於對話記錄資料；當儲存的總數缺失或較小時，與提示詞規模相當的對話記錄總數仍可優先採用。

**`/usage`**（每則訊息的頁尾）

- `/usage full` 會在每則回覆後附加使用量頁尾；設定本機定價且有使用量中繼資料時，也會包含**預估費用**。
- `/usage tokens` 僅顯示權杖數。採訂閱制的 OAuth／權杖及命令列介面執行階段只會顯示權杖數，除非它們提供相容的使用量中繼資料及明確的本機價格。
- `/usage cost` 會輸出本機費用摘要；`/usage off` 會停用頁尾。
- Gemini CLI 注意事項：`stream-json` 和舊版 `json` 的輸出都會在 `stats` 下提供使用量。OpenClaw 會將 `stats.cached` 正規化為 `cacheRead`，並在需要時從 `stats.input_tokens - stats.cached` 推算輸入權杖數。

**Control UI → Usage**（跨工作階段分析）

- 顯示所選日期範圍內根據對話記錄計算的權杖數及預估費用總額，並依供應商、模型、代理程式、頻道及權杖類型細分。
- 比較以所選範圍結束日期為終點的較短日曆期間。缺少的日期會視為用量為零的日曆日；不會略過這些日期以建立更密集的期間。
- 直接標示每日圖表的刻度。`√` 徽章表示正以平方根壓縮方式讓低用量日期保持可見。
- 這些總計描述可用的本機工作階段歷程，而不是供應商發票或終身計費帳本。部分項目缺少定價時，UI 會顯示警告。

**命令列介面用量期間**（供應商配額，而非每則訊息的費用）

- `openclaw status --usage` 和 `openclaw channels list` 會將供應商的**用量期間**顯示為 `X% left`。
- 目前支援用量期間的供應商：Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini CLI、MiniMax、OpenAI（涵蓋 ChatGPT／Codex OAuth／權杖驗證）、Xiaomi 及 z.ai。完整的供應商／旗標清單請參閱[模型命令列介面](/zh-TW/cli/models)及[頻道命令列介面](/zh-TW/cli/channels)。
- MiniMax 的原始 `usage_percent`／`usagePercent` 欄位回報剩餘配額，因此 OpenClaw 會將其反轉；若存在以計數為基礎的欄位，則優先採用。若回應包含 `model_remains` 陣列，OpenClaw 會選取聊天模型項目、在需要時根據時間戳記推算期間標籤，並在方案標籤中包含模型名稱。
- 若有供應商專屬掛鉤，使用量驗證會使用該掛鉤；否則 OpenClaw 會改用驗證設定檔、環境變數或設定中相符的 OAuth／API 金鑰認證資訊。

詳細範例請參閱[權杖使用量與費用](/zh-TW/reference/token-use)。

<Note>
Anthropic 已確認，除非其發布新政策，否則重複使用 Claude CLI（包括 `claude -p`）是獲准的整合模式。Anthropic 不提供每則訊息的金額估算，因此 `/usage full` 無法顯示 Claude CLI 使用量的費用。
</Note>

## 如何探索金鑰

- **驗證設定檔**：每個代理程式各自擁有，儲存於 `auth-profiles.json`。
- **環境變數**：例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **設定**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`memory.search.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`，可將金鑰匯出至 Skill 程序的環境變數。

## 可能使用金鑰並產生費用的功能

### 核心模型回應（聊天與工具）

每次回覆或工具呼叫都會在目前的模型供應商上執行。這是使用量和費用的主要來源，包括在 OpenClaw 本機 UI 之外計費的訂閱制託管方案：OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI／GLM Coding Plan，以及啟用 Extra Usage 的 Anthropic Claude 登入途徑。

定價設定請參閱[模型](/zh-TW/providers/models)，顯示方式請參閱[權杖使用量與費用](/zh-TW/reference/token-use)。

### 媒體理解（音訊／圖片／影片）

在回覆管線執行前，可透過供應商 API 摘要或轉錄傳入的媒體。各外掛分別註冊其支援的供應商，且清單會隨著加入外掛而變更；目前的清單及設定請參閱[媒體理解](/zh-TW/nodes/media-understanding)。

### 圖片與影片生成

`image_generate` 和 `video_generate` 會路由至任何可用且已驗證的供應商。當其 `agents.defaults.mediaModels` 項目未設定時，兩者都能推斷由驗證資訊支援的預設供應商。

目前的供應商清單請參閱[圖片生成](/zh-TW/tools/image-generation)及[影片生成](/zh-TW/tools/video-generation)。

### 記憶嵌入與語意搜尋

當 `memory.search.provider` 指定遠端轉接器（例如 `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）時，語意記憶搜尋會使用嵌入 API。`memory.search.provider = "lmstudio"` 或 `"ollama"` 會針對本機／自行託管的伺服器執行，通常不會產生託管服務費用。`memory.search.provider = "local"` 會將所有作業保留在裝置上，不會使用 API。選用的 `memory.search.fallback` 供應商可處理本機嵌入失敗的情況。

請參閱[記憶](/zh-TW/concepts/memory)。

### 網頁搜尋工具

`web_search` 可能依所選供應商產生使用費用。每個供應商會先從環境變數讀取金鑰，接著才讀取 `plugins.entries.<id>.config.webSearch.apiKey`：

| 供應商               | 環境變數                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | 無需金鑰；非官方、以 HTML 為基礎、不計費                                                                                                                           |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok (xAI)             | xAI OAuth 設定檔或 `XAI_API_KEY`                                                                                                                                     |
| Kimi (Moonshot)        | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`                                                                         |
| Ollama Web Search      | 對可連線且已登入的本機主機無需金鑰；直接使用 `https://ollama.com` 搜尋時會使用 `OLLAMA_API_KEY`；受驗證保護的主機會重複使用一般 Ollama 供應商的持有人驗證 |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`；無需金鑰／自行託管，不產生託管服務費用                                                                                                            |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

舊版 `tools.web.search.*` 設定路徑仍會透過相容性介接層載入，但已不再是建議使用的介面。

**Brave Search 免費額度**：每個方案每月均包含會更新的 $5 免費額度。Search 方案每 1,000 次要求收費 $5，因此該額度可免費涵蓋每月 1,000 次要求。請在 Brave 儀表板中設定用量限制，以避免非預期費用。

請參閱[網頁工具](/zh-TW/tools/web)。

### 網頁擷取工具（Firecrawl）

`web_fetch` 可透過無金鑰的入門存取權呼叫 Firecrawl；加入 `FIRECRAWL_API_KEY`（或 `plugins.entries.firecrawl.config.webFetch.apiKey`）可取得更高的限制。若未設定 Firecrawl，工具會改用直接擷取加上隨附的 `web-readability` 外掛（無付費 API）。停用 `plugins.entries.web-readability.enabled` 可略過本機 Readability 擷取。

請參閱[網頁工具](/zh-TW/tools/web)。

### 供應商用量快照（狀態／健康情況）

`openclaw status --usage` 和 `openclaw models status --json` 會呼叫供應商用量端點，以顯示配額期間或驗證健康情況。呼叫頻率雖低，但仍會存取供應商 API。

請參閱[模型命令列介面](/zh-TW/cli/models)。

### 壓縮防護摘要

壓縮防護機制可使用目前的模型摘要工作階段歷程，執行時會呼叫供應商 API。

請參閱[工作階段管理與壓縮](/zh-TW/reference/session-management-compaction)。

### 模型掃描／探測

`openclaw models scan` 可探測 OpenRouter 模型，啟用探測時會使用 `OPENROUTER_API_KEY`。

請參閱[模型命令列介面](/zh-TW/cli/models)。

### 對話（語音）

設定後，對話模式可呼叫 ElevenLabs：`ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`。

請參閱[對話模式](/zh-TW/nodes/talk)。

### Skills（第三方 API）

Skills 可將 `apiKey` 儲存於 `skills.entries.<name>.apiKey`。若 Skill 使用該金鑰存取外部 API，費用將依該 Skill 的供應商計算。

請參閱[Skills](/zh-TW/tools/skills)。

## 相關內容

- [權杖使用量與費用](/zh-TW/reference/token-use)
- [提示詞快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)

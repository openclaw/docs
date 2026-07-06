---
read_when:
    - 你想了解哪些功能可能會呼叫付費 API
    - 你需要稽核金鑰、成本和使用量可見性
    - 你正在說明 /status 或 /usage 成本回報
summary: 稽核哪些項目可能花費金錢、使用了哪些金鑰，以及如何檢視使用量
title: API 使用量與費用
x-i18n:
    generated_at: "2026-07-06T10:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b35ad64f83572eb8c01b59ee57368fd7ba20cb83ccac835281859796f782c1dd
    source_path: reference/api-usage-costs.md
    workflow: 16
---

OpenClaw 可呼叫付費提供者 API 的功能地圖、各功能讀取憑證的位置，以及產生的成本顯示位置。

## 成本顯示位置

**`/status`**（每工作階段快照）

- 顯示目前工作階段模型、上下文使用量，以及上一則回應的 token。
- 當 OpenClaw 擁有使用量中繼資料，且作用中模型有本機定價時，會為上一則回覆加入**估算成本**，包含明確定價的非 API 金鑰提供者，例如 Bedrock `aws-sdk` 模型。
- 如果即時工作階段快照資訊稀疏，`/status` 會從最新的轉錄使用量項目恢復 token/cache 計數器與作用中模型標籤。現有非零即時值優先於轉錄資料；當儲存的總量遺失或較小時，提示大小的轉錄總量仍可優先。

**`/usage`**（每訊息頁尾）

- `/usage full` 會在每則回覆附加使用量頁尾，當已設定本機定價且有使用量中繼資料時，包含**估算成本**。
- `/usage tokens` 只顯示 token。訂閱式 OAuth/token 與命令列介面執行階段只顯示 token，除非它們提供相容的使用量中繼資料加上明確的本機價格。
- `/usage cost` 會列印本機成本摘要；`/usage off` 會停用頁尾。
- Gemini 命令列介面注意事項：`stream-json` 與舊版 `json` 輸出都會在 `stats` 下帶有使用量。OpenClaw 會將 `stats.cached` 正規化為 `cacheRead`，並在需要時從 `stats.input_tokens - stats.cached` 推導輸入 token。

**控制介面 → 使用量**（跨工作階段分析）

- 顯示所選日期範圍內從轉錄推導出的 token 與估算成本總量，並依提供者、模型、代理、頻道與 token 類型細分。
- 比較以所選範圍結束日期為終點的較短日曆視窗。缺漏日期會計為零使用量日曆日；不會跳過它們來建立更密集的視窗。
- 直接標示每日圖表比例。`√` 徽章表示平方根壓縮正在讓低使用量日期保持可見。
- 這些總量描述可用的本機工作階段歷史，而不是提供者發票或生命週期帳單帳本。當部分項目缺少定價時，介面會提出警告。

**命令列介面使用量視窗**（提供者配額，不是每訊息成本）

- `openclaw status --usage` 與 `openclaw channels list` 會將提供者**使用量視窗**顯示為 `X% left`。
- 目前的使用量視窗提供者：Anthropic、ClawRouter、DeepSeek、GitHub Copilot、Gemini 命令列介面、MiniMax、OpenAI（涵蓋 ChatGPT/Codex OAuth/token 驗證）、Xiaomi 與 z.ai。完整提供者/旗標清單請參閱[模型命令列介面](/zh-TW/cli/models)與[頻道命令列介面](/zh-TW/cli/channels)。
- MiniMax 的原始 `usage_percent` / `usagePercent` 欄位回報剩餘配額，因此 OpenClaw 會將其反轉；存在以計數為基礎的欄位時會優先使用。如果回應包含 `model_remains` 陣列，OpenClaw 會選取聊天模型項目，在需要時從時間戳推導視窗標籤，並在方案標籤中包含模型名稱。
- 使用量驗證會在可用時來自提供者特定 hook，否則 OpenClaw 會退回比對來自驗證設定檔、環境或設定的 OAuth/API 金鑰憑證。

詳細範例請參閱 [Token 使用與成本](/zh-TW/reference/token-use)。

<Note>
Anthropic 已確認 Claude 命令列介面重用（包含 `claude -p`）是受允許的整合模式，除非它發布新政策。Anthropic 不公開每訊息美元估算，因此 `/usage full` 無法顯示 Claude 命令列介面使用量的成本。
</Note>

## 金鑰探索方式

- **驗證設定檔**：每代理，儲存在 `auth-profiles.json`。
- **環境變數**：例如 `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`。
- **設定**：`models.providers.*.apiKey`、`plugins.entries.*.config.webSearch.apiKey`、`plugins.entries.firecrawl.config.webFetch.apiKey`、`agents.defaults.memorySearch.*`、`talk.providers.*.apiKey`。
- **Skills**：`skills.entries.<name>.apiKey`，可將金鑰匯出到 skill 程序環境。

## 可花費金鑰的功能

### 核心模型回應（聊天 + 工具）

每則回覆或工具呼叫都會在目前模型提供者上執行。這是使用量與成本的主要來源，包含在 OpenClaw 本機介面之外計費的訂閱式託管方案：OpenAI Codex、Alibaba Cloud Model Studio Coding Plan、MiniMax Coding Plan、Z.AI/GLM Coding Plan，以及啟用 Extra Usage 的 Anthropic Claude 登入路徑。

定價設定請參閱[模型](/zh-TW/providers/models)，顯示方式請參閱 [Token 使用與成本](/zh-TW/reference/token-use)。

### 媒體理解（音訊/影像/影片）

傳入媒體可在回覆管線執行前，透過提供者 API 摘要或轉錄。提供者支援會依外掛註冊，並隨新增外掛而變更；目前清單與設定請參閱[媒體理解](/zh-TW/nodes/media-understanding)。

### 影像與影片生成

`image_generate` 與 `video_generate` 會路由到任何可用的已設定提供者。當 `agents.defaults.imageGenerationModel` 未設定時，影像生成可推斷由驗證支援的預設提供者；影片生成需要明確的 `agents.defaults.videoGenerationModel`（例如 `qwen/wan2.6-t2v`）。

目前提供者清單請參閱[影像生成](/zh-TW/tools/image-generation)與[影片生成](/zh-TW/tools/video-generation)。

### 記憶嵌入與語意搜尋

當 `agents.defaults.memorySearch.provider` 指定遠端轉接器（例如 `openai`、`gemini`、`voyage`、`mistral`、`deepinfra`、`github-copilot`、`amazon-bedrock`）時，語意記憶搜尋會使用嵌入 API。`memorySearch.provider = "lmstudio"` 或 `"ollama"` 會對本機/自行託管伺服器執行，通常沒有託管帳單。`memorySearch.provider = "local"` 會讓一切保留在裝置上，沒有 API 使用量。選用的 `memorySearch.fallback` 提供者可涵蓋本機嵌入失敗。

請參閱[記憶](/zh-TW/concepts/memory)。

### 網頁搜尋工具

`web_search` 可能會依所選提供者產生使用量費用。每個提供者會先從環境變數讀取金鑰，接著讀取 `plugins.entries.<id>.config.webSearch.apiKey`：

| 提供者                 | 環境變數                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brave Search           | `BRAVE_API_KEY`                                                                                                                                                        |
| DuckDuckGo             | 無需金鑰；非官方、基於 HTML、無帳單                                                                                                                                    |
| Exa                    | `EXA_API_KEY`                                                                                                                                                          |
| Firecrawl              | `FIRECRAWL_API_KEY`                                                                                                                                                    |
| Gemini (Google Search) | `GEMINI_API_KEY`                                                                                                                                                       |
| Grok (xAI)             | xAI OAuth 設定檔或 `XAI_API_KEY`                                                                                                                                       |
| Kimi (Moonshot)        | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`                                                                                                                                   |
| MiniMax Search         | `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`                                                                          |
| Ollama Web Search      | 可連線且已登入的本機主機無需金鑰；直接 `https://ollama.com` 搜尋會使用 `OLLAMA_API_KEY`；受驗證保護的主機會重用一般 Ollama 提供者 bearer 驗證                          |
| Parallel               | `PARALLEL_API_KEY`                                                                                                                                                     |
| Perplexity Search API  | `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`                                                                                                                           |
| SearXNG                | `SEARXNG_BASE_URL`；無需金鑰/自行託管，無託管帳單                                                                                                                      |
| Tavily                 | `TAVILY_API_KEY`                                                                                                                                                       |

舊版 `tools.web.search.*` 設定路徑仍會透過相容性 shim 載入，但不再是建議介面。

**Brave Search 免費額度**：每個方案都包含每月更新的 $5 免費額度。Search 方案每 1,000 次請求收費 $5，因此該額度可免費涵蓋每月 1,000 次請求。請在 Brave 儀表板中設定使用量限制，以避免非預期費用。

請參閱[網頁工具](/zh-TW/tools/web)。

### 網頁擷取工具（Firecrawl）

`web_fetch` 可使用無金鑰入門存取呼叫 Firecrawl；加入 `FIRECRAWL_API_KEY`（或 `plugins.entries.firecrawl.config.webFetch.apiKey`）可取得更高限制。如果未設定 Firecrawl，該工具會退回直接擷取加上內建 `web-readability` 外掛（無付費 API）。停用 `plugins.entries.web-readability.enabled` 可略過本機 Readability 擷取。

請參閱[網頁工具](/zh-TW/tools/web)。

### 提供者使用量快照（狀態/健康狀態）

`openclaw status --usage` 與 `openclaw models status --json` 會呼叫提供者使用量端點，以顯示配額視窗或驗證健康狀態。呼叫量低，但仍會觸及提供者 API。

請參閱[模型命令列介面](/zh-TW/cli/models)。

### 壓縮保護摘要

壓縮保護可使用目前模型摘要工作階段歷史，執行時會叫用提供者 API。

請參閱[工作階段管理與壓縮](/zh-TW/reference/session-management-compaction)。

### 模型掃描 / 探測

`openclaw models scan` 可探測 OpenRouter 模型，並在啟用探測時使用 `OPENROUTER_API_KEY`。

請參閱[模型命令列介面](/zh-TW/cli/models)。

### Talk（語音）

設定後，Talk 模式可叫用 ElevenLabs：`ELEVENLABS_API_KEY` 或 `talk.providers.elevenlabs.apiKey`。

請參閱 [Talk 模式](/zh-TW/nodes/talk)。

### Skills（第三方 API）

Skills 可在 `skills.entries.<name>.apiKey` 中儲存 `apiKey`。如果某個 skill 使用該金鑰呼叫外部 API，成本會跟隨該 skill 的提供者。

請參閱 [Skills](/zh-TW/tools/skills)。

## 相關

- [Token 使用與成本](/zh-TW/reference/token-use)
- [提示快取](/zh-TW/reference/prompt-caching)
- [使用量追蹤](/zh-TW/concepts/usage-tracking)

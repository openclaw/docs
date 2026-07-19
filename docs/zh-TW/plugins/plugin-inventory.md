---
read_when:
    - 你正在決定外掛是隨核心 npm 套件提供，還是分開安裝
    - 你正在更新內建外掛套件中繼資料或發布自動化流程
    - 你需要標準的內部與外部外掛清單
summary: OpenClaw 外掛的產生清單，涵蓋隨核心提供、外部發布或僅保留原始碼的外掛
title: 外掛清單
x-i18n:
    generated_at: "2026-07-19T13:58:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8a99bb683636d5fd4569f2ce7d6da5d560527af9684dcdd2f6176f4539bd81a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 外掛清單

此頁面由 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 套件的 `files` 排除項目產生。請使用以下命令重新產生：

```bash
pnpm plugins:inventory:gen
```

## 定義

- **核心 npm 套件：**內建於 `openclaw` npm 套件，無須另行安裝外掛即可使用。
- **官方外部套件：**由 OpenClaw 維護、未納入核心 npm 套件的外掛；保留於此官方清單中，並可視需要透過 ClawHub 和／或 npm 安裝。
- **僅限原始碼簽出：**僅存在於儲存庫本機、未納入已發布 npm 成品，且不會宣傳為可安裝套件的外掛。

原始碼簽出與 npm 安裝不同：在 `pnpm install` 之後，隨附
外掛會從 `extensions/<id>` 載入，因此可使用本機編輯內容與套件本機工作區
相依套件。

## 安裝外掛

請依各項目中的安裝途徑判斷是否需要安裝。標示
`included in OpenClaw` 的外掛已存在於核心套件中。
官方外部套件需要安裝一次，之後重新啟動閘道。

例如，Discord 是官方外部套件：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在上線切換期間，一般的裸套件規格仍會從 npm 安裝。
需要明確指定來源時，請使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。
安裝後，請依照外掛的設定文件（例如
[Discord](/zh-TW/channels/discord)）新增認證資訊與頻道設定。更新、解除安裝與發布
命令請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。

每個項目都會列出套件、發行途徑與說明。

## 核心 npm 套件

69 個外掛

- **[admin-http-rpc](/zh-TW/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - 已納入 OpenClaw。OpenClaw 管理 HTTP RPC 端點。

- **[alibaba](/zh-TW/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - 已納入 OpenClaw。新增影片生成供應商支援。

- **[anthropic](/zh-TW/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - 已納入 OpenClaw。Anthropic 模型、Claude 命令列介面與原生 Claude 工作階段目錄。

- **[azure-speech](/zh-TW/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - 已納入 OpenClaw。Azure AI Speech 文字轉語音（MP3、原生 Ogg/Opus 語音留言、PCM 電話語音）。

- **[bonjour](/zh-TW/plugins/reference/bonjour)** (`@openclaw/bonjour`) - 已納入 OpenClaw。透過 Bonjour/mDNS 公告本機 OpenClaw 閘道。

- **[browser](/zh-TW/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 已納入 OpenClaw。新增代理程式可呼叫的工具。

- **[byteplus](/zh-TW/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 BytePlus、BytePlus Plan 模型供應商支援。

- **[canvas](/zh-TW/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 已納入 OpenClaw。為已配對節點提供實驗性 Canvas 控制與 A2UI 轉譯介面。

- **[clawrouter](/zh-TW/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - 已納入 OpenClaw。為 OpenClaw 新增 ClawRouter 模型供應商支援。

- **[cohere](/zh-TW/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 已納入 OpenClaw；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 供應商外掛。

- **[comfy](/zh-TW/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 ComfyUI 模型供應商支援。

- **[copilot-proxy](/zh-TW/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 已納入 OpenClaw。為 OpenClaw 新增 Copilot Proxy 模型供應商支援。

- **[crabbox](/zh-TW/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - 已納入 OpenClaw。由 Crabbox 命令列介面支援的雲端工作節點供應商。

- **[deepgram](/zh-TW/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 已納入 OpenClaw。新增媒體理解供應商支援。新增即時轉錄供應商支援。

- **[document-extract](/zh-TW/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 已納入 OpenClaw。從本機文件附件擷取文字與備援頁面影像。

- **[duckduckgo](/zh-TW/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 已納入 OpenClaw。新增網頁搜尋供應商支援。

- **[elevenlabs](/zh-TW/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - 已納入 OpenClaw。新增媒體理解供應商支援。新增即時轉錄供應商支援。新增文字轉語音供應商支援。

- **[fal](/zh-TW/plugins/reference/fal)** (`@openclaw/fal-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 fal 模型供應商支援。

- **[file-transfer](/zh-TW/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - 已納入 OpenClaw。透過專用節點命令，在已配對節點上擷取、列出及寫入檔案。針對最大 16 MB 的二進位檔案，透過 node.invoke 使用 base64，以避開 bash 標準輸出截斷限制。

- **[github-copilot](/zh-TW/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 GitHub Copilot 模型供應商支援。

- **[google](/zh-TW/plugins/reference/google)** (`@openclaw/google-plugin`) - 已納入 OpenClaw。為 OpenClaw 新增 Google、Google Gemini 命令列介面、Google Vertex 模型供應商支援。

- **[huggingface](/zh-TW/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 Hugging Face 模型供應商支援。

- **[imessage](/zh-TW/plugins/reference/imessage)** (`@openclaw/imessage`) - 已納入 OpenClaw。新增 iMessage 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[linux-canvas](/zh-TW/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - 已納入 OpenClaw。適用於 OpenClaw Linux 桌面應用程式的 Canvas 轉譯橋接器。

- **[linux-node](/zh-TW/plugins/reference/linux-node)** (`@openclaw/linux-node`) - 已納入 OpenClaw。為 Linux 節點主機提供桌面通知、相機擷取及位置資訊。

- **[litellm](/zh-TW/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 LiteLLM 模型供應商支援。

- **[llm-task](/zh-TW/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 已納入 OpenClaw。僅使用 JSON 的通用 LLM 工具，可由工作流程呼叫以執行結構化任務。

- **[lmstudio](/zh-TW/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 LM Studio 模型供應商支援。

- **[logbook](/zh-TW/plugins/reference/logbook)** (`@openclaw/logbook`) - 已納入 OpenClaw。自動工作日誌：定期從已配對節點擷取螢幕快照，並將其轉換為可供檢閱的當日時間軸。

- **[memory-core](/zh-TW/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 已納入 OpenClaw。新增代理程式可呼叫的工具。

- **[memory-wiki](/zh-TW/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 已納入 OpenClaw。適用於 OpenClaw 的持久化 Wiki 編譯器與 Obsidian 友善知識庫。

- **[meta](/zh-TW/plugins/reference/meta)** (`@openclaw/meta-provider`) - 已納入 OpenClaw；npm；ClawHub：`clawhub:@openclaw/meta-provider`。為 OpenClaw 新增 Meta 模型供應商支援。

- **[microsoft](/zh-TW/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 已納入 OpenClaw。新增文字轉語音供應商支援。

- **[microsoft-foundry](/zh-TW/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 已納入 OpenClaw。為 OpenClaw 新增 Microsoft Foundry 模型供應商支援。

- **[migrate-claude](/zh-TW/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 已納入 OpenClaw。將 Claude Code 與 Claude Desktop 的指示、MCP 伺服器、技能及安全設定匯入 OpenClaw。

- **[migrate-hermes](/zh-TW/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 已納入 OpenClaw。將 Hermes 設定、記憶、技能及支援的認證資訊匯入 OpenClaw。

- **[minimax](/zh-TW/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 MiniMax、MiniMax Portal 模型供應商支援。

- **[mistral](/zh-TW/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 Mistral 模型供應商支援。

- **[novita](/zh-TW/plugins/reference/novita)** (`@openclaw/novita-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 Novita、Novita AI、Novitaai 模型供應商支援。

- **[nvidia](/zh-TW/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 NVIDIA 模型供應商支援。

- **[oc-path](/zh-TW/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 已納入 OpenClaw。新增 openclaw path 命令列介面，用於以 oc:// 定址工作區檔案。

- **[ollama](/zh-TW/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 Ollama、Ollama Cloud 模型供應商支援。

- **[onepassword](/zh-TW/plugins/reference/onepassword)** (`@openclaw/onepassword`) - 已納入 OpenClaw。精選的 1Password 機密代理服務，具備核准政策與 SQLite 稽核歷程。

- **[open-prose](/zh-TW/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 已納入 OpenClaw。OpenProse VM 技能套件，附帶 /prose 斜線命令。

- **[openai](/zh-TW/plugins/reference/openai)** (`@openclaw/openai-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 OpenAI 模型供應商支援。

- **[opencode](/zh-TW/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 OpenCode 模型供應商支援。

- **[opencode-go](/zh-TW/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 OpenCode Go 模型供應商支援。

- **[openrouter](/zh-TW/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 OpenRouter 模型供應商支援。

- **[policy](/zh-TW/plugins/reference/policy)** (`@openclaw/policy`) - 已納入 OpenClaw。新增以政策為基礎的 doctor 檢查，用於確認工作區符合規範。

- **[reef](/zh-TW/plugins/reference/reef)** (`@openclaw/reef`) - 已納入 OpenClaw。受保護的端對端加密 claw 頻道。

- **[runway](/zh-TW/plugins/reference/runway)** (`@openclaw/runway-provider`) - 已納入 OpenClaw。新增影片生成供應商支援。

- **[senseaudio](/zh-TW/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 已納入 OpenClaw。新增媒體理解供應商支援。

- **[sglang](/zh-TW/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 SGLang 模型供應商支援。

- **[synthetic](/zh-TW/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 Synthetic 模型供應商支援。

- **[teams-meetings](/zh-TW/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - 已納入 OpenClaw。以 Chrome 瀏覽器訪客身分加入 Microsoft Teams 會議。

- **[telegram](/zh-TW/plugins/reference/telegram)** (`@openclaw/telegram`) - 已納入 OpenClaw。新增 Telegram 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[together](/zh-TW/plugins/reference/together)** (`@openclaw/together-provider`) - 已納入 OpenClaw。為 OpenClaw 新增 Together 模型供應商支援。

- **[tts-local-cli](/zh-TW/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 已納入 OpenClaw。新增文字轉語音供應商支援。

- **[vault](/zh-TW/plugins/reference/vault)** (`@openclaw/vault`) - 已納入 OpenClaw。HashiCorp Vault SecretRef 供應商整合。

- **[vllm](/zh-TW/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 vLLM 模型供應商支援。

- **[volcengine](/zh-TW/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Volcengine、Volcengine Plan 模型供應商支援。

- **[voyage](/zh-TW/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 內含於 OpenClaw。新增記憶嵌入供應商支援。

- **[vydra](/zh-TW/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Vydra 模型供應商支援。

- **[web-readability](/zh-TW/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 內含於 OpenClaw。從本機 HTML 網頁擷取回應中擷取易讀的文章內容。

- **[webhooks](/zh-TW/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 內含於 OpenClaw。經過驗證的傳入網路鉤子，可將外部自動化繫結至 OpenClaw TaskFlow。

- **[workboard](/zh-TW/plugins/reference/workboard)** (`@openclaw/workboard`) - 內含於 OpenClaw。供代理程式所負責議題與工作階段使用的儀表板工作看板。

- **[xai](/zh-TW/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 內含於 OpenClaw。為 OpenClaw 新增 xAI 模型供應商支援。

- **[xiaomi](/zh-TW/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Xiaomi、Xiaomi Token Plan 模型供應商支援。

- **[zoom-meetings](/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - 內含於 OpenClaw。以 Chrome 瀏覽器訪客身分加入 Zoom 會議。

## 官方外部套件

72 個外掛

- **[acpx](/zh-TW/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 執行階段後端，具備由外掛管理的工作階段與傳輸管理功能。

- **[amazon-bedrock](/zh-TW/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 供應商外掛，支援模型探索、嵌入與防護機制。

- **[amazon-bedrock-mantle](/zh-TW/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle 供應商外掛，用於相容 OpenAI 的模型路由。

- **[anthropic-vertex](/zh-TW/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex 供應商外掛，用於 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-TW/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。為 OpenClaw 新增 Arcee 模型供應商支援。

- **[baseten](/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm；ClawHub：`clawhub:@openclaw/baseten-provider`。OpenClaw Baseten 供應商外掛。

- **[brave](/zh-TW/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。用於網頁搜尋的 OpenClaw Brave Search 供應商外掛。

- **[cerebras](/zh-TW/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。為 OpenClaw 新增 Cerebras 模型供應商支援。

- **[chutes](/zh-TW/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。為 OpenClaw 新增 Chutes 模型供應商支援。

- **[clickclack](/zh-TW/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。新增 ClickClack 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[cloudflare-ai-gateway](/zh-TW/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。為 OpenClaw 新增 Cloudflare AI Gateway 模型供應商支援。

- **[codex](/zh-TW/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。Codex 應用程式伺服器測試框架與原生工作階段目錄。

- **[copilot](/zh-TW/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。註冊 GitHub Copilot 代理程式執行階段。

- **[deepinfra](/zh-TW/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。為 OpenClaw 新增 DeepInfra 模型供應商支援。

- **[deepseek](/zh-TW/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。為 OpenClaw 新增 DeepSeek 模型供應商支援。

- **[diagnostics-otel](/zh-TW/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。用於指標、追蹤與日誌的 OpenClaw 診斷 OpenTelemetry 匯出器。

- **[diagnostics-prometheus](/zh-TW/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。用於執行階段指標的 OpenClaw 診斷 Prometheus 匯出器。

- **[diffs](/zh-TW/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。供代理程式使用的 OpenClaw 唯讀差異檢視器外掛與檔案轉譯器。

- **[diffs-language-pack](/zh-TW/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。為預設差異檢視器集合以外的語言新增語法醒目提示。

- **[discord](/zh-TW/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。OpenClaw Discord 頻道外掛，支援頻道、私人訊息、命令與應用程式事件。

- **[exa](/zh-TW/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。新增網頁搜尋供應商支援。

- **[featherless](/zh-TW/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm；ClawHub：`clawhub:@openclaw/featherless-provider`。OpenClaw Featherless AI 供應商外掛。

- **[feishu](/zh-TW/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。OpenClaw Feishu/Lark 頻道外掛，用於聊天與職場工具（由 @m1heng 社群維護）。

- **[firecrawl](/zh-TW/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。新增代理程式可呼叫的工具。新增網頁擷取供應商支援。新增網頁搜尋供應商支援。

- **[fireworks](/zh-TW/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。為 OpenClaw 新增 Fireworks 模型供應商支援。

- **[gmi](/zh-TW/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 供應商外掛。

- **[google-meet](/zh-TW/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 參與者外掛，可透過 Chrome 或 Twilio 傳輸方式加入通話。

- **[googlechat](/zh-TW/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。OpenClaw Google Chat 頻道外掛，用於聊天室與私人訊息。

- **[gradium](/zh-TW/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。新增文字轉語音供應商支援。

- **[groq](/zh-TW/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。為 OpenClaw 新增 Groq 模型供應商支援。

- **[inworld](/zh-TW/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 串流文字轉語音（MP3、OGG_OPUS、PCM 電話語音）。

- **[irc](/zh-TW/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。新增 IRC 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[kilocode](/zh-TW/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。為 OpenClaw 新增 Kilocode 模型供應商支援。

- **[kimi](/zh-TW/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。為 OpenClaw 新增 Kimi、Kimi Coding 模型供應商支援。

- **[line](/zh-TW/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。用於 LINE Bot API 聊天的 OpenClaw LINE 頻道外掛。

- **[llama-cpp](/zh-TW/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。透過 node-llama-cpp 進行本機 GGUF 文字推論與嵌入。

- **[lobster](/zh-TW/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。Lobster 工作流程工具外掛，用於型別化流水線與可恢復的核准程序。

- **[longcat](/zh-TW/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm；ClawHub：`clawhub:@openclaw/longcat-provider`。OpenClaw LongCat 供應商外掛。

- **[matrix](/zh-TW/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。OpenClaw Matrix 頻道外掛，用於聊天室與私人訊息。

- **[mattermost](/zh-TW/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。新增 Mattermost 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[memory-lancedb](/zh-TW/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。由 LanceDB 支援的 OpenClaw 長期記憶外掛，具備自動回想、自動擷取與向量搜尋功能。

- **[moonshot](/zh-TW/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。為 OpenClaw 新增 Moonshot 模型供應商支援。

- **[msteams](/zh-TW/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。用於機器人對話的 OpenClaw Microsoft Teams 頻道外掛。

- **[mxc](/zh-TW/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm；ClawHub。透過 MXC 在支援 MXC 的 Windows 主機上執行作業系統層級的沙箱化工具：使用已設定的 MXC 原則檔案，在 ProcessContainer（Windows）中執行命令。

- **[nextcloud-talk](/zh-TW/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。用於對話的 OpenClaw Nextcloud Talk 頻道外掛。

- **[nostr](/zh-TW/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。用於 NIP-04 加密私人訊息的 OpenClaw Nostr 頻道外掛。

- **[openshell](/zh-TW/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。用於 NVIDIA OpenShell 命令列介面的 OpenClaw 沙箱後端，具備鏡像本機工作區與 SSH 命令執行功能。

- **[parallel](/zh-TW/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。新增網頁搜尋供應商支援。

- **[perplexity](/zh-TW/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。新增網頁搜尋供應商支援。

- **[pixverse](/zh-TW/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 影片生成供應商外掛。

- **[qianfan](/zh-TW/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。為 OpenClaw 新增 Qianfan 模型供應商支援。

- **[qqbot](/zh-TW/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。用於群組與私人訊息工作流程的 OpenClaw QQ Bot 頻道外掛。

- **[qwen](/zh-TW/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。為 OpenClaw 新增 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Token Plan、Bailian Token Plan 模型供應商支援。

- **[raft](/zh-TW/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。用於安全命令列介面喚醒橋接的 OpenClaw Raft 頻道外掛。

- **[searxng](/zh-TW/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。新增網頁搜尋供應商支援。

- **[signal](/zh-TW/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。新增 Signal 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[slack](/zh-TW/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。OpenClaw Slack 頻道外掛，支援頻道、私人訊息、命令與應用程式事件。

- **[sms](/zh-TW/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。用於 OpenClaw 文字訊息的 Twilio SMS 頻道外掛。

- **[stepfun](/zh-TW/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。新增對 StepFun、StepFun Plan 模型供應商的 OpenClaw 支援。

- **[synology-chat](/zh-TW/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。適用於 OpenClaw 頻道與私人訊息的 Synology Chat 頻道外掛。

- **[tavily](/zh-TW/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。新增代理程式可呼叫的工具。新增網頁搜尋供應商支援。

- **[tencent](/zh-TW/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。新增對 Tencent TokenHub、Tencent Tokenplan 模型供應商的 OpenClaw 支援。

- **[tlon](/zh-TW/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。適用於聊天工作流程的 OpenClaw Tlon/Urbit 頻道外掛。

- **[tokenjuice](/zh-TW/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 Tokenjuice 縮減器壓縮 exec 與 bash 工具的結果。

- **[twitch](/zh-TW/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。適用於聊天與內容管理工作流程的 OpenClaw Twitch 頻道外掛。

- **[venice](/zh-TW/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。新增對 Venice 模型供應商的 OpenClaw 支援。

- **[vercel-ai-gateway](/zh-TW/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。新增對 Vercel AI Gateway 模型供應商的 OpenClaw 支援。

- **[voice-call](/zh-TW/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。適用於 Twilio、Telnyx 與 Plivo 電話通話的 OpenClaw 語音通話外掛。

- **[whatsapp](/zh-TW/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。適用於 WhatsApp Web 聊天的 OpenClaw WhatsApp 頻道外掛。

- **[zai](/zh-TW/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。新增對 Z.AI 模型供應商的 OpenClaw 支援。

- **[zalo](/zh-TW/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。適用於機器人與網路鉤子聊天的 OpenClaw Zalo 頻道外掛。

- **[zalouser](/zh-TW/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。透過原生 zca-js 整合提供的 OpenClaw Zalo Personal Account 外掛。

## 僅限原始碼簽出

2 個外掛

- **[qa-channel](/zh-TW/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 僅限原始碼簽出。新增用於傳送及接收 OpenClaw 訊息的 QA Channel 介面。

- **[qa-lab](/zh-TW/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 僅限原始碼簽出。OpenClaw QA 實驗室外掛，具備私有偵錯工具使用者介面與情境執行器。

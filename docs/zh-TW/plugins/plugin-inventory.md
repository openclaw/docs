---
read_when:
    - 你正在判斷某個外掛是隨附於核心 npm 套件中，還是另外安裝
    - 你正在更新內建外掛套件中繼資料或發布自動化
    - 你需要內部與外部外掛的標準清單
summary: OpenClaw 外掛的產生清單，涵蓋隨核心出貨、對外發布或僅保留原始碼的外掛
title: 外掛清單
x-i18n:
    generated_at: "2026-07-06T21:53:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 864304d1cc536e7ff826b956c82dc031aa7d2fd0b42151ccf51b2ddcb29c0381
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 外掛清單

此頁面是由 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 套件的 `files` 排除項目產生。請使用以下命令重新產生：

```bash
pnpm plugins:inventory:gen
```

## 定義

- **核心 npm 套件：** 內建於 `openclaw` npm 套件中，不需另外安裝外掛即可使用。
- **官方外部套件：** 由 OpenClaw 維護、從核心 npm 套件中省略、保留在此官方清單中，並可透過 ClawHub 和/或 npm 隨需安裝的外掛。
- **僅限原始碼 checkout：** 僅存於 repo 本機、從已發布的 npm 成品中省略，且不會宣傳為可安裝套件的外掛。

原始碼 checkout 與 npm 安裝不同：執行 `pnpm install` 後，已綑綁的
外掛會從 `extensions/<id>` 載入，因此可使用本機編輯與套件本機 workspace
相依項目。

## 安裝外掛

使用每個項目中的安裝路徑判斷是否需要安裝。標示為 `included in OpenClaw` 的外掛
已存在於核心套件中。官方外部套件需要安裝一次，然後重新啟動閘道。

例如，Discord 是官方外部套件：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在發布切換期間，一般的裸套件規格仍會從 npm 安裝。
需要明確來源時，請使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。
安裝後，依照外掛的設定文件，例如
[Discord](/zh-TW/channels/discord)，加入憑證與通道設定。更新、解除安裝與發布
命令請參閱
[管理外掛](/zh-TW/plugins/manage-plugins)。

每個項目都列出套件、發佈路徑與說明。

## 核心 npm 套件

61 個外掛

- **[admin-http-rpc](/zh-TW/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - 包含於 OpenClaw。OpenClaw 管理 HTTP RPC 端點。

- **[alibaba](/zh-TW/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - 包含於 OpenClaw。新增影片生成提供者支援。

- **[anthropic](/zh-TW/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Anthropic 模型提供者支援。

- **[azure-speech](/zh-TW/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - 包含於 OpenClaw。Azure AI Speech 文字轉語音（MP3、原生 Ogg/Opus 語音記事、PCM 電話音訊）。

- **[bonjour](/zh-TW/plugins/reference/bonjour)** (`@openclaw/bonjour`) - 包含於 OpenClaw。透過 Bonjour/mDNS 宣告本機 OpenClaw 閘道。

- **[browser](/zh-TW/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 包含於 OpenClaw。新增可由代理呼叫的工具。

- **[byteplus](/zh-TW/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 BytePlus、BytePlus Plan 模型提供者支援。

- **[canvas](/zh-TW/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 包含於 OpenClaw。為配對節點提供實驗性 Canvas 控制與 A2UI 轉譯介面。

- **[clawrouter](/zh-TW/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - 包含於 OpenClaw。為 OpenClaw 新增 ClawRouter 模型提供者支援。

- **[codex-supervisor](/zh-TW/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - 包含於 OpenClaw。從 OpenClaw 監督 Codex app-server 工作階段。

- **[cohere](/zh-TW/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 包含於 OpenClaw；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 提供者外掛。

- **[comfy](/zh-TW/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 ComfyUI 模型提供者支援。

- **[copilot-proxy](/zh-TW/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 包含於 OpenClaw。為 OpenClaw 新增 Copilot Proxy 模型提供者支援。

- **[deepgram](/zh-TW/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 包含於 OpenClaw。新增媒體理解提供者支援。新增即時轉錄提供者支援。

- **[document-extract](/zh-TW/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 包含於 OpenClaw。從本機文件附件擷取文字與備援頁面圖片。

- **[duckduckgo](/zh-TW/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 包含於 OpenClaw。新增網頁搜尋提供者支援。

- **[elevenlabs](/zh-TW/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - 包含於 OpenClaw。新增媒體理解提供者支援。新增即時轉錄提供者支援。新增文字轉語音提供者支援。

- **[fal](/zh-TW/plugins/reference/fal)** (`@openclaw/fal-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 fal 模型提供者支援。

- **[file-transfer](/zh-TW/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - 包含於 OpenClaw。透過專用節點命令，在配對節點上擷取、列出與寫入檔案。對於最高 16 MB 的二進位檔，透過 node.invoke 使用 base64，以避開 bash stdout 截斷。

- **[github-copilot](/zh-TW/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 GitHub Copilot 模型提供者支援。

- **[google](/zh-TW/plugins/reference/google)** (`@openclaw/google-plugin`) - 包含於 OpenClaw。為 OpenClaw 新增 Google、Google Gemini CLI、Google Vertex 模型提供者支援。

- **[huggingface](/zh-TW/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Hugging Face 模型提供者支援。

- **[imessage](/zh-TW/plugins/reference/imessage)** (`@openclaw/imessage`) - 包含於 OpenClaw。新增 iMessage 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[litellm](/zh-TW/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 LiteLLM 模型提供者支援。

- **[llm-task](/zh-TW/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 包含於 OpenClaw。通用的僅 JSON LLM 工具，可由工作流程呼叫以處理結構化任務。

- **[lmstudio](/zh-TW/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 LM Studio 模型提供者支援。

- **[logbook](/plugins/reference/logbook)** (`@openclaw/logbook`) - 包含於 OpenClaw。自動工作日誌：從配對節點擷取定期螢幕快照，並將其轉換成可檢閱的一日時間軸。

- **[memory-core](/zh-TW/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 包含於 OpenClaw。新增可由代理呼叫的工具。

- **[memory-wiki](/zh-TW/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 包含於 OpenClaw。OpenClaw 的持久化 wiki 編譯器與 Obsidian 友善知識庫。

- **[microsoft](/zh-TW/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 包含於 OpenClaw。新增文字轉語音提供者支援。

- **[microsoft-foundry](/zh-TW/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 包含於 OpenClaw。為 OpenClaw 新增 Microsoft Foundry 模型提供者支援。

- **[migrate-claude](/zh-TW/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 包含於 OpenClaw。將 Claude Code 與 Claude Desktop 指示、MCP 伺服器、Skills，以及安全設定匯入 OpenClaw。

- **[migrate-hermes](/zh-TW/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 包含於 OpenClaw。將 Hermes 設定、記憶、Skills 與支援的憑證匯入 OpenClaw。

- **[minimax](/zh-TW/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 MiniMax、MiniMax Portal 模型提供者支援。

- **[mistral](/zh-TW/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Mistral 模型提供者支援。

- **[novita](/zh-TW/plugins/reference/novita)** (`@openclaw/novita-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Novita、Novita AI、Novitaai 模型提供者支援。

- **[nvidia](/zh-TW/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 NVIDIA 模型提供者支援。

- **[oc-path](/zh-TW/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 包含於 OpenClaw。新增 openclaw path 命令列介面，用於 oc:// workspace 檔案定址。

- **[ollama](/zh-TW/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Ollama、Ollama Cloud 模型提供者支援。

- **[open-prose](/zh-TW/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 包含於 OpenClaw。OpenProse VM skill pack，包含 /prose slash command。

- **[openai](/zh-TW/plugins/reference/openai)** (`@openclaw/openai-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 OpenAI 模型提供者支援。

- **[opencode](/zh-TW/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 OpenCode 模型提供者支援。

- **[opencode-go](/zh-TW/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 OpenCode Go 模型提供者支援。

- **[openrouter](/zh-TW/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 OpenRouter 模型提供者支援。

- **[policy](/zh-TW/plugins/reference/policy)** (`@openclaw/policy`) - 包含於 OpenClaw。新增以政策為基礎的 doctor 檢查，用於 workspace 合規性。

- **[runway](/zh-TW/plugins/reference/runway)** (`@openclaw/runway-provider`) - 包含於 OpenClaw。新增影片生成提供者支援。

- **[senseaudio](/zh-TW/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 包含於 OpenClaw。新增媒體理解提供者支援。

- **[sglang](/zh-TW/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 SGLang 模型提供者支援。

- **[synthetic](/zh-TW/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Synthetic 模型提供者支援。

- **[telegram](/zh-TW/plugins/reference/telegram)** (`@openclaw/telegram`) - 包含於 OpenClaw。新增 Telegram 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[together](/zh-TW/plugins/reference/together)** (`@openclaw/together-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Together 模型提供者支援。

- **[tts-local-cli](/zh-TW/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 包含於 OpenClaw。新增文字轉語音提供者支援。

- **[vllm](/zh-TW/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 vLLM 模型提供者支援。

- **[volcengine](/zh-TW/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Volcengine、Volcengine Plan 模型提供者支援。

- **[voyage](/zh-TW/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 包含於 OpenClaw。新增記憶嵌入提供者支援。

- **[vydra](/zh-TW/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Vydra 模型提供者支援。

- **[web-readability](/zh-TW/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 包含於 OpenClaw。從本機 HTML 網頁擷取回應中擷取可讀文章內容。

- **[webhooks](/zh-TW/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 包含於 OpenClaw。已驗證的傳入網路鉤子，可將外部自動化繫結到 OpenClaw TaskFlows。

- **[workboard](/zh-TW/plugins/reference/workboard)** (`@openclaw/workboard`) - 包含於 OpenClaw。供代理擁有的議題與工作階段使用的儀表板工作板。

- **[xai](/zh-TW/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 包含於 OpenClaw。為 OpenClaw 新增 xAI 模型提供者支援。

- **[xiaomi](/zh-TW/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 包含於 OpenClaw。為 OpenClaw 新增 Xiaomi、Xiaomi Token Plan 模型提供者支援。

## 官方外部套件

69 個外掛

- **[acpx](/zh-TW/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 執行階段後端，具備由外掛擁有的工作階段與傳輸管理。

- **[amazon-bedrock](/zh-TW/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 提供者外掛，支援模型探索、嵌入與防護欄。

- **[amazon-bedrock-mantle](/zh-TW/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle 提供者外掛，用於 OpenAI 相容的模型路由。

- **[anthropic-vertex](/zh-TW/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex 提供者外掛，用於 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-TW/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。為 OpenClaw 新增 Arcee 模型提供者支援。

- **[brave](/zh-TW/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。OpenClaw Brave Search 提供者外掛，用於網頁搜尋。

- **[cerebras](/zh-TW/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。為 OpenClaw 新增 Cerebras 模型提供者支援。

- **[chutes](/zh-TW/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。為 OpenClaw 新增 Chutes 模型提供者支援。

- **[clickclack](/zh-TW/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。新增 ClickClack 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[cloudflare-ai-gateway](/zh-TW/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。為 OpenClaw 新增 Cloudflare AI Gateway 模型提供者支援。

- **[codex](/zh-TW/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。OpenClaw Codex app-server 測試框架與模型提供者外掛，具備 Codex 管理的 GPT 目錄。

- **[copilot](/zh-TW/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。註冊 GitHub Copilot 代理程式執行環境。

- **[deepinfra](/zh-TW/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。為 OpenClaw 新增 DeepInfra 模型提供者支援。

- **[deepseek](/zh-TW/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。為 OpenClaw 新增 DeepSeek 模型提供者支援。

- **[diagnostics-otel](/zh-TW/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。OpenClaw 診斷 OpenTelemetry 匯出器，用於指標、追蹤與日誌。

- **[diagnostics-prometheus](/zh-TW/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。OpenClaw 診斷 Prometheus 匯出器，用於執行環境指標。

- **[diffs](/zh-TW/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。OpenClaw 唯讀差異檢視器外掛與代理程式用檔案轉譯器。

- **[diffs-language-pack](/zh-TW/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。為預設差異檢視器集合以外的語言新增語法醒目提示。

- **[discord](/zh-TW/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。OpenClaw Discord 通道外掛，用於頻道、私訊、命令與應用程式事件。

- **[exa](/zh-TW/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。新增網頁搜尋提供者支援。

- **[feishu](/zh-TW/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。OpenClaw Feishu/Lark 通道外掛，用於聊天與工作場所工具（由 @m1heng 社群維護）。

- **[firecrawl](/zh-TW/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。新增可由代理程式呼叫的工具。新增網頁擷取提供者支援。新增網頁搜尋提供者支援。

- **[fireworks](/zh-TW/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。為 OpenClaw 新增 Fireworks 模型提供者支援。

- **[gmi](/zh-TW/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供者外掛。

- **[google-meet](/zh-TW/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 參與者外掛，用於透過 Chrome 或 Twilio 傳輸加入通話。

- **[googlechat](/zh-TW/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。OpenClaw Google Chat 通道外掛，用於聊天室與直接訊息。

- **[gradium](/zh-TW/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。新增文字轉語音提供者支援。

- **[groq](/zh-TW/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。為 OpenClaw 新增 Groq 模型提供者支援。

- **[inworld](/zh-TW/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 串流文字轉語音（MP3、OGG_OPUS、PCM 電話音訊）。

- **[irc](/zh-TW/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。新增 IRC 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[kilocode](/zh-TW/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。為 OpenClaw 新增 Kilocode 模型提供者支援。

- **[kimi](/zh-TW/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。為 OpenClaw 新增 Kimi、Kimi Coding 模型提供者支援。

- **[line](/zh-TW/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。OpenClaw LINE 通道外掛，用於 LINE Bot API 聊天。

- **[llama-cpp](/zh-TW/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。透過 node-llama-cpp 提供本機 GGUF 嵌入。

- **[lobster](/zh-TW/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。Lobster 工作流程工具外掛，用於型別化管線與可恢復的核准流程。

- **[longcat](/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm；ClawHub：`clawhub:@openclaw/longcat-provider`。OpenClaw LongCat 提供者外掛。

- **[matrix](/zh-TW/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。OpenClaw Matrix 通道外掛，用於房間與直接訊息。

- **[mattermost](/zh-TW/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。新增 Mattermost 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[memory-lancedb](/zh-TW/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。OpenClaw LanceDB 支援的長期記憶外掛，具備自動回想、自動擷取與向量搜尋。

- **[moonshot](/zh-TW/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。為 OpenClaw 新增 Moonshot 模型提供者支援。

- **[msteams](/zh-TW/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。OpenClaw Microsoft Teams 通道外掛，用於機器人對話。

- **[nextcloud-talk](/zh-TW/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。OpenClaw Nextcloud Talk 通道外掛，用於對話。

- **[nostr](/zh-TW/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。OpenClaw Nostr 通道外掛，用於 NIP-04 加密直接訊息。

- **[openshell](/zh-TW/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。OpenClaw 沙盒後端，用於 NVIDIA OpenShell CLI，具備鏡像本機工作區與 SSH 命令執行。

- **[parallel](/zh-TW/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。新增網頁搜尋提供者支援。

- **[perplexity](/zh-TW/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。新增網頁搜尋提供者支援。

- **[pixverse](/zh-TW/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 影片生成提供者外掛。

- **[qianfan](/zh-TW/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。為 OpenClaw 新增 Qianfan 模型提供者支援。

- **[qqbot](/zh-TW/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。OpenClaw QQ Bot 通道外掛，用於群組與直接訊息工作流程。

- **[qwen](/zh-TW/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。為 OpenClaw 新增 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI 模型提供者支援。

- **[raft](/zh-TW/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。OpenClaw Raft 通道外掛，用於安全的命令列介面喚醒橋接。

- **[searxng](/zh-TW/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。新增網頁搜尋提供者支援。

- **[signal](/zh-TW/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。新增 Signal 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[slack](/zh-TW/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。OpenClaw Slack 通道外掛，用於頻道、私訊、命令與應用程式事件。

- **[sms](/zh-TW/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。Twilio SMS 通道外掛，用於 OpenClaw 文字訊息。

- **[stepfun](/zh-TW/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。為 OpenClaw 新增 StepFun、StepFun Plan 模型提供者支援。

- **[synology-chat](/zh-TW/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。Synology Chat 通道外掛，用於 OpenClaw 頻道與直接訊息。

- **[tavily](/zh-TW/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。新增可由代理程式呼叫的工具。新增網頁搜尋提供者支援。

- **[tencent](/zh-TW/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。為 OpenClaw 新增 Tencent TokenHub 與 TokenPlan 模型提供者支援。

- **[tlon](/zh-TW/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。OpenClaw Tlon/Urbit 通道外掛，用於聊天工作流程。

- **[tokenjuice](/zh-TW/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 tokenjuice reducers 壓縮 exec 與 bash 工具結果。

- **[twitch](/zh-TW/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。OpenClaw Twitch 通道外掛，用於聊天與審核工作流程。

- **[venice](/zh-TW/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。為 OpenClaw 新增 Venice 模型提供者支援。

- **[vercel-ai-gateway](/zh-TW/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。為 OpenClaw 新增 Vercel AI Gateway 模型提供者支援。

- **[voice-call](/zh-TW/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。OpenClaw 語音通話外掛，用於 Twilio、Telnyx 與 Plivo 電話通話。

- **[whatsapp](/zh-TW/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。OpenClaw WhatsApp 通道外掛，用於 WhatsApp Web 聊天。

- **[zai](/zh-TW/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。為 OpenClaw 新增 Z.AI 模型提供者支援。

- **[zalo](/zh-TW/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。OpenClaw Zalo 通道外掛，用於機器人與網路鉤子聊天。

- **[zalouser](/zh-TW/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。透過原生 zca-js 整合的 OpenClaw Zalo Personal 帳號外掛。

## 僅限原始碼 checkout

3 個外掛

- **[qa-channel](/zh-TW/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 僅限原始碼 checkout。新增用於傳送和接收 OpenClaw 訊息的 QA Channel 介面。

- **[qa-lab](/zh-TW/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 僅限原始碼 checkout。OpenClaw QA lab 外掛，包含私有偵錯工具 UI 和情境執行器。

- **[qa-matrix](/zh-TW/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 僅限原始碼 checkout。Matrix QA 傳輸執行器與基底。

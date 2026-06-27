---
read_when:
    - 你正在決定某個外掛是隨核心 npm 套件出貨，還是分開安裝
    - 你正在更新內建外掛套件中繼資料或發布自動化
    - 您需要標準的內部與外部外掛清單
summary: OpenClaw 外掛清單，由核心隨附、外部發布或僅保留原始碼的外掛產生
title: 外掛清單
x-i18n:
    generated_at: "2026-06-27T19:39:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 外掛清單

此頁面是由 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 套件 `files` 排除項目產生。使用以下指令重新產生：

```bash
pnpm plugins:inventory:gen
```

## 定義

- **核心 npm 套件：**內建於 `openclaw` npm 套件，無需另外安裝外掛即可使用。
- **官方外部套件：**由 OpenClaw 維護、從核心 npm 套件中省略、保留於此官方清單，並可透過 ClawHub 和/或 npm 按需安裝的外掛。
- **僅限原始碼 checkout：**存放於 repo 本機、從已發布 npm 成品中省略，且未宣傳為可安裝套件的外掛。

原始碼 checkout 與 npm 安裝不同：執行 `pnpm install` 後，隨附的
外掛會從 `extensions/<id>` 載入，因此本機編輯與套件本機 workspace
相依性都可使用。

## 安裝外掛

使用每個項目中的安裝路徑來判斷是否需要安裝。標示為 `included in OpenClaw` 的外掛已存在於核心套件中。
官方外部套件需要安裝一次，然後重新啟動閘道。

例如，Discord 是官方外部套件：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在啟動切換期間，一般裸套件規格仍會從 npm 安裝。
當你需要明確來源時，請使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。
安裝後，依照外掛的設定文件，例如
[Discord](/zh-TW/channels/discord)，加入憑證與通道設定。請參閱
[管理外掛](/zh-TW/plugins/manage-plugins) 以取得更新、解除安裝與發布指令。

每個項目列出套件、發行路徑與說明。

## 核心 npm 套件

59 個外掛

- **[admin-http-rpc](/zh-TW/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - 內含於 OpenClaw。OpenClaw 管理 HTTP RPC 端點。

- **[alibaba](/zh-TW/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - 內含於 OpenClaw。新增影片生成提供者支援。

- **[anthropic](/zh-TW/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Anthropic 模型提供者支援。

- **[azure-speech](/zh-TW/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - 內含於 OpenClaw。Azure AI Speech 文字轉語音（MP3、原生 Ogg/Opus 語音訊息、PCM 電話語音）。

- **[bonjour](/zh-TW/plugins/reference/bonjour)** (`@openclaw/bonjour`) - 內含於 OpenClaw。透過 Bonjour/mDNS 廣播本機 OpenClaw 閘道。

- **[browser](/zh-TW/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 內含於 OpenClaw。新增代理可呼叫的工具。

- **[byteplus](/zh-TW/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 BytePlus、BytePlus Plan 模型提供者支援。

- **[canvas](/zh-TW/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 內含於 OpenClaw。為配對節點提供實驗性 Canvas 控制與 A2UI 算繪介面。

- **[codex-supervisor](/zh-TW/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - 內含於 OpenClaw。從 OpenClaw 監督 Codex app-server 工作階段。

- **[cohere](/zh-TW/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 內含於 OpenClaw；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 提供者外掛。

- **[comfy](/zh-TW/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 ComfyUI 模型提供者支援。

- **[copilot-proxy](/zh-TW/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 內含於 OpenClaw。為 OpenClaw 新增 Copilot Proxy 模型提供者支援。

- **[deepgram](/zh-TW/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 內含於 OpenClaw。新增媒體理解提供者支援。新增即時轉錄提供者支援。

- **[document-extract](/zh-TW/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 內含於 OpenClaw。從本機文件附件擷取文字與備用頁面影像。

- **[duckduckgo](/zh-TW/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 內含於 OpenClaw。新增網路搜尋提供者支援。

- **[elevenlabs](/zh-TW/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - 內含於 OpenClaw。新增媒體理解提供者支援。新增即時轉錄提供者支援。新增文字轉語音提供者支援。

- **[fal](/zh-TW/plugins/reference/fal)** (`@openclaw/fal-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 fal 模型提供者支援。

- **[file-transfer](/zh-TW/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - 內含於 OpenClaw。透過專用節點指令在配對節點上擷取、列出與寫入檔案。對於最高 16 MB 的二進位檔，使用透過 node.invoke 傳送的 base64，以略過 bash stdout 截斷。

- **[github-copilot](/zh-TW/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 GitHub Copilot 模型提供者支援。

- **[google](/zh-TW/plugins/reference/google)** (`@openclaw/google-plugin`) - 內含於 OpenClaw。為 OpenClaw 新增 Google、Google Gemini CLI、Google Vertex 模型提供者支援。

- **[huggingface](/zh-TW/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Hugging Face 模型提供者支援。

- **[imessage](/zh-TW/plugins/reference/imessage)** (`@openclaw/imessage`) - 內含於 OpenClaw。新增用於傳送與接收 OpenClaw 訊息的 iMessage 通道介面。

- **[litellm](/zh-TW/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 LiteLLM 模型提供者支援。

- **[llm-task](/zh-TW/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 內含於 OpenClaw。可從工作流程呼叫、用於結構化任務的通用 JSON-only LLM 工具。

- **[lmstudio](/zh-TW/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 LM Studio 模型提供者支援。

- **[memory-core](/zh-TW/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 內含於 OpenClaw。新增代理可呼叫的工具。

- **[memory-wiki](/zh-TW/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 內含於 OpenClaw。為 OpenClaw 提供持久化 wiki 編譯器與適合 Obsidian 的知識庫。

- **[microsoft](/zh-TW/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 內含於 OpenClaw。新增文字轉語音提供者支援。

- **[microsoft-foundry](/zh-TW/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 內含於 OpenClaw。為 OpenClaw 新增 Microsoft Foundry 模型提供者支援。

- **[migrate-claude](/zh-TW/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 內含於 OpenClaw。將 Claude Code 與 Claude Desktop 指示、MCP 伺服器、skills 以及安全設定匯入 OpenClaw。

- **[migrate-hermes](/zh-TW/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 內含於 OpenClaw。將 Hermes 設定、記憶、skills 與支援的憑證匯入 OpenClaw。

- **[minimax](/zh-TW/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 MiniMax、MiniMax Portal 模型提供者支援。

- **[mistral](/zh-TW/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Mistral 模型提供者支援。

- **[novita](/zh-TW/plugins/reference/novita)** (`@openclaw/novita-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Novita、Novita AI、Novitaai 模型提供者支援。

- **[nvidia](/zh-TW/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 NVIDIA 模型提供者支援。

- **[oc-path](/zh-TW/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 內含於 OpenClaw。新增用於 oc:// workspace 檔案定址的 openclaw path 命令列介面。

- **[ollama](/zh-TW/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Ollama、Ollama Cloud 模型提供者支援。

- **[open-prose](/zh-TW/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 內含於 OpenClaw。OpenProse VM skill pack，提供 /prose 斜線指令。

- **[openai](/zh-TW/plugins/reference/openai)** (`@openclaw/openai-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 OpenAI 模型提供者支援。

- **[opencode](/zh-TW/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 OpenCode 模型提供者支援。

- **[opencode-go](/zh-TW/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 OpenCode Go 模型提供者支援。

- **[openrouter](/zh-TW/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 OpenRouter 模型提供者支援。

- **[policy](/zh-TW/plugins/reference/policy)** (`@openclaw/policy`) - 內含於 OpenClaw。新增由政策支援的 doctor 檢查，以確認 workspace 符合規範。

- **[runway](/zh-TW/plugins/reference/runway)** (`@openclaw/runway-provider`) - 內含於 OpenClaw。新增影片生成提供者支援。

- **[senseaudio](/zh-TW/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 內含於 OpenClaw。新增媒體理解提供者支援。

- **[sglang](/zh-TW/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 SGLang 模型提供者支援。

- **[synthetic](/zh-TW/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Synthetic 模型提供者支援。

- **[telegram](/zh-TW/plugins/reference/telegram)** (`@openclaw/telegram`) - 內含於 OpenClaw。新增用於傳送與接收 OpenClaw 訊息的 Telegram 通道介面。

- **[together](/zh-TW/plugins/reference/together)** (`@openclaw/together-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Together 模型提供者支援。

- **[tts-local-cli](/zh-TW/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 內含於 OpenClaw。新增文字轉語音提供者支援。

- **[vllm](/zh-TW/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 vLLM 模型提供者支援。

- **[volcengine](/zh-TW/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Volcengine、Volcengine Plan 模型提供者支援。

- **[voyage](/zh-TW/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 內含於 OpenClaw。新增記憶嵌入提供者支援。

- **[vydra](/zh-TW/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Vydra 模型提供者支援。

- **[web-readability](/zh-TW/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 內含於 OpenClaw。從本機 HTML 網頁擷取回應中擷取可讀文章內容。

- **[webhooks](/zh-TW/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 內含於 OpenClaw。經驗證的入站網路鉤子，將外部自動化綁定至 OpenClaw TaskFlows。

- **[workboard](/zh-TW/plugins/reference/workboard)** (`@openclaw/workboard`) - 內含於 OpenClaw。供代理擁有的議題與工作階段使用的儀表板工作板。

- **[xai](/zh-TW/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 內含於 OpenClaw。為 OpenClaw 新增 xAI 模型提供者支援。

- **[xiaomi](/zh-TW/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 內含於 OpenClaw。為 OpenClaw 新增 Xiaomi、Xiaomi Token Plan 模型提供者支援。

## 官方外部套件

68 個外掛

- **[acpx](/zh-TW/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 執行階段後端，具備外掛擁有的工作階段與傳輸管理。

- **[amazon-bedrock](/zh-TW/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 提供者外掛，支援模型探索、嵌入與 guardrail。

- **[amazon-bedrock-mantle](/zh-TW/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle 提供者外掛，用於 OpenAI 相容模型路由。

- **[anthropic-vertex](/zh-TW/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex 提供者外掛，用於 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-TW/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。為 OpenClaw 新增 Arcee 模型提供者支援。

- **[brave](/zh-TW/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。OpenClaw Brave Search 提供者外掛，用於網頁搜尋。

- **[cerebras](/zh-TW/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。為 OpenClaw 新增 Cerebras 模型提供者支援。

- **[chutes](/zh-TW/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。為 OpenClaw 新增 Chutes 模型提供者支援。

- **[clickclack](/zh-TW/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。新增 ClickClack 頻道介面，用於傳送和接收 OpenClaw 訊息。

- **[cloudflare-ai-gateway](/zh-TW/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。為 OpenClaw 新增 Cloudflare AI Gateway 模型提供者支援。

- **[codex](/zh-TW/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。OpenClaw Codex app-server harness 與模型提供者外掛，包含由 Codex 管理的 GPT 型錄。

- **[copilot](/zh-TW/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。註冊 GitHub Copilot 代理程式執行階段。

- **[deepinfra](/zh-TW/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。為 OpenClaw 新增 DeepInfra 模型提供者支援。

- **[deepseek](/zh-TW/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。為 OpenClaw 新增 DeepSeek 模型提供者支援。

- **[diagnostics-otel](/zh-TW/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。OpenClaw 診斷 OpenTelemetry 匯出器，用於指標、追蹤與記錄。

- **[diagnostics-prometheus](/zh-TW/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。OpenClaw 診斷 Prometheus 匯出器，用於執行階段指標。

- **[diffs](/zh-TW/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。OpenClaw 唯讀差異檢視器外掛與代理程式檔案轉譯器。

- **[diffs-language-pack](/zh-TW/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。為預設差異檢視器集合以外的語言新增語法醒目提示。

- **[discord](/zh-TW/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。OpenClaw Discord 頻道外掛，用於頻道、私訊、命令與應用程式事件。

- **[exa](/zh-TW/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。新增網頁搜尋提供者支援。

- **[feishu](/zh-TW/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。OpenClaw Feishu/Lark 頻道外掛，用於聊天與工作場所工具（由 @m1heng 社群維護）。

- **[firecrawl](/zh-TW/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。新增可由代理程式呼叫的工具。新增網頁擷取提供者支援。新增網頁搜尋提供者支援。

- **[fireworks](/zh-TW/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。為 OpenClaw 新增 Fireworks 模型提供者支援。

- **[gmi](/zh-TW/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供者外掛。

- **[google-meet](/zh-TW/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 參與者外掛，用於透過 Chrome 或 Twilio 傳輸加入通話。

- **[googlechat](/zh-TW/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。OpenClaw Google Chat 頻道外掛，用於聊天室與直接訊息。

- **[gradium](/zh-TW/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。新增文字轉語音提供者支援。

- **[groq](/zh-TW/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。為 OpenClaw 新增 Groq 模型提供者支援。

- **[inworld](/zh-TW/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 串流文字轉語音（MP3、OGG_OPUS、PCM 電話語音）。

- **[irc](/zh-TW/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。新增 IRC 頻道介面，用於傳送和接收 OpenClaw 訊息。

- **[kilocode](/zh-TW/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。為 OpenClaw 新增 Kilocode 模型提供者支援。

- **[kimi](/zh-TW/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。為 OpenClaw 新增 Kimi、Kimi Coding 模型提供者支援。

- **[line](/zh-TW/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。OpenClaw LINE 頻道外掛，用於 LINE Bot API 聊天。

- **[llama-cpp](/zh-TW/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。透過 node-llama-cpp 進行本機 GGUF 嵌入。

- **[lobster](/zh-TW/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。Lobster 工作流程工具外掛，用於型別化管線與可恢復核准。

- **[matrix](/zh-TW/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。OpenClaw Matrix 頻道外掛，用於房間與直接訊息。

- **[mattermost](/zh-TW/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。新增 Mattermost 頻道介面，用於傳送和接收 OpenClaw 訊息。

- **[memory-lancedb](/zh-TW/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。OpenClaw 由 LanceDB 支援的長期記憶外掛，具備自動回想、自動擷取與向量搜尋。

- **[moonshot](/zh-TW/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。為 OpenClaw 新增 Moonshot 模型提供者支援。

- **[msteams](/zh-TW/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。OpenClaw Microsoft Teams 頻道外掛，用於 Bot 對話。

- **[nextcloud-talk](/zh-TW/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。OpenClaw Nextcloud Talk 頻道外掛，用於對話。

- **[nostr](/zh-TW/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。OpenClaw Nostr 頻道外掛，用於 NIP-04 加密直接訊息。

- **[openshell](/zh-TW/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。OpenClaw 沙盒後端，用於 NVIDIA OpenShell 命令列介面，具備鏡像本機工作區與 SSH 命令執行。

- **[parallel](/zh-TW/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。新增網頁搜尋提供者支援。

- **[perplexity](/zh-TW/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。新增網頁搜尋提供者支援。

- **[pixverse](/zh-TW/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 影片生成提供者外掛。

- **[qianfan](/zh-TW/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。為 OpenClaw 新增 Qianfan 模型提供者支援。

- **[qqbot](/zh-TW/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。OpenClaw QQ Bot 頻道外掛，用於群組與直接訊息工作流程。

- **[qwen](/zh-TW/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。為 OpenClaw 新增 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen 命令列介面模型提供者支援。

- **[raft](/zh-TW/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。OpenClaw Raft 頻道外掛，用於安全的命令列介面喚醒橋接。

- **[searxng](/zh-TW/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。新增網頁搜尋提供者支援。

- **[signal](/zh-TW/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。新增 Signal 頻道介面，用於傳送和接收 OpenClaw 訊息。

- **[slack](/zh-TW/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。OpenClaw Slack 頻道外掛，用於頻道、私訊、命令與應用程式事件。

- **[sms](/zh-TW/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。Twilio SMS 頻道外掛，用於 OpenClaw 文字訊息。

- **[stepfun](/zh-TW/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。為 OpenClaw 新增 StepFun、StepFun Plan 模型提供者支援。

- **[synology-chat](/zh-TW/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。Synology Chat 頻道外掛，用於 OpenClaw 頻道與直接訊息。

- **[tavily](/zh-TW/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。新增可由代理程式呼叫的工具。新增網頁搜尋提供者支援。

- **[tencent](/zh-TW/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。為 OpenClaw 新增 Tencent TokenHub 模型提供者支援。

- **[tlon](/zh-TW/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。OpenClaw Tlon/Urbit 頻道外掛，用於聊天工作流程。

- **[tokenjuice](/zh-TW/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 tokenjuice reducers 壓縮 exec 與 bash 工具結果。

- **[twitch](/zh-TW/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。OpenClaw Twitch 頻道外掛，用於聊天與審核工作流程。

- **[venice](/zh-TW/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。為 OpenClaw 新增 Venice 模型提供者支援。

- **[vercel-ai-gateway](/zh-TW/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。為 OpenClaw 新增 Vercel AI Gateway 模型提供者支援。

- **[voice-call](/zh-TW/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。OpenClaw voice-call 外掛，用於 Twilio、Telnyx 與 Plivo 電話通話。

- **[whatsapp](/zh-TW/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。OpenClaw WhatsApp 頻道外掛，用於 WhatsApp Web 聊天。

- **[zai](/zh-TW/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。為 OpenClaw 新增 Z.AI 模型提供者支援。

- **[zalo](/zh-TW/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。OpenClaw Zalo 頻道外掛，用於 Bot 與網路鉤子聊天。

- **[zalouser](/zh-TW/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。OpenClaw Zalo Personal Account 外掛，透過原生 zca-js 整合。

## 僅限原始碼 checkout

3 個外掛

- **[qa-channel](/zh-TW/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 僅限原始碼 checkout。新增 QA Channel 介面，用於傳送和接收 OpenClaw 訊息。

- **[qa-lab](/zh-TW/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 僅限原始碼 checkout。OpenClaw QA lab 外掛，具備私有偵錯工具介面與情境執行器。

- **[qa-matrix](/zh-TW/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 僅限原始碼簽出。矩陣 QA 傳輸執行器與基底。

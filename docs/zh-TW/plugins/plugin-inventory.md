---
read_when:
    - 你正在決定外掛是隨核心 npm 套件出貨，還是另外安裝
    - 你正在更新隨附外掛套件中繼資料或發布自動化
    - 你需要標準的內部與外部外掛清單
summary: OpenClaw 外掛清單，包含隨核心出貨、外部發布或僅保留原始碼的外掛
title: 外掛清單
x-i18n:
    generated_at: "2026-07-06T10:51:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: feed0b08f0120da28d2c605398d62e906b04fbd6ed1781cba7767819922a7059
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 外掛清單

此頁面是從 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 套件的 `files` 排除項目產生。使用以下命令重新產生：

```bash
pnpm plugins:inventory:gen
```

## 定義

- **核心 npm 套件：** 內建於 `openclaw` npm 套件，無需另外安裝外掛即可使用。
- **官方外部套件：** 由 OpenClaw 維護的外掛，未包含在核心 npm 套件中，保留在此官方清單內，並可透過 ClawHub 和/或 npm 按需安裝。
- **僅限原始碼 checkout：** 儲存庫本機外掛，未包含在已發布的 npm 成品中，也不宣傳為可安裝套件。

原始碼 checkout 與 npm 安裝不同：執行 `pnpm install` 後，已綁定的
外掛會從 `extensions/<id>` 載入，因此可使用本機編輯與套件本機 workspace
相依項。

## 安裝外掛

使用每個項目中的安裝路徑來判斷是否需要安裝。標示為 `included in OpenClaw` 的外掛
已存在於核心套件中。
官方外部套件需要安裝一次，然後重新啟動閘道。

例如，Discord 是官方外部套件：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在啟動切換期間，普通的裸套件規格仍會從 npm 安裝。
當你需要明確來源時，請使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。
安裝後，請依照該外掛的設定文件，例如
[Discord](/zh-TW/channels/discord)，新增憑證與通道設定。請參閱
[管理外掛](/zh-TW/plugins/manage-plugins) 了解更新、解除安裝與發布
命令。

每個項目都列出套件、發佈路徑與描述。

## 核心 npm 套件

60 個外掛

- **[admin-http-rpc](/zh-TW/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - included in OpenClaw。OpenClaw 管理 HTTP RPC 端點。

- **[alibaba](/zh-TW/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - included in OpenClaw。新增影片生成供應商支援。

- **[anthropic](/zh-TW/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - included in OpenClaw。為 OpenClaw 新增 Anthropic 模型供應商支援。

- **[azure-speech](/zh-TW/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - included in OpenClaw。Azure AI Speech 文字轉語音（MP3、原生 Ogg/Opus 語音訊息、PCM 電話語音）。

- **[bonjour](/zh-TW/plugins/reference/bonjour)** (`@openclaw/bonjour`) - included in OpenClaw。透過 Bonjour/mDNS 宣傳本機 OpenClaw 閘道。

- **[browser](/zh-TW/plugins/reference/browser)** (`@openclaw/browser-plugin`) - included in OpenClaw。新增代理可呼叫的工具。

- **[byteplus](/zh-TW/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - included in OpenClaw。為 OpenClaw 新增 BytePlus、BytePlus Plan 模型供應商支援。

- **[canvas](/zh-TW/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - included in OpenClaw。為已配對節點提供實驗性 Canvas 控制與 A2UI 算繪介面。

- **[clawrouter](/zh-TW/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - included in OpenClaw。為 OpenClaw 新增 ClawRouter 模型供應商支援。

- **[codex-supervisor](/zh-TW/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - included in OpenClaw。從 OpenClaw 監督 Codex app-server 工作階段。

- **[cohere](/zh-TW/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - included in OpenClaw；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 供應商外掛。

- **[comfy](/zh-TW/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - included in OpenClaw。為 OpenClaw 新增 ComfyUI 模型供應商支援。

- **[copilot-proxy](/zh-TW/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - included in OpenClaw。為 OpenClaw 新增 Copilot Proxy 模型供應商支援。

- **[deepgram](/zh-TW/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - included in OpenClaw。新增媒體理解供應商支援。新增即時轉錄供應商支援。

- **[document-extract](/zh-TW/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - included in OpenClaw。從本機文件附件擷取文字與備援頁面圖片。

- **[duckduckgo](/zh-TW/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - included in OpenClaw。新增網頁搜尋供應商支援。

- **[elevenlabs](/zh-TW/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - included in OpenClaw。新增媒體理解供應商支援。新增即時轉錄供應商支援。新增文字轉語音供應商支援。

- **[fal](/zh-TW/plugins/reference/fal)** (`@openclaw/fal-provider`) - included in OpenClaw。為 OpenClaw 新增 fal 模型供應商支援。

- **[file-transfer](/zh-TW/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - included in OpenClaw。透過專用節點命令在已配對節點上擷取、列出與寫入檔案。對最大 16 MB 的二進位檔使用 node.invoke 上的 base64，繞過 bash stdout 截斷。

- **[github-copilot](/zh-TW/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - included in OpenClaw。為 OpenClaw 新增 GitHub Copilot 模型供應商支援。

- **[google](/zh-TW/plugins/reference/google)** (`@openclaw/google-plugin`) - included in OpenClaw。為 OpenClaw 新增 Google、Google Gemini 命令列介面、Google Vertex 模型供應商支援。

- **[huggingface](/zh-TW/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - included in OpenClaw。為 OpenClaw 新增 Hugging Face 模型供應商支援。

- **[imessage](/zh-TW/plugins/reference/imessage)** (`@openclaw/imessage`) - included in OpenClaw。新增 iMessage 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[litellm](/zh-TW/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - included in OpenClaw。為 OpenClaw 新增 LiteLLM 模型供應商支援。

- **[llm-task](/zh-TW/plugins/reference/llm-task)** (`@openclaw/llm-task`) - included in OpenClaw。通用的僅 JSON LLM 工具，可從工作流程呼叫以執行結構化工作。

- **[lmstudio](/zh-TW/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - included in OpenClaw。為 OpenClaw 新增 LM Studio 模型供應商支援。

- **[memory-core](/zh-TW/plugins/reference/memory-core)** (`@openclaw/memory-core`) - included in OpenClaw。新增代理可呼叫的工具。

- **[memory-wiki](/zh-TW/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - included in OpenClaw。為 OpenClaw 提供持久化 wiki 編譯器與 Obsidian 友善知識庫。

- **[microsoft](/zh-TW/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - included in OpenClaw。新增文字轉語音供應商支援。

- **[microsoft-foundry](/zh-TW/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - included in OpenClaw。為 OpenClaw 新增 Microsoft Foundry 模型供應商支援。

- **[migrate-claude](/zh-TW/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - included in OpenClaw。將 Claude Code 與 Claude Desktop 指示、MCP 伺服器、技能與安全設定匯入 OpenClaw。

- **[migrate-hermes](/zh-TW/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - included in OpenClaw。將 Hermes 設定、記憶、技能與受支援憑證匯入 OpenClaw。

- **[minimax](/zh-TW/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - included in OpenClaw。為 OpenClaw 新增 MiniMax、MiniMax Portal 模型供應商支援。

- **[mistral](/zh-TW/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - included in OpenClaw。為 OpenClaw 新增 Mistral 模型供應商支援。

- **[novita](/zh-TW/plugins/reference/novita)** (`@openclaw/novita-provider`) - included in OpenClaw。為 OpenClaw 新增 Novita、Novita AI、Novitaai 模型供應商支援。

- **[nvidia](/zh-TW/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - included in OpenClaw。為 OpenClaw 新增 NVIDIA 模型供應商支援。

- **[oc-path](/zh-TW/plugins/reference/oc-path)** (`@openclaw/oc-path`) - included in OpenClaw。新增 openclaw path 命令列介面，用於 oc:// workspace 檔案定址。

- **[ollama](/zh-TW/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - included in OpenClaw。為 OpenClaw 新增 Ollama、Ollama Cloud 模型供應商支援。

- **[open-prose](/zh-TW/plugins/reference/open-prose)** (`@openclaw/open-prose`) - included in OpenClaw。OpenProse VM 技能包，含有 /prose 斜線命令。

- **[openai](/zh-TW/plugins/reference/openai)** (`@openclaw/openai-provider`) - included in OpenClaw。為 OpenClaw 新增 OpenAI 模型供應商支援。

- **[opencode](/zh-TW/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - included in OpenClaw。為 OpenClaw 新增 OpenCode 模型供應商支援。

- **[opencode-go](/zh-TW/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - included in OpenClaw。為 OpenClaw 新增 OpenCode Go 模型供應商支援。

- **[openrouter](/zh-TW/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - included in OpenClaw。為 OpenClaw 新增 OpenRouter 模型供應商支援。

- **[policy](/zh-TW/plugins/reference/policy)** (`@openclaw/policy`) - included in OpenClaw。新增以政策為基礎的 doctor 檢查，用於 workspace 符合性。

- **[runway](/zh-TW/plugins/reference/runway)** (`@openclaw/runway-provider`) - included in OpenClaw。新增影片生成供應商支援。

- **[senseaudio](/zh-TW/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - included in OpenClaw。新增媒體理解供應商支援。

- **[sglang](/zh-TW/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - included in OpenClaw。為 OpenClaw 新增 SGLang 模型供應商支援。

- **[synthetic](/zh-TW/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - included in OpenClaw。為 OpenClaw 新增 Synthetic 模型供應商支援。

- **[telegram](/zh-TW/plugins/reference/telegram)** (`@openclaw/telegram`) - included in OpenClaw。新增 Telegram 通道介面，用於傳送與接收 OpenClaw 訊息。

- **[together](/zh-TW/plugins/reference/together)** (`@openclaw/together-provider`) - included in OpenClaw。為 OpenClaw 新增 Together 模型供應商支援。

- **[tts-local-cli](/zh-TW/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - included in OpenClaw。新增文字轉語音供應商支援。

- **[vllm](/zh-TW/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - included in OpenClaw。為 OpenClaw 新增 vLLM 模型供應商支援。

- **[volcengine](/zh-TW/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - included in OpenClaw。為 OpenClaw 新增 Volcengine、Volcengine Plan 模型供應商支援。

- **[voyage](/zh-TW/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - included in OpenClaw。新增記憶嵌入供應商支援。

- **[vydra](/zh-TW/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - included in OpenClaw。為 OpenClaw 新增 Vydra 模型供應商支援。

- **[web-readability](/zh-TW/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - included in OpenClaw。從本機 HTML 網頁擷取回應中擷取可讀文章內容。

- **[webhooks](/zh-TW/plugins/reference/webhooks)** (`@openclaw/webhooks`) - included in OpenClaw。已驗證的傳入網路鉤子，將外部自動化繫結至 OpenClaw TaskFlows。

- **[workboard](/zh-TW/plugins/reference/workboard)** (`@openclaw/workboard`) - included in OpenClaw。供代理所擁有議題與工作階段使用的儀表板工作板。

- **[xai](/zh-TW/plugins/reference/xai)** (`@openclaw/xai-plugin`) - included in OpenClaw。為 OpenClaw 新增 xAI 模型供應商支援。

- **[xiaomi](/zh-TW/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - included in OpenClaw。為 OpenClaw 新增 Xiaomi、Xiaomi Token Plan 模型供應商支援。

## 官方外部套件

68 個外掛

- **[acpx](/zh-TW/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 執行階段後端，具備外掛擁有的工作階段與傳輸管理。

- **[amazon-bedrock](/zh-TW/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 供應商外掛，具備模型探索、嵌入與 guardrail 支援。

- **[amazon-bedrock-mantle](/zh-TW/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle 提供者外掛，用於 OpenAI 相容模型路由。

- **[anthropic-vertex](/zh-TW/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex 提供者外掛，用於 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-TW/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。為 OpenClaw 新增 Arcee 模型提供者支援。

- **[brave](/zh-TW/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。OpenClaw Brave Search 提供者外掛，用於網路搜尋。

- **[cerebras](/zh-TW/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。為 OpenClaw 新增 Cerebras 模型提供者支援。

- **[chutes](/zh-TW/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。為 OpenClaw 新增 Chutes 模型提供者支援。

- **[clickclack](/zh-TW/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。新增 ClickClack 通道介面，用於傳送和接收 OpenClaw 訊息。

- **[cloudflare-ai-gateway](/zh-TW/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。為 OpenClaw 新增 Cloudflare AI Gateway 模型提供者支援。

- **[codex](/zh-TW/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。OpenClaw Codex 應用程式伺服器測試框架與模型提供者外掛，包含由 Codex 管理的 GPT 目錄。

- **[copilot](/zh-TW/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。註冊 GitHub Copilot 代理執行階段。

- **[deepinfra](/zh-TW/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。為 OpenClaw 新增 DeepInfra 模型提供者支援。

- **[deepseek](/zh-TW/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。為 OpenClaw 新增 DeepSeek 模型提供者支援。

- **[diagnostics-otel](/zh-TW/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。OpenClaw 診斷 OpenTelemetry 匯出器，用於指標、追蹤和記錄。

- **[diagnostics-prometheus](/zh-TW/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。OpenClaw 診斷 Prometheus 匯出器，用於執行階段指標。

- **[diffs](/zh-TW/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。OpenClaw 唯讀差異檢視器外掛和代理用檔案算繪器。

- **[diffs-language-pack](/zh-TW/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。為預設差異檢視器集合以外的語言新增語法醒目提示。

- **[discord](/zh-TW/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。OpenClaw Discord 通道外掛，用於頻道、私訊、命令和應用程式事件。

- **[exa](/zh-TW/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。新增網路搜尋提供者支援。

- **[feishu](/zh-TW/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。OpenClaw Feishu/Lark 通道外掛，用於聊天和工作場所工具（由社群 @m1heng 維護）。

- **[firecrawl](/zh-TW/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。新增代理可呼叫工具。新增網頁擷取提供者支援。新增網路搜尋提供者支援。

- **[fireworks](/zh-TW/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。為 OpenClaw 新增 Fireworks 模型提供者支援。

- **[gmi](/zh-TW/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供者外掛。

- **[google-meet](/zh-TW/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 參與者外掛，用於透過 Chrome 或 Twilio 傳輸加入通話。

- **[googlechat](/zh-TW/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。OpenClaw Google Chat 通道外掛，用於聊天室和直接訊息。

- **[gradium](/zh-TW/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。新增文字轉語音提供者支援。

- **[groq](/zh-TW/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。為 OpenClaw 新增 Groq 模型提供者支援。

- **[inworld](/zh-TW/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 串流文字轉語音（MP3、OGG_OPUS、PCM 電話語音）。

- **[irc](/zh-TW/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。新增 IRC 通道介面，用於傳送和接收 OpenClaw 訊息。

- **[kilocode](/zh-TW/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。為 OpenClaw 新增 Kilocode 模型提供者支援。

- **[kimi](/zh-TW/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。為 OpenClaw 新增 Kimi、Kimi Coding 模型提供者支援。

- **[line](/zh-TW/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。OpenClaw LINE 通道外掛，用於 LINE Bot API 聊天。

- **[llama-cpp](/zh-TW/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。透過 node-llama-cpp 提供本機 GGUF 嵌入。

- **[lobster](/zh-TW/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。Lobster 工作流程工具外掛，用於型別化管線和可恢復核准。

- **[matrix](/zh-TW/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。OpenClaw Matrix 通道外掛，用於聊天室和直接訊息。

- **[mattermost](/zh-TW/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。新增 Mattermost 通道介面，用於傳送和接收 OpenClaw 訊息。

- **[memory-lancedb](/zh-TW/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。OpenClaw 由 LanceDB 支援的長期記憶外掛，具備自動回想、自動擷取和向量搜尋。

- **[moonshot](/zh-TW/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。為 OpenClaw 新增 Moonshot 模型提供者支援。

- **[msteams](/zh-TW/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。OpenClaw Microsoft Teams 通道外掛，用於 Bot 對話。

- **[nextcloud-talk](/zh-TW/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。OpenClaw Nextcloud Talk 通道外掛，用於對話。

- **[nostr](/zh-TW/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。OpenClaw Nostr 通道外掛，用於 NIP-04 加密直接訊息。

- **[openshell](/zh-TW/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。OpenClaw 沙箱後端，用於 NVIDIA OpenShell 命令列介面，具備鏡像本機工作區和 SSH 命令執行。

- **[parallel](/zh-TW/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。新增網路搜尋提供者支援。

- **[perplexity](/zh-TW/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。新增網路搜尋提供者支援。

- **[pixverse](/zh-TW/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 影片生成提供者外掛。

- **[qianfan](/zh-TW/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。為 OpenClaw 新增 Qianfan 模型提供者支援。

- **[qqbot](/zh-TW/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。OpenClaw QQ Bot 通道外掛，用於群組和直接訊息工作流程。

- **[qwen](/zh-TW/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。為 OpenClaw 新增 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI 模型提供者支援。

- **[raft](/zh-TW/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。OpenClaw Raft 通道外掛，用於安全的命令列介面喚醒橋接。

- **[searxng](/zh-TW/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。新增網路搜尋提供者支援。

- **[signal](/zh-TW/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。新增 Signal 通道介面，用於傳送和接收 OpenClaw 訊息。

- **[slack](/zh-TW/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。OpenClaw Slack 通道外掛，用於頻道、私訊、命令和應用程式事件。

- **[sms](/zh-TW/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。Twilio SMS 通道外掛，用於 OpenClaw 文字訊息。

- **[stepfun](/zh-TW/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。為 OpenClaw 新增 StepFun、StepFun Plan 模型提供者支援。

- **[synology-chat](/zh-TW/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。Synology Chat 通道外掛，用於 OpenClaw 頻道和直接訊息。

- **[tavily](/zh-TW/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。新增代理可呼叫工具。新增網路搜尋提供者支援。

- **[tencent](/zh-TW/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。為 OpenClaw 新增 Tencent TokenHub 和 TokenPlan 模型提供者支援。

- **[tlon](/zh-TW/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。OpenClaw Tlon/Urbit 通道外掛，用於聊天工作流程。

- **[tokenjuice](/zh-TW/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 tokenjuice reducer 壓縮 exec 和 bash 工具結果。

- **[twitch](/zh-TW/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。OpenClaw Twitch 通道外掛，用於聊天和審核工作流程。

- **[venice](/zh-TW/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。為 OpenClaw 新增 Venice 模型提供者支援。

- **[vercel-ai-gateway](/zh-TW/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。為 OpenClaw 新增 Vercel AI Gateway 模型提供者支援。

- **[voice-call](/zh-TW/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。OpenClaw 語音通話外掛，用於 Twilio、Telnyx 和 Plivo 電話通話。

- **[whatsapp](/zh-TW/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。OpenClaw WhatsApp 通道外掛，用於 WhatsApp Web 聊天。

- **[zai](/zh-TW/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。為 OpenClaw 新增 Z.AI 模型提供者支援。

- **[zalo](/zh-TW/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。OpenClaw Zalo 通道外掛，用於 Bot 和網路鉤子聊天。

- **[zalouser](/zh-TW/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。OpenClaw Zalo Personal Account 外掛，透過原生 zca-js 整合。

## 僅限原始碼簽出

3 個外掛

- **[qa-channel](/zh-TW/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 僅限原始碼簽出。新增 QA Channel 介面，用於傳送和接收 OpenClaw 訊息。

- **[qa-lab](/zh-TW/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 僅限原始碼簽出。OpenClaw QA lab 外掛，具備私人偵錯工具介面和情境執行器。

- **[qa-matrix](/zh-TW/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 僅限原始碼簽出。Matrix 品質保證傳輸執行器與基底。

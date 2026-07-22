---
read_when:
    - 你正在決定外掛是隨核心 npm 套件一併提供，還是獨立安裝
    - 你正在更新內建外掛套件的中繼資料或發行自動化流程
    - 你需要正式的內部與外部外掛清單
summary: 隨核心提供、對外發布或僅保留於原始碼中的 OpenClaw 外掛產生清單
title: 外掛清單
x-i18n:
    generated_at: "2026-07-21T22:42:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d835087afbe9d75f883c3db9739f914bedab5ac87a9c20b69c248304b61c594
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 外掛清單

本頁面由 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 套件的 `files` 排除項目產生。請使用以下命令重新產生：

```bash
pnpm plugins:inventory:gen
```

## 定義

- **核心 npm 套件：**內建於 `openclaw` npm 套件中，無須另行安裝外掛即可使用。
- **官方外部套件：**由 OpenClaw 維護、未納入核心 npm 套件的外掛；保留於此官方清單中，並可視需要透過 ClawHub 和／或 npm 安裝。
- **僅限原始碼簽出：**僅存在於儲存庫本機、未納入已發布 npm 成品，也未宣傳為可安裝套件的外掛。

原始碼簽出與 npm 安裝不同：在 `pnpm install` 之後，隨附
外掛會從 `extensions/<id>` 載入，因此可使用本機編輯內容及套件本機工作區
相依套件。

## 安裝外掛

請依各項目中的安裝方式判斷是否需要安裝。標示
`included in OpenClaw` 的外掛已存在於核心套件中。
官方外部套件需安裝一次，之後重新啟動閘道。

例如，Discord 是官方外部套件：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在啟動切換期間，一般的裸套件規格仍會從 npm 安裝。
需要明確指定來源時，請使用 `clawhub:@openclaw/discord` 或
`npm:@openclaw/discord`。安裝後，請依照外掛的設定文件（例如
[Discord](/zh-TW/channels/discord)）新增認證資訊與頻道設定。更新、解除安裝及發布
命令請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。

每個項目均列出套件、發布方式及說明。

## 核心 npm 套件

70 個外掛

- **[admin-http-rpc](/zh-TW/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - 已包含於 OpenClaw。OpenClaw 管理 HTTP RPC 端點。

- **[alibaba](/zh-TW/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - 已包含於 OpenClaw。新增影片生成供應商支援。

- **[anthropic](/zh-TW/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - 已包含於 OpenClaw。Anthropic 模型、Claude 命令列介面及原生 Claude 工作階段目錄。

- **[azure-speech](/zh-TW/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - 已包含於 OpenClaw。Azure AI Speech 文字轉語音（MP3、原生 Ogg/Opus 語音留言、PCM 電話音訊）。

- **[bonjour](/zh-TW/plugins/reference/bonjour)** (`@openclaw/bonjour`) - 已包含於 OpenClaw。透過 Bonjour/mDNS 公告本機 OpenClaw 閘道。

- **[browser](/zh-TW/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 已包含於 OpenClaw。新增代理程式可呼叫的工具。

- **[byteplus](/zh-TW/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 BytePlus、BytePlus Plan 模型供應商支援。

- **[canvas](/zh-TW/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 已包含於 OpenClaw。供已配對節點使用的實驗性 Canvas 控制與 A2UI 算繪介面。

- **[clawrouter](/zh-TW/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - 已包含於 OpenClaw。為 OpenClaw 新增 ClawRouter 模型供應商支援。

- **[cohere](/zh-TW/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 已包含於 OpenClaw；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 供應商外掛。

- **[comfy](/zh-TW/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 ComfyUI 模型供應商支援。

- **[copilot-proxy](/zh-TW/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 已包含於 OpenClaw。為 OpenClaw 新增 Copilot Proxy 模型供應商支援。

- **[crabbox](/zh-TW/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - 已包含於 OpenClaw。由 Crabbox 命令列介面支援的雲端工作者供應商。

- **[cua-computer](/plugins/reference/cua-computer)** (`@openclaw/cua-computer`) - 已包含於 OpenClaw。適用於 Windows 與 Linux 節點主機的實驗性 cua-driver 電腦控制功能。

- **[deepgram](/zh-TW/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 已包含於 OpenClaw。新增媒體理解供應商支援。新增即時轉錄供應商支援。

- **[document-extract](/zh-TW/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 已包含於 OpenClaw。從本機文件附件擷取文字，並在需要時改用頁面影像。

- **[duckduckgo](/zh-TW/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 已包含於 OpenClaw。新增網頁搜尋供應商支援。

- **[elevenlabs](/zh-TW/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - 已包含於 OpenClaw。新增媒體理解供應商支援。新增即時轉錄供應商支援。新增文字轉語音供應商支援。

- **[fal](/zh-TW/plugins/reference/fal)** (`@openclaw/fal-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 fal 模型供應商支援。

- **[file-transfer](/zh-TW/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - 已包含於 OpenClaw。透過專用節點命令，在已配對節點上擷取、列出及寫入檔案。對於最大 16 MB 的二進位檔，透過 node.invoke 使用 base64，以避開 bash 標準輸出截斷限制。

- **[github-copilot](/zh-TW/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 GitHub Copilot 模型供應商支援。

- **[google](/zh-TW/plugins/reference/google)** (`@openclaw/google-plugin`) - 已包含於 OpenClaw。為 OpenClaw 新增 Google、Google Gemini 命令列介面及 Google Vertex 模型供應商支援。

- **[huggingface](/zh-TW/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 Hugging Face 模型供應商支援。

- **[imessage](/zh-TW/plugins/reference/imessage)** (`@openclaw/imessage`) - 已包含於 OpenClaw。新增 iMessage 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[linux-canvas](/zh-TW/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - 已包含於 OpenClaw。OpenClaw Linux 桌面應用程式的 Canvas 算繪橋接器。

- **[linux-node](/zh-TW/plugins/reference/linux-node)** (`@openclaw/linux-node`) - 已包含於 OpenClaw。為 Linux 節點主機提供桌面通知、相機擷取及位置資訊。

- **[litellm](/zh-TW/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 LiteLLM 模型供應商支援。

- **[llm-task](/zh-TW/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 已包含於 OpenClaw。可由工作流程呼叫、用於結構化任務且僅使用 JSON 的通用 LLM 工具。

- **[lmstudio](/zh-TW/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 LM Studio 模型供應商支援。

- **[logbook](/zh-TW/plugins/reference/logbook)** (`@openclaw/logbook`) - 已包含於 OpenClaw。自動工作日誌：定期擷取已配對節點的螢幕快照，並將其轉換為可供檢閱的每日時間軸。

- **[memory-core](/zh-TW/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 已包含於 OpenClaw。新增代理程式可呼叫的工具。

- **[memory-wiki](/zh-TW/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 已包含於 OpenClaw。適用於 OpenClaw 的持久化 wiki 編譯器及 Obsidian 友善知識庫。

- **[meta](/zh-TW/plugins/reference/meta)** (`@openclaw/meta-provider`) - 已包含於 OpenClaw；npm；ClawHub：`clawhub:@openclaw/meta-provider`。為 OpenClaw 新增 Meta 模型供應商支援。

- **[microsoft](/zh-TW/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 已包含於 OpenClaw。新增文字轉語音供應商支援。

- **[microsoft-foundry](/zh-TW/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 已包含於 OpenClaw。為 OpenClaw 新增 Microsoft Foundry 模型供應商支援。

- **[migrate-claude](/zh-TW/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 已包含於 OpenClaw。將 Claude Code 與 Claude Desktop 的指示、MCP 伺服器、技能及安全設定匯入 OpenClaw。

- **[migrate-hermes](/zh-TW/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 已包含於 OpenClaw。將 Hermes 設定、記憶、技能及支援的認證資訊匯入 OpenClaw。

- **[minimax](/zh-TW/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 MiniMax、MiniMax Portal 模型供應商支援。

- **[mistral](/zh-TW/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 Mistral 模型供應商支援。

- **[novita](/zh-TW/plugins/reference/novita)** (`@openclaw/novita-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 Novita、Novita AI、Novitaai 模型供應商支援。

- **[nvidia](/zh-TW/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 NVIDIA 模型供應商支援。

- **[oc-path](/zh-TW/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 已包含於 OpenClaw。新增 openclaw path 命令列介面，用於透過 oc:// 定址工作區檔案。

- **[ollama](/zh-TW/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 Ollama、Ollama Cloud 模型供應商支援。

- **[onepassword](/zh-TW/plugins/reference/onepassword)** (`@openclaw/onepassword`) - 已包含於 OpenClaw。經過策劃的 1Password 機密代理服務，具備核准政策與 SQLite 稽核記錄。

- **[open-prose](/zh-TW/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 已包含於 OpenClaw。OpenProse VM 技能套件，提供 /prose 斜線命令。

- **[openai](/zh-TW/plugins/reference/openai)** (`@openclaw/openai-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 OpenAI 模型供應商支援。

- **[opencode](/zh-TW/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 OpenCode 模型供應商支援。

- **[opencode-go](/zh-TW/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 OpenCode Go 模型供應商支援。

- **[openrouter](/zh-TW/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 OpenRouter 模型供應商支援。

- **[policy](/zh-TW/plugins/reference/policy)** (`@openclaw/policy`) - 已包含於 OpenClaw。新增以政策為依據的 doctor 檢查，以確認工作區符合規範。

- **[reef](/zh-TW/plugins/reference/reef)** (`@openclaw/reef`) - 已包含於 OpenClaw。受保護的端對端加密 claw 頻道。

- **[runway](/zh-TW/plugins/reference/runway)** (`@openclaw/runway-provider`) - 已包含於 OpenClaw。新增影片生成供應商支援。

- **[senseaudio](/zh-TW/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 已包含於 OpenClaw。新增媒體理解供應商支援。

- **[sglang](/zh-TW/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 SGLang 模型供應商支援。

- **[synthetic](/zh-TW/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 Synthetic 模型供應商支援。

- **[teams-meetings](/zh-TW/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - 已包含於 OpenClaw。以 Chrome 瀏覽器訪客身分加入 Microsoft Teams 會議。

- **[telegram](/zh-TW/plugins/reference/telegram)** (`@openclaw/telegram`) - 已包含於 OpenClaw。新增 Telegram 頻道介面，用於傳送及接收 OpenClaw 訊息。

- **[together](/zh-TW/plugins/reference/together)** (`@openclaw/together-provider`) - 已包含於 OpenClaw。為 OpenClaw 新增 Together 模型供應商支援。

- **[tts-local-cli](/zh-TW/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 已包含於 OpenClaw。新增文字轉語音供應商支援。

- **[vault](/zh-TW/plugins/reference/vault)** (`@openclaw/vault`) - 隨附於 OpenClaw。HashiCorp Vault SecretRef 提供者整合。

- **[vllm](/zh-TW/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 隨附於 OpenClaw。為 OpenClaw 新增 vLLM 模型提供者支援。

- **[volcengine](/zh-TW/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 隨附於 OpenClaw。為 OpenClaw 新增 Volcengine、Volcengine Plan 模型提供者支援。

- **[voyage](/zh-TW/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 隨附於 OpenClaw。新增記憶嵌入提供者支援。

- **[vydra](/zh-TW/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 隨附於 OpenClaw。為 OpenClaw 新增 Vydra 模型提供者支援。

- **[web-readability](/zh-TW/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 隨附於 OpenClaw。從本機 HTML 網頁擷取回應中提取易讀的文章內容。

- **[webhooks](/zh-TW/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 隨附於 OpenClaw。經過驗證的傳入網路鉤子，可將外部自動化繫結至 OpenClaw TaskFlow。

- **[workboard](/zh-TW/plugins/reference/workboard)** (`@openclaw/workboard`) - 隨附於 OpenClaw。用於代理程式所擁有議題與工作階段的儀表板工作看板。

- **[xai](/zh-TW/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 隨附於 OpenClaw。為 OpenClaw 新增 xAI 模型提供者支援。

- **[xiaomi](/zh-TW/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 隨附於 OpenClaw。為 OpenClaw 新增 Xiaomi、Xiaomi Token Plan 模型提供者支援。

- **[zoom-meetings](/zh-TW/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - 隨附於 OpenClaw。以 Chrome 瀏覽器訪客身分加入 Zoom 會議。

## 官方外部套件

72 個外掛

- **[acpx](/zh-TW/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 執行階段後端，由外掛管理工作階段與傳輸。

- **[amazon-bedrock](/zh-TW/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 提供者外掛，支援模型探索、嵌入與防護機制。

- **[amazon-bedrock-mantle](/zh-TW/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle 提供者外掛，用於與 OpenAI 相容的模型路由。

- **[anthropic-vertex](/zh-TW/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex 提供者外掛，用於 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-TW/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。為 OpenClaw 新增 Arcee 模型提供者支援。

- **[baseten](/zh-TW/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm；ClawHub：`clawhub:@openclaw/baseten-provider`。OpenClaw Baseten 提供者外掛。

- **[brave](/zh-TW/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。用於網頁搜尋的 OpenClaw Brave Search 提供者外掛。

- **[cerebras](/zh-TW/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。為 OpenClaw 新增 Cerebras 模型提供者支援。

- **[chutes](/zh-TW/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。為 OpenClaw 新增 Chutes 模型提供者支援。

- **[clickclack](/zh-TW/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。新增 ClickClack 頻道介面，以傳送及接收 OpenClaw 訊息。

- **[cloudflare-ai-gateway](/zh-TW/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。為 OpenClaw 新增 Cloudflare AI Gateway 模型提供者支援。

- **[codex](/zh-TW/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。Codex 應用程式伺服器測試框架與原生工作階段目錄。

- **[copilot](/zh-TW/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。註冊 GitHub Copilot 代理程式執行階段。

- **[deepinfra](/zh-TW/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。為 OpenClaw 新增 DeepInfra 模型提供者支援。

- **[deepseek](/zh-TW/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。為 OpenClaw 新增 DeepSeek 模型提供者支援。

- **[diagnostics-otel](/zh-TW/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。用於指標、追蹤與日誌的 OpenClaw 診斷 OpenTelemetry 匯出器。

- **[diagnostics-prometheus](/zh-TW/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。用於執行階段指標的 OpenClaw 診斷 Prometheus 匯出器。

- **[diffs](/zh-TW/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。供代理程式使用的 OpenClaw 唯讀差異檢視器外掛與檔案轉譯器。

- **[diffs-language-pack](/zh-TW/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。為預設差異檢視器集合以外的語言新增語法醒目提示。

- **[discord](/zh-TW/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。用於頻道、私訊、命令與應用程式事件的 OpenClaw Discord 頻道外掛。

- **[exa](/zh-TW/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。新增網頁搜尋提供者支援。

- **[featherless](/zh-TW/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm；ClawHub：`clawhub:@openclaw/featherless-provider`。OpenClaw Featherless AI 提供者外掛。

- **[feishu](/zh-TW/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。用於聊天與工作場所工具的 OpenClaw Feishu/Lark 頻道外掛（由 @m1heng 社群維護）。

- **[firecrawl](/zh-TW/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。新增可由代理程式呼叫的工具。新增網頁擷取提供者支援。新增網頁搜尋提供者支援。

- **[fireworks](/zh-TW/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。為 OpenClaw 新增 Fireworks 模型提供者支援。

- **[gmi](/zh-TW/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供者外掛。

- **[google-meet](/zh-TW/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 參與者外掛，用於透過 Chrome 或 Twilio 傳輸加入通話。

- **[googlechat](/zh-TW/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。用於聊天室與直接訊息的 OpenClaw Google Chat 頻道外掛。

- **[gradium](/zh-TW/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。新增文字轉語音提供者支援。

- **[groq](/zh-TW/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。為 OpenClaw 新增 Groq 模型提供者支援。

- **[inworld](/zh-TW/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 串流文字轉語音（MP3、OGG_OPUS、PCM 電話音訊）。

- **[irc](/zh-TW/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。新增 IRC 頻道介面，以傳送及接收 OpenClaw 訊息。

- **[kilocode](/zh-TW/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。為 OpenClaw 新增 Kilocode 模型提供者支援。

- **[kimi](/zh-TW/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。為 OpenClaw 新增 Kimi、Kimi Coding 模型提供者支援。

- **[line](/zh-TW/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。用於 LINE Bot API 聊天的 OpenClaw LINE 頻道外掛。

- **[llama-cpp](/zh-TW/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。透過 node-llama-cpp 執行本機 GGUF 文字推論與嵌入。

- **[lobster](/zh-TW/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。用於具型別流水線與可繼續核准作業的 Lobster 工作流程工具外掛。

- **[longcat](/zh-TW/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm；ClawHub：`clawhub:@openclaw/longcat-provider`。OpenClaw LongCat 提供者外掛。

- **[matrix](/zh-TW/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。用於聊天室與直接訊息的 OpenClaw Matrix 頻道外掛。

- **[mattermost](/zh-TW/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。新增 Mattermost 頻道介面，以傳送及接收 OpenClaw 訊息。

- **[memory-lancedb](/zh-TW/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。以 LanceDB 為後端的 OpenClaw 長期記憶外掛，具備自動回想、自動擷取與向量搜尋功能。

- **[moonshot](/zh-TW/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。為 OpenClaw 新增 Moonshot 模型提供者支援。

- **[msteams](/zh-TW/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。用於機器人對話的 OpenClaw Microsoft Teams 頻道外掛。

- **[mxc](/zh-TW/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm；ClawHub。透過 MXC 執行作業系統層級的沙箱工具：在 Windows ProcessContainer 中，使用已設定的 MXC 原則檔案執行命令。

- **[nextcloud-talk](/zh-TW/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。用於對話的 OpenClaw Nextcloud Talk 頻道外掛。

- **[nostr](/zh-TW/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。用於 NIP-04 加密直接訊息的 OpenClaw Nostr 頻道外掛。

- **[openshell](/zh-TW/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。用於 NVIDIA OpenShell 命令列介面的 OpenClaw 沙箱後端，具備鏡像本機工作區與 SSH 命令執行功能。

- **[parallel](/zh-TW/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。新增網頁搜尋提供者支援。

- **[perplexity](/zh-TW/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。新增網頁搜尋提供者支援。

- **[pixverse](/zh-TW/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 影片生成提供者外掛。

- **[qianfan](/zh-TW/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。為 OpenClaw 新增 Qianfan 模型提供者支援。

- **[qqbot](/zh-TW/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。用於群組與直接訊息工作流程的 OpenClaw QQ Bot 頻道外掛。

- **[qwen](/zh-TW/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。為 OpenClaw 新增 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Token Plan、Bailian Token Plan 模型提供者支援。

- **[raft](/zh-TW/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。用於安全命令列介面喚醒橋接的 OpenClaw Raft 頻道外掛。

- **[searxng](/zh-TW/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。新增網頁搜尋提供者支援。

- **[signal](/zh-TW/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。新增 Signal 頻道介面，以傳送及接收 OpenClaw 訊息。

- **[slack](/zh-TW/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。用於頻道、私訊、命令與應用程式事件的 OpenClaw Slack 頻道外掛。

- **[sms](/zh-TW/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。用於 OpenClaw 文字訊息的 Twilio SMS 頻道外掛。

- **[stepfun](/zh-TW/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。為 OpenClaw 新增 StepFun、StepFun Plan 模型供應商支援。

- **[synology-chat](/zh-TW/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。用於 OpenClaw 頻道和私人訊息的 Synology Chat 頻道外掛。

- **[tavily](/zh-TW/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。新增可由代理程式呼叫的工具。新增網頁搜尋供應商支援。

- **[tencent](/zh-TW/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。為 OpenClaw 新增 Tencent TokenHub、Tencent Tokenplan 模型供應商支援。

- **[tlon](/zh-TW/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。用於聊天工作流程的 OpenClaw Tlon/Urbit 頻道外掛。

- **[tokenjuice](/zh-TW/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 Tokenjuice 縮減器壓縮 exec 和 bash 工具結果。

- **[twitch](/zh-TW/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。用於聊天和管理工作流程的 OpenClaw Twitch 頻道外掛。

- **[venice](/zh-TW/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。為 OpenClaw 新增 Venice 模型供應商支援。

- **[vercel-ai-gateway](/zh-TW/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。為 OpenClaw 新增 Vercel AI Gateway 模型供應商支援。

- **[voice-call](/zh-TW/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。用於 Twilio、Telnyx 和 Plivo 電話通話的 OpenClaw 語音通話外掛。

- **[whatsapp](/zh-TW/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。用於 WhatsApp Web 聊天的 OpenClaw WhatsApp 頻道外掛。

- **[zai](/zh-TW/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。為 OpenClaw 新增 Z.AI 模型供應商支援。

- **[zalo](/zh-TW/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。用於機器人和網路鉤子聊天的 OpenClaw Zalo 頻道外掛。

- **[zalouser](/zh-TW/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。透過原生 zca-js 整合的 OpenClaw Zalo Personal 帳號外掛。

## 僅限原始碼簽出

2 個外掛

- **[qa-channel](/zh-TW/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 僅限原始碼簽出。新增用於傳送及接收 OpenClaw 訊息的 QA Channel 介面。

- **[qa-lab](/zh-TW/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 僅限原始碼簽出。具有私有偵錯工具 UI 和情境執行器的 OpenClaw QA 實驗室外掛。

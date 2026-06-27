---
read_when:
    - 你正在决定一个插件是随核心 npm 包一起发布，还是单独安装
    - 你正在更新内置插件包元数据或发布自动化
    - 你需要规范的内部与外部插件列表
summary: OpenClaw 插件清单，涵盖随核心一起发布、外部发布或仅以源码形式保留的插件
title: 插件清单
x-i18n:
    generated_at: "2026-06-27T02:44:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 插件清单

此页面由 `extensions/*/package.json`、`openclaw.plugin.json`
和根 npm 包的 `files` 排除项生成。使用以下命令重新生成：

```bash
pnpm plugins:inventory:gen
```

## 定义

- **核心 npm 包：** 内置于 `openclaw` npm 包中，无需单独安装插件即可使用。
- **官方外部包：** 由 OpenClaw 维护的插件，未包含在核心 npm 包中，保留在此官方清单中，并按需通过 ClawHub 和/或 npm 安装。
- **仅源码检出：** 仓库本地插件，未包含在已发布的 npm 构件中，也不会作为可安装包宣传。

源码检出与 npm 安装不同：执行 `pnpm install` 后，内置
插件会从 `extensions/<id>` 加载，因此本地编辑和包本地工作区
依赖都可用。

## 安装插件

使用每个条目中的安装路径来判断是否需要安装。标注
`included in OpenClaw` 的插件已存在于核心包中。
官方外部包需要安装一次，然后重启 Gateway 网关。

例如，Discord 是一个官方外部包：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在发布切换期间，普通的裸包规范仍会从 npm 安装。
当你需要显式来源时，请使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。
安装后，按照该插件的设置文档（例如
[Discord](/zh-CN/channels/discord)）添加凭证和频道配置。有关更新、卸载和发布
命令，请参阅[管理插件](/zh-CN/plugins/manage-plugins)。

每个条目列出包、分发路径和描述。

## 核心 npm 包

59 个插件

- **[admin-http-rpc](/zh-CN/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - 包含在 OpenClaw 中。OpenClaw 管理 HTTP RPC 端点。

- **[alibaba](/zh-CN/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - 包含在 OpenClaw 中。添加视频生成提供商支持。

- **[anthropic](/zh-CN/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Anthropic 模型提供商支持。

- **[azure-speech](/zh-CN/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - 包含在 OpenClaw 中。Azure AI Speech 文本转语音（MP3、原生 Ogg/Opus 语音消息、PCM 电话音频）。

- **[bonjour](/zh-CN/plugins/reference/bonjour)** (`@openclaw/bonjour`) - 包含在 OpenClaw 中。通过 Bonjour/mDNS 广播本地 OpenClaw Gateway 网关。

- **[browser](/zh-CN/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 包含在 OpenClaw 中。添加智能体可调用工具。

- **[byteplus](/zh-CN/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 BytePlus、BytePlus Plan 模型提供商支持。

- **[canvas](/zh-CN/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 包含在 OpenClaw 中。为已配对节点提供实验性 Canvas 控制和 A2UI 渲染界面。

- **[codex-supervisor](/zh-CN/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - 包含在 OpenClaw 中。从 OpenClaw 监督 Codex app-server 会话。

- **[cohere](/zh-CN/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 包含在 OpenClaw 中；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 提供商插件。

- **[comfy](/zh-CN/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 ComfyUI 模型提供商支持。

- **[copilot-proxy](/zh-CN/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Copilot Proxy 模型提供商支持。

- **[deepgram](/zh-CN/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 包含在 OpenClaw 中。添加媒体理解提供商支持。添加实时转录提供商支持。

- **[document-extract](/zh-CN/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 包含在 OpenClaw 中。从本地文档附件中提取文本和备用页面图像。

- **[duckduckgo](/zh-CN/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 包含在 OpenClaw 中。添加 Web 搜索提供商支持。

- **[elevenlabs](/zh-CN/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - 包含在 OpenClaw 中。添加媒体理解提供商支持。添加实时转录提供商支持。添加文本转语音提供商支持。

- **[fal](/zh-CN/plugins/reference/fal)** (`@openclaw/fal-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 fal 模型提供商支持。

- **[file-transfer](/zh-CN/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - 包含在 OpenClaw 中。通过专用节点命令在已配对节点上获取、列出和写入文件。通过在 node.invoke 上使用 base64 处理最大 16 MB 的二进制文件，绕过 bash stdout 截断。

- **[github-copilot](/zh-CN/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 GitHub Copilot 模型提供商支持。

- **[google](/zh-CN/plugins/reference/google)** (`@openclaw/google-plugin`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Google、Google Gemini CLI、Google Vertex 模型提供商支持。

- **[huggingface](/zh-CN/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Hugging Face 模型提供商支持。

- **[imessage](/zh-CN/plugins/reference/imessage)** (`@openclaw/imessage`) - 包含在 OpenClaw 中。添加用于发送和接收 OpenClaw 消息的 iMessage 渠道界面。

- **[litellm](/zh-CN/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 LiteLLM 模型提供商支持。

- **[llm-task](/zh-CN/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 包含在 OpenClaw 中。用于结构化任务的通用纯 JSON LLM 工具，可从工作流中调用。

- **[lmstudio](/zh-CN/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 LM Studio 模型提供商支持。

- **[memory-core](/zh-CN/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 包含在 OpenClaw 中。添加智能体可调用工具。

- **[memory-wiki](/zh-CN/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 包含在 OpenClaw 中。面向 OpenClaw 的持久化 wiki 编译器和 Obsidian 友好知识库。

- **[microsoft](/zh-CN/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 包含在 OpenClaw 中。添加文本转语音提供商支持。

- **[microsoft-foundry](/zh-CN/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。

- **[migrate-claude](/zh-CN/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 包含在 OpenClaw 中。将 Claude Code 和 Claude Desktop 指令、MCP 服务器、Skills 以及安全配置导入 OpenClaw。

- **[migrate-hermes](/zh-CN/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 包含在 OpenClaw 中。将 Hermes 配置、记忆、Skills 和受支持凭证导入 OpenClaw。

- **[minimax](/zh-CN/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 MiniMax、MiniMax Portal 模型提供商支持。

- **[mistral](/zh-CN/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Mistral 模型提供商支持。

- **[novita](/zh-CN/plugins/reference/novita)** (`@openclaw/novita-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Novita、Novita AI、Novitaai 模型提供商支持。

- **[nvidia](/zh-CN/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 NVIDIA 模型提供商支持。

- **[oc-path](/zh-CN/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 包含在 OpenClaw 中。添加用于 oc:// 工作区文件寻址的 openclaw path CLI。

- **[ollama](/zh-CN/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Ollama、Ollama Cloud 模型提供商支持。

- **[open-prose](/zh-CN/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 包含在 OpenClaw 中。带有 /prose 斜杠命令的 OpenProse VM skill pack。

- **[openai](/zh-CN/plugins/reference/openai)** (`@openclaw/openai-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 OpenAI 模型提供商支持。

- **[opencode](/zh-CN/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 OpenCode 模型提供商支持。

- **[opencode-go](/zh-CN/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 OpenCode Go 模型提供商支持。

- **[openrouter](/zh-CN/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 OpenRouter 模型提供商支持。

- **[policy](/zh-CN/plugins/reference/policy)** (`@openclaw/policy`) - 包含在 OpenClaw 中。添加由策略支持的 Doctor 检查，用于工作区一致性。

- **[runway](/zh-CN/plugins/reference/runway)** (`@openclaw/runway-provider`) - 包含在 OpenClaw 中。添加视频生成提供商支持。

- **[senseaudio](/zh-CN/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 包含在 OpenClaw 中。添加媒体理解提供商支持。

- **[sglang](/zh-CN/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 SGLang 模型提供商支持。

- **[synthetic](/zh-CN/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Synthetic 模型提供商支持。

- **[telegram](/zh-CN/plugins/reference/telegram)** (`@openclaw/telegram`) - 包含在 OpenClaw 中。添加用于发送和接收 OpenClaw 消息的 Telegram 渠道界面。

- **[together](/zh-CN/plugins/reference/together)** (`@openclaw/together-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Together 模型提供商支持。

- **[tts-local-cli](/zh-CN/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 包含在 OpenClaw 中。添加文本转语音提供商支持。

- **[vllm](/zh-CN/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 vLLM 模型提供商支持。

- **[volcengine](/zh-CN/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Volcengine、Volcengine Plan 模型提供商支持。

- **[voyage](/zh-CN/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 包含在 OpenClaw 中。添加记忆嵌入提供商支持。

- **[vydra](/zh-CN/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Vydra 模型提供商支持。

- **[web-readability](/zh-CN/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 包含在 OpenClaw 中。从本地 HTML Web 获取响应中提取可读文章内容。

- **[webhooks](/zh-CN/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 包含在 OpenClaw 中。经过身份验证的入站 webhook，用于将外部自动化绑定到 OpenClaw TaskFlows。

- **[workboard](/zh-CN/plugins/reference/workboard)** (`@openclaw/workboard`) - 包含在 OpenClaw 中。用于智能体拥有的问题和会话的仪表板 workboard。

- **[xai](/zh-CN/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 包含在 OpenClaw 中。为 OpenClaw 添加 xAI 模型提供商支持。

- **[xiaomi](/zh-CN/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 包含在 OpenClaw 中。为 OpenClaw 添加 Xiaomi、Xiaomi Token Plan 模型提供商支持。

## 官方外部包

68 个插件

- **[acpx](/zh-CN/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 运行时后端，带有由插件拥有的会话和传输管理。

- **[amazon-bedrock](/zh-CN/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 提供商插件，支持模型发现、嵌入和防护栏。

- **[amazon-bedrock-mantle](/zh-CN/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。用于 OpenAI 兼容模型路由的 OpenClaw Amazon Bedrock Mantle 提供商插件。

- **[anthropic-vertex](/zh-CN/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。用于 Google Vertex AI 上 Claude 模型的 OpenClaw Anthropic Vertex 提供商插件。

- **[arcee](/zh-CN/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。为 OpenClaw 添加 Arcee 模型提供商支持。

- **[brave](/zh-CN/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。用于 Web 搜索的 OpenClaw Brave Search 提供商插件。

- **[cerebras](/zh-CN/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。为 OpenClaw 添加 Cerebras 模型提供商支持。

- **[chutes](/zh-CN/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。为 OpenClaw 添加 Chutes 模型提供商支持。

- **[clickclack](/zh-CN/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。添加 ClickClack 渠道表面，用于发送和接收 OpenClaw 消息。

- **[cloudflare-ai-gateway](/zh-CN/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。为 OpenClaw 添加 Cloudflare AI Gateway 模型提供商支持。

- **[codex](/zh-CN/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。OpenClaw Codex app-server harness 和模型提供商插件，带有由 Codex 管理的 GPT 目录。

- **[copilot](/zh-CN/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。注册 GitHub Copilot agent runtime。

- **[deepinfra](/zh-CN/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。为 OpenClaw 添加 DeepInfra 模型提供商支持。

- **[deepseek](/zh-CN/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。为 OpenClaw 添加 DeepSeek 模型提供商支持。

- **[diagnostics-otel](/zh-CN/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。用于指标、追踪和日志的 OpenClaw 诊断 OpenTelemetry 导出器。

- **[diagnostics-prometheus](/zh-CN/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。用于运行时指标的 OpenClaw 诊断 Prometheus 导出器。

- **[diffs](/zh-CN/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。供智能体使用的 OpenClaw 只读 diff 查看器插件和文件渲染器。

- **[diffs-language-pack](/zh-CN/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。为默认 diffs 查看器集合之外的语言添加语法高亮。

- **[discord](/zh-CN/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。用于频道、私信、命令和应用事件的 OpenClaw Discord 渠道插件。

- **[exa](/zh-CN/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。添加 Web 搜索提供商支持。

- **[feishu](/zh-CN/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。用于聊天和工作区工具的 OpenClaw Feishu/Lark 渠道插件（由 @m1heng 社区维护）。

- **[firecrawl](/zh-CN/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。添加智能体可调用工具。添加 Web 抓取提供商支持。添加 Web 搜索提供商支持。

- **[fireworks](/zh-CN/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。为 OpenClaw 添加 Fireworks 模型提供商支持。

- **[gmi](/zh-CN/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供商插件。

- **[google-meet](/zh-CN/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。用于通过 Chrome 或 Twilio 传输加入通话的 OpenClaw Google Meet 参会者插件。

- **[googlechat](/zh-CN/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。用于空间和直接消息的 OpenClaw Google Chat 渠道插件。

- **[gradium](/zh-CN/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。添加文本转语音提供商支持。

- **[groq](/zh-CN/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。为 OpenClaw 添加 Groq 模型提供商支持。

- **[inworld](/zh-CN/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 流式文本转语音（MP3、OGG_OPUS、PCM 电话音频）。

- **[irc](/zh-CN/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。添加 IRC 渠道表面，用于发送和接收 OpenClaw 消息。

- **[kilocode](/zh-CN/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。为 OpenClaw 添加 Kilocode 模型提供商支持。

- **[kimi](/zh-CN/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。为 OpenClaw 添加 Kimi、Kimi Coding 模型提供商支持。

- **[line](/zh-CN/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。用于 LINE Bot API 聊天的 OpenClaw LINE 渠道插件。

- **[llama-cpp](/zh-CN/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。通过 node-llama-cpp 提供本地 GGUF 嵌入。

- **[lobster](/zh-CN/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。用于类型化流水线和可恢复审批的 Lobster 工作流工具插件。

- **[matrix](/zh-CN/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。用于房间和直接消息的 OpenClaw Matrix 渠道插件。

- **[mattermost](/zh-CN/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。添加 Mattermost 渠道表面，用于发送和接收 OpenClaw 消息。

- **[memory-lancedb](/zh-CN/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。OpenClaw LanceDB 支持的长期记忆插件，包含自动召回、自动捕获和向量搜索。

- **[moonshot](/zh-CN/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。为 OpenClaw 添加 Moonshot 模型提供商支持。

- **[msteams](/zh-CN/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。用于机器人对话的 OpenClaw Microsoft Teams 渠道插件。

- **[nextcloud-talk](/zh-CN/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。用于对话的 OpenClaw Nextcloud Talk 渠道插件。

- **[nostr](/zh-CN/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。用于 NIP-04 加密直接消息的 OpenClaw Nostr 渠道插件。

- **[openshell](/zh-CN/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。用于 NVIDIA OpenShell CLI 的 OpenClaw 沙箱后端，支持镜像本地工作区和 SSH 命令执行。

- **[parallel](/zh-CN/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。添加 Web 搜索提供商支持。

- **[perplexity](/zh-CN/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。添加 Web 搜索提供商支持。

- **[pixverse](/zh-CN/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 视频生成提供商插件。

- **[qianfan](/zh-CN/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。为 OpenClaw 添加 Qianfan 模型提供商支持。

- **[qqbot](/zh-CN/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。用于群组和直接消息工作流的 OpenClaw QQ Bot 渠道插件。

- **[qwen](/zh-CN/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。为 OpenClaw 添加 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI 模型提供商支持。

- **[raft](/zh-CN/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。用于安全 CLI 唤醒桥接的 OpenClaw Raft 渠道插件。

- **[searxng](/zh-CN/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。添加 Web 搜索提供商支持。

- **[signal](/zh-CN/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。添加 Signal 渠道表面，用于发送和接收 OpenClaw 消息。

- **[slack](/zh-CN/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。用于频道、私信、命令和应用事件的 OpenClaw Slack 渠道插件。

- **[sms](/zh-CN/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。用于 OpenClaw 文本消息的 Twilio SMS 渠道插件。

- **[stepfun](/zh-CN/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。为 OpenClaw 添加 StepFun、StepFun Plan 模型提供商支持。

- **[synology-chat](/zh-CN/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。用于 OpenClaw 频道和直接消息的 Synology Chat 渠道插件。

- **[tavily](/zh-CN/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。添加智能体可调用工具。添加 Web 搜索提供商支持。

- **[tencent](/zh-CN/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。为 OpenClaw 添加 Tencent TokenHub 模型提供商支持。

- **[tlon](/zh-CN/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。用于聊天工作流的 OpenClaw Tlon/Urbit 渠道插件。

- **[tokenjuice](/zh-CN/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 tokenjuice reducer 压缩 exec 和 bash 工具结果。

- **[twitch](/zh-CN/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。用于聊天和审核工作流的 OpenClaw Twitch 渠道插件。

- **[venice](/zh-CN/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。为 OpenClaw 添加 Venice 模型提供商支持。

- **[vercel-ai-gateway](/zh-CN/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。为 OpenClaw 添加 Vercel AI Gateway 模型提供商支持。

- **[voice-call](/zh-CN/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。用于 Twilio、Telnyx 和 Plivo 电话呼叫的 OpenClaw voice-call 插件。

- **[whatsapp](/zh-CN/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。用于 WhatsApp Web 聊天的 OpenClaw WhatsApp 渠道插件。

- **[zai](/zh-CN/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。为 OpenClaw 添加 Z.AI 模型提供商支持。

- **[zalo](/zh-CN/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。用于机器人和 webhook 聊天的 OpenClaw Zalo 渠道插件。

- **[zalouser](/zh-CN/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。通过原生 zca-js 集成提供的 OpenClaw Zalo Personal Account 插件。

## 仅限源代码检出

3 个插件

- **[qa-channel](/zh-CN/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 仅限源代码检出。添加 QA Channel 表面，用于发送和接收 OpenClaw 消息。

- **[qa-lab](/zh-CN/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 仅限源代码检出。OpenClaw QA lab 插件，带有私有调试器 UI 和场景运行器。

- **[qa-matrix](/zh-CN/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 仅限源代码检出。Matrix QA 传输运行器和基底。

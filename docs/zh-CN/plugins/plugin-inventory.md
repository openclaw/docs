---
read_when:
    - 你正在决定一个插件是随核心 npm 包发布，还是单独安装
    - 你正在更新内置插件包元数据或发布自动化
    - 你需要规范的内部与外部插件列表
summary: OpenClaw 插件清单，列出随核心一起交付、对外发布或仅保留源码的插件
title: 插件清单
x-i18n:
    generated_at: "2026-07-04T03:35:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1af48e3d1ca8e994780dae2ac39dd2d3c3ed0bc8c136cbf3448fe18fadddfb0a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 插件清单

此页面由 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 包的 `files` 排除项生成。使用以下命令重新生成：

```bash
pnpm plugins:inventory:gen
```

## 定义

- **核心 npm 包：** 内置于 `openclaw` npm 包中，无需单独安装插件即可使用。
- **官方外部包：** 由 OpenClaw 维护的插件，未包含在核心 npm 包中，保留在此官方清单中，并通过 ClawHub 和/或 npm 按需安装。
- **仅源码检出：** 仓库本地插件，不包含在已发布的 npm 构件中，也不会作为可安装包宣传。

源码检出与 npm 安装不同：运行 `pnpm install` 后，内置
插件会从 `extensions/<id>` 加载，因此本地编辑和包本地 workspace
依赖都可用。

## 安装插件

使用每个条目中的安装路径判断是否需要安装。标注为 `included in OpenClaw` 的插件
已存在于核心包中。官方外部包需要安装一次，然后重启 Gateway 网关。

例如，Discord 是一个官方外部包：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在发布切换期间，普通的裸包规格仍会从 npm 安装。
当你需要明确来源时，使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。
安装后，按照插件的设置文档（例如
[Discord](/zh-CN/channels/discord)）添加凭据和频道配置。参见
[管理插件](/zh-CN/plugins/manage-plugins)，了解更新、卸载和发布
命令。

每个条目列出包、分发路径和描述。

## 核心 npm 包

60 个插件

- **[admin-http-rpc](/zh-CN/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - 已包含在 OpenClaw 中。OpenClaw 管理 HTTP RPC 端点。

- **[alibaba](/zh-CN/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - 已包含在 OpenClaw 中。添加视频生成提供商支持。

- **[anthropic](/zh-CN/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Anthropic 模型提供商支持。

- **[azure-speech](/zh-CN/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - 已包含在 OpenClaw 中。Azure AI Speech 文本转语音（MP3、原生 Ogg/Opus 语音消息、PCM 电话音频）。

- **[bonjour](/zh-CN/plugins/reference/bonjour)** (`@openclaw/bonjour`) - 已包含在 OpenClaw 中。通过 Bonjour/mDNS 宣告本地 OpenClaw Gateway 网关。

- **[browser](/zh-CN/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 已包含在 OpenClaw 中。添加可由智能体调用的工具。

- **[byteplus](/zh-CN/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 BytePlus、BytePlus Plan 模型提供商支持。

- **[canvas](/zh-CN/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 已包含在 OpenClaw 中。为已配对节点提供实验性 Canvas 控制和 A2UI 渲染界面。

- **[clawrouter](/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 ClawRouter 模型提供商支持。

- **[codex-supervisor](/zh-CN/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - 已包含在 OpenClaw 中。从 OpenClaw 监督 Codex app-server 会话。

- **[cohere](/zh-CN/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 已包含在 OpenClaw 中；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 提供商插件。

- **[comfy](/zh-CN/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 ComfyUI 模型提供商支持。

- **[copilot-proxy](/zh-CN/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Copilot Proxy 模型提供商支持。

- **[deepgram](/zh-CN/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 已包含在 OpenClaw 中。添加媒体理解提供商支持。添加实时转写提供商支持。

- **[document-extract](/zh-CN/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 已包含在 OpenClaw 中。从本地文档附件中提取文本和后备页面图像。

- **[duckduckgo](/zh-CN/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 已包含在 OpenClaw 中。添加 Web 搜索提供商支持。

- **[elevenlabs](/zh-CN/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - 已包含在 OpenClaw 中。添加媒体理解提供商支持。添加实时转写提供商支持。添加文本转语音提供商支持。

- **[fal](/zh-CN/plugins/reference/fal)** (`@openclaw/fal-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 fal 模型提供商支持。

- **[file-transfer](/zh-CN/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - 已包含在 OpenClaw 中。通过专用节点命令在已配对节点上获取、列出和写入文件。对最大 16 MB 的二进制文件，通过 node.invoke 使用 base64，绕过 bash stdout 截断。

- **[github-copilot](/zh-CN/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 GitHub Copilot 模型提供商支持。

- **[google](/zh-CN/plugins/reference/google)** (`@openclaw/google-plugin`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Google、Google Gemini CLI、Google Vertex 模型提供商支持。

- **[huggingface](/zh-CN/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Hugging Face 模型提供商支持。

- **[imessage](/zh-CN/plugins/reference/imessage)** (`@openclaw/imessage`) - 已包含在 OpenClaw 中。添加用于发送和接收 OpenClaw 消息的 iMessage 渠道界面。

- **[litellm](/zh-CN/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 LiteLLM 模型提供商支持。

- **[llm-task](/zh-CN/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 已包含在 OpenClaw 中。用于结构化任务的通用 JSON-only LLM 工具，可从工作流调用。

- **[lmstudio](/zh-CN/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 LM Studio 模型提供商支持。

- **[memory-core](/zh-CN/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 已包含在 OpenClaw 中。添加可由智能体调用的工具。

- **[memory-wiki](/zh-CN/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 已包含在 OpenClaw 中。面向 OpenClaw 的持久 wiki 编译器和 Obsidian 友好的知识库。

- **[microsoft](/zh-CN/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 已包含在 OpenClaw 中。添加文本转语音提供商支持。

- **[microsoft-foundry](/zh-CN/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。

- **[migrate-claude](/zh-CN/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 已包含在 OpenClaw 中。将 Claude Code 和 Claude Desktop 指令、MCP 服务器、Skills 以及安全配置导入 OpenClaw。

- **[migrate-hermes](/zh-CN/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 已包含在 OpenClaw 中。将 Hermes 配置、记忆、Skills 和支持的凭据导入 OpenClaw。

- **[minimax](/zh-CN/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 MiniMax、MiniMax Portal 模型提供商支持。

- **[mistral](/zh-CN/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Mistral 模型提供商支持。

- **[novita](/zh-CN/plugins/reference/novita)** (`@openclaw/novita-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Novita、Novita AI、Novitaai 模型提供商支持。

- **[nvidia](/zh-CN/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 NVIDIA 模型提供商支持。

- **[oc-path](/zh-CN/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 已包含在 OpenClaw 中。添加用于 oc:// workspace 文件寻址的 openclaw 路径 CLI。

- **[ollama](/zh-CN/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Ollama、Ollama Cloud 模型提供商支持。

- **[open-prose](/zh-CN/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 已包含在 OpenClaw 中。OpenProse VM 技能包，带有 /prose 斜杠命令。

- **[openai](/zh-CN/plugins/reference/openai)** (`@openclaw/openai-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 OpenAI 模型提供商支持。

- **[opencode](/zh-CN/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 OpenCode 模型提供商支持。

- **[opencode-go](/zh-CN/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 OpenCode Go 模型提供商支持。

- **[openrouter](/zh-CN/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 OpenRouter 模型提供商支持。

- **[policy](/zh-CN/plugins/reference/policy)** (`@openclaw/policy`) - 已包含在 OpenClaw 中。为 workspace 合规性添加基于策略的 Doctor 检查。

- **[runway](/zh-CN/plugins/reference/runway)** (`@openclaw/runway-provider`) - 已包含在 OpenClaw 中。添加视频生成提供商支持。

- **[senseaudio](/zh-CN/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 已包含在 OpenClaw 中。添加媒体理解提供商支持。

- **[sglang](/zh-CN/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 SGLang 模型提供商支持。

- **[synthetic](/zh-CN/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Synthetic 模型提供商支持。

- **[telegram](/zh-CN/plugins/reference/telegram)** (`@openclaw/telegram`) - 已包含在 OpenClaw 中。添加用于发送和接收 OpenClaw 消息的 Telegram 渠道界面。

- **[together](/zh-CN/plugins/reference/together)** (`@openclaw/together-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Together 模型提供商支持。

- **[tts-local-cli](/zh-CN/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 已包含在 OpenClaw 中。添加文本转语音提供商支持。

- **[vllm](/zh-CN/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 vLLM 模型提供商支持。

- **[volcengine](/zh-CN/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Volcengine、Volcengine Plan 模型提供商支持。

- **[voyage](/zh-CN/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 已包含在 OpenClaw 中。添加记忆嵌入提供商支持。

- **[vydra](/zh-CN/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Vydra 模型提供商支持。

- **[web-readability](/zh-CN/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 已包含在 OpenClaw 中。从本地 HTML Web 获取响应中提取可读的文章内容。

- **[webhooks](/zh-CN/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 已包含在 OpenClaw 中。经过身份验证的入站 Webhook，用于将外部自动化绑定到 OpenClaw TaskFlows。

- **[workboard](/zh-CN/plugins/reference/workboard)** (`@openclaw/workboard`) - 已包含在 OpenClaw 中。用于智能体所拥有的问题和会话的仪表盘工作板。

- **[xai](/zh-CN/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 xAI 模型提供商支持。

- **[xiaomi](/zh-CN/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 已包含在 OpenClaw 中。为 OpenClaw 添加 Xiaomi、Xiaomi Token Plan 模型提供商支持。

## 官方外部包

68 个插件

- **[acpx](/zh-CN/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 运行时后端，带有插件拥有的会话和传输管理。

- **[amazon-bedrock](/zh-CN/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 提供商插件，支持模型发现、嵌入和护栏。

- **[amazon-bedrock-mantle](/zh-CN/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle provider plugin，用于 OpenAI 兼容的模型路由。

- **[anthropic-vertex](/zh-CN/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex provider plugin，用于 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-CN/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。为 OpenClaw 添加 Arcee 模型提供商支持。

- **[brave](/zh-CN/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。OpenClaw Brave Search 提供商插件，用于 Web 搜索。

- **[cerebras](/zh-CN/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。为 OpenClaw 添加 Cerebras 模型提供商支持。

- **[chutes](/zh-CN/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。为 OpenClaw 添加 Chutes 模型提供商支持。

- **[clickclack](/zh-CN/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。添加 ClickClack 渠道界面，用于发送和接收 OpenClaw 消息。

- **[cloudflare-ai-gateway](/zh-CN/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。为 OpenClaw 添加 Cloudflare AI Gateway 模型提供商支持。

- **[codex](/zh-CN/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。OpenClaw Codex 应用服务器 harness 和模型提供商插件，带有 Codex 管理的 GPT 目录。

- **[copilot](/zh-CN/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。注册 GitHub Copilot agent runtime。

- **[deepinfra](/zh-CN/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。为 OpenClaw 添加 DeepInfra 模型提供商支持。

- **[deepseek](/zh-CN/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。为 OpenClaw 添加 DeepSeek 模型提供商支持。

- **[diagnostics-otel](/zh-CN/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。OpenClaw 诊断 OpenTelemetry 导出器，用于指标、追踪和日志。

- **[diagnostics-prometheus](/zh-CN/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。OpenClaw 诊断 Prometheus 导出器，用于运行时指标。

- **[diffs](/zh-CN/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。OpenClaw 只读 diff 查看器插件和面向智能体的文件渲染器。

- **[diffs-language-pack](/zh-CN/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。为默认 diffs 查看器集合之外的语言添加语法高亮。

- **[discord](/zh-CN/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。OpenClaw Discord 渠道插件，用于渠道、私信、命令和应用事件。

- **[exa](/zh-CN/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。添加 Web 搜索提供商支持。

- **[feishu](/zh-CN/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。OpenClaw Feishu/Lark 渠道插件，用于聊天和工作场所工具（由 @m1heng 社区维护）。

- **[firecrawl](/zh-CN/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。添加智能体可调用工具。添加 Web 抓取提供商支持。添加 Web 搜索提供商支持。

- **[fireworks](/zh-CN/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。为 OpenClaw 添加 Fireworks 模型提供商支持。

- **[gmi](/zh-CN/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供商插件。

- **[google-meet](/zh-CN/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 参与者插件，用于通过 Chrome 或 Twilio 传输加入通话。

- **[googlechat](/zh-CN/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。OpenClaw Google Chat 渠道插件，用于空间和直接消息。

- **[gradium](/zh-CN/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。添加文本转语音提供商支持。

- **[groq](/zh-CN/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。为 OpenClaw 添加 Groq 模型提供商支持。

- **[inworld](/zh-CN/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 流式文本转语音（MP3、OGG_OPUS、PCM 电话音频）。

- **[irc](/zh-CN/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。添加 IRC 渠道界面，用于发送和接收 OpenClaw 消息。

- **[kilocode](/zh-CN/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。为 OpenClaw 添加 Kilocode 模型提供商支持。

- **[kimi](/zh-CN/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。为 OpenClaw 添加 Kimi、Kimi Coding 模型提供商支持。

- **[line](/zh-CN/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。OpenClaw LINE 渠道插件，用于 LINE Bot API 聊天。

- **[llama-cpp](/zh-CN/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。通过 node-llama-cpp 提供本地 GGUF 嵌入。

- **[lobster](/zh-CN/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。Lobster 工作流工具插件，用于类型化流水线和可恢复审批。

- **[matrix](/zh-CN/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。OpenClaw Matrix 渠道插件，用于房间和直接消息。

- **[mattermost](/zh-CN/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。添加 Mattermost 渠道界面，用于发送和接收 OpenClaw 消息。

- **[memory-lancedb](/zh-CN/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。OpenClaw LanceDB 支持的长期记忆插件，具备自动召回、自动捕获和向量搜索。

- **[moonshot](/zh-CN/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。为 OpenClaw 添加 Moonshot 模型提供商支持。

- **[msteams](/zh-CN/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。OpenClaw Microsoft Teams 渠道插件，用于机器人对话。

- **[nextcloud-talk](/zh-CN/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。OpenClaw Nextcloud Talk 渠道插件，用于对话。

- **[nostr](/zh-CN/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。OpenClaw Nostr 渠道插件，用于 NIP-04 加密直接消息。

- **[openshell](/zh-CN/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。OpenClaw 沙箱隔离后端，用于 NVIDIA OpenShell CLI，支持镜像本地工作区和 SSH 命令执行。

- **[parallel](/zh-CN/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。添加 Web 搜索提供商支持。

- **[perplexity](/zh-CN/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。添加 Web 搜索提供商支持。

- **[pixverse](/zh-CN/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 视频生成提供商插件。

- **[qianfan](/zh-CN/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。为 OpenClaw 添加 Qianfan 模型提供商支持。

- **[qqbot](/zh-CN/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。OpenClaw QQ Bot 渠道插件，用于群组和直接消息工作流。

- **[qwen](/zh-CN/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。为 OpenClaw 添加 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI 模型提供商支持。

- **[raft](/zh-CN/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。OpenClaw Raft 渠道插件，用于安全的 CLI 唤醒桥接。

- **[searxng](/zh-CN/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。添加 Web 搜索提供商支持。

- **[signal](/zh-CN/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。添加 Signal 渠道界面，用于发送和接收 OpenClaw 消息。

- **[slack](/zh-CN/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。OpenClaw Slack 渠道插件，用于渠道、私信、命令和应用事件。

- **[sms](/zh-CN/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。Twilio SMS 渠道插件，用于 OpenClaw 文本消息。

- **[stepfun](/zh-CN/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。为 OpenClaw 添加 StepFun、StepFun Plan 模型提供商支持。

- **[synology-chat](/zh-CN/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。Synology Chat 渠道插件，用于 OpenClaw 渠道和直接消息。

- **[tavily](/zh-CN/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。添加智能体可调用工具。添加 Web 搜索提供商支持。

- **[tencent](/zh-CN/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。为 OpenClaw 添加 Tencent TokenHub 模型提供商支持。

- **[tlon](/zh-CN/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。OpenClaw Tlon/Urbit 渠道插件，用于聊天工作流。

- **[tokenjuice](/zh-CN/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 tokenjuice reducer 压缩 exec 和 bash 工具结果。

- **[twitch](/zh-CN/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。OpenClaw Twitch 渠道插件，用于聊天和审核工作流。

- **[venice](/zh-CN/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。为 OpenClaw 添加 Venice 模型提供商支持。

- **[vercel-ai-gateway](/zh-CN/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。为 OpenClaw 添加 Vercel AI Gateway 模型提供商支持。

- **[voice-call](/zh-CN/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。OpenClaw 语音通话插件，用于 Twilio、Telnyx 和 Plivo 电话通话。

- **[whatsapp](/zh-CN/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。OpenClaw WhatsApp 渠道插件，用于 WhatsApp Web 聊天。

- **[zai](/zh-CN/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。为 OpenClaw 添加 Z.AI 模型提供商支持。

- **[zalo](/zh-CN/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。OpenClaw Zalo 渠道插件，用于机器人和 webhook 聊天。

- **[zalouser](/zh-CN/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。OpenClaw Zalo Personal Account 插件，通过原生 zca-js 集成实现。

## 仅限源码检出

3 个插件

- **[qa-channel](/zh-CN/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 仅限源码检出。添加 QA channel 界面，用于发送和接收 OpenClaw 消息。

- **[qa-lab](/zh-CN/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 仅限源码检出。OpenClaw QA lab 插件，带有私有调试器 UI 和场景运行器。

- **[qa-matrix](/zh-CN/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 仅适用于源码检出。Matrix QA 传输运行器和基底。

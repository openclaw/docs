---
read_when:
    - 你正在决定插件是随核心 npm 包一起发布，还是单独安装
    - 你正在更新内置插件的软件包元数据或发布自动化流程
    - 你需要规范的内部与外部插件列表
summary: OpenClaw 中随核心发布、外部发布或仅保留源码的插件清单生成结果
title: 插件清单
x-i18n:
    generated_at: "2026-07-12T14:39:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aa3ccb8d9213ec35f0055331cb30509cb92a3e0581e4689bd2c0ce98326d119d
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# 插件清单

此页面根据 `extensions/*/package.json`、`openclaw.plugin.json`
以及根 npm 软件包的 `files` 排除项生成。使用以下命令重新生成：

```bash
pnpm plugins:inventory:gen
```

## 定义

- **核心 npm 包：** 内置于 `openclaw` npm 包中，无需单独安装插件即可使用。
- **官方外部包：** 由 OpenClaw 维护、不包含在核心 npm 包中的插件，收录于此官方清单中，并可按需通过 ClawHub 和/或 npm 安装。
- **仅限源码检出：** 仅存在于仓库本地、不包含在已发布 npm 工件中且不作为可安装包推广的插件。

源码检出与 npm 安装不同：运行 `pnpm install` 后，内置插件会从
`extensions/<id>` 加载，因此可以使用本地编辑内容和包内工作区
依赖项。

## 安装插件

根据每个条目中的安装方式判断是否需要安装。标注
`included in OpenClaw` 的插件已包含在核心包中。
官方外部包只需安装一次，然后重启 Gateway 网关。

例如，Discord 是一个官方外部包：

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

在发布切换期间，普通的裸包规范仍从 npm 安装。需要显式指定来源时，请使用 `clawhub:@openclaw/discord` 或 `npm:@openclaw/discord`。安装后，请按照插件的设置文档（例如 [Discord](/zh-CN/channels/discord)）添加凭据和渠道配置。有关更新、卸载和发布命令，请参阅[管理插件](/zh-CN/plugins/manage-plugins)。

每个条目都列出了软件包、分发途径和说明。

## 核心 npm 软件包

64 个插件

- **[admin-http-rpc](/zh-CN/plugins/reference/admin-http-rpc)**（`@openclaw/admin-http-rpc`）- 内置于 OpenClaw。OpenClaw 管理 HTTP RPC 端点。

- **[alibaba](/zh-CN/plugins/reference/alibaba)**（`@openclaw/alibaba-provider`）- 内置于 OpenClaw。添加视频生成提供商支持。

- **[anthropic](/zh-CN/plugins/reference/anthropic)**（`@openclaw/anthropic-provider`）- 内置于 OpenClaw。支持 Anthropic 模型、Claude CLI 和原生 Claude 会话目录。

- **[azure-speech](/zh-CN/plugins/reference/azure-speech)**（`@openclaw/azure-speech`）- 内置于 OpenClaw。Azure AI Speech 文本转语音（MP3、原生 Ogg/Opus 语音消息、PCM 电话音频）。

- **[bonjour](/zh-CN/plugins/reference/bonjour)**（`@openclaw/bonjour`）- 内置于 OpenClaw。通过 Bonjour/mDNS 广播本地 OpenClaw Gateway 网关。

- **[browser](/zh-CN/plugins/reference/browser)** (`@openclaw/browser-plugin`) - 内置于 OpenClaw。添加可由智能体调用的工具。

- **[byteplus](/zh-CN/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 BytePlus 和 BytePlus Plan 模型提供商支持。

- **[canvas](/zh-CN/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - 内置于 OpenClaw。为已配对节点提供实验性的 Canvas 控制和 A2UI 渲染界面。

- **[clawrouter](/zh-CN/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - 内置于 OpenClaw。为 OpenClaw 添加 ClawRouter 模型提供商支持。

- **[cohere](/zh-CN/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - 内置于 OpenClaw；npm；ClawHub：`clawhub:@openclaw/cohere-provider`。OpenClaw Cohere 提供商插件。

- **[comfy](/zh-CN/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 ComfyUI 模型提供商支持。

- **[copilot-proxy](/zh-CN/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - 内置于 OpenClaw。为 OpenClaw 添加 Copilot Proxy 模型提供商支持。

- **[crabbox](/zh-CN/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - 内置于 OpenClaw。由 Crabbox CLI 支持的云端工作节点提供商。

- **[deepgram](/zh-CN/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - 内置于 OpenClaw。添加媒体理解提供商支持。添加实时转录提供商支持。

- **[document-extract](/zh-CN/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - 内置于 OpenClaw。从本地文档附件中提取文本，并在必要时提取页面图像。

- **[duckduckgo](/zh-CN/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - 内置于 OpenClaw。添加 Web 搜索提供商支持。

- **[elevenlabs](/zh-CN/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - OpenClaw 内置。添加媒体理解提供商支持。添加实时转录提供商支持。添加文本转语音提供商支持。

- **[fal](/zh-CN/plugins/reference/fal)** (`@openclaw/fal-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 fal 模型提供商支持。

- **[文件传输](/zh-CN/plugins/reference/file-transfer)**（`@openclaw/file-transfer`）- 内置于 OpenClaw。通过专用节点命令在已配对的节点上获取、列出和写入文件。对于最大 16 MB 的二进制文件，通过 node.invoke 使用 base64，从而绕过 bash stdout 截断。

- **[github-copilot](/zh-CN/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 GitHub Copilot 模型提供商支持。

- **[google](/zh-CN/plugins/reference/google)** (`@openclaw/google-plugin`) - 内置于 OpenClaw。为 OpenClaw 添加 Google、Google Gemini CLI 和 Google Vertex 模型提供商支持。

- **[huggingface](/zh-CN/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Hugging Face 模型提供商支持。

- **[imessage](/zh-CN/plugins/reference/imessage)** (`@openclaw/imessage`) - 内置于 OpenClaw。添加 iMessage 渠道界面，用于发送和接收 OpenClaw 消息。

- **[litellm](/zh-CN/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 LiteLLM 模型提供商支持。

- **[llm-task](/zh-CN/plugins/reference/llm-task)** (`@openclaw/llm-task`) - 内置于 OpenClaw。通用的纯 JSON LLM 工具，可供工作流调用以执行结构化任务。

- **[lmstudio](/zh-CN/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 LM Studio 模型提供商支持。

- **[logbook](/zh-CN/plugins/reference/logbook)** (`@openclaw/logbook`) - 内置于 OpenClaw。自动工作日志：定期从已配对节点捕获屏幕快照，并将其转化为可回顾的每日时间线。

- **[memory-core](/zh-CN/plugins/reference/memory-core)** (`@openclaw/memory-core`) - 内置于 OpenClaw。添加可由智能体调用的工具。

- **[memory-wiki](/zh-CN/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - 内置于 OpenClaw。为 OpenClaw 提供持久化 wiki 编译器和兼容 Obsidian 的知识库。

- **[meta](/zh-CN/plugins/reference/meta)** (`@openclaw/meta-provider`) - 内置于 OpenClaw；npm；ClawHub：`clawhub:@openclaw/meta-provider`。为 OpenClaw 添加 Meta 模型提供商支持。

- **[microsoft](/zh-CN/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - 内置于 OpenClaw。添加文本转语音提供商支持。

- **[microsoft-foundry](/zh-CN/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - 内置于 OpenClaw。为 OpenClaw 添加 Microsoft Foundry 模型提供商支持。

- **[migrate-claude](/zh-CN/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - 内置于 OpenClaw。将 Claude Code 和 Claude Desktop 的指令、MCP 服务器、技能及安全配置导入 OpenClaw。

- **[migrate-hermes](/zh-CN/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - 内置于 OpenClaw。将 Hermes 配置、记忆、技能及受支持的凭据导入 OpenClaw。

- **[minimax](/zh-CN/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 MiniMax、MiniMax Portal 模型提供商支持。

- **[mistral](/zh-CN/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Mistral 模型提供商支持。

- **[novita](/zh-CN/plugins/reference/novita)** (`@openclaw/novita-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Novita、Novita AI、Novitaai 模型提供商支持。

- **[nvidia](/zh-CN/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 NVIDIA 模型提供商支持。

- **[oc-path](/zh-CN/plugins/reference/oc-path)** (`@openclaw/oc-path`) - 内置于 OpenClaw。添加用于通过 oc:// 对工作区文件进行寻址的 openclaw path CLI。

- **[ollama](/zh-CN/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Ollama、Ollama Cloud 模型提供商支持。

- **[open-prose](/zh-CN/plugins/reference/open-prose)** (`@openclaw/open-prose`) - 内置于 OpenClaw。提供带有 /prose 斜杠命令的 OpenProse VM 技能包。

- **[openai](/zh-CN/plugins/reference/openai)** (`@openclaw/openai-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 OpenAI 模型提供商支持。

- **[opencode](/zh-CN/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 OpenCode 模型提供商支持。

- **[opencode-go](/zh-CN/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 OpenCode Go 模型提供商支持。

- **[openrouter](/zh-CN/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 OpenRouter 模型提供商支持。

- **[policy](/zh-CN/plugins/reference/policy)** (`@openclaw/policy`) - 内置于 OpenClaw。添加基于策略的 Doctor 检查，以验证工作区合规性。

- **[runway](/zh-CN/plugins/reference/runway)** (`@openclaw/runway-provider`) - 内置于 OpenClaw。添加视频生成提供商支持。

- **[senseaudio](/zh-CN/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - 内置于 OpenClaw。添加媒体理解提供商支持。

- **[sglang](/zh-CN/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 SGLang 模型提供商支持。

- **[synthetic](/zh-CN/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Synthetic 模型提供商支持。

- **[telegram](/zh-CN/plugins/reference/telegram)** (`@openclaw/telegram`) - 内置于 OpenClaw。添加 Telegram 渠道界面，用于发送和接收 OpenClaw 消息。

- **[together](/zh-CN/plugins/reference/together)** (`@openclaw/together-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Together 模型提供商支持。

- **[tts-local-cli](/zh-CN/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - 内置于 OpenClaw。添加文本转语音提供商支持。

- **[vault](/plugins/reference/vault)** (`@openclaw/vault`) - 内置于 OpenClaw。HashiCorp Vault SecretRef 提供商集成。

- **[vllm](/zh-CN/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 vLLM 模型提供商支持。

- **[volcengine](/zh-CN/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Volcengine、Volcengine Plan 模型提供商支持。

- **[voyage](/zh-CN/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - 内置于 OpenClaw。添加记忆嵌入提供商支持。

- **[vydra](/zh-CN/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Vydra 模型提供商支持。

- **[web-readability](/zh-CN/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - 内置于 OpenClaw。从本地 HTML 网页抓取响应中提取易读的文章内容。

- **[webhooks](/zh-CN/plugins/reference/webhooks)** (`@openclaw/webhooks`) - 内置于 OpenClaw。经过身份验证的入站 Webhooks，用于将外部自动化绑定到 OpenClaw TaskFlows。

- **[workboard](/zh-CN/plugins/reference/workboard)** (`@openclaw/workboard`) - 内置于 OpenClaw。用于智能体所负责议题和会话的仪表板工作看板。

- **[workspaces](/zh-CN/plugins/reference/workspaces)** (`@openclaw/workspaces-plugin`) - 内置于 OpenClaw。可由智能体组合使用的 Workspaces 文档和控制平面后端。

- **[xai](/zh-CN/plugins/reference/xai)** (`@openclaw/xai-plugin`) - 内置于 OpenClaw。为 OpenClaw 添加 xAI 模型提供商支持。

- **[xiaomi](/zh-CN/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - 内置于 OpenClaw。为 OpenClaw 添加 Xiaomi、Xiaomi Token Plan 模型提供商支持。

## 官方外部软件包

70 个插件

- **[acpx](/zh-CN/plugins/reference/acpx)** (`@openclaw/acpx`) - npm；ClawHub。OpenClaw ACP 运行时后端，由插件管理会话和传输。

- **[amazon-bedrock](/zh-CN/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock 提供商插件，支持模型发现、嵌入和防护机制。

- **[amazon-bedrock-mantle](/zh-CN/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm；ClawHub。OpenClaw Amazon Bedrock Mantle 提供商插件，用于兼容 OpenAI 的模型路由。

- **[anthropic-vertex](/zh-CN/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm；ClawHub。OpenClaw Anthropic Vertex 提供商插件，用于 Google Vertex AI 上的 Claude 模型。

- **[arcee](/zh-CN/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm；ClawHub：`clawhub:@openclaw/arcee-provider`。为 OpenClaw 添加 Arcee 模型提供商支持。

- **[brave](/zh-CN/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm；ClawHub。用于 Web 搜索的 OpenClaw Brave Search 提供商插件。

- **[cerebras](/zh-CN/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm；ClawHub：`clawhub:@openclaw/cerebras-provider`。为 OpenClaw 添加 Cerebras 模型提供商支持。

- **[chutes](/zh-CN/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm；ClawHub：`clawhub:@openclaw/chutes-provider`。为 OpenClaw 添加 Chutes 模型提供商支持。

- **[clickclack](/zh-CN/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm；ClawHub：`clawhub:@openclaw/clickclack`。添加 ClickClack 渠道界面，用于发送和接收 OpenClaw 消息。

- **[cloudflare-ai-gateway](/zh-CN/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/cloudflare-ai-gateway-provider`。为 OpenClaw 添加 Cloudflare AI Gateway 模型提供商支持。

- **[codex](/zh-CN/plugins/reference/codex)** (`@openclaw/codex`) - npm；ClawHub。Codex app-server harness、模型提供商和原生会话目录。

- **[copilot](/zh-CN/plugins/reference/copilot)** (`@openclaw/copilot`) - npm；ClawHub：`clawhub:@openclaw/copilot`。注册 GitHub Copilot agent runtime。

- **[deepinfra](/zh-CN/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm；ClawHub：`clawhub:@openclaw/deepinfra-provider`。为 OpenClaw 添加 DeepInfra 模型提供商支持。

- **[deepseek](/zh-CN/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm；ClawHub：`clawhub:@openclaw/deepseek-provider`。为 OpenClaw 添加 DeepSeek 模型提供商支持。

- **[diagnostics-otel](/zh-CN/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-otel`。用于指标、跟踪和日志的 OpenClaw 诊断 OpenTelemetry 导出器。

- **[diagnostics-prometheus](/zh-CN/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm；ClawHub：`clawhub:@openclaw/diagnostics-prometheus`。用于运行时指标的 OpenClaw 诊断 Prometheus 导出器。

- **[diffs](/zh-CN/plugins/reference/diffs)** (`@openclaw/diffs`) - npm；ClawHub。面向智能体的 OpenClaw 只读差异查看器插件和文件渲染器。

- **[diffs-language-pack](/zh-CN/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`。为默认差异查看器集合之外的语言添加语法高亮。

- **[discord](/zh-CN/plugins/reference/discord)** (`@openclaw/discord`) - npm；ClawHub。用于频道、私信、命令和应用事件的 OpenClaw Discord 渠道插件。

- **[exa](/zh-CN/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm；ClawHub：`clawhub:@openclaw/exa-plugin`。添加 Web 搜索提供商支持。

- **[featherless](/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm；ClawHub：`clawhub:@openclaw/featherless-provider`。OpenClaw Featherless AI 提供商插件。

- **[feishu](/zh-CN/plugins/reference/feishu)** (`@openclaw/feishu`) - npm；ClawHub。用于聊天和工作场所工具的 OpenClaw Feishu/Lark 渠道插件（由社区成员 @m1heng 维护）。

- **[firecrawl](/zh-CN/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm；ClawHub：`clawhub:@openclaw/firecrawl-plugin`。添加可由智能体调用的工具。添加 Web 获取提供商支持。添加 Web 搜索提供商支持。

- **[fireworks](/zh-CN/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm；ClawHub：`clawhub:@openclaw/fireworks-provider`。为 OpenClaw 添加 Fireworks 模型提供商支持。

- **[gmi](/zh-CN/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm；ClawHub：`clawhub:@openclaw/gmi-provider`。OpenClaw GMI Cloud 提供商插件。

- **[google-meet](/zh-CN/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm；ClawHub。OpenClaw Google Meet 参会者插件，用于通过 Chrome 或 Twilio 传输加入通话。

- **[googlechat](/zh-CN/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm；ClawHub。用于空间和私信的 OpenClaw Google Chat 渠道插件。

- **[gradium](/zh-CN/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm；ClawHub：`clawhub:@openclaw/gradium-speech`。添加文本转语音提供商支持。

- **[groq](/zh-CN/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm；ClawHub：`clawhub:@openclaw/groq-provider`。为 OpenClaw 添加 Groq 模型提供商支持。

- **[inworld](/zh-CN/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm；ClawHub：`clawhub:@openclaw/inworld-speech`。Inworld 流式文本转语音（MP3、OGG_OPUS、PCM 电话音频）。

- **[irc](/zh-CN/plugins/reference/irc)** (`@openclaw/irc`) - npm；ClawHub：`clawhub:@openclaw/irc`。添加 IRC 渠道界面，用于发送和接收 OpenClaw 消息。

- **[kilocode](/zh-CN/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm；ClawHub：`clawhub:@openclaw/kilocode-provider`。为 OpenClaw 添加 Kilocode 模型提供商支持。

- **[kimi](/zh-CN/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm；ClawHub：`clawhub:@openclaw/kimi-provider`。为 OpenClaw 添加 Kimi、Kimi Coding 模型提供商支持。

- **[line](/zh-CN/plugins/reference/line)** (`@openclaw/line`) - npm；ClawHub。用于 LINE Bot API 聊天的 OpenClaw LINE 渠道插件。

- **[llama-cpp](/zh-CN/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm；ClawHub。通过 node-llama-cpp 提供本地 GGUF 嵌入。

- **[lobster](/zh-CN/plugins/reference/lobster)** (`@openclaw/lobster`) - npm；ClawHub。Lobster 工作流工具插件，用于类型化管道和可恢复审批。

- **[longcat](/zh-CN/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm；ClawHub：`clawhub:@openclaw/longcat-provider`。OpenClaw LongCat 提供商插件。

- **[matrix](/zh-CN/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub：`clawhub:@openclaw/matrix`；npm。用于房间和私信的 OpenClaw Matrix 渠道插件。

- **[mattermost](/zh-CN/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm；ClawHub：`clawhub:@openclaw/mattermost`。添加 Mattermost 渠道界面，用于发送和接收 OpenClaw 消息。

- **[memory-lancedb](/zh-CN/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm；ClawHub。由 LanceDB 支持的 OpenClaw 长期记忆插件，具有自动回忆、自动捕获和向量搜索功能。

- **[moonshot](/zh-CN/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm；ClawHub：`clawhub:@openclaw/moonshot-provider`。为 OpenClaw 添加 Moonshot 模型提供商支持。

- **[msteams](/zh-CN/plugins/reference/msteams)** (`@openclaw/msteams`) - npm；ClawHub。用于机器人对话的 OpenClaw Microsoft Teams 渠道插件。

- **[nextcloud-talk](/zh-CN/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm；ClawHub。用于对话的 OpenClaw Nextcloud Talk 渠道插件。

- **[nostr](/zh-CN/plugins/reference/nostr)** (`@openclaw/nostr`) - npm；ClawHub。用于 NIP-04 加密私信的 OpenClaw Nostr 渠道插件。

- **[openshell](/zh-CN/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm；ClawHub。用于 NVIDIA OpenShell CLI 的 OpenClaw 沙箱后端，支持镜像本地工作区和 SSH 命令执行。

- **[parallel](/zh-CN/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm；ClawHub：`clawhub:@openclaw/parallel-plugin`。添加 Web 搜索提供商支持。

- **[perplexity](/zh-CN/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm；ClawHub：`clawhub:@openclaw/perplexity-plugin`。添加 Web 搜索提供商支持。

- **[pixverse](/zh-CN/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm；ClawHub：`clawhub:@openclaw/pixverse-provider`。OpenClaw PixVerse 视频生成提供商插件。

- **[qianfan](/zh-CN/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm；ClawHub：`clawhub:@openclaw/qianfan-provider`。为 OpenClaw 添加 Qianfan 模型提供商支持。

- **[qqbot](/zh-CN/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm；ClawHub。用于群组和私信工作流的 OpenClaw QQ Bot 渠道插件。

- **[qwen](/zh-CN/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm；ClawHub：`clawhub:@openclaw/qwen-provider`。为 OpenClaw 添加 Qwen、Qwen Cloud、Model Studio、DashScope、Qwen Oauth、Qwen Portal、Qwen CLI、Qwen Token Plan、Bailian Token Plan 模型提供商支持。

- **[raft](/zh-CN/plugins/reference/raft)** (`@openclaw/raft`) - npm；ClawHub。用于安全 CLI 唤醒桥接的 OpenClaw Raft 渠道插件。

- **[searxng](/zh-CN/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm；ClawHub：`clawhub:@openclaw/searxng-plugin`。添加 Web 搜索提供商支持。

- **[signal](/zh-CN/plugins/reference/signal)** (`@openclaw/signal`) - npm；ClawHub：`clawhub:@openclaw/signal`。添加 Signal 渠道界面，用于发送和接收 OpenClaw 消息。

- **[slack](/zh-CN/plugins/reference/slack)** (`@openclaw/slack`) - npm；ClawHub。用于频道、私信、命令和应用事件的 OpenClaw Slack 渠道插件。

- **[sms](/zh-CN/plugins/reference/sms)** (`@openclaw/sms`) - npm；ClawHub：`clawhub:@openclaw/sms`。用于 OpenClaw 文本消息的 Twilio SMS 渠道插件。

- **[stepfun](/zh-CN/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm；ClawHub：`clawhub:@openclaw/stepfun-provider`。为 OpenClaw 添加 StepFun、StepFun Plan 模型提供商支持。

- **[synology-chat](/zh-CN/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm；ClawHub。用于 OpenClaw 频道和私信的 Synology Chat 渠道插件。

- **[tavily](/zh-CN/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm；ClawHub：`clawhub:@openclaw/tavily-plugin`。添加可由智能体调用的工具。添加 Web 搜索提供商支持。

- **[tencent](/zh-CN/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm；ClawHub：`clawhub:@openclaw/tencent-provider`。为 OpenClaw 添加 Tencent TokenHub、Tencent Tokenplan 模型提供商支持。

- **[tlon](/zh-CN/plugins/reference/tlon)** (`@openclaw/tlon`) - npm；ClawHub。用于聊天工作流的 OpenClaw Tlon/Urbit 渠道插件。

- **[tokenjuice](/zh-CN/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm；ClawHub：`clawhub:@openclaw/tokenjuice`。使用 Tokenjuice 归约器压缩 exec 和 bash 工具结果。

- **[twitch](/zh-CN/plugins/reference/twitch)** (`@openclaw/twitch`) - npm；ClawHub。用于聊天和审核工作流的 OpenClaw Twitch 渠道插件。

- **[venice](/zh-CN/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm；ClawHub：`clawhub:@openclaw/venice-provider`。为 OpenClaw 添加 Venice 模型提供商支持。

- **[vercel-ai-gateway](/zh-CN/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm；ClawHub：`clawhub:@openclaw/vercel-ai-gateway-provider`。为 OpenClaw 添加 Vercel AI Gateway 模型提供商支持。

- **[voice-call](/zh-CN/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm；ClawHub。用于 Twilio、Telnyx 和 Plivo 电话呼叫的 OpenClaw 语音呼叫插件。

- **[whatsapp](/zh-CN/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub：`clawhub:@openclaw/whatsapp`；npm。用于 WhatsApp Web 聊天的 OpenClaw WhatsApp 渠道插件。

- **[zai](/zh-CN/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm；ClawHub：`clawhub:@openclaw/zai-provider`。为 OpenClaw 添加 Z.AI 模型提供商支持。

- **[zalo](/zh-CN/plugins/reference/zalo)** (`@openclaw/zalo`) - npm；ClawHub。用于 Bot 和 webhook 聊天的 OpenClaw Zalo 渠道插件。

- **[zalouser](/zh-CN/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm；ClawHub。通过原生 zca-js 集成提供的 OpenClaw Zalo Personal Account 插件。

## 仅限源码检出

3 个插件

- **[qa-channel](/zh-CN/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - 仅限源码检出。添加用于发送和接收 OpenClaw 消息的 QA Channel 界面。

- **[qa-lab](/zh-CN/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - 仅限源码检出。OpenClaw QA 实验室插件，包含私有调试器 UI 和场景运行器。

- **[qa-matrix](/zh-CN/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - 仅限源码检出。Matrix QA 传输运行器和底层基础。

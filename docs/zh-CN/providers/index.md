---
read_when:
    - 你想选择一个模型提供商
    - 你需要快速了解受支持的 LLM 后端概览
summary: OpenClaw 支持的模型提供商（LLM）
title: 提供商目录
x-i18n:
    generated_at: "2026-04-23T00:08:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d61873f18fcaef7353620f687afc2043087c62edca62f24568c67339a9c65086
    source_path: providers/index.md
    workflow: 15
---

# 模型提供商

OpenClaw 可以使用许多 LLM 提供商。选择一个提供商，完成认证，然后将默认模型设置为 `provider/model`。

在找聊天渠道文档（WhatsApp/Telegram/Discord/Slack/Mattermost（插件）/ 等）？请参阅 [Channels](/zh-CN/channels)。

## 快速开始

1. 使用提供商完成认证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 提供商文档

- [Alibaba Model Studio](/zh-CN/providers/alibaba)
- [Amazon Bedrock](/zh-CN/providers/bedrock)
- [Anthropic（API + Claude CLI）](/zh-CN/providers/anthropic)
- [Arcee AI（Trinity 模型）](/zh-CN/providers/arcee)
- [BytePlus（国际版）](/zh-CN/concepts/model-providers#byteplus-international)
- [Chutes](/zh-CN/providers/chutes)
- [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
- [ComfyUI](/zh-CN/providers/comfy)
- [DeepSeek](/zh-CN/providers/deepseek)
- [fal](/zh-CN/providers/fal)
- [Fireworks](/zh-CN/providers/fireworks)
- [GitHub Copilot](/zh-CN/providers/github-copilot)
- [GLM 模型](/zh-CN/providers/glm)
- [Google（Gemini）](/zh-CN/providers/google)
- [Groq（LPU 推理）](/zh-CN/providers/groq)
- [Hugging Face（推理）](/zh-CN/providers/huggingface)
- [inferrs（本地模型）](/zh-CN/providers/inferrs)
- [Kilocode](/zh-CN/providers/kilocode)
- [LiteLLM（统一 Gateway 网关）](/zh-CN/providers/litellm)
- [LM Studio（本地模型）](/zh-CN/providers/lmstudio)
- [MiniMax](/zh-CN/providers/minimax)
- [Mistral](/zh-CN/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
- [NVIDIA](/zh-CN/providers/nvidia)
- [Ollama（云端 + 本地模型）](/zh-CN/providers/ollama)
- [OpenAI（API + Codex）](/zh-CN/providers/openai)
- [OpenCode](/zh-CN/providers/opencode)
- [OpenCode Go](/zh-CN/providers/opencode-go)
- [OpenRouter](/zh-CN/providers/openrouter)
- [Perplexity（网页搜索）](/zh-CN/providers/perplexity-provider)
- [Qianfan](/zh-CN/providers/qianfan)
- [Qwen Cloud](/zh-CN/providers/qwen)
- [Runway](/zh-CN/providers/runway)
- [SGLang（本地模型）](/zh-CN/providers/sglang)
- [StepFun](/zh-CN/providers/stepfun)
- [Synthetic](/zh-CN/providers/synthetic)
- [Together AI](/zh-CN/providers/together)
- [Venice（Venice AI，注重隐私）](/zh-CN/providers/venice)
- [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
- [vLLM（本地模型）](/zh-CN/providers/vllm)
- [Volcengine（Doubao）](/zh-CN/providers/volcengine)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
- [Xiaomi](/zh-CN/providers/xiaomi)
- [Z.AI](/zh-CN/providers/zai)

## 共享概览页面

- [其他内置变体](/zh-CN/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy 和 Gemini CLI OAuth
- [图像生成](/zh-CN/tools/image-generation) - 共享 `image_generate` 工具、提供商选择和故障切换
- [音乐生成](/zh-CN/tools/music-generation) - 共享 `music_generate` 工具、提供商选择和故障切换
- [视频生成](/zh-CN/tools/video-generation) - 共享 `video_generate` 工具、提供商选择和故障切换

## 转录提供商

- [Deepgram（音频转录）](/zh-CN/providers/deepgram)
- [xAI](/zh-CN/providers/xai#speech-to-text)

## 社区工具

- [Claude Max API Proxy](/zh-CN/providers/claude-max-api-proxy) - 面向 Claude 订阅凭证的社区代理（使用前请先核实 Anthropic 的政策/条款）

如需查看完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参阅 [模型提供商](/zh-CN/concepts/model-providers)。

---
read_when:
    - 你想选择一个模型提供商
    - 你需要快速了解受支持的 LLM 后端
summary: OpenClaw 支持的模型提供商（LLM）
title: 提供商目录
x-i18n:
    generated_at: "2026-07-04T03:35:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw 可以使用许多 LLM 提供商。选择一个提供商，完成认证，然后将默认模型设置为 `provider/model`。

在找聊天频道文档（WhatsApp/Telegram/Discord/Slack/Mattermost（插件）/等）？请参阅 [频道](/zh-CN/channels)。

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
- [Amazon Bedrock Mantle](/zh-CN/providers/bedrock-mantle)
- [Anthropic（API + Claude CLI）](/zh-CN/providers/anthropic)
- [Arcee AI（Trinity 模型）](/zh-CN/providers/arcee)
- [Azure Speech](/zh-CN/providers/azure-speech)
- [BytePlus（国际版）](/zh-CN/concepts/model-providers#byteplus-international)
- [Cerebras](/zh-CN/providers/cerebras)
- [Chutes](/zh-CN/providers/chutes)
- [ClawRouter（托管式多提供商路由）](/providers/clawrouter)
- [Cohere](/zh-CN/providers/cohere)
- [Cloudflare AI Gateway](/zh-CN/providers/cloudflare-ai-gateway)
- [ComfyUI](/zh-CN/providers/comfy)
- [DeepSeek](/zh-CN/providers/deepseek)
- [ds4（本地 DeepSeek V4）](/zh-CN/providers/ds4)
- [ElevenLabs](/zh-CN/providers/elevenlabs)
- [fal](/zh-CN/providers/fal)
- [Fireworks](/zh-CN/providers/fireworks)
- [GitHub Copilot](/zh-CN/providers/github-copilot)
- [GMI Cloud](/zh-CN/providers/gmi)
- [Google（Gemini）](/zh-CN/providers/google)
- [Gradium](/zh-CN/providers/gradium)
- [Groq（LPU 推理）](/zh-CN/providers/groq)
- [Hugging Face（推理）](/zh-CN/providers/huggingface)
- [inferrs（本地模型）](/zh-CN/providers/inferrs)
- [Kilocode](/zh-CN/providers/kilocode)
- [LiteLLM（统一网关）](/zh-CN/providers/litellm)
- [LM Studio（本地模型）](/zh-CN/providers/lmstudio)
- [MiniMax](/zh-CN/providers/minimax)
- [Mistral](/zh-CN/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/zh-CN/providers/moonshot)
- [NVIDIA](/zh-CN/providers/nvidia)
- [NovitaAI](/zh-CN/providers/novita)
- [Ollama（云端 + 本地模型）](/zh-CN/providers/ollama)
- [Ollama Cloud](/zh-CN/providers/ollama-cloud)
- [OpenAI（API + Codex）](/zh-CN/providers/openai)
- [OpenCode](/zh-CN/providers/opencode)
- [OpenCode Go](/zh-CN/providers/opencode-go)
- [OpenRouter](/zh-CN/providers/openrouter)
- [Perplexity（Web 搜索）](/zh-CN/providers/perplexity-provider)
- [Qianfan](/zh-CN/providers/qianfan)
- [Qwen Cloud](/zh-CN/providers/qwen)
- [Qwen OAuth / Portal](/zh-CN/providers/qwen-oauth)
- [Runway](/zh-CN/providers/runway)
- [SenseAudio](/zh-CN/providers/senseaudio)
- [SGLang（本地模型）](/zh-CN/providers/sglang)
- [StepFun](/zh-CN/providers/stepfun)
- [Synthetic](/zh-CN/providers/synthetic)
- [腾讯云（TokenHub）](/zh-CN/providers/tencent)
- [Together AI](/zh-CN/providers/together)
- [Venice（Venice AI，注重隐私）](/zh-CN/providers/venice)
- [Vercel AI Gateway](/zh-CN/providers/vercel-ai-gateway)
- [vLLM（本地模型）](/zh-CN/providers/vllm)
- [Volcengine（豆包）](/zh-CN/providers/volcengine)
- [Vydra](/zh-CN/providers/vydra)
- [xAI](/zh-CN/providers/xai)
- [Xiaomi](/zh-CN/providers/xiaomi)
- [Z.AI (GLM)](/zh-CN/providers/zai)

## 共享概览页面

- [其他内置变体](/zh-CN/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy 和 Gemini CLI OAuth
- [图像生成](/zh-CN/tools/image-generation) - 共享的 `image_generate` 工具、提供商选择和故障转移
- [音乐生成](/zh-CN/tools/music-generation) - 共享的 `music_generate` 工具、提供商选择和故障转移
- [视频生成](/zh-CN/tools/video-generation) - 共享的 `video_generate` 工具、提供商选择和故障转移

## 转录提供商

- [Deepgram（音频转录）](/zh-CN/providers/deepgram)
- [ElevenLabs](/zh-CN/providers/elevenlabs#speech-to-text)
- [Mistral](/zh-CN/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/zh-CN/providers/openai#speech-to-text)
- [SenseAudio](/zh-CN/providers/senseaudio)
- [xAI](/zh-CN/providers/xai#speech-to-text)

## 社区工具

- [Claude Max API Proxy](/zh-CN/providers/claude-max-api-proxy) - 面向 Claude 订阅凭证的社区代理（使用前请确认 Anthropic 政策/条款）

如需完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参阅 [模型提供商](/zh-CN/concepts/model-providers)。

---
read_when:
    - 모델 provider를 선택하려고 합니다
    - 지원되는 LLM 백엔드를 빠르게 개요로 확인해야 합니다
summary: OpenClaw이 지원하는 모델 provider(LLM)
title: Provider 디렉터리
x-i18n:
    generated_at: "2026-04-23T14:06:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b038f095480fc2cd4f7eb75500d9d8eb7b03fa90614e122744939e0ddc6996d
    source_path: providers/index.md
    workflow: 15
---

# 모델 Provider

OpenClaw은 많은 LLM provider를 사용할 수 있습니다. provider를 선택하고 인증한 뒤,
기본 모델을 `provider/model`로 설정하세요.

채팅 채널 문서(WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/기타)를 찾고 있나요? [Channels](/ko/channels)를 참조하세요.

## 빠른 시작

1. provider에서 인증합니다(보통 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider 문서

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Amazon Bedrock Mantle](/ko/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/ko/providers/anthropic)
- [Arcee AI (Trinity models)](/ko/providers/arcee)
- [BytePlus (International)](/ko/concepts/model-providers#byteplus-international)
- [Chutes](/ko/providers/chutes)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [ComfyUI](/ko/providers/comfy)
- [DeepSeek](/ko/providers/deepseek)
- [ElevenLabs](/ko/providers/elevenlabs)
- [fal](/ko/providers/fal)
- [Fireworks](/ko/providers/fireworks)
- [GitHub Copilot](/ko/providers/github-copilot)
- [GLM models](/ko/providers/glm)
- [Google (Gemini)](/ko/providers/google)
- [Groq (LPU inference)](/ko/providers/groq)
- [Hugging Face (Inference)](/ko/providers/huggingface)
- [inferrs (local models)](/ko/providers/inferrs)
- [Kilocode](/ko/providers/kilocode)
- [LiteLLM (unified gateway)](/ko/providers/litellm)
- [LM Studio (local models)](/ko/providers/lmstudio)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
- [NVIDIA](/ko/providers/nvidia)
- [Ollama (cloud + local models)](/ko/providers/ollama)
- [OpenAI (API + Codex)](/ko/providers/openai)
- [OpenCode](/ko/providers/opencode)
- [OpenCode Go](/ko/providers/opencode-go)
- [OpenRouter](/ko/providers/openrouter)
- [Perplexity (web search)](/ko/providers/perplexity-provider)
- [Qianfan](/ko/providers/qianfan)
- [Qwen Cloud](/ko/providers/qwen)
- [Runway](/ko/providers/runway)
- [SGLang (local models)](/ko/providers/sglang)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Tencent Cloud (TokenHub)](/ko/providers/tencent)
- [Together AI](/ko/providers/together)
- [Venice (Venice AI, privacy-focused)](/ko/providers/venice)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [vLLM (local models)](/ko/providers/vllm)
- [Volcengine (Doubao)](/ko/providers/volcengine)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
- [Xiaomi](/ko/providers/xiaomi)
- [Z.AI](/ko/providers/zai)

## 공통 개요 페이지

- [추가 번들 variant](/ko/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, Gemini CLI OAuth
- [이미지 생성](/ko/tools/image-generation) - 공통 `image_generate` 도구, provider 선택, failover
- [음악 생성](/ko/tools/music-generation) - 공통 `music_generate` 도구, provider 선택, failover
- [비디오 생성](/ko/tools/video-generation) - 공통 `video_generate` 도구, provider 선택, failover

## 전사 provider

- [Deepgram (오디오 전사)](/ko/providers/deepgram)
- [ElevenLabs](/ko/providers/elevenlabs#speech-to-text)
- [Mistral](/ko/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ko/providers/openai#speech-to-text)
- [xAI](/ko/providers/xai#speech-to-text)

## 커뮤니티 도구

- [Claude Max API Proxy](/ko/providers/claude-max-api-proxy) - Claude 구독 자격 증명을 위한 커뮤니티 프록시(사용 전에 Anthropic 정책/약관을 확인하세요)

전체 provider 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은
[Model providers](/ko/concepts/model-providers)를 참조하세요.

---
read_when:
    - 모델 제공업체를 선택하려는 경우
    - 지원되는 LLM 백엔드를 빠르게 살펴봐야 합니다
summary: OpenClaw에서 지원하는 모델 제공업체(LLM)
title: 제공업체 디렉터리
x-i18n:
    generated_at: "2026-07-12T01:07:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw은 다양한 LLM 제공자를 사용할 수 있습니다. 제공자를 선택하고 인증한 다음, 기본 모델을 `provider/model` 형식으로 설정하세요.

채팅 채널 문서(WhatsApp/Telegram/Discord/Slack/Mattermost(Plugin)/기타)를 찾고 계신가요? [채널](/ko/channels)을 참조하세요.

## 빠른 시작

1. 제공자에 인증합니다(일반적으로 `openclaw onboard` 사용).
2. 기본 모델을 설정합니다.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 제공자 문서

- [Alibaba Model Studio](/ko/providers/alibaba)
- [Amazon Bedrock](/ko/providers/bedrock)
- [Amazon Bedrock Mantle](/ko/providers/bedrock-mantle)
- [Anthropic(API + Claude CLI)](/ko/providers/anthropic)
- [Arcee AI(Trinity 모델)](/ko/providers/arcee)
- [Azure Speech](/ko/providers/azure-speech)
- [BytePlus(국제)](/ko/concepts/model-providers#byteplus-international)
- [Cerebras](/ko/providers/cerebras)
- [Chutes](/ko/providers/chutes)
- [ClawRouter(관리형 다중 제공자 라우팅)](/ko/providers/clawrouter)
- [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
- [Cohere](/ko/providers/cohere)
- [ComfyUI](/ko/providers/comfy)
- [DeepSeek](/ko/providers/deepseek)
- [ds4(로컬 DeepSeek V4)](/ko/providers/ds4)
- [ElevenLabs](/ko/providers/elevenlabs)
- [fal](/ko/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/ko/providers/fireworks)
- [GitHub Copilot](/ko/providers/github-copilot)
- [GMI Cloud](/ko/providers/gmi)
- [Google(Gemini)](/ko/providers/google)
- [Gradium](/ko/providers/gradium)
- [Groq(LPU 추론)](/ko/providers/groq)
- [Hugging Face(추론)](/ko/providers/huggingface)
- [inferrs(로컬 모델)](/ko/providers/inferrs)
- [Kilocode](/ko/providers/kilocode)
- [LiteLLM(통합 Gateway)](/ko/providers/litellm)
- [LM Studio(로컬 모델)](/ko/providers/lmstudio)
- [LongCat](/ko/providers/longcat)
- [MiniMax](/ko/providers/minimax)
- [Mistral](/ko/providers/mistral)
- [Moonshot AI(Kimi + Kimi Coding)](/ko/providers/moonshot)
- [NovitaAI](/ko/providers/novita)
- [NVIDIA](/ko/providers/nvidia)
- [Ollama(클라우드 + 로컬 모델)](/ko/providers/ollama)
- [Ollama Cloud](/ko/providers/ollama-cloud)
- [OpenAI(API + Codex)](/ko/providers/openai)
- [OpenCode](/ko/providers/opencode)
- [OpenCode Go](/ko/providers/opencode-go)
- [OpenRouter](/ko/providers/openrouter)
- [Perplexity(웹 검색)](/ko/providers/perplexity-provider)
- [Qianfan](/ko/providers/qianfan)
- [Qwen Cloud](/ko/providers/qwen)
- [Qwen OAuth / Portal](/ko/providers/qwen-oauth)
- [Runway](/ko/providers/runway)
- [SenseAudio](/ko/providers/senseaudio)
- [SGLang(로컬 모델)](/ko/providers/sglang)
- [StepFun](/ko/providers/stepfun)
- [Synthetic](/ko/providers/synthetic)
- [Tencent Cloud(TokenHub / TokenPlan)](/ko/providers/tencent)
- [Together AI](/ko/providers/together)
- [Venice(Venice AI, 개인정보 보호 중심)](/ko/providers/venice)
- [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
- [vLLM(로컬 모델)](/ko/providers/vllm)
- [Volcengine(Doubao)](/ko/providers/volcengine)
- [Vydra](/ko/providers/vydra)
- [xAI](/ko/providers/xai)
- [Xiaomi](/ko/providers/xiaomi)
- [Z.AI(GLM)](/ko/providers/zai)

## 공통 개요 페이지

- [추가 제공자 변형](/ko/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy 및 Gemini CLI OAuth
- [이미지 생성](/ko/tools/image-generation) - 공통 `image_generate` 도구, 제공자 선택 및 장애 조치
- [음악 생성](/ko/tools/music-generation) - 공통 `music_generate` 도구, 제공자 선택 및 장애 조치
- [동영상 생성](/ko/tools/video-generation) - 공통 `video_generate` 도구, 제공자 선택 및 장애 조치

## 음성 변환 제공자

- [Deepgram(오디오 음성 변환)](/ko/providers/deepgram)
- [ElevenLabs](/ko/providers/elevenlabs#speech-to-text)
- [Mistral](/ko/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/ko/providers/openai)
- [SenseAudio](/ko/providers/senseaudio)
- [xAI](/ko/providers/xai)

## 커뮤니티 도구

- [Claude Max API Proxy](/ko/providers/claude-max-api-proxy) - Claude 구독 자격 증명을 위한 커뮤니티 프록시(사용하기 전에 Anthropic 정책/약관을 확인하세요)

전체 제공자 카탈로그(xAI, Groq, Mistral 등)와 고급 구성은 [모델 제공자](/ko/concepts/model-providers)를 참조하세요.

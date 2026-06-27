---
read_when:
    - Je wilt een modelprovider kiezen
    - Je hebt een snel overzicht nodig van ondersteunde LLM-backends
summary: Modelproviders (LLM's) die door OpenClaw worden ondersteund
title: Provider-directory
x-i18n:
    generated_at: "2026-06-27T18:12:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a340f6a48f6f1d50116316f9679b009365cd617b3453ebd9b2b31e70f6b94c31
    source_path: providers/index.md
    workflow: 16
---

OpenClaw kan veel LLM-providers gebruiken. Kies een provider, verifieer en stel daarna het
standaardmodel in als `provider/model`.

Op zoek naar documentatie voor chatkanalen (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/enz.)? Zie [Kanalen](/nl/channels).

## Snelstart

1. Verifieer bij de provider (meestal via `openclaw onboard`).
2. Stel het standaardmodel in:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Providerdocumentatie

- [Alibaba Model Studio](/nl/providers/alibaba)
- [Amazon Bedrock](/nl/providers/bedrock)
- [Amazon Bedrock Mantle](/nl/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/nl/providers/anthropic)
- [Arcee AI (Trinity-modellen)](/nl/providers/arcee)
- [Azure Speech](/nl/providers/azure-speech)
- [BytePlus (Internationaal)](/nl/concepts/model-providers#byteplus-international)
- [Cerebras](/nl/providers/cerebras)
- [Chutes](/nl/providers/chutes)
- [Cohere](/nl/providers/cohere)
- [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
- [ComfyUI](/nl/providers/comfy)
- [DeepSeek](/nl/providers/deepseek)
- [ds4 (lokale DeepSeek V4)](/nl/providers/ds4)
- [ElevenLabs](/nl/providers/elevenlabs)
- [fal](/nl/providers/fal)
- [Fireworks](/nl/providers/fireworks)
- [GitHub Copilot](/nl/providers/github-copilot)
- [GMI Cloud](/nl/providers/gmi)
- [Google (Gemini)](/nl/providers/google)
- [Gradium](/nl/providers/gradium)
- [Groq (LPU-inferentie)](/nl/providers/groq)
- [Hugging Face (Inferentie)](/nl/providers/huggingface)
- [inferrs (lokale modellen)](/nl/providers/inferrs)
- [Kilocode](/nl/providers/kilocode)
- [LiteLLM (uniforme gateway)](/nl/providers/litellm)
- [LM Studio (lokale modellen)](/nl/providers/lmstudio)
- [MiniMax](/nl/providers/minimax)
- [Mistral](/nl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
- [NVIDIA](/nl/providers/nvidia)
- [NovitaAI](/nl/providers/novita)
- [Ollama (cloud + lokale modellen)](/nl/providers/ollama)
- [Ollama Cloud](/nl/providers/ollama-cloud)
- [OpenAI (API + Codex)](/nl/providers/openai)
- [OpenCode](/nl/providers/opencode)
- [OpenCode Go](/nl/providers/opencode-go)
- [OpenRouter](/nl/providers/openrouter)
- [Perplexity (webzoekopdracht)](/nl/providers/perplexity-provider)
- [Qianfan](/nl/providers/qianfan)
- [Qwen Cloud](/nl/providers/qwen)
- [Qwen OAuth / Portal](/nl/providers/qwen-oauth)
- [Runway](/nl/providers/runway)
- [SenseAudio](/nl/providers/senseaudio)
- [SGLang (lokale modellen)](/nl/providers/sglang)
- [StepFun](/nl/providers/stepfun)
- [Synthetic](/nl/providers/synthetic)
- [Tencent Cloud (TokenHub)](/nl/providers/tencent)
- [Together AI](/nl/providers/together)
- [Venice (Venice AI, privacygericht)](/nl/providers/venice)
- [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
- [vLLM (lokale modellen)](/nl/providers/vllm)
- [Volcengine (Doubao)](/nl/providers/volcengine)
- [Vydra](/nl/providers/vydra)
- [xAI](/nl/providers/xai)
- [Xiaomi](/nl/providers/xiaomi)
- [Z.AI (GLM)](/nl/providers/zai)

## Gedeelde overzichtspagina's

- [Aanvullende gebundelde varianten](/nl/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy en Gemini CLI OAuth
- [Afbeeldingen genereren](/nl/tools/image-generation) - Gedeelde `image_generate`-tool, providerselectie en failover
- [Muziek genereren](/nl/tools/music-generation) - Gedeelde `music_generate`-tool, providerselectie en failover
- [Video genereren](/nl/tools/video-generation) - Gedeelde `video_generate`-tool, providerselectie en failover

## Transcriptieproviders

- [Deepgram (audiotranscriptie)](/nl/providers/deepgram)
- [ElevenLabs](/nl/providers/elevenlabs#speech-to-text)
- [Mistral](/nl/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/nl/providers/openai#speech-to-text)
- [SenseAudio](/nl/providers/senseaudio)
- [xAI](/nl/providers/xai#speech-to-text)

## Communitytools

- [Claude Max API Proxy](/nl/providers/claude-max-api-proxy) - Communityproxy voor Claude-abonnementsreferenties (controleer het beleid/de voorwaarden van Anthropic vóór gebruik)

Zie [Modelproviders](/nl/concepts/model-providers) voor de volledige providercatalogus (xAI, Groq, Mistral, enz.) en geavanceerde configuratie.

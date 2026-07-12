---
read_when:
    - U wilt een modelprovider kiezen
    - Je hebt een snel overzicht nodig van ondersteunde LLM-backends
summary: Modelproviders (LLM's) die door OpenClaw worden ondersteund
title: Providermap
x-i18n:
    generated_at: "2026-07-12T09:13:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b59843b53265500866e87ee8d888892dacd6045bdb9401a1e7ec08ad4f364090
    source_path: providers/index.md
    workflow: 16
---

OpenClaw kan veel LLM-providers gebruiken. Kies een provider, authenticeer en stel vervolgens het
standaardmodel in als `provider/model`.

Zoek je documentatie over chatkanalen (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/enz.)? Zie [Kanalen](/nl/channels).

## Snel aan de slag

1. Authenticeer bij de provider (meestal via `openclaw onboard`).
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
- [BytePlus (internationaal)](/nl/concepts/model-providers#byteplus-international)
- [Cerebras](/nl/providers/cerebras)
- [Chutes](/nl/providers/chutes)
- [ClawRouter (beheerde routering tussen meerdere providers)](/nl/providers/clawrouter)
- [Cloudflare AI Gateway](/nl/providers/cloudflare-ai-gateway)
- [Cohere](/nl/providers/cohere)
- [ComfyUI](/nl/providers/comfy)
- [DeepSeek](/nl/providers/deepseek)
- [ds4 (lokale DeepSeek V4)](/nl/providers/ds4)
- [ElevenLabs](/nl/providers/elevenlabs)
- [fal](/nl/providers/fal)
- [Featherless AI](/providers/featherless)
- [Fireworks](/nl/providers/fireworks)
- [GitHub Copilot](/nl/providers/github-copilot)
- [GMI Cloud](/nl/providers/gmi)
- [Google (Gemini)](/nl/providers/google)
- [Gradium](/nl/providers/gradium)
- [Groq (LPU-inferentie)](/nl/providers/groq)
- [Hugging Face (inferentie)](/nl/providers/huggingface)
- [inferrs (lokale modellen)](/nl/providers/inferrs)
- [Kilocode](/nl/providers/kilocode)
- [LiteLLM (uniforme Gateway)](/nl/providers/litellm)
- [LM Studio (lokale modellen)](/nl/providers/lmstudio)
- [LongCat](/nl/providers/longcat)
- [MiniMax](/nl/providers/minimax)
- [Mistral](/nl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/nl/providers/moonshot)
- [NovitaAI](/nl/providers/novita)
- [NVIDIA](/nl/providers/nvidia)
- [Ollama (cloud- en lokale modellen)](/nl/providers/ollama)
- [Ollama Cloud](/nl/providers/ollama-cloud)
- [OpenAI (API + Codex)](/nl/providers/openai)
- [OpenCode](/nl/providers/opencode)
- [OpenCode Go](/nl/providers/opencode-go)
- [OpenRouter](/nl/providers/openrouter)
- [Perplexity (zoeken op het web)](/nl/providers/perplexity-provider)
- [Qianfan](/nl/providers/qianfan)
- [Qwen Cloud](/nl/providers/qwen)
- [Qwen OAuth / Portal](/nl/providers/qwen-oauth)
- [Runway](/nl/providers/runway)
- [SenseAudio](/nl/providers/senseaudio)
- [SGLang (lokale modellen)](/nl/providers/sglang)
- [StepFun](/nl/providers/stepfun)
- [Synthetic](/nl/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/nl/providers/tencent)
- [Together AI](/nl/providers/together)
- [Venice (Venice AI, gericht op privacy)](/nl/providers/venice)
- [Vercel AI Gateway](/nl/providers/vercel-ai-gateway)
- [vLLM (lokale modellen)](/nl/providers/vllm)
- [Volcengine (Doubao)](/nl/providers/volcengine)
- [Vydra](/nl/providers/vydra)
- [xAI](/nl/providers/xai)
- [Xiaomi](/nl/providers/xiaomi)
- [Z.AI (GLM)](/nl/providers/zai)

## Gedeelde overzichtspagina's

- [Aanvullende providervarianten](/nl/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy en Gemini CLI OAuth
- [Afbeeldingen genereren](/nl/tools/image-generation) - Gedeeld hulpmiddel `image_generate`, providerselectie en failover
- [Muziek genereren](/nl/tools/music-generation) - Gedeeld hulpmiddel `music_generate`, providerselectie en failover
- [Video's genereren](/nl/tools/video-generation) - Gedeeld hulpmiddel `video_generate`, providerselectie en failover

## Transcriptieproviders

- [Deepgram (audiotranscriptie)](/nl/providers/deepgram)
- [ElevenLabs](/nl/providers/elevenlabs#speech-to-text)
- [Mistral](/nl/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/nl/providers/openai)
- [SenseAudio](/nl/providers/senseaudio)
- [xAI](/nl/providers/xai)

## Communityhulpmiddelen

- [Claude Max API Proxy](/nl/providers/claude-max-api-proxy) - Communityproxy voor Claude-abonnementsreferenties (controleer vóór gebruik het beleid en de voorwaarden van Anthropic)

Zie [Modelproviders](/nl/concepts/model-providers) voor de volledige providercatalogus (xAI, Groq, Mistral enz.) en geavanceerde configuratie.

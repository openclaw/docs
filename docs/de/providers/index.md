---
read_when:
    - Sie möchten einen Modell-Provider auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Provider-Verzeichnis
x-i18n:
    generated_at: "2026-07-04T03:43:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen Provider aus, authentifizieren Sie sich und legen Sie dann das Standardmodell als `provider/model` fest.

Suchen Sie Dokumentation zu Chat-Kanälen (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/usw.)? Siehe [Kanäle](/de/channels).

## Schnellstart

1. Authentifizieren Sie sich beim Provider (in der Regel über `openclaw onboard`).
2. Legen Sie das Standardmodell fest:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider-Dokumentation

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Amazon Bedrock Mantle](/de/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Arcee AI (Trinity-Modelle)](/de/providers/arcee)
- [Azure Speech](/de/providers/azure-speech)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Cerebras](/de/providers/cerebras)
- [Chutes](/de/providers/chutes)
- [ClawRouter (verwaltetes Multi-Provider-Routing)](/providers/clawrouter)
- [Cohere](/de/providers/cohere)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [ComfyUI](/de/providers/comfy)
- [DeepSeek](/de/providers/deepseek)
- [ds4 (lokales DeepSeek V4)](/de/providers/ds4)
- [ElevenLabs](/de/providers/elevenlabs)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GitHub Copilot](/de/providers/github-copilot)
- [GMI Cloud](/de/providers/gmi)
- [Google (Gemini)](/de/providers/google)
- [Gradium](/de/providers/gradium)
- [Groq (LPU-Inferenz)](/de/providers/groq)
- [Hugging Face (Inferenz)](/de/providers/huggingface)
- [inferrs (lokale Modelle)](/de/providers/inferrs)
- [Kilocode](/de/providers/kilocode)
- [LiteLLM (einheitlicher Gateway)](/de/providers/litellm)
- [LM Studio (lokale Modelle)](/de/providers/lmstudio)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [NVIDIA](/de/providers/nvidia)
- [NovitaAI](/de/providers/novita)
- [Ollama (Cloud + lokale Modelle)](/de/providers/ollama)
- [Ollama Cloud](/de/providers/ollama-cloud)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode](/de/providers/opencode)
- [OpenCode Go](/de/providers/opencode-go)
- [OpenRouter](/de/providers/openrouter)
- [Perplexity (Websuche)](/de/providers/perplexity-provider)
- [Qianfan](/de/providers/qianfan)
- [Qwen Cloud](/de/providers/qwen)
- [Qwen OAuth / Portal](/de/providers/qwen-oauth)
- [Runway](/de/providers/runway)
- [SenseAudio](/de/providers/senseaudio)
- [SGLang (lokale Modelle)](/de/providers/sglang)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Tencent Cloud (TokenHub)](/de/providers/tencent)
- [Together AI](/de/providers/together)
- [Venice (Venice AI, datenschutzorientiert)](/de/providers/venice)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [vLLM (lokale Modelle)](/de/providers/vllm)
- [Volcengine (Doubao)](/de/providers/volcengine)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
- [Xiaomi](/de/providers/xiaomi)
- [Z.AI (GLM)](/de/providers/zai)

## Gemeinsame Übersichtsseiten

- [Zusätzliche gebündelte Varianten](/de/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy und Gemini CLI OAuth
- [Bildgenerierung](/de/tools/image-generation) - Gemeinsames `image_generate`-Tool, Provider-Auswahl und Failover
- [Musikgenerierung](/de/tools/music-generation) - Gemeinsames `music_generate`-Tool, Provider-Auswahl und Failover
- [Videogenerierung](/de/tools/video-generation) - Gemeinsames `video_generate`-Tool, Provider-Auswahl und Failover

## Transkriptions-Provider

- [Deepgram (Audiotranskription)](/de/providers/deepgram)
- [ElevenLabs](/de/providers/elevenlabs#speech-to-text)
- [Mistral](/de/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/de/providers/openai#speech-to-text)
- [SenseAudio](/de/providers/senseaudio)
- [xAI](/de/providers/xai#speech-to-text)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Abonnement-Anmeldedaten (Anthropic-Richtlinie/-Bedingungen vor der Nutzung prüfen)

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und erweiterte Konfiguration finden Sie unter [Modell-Provider](/de/concepts/model-providers).

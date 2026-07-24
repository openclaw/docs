---
read_when:
    - Sie möchten einen Modell-Provider auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Provider-Verzeichnis
x-i18n:
    generated_at: "2026-07-24T04:06:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e98910f016e461dedcd06e40a2933631bbd6ac09ceebd340bab82f14805e06a6
    source_path: providers/index.md
    workflow: 16
---

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen Provider aus, authentifizieren Sie sich und legen Sie anschließend das
Standardmodell als `provider/model` fest.

Suchen Sie nach der Dokumentation für Chat-Kanäle (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/usw.)? Siehe [Kanäle](/de/channels).

## Schnellstart

1. Authentifizieren Sie sich beim Provider (üblicherweise über `openclaw onboard`).
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
- [Baseten (Inkling + Modell-APIs)](/providers/baseten)
- [BytePlus (international)](/de/concepts/model-providers#byteplus-international)
- [Cerebras](/de/providers/cerebras)
- [Chutes](/de/providers/chutes)
- [ClawRouter (verwaltetes Routing über mehrere Provider)](/de/providers/clawrouter)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [Cohere](/de/providers/cohere)
- [ComfyUI](/de/providers/comfy)
- [DeepSeek](/de/providers/deepseek)
- [ds4 (lokales DeepSeek V4)](/de/providers/ds4)
- [ElevenLabs](/de/providers/elevenlabs)
- [fal](/de/providers/fal)
- [Featherless AI](/de/providers/featherless)
- [Fireworks](/de/providers/fireworks)
- [GitHub Copilot](/de/providers/github-copilot)
- [GMI Cloud](/de/providers/gmi)
- [Google (Gemini)](/de/providers/google)
- [Gradium](/de/providers/gradium)
- [Groq (LPU-Inferenz)](/de/providers/groq)
- [Hugging Face (Inferenz)](/de/providers/huggingface)
- [inferrs (lokale Modelle)](/de/providers/inferrs)
- [Kilocode](/de/providers/kilocode)
- [LiteLLM (vereinheitlichtes Gateway)](/de/providers/litellm)
- [LM Studio (lokale Modelle)](/de/providers/lmstudio)
- [LongCat](/de/providers/longcat)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [NovitaAI](/de/providers/novita)
- [NVIDIA](/de/providers/nvidia)
- [Ollama (Cloud- und lokale Modelle)](/de/providers/ollama)
- [Ollama Cloud](/de/providers/ollama-cloud)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode](/de/providers/opencode)
- [OpenCode Go](/de/providers/opencode-go)
- [OpenRouter](/de/providers/openrouter)
- [Perplexity (Websuche)](/de/providers/perplexity-provider)
- [Qianfan](/de/providers/qianfan)
- [Qwen Cloud](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [SenseAudio](/de/providers/senseaudio)
- [SGLang (lokale Modelle)](/de/providers/sglang)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/de/providers/tencent)
- [Together AI](/de/providers/together)
- [Venice (Venice AI, mit Schwerpunkt auf Datenschutz)](/de/providers/venice)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [vLLM (lokale Modelle)](/de/providers/vllm)
- [Volcengine (Doubao)](/de/providers/volcengine)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
- [Xiaomi](/de/providers/xiaomi)
- [Z.AI (GLM)](/de/providers/zai)

## Gemeinsame Übersichtsseiten

- [Zusätzliche Provider-Varianten](/de/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy und Gemini CLI OAuth
- [Bildgenerierung](/de/tools/image-generation) - Gemeinsames `image_generate`-Tool, Provider-Auswahl und Failover
- [Musikgenerierung](/de/tools/music-generation) - Gemeinsames `music_generate`-Tool, Provider-Auswahl und Failover
- [Videogenerierung](/de/tools/video-generation) - Gemeinsames `video_generate`-Tool, Provider-Auswahl und Failover

## Transkriptions-Provider

- [Deepgram (Audiotranskription)](/de/providers/deepgram)
- [ElevenLabs](/de/providers/elevenlabs#speech-to-text)
- [Mistral](/de/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/de/providers/openai)
- [SenseAudio](/de/providers/senseaudio)
- [xAI](/de/providers/xai)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Abonnement-Anmeldedaten (prüfen Sie vor der Verwendung die Richtlinien/Nutzungsbedingungen von Anthropic)

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und Informationen zur erweiterten Konfiguration
finden Sie unter [Modell-Provider](/de/concepts/model-providers).

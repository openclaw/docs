---
read_when:
    - Sie möchten einen Modell-Provider auswählen.
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends.
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Provider-Verzeichnis
x-i18n:
    generated_at: "2026-04-23T06:34:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a62f8af86fa23f248163d1a23929c628f5bcc757366d0fdb12157f995f8024d
    source_path: providers/index.md
    workflow: 15
---

# Modell-Provider

OpenClaw kann viele LLM-Provider verwenden. Wählen Sie einen Provider, authentifizieren Sie sich und setzen Sie dann das
Standardmodell als `provider/model`.

Suchen Sie Dokumentation zu Chat-Kanälen (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.)? Siehe [Channels](/de/channels).

## Schnellstart

1. Mit dem Provider authentifizieren (normalerweise über `openclaw onboard`).
2. Das Standardmodell setzen:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider-Doku

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Amazon Bedrock Mantle](/de/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Arcee AI (Trinity-Modelle)](/de/providers/arcee)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [ComfyUI](/de/providers/comfy)
- [DeepSeek](/de/providers/deepseek)
- [ElevenLabs](/de/providers/elevenlabs)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GitHub Copilot](/de/providers/github-copilot)
- [GLM-Modelle](/de/providers/glm)
- [Google (Gemini)](/de/providers/google)
- [Groq (LPU-Inferenz)](/de/providers/groq)
- [Hugging Face (Inference)](/de/providers/huggingface)
- [inferrs (lokale Modelle)](/de/providers/inferrs)
- [Kilocode](/de/providers/kilocode)
- [LiteLLM (vereinheitlichtes Gateway)](/de/providers/litellm)
- [LM Studio (lokale Modelle)](/de/providers/lmstudio)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [NVIDIA](/de/providers/nvidia)
- [Ollama (Cloud + lokale Modelle)](/de/providers/ollama)
- [OpenAI (API + Codex)](/de/providers/openai)
- [OpenCode](/de/providers/opencode)
- [OpenCode Go](/de/providers/opencode-go)
- [OpenRouter](/de/providers/openrouter)
- [Perplexity (Websuche)](/de/providers/perplexity-provider)
- [Qianfan](/de/providers/qianfan)
- [Qwen Cloud](/de/providers/qwen)
- [Runway](/de/providers/runway)
- [SGLang (lokale Modelle)](/de/providers/sglang)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Together AI](/de/providers/together)
- [Venice (Venice AI, datenschutzorientiert)](/de/providers/venice)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [vLLM (lokale Modelle)](/de/providers/vllm)
- [Volcengine (Doubao)](/de/providers/volcengine)
- [Vydra](/de/providers/vydra)
- [xAI](/de/providers/xai)
- [Xiaomi](/de/providers/xiaomi)
- [Z.AI](/de/providers/zai)

## Gemeinsame Übersichtsseiten

- [Zusätzliche gebündelte Varianten](/de/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy und Gemini CLI OAuth
- [Bildgenerierung](/de/tools/image-generation) - Gemeinsames Tool `image_generate`, Providerauswahl und Failover
- [Musikgenerierung](/de/tools/music-generation) - Gemeinsames Tool `music_generate`, Providerauswahl und Failover
- [Videogenerierung](/de/tools/video-generation) - Gemeinsames Tool `video_generate`, Providerauswahl und Failover

## Transkriptions-Provider

- [Deepgram (Audiotranskription)](/de/providers/deepgram)
- [ElevenLabs](/de/providers/elevenlabs#speech-to-text)
- [Mistral](/de/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/de/providers/openai#speech-to-text)
- [xAI](/de/providers/xai#speech-to-text)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Subscription-Anmeldedaten (prüfen Sie vor der Verwendung die Anthropic-Richtlinie/Nutzungsbedingungen)

Für den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und erweiterte Konfiguration
siehe [Modell-Provider](/de/concepts/model-providers).

---
read_when:
    - Du möchtest einen Modell-Provider auswählen
    - Du brauchst einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Modell-Provider (LLMs)
title: Provider-Verzeichnis
x-i18n:
    generated_at: "2026-04-22T04:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d77e5da93d71c48ea97460c6be56fbbe8279d9240a8101e1b35fdafb657737e
    source_path: providers/index.md
    workflow: 15
---

# Modell-Provider

OpenClaw kann viele LLM-Provider verwenden. Wähle einen Provider, authentifiziere dich und setze dann das
Standardmodell als `provider/model`.

Suchst du Chat-Kanal-Dokumentation (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/etc.)? Siehe [Kanäle](/de/channels).

## Schnellstart

1. Beim Provider authentifizieren (normalerweise über `openclaw onboard`).
2. Das Standardmodell setzen:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider-Dokumentation

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Arcee AI (Trinity-Modelle)](/de/providers/arcee)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [ComfyUI](/de/providers/comfy)
- [DeepSeek](/de/providers/deepseek)
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
- [Ollama (Cloud- + lokale Modelle)](/de/providers/ollama)
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
- [Bildgenerierung](/de/tools/image-generation) - Gemeinsames `image_generate`-Tool, Provider-Auswahl und Failover
- [Musikgenerierung](/de/tools/music-generation) - Gemeinsames `music_generate`-Tool, Provider-Auswahl und Failover
- [Videogenerierung](/de/tools/video-generation) - Gemeinsames `video_generate`-Tool, Provider-Auswahl und Failover

## Transkriptions-Provider

- [Deepgram (Audiotranskription)](/de/providers/deepgram)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Subscription-Credentials (Anthropic-Richtlinien/-Bedingungen vor der Nutzung prüfen)

Für den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und erweiterte Konfiguration
siehe [Modell-Provider](/de/concepts/model-providers).

---
read_when:
    - Sie möchten einen Modellanbieter auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Modellanbieter (LLMs)
title: Provider-Verzeichnis
x-i18n:
    generated_at: "2026-04-06T03:11:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7271157a6ab5418672baff62bfd299572fd010f75aad529267095c6e55903882
    source_path: providers/index.md
    workflow: 15
---

# Modellanbieter

OpenClaw kann viele LLM-Anbieter verwenden. Wählen Sie einen Anbieter, authentifizieren Sie sich und setzen Sie dann das
Standardmodell als `provider/model`.

Suchen Sie nach Dokumentation zu Chat-Channels (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/usw.)? Siehe [Channels](/de/channels).

## Schnellstart

1. Mit dem Anbieter authentifizieren (normalerweise über `openclaw onboard`).
2. Das Standardmodell festlegen:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider-Dokumentation

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [DeepSeek](/de/providers/deepseek)
- [fal](/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GitHub Copilot](/de/providers/github-copilot)
- [GLM models](/de/providers/glm)
- [Google (Gemini)](/de/providers/google)
- [Groq (LPU-Inferenz)](/de/providers/groq)
- [Hugging Face (Inference)](/de/providers/huggingface)
- [Kilocode](/de/providers/kilocode)
- [LiteLLM (vereinheitlichtes Gateway)](/de/providers/litellm)
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
- [Runway](/providers/runway)
- [SGLang (lokale Modelle)](/de/providers/sglang)
- [StepFun](/de/providers/stepfun)
- [Synthetic](/de/providers/synthetic)
- [Together AI](/de/providers/together)
- [Venice (Venice AI, datenschutzorientiert)](/de/providers/venice)
- [Vercel AI Gateway](/de/providers/vercel-ai-gateway)
- [Vydra](/providers/vydra)
- [vLLM (lokale Modelle)](/de/providers/vllm)
- [Volcengine (Doubao)](/de/providers/volcengine)
- [xAI](/de/providers/xai)
- [Xiaomi](/de/providers/xiaomi)
- [Z.AI](/de/providers/zai)

## Gemeinsame Übersichtsseiten

- [Additional bundled variants](/de/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy und Gemini CLI OAuth
- [Bildgenerierung](/de/tools/image-generation) - Gemeinsames Tool `image_generate`, Provider-Auswahl und Failover
- [Musikgenerierung](/tools/music-generation) - Gemeinsames Tool `music_generate`, Provider-Auswahl und Failover
- [Videogenerierung](/tools/video-generation) - Gemeinsames Tool `video_generate`, Provider-Auswahl und Failover

## Anbieter für Transkription

- [Deepgram (Audiotranskription)](/de/providers/deepgram)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Subscription-Anmeldedaten (Anthropic-Richtlinien/-Bedingungen vor der Nutzung prüfen)

Den vollständigen Provider-Katalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration finden Sie unter [Modellanbieter](/de/concepts/model-providers).

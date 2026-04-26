---
read_when:
    - Sie möchten einen Modellanbieter auswählen
    - Sie benötigen einen schnellen Überblick über unterstützte LLM-Backends
summary: Von OpenClaw unterstützte Modellanbieter (LLMs)
title: Anbieterverzeichnis
x-i18n:
    generated_at: "2026-04-26T11:38:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# Modellanbieter

OpenClaw kann viele LLM-Anbieter verwenden. Wählen Sie einen Anbieter aus,
authentifizieren Sie sich und setzen Sie dann das Standardmodell als
`provider/model`.

Suchen Sie nach Dokumentation zu Chat-Kanälen (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/usw.)? Siehe [Kanäle](/de/channels).

## Schnellstart

1. Authentifizieren Sie sich beim Anbieter (normalerweise über `openclaw onboard`).
2. Legen Sie das Standardmodell fest:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Anbieter-Dokumentation

- [Alibaba Model Studio](/de/providers/alibaba)
- [Amazon Bedrock](/de/providers/bedrock)
- [Amazon Bedrock Mantle](/de/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/de/providers/anthropic)
- [Arcee AI (Trinity-Modelle)](/de/providers/arcee)
- [Azure Speech](/de/providers/azure-speech)
- [BytePlus (International)](/de/concepts/model-providers#byteplus-international)
- [Chutes](/de/providers/chutes)
- [Cloudflare AI Gateway](/de/providers/cloudflare-ai-gateway)
- [ComfyUI](/de/providers/comfy)
- [DeepSeek](/de/providers/deepseek)
- [ElevenLabs](/de/providers/elevenlabs)
- [fal](/de/providers/fal)
- [Fireworks](/de/providers/fireworks)
- [GitHub Copilot](/de/providers/github-copilot)
- [Gradium](/de/providers/gradium)
- [GLM-Modelle](/de/providers/glm)
- [Google (Gemini)](/de/providers/google)
- [Groq (LPU-Inferenz)](/de/providers/groq)
- [Hugging Face (Inferenz)](/de/providers/huggingface)
- [inferrs (lokale Modelle)](/de/providers/inferrs)
- [Kilocode](/de/providers/kilocode)
- [LiteLLM (einheitliches Gateway)](/de/providers/litellm)
- [LM Studio (lokale Modelle)](/de/providers/lmstudio)
- [MiniMax](/de/providers/minimax)
- [Mistral](/de/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/de/providers/moonshot)
- [NVIDIA](/de/providers/nvidia)
- [Ollama (Cloud- und lokale Modelle)](/de/providers/ollama)
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
- [Tencent Cloud (TokenHub)](/de/providers/tencent)
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
- [Bildgenerierung](/de/tools/image-generation) - Gemeinsames Tool `image_generate`, Anbieterauswahl und Failover
- [Musikgenerierung](/de/tools/music-generation) - Gemeinsames Tool `music_generate`, Anbieterauswahl und Failover
- [Videogenerierung](/de/tools/video-generation) - Gemeinsames Tool `video_generate`, Anbieterauswahl und Failover

## Transkriptionsanbieter

- [Deepgram (Audiotranskription)](/de/providers/deepgram)
- [ElevenLabs](/de/providers/elevenlabs#speech-to-text)
- [Mistral](/de/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/de/providers/openai#speech-to-text)
- [SenseAudio](/de/providers/senseaudio)
- [xAI](/de/providers/xai#speech-to-text)

## Community-Tools

- [Claude Max API Proxy](/de/providers/claude-max-api-proxy) - Community-Proxy für Claude-Abonnement-Zugangsdaten (prüfen Sie vor der Nutzung die Anthropic-Richtlinien/-Bedingungen)

Für den vollständigen Anbieterkatalog (xAI, Groq, Mistral usw.) und die erweiterte Konfiguration
siehe [Modellanbieter](/de/concepts/model-providers).

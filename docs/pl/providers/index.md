---
read_when:
    - Chcesz wybrać providera modeli
    - Potrzebujesz szybkiego przeglądu obsługiwanych backendów LLM
summary: Providerzy modeli (LLM-y) obsługiwani przez OpenClaw
title: Katalog providerów
x-i18n:
    generated_at: "2026-04-07T09:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d9ace35fd9452a4fb510fd980d251b6e51480e4647f051020bee2f1f2222e1
    source_path: providers/index.md
    workflow: 15
---

# Providerzy modeli

OpenClaw może korzystać z wielu providerów LLM. Wybierz providera, uwierzytelnij się, a następnie ustaw
model domyślny jako `provider/model`.

Szukasz dokumentacji kanałów czatu (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/itd.)? Zobacz [Channels](/pl/channels).

## Szybki start

1. Uwierzytelnij się u providera (zwykle przez `openclaw onboard`).
2. Ustaw model domyślny:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentacja providerów

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [Arcee AI (modele Trinity)](/pl/providers/arcee)
- [BytePlus (międzynarodowy)](/pl/concepts/model-providers#byteplus-international)
- [Chutes](/pl/providers/chutes)
- [ComfyUI](/pl/providers/comfy)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [DeepSeek](/pl/providers/deepseek)
- [fal](/pl/providers/fal)
- [Fireworks](/pl/providers/fireworks)
- [GitHub Copilot](/pl/providers/github-copilot)
- [Modele GLM](/pl/providers/glm)
- [Google (Gemini)](/pl/providers/google)
- [Groq (wnioskowanie LPU)](/pl/providers/groq)
- [Hugging Face (Inference)](/pl/providers/huggingface)
- [Kilocode](/pl/providers/kilocode)
- [LiteLLM (ujednolicony gateway)](/pl/providers/litellm)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [NVIDIA](/pl/providers/nvidia)
- [Ollama (modele chmurowe + lokalne)](/pl/providers/ollama)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode](/pl/providers/opencode)
- [OpenCode Go](/pl/providers/opencode-go)
- [OpenRouter](/pl/providers/openrouter)
- [Perplexity (wyszukiwanie w sieci)](/pl/providers/perplexity-provider)
- [Qianfan](/pl/providers/qianfan)
- [Qwen Cloud](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [SGLang (modele lokalne)](/pl/providers/sglang)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Together AI](/pl/providers/together)
- [Venice (Venice AI, z naciskiem na prywatność)](/pl/providers/venice)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [Vydra](/pl/providers/vydra)
- [vLLM (modele lokalne)](/pl/providers/vllm)
- [Volcengine (Doubao)](/pl/providers/volcengine)
- [xAI](/pl/providers/xai)
- [Xiaomi](/pl/providers/xiaomi)
- [Z.AI](/pl/providers/zai)

## Wspólne strony przeglądowe

- [Dodatkowe dołączone warianty](/pl/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy i Gemini CLI OAuth
- [Generowanie obrazów](/pl/tools/image-generation) - Wspólne narzędzie `image_generate`, wybór providera i failover
- [Generowanie muzyki](/pl/tools/music-generation) - Wspólne narzędzie `music_generate`, wybór providera i failover
- [Generowanie wideo](/pl/tools/video-generation) - Wspólne narzędzie `video_generate`, wybór providera i failover

## Providerzy transkrypcji

- [Deepgram (transkrypcja audio)](/pl/providers/deepgram)

## Narzędzia społeczności

- [Claude Max API Proxy](/pl/providers/claude-max-api-proxy) - Proxy społecznościowe dla poświadczeń subskrypcji Claude (przed użyciem zweryfikuj zasady/warunki Anthropic)

Pełny katalog providerów (xAI, Groq, Mistral itd.) oraz zaawansowaną konfigurację znajdziesz w [Model providers](/pl/concepts/model-providers).

---
read_when:
    - Chcesz wybrać dostawcę modeli
    - Potrzebujesz szybkiego przeglądu obsługiwanych backendów LLM
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Katalog dostawców
x-i18n:
    generated_at: "2026-04-05T14:03:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Dostawcy modeli

OpenClaw może używać wielu dostawców LLM. Wybierz dostawcę, uwierzytelnij się, a następnie ustaw
domyślny model jako `provider/model`.

Szukasz dokumentacji kanałów czatu (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/itd.)? Zobacz [Kanały](/pl/channels).

## Szybki start

1. Uwierzytelnij się u dostawcy (zwykle przez `openclaw onboard`).
2. Ustaw domyślny model:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentacja dostawców

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (międzynarodowy)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [Modele GLM](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (wnioskowanie LPU)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (ujednolicony gateway)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (modele w chmurze + lokalne)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (web search)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (szczegóły endpointu; kanoniczne `qwen-*`, starsze `modelstudio-*`)](/providers/qwen_modelstudio)
- [SGLang (modele lokalne)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, z naciskiem na prywatność)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (modele lokalne)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Wspólne strony przeglądowe

- [Dodatkowe bundled warianty](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy i Gemini CLI OAuth

## Dostawcy transkrypcji

- [Deepgram (transkrypcja audio)](/providers/deepgram)

## Narzędzia społeczności

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Społecznościowe proxy dla poświadczeń subskrypcji Claude (przed użyciem zweryfikuj zasady/regulamin Anthropic)

Pełny katalog dostawców (xAI, Groq, Mistral itd.) i zaawansowaną konfigurację znajdziesz w [Dostawcach modeli](/concepts/model-providers).

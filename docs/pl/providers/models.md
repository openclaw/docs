---
read_when:
    - Chcesz wybrać dostawcę modelu
    - Potrzebujesz szybkich przykładów konfiguracji uwierzytelniania LLM + wyboru modelu
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Szybki start z dostawcą modeli
x-i18n:
    generated_at: "2026-05-06T18:00:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e95d37f3e332a9b2eb58a15dc356ad02b4cbf409926adb3faf1923825219887
    source_path: providers/models.md
    workflow: 16
---

OpenClaw może używać wielu dostawców LLM. Wybierz jednego, uwierzytelnij się, a następnie ustaw domyślny
model jako `provider/model`.

## Szybki start (dwa kroki)

1. Uwierzytelnij się u dostawcy (zwykle przez `openclaw onboard`).
2. Ustaw domyślny model:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Obsługiwani dostawcy (zestaw startowy)

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [BytePlus (International)](/pl/concepts/model-providers#byteplus-international)
- [Chutes](/pl/providers/chutes)
- [ComfyUI](/pl/providers/comfy)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [DeepInfra](/pl/providers/deepinfra)
- [fal](/pl/providers/fal)
- [Fireworks](/pl/providers/fireworks)
- [Modele GLM](/pl/providers/glm)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode (Zen + Go)](/pl/providers/opencode)
- [OpenRouter](/pl/providers/openrouter)
- [Qianfan](/pl/providers/qianfan)
- [Qwen](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/pl/providers/venice)
- [xAI](/pl/providers/xai)
- [Z.AI](/pl/providers/zai)

## Dodatkowe dołączone warianty dostawców

- `anthropic-vertex` - niejawna obsługa Anthropic w Google Vertex, gdy dostępne są dane uwierzytelniające Vertex; bez oddzielnego wyboru uwierzytelniania podczas onboardingu
- `copilot-proxy` - lokalny pomost VS Code Copilot Proxy; użyj `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - nieoficjalny przepływ OAuth Gemini CLI; wymaga lokalnej instalacji `gemini` (`brew install gemini-cli` lub `npm install -g @google/gemini-cli`); domyślny model `google-gemini-cli/gemini-3-flash-preview`; użyj `openclaw onboard --auth-choice google-gemini-cli` lub `openclaw models auth login --provider google-gemini-cli --set-default`

Pełny katalog dostawców (xAI, Groq, Mistral itd.) oraz zaawansowaną konfigurację
znajdziesz w [Dostawcy modeli](/pl/concepts/model-providers).

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
- [CLI modeli](/pl/cli/models)

---
read_when:
    - Chcesz wybrać dostawcę modeli
    - Chcesz szybkich przykładów konfiguracji uwierzytelniania LLM + wyboru modelu
summary: Dostawcy modeli (LLM-y) obsługiwani przez OpenClaw
title: Skrócony przewodnik po dostawcach modeli
x-i18n:
    generated_at: "2026-04-24T09:28:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b824a664e0e7a7a5b0ea640ea7329ea3d1e3d12b85d9310231c76014b2ae01cc
    source_path: providers/models.md
    workflow: 15
---

# Dostawcy modeli

OpenClaw może używać wielu dostawców LLM. Wybierz jednego, uwierzytelnij się, a następnie ustaw model domyślny
jako `provider/model`.

## Szybki start (dwa kroki)

1. Uwierzytelnij się u dostawcy (zwykle przez `openclaw onboard`).
2. Ustaw model domyślny:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Obsługiwani dostawcy (zestaw startowy)

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [BytePlus (międzynarodowy)](/pl/concepts/model-providers#byteplus-international)
- [Chutes](/pl/providers/chutes)
- [ComfyUI](/pl/providers/comfy)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
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

## Dodatkowe warianty dołączonych dostawców

- `anthropic-vertex` — niejawna obsługa Anthropic w Google Vertex, gdy poświadczenia Vertex są dostępne; bez osobnego wyboru uwierzytelniania w onboardingu
- `copilot-proxy` — lokalny most VS Code Copilot Proxy; użyj `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` — nieoficjalny przepływ OAuth Gemini CLI; wymaga lokalnej instalacji `gemini` (`brew install gemini-cli` lub `npm install -g @google/gemini-cli`); model domyślny `google-gemini-cli/gemini-3-flash-preview`; użyj `openclaw onboard --auth-choice google-gemini-cli` lub `openclaw models auth login --provider google-gemini-cli --set-default`

Pełny katalog dostawców (xAI, Groq, Mistral itd.) i konfigurację zaawansowaną
znajdziesz w sekcji [Dostawcy modeli](/pl/concepts/model-providers).

## Powiązane

- [Wybór modelu](/pl/concepts/model-providers)
- [Failover modeli](/pl/concepts/model-failover)
- [CLI modeli](/pl/cli/models)

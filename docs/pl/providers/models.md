---
read_when:
    - Chcesz wybrać dostawcę modelu
    - Chcesz szybkie przykłady konfiguracji auth LLM + wyboru modelu
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Szybki start z dostawcami modeli
x-i18n:
    generated_at: "2026-04-05T14:03:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
    source_path: providers/models.md
    workflow: 15
---

# Dostawcy modeli

OpenClaw może używać wielu dostawców LLM. Wybierz jednego, uwierzytelnij się, a potem ustaw model domyślny
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

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (International)](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [GLM models](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## Dodatkowe warianty dołączonych dostawców

- `anthropic-vertex` - niejawna obsługa Anthropic na Google Vertex, gdy dostępne są poświadczenia Vertex; bez osobnego wyboru auth w onboardingu
- `copilot-proxy` - lokalny most VS Code Copilot Proxy; użyj `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - nieoficjalny przepływ OAuth Gemini CLI; wymaga lokalnej instalacji `gemini` (`brew install gemini-cli` albo `npm install -g @google/gemini-cli`); domyślny model `google-gemini-cli/gemini-3.1-pro-preview`; użyj `openclaw onboard --auth-choice google-gemini-cli` albo `openclaw models auth login --provider google-gemini-cli --set-default`

Pełny katalog dostawców (xAI, Groq, Mistral itd.) oraz zaawansowaną konfigurację znajdziesz w [Model providers](/concepts/model-providers).

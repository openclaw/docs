---
read_when:
    - Chcesz wybrać providera modeli
    - Chcesz poznać szybkie przykłady konfiguracji uwierzytelniania LLM + wyboru modelu
summary: Providerzy modeli (LLM-y) obsługiwani przez OpenClaw
title: Szybki start z providerami modeli
x-i18n:
    generated_at: "2026-04-07T09:49:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59ee4c2f993fe0ae05fe34f52bc6f3e0fc9a76b10760f56b20ad251e25ee9f20
    source_path: providers/models.md
    workflow: 15
---

# Providerzy modeli

OpenClaw może korzystać z wielu providerów LLM. Wybierz jednego, uwierzytelnij się, a następnie ustaw model
domyślny jako `provider/model`.

## Szybki start (dwa kroki)

1. Uwierzytelnij się u providera (zwykle przez `openclaw onboard`).
2. Ustaw model domyślny:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Obsługiwani providerzy (zestaw startowy)

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [Amazon Bedrock](/pl/providers/bedrock)
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

## Dodatkowe dołączone warianty providerów

- `anthropic-vertex` - niejawna obsługa Anthropic w Google Vertex, gdy dostępne są poświadczenia Vertex; bez osobnego wyboru uwierzytelniania w onboardingu
- `copilot-proxy` - lokalny most VS Code Copilot Proxy; użyj `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - nieoficjalny przepływ OAuth Gemini CLI; wymaga lokalnej instalacji `gemini` (`brew install gemini-cli` lub `npm install -g @google/gemini-cli`); model domyślny `google-gemini-cli/gemini-3-flash-preview`; użyj `openclaw onboard --auth-choice google-gemini-cli` lub `openclaw models auth login --provider google-gemini-cli --set-default`

Pełny katalog providerów (xAI, Groq, Mistral itd.) oraz zaawansowaną konfigurację znajdziesz w [Model providers](/pl/concepts/model-providers).

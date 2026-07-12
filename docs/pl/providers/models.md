---
read_when:
    - Chcesz wybrać dostawcę modelu
    - Potrzebujesz krótkich przykładów konfiguracji uwierzytelniania LLM i wyboru modelu
summary: Dostawcy modeli (LLM) obsługiwani przez OpenClaw
title: Szybki start z dostawcą modelu
x-i18n:
    generated_at: "2026-07-12T15:30:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4f9add879b41fdb0b54edbbff2ea982957cd4f3bc5d438c43f8a8403a048338
    source_path: providers/models.md
    workflow: 16
---

Wybierz dostawcę, uwierzytelnij się, a następnie ustaw domyślny model w formacie `provider/model`.

## Szybki start (dwa kroki)

1. Uwierzytelnij się u dostawcy (zwykle za pomocą `openclaw onboard`).
2. Ustaw domyślny model:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Obsługiwani dostawcy (zestaw początkowy)

- [Alibaba Model Studio](/pl/providers/alibaba)
- [Amazon Bedrock](/pl/providers/bedrock)
- [Anthropic (API + Claude CLI)](/pl/providers/anthropic)
- [BytePlus (wersja międzynarodowa)](/pl/concepts/model-providers#byteplus-international)
- [Chutes](/pl/providers/chutes)
- [Cloudflare AI Gateway](/pl/providers/cloudflare-ai-gateway)
- [Cohere](/pl/providers/cohere)
- [ComfyUI](/pl/providers/comfy)
- [DeepInfra](/pl/providers/deepinfra)
- [fal](/pl/providers/fal)
- [Fireworks](/pl/providers/fireworks)
- [MiniMax](/pl/providers/minimax)
- [Mistral](/pl/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/pl/providers/moonshot)
- [NovitaAI](/pl/providers/novita)
- [OpenAI (API + Codex)](/pl/providers/openai)
- [OpenCode (Zen + Go)](/pl/providers/opencode)
- [OpenRouter](/pl/providers/openrouter)
- [Qianfan](/pl/providers/qianfan)
- [Qwen](/pl/providers/qwen)
- [Runway](/pl/providers/runway)
- [StepFun](/pl/providers/stepfun)
- [Synthetic](/pl/providers/synthetic)
- [Venice (Venice AI)](/pl/providers/venice)
- [Vercel AI Gateway](/pl/providers/vercel-ai-gateway)
- [xAI](/pl/providers/xai)
- [Z.AI (GLM)](/pl/providers/zai)

Pełny katalog dostawców i informacje o konfiguracji zaawansowanej znajdziesz w sekcjach
[Katalog dostawców](/pl/providers/index) i [Dostawcy modeli](/pl/concepts/model-providers).

## Dodatkowe warianty dostawców

- `anthropic-vertex` — zainstaluj `@openclaw/anthropic-vertex-provider`, aby korzystać z niejawnej obsługi Anthropic w Google Vertex, gdy dostępne są dane uwierzytelniające Vertex; nie wymaga osobnego wyboru metody uwierzytelniania podczas konfiguracji
- `copilot-proxy` — lokalny most VS Code Copilot Proxy; użyj `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` — nieoficjalny przepływ OAuth Gemini CLI; wymaga lokalnej instalacji `gemini` (`brew install gemini-cli` lub `npm install -g @google/gemini-cli`); domyślny model to `google-gemini-cli/gemini-3-flash-preview`; użyj `openclaw onboard --auth-choice google-gemini-cli` lub `openclaw models auth login --provider google-gemini-cli --set-default`

## Powiązane materiały

- [Katalog dostawców](/pl/providers/index)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
- [CLI modeli](/pl/cli/models)

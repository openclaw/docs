---
read_when:
    - Chcesz używać modeli Xiaomi MiMo w OpenClaw
    - Potrzebujesz konfiguracji XIAOMI_API_KEY
summary: Używaj modeli Xiaomi MiMo z OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-05T14:04:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2533fa99b29070e26e0e1fbde924e1291c89b1fbc2537451bcc0eb677ea6949
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo to platforma API dla modeli **MiMo**. OpenClaw używa zgodnego z OpenAI
endpointu Xiaomi z uwierzytelnianiem kluczem API. Utwórz swój klucz API w
[konsoli Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys), a następnie skonfiguruj
dołączonego dostawcę `xiaomi` za pomocą tego klucza.

## Wbudowany katalog

- Base URL: `https://api.xiaomimimo.com/v1`
- API: `openai-completions`
- Uwierzytelnianie: `Bearer $XIAOMI_API_KEY`

| Model ref              | Wejście     | Kontekst  | Maks. wyjście | Uwagi                         |
| ---------------------- | ----------- | --------- | ------------- | ----------------------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192         | Model domyślny                |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000        | Z włączonym reasoning         |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000        | Multimodalny z włączonym reasoning |

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice xiaomi-api-key
# lub nieinteraktywnie
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## Fragment konfiguracji

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## Uwagi

- Domyślny model ref: `xiaomi/mimo-v2-flash`.
- Dodatkowe wbudowane modele: `xiaomi/mimo-v2-pro`, `xiaomi/mimo-v2-omni`.
- Dostawca jest wstrzykiwany automatycznie, gdy ustawiono `XIAOMI_API_KEY` (lub istnieje profil uwierzytelniania).
- Zobacz [/concepts/model-providers](/pl/concepts/model-providers), aby poznać zasady dotyczące dostawców.

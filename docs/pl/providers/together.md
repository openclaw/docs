---
read_when:
    - Chcesz używać Together AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania CLI
summary: Konfiguracja Together AI (uwierzytelnianie + wybór modelu)
title: Together AI
x-i18n:
    generated_at: "2026-04-05T14:04:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22aacbaadf860ce8245bba921dcc5ede9da8fd6fa1bc3cc912551aecc1ba0d71
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) zapewnia dostęp do czołowych modeli open source, w tym Llama, DeepSeek, Kimi i innych, przez ujednolicone API.

- Dostawca: `together`
- Uwierzytelnianie: `TOGETHER_API_KEY`
- API: zgodne z OpenAI
- Base URL: `https://api.together.xyz/v1`

## Szybki start

1. Ustaw klucz API (zalecane: zapisz go dla Gateway):

```bash
openclaw onboard --auth-choice together-api-key
```

2. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

Spowoduje to ustawienie `together/moonshotai/Kimi-K2.5` jako modelu domyślnego.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `TOGETHER_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`).

## Wbudowany katalog

OpenClaw obecnie dostarcza ten dołączony katalog Together:

| Model ref                                                    | Nazwa                                  | Wejście     | Kontekst   | Uwagi                           |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | ------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | text, image | 262,144    | Model domyślny; thinking włączone |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | text        | 202,752    | Model tekstowy ogólnego przeznaczenia |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | text        | 131,072    | Szybki model instruktażowy      |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | text, image | 10,000,000 | Multimodalny                    |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | text, image | 20,000,000 | Multimodalny                    |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | text        | 131,072    | Ogólny model tekstowy           |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | text        | 131,072    | Model reasoning                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | text        | 262,144    | Drugorzędny model tekstowy Kimi |

Preset onboardingu ustawia `together/moonshotai/Kimi-K2.5` jako model domyślny.

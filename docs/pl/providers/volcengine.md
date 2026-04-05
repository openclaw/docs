---
read_when:
    - Chcesz używać Volcano Engine lub modeli Doubao z OpenClaw
    - Potrzebujesz konfiguracji klucza API Volcengine
summary: Konfiguracja Volcano Engine (modele Doubao, endpointy ogólne i do kodowania)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-05T14:04:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85d9e737e906cd705fb31479d6b78d92b68c9218795ea9667516c1571dcaaf3a
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Provider Volcengine zapewnia dostęp do modeli Doubao i modeli innych firm
hostowanych w Volcano Engine, z oddzielnymi endpointami dla ogólnych
obciążeń i zadań związanych z kodowaniem.

- Providery: `volcengine` (ogólny) + `volcengine-plan` (kodowanie)
- Uwierzytelnianie: `VOLCANO_ENGINE_API_KEY`
- API: zgodne z OpenAI

## Szybki start

1. Ustaw klucz API:

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Providery i endpointy

| Provider          | Endpoint                                  | Przypadek użycia       |
| ----------------- | ----------------------------------------- | ---------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modele ogólne          |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modele do kodowania    |

Oba providery są konfigurowane za pomocą jednego klucza API. Konfiguracja rejestruje oba
automatycznie.

## Dostępne modele

Provider ogólny (`volcengine`):

| Model ref                                    | Nazwa                           | Wejście     | Kontekst |
| -------------------------------------------- | ------------------------------- | ----------- | -------- |
| `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000  |
| `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000  |
| `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000  |
| `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000  |
| `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000  |

Provider do kodowania (`volcengine-plan`):

| Model ref                                         | Nazwa                    | Wejście | Kontekst |
| ------------------------------------------------- | ------------------------ | ------- | -------- |
| `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text    | 256,000  |
| `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text    | 256,000  |
| `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text    | 200,000  |
| `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text    | 256,000  |
| `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text    | 256,000  |
| `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text    | 256,000  |

`openclaw onboard --auth-choice volcengine-api-key` obecnie ustawia
`volcengine-plan/ark-code-latest` jako model domyślny, a jednocześnie rejestruje
ogólny katalog `volcengine`.

Podczas onboardingu/konfigurowania wyboru modelu opcja uwierzytelniania Volcengine preferuje
zarówno wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie
zostały jeszcze załadowane, OpenClaw przechodzi do niefiltrowanego katalogu zamiast wyświetlać
pusty selektor ograniczony do providera.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że
`VOLCANO_ENGINE_API_KEY` jest dostępny dla tego procesu (na przykład w
`~/.openclaw/.env` lub przez `env.shellEnv`).
